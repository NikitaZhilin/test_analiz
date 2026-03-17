import { useState } from 'react';
import { Link } from 'react-router-dom';
import { createProfile, deleteProfile } from '../api/profiles';
import type { Profile } from '../types';

interface ProfilesProps {
  profiles: Profile[];
  onProfileCreated: (profile: Profile) => void;
  onProfileDeleted: (profileId: number) => void;
}

export default function Profiles({ profiles, onProfileCreated, onProfileDeleted }: ProfilesProps) {
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;

    setError('');
    setLoading(true);

    try {
      const profile = await createProfile(newName.trim());
      onProfileCreated(profile);
      setNewName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка создания профиля');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(profileId: number) {
    try {
      await deleteProfile(profileId);
      onProfileDeleted(profileId);
      setDeleteConfirm(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка удаления профиля');
    }
  }

  return (
    <div className="profiles-page">
      <div className="page-header">
        <h1>
          <Link to="/profiles">← Назад</Link>
        </h1>
        <h2>Профили пациентов</h2>
      </div>

      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⛔</span>
          <span>{error}</span>
        </div>
      )}

      {profiles.length === 0 ? (
        <div className="card empty-state-card">
          <div className="empty-icon">👤</div>
          <h2>Нет профилей</h2>
          <p className="empty-message">
            Создайте первый профиль для отслеживания анализов
          </p>
        </div>
      ) : (
        <div className="card profiles-list-card">
          <div className="card-header">
            <div className="card-icon">👥</div>
            <div>
              <h2>Список профилей</h2>
              <p className="card-subtitle">
                Управляйте профилями пациентов
              </p>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table profiles-table">
              <thead>
                <tr>
                  <th>Название</th>
                  <th>Создан</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map(profile => (
                  <tr key={profile.id}>
                    <td>
                      <div className="profile-name">
                        <span className="profile-icon">👤</span>
                        <strong>{profile.name}</strong>
                      </div>
                    </td>
                    <td className="date-cell">
                      {new Date(profile.created_at).toLocaleDateString('ru-RU')}
                    </td>
                    <td>
                      {deleteConfirm === profile.id ? (
                        <div className="flex">
                          <span className="delete-warning">Удалить?</span>
                          <button onClick={() => handleDelete(profile.id)} className="button-danger button-sm">Да</button>
                          <button onClick={() => setDeleteConfirm(null)} className="button-secondary button-sm">Нет</button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteConfirm(profile.id)} className="button-danger button-sm">
                          🗑️ Удалить
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <form onSubmit={handleCreate} className="create-profile-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="newProfileName">Название профиля</label>
                <input
                  id="newProfileName"
                  type="text"
                  placeholder="Например: Я, Миша"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                />
              </div>
              <div className="form-group form-group-button">
                <label>&nbsp;</label>
                <button type="submit" disabled={loading || !newName.trim()} className="button-primary">
                  {loading ? (
                    <>
                      <span className="spinner"></span>
                      Создание...
                    </>
                  ) : (
                    <>
                      <span>➕</span>
                      Создать профиль
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
