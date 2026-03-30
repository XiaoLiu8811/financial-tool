import { create } from 'zustand';
import { db } from '../lib/storage';
import type { Transaction, ImportBatch } from '../types/transaction';

interface TransactionState {
  transactions: Transaction[];
  importBatches: ImportBatch[];
  isLoading: boolean;
  loadTransactions: () => Promise<void>;
  addTransactions: (transactions: Transaction[], batch: ImportBatch) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  deleteImportBatch: (batchId: string) => Promise<void>;
  bulkUpdateCategory: (ids: string[], categoryId: string, source: 'auto' | 'manual') => Promise<void>;
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  importBatches: [],
  isLoading: false,

  async loadTransactions() {
    set({ isLoading: true });
    const [transactions, importBatches] = await Promise.all([
      db.transactions.toArray(),
      db.importBatches.toArray(),
    ]);
    set({ transactions, importBatches, isLoading: false });
  },

  async addTransactions(transactions, batch) {
    await db.transactions.bulkAdd(transactions);
    await db.importBatches.add(batch);
    set({
      transactions: [...get().transactions, ...transactions],
      importBatches: [...get().importBatches, batch],
    });
  },

  async updateTransaction(id, updates) {
    await db.transactions.update(id, updates);
    set({
      transactions: get().transactions.map(t => t.id === id ? { ...t, ...updates } : t),
    });
  },

  async deleteTransaction(id) {
    await db.transactions.delete(id);
    set({ transactions: get().transactions.filter(t => t.id !== id) });
  },

  async deleteImportBatch(batchId) {
    await db.transactions.where('importBatchId').equals(batchId).delete();
    await db.importBatches.delete(batchId);
    set({
      transactions: get().transactions.filter(t => t.importBatchId !== batchId),
      importBatches: get().importBatches.filter(b => b.id !== batchId),
    });
  },

  async bulkUpdateCategory(ids, categoryId, source) {
    await Promise.all(ids.map(id => db.transactions.update(id, { categoryId, categorySource: source })));
    set({
      transactions: get().transactions.map(t =>
        ids.includes(t.id) ? { ...t, categoryId, categorySource: source } : t
      ),
    });
  },
}));
