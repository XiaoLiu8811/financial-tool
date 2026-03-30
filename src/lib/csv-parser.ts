import Papa from 'papaparse';
import type { ColumnMapping } from '../types/transaction';

export interface ParsedCSV {
  headers: string[];
  rows: Record<string, string>[];
  errors: string[];
}

export function parseCSVFile(file: File): Promise<ParsedCSV> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete(results) {
        const headers = results.meta.fields ?? [];
        const rows = results.data as Record<string, string>[];
        const errors = results.errors.map(e => `Row ${e.row}: ${e.message}`);
        resolve({ headers, rows, errors });
      },
      error(err: Error) {
        resolve({ headers: [], rows: [], errors: [err.message] });
      },
    });
  });
}

export function normalizeAmount(value: string): number | null {
  if (!value || !value.trim()) return null;
  let cleaned = value.trim()
    .replace(/[$€£¥,]/g, '')
    .replace(/\s/g, '');

  // Handle parentheses for negative: (100.00) -> -100.00
  if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
    cleaned = '-' + cleaned.slice(1, -1);
  }

  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

export function normalizeDate(value: string): string | null {
  if (!value || !value.trim()) return null;

  const cleaned = value.trim();

  // Try ISO format first: 2026-03-15
  const isoMatch = cleaned.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // Try MM/DD/YYYY or M/D/YYYY or MM-DD-YYYY
  const usMatch = cleaned.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (usMatch) {
    const [, m, d, rawY] = usMatch;
    const y = rawY.length === 2 ? (parseInt(rawY) > 50 ? '19' + rawY : '20' + rawY) : rawY;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // Fallback: let Date() try to parse it
  const parsed = new Date(cleaned);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }

  return null;
}

/** Try to auto-detect column mapping from CSV headers */
export function autoDetectMapping(headers: string[]): ColumnMapping & { mode: 'single' | 'split' } {
  const lower = headers.map(h => h.toLowerCase().trim());

  function find(candidates: string[]): string {
    // Exact match
    for (const c of candidates) {
      const idx = lower.indexOf(c);
      if (idx !== -1) return headers[idx];
    }
    // Partial match
    for (const c of candidates) {
      const idx = lower.findIndex(h => h.includes(c));
      if (idx !== -1) return headers[idx];
    }
    return '';
  }

  const date = find(['date', 'transaction date', 'trans date', 'posted date', 'posting date', 'trans. date']);
  const description = find(['description', 'desc', 'memo', 'narrative', 'details', 'payee', 'name', 'merchant', 'transaction']);
  const amount = find(['amount', 'total', 'value', 'sum', 'net']);
  const income = find(['credit', 'income', 'deposit', 'credits', 'credit amount']);
  const expense = find(['debit', 'expense', 'withdrawal', 'debits', 'charge', 'debit amount']);

  // If we can't find a single amount column but found credit/debit, use split mode
  if (!amount && income && expense) {
    return { date, description, amount: '', income, expense, mode: 'split' };
  }

  return { date, description, amount, mode: 'single' };
}

export function mapCSVToTransactions(
  rows: Record<string, string>[],
  mapping: ColumnMapping,
): Array<{
  date: string;
  description: string;
  amount: number;
  rawCSVRow: Record<string, string>;
  error?: string;
}> {
  return rows.map((row, idx) => {
    const dateRaw = row[mapping.date] ?? '';
    const descRaw = row[mapping.description] ?? '';

    let amount: number | null = null;
    if (mapping.income && mapping.expense) {
      // Split income/expense columns
      const incRaw = (row[mapping.income] ?? '').trim();
      const expRaw = (row[mapping.expense] ?? '').trim();
      const inc = normalizeAmount(incRaw);
      const exp = normalizeAmount(expRaw);

      if (inc !== null && inc !== 0) {
        amount = Math.abs(inc); // income is always positive
      } else if (exp !== null && exp !== 0) {
        amount = -Math.abs(exp); // expense is always negative
      } else if (inc !== null) {
        amount = inc;
      } else if (exp !== null) {
        amount = -Math.abs(exp);
      }
    } else {
      amount = normalizeAmount(row[mapping.amount] ?? '');
    }

    const date = normalizeDate(dateRaw);

    if (!date) {
      return { date: '', description: descRaw, amount: 0, rawCSVRow: row, error: `Row ${idx + 1}: Invalid date "${dateRaw}"` };
    }
    if (amount === null) {
      return { date, description: descRaw, amount: 0, rawCSVRow: row, error: `Row ${idx + 1}: Invalid amount` };
    }

    return { date, description: descRaw.trim(), amount, rawCSVRow: row };
  });
}

export function generateTransactionHash(date: string, description: string, amount: number): string {
  const str = `${date}|${description.toLowerCase().trim()}|${amount.toFixed(2)}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}
