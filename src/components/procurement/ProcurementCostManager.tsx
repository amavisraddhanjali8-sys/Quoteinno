import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Search, 
  Plus, 
  Layers, 
  Wrench, 
  Truck, 
  Users, 
  Box, 
  Folder, 
  Edit2, 
  Trash2, 
  X, 
  DollarSign, 
  SlidersHorizontal, 
  Package,
  History,
  BarChart3,
  Network,
  RotateCcw,
  Download,
  Upload,
  ExternalLink,
  List,
  Grid,
  MoreVertical,
  Barcode,
  Eye
} from 'lucide-react';
import { 
  ProcurementCostItem, 
  ProcurementCostClassification,
  CostCategoryDefinition,
  ItemSupplierRate, 
  Supplier
} from '../../types/procurement';
import { ProductVariant, ItemTemplate } from '../../types';
import { procurementCostService } from '../../services/procurementCostService';
import { cn } from '../../lib/utils';
import { ExportActions } from '../common/ExportActions';
import { downloadCSV, downloadPDFTable } from '../../services/dataExportService';

// Sub Views
import { CostCategoryTree } from './cost/CostCategoryTree';
import { CostCategoryModal } from './cost/CostCategoryModal';
import { CostItemEditModal } from './cost/CostItemEditModal';
import { VendorMoqMatrixView } from './cost/VendorMoqMatrixView';
import { ProductDependencyEngineView } from './cost/ProductDependencyEngineView';
import { CostVariantsSpecsView } from './cost/CostVariantsSpecsView';
import { CostRateHistoryView } from './cost/CostRateHistoryView';
import { CostIntelligenceAnalyticsView } from './cost/CostIntelligenceAnalyticsView';
import { ItemQRCodeModal } from './cost/ItemQRCodeModal';
import { ItemVendorPricingModal } from './cost/ItemVendorPricingModal';
import { getCostItemImageUrl, getCostItemFallbackSvg } from './cost/costItemImages';

export type CostManagerTab = 
  | 'CATEGORIES_ITEMS' 
  | 'VARIANTS_SPECS' 
  | 'VENDOR_MOQ_MATRIX' 
  | 'PRODUCT_DEPENDENCIES' 
  | 'PRICE_ANALYTICS' 
  | 'RATE_HISTORY';

export interface ProcurementCostManagerProps {
  projects?: any[];
  suppliers?: Supplier[];
  productVariants?: ProductVariant[];
  itemTemplates?: ItemTemplate[];
  onUpdateProductVariant?: (variant: any) => void;
  onNavigateToProject?: (projectId: string) => void;
  currency?: string;
  initialTab?: CostManagerTab;
  isStandalonePortal?: boolean;
}

