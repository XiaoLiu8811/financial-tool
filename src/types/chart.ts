import type { Transaction } from './transaction';

export interface ChartDrillDownContext {
  type: 'month' | 'category' | 'trend-point';
  month?: string;
  categoryId?: string;
  transactions: Transaction[];
}
