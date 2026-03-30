import { useNavigate } from 'react-router-dom';
import { ArrowUpDown, Upload } from 'lucide-react';
import { useFilteredTransactions } from '../hooks/useFilteredTransactions';
import { TransactionTable } from '../components/transactions/TransactionTable';
import { EmptyState } from '../components/ui/EmptyState';

export function TransactionsPage() {
  const transactions = useFilteredTransactions();
  const navigate = useNavigate();

  if (transactions.length === 0) {
    return (
      <EmptyState
        icon={<ArrowUpDown size={48} />}
        title="No transactions"
        description="Import a CSV file to see your transactions here."
        action={
          <button
            onClick={() => navigate('/import')}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
          >
            <Upload size={16} className="inline mr-2" />
            Import CSV
          </button>
        }
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Transactions</h2>
        <span className="text-sm text-gray-500">{transactions.length} total</span>
      </div>
      <TransactionTable transactions={transactions} />
    </div>
  );
}
