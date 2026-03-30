import { useMemo } from 'react';
import { useTransactionStore } from '../store/useTransactionStore';
import { useUIStore } from '../store/useUIStore';

export function useFilteredTransactions() {
  const transactions = useTransactionStore(s => s.transactions);
  const dateRange = useUIStore(s => s.dateRange);

  return useMemo(() => {
    if (!dateRange) return transactions;
    return transactions.filter(t => {
      return t.date >= dateRange.start && t.date <= dateRange.end;
    });
  }, [transactions, dateRange]);
}
