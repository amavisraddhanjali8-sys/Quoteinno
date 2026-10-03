import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Check, Copy, Barcode, ScanLine, 
  SlidersHorizontal, Layers, ShieldCheck, Cpu, Palette, 
  CheckCircle2, FolderTree, Package, 
  RotateCcw, FileText, Save, ArrowRight,
  Sliders, Maximize2, Minimize2, Eye, ExternalLink, Database,
  Wrench, CheckCircle
} from 'lucide-react';
import { 
  BOQItem, ItemSpecification, ItemTemplate, ItemCategory, 
  ProductVariant, AttributeDefinition 
} from '../types';
import { cn } from '../lib/utils';
import { BarcodeVisual } from './boq/BarcodeVisual';
import { BarcodeScannerModal } from './boq/BarcodeScannerModal';
import { 
  generateVariantCode, 
  generateUniqueVariantBarcode, 
  generateVariantDescriptions 
} from '../services/variantEngineService';
import { getStoredAttributeDefinitions } from '../services/attributeOptionService';
import { useQuoteData } from '../hooks/useQuoteData';
import { toast } from 'sonner';

export interface SpecificationSavePayload {
  name?: string;
  spec?: ItemSpecification;
  description: string;
  variantBarcode?: string;
  variantCode?: string;
  productCode?: string;
  category?: string;
  rate?: number;
  variantId?: string;
  variantAttributes?: Record<string, string | number>;
}

interface SpecificationPortalProps {
  item: BOQItem;
  onSave: (
    specOrPayload: ItemSpecification | SpecificationSavePayload,
    legacyDescription?: string
  ) => void;
  onClose: () => void;
  categories?: ItemCategory[];
  itemTemplates?: ItemTemplate[];
  productVariants?: ProductVariant[];
}

// Initial specification fallback structure for legacy backward compatibility
const INITIAL_SPEC_STRUCTURE: ItemSpecification = {
  core: { systemType: '', location: '', reference: '' },
  dimensions: { width: '', height: '', panels: '', opening: '' },
  materials: {
    accessories: [],
    aluminium: [],
    steel: { type: '', section: '', thickness: '', treatment: '' },
    glass: []
  },
  customMaterials: [],
  functional: '',
  fabrication: '',
  finishing: '',
  installation: '',
  exclusions: 'Civil work (breaking walls, plastering), Electrical modifications, Scaffolding (if not included)',
  siteConditions: 'Standard site conditions',
  quality: 'Conforming to SLS / ASTM architectural standards',
  testing: 'Factory tested for water tightness & structural deflection',
  warranty: '10-Year Comprehensive Warranty',
  delivery: 'Factory pre-assembled & packaged for site delivery',
  notes: ''
};

