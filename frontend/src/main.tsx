import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { initAuth } from './api/client'
import './styles.css'

// Восстановить токены из localStorage при загрузке
initAuth()

// Глобальный обработчик ошибок
window.addEventListener('error', (event) => {
  // Логирование в localStorage для отладки
  try {
    const errorLog = JSON.parse(localStorage.getItem('error_log') || '[]');
    errorLog.push({
      timestamp: new Date().toISOString(),
      message: event.message,
      url: event.filename,
      line: event.lineno,
      column: event.colno,
      stack: event.error?.stack
    });
    // Хранить только последние 50 ошибок
    while (errorLog.length > 50) errorLog.shift();
    localStorage.setItem('error_log', JSON.stringify(errorLog));
  } catch {}
});

window.addEventListener('unhandledrejection', (event) => {
  // Логирование в localStorage для отладки
  try {
    const errorLog = JSON.parse(localStorage.getItem('error_log') || '[]');
    errorLog.push({
      timestamp: new Date().toISOString(),
      type: 'unhandledrejection',
      reason: String(event.reason)
    });
    while (errorLog.length > 50) errorLog.shift();
    localStorage.setItem('error_log', JSON.stringify(errorLog));
  } catch {}
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
