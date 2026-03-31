import type { Account } from '../types/transaction';

interface BankFingerprint {
  institution: string;
  accountType: Account['type'];
  requiredHeaders: string[];
  exactColumnCount?: number;
}

// Ordered most-specific → least-specific to prevent false matches
const BANK_FINGERPRINTS: BankFingerprint[] = [
  {
    institution: 'American Express',
    accountType: 'credit_card',
    requiredHeaders: ['extended details', 'appears on your statement as'],
  },
  {
    institution: 'Chase',
    accountType: 'checking',
    requiredHeaders: ['details', 'posting date', 'check or slip #'],
  },
  {
    institution: 'Chase',
    accountType: 'credit_card',
    requiredHeaders: ['transaction date', 'post date', 'type', 'memo'],
  },
  {
    institution: 'Capital One',
    accountType: 'credit_card',
    requiredHeaders: ['card no.', 'posted date', 'debit', 'credit'],
  },
  {
    institution: 'Citi',
    accountType: 'credit_card',
    requiredHeaders: ['status', 'debit', 'credit'],
  },
  {
    institution: 'Discover',
    accountType: 'credit_card',
    requiredHeaders: ['trans. date', 'post date', 'category'],
  },
  {
    institution: 'Bank of America',
    accountType: 'checking',
    requiredHeaders: ['running bal.'],
  },
  {
    institution: 'Wells Fargo',
    accountType: 'checking',
    requiredHeaders: ['date', 'amount', 'description'],
    exactColumnCount: 3,
  },
];

export interface BankDetectionResult {
  institution: string;
  accountType: Account['type'];
  confidence: 'high' | 'low';
  suggestedName: string;
}

const ACCOUNT_TYPE_LABELS: Record<Account['type'], string> = {
  credit_card: 'Credit Card',
  checking: 'Checking',
  savings: 'Savings',
  other: 'Account',
};

export function detectBank(headers: string[]): BankDetectionResult | null {
  const normalized = headers.map(h => h.toLowerCase().trim());

  for (const fingerprint of BANK_FINGERPRINTS) {
    if (fingerprint.exactColumnCount && normalized.length !== fingerprint.exactColumnCount) {
      continue;
    }

    const allMatch = fingerprint.requiredHeaders.every(required =>
      normalized.some(h => h.includes(required))
    );

    if (allMatch) {
      const confidence = fingerprint.requiredHeaders.length >= 3 ? 'high' : 'low';
      const typeLabel = ACCOUNT_TYPE_LABELS[fingerprint.accountType];
      return {
        institution: fingerprint.institution,
        accountType: fingerprint.accountType,
        confidence,
        suggestedName: `${fingerprint.institution} ${typeLabel}`,
      };
    }
  }

  return null;
}
