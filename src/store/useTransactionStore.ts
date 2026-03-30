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
  bulkDeleteTransactions: (ids: string[]) => Promise<void>;
  deleteImportBatch: (batchId: string) => Promise<void>;
  bulkUpdateCategory: (ids: string[], categoryId: string, source: 'auto' | 'manual') => Promise<void>;
  linkTransactions: (id1: string, id2: string) => Promise<void>;
  unlinkTransaction: (id: string) => Promise<void>;
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
    // If this transaction is linked, unlink the partner first
    const txn = get().transactions.find(t => t.id === id);
    if (txn?.linkedTransactionId) {
      await db.transactions.update(txn.linkedTransactionId, { linkedTransactionId: undefined, isLinkedTransfer: false });
    }
    await db.transactions.delete(id);
    set({
      transactions: get().transactions
        .filter(t => t.id !== id)
        .map(t => t.linkedTransactionId === id ? { ...t, linkedTransactionId: undefined, isLinkedTransfer: false } : t),
    });
  },

  async bulkDeleteTransactions(ids) {
    // Unlink any partners of deleted transactions
    const toDelete = new Set(ids);
    const partnerUpdates: string[] = [];
    for (const t of get().transactions) {
      if (toDelete.has(t.id) && t.linkedTransactionId && !toDelete.has(t.linkedTransactionId)) {
        partnerUpdates.push(t.linkedTransactionId);
      }
    }
    await Promise.all(partnerUpdates.map(pid => db.transactions.update(pid, { linkedTransactionId: undefined, isLinkedTransfer: false })));
    await db.transactions.bulkDelete(ids);
    set({
      transactions: get().transactions
        .filter(t => !toDelete.has(t.id))
        .map(t => partnerUpdates.includes(t.id) ? { ...t, linkedTransactionId: undefined, isLinkedTransfer: false } : t),
    });
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

  async linkTransactions(id1, id2) {
    await Promise.all([
      db.transactions.update(id1, { linkedTransactionId: id2, isLinkedTransfer: true }),
      db.transactions.update(id2, { linkedTransactionId: id1, isLinkedTransfer: true }),
    ]);
    set({
      transactions: get().transactions.map(t => {
        if (t.id === id1) return { ...t, linkedTransactionId: id2, isLinkedTransfer: true };
        if (t.id === id2) return { ...t, linkedTransactionId: id1, isLinkedTransfer: true };
        return t;
      }),
    });
  },

  async unlinkTransaction(id) {
    const txn = get().transactions.find(t => t.id === id);
    const partnerId = txn?.linkedTransactionId;
    await db.transactions.update(id, { linkedTransactionId: undefined, isLinkedTransfer: false });
    if (partnerId) {
      await db.transactions.update(partnerId, { linkedTransactionId: undefined, isLinkedTransfer: false });
    }
    set({
      transactions: get().transactions.map(t => {
        if (t.id === id || t.id === partnerId) return { ...t, linkedTransactionId: undefined, isLinkedTransfer: false };
        return t;
      }),
    });
  },
}));
