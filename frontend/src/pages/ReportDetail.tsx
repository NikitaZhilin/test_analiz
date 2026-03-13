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
    return <div className="loading">Загрузка...</div>;
  }

  if (!report) {
    return <div className="error">Отчёт не найден</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>
          <Link to={`/profiles/${profileId}/reports`}>← Назад</Link> / Отчёт от {new Date(report.taken_at).toLocaleDateString('ru-RU')}
        </h1>
        <div className="flex">
          <button onClick={() => setEditing(!editing)} className="secondary">
            {editing ? 'Отмена' : 'Редактировать'}
          </button>
          <button onClick={handleDelete} className="danger" disabled={deleting}>
            {deleting ? 'Удаление...' : 'Удалить'}
          </button>
        </div>
      </div>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <div className="card">
        <h2>Информация</h2>
        {editing ? (
          <form onSubmit={handleSaveEdit}>
            <div className="grid grid-3">
              <div className="form-group">
                <label>Дата сдачи *</label>
                <input
                  type="date"
                  value={editData.takenAt}
                  onChange={e => setEditData({ ...editData, takenAt: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Лаборатория</label>
                <input
                  type="text"
                  value={editData.labName}
                  onChange={e => setEditData({ ...editData, labName: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Комментарий</label>
                <input
                  type="text"
                  value={editData.comment}
                  onChange={e => setEditData({ ...editData, comment: e.target.value })}
                />
              </div>
            </div>
            <button type="submit" disabled={saving}>
              {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
          </form>
        ) : (
          <div className="grid grid-3">
            <div>
              <strong>Дата:</strong> {new Date(report.taken_at).toLocaleDateString('ru-RU')}
            </div>
            <div>
              <strong>Лаборатория:</strong> {report.lab_name || '—'}
            </div>
            <div>
              <strong>Комментарий:</strong> {report.comment || '—'}
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <div className="flex-between">
          <h2>Результаты ({report.results.length})</h2>
          {editing && (
            <button onClick={addResultRow}>+ Добавить</button>
          )}
        </div>

        {editing ? (
          <div className="results-editor">
            <table>
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
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={result.unit}
                        onChange={e => updateResultRow(index, 'unit', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.01"
                        value={result.ref_low ?? ''}
                        onChange={e => updateResultRow(index, 'ref_low', e.target.value ? parseFloat(e.target.value) : null)}
                        placeholder="-"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.01"
                        value={result.ref_high ?? ''}
                        onChange={e => updateResultRow(index, 'ref_high', e.target.value ? parseFloat(e.target.value) : null)}
                        placeholder="-"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={result.raw_name}
                        onChange={e => updateResultRow(index, 'raw_name', e.target.value)}
                        placeholder="Как в бланке"
                      />
                    </td>
                    <td>
                      <button onClick={() => removeResultRow(index)} className="danger">✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={handleSaveResults} disabled={saving || results.length === 0} style={{ marginTop: '16px' }}>
              {saving ? 'Сохранение...' : 'Сохранить результаты'}
            </button>
          </div>
        ) : report.results.length === 0 ? (
          <div className="empty-state">
            <p>Нет результатов. Нажмите "Редактировать" для добавления.</p>
          </div>
        ) : (
          <table className="table">
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
                  <td>{result.analyte?.display_name_ru || '—'}</td>
                  <td><strong>{Number(result.value).toFixed(2)}</strong></td>
                  <td>{result.unit || '—'}</td>
                  <td>
                    {result.ref_low !== null && result.ref_high !== null
                      ? `${Number(result.ref_low).toFixed(2)} - ${Number(result.ref_high).toFixed(2)}`
                      : '—'}
                  </td>
                  <td>
                    {result.flag && (
                      <span className={`badge badge-${result.flag.toLowerCase()}`}>
                        {result.flag}
                      </span>
                    )}
                  </td>
                  <td>{result.raw_name || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
