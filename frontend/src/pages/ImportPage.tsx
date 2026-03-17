import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { previewImport, confirmImport } from '../api/import';
import { getAnalytes, matchAnalyte } from '../api/analytes';
import type { ImportPreviewRow, Analyte } from '../types';

export default function ImportPage({ profileId }: { profileId: number }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreviewRow[] | null>(null);
  const [filteredOutCount, setFilteredOutCount] = useState<number>(0);
  const [analytes, setAnalytes] = useState<Analyte[]>([]);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [step, setStep] = useState<'upload' | 'preview' | 'confirm'>('upload');

  const [takenAt, setTakenAt] = useState(new Date().toISOString().split('T')[0]);
  const [labName, setLabName] = useState('');
  const [comment, setComment] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedAnalytes, setSelectedAnalytes] = useState<Record<number, number | null>>({});
  const [newAnalyteNames, setNewAnalyteNames] = useState<Record<number, string>>({});
  const [createNewFlags, setCreateNewFlags] = useState<Record<number, boolean>>({});
  const [editedValues, setEditedValues] = useState<Record<number, {
    value: number;
    unit: string | null;
    ref_low: number | null;
    ref_high: number | null;
  }>>({});

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.toLowerCase().endsWith('.pdf')) {
      setError('Поддерживается только PDF формат');
      return;
    }

    setFile(selectedFile);
    setError('');
  }

  async function handleUpload() {
    if (!file) return;

    setUploading(true);
    setError('');

    try {
      const data = await previewImport(profileId, file);
      setPreview(data.parsed_rows);
      setFilteredOutCount(data.filtered_out_rows_count || 0);
      setStep('preview');

      const analytesData = await getAnalytes();
      setAnalytes(analytesData);

      const initialSelected: Record<number, number | null> = {};
      const initialEditedValues: Record<number, {
        value: number;
        unit: string | null;
        ref_low: number | null;
        ref_high: number | null;
      }> = {};

      data.parsed_rows.forEach(row => {
        if (row.analyte) {
          initialSelected[row.row_index] = row.analyte.id;
        }
        initialEditedValues[row.row_index] = {
          value: row.value,
          unit: row.unit,
          ref_low: row.ref_low,
          ref_high: row.ref_high,
        };
      });
      setSelectedAnalytes(initialSelected);
      setEditedValues(initialEditedValues);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки файла');
    } finally {
      setUploading(false);
    }
  }

  async function handleMatchAnalyte(rowIndex: number, searchText: string) {
    if (!searchText.trim()) {
      setSelectedAnalytes(prev => ({ ...prev, [rowIndex]: null }));
      return;
    }

    try {
      const result = await matchAnalyte(searchText);
      if (result.matched && result.analyte) {
        setSelectedAnalytes(prev => ({ ...prev, [rowIndex]: result.analyte!.id }));
      }
    } catch {
      // Ignore matching errors
    }
  }

  async function handleConfirm() {
    if (!preview) return;

    setConfirming(true);
    setError('');

    try {
      const rows = preview.map(row => {
        const analyteId = selectedAnalytes[row.row_index] ?? null;
        const createNew = createNewFlags[row.row_index] || false;
        const analyteName = newAnalyteNames[row.row_index] || row.analyte_raw || null;
        const edited = editedValues[row.row_index];

        return {
          row_index: row.row_index,
          analyte_id: analyteId,
          create_new_analyte: createNew,
          analyte_name: analyteName,
          value: edited?.value ?? row.value,
          unit: (edited?.unit ?? row.unit) ?? undefined,
          ref_low: (edited?.ref_low ?? row.ref_low) ?? undefined,
          ref_high: (edited?.ref_high ?? row.ref_high) ?? undefined,
          raw_name: row.analyte_raw ?? undefined,
        };
      });

      await confirmImport(profileId, {
        taken_at: takenAt,
        lab_name: labName || undefined,
        comment: comment || undefined,
        rows,
      });

      setStep('confirm');

      setTimeout(() => {
        setFile(null);
        setPreview(null);
        setStep('upload');
        setTakenAt(new Date().toISOString().split('T')[0]);
        setLabName('');
        setComment('');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка подтверждения импорта');
    } finally {
      setConfirming(false);
    }
  }

  function resetImport() {
    setFile(null);
    setPreview(null);
    setStep('upload');
    setSelectedAnalytes({});
    setNewAnalyteNames({});
    setCreateNewFlags({});
    setEditedValues({});
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  function updateRowValue(rowIndex: number, field: string, value: any) {
    setEditedValues(prev => ({
      ...prev,
      [rowIndex]: {
        ...prev[rowIndex],
        [field]: field === 'value' ? (parseFloat(value) || 0) : value,
      },
    }));
  }

  const unmatchedRows = preview?.filter(row => !row.matched) || [];
  const hasErrors = preview?.some(row => row.errors.length > 0) || false;
  const matchedCount = preview?.filter(row => row.matched).length || 0;

  return (
    <div className="import-page">
      <div className="page-header">
        <h1>
          <Link to={`/profiles/${profileId}/reports`}>← Назад</Link>
        </h1>
        <h2>Импорт анализов</h2>
      </div>

      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠️</span>
          <span>{error}</span>
          <button className="alert-close" onClick={() => setError('')} type="button">✕</button>
        </div>
      )}

      {step === 'upload' && (
        <div className="card import-upload-card">
          <div className="card-header">
            <div className="card-icon">📄</div>
            <div>
              <h2>Загрузка файла</h2>
              <p className="card-subtitle">
                Загрузите PDF файл с результатами анализов из лаборатории
              </p>
            </div>
          </div>

          <div className="file-upload-zone" onClick={() => fileInputRef.current?.click()}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="file-upload-input"
            />
            <div className="file-upload-content">
              <div className="file-upload-icon">📁</div>
              {file ? (
                <>
                  <div className="file-name">{file.name}</div>
                  <div className="file-size">{(file.size / 1024).toFixed(1)} КБ</div>
                </>
              ) : (
                <>
                  <div className="file-upload-text">
                    <strong>Кликните</strong> или перетащите файл сюда
                  </div>
                  <div className="file-upload-hint">Поддерживается только PDF формат</div>
                </>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="button-primary"
            >
              {uploading ? (
                <>
                  <span className="spinner"></span>
                  Загрузка...
                </>
              ) : (
                <>
                  <span>📤</span>
                  Загрузить и распознать
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {step === 'preview' && preview && (
        <div className="import-preview-section">
          {/* Карточка с деталями импорта */}
          <div className="card import-details-card">
            <div className="card-header">
              <div className="card-icon">📋</div>
              <div>
                <h2>Детали импорта</h2>
                <p className="card-subtitle">
                  Укажите информацию о сдаче анализов
                </p>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="takenAt">Дата сдачи *</label>
                <input
                  id="takenAt"
                  type="date"
                  value={takenAt}
                  onChange={e => setTakenAt(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="labName">Лаборатория</label>
                <input
                  id="labName"
                  type="text"
                  placeholder="Инвитро, Гемотест..."
                  value={labName}
                  onChange={e => setLabName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="comment">Комментарий</label>
                <input
                  id="comment"
                  type="text"
                  placeholder="Плановый, контрольный..."
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Предупреждения */}
          {hasErrors && (
            <div className="alert alert-error">
              <span className="alert-icon">⛔</span>
              <span>Некоторые строки содержат ошибки. Исправьте файл или пропустите эти строки.</span>
            </div>
          )}

          {unmatchedRows.length > 0 && (
            <div className="alert alert-warning">
              <span className="alert-icon">⚠️</span>
              <span>
                <strong>{unmatchedRows.length}</strong> показателей не распознано.
                Укажите соответствия для выделенных строк ниже.
              </span>
            </div>
          )}

          {filteredOutCount > 0 && (
            <div className="alert alert-info">
              <span className="alert-icon">ℹ️</span>
              <span>
                Служебные строки автоматически скрыты (<strong>{filteredOutCount}</strong>)
              </span>
            </div>
          )}

          {/* Статистика */}
          <div className="import-stats">
            <div className="stat-card">
              <div className="stat-value">{preview.length}</div>
              <div className="stat-label">Всего строк</div>
            </div>
            <div className="stat-card stat-success">
              <div className="stat-value">{matchedCount}</div>
              <div className="stat-label">Распознано</div>
            </div>
            <div className="stat-card stat-warning">
              <div className="stat-value">{unmatchedRows.length}</div>
              <div className="stat-label">Требует выбора</div>
            </div>
          </div>

          {/* Таблица preview */}
          <div className="card import-table-card">
            <div className="card-header">
              <div className="card-icon">📊</div>
              <div>
                <h2>Предпросмотр</h2>
                <p className="card-subtitle">
                  Проверьте и при необходимости отредактируйте данные
                </p>
              </div>
            </div>

            <div className="table-responsive">
              <table className="table import-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>#</th>
                    <th>Показатель</th>
                    <th style={{ width: '90px' }}>Значение</th>
                    <th style={{ width: '80px' }}>Ед.</th>
                    <th style={{ width: '80px' }}>Реф. мин</th>
                    <th style={{ width: '80px' }}>Реф. макс</th>
                    <th style={{ width: '80px' }}>Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, index) => {
                    const isUnmatched = !row.matched;
                    const selectedId = selectedAnalytes[row.row_index];
                    const selectedAnalyte = analytes.find(a => a.id === selectedId);
                    const edited = editedValues[row.row_index] || {
                      value: row.value,
                      unit: row.unit,
                      ref_low: row.ref_low,
                      ref_high: row.ref_high,
                    };

                    return (
                      <tr
                        key={row.row_index}
                        className={isUnmatched ? 'row-unmatched' : row.errors.length > 0 ? 'row-error' : ''}
                      >
                        <td className="row-index">{index + 1}</td>
                        <td>
                          {isUnmatched ? (
                            <div className="unmatched-cell">
                              <input
                                type="text"
                                className="input-sm"
                                placeholder={row.analyte_raw || 'Название'}
                                onChange={e => {
                                  const value = e.target.value;
                                  handleMatchAnalyte(row.row_index, value);
                                  setNewAnalyteNames(prev => ({ ...prev, [row.row_index]: value }));
                                }}
                                defaultValue={row.analyte_raw || ''}
                              />
                              <select
                                className="select-sm"
                                value={selectedId || ''}
                                onChange={e => {
                                  const val = e.target.value;
                                  if (val === '__new__') {
                                    setCreateNewFlags(prev => ({ ...prev, [row.row_index]: true }));
                                    setSelectedAnalytes(prev => ({ ...prev, [row.row_index]: null }));
                                  } else {
                                    setCreateNewFlags(prev => ({ ...prev, [row.row_index]: false }));
                                    setSelectedAnalytes(prev => ({
                                      ...prev,
                                      [row.row_index]: val ? parseInt(val) : null,
                                    }));
                                  }
                                }}
                              >
                                <option value="">— Выбрать —</option>
                                {analytes.map(a => (
                                  <option key={a.id} value={a.id}>{a.display_name_ru}</option>
                                ))}
                                <option value="__new__">+ Создать новый</option>
                              </select>
                              {createNewFlags[row.row_index] && (
                                <input
                                  type="text"
                                  className="input-sm"
                                  placeholder="Название нового показателя"
                                  value={newAnalyteNames[row.row_index] || ''}
                                  onChange={e => setNewAnalyteNames(prev => ({
                                    ...prev,
                                    [row.row_index]: e.target.value,
                                  }))}
                                />
                              )}
                            </div>
                          ) : (
                            <span className="matched-analyte">
                              ✓ {row.analyte?.display_name_ru || row.analyte_raw}
                            </span>
                          )}
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.01"
                            className="input-sm input-value"
                            value={edited.value}
                            onChange={e => updateRowValue(row.row_index, 'value', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="input-sm input-unit"
                            value={edited.unit || ''}
                            onChange={e => updateRowValue(row.row_index, 'unit', e.target.value)}
                            placeholder={row.unit || '—'}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.01"
                            className="input-sm input-ref"
                            value={edited.ref_low ?? ''}
                            onChange={e => updateRowValue(row.row_index, 'ref_low', e.target.value ? parseFloat(e.target.value) : null)}
                            placeholder={row.ref_low?.toString() || "—"}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.01"
                            className="input-sm input-ref"
                            value={edited.ref_high ?? ''}
                            onChange={e => updateRowValue(row.row_index, 'ref_high', e.target.value ? parseFloat(e.target.value) : null)}
                            placeholder={row.ref_high?.toString() || "—"}
                          />
                        </td>
                        <td>
                          {row.errors.length > 0 ? (
                            <span className="badge badge-error">Ошибка</span>
                          ) : row.matched || selectedAnalyte ? (
                            <span className="badge badge-success">OK</span>
                          ) : (
                            <span className="badge badge-warning">Выбор</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="form-actions">
              <button onClick={resetImport} className="button-secondary">
                ✕ Отмена
              </button>
              <button onClick={handleConfirm} disabled={confirming} className="button-primary">
                {confirming ? (
                  <>
                    <span className="spinner"></span>
                    Импорт...
                  </>
                ) : (
                  <>
                    ✓ Импортировать {preview.length} строк
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 'confirm' && (
        <div className="card import-success-card">
          <div className="success-icon">✓</div>
          <h2>Импорт успешно завершён!</h2>
          <p className="success-message">
            Новая сдача анализов добавлена в ваш профиль.
          </p>
          <div className="form-actions">
            <button onClick={resetImport} className="button-primary">
              📤 Загрузить ещё
            </button>
            <Link to={`/profiles/${profileId}/reports`}>
              <button className="button-secondary">
                📋 К списку сдач
              </button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
