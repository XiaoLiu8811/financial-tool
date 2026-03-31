import { useState, useMemo } from 'react';
import { Building2, UserPlus, Plus } from 'lucide-react';
import CSVDropZone from '../components/import/CSVDropZone';
import ImportPreview from '../components/import/ImportPreview';
import { parseCSVFile, autoDetectMapping, mapCSVToTransactions, generateFileHash, generateTransactionHash } from '../lib/csv-parser';
import { detectBank, type BankDetectionResult } from '../lib/bank-detector';
import { useTransactionStore } from '../store/useTransactionStore';
import { useHouseholdStore } from '../store/useHouseholdStore';
import type { ColumnMapping, ImportBatch, Account } from '../types/transaction';

const MEMBER_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

export function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping | null>(null);
  const [splitMode, setSplitMode] = useState(false);
  const [fileHash, setFileHash] = useState('');
  const [fileAlreadyImported, setFileAlreadyImported] = useState(false);
  const [existingBatchInfo, setExistingBatchInfo] = useState<ImportBatch | null>(null);
  const [dismissedFileWarning, setDismissedFileWarning] = useState(false);

  // Account & person state
  const [detectedBank, setDetectedBank] = useState<BankDetectionResult | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [selectedIncomeTypeId, setSelectedIncomeTypeId] = useState<string | null>(null);
  const [showNewAccount, setShowNewAccount] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountInstitution, setNewAccountInstitution] = useState('');
  const [newAccountType, setNewAccountType] = useState<Account['type']>('checking');
  const [showNewMember, setShowNewMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');

  const importBatches = useTransactionStore(s => s.importBatches);
  const transactions = useTransactionStore(s => s.transactions);
  const { accounts, members, incomeTypes, addAccount, addMember } = useHouseholdStore();

  const handleFileSelected = async (f: File) => {
    setFile(f);
    setDismissedFileWarning(false);
    const result = await parseCSVFile(f);
    setHeaders(result.headers);
    setRows(result.rows);
    // Compute file hash and check for duplicate file import
    const hash = generateFileHash(result.rawText);
    setFileHash(hash);
    const matchingBatch = importBatches.find(b => b.fileHash === hash);
    if (matchingBatch) {
      setFileAlreadyImported(true);
      setExistingBatchInfo(matchingBatch);
    } else {
      setFileAlreadyImported(false);
      setExistingBatchInfo(null);
    }

    // Auto-detect columns immediately
    const detected = autoDetectMapping(result.headers);
    setSplitMode(detected.mode === 'split');
    setMapping({
      date: detected.date,
      description: detected.description,
      amount: detected.amount,
      ...(detected.mode === 'split' ? { income: detected.income, expense: detected.expense } : {}),
    });

    // Detect bank from headers
    const bankResult = detectBank(result.headers);
    setDetectedBank(bankResult);
    if (bankResult) {
      // Try to find an existing account matching the detected bank
      const existing = accounts.find(
        a => a.institution.toLowerCase() === bankResult.institution.toLowerCase()
          && a.type === bankResult.accountType
      );
      if (existing) {
        setSelectedAccountId(existing.id);
        setShowNewAccount(false);
      } else {
        setSelectedAccountId(null);
        setShowNewAccount(true);
        setNewAccountName(bankResult.suggestedName);
        setNewAccountInstitution(bankResult.institution);
        setNewAccountType(bankResult.accountType);
      }
    } else {
      setSelectedAccountId(null);
      setShowNewAccount(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setHeaders([]);
    setRows([]);
    setMapping(null);
    setSplitMode(false);
    setFileHash('');
    setFileAlreadyImported(false);
    setExistingBatchInfo(null);
    setDismissedFileWarning(false);
    setDetectedBank(null);
    setSelectedAccountId(null);
    setSelectedPersonId(null);
    setSelectedIncomeTypeId(null);
    setShowNewAccount(false);
    setNewAccountName('');
    setNewAccountInstitution('');
    setNewAccountType('checking');
    setShowNewMember(false);
    setNewMemberName('');
  };

  const handleCreateAccount = async () => {
    if (!newAccountName.trim()) return;
    const account: Account = {
      id: crypto.randomUUID(),
      name: newAccountName.trim(),
      institution: newAccountInstitution.trim() || newAccountName.trim(),
      type: newAccountType,
      lastUsed: new Date().toISOString(),
    };
    await addAccount(account);
    setSelectedAccountId(account.id);
    setShowNewAccount(false);
    setNewAccountName('');
    setNewAccountInstitution('');
  };

  const handleCreateMember = async () => {
    if (!newMemberName.trim()) return;
    const color = MEMBER_COLORS[members.length % MEMBER_COLORS.length];
    const member = {
      id: crypto.randomUUID(),
      name: newMemberName.trim(),
      color,
      createdAt: new Date().toISOString(),
    };
    await addMember(member);
    setSelectedPersonId(member.id);
    setShowNewMember(false);
    setNewMemberName('');
  };

  // Compute row-level duplicate hashes when mapping changes
  const duplicateHashes = useMemo(() => {
    if (!mapping || rows.length === 0) return new Set<string>();

    const existingHashes = new Set(
      transactions.filter(t => t.transactionHash).map(t => t.transactionHash!)
    );

    const mapped = mapCSVToTransactions(rows, mapping);
    const dupes = new Set<string>();
    for (const row of mapped) {
      if (row.error) continue;
      const hash = generateTransactionHash(row.date, row.description, row.amount);
      if (existingHashes.has(hash)) {
        dupes.add(hash);
      }
    }
    return dupes;
  }, [rows, mapping, transactions]);

  // Preview of mapped data to show alongside column config
  const previewData = useMemo(() => {
    if (!mapping || rows.length === 0) return [];
    return mapCSVToTransactions(rows.slice(0, 3), mapping);
  }, [rows, mapping]);

  const selectClasses = 'block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500';

  // Has file + mapping ready
  if (file && mapping && rows.length > 0) {
    const isValid = mapping.date && mapping.description && (splitMode ? (mapping.income && mapping.expense) : mapping.amount);

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Import CSV</h2>
          <button
            onClick={handleReset}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Choose a different file
          </button>
        </div>

        {/* Duplicate file warning banner */}
        {fileAlreadyImported && !dismissedFileWarning && existingBatchInfo && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <svg className="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800">Duplicate file detected</p>
              <p className="text-sm text-amber-700 mt-1">
                This file was already imported on{' '}
                <span className="font-medium">{new Date(existingBatchInfo.importedAt).toLocaleDateString()}</span>{' '}
                as <span className="font-medium">{existingBatchInfo.fileName}</span>.
              </p>
              <button
                onClick={() => setDismissedFileWarning(true)}
                className="mt-2 text-sm font-medium text-amber-800 underline hover:text-amber-900"
              >
                Import anyway
              </button>
            </div>
          </div>
        )}

        {/* File info */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-700">
            <span className="font-medium">{file.name}</span>
            <span className="text-gray-400 mx-2">·</span>
            {rows.length} rows
            <span className="text-gray-400 mx-2">·</span>
            {headers.length} columns: <span className="text-gray-500">{headers.join(', ')}</span>
          </p>
        </div>

        {/* Column mapping - compact inline form */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-1">Column Mapping</h3>
          <p className="text-xs text-gray-500 mb-4">
            We auto-detected your columns. Adjust if needed.
          </p>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Date Column</label>
              <select className={selectClasses} value={mapping.date} onChange={e => setMapping({ ...mapping, date: e.target.value })}>
                <option value="">-- Select --</option>
                {headers.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Description Column</label>
              <select className={selectClasses} value={mapping.description} onChange={e => setMapping({ ...mapping, description: e.target.value })}>
                <option value="">-- Select --</option>
                {headers.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            {!splitMode ? (
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Amount Column</label>
                <select className={selectClasses} value={mapping.amount} onChange={e => setMapping({ ...mapping, amount: e.target.value })}>
                  <option value="">-- Select --</option>
                  {headers.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            ) : (
              <>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Income/Credit Column</label>
                  <select className={selectClasses} value={mapping.income ?? ''} onChange={e => setMapping({ ...mapping, income: e.target.value })}>
                    <option value="">-- Select --</option>
                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Expense/Debit Column</label>
                  <select className={selectClasses} value={mapping.expense ?? ''} onChange={e => setMapping({ ...mapping, expense: e.target.value })}>
                    <option value="">-- Select --</option>
                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </>
            )}
          </div>

          <label className="flex items-center gap-2 mt-3 text-xs text-gray-500 cursor-pointer">
            <input
              type="checkbox"
              checked={splitMode}
              onChange={e => {
                setSplitMode(e.target.checked);
                if (e.target.checked) {
                  const detected = autoDetectMapping(headers);
                  setMapping({ ...mapping, amount: '', income: detected.income, expense: detected.expense });
                } else {
                  const detected = autoDetectMapping(headers);
                  setMapping({ ...mapping, amount: detected.amount, income: undefined, expense: undefined });
                }
              }}
              className="h-3.5 w-3.5 rounded border-gray-300"
            />
            My CSV has separate credit/debit columns
          </label>

          {/* Live preview of first 3 rows */}
          {previewData.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-500 mb-2">Preview (first 3 rows)</p>
              <div className="overflow-x-auto rounded-lg border border-gray-100">
                <table className="min-w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">Date</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">Description</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-500">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {previewData.map((row, i) => (
                      <tr key={i} className={row.error ? 'bg-red-50' : ''}>
                        <td className="px-3 py-1.5 text-gray-700">{row.date || <span className="text-red-500">Invalid</span>}</td>
                        <td className="px-3 py-1.5 text-gray-700 max-w-xs truncate">{row.description || '--'}</td>
                        <td className={`px-3 py-1.5 text-right font-mono ${row.error ? 'text-red-500' : row.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {row.error ? 'Error' : `${row.amount >= 0 ? '+' : ''}$${Math.abs(row.amount).toFixed(2)}`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Account & Person selection */}
        {isValid && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-1">Account & Person</h3>
              <p className="text-xs text-gray-500 mb-4">
                Assign this import to an account and household member.
              </p>
            </div>

            {/* Account selection */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Account</label>
              {detectedBank && !showNewAccount && !selectedAccountId && (
                <div className="mb-2 flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700">
                  <Building2 size={16} />
                  <span>Detected: <strong>{detectedBank.suggestedName}</strong></span>
                  {detectedBank.confidence === 'low' && (
                    <span className="text-xs text-blue-500">(low confidence)</span>
                  )}
                </div>
              )}
              {!showNewAccount ? (
                <div className="flex gap-2">
                  <select
                    className={selectClasses + ' flex-1'}
                    value={selectedAccountId ?? ''}
                    onChange={e => setSelectedAccountId(e.target.value || null)}
                  >
                    <option value="">-- Select account --</option>
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>{a.name} ({a.institution})</option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      setShowNewAccount(true);
                      if (detectedBank) {
                        setNewAccountName(detectedBank.suggestedName);
                        setNewAccountInstitution(detectedBank.institution);
                        setNewAccountType(detectedBank.accountType);
                      }
                    }}
                    className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <Plus size={14} />
                    New
                  </button>
                </div>
              ) : (
                <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-3 space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="mb-1 block text-xs text-gray-500">Account Name</label>
                      <input
                        type="text"
                        className={selectClasses}
                        value={newAccountName}
                        onChange={e => setNewAccountName(e.target.value)}
                        placeholder="e.g. Chase Credit Card"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-gray-500">Institution</label>
                      <input
                        type="text"
                        className={selectClasses}
                        value={newAccountInstitution}
                        onChange={e => setNewAccountInstitution(e.target.value)}
                        placeholder="e.g. Chase"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-gray-500">Type</label>
                      <select
                        className={selectClasses}
                        value={newAccountType}
                        onChange={e => setNewAccountType(e.target.value as Account['type'])}
                      >
                        <option value="checking">Checking</option>
                        <option value="savings">Savings</option>
                        <option value="credit_card">Credit Card</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCreateAccount}
                      disabled={!newAccountName.trim()}
                      className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500"
                    >
                      Create Account
                    </button>
                    <button
                      onClick={() => setShowNewAccount(false)}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Person selection */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Person</label>
              {members.length === 0 && !showNewMember ? (
                <div className="rounded-lg border border-dashed border-gray-300 p-3 text-center">
                  <UserPlus className="mx-auto h-6 w-6 text-gray-400 mb-1" />
                  <p className="text-xs text-gray-500 mb-2">No household members yet</p>
                  <button
                    onClick={() => setShowNewMember(true)}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700"
                  >
                    Add first member
                  </button>
                </div>
              ) : !showNewMember ? (
                <div className="flex gap-2">
                  <select
                    className={selectClasses + ' flex-1'}
                    value={selectedPersonId ?? ''}
                    onChange={e => setSelectedPersonId(e.target.value || null)}
                  >
                    <option value="">-- Select person --</option>
                    {members.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => setShowNewMember(true)}
                    className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <Plus size={14} />
                    New
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    className={selectClasses + ' flex-1'}
                    value={newMemberName}
                    onChange={e => setNewMemberName(e.target.value)}
                    placeholder="Name"
                    onKeyDown={e => e.key === 'Enter' && handleCreateMember()}
                  />
                  <button
                    onClick={handleCreateMember}
                    disabled={!newMemberName.trim()}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => setShowNewMember(false)}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {/* Income type selection - only if there are income rows */}
            {mapping && rows.length > 0 && previewData.some(r => !r.error && r.amount >= 0) && (
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Default Income Type</label>
                <p className="text-xs text-gray-400 mb-1">Applied to income transactions in this import</p>
                <select
                  className={selectClasses}
                  value={selectedIncomeTypeId ?? ''}
                  onChange={e => setSelectedIncomeTypeId(e.target.value || null)}
                >
                  <option value="">-- None --</option>
                  {incomeTypes.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Validation hint */}
            {(!selectedAccountId || !selectedPersonId) && (
              <p className="text-xs text-amber-600 flex items-center gap-1">
                {!selectedAccountId && !selectedPersonId
                  ? 'Please select or create an account and a person to continue.'
                  : !selectedAccountId
                    ? 'Please select or create an account to continue.'
                    : 'Please select or create a person to continue.'}
              </p>
            )}
          </div>
        )}

        {/* Full preview + import */}
        {isValid && (!fileAlreadyImported || dismissedFileWarning) && selectedAccountId && selectedPersonId && (
          <ImportPreview
            rows={rows}
            mapping={mapping}
            fileName={file.name}
            onConfirm={handleReset}
            onCancel={handleReset}
            duplicateHashes={duplicateHashes}
            fileHash={fileHash}
            accountId={selectedAccountId}
            personId={selectedPersonId}
            incomeTypeId={selectedIncomeTypeId ?? undefined}
          />
        )}
      </div>
    );
  }

  // Initial upload state
  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-xl font-bold text-gray-900 mb-2">Import CSV</h2>
      <p className="text-sm text-gray-500 mb-6">Upload a bank statement or transaction export. We'll auto-detect the columns.</p>
      <CSVDropZone onFileSelected={handleFileSelected} />
    </div>
  );
}
