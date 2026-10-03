import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  ProductVariant, ItemCategory, ItemTemplate, Project 
} from '../types';
import { 
  Search, Plus, Grid, List, Copy, Check,
  Edit2, Trash2, Calculator, FileText, History, 
  AlertTriangle, X, Layers, Scale, Barcode
} from 'lucide-react';
import { cn } from '../lib/utils';
import { evaluatePriceHealth } from '../services/bomPricingService';
import { ExportActions } from './common/ExportActions';
import { exportVariantsCSV, exportVariantsPDF } from '../services/dataExportService';
import { VariantPriceAnalyticsView } from './variants/VariantPriceAnalyticsView';

interface VariantListViewProps {
  variants: ProductVariant[];
  categories: ItemCategory[];
  itemTemplates: ItemTemplate[];
  projects?: Project[];
  onAddNewVariant: (preSelectedItemId?: string) => void;
  onEditVariant: (variant: ProductVariant) => void;
  onDeleteVariant: (id: string) => void;
  onApproveVariant?: (variantId: string) => void;
  onUpdatePricing?: (variant: ProductVariant) => void;
}

export const VariantListView: React.FC<VariantListViewProps> = ({
  variants,
  categories: _categories,
  itemTemplates,
  projects,
  onAddNewVariant,
  onEditVariant,
  onDeleteVariant,
  onApproveVariant,
  onUpdatePricing
}) => {
  // --- Filtering & Sorting ---
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItemId, setSelectedItemId] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'DRAFT' | 'REQUIRES_APPROVAL'>('ALL');
  const [techStatusFilter, setTechStatusFilter] = useState<'ALL' | 'COMPATIBLE' | 'REQUIRES_APPROVAL' | 'NOT_COMPATIBLE'>('ALL');
  const [sortBy, setSortBy] = useState<'CODE' | 'NAME' | 'PRICE_ASC' | 'PRICE_DESC' | 'MARGIN_DESC' | 'COST_DESC'>('CODE');
  const [viewMode, setViewMode] = useState<'TABLE' | 'CARDS'>('TABLE');

  // Multi-select for Matrix Comparison
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  // Active Modals
  const [activeSpecModalVariant, setActiveSpecModalVariant] = useState<ProductVariant | null>(null);
  const [activeBOMModalVariant, setActiveBOMModalVariant] = useState<ProductVariant | null>(null);
  const [activeHistoryModalVariant, setActiveHistoryModalVariant] = useState<ProductVariant | null>(null);
  const [activeQuickPriceVariant, setActiveQuickPriceVariant] = useState<ProductVariant | null>(null);

  // Quick Price Edit state
  const [quickPrice, setQuickPrice] = useState<number>(0);
  const [quickMargin, setQuickMargin] = useState<number>(0);

  // Prevent background body scroll when any variant full-screen modal or analytics is open
  useEffect(() => {
    const isAnyModalOpen = Boolean(
      activeSpecModalVariant ||
      activeBOMModalVariant ||
      activeHistoryModalVariant ||
      activeQuickPriceVariant ||
      isCompareOpen
    );
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [
    activeSpecModalVariant,
    activeBOMModalVariant,
    activeHistoryModalVariant,
    activeQuickPriceVariant,
    isCompareOpen
  ]);

  // Copied code feedback
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Unique Product Items for filtering with variant counts (Category-free)
  const availableProductItems = useMemo(() => {
    const itemMap = new Map<string, { id: string; name: string; count: number }>();

    // Seed from itemTemplates
    itemTemplates.forEach(t => {
      itemMap.set(t.id, {
        id: t.id,
        name: t.name,
        count: 0
      });
    });

    // Count and add any variant item references
    variants.forEach(v => {
      const key = v.itemId || v.itemName;
      if (!key) return;
      if (itemMap.has(key)) {
        itemMap.get(key)!.count += 1;
      } else {
        let found = false;
        for (const [, val] of itemMap.entries()) {
          if (val.id === v.itemId || val.name.toLowerCase() === (v.itemName || '').toLowerCase()) {
            val.count += 1;
            found = true;
            break;
          }
        }
        if (!found) {
          itemMap.set(key, {
            id: v.itemId || key,
            name: v.itemName || key,
            count: 1
          });
        }
      }
    });

    return Array.from(itemMap.values()).filter(item => item.count > 0 || itemTemplates.some(t => t.id === item.id));
  }, [itemTemplates, variants]);

  // Filter variants
  const filteredVariants = useMemo(() => {
    return variants.filter(v => {
      // 1. Search Query (Matches product item, code, variant name, brand, or attributes)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesCode = v.variantCode?.toLowerCase().includes(q);
        const matchesBarcode = v.barcode?.toLowerCase().includes(q);
        const matchesName = v.variantName?.toLowerCase().includes(q);
        const matchesShort = v.shortName?.toLowerCase().includes(q);
        const matchesItem = v.itemName?.toLowerCase().includes(q);
        const matchesBrand = v.brandName?.toLowerCase().includes(q);
        const matchesAttrs = Object.values(v.attributes || {}).some(val => 
          String(val).toLowerCase().includes(q)
        );
        if (!matchesCode && !matchesBarcode && !matchesName && !matchesShort && !matchesItem && !matchesBrand && !matchesAttrs) {
          return false;
        }
      }

      // 2. Product Item filter (no categories required)
      if (selectedItemId !== 'ALL') {
        const matchesId = v.itemId === selectedItemId;
        const matchesName = v.itemName === selectedItemId;
        if (!matchesId && !matchesName) {
          return false;
        }
      }

      // 3. Status filter
      if (statusFilter !== 'ALL' && v.status !== statusFilter) {
        return false;
      }

      // 4. Technical Status
      if (techStatusFilter !== 'ALL' && v.technicalStatus !== techStatusFilter) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'CODE') return a.variantCode.localeCompare(b.variantCode);
      if (sortBy === 'NAME') return a.variantName.localeCompare(b.variantName);
      if (sortBy === 'PRICE_ASC') return (a.pricing?.sellingPrice || 0) - (b.pricing?.sellingPrice || 0);
      if (sortBy === 'PRICE_DESC') return (b.pricing?.sellingPrice || 0) - (a.pricing?.sellingPrice || 0);
      if (sortBy === 'MARGIN_DESC') return (b.pricing?.grossMarginPercent || 0) - (a.pricing?.grossMarginPercent || 0);
      if (sortBy === 'COST_DESC') return (b.pricing?.costPrice || b.bom?.totalCost || 0) - (a.pricing?.costPrice || a.bom?.totalCost || 0);
      return 0;
    });
  }, [variants, searchQuery, selectedItemId, statusFilter, techStatusFilter, sortBy]);

  // Portfolio metrics
  const metrics = useMemo(() => {
    const total = variants.length;
    const active = variants.filter(v => v.status === 'ACTIVE').length;
    const draft = variants.filter(v => v.status === 'DRAFT').length;
    const requiresApproval = variants.filter(v => v.status === 'REQUIRES_APPROVAL' || v.technicalStatus === 'REQUIRES_APPROVAL').length;
    
    let sumMargin = 0;
    let marginCount = 0;
    let staleCount = 0;

    variants.forEach(v => {
      if (v.pricing?.grossMarginPercent) {
        sumMargin += v.pricing.grossMarginPercent;
        marginCount++;
      }
      const health = evaluatePriceHealth(v.pricing, v.bom);
      if (health.warnings.some(w => w.type === 'STALE' || w.type === 'EXPIRED')) {
        staleCount++;
      }
    });

    const avgMargin = marginCount > 0 ? Math.round((sumMargin / marginCount) * 10) / 10 : 0;

    return { total, active, draft, requiresApproval, avgMargin, staleCount };
  }, [variants]);

  // Toggle selection for comparison
  const handleToggleCompare = (id: string) => {
    setSelectedForCompare(prev => {
      if (prev.includes(id)) return prev.filter(item => item !== id);
      if (prev.length >= 4) {
        alert('You can compare a maximum of 4 variants side-by-side.');
        return prev;
      }
      return [...prev, id];
    });
  };

  const comparedVariants = useMemo(() => {
    return variants.filter(v => selectedForCompare.includes(v.id));
  }, [variants, selectedForCompare]);

  // Handle Quick Price Update
  const handleOpenQuickPrice = (v: ProductVariant) => {
    setActiveQuickPriceVariant(v);
    setQuickPrice(v.pricing?.sellingPrice || 0);
    setQuickMargin(v.pricing?.grossMarginPercent || 25);
  };

  const handleSaveQuickPrice = () => {
    if (!activeQuickPriceVariant || !onUpdatePricing) return;
    const cost = activeQuickPriceVariant.pricing?.costPrice || activeQuickPriceVariant.bom?.totalCost || 0;
    const markup = cost > 0 ? Math.round(((quickPrice - cost) / cost) * 1000) / 10 : 0;
    const margin = quickPrice > 0 ? Math.round(((quickPrice - cost) / quickPrice) * 1000) / 10 : 0;

    const updated: ProductVariant = {
      ...activeQuickPriceVariant,
      pricing: {
        ...(activeQuickPriceVariant.pricing || {
          costPrice: cost,
          minimumPrice: 0,
          standardPrice: quickPrice,
          pricingMethod: 'Cost + Markup',
          priceSource: 'SUPPLIER_QUOTATION',
          currency: 'LKR',
          effectiveFrom: new Date().toISOString()
        }),
        costPrice: cost,
        sellingPrice: quickPrice,
        grossMarginPercent: margin,
        markupPercent: markup,
        grossProfit: quickPrice - cost,
        lastUpdated: new Date().toISOString()
      },
      priceHistory: [
        {
          id: crypto.randomUUID(),
          date: new Date().toISOString().split('T')[0],
          oldSellingPrice: activeQuickPriceVariant.pricing?.sellingPrice || 0,
          newSellingPrice: quickPrice,
          oldCostPrice: cost,
          newCostPrice: cost,
          markupPercent: markup,
          marginPercent: margin,
          reason: 'Quick Price adjustment in Variant Master List',
          changedBy: 'Senior QS Estimator'
        },
        ...(activeQuickPriceVariant.priceHistory || [])
      ]
    };

    onUpdatePricing(updated);
    setActiveQuickPriceVariant(null);
  };

  // Compact single-line specification summary for one-line list view
  const getCompactSpecSummary = (v: ProductVariant): string => {
    const parts: string[] = [];
    if (v.attributes?.['SYSTEM_SERIES']) parts.push(v.attributes['SYSTEM_SERIES']);
    if (v.attributes?.['GLASS_THICKNESS']) parts.push(v.attributes['GLASS_THICKNESS']);
    if (v.attributes?.['COLOR_RAL']) parts.push(v.attributes['COLOR_RAL'].split('(')[0].trim());
    if (v.attributes?.['BRAND_SPEC']) parts.push(v.attributes['BRAND_SPEC'].split(' ')[0].trim());
    
    if (parts.length > 0) return parts.join(' · ');
    if (v.shortName) return v.shortName;
    if (v.attributes) {
      const vals = Object.values(v.attributes).filter(Boolean);
      if (vals.length > 0) return vals.slice(0, 3).join(' · ');
    }
    return 'Standard Specification';
  };

  return (
    <div className="space-y-4">
      
      {/* Simple One-Line Ribbon & Metrics */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-2 min-w-0">
            <h1 className="text-sm font-bold text-slate-900 whitespace-nowrap">Product Variants</h1>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
              {metrics.total}
            </span>
            <span className="text-xs text-slate-500 font-normal truncate hidden md:inline">
              • BOM rollups & pricing matrix
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <ExportActions 
              onExportCSV={() => exportVariantsCSV(filteredVariants, itemTemplates)}
              onExportPDF={() => exportVariantsPDF(filteredVariants, itemTemplates)}
              labelCSV="CSV"
              labelPDF="PDF"
            />

            {selectedForCompare.length >= 2 && (
              <button
                type="button"
                onClick={() => setIsCompareOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 transition-colors"
              >
                <Scale className="w-3.5 h-3.5" />
                Compare ({selectedForCompare.length})
              </button>
            )}

            <button
              type="button"
              onClick={() => onAddNewVariant()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-2xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Variant</span>
            </button>
          </div>
        </div>

        {/* Clean White Metric Summary Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 pt-3 border-t border-slate-100">
          <div className="bg-slate-50/80 rounded-lg p-2.5 border border-slate-200/70">
            <div className="text-[11px] font-medium text-slate-500">Total Variants</div>
            <div className="text-base font-bold font-mono text-slate-900 mt-0.5">{metrics.total}</div>
          </div>
          <div className="bg-slate-50/80 rounded-lg p-2.5 border border-slate-200/70">
            <div className="text-[11px] font-medium text-emerald-700">Active (Quote Ready)</div>
            <div className="text-base font-bold font-mono text-emerald-700 mt-0.5">{metrics.active}</div>
          </div>
          <div className="bg-slate-50/80 rounded-lg p-2.5 border border-slate-200/70">
            <div className="text-[11px] font-medium text-amber-700">Draft / In Review</div>
            <div className="text-base font-bold font-mono text-amber-700 mt-0.5">{metrics.draft}</div>
          </div>
          <div className="bg-slate-50/80 rounded-lg p-2.5 border border-slate-200/70">
            <div className="text-[11px] font-medium text-blue-700">Sign-Off Pending</div>
            <div className="text-base font-bold font-mono text-blue-700 mt-0.5">{metrics.requiresApproval}</div>
          </div>
          <div className="bg-slate-50/80 rounded-lg p-2.5 border border-slate-200/70">
            <div className="text-[11px] font-medium text-slate-600">Portfolio Avg Margin</div>
            <div className="text-base font-bold font-mono text-slate-900 mt-0.5">{metrics.avgMargin}%</div>
          </div>
          <div className="bg-slate-50/80 rounded-lg p-2.5 border border-slate-200/70">
            <div className="text-[11px] font-medium text-slate-500">Price Stale (&gt;90d)</div>
            <div className="text-base font-bold font-mono text-slate-700 mt-0.5">{metrics.staleCount}</div>
          </div>
        </div>
      </div>

      {/* Enhanced Filter Bar - Focused on Product Item Search (No Categories) */}
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm space-y-2.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
          
          {/* Enhanced Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by product item name, variant code, attribute, or spec..."
              className="w-full pl-9 pr-8 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1.5 text-slate-400 hover:text-slate-600 text-xs p-1"
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Product Item Filter & Sort Controls */}
          <div className="flex items-center gap-2">
            {/* Filter by Product Item (Category-free) */}
            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 font-medium focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none max-w-[210px] truncate"
              title="Filter by Product Item"
            >
              <option value="ALL">All Product Items ({variants.length})</option>
              {availableProductItems.map(item => (
                <option key={item.id} value={item.id}>
                  {item.name} {item.count > 0 ? `(${item.count})` : ''}
                </option>
              ))}
            </select>

            {/* Sort Selector */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none"
            >
              <option value="CODE">Sort: Code</option>
              <option value="NAME">Sort: Name</option>
              <option value="PRICE_DESC">Price: High → Low</option>
              <option value="PRICE_ASC">Price: Low → High</option>
              <option value="MARGIN_DESC">Margin: High → Low</option>
              <option value="COST_DESC">Cost: High → Low</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('TABLE')}
                className={cn(
                  "p-1.5 rounded-md text-xs font-medium transition-all",
                  viewMode === 'TABLE' ? "bg-white text-slate-900 shadow-sm font-semibold" : "text-slate-500 hover:text-slate-800"
                )}
                title="Single-Line List View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('CARDS')}
                className={cn(
                  "p-1.5 rounded-md text-xs font-medium transition-all",
                  viewMode === 'CARDS' ? "bg-white text-slate-900 shadow-sm font-semibold" : "text-slate-500 hover:text-slate-800"
                )}
                title="Card View"
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Status Filter Chips & Counter */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium text-[11px]">Status:</span>
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={cn(
                "px-2.5 py-0.5 rounded-md text-[11px] font-medium transition-colors",
                statusFilter === 'ALL' 
                  ? "bg-slate-900 text-white" 
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              All ({variants.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('ACTIVE')}
              className={cn(
                "px-2.5 py-0.5 rounded-md text-[11px] font-medium transition-colors",
                statusFilter === 'ACTIVE' 
                  ? "bg-emerald-700 text-white" 
                  : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              )}
            >
              Active ({metrics.active})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('DRAFT')}
              className={cn(
                "px-2.5 py-0.5 rounded-md text-[11px] font-medium transition-colors",
                statusFilter === 'DRAFT' 
                  ? "bg-amber-700 text-white" 
                  : "bg-amber-50 text-amber-700 hover:bg-amber-100"
              )}
            >
              Draft ({metrics.draft})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('REQUIRES_APPROVAL')}
              className={cn(
                "px-2.5 py-0.5 rounded-md text-[11px] font-medium transition-colors",
                statusFilter === 'REQUIRES_APPROVAL' 
                  ? "bg-blue-700 text-white" 
                  : "bg-blue-50 text-blue-700 hover:bg-blue-100"
              )}
            >
              Sign-Off ({metrics.requiresApproval})
            </button>

            {(selectedItemId !== 'ALL' || statusFilter !== 'ALL' || techStatusFilter !== 'ALL' || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedItemId('ALL');
                  setStatusFilter('ALL');
                  setTechStatusFilter('ALL');
                  setSearchQuery('');
                }}
                className="text-[11px] text-amber-700 hover:text-amber-800 font-semibold underline ml-2"
              >
                Reset Filters
              </button>
            )}
          </div>

          <div className="text-[11px] text-slate-500 font-medium">
            Showing <span className="font-bold text-slate-800">{filteredVariants.length}</span> of {variants.length} variants
          </div>
        </div>
      </div>

      {/* VIEW MODE: SINGLE-LINE LIST VIEW (TABLE) */}
      {viewMode === 'TABLE' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-semibold text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3 w-8 text-center">
                    <span className="sr-only">Compare</span>
                  </th>
                  <th className="py-2.5 px-3 w-36 whitespace-nowrap">Variant Code</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">Product Item & Variant Name</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">Specification Digest</th>
                  <th className="py-2.5 px-3 text-right whitespace-nowrap">BOM Cost</th>
                  <th className="py-2.5 px-3 text-right whitespace-nowrap">Selling Price</th>
                  <th className="py-2.5 px-3 text-center whitespace-nowrap">Gross Margin</th>
                  <th className="py-2.5 px-3 text-center whitespace-nowrap">Status</th>
                  <th className="py-2.5 px-3 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVariants.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-10 px-4 text-center text-slate-400">
                      <Layers className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      <div className="font-semibold text-slate-600 text-sm">No construction variants found</div>
                      <p className="text-xs text-slate-400 mt-1">Try searching with a different product item or keyword.</p>
                      <button
                        onClick={() => onAddNewVariant()}
                        className="mt-3 px-3.5 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-semibold hover:bg-amber-700"
                      >
                        Create Variant Now
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredVariants.map(v => {
                    const isChecked = selectedForCompare.includes(v.id);
                    const cost = v.pricing?.costPrice || v.bom?.totalCost || 0;
                    const selling = v.pricing?.sellingPrice || 0;
                    const margin = v.pricing?.grossMarginPercent || (selling > 0 ? Math.round(((selling - cost) / selling) * 1000) / 10 : 0);
                    const health = evaluatePriceHealth(v.pricing, v.bom);
                    const specSummary = getCompactSpecSummary(v);

                    return (
                      <tr 
                        key={v.id} 
                        className={cn(
                          "group hover:bg-slate-50/80 transition-colors border-b border-slate-100 last:border-b-0",
                          isChecked && "bg-amber-50/50"
                        )}
                      >
                        {/* Compare Checkbox */}
                        <td className="py-2 px-3 text-center whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleCompare(v.id)}
                            className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 w-3.5 h-3.5 cursor-pointer"
                            title="Check to compare side-by-side"
                          />
                        </td>

                        {/* Variant Code & Barcode */}
                        <td className="py-2 px-3 whitespace-nowrap">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded text-[11px] border border-slate-200">
                                {v.variantCode}
                              </span>
                              <button
                                onClick={() => handleCopyCode(v.variantCode)}
                                className="text-slate-400 hover:text-slate-600 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Copy SKU code"
                              >
                                {copiedCode === v.variantCode ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>
                            {v.barcode && (
                              <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                                <Barcode className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>{v.barcode}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Product Item & Variant Name (One Line) */}
                        <td className="py-2 px-3 whitespace-nowrap max-w-sm">
                          <div className="flex items-center gap-1.5 text-xs truncate">
                            <span className="font-semibold text-slate-900 truncate" title={v.variantName}>
                              {v.variantName}
                            </span>
                            {v.itemName && (
                              <>
                                <span className="text-slate-300 shrink-0">·</span>
                                <span className="text-slate-500 font-normal text-[11px] truncate shrink-0 max-w-[160px]" title={v.itemName}>
                                  {v.itemName}
                                </span>
                              </>
                            )}
                          </div>
                        </td>

                        {/* Specification Summary (One Line) */}
                        <td className="py-2 px-3 whitespace-nowrap max-w-xs">
                          <span className="text-xs text-slate-600 truncate block" title={specSummary}>
                            {specSummary}
                          </span>
                        </td>

                        {/* BOM Cost Rollup (One Line) */}
                        <td className="py-2 px-3 text-right whitespace-nowrap font-mono">
                          <button
                            onClick={() => setActiveBOMModalVariant(v)}
                            className="text-slate-700 hover:text-amber-700 font-medium hover:underline text-xs"
                            title="View detailed BOM breakdown"
                          >
                            LKR {cost.toLocaleString()}
                          </button>
                        </td>

                        {/* Selling Price (One Line) */}
                        <td className="py-2 px-3 text-right whitespace-nowrap font-mono">
                          <button
                            onClick={() => handleOpenQuickPrice(v)}
                            className="font-bold text-xs text-emerald-700 hover:text-emerald-800 hover:underline"
                            title="Quick adjust price"
                          >
                            LKR {selling.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">/{v.unit || 'm²'}</span>
                          </button>
                        </td>

                        {/* Gross Margin % (One Line) */}
                        <td className="py-2 px-3 text-center whitespace-nowrap">
                          <span className={cn(
                            "inline-block px-2 py-0.5 rounded text-[11px] font-mono font-bold",
                            margin >= 25 
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                              : margin >= 15 
                              ? "bg-amber-50 text-amber-700 border border-amber-200" 
                              : "bg-red-50 text-red-700 border border-red-200"
                          )}>
                            {margin}%
                          </span>
                        </td>

                        {/* Release Status & Health (One Line) */}
                        <td className="py-2 px-3 text-center whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            <span className={cn(
                              "px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide",
                              v.status === 'ACTIVE' 
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                                : v.status === 'DRAFT' 
                                ? "bg-slate-100 text-slate-600 border border-slate-200" 
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            )}>
                              {v.status}
                            </span>
                            {!health.isHealthy && (
                              <span title={health.warnings.map(w => w.message).join('. ')} className="text-amber-500 cursor-help">
                                <AlertTriangle className="w-3 h-3 inline" />
                              </span>
                            )}
                            {v.status === 'REQUIRES_APPROVAL' && onApproveVariant && (
                              <button
                                onClick={() => onApproveVariant(v.id)}
                                className="text-[10px] text-emerald-700 hover:underline font-semibold ml-1"
                              >
                                Approve
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Actions (One Line) */}
                        <td className="py-2 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setActiveSpecModalVariant(v)}
                              className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                              title="View Multi-Audience Specifications"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setActiveBOMModalVariant(v)}
                              className="p-1 rounded text-slate-400 hover:text-amber-700 hover:bg-slate-100 transition-colors"
                              title="View BOM Breakdown"
                            >
                              <Calculator className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setActiveHistoryModalVariant(v)}
                              className="p-1 rounded text-slate-400 hover:text-blue-700 hover:bg-slate-100 transition-colors"
                              title="View Price History"
                            >
                              <History className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onAddNewVariant(v.itemId)}
                              className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                              title="Clone / New Variant for this item"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onEditVariant(v)}
                              className="p-1 rounded text-slate-400 hover:text-emerald-700 hover:bg-slate-100 transition-colors"
                              title="Edit Variant"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Are you sure you want to remove variant ${v.variantCode} from the catalog?`)) {
                                  onDeleteVariant(v.id);
                                }
                              }}
                              className="p-1 rounded text-slate-400 hover:text-red-700 hover:bg-red-50 transition-colors"
                              title="Delete Variant"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW MODE: CARDS VIEW */}
      {viewMode === 'CARDS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVariants.map(v => {
            const isChecked = selectedForCompare.includes(v.id);
            const cost = v.pricing?.costPrice || v.bom?.totalCost || 0;
            const selling = v.pricing?.sellingPrice || 0;
            const margin = v.pricing?.grossMarginPercent || (selling > 0 ? Math.round(((selling - cost) / selling) * 1000) / 10 : 0);

            return (
              <div 
                key={v.id}
                className={cn(
                  "bg-white rounded-xl border p-4 shadow-sm flex flex-col justify-between transition-all",
                  isChecked ? "border-indigo-500 ring-2 ring-indigo-200" : "border-slate-200 hover:border-slate-300"
                )}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded text-[11px] border border-amber-200">
                          {v.variantCode}
                        </span>
                        {v.barcode && (
                          <span className="font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded text-[10px] border border-slate-200 flex items-center gap-1">
                            <Barcode size={10} className="text-slate-400" />
                            {v.barcode}
                          </span>
                        )}
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                          v.status === 'ACTIVE' ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                        )}>
                          {v.status}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm mt-1.5 line-clamp-1">{v.variantName}</h4>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{v.itemName} • {v.categoryName}</p>
                    </div>

                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleCompare(v.id)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 mt-1"
                      title="Select for comparison"
                    />
                  </div>

                  {/* Attributes Chips */}
                  <div className="flex flex-wrap gap-1 mt-3">
                    {Object.entries(v.attributes || {}).slice(0, 4).map(([k, val]) => (
                      <span key={k} className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] text-slate-600 font-medium">
                        {String(val)}
                      </span>
                    ))}
                  </div>

                  {/* Description preview */}
                  <p className="text-xs text-slate-600 mt-3 line-clamp-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    {v.customerDescription || v.generatedDescription}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-[10px] text-slate-400">Unit Cost (BOM)</div>
                      <div className="text-xs font-mono font-bold text-slate-700">
                        LKR {cost.toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400">Selling Price</div>
                      <div className="text-sm font-mono font-extrabold text-emerald-700">
                        LKR {selling.toLocaleString()} <span className="text-[10px] font-normal text-slate-400">/{v.unit}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400">Margin</div>
                      <div className={cn(
                        "text-xs font-mono font-bold",
                        margin >= 20 ? "text-emerald-700" : "text-amber-600"
                      )}>
                        {margin}%
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setActiveBOMModalVariant(v)}
                        className="text-slate-500 hover:text-amber-700 flex items-center gap-1 text-[11px]"
                      >
                        <Calculator className="w-3.5 h-3.5" /> BOM
                      </button>
                      <button
                        onClick={() => setActiveSpecModalVariant(v)}
                        className="text-slate-500 hover:text-blue-700 flex items-center gap-1 text-[11px]"
                      >
                        <FileText className="w-3.5 h-3.5" /> Specs
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditVariant(v)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-semibold text-[11px]"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDeleteVariant(v.id)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded-md"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: SPECIFICATION ENGINE VIEWER (FULL-SCREEN & WHITE THEME) */}
      {activeSpecModalVariant && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[999] w-screen h-screen bg-white flex flex-col overflow-hidden animate-in fade-in duration-150">
          <div className="bg-white border-b border-slate-200 text-slate-900 px-6 py-4 flex items-center justify-between shrink-0 shadow-2xs">
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-mono font-bold bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-0.5 rounded-md">
                {activeSpecModalVariant.variantCode}
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900 leading-tight">
                  {activeSpecModalVariant.variantName}
                </h3>
                <p className="text-xs text-slate-500">
                  Specification Engine & Architectural Submittal Specs
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                type="button"
                onClick={() => setActiveSpecModalVariant(null)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Close Specification"
              >
                <X className="w-4 h-4" />
                <span>Close Specification</span>
              </button>
            </div>
          </div>

          <div className="flex-1 p-6 space-y-5 overflow-y-auto bg-slate-50/50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
                <div className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Customer-Facing Presentation Specification
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-normal">
                  {activeSpecModalVariant.customerDescription || activeSpecModalVariant.generatedDescription}
                </p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-500" />
                  Formal BOQ Contract Tender Description
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-normal">
                  {activeSpecModalVariant.boqDescription || activeSpecModalVariant.generatedDescription}
                </p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Technical Engineering Submittal Specification
              </div>
              <pre className="text-xs font-mono text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-200">
                {activeSpecModalVariant.technicalDescription || activeSpecModalVariant.generatedDescription}
              </pre>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-3">Detailed Parameter Breakdown</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 text-xs">
                {Object.entries(activeSpecModalVariant.attributes || {}).map(([key, val]) => (
                  <div key={key} className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">{key}</span>
                    <span className="font-semibold text-slate-900 block mt-0.5">{String(val)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white px-6 py-3 border-t border-slate-200 flex justify-end shrink-0">
            <button
              type="button"
              onClick={() => setActiveSpecModalVariant(null)}
              className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              Close Specification
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 2: BOM DETAIL VIEWER (FULL-SCREEN & WHITE THEME) */}
      {activeBOMModalVariant && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[999] w-screen h-screen bg-white flex flex-col overflow-hidden animate-in fade-in duration-150">
          <div className="bg-white border-b border-slate-200 text-slate-900 px-6 py-4 flex items-center justify-between shrink-0 shadow-2xs">
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-mono font-bold bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-0.5 rounded-md">
                {activeBOMModalVariant.variantCode}
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900 leading-tight">
                  {activeBOMModalVariant.variantName}
                </h3>
                <p className="text-xs text-slate-500">
                  Bill of Materials (BOM) & Rolled-Up Unit Cost Breakdown
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                type="button"
                onClick={() => setActiveBOMModalVariant(null)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Close BOM View"
              >
                <X className="w-4 h-4" />
                <span>Close BOM View</span>
              </button>
            </div>
          </div>

          <div className="flex-1 p-6 space-y-4 overflow-y-auto text-xs bg-slate-50/50">
            {activeBOMModalVariant.bom ? (
              <>
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <div className="bg-slate-50 px-4 py-2.5 font-bold text-slate-800 flex justify-between border-b border-slate-200">
                    <span>Direct Material Components ({activeBOMModalVariant.bom.baseUnit})</span>
                    <span className="font-mono text-emerald-800">Subtotal: LKR {activeBOMModalVariant.bom.directMaterialCost.toLocaleString()}</span>
                  </div>
                  <table className="w-full text-left">
                    <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-[11px]">
                      <tr>
                        <th className="p-3">Component</th>
                        <th className="p-3">Qty / Unit</th>
                        <th className="p-3">Wastage %</th>
                        <th className="p-3 text-right">Unit Rate</th>
                        <th className="p-3 text-right">Amount (LKR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {activeBOMModalVariant.bom.components.map(comp => (
                        <tr key={comp.id} className="hover:bg-slate-50/50">
                          <td className="p-3">
                            <div className="font-semibold text-slate-900">{comp.description}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{comp.materialCode} • {comp.supplierName}</div>
                          </td>
                          <td className="p-3 font-mono">{comp.quantity} {comp.unit}</td>
                          <td className="p-3 font-mono text-slate-500">+{comp.wastagePercentage}%</td>
                          <td className="p-3 text-right font-mono">LKR {comp.rate.toLocaleString()}</td>
                          <td className="p-3 text-right font-mono font-bold text-slate-900">LKR {comp.amount.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <div className="bg-slate-50 px-4 py-2.5 font-bold text-slate-800 flex justify-between border-b border-slate-200">
                    <span>Direct Labour Allocation</span>
                    <span className="font-mono text-emerald-800">Subtotal: LKR {activeBOMModalVariant.bom.directLabourCost.toLocaleString()}</span>
                  </div>
                  <div className="p-3 space-y-2">
                    {activeBOMModalVariant.bom.labourItems.map(lab => (
                      <div key={lab.id} className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                        <div>
                          <span className="font-semibold text-slate-900">{lab.labourType} Labour</span>
                          <span className="text-slate-400 ml-2">({lab.notes})</span>
                        </div>
                        <div className="font-mono font-bold text-slate-900">
                          LKR {lab.amount.toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Overheads breakdown */}
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <div className="bg-slate-50 px-4 py-2.5 font-bold text-slate-800 flex justify-between border-b border-slate-200">
                    <span>Overhead & Other Cost Allocations</span>
                    <span className="font-mono text-amber-800">
                      Subtotal: +LKR {(activeBOMModalVariant.bom.totalOverheadCost ?? (activeBOMModalVariant.bom.factoryOverheadAmount + activeBOMModalVariant.bom.adminOverheadAmount)).toLocaleString()}
                    </span>
                  </div>
                  {activeBOMModalVariant.bom.overheadItems && activeBOMModalVariant.bom.overheadItems.length > 0 ? (
                    <div className="p-3 space-y-2">
                      {activeBOMModalVariant.bom.overheadItems.map(oh => (
                        <div key={oh.id} className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-900">{oh.name}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-mono">{oh.costType}</span>
                            </div>
                            {oh.description && <div className="text-[11px] text-slate-500">{oh.description}</div>}
                          </div>
                          <div className="text-right">
                            <div className="font-mono font-bold text-amber-800">
                              +LKR {oh.amount.toLocaleString()}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {oh.calculationBasis === 'FIXED_AMOUNT' ? `Fixed LKR ${oh.rateOrPercent}` : `${oh.rateOrPercent}% (${oh.calculationBasis.replace('PERCENT_', '% ')})`}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 grid grid-cols-2 gap-4 text-xs">
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                        <div className="text-slate-500">Factory OH ({activeBOMModalVariant.bom.overheadFactoryPercent}%)</div>
                        <div className="font-mono font-bold text-amber-800 mt-1">+LKR {activeBOMModalVariant.bom.factoryOverheadAmount.toLocaleString()}</div>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                        <div className="text-slate-500">Admin OH ({activeBOMModalVariant.bom.overheadAdminPercent}%)</div>
                        <div className="font-mono font-bold text-amber-800 mt-1">+LKR {activeBOMModalVariant.bom.adminOverheadAmount.toLocaleString()}</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Overheads breakdown: Clean high-contrast white card */}
                <div className="bg-white text-slate-900 border border-slate-200 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 shadow-2xs">
                  <div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase">Total Direct Cost</div>
                    <div className="text-base font-bold font-mono text-slate-900 mt-0.5">LKR {activeBOMModalVariant.bom.totalDirectCost.toLocaleString()}</div>
                    <div className="text-[10px] text-slate-400">Materials + Direct Labour</div>
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase">Total Overheads</div>
                    <div className="text-base font-semibold font-mono text-amber-700 mt-0.5">
                      +LKR {(activeBOMModalVariant.bom.totalOverheadCost ?? (activeBOMModalVariant.bom.factoryOverheadAmount + activeBOMModalVariant.bom.adminOverheadAmount)).toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-400">{(activeBOMModalVariant.bom.overheadItems?.length ?? 2)} allocated cost types</div>
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase">Overhead Burden</div>
                    <div className="text-base font-semibold font-mono text-slate-800 mt-0.5">
                      {activeBOMModalVariant.bom.totalDirectCost > 0 
                        ? (((activeBOMModalVariant.bom.totalOverheadCost ?? (activeBOMModalVariant.bom.factoryOverheadAmount + activeBOMModalVariant.bom.adminOverheadAmount)) / activeBOMModalVariant.bom.totalDirectCost) * 100).toFixed(1) 
                        : 0}%
                    </div>
                    <div className="text-[10px] text-slate-400">Effective on direct</div>
                  </div>
                  <div className="border-l border-slate-200 pl-4 bg-emerald-50/50 -my-4 -mr-4 p-4 rounded-r-xl">
                    <div className="text-[11px] text-emerald-800 font-bold uppercase">Total Rolled-Up Unit Cost</div>
                    <div className="text-lg font-bold font-mono text-emerald-900 mt-0.5">
                      LKR {activeBOMModalVariant.bom.totalCost.toLocaleString()} /{activeBOMModalVariant.bom.baseUnit}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-12 text-center text-slate-400">No BOM recorded for this variant.</div>
            )}
          </div>

          <div className="bg-white px-6 py-3 border-t border-slate-200 flex justify-end shrink-0">
            <button
              type="button"
              onClick={() => setActiveBOMModalVariant(null)}
              className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              Close BOM View
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 3: PRICE HISTORY & BUSINESS ANALYTICS (FULL SCREEN & WHITE THEME) */}
      {activeHistoryModalVariant && typeof document !== 'undefined' && createPortal(
        <VariantPriceAnalyticsView
          variant={activeHistoryModalVariant}
          projects={projects}
          onClose={() => setActiveHistoryModalVariant(null)}
          onUpdateVariant={(updated) => {
            setActiveHistoryModalVariant(updated);
            onUpdatePricing?.(updated);
          }}
        />,
        document.body
      )}

      {/* MODAL 4: QUICK PRICE OVERRIDE (WHITE THEME) */}
      {activeQuickPriceVariant && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-white border-b border-slate-200 text-slate-900 px-5 py-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded">
                  {activeQuickPriceVariant.variantCode}
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-1">Quick Price Adjustment</h3>
              </div>
              <button 
                onClick={() => setActiveQuickPriceVariant(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <div className="text-xs text-slate-500">Current Cost Price (BOM):</div>
                <div className="text-sm font-mono font-bold text-slate-800">
                  LKR {(activeQuickPriceVariant.pricing?.costPrice || activeQuickPriceVariant.bom?.totalCost || 0).toLocaleString()}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-1.5">
                  New Selling Price (LKR / {activeQuickPriceVariant.unit})
                </label>
                <input
                  type="number"
                  value={quickPrice}
                  onChange={(e) => {
                    const p = Number(e.target.value);
                    setQuickPrice(p);
                    const c = activeQuickPriceVariant.pricing?.costPrice || activeQuickPriceVariant.bom?.totalCost || 0;
                    if (p > 0) {
                      setQuickMargin(Math.round(((p - c) / p) * 1000) / 10);
                    }
                  }}
                  className="w-full text-base font-mono font-bold p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              {/* Target Margin Slider */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Target Gross Margin:</span>
                  <span className="font-mono text-emerald-700 font-bold">{quickMargin}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="50"
                  step="0.5"
                  value={quickMargin}
                  onChange={(e) => {
                    const m = Number(e.target.value);
                    setQuickMargin(m);
                    const c = activeQuickPriceVariant.pricing?.costPrice || activeQuickPriceVariant.bom?.totalCost || 0;
                    if (c > 0) {
                      setQuickPrice(Math.round(c / (1 - m / 100)));
                    }
                  }}
                  className="w-full accent-amber-600"
                />
              </div>
            </div>

            <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveQuickPriceVariant(null)}
                className="px-4 py-2 text-slate-600 text-xs font-semibold hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveQuickPrice}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs"
              >
                Update Price
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MATRIX COMPARISON (FULL-SCREEN & WHITE THEME) */}
      {isCompareOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[999] w-screen h-screen bg-white flex flex-col overflow-hidden animate-in fade-in duration-150">
          <div className="bg-white border-b border-slate-200 text-slate-900 px-6 py-4 flex items-center justify-between shrink-0 shadow-2xs">
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-indigo-600" />
              <h3 className="text-base font-bold text-slate-900">Variant Matrix Comparison ({comparedVariants.length} Selected)</h3>
            </div>
            <div className="flex items-center gap-2">
              <button 
                type="button"
                onClick={() => setIsCompareOpen(false)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Close Comparison"
              >
                <X className="w-4 h-4" />
                <span>Close Comparison</span>
              </button>
            </div>
          </div>

          <div className="flex-1 p-6 overflow-x-auto overflow-y-auto bg-slate-50/50">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200">
                    <th className="p-3 border-r border-slate-200 w-48 font-bold text-slate-700">Specification & Metrics</th>
                    {comparedVariants.map(cv => (
                      <th key={cv.id} className="p-3 border-r border-slate-200 last:border-r-0 font-bold text-slate-900 min-w-56">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[11px] font-mono text-amber-700">{cv.variantCode}</span>
                          {cv.barcode && <span className="text-[10px] font-mono text-slate-500">{cv.barcode}</span>}
                        </div>
                        <div className="text-xs font-bold mt-0.5">{cv.variantName}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  <tr>
                    <td className="p-2.5 font-semibold text-slate-600 bg-slate-50 border-r border-slate-200">Base BOQ Item</td>
                    {comparedVariants.map(cv => (
                      <td key={cv.id} className="p-2.5 border-r border-slate-200 last:border-r-0">{cv.itemName}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-2.5 font-semibold text-slate-600 bg-slate-50 border-r border-slate-200">Unique Barcode (1D)</td>
                    {comparedVariants.map(cv => (
                      <td key={cv.id} className="p-2.5 border-r border-slate-200 last:border-r-0 font-mono text-[11px] text-slate-600">
                        {cv.barcode || '-'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-2.5 font-semibold text-slate-600 bg-slate-50 border-r border-slate-200">System Series</td>
                    {comparedVariants.map(cv => (
                      <td key={cv.id} className="p-2.5 border-r border-slate-200 last:border-r-0 font-medium">{cv.attributes?.['SYSTEM_SERIES'] || '-'}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-2.5 font-semibold text-slate-600 bg-slate-50 border-r border-slate-200">Glass Spec</td>
                    {comparedVariants.map(cv => (
                      <td key={cv.id} className="p-2.5 border-r border-slate-200 last:border-r-0 font-medium">{cv.attributes?.['GLASS_THICKNESS']} {cv.attributes?.['GLASS_TYPE']}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-2.5 font-semibold text-slate-600 bg-slate-50 border-r border-slate-200">Surface Finish & Color</td>
                    {comparedVariants.map(cv => (
                      <td key={cv.id} className="p-2.5 border-r border-slate-200 last:border-r-0 font-medium">{cv.attributes?.['SURFACE_FINISH']} ({cv.attributes?.['COLOR_RAL']})</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-2.5 font-semibold text-slate-600 bg-slate-50 border-r border-slate-200">Hardware & Rollers</td>
                    {comparedVariants.map(cv => (
                      <td key={cv.id} className="p-2.5 border-r border-slate-200 last:border-r-0 font-medium">{cv.attributes?.['ROLLER_TYPE']}</td>
                    ))}
                  </tr>
                  <tr className="bg-amber-50/40">
                    <td className="p-2.5 font-bold text-slate-700 bg-amber-100/50 border-r border-slate-200">Unit Cost (BOM Rollup)</td>
                    {comparedVariants.map(cv => (
                      <td key={cv.id} className="p-2.5 border-r border-slate-200 last:border-r-0 font-mono font-bold text-slate-900">
                        LKR {(cv.pricing?.costPrice || cv.bom?.totalCost || 0).toLocaleString()}
                      </td>
                    ))}
                  </tr>
                  <tr className="bg-emerald-50/40">
                    <td className="p-2.5 font-bold text-slate-700 bg-emerald-100/50 border-r border-slate-200">Selling Price</td>
                    {comparedVariants.map(cv => (
                      <td key={cv.id} className="p-2.5 border-r border-slate-200 last:border-r-0 font-mono font-extrabold text-emerald-800 text-sm">
                        LKR {(cv.pricing?.sellingPrice || 0).toLocaleString()} /{cv.unit}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-2.5 font-semibold text-slate-600 bg-slate-50 border-r border-slate-200">Gross Margin %</td>
                    {comparedVariants.map(cv => (
                      <td key={cv.id} className="p-2.5 border-r border-slate-200 last:border-r-0 font-mono font-bold text-emerald-700">
                        {cv.pricing?.grossMarginPercent || 0}%
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-2.5 font-semibold text-slate-600 bg-slate-50 border-r border-slate-200">Markup on Cost %</td>
                    {comparedVariants.map(cv => (
                      <td key={cv.id} className="p-2.5 border-r border-slate-200 last:border-r-0 font-mono text-slate-700">
                        +{cv.pricing?.markupPercent || 0}%
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-2.5 font-semibold text-slate-600 bg-slate-50 border-r border-slate-200">Profit per Unit</td>
                    {comparedVariants.map(cv => (
                      <td key={cv.id} className="p-2.5 border-r border-slate-200 last:border-r-0 font-mono font-bold text-slate-900">
                        LKR {((cv.pricing?.sellingPrice || 0) - (cv.pricing?.costPrice || cv.bom?.totalCost || 0)).toLocaleString()}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white px-6 py-3 border-t border-slate-200 flex justify-end shrink-0">
            <button
              type="button"
              onClick={() => setIsCompareOpen(false)}
              className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              Close Comparison
            </button>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};
