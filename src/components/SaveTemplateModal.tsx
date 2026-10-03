import React, { useState } from 'react';
import { Quote, QuoteTemplate, QuotationType, Term, BOQItem, PaymentTier, DesignCategory } from '../types';
import { 
  Save, 
  X, 
  Check, 
  Layers, 
  DollarSign, 
  Tag,
  ChevronDown,
  ChevronUp,
  Upload,
  Image as ImageIcon,
  Video,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, getQuoteTotalBreakdown } from '../lib/utils';
import {
  DEFAULT_DESIGN_CATEGORIES,
  DESIGN_CATEGORIES_STORAGE_KEY,
  validateDesignMediaFile,
  readFileAsDataURL,
  formatBytes
} from './design-hub/designHubDefaults';

interface SaveTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (template: QuoteTemplate) => void;
  quote: Quote;
  categories?: string[];
}

const COMMON_TAGS = [
  'Aluminium',
  'Shopfront',
  'Curtain Wall',
  'Partition',
  'Frameless Glass',
  'Commercial',
  'Residential',
  'Budgetary'
];

export const SaveTemplateModal: React.FC<SaveTemplateModalProps> = ({
  isOpen,
  onClose,
  onSave,
  quote,
  categories = [
    'Aluminium & Windows',
    'Glazing & Shopfront',
    'Curtain Wall & Facade',
    'Interior Fit-out',
    'Budgetary Estimation',
    'Steel & Metal Works',
    'Turnkey Architectural'
  ]
}) => {
  const quoteTotals = getQuoteTotalBreakdown(quote);

  const designCategories: DesignCategory[] = React.useMemo(() => {
    try {
      const saved = localStorage.getItem(DESIGN_CATEGORIES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_DESIGN_CATEGORIES;
  }, [isOpen]);

  const mainDesignCategories = React.useMemo(
    () => designCategories.filter(c => !c.parentId),
    [designCategories]
  );

  const [name, setName] = useState(
    quote.projectName ? `${quote.projectName} Design` : 'Standard Architectural Project Design'
  );
  const [description, setDescription] = useState(
    quote.projectName 
      ? `Reusable project design & quotation template derived from ${quote.projectName} (${quote.quoteType || 'Standard'}).` 
      : 'Standard architectural project design framework with pre-configured products, services, and contract terms.'
  );
  const [category, setCategory] = useState(mainDesignCategories[0]?.name || categories[0]);
  const [subCategory, setSubCategory] = useState(() => {
    const firstMain = mainDesignCategories[0];
    const firstSub = firstMain ? designCategories.find(s => s.parentId === firstMain.id) : undefined;
    return firstSub?.name || '';
  });
  const [designCode, setDesignCode] = useState(`DSG-${new Date().getFullYear()}-${String(Math.floor(100 + Math.random() * 900))}`);
  const [quoteType, setQuoteType] = useState<QuotationType>(quote.quoteType || 'Unit Rate');
  const [validityDays, setValidityDays] = useState(quote.validityDays || 30);
  const [advancePercent, setAdvancePercent] = useState(quote.advancePercent || 50);
  const [estimatedDeliveryDays, setEstimatedDeliveryDays] = useState(quote.estimatedDeliveryDays || 21);
  const [taxPercent, setTaxPercent] = useState(quote.taxPercent || 0);
  const [isTaxInclusive, setIsTaxInclusive] = useState(quote.isTaxInclusive || false);
  const [tagsInput, setTagsInput] = useState(
    quote.quoteType ? `${quote.quoteType}, Architectural` : 'Architectural, Standard'
  );
  const [notes, setNotes] = useState('');

  // Media state (1MB Image / 10MB Video)
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'none'>('none');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaFileName, setMediaFileName] = useState('');
  const [mediaFileSize, setMediaFileSize] = useState(0);
  const [mediaError, setMediaError] = useState<string | null>(null);

  const selectedCatObj = mainDesignCategories.find(c => c.name === category);
  const availableSubCategories = selectedCatObj
    ? designCategories.filter(s => s.parentId === selectedCatObj.id)
    : [];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaError(null);
    const check = validateDesignMediaFile(file);
    if (!check.valid) {
      setMediaError(check.error || 'Invalid file');
      e.target.value = '';
      return;
    }
    try {
      const dataUrl = await readFileAsDataURL(file);
      setMediaType(check.mediaType || 'image');
      setMediaUrl(dataUrl);
      setMediaFileName(file.name);
      setMediaFileSize(file.size);
    } catch {
      setMediaError('Failed to read media file.');
    }
  };

  // Inclusions
  const [includeItems, setIncludeItems] = useState(true);
  const [includeTerms, setIncludeTerms] = useState(true);
  const [includeTiers, setIncludeTiers] = useState(true);

  // Item customization: selected item IDs & quantity mode
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(
    () => new Set(quote.items.map(it => it.id))
  );
  const [resetQuantitiesToOne, setResetQuantitiesToOne] = useState(false);
  const [showItemSelector, setShowItemSelector] = useState(false);

  if (!isOpen) return null;

  const toggleItemSelection = (id: string) => {
    setSelectedItemIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAllItems = () => {
    setSelectedItemIds(new Set(quote.items.map(it => it.id)));
  };

  const deselectAllItems = () => {
    setSelectedItemIds(new Set());
  };

  const handleAddTag = (tag: string) => {
    const currentTags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
    if (!currentTags.includes(tag)) {
      setTagsInput(currentTags.concat(tag).join(', '));
    }
  };

  const handleSave = () => {
    if (!name.trim()) return;

    const parsedTags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const itemsToSave: BOQItem[] = includeItems
      ? quote.items
          .filter(it => selectedItemIds.has(it.id))
          .map(it => {
            const qty = resetQuantitiesToOne && it.itemType !== 'Title' ? 1 : it.qty;
            const subtotal = qty * it.rate;
            const discount = subtotal * ((it.discountPercent || 0) / 100);
            return {
              ...it,
              id: crypto.randomUUID(),
              qty,
              amount: subtotal - discount
            };
          })
      : [];

    const termsToSave: Term[] = includeTerms
      ? (quote.terms || []).map(t => ({ ...t }))
      : [];

    const tiersToSave: PaymentTier[] = includeTiers && quote.paymentTiers
      ? quote.paymentTiers.map(t => ({
          ...t,
          id: crypto.randomUUID(),
          status: 'Pending'
        }))
      : [];

    const newTemplate: QuoteTemplate = {
      id: crypto.randomUUID(),
      name: name.trim(),
      designCode: designCode.trim() || undefined,
      description: description.trim(),
      category,
      subCategory: subCategory || undefined,
      quoteType,
      validityDays: Number(validityDays) || 30,
      advancePercent: Number(advancePercent) || 0,
      taxPercent: Number(taxPercent) || 0,
      isTaxInclusive,
      estimatedDeliveryDays: Number(estimatedDeliveryDays) || 14,
      currency: quote.currency || 'LKR',
      mediaType,
      mediaUrl: mediaUrl || undefined,
      mediaFileName: mediaFileName || undefined,
      mediaFileSize: mediaFileSize || undefined,
      items: itemsToSave,
      terms: termsToSave,
      paymentTiers: tiersToSave,
      isCustom: true,
      tags: parsedTags,
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSave(newTemplate);
    onClose();
  };

  const itemsSelectedCount = quote.items.filter(it => selectedItemIds.has(it.id)).length;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-[130] flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 8 }}
        className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col my-auto"
      >
        {/* Simple Light Header */}
        <div className="bg-white px-6 py-4 flex items-center justify-between border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 border border-orange-100">
              <Save size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-tight">Save to Project Design & Template Hub</h3>
              <p className="text-xs text-slate-500">Save active project design, products, services, media, and terms into the Design Hub</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto max-h-[75vh] space-y-4 text-xs">
          {/* Basic Template Details */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-semibold text-slate-700">Project Design / Template Title</label>
                <input
                  type="text"
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Commercial Glazing Design 2026"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Design Code</label>
                <input
                  type="text"
                  value={designCode}
                  onChange={(e) => setDesignCode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Main Design Category</label>
                <select
                  value={category}
                  onChange={(e) => {
                    const nextCat = e.target.value;
                    setCategory(nextCat);
                    const found = mainDesignCategories.find(c => c.name === nextCat);
                    const firstSub = found ? designCategories.find(s => s.parentId === found.id) : undefined;
                    setSubCategory(firstSub?.name || '');
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all cursor-pointer"
                >
                  {mainDesignCategories.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Sub-Category</label>
                <select
                  value={subCategory}
                  onChange={(e) => setSubCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all cursor-pointer"
                >
                  <option value="">General / All</option>
                  {availableSubCategories.map((s) => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Pricing Model</label>
                <select
                  value={quoteType}
                  onChange={(e) => setQuoteType(e.target.value as QuotationType)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all cursor-pointer"
                >
                  <option value="Fixed Price">Fixed Price (Lump Sum Contract)</option>
                  <option value="Unit Rate">Unit Rate (Remeasurable BOQ)</option>
                  <option value="Budgetary">Budgetary (Preliminary Estimate)</option>
                  <option value="Executive">Executive (High-Level Package)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Description</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary of this project design and scope..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-normal text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all resize-none"
              />
            </div>

            {/* Cover Image (Max 1MB) or Video (Max 10MB) Upload */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <ImageIcon size={13} className="text-orange-500" />
                  <span>Design Card Media (Image ≤ 1MB or Video ≤ 10MB)</span>
                </span>
                <label className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-semibold cursor-pointer">
                  <Upload size={11} />
                  <span>Upload Image / Video</span>
                  <input type="file" accept="image/*,video/*" onChange={handleFileChange} className="hidden" />
                </label>
              </div>
              {mediaError && (
                <div className="p-2 rounded bg-rose-50 border border-rose-200 text-rose-700 text-[11px] flex items-center gap-1.5 font-medium">
                  <AlertCircle size={13} />
                  <span>{mediaError}</span>
                </div>
              )}
              {mediaUrl && (
                <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-2">
                    {mediaType === 'video' ? <Video size={14} className="text-sky-600" /> : <ImageIcon size={14} className="text-emerald-600" />}
                    <span className="text-xs font-semibold text-slate-800 truncate max-w-[240px]">{mediaFileName}</span>
                    <span className="text-[10px] font-mono text-slate-500">({formatBytes(mediaFileSize)})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setMediaType('none');
                      setMediaUrl('');
                      setMediaFileName('');
                      setMediaFileSize(0);
                    }}
                    className="text-xs text-rose-600 hover:underline font-semibold"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Scope Inclusions */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Layers size={14} className="text-orange-500" />
                <span>Components to Include</span>
              </h4>
              <span className="text-[11px] text-slate-400">Choose which sections to save</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <label className={cn(
                "flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all",
                includeItems ? "bg-white border-orange-500/40 shadow-2xs" : "bg-slate-100/60 border-slate-200 opacity-60"
              )}>
                <input
                  type="checkbox"
                  checked={includeItems}
                  onChange={(e) => setIncludeItems(e.target.checked)}
                  className="mt-0.5 rounded text-orange-500 focus:ring-orange-400"
                />
                <div>
                  <span className="font-semibold text-slate-800 block text-xs">BOQ Line Items</span>
                  <span className="text-[11px] text-slate-500 font-normal">
                    {itemsSelectedCount} items ({quote.currency || 'LKR'} {quoteTotals.subTotal.toLocaleString()})
                  </span>
                </div>
              </label>

              <label className={cn(
                "flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all",
                includeTerms ? "bg-white border-orange-500/40 shadow-2xs" : "bg-slate-100/60 border-slate-200 opacity-60"
              )}>
                <input
                  type="checkbox"
                  checked={includeTerms}
                  onChange={(e) => setIncludeTerms(e.target.checked)}
                  className="mt-0.5 rounded text-orange-500 focus:ring-orange-400"
                />
                <div>
                  <span className="font-semibold text-slate-800 block text-xs">Terms & Clauses</span>
                  <span className="text-[11px] text-slate-500 font-normal">
                    {(quote.terms || []).length} contract clauses
                  </span>
                </div>
              </label>

              <label className={cn(
                "flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all",
                includeTiers ? "bg-white border-orange-500/40 shadow-2xs" : "bg-slate-100/60 border-slate-200 opacity-60"
              )}>
                <input
                  type="checkbox"
                  checked={includeTiers}
                  onChange={(e) => setIncludeTiers(e.target.checked)}
                  className="mt-0.5 rounded text-orange-500 focus:ring-orange-400"
                />
                <div>
                  <span className="font-semibold text-slate-800 block text-xs">Payment Milestones</span>
                  <span className="text-[11px] text-slate-500 font-normal">
                    {(quote.paymentTiers || []).length} stage schedule
                  </span>
                </div>
              </label>
            </div>

            {/* Granular Line Item Selector */}
            {includeItems && quote.items.length > 0 && (
              <div className="pt-2 border-t border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowItemSelector(!showItemSelector)}
                      className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1"
                    >
                      <span>Custom Item Selection ({itemsSelectedCount}/{quote.items.length})</span>
                      {showItemSelector ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>

                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-600">
                    <input
                      type="checkbox"
                      checked={resetQuantitiesToOne}
                      onChange={(e) => setResetQuantitiesToOne(e.target.checked)}
                      className="rounded text-orange-500 focus:ring-orange-400"
                    />
                    <span>Reset quantities to 1 (Framework default)</span>
                  </label>
                </div>

                <AnimatePresence>
                  {showItemSelector && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-white border border-slate-200 rounded-lg p-2 max-h-40 overflow-y-auto space-y-1">
                        <div className="flex items-center justify-between pb-1 mb-1 border-b border-slate-100 text-[10px] text-slate-500">
                          <span>Select items to include in this template</span>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={selectAllItems}
                              className="text-orange-600 hover:underline font-medium"
                            >
                              Select All
                            </button>
                            <span>•</span>
                            <button
                              type="button"
                              onClick={deselectAllItems}
                              className="text-slate-500 hover:underline font-medium"
                            >
                              Deselect All
                            </button>
                          </div>
                        </div>

                        {quote.items.map((item, idx) => {
                          const isChecked = selectedItemIds.has(item.id);
                          return (
                            <label
                              key={item.id || idx}
                              className={cn(
                                "flex items-center justify-between p-1.5 rounded hover:bg-slate-50 cursor-pointer text-[11px] transition-colors",
                                isChecked ? "text-slate-800" : "text-slate-400 line-through"
                              )}
                            >
                              <div className="flex items-center gap-2 truncate pr-2">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => toggleItemSelection(item.id)}
                                  className="rounded text-orange-500 focus:ring-orange-400"
                                />
                                <span className="font-medium truncate">{item.name || `Item ${idx + 1}`}</span>
                              </div>
                              <span className="font-mono text-slate-500 shrink-0">
                                {quote.currency || 'LKR'} {item.rate.toLocaleString()}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Commercial & Timeline Defaults */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <DollarSign size={14} className="text-orange-500" />
              <span>Commercial & Delivery Defaults</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-600">Validity (Days)</label>
                <input
                  type="number"
                  min={1}
                  value={validityDays}
                  onChange={(e) => setValidityDays(parseInt(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-600">Advance (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={advancePercent}
                  onChange={(e) => setAdvancePercent(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-600">Delivery (Days)</label>
                <input
                  type="number"
                  min={1}
                  value={estimatedDeliveryDays}
                  onChange={(e) => setEstimatedDeliveryDays(parseInt(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-600">Tax (%)</label>
                <input
                  type="number"
                  min={0}
                  value={taxPercent}
                  onChange={(e) => setTaxPercent(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isTaxInclusive"
                checked={isTaxInclusive}
                onChange={(e) => setIsTaxInclusive(e.target.checked)}
                className="rounded text-orange-500 focus:ring-orange-400"
              />
              <label htmlFor="isTaxInclusive" className="text-xs text-slate-700 font-medium cursor-pointer">
                Prices in this template are inclusive of statutory taxes
              </label>
            </div>
          </div>

          {/* Tags & Internal Notes */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Tag size={13} className="text-slate-400" />
                  <span>Tags</span>
                </span>
                <span className="text-[10px] text-slate-400 font-normal">Comma-separated</span>
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="e.g. Aluminium, Shopfront, Exterior"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {COMMON_TAGS.map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleAddTag(t)}
                    className="text-[10px] px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded transition-colors"
                  >
                    + {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Internal Estimator Notes</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Standard warranty applies, minimum order size 50 sqft"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-normal focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between gap-3">
          <span className="text-xs text-slate-500">
            {includeItems ? `${itemsSelectedCount} items selected` : 'Empty items template'}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/80 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!name.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-lg transition-colors shadow-2xs disabled:opacity-50"
            >
              <Check size={14} />
              <span>Save Template</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
