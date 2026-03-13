import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getReports, createReport } from '../api/reports';
import type { ReportListItem } from '../types';

export default function Reports({ profileId }: { profileId: number }) {
  const [reports, setReports] = useState<ReportListItem[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [takenAt, setTakenAt] = useState(new Date().toISOString().split('T')[0]);
  const [labName, setLabName] = useState('');
  const [comment, setComment] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadReports();
  }, [profileId]);

  async function loadReports() {
    setLoading(true);
    try {
      const data = await getReports(profileId);
      setReports(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки отчётов');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);

    try {
      await createReport(profileId, takenAt, labName || undefined, comment || undefined);
      setShowCreate(false);
      setTakenAt(new Date().toISOString().split('T')[0]);
      setLabName('');
      setComment('');
      loadReports();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка создания отчёта');
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>Истории сдачи анализов</h1>
        <button onClick={() => setShowCreate(true)}>Новая сдача</button>
      </div>

      {error && <div className="error">{error}</div>}

      {reports.length === 0 ? (
        <div className="card empty-state">
          <h3>Нет сдач анализов</h3>
          <p>Создайте первую сдачу для добавления результатов</p>
          <button onClick={() => setShowCreate(true)} style={{ marginTop: '16px' }}>
            Создать сдачу
          </button>
        </div>
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Дата</th>
                <th>Лаборатория</th>
                <th>Комментарий</th>
                <th>Результатов</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {reports.map(report => (
                <tr key={report.id}>
                  <td>{new Date(report.taken_at).toLocaleDateString('ru-RU')}</td>
                  <td>{report.lab_name || '—'}</td>
                  <td>{report.comment || '—'}</td>
                  <td>{report.results_count}</td>
                  <td>
                    <Link to={`/reports/${report.id}`}>
                      <button className="secondary">Просмотр</button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Новая сдача анализов</h2>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Дата сдачи *</label>
                <input
                  type="date"
                  value={takenAt}
                  onChange={e => setTakenAt(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Лаборатория</label>
                <input
                  type="text"
                  placeholder="Инвитро, Гемотест..."
                  value={labName}
                  onChange={e => setLabName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Комментарий</label>
                <textarea
                  placeholder="Плановый, контрольный..."
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowCreate(false)} className="secondary">
                  Отмена
                </button>
                <button type="submit" disabled={creating}>
                  {creating ? 'Создание...' : 'Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
