import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Sparkles, SlidersHorizontal, DollarSign, Ruler, 
  Barcode, Save, ArrowLeft, ArrowRight, Tag
} from 'lucide-react';
import { BOQItem, ItemCategory } from '../../types';
import { cn } from '../../lib/utils';
import { enhanceItemDescription } from '../../services/geminiService';
import { BarcodeVisual } from './BarcodeVisual';

interface BOQItemFullScreenModalProps {
  item: BOQItem;
  itemIndex: number;
  totalItems: number;
  categories: ItemCategory[];
  units: string[];
  onSaveItem: (updated: BOQItem) => void;
  onClose: () => void;
  onNavigate?: (direction: 'prev' | 'next') => void;
  onAddNewCategory?: (catName: string) => void;
  onAddNewUnit?: (unitName: string) => void;
  onOpenSpecs?: (item: BOQItem) => void;
  onOpenMeasurements?: (item: BOQItem) => void;
  onOpenCharges?: (item: BOQItem) => void;
}

export const BOQItemFullScreenModal: React.FC<BOQItemFullScreenModalProps> = ({
  item,
  itemIndex,
  totalItems,
  categories,
  units,
  onSaveItem,
  onClose,
  onNavigate,
  onAddNewCategory,
  onAddNewUnit,
  onOpenSpecs,
  onOpenMeasurements,
  onOpenCharges
}) => {
  const [formData, setFormData] = useState<BOQItem>({ ...item });
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [showNewCatInput, setShowNewCatInput] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [showNewUnitInput, setShowNewUnitInput] = useState(false);
  const [newUnitName, setNewUnitName] = useState('');
  const [activeTab, setActiveTab] = useState<'DETAILS' | 'SPECS' | 'CHARGES'>('DETAILS');

  useEffect(() => {
    setFormData({ ...item });
  }, [item]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleChange = <K extends keyof BOQItem>(field: K, val: BOQItem[K]) => {
    setFormData(prev => {
      const next = { ...prev, [field]: val };
      if (field === 'itemType' && val === 'Title') {
        next.unit = 'None';
        next.qty = 0;
        next.rate = 0;
        next.amount = 0;
      } else if (field === 'qty' || field === 'rate' || field === 'discountPercent') {
        const qty = next.qty || 0;
        const rate = next.rate || 0;
        const disc = next.discountPercent || 0;
        const subtotal = qty * rate;
        const discAmount = subtotal * (disc / 100);
        const exclusiveCharges = next.itemCharges?.filter(c => !c.isInclusive).reduce((sum, c) => sum + c.amount, 0) || 0;
        next.amount = Math.max(0, subtotal - discAmount + exclusiveCharges);
      }
      return next;
    });
  };

  const handleEnhance = async () => {
    setIsEnhancing(true);
    try {
      const res = await enhanceItemDescription(formData);
      if (res) {
        handleChange('description', res);
      }
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleSaveAndClose = () => {
    onSaveItem(formData);
    onClose();
  };

  const handleCreateCategory = () => {
    if (!newCatName.trim()) return;
    onAddNewCategory?.(newCatName.trim());
    handleChange('category', newCatName.trim());
    setNewCatName('');
    setShowNewCatInput(false);
  };

  const handleCreateUnit = () => {
    if (!newUnitName.trim()) return;
    onAddNewUnit?.(newUnitName.trim());
    handleChange('unit', newUnitName.trim());
    setNewUnitName('');
    setShowNewUnitInput(false);
  };

  const isTitle = formData.itemType === 'Title';
  const isSub = formData.itemType === 'Sub';

  return createPortal(
    <div className="fixed inset-0 z-[999] w-screen h-screen bg-slate-900/60 backdrop-blur-xs flex flex-col items-center justify-center p-0 md:p-3 overflow-hidden animate-in fade-in duration-150">
      <div className="bg-white w-full h-full md:rounded-2xl shadow-2xl flex flex-col border border-slate-200 overflow-hidden">
        {/* Top Header Bar */}
        <header className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between gap-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="px-2.5 py-1 rounded bg-blue-600 text-white font-mono text-xs font-bold shadow-xs">
              {formData.no || `#${itemIndex + 1}`}
            </span>
            <div className="min-w-0">
              <h2 className="text-sm md:text-base font-bold truncate tracking-tight text-white flex items-center gap-2">
                {formData.name || (isTitle ? 'Untitled Section Title' : 'Untitled BOQ Item')}
                <span className={cn(
                  "text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider",
                  isTitle ? "bg-amber-400 text-amber-950 font-black" :
                  isSub ? "bg-slate-700 text-slate-200" :
                  "bg-blue-500 text-white"
                )}>
                  {formData.itemType} Item
                </span>
              </h2>
              <p className="text-[10px] text-slate-400 font-medium">
                Full-Screen Item View & Description Editor • Item {itemIndex + 1} of {totalItems}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onNavigate && (
              <div className="hidden sm:flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
                <button
                  type="button"
                  onClick={() => onNavigate('prev')}
                  disabled={itemIndex === 0}
                  className="px-2 py-1 text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-30 rounded text-xs font-bold transition-all flex items-center gap-1"
                >
                  <ArrowLeft size={12} /> Prev
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('next')}
                  disabled={itemIndex === totalItems - 1}
                  className="px-2 py-1 text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-30 rounded text-xs font-bold transition-all flex items-center gap-1"
                >
                  Next <ArrowRight size={12} />
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={handleSaveAndClose}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-blue-600/30 cursor-pointer"
            >
              <Save size={13} />
              <span>Save & Close</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Close (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        {/* Action & Tab Navigation Row */}
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Hierarchy Type:</span>
            <div className="inline-flex bg-white rounded-lg p-0.5 border border-slate-300 shadow-2xs">
              <button
                type="button"
                onClick={() => handleChange('itemType', 'Title')}
                className={cn(
                  "px-3 py-1 rounded text-xs font-bold transition-all",
                  isTitle ? "bg-amber-500 text-slate-950 shadow-xs" : "text-slate-600 hover:bg-slate-100"
                )}
              >
                Title (Header)
              </button>
              <button
                type="button"
                onClick={() => handleChange('itemType', 'Main')}
                className={cn(
                  "px-3 py-1 rounded text-xs font-bold transition-all",
                  formData.itemType === 'Main' ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"
                )}
              >
                Main Item
              </button>
              <button
                type="button"
                onClick={() => handleChange('itemType', 'Sub')}
                className={cn(
                  "px-3 py-1 rounded text-xs font-bold transition-all",
                  isSub ? "bg-slate-800 text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"
                )}
              >
                Sub Item
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Item No:</span>
              <input
                type="text"
                value={formData.no ?? ''}
                onChange={(e) => {
                  handleChange('no', e.target.value);
                  handleChange('hasCustomNo', true);
                }}
                placeholder="1.0"
                className="w-20 bg-white border border-slate-300 rounded px-2 py-1 text-xs font-bold font-mono text-slate-800 focus:ring-1 focus:ring-blue-600 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('DETAILS')}
                className={cn(
                  "px-3 py-1 text-xs font-bold rounded-lg transition-all",
                  activeTab === 'DETAILS' ? "bg-white text-blue-700 shadow-2xs border border-slate-300" : "text-slate-600 hover:bg-slate-200"
                )}
              >
                Description & Pricing
              </button>
              {!isTitle && (
                <>
                  <button
                    type="button"
                    onClick={() => setActiveTab('SPECS')}
                    className={cn(
                      "px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1",
                      activeTab === 'SPECS' ? "bg-white text-blue-700 shadow-2xs border border-slate-300" : "text-slate-600 hover:bg-slate-200"
                    )}
                  >
                    <SlidersHorizontal size={12} />
                    <span>Specs</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('CHARGES')}
                    className={cn(
                      "px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1",
                      activeTab === 'CHARGES' ? "bg-white text-blue-700 shadow-2xs border border-slate-300" : "text-slate-600 hover:bg-slate-200"
                    )}
                  >
                    <DollarSign size={12} />
                    <span>Charges ({formData.itemCharges?.length || 0})</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-100/50">
          {activeTab === 'DETAILS' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 max-w-7xl mx-auto">
              {/* Left Column: Name & Full Multi-line Description */}
              <div className="lg:col-span-8 space-y-4">
                {/* Item Name */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                      {isTitle ? 'Section Title Name' : 'Item Name / Title'}
                    </label>
                    <span className="text-[9px] font-mono text-slate-400">
                      {isTitle ? 'Printed as section header with no values' : 'Printed on main item line'}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={formData.name ?? ''}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder={isTitle ? "e.g. 1.0 PRELIMINARIES & SITE WORKS" : "e.g. Aluminium 2-Track Sliding Window"}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  />
                </div>

                {/* Full-Screen Detailed Description Editor */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                        <span>Full Detailed Description</span>
                        <span className="text-[9px] text-slate-400 font-normal">(Compact in table, full view here)</span>
                      </label>
                      <p className="text-[10px] text-slate-400">
                        Fits into full screen. Multi-line description, fabrication specs, and special client terms.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleEnhance}
                      disabled={isEnhancing}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs",
                        isEnhancing && "animate-pulse"
                      )}
                    >
                      <Sparkles size={12} className={cn("text-amber-600", isEnhancing && "animate-spin")} />
                      <span>{isEnhancing ? 'Enhancing Description...' : 'AI Enhance Description'}</span>
                    </button>
                  </div>

                  <textarea
                    rows={8}
                    value={formData.description ?? ''}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Enter detailed multi-line specification, aperture sizes, architectural profile codes, glass tint, hardware specifications, and installation details..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs md:text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden leading-relaxed font-sans"
                  />

                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>{formData.description ? formData.description.split('\n').length : 0} lines • {formData.description ? formData.description.length : 0} characters</span>
                    <span>Single-line compressed in table; expanded in full screen</span>
                  </div>
                </div>

                {/* Calculation / Sheet Notes */}
                {formData.calculations && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 flex items-center gap-2">
                    <Ruler size={14} className="text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-bold">Calculations: </span>
                      <span>{formData.calculations}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Category, Unit, Quantity, Rate & Calculations */}
              <div className="lg:col-span-4 space-y-4">
                {/* Category & Unit Box */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                    <Tag size={13} className="text-blue-600" />
                    <span>Classification & Units</span>
                  </h3>

                  {/* Category Field */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Category</label>
                      <button
                        type="button"
                        onClick={() => setShowNewCatInput(!showNewCatInput)}
                        className="text-[9px] font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                      >
                        {showNewCatInput ? 'Cancel' : '+ New Category'}
                      </button>
                    </div>

                    {showNewCatInput ? (
                      <div className="flex gap-1 items-center">
                        <input
                          type="text"
                          value={newCatName}
                          onChange={(e) => setNewCatName(e.target.value)}
                          placeholder="New Category Name..."
                          className="flex-1 bg-slate-50 border border-blue-300 rounded px-2 py-1 text-xs font-bold text-slate-800 focus:bg-white focus:outline-hidden"
                        />
                        <button
                          type="button"
                          onClick={handleCreateCategory}
                          className="px-2 py-1 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-500 cursor-pointer"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <select
                        value={formData.category ?? 'Aluminium'}
                        onChange={(e) => handleChange('category', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:bg-white focus:ring-1 focus:ring-blue-600 focus:outline-hidden"
                      >
                        {categories.map(c => (
                          <option key={c.id} value={c.name}>
                            {c.parentId ? `  • ${c.name}` : c.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Unit Field */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Unit Type</label>
                      <button
                        type="button"
                        onClick={() => setShowNewUnitInput(!showNewUnitInput)}
                        className="text-[9px] font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                      >
                        {showNewUnitInput ? 'Cancel' : '+ New Unit'}
                      </button>
                    </div>

                    {showNewUnitInput ? (
                      <div className="flex gap-1 items-center">
                        <input
                          type="text"
                          value={newUnitName}
                          onChange={(e) => setNewUnitName(e.target.value)}
                          placeholder="e.g. Roll, Box, Lot..."
                          className="flex-1 bg-slate-50 border border-blue-300 rounded px-2 py-1 text-xs font-bold text-slate-800 focus:bg-white focus:outline-hidden"
                        />
                        <button
                          type="button"
                          onClick={handleCreateUnit}
                          className="px-2 py-1 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-500 cursor-pointer"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <select
                        value={formData.unit ?? 'sqft'}
                        onChange={(e) => handleChange('unit', e.target.value)}
                        disabled={isTitle}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:bg-white focus:ring-1 focus:ring-blue-600 focus:outline-hidden disabled:bg-slate-100 disabled:text-slate-400"
                      >
                        {units.map(u => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {/* Values & Quantities Card (Disabled if Title) */}
                <div className={cn(
                  "bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3 transition-opacity",
                  isTitle ? "opacity-50 pointer-events-none" : "opacity-100"
                )}>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <DollarSign size={13} className="text-emerald-600" />
                      <span>Commercial Rate & Qty</span>
                    </span>
                    {isTitle && <span className="text-[9px] text-amber-600 font-bold">N/A for Title</span>}
                  </h3>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Quantity</label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={formData.qty ?? 0}
                        onChange={(e) => handleChange('qty', parseFloat(e.target.value) || 0)}
                        disabled={isTitle || !!formData.measurements}
                        className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs font-bold font-mono focus:bg-white focus:ring-1 focus:ring-blue-600 focus:outline-hidden"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Rate (Rs.)</label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={formData.rate ?? 0}
                        onChange={(e) => handleChange('rate', parseFloat(e.target.value) || 0)}
                        disabled={isTitle}
                        className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs font-bold font-mono focus:bg-white focus:ring-1 focus:ring-blue-600 focus:outline-hidden"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Discount %</label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        max="100"
                        value={formData.discountPercent ?? 0}
                        onChange={(e) => handleChange('discountPercent', parseFloat(e.target.value) || 0)}
                        disabled={isTitle}
                        className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs font-bold font-mono focus:bg-white focus:ring-1 focus:ring-blue-600 focus:outline-hidden"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Amount (Rs.)</label>
                      <div className="w-full bg-slate-100 border border-slate-200 rounded px-2.5 py-1.5 text-xs font-bold font-mono text-slate-900 text-right">
                        {isTitle ? '-' : (formData.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>

                  {/* Measurement Sheet button */}
                  {onOpenMeasurements && (
                    <button
                      type="button"
                      onClick={() => onOpenMeasurements(formData)}
                      className="w-full mt-2 py-1.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Ruler size={13} className="text-emerald-600" />
                      <span>{formData.measurements ? 'Edit Measurement Sheet' : '+ Attach Measurement Sheet'}</span>
                    </button>
                  )}
                </div>

                {/* PVC & Barcode Card */}
                {!isTitle && (
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Barcode size={13} className="text-amber-600" />
                        <span>Barcode & Identifiers</span>
                      </span>
                    </h3>
                    <div className="space-y-1 text-xs font-mono">
                      {formData.pvcCode && (
                        <div className="p-2 bg-slate-50 rounded border border-slate-200 flex flex-col items-center">
                          <BarcodeVisual value={formData.pvcCode} format="CODE128" width={1.2} height={24} displayValue={false} />
                          <span className="text-[9px] font-bold text-slate-500 mt-1">PVC: {formData.pvcCode}</span>
                        </div>
                      )}
                      {(formData.variantBarcode || formData.barcode) && (
                        <p className="text-[10px] text-slate-500">
                          <span className="font-bold">Variant Barcode:</span> {formData.variantBarcode || formData.barcode}
                        </p>
                      )}
                      {formData.productCode && (
                        <p className="text-[10px] text-slate-500">
                          <span className="font-bold">Product Code:</span> {formData.productCode}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'SPECS' && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs max-w-4xl mx-auto space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Technical Specifications</h3>
                  <p className="text-xs text-slate-400">Architectural systems, material grades, and tolerances</p>
                </div>
                {onOpenSpecs && (
                  <button
                    type="button"
                    onClick={() => onOpenSpecs(formData)}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <SlidersHorizontal size={12} />
                    <span>Open Specification Portal</span>
                  </button>
                )}
              </div>

              {formData.specification ? (
                <div className="space-y-3 text-xs">
                  {formData.specification.core && (
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <h4 className="font-bold text-slate-700 mb-1">Core Architecture</h4>
                      <div className="grid grid-cols-3 gap-2">
                        <div><span className="text-slate-400">System:</span> <span className="font-bold">{formData.specification.core.systemType || '-'}</span></div>
                        <div><span className="text-slate-400">Location:</span> <span className="font-bold">{formData.specification.core.location || '-'}</span></div>
                        <div><span className="text-slate-400">Reference:</span> <span className="font-bold">{formData.specification.core.reference || '-'}</span></div>
                      </div>
                    </div>
                  )}
                  {formData.specification.dimensions && (
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <h4 className="font-bold text-slate-700 mb-1">Dimensions</h4>
                      <p>
                        Width: <span className="font-bold">{formData.specification.dimensions.width || '-'}</span> | 
                        Height: <span className="font-bold">{formData.specification.dimensions.height || '-'}</span> | 
                        Panels: <span className="font-bold">{formData.specification.dimensions.panels || '-'}</span>
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-xl">
                  <SlidersHorizontal size={32} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-slate-500 text-xs font-bold">No technical specifications assigned yet</p>
                  <p className="text-slate-400 text-[10px] mt-1">Click the button above to launch the specification engine</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'CHARGES' && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs max-w-4xl mx-auto space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Additional Charges</h3>
                  <p className="text-xs text-slate-400">Scaffolding, crane hoisting, specialized access, and delivery</p>
                </div>
                {onOpenCharges && (
                  <button
                    type="button"
                    onClick={() => onOpenCharges(formData)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <DollarSign size={12} />
                    <span>Manage Item Charges</span>
                  </button>
                )}
              </div>

              {formData.itemCharges && formData.itemCharges.length > 0 ? (
                <div className="space-y-2">
                  {formData.itemCharges.map((c) => (
                    <div key={c.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                      <div>
                        <span className="font-bold text-slate-900">{c.name}</span>
                        <span className="ml-2 text-[10px] text-slate-400 font-mono">({c.isInclusive ? 'Inclusive' : 'Exclusive'})</span>
                      </div>
                      <span className="font-mono font-bold text-slate-900">Rs. {c.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-xl">
                  <DollarSign size={32} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-slate-500 text-xs font-bold">No additional charges added</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Save Footer */}
        <footer className="px-5 py-3 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500 font-medium">
            Press <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-[10px] font-mono font-bold">Esc</kbd> or click Close to return to the BOQ table.
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveAndClose}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-blue-600/30 cursor-pointer"
            >
              <Save size={14} />
              <span>Save Changes</span>
            </button>
          </div>
        </footer>
      </div>
    </div>,
    document.body
  );
};
