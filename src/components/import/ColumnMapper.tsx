import { useEffect, useMemo, useState } from 'react';
import { Check, AlertTriangle } from 'lucide-react';
import type { ColumnMapping } from '../../types/transaction';

interface ColumnMapperProps {
  headers: string[];
  onMappingComplete: (mapping: ColumnMapping) => void;
}

const COMMON_DATE = ['date', 'transaction date', 'trans date', 'posted date', 'posting date'];
const COMMON_DESC = ['description', 'desc', 'memo', 'narrative', 'details', 'payee', 'name'];
const COMMON_AMOUNT = ['amount', 'total', 'value', 'sum'];
const COMMON_INCOME = ['income', 'credit', 'deposit', 'credits'];
const COMMON_EXPENSE = ['expense', 'debit', 'withdrawal', 'debits', 'charge'];

function autoDetect(headers: string[], candidates: string[]): string {
  const lower = headers.map(h => h.toLowerCase().trim());
  for (const candidate of candidates) {
    const idx = lower.indexOf(candidate);
    if (idx !== -1) return headers[idx];
  }
  // Partial match fallback
  for (const candidate of candidates) {
    const idx = lower.findIndex(h => h.includes(candidate));
    if (idx !== -1) return headers[idx];
  }
  return '';
}

export default function ColumnMapper({ headers, onMappingComplete }: ColumnMapperProps) {
  const [separateIncomeExpense, setSeparateIncomeExpense] = useState(false);
  const [dateCol, setDateCol] = useState('');
  const [descCol, setDescCol] = useState('');
  const [amountCol, setAmountCol] = useState('');
  const [incomeCol, setIncomeCol] = useState('');
  const [expenseCol, setExpenseCol] = useState('');

  // Auto-detect on mount / when headers change
  useEffect(() => {
    setDateCol(autoDetect(headers, COMMON_DATE));
    setDescCol(autoDetect(headers, COMMON_DESC));
    setAmountCol(autoDetect(headers, COMMON_AMOUNT));

    const detectedIncome = autoDetect(headers, COMMON_INCOME);
    const detectedExpense = autoDetect(headers, COMMON_EXPENSE);
    setIncomeCol(detectedIncome);
    setExpenseCol(detectedExpense);

    // If we found separate income/expense columns but no single amount column, toggle mode
    if (detectedIncome && detectedExpense && !autoDetect(headers, COMMON_AMOUNT)) {
      setSeparateIncomeExpense(true);
    }
  }, [headers]);

  const isValid = useMemo(() => {
    if (!dateCol || !descCol) return false;
    if (separateIncomeExpense) return !!incomeCol && !!expenseCol;
    return !!amountCol;
  }, [dateCol, descCol, amountCol, incomeCol, expenseCol, separateIncomeExpense]);

  function handleContinue() {
    const mapping: ColumnMapping = {
      date: dateCol,
      description: descCol,
      amount: separateIncomeExpense ? '' : amountCol,
      ...(separateIncomeExpense ? { income: incomeCol, expense: expenseCol } : {}),
    };
    onMappingComplete(mapping);
  }

  const selectClasses =
    'block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Map Columns</h3>
        <p className="mt-1 text-sm text-gray-500">
          Match your CSV columns to the required transaction fields.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Date */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Date <span className="text-red-500">*</span>
          </label>
          <select
            className={selectClasses}
            value={dateCol}
            onChange={e => setDateCol(e.target.value)}
          >
            <option value="">-- Select column --</option>
            {headers.map(h => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Description <span className="text-red-500">*</span>
          </label>
          <select
            className={selectClasses}
            value={descCol}
            onChange={e => setDescCol(e.target.value)}
          >
            <option value="">-- Select column --</option>
            {headers.map(h => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
        </div>

        {/* Amount or Income/Expense toggle */}
        {!separateIncomeExpense ? (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Amount <span className="text-red-500">*</span>
            </label>
            <select
              className={selectClasses}
              value={amountCol}
              onChange={e => setAmountCol(e.target.value)}
            >
              <option value="">-- Select column --</option>
              {headers.map(h => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>
        ) : (
          <>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Income / Credit <span className="text-red-500">*</span>
              </label>
              <select
                className={selectClasses}
                value={incomeCol}
                onChange={e => setIncomeCol(e.target.value)}
              >
                <option value="">-- Select column --</option>
                {headers.map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Expense / Debit <span className="text-red-500">*</span>
              </label>
              <select
                className={selectClasses}
                value={expenseCol}
                onChange={e => setExpenseCol(e.target.value)}
              >
                <option value="">-- Select column --</option>
                {headers.map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>
          </>
        )}
      </div>

      {/* Toggle */}
      <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={separateIncomeExpense}
          onChange={e => setSeparateIncomeExpense(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        Separate income / expense columns
      </label>

      {/* Validation */}
      <div className="flex items-center gap-2 text-sm">
        {isValid ? (
          <>
            <Check className="h-4 w-4 text-green-500" />
            <span className="text-green-700">All required fields mapped</span>
          </>
        ) : (
          <>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <span className="text-amber-700">Please map all required fields to continue</span>
          </>
        )}
      </div>

      <button
        disabled={!isValid}
        onClick={handleContinue}
        className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
      >
        Continue
      </button>
    </div>
  );
}
