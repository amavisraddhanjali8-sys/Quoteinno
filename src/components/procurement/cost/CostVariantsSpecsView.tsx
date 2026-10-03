import React, { useState, useMemo } from 'react';
import { 
  Package, 
  Search, 
  Plus, 
  Trash2, 
  Edit2, 
  X, 
  List, 
  Grid, 
  MoreVertical, 
  Barcode, 
  Eye, 
  DollarSign, 
  ShieldCheck 
} from 'lucide-react';
import { 
  ProcurementCostItem, 
  ProcurementItemVariant 
} from '../../../types/procurement';
import { procurementCostService } from '../../../services/procurementCostService';
import { getCostItemImageUrl } from './costItemImages';
import { ItemQRCodeModal } from './ItemQRCodeModal';
import { ItemVendorPricingModal } from './ItemVendorPricingModal';

interface CostVariantsSpecsViewProps {
  costItems: ProcurementCostItem[];
  currency?: string;
  onRefreshItems: () => void;
}

export const CostVariantsSpecsView: React.FC<CostVariantsSpecsViewProps> = ({
  costItems,
  currency = 'LKR',
  onRefreshItems
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCostItemId, setSelectedCostItemId] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'CARDS' | 'LIST'>('CARDS');

  // Menu popup state for Cards View
  const [activeMenuVariantId, setActiveMenuVariantId] = useState<string | null>(null);

  // Modals state
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [targetCostItemId, setTargetCostItemId] = useState<string>(costItems[0]?.id || '');
  const [editingVariant, setEditingVariant] = useState<ProcurementItemVariant | null>(null);

  // Interactive QR and Vendor Pricing modals
  const [selectedQrItem, setSelectedQrItem] = useState<{
    id: string;
    variantCode: string;
    name: string;
    parentItemCode: string;
    parentCostItemId: string;
    unit: string;
    standardCost: number;
    currency: string;
    imageUrl?: string;
  } | null>(null);

  const [selectedPricingParentItem, setSelectedPricingParentItem] = useState<ProcurementCostItem | null>(null);
  const [selectedSpecVariant, setSelectedSpecVariant] = useState<{
    variant: ProcurementItemVariant;
    parentItem: ProcurementCostItem;
  } | null>(null);

  // Variant Form fields
  const [variantCode, setVariantCode] = useState('');
  const [variantName, setVariantName] = useState('');
  const [sku, setSku] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [standardCost, setStandardCost] = useState<number>(100);
  const [attributes, setAttributes] = useState<Record<string, string>>({
    'Thickness / Gauge': '3.0 mm',
    'Finish / Alloy': '6063-T6 Mill Finish'
  });
  const [newAttrKey, setNewAttrKey] = useState('');
  const [newAttrVal, setNewAttrVal] = useState('');

  // Collect all variants with their parent cost item ensuring PK and FK
  const allVariantsWithParent = useMemo(() => {
    const list: { variant: ProcurementItemVariant; parentItem: ProcurementCostItem }[] = [];
    costItems.forEach(item => {
      (item.variants || []).forEach(v => {
        // Ensure PK and FK references are strictly present
        const populatedVariant: ProcurementItemVariant = {
          ...v,
          id: v.id || `var-${v.variantCode.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
          parentCostItemId: v.parentCostItemId || item.id,
          parentItemCode: v.parentItemCode || item.itemCode
        };
        list.push({ variant: populatedVariant, parentItem: item });
      });
    });
    return list;
  }, [costItems]);

  const filteredVariants = useMemo(() => {
    return allVariantsWithParent.filter(({ variant, parentItem }) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        variant.variantCode.toLowerCase().includes(q) ||
        variant.name.toLowerCase().includes(q) ||
        (variant.sku && variant.sku.toLowerCase().includes(q)) ||
        parentItem.itemCode.toLowerCase().includes(q) ||
        parentItem.name.toLowerCase().includes(q) ||
        Object.entries(variant.attributes || {}).some(([k, v]) => 
          k.toLowerCase().includes(q) || v.toLowerCase().includes(q)
        );

      const matchesItem = selectedCostItemId === 'ALL' || parentItem.id === selectedCostItemId;
      return matchesSearch && matchesItem;
    });
  }, [allVariantsWithParent, searchQuery, selectedCostItemId]);

  const handleOpenAddVariant = (defaultItemId?: string) => {
    setEditingVariant(null);
    const parentId = defaultItemId || costItems[0]?.id || '';
    setTargetCostItemId(parentId);
    setVariantCode(`VAR-${Math.floor(100 + Math.random() * 900)}`);
    setVariantName('');
    setSku('');
    setImageUrl('');
    setStandardCost(100);
    setAttributes({
      'Specification / Grade': 'High Tensile Standard',
      'Surface Finish': 'Standard Treated'
    });
    setIsVariantModalOpen(true);
  };

  const handleOpenEditVariant = (variant: ProcurementItemVariant, parentItem: ProcurementCostItem) => {
    setEditingVariant(variant);
    setTargetCostItemId(parentItem.id);
    setVariantCode(variant.variantCode);
    setVariantName(variant.name);
    setSku(variant.sku || '');
    setImageUrl(variant.imageUrl || '');
    setStandardCost(variant.standardCost || parentItem.benchmarkCost);
    setAttributes(variant.attributes || {});
    setIsVariantModalOpen(true);
  };

  const handleAddAttribute = () => {
    if (!newAttrKey.trim() || !newAttrVal.trim()) return;
    setAttributes({
      ...attributes,
      [newAttrKey.trim()]: newAttrVal.trim()
    });
    setNewAttrKey('');
    setNewAttrVal('');
  };

  const handleRemoveAttribute = (key: string) => {
    const copy = { ...attributes };
    delete copy[key];
    setAttributes(copy);
  };

  const handleSaveVariantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!variantCode.trim() || !variantName.trim() || !targetCostItemId) return;

    if (editingVariant) {
      procurementCostService.updateVariantInItem(targetCostItemId, editingVariant.id, {
        variantCode: variantCode.trim().toUpperCase(),
        name: variantName.trim(),
        sku: sku.trim() || variantCode.trim().toUpperCase(),
        imageUrl: imageUrl.trim() || undefined,
        standardCost: Number(standardCost),
        attributes
      });
    } else {
      procurementCostService.addVariantToItem(targetCostItemId, {
        variantCode: variantCode.trim().toUpperCase(),
        name: variantName.trim(),
        sku: sku.trim() || variantCode.trim().toUpperCase(),
        imageUrl: imageUrl.trim() || undefined,
        standardCost: Number(standardCost),
        attributes
      });
    }

    setIsVariantModalOpen(false);
    onRefreshItems();
  };

  const handleDeleteVariant = (itemId: string, variantId: string) => {
    if (confirm('Delete this cost item variant?')) {
      procurementCostService.deleteVariantFromItem(itemId, variantId);
      onRefreshItems();
    }
  };

  return (
    <div className="space-y-3 text-xs font-sans">
      {/* 1. Filter, Search & Layout View Toggle */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-2.5 shadow-2xs flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 flex-1 min-w-[280px] flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px] max-w-sm">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search Variant Code (PK), Parent (FK), Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Filter Parent Item */}
          <select
            value={selectedCostItemId}
            onChange={(e) => setSelectedCostItemId(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700 outline-none cursor-pointer max-w-[220px] truncate text-xs"
          >
            <option value="ALL">All Parent Cost Items ({costItems.length})</option>
            {costItems.map(i => (
              <option key={i.id} value={i.id}>[{i.itemCode}] {i.name}</option>
            ))}
          </select>
        </div>

        {/* View Mode Toggle & Add Button */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-mono text-slate-500">
            <strong>{filteredVariants.length}</strong> variants
          </span>

          {/* Toggle Cards / List */}
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode('CARDS')}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors cursor-pointer ${
                viewMode === 'CARDS'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="1:1 Aspect Ratio Cards View"
            >
              <Grid size={13} />
              <span>Cards (1:1)</span>
            </button>
            <button
              onClick={() => setViewMode('LIST')}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors cursor-pointer ${
                viewMode === 'LIST'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Single-line Row List View"
            >
              <List size={13} />
              <span>List</span>
            </button>
          </div>

          <button
            onClick={() => handleOpenAddVariant()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
          >
            <Plus size={13} />
            <span>Add Cost Variant</span>
          </button>
        </div>
      </div>

      {/* 2. Main Content: CARDS VIEW vs LIST VIEW */}
      {viewMode === 'CARDS' ? (
        /* CARDS VIEW: 1:1 Scale Image, Item Code and Menu Button ONLY */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2.5">
          {filteredVariants.length === 0 ? (
            <div className="col-span-full bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-400">
              No variants found matching criteria. Click "Add Cost Variant" to configure custom specifications.
            </div>
          ) : (
            filteredVariants.map(({ variant, parentItem }) => {
              const imgUrl = getCostItemImageUrl({
                imageUrl: variant.imageUrl || parentItem.imageUrl,
                variantCode: variant.variantCode,
                itemCode: parentItem.itemCode,
                name: variant.name,
                category: parentItem.category
              });
              const isMenuOpen = activeMenuVariantId === variant.id;

              return (
                <div
                  key={variant.id}
                  className="bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs hover:border-orange-300 transition-all overflow-hidden flex flex-col relative group"
                >
                  {/* 1:1 Scale Image (Minimum size, square) */}
                  <div className="w-full aspect-square bg-slate-100 relative overflow-hidden">
                    <img
                      src={imgUrl}
                      alt={variant.variantCode}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>

                  {/* Card Bottom Bar: Item Code & Menu Button ONLY */}
                  <div className="p-2 bg-white flex items-center justify-between gap-1 border-t border-slate-100">
                    <span 
                      className="font-mono text-[11px] font-bold text-slate-900 truncate"
                      title={`${variant.variantCode} (Parent: ${parentItem.itemCode})`}
                    >
                      {variant.variantCode}
                    </span>

                    {/* Menu Button */}
                    <div className="relative shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuVariantId(isMenuOpen ? null : variant.id);
                        }}
                        className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                        title="Options menu"
                      >
                        <MoreVertical size={14} />
                      </button>

                      {/* Dropdown Menu Commands */}
                      {isMenuOpen && (
                        <>
                          <div 
                            className="fixed inset-0 z-40" 
                            onClick={() => setActiveMenuVariantId(null)} 
                          />
                          <div className="absolute right-0 bottom-full mb-1 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs">
                            <button
                              onClick={() => {
                                setSelectedSpecVariant({ variant, parentItem });
                                setActiveMenuVariantId(null);
                              }}
                              className="w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                            >
                              <Eye size={12} className="text-blue-500" />
                              <span>View Specs & Tech Details</span>
                            </button>

                            <button
                              onClick={() => {
                                setSelectedPricingParentItem(parentItem);
                                setActiveMenuVariantId(null);
                              }}
                              className="w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                            >
                              <DollarSign size={12} className="text-emerald-500" />
                              <span>Multi-Vendor Pricing & MOQ</span>
                            </button>

                            <button
                              onClick={() => {
                                setSelectedQrItem({
                                  id: variant.id,
                                  variantCode: variant.variantCode,
                                  name: variant.name,
                                  parentItemCode: parentItem.itemCode,
                                  parentCostItemId: parentItem.id,
                                  unit: variant.unit || parentItem.primaryUnit,
                                  standardCost: variant.standardCost || parentItem.benchmarkCost,
                                  currency,
                                  imageUrl: variant.imageUrl || parentItem.imageUrl
                                });
                                setActiveMenuVariantId(null);
                              }}
                              className="w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                            >
                              <Barcode size={12} className="text-purple-500" />
                              <span>Barcode & Smart Tag</span>
                            </button>

                            <div className="border-t border-slate-100 my-1" />

                            <button
                              onClick={() => {
                                handleOpenEditVariant(variant, parentItem);
                                setActiveMenuVariantId(null);
                              }}
                              className="w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                            >
                              <Edit2 size={12} className="text-slate-500" />
                              <span>Edit Variant</span>
                            </button>

                            <button
                              onClick={() => {
                                handleDeleteVariant(parentItem.id, variant.id);
                                setActiveMenuVariantId(null);
                              }}
                              className="w-full px-3 py-1.5 text-left text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                            >
                              <Trash2 size={12} className="text-red-500" />
                              <span>Delete Variant</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
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
                  <th className="py-2 px-3">Variant Code (PK)</th>
                  <th className="py-2 px-3">Parent Cost Item (FK)</th>
                  <th className="py-2 px-3">Variant Name & Technical Spec</th>
                  <th className="py-2 px-3 text-center">Unit</th>
                  <th className="py-2 px-3 text-right">Standard Cost</th>
                  <th className="py-2 px-3 text-right">Best Vendor Quote</th>
                  <th className="py-2 px-3">Technical Attributes</th>
                  <th className="py-2 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVariants.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No cost item variants found.
                    </td>
                  </tr>
                ) : (
                  filteredVariants.map(({ variant, parentItem }) => {
                    const imgUrl = getCostItemImageUrl({
                      imageUrl: variant.imageUrl || parentItem.imageUrl,
                      variantCode: variant.variantCode,
                      itemCode: parentItem.itemCode,
                      name: variant.name,
                      category: parentItem.category
                    });
                    const allRates = variant.supplierRates || [];
                    const lowestRate = allRates.length > 0 ? Math.min(...allRates.map(r => r.baseRate)) : null;
                    const attrCount = Object.keys(variant.attributes || {}).length;

                    return (
                      <tr 
                        key={variant.id}
                        className="hover:bg-slate-50/70 transition-colors whitespace-nowrap h-11"
                      >
                        {/* PK: Variant Code with 1:1 mini thumb */}
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-1.5">
                            <img 
                              src={imgUrl} 
                              alt="" 
                              className="w-6 h-6 rounded aspect-square object-cover border border-slate-200 shrink-0" 
                            />
                            <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              PK: {variant.variantCode}
                            </span>
                          </div>
                        </td>

                        {/* FK: Parent Item Code */}
                        <td className="py-2 px-3">
                          <button
                            onClick={() => setSelectedCostItemId(parentItem.id)}
                            className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-orange-800 bg-orange-50 hover:bg-orange-100 px-2 py-0.5 rounded border border-orange-200 transition-colors cursor-pointer"
                            title={`Parent: ${parentItem.name}`}
                          >
                            <Package size={10} className="text-orange-500" />
                            <span>FK: {parentItem.itemCode}</span>
                          </button>
                        </td>

                        {/* Variant Name & Parent Scope */}
                        <td className="py-2 px-3 max-w-[240px]">
                          <div className="truncate">
                            <span className="font-bold text-slate-900 text-xs truncate inline-block max-w-[180px]" title={variant.name}>
                              {variant.name}
                            </span>
                            <span className="text-[10px] text-slate-400 ml-1.5 truncate">
                              ({parentItem.category})
                            </span>
                          </div>
                        </td>

                        {/* Unit */}
                        <td className="py-2 px-3 text-center font-mono text-slate-600">
                          {variant.unit || parentItem.primaryUnit}
                        </td>

                        {/* Standard Cost */}
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                          {currency} {(variant.standardCost || parentItem.benchmarkCost).toLocaleString()}
                        </td>

                        {/* Best Vendor Quote */}
                        <td className="py-2 px-3 text-right font-mono">
                          {lowestRate !== null ? (
                            <span className="font-bold text-emerald-700">
                              {currency} {lowestRate.toLocaleString()}
                            </span>
                          ) : (
                            <button
                              onClick={() => setSelectedPricingParentItem(parentItem)}
                              className="text-[10px] text-orange-600 hover:underline font-sans cursor-pointer"
                            >
                              Check Vendor Matrix
                            </button>
                          )}
                        </td>

                        {/* Technical Attributes Badge */}
                        <td className="py-2 px-3">
                          <button
                            onClick={() => setSelectedSpecVariant({ variant, parentItem })}
                            className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded border border-slate-200/80 transition-colors cursor-pointer"
                            title="Click to view detailed specs"
                          >
                            <ShieldCheck size={10} className="text-slate-500" />
                            <span>{attrCount} Spec Attributes</span>
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="py-2 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setSelectedSpecVariant({ variant, parentItem })}
                              className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
                              title="View Specifications"
                            >
                              <Eye size={12} />
                            </button>
                            <button
                              onClick={() => setSelectedPricingParentItem(parentItem)}
                              className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded cursor-pointer"
                              title="Multi-Vendor Pricing & MOQ"
                            >
                              <DollarSign size={12} />
                            </button>
                            <button
                              onClick={() => setSelectedQrItem({
                                id: variant.id,
                                variantCode: variant.variantCode,
                                name: variant.name,
                                parentItemCode: parentItem.itemCode,
                                parentCostItemId: parentItem.id,
                                unit: variant.unit || parentItem.primaryUnit,
                                standardCost: variant.standardCost || parentItem.benchmarkCost,
                                currency,
                                imageUrl: variant.imageUrl || parentItem.imageUrl
                              })}
                              className="p-1 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded cursor-pointer"
                              title="Barcode & Smart Tag"
                            >
                              <Barcode size={12} />
                            </button>
                            <button
                              onClick={() => handleOpenEditVariant(variant, parentItem)}
                              className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded cursor-pointer"
                              title="Edit Variant"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              onClick={() => handleDeleteVariant(parentItem.id, variant.id)}
                              className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded cursor-pointer"
                              title="Delete Variant"
                            >
                              <Trash2 size={12} />
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

      {/* Modal: View Specs & Technical Attributes Details */}
      {selectedSpecVariant && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 aspect-square rounded-lg overflow-hidden border border-white/20 bg-slate-800 shrink-0">
                  <img 
                    src={getCostItemImageUrl({
                      imageUrl: selectedSpecVariant.variant.imageUrl || selectedSpecVariant.parentItem.imageUrl,
                      variantCode: selectedSpecVariant.variant.variantCode,
                      itemCode: selectedSpecVariant.parentItem.itemCode
                    })} 
                    alt="" 
                    className="w-full h-full object-cover" 
                  />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Specification & Technical Sheet</h3>
                  <div className="flex items-center gap-2 font-mono text-[11px] text-slate-300">
                    <span className="font-bold text-orange-400">PK: {selectedSpecVariant.variant.variantCode}</span>
                    <span>•</span>
                    <span>FK: {selectedSpecVariant.parentItem.itemCode}</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedSpecVariant(null)} 
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{selectedSpecVariant.variant.name}</h4>
                <p className="text-slate-500 text-xs">Parent Scope: {selectedSpecVariant.parentItem.name}</p>
              </div>

              {/* Attributes Table */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/90 space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Technical Specifications & Engineering Attributes
                </div>
                <div className="divide-y divide-slate-200/70 text-xs">
                  {Object.entries(selectedSpecVariant.variant.attributes || {}).map(([k, v], idx) => (
                    <div key={idx} className="py-1.5 flex items-center justify-between">
                      <span className="text-slate-500 font-medium">{k}</span>
                      <span className="font-bold text-slate-900 text-right">{v}</span>
                    </div>
                  ))}
                  {Object.keys(selectedSpecVariant.variant.attributes || {}).length === 0 && (
                    <div className="py-2 text-slate-400 italic">No custom technical attributes entered.</div>
                  )}
                </div>
              </div>

              {/* Financial Benchmark */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-orange-50 border border-orange-200 text-xs">
                <span className="font-semibold text-orange-950">Standard Unit Benchmark:</span>
                <span className="font-mono font-bold text-orange-950 text-sm">
                  {currency} {(selectedSpecVariant.variant.standardCost || selectedSpecVariant.parentItem.benchmarkCost).toLocaleString()} /{selectedSpecVariant.variant.unit || selectedSpecVariant.parentItem.primaryUnit}
                </span>
              </div>
            </div>

            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedSpecVariant(null)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: QR Code */}
      <ItemQRCodeModal
        isOpen={!!selectedQrItem}
        onClose={() => setSelectedQrItem(null)}
        item={selectedQrItem}
      />

      {/* Modal: Multi-Vendor Pricing Matrix & MOQ Ranges */}
      <ItemVendorPricingModal
        isOpen={!!selectedPricingParentItem}
        onClose={() => setSelectedPricingParentItem(null)}
        item={selectedPricingParentItem}
        currency={currency}
        onRefresh={onRefreshItems}
      />

      {/* Modal: Add/Edit Variant Form */}
      {isVariantModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50/80">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-orange-500 text-white flex items-center justify-center">
                  <Package size={14} />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {editingVariant ? `Edit Variant: ${editingVariant.variantCode}` : 'Create Cost Item Variant'}
                </h3>
              </div>
              <button 
                onClick={() => setIsVariantModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveVariantSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
              {/* Parent Item (Foreign Key) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Parent Cost Item (FK) <span className="text-red-500">*</span>
                </label>
                <select
                  value={targetCostItemId}
                  onChange={(e) => setTargetCostItemId(e.target.value)}
                  disabled={!!editingVariant}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:border-orange-500"
                >
                  {costItems.map(item => (
                    <option key={item.id} value={item.id}>
                      [{item.itemCode}] {item.name} ({item.category})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Links this variant to its parent cost item via Foreign Key reference.
                </p>
              </div>

              {/* Variant Code (PK) & Name */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Variant Code (PK) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={variantCode}
                    onChange={(e) => setVariantCode(e.target.value.toUpperCase())}
                    placeholder="e.g. VAR-ALU-6063-T6"
                    required
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Standard Cost ({currency}) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={standardCost}
                    onChange={(e) => setStandardCost(Number(e.target.value))}
                    min="0"
                    step="0.01"
                    required
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Variant Spec Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={variantName}
                  onChange={(e) => setVariantName(e.target.value)}
                  placeholder="e.g. Mill Finish 3.0mm Wall Thickness Heavy Structural"
                  required
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900"
                />
              </div>

              {/* 1:1 Image URL */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Variant 1:1 Image URL
                </label>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 aspect-square rounded-lg border border-slate-200 overflow-hidden shrink-0 bg-slate-100 flex items-center justify-center">
                    {imageUrl ? (
                      <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[9px] text-slate-400 font-mono">1:1</span>
                    )}
                  </div>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://... or paste image URL (1:1 aspect ratio)"
                    className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
                  />
                </div>
              </div>

              {/* Technical Attributes Builder */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Engineering Specifications & Attributes:</span>
                </div>

                <div className="space-y-1.5">
                  {Object.entries(attributes).map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200/80 text-xs">
                      <div>
                        <span className="font-semibold text-slate-700">{k}:</span>{' '}
                        <span className="text-slate-600">{v}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveAttribute(k)}
                        className="text-slate-400 hover:text-red-500 p-0.5 rounded cursor-pointer"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Attribute (e.g. Alloy)"
                    value={newAttrKey}
                    onChange={(e) => setNewAttrKey(e.target.value)}
                    className="flex-1 px-2.5 py-1 bg-white border border-slate-200 rounded text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Value (e.g. 6063-T6)"
                    value={newAttrVal}
                    onChange={(e) => setNewAttrVal(e.target.value)}
                    className="flex-1 px-2.5 py-1 bg-white border border-slate-200 rounded text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddAttribute}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-xs cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsVariantModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
                >
                  {editingVariant ? 'Save Variant' : 'Create Variant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
