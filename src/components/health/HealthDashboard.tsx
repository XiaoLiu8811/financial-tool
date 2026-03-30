import { useMemo } from 'react';
import type { Transaction } from '../../types/transaction';
import { useCategoryStore } from '../../store/useCategoryStore';
import { computeFinancialMetrics } from '../../lib/financial-metrics';
import { MetricCard } from './MetricCard';

interface HealthDashboardProps {
  transactions: Transaction[];
}

function formatCurrency(value: number): string {
  return '$' + value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function HealthDashboard({ transactions }: HealthDashboardProps) {
  const categories = useCategoryStore((s) => s.categories);

  const metrics = useMemo(
    () => computeFinancialMetrics(transactions, categories),
    [transactions, categories],
  );

  return (
    <div>
      <h3 className="text-base font-semibold text-gray-900 mb-4">Financial Health</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          label="Total Income"
          value={formatCurrency(metrics.totalIncome)}
          color="#16a34a"
        />
        <MetricCard
          label="Total Expenses"
          value={formatCurrency(metrics.totalExpenses)}
          color="#dc2626"
        />
        <MetricCard
          label="Net Savings"
          value={formatCurrency(metrics.netSavings)}
          color={metrics.netSavings >= 0 ? '#16a34a' : '#dc2626'}
        />
        <MetricCard
          label="Savings Rate"
          value={`${metrics.savingsRate.toFixed(1)}%`}
          color={metrics.savingsRate >= 0 ? '#16a34a' : '#dc2626'}
        />
        <MetricCard
          label="Top Expense Category"
          value={
            metrics.topExpenseCategory
              ? `${metrics.topExpenseCategory.name} (${formatCurrency(metrics.topExpenseCategory.amount)})`
              : 'N/A'
          }
          color="#7c3aed"
        />
        <MetricCard
          label="Month-over-Month Change"
          value={`${metrics.monthOverMonthChange >= 0 ? '+' : ''}${metrics.monthOverMonthChange.toFixed(1)}%`}
          trend={{
            value: metrics.monthOverMonthChange,
            label: 'vs last month',
          }}
          color={metrics.monthOverMonthChange <= 0 ? '#16a34a' : '#dc2626'}
        />
      </div>
    </div>
  );
}
