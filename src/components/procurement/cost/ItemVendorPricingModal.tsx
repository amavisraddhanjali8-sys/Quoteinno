import React, { useState } from 'react';
import { 
  X, 
  Building2, 
  Plus, 
  Trash2, 
  Calculator, 
  Star, 
  Clock, 
  CheckCircle2
} from 'lucide-react';
import { 
  ProcurementCostItem, 
  ItemSupplierRate, 
  SupplierPriceRange 
} from '../../../types/procurement';
import { procurementCostService } from '../../../services/procurementCostService';
import { getCostItemImageUrl, getCostItemFallbackSvg } from './costItemImages';

interface ItemVendorPricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: ProcurementCostItem | null;
  currency?: string;
  onRefresh: () => void;
}

export const ItemVendorPricingModal: React.FC<ItemVendorPricingModalProps> = ({
  isOpen,
  onClose,
  item,
  currency = 'LKR',
  onRefresh
}) => {
  const [calcQty, setCalcQty] = useState<number>(100);
  const [isAddingVendor, setIsAddingVendor] = useState(false);

  // New Vendor Form
  const [newVendorName, setNewVendorName] = useState('');
  const [newVendorCode, setNewVendorCode] = useState('');
  const [newBaseRate, setNewBaseRate] = useState<number>(item?.benchmarkCost || 100);
  const [newMoq, setNewMoq] = useState<number>(10);
  const [newLeadTime, setNewLeadTime] = useState<number>(14);
  const [newRating, setNewRating] = useState<number>(4.8);
  const [isPreferred, setIsPreferred] = useState(false);
  const [tiers, setTiers] = useState<SupplierPriceRange[]>([
    { minQty: 1, maxQty: 50, unitPrice: (item?.benchmarkCost || 100) * 1.05 },
    { minQty: 51, maxQty: 200, unitPrice: item?.benchmarkCost || 100 },
    { minQty: 201, unitPrice: (item?.benchmarkCost || 100) * 0.92 }
  ]);

  if (!isOpen || !item) return null;

  // Collect all rates: item-level and variant-level
  const allRates: ItemSupplierRate[] = [
    ...(item.supplierRates || []),
    ...(item.variants?.flatMap(v => v.supplierRates) || [])
  ];

  const benchmark = item.benchmarkCost;
  const lowestBaseRate = allRates.length > 0 
    ? Math.min(...allRates.map(r => r.baseRate)) 
    : benchmark;

  // Calculate Best Tier for Qty
  let bestQuote: {
    vendorName: string;
    vendorCode: string;
    unitPrice: number;
    tierDescription: string;
    savingsPercent: number;
  } | null = null;

  if (allRates.length > 0 && calcQty > 0) {
    let minPrice = Infinity;
    let selectedQuote = null;

    allRates.forEach(rate => {
      let applicablePrice = rate.baseRate;
      let tierDesc = `Base MOQ ${rate.minimumOrderQty}+`;

      // Check tiered ranges
      if (rate.priceRanges && rate.priceRanges.length > 0) {
        const sorted = [...rate.priceRanges].sort((a, b) => b.minQty - a.minQty);
        const match = sorted.find(t => calcQty >= t.minQty);
        if (match) {
          applicablePrice = match.unitPrice;
          tierDesc = match.maxQty ? `MOQ Bracket ${match.minQty} - ${match.maxQty}` : `Volume Tier ${match.minQty}+`;
        }
      }

      if (applicablePrice < minPrice) {
        minPrice = applicablePrice;
        const savings = benchmark > 0 ? ((benchmark - applicablePrice) / benchmark) * 100 : 0;
        selectedQuote = {
          vendorName: rate.supplierName,
          vendorCode: rate.vendorCode,
          unitPrice: applicablePrice,
          tierDescription: tierDesc,
          savingsPercent: Math.round(savings * 10) / 10
        };
      }
    });

    bestQuote = selectedQuote;
  }

  const handleAddTierRow = () => {
    const lastTier = tiers[tiers.length - 1];
    const newMin = lastTier ? (lastTier.maxQty ? lastTier.maxQty + 1 : lastTier.minQty + 100) : 1;
    setTiers([
      ...tiers,
      { minQty: newMin, unitPrice: Math.round(newBaseRate * 0.9) }
    ]);
  };

  const handleRemoveTier = (idx: number) => {
    setTiers(tiers.filter((_, i) => i !== idx));
  };

  const handleUpdateTier = (idx: number, field: keyof SupplierPriceRange, val: any) => {
    const next = [...tiers];
    next[idx] = { ...next[idx], [field]: val };
    setTiers(next);
  };

  const handleSaveNewVendor = () => {
    if (!newVendorName.trim() || newBaseRate <= 0) return;

    procurementCostService.addSupplierRateToItem(item.id, null, {
      supplierName: newVendorName.trim(),
      vendorCode: newVendorCode.trim() || `VND-${Math.floor(100 + Math.random() * 900)}`,
      currency,
      baseRate: Number(newBaseRate),
      minimumOrderQty: Number(newMoq),
      leadTimeDays: Number(newLeadTime),
      rating: Number(newRating),
      isPreferred,
      priceRanges: tiers
    });

    setIsAddingVendor(false);
    setNewVendorName('');
    onRefresh();
  };

  const imgUrl = getCostItemImageUrl(item);

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 aspect-square rounded-lg overflow-hidden border border-white/20 bg-slate-800 shrink-0">
              <img 
                src={imgUrl} 
                alt={item.name} 
                onError={(e) => {
                  e.currentTarget.src = getCostItemFallbackSvg(item.category || item.classification, item.name);
                }}
                className="w-full h-full object-cover" 
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-orange-500 text-white">
                  PK: {item.itemCode}
                </span>
                {item.projectCode && (
                  <span className="font-mono text-xs text-orange-200 bg-white/10 px-2 py-0.5 rounded">
                    FK: {item.projectCode}
                  </span>
                )}
                <span className="text-xs text-slate-300 font-medium">{item.category}</span>
              </div>
              <h2 className="font-bold text-sm sm:text-base text-white mt-0.5 truncate max-w-xl">
                {item.name}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-50 custom-scrollbar">
          {/* Top Quick Rates & Interactive MOQ Calculator */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Benchmark vs Lowest */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Rate Benchmarks
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500">Internal Benchmark</span>
                  <div className="text-sm font-bold font-mono text-slate-900">
                    {currency} {benchmark.toLocaleString()} <span className="text-[10px] text-slate-400">/{item.primaryUnit}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500">Best Registered Quote</span>
                  <div className="text-sm font-bold font-mono text-emerald-700">
                    {currency} {lowestBaseRate.toLocaleString()} <span className="text-[10px] text-slate-400">/{item.primaryUnit}</span>
                  </div>
                </div>
              </div>
              <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
                <span>Total Registered Vendors:</span>
                <strong className="text-slate-800">{allRates.length} Vendors</strong>
              </div>
            </div>

            {/* Interactive Quantity Simulator */}
            <div className="md:col-span-2 bg-gradient-to-br from-emerald-50 to-teal-50/60 p-3.5 rounded-xl border border-emerald-200/80 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                  <Calculator size={14} className="text-emerald-600" />
                  <span>Interactive MOQ Rate & Volume Discount Evaluator</span>
                </div>
                <span className="text-[10px] text-emerald-700 font-semibold">Simulate Purchase Order</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-emerald-800">
                    Order Quantity ({item.primaryUnit}):
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={calcQty}
                    onChange={(e) => setCalcQty(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-mono font-bold text-emerald-950 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {bestQuote ? (
                  <div className="bg-white/80 p-2.5 rounded-lg border border-emerald-200 text-xs space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-emerald-700 uppercase">Optimal Vendor:</span>
                      <span className="font-bold text-slate-900">{bestQuote.vendorName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Tier Qualified:</span>
                      <span className="font-mono text-emerald-800 font-semibold">{bestQuote.tierDescription}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-emerald-100">
                      <span className="font-bold text-slate-900">Net Rate:</span>
                      <span className="font-mono font-bold text-emerald-700 text-sm">
                        {currency} {bestQuote.unitPrice.toLocaleString()} /{item.primaryUnit}
                        {bestQuote.savingsPercent > 0 && (
                          <span className="ml-1 text-[10px] text-emerald-600 font-semibold">(-{bestQuote.savingsPercent}%)</span>
                        )}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 italic">No quotes available for evaluation.</div>
                )}
              </div>
            </div>
          </div>

          {/* Vendors & Price Range Matrix Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                  Approved Vendor Multi-Tier Pricing Schedule
                </h3>
                <p className="text-[11px] text-slate-400">
                  Multiple suppliers with volume MOQ bracket ranges, lead times and quality ratings
                </p>
              </div>

              {!isAddingVendor && (
                <button
                  onClick={() => setIsAddingVendor(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <Plus size={13} />
                  <span>Add Vendor Quote</span>
                </button>
              )}
            </div>

            {/* Vendor Form if adding */}
            {isAddingVendor && (
              <div className="p-4 bg-orange-50/40 border-b border-orange-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-orange-900 flex items-center gap-1.5">
                    <Building2 size={13} className="text-orange-500" />
                    <span>New Approved Vendor & Volume Range Schedule</span>
                  </h4>
                  <button
                    onClick={() => setIsAddingVendor(false)}
                    className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Vendor / Supplier Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Alumex PLC / Emirates Glass"
                      value={newVendorName}
                      onChange={(e) => setNewVendorName(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Vendor Code</label>
                    <input
                      type="text"
                      placeholder="e.g. VND-ALU-01"
                      value={newVendorCode}
                      onChange={(e) => setNewVendorCode(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Base Rate ({currency}) *</label>
                    <input
                      type="number"
                      value={newBaseRate}
                      onChange={(e) => setNewBaseRate(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Standard MOQ ({item.primaryUnit})</label>
                    <input
                      type="number"
                      value={newMoq}
                      onChange={(e) => setNewMoq(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Lead Time (Days)</label>
                    <input
                      type="number"
                      value={newLeadTime}
                      onChange={(e) => setNewLeadTime(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Supplier Rating (★)</label>
                    <input
                      type="number"
                      step="0.1"
                      max="5"
                      min="1"
                      value={newRating}
                      onChange={(e) => setNewRating(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isPreferredCheck"
                    checked={isPreferred}
                    onChange={(e) => setIsPreferred(e.target.checked)}
                    className="w-4 h-4 rounded text-orange-600 cursor-pointer"
                  />
                  <label htmlFor="isPreferredCheck" className="text-xs font-semibold text-slate-700 cursor-pointer">
                    Designate as Preferred Vendor for this Cost Item
                  </label>
                </div>

                {/* Tier Ranges */}
                <div className="space-y-2 pt-2 border-t border-orange-200/60">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700">Volume MOQ Tiers (Price Matrix):</span>
                    <button
                      type="button"
                      onClick={handleAddTierRow}
                      className="text-[11px] font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={11} /> Add MOQ Tier
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    {tiers.map((t, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs">
                        <span className="text-slate-400 font-mono text-[10px] w-6">#{idx + 1}</span>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-slate-500">Min:</span>
                          <input
                            type="number"
                            value={t.minQty}
                            onChange={(e) => handleUpdateTier(idx, 'minQty', Number(e.target.value))}
                            className="w-20 px-2 py-1 bg-white border border-slate-200 rounded text-xs font-mono"
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-slate-500">Max:</span>
                          <input
                            type="number"
                            placeholder="∞ (Above)"
                            value={t.maxQty || ''}
                            onChange={(e) => handleUpdateTier(idx, 'maxQty', e.target.value ? Number(e.target.value) : undefined)}
                            className="w-20 px-2 py-1 bg-white border border-slate-200 rounded text-xs font-mono"
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-slate-500">Rate ({currency}):</span>
                          <input
                            type="number"
                            value={t.unitPrice}
                            onChange={(e) => handleUpdateTier(idx, 'unitPrice', Number(e.target.value))}
                            className="w-24 px-2 py-1 bg-white border border-slate-200 rounded text-xs font-mono font-bold"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveTier(idx)}
                          className="p-1 text-slate-400 hover:text-red-500 rounded cursor-pointer"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    onClick={() => setIsAddingVendor(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveNewVendor}
                    className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
                  >
                    Save Vendor Quote
                  </button>
                </div>
              </div>
            )}

            {/* List of Vendors */}
            <div className="divide-y divide-slate-100">
              {allRates.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No supplier quotes registered for this cost item yet.
                </div>
              ) : (
                allRates.map((rate, rIdx) => {
                  const ranges = rate.priceRanges || [];

                  return (
                    <div key={rate.id || rIdx} className="p-4 hover:bg-slate-50/60 transition-colors space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 font-bold shrink-0">
                            <Building2 size={16} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                                {rate.supplierName}
                              </h4>
                              <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                {rate.vendorCode}
                              </span>
                              {rate.isPreferred && (
                                <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                                  ★ Preferred
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-[11px] text-slate-500">
                              <span className="flex items-center gap-0.5">
                                <Clock size={11} className="text-slate-400" /> Lead Time: {rate.leadTimeDays} days
                              </span>
                              <span className="flex items-center gap-0.5">
                                <Star size={11} className="text-amber-500 fill-amber-500" /> {rate.rating} / 5.0
                              </span>
                              <span>Base MOQ: <strong>{rate.minimumOrderQty} {item.primaryUnit}</strong></span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-[10px] text-slate-400">Base Unit Rate</div>
                          <div className="font-mono font-bold text-slate-900 text-sm">
                            {currency} {rate.baseRate.toLocaleString()} <span className="text-[10px] font-normal text-slate-400">/{item.primaryUnit}</span>
                          </div>
                        </div>
                      </div>

                      {/* MOQ Ranges Grid */}
                      <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
                          <span>MOQ Quantity Tier Pricing</span>
                          <span className="text-[9px] font-mono text-slate-400">{ranges.length} Brackets</span>
                        </div>

                        {ranges.length === 0 ? (
                          <div className="text-slate-400 text-[11px] italic">
                            Flat unit price applies ({currency} {rate.baseRate.toLocaleString()} /{item.primaryUnit}).
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {ranges.map((rng, rngIdx) => {
                              const isEligible = calcQty >= rng.minQty && (!rng.maxQty || calcQty <= rng.maxQty);
                              const discount = benchmark > 0 ? Math.round(((benchmark - rng.unitPrice) / benchmark) * 100) : 0;

                              return (
                                <div
                                  key={rngIdx}
                                  className={`p-2 rounded-lg border text-xs transition-all ${
                                    isEligible 
                                      ? 'bg-emerald-50 border-emerald-300 ring-1 ring-emerald-400 shadow-2xs' 
                                      : 'bg-white border-slate-200'
                                  }`}
                                >
                                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-0.5">
                                    <span>
                                      {rng.maxQty ? `${rng.minQty} - ${rng.maxQty}` : `${rng.minQty}+`} {item.primaryUnit}
                                    </span>
                                    {discount > 0 && (
                                      <span className="text-emerald-700 font-bold">-{discount}%</span>
                                    )}
                                  </div>
                                  <div className="font-mono font-bold text-slate-900 text-xs">
                                    {currency} {rng.unitPrice.toLocaleString()}
                                  </div>
                                  {isEligible && (
                                    <div className="text-[9px] font-bold text-emerald-700 mt-0.5 flex items-center gap-0.5">
                                      <CheckCircle2 size={10} /> Active Tier
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500">
            Connected to <strong>{item.itemCode}</strong> Procurement Matrix
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            Close Matrix View
          </button>
        </div>
      </div>
    </div>
  );
};
