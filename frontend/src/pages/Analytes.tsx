import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProfileAnalytes } from '../api/analytes';
import type { Analyte } from '../types';

export default function Analytes({ profileId }: { profileId: number }) {
  const [analytes, setAnalytes] = useState<Analyte[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytes();
  }, [profileId]);

  async function loadAnalytes() {
    setLoading(true);
    try {
      const data = await getProfileAnalytes(profileId);
      setAnalytes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="analytes-page">
        <div className="loading-with-spinner">
          <span className="spinner-large"></span>
          <p>Загрузка показателей...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="analytes-page">
      <div className="page-header">
        <h1>
          <Link to={`/profiles/${profileId}/reports`}>← Назад</Link>
        </h1>
        <h2>Показатели</h2>
      </div>

      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⛔</span>
          <span>{error}</span>
        </div>
      )}

      {analytes.length === 0 ? (
        <div className="card empty-state-card">
          <div className="empty-icon">📊</div>
          <h2>Нет показателей</h2>
          <p className="empty-message">
            Показатели появятся здесь после импорта результатов анализов
          </p>
          <Link to={`/profiles/${profileId}/reports`}>
            <button className="button-primary">
              📤 Перейти к импорту
            </button>
          </Link>
        </div>
      ) : (
        <>
          {/* Статистика */}
          <div className="analytes-stats">
            <div className="stat-card">
              <div className="stat-value">{analytes.length}</div>
              <div className="stat-label">Всего показателей</div>
            </div>
          </div>

          {/* Список показателей */}
          <div className="card analytes-list-card">
            <div className="card-header">
              <div className="card-icon">📋</div>
              <div>
                <h2>Список показателей</h2>
                <p className="card-subtitle">
                  Нажмите на кнопку "График" чтобы увидеть динамику
                </p>
              </div>
            </div>

            <div className="table-responsive">
              <table className="table analytes-table">
                <thead>
                  <tr>
                    <th style={{ width: '40%' }}>Название</th>
                    <th style={{ width: '30%' }}>Canonical name</th>
                    <th style={{ width: '20%' }}>Ед. изм.</th>
                    <th style={{ width: '10%' }}>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {analytes.map((analyte, index) => (
                    <tr key={analyte.id}>
                      <td>
                        <div className="analyte-name">
                          <span className="analyte-icon">{index + 1}.</span>
                          <strong>{analyte.display_name_ru}</strong>
                        </div>
                      </td>
                      <td>
                        <code className="canonical-name">{analyte.canonical_name}</code>
                      </td>
                      <td>
                        <span className="unit-badge">
                          {analyte.default_unit || '—'}
                        </span>
                      </td>
                      <td>
                        <Link to={`/profiles/${profileId}/analytes/${analyte.id}`}>
                          <button className="button-secondary button-sm">
                            📈 График
                          </button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
