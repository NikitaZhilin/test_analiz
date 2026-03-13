import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { previewImport, confirmImport } from '../api/import';
import { getAnalytes, matchAnalyte } from '../api/analytes';
import type { ImportPreviewRow, Analyte } from '../types';

export default function ImportPage({ profileId }: { profileId: number }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreviewRow[] | null>(null);
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

    // Проверка расширения
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

  return (
    <div>
      <div className="page-header">
        <h1>
          <Link to={`/profiles/${profileId}/reports`}>← Назад</Link> / Импорт анализов
        </h1>
      </div>

      {error && <div className="error">{error}</div>}

      {step === 'upload' && (
        <div className="card">
          <h2>Загрузка файла</h2>
          <p style={{ marginBottom: '16px', color: '#666' }}>
            Поддерживается только PDF формат. Загрузите файл с результатами анализов.
          </p>

          <div
            className="file-upload"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
            />
            {file ? (
              <div>
                <p style={{ fontWeight: 'bold', color: '#333' }}>{file.name}</p>
                <p style={{ fontSize: '13px', color: '#666' }}>
                  {(file.size / 1024).toFixed(1)} КБ
                </p>
              </div>
            ) : (
              <div>
                <p>Перетащите файл сюда или кликните для выбора</p>
                <p style={{ fontSize: '13px', color: '#999' }}>PDF</p>
              </div>
            )}
          </div>

          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            style={{ marginTop: '16px' }}
          >
            {uploading ? 'Загрузка...' : 'Загрузить и распознать'}
          </button>
        </div>
      )}

      {step === 'preview' && preview && (
        <div>
          <div className="card">
            <h2>Предпросмотр импорта</h2>

            <div className="grid grid-3" style={{ marginBottom: '16px' }}>
              <div className="form-group">
                <label>Дата сдачи *</label>
                <input
                  type="date"
                  value={takenAt}
                  onChange={e => setTakenAt(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Лаборатория</label>
                <input
                  type="text"
                  placeholder="Инвитро, Гемотест..."
                  value={labName}
                  onChange={e => setLabName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Комментарий</label>
                <input
                  type="text"
                  placeholder="Плановый, контрольный..."
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                />
              </div>
            </div>

            {hasErrors && (
              <div className="error">
                Некоторые строки содержат ошибки. Исправьте файл или пропустите эти строки.
              </div>
            )}

            {unmatchedRows.length > 0 && (
              <div style={{ marginBottom: '16px', padding: '12px', background: '#fff3e0', borderRadius: '4px' }}>
                <strong>Внимание:</strong> {unmatchedRows.length} показателей не распознано.
                Укажите соответствия для unmatched строк ниже.
              </div>
            )}

            <div className="import-preview">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Показатель (распознан)</th>
                    <th>Значение</th>
                    <th>Ед.</th>
                    <th>Реф. мин</th>
                    <th>Реф. макс</th>
                    <th>Статус</th>
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
                        className={isUnmatched ? 'unmatched' : row.errors.length > 0 ? 'error' : ''}
                      >
                        <td>{index + 1}</td>
                        <td>
                          {isUnmatched ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <input
                                type="text"
                                placeholder={row.analyte_raw || 'Название'}
                                onChange={e => {
                                  const value = e.target.value;
                                  handleMatchAnalyte(row.row_index, value);
                                  setNewAnalyteNames(prev => ({ ...prev, [row.row_index]: value }));
                                }}
                                style={{ fontSize: '12px', padding: '4px' }}
                                defaultValue={row.analyte_raw || ''}
                              />
                              <select
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
                                style={{ fontSize: '12px', padding: '4px' }}
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
                                  placeholder="Название нового показателя"
                                  value={newAnalyteNames[row.row_index] || ''}
                                  onChange={e => setNewAnalyteNames(prev => ({
                                    ...prev,
                                    [row.row_index]: e.target.value,
                                  }))}
                                  style={{ fontSize: '12px', padding: '4px' }}
                                />
                              )}
                            </div>
                          ) : (
                            <span style={{ color: '#2e7d32' }}>
                              {row.analyte?.display_name_ru || row.analyte_raw}
                            </span>
                          )}
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.01"
                            value={edited.value}
                            onChange={e => updateRowValue(row.row_index, 'value', e.target.value)}
                            style={{ width: '80px', fontSize: '13px', padding: '4px' }}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={edited.unit || ''}
                            onChange={e => updateRowValue(row.row_index, 'unit', e.target.value)}
                            placeholder={row.unit || '—'}
                            style={{ width: '60px', fontSize: '13px', padding: '4px' }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.01"
                            value={edited.ref_low ?? ''}
                            onChange={e => updateRowValue(row.row_index, 'ref_low', e.target.value ? parseFloat(e.target.value) : null)}
                            placeholder={row.ref_low?.toString() || "—"}
                            style={{ width: '70px', fontSize: '13px', padding: '4px' }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.01"
                            value={edited.ref_high ?? ''}
                            onChange={e => updateRowValue(row.row_index, 'ref_high', e.target.value ? parseFloat(e.target.value) : null)}
                            placeholder={row.ref_high?.toString() || "—"}
                            style={{ width: '70px', fontSize: '13px', padding: '4px' }}
                          />
                        </td>
                        <td>
                          {row.errors.length > 0 ? (
                            <span className="badge badge-high">Ошибка</span>
                          ) : row.matched || selectedAnalyte ? (
                            <span className="badge badge-normal">OK</span>
                          ) : (
                            <span className="badge badge-low">Выбор</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex" style={{ marginTop: '16px' }}>
              <button onClick={resetImport} className="secondary">
                Отмена
              </button>
              <button onClick={handleConfirm} disabled={confirming}>
                {confirming ? 'Импорт...' : `Импортировать ${preview.length} строк`}
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 'confirm' && (
        <div className="card">
          <div className="success" style={{ textAlign: 'center' }}>
            <h3>Импорт успешно завершён!</h3>
            <p>Добавлена новая сдача анализов.</p>
          </div>
          <div className="flex" style={{ justifyContent: 'center' }}>
            <button onClick={resetImport}>Загрузить ещё</button>
            <Link to={`/profiles/${profileId}/reports`}>
              <button className="secondary">К списку сдач</button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
