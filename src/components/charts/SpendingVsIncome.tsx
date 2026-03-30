import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import type { Transaction } from '../../types/transaction';
import type { ChartDrillDownContext } from '../../types/chart';
import { computeMonthlyAggregates } from '../../lib/financial-metrics';

interface SpendingVsIncomeProps {
  transactions: Transaction[];
  onDrillDown: (ctx: ChartDrillDownContext) => void;
}

function formatMonth(month: string): string {
  const date = parseISO(month + '-01');
  return format(date, "MMM ''yy");
}

const currencyFormatter = (value: number) =>
  `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

export function SpendingVsIncome({ transactions, onDrillDown }: SpendingVsIncomeProps) {
  const data = useMemo(() => {
    const aggregates = computeMonthlyAggregates(transactions);
    return aggregates.map((agg) => ({
      month: agg.month,
      label: formatMonth(agg.month),
      Income: agg.income,
      Expenses: agg.expenses,
    }));
  }, [transactions]);

  const handleBarClick = (monthKey: string) => {
    const filtered = transactions.filter((t) => {
      const tMonth = t.date.slice(0, 7);
      return tMonth === monthKey;
    });
    onDrillDown({ type: 'month', month: monthKey, transactions: filtered });
  };

  return (
    <div>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#6b7280' }} />
          <YAxis tickFormatter={currencyFormatter} tick={{ fontSize: 12, fill: '#6b7280' }} />
          <Tooltip
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(value: any, name: any) => [currencyFormatter(Number(value)), String(name)]}
            contentStyle={{
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
            }}
          />
          <Legend />
          <Bar
            dataKey="Income"
            fill="#22c55e"
            radius={[4, 4, 0, 0]}
            cursor="pointer"
            onClick={(_data: unknown, index: number) => handleBarClick(data[index].month)}
          />
          <Bar
            dataKey="Expenses"
            fill="#ef4444"
            radius={[4, 4, 0, 0]}
            cursor="pointer"
            onClick={(_data: unknown, index: number) => handleBarClick(data[index].month)}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
