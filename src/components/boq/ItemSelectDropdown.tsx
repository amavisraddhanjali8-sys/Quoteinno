import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Search, ChevronDown, Check, X, Package, 
  ShieldCheck, FileText, ChevronLeft, ChevronRight, Filter, Plus, RotateCcw
} from 'lucide-react';
import { ItemTemplate, ItemCategory } from '../../types';
import { cn } from '../../lib/utils';

interface ItemSelectDropdownProps {
  items: ItemTemplate[];
  selectedItemId: string; // 'ALL' or item.id
  onSelectItem: (itemId: string) => void;
  categories?: ItemCategory[];
  allowAll?: boolean;
  allLabel?: string;
  showCategoryFilter?: boolean;
  showPrevNext?: boolean;
  className?: string;
  placeholder?: string;
  onAddNewItem?: () => void;
}

export const ItemSelectDropdown: React.FC<ItemSelectDropdownProps> = ({
  items,
  selectedItemId,
  onSelectItem,
  categories = [],
  allowAll = false,
  allLabel = 'All BOQ Items',
  showCategoryFilter = true,
  showPrevNext = false,
  className,
  placeholder = 'Select BOQ Item...',
  onAddNewItem
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
  const [specStatusFilter, setSpecStatusFilter] = useState<'ALL' | 'SPEC_READY' | 'NEEDS_SPEC'>('ALL');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Find currently selected item
  const selectedItem = useMemo(() => {
    return items.find(i => i.id === selectedItemId);
  }, [items, selectedItemId]);

  // Robust category matcher helper
  const itemMatchesCategory = (item: ItemTemplate, filterKey: string): boolean => {
    if (filterKey === 'ALL') return true;

    // Check by categoryId direct match
    if (item.categoryId && item.categoryId === filterKey) return true;

    // Look up category in categories list
    const targetCat = categories.find(c => c.id === filterKey || c.name.toLowerCase() === filterKey.toLowerCase());
    const targetName = targetCat ? targetCat.name.toLowerCase() : filterKey.toLowerCase();

    // Check item.category name
    const itemCatName = (item.category || '').toLowerCase();
    if (itemCatName === targetName || itemCatName.includes(targetName) || targetName.includes(itemCatName)) {
      return true;
    }

    // Check item.subCategory name
    const itemSubCatName = (item.subCategory || '').toLowerCase();
    if (itemSubCatName === targetName || itemSubCatName.includes(targetName)) {
      return true;
    }

    // Check item.categoryPath
    if (item.categoryPath && item.categoryPath.some(p => {
      const pLower = p.toLowerCase();
      return pLower === targetName || pLower.includes(targetName) || targetName.includes(pLower);
    })) {
      return true;
    }

    // Check category hierarchy if target is parent of item's category
    if (targetCat) {
      const childCategories = categories.filter(c => c.parentId === targetCat.id);
      if (childCategories.some(child => child.id === item.categoryId || (item.category && item.category.toLowerCase() === child.name.toLowerCase()))) {
        return true;
      }
    }

    return false;
  };

  // Build dynamic, accurate categories list with correct counts
  const availableCategories = useMemo(() => {
    // Collect all categories that either exist in categories array or in items
    const catList: { id: string; name: string; count: number }[] = [];
    const seenNames = new Set<string>();

    // 1. From passed categories (top-level or populated categories)
    if (categories.length > 0) {
      categories.forEach(cat => {
        const count = items.filter(item => itemMatchesCategory(item, cat.id)).length;
        if (count > 0 && !seenNames.has(cat.name.toLowerCase())) {
          seenNames.add(cat.name.toLowerCase());
          catList.push({
            id: cat.id,
            name: cat.name,
            count
          });
        }
      });
    }

    // 2. From actual items if not already captured
    items.forEach(item => {
      if (item.category && !seenNames.has(item.category.toLowerCase())) {
        const count = items.filter(it => (it.category || '').toLowerCase() === item.category.toLowerCase()).length;
        if (count > 0) {
          seenNames.add(item.category.toLowerCase());
          catList.push({
            id: item.category,
            name: item.category,
            count
          });
        }
      }
    });

    return catList;
  }, [categories, items]);

  // Filter items based on category, spec status, and search query
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Category filter
      if (selectedCategoryFilter !== 'ALL') {
        if (!itemMatchesCategory(item, selectedCategoryFilter)) {
          return false;
        }
      }

      // Specification Status filter
      if (specStatusFilter === 'SPEC_READY' && !item.detailedSpecification) {
        return false;
      }
      if (specStatusFilter === 'NEEDS_SPEC' && item.detailedSpecification) {
        return false;
      }

      // Search query (multi-token search)
      if (searchQuery.trim()) {
        const tokens = searchQuery.toLowerCase().trim().split(/\s+/);
        const searchableText = [
          item.name || '',
          item.productCode || '',
          item.code || '',
          item.category || '',
          item.subCategory || '',
          (item.categoryPath || []).join(' '),
          item.description || '',
          item.detailedSpecification || ''
        ].join(' ').toLowerCase();

        const matchesAllTokens = tokens.every(token => searchableText.includes(token));
        if (!matchesAllTokens) return false;
      }

      return true;
    });
  }, [items, selectedCategoryFilter, specStatusFilter, searchQuery, categories]);

  // Count of spec-ready vs needs-spec items
  const specStats = useMemo(() => {
    const ready = items.filter(i => !!i.detailedSpecification).length;
    return {
      ready,
      needs: items.length - ready
    };
  }, [items]);

  // Prev / Next item handlers
  const currentIndex = useMemo(() => {
    return items.findIndex(i => i.id === selectedItemId);
  }, [items, selectedItemId]);

  const handlePrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (items.length === 0) return;
    const prevIndex = currentIndex <= 0 ? items.length - 1 : currentIndex - 1;
    onSelectItem(items[prevIndex].id);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (items.length === 0) return;
    const nextIndex = currentIndex >= items.length - 1 ? 0 : currentIndex + 1;
    onSelectItem(items[nextIndex].id);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategoryFilter('ALL');
    setSpecStatusFilter('ALL');
  };

  return (
    <div className={cn("relative inline-flex items-center gap-1", className)} ref={dropdownRef}>
      {/* Optional Prev button */}
      {showPrevNext && items.length > 1 && (
        <button
          type="button"
          onClick={handlePrevious}
          className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors shadow-2xs shrink-0"
          title="Previous BOQ Item"
        >
          <ChevronLeft size={14} />
        </button>
      )}

      {/* Main Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex-1 min-w-0 flex items-center justify-between gap-2 px-3 py-1.5 bg-white border rounded-lg text-xs font-semibold shadow-2xs transition-all text-left",
          isOpen ? "border-orange-500 ring-2 ring-orange-500/15" : "border-slate-200 hover:border-slate-300 text-slate-800"
        )}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Package size={14} className="text-orange-500 shrink-0" />
          {selectedItemId === 'ALL' ? (
            <span className="font-bold text-slate-900 truncate">
              {allLabel} ({items.length})
            </span>
          ) : selectedItem ? (
            <div className="flex items-center gap-1.5 truncate min-w-0 flex-1">
              {selectedItem.productCode && (
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 shrink-0 font-bold border border-slate-200/60">
                  {selectedItem.productCode}
                </span>
              )}
              <span className="truncate font-semibold text-slate-900 text-xs">
                {selectedItem.name}
              </span>
            </div>
          ) : (
            <span className="text-slate-400 font-normal truncate">{placeholder}</span>
          )}
        </div>

        <ChevronDown 
          size={14} 
          className={cn("text-slate-400 shrink-0 transition-transform duration-200", isOpen && "rotate-180 text-orange-500")} 
        />
      </button>

      {/* Optional Next button */}
      {showPrevNext && items.length > 1 && (
        <button
          type="button"
          onClick={handleNext}
          className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors shadow-2xs shrink-0"
          title="Next BOQ Item"
        >
          <ChevronRight size={14} />
        </button>
      )}

      {/* Dropdown Menu Panel */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 w-[380px] sm:w-[480px] max-w-[94vw] bg-white rounded-xl border border-slate-200 shadow-2xl z-50 overflow-hidden flex flex-col animate-in fade-in-50 zoom-in-95 duration-150">
          {/* Search Header & Actions */}
          <div className="p-3 bg-slate-50/90 border-b border-slate-200/80 space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by code, item name, specification..."
                  className="w-full text-xs pl-8 pr-7 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {onAddNewItem && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onAddNewItem();
                  }}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-semibold shrink-0 shadow-2xs transition-colors"
                  title="Create a new BOQ item template"
                >
                  <Plus size={13} />
                  <span>New</span>
                </button>
              )}
            </div>

            {/* Specification Filter Pills */}
            <div className="flex items-center justify-between gap-2 text-[11px] pt-0.5">
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Spec:</span>
                <div className="flex items-center bg-slate-200/70 p-0.5 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setSpecStatusFilter('ALL')}
                    className={cn(
                      "px-2 py-0.5 rounded-md font-semibold transition-all",
                      specStatusFilter === 'ALL' ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                    )}
                  >
                    All ({items.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSpecStatusFilter('SPEC_READY')}
                    className={cn(
                      "flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold transition-all",
                      specStatusFilter === 'SPEC_READY' ? "bg-emerald-600 text-white shadow-2xs" : "text-emerald-700 hover:bg-emerald-50"
                    )}
                  >
                    <ShieldCheck size={11} /> Spec Ready ({specStats.ready})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSpecStatusFilter('NEEDS_SPEC')}
                    className={cn(
                      "flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold transition-all",
                      specStatusFilter === 'NEEDS_SPEC' ? "bg-amber-500 text-white shadow-2xs" : "text-amber-700 hover:bg-amber-50"
                    )}
                  >
                    <FileText size={11} /> Needs Spec ({specStats.needs})
                  </button>
                </div>
              </div>

              {(searchQuery || selectedCategoryFilter !== 'ALL' || specStatusFilter !== 'ALL') && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-[11px] font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-0.5"
                  title="Reset all filters"
                >
                  <RotateCcw size={10} /> Reset
                </button>
              )}
            </div>

            {/* Category Filter Chips */}
            {showCategoryFilter && availableCategories.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 pt-1 scrollbar-none text-[11px]">
                <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0 flex items-center gap-0.5">
                  <Filter size={10} /> Cat:
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedCategoryFilter('ALL')}
                  className={cn(
                    "px-2 py-0.5 rounded-md font-medium whitespace-nowrap transition-colors",
                    selectedCategoryFilter === 'ALL'
                      ? "bg-orange-500 text-white font-semibold shadow-2xs"
                      : "bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200/80"
                  )}
                >
                  All ({items.length})
                </button>
                {availableCategories.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategoryFilter(cat.id)}
                    className={cn(
                      "px-2 py-0.5 rounded-md font-medium whitespace-nowrap transition-colors",
                      selectedCategoryFilter === cat.id
                        ? "bg-orange-500 text-white font-semibold shadow-2xs"
                        : "bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200/80"
                    )}
                  >
                    {cat.name} ({cat.count})
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Items List */}
          <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-100 p-1.5">
            {/* "All Items" entry if allowAll */}
            {allowAll && selectedCategoryFilter === 'ALL' && !searchQuery && (
              <button
                type="button"
                onClick={() => {
                  onSelectItem('ALL');
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-lg flex items-center justify-between text-xs transition-colors mb-1",
                  selectedItemId === 'ALL'
                    ? "bg-orange-50 text-orange-900 font-bold"
                    : "hover:bg-slate-50 text-slate-800"
                )}
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                    <Package size={13} />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">{allLabel}</div>
                    <div className="text-[11px] text-slate-500 font-normal">
                      Aggregate all {items.length} items across all categories
                    </div>
                  </div>
                </div>
                {selectedItemId === 'ALL' && <Check size={15} className="text-orange-600 shrink-0" />}
              </button>
            )}

            {filteredItems.length === 0 ? (
              <div className="py-8 px-4 text-center text-xs text-slate-500 space-y-2">
                <Package size={24} className="mx-auto text-slate-300" />
                <p className="font-semibold text-slate-700">No BOQ items match your filter criteria.</p>
                <p className="text-[11px] text-slate-400">Try changing keywords, clearing category filters, or add a new item.</p>
                <div className="flex items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="px-2.5 py-1 text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg shadow-2xs"
                  >
                    Clear Filters
                  </button>
                  {onAddNewItem && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        onAddNewItem();
                      }}
                      className="px-2.5 py-1 text-xs font-semibold bg-orange-500 hover:bg-orange-600 text-white rounded-lg shadow-2xs flex items-center gap-1"
                    >
                      <Plus size={12} /> Add New Item
                    </button>
                  )}
                </div>
              </div>
            ) : (
              filteredItems.map(item => {
                const isSelected = item.id === selectedItemId;
                const hasSpec = !!item.detailedSpecification;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onSelectItem(item.id);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between text-xs transition-colors my-0.5",
                      isSelected
                        ? "bg-orange-50/90 border border-orange-200/80 shadow-2xs"
                        : "hover:bg-slate-50 border border-transparent"
                    )}
                  >
                    <div className="flex items-start gap-2.5 min-w-0 pr-2">
                      <div className="mt-0.5">
                        {item.productCode ? (
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200/70">
                            {item.productCode}
                          </span>
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-slate-300 block mt-1.5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className={cn("font-semibold truncate text-xs", isSelected ? "text-orange-950 font-bold" : "text-slate-900")}>
                          {item.name}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                          <span className="truncate max-w-[160px] text-slate-500">
                            {item.categoryPath && item.categoryPath.length > 0 ? item.categoryPath.join(' › ') : item.category}
                          </span>
                          <span>•</span>
                          <span className="font-medium text-slate-700">
                            LKR {item.rate.toLocaleString()} <span className="text-[10px] text-slate-400">/{item.unit}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {hasSpec ? (
                        <span 
                          title="Tender Ready Detailed Specification Available"
                          className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200"
                        >
                          <ShieldCheck size={11} /> Spec Ready
                        </span>
                      ) : (
                        <span 
                          title="Basic summary only - needs technical specification"
                          className="flex items-center gap-0.5 text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/70"
                        >
                          <FileText size={10} /> Needs Spec
                        </span>
                      )}
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-2xs">
                          <Check size={12} />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer stats */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-200/70 flex items-center justify-between text-[11px] text-slate-500 px-3">
            <span>
              Showing <strong className="text-slate-800 font-semibold">{filteredItems.length}</strong> of {items.length} items
            </span>
            {onAddNewItem && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onAddNewItem();
                }}
                className="text-orange-600 hover:text-orange-700 font-bold flex items-center gap-1"
              >
                <Plus size={12} /> Add New Item
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

