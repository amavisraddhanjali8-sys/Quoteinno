import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  ItemTemplate, 
  ProductVariant, 
  ItemCategory,
  MeasurementUnit
} from '../../types';
import { 
  X, 
  Package, 
  Layers, 
  DollarSign, 
  Sliders, 
  ShieldCheck, 
  Calendar, 
  FileText, 
  Plus, 
  Minus, 
  Check, 
  ChevronRight,
  Scale, 
  Barcode as BarcodeIcon,
  Cpu,
  Boxes,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { cn } from '../../lib/utils';
import JsBarcode from 'jsbarcode';

interface ItemDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: ItemTemplate | null;
  variant: ProductVariant | null;
  allVariants?: ProductVariant[];
  allItems?: ItemTemplate[];
  allCategories?: ItemCategory[];
  currentQuantity?: number;
  onUpdateQuantity?: (id: string, qty: number) => void;
  onSelectForInsert?: (item: ItemTemplate, variant?: ProductVariant, quantity?: number) => void;
  isSelected?: boolean;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  isOpen,
  onClose,
  item,
  variant,
  allVariants = [],
  allItems = [],
  allCategories = [],
  currentQuantity = 1,
  onUpdateQuantity,
  onSelectForInsert,
  isSelected: _isSelected = false
}) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'PRICING' | 'BOM' | 'VARIANTS'>('OVERVIEW');
  const [quantity, setQuantity] = useState<number>(currentQuantity || 1);
  const [isFullScreen, setIsFullScreen] = useState(true);
  const barcodeRef = useRef<SVGSVGElement>(null);

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  // Sync quantity with prop
  useEffect(() => {
    setQuantity(currentQuantity > 0 ? currentQuantity : 1);
  }, [currentQuantity]);

  // Determine active item or variant
  const effectiveItem = item || (variant?.itemId ? allItems.find(i => i.id === variant.itemId) : null);
  const effectiveVariant = variant || null;

  // Sibling or associated variants for the item
  const associatedVariants = effectiveItem 
    ? allVariants.filter(v => v.itemId === effectiveItem.id)
    : [];

  // Barcode string to render
  const barcodeValue = effectiveVariant?.barcode || effectiveItem?.barcode || effectiveVariant?.variantCode || effectiveItem?.productCode || '';

  // Render barcode with jsbarcode
  useEffect(() => {
    if (barcodeRef.current && barcodeValue && isOpen) {
      try {
        JsBarcode(barcodeRef.current, barcodeValue, {
          format: 'CODE128',
          width: 1.5,
          height: 38,
          displayValue: true,
          fontSize: 10,
          font: 'monospace',
          textMargin: 2,
          margin: 6,
          background: '#f8fafc',
          lineColor: '#1e293b'
        });
      } catch (err) {
        console.warn('Failed to render barcode:', err);
      }
    }
  }, [barcodeValue, isOpen, activeTab]);

  if (!isOpen || (!effectiveItem && !effectiveVariant)) return null;

  const title = effectiveVariant ? effectiveVariant.variantName : (effectiveItem?.name || 'Item Specification');
  const code = effectiveVariant ? effectiveVariant.variantCode : (effectiveItem?.productCode || effectiveItem?.code || effectiveItem?.id || '');
  const unit = (effectiveVariant?.unit || effectiveItem?.unit || 'Nos') as MeasurementUnit;
  const sellingPrice = effectiveVariant?.pricing?.sellingPrice ?? effectiveItem?.rate ?? 0;
  const costPrice = effectiveVariant?.pricing?.costPrice ?? effectiveVariant?.bom?.totalCost ?? (effectiveItem?.rate ? effectiveItem.rate * 0.72 : 0);
  const grossMargin = effectiveVariant?.pricing?.grossMarginPercent ?? (sellingPrice > 0 ? ((sellingPrice - costPrice) / sellingPrice * 100) : 28);

  const categoryName = effectiveVariant?.categoryName || (effectiveItem?.categoryId 
    ? allCategories.find(c => c.id === effectiveItem.categoryId)?.name 
    : effectiveItem?.category) || 'General Products';

  const handleQtyChange = (delta: number) => {
    const next = Math.max(1, quantity + delta);
    setQuantity(next);
    if (effectiveVariant && onUpdateQuantity) {
      onUpdateQuantity(effectiveVariant.id, next);
    } else if (effectiveItem && onUpdateQuantity) {
      onUpdateQuantity(effectiveItem.id, next);
    }
  };

  const handleDirectQty = (val: number) => {
    const next = Math.max(1, isNaN(val) ? 1 : val);
    setQuantity(next);
    if (effectiveVariant && onUpdateQuantity) {
      onUpdateQuantity(effectiveVariant.id, next);
    } else if (effectiveItem && onUpdateQuantity) {
      onUpdateQuantity(effectiveItem.id, next);
    }
  };

  const handleInsert = () => {
    if (onSelectForInsert) {
      if (effectiveVariant && effectiveItem) {
        onSelectForInsert(effectiveItem, effectiveVariant, quantity);
      } else if (effectiveVariant) {
        // synthesize item template from variant
        const synthesizedTemplate: ItemTemplate = {
          id: effectiveVariant.id,
          variantId: effectiveVariant.id,
          name: effectiveVariant.variantName,
          productCode: effectiveVariant.variantCode,
          code: effectiveVariant.variantCode,
          barcode: effectiveVariant.barcode,
          category: effectiveVariant.categoryName || 'Aluminium Works',
          categoryId: effectiveVariant.categoryId || '',
          productType: 'Product',
          status: 'Active',
          unit: (effectiveVariant.unit as any) || 'Nos',
          rate: effectiveVariant.pricing?.sellingPrice || 0,
          description: effectiveVariant.customerDescription || effectiveVariant.boqDescription || effectiveVariant.variantName
        };
        onSelectForInsert(synthesizedTemplate, effectiveVariant, quantity);
      } else if (effectiveItem) {
        onSelectForInsert(effectiveItem, undefined, quantity);
      }
    }
    onClose();
  };

  const modalContent = (
    <div className={cn(
      "fixed inset-0 z-[999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200",
      isFullScreen ? "p-0 w-screen h-screen" : "p-2 sm:p-4 md:p-6"
    )}>
      <div 
        className={cn(
          "bg-white w-full flex flex-col overflow-hidden shadow-2xl transition-all duration-200",
          isFullScreen 
            ? "h-screen w-screen rounded-none border-none max-w-full" 
            : "h-full md:h-auto md:max-h-[94vh] md:max-w-5xl md:rounded-2xl border border-slate-200"
        )}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md font-bold text-sm",
              effectiveVariant ? "bg-indigo-600 shadow-indigo-100" : "bg-blue-600 shadow-blue-100"
            )}>
              {effectiveVariant ? <Cpu size={20} /> : <Package size={20} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-200/80 text-slate-700">
                  {effectiveVariant ? 'Product Variant' : 'Master BOQ Item'}
                </span>
                <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                  <span>{categoryName}</span>
                  {effectiveItem?.subCategory && (
                    <>
                      <ChevronRight size={10} className="text-slate-400" />
                      <span>{effectiveItem.subCategory}</span>
                    </>
                  )}
                </span>
              </div>
              <h2 className="text-base font-bold text-slate-900 line-clamp-1 mt-0.5">
                {title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right mr-3 hidden sm:block">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Standard Rate</span>
              <span className="text-base font-bold font-mono text-slate-900">
                LKR {sellingPrice.toLocaleString()} <span className="text-xs font-normal text-slate-400">/{unit}</span>
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsFullScreen(prev => !prev)}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
              title={isFullScreen ? "Exit Fullscreen" : "Fit to Full Screen"}
            >
              {isFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-slate-100 bg-white flex items-center gap-2 shrink-0 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={cn(
              "py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all whitespace-nowrap",
              activeTab === 'OVERVIEW'
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            )}
          >
            <Sliders size={14} /> Specifications & Attributes
          </button>
          <button
            onClick={() => setActiveTab('PRICING')}
            className={cn(
              "py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all whitespace-nowrap",
              activeTab === 'PRICING'
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            )}
          >
            <DollarSign size={14} /> Pricing & Financial Matrix
          </button>
          {(effectiveVariant?.bom || effectiveItem?.technicalSpecification) && (
            <button
              onClick={() => setActiveTab('BOM')}
              className={cn(
                "py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all whitespace-nowrap",
                activeTab === 'BOM'
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              )}
            >
              <Boxes size={14} /> Bill of Materials (BOM)
            </button>
          )}
          {associatedVariants.length > 0 && (
            <button
              onClick={() => setActiveTab('VARIANTS')}
              className={cn(
                "py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all whitespace-nowrap",
                activeTab === 'VARIANTS'
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              )}
            >
              <Layers size={14} /> Configured Variants ({associatedVariants.length})
            </button>
          )}
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-6">
              {/* Quick Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Item / Variant Code</span>
                  <span className="text-xs font-bold font-mono text-slate-900 mt-1 block">{code}</span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Standard Unit</span>
                  <span className="text-xs font-bold font-mono text-slate-900 mt-1 block uppercase">{unit}</span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Gross Margin</span>
                  <span className="text-xs font-bold font-mono text-emerald-600 mt-1 block">
                    {Math.round(grossMargin)}% Margin
                  </span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Status</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md mt-1">
                    <Check size={12} /> Active & Ready
                  </span>
                </div>
              </div>

              {/* Barcode & Identifiers */}
              {barcodeValue && (
                <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-1 text-center sm:text-left">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <BarcodeIcon size={14} className="text-slate-500" /> GS1-Compliant Barcode
                    </span>
                    <p className="text-xs text-slate-600 font-medium">Scannable reference code for workshop inventory & site packing lists.</p>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-2xs">
                    <svg ref={barcodeRef} className="h-10 w-auto" />
                  </div>
                </div>
              )}

              {/* Description */}
              {(effectiveVariant?.customerDescription || effectiveItem?.description || effectiveItem?.longDescription) && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText size={14} className="text-slate-500" /> BOQ & Contract Description
                  </h4>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs text-slate-700 leading-relaxed">
                    {effectiveVariant?.customerDescription || effectiveVariant?.boqDescription || effectiveItem?.longDescription || effectiveItem?.description}
                  </div>
                </div>
              )}

              {/* Structured Attributes (If Variant) */}
              {effectiveVariant?.attributes && Object.keys(effectiveVariant.attributes).length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders size={14} className="text-indigo-600" /> Architectural Specifications & Attributes
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {Object.entries(effectiveVariant.attributes).map(([key, val]) => (
                      <div key={key} className="p-3 bg-white rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-500 uppercase text-[10px] tracking-wide">
                          {key.replace(/_/g, ' ')}
                        </span>
                        <span className="font-bold text-slate-800 text-right">
                          {String(val)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Technical Specifications (If Item) */}
              {effectiveItem?.technicalSpecification && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-blue-600" /> Technical Quality Standards
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {Object.entries(effectiveItem.technicalSpecification).map(([key, val]) => (
                      <div key={key} className="p-3 bg-white rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-500 uppercase text-[10px] tracking-wide">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <span className="font-bold text-slate-800 text-right">
                          {String(val)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'PRICING' && (
            <div className="space-y-6">
              {/* Financial Breakdown Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Unit Cost Price (BOM)</span>
                  <p className="text-base font-bold font-mono text-slate-900 mt-1">
                    LKR {costPrice.toLocaleString()}
                  </p>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Standard production cost</span>
                </div>
                <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-100">
                  <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Offered Selling Rate</span>
                  <p className="text-base font-bold font-mono text-blue-800 mt-1">
                    LKR {sellingPrice.toLocaleString()}
                  </p>
                  <span className="text-[10px] text-blue-600 mt-0.5 block">Standard customer quotation rate</span>
                </div>
                <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Gross Profit / Unit</span>
                  <p className="text-base font-bold font-mono text-emerald-800 mt-1">
                    + LKR {(sellingPrice - costPrice).toLocaleString()}
                  </p>
                  <span className="text-[10px] text-emerald-600 mt-0.5 block">
                    {Math.round(grossMargin)}% Gross margin on revenue
                  </span>
                </div>
              </div>

              {/* Pricing Scenarios (If Variant Pricing available) */}
              {effectiveVariant?.pricing && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Scale size={14} className="text-slate-500" /> Commercial Price Scenarios
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs">
                      <span className="text-[10px] font-bold text-rose-500 uppercase block">Minimum Price</span>
                      <span className="font-mono font-bold text-slate-800 mt-1 block">
                        LKR {Math.round(effectiveVariant.pricing.minimumPrice || (costPrice * 1.08)).toLocaleString()}
                      </span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs">
                      <span className="text-[10px] font-bold text-amber-600 uppercase block">Competitive Price</span>
                      <span className="font-mono font-bold text-slate-800 mt-1 block">
                        LKR {Math.round(effectiveVariant.pricing.competitivePrice || (costPrice * 1.18)).toLocaleString()}
                      </span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs">
                      <span className="text-[10px] font-bold text-blue-600 uppercase block">Standard Price</span>
                      <span className="font-mono font-bold text-slate-800 mt-1 block">
                        LKR {Math.round(effectiveVariant.pricing.standardPrice || sellingPrice).toLocaleString()}
                      </span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs">
                      <span className="text-[10px] font-bold text-indigo-600 uppercase block">Premium Price</span>
                      <span className="font-mono font-bold text-slate-800 mt-1 block">
                        LKR {Math.round(effectiveVariant.pricing.premiumPrice || (sellingPrice * 1.15)).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Rate History */}
              {effectiveItem?.rateHistory && effectiveItem.rateHistory.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar size={14} className="text-slate-500" /> Historical Price Adjustments
                  </h4>
                  <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-2.5">Date</th>
                          <th className="px-4 py-2.5">Rate</th>
                          <th className="px-4 py-2.5">Reason / Note</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {effectiveItem.rateHistory.map(rh => (
                          <tr key={rh.id} className="hover:bg-slate-50">
                            <td className="px-4 py-2 font-mono text-slate-600">{rh.date}</td>
                            <td className="px-4 py-2 font-mono font-bold text-slate-900">LKR {rh.rate.toLocaleString()}</td>
                            <td className="px-4 py-2 text-slate-500">{rh.reason || 'Rate update'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'BOM' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Engineered Bill of Materials (BOM)
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Direct materials, extrusion profiles, glass panels, and processing costs for 1 {unit}.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Total Cost Baseline</span>
                  <span className="text-sm font-bold font-mono text-slate-900 block">
                    LKR {costPrice.toLocaleString()}
                  </span>
                </div>
              </div>

              {effectiveVariant?.bom?.components && effectiveVariant.bom.components.length > 0 ? (
                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-2.5">Component / Material</th>
                        <th className="px-4 py-2.5">Category</th>
                        <th className="px-4 py-2.5 text-right">Quantity</th>
                        <th className="px-4 py-2.5 text-right">Unit Cost</th>
                        <th className="px-4 py-2.5 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {effectiveVariant.bom.components.map((c, idx) => {
                        const compDesc = c.description || (c as any).name || 'Component';
                        const compCat = (c as any).category || c.componentType || 'Direct Material';
                        const compQty = (c as any).qty ?? c.quantity ?? 1;
                        const compUnitCost = (c as any).unitCost ?? c.rate ?? 0;
                        const compSubtotal = c.amount ?? (compQty * compUnitCost);
                        return (
                          <tr key={c.id || idx} className="hover:bg-slate-50">
                            <td className="px-4 py-2.5 font-medium text-slate-800">
                              {compDesc}
                            </td>
                            <td className="px-4 py-2.5 text-slate-500 text-[11px]">
                              {compCat}
                            </td>
                            <td className="px-4 py-2.5 font-mono text-right text-slate-700">
                              {compQty} {c.unit}
                            </td>
                            <td className="px-4 py-2.5 font-mono text-right text-slate-700">
                              LKR {compUnitCost.toLocaleString()}
                            </td>
                            <td className="px-4 py-2.5 font-mono font-bold text-right text-slate-900">
                              LKR {compSubtotal.toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <Boxes size={32} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-xs font-semibold text-slate-600">Standard production cost baseline calculated at 72% of selling rate</p>
                  <p className="text-[11px] text-slate-400 mt-1">Detailed BOM components will populate as manufacturing recipes are assigned.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'VARIANTS' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Associated System Variants ({associatedVariants.length})
                </h4>
                <span className="text-[11px] text-slate-500">
                  Different sizes, glass thicknesses, finishes and hardware
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {associatedVariants.map(v => (
                  <div key={v.id} className="p-3.5 bg-white rounded-2xl border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 transition-colors shadow-2xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                          {v.variantCode}
                        </span>
                        {v.barcode && (
                          <span className="text-[10px] font-mono text-slate-400">
                            {v.barcode}
                          </span>
                        )}
                      </div>
                      <h5 className="text-xs font-bold text-slate-900 mt-1">
                        {v.variantName}
                      </h5>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {v.attributes && Object.entries(v.attributes).slice(0, 3).map(([k, val]) => (
                          <span key={k} className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                            {String(val)}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] text-slate-400 font-semibold block">Selling Rate</span>
                        <span className="text-xs font-bold font-mono text-slate-900">
                          LKR {(v.pricing?.sellingPrice || 0).toLocaleString()}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          if (effectiveItem && onSelectForInsert) {
                            onSelectForInsert(effectiveItem, v, 1);
                            onClose();
                          }
                        }}
                        className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                      >
                        <Plus size={12} /> Select Variant
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Action Bar */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/90 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
          {/* Multi Quantity Selector */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Quantity:</span>
            <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-2xs">
              <button
                type="button"
                onClick={() => handleQtyChange(-1)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors font-bold"
              >
                <Minus size={14} />
              </button>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={e => handleDirectQty(parseInt(e.target.value) || 1)}
                className="w-14 text-center font-bold font-mono text-sm border-none focus:outline-hidden text-slate-900 bg-transparent"
              />
              <button
                type="button"
                onClick={() => handleQtyChange(1)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors font-bold"
              >
                <Plus size={14} />
              </button>
            </div>
            <span className="text-xs font-medium text-slate-400 uppercase">
              {unit}
            </span>
          </div>

          {/* Subtotal & Insert Action */}
          <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Estimated Line Total</span>
              <span className="text-base font-bold font-mono text-slate-900">
                LKR {(quantity * sellingPrice).toLocaleString()}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleInsert}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5"
              >
                <Plus size={15} /> Add to Selection ({quantity})
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
