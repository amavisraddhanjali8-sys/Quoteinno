import React, { useState, useMemo, useEffect } from 'react';
import { 
  QuoteTemplate, 
  Quote, 
  BOQItem, 
  Term, 
  PaymentTier, 
  Client,
  CompanySettings,
  ItemTemplate,
  ProductVariant,
  ItemCategory,
  ProductFamily,
  RateVersion,
  DesignCategory,
  QuoteStatus,
  CustomerCategory,
  DEFAULT_TERMS
} from '../types';
import { 
  FileText, 
  Plus, 
  CheckCircle2, 
  Search, 
  Copy, 
  Trash2, 
  Save, 
  Download, 
  Upload, 
  X, 
  Layers, 
  Check, 
  ArrowRight, 
  ArrowLeft,
  DollarSign, 
  Sliders,
  Percent,
  MoveUp,
  MoveDown,
  Building2,
  User,
  Store,
  Package,
  FolderTree,
  Image as ImageIcon,
  Video,
  Wrench,
  Zap,
  Calculator,
  Sparkles,
  Film
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, getQuoteTotalBreakdown } from '../lib/utils';
import { ItemCatalog } from './ItemCatalog';
import {
  DEFAULT_DESIGN_CATEGORIES,
  formatBytes,
  validateDesignMediaFile,
  calculateDesignBreakdown,
  isServiceBOQItem
} from './design-hub/designHubDefaults';
import {
  DesignCategoryManagerModal,
  CreateProjectDesignModal
} from './design-hub/DesignCategoryManagerModal';
import { ProductPortalInsertModal } from './design-hub/ProductPortalInsertModal';
import { DesignMediaAndSpecsTab } from './design-hub/DesignMediaAndSpecsTab';

export interface ApplyTemplateOptions {
  mode?: 'replace' | 'append';
  includeItems?: boolean;
  includeTerms?: boolean;
  includeMilestones?: boolean;
  includeCommercial?: boolean;
}

export interface QuoteTemplateManagerProps {
  templates: QuoteTemplate[];
  onSelectTemplate: (template: QuoteTemplate, options?: ApplyTemplateOptions) => void;
  onSaveTemplate?: (template: QuoteTemplate) => void;
  onDeleteTemplate?: (templateId: string) => void;
  onClose: () => void;
  currentQuote?: Quote;
  clients?: Client[];
  onSaveClient?: (client: Client) => Client;
  itemCatalog?: ItemTemplate[];
  productVariants?: ProductVariant[];
  itemCategories?: ItemCategory[];
  productFamilies?: ProductFamily[];
  rateVersions?: RateVersion[];
  onSaveItemTemplate?: (item: ItemTemplate) => void;
  onSaveProductVariant?: (variant: ProductVariant) => void;
  companySettings?: CompanySettings;
  onProceedToQuotation?: (createdQuote: Quote) => void;
  onCreateProjectFromDesign?: (createdQuote: Quote) => void;
}

type EditorTab = 'items' | 'quick_insert' | 'media_specs' | 'terms' | 'commercial';

