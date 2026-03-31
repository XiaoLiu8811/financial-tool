import { create } from 'zustand';
import { db } from '../lib/storage';
import { DEFAULT_INCOME_TYPES } from '../lib/default-income-types';
import type { Account, HouseholdMember, IncomeType } from '../types/transaction';

interface HouseholdState {
  accounts: Account[];
  members: HouseholdMember[];
  incomeTypes: IncomeType[];
  isLoaded: boolean;
  loadHousehold: () => Promise<void>;
  addAccount: (account: Account) => Promise<void>;
  updateAccount: (id: string, updates: Partial<Account>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  addMember: (member: HouseholdMember) => Promise<void>;
  updateMember: (id: string, updates: Partial<HouseholdMember>) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;
  addIncomeType: (incomeType: IncomeType) => Promise<void>;
  updateIncomeType: (id: string, updates: Partial<IncomeType>) => Promise<void>;
  deleteIncomeType: (id: string) => Promise<void>;
}

export const useHouseholdStore = create<HouseholdState>((set, get) => ({
  accounts: [],
  members: [],
  incomeTypes: [],
  isLoaded: false,

  async loadHousehold() {
    const accounts = await db.accounts.toArray();
    const members = await db.householdMembers.toArray();
    let incomeTypes = await db.incomeTypes.toArray();

    if (incomeTypes.length === 0) {
      await db.incomeTypes.bulkAdd(DEFAULT_INCOME_TYPES);
      incomeTypes = DEFAULT_INCOME_TYPES;
    }

    set({ accounts, members, incomeTypes, isLoaded: true });
  },

  async addAccount(account) {
    await db.accounts.add(account);
    set({ accounts: [...get().accounts, account] });
  },

  async updateAccount(id, updates) {
    await db.accounts.update(id, updates);
    set({ accounts: get().accounts.map(a => a.id === id ? { ...a, ...updates } : a) });
  },

  async deleteAccount(id) {
    await db.accounts.delete(id);
    set({ accounts: get().accounts.filter(a => a.id !== id) });
  },

  async addMember(member) {
    await db.householdMembers.add(member);
    set({ members: [...get().members, member] });
  },

  async updateMember(id, updates) {
    await db.householdMembers.update(id, updates);
    set({ members: get().members.map(m => m.id === id ? { ...m, ...updates } : m) });
  },

  async deleteMember(id) {
    await db.householdMembers.delete(id);
    set({ members: get().members.filter(m => m.id !== id) });
  },

  async addIncomeType(incomeType) {
    await db.incomeTypes.add(incomeType);
    set({ incomeTypes: [...get().incomeTypes, incomeType] });
  },

  async updateIncomeType(id, updates) {
    await db.incomeTypes.update(id, updates);
    set({ incomeTypes: get().incomeTypes.map(t => t.id === id ? { ...t, ...updates } : t) });
  },

  async deleteIncomeType(id) {
    await db.incomeTypes.delete(id);
    set({ incomeTypes: get().incomeTypes.filter(t => t.id !== id) });
  },
}));
