import { useState, useEffect } from 'react';
import { Trash2, Save } from 'lucide-react';
import type { Transaction } from '../../types/transaction';
import { useTransactionStore } from '../../store/useTransactionStore';
import { useCategoryStore } from '../../store/useCategoryStore';
import { Modal } from '../ui/Modal';

interface TransactionDetailProps {
  transaction: Transaction | null;
  onClose: () => void;
}

export function TransactionDetail({ transaction, onClose }: TransactionDetailProps) {
  const categories = useCategoryStore(s => s.categories);
  const updateTransaction = useTransactionStore(s => s.updateTransaction);
  const deleteTransaction = useTransactionStore(s => s.deleteTransaction);

  const [categoryId, setCategoryId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (transaction) {
      setCategoryId(transaction.categoryId ?? '');
      setNotes(transaction.notes ?? '');
      setConfirmDelete(false);
    }
  }, [transaction]);

  if (!transaction) return null;

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Math.abs(amount));
  }

  async function handleSave() {
    if (!transaction) return;
    setSaving(true);
    await updateTransaction(transaction.id, {
      categoryId: categoryId || null,
      categorySource: 'manual',
      notes: notes || undefined,
    });
    setSaving(false);
    onClose();
  }

  async function handleDelete() {
    if (!transaction) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    await deleteTransaction(transaction.id);
    onClose();
  }

  return (
    <Modal open={!!transaction} onClose={onClose} title="Transaction Details">
      <div className="space-y-5">
        {/* Date */}
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Date</label>
          <p className="text-sm text-gray-900">{transaction.date}</p>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Description</label>
          <p className="text-sm text-gray-900">{transaction.description}</p>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Amount</label>
          <p className={`text-lg font-semibold ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {transaction.amount >= 0 ? '+' : '-'}{formatCurrency(transaction.amount)}
          </p>
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Category</label>
          <select
            value={categoryId}
            onChange={e => setCategoryId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Uncategorized</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <p className="text-xs text-gray-400 mt-1">
            Source: {transaction.categorySource === 'auto' ? 'Auto-categorized' : 'Manual'}
          </p>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Notes</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            placeholder="Add notes..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Original CSV Data */}
        {transaction.rawCSVRow && Object.keys(transaction.rawCSVRow).length > 0 && (
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Original CSV Data</label>
            <div className="bg-gray-50 rounded-lg border border-gray-200 divide-y divide-gray-200">
              {Object.entries(transaction.rawCSVRow).map(([key, value]) => (
                <div key={key} className="flex px-3 py-2 text-xs">
                  <span className="font-medium text-gray-600 w-1/3 shrink-0">{key}</span>
                  <span className="text-gray-900 break-all">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <button
            onClick={handleDelete}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg transition-colors ${
              confirmDelete
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'text-red-600 hover:bg-red-50'
            }`}
          >
            <Trash2 size={14} />
            {confirmDelete ? 'Confirm Delete' : 'Delete'}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Save size={14} />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