export const QuoteTemplateManager: React.FC<QuoteTemplateManagerProps> = ({ 
  templates, 
  onSelectTemplate, 
  onSaveTemplate,
  onDeleteTemplate,
  onClose,
  currentQuote,
  clients = [],
  onSaveClient,
  itemCatalog = [],
  productVariants = [],
  itemCategories = [],
  productFamilies = [],
  rateVersions = [],
  onSaveItemTemplate,
  onSaveProductVariant,
  companySettings,
  onProceedToQuotation,
  onCreateProjectFromDesign
}) => {
  // Navigation View: 'cards' = Grid of Project Design cards, 'editor' = Fullscreen Project Design Studio
  const [portalView, setPortalView] = useState<'cards' | 'editor'>('cards');

  // Design Hub Categories & Sub-Categories (persisted to localStorage)
  const [designCategories, setDesignCategories] = useState<DesignCategory[]>(() => {
    const saved = localStorage.getItem('innovista_design_hub_categories_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        return DEFAULT_DESIGN_CATEGORIES;
      }
    }
    return DEFAULT_DESIGN_CATEGORIES;
  });

  const handleSaveDesignCategories = (next: DesignCategory[]) => {
    setDesignCategories(next);
    localStorage.setItem('innovista_design_hub_categories_v1', JSON.stringify(next));
  };

  // Multi-selection state for merging templates in cards view
  const [selectedForMerge, setSelectedForMerge] = useState<Set<string>>(new Set());

  // Search & Category / Sub-Category Filter in Cards View
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSubCategory, setSelectedSubCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'name' | 'items' | 'value' | 'recent'>('name');

  // Design Hub Modals
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [isCreateDesignModalOpen, setIsCreateDesignModalOpen] = useState(false);
  const [isProductPortalModalOpen, setIsProductPortalModalOpen] = useState(false);
  const [productPortalInitialTab, setProductPortalInitialTab] = useState<'PRODUCTS' | 'SERVICES' | 'VARIANTS' | 'CREATE_NEW'>('PRODUCTS');
  const [itemTypeFilter, setItemTypeFilter] = useState<'ALL' | 'PRODUCT' | 'SERVICE'>('ALL');
  const [launchMode, setLaunchMode] = useState<'quote' | 'project'>('quote');

  // Currently active staged template in the editor
  const [stagedTemplate, setStagedTemplate] = useState<QuoteTemplate | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [activeEditorTab, setActiveEditorTab] = useState<EditorTab>('items');

  // Search inside editor items
  const [itemSearchQuery, setItemSearchQuery] = useState('');

  // Batch markup tool in editor
  const [showMarkupTool, setShowMarkupTool] = useState(false);
  const [markupPercent, setMarkupPercent] = useState<number>(10);

  // Modals state
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [mergeModalSelection, setMergeModalSelection] = useState<Set<string>>(new Set());
  const [mergeIncludeItems, setMergeIncludeItems] = useState(true);
  const [mergeIncludeTerms, setMergeIncludeTerms] = useState(true);

  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);

  const [isProceedModalOpen, setIsProceedModalOpen] = useState(false);

  // Customer & Project configuration in Proceed Modal
  const [clientMode, setClientMode] = useState<'existing' | 'new'>('existing');
  const [selectedClientId, setSelectedClientId] = useState<string>(
    clients.length > 0 ? clients[0].id : ''
  );
  const [newClientData, setNewClientData] = useState({
    name: '',
    tradeName: '',
    phone: '',
    email: '',
    address: '',
    city: ''
  });
  const [projectName, setProjectName] = useState('');
  const [workSiteLocation, setWorkSiteLocation] = useState('');
  const [customQuoteNo, setCustomQuoteNo] = useState('');
  const [quoteValidityDays, setQuoteValidityDays] = useState(30);
  const [alsoSaveAsTemplate, setAlsoSaveAsTemplate] = useState(false);
  const [alsoSaveTemplateName, setAlsoSaveTemplateName] = useState('');

  // Toast / notification
  const [notice, setNotice] = useState<{ message: string; type: 'success' | 'info' | 'warning' } | null>(null);

  const showNotice = (message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setNotice({ message, type });
    setTimeout(() => setNotice(null), 3500);
  };

  // Main categories and dynamic sub-categories
  const mainDesignCategories = useMemo(
    () => designCategories.filter(c => !c.parentId),
    [designCategories]
  );

  const categoryFilterPills = useMemo(() => {
    const names = mainDesignCategories.map(c => c.name);
    templates.forEach(t => {
      if (t.category && !names.includes(t.category)) {
        names.push(t.category);
      }
    });
    return ['All', ...names, 'Custom Saved'];
  }, [mainDesignCategories, templates]);

  const subCategoriesForSelectedMain = useMemo(() => {
    if (selectedCategory === 'All' || selectedCategory === 'Custom Saved') return [];
    const mainObj = mainDesignCategories.find(c => c.name === selectedCategory);
    const list = mainObj
      ? designCategories.filter(c => c.parentId === mainObj.id).map(s => s.name)
      : [];
    templates
      .filter(t => t.category === selectedCategory && t.subCategory)
      .forEach(t => {
        if (t.subCategory && !list.includes(t.subCategory)) {
          list.push(t.subCategory);
        }
      });
    return list;
  }, [selectedCategory, mainDesignCategories, designCategories, templates]);

  // Keyboard shortcut: Esc closes modal or exits editor
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isMergeModalOpen) setIsMergeModalOpen(false);
        else if (isCatalogModalOpen) setIsCatalogModalOpen(false);
        else if (isProductPortalModalOpen) setIsProductPortalModalOpen(false);
        else if (isCategoryManagerOpen) setIsCategoryManagerOpen(false);
        else if (isCreateDesignModalOpen) setIsCreateDesignModalOpen(false);
        else if (isProceedModalOpen) setIsProceedModalOpen(false);
        else if (portalView === 'editor') setPortalView('cards');
        else onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    onClose,
    isMergeModalOpen,
    isCatalogModalOpen,
    isProductPortalModalOpen,
    isCategoryManagerOpen,
    isCreateDesignModalOpen,
    isProceedModalOpen,
    portalView
  ]);

  // Filter & sort templates for cards grid
  const filteredTemplates = useMemo(() => {
    return templates.filter(t => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || (
        t.name.toLowerCase().includes(q) ||
        (t.designCode && t.designCode.toLowerCase().includes(q)) ||
        t.description.toLowerCase().includes(q) ||
        (t.category && t.category.toLowerCase().includes(q)) ||
        (t.subCategory && t.subCategory.toLowerCase().includes(q)) ||
        (t.quoteType && t.quoteType.toLowerCase().includes(q)) ||
        (t.tags && t.tags.some(tag => tag.toLowerCase().includes(q))) ||
        t.items.some(it => it.name.toLowerCase().includes(q) || (it.pvcCode && it.pvcCode.toLowerCase().includes(q)))
      );

      const matchesCat = 
        selectedCategory === 'All' ||
        (selectedCategory === 'Custom Saved' ? t.isCustom : t.category === selectedCategory);

      const matchesSubCat =
        selectedSubCategory === 'All' ||
        t.subCategory === selectedSubCategory;

      return matchesSearch && matchesCat && matchesSubCat;
    }).sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'items') return b.items.length - a.items.length;
      if (sortBy === 'recent') {
        const dateA = a.updatedAt || a.createdAt || '';
        const dateB = b.updatedAt || b.createdAt || '';
        return dateB.localeCompare(dateA);
      }
      if (sortBy === 'value') {
        const valA = a.items.reduce((s, it) => s + (it.amount || it.qty * it.rate), 0);
        const valB = b.items.reduce((s, it) => s + (it.amount || it.qty * it.rate), 0);
        return valB - valA;
      }
      return 0;
    });
  }, [templates, searchQuery, selectedCategory, selectedSubCategory, sortBy]);

  // Total summary of selected templates for merge
  const mergeSummary = useMemo(() => {
    const selected = templates.filter(t => selectedForMerge.has(t.id));
    const itemsCount = selected.reduce((sum, t) => sum + t.items.length, 0);
    const totalEst = selected.reduce((sum, t) => 
      sum + t.items.reduce((s, it) => s + (it.amount || it.qty * it.rate), 0)
    , 0);
    return { count: selected.length, itemsCount, totalEst, templates: selected };
  }, [templates, selectedForMerge]);

  // Full Project Design financial & margin breakdown
  const designFinancials = useMemo(
    () => calculateDesignBreakdown(stagedTemplate),
    [stagedTemplate]
  );

  // Calculations for currently staged template
  const stagedCalculations = useMemo(() => {
    const areaSqft = stagedTemplate?.designSpecs?.totalAreaSqft || 0;
    return {
      gross: designFinancials.grossTotal,
      discount: designFinancials.discountTotal,
      net: designFinancials.netItemsTotal,
      itemsCount: stagedTemplate ? stagedTemplate.items.length : 0,
      productsCount: designFinancials.productsCount,
      servicesCount: designFinancials.servicesCount,
      productsGross: designFinancials.productsGross,
      servicesGross: designFinancials.servicesGross,
      chargesTotal: designFinancials.additionalChargesTotal,
      taxAmount: designFinancials.taxAmount,
      grandTotal: designFinancials.grandTotal,
      estimatedCost: designFinancials.estimatedCostTotal,
      estimatedProfit: designFinancials.estimatedProfit,
      estimatedMarginPercent: designFinancials.estimatedMarginPercent,
      ratePerSqft: areaSqft > 0 ? designFinancials.grandTotal / areaSqft : 0
    };
  }, [stagedTemplate, designFinancials]);

  // Filtered line items inside editor (supports All / Product / Service filter)
  const filteredStagedItems = useMemo(() => {
    if (!stagedTemplate) return [];
    return stagedTemplate.items.filter(it => {
      const isService =
        it.productType === 'Service' ||
        (it.category && it.category.toLowerCase().includes('service')) ||
        (it.pvcCode && it.pvcCode.toUpperCase().startsWith('SRV'));

      if (itemTypeFilter === 'PRODUCT' && isService) return false;
      if (itemTypeFilter === 'SERVICE' && !isService) return false;

      if (!itemSearchQuery.trim()) return true;
      const q = itemSearchQuery.toLowerCase().trim();
      return (
        it.name.toLowerCase().includes(q) ||
        it.description?.toLowerCase().includes(q) ||
        it.category?.toLowerCase().includes(q) ||
        it.pvcCode?.toLowerCase().includes(q)
      );
    });
  }, [stagedTemplate, itemSearchQuery, itemTypeFilter]);

  // Open single template in editor
  const handleOpenTemplateInEditor = (template: QuoteTemplate) => {
    setStagedTemplate({
      ...template,
      items: template.items.map(it => ({ ...it, id: it.id || crypto.randomUUID() })),
      terms: template.terms.map(tm => ({ ...tm })),
      paymentTiers: template.paymentTiers ? template.paymentTiers.map(pt => ({ ...pt })) : []
    });
    setHasUnsavedChanges(false);
    setPortalView('editor');
    setActiveEditorTab('items');
  };

  // Merge selected templates from cards view and open in editor
  const handleMergeAndOpenEditor = () => {
    const selected = templates.filter(t => selectedForMerge.has(t.id));
    if (selected.length === 0) return;

    if (selected.length === 1) {
      handleOpenTemplateInEditor(selected[0]);
      return;
    }

    // Merge items
    let mergedItems: BOQItem[] = [];
    selected.forEach((tmpl, tIdx) => {
      tmpl.items.forEach((it, iIdx) => {
        mergedItems.push({
          ...it,
          id: crypto.randomUUID(),
          no: `${tIdx + 1}.${iIdx + 1}`
        });
      });
    });

    // Merge unique terms
    const seenTitles = new Set<string>();
    const mergedTerms: Term[] = [];
    selected.forEach(tmpl => {
      tmpl.terms.forEach(tm => {
        if (!seenTitles.has(tm.title.toLowerCase().trim())) {
          seenTitles.add(tm.title.toLowerCase().trim());
          mergedTerms.push({ ...tm, id: crypto.randomUUID() });
        }
      });
    });

    // Primary template meta
    const primary = selected[0];
    const mergedNames = selected.map(t => t.name).join(' + ');

    const newMergedTemplate: QuoteTemplate = {
      id: crypto.randomUUID(),
      name: `Merged: ${selected.map(t => t.name).slice(0, 2).join(' + ')}${selected.length > 2 ? ` (+${selected.length - 2} more)` : ''}`,
      description: `Combined framework composed of ${selected.length} templates: ${mergedNames}.`,
      quoteType: primary.quoteType || 'Unit Rate',
      category: primary.category || 'Aluminium & Windows',
      validityDays: Math.max(...selected.map(t => t.validityDays || 30)),
      advancePercent: primary.advancePercent || 50,
      taxPercent: primary.taxPercent || 0,
      isTaxInclusive: primary.isTaxInclusive || false,
      estimatedDeliveryDays: Math.max(...selected.map(t => t.estimatedDeliveryDays || 21)),
      currency: primary.currency || 'LKR',
      items: mergedItems,
      terms: mergedTerms.length > 0 ? mergedTerms : DEFAULT_TERMS.slice(0, 10),
      paymentTiers: primary.paymentTiers ? primary.paymentTiers.map(pt => ({ ...pt })) : [],
      isCustom: true,
      tags: ['Merged', ...selected.flatMap(t => t.tags || [])].slice(0, 6),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setStagedTemplate(newMergedTemplate);
    setHasUnsavedChanges(true);
    setPortalView('editor');
    setActiveEditorTab('items');
    showNotice(`Merged ${selected.length} templates into editor with ${mergedItems.length} line items`, 'success');
  };

  // Toggle multi-select card checkbox
  const handleToggleCardSelect = (templateId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedForMerge(prev => {
      const next = new Set(prev);
      if (next.has(templateId)) next.delete(templateId);
      else next.add(templateId);
      return next;
    });
  };

  // Update staged template field
  const updateStaged = (updates: Partial<QuoteTemplate>) => {
    if (!stagedTemplate) return;
    setStagedTemplate(prev => prev ? ({ ...prev, ...updates }) : null);
    setHasUnsavedChanges(true);
  };

  // BOQ item updates in editor
  const handleUpdateItem = (index: number, updates: Partial<BOQItem>) => {
    if (!stagedTemplate) return;
    const nextItems = [...stagedTemplate.items];
    const current = nextItems[index];
    const updated = { ...current, ...updates };

    const qty = updated.qty ?? current.qty;
    const rate = updated.rate ?? current.rate;
    const disc = updated.discountPercent ?? current.discountPercent ?? 0;
    const subtotal = qty * rate;
    updated.amount = subtotal - (subtotal * (disc / 100));

    nextItems[index] = updated;
    updateStaged({ items: nextItems });
  };

  // Add new blank item in editor
  const handleAddBlankItem = (kind: 'product' | 'service' = 'product') => {
    if (!stagedTemplate) return;
    const isSvc = kind === 'service';
    const newItem: BOQItem = {
      id: crypto.randomUUID(),
      no: `${stagedTemplate.items.length + 1}`,
      pvcCode: isSvc ? `SRV-${100 + stagedTemplate.items.length}` : `PRD-${100 + stagedTemplate.items.length}`,
      name: isSvc ? 'New Site Installation / Engineering Service' : 'New Fabricated Architectural Product',
      description: isSvc
        ? 'Site mobilization, installation, alignment, silicone weather-sealing, and testing.'
        : 'Specification, profile series, glazing thickness, hardware, and finish details.',
      itemType: 'Main',
      productType: isSvc ? 'Service' : 'Product',
      category: isSvc ? 'Installation & Site Services' : 'Aluminium',
      unit: isSvc ? 'Lot' : 'sqft',
      qty: 1,
      rate: isSvc ? 35000 : 1850,
      costAtTimeOfQuote: isSvc ? 24000 : 1320,
      discountPercent: 0,
      amount: isSvc ? 35000 : 1850
    };
    updateStaged({ items: [...stagedTemplate.items, newItem] });
    showNotice(`Added new ${isSvc ? 'Service' : 'Product'} line item`, 'info');
  };

  // Delete item in editor
  const handleDeleteItem = (index: number) => {
    if (!stagedTemplate) return;
    const nextItems = stagedTemplate.items.filter((_, idx) => idx !== index);
    const reindexed = nextItems.map((it, idx) => ({ ...it, no: `${idx + 1}` }));
    updateStaged({ items: reindexed });
  };

  // Duplicate item in editor
  const handleDuplicateItem = (index: number) => {
    if (!stagedTemplate) return;
    const current = stagedTemplate.items[index];
    const clone: BOQItem = {
      ...current,
      id: crypto.randomUUID(),
      name: `${current.name} (Copy)`
    };
    const nextItems = [...stagedTemplate.items];
    nextItems.splice(index + 1, 0, clone);
    const reindexed = nextItems.map((it, idx) => ({ ...it, no: `${idx + 1}` }));
    updateStaged({ items: reindexed });
    showNotice('Item duplicated', 'info');
  };

  // Move item up / down
  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
    if (!stagedTemplate) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === stagedTemplate.items.length - 1) return;

    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const nextItems = [...stagedTemplate.items];
    const [moved] = nextItems.splice(index, 1);
    nextItems.splice(targetIdx, 0, moved);
    const reindexed = nextItems.map((it, idx) => ({ ...it, no: `${idx + 1}` }));
    updateStaged({ items: reindexed });
  };

  // Batch markup tool across all items
  const handleApplyMarkup = (percent: number) => {
    if (!stagedTemplate) return;
    const factor = 1 + (percent / 100);
    const updatedItems = stagedTemplate.items.map(it => {
      const newRate = Math.round(it.rate * factor);
      const subtotal = it.qty * newRate;
      const disc = subtotal * ((it.discountPercent || 0) / 100);
      return {
        ...it,
        rate: newRate,
        amount: subtotal - disc
      };
    });
    updateStaged({ items: updatedItems });
    showNotice(`Applied ${percent > 0 ? `+${percent}%` : `${percent}%`} rate adjustment across all items`, 'success');
  };

  // Terms toggle & edit in editor
  const handleToggleTerm = (index: number) => {
    if (!stagedTemplate) return;
    const nextTerms = [...stagedTemplate.terms];
    nextTerms[index] = { ...nextTerms[index], isActive: !nextTerms[index].isActive };
    updateStaged({ terms: nextTerms });
  };

  const handleUpdateTerm = (index: number, updates: Partial<Term>) => {
    if (!stagedTemplate) return;
    const nextTerms = [...stagedTemplate.terms];
    nextTerms[index] = { ...nextTerms[index], ...updates };
    updateStaged({ terms: nextTerms });
  };

  const handleAddCustomTerm = () => {
    if (!stagedTemplate) return;
    const newTerm: Term = {
      id: crypto.randomUUID(),
      no: `${stagedTemplate.terms.length + 1}`,
      title: 'Custom Contract Clause',
      content: 'Specific client conditions, site access stipulations, or project delivery notes.',
      isActive: true
    };
    updateStaged({ terms: [...stagedTemplate.terms, newTerm] });
  };

  // Merge another template into current editor
  const handleMergeFromModal = () => {
    if (!stagedTemplate) return;
    const selected = templates.filter(t => mergeModalSelection.has(t.id));
    if (selected.length === 0) {
      setIsMergeModalOpen(false);
      return;
    }

    let addedItemsCount = 0;
    let nextItems = [...stagedTemplate.items];

    if (mergeIncludeItems) {
      selected.forEach(tmpl => {
        tmpl.items.forEach(it => {
          nextItems.push({
            ...it,
            id: crypto.randomUUID(),
            no: `${nextItems.length + 1}`
          });
          addedItemsCount++;
        });
      });
    }

    let nextTerms = [...stagedTemplate.terms];
    if (mergeIncludeTerms) {
      const existingTitles = new Set(nextTerms.map(t => t.title.toLowerCase().trim()));
      selected.forEach(tmpl => {
        tmpl.terms.forEach(tm => {
          if (!existingTitles.has(tm.title.toLowerCase().trim())) {
            existingTitles.add(tm.title.toLowerCase().trim());
            nextTerms.push({ ...tm, id: crypto.randomUUID() });
          }
        });
      });
    }

    updateStaged({ items: nextItems, terms: nextTerms });
    setIsMergeModalOpen(false);
    setMergeModalSelection(new Set());
    showNotice(`Merged ${addedItemsCount} line items from ${selected.length} template(s)`, 'success');
  };

  // Insert BOQItem from Product Portal or Quick Inserting Portal
  const handleInsertBOQItemFromPortal = (boqItem: BOQItem) => {
    if (!stagedTemplate) return;
    const nextItem: BOQItem = {
      ...boqItem,
      id: boqItem.id || crypto.randomUUID(),
      no: `${stagedTemplate.items.length + 1}`
    };
    updateStaged({ items: [...stagedTemplate.items, nextItem] });
    showNotice(
      `Added ${nextItem.productType === 'Service' ? 'Service' : 'Product'} "${nextItem.name}" to Project Design`,
      'success'
    );
  };

  // Create new Project Design card from modal
  const handleCreateDesignFromModal = (newDesign: QuoteTemplate, openInStudio: boolean) => {
    if (onSaveTemplate) {
      onSaveTemplate(newDesign);
    }
    if (openInStudio) {
      handleOpenTemplateInEditor(newDesign);
      showNotice(`Created Project Design "${newDesign.name}" — now add Products & Services`, 'success');
    } else {
      showNotice(`Added Project Design "${newDesign.name}" to Design Hub`, 'success');
    }
  };

  // Quick upload image (<=1MB) or video (<=10MB) directly onto a Design Card
  const handleCardQuickMediaUpload = (template: QuoteTemplate, e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateDesignMediaFile(file);
    if (!validation.valid) {
      showNotice(validation.error || 'File exceeds size limit (1MB Image / 10MB Video).', 'warning');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = ev => {
      const result = ev.target?.result as string;
      const updated: QuoteTemplate = {
        ...template,
        mediaType: validation.mediaType || 'image',
        mediaUrl: result,
        mediaFileName: file.name,
        mediaFileSize: file.size,
        updatedAt: new Date().toISOString()
      };
      if (onSaveTemplate) {
        onSaveTemplate(updated);
      }
      if (stagedTemplate && stagedTemplate.id === template.id) {
        setStagedTemplate(updated);
      }
      showNotice(
        `Attached ${validation.mediaType === 'video' ? 'Video' : 'Image'} (${formatBytes(file.size)}) to "${template.name}"`,
        'success'
      );
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Save template to library
  const handleSaveToLibrary = () => {
    if (!stagedTemplate || !onSaveTemplate) return;
    const updated: QuoteTemplate = {
      ...stagedTemplate,
      updatedAt: new Date().toISOString()
    };
    onSaveTemplate(updated);
    setHasUnsavedChanges(false);
    showNotice(`Saved Project Design "${updated.name}" to Design Hub`, 'success');
  };

  // Save as new template in library
  const handleSaveAsNewTemplate = () => {
    if (!stagedTemplate || !onSaveTemplate) return;
    const newName = `${stagedTemplate.name} (Custom Design)`;
    const newTemplate: QuoteTemplate = {
      ...stagedTemplate,
      id: crypto.randomUUID(),
      designCode: `DSN-2026-${String(templates.length + 1).padStart(3, '0')}`,
      name: newName,
      isCustom: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    onSaveTemplate(newTemplate);
    setStagedTemplate(newTemplate);
    setHasUnsavedChanges(false);
    showNotice(`Saved new Project Design "${newName}" in Design Hub`, 'success');
  };

  // Open "Proceed to Quotation" or "Create Project" dialog
  const handleOpenProceedDialog = (mode: 'quote' | 'project' = 'quote') => {
    if (!stagedTemplate) return;
    setLaunchMode(mode);
    setProjectName(stagedTemplate.name.replace(/Template|Merged:/gi, '').trim() || 'Architectural Project');
    setWorkSiteLocation(currentQuote?.workSiteLocation || 'Colombo, Sri Lanka');
    const nextNum = companySettings?.nextQuoteNumber 
      ? `${companySettings.quoteNumberPrefix || 'QUAD-2026-'}${companySettings.nextQuoteNumber.toString().padStart(4, '0')}`
      : `QUAD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    setCustomQuoteNo(nextNum);
    setQuoteValidityDays(stagedTemplate.validityDays || 30);
    setAlsoSaveTemplateName(`${stagedTemplate.name} Preset`);
    setIsProceedModalOpen(true);
  };

  const createFallbackClient = (data: { name: string; tradeName?: string; phone: string; email: string; address: string; city: string }): Client => ({
    id: crypto.randomUUID(),
    category: data.tradeName ? CustomerCategory.COMPANY : CustomerCategory.INDIVIDUAL,
    name: data.name.trim() || 'Valued Client',
    tradeName: data.tradeName?.trim() || '',
    phone: data.phone.trim() || '+94 77 000 0000',
    address: [data.address, data.city].filter(Boolean).join(', ') || 'Colombo, Sri Lanka',
    email: data.email.trim() || '',
    status: 'Active',
    creditLimit: 0,
    paymentTerms: 'Payment on Milestones',
    currency: 'LKR',
    language: 'English',
    sinceDate: new Date().toISOString().split('T')[0],
    hasSpecialPricing: false,
    contactPersons: [],
    addresses: [],
    source: 'Direct',
    tier: 'Tier 1',
    isCommHidden: true,
    isTaxExempt: false
  });

  // Finalize Proceed to Quotation
  const handleConfirmProceedToQuotation = () => {
    if (!stagedTemplate) return;

    // 1. Resolve client
    let finalClient: Client;
    if (clientMode === 'existing') {
      const found = clients.find(c => c.id === selectedClientId) || clients[0];
      if (found) {
        finalClient = found;
      } else {
        finalClient = createFallbackClient(newClientData);
      }
    } else {
      const created: Client = createFallbackClient(newClientData);
      if (onSaveClient) {
        finalClient = onSaveClient(created);
      } else {
        finalClient = created;
      }
    }

    // 2. Optionally save as template to library
    if (alsoSaveAsTemplate && onSaveTemplate) {
      const templateToSave: QuoteTemplate = {
        ...stagedTemplate,
        id: crypto.randomUUID(),
        name: alsoSaveTemplateName.trim() || stagedTemplate.name,
        isCustom: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      onSaveTemplate(templateToSave);
    }

    // 3. Construct new quotation object
    const finalItems: BOQItem[] = stagedTemplate.items.map((it, idx) => ({
      ...it,
      id: crypto.randomUUID(),
      no: `${idx + 1}`
    }));

    const finalTerms: Term[] = stagedTemplate.terms.filter(t => t.isActive);

    const initialQuoteTotals = getQuoteTotalBreakdown({
      items: finalItems,
      taxPercent: stagedTemplate.taxPercent || 0,
      isTaxInclusive: stagedTemplate.isTaxInclusive || false,
      additionalCharges: stagedTemplate.additionalCharges || []
    } as any);

    const createdQuote: Quote = {
      id: crypto.randomUUID(),
      quoteNo: customQuoteNo.trim() || `QUAD-${Date.now()}`,
      client: finalClient,
      projectName: projectName.trim() || 'Architectural Fabrication Project',
      workSiteLocation: workSiteLocation.trim() || 'Client Site',
      submittedDate: new Date().toISOString().split('T')[0],
      validityDays: quoteValidityDays || 30,
      advancePercent: stagedTemplate.advancePercent || 50,
      taxPercent: stagedTemplate.taxPercent || 0,
      isTaxInclusive: stagedTemplate.isTaxInclusive || false,
      discountPercent: 0,
      estimatedDeliveryDays: stagedTemplate.estimatedDeliveryDays || 21,
      quoteType: stagedTemplate.quoteType || 'Unit Rate',
      pricingMethod: stagedTemplate.pricingMethod || 'Unit Rate',
      projectStage: stagedTemplate.projectStage || 'Detailed BOQ',
      scopeCoverage: stagedTemplate.scopeCoverage || 'Turnkey',
      currency: stagedTemplate.currency || 'LKR',
      status: QuoteStatus.DRAFT,
      items: finalItems,
      terms: finalTerms,
      paymentTiers: stagedTemplate.paymentTiers && stagedTemplate.paymentTiers.length > 0 
        ? stagedTemplate.paymentTiers.map(pt => ({
            ...pt,
            id: crypto.randomUUID(),
            amount: (initialQuoteTotals.grandTotal * (pt.percentage / 100)),
            status: 'Pending'
          }))
        : [
            { id: crypto.randomUUID(), phase: 'Advance Payment', percentage: stagedTemplate.advancePercent || 50, amount: (initialQuoteTotals.grandTotal * ((stagedTemplate.advancePercent || 50) / 100)), status: 'Pending' },
            { id: crypto.randomUUID(), phase: 'On Delivery to Site', percentage: 40, amount: (initialQuoteTotals.grandTotal * 0.4), status: 'Pending' },
            { id: crypto.randomUUID(), phase: 'Handover & Final Inspection', percentage: 10, amount: (initialQuoteTotals.grandTotal * 0.1), status: 'Pending' }
          ],
      additionalCharges: stagedTemplate.additionalCharges || [],
      version: 1,
      documentSettings: currentQuote?.documentSettings || {
        fontSize: 10,
        accentColor: '#f97316',
        showLogo: true,
        showBankDetails: true,
        showTimeline: true,
        showPaymentTiers: true,
        layoutType: 'Detailed'
      }
    };

    setIsProceedModalOpen(false);

    if (launchMode === 'project' && onCreateProjectFromDesign) {
      onCreateProjectFromDesign(createdQuote);
      return;
    }

    if (onProceedToQuotation) {
      onProceedToQuotation(createdQuote);
    } else {
      onSelectTemplate(stagedTemplate, {
        mode: 'replace',
        includeItems: true,
        includeTerms: true,
        includeMilestones: true,
        includeCommercial: true
      });
      onClose();
    }
  };

  // Export templates JSON
  const handleExportAllJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(templates, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `project_designs_hub_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showNotice('Exported all Project Designs JSON', 'info');
  };

  const handleExportTemplateJSON = (template: QuoteTemplate, e: React.MouseEvent) => {
    e.stopPropagation();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(template, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${template.name.toLowerCase().replace(/[^a-z0-9]/gi, '_')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showNotice(`Exported ${template.name}`, 'info');
  };

  // Import templates JSON
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onSaveTemplate) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          parsed.forEach((t: QuoteTemplate) => {
            onSaveTemplate({
              ...t,
              id: crypto.randomUUID(),
              isCustom: true
            });
          });
          showNotice(`Imported ${parsed.length} project designs successfully`, 'success');
        } else if (parsed && parsed.name && Array.isArray(parsed.items)) {
          onSaveTemplate({
            ...parsed,
            id: crypto.randomUUID(),
            isCustom: true
          });
          showNotice(`Imported "${parsed.name}" successfully`, 'success');
        }
      } catch (err) {
        showNotice('Invalid project design JSON file', 'warning');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-[120] bg-[#F8FAFC] flex flex-col w-screen h-screen overflow-hidden text-slate-800">
      
      {/* ========================================================================= */}
      {/* 1. TOP HEADER RIBBON: Project Design & Quotation Template Hub             */}
      {/* ========================================================================= */}
      <header className="bg-white border-b border-slate-200/80 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4 shrink-0 shadow-2xs">
        <div className="flex items-center gap-3 min-w-0">
          {portalView === 'editor' && (
            <button
              onClick={() => setPortalView('cards')}
              className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold shrink-0"
              title="Return to Design Hub Cards"
            >
              <ArrowLeft size={14} />
              <span className="hidden sm:inline">Design Hub</span>
            </button>
          )}

          <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 border border-orange-100">
            <Sliders size={16} />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-sm font-bold text-slate-900 tracking-tight whitespace-nowrap">
                {portalView === 'cards'
                  ? 'Project Design & Quotation Template Hub'
                  : (stagedTemplate?.name || 'Project Design Studio')}
              </h1>
              {portalView === 'cards' ? (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 hidden sm:inline-block">
                  {templates.length} Project Designs Available
                </span>
              ) : (
                <div className="flex items-center gap-1.5">
                  {stagedTemplate?.designCode && (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                      {stagedTemplate.designCode}
                    </span>
                  )}
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-orange-50 text-orange-700 border border-orange-200">
                    Design Studio & Calculator
                  </span>
                  {hasUnsavedChanges && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                      Unsaved
                    </span>
                  )}
                </div>
              )}
            </div>
            <p className="text-[11px] text-slate-500 font-normal truncate hidden md:block">
              {portalView === 'cards' 
                ? 'Categorize project designs with sub-categories, attach images (≤1MB) or videos (≤10MB), and build fully calculated templates.'
                : 'Add Product & Service items from the Product Portal or Quick Inserting Portal to build a fully calculated project design.'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {portalView === 'cards' ? (
            <>
              {/* Search Bar in Header for Cards */}
              <div className="relative w-48 sm:w-60 hidden sm:block">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                <input
                  type="text"
                  placeholder="Search designs, codes, items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-7 py-1.5 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-lg text-xs font-normal text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Manage Categories & Sub-Categories */}
              <button
                onClick={() => setIsCategoryManagerOpen(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 transition-colors shadow-2xs"
                title="Manage Design Categories & Sub-Categories"
              >
                <FolderTree size={13} className="text-orange-500" />
                <span className="hidden lg:inline">Categories & Sub-Categories</span>
              </button>

              {/* Add New Project Design Button */}
              <button
                onClick={() => setIsCreateDesignModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
              >
                <Plus size={14} />
                <span>+ Add Project Design</span>
              </button>

              {/* Import / Export JSON */}
              <label 
                className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 rounded-lg text-xs font-medium border border-slate-200 cursor-pointer transition-colors shadow-2xs"
                title="Import JSON Designs"
              >
                <Upload size={13} />
                <span>Import</span>
                <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
              </label>

              <button
                onClick={handleExportAllJSON}
                className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 rounded-lg text-xs font-medium border border-slate-200 transition-colors shadow-2xs"
                title="Export all designs to JSON"
              >
                <Download size={13} />
                <span>Export All</span>
              </button>
            </>
          ) : (
            <>
              {/* Editor Mode Header Actions */}
              <button
                onClick={() => {
                  setProductPortalInitialTab('PRODUCTS');
                  setIsProductPortalModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold border border-blue-200 transition-colors shadow-2xs"
                title="Add Product Items or Service Items from Product Portal"
              >
                <Package size={13} />
                <span className="hidden sm:inline">+ Product & Service Portal</span>
              </button>

              <button
                onClick={() => setActiveEditorTab('quick_insert')}
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors shadow-2xs",
                  activeEditorTab === 'quick_insert'
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200"
                )}
                title="Open Quick Inserting Portal (Dimensional Calculator & Variant Builder)"
              >
                <Zap size={13} />
                <span className="hidden sm:inline">Quick Inserting Portal</span>
              </button>

              <button
                onClick={() => setIsMergeModalOpen(true)}
                className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 transition-colors shadow-2xs"
                title="Merge items from another design into this one"
              >
                <Layers size={13} className="text-orange-500" />
                <span>Merge Design</span>
              </button>

              <button
                onClick={handleSaveToLibrary}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 transition-colors shadow-2xs"
                title="Save updates to this Project Design template"
              >
                <Save size={13} className="text-slate-500" />
                <span className="hidden md:inline">Save Design</span>
              </button>

              {currentQuote && (
                <button
                  onClick={() => {
                    if (!stagedTemplate) return;
                    onSelectTemplate(stagedTemplate, {
                      mode: 'replace',
                      includeItems: true,
                      includeTerms: true,
                      includeMilestones: true,
                      includeCommercial: true
                    });
                    onClose();
                  }}
                  className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all"
                  title="Apply this design directly to the active quotation"
                >
                  <Check size={13} />
                  <span>Use as Template</span>
                </button>
              )}

              {/* High-visibility Proceed to Quotation Button */}
              <button
                onClick={() => handleOpenProceedDialog('quote')}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-semibold transition-all shadow-xs"
                title="Create a new quote or project with customer details"
              >
                <span>Proceed to Quotation</span>
                <ArrowRight size={13} />
              </button>
            </>
          )}

          <div className="h-4 w-px bg-slate-200 mx-0.5" />

          {/* Close Studio Button */}
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            title="Close Portal (Esc)"
          >
            <X size={18} />
          </button>
        </div>
      </header>

      {/* Global Toast Alert */}
      <AnimatePresence>
        {notice && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className={cn(
              "px-5 py-2 text-xs font-medium flex items-center justify-between border-b shrink-0",
              notice.type === 'success' && "bg-emerald-50 text-emerald-800 border-emerald-200",
              notice.type === 'info' && "bg-sky-50 text-sky-800 border-sky-200",
              notice.type === 'warning' && "bg-amber-50 text-amber-800 border-amber-200"
            )}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-emerald-600" />
              <span>{notice.message}</span>
            </div>
            <button onClick={() => setNotice(null)} className="text-slate-400 hover:text-slate-600">
              <X size={12} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 2. MAIN BODY: VIEW SWITCHER (CARDS TILES VS FULL-SCREEN EDITOR)           */}
      {/* ========================================================================= */}
      {portalView === 'cards' ? (
        /* ----------------------------------------------------------------------- */
        /* CARDS / TILES VIEW: FULL SCREEN RESPONSIVE GRID                         */
        /* ----------------------------------------------------------------------- */
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Subheader Row 1: Main Categories & Sort Controls */}
          <div className="bg-white border-b border-slate-200/80 px-4 sm:px-6 py-2.5 flex flex-col gap-2 shrink-0">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Main Category Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar text-xs">
                {categoryFilterPills.map(cat => (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat);
                      setSelectedSubCategory('All');
                    }}
                    className={cn(
                      "px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all border",
                      selectedCategory === cat 
                        ? "bg-slate-900 text-white border-slate-900 shadow-2xs font-semibold" 
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    )}
                  >
                    {cat}
                  </button>
                ))}
                <button
                  onClick={() => setIsCategoryManagerOpen(true)}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap border border-dashed border-orange-300 text-orange-600 hover:bg-orange-50 transition-colors"
                  title="Add or edit Main Categories and Sub-Categories"
                >
                  + Category / Sub-Category
                </button>
              </div>

              {/* Design Count & Sort */}
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="font-medium text-slate-700">
                  {filteredTemplates.length} {filteredTemplates.length === 1 ? 'design' : 'designs'}
                </span>

                <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
                  <span className="text-[11px] text-slate-400">Sort:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-transparent text-slate-700 font-semibold border-0 p-0 text-xs cursor-pointer focus:ring-0"
                  >
                    <option value="name">Name (A-Z)</option>
                    <option value="items">Most Items</option>
                    <option value="value">Highest Total</option>
                    <option value="recent">Recently Updated</option>
                  </select>
                </div>

                {selectedForMerge.size > 0 && (
                  <button
                    onClick={() => setSelectedForMerge(new Set())}
                    className="text-xs text-orange-600 hover:underline font-semibold"
                  >
                    Clear Selection ({selectedForMerge.size})
                  </button>
                )}
              </div>
            </div>

            {/* Subheader Row 2: Sub-Categories Bar (when a Main Category is selected) */}
            {subCategoriesForSelectedMain.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pt-1 border-t border-slate-100 no-scrollbar text-[11px]">
                <span className="font-bold text-slate-400 uppercase tracking-wider mr-1">
                  Sub-Categories:
                </span>
                <button
                  onClick={() => setSelectedSubCategory('All')}
                  className={cn(
                    "px-2.5 py-0.5 rounded-md font-semibold border transition-colors",
                    selectedSubCategory === 'All'
                      ? "bg-orange-500 text-white border-orange-500"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  )}
                >
                  All {selectedCategory}
                </button>
                {subCategoriesForSelectedMain.map(sub => (
                  <button
                    key={sub}
                    onClick={() => setSelectedSubCategory(sub)}
                    className={cn(
                      "px-2.5 py-0.5 rounded-md font-semibold border whitespace-nowrap transition-colors",
                      selectedSubCategory === sub
                        ? "bg-orange-500 text-white border-orange-500"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    )}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Cards Grid */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {filteredTemplates.length === 0 ? (
              <div className="max-w-md mx-auto text-center py-16 space-y-3 bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
                <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <FileText size={22} />
                </div>
                <h4 className="text-sm font-bold text-slate-800">No matching project designs found</h4>
                <p className="text-xs text-slate-500">
                  Try adjusting your search criteria, category/sub-category filter, or create a new project design.
                </p>
                <div className="flex items-center justify-center gap-2 pt-1">
                  <button
                    onClick={() => { setSearchQuery(''); setSelectedCategory('All'); setSelectedSubCategory('All'); }}
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                  >
                    Reset Filters
                  </button>
                  <button
                    onClick={() => setIsCreateDesignModalOpen(true)}
                    className="px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-semibold transition-colors"
                  >
                    + Add Project Design
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredTemplates.map((template) => {
                  const isChecked = selectedForMerge.has(template.id);
                  const cardBreakdown = calculateDesignBreakdown(template);

                  return (
                    <div
                      key={template.id}
                      onClick={() => handleOpenTemplateInEditor(template)}
                      className={cn(
                        "group bg-white rounded-xl border transition-all cursor-pointer flex flex-col justify-between overflow-hidden shadow-2xs hover:shadow-md",
                        isChecked 
                          ? "border-orange-500 ring-2 ring-orange-500/20 bg-orange-50/15" 
                          : "border-slate-200 hover:border-slate-300"
                      )}
                    >
                      <div>
                        {/* Card Visual Media Preview (Image <= 1MB / Video <= 10MB) */}
                        <div className="h-36 bg-slate-900 relative overflow-hidden border-b border-slate-100">
                          {template.mediaUrl ? (
                            template.mediaType === 'video' ? (
                              <video
                                src={template.mediaUrl}
                                muted
                                loop
                                playsInline
                                onMouseEnter={e => e.currentTarget.play().catch(() => {})}
                                onMouseLeave={e => {
                                  e.currentTarget.pause();
                                  e.currentTarget.currentTime = 0;
                                }}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <img
                                src={template.mediaUrl}
                                alt={template.name}
                                className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                              />
                            )
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-gradient-to-br from-slate-900 to-slate-800 p-4 text-center">
                              <ImageIcon size={20} className="text-slate-500 mb-1" />
                              <span className="text-[10px] font-semibold text-slate-300">No Media Attached</span>
                              <span className="text-[9px] text-slate-400">Image ≤ 1MB • Video ≤ 10MB</span>
                            </div>
                          )}

                          {/* Top-Left Overlay: Multi-Select Checkbox + Pricing Type */}
                          <div
                            onClick={(e) => handleToggleCardSelect(template.id, e)}
                            className="absolute top-2.5 left-2.5 flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-xs px-2 py-1 rounded-md border border-white/15"
                            title="Select to merge multiple project designs"
                          >
                            <button
                              type="button"
                              className={cn(
                                "w-4 h-4 rounded flex items-center justify-center border transition-all",
                                isChecked 
                                  ? "bg-orange-500 border-orange-500 text-white" 
                                  : "bg-white/90 border-slate-300 text-transparent"
                              )}
                            >
                              <Check size={10} strokeWidth={3} />
                            </button>
                            <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                              {template.quoteType || 'Unit Rate'}
                            </span>
                          </div>

                          {/* Top-Right Overlay: Media Type Badge & Quick Upload Trigger */}
                          <div
                            className="absolute top-2.5 right-2.5 flex items-center gap-1"
                            onClick={e => e.stopPropagation()}
                          >
                            {template.mediaUrl && (
                              <span className="px-1.5 py-0.5 rounded bg-slate-900/80 text-white text-[9px] font-mono font-semibold uppercase flex items-center gap-1">
                                {template.mediaType === 'video' ? <Video size={10} className="text-sky-400" /> : <ImageIcon size={10} className="text-emerald-400" />}
                                <span>{formatBytes(template.mediaFileSize || 165000)}</span>
                              </span>
                            )}
                            <label
                              className="p-1.5 rounded bg-slate-900/80 hover:bg-orange-500 text-white cursor-pointer transition-colors"
                              title="Upload Cover Image (max 1MB) or Video (max 10MB)"
                            >
                              <Upload size={11} />
                              <input
                                type="file"
                                accept="image/*,video/*"
                                onChange={e => handleCardQuickMediaUpload(template, e)}
                                className="hidden"
                              />
                            </label>
                          </div>

                          {/* Bottom-Left Overlay: Design Code & Area */}
                          <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between gap-1 pointer-events-none">
                            {template.designCode && (
                              <span className="px-1.5 py-0.5 rounded bg-slate-900/85 text-amber-300 font-mono text-[9px] font-bold">
                                {template.designCode}
                              </span>
                            )}
                            {template.designSpecs?.totalAreaSqft ? (
                              <span className="px-1.5 py-0.5 rounded bg-slate-900/85 text-slate-200 font-mono text-[9px] font-semibold">
                                {template.designSpecs.totalAreaSqft} sqft
                              </span>
                            ) : null}
                          </div>
                        </div>

                        {/* Card Content Body */}
                        <div className="p-4 space-y-2.5">
                          {/* Title & Quick Export/Delete */}
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-sm font-bold text-slate-900 leading-snug group-hover:text-orange-600 transition-colors line-clamp-1">
                              {template.name}
                            </h3>
                            <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                              <button
                                onClick={(e) => handleExportTemplateJSON(template, e)}
                                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                                title="Export Design JSON"
                              >
                                <Download size={12} />
                              </button>
                              {template.isCustom && onDeleteTemplate && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (window.confirm(`Delete project design "${template.name}"?`)) {
                                      onDeleteTemplate(template.id);
                                      showNotice('Project design deleted', 'info');
                                    }
                                  }}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                                  title="Delete Design"
                                >
                                  <Trash2 size={12} />
                                </button>
                              )}
                            </div>
                          </div>

                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                            {template.description || 'Complete architectural project design with calculated products, services, and contract terms.'}
                          </p>

                          {/* Category & Sub-Category Chips */}
                          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                            {template.category && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                                {template.category}
                              </span>
                            )}
                            {template.subCategory && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-orange-50 text-orange-700 border border-orange-200">
                                {template.subCategory}
                              </span>
                            )}
                            {template.advancePercent ? (
                              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-slate-50 text-slate-500 border border-slate-200">
                                {template.advancePercent}% Adv
                              </span>
                            ) : null}
                          </div>

                          {/* Products & Services Count Pill Bar */}
                          <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px]">
                            <div className="px-2 py-1 rounded-md bg-blue-50/70 border border-blue-100 text-blue-800 flex items-center justify-between font-semibold">
                              <span className="flex items-center gap-1">
                                <Package size={10} className="text-blue-600" />
                                <span>{cardBreakdown.productsCount} Products</span>
                              </span>
                              <span className="font-mono">
                                {(cardBreakdown.productsGross / 1000).toFixed(0)}k
                              </span>
                            </div>
                            <div className="px-2 py-1 rounded-md bg-emerald-50/70 border border-emerald-100 text-emerald-800 flex items-center justify-between font-semibold">
                              <span className="flex items-center gap-1">
                                <Wrench size={10} className="text-emerald-600" />
                                <span>{cardBreakdown.servicesCount} Services</span>
                              </span>
                              <span className="font-mono">
                                {(cardBreakdown.servicesGross / 1000).toFixed(0)}k
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Card Footer: Calculated Project Total & Open Design Studio */}
                      <div className="px-4 py-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-slate-400">Calculated Total</span>
                            <span className="text-[9px] font-mono font-bold px-1 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {cardBreakdown.estimatedMarginPercent.toFixed(0)}% Margin
                            </span>
                          </div>
                          <span className="font-mono font-bold text-slate-900">
                            {template.currency || 'LKR'} {cardBreakdown.grandTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold group-hover:border-orange-300 group-hover:text-orange-600 transition-colors shadow-2xs">
                            <span>Open Design</span>
                            <ArrowRight size={11} />
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Floating Merge Action Bar (when 1 or more templates selected) */}
          <AnimatePresence>
            {selectedForMerge.size > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="bg-white border-t border-slate-200 px-6 py-3 shadow-lg flex items-center justify-between gap-4 shrink-0"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center font-bold text-xs">
                    {mergeSummary.count}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      {mergeSummary.count} {mergeSummary.count === 1 ? 'Template Selected' : 'Templates Selected for Merging'}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Total {mergeSummary.itemsCount} line items • Estimated value LKR {mergeSummary.totalEst.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setSelectedForMerge(new Set())}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg transition-colors"
                  >
                    Deselect All
                  </button>

                  <button
                    onClick={handleMergeAndOpenEditor}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                  >
                    <Layers size={14} />
                    <span>{mergeSummary.count > 1 ? `Merge & Open Editor (${mergeSummary.count})` : 'Open in Editor'}</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        /* ----------------------------------------------------------------------- */
        /* FULL-SCREEN DESIGN STUDIO & CALCULATED PROJECT TEMPLATE EDITOR          */
        /* ----------------------------------------------------------------------- */
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
          {stagedTemplate && (
            <>
              {/* Top Project Design Summary & Financial Calculation Strip */}
              <div className="bg-slate-900 text-white px-4 sm:px-6 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Thumbnail Preview */}
                  <div
                    onClick={() => setActiveEditorTab('media_specs')}
                    className="w-14 h-10 rounded-lg bg-slate-800 border border-slate-700 overflow-hidden shrink-0 cursor-pointer relative group"
                    title="Click to manage Design Image (max 1MB) or Video (max 10MB)"
                  >
                    {stagedTemplate.mediaUrl ? (
                      stagedTemplate.mediaType === 'video' ? (
                        <video src={stagedTemplate.mediaUrl} className="w-full h-full object-cover" muted />
                      ) : (
                        <img src={stagedTemplate.mediaUrl} alt={stagedTemplate.name} className="w-full h-full object-cover" />
                      )
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <ImageIcon size={14} />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Upload size={11} className="text-white" />
                    </div>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {stagedTemplate.designCode && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30 font-mono text-[10px] font-bold">
                          {stagedTemplate.designCode}
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 text-[10px] font-semibold border border-slate-700">
                        {stagedTemplate.category || 'Uncategorized'}
                      </span>
                      {stagedTemplate.subCategory && (
                        <span className="px-2 py-0.5 rounded bg-orange-500/20 text-orange-300 text-[10px] font-semibold border border-orange-400/30">
                          {stagedTemplate.subCategory}
                        </span>
                      )}
                      {stagedTemplate.designSpecs?.totalAreaSqft ? (
                        <span className="text-[10px] font-mono text-slate-400">
                          • {stagedTemplate.designSpecs.totalAreaSqft} sqft ({stagedTemplate.currency || 'LKR'} {Math.round(stagedCalculations.ratePerSqft).toLocaleString()}/sqft)
                        </span>
                      ) : null}
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5 max-w-xl">
                      {stagedTemplate.description || 'Complete calculated project design template with product and service items.'}
                    </p>
                  </div>
                </div>

                {/* Live Financial Calculation Breakdown Pills */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
                  <div className="px-2.5 py-1 rounded-lg bg-blue-500/15 border border-blue-400/25 text-blue-200">
                    <span className="text-[9px] uppercase tracking-wider text-blue-300 block">Products ({stagedCalculations.productsCount})</span>
                    <span className="font-mono font-bold text-xs text-white">
                      LKR {stagedCalculations.productsGross.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>

                  <div className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-400/25 text-emerald-200">
                    <span className="text-[9px] uppercase tracking-wider text-emerald-300 block">Services ({stagedCalculations.servicesCount})</span>
                    <span className="font-mono font-bold text-xs text-white">
                      LKR {stagedCalculations.servicesGross.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>

                  {stagedCalculations.chargesTotal > 0 && (
                    <div className="px-2.5 py-1 rounded-lg bg-purple-500/15 border border-purple-400/25 text-purple-200">
                      <span className="text-[9px] uppercase tracking-wider text-purple-300 block">Site Charges</span>
                      <span className="font-mono font-bold text-xs text-white">
                        LKR {stagedCalculations.chargesTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  )}

                  <div className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-400/25 text-amber-200">
                    <span className="text-[9px] uppercase tracking-wider text-amber-300 block">Est. Profit ({stagedCalculations.estimatedMarginPercent.toFixed(1)}%)</span>
                    <span className="font-mono font-bold text-xs text-amber-300">
                      LKR {stagedCalculations.estimatedProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>

                  <div className="px-3 py-1 rounded-lg bg-orange-500 text-white shadow-xs">
                    <span className="text-[9px] uppercase tracking-wider text-orange-100 block">Calculated Project Total</span>
                    <span className="font-mono font-bold text-sm">
                      {stagedTemplate.currency || 'LKR'} {stagedCalculations.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Editor Secondary Control Bar */}
              <div className="bg-slate-50/80 border-b border-slate-200 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
                {/* Left: Workspace Tabs */}
                <div className="flex items-center gap-1 flex-wrap">
                  <button
                    onClick={() => setActiveEditorTab('items')}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5",
                      activeEditorTab === 'items' 
                        ? "bg-white text-slate-900 border border-slate-200 shadow-2xs" 
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                    )}
                  >
                    <Calculator size={13} className="text-orange-500" />
                    <span>Products & Services BOQ ({stagedTemplate.items.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveEditorTab('quick_insert')}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5",
                      activeEditorTab === 'quick_insert' 
                        ? "bg-orange-500 text-white border border-orange-600 shadow-2xs" 
                        : "text-orange-700 bg-orange-50/70 hover:bg-orange-100 border border-orange-200/70"
                    )}
                  >
                    <Sparkles size={13} />
                    <span>Quick Inserting Portal</span>
                  </button>

                  <button
                    onClick={() => setActiveEditorTab('media_specs')}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5",
                      activeEditorTab === 'media_specs' 
                        ? "bg-white text-slate-900 border border-slate-200 shadow-2xs" 
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                    )}
                  >
                    <Film size={13} className="text-sky-500" />
                    <span>Design Media (Img/Video) & Categories</span>
                  </button>

                  <button
                    onClick={() => setActiveEditorTab('commercial')}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5",
                      activeEditorTab === 'commercial' 
                        ? "bg-white text-slate-900 border border-slate-200 shadow-2xs" 
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                    )}
                  >
                    <DollarSign size={13} className="text-purple-500" />
                    <span>Commercial & Milestones</span>
                  </button>

                  <button
                    onClick={() => setActiveEditorTab('terms')}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5",
                      activeEditorTab === 'terms' 
                        ? "bg-white text-slate-900 border border-slate-200 shadow-2xs" 
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                    )}
                  >
                    <FileText size={13} className="text-blue-500" />
                    <span>Terms ({stagedTemplate.terms.filter(t => t.isActive).length}/{stagedTemplate.terms.length})</span>
                  </button>
                </div>

                {/* Right: Portal Insertion & Rate Adjustment Controls */}
                <div className="flex items-center gap-2 text-xs">
                  <button
                    onClick={() => {
                      setProductPortalInitialTab('PRODUCTS');
                      setIsProductPortalModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-2xs transition-colors"
                  >
                    <Package size={12} />
                    <span>+ Product Portal</span>
                  </button>

                  <button
                    onClick={() => {
                      setProductPortalInitialTab('SERVICES');
                      setIsProductPortalModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-colors"
                  >
                    <Wrench size={12} />
                    <span>+ Service Items</span>
                  </button>

                  <button
                    onClick={() => setShowMarkupTool(!showMarkupTool)}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors",
                      showMarkupTool 
                        ? "bg-orange-50 text-orange-700 border-orange-200" 
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    )}
                    title="Batch adjust rates by percentage"
                  >
                    <Percent size={12} />
                    <span>Rate Markup</span>
                  </button>
                </div>
              </div>

              {/* Expandable Batch Price Markup Strip */}
              <AnimatePresence>
                {showMarkupTool && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="bg-orange-50/40 border-b border-orange-100 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs overflow-hidden shrink-0"
                  >
                    <div className="flex items-center gap-2">
                      <Percent size={14} className="text-orange-600" />
                      <span className="font-semibold text-orange-900">Batch Rate Adjustment:</span>
                      <span className="text-slate-600">Quickly adjust rates across all product and service line items:</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {[-10, -5, 5, 10, 15, 20].map((pct) => (
                        <button
                          key={pct}
                          onClick={() => handleApplyMarkup(pct)}
                          className="px-2.5 py-1 bg-white hover:bg-orange-100/60 border border-orange-200 text-orange-800 rounded font-semibold text-xs transition-colors"
                        >
                          {pct > 0 ? `+${pct}%` : `${pct}%`}
                        </button>
                      ))}

                      <div className="flex items-center gap-1 ml-2">
                        <input
                          type="number"
                          value={markupPercent}
                          onChange={(e) => setMarkupPercent(parseFloat(e.target.value) || 0)}
                          className="w-16 px-2 py-0.5 bg-white border border-orange-200 rounded text-xs font-semibold text-center"
                        />
                        <button
                          onClick={() => handleApplyMarkup(markupPercent)}
                          className="px-2.5 py-1 bg-orange-500 hover:bg-orange-600 text-white rounded text-xs font-semibold"
                        >
                          Apply Custom
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Workspace Content Tabs */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                {/* TAB 1: PRODUCTS & SERVICES BOQ + PROJECT CALCULATION */}
                {activeEditorTab === 'items' && (
                  <div className="space-y-4 w-full">
                    {/* Items Toolbar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="relative w-60">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                          <input
                            type="text"
                            placeholder="Filter products & services..."
                            value={itemSearchQuery}
                            onChange={(e) => setItemSearchQuery(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                          />
                        </div>

                        {/* All / Products / Services Filter Pills */}
                        <div className="flex items-center bg-white p-0.5 rounded-lg border border-slate-200">
                          <button
                            onClick={() => setItemTypeFilter('ALL')}
                            className={cn(
                              "px-2.5 py-1 rounded-md text-xs font-semibold transition-all",
                              itemTypeFilter === 'ALL' ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"
                            )}
                          >
                            All ({stagedTemplate.items.length})
                          </button>
                          <button
                            onClick={() => setItemTypeFilter('PRODUCT')}
                            className={cn(
                              "px-2.5 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1",
                              itemTypeFilter === 'PRODUCT' ? "bg-blue-600 text-white" : "text-blue-700 hover:bg-blue-50"
                            )}
                          >
                            <Package size={11} />
                            <span>Products ({stagedCalculations.productsCount})</span>
                          </button>
                          <button
                            onClick={() => setItemTypeFilter('SERVICE')}
                            className={cn(
                              "px-2.5 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1",
                              itemTypeFilter === 'SERVICE' ? "bg-emerald-600 text-white" : "text-emerald-700 hover:bg-emerald-50"
                            )}
                          >
                            <Wrench size={11} />
                            <span>Services ({stagedCalculations.servicesCount})</span>
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => handleAddBlankItem('product')}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold transition-colors"
                        >
                          <Plus size={12} />
                          <span>Blank Product</span>
                        </button>

                        <button
                          onClick={() => handleAddBlankItem('service')}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors"
                        >
                          <Plus size={12} />
                          <span>Blank Service</span>
                        </button>

                        <button
                          onClick={() => {
                            setProductPortalInitialTab('PRODUCTS');
                            setIsProductPortalModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs"
                        >
                          <Store size={13} />
                          <span>Insert from Product Portal</span>
                        </button>

                        <button
                          onClick={() => setActiveEditorTab('quick_insert')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs"
                        >
                          <Sparkles size={13} />
                          <span>Open Quick Inserting Portal</span>
                        </button>

                        <button
                          onClick={() => setIsMergeModalOpen(true)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition-colors"
                        >
                          <Layers size={12} />
                          <span>Merge Design</span>
                        </button>
                      </div>
                    </div>

                    {/* BOQ Line Items Table */}
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                              <th className="py-2.5 px-3 w-12 text-center">No</th>
                              <th className="py-2.5 px-2 w-24">Type</th>
                              <th className="py-2.5 px-3 min-w-[250px]">Product / Service Description & Specs</th>
                              <th className="py-2.5 px-2 w-28">Category</th>
                              <th className="py-2.5 px-2 w-20">Unit</th>
                              <th className="py-2.5 px-2 w-20 text-right">Qty</th>
                              <th className="py-2.5 px-2 w-28 text-right">Est. Cost</th>
                              <th className="py-2.5 px-2 w-28 text-right">Unit Rate</th>
                              <th className="py-2.5 px-2 w-16 text-right">Disc %</th>
                              <th className="py-2.5 px-3 w-32 text-right">Amount ({stagedTemplate.currency || 'LKR'})</th>
                              <th className="py-2.5 px-2 w-24 text-center">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {filteredStagedItems.length === 0 ? (
                              <tr>
                                <td colSpan={11} className="py-10 text-center text-slate-400 text-xs">
                                  No items in this filter. Click "Insert from Product Portal" or "Open Quick Inserting Portal" to add products and services.
                                </td>
                              </tr>
                            ) : (
                              filteredStagedItems.map((item, idx) => {
                                const realIndex = stagedTemplate.items.findIndex(it => it.id === item.id);
                                const isSvc = isServiceBOQItem(item);
                                const unitCost = item.costAtTimeOfQuote !== undefined ? item.costAtTimeOfQuote : Math.round(item.rate * 0.72);
                                const lineMarginPct = item.rate > 0 ? Math.round(((item.rate - unitCost) / item.rate) * 100) : 0;

                                return (
                                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors group">
                                    {/* Numbering */}
                                    <td className="py-2 px-3 text-center font-mono font-bold text-slate-500">
                                      {item.no || `${idx + 1}`}
                                    </td>

                                    {/* Product vs Service Type Selector */}
                                    <td className="py-2 px-2">
                                      <select
                                        value={isSvc ? 'service' : 'product'}
                                        onChange={(e) => {
                                          const nextType = e.target.value;
                                          handleUpdateItem(realIndex, {
                                            productType: nextType === 'service' ? 'Service' : 'Product',
                                            category: nextType === 'service' && !item.category?.toLowerCase().includes('service')
                                              ? 'Installation & Site Services'
                                              : item.category
                                          });
                                        }}
                                        className={cn(
                                          "w-full rounded-md px-1.5 py-1 text-[10px] font-bold uppercase border",
                                          isSvc
                                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                            : "bg-blue-50 text-blue-700 border-blue-200"
                                        )}
                                      >
                                        <option value="product">Product</option>
                                        <option value="service">Service</option>
                                      </select>
                                    </td>

                                    {/* Name & Specs */}
                                    <td className="py-2 px-3 space-y-1">
                                      <div className="flex items-center gap-1.5">
                                        {item.pvcCode && (
                                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[9px] font-bold shrink-0">
                                            {item.pvcCode}
                                          </span>
                                        )}
                                        <input
                                          type="text"
                                          value={item.name}
                                          onChange={(e) => handleUpdateItem(realIndex, { name: e.target.value })}
                                          className="w-full font-semibold text-slate-900 bg-transparent border-0 focus:bg-slate-100/70 rounded px-1 py-0.5 text-xs outline-none focus:ring-1 focus:ring-orange-500"
                                          placeholder="Product or Service Title..."
                                        />
                                      </div>
                                      <input
                                        type="text"
                                        value={item.description || ''}
                                        onChange={(e) => handleUpdateItem(realIndex, { description: e.target.value })}
                                        className="w-full text-[11px] text-slate-500 bg-transparent border-0 focus:bg-slate-100/70 rounded px-1 py-0.5 outline-none focus:ring-1 focus:ring-orange-500"
                                        placeholder="Technical specifications, alloy/temper, glass thickness, service scope..."
                                      />
                                    </td>

                                    {/* Category */}
                                    <td className="py-2 px-2">
                                      <input
                                        type="text"
                                        value={item.category || ''}
                                        onChange={(e) => handleUpdateItem(realIndex, { category: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-[11px] font-medium text-slate-700"
                                        placeholder="Category"
                                      />
                                    </td>

                                    {/* Unit */}
                                    <td className="py-2 px-2">
                                      <select
                                        value={item.unit || 'sqft'}
                                        onChange={(e) => handleUpdateItem(realIndex, { unit: e.target.value as any })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-[11px] font-medium text-slate-700"
                                      >
                                        <option value="sqft">sqft</option>
                                        <option value="ft">ft</option>
                                        <option value="Nos">Nos</option>
                                        <option value="Set">Set</option>
                                        <option value="Lot">Lot</option>
                                        <option value="Item">Item</option>
                                        <option value="Day">Day</option>
                                        <option value="Trip">Trip</option>
                                        <option value="kg">kg</option>
                                        <option value="m">m</option>
                                        <option value="sqm">sqm</option>
                                      </select>
                                    </td>

                                    {/* Quantity */}
                                    <td className="py-2 px-2 text-right">
                                      <input
                                        type="number"
                                        min={0}
                                        step="any"
                                        value={item.qty}
                                        onChange={(e) => handleUpdateItem(realIndex, { qty: parseFloat(e.target.value) || 0 })}
                                        className="w-16 text-right bg-slate-50 border border-slate-200 rounded px-1.5 py-1 font-mono font-semibold text-slate-800"
                                      />
                                    </td>

                                    {/* Estimated Unit Cost + Margin Pill */}
                                    <td className="py-2 px-2 text-right">
                                      <div className="flex flex-col items-end gap-0.5">
                                        <input
                                          type="number"
                                          min={0}
                                          step="any"
                                          value={unitCost}
                                          onChange={(e) => handleUpdateItem(realIndex, { costAtTimeOfQuote: parseFloat(e.target.value) || 0 })}
                                          className="w-24 text-right bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 font-mono text-[11px] text-slate-600"
                                          title="Estimated Unit Cost"
                                        />
                                        <span className={cn(
                                          "text-[9px] font-mono font-bold px-1 rounded",
                                          lineMarginPct >= 20 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                                        )}>
                                          {lineMarginPct}% Margin
                                        </span>
                                      </div>
                                    </td>

                                    {/* Selling Unit Rate */}
                                    <td className="py-2 px-2 text-right">
                                      <input
                                        type="number"
                                        min={0}
                                        step="any"
                                        value={item.rate}
                                        onChange={(e) => handleUpdateItem(realIndex, { rate: parseFloat(e.target.value) || 0 })}
                                        className="w-24 text-right bg-slate-50 border border-slate-200 rounded px-1.5 py-1 font-mono font-semibold text-slate-900"
                                      />
                                    </td>

                                    {/* Discount */}
                                    <td className="py-2 px-2 text-right">
                                      <input
                                        type="number"
                                        min={0}
                                        max={100}
                                        value={item.discountPercent || 0}
                                        onChange={(e) => handleUpdateItem(realIndex, { discountPercent: parseFloat(e.target.value) || 0 })}
                                        className="w-14 text-right bg-slate-50 border border-slate-200 rounded px-1 py-1 font-mono text-slate-700"
                                      />
                                    </td>

                                    {/* Amount */}
                                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                                      {(item.amount || (item.qty * item.rate)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>

                                    {/* Actions */}
                                    <td className="py-2 px-2 text-center">
                                      <div className="flex items-center justify-center gap-0.5">
                                        <button
                                          onClick={() => handleMoveItem(realIndex, 'up')}
                                          disabled={realIndex === 0}
                                          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded"
                                          title="Move Up"
                                        >
                                          <MoveUp size={12} />
                                        </button>
                                        <button
                                          onClick={() => handleMoveItem(realIndex, 'down')}
                                          disabled={realIndex === stagedTemplate.items.length - 1}
                                          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded"
                                          title="Move Down"
                                        >
                                          <MoveDown size={12} />
                                        </button>
                                        <button
                                          onClick={() => handleDuplicateItem(realIndex)}
                                          className="p-1 text-slate-400 hover:text-slate-700 rounded"
                                          title="Duplicate"
                                        >
                                          <Copy size={12} />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteItem(realIndex)}
                                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                                          title="Delete"
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

                      {/* Complete Project Costing & Additional Charges Breakdown Panel */}
                      <div className="bg-slate-50/90 p-4 sm:p-5 border-t border-slate-200 grid grid-cols-1 lg:grid-cols-12 gap-5">
                        {/* Left 7 Cols: Additional Project Site Charges (Transport, Scaffolding, Hoisting, Submittals) */}
                        <div className="lg:col-span-7 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                <Wrench size={13} className="text-orange-500" />
                                <span>Additional Project Site Charges &Preliminaries</span>
                              </h4>
                              <p className="text-[11px] text-slate-500">
                                Add site mobilization, crane hoisting, scaffolding, or structural calculation charges to complete the project calculation.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const current = stagedTemplate.additionalCharges || [];
                                updateStaged({
                                  additionalCharges: [
                                    ...current,
                                    {
                                      id: crypto.randomUUID(),
                                      name: 'Site Transport & Crane Hoisting',
                                      amount: 45000
                                    }
                                  ]
                                });
                              }}
                              className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-2xs"
                            >
                              + Add Site Charge
                            </button>
                          </div>

                          {(stagedTemplate.additionalCharges || []).length === 0 ? (
                            <div className="p-3 rounded-lg border border-dashed border-slate-200 text-[11px] text-slate-400 text-center">
                              No additional site charges configured. Click "+ Add Site Charge" to include transport, scaffolding, or engineering fees.
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              {(stagedTemplate.additionalCharges || []).map((charge, cIdx) => (
                                <div key={charge.id || cIdx} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 text-xs">
                                  <input
                                    type="text"
                                    value={charge.name}
                                    onChange={e => {
                                      const next = [...(stagedTemplate.additionalCharges || [])];
                                      next[cIdx] = { ...next[cIdx], name: e.target.value };
                                      updateStaged({ additionalCharges: next });
                                    }}
                                    className="flex-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-medium"
                                    placeholder="Charge description..."
                                  />
                                  <span className="text-[11px] text-slate-500 font-mono">
                                    {stagedTemplate.currency || 'LKR'}
                                  </span>
                                  <input
                                    type="number"
                                    value={charge.amount}
                                    onChange={e => {
                                      const val = parseFloat(e.target.value) || 0;
                                      const next = [...(stagedTemplate.additionalCharges || [])];
                                      next[cIdx] = { ...next[cIdx], amount: val };
                                      updateStaged({ additionalCharges: next });
                                    }}
                                    className="w-32 text-right px-2 py-1 bg-slate-50 border border-slate-200 rounded font-mono font-semibold"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const next = (stagedTemplate.additionalCharges || []).filter((_, i) => i !== cIdx);
                                      updateStaged({ additionalCharges: next });
                                    }}
                                    className="p-1 text-slate-400 hover:text-rose-600"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Right 5 Cols: Complete Calculated Project Summary Card */}
                        <div className="lg:col-span-5 bg-white p-4 rounded-xl border border-slate-200 space-y-2 text-xs shadow-2xs">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <span className="font-bold text-slate-900 uppercase tracking-wider text-[10px]">
                              Complete Project Calculation Summary
                            </span>
                            <span className="font-mono text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              Est. Margin: {stagedCalculations.estimatedMarginPercent.toFixed(1)}%
                            </span>
                          </div>

                          <div className="flex justify-between text-slate-600">
                            <span>Product Items ({stagedCalculations.productsCount} items):</span>
                            <span className="font-mono font-semibold text-slate-800">
                              LKR {stagedCalculations.productsGross.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>

                          <div className="flex justify-between text-slate-600">
                            <span>Service & Installation Items ({stagedCalculations.servicesCount} items):</span>
                            <span className="font-mono font-semibold text-slate-800">
                              LKR {stagedCalculations.servicesGross.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>

                          {stagedCalculations.discount > 0 && (
                            <div className="flex justify-between text-amber-700">
                              <span>Line Discounts:</span>
                              <span className="font-mono font-semibold">
                                - LKR {stagedCalculations.discount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                          )}

                          {stagedCalculations.chargesTotal > 0 && (
                            <div className="flex justify-between text-slate-600">
                              <span>Additional Site Charges:</span>
                              <span className="font-mono font-semibold text-slate-800">
                                + LKR {stagedCalculations.chargesTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                          )}

                          <div className="flex items-center justify-between text-slate-600 pt-1 border-t border-slate-100">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <span>Tax Rate (%):</span>
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={stagedTemplate.taxPercent || 0}
                                onChange={e =>
                                  updateStaged({
                                    taxPercent: parseFloat(e.target.value) || 0
                                  })
                                }
                                className="w-14 px-1.5 py-0.5 bg-slate-50 border border-slate-200 rounded font-mono text-[11px] text-center"
                              />
                            </label>
                            <span className="font-mono font-semibold text-slate-800">
                              LKR {stagedCalculations.taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>

                          <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                            <div>
                              <span className="font-bold text-slate-900 block">Calculated Grand Total</span>
                              <span className="text-[10px] text-slate-400">
                                Est. Cost: LKR {stagedCalculations.estimatedCost.toLocaleString(undefined, { maximumFractionDigits: 0 })} • Profit: LKR {stagedCalculations.estimatedProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                              </span>
                            </div>
                            <span className="font-mono font-bold text-base text-orange-600">
                              {stagedTemplate.currency || 'LKR'} {stagedCalculations.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>

                          <div className="pt-2 flex items-center justify-end gap-2">
                            <button
                              onClick={handleSaveToLibrary}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors"
                            >
                              <Save size={12} />
                              <span>Save Design Template</span>
                            </button>
                            <button
                              onClick={() => handleOpenProceedDialog('quote')}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                            >
                              <span>Use as Template / Quote</span>
                              <ArrowRight size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: EMBEDDED QUICK INSERTING PORTAL (DIRECT BUILDER INTO DESIGN CARD) */}
                {activeEditorTab === 'quick_insert' && (
                  <div className="space-y-4 w-full">
                    <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4 rounded-xl flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0">
                          <Sparkles size={18} />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold">
                            Quick Inserting Portal — Direct Project Design Item Builder
                          </h3>
                          <p className="text-xs text-slate-300">
                            Configure custom aluminium/glazing/steel products or installation service items below and click "Add to Quotation" to insert directly into <span className="font-semibold text-amber-300">{stagedTemplate.name}</span>.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setActiveEditorTab('items')}
                          className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold transition-colors"
                        >
                          Back to Design BOQ ({stagedTemplate.items.length} Items)
                        </button>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                      <ItemCatalog
                        templates={itemCatalog}
                        categories={itemCategories}
                        productFamilies={productFamilies}
                        productVariants={productVariants}
                        rateVersions={rateVersions}
                        onUpdateTemplate={onSaveItemTemplate}
                        onSaveVariant={onSaveProductVariant}
                        onClose={() => setActiveEditorTab('items')}
                        portalContext="boq"
                        portalTitle={`Quick Insert into Design: ${stagedTemplate.name}`}
                        onQuickAdd={(item) => {
                          const qty = item.quantity || 1;
                          const variant = item.selectedVariant;
                          const rate = variant?.pricing?.sellingPrice || item.rate || 0;
                          const cost = variant?.pricing?.costPrice || item.costAtTimeOfQuote || Math.round(rate * 0.72);
                          const newItem: BOQItem = {
                            id: crypto.randomUUID(),
                            no: `${stagedTemplate.items.length + 1}`,
                            pvcCode: variant?.variantCode || item.pvcCode || item.productCode,
                            name: variant ? `${item.name} — ${variant.variantName}` : item.name,
                            description: variant?.boqDescription || variant?.technicalDescription || item.description,
                            itemType: 'Main',
                            productType: item.productType || 'Product',
                            category: item.category || 'Aluminium',
                            unit: variant?.unit || item.unit || 'sqft',
                            qty,
                            rate,
                            costAtTimeOfQuote: cost,
                            discountPercent: item.discountPercent || 0,
                            amount: qty * rate * (1 - (item.discountPercent || 0) / 100),
                            templateId: item.id,
                            variantId: variant?.id
                          };
                          handleInsertBOQItemFromPortal(newItem);
                          return {
                            success: true,
                            targetName: stagedTemplate.name,
                            isProject: false,
                            itemId: newItem.id
                          };
                        }}
                        onSelectItems={(selectedList) => {
                          if (!stagedTemplate || selectedList.length === 0) return;
                          const added: BOQItem[] = selectedList.map((item, idx) => {
                            const qty = item.quantity || 1;
                            const variant = item.selectedVariant;
                            const rate = variant?.pricing?.sellingPrice || item.rate || 0;
                            const cost = variant?.pricing?.costPrice || item.costAtTimeOfQuote || Math.round(rate * 0.72);
                            return {
                              id: crypto.randomUUID(),
                              no: `${stagedTemplate.items.length + idx + 1}`,
                              pvcCode: variant?.variantCode || item.pvcCode || item.productCode,
                              name: variant ? `${item.name} — ${variant.variantName}` : item.name,
                              description: variant?.boqDescription || variant?.technicalDescription || item.description,
                              itemType: 'Main',
                              productType: item.productType || 'Product',
                              category: item.category || 'Aluminium',
                              unit: variant?.unit || item.unit || 'sqft',
                              qty,
                              rate,
                              costAtTimeOfQuote: cost,
                              discountPercent: item.discountPercent || 0,
                              amount: qty * rate * (1 - (item.discountPercent || 0) / 100),
                              templateId: item.id,
                              variantId: variant?.id
                            };
                          });
                          updateStaged({ items: [...stagedTemplate.items, ...added] });
                          showNotice(`Inserted ${added.length} item(s) from Quick Inserting Portal into "${stagedTemplate.name}"`, 'success');
                          setActiveEditorTab('items');
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* TAB 3: DESIGN MEDIA (1MB IMAGE / 10MB VIDEO), CATEGORIES & ARCHITECTURAL SPECS */}
                {activeEditorTab === 'media_specs' && (
                  <DesignMediaAndSpecsTab
                    design={stagedTemplate}
                    categories={designCategories}
                    onUpdateDesign={updateStaged}
                    onSaveToLibrary={handleSaveToLibrary}
                    onSaveAsNewDesign={handleSaveAsNewTemplate}
                    onOpenCategoryManager={() => setIsCategoryManagerOpen(true)}
                    onShowNotice={showNotice}
                  />
                )}

                {/* TAB 4: TERMS & CONDITIONS */}
                {activeEditorTab === 'terms' && (
                  <div className="space-y-4 w-full">
                    <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <div>
                        <h3 className="text-xs font-bold text-slate-900">Contract Terms & Standard Conditions</h3>
                        <p className="text-[11px] text-slate-500">Toggle clauses to include or modify text specific to your standard workflow.</p>
                      </div>
                      <button
                        onClick={handleAddCustomTerm}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-2xs"
                      >
                        <Plus size={13} className="text-orange-500" />
                        <span>Add Custom Term</span>
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {stagedTemplate.terms.map((term, idx) => (
                        <div
                          key={term.id || idx}
                          className={cn(
                            "p-3 rounded-xl border transition-all text-xs space-y-1.5",
                            term.isActive 
                              ? "bg-white border-slate-200 shadow-2xs" 
                              : "bg-slate-50/70 border-slate-200/60 opacity-60"
                          )}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={term.isActive}
                                onChange={() => handleToggleTerm(idx)}
                                className="rounded text-orange-500 focus:ring-orange-400"
                              />
                              <input
                                type="text"
                                value={term.title}
                                onChange={(e) => handleUpdateTerm(idx, { title: e.target.value })}
                                className="font-bold text-xs text-slate-900 bg-transparent border-0 focus:bg-slate-100 rounded px-1"
                              />
                            </label>

                            <button
                              onClick={() => {
                                const nextTerms = stagedTemplate.terms.filter((_, i) => i !== idx);
                                updateStaged({ terms: nextTerms });
                              }}
                              className="text-slate-400 hover:text-rose-600 p-1"
                              title="Delete Term"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>

                          <textarea
                            rows={2}
                            value={term.content}
                            onChange={(e) => handleUpdateTerm(idx, { content: e.target.value })}
                            className="w-full p-2 bg-slate-50/50 border border-slate-200/80 rounded-lg text-xs text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 5: COMMERCIAL & MILESTONES */}
                {activeEditorTab === 'commercial' && (
                  <div className="space-y-5 w-full">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <h3 className="text-xs font-bold text-slate-900">Commercial Contract Terms</h3>
                      <p className="text-[11px] text-slate-500">Configure default payment percentages, validity periods, and delivery estimates.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">Advance Deposit (%)</label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={stagedTemplate.advancePercent || 0}
                          onChange={(e) => updateStaged({ advancePercent: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold font-mono"
                        />
                        <p className="text-[10px] text-slate-400">Required upfront upon signing.</p>
                      </div>

                      <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">Quotation Validity (Days)</label>
                        <input
                          type="number"
                          min={1}
                          value={stagedTemplate.validityDays || 30}
                          onChange={(e) => updateStaged({ validityDays: parseInt(e.target.value) || 30 })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold font-mono"
                        />
                        <p className="text-[10px] text-slate-400">Days before prices expire.</p>
                      </div>

                      <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">Estimated Delivery (Days)</label>
                        <input
                          type="number"
                          min={1}
                          value={stagedTemplate.estimatedDeliveryDays || 21}
                          onChange={(e) => updateStaged({ estimatedDeliveryDays: parseInt(e.target.value) || 21 })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold font-mono"
                        />
                        <p className="text-[10px] text-slate-400">Fabrication and site delivery timeline.</p>
                      </div>
                    </div>

                    {/* Payment Tiers / Milestones */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">Payment Schedule Milestones</h4>
                          <p className="text-[11px] text-slate-500">Phased milestone breakdown for contractual billing.</p>
                        </div>
                        <button
                          onClick={() => {
                            const current = stagedTemplate.paymentTiers || [];
                            const newTier: PaymentTier = {
                              id: crypto.randomUUID(),
                              phase: 'New Milestone',
                              percentage: 20,
                              amount: stagedCalculations.grandTotal * 0.2,
                              status: 'Pending'
                            };
                            updateStaged({ paymentTiers: [...current, newTier] });
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold"
                        >
                          + Add Milestone
                        </button>
                      </div>

                      <div className="space-y-2">
                        {(stagedTemplate.paymentTiers || []).map((tier, idx) => (
                          <div key={tier.id || idx} className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                            <input
                              type="text"
                              value={tier.phase}
                              onChange={(e) => {
                                const tiers = [...(stagedTemplate.paymentTiers || [])];
                                tiers[idx] = { ...tiers[idx], phase: e.target.value };
                                updateStaged({ paymentTiers: tiers });
                              }}
                              className="flex-1 bg-white border border-slate-200 rounded px-2.5 py-1 text-xs font-medium"
                              placeholder="Milestone phase description..."
                            />
                            <div className="flex items-center gap-1 w-24">
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={tier.percentage}
                                onChange={(e) => {
                                  const tiers = [...(stagedTemplate.paymentTiers || [])];
                                  const pct = parseFloat(e.target.value) || 0;
                                  tiers[idx] = { ...tiers[idx], percentage: pct, amount: (stagedCalculations.grandTotal * (pct / 100)) };
                                  updateStaged({ paymentTiers: tiers });
                                }}
                                className="w-16 bg-white border border-slate-200 rounded px-2 py-1 text-xs font-mono text-right"
                              />
                              <span className="text-slate-500 font-semibold">%</span>
                            </div>
                            <span className="w-28 text-right font-mono font-semibold text-slate-700">
                              LKR {(stagedCalculations.grandTotal * (tier.percentage / 100)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </span>
                            <button
                              onClick={() => {
                                const tiers = (stagedTemplate.paymentTiers || []).filter((_, i) => i !== idx);
                                updateStaged({ paymentTiers: tiers });
                              }}
                              className="text-slate-400 hover:text-rose-600 p-1"
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
            </>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MODAL: MERGE ANOTHER TEMPLATE INTO CURRENT EDITOR                      */}
      {/* ========================================================================= */}
      {isMergeModalOpen && (
        <div className="fixed inset-0 z-[140] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full flex flex-col max-h-[85vh] overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-100">
                  <Layers size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Merge Another Template</h3>
                  <p className="text-xs text-slate-500">Select templates to append line items and terms into this editor.</p>
                </div>
              </div>
              <button onClick={() => setIsMergeModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={18} />
              </button>
            </div>

            {/* Template List */}
            <div className="p-6 overflow-y-auto space-y-3 flex-1 text-xs">
              <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={mergeIncludeItems}
                    onChange={(e) => setMergeIncludeItems(e.target.checked)}
                    className="rounded text-orange-500 focus:ring-orange-400"
                  />
                  <span>Include Line Items</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={mergeIncludeTerms}
                    onChange={(e) => setMergeIncludeTerms(e.target.checked)}
                    className="rounded text-orange-500 focus:ring-orange-400"
                  />
                  <span>Include Terms & Clauses</span>
                </label>
              </div>

              <div className="space-y-2">
                {templates.filter(t => t.id !== stagedTemplate?.id).map((template) => {
                  const isChecked = mergeModalSelection.has(template.id);
                  return (
                    <div
                      key={template.id}
                      onClick={() => {
                        setMergeModalSelection(prev => {
                          const next = new Set(prev);
                          if (next.has(template.id)) next.delete(template.id);
                          else next.add(template.id);
                          return next;
                        });
                      }}
                      className={cn(
                        "p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3",
                        isChecked ? "bg-orange-50/40 border-orange-400" : "bg-white border-slate-200 hover:bg-slate-50"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          type="button"
                          className={cn(
                            "w-5 h-5 rounded flex items-center justify-center border transition-all shrink-0",
                            isChecked ? "bg-orange-500 border-orange-500 text-white" : "bg-white border-slate-300"
                          )}
                        >
                          <Check size={12} strokeWidth={3} />
                        </button>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 truncate">{template.name}</h4>
                          <p className="text-[11px] text-slate-500 truncate">{template.description}</p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-semibold text-slate-600 block">{template.items.length} Items</span>
                        <span className="text-[10px] text-slate-400">{template.category}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                {mergeModalSelection.size} template(s) selected to merge
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMergeModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMergeFromModal}
                  disabled={mergeModalSelection.size === 0}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50"
                >
                  <Layers size={13} />
                  <span>Merge into Editor</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MODAL: PRODUCT PORTAL & QUICK INSERTING PORTAL ITEM SELECTOR           */}
      {/* ========================================================================= */}
      {(isCatalogModalOpen || isProductPortalModalOpen) && (
        <ProductPortalInsertModal
          isOpen={isCatalogModalOpen || isProductPortalModalOpen}
          onClose={() => {
            setIsCatalogModalOpen(false);
            setIsProductPortalModalOpen(false);
          }}
          itemCatalog={itemCatalog}
          productVariants={productVariants}
          itemCategories={itemCategories}
          onInsertBOQItem={(boqItem) => handleInsertBOQItemFromPortal(boqItem)}
          onSaveNewMasterItem={onSaveItemTemplate}
          initialTab={productPortalInitialTab}
        />
      )}

      {/* ========================================================================= */}
      {/* 5. MODAL: DESIGN CATEGORY & SUB-CATEGORY MANAGER                          */}
      {/* ========================================================================= */}
      <DesignCategoryManagerModal
        isOpen={isCategoryManagerOpen}
        onClose={() => setIsCategoryManagerOpen(false)}
        categories={designCategories}
        onSaveCategories={handleSaveDesignCategories}
      />

      {/* ========================================================================= */}
      {/* 6. MODAL: CREATE NEW PROJECT DESIGN (WITH 1MB IMAGE / 10MB VIDEO)         */}
      {/* ========================================================================= */}
      <CreateProjectDesignModal
        isOpen={isCreateDesignModalOpen}
        onClose={() => setIsCreateDesignModalOpen(false)}
        categories={designCategories}
        onSaveCategories={handleSaveDesignCategories}
        onCreateDesign={handleCreateDesignFromModal}
        existingCount={templates.length}
      />

      {/* ========================================================================= */}
      {/* 7. MODAL: PROCEED TO QUOTATION (CUSTOMER & PROJECT SELECTION)            */}
      {/* ========================================================================= */}
      {isProceedModalOpen && (
        <div className="fixed inset-0 z-[150] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full flex flex-col max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-100">
                  <ArrowRight size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Proceed to Quotation Making</h3>
                  <p className="text-xs text-slate-500">Assign a customer and project details to launch your customized quotation.</p>
                </div>
              </div>
              <button onClick={() => setIsProceedModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
              {/* Step 1: Customer Selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <User size={14} className="text-orange-500" />
                    <span>1. Client / Customer Account</span>
                  </span>

                  <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setClientMode('existing')}
                      className={cn(
                        "px-2.5 py-1 rounded text-xs font-semibold transition-all",
                        clientMode === 'existing' ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                      )}
                    >
                      Existing Client
                    </button>
                    <button
                      type="button"
                      onClick={() => setClientMode('new')}
                      className={cn(
                        "px-2.5 py-1 rounded text-xs font-semibold transition-all",
                        clientMode === 'new' ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                      )}
                    >
                      + New Client
                    </button>
                  </div>
                </div>

                {clientMode === 'existing' ? (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Select Registered Client</label>
                    <select
                      value={selectedClientId}
                      onChange={(e) => setSelectedClientId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                    >
                      {clients.length === 0 ? (
                        <option value="">No clients registered - switch to New Client</option>
                      ) : (
                        clients.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name} {c.tradeName ? `(${c.tradeName})` : ''} - {c.phone || c.email || 'No contact'}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700">Client / Contact Person *</label>
                      <input
                        type="text"
                        placeholder="e.g. Johnathan Silva"
                        value={newClientData.name}
                        onChange={(e) => setNewClientData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700">Company / Trade Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Apex Holdings Pvt Ltd"
                        value={newClientData.tradeName}
                        onChange={(e) => setNewClientData(prev => ({ ...prev, tradeName: e.target.value }))}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700">Phone Number</label>
                      <input
                        type="text"
                        placeholder="e.g. +94 77 123 4567"
                        value={newClientData.phone}
                        onChange={(e) => setNewClientData(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700">Email Address</label>
                      <input
                        type="email"
                        placeholder="e.g. client@example.com"
                        value={newClientData.email}
                        onChange={(e) => setNewClientData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Step 2: Project Details */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <span className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 size={14} className="text-orange-500" />
                  <span>2. Project & Quotation Setup</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[11px] font-semibold text-slate-700">Project Title *</label>
                    <input
                      type="text"
                      placeholder="e.g. Luxury Apartment Aluminium Glazing"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-700">Work Site Location</label>
                    <input
                      type="text"
                      placeholder="e.g. No 45, Alfred Place, Colombo 03"
                      value={workSiteLocation}
                      onChange={(e) => setWorkSiteLocation(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-700">Quote Reference No</label>
                    <input
                      type="text"
                      value={customQuoteNo}
                      onChange={(e) => setCustomQuoteNo(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-700">Validity (Days)</label>
                    <input
                      type="number"
                      min={1}
                      value={quoteValidityDays}
                      onChange={(e) => setQuoteValidityDays(parseInt(e.target.value) || 30)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Step 3: Save to Template Library Option */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800">
                  <input
                    type="checkbox"
                    checked={alsoSaveAsTemplate}
                    onChange={(e) => setAlsoSaveAsTemplate(e.target.checked)}
                    className="rounded text-orange-500 focus:ring-orange-400"
                  />
                  <span>Also save this customized preset into Template Library</span>
                </label>

                {alsoSaveAsTemplate && (
                  <input
                    type="text"
                    value={alsoSaveTemplateName}
                    onChange={(e) => setAlsoSaveTemplateName(e.target.value)}
                    placeholder="Custom template preset name..."
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => setIsProceedModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg"
              >
                Cancel
              </button>

              <button
                onClick={handleConfirmProceedToQuotation}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
              >
                <span>Launch Quotation Editor</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
};
