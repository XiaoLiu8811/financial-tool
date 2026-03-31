import { useMemo, useState } from 'react';
import { AlertTriangle, Check, Loader2 } from 'lucide-react';
import type { ColumnMapping, Transaction, ImportBatch } from '../../types/transaction';
import { mapCSVToTransactions, generateTransactionHash } from '../../lib/csv-parser';
import { categorizeTransaction } from '../../lib/categorization-engine';
import { useTransactionStore } from '../../store/useTransactionStore';
import { useCategoryStore } from '../../store/useCategoryStore';

interface ImportPreviewProps {
  rows: Record<string, string>[];
  mapping: ColumnMapping;
  fileName: string;
  onConfirm: () => void;
  onCancel: () => void;
  duplicateHashes?: Set<string>;
  fileHash?: string;
  accountId?: string;
  personId?: string;
  incomeTypeId?: string;
}

type ImportState = 'preview' | 'importing' | 'success' | 'error';

export default function ImportPreview({
  rows,
  mapping,
  fileName,
  onConfirm,
  onCancel,
  duplicateHashes,
  fileHash,
  accountId,
  personId,
  incomeTypeId,
}: ImportPreviewProps) {
  const [importState, setImportState] = useState<ImportState>('preview');
  const [errorMessage, setErrorMessage] = useState('');
  const [skipDuplicates, setSkipDuplicates] = useState(true);

  const addTransactions = useTransactionStore(s => s.addTransactions);
  const rules = useCategoryStore(s => s.rules);

  const mapped = useMemo(() => mapCSVToTransactions(rows, mapping), [rows, mapping]);

  // Compute hash for each mapped row and determine which are duplicates
  const rowHashes = useMemo(() => {
    return mapped.map(row => {
      if (row.error) return null;
      return generateTransactionHash(row.date, row.description, row.amount);
    });
  }, [mapped]);

  const duplicateCount = useMemo(() => {
    if (!duplicateHashes || duplicateHashes.size === 0) return 0;
    return rowHashes.filter(h => h !== null && duplicateHashes.has(h)).length;
  }, [rowHashes, duplicateHashes]);

  const errorCount = useMemo(() => mapped.filter(r => r.error).length, [mapped]);
  const validCount = mapped.length - errorCount;
  const importableCount = skipDuplicates ? validCount - duplicateCount : validCount;

  const previewRows = mapped.slice(0, 10);

  async function handleConfirm() {
    setImportState('importing');
    try {
      const batchId = crypto.randomUUID();

      const transactions: Transaction[] = mapped
        .filter((r, idx) => {
          if (r.error) return false;
          // Skip duplicates if the option is enabled
          if (skipDuplicates && duplicateHashes && duplicateHashes.size > 0) {
            const hash = rowHashes[idx];
            if (hash && duplicateHashes.has(hash)) return false;
          }
          return true;
        })
        .map(r => {
          const { categoryId } = categorizeTransaction(r.description, r.amount, rules);
          const txHash = generateTransactionHash(r.date, r.description, r.amount);
          return {
            id: crypto.randomUUID(),
            date: r.date,
            description: r.description,
            amount: r.amount,
            categoryId,
            categorySource: 'auto' as const,
            importBatchId: batchId,
            rawCSVRow: r.rawCSVRow,
            transactionHash: txHash,
            accountId,
            personId,
            ...(incomeTypeId && r.amount >= 0 ? { incomeTypeId } : {}),
          };
        });

      const batch: ImportBatch = {
        id: batchId,
        fileName,
        importedAt: new Date().toISOString(),
        transactionCount: transactions.length,
        columnMapping: mapping,
        fileHash,
        accountId,
        personId,
      };

      await addTransactions(transactions, batch);
      setImportState('success');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'An unexpected error occurred');
      setImportState('error');
    }
  }

  // --- Success state ---
  if (importState === 'success') {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Import Complete</h3>
        <p className="text-sm text-gray-600">
          Successfully imported {importableCount} transaction{importableCount !== 1 ? 's' : ''} from{' '}
          <span className="font-medium">{fileName}</span>.
        </p>
        {errorCount > 0 && (
          <p className="text-xs text-amber-600">
            {errorCount} row{errorCount !== 1 ? 's' : ''} skipped due to errors.
          </p>
        )}
        <button
          onClick={onConfirm}
          className="mt-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Done
        </button>
      </div>
    );
  }

  // --- Importing state ---
  if (importState === 'importing') {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
        <p className="text-sm font-medium text-gray-700">
          Importing {importableCount} transactions...
        </p>
        <p className="text-xs text-gray-500">Categorizing and saving to database</p>
      </div>
    );
  }

  // --- Error state ---
  if (importState === 'error') {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <AlertTriangle className="h-8 w-8 text-red-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Import Failed</h3>
        <p className="text-sm text-red-600">{errorMessage}</p>
        <button
          onClick={onCancel}
          className="mt-2 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Go Back
        </button>
      </div>
    );
  }

  // --- Preview state ---
  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex gap-4">
        <div className="rounded-lg bg-blue-50 px-4 py-2">
          <p className="text-xs text-blue-600">Transactions</p>
          <p className="text-lg font-semibold text-blue-900">{validCount}</p>
        </div>
        {errorCount > 0 && (
          <div className="rounded-lg bg-red-50 px-4 py-2">
            <p className="text-xs text-red-600">Errors</p>
            <p className="text-lg font-semibold text-red-900">{errorCount}</p>
          </div>
        )}
        {duplicateCount > 0 && (
          <div className="rounded-lg bg-amber-50 px-4 py-2">
            <p className="text-xs text-amber-600">Duplicates</p>
            <p className="text-lg font-semibold text-amber-900">{duplicateCount}</p>
          </div>
        )}
      </div>

      {/* Duplicate controls */}
      {duplicateCount > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-amber-800">
              <span className="font-medium">{duplicateCount}</span> of{' '}
              <span className="font-medium">{validCount}</span> transactions are duplicates and will be{' '}
              {skipDuplicates ? 'skipped' : 'imported'}.
            </p>
            <label className="flex items-center gap-2 text-sm text-amber-800 cursor-pointer">
              <input
                type="checkbox"
                checked={skipDuplicates}
                onChange={e => setSkipDuplicates(e.target.checked)}
                className="h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
              />
              Skip duplicates
            </label>
          </div>
        </div>
      )}

      {/* Preview table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">#</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Date</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Description</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">Amount</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {previewRows.map((row, idx) => {
              const hasError = !!row.error;
              const hash = rowHashes[idx];
              const isDuplicate = !hasError && hash !== null && duplicateHashes?.has(hash);
              return (
                <tr
                  key={idx}
                  className={
                    hasError
                      ? 'bg-red-50'
                      : isDuplicate
                        ? 'bg-amber-50'
                        : idx % 2 === 0
                          ? 'bg-white'
                          : 'bg-gray-50/50'
                  }
                >
                  <td className="whitespace-nowrap px-4 py-2.5 text-gray-400">{idx + 1}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-gray-900">
                    {row.date || '--'}
                  </td>
                  <td className="max-w-xs truncate px-4 py-2.5 text-gray-900">
                    {row.description || '--'}
                  </td>
                  <td
                    className={`whitespace-nowrap px-4 py-2.5 text-right font-mono ${
                      row.amount >= 0 ? 'text-green-700' : 'text-gray-900'
                    }`}
                  >
                    {hasError ? '--' : row.amount.toFixed(2)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5">
                    {hasError ? (
                      <span className="inline-flex items-center gap-1 text-xs text-red-600">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        {row.error}
                      </span>
                    ) : isDuplicate ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                        Already imported
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600">
                        <Check className="h-3.5 w-3.5" />
                        OK
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {mapped.length > 10 && (
        <p className="text-xs text-gray-500">
          Showing first 10 of {mapped.length} rows
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleConfirm}
          disabled={importableCount === 0}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
        >
          Import {importableCount} Transaction{importableCount !== 1 ? 's' : ''}
        </button>
        <button
          onClick={onCancel}
          className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
