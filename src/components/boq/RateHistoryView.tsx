import React, { useState, useMemo } from 'react';
import { 
  Calendar, DollarSign, Percent, Plus, 
  Search, Target, ShieldCheck, Filter, X, 
  RotateCcw, SlidersHorizontal, Layers
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip 
} from 'recharts';
import { ItemTemplate, ItemCategory, RateHistoryEntry, CompetitivePriceEntry } from '../../types';
import { cn } from '../../lib/utils';
import { ItemSelectDropdown } from './ItemSelectDropdown';
import { ExportActions } from '../common/ExportActions';
import { exportRateHistoryCSV, exportRateHistoryPDF } from '../../services/dataExportService';

interface RateHistoryViewProps {
  items: ItemTemplate[];
  categories?: ItemCategory[];
  selectedItem?: ItemTemplate | null;
  onSelectItem?: (item: ItemTemplate | null) => void;
  onOpenRateModal: (item?: ItemTemplate | null) => void;
  onOpenCompetitiveModal: (item?: ItemTemplate | null) => void;
}

export const RateHistoryView: React.FC<RateHistoryViewProps> = ({
  items,
  categories = [],
  selectedItem: initialSelectedItem,
  onSelectItem,
  onOpenRateModal,
  onOpenCompetitiveModal
}) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('ALL');
  const [selectedItemId, setSelectedItemId] = useState<string>(
    initialSelectedItem?.id || 'ALL'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'RATES' | 'COMPETITORS'>('RATES');
  
  // Advanced Filter States
  const [dateRange, setDateRange] = useState<'ALL' | '30D' | '90D' | 'THIS_YEAR' | 'PREV_YEAR' | 'CUSTOM'>('ALL');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [marginFilter, setMarginFilter] = useState<'ALL' | 'HIGH' | 'STANDARD' | 'LOW'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Approved' | 'Pending' | 'Draft'>('ALL');
  const [competitorFilter, setCompetitorFilter] = useState<string>('ALL');
  const [parityFilter, setParityFilter] = useState<'ALL' | 'Identical' | 'Higher' | 'Lower'>('ALL');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Available categories
  const categoryOptions = useMemo(() => {
    if (categories && categories.length > 0) {
      return categories.map(c => ({ id: c.id, name: c.name, level: c.level || 0 }));
    }
    const catSet = new Set<string>();
    items.forEach(it => {
      if (it.category) catSet.add(it.category);
    });
    return Array.from(catSet).map(c => ({ id: c, name: c, level: 0 }));
  }, [categories, items]);

  // Items filtered by category (for item dropdown options)
  const itemsForDropdown = useMemo(() => {
    if (selectedCategoryId === 'ALL') return items;
    return items.filter(it => 
      it.categoryId === selectedCategoryId ||
      it.category.toLowerCase() === selectedCategoryId.toLowerCase() ||
      (it.subCategory && it.subCategory.toLowerCase() === selectedCategoryId.toLowerCase()) ||
      (it.categoryPath && it.categoryPath.some(p => p.toLowerCase() === selectedCategoryId.toLowerCase()))
    );
  }, [items, selectedCategoryId]);

  // When category changes, if selected item is no longer in that category, reset to 'ALL'
  const handleCategoryChange = (newCatId: string) => {
    setSelectedCategoryId(newCatId);
    if (selectedItemId !== 'ALL') {
      const stillValid = items.some(it => {
        if (it.id !== selectedItemId) return false;
        if (newCatId === 'ALL') return true;
        return (
          it.categoryId === newCatId ||
          it.category.toLowerCase() === newCatId.toLowerCase() ||
          (it.subCategory && it.subCategory.toLowerCase() === newCatId.toLowerCase()) ||
          (it.categoryPath && it.categoryPath.some(p => p.toLowerCase() === newCatId.toLowerCase()))
        );
      });
      if (!stillValid) {
        setSelectedItemId('ALL');
        onSelectItem?.(null);
      }
    }
  };

  const activeItem = items.find(i => i.id === selectedItemId);

  // Extract unique competitors for competitor filter dropdown
  const uniqueCompetitors = useMemo(() => {
    const compSet = new Set<string>();
    items.forEach(it => {
      it.competitivePrices?.forEach(cp => {
        if (cp.competitorName?.trim()) compSet.add(cp.competitorName.trim());
      });
    });
    return Array.from(compSet).sort();
  }, [items]);

  // Date range verification helper
  const isDateInRange = (dateStr: string) => {
    if (dateRange === 'ALL') return true;
    const time = new Date(dateStr).getTime();
    if (isNaN(time)) return true;
    const now = new Date().getTime();

    if (dateRange === '30D') return time >= now - 30 * 24 * 60 * 60 * 1000;
    if (dateRange === '90D') return time >= now - 90 * 24 * 60 * 60 * 1000;
    if (dateRange === 'THIS_YEAR') return new Date(dateStr).getFullYear() === new Date().getFullYear();
    if (dateRange === 'PREV_YEAR') return new Date(dateStr).getFullYear() === new Date().getFullYear() - 1;
    if (dateRange === 'CUSTOM') {
      if (customStartDate && time < new Date(customStartDate).getTime()) return false;
      if (customEndDate && time > new Date(customEndDate).getTime() + 24 * 60 * 60 * 1000) return false;
      return true;
    }
    return true;
  };

  // Target items after category and item filter
  const scopedItems = useMemo(() => {
    return items.filter(it => {
      if (selectedCategoryId !== 'ALL') {
        const matchesCat = 
          it.categoryId === selectedCategoryId ||
          it.category.toLowerCase() === selectedCategoryId.toLowerCase() ||
          (it.subCategory && it.subCategory.toLowerCase() === selectedCategoryId.toLowerCase()) ||
          (it.categoryPath && it.categoryPath.some(p => p.toLowerCase() === selectedCategoryId.toLowerCase()));
        if (!matchesCat) return false;
      }
      if (selectedItemId !== 'ALL' && it.id !== selectedItemId) {
        return false;
      }
      return true;
    });
  }, [items, selectedCategoryId, selectedItemId]);

  // Flatten and filter rate history entries
  const filteredRateRows = useMemo(() => {
    const rows: {
      item: ItemTemplate;
      entry: RateHistoryEntry;
    }[] = [];

    scopedItems.forEach(item => {
      if (item.rateHistory && item.rateHistory.length > 0) {
        item.rateHistory.forEach(entry => {
          rows.push({ item, entry });
        });
      } else {
        // Synthesize baseline if empty
        rows.push({
          item,
          entry: {
            id: `base-${item.id}`,
            date: '2024-01-01',
            rate: item.rate,
            supplierCost: item.lastSupplierPrice || Math.round(item.rate * 0.72),
            marginPercent: item.targetMargin || 25,
            version: 'v1.0',
            reason: 'Initial BOQ Catalog baseline',
            recordedBy: 'System',
            status: 'Approved'
          }
        });
      }
    });

    // Apply Date Filter
    let result = rows.filter(r => isDateInRange(r.entry.date));

    // Apply Margin Filter
    if (marginFilter !== 'ALL') {
      result = result.filter(r => {
        const m = r.entry.marginPercent || 0;
        if (marginFilter === 'HIGH') return m >= 25;
        if (marginFilter === 'STANDARD') return m >= 15 && m < 25;
        if (marginFilter === 'LOW') return m < 15;
        return true;
      });
    }

    // Apply Status Filter
    if (statusFilter !== 'ALL') {
      result = result.filter(r => (r.entry.status || 'Approved') === statusFilter);
    }

    // Apply Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(r => 
        r.item.name.toLowerCase().includes(q) ||
        (r.item.productCode && r.item.productCode.toLowerCase().includes(q)) ||
        (r.entry.reason && r.entry.reason.toLowerCase().includes(q)) ||
        (r.entry.recordedBy && r.entry.recordedBy.toLowerCase().includes(q)) ||
        r.entry.date.includes(q)
      );
    }

    return result.sort((a, b) => new Date(b.entry.date).getTime() - new Date(a.entry.date).getTime());
  }, [scopedItems, dateRange, customStartDate, customEndDate, marginFilter, statusFilter, searchQuery]);

  // Flatten and filter competitive price entries
  const filteredCompetitiveRows = useMemo(() => {
    const rows: {
      item: ItemTemplate;
      entry: CompetitivePriceEntry;
    }[] = [];

    scopedItems.forEach(item => {
      if (item.competitivePrices && item.competitivePrices.length > 0) {
        item.competitivePrices.forEach(entry => {
          rows.push({ item, entry });
        });
      }
    });

    // Apply Date Filter
    let result = rows.filter(r => isDateInRange(r.entry.date));

    // Apply Competitor Filter
    if (competitorFilter !== 'ALL') {
      result = result.filter(r => r.entry.competitorName?.trim().toLowerCase() === competitorFilter.toLowerCase());
    }

    // Apply Parity Filter
    if (parityFilter !== 'ALL') {
      result = result.filter(r => r.entry.specificationParity === parityFilter);
    }

    // Apply Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(r => 
        r.item.name.toLowerCase().includes(q) ||
        (r.item.productCode && r.item.productCode.toLowerCase().includes(q)) ||
        r.entry.competitorName.toLowerCase().includes(q) ||
        (r.entry.projectName && r.entry.projectName.toLowerCase().includes(q)) ||
        (r.entry.notes && r.entry.notes.toLowerCase().includes(q))
      );
    }

    return result.sort((a, b) => new Date(b.entry.date).getTime() - new Date(a.entry.date).getTime());
  }, [scopedItems, dateRange, customStartDate, customEndDate, competitorFilter, parityFilter, searchQuery]);

  // Total raw counts for badges
  const totalRateRowsCount = useMemo(() => {
    let count = 0;
    items.forEach(it => {
      count += it.rateHistory?.length || 1;
    });
    return count;
  }, [items]);

  const totalCompetitiveRowsCount = useMemo(() => {
    let count = 0;
    items.forEach(it => {
      count += it.competitivePrices?.length || 0;
    });
    return count;
  }, [items]);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategoryId !== 'ALL') count++;
    if (selectedItemId !== 'ALL') count++;
    if (dateRange !== 'ALL') count++;
    if (marginFilter !== 'ALL') count++;
    if (statusFilter !== 'ALL') count++;
    if (competitorFilter !== 'ALL') count++;
    if (parityFilter !== 'ALL') count++;
    if (searchQuery.trim()) count++;
    return count;
  }, [selectedCategoryId, selectedItemId, dateRange, marginFilter, statusFilter, competitorFilter, parityFilter, searchQuery]);

  const resetAllFilters = () => {
    setSelectedCategoryId('ALL');
    setSelectedItemId('ALL');
    setDateRange('ALL');
    setCustomStartDate('');
    setCustomEndDate('');
    setMarginFilter('ALL');
    setStatusFilter('ALL');
    setCompetitorFilter('ALL');
    setParityFilter('ALL');
    setSearchQuery('');
    onSelectItem?.(null);
  };

  // Generate chart data chronologically from filtered rows
  const chartData = useMemo(() => {
    const dateMap = new Map<string, {
      date: string;
      rate?: number;
      supplierCost?: number;
      competitorPrice?: number;
      competitorCount: number;
      competitorTotal: number;
      sampleCount: number;
    }>();

    filteredRateRows.forEach(({ entry }) => {
      const d = entry.date;
      if (!dateMap.has(d)) {
        dateMap.set(d, { date: d, rate: entry.rate, supplierCost: entry.supplierCost, competitorCount: 0, competitorTotal: 0, sampleCount: 1 });
      } else {
        const curr = dateMap.get(d)!;
        curr.rate = Math.round(((curr.rate || entry.rate) + entry.rate) / 2);
        curr.supplierCost = Math.round(((curr.supplierCost || entry.supplierCost || 0) + (entry.supplierCost || 0)) / 2);
      }
    });

    filteredCompetitiveRows.forEach(({ entry }) => {
      const d = entry.date;
      if (!dateMap.has(d)) {
        dateMap.set(d, { date: d, competitorCount: 1, competitorTotal: entry.price, competitorPrice: entry.price, sampleCount: 1 });
      } else {
        const curr = dateMap.get(d)!;
        curr.competitorCount += 1;
        curr.competitorTotal += entry.price;
        curr.competitorPrice = Math.round(curr.competitorTotal / curr.competitorCount);
      }
    });

    return Array.from(dateMap.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [filteredRateRows, filteredCompetitiveRows]);

  // Summary Metrics (dynamically computed on filtered dataset)
  const avgMargin = useMemo(() => {
    if (filteredRateRows.length === 0) return 0;
    const total = filteredRateRows.reduce((acc, r) => acc + (r.entry.marginPercent || 0), 0);
    return Math.round((total / filteredRateRows.length) * 10) / 10;
  }, [filteredRateRows]);

  const avgRate = useMemo(() => {
    if (filteredRateRows.length === 0) return 0;
    const total = filteredRateRows.reduce((acc, r) => acc + r.entry.rate, 0);
    return Math.round(total / filteredRateRows.length);
  }, [filteredRateRows]);

  return (
    <div className="flex flex-col h-full bg-slate-50/50 overflow-y-auto">
      {/* Top Header Controls */}
      <div className="px-6 py-4 bg-white border-b border-slate-200/80 shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900">Rate History & Price Intelligence</h1>
              <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                Live Audited
              </span>
            </div>
            <p className="text-xs text-slate-500 font-normal">
              Chronological ledger of selling rates, cost baselines, margin evolution, and competitor benchmarks
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <ExportActions 
              onExportCSV={() => exportRateHistoryCSV(scopedItems)}
              onExportPDF={() => exportRateHistoryPDF(scopedItems)}
              labelCSV="Ledger CSV"
              labelPDF="Ledger PDF"
            />

            <button
              onClick={() => onOpenRateModal(activeItem)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-semibold shadow-xs transition-all"
            >
              <Plus size={13} />
              <span>Record Rate Update</span>
            </button>

            <button
              onClick={() => onOpenCompetitiveModal(activeItem)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all"
            >
              <Target size={13} />
              <span>Add Competitor Price</span>
            </button>
          </div>
        </div>

        {/* Comprehensive Filter Toolbar */}
        <div className="mt-4 pt-3 border-t border-slate-100 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            {/* Left Filter Controls */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Category Filter */}
              <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 text-xs">
                <Layers size={13} className="text-slate-400 shrink-0" />
                <span className="font-semibold text-slate-500 text-[11px]">Category:</span>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="bg-transparent font-semibold text-slate-800 focus:outline-hidden cursor-pointer max-w-[150px] truncate text-xs"
                >
                  <option value="ALL">All Categories ({categoryOptions.length})</option>
                  {categoryOptions.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.level > 0 ? '— '.repeat(cat.level) : ''}{cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Item Selector Dropdown (Combobox with Search & Category Badges) */}
              <div className="flex items-center gap-1">
                <ItemSelectDropdown
                  items={itemsForDropdown}
                  selectedItemId={selectedItemId}
                  onSelectItem={(id) => {
                    setSelectedItemId(id);
                    const found = items.find(i => i.id === id);
                    onSelectItem?.(found || null);
                  }}
                  categories={categories}
                  allowAll={true}
                  allLabel={selectedCategoryId === 'ALL' ? 'All BOQ Items' : 'All in Category'}
                  placeholder="Filter by item..."
                />
              </div>

              {/* Date Range Selector */}
              <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 text-xs">
                <Calendar size={13} className="text-slate-400 shrink-0" />
                <span className="font-semibold text-slate-500 text-[11px]">Date:</span>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value as any)}
                  className="bg-transparent font-semibold text-slate-800 focus:outline-hidden cursor-pointer text-xs"
                >
                  <option value="ALL">All Time</option>
                  <option value="30D">Last 30 Days</option>
                  <option value="90D">Last 90 Days</option>
                  <option value="THIS_YEAR">This Year ({new Date().getFullYear()})</option>
                  <option value="PREV_YEAR">Last Year ({new Date().getFullYear() - 1})</option>
                  <option value="CUSTOM">Custom Range...</option>
                </select>
              </div>

              {/* Advanced Filters Toggle */}
              <button
                type="button"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors",
                  showAdvancedFilters || (activeFiltersCount > 0 && (marginFilter !== 'ALL' || statusFilter !== 'ALL' || competitorFilter !== 'ALL' || parityFilter !== 'ALL'))
                    ? "bg-orange-50 border-orange-200 text-orange-700"
                    : "bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                )}
              >
                <SlidersHorizontal size={13} />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-orange-500 text-white text-[10px] flex items-center justify-center font-bold">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </div>

            {/* Right Controls: View Switcher & Search */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* View Switcher: Rates vs Competitors */}
              <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs shrink-0">
                <button
                  onClick={() => setActiveTab('RATES')}
                  className={cn(
                    "px-3 py-1 rounded-md font-medium transition-colors",
                    activeTab === 'RATES' 
                      ? "bg-white text-slate-900 shadow-2xs font-semibold" 
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  Rates ({filteredRateRows.length})
                </button>
                <button
                  onClick={() => setActiveTab('COMPETITORS')}
                  className={cn(
                    "px-3 py-1 rounded-md font-medium transition-colors",
                    activeTab === 'COMPETITORS' 
                      ? "bg-white text-slate-900 shadow-2xs font-semibold" 
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  Competitors ({filteredCompetitiveRows.length})
                </button>
              </div>

              {/* Search Input */}
              <div className="relative w-full sm:w-56">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search code, item, reason..."
                  className="w-full text-xs pl-7 pr-6 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-orange-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Secondary Expanded Filters Row */}
          {showAdvancedFilters && (
            <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 flex flex-wrap items-center gap-3 animate-in fade-in-50 duration-150 text-xs">
              {activeTab === 'RATES' ? (
                <>
                  {/* Margin Filter */}
                  <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                    <span className="text-[11px] font-semibold text-slate-500">Margin:</span>
                    <select
                      value={marginFilter}
                      onChange={(e) => setMarginFilter(e.target.value as any)}
                      className="bg-transparent font-medium text-slate-800 focus:outline-hidden cursor-pointer text-xs"
                    >
                      <option value="ALL">All Margins</option>
                      <option value="HIGH">High Margin (≥ 25%)</option>
                      <option value="STANDARD">Standard Margin (15% - 25%)</option>
                      <option value="LOW">Low Margin (&lt; 15%)</option>
                    </select>
                  </div>

                  {/* Status Filter */}
                  <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                    <span className="text-[11px] font-semibold text-slate-500">Status:</span>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as any)}
                      className="bg-transparent font-medium text-slate-800 focus:outline-hidden cursor-pointer text-xs"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="Approved">Approved</option>
                      <option value="Pending">Pending Review</option>
                      <option value="Draft">Draft</option>
                    </select>
                  </div>
                </>
              ) : (
                <>
                  {/* Competitor Filter */}
                  <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                    <span className="text-[11px] font-semibold text-slate-500">Competitor:</span>
                    <select
                      value={competitorFilter}
                      onChange={(e) => setCompetitorFilter(e.target.value)}
                      className="bg-transparent font-medium text-slate-800 focus:outline-hidden cursor-pointer text-xs"
                    >
                      <option value="ALL">All Competitors</option>
                      {uniqueCompetitors.map(comp => (
                        <option key={comp} value={comp}>{comp}</option>
                      ))}
                    </select>
                  </div>

                  {/* Parity Filter */}
                  <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                    <span className="text-[11px] font-semibold text-slate-500">Parity:</span>
                    <select
                      value={parityFilter}
                      onChange={(e) => setParityFilter(e.target.value as any)}
                      className="bg-transparent font-medium text-slate-800 focus:outline-hidden cursor-pointer text-xs"
                    >
                      <option value="ALL">All Spec Parities</option>
                      <option value="Identical">Identical Specification</option>
                      <option value="Higher">Higher Specification</option>
                      <option value="Lower">Lower Specification</option>
                    </select>
                  </div>
                </>
              )}

              {/* Custom Date Inputs if CUSTOM is selected */}
              {dateRange === 'CUSTOM' && (
                <div className="flex items-center gap-2 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-500">From:</span>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="text-xs bg-transparent focus:outline-hidden text-slate-800"
                  />
                  <span className="text-[11px] font-semibold text-slate-500">To:</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="text-xs bg-transparent focus:outline-hidden text-slate-800"
                  />
                </div>
              )}

              {/* Clear All in Secondary Panel */}
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="flex items-center gap-1 text-slate-500 hover:text-red-600 transition-colors text-xs font-semibold ml-auto"
                >
                  <RotateCcw size={12} />
                  <span>Reset All Filters</span>
                </button>
              )}
            </div>
          )}

          {/* Active Filter Pills Bar */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 mr-1">
                <Filter size={11} /> Active:
              </span>

              {selectedCategoryId !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-50 text-orange-800 border border-orange-200 text-[11px] font-medium">
                  Category: {categoryOptions.find(c => c.id === selectedCategoryId)?.name || selectedCategoryId}
                  <button onClick={() => handleCategoryChange('ALL')} className="hover:text-orange-950">
                    <X size={11} />
                  </button>
                </span>
              )}

              {selectedItemId !== 'ALL' && activeItem && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-50 text-orange-800 border border-orange-200 text-[11px] font-medium">
                  Item: {activeItem.productCode ? `[${activeItem.productCode}] ` : ''}{activeItem.name}
                  <button onClick={() => { setSelectedItemId('ALL'); onSelectItem?.(null); }} className="hover:text-orange-950">
                    <X size={11} />
                  </button>
                </span>
              )}

              {dateRange !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200 text-[11px] font-medium">
                  Date: {dateRange === '30D' ? 'Last 30 Days' : dateRange === '90D' ? 'Last 90 Days' : dateRange === 'THIS_YEAR' ? 'This Year' : dateRange === 'PREV_YEAR' ? 'Last Year' : `${customStartDate || 'Start'} to ${customEndDate || 'End'}`}
                  <button onClick={() => setDateRange('ALL')} className="hover:text-blue-950">
                    <X size={11} />
                  </button>
                </span>
              )}

              {marginFilter !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-medium">
                  Margin: {marginFilter === 'HIGH' ? '≥ 25%' : marginFilter === 'STANDARD' ? '15% - 25%' : '< 15%'}
                  <button onClick={() => setMarginFilter('ALL')} className="hover:text-emerald-950">
                    <X size={11} />
                  </button>
                </span>
              )}

              {statusFilter !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200 text-[11px] font-medium">
                  Status: {statusFilter}
                  <button onClick={() => setStatusFilter('ALL')} className="hover:text-slate-950">
                    <X size={11} />
                  </button>
                </span>
              )}

              {competitorFilter !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200 text-[11px] font-medium">
                  Competitor: {competitorFilter}
                  <button onClick={() => setCompetitorFilter('ALL')} className="hover:text-purple-950">
                    <X size={11} />
                  </button>
                </span>
              )}

              {parityFilter !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-800 border border-indigo-200 text-[11px] font-medium">
                  Parity: {parityFilter}
                  <button onClick={() => setParityFilter('ALL')} className="hover:text-indigo-950">
                    <X size={11} />
                  </button>
                </span>
              )}

              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200 text-[11px] font-medium">
                  Search: "{searchQuery}"
                  <button onClick={() => setSearchQuery('')} className="hover:text-slate-950">
                    <X size={11} />
                  </button>
                </span>
              )}

              <button
                type="button"
                onClick={resetAllFilters}
                className="text-[11px] text-orange-600 hover:text-orange-700 font-semibold underline underline-offset-2 ml-1"
              >
                Clear all ({activeFiltersCount})
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* KPI Metrics Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Filtered Rate Entries</span>
              <Calendar size={15} className="text-orange-500" />
            </div>
            <div className="text-xl font-bold text-slate-900">
              {filteredRateRows.length}
              {filteredRateRows.length !== totalRateRowsCount && (
                <span className="text-xs text-slate-400 font-normal ml-1.5">
                  of {totalRateRowsCount}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Historical revision checkpoints</p>
          </div>

          <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Average Selling Rate</span>
              <DollarSign size={15} className="text-emerald-500" />
            </div>
            <div className="text-xl font-bold text-slate-900">LKR {avgRate.toLocaleString()}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Across filtered catalog entries</p>
          </div>

          <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Avg Gross Profit Margin</span>
              <Percent size={15} className="text-blue-500" />
            </div>
            <div className={cn("text-xl font-bold", avgMargin >= 20 ? "text-emerald-600" : "text-amber-600")}>
              {avgMargin}%
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Target minimum: 20%</p>
          </div>

          <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Competitor Benchmarks</span>
              <Target size={15} className="text-purple-500" />
            </div>
            <div className="text-xl font-bold text-slate-900">
              {filteredCompetitiveRows.length}
              {filteredCompetitiveRows.length !== totalCompetitiveRowsCount && (
                <span className="text-xs text-slate-400 font-normal ml-1.5">
                  of {totalCompetitiveRowsCount}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Market intelligence records</p>
          </div>
        </div>

        {/* Price History & Competitor Chart */}
        <div className="p-5 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Rate Evolution & Market Variance Trajectory</h2>
              <p className="text-xs text-slate-500 font-normal">
                {selectedItemId === 'ALL' ? 'Overall trend across all active items' : `Historical price trend for ${activeItem?.name}`}
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                <span className="w-3 h-0.5 bg-orange-500 rounded-full" /> Our Rate
              </span>
              <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                <span className="w-3 h-0.5 bg-emerald-500 rounded-full" /> Base Cost
              </span>
              <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                <span className="w-3 h-0.5 bg-blue-500 rounded-full" /> Competitor Price
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  stroke="#94a3b8" 
                  fontSize={11} 
                  tickLine={false} 
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={11} 
                  tickLine={false}
                  tickFormatter={(val) => `LKR ${val}`} 
                />
                <Tooltip 
                  formatter={(val: any, name: string) => [
                    `LKR ${Number(val).toLocaleString()}`, 
                    name === 'rate' ? 'Our Selling Rate' : name === 'supplierCost' ? 'Base Supplier Cost' : 'Competitor Price'
                  ]}
                  labelFormatter={(label) => `Date: ${label}`}
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#0f172a', borderRadius: '10px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.08)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="rate" 
                  stroke="#f97316" 
                  strokeWidth={2.5} 
                  dot={{ r: 4, fill: '#f97316' }} 
                  activeDot={{ r: 6 }} 
                  name="rate"
                />
                <Line 
                  type="monotone" 
                  dataKey="supplierCost" 
                  stroke="#10b981" 
                  strokeWidth={2} 
                  strokeDasharray="4 4"
                  dot={{ r: 3, fill: '#10b981' }} 
                  name="supplierCost"
                />
                <Line 
                  type="monotone" 
                  dataKey="competitorPrice" 
                  stroke="#3b82f6" 
                  strokeWidth={2} 
                  dot={{ r: 4, fill: '#3b82f6' }} 
                  name="competitorPrice"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Active View: Rate History Ledger Table */}
        {activeTab === 'RATES' ? (
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Complete Rate History Ledger (All Rows Listed)
                </h3>
                <p className="text-[11px] text-slate-500 font-normal">
                  Showing {filteredRateRows.length} audited rate records
                </p>
              </div>
              <span className="text-[11px] font-semibold text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                100% Comprehensive Log
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-4">Effective Date</th>
                    <th className="py-2.5 px-4">Item & Code</th>
                    <th className="py-2.5 px-4">Category</th>
                    <th className="py-2.5 px-4">Revision</th>
                    <th className="py-2.5 px-4 text-right">Selling Rate</th>
                    <th className="py-2.5 px-4 text-right">Base Cost</th>
                    <th className="py-2.5 px-4 text-right">Margin %</th>
                    <th className="py-2.5 px-4">Change Reason / Context</th>
                    <th className="py-2.5 px-4">Recorded By</th>
                    <th className="py-2.5 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRateRows.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-400">
                        No rate history entries found matching your filter.
                      </td>
                    </tr>
                  ) : (
                    filteredRateRows.map(({ item, entry }, idx) => {
                      const margin = entry.marginPercent || 0;
                      return (
                        <tr key={`${item.id}-${entry.id}-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-mono text-slate-700 whitespace-nowrap">
                            {entry.date}
                          </td>
                          <td className="py-3 px-4 max-w-xs">
                            <div className="font-semibold text-slate-900 truncate" title={item.name}>
                              {item.name}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {item.productCode || 'N/A'} • {item.unit}
                            </div>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium">
                              {item.category}
                            </span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-50 text-blue-700 border border-blue-200">
                              {entry.version || 'v1.0'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-slate-900 whitespace-nowrap">
                            LKR {entry.rate.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right text-slate-600 whitespace-nowrap">
                            LKR {(entry.supplierCost || 0).toLocaleString()}
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
                          <td className="py-3 px-4 max-w-xs text-slate-600 text-[11px]">
                            {entry.reason || 'Routine calibration'}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap text-slate-500 text-[11px]">
                            {entry.recordedBy || 'Lead QS'}
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <ShieldCheck size={11} /> Approved
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Active View: Competitor Benchmarking Table */
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Competitor Intelligence & Market Quotes
                </h3>
                <p className="text-[11px] text-slate-500 font-normal">
                  Showing {filteredCompetitiveRows.length} observed competitive quotes
                </p>
              </div>
              <button
                onClick={() => onOpenCompetitiveModal(activeItem)}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
              >
                <Plus size={12} /> Add Entry
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-4">Item Target</th>
                    <th className="py-2.5 px-4">Competitor</th>
                    <th className="py-2.5 px-4 text-right">Competitor Rate</th>
                    <th className="py-2.5 px-4 text-right">Our Rate</th>
                    <th className="py-2.5 px-4 text-right">Variance</th>
                    <th className="py-2.5 px-4 text-center">Spec Parity</th>
                    <th className="py-2.5 px-4">Project Context</th>
                    <th className="py-2.5 px-4">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCompetitiveRows.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        No competitor quotes recorded yet. Click "Add Competitor Price" above to add one.
                      </td>
                    </tr>
                  ) : (
                    filteredCompetitiveRows.map(({ item, entry }, idx) => {
                      const ourRate = item.rate;
                      const diff = entry.price - ourRate;
                      const diffPct = ourRate > 0 ? Math.round((diff / ourRate) * 1000) / 10 : 0;
                      return (
                        <tr key={`${item.id}-${entry.id}-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-mono text-slate-700 whitespace-nowrap">
                            {entry.date}
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-900 max-w-xs truncate">
                            {item.name}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-800">
                            {entry.competitorName}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-blue-600 whitespace-nowrap">
                            LKR {entry.price.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-slate-900 whitespace-nowrap">
                            LKR {ourRate.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <span className={cn(
                              "px-2 py-0.5 rounded-full text-[11px] font-bold inline-flex items-center gap-0.5",
                              diffPct > 0 ? "bg-emerald-100 text-emerald-800" :
                              diffPct < 0 ? "bg-rose-100 text-rose-800" :
                              "bg-slate-100 text-slate-700"
                            )}>
                              {diffPct > 0 ? `+${diffPct}% (We Cheaper)` : diffPct < 0 ? `${diffPct}% (Competitor Cheaper)` : '0%'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200">
                              {entry.parity || 'Identical'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600 text-[11px] max-w-xs truncate">
                            {entry.projectName || '—'}
                          </td>
                          <td className="py-3 px-4 text-slate-500 text-[11px] max-w-xs truncate">
                            {entry.notes || '—'}
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
      </div>
    </div>
  );
};
