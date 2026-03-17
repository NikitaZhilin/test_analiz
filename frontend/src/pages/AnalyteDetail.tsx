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
    return (
      <div className="analyte-detail-page">
        <div className="loading-with-spinner">
          <span className="spinner-large"></span>
          <p>Загрузка данных показателя...</p>
        </div>
      </div>
    );
  }

  if (!data || !analyteId) {
    return (
      <div className="analyte-detail-page">
        <div className="alert alert-error">
          <span className="alert-icon">⛔</span>
          <span>Показатель не найден</span>
        </div>
      </div>
    );
  }

  const chartData = data.points.map((point: ChartPoint) => ({
    ...point,
    dateShort: new Date(point.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
    fullDate: new Date(point.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }),
  }));

  const avgRefLow = data.points.length > 0
    ? data.points.reduce((sum, p) => sum + (p.ref_low || 0), 0) / data.points.length
    : 0;
  const avgRefHigh = data.points.length > 0
    ? data.points.reduce((sum, p) => sum + (p.ref_high || 0), 0) / data.points.length
    : 0;

  const hasRefBounds = data.points.some(p => p.ref_low !== null || p.ref_high !== null);

  // Статистика
  const latestValue = data.points.length > 0 ? data.points[0].value : null;
  const minValue = data.points.length > 0 ? Math.min(...data.points.map(p => p.value)) : null;
  const maxValue = data.points.length > 0 ? Math.max(...data.points.map(p => p.value)) : null;

  return (
    <div className="analyte-detail-page">
      <div className="page-header">
        <h1>
          <Link to={`/profiles/${profileId}/analytes`}>← Назад</Link>
        </h1>
        <h2>{data.analyte.display_name_ru}</h2>
      </div>

      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⛔</span>
          <span>{error}</span>
        </div>
      )}

      {/* Карточка показателя */}
      <div className="card analyte-info-card">
        <div className="analyte-header">
          <div className="analyte-icon-large">📊</div>
          <div className="analyte-info">
            <h3 className="analyte-title">{data.analyte.display_name_ru}</h3>
            <div className="analyte-meta">
              <span className="meta-item">
                <span className="meta-label">Ед. изм.:</span>
                <span className="unit-badge">{data.analyte.default_unit || '—'}</span>
              </span>
              <span className="meta-item">
                <span className="meta-label">Измерений:</span>
                <strong>{data.points.length}</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Статистика */}
      {data.points.length > 0 && latestValue !== null && (
        <div className="analytes-stats">
          <div className="stat-card">
            <div className="stat-label">Последнее</div>
            <div className="stat-value">{latestValue.toFixed(2)}</div>
            <div className="stat-unit">{data.analyte.default_unit}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Минимум</div>
            <div className="stat-value stat-min">{minValue?.toFixed(2)}</div>
            <div className="stat-unit">{data.analyte.default_unit}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Максимум</div>
            <div className="stat-value stat-max">{maxValue?.toFixed(2)}</div>
            <div className="stat-unit">{data.analyte.default_unit}</div>
          </div>
        </div>
      )}

      {/* График */}
      <div className="card chart-card">
        <div className="card-header">
          <div className="card-icon">📈</div>
          <div>
            <h2>Динамика показателя</h2>
            <p className="card-subtitle">
              Изменение значения во времени
            </p>
          </div>
        </div>

        {data.points.length === 0 ? (
          <div className="empty-state-card">
            <div className="empty-icon">📉</div>
            <h3>Нет данных</h3>
            <p className="empty-message">
              Нет данных для отображения графика
            </p>
          </div>
        ) : (
          <div className="chart-container-large">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="dateShort"
                  tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }}
                  tickLine={{ stroke: 'var(--color-border)' }}
                  axisLine={{ stroke: 'var(--color-border)' }}
                  label={{ 
                    value: 'Дата', 
                    position: 'insideBottom', 
                    offset: -5,
                    fill: 'var(--color-text-secondary)',
                    fontSize: 12
                  }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }}
                  tickLine={{ stroke: 'var(--color-border)' }}
                  axisLine={{ stroke: 'var(--color-border)' }}
                  label={{ 
                    value: data.analyte.default_unit || '', 
                    angle: -90, 
                    position: 'insideLeft',
                    fill: 'var(--color-text-secondary)',
                    fontSize: 12
                  }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload[0]) {
                      const point = payload[0].payload as typeof chartData[0];
                      return (
                        <div className="chart-tooltip">
                          <p className="tooltip-date">{point.fullDate}</p>
                          <div className="tooltip-row">
                            <span className="tooltip-dot"></span>
                            <span>Значение:</span>
                            <strong>{point.value.toFixed(2)}</strong>
                            <span className="tooltip-unit">{point.unit}</span>
                          </div>
                          {point.ref_low !== null && point.ref_high !== null && (
                            <div className="tooltip-row tooltip-ref">
                              <span>Референс:</span>
                              <span>{point.ref_low.toFixed(2)} - {point.ref_high.toFixed(2)}</span>
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend 
                  wrapperStyle={{ 
                    paddingTop: '20px',
                    fontSize: '12px'
                  }} 
                />
                {hasRefBounds && avgRefLow > 0 && (
                  <ReferenceLine
                    y={avgRefLow}
                    stroke="var(--color-warning)"
                    strokeDasharray="3 3"
                    strokeWidth={2}
                    label={{ 
                      value: 'Мин. реф.',
                      fill: 'var(--color-warning)',
                      fontSize: 11
                    }}
                  />
                )}
                {hasRefBounds && avgRefHigh > 0 && (
                  <ReferenceLine
                    y={avgRefHigh}
                    stroke="var(--color-error)"
                    strokeDasharray="3 3"
                    strokeWidth={2}
                    label={{ 
                      value: 'Макс. реф.',
                      fill: 'var(--color-error)',
                      fontSize: 11
                    }}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="var(--color-primary)"
                  strokeWidth={3}
                  dot={{ r: 5, fill: 'var(--color-primary)', strokeWidth: 2, stroke: 'var(--color-surface)' }}
                  activeDot={{ r: 7, fill: 'var(--color-primary-light)' }}
                  name="Значение"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Таблица значений */}
      <div className="card values-table-card">
        <div className="card-header">
          <div className="card-icon">📋</div>
          <div>
            <h2>Все значения</h2>
            <p className="card-subtitle">
              История измерений по датам
            </p>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table values-table">
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
              {data.points.map((point, index) => {
                const isLow = point.ref_low !== null && point.value < point.ref_low;
                const isHigh = point.ref_high !== null && point.value > point.ref_high;
                const isNormal = !isLow && !isHigh && point.ref_low !== null;

                return (
                  <tr key={index} className={isLow ? 'row-low' : isHigh ? 'row-high' : isNormal ? 'row-normal' : ''}>
                    <td className="date-cell">
                      {new Date(point.date).toLocaleDateString('ru-RU', { 
                        day: 'numeric', 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                    </td>
                    <td className="value-cell">
                      <strong>{point.value.toFixed(2)}</strong>
                    </td>
                    <td className="unit-cell">
                      <span className="unit-badge">{point.unit || '—'}</span>
                    </td>
                    <td className="ref-cell">
                      {point.ref_low !== null && point.ref_high !== null
                        ? `${point.ref_low.toFixed(2)} - ${point.ref_high.toFixed(2)}`
                        : '—'}
                    </td>
                    <td className="status-cell">
                      {isLow && <span className="badge badge-warning">⬇️ LOW</span>}
                      {isHigh && <span className="badge badge-error">⬆️ HIGH</span>}
                      {isNormal && <span className="badge badge-success">✓ NORMAL</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
