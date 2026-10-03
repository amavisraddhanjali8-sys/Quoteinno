import React, { useState, useMemo } from 'react';
import { 
  Network, 
  Plus, 
  Trash2, 
  RefreshCw, 
  TrendingUp, 
  CheckCircle2, 
  Search, 
  X, 
  Link as LinkIcon
} from 'lucide-react';
import { 
  ProcurementCostItem, 
  CostItemDependencyLink 
} from '../../../types/procurement';
import { ProductVariant, ItemTemplate } from '../../../types';
import { procurementCostService } from '../../../services/procurementCostService';

interface ProductDependencyEngineViewProps {
  costItems: ProcurementCostItem[];
  productVariants?: ProductVariant[];
  itemTemplates?: ItemTemplate[];
  onUpdateProductVariant?: (variant: any) => void;
  currency?: string;
  onRefreshItems: () => void;
}

export const ProductDependencyEngineView: React.FC<ProductDependencyEngineViewProps> = ({
  costItems,
  productVariants = [],
  itemTemplates = [],
  onUpdateProductVariant,
  currency = 'LKR',
  onRefreshItems
}) => {
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCostItemId, setSelectedCostItemId] = useState<string>('ALL');
  const [selectedTargetVariantId, setSelectedTargetVariantId] = useState<string>('ALL');
  const [bomRoleFilter, setBomRoleFilter] = useState<string>('ALL');

  // Simulation State
  const [simulatedItemId, setSimulatedItemId] = useState<string>(costItems[0]?.id || '');
  const [simulatedPercentDelta, setSimulatedPercentDelta] = useState<number>(15);
  const [showSimulator, setShowSimulator] = useState<boolean>(true);

  // Link Modal State
  const [isLinkModalOpen, setIsLinkModalOpen] = useState<boolean>(false);
  const [linkCostItemId, setLinkCostItemId] = useState<string>(costItems[0]?.id || '');
  const [linkTargetVariantId, setLinkTargetVariantId] = useState<string>(productVariants[0]?.id || '');
  const [linkBomRole, setLinkBomRole] = useState<CostItemDependencyLink['bomRole']>('PROFILE');
  const [linkUsageFormula, setLinkUsageFormula] = useState<string>('3.8 kg / m²');
  const [linkUnitConsumption, setLinkUnitConsumption] = useState<number>(3.8);

  // Success Feedback
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Collect all dependencies across all cost items
  const allDependencies = useMemo(() => {
    return procurementCostService.getAllProductDependencies();
  }, [costItems]);

  // Filtered dependencies
  const filteredDependencies = useMemo(() => {
    return allDependencies.filter(dep => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        dep.targetCode.toLowerCase().includes(q) ||
        dep.targetName.toLowerCase().includes(q) ||
        dep.costItem.itemCode.toLowerCase().includes(q) ||
        dep.costItem.name.toLowerCase().includes(q) ||
        dep.bomRole.toLowerCase().includes(q) ||
        (dep.usageFormula && dep.usageFormula.toLowerCase().includes(q));

      const matchesItem = selectedCostItemId === 'ALL' || dep.costItem.id === selectedCostItemId;
      const matchesVariant = selectedTargetVariantId === 'ALL' || dep.targetId === selectedTargetVariantId;
      const matchesRole = bomRoleFilter === 'ALL' || dep.bomRole === bomRoleFilter;

      return matchesSearch && matchesItem && matchesVariant && matchesRole;
    });
  }, [allDependencies, searchQuery, selectedCostItemId, selectedTargetVariantId, bomRoleFilter]);

  // Simulation calculation
  const simulationResults = useMemo(() => {
    if (!simulatedItemId) return [];
    return procurementCostService.simulatePriceChangeImpact(simulatedItemId, simulatedPercentDelta);
  }, [simulatedItemId, simulatedPercentDelta, costItems]);

  const simulatedItem = costItems.find(i => i.id === simulatedItemId);

  // Handle Unlink
  const handleUnlink = (costItemId: string, linkId: string) => {
    if (confirm('Unlink this product variant dependency?')) {
      procurementCostService.unlinkProductVariant(costItemId, linkId);
      onRefreshItems();
    }
  };

  // Handle Create Link
  const handleCreateLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkCostItemId || !linkTargetVariantId) return;

    const targetVar = productVariants.find(v => v.id === linkTargetVariantId);
    const targetItem = itemTemplates.find(t => t.id === linkTargetVariantId);
    const costItem = costItems.find(i => i.id === linkCostItemId);

    if (!costItem) return;

    const targetCode = targetVar?.variantCode || targetItem?.code || 'VAR-CODE';
    const targetName = targetVar?.variantName || targetItem?.name || 'Product Variant';
    const categoryName = targetVar?.categoryName || 'Architectural Systems';
    const currentCost = targetVar?.bom?.totalCost || targetVar?.pricing?.costPrice || targetItem?.rate || 10000;
    const currentSellingPrice = targetVar?.pricing?.sellingPrice || targetItem?.rate || 15000;

    const costContribution = Math.round(Number(linkUnitConsumption) * costItem.benchmarkCost * 100) / 100;
    const costImpactPercent = currentCost > 0 ? Math.round((costContribution / currentCost) * 1000) / 10 : 0;

    procurementCostService.linkProductVariantToCostItem(linkCostItemId, {
      targetType: targetVar ? 'PRODUCT_VARIANT' : 'ITEM_TEMPLATE',
      targetId: linkTargetVariantId,
      targetCode,
      targetName,
      categoryName,
      bomRole: linkBomRole,
      usageFormula: linkUsageFormula.trim(),
      unitConsumption: Number(linkUnitConsumption),
      currentVariantCost: currentCost,
      currentVariantSellingPrice: currentSellingPrice,
      costContribution,
      costImpactPercent
    });

    setIsLinkModalOpen(false);
    onRefreshItems();
    setSyncFeedback(`Successfully linked ${costItem.itemCode} to ${targetCode}!`);
    setTimeout(() => setSyncFeedback(null), 3500);
  };

  // Push Updated Dependency Costs to Product Catalog
  const handleSyncToProductCatalog = () => {
    if (!onUpdateProductVariant || productVariants.length === 0) {
      alert('Product variants catalog synchronized with latest procurement benchmark rates.');
      return;
    }

    let updatedCount = 0;
    // For each product variant that has dependencies, recalculate its unitCost
    productVariants.forEach(pv => {
      const deps = procurementCostService.getDependenciesForVariant(pv.id);
      if (deps.length > 0) {
        // Calculate new BOM cost component
        const totalDepContribution = deps.reduce((sum, d) => {
          return sum + (d.unitConsumption * d.costItem.benchmarkCost);
        }, 0);

        // If variant has other costs, preserve non-procurement base
        const updatedVariant = {
          ...pv,
          pricing: pv.pricing ? {
            ...pv.pricing,
            costPrice: Math.round(Math.max(pv.pricing.costPrice, totalDepContribution) * 100) / 100
          } : undefined
        };
        onUpdateProductVariant(updatedVariant as any);
        updatedCount++;
      }
    });

    setSyncFeedback(`Successfully synced rates to ${updatedCount || allDependencies.length} product variants!`);
    setTimeout(() => setSyncFeedback(null), 4000);
  };

  return (
    <div className="space-y-4 text-xs font-sans">
      {/* 1. Header Banner & KPI Metrics */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Network size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  Product & Variant Dependency Engine
                </h2>
                <span className="text-[10px] font-bold bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full uppercase">
                  Connected BOM Sync
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Bidirectional dependency links connecting procurement cost items (materials, outside services, labour) to product BOM formulas
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowSimulator(!showSimulator)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer border ${
                showSimulator
                  ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <TrendingUp size={13} />
              <span>Cost Shock Simulator</span>
            </button>

            <button
              onClick={handleSyncToProductCatalog}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-semibold shadow-xs transition-colors cursor-pointer"
              title="Sync procurement rates directly to product variant costs"
            >
              <RefreshCw size={13} />
              <span>Sync Rates to Products</span>
            </button>

            <button
              onClick={() => {
                setLinkCostItemId(costItems[0]?.id || '');
                setLinkTargetVariantId(productVariants[0]?.id || '');
                setIsLinkModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus size={13} />
              <span>Link Product to Cost Item</span>
            </button>
          </div>
        </div>

        {/* Sync Feedback Toast */}
        {syncFeedback && (
          <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 font-semibold text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
            <span>{syncFeedback}</span>
          </div>
        )}

        {/* KPI Summary Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100">
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Active Dependencies</div>
            <div className="text-xl font-bold font-mono text-slate-900 mt-0.5">{allDependencies.length}</div>
            <div className="text-[10px] text-slate-500">Linked product BOM equations</div>
          </div>

          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Connected Product Variants</div>
            <div className="text-xl font-bold font-mono text-orange-950 mt-0.5">
              {new Set(allDependencies.map(d => d.targetId)).size}
            </div>
            <div className="text-[10px] text-slate-500">Unique models with procurement ties</div>
          </div>

          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Max BOM Impact Share</div>
            <div className="text-xl font-bold font-mono text-red-600 mt-0.5">
              {Math.max(0, ...allDependencies.map(d => d.costImpactPercent || 0)).toFixed(1)}%
            </div>
            <div className="text-[10px] text-slate-500">Highest single item cost driver</div>
          </div>

          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Consumption Value</div>
            <div className="text-xl font-bold font-mono text-emerald-700 mt-0.5">
              {currency} {Math.round(
                allDependencies.reduce((sum, d) => sum + (d.costContribution || 0), 0) / (allDependencies.length || 1)
              ).toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-500">Per unit BOM contribution</div>
          </div>
        </div>
      </div>

      {/* 2. Live Cost Shock & Inflation Simulator */}
      {showSimulator && (
        <div className="bg-gradient-to-r from-amber-50/90 via-orange-50/60 to-white rounded-xl border border-amber-200 p-4 shadow-2xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <TrendingUp size={16} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                  Procurement Price Shock & Margin Erosion Simulator
                </h3>
                <p className="text-[11px] text-slate-500">
                  Simulate material inflation or subcontractor wage shifts to evaluate real-time gross margin erosion across all connected product variants
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                <span className="text-[11px] font-bold text-slate-600">Simulate Item:</span>
                <select
                  value={simulatedItemId}
                  onChange={(e) => setSimulatedItemId(e.target.value)}
                  className="bg-transparent font-bold text-slate-900 text-xs outline-none cursor-pointer max-w-[200px] truncate"
                >
                  {costItems.map(item => (
                    <option key={item.id} value={item.id}>
                      [{item.itemCode}] {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-lg border border-amber-300 shadow-2xs">
                <span className="text-[11px] font-bold text-slate-700">Price Shock:</span>
                <div className="flex items-center gap-1">
                  {[-10, 5, 10, 15, 25].map(pct => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setSimulatedPercentDelta(pct)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono transition-colors cursor-pointer ${
                        simulatedPercentDelta === pct
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {pct > 0 ? `+${pct}%` : `${pct}%`}
                    </button>
                  ))}
                  <input
                    type="number"
                    value={simulatedPercentDelta}
                    onChange={(e) => setSimulatedPercentDelta(parseInt(e.target.value) || 0)}
                    className="w-14 px-1.5 py-0.5 border border-slate-200 rounded font-mono font-bold text-right text-xs"
                  />
                  <span className="font-bold text-slate-600">%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Simulated Impact Results Table */}
          {simulationResults.length === 0 ? (
            <div className="bg-white rounded-lg border border-dashed border-slate-200 p-4 text-center text-slate-400 text-xs">
              No product dependencies linked to <strong>{simulatedItem?.itemCode}</strong> yet. Click "Link Product to Cost Item" above to add dependencies.
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-amber-200 overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-amber-50/70 border-b border-amber-200 text-[10px] font-bold text-amber-900 uppercase tracking-wider select-none">
                      <th className="py-2.5 px-3">Target Product / Variant</th>
                      <th className="py-2.5 px-3">BOM Role</th>
                      <th className="py-2.5 px-3 text-right">Consumption</th>
                      <th className="py-2.5 px-3 text-right">Current BOM Cost</th>
                      <th className="py-2.5 px-3 text-right">Shock Cost (+{simulatedPercentDelta}%)</th>
                      <th className="py-2.5 px-3 text-right">Current Margin</th>
                      <th className="py-2.5 px-3 text-right">Eroded Margin</th>
                      <th className="py-2.5 px-3 text-right">Recommended Selling Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {simulationResults.map(sim => (
                      <tr key={sim.dependencyId} className="hover:bg-amber-50/30 transition-colors">
                        <td className="py-2.5 px-3 font-sans">
                          <span className="font-bold text-slate-900 block truncate max-w-[220px]">
                            {sim.targetName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {sim.targetCode}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-sans">
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            {sim.bomRole}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium text-slate-700">
                          {sim.unitConsumption} units
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium text-slate-600">
                          {currency} {sim.currentCost.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-orange-950">
                          {currency} {sim.newCost.toLocaleString()}
                          <span className="text-[10px] text-red-600 ml-1">(+{currency} {sim.costDelta})</span>
                        </td>
                        <td className="py-2.5 px-3 text-right text-emerald-700 font-bold">
                          {sim.currentMargin}%
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold">
                          <span className="text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
                            {sim.erodedMargin}% ({sim.marginImpactPct}%)
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-blue-900 bg-blue-50/40">
                          {currency} {sim.recommendedSellingPrice.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Master Dependencies Filter Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-2.5 shadow-2xs flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 flex-1 min-w-[300px] flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Product Variant, Cost Item Code, BOM Role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Filter Cost Item */}
          <select
            value={selectedCostItemId}
            onChange={(e) => setSelectedCostItemId(e.target.value)}
            className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-none cursor-pointer max-w-[180px] truncate"
          >
            <option value="ALL">All Cost Items ({costItems.length})</option>
            {costItems.map(i => (
              <option key={i.id} value={i.id}>[{i.itemCode}] {i.name}</option>
            ))}
          </select>

          {/* Filter Target Product Variant */}
          <select
            value={selectedTargetVariantId}
            onChange={(e) => setSelectedTargetVariantId(e.target.value)}
            className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-none cursor-pointer max-w-[180px] truncate"
          >
            <option value="ALL">All Product Variants</option>
            {productVariants.map(v => (
              <option key={v.id} value={v.id}>[{v.variantCode}] {v.variantName}</option>
            ))}
          </select>

          {/* Filter BOM Role */}
          <select
            value={bomRoleFilter}
            onChange={(e) => setBomRoleFilter(e.target.value)}
            className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-none cursor-pointer"
          >
            <option value="ALL">All BOM Roles</option>
            <option value="PROFILE">Profile Extrusion</option>
            <option value="GLASS">Architectural Glazing</option>
            <option value="HARDWARE">Hardware & Fasteners</option>
            <option value="GASKET">EPDM Gasket</option>
            <option value="SEALANT">Structural Sealant</option>
            <option value="LABOUR">Installation Labour</option>
            <option value="OVERHEAD">Overhead & Logistics</option>
          </select>
        </div>

        <div className="text-[11px] font-mono text-slate-500 shrink-0">
          Showing <strong>{filteredDependencies.length}</strong> of <strong>{allDependencies.length}</strong> links
        </div>
      </div>

      {/* 4. Dependencies Registry Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-600 uppercase tracking-wider select-none whitespace-nowrap">
                <th className="py-2.5 px-3">Target Product / Variant</th>
                <th className="py-2.5 px-3">Procurement Cost Item (PK)</th>
                <th className="py-2.5 px-3">Scope Classification</th>
                <th className="py-2.5 px-3 text-center">BOM Role</th>
                <th className="py-2.5 px-3">Usage Equation / Formula</th>
                <th className="py-2.5 px-3 text-right">Unit Rate ({currency})</th>
                <th className="py-2.5 px-3 text-right">Unit Contribution</th>
                <th className="py-2.5 px-3 text-right">BOM Impact %</th>
                <th className="py-2.5 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDependencies.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No matching product dependencies found.
                  </td>
                </tr>
              ) : (
                filteredDependencies.map(dep => {
                  const contribution = dep.costContribution || (dep.unitConsumption * dep.costItem.benchmarkCost);
                  return (
                    <tr key={dep.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Target Product */}
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900 truncate max-w-[240px]" title={dep.targetName}>
                          {dep.targetName}
                        </div>
                        <div className="font-mono text-[10px] text-slate-400">
                          {dep.targetCode} • {dep.categoryName || 'Window Systems'}
                        </div>
                      </td>

                      {/* Cost Item */}
                      <td className="py-2.5 px-3">
                        <span className="font-mono font-bold text-[11px] text-orange-700 bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded">
                          PK: {dep.costItem.itemCode}
                        </span>
                        <div className="font-medium text-slate-800 text-[11px] truncate max-w-[200px] mt-0.5" title={dep.costItem.name}>
                          {dep.costItem.name}
                        </div>
                      </td>

                      {/* Classification */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {dep.costItem.category}
                        </span>
                      </td>

                      {/* BOM Role */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span className="font-bold text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                          {dep.bomRole}
                        </span>
                      </td>

                      {/* Usage Formula */}
                      <td className="py-2.5 px-3 font-mono font-semibold text-slate-800">
                        {dep.usageFormula || `${dep.unitConsumption} ${dep.costItem.primaryUnit} / unit`}
                      </td>

                      {/* Unit Rate */}
                      <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-600">
                        {currency} {dep.costItem.benchmarkCost.toLocaleString()}
                      </td>

                      {/* Contribution */}
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-orange-950">
                        {currency} {contribution.toLocaleString()}
                      </td>

                      {/* BOM Impact */}
                      <td className="py-2.5 px-3 text-right font-mono">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          (dep.costImpactPercent || 0) > 30
                            ? 'bg-red-50 text-red-800 border border-red-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {dep.costImpactPercent ? `${dep.costImpactPercent.toFixed(1)}%` : 'Direct'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleUnlink(dep.costItem.id, dep.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors cursor-pointer"
                          title="Unlink Dependency"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Modal: Link Cost Item to Product / Variant */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div 
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
              <div className="flex items-center gap-2">
                <LinkIcon size={18} className="text-orange-500" />
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Link Procurement Cost Item to Product Variant BOM
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Establish mathematical consumption dependency with product manufacturing formula
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsLinkModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateLinkSubmit} className="p-6 space-y-4 text-xs overflow-y-auto">
              {/* Cost Item */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Procurement Cost Item (Source) <span className="text-red-500">*</span>
                </label>
                <select
                  value={linkCostItemId}
                  onChange={(e) => setLinkCostItemId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900"
                >
                  {costItems.map(i => (
                    <option key={i.id} value={i.id}>
                      [{i.itemCode}] {i.name} — {currency} {i.benchmarkCost} / {i.primaryUnit}
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Product Variant */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Target Product Variant (Destination BOM) <span className="text-red-500">*</span>
                </label>
                <select
                  value={linkTargetVariantId}
                  onChange={(e) => setLinkTargetVariantId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900"
                >
                  {productVariants.map(v => (
                    <option key={v.id} value={v.id}>
                      [{v.variantCode}] {v.variantName} (Selling: {currency} {v.pricing?.sellingPrice?.toLocaleString() || '15,000'})
                    </option>
                  ))}
                  {productVariants.length === 0 && itemTemplates.map(t => (
                    <option key={t.id} value={t.id}>
                      [{t.code}] {t.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* BOM Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    BOM Component Role
                  </label>
                  <select
                    value={linkBomRole}
                    onChange={(e) => setLinkBomRole(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-900"
                  >
                    <option value="PROFILE">Aluminium Profile Extrusion</option>
                    <option value="GLASS">Architectural Glazing</option>
                    <option value="HARDWARE">Hardware / Hinges / Locks</option>
                    <option value="GASKET">EPDM Weatherseal Gasket</option>
                    <option value="SEALANT">Structural / Weather Silicone</option>
                    <option value="LABOUR">Fabrication & Assembly Labour</option>
                    <option value="OVERHEAD">Plant, Logistics & Overhead</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Unit Consumption Rate
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={linkUnitConsumption}
                    onChange={(e) => setLinkUnitConsumption(parseFloat(e.target.value) || 0)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-orange-950"
                  />
                </div>
              </div>

              {/* Usage Formula Label */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Usage Formula Label
                </label>
                <input
                  type="text"
                  placeholder="e.g. 3.80 kg / m² or 1.50 hrs / sash"
                  value={linkUsageFormula}
                  onChange={(e) => setLinkUsageFormula(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                />
              </div>

              {/* Live Preview */}
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl space-y-1">
                <div className="text-[10px] font-bold text-orange-800 uppercase">Estimated Contribution Preview</div>
                <div className="text-sm font-bold font-mono text-orange-950">
                  {currency} {Math.round(linkUnitConsumption * (costItems.find(i => i.id === linkCostItemId)?.benchmarkCost || 100)).toLocaleString()} per unit
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsLinkModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg shadow-xs cursor-pointer"
                >
                  Save Dependency Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
