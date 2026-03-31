import type { IncomeType } from '../types/transaction';

export const DEFAULT_INCOME_TYPES: IncomeType[] = [
  { id: 'inc-salary', name: 'Salary', isDefault: true },
  { id: 'inc-freelance', name: 'Freelance', isDefault: true },
  { id: 'inc-investment', name: 'Investment', isDefault: true },
  { id: 'inc-rental', name: 'Rental', isDefault: true },
  { id: 'inc-other', name: 'Other', isDefault: true },
];
