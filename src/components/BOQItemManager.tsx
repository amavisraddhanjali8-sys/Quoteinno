import React, { useState, useEffect, useMemo } from 'react';
import { 
  Layers, Package, Wand2, History, BarChart3, 
  Plus, Search, Grid, List, Edit2, 
  Trash2, ShieldCheck, Tag, ChevronRight, FolderPlus,
  Filter, X, ArrowUpDown, FileText, CheckCircle2,
  SlidersHorizontal, TrendingUp, FileSpreadsheet, FolderTree,
  DollarSign
} from 'lucide-react';
import { 
  ItemTemplate, ItemCategory, RateHistoryEntry, 
  CompetitivePriceEntry, ProductVariant 
} from '../types';
import { useQuoteData } from '../hooks/useQuoteData';
import { cn } from '../lib/utils';
import { CategoryTree } from './boq/CategoryTree';
import { CategoryModal } from './boq/CategoryModal';
import { ItemEditModal } from './boq/ItemEditModal';
import { SpecificationEngine } from './boq/SpecificationEngine';
import { RateHistoryView } from './boq/RateHistoryView';
import { PriceAnalyticsView } from './boq/PriceAnalyticsView';
import { RateUpdateModal } from './boq/RateUpdateModal';
import { CompetitivePriceModal } from './boq/CompetitivePriceModal';
import { VariantListView } from './VariantListView';
import { PricingIntelligenceDashboard } from './PricingIntelligenceDashboard';
import { VariantCreationWizard } from './VariantCreationWizard';
import { ExportActions } from './common/ExportActions';
import { DataImportModal } from './data-import/DataImportModal';
import { 
  exportBOQItemsCSV, exportBOQItemsPDF,
  exportVariantsCSV, exportVariantsPDF,
  exportSpecificationsCSV, exportSpecificationsPDF,
  exportRateHistoryCSV, exportRateHistoryPDF,
  exportPriceAnalyticsCSV, exportPriceAnalyticsPDF
} from '../services/dataExportService';

export type BOQTab = 'CATEGORIES_ITEMS' | 'VARIANTS_LIST' | 'PRICING_INTELLIGENCE' | 'SPEC_ENGINE' | 'RATE_HISTORY' | 'PRICE_ANALYTICS';

interface BOQItemManagerProps {
  onOpenCatalog?: (context?: 'boq') => void;
  onNavigateToCostPortal?: () => void;
  initialTab?: BOQTab;
}

