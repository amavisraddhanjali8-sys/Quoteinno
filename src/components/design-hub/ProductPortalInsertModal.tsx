import React, { useState, useMemo } from 'react';
import {
  ItemTemplate,
  ProductVariant,
  ItemCategory,
  BOQItem,
  ProductType,
  MeasurementUnit
} from '../../types';
import {
  Package,
  Wrench,
  Layers,
  Plus,
  Search,
  X,
  Check
} from 'lucide-react';
import { motion } from 'motion/react';

interface ProductPortalInsertModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemCatalog: ItemTemplate[];
  productVariants: ProductVariant[];
  itemCategories: ItemCategory[];
  onInsertBOQItem: (newItem: BOQItem) => void;
  onSaveNewMasterItem?: (item: ItemTemplate) => void;
  initialTab?: 'PRODUCTS' | 'SERVICES' | 'VARIANTS' | 'CREATE_NEW';
}

export const ProductPortalInsertModal: React.FC<ProductPortalInsertModalProps> = ({
  isOpen,
  onClose,
  itemCatalog,
  productVariants,
  itemCategories,
  onInsertBOQItem,
  onSaveNewMasterItem,
  initialTab = 'PRODUCTS'
}) => {
  const [activeTab, setActiveTab] = useState<'PRODUCTS' | 'SERVICES' | 'VARIANTS' | 'CREATE_NEW'>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState('All');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [recentlyAddedIds, setRecentlyAddedIds] = useState<Set<string>>(new Set());

  // New Product/Service Form State
  const [newType, setNewType] = useState<ProductType>('Product');
  const [newCode, setNewCode] = useState('PRD-2026-010');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Aluminium');
  const [newSubCategory, setNewSubCategory] = useState('Windows');
  const [newUnit, setNewUnit] = useState<MeasurementUnit>('sqft');
  const [newRate, setNewRate] = useState<number>(1850);
  const [newCost, setNewCost] = useState<number>(1320);
  const [newQty, setNewQty] = useState<number>(1);
  const [newDescription, setNewDescription] = useState('');

  const availableCategories = useMemo(() => {
    const set = new Set<string>(['All']);
    itemCatalog.forEach(i => {
      if (i.category) set.add(i.category);
    });
    itemCategories.forEach(c => {
      if (!c.parentId && c.name) set.add(c.name);
    });
    return Array.from(set);
  }, [itemCatalog, itemCategories]);

  const productItems = useMemo(() => {
    return itemCatalog.filter(it => {
      const isService =
        it.productType === 'Service' ||
        (it.category && it.category.toLowerCase().includes('service')) ||
        (it.productCode && it.productCode.toUpperCase().startsWith('SRV'));
      if (isService) return false;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        it.name.toLowerCase().includes(q) ||
        (it.productCode && it.productCode.toLowerCase().includes(q)) ||
        (it.pvcCode && it.pvcCode.toLowerCase().includes(q)) ||
        (it.description && it.description.toLowerCase().includes(q));
      const matchCat = selectedCat === 'All' || it.category === selectedCat;
      return matchSearch && matchCat;
    });
  }, [itemCatalog, searchQuery, selectedCat]);

  const serviceItems = useMemo(() => {
    return itemCatalog.filter(it => {
      const isService =
        it.productType === 'Service' ||
        (it.category && it.category.toLowerCase().includes('service')) ||
        (it.productCode && it.productCode.toUpperCase().startsWith('SRV'));
      if (!isService) return false;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        it.name.toLowerCase().includes(q) ||
        (it.productCode && it.productCode.toLowerCase().includes(q)) ||
        (it.description && it.description.toLowerCase().includes(q));
      return matchSearch;
    });
  }, [itemCatalog, searchQuery]);

  const filteredVariants = useMemo(() => {
    return productVariants.filter(v => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        v.variantName.toLowerCase().includes(q) ||
        v.variantCode.toLowerCase().includes(q) ||
        (v.boqDescription && v.boqDescription.toLowerCase().includes(q)) ||
        (v.categoryName && v.categoryName.toLowerCase().includes(q));
      return matchSearch;
    });
  }, [productVariants, searchQuery]);

  if (!isOpen) return null;

  const markAdded = (id: string) => {
    setRecentlyAddedIds(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    setTimeout(() => {
      setRecentlyAddedIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 1800);
  };

  const handleInsertItemTemplate = (item: ItemTemplate) => {
    const qty = quantities[item.id] || 1;
    const rate = item.rate || 0;
    const disc = item.discountPercent || 0;
    const sub = qty * rate;
    const isService =
      item.productType === 'Service' ||
      (item.category && item.category.toLowerCase().includes('service')) ||
      (item.productCode && item.productCode.toUpperCase().startsWith('SRV'));

    const boqItem: BOQItem = {
      id: crypto.randomUUID(),
      no: '1',
      pvcCode: item.pvcCode || item.productCode || item.code,
      productCode: item.productCode || item.code,
      name: item.name,
      description: item.description || item.detailedSpecification || '',
      itemType: 'Main',
      productType: isService ? 'Service' : 'Product',
      category: item.category || (isService ? 'Services' : 'Aluminium'),
      unit: item.unit || (isService ? 'Visit' : 'sqft'),
      qty,
      rate,
      costAtTimeOfQuote: item.lastSupplierPrice || item.costAtTimeOfQuote || Math.round(rate * 0.72),
      discountPercent: disc,
      amount: sub - sub * (disc / 100),
      templateId: item.id,
      specification: item.specification
    };

    onInsertBOQItem(boqItem);
    markAdded(item.id);
  };

  const handleInsertVariant = (variant: ProductVariant) => {
    const qty = quantities[variant.id] || 1;
    const sellingPrice = variant.pricing?.sellingPrice || variant.pricing?.standardPrice || 2200;
    const costPrice = variant.pricing?.costPrice || variant.bom?.totalCost || Math.round(sellingPrice * 0.72);

    const boqItem: BOQItem = {
      id: crypto.randomUUID(),
      no: '1',
      pvcCode: variant.pvcCode || variant.variantCode,
      productCode: variant.variantCode,
      variantId: variant.id,
      variantCode: variant.variantCode,
      name: variant.variantName,
      description:
        variant.boqDescription ||
        variant.technicalDescription ||
        variant.generatedDescription ||
        'Engineered variant from Product Portal.',
      itemType: 'Main',
      productType: 'Product',
      category: variant.categoryName || 'Aluminium',
      unit: variant.unit || 'sqft',
      qty,
      rate: sellingPrice,
      costAtTimeOfQuote: costPrice,
      marginAtTimeOfQuote: variant.pricing?.grossMarginPercent,
      discountPercent: 0,
      amount: qty * sellingPrice
    };

    onInsertBOQItem(boqItem);
    markAdded(variant.id);
  };

  const handleCreateAndInsertNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const createdTemplate: ItemTemplate = {
      id: `item-${Date.now()}`,
      productCode: newCode.trim() || (newType === 'Service' ? 'SRV-NEW-01' : 'PRD-NEW-01'),
      pvcCode: newCode.trim() || (newType === 'Service' ? 'SRV-NEW-01' : 'PRD-NEW-01'),
      name: newName.trim(),
      description:
        newDescription.trim() ||
        `${newType} specification configured in Design Hub & synced with Product Portal.`,
      category: newType === 'Service' ? 'Services' : newCategory,
      subCategory: newSubCategory,
      productType: newType,
      status: 'Active',
      unit: newUnit,
      rate: Number(newRate) || 0,
      lastSupplierPrice: Number(newCost) || Math.round((Number(newRate) || 0) * 0.72),
      costAtTimeOfQuote: Number(newCost) || Math.round((Number(newRate) || 0) * 0.72)
    };

    if (onSaveNewMasterItem) {
      onSaveNewMasterItem(createdTemplate);
    }

    const qty = Math.max(1, Number(newQty) || 1);
    const boqItem: BOQItem = {
      id: crypto.randomUUID(),
      no: '1',
      pvcCode: createdTemplate.pvcCode,
      productCode: createdTemplate.productCode,
      name: createdTemplate.name,
      description: createdTemplate.description,
      itemType: 'Main',
      productType: newType,
      category: createdTemplate.category,
      unit: createdTemplate.unit,
      qty,
      rate: createdTemplate.rate,
      costAtTimeOfQuote: createdTemplate.costAtTimeOfQuote,
      discountPercent: 0,
      amount: qty * createdTemplate.rate,
      templateId: createdTemplate.id
    };

    onInsertBOQItem(boqItem);
    setNewName('');
    setNewDescription('');
    setActiveTab(newType === 'Service' ? 'SERVICES' : 'PRODUCTS');
  };

  return (
    <div className="fixed inset-0 z-[150] bg-slate-900/45 backdrop-blur-xs flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-4xl w-full flex flex-col max-h-[88vh] overflow-hidden text-xs"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Package size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Product & Service Portal — Insert into Project Design
              </h3>
              <p className="text-xs text-slate-500">
                Add Product Items, Service Items, or BOM-Calculated Variants from the Product Portal into this design card.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 rounded-lg">
            <X size={18} />
          </button>
        </div>

        {/* Portal Mode Tabs */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('PRODUCTS')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'PRODUCTS'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Package size={13} />
              <span>Product Items ({productItems.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('SERVICES')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'SERVICES'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Wrench size={13} />
              <span>Service Items ({serviceItems.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('VARIANTS')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'VARIANTS'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Layers size={13} />
              <span>Engineered Variants ({filteredVariants.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('CREATE_NEW')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'CREATE_NEW'
                  ? 'bg-orange-500 text-white shadow-2xs'
                  : 'bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100'
              }`}
            >
              <Plus size={13} />
              <span>+ New Product / Service</span>
            </button>
          </div>

          {activeTab !== 'CREATE_NEW' && (
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
              <input
                type="text"
                placeholder="Search code, product, service..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
              />
            </div>
          )}
        </div>

        {/* Category Filter Bar for Products */}
        {activeTab === 'PRODUCTS' && (
          <div className="px-6 py-2 bg-white border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {availableCategories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCat(cat)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap border transition-colors ${
                  selectedCat === cat
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-2.5">
          {activeTab === 'PRODUCTS' && (
            <>
              {productItems.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  No matching Product Items found. Click "+ New Product / Service" to create one.
                </div>
              ) : (
                productItems.map(item => {
                  const qty = quantities[item.id] || 1;
                  const isAdded = recentlyAddedIds.has(item.id);
                  const estCost = item.lastSupplierPrice || item.costAtTimeOfQuote || Math.round(item.rate * 0.72);
                  return (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-300 bg-white flex items-center justify-between gap-4 transition-all"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold text-[10px] uppercase">
                            PRODUCT
                          </span>
                          <span className="font-bold text-slate-900 text-xs">{item.name}</span>
                          {(item.productCode || item.pvcCode) && (
                            <span className="font-mono text-[10px] font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                              {item.productCode || item.pvcCode}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-500 font-medium">
                            {item.category} {item.subCategory ? `• ${item.subCategory}` : ''}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-1">{item.description}</p>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right">
                          <div className="font-mono font-bold text-slate-900">
                            LKR {item.rate.toLocaleString()} <span className="text-[10px] font-normal text-slate-400">/ {item.unit}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            Std Cost: LKR {estCost.toLocaleString()}
                          </div>
                        </div>

                        <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                          <button
                            type="button"
                            onClick={() => setQuantities(p => ({ ...p, [item.id]: Math.max(1, qty - 1) }))}
                            className="px-2 py-1 text-slate-600 hover:bg-slate-200 font-bold"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min={1}
                            value={qty}
                            onChange={e => setQuantities(p => ({ ...p, [item.id]: Math.max(1, parseFloat(e.target.value) || 1) }))}
                            className="w-14 text-center py-1 font-mono font-bold text-xs bg-white border-x border-slate-200"
                          />
                          <button
                            type="button"
                            onClick={() => setQuantities(p => ({ ...p, [item.id]: qty + 1 }))}
                            className="px-2 py-1 text-slate-600 hover:bg-slate-200 font-bold"
                          >
                            +
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleInsertItemTemplate(item)}
                          className={`px-3.5 py-1.5 rounded-lg font-semibold text-xs flex items-center gap-1 transition-all ${
                            isAdded
                              ? 'bg-emerald-600 text-white'
                              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-2xs'
                          }`}
                        >
                          {isAdded ? <Check size={13} /> : <Plus size={13} />}
                          <span>{isAdded ? 'Added' : 'Add Product'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}

          {activeTab === 'SERVICES' && (
            <>
              {serviceItems.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  No Service Items found matching search. Click "+ New Product / Service" to add a custom service.
                </div>
              ) : (
                serviceItems.map(item => {
                  const qty = quantities[item.id] || 1;
                  const isAdded = recentlyAddedIds.has(item.id);
                  return (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-xl border border-slate-200 hover:border-emerald-300 bg-white flex items-center justify-between gap-4 transition-all"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px] uppercase">
                            SERVICE
                          </span>
                          <span className="font-bold text-slate-900 text-xs">{item.name}</span>
                          {(item.productCode || item.pvcCode) && (
                            <span className="font-mono text-[10px] font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                              {item.productCode || item.pvcCode}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-1">{item.description}</p>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right">
                          <div className="font-mono font-bold text-slate-900">
                            LKR {item.rate.toLocaleString()} <span className="text-[10px] font-normal text-slate-400">/ {item.unit}</span>
                          </div>
                        </div>

                        <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                          <button
                            type="button"
                            onClick={() => setQuantities(p => ({ ...p, [item.id]: Math.max(1, qty - 1) }))}
                            className="px-2 py-1 text-slate-600 hover:bg-slate-200 font-bold"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min={1}
                            value={qty}
                            onChange={e => setQuantities(p => ({ ...p, [item.id]: Math.max(1, parseFloat(e.target.value) || 1) }))}
                            className="w-14 text-center py-1 font-mono font-bold text-xs bg-white border-x border-slate-200"
                          />
                          <button
                            type="button"
                            onClick={() => setQuantities(p => ({ ...p, [item.id]: qty + 1 }))}
                            className="px-2 py-1 text-slate-600 hover:bg-slate-200 font-bold"
                          >
                            +
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleInsertItemTemplate(item)}
                          className={`px-3.5 py-1.5 rounded-lg font-semibold text-xs flex items-center gap-1 transition-all ${
                            isAdded
                              ? 'bg-emerald-700 text-white'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                          }`}
                        >
                          {isAdded ? <Check size={13} /> : <Plus size={13} />}
                          <span>{isAdded ? 'Added' : 'Add Service'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}

          {activeTab === 'VARIANTS' && (
            <>
              {filteredVariants.map(variant => {
                const qty = quantities[variant.id] || 1;
                const isAdded = recentlyAddedIds.has(variant.id);
                const selling = variant.pricing?.sellingPrice || variant.pricing?.standardPrice || 2200;
                const cost = variant.pricing?.costPrice || variant.bom?.totalCost || Math.round(selling * 0.72);
                const margin = variant.pricing?.grossMarginPercent ?? Math.round(((selling - cost) / selling) * 100);
                return (
                  <div
                    key={variant.id}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-indigo-300 bg-white flex items-center justify-between gap-4 transition-all"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold text-[10px] uppercase">
                          BOM VARIANT
                        </span>
                        <span className="font-bold text-slate-900 text-xs">{variant.variantName}</span>
                        <span className="font-mono text-[10px] font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                          {variant.variantCode}
                        </span>
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                          {margin.toFixed(1)}% Margin
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-1">
                        {variant.boqDescription || variant.technicalDescription || variant.generatedDescription}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <div className="font-mono font-bold text-slate-900">
                          LKR {selling.toLocaleString()} <span className="text-[10px] font-normal text-slate-400">/ {variant.unit || 'sqft'}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          BOM Cost: LKR {cost.toLocaleString()}
                        </div>
                      </div>

                      <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                        <button
                          type="button"
                          onClick={() => setQuantities(p => ({ ...p, [variant.id]: Math.max(1, qty - 1) }))}
                          className="px-2 py-1 text-slate-600 hover:bg-slate-200 font-bold"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min={1}
                          value={qty}
                          onChange={e => setQuantities(p => ({ ...p, [variant.id]: Math.max(1, parseFloat(e.target.value) || 1) }))}
                          className="w-14 text-center py-1 font-mono font-bold text-xs bg-white border-x border-slate-200"
                        />
                        <button
                          type="button"
                          onClick={() => setQuantities(p => ({ ...p, [variant.id]: qty + 1 }))}
                          className="px-2 py-1 text-slate-600 hover:bg-slate-200 font-bold"
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleInsertVariant(variant)}
                        className={`px-3.5 py-1.5 rounded-lg font-semibold text-xs flex items-center gap-1 transition-all ${
                          isAdded
                            ? 'bg-emerald-600 text-white'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs'
                        }`}
                      >
                        {isAdded ? <Check size={13} /> : <Plus size={13} />}
                        <span>{isAdded ? 'Added' : 'Insert Variant'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {activeTab === 'CREATE_NEW' && (
            <form onSubmit={handleCreateAndInsertNew} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Create & Insert New Product or Service Item</h4>
                  <p className="text-[11px] text-slate-500">
                    Saves to the central Product Portal catalog and immediately adds to this Project Design.
                  </p>
                </div>
                <div className="flex items-center bg-white p-1 rounded-lg border border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setNewType('Product');
                      setNewCode('PRD-2026-015');
                      setNewUnit('sqft');
                    }}
                    className={`px-3 py-1 rounded text-xs font-bold ${
                      newType === 'Product' ? 'bg-blue-600 text-white' : 'text-slate-600'
                    }`}
                  >
                    Product Item
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewType('Service');
                      setNewCode('SRV-2026-015');
                      setNewCategory('Services');
                      setNewUnit('Visit');
                    }}
                    className={`px-3 py-1 rounded text-xs font-bold ${
                      newType === 'Service' ? 'bg-emerald-600 text-white' : 'text-slate-600'
                    }`}
                  >
                    Service Item
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="font-semibold text-slate-700">{newType} Name *</label>
                  <input
                    type="text"
                    required
                    placeholder={
                      newType === 'Product'
                        ? 'e.g. 12mm Acoustic Laminated Glass Partition'
                        : 'e.g. Mobile Tower Scaffolding & Crane Hoisting Service'
                    }
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Item Code</label>
                  <input
                    type="text"
                    value={newCode}
                    onChange={e => setNewCode(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Category</label>
                  <input
                    type="text"
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Sub-Category</label>
                  <input
                    type="text"
                    value={newSubCategory}
                    onChange={e => setNewSubCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Measurement Unit</label>
                  <select
                    value={newUnit}
                    onChange={e => setNewUnit(e.target.value as MeasurementUnit)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-medium"
                  >
                    <option value="sqft">sqft</option>
                    <option value="sqm">sqm</option>
                    <option value="m">m</option>
                    <option value="ft">ft</option>
                    <option value="Nos">Nos</option>
                    <option value="Set">Set</option>
                    <option value="Visit">Visit</option>
                    <option value="Lot">Lot</option>
                    <option value="Hour">Hour</option>
                    <option value="Day">Day</option>
                    <option value="kg">kg</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Selling Rate (LKR)</label>
                  <input
                    type="number"
                    min={0}
                    value={newRate}
                    onChange={e => setNewRate(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Estimated Cost (LKR)</label>
                  <input
                    type="number"
                    min={0}
                    value={newCost}
                    onChange={e => setNewCost(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Design Quantity</label>
                  <input
                    type="number"
                    min={1}
                    value={newQty}
                    onChange={e => setNewQty(parseFloat(e.target.value) || 1)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Technical / Service Specification</label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  placeholder="Detailed technical specifications, materials, or service deliverables..."
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold shadow-xs"
                >
                  <Plus size={14} />
                  <span>Save to Product Portal & Add to Design</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-slate-500">
            All added Product & Service items automatically update the Project Design total & margin calculation.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold"
          >
            Done Adding Items
          </button>
        </div>
      </motion.div>
    </div>
  );
};