export const ProcurementCostManager: React.FC<ProcurementCostManagerProps> = ({
  projects = [],
  suppliers = [],
  productVariants = [],
  itemTemplates = [],
  onUpdateProductVariant,
  onNavigateToProject,
  currency = 'LKR',
  initialTab = 'CATEGORIES_ITEMS'
}) => {
  // Master Data State
  const [costItems, setCostItems] = useState<ProcurementCostItem[]>(() => {
    const items = procurementCostService.getCostItems();
    if (projects.length > 0) {
      procurementCostService.syncWithForeignData(projects, itemTemplates, suppliers);
      return procurementCostService.getCostItems();
    }
    return items;
  });

  const [categories, setCategories] = useState<CostCategoryDefinition[]>(() => {
    return procurementCostService.getCategories();
  });

  // Active Main Tab
  const [activeTab, setActiveTab] = useState<CostManagerTab>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const refreshAll = () => {
    setCostItems(procurementCostService.getCostItems());
    setCategories(procurementCostService.getCategories());
  };

  // Filter States for Tab 1 (Categories & Items)
  const [selectedClassification, setSelectedClassification] = useState<'ALL' | ProcurementCostClassification>('ALL');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [projectFilter, setProjectFilter] = useState('ALL');
  const [supplierFilter, setSupplierFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Active' | 'Under Review' | 'Discontinued'>('ALL');
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  // View Mode: 'LIST' (Strictly One Line Row) vs 'CARDS' (1:1 Aspect Ratio)
  const [viewMode, setViewMode] = useState<'LIST' | 'CARDS'>('LIST');

  // Floating Action Menu state (rendered via React createPortal to body to guarantee complete visibility)
  const [cardMenuState, setCardMenuState] = useState<{
    item: ProcurementCostItem;
    top: number;
    left: number;
  } | null>(null);

  // Automatically close floating menu on window scroll, resize, or escape key
  useEffect(() => {
    if (!cardMenuState) return;

    const handleDismiss = () => {
      setCardMenuState(null);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setCardMenuState(null);
      }
    };

    window.addEventListener('resize', handleDismiss);
    window.addEventListener('scroll', handleDismiss, true);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', handleDismiss);
      window.removeEventListener('scroll', handleDismiss, true);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [cardMenuState]);

  // Open / toggle floating action menu
  const handleOpenActionMenu = (e: React.MouseEvent<HTMLButtonElement>, item: ProcurementCostItem) => {
    e.stopPropagation();
    e.preventDefault();

    if (cardMenuState?.item.id === item.id) {
      setCardMenuState(null);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const menuWidth = 205;
    const menuHeight = 295;

    // Horizontal positioning: align right edge of menu to right edge of button
    let left = rect.right - menuWidth;
    if (left < 10) {
      left = Math.max(10, rect.left);
    }
    if (left + menuWidth > window.innerWidth - 10) {
      left = window.innerWidth - menuWidth - 10;
    }

    // Vertical positioning: if room below, open downwards, else upwards
    let top = rect.bottom + 4;
    if (top + menuHeight > window.innerHeight - 10) {
      top = Math.max(10, rect.top - menuHeight - 4);
    }

    setCardMenuState({
      item,
      top,
      left
    });
  };

  // Quick Action Modals
  const [selectedPricingItem, setSelectedPricingItem] = useState<ProcurementCostItem | null>(null);
  const [selectedQrItem, setSelectedQrItem] = useState<ProcurementCostItem | null>(null);

  // Inspector Drawer State
  const [drawerItem, setDrawerItem] = useState<ProcurementCostItem | null>(null);

  // Modals State
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<ProcurementCostItem | null>(null);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<CostCategoryDefinition | null>(null);
  const [defaultModalClassification, setDefaultModalClassification] = useState<ProcurementCostClassification>('RAW_MATERIAL');

  // Filtered Items for Tab 1
  const filteredItems = useMemo(() => {
    return costItems.filter(item => {
      // Classification filter
      if (selectedClassification !== 'ALL') {
        const matchesClass = item.classification === selectedClassification ||
          (selectedClassification === 'RAW_MATERIAL' && item.category === 'Materials') ||
          (selectedClassification === 'OUTSIDE_SERVICE' && (item.category === 'Outside Services' || item.category === 'Services')) ||
          (selectedClassification === 'SUBCONTRACTOR_LABOUR' && item.category === 'Subcontractor Services') ||
          (selectedClassification === 'EQUIPMENT_PLANT' && item.category === 'Equipment & Plant') ||
          (selectedClassification === 'LOGISTICS_CONTRACT' && item.category === 'Logistics & Contracts');
        if (!matchesClass) return false;
      }

      // Category filter
      if (selectedCategoryId) {
        const catObj = categories.find(c => c.id === selectedCategoryId);
        if (catObj) {
          const matchCat = item.category === catObj.name || item.category === catObj.code;
          if (!matchCat) return false;
        }
      }

      // Subcategory filter
      if (selectedSubCategory && item.subCategory !== selectedSubCategory) {
        return false;
      }

      // Search Query
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matchQ = item.itemCode.toLowerCase().includes(q) ||
          item.name.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          (item.subCategory && item.subCategory.toLowerCase().includes(q)) ||
          (item.projectCode && item.projectCode.toLowerCase().includes(q)) ||
          (item.projectName && item.projectName.toLowerCase().includes(q)) ||
          (item.linkedQuoteNo && item.linkedQuoteNo.toLowerCase().includes(q)) ||
          (item.boqItemCode && item.boqItemCode.toLowerCase().includes(q)) ||
          item.variants.some(v => v.variantCode.toLowerCase().includes(q) || v.name.toLowerCase().includes(q)) ||
          item.supplierRates.some(sr => sr.supplierName.toLowerCase().includes(q) || sr.vendorCode.toLowerCase().includes(q));
        if (!matchQ) return false;
      }

      // Project filter
      if (projectFilter !== 'ALL' && item.projectId !== projectFilter && item.projectCode !== projectFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'ALL' && item.status !== statusFilter) {
        return false;
      }

      // Supplier filter
      if (supplierFilter !== 'ALL') {
        const hasSup = item.supplierRates.some(r => r.supplierId === supplierFilter) ||
          item.variants.some(v => v.supplierRates.some(r => r.supplierId === supplierFilter));
        if (!hasSup) return false;
      }

      return true;
    });
  }, [
    costItems, 
    categories, 
    selectedClassification, 
    selectedCategoryId, 
    selectedSubCategory, 
    searchQuery, 
    projectFilter, 
    statusFilter, 
    supplierFilter
  ]);

  // Aggregate Metrics for Header
  const metrics = useMemo(() => {
    const totalItems = costItems.length;
    const materialsCount = costItems.filter(i => i.category === 'Materials' || i.classification === 'RAW_MATERIAL').length;
    const outsideCount = costItems.filter(i => i.category === 'Outside Services' || i.classification === 'OUTSIDE_SERVICE').length;
    const subCount = costItems.filter(i => i.category === 'Subcontractor Services' || i.classification === 'SUBCONTRACTOR_LABOUR').length;
    const totalVariants = costItems.reduce((acc, i) => acc + (i.variants?.length || 0), 0);
    const totalSupplierRates = costItems.reduce((acc, i) => {
      let count = i.supplierRates?.length || 0;
      i.variants?.forEach(v => { count += v.supplierRates?.length || 0; });
      return acc + count;
    }, 0);
    const totalDependencies = costItems.reduce((acc, i) => acc + (i.linkedDependencies?.length || 0), 0);

    return {
      totalItems,
      materialsCount,
      outsideCount,
      subCount,
      totalVariants,
      totalSupplierRates,
      totalDependencies
    };
  }, [costItems]);

  // Handle Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Item Code (PK)',
      'Project Code (FK)',
      'Quote / BOQ (FK)',
      'Item Name',
      'Category',
      'Subcategory',
      'Primary Unit',
      'Benchmark Cost',
      'Variants Count',
      'Supplier Rates Count',
      'Dependencies Count',
      'Status'
    ];
    const rows = filteredItems.map(item => [
      `"${item.itemCode}"`,
      `"${item.projectCode || ''}"`,
      `"${item.linkedQuoteNo || item.boqItemCode || ''}"`,
      `"${item.name.replace(/"/g, '""')}"`,
      `"${item.category}"`,
      `"${item.subCategory || ''}"`,
      `"${item.primaryUnit}"`,
      item.benchmarkCost,
      item.variants.length,
      item.supplierRates.length,
      item.linkedDependencies?.length || 0,
      `"${item.status}"`
    ]);
    downloadCSV(`procurement-cost-items-${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
  };

  // Handle Export PDF
  const handleExportPDF = () => {
    const headers = ['Item Code (PK)', 'Project FK', 'Description', 'Category', 'Unit', 'Benchmark', 'MOQ Tiers', 'Status'];
    const rows = filteredItems.map(item => [
      item.itemCode,
      item.projectCode || 'Global',
      item.name,
      item.category,
      item.primaryUnit,
      `${currency} ${item.benchmarkCost.toLocaleString()}`,
      `${item.supplierRates.reduce((acc, r) => acc + (r.priceRanges?.length || 0), 0)} Tiers`,
      item.status
    ]);
    downloadPDFTable(
      `Procurement Master Cost Registry - ${currency}`,
      headers,
      rows,
      `procurement-cost-registry-${new Date().toISOString().split('T')[0]}.pdf`
    );
  };

  // JSON Database Export
  const handleExportDB = () => {
    const jsonStr = procurementCostService.exportDatabaseJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `procurement-cost-database-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // JSON Database Import
  const handleImportDB = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content && procurementCostService.importDatabaseJSON(content)) {
        refreshAll();
        alert('Procurement database imported successfully!');
      } else {
        alert('Invalid procurement database JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Reset to default seeds
  const handleResetToDefaults = () => {
    if (confirm('Reset entire procurement cost database to default seed records? All custom items, categories and links will be restored to factory baseline.')) {
      procurementCostService.resetToDefaults();
      refreshAll();
    }
  };

  // Delete cost item
  const handleDeleteCostItem = (id: string) => {
    if (confirm('Delete this procurement cost item? All associated variants and supplier rates will also be removed.')) {
      procurementCostService.deleteCostItem(id);
      refreshAll();
    }
  };

  // Category Badge Helper
  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'Materials':
        return { bg: 'bg-blue-50 text-blue-800 border-blue-200', icon: Box };
      case 'Services':
      case 'Outside Services':
        return { bg: 'bg-purple-50 text-purple-800 border-purple-200', icon: Wrench };
      case 'Subcontractor Services':
        return { bg: 'bg-orange-50 text-orange-800 border-orange-200', icon: Users };
      case 'Equipment & Plant':
        return { bg: 'bg-emerald-50 text-emerald-800 border-emerald-200', icon: Layers };
      case 'Logistics & Contracts':
        return { bg: 'bg-indigo-50 text-indigo-800 border-indigo-200', icon: Truck };
      default:
        return { bg: 'bg-slate-100 text-slate-800 border-slate-200', icon: Layers };
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-8.5rem)] h-full w-full bg-slate-100 rounded-xl border border-slate-200/80 shadow-xs overflow-hidden font-sans text-slate-800">
      {/* 1. Master Title Ribbon (Clean Enterprise Header matching BOQItemManager) */}
      <header className="px-4 sm:px-6 py-2.5 bg-white border-b border-slate-200/80 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <DollarSign size={17} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold text-slate-900 whitespace-nowrap">
                  Procurement Cost Items Hub
                </h1>
                <span className="text-[10px] font-bold bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full uppercase hidden sm:inline">
                  Master Rates & Product Dependencies
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate hidden md:block">
                Materials, outside services rendered, subcontractor labour contracts, multi-vendor MOQ range pricing & connected product BOM equations
              </p>
            </div>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {/* Database Reset & Backup */}
            <button
              onClick={handleResetToDefaults}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Reset to Factory Baseline Seeds"
            >
              <RotateCcw size={14} />
            </button>

            <button
              onClick={handleExportDB}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium cursor-pointer"
              title="Export Full Database JSON"
            >
              <Download size={12} />
              <span className="hidden sm:inline">Backup DB</span>
            </button>

            <label className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium cursor-pointer">
              <Upload size={12} />
              <span className="hidden sm:inline">Restore</span>
              <input type="file" accept=".json" onChange={handleImportDB} className="hidden" />
            </label>

            <ExportActions 
              onExportCSV={handleExportCSV}
              onExportPDF={handleExportPDF}
              labelCSV="CSV"
              labelPDF="PDF"
            />

            <button
              onClick={() => {
                setCategoryToEdit(null);
                setDefaultModalClassification(selectedClassification === 'ALL' ? 'RAW_MATERIAL' : selectedClassification);
                setIsCategoryModalOpen(true);
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold cursor-pointer"
            >
              <Plus size={13} />
              <span>Category</span>
            </button>

            <button
              onClick={() => {
                setItemToEdit(null);
                setIsItemModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus size={13} />
              <span>Add Cost Item</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Sub Portals Navigation Strip (Matching BOQItemManager Architecture) */}
      <nav className="px-4 sm:px-6 py-1.5 bg-slate-50 border-b border-slate-200/80 flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0 text-xs">
        {/* Tab 1 */}
        <button
          onClick={() => setActiveTab('CATEGORIES_ITEMS')}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap cursor-pointer",
            activeTab === 'CATEGORIES_ITEMS'
              ? "bg-white text-orange-600 shadow-2xs font-semibold border border-slate-200/80"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          )}
        >
          <Layers size={13} />
          <span>Categories & Cost Items</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600">
            {metrics.totalItems}
          </span>
        </button>

        {/* Tab 2 */}
        <button
          onClick={() => setActiveTab('VARIANTS_SPECS')}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap cursor-pointer",
            activeTab === 'VARIANTS_SPECS'
              ? "bg-white text-purple-600 shadow-2xs font-semibold border border-slate-200/80"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          )}
        >
          <Package size={13} />
          <span>Cost Item Variants & Specs</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-purple-50 text-purple-700">
            {metrics.totalVariants}
          </span>
        </button>

        {/* Tab 3 */}
        <button
          onClick={() => setActiveTab('VENDOR_MOQ_MATRIX')}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap cursor-pointer",
            activeTab === 'VENDOR_MOQ_MATRIX'
              ? "bg-white text-emerald-600 shadow-2xs font-semibold border border-slate-200/80"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          )}
        >
          <SlidersHorizontal size={13} />
          <span>Multi-Vendor MOQ Matrix</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700">
            {metrics.totalSupplierRates} Rates
          </span>
        </button>

        {/* Tab 4 */}
        <button
          onClick={() => setActiveTab('PRODUCT_DEPENDENCIES')}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap cursor-pointer",
            activeTab === 'PRODUCT_DEPENDENCIES'
              ? "bg-white text-blue-600 shadow-2xs font-semibold border border-slate-200/80"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          )}
        >
          <Network size={13} />
          <span>Product & Variant Dependency Engine</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-blue-50 text-blue-700">
            {metrics.totalDependencies} Links
          </span>
        </button>

        {/* Tab 5 */}
        <button
          onClick={() => setActiveTab('PRICE_ANALYTICS')}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap cursor-pointer",
            activeTab === 'PRICE_ANALYTICS'
              ? "bg-white text-indigo-600 shadow-2xs font-semibold border border-slate-200/80"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          )}
        >
          <BarChart3 size={13} />
          <span>Cost Intelligence</span>
        </button>

        {/* Tab 6 */}
        <button
          onClick={() => setActiveTab('RATE_HISTORY')}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap cursor-pointer",
            activeTab === 'RATE_HISTORY'
              ? "bg-white text-slate-900 shadow-2xs font-semibold border border-slate-200/80"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          )}
        >
          <History size={13} />
          <span>Rate History & Audit</span>
        </button>
      </nav>

      {/* 3. Main Viewport Content Area */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 bg-slate-100 custom-scrollbar">
        {/* TAB 1: CATEGORIES & COST ITEMS */}
        {activeTab === 'CATEGORIES_ITEMS' && (
          <div className="flex flex-col lg:flex-row gap-3 items-start">
            {/* Category & Scope Tree Sidebar */}
            <CostCategoryTree 
              categories={categories}
              costItems={costItems}
              selectedClassification={selectedClassification}
              selectedCategoryId={selectedCategoryId}
              selectedSubCategory={selectedSubCategory}
              onSelectClassification={setSelectedClassification}
              onSelectCategory={setSelectedCategoryId}
              onSelectSubCategory={setSelectedSubCategory}
              onOpenNewCategoryModal={(defClass) => {
                setCategoryToEdit(null);
                setDefaultModalClassification(defClass || 'RAW_MATERIAL');
                setIsCategoryModalOpen(true);
              }}
              onEditCategory={(cat) => {
                setCategoryToEdit(cat);
                setIsCategoryModalOpen(true);
              }}
              onDeleteCategory={(catId) => {
                procurementCostService.deleteCategory(catId);
                refreshAll();
              }}
            />

            {/* Right Main Table & Grid */}
            <div className="flex-1 w-full space-y-3 min-w-0">
              {/* KPI Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                <div className="bg-white border border-slate-200/90 rounded-xl p-2.5 shadow-2xs">
                  <div className="text-[10px] font-semibold text-slate-500 flex items-center justify-between">
                    <span>Total Cost Items</span>
                    <Box size={13} className="text-orange-500" />
                  </div>
                  <div className="text-xl font-bold font-mono text-slate-900 mt-1">{metrics.totalItems}</div>
                  <div className="text-[9px] text-slate-400">All registered cost lines</div>
                </div>

                <div className="bg-white border border-slate-200/90 rounded-xl p-2.5 shadow-2xs">
                  <div className="text-[10px] font-semibold text-blue-700 flex items-center justify-between">
                    <span>Materials</span>
                    <Package size={13} className="text-blue-500" />
                  </div>
                  <div className="text-xl font-bold font-mono text-blue-900 mt-1">{metrics.materialsCount}</div>
                  <div className="text-[9px] text-slate-400">Extrusions, glass, steel</div>
                </div>

                <div className="bg-white border border-slate-200/90 rounded-xl p-2.5 shadow-2xs">
                  <div className="text-[10px] font-semibold text-purple-700 flex items-center justify-between">
                    <span>Outside Services</span>
                    <Wrench size={13} className="text-purple-500" />
                  </div>
                  <div className="text-xl font-bold font-mono text-purple-900 mt-1">{metrics.outsideCount}</div>
                  <div className="text-[9px] text-slate-400">Powder coat, anodize, CNC</div>
                </div>

                <div className="bg-white border border-slate-200/90 rounded-xl p-2.5 shadow-2xs">
                  <div className="text-[10px] font-semibold text-orange-700 flex items-center justify-between">
                    <span>Subcontractors</span>
                    <Users size={13} className="text-orange-500" />
                  </div>
                  <div className="text-xl font-bold font-mono text-orange-900 mt-1">{metrics.subCount}</div>
                  <div className="text-[9px] text-slate-400">Installation & rig gangs</div>
                </div>

                <div className="bg-white border border-slate-200/90 rounded-xl p-2.5 shadow-2xs">
                  <div className="text-[10px] font-semibold text-emerald-700 flex items-center justify-between">
                    <span>Vendor Rates</span>
                    <SlidersHorizontal size={13} className="text-emerald-500" />
                  </div>
                  <div className="text-xl font-bold font-mono text-emerald-900 mt-1">{metrics.totalSupplierRates}</div>
                  <div className="text-[9px] text-slate-400">Multi-tier MOQ brackets</div>
                </div>

                <div className="bg-white border border-slate-200/90 rounded-xl p-2.5 shadow-2xs">
                  <div className="text-[10px] font-semibold text-blue-700 flex items-center justify-between">
                    <span>BOM Links</span>
                    <Network size={13} className="text-blue-500" />
                  </div>
                  <div className="text-xl font-bold font-mono text-blue-900 mt-1">{metrics.totalDependencies}</div>
                  <div className="text-[9px] text-slate-400">Connected product variants</div>
                </div>
              </div>

              {/* Filter Toolbar */}
              <div className="bg-white border border-slate-200/90 rounded-xl p-2.5 shadow-2xs flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-[280px] flex-wrap">
                  {/* Search */}
                  <div className="relative flex-1 min-w-[180px] max-w-sm">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search Item Code (PK), Project (FK), Name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200/90 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  {/* Project Filter */}
                  <div className="flex items-center gap-1.5 bg-orange-50/70 px-2 py-1 rounded-lg border border-orange-200/80">
                    <Folder size={12} className="text-orange-500 shrink-0" />
                    <select
                      value={projectFilter}
                      onChange={(e) => setProjectFilter(e.target.value)}
                      className="bg-transparent text-xs font-semibold text-orange-900 outline-none cursor-pointer max-w-[150px] truncate"
                    >
                      <option value="ALL">All Projects (FK)</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>
                          [{p.projectCode || p.id.slice(0, 8)}] {p.projectName || p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Status Filter */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-none cursor-pointer"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Discontinued">Discontinued</option>
                  </select>

                  {/* Supplier Filter */}
                  <select
                    value={supplierFilter}
                    onChange={(e) => setSupplierFilter(e.target.value)}
                    className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-none cursor-pointer max-w-[140px] truncate"
                  >
                    <option value="ALL">All Vendors ({suppliers.length})</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] font-mono text-slate-500">
                    <strong>{filteredItems.length}</strong> items
                  </span>

                  {/* Layout View Toggle (1:1 Cards vs List View) */}
                  <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                    <button
                      onClick={() => setViewMode('LIST')}
                      className={cn(
                        "flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors cursor-pointer",
                        viewMode === 'LIST'
                          ? "bg-white text-slate-900 shadow-2xs font-semibold"
                          : "text-slate-500 hover:text-slate-800"
                      )}
                      title="Single-line Row List View"
                    >
                      <List size={13} />
                      <span>List</span>
                    </button>
                    <button
                      onClick={() => setViewMode('CARDS')}
                      className={cn(
                        "flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors cursor-pointer",
                        viewMode === 'CARDS'
                          ? "bg-white text-slate-900 shadow-2xs font-semibold"
                          : "text-slate-500 hover:text-slate-800"
                      )}
                      title="1:1 Aspect Ratio Cards View"
                    >
                      <Grid size={13} />
                      <span>Cards (1:1)</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* VIEW: CARDS VIEW vs LIST VIEW */}
              {viewMode === 'CARDS' ? (
                /* CARDS VIEW: 1:1 scale image, item code and menu button ONLY */
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2.5">
                  {filteredItems.length === 0 ? (
                    <div className="col-span-full bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-400">
                      No procurement cost items found matching criteria.
                    </div>
                  ) : (
                    filteredItems.map(item => {
                      const imgUrl = getCostItemImageUrl(item);
                      const isMenuOpen = cardMenuState?.item.id === item.id;

                      return (
                        <div
                          key={item.id}
                          className={cn(
                            "bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs hover:border-orange-300 transition-all flex flex-col group",
                            isMenuOpen ? "ring-2 ring-orange-400/50 border-orange-400" : ""
                          )}
                        >
                          {/* 1:1 Scale Image with reliable fallback & quick details view */}
                          <div 
                            className="w-full aspect-square bg-slate-100 relative overflow-hidden rounded-t-xl cursor-pointer"
                            onClick={() => setDrawerItem(item)}
                            title={`Click to inspect specs: ${item.name}`}
                          >
                            <img
                              src={imgUrl}
                              alt={item.itemCode}
                              onError={(e) => {
                                e.currentTarget.src = getCostItemFallbackSvg(item.category || item.classification, item.name);
                              }}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                            {/* Category indicator badge in corner */}
                            <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-black/60 backdrop-blur-xs text-[8.5px] font-medium text-white rounded pointer-events-none">
                              {item.category === 'Materials' ? 'Material' : item.category === 'Outside Services' ? 'Service' : item.category === 'Subcontractor Services' ? 'Labour' : item.category}
                            </span>
                          </div>

                          {/* Card Bottom Bar: Minimized Product Code & Menu Button */}
                          <div className="p-1.5 sm:p-2 bg-white flex items-center justify-between gap-1 border-t border-slate-100 rounded-b-xl min-w-0">
                            <span 
                              className="font-mono text-[9px] font-semibold text-slate-700 bg-slate-50 border border-slate-200/80 px-1 py-0.5 rounded truncate max-w-[calc(100%-24px)] block tracking-tight select-all"
                              title={`${item.itemCode} - ${item.name}`}
                            >
                              {item.itemCode}
                            </span>

                            {/* Menu Button */}
                            <button
                              onClick={(e) => handleOpenActionMenu(e, item)}
                              className={cn(
                                "p-1 rounded transition-colors cursor-pointer shrink-0",
                                isMenuOpen 
                                  ? "bg-orange-100 text-orange-700" 
                                  : "text-slate-400 hover:text-slate-800 hover:bg-slate-100"
                              )}
                              title="Features menu"
                              aria-label="Features menu"
                            >
                              <MoreVertical size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              ) : (
                /* LIST VIEW: Strictly One Line Row for Each Record */
                <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-600 uppercase tracking-wider select-none whitespace-nowrap">
                          <th className="py-2.5 px-3">Item Code (PK)</th>
                          <th className="py-2.5 px-3">Project (FK)</th>
                          <th className="py-2.5 px-3">Cost Item Name</th>
                          <th className="py-2.5 px-3">Category</th>
                          <th className="py-2.5 px-3 text-center">Unit</th>
                          <th className="py-2.5 px-3 text-right">Benchmark</th>
                          <th className="py-2.5 px-3 text-right">Best Quote</th>
                          <th className="py-2.5 px-3 text-center">Variants</th>
                          <th className="py-2.5 px-3">Vendor Pricing Matrix & MOQ</th>
                          <th className="py-2.5 px-3 text-center">Product Links</th>
                          <th className="py-2.5 px-3 text-center">Status</th>
                          <th className="py-2.5 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredItems.length === 0 ? (
                          <tr>
                            <td colSpan={12} className="py-8 text-center text-slate-400">
                              No procurement cost items found matching criteria.
                            </td>
                          </tr>
                        ) : (
                          filteredItems.map(item => {
                            const catBadge = getCategoryBadge(item.category);
                            const CatIcon = catBadge.icon;
                            const isExpanded = expandedItemId === item.id;
                            const imgUrl = getCostItemImageUrl(item);

                            const allRates: ItemSupplierRate[] = [
                              ...item.supplierRates,
                              ...item.variants.flatMap(v => v.supplierRates)
                            ];

                            const lowestRate = allRates.length > 0 
                              ? Math.min(...allRates.map(r => r.baseRate))
                              : null;

                            const primaryRate = allRates[0];
                            const priceRanges = primaryRate?.priceRanges || [];
                            const depCount = item.linkedDependencies?.length || 0;

                            return (
                              <React.Fragment key={item.id}>
                                <tr 
                                  className={cn(
                                    "hover:bg-slate-50/70 transition-colors whitespace-nowrap h-11",
                                    isExpanded ? "bg-orange-50/20" : ""
                                  )}
                                >
                                  {/* PK: Item Code with 1:1 mini thumb */}
                                  <td className="py-2 px-3">
                                    <div className="flex items-center gap-1.5">
                                      <img 
                                        src={imgUrl} 
                                        alt="" 
                                        onError={(e) => {
                                          e.currentTarget.src = getCostItemFallbackSvg(item.category || item.classification, item.name);
                                        }}
                                        className="w-6 h-6 rounded aspect-square object-cover border border-slate-200 shrink-0" 
                                      />
                                      <button
                                        onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                                        className="font-mono font-semibold text-[10px] text-slate-800 bg-slate-100 hover:bg-orange-50 hover:text-orange-600 px-1.5 py-0.5 rounded border border-slate-200/80 inline-flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                                        title="Click to toggle quick inline rates preview"
                                      >
                                        <CatIcon size={10} className="text-orange-500 shrink-0" />
                                        <span>PK: {item.itemCode}</span>
                                      </button>
                                    </div>
                                  </td>

                                  {/* FK: Project */}
                                  <td className="py-2 px-3">
                                    {item.projectCode || item.projectId ? (
                                      <button
                                        onClick={() => {
                                          if (onNavigateToProject && item.projectId) {
                                            onNavigateToProject(item.projectId);
                                          } else {
                                            setProjectFilter(item.projectId || item.projectCode || 'ALL');
                                          }
                                        }}
                                        className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-orange-700 bg-orange-50 hover:bg-orange-100 px-2 py-0.5 rounded border border-orange-200 transition-colors cursor-pointer"
                                        title={`Project: ${item.projectName || item.projectCode}`}
                                      >
                                        <Folder size={10} className="text-orange-500 shrink-0" />
                                        <span>FK: {item.projectCode || item.projectId?.slice(0, 8)}</span>
                                      </button>
                                    ) : (
                                      <span className="text-[10px] text-slate-400 italic">FK: Global</span>
                                    )}
                                  </td>

                                  {/* Name (Strictly Single Line Truncate) */}
                                  <td className="py-2 px-3 max-w-[210px]">
                                    <button
                                      onClick={() => setDrawerItem(item)}
                                      className="font-bold text-slate-900 hover:text-orange-600 transition-colors truncate block text-left text-xs cursor-pointer w-full"
                                      title={item.name}
                                    >
                                      {item.name}
                                    </button>
                                  </td>

                                  {/* Category Badge */}
                                  <td className="py-2 px-3">
                                    <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border inline-flex items-center gap-1", catBadge.bg)}>
                                      <CatIcon size={10} />
                                      <span>{item.category}</span>
                                    </span>
                                  </td>

                                  {/* Primary Unit */}
                                  <td className="py-2 px-3 text-center font-mono font-medium text-slate-600 text-xs">
                                    {item.primaryUnit}
                                  </td>

                                  {/* Benchmark Cost (Single Line) */}
                                  <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 text-xs whitespace-nowrap">
                                    {currency} {item.benchmarkCost.toLocaleString()}
                                  </td>

                                  {/* Best Vendor Rate (Single Line) */}
                                  <td className="py-2 px-3 text-right font-mono text-xs whitespace-nowrap">
                                    {lowestRate !== null ? (
                                      <span className="font-bold text-emerald-700">
                                        {currency} {lowestRate.toLocaleString()}
                                        {item.benchmarkCost > lowestRate && (
                                          <span className="ml-1 text-[10px] text-emerald-600 font-semibold">
                                            (-{Math.round(((item.benchmarkCost - lowestRate) / item.benchmarkCost) * 100)}%)
                                          </span>
                                        )}
                                      </span>
                                    ) : (
                                      <span className="text-slate-400 text-[10px] italic">No quotes</span>
                                    )}
                                  </td>

                                  {/* Variants Count */}
                                  <td className="py-2 px-3 text-center">
                                    <button
                                      onClick={() => setActiveTab('VARIANTS_SPECS')}
                                      className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                                      title="Open Cost Variants tab"
                                    >
                                      <Package size={11} className="text-slate-500" />
                                      <span>{item.variants.length}</span>
                                    </button>
                                  </td>

                                  {/* Multi-Vendor Pricing Matrix & MOQ Ranges Button */}
                                  <td className="py-2 px-3 whitespace-nowrap">
                                    <button
                                      onClick={() => setSelectedPricingItem(item)}
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer shadow-2xs"
                                      title="Open Multi-Vendor Pricing Matrix & MOQ Ranges"
                                    >
                                      <SlidersHorizontal size={11} className="text-emerald-600" />
                                      <span>{allRates.length} Vendors</span>
                                      <span className="text-[10px] text-emerald-600 font-mono">
                                        ({priceRanges.length > 0 ? `${priceRanges.length} MOQ Tiers` : 'Matrix'})
                                      </span>
                                    </button>
                                  </td>

                                  {/* Linked Product Dependencies */}
                                  <td className="py-2 px-3 text-center whitespace-nowrap">
                                    <button
                                      onClick={() => {
                                        setActiveTab('PRODUCT_DEPENDENCIES');
                                      }}
                                      className={cn(
                                        "inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full border cursor-pointer transition-colors",
                                        depCount > 0
                                          ? 'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100'
                                          : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'
                                      )}
                                      title="View connected product/variant dependencies"
                                    >
                                      <Network size={10} />
                                      <span>{depCount} BOMs</span>
                                    </button>
                                  </td>

                                  {/* Status */}
                                  <td className="py-2 px-3 text-center whitespace-nowrap">
                                    <span className={cn(
                                      "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                                      item.status === 'Active' ? 'bg-emerald-50 text-emerald-800' :
                                      item.status === 'Under Review' ? 'bg-amber-50 text-amber-800' :
                                      'bg-red-50 text-red-800'
                                    )}>
                                      {item.status}
                                    </span>
                                  </td>

                                  {/* Actions */}
                                  <td className="py-2 px-3 text-right whitespace-nowrap">
                                    <div className="flex items-center justify-end gap-1">
                                      {/* View Details Drawer */}
                                      <button
                                        onClick={() => setDrawerItem(item)}
                                        className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded cursor-pointer transition-colors"
                                        title="View Details"
                                      >
                                        <Eye size={12} />
                                      </button>
                                      {/* Multi-Vendor Pricing Matrix Modal */}
                                      <button
                                        onClick={() => setSelectedPricingItem(item)}
                                        className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded cursor-pointer transition-colors"
                                        title="Vendor Pricing"
                                      >
                                        <SlidersHorizontal size={12} />
                                      </button>
                                      {/* Barcode & Smart Tag Modal */}
                                      <button
                                        onClick={() => setSelectedQrItem(item)}
                                        className="p-1 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded cursor-pointer transition-colors"
                                        title="Barcode & Tag"
                                      >
                                        <Barcode size={12} />
                                      </button>
                                      {/* Edit */}
                                      <button
                                        onClick={() => {
                                          setItemToEdit(item);
                                          setIsItemModalOpen(true);
                                        }}
                                        className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded cursor-pointer transition-colors"
                                        title="Edit Item"
                                      >
                                        <Edit2 size={12} />
                                      </button>
                                      {/* Delete */}
                                      <button
                                        onClick={() => handleDeleteCostItem(item.id)}
                                        className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded cursor-pointer transition-colors"
                                        title="Delete Item"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                      {/* All Features Menu Dropdown Trigger */}
                                      <button
                                        onClick={(e) => handleOpenActionMenu(e, item)}
                                        className={cn(
                                          "p-1 rounded cursor-pointer transition-colors",
                                          cardMenuState?.item.id === item.id
                                            ? "bg-orange-100 text-orange-700"
                                            : "text-slate-400 hover:text-slate-800 hover:bg-slate-100"
                                        )}
                                        title="Features menu"
                                      >
                                        <MoreVertical size={12} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>

                                {/* Expanded Row: Quick Inline Rate Tiers */}
                                {isExpanded && (
                                  <tr className="bg-slate-50/80">
                                    <td colSpan={12} className="p-4 border-y border-slate-200">
                                      <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-2">
                                            <Package size={14} className="text-orange-500" />
                                            <h4 className="font-bold text-slate-900 text-xs">
                                              Approved Multi-Vendor Schedule & MOQ Ranges for {item.name}
                                            </h4>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <button
                                              onClick={() => setSelectedPricingItem(item)}
                                              className="text-xs font-semibold text-orange-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
                                            >
                                              <span>Open Full Interactive Matrix</span>
                                              <ExternalLink size={11} />
                                            </button>
                                          </div>
                                        </div>

                                        {/* Vendors schedule table */}
                                        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                                          <div className="p-2 divide-y divide-slate-100">
                                            {allRates.length === 0 ? (
                                              <div className="p-3 text-slate-400 text-xs text-center">
                                                No approved supplier rates registered yet. Click "Edit" or open "Vendor Pricing" to add quotes.
                                              </div>
                                            ) : (
                                              allRates.map(rate => (
                                                <div key={rate.id} className="py-2 flex items-center justify-between text-xs flex-wrap gap-2">
                                                  <div>
                                                    <div className="font-bold text-slate-900">{rate.supplierName} ({rate.vendorCode})</div>
                                                    <div className="text-[10px] text-slate-400">
                                                      Base MOQ: {rate.minimumOrderQty} {item.primaryUnit} • Lead: {rate.leadTimeDays}d • Rating: {rate.rating}★
                                                    </div>
                                                  </div>

                                                  <div className="flex items-center gap-1.5 flex-wrap">
                                                    {(rate.priceRanges || []).map((t, idx) => (
                                                      <span key={idx} className="font-mono text-[10px] bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-slate-800">
                                                        {t.minQty}+: <strong>{currency} {t.unitPrice}</strong>
                                                      </span>
                                                    ))}
                                                  </div>
                                                </div>
                                              ))
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: COST ITEM VARIANTS & SPECS */}
        {activeTab === 'VARIANTS_SPECS' && (
          <CostVariantsSpecsView 
            costItems={costItems}
            currency={currency}
            onRefreshItems={refreshAll}
          />
        )}

        {/* TAB 3: MULTI-VENDOR MOQ MATRIX */}
        {activeTab === 'VENDOR_MOQ_MATRIX' && (
          <VendorMoqMatrixView 
            costItems={costItems}
            suppliers={suppliers}
            currency={currency}
            onRefreshItems={refreshAll}
            initialSelectedItemId={expandedItemId || costItems[0]?.id}
          />
        )}

        {/* TAB 4: PRODUCT & VARIANT DEPENDENCY ENGINE */}
        {activeTab === 'PRODUCT_DEPENDENCIES' && (
          <ProductDependencyEngineView 
            costItems={costItems}
            productVariants={productVariants}
            itemTemplates={itemTemplates}
            onUpdateProductVariant={onUpdateProductVariant}
            currency={currency}
            onRefreshItems={refreshAll}
          />
        )}

        {/* TAB 5: COST INTELLIGENCE */}
        {activeTab === 'PRICE_ANALYTICS' && (
          <CostIntelligenceAnalyticsView 
            costItems={costItems}
            suppliers={suppliers}
            currency={currency}
          />
        )}

        {/* TAB 6: RATE HISTORY & AUDIT */}
        {activeTab === 'RATE_HISTORY' && (
          <CostRateHistoryView 
            costItems={costItems}
            suppliers={suppliers}
            currency={currency}
            onRefreshItems={refreshAll}
          />
        )}
      </div>

      {/* MODAL 1: Create / Edit Cost Item */}
      {isItemModalOpen && (
        <CostItemEditModal
          isOpen={isItemModalOpen}
          onClose={() => setIsItemModalOpen(false)}
          itemToEdit={itemToEdit}
          categories={categories}
          suppliers={suppliers}
          projects={projects}
          currency={currency}
          onItemSaved={() => {
            refreshAll();
            setIsItemModalOpen(false);
          }}
        />
      )}

      {/* MODAL 2: Create / Edit Category & Subcategories */}
      {isCategoryModalOpen && (
        <CostCategoryModal 
          isOpen={isCategoryModalOpen}
          onClose={() => setIsCategoryModalOpen(false)}
          categoryToEdit={categoryToEdit}
          defaultClassification={defaultModalClassification}
          onCategorySaved={() => {
            refreshAll();
            setIsCategoryModalOpen(false);
          }}
        />
      )}

      {/* DRAWER: Detail Inspector */}
      {drawerItem && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-2xs">
          <div 
            className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Box size={16} className="text-orange-500" />
                <h3 className="font-bold text-sm">Cost Item Inspector</h3>
              </div>
              <button 
                onClick={() => setDrawerItem(null)} 
                className="text-slate-400 hover:text-white p-1 rounded cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-orange-900 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                    PK: {drawerItem.itemCode}
                  </span>
                  <span className="font-semibold text-slate-600">{drawerItem.category}</span>
                </div>
                <h2 className="text-base font-bold text-slate-900">{drawerItem.name}</h2>
                <p className="text-slate-500 text-[11px]">{drawerItem.description}</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Benchmark Rate</span>
                  <span className="font-mono font-bold text-sm text-slate-900">
                    {currency} {drawerItem.benchmarkCost.toLocaleString()} / {drawerItem.primaryUnit}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Scope Classification</span>
                  <span className="font-semibold text-xs text-slate-800">{drawerItem.classification || 'RAW_MATERIAL'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Specification Standard</span>
                  <span className="font-mono text-xs text-slate-700">{drawerItem.specificationRef || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Barcode</span>
                  <span className="font-mono text-xs text-slate-700">{drawerItem.barcode || 'N/A'}</span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-2 uppercase text-[10px] tracking-wider">
                  Product Dependencies ({drawerItem.linkedDependencies?.length || 0})
                </h4>
                <div className="space-y-1.5">
                  {(drawerItem.linkedDependencies || []).map(dep => (
                    <div key={dep.id} className="p-2.5 rounded-lg border border-slate-200 bg-white">
                      <div className="font-bold text-slate-800">{dep.targetName}</div>
                      <div className="text-[10px] text-slate-500 font-mono flex items-center justify-between mt-1">
                        <span>Role: {dep.bomRole}</span>
                        <span>Equation: {dep.usageFormula || `${dep.unitConsumption} units`}</span>
                      </div>
                    </div>
                  ))}
                  {(!drawerItem.linkedDependencies || drawerItem.linkedDependencies.length === 0) && (
                    <div className="text-slate-400 text-xs italic">No product dependencies linked to this cost item yet.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: QR Code & Material Tag Modal */}
      <ItemQRCodeModal
        isOpen={!!selectedQrItem}
        onClose={() => setSelectedQrItem(null)}
        item={selectedQrItem}
      />

      {/* MODAL 4: Multi-Vendor Pricing Matrix & MOQ Ranges Modal */}
      <ItemVendorPricingModal
        isOpen={!!selectedPricingItem}
        onClose={() => setSelectedPricingItem(null)}
        item={selectedPricingItem}
        currency={currency}
        onRefresh={refreshAll}
      />

      {/* FLOATING ACTION MENU VIA PORTAL (Immune to all container overflow, scroll clipping, and stacking bugs) */}
      {cardMenuState && createPortal(
        <>
          {/* Global backdrop click catcher */}
          <div 
            className="fixed inset-0 z-[9998] cursor-default bg-transparent"
            onClick={() => setCardMenuState(null)}
            onContextMenu={(e) => {
              e.preventDefault();
              setCardMenuState(null);
            }}
          />

          {/* Floating Features Menu */}
          <div
            style={{
              position: 'fixed',
              top: `${cardMenuState.top}px`,
              left: `${cardMenuState.left}px`,
              width: '210px'
            }}
            className="z-[9999] bg-white rounded-xl shadow-2xl border border-slate-200 py-1 animate-in fade-in zoom-in-95 duration-100 text-xs overflow-hidden select-none"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Minimized Product Code Header */}
            <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/90">
              <span className="font-mono text-[9px] font-semibold text-slate-700 truncate max-w-[155px]" title={cardMenuState.item.itemCode}>
                {cardMenuState.item.itemCode}
              </span>
              <button
                onClick={() => setCardMenuState(null)}
                className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer transition-colors"
                title="Close"
              >
                <X size={12} />
              </button>
            </div>

            {/* List of Features in Simple Words (No Descriptions) */}
            <div className="py-1">
              {/* 1. View Details */}
              <button
                onClick={() => {
                  setDrawerItem(cardMenuState.item);
                  setCardMenuState(null);
                }}
                className="w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-100 hover:text-slate-900 flex items-center gap-2.5 transition-colors cursor-pointer text-xs font-medium"
              >
                <Eye size={13} className="text-blue-500 shrink-0" />
                <span>View Details</span>
              </button>

              {/* 2. Vendor Pricing */}
              <button
                onClick={() => {
                  setSelectedPricingItem(cardMenuState.item);
                  setCardMenuState(null);
                }}
                className="w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-100 hover:text-slate-900 flex items-center gap-2.5 transition-colors cursor-pointer text-xs font-medium"
              >
                <SlidersHorizontal size={13} className="text-emerald-500 shrink-0" />
                <span>Vendor Pricing</span>
              </button>

              {/* 3. Product Dependencies */}
              <button
                onClick={() => {
                  setActiveTab('PRODUCT_DEPENDENCIES');
                  setCardMenuState(null);
                }}
                className="w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-100 hover:text-slate-900 flex items-center gap-2.5 transition-colors cursor-pointer text-xs font-medium"
              >
                <Network size={13} className="text-indigo-500 shrink-0" />
                <span>Product Dependencies</span>
              </button>

              {/* 4. Barcode & Tag */}
              <button
                onClick={() => {
                  setSelectedQrItem(cardMenuState.item);
                  setCardMenuState(null);
                }}
                className="w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-100 hover:text-slate-900 flex items-center gap-2.5 transition-colors cursor-pointer text-xs font-medium"
              >
                <Barcode size={13} className="text-purple-600 shrink-0" />
                <span>Barcode & Tag</span>
              </button>

              {/* 5. Rate History */}
              <button
                onClick={() => {
                  setActiveTab('RATE_HISTORY');
                  setCardMenuState(null);
                }}
                className="w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-100 hover:text-slate-900 flex items-center gap-2.5 transition-colors cursor-pointer text-xs font-medium"
              >
                <History size={13} className="text-amber-500 shrink-0" />
                <span>Rate History</span>
              </button>

              <div className="border-t border-slate-100 my-1" />

              {/* 6. Edit Item */}
              <button
                onClick={() => {
                  setItemToEdit(cardMenuState.item);
                  setIsItemModalOpen(true);
                  setCardMenuState(null);
                }}
                className="w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-100 hover:text-slate-900 flex items-center gap-2.5 transition-colors cursor-pointer text-xs font-medium"
              >
                <Edit2 size={13} className="text-slate-500 shrink-0" />
                <span>Edit Item</span>
              </button>

              {/* 7. Delete Item */}
              <button
                onClick={() => {
                  const idToDelete = cardMenuState.item.id;
                  setCardMenuState(null);
                  handleDeleteCostItem(idToDelete);
                }}
                className="w-full px-3 py-1.5 text-left text-red-600 hover:bg-red-50 hover:text-red-700 flex items-center gap-2.5 transition-colors cursor-pointer text-xs font-medium"
              >
                <Trash2 size={13} className="text-red-500 shrink-0" />
                <span>Delete Item</span>
              </button>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
};
