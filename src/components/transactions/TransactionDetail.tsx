import { useState, useEffect } from 'react';
import { Trash2, Save, Link2, Unlink, Search, Plus } from 'lucide-react';
import type { Transaction } from '../../types/transaction';
import { useTransactionStore } from '../../store/useTransactionStore';
import { useCategoryStore } from '../../store/useCategoryStore';
import { findPotentialMatches, type PotentialMatch } from '../../lib/transaction-linker';
import { CategoryBadge } from '../categories/CategoryBadge';
import { Modal } from '../ui/Modal';

interface TransactionDetailProps {
  transaction: Transaction | null;
  onClose: () => void;
}

export function TransactionDetail({ transaction, onClose }: TransactionDetailProps) {
  const categories = useCategoryStore(s => s.categories);
  const addCategory = useCategoryStore(s => s.addCategory);
  const updateTransaction = useTransactionStore(s => s.updateTransaction);
  const deleteTransaction = useTransactionStore(s => s.deleteTransaction);
  const linkTransactions = useTransactionStore(s => s.linkTransactions);
  const unlinkTransaction = useTransactionStore(s => s.unlinkTransaction);
  const allTransactions = useTransactionStore(s => s.transactions);
  const importBatches = useTransactionStore(s => s.importBatches);

  const [categoryId, setCategoryId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [potentialMatches, setPotentialMatches] = useState<PotentialMatch[] | null>(null);
  const [searchingMatches, setSearchingMatches] = useState(false);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#6366f1');

  useEffect(() => {
    if (transaction) {
      setCategoryId(transaction.categoryId ?? '');
      setNotes(transaction.notes ?? '');
      setConfirmDelete(false);
      setPotentialMatches(null);
      setSearchingMatches(false);
    }
  }, [transaction]);

  if (!transaction) return null;

  const importBatch = importBatches.find(b => b.id === transaction.importBatchId);
  const linkedTransaction = transaction.linkedTransactionId
    ? allTransactions.find(t => t.id === transaction.linkedTransactionId)
    : null;

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Math.abs(amount));
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  function formatImportDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
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

  function handleFindMatches() {
    if (!transaction) return;
    setSearchingMatches(true);
    const matches = findPotentialMatches(transaction, allTransactions);
    setPotentialMatches(matches);
    setSearchingMatches(false);
  }

  async function handleLink(matchId: string) {
    if (!transaction) return;
    await linkTransactions(transaction.id, matchId);
    setPotentialMatches(null);
  }

  async function handleUnlink() {
    if (!transaction) return;
    await unlinkTransaction(transaction.id);
  }

  function scoreBadgeColor(score: number) {
    if (score >= 80) return 'bg-green-100 text-green-700';
    if (score >= 60) return 'bg-yellow-100 text-yellow-700';
    return 'bg-gray-100 text-gray-600';
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
            onChange={e => {
              if (e.target.value === '__new__') {
                setShowNewCategory(true);
              } else {
                setCategoryId(e.target.value);
                setShowNewCategory(false);
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Uncategorized</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
            <option value="__new__">+ Create new category...</option>
          </select>
          {showNewCategory && (
            <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  placeholder="Category name"
                  autoFocus
                  className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="color"
                  value={newCatColor}
                  onChange={e => setNewCatColor(e.target.value)}
                  className="w-9 h-9 rounded-lg border border-gray-300 cursor-pointer"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    if (!newCatName.trim()) return;
                    const id = 'cat-' + crypto.randomUUID();
                    await addCategory({
                      id,
                      name: newCatName.trim(),
                      color: newCatColor,
                      type: 'both',
                      isDefault: false,
                    });
                    setCategoryId(id);
                    setShowNewCategory(false);
                    setNewCatName('');
                    setNewCatColor('#6366f1');
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus size={12} />
                  Create
                </button>
                <button
                  onClick={() => {
                    setShowNewCategory(false);
                    setNewCatName('');
                  }}
                  className="px-3 py-1.5 text-gray-600 text-xs border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
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

        {/* Import Info */}
        {importBatch && (
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Import Info</label>
            <div className="bg-gray-50 rounded-lg border border-gray-200 px-4 py-3">
              <p className="text-sm text-gray-900 font-medium">{importBatch.fileName}</p>
              <p className="text-xs text-gray-500 mt-0.5">Imported {formatImportDate(importBatch.importedAt)}</p>
            </div>
          </div>
        )}

        {/* Linked Transaction */}
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Linked Transaction</label>

          {transaction.isLinkedTransfer && linkedTransaction ? (
            <div className="bg-indigo-50 rounded-lg border border-indigo-200 px-4 py-3 space-y-2">
              <div className="flex items-center gap-2">
                <Link2 size={14} className="text-indigo-600" />
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                  Linked as transfer (excluded from totals)
                </span>
              </div>
              <div className="text-sm text-gray-900">
                <p>{formatDate(linkedTransaction.date)} &middot; {linkedTransaction.description}</p>
                <p className={`font-semibold ${linkedTransaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {linkedTransaction.amount >= 0 ? '+' : '-'}{formatCurrency(linkedTransaction.amount)}
                </p>
                <CategoryBadge categoryId={linkedTransaction.categoryId} size="sm" />
              </div>
              <button
                onClick={handleUnlink}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors"
              >
                <Unlink size={12} />
                Unlink
              </button>
            </div>
          ) : (
            <div>
              {potentialMatches === null ? (
                <button
                  onClick={handleFindMatches}
                  disabled={searchingMatches}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Search size={14} />
                  {searchingMatches ? 'Searching...' : 'Find Related Transactions'}
                </button>
              ) : potentialMatches.length === 0 ? (
                <div className="bg-gray-50 rounded-lg border border-gray-200 px-4 py-3 text-sm text-gray-500">
                  No potential matches found.
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-auto">
                  {potentialMatches.map(match => (
                    <div
                      key={match.transaction.id}
                      className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-2.5"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-gray-500">{formatDate(match.transaction.date)}</span>
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${scoreBadgeColor(match.score)}`}>
                            {match.score}%
                          </span>
                        </div>
                        <p className="text-sm text-gray-900 truncate mt-0.5">{match.transaction.description}</p>
                        <p className={`text-sm font-semibold ${match.transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {match.transaction.amount >= 0 ? '+' : '-'}{formatCurrency(match.transaction.amount)}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{match.reason}</p>
                      </div>
                      <button
                        onClick={() => handleLink(match.transaction.id)}
                        className="ml-3 shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                      >
                        <Link2 size={12} />
                        Link
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
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
