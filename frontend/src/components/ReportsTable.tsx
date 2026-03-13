import { Link } from 'react-router-dom';
import type { ReportListItem } from '../types';

interface ReportsTableProps {
  reports: ReportListItem[];
}

export default function ReportsTable({ reports }: ReportsTableProps) {
  if (reports.length === 0) {
    return (
      <div className="empty-state">
        <h3>Нет сдач анализов</h3>
        <p>Создайте первую сдачу для добавления результатов</p>
      </div>
    );
  }

  return (
    <table className="table">
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
            <td>{new Date(report.taken_at).toLocaleDateString('ru-RU')}</td>
            <td>{report.lab_name || '—'}</td>
            <td>{report.comment || '—'}</td>
            <td>{report.results_count}</td>
            <td>
              <Link to={`/reports/${report.id}`}>
                <button className="secondary">Просмотр</button>
              </Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
