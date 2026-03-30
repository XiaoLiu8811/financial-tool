import type { Category, CategoryRule } from '../types/transaction';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-groceries', name: 'Groceries', color: '#22c55e', icon: 'ShoppingCart', isDefault: true, type: 'expense' },
  { id: 'cat-dining', name: 'Dining', color: '#f97316', icon: 'UtensilsCrossed', isDefault: true, type: 'expense' },
  { id: 'cat-transport', name: 'Transportation', color: '#3b82f6', icon: 'Car', isDefault: true, type: 'expense' },
  { id: 'cat-utilities', name: 'Utilities', color: '#a855f7', icon: 'Zap', isDefault: true, type: 'expense' },
  { id: 'cat-entertainment', name: 'Entertainment', color: '#ec4899', icon: 'Film', isDefault: true, type: 'expense' },
  { id: 'cat-healthcare', name: 'Healthcare', color: '#14b8a6', icon: 'Heart', isDefault: true, type: 'expense' },
  { id: 'cat-shopping', name: 'Shopping', color: '#f59e0b', icon: 'ShoppingBag', isDefault: true, type: 'expense' },
  { id: 'cat-housing', name: 'Housing', color: '#8b5cf6', icon: 'Home', isDefault: true, type: 'expense' },
  { id: 'cat-salary', name: 'Salary', color: '#10b981', icon: 'Briefcase', isDefault: true, type: 'income' },
  { id: 'cat-freelance', name: 'Freelance', color: '#06b6d4', icon: 'Laptop', isDefault: true, type: 'income' },
  { id: 'cat-investment', name: 'Investment', color: '#6366f1', icon: 'TrendingUp', isDefault: true, type: 'income' },
  { id: 'cat-transfer', name: 'Transfer', color: '#94a3b8', icon: 'ArrowLeftRight', isDefault: true, type: 'both' },
  { id: 'cat-uncategorized', name: 'Uncategorized', color: '#cbd5e1', icon: 'HelpCircle', isDefault: true, type: 'both' },
];

export const DEFAULT_RULES: CategoryRule[] = [
  { id: 'rule-groceries', categoryId: 'cat-groceries', keywords: ['walmart', 'kroger', 'safeway', 'trader joe', 'whole foods', 'aldi', 'publix', 'costco', 'grocery', 'supermarket'], priority: 10, isRegex: false, caseSensitive: false },
  { id: 'rule-dining', categoryId: 'cat-dining', keywords: ['restaurant', 'mcdonald', 'starbucks', 'chipotle', 'doordash', 'uber eats', 'grubhub', 'pizza', 'cafe', 'coffee', 'burger', 'sushi', 'taco'], priority: 10, isRegex: false, caseSensitive: false },
  { id: 'rule-transport', categoryId: 'cat-transport', keywords: ['gas', 'shell', 'chevron', 'bp', 'uber', 'lyft', 'parking', 'transit', 'metro', 'fuel', 'exxon'], priority: 10, isRegex: false, caseSensitive: false },
  { id: 'rule-utilities', categoryId: 'cat-utilities', keywords: ['electric', 'water bill', 'internet', 'comcast', 'verizon', 'at&t', 't-mobile', 'power', 'utility', 'phone bill', 'cable'], priority: 10, isRegex: false, caseSensitive: false },
  { id: 'rule-entertainment', categoryId: 'cat-entertainment', keywords: ['netflix', 'spotify', 'hulu', 'disney', 'amazon prime', 'movie', 'theater', 'gaming', 'steam', 'playstation', 'xbox'], priority: 10, isRegex: false, caseSensitive: false },
  { id: 'rule-healthcare', categoryId: 'cat-healthcare', keywords: ['pharmacy', 'cvs', 'walgreens', 'doctor', 'hospital', 'dental', 'medical', 'health', 'clinic', 'prescription'], priority: 10, isRegex: false, caseSensitive: false },
  { id: 'rule-shopping', categoryId: 'cat-shopping', keywords: ['amazon', 'target', 'best buy', 'ebay', 'etsy', 'mall', 'store', 'shop'], priority: 5, isRegex: false, caseSensitive: false },
  { id: 'rule-housing', categoryId: 'cat-housing', keywords: ['rent', 'mortgage', 'hoa', 'property tax', 'home insurance', 'landlord'], priority: 10, isRegex: false, caseSensitive: false },
  { id: 'rule-salary', categoryId: 'cat-salary', keywords: ['payroll', 'direct deposit', 'salary', 'wages', 'paycheck'], priority: 10, isRegex: false, caseSensitive: false },
  { id: 'rule-freelance', categoryId: 'cat-freelance', keywords: ['invoice', 'consulting', 'freelance', 'contract payment'], priority: 10, isRegex: false, caseSensitive: false },
  { id: 'rule-transfer', categoryId: 'cat-transfer', keywords: ['transfer', 'zelle', 'venmo', 'paypal', 'wire'], priority: 5, isRegex: false, caseSensitive: false },
];
