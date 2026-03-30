import { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { Transaction } from '../../types/transaction';
import type { ChartDrillDownContext } from '../../types/chart';
import { useCategoryStore } from '../../store/useCategoryStore';

interface CategoryBreakdownProps {
  transactions: Transaction[];
  onDrillDown: (ctx: ChartDrillDownContext) => void;
}

const FALLBACK_COLORS = [
  '#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#3b82f6', '#84cc16',
];

const currencyFormatter = (value: number) =>
  `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function CategoryBreakdown({ transactions, onDrillDown }: CategoryBreakdownProps) {
  const categories = useCategoryStore((s) => s.categories);

  const data = useMemo(() => {
    const expenses = transactions.filter((t) => t.amount < 0);
    const byCat = new Map<string, number>();

    for (const t of expenses) {
      const catId = t.categoryId ?? 'cat-uncategorized';
      byCat.set(catId, (byCat.get(catId) ?? 0) + Math.abs(t.amount));
    }

    return Array.from(byCat.entries())
      .map(([catId, amount]) => {
        const cat = categories.find((c) => c.id === catId);
        return {
          categoryId: catId,
          name: cat?.name ?? 'Uncategorized',
          value: amount,
          color: cat?.color ?? FALLBACK_COLORS[0],
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [transactions, categories]);

  const handleSliceClick = (categoryId: string) => {
    const filtered = transactions.filter(
      (t) => t.amount < 0 && (t.categoryId ?? 'cat-uncategorized') === categoryId,
    );
    onDrillDown({ type: 'category', categoryId, transactions: filtered });
  };

  if (data.length === 0) {
    return (
      <div>
        <p className="text-sm text-gray-500 text-center py-12">No expense data available.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-6">
        <div className="flex-1">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={110}
                paddingAngle={2}
                dataKey="value"
                cursor="pointer"
                onClick={(_data: unknown, index: number) =>
                  handleSliceClick(data[index].categoryId)
                }
              >
                {data.map((entry, i) => (
                  <Cell
                    key={entry.categoryId}
                    fill={entry.color ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(value: any) => [currencyFormatter(Number(value)), 'Amount']}
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-col gap-2 min-w-[160px]">
          {data.map((entry) => (
            <button
              key={entry.categoryId}
              onClick={() => handleSliceClick(entry.categoryId)}
              className="flex items-center gap-2 text-left hover:bg-gray-50 rounded-lg px-2 py-1 transition-colors"
            >
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-gray-700 truncate flex-1">{entry.name}</span>
              <span className="text-sm font-medium text-gray-900">
                {currencyFormatter(entry.value)}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
