import React, { useState, useMemo } from 'react';
import { 
  BarChart3, DollarSign, Percent, Target, 
  Sliders, Plus, Compass,
  CheckCircle2, AlertTriangle, Filter, Search, X, Layers
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip 
} from 'recharts';
import { ItemTemplate, ItemCategory } from '../../types';
import { cn } from '../../lib/utils';
import { ExportActions } from '../common/ExportActions';
import { exportPriceAnalyticsCSV, exportPriceAnalyticsPDF } from '../../services/dataExportService';

interface PriceAnalyticsViewProps {
  items: ItemTemplate[];
  categories?: ItemCategory[];
  onOpenRateModal: (item?: ItemTemplate | null) => void;
  onOpenCompetitiveModal: (item?: ItemTemplate | null) => void;
}

export const PriceAnalyticsView: React.FC<PriceAnalyticsViewProps> = ({
  items,
  categories = [],
  onOpenRateModal,
  onOpenCompetitiveModal
}) => {
  const [costInflationSimulation, setCostInflationSimulation] = useState<number>(0);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [marginHealthFilter, setMarginHealthFilter] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');
  const [positionFilter, setPositionFilter] = useState<'ALL' | 'FAVORABLE' | 'PREMIUM'>('ALL');

  // Filter items based on active criteria
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Category filter
      if (selectedCategoryId !== 'ALL') {
        const matchesCat = 
          item.categoryId === selectedCategoryId ||
          item.category.toLowerCase() === selectedCategoryId.toLowerCase() ||
          (item.subCategory && item.subCategory.toLowerCase() === selectedCategoryId.toLowerCase()) ||
          (item.categoryPath && item.categoryPath.some(p => p.toLowerCase() === selectedCategoryId.toLowerCase()));
        if (!matchesCat) return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches = 
          item.name.toLowerCase().includes(q) ||
          (item.productCode && item.productCode.toLowerCase().includes(q)) ||
          (item.description && item.description.toLowerCase().includes(q));
        if (!matches) return false;
      }
      // Margin Health filter
      if (marginHealthFilter !== 'ALL') {
        const cost = (item.lastSupplierPrice || Math.round(item.rate * 0.72)) * (1 + costInflationSimulation / 100);
        const m = item.rate > 0 ? ((item.rate - cost) / item.rate) * 100 : 0;
        if (marginHealthFilter === 'HIGH' && m < 25) return false;
        if (marginHealthFilter === 'MEDIUM' && (m < 20 || m >= 25)) return false;
        if (marginHealthFilter === 'LOW' && m >= 20) return false;
      }
      // Position filter
      if (positionFilter !== 'ALL') {
        if (!item.competitivePrices || item.competitivePrices.length === 0) return false;
        const avgCompetitor = item.competitivePrices.reduce((a, b) => a + b.price, 0) / item.competitivePrices.length;
        if (positionFilter === 'FAVORABLE' && item.rate > avgCompetitor) return false;
        if (positionFilter === 'PREMIUM' && item.rate <= avgCompetitor) return false;
      }
      return true;
    });
  }, [items, selectedCategoryId, searchQuery, marginHealthFilter, positionFilter, costInflationSimulation]);

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedCategoryId !== 'ALL') count++;
    if (searchQuery.trim()) count++;
    if (marginHealthFilter !== 'ALL') count++;
    if (positionFilter !== 'ALL') count++;
    return count;
  }, [selectedCategoryId, searchQuery, marginHealthFilter, positionFilter]);

  const resetAllFilters = () => {
    setSelectedCategoryId('ALL');
    setSearchQuery('');
    setMarginHealthFilter('ALL');
    setPositionFilter('ALL');
  };

  // Category average rates & margins
  const categoryAnalytics = useMemo(() => {
    const map = new Map<string, {
      categoryName: string;
      itemCount: number;
      totalRate: number;
      totalCost: number;
      avgMargin: number;
    }>();

    filteredItems.forEach(item => {
      const catName = item.category || 'General';
      const cost = (item.lastSupplierPrice || Math.round(item.rate * 0.72)) * (1 + costInflationSimulation / 100);
      if (!map.has(catName)) {
        map.set(catName, { categoryName: catName, itemCount: 0, totalRate: 0, totalCost: 0, avgMargin: 0 });
      }
      const entry = map.get(catName)!;
      entry.itemCount += 1;
      entry.totalRate += item.rate;
      entry.totalCost += cost;
    });

    return Array.from(map.values()).map(c => ({
      ...c,
      avgRate: Math.round(c.totalRate / c.itemCount),
      avgCost: Math.round(c.totalCost / c.itemCount),
      avgMargin: c.totalRate > 0 ? Math.round(((c.totalRate - c.totalCost) / c.totalRate) * 1000) / 10 : 0
    }));
  }, [filteredItems, costInflationSimulation]);

  // Overall KPIs
  const overallKPIs = useMemo(() => {
    if (filteredItems.length === 0) return { avgRate: 0, avgMargin: 0, competitiveAdvantageCount: 0, totalCompetitorQuotes: 0 };
    
    let totalRate = 0;
    let totalCost = 0;
    let totalCompetitorQuotes = 0;
    let competitiveAdvantageCount = 0;

    filteredItems.forEach(item => {
      const cost = (item.lastSupplierPrice || Math.round(item.rate * 0.72)) * (1 + costInflationSimulation / 100);
      totalRate += item.rate;
      totalCost += cost;

      if (item.competitivePrices && item.competitivePrices.length > 0) {
        totalCompetitorQuotes += item.competitivePrices.length;
        const avgCompetitor = item.competitivePrices.reduce((a, b) => a + b.price, 0) / item.competitivePrices.length;
        if (item.rate <= avgCompetitor) {
          competitiveAdvantageCount += 1;
        }
      }
    });

    const avgRate = Math.round(totalRate / filteredItems.length);
    const avgMargin = totalRate > 0 ? Math.round(((totalRate - totalCost) / totalRate) * 1000) / 10 : 0;

    return { avgRate, avgMargin, competitiveAdvantageCount, totalCompetitorQuotes };
  }, [filteredItems, costInflationSimulation]);

  // Margin Health Distribution
  const marginHealth = useMemo(() => {
    let high = 0; // >= 25%
    let medium = 0; // 20-25%
    let low = 0; // < 20%

    filteredItems.forEach(item => {
      const cost = (item.lastSupplierPrice || Math.round(item.rate * 0.72)) * (1 + costInflationSimulation / 100);
      const m = item.rate > 0 ? ((item.rate - cost) / item.rate) * 100 : 0;
      if (m >= 25) high++;
      else if (m >= 20) medium++;
      else low++;
    });

    return { high, medium, low };
  }, [filteredItems, costInflationSimulation]);

  // Competitor Comparison items
  const competitorComparisons = useMemo(() => {
    const list: {
      item: ItemTemplate;
      ourRate: number;
      competitorAvg: number;
      competitorMin: number;
      competitorMax: number;
      quoteCount: number;
      variancePct: number;
    }[] = [];

    filteredItems.forEach(item => {
      if (item.competitivePrices && item.competitivePrices.length > 0) {
        const prices = item.competitivePrices.map(p => p.price);
        const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        const variancePct = Math.round(((avg - item.rate) / item.rate) * 1000) / 10;
        list.push({
          item,
          ourRate: item.rate,
          competitorAvg: avg,
          competitorMin: min,
          competitorMax: max,
          quoteCount: prices.length,
          variancePct
        });
      }
    });

    return list.sort((a, b) => b.variancePct - a.variancePct);
  }, [filteredItems]);

  return (
    <div className="flex flex-col h-full bg-slate-50/50 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-xs">
            <BarChart3 size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900">Price & Margin Intelligence Portal</h1>
              <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                Strategic Analytics
              </span>
            </div>
            <p className="text-xs text-slate-500 font-normal">
              Cross-category profitability, supplier cost sensitivity simulations, and market positioning
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ExportActions 
            onExportCSV={() => exportPriceAnalyticsCSV(filteredItems)}
            onExportPDF={() => exportPriceAnalyticsPDF(filteredItems)}
            labelCSV="Analytics CSV"
            labelPDF="Analytics PDF"
          />

          <button
            onClick={() => onOpenRateModal(null)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-semibold shadow-xs transition-all"
          >
            <Plus size={13} />
            <span>Record Rate</span>
          </button>
          <button
            onClick={() => onOpenCompetitiveModal(null)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all"
          >
            <Target size={13} />
            <span>Add Competitor Price</span>
          </button>
        </div>
      </div>

      {/* Analytics Filter & Simulation Control Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Category Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 text-xs">
              <Layers size={13} className="text-slate-400 shrink-0" />
              <span className="font-semibold text-slate-500 text-[11px]">Category:</span>
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="bg-transparent font-semibold text-slate-800 focus:outline-hidden cursor-pointer max-w-[160px] truncate text-xs"
              >
                <option value="ALL">All Categories ({categories.length > 0 ? categories.length : 'All'})</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.level && cat.level > 0 ? '— '.repeat(cat.level) : ''}{cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Margin Health Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 text-xs">
              <Percent size={13} className="text-slate-400 shrink-0" />
              <span className="font-semibold text-slate-500 text-[11px]">Margin Health:</span>
              <select
                value={marginHealthFilter}
                onChange={(e) => setMarginHealthFilter(e.target.value as any)}
                className="bg-transparent font-semibold text-slate-800 focus:outline-hidden cursor-pointer text-xs"
              >
                <option value="ALL">All Health Bands</option>
                <option value="HIGH">High Margin (≥ 25%)</option>
                <option value="MEDIUM">Standard (20% - 25%)</option>
                <option value="LOW">Low Margin (&lt; 20%)</option>
              </select>
            </div>

            {/* Position Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 text-xs">
              <Target size={13} className="text-slate-400 shrink-0" />
              <span className="font-semibold text-slate-500 text-[11px]">Market Position:</span>
              <select
                value={positionFilter}
                onChange={(e) => setPositionFilter(e.target.value as any)}
                className="bg-transparent font-semibold text-slate-800 focus:outline-hidden cursor-pointer text-xs"
              >
                <option value="ALL">All Positions</option>
                <option value="FAVORABLE">Competitive Advantage (Rate ≤ Competitors)</option>
                <option value="PREMIUM">Premium Priced (Rate &gt; Competitors)</option>
              </select>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-60">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search items in analytics..."
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

        {/* Active Filters Bar */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 text-xs">
            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 mr-1">
              <Filter size={11} /> Filtered to {filteredItems.length} of {items.length} items:
            </span>

            {selectedCategoryId !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-50 text-orange-800 border border-orange-200 text-[11px] font-medium">
                Category: {categories.find(c => c.id === selectedCategoryId)?.name || selectedCategoryId}
                <button onClick={() => setSelectedCategoryId('ALL')} className="hover:text-orange-950">
                  <X size={11} />
                </button>
              </span>
            )}

            {marginHealthFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-medium">
                Margin: {marginHealthFilter === 'HIGH' ? '≥ 25%' : marginHealthFilter === 'MEDIUM' ? '20% - 25%' : '< 20%'}
                <button onClick={() => setMarginHealthFilter('ALL')} className="hover:text-emerald-950">
                  <X size={11} />
                </button>
              </span>
            )}

            {positionFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200 text-[11px] font-medium">
                Position: {positionFilter === 'FAVORABLE' ? 'Advantage' : 'Premium'}
                <button onClick={() => setPositionFilter('ALL')} className="hover:text-blue-950">
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
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Average Profit Margin */}
        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Overall Margin</span>
            <Percent size={15} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">{overallKPIs.avgMargin}%</div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {costInflationSimulation > 0 ? `Simulated at +${costInflationSimulation}% cost` : 'Weighted gross margin'}
          </p>
        </div>

        {/* Average Unit Rate */}
        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Average Selling Rate</span>
            <DollarSign size={15} className="text-orange-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">LKR {overallKPIs.avgRate.toLocaleString()}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Across {items.length} active BOQ items</p>
        </div>

        {/* Competitive Advantage Win-Rate */}
        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Price Advantage</span>
            <Target size={15} className="text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {competitorComparisons.length > 0 
              ? `${Math.round((overallKPIs.competitiveAdvantageCount / competitorComparisons.length) * 100)}%` 
              : '100%'}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {overallKPIs.competitiveAdvantageCount} of {competitorComparisons.length} benchmarked items cheaper
          </p>
        </div>

        {/* Market Data Points */}
        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Competitor Quotes</span>
            <Compass size={15} className="text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{overallKPIs.totalCompetitorQuotes}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Tracked market rate observations</p>
        </div>
      </div>

      {/* Cost Sensitivity & Inflation Simulator */}
      <div className="p-5 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Sliders size={16} className="text-orange-500" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">Supplier Cost Sensitivity Simulator</h2>
              <p className="text-xs text-slate-500">Test how raw material / extrusion cost fluctuations impact library profitability</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-700">Cost Escalation:</span>
            <span className={cn(
              "px-2.5 py-0.5 rounded-full text-xs font-bold",
              costInflationSimulation === 0 ? "bg-slate-100 text-slate-700" : "bg-orange-100 text-orange-800"
            )}>
              +{costInflationSimulation}%
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <input
            type="range"
            min="0"
            max="30"
            step="1"
            value={costInflationSimulation}
            onChange={(e) => setCostInflationSimulation(parseInt(e.target.value))}
            className="flex-1 accent-orange-500 cursor-pointer"
          />
          <button
            onClick={() => setCostInflationSimulation(0)}
            className="text-xs text-slate-500 hover:text-slate-800 underline shrink-0"
          >
            Reset
          </button>
        </div>

        {/* Health Distribution Pills */}
        <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-slate-100 text-center">
          <div className="p-2 rounded-lg bg-emerald-50/70 border border-emerald-100">
            <div className="text-xs font-semibold text-emerald-800">Healthy Margin (&ge;25%)</div>
            <div className="text-lg font-bold text-emerald-700">{marginHealth.high} items</div>
          </div>
          <div className="p-2 rounded-lg bg-blue-50/70 border border-blue-100">
            <div className="text-xs font-semibold text-blue-800">Acceptable (20-25%)</div>
            <div className="text-lg font-bold text-blue-700">{marginHealth.medium} items</div>
          </div>
          <div className="p-2 rounded-lg bg-rose-50/70 border border-rose-100">
            <div className="text-xs font-semibold text-rose-800">Critical (&lt;20%)</div>
            <div className="text-lg font-bold text-rose-700">{marginHealth.low} items</div>
          </div>
        </div>
      </div>

      {/* Category Price Comparison Chart */}
      <div className="p-5 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Average Rate & Cost by Category</h2>
            <p className="text-xs text-slate-500 font-normal">Direct comparison of selling rates against supplier cost per major category</p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-slate-700 font-medium">
              <span className="w-3 h-3 bg-orange-500 rounded-xs" /> Selling Rate (LKR)
            </span>
            <span className="flex items-center gap-1.5 text-slate-700 font-medium">
              <span className="w-3 h-3 bg-slate-300 rounded-xs" /> Supplier Cost (LKR)
            </span>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryAnalytics} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="categoryName" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `LKR ${v}`} />
              <Tooltip 
                formatter={(val: any, name: string) => [
                  `LKR ${Number(val).toLocaleString()}`, 
                  name === 'avgRate' ? 'Average Selling Rate' : 'Average Supplier Cost'
                ]}
                contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#0f172a', borderRadius: '10px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.08)' }}
              />
              <Bar dataKey="avgRate" fill="#f97316" radius={[4, 4, 0, 0]} name="avgRate" />
              <Bar dataKey="avgCost" fill="#cbd5e1" radius={[4, 4, 0, 0]} name="avgCost" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Competitor Benchmarking Matrix */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Competitor Market Benchmarking Matrix
            </h3>
            <p className="text-[11px] text-slate-500 font-normal">
              Side-by-side price comparison of internal rates vs external market tenders
            </p>
          </div>
          <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
            {competitorComparisons.length} Tracked Items
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-4">BOQ Item</th>
                <th className="py-2.5 px-4">Category</th>
                <th className="py-2.5 px-4 text-right">Our Rate</th>
                <th className="py-2.5 px-4 text-right">Competitor Avg</th>
                <th className="py-2.5 px-4 text-right">Range (Min - Max)</th>
                <th className="py-2.5 px-4 text-right">Price Variance</th>
                <th className="py-2.5 px-4 text-center">Positioning</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {competitorComparisons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No competitor quotes recorded yet. Click "Add Competitor Price" above to start benchmarking.
                  </td>
                </tr>
              ) : (
                competitorComparisons.map(({ item, ourRate, competitorAvg, competitorMin, competitorMax, variancePct }) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-semibold text-slate-900 truncate">{item.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{item.productCode} • {item.unit}</div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900 whitespace-nowrap">
                      LKR {ourRate.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-blue-600 whitespace-nowrap">
                      LKR {competitorAvg.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-500 whitespace-nowrap text-[11px] font-mono">
                      LKR {competitorMin.toLocaleString()} - {competitorMax.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[11px] font-bold",
                        variancePct > 0 ? "bg-emerald-100 text-emerald-800" :
                        variancePct < 0 ? "bg-rose-100 text-rose-800" :
                        "bg-slate-100 text-slate-700"
                      )}>
                        {variancePct > 0 ? `+${variancePct}% Cheaper` : variancePct < 0 ? `${variancePct}% Higher` : 'Par'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {variancePct > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          <CheckCircle2 size={12} /> Competitive Edge
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                          <AlertTriangle size={12} /> Premium / Review
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
