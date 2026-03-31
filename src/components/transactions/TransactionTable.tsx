import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Trash2, Tags } from 'lucide-react';
import type { Transaction } from '../../types/transaction';
import { useCategoryStore } from '../../store/useCategoryStore';
import { useTransactionStore } from '../../store/useTransactionStore';
import { useHouseholdStore } from '../../store/useHouseholdStore';
import { CategoryBadge } from '../categories/CategoryBadge';
import { TransactionDetail } from './TransactionDetail';

interface TransactionTableProps {
  transactions: Transaction[];
}

type SortKey = 'date' | 'description' | 'amount' | 'categoryId' | 'accountId' | 'personId';
type SortDir = 'asc' | 'desc';

const PAGE_SIZE = 25;

export function TransactionTable({ transactions }: TransactionTableProps) {
  const categories = useCategoryStore(s => s.categories);
  const { bulkDeleteTransactions, bulkUpdateCategory } = useTransactionStore();
  const { accounts, members } = useHouseholdStore();

  const accountMap = useMemo(() => new Map(accounts.map(a => [a.id, a])), [accounts]);
  const memberMap = useMemo(() => new Map(members.map(m => [m.id, m])), [members]);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(0);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const lastClickedIndexRef = useRef<number | null>(null);

  const filtered = useMemo(() => {
    let result = transactions;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(t => t.description.toLowerCase().includes(q));
    }

    if (categoryFilter !== 'all') {
      if (categoryFilter === 'uncategorized') {
        result = result.filter(t => !t.categoryId);
      } else {
        result = result.filter(t => t.categoryId === categoryFilter);
      }
    }

    return result;
  }, [transactions, search, categoryFilter]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'date':
          cmp = a.date.localeCompare(b.date);
          break;
        case 'description':
          cmp = a.description.localeCompare(b.description);
          break;
        case 'amount':
          cmp = a.amount - b.amount;
          break;
        case 'categoryId':
          cmp = (a.categoryId ?? '').localeCompare(b.categoryId ?? '');
          break;
        case 'accountId': {
          const aName = (a.accountId && accountMap.get(a.accountId)?.name) ?? '';
          const bName = (b.accountId && accountMap.get(b.accountId)?.name) ?? '';
          cmp = aName.localeCompare(bName);
          break;
        }
        case 'personId': {
          const aName = (a.personId && memberMap.get(a.personId)?.name) ?? '';
          const bName = (b.personId && memberMap.get(b.personId)?.name) ?? '';
          cmp = aName.localeCompare(bName);
          break;
        }
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return copy;
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageRows = sorted.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  // Clear selection when filters or page change
  useEffect(() => {
    setSelectedIds(new Set());
    setConfirmingDelete(false);
    lastClickedIndexRef.current = null;
  }, [search, categoryFilter, page, sortKey, sortDir]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(0);
  }

  // Select-all toggles only the visible page rows
  const handleSelectAll = useCallback(() => {
    setSelectedIds(prev => {
      const allPageIds = pageRows.map(t => t.id);
      const allSelected = allPageIds.every(id => prev.has(id));
      if (allSelected) {
        // Deselect all visible
        const next = new Set(prev);
        allPageIds.forEach(id => next.delete(id));
        return next;
      } else {
        // Select all visible
        const next = new Set(prev);
        allPageIds.forEach(id => next.add(id));
        return next;
      }
    });
    setConfirmingDelete(false);
  }, [pageRows]);

  const handleRowCheckbox = useCallback((txId: string, index: number, shiftKey: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);

      if (shiftKey && lastClickedIndexRef.current !== null) {
        const start = Math.min(lastClickedIndexRef.current, index);
        const end = Math.max(lastClickedIndexRef.current, index);
        for (let i = start; i <= end; i++) {
          next.add(pageRows[i].id);
        }
      } else {
        if (next.has(txId)) {
          next.delete(txId);
        } else {
          next.add(txId);
        }
      }

      return next;
    });
    lastClickedIndexRef.current = index;
    setConfirmingDelete(false);
  }, [pageRows]);

  const handleBulkDelete = useCallback(async () => {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    const ids = Array.from(selectedIds);
    await bulkDeleteTransactions(ids);
    setSelectedIds(new Set());
    setConfirmingDelete(false);
    lastClickedIndexRef.current = null;
  }, [confirmingDelete, selectedIds, bulkDeleteTransactions]);

  const handleBulkCategoryChange = useCallback(async (categoryId: string) => {
    if (!categoryId) return;
    const ids = Array.from(selectedIds);
    await bulkUpdateCategory(ids, categoryId, 'manual');
    setSelectedIds(new Set());
    setConfirmingDelete(false);
    lastClickedIndexRef.current = null;
  }, [selectedIds, bulkUpdateCategory]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setConfirmingDelete(false);
    lastClickedIndexRef.current = null;
  }, []);

  const allPageSelected = pageRows.length > 0 && pageRows.every(t => selectedIds.has(t.id));
  const somePageSelected = pageRows.some(t => selectedIds.has(t.id));

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ChevronUp size={14} className="opacity-0 group-hover:opacity-30" />;
    return sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Math.abs(amount));
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={e => { setCategoryFilter(e.target.value); setPage(0); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Categories</option>
          <option value="uncategorized">Uncategorized</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-blue-100 border border-blue-200 rounded-xl shadow-sm">
          <span className="text-sm font-medium text-blue-800">
            {selectedIds.size} selected
          </span>
          <div className="flex items-center gap-2">
            <div className="relative inline-flex items-center">
              <Tags size={14} className="absolute left-2.5 text-gray-500 pointer-events-none" />
              <select
                defaultValue=""
                onChange={e => {
                  handleBulkCategoryChange(e.target.value);
                  e.target.value = '';
                }}
                className="pl-8 pr-3 py-1.5 text-sm border border-blue-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="" disabled>
                  Change Category...
                </option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
              </select>
            </div>
            <button
              onClick={handleBulkDelete}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                confirmingDelete
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-red-100 text-red-700 hover:bg-red-200'
              }`}
            >
              <Trash2 size={14} />
              {confirmingDelete ? `Confirm Delete ${selectedIds.size}?` : 'Delete Selected'}
            </button>
            <button
              onClick={clearSelection}
              className="px-3 py-1.5 text-sm text-blue-700 hover:bg-blue-200 rounded-lg transition-colors"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="w-10 px-3 py-3">
                  <input
                    type="checkbox"
                    checked={allPageSelected}
                    ref={el => {
                      if (el) el.indeterminate = somePageSelected && !allPageSelected;
                    }}
                    onChange={handleSelectAll}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                {([['date', 'Date'], ['description', 'Description'], ['amount', 'Amount'], ['categoryId', 'Category'], ['accountId', 'Account'], ['personId', 'Person']] as [SortKey, string][]).map(([key, label]) => (
                  <th
                    key={key}
                    onClick={() => handleSort(key)}
                    className="group px-4 py-3 text-left font-medium text-gray-600 cursor-pointer select-none hover:bg-gray-100 transition-colors"
                  >
                    <span className="inline-flex items-center gap-1">
                      {label}
                      <SortIcon col={key} />
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                pageRows.map((tx, index) => {
                  const isSelected = selectedIds.has(tx.id);
                  return (
                    <tr
                      key={tx.id}
                      className={`border-b border-gray-100 last:border-0 cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-50' : 'hover:bg-blue-50/50'
                      }`}
                    >
                      <td className="w-10 px-3 py-3" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          onClick={e => {
                            e.stopPropagation();
                            handleRowCheckbox(tx.id, index, e.shiftKey);
                          }}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap" onClick={() => setSelectedTx(tx)}>{tx.date}</td>
                      <td className="px-4 py-3 text-gray-900 font-medium max-w-xs truncate" onClick={() => setSelectedTx(tx)}>{tx.description}</td>
                      <td className={`px-4 py-3 whitespace-nowrap font-medium ${tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}`} onClick={() => setSelectedTx(tx)}>
                        {tx.amount >= 0 ? '+' : '-'}{formatCurrency(tx.amount)}
                      </td>
                      <td className="px-4 py-3" onClick={() => setSelectedTx(tx)}>
                        <CategoryBadge categoryId={tx.categoryId} size="sm" />
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap" onClick={() => setSelectedTx(tx)}>
                        {tx.accountId ? accountMap.get(tx.accountId)?.name ?? '--' : '--'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap" onClick={() => setSelectedTx(tx)}>
                        {tx.personId && memberMap.get(tx.personId) ? (
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
                            style={{ backgroundColor: memberMap.get(tx.personId)!.color }}
                          >
                            {memberMap.get(tx.personId)!.name}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">--</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {sorted.length > PAGE_SIZE && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <span className="text-sm text-gray-500">
              Showing {safePage * PAGE_SIZE + 1}–{Math.min((safePage + 1) * PAGE_SIZE, sorted.length)} of {sorted.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={safePage === 0}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={14} /> Prev
              </button>
              <span className="text-sm text-gray-600">
                Page {safePage + 1} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={safePage >= totalPages - 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <TransactionDetail
        transaction={selectedTx}
        onClose={() => setSelectedTx(null)}
      />
    </div>
  );
}
