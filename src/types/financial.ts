export interface FinancialMetrics {
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  savingsRate: number;
  avgMonthlyIncome: number;
  avgMonthlyExpense: number;
  topExpenseCategory: { name: string; amount: number } | null;
  monthOverMonthChange: number;
}

export interface MonthlyAggregate {
  month: string;
  income: number;
  expenses: number;
  net: number;
  byCategory: Record<string, number>;
}
