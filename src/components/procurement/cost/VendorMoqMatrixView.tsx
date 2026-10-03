import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Plus, 
  Trash2, 
  Edit2, 
  Calculator, 
  Award, 
  Star, 
  Search, 
  SlidersHorizontal, 
  X
} from 'lucide-react';
import { 
  ProcurementCostItem, 
  ItemSupplierRate, 
  SupplierPriceRange, 
  Supplier 
} from '../../../types/procurement';
import { procurementCostService } from '../../../services/procurementCostService';

interface VendorMoqMatrixViewProps {
  costItems: ProcurementCostItem[];
  suppliers: Supplier[];
  currency?: string;
  onRefreshItems: () => void;
  initialSelectedItemId?: string;
}

export const VendorMoqMatrixView: React.FC<VendorMoqMatrixViewProps> = ({
  costItems,
  suppliers,
  currency = 'LKR',
  onRefreshItems,
  initialSelectedItemId
}) => {
  const [selectedItemId, setSelectedItemId] = useState<string>(
    initialSelectedItemId || (costItems[0]?.id || '')
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [calculatorQty, setCalculatorQty] = useState<number>(250);

  // Modal to Add/Edit Vendor Rate
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<ItemSupplierRate | null>(null);

  // Rate Form State
  const [selectedSupplierId, setSelectedSupplierId] = useState(suppliers[0]?.id || '');
  const [baseRate, setBaseRate] = useState<number>(100);
  const [minOrderQty, setMinOrderQty] = useState<number>(10);
  const [leadTimeDays, setLeadTimeDays] = useState<number>(14);
  const [isPreferred, setIsPreferred] = useState<boolean>(false);
  const [taxRatePercent, setTaxRatePercent] = useState<number>(5);
  const [rateNotes, setRateNotes] = useState<string>('');
  const [priceRanges, setPriceRanges] = useState<SupplierPriceRange[]>([
    { minQty: 1, maxQty: 50, unitPrice: 115, leadTimeDays: 14, notes: 'Small Job Tier' },
    { minQty: 51, maxQty: 200, unitPrice: 100, leadTimeDays: 12, notes: 'Standard MOQ Batch' },
    { minQty: 201, unitPrice: 90, leadTimeDays: 10, notes: 'Volume Campaign Tier' }
  ]);

  const selectedItem = useMemo(() => {
    return costItems.find(i => i.id === selectedItemId || i.itemCode === selectedItemId) || costItems[0];
  }, [costItems, selectedItemId]);

  // Aggregate all supplier rates for this item
  const supplierRates = useMemo(() => {
    if (!selectedItem) return [];
    const directRates = selectedItem.supplierRates || [];
    const variantRates = (selectedItem.variants || []).flatMap(v => v.supplierRates || []);
    // Deduplicate by id
    const map = new Map<string, ItemSupplierRate>();
    [...directRates, ...variantRates].forEach(r => map.set(r.id, r));
    return Array.from(map.values());
  }, [selectedItem]);

  // Interactive MOQ Calculator: find best vendor and tier for calculatorQty
  const calculatorResults = useMemo(() => {
    if (!selectedItem || supplierRates.length === 0) return null;

    const qty = Math.max(1, calculatorQty);
    const benchmarkTotal = qty * selectedItem.benchmarkCost;

    const vendorOptions = supplierRates.map(sup => {
      // Find matching tier
      let matchedPrice = sup.baseRate;
      let matchedTierIndex = -1;
      let matchedLeadTime = sup.leadTimeDays;

      if (sup.priceRanges && sup.priceRanges.length > 0) {
        const sorted = [...sup.priceRanges].sort((a, b) => b.minQty - a.minQty);
        const tier = sorted.find(t => qty >= t.minQty);
        if (tier) {
          matchedPrice = tier.unitPrice;
          matchedTierIndex = sup.priceRanges.indexOf(tier);
          if (tier.leadTimeDays) matchedLeadTime = tier.leadTimeDays;
        }
      }

      const totalWithoutTax = qty * matchedPrice;
      const taxAmount = totalWithoutTax * ((sup.taxRatePercent || 0) / 100);
      const totalPayable = totalWithoutTax + taxAmount;
      const savingsVsBenchmark = benchmarkTotal - totalWithoutTax;
      const savingsPercent = benchmarkTotal > 0 ? (savingsVsBenchmark / benchmarkTotal) * 100 : 0;

      return {
        supplierId: sup.supplierId,
        supplierName: sup.supplierName,
        vendorCode: sup.vendorCode,
        rating: sup.rating,
        isPreferred: sup.isPreferred,
        unitPrice: matchedPrice,
        matchedTierIndex,
        totalWithoutTax,
        taxAmount,
        totalPayable,
        savingsVsBenchmark,
        savingsPercent,
        leadTimeDays: matchedLeadTime
      };
    });

    vendorOptions.sort((a, b) => a.totalPayable - b.totalPayable);
    const winner = vendorOptions[0];

    return {
      qty,
      benchmarkTotal,
      winner,
      allVendors: vendorOptions
    };
  }, [selectedItem, supplierRates, calculatorQty]);

  // Open modal to add new rate
  const handleOpenAddRate = () => {
    setEditingRate(null);
    setSelectedSupplierId(suppliers[0]?.id || '');
    setBaseRate(selectedItem?.benchmarkCost || 100);
    setMinOrderQty(10);
    setLeadTimeDays(14);
    setIsPreferred(false);
    setTaxRatePercent(5);
    setRateNotes('');
    setPriceRanges([
      { minQty: 1, maxQty: 50, unitPrice: Math.round((selectedItem?.benchmarkCost || 100) * 1.08), leadTimeDays: 14, notes: 'Small Run' },
      { minQty: 51, maxQty: 200, unitPrice: selectedItem?.benchmarkCost || 100, leadTimeDays: 12, notes: 'Standard MOQ Tier' },
      { minQty: 201, unitPrice: Math.round((selectedItem?.benchmarkCost || 100) * 0.92), leadTimeDays: 10, notes: 'Volume Discount' }
    ]);
    setIsRateModalOpen(true);
  };

  // Open modal to edit existing rate
  const handleOpenEditRate = (rate: ItemSupplierRate) => {
    setEditingRate(rate);
    setSelectedSupplierId(rate.supplierId);
    setBaseRate(rate.baseRate);
    setMinOrderQty(rate.minimumOrderQty);
    setLeadTimeDays(rate.leadTimeDays);
    setIsPreferred(rate.isPreferred);
    setTaxRatePercent(rate.taxRatePercent || 5);
    setRateNotes(rate.notes || '');
    setPriceRanges(rate.priceRanges && rate.priceRanges.length > 0 ? [...rate.priceRanges] : [
      { minQty: 1, unitPrice: rate.baseRate }
    ]);
    setIsRateModalOpen(true);
  };

  // Save Rate to Service
  const handleSaveRateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    const targetSup = suppliers.find(s => s.id === selectedSupplierId);

    if (editingRate) {
      procurementCostService.updateSupplierRate(selectedItem.id, editingRate.id, {
        supplierId: targetSup?.id || selectedSupplierId,
        supplierName: targetSup?.name || editingRate.supplierName,
        vendorCode: targetSup?.vendorCode || editingRate.vendorCode,
        baseRate: Number(baseRate),
        minimumOrderQty: Number(minOrderQty),
        leadTimeDays: Number(leadTimeDays),
        isPreferred,
        taxRatePercent: Number(taxRatePercent),
        notes: rateNotes,
        priceRanges: priceRanges.map(t => ({
          minQty: Number(t.minQty),
          maxQty: t.maxQty ? Number(t.maxQty) : undefined,
          unitPrice: Number(t.unitPrice),
          leadTimeDays: Number(t.leadTimeDays || leadTimeDays),
          notes: t.notes || ''
        }))
      });
    } else {
      procurementCostService.addSupplierRateToItem(selectedItem.id, null, {
        supplierId: targetSup?.id || selectedSupplierId,
        supplierName: targetSup?.name || 'Approved Strategic Vendor',
        vendorCode: targetSup?.vendorCode || 'VND-STR',
        currency,
        baseRate: Number(baseRate),
        minimumOrderQty: Number(minOrderQty),
        leadTimeDays: Number(leadTimeDays),
        rating: targetSup?.rating || 4.8,
        isPreferred,
        taxRatePercent: Number(taxRatePercent),
        notes: rateNotes,
        priceRanges: priceRanges.map(t => ({
          minQty: Number(t.minQty),
          maxQty: t.maxQty ? Number(t.maxQty) : undefined,
          unitPrice: Number(t.unitPrice),
          leadTimeDays: Number(t.leadTimeDays || leadTimeDays),
          notes: t.notes || ''
        }))
      });
    }

    setIsRateModalOpen(false);
    onRefreshItems();
  };

  const handleDeleteRate = (rateId: string) => {
    if (!selectedItem) return;
    if (confirm('Delete this vendor supplier rate schedule?')) {
      procurementCostService.deleteSupplierRate(selectedItem.id, rateId);
      onRefreshItems();
    }
  };

  const filteredItems = costItems.filter(i => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return i.itemCode.toLowerCase().includes(q) ||
      i.name.toLowerCase().includes(q) ||
      i.category.toLowerCase().includes(q) ||
      (i.subCategory && i.subCategory.toLowerCase().includes(q));
  });

  return (
    <div className="space-y-4 text-xs font-sans">
      {/* 1. Cost Item Picker Ribbon */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-3 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <SlidersHorizontal size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
              Select Cost Item for Multi-Vendor MOQ Pricing
            </label>
            <select
              value={selectedItem?.id}
              onChange={(e) => setSelectedItemId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold text-slate-900 focus:outline-none focus:border-orange-500 cursor-pointer"
            >
              {filteredItems.map(item => (
                <option key={item.id} value={item.id}>
                  [{item.itemCode}] {item.name} — {item.category} ({currency} {item.benchmarkCost} / {item.primaryUnit})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search Filter for Picker */}
        <div className="relative min-w-[200px]">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search cost items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-orange-500"
          />
        </div>

        <button
          onClick={handleOpenAddRate}
          className="flex items-center gap-1.5 px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
        >
          <Plus size={13} />
          <span>Add Approved Vendor & MOQ Schedule</span>
        </button>
      </div>

      {/* Selected Item Overview Strip */}
      {selectedItem && (
        <div className="bg-slate-900 text-white rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold bg-orange-500 text-white px-2 py-0.5 rounded">
                PK: {selectedItem.itemCode}
              </span>
              <span className="text-xs text-slate-300 font-semibold">
                {selectedItem.category} • {selectedItem.subCategory || 'General'}
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-bold text-white">
              {selectedItem.name}
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl line-clamp-1">
              {selectedItem.description || selectedItem.specificationRef || 'No technical notes recorded.'}
            </p>
          </div>

          <div className="flex items-center gap-6 shrink-0">
            <div className="text-right">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Benchmark Cost</div>
              <div className="text-lg font-bold font-mono text-amber-400">
                {currency} {selectedItem.benchmarkCost.toLocaleString()} <span className="text-xs text-slate-300">/ {selectedItem.primaryUnit}</span>
              </div>
            </div>

            <div className="text-right border-l border-slate-700 pl-6">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Approved Vendors</div>
              <div className="text-lg font-bold font-mono text-emerald-400">
                {supplierRates.length} <span className="text-xs text-slate-300">Vendors Linked</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Interactive MOQ Order Optimizer & Rate Calculator */}
      {calculatorResults && (
        <div className="bg-gradient-to-r from-orange-50/80 via-amber-50/60 to-white rounded-xl border border-orange-200 p-4 shadow-2xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-orange-500 text-white flex items-center justify-center">
                <Calculator size={15} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                  Interactive MOQ Rate Calculator & Volume Tier Optimizer
                </h3>
                <p className="text-[11px] text-slate-500">
                  Simulate exact order volumes across all vendor price brackets to find the lowest cost consignment
                </p>
              </div>
            </div>

            {/* Quantity Input */}
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-orange-300 shadow-2xs">
              <span className="font-bold text-slate-700 text-xs">Simulated Order Qty:</span>
              <input
                type="number"
                min="1"
                step="1"
                value={calculatorQty}
                onChange={(e) => setCalculatorQty(parseInt(e.target.value) || 1)}
                className="w-24 px-2 py-1 bg-slate-50 border border-slate-200 rounded font-mono font-bold text-orange-950 text-sm text-center focus:outline-none focus:border-orange-500"
              />
              <span className="font-semibold text-slate-600 text-xs">{selectedItem?.primaryUnit}</span>
            </div>
          </div>

          {/* Winner Banner */}
          {calculatorResults.winner && (
            <div className="bg-white rounded-xl p-3.5 border border-emerald-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Award size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                      Best Value Vendor for {calculatorResults.qty.toLocaleString()} {selectedItem?.primaryUnit}
                    </span>
                    {calculatorResults.winner.isPreferred && (
                      <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                        <Star size={9} fill="currentColor" /> Preferred
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm mt-0.5">
                    {calculatorResults.winner.supplierName} ({calculatorResults.winner.vendorCode})
                  </h4>
                  <div className="text-[11px] text-slate-500 flex items-center gap-3 mt-0.5">
                    <span>Lead Time: <strong>{calculatorResults.winner.leadTimeDays} Days</strong></span>
                    <span>Rating: <strong>{calculatorResults.winner.rating}★</strong></span>
                  </div>
                </div>
              </div>

              {/* Winner Numbers */}
              <div className="flex items-center gap-6 shrink-0">
                <div className="text-right">
                  <div className="text-[10px] text-slate-400">Effective Unit Rate</div>
                  <div className="text-base font-bold font-mono text-emerald-700">
                    {currency} {calculatorResults.winner.unitPrice.toLocaleString()} <span className="text-[10px] text-slate-500">/{selectedItem?.primaryUnit}</span>
                  </div>
                </div>

                <div className="text-right border-l border-slate-100 pl-6">
                  <div className="text-[10px] text-slate-400">Total Net Payable (with Tax)</div>
                  <div className="text-lg font-bold font-mono text-slate-900">
                    {currency} {calculatorResults.winner.totalPayable.toLocaleString()}
                  </div>
                </div>

                <div className="text-right bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
                  <div className="text-[10px] font-bold text-emerald-800">Realized Savings</div>
                  <div className="text-sm font-bold font-mono text-emerald-700">
                    {calculatorResults.winner.savingsVsBenchmark > 0
                      ? `-${currency} ${calculatorResults.winner.savingsVsBenchmark.toLocaleString()} (${calculatorResults.winner.savingsPercent.toFixed(1)}%)`
                      : 'At Benchmark'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Multi-Vendor Schedule Cards with MOQ Range Tiers */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
            Approved Vendors & MOQ Price Tier Schedules ({supplierRates.length})
          </h3>
          <span className="text-[11px] text-slate-400">
            Multiple vendor contracts with tiered volume price brackets
          </span>
        </div>

        {supplierRates.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center space-y-3">
            <Building2 size={32} className="mx-auto text-slate-400" />
            <div className="text-slate-600 font-semibold text-xs">
              No approved vendors registered for this cost item yet.
            </div>
            <p className="text-slate-400 text-[11px] max-w-md mx-auto">
              Add vendors with multi-tier price ranges for multiple MOQ brackets to enable automated volume costing.
            </p>
            <button
              onClick={handleOpenAddRate}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold text-xs shadow-xs cursor-pointer"
            >
              <Plus size={13} />
              <span>Add Approved Vendor</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {supplierRates.map(rate => {
              const ranges = rate.priceRanges || [];
              return (
                <div 
                  key={rate.id}
                  className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden transition-all hover:border-slate-300"
                >
                  {/* Vendor Top Header */}
                  <div className="p-3.5 bg-slate-50/70 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center font-bold font-mono text-xs">
                        <Building2 size={16} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                            {rate.supplierName}
                          </h4>
                          <span className="font-mono text-[10px] text-slate-500 bg-white border border-slate-200 px-1.5 py-0.2 rounded">
                            {rate.vendorCode}
                          </span>
                          {rate.isPreferred && (
                            <span className="text-[10px] font-bold bg-amber-50 border border-amber-200 text-amber-800 px-2 py-0.2 rounded flex items-center gap-1">
                              <Star size={9} fill="currentColor" /> Preferred Supplier
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-3 mt-0.5">
                          <span>Base MOQ: <strong>{rate.minimumOrderQty} {selectedItem?.primaryUnit}</strong></span>
                          <span>Lead Time: <strong>{rate.leadTimeDays} Days</strong></span>
                          <span>Tax / VAT: <strong>{rate.taxRatePercent || 0}%</strong></span>
                          <span>Rating: <strong>{rate.rating}★</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-[10px] text-slate-400">Base Unit Rate</div>
                        <div className="text-sm font-bold font-mono text-slate-900">
                          {currency} {rate.baseRate.toLocaleString()} <span className="text-[10px] text-slate-400">/{selectedItem?.primaryUnit}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 pl-3 border-l border-slate-200">
                        <button
                          onClick={() => handleOpenEditRate(rate)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-md transition-colors cursor-pointer"
                          title="Edit Vendor Rate & Tiers"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteRate(rate.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                          title="Delete Vendor Rate"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* MOQ Price Range Tiers Table */}
                  <div className="p-3">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Multi-tier MOQ Volume Price Schedule ({ranges.length} Tiers)
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase select-none">
                            <th className="py-2 px-3">Tier #</th>
                            <th className="py-2 px-3">MOQ Range ({selectedItem?.primaryUnit})</th>
                            <th className="py-2 px-3 text-right">Unit Rate ({currency})</th>
                            <th className="py-2 px-3 text-center">Lead Time</th>
                            <th className="py-2 px-3 text-right">Variance vs Benchmark</th>
                            <th className="py-2 px-3">Tier Scope & Conditions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {ranges.map((tier, rIdx) => {
                            const isQtyMatched = calculatorResults?.winner?.supplierId === rate.supplierId &&
                              calculatorQty >= tier.minQty &&
                              (!tier.maxQty || calculatorQty <= tier.maxQty);

                            const variance = selectedItem ? tier.unitPrice - selectedItem.benchmarkCost : 0;
                            const variancePct = selectedItem && selectedItem.benchmarkCost > 0
                              ? (variance / selectedItem.benchmarkCost) * 100
                              : 0;

                            return (
                              <tr 
                                key={rIdx}
                                className={`transition-colors ${
                                  isQtyMatched ? 'bg-emerald-50/80 font-bold text-emerald-950' : 'hover:bg-slate-50/50'
                                }`}
                              >
                                <td className="py-2 px-3 font-mono text-[11px] text-slate-500">
                                  Tier {rIdx + 1}
                                  {isQtyMatched && (
                                    <span className="ml-2 text-[10px] bg-emerald-600 text-white px-1.5 py-0.2 rounded-full uppercase">
                                      Active Match
                                    </span>
                                  )}
                                </td>
                                <td className="py-2 px-3 font-mono font-medium">
                                  {tier.minQty.toLocaleString()} {tier.maxQty ? `– ${tier.maxQty.toLocaleString()}` : '+ and above'} {selectedItem?.primaryUnit}
                                </td>
                                <td className="py-2 px-3 text-right font-mono font-bold text-orange-950">
                                  {currency} {tier.unitPrice.toLocaleString()}
                                </td>
                                <td className="py-2 px-3 text-center font-mono text-slate-600">
                                  {tier.leadTimeDays || rate.leadTimeDays} Days
                                </td>
                                <td className="py-2 px-3 text-right font-mono">
                                  {variance <= 0 ? (
                                    <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded text-[10px] font-bold">
                                      {variancePct.toFixed(1)}% savings
                                    </span>
                                  ) : (
                                    <span className="text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded text-[10px]">
                                      +{variancePct.toFixed(1)}% premium
                                    </span>
                                  )}
                                </td>
                                <td className="py-2 px-3 text-slate-500 text-[11px]">
                                  {tier.notes || 'Standard manufacturing run terms'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Modal: Add / Edit Vendor Rate & Multi-MOQ Range Tiers */}
      {isRateModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div 
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
              <div className="flex items-center gap-2">
                <Building2 size={18} className="text-orange-500" />
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {editingRate ? 'Edit Approved Vendor Rate Schedule' : 'Add Approved Vendor & MOQ Schedule'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Target: [{selectedItem?.itemCode}] {selectedItem?.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsRateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveRateSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Select Supplier / Vendor <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-900"
                  >
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.vendorCode}) - Rating: {s.rating}★
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Base Benchmark Rate ({currency}) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={baseRate}
                    onChange={(e) => setBaseRate(parseFloat(e.target.value) || 0)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Minimum Order Qty ({selectedItem?.primaryUnit})
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={minOrderQty}
                    onChange={(e) => setMinOrderQty(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Lead Time (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={leadTimeDays}
                    onChange={(e) => setLeadTimeDays(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Applicable Tax / VAT (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={taxRatePercent}
                    onChange={(e) => setTaxRatePercent(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="preferredCheck"
                  checked={isPreferred}
                  onChange={(e) => setIsPreferred(e.target.checked)}
                  className="w-4 h-4 text-orange-500 rounded"
                />
                <label htmlFor="preferredCheck" className="font-semibold text-slate-700 cursor-pointer">
                  Mark as Preferred Supplier for this item
                </label>
              </div>

              {/* Multi-tier MOQ Ranges Builder */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <label className="font-bold text-slate-800 text-xs">
                      Volume MOQ Price Ranges ({priceRanges.length} Tiers)
                    </label>
                    <p className="text-[10px] text-slate-400">
                      Suppliers offer tiered price discounts for multiple MOQ brackets
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const last = priceRanges[priceRanges.length - 1];
                      const newMin = last ? (last.maxQty ? last.maxQty + 1 : last.minQty + 100) : 1;
                      setPriceRanges([...priceRanges, {
                        minQty: newMin,
                        unitPrice: last ? Math.round(last.unitPrice * 0.95) : baseRate,
                        leadTimeDays: 12,
                        notes: `Tier ${priceRanges.length + 1}`
                      }]);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded-md text-[11px] font-semibold cursor-pointer"
                  >
                    <Plus size={11} />
                    <span>Add Tier</span>
                  </button>
                </div>

                <div className="bg-slate-50 rounded-xl border border-slate-200 p-2 space-y-2">
                  {priceRanges.map((tier, idx) => (
                    <div key={idx} className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center gap-2 flex-wrap sm:flex-nowrap">
                      <span className="w-12 font-mono font-bold text-[10px] text-slate-500 shrink-0">
                        Tier {idx + 1}
                      </span>

                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[10px] text-slate-400">Min:</span>
                        <input
                          type="number"
                          min="1"
                          value={tier.minQty}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 1;
                            setPriceRanges(priceRanges.map((t, i) => i === idx ? { ...t, minQty: val } : t));
                          }}
                          className="w-16 px-1.5 py-1 border border-slate-200 rounded font-mono text-center text-xs"
                        />
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[10px] text-slate-400">Max:</span>
                        <input
                          type="number"
                          min="1"
                          placeholder="and up"
                          value={tier.maxQty || ''}
                          onChange={(e) => {
                            const val = e.target.value ? parseInt(e.target.value) : undefined;
                            setPriceRanges(priceRanges.map((t, i) => i === idx ? { ...t, maxQty: val } : t));
                          }}
                          className="w-20 px-1.5 py-1 border border-slate-200 rounded font-mono text-center text-xs"
                        />
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[10px] text-slate-400">Unit Price:</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={tier.unitPrice}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setPriceRanges(priceRanges.map((t, i) => i === idx ? { ...t, unitPrice: val } : t));
                          }}
                          className="w-24 px-1.5 py-1 border border-slate-200 rounded font-mono font-bold text-orange-950 text-right text-xs"
                        />
                      </div>

                      <input
                        type="text"
                        placeholder="Tier terms (e.g. Standard mill run)"
                        value={tier.notes || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPriceRanges(priceRanges.map((t, i) => i === idx ? { ...t, notes: val } : t));
                        }}
                        className="flex-1 min-w-[120px] px-2 py-1 border border-slate-200 rounded text-xs"
                      />

                      <button
                        type="button"
                        onClick={() => setPriceRanges(priceRanges.filter((_, i) => i !== idx))}
                        className="text-slate-400 hover:text-red-500 p-1 rounded cursor-pointer"
                        title="Delete tier"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Contract Terms & Commercial Conditions
                </label>
                <textarea
                  rows={2}
                  placeholder="Payment terms, delivery guarantees, demurrage clauses..."
                  value={rateNotes}
                  onChange={(e) => setRateNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg resize-none"
                />
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRateModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg shadow-xs cursor-pointer"
                >
                  {editingRate ? 'Update Vendor Rate' : 'Save Vendor Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
