import type { Result, Analyte } from '../types';

interface ResultsEditorProps {
  results: Result[];
  analytes: Analyte[];
  onChange: (results: {
    analyte_id: number;
    value: number;
    unit: string;
    ref_low: number | null;
    ref_high: number | null;
    raw_name: string;
  }[]) => void;
  onSave: () => Promise<void>;
  saving: boolean;
}

export default function ResultsEditor({
  results,
  analytes,
  onChange,
  onSave,
  saving,
}: ResultsEditorProps) {
  const formattedResults = results.map(r => ({
    analyte_id: r.analyte_id,
    value: Number(r.value),
    unit: r.unit || '',
    ref_low: r.ref_low !== null ? Number(r.ref_low) : null,
    ref_high: r.ref_high !== null ? Number(r.ref_high) : null,
    raw_name: r.raw_name || '',
  }));

  function addRow() {
    onChange([
      ...formattedResults,
      {
        analyte_id: analytes[0]?.id || 0,
        value: 0,
        unit: '',
        ref_low: null,
        ref_high: null,
        raw_name: '',
      },
    ]);
  }

  function updateRow(index: number, field: string, value: any) {
    const newResults = [...formattedResults];
    newResults[index] = { ...newResults[index], [field]: value };
    onChange(newResults);
  }

  function removeRow(index: number) {
    onChange(formattedResults.filter((_, i) => i !== index));
  }

  return (
    <div className="results-editor">
      <div className="flex-between" style={{ marginBottom: '12px' }}>
        <h3>Редактирование результатов</h3>
        <button onClick={addRow}>+ Добавить</button>
      </div>

      <table>
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
          {formattedResults.map((result, index) => (
            <tr key={index}>
              <td>
                <select
                  value={result.analyte_id}
                  onChange={e => updateRow(index, 'analyte_id', parseInt(e.target.value))}
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
                  value={result.value}
                  onChange={e => updateRow(index, 'value', parseFloat(e.target.value) || 0)}
                />
              </td>
              <td>
                <input
                  type="text"
                  value={result.unit}
                  onChange={e => updateRow(index, 'unit', e.target.value)}
                />
              </td>
              <td>
                <input
                  type="number"
                  step="0.01"
                  value={result.ref_low ?? ''}
                  onChange={e => updateRow(index, 'ref_low', e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="-"
                />
              </td>
              <td>
                <input
                  type="number"
                  step="0.01"
                  value={result.ref_high ?? ''}
                  onChange={e => updateRow(index, 'ref_high', e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="-"
                />
              </td>
              <td>
                <input
                  type="text"
                  value={result.raw_name}
                  onChange={e => updateRow(index, 'raw_name', e.target.value)}
                  placeholder="Как в бланке"
                />
              </td>
              <td>
                <button onClick={() => removeRow(index)} className="danger">✕</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button
        onClick={onSave}
        disabled={saving || formattedResults.length === 0}
        style={{ marginTop: '16px' }}
      >
        {saving ? 'Сохранение...' : 'Сохранить результаты'}
      </button>
    </div>
  );
}
