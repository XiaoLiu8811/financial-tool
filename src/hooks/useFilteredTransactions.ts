import { useMemo } from 'react';
import { useTransactionStore } from '../store/useTransactionStore';
import { useUIStore } from '../store/useUIStore';

export function useFilteredTransactions() {
  const transactions = useTransactionStore(s => s.transactions);
  const dateRange = useUIStore(s => s.dateRange);
  const personFilter = useUIStore(s => s.personFilter);
  const accountFilter = useUIStore(s => s.accountFilter);

  return useMemo(() => {
    let filtered = transactions;
    if (dateRange) {
      filtered = filtered.filter(t => t.date >= dateRange.start && t.date <= dateRange.end);
    }
    if (personFilter) {
      filtered = filtered.filter(t => t.personId === personFilter);
    }
    if (accountFilter) {
      filtered = filtered.filter(t => t.accountId === accountFilter);
    }
    return filtered;
  }, [transactions, dateRange, personFilter, accountFilter]);
}
