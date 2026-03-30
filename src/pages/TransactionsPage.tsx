import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpDown, Upload, ChevronDown, ChevronUp, Eye, Trash2, X } from 'lucide-react';
import { useFilteredTransactions } from '../hooks/useFilteredTransactions';
import { useTransactionStore } from '../store/useTransactionStore';
import { TransactionTable } from '../components/transactions/TransactionTable';
import { EmptyState } from '../components/ui/EmptyState';

export function TransactionsPage() {
  const allTransactions = useFilteredTransactions();
  const importBatches = useTransactionStore(s => s.importBatches);
  const deleteImportBatch = useTransactionStore(s => s.deleteImportBatch);
  const navigate = useNavigate();

  const [showBatches, setShowBatches] = useState(false);
  const [batchFilter, setBatchFilter] = useState<string | null>(null);
  const [confirmDeleteBatch, setConfirmDeleteBatch] = useState<string | null>(null);

  const transactions = batchFilter
    ? allTransactions.filter(t => t.importBatchId === batchFilter)
    : allTransactions;

  const activeBatch = batchFilter
    ? importBatches.find(b => b.id === batchFilter)
    : null;

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  async function handleDeleteBatch(batchId: string) {
    if (confirmDeleteBatch !== batchId) {
      setConfirmDeleteBatch(batchId);
      return;
    }
    await deleteImportBatch(batchId);
    setConfirmDeleteBatch(null);
    if (batchFilter === batchId) {
      setBatchFilter(null);
    }
  }

  if (allTransactions.length === 0) {
    return (
      <EmptyState
        icon={<ArrowUpDown size={48} />}
        title="No transactions"
        description="Import a CSV file to see your transactions here."
        action={
          <button
            onClick={() => navigate('/import')}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
          >
            <Upload size={16} className="inline mr-2" />
            Import CSV
          </button>
        }
      />
    );
  }

  return (
    <div>
      {/* Import Batches Section */}
      {importBatches.length > 0 && (
        <div className="mb-4">
          <button
            onClick={() => setShowBatches(!showBatches)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Manage Imports
            {showBatches ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showBatches && (
            <div className="mt-3 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-medium text-gray-600">File Name</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Imported Date</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Transactions</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {importBatches.map(batch => (
                    <tr key={batch.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-900 font-medium">{batch.fileName}</td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(batch.importedAt)}</td>
                      <td className="px-4 py-3 text-right text-gray-700">{batch.transactionCount}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => {
                              setBatchFilter(batch.id);
                              setShowBatches(false);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                          >
                            <Eye size={12} />
                            View
                          </button>
                          <button
                            onClick={() => handleDeleteBatch(batch.id)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
                              confirmDeleteBatch === batch.id
                                ? 'bg-red-600 text-white hover:bg-red-700'
                                : 'text-red-600 bg-red-50 hover:bg-red-100'
                            }`}
                          >
                            <Trash2 size={12} />
                            {confirmDeleteBatch === batch.id ? 'Confirm' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Batch Filter Banner */}
      {activeBatch && (
        <div className="mb-4 flex items-center justify-between px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg">
          <span className="text-sm text-blue-800">
            Showing transactions from <strong>{activeBatch.fileName}</strong>
          </span>
          <button
            onClick={() => setBatchFilter(null)}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-md transition-colors"
          >
            <X size={14} />
            Clear filter
          </button>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Transactions</h2>
        <span className="text-sm text-gray-500">{transactions.length} total</span>
      </div>
      <TransactionTable transactions={transactions} />
    </div>
  );
}
