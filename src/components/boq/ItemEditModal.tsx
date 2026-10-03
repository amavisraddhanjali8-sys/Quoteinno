import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Package, Layers, Percent, FileText } from 'lucide-react';
import { ItemTemplate, ItemCategory, ProductType, ItemStatus, MeasurementUnit } from '../../types';

interface ItemEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: ItemTemplate) => void;
  categories: ItemCategory[];
  itemToEdit?: ItemTemplate | null;
  initialCategoryId?: string | null;
}

export const ItemEditModal: React.FC<ItemEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  categories,
  itemToEdit,
  initialCategoryId
}) => {
  const [name, setName] = useState(itemToEdit?.name || '');
  const [productCode, setProductCode] = useState(itemToEdit?.productCode || `BOQ-${Math.floor(100 + Math.random() * 900)}`);
  const [categoryId, setCategoryId] = useState<string>(
    itemToEdit?.categoryId || initialCategoryId || (categories.length > 0 ? categories[0].id : '')
  );
  const [description, setDescription] = useState(itemToEdit?.description || '');
  const [detailedSpecification, setDetailedSpecification] = useState(itemToEdit?.detailedSpecification || '');
  const [unit, setUnit] = useState<MeasurementUnit>(itemToEdit?.unit || 'sqft');
  const [rate, setRate] = useState<number>(itemToEdit?.rate || 1200);
  const [lastSupplierPrice, setLastSupplierPrice] = useState<number>(
    itemToEdit?.lastSupplierPrice || Math.round((itemToEdit?.rate || 1200) * 0.72)
  );
  const [productType, setProductType] = useState<ProductType>(itemToEdit?.productType || 'Product');
  const [status, setStatus] = useState<ItemStatus>(itemToEdit?.status || 'Active');

  if (!isOpen) return null;

  // Selected category info
  const selectedCat = categories.find(c => c.id === categoryId);

  // Compute category path
  const getCategoryPath = (catId: string): string[] => {
    const path: string[] = [];
    let curId: string | null | undefined = catId;
    while (curId) {
      const cat = categories.find(c => c.id === curId);
      if (cat) {
        path.unshift(cat.name);
        curId = cat.parentId;
      } else {
        break;
      }
    }
    return path;
  };

  const categoryPath = getCategoryPath(categoryId);
  const mainCategoryName = categoryPath.length > 0 ? categoryPath[0] : (selectedCat?.name || 'General');
  const subCategoryName = categoryPath.length > 1 ? categoryPath[categoryPath.length - 1] : undefined;

  // Helper to format category with hierarchical indent
  const getCategoryDisplayLabel = (cat: ItemCategory): string => {
    const ancestors = getCategoryPath(cat.id);
    return ancestors.join(' > ');
  };

  const calculatedMargin = rate > 0 
    ? Math.round(((rate - lastSupplierPrice) / rate) * 1000) / 10 
    : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || rate <= 0) return;

    const newItem: ItemTemplate = {
      id: itemToEdit?.id || `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      productCode: productCode.trim(),
      code: productCode.trim(),
      barcode: itemToEdit?.barcode || productCode.trim(),
      category: mainCategoryName,
      categoryId,
      subCategory: subCategoryName,
      categoryPath,
      description: description.trim(),
      detailedSpecification: detailedSpecification.trim() || undefined,
      unit,
      rate: Number(rate),
      lastSupplierPrice: Number(lastSupplierPrice),
      targetMargin: calculatedMargin,
      productType,
      status,
      rateHistory: itemToEdit?.rateHistory || [
        {
          id: `rh-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          rate: Number(rate),
          supplierCost: Number(lastSupplierPrice),
          marginPercent: calculatedMargin,
          version: 'v1.0',
          reason: 'Initial creation',
          recordedBy: 'Estimator',
          status: 'Approved'
        }
      ],
      competitivePrices: itemToEdit?.competitivePrices || [],
      technicalSpecification: itemToEdit?.technicalSpecification
    };

    onSave(newItem);
    onClose();
  };

  const modalContent = (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-xl overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center shadow-xs">
              <Package size={16} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                {itemToEdit ? 'Edit BOQ Library Item' : 'New BOQ Library Item'}
              </h2>
              <p className="text-xs text-slate-500 font-normal">
                Assign to nested category hierarchy and specify pricing
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Category Selector with Hierarchy */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Layers size={13} className="text-orange-500" />
              Assigned Category / Sub-Category <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {getCategoryDisplayLabel(cat)}
                </option>
              ))}
            </select>
            {categoryPath.length > 0 && (
              <div className="mt-1 text-[11px] text-slate-500 font-mono">
                Hierarchy: {categoryPath.join(' › ')}
              </div>
            )}
          </div>

          {/* Item Name & Product Code */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Item Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Aluminium Sliding Window (2-Track)"
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                <span>Item Code (Primary Key)</span>
                <span className="text-[10px] text-orange-600 font-mono font-bold">PK</span>
              </label>
              <input
                type="text"
                value={productCode}
                onChange={(e) => setProductCode(e.target.value)}
                placeholder="e.g., AL-WD-001"
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono font-bold focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Short Description (Tender Line Summary)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Summary description for quotation tables..."
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none"
            />
          </div>

          {/* Unit, Pricing & Margins */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/70">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Billing Unit</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as MeasurementUnit)}
                className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:ring-1 focus:ring-orange-500"
              >
                <option value="sqft">Square Feet (sqft)</option>
                <option value="sqm">Square Meters (sqm)</option>
                <option value="Nos">Numbers (Nos)</option>
                <option value="L.ft">Linear Feet (L.ft)</option>
                <option value="m">Linear Meters (m)</option>
                <option value="kg">Kilograms (kg)</option>
                <option value="Set">Set</option>
                <option value="Visit">Site Visit</option>
                <option value="Item">Lump Sum (Item)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Selling Rate (LKR) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={rate}
                onChange={(e) => setRate(parseFloat(e.target.value) || 0)}
                className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-bold focus:ring-1 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Base Supplier Cost (LKR)
              </label>
              <input
                type="number"
                step="0.01"
                value={lastSupplierPrice}
                onChange={(e) => setLastSupplierPrice(parseFloat(e.target.value) || 0)}
                className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-semibold focus:ring-1 focus:ring-orange-500"
              />
            </div>

            {/* Calculated Profit Margin Pill */}
            <div className="md:col-span-3 flex items-center justify-between text-xs pt-1 border-t border-slate-200/50">
              <span className="text-slate-600 font-medium flex items-center gap-1">
                <Percent size={12} className="text-orange-500" /> Gross Profit Margin:
              </span>
              <span className={`font-bold ${calculatedMargin >= 25 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {calculatedMargin}% Profit Margin
              </span>
            </div>
          </div>

          {/* Detailed Specification Preview */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <FileText size={13} className="text-blue-500" /> Detailed Specification Text
              </label>
              <span className="text-[10px] text-slate-400">Can also be generated via Specification Engine</span>
            </div>
            <textarea
              rows={4}
              value={detailedSpecification}
              onChange={(e) => setDetailedSpecification(e.target.value)}
              placeholder="Paste or write detailed technical clauses here..."
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none leading-relaxed"
            />
          </div>

          {/* Status & Classification Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ItemStatus)}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:ring-1 focus:ring-orange-500"
              >
                <option value="Active">Active (In Use)</option>
                <option value="Discontinued">Discontinued</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Type</label>
              <select
                value={productType}
                onChange={(e) => setProductType(e.target.value as ProductType)}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:ring-1 focus:ring-orange-500"
              >
                <option value="Product">Physical Product</option>
                <option value="Service">Service / Labour</option>
              </select>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-all shadow-xs"
            >
              {itemToEdit ? 'Update Item' : 'Save New Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
