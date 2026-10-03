import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  ItemTemplate, 
  ProductFamily, 
  ProductVariant, 
  RateVersion, 
  ItemCategory,
  Project
} from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Minus,
  Search, 
  X, 
  Package, 
  Grid, 
  List, 
  Maximize2, 
  Minimize2, 
  Layers,
  ChevronRight,
  Eye,
  ArrowLeft,
  CheckSquare,
  Square,
  Building2,
  Trash2,
  ListOrdered,
  Check,
  ShoppingBag,
  LayoutDashboard
} from 'lucide-react';
import { cn } from '../lib/utils';
import { ItemDetailModal } from './catalog/ItemDetailModal';

export interface CatalogSelectedItem extends ItemTemplate {
  quantity?: number;
  selectedVariant?: ProductVariant;
}

interface ItemCatalogProps {
  templates: ItemTemplate[];
  onSelectItems: (items: (ItemTemplate & { quantity?: number; selectedVariant?: ProductVariant })[], targetPortal?: string) => void;
  onClose: () => void;
  onDeleteTemplate?: (id: string) => void;
  onUpdateTemplate?: (template: ItemTemplate) => void;
  productFamilies?: ProductFamily[];
  productVariants?: ProductVariant[];
  rateVersions?: RateVersion[];
  onSaveFamily?: (f: ProductFamily) => void;
  onSaveVariant?: (v: ProductVariant) => void;
  onSaveRate?: (r: RateVersion) => void;
  categories?: ItemCategory[];
  onDeleteCategory?: (id: string) => void;
  portalContext?: 'boq' | 'variations' | 'invoice' | 'project' | 'post-evaluation' | 'accounting' | 'general';
  portalTitle?: string;
  initialTab?: 'CATEGORIES' | 'OVERVIEW';
  activeProject?: Project | null;
  projects?: Project[];
  onQuickAdd?: (
    item: ItemTemplate & { quantity?: number; selectedVariant?: ProductVariant },
    targetProjectId?: string
  ) => { success: boolean; targetName: string; isProject: boolean; itemId: string } | void;
}

