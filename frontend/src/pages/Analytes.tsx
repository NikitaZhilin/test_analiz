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
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>Показатели профиля</h1>
      </div>

      {error && <div className="error">{error}</div>}

      {analytes.length === 0 ? (
        <div className="card empty-state">
          <h3>Нет показателей</h3>
          <p>Показатели появятся после импорта или добавления результатов анализов</p>
        </div>
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Название</th>
                <th>Canonical name</th>
                <th>Ед. изм.</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {analytes.map(analyte => (
                <tr key={analyte.id}>
                  <td><strong>{analyte.display_name_ru}</strong></td>
                  <td><code>{analyte.canonical_name}</code></td>
                  <td>{analyte.default_unit || '—'}</td>
                  <td>
                    <Link to={`/profiles/${profileId}/analytes/${analyte.id}`}>
                      <button className="secondary">График</button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
