import React, { useState } from 'react';
import { X, Plus, Trash2, Layers, FolderPlus, Wrench, Users, Box, Truck } from 'lucide-react';
import { CostCategoryDefinition, ProcurementCostClassification } from '../../../types/procurement';
import { procurementCostService } from '../../../services/procurementCostService';

interface CostCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryToEdit?: CostCategoryDefinition | null;
  defaultClassification?: ProcurementCostClassification;
  onCategorySaved: (cat: CostCategoryDefinition) => void;
}

export const CostCategoryModal: React.FC<CostCategoryModalProps> = ({
  isOpen,
  onClose,
  categoryToEdit,
  defaultClassification = 'RAW_MATERIAL',
  onCategorySaved
}) => {
  const [classification, setClassification] = useState<ProcurementCostClassification>(
    categoryToEdit?.classification || defaultClassification
  );
  const [name, setName] = useState(categoryToEdit?.name || '');
  const [code, setCode] = useState(categoryToEdit?.code || '');
  const [description, setDescription] = useState(categoryToEdit?.description || '');
  const [subCategories, setSubCategories] = useState<string[]>(
    categoryToEdit?.subCategories || []
  );
  const [newSubCatInput, setNewSubCatInput] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleAddSubCategory = () => {
    const trimmed = newSubCatInput.trim();
    if (!trimmed) return;
    if (subCategories.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
      setError('This subcategory already exists in this category.');
      return;
    }
    setSubCategories([...subCategories, trimmed]);
    setNewSubCatInput('');
    setError('');
  };

  const handleRemoveSubCategory = (index: number) => {
    setSubCategories(subCategories.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Category Name is required.');
      return;
    }

    const saved = procurementCostService.saveCategory({
      id: categoryToEdit?.id,
      name: name.trim(),
      code: code.trim() || name.toUpperCase().replace(/[^A-Z0-9]/g, '_').slice(0, 10),
      classification,
      description: description.trim(),
      icon: classification === 'OUTSIDE_SERVICE' ? 'Wrench'
        : classification === 'SUBCONTRACTOR_LABOUR' ? 'Users'
        : classification === 'EQUIPMENT_PLANT' ? 'Box'
        : classification === 'LOGISTICS_CONTRACT' ? 'Truck'
        : 'Layers',
      subCategories
    });

    onCategorySaved(saved);
    onClose();
  };

  const classificationOptions: { id: ProcurementCostClassification; label: string; icon: any; desc: string }[] = [
    {
      id: 'RAW_MATERIAL',
      label: 'Materials & Consumables',
      icon: Layers,
      desc: 'Extrusions, glass sheets, fasteners, structural sealants & hardware'
    },
    {
      id: 'OUTSIDE_SERVICE',
      label: 'Outside Services Rendered',
      icon: Wrench,
      desc: 'External powder coating, anodizing, CNC machining, glass toughening & lab testing'
    },
    {
      id: 'SUBCONTRACTOR_LABOUR',
      label: 'Subcontractor Services & Labour',
      icon: Users,
      desc: 'Installation crews, silicone applicators, crane lifting gangs & labour contracts'
    },
    {
      id: 'EQUIPMENT_PLANT',
      label: 'Equipment & Plant Rental',
      icon: Box,
      desc: 'BMU suspended cradles, spider cranes, scissor lifts & site power generators'
    },
    {
      id: 'LOGISTICS_CONTRACT',
      label: 'Logistics, Freight & Contracts',
      icon: Truck,
      desc: 'Heavy flatbeds, sea freight, container port clearance & site offloading'
    }
  ];

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div 
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center shadow-xs">
              <FolderPlus size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {categoryToEdit ? 'Edit Cost Category & Subcategories' : 'Create New Cost Category'}
              </h2>
              <p className="text-[11px] text-slate-500">
                Organize procurement materials, outside services, subcontractor labour & plant hire
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar text-xs">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-medium">
              {error}
            </div>
          )}

          {/* Classification Selection */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Cost Classification <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {classificationOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = classification === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setClassification(opt.id)}
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-orange-500 bg-orange-50/50 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      <Icon size={14} />
                    </div>
                    <div className="min-w-0">
                      <div className={`font-semibold text-xs ${isSelected ? 'text-orange-950' : 'text-slate-800'}`}>
                        {opt.label}
                      </div>
                      <div className="text-[10px] text-slate-500 line-clamp-1">
                        {opt.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Name & Code */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Category Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Architectural Glazing Systems, Anodizing Services..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white transition-colors"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Category Code
              </label>
              <input
                type="text"
                placeholder="e.g. RAW_GLZ"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-medium text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white transition-colors uppercase"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Description & Scope
            </label>
            <textarea
              rows={2}
              placeholder="Provide a brief summary of cost items and components covered by this category..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white transition-colors resize-none"
            />
          </div>

          {/* Subcategories Manager */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-semibold text-slate-700">
                Subcategories ({subCategories.length})
              </label>
              <span className="text-[10px] text-slate-400">
                Add specific sub-groups for granular procurement grouping
              </span>
            </div>

            {/* Input to add subcategory */}
            <div className="flex items-center gap-2 mb-2.5">
              <input
                type="text"
                placeholder="e.g. Extrusions & Billet Alloys, Toughened Glass, Structural Sealant..."
                value={newSubCatInput}
                onChange={(e) => setNewSubCatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubCategory();
                  }
                }}
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white transition-colors"
              />
              <button
                type="button"
                onClick={handleAddSubCategory}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-semibold transition-colors cursor-pointer shrink-0"
              >
                <Plus size={13} />
                <span>Add Subcategory</span>
              </button>
            </div>

            {/* Subcategories Chips */}
            {subCategories.length === 0 ? (
              <div className="p-4 border border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-xs">
                No subcategories added yet. Type a subcategory name above and press Add.
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-2 bg-slate-50/70 border border-slate-200 rounded-xl">
                {subCategories.map((sub, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-800 font-medium text-[11px] shadow-2xs group"
                  >
                    <span>{sub}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubCategory(idx)}
                      className="text-slate-400 hover:text-red-500 transition-colors p-0.5 rounded cursor-pointer"
                      title="Remove subcategory"
                    >
                      <Trash2 size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Footer Action Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <FolderPlus size={14} />
              <span>{categoryToEdit ? 'Save Changes' : 'Create Category'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
