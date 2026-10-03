import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, FolderPlus, Palette, Tag, Check, Layers } from 'lucide-react';
import { ItemCategory, ProductType } from '../../types';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (category: ItemCategory) => void;
  categories: ItemCategory[];
  initialParentId?: string | null;
  categoryToEdit?: ItemCategory | null;
}

const PRESET_COLORS = [
  '#0ea5e9', // Sky blue
  '#0284c7', // Darker sky
  '#10b981', // Emerald
  '#6366f1', // Indigo
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#f59e0b', // Amber
  '#f97316', // Orange
  '#64748b', // Slate
  '#14b8a6', // Teal
];

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  categories,
  initialParentId = null,
  categoryToEdit = null
}) => {
  const [name, setName] = useState(categoryToEdit?.name || '');
  const [description, setDescription] = useState(categoryToEdit?.description || '');
  const [parentId, setParentId] = useState<string | null>(
    categoryToEdit ? (categoryToEdit.parentId || null) : initialParentId
  );
  const [color, setColor] = useState(categoryToEdit?.color || '#0ea5e9');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(categoryToEdit?.tags || []);
  const [type, setType] = useState<ProductType>(categoryToEdit?.type || 'Product');

  if (!isOpen) return null;

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tToRemove: string) => {
    setTags(tags.filter(t => t !== tToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newCategory: ItemCategory = {
      id: categoryToEdit?.id || `cat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      parentId: parentId || null,
      description: description.trim(),
      color,
      tags,
      type,
      displayTile: true,
      itemCount: categoryToEdit?.itemCount || 0,
      order: categoryToEdit?.order || Date.now()
    };

    onSave(newCategory);
    onClose();
  };

  // Build hierarchical options for parent selector
  // Prevent selecting self or descendant as parent when editing
  const getEligibleParents = () => {
    if (!categoryToEdit) return categories;
    
    // Find all descendant IDs of categoryToEdit
    const descendantIds = new Set<string>([categoryToEdit.id]);
    let added = true;
    while (added) {
      added = false;
      categories.forEach(c => {
        if (c.parentId && descendantIds.has(c.parentId) && !descendantIds.has(c.id)) {
          descendantIds.add(c.id);
          added = true;
        }
      });
    }

    return categories.filter(c => !descendantIds.has(c.id));
  };

  const eligibleParents = getEligibleParents();

  // Helper to format category name with hierarchy depth in dropdown
  const getCategoryDisplayLabel = (cat: ItemCategory): string => {
    const ancestors: string[] = [];
    let curParentId = cat.parentId;
    while (curParentId) {
      const parent = categories.find(c => c.id === curParentId);
      if (parent) {
        ancestors.unshift(parent.name);
        curParentId = parent.parentId;
      } else {
        break;
      }
    }
    return ancestors.length > 0 ? `${ancestors.join(' > ')} > ${cat.name}` : cat.name;
  };

  const modalContent = (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div 
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-xs"
              style={{ backgroundColor: color }}
            >
              <FolderPlus size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                {categoryToEdit ? 'Edit Category' : (parentId ? 'Create Sub-Category' : 'Create Main Category')}
              </h2>
              <p className="text-xs text-slate-500 font-normal">
                {parentId ? 'Subordinate category in BOQ hierarchical structure' : 'Top-level classification group'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Parent Category Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Layers size={13} className="text-slate-400" />
              Parent Classification
            </label>
            <select
              value={parentId || ''}
              onChange={(e) => setParentId(e.target.value ? e.target.value : null)}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            >
              <option value="">(None - Top Level Main Category)</option>
              {eligibleParents.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {getCategoryDisplayLabel(cat)}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              Select an existing category to nest under, or leave blank to make this a Main Category.
            </p>
          </div>

          {/* Category Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Category Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Aluminium Windows, Sliding Windows, Glass Glazing..."
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Scope / Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of items classified under this category..."
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none"
            />
          </div>

          {/* Product vs Service Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Classification Type</label>
              <div className="flex rounded-lg border border-slate-200 overflow-hidden p-0.5 bg-slate-50">
                <button
                  type="button"
                  onClick={() => setType('Product')}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    type === 'Product' ? 'bg-white text-orange-600 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Physical Product
                </button>
                <button
                  type="button"
                  onClick={() => setType('Service')}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    type === 'Service' ? 'bg-white text-orange-600 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Service / Work
                </button>
              </div>
            </div>

            {/* Color Theme */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Palette size={13} className="text-slate-400" /> Color Accent
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {PRESET_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className="w-5 h-5 rounded-md transition-transform hover:scale-110 flex items-center justify-center"
                    style={{ backgroundColor: c }}
                  >
                    {color === c && <Check size={12} className="text-white" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Tag size={13} className="text-slate-400" /> Filter Tags
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Type tag and press Enter (e.g., Extrusion, Glazed)..."
                className="flex-1 text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium"
              >
                Add
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map(t => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] bg-slate-100 text-slate-700 border border-slate-200"
                  >
                    {t}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="text-slate-400 hover:text-slate-700"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-all shadow-xs"
            >
              {categoryToEdit ? 'Update Category' : 'Save Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
