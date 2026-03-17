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
    return (
      <div className="loading-with-spinner">
        <span className="spinner-large"></span>
        <p>Загрузка списка сдач...</p>
      </div>
    );
  }

  return (
    <div className="reports-page">
      <div className="page-header">
        <h1>
          <Link to={`/profiles/${profileId}/reports`}>← Назад</Link>
        </h1>
        <h2>Истории сдачи анализов</h2>
        <button onClick={() => setShowCreate(true)} className="button-primary">
          ➕ Новая сдача
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⛔</span>
          <span>{error}</span>
        </div>
      )}

      {reports.length === 0 ? (
        <div className="card empty-state-card">
          <div className="empty-icon">📋</div>
          <h2>Нет сдач анализов</h2>
          <p className="empty-message">
            Создайте первую сдачу для добавления результатов
          </p>
          <button onClick={() => setShowCreate(true)} className="button-primary">
            📝 Создать сдачу
          </button>
        </div>
      ) : (
        <div className="card reports-list-card">
          <div className="card-header">
            <div className="card-icon">📊</div>
            <div>
              <h2>Список сдач</h2>
              <p className="card-subtitle">
                История сдачи анализов в профиле
              </p>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table reports-table">
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
                    <td className="date-cell">
                      {new Date(report.taken_at).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </td>
                    <td>{report.lab_name || '—'}</td>
                    <td>{report.comment || '—'}</td>
                    <td>
                      <span className="results-count">{report.results_count}</span>
                    </td>
                    <td>
                      <Link to={`/reports/${report.id}`}>
                        <button className="button-secondary button-sm">
                          👁️ Просмотр
                        </button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-icon">📝</div>
              <h2>Новая сдача анализов</h2>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label htmlFor="takenAt">Дата сдачи *</label>
                <input
                  id="takenAt"
                  type="date"
                  value={takenAt}
                  onChange={e => setTakenAt(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="labName">Лаборатория</label>
                <input
                  id="labName"
                  type="text"
                  placeholder="Инвитро, Гемотест..."
                  value={labName}
                  onChange={e => setLabName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="comment">Комментарий</label>
                <textarea
                  id="comment"
                  placeholder="Плановый, контрольный..."
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowCreate(false)} className="button-secondary">
                  ✕ Отмена
                </button>
                <button type="submit" disabled={creating} className="button-primary">
                  {creating ? (
                    <>
                      <span className="spinner"></span>
                      Создание...
                    </>
                  ) : (
                    <>
                      ✓ Создать
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
