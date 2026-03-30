export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  categoryId: string | null;
  categorySource: 'auto' | 'manual';
  notes?: string;
  importBatchId: string;
  rawCSVRow?: Record<string, string>;
  linkedTransactionId?: string;
  isLinkedTransfer?: boolean;
  transactionHash?: string;
}

export interface ImportBatch {
  id: string;
  fileName: string;
  importedAt: string;
  transactionCount: number;
  columnMapping: ColumnMapping;
  fileHash?: string;
}

export interface ColumnMapping {
  date: string;
  description: string;
  amount: string;
  income?: string;
  expense?: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon?: string;
  isDefault: boolean;
  type: 'expense' | 'income' | 'both';
}

export interface CategoryRule {
  id: string;
  categoryId: string;
  keywords: string[];
  priority: number;
  isRegex: boolean;
  caseSensitive: boolean;
}
