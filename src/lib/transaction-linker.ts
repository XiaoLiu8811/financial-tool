import type { Transaction } from '../types/transaction';

const TRANSFER_KEYWORDS = [
  'payment', 'transfer', 'credit card', 'card payment', 'pay off',
  'autopay', 'auto pay', 'bill pay', 'zelle', 'venmo', 'paypal',
  'wire', 'ach', 'direct pay',
];

export interface PotentialMatch {
  transaction: Transaction;
  score: number; // 0-100
  reason: string;
}

export function findPotentialMatches(
  target: Transaction,
  allTransactions: Transaction[],
): PotentialMatch[] {
  const matches: PotentialMatch[] = [];

  for (const candidate of allTransactions) {
    // Skip self, already-linked, or same import batch
    if (candidate.id === target.id) continue;
    if (candidate.linkedTransactionId) continue;
    if (candidate.importBatchId === target.importBatchId) continue;

    // Must be opposite sign (one income, one expense)
    if (Math.sign(candidate.amount) === Math.sign(target.amount)) continue;

    // Check if amounts match (equal and opposite)
    const amountsMatch = Math.abs(Math.abs(candidate.amount) - Math.abs(target.amount)) < 0.01;
    if (!amountsMatch) continue;

    // Check date proximity (within 7 days)
    const daysDiff = Math.abs(
      (new Date(target.date).getTime() - new Date(candidate.date).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysDiff > 7) continue;

    // Score the match
    let score = 50; // Base score for matching amount
    const reasons: string[] = ['Same amount'];

    // Closer dates = higher score
    if (daysDiff <= 1) { score += 25; reasons.push('Same/next day'); }
    else if (daysDiff <= 3) { score += 15; reasons.push(`${Math.round(daysDiff)} days apart`); }
    else { score += 5; reasons.push(`${Math.round(daysDiff)} days apart`); }

    // Transfer keywords in either description boost score
    const targetDesc = target.description.toLowerCase();
    const candidateDesc = candidate.description.toLowerCase();
    const hasTransferKeyword = TRANSFER_KEYWORDS.some(kw =>
      targetDesc.includes(kw) || candidateDesc.includes(kw)
    );
    if (hasTransferKeyword) {
      score += 20;
      reasons.push('Transfer keyword found');
    }

    if (score >= 50) {
      matches.push({
        transaction: candidate,
        score: Math.min(score, 100),
        reason: reasons.join(' · '),
      });
    }
  }

  return matches.sort((a, b) => b.score - a.score);
}