export const SpecificationPortal: React.FC<SpecificationPortalProps> = ({
  item,
  onSave,
  onClose,
  categories: propCategories,
  itemTemplates: propItemTemplates,
  productVariants: propProductVariants
}) => {
  // Pull live data from hook with prop fallbacks
  const hookData = useQuoteData();
  const categories = propCategories || hookData.itemCategories || [];
  const itemTemplates = propItemTemplates || hookData.itemTemplates || [];
  const productVariants = propProductVariants || hookData.productVariants || [];

  // Full Screen toggle state (defaults to true so ribbon nav bar is hidden underneath)
  const [isFullScreen, setIsFullScreen] = useState<boolean>(true);

  // Active view tab: Catalog variants, feature configurator, full details, or tender specification
  const [activeTab, setActiveTab] = useState<'CATALOG_VARIANTS' | 'FEATURE_CONFIG' | 'FULL_DETAILS' | 'TENDER_SPEC'>('CATALOG_VARIANTS');

  // Copy feedback state
  const [copiedBarcode, setCopiedBarcode] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Barcode scanner modal state
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Dynamic attribute definitions from system presets
  const [attributeDefs] = useState<AttributeDefinition[]>(() => {
    return getStoredAttributeDefinitions();
  });

  // Handle escape key to exit full screen or close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isFullScreen) {
          setIsFullScreen(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullScreen, onClose]);

  // --- 1. Base Item & Category Hierarchy Link ---
  const initialBaseItem = useMemo(() => {
    if (item.templateId) {
      const match = itemTemplates.find(t => t.id === item.templateId);
      if (match) return match;
    }
    if (item.productCode) {
      const match = itemTemplates.find(t => t.productCode === item.productCode || t.id === item.productCode);
      if (match) return match;
    }
    const nameMatch = itemTemplates.find(t => 
      t.name.toLowerCase() === item.name.toLowerCase() ||
      item.name.toLowerCase().includes(t.name.toLowerCase()) ||
      t.name.toLowerCase().includes(item.name.toLowerCase())
    );
    if (nameMatch) return nameMatch;
    return itemTemplates[0] || null;
  }, [item, itemTemplates]);

  const [selectedItemId, setSelectedItemId] = useState<string>(() => {
    return initialBaseItem?.id || itemTemplates[0]?.id || '';
  });

  const selectedBaseItem = useMemo(() => {
    return itemTemplates.find(t => t.id === selectedItemId) || initialBaseItem || itemTemplates[0] || null;
  }, [itemTemplates, selectedItemId, initialBaseItem]);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(() => {
    if (selectedBaseItem?.categoryId) return selectedBaseItem.categoryId;
    const catByName = categories.find(c => c.name.toLowerCase() === item.category?.toLowerCase());
    if (catByName) return catByName.id;
    return categories[0]?.id || '';
  });

  const selectedCategory = useMemo(() => {
    return categories.find(c => c.id === selectedCategoryId) || categories[0] || null;
  }, [categories, selectedCategoryId]);

  // Hierarchical item matches for category dropdown
  const categoryItems = useMemo(() => {
    const childIds = new Set<string>([selectedCategoryId]);
    const queue = [selectedCategoryId];
    while (queue.length > 0) {
      const cur = queue.shift()!;
      categories.forEach(c => {
        if (c.parentId === cur && !childIds.has(c.id)) {
          childIds.add(c.id);
          queue.push(c.id);
        }
      });
    }

    const matches = itemTemplates.filter(t => {
      if (t.categoryId && childIds.has(t.categoryId)) return true;
      if (selectedCategory) {
        if (t.category?.toLowerCase() === selectedCategory.name.toLowerCase()) return true;
        if (t.subCategory && t.subCategory.toLowerCase() === selectedCategory.name.toLowerCase()) return true;
      }
      return false;
    });

    if (matches.length > 0) return matches;
    if (selectedBaseItem) return [selectedBaseItem];
    return itemTemplates;
  }, [itemTemplates, selectedCategoryId, categories, selectedCategory, selectedBaseItem]);

  // --- 2. Available Product Variants for Selected Item ---
  const itemVariants = useMemo(() => {
    if (!selectedBaseItem) return [];
    return productVariants.filter(v => v.itemId === selectedBaseItem.id);
  }, [productVariants, selectedBaseItem]);

  // Selected Variant (if matching an existing one from catalog)
  const initialVariant = useMemo(() => {
    if (item.variantId) {
      const match = productVariants.find(v => v.id === item.variantId);
      if (match) return match;
    }
    if (item.variantBarcode || item.barcode) {
      const bcode = item.variantBarcode || item.barcode;
      const match = productVariants.find(v => v.barcode === bcode);
      if (match) return match;
    }
    if (item.variantCode) {
      const match = productVariants.find(v => v.variantCode === item.variantCode);
      if (match) return match;
    }
    if (itemVariants.length > 0) return itemVariants[0];
    return null;
  }, [item, productVariants, itemVariants]);

  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(() => {
    return initialVariant?.id || null;
  });

  // Inspected variant for the Full Details view
  const [inspectedVariant, setInspectedVariant] = useState<ProductVariant | null>(() => {
    return initialVariant || null;
  });

  // --- 3. Relational Architectural Attributes ---
  const [attributes, setAttributes] = useState<Record<string, string | number>>(() => {
    if (item.variantAttributes && Object.keys(item.variantAttributes).length > 0) {
      return { ...item.variantAttributes };
    }
    if (initialVariant?.attributes) {
      return { ...initialVariant.attributes };
    }
    const defaults: Record<string, string | number> = {};
    attributeDefs.forEach(def => {
      defaults[def.code] = def.defaultValue ?? def.allowedValues?.[0]?.label ?? '';
    });
    return defaults;
  });

  const handleAttributeChange = (code: string, value: string | number) => {
    setAttributes(prev => ({
      ...prev,
      [code]: value
    }));
  };

  // --- 4. Exact Variant Barcode & Variant Code ---
  const [variantBarcode, setVariantBarcode] = useState<string>(() => {
    if (item.variantBarcode || item.barcode) return (item.variantBarcode || item.barcode)!;
    if (initialVariant?.barcode) return initialVariant.barcode;
    return generateUniqueVariantBarcode(
      selectedBaseItem || selectedItemId,
      attributes,
      productVariants,
      itemTemplates
    );
  });

  const [variantCode, setVariantCode] = useState<string>(() => {
    if (item.variantCode) return item.variantCode;
    if (initialVariant?.variantCode) return initialVariant.variantCode;
    return generateVariantCode(
      selectedBaseItem || selectedItemId,
      attributes,
      productVariants
    );
  });

  // Pricing & Standard Rate
  const [variantRate, setVariantRate] = useState<number>(() => {
    if (initialVariant?.pricing?.sellingPrice) return initialVariant.pricing.sellingPrice;
    return item.rate || selectedBaseItem?.rate || 1250;
  });

  const [applyRateToBOQ, setApplyRateToBOQ] = useState<boolean>(true);

  // Generated Multi-Audience Technical Specification
  const [description, setDescription] = useState<string>(() => {
    if (item.description && item.description.length > 30) {
      return item.description;
    }
    if (initialVariant?.technicalDescription) {
      return initialVariant.technicalDescription;
    }
    const name = selectedBaseItem?.name || item.name;
    const descs = generateVariantDescriptions(name, attributes);
    return descs.technicalDescription;
  });

  const [isDescCustomized, setIsDescCustomized] = useState<boolean>(false);

  // Live auto-update of generated descriptions and codes when attributes change (unless user hand-edited)
  useEffect(() => {
    if (!isDescCustomized) {
      const name = selectedBaseItem?.name || item.name;
      const descs = generateVariantDescriptions(name, attributes);
      setDescription(descs.technicalDescription);
    }
    // Update code if not matched to fixed variant
    if (!selectedVariantId) {
      const freshCode = generateVariantCode(
        selectedBaseItem || selectedItemId,
        attributes,
        productVariants
      );
      setVariantCode(freshCode);
      const freshBarcode = generateUniqueVariantBarcode(
        selectedBaseItem || selectedItemId,
        attributes,
        productVariants,
        itemTemplates
      );
      setVariantBarcode(freshBarcode);
    }
  }, [attributes, selectedBaseItem, selectedItemId, isDescCustomized, selectedVariantId, productVariants, itemTemplates, item.name]);

  // When a catalog variant is selected
  const handleSelectCatalogVariant = (v: ProductVariant) => {
    setSelectedVariantId(v.id);
    setInspectedVariant(v);
    setVariantBarcode(v.barcode || '');
    setVariantCode(v.variantCode);
    setVariantRate(v.pricing?.sellingPrice || selectedBaseItem?.rate || item.rate);
    setAttributes({ ...v.attributes });
    setDescription(v.technicalDescription || v.boqDescription || v.generatedDescription || '');
    setIsDescCustomized(false);
    toast.success(`Selected variant: ${v.variantName} [${v.barcode}]`);
  };

  // Inspect full variant details
  const handleInspectVariant = (v: ProductVariant) => {
    setInspectedVariant(v);
    setActiveTab('FULL_DETAILS');
  };

  // Re-generate fresh barcode on demand
  const handleRegenerateBarcode = () => {
    setSelectedVariantId(null);
    const freshBarcode = generateUniqueVariantBarcode(
      selectedBaseItem || selectedItemId,
      attributes,
      productVariants,
      itemTemplates
    );
    setVariantBarcode(freshBarcode);
    toast.success(`Generated barcode: ${freshBarcode}`);
  };

  // Copy helpers
  const handleCopyBarcode = (bcode?: string) => {
    const target = bcode || variantBarcode;
    if (!target) return;
    navigator.clipboard.writeText(target);
    setCopiedBarcode(true);
    toast.info(`Copied barcode "${target}"`);
    setTimeout(() => setCopiedBarcode(false), 2000);
  };

  const handleCopyCode = (code?: string) => {
    const target = code || variantCode;
    if (!target) return;
    navigator.clipboard.writeText(target);
    setCopiedCode(true);
    toast.info(`Copied SKU "${target}"`);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Link with Product Portal: Open directly in Product & Variants portal
  const handleOpenProductPortal = () => {
    window.dispatchEvent(new CustomEvent('app:navigate', {
      detail: {
        view: 'boq-items',
        tab: 'VARIANTS_LIST',
        itemId: selectedBaseItem?.id,
        variantId: selectedVariantId || undefined
      }
    }));
    toast.info('Navigating to Product & Variants Portal...');
    onClose();
  };

  // Link with Product Portal: Save active configured variant into master Product Portal database
  const handleSaveToProductPortal = () => {
    const finalBarcode = variantBarcode.trim() || generateUniqueVariantBarcode(
      selectedBaseItem || selectedItemId,
      attributes,
      productVariants,
      itemTemplates
    );

    const finalCode = variantCode.trim() || generateVariantCode(
      selectedBaseItem || selectedItemId,
      attributes,
      productVariants
    );

    const baseCost = Math.round(variantRate * 0.72);
    const margin = Math.round(((variantRate - baseCost) / variantRate) * 100);

    const newVariant: ProductVariant = {
      id: selectedVariantId || crypto.randomUUID(),
      variantCode: finalCode,
      variantName: `${selectedBaseItem?.name || item.name} (${String(attributes['SYSTEM_SERIES'] || '70mm')}, ${String(attributes['SURFACE_FINISH'] || 'Powder Coated')})`,
      sku: finalCode,
      barcode: finalBarcode,
      itemId: selectedBaseItem?.id || item.id,
      itemName: selectedBaseItem?.name || item.name,
      categoryId: selectedCategory?.id || selectedBaseItem?.categoryId,
      categoryName: selectedCategory?.name || selectedBaseItem?.category,
      status: 'Active',
      attributes: { ...attributes },
      pricing: {
        costPrice: baseCost,
        minimumPrice: Math.round(variantRate * 0.9),
        standardPrice: variantRate,
        sellingPrice: variantRate,
        pricingMethod: 'Target Margin',
        markupPercent: baseCost > 0 ? Math.round(((variantRate - baseCost) / baseCost) * 100) : 38,
        grossMarginPercent: margin,
        grossProfit: variantRate - baseCost,
        priceSource: 'MANUAL_ENTRY',
        currency: 'LKR',
        effectiveFrom: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      },
      technicalDescription: description.trim(),
      boqDescription: `${selectedBaseItem?.name || item.name} - ${String(attributes['SYSTEM_SERIES'] || '70mm')} ${String(attributes['OPERATION_TYPE'] || 'Sliding')} with ${String(attributes['GLASS_TYPE'] || 'Clear Float')} ${String(attributes['GLASS_THICKNESS'] || '5mm')}`,
      generatedDescription: description.trim(),
      warrantyPeriod: '10-Year Comprehensive Architectural Warranty',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    hookData.saveProductVariant(newVariant);
    setSelectedVariantId(newVariant.id);
    setInspectedVariant(newVariant);
    toast.success(`Saved variant "${finalCode}" to Product Portal catalog!`);
  };

  // Handle Save / Apply to BOQ Item
  const handleApplyToBOQ = () => {
    const finalBarcode = variantBarcode.trim() || generateUniqueVariantBarcode(
      selectedBaseItem || selectedItemId,
      attributes,
      productVariants,
      itemTemplates
    );

    const finalCode = variantCode.trim() || generateVariantCode(
      selectedBaseItem || selectedItemId,
      attributes,
      productVariants
    );

    const structuredSpec: ItemSpecification = {
      ...INITIAL_SPEC_STRUCTURE,
      core: {
        systemType: String(attributes['SYSTEM_SERIES'] || 'Standard'),
        location: String(attributes['OPERATION_TYPE'] || 'General Aperture'),
        reference: finalCode
      },
      dimensions: {
        width: item.specification?.dimensions?.width || '',
        height: item.specification?.dimensions?.height || '',
        panels: String(attributes['PANEL_COUNT'] || '2-Panel'),
        opening: String(attributes['OPERATION_TYPE'] || 'Sliding')
      },
      materials: {
        accessories: [],
        aluminium: [{
          id: crypto.randomUUID(),
          series: String(attributes['SYSTEM_SERIES'] || ''),
          thickness: String(attributes['COATING_MICRONS'] || '1.5mm'),
          finish: String(attributes['SURFACE_FINISH'] || 'Powder Coated'),
          brand: String(attributes['BRAND_SPEC'] || 'Alumex Premium'),
          name: String(attributes['COLOR_RAL'] || 'RAL 9016')
        }],
        steel: { type: '', section: '', thickness: '', treatment: '' },
        glass: [{
          id: crypto.randomUUID(),
          type: String(attributes['GLASS_TYPE'] || 'Clear Float'),
          thickness: String(attributes['GLASS_THICKNESS'] || '5mm Single'),
          standards: 'SLS 823 / BS 6206',
          tempered: String(attributes['GLASS_TREATMENT'] || '').includes('Tempered')
        }]
      },
      quality: `Conforming to SLS 1410 / ASTM B221 extrusion standard, ${String(attributes['BRAND_SPEC'] || 'Alumex Premium')} certified metallurgy.`,
      warranty: '10-Year Comprehensive Architectural Warranty'
    };

    const chosenVariant = selectedVariantId ? itemVariants.find(v => v.id === selectedVariantId) : null;
    const finalName = chosenVariant?.variantName || item.name;

    const payload: SpecificationSavePayload = {
      name: finalName,
      spec: structuredSpec,
      description: description.trim(),
      variantBarcode: finalBarcode,
      variantCode: finalCode,
      productCode: selectedBaseItem?.productCode || item.productCode || finalCode,
      category: selectedCategory?.name || item.category,
      rate: applyRateToBOQ ? variantRate : undefined,
      variantId: selectedVariantId || undefined,
      variantAttributes: attributes
    };

    onSave(payload, description.trim());
    toast.success(`Applied variant ${finalBarcode} to BOQ item!`);
    onClose();
  };

  // Currently inspected or active variant for the Full Details tab
  const currentDetailVariant = inspectedVariant || (selectedVariantId ? itemVariants.find(v => v.id === selectedVariantId) : null);
  const detailAttributes = currentDetailVariant?.attributes || attributes;
  const detailBarcode = currentDetailVariant?.barcode || variantBarcode;
  const detailCode = currentDetailVariant?.variantCode || variantCode;
  const detailSellingRate = currentDetailVariant?.pricing?.sellingPrice || variantRate;
  const detailCost = currentDetailVariant?.pricing?.costPrice || Math.round(detailSellingRate * 0.72);
  const detailMargin = detailSellingRate > 0 ? Math.round(((detailSellingRate - detailCost) / detailSellingRate) * 100) : 28;

  return (
    <div className={cn(
      "fixed inset-0 z-[200] flex flex-col bg-white overflow-hidden animate-in fade-in duration-150 select-none",
      isFullScreen 
        ? "w-screen h-screen" 
        : "p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center"
    )}>
      <div className={cn(
        "flex flex-col bg-white overflow-hidden flex-1 w-full h-full",
        !isFullScreen && "rounded-2xl shadow-2xl max-w-6xl max-h-[92vh] border border-slate-200"
      )}>
        
        {/* Header Ribbon */}
        <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
              <SlidersHorizontal size={16} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-amber-400 tracking-wide uppercase">
                  Product Portal Details
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  Item {item.no || '1.0'}
                </span>
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-white truncate max-w-lg">
                {item.name}
              </h3>
            </div>
          </div>

          {/* Top Actions: Link with Product Portal, Full Screen Toggle, Close */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Direct Link to Product & Variants Portal */}
            <button
              type="button"
              onClick={handleOpenProductPortal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors shadow-2xs cursor-pointer"
              title="Open in Product & Variants Portal"
            >
              <ExternalLink size={13} className="text-amber-400" />
              <span className="hidden sm:inline">Product Portal</span>
            </button>

            {/* Save into Product Portal */}
            <button
              type="button"
              onClick={handleSaveToProductPortal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600/90 hover:bg-amber-600 text-white text-xs font-semibold border border-amber-500/50 transition-colors shadow-2xs cursor-pointer"
              title="Save this variant into the master Product Portal catalog"
            >
              <Database size={13} />
              <span className="hidden sm:inline">Save to Portal</span>
            </button>

            {/* Fit to Full Screen / Restore Button */}
            <button
              type="button"
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title={isFullScreen ? "Restore Window Mode (Esc)" : "Fit to Full Screen"}
            >
              {isFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer ml-1"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tab Navigation Ribbon */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-2 flex items-center justify-between flex-wrap gap-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('CATALOG_VARIANTS')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                activeTab === 'CATALOG_VARIANTS'
                  ? "bg-amber-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/70"
              )}
            >
              <Package size={13} />
              <span>Catalog Variants</span>
              {itemVariants.length > 0 && (
                <span className={cn(
                  "px-1.5 py-0.2 rounded-full text-[10px] font-bold",
                  activeTab === 'CATALOG_VARIANTS' ? "bg-white text-amber-800" : "bg-amber-100 text-amber-800"
                )}>
                  {itemVariants.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('FEATURE_CONFIG')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                activeTab === 'FEATURE_CONFIG'
                  ? "bg-amber-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/70"
              )}
            >
              <Sliders size={13} />
              <span>Configure Features</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('FULL_DETAILS')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                activeTab === 'FULL_DETAILS'
                  ? "bg-amber-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/70"
              )}
            >
              <Eye size={13} />
              <span>Full Details</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('TENDER_SPEC')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                activeTab === 'TENDER_SPEC'
                  ? "bg-amber-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/70"
              )}
            >
              <FileText size={13} />
              <span>Specifications</span>
            </button>
          </div>

          {/* Quick Barcode Display */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-slate-500">Barcode:</span>
            <span className="font-mono text-xs font-bold text-slate-800 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs flex items-center gap-1.5">
              <Barcode size={13} className="text-amber-600" />
              <span>{variantBarcode}</span>
            </span>
          </div>
        </div>

        {/* Modal Main Body */}
        <div className="p-5 overflow-y-auto flex-1 bg-slate-50/50 space-y-4">
          
          {/* Category & Item Selectors */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              {/* Category Selector */}
              <div className="md:col-span-4">
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <FolderTree size={12} className="text-amber-600" />
                  <span>Category</span>
                </label>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => {
                    const catId = e.target.value;
                    setSelectedCategoryId(catId);
                    const childIds = new Set<string>([catId]);
                    const queue = [catId];
                    while (queue.length > 0) {
                      const cur = queue.shift()!;
                      categories.forEach(c => {
                        if (c.parentId === cur && !childIds.has(c.id)) {
                          childIds.add(c.id);
                          queue.push(c.id);
                        }
                      });
                    }
                    const matching = itemTemplates.filter(t => t.categoryId && childIds.has(t.categoryId));
                    if (matching.length > 0) {
                      setSelectedItemId(matching[0].id);
                    }
                  }}
                  className="w-full text-xs font-medium border border-slate-300 rounded-lg p-2 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none text-slate-800 cursor-pointer"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.parentId ? `↳ ${c.name}` : c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Base Item Selector */}
              <div className="md:col-span-5">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                    <Package size={12} className="text-amber-600" />
                    <span>Base Item</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsScannerOpen(true)}
                    className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded transition-colors"
                  >
                    <ScanLine size={10} />
                    <span>Scan</span>
                  </button>
                </div>
                <select
                  value={selectedItemId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedItemId(id);
                    const it = itemTemplates.find(t => t.id === id);
                    if (it?.categoryId) setSelectedCategoryId(it.categoryId);
                  }}
                  className="w-full text-xs font-medium border border-slate-300 rounded-lg p-2 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none text-slate-800 cursor-pointer"
                >
                  {categoryItems.map(t => (
                    <option key={t.id} value={t.id}>
                      [{t.productCode || t.id.slice(0, 8)}] {t.name} ({t.unit})
                    </option>
                  ))}
                </select>
              </div>

              {/* Base Rate & Unit Card */}
              <div className="md:col-span-3 bg-amber-50/80 border border-amber-200 rounded-lg p-2.5 text-xs text-amber-950 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-800">Rate:</span>
                  <span className="font-mono font-bold text-amber-900">
                    LKR {(selectedBaseItem?.rate || item.rate).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-amber-200/60 mt-1">
                  <span className="text-[11px] text-amber-800">Unit:</span>
                  <span className="font-bold text-amber-950">{selectedBaseItem?.unit || item.unit}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Barcode & SKU Banner */}
          <div className="bg-slate-900 text-white rounded-xl p-3.5 sm:p-4 shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {selectedVariantId ? 'Catalog Variant' : 'Configured Variant'}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  SKU: {variantCode}
                </span>
              </div>
              
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-xl sm:text-2xl font-mono font-extrabold text-amber-400 tracking-wider">
                  {variantBarcode}
                </span>
              </div>

              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleCopyBarcode()}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedBarcode ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>{copiedBarcode ? 'Copied' : 'Copy Barcode'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCopyCode()}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedCode ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>{copiedCode ? 'Copied' : 'Copy SKU'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleRegenerateBarcode}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Generate fresh barcode"
                >
                  <RotateCcw size={12} />
                  <span>Regenerate</span>
                </button>
              </div>
            </div>

            {/* Barcode Visual SVG */}
            <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm shrink-0 flex flex-col items-center">
              <BarcodeVisual
                value={variantBarcode}
                width={1.6}
                height={36}
                fontSize={10}
              />
            </div>
          </div>

          {/* TAB 1: CATALOG VARIANTS */}
          {activeTab === 'CATALOG_VARIANTS' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Catalog Variants ({itemVariants.length})
                </h4>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleOpenProductPortal}
                    className="text-xs font-semibold text-slate-600 hover:text-amber-700 flex items-center gap-1"
                  >
                    <span>Manage in Product Portal</span>
                    <ExternalLink size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('FEATURE_CONFIG')}
                    className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1"
                  >
                    <span>Configure Features</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
              </div>

              {itemVariants.length === 0 ? (
                <div className="bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center space-y-3">
                  <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                    <SlidersHorizontal size={18} />
                  </div>
                  <h5 className="text-xs font-bold text-slate-800">No Predefined Variants Found</h5>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('FEATURE_CONFIG')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-colors"
                    >
                      <Sliders size={13} />
                      <span>Configure Features</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleOpenProductPortal}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors"
                    >
                      <ExternalLink size={13} />
                      <span>Create in Product Portal</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {itemVariants.map(v => {
                    const isSelected = selectedVariantId === v.id || variantBarcode === v.barcode;
                    return (
                      <div
                        key={v.id}
                        className={cn(
                          "rounded-xl border p-3.5 transition-all flex flex-col justify-between space-y-2.5",
                          isSelected
                            ? "border-amber-600 bg-amber-50/70 ring-2 ring-amber-500/30 shadow-xs"
                            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                        )}
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                  {v.variantCode}
                                </span>
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                  {v.status || 'ACTIVE'}
                                </span>
                              </div>
                              <h5 className="text-xs font-bold text-slate-900 mt-1">{v.variantName}</h5>
                            </div>
                            <span className="font-mono font-bold text-xs text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                              LKR {(v.pricing?.sellingPrice || 0).toLocaleString()}
                            </span>
                          </div>

                          {/* Barcode readout */}
                          <div className="flex items-center justify-between text-xs bg-white/90 p-1.5 rounded-lg border border-slate-200/80">
                            <div className="flex items-center gap-1 font-mono text-[10px] font-bold text-slate-800">
                              <Barcode size={12} className="text-amber-600" />
                              <span>{v.barcode}</span>
                            </div>
                          </div>

                          {/* Spec badges */}
                          <div className="flex flex-wrap gap-1 text-[10px] font-medium text-slate-600">
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200">
                              {String(v.attributes?.['SYSTEM_SERIES'] || '70mm')}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200">
                              {String(v.attributes?.['GLASS_TYPE'] || 'Clear')} {String(v.attributes?.['GLASS_THICKNESS'] || '5mm')}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200">
                              {String(v.attributes?.['SURFACE_FINISH'] || 'Powder Coated')}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                          {/* Full Details Inspection Button */}
                          <button
                            type="button"
                            onClick={() => handleInspectVariant(v)}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center gap-1 transition-colors"
                          >
                            <Eye size={12} />
                            <span>Details</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSelectCatalogVariant(v)}
                            className={cn(
                              "px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer",
                              isSelected
                                ? "bg-amber-600 text-white shadow-xs"
                                : "bg-slate-100 hover:bg-amber-600 hover:text-white text-slate-800"
                            )}
                          >
                            {isSelected ? <CheckCircle2 size={12} /> : <Check size={12} />}
                            <span>{isSelected ? 'Selected' : 'Select'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CONFIGURE FEATURES */}
          {activeTab === 'FEATURE_CONFIG' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Configure Features</h4>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 font-mono text-[10px] bg-white px-2 py-0.5 rounded border border-slate-200">
                    <span className="text-slate-400">SKU:</span>
                    <span className="font-bold text-slate-800">{variantCode}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveToProductPortal}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    <Database size={11} />
                    <span>Save to Portal</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* 1. Profile & Operation */}
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs space-y-2.5">
                  <div className="flex items-center gap-1.5 pb-1.5 border-b border-slate-100">
                    <Layers size={13} className="text-amber-600" />
                    <h5 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">1. Profile & Operation</h5>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Series</label>
                      <select
                        value={String(attributes['SYSTEM_SERIES'] || '')}
                        onChange={(e) => handleAttributeChange('SYSTEM_SERIES', e.target.value)}
                        className="w-full text-xs border border-slate-300 rounded-lg p-1.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      >
                        <option value="70mm Standard Series">70mm Standard Series</option>
                        <option value="80mm Heavy-Duty Series">80mm Heavy-Duty Series</option>
                        <option value="100mm Commercial Series">100mm Commercial Series</option>
                        <option value="Thermal Break 75mm Series">Thermal Break 75mm Series</option>
                        <option value="Minimalist Slimline Series">Minimalist Slimline Series</option>
                        <option value="Frameless Architectural Glass Wall">Frameless Architectural Glass Wall</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Operation</label>
                      <select
                        value={String(attributes['OPERATION_TYPE'] || '')}
                        onChange={(e) => handleAttributeChange('OPERATION_TYPE', e.target.value)}
                        className="w-full text-xs border border-slate-300 rounded-lg p-1.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      >
                        <option value="Two-Way Sliding">Two-Way Sliding</option>
                        <option value="Three-Way Sliding (3-Track)">Three-Way Sliding (3-Track)</option>
                        <option value="Four-Way Sliding (Center Opening)">Four-Way Sliding (Center Opening)</option>
                        <option value="Side-Hung Casement">Side-Hung Casement</option>
                        <option value="Top-Hung Projected">Top-Hung Projected</option>
                        <option value="Fixed Light (Dead Sash)">Fixed Light (Dead Sash)</option>
                        <option value="Tilt & Turn">Tilt & Turn</option>
                        <option value="Bi-Folding Stacking">Bi-Folding Stacking</option>
                        <option value="Double Action Swing">Double Action Swing</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Panels</label>
                      <select
                        value={String(attributes['PANEL_COUNT'] || '')}
                        onChange={(e) => handleAttributeChange('PANEL_COUNT', e.target.value)}
                        className="w-full text-xs border border-slate-300 rounded-lg p-1.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      >
                        <option value="Single Leaf / Panel">Single Leaf / Panel</option>
                        <option value="2-Panel (1 Fixed, 1 Slide)">2-Panel (1 Fixed, 1 Slide)</option>
                        <option value="2-Panel (Both Sliding)">2-Panel (Both Sliding)</option>
                        <option value="3-Panel (3-Track)">3-Panel (3-Track)</option>
                        <option value="4-Panel (2 Fixed, 2 Slide)">4-Panel (2 Fixed, 2 Slide)</option>
                        <option value="Multi-Panel (Folding/Stacking)">Multi-Panel (Folding/Stacking)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 2. Glass & Glazing */}
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs space-y-2.5">
                  <div className="flex items-center gap-1.5 pb-1.5 border-b border-slate-100">
                    <Cpu size={13} className="text-emerald-600" />
                    <h5 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">2. Glass & Glazing</h5>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Glass Type</label>
                      <select
                        value={String(attributes['GLASS_TYPE'] || '')}
                        onChange={(e) => handleAttributeChange('GLASS_TYPE', e.target.value)}
                        className="w-full text-xs border border-slate-300 rounded-lg p-1.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      >
                        <option value="Clear Annealed Float">Clear Annealed Float</option>
                        <option value="Low-E Solar Control">Low-E Solar Control</option>
                        <option value="Euro Grey Tinted">Euro Grey Tinted</option>
                        <option value="Dark Grey Tinted">Dark Grey Tinted</option>
                        <option value="French Green Tinted">French Green Tinted</option>
                        <option value="Acid Etched / Frosted">Acid Etched / Frosted</option>
                        <option value="Reflective Blue">Reflective Blue</option>
                        <option value="Reflective Silver">Reflective Silver</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Thickness</label>
                      <select
                        value={String(attributes['GLASS_THICKNESS'] || '')}
                        onChange={(e) => handleAttributeChange('GLASS_THICKNESS', e.target.value)}
                        className="w-full text-xs border border-slate-300 rounded-lg p-1.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      >
                        <option value="5mm Single Glazed">5mm Single Glazed</option>
                        <option value="6mm Single Glazed">6mm Single Glazed</option>
                        <option value="8mm Single Glazed">8mm Single Glazed</option>
                        <option value="10mm Monolithic Tempered">10mm Monolithic Tempered</option>
                        <option value="12mm Monolithic Tempered">12mm Monolithic Tempered</option>
                        <option value="12.38mm Acoustic Laminated">12.38mm Acoustic Laminated</option>
                        <option value="24mm Double Glazed (6mm+12Argon+6mm)">24mm Double Glazed (6mm+12Argon+6mm)</option>
                        <option value="28mm Heavy DGU (8mm+12Argon+8mm)">28mm Heavy DGU (8mm+12Argon+8mm)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Safety Treatment</label>
                      <select
                        value={String(attributes['GLASS_TREATMENT'] || '')}
                        onChange={(e) => handleAttributeChange('GLASS_TREATMENT', e.target.value)}
                        className="w-full text-xs border border-slate-300 rounded-lg p-1.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      >
                        <option value="Standard Annealed">Standard Annealed</option>
                        <option value="Fully Tempered Safety (SLS 823 / BS 6206)">Fully Tempered Safety (SLS 823 / BS 6206)</option>
                        <option value="Heat Strengthened">Heat Strengthened</option>
                        <option value="Acoustic PVB Laminated Safety">Acoustic PVB Laminated Safety</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 3. Finish & Color */}
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs space-y-2.5">
                  <div className="flex items-center gap-1.5 pb-1.5 border-b border-slate-100">
                    <Palette size={13} className="text-purple-600" />
                    <h5 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">3. Finish & Color</h5>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Finish</label>
                      <select
                        value={String(attributes['SURFACE_FINISH'] || '')}
                        onChange={(e) => handleAttributeChange('SURFACE_FINISH', e.target.value)}
                        className="w-full text-xs border border-slate-300 rounded-lg p-1.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      >
                        <option value="Powder Coated (Architectural Grade)">Powder Coated (Architectural Grade)</option>
                        <option value="Anodized Natural Silver (15 Microns)">Anodized Natural Silver (15 Microns)</option>
                        <option value="Anodized Bronze (18 Microns)">Anodized Bronze (18 Microns)</option>
                        <option value="Anodized Marine Coastal (25 Microns)">Anodized Marine Coastal (25 Microns)</option>
                        <option value="PVDF Fluorocarbon (2-Coat Architectural)">PVDF Fluorocarbon (2-Coat Architectural)</option>
                        <option value="Woodgrain Sublimation Finish">Woodgrain Sublimation Finish</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-0.5">RAL Color</label>
                      <select
                        value={String(attributes['COLOR_RAL'] || '')}
                        onChange={(e) => handleAttributeChange('COLOR_RAL', e.target.value)}
                        className="w-full text-xs border border-slate-300 rounded-lg p-1.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      >
                        <option value="Pure White (RAL 9016)">Pure White (RAL 9016)</option>
                        <option value="Anthracite Grey (RAL 7016)">Anthracite Grey (RAL 7016)</option>
                        <option value="Jet Black (RAL 9005)">Jet Black (RAL 9005)</option>
                        <option value="White Aluminium (RAL 9006)">White Aluminium (RAL 9006)</option>
                        <option value="Sepia Brown (RAL 8014)">Sepia Brown (RAL 8014)</option>
                        <option value="Off-White Matt (RAL 9010)">Off-White Matt (RAL 9010)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 4. Hardware & Alloy */}
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs space-y-2.5">
                  <div className="flex items-center gap-1.5 pb-1.5 border-b border-slate-100">
                    <ShieldCheck size={13} className="text-blue-600" />
                    <h5 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">4. Hardware & Alloy</h5>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Lock</label>
                      <select
                        value={String(attributes['LOCK_TYPE'] || '')}
                        onChange={(e) => handleAttributeChange('LOCK_TYPE', e.target.value)}
                        className="w-full text-xs border border-slate-300 rounded-lg p-1.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      >
                        <option value="Standard Crescent / Touch Lock">Standard Crescent / Touch Lock</option>
                        <option value="Multi-Point Espagnolette Locking Gear">Multi-Point Espagnolette Locking Gear</option>
                        <option value="Concealed Flush Hook Latch">Concealed Flush Hook Latch</option>
                        <option value="Euro-Cylinder Mortise Deadbolt Lock">Euro-Cylinder Mortise Deadbolt Lock</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Brand</label>
                      <select
                        value={String(attributes['BRAND_SPEC'] || '')}
                        onChange={(e) => handleAttributeChange('BRAND_SPEC', e.target.value)}
                        className="w-full text-xs border border-slate-300 rounded-lg p-1.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      >
                        <option value="Alumex Premium">Alumex Premium</option>
                        <option value="Swisstek Aluminium">Swisstek Aluminium</option>
                        <option value="Lanka Aluminium">Lanka Aluminium</option>
                        <option value="Schüco International">Schüco International</option>
                        <option value="Technal Architectural">Technal Architectural</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Alloy</label>
                      <select
                        value={String(attributes['ALLOY_TEMPER'] || '')}
                        onChange={(e) => handleAttributeChange('ALLOY_TEMPER', e.target.value)}
                        className="w-full text-xs border border-slate-300 rounded-lg p-1.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      >
                        <option value="6063-T5 Architectural Alloy">6063-T5 Architectural Alloy</option>
                        <option value="6063-T6 High-Strength Alloy">6063-T6 High-Strength Alloy</option>
                        <option value="6061-T6 Heavy Structural Alloy">6061-T6 Heavy Structural Alloy</option>
                        <option value="6082-T6 Marine-Grade Alloy">6082-T6 Marine-Grade Alloy</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FULL VARIANT DETAILS (Complete View) */}
          {activeTab === 'FULL_DETAILS' && (
            <div className="space-y-4">
              {/* Header Card with Variant Overview */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                        {detailCode}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {currentDetailVariant?.status || 'Active'}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {selectedCategory?.name || 'Aluminium Systems'}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mt-1">
                      {currentDetailVariant?.variantName || `${selectedBaseItem?.name || item.name} Custom Variant`}
                    </h3>
                  </div>

                  {/* Commercials Summary */}
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[10px] font-semibold text-slate-500 block uppercase">Selling Rate</span>
                      <span className="text-sm font-mono font-extrabold text-slate-900">
                        LKR {detailSellingRate.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-right pl-3 border-l border-slate-200">
                      <span className="text-[10px] font-semibold text-slate-500 block uppercase">Estimated Cost</span>
                      <span className="text-xs font-mono font-bold text-slate-600">
                        LKR {detailCost.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-right pl-3 border-l border-slate-200">
                      <span className="text-[10px] font-semibold text-emerald-600 block uppercase">Margin</span>
                      <span className="text-xs font-mono font-bold text-emerald-700">
                        {detailMargin}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Primary Barcode Banner */}
                <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200 gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Barcode size={16} className="text-amber-600" />
                    <span className="text-xs text-slate-600 font-medium">Barcode:</span>
                    <span className="font-mono text-xs font-extrabold text-slate-900 tracking-wider">
                      {detailBarcode}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopyBarcode(detailBarcode)}
                      className="px-2.5 py-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Copy size={11} />
                      <span>Copy Barcode</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(detailCode)}
                      className="px-2.5 py-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Copy size={11} />
                      <span>Copy SKU</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Complete Specifications Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* 1. Structural & Profile Spec */}
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs space-y-2">
                  <div className="flex items-center gap-1.5 pb-1.5 border-b border-slate-100 text-amber-700">
                    <Layers size={13} />
                    <h5 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">System & Extrusion</h5>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500 font-medium">Series:</span>
                      <span className="font-bold text-slate-900">{String(detailAttributes['SYSTEM_SERIES'] || '70mm')}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500 font-medium">Operation:</span>
                      <span className="font-bold text-slate-900">{String(detailAttributes['OPERATION_TYPE'] || 'Sliding')}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500 font-medium">Panels:</span>
                      <span className="font-bold text-slate-900">{String(detailAttributes['PANEL_COUNT'] || '2-Panel')}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500 font-medium">Metallurgy Brand:</span>
                      <span className="font-bold text-slate-900">{String(detailAttributes['BRAND_SPEC'] || 'Alumex Premium')}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500 font-medium">Alloy & Temper:</span>
                      <span className="font-bold text-slate-900">{String(detailAttributes['ALLOY_TEMPER'] || '6063-T5')}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Glazing & Surface Coating */}
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs space-y-2">
                  <div className="flex items-center gap-1.5 pb-1.5 border-b border-slate-100 text-emerald-700">
                    <Cpu size={13} />
                    <h5 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">Glazing & Coating</h5>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500 font-medium">Glass Type:</span>
                      <span className="font-bold text-slate-900">{String(detailAttributes['GLASS_TYPE'] || 'Clear Float')}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500 font-medium">Thickness:</span>
                      <span className="font-bold text-slate-900">{String(detailAttributes['GLASS_THICKNESS'] || '5mm Single')}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500 font-medium">Treatment:</span>
                      <span className="font-bold text-slate-900">{String(detailAttributes['GLASS_TREATMENT'] || 'Tempered')}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500 font-medium">Surface Finish:</span>
                      <span className="font-bold text-slate-900">{String(detailAttributes['SURFACE_FINISH'] || 'Powder Coated')}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500 font-medium">RAL Color:</span>
                      <span className="font-bold text-slate-900">{String(detailAttributes['COLOR_RAL'] || 'RAL 9016')}</span>
                    </div>
                  </div>
                </div>

                {/* 3. Hardware, Compliance & Warranty */}
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs space-y-2">
                  <div className="flex items-center gap-1.5 pb-1.5 border-b border-slate-100 text-blue-700">
                    <ShieldCheck size={13} />
                    <h5 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">Hardware & Quality</h5>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500 font-medium">Lock Gear:</span>
                      <span className="font-bold text-slate-900">{String(detailAttributes['LOCK_TYPE'] || 'Touch Lock')}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500 font-medium">Extrusion Standard:</span>
                      <span className="font-bold text-slate-900">SLS 1410 / ASTM B221</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500 font-medium">Safety Standard:</span>
                      <span className="font-bold text-slate-900">SLS 823 / BS 6206</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500 font-medium">Warranty:</span>
                      <span className="font-bold text-emerald-700">10-Year Comprehensive</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500 font-medium">Water Tightness:</span>
                      <span className="font-bold text-slate-900">Factory Pressure Tested</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bill of Materials (BOM) Component Breakdown */}
              <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs space-y-2">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                  <div className="flex items-center gap-1.5 text-slate-800">
                    <Wrench size={13} className="text-amber-600" />
                    <h5 className="text-[11px] font-bold uppercase tracking-wider">Components & Bill of Materials</h5>
                  </div>
                  <span className="text-[10px] text-slate-500">Factory Assembly Schedule</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">1. Aluminium Profiles</span>
                    <p className="font-semibold text-slate-900 text-[11px]">
                      {String(detailAttributes['SYSTEM_SERIES'] || '70mm')} Outer Frame, Interlock & Sashes
                    </p>
                    <span className="text-[10px] text-slate-500 font-mono">Alloy: {String(detailAttributes['ALLOY_TEMPER'] || '6063-T5')}</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">2. Glazing Panel</span>
                    <p className="font-semibold text-slate-900 text-[11px]">
                      {String(detailAttributes['GLASS_TYPE'] || 'Clear Float')} ({String(detailAttributes['GLASS_THICKNESS'] || '5mm')})
                    </p>
                    <span className="text-[10px] text-slate-500 font-mono">Safety: {String(detailAttributes['GLASS_TREATMENT'] || 'Tempered')}</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">3. Hardware & Seals</span>
                    <p className="font-semibold text-slate-900 text-[11px]">
                      {String(detailAttributes['LOCK_TYPE'] || 'Crescent Lock')} + EPDM Gaskets & Mohair Pile
                    </p>
                    <span className="text-[10px] text-slate-500 font-mono">Rollers: Heavy-Duty Stainless Bearing</span>
                  </div>
                </div>
              </div>

              {/* Actions for Inspected Variant */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('FEATURE_CONFIG')}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Sliders size={12} />
                    <span>Edit in Configurator</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenProductPortal}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <ExternalLink size={12} />
                    <span>View in Product Portal</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (currentDetailVariant) {
                      handleSelectCatalogVariant(currentDetailVariant);
                    }
                    setActiveTab('CATALOG_VARIANTS');
                  }}
                  className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <CheckCircle size={13} />
                  <span>Select for BOQ Item</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: SPECIFICATIONS */}
          {activeTab === 'TENDER_SPEC' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Technical Specification</h4>
                <button
                  type="button"
                  onClick={() => {
                    const name = selectedBaseItem?.name || item.name;
                    const descs = generateVariantDescriptions(name, attributes);
                    setDescription(descs.technicalDescription);
                    setIsDescCustomized(false);
                    toast.info('Reset specification');
                  }}
                  className="px-2 py-1 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1 transition-colors"
                >
                  <RotateCcw size={11} />
                  <span>Reset</span>
                </button>
              </div>

              <div className="bg-white border border-slate-300 rounded-xl p-3 shadow-2xs space-y-2">
                <textarea
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    setIsDescCustomized(true);
                  }}
                  rows={10}
                  className="w-full text-xs font-mono text-slate-800 bg-slate-50/50 p-2.5 rounded-lg border border-slate-200 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none leading-relaxed resize-y"
                  placeholder="Technical specification clauses..."
                />
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Characters: {description.length}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="bg-white px-5 py-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-medium text-slate-800">
            <input
              type="checkbox"
              checked={applyRateToBOQ}
              onChange={(e) => setApplyRateToBOQ(e.target.checked)}
              className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300"
            />
            <span>
              Sync Item Rate: <strong className="font-mono text-amber-700 font-bold">LKR {variantRate.toLocaleString()} / {item.unit}</strong>
            </span>
          </label>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleApplyToBOQ}
              className="px-4 py-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Save size={13} />
              <span>Apply to BOQ ({variantBarcode})</span>
            </button>
          </div>
        </div>

        {/* Barcode Camera Scanner Modal */}
        <BarcodeScannerModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          allItems={itemTemplates}
          onSelectItem={(scannedItem) => {
            setSelectedItemId(scannedItem.id);
            if (scannedItem.categoryId) setSelectedCategoryId(scannedItem.categoryId);
            setIsScannerOpen(false);
            toast.success(`Selected item: ${scannedItem.name}`);
          }}
        />
      </div>
    </div>
  );
};