export const ItemCatalog: React.FC<ItemCatalogProps> = ({ 
  templates = [], 
  onSelectItems, 
  onClose,
  onDeleteTemplate: _onDeleteTemplate,
  onUpdateTemplate: _onUpdateTemplate,
  productFamilies: _productFamilies = [],
  productVariants = [],
  rateVersions: _rateVersions = [],
  onSaveFamily: _onSaveFamily,
  onSaveVariant: _onSaveVariant,
  categories = [],
  onDeleteCategory: _onDeleteCategory,
  portalContext = 'general',
  portalTitle: _portalTitle,
  initialTab,
  activeProject,
  projects = [],
  onQuickAdd
}) => {
  // Navigation & Hierarchy State - Categories Portal & Overview Dashboard
  const [activeTab, setActiveTab] = useState<'CATEGORIES' | 'OVERVIEW'>(initialTab || 'CATEGORIES');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [selectedMainCategoryId, setSelectedMainCategoryId] = useState<string | null>(null);
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'TILES' | 'LIST'>('TILES');
  const [isFullScreen, setIsFullScreen] = useState(true);
  const activePortalContext = portalContext;
  const [selectedTargetProjectId, setSelectedTargetProjectId] = useState<string>(
    activeProject?.id || (projects && projects[0]?.id) || ''
  );
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);

  // Sync active project if prop changes
  useEffect(() => {
    if (activeProject?.id) {
      setSelectedTargetProjectId(activeProject.id);
    } else if (projects && projects.length > 0 && !selectedTargetProjectId) {
      setSelectedTargetProjectId(projects[0].id);
    }
  }, [activeProject?.id, projects]);

  // Multi-Selection & Quantities State
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [selectedVariantIds, setSelectedVariantIds] = useState<Set<string>>(new Set());
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [showReviewDrawer, setShowReviewDrawer] = useState(false);

  // Inspector & Detail Modal State
  const [inspectItem, setInspectItem] = useState<ItemTemplate | null>(null);
  const [inspectVariant, setInspectVariant] = useState<ProductVariant | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Helper to get descendant category IDs
  const getCategoryFamilyIds = useMemo(() => {
    return (catId: string): Set<string> => {
      const result = new Set<string>([catId]);
      const queue = [catId];
      while (queue.length > 0) {
        const current = queue.shift()!;
        categories.forEach(c => {
          if (c.parentId === current && !result.has(c.id)) {
            result.add(c.id);
            queue.push(c.id);
          }
        });
      }
      return result;
    };
  }, [categories]);

  // Main Categories (Top-level categories)
  const mainCategories = useMemo(() => {
    const list = categories.filter(c => !c.parentId || c.parentId === null);
    if (list.length > 0) return list;
    
    // Fallback if categories are flat or unseeded
    const names = Array.from(new Set(templates.map(t => t.category).filter(Boolean)));
    return names.map((name, idx) => ({
      id: `fallback-cat-${idx}`,
      name,
      code: name.substring(0, 4).toUpperCase(),
      level: 1,
      color: idx % 2 === 0 ? '#2563eb' : '#059669',
      tags: ['Standard Works']
    })) as ItemCategory[];
  }, [categories, templates]);

  // Sub-Categories under active main category
  const activeSubCategories = useMemo(() => {
    if (!selectedMainCategoryId) return [];
    return categories.filter(c => c.parentId === selectedMainCategoryId);
  }, [categories, selectedMainCategoryId]);

  // Selected Category Object
  const currentCategory = useMemo(() => {
    if (!selectedMainCategoryId) return null;
    return categories.find(c => c.id === selectedMainCategoryId) || null;
  }, [categories, selectedMainCategoryId]);

  // Selected Sub-Category Object
  const currentSubCategory = useMemo(() => {
    if (!selectedSubCategoryId) return null;
    return categories.find(c => c.id === selectedSubCategoryId) || null;
  }, [categories, selectedSubCategoryId]);

  // Match item to category
  const itemMatchesCategory = (item: ItemTemplate, catId: string): boolean => {
    const cat = categories.find(c => c.id === catId);
    if (!cat) return false;
    const catFamily = getCategoryFamilyIds(catId);
    if (item.categoryId && catFamily.has(item.categoryId)) return true;
    if (item.subCategoryId && catFamily.has(item.subCategoryId)) return true;

    const catNameLower = cat.name.toLowerCase();
    const itemCatLower = (item.category || '').toLowerCase();
    const itemSubCatLower = (item.subCategory || '').toLowerCase();
    if (itemCatLower && (catNameLower.includes(itemCatLower) || itemCatLower.includes(catNameLower))) return true;
    if (itemSubCatLower && (catNameLower.includes(itemSubCatLower) || itemSubCatLower.includes(catNameLower))) return true;

    return false;
  };

  // Match variant to category
  const variantMatchesCategory = (variant: ProductVariant, catId: string): boolean => {
    const cat = categories.find(c => c.id === catId);
    if (!cat) return false;
    const catFamily = getCategoryFamilyIds(catId);
    if (variant.categoryId && catFamily.has(variant.categoryId)) return true;

    if (variant.itemId) {
      const parent = templates.find(i => i.id === variant.itemId);
      if (parent && itemMatchesCategory(parent, catId)) return true;
    }

    const catNameLower = cat.name.toLowerCase();
    const varCatLower = (variant.categoryName || '').toLowerCase();
    if (varCatLower && (catNameLower.includes(varCatLower) || varCatLower.includes(catNameLower))) return true;

    return false;
  };

  // Compute counts for all categories
  const categoryStats = useMemo(() => {
    const stats: Record<string, { subCount: number; itemCount: number; variantCount: number }> = {};
    categories.forEach(cat => {
      const subCats = categories.filter(c => c.parentId === cat.id);
      const items = templates.filter(t => itemMatchesCategory(t, cat.id));
      const variants = productVariants.filter(v => variantMatchesCategory(v, cat.id));
      stats[cat.id] = {
        subCount: subCats.length,
        itemCount: items.length,
        variantCount: variants.length
      };
    });
    return stats;
  }, [categories, templates, productVariants]);

  // Filtered Items
  const filteredItems = useMemo(() => {
    return templates.filter(item => {
      // Category filter
      if (selectedSubCategoryId) {
        if (!itemMatchesCategory(item, selectedSubCategoryId)) return false;
      } else if (selectedMainCategoryId) {
        if (!itemMatchesCategory(item, selectedMainCategoryId)) return false;
      }

      // Search query
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = (item.name || '').toLowerCase().includes(q);
        const matchesCode = (item.productCode || item.code || '').toLowerCase().includes(q);
        const matchesDesc = (item.description || '').toLowerCase().includes(q);
        const matchesCat = (item.category || '').toLowerCase().includes(q);
        const matchesSubCat = (item.subCategory || '').toLowerCase().includes(q);
        const matchesPvc = (item.pvcCode || '').toLowerCase().includes(q);
        const matchesBarcode = (item.barcode || '').toLowerCase().includes(q);
        if (!matchesName && !matchesCode && !matchesDesc && !matchesCat && !matchesSubCat && !matchesPvc && !matchesBarcode) {
          return false;
        }
      }

      return true;
    });
  }, [templates, activeTab, selectedMainCategoryId, selectedSubCategoryId, search]);

  // Filtered Variants
  const filteredVariants = useMemo(() => {
    return productVariants.filter(v => {
      // Category filter
      if (activeTab === 'CATEGORIES') {
        if (selectedSubCategoryId) {
          if (!variantMatchesCategory(v, selectedSubCategoryId)) return false;
        } else if (selectedMainCategoryId) {
          if (!variantMatchesCategory(v, selectedMainCategoryId)) return false;
        }
      }

      // Search query
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = (v.variantName || '').toLowerCase().includes(q);
        const matchesCode = (v.variantCode || '').toLowerCase().includes(q);
        const matchesBarcode = (v.barcode || '').toLowerCase().includes(q);
        const matchesCat = (v.categoryName || '').toLowerCase().includes(q);
        const matchesDesc = (v.customerDescription || v.boqDescription || '').toLowerCase().includes(q);
        const matchesAttr = v.attributes && Object.values(v.attributes).some(val => String(val).toLowerCase().includes(q));
        if (!matchesName && !matchesCode && !matchesBarcode && !matchesCat && !matchesDesc && !matchesAttr) {
          return false;
        }
      }

      return true;
    });
  }, [productVariants, activeTab, selectedMainCategoryId, selectedSubCategoryId, search]);

  // Quantity helpers
  const getItemQuantity = (id: string) => quantities[id] || 1;
  
  const updateQuantity = (id: string, deltaOrValue: number, isAbsolute = false) => {
    setQuantities(prev => {
      const current = prev[id] || 1;
      const next = isAbsolute ? Math.max(1, deltaOrValue) : Math.max(1, current + deltaOrValue);
      return { ...prev, [id]: next };
    });
  };

  // Toggle Item selection
  const toggleItemSelection = (item: ItemTemplate) => {
    setSelectedItemIds(prev => {
      const next = new Set(prev);
      if (next.has(item.id)) {
        next.delete(item.id);
      } else {
        next.add(item.id);
        if (!quantities[item.id]) {
          setQuantities(q => ({ ...q, [item.id]: 1 }));
        }
      }
      return next;
    });
  };

  // Toggle Variant selection
  const toggleVariantSelection = (variant: ProductVariant) => {
    setSelectedVariantIds(prev => {
      const next = new Set(prev);
      if (next.has(variant.id)) {
        next.delete(variant.id);
      } else {
        next.add(variant.id);
        if (!quantities[variant.id]) {
          setQuantities(q => ({ ...q, [variant.id]: 1 }));
        }
      }
      return next;
    });
  };

  // Select all / Deselect all
  const handleSelectAllFiltered = () => {
    const allSelected = filteredItems.every(i => selectedItemIds.has(i.id));
    setSelectedItemIds(prev => {
      const next = new Set(prev);
      if (allSelected) {
        filteredItems.forEach(i => next.delete(i.id));
      } else {
        filteredItems.forEach(i => {
          next.add(i.id);
          if (!quantities[i.id]) setQuantities(q => ({ ...q, [i.id]: 1 }));
        });
      }
      return next;
    });
  };

  // Clear all selections
  const handleClearSelection = () => {
    setSelectedItemIds(new Set());
    setSelectedVariantIds(new Set());
  };

  // Count total selected items & units
  const totalSelectedCount = selectedItemIds.size + selectedVariantIds.size;
  
  const totalSelectedUnits = useMemo(() => {
    let units = 0;
    selectedItemIds.forEach(id => {
      units += quantities[id] || 1;
    });
    selectedVariantIds.forEach(id => {
      units += quantities[id] || 1;
    });
    return units;
  }, [selectedItemIds, selectedVariantIds, quantities]);

  // Estimated monetary value of selected items
  const totalEstimatedValue = useMemo(() => {
    let sum = 0;
    selectedItemIds.forEach(id => {
      const item = templates.find(t => t.id === id);
      if (item) {
        sum += (item.rate || 0) * (quantities[id] || 1);
      }
    });
    selectedVariantIds.forEach(id => {
      const v = productVariants.find(item => item.id === id);
      if (v) {
        const rate = v.pricing?.sellingPrice || 0;
        sum += rate * (quantities[id] || 1);
      }
    });
    return sum;
  }, [selectedItemIds, selectedVariantIds, quantities, templates, productVariants]);

  // Handle final batch insertion
  const handleInsertSelected = () => {
    const results: (ItemTemplate & { quantity?: number; selectedVariant?: ProductVariant })[] = [];

    // Selected items
    selectedItemIds.forEach(id => {
      const item = templates.find(t => t.id === id);
      if (item) {
        const qty = quantities[id] || 1;
        results.push({
          ...item,
          quantity: qty
        });
      }
    });

    // Selected variants synthesized to line items
    selectedVariantIds.forEach(id => {
      const variant = productVariants.find(v => v.id === id);
      if (variant) {
        const parentItem = variant.itemId ? templates.find(t => t.id === variant.itemId) : null;
        const qty = quantities[id] || 1;
        const rate = variant.pricing?.sellingPrice || (parentItem ? parentItem.rate : 3500);
        
        const synthesizedTemplate: ItemTemplate = {
          id: variant.id,
          variantId: variant.id,
          name: variant.variantName,
          productCode: variant.variantCode,
          code: variant.variantCode,
          barcode: variant.barcode,
          category: variant.categoryName || (parentItem ? parentItem.category : 'Aluminium Works'),
          categoryId: variant.categoryId || (parentItem ? parentItem.categoryId : ''),
          productType: 'Product',
          status: 'Active',
          unit: (variant.unit || parentItem?.unit || 'Nos') as any,
          rate,
          description: variant.customerDescription || variant.boqDescription || variant.variantName,
          costAtTimeOfQuote: variant.bom?.totalCost || (rate * 0.72)
        };

        results.push({
          ...synthesizedTemplate,
          quantity: qty,
          selectedVariant: variant
        });
      }
    });

    if (results.length > 0) {
      onSelectItems(results, activePortalContext);
      onClose();
    }
  };

  // Open inspection details for an item
  const handleOpenItemDetails = (item: ItemTemplate) => {
    setInspectItem(item);
    setInspectVariant(null);
    setIsDetailModalOpen(true);
  };

  // Open inspection details for a variant
  const handleOpenVariantDetails = (variant: ProductVariant) => {
    setInspectVariant(variant);
    const parent = variant.itemId ? templates.find(t => t.id === variant.itemId) : null;
    setInspectItem(parent || null);
    setIsDetailModalOpen(true);
  };

  // Determine label for active target BOQ
  const activeTargetName = useMemo(() => {
    if (selectedTargetProjectId && projects) {
      const found = projects.find(p => p.id === selectedTargetProjectId);
      if (found) return found.projectName;
    }
    if (activeProject) return activeProject.projectName;
    if (projects && projects.length > 0) return projects[0].projectName;
    return 'Active BOQ';
  }, [selectedTargetProjectId, activeProject, projects]);

  // Quick Add Item directly to active project's BOQ
  const handleQuickAddItem = (item: ItemTemplate, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const qty = getItemQuantity(item.id);
    const itemWithQty: CatalogSelectedItem = { 
      ...item, 
      quantity: qty 
    };

    if (onQuickAdd) {
      onQuickAdd(itemWithQty, selectedTargetProjectId || activeProject?.id);
    } else {
      onSelectItems([itemWithQty], activePortalContext);
    }

    setRecentlyAddedId(item.id);
    setTimeout(() => {
      setRecentlyAddedId(prev => (prev === item.id ? null : prev));
    }, 1800);
  };

  // Quick Add Variant directly to active project's BOQ
  const handleQuickAddVariant = (variant: ProductVariant, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const parentItem = variant.itemId ? templates.find(t => t.id === variant.itemId) : null;
    const qty = getItemQuantity(variant.id);
    const rate = variant.pricing?.sellingPrice || (parentItem ? parentItem.rate : 3500);

    const synthesizedTemplate: ItemTemplate = {
      id: variant.id,
      variantId: variant.id,
      name: variant.variantName,
      productCode: variant.variantCode,
      code: variant.variantCode,
      barcode: variant.barcode,
      category: variant.categoryName || (parentItem ? parentItem.category : 'Aluminium Works'),
      categoryId: variant.categoryId || (parentItem ? parentItem.categoryId : ''),
      productType: 'Product',
      status: 'Active',
      unit: (variant.unit || parentItem?.unit || 'Nos') as any,
      rate,
      description: variant.customerDescription || variant.boqDescription || variant.variantName,
      costAtTimeOfQuote: variant.bom?.totalCost || (rate * 0.72)
    };

    const itemWithQty: CatalogSelectedItem = {
      ...synthesizedTemplate,
      quantity: qty,
      selectedVariant: variant
    };

    if (onQuickAdd) {
      onQuickAdd(itemWithQty, selectedTargetProjectId || activeProject?.id);
    } else {
      onSelectItems([itemWithQty], activePortalContext);
    }

    setRecentlyAddedId(variant.id);
    setTimeout(() => {
      setRecentlyAddedId(prev => (prev === variant.id ? null : prev));
    }, 1800);
  };

  // Dynamic portal context label
  const contextBadge = useMemo(() => {
    switch (activePortalContext) {
      case 'boq':
        return { label: 'Active BOQ / Quote', color: 'bg-orange-50 text-orange-700 border-orange-200' };
      case 'variations':
        return { label: 'Project Scope & Variations', color: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'invoice':
        return { label: 'Invoice & Progress Billing', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'post-evaluation':
        return { label: 'Post-Evaluation Cost Baselines', color: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'accounting':
        return { label: 'Accounting & Financial Ledger', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'project':
        return { label: 'Project Engineering Schedule', color: 'bg-amber-50 text-amber-700 border-amber-200' };
      default:
        return { label: 'Universal Catalog & Spec Library', color: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  }, [activePortalContext]);

  // Prevent background scroll when catalog is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const catalogContent = (
    <>
      {!isFullScreen && (
        <div 
          className="fixed inset-0 z-[998] bg-slate-900/60 backdrop-blur-xs transition-opacity"
          onClick={onClose}
        />
      )}
      <div className={cn(
        "z-[999] bg-white flex flex-col overflow-hidden transition-all duration-150",
        isFullScreen 
          ? "fixed inset-0 w-screen h-screen" 
          : "fixed inset-2 sm:inset-4 md:inset-6 rounded-2xl shadow-2xl border border-slate-200"
      )}>
        <div className="w-full h-full bg-white flex flex-col overflow-hidden">
          {/* 1. Brand Top Bar - Single Line Ribbon */}
          <header className="px-5 py-2.5 sm:px-6 bg-white border-b border-slate-200/80 flex items-center justify-between gap-3 shrink-0">
            {/* Left: Brand Logo & Title */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-white shrink-0 shadow-2xs">
                <ShoppingBag size={16} />
              </div>
              <div className="flex items-baseline gap-2 min-w-0">
                <h1 className="text-sm font-bold text-slate-900 whitespace-nowrap">Master Item Catalog</h1>
                <span className="text-xs text-slate-500 font-normal truncate hidden sm:inline">
                  • Extrusions, glazing & accessories library ({templates.length} items)
                </span>
              </div>
            </div>

            {/* Right: Buttons ONLY */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const newItem: ItemTemplate = {
                    id: `item-${Date.now()}`,
                    name: '',
                    code: `ITM-${Math.floor(1000 + Math.random() * 9000)}`,
                    productCode: `ITM-${Math.floor(1000 + Math.random() * 9000)}`,
                    category: 'Aluminium Works',
                    productType: 'Product',
                    status: 'Active',
                    unit: 'Nos',
                    rate: 0,
                    description: '',
                    costAtTimeOfQuote: 0
                  };
                  setInspectItem(newItem);
                  setInspectVariant(null);
                  setIsDetailModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs px-3.5 py-1.5 rounded-lg shadow-2xs transition-all"
              >
                <Plus size={13} strokeWidth={2.5} />
                <span>Add Item</span>
              </button>

              {/* Fullscreen & Close */}
              <button
                type="button"
                onClick={() => setIsFullScreen(!isFullScreen)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                title={isFullScreen ? "Exit Fullscreen" : "Fit Full Screen"}
              >
                {isFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>
          </header>

          {/* Unified Compact Catalog Toolbar */}
          <div className="px-5 py-2 sm:px-6 bg-slate-50/90 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
            {/* Left: Tab selection & Target project */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-200/70 p-1 rounded-xl gap-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('CATEGORIES')}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer",
                    activeTab !== 'OVERVIEW'
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  <Building2 size={13} className={activeTab !== 'OVERVIEW' ? "text-orange-500" : "text-slate-400"} />
                  <span>Categories & Items</span>
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-full font-mono font-semibold",
                    activeTab !== 'OVERVIEW' ? "bg-orange-50 text-orange-600" : "bg-slate-300/60 text-slate-600"
                  )}>
                    {mainCategories.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('OVERVIEW')}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer",
                    activeTab === 'OVERVIEW'
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  <LayoutDashboard size={13} className={activeTab === 'OVERVIEW' ? "text-orange-500" : "text-slate-400"} />
                  <span>Catalog Analytics</span>
                </button>
              </div>

              {/* Target Project Dropdown */}
              <div className="hidden sm:flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1 shadow-2xs">
                <span className="text-[11px] text-slate-400 font-medium">Project:</span>
                <select
                  value={selectedTargetProjectId || activeProject?.id || projects[0]?.id || ''}
                  onChange={(e) => setSelectedTargetProjectId(e.target.value)}
                  className="text-xs font-semibold bg-transparent text-slate-800 cursor-pointer outline-none max-w-[150px] truncate"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.projectName}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Right: Search, View Mode, Select Page */}
            <div className="flex items-center gap-2">
              <div className="relative w-48 sm:w-60">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter items, specs..."
                  className="w-full pl-8 pr-7 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium placeholder:text-slate-400 focus:outline-hidden focus:border-orange-500 transition-all shadow-2xs"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X size={12} />
                  </button>
                )}
              </div>

              {activeTab !== 'OVERVIEW' && (
                <>
                  <div className="flex items-center bg-white p-0.5 rounded-xl border border-slate-200 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setViewMode('TILES')}
                      className={cn(
                        "p-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer",
                        viewMode === 'TILES' ? "bg-slate-100 text-slate-900 font-bold" : "text-slate-500 hover:text-slate-800"
                      )}
                      title="Tiles View"
                    >
                      <Grid size={13} />
                      <span className="text-[11px] hidden md:inline">Tiles</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('LIST')}
                      className={cn(
                        "p-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer",
                        viewMode === 'LIST' ? "bg-slate-100 text-slate-900 font-bold" : "text-slate-500 hover:text-slate-800"
                      )}
                      title="List View"
                    >
                      <List size={13} />
                      <span className="text-[11px] hidden md:inline">List</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleSelectAllFiltered}
                    className="px-2.5 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
                  >
                    <CheckSquare size={13} className="text-slate-500" />
                    <span className="hidden sm:inline">Select</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Breadcrumb Navigation Trail */}
          {activeTab === 'CATEGORIES' && (
            <div className="px-6 py-2.5 bg-slate-50/50 border-b border-slate-100 flex items-center gap-2 text-xs overflow-x-auto no-scrollbar shrink-0">
              <button
                onClick={() => {
                  setSelectedMainCategoryId(null);
                  setSelectedSubCategoryId(null);
                }}
                className={cn(
                  "font-bold transition-colors flex items-center gap-1 shrink-0",
                  !selectedMainCategoryId ? "text-indigo-600" : "text-slate-500 hover:text-slate-800"
                )}
              >
                <span>Catalog Home</span>
              </button>

              {currentCategory && (
                <>
                  <ChevronRight size={13} className="text-slate-400 shrink-0" />
                  <button
                    onClick={() => setSelectedSubCategoryId(null)}
                    className={cn(
                      "font-bold transition-colors flex items-center gap-1 shrink-0",
                      !selectedSubCategoryId ? "text-indigo-600" : "text-slate-500 hover:text-slate-800"
                    )}
                  >
                    <span>{currentCategory.name}</span>
                  </button>
                </>
              )}

              {currentSubCategory && (
                <>
                  <ChevronRight size={13} className="text-slate-400 shrink-0" />
                  <span className="font-bold text-indigo-600 shrink-0">
                    {currentSubCategory.name}
                  </span>
                </>
              )}
            </div>
          )}

          {/* Main Body Viewport */}
          <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3">
            {/* VIEW 0: DREAMS POS DASHBOARD & OVERVIEW */}
            {activeTab === 'OVERVIEW' && (
              <div className="space-y-3">
                {/* 1. Live Operations Greeting Banner matching screenshot */}
                <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="inline-flex items-center gap-1.5 bg-orange-50 border border-orange-200 text-orange-700 font-bold text-[11px] px-2.5 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping" />
                        Live Operations
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        Monday, 15 October 2026
                      </span>
                    </div>
                    <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                      Welcome Back, Rose Jenny
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
                      Track tasks efficiently and collaborate with your team across active architectural sites. Browse master specifications and quick-add directly to project BOQs.
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setActiveTab('CATEGORIES')}
                      className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus size={14} className="text-orange-500" />
                      <span>+ Add Project</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('CATEGORIES')}
                      className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-xs shadow-orange-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Create Quote</span>
                    </button>
                  </div>
                </div>

                {/* 2. 5 Dreams POS KPI Summary Cards matching screenshot */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                  {/* Card 1: Total Task */}
                  <div 
                    onClick={() => setActiveTab('CATEGORIES')}
                    className="bg-white rounded-2xl border border-slate-200/90 p-4.5 shadow-2xs hover:border-orange-300 hover:shadow-xs transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-slate-500 font-medium">Total Task</span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-full">
                        +3.2%
                      </span>
                    </div>
                    <div className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
                      {templates.length || 48}
                    </div>
                    <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between group-hover:text-orange-600 transition-colors">
                      <span>+12 new tasks today</span>
                      <ChevronRight size={13} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>

                  {/* Card 2: Task In Progress */}
                  <div 
                    onClick={() => setActiveTab('CATEGORIES')}
                    className="bg-white rounded-2xl border border-slate-200/90 p-4.5 shadow-2xs hover:border-orange-300 hover:shadow-xs transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-slate-500 font-medium">Task In Progress</span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-full">
                        +1.5%
                      </span>
                    </div>
                    <div className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
                      {mainCategories.length || 14}
                    </div>
                    <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between group-hover:text-orange-600 transition-colors">
                      <span>+5 tasks in execution</span>
                      <ChevronRight size={13} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>

                  {/* Card 3: Task Completed */}
                  <div 
                    onClick={() => setActiveTab('CATEGORIES')}
                    className="bg-white rounded-2xl border border-slate-200/90 p-4.5 shadow-2xs hover:border-orange-300 hover:shadow-xs transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-slate-500 font-medium">Task Completed</span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-full">
                        +2.2%
                      </span>
                    </div>
                    <div className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
                      {productVariants.length || 36}
                    </div>
                    <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between group-hover:text-orange-600 transition-colors">
                      <span>+4 tasks completed</span>
                      <ChevronRight size={13} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>

                  {/* Card 4: Task Pending */}
                  <div 
                    onClick={() => setActiveTab('CATEGORIES')}
                    className="bg-white rounded-2xl border border-slate-200/90 p-4.5 shadow-2xs hover:border-orange-300 hover:shadow-xs transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-slate-500 font-medium">Task Pending</span>
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-full">
                        +2.1%
                      </span>
                    </div>
                    <div className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
                      {projects.length < 10 ? `0${projects.length || 6}` : projects.length}
                    </div>
                    <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between group-hover:text-orange-600 transition-colors">
                      <span>+2 pending review</span>
                      <ChevronRight size={13} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>

                  {/* Card 5: Site Meetings */}
                  <div 
                    onClick={() => setActiveTab('CATEGORIES')}
                    className="bg-white rounded-2xl border border-slate-200/90 p-4.5 shadow-2xs hover:border-orange-300 hover:shadow-xs transition-all cursor-pointer group col-span-2 sm:col-span-1"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-slate-500 font-medium">Site Meetings</span>
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-full">
                        +2.1%
                      </span>
                    </div>
                    <div className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
                      02
                    </div>
                    <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between group-hover:text-orange-600 transition-colors">
                      <span>+2 new meetings</span>
                      <ChevronRight size={13} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>

                {/* 3. The 2 Analytical Performance Charts matching screenshot */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* Left 7 cols: Task Performance Chart */}
                  <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
                          Task Performance
                        </h3>
                        <p className="text-[11px] text-slate-400">
                          Specification progress, quotations, and execution rates
                        </p>
                      </div>

                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-[11px] font-medium text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
                          01 Jan - 31 Dec 2026
                        </span>
                        <div className="flex items-center gap-2 text-[11px]">
                          <span className="flex items-center gap-1 font-medium text-slate-600">
                            <span className="w-2 h-2 rounded-full bg-sky-500" /> Complete
                          </span>
                          <span className="flex items-center gap-1 font-medium text-slate-600">
                            <span className="w-2 h-2 rounded-full bg-orange-500" /> New Task
                          </span>
                          <span className="flex items-center gap-1 font-medium text-slate-600">
                            <span className="w-2 h-2 rounded-full bg-rose-500" /> Overdue
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* SVG Multi-curve Area Chart */}
                    <div className="w-full h-56 pt-2">
                      <svg className="w-full h-full" viewBox="0 0 700 200" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.0" />
                          </linearGradient>
                          <linearGradient id="orangeGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f97316" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#f97316" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>

                        {/* Horizontal Grid Lines */}
                        <line x1="40" y1="20" x2="680" y2="20" stroke="#f1f5f9" strokeWidth="1" />
                        <line x1="40" y1="60" x2="680" y2="60" stroke="#f1f5f9" strokeWidth="1" />
                        <line x1="40" y1="100" x2="680" y2="100" stroke="#f1f5f9" strokeWidth="1" />
                        <line x1="40" y1="140" x2="680" y2="140" stroke="#f1f5f9" strokeWidth="1" />
                        <line x1="40" y1="180" x2="680" y2="180" stroke="#e2e8f0" strokeWidth="1" />

                        {/* Y Axis Labels */}
                        <text x="25" y="24" fontSize="10" fill="#94a3b8" textAnchor="end">60</text>
                        <text x="25" y="64" fontSize="10" fill="#94a3b8" textAnchor="end">45</text>
                        <text x="25" y="104" fontSize="10" fill="#94a3b8" textAnchor="end">30</text>
                        <text x="25" y="144" fontSize="10" fill="#94a3b8" textAnchor="end">15</text>
                        <text x="25" y="184" fontSize="10" fill="#94a3b8" textAnchor="end">0</text>

                        {/* Blue Filled Area (Complete) */}
                        <path
                          d="M 40 160 C 100 130, 150 90, 210 110 C 270 130, 320 60, 380 70 C 440 80, 500 40, 560 50 C 620 60, 650 30, 680 40 L 680 180 L 40 180 Z"
                          fill="url(#skyGrad)"
                        />
                        <path
                          d="M 40 160 C 100 130, 150 90, 210 110 C 270 130, 320 60, 380 70 C 440 80, 500 40, 560 50 C 620 60, 650 30, 680 40"
                          fill="none"
                          stroke="#0ea5e9"
                          strokeWidth="2.5"
                        />

                        {/* Orange Area (New Task) */}
                        <path
                          d="M 40 170 C 100 160, 150 140, 210 135 C 270 130, 320 110, 380 95 C 440 80, 500 110, 560 85 C 620 60, 650 90, 680 75 L 680 180 L 40 180 Z"
                          fill="url(#orangeGrad)"
                        />
                        <path
                          d="M 40 170 C 100 160, 150 140, 210 135 C 270 130, 320 110, 380 95 C 440 80, 500 110, 560 85 C 620 60, 650 90, 680 75"
                          fill="none"
                          stroke="#f97316"
                          strokeWidth="2.5"
                        />

                        {/* Rose Line (Overdue) */}
                        <path
                          d="M 40 175 C 100 170, 160 165, 220 160 C 280 155, 340 150, 400 140 C 460 130, 520 145, 580 130 C 630 115, 660 135, 680 120"
                          fill="none"
                          stroke="#f43f5e"
                          strokeWidth="2"
                          strokeDasharray="4 3"
                        />
                      </svg>
                    </div>

                    {/* X Axis Months */}
                    <div className="flex justify-between pl-10 pr-2 text-[10px] text-slate-400 font-medium pt-2 border-t border-slate-100">
                      <span>Jan</span>
                      <span>Feb</span>
                      <span>Mar</span>
                      <span>Apr</span>
                      <span>May</span>
                      <span>Jun</span>
                      <span>Jul</span>
                      <span>Aug</span>
                      <span>Sep</span>
                      <span>Oct</span>
                      <span>Nov</span>
                      <span>Dec</span>
                    </div>
                  </div>

                  {/* Right 5 cols: Task Distribution Donut Chart */}
                  <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
                          Task Distribution
                        </h3>
                        <span className="text-xs text-slate-400 font-mono">2026</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Monitor task and catalog distribution by priority
                      </p>
                    </div>

                    {/* Donut Chart SVG matching screenshot */}
                    <div className="relative flex items-center justify-center my-3">
                      <svg width="170" height="170" viewBox="0 0 100 100" className="transform -rotate-90">
                        {/* Orange Segment (50%) */}
                        <circle
                          cx="50"
                          cy="50"
                          r="38"
                          fill="none"
                          stroke="#f97316"
                          strokeWidth="14"
                          strokeDasharray="119.38 238.76"
                          strokeDashoffset="0"
                        />
                        {/* Teal Segment (30%) */}
                        <circle
                          cx="50"
                          cy="50"
                          r="38"
                          fill="none"
                          stroke="#14b8a6"
                          strokeWidth="14"
                          strokeDasharray="71.63 238.76"
                          strokeDashoffset="-119.38"
                        />
                        {/* Sky Segment (20%) */}
                        <circle
                          cx="50"
                          cy="50"
                          r="38"
                          fill="none"
                          stroke="#0284c7"
                          strokeWidth="14"
                          strokeDasharray="47.75 238.76"
                          strokeDashoffset="-191.01"
                        />
                      </svg>

                      {/* Center Text inside Donut */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                        <span className="text-[11px] text-slate-400 font-medium">Total</span>
                        <span className="text-xl font-extrabold text-slate-900 font-mono leading-none">200</span>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Task</span>
                      </div>
                    </div>

                    {/* Priority Legend */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                          <span className="text-slate-700 font-medium">High Priority</span>
                        </div>
                        <span className="font-bold text-slate-900 font-mono">15 Task <span className="text-slate-400 font-normal">(50%)</span></span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                          <span className="text-slate-700 font-medium">Medium Priority</span>
                        </div>
                        <span className="font-bold text-slate-900 font-mono">9 Task <span className="text-slate-400 font-normal">(30%)</span></span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-sky-600" />
                          <span className="text-slate-700 font-medium">Low Priority</span>
                        </div>
                        <span className="font-bold text-slate-900 font-mono">6 Task <span className="text-slate-400 font-normal">(20%)</span></span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Frequently Specified Systems & Quick Add Section */}
                <div className="space-y-3.5 pt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
                        Top Architectural Specifications & Quick Add
                      </h3>
                      <p className="text-xs text-slate-500">
                        1-click insert directly into active project BOQ ({projects.find(p => p.id === selectedTargetProjectId)?.projectName || 'Active Project'})
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab('CATEGORIES')}
                      className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
                    >
                      <span>View All Categories & Items ({templates.length})</span>
                      <ChevronRight size={13} />
                    </button>
                  </div>

                  {/* Tiles of top 6 items */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {templates.slice(0, 6).map((item) => {
                      const qty = quantities[item.id] || 1;
                      const isAdded = recentlyAddedId === item.id;
                      return (
                        <div
                          key={item.id}
                          className="bg-white rounded-2xl border border-slate-200/90 hover:border-orange-300 hover:shadow-md transition-all p-4 flex flex-col justify-between shadow-2xs group"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-100 px-2 py-0.5 rounded-full">
                                {item.category || 'General'}
                              </span>
                              <span className="text-[10px] font-mono font-bold text-slate-400">
                                {item.productCode || item.code || (item as any).itemCode}
                              </span>
                            </div>
                            <h4 className="text-xs font-bold text-slate-900 group-hover:text-orange-600 transition-colors line-clamp-1">
                              {item.name}
                            </h4>
                            <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                              {item.description || 'Master engineered specification assembly.'}
                            </p>
                          </div>

                          <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                            <div>
                              <span className="text-[10px] text-slate-400 block leading-none">Rate</span>
                              <span className="text-xs font-extrabold text-slate-900 font-mono">
                                LKR {(item.rate || (item as any).unitPrice || 0).toLocaleString()}
                              </span>
                              <span className="text-[10px] text-slate-400"> / {item.unit || 'nos'}</span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setInspectItem(item);
                                  setInspectVariant(null);
                                  setIsDetailModalOpen(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                title="Inspect"
                              >
                                <Eye size={14} />
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onQuickAdd) {
                                    onQuickAdd({ ...item, quantity: qty }, selectedTargetProjectId);
                                    setRecentlyAddedId(item.id);
                                    setTimeout(() => setRecentlyAddedId(null), 1800);
                                  }
                                }}
                                className={cn(
                                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs",
                                  isAdded
                                    ? "bg-emerald-600 text-white"
                                    : "bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/20 active:scale-95"
                                )}
                              >
                                {isAdded ? (
                                  <>
                                    <Check size={13} strokeWidth={3} />
                                    <span>Added!</span>
                                  </>
                                ) : (
                                  <>
                                    <Plus size={13} strokeWidth={2.5} />
                                    <span>Quick Add</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 1: CATEGORIES HIERARCHICAL DRILLDOWN */}
            {activeTab === 'CATEGORIES' && !selectedMainCategoryId && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                      Master Product Categories
                    </h3>
                    <p className="text-xs text-slate-500">
                      Select a category tile to explore sub-categories, items, and engineered variants.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-slate-400 font-mono">
                    {mainCategories.length} Categories
                  </span>
                </div>

                {viewMode === 'TILES' ? (
                  /* Category Tiles Grid */
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {mainCategories.map(cat => {
                      const stats = categoryStats[cat.id] || { subCount: 0, itemCount: 0, variantCount: 0 };
                      const subCategories = categories.filter(c => c.parentId === cat.id);

                      return (
                        <div
                          key={cat.id}
                          onClick={() => setSelectedMainCategoryId(cat.id)}
                          className="group p-5 bg-white rounded-2xl border border-slate-200/90 hover:border-indigo-400 hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between shadow-2xs"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <div 
                                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-xs"
                                style={{ backgroundColor: cat.color || '#4f46e5' }}
                              >
                                <Building2 size={20} />
                              </div>
                              <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                                {cat.code || 'CAT'}
                              </span>
                            </div>

                            <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                              {cat.name}
                            </h4>
                            <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                              {cat.description || `Specialized engineered systems and architectural assemblies for ${cat.name}.`}
                            </p>

                            {/* Subcategory Preview Badges */}
                            {subCategories.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-3">
                                {subCategories.slice(0, 3).map(sub => (
                                  <span key={sub.id} className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                                    {sub.name}
                                  </span>
                                ))}
                                {subCategories.length > 3 && (
                                  <span className="text-[9px] bg-slate-100 text-slate-400 px-1 py-0.5 rounded">
                                    +{subCategories.length - 3}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-slate-700">
                                {stats.subCount} Subs
                              </span>
                              <span>•</span>
                              <span className="font-bold text-slate-700">
                                {stats.itemCount} Items
                              </span>
                              <span>•</span>
                              <span className="font-bold text-indigo-600">
                                {stats.variantCount} Variants
                              </span>
                            </div>
                            <ChevronRight size={16} className="text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* Category List Table */
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200">
                        <tr>
                          <th className="px-5 py-3">Category Name</th>
                          <th className="px-4 py-3">Code</th>
                          <th className="px-4 py-3 text-center">Sub-Categories</th>
                          <th className="px-4 py-3 text-center">Items</th>
                          <th className="px-4 py-3 text-center">Variants</th>
                          <th className="px-4 py-3">Tags</th>
                          <th className="px-5 py-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {mainCategories.map(cat => {
                          const stats = categoryStats[cat.id] || { subCount: 0, itemCount: 0, variantCount: 0 };
                          return (
                            <tr 
                              key={cat.id} 
                              onClick={() => setSelectedMainCategoryId(cat.id)}
                              className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                            >
                              <td className="px-5 py-3.5">
                                <div className="flex items-center gap-3">
                                  <div 
                                    className="w-3.5 h-3.5 rounded-full shrink-0"
                                    style={{ backgroundColor: cat.color || '#4f46e5' }}
                                  />
                                  <div>
                                    <span className="font-bold text-slate-900 block">{cat.name}</span>
                                    <span className="text-[11px] text-slate-400">{cat.description || 'Standard Category'}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3.5 font-mono text-slate-600 font-bold">{cat.code || '-'}</td>
                              <td className="px-4 py-3.5 text-center font-bold font-mono text-slate-700">{stats.subCount}</td>
                              <td className="px-4 py-3.5 text-center font-bold font-mono text-slate-700">{stats.itemCount}</td>
                              <td className="px-4 py-3.5 text-center font-bold font-mono text-indigo-600">{stats.variantCount}</td>
                              <td className="px-4 py-3.5">
                                <div className="flex flex-wrap gap-1">
                                  {(cat.tags || []).map((t, idx) => (
                                    <span key={idx} className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                                      {t}
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td className="px-5 py-3.5 text-right">
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800">
                                  Explore <ChevronRight size={13} />
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* VIEW 2: SUB-CATEGORIES & ITEMS UNDER SELECTED CATEGORY */}
            {activeTab === 'CATEGORIES' && selectedMainCategoryId && (
              <div className="space-y-6">
                {/* Back button and Category Header */}
                <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-200/90">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        if (selectedSubCategoryId) {
                          setSelectedSubCategoryId(null);
                        } else {
                          setSelectedMainCategoryId(null);
                        }
                      }}
                      className="p-2 bg-white rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors shadow-2xs"
                      title="Back to parent level"
                    >
                      <ArrowLeft size={16} />
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          {selectedSubCategoryId ? 'Sub-Category Focus' : 'Category Focus'}
                        </span>
                        <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                          {currentCategory?.name}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 mt-0.5">
                        {selectedSubCategoryId ? currentSubCategory?.name : currentCategory?.name}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 font-mono">
                      {filteredItems.length} Items Available
                    </span>
                  </div>
                </div>

                {/* Sub-Category Tiles (if at category level without specific subcategory chosen) */}
                {!selectedSubCategoryId && activeSubCategories.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers size={14} className="text-indigo-600" /> Sub-Categories ({activeSubCategories.length})
                    </h4>

                    {viewMode === 'TILES' ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {activeSubCategories.map(sub => {
                          const stats = categoryStats[sub.id] || { subCount: 0, itemCount: 0, variantCount: 0 };
                          return (
                            <div
                              key={sub.id}
                              onClick={() => setSelectedSubCategoryId(sub.id)}
                              className="p-4 bg-white rounded-xl border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer shadow-2xs group"
                            >
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[10px] font-mono text-slate-400 font-bold">{sub.code || 'SUB'}</span>
                                <ChevronRight size={14} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
                              </div>
                              <h5 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                {sub.name}
                              </h5>
                              <div className="mt-2 text-[10px] text-slate-500 flex items-center gap-2">
                                <span className="font-bold text-slate-700">{stats.itemCount} Items</span>
                                <span>•</span>
                                <span className="font-bold text-indigo-600">{stats.variantCount} Variants</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200">
                            <tr>
                              <th className="px-4 py-2.5">Sub-Category</th>
                              <th className="px-4 py-2.5">Code</th>
                              <th className="px-4 py-2.5 text-center">Items</th>
                              <th className="px-4 py-2.5 text-center">Variants</th>
                              <th className="px-4 py-2.5 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {activeSubCategories.map(sub => {
                              const stats = categoryStats[sub.id] || { subCount: 0, itemCount: 0, variantCount: 0 };
                              return (
                                <tr 
                                  key={sub.id}
                                  onClick={() => setSelectedSubCategoryId(sub.id)}
                                  className="hover:bg-slate-50 cursor-pointer"
                                >
                                  <td className="px-4 py-2.5 font-bold text-slate-900">{sub.name}</td>
                                  <td className="px-4 py-2.5 font-mono text-slate-500">{sub.code || '-'}</td>
                                  <td className="px-4 py-2.5 text-center font-mono font-bold text-slate-700">{stats.itemCount}</td>
                                  <td className="px-4 py-2.5 text-center font-mono font-bold text-indigo-600">{stats.variantCount}</td>
                                  <td className="px-4 py-2.5 text-right text-indigo-600 font-bold">Filter</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* Items in this Category / Sub-Category */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Package size={14} className="text-blue-600" /> Products & BOQ Items ({filteredItems.length})
                    </h4>
                    {selectedSubCategoryId && (
                      <button
                        onClick={() => setSelectedSubCategoryId(null)}
                        className="text-xs font-bold text-indigo-600 hover:underline"
                      >
                        Show all {currentCategory?.name} items
                      </button>
                    )}
                  </div>

                  {/* Render Items */}
                  {renderItemsGridOrList(filteredItems)}

                  {/* Render Engineered Variants in this Category if any */}
                  {filteredVariants.length > 0 && (
                    <div className="pt-4 border-t border-slate-200 mt-6 space-y-3">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Layers size={14} className="text-indigo-600" /> Engineered Variants ({filteredVariants.length})
                      </h4>
                      {renderVariantsGridOrList(filteredVariants)}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* AnimatePresence Review Selection Drawer */}
          <AnimatePresence>
            {showReviewDrawer && totalSelectedCount > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t border-indigo-100 bg-indigo-50/40 p-4 max-h-72 overflow-y-auto shrink-0 transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <ListOrdered size={16} className="text-indigo-600" />
                    <h4 className="text-xs font-bold text-slate-800">
                      Review Items for Multi-Insert ({totalSelectedCount} items • {totalSelectedUnits} units)
                    </h4>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleClearSelection}
                      className="text-[11px] font-bold text-rose-600 hover:underline flex items-center gap-1"
                    >
                      <Trash2 size={12} /> Clear All
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowReviewDrawer(false)}
                      className="text-[11px] font-bold text-slate-500 hover:text-slate-800"
                    >
                      Close Review
                    </button>
                  </div>
                </div>

                <div className="divide-y divide-slate-200/70 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                  {/* Selected Items */}
                  {Array.from(selectedItemIds).map(id => {
                    const item = templates.find(t => t.id === id);
                    if (!item) return null;
                    const qty = getItemQuantity(id);
                    const rate = item.rate || 0;
                    return (
                      <div key={id} className="p-3 flex items-center justify-between gap-3 text-xs hover:bg-slate-50/60 transition-colors">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-[10px] font-mono font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded shrink-0">Item</span>
                          <div className="truncate">
                            <p className="font-bold text-slate-900 truncate">{item.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              {item.productCode || item.code || 'ITEM'} • LKR {rate.toLocaleString()} / {item.unit || 'Nos'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg p-0.5">
                            <button 
                              type="button" 
                              onClick={() => updateQuantity(id, -1)} 
                              className="w-6 h-6 rounded flex items-center justify-center hover:bg-white text-slate-600 transition-colors"
                            >
                              <Minus size={11} />
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={qty}
                              onChange={(e) => updateQuantity(id, parseInt(e.target.value) || 1, true)}
                              className="w-10 text-center font-bold font-mono text-xs bg-transparent border-none outline-none"
                            />
                            <button 
                              type="button" 
                              onClick={() => updateQuantity(id, 1)} 
                              className="w-6 h-6 rounded flex items-center justify-center hover:bg-white text-slate-600 transition-colors"
                            >
                              <Plus size={11} />
                            </button>
                          </div>
                          <span className="font-mono font-bold text-slate-900 w-28 text-right">
                            LKR {(rate * qty).toLocaleString()}
                          </span>
                          <button 
                            type="button" 
                            onClick={() => toggleItemSelection(item)} 
                            className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                            title="Remove"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Selected Variants */}
                  {Array.from(selectedVariantIds).map(id => {
                    const variant = productVariants.find(v => v.id === id);
                    if (!variant) return null;
                    const qty = getItemQuantity(id);
                    const rate = variant.pricing?.sellingPrice || 3500;
                    return (
                      <div key={id} className="p-3 flex items-center justify-between gap-3 text-xs hover:bg-slate-50/60 transition-colors">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-[10px] font-mono font-bold bg-purple-50 text-purple-700 px-2 py-0.5 rounded shrink-0">Variant</span>
                          <div className="truncate">
                            <p className="font-bold text-slate-900 truncate">{variant.variantName}</p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              {variant.variantCode} • LKR {rate.toLocaleString()} / {variant.unit || 'Nos'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg p-0.5">
                            <button 
                              type="button" 
                              onClick={() => updateQuantity(id, -1)} 
                              className="w-6 h-6 rounded flex items-center justify-center hover:bg-white text-slate-600 transition-colors"
                            >
                              <Minus size={11} />
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={qty}
                              onChange={(e) => updateQuantity(id, parseInt(e.target.value) || 1, true)}
                              className="w-10 text-center font-bold font-mono text-xs bg-transparent border-none outline-none"
                            />
                            <button 
                              type="button" 
                              onClick={() => updateQuantity(id, 1)} 
                              className="w-6 h-6 rounded flex items-center justify-center hover:bg-white text-slate-600 transition-colors"
                            >
                              <Plus size={11} />
                            </button>
                          </div>
                          <span className="font-mono font-bold text-slate-900 w-28 text-right">
                            LKR {(rate * qty).toLocaleString()}
                          </span>
                          <button 
                            type="button" 
                            onClick={() => toggleVariantSelection(variant)} 
                            className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                            title="Remove"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sticky Bottom Multi-Select Action Drawer */}
          <div className="px-5 py-3.5 sm:px-6 sm:py-4 border-t border-slate-200 bg-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-700 font-mono font-bold text-xs flex items-center justify-center">
                  {totalSelectedCount}
                </span>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    {totalSelectedCount} item{totalSelectedCount !== 1 ? 's' : ''} selected ({totalSelectedUnits} units)
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Estimated Line Total: LKR {totalEstimatedValue.toLocaleString()}
                  </span>
                </div>
              </div>

              {totalSelectedCount > 0 && (
                <div className="flex items-center gap-2 ml-2">
                  <button
                    type="button"
                    onClick={() => setShowReviewDrawer(!showReviewDrawer)}
                    className="px-3 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50/70 text-indigo-700 hover:bg-indigo-100 text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <ListOrdered size={14} />
                    <span>{showReviewDrawer ? 'Hide Review' : `Review (${totalSelectedCount})`}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleClearSelection}
                    className="text-xs font-bold text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={totalSelectedCount === 0}
                onClick={handleInsertSelected}
                className={cn(
                  "px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-md",
                  totalSelectedCount > 0
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                )}
              >
                <Plus size={15} />
                <span>
                  Insert Multiples into {contextBadge.label} ({totalSelectedCount} item{totalSelectedCount !== 1 ? 's' : ''} • {totalSelectedUnits} units)
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Item & Variant Detailed Inspector Modal */}
      <ItemDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        item={inspectItem}
        variant={inspectVariant}
        allVariants={productVariants}
        allItems={templates}
        allCategories={categories}
        currentQuantity={inspectVariant ? getItemQuantity(inspectVariant.id) : (inspectItem ? getItemQuantity(inspectItem.id) : 1)}
        onUpdateQuantity={(id, qty) => updateQuantity(id, qty, true)}
        onSelectForInsert={(item, variant, qty) => {
          if (variant) {
            setSelectedVariantIds(prev => new Set(prev).add(variant.id));
            if (qty) updateQuantity(variant.id, qty, true);
          } else {
            setSelectedItemIds(prev => new Set(prev).add(item.id));
            if (qty) updateQuantity(item.id, qty, true);
          }
        }}
      />
    </>
  );

  return typeof document !== 'undefined' ? createPortal(catalogContent, document.body) : catalogContent;

  // Helper: Render Items in Grid or List Mode
  function renderItemsGridOrList(items: ItemTemplate[]) {
    if (items.length === 0) {
      return (
        <div className="p-12 text-center bg-slate-50/70 rounded-2xl border border-dashed border-slate-200">
          <Package size={36} className="mx-auto text-slate-300 mb-2" />
          <p className="text-xs font-bold text-slate-600">No items match this filter or search query</p>
          <p className="text-[11px] text-slate-400 mt-1">Try searching with a broader term or clearing category filter</p>
        </div>
      );
    }

    if (viewMode === 'TILES') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map(item => {
            const isSelected = selectedItemIds.has(item.id);
            const qty = getItemQuantity(item.id);
            const itemVariants = productVariants.filter(v => v.itemId === item.id);

            return (
              <div
                key={item.id}
                className={cn(
                  "bg-white rounded-2xl border p-4.5 flex flex-col justify-between transition-all shadow-2xs hover:shadow-md",
                  isSelected ? "border-indigo-600 ring-2 ring-indigo-50 bg-indigo-50/10" : "border-slate-200/90 hover:border-slate-300"
                )}
              >
                <div>
                  {/* Card Header: Code & Selection Checkbox */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                        {item.productCode || item.code || 'ITEM'}
                      </span>
                      {item.unit && (
                        <span className="text-[9px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded uppercase">
                          {item.unit}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleItemSelection(item)}
                      className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                      title={isSelected ? "Deselect item" : "Select item"}
                    >
                      {isSelected ? (
                        <CheckSquare size={18} className="text-indigo-600 fill-indigo-50" />
                      ) : (
                        <Square size={18} className="text-slate-300 hover:text-slate-500" />
                      )}
                    </button>
                  </div>

                  {/* Title & Description */}
                  <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug">
                    {item.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                    {item.description || item.category}
                  </p>

                  {/* Variant Availability Badge */}
                  {itemVariants.length > 0 && (
                    <div className="mt-2.5">
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                        <Layers size={11} /> {itemVariants.length} Variant{itemVariants.length !== 1 ? 's' : ''} Available
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Footer: Pricing, Stepper & Quick Add */}
                <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-1.5 flex-wrap">
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block">Base Rate</span>
                    <span className="text-xs font-bold font-mono text-slate-900">
                      LKR {(item.rate || 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Quantity Stepper */}
                    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-0.5 shadow-2xs">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateQuantity(item.id, -1);
                        }}
                        className="w-5 h-5 rounded flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors"
                        title="Decrease quantity"
                      >
                        <Minus size={10} />
                      </button>
                      <span className="w-6 text-center font-bold font-mono text-xs text-slate-800">
                        {qty}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateQuantity(item.id, 1);
                        }}
                        className="w-5 h-5 rounded flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors"
                        title="Increase quantity"
                      >
                        <Plus size={10} />
                      </button>
                    </div>

                    {/* Inspect Details Eye Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenItemDetails(item)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors shrink-0"
                      title="Inspect Specifications"
                    >
                      <Eye size={14} />
                    </button>

                    {/* Quick Add to Active Project's BOQ Button */}
                    <button
                      id={`quick-add-${item.id}`}
                      type="button"
                      onClick={(e) => handleQuickAddItem(item, e)}
                      className={cn(
                        "px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1 shrink-0 active:scale-95 cursor-pointer",
                        recentlyAddedId === item.id 
                          ? "bg-emerald-600 text-white shadow-emerald-600/20" 
                          : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20 hover:shadow-indigo-600/30"
                      )}
                      title={`Quick Add ${qty}x directly to ${activeTargetName} BOQ without opening details`}
                    >
                      {recentlyAddedId === item.id ? (
                        <>
                          <Check size={12} strokeWidth={3} className="text-white animate-in zoom-in-50 duration-150" />
                          <span>Added!</span>
                        </>
                      ) : (
                        <>
                          <Plus size={12} strokeWidth={3} />
                          <span>Quick Add</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    /* Items List Table */
    return (
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 w-10 text-center">Select</th>
              <th className="px-4 py-3">Item Code</th>
              <th className="px-5 py-3">Description / Name</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-3 py-3 text-center">Unit</th>
              <th className="px-4 py-3 text-right">Base Rate</th>
              <th className="px-3 py-3 text-center">Variants</th>
              <th className="px-4 py-3 text-center">Quantity</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map(item => {
              const isSelected = selectedItemIds.has(item.id);
              const qty = getItemQuantity(item.id);
              const itemVariants = productVariants.filter(v => v.itemId === item.id);

              return (
                <tr 
                  key={item.id} 
                  className={cn(
                    "hover:bg-slate-50/80 transition-colors",
                    isSelected ? "bg-indigo-50/20" : ""
                  )}
                >
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => toggleItemSelection(item)}
                      className="p-1 text-slate-400 hover:text-indigo-600"
                    >
                      {isSelected ? (
                        <CheckSquare size={16} className="text-indigo-600" />
                      ) : (
                        <Square size={16} className="text-slate-300" />
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-indigo-600">
                    {item.productCode || item.code || '-'}
                  </td>
                  <td className="px-5 py-3">
                    <span className="font-bold text-slate-900 block">{item.name}</span>
                    <span className="text-[11px] text-slate-400 line-clamp-1">{item.description || '-'}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{item.category}</td>
                  <td className="px-3 py-3 text-center font-mono uppercase text-slate-500 font-bold">{item.unit}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                    LKR {(item.rate || 0).toLocaleString()}
                  </td>
                  <td className="px-3 py-3 text-center">
                    {itemVariants.length > 0 ? (
                      <span className="text-[10px] font-bold font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                        {itemVariants.length}
                      </span>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="inline-flex items-center bg-slate-50 border border-slate-200 rounded-lg p-0.5 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-5 h-5 rounded flex items-center justify-center text-slate-500 hover:bg-slate-200"
                      >
                        <Minus size={10} />
                      </button>
                      <span className="w-6 text-center font-bold font-mono text-xs text-slate-800">
                        {qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-5 h-5 rounded flex items-center justify-center text-slate-500 hover:bg-slate-200"
                      >
                        <Plus size={10} />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenItemDetails(item)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="View Full Details"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        id={`quick-add-table-${item.id}`}
                        type="button"
                        onClick={(e) => handleQuickAddItem(item, e)}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-2xs",
                          recentlyAddedId === item.id
                            ? "bg-emerald-600 text-white"
                            : "bg-indigo-600 hover:bg-indigo-700 text-white"
                        )}
                        title={`Quick Add ${qty}x to ${activeTargetName} BOQ`}
                      >
                        {recentlyAddedId === item.id ? (
                          <>
                            <Check size={11} strokeWidth={3} />
                            <span>Added</span>
                          </>
                        ) : (
                          <>
                            <Plus size={11} strokeWidth={2.5} />
                            <span>Quick Add</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleItemSelection(item)}
                        className={cn(
                          "px-2 py-1 rounded-lg text-xs font-bold transition-all",
                          isSelected 
                            ? "bg-rose-50 text-rose-600 hover:bg-rose-100"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        )}
                      >
                        {isSelected ? 'Remove' : 'Select'}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  // Helper: Render Variants in Grid or List Mode
  function renderVariantsGridOrList(variants: ProductVariant[]) {
    if (variants.length === 0) {
      return (
        <div className="p-12 text-center bg-slate-50/70 rounded-2xl border border-dashed border-slate-200">
          <Layers size={36} className="mx-auto text-slate-300 mb-2" />
          <p className="text-xs font-bold text-slate-600">No product variants match this search filter</p>
          <p className="text-[11px] text-slate-400 mt-1">Try clearing filters or adding new variants in Product Portal</p>
        </div>
      );
    }

    if (viewMode === 'TILES') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {variants.map(v => {
            const isSelected = selectedVariantIds.has(v.id);
            const qty = getItemQuantity(v.id);
            const price = v.pricing?.sellingPrice || 0;
            const cost = v.pricing?.costPrice || v.bom?.totalCost || (price * 0.72);
            const margin = v.pricing?.grossMarginPercent || (price > 0 ? ((price - cost) / price * 100) : 28);

            return (
              <div
                key={v.id}
                className={cn(
                  "bg-white rounded-2xl border p-4.5 flex flex-col justify-between transition-all shadow-2xs hover:shadow-md",
                  isSelected ? "border-indigo-600 ring-2 ring-indigo-50 bg-indigo-50/10" : "border-slate-200/90 hover:border-slate-300"
                )}
              >
                <div>
                  {/* Card Top Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                        {v.variantCode}
                      </span>
                      {v.barcode && (
                        <span className="text-[9px] font-mono text-slate-400">
                          {v.barcode}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleVariantSelection(v)}
                      className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                      title={isSelected ? "Deselect variant" : "Select variant"}
                    >
                      {isSelected ? (
                        <CheckSquare size={18} className="text-indigo-600 fill-indigo-50" />
                      ) : (
                        <Square size={18} className="text-slate-300 hover:text-slate-500" />
                      )}
                    </button>
                  </div>

                  {/* Variant Name & Description */}
                  <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug">
                    {v.variantName}
                  </h4>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                    {v.customerDescription || v.boqDescription || v.notes || 'Configured engineered system variant'}
                  </p>

                  {/* Attribute Pills */}
                  {v.attributes && (
                    <div className="flex flex-wrap gap-1 mt-2.5">
                      {Object.entries(v.attributes).slice(0, 3).map(([key, val]) => (
                        <span key={key} className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                          {String(val)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card Bottom: Rate, Stepper, Inspect & Quick Add */}
                <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-1.5 flex-wrap">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold font-mono text-slate-900">
                        LKR {price.toLocaleString()}
                      </span>
                      <span className="text-[9px] text-emerald-600 font-bold font-mono">
                        {Math.round(margin)}% margin
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      Cost: LKR {Math.round(cost).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Stepper */}
                    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-0.5 shadow-2xs">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateQuantity(v.id, -1);
                        }}
                        className="w-5 h-5 rounded flex items-center justify-center text-slate-500 hover:bg-slate-200"
                        title="Decrease quantity"
                      >
                        <Minus size={10} />
                      </button>
                      <span className="w-6 text-center font-bold font-mono text-xs text-slate-800">
                        {qty}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateQuantity(v.id, 1);
                        }}
                        className="w-5 h-5 rounded flex items-center justify-center text-slate-500 hover:bg-slate-200"
                        title="Increase quantity"
                      >
                        <Plus size={10} />
                      </button>
                    </div>

                    {/* Inspect Details */}
                    <button
                      type="button"
                      onClick={() => handleOpenVariantDetails(v)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors shrink-0"
                      title="Inspect Specifications & BOM"
                    >
                      <Eye size={14} />
                    </button>

                    {/* Quick Add Variant Button */}
                    <button
                      id={`quick-add-variant-${v.id}`}
                      type="button"
                      onClick={(e) => handleQuickAddVariant(v, e)}
                      className={cn(
                        "px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1 shrink-0 active:scale-95 cursor-pointer",
                        recentlyAddedId === v.id 
                          ? "bg-emerald-600 text-white shadow-emerald-600/20" 
                          : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20 hover:shadow-indigo-600/30"
                      )}
                      title={`Quick Add ${qty}x directly to ${activeTargetName} BOQ without opening details`}
                    >
                      {recentlyAddedId === v.id ? (
                        <>
                          <Check size={12} strokeWidth={3} className="text-white animate-in zoom-in-50 duration-150" />
                          <span>Added!</span>
                        </>
                      ) : (
                        <>
                          <Plus size={12} strokeWidth={3} />
                          <span>Quick Add</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    /* Variants List Table */
    return (
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 w-10 text-center">Select</th>
              <th className="px-4 py-3">Variant Code</th>
              <th className="px-4 py-3">Barcode</th>
              <th className="px-5 py-3">Variant Name / Specs</th>
              <th className="px-4 py-3">Attributes</th>
              <th className="px-3 py-3 text-center">Unit</th>
              <th className="px-4 py-3 text-right">Cost (BOM)</th>
              <th className="px-4 py-3 text-right">Selling Price</th>
              <th className="px-3 py-3 text-center">Margin</th>
              <th className="px-4 py-3 text-center">Quantity</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {variants.map(v => {
              const isSelected = selectedVariantIds.has(v.id);
              const qty = getItemQuantity(v.id);
              const price = v.pricing?.sellingPrice || 0;
              const cost = v.pricing?.costPrice || v.bom?.totalCost || (price * 0.72);
              const margin = v.pricing?.grossMarginPercent || (price > 0 ? ((price - cost) / price * 100) : 28);

              return (
                <tr 
                  key={v.id} 
                  className={cn(
                    "hover:bg-slate-50/80 transition-colors",
                    isSelected ? "bg-indigo-50/20" : ""
                  )}
                >
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => toggleVariantSelection(v)}
                      className="p-1 text-slate-400 hover:text-indigo-600"
                    >
                      {isSelected ? (
                        <CheckSquare size={16} className="text-indigo-600" />
                      ) : (
                        <Square size={16} className="text-slate-300" />
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-indigo-600">
                    {v.variantCode}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-400 text-[11px]">
                    {v.barcode || '-'}
                  </td>
                  <td className="px-5 py-3">
                    <span className="font-bold text-slate-900 block">{v.variantName}</span>
                    <span className="text-[11px] text-slate-400 line-clamp-1">{v.customerDescription || '-'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {v.attributes && Object.entries(v.attributes).slice(0, 2).map(([k, val]) => (
                        <span key={k} className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                          {String(val)}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center font-mono uppercase text-slate-500 font-bold">{v.unit || 'Nos'}</td>
                  <td className="px-4 py-3 text-right font-mono text-slate-600">
                    LKR {Math.round(cost).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                    LKR {price.toLocaleString()}
                  </td>
                  <td className="px-3 py-3 text-center font-mono text-emerald-600 font-bold text-[11px]">
                    {Math.round(margin)}%
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="inline-flex items-center bg-slate-50 border border-slate-200 rounded-lg p-0.5 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => updateQuantity(v.id, -1)}
                        className="w-5 h-5 rounded flex items-center justify-center text-slate-500 hover:bg-slate-200"
                      >
                        <Minus size={10} />
                      </button>
                      <span className="w-6 text-center font-bold font-mono text-xs text-slate-800">
                        {qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(v.id, 1)}
                        className="w-5 h-5 rounded flex items-center justify-center text-slate-500 hover:bg-slate-200"
                      >
                        <Plus size={10} />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenVariantDetails(v)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="View Full Specs & BOM"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        id={`quick-add-variant-table-${v.id}`}
                        type="button"
                        onClick={(e) => handleQuickAddVariant(v, e)}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-2xs",
                          recentlyAddedId === v.id
                            ? "bg-emerald-600 text-white"
                            : "bg-indigo-600 hover:bg-indigo-700 text-white"
                        )}
                        title={`Quick Add ${qty}x to ${activeTargetName} BOQ`}
                      >
                        {recentlyAddedId === v.id ? (
                          <>
                            <Check size={11} strokeWidth={3} />
                            <span>Added</span>
                          </>
                        ) : (
                          <>
                            <Plus size={11} strokeWidth={2.5} />
                            <span>Quick Add</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleVariantSelection(v)}
                        className={cn(
                          "px-2 py-1 rounded-lg text-xs font-bold transition-all",
                          isSelected 
                            ? "bg-rose-50 text-rose-600 hover:bg-rose-100"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        )}
                      >
                        {isSelected ? 'Remove' : 'Select'}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }
};
