import { create } from 'zustand';
import { db } from '../lib/storage';
import { DEFAULT_CATEGORIES, DEFAULT_RULES } from '../lib/default-categories';
import type { Category, CategoryRule } from '../types/transaction';

interface CategoryState {
  categories: Category[];
  rules: CategoryRule[];
  isLoaded: boolean;
  loadCategories: () => Promise<void>;
  addCategory: (category: Category) => Promise<void>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addRule: (rule: CategoryRule) => Promise<void>;
  updateRule: (id: string, updates: Partial<CategoryRule>) => Promise<void>;
  deleteRule: (id: string) => Promise<void>;
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  rules: [],
  isLoaded: false,

  async loadCategories() {
    let categories = await db.categories.toArray();
    let rules = await db.categoryRules.toArray();

    // Seed defaults on first load
    if (categories.length === 0) {
      await db.categories.bulkAdd(DEFAULT_CATEGORIES);
      categories = DEFAULT_CATEGORIES;
    }
    if (rules.length === 0) {
      await db.categoryRules.bulkAdd(DEFAULT_RULES);
      rules = DEFAULT_RULES;
    }

    set({ categories, rules, isLoaded: true });
  },

  async addCategory(category) {
    await db.categories.add(category);
    set({ categories: [...get().categories, category] });
  },

  async updateCategory(id, updates) {
    await db.categories.update(id, updates);
    set({
      categories: get().categories.map(c => c.id === id ? { ...c, ...updates } : c),
    });
  },

  async deleteCategory(id) {
    await db.categories.delete(id);
    await db.categoryRules.where('categoryId').equals(id).delete();
    set({
      categories: get().categories.filter(c => c.id !== id),
      rules: get().rules.filter(r => r.categoryId !== id),
    });
  },

  async addRule(rule) {
    await db.categoryRules.add(rule);
    set({ rules: [...get().rules, rule] });
  },

  async updateRule(id, updates) {
    await db.categoryRules.update(id, updates);
    set({
      rules: get().rules.map(r => r.id === id ? { ...r, ...updates } : r),
    });
  },

  async deleteRule(id) {
    await db.categoryRules.delete(id);
    set({ rules: get().rules.filter(r => r.id !== id) });
  },
}));
