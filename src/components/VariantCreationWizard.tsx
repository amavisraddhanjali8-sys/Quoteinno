import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  ItemCategory, ItemTemplate, ProductVariant, 
  VariantBOM, VariantPricing, MeasurementUnit,
  BOMComponent, BOMLabourItem, AttributeOption, AttributeDefinition,
  BOMOverheadCostItem, OverheadCostType, OverheadCalculationBasis
} from '../types';
import { 
  ArrowRight, ArrowLeft, CheckCircle2, AlertTriangle, 
  ShieldCheck, Calculator, FileText, Layers, 
  Settings2, Palette, Sparkles, X,
  DollarSign, Info, Cpu, RefreshCw,
  Maximize2, Minimize2, Plus, Trash2, Barcode, ScanLine, Copy, Check,
  Edit2, RotateCcw, BookmarkCheck, Sliders,
  Building2
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { 
  evaluateTechnicalCompatibility 
} from '../services/constructionTemplates';
import { 
  generateVariantCode, 
  generateUniqueVariantBarcode,
  isVariantCodeUnique,
  isVariantBarcodeUnique,
  generateVariantDescriptions, 
  checkDuplicateVariant, 
  buildStructuredAttributes,
  generateNormalizedSignature 
} from '../services/variantEngineService';
import { 
  getStoredAttributeDefinitions, 
  addOptionToAttribute, 
  updateOptionInAttribute, 
  deleteOptionFromAttribute, 
  resetAttributeToDefault 
} from '../services/attributeOptionService';
import { 
  generateDefaultBOMForVariant, 
  calculateBOMCosts, 
  calculatePricingScenarios 
} from '../services/bomPricingService';
import { BarcodeVisual } from './boq/BarcodeVisual';
import { BarcodeScannerModal } from './boq/BarcodeScannerModal';

interface VariantCreationWizardProps {
  isOpen?: boolean;
  categories: ItemCategory[];
  itemTemplates: ItemTemplate[];
  existingVariants: ProductVariant[];
  initialItemId?: string;
  preSelectedItemId?: string;
  initialVariant?: ProductVariant | null;
  sourceVariant?: ProductVariant | null;
  onSaveVariant: (variant: ProductVariant) => void;
  onClose: () => void;
}

const WIZARD_STEPS = [
  { id: 1, name: 'Item & Category', shortName: 'Item', icon: Layers },
  { id: 2, name: 'System & Operation', shortName: 'System', icon: Settings2 },
  { id: 3, name: 'Glass & Glazing', shortName: 'Glass', icon: Cpu },
  { id: 4, name: 'Surface & Color', shortName: 'Surface', icon: Palette },
  { id: 5, name: 'Hardware & Locks', shortName: 'Hardware', icon: ShieldCheck },
  { id: 6, name: 'Brand & Alloy', shortName: 'Brand', icon: Sparkles },
  { id: 7, name: 'Compatibility Check', shortName: 'Compat.', icon: AlertTriangle },
  { id: 8, name: 'Specification Engine', shortName: 'Spec', icon: FileText },
  { id: 9, name: 'BOM Cost Rollup', shortName: 'BOM', icon: Calculator },
  { id: 10, name: 'Unique Pricing Matrix', shortName: 'Pricing', icon: DollarSign },
  { id: 11, name: 'Review & Approvals', shortName: 'Review', icon: CheckCircle2 }
];

// Fine and clear architectural descriptions for every field
const ATTRIBUTE_DESCRIPTIONS: Record<string, string> = {
  SYSTEM_SERIES: 'Architectural structural depth, profile wall gauge, and sash arrangements.',
  OPERATION_TYPE: 'Kinematic sash motion, sliding rollers, projecting stays, or multi-point pivot.',
  PANEL_COUNT: 'Total active glazed panels, sliding leaves, and fixed perimeter lights.',
  GLASS_TYPE: 'Base float glass composition, acoustic laminate, or solar reflective coating.',
  GLASS_THICKNESS: 'Single monolithic pane or insulated double glazing (DGU) airspace cavity.',
  GLASS_TINT: 'Visual light transmittance (VLT) and solar heat gain coefficient (SHGC) tinting.',
  TEMPERING_TYPE: 'Safety thermal toughening conforming to BS 6206 / SLS 823 impact standards.',
  FINISH_TYPE: 'Corrosion barrier surface treatment conforming to Qualicoat or AAMA 2604.',
  SURFACE_FINISH: 'Corrosion barrier surface treatment conforming to Qualicoat or AAMA 2604.',
  COATING_MICRONS: 'Dry film thickness (DFT) measurement for coastal atmospheric resistance.',
  COLOR_RAL: 'Standardized RAL Classic architectural color code and gloss percentage.',
  LOCK_TYPE: 'Recessed sash security latch, multi-point espagnolette, or euro-cylinder lock.',
  HANDLE_TYPE: 'Ergonomic pull handle, flush architectural recessed cup, or lever gear.',
  ROLLER_TYPE: 'Sash load-bearing rollers, tandem stainless wheels, and smooth gliding tracks.',
  GASKET_TYPE: 'Captive weatherseals, EPDM dual-durometer gaskets, and silicone fin woolpile.',
  EXTRUSION_BRAND: 'Approved primary aluminium extrusion die supplier and certified foundry mill.',
  BRAND_SPEC: 'Approved primary aluminium extrusion die supplier and certified foundry mill.',
  ALLOY_TEMPER: 'Metallurgical alloy composition and artificial aging temper rating (ASTM B221).'
};

export const VariantCreationWizard: React.FC<VariantCreationWizardProps> = ({
  isOpen = true,
  categories,
  itemTemplates,
  existingVariants,
  initialItemId,
  preSelectedItemId,
  initialVariant,
  sourceVariant,
  onSaveVariant,
  onClose
}) => {
  if (isOpen === false) return null;

  const effectiveSource = sourceVariant || initialVariant;
  const [currentStep, setCurrentStep] = useState<number>(1);
  const activeStepRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    activeStepRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [currentStep]);

  // Full Screen State - default to true to fit the full screen
  const [isFullscreen, setIsFullscreen] = useState<boolean>(true);

  // Prevent background scroll when wizard is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  // Barcode Scanner Modal State
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState<boolean>(false);

  // Copy PK code state
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Dynamic attribute definitions stored in system
  const [attributeDefs, setAttributeDefs] = useState<AttributeDefinition[]>(() => {
    return getStoredAttributeDefinitions();
  });

  // Listen for attribute definitions updates across app
  useEffect(() => {
    const handleDefsUpdate = (e: Event) => {
      const customEvt = e as CustomEvent<{ definitions: AttributeDefinition[] }>;
      if (customEvt.detail?.definitions) {
        setAttributeDefs(customEvt.detail.definitions);
      }
    };
    window.addEventListener('innovista:attribute-definitions-updated', handleDefsUpdate);
    return () => {
      window.removeEventListener('innovista:attribute-definitions-updated', handleDefsUpdate);
    };
  }, []);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToastNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => (prev === msg ? null : prev));
    }, 3500);
  };

  // Custom attributes inputs for steps 2-6: stores { label, codeSuffix, saveForNextUsage }
  const [customAttrInputs, setCustomAttrInputs] = useState<Record<string, { label: string; codeSuffix?: string; saveForNextUsage?: boolean }>>({});

  // Editing option modal state
  const [editingOptionModal, setEditingOptionModal] = useState<{
    defCode: string;
    defName: string;
    optionId: string;
    label: string;
    codeSuffix: string;
  } | null>(null);

  // Deleting option modal state
  const [deletingOptionModal, setDeletingOptionModal] = useState<{
    defCode: string;
    defName: string;
    optionId: string;
    label: string;
  } | null>(null);

  // Manage all presets for an attribute definition modal state
  const [managingAttributeDef, setManagingAttributeDef] = useState<AttributeDefinition | null>(null);

  // --- Step 1: Base Selection ---
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(() => {
    if (effectiveSource?.categoryId) return effectiveSource.categoryId;
    const targetItem = itemTemplates.find(t => t.id === (preSelectedItemId || initialItemId));
    if (targetItem?.categoryId) return targetItem.categoryId;
    return categories[0]?.id || '';
  });

  const [selectedItemId, setSelectedItemId] = useState<string>(() => {
    if (effectiveSource?.itemId) return effectiveSource.itemId;
    if (preSelectedItemId) return preSelectedItemId;
    if (initialItemId) return initialItemId;
    const matching = itemTemplates.filter(t => t.categoryId === selectedCategoryId);
    return matching[0]?.id || itemTemplates[0]?.id || '';
  });

  const selectedCategory = useMemo(() => {
    return categories.find(c => c.id === selectedCategoryId);
  }, [categories, selectedCategoryId]);

  const categoryItems = useMemo(() => {
    // Collect all category IDs in hierarchy under selectedCategoryId
    const childCategoryIds = new Set<string>([selectedCategoryId]);
    const queue = [selectedCategoryId];
    while (queue.length > 0) {
      const cur = queue.shift()!;
      categories.forEach(c => {
        if (c.parentId === cur && !childCategoryIds.has(c.id)) {
          childCategoryIds.add(c.id);
          queue.push(c.id);
        }
      });
    }

    const matches = itemTemplates.filter(t => {
      if (t.categoryId && childCategoryIds.has(t.categoryId)) return true;
      if (selectedCategory) {
        if (t.category?.toLowerCase() === selectedCategory.name.toLowerCase()) return true;
        if (t.subCategory && t.subCategory.toLowerCase() === selectedCategory.name.toLowerCase()) return true;
        if (selectedCategory.name.toLowerCase().includes(t.category?.toLowerCase() || '___')) return true;
      }
      return false;
    });

    if (matches.length > 0) return matches;

    // If a specific item was selected, at least include it so it's never empty
    const directTarget = itemTemplates.find(t => t.id === selectedItemId);
    if (directTarget) return [directTarget];
    return itemTemplates;
  }, [itemTemplates, selectedCategoryId, categories, selectedCategory, selectedItemId]);

  const selectedItem = useMemo(() => {
    const found = itemTemplates.find(t => t.id === selectedItemId);
    if (found) return found;
    if (categoryItems.length > 0) return categoryItems[0];
    return itemTemplates[0] || null;
  }, [itemTemplates, selectedItemId, categoryItems]);

  useEffect(() => {
    if (!selectedItemId && itemTemplates.length > 0) {
      setSelectedItemId(itemTemplates[0].id);
    }
  }, [selectedItemId, itemTemplates]);

  const handleSelectCategory = (catId: string) => {
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
    const cat = categories.find(c => c.id === catId);
    const matching = itemTemplates.filter(t => {
      if (t.categoryId && childIds.has(t.categoryId)) return true;
      if (cat) {
        if (t.category?.toLowerCase() === cat.name.toLowerCase()) return true;
        if (t.subCategory && t.subCategory.toLowerCase() === cat.name.toLowerCase()) return true;
        if (cat.name.toLowerCase().includes(t.category?.toLowerCase() || '___')) return true;
      }
      return false;
    });
    if (matching.length > 0) {
      setSelectedItemId(matching[0].id);
    }
  };

  const handleSelectItem = (itemId: string) => {
    setSelectedItemId(itemId);
    const it = itemTemplates.find(t => t.id === itemId);
    if (it?.categoryId) {
      setSelectedCategoryId(it.categoryId);
    }
  };

  // Copy primary key code helper
  const handleCopyCode = (code: string) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // --- Steps 2-6: Relational Attributes ---
  const [attributes, setAttributes] = useState<Record<string, string | number>>(() => {
    if (effectiveSource?.attributes) {
      return { ...effectiveSource.attributes };
    }
    const defaults: Record<string, string | number> = {};
    const initialDefs = getStoredAttributeDefinitions();
    initialDefs.forEach(def => {
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

  // Add custom or new preset value with persistence
  const handleAddOrSaveOption = (code: string, defName: string) => {
    const inputData = customAttrInputs[code];
    const label = inputData?.label?.trim();
    if (!label) return;

    const saveForNext = inputData.saveForNextUsage !== false;
    const codeSuffix = inputData.codeSuffix?.trim();

    if (saveForNext) {
      const { definitions, createdOption } = addOptionToAttribute(code, {
        label,
        codeSuffix
      });
      setAttributeDefs(definitions);
      handleAttributeChange(code, createdOption.label);
      toast.success(`Saved "${createdOption.label}" in system presets for next usage!`);
      showToastNotification(`Added "${createdOption.label}" and saved to system presets for next usage!`);
      if (managingAttributeDef && managingAttributeDef.code === code) {
        setManagingAttributeDef(definitions.find(d => d.code === code) || null);
      }
    } else {
      handleAttributeChange(code, label);
      toast.info(`Applied custom ${defName}: "${label}"`);
      showToastNotification(`Applied custom ${defName}: "${label}"`);
    }

    setCustomAttrInputs(prev => ({
      ...prev,
      [code]: { label: '', codeSuffix: '', saveForNextUsage: true }
    }));
  };

  const handleOpenEditOption = (defCode: string, defName: string, opt: AttributeOption) => {
    setEditingOptionModal({
      defCode,
      defName,
      optionId: opt.id,
      label: opt.label,
      codeSuffix: opt.codeSuffix || ''
    });
  };

  const handleSaveEditedOption = () => {
    if (!editingOptionModal || !editingOptionModal.label.trim()) return;
    const { defCode, optionId, label, codeSuffix } = editingOptionModal;
    const currentDef = attributeDefs.find(d => d.code === defCode);
    const oldOpt = currentDef?.allowedValues?.find(o => o.id === optionId);
    const oldLabel = oldOpt?.label;

    const { definitions, updatedOption } = updateOptionInAttribute(defCode, optionId, {
      label: label.trim(),
      codeSuffix: codeSuffix.trim()
    });

    setAttributeDefs(definitions);

    if (oldLabel && String(attributes[defCode]) === oldLabel && updatedOption) {
      handleAttributeChange(defCode, updatedOption.label);
    }

    if (managingAttributeDef && managingAttributeDef.code === defCode) {
      setManagingAttributeDef(definitions.find(d => d.code === defCode) || null);
    }

    toast.success(`Updated "${updatedOption?.label || label}" in system presets!`);
    showToastNotification(`Updated "${updatedOption?.label || label}" in system presets!`);
    setEditingOptionModal(null);
  };

  const handleOpenDeleteOption = (defCode: string, defName: string, opt: AttributeOption) => {
    setDeletingOptionModal({
      defCode,
      defName,
      optionId: opt.id,
      label: opt.label
    });
  };

  const handleConfirmDeleteOption = () => {
    if (!deletingOptionModal) return;
    const { defCode, optionId, label } = deletingOptionModal;

    const { definitions, deletedOption } = deleteOptionFromAttribute(defCode, optionId);
    setAttributeDefs(definitions);

    if (String(attributes[defCode]) === label) {
      const remaining = definitions.find(d => d.code === defCode)?.allowedValues;
      const fallback = remaining?.[0]?.label || '';
      handleAttributeChange(defCode, fallback);
    }

    if (managingAttributeDef && managingAttributeDef.code === defCode) {
      setManagingAttributeDef(definitions.find(d => d.code === defCode) || null);
    }

    toast.success(`Deleted "${deletedOption?.label || label}" from presets.`);
    showToastNotification(`Deleted "${deletedOption?.label || label}" from presets.`);
    setDeletingOptionModal(null);
  };

  const handleResetAttributeDefaults = (defCode: string, defName: string) => {
    const updatedDefs = resetAttributeToDefault(defCode);
    setAttributeDefs(updatedDefs);
    const def = updatedDefs.find(d => d.code === defCode);
    if (def && def.allowedValues?.length) {
      handleAttributeChange(defCode, def.defaultValue || def.allowedValues[0].label);
    }
    if (managingAttributeDef && managingAttributeDef.code === defCode) {
      setManagingAttributeDef(updatedDefs.find(d => d.code === defCode) || null);
    }
    toast.info(`Restored factory presets for ${defName}.`);
    showToastNotification(`Restored factory presets for ${defName}.`);
  };

  const handleClearCustomAttribute = (code: string, defaultFallback: string) => {
    handleAttributeChange(code, defaultFallback);
  };

  // --- Step 7: Technical & Physical Compatibility ---
  const compatibilityResult = useMemo(() => {
    return evaluateTechnicalCompatibility(attributes);
  }, [attributes]);

  // --- Step 8: Multi-Audience Descriptions & Specification ---
  const [variantCode, setVariantCode] = useState<string>(() => {
    if (effectiveSource?.variantCode && !sourceVariant) {
      return effectiveSource.variantCode;
    }
    return generateVariantCode(
      selectedItem || selectedItemId,
      attributes,
      existingVariants,
      initialVariant?.id
    );
  });

  const [barcode, setBarcode] = useState<string>(() => {
    if (effectiveSource?.barcode && !sourceVariant) {
      return effectiveSource.barcode;
    }
    return generateUniqueVariantBarcode(
      selectedItem || selectedItemId,
      attributes,
      existingVariants,
      itemTemplates,
      initialVariant?.id
    );
  });

  const [isCodeCustomized, setIsCodeCustomized] = useState<boolean>(Boolean(effectiveSource));
  const [isBarcodeCustomized, setIsBarcodeCustomized] = useState<boolean>(Boolean(effectiveSource?.barcode));

  const isCurrentCodeUnique = useMemo(() => {
    return isVariantCodeUnique(variantCode, existingVariants, initialVariant?.id);
  }, [variantCode, existingVariants, initialVariant?.id]);

  const isCurrentBarcodeUnique = useMemo(() => {
    return isVariantBarcodeUnique(barcode, existingVariants, itemTemplates, initialVariant?.id);
  }, [barcode, existingVariants, itemTemplates, initialVariant?.id]);

  const handleRegenerateUniqueCode = () => {
    const freshCode = generateVariantCode(
      selectedItem || selectedItemId,
      attributes,
      existingVariants,
      initialVariant?.id
    );
    setVariantCode(freshCode);
    setIsCodeCustomized(false);
    toast.success(`Generated unique variant code: ${freshCode}`);
  };

  const handleRegenerateUniqueBarcode = () => {
    const freshBarcode = generateUniqueVariantBarcode(
      selectedItem || selectedItemId,
      attributes,
      existingVariants,
      itemTemplates,
      initialVariant?.id
    );
    setBarcode(freshBarcode);
    setIsBarcodeCustomized(false);
    toast.success(`Generated unique scannable barcode: ${freshBarcode}`);
  };

  const [descriptions, setDescriptions] = useState(() => {
    if (effectiveSource) {
      return {
        customerDescription: effectiveSource.customerDescription || '',
        boqDescription: effectiveSource.boqDescription || '',
        technicalDescription: effectiveSource.technicalDescription || '',
        shortName: effectiveSource.shortName || effectiveSource.variantName,
        generatedDescription: effectiveSource.generatedDescription || ''
      };
    }
    const itemName = selectedItem?.name || 'Aluminium Window';
    return generateVariantDescriptions(itemName, attributes);
  });

  const [variantName, setVariantName] = useState<string>(() => {
    return effectiveSource?.variantName || descriptions.shortName;
  });

  const [isDescCustomized, setIsDescCustomized] = useState<boolean>(Boolean(effectiveSource));

  // Step 8 Custom Technical Clauses
  const [customClauses, setCustomClauses] = useState<string[]>(() => {
    return (effectiveSource as any)?.customClauses || [];
  });
  const [newClauseInput, setNewClauseInput] = useState<string>('');

  const handleAddCustomClause = () => {
    if (!newClauseInput.trim()) return;
    setCustomClauses(prev => [...prev, newClauseInput.trim()]);
    setNewClauseInput('');
    setIsDescCustomized(true);
  };

  const handleDeleteCustomClause = (index: number) => {
    setCustomClauses(prev => prev.filter((_, i) => i !== index));
    setIsDescCustomized(true);
  };

  // Regenerate descriptions, code, and barcode if attributes change and user hasn't customized
  useEffect(() => {
    if (!isDescCustomized) {
      const itemName = selectedItem?.name || 'Aluminium Assembly';
      const fresh = generateVariantDescriptions(itemName, attributes);
      setDescriptions(fresh);
      setVariantName(fresh.shortName);
    }
    if (!isCodeCustomized) {
      setVariantCode(generateVariantCode(
        selectedItem || selectedItemId,
        attributes,
        existingVariants,
        initialVariant?.id
      ));
    }
    if (!isBarcodeCustomized) {
      setBarcode(generateUniqueVariantBarcode(
        selectedItem || selectedItemId,
        attributes,
        existingVariants,
        itemTemplates,
        initialVariant?.id
      ));
    }
  }, [attributes, selectedItem, selectedItemId, isDescCustomized, isCodeCustomized, isBarcodeCustomized, existingVariants, itemTemplates, initialVariant?.id]);

  // --- Step 9: Bill of Materials (BOM) Rollup ---
  const [bom, setBom] = useState<VariantBOM>(() => {
    if (effectiveSource?.bom) {
      return JSON.parse(JSON.stringify(effectiveSource.bom));
    }
    return generateDefaultBOMForVariant(
      'new-variant', 
      attributes, 
      (selectedItem?.unit as MeasurementUnit) || 'm²'
    );
  });

  const [isBomCustomized, setIsBomCustomized] = useState<boolean>(Boolean(effectiveSource?.bom));

  // Step 9 Add Material Component state
  const [showAddMaterial, setShowAddMaterial] = useState<boolean>(false);
  const [newMaterialType, setNewMaterialType] = useState<BOMComponent['componentType']>('PROFILE');
  const [newMaterialDesc, setNewMaterialDesc] = useState<string>('');
  const [newMaterialCode, setNewMaterialCode] = useState<string>('');
  const [newMaterialQty, setNewMaterialQty] = useState<number>(1);
  const [newMaterialUnit, setNewMaterialUnit] = useState<string>('m');
  const [newMaterialWastage, setNewMaterialWastage] = useState<number>(5);
  const [newMaterialRate, setNewMaterialRate] = useState<number>(1000);
  const [newMaterialSupplier, setNewMaterialSupplier] = useState<string>('Standard Extrusions');

  // Step 9 Add Labour Item state
  const [showAddLabour, setShowAddLabour] = useState<boolean>(false);
  const [newLabourType, setNewLabourType] = useState<BOMLabourItem['labourType']>('Fabrication');
  const [newLabourNotes, setNewLabourNotes] = useState<string>('Precision workshop fabrication');
  const [newLabourHours, setNewLabourHours] = useState<number>(1.5);
  const [newLabourRateBasis, setNewLabourRateBasis] = useState<BOMLabourItem['rateBasis']>('HOURLY');
  const [newLabourRate, setNewLabourRate] = useState<number>(1200);

  // Step 9 Add Overhead / Other Cost Item state
  const [showAddOverhead, setShowAddOverhead] = useState<boolean>(false);
  const [newOverheadName, setNewOverheadName] = useState<string>('');
  const [newOverheadType, setNewOverheadType] = useState<OverheadCostType>('LOGISTICS_TRANSPORT');
  const [newOverheadBasis, setNewOverheadBasis] = useState<OverheadCalculationBasis>('FIXED_AMOUNT');
  const [newOverheadRate, setNewOverheadRate] = useState<number>(450);
  const [newOverheadDesc, setNewOverheadDesc] = useState<string>('');
  const [newOverheadCode, setNewOverheadCode] = useState<string>('');

  // Recalculate BOM when attributes change unless user customized it
  useEffect(() => {
    if (!isBomCustomized) {
      const fresh = generateDefaultBOMForVariant(
        'new-variant', 
        attributes, 
        (selectedItem?.unit as MeasurementUnit) || 'm²'
      );
      setBom(fresh);
    }
  }, [attributes, selectedItem?.unit, isBomCustomized]);

  const handleRegenerateBOM = () => {
    const freshBom = generateDefaultBOMForVariant(
      'new-variant', 
      attributes, 
      (selectedItem?.unit as MeasurementUnit) || 'm²'
    );
    setBom(freshBom);
    setIsBomCustomized(false);
  };

  // Add Material Component
  const handleAddMaterialComponent = () => {
    if (!newMaterialDesc.trim()) return;
    setIsBomCustomized(true);
    const qty = Math.max(0.01, Number(newMaterialQty) || 1);
    const wastage = Math.max(0, Number(newMaterialWastage) || 0);
    const grossQty = qty * (1 + wastage / 100);
    const rate = Math.max(0, Number(newMaterialRate) || 0);
    const amount = Math.round(grossQty * rate * 100) / 100;

    const newComp: BOMComponent = {
      id: `comp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      componentType: newMaterialType,
      materialCode: newMaterialCode.trim() || `MAT-${Math.floor(100 + Math.random() * 900)}`,
      description: newMaterialDesc.trim(),
      quantity: qty,
      unit: newMaterialUnit.trim() || 'Nos',
      wastagePercentage: wastage,
      grossQuantity: grossQty,
      rate,
      amount,
      supplierName: newMaterialSupplier.trim() || 'Architectural Supplier',
      priceSource: 'MANUAL_ENTRY',
      priceEffectiveDate: new Date().toISOString().split('T')[0]
    };

    setBom(prev => {
      const updated = {
        ...prev,
        components: [...prev.components, newComp]
      };
      return calculateBOMCosts(updated);
    });

    setNewMaterialDesc('');
    setNewMaterialCode('');
    setNewMaterialQty(1);
    setNewMaterialRate(1000);
    setShowAddMaterial(false);
  };

  // Edit Material Component
  const handleEditComponent = (compId: string, patch: Partial<BOMComponent>) => {
    setIsBomCustomized(true);
    setBom(prev => {
      const updated = {
        ...prev,
        components: prev.components.map(c => {
          if (c.id !== compId) return c;
          const merged = { ...c, ...patch };
          const qty = Number(merged.quantity) || 0;
          const wastage = Number(merged.wastagePercentage) || 0;
          const grossQty = qty * (1 + wastage / 100);
          const rate = Number(merged.rate) || 0;
          const amount = Math.round(grossQty * rate * 100) / 100;
          return {
            ...merged,
            quantity: qty,
            wastagePercentage: wastage,
            grossQuantity: grossQty,
            rate,
            amount
          };
        })
      };
      return calculateBOMCosts(updated);
    });
  };

  // Delete Material Component
  const handleDeleteComponent = (compId: string) => {
    setIsBomCustomized(true);
    setBom(prev => {
      const updated = {
        ...prev,
        components: prev.components.filter(c => c.id !== compId)
      };
      return calculateBOMCosts(updated);
    });
  };

  // Add Labour Item
  const handleAddLabourItem = () => {
    if (!newLabourNotes.trim()) return;
    setIsBomCustomized(true);
    const hours = Math.max(0.1, Number(newLabourHours) || 1);
    const rate = Math.max(0, Number(newLabourRate) || 1200);
    const amount = Math.round(hours * rate * 100) / 100;

    const newLab: BOMLabourItem = {
      id: `lab-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      labourType: newLabourType,
      rateBasis: newLabourRateBasis,
      hoursOrQty: hours,
      unitRate: rate,
      amount,
      notes: newLabourNotes.trim()
    };

    setBom(prev => {
      const updated = {
        ...prev,
        labourItems: [...prev.labourItems, newLab]
      };
      return calculateBOMCosts(updated);
    });

    setNewLabourNotes('Precision workshop fabrication');
    setNewLabourHours(1.5);
    setShowAddLabour(false);
  };

  // Edit Labour Item
  const handleEditLabour = (labId: string, patch: Partial<BOMLabourItem>) => {
    setIsBomCustomized(true);
    setBom(prev => {
      const updated = {
        ...prev,
        labourItems: prev.labourItems.map(l => {
          if (l.id !== labId) return l;
          const merged = { ...l, ...patch };
          const hours = Number(merged.hoursOrQty) || 0;
          const rate = Number(merged.unitRate) || 0;
          const amount = Math.round(hours * rate * 100) / 100;
          return {
            ...merged,
            hoursOrQty: hours,
            unitRate: rate,
            amount
          };
        })
      };
      return calculateBOMCosts(updated);
    });
  };

  // Delete Labour Item
  const handleDeleteLabour = (labId: string) => {
    setIsBomCustomized(true);
    setBom(prev => {
      const updated = {
        ...prev,
        labourItems: prev.labourItems.filter(l => l.id !== labId)
      };
      return calculateBOMCosts(updated);
    });
  };

  // Add Detailed Overhead / Other Cost Item
  const handleAddOverheadCost = () => {
    if (!newOverheadName.trim()) return;
    setIsBomCustomized(true);
    const rate = Math.max(0, Number(newOverheadRate) || 0);

    const newItem: BOMOverheadCostItem = {
      id: `oh-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: newOverheadName.trim(),
      code: newOverheadCode.trim() || `OH-${Math.floor(100 + Math.random() * 900)}`,
      costType: newOverheadType,
      calculationBasis: newOverheadBasis,
      rateOrPercent: rate,
      amount: 0,
      description: newOverheadDesc.trim(),
      isIncludedInUnitCost: true
    };

    setBom(prev => {
      const existing = prev.overheadItems || [];
      const updated = {
        ...prev,
        overheadItems: [...existing, newItem]
      };
      return calculateBOMCosts(updated);
    });

    setNewOverheadName('');
    setNewOverheadDesc('');
    setNewOverheadCode('');
    setNewOverheadRate(5.0);
    setShowAddOverhead(false);
    toast.success(`Overhead cost "${newItem.name}" added to BOM`);
  };

  // Quick Preset Add
  const handleAddPresetOverhead = (type: OverheadCostType) => {
    setIsBomCustomized(true);
    let preset: Omit<BOMOverheadCostItem, 'id' | 'amount'>;
    switch (type) {
      case 'EQUIPMENT_MACHINERY':
        preset = {
          name: 'Machinery & CNC Wear',
          code: 'OH-EQP',
          costType: 'EQUIPMENT_MACHINERY',
          calculationBasis: 'PERCENT_MATERIALS',
          rateOrPercent: 2.0,
          description: 'Saw blades, corner crimping dies & CNC wear allowance',
          isIncludedInUnitCost: true
        };
        break;
      case 'LOGISTICS_TRANSPORT':
        preset = {
          name: 'Site Delivery & Freight',
          code: 'OH-LOG',
          costType: 'LOGISTICS_TRANSPORT',
          calculationBasis: 'FIXED_AMOUNT',
          rateOrPercent: 450,
          description: 'Flatbed delivery to site, craning & offloading allowance',
          isIncludedInUnitCost: true
        };
        break;
      case 'SCAFFOLDING_SITE_ACCESS':
        preset = {
          name: 'Site Scaffolding & Rigging',
          code: 'OH-SCF',
          costType: 'SCAFFOLDING_SITE_ACCESS',
          calculationBasis: 'PERCENT_LABOUR',
          rateOrPercent: 5.0,
          description: 'Mobile access towers and external perimeter safety scaffolding',
          isIncludedInUnitCost: true
        };
        break;
      case 'PACKAGING_PROTECTION':
        preset = {
          name: 'Protective Film & Crating',
          code: 'OH-PKG',
          costType: 'PACKAGING_PROTECTION',
          calculationBasis: 'PERCENT_MATERIALS',
          rateOrPercent: 1.5,
          description: 'Heavy-duty polythene wrap, timber crates & corner guards',
          isIncludedInUnitCost: true
        };
        break;
      case 'QUALITY_TESTING':
        preset = {
          name: 'QA Inspection & Acoustic Test',
          code: 'OH-QC',
          costType: 'QUALITY_TESTING',
          calculationBasis: 'PERCENT_LABOUR',
          rateOrPercent: 3.5,
          description: 'Pre-dispatch check, water spray penetration verification',
          isIncludedInUnitCost: true
        };
        break;
      case 'INSURANCE_COMPLIANCE':
        preset = {
          name: 'Contractor All-Risk Insurance',
          code: 'OH-INS',
          costType: 'INSURANCE_COMPLIANCE',
          calculationBasis: 'PERCENT_DIRECT',
          rateOrPercent: 1.5,
          description: 'CAR insurance premium allocation & HSE compliance',
          isIncludedInUnitCost: true
        };
        break;
      case 'WASTAGE_CONTINGENCY':
        preset = {
          name: 'Site Unforeseen Contingency',
          code: 'OH-CTG',
          costType: 'WASTAGE_CONTINGENCY',
          calculationBasis: 'PERCENT_DIRECT',
          rateOrPercent: 2.0,
          description: 'Aperture tolerance buffer & site contingency reserve',
          isIncludedInUnitCost: true
        };
        break;
      default:
        preset = {
          name: 'Other Project Specific Cost',
          code: 'OH-OTH',
          costType: 'OTHER_COST',
          calculationBasis: 'FIXED_AMOUNT',
          rateOrPercent: 500,
          description: 'Bespoke direct or indirect site/factory cost allocation',
          isIncludedInUnitCost: true
        };
        break;
    }

    const newItem: BOMOverheadCostItem = {
      ...preset,
      id: `oh-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      amount: 0
    };

    setBom(prev => {
      const existing = prev.overheadItems || [];
      const updated = {
        ...prev,
        overheadItems: [...existing, newItem]
      };
      return calculateBOMCosts(updated);
    });

    toast.success(`Added ${newItem.name}`);
  };

  // Edit Overhead Item
  const handleEditOverheadCost = (ohId: string, patch: Partial<BOMOverheadCostItem>) => {
    setIsBomCustomized(true);
    setBom(prev => {
      const existing = prev.overheadItems || [];
      const updatedItems = existing.map(it => {
        if (it.id !== ohId) return it;
        return { ...it, ...patch };
      });
      const updated = {
        ...prev,
        overheadItems: updatedItems
      };
      return calculateBOMCosts(updated);
    });
  };

  // Delete Overhead Item
  const handleDeleteOverheadCost = (ohId: string) => {
    setIsBomCustomized(true);
    setBom(prev => {
      const existing = prev.overheadItems || [];
      const updatedItems = existing.filter(it => it.id !== ohId);
      const updated = {
        ...prev,
        overheadItems: updatedItems
      };
      return calculateBOMCosts(updated);
    });
    toast.info('Cost item removed');
  };

  // --- Step 10: Unique Pricing Structure & Scenarios ---
  const [targetMargin, setTargetMargin] = useState<number>(25);
  const [sellingPrice, setSellingPrice] = useState<number>(() => {
    if (effectiveSource?.pricing?.sellingPrice) return effectiveSource.pricing.sellingPrice;
    const scenarios = calculatePricingScenarios(bom.totalCost, undefined, 25);
    return scenarios.targetPrice;
  });

  const pricingScenarios = useMemo(() => {
    return calculatePricingScenarios(bom.totalCost, sellingPrice, targetMargin);
  }, [bom.totalCost, sellingPrice, targetMargin]);

  const handleSelectScenario = (price: number) => {
    setSellingPrice(price);
  };

  // --- Step 11: Duplicate & Approval Status ---
  const duplicateCheck = useMemo(() => {
    return checkDuplicateVariant(selectedItemId, attributes, existingVariants, sourceVariant?.id);
  }, [selectedItemId, attributes, existingVariants, sourceVariant]);

  const [variantStatus, setVariantStatus] = useState<'ACTIVE' | 'DRAFT' | 'REQUIRES_APPROVAL'>(() => {
    if (compatibilityResult.status === 'REQUIRES_APPROVAL') return 'REQUIRES_APPROVAL';
    return 'ACTIVE';
  });

  const [notes, setNotes] = useState<string>('');

  // Handle Save
  const handleSave = () => {
    const finalPricing: VariantPricing = {
      costPrice: bom.totalCost,
      minimumPrice: pricingScenarios.minimumPrice,
      competitivePrice: pricingScenarios.competitivePrice,
      standardPrice: pricingScenarios.standardPrice,
      targetPrice: pricingScenarios.targetPrice,
      premiumPrice: pricingScenarios.premiumPrice,
      sellingPrice,
      pricingMethod: 'Target Margin',
      markupPercent: pricingScenarios.markupPercent,
      grossMarginPercent: pricingScenarios.grossMarginPercent,
      grossProfit: pricingScenarios.grossProfit,
      priceSource: 'SUPPLIER_QUOTATION',
      currency: 'LKR',
      effectiveFrom: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      lastUpdated: new Date().toISOString(),
      confidenceRating: compatibilityResult.status === 'COMPATIBLE' ? 95 : 75
    };

    const finalTechDesc = customClauses.length > 0
      ? `${descriptions.technicalDescription}\n\nSPECIAL ENGINEERING CLAUSES:\n${customClauses.map((c, i) => `${i + 1}. ${c}`).join('\n')}`
      : descriptions.technicalDescription;

    const finalBarcode = barcode.trim() || generateUniqueVariantBarcode(
      selectedItem || selectedItemId,
      attributes,
      existingVariants,
      itemTemplates,
      sourceVariant?.id
    );

    const finalCode = variantCode.trim() || generateVariantCode(
      selectedItem || selectedItemId,
      attributes,
      existingVariants,
      sourceVariant?.id
    );

    const newVariant: ProductVariant = {
      id: sourceVariant?.id || crypto.randomUUID(),
      variantCode: finalCode,
      barcode: finalBarcode,
      variantName,
      shortName: descriptions.shortName,
      itemId: selectedItemId,
      itemName: selectedItem?.name || 'Aluminium Window',
      categoryId: selectedCategoryId,
      categoryName: selectedCategory?.name || 'Aluminium Works',
      generatedDescription: descriptions.generatedDescription,
      customerDescription: descriptions.customerDescription,
      technicalDescription: finalTechDesc,
      boqDescription: descriptions.boqDescription,
      status: variantStatus,
      technicalStatus: compatibilityResult.status,
      brandName: String(attributes['BRAND_SPEC'] || attributes['EXTRUSION_BRAND'] || 'Alumex'),
      manufacturer: 'Innovista Engineering',
      normalizedSignature: generateNormalizedSignature(attributes),
      attributes,
      structuredAttributes: buildStructuredAttributes(attributes),
      unit: (selectedItem?.unit as MeasurementUnit) || 'm²',
      bom,
      pricing: finalPricing,
      priceHistory: [
        {
          id: crypto.randomUUID(),
          date: new Date().toISOString().split('T')[0],
          newSellingPrice: sellingPrice,
          newCostPrice: bom.totalCost,
          markupPercent: pricingScenarios.markupPercent,
          marginPercent: pricingScenarios.grossMarginPercent,
          reason: sourceVariant ? 'Variant revision and BOM re-costing' : 'Initial Engineering Catalog Setup',
          changedBy: 'Senior QS Estimator'
        },
        ...(sourceVariant?.priceHistory || [])
      ],
      createdBy: 'Senior QS Estimator',
      createdAt: sourceVariant?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes
    };

    onSaveVariant(newVariant);
    onClose();
  };

  const wizardContent = (
    <div className={cn(
      "fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs transition-all",
      isFullscreen ? "p-0 w-screen h-screen" : "p-2 sm:p-4 overflow-y-auto"
    )}>
      <div className={cn(
        "bg-white flex flex-col overflow-hidden transition-all shadow-2xl",
        isFullscreen 
          ? "w-screen h-screen rounded-none border-0" 
          : "w-full max-w-[99vw] my-1 sm:my-2 rounded-2xl border border-slate-200 h-[98vh] max-h-[98vh]"
      )}>
        
        {/* Modal Header - PURE WHITE BACKGROUND */}
        <div className="bg-white text-slate-900 px-4 sm:px-6 py-3 flex items-center justify-between border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 uppercase tracking-wide">
                Construction Engine
              </span>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                {sourceVariant ? `Edit/Clone Variant: ${sourceVariant.variantCode}` : 'Build Construction Product Variant'}
              </h2>
            </div>
            <p className="text-xs text-slate-500 hidden xl:inline">
              11-Step relational specification, physical constraint evaluation, BOM cost rollup, and pricing engine
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Full Screen Toggle Button */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors"
              title={isFullscreen ? "Restore window mode" : "Fit to full screen"}
            >
              {isFullscreen ? (
                <>
                  <Minimize2 size={14} className="text-slate-500" />
                  <span className="hidden sm:inline">Exit Fullscreen</span>
                </>
              ) : (
                <>
                  <Maximize2 size={14} className="text-slate-500" />
                  <span className="hidden sm:inline">Full Screen</span>
                </>
              )}
            </button>

            {/* Close Button */}
            <button 
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Close engine"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Step Progress Navigation Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-3 sm:px-4 py-2 overflow-x-auto shrink-0 scrollbar-thin">
          <div className="flex items-center gap-1 min-w-max">
            {WIZARD_STEPS.map((s, idx) => {
              const Icon = s.icon;
              const isActive = currentStep === s.id;
              const isPast = currentStep > s.id;
              return (
                <button
                  key={s.id}
                  ref={isActive ? activeStepRef : null}
                  onClick={() => setCurrentStep(s.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                    isActive 
                      ? "bg-amber-600 text-white shadow-xs font-semibold ring-2 ring-amber-500/30" 
                      : isPast 
                      ? "bg-slate-200/80 text-slate-700 hover:bg-slate-300" 
                      : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                  )}
                >
                  <span className={cn(
                    "w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
                    isActive ? "bg-white text-amber-700" : isPast ? "bg-emerald-600 text-white" : "bg-slate-300 text-slate-600"
                  )}>
                    {isPast ? '✓' : s.id}
                  </span>
                  <Icon className="w-3.5 h-3.5 shrink-0 opacity-80" />
                  <span className="hidden md:inline">{s.name}</span>
                  <span className="md:hidden">{s.shortName}</span>
                  {idx < WIZARD_STEPS.length - 1 && (
                    <span className="text-slate-300 ml-0.5">›</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Wizard Main Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-50/40">
          
          {/* STEP 1: ITEM & CATEGORY SELECTION */}
          {currentStep === 1 && (
            <div className="space-y-5 w-full">
              <div>
                <h3 className="text-base font-bold text-slate-900">Step 1: Category & Base BOQ Item</h3>
                <p className="text-xs text-slate-500">Every variant inherits units, classification, and primary key barcode link from its parent BOQ Item.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Left Column: Selectors */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Construction Category</label>
                      <select
                        value={selectedCategoryId}
                        onChange={(e) => handleSelectCategory(e.target.value)}
                        className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none text-slate-800"
                      >
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                          Parent BOQ Item <span className="text-amber-600 font-mono text-[10px] font-bold">[Primary Key]</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => setIsBarcodeScannerOpen(true)}
                          className="flex items-center gap-1 px-2 py-0.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-md transition-colors"
                          title="Scan item barcode to select parent item"
                        >
                          <ScanLine size={12} />
                          <span>Scan Barcode</span>
                        </button>
                      </div>
                      <select
                        value={selectedItemId || selectedItem?.id || ''}
                        onChange={(e) => handleSelectItem(e.target.value)}
                        className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none text-slate-800"
                      >
                        {categoryItems.map(item => (
                          <option key={item.id} value={item.id}>
                            [{item.productCode || item.code || item.id}] {item.name} ({item.unit})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-950 space-y-1.5">
                    <div className="font-bold flex items-center gap-1.5 text-amber-900">
                      <Layers size={14} className="text-amber-700" />
                      <span>Parent-Child Relational Architecture</span>
                    </div>
                    <p className="text-[11px] text-amber-900/80 leading-relaxed">
                      All subsequent engineering specifications, glazing allowances, and hardware formulas inherit directly from this parent item classification.
                    </p>
                  </div>
                </div>

                {/* Right Column: Detailed Parent Item Dossier */}
                <div className="lg:col-span-7">
                  {selectedItem ? (
                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4 h-full flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between flex-wrap gap-3 pb-3 border-b border-slate-100">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Parent BOQ Item Dossier</span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                PK: {selectedItem.productCode || selectedItem.code || selectedItem.id}
                              </span>
                            </div>
                            <h4 className="text-base sm:text-lg font-bold text-slate-900">{selectedItem.name}</h4>
                            <p className="text-xs text-slate-600 leading-relaxed">{selectedItem.description || 'Standard architectural construction assembly'}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="px-3 py-1 bg-amber-50 border border-amber-200 rounded-lg text-xs font-bold font-mono text-amber-900">
                              Base Rate: LKR {selectedItem.rate.toLocaleString()} / {selectedItem.unit}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyCode(selectedItem.productCode || selectedItem.code || selectedItem.id)}
                              className="text-[11px] text-slate-500 hover:text-amber-700 flex items-center gap-1 font-mono"
                            >
                              {copiedCode ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                              <span>{copiedCode ? 'Copied PK' : 'Copy PK Code'}</span>
                            </button>
                          </div>
                        </div>

                        {/* Parameter Quick Summary */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-1">
                          <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Standard Unit</span>
                            <span className="font-semibold text-slate-800 text-xs mt-0.5 block">{selectedItem.unit}</span>
                          </div>
                          <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Classification</span>
                            <span className="font-semibold text-slate-800 text-xs mt-0.5 block">{selectedCategory?.name || 'General BOQ'}</span>
                          </div>
                          <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Variants Defined</span>
                            <span className="font-semibold text-slate-800 text-xs mt-0.5 block">
                              {existingVariants.filter(v => v.itemId === selectedItem.id).length} Active Variants
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Primary Key Barcode Display */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <Barcode size={18} className="text-slate-400" />
                          <div>
                            <span className="text-xs font-semibold text-slate-700 block">Item Barcode (Scannable Primary Key)</span>
                            <span className="text-[10px] font-mono text-slate-400 block">{selectedItem.barcode || selectedItem.productCode || selectedItem.code || selectedItem.id}</span>
                          </div>
                        </div>
                        <div className="bg-white p-1.5 rounded-lg border border-slate-200">
                          <BarcodeVisual
                            value={selectedItem.barcode || selectedItem.productCode || selectedItem.code || selectedItem.id}
                            width={1.3}
                            height={28}
                            fontSize={10}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400">
                      No parent BOQ item selected. Please choose a category and item on the left.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEPS 2 TO 6: SYSTEM, GLASS, SURFACE, HARDWARE, BRAND */}
          {[2, 3, 4, 5, 6].includes(currentStep) && (
            <div className="space-y-5 w-full">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {currentStep === 2 && 'Step 2: Profile System & Operation Type'}
                    {currentStep === 3 && 'Step 3: Glass Specification & Glazing'}
                    {currentStep === 4 && 'Step 4: Surface Treatment & RAL Color'}
                    {currentStep === 5 && 'Step 5: Hardware, Rollers & Locking Gear'}
                    {currentStep === 6 && 'Step 6: Extrusion Brand & Alloy Metallurgy'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Select standard architectural engineering presets or specify custom project parameters with real-time feedback.
                  </p>
                </div>
                {/* Active Parameters Ribbon */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-semibold text-slate-400">Current Spec:</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white border border-slate-200 text-slate-700">
                    {String(attributes['SYSTEM_SERIES'] || '70mm')}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white border border-slate-200 text-slate-700">
                    {String(attributes['OPERATION_TYPE'] || 'Sliding')}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white border border-slate-200 text-slate-700">
                    {String(attributes['GLASS_TYPE'] || 'Tempered')} {String(attributes['GLASS_THICKNESS'] || '6mm')}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white border border-slate-200 text-slate-700">
                    {String(attributes['SURFACE_FINISH'] || attributes['FINISH_TYPE'] || 'Powder Coated')}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
                {attributeDefs.filter(d => {
                  if (currentStep === 2) return d.groupId === 'grp-system';
                  if (currentStep === 3) return d.groupId === 'grp-glass' || d.groupId === 'grp-glazing';
                  if (currentStep === 4) return d.groupId === 'grp-finish';
                  if (currentStep === 5) return d.groupId === 'grp-hardware';
                  if (currentStep === 6) return d.groupId === 'grp-brand';
                  return false;
                }).map(def => {
                  const currentValue = String(attributes[def.code] ?? '');
                  const isCustomValue = !def.allowedValues?.some(opt => opt.label === currentValue);
                  const fieldDesc = ATTRIBUTE_DESCRIPTIONS[def.code] || 'Architectural engineering parameter.';
                  const currentInput = customAttrInputs[def.code] || { label: '', codeSuffix: '', saveForNextUsage: true };

                  return (
                    <div key={def.id} className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3.5">
                      <div>
                        <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-100">
                          <div>
                            <div className="flex items-center gap-2">
                              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                                {def.name}
                              </label>
                              <button
                                type="button"
                                onClick={() => setManagingAttributeDef(def)}
                                className="text-[10px] font-medium px-2 py-0.5 rounded bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 flex items-center gap-1 transition-colors"
                                title="Manage all presets for this attribute"
                              >
                                <Sliders size={10} />
                                <span>{def.allowedValues?.length || 0} presets • Manage</span>
                              </button>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">{fieldDesc}</p>
                          </div>
                          
                          <div className="flex items-center gap-1.5 shrink-0">
                            {isCustomValue && currentValue && (
                              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                                <span className="font-semibold text-[11px] truncate max-w-[140px]">Custom: {currentValue}</span>
                                <button
                                  type="button"
                                  onClick={() => handleClearCustomAttribute(def.code, String(def.defaultValue || def.allowedValues?.[0]?.label || ''))}
                                  className="text-amber-600 hover:text-amber-900 p-0.5"
                                  title="Reset to standard"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={() => handleResetAttributeDefaults(def.code, def.name)}
                              title={`Reset ${def.name} to original factory presets`}
                              className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            >
                              <RotateCcw size={13} />
                            </button>
                          </div>
                        </div>

                        {/* Presets Grid with Selection, Edit & Delete */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-3">
                          {def.allowedValues?.map(opt => {
                            const isSelected = currentValue === opt.label;
                            return (
                              <div
                                key={opt.id}
                                className={cn(
                                  "group relative flex items-center justify-between p-2 rounded-lg border text-xs font-medium transition-all",
                                  isSelected 
                                    ? "border-amber-600 bg-amber-50/80 text-amber-950 font-semibold ring-1 ring-amber-500 shadow-xs" 
                                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50/60"
                                )}
                              >
                                <button
                                  type="button"
                                  onClick={() => handleAttributeChange(def.code, opt.label)}
                                  className="flex-1 text-left flex items-center justify-between gap-1.5 overflow-hidden pr-1 py-1"
                                >
                                  <span className="truncate">{opt.label}</span>
                                  {opt.codeSuffix && (
                                    <span className={cn(
                                      "text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0",
                                      isSelected ? "bg-amber-200/80 text-amber-900 font-bold" : "bg-slate-100 text-slate-500"
                                    )}>
                                      {opt.codeSuffix}
                                    </span>
                                  )}
                                </button>

                                {/* Action Controls: Edit & Delete (visible on mobile, tablet, and desktop) */}
                                <div className="flex items-center gap-0.5 pl-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenEditOption(def.code, def.name, opt);
                                    }}
                                    title={`Edit "${opt.label}"`}
                                    className="p-1.5 rounded-md text-slate-400 hover:text-amber-700 hover:bg-amber-100/60 active:bg-amber-200 transition-colors"
                                  >
                                    <Edit2 size={13} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenDeleteOption(def.code, def.name, opt);
                                    }}
                                    title={`Delete "${opt.label}" from presets`}
                                    className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 active:bg-red-100 transition-colors"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Custom Value Adder & System Persistence Bar */}
                      <div className="pt-3 border-t border-slate-100 space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <input
                              type="text"
                              placeholder={`Add new or custom ${def.name.toLowerCase()}...`}
                              value={currentInput.label || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setCustomAttrInputs(prev => {
                                  const existing = prev[def.code] || { label: '', codeSuffix: '', saveForNextUsage: true };
                                  let autoSuffix = existing.codeSuffix;
                                  if (!autoSuffix && val.length >= 2) {
                                    const numMatch = val.match(/\d+/);
                                    if (numMatch) autoSuffix = numMatch[0];
                                  }
                                  return {
                                    ...prev,
                                    [def.code]: { ...existing, label: val, codeSuffix: autoSuffix }
                                  };
                                });
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddOrSaveOption(def.code, def.name);
                                }
                              }}
                              className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none placeholder:text-slate-400"
                            />
                          </div>

                          <div className="w-20 shrink-0">
                            <input
                              type="text"
                              placeholder="Code"
                              title="Short code suffix for barcode & SKU generation (e.g. 120, TB)"
                              value={currentInput.codeSuffix || ''}
                              onChange={(e) => {
                                const suffixVal = e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '').substring(0, 6);
                                setCustomAttrInputs(prev => ({
                                  ...prev,
                                  [def.code]: { ...(prev[def.code] || { label: '', saveForNextUsage: true }), codeSuffix: suffixVal }
                                }));
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddOrSaveOption(def.code, def.name);
                                }
                              }}
                              className="w-full text-xs font-mono border border-slate-200 rounded-lg px-2 py-2 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none uppercase text-center placeholder:text-slate-400"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => handleAddOrSaveOption(def.code, def.name)}
                            disabled={!currentInput.label?.trim()}
                            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-40 transition-colors shrink-0 shadow-xs active:scale-95"
                          >
                            <Plus size={14} />
                            <span>{currentInput.saveForNextUsage !== false ? 'Add & Save' : 'Apply'}</span>
                          </button>
                        </div>

                        {/* Save in system checkbox and status */}
                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                          <label className="flex items-center gap-1.5 cursor-pointer select-none text-slate-600 hover:text-slate-900">
                            <input
                              type="checkbox"
                              checked={currentInput.saveForNextUsage !== false}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setCustomAttrInputs(prev => ({
                                  ...prev,
                                  [def.code]: { ...(prev[def.code] || { label: '', codeSuffix: '' }), saveForNextUsage: checked }
                                }));
                              }}
                              className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                            />
                            <span className="flex items-center gap-1 font-medium">
                              <BookmarkCheck size={13} className="text-amber-600" />
                              Save in system for next usage
                            </span>
                          </label>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setManagingAttributeDef(def)}
                              className="text-amber-700 hover:text-amber-800 font-medium flex items-center gap-1 hover:underline text-[11px]"
                            >
                              <Sliders size={11} />
                              <span>Manage All ({def.allowedValues?.length || 0})</span>
                            </button>
                            <span className="text-slate-300">•</span>
                            <button
                              type="button"
                              onClick={() => handleResetAttributeDefaults(def.code, def.name)}
                              title={`Reset ${def.name} to default factory presets`}
                              className="text-slate-400 hover:text-slate-700 flex items-center gap-1 hover:underline text-[10px]"
                            >
                              <RotateCcw size={10} />
                              <span>Restore Defaults</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 7: COMPATIBILITY EVALUATION */}
          {currentStep === 7 && (
            <div className="space-y-5 w-full">
              <div>
                <h3 className="text-base font-bold text-slate-900">Step 7: Technical & Physical Compatibility Engine</h3>
                <p className="text-xs text-slate-500">Automated verification of glazing pocket limits, roller weight capacities, and architectural safety standards.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Left: Compatibility Status Banner & Checks */}
                <div className="lg:col-span-7 space-y-4">
                  <div className={cn(
                    "border rounded-xl p-5 shadow-xs space-y-3",
                    compatibilityResult.status === 'COMPATIBLE' 
                      ? "bg-emerald-50/70 border-emerald-200 text-emerald-950" 
                      : compatibilityResult.status === 'REQUIRES_APPROVAL'
                      ? "bg-amber-50/70 border-amber-300 text-amber-950"
                      : "bg-red-50/70 border-red-300 text-red-950"
                  )}>
                    <div className="flex items-center gap-2.5">
                      {compatibilityResult.status === 'COMPATIBLE' && <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />}
                      {compatibilityResult.status === 'REQUIRES_APPROVAL' && <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />}
                      {compatibilityResult.status === 'NOT_COMPATIBLE' && <AlertTriangle className="w-6 h-6 text-red-600 shrink-0" />}
                      <div>
                        <h4 className="font-bold text-sm">
                          {compatibilityResult.status === 'COMPATIBLE' && 'Specification is Fully Compatible'}
                          {compatibilityResult.status === 'REQUIRES_APPROVAL' && 'Specification Requires Engineering Sign-Off'}
                          {compatibilityResult.status === 'NOT_COMPATIBLE' && 'Critical Incompatibility Detected'}
                        </h4>
                        <span className="text-xs opacity-80">
                          Validated against British Standards (BS 6262 / BS EN 755) and SLS extruded profile specs.
                        </span>
                      </div>
                    </div>

                    <ul className="space-y-1.5 text-xs ml-8 list-disc pt-1">
                      {compatibilityResult.messages.map((msg, idx) => (
                        <li key={idx} className="leading-relaxed">{msg}</li>
                      ))}
                    </ul>

                    {compatibilityResult.suggestedAction && (
                      <div className="mt-3 pt-3 border-t border-slate-200/60 text-xs font-semibold">
                        Suggested Action: <span className="font-normal">{compatibilityResult.suggestedAction}</span>
                      </div>
                    )}
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl p-4 text-xs text-slate-600 space-y-2">
                    <div className="font-bold text-slate-800 uppercase text-[11px] tracking-wider">Engineering Compliance Verification</div>
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">Deflection Standard</span>
                        <span className="font-semibold text-slate-800 text-xs mt-0.5 block">L/175 Max Wind Load Deflection</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">Water Ingress Rating</span>
                        <span className="font-semibold text-slate-800 text-xs mt-0.5 block">Class 9A (600 Pa) Weather Seal</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Selected Parameter Digest */}
                <div className="lg:col-span-5">
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3.5 h-full">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide pb-2 border-b border-slate-100">
                      Selected Parameter Digest
                    </h4>
                    <div className="space-y-2.5 text-xs">
                      <div className="flex justify-between py-1 border-b border-slate-50">
                        <span className="text-slate-500">System Series</span>
                        <span className="font-semibold font-mono text-slate-800">{String(attributes['SYSTEM_SERIES'] || '70mm')}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-50">
                        <span className="text-slate-500">Operation Type</span>
                        <span className="font-semibold text-slate-800">{String(attributes['OPERATION_TYPE'] || 'Sliding')}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-50">
                        <span className="text-slate-500">Glass Spec</span>
                        <span className="font-semibold text-slate-800">
                          {String(attributes['GLASS_TYPE'] || 'Tempered')} ({String(attributes['GLASS_THICKNESS'] || '6mm')})
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-50">
                        <span className="text-slate-500">Glazing Tint</span>
                        <span className="font-semibold text-slate-800">{String(attributes['GLASS_TINT'] || 'Clear')}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-50">
                        <span className="text-slate-500">Surface Finish</span>
                        <span className="font-semibold text-slate-800">{String(attributes['SURFACE_FINISH'] || attributes['FINISH_TYPE'] || 'Powder Coated')}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-50">
                        <span className="text-slate-500">Hardware / Rollers</span>
                        <span className="font-semibold text-slate-800">{String(attributes['ROLLER_TYPE'] || 'Heavy Duty')}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-50">
                        <span className="text-slate-500">Locking Gear</span>
                        <span className="font-semibold text-slate-800">{String(attributes['LOCKING_MECHANISM'] || 'Multi-Point')}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500">Extrusion Brand</span>
                        <span className="font-semibold text-slate-800">{String(attributes['BRAND_SPEC'] || attributes['EXTRUSION_BRAND'] || 'Alumex')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 8: MULTI-AUDIENCE SPECIFICATION ENGINE */}
          {currentStep === 8 && (
            <div className="space-y-5 w-full">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Step 8: Multi-Audience Specification Engine</h3>
                  <p className="text-xs text-slate-500">Review and customize auto-generated descriptions for customer quotations, formal tender BOQs, and technical specs.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const itemName = selectedItem?.name || 'Aluminium Window';
                    const fresh = generateVariantDescriptions(itemName, attributes);
                    setDescriptions(fresh);
                    setVariantName(fresh.shortName);
                    setVariantCode(generateVariantCode(selectedItem || selectedItemId, attributes, existingVariants, initialVariant?.id));
                    setBarcode(generateUniqueVariantBarcode(selectedItem || selectedItemId, attributes, existingVariants, itemTemplates, initialVariant?.id));
                    setCustomClauses([]);
                    setIsDescCustomized(false);
                    setIsCodeCustomized(false);
                    setIsBarcodeCustomized(false);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition-colors shadow-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset to Auto-Generated</span>
                </button>
              </div>

              {/* Primary Key Code and Barcode Identification Row */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* 1. Variant Code (Primary Key) */}
                <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                      <span>Variant Code (SKU)</span>
                      <span className="text-[10px] text-amber-700 font-mono font-bold bg-amber-50 px-1 py-0.5 rounded border border-amber-200">PK</span>
                    </label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={handleRegenerateUniqueCode}
                        className="text-[11px] text-slate-500 hover:text-amber-700 p-1 hover:bg-slate-100 rounded transition-colors"
                        title="Regenerate guaranteed unique code"
                      >
                        <RefreshCw size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopyCode(variantCode)}
                        className="text-[11px] text-slate-500 hover:text-amber-700 flex items-center gap-1 font-mono p-1 hover:bg-slate-100 rounded transition-colors"
                      >
                        {copiedCode ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                      </button>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={variantCode}
                    onChange={(e) => {
                      setVariantCode(e.target.value);
                      setIsCodeCustomized(true);
                    }}
                    className="w-full text-sm font-mono font-bold border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none text-slate-800"
                    placeholder="e.g. ALW-2TRK-CLR-ANOD-01"
                  />
                  <div className="flex items-center justify-between pt-1">
                    {isCurrentCodeUnique ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <Check size={12} /> Unique Code Verified
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleRegenerateUniqueCode}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 hover:bg-rose-100"
                      >
                        <AlertTriangle size={12} /> Code Collision! Click to Fix
                      </button>
                    )}
                    <span className="text-[10px] text-slate-400">Sequence-checked</span>
                  </div>
                </div>

                {/* 2. Unique Scannable Barcode */}
                <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                      <Barcode size={14} className="text-slate-600" />
                      <span>Scannable Barcode</span>
                      <span className="text-[10px] text-blue-700 font-mono font-bold bg-blue-50 px-1 py-0.5 rounded border border-blue-200">1D</span>
                    </label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={handleRegenerateUniqueBarcode}
                        className="text-[11px] text-slate-500 hover:text-blue-700 p-1 hover:bg-slate-100 rounded transition-colors"
                        title="Regenerate guaranteed unique barcode"
                      >
                        <RefreshCw size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopyCode(barcode)}
                        className="text-[11px] text-slate-500 hover:text-blue-700 flex items-center gap-1 font-mono p-1 hover:bg-slate-100 rounded transition-colors"
                      >
                        <Copy size={12} />
                      </button>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={barcode}
                    onChange={(e) => {
                      setBarcode(e.target.value);
                      setIsBarcodeCustomized(true);
                    }}
                    className="w-full text-sm font-mono font-bold border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800"
                    placeholder="e.g. BAR-ALW-982341"
                  />
                  <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                    <div>
                      {isCurrentBarcodeUnique ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          <Check size={11} /> Unique Barcode
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                          <AlertTriangle size={11} /> Conflict
                        </span>
                      )}
                    </div>
                    <BarcodeVisual value={barcode} width={1.2} height={22} fontSize={9} />
                  </div>
                </div>

                {/* 3. Short Display Name & Hierarchy */}
                <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-2 flex flex-col justify-between">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-1">Short Display Name</label>
                    <input
                      type="text"
                      value={variantName}
                      onChange={(e) => {
                        setVariantName(e.target.value);
                        setIsDescCustomized(true);
                      }}
                      className="w-full text-sm font-bold border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none text-slate-800"
                    />
                    <p className="text-[11px] text-slate-500 mt-1.5">
                      Used in client proposal summaries, bill summaries, and quick order sheets.
                    </p>
                  </div>
                  <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100 flex items-center justify-between">
                    <span>Parent: <strong className="text-slate-800">{selectedItem?.name}</strong></span>
                    <span className="text-slate-400 font-mono text-[10px]">{selectedItem?.code || selectedItemId}</span>
                  </div>
                </div>
              </div>

              {/* 3-Column Multi-Audience Descriptions */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-amber-700 uppercase tracking-wide">
                        Customer Quotation
                      </label>
                      <span className="text-[10px] text-slate-400">Marketing clarity</span>
                    </div>
                    <textarea
                      rows={6}
                      value={descriptions.customerDescription}
                      onChange={(e) => {
                        setDescriptions(prev => ({ ...prev, customerDescription: e.target.value }));
                        setIsDescCustomized(true);
                      }}
                      className="w-full text-xs text-slate-700 border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none leading-relaxed"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1">Rendered on client quotes & invoices</span>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                        BOQ Contract Tender
                      </label>
                      <span className="text-[10px] text-slate-400">FIDIC & SMM7 clause</span>
                    </div>
                    <textarea
                      rows={6}
                      value={descriptions.boqDescription}
                      onChange={(e) => {
                        setDescriptions(prev => ({ ...prev, boqDescription: e.target.value }));
                        setIsDescCustomized(true);
                      }}
                      className="w-full text-xs text-slate-700 border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none leading-relaxed"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1">Used for main contracts & bills of quantities</span>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                        Technical Engineering Spec
                      </label>
                      <span className="text-[10px] text-slate-400">Workshop & Fabrication</span>
                    </div>
                    <textarea
                      rows={6}
                      value={descriptions.technicalDescription}
                      onChange={(e) => {
                        setDescriptions(prev => ({ ...prev, technicalDescription: e.target.value }));
                        setIsDescCustomized(true);
                      }}
                      className="w-full text-xs font-mono text-slate-700 border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none leading-relaxed"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1">Exported to cutting list & site submittals</span>
                </div>
              </div>

              {/* Custom Clauses / Special Notes */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                      Special Engineering Clauses & Warranty Additions
                    </h4>
                    <p className="text-[11px] text-slate-500">Add project-specific clauses, warranties, or submittal conditions.</p>
                  </div>
                </div>

                {customClauses.length > 0 && (
                  <div className="space-y-2">
                    {customClauses.map((clause, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                        <span className="text-slate-800 font-medium">{idx + 1}. {clause}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteCustomClause(idx)}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Delete clause"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Include 10-year AkzoNobel marine environment warranty certificate..."
                    value={newClauseInput}
                    onChange={(e) => setNewClauseInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomClause();
                      }
                    }}
                    className="flex-1 text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomClause}
                    disabled={!newClauseInput.trim()}
                    className="flex items-center gap-1 px-3.5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold disabled:opacity-40 transition-colors shrink-0"
                  >
                    <Plus size={13} />
                    <span>Add Clause</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 9: BOM COST ROLLUP */}
          {currentStep === 9 && (
            <div className="space-y-5 w-full">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">Step 9: Bill of Materials (BOM) Cost Rollup</h3>
                    {isBomCustomized && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        Customized Rates
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">Precise breakdown of profiles, glass, hardware, gaskets, labour, and factory overheads.</p>
                </div>
                <button
                  type="button"
                  onClick={handleRegenerateBOM}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition-colors shadow-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset to Standard BOM</span>
                </button>
              </div>

              {/* Cost Summary KPI Strip */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Direct Materials</div>
                  <div className="text-base sm:text-lg font-bold font-mono text-slate-900 mt-1">LKR {bom.directMaterialCost.toLocaleString()}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{bom.components.length} components specified</div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Direct Labour</div>
                  <div className="text-base sm:text-lg font-bold font-mono text-slate-900 mt-1">LKR {bom.directLabourCost.toLocaleString()}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{bom.labourItems.length} operations allocated</div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
                  <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Overheads & Other Costs</div>
                  <div className="text-base sm:text-lg font-bold font-mono text-amber-700 mt-1">
                    +LKR {(bom.totalOverheadCost ?? (bom.factoryOverheadAmount + bom.adminOverheadAmount + bom.contingencyAmount)).toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{(bom.overheadItems?.length ?? 3)} cost types itemized</div>
                </div>

                <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 shadow-xs">
                  <div className="text-[10px] font-bold text-amber-900 uppercase tracking-wider">Rolled-Up Unit Cost</div>
                  <div className="text-base sm:text-lg font-extrabold font-mono text-amber-950 mt-1">
                    LKR {bom.totalCost.toLocaleString()} <span className="text-xs font-normal text-amber-800">/{bom.baseUnit}</span>
                  </div>
                  <div className="text-[11px] text-amber-800 mt-0.5 font-medium">BOM standard unit cost</div>
                </div>
              </div>

              {/* Material Components Table */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <div className="bg-slate-100/80 px-4 py-2.5 text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center justify-between">
                  <span>Direct Material Components ({bom.baseUnit})</span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-slate-800">Subtotal: LKR {bom.directMaterialCost.toLocaleString()}</span>
                    <button
                      type="button"
                      onClick={() => setShowAddMaterial(prev => !prev)}
                      className="flex items-center gap-1 px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-semibold normal-case transition-colors"
                    >
                      <Plus size={12} />
                      <span>Add Material</span>
                    </button>
                  </div>
                </div>

                {/* Inline Add Material Component Form */}
                {showAddMaterial && (
                  <div className="p-3 bg-amber-50/50 border-b border-amber-200 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2 text-xs">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Type</label>
                      <select
                        value={newMaterialType}
                        onChange={(e) => setNewMaterialType(e.target.value as any)}
                        className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                      >
                        <option value="PROFILE">PROFILE</option>
                        <option value="GLASS">GLASS</option>
                        <option value="HARDWARE">HARDWARE</option>
                        <option value="GASKET">GASKET</option>
                        <option value="SEALANT">SEALANT</option>
                        <option value="CONSUMABLE">CONSUMABLE</option>
                        <option value="ACCESSORY">ACCESSORY</option>
                      </select>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Description</label>
                      <input
                        type="text"
                        placeholder="e.g. Outer Frame Mullion"
                        value={newMaterialDesc}
                        onChange={(e) => setNewMaterialDesc(e.target.value)}
                        className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Code</label>
                      <input
                        type="text"
                        placeholder="MAT-01"
                        value={newMaterialCode}
                        onChange={(e) => setNewMaterialCode(e.target.value)}
                        className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Net Qty & Unit</label>
                      <div className="flex gap-1">
                        <input
                          type="number"
                          value={newMaterialQty}
                          onChange={(e) => setNewMaterialQty(Number(e.target.value))}
                          className="w-14 p-1.5 bg-white border border-slate-300 rounded text-xs"
                        />
                        <input
                          type="text"
                          value={newMaterialUnit}
                          onChange={(e) => setNewMaterialUnit(e.target.value)}
                          className="w-12 p-1.5 bg-white border border-slate-300 rounded text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Wastage %</label>
                      <input
                        type="number"
                        value={newMaterialWastage}
                        onChange={(e) => setNewMaterialWastage(Number(e.target.value))}
                        className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Supplier</label>
                      <input
                        type="text"
                        placeholder="e.g. Alumex / JAT"
                        value={newMaterialSupplier}
                        onChange={(e) => setNewMaterialSupplier(e.target.value)}
                        className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Rate (LKR)</label>
                      <input
                        type="number"
                        value={newMaterialRate}
                        onChange={(e) => setNewMaterialRate(Number(e.target.value))}
                        className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                      />
                    </div>

                    <div className="flex items-end gap-1">
                      <button
                        type="button"
                        onClick={handleAddMaterialComponent}
                        disabled={!newMaterialDesc.trim()}
                        className="w-full py-1.5 bg-amber-600 text-white rounded text-xs font-semibold disabled:opacity-40"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddMaterial(false)}
                        className="py-1.5 px-2 bg-slate-200 text-slate-700 rounded text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                      <tr>
                        <th className="p-2.5">Type</th>
                        <th className="p-2.5">Component / Description</th>
                        <th className="p-2.5 text-right">Net Qty</th>
                        <th className="p-2.5 text-right">Wastage</th>
                        <th className="p-2.5 text-right">Unit Rate (LKR)</th>
                        <th className="p-2.5 text-right">Amount (LKR)</th>
                        <th className="p-2.5 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {bom.components.map(comp => (
                        <tr key={comp.id} className="hover:bg-slate-50/50">
                          <td className="p-2.5">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-700 border border-slate-200">
                              {comp.componentType}
                            </span>
                          </td>
                          <td className="p-2.5 font-medium text-slate-800">
                            <input
                              type="text"
                              value={comp.description}
                              onChange={(e) => handleEditComponent(comp.id, { description: e.target.value })}
                              className="w-full bg-transparent hover:bg-slate-50 focus:bg-white p-0.5 border border-transparent hover:border-slate-200 rounded font-medium text-slate-800"
                            />
                            <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                              <span>{comp.materialCode}</span>
                              <span>•</span>
                              <span>{comp.supplierName}</span>
                            </div>
                          </td>
                          <td className="p-2.5 text-right font-mono">
                            <div className="flex items-center justify-end gap-1">
                              <input
                                type="number"
                                value={comp.quantity}
                                onChange={(e) => handleEditComponent(comp.id, { quantity: Number(e.target.value) })}
                                className="w-14 text-right p-0.5 border border-slate-200 rounded text-xs font-mono"
                              />
                              <span className="text-slate-500">{comp.unit}</span>
                            </div>
                          </td>
                          <td className="p-2.5 text-right font-mono text-slate-500">
                            <div className="flex items-center justify-end gap-0.5">
                              <span>+</span>
                              <input
                                type="number"
                                value={comp.wastagePercentage}
                                onChange={(e) => handleEditComponent(comp.id, { wastagePercentage: Number(e.target.value) })}
                                className="w-12 text-right p-0.5 border border-slate-200 rounded text-xs font-mono"
                              />
                              <span>%</span>
                            </div>
                          </td>
                          <td className="p-2.5 text-right font-mono">
                            <input
                              type="number"
                              value={comp.rate}
                              onChange={(e) => handleEditComponent(comp.id, { rate: Number(e.target.value) })}
                              className="w-24 text-right p-1 border border-slate-200 rounded text-xs font-mono focus:ring-1 focus:ring-amber-500"
                            />
                          </td>
                          <td className="p-2.5 text-right font-mono font-semibold text-slate-900">
                            {comp.amount.toLocaleString()}
                          </td>
                          <td className="p-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteComponent(comp.id)}
                              className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                              title="Delete component"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Labour Items */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <div className="bg-slate-100/80 px-4 py-2.5 text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center justify-between">
                  <span>Fabrication & Installation Labour</span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-slate-800">Subtotal: LKR {bom.directLabourCost.toLocaleString()}</span>
                    <button
                      type="button"
                      onClick={() => setShowAddLabour(prev => !prev)}
                      className="flex items-center gap-1 px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-semibold normal-case transition-colors"
                    >
                      <Plus size={12} />
                      <span>Add Labour</span>
                    </button>
                  </div>
                </div>

                {/* Inline Add Labour Item Form */}
                {showAddLabour && (
                  <div className="p-3 bg-amber-50/50 border-b border-amber-200 grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Labour Type</label>
                      <select
                        value={newLabourType}
                        onChange={(e) => setNewLabourType(e.target.value as any)}
                        className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                      >
                        <option value="Fabrication">Fabrication</option>
                        <option value="Installation">Installation</option>
                        <option value="Glazing">Glazing</option>
                        <option value="Welding">Welding</option>
                        <option value="Site Work">Site Work</option>
                        <option value="Supervision">Supervision</option>
                      </select>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Notes / Description</label>
                      <input
                        type="text"
                        placeholder="e.g. Site alignment & testing"
                        value={newLabourNotes}
                        onChange={(e) => setNewLabourNotes(e.target.value)}
                        className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Rate Basis</label>
                      <select
                        value={newLabourRateBasis}
                        onChange={(e) => setNewLabourRateBasis(e.target.value as any)}
                        className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                      >
                        <option value="HOURLY">HOURLY</option>
                        <option value="DAILY">DAILY</option>
                        <option value="UNIT">UNIT</option>
                        <option value="LUMPSUM">LUMPSUM</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Hours / Qty & Rate</label>
                      <div className="flex gap-1">
                        <input
                          type="number"
                          value={newLabourHours}
                          onChange={(e) => setNewLabourHours(Number(e.target.value))}
                          className="w-14 p-1.5 bg-white border border-slate-300 rounded text-xs"
                        />
                        <input
                          type="number"
                          value={newLabourRate}
                          onChange={(e) => setNewLabourRate(Number(e.target.value))}
                          className="w-20 p-1.5 bg-white border border-slate-300 rounded text-xs"
                        />
                      </div>
                    </div>

                    <div className="flex items-end gap-1">
                      <button
                        type="button"
                        onClick={handleAddLabourItem}
                        disabled={!newLabourNotes.trim()}
                        className="w-full py-1.5 bg-amber-600 text-white rounded text-xs font-semibold disabled:opacity-40"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddLabour(false)}
                        className="py-1.5 px-2 bg-slate-200 text-slate-700 rounded text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                      <tr>
                        <th className="p-2.5">Labour Type</th>
                        <th className="p-2.5">Scope / Operation Notes</th>
                        <th className="p-2.5 text-right">Basis</th>
                        <th className="p-2.5 text-right">Hours / Qty</th>
                        <th className="p-2.5 text-right">Unit Rate (LKR)</th>
                        <th className="p-2.5 text-right">Subtotal (LKR)</th>
                        <th className="p-2.5 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {bom.labourItems.map(l => (
                        <tr key={l.id} className="hover:bg-slate-50/50">
                          <td className="p-2.5">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                              {l.labourType}
                            </span>
                          </td>
                          <td className="p-2.5">
                            <input
                              type="text"
                              value={l.notes || ''}
                              placeholder="Operation description..."
                              onChange={(e) => handleEditLabour(l.id, { notes: e.target.value })}
                              className="w-full bg-transparent hover:bg-slate-50 focus:bg-white p-1 border border-transparent hover:border-slate-200 rounded text-slate-800 font-medium text-xs"
                            />
                          </td>
                          <td className="p-2.5 text-right">
                            <select
                              value={l.rateBasis}
                              onChange={(e) => handleEditLabour(l.id, { rateBasis: e.target.value as any })}
                              className="text-xs font-mono p-0.5 border border-slate-200 rounded bg-white text-slate-700"
                            >
                              <option value="HOURLY">HOURLY</option>
                              <option value="DAILY">DAILY</option>
                              <option value="UNIT">UNIT</option>
                              <option value="LUMPSUM">LUMPSUM</option>
                            </select>
                          </td>
                          <td className="p-2.5 text-right font-mono">
                            <input
                              type="number"
                              value={l.hoursOrQty}
                              onChange={(e) => handleEditLabour(l.id, { hoursOrQty: Number(e.target.value) })}
                              className="w-16 text-right p-1 border border-slate-200 rounded text-xs font-mono"
                            />
                          </td>
                          <td className="p-2.5 text-right font-mono">
                            <input
                              type="number"
                              value={l.unitRate}
                              onChange={(e) => handleEditLabour(l.id, { unitRate: Number(e.target.value) })}
                              className="w-24 text-right p-1 border border-slate-200 rounded text-xs font-mono focus:ring-1 focus:ring-amber-500"
                            />
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                            {l.amount.toLocaleString()}
                          </td>
                          <td className="p-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteLabour(l.id)}
                              className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                              title="Delete labour item"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Detailed Overheads & Other Costs Table */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <div className="bg-slate-100/80 px-4 py-2.5 text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-amber-600" />
                    <span>Detailed Overheads & Other Cost Breakdown ({bom.baseUnit})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-slate-800">
                      Subtotal: LKR {(bom.totalOverheadCost ?? (bom.factoryOverheadAmount + bom.adminOverheadAmount)).toLocaleString()}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAddOverhead(prev => !prev)}
                      className="flex items-center gap-1 px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-semibold normal-case transition-colors shadow-xs"
                    >
                      <Plus size={12} />
                      <span>Add Overhead / Cost</span>
                    </button>
                  </div>
                </div>

                {/* Quick Presets Strip */}
                <div className="bg-amber-50/40 px-4 py-2 border-b border-amber-100 flex items-center justify-between flex-wrap gap-2 text-xs">
                  <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    Quick Add Common Overhead Types:
                  </span>
                  <div className="flex items-center flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleAddPresetOverhead('LOGISTICS_TRANSPORT')}
                      className="px-2 py-0.5 bg-white hover:bg-amber-100/80 border border-slate-200 text-slate-700 rounded text-[11px] font-medium transition-colors"
                    >
                      + Logistics & Freight
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddPresetOverhead('EQUIPMENT_MACHINERY')}
                      className="px-2 py-0.5 bg-white hover:bg-amber-100/80 border border-slate-200 text-slate-700 rounded text-[11px] font-medium transition-colors"
                    >
                      + Machinery & Tooling
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddPresetOverhead('SCAFFOLDING_SITE_ACCESS')}
                      className="px-2 py-0.5 bg-white hover:bg-amber-100/80 border border-slate-200 text-slate-700 rounded text-[11px] font-medium transition-colors"
                    >
                      + Scaffolding & Rigging
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddPresetOverhead('PACKAGING_PROTECTION')}
                      className="px-2 py-0.5 bg-white hover:bg-amber-100/80 border border-slate-200 text-slate-700 rounded text-[11px] font-medium transition-colors"
                    >
                      + Protective Packaging
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddPresetOverhead('QUALITY_TESTING')}
                      className="px-2 py-0.5 bg-white hover:bg-amber-100/80 border border-slate-200 text-slate-700 rounded text-[11px] font-medium transition-colors"
                    >
                      + QA & Water Testing
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddPresetOverhead('INSURANCE_COMPLIANCE')}
                      className="px-2 py-0.5 bg-white hover:bg-amber-100/80 border border-slate-200 text-slate-700 rounded text-[11px] font-medium transition-colors"
                    >
                      + CAR Insurance
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddPresetOverhead('OTHER_COST')}
                      className="px-2 py-0.5 bg-white hover:bg-amber-100/80 border border-slate-200 text-slate-700 rounded text-[11px] font-medium transition-colors"
                    >
                      + Custom Other Cost
                    </button>
                  </div>
                </div>

                {/* Inline Add Overhead Cost Form */}
                {showAddOverhead && (
                  <div className="p-3 bg-amber-50/70 border-b border-amber-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 text-xs animate-in fade-in duration-150">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Cost Type Category</label>
                      <select
                        value={newOverheadType}
                        onChange={(e) => {
                          const val = e.target.value as OverheadCostType;
                          setNewOverheadType(val);
                          if (val === 'LOGISTICS_TRANSPORT') {
                            setNewOverheadName('Site Delivery & Transport Freight');
                            setNewOverheadCode('OH-LOG');
                            setNewOverheadBasis('FIXED_AMOUNT');
                            setNewOverheadRate(450);
                          } else if (val === 'EQUIPMENT_MACHINERY') {
                            setNewOverheadName('Machinery Amortization & CNC Wear');
                            setNewOverheadCode('OH-EQP');
                            setNewOverheadBasis('PERCENT_MATERIALS');
                            setNewOverheadRate(2.0);
                          } else if (val === 'SCAFFOLDING_SITE_ACCESS') {
                            setNewOverheadName('Site Scaffolding & Rigging Access');
                            setNewOverheadCode('OH-SCF');
                            setNewOverheadBasis('PERCENT_LABOUR');
                            setNewOverheadRate(5.0);
                          } else if (val === 'PACKAGING_PROTECTION') {
                            setNewOverheadName('Protective Film & Timber Crating');
                            setNewOverheadCode('OH-PKG');
                            setNewOverheadBasis('PERCENT_MATERIALS');
                            setNewOverheadRate(1.5);
                          } else if (val === 'QUALITY_TESTING') {
                            setNewOverheadName('QA Inspection & Acoustic Water Testing');
                            setNewOverheadCode('OH-QC');
                            setNewOverheadBasis('PERCENT_LABOUR');
                            setNewOverheadRate(3.5);
                          } else if (val === 'INSURANCE_COMPLIANCE') {
                            setNewOverheadName('Contractor All-Risk Insurance & HSE');
                            setNewOverheadCode('OH-INS');
                            setNewOverheadBasis('PERCENT_DIRECT');
                            setNewOverheadRate(1.5);
                          } else if (val === 'WASTAGE_CONTINGENCY') {
                            setNewOverheadName('Site Contingency & Tolerance Reserve');
                            setNewOverheadCode('OH-CTG');
                            setNewOverheadBasis('PERCENT_DIRECT');
                            setNewOverheadRate(2.0);
                          } else if (val === 'FACTORY_OVERHEAD') {
                            setNewOverheadName('Factory Power & Indirect Workshop OH');
                            setNewOverheadCode('OH-FAC');
                            setNewOverheadBasis('PERCENT_DIRECT');
                            setNewOverheadRate(8.0);
                          } else if (val === 'ADMIN_OVERHEAD') {
                            setNewOverheadName('Executive Admin & Quantity Surveying');
                            setNewOverheadCode('OH-ADM');
                            setNewOverheadBasis('PERCENT_DIRECT');
                            setNewOverheadRate(5.0);
                          } else {
                            setNewOverheadName('Custom Project Cost');
                            setNewOverheadCode('OH-OTH');
                            setNewOverheadBasis('FIXED_AMOUNT');
                            setNewOverheadRate(500);
                          }
                        }}
                        className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-medium text-slate-800"
                      >
                        <option value="FACTORY_OVERHEAD">Factory Overhead</option>
                        <option value="ADMIN_OVERHEAD">Admin & Engineering</option>
                        <option value="LOGISTICS_TRANSPORT">Logistics & Transport</option>
                        <option value="EQUIPMENT_MACHINERY">Equipment & Machinery</option>
                        <option value="SCAFFOLDING_SITE_ACCESS">Scaffolding & Site Access</option>
                        <option value="PACKAGING_PROTECTION">Packaging & Protection</option>
                        <option value="QUALITY_TESTING">Quality & Compliance Testing</option>
                        <option value="INSURANCE_COMPLIANCE">Insurance & Safety</option>
                        <option value="WASTAGE_CONTINGENCY">Wastage / Contingency</option>
                        <option value="OTHER_COST">Other Direct/Indirect Cost</option>
                      </select>
                    </div>

                    <div className="lg:col-span-2">
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Cost Item Name & Scope</label>
                      <input
                        type="text"
                        placeholder="e.g. Cushioned Site Transport & Unloading"
                        value={newOverheadName}
                        onChange={(e) => setNewOverheadName(e.target.value)}
                        className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-medium text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Calculation Basis</label>
                      <select
                        value={newOverheadBasis}
                        onChange={(e) => setNewOverheadBasis(e.target.value as OverheadCalculationBasis)}
                        className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800"
                      >
                        <option value="PERCENT_DIRECT">% of Direct Cost (Mat+Lab)</option>
                        <option value="PERCENT_MATERIALS">% of Direct Materials</option>
                        <option value="PERCENT_LABOUR">% of Direct Labour</option>
                        <option value="FIXED_AMOUNT">Fixed LKR Amount / Unit</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                        {newOverheadBasis === 'FIXED_AMOUNT' ? 'Rate (LKR / Unit)' : 'Percentage (%)'}
                      </label>
                      <input
                        type="number"
                        step={newOverheadBasis === 'FIXED_AMOUNT' ? '10' : '0.1'}
                        value={newOverheadRate}
                        onChange={(e) => setNewOverheadRate(Number(e.target.value))}
                        className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-mono text-slate-900 font-bold"
                      />
                    </div>

                    <div className="flex items-end gap-1.5">
                      <button
                        type="button"
                        onClick={handleAddOverheadCost}
                        disabled={!newOverheadName.trim()}
                        className="flex-1 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-semibold disabled:opacity-40 transition-colors"
                      >
                        Save Cost
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddOverhead(false)}
                        className="py-1.5 px-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}

                {/* Overheads Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                      <tr>
                        <th className="p-2.5">Category</th>
                        <th className="p-2.5">Cost Item & Description</th>
                        <th className="p-2.5 text-right">Basis</th>
                        <th className="p-2.5 text-right">Rate / %</th>
                        <th className="p-2.5 text-right">Subtotal (LKR)</th>
                        <th className="p-2.5 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(bom.overheadItems || []).map(oh => {
                        const typeBadgeColor = 
                          oh.costType === 'FACTORY_OVERHEAD' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                          oh.costType === 'ADMIN_OVERHEAD' ? 'bg-indigo-50 text-indigo-800 border-indigo-200' :
                          oh.costType === 'EQUIPMENT_MACHINERY' ? 'bg-purple-50 text-purple-800 border-purple-200' :
                          oh.costType === 'LOGISTICS_TRANSPORT' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                          oh.costType === 'SCAFFOLDING_SITE_ACCESS' ? 'bg-orange-50 text-orange-800 border-orange-200' :
                          oh.costType === 'PACKAGING_PROTECTION' ? 'bg-cyan-50 text-cyan-800 border-cyan-200' :
                          oh.costType === 'QUALITY_TESTING' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                          oh.costType === 'INSURANCE_COMPLIANCE' ? 'bg-teal-50 text-teal-800 border-teal-200' :
                          oh.costType === 'WASTAGE_CONTINGENCY' ? 'bg-rose-50 text-rose-800 border-rose-200' :
                          'bg-slate-100 text-slate-800 border-slate-200';

                        const typeLabel = 
                          oh.costType === 'FACTORY_OVERHEAD' ? 'Factory OH' :
                          oh.costType === 'ADMIN_OVERHEAD' ? 'Admin OH' :
                          oh.costType === 'EQUIPMENT_MACHINERY' ? 'Machinery' :
                          oh.costType === 'LOGISTICS_TRANSPORT' ? 'Logistics' :
                          oh.costType === 'SCAFFOLDING_SITE_ACCESS' ? 'Scaffolding' :
                          oh.costType === 'PACKAGING_PROTECTION' ? 'Packaging' :
                          oh.costType === 'QUALITY_TESTING' ? 'Quality Testing' :
                          oh.costType === 'INSURANCE_COMPLIANCE' ? 'Insurance' :
                          oh.costType === 'WASTAGE_CONTINGENCY' ? 'Contingency' :
                          'Other Cost';

                        return (
                          <tr key={oh.id} className="hover:bg-slate-50/50">
                            <td className="p-2.5">
                              <span className={cn("px-2 py-0.5 rounded text-[10px] font-semibold border whitespace-nowrap", typeBadgeColor)}>
                                {typeLabel}
                              </span>
                            </td>
                            <td className="p-2.5">
                              <input
                                type="text"
                                value={oh.name}
                                onChange={(e) => handleEditOverheadCost(oh.id, { name: e.target.value })}
                                className="w-full bg-transparent hover:bg-slate-50 focus:bg-white p-0.5 border border-transparent hover:border-slate-200 rounded font-medium text-slate-900"
                              />
                              <input
                                type="text"
                                placeholder="Cost description / scope notes..."
                                value={oh.description || ''}
                                onChange={(e) => handleEditOverheadCost(oh.id, { description: e.target.value })}
                                className="w-full bg-transparent hover:bg-slate-50 focus:bg-white p-0.5 border border-transparent hover:border-slate-200 rounded text-[11px] text-slate-500 mt-0.5"
                              />
                            </td>
                            <td className="p-2.5 text-right">
                              <select
                                value={oh.calculationBasis}
                                onChange={(e) => handleEditOverheadCost(oh.id, { calculationBasis: e.target.value as OverheadCalculationBasis })}
                                className="text-xs font-mono p-1 border border-slate-200 rounded bg-white text-slate-700"
                              >
                                <option value="PERCENT_DIRECT">% Direct Cost</option>
                                <option value="PERCENT_MATERIALS">% Materials</option>
                                <option value="PERCENT_LABOUR">% Labour</option>
                                <option value="FIXED_AMOUNT">Fixed LKR</option>
                              </select>
                            </td>
                            <td className="p-2.5 text-right font-mono">
                              <div className="flex items-center justify-end gap-1">
                                <input
                                  type="number"
                                  step={oh.calculationBasis === 'FIXED_AMOUNT' ? '10' : '0.1'}
                                  value={oh.rateOrPercent}
                                  onChange={(e) => handleEditOverheadCost(oh.id, { rateOrPercent: Number(e.target.value) })}
                                  className="w-20 text-right p-1 border border-slate-200 rounded text-xs font-mono focus:ring-1 focus:ring-amber-500"
                                />
                                <span className="text-[10px] text-slate-500 w-4">
                                  {oh.calculationBasis === 'FIXED_AMOUNT' ? 'LKR' : '%'}
                                </span>
                              </div>
                            </td>
                            <td className="p-2.5 text-right font-mono font-bold text-amber-900">
                              +LKR {oh.amount.toLocaleString()}
                            </td>
                            <td className="p-2.5 text-center">
                              <button
                                type="button"
                                onClick={() => handleDeleteOverheadCost(oh.id)}
                                className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                                title="Delete overhead cost"
                              >
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {(!bom.overheadItems || bom.overheadItems.length === 0) && (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-slate-400">
                            No detailed overhead or other costs added yet. Use "Add Overhead / Cost" or choose a quick preset above.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Comprehensive Rolled-Up Cost Summary Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs text-slate-900">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 items-center">
                  <div>
                    <div className="text-[11px] text-slate-500 font-medium">Total Direct Cost</div>
                    <div className="text-base font-mono font-bold mt-0.5 text-slate-900">
                      LKR {bom.totalDirectCost.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Materials (LKR {bom.directMaterialCost.toLocaleString()}) + Labour (LKR {bom.directLabourCost.toLocaleString()})
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] text-amber-700 font-medium">Total Overheads & Other Costs</div>
                    <div className="text-base font-mono font-bold mt-0.5 text-amber-700">
                      +LKR {(bom.totalOverheadCost ?? (bom.factoryOverheadAmount + bom.adminOverheadAmount)).toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {(bom.overheadItems?.length || 0)} itemized cost types
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] text-slate-500 font-medium">Effective Overhead Burden</div>
                    <div className="text-base font-mono font-bold mt-0.5 text-slate-800">
                      {bom.totalDirectCost > 0 
                        ? (((bom.totalOverheadCost ?? 0) / bom.totalDirectCost) * 100).toFixed(1) 
                        : 0}%
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Weighted % on direct cost</div>
                  </div>

                  <div className="border-l border-slate-200 pl-4 bg-amber-50/50 -my-5 -mr-5 p-5 rounded-r-xl">
                    <div className="text-[11px] text-emerald-800 uppercase font-bold tracking-wide">
                      Rolled-Up Standard Unit Cost
                    </div>
                    <div className="text-xl sm:text-2xl font-mono font-extrabold text-slate-900 mt-0.5">
                      LKR {bom.totalCost.toLocaleString()}{' '}
                      <span className="text-xs font-normal text-slate-500">/{bom.baseUnit}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Basis for Step 10 pricing scenarios</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 10: UNIQUE PRICING MATRIX & SCENARIOS */}
          {currentStep === 10 && (
            <div className="space-y-5 w-full">
              <div>
                <h3 className="text-base font-bold text-slate-900">Step 10: Unique & Separate Pricing Structure</h3>
                <p className="text-xs text-slate-500">Every variant maintains its own independent commercial price structure, target gross margins, and profit scenarios.</p>
              </div>

              {/* Pricing Scenario Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <button
                  type="button"
                  onClick={() => handleSelectScenario(pricingScenarios.minimumPrice)}
                  className={cn(
                    "p-3.5 rounded-xl border text-left transition-all shadow-xs",
                    sellingPrice === pricingScenarios.minimumPrice
                      ? "border-red-500 bg-red-50/50 ring-2 ring-red-400"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  )}
                >
                  <div className="text-[10px] uppercase font-bold text-red-700">Minimum Floor (12%)</div>
                  <div className="text-base font-bold font-mono text-slate-900 mt-1">LKR {pricingScenarios.minimumPrice.toLocaleString()}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Breakeven safeguard</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectScenario(pricingScenarios.competitivePrice)}
                  className={cn(
                    "p-3.5 rounded-xl border text-left transition-all shadow-xs",
                    sellingPrice === pricingScenarios.competitivePrice
                      ? "border-amber-500 bg-amber-50/50 ring-2 ring-amber-400"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  )}
                >
                  <div className="text-[10px] uppercase font-bold text-amber-700">Competitive (18%)</div>
                  <div className="text-base font-bold font-mono text-slate-900 mt-1">LKR {pricingScenarios.competitivePrice.toLocaleString()}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Competitive bidding</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectScenario(pricingScenarios.standardPrice)}
                  className={cn(
                    "p-3.5 rounded-xl border text-left transition-all shadow-xs",
                    sellingPrice === pricingScenarios.standardPrice
                      ? "border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-400"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  )}
                >
                  <div className="text-[10px] uppercase font-bold text-emerald-700">Standard (25%)</div>
                  <div className="text-base font-bold font-mono text-slate-900 mt-1">LKR {pricingScenarios.standardPrice.toLocaleString()}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Standard project target</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectScenario(pricingScenarios.targetPrice)}
                  className={cn(
                    "p-3.5 rounded-xl border text-left transition-all shadow-xs",
                    sellingPrice === pricingScenarios.targetPrice
                      ? "border-blue-500 bg-blue-50/50 ring-2 ring-blue-400"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] uppercase font-bold text-blue-700">Target</div>
                    <input
                      type="number"
                      value={targetMargin}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => setTargetMargin(Math.max(1, Number(e.target.value) || 25))}
                      className="w-12 text-[10px] font-bold text-right px-1 py-0.5 border border-blue-200 rounded bg-white text-blue-800"
                      title="Adjust custom target margin %"
                    />
                  </div>
                  <div className="text-base font-bold font-mono text-slate-900 mt-1">LKR {pricingScenarios.targetPrice.toLocaleString()}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Custom margin ({targetMargin}%)</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectScenario(pricingScenarios.premiumPrice)}
                  className={cn(
                    "p-3.5 rounded-xl border text-left transition-all shadow-xs",
                    sellingPrice === pricingScenarios.premiumPrice
                      ? "border-purple-500 bg-purple-50/50 ring-2 ring-purple-400"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  )}
                >
                  <div className="text-[10px] uppercase font-bold text-purple-700">Premium (35%)</div>
                  <div className="text-base font-bold font-mono text-slate-900 mt-1">LKR {pricingScenarios.premiumPrice.toLocaleString()}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">High-end spec / fast track</div>
                </button>
              </div>

              {/* Active Selling Price and Margin Breakdown */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-6 space-y-3">
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                      Active Variant Commercial Selling Price (LKR / {bom.baseUnit})
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-base font-bold text-slate-400">LKR</span>
                      <input
                        type="number"
                        value={sellingPrice}
                        onChange={(e) => setSellingPrice(Number(e.target.value))}
                        className="w-full text-xl font-bold font-mono pl-16 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none text-slate-900"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      You can enter any custom tender price or click one of the pre-calculated margin scenarios above to automatically populate the pricing rate.
                    </p>
                  </div>

                  {/* Financial Math Verification */}
                  <div className="lg:col-span-6 bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 space-y-2.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Total Unit Cost (BOM Rollup):</span>
                      <span className="font-mono font-bold text-slate-800">LKR {bom.totalCost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Gross Profit per Unit:</span>
                      <span className={cn("font-mono font-bold text-sm", pricingScenarios.grossProfit >= 0 ? "text-emerald-700" : "text-red-600")}>
                        LKR {pricingScenarios.grossProfit.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-2">
                      <span className="text-slate-800 font-bold">Gross Margin %:</span>
                      <span className={cn(
                        "font-mono font-extrabold text-base",
                        pricingScenarios.grossMarginPercent >= 20 ? "text-emerald-700" : pricingScenarios.grossMarginPercent >= 15 ? "text-amber-600" : "text-red-600"
                      )}>
                        {pricingScenarios.grossMarginPercent}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Markup on Cost %:</span>
                      <span className="font-mono text-slate-600">+{pricingScenarios.markupPercent}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 11: REVIEW & APPROVALS */}
          {currentStep === 11 && (
            <div className="space-y-5 w-full">
              <div>
                <h3 className="text-base font-bold text-slate-900">Step 11: Final Review, Duplicate Check & Approvals</h3>
                <p className="text-xs text-slate-500">Ensure uniqueness in the catalog, verify engineering sign-off, and activate for live quotes.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Left: Duplicate Status & Approval Controls */}
                <div className="lg:col-span-5 space-y-4">
                  {/* Duplicate Verification Banner */}
                  {duplicateCheck.isDuplicate ? (
                    <div className="p-4 bg-red-50 border border-red-300 rounded-xl text-xs text-red-950 flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-sm">Duplicate Variant Detected!</div>
                        <p className="mt-1 leading-relaxed">{duplicateCheck.duplicateMessage}</p>
                      </div>
                    </div>
                  ) : duplicateCheck.similarityPercentage > 80 ? (
                    <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-950 flex items-start gap-3">
                      <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-sm">Catalog Similarity Notice ({duplicateCheck.similarityPercentage}% Match)</div>
                        <p className="mt-1 leading-relaxed">{duplicateCheck.duplicateMessage}</p>
                        {duplicateCheck.differences && (
                          <div className="mt-2 text-[11px] font-mono">
                            Key differences: {duplicateCheck.differences.map(d => `${d.attribute}: ${d.currentVal} vs ${d.existingVal}`).join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-950 flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-sm">Unique Specification Confirmed</div>
                        <p className="mt-1 leading-relaxed">No identical variant signature found in this parent item master. Safe to add to catalog.</p>
                      </div>
                    </div>
                  )}

                  {/* Status & Approvals Form */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Catalog Status</label>
                      <select
                        value={variantStatus}
                        onChange={(e) => setVariantStatus(e.target.value as any)}
                        className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white font-medium"
                      >
                        <option value="ACTIVE">ACTIVE (Ready for live quotation & takeoff)</option>
                        <option value="DRAFT">DRAFT (Under cost estimation review)</option>
                        <option value="REQUIRES_APPROVAL">REQUIRES_APPROVAL (Pending engineering sign-off)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Engineering Approval Notes</label>
                      <textarea
                        rows={3}
                        placeholder="Optional notes, revision details or site approval reference"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Right: Comprehensive Summary Card with Primary Key and Barcode */}
                <div className="lg:col-span-7">
                  <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs space-y-4 h-full flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between flex-wrap gap-3 pb-3 border-b border-slate-100">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">New Product Variant</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              PK: {variantCode}
                            </span>
                          </div>
                          <h4 className="text-base sm:text-lg font-bold text-slate-900 mt-1">{variantName}</h4>
                          <p className="text-xs text-slate-500">{selectedItem?.name} • {selectedCategory?.name}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-slate-500">Commercial Selling Price</div>
                          <div className="text-xl font-bold font-mono text-slate-900">
                            LKR {sellingPrice.toLocaleString()} <span className="text-xs font-normal text-slate-500">/{bom.baseUnit}</span>
                          </div>
                          <span className="text-[11px] font-semibold text-emerald-700">
                            {pricingScenarios.grossMarginPercent}% Margin (LKR {pricingScenarios.grossProfit.toLocaleString()} Profit)
                          </span>
                        </div>
                      </div>

                      {/* Specs Digest */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Series</span>
                          <span className="font-semibold text-slate-800">{String(attributes['SYSTEM_SERIES'] || '70mm')}</span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Operation</span>
                          <span className="font-semibold text-slate-800">{String(attributes['OPERATION_TYPE'] || 'Sliding')}</span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Glass</span>
                          <span className="font-semibold text-slate-800">{String(attributes['GLASS_THICKNESS'] || '6mm')} {String(attributes['GLASS_TYPE'] || 'Tempered')}</span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Finish</span>
                          <span className="font-semibold text-slate-800 truncate block">{String(attributes['SURFACE_FINISH'] || attributes['FINISH_TYPE'] || 'Powder Coated')}</span>
                        </div>
                      </div>

                      {/* Description Preview */}
                      <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-700 border border-slate-100 space-y-1">
                        <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block">Customer Quotation Description</span>
                        <p className="line-clamp-3 leading-relaxed text-slate-600">{descriptions.customerDescription}</p>
                      </div>
                    </div>

                    {/* Primary Key Code & Unique Barcode Display */}
                    <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
                        <div>
                          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                            <span>Variant Code (SKU)</span>
                            <span className="text-[9px] bg-amber-100 text-amber-800 px-1 py-0.5 rounded font-mono font-bold">PK</span>
                          </div>
                          <div className="text-xs font-mono font-bold text-slate-800 mt-1">{variantCode}</div>
                          <div className="text-[10px] text-emerald-700 font-medium flex items-center gap-1 mt-1">
                            <Check size={11} /> Unique SKU Verified
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyCode(variantCode)}
                          className="p-1.5 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800 text-[11px] transition-colors"
                          title="Copy Code"
                        >
                          {copiedCode ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                        </button>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
                        <div>
                          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                            <Barcode size={13} className="text-slate-600" />
                            <span>Unique Barcode (1D)</span>
                          </div>
                          <div className="text-xs font-mono font-bold text-slate-800 mt-1">{barcode}</div>
                          <div className="text-[10px] text-emerald-700 font-medium flex items-center gap-1 mt-1">
                            <Check size={11} /> Unique Scannable
                          </div>
                        </div>
                        <div className="bg-white p-1 rounded-lg border border-slate-200 shrink-0">
                          <BarcodeVisual value={barcode} width={1.1} height={26} fontSize={8} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Controls */}
        <div className="bg-white border-t border-slate-200 px-6 py-3.5 flex items-center justify-between shrink-0">
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="flex items-center gap-1.5 px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Previous Step
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg text-xs font-medium transition-colors"
            >
              Cancel
            </button>

            {currentStep < 11 ? (
              <button
                type="button"
                onClick={() => {
                  if (currentStep === 1) {
                    if (!selectedItemId && selectedItem) {
                      setSelectedItemId(selectedItem.id);
                    }
                  }
                  setCurrentStep(prev => Math.min(11, prev + 1));
                }}
                className="flex items-center gap-1.5 px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
              >
                Next Step ({WIZARD_STEPS.find(s => s.id === currentStep + 1)?.name || 'Next'})
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSave}
                disabled={duplicateCheck.isDuplicate}
                className={cn(
                  "flex items-center gap-1.5 px-6 py-2 rounded-lg text-xs font-bold shadow-xs transition-all",
                  duplicateCheck.isDuplicate
                    ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                )}
              >
                <CheckCircle2 className="w-4 h-4" />
                Save & Register Variant in Catalog
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Barcode Scanner Modal for Step 1 Base Item Selection */}
      <BarcodeScannerModal
        isOpen={isBarcodeScannerOpen}
        onClose={() => setIsBarcodeScannerOpen(false)}
        allItems={itemTemplates}
        onSelectItem={(item) => {
          setSelectedCategoryId(item.categoryId || categories[0]?.id || '');
          setSelectedItemId(item.id);
          setIsBarcodeScannerOpen(false);
        }}
      />

      {/* Edit Preset Option Modal */}
      {editingOptionModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">
                  {editingOptionModal.defName}
                </span>
                <h4 className="text-base font-bold text-slate-900">Edit System Preset</h4>
              </div>
              <button
                type="button"
                onClick={() => setEditingOptionModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Option Name / Specification Value <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editingOptionModal.label}
                  onChange={(e) => setEditingOptionModal({ ...editingOptionModal, label: e.target.value })}
                  placeholder="e.g. 80mm Heavy-Duty Series"
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none text-slate-800"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSaveEditedOption();
                    }
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Short Code Suffix <span className="text-slate-400 font-normal text-[11px]">(Used for Barcode & SKU generation)</span>
                </label>
                <input
                  type="text"
                  value={editingOptionModal.codeSuffix}
                  onChange={(e) => setEditingOptionModal({ ...editingOptionModal, codeSuffix: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '').substring(0, 8) })}
                  placeholder="e.g. 80, TB75, 2W"
                  className="w-full text-sm font-mono uppercase border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none text-slate-800"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSaveEditedOption();
                    }
                  }}
                />
              </div>

              <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 space-y-1">
                <div className="font-semibold flex items-center gap-1.5 text-amber-800">
                  <BookmarkCheck size={14} className="text-amber-600" />
                  <span>Permanent System Storage</span>
                </div>
                <p className="text-[11px] text-amber-900/80 leading-relaxed">
                  Changes will be saved permanently in the system presets for all next usages. Any active selection referencing this option will update automatically.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingOptionModal(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEditedOption}
                disabled={!editingOptionModal.label.trim()}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors disabled:opacity-40 shadow-xs"
              >
                <Check size={14} />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Preset Option Confirmation Modal */}
      {deletingOptionModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-red-200 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div className="flex-1">
                <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider block">
                  {deletingOptionModal.defName}
                </span>
                <h4 className="text-base font-bold text-slate-900">Delete Preset Option?</h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Are you sure you want to remove <strong className="text-slate-900">&ldquo;{deletingOptionModal.label}&rdquo;</strong> from system presets? It will be deleted from the system and will no longer appear for future usage.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingOptionModal(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteOption}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shadow-xs"
              >
                <Trash2 size={14} />
                <span>Delete Option</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage All Presets Modal */}
      {managingAttributeDef && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 shrink-0">
              <div>
                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">System Presets Library</span>
                <h4 className="text-base font-bold text-slate-900">Manage: {managingAttributeDef.name}</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Add more values, edit existing labels and codes, or delete presets. All changes are saved for next usage.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setManagingAttributeDef(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Inline Quick Adder inside Modal */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2 shrink-0">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                Add New Value to System
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder={`New ${managingAttributeDef.name.toLowerCase()} value...`}
                  id="manage-modal-new-label"
                  className="flex-1 text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const labelInput = document.getElementById('manage-modal-new-label') as HTMLInputElement;
                      const codeInput = document.getElementById('manage-modal-new-code') as HTMLInputElement;
                      if (labelInput?.value.trim()) {
                        const { definitions, createdOption } = addOptionToAttribute(managingAttributeDef.code, {
                          label: labelInput.value.trim(),
                          codeSuffix: codeInput?.value.trim()
                        });
                        setAttributeDefs(definitions);
                        setManagingAttributeDef(definitions.find(d => d.code === managingAttributeDef.code) || null);
                        handleAttributeChange(managingAttributeDef.code, createdOption.label);
                        toast.success(`Saved "${createdOption.label}" in system presets!`);
                        labelInput.value = '';
                        if (codeInput) codeInput.value = '';
                      }
                    }
                  }}
                />
                <input
                  type="text"
                  placeholder="Code"
                  id="manage-modal-new-code"
                  className="w-20 text-xs font-mono uppercase text-center border border-slate-300 rounded-lg px-2 py-1.5 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const labelInput = document.getElementById('manage-modal-new-label') as HTMLInputElement;
                      const codeInput = document.getElementById('manage-modal-new-code') as HTMLInputElement;
                      if (labelInput?.value.trim()) {
                        const { definitions, createdOption } = addOptionToAttribute(managingAttributeDef.code, {
                          label: labelInput.value.trim(),
                          codeSuffix: codeInput?.value.trim()
                        });
                        setAttributeDefs(definitions);
                        setManagingAttributeDef(definitions.find(d => d.code === managingAttributeDef.code) || null);
                        handleAttributeChange(managingAttributeDef.code, createdOption.label);
                        toast.success(`Saved "${createdOption.label}" in system presets!`);
                        labelInput.value = '';
                        if (codeInput) codeInput.value = '';
                      }
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    const labelInput = document.getElementById('manage-modal-new-label') as HTMLInputElement;
                    const codeInput = document.getElementById('manage-modal-new-code') as HTMLInputElement;
                    if (labelInput?.value.trim()) {
                      const { definitions, createdOption } = addOptionToAttribute(managingAttributeDef.code, {
                        label: labelInput.value.trim(),
                        codeSuffix: codeInput?.value.trim()
                      });
                      setAttributeDefs(definitions);
                      setManagingAttributeDef(definitions.find(d => d.code === managingAttributeDef.code) || null);
                      handleAttributeChange(managingAttributeDef.code, createdOption.label);
                      toast.success(`Saved "${createdOption.label}" in system presets!`);
                      labelInput.value = '';
                      if (codeInput) codeInput.value = '';
                    }
                  }}
                  className="px-3 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors flex items-center gap-1 shrink-0 shadow-xs"
                >
                  <Plus size={13} />
                  <span>Add & Save</span>
                </button>
              </div>
            </div>

            {/* List of current options */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100">
              {attributeDefs.find(d => d.code === managingAttributeDef.code)?.allowedValues?.map(opt => (
                <div key={opt.id} className="pt-2 pb-1 first:pt-0 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 overflow-hidden flex-1">
                    <span className="text-xs font-medium text-slate-800 truncate">{opt.label}</span>
                    {opt.codeSuffix && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0">
                        {opt.codeSuffix}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEditOption(managingAttributeDef.code, managingAttributeDef.name, opt)}
                      className="p-1.5 text-slate-400 hover:text-amber-700 hover:bg-amber-50 rounded-md transition-colors"
                      title={`Edit "${opt.label}"`}
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenDeleteOption(managingAttributeDef.code, managingAttributeDef.name, opt)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title={`Delete "${opt.label}"`}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={() => {
                  handleResetAttributeDefaults(managingAttributeDef.code, managingAttributeDef.name);
                }}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 hover:underline"
              >
                <RotateCcw size={12} />
                <span>Restore Defaults</span>
              </button>
              <button
                type="button"
                onClick={() => setManagingAttributeDef(null)}
                className="px-4 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-900 text-white rounded-lg transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Persistent In-App Toast Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[1010] bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-medium animate-in fade-in slide-in-from-bottom-2 border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(wizardContent, document.body) : wizardContent;
};
