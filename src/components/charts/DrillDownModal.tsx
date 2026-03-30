import { format, parseISO } from 'date-fns';
import type { ChartDrillDownContext } from '../../types/chart';
import { Modal } from '../ui/Modal';
import { CategoryBadge } from '../categories/CategoryBadge';

interface DrillDownModalProps {
  context: ChartDrillDownContext | null;
  onClose: () => void;
}

function buildTitle(context: ChartDrillDownContext): string {
  if (context.type === 'month' && context.month) {
    const date = parseISO(context.month + '-01');
    return `${format(date, "MMMM yyyy")} Transactions`;
  }
  if (context.type === 'category') {
    return `${context.categoryId ?? 'Uncategorized'} Transactions`;
  }
  if (context.type === 'trend-point' && context.month) {
    const date = parseISO(context.month + '-01');
    return `${format(date, "MMMM yyyy")} Spending`;
  }
  return 'Transactions';
}

export function DrillDownModal({ context, onClose }: DrillDownModalProps) {
  if (!context) return null;

  const title = buildTitle(context);
  const transactions = context.transactions;

  return (
    <Modal open={!!context} onClose={onClose} title={title} wide>
      {transactions.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-8">
          No transactions found.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                <th className="pb-2 pr-4 font-medium">Date</th>
                <th className="pb-2 pr-4 font-medium">Description</th>
                <th className="pb-2 pr-4 font-medium">Category</th>
                <th className="pb-2 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2 pr-4 text-gray-600 whitespace-nowrap">
                    {format(parseISO(t.date), 'MMM d, yyyy')}
                  </td>
                  <td className="py-2 pr-4 text-gray-900">{t.description}</td>
                  <td className="py-2 pr-4">
                    <CategoryBadge categoryId={t.categoryId} />
                  </td>
                  <td
                    className={`py-2 text-right font-medium whitespace-nowrap ${
                      t.amount >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {t.amount >= 0 ? '+' : '-'}$
                    {Math.abs(t.amount).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
}
