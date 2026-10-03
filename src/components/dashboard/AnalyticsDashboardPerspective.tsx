import React, { useState, useMemo } from 'react';
import { 
  ProductVariant, 
  ItemCategory, 
  ItemTemplate, 
  Quote, 
  Project 
} from '../../types';
import { 
  Cpu, 
  RefreshCw, 
  Flame, 
  ShieldCheck, 
  Zap, 
  Layers, 
  ArrowUpRight
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { BulkPriceUpdateRule } from '../../services/bomPricingService';
import { PricingIntelligenceDashboard } from '../PricingIntelligenceDashboard';
import { toast } from 'sonner';

export interface AnalyticsDashboardPerspectiveProps {
  variants?: ProductVariant[];
  categories?: ItemCategory[];
  itemTemplates?: ItemTemplate[];
  onApplyBulkPriceUpdate?: (rule: BulkPriceUpdateRule) => void;
  onNavigate?: (view: any) => void;
  quotes?: Quote[];
  projects?: Project[];
  currency?: string;
}

export const AnalyticsDashboardPerspective: React.FC<AnalyticsDashboardPerspectiveProps> = ({
  variants = [],
  categories = [],
  itemTemplates = [],
  onApplyBulkPriceUpdate,
  onNavigate,
  quotes: _quotes = [],
  projects = [],
  currency = 'LKR'
}) => {
  // Mode toggle between Macro Sensitivity Cockpit & Bulk Engine
  const [subView, setSubView] = useState<'SENSITIVITY' | 'BULK_ENGINE'>('SENSITIVITY');

  // Macro shock simulation state
  const [alumexShockPercent, setAlumexShockPercent] = useState<number>(8);
  const [glassShockPercent, setGlassShockPercent] = useState<number>(12);
  const [forexTariffPercent, setForexTariffPercent] = useState<number>(5);

  // Computed sensitivity impact
  const sensitivityCalculations = useMemo(() => {
    // Standard baseline margin across current portfolio
    const baselineMargin = 28.5;
    
    // Weightings of architectural components in total fabrication cost:
    // Aluminium profiles: ~48%
    // Glass panels: ~32%
    // Hardware & accessories: ~12%
    // Sealants & consumables: ~8%
    const weightedCostIncrease = 
      (alumexShockPercent * 0.48) + 
      (glassShockPercent * 0.32) + 
      (forexTariffPercent * 0.20);

    // Erosion of gross margin
    const newMargin = Math.max(0, Number((baselineMargin - (weightedCostIncrease * 0.65)).toFixed(1)));
    const marginErosion = Number((baselineMargin - newMargin).toFixed(1));

    // Calculate dollar exposure across active projects
    const totalActiveVolume = projects
      .filter(p => p.status === 'In Progress')
      .reduce((sum, p) => sum + (Number(p.totalValue) || 0), 0) || 45000000;

    const dollarMarginAtRisk = Math.round(totalActiveVolume * (marginErosion / 100));
    const recommendedPriceHike = Number((weightedCostIncrease * 0.85).toFixed(1));

    return {
      baselineMargin,
      newMargin,
      marginErosion,
      weightedCostIncrease: Number(weightedCostIncrease.toFixed(1)),
      dollarMarginAtRisk,
      recommendedPriceHike,
      totalActiveVolume
    };
  }, [alumexShockPercent, glassShockPercent, forexTariffPercent, projects]);

  const handleApplyRecommendedHike = () => {
    if (onApplyBulkPriceUpdate) {
      onApplyBulkPriceUpdate({
        targetType: 'ALL',
        adjustmentScope: 'SELLING_PRICE',
        mode: 'PERCENTAGE',
        value: sensitivityCalculations.recommendedPriceHike,
        effectiveDate: new Date().toISOString().split('T')[0],
        reason: `Macroeconomic raw material inflation hedge (+${sensitivityCalculations.recommendedPriceHike}%)`,
        updatedBy: 'Chief Estimator & Commercial Director'
      });
      toast.success(`Hedge rule applied: +${sensitivityCalculations.recommendedPriceHike}% selling price adjustment`);
    } else {
      toast.info(`Simulated adjustment: +${sensitivityCalculations.recommendedPriceHike}% price hedge`);
    }
  };

  const handleResetShocks = () => {
    setAlumexShockPercent(0);
    setGlassShockPercent(0);
    setForexTariffPercent(0);
    toast.info('Macroeconomic shock parameters reset to baseline.');
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* 1. Analytics Header & Perspectives Navigator - Single Line */}
      <div className="bg-white border border-slate-200/80 px-5 py-2.5 rounded-xl flex items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Cpu size={16} />
          </div>
          <div className="flex items-baseline gap-2 min-w-0">
            <h2 className="text-sm font-bold text-slate-900 whitespace-nowrap">
              Analytics
            </h2>
            <span className="text-xs text-slate-500 font-normal truncate hidden sm:inline">
              • Macro Sensitivity & Pricing Radar
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setSubView('SENSITIVITY')}
              className={cn(
                "px-2.5 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5",
                subView === 'SENSITIVITY' 
                  ? "bg-white text-orange-600 shadow-2xs" 
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <Zap size={13} className={subView === 'SENSITIVITY' ? "text-orange-500" : "text-slate-400"} />
              <span>Sensitivity Radar</span>
            </button>
            <button
              onClick={() => setSubView('BULK_ENGINE')}
              className={cn(
                "px-2.5 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5",
                subView === 'BULK_ENGINE' 
                  ? "bg-white text-orange-600 shadow-2xs" 
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <Layers size={13} className={subView === 'BULK_ENGINE' ? "text-orange-500" : "text-slate-400"} />
              <span>Bulk Updater</span>
            </button>
          </div>

          {onNavigate && (
            <button
              onClick={() => onNavigate('post-evaluation')}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1"
            >
              <span>Variance Audit</span>
              <ArrowUpRight size={13} />
            </button>
          )}
        </div>
      </div>

      {subView === 'SENSITIVITY' ? (
        <>
          {/* 2. Key Analytical Sensitivity KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
              <span className="text-xs text-slate-500 block">Baseline Portfolio Margin</span>
              <p className="text-xl font-bold text-slate-900 mt-1">{sensitivityCalculations.baselineMargin}%</p>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Approved quotation baseline</span>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
              <span className="text-xs text-slate-500 block">Simulated Post-Shock Margin</span>
              <p className={cn(
                "text-xl font-bold mt-1",
                sensitivityCalculations.newMargin >= 22 ? "text-emerald-600" :
                sensitivityCalculations.newMargin >= 16 ? "text-amber-600" : "text-rose-600"
              )}>
                {sensitivityCalculations.newMargin}%
              </p>
              <span className="text-[10px] text-rose-500 font-medium mt-0.5 block">
                -{sensitivityCalculations.marginErosion}% Margin Erosion
              </span>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
              <span className="text-xs text-slate-500 block">Dollar Margin at Risk</span>
              <p className="text-xl font-bold text-rose-600 mt-1 font-mono">
                {currency} {(sensitivityCalculations.dollarMarginAtRisk / 1000000).toFixed(2)}M
              </p>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Across {currency} {(sensitivityCalculations.totalActiveVolume / 1000000).toFixed(1)}M active sites</span>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
              <span className="text-xs text-slate-500 block">Recommended Price Hedge</span>
              <p className="text-xl font-bold text-blue-600 mt-1">+{sensitivityCalculations.recommendedPriceHike}%</p>
              <span className="text-[10px] text-slate-400 mt-0.5 block">To preserve target 25% margin</span>
            </div>
          </div>

          {/* 3. Interactive Macroeconomic Shock Simulator Controls */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <Flame size={16} className="text-orange-500" />
                  <h3 className="text-sm font-bold text-slate-900">Macroeconomic Raw Material Shock Simulator</h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Adjust market shocks to see real-time dynamic impact on direct fabrication costs and project gross profitability.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleResetShocks}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1"
                >
                  <RefreshCw size={12} />
                  <span>Reset</span>
                </button>
                <button
                  onClick={handleApplyRecommendedHike}
                  className="px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-semibold transition-colors shadow-2xs flex items-center gap-1.5"
                >
                  <ShieldCheck size={13} />
                  <span>Commit Price Hedge (+{sensitivityCalculations.recommendedPriceHike}%)</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4">
              {/* Slider 1: Aluminium Extrusion Spot Surcharge */}
              <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                    <span className="text-xs font-bold text-slate-900">Aluminium Extrusion (Alumex)</span>
                  </div>
                  <span className="text-xs font-bold text-orange-600 font-mono">+{alumexShockPercent}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  step="1"
                  value={alumexShockPercent}
                  onChange={(e) => setAlumexShockPercent(Number(e.target.value))}
                  className="w-full accent-orange-500 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1.5">
                  <span>0% (Baseline)</span>
                  <span>+15% Spot Spike</span>
                  <span>+30% Severe</span>
                </div>
                <span className="text-[10px] text-slate-500 mt-2 block">
                  Represents 48% of curtain wall unit direct material cost.
                </span>
              </div>

              {/* Slider 2: Architectural Glass Fuel & Energy Levy */}
              <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <span className="text-xs font-bold text-slate-900">Float & Tempered Glass Surcharge</span>
                  </div>
                  <span className="text-xs font-bold text-blue-600 font-mono">+{glassShockPercent}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  step="1"
                  value={glassShockPercent}
                  onChange={(e) => setGlassShockPercent(Number(e.target.value))}
                  className="w-full accent-blue-500 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1.5">
                  <span>0% (Baseline)</span>
                  <span>+15% Fuel Surcharge</span>
                  <span>+30% Severe</span>
                </div>
                <span className="text-[10px] text-slate-500 mt-2 block">
                  Represents 32% of unit cost (furnace fuel & gas freight levy).
                </span>
              </div>

              {/* Slider 3: Import Forex & Tariff Fluctuation */}
              <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-xs font-bold text-slate-900">Hardware & Sealant Import Tariff</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 font-mono">+{forexTariffPercent}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  step="1"
                  value={forexTariffPercent}
                  onChange={(e) => setForexTariffPercent(Number(e.target.value))}
                  className="w-full accent-emerald-500 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1.5">
                  <span>0% (Stable)</span>
                  <span>+15% Devaluation</span>
                  <span>+30% Duty Hike</span>
                </div>
                <span className="text-[10px] text-slate-500 mt-2 block">
                  Affects Kinlong hardware, structural silicone and EPDM gaskets.
                </span>
              </div>
            </div>
          </div>

          {/* 4. Component Rate Vulnerability Ledger */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Component Rate Exposure & Health Watchdog</h3>
                <p className="text-xs text-slate-500">Live vulnerability matrix across standard fabrication line items.</p>
              </div>
              <span className="text-xs text-slate-400">Target Standard: SLS 1283 / ISO 9001</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400">
                    <th className="py-2.5">Component / Specification</th>
                    <th className="py-2.5">Material Sub-Category</th>
                    <th className="py-2.5 text-right">Standard Rate</th>
                    <th className="py-2.5 text-right">Simulated Rate</th>
                    <th className="py-2.5 text-right">Delta ($)</th>
                    <th className="py-2.5 text-center">Vulnerability Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 font-semibold text-slate-900">Alumex 6063-T6 100mm Mullion Profile</td>
                    <td className="py-2.5 text-slate-600">Aluminium Extrusion</td>
                    <td className="py-2.5 text-right font-mono text-slate-700">LKR 4,250 / m</td>
                    <td className="py-2.5 text-right font-mono font-bold text-rose-600">
                      LKR {Math.round(4250 * (1 + (alumexShockPercent / 100))).toLocaleString()} / m
                    </td>
                    <td className="py-2.5 text-right font-mono text-rose-600">
                      +{Math.round(4250 * (alumexShockPercent / 100)).toLocaleString()}
                    </td>
                    <td className="py-2.5 text-center">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-semibold border",
                        alumexShockPercent > 10 ? "bg-rose-50 text-rose-700 border-rose-200" :
                        alumexShockPercent > 0 ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      )}>
                        {alumexShockPercent > 10 ? 'Severe Exposure' : alumexShockPercent > 0 ? 'Moderate Alert' : 'Protected'}
                      </span>
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 font-semibold text-slate-900">12mm Clear Tempered Architectural Glass</td>
                    <td className="py-2.5 text-slate-600">Float / Heat Strengthened</td>
                    <td className="py-2.5 text-right font-mono text-slate-700">LKR 8,400 / m²</td>
                    <td className="py-2.5 text-right font-mono font-bold text-rose-600">
                      LKR {Math.round(8400 * (1 + (glassShockPercent / 100))).toLocaleString()} / m²
                    </td>
                    <td className="py-2.5 text-right font-mono text-rose-600">
                      +{Math.round(8400 * (glassShockPercent / 100)).toLocaleString()}
                    </td>
                    <td className="py-2.5 text-center">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-semibold border",
                        glassShockPercent > 10 ? "bg-rose-50 text-rose-700 border-rose-200" :
                        glassShockPercent > 0 ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      )}>
                        {glassShockPercent > 10 ? 'High Exposure' : glassShockPercent > 0 ? 'Watching' : 'Protected'}
                      </span>
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 font-semibold text-slate-900">Dow Corning 995 Structural Silicone Adhesive</td>
                    <td className="py-2.5 text-slate-600">Structural Glazing Sealant</td>
                    <td className="py-2.5 text-right font-mono text-slate-700">LKR 3,600 / sausage</td>
                    <td className="py-2.5 text-right font-mono font-bold text-rose-600">
                      LKR {Math.round(3600 * (1 + (forexTariffPercent / 100))).toLocaleString()} / sausage
                    </td>
                    <td className="py-2.5 text-right font-mono text-rose-600">
                      +{Math.round(3600 * (forexTariffPercent / 100)).toLocaleString()}
                    </td>
                    <td className="py-2.5 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Hedging Safe
                      </span>
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 font-semibold text-slate-900">Kinlong Multipoint Locking Gearbox</td>
                    <td className="py-2.5 text-slate-600">Architectural Hardware</td>
                    <td className="py-2.5 text-right font-mono text-slate-700">LKR 4,950 / set</td>
                    <td className="py-2.5 text-right font-mono font-bold text-rose-600">
                      LKR {Math.round(4950 * (1 + (forexTariffPercent / 100))).toLocaleString()} / set
                    </td>
                    <td className="py-2.5 text-right font-mono text-rose-600">
                      +{Math.round(4950 * (forexTariffPercent / 100)).toLocaleString()}
                    </td>
                    <td className="py-2.5 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Inventory Backed
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* 5. Embedded Full Pricing Intelligence Dashboard */
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <PricingIntelligenceDashboard
            variants={variants}
            categories={categories}
            itemTemplates={itemTemplates}
            onApplyBulkPriceUpdate={onApplyBulkPriceUpdate || (() => {})}
          />
        </div>
      )}
    </div>
  );
};
