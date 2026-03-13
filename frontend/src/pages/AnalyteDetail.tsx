import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { getAnalyteSeries } from '../api/analytes';
import type { ChartData, ChartPoint } from '../types';

export default function AnalyteDetail({ profileId }: { profileId: number }) {
  const { analyteId } = useParams<{ analyteId: string }>();
  const [data, setData] = useState<ChartData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!analyteId) return;
    loadData();
  }, [profileId, analyteId]);

  async function loadData() {
    if (!analyteId) return;
    setLoading(true);
    try {
      const chartData = await getAnalyteSeries(profileId, parseInt(analyteId));
      setData(chartData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  if (!data || !analyteId) {
    return <div className="error">Показатель не найден</div>;
  }

  const chartData = data.points.map((point: ChartPoint) => ({
    ...point,
    dateShort: new Date(point.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
    fullDate: new Date(point.date).toLocaleDateString('ru-RU'),
  }));

  const avgRefLow = data.points.length > 0
    ? data.points.reduce((sum, p) => sum + (p.ref_low || 0), 0) / data.points.length
    : 0;
  const avgRefHigh = data.points.length > 0
    ? data.points.reduce((sum, p) => sum + (p.ref_high || 0), 0) / data.points.length
    : 0;

  const hasRefBounds = data.points.some(p => p.ref_low !== null || p.ref_high !== null);

  return (
    <div>
      <div className="page-header">
        <h1>
          <Link to={`/profiles/${profileId}/analytes`}>← Назад</Link> / {data.analyte.display_name_ru}
        </h1>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="card">
        <h2>Динамика: {data.analyte.display_name_ru}</h2>

        {data.points.length === 0 ? (
          <div className="empty-state">
            <p>Нет данных для отображения графика</p>
          </div>
        ) : (
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="dateShort"
                  tick={{ fontSize: 12 }}
                  label={{ value: 'Дата', position: 'insideBottom', offset: -5 }}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  label={{ value: data.analyte.default_unit || '', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload[0]) {
                      const point = payload[0].payload as typeof chartData[0];
                      return (
                        <div style={{
                          background: 'white',
                          padding: '12px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        }}>
                          <p style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>{point.fullDate}</p>
                          <p style={{ margin: '4px 0', color: '#2196f3' }}>
                            Значение: <strong>{point.value.toFixed(2)}</strong> {point.unit}
                          </p>
                          {point.ref_low !== null && point.ref_high !== null && (
                            <p style={{ margin: '4px 0', color: '#666' }}>
                              Референс: {point.ref_low.toFixed(2)} - {point.ref_high.toFixed(2)}
                            </p>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                {hasRefBounds && avgRefLow > 0 && (
                  <ReferenceLine
                    y={avgRefLow}
                    stroke="#ff9800"
                    strokeDasharray="3 3"
                    label="Мин. реф."
                  />
                )}
                {hasRefBounds && avgRefHigh > 0 && (
                  <ReferenceLine
                    y={avgRefHigh}
                    stroke="#f44336"
                    strokeDasharray="3 3"
                    label="Макс. реф."
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#2196f3"
                  strokeWidth={2}
                  dot={{ r: 5, fill: '#2196f3' }}
                  activeDot={{ r: 7 }}
                  name="Значение"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        <h3 style={{ marginTop: '24px', marginBottom: '12px' }}>Все значения</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Дата</th>
              <th>Значение</th>
              <th>Ед.</th>
              <th>Референс</th>
              <th>Статус</th>
            </tr>
          </thead>
          <tbody>
            {data.points.map((point, index) => (
              <tr key={index}>
                <td>{new Date(point.date).toLocaleDateString('ru-RU')}</td>
                <td><strong>{point.value.toFixed(2)}</strong></td>
                <td>{point.unit || '—'}</td>
                <td>
                  {point.ref_low !== null && point.ref_high !== null
                    ? `${point.ref_low.toFixed(2)} - ${point.ref_high.toFixed(2)}`
                    : '—'}
                </td>
                <td>
                  {point.ref_low !== null && point.ref_high !== null && (
                    <span className={`badge badge-${
                      point.value < point.ref_low
                        ? 'low'
                        : point.value > point.ref_high
                        ? 'high'
                        : 'normal'
                    }`}>
                      {point.value < point.ref_low
                        ? 'LOW'
                        : point.value > point.ref_high
                        ? 'HIGH'
                        : 'NORMAL'}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
