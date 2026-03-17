import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getReport, updateReport, deleteReport, bulkUpsertResults } from '../api/reports';
import { getAnalytes } from '../api/analytes';
import type { ReportDetail, Analyte } from '../types';

export default function ReportDetail({ profileId }: { profileId: number }) {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [analytes, setAnalytes] = useState<Analyte[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({
    takenAt: '',
    labName: '',
    comment: '',
  });
  const [results, setResults] = useState<
    { analyte_id: number; value: number; unit: string; ref_low: number | null; ref_high: number | null; raw_name: string }[]
  >([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadData();
  }, [reportId]);

  async function loadData() {
    if (!reportId) return;
    setLoading(true);
    try {
      const [reportData, analytesData] = await Promise.all([
        getReport(parseInt(reportId)),
        getAnalytes(),
      ]);
      setReport(reportData);
      setAnalytes(analytesData);
      setEditData({
        takenAt: reportData.taken_at,
        labName: reportData.lab_name || '',
        comment: reportData.comment || '',
      });

      const formattedResults = reportData.results.map(r => ({
        analyte_id: r.analyte_id,
        value: Number(r.value),
        unit: r.unit || '',
        ref_low: r.ref_low !== null ? Number(r.ref_low) : null,
        ref_high: r.ref_high !== null ? Number(r.ref_high) : null,
        raw_name: r.raw_name || '',
      }));
      setResults(formattedResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!reportId) return;

    setSaving(true);
    try {
      await updateReport(
        parseInt(reportId),
        editData.takenAt,
        editData.labName || undefined,
        editData.comment || undefined
      );
      setEditing(false);
      setSuccess('Отчёт обновлён');
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveResults() {
    if (!reportId) return;

    setSaving(true);
    try {
      await bulkUpsertResults(parseInt(reportId), results.map(r => ({
        analyte_id: r.analyte_id,
        value: r.value,
        unit: r.unit || undefined,
        ref_low: r.ref_low ?? undefined,
        ref_high: r.ref_high ?? undefined,
        raw_name: r.raw_name || undefined,
      })));
      setSuccess('Результаты сохранены');
      setEditing(false);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения результатов');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!reportId) return;

    setDeleting(true);
    try {
      await deleteReport(parseInt(reportId));
      navigate(`/profiles/${profileId}/reports`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка удаления');
      setDeleting(false);
    }
  }

  function addResultRow() {
    setResults([...results, {
      analyte_id: analytes[0]?.id || 0,
      value: 0,
      unit: '',
      ref_low: null,
      ref_high: null,
      raw_name: '',
    }]);
  }

  function updateResultRow(index: number, field: string, value: any) {
    const newResults = [...results];
    newResults[index] = { ...newResults[index], [field]: value };
    setResults(newResults);
  }

  function removeResultRow(index: number) {
    setResults(results.filter((_, i) => i !== index));
  }

  if (loading) {
    return (
      <div className="loading-with-spinner">
        <span className="spinner-large"></span>
        <p>Загрузка отчёта...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="alert alert-error">
        <span className="alert-icon">⛔</span>
        <span>Отчёт не найден</span>
      </div>
    );
  }

  return (
    <div className="report-detail-page">
      <div className="page-header">
        <h1>
          <Link to={`/profiles/${profileId}/reports`}>← Назад</Link>
        </h1>
        <h2>Отчёт от {new Date(report.taken_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}</h2>
        <div className="button-group">
          <button onClick={() => setEditing(!editing)} className="button-secondary">
            {editing ? '✕ Отмена' : '✏️ Редактировать'}
          </button>
          <button onClick={handleDelete} className="button-danger" disabled={deleting}>
            {deleting ? '🗑️ Удаление...' : '🗑️ Удалить'}
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⛔</span>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <span className="alert-icon">✓</span>
          <span>{success}</span>
        </div>
      )}

      <div className="card report-info-card">
        <div className="card-header">
          <div className="card-icon">📋</div>
          <div>
            <h2>Информация</h2>
            <p className="card-subtitle">Данные о сдаче анализов</p>
          </div>
        </div>
        {editing ? (
          <form onSubmit={handleSaveEdit} className="edit-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="editTakenAt">Дата сдачи *</label>
                <input
                  id="editTakenAt"
                  type="date"
                  value={editData.takenAt}
                  onChange={e => setEditData({ ...editData, takenAt: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="editLabName">Лаборатория</label>
                <input
                  id="editLabName"
                  type="text"
                  value={editData.labName}
                  onChange={e => setEditData({ ...editData, labName: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label htmlFor="editComment">Комментарий</label>
                <input
                  id="editComment"
                  type="text"
                  value={editData.comment}
                  onChange={e => setEditData({ ...editData, comment: e.target.value })}
                />
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" disabled={saving} className="button-primary">
                {saving ? (
                  <>
                    <span className="spinner"></span>
                    Сохранение...
                  </>
                ) : (
                  <>
                    ✓ Сохранить
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">📅 Дата:</span>
              <span className="info-value">{new Date(report.taken_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
            <div className="info-item">
              <span className="info-label">🏥 Лаборатория:</span>
              <span className="info-value">{report.lab_name || '—'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">💬 Комментарий:</span>
              <span className="info-value">{report.comment || '—'}</span>
            </div>
          </div>
        )}
      </div>

      <div className="card report-results-card">
        <div className="card-header">
          <div className="card-icon">📊</div>
          <div>
            <h2>Результаты</h2>
            <p className="card-subtitle">
              {report.results.length} {report.results.length === 1 ? 'показатель' : report.results.length < 5 ? 'показателя' : 'показателей'}
            </p>
          </div>
        </div>

        {editing && (
          <div className="form-actions form-actions-start">
            <button onClick={addResultRow} className="button-secondary">
              ➕ Добавить показатель
            </button>
            <button onClick={handleSaveResults} disabled={saving || results.length === 0} className="button-primary">
              {saving ? (
                <>
                  <span className="spinner"></span>
                  Сохранение...
                </>
              ) : (
                <>
                  ✓ Сохранить результаты
                </>
              )}
            </button>
          </div>
        )}

        {editing ? (
          <div className="results-editor">
            <div className="table-responsive">
              <table className="table results-edit-table">
                <thead>
                  <tr>
                    <th>Показатель</th>
                    <th>Значение</th>
                    <th>Ед.</th>
                    <th>Реф. мин</th>
                    <th>Реф. макс</th>
                    <th>Название</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result, index) => (
                    <tr key={index}>
                      <td>
                        <select
                          value={result.analyte_id}
                          onChange={e => updateResultRow(index, 'analyte_id', parseInt(e.target.value))}
                          className="input-select"
                        >
                          {analytes.map(a => (
                            <option key={a.id} value={a.id}>{a.display_name_ru}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          value={result.value}
                          onChange={e => updateResultRow(index, 'value', parseFloat(e.target.value) || 0)}
                          className="input-sm input-value"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={result.unit}
                          onChange={e => updateResultRow(index, 'unit', e.target.value)}
                          className="input-sm input-unit"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          value={result.ref_low ?? ''}
                          onChange={e => updateResultRow(index, 'ref_low', e.target.value ? parseFloat(e.target.value) : null)}
                          placeholder="-"
                          className="input-sm input-ref"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          value={result.ref_high ?? ''}
                          onChange={e => updateResultRow(index, 'ref_high', e.target.value ? parseFloat(e.target.value) : null)}
                          placeholder="-"
                          className="input-sm input-ref"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={result.raw_name}
                          onChange={e => updateResultRow(index, 'raw_name', e.target.value)}
                          placeholder="Как в бланке"
                          className="input-sm"
                        />
                      </td>
                      <td>
                        <button onClick={() => removeResultRow(index)} className="button-danger button-icon" title="Удалить строку">
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : report.results.length === 0 ? (
          <div className="empty-state-card">
            <div className="empty-icon">📄</div>
            <h3>Нет результатов</h3>
            <p className="empty-message">
              Нажмите "Редактировать" для добавления показателей
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table results-view-table">
              <thead>
                <tr>
                  <th>Показатель</th>
                  <th>Значение</th>
                  <th>Ед.</th>
                  <th>Референс</th>
                  <th>Статус</th>
                  <th>Название</th>
                </tr>
              </thead>
              <tbody>
                {report.results.map(result => (
                  <tr key={result.id}>
                    <td className="analyte-name-cell">
                      {result.analyte?.display_name_ru || '—'}
                    </td>
                    <td className="value-cell">
                      <strong>{Number(result.value).toFixed(2)}</strong>
                    </td>
                    <td className="unit-cell">
                      <span className="unit-badge">{result.unit || '—'}</span>
                    </td>
                    <td className="ref-cell">
                      {result.ref_low !== null && result.ref_high !== null
                        ? `${Number(result.ref_low).toFixed(2)} - ${Number(result.ref_high).toFixed(2)}`
                        : '—'}
                    </td>
                    <td className="status-cell">
                      {result.flag && (
                        <span className={`badge badge-${result.flag.toLowerCase()}`}>
                          {result.flag === 'LOW' && '⬇️'}
                          {result.flag === 'HIGH' && '⬆️'}
                          {result.flag === 'NORMAL' && '✓'}
                          {' '}{result.flag}
                        </span>
                      )}
                    </td>
                    <td className="raw-name-cell">
                      {result.raw_name || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
