import { Link } from 'react-router-dom';
import type { ReportListItem } from '../types';

interface ReportsTableProps {
  reports: ReportListItem[];
}

export default function ReportsTable({ reports }: ReportsTableProps) {
  if (reports.length === 0) {
    return (
      <div className="empty-state-card">
        <div className="empty-icon">📋</div>
        <h3>Нет сдач анализов</h3>
        <p className="empty-message">
          Создайте первую сдачу для добавления результатов
        </p>
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table className="table reports-table">
        <thead>
          <tr>
            <th>Дата</th>
            <th>Лаборатория</th>
            <th>Комментарий</th>
            <th>Результатов</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {reports.map(report => (
            <tr key={report.id}>
              <td className="date-cell">
                {new Date(report.taken_at).toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </td>
              <td>{report.lab_name || '—'}</td>
              <td>{report.comment || '—'}</td>
              <td>
                <span className="results-count">{report.results_count}</span>
              </td>
              <td>
                <Link to={`/reports/${report.id}`}>
                  <button className="button-secondary button-sm">
                    👁️ Просмотр
                  </button>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
