import { format, parseISO } from 'date-fns';
import type { Transaction, Category } from '../types/transaction';
import type { FinancialMetrics, MonthlyAggregate } from '../types/financial';

export function computeMonthlyAggregates(transactions: Transaction[]): MonthlyAggregate[] {
  const byMonth = new Map<string, MonthlyAggregate>();

  for (const t of transactions) {
    const month = format(parseISO(t.date), 'yyyy-MM');
    let agg = byMonth.get(month);
    if (!agg) {
      agg = { month, income: 0, expenses: 0, net: 0, byCategory: {} };
      byMonth.set(month, agg);
    }

    if (t.amount >= 0) {
      agg.income += t.amount;
    } else {
      agg.expenses += Math.abs(t.amount);
    }
    agg.net = agg.income - agg.expenses;

    const catId = t.categoryId ?? 'cat-uncategorized';
    agg.byCategory[catId] = (agg.byCategory[catId] ?? 0) + Math.abs(t.amount);
  }

  return Array.from(byMonth.values()).sort((a, b) => a.month.localeCompare(b.month));
}

export function computeFinancialMetrics(
  transactions: Transaction[],
  categories: Category[],
): FinancialMetrics {
  const totalIncome = transactions.filter(t => t.amount >= 0).reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const netSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

  const aggregates = computeMonthlyAggregates(transactions);
  const numMonths = Math.max(aggregates.length, 1);
  const avgMonthlyIncome = totalIncome / numMonths;
  const avgMonthlyExpense = totalExpenses / numMonths;

  // Top expense category
  const expenseByCategory = new Map<string, number>();
  for (const t of transactions.filter(tx => tx.amount < 0)) {
    const catId = t.categoryId ?? 'cat-uncategorized';
    expenseByCategory.set(catId, (expenseByCategory.get(catId) ?? 0) + Math.abs(t.amount));
  }

  let topExpenseCategory: FinancialMetrics['topExpenseCategory'] = null;
  let maxExpense = 0;
  for (const [catId, amount] of expenseByCategory) {
    if (amount > maxExpense) {
      maxExpense = amount;
      const cat = categories.find(c => c.id === catId);
      topExpenseCategory = { name: cat?.name ?? 'Unknown', amount };
    }
  }

  // Month-over-month change
  let monthOverMonthChange = 0;
  if (aggregates.length >= 2) {
    const last = aggregates[aggregates.length - 1].expenses;
    const prev = aggregates[aggregates.length - 2].expenses;
    monthOverMonthChange = prev > 0 ? ((last - prev) / prev) * 100 : 0;
  }

  return {
    totalIncome,
    totalExpenses,
    netSavings,
    savingsRate,
    avgMonthlyIncome,
    avgMonthlyExpense,
    topExpenseCategory,
    monthOverMonthChange,
  };
}
