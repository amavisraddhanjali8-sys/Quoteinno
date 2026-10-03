import React, { useState } from 'react';
import { 
  Layers, 
  Wrench, 
  Users, 
  Box, 
  Truck, 
  ChevronRight, 
  ChevronDown, 
  Plus, 
  Edit2, 
  Trash2,
  Folder,
  Tag
} from 'lucide-react';
import { 
  CostCategoryDefinition, 
  ProcurementCostClassification, 
  ProcurementCostItem 
} from '../../../types/procurement';

interface CostCategoryTreeProps {
  categories: CostCategoryDefinition[];
  costItems: ProcurementCostItem[];
  selectedClassification: 'ALL' | ProcurementCostClassification;
  selectedCategoryId: string | null;
  selectedSubCategory: string | null;
  onSelectClassification: (classification: 'ALL' | ProcurementCostClassification) => void;
  onSelectCategory: (categoryId: string | null) => void;
  onSelectSubCategory: (subCategory: string | null) => void;
  onOpenNewCategoryModal: (defaultClassification?: ProcurementCostClassification) => void;
  onEditCategory: (category: CostCategoryDefinition) => void;
  onDeleteCategory: (categoryId: string) => void;
}

export const CostCategoryTree: React.FC<CostCategoryTreeProps> = ({
  categories,
  costItems,
  selectedClassification,
  selectedCategoryId,
  selectedSubCategory,
  onSelectClassification,
  onSelectCategory,
  onSelectSubCategory,
  onOpenNewCategoryModal,
  onEditCategory,
  onDeleteCategory
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    'cc-raw-mat': true,
    'cc-outside-srv': true,
    'cc-subcon-lab': true
  });

  const toggleExpand = (catId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };

  // Helper to count items per classification
  const countByClassification = (cls: ProcurementCostClassification) => {
    return costItems.filter(i => {
      if (i.classification) return i.classification === cls;
      if (cls === 'RAW_MATERIAL') return i.category === 'Materials';
      if (cls === 'OUTSIDE_SERVICE') return i.category === 'Outside Services' || i.category === 'Services';
      if (cls === 'SUBCONTRACTOR_LABOUR') return i.category === 'Subcontractor Services';
      if (cls === 'EQUIPMENT_PLANT') return i.category === 'Equipment & Plant';
      if (cls === 'LOGISTICS_CONTRACT') return i.category === 'Logistics & Contracts';
      return false;
    }).length;
  };

  // Count items per category
  const countByCategory = (cat: CostCategoryDefinition) => {
    return costItems.filter(i => {
      const matchName = i.category === cat.name || i.category === cat.code;
      const matchClassification = i.classification === cat.classification;
      return matchName || matchClassification;
    }).length;
  };

  // Count items per subcategory
  const countBySubCategory = (subCat: string) => {
    return costItems.filter(i => i.subCategory === subCat).length;
  };

  const classifications: { id: ProcurementCostClassification; label: string; icon: any; color: string }[] = [
    { id: 'RAW_MATERIAL', label: 'Materials & Consumables', icon: Layers, color: 'text-blue-500' },
    { id: 'OUTSIDE_SERVICE', label: 'Outside Services Rendered', icon: Wrench, color: 'text-purple-500' },
    { id: 'SUBCONTRACTOR_LABOUR', label: 'Subcontractor Labour', icon: Users, color: 'text-orange-500' },
    { id: 'EQUIPMENT_PLANT', label: 'Equipment & Plant', icon: Box, color: 'text-emerald-500' },
    { id: 'LOGISTICS_CONTRACT', label: 'Logistics & Freight', icon: Truck, color: 'text-indigo-500' }
  ];

  const filteredCategories = selectedClassification === 'ALL'
    ? categories
    : categories.filter(c => c.classification === selectedClassification);

  return (
    <div className="w-full lg:w-72 bg-white rounded-xl border border-slate-200/90 shadow-2xs flex flex-col shrink-0 overflow-hidden text-xs select-none">
      {/* Header */}
      <div className="px-3.5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Folder size={14} className="text-orange-500" />
          <span className="font-bold text-slate-800">Categories & Scopes</span>
        </div>
        <button
          onClick={() => onOpenNewCategoryModal(selectedClassification === 'ALL' ? 'RAW_MATERIAL' : selectedClassification)}
          className="flex items-center gap-1 px-2 py-0.5 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-md text-[11px] font-semibold transition-colors cursor-pointer"
          title="Add New Category"
        >
          <Plus size={11} />
          <span>New</span>
        </button>
      </div>

      {/* Classification Pills Filter */}
      <div className="p-2 border-b border-slate-100 bg-slate-50/50 space-y-1">
        <button
          onClick={() => {
            onSelectClassification('ALL');
            onSelectCategory(null);
            onSelectSubCategory(null);
          }}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
            selectedClassification === 'ALL' && selectedCategoryId === null
              ? 'bg-orange-500 text-white font-semibold shadow-xs'
              : 'text-slate-700 hover:bg-slate-200/60'
          }`}
        >
          <div className="flex items-center gap-2">
            <Layers size={13} />
            <span>All Classifications</span>
          </div>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
            selectedClassification === 'ALL' && selectedCategoryId === null ? 'bg-orange-600 text-white' : 'bg-slate-200 text-slate-600'
          }`}>
            {costItems.length}
          </span>
        </button>

        <div className="grid grid-cols-2 gap-1 pt-1">
          {classifications.map(cls => {
            const Icon = cls.icon;
            const count = countByClassification(cls.id);
            const isSelected = selectedClassification === cls.id;
            return (
              <button
                key={cls.id}
                onClick={() => {
                  onSelectClassification(cls.id);
                  onSelectCategory(null);
                  onSelectSubCategory(null);
                }}
                className={`flex items-center justify-between px-2 py-1 rounded-md text-[11px] transition-colors cursor-pointer border ${
                  isSelected
                    ? 'bg-orange-50 border-orange-300 text-orange-900 font-bold'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
                title={cls.label}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <Icon size={12} className={cls.color} />
                  <span className="truncate">{cls.label.split(' ')[0]}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono shrink-0">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Category List & Subcategories Tree */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar max-h-[550px]">
        {filteredCategories.length === 0 ? (
          <div className="p-4 text-center text-slate-400 text-xs">
            No categories defined for this classification yet.
          </div>
        ) : (
          filteredCategories.map(cat => {
            const isExpanded = !!expandedCategories[cat.id];
            const isCatSelected = selectedCategoryId === cat.id && !selectedSubCategory;
            const catCount = countByCategory(cat);
            const clsBadge = classifications.find(c => c.id === cat.classification);
            const Icon = clsBadge?.icon || Layers;

            return (
              <div key={cat.id} className="rounded-lg border border-slate-100 overflow-hidden bg-slate-50/30">
                {/* Category Header Row */}
                <div
                  className={`flex items-center justify-between px-2 py-1.5 transition-colors group cursor-pointer ${
                    isCatSelected
                      ? 'bg-orange-50 text-orange-900 font-bold border-l-3 border-orange-500'
                      : 'hover:bg-slate-100 text-slate-800'
                  }`}
                  onClick={() => {
                    onSelectCategory(cat.id);
                    onSelectSubCategory(null);
                  }}
                >
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(cat.id);
                      }}
                      className="p-0.5 text-slate-400 hover:text-slate-600 rounded transition-colors"
                    >
                      {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    </button>
                    <Icon size={12} className={clsBadge?.color || 'text-slate-500'} />
                    <span className="font-semibold truncate text-[11px]" title={cat.name}>
                      {cat.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[10px] font-mono text-slate-400 px-1 rounded bg-white border border-slate-200">
                      {catCount}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditCategory(cat);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-700 p-0.5 transition-opacity"
                      title="Edit Category"
                    >
                      <Edit2 size={11} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete category "${cat.name}"?`)) {
                          onDeleteCategory(cat.id);
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 p-0.5 transition-opacity"
                      title="Delete Category"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>

                {/* Subcategories (Expanded) */}
                {isExpanded && cat.subCategories && cat.subCategories.length > 0 && (
                  <div className="pl-6 pr-2 py-1 space-y-0.5 bg-white border-t border-slate-100">
                    {cat.subCategories.map((sub, sIdx) => {
                      const isSubSelected = selectedSubCategory === sub;
                      const subCount = countBySubCategory(sub);
                      return (
                        <button
                          key={sIdx}
                          type="button"
                          onClick={() => {
                            onSelectCategory(cat.id);
                            onSelectSubCategory(sub);
                          }}
                          className={`w-full flex items-center justify-between px-2 py-1 rounded text-left transition-colors cursor-pointer ${
                            isSubSelected
                              ? 'bg-orange-100 text-orange-950 font-bold'
                              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <Tag size={10} className={isSubSelected ? 'text-orange-600' : 'text-slate-400'} />
                            <span className="truncate text-[11px]" title={sub}>{sub}</span>
                          </div>
                          <span className="text-[9px] font-mono text-slate-400">
                            {subCount}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="p-2 border-t border-slate-100 bg-slate-50 text-[10px] text-slate-500 flex items-center justify-between">
        <span>{categories.length} Categories</span>
        <span>{categories.reduce((acc, c) => acc + (c.subCategories?.length || 0), 0)} Subcategories</span>
      </div>
    </div>
  );
};
