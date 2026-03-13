import { useState, useEffect } from 'react';
import { login } from '../api/auth';
import { setTokens, clearTokens } from '../api/client';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedAccess = localStorage.getItem('access_token');
    const storedRefresh = localStorage.getItem('refresh_token');
    if (storedAccess || storedRefresh) {
      clearTokens();
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const tokens = await login(email, password);
      setTokens(tokens.access_token, tokens.refresh_token);
      window.location.href = '/profiles';
    } catch (err) {
      let errorMessage = 'Ошибка входа';

      if (err instanceof Error) {
        const errorMsg = err.message.toLowerCase();

        if (errorMsg.includes('network') || errorMsg.includes('fetch') || errorMsg.includes('failed to fetch')) {
          errorMessage = 'Нет соединения с сервером. Проверьте, запущен ли backend.';
        } else if (errorMsg.includes('incorrect') || errorMsg.includes('password') || errorMsg.includes('email')) {
          errorMessage = 'Неверный email или пароль';
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-form">
      <h1>Вход</h1>

      {error && (
        <div className="error">
          <strong>Ошибка:</strong> {error}
          <button
            onClick={() => setError('')}
            style={{ float: 'right', padding: '2px 8px', fontSize: '12px' }}
          >
            ✕
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="test@example.com"
            required
            disabled={loading}
            autoComplete="email"
          />
        </div>

        <div className="form-group">
          <label>Пароль</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="password123"
            required
            disabled={loading}
            autoComplete="current-password"
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Вход...' : 'Войти'}
        </button>
      </form>

      <div style={{ marginTop: '16px', padding: '12px', background: '#f5f5f5', borderRadius: '4px', fontSize: '12px' }}>
        <strong>Тестовые данные:</strong><br />
        Email: test@example.com<br />
        Пароль: password123
      </div>

      <p style={{ marginTop: '16px', textAlign: 'center', fontSize: '11px', color: '#999' }}>
        Откройте консоль браузера (F12) для отладки
      </p>

      <p style={{ marginTop: '16px', textAlign: 'center' }}>
        Нет аккаунта? <a href="/register" style={{ color: '#2196f3' }}>Зарегистрироваться</a>
      </p>
    </div>
  );
}
