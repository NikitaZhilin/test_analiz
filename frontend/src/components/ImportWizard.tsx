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
        unit: row.unit ?? undefined,
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
      setLoading(false);
    }
  }

  const unmatchedRows = preview?.filter(row => !row.matched) || [];

  return (
    <div>
      {step === 'upload' && (
        <div>
          <h2>Загрузка файла</h2>
          <p style={{ marginBottom: '16px', color: '#666' }}>
            Поддерживается только PDF формат.
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

          {error && <div className="error" style={{ marginTop: '16px' }}>{error}</div>}

          <div className="modal-actions" style={{ marginTop: '16px' }}>
            <button onClick={onCancel} className="secondary">Отмена</button>
            <button onClick={handleUpload} disabled={!file || loading}>
              {loading ? 'Загрузка...' : 'Загрузить'}
            </button>
          </div>
        </div>
      )}

      {step === 'preview' && preview && (
        <div>
          <h2>Предпросмотр</h2>

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
                placeholder="Инвитро..."
                value={labName}
                onChange={e => setLabName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Комментарий</label>
              <input
                type="text"
                value={comment}
                onChange={e => setComment(e.target.value)}
              />
            </div>
          </div>

          {unmatchedRows.length > 0 && (
            <div style={{ marginBottom: '16px', padding: '12px', background: '#fff3e0', borderRadius: '4px' }}>
              <strong>Внимание:</strong> {unmatchedRows.length} показателей не распознано.
            </div>
          )}

          <div className="import-preview">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Показатель</th>
                  <th>Значение</th>
                  <th>Ед.</th>
                  <th>Статус</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((row, index) => {
                  const isUnmatched = !row.matched;
                  const selectedId = selectedAnalytes[row.row_index];

                  return (
                    <tr
                      key={row.row_index}
                      className={isUnmatched ? 'unmatched' : ''}
                    >
                      <td>{index + 1}</td>
                      <td>
                        {isUnmatched ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <input
                              type="text"
                              placeholder={row.analyte_raw || 'Название'}
                              onChange={e => {
                                handleMatchAnalyte(row.row_index, e.target.value);
                                setNewAnalyteNames(prev => ({ ...prev, [row.row_index]: e.target.value }));
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
                          </div>
                        ) : (
                          <span style={{ color: '#2e7d32' }}>
                            {row.analyte?.display_name_ru || row.analyte_raw}
                          </span>
                        )}
                      </td>
                      <td>{row.value}</td>
                      <td>{row.unit || '—'}</td>
                      <td>
                        {row.matched || selectedId ? (
                          <span className="badge badge-normal">OK</span>
                        ) : (
                          <span className="badge badge-low">Требует выбора</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {error && <div className="error" style={{ marginTop: '16px' }}>{error}</div>}

          <div className="modal-actions" style={{ marginTop: '16px' }}>
            <button onClick={onCancel} className="secondary">Отмена</button>
            <button onClick={handleConfirm} disabled={loading}>
              {loading ? 'Импорт...' : `Импортировать ${preview.length} строк`}
            </button>
          </div>
        </div>
      )}

      {step === 'confirm' && (
        <div className="success">
          <h3>Импорт успешно завершён!</h3>
        </div>
      )}
    </div>
  );
}
