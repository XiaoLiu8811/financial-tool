import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import type { Transaction } from '../../types/transaction';
import type { ChartDrillDownContext } from '../../types/chart';
import { computeMonthlyAggregates } from '../../lib/financial-metrics';

interface SpendingTrendProps {
  transactions: Transaction[];
  onDrillDown: (ctx: ChartDrillDownContext) => void;
}

function formatMonth(month: string): string {
  const date = parseISO(month + '-01');
  return format(date, "MMM ''yy");
}

const currencyFormatter = (value: number) =>
  `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

export function SpendingTrend({ transactions, onDrillDown }: SpendingTrendProps) {
  const data = useMemo(() => {
    const aggregates = computeMonthlyAggregates(transactions);
    return aggregates.map((agg) => ({
      month: agg.month,
      label: formatMonth(agg.month),
      Spending: agg.expenses,
    }));
  }, [transactions]);

  const handleDotClick = (monthKey: string) => {
    const filtered = transactions.filter((t) => t.date.slice(0, 7) === monthKey);
    onDrillDown({ type: 'trend-point', month: monthKey, transactions: filtered });
  };

  return (
    <div>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data} onClick={(e: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
            if (e?.activePayload?.[0]?.payload?.month) {
              handleDotClick(e.activePayload[0].payload.month);
            }
          }}>
          <defs>
            <linearGradient id="spendingGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#6b7280' }} />
          <YAxis tickFormatter={currencyFormatter} tick={{ fontSize: 12, fill: '#6b7280' }} />
          <Tooltip
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(value: any) => [currencyFormatter(Number(value)), 'Spending']}
            contentStyle={{
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
            }}
          />
          <Line
            type="monotone"
            dataKey="Spending"
            stroke="url(#spendingGradient)"
            strokeWidth={3}
            dot={{ r: 5, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2, cursor: 'pointer' }}
            activeDot={{
              r: 7,
              fill: '#ec4899',
              stroke: '#fff',
              strokeWidth: 2,
              cursor: 'pointer',
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