export const BOQItemManager: React.FC<BOQItemManagerProps> = ({ onOpenCatalog, onNavigateToCostPortal, initialTab }) => {
  const {
    itemTemplates, setItemTemplates, saveItemTemplate, deleteItemTemplate,
    itemCategories, saveItemCategory, deleteItemCategory,
    productVariants, saveProductVariant, deleteProductVariant,
    bulkUpdateVariantPrices, approveVariant,
    projects
  } = useQuoteData();

  // Active Main Navigation Tab
  const [activeTab, setActiveTab] = useState<BOQTab>(initialTab || 'CATEGORIES_ITEMS');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Universal Data Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Variant Creation & Editing Wizard State
  const [isVariantWizardOpen, setIsVariantWizardOpen] = useState(false);
  const [variantToEdit, setVariantToEdit] = useState<ProductVariant | undefined>(undefined);
  const [wizardPreSelectedItemId, setWizardPreSelectedItemId] = useState<string | undefined>(undefined);

  // Category & Item Selection State
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | 'All'>('All');
  const [selectedItemForEngine, setSelectedItemForEngine] = useState<ItemTemplate | null>(null);
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'GRID' | 'TABLE'>('TABLE');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Active' | 'Discontinued'>('ALL');
  const [itemSortBy, setItemSortBy] = useState<'NAME_ASC' | 'NAME_DESC' | 'RATE_ASC' | 'RATE_DESC' | 'MARGIN_DESC' | 'CODE'>('NAME_ASC');
  const [specStatusFilter, setSpecStatusFilter] = useState<'ALL' | 'HAS_SPEC' | 'NO_SPEC'>('ALL');

  // Modals state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryModalParentId, setCategoryModalParentId] = useState<string | null>(null);
  const [categoryToEdit, setCategoryToEdit] = useState<ItemCategory | null>(null);

  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<ItemTemplate | null>(null);
  const [itemModalCategoryId, setItemModalCategoryId] = useState<string | null>(null);

  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [rateModalItem, setRateModalItem] = useState<ItemTemplate | null>(null);

  const [isCompetitiveModalOpen, setIsCompetitiveModalOpen] = useState(false);
  const [competitiveModalItem, setCompetitiveModalItem] = useState<ItemTemplate | null>(null);

  // Pre-select first item for spec engine if not set
  useEffect(() => {
    if (!selectedItemForEngine && itemTemplates.length > 0) {
      setSelectedItemForEngine(itemTemplates[0]);
    }
  }, [itemTemplates, selectedItemForEngine]);

  // Build Map of category children to find all sub-categories recursively
  const childrenMap = useMemo(() => {
    const map = new Map<string | null, string[]>();
    itemCategories.forEach(c => {
      const p = c.parentId || null;
      if (!map.has(p)) map.set(p, []);
      map.get(p)!.push(c.id);
    });
    return map;
  }, [itemCategories]);

  // Find all descendant category IDs for selected category
  const descendantCategoryIds = useMemo(() => {
    if (selectedCategoryId === 'All') return new Set<string>();

    const set = new Set<string>([selectedCategoryId]);
    const queue = [selectedCategoryId];
    while (queue.length > 0) {
      const current = queue.shift()!;
      const children = childrenMap.get(current) || [];
      for (const childId of children) {
        if (!set.has(childId)) {
          set.add(childId);
          queue.push(childId);
        }
      }
    }
    return set;
  }, [selectedCategoryId, childrenMap]);

  // Filter items based on selected category & sub-categories
  const filteredItems = useMemo(() => {
    return itemTemplates.filter(item => {
      // Category filter
      if (selectedCategoryId !== 'All') {
        const itemCatId = item.categoryId;
        let matches = false;
        if (itemCatId && descendantCategoryIds.has(itemCatId)) {
          matches = true;
        } else {
          // Check matching category or subcategory name
          const selectedCat = itemCategories.find(c => c.id === selectedCategoryId);
          if (selectedCat) {
            matches = (
              item.category.toLowerCase() === selectedCat.name.toLowerCase() ||
              (item.subCategory && item.subCategory.toLowerCase() === selectedCat.name.toLowerCase())
            );
          }
        }
        if (!matches) return false;
      }

      // Status filter
      if (statusFilter !== 'ALL' && item.status !== statusFilter) {
        return false;
      }

      // Search filter
      if (itemSearchQuery.trim()) {
        const q = itemSearchQuery.toLowerCase();
        const matchesQuery = (
          item.name.toLowerCase().includes(q) ||
          (item.productCode && item.productCode.toLowerCase().includes(q)) ||
          item.category.toLowerCase().includes(q) ||
          (item.subCategory && item.subCategory.toLowerCase().includes(q)) ||
          (item.description && item.description.toLowerCase().includes(q))
        );
        if (!matchesQuery) return false;
      }

      return true;
    });
  }, [itemTemplates, selectedCategoryId, descendantCategoryIds, statusFilter, itemSearchQuery, itemCategories]);

  // Sorted and further filtered items
  const sortedAndFilteredItems = useMemo(() => {
    let result = filteredItems;
    if (specStatusFilter === 'HAS_SPEC') {
      result = result.filter(i => !!i.detailedSpecification);
    } else if (specStatusFilter === 'NO_SPEC') {
      result = result.filter(i => !i.detailedSpecification);
    }

    return [...result].sort((a, b) => {
      if (itemSortBy === 'NAME_ASC') return a.name.localeCompare(b.name);
      if (itemSortBy === 'NAME_DESC') return b.name.localeCompare(a.name);
      if (itemSortBy === 'RATE_ASC') return a.rate - b.rate;
      if (itemSortBy === 'RATE_DESC') return b.rate - a.rate;
      if (itemSortBy === 'MARGIN_DESC') {
        const costA = a.lastSupplierPrice || (a.rate * 0.72);
        const marginA = a.rate > 0 ? (a.rate - costA) / a.rate : 0;
        const costB = b.lastSupplierPrice || (b.rate * 0.72);
        const marginB = b.rate > 0 ? (b.rate - costB) / b.rate : 0;
        return marginB - marginA;
      }
      if (itemSortBy === 'CODE') return (a.productCode || '').localeCompare(b.productCode || '');
      return 0;
    });
  }, [filteredItems, specStatusFilter, itemSortBy]);

  const activeCatalogFilterCount = useMemo(() => {
    let count = 0;
    if (itemSearchQuery.trim()) count++;
    if (statusFilter !== 'ALL') count++;
    if (specStatusFilter !== 'ALL') count++;
    if (itemSortBy !== 'NAME_ASC') count++;
    return count;
  }, [itemSearchQuery, statusFilter, specStatusFilter, itemSortBy]);

  const resetCatalogFilters = () => {
    setItemSearchQuery('');
    setStatusFilter('ALL');
    setSpecStatusFilter('ALL');
    setItemSortBy('NAME_ASC');
  };

  // Breadcrumb generation
  const breadcrumbPath = useMemo(() => {
    if (selectedCategoryId === 'All') return [{ id: 'All', name: 'All Categories' }];

    const path: { id: string; name: string }[] = [];
    let currentId: string | null | undefined = selectedCategoryId;

    while (currentId) {
      const cat = itemCategories.find(c => c.id === currentId);
      if (cat) {
        path.unshift({ id: cat.id, name: cat.name });
        currentId = cat.parentId;
      } else {
        break;
      }
    }

    return [{ id: 'All', name: 'All Categories' }, ...path];
  }, [selectedCategoryId, itemCategories]);

  // Selected Category Object
  const currentCategory = itemCategories.find(c => c.id === selectedCategoryId);

  // Category Actions
  const handleOpenAddMainCategory = () => {
    setCategoryModalParentId(null);
    setCategoryToEdit(null);
    setIsCategoryModalOpen(true);
  };

  const handleOpenAddSubCategory = (parentId: string) => {
    setCategoryModalParentId(parentId);
    setCategoryToEdit(null);
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (cat: ItemCategory) => {
    setCategoryToEdit(cat);
    setCategoryModalParentId(cat.parentId || null);
    setIsCategoryModalOpen(true);
  };

  const handleDeleteCategory = (catId: string) => {
    deleteItemCategory(catId);
    if (selectedCategoryId === catId) {
      setSelectedCategoryId('All');
    }
  };

  // Item Actions
  const handleOpenAddItem = (catId?: string) => {
    setItemToEdit(null);
    setItemModalCategoryId(catId || (selectedCategoryId !== 'All' ? selectedCategoryId : null));
    setIsItemModalOpen(true);
  };

  const handleOpenEditItem = (item: ItemTemplate) => {
    setItemToEdit(item);
    setItemModalCategoryId(item.categoryId || null);
    setIsItemModalOpen(true);
  };

  const handleOpenSpecEngine = (item: ItemTemplate) => {
    setSelectedItemForEngine(item);
    setActiveTab('SPEC_ENGINE');
  };

  const handleOpenRateHistory = (item: ItemTemplate) => {
    setRateModalItem(item);
    setActiveTab('RATE_HISTORY');
  };

  // Rate Update Handler
  const handleSaveRateUpdate = (itemId: string, newEntry: RateHistoryEntry, updateCurrentRate: boolean) => {
    const item = itemTemplates.find(i => i.id === itemId);
    if (!item) return;

    const existingHistory = item.rateHistory || [];
    const updatedHistory = [newEntry, ...existingHistory];

    const updatedItem: ItemTemplate = {
      ...item,
      rate: updateCurrentRate ? newEntry.rate : item.rate,
      lastSupplierPrice: updateCurrentRate ? (newEntry.supplierCost || item.lastSupplierPrice) : item.lastSupplierPrice,
      targetMargin: updateCurrentRate ? (newEntry.marginPercent || item.targetMargin) : item.targetMargin,
      rateHistory: updatedHistory
    };

    saveItemTemplate(updatedItem);
  };

  // Competitive Price Handler
  const handleSaveCompetitivePrice = (itemId: string, newEntry: CompetitivePriceEntry) => {
    const item = itemTemplates.find(i => i.id === itemId);
    if (!item) return;

    const existing = item.competitivePrices || [];
    const updated = [newEntry, ...existing];

    const updatedItem: ItemTemplate = {
      ...item,
      competitivePrices: updated
    };

    saveItemTemplate(updatedItem);
  };

  // Variant Actions
  const handleOpenCreateVariant = (preSelectedItemId?: string) => {
    setVariantToEdit(undefined);
    setWizardPreSelectedItemId(preSelectedItemId);
    setIsVariantWizardOpen(true);
  };

  const handleOpenEditVariant = (variant: ProductVariant) => {
    setVariantToEdit(variant);
    setWizardPreSelectedItemId(variant.itemId);
    setIsVariantWizardOpen(true);
  };

  const handleExportCurrentTabCSV = () => {
    switch (activeTab) {
      case 'CATEGORIES_ITEMS':
        exportBOQItemsCSV(sortedAndFilteredItems);
        break;
      case 'VARIANTS_LIST':
        exportVariantsCSV(productVariants, itemTemplates);
        break;
      case 'PRICING_INTELLIGENCE':
        exportVariantsCSV(productVariants, itemTemplates);
        break;
      case 'SPEC_ENGINE':
        exportSpecificationsCSV(itemTemplates);
        break;
      case 'RATE_HISTORY':
        exportRateHistoryCSV(itemTemplates);
        break;
      case 'PRICE_ANALYTICS':
        exportPriceAnalyticsCSV(itemTemplates);
        break;
      default:
        exportBOQItemsCSV(itemTemplates);
    }
  };

  const handleExportCurrentTabPDF = () => {
    switch (activeTab) {
      case 'CATEGORIES_ITEMS':
        exportBOQItemsPDF(sortedAndFilteredItems);
        break;
      case 'VARIANTS_LIST':
        exportVariantsPDF(productVariants, itemTemplates);
        break;
      case 'PRICING_INTELLIGENCE':
        exportVariantsPDF(productVariants, itemTemplates);
        break;
      case 'SPEC_ENGINE':
        exportSpecificationsPDF(itemTemplates, selectedItemForEngine);
        break;
      case 'RATE_HISTORY':
        exportRateHistoryPDF(itemTemplates);
        break;
      case 'PRICE_ANALYTICS':
        exportPriceAnalyticsPDF(itemTemplates);
        break;
      default:
        exportBOQItemsPDF(itemTemplates);
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-8.5rem)] h-full w-full bg-slate-100 rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Title Ribbon - One Line Ribbon with Simple Description & Only Buttons */}
      <header className="px-5 py-2.5 bg-white border-b border-slate-200/80 shrink-0">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Package size={16} />
            </div>
            <div className="flex items-baseline gap-2 min-w-0">
              <h1 className="text-sm font-bold text-slate-900 whitespace-nowrap">BOQ Library & Pricing</h1>
              <span className="text-xs text-slate-500 font-normal truncate hidden sm:inline">
                • Categories, specifications & price intelligence
              </span>
            </div>
          </div>

          {/* Navigation & Export Actions - ONLY BUTTONS */}
          <div className="flex items-center gap-2 shrink-0">
            {onOpenCatalog && (
              <button
                type="button"
                onClick={() => onOpenCatalog('boq')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 rounded-lg text-xs font-semibold transition-all shadow-2xs"
                title="Open Visual Item Catalog in Full-Screen Mode"
              >
                <Package size={13} className="text-indigo-600" />
                <span>Visual Catalog</span>
              </button>
            )}

            {onNavigateToCostPortal && (
              <button
                type="button"
                onClick={onNavigateToCostPortal}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200/80 rounded-lg text-xs font-semibold transition-all shadow-2xs cursor-pointer"
                title="Open Procurement Cost Items & BOM Dependencies Hub"
              >
                <DollarSign size={13} className="text-orange-600" />
                <span>Cost Items Hub</span>
              </button>
            )}

            <ExportActions 
              onExportCSV={handleExportCurrentTabCSV}
              onExportPDF={handleExportCurrentTabPDF}
              labelCSV="Tab CSV"
              labelPDF="Tab PDF"
            />
          </div>
        </div>
      </header>

      {/* Sub Portals Navigation Strip */}
      <nav className="px-5 py-1.5 bg-slate-50 border-b border-slate-200/80 flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0">
        <button
          onClick={() => setActiveTab('CATEGORIES_ITEMS')}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap",
            activeTab === 'CATEGORIES_ITEMS'
              ? "bg-white text-orange-600 shadow-2xs font-semibold border border-slate-200/80"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          )}
        >
          <Layers size={13} />
          <span>Categories & Items</span>
        </button>

        <button
          onClick={() => setActiveTab('VARIANTS_LIST')}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap",
            activeTab === 'VARIANTS_LIST'
              ? "bg-white text-amber-600 shadow-2xs font-semibold border border-slate-200/80"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          )}
        >
          <SlidersHorizontal size={13} />
          <span>Variant Catalog & Matrix</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 ml-0.5">
            {productVariants.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('PRICING_INTELLIGENCE')}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap",
            activeTab === 'PRICING_INTELLIGENCE'
              ? "bg-white text-emerald-600 shadow-2xs font-semibold border border-slate-200/80"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          )}
        >
          <TrendingUp size={13} />
          <span>Pricing Intelligence</span>
        </button>

        <button
          onClick={() => setActiveTab('SPEC_ENGINE')}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap",
            activeTab === 'SPEC_ENGINE'
              ? "bg-white text-orange-600 shadow-2xs font-semibold border border-slate-200/80"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          )}
        >
          <Wand2 size={13} />
          <span>Specification Engine</span>
        </button>

        <button
          onClick={() => setActiveTab('RATE_HISTORY')}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap",
            activeTab === 'RATE_HISTORY'
              ? "bg-white text-orange-600 shadow-2xs font-semibold border border-slate-200/80"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          )}
        >
          <History size={13} />
          <span>Rate History</span>
        </button>

        <button
          onClick={() => setActiveTab('PRICE_ANALYTICS')}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap",
            activeTab === 'PRICE_ANALYTICS'
              ? "bg-white text-orange-600 shadow-2xs font-semibold border border-slate-200/80"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          )}
        >
          <BarChart3 size={13} />
          <span>Price Analytics</span>
        </button>
      </nav>

      {/* Main Workspace Body */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'CATEGORIES_ITEMS' && (
          <div className="flex h-full overflow-hidden">
            {/* Left Sidebar: Hierarchical Category Tree */}
            <CategoryTree
              categories={itemCategories}
              items={itemTemplates}
              selectedCategoryId={selectedCategoryId}
              onSelectCategory={setSelectedCategoryId}
              onAddMainCategory={handleOpenAddMainCategory}
              onAddSubCategory={handleOpenAddSubCategory}
              onEditCategory={handleOpenEditCategory}
              onDeleteCategory={handleDeleteCategory}
              onAddItemToCategory={handleOpenAddItem}
            />

            {/* Right Pane: Category Items & Operations */}
            <div className="flex-1 flex flex-col h-full bg-slate-50/50 overflow-hidden">
              {/* Category Breadcrumbs & Quick Controls Header */}
              <div className="px-6 py-3.5 bg-white border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                {/* Breadcrumbs */}
                <div className="flex items-center gap-1.5 text-xs text-slate-500 overflow-x-auto">
                  {breadcrumbPath.map((b, idx) => (
                    <React.Fragment key={b.id}>
                      {idx > 0 && <ChevronRight size={12} className="text-slate-400 shrink-0" />}
                      <button
                        onClick={() => setSelectedCategoryId(b.id)}
                        className={cn(
                          "hover:text-slate-900 transition-colors whitespace-nowrap",
                          idx === breadcrumbPath.length - 1 ? "font-bold text-slate-900" : "font-medium"
                        )}
                      >
                        {b.name}
                      </button>
                    </React.Fragment>
                  ))}
                  {currentCategory && (
                    <span 
                      className="w-2.5 h-2.5 rounded-full shrink-0 ml-1"
                      style={{ backgroundColor: currentCategory.color || '#0ea5e9' }}
                    />
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsImportModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                    title="Import BOQ Items from CSV or Excel Spreadsheet with interactive staging"
                  >
                    <FileSpreadsheet size={13} className="text-sky-600" />
                    <span>Import Excel / CSV</span>
                  </button>

                  <ExportActions 
                    onExportCSV={() => exportBOQItemsCSV(sortedAndFilteredItems)}
                    onExportPDF={() => exportBOQItemsPDF(sortedAndFilteredItems)}
                    labelCSV="Items CSV"
                    labelPDF="Items PDF"
                  />

                  {selectedCategoryId !== 'All' && (
                    <button
                      onClick={() => handleOpenAddSubCategory(selectedCategoryId)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                    >
                      <FolderPlus size={13} className="text-blue-500" />
                      <span>+ Sub-Category</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleOpenAddItem(selectedCategoryId !== 'All' ? selectedCategoryId : undefined)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-semibold shadow-xs transition-all"
                  >
                    <Plus size={13} />
                    <span>New BOQ Item</span>
                  </button>
                </div>
              </div>

              {/* Filter & View Toolbar */}
              <div className="px-6 py-3 bg-white border-b border-slate-200/80 shrink-0 space-y-2.5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2.5 flex-1">
                    {/* Search items */}
                    <div className="relative flex-1 min-w-[220px] max-w-sm">
                      <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={itemSearchQuery}
                        onChange={(e) => setItemSearchQuery(e.target.value)}
                        placeholder="Search by Item Code (PK), Category (FK), Name, Specs..."
                        className="w-full text-xs pl-8 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-orange-500"
                      />
                      {itemSearchQuery && (
                        <button
                          onClick={() => setItemSearchQuery('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>

                    {/* Status filter */}
                    <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 text-xs">
                      <CheckCircle2 size={12} className="text-slate-400 shrink-0" />
                      <span className="font-semibold text-slate-500 text-[11px]">Status:</span>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="bg-transparent font-semibold text-slate-800 focus:outline-hidden cursor-pointer text-xs"
                      >
                        <option value="ALL">All Statuses</option>
                        <option value="Active">Active Only</option>
                        <option value="Discontinued">Discontinued</option>
                      </select>
                    </div>

                    {/* Specification Status filter */}
                    <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 text-xs">
                      <FileText size={12} className="text-slate-400 shrink-0" />
                      <span className="font-semibold text-slate-500 text-[11px]">Spec:</span>
                      <select
                        value={specStatusFilter}
                        onChange={(e) => setSpecStatusFilter(e.target.value as any)}
                        className="bg-transparent font-semibold text-slate-800 focus:outline-hidden cursor-pointer text-xs"
                      >
                        <option value="ALL">All Specifications</option>
                        <option value="HAS_SPEC">With Detailed Spec</option>
                        <option value="NO_SPEC">Needs Specification</option>
                      </select>
                    </div>

                    {/* Sort by */}
                    <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 text-xs">
                      <ArrowUpDown size={12} className="text-slate-400 shrink-0" />
                      <span className="font-semibold text-slate-500 text-[11px]">Sort:</span>
                      <select
                        value={itemSortBy}
                        onChange={(e) => setItemSortBy(e.target.value as any)}
                        className="bg-transparent font-semibold text-slate-800 focus:outline-hidden cursor-pointer text-xs"
                      >
                        <option value="NAME_ASC">Name (A → Z)</option>
                        <option value="NAME_DESC">Name (Z → A)</option>
                        <option value="RATE_ASC">Selling Rate (Low → High)</option>
                        <option value="RATE_DESC">Selling Rate (High → Low)</option>
                        <option value="MARGIN_DESC">Margin (High → Low)</option>
                        <option value="CODE">Product Code</option>
                      </select>
                    </div>
                  </div>

                  {/* Layout View Toggle */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-slate-500 font-medium">
                      Showing <strong className="text-slate-800">{sortedAndFilteredItems.length}</strong> items
                    </span>
                    <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                      <button
                        onClick={() => setViewMode('TABLE')}
                        className={cn(
                          "p-1 rounded text-xs transition-colors",
                          viewMode === 'TABLE' ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                        )}
                        title="Table View"
                      >
                        <List size={14} />
                      </button>
                      <button
                        onClick={() => setViewMode('GRID')}
                        className={cn(
                          "p-1 rounded text-xs transition-colors",
                          viewMode === 'GRID' ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                        )}
                        title="Card Grid View"
                      >
                        <Grid size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Active Filter Badges */}
                {activeCatalogFilterCount > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-slate-100 text-xs">
                    <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 mr-1">
                      <Filter size={11} /> Filters:
                    </span>

                    {itemSearchQuery && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200 text-[11px] font-medium">
                        Search: "{itemSearchQuery}"
                        <button onClick={() => setItemSearchQuery('')} className="hover:text-slate-950">
                          <X size={11} />
                        </button>
                      </span>
                    )}

                    {statusFilter !== 'ALL' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-50 text-orange-800 border border-orange-200 text-[11px] font-medium">
                        Status: {statusFilter}
                        <button onClick={() => setStatusFilter('ALL')} className="hover:text-orange-950">
                          <X size={11} />
                        </button>
                      </span>
                    )}

                    {specStatusFilter !== 'ALL' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200 text-[11px] font-medium">
                        Spec: {specStatusFilter === 'HAS_SPEC' ? 'With Detailed Spec' : 'Needs Spec'}
                        <button onClick={() => setSpecStatusFilter('ALL')} className="hover:text-blue-950">
                          <X size={11} />
                        </button>
                      </span>
                    )}

                    {itemSortBy !== 'NAME_ASC' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-medium">
                        Sorted: {
                          itemSortBy === 'NAME_DESC' ? 'Z to A' :
                          itemSortBy === 'RATE_ASC' ? 'Rate Low-High' :
                          itemSortBy === 'RATE_DESC' ? 'Rate High-Low' :
                          itemSortBy === 'MARGIN_DESC' ? 'Margin High-Low' : 'Code'
                        }
                        <button onClick={() => setItemSortBy('NAME_ASC')} className="hover:text-emerald-950">
                          <X size={11} />
                        </button>
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={resetCatalogFilters}
                      className="text-[11px] text-orange-600 hover:text-orange-700 font-semibold underline underline-offset-2 ml-1"
                    >
                      Reset All
                    </button>
                  </div>
                )}
              </div>

              {/* Items List Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {sortedAndFilteredItems.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center max-w-md mx-auto my-8">
                    <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mx-auto mb-3">
                      <Package size={24} />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mb-1">No items found</h3>
                    <p className="text-xs text-slate-500 mb-4">
                      {itemSearchQuery 
                        ? `No items matching "${itemSearchQuery}"`
                        : `This category currently has no items assigned.`
                      }
                    </p>
                    <button
                      onClick={() => handleOpenAddItem(selectedCategoryId !== 'All' ? selectedCategoryId : undefined)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-semibold transition-all shadow-xs"
                    >
                      <Plus size={14} />
                      <span>Add First Item</span>
                    </button>
                  </div>
                ) : viewMode === 'TABLE' ? (
                  /* Table Layout */
                  <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-x-auto scrollbar-thin">
                    <table className="w-full text-left text-xs border-collapse min-w-[960px]">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider whitespace-nowrap">
                          <th className="py-2.5 px-4">Item Code (PK)</th>
                          <th className="py-2.5 px-4">Category (FK)</th>
                          <th className="py-2.5 px-4">BOQ Item Name</th>
                          <th className="py-2.5 px-4">Unit</th>
                          <th className="py-2.5 px-4 text-right">Selling Rate</th>
                          <th className="py-2.5 px-4 text-right">Supplier Cost</th>
                          <th className="py-2.5 px-4 text-right">Margin %</th>
                          <th className="py-2.5 px-4 text-center">Specification</th>
                          <th className="py-2.5 px-4 text-right sticky right-0 bg-slate-50/95 backdrop-blur-xs z-10 border-l border-slate-200/80 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.04)]">
                            Actions & Features
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {sortedAndFilteredItems.map(item => {
                          const cost = item.lastSupplierPrice || Math.round(item.rate * 0.72);
                          const margin = item.rate > 0 ? Math.round(((item.rate - cost) / item.rate) * 1000) / 10 : 0;
                          const hasSpec = !!item.detailedSpecification;

                          return (
                            <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group whitespace-nowrap">
                              {/* PK: Item Code */}
                              <td className="py-2.5 px-4 font-mono font-medium text-slate-900 whitespace-nowrap">
                                <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/80 inline-flex items-center gap-1 shadow-2xs">
                                  <Package size={11} className="text-orange-500 shrink-0" />
                                  <span>PK: {item.productCode || item.id.slice(0, 8)}</span>
                                </span>
                              </td>

                              {/* FK: Category */}
                              <td className="py-2.5 px-4 whitespace-nowrap text-slate-600">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-50 text-orange-800 text-[11px] font-bold border border-orange-200/80 shadow-2xs">
                                  <FolderTree size={10} className="text-orange-500 shrink-0" />
                                  <span>FK: {item.categoryPath && item.categoryPath.length > 0 ? item.categoryPath.join(' › ') : item.category}</span>
                                </span>
                              </td>

                              <td className="py-2.5 px-4 max-w-sm truncate">
                                <div className="flex items-center gap-2 flex-wrap truncate">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditItem(item)}
                                    className="font-bold text-slate-900 hover:text-orange-600 text-left transition-colors truncate"
                                    title="Click to edit BOQ item properties"
                                  >
                                    {item.name}
                                  </button>
                                  {(() => {
                                    const variantCount = productVariants.filter(v => v.itemId === item.id).length;
                                    return variantCount > 0 ? (
                                      <button
                                        type="button"
                                        onClick={() => setActiveTab('VARIANTS_LIST')}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors shadow-2xs"
                                        title="View variants in Variant Matrix"
                                      >
                                        <SlidersHorizontal size={10} />
                                        <span>{variantCount} Variants</span>
                                      </button>
                                    ) : null;
                                  })()}
                                </div>
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-700">
                                {item.unit}
                              </td>
                              <td className="py-3 px-4 text-right font-bold text-slate-900 whitespace-nowrap">
                                LKR {item.rate.toLocaleString()}
                              </td>
                              <td className="py-3 px-4 text-right text-slate-600 whitespace-nowrap">
                                LKR {cost.toLocaleString()}
                              </td>
                              <td className="py-3 px-4 text-right whitespace-nowrap">
                                <span className={cn(
                                  "px-2 py-0.5 rounded-full text-[11px] font-bold",
                                  margin >= 25 ? "bg-emerald-100 text-emerald-800" :
                                  margin >= 20 ? "bg-blue-100 text-blue-800" :
                                  "bg-amber-100 text-amber-800"
                                )}>
                                  {margin}%
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center whitespace-nowrap">
                                {hasSpec ? (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenSpecEngine(item)}
                                    className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200 transition-colors"
                                    title="View detailed engineering specification"
                                  >
                                    <ShieldCheck size={11} /> Tender Ready
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenSpecEngine(item)}
                                    className="text-[10px] text-slate-400 hover:text-orange-600 hover:underline"
                                    title="Add specification"
                                  >
                                    Basic +
                                  </button>
                                )}
                              </td>
                              <td className="py-2.5 px-4 text-right whitespace-nowrap sticky right-0 bg-white group-hover:bg-slate-50 transition-colors z-10 border-l border-slate-200/60 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.04)]">
                                <div className="flex items-center justify-end gap-1.5">
                                  {/* Create Variant Quick Action */}
                                  <button
                                    onClick={() => handleOpenCreateVariant(item.id)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/90 shadow-2xs transition-colors shrink-0"
                                    title="Open 11-step Architectural Variant Wizard for this item"
                                  >
                                    <SlidersHorizontal size={12} className="text-amber-600" />
                                    <span>+ Variant</span>
                                  </button>

                                  {/* Spec Engine */}
                                  <button
                                    onClick={() => handleOpenSpecEngine(item)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-orange-600 hover:bg-orange-50 transition-colors"
                                    title="Open in Specification Engine"
                                  >
                                    <Wand2 size={13} />
                                  </button>

                                  {/* Rate History */}
                                  <button
                                    onClick={() => handleOpenRateHistory(item)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                    title="View Rate History"
                                  >
                                    <History size={13} />
                                  </button>

                                  {/* Edit Item */}
                                  <button
                                    onClick={() => handleOpenEditItem(item)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                                    title="Edit Item"
                                  >
                                    <Edit2 size={13} />
                                  </button>

                                  {/* Delete */}
                                  <button
                                    onClick={() => {
                                      if (confirm(`Delete "${item.name}" from BOQ Library?`)) {
                                        deleteItemTemplate(item.id);
                                      }
                                    }}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                    title="Delete Item"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  /* Grid Layout */
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sortedAndFilteredItems.map(item => {
                      const cost = item.lastSupplierPrice || Math.round(item.rate * 0.72);
                      const margin = item.rate > 0 ? Math.round(((item.rate - cost) / item.rate) * 1000) / 10 : 0;
                      return (
                        <div 
                          key={item.id}
                          className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                                {item.productCode || 'BOQ-ITEM'}
                              </span>
                              <span className={cn(
                                "px-2 py-0.5 rounded-full text-[10px] font-bold",
                                margin >= 25 ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
                              )}>
                                {margin}% Margin
                              </span>
                            </div>

                            <h3 className="text-xs font-bold text-slate-900 mb-1 leading-snug">
                              {item.name}
                            </h3>

                            <p className="text-[11px] text-slate-500 line-clamp-2 mb-3">
                              {item.description || 'No summary description provided.'}
                            </p>

                            <div className="text-[11px] text-slate-400 flex items-center gap-1 mb-3">
                              <Tag size={11} />
                              <span className="truncate">
                                {item.categoryPath ? item.categoryPath.join(' › ') : item.category}
                              </span>
                            </div>
                          </div>

                          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                            <div>
                              <div className="text-[10px] text-slate-400">Unit Selling Rate</div>
                              <div className="text-sm font-bold text-slate-900">
                                LKR {item.rate.toLocaleString()} <span className="text-[10px] font-normal text-slate-500">/{item.unit}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleOpenSpecEngine(item)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-orange-600 hover:bg-orange-50 transition-colors"
                                title="Spec Engine"
                              >
                                <Wand2 size={13} />
                              </button>
                              <button
                                onClick={() => handleOpenRateHistory(item)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                title="Rate History"
                              >
                                <History size={13} />
                              </button>
                              <button
                                onClick={() => handleOpenEditItem(item)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                                title="Edit"
                              >
                                <Edit2 size={13} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Variant Master Catalog & Matrix */}
        {activeTab === 'VARIANTS_LIST' && (
          <div className="h-full overflow-y-auto p-6 bg-slate-100/60">
            <VariantListView
              variants={productVariants}
              categories={itemCategories}
              itemTemplates={itemTemplates}
              projects={projects}
              onAddNewVariant={(preSelectedItemId) => handleOpenCreateVariant(preSelectedItemId)}
              onEditVariant={(v) => handleOpenEditVariant(v)}
              onDeleteVariant={(id) => deleteProductVariant(id)}
              onApproveVariant={(id) => approveVariant(id, 'Lead QS Approver')}
              onUpdatePricing={(updated) => saveProductVariant(updated)}
            />
          </div>
        )}

        {/* Tab 3: Pricing Intelligence Dashboard */}
        {activeTab === 'PRICING_INTELLIGENCE' && (
          <div className="h-full overflow-y-auto p-6 bg-slate-100/60">
            <PricingIntelligenceDashboard
              variants={productVariants}
              categories={itemCategories}
              itemTemplates={itemTemplates}
              onApplyBulkPriceUpdate={(rule) => bulkUpdateVariantPrices(rule)}
              onRefreshVariantValidity={(id) => {
                const v = productVariants.find(item => item.id === id);
                if (v && v.pricing) {
                  const updated: ProductVariant = {
                    ...v,
                    pricing: {
                      ...v.pricing,
                      effectiveFrom: new Date().toISOString(),
                      lastUpdated: new Date().toISOString()
                    }
                  };
                  saveProductVariant(updated);
                }
              }}
            />
          </div>
        )}

        {/* Tab 4: Specification Engine */}
        {activeTab === 'SPEC_ENGINE' && (
          <SpecificationEngine
            selectedItem={selectedItemForEngine}
            allItems={itemTemplates}
            categories={itemCategories}
            onSelectItem={setSelectedItemForEngine}
            onSaveItem={saveItemTemplate}
            onDeleteItem={deleteItemTemplate}
          />
        )}

        {/* Tab 5: Rate History */}
        {activeTab === 'RATE_HISTORY' && (
          <RateHistoryView
            items={itemTemplates}
            categories={itemCategories}
            selectedItem={rateModalItem || selectedItemForEngine}
            onSelectItem={setRateModalItem}
            onOpenRateModal={(it) => {
              setRateModalItem(it || null);
              setIsRateModalOpen(true);
            }}
            onOpenCompetitiveModal={(it) => {
              setCompetitiveModalItem(it || null);
              setIsCompetitiveModalOpen(true);
            }}
          />
        )}

        {/* Tab 6: Price Analytics */}
        {activeTab === 'PRICE_ANALYTICS' && (
          <PriceAnalyticsView
            items={itemTemplates}
            categories={itemCategories}
            onOpenRateModal={(it) => {
              setRateModalItem(it || null);
              setIsRateModalOpen(true);
            }}
            onOpenCompetitiveModal={(it) => {
              setCompetitiveModalItem(it || null);
              setIsCompetitiveModalOpen(true);
            }}
          />
        )}
      </div>

      {/* Category Modal (Create / Edit Category & Sub-Category) */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSave={saveItemCategory}
        categories={itemCategories}
        initialParentId={categoryModalParentId}
        categoryToEdit={categoryToEdit}
      />

      {/* Item Modal (Create / Edit BOQ Item) */}
      <ItemEditModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        onSave={saveItemTemplate}
        categories={itemCategories}
        itemToEdit={itemToEdit}
        initialCategoryId={itemModalCategoryId}
      />

      {/* Rate Update Modal */}
      <RateUpdateModal
        isOpen={isRateModalOpen}
        onClose={() => setIsRateModalOpen(false)}
        items={itemTemplates}
        selectedItem={rateModalItem}
        onSaveRate={handleSaveRateUpdate}
      />

      {/* Competitive Price Modal */}
      <CompetitivePriceModal
        isOpen={isCompetitiveModalOpen}
        onClose={() => setIsCompetitiveModalOpen(false)}
        items={itemTemplates}
        selectedItem={competitiveModalItem}
        onSaveCompetitivePrice={handleSaveCompetitivePrice}
      />

      {/* 11-Step Construction Variant & Pricing Engine Wizard */}
      {isVariantWizardOpen && (
        <VariantCreationWizard
          isOpen={isVariantWizardOpen}
          onClose={() => {
            setIsVariantWizardOpen(false);
            setVariantToEdit(undefined);
            setWizardPreSelectedItemId(undefined);
          }}
          categories={itemCategories}
          itemTemplates={itemTemplates}
          existingVariants={productVariants}
          initialVariant={variantToEdit}
          preSelectedItemId={wizardPreSelectedItemId}
          onSaveVariant={(variant) => {
            saveProductVariant(variant);
            setIsVariantWizardOpen(false);
            setVariantToEdit(undefined);
            setWizardPreSelectedItemId(undefined);
          }}
        />
      )}

      {/* Universal CSV & Excel Import Studio */}
      <DataImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        defaultEntity="boq_items"
        existingData={{
          itemTemplates,
          categories: itemCategories
        }}
        onCommitItemTemplates={(newItems) => {
          setItemTemplates(newItems);
        }}
      />
    </div>
  );
};
