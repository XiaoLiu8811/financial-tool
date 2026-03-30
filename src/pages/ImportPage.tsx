import { useState, useMemo } from 'react';
import CSVDropZone from '../components/import/CSVDropZone';
import ImportPreview from '../components/import/ImportPreview';
import { parseCSVFile, autoDetectMapping, mapCSVToTransactions } from '../lib/csv-parser';
import type { ColumnMapping } from '../types/transaction';

export function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping | null>(null);
  const [splitMode, setSplitMode] = useState(false);

  const handleFileSelected = async (f: File) => {
    setFile(f);
    const result = await parseCSVFile(f);
    setHeaders(result.headers);
    setRows(result.rows);

    // Auto-detect columns immediately
    const detected = autoDetectMapping(result.headers);
    setSplitMode(detected.mode === 'split');
    setMapping({
      date: detected.date,
      description: detected.description,
      amount: detected.amount,
      ...(detected.mode === 'split' ? { income: detected.income, expense: detected.expense } : {}),
    });
  };

  const handleReset = () => {
    setFile(null);
    setHeaders([]);
    setRows([]);
    setMapping(null);
    setSplitMode(false);
  };

  // Preview of mapped data to show alongside column config
  const previewData = useMemo(() => {
    if (!mapping || rows.length === 0) return [];
    return mapCSVToTransactions(rows.slice(0, 3), mapping);
  }, [rows, mapping]);

  const selectClasses = 'block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500';

  // Has file + mapping ready
  if (file && mapping && rows.length > 0) {
    const isValid = mapping.date && mapping.description && (splitMode ? (mapping.income && mapping.expense) : mapping.amount);

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Import CSV</h2>
          <button
            onClick={handleReset}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Choose a different file
          </button>
        </div>

        {/* File info */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-700">
            <span className="font-medium">{file.name}</span>
            <span className="text-gray-400 mx-2">·</span>
            {rows.length} rows
            <span className="text-gray-400 mx-2">·</span>
            {headers.length} columns: <span className="text-gray-500">{headers.join(', ')}</span>
          </p>
        </div>

        {/* Column mapping - compact inline form */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-1">Column Mapping</h3>
          <p className="text-xs text-gray-500 mb-4">
            We auto-detected your columns. Adjust if needed.
          </p>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Date Column</label>
              <select className={selectClasses} value={mapping.date} onChange={e => setMapping({ ...mapping, date: e.target.value })}>
                <option value="">-- Select --</option>
                {headers.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Description Column</label>
              <select className={selectClasses} value={mapping.description} onChange={e => setMapping({ ...mapping, description: e.target.value })}>
                <option value="">-- Select --</option>
                {headers.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            {!splitMode ? (
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Amount Column</label>
                <select className={selectClasses} value={mapping.amount} onChange={e => setMapping({ ...mapping, amount: e.target.value })}>
                  <option value="">-- Select --</option>
                  {headers.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            ) : (
              <>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Income/Credit Column</label>
                  <select className={selectClasses} value={mapping.income ?? ''} onChange={e => setMapping({ ...mapping, income: e.target.value })}>
                    <option value="">-- Select --</option>
                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Expense/Debit Column</label>
                  <select className={selectClasses} value={mapping.expense ?? ''} onChange={e => setMapping({ ...mapping, expense: e.target.value })}>
                    <option value="">-- Select --</option>
                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </>
            )}
          </div>

          <label className="flex items-center gap-2 mt-3 text-xs text-gray-500 cursor-pointer">
            <input
              type="checkbox"
              checked={splitMode}
              onChange={e => {
                setSplitMode(e.target.checked);
                if (e.target.checked) {
                  const detected = autoDetectMapping(headers);
                  setMapping({ ...mapping, amount: '', income: detected.income, expense: detected.expense });
                } else {
                  const detected = autoDetectMapping(headers);
                  setMapping({ ...mapping, amount: detected.amount, income: undefined, expense: undefined });
                }
              }}
              className="h-3.5 w-3.5 rounded border-gray-300"
            />
            My CSV has separate credit/debit columns
          </label>

          {/* Live preview of first 3 rows */}
          {previewData.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-500 mb-2">Preview (first 3 rows)</p>
              <div className="overflow-x-auto rounded-lg border border-gray-100">
                <table className="min-w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">Date</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">Description</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-500">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {previewData.map((row, i) => (
                      <tr key={i} className={row.error ? 'bg-red-50' : ''}>
                        <td className="px-3 py-1.5 text-gray-700">{row.date || <span className="text-red-500">Invalid</span>}</td>
                        <td className="px-3 py-1.5 text-gray-700 max-w-xs truncate">{row.description || '--'}</td>
                        <td className={`px-3 py-1.5 text-right font-mono ${row.error ? 'text-red-500' : row.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {row.error ? 'Error' : `${row.amount >= 0 ? '+' : ''}$${Math.abs(row.amount).toFixed(2)}`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Full preview + import */}
        {isValid && (
          <ImportPreview
            rows={rows}
            mapping={mapping}
            fileName={file.name}
            onConfirm={handleReset}
            onCancel={handleReset}
          />
        )}
      </div>
    );
  }

  // Initial upload state
  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-xl font-bold text-gray-900 mb-2">Import CSV</h2>
      <p className="text-sm text-gray-500 mb-6">Upload a bank statement or transaction export. We'll auto-detect the columns.</p>
      <CSVDropZone onFileSelected={handleFileSelected} />
    </div>
  );
}
