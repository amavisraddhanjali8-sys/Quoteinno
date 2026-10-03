import React, { useMemo } from 'react';
import { 
  BarChart3, 
  TrendingDown, 
  ShieldAlert, 
  Layers, 
  Wrench, 
  Users, 
  Box, 
  Truck, 
  DollarSign
} from 'lucide-react';
import { 
  ProcurementCostItem, 
  Supplier 
} from '../../../types/procurement';

interface CostIntelligenceAnalyticsViewProps {
  costItems: ProcurementCostItem[];
  suppliers: Supplier[];
  currency?: string;
}

export const CostIntelligenceAnalyticsView: React.FC<CostIntelligenceAnalyticsViewProps> = ({
  costItems,
  suppliers: _suppliers,
  currency = 'LKR'
}) => {
  // Classification breakdown
  const classificationAnalytics = useMemo(() => {
    const classifications = [
      { key: 'RAW_MATERIAL', label: 'Raw Materials & Consumables', icon: Layers, color: 'bg-blue-500' },
      { key: 'OUTSIDE_SERVICE', label: 'Outside Services Rendered', icon: Wrench, color: 'bg-purple-500' },
      { key: 'SUBCONTRACTOR_LABOUR', label: 'Subcontractor Labour', icon: Users, color: 'bg-orange-500' },
      { key: 'EQUIPMENT_PLANT', label: 'Equipment & Plant Hire', icon: Box, color: 'bg-emerald-500' },
      { key: 'LOGISTICS_CONTRACT', label: 'Logistics & Haulage', icon: Truck, color: 'bg-indigo-500' }
    ];

    const totalBenchmark = costItems.reduce((acc, i) => acc + (i.benchmarkCost || 0), 0);

    return classifications.map(c => {
      const items = costItems.filter(i => {
        if (i.classification) return i.classification === c.key;
        if (c.key === 'RAW_MATERIAL') return i.category === 'Materials';
        if (c.key === 'OUTSIDE_SERVICE') return i.category === 'Outside Services' || i.category === 'Services';
        if (c.key === 'SUBCONTRACTOR_LABOUR') return i.category === 'Subcontractor Services';
        if (c.key === 'EQUIPMENT_PLANT') return i.category === 'Equipment & Plant';
        if (c.key === 'LOGISTICS_CONTRACT') return i.category === 'Logistics & Contracts';
        return false;
      });

      const count = items.length;
      const sumBenchmark = items.reduce((acc, i) => acc + (i.benchmarkCost || 0), 0);
      const percent = totalBenchmark > 0 ? (sumBenchmark / totalBenchmark) * 100 : 0;

      return {
        ...c,
        count,
        sumBenchmark,
        percent
      };
    });
  }, [costItems]);

  // Rate variance: Benchmark vs Lowest Vendor Rate
  const rateVarianceData = useMemo(() => {
    let totalBenchmark = 0;
    let totalBestVendor = 0;
    let singleSourceCount = 0;

    costItems.forEach(item => {
      const allRates = [
        ...item.supplierRates,
        ...item.variants.flatMap(v => v.supplierRates)
      ];

      totalBenchmark += item.benchmarkCost;
      if (allRates.length > 0) {
        const bestRate = Math.min(...allRates.map(r => r.baseRate));
        totalBestVendor += bestRate;
        if (allRates.length === 1) singleSourceCount++;
      } else {
        totalBestVendor += item.benchmarkCost;
        singleSourceCount++;
      }
    });

    const potentialSavings = Math.max(0, totalBenchmark - totalBestVendor);
    const savingsPercent = totalBenchmark > 0 ? (potentialSavings / totalBenchmark) * 100 : 0;

    return {
      totalBenchmark,
      totalBestVendor,
      potentialSavings,
      savingsPercent,
      singleSourceCount,
      multiSourceCount: costItems.length - singleSourceCount
    };
  }, [costItems]);

  return (
    <div className="space-y-4 text-xs font-sans">
      {/* 1. Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <BarChart3 size={20} />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              Procurement Cost Intelligence & Spend Analytics
            </h2>
            <p className="text-[11px] text-slate-500">
              Cross-category spend distribution, multi-vendor rate arbitrage, and supply chain vulnerability analysis
            </p>
          </div>
        </div>

        {/* Top 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100">
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-emerald-800 text-xs font-bold">
              <span>Potential Sourcing Savings</span>
              <TrendingDown size={16} className="text-emerald-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-900 my-1">
              {currency} {rateVarianceData.potentialSavings.toLocaleString()}
            </div>
            <div className="text-[11px] text-emerald-700">
              Realized by leveraging lowest approved vendor tier ({rateVarianceData.savingsPercent.toFixed(1)}% savings)
            </div>
          </div>

          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-blue-800 text-xs font-bold">
              <span>Total Benchmark Portfolio</span>
              <DollarSign size={16} className="text-blue-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-blue-900 my-1">
              {currency} {rateVarianceData.totalBenchmark.toLocaleString()}
            </div>
            <div className="text-[11px] text-blue-700">
              Sum of unit benchmark rates across all registered items
            </div>
          </div>

          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-amber-800 text-xs font-bold">
              <span>Multi-Source Health</span>
              <ShieldAlert size={16} className="text-amber-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-amber-900 my-1">
              {rateVarianceData.multiSourceCount} / {costItems.length}
            </div>
            <div className="text-[11px] text-amber-700">
              Cost items with 2+ approved vendors ({rateVarianceData.singleSourceCount} single-source items)
            </div>
          </div>
        </div>
      </div>

      {/* 2. Scope & Classification Breakdown */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
        <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
          Classification Spend Allocation & Scope Distribution
        </h3>

        <div className="space-y-3 pt-2">
          {classificationAnalytics.map(c => {
            const Icon = c.icon;
            return (
              <div key={c.key} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Icon size={14} className="text-slate-600" />
                    <span className="font-bold text-slate-800">{c.label}</span>
                    <span className="text-[10px] text-slate-400 font-mono">({c.count} items)</span>
                  </div>
                  <div className="font-mono font-bold text-slate-900">
                    {currency} {c.sumBenchmark.toLocaleString()} ({c.percent.toFixed(1)}%)
                  </div>
                </div>

                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`${c.color} h-2 rounded-full transition-all duration-500`}
                    style={{ width: `${Math.max(2, c.percent)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
