import type { CategoryRule } from '../types/transaction';

export interface CategorizationResult {
  categoryId: string;
  confidence: 'high' | 'medium' | 'low';
}

export function categorizeTransaction(
  description: string,
  _amount: number,
  rules: CategoryRule[],
): CategorizationResult {
  const normalized = description.toLowerCase().trim()
    .replace(/\s+/g, ' ')
    .replace(/^(pos debit|ach credit|ach debit|check card|debit card|payment to|purchase)\s*/i, '');

  const sortedRules = [...rules].sort((a, b) => b.priority - a.priority);

  for (const rule of sortedRules) {
    if (rule.isRegex) {
      const flags = rule.caseSensitive ? '' : 'i';
      for (const keyword of rule.keywords) {
        try {
          if (new RegExp(keyword, flags).test(normalized)) {
            return { categoryId: rule.categoryId, confidence: 'high' };
          }
        } catch {
          // Invalid regex, skip
        }
      }
    } else {
      const target = rule.caseSensitive ? description.trim() : normalized;
      for (const keyword of rule.keywords) {
        const kw = rule.caseSensitive ? keyword : keyword.toLowerCase();
        if (target.includes(kw)) {
          return { categoryId: rule.categoryId, confidence: 'high' };
        }
      }
    }
  }

  return {
    categoryId: 'cat-uncategorized',
    confidence: 'low',
  };
}

export function categorizeTransactions(
  transactions: Array<{ description: string; amount: number }>,
  rules: CategoryRule[],
): CategorizationResult[] {
  return transactions.map(t => categorizeTransaction(t.description, t.amount, rules));
}
