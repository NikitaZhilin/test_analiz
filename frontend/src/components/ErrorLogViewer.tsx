import { useState, useEffect } from 'react';

interface ErrorLog {
  timestamp: string;
  message?: string;
  type?: string;
  reason?: string;
  url?: string;
  line?: number;
  column?: number;
  stack?: string;
}

export default function ErrorLogViewer() {
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadErrors();
    const interval = setInterval(loadErrors, 5000);
    return () => clearInterval(interval);
  }, []);

  function loadErrors() {
    try {
      const errorLog = JSON.parse(localStorage.getItem('error_log') || '[]');
      setErrors(errorLog.reverse()); // Новые сверху
    } catch {
      setErrors([]);
    }
  }

  function clearErrors() {
    localStorage.removeItem('error_log');
    setErrors([]);
  }

  if (errors.length === 0 && !isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '16px',
      right: '16px',
      zIndex: 9998
    }}>
      {/* Кнопка открытия */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            background: errors.length > 0 ? '#f44336' : '#9e9e9e',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '48px',
            height: '48px',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            fontSize: '20px'
          }}
          title={errors.length > 0 ? `Ошибок: ${errors.length}` : 'Нет ошибок'}
        >
          ⚠️
        </button>
      )}

      {/* Окно просмотра */}
      {isOpen && (
        <div style={{
          background: 'white',
          border: '1px solid #ddd',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          width: '400px',
          maxHeight: '500px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid #eee',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#f5f5f5',
            borderRadius: '8px 8px 0 0'
          }}>
            <strong>📋 Логи ошибок ({errors.length})</strong>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={loadErrors}
                style={{ padding: '4px 8px', fontSize: '12px' }}
              >
                ↻
              </button>
              <button
                onClick={clearErrors}
                style={{ padding: '4px 8px', fontSize: '12px', background: '#f44336' }}
                disabled={errors.length === 0}
              >
                Очистить
              </button>
              <button
                onClick={() => setIsOpen(false)}
                style={{ padding: '4px 8px', fontSize: '12px', background: '#e0e0e0' }}
              >
                ✕
              </button>
            </div>
          </div>

          <div style={{
            overflowY: 'auto',
            padding: '12px',
            fontSize: '11px',
            fontFamily: 'monospace'
          }}>
            {errors.length === 0 ? (
              <div style={{ color: '#999', textAlign: 'center', padding: '20px' }}>
                Нет сохранённых ошибок
              </div>
            ) : (
              errors.map((error, index) => (
                <div
                  key={index}
                  style={{
                    padding: '8px',
                    marginBottom: '8px',
                    background: '#ffebee',
                    borderRadius: '4px',
                    borderLeft: '3px solid #f44336'
                  }}
                >
                  <div style={{ color: '#666', marginBottom: '4px' }}>
                    {new Date(error.timestamp).toLocaleString('ru-RU')}
                  </div>
                  <div style={{ fontWeight: 'bold', color: '#c62828', marginBottom: '4px' }}>
                    {error.message || error.type || 'Ошибка'}
                  </div>
                  {error.reason && (
                    <div style={{ color: '#333', marginBottom: '4px' }}>
                      {error.reason}
                    </div>
                  )}
                  {error.url && (
                    <div style={{ color: '#666' }}>
                      {error.url}:{error.line}:{error.column}
                    </div>
                  )}
                  {error.stack && (
                    <details style={{ marginTop: '4px' }}>
                      <summary style={{ cursor: 'pointer', color: '#1976d2' }}>Stack trace</summary>
                      <pre style={{
                        marginTop: '4px',
                        padding: '8px',
                        background: '#f5f5f5',
                        borderRadius: '4px',
                        overflow: 'auto',
                        maxHeight: '150px',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all'
                      }}>
                        {error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
