import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import type { Transaction } from '../../types/transaction';
import { computeMonthlyAggregates } from '../../lib/financial-metrics';

interface SavingsRateProps {
  transactions: Transaction[];
}

function formatMonth(month: string): string {
  const date = parseISO(month + '-01');
  return format(date, "MMM ''yy");
}

export function SavingsRate({ transactions }: SavingsRateProps) {
  const data = useMemo(() => {
    const aggregates = computeMonthlyAggregates(transactions);
    return aggregates.map((agg) => {
      const rate = agg.income > 0 ? ((agg.income - agg.expenses) / agg.income) * 100 : 0;
      return {
        month: agg.month,
        label: formatMonth(agg.month),
        'Savings Rate': parseFloat(rate.toFixed(1)),
      };
    });
  }, [transactions]);

  return (
    <div>
      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="savingsRateGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#22c55e" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#6b7280' }} />
          <YAxis
            tickFormatter={(value: number) => `${value}%`}
            tick={{ fontSize: 12, fill: '#6b7280' }}
            domain={['auto', 'auto']}
          />
          <Tooltip
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(value: any) => [`${Number(value).toFixed(1)}%`, 'Savings Rate']}
            contentStyle={{
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
            }}
          />
          <Area
            type="monotone"
            dataKey="Savings Rate"
            stroke="#22c55e"
            strokeWidth={2.5}
            fill="url(#savingsRateGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
