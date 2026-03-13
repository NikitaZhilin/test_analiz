import { useState } from 'react';
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
    <div className="card">
      <h2>Профили пациентов</h2>

      {error && <div className="error">{error}</div>}

      {profiles.length === 0 ? (
        <div className="empty-state">
          <h3>Нет профилей</h3>
          <p>Создайте первый профиль для отслеживания анализов</p>
        </div>
      ) : (
        <table className="table">
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
                <td>{profile.name}</td>
                <td>{new Date(profile.created_at).toLocaleDateString('ru-RU')}</td>
                <td>
                  {deleteConfirm === profile.id ? (
                    <div className="flex">
                      <span style={{ fontSize: '13px', color: '#c62828' }}>Удалить?</span>
                      <button onClick={() => handleDelete(profile.id)} className="danger">Да</button>
                      <button onClick={() => setDeleteConfirm(null)} className="secondary">Нет</button>
                    </div>
                  ) : (
                    <button onClick={() => setDeleteConfirm(profile.id)} className="danger">Удалить</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <form onSubmit={handleCreate} style={{ marginTop: '20px' }}>
        <div className="flex">
          <input
            type="text"
            placeholder="Название профиля (например: Я, Миша)"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            style={{ maxWidth: '300px' }}
          />
          <button type="submit" disabled={loading || !newName.trim()}>
            {loading ? 'Создание...' : 'Создать профиль'}
          </button>
        </div>
      </form>
    </div>
  );
}
