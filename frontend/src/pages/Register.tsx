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
          errorMessage = 'Нет соединения с сервером. Проверьте, запущен ли backend (http://localhost:8000)';
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
    <div className="auth-form">
      <h1>Регистрация</h1>

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
            onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label>Пароль</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Минимум 6 символов"
            minLength={6}
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label>Подтверждение пароля</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="Повторите пароль"
            required
            disabled={loading}
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Регистрация...' : 'Зарегистрироваться'}
        </button>
      </form>

      <p style={{ marginTop: '16px', textAlign: 'center' }}>
        Уже есть аккаунт? <Link to="/login">Войти</Link>
      </p>
    </div>
  );
}
