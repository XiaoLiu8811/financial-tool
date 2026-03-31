import { useState } from 'react';
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import { useHouseholdStore } from '../store/useHouseholdStore';
import type { Account, HouseholdMember, IncomeType } from '../types/transaction';

const MEMBER_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];
const ACCOUNT_TYPE_LABELS: Record<Account['type'], string> = {
  checking: 'Checking',
  savings: 'Savings',
  credit_card: 'Credit Card',
  other: 'Other',
};

export function HouseholdPage() {
  const {
    members, accounts, incomeTypes,
    addMember, updateMember, deleteMember,
    addAccount, updateAccount, deleteAccount,
    addIncomeType, updateIncomeType, deleteIncomeType,
  } = useHouseholdStore();

  // --- Member state ---
  const [showAddMember, setShowAddMember] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [memberName, setMemberName] = useState('');
  const [memberColor, setMemberColor] = useState(MEMBER_COLORS[0]);
  const [confirmDeleteMemberId, setConfirmDeleteMemberId] = useState<string | null>(null);

  // --- Account state ---
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [accountName, setAccountName] = useState('');
  const [accountInstitution, setAccountInstitution] = useState('');
  const [accountType, setAccountType] = useState<Account['type']>('checking');
  const [confirmDeleteAccountId, setConfirmDeleteAccountId] = useState<string | null>(null);

  // --- Income type state ---
  const [showAddIncomeType, setShowAddIncomeType] = useState(false);
  const [editingIncomeTypeId, setEditingIncomeTypeId] = useState<string | null>(null);
  const [incomeTypeName, setIncomeTypeName] = useState('');
  const [confirmDeleteIncomeTypeId, setConfirmDeleteIncomeTypeId] = useState<string | null>(null);

  const inputClasses = 'px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';

  // --- Member handlers ---
  function startEditMember(m: HouseholdMember) {
    setEditingMemberId(m.id);
    setMemberName(m.name);
    setMemberColor(m.color);
    setShowAddMember(false);
  }

  async function handleAddMember() {
    if (!memberName.trim()) return;
    await addMember({
      id: crypto.randomUUID(),
      name: memberName.trim(),
      color: memberColor,
      createdAt: new Date().toISOString(),
    });
    setShowAddMember(false);
    setMemberName('');
    setMemberColor(MEMBER_COLORS[members.length % MEMBER_COLORS.length]);
  }

  async function handleSaveMember() {
    if (!editingMemberId || !memberName.trim()) return;
    await updateMember(editingMemberId, { name: memberName.trim(), color: memberColor });
    setEditingMemberId(null);
    setMemberName('');
  }

  // --- Account handlers ---
  function startEditAccount(a: Account) {
    setEditingAccountId(a.id);
    setAccountName(a.name);
    setAccountInstitution(a.institution);
    setAccountType(a.type);
    setShowAddAccount(false);
  }

  async function handleAddAccount() {
    if (!accountName.trim()) return;
    await addAccount({
      id: crypto.randomUUID(),
      name: accountName.trim(),
      institution: accountInstitution.trim() || accountName.trim(),
      type: accountType,
    });
    setShowAddAccount(false);
    setAccountName('');
    setAccountInstitution('');
    setAccountType('checking');
  }

  async function handleSaveAccount() {
    if (!editingAccountId || !accountName.trim()) return;
    await updateAccount(editingAccountId, {
      name: accountName.trim(),
      institution: accountInstitution.trim() || accountName.trim(),
      type: accountType,
    });
    setEditingAccountId(null);
    setAccountName('');
    setAccountInstitution('');
  }

  // --- Income type handlers ---
  function startEditIncomeType(t: IncomeType) {
    setEditingIncomeTypeId(t.id);
    setIncomeTypeName(t.name);
    setShowAddIncomeType(false);
  }

  async function handleAddIncomeType() {
    if (!incomeTypeName.trim()) return;
    await addIncomeType({
      id: 'inc-' + crypto.randomUUID(),
      name: incomeTypeName.trim(),
      isDefault: false,
    });
    setShowAddIncomeType(false);
    setIncomeTypeName('');
  }

  async function handleSaveIncomeType() {
    if (!editingIncomeTypeId || !incomeTypeName.trim()) return;
    await updateIncomeType(editingIncomeTypeId, { name: incomeTypeName.trim() });
    setEditingIncomeTypeId(null);
    setIncomeTypeName('');
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h2 className="text-xl font-bold text-gray-900">Household</h2>

      {/* === Household Members === */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700">Household Members</h3>
          <button
            onClick={() => {
              setShowAddMember(true);
              setEditingMemberId(null);
              setMemberName('');
              setMemberColor(MEMBER_COLORS[members.length % MEMBER_COLORS.length]);
            }}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Plus size={14} /> Add Member
          </button>
        </div>
        <div className="divide-y divide-gray-100">
          {showAddMember && (
            <div className="flex items-center gap-3 px-5 py-3 bg-blue-50/50">
              <input type="color" value={memberColor} onChange={e => setMemberColor(e.target.value)} className="w-8 h-8 rounded border border-gray-300 cursor-pointer" />
              <input type="text" value={memberName} onChange={e => setMemberName(e.target.value)} placeholder="Name" className={inputClasses + ' flex-1'} autoFocus onKeyDown={e => e.key === 'Enter' && handleAddMember()} />
              <button onClick={handleAddMember} disabled={!memberName.trim()} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg disabled:opacity-30"><Check size={16} /></button>
              <button onClick={() => setShowAddMember(false)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"><X size={16} /></button>
            </div>
          )}
          {members.length === 0 && !showAddMember && (
            <p className="px-5 py-8 text-center text-sm text-gray-400">No household members yet.</p>
          )}
          {members.map(m => (
            <div key={m.id} className="flex items-center gap-3 px-5 py-3">
              {editingMemberId === m.id ? (
                <>
                  <input type="color" value={memberColor} onChange={e => setMemberColor(e.target.value)} className="w-8 h-8 rounded border border-gray-300 cursor-pointer" />
                  <input type="text" value={memberName} onChange={e => setMemberName(e.target.value)} className={inputClasses + ' flex-1'} autoFocus onKeyDown={e => e.key === 'Enter' && handleSaveMember()} />
                  <button onClick={handleSaveMember} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"><Check size={16} /></button>
                  <button onClick={() => setEditingMemberId(null)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"><X size={16} /></button>
                </>
              ) : (
                <>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium text-white" style={{ backgroundColor: m.color }}>{m.name}</span>
                  <span className="flex-1" />
                  <button onClick={() => startEditMember(m)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"><Pencil size={14} /></button>
                  {confirmDeleteMemberId === m.id ? (
                    <button onClick={async () => { await deleteMember(m.id); setConfirmDeleteMemberId(null); }} className="p-1.5 text-red-600 bg-red-50 rounded-lg hover:bg-red-100"><Trash2 size={14} /></button>
                  ) : (
                    <button onClick={() => setConfirmDeleteMemberId(m.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* === Accounts === */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700">Accounts</h3>
          <button
            onClick={() => {
              setShowAddAccount(true);
              setEditingAccountId(null);
              setAccountName('');
              setAccountInstitution('');
              setAccountType('checking');
            }}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Plus size={14} /> Add Account
          </button>
        </div>
        <div className="divide-y divide-gray-100">
          {showAddAccount && (
            <div className="flex items-center gap-3 px-5 py-3 bg-blue-50/50">
              <input type="text" value={accountName} onChange={e => setAccountName(e.target.value)} placeholder="Account name" className={inputClasses + ' flex-1'} autoFocus />
              <input type="text" value={accountInstitution} onChange={e => setAccountInstitution(e.target.value)} placeholder="Institution" className={inputClasses + ' w-36'} />
              <select value={accountType} onChange={e => setAccountType(e.target.value as Account['type'])} className={inputClasses + ' w-32'}>
                <option value="checking">Checking</option>
                <option value="savings">Savings</option>
                <option value="credit_card">Credit Card</option>
                <option value="other">Other</option>
              </select>
              <button onClick={handleAddAccount} disabled={!accountName.trim()} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg disabled:opacity-30"><Check size={16} /></button>
              <button onClick={() => setShowAddAccount(false)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"><X size={16} /></button>
            </div>
          )}
          {accounts.length === 0 && !showAddAccount && (
            <p className="px-5 py-8 text-center text-sm text-gray-400">No accounts yet. Accounts are created automatically when you import a CSV.</p>
          )}
          {accounts.map(a => (
            <div key={a.id} className="flex items-center gap-3 px-5 py-3">
              {editingAccountId === a.id ? (
                <>
                  <input type="text" value={accountName} onChange={e => setAccountName(e.target.value)} className={inputClasses + ' flex-1'} autoFocus />
                  <input type="text" value={accountInstitution} onChange={e => setAccountInstitution(e.target.value)} placeholder="Institution" className={inputClasses + ' w-36'} />
                  <select value={accountType} onChange={e => setAccountType(e.target.value as Account['type'])} className={inputClasses + ' w-32'}>
                    <option value="checking">Checking</option>
                    <option value="savings">Savings</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="other">Other</option>
                  </select>
                  <button onClick={handleSaveAccount} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"><Check size={16} /></button>
                  <button onClick={() => setEditingAccountId(null)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"><X size={16} /></button>
                </>
              ) : (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{a.name}</p>
                    <p className="text-xs text-gray-500">{a.institution} &middot; {ACCOUNT_TYPE_LABELS[a.type]}</p>
                  </div>
                  <button onClick={() => startEditAccount(a)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"><Pencil size={14} /></button>
                  {confirmDeleteAccountId === a.id ? (
                    <button onClick={async () => { await deleteAccount(a.id); setConfirmDeleteAccountId(null); }} className="p-1.5 text-red-600 bg-red-50 rounded-lg hover:bg-red-100"><Trash2 size={14} /></button>
                  ) : (
                    <button onClick={() => setConfirmDeleteAccountId(a.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* === Income Types === */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700">Income Types</h3>
          <button
            onClick={() => {
              setShowAddIncomeType(true);
              setEditingIncomeTypeId(null);
              setIncomeTypeName('');
            }}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Plus size={14} /> Add Income Type
          </button>
        </div>
        <div className="divide-y divide-gray-100">
          {showAddIncomeType && (
            <div className="flex items-center gap-3 px-5 py-3 bg-blue-50/50">
              <input type="text" value={incomeTypeName} onChange={e => setIncomeTypeName(e.target.value)} placeholder="Income type name" className={inputClasses + ' flex-1'} autoFocus onKeyDown={e => e.key === 'Enter' && handleAddIncomeType()} />
              <button onClick={handleAddIncomeType} disabled={!incomeTypeName.trim()} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg disabled:opacity-30"><Check size={16} /></button>
              <button onClick={() => setShowAddIncomeType(false)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"><X size={16} /></button>
            </div>
          )}
          {incomeTypes.map(t => (
            <div key={t.id} className="flex items-center gap-3 px-5 py-3">
              {editingIncomeTypeId === t.id ? (
                <>
                  <input type="text" value={incomeTypeName} onChange={e => setIncomeTypeName(e.target.value)} className={inputClasses + ' flex-1'} autoFocus onKeyDown={e => e.key === 'Enter' && handleSaveIncomeType()} />
                  <button onClick={handleSaveIncomeType} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"><Check size={16} /></button>
                  <button onClick={() => setEditingIncomeTypeId(null)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"><X size={16} /></button>
                </>
              ) : (
                <>
                  <span className="text-sm text-gray-900 flex-1">{t.name}</span>
                  {t.isDefault && <span className="text-xs text-gray-400">Default</span>}
                  <button onClick={() => startEditIncomeType(t)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"><Pencil size={14} /></button>
                  {!t.isDefault && (
                    confirmDeleteIncomeTypeId === t.id ? (
                      <button onClick={async () => { await deleteIncomeType(t.id); setConfirmDeleteIncomeTypeId(null); }} className="p-1.5 text-red-600 bg-red-50 rounded-lg hover:bg-red-100"><Trash2 size={14} /></button>
                    ) : (
                      <button onClick={() => setConfirmDeleteIncomeTypeId(t.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                    )
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
