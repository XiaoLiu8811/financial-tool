import Papa from 'papaparse';
import type { ColumnMapping } from '../types/transaction';

export interface ParsedCSV {
  headers: string[];
  rows: Record<string, string>[];
  errors: string[];
  rawText: string;
  skippedRows: number;
}

// Known header keywords — if a row contains at least 2 of these, it's likely the header row
const HEADER_KEYWORDS = [
  'date', 'transaction date', 'trans date', 'posted date', 'posting date', 'trans. date', 'post date',
  'description', 'desc', 'memo', 'narrative', 'details', 'payee', 'merchant',
  'amount', 'debit', 'credit', 'deposit', 'withdrawal', 'charge',
  'balance', 'running bal.', 'run balance',
  'category', 'type', 'reference', 'status', 'card no.', 'card number', 'check or slip #',
];

/**
 * Scores a row of strings on how likely it is to be a CSV header row.
 * Returns the number of cells that match known header keywords.
 */
function scoreAsHeaderRow(cells: string[]): number {
  let score = 0;
  for (const cell of cells) {
    const lower = cell.toLowerCase().trim();
    if (!lower) continue;
    if (HEADER_KEYWORDS.some(kw => lower === kw || lower.includes(kw))) {
      score++;
    }
  }
  return score;
}

/**
 * Detect where the actual header row starts in raw CSV text.
 * Banks like Bank of America and American Express include summary/preamble rows
 * before the real transaction data. This function finds the header row by scoring
 * each row against known column name keywords.
 *
 * Returns the number of rows to skip (0 if the first row is already the header).
 */
function detectHeaderRow(rawText: string): number {
  // Parse without headers to get raw rows
  const result = Papa.parse(rawText, { header: false, skipEmptyLines: true });
  const rawRows = result.data as string[][];

  // Check up to the first 20 rows for the best header candidate
  const limit = Math.min(rawRows.length, 20);
  let bestScore = 0;
  let bestIndex = 0;

  for (let i = 0; i < limit; i++) {
    const row = rawRows[i];
    const score = scoreAsHeaderRow(row);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }

  // Require at least 2 keyword matches to accept as header
  return bestScore >= 2 ? bestIndex : 0;
}

/**
 * Filters out trailing summary/total rows that don't contain valid transaction data.
 * These rows typically have mostly empty cells or contain aggregate labels like "Total".
 */
function filterTrailingRows(rows: Record<string, string>[], headers: string[]): Record<string, string>[] {
  return rows.filter(row => {
    // Count how many cells have actual values
    const filledCells = headers.filter(h => (row[h] ?? '').trim() !== '').length;
    // If less than half the columns are filled, skip it
    if (filledCells < Math.ceil(headers.length / 2)) return false;

    // Check for common summary row indicators
    const values = Object.values(row).join(' ').toLowerCase();
    if (/^(total|beginning balance|ending balance|summary|account\s*(number|#|no))/.test(values.trim())) {
      return false;
    }

    return true;
  });
}

export function parseCSVFile(file: File): Promise<ParsedCSV> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const rawText = reader.result as string;

      // Step 1: Detect header row offset
      const skipRows = detectHeaderRow(rawText);

      // Step 2: If we need to skip preamble rows, strip them from the text
      let csvText = rawText;
      if (skipRows > 0) {
        const lines = rawText.split(/\r?\n/);
        csvText = lines.slice(skipRows).join('\n');
      }

      // Step 3: Parse with headers
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete(results) {
          const headers = results.meta.fields ?? [];
          const rawRows = results.data as Record<string, string>[];

          // Step 4: Filter out trailing summary rows
          const rows = filterTrailingRows(rawRows, headers);

          const errors = results.errors.map(e => `Row ${e.row}: ${e.message}`);
          resolve({ headers, rows, errors, rawText, skippedRows: skipRows });
        },
        error(err: Error) {
          resolve({ headers: [], rows: [], errors: [err.message], rawText, skippedRows: 0 });
        },
      });
    };
    reader.onerror = () => {
      resolve({ headers: [], rows: [], errors: ['Failed to read file'], rawText: '', skippedRows: 0 });
    };
    reader.readAsText(file);
  });
}

export function generateFileHash(content: string): string {
  let hash = 0;
  const str = content.trim();
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
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
  return rows
    .filter(row => {
      // Skip completely empty rows or rows with all blank mapped fields
      const dateVal = (row[mapping.date] ?? '').trim();
      const descVal = (row[mapping.description] ?? '').trim();
      const hasAmount = mapping.income && mapping.expense
        ? (row[mapping.income] ?? '').trim() !== '' || (row[mapping.expense] ?? '').trim() !== ''
        : (row[mapping.amount] ?? '').trim() !== '';
      return dateVal !== '' || descVal !== '' || hasAmount;
    })
    .map((row, idx) => {
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

      // Use description from fallback columns if primary is empty
      let description = descRaw.trim();
      if (!description) {
        // Try common fallback column names
        for (const fallback of ['Memo', 'memo', 'Payee', 'payee', 'Name', 'name', 'Details', 'details', 'Narrative', 'narrative']) {
          const val = (row[fallback] ?? '').trim();
          if (val) {
            description = val;
            break;
          }
        }
        if (!description) description = '(No description)';
      }

      return { date, description, amount, rawCSVRow: row };
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
