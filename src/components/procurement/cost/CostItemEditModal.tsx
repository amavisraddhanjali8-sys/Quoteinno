import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  Plus, 
  Trash2, 
  Box, 
  Layers, 
  Wrench, 
  Users, 
  Truck, 
  Barcode
} from 'lucide-react';
import { 
  ProcurementCostItem, 
  ProcurementCostClassification,
  CostCategoryDefinition,
  ItemSupplierRate,
  Supplier,
  SupplierPriceRange
} from '../../../types/procurement';
import { procurementCostService } from '../../../services/procurementCostService';

interface CostItemEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemToEdit?: ProcurementCostItem | null;
  categories: CostCategoryDefinition[];
  suppliers: Supplier[];
  projects: any[];
  currency?: string;
  onItemSaved: (savedItem: ProcurementCostItem) => void;
}

export const CostItemEditModal: React.FC<CostItemEditModalProps> = ({
  isOpen,
  onClose,
  itemToEdit,
  categories,
  suppliers,
  projects,
  currency = 'LKR',
  onItemSaved
}) => {
  // Classification
  const [classification, setClassification] = useState<ProcurementCostClassification>(
    itemToEdit?.classification || 'RAW_MATERIAL'
  );

  // Form Fields
  const [itemCode, setItemCode] = useState(itemToEdit?.itemCode || '');
  const [name, setName] = useState(itemToEdit?.name || '');
  const [imageUrl, setImageUrl] = useState(itemToEdit?.imageUrl || '');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [subCategory, setSubCategory] = useState(itemToEdit?.subCategory || '');
  const [description, setDescription] = useState(itemToEdit?.description || '');
  const [primaryUnit, setPrimaryUnit] = useState(itemToEdit?.primaryUnit || 'kg');
  const [benchmarkCost, setBenchmarkCost] = useState(itemToEdit?.benchmarkCost || 100);
  const [status, setStatus] = useState<'Active' | 'Under Review' | 'Discontinued'>(
    itemToEdit?.status || 'Active'
  );
  const [projectId, setProjectId] = useState(itemToEdit?.projectId || '');
  const [linkedQuoteNo, setLinkedQuoteNo] = useState(itemToEdit?.linkedQuoteNo || '');
  const [boqItemCode, setBoqItemCode] = useState(itemToEdit?.boqItemCode || '');
  const [specificationRef, setSpecificationRef] = useState(itemToEdit?.specificationRef || '');
  const [hsnSacCode, setHsnSacCode] = useState(itemToEdit?.hsnSacCode || '');
  const [qualityStandard, setQualityStandard] = useState(itemToEdit?.qualityStandard || '');
  const [inspectionLevel, setInspectionLevel] = useState(itemToEdit?.inspectionLevel || 'Mill Test Certificate (MTC 3.1)');
  const [storageCondition, setStorageCondition] = useState(itemToEdit?.storageCondition || 'Covered Dry Warehouse');
  const [barcode, setBarcode] = useState(itemToEdit?.barcode || '');
  const [notes, setNotes] = useState(itemToEdit?.notes || '');

  // Supplier & Multi-MOQ Tier Builder (for creating new item)
  const [addInitialSupplier, setAddInitialSupplier] = useState(!itemToEdit);
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || '');
  const [supplierBaseRate, setSupplierBaseRate] = useState(100);
  const [supplierMoq, setSupplierMoq] = useState(10);
  const [supplierLeadTime, setSupplierLeadTime] = useState(14);
  const [moqTiers, setMoqTiers] = useState<SupplierPriceRange[]>([
    { minQty: 1, maxQty: 50, unitPrice: 110, leadTimeDays: 14, notes: 'Small Order Tier' },
    { minQty: 51, maxQty: 200, unitPrice: 100, leadTimeDays: 12, notes: 'Standard Batch' },
    { minQty: 201, unitPrice: 90, leadTimeDays: 10, notes: 'Volume Discount' }
  ]);

  const [error, setError] = useState('');

  // Sync state when editing item changes
  useEffect(() => {
    if (itemToEdit) {
      setClassification(itemToEdit.classification || 'RAW_MATERIAL');
      setItemCode(itemToEdit.itemCode);
      setName(itemToEdit.name);
      setSubCategory(itemToEdit.subCategory || '');
      setDescription(itemToEdit.description || '');
      setPrimaryUnit(itemToEdit.primaryUnit || 'kg');
      setBenchmarkCost(itemToEdit.benchmarkCost || 0);
      setStatus(itemToEdit.status || 'Active');
      setProjectId(itemToEdit.projectId || '');
      setLinkedQuoteNo(itemToEdit.linkedQuoteNo || '');
      setBoqItemCode(itemToEdit.boqItemCode || '');
      setSpecificationRef(itemToEdit.specificationRef || '');
      setHsnSacCode(itemToEdit.hsnSacCode || '');
      setQualityStandard(itemToEdit.qualityStandard || '');
      setInspectionLevel(itemToEdit.inspectionLevel || 'MTC 3.1 & Dimensional');
      setStorageCondition(itemToEdit.storageCondition || 'Covered Dry Warehouse');
      setBarcode(itemToEdit.barcode || '');
      setImageUrl(itemToEdit.imageUrl || '');
      setNotes(itemToEdit.notes || '');
      setAddInitialSupplier(false);

      const matchedCat = categories.find(c => c.name === itemToEdit.category || c.code === itemToEdit.category);
      if (matchedCat) {
        setSelectedCategoryId(matchedCat.id);
      }
    } else {
      // New item defaults
      const prefix = classification === 'OUTSIDE_SERVICE' ? 'OUT'
        : classification === 'SUBCONTRACTOR_LABOUR' ? 'SUB'
        : classification === 'EQUIPMENT_PLANT' ? 'EQP'
        : classification === 'LOGISTICS_CONTRACT' ? 'LOG'
        : 'MAT';
      const seq = Math.floor(100 + Math.random() * 900);
      setItemCode(`PR-${prefix}-${seq}`);
      setName('');
      setDescription('');
      setBarcode(`890${Math.floor(1000000000 + Math.random() * 9000000000)}`);
      setAddInitialSupplier(true);
      if (categories.length > 0) {
        const firstMatching = categories.find(c => c.classification === classification) || categories[0];
        setSelectedCategoryId(firstMatching.id);
        setSubCategory(firstMatching.subCategories[0] || '');
      }
    }
  }, [itemToEdit, isOpen]);

  // Update categories available for chosen classification
  const filteredCategories = categories.filter(c => c.classification === classification);

  const handleClassificationChange = (cls: ProcurementCostClassification) => {
    setClassification(cls);
    const matching = categories.filter(c => c.classification === cls);
    if (matching.length > 0) {
      setSelectedCategoryId(matching[0].id);
      setSubCategory(matching[0].subCategories[0] || '');
    } else {
      setSelectedCategoryId('');
      setSubCategory('');
    }

    if (!itemToEdit) {
      const prefix = cls === 'OUTSIDE_SERVICE' ? 'OUT'
        : cls === 'SUBCONTRACTOR_LABOUR' ? 'SUB'
        : cls === 'EQUIPMENT_PLANT' ? 'EQP'
        : cls === 'LOGISTICS_CONTRACT' ? 'LOG'
        : 'MAT';
      const seq = Math.floor(100 + Math.random() * 900);
      setItemCode(`PR-${prefix}-${seq}`);
    }
  };

  const handleCategoryChange = (catId: string) => {
    setSelectedCategoryId(catId);
    const cat = categories.find(c => c.id === catId);
    if (cat && cat.subCategories.length > 0) {
      setSubCategory(cat.subCategories[0]);
    }
  };

  const handleAddMoqTier = () => {
    const lastTier = moqTiers[moqTiers.length - 1];
    const newMin = lastTier ? (lastTier.maxQty ? lastTier.maxQty + 1 : lastTier.minQty + 100) : 1;
    const newTier: SupplierPriceRange = {
      minQty: newMin,
      unitPrice: lastTier ? Math.max(1, Math.round(lastTier.unitPrice * 0.92)) : supplierBaseRate,
      leadTimeDays: 10,
      notes: `Tier ${moqTiers.length + 1} Volume Rate`
    };
    setMoqTiers([...moqTiers, newTier]);
  };

  const handleRemoveMoqTier = (idx: number) => {
    setMoqTiers(moqTiers.filter((_, i) => i !== idx));
  };

  const handleUpdateMoqTier = (idx: number, field: keyof SupplierPriceRange, val: any) => {
    setMoqTiers(moqTiers.map((t, i) => i === idx ? { ...t, [field]: val } : t));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Cost item name is required.');
      return;
    }
    if (!itemCode.trim()) {
      setError('Item code (Primary Key) is required.');
      return;
    }

    const assignedProj = projects.find(p => p.id === projectId);
    const chosenCat = categories.find(c => c.id === selectedCategoryId);
    const categoryName = chosenCat ? chosenCat.name : (classification === 'RAW_MATERIAL' ? 'Materials' : 'Services');

    // Build supplier rates if adding initial supplier
    const supplierRates: ItemSupplierRate[] = itemToEdit?.supplierRates ? [...itemToEdit.supplierRates] : [];
    if (!itemToEdit && addInitialSupplier && supplierId) {
      const selectedSup = suppliers.find(s => s.id === supplierId);
      supplierRates.push({
        id: `sr-${Date.now()}`,
        supplierId: selectedSup?.id || supplierId,
        supplierName: selectedSup?.name || 'Approved Strategic Vendor',
        vendorCode: selectedSup?.vendorCode || 'VND-STR',
        currency,
        baseRate: Number(supplierBaseRate),
        minimumOrderQty: Number(supplierMoq),
        leadTimeDays: Number(supplierLeadTime),
        rating: selectedSup?.rating || 4.8,
        isPreferred: true,
        effectiveDate: new Date().toISOString().split('T')[0],
        priceRanges: moqTiers.map(t => ({
          minQty: Number(t.minQty),
          maxQty: t.maxQty ? Number(t.maxQty) : undefined,
          unitPrice: Number(t.unitPrice),
          leadTimeDays: Number(t.leadTimeDays || 12),
          notes: t.notes || ''
        }))
      });
    }

    const saved = procurementCostService.saveCostItem({
      id: itemToEdit?.id,
      itemCode: itemCode.trim().toUpperCase(),
      name: name.trim(),
      category: categoryName,
      subCategory: subCategory.trim() || undefined,
      classification,
      description: description.trim(),
      primaryUnit: primaryUnit.trim(),
      benchmarkCost: Number(benchmarkCost),
      currency,
      status,
      projectId: assignedProj ? assignedProj.id : (projectId || undefined),
      projectCode: assignedProj ? (assignedProj.projectCode || assignedProj.id) : undefined,
      projectName: assignedProj ? (assignedProj.projectName || assignedProj.name) : undefined,
      linkedQuoteNo: linkedQuoteNo.trim() || undefined,
      boqItemCode: boqItemCode.trim() || undefined,
      specificationRef: specificationRef.trim() || undefined,
      hsnSacCode: hsnSacCode.trim() || undefined,
      qualityStandard: qualityStandard.trim() || undefined,
      inspectionLevel: inspectionLevel.trim() || undefined,
      storageCondition: storageCondition.trim() || undefined,
      barcode: barcode.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined,
      supplierRates,
      notes: notes.trim() || undefined
    });

    onItemSaved(saved);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div 
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center shadow-xs">
              <Box size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {itemToEdit ? `Edit Cost Item: ${itemToEdit.itemCode}` : 'Create Procurement Cost Item'}
              </h2>
              <p className="text-[11px] text-slate-500">
                Register raw materials, outside services, subcontractor labour, equipment or logistics
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar text-xs">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg font-medium text-xs">
              {error}
            </div>
          )}

          {/* 1. Classification Selector */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Cost Item Scope & Classification <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { id: 'RAW_MATERIAL', label: 'Material & Consumable', icon: Layers, color: 'text-blue-500' },
                { id: 'OUTSIDE_SERVICE', label: 'Outside Service', icon: Wrench, color: 'text-purple-500' },
                { id: 'SUBCONTRACTOR_LABOUR', label: 'Subcontractor Labour', icon: Users, color: 'text-orange-500' },
                { id: 'EQUIPMENT_PLANT', label: 'Equipment & Plant', icon: Box, color: 'text-emerald-500' },
                { id: 'LOGISTICS_CONTRACT', label: 'Logistics & Freight', icon: Truck, color: 'text-indigo-500' }
              ].map(opt => {
                const Icon = opt.icon;
                const isSelected = classification === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleClassificationChange(opt.id as any)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'border-orange-500 bg-orange-50/70 text-orange-950 font-bold shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    <Icon size={16} className={`mb-1 ${opt.color}`} />
                    <span className="text-[11px] leading-tight">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Core Identity (PK, Name, Unit, Benchmark Rate) */}
          <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-200/90 space-y-3">
            <h3 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider text-slate-500">
              Primary Specifications & Financial Benchmark
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              {/* Item Code (PK) */}
              <div className="sm:col-span-3">
                <label className="block font-semibold text-slate-700 mb-1">
                  Item Code (PK) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. PR-MAT-6063"
                  value={itemCode}
                  onChange={(e) => setItemCode(e.target.value.toUpperCase())}
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono font-bold text-slate-900 focus:outline-none focus:border-orange-500 uppercase"
                />
              </div>

              {/* Name */}
              <div className="sm:col-span-6">
                <label className="block font-semibold text-slate-700 mb-1">
                  Cost Item Name & Scope <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Architectural Aluminium Profile 6063-T6 Extrusions"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-medium text-slate-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Status */}
              <div className="sm:col-span-3">
                <label className="block font-semibold text-slate-700 mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-medium text-slate-900 focus:outline-none focus:border-orange-500"
                >
                  <option value="Active">Active</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Discontinued">Discontinued</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              {/* Category */}
              <div className="sm:col-span-4">
                <label className="block font-semibold text-slate-700 mb-1">
                  Category
                </label>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-medium text-slate-900 focus:outline-none focus:border-orange-500"
                >
                  {filteredCategories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                  {filteredCategories.length === 0 && (
                    <option value="">No custom category defined</option>
                  )}
                </select>
              </div>

              {/* SubCategory */}
              <div className="sm:col-span-4">
                <label className="block font-semibold text-slate-700 mb-1">
                  Subcategory
                </label>
                {selectedCategoryId && categories.find(c => c.id === selectedCategoryId)?.subCategories?.length ? (
                  <select
                    value={subCategory}
                    onChange={(e) => setSubCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-medium text-slate-900 focus:outline-none focus:border-orange-500"
                  >
                    {categories.find(c => c.id === selectedCategoryId)?.subCategories.map((s, idx) => (
                      <option key={idx} value={s}>{s}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="e.g. Extrusions & Billet Alloys"
                    value={subCategory}
                    onChange={(e) => setSubCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-medium text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                )}
              </div>

              {/* Primary Unit */}
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  Unit
                </label>
                <select
                  value={primaryUnit}
                  onChange={(e) => setPrimaryUnit(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono font-medium text-slate-900 focus:outline-none focus:border-orange-500"
                >
                  <option value="kg">kg (weight)</option>
                  <option value="m">m (meter)</option>
                  <option value="m²">m² (area)</option>
                  <option value="pcs">pcs (pieces)</option>
                  <option value="hrs">hrs (labour)</option>
                  <option value="sets">sets</option>
                  <option value="shifts">shifts (crane/rig)</option>
                  <option value="trips">trips (transport)</option>
                  <option value="MT">MT (metric tons)</option>
                </select>
              </div>

              {/* Benchmark Cost */}
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  Benchmark ({currency})
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={benchmarkCost}
                  onChange={(e) => setBenchmarkCost(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono font-bold text-orange-950 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Detailed Scope of Supply / Works Description
              </label>
              <textarea
                rows={2}
                placeholder="Technical description of the material alloy, coating specifications, installation height, or logistics haulage..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-orange-500 resize-none"
              />
            </div>

            {/* Item Image (1:1 Ratio) */}
            <div className="pt-2 border-t border-slate-200/80">
              <label className="block font-semibold text-slate-700 mb-1">
                Cost Item Image (1:1 Aspect Ratio)
              </label>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 aspect-square rounded-xl border border-slate-200 bg-white overflow-hidden shrink-0 shadow-2xs flex items-center justify-center">
                  {imageUrl ? (
                    <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] text-slate-400 font-mono text-center px-1">1:1 Image</span>
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/... or paste image URL"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Used for 1:1 square preview in card views, procurement tags, and QR scanning.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Foreign Key Cross-Links (Project, Quote, BOQ) */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 space-y-3">
            <h3 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider text-slate-500">
              Foreign Key Cross-Links & Traceability
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Project Allocation (FK)
                </label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-orange-500"
                >
                  <option value="">-- Global / Master Inventory --</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>
                      [{p.projectCode || p.id.slice(0, 8)}] {p.projectName || p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Linked Quote No (FK)
                </label>
                <input
                  type="text"
                  placeholder="e.g. QT-2026-001"
                  value={linkedQuoteNo}
                  onChange={(e) => setLinkedQuoteNo(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono text-slate-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Linked BOQ Code (FK)
                </label>
                <input
                  type="text"
                  placeholder="e.g. AL-WD-001"
                  value={boqItemCode}
                  onChange={(e) => setBoqItemCode(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono text-slate-900 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>
          </div>

          {/* 4. Technical Standards & Barcode */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
            <h3 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider text-slate-500">
              Technical Standards & Quality Compliance
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Specification Ref / Standard
                </label>
                <input
                  type="text"
                  placeholder="e.g. ASTM B221 / Qualicoat Class 2"
                  value={specificationRef}
                  onChange={(e) => setSpecificationRef(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  HSN / SAC Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. 7604.29 / 9987"
                  value={hsnSacCode}
                  onChange={(e) => setHsnSacCode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Barcode (EAN-13)
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                  <button
                    type="button"
                    onClick={() => setBarcode(`890${Math.floor(1000000000 + Math.random() * 9000000000)}`)}
                    className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 transition-colors"
                    title="Generate Barcode"
                  >
                    <Barcode size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 5. Optional Initial Supplier & Multiple MOQ Price Range Tiers (Only for New Items) */}
          {!itemToEdit && (
            <div className="p-4 rounded-xl border border-orange-200 bg-orange-50/30 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-orange-950 text-xs">
                    Initial Vendor Supply & Multi-tier MOQ Price Range Schedule
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    Configure multiple vendors offering tiered volume prices for multiple MOQ brackets
                  </p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={addInitialSupplier}
                    onChange={(e) => setAddInitialSupplier(e.target.checked)}
                    className="w-4 h-4 text-orange-500 rounded"
                  />
                  <span className="font-semibold text-slate-700 text-xs">Attach Approved Vendor</span>
                </label>
              </div>

              {addInitialSupplier && (
                <div className="space-y-3 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-slate-700 mb-1">
                        Supplier / Vendor
                      </label>
                      <select
                        value={supplierId}
                        onChange={(e) => setSupplierId(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-orange-500"
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
                        Base Rate ({currency})
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={supplierBaseRate}
                        onChange={(e) => setSupplierBaseRate(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono font-bold text-slate-900 focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Base MOQ & Lead Days
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="1"
                          placeholder="MOQ"
                          value={supplierMoq}
                          onChange={(e) => setSupplierMoq(parseInt(e.target.value) || 1)}
                          className="w-1/2 px-2 py-2 bg-white border border-slate-200 rounded-lg font-mono text-slate-900 text-xs"
                          title="Minimum Order Quantity"
                        />
                        <input
                          type="number"
                          min="1"
                          placeholder="Days"
                          value={supplierLeadTime}
                          onChange={(e) => setSupplierLeadTime(parseInt(e.target.value) || 1)}
                          className="w-1/2 px-2 py-2 bg-white border border-slate-200 rounded-lg font-mono text-slate-900 text-xs"
                          title="Lead Time in Days"
                        />
                      </div>
                    </div>
                  </div>

                  {/* MOQ Range Tiers Table */}
                  <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                    <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                      <span className="font-bold text-[11px] text-slate-700 uppercase">
                        Volume MOQ Range Price Tiers
                      </span>
                      <button
                        type="button"
                        onClick={handleAddMoqTier}
                        className="flex items-center gap-1 px-2 py-0.5 bg-orange-500 hover:bg-orange-600 text-white rounded text-[10px] font-semibold transition-colors cursor-pointer"
                      >
                        <Plus size={10} />
                        <span>Add MOQ Tier</span>
                      </button>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {moqTiers.map((tier, tIdx) => (
                        <div key={tIdx} className="p-2.5 flex items-center gap-2 flex-wrap sm:flex-nowrap">
                          <span className="w-14 font-mono font-bold text-[10px] text-slate-500 shrink-0">
                            Tier {tIdx + 1}
                          </span>

                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-[10px] text-slate-400">Min:</span>
                            <input
                              type="number"
                              min="1"
                              value={tier.minQty}
                              onChange={(e) => handleUpdateMoqTier(tIdx, 'minQty', parseInt(e.target.value) || 1)}
                              className="w-16 px-1.5 py-1 border border-slate-200 rounded font-mono text-[11px] text-center"
                            />
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-[10px] text-slate-400">Max:</span>
                            <input
                              type="number"
                              min="1"
                              placeholder="and up"
                              value={tier.maxQty || ''}
                              onChange={(e) => handleUpdateMoqTier(tIdx, 'maxQty', e.target.value ? parseInt(e.target.value) : undefined)}
                              className="w-20 px-1.5 py-1 border border-slate-200 rounded font-mono text-[11px] text-center"
                            />
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-[10px] text-slate-400">Unit Price ({currency}):</span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={tier.unitPrice}
                              onChange={(e) => handleUpdateMoqTier(tIdx, 'unitPrice', parseFloat(e.target.value) || 0)}
                              className="w-24 px-1.5 py-1 border border-slate-200 rounded font-mono font-bold text-orange-950 text-[11px] text-right"
                            />
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-[10px] text-slate-400">Days:</span>
                            <input
                              type="number"
                              min="1"
                              value={tier.leadTimeDays || 12}
                              onChange={(e) => handleUpdateMoqTier(tIdx, 'leadTimeDays', parseInt(e.target.value) || 12)}
                              className="w-14 px-1.5 py-1 border border-slate-200 rounded font-mono text-[11px] text-center"
                            />
                          </div>

                          <input
                            type="text"
                            placeholder="Tier note (e.g. Bulk factory run)"
                            value={tier.notes || ''}
                            onChange={(e) => handleUpdateMoqTier(tIdx, 'notes', e.target.value)}
                            className="flex-1 min-w-[120px] px-2 py-1 border border-slate-200 rounded text-[11px]"
                          />

                          <button
                            type="button"
                            onClick={() => handleRemoveMoqTier(tIdx)}
                            className="text-slate-400 hover:text-red-500 p-1 rounded transition-colors cursor-pointer"
                            title="Remove tier"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Save size={14} />
              <span>{itemToEdit ? 'Save Changes' : 'Create Cost Item'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
