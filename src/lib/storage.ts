import Dexie, { type EntityTable } from 'dexie';
import type { Transaction, ImportBatch, Category, CategoryRule } from '../types/transaction';

const db = new Dexie('FinancialToolDB') as Dexie & {
  transactions: EntityTable<Transaction, 'id'>;
  importBatches: EntityTable<ImportBatch, 'id'>;
  categories: EntityTable<Category, 'id'>;
  categoryRules: EntityTable<CategoryRule, 'id'>;
};

db.version(1).stores({
  transactions: 'id, date, categoryId, importBatchId, amount',
  importBatches: 'id, importedAt',
  categories: 'id, name, isDefault',
  categoryRules: 'id, categoryId, priority',
});

db.version(2).stores({
  transactions: 'id, date, categoryId, importBatchId, amount, linkedTransactionId, transactionHash',
  importBatches: 'id, importedAt, fileHash',
  categories: 'id, name, isDefault',
  categoryRules: 'id, categoryId, priority',
});

export { db };
