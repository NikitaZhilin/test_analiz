import type { Analyte, Result } from '../types';

interface ResultsEditorProps {
  results: Result[];
  analytes: Analyte[];
  onSave: (results: any[]) => void;
  saving: boolean;
}

export default function ResultsEditor({ results, analytes, onSave, saving }: ResultsEditorProps) {
  function addRow() {
    onSave([...results, {
      analyte_id: analytes[0]?.id || 0,
      value: 0,
      unit: '',
      ref_low: null,
      ref_high: null,
      raw_name: '',
    }]);
  }

  function updateRow(index: number, field: string, value: any) {
    const newResults = [...results];
    newResults[index] = { ...newResults[index], [field]: value };
    onSave(newResults);
  }

  function removeRow(index: number) {
    onSave(results.filter((_, i) => i !== index));
  }

  return (
    <div className="results-editor">
      <div className="flex-between">
        <h3>Редактирование результатов</h3>
        <button onClick={addRow} className="button-secondary">
          ➕ Добавить
        </button>
      </div>

      <div className="table-responsive">
        <table className="table results-edit-table">
          <thead>
            <tr>
              <th>Показатель</th>
              <th>Значение</th>
              <th>Ед.</th>
              <th>Реф. мин</th>
              <th>Реф. макс</th>
              <th>Название</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {results.map((result, index) => (
              <tr key={index}>
                <td>
                  <select
                    value={result.analyte_id}
                    onChange={e => updateRow(index, 'analyte_id', parseInt(e.target.value))}
                    className="input-select"
                  >
                    {analytes.map(a => (
                      <option key={a.id} value={a.id}>{a.display_name_ru}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    type="number"
                    step="0.01"
                    value={Number(result.value)}
                    onChange={e => updateRow(index, 'value', parseFloat(e.target.value) || 0)}
                    className="input-sm input-value"
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={result.unit || ''}
                    onChange={e => updateRow(index, 'unit', e.target.value)}
                    className="input-sm input-unit"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    step="0.01"
                    value={result.ref_low ?? ''}
                    onChange={e => updateRow(index, 'ref_low', e.target.value ? parseFloat(e.target.value) : null)}
                    placeholder="-"
                    className="input-sm input-ref"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    step="0.01"
                    value={result.ref_high ?? ''}
                    onChange={e => updateRow(index, 'ref_high', e.target.value ? parseFloat(e.target.value) : null)}
                    placeholder="-"
                    className="input-sm input-ref"
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={result.raw_name || ''}
                    onChange={e => updateRow(index, 'raw_name', e.target.value)}
                    placeholder="Как в бланке"
                    className="input-sm"
                  />
                </td>
                <td>
                  <button
                    onClick={() => removeRow(index)}
                    className="button-danger button-icon"
                    title="Удалить строку"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="form-actions">
        <button onClick={() => onSave(results)} disabled={saving || results.length === 0} className="button-primary">
          {saving ? (
            <>
              <span className="spinner"></span>
              Сохранение...
            </>
          ) : (
            <>
              ✓ Сохранить результаты
            </>
          )}
        </button>
      </div>
    </div>
  );
}
