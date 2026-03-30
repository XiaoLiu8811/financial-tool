import { useState } from 'react';
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import type { CategoryRule } from '../../types/transaction';
import { useCategoryStore } from '../../store/useCategoryStore';
import { Modal } from '../ui/Modal';

interface CategoryRuleEditorProps {
  categoryId: string;
  onClose: () => void;
}

export function CategoryRuleEditor({ categoryId, onClose }: CategoryRuleEditorProps) {
  const { categories, rules, addRule, updateRule, deleteRule } = useCategoryStore();
  const category = categories.find(c => c.id === categoryId);
  const categoryRules = rules.filter(r => r.categoryId === categoryId);

  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Form state
  const [keywordInput, setKeywordInput] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [priority, setPriority] = useState(0);
  const [isRegex, setIsRegex] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(false);

  function resetForm() {
    setKeywordInput('');
    setKeywords([]);
    setPriority(0);
    setIsRegex(false);
    setCaseSensitive(false);
  }

  function startEdit(rule: CategoryRule) {
    setEditingId(rule.id);
    setKeywords([...rule.keywords]);
    setKeywordInput('');
    setPriority(rule.priority);
    setIsRegex(rule.isRegex);
    setCaseSensitive(rule.caseSensitive);
    setShowAdd(false);
  }

  function cancelEdit() {
    setEditingId(null);
    resetForm();
  }

  function handleKeywordInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addKeywordFromInput();
    }
    if (e.key === 'Backspace' && keywordInput === '' && keywords.length > 0) {
      setKeywords(kw => kw.slice(0, -1));
    }
  }

  function addKeywordFromInput() {
    const trimmed = keywordInput.trim().replace(/,+$/, '').trim();
    if (trimmed && !keywords.includes(trimmed)) {
      setKeywords(kw => [...kw, trimmed]);
    }
    setKeywordInput('');
  }

  function removeKeyword(index: number) {
    setKeywords(kw => kw.filter((_, i) => i !== index));
  }

  async function handleAdd() {
    // Also pick up anything currently typed
    const finalKeywords = [...keywords];
    const trimmed = keywordInput.trim().replace(/,+$/, '').trim();
    if (trimmed && !finalKeywords.includes(trimmed)) {
      finalKeywords.push(trimmed);
    }
    if (finalKeywords.length === 0) return;

    await addRule({
      id: 'rule-' + crypto.randomUUID(),
      categoryId,
      keywords: finalKeywords,
      priority,
      isRegex,
      caseSensitive,
    });
    setShowAdd(false);
    resetForm();
  }

  async function handleUpdate() {
    if (!editingId) return;
    const finalKeywords = [...keywords];
    const trimmed = keywordInput.trim().replace(/,+$/, '').trim();
    if (trimmed && !finalKeywords.includes(trimmed)) {
      finalKeywords.push(trimmed);
    }
    if (finalKeywords.length === 0) return;

    await updateRule(editingId, {
      keywords: finalKeywords,
      priority,
      isRegex,
      caseSensitive,
    });
    cancelEdit();
  }

  async function handleDelete(id: string) {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      return;
    }
    await deleteRule(id);
    setConfirmDeleteId(null);
  }

  function RuleForm({ isEdit }: { isEdit: boolean }) {
    return (
      <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
        {/* Keywords */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Keywords</label>
          <div className="flex flex-wrap items-center gap-1.5 p-2 bg-white border border-gray-300 rounded-lg min-h-[40px] focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
            {keywords.map((kw, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-md"
              >
                {kw}
                <button
                  onClick={() => removeKeyword(i)}
                  className="hover:text-blue-900 transition-colors"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
            <input
              type="text"
              value={keywordInput}
              onChange={e => setKeywordInput(e.target.value)}
              onKeyDown={handleKeywordInputKeyDown}
              onBlur={addKeywordFromInput}
              placeholder={keywords.length === 0 ? 'Type keyword and press Enter or comma...' : ''}
              className="flex-1 min-w-[120px] text-sm outline-none bg-transparent"
            />
          </div>
        </div>

        {/* Priority & Options */}
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Priority</label>
            <input
              type="number"
              value={priority}
              onChange={e => setPriority(Number(e.target.value))}
              className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <label className="inline-flex items-center gap-2 py-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={isRegex}
              onChange={e => setIsRegex(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Regex
          </label>
          <label className="inline-flex items-center gap-2 py-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={caseSensitive}
              onChange={e => setCaseSensitive(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Case sensitive
          </label>

          <div className="flex gap-2 ml-auto">
            <button
              onClick={isEdit ? handleUpdate : handleAdd}
              className="inline-flex items-center gap-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Check size={14} />
              {isEdit ? 'Update' : 'Add Rule'}
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
      </div>
    );
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Rules for ${category?.name ?? 'Category'}`}
      wide
    >
      <div className="space-y-4">
        {/* Add button */}
        {!showAdd && editingId === null && (
          <button
            onClick={() => { setShowAdd(true); resetForm(); }}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={14} />
            Add Rule
          </button>
        )}

        {/* Add Form */}
        {showAdd && <RuleForm isEdit={false} />}

        {/* Rule list */}
        {categoryRules.length === 0 && !showAdd ? (
          <p className="text-sm text-gray-400 text-center py-8">No rules yet. Add a rule to auto-categorize transactions.</p>
        ) : (
          <div className="space-y-2">
            {categoryRules.map(rule => (
              <div key={rule.id}>
                {editingId === rule.id ? (
                  <RuleForm isEdit />
                ) : (
                  <div className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg group hover:border-gray-300 transition-colors">
                    {/* Keywords */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap gap-1.5 mb-1.5">
                        {rule.keywords.map((kw, i) => (
                          <span
                            key={i}
                            className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-md font-mono"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span>Priority: {rule.priority}</span>
                        {rule.isRegex && <span className="text-orange-500">Regex</span>}
                        {rule.caseSensitive && <span>Case-sensitive</span>}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={() => startEdit(rule)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(rule.id)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          confirmDeleteId === rule.id
                            ? 'text-white bg-red-600 hover:bg-red-700'
                            : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                        }`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
