import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../api/auth';
import { setTokens } from '../api/client';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    // Валидация паролей
    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    // Валидация сложности пароля
    if (password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      return;
    }

    setLoading(true);

    try {
      const tokens = await register(email, password);
      setTokens(tokens.access_token, tokens.refresh_token);
      navigate('/profiles');
    } catch (err) {
      console.error('[Register Error]', err);

      // Детализация ошибки
      let errorMessage = 'Ошибка регистрации';

      if (err instanceof Error) {
        const errorMsg = err.message.toLowerCase();

        if (errorMsg.includes('network') || errorMsg.includes('fetch')) {
          errorMessage = 'Нет соединения с сервером. Проверьте, запущен ли backend';
        } else if (errorMsg.includes('email') && errorMsg.includes('registered')) {
          errorMessage = 'Этот email уже зарегистрирован. Попробуйте войти.';
        } else if (errorMsg.includes('invalid') && errorMsg.includes('email')) {
          errorMessage = 'Некорректный формат email';
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
          <h1>Создать аккаунт</h1>
          <p className="auth-subtitle">Заполните форму для регистрации</p>
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
              onChange={e => setEmail(e.target.value)}
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
              onChange={e => setPassword(e.target.value)}
              placeholder="Минимум 6 символов"
              minLength={6}
              required
              disabled={loading}
              autoComplete="new-password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Подтверждение пароля</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Повторите пароль"
              required
              disabled={loading}
              autoComplete="new-password"
            />
          </div>

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner"></span>
                Регистрация...
              </>
            ) : (
              'Зарегистрироваться'
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Уже есть аккаунт?{' '}
            <Link to="/login" className="auth-link">
              Войти
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
