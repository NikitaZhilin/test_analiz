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
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1>С возвращением</h1>
          <p className="auth-subtitle">Войдите для продолжения работы</p>
        </div>

        {error && (
          <div className="alert alert-error">
            <span className="alert-icon">⛔</span>
            <span>{error}</span>
            <button className="alert-close" onClick={() => setError('')} type="button">✕</button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Пароль</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner"></span>
                Вход...
              </>
            ) : (
              'Войти'
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Нет аккаунта?{' '}
            <a href="/register" className="auth-link">
              Зарегистрироваться
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
