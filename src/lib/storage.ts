import Dexie, { type EntityTable } from 'dexie';
import type { Transaction, ImportBatch, Category, CategoryRule, Account, HouseholdMember, IncomeType } from '../types/transaction';

const db = new Dexie('FinancialToolDB') as Dexie & {
  transactions: EntityTable<Transaction, 'id'>;
  importBatches: EntityTable<ImportBatch, 'id'>;
  categories: EntityTable<Category, 'id'>;
  categoryRules: EntityTable<CategoryRule, 'id'>;
  accounts: EntityTable<Account, 'id'>;
  householdMembers: EntityTable<HouseholdMember, 'id'>;
  incomeTypes: EntityTable<IncomeType, 'id'>;
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

db.version(3).stores({
  transactions: 'id, date, categoryId, importBatchId, amount, linkedTransactionId, transactionHash, accountId, personId',
  importBatches: 'id, importedAt, fileHash',
  categories: 'id, name, isDefault',
  categoryRules: 'id, categoryId, priority',
  accounts: 'id, institution',
  householdMembers: 'id, name',
  incomeTypes: 'id, name, isDefault',
});

export { db };
