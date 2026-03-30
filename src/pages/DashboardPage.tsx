import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload } from 'lucide-react';
import { useFilteredTransactions } from '../hooks/useFilteredTransactions';
import { HealthDashboard } from '../components/health/HealthDashboard';
import { SpendingVsIncome } from '../components/charts/SpendingVsIncome';
import { CategoryBreakdown } from '../components/charts/CategoryBreakdown';
import { SpendingTrend } from '../components/charts/SpendingTrend';
import { SavingsRate } from '../components/charts/SavingsRate';
import { DrillDownModal } from '../components/charts/DrillDownModal';
import { EmptyState } from '../components/ui/EmptyState';
import type { ChartDrillDownContext } from '../types/chart';

export function DashboardPage() {
  const transactions = useFilteredTransactions();
  const [drillDown, setDrillDown] = useState<ChartDrillDownContext | null>(null);
  const navigate = useNavigate();

  if (transactions.length === 0) {
    return (
      <EmptyState
        icon={<Upload size={48} />}
        title="No transactions yet"
        description="Import a CSV file to get started with your financial overview."
        action={
          <button
            onClick={() => navigate('/import')}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
          >
            Import CSV
          </button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <HealthDashboard transactions={transactions} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Income vs Expenses</h3>
          <SpendingVsIncome transactions={transactions} onDrillDown={setDrillDown} />
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Spending by Category</h3>
          <CategoryBreakdown transactions={transactions} onDrillDown={setDrillDown} />
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Spending Trend</h3>
          <SpendingTrend transactions={transactions} onDrillDown={setDrillDown} />
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Savings Rate</h3>
          <SavingsRate transactions={transactions} />
        </div>
      </div>

      <DrillDownModal context={drillDown} onClose={() => setDrillDown(null)} />
    </div>
  );
}
