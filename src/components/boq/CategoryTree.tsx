import React, { useState, useMemo } from 'react';
import { 
  ChevronRight, ChevronDown, 
  Plus, Edit2, Trash2,
  Layers, Package, Search,
  FolderPlus, ChevronDownSquare, ChevronRightSquare
} from 'lucide-react';
import { ItemCategory, ItemTemplate } from '../../types';
import { cn } from '../../lib/utils';

interface CategoryTreeProps {
  categories: ItemCategory[];
  items: ItemTemplate[];
  selectedCategoryId: string | 'All';
  onSelectCategory: (categoryId: string | 'All') => void;
  onAddMainCategory: () => void;
  onAddSubCategory: (parentCategoryId: string) => void;
  onEditCategory: (category: ItemCategory) => void;
  onDeleteCategory: (categoryId: string) => void;
  onAddItemToCategory: (categoryId: string) => void;
}

export const CategoryTree: React.FC<CategoryTreeProps> = ({
  categories,
  items,
  selectedCategoryId,
  onSelectCategory,
  onAddMainCategory,
  onAddSubCategory,
  onEditCategory,
  onDeleteCategory,
  onAddItemToCategory
}) => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    // Expand root categories by default
    return new Set(categories.map(c => c.id));
  });
  const [searchFilter, setSearchFilter] = useState('');

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleExpandAll = () => {
    setExpandedIds(new Set(categories.map(c => c.id)));
  };

  const handleCollapseAll = () => {
    setExpandedIds(new Set());
  };

  // Precompute children map
  const childrenMap = useMemo(() => {
    const map = new Map<string | null, ItemCategory[]>();
    categories.forEach(cat => {
      const pId = cat.parentId || null;
      if (!map.has(pId)) map.set(pId, []);
      map.get(pId)!.push(cat);
    });
    // Sort by order or name
    map.forEach(list => list.sort((a, b) => (a.order || 0) - (b.order || 0) || a.name.localeCompare(b.name)));
    return map;
  }, [categories]);

  // Precompute items count per category (direct count & total descendant count)
  const { directItemCounts, totalItemCounts } = useMemo(() => {
    const direct = new Map<string, number>();
    const total = new Map<string, number>();

    // Direct counts
    categories.forEach(c => direct.set(c.id, 0));
    items.forEach(item => {
      // Check categoryId, subCategoryId, or matching category name
      let catId = item.categoryId;
      if (!catId) {
        const matchingCat = categories.find(c => 
          c.name.toLowerCase() === item.category.toLowerCase() ||
          (item.subCategory && c.name.toLowerCase() === item.subCategory.toLowerCase())
        );
        catId = matchingCat?.id;
      }
      if (catId && direct.has(catId)) {
        direct.set(catId, (direct.get(catId) || 0) + 1);
      }
    });

    // Compute total descendant items recursively
    const computeTotal = (catId: string): number => {
      let count = direct.get(catId) || 0;
      const children = childrenMap.get(catId) || [];
      for (const child of children) {
        count += computeTotal(child.id);
      }
      total.set(catId, count);
      return count;
    };

    categories.forEach(cat => {
      if (!cat.parentId) {
        computeTotal(cat.id);
      }
    });

    return { directItemCounts: direct, totalItemCounts: total };
  }, [categories, items, childrenMap]);

  // Check matching search
  const matchesSearch = (cat: ItemCategory): boolean => {
    if (!searchFilter.trim()) return true;
    const query = searchFilter.toLowerCase();
    return (
      cat.name.toLowerCase().includes(query) ||
      (cat.description && cat.description.toLowerCase().includes(query)) ||
      (cat.tags && cat.tags.some(t => t.toLowerCase().includes(query)))
    );
  };

  // Check if category or any of its descendants matches search
  const isCategoryOrDescendantMatching = (cat: ItemCategory): boolean => {
    if (matchesSearch(cat)) return true;
    const children = childrenMap.get(cat.id) || [];
    return children.some(isCategoryOrDescendantMatching);
  };

  // Recursive tree node renderer
  const renderCategoryNode = (category: ItemCategory, depth: number = 0) => {
    const children = childrenMap.get(category.id) || [];
    const hasChildren = children.length > 0;
    const isExpanded = expandedIds.has(category.id) || searchFilter.trim().length > 0;
    const isSelected = selectedCategoryId === category.id;
    const directCount = directItemCounts.get(category.id) || 0;
    const totalCount = totalItemCounts.get(category.id) || 0;

    if (searchFilter.trim() && !isCategoryOrDescendantMatching(category)) {
      return null;
    }

    return (
      <div key={category.id} className="relative select-none">
        {/* Node Row */}
        <div
          onClick={() => onSelectCategory(category.id)}
          className={cn(
            "group relative flex items-center justify-between py-1.5 px-2 rounded-lg cursor-pointer transition-all text-xs",
            isSelected 
              ? "bg-orange-50/90 text-orange-950 font-semibold shadow-2xs border border-orange-200/80" 
              : "text-slate-700 hover:bg-slate-100/80 hover:text-slate-900",
            depth > 0 && "ml-3 border-l-2 border-slate-200/60 pl-2"
          )}
          style={{ paddingLeft: `${Math.max(6, depth * 8)}px` }}
        >
          {/* Left: Expand toggle, Category color dot/icon, and Name */}
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => toggleExpand(category.id, e)}
                className="p-0.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors shrink-0"
              >
                {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
              </button>
            ) : (
              <span className="w-4 shrink-0" />
            )}

            <div 
              className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
              style={{ backgroundColor: category.color || '#0ea5e9' }}
            />

            <span className="truncate leading-tight font-medium" title={category.name}>
              {category.name}
            </span>
          </div>

          {/* Right: Item counts & Quick action buttons */}
          <div className="flex items-center gap-1 shrink-0 ml-1">
            {/* Item count badge */}
            <span 
              className={cn(
                "text-[10px] px-1.5 py-0.5 rounded-full font-medium transition-colors",
                isSelected
                  ? "bg-orange-200/70 text-orange-800"
                  : "bg-slate-100 text-slate-500 group-hover:bg-slate-200/70"
              )}
              title={`${directCount} direct items, ${totalCount} total including subcategories`}
            >
              {totalCount}
            </span>

            {/* Hover Action Menu */}
            <div className="hidden group-hover:flex items-center gap-0.5 bg-white/90 rounded-md shadow-2xs border border-slate-200/60 p-0.5">
              {/* Add Item directly to this category */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddItemToCategory(category.id);
                }}
                className="p-1 rounded text-slate-400 hover:text-orange-600 hover:bg-orange-50 transition-colors"
                title="Add Item under this category"
              >
                <Plus size={11} />
              </button>

              {/* Add Sub-category under this category */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddSubCategory(category.id);
                }}
                className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                title="Create Sub-category"
              >
                <FolderPlus size={11} />
              </button>

              {/* Edit category */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditCategory(category);
                }}
                className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                title="Edit Category"
              >
                <Edit2 size={11} />
              </button>

              {/* Delete category */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Delete category "${category.name}"? Sub-categories and items will remain or be unassigned.`)) {
                    onDeleteCategory(category.id);
                  }
                }}
                className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title="Delete Category"
              >
                <Trash2 size={11} />
              </button>
            </div>
          </div>
        </div>

        {/* Children Nodes (Recursive) */}
        {hasChildren && isExpanded && (
          <div className="space-y-0.5 mt-0.5">
            {children.map(child => renderCategoryNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const rootCategories = childrenMap.get(null) || [];

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200/80 w-80 shrink-0 select-none">
      {/* Tree Header */}
      <div className="p-3 border-b border-slate-200/80 bg-slate-50/60">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Layers size={15} className="text-orange-500" />
            <span className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
              Category Hierarchy
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleExpandAll}
              className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors text-[10px]"
              title="Expand All"
            >
              <ChevronDownSquare size={13} />
            </button>
            <button
              onClick={handleCollapseAll}
              className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors text-[10px]"
              title="Collapse All"
            >
              <ChevronRightSquare size={13} />
            </button>
          </div>
        </div>

        {/* Search Categories */}
        <div className="relative mb-2">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Filter categories & sub-categories..."
            className="w-full text-xs pl-7 pr-2 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>

        {/* Add Main Category Button */}
        <button
          onClick={onAddMainCategory}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-white hover:bg-orange-50 text-orange-600 border border-orange-200/80 rounded-lg text-xs font-semibold transition-all shadow-2xs hover:border-orange-300"
        >
          <Plus size={13} />
          <span>New Main Category</span>
        </button>
      </div>

      {/* Tree Content */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {/* "All Items" Root Option */}
        <div
          onClick={() => onSelectCategory('All')}
          className={cn(
            "flex items-center justify-between py-1.5 px-2 rounded-lg cursor-pointer transition-all text-xs",
            selectedCategoryId === 'All'
              ? "bg-orange-50 text-orange-950 font-semibold border border-orange-200/80 shadow-2xs"
              : "text-slate-700 hover:bg-slate-100/80 hover:text-slate-900"
          )}
        >
          <div className="flex items-center gap-2">
            <Package size={14} className={selectedCategoryId === 'All' ? 'text-orange-600' : 'text-slate-400'} />
            <span className="font-semibold">All Items (Unfiltered)</span>
          </div>
          <span 
            className={cn(
              "text-[10px] px-1.5 py-0.5 rounded-full font-semibold",
              selectedCategoryId === 'All' ? "bg-orange-200 text-orange-800" : "bg-slate-100 text-slate-600"
            )}
          >
            {items.length}
          </span>
        </div>

        <div className="h-px bg-slate-100 my-1" />

        {/* Categories Tree */}
        {rootCategories.length === 0 ? (
          <div className="p-4 text-center text-slate-400 text-xs">
            No categories defined yet.
          </div>
        ) : (
          rootCategories.map(cat => renderCategoryNode(cat, 0))
        )}
      </div>

      {/* Tree Footer / Quick Help */}
      <div className="p-2.5 border-t border-slate-100 bg-slate-50/50 text-[11px] text-slate-400 flex items-center justify-between">
        <span>{categories.length} Categories</span>
        <span className="text-[10px] text-slate-400">Hover for sub-category tools</span>
      </div>
    </div>
  );
};
