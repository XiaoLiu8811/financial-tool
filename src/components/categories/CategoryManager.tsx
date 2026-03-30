import { useState } from 'react';
import { Plus, Pencil, Trash2, RefreshCw, X, Check, Settings } from 'lucide-react';
import type { Category } from '../../types/transaction';
import { useCategoryStore } from '../../store/useCategoryStore';
import { useTransactionStore } from '../../store/useTransactionStore';
import { categorizeTransaction } from '../../lib/categorization-engine';
import { CategoryRuleEditor } from './CategoryRuleEditor';

export function CategoryManager() {
  const { categories, rules, addCategory, updateCategory, deleteCategory } = useCategoryStore();
  const { transactions, bulkUpdateCategory } = useTransactionStore();

  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [ruleEditorCategoryId, setRuleEditorCategoryId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [recategorizing, setRecategorizing] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formColor, setFormColor] = useState('#6366f1');
  const [formType, setFormType] = useState<Category['type']>('expense');
  const [formIcon, setFormIcon] = useState('');

  function resetForm() {
    setFormName('');
    setFormColor('#6366f1');
    setFormType('expense');
    setFormIcon('');
  }

  function startEdit(cat: Category) {
    setEditingId(cat.id);
    setFormName(cat.name);
    setFormColor(cat.color);
    setFormType(cat.type);
    setFormIcon(cat.icon ?? '');
    setShowAdd(false);
  }

  function cancelEdit() {
    setEditingId(null);
    resetForm();
  }

  async function handleAdd() {
    if (!formName.trim()) return;
    const id = 'cat-' + crypto.randomUUID();
    await addCategory({
      id,
      name: formName.trim(),
      color: formColor,
      type: formType,
      icon: formIcon.trim() || undefined,
      isDefault: false,
    });
    setShowAdd(false);
    resetForm();
  }

  async function handleUpdate() {
    if (!editingId || !formName.trim()) return;
    await updateCategory(editingId, {
      name: formName.trim(),
      color: formColor,
      type: formType,
      icon: formIcon.trim() || undefined,
    });
    cancelEdit();
  }

  async function handleDelete(id: string) {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      return;
    }
    await deleteCategory(id);
    setConfirmDeleteId(null);
  }

  async function handleRecategorizeAll() {
    setRecategorizing(true);
    try {
      // Group transactions that are auto-categorized by their new category
      const updates: Record<string, string[]> = {};

      for (const tx of transactions) {
        if (tx.categorySource === 'manual') continue;
        const result = categorizeTransaction(tx.description, tx.amount, rules);
        if (result.categoryId !== tx.categoryId) {
          if (!updates[result.categoryId]) updates[result.categoryId] = [];
          updates[result.categoryId].push(tx.id);
        }
      }

      for (const [catId, ids] of Object.entries(updates)) {
        await bulkUpdateCategory(ids, catId, 'auto');
      }
    } finally {
      setRecategorizing(false);
    }
  }

  function ruleCount(categoryId: string) {
    return rules.filter(r => r.categoryId === categoryId).length;
  }

  const isEdit = editingId !== null;

  const categoryForm = (
    <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex-1 min-w-0">
        <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
        <input
          type="text"
          value={formName}
          onChange={e => setFormName(e.target.value)}
          placeholder="Category name"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          autoFocus
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Color</label>
        <input
          type="color"
          value={formColor}
          onChange={e => setFormColor(e.target.value)}
          className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
        <select
          value={formType}
          onChange={e => setFormType(e.target.value as Category['type'])}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="expense">Expense</option>
          <option value="income">Income</option>
          <option value="both">Both</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Icon (optional)</label>
        <input
          type="text"
          value={formIcon}
          onChange={e => setFormIcon(e.target.value)}
          placeholder="e.g. cart"
          className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={isEdit ? handleUpdate : handleAdd}
          className="inline-flex items-center gap-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Check size={14} />
          {isEdit ? 'Update' : 'Add'}
        </button>
        <button
          onClick={() => { isEdit ? cancelEdit() : setShowAdd(false); resetForm(); }}
          className="inline-flex items-center gap-1 px-3 py-2 text-gray-600 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <X size={14} />
          Cancel
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Categories</h2>
        <div className="flex gap-2">
          <button
            onClick={handleRecategorizeAll}
            disabled={recategorizing}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <RefreshCw size={14} className={recategorizing ? 'animate-spin' : ''} />
            {recategorizing ? 'Re-categorizing...' : 'Re-categorize All'}
          </button>
          <button
            onClick={() => { setShowAdd(true); setEditingId(null); resetForm(); }}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={14} />
            Add Category
          </button>
        </div>
      </div>

      {/* Add Form */}
      {showAdd && categoryForm}

      {/* Category List */}
      <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
        {categories.length === 0 ? (
          <div className="px-4 py-12 text-center text-gray-400 text-sm">No categories yet.</div>
        ) : (
          categories.map(cat => (
            <div key={cat.id}>
              {editingId === cat.id ? (
                <div className="p-3">
                  {categoryForm}
                </div>
              ) : (
                <div className="flex items-center gap-3 px-4 py-3 group">
                  {/* Color badge */}
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />

                  {/* Name & type */}
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-gray-900">{cat.name}</span>
                    <span className="ml-2 text-xs text-gray-400 capitalize">{cat.type}</span>
                    {cat.isDefault && (
                      <span className="ml-2 text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">default</span>
                    )}
                  </div>

                  {/* Rule count */}
                  <button
                    onClick={() => setRuleEditorCategoryId(cat.id)}
                    className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 transition-colors"
                  >
                    <Settings size={12} />
                    {ruleCount(cat.id)} {ruleCount(cat.id) === 1 ? 'rule' : 'rules'}
                  </button>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEdit(cat)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                    {!cat.isDefault ? (
                      <button
                        onClick={() => handleDelete(cat.id)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          confirmDeleteId === cat.id
                            ? 'text-white bg-red-600 hover:bg-red-700'
                            : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                        }`}
                        title={confirmDeleteId === cat.id ? 'Click again to confirm. Transactions will become uncategorized.' : 'Delete category'}
                      >
                        <Trash2 size={14} />
                      </button>
                    ) : (
                      <span className="p-1.5 text-gray-200" title="Cannot delete default category">
                        <Trash2 size={14} />
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Confirm delete warning */}
      {confirmDeleteId && (
        <p className="text-xs text-red-500">
          Click delete again to confirm. Transactions in this category will become uncategorized.
        </p>
      )}

      {/* Rule Editor Modal */}
      {ruleEditorCategoryId && (
        <CategoryRuleEditor
          categoryId={ruleEditorCategoryId}
          onClose={() => setRuleEditorCategoryId(null)}
        />
      )}
    </div>
  );
}
