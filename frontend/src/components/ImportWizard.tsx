import { useState, useRef } from 'react';
import { previewImport, confirmImport } from '../api/import';
import { getAnalytes, matchAnalyte } from '../api/analytes';
import type { ImportPreviewRow, Analyte } from '../types';

interface ImportWizardProps {
  profileId: number;
  onComplete: (reportId: number) => void;
  onCancel: () => void;
}

export default function ImportWizard({ profileId, onComplete, onCancel }: ImportWizardProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreviewRow[] | null>(null);
  const [analytes, setAnalytes] = useState<Analyte[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'upload' | 'preview' | 'confirm'>('upload');

  const [takenAt, setTakenAt] = useState(new Date().toISOString().split('T')[0]);
  const [labName, setLabName] = useState('');
  const [comment, setComment] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedAnalytes, setSelectedAnalytes] = useState<Record<number, number | null>>({});
  const [newAnalyteNames, setNewAnalyteNames] = useState<Record<number, string>>({});
  const [createNewFlags, setCreateNewFlags] = useState<Record<number, boolean>>({});

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

    setLoading(true);
    setError('');

    try {
      const data = await previewImport(profileId, file);
      setPreview(data.parsed_rows);
      setStep('preview');

      const analytesData = await getAnalytes();
      setAnalytes(analytesData);

      const initialSelected: Record<number, number | null> = {};
      data.parsed_rows.forEach(row => {
        if (row.analyte) {
          initialSelected[row.row_index] = row.analyte.id;
        }
      });
      setSelectedAnalytes(initialSelected);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки файла');
    } finally {
      setLoading(false);
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

    setLoading(true);
    setError('');

    try {
      const rows = preview.map(row => ({
        row_index: row.row_index,
        analyte_id: selectedAnalytes[row.row_index] ?? null,
        create_new_analyte: createNewFlags[row.row_index] || false,
        analyte_name: newAnalyteNames[row.row_index] || row.analyte_raw || null,
        value: row.value,
        unit: row.unit || undefined,
        ref_low: row.ref_low ?? undefined,
        ref_high: row.ref_high ?? undefined,
        raw_name: row.analyte_raw ?? undefined,
      }));

      const result = await confirmImport(profileId, {
        taken_at: takenAt,
        lab_name: labName || undefined,
        comment: comment || undefined,
        rows,
      });

      setStep('confirm');
      onComplete(result.report_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка подтверждения импорта');
    } finally {
      setLoading(false);
    }
  }

  if (step === 'confirm') {
    return (
      <div className="modal">
        <div className="modal-header">
          <div className="modal-icon">✓</div>
          <h2>Импорт завершён!</h2>
        </div>
        <div className="success-message">
          Результаты успешно добавлены в профиль.
        </div>
      </div>
    );
  }

  return (
    <div className="modal import-wizard-modal">
      <div className="modal-header">
        <div className="modal-icon">📤</div>
        <h2>Импорт анализов</h2>
      </div>

      {step === 'upload' && (
        <>
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

          {error && <div className="alert alert-error">{error}</div>}

          <div className="modal-actions">
            <button onClick={onCancel} className="button-secondary">
              ✕ Отмена
            </button>
            <button onClick={handleUpload} disabled={!file || loading} className="button-primary">
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Загрузка...
                </>
              ) : (
                <>
                  📤 Загрузить
                </>
              )}
            </button>
          </div>
        </>
      )}

      {step === 'preview' && preview && (
        <>
          <div className="form-row">
            <div className="form-group">
              <label>Дата сдачи</label>
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

          {error && <div className="alert alert-error">{error}</div>}

          <div className="table-responsive">
            <table className="table import-preview-table">
              <thead>
                <tr>
                  <th>Показатель</th>
                  <th>Значение</th>
                  <th>Ед.</th>
                  <th>Статус</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((row, _index) => {
                  const isUnmatched = !row.analyte;
                  const selectedId = selectedAnalytes[row.row_index];

                  return (
                    <tr key={row.row_index} className={isUnmatched ? 'row-unmatched' : ''}>
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
                          </div>
                        ) : (
                          <span className="matched-analyte">
                            ✓ {row.analyte?.display_name_ru || row.analyte_raw}
                          </span>
                        )}
                      </td>
                      <td>
                        <strong>{row.value.toFixed(2)}</strong>
                      </td>
                      <td>
                        <span className="unit-badge">{row.unit || '—'}</span>
                      </td>
                      <td>
                        {row.analyte ? (
                          <span className="badge badge-success">✓ OK</span>
                        ) : (
                          <span className="badge badge-warning">⚠️ Выбор</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <div className="modal-actions">
            <button onClick={onCancel} className="button-secondary">
              ✕ Отмена
            </button>
            <button onClick={handleConfirm} disabled={loading} className="button-primary">
              {loading ? (
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
        </>
      )}
    </div>
  );
}
