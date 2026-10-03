import { useState, useEffect, useMemo } from 'react';
import { 
  Quote, Project, Client, Invoice, Payment, Adjustment, 
  AuditLog, Notification, QuoteTemplate, CompanySettings,
  DEFAULT_QUOTE_TEMPLATES, QuoteStatus,
  InvoiceStatus, ItemTemplate, DEFAULT_ITEM_TEMPLATES,
  Inquiry, ServiceVisitRequest, RateHistoryEntry,
  ProductFamily, ProductVariant, RateVersion,
  VerificationRegistryEntry, DocumentType, BOQItem,
  Supplier, PurchaseOrder, Personnel, Equipment, 
  ProjectPhase, InspectionResult, NonConformanceReport, WarrantyCertificate,
  ItemCategory, SpecificationLibraryItem, CalculationLibrarySheet,
  QuotationPriceSnapshot
} from '../types';
import { toast } from 'sonner';
import { INITIAL_COMPANY_SETTINGS, INITIAL_QUOTE, SAMPLE_PROJECTS, SAMPLE_CLIENTS, SAMPLE_QUOTES, SAMPLE_INVOICES } from '../constants';
import { calculateQuoteTotal } from '../lib/utils';
import { getInitialProductVariants } from '../data/seedVariants';
import { BulkPriceUpdateRule, simulateBulkPriceUpdate } from '../services/bomPricingService';
import { 
  generateVariantCode, 
  generateUniqueVariantBarcode, 
  ensureVariantsHaveUniqueCodesAndBarcodes,
  isVariantCodeUnique,
  isVariantBarcodeUnique
} from '../services/variantEngineService';
import { numberingService } from '../services/numberingService';

export const INITIAL_HIERARCHICAL_CATEGORIES: ItemCategory[] = [
  // 1. Aluminium Works (Main Category)
  { id: 'cat-alum', name: 'Aluminium Works', parentId: null, color: '#0ea5e9', tags: ['Architectural', 'Extrusions'], displayTile: true, order: 1 },
  { id: 'cat-alum-win', name: 'Aluminium Windows', parentId: 'cat-alum', color: '#0284c7', tags: ['Apertures'], displayTile: true, order: 1 },
  { id: 'cat-alum-win-slide', name: 'Sliding Windows (2-Track / 3-Track)', parentId: 'cat-alum-win', color: '#0369a1', tags: ['Sliding'], displayTile: true, order: 1 },
  { id: 'cat-alum-win-case', name: 'Casement Windows & Projected', parentId: 'cat-alum-win', color: '#0369a1', tags: ['Hinged'], displayTile: true, order: 2 },
  { id: 'cat-alum-win-fix', name: 'Fixed Lights & Top Hung', parentId: 'cat-alum-win', color: '#0369a1', tags: ['Fixed'], displayTile: true, order: 3 },
  { id: 'cat-alum-door', name: 'Aluminium Doors', parentId: 'cat-alum', color: '#0284c7', tags: ['Entrances'], displayTile: true, order: 2 },
  { id: 'cat-alum-door-slide', name: 'Heavy Duty Sliding Doors', parentId: 'cat-alum-door', color: '#0369a1', tags: ['Patio'], displayTile: true, order: 1 },
  { id: 'cat-alum-door-swing', name: 'Commercial Swing Doors', parentId: 'cat-alum-door', color: '#0369a1', tags: ['Double Action'], displayTile: true, order: 2 },
  { id: 'cat-alum-door-bifold', name: 'Bi-Folding Doors', parentId: 'cat-alum-door', color: '#0369a1', tags: ['Folding'], displayTile: true, order: 3 },
  { id: 'cat-alum-facade', name: 'Curtain Walls & Façades', parentId: 'cat-alum', color: '#0284c7', tags: ['High-Rise'], displayTile: true, order: 3 },
  { id: 'cat-alum-louver', name: 'Louvers & Sunshades', parentId: 'cat-alum', color: '#0284c7', tags: ['Shading'], displayTile: true, order: 4 },

  // 2. Glass & Glazing (Main Category)
  { id: 'cat-glass', name: 'Glass & Glazing', parentId: null, color: '#10b981', tags: ['Tempered', 'Laminated'], displayTile: true, order: 2 },
  { id: 'cat-glass-partition', name: 'Frameless Glass Partitions', parentId: 'cat-glass', color: '#059669', tags: ['Office'], displayTile: true, order: 1 },
  { id: 'cat-glass-part-10mm', name: '10mm Clear Tempered', parentId: 'cat-glass-partition', color: '#047857', tags: ['Internal'], displayTile: true, order: 1 },
  { id: 'cat-glass-part-12mm', name: '12mm Acoustic Glass', parentId: 'cat-glass-partition', color: '#047857', tags: ['Soundproof'], displayTile: true, order: 2 },
  { id: 'cat-glass-railing', name: 'Glass Balustrades & Railings', parentId: 'cat-glass', color: '#059669', tags: ['Safety'], displayTile: true, order: 2 },
  { id: 'cat-glass-shower', name: 'Shower Enclosures', parentId: 'cat-glass', color: '#059669', tags: ['Bathroom'], displayTile: true, order: 3 },

  // 3. Steel & Metal Works (Main Category)
  { id: 'cat-steel', name: 'Steel & Metal Works', parentId: null, color: '#6366f1', tags: ['Structural', 'Fabrication'], displayTile: true, order: 3 },
  { id: 'cat-steel-struct', name: 'Structural Framing (I-Beams)', parentId: 'cat-steel', color: '#4f46e5', tags: ['Beams'], displayTile: true, order: 1 },
  { id: 'cat-steel-handrail', name: 'Stainless Steel Handrails', parentId: 'cat-steel', color: '#4f46e5', tags: ['SS304'], displayTile: true, order: 2 },
  { id: 'cat-steel-canopy', name: 'Canopies & Pergolas', parentId: 'cat-steel', color: '#4f46e5', tags: ['Roofing'], displayTile: true, order: 3 },

  // 4. Hardware & Accessories (Main Category)
  { id: 'cat-acc', name: 'Hardware & Accessories', parentId: null, color: '#64748b', tags: ['Fixings', 'Hardware'], displayTile: true, order: 4 },
  { id: 'cat-acc-locks', name: 'Locks & Multipoint Hardware', parentId: 'cat-acc', color: '#475569', tags: ['Security'], displayTile: true, order: 1 },
  { id: 'cat-acc-rollers', name: 'Rollers & Friction Stays', parentId: 'cat-acc', color: '#475569', tags: ['Rollers'], displayTile: true, order: 2 },
  { id: 'cat-acc-sealants', name: 'Weather Sealants & EPDM Gaskets', parentId: 'cat-acc', color: '#475569', tags: ['Seals'], displayTile: true, order: 3 },

  // 5. Engineering & Site Services (Main Category)
  { id: 'cat-service', name: 'Engineering & Site Services', parentId: null, color: '#f59e0b', tags: ['Field Operations'], displayTile: true, order: 5 },
  { id: 'cat-serv-survey', name: 'Site Survey & Laser Measurement', parentId: 'cat-service', color: '#d97706', tags: ['Survey'], displayTile: true, order: 1 },
  { id: 'cat-serv-install', name: 'Specialized Hoisting & Rigging', parentId: 'cat-service', color: '#d97706', tags: ['Hoisting'], displayTile: true, order: 2 }
];

export const useQuoteData = () => {
  // --- State ---
  const [quotes, setQuotes] = useState<Quote[]>(() => {
    const saved = localStorage.getItem('quotes');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((q: Quote) => ({
            ...q,
            items: (q.items || []).map((it, idx) => {
              if (it.itemType === 'Title') return it;
              const barcode = it.variantBarcode || it.barcode || (it.variantCode ? `VAR-${it.variantCode.replace(/[^A-Za-z0-9]/g, '')}` : `VAR-BOQ-${(it.productCode || 'ITEM').replace(/[^A-Za-z0-9]/g, '')}-${idx + 1}`);
              return {
                ...it,
                variantBarcode: barcode,
                barcode: barcode
              };
            })
          }));
        }
      } catch (e) {
        console.error('Failed to parse saved quotes', e);
      }
    }
    return SAMPLE_QUOTES;
  });

  const [itemCategories, setItemCategories] = useState<ItemCategory[]>(() => {
    const saved = localStorage.getItem('itemCategories');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const hasHierarchical = parsed.some((c: any) => c.parentId !== undefined && c.parentId !== null);
        if (hasHierarchical && parsed.length >= 8) {
          return parsed;
        }
        const existingIds = new Set(parsed.map((p: any) => p.id));
        const merged = [...parsed];
        for (const def of INITIAL_HIERARCHICAL_CATEGORIES) {
          if (!existingIds.has(def.id)) {
            merged.push(def);
          }
        }
        return merged;
      } catch (e) {
        return INITIAL_HIERARCHICAL_CATEGORIES;
      }
    }
    return INITIAL_HIERARCHICAL_CATEGORIES;
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('projects');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Ensure every project has a projectCode
          const withCodes = parsed.map((p: any, idx: number) => ({
            ...p,
            projectCode: p.projectCode || `PRJ-2026-${String(idx + 1).padStart(3, '0')}`,
            status: p.status || 'In Progress'
          }));
          const hasNewRequest = withCodes.some((p: any) => p.status === 'New Request');
          if (!hasNewRequest) {
            const newReqSample = (SAMPLE_PROJECTS as Project[]).find(p => p.status === 'New Request');
            if (newReqSample) return [...withCodes, newReqSample];
          }
          return withCodes;
        }
      } catch (e) {
        console.error('Failed to parse saved projects', e);
      }
    }
    return SAMPLE_PROJECTS as Project[];
  });

  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem('clients');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Failed to parse saved clients', e);
      }
    }
    return SAMPLE_CLIENTS;
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem('invoices');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Failed to parse saved invoices', e);
      }
    }
    return SAMPLE_INVOICES;
  });

  const [payments, setPayments] = useState<Payment[]>(() => {
    const saved = localStorage.getItem('payments');
    return saved ? JSON.parse(saved) : [];
  });

  const [adjustments, setAdjustments] = useState<Adjustment[]>(() => {
    const saved = localStorage.getItem('adjustments');
    return saved ? JSON.parse(saved) : [];
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem('auditLogs');
    return saved ? JSON.parse(saved) : [];
  });

  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem('notifications');
    return saved ? JSON.parse(saved) : [];
  });

  const [retentionEvidence, setRetentionEvidence] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('retentionEvidence');
    return saved ? JSON.parse(saved) : {};
  });

  const [templates, setTemplates] = useState<QuoteTemplate[]>(() => {
    const saved = localStorage.getItem('quoteTemplates');
    if (saved) {
      try {
        const parsed: QuoteTemplate[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(t => {
            const def = DEFAULT_QUOTE_TEMPLATES.find(d => d.id === t.id);
            if (!def) return t;
            return {
              ...def,
              ...t,
              subCategory: t.subCategory || def.subCategory,
              designCode: t.designCode || def.designCode,
              mediaType: t.mediaType || def.mediaType,
              mediaUrl: t.mediaUrl || def.mediaUrl,
              mediaFileName: t.mediaFileName || def.mediaFileName,
              mediaFileSize: t.mediaFileSize || def.mediaFileSize,
              designSpecs: t.designSpecs || def.designSpecs,
              items: (t.items && t.items.length >= def.items.length ? t.items : def.items).map(it => ({
                ...it,
                productType: it.productType || (it.category === 'Services' ? 'Service' : 'Product')
              }))
            };
          });
        }
      } catch (e) {
        return DEFAULT_QUOTE_TEMPLATES;
      }
    }
    return DEFAULT_QUOTE_TEMPLATES;
  });

  const [itemTemplates, setItemTemplates] = useState<ItemTemplate[]>(() => {
    const saved = localStorage.getItem('itemTemplates');
    const rawItems: ItemTemplate[] = saved ? JSON.parse(saved) : DEFAULT_ITEM_TEMPLATES;
    return rawItems.map(item => {
      if (item.categoryId && item.categoryPath && item.categoryPath.length > 0) return item;
      let catId = item.categoryId;
      let catPath = item.categoryPath;
      if (!catId) {
        if (item.id === 't1' || item.productCode === 'AL-WD-001' || item.name.toLowerCase().includes('sliding window')) {
          catId = 'cat-alum-win-slide';
          catPath = ['Aluminium Works', 'Aluminium Windows', 'Sliding Windows (2-Track / 3-Track)'];
        } else if (item.id === 't2' || item.productCode === 'AL-WD-002' || item.name.toLowerCase().includes('casement window')) {
          catId = 'cat-alum-win-case';
          catPath = ['Aluminium Works', 'Aluminium Windows', 'Casement Windows & Projected'];
        } else if (item.id === 't3' || item.productCode === 'ST-ST-001' || item.category === 'Steel') {
          catId = 'cat-steel-struct';
          catPath = ['Steel & Metal Works', 'Structural Framing (I-Beams)'];
        } else if (item.id === 't4' || item.productCode === 'GL-PT-001' || item.category === 'Glass') {
          catId = 'cat-glass-part-12mm';
          catPath = ['Glass & Glazing', 'Frameless Glass Partitions', '12mm Acoustic Glass'];
        } else if (item.id === 'sv-001' || item.productCode === 'SRV-MS-001' || item.category === 'Services') {
          catId = 'cat-serv-survey';
          catPath = ['Engineering & Site Services', 'Site Survey & Laser Measurement'];
        } else if (item.category === 'Aluminium') {
          catId = 'cat-alum-win-slide';
          catPath = ['Aluminium Works', 'Aluminium Windows', 'Sliding Windows (2-Track / 3-Track)'];
        }
      }
      return {
        ...item,
        categoryId: catId || 'cat-alum-win-slide',
        categoryPath: catPath || ['Aluminium Works']
      };
    });
  });

  const [companySettings, setCompanySettings] = useState<CompanySettings>(() => {
    const saved = localStorage.getItem('companySettings');
    return saved ? JSON.parse(saved) : INITIAL_COMPANY_SETTINGS;
  });

  const [tags, setTags] = useState<string[]>(() => {
    const saved = localStorage.getItem('tags');
    return saved ? JSON.parse(saved) : ['Home Renovations', 'Industrial Projects', 'Home Building'];
  });

  const [inquiries, setInquiries] = useState<Inquiry[]>(() => {
    const saved = localStorage.getItem('inquiries');
    return saved ? JSON.parse(saved) : [];
  });

  const [serviceRequests, setServiceRequests] = useState<ServiceVisitRequest[]>(() => {
    const saved = localStorage.getItem('serviceRequests');
    return saved ? JSON.parse(saved) : [];
  });

  const [productFamilies, setProductFamilies] = useState<ProductFamily[]>(() => {
    const saved = localStorage.getItem('productFamilies');
    const defaultFamilies: ProductFamily[] = [
      { id: 'fam-alum-700', familyCode: 'AL-700', familyName: '700 Series Sliding', category: 'Aluminium', description: 'Standard sliding series', unit: 'm', status: 'Active', featureGroups: [], color: '#0ea5e9', tags: ['Sliding', 'Aluminium'] },
      { id: 'fam-alum-1000', familyCode: 'AL-1000', familyName: '1000 Series Casement', category: 'Aluminium', description: 'Premium casement series', unit: 'm', status: 'Active', featureGroups: [], color: '#0284c7', tags: ['Casement', 'Premium'] },
      { id: 'fam-glass-temp', familyCode: 'GL-TEMP', familyName: 'Tempered Glass', category: 'Glass', description: 'Safety glass', unit: 'sqft', status: 'Active', featureGroups: [], color: '#10b981', tags: ['Safety', 'Clear'] },
      { id: 'fam-acc-hw', familyCode: 'ACC-HW', familyName: 'Standard Hardware', category: 'Accessories', description: 'Universal accessories', unit: 'Nos', status: 'Active', featureGroups: [], color: '#64748b', tags: ['Hardware', 'Fixing'] }
    ];
    return saved ? JSON.parse(saved) : defaultFamilies;
  });

  const [productVariants, setProductVariants] = useState<ProductVariant[]>(() => {
    const saved = localStorage.getItem('productVariants');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].pricing) {
          return ensureVariantsHaveUniqueCodesAndBarcodes(parsed, DEFAULT_ITEM_TEMPLATES);
        }
      } catch (e) {
        // Fallback to initial
      }
    }
    return ensureVariantsHaveUniqueCodesAndBarcodes(getInitialProductVariants(), DEFAULT_ITEM_TEMPLATES);
  });

  const [quotationSnapshots, setQuotationSnapshots] = useState<QuotationPriceSnapshot[]>(() => {
    const saved = localStorage.getItem('quotationSnapshots');
    return saved ? JSON.parse(saved) : [];
  });

  const [verificationRegistry, setVerificationRegistry] = useState<VerificationRegistryEntry[]>(() => {
    const saved = localStorage.getItem('verification_registry');
    return saved ? JSON.parse(saved) : [
      {
        id: crypto.randomUUID(),
        svcCode: 'SV-A7K2M-9P3XQ-4W8NR',
        documentType: 'Quotation',
        documentRef: 'QUAD-2026-0042',
        internalId: 'mock-quote-id',
        generatedAt: new Date().toISOString(),
        generatedBy: 'System Admin',
        status: 'Active',
        version: 1,
        metadata: {
          customerName: 'Global Construction Ltd',
          projectName: 'Horizon Office Complex',
          totalValue: 4500000,
          isCurrent: true
        },
        accessCount: 12
      }
    ];
  });

  const [rateVersions, setRateVersions] = useState<RateVersion[]>(() => {
    const saved = localStorage.getItem('rateVersions');
    return saved ? JSON.parse(saved) : [];
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem('suppliers');
    return saved ? JSON.parse(saved) : [];
  });

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => {
    const saved = localStorage.getItem('purchaseOrders');
    return saved ? JSON.parse(saved) : [];
  });

  const [personnel, setPersonnel] = useState<Personnel[]>(() => {
    const saved = localStorage.getItem('personnel');
    return saved ? JSON.parse(saved) : [];
  });

  const [equipment, setEquipment] = useState<Equipment[]>(() => {
    const saved = localStorage.getItem('equipment');
    return saved ? JSON.parse(saved) : [];
  });

  const [projectPhases, setProjectPhases] = useState<ProjectPhase[]>(() => {
    const saved = localStorage.getItem('projectPhases');
    return saved ? JSON.parse(saved) : [];
  });

  const [inspectionResults, setInspectionResults] = useState<InspectionResult[]>(() => {
    const saved = localStorage.getItem('inspectionResults');
    return saved ? JSON.parse(saved) : [];
  });

  const [ncrs, setNcrs] = useState<NonConformanceReport[]>(() => {
    const saved = localStorage.getItem('ncrs');
    return saved ? JSON.parse(saved) : [];
  });

  const [warrantyCertificates, setWarrantyCertificates] = useState<WarrantyCertificate[]>(() => {
    const saved = localStorage.getItem('warrantyCertificates');
    return saved ? JSON.parse(saved) : [];
  });

  const [specificationLibrary, setSpecificationLibrary] = useState<SpecificationLibraryItem[]>(() => {
    const saved = localStorage.getItem('specificationLibrary');
    return saved ? JSON.parse(saved) : [];
  });

  const [calculationSheets, setCalculationSheets] = useState<CalculationLibrarySheet[]>(() => {
    const saved = localStorage.getItem('calculationSheets');
    return saved ? JSON.parse(saved) : [];
  });

  // --- Persistence ---
  useEffect(() => { localStorage.setItem('quotes', JSON.stringify(quotes)); }, [quotes]);
  useEffect(() => { localStorage.setItem('itemCategories', JSON.stringify(itemCategories)); }, [itemCategories]);
  useEffect(() => { localStorage.setItem('projects', JSON.stringify(projects)); }, [projects]);
  useEffect(() => { localStorage.setItem('clients', JSON.stringify(clients)); }, [clients]);
  useEffect(() => { localStorage.setItem('invoices', JSON.stringify(invoices)); }, [invoices]);
  useEffect(() => { localStorage.setItem('payments', JSON.stringify(payments)); }, [payments]);
  useEffect(() => { localStorage.setItem('adjustments', JSON.stringify(adjustments)); }, [adjustments]);
  useEffect(() => { localStorage.setItem('auditLogs', JSON.stringify(auditLogs)); }, [auditLogs]);
  useEffect(() => { localStorage.setItem('notifications', JSON.stringify(notifications)); }, [notifications]);
  useEffect(() => { localStorage.setItem('retentionEvidence', JSON.stringify(retentionEvidence)); }, [retentionEvidence]);
  useEffect(() => { localStorage.setItem('quoteTemplates', JSON.stringify(templates)); }, [templates]);
  useEffect(() => { localStorage.setItem('itemTemplates', JSON.stringify(itemTemplates)); }, [itemTemplates]);
  useEffect(() => {
    localStorage.setItem('companySettings', JSON.stringify(companySettings));
    numberingService.syncFromCompanySettings(companySettings);
  }, [companySettings]);
  useEffect(() => { localStorage.setItem('tags', JSON.stringify(tags)); }, [tags]);
  useEffect(() => { localStorage.setItem('inquiries', JSON.stringify(inquiries)); }, [inquiries]);
  useEffect(() => { localStorage.setItem('serviceRequests', JSON.stringify(serviceRequests)); }, [serviceRequests]);
  useEffect(() => { localStorage.setItem('productFamilies', JSON.stringify(productFamilies)); }, [productFamilies]);
  useEffect(() => { localStorage.setItem('productVariants', JSON.stringify(productVariants)); }, [productVariants]);
  useEffect(() => { localStorage.setItem('rateVersions', JSON.stringify(rateVersions)); }, [rateVersions]);
  useEffect(() => { localStorage.setItem('suppliers', JSON.stringify(suppliers)); }, [suppliers]);
  useEffect(() => { localStorage.setItem('purchaseOrders', JSON.stringify(purchaseOrders)); }, [purchaseOrders]);
  useEffect(() => { localStorage.setItem('personnel', JSON.stringify(personnel)); }, [personnel]);
  useEffect(() => { localStorage.setItem('equipment', JSON.stringify(equipment)); }, [equipment]);
  useEffect(() => { localStorage.setItem('projectPhases', JSON.stringify(projectPhases)); }, [projectPhases]);
  useEffect(() => { localStorage.setItem('inspectionResults', JSON.stringify(inspectionResults)); }, [inspectionResults]);
  useEffect(() => { localStorage.setItem('ncrs', JSON.stringify(ncrs)); }, [ncrs]);
  useEffect(() => { localStorage.setItem('warrantyCertificates', JSON.stringify(warrantyCertificates)); }, [warrantyCertificates]);
  useEffect(() => { localStorage.setItem('specificationLibrary', JSON.stringify(specificationLibrary)); }, [specificationLibrary]);
  useEffect(() => { localStorage.setItem('calculationSheets', JSON.stringify(calculationSheets)); }, [calculationSheets]);
  useEffect(() => { localStorage.setItem('quotationSnapshots', JSON.stringify(quotationSnapshots)); }, [quotationSnapshots]);

  // --- Actions ---
  const addAuditLog = (action: string, details: string, type: AuditLog['type'] = 'General', projectName?: string) => {
    const newLog: AuditLog = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      action,
      details,
      user: 'Current User',
      type,
      projectName
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  useEffect(() => {
    localStorage.setItem('verification_registry', JSON.stringify(verificationRegistry));
  }, [verificationRegistry]);

  const addNotification = (
    title: string | Omit<Notification, 'id' | 'timestamp' | 'isRead'>,
    message?: string,
    type: Notification['type'] = 'info',
    category: Notification['category'] = 'General',
    priority: Notification['priority'] = 'low',
    action?: Notification['action'],
    id?: string
  ) => {
    const newNotif: Notification = typeof title === 'object' 
      ? { ...title, id: id || (title as any).id || crypto.randomUUID(), timestamp: new Date().toISOString(), isRead: false } as Notification
      : {
          id: id || crypto.randomUUID(),
          title,
          message: message || '',
          timestamp: new Date().toISOString(),
          type,
          category,
          priority,
          isRead: false,
          action
        };

    // Add default actions if none provided
    if (!newNotif.action) {
      if (newNotif.category === 'Accounting') {
        newNotif.action = { label: 'View Accounting', view: 'accounting' };
      } else if (newNotif.category === 'General' && newNotif.title.includes('Invoice')) {
        newNotif.action = { label: 'View Invoices', view: 'invoices' };
      } else if (newNotif.category === 'Variation') {
        newNotif.action = { label: 'View Variations', view: 'projects' };
      } else if (newNotif.category === 'Smart') {
        newNotif.action = { label: 'View Dashboard', view: 'dashboard' };
      } else {
        // Default action to clear the notification center or go to dashboard
        newNotif.action = { label: 'View Dashboard', view: 'dashboard' };
      }
    }
    
    setNotifications(prev => {
      if (prev.some(n => n.id === newNotif.id)) return prev;
      
      // Trigger global alert toast
      const toastFn = newNotif.type === 'error' ? toast.error : 
                    newNotif.type === 'success' ? toast.success : 
                    newNotif.type === 'warning' ? toast.warning : toast.info;
      
      toastFn(newNotif.title, {
        description: newNotif.message,
        action: newNotif.action ? {
          label: newNotif.action.label,
          onClick: () => {
            // App state handles the view change via notifications list, 
            // but for toast we can just leave it as informational or 
            // we'd need to pass a dispatcher here.
            // For now, the toast just alerts.
          }
        } : undefined
      });

      return [newNotif, ...prev];
    });
  };

  const saveQuote = (quote: Quote) => {
    let savedQuote = { ...quote };
    let isNew = false;

    if (!savedQuote.id || savedQuote.id === '') {
      savedQuote.id = crypto.randomUUID();
      isNew = true;
    }

    setQuotes(prev => {
      const index = prev.findIndex(q => q.id === savedQuote.id);
      if (index >= 0) {
        const newQuotes = [...prev];
        newQuotes[index] = savedQuote;
        return newQuotes;
      }
      return [savedQuote, ...prev];
    });

    if (isNew) {
      numberingService.consumeNextNumber('quotation');
      setCompanySettings(prev => ({
        ...prev,
        nextQuoteNumber: prev.nextQuoteNumber + 1
      }));
    }

    // Record rate history and check for overrides
    if (savedQuote.items && savedQuote.items.length > 0) {
      // Track significant overrides to notify for base rate review
      const significantOverrides: { itemName: string, variantId: string, currentBaseRate: number, quotedRate: number }[] = [];

      savedQuote.items.forEach(item => {
        if (item.variantId && item.rateVersionId && item.baseRateAtTimeOfQuote) {
          const diff = Math.abs(item.rate - item.baseRateAtTimeOfQuote);
          const percentDiff = (diff / item.baseRateAtTimeOfQuote) * 100;
          
          if (percentDiff > 15) { // 15% threshold for manual override alert
            significantOverrides.push({
              itemName: item.name,
              variantId: item.variantId,
              currentBaseRate: item.baseRateAtTimeOfQuote,
              quotedRate: item.rate
            });
          }
        }
      });

      if (significantOverrides.length > 0) {
        addNotification(
          'Significant Rate Overrides Detected',
          `${significantOverrides.length} items quoted with >15% variance from base rates. Review recommended for ${significantOverrides[0].itemName}...`,
          'warning',
          'Rate',
          'medium',
          { label: 'Analyze Rates', view: 'boq-items' }
        );
      }

      setItemTemplates(prevTemplates => {
        let changed = false;
        const newTemplates = prevTemplates.map(template => {
          // Find if this template was used in the quote
          // Prefer matching by templateId, fallback to name
          const itemsUsingThis = savedQuote.items.filter(item => 
            (item.templateId === template.id || (!item.templateId && item.name === template.name)) && 
            item.rate > 0
          );

          if (itemsUsingThis.length > 0) {
            changed = true;
            const history = template.rateHistory || [];
            
            // Add new entries for each usage in this quote
            const newEntries: RateHistoryEntry[] = itemsUsingThis.map(item => {
              const discountValue = item.discountPercent || savedQuote.discountPercent || 0;
              const finalPrice = item.rate * (1 - (discountValue / 100));
              
              return {
                id: crypto.randomUUID(),
                date: savedQuote.submittedDate || new Date().toISOString(),
                rate: item.rate,
                discountApplied: discountValue,
                finalPrice: finalPrice,
                quoteId: savedQuote.id,
                projectName: savedQuote.projectName,
                clientName: savedQuote.client.name,
                status: savedQuote.status,
                reason: `Quote Submission: ${savedQuote.quoteNo}`,
                version: '1.0'
              };
            });

            const updatedHistory = [...history, ...newEntries].sort((a, b) => 
              new Date(b.date).getTime() - new Date(a.date).getTime()
            );

            // Keep only last 50 entries to prevent bloat
            const trimmedHistory = updatedHistory.slice(0, 50);

            // Recalculate stats
            const rates = trimmedHistory.map(h => h.rate);
            const min = Math.min(...rates);
            const max = Math.max(...rates);
            const avg = rates.reduce((a, b) => a + b, 0) / rates.length;

            return {
              ...template,
              rateHistory: trimmedHistory,
              lastBiddedRate: itemsUsingThis[0].rate,
              minBiddedRate: min,
              maxBiddedRate: max,
              avgBiddedRate: avg
            };
          }
          return template;
        });

        return changed ? newTemplates : prevTemplates;
      });
    }

    addAuditLog(
      isNew ? 'Create Quote' : 'Update Quote',
      `Quote ${savedQuote.quoteNo} for ${savedQuote.projectName} was ${isNew ? 'created' : 'updated'}.`,
      'General',
      savedQuote.projectName
    );

    return savedQuote;
  };

  const deleteQuote = (id: string) => {
    const quote = quotes.find(q => q.id === id);
    if (quote) {
      setQuotes(prev => prev.filter(q => q.id !== id));
      addAuditLog('Delete Quote', `Quote ${quote.quoteNo} was deleted.`, 'General', quote.projectName);
    }
  };

  const updateQuoteStatus = (id: string, status: QuoteStatus) => {
    let updatedQuote: Quote | undefined;
    setQuotes(prev => {
      const newQuotes = prev.map(q => q.id === id ? { ...q, status } : q);
      updatedQuote = newQuotes.find(q => q.id === id);
      return newQuotes;
    });

    // We need to use the quote data to create/update project
    // Since setQuotes is async, we'll find it from the current quotes state if updatedQuote is not yet set
    const quote = updatedQuote || quotes.find(q => q.id === id);
    
    if (quote) {
      addAuditLog('Status Change', `Quote ${quote.quoteNo} status changed to ${status}.`, 'Status', quote.projectName);
      
      // If won, create/update project
      if (status === QuoteStatus.WON || status === QuoteStatus.PROJECT) {
        setProjects(prev => {
          const existingProjectIndex = prev.findIndex(p => p.quoteId === id || p.projectName === quote.projectName && p.client.id === quote.client.id);
          
          const projectData: Partial<Project> = {
            quoteId: id,
            allQuoteIds: [id],
            projectName: quote.projectName,
            client: quote.client,
            totalValue: calculateQuoteTotal(quote),
            items: quote.items.map(item => ({ ...item, variationStatus: 'Original' })),
            timeline: quote.timeline,
            originalQuoteNo: quote.quoteNo,
            documentSettings: quote.documentSettings || INITIAL_QUOTE.documentSettings,
            terms: quote.terms ? quote.terms.map(t => ({ ...t })) : [],
            paymentTiers: quote.paymentTiers ? quote.paymentTiers.map(t => ({ ...t })) : [],
            discountPercent: quote.discountPercent,
            taxPercent: quote.taxPercent,
            isTaxInclusive: quote.isTaxInclusive,
            additionalCharges: quote.additionalCharges,
            currency: quote.currency
          };

          if (existingProjectIndex >= 0) {
            // Update existing project
            const updatedProjects = [...prev];
            updatedProjects[existingProjectIndex] = {
              ...updatedProjects[existingProjectIndex],
              ...projectData,
              // Don't overwrite these unless they are missing
              startDate: updatedProjects[existingProjectIndex].startDate || new Date().toISOString().split('T')[0],
              status: updatedProjects[existingProjectIndex].status || 'In Progress',
            };
            addAuditLog('Project Updated', `Project ${quote.projectName} was updated from Quote ${quote.quoteNo}.`, 'General', quote.projectName);
            return updatedProjects;
          } else {
            // Create new project
            const newProject: Project = {
              id: crypto.randomUUID(),
              startDate: new Date().toISOString().split('T')[0],
              status: 'In Progress',
              ...projectData,
              auditLogs: [{
                id: crypto.randomUUID(),
                timestamp: new Date().toISOString(),
                action: 'Project Activated',
                details: `Project created from quote ${quote.quoteNo}`,
                user: 'Current User',
                type: 'General'
              }]
            } as Project;
            addAuditLog('Project Created', `Project ${newProject.projectName} was created from Quote ${quote.quoteNo}.`, 'General', newProject.projectName);
            return [...prev, newProject];
          }
        });
      }
    }
  };

  const saveProject = (project: Project) => {
    const withCode: Project = {
      ...project,
      projectCode: project.projectCode || numberingService.consumeNextNumber('project')
    };
    setProjects(prev => {
      const index = prev.findIndex(p => p.id === withCode.id);
      if (index >= 0) {
        const newProjects = [...prev];
        newProjects[index] = withCode;
        return newProjects;
      }
      return [...prev, withCode];
    });
  };

  const deleteProject = (id: string) => {
    const project = projects.find(p => p.id === id);
    if (!project) return;
    setProjects(prev => prev.filter(p => p.id !== id));
    addAuditLog('Project Deleted', `Project "${project.projectName}" deleted.`, 'General');
  };

  const saveInvoice = (invoice: Invoice) => {
    const isNew = !invoices.some(i => i.id === invoice.id);
    if (isNew) {
      numberingService.consumeNextNumber('invoice');
    }
    setInvoices(prev => {
      const index = prev.findIndex(i => i.id === invoice.id);
      if (index >= 0) {
        const newInvoices = [...prev];
        newInvoices[index] = invoice;
        return newInvoices;
      }
      return [...prev, invoice];
    });
    addAuditLog('Save Invoice', `Invoice ${invoice.invoiceNo} was saved.`, 'General', invoice.projectName);
  };

  const deleteInvoice = (id: string) => {
    const invoice = invoices.find(i => i.id === id);
    if (!invoice) return;
    
    setInvoices(prev => prev.filter(i => i.id !== id));
    
    // Also cleanup related payments and adjustments if needed, 
    // but usually we keep them for audit or delete them too.
    // For now, let's just delete the invoice.
    
    addAuditLog('Delete Invoice', `Invoice ${invoice.invoiceNo} was deleted.`, 'General', invoice.projectName);
    addNotification('Invoice Deleted', `Invoice ${invoice.invoiceNo} has been removed.`, 'warning', 'Accounting', 'medium');
  };

  const savePayment = (payment: Payment) => {
    const ensuredPayment: Payment = {
      ...payment,
      paymentNo: payment.paymentNo || numberingService.consumeNextNumber('payment_receipt')
    };
    setPayments(prevPayments => {
      const index = prevPayments.findIndex(p => p.id === ensuredPayment.id);
      const updatedPayments = index >= 0 
        ? prevPayments.map((p, i) => i === index ? ensuredPayment : p)
        : [...prevPayments, ensuredPayment];
      
      // Update invoices based on the NEW payments list
      if (payment.invoiceId) {
        setInvoices(prevInvoices => prevInvoices.map(inv => {
          if (inv.id === payment.invoiceId) {
            const invoicePayments = updatedPayments.filter(p => p.invoiceId === inv.id);
            const newAmountPaid = invoicePayments.reduce((sum, p) => sum + p.amount, 0);
            const newBalanceDue = inv.grandTotal - newAmountPaid - (inv.amountAdjusted || 0);
            let newStatus = inv.status;
            if (newBalanceDue <= 0) newStatus = InvoiceStatus.COLLECTED_PAYMENT;
            else if (newAmountPaid > 0) newStatus = InvoiceStatus.PARTIAL;
            return { ...inv, amountPaid: newAmountPaid, balanceDue: newBalanceDue, status: newStatus };
          }
          return inv;
        }));
      }
      
      return updatedPayments;
    });
    
    addAuditLog('Record Payment', `Payment ${payment.paymentNo} of LKR ${payment.amount.toLocaleString()} received from ${payment.clientName}.`, 'Accounting', payment.projectName);
  };

  const saveAdjustment = (adjustment: Adjustment) => {
    const ensuredAdjustment: Adjustment = {
      ...adjustment,
      adjustmentNo: adjustment.adjustmentNo || numberingService.consumeNextNumber('credit_adjustment')
    };
    setAdjustments(prevAdjustments => {
      const index = prevAdjustments.findIndex(a => a.id === ensuredAdjustment.id);
      const updatedAdjustments = index >= 0
        ? prevAdjustments.map((a, i) => i === index ? ensuredAdjustment : a)
        : [...prevAdjustments, ensuredAdjustment];

      // Update invoices based on the NEW adjustments list
      if (adjustment.invoiceId) {
        setInvoices(prevInvoices => prevInvoices.map(inv => {
          if (inv.id === adjustment.invoiceId) {
            const invoiceAdjustments = updatedAdjustments.filter(a => a.invoiceId === inv.id);
            const newAmountAdjusted = invoiceAdjustments.reduce((sum, a) => sum + a.amount, 0);
            const newBalanceDue = inv.grandTotal - (inv.amountPaid || 0) - newAmountAdjusted;
            let newStatus = inv.status;
            if (newBalanceDue <= 0) newStatus = InvoiceStatus.COLLECTED_PAYMENT;
            else if (newAmountAdjusted > 0 || (inv.amountPaid || 0) > 0) newStatus = InvoiceStatus.PARTIAL;
            return { ...inv, amountAdjusted: newAmountAdjusted, balanceDue: newBalanceDue, status: newStatus };
          }
          return inv;
        }));
      }

      return updatedAdjustments;
    });
    
    addAuditLog('Record Adjustment', `${adjustment.type} of LKR ${adjustment.amount.toLocaleString()} for ${adjustment.clientName}.`, 'Accounting');
  };

  const deletePayment = (id: string) => {
    const payment = payments.find(p => p.id === id);
    if (!payment) return;
    setPayments(prev => prev.filter(p => p.id !== id));
    
    if (payment.invoiceId) {
      setInvoices(prev => prev.map(inv => {
        if (inv.id === payment.invoiceId) {
          const newAmountPaid = inv.amountPaid - payment.amount;
          const newBalanceDue = inv.grandTotal - newAmountPaid - (inv.amountAdjusted || 0);
          let newStatus = inv.status;
          if (newAmountPaid <= 0) newStatus = 'Unpaid' as any;
          else if (newBalanceDue > 0) newStatus = 'Partial' as any;
          return { ...inv, amountPaid: newAmountPaid, balanceDue: newBalanceDue, status: newStatus };
        }
        return inv;
      }));
    }
    addAuditLog('Delete Payment', `Payment ${payment.paymentNo} was deleted.`, 'General', payment.projectName);
  };

  const deleteAdjustment = (id: string) => {
    const adjustment = adjustments.find(a => a.id === id);
    if (!adjustment) return;
    setAdjustments(prev => prev.filter(a => a.id !== id));
    
    if (adjustment.invoiceId) {
      setInvoices(prev => prev.map(inv => {
        if (inv.id === adjustment.invoiceId) {
          const newAmountAdjusted = (inv.amountAdjusted || 0) - adjustment.amount;
          const newBalanceDue = inv.grandTotal - inv.amountPaid - newAmountAdjusted;
          let newStatus = inv.status;
          if (newBalanceDue > 0 && inv.status === InvoiceStatus.COLLECTED_PAYMENT) newStatus = InvoiceStatus.PARTIAL;
          return { ...inv, amountAdjusted: newAmountAdjusted, balanceDue: newBalanceDue, status: newStatus };
        }
        return inv;
      }));
    }
    addAuditLog('Delete Adjustment', `Adjustment ${adjustment.type} was deleted.`, 'General');
  };

  const customerFinancials = useMemo(() => {
    return clients.map(client => {
      const clientInvoices = invoices.filter(inv => inv.client.id === client.id);
      const clientPayments = payments.filter(p => p.clientId === client.id);
      const clientAdjustments = adjustments.filter(a => a.clientId === client.id);
      
      const totalInvoiced = clientInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
      const totalPaid = clientPayments.reduce((sum, p) => sum + p.amount, 0);
      const totalAdjusted = clientAdjustments.reduce((sum, a) => sum + a.amount, 0);
      const totalRetention = clientInvoices.reduce((sum, inv) => sum + (inv.retentionAmount || 0), 0);
      const totalRetentionReleased = clientAdjustments.filter(a => a.type === 'Retention Release').reduce((sum, a) => sum + a.amount, 0);
      
      const outstandingBalance = totalInvoiced - totalPaid - totalAdjusted;
      
      // Bad Debt Analysis: Cancelled or Overdue > 90 days
      const totalBadDebt = clientInvoices
        .filter(inv => inv.status === InvoiceStatus.CANCELLED || (inv.balanceDue > 0 && new Date(inv.dueDate) < new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)))
        .reduce((sum, inv) => sum + inv.balanceDue, 0);

      // Aging
      const now = new Date();
      const aging = {
        current: 0,
        '1-30': 0,
        '31-60': 0,
        '61-90': 0,
        '90+': 0
      };
      
      clientInvoices.forEach(inv => {
        if (inv.status === InvoiceStatus.COLLECTED_PAYMENT) return;
        const dueDate = new Date(inv.dueDate);
        const diffDays = Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        const balance = inv.balanceDue;
        
        if (diffDays <= 0) aging.current += balance;
        else if (diffDays <= 30) aging['1-30'] += balance;
        else if (diffDays <= 60) aging['31-60'] += balance;
        else if (diffDays <= 90) aging['61-90'] += balance;
        else aging['90+'] += balance;
      });
      
      return {
        clientId: client.id,
        totalInvoiced,
        totalPaid,
        totalAdjusted,
        totalRetention,
        totalRetentionReleased,
        outstandingBalance,
        totalBadDebt,
        aging,
        lastPaymentDate: clientPayments.length > 0 ? clientPayments[clientPayments.length - 1].date : undefined
      };
    });
  }, [clients, invoices, payments, adjustments]);

  const projectFinancials = useMemo(() => {
    return projects.map(project => {
      const projectInvoices = invoices.filter(inv => inv.projectId === project.id);
      const projectPayments = payments.filter(p => p.projectId === project.id);
      
      const totalInvoiced = projectInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
      const totalPaid = projectPayments.reduce((sum, p) => sum + p.amount, 0);
      const totalRetention = projectInvoices.reduce((sum, inv) => sum + (inv.retentionAmount || 0), 0);
      const totalRetentionReleased = adjustments.filter(a => a.projectId === project.id && a.type === 'Retention Release').reduce((sum, a) => sum + a.amount, 0);
      
      return {
        projectId: project.id,
        projectName: project.projectName,
        contractValue: project.originalSum || project.totalValue,
        variationsValue: project.totalValue - (project.originalSum || project.totalValue),
        totalValue: project.totalValue,
        totalInvoiced,
        totalPaid,
        totalRetention,
        totalRetentionReleased,
        balanceToInvoice: project.totalValue - totalInvoiced,
        balanceToCollect: totalInvoiced - totalPaid
      };
    });
  }, [projects, invoices, payments, adjustments]);

  return {
    quotes, setQuotes,
    itemCategories, setItemCategories,
    saveItemCategory: (category: ItemCategory) => {
      setItemCategories(prev => {
        const index = prev.findIndex(c => c.id === category.id);
        if (index >= 0) {
          const next = [...prev];
          next[index] = category;
          return next;
        }
        return [...prev, category];
      });
    },
    deleteItemCategory: (id: string) => {
      setItemCategories(prev => prev.filter(c => c.id !== id));
    },
    projects, setProjects,
    clients, setClients,
    invoices, setInvoices,
    payments, setPayments,
    adjustments, setAdjustments,
    auditLogs, setAuditLogs,
    notifications, setNotifications,
    templates, setTemplates,
    itemTemplates, setItemTemplates,
    companySettings, setCompanySettings,
    customerFinancials, projectFinancials,
    saveQuote, deleteQuote, updateQuoteStatus,
    saveProject, deleteProject,
    saveInvoice, deleteInvoice, savePayment, deletePayment, saveAdjustment, deleteAdjustment,
    addAuditLog, addNotification,
    uploadRetentionEvidence: (invoiceId: string, evidenceUrl: string) => {
      setRetentionEvidence(prev => ({ ...prev, [invoiceId]: evidenceUrl }));
      addNotification('Retention Evidence Uploaded', `Evidence for invoice ${invoiceId} has been uploaded.`, 'info', 'Accounting', 'medium');
      addAuditLog('Evidence Uploaded', `Retention evidence uploaded for invoice ${invoiceId}`, 'Accounting');
    },
    retentionEvidence,
    updateProjectStatus: (projectId: string, newStatus: Project['status']) => {
      const project = projects.find(p => p.id === projectId);
      if (project && project.status !== newStatus) {
        setProjects(prev => prev.map(p => p.id === projectId ? { ...p, status: newStatus } : p));
        addAuditLog('Status Updated', `Project status changed from ${project.status} to ${newStatus}`, 'Status', project.projectName);
        addNotification('Project Status Updated', `Project "${project.projectName}" is now ${newStatus}`, 'info', 'Status', 'medium', { label: 'View Project', view: 'project-details', data: { projectId: project.id } });
      }
    },
    restoreData: (data: any) => {
      if (data.quotes) setQuotes(data.quotes);
      if (data.projects) setProjects(data.projects);
      if (data.clients) setClients(data.clients);
      if (data.invoices) setInvoices(data.invoices || []);
      if (data.payments) setPayments(data.payments || []);
      if (data.adjustments) setAdjustments(data.adjustments || []);
      if (data.auditLogs) setAuditLogs(data.auditLogs || []);
      if (data.notifications) setNotifications(data.notifications || []);
      if (data.templates) setTemplates(data.templates);
      if (data.companySettings) setCompanySettings(data.companySettings);
      addNotification('Data Restored', 'System data has been restored successfully.', 'success');
      addAuditLog('System Restore', 'All data was restored from a backup file.', 'System');
    },
    saveClient: (client: Client) => {
      let savedClient = { ...client };
      if (!savedClient.id) {
        savedClient.id = crypto.randomUUID();
      }

      if (!savedClient.debtorAccountNo) {
        savedClient.debtorAccountNo = numberingService.consumeNextNumber('customer');
      }
      if (!savedClient.cvcCode) {
        const cvcSeq = numberingService.getSequence('customer_cvc');
        const prefix = cvcSeq?.prefix || 'CV';
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        const segment = (len: number) => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
        const cvcCode = `${prefix}-${segment(5)}-${segment(5)}-${segment(5)}`;
        numberingService.consumeNextNumber('customer_cvc');
        savedClient.cvcCode = cvcCode;

        // Register in Verification Registry
        const newEntry: VerificationRegistryEntry = {
          id: crypto.randomUUID(),
          svcCode: cvcCode,
          documentType: 'Client',
          documentRef: savedClient.name,
          internalId: savedClient.id,
          generatedAt: new Date().toISOString(),
          generatedBy: 'System Automator',
          status: 'Active',
          version: 1,
          metadata: {
            customerName: savedClient.name,
            isCurrent: true,
            clientDetails: {
              name: savedClient.name,
              company: savedClient.tradeName || savedClient.name,
              category: savedClient.category,
              status: savedClient.status
            }
          },
          accessCount: 0
        };
        setVerificationRegistry(prev => [newEntry, ...prev]);
      } else {
        // Update registry if details changed
        setVerificationRegistry(prev => prev.map(entry => {
          if (entry.svcCode === savedClient.cvcCode) {
            return {
              ...entry,
              metadata: {
                ...entry.metadata,
                clientDetails: {
                  name: savedClient.name,
                  company: savedClient.tradeName || savedClient.name,
                  category: savedClient.category,
                  status: savedClient.status
                }
              }
            };
          }
          return entry;
        }));
      }

      setClients(prev => {
        const index = prev.findIndex(c => c.id === savedClient.id);
        if (index >= 0) {
          const newClients = [...prev];
          newClients[index] = savedClient;
          return newClients;
        }
        return [savedClient, ...prev];
      });
      addAuditLog('Save Client', `Client ${savedClient.name} was saved.`, 'General');
      return savedClient;
    },
    deleteClient: (id: string) => {
      const client = clients.find(c => c.id === id);
      setClients(prev => prev.filter(c => c.id !== id));
      addAuditLog('Delete Client', `Client ${client?.name || id} was deleted.`, 'General');
    },
    deleteItemTemplate: (id: string) => {
      const template = itemTemplates.find(t => t.id === id);
      setItemTemplates(prev => prev.filter(t => t.id !== id));
      addAuditLog('Delete Item Template', `Item template "${template?.name || id}" was deleted.`, 'General');
      addNotification('Template Deleted', `Item template "${template?.name || 'Item'}" has been removed.`, 'info');
    },
    saveItemTemplate: (template: ItemTemplate) => {
      let savedTemplate = { ...template };
      if (!savedTemplate.id) {
        savedTemplate.id = crypto.randomUUID();
      }

      if (!savedTemplate.productCode) {
        savedTemplate.productCode = numberingService.consumeNextNumber('boq_item');
      }
      // Generate PVC for Item Template if missing
      if (!savedTemplate.pvcCode) {
        const pvcSeq = numberingService.getSequence('product_pvc');
        const prefix = pvcSeq?.prefix || 'PV';
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        const segment = (len: number) => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
        const pvcCode = `${prefix}-${segment(5)}-${segment(5)}-${segment(5)}`;
        numberingService.consumeNextNumber('product_pvc');
        savedTemplate.pvcCode = pvcCode;
        savedTemplate.barcode = `B-${segment(8)}`;

        // Register in Verification Registry
        const newEntry: VerificationRegistryEntry = {
          id: crypto.randomUUID(),
          svcCode: pvcCode,
          documentType: 'Product',
          documentRef: savedTemplate.productCode || savedTemplate.name,
          internalId: savedTemplate.id,
          generatedAt: new Date().toISOString(),
          generatedBy: 'System Automator',
          status: 'Active',
          version: 1,
          metadata: {
            customerName: 'Universal Inventory',
            isCurrent: true,
            productDetails: {
              sku: savedTemplate.productCode || 'N/A',
              name: savedTemplate.name,
              family: savedTemplate.category,
              category: savedTemplate.subCategory || savedTemplate.category,
              status: savedTemplate.status
            }
          },
          accessCount: 0
        };
        setVerificationRegistry(prev => [newEntry, ...prev]);
      } else {
        // Update registry if details changed
        setVerificationRegistry(prev => prev.map(entry => {
          if (entry.svcCode === savedTemplate.pvcCode) {
            return {
              ...entry,
              metadata: {
                ...entry.metadata,
                productDetails: {
                  sku: savedTemplate.productCode || 'N/A',
                  name: savedTemplate.name,
                  family: savedTemplate.category,
                  category: savedTemplate.subCategory || savedTemplate.category,
                  status: savedTemplate.status
                }
              }
            };
          }
          return entry;
        }));
      }

      setItemTemplates(prev => {
        const index = prev.findIndex(t => t.id === savedTemplate.id);
        if (index >= 0) {
          const newTemplates = [...prev];
          newTemplates[index] = savedTemplate;
          return newTemplates;
        }
        return [savedTemplate, ...prev];
      });
      addAuditLog('Save Item Template', `Item template "${savedTemplate.name}" was saved.`, 'General');
    },
    saveProductVariant: (variant: ProductVariant) => {
      let savedVariant = { ...variant };
      if (!savedVariant.id) {
        savedVariant.id = crypto.randomUUID();
      }
      savedVariant.updatedAt = new Date().toISOString();

      const otherVariants = productVariants.filter(v => v.id !== savedVariant.id);
      const parentItem = itemTemplates.find(it => it.id === savedVariant.itemId);

      // 1. Guarantee unique variantCode
      if (!savedVariant.variantCode || !isVariantCodeUnique(savedVariant.variantCode, otherVariants, savedVariant.id)) {
        savedVariant.variantCode = generateVariantCode(
          parentItem || savedVariant.itemId || 'AL-WIN',
          savedVariant.attributes || {},
          otherVariants,
          savedVariant.id
        );
      }

      // 2. Guarantee unique barcode
      if (!savedVariant.barcode || !isVariantBarcodeUnique(savedVariant.barcode, otherVariants, itemTemplates, savedVariant.id)) {
        savedVariant.barcode = generateUniqueVariantBarcode(
          parentItem || savedVariant.itemId || 'ALW',
          savedVariant.attributes || {},
          otherVariants,
          itemTemplates,
          savedVariant.id
        );
      }

      // Generate PVC for Variant if missing
      if (!savedVariant.pvcCode) {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        const segment = (len: number) => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
        const pvcCode = `PV-${segment(5)}-${segment(5)}-${segment(5)}`;
        savedVariant.pvcCode = pvcCode;
      }

      // Register in Verification Registry
      const newEntry: VerificationRegistryEntry = {
        id: crypto.randomUUID(),
        svcCode: savedVariant.pvcCode,
        documentType: 'Product',
        documentRef: savedVariant.variantCode,
        internalId: savedVariant.id,
        generatedAt: new Date().toISOString(),
        generatedBy: 'Variant Engine',
        status: 'Active',
        version: 1,
        metadata: {
          customerName: 'Universal Inventory',
          isCurrent: true,
          productDetails: {
            sku: savedVariant.variantCode,
            barcode: savedVariant.barcode,
            name: savedVariant.variantName,
            family: savedVariant.categoryName || 'General',
            category: savedVariant.categoryName || 'General',
            status: 'Active'
          }
        },
        accessCount: 0
      };
      setVerificationRegistry(prev => [newEntry, ...prev.filter(e => e.internalId !== savedVariant.id)]);

      setProductVariants(prev => {
        const index = prev.findIndex(v => v.id === savedVariant.id);
        if (index >= 0) {
          const newVariants = [...prev];
          newVariants[index] = savedVariant;
          return newVariants;
        }
        return [savedVariant, ...prev];
      });
      addAuditLog('Save Variant', `Variant "${savedVariant.variantCode}" [Barcode: ${savedVariant.barcode}] - ${savedVariant.variantName} was saved. Rate: LKR ${savedVariant.pricing?.sellingPrice?.toLocaleString() || 0}`, 'General');
    },
    bulkSaveProductVariants: (variantsToSave: ProductVariant[]) => {
      if (!variantsToSave || variantsToSave.length === 0) return;

      const ensuredList = ensureVariantsHaveUniqueCodesAndBarcodes(variantsToSave, itemTemplates);

      setProductVariants(prev => {
        const map = new Map<string, ProductVariant>();
        prev.forEach(v => map.set(v.id, v));
        ensuredList.forEach(v => map.set(v.id, v));
        return Array.from(map.values());
      });

      addAuditLog(
        'Batch Save Variants', 
        `Generated and saved ${ensuredList.length} variants with guaranteed unique codes and barcodes.`,
        'General'
      );
      toast.success(`Successfully saved ${ensuredList.length} variants with unique codes & barcodes!`);
    },
    deleteProductVariant: (id: string) => {
      const v = productVariants.find(item => item.id === id);
      setProductVariants(prev => prev.filter(item => item.id !== id));
      if (v) {
        addAuditLog('Delete Variant', `Variant "${v.variantCode}" was removed from catalog.`, 'General');
      }
    },
    approveVariant: (variantId: string, approverName: string = 'Senior QS Manager') => {
      setProductVariants(prev => prev.map(v => {
        if (v.id === variantId) {
          return {
            ...v,
            status: 'ACTIVE',
            approvedBy: approverName,
            approvedAt: new Date().toISOString()
          };
        }
        return v;
      }));
      addAuditLog('Approve Variant', `Variant ${variantId} approved for tender usage by ${approverName}.`, 'General');
    },
    bulkUpdateVariantPrices: (rule: BulkPriceUpdateRule) => {
      const previewDiffs = simulateBulkPriceUpdate(productVariants, rule);
      const diffMap = new Map(previewDiffs.map(d => [d.variantId, d]));

      setProductVariants(prev => prev.map(v => {
        const diff = diffMap.get(v.id);
        if (!diff) return v;

        const currentPricing = v.pricing || {
          costPrice: diff.oldCost,
          minimumPrice: 0,
          standardPrice: diff.oldSellingPrice,
          sellingPrice: diff.oldSellingPrice,
          pricingMethod: 'Cost + Markup' as const,
          markupPercent: 0,
          grossMarginPercent: 0,
          grossProfit: 0,
          priceSource: 'SUPPLIER_QUOTATION' as const,
          currency: 'LKR',
          effectiveFrom: rule.effectiveDate,
          lastUpdated: new Date().toISOString()
        };

        const updatedPricing = {
          ...currentPricing,
          costPrice: diff.newCost,
          sellingPrice: diff.newSellingPrice,
          standardPrice: diff.newSellingPrice,
          grossMarginPercent: diff.newMarginPercent,
          markupPercent: diff.newCost > 0 ? Math.round(((diff.newSellingPrice - diff.newCost) / diff.newCost) * 1000) / 10 : 0,
          grossProfit: diff.newSellingPrice - diff.newCost,
          lastUpdated: new Date().toISOString(),
          effectiveFrom: rule.effectiveDate
        };

        const historyEntry = {
          id: crypto.randomUUID(),
          date: rule.effectiveDate,
          oldSellingPrice: diff.oldSellingPrice,
          newSellingPrice: diff.newSellingPrice,
          oldCostPrice: diff.oldCost,
          newCostPrice: diff.newCost,
          markupPercent: updatedPricing.markupPercent,
          marginPercent: diff.newMarginPercent,
          reason: `Bulk Update: ${rule.reason}`,
          changedBy: rule.updatedBy
        };

        return {
          ...v,
          pricing: updatedPricing,
          priceHistory: [historyEntry, ...(v.priceHistory || [])]
        };
      }));

      addAuditLog('Bulk Price Update', `Bulk price update applied across ${previewDiffs.length} variants. Reason: ${rule.reason}`, 'Accounting');
      return previewDiffs;
    },
    importSupplierPrices: (importedVariants: ProductVariant[]) => {
      let count = 0;
      setProductVariants(prev => {
        const map = new Map(prev.map(v => [v.id, v]));
        importedVariants.forEach(inv => {
          map.set(inv.id, inv);
          count++;
        });
        return Array.from(map.values());
      });
      addAuditLog('Import Supplier Prices', `Imported ${count} material rates and updated variant pricing.`, 'Accounting');
      return count;
    },
    saveQuotationSnapshot: (snapshot: QuotationPriceSnapshot) => {
      setQuotationSnapshots(prev => {
        const idx = prev.findIndex(s => s.id === snapshot.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = snapshot;
          return updated;
        }
        return [snapshot, ...prev];
      });
    },
    quotationSnapshots,
    tags, 
    addTag: (tag: string) => {
      if (!tags.includes(tag)) {
        setTags(prev => [...prev, tag]);
        return true;
      }
      return false;
    },
    inquiries,
    saveInquiry: (inquiry: Inquiry) => {
      setInquiries(prev => {
        const index = prev.findIndex(i => i.id === inquiry.id);
        if (index >= 0) {
          const newInquiries = [...prev];
          newInquiries[index] = inquiry;
          return newInquiries;
        }
        return [inquiry, ...prev];
      });
      addNotification('New Inquiry', `Inquiry regarding ${inquiry.regardingType} received.`, 'info', 'General', 'medium', { label: 'View Inquiries', view: 'dashboard' });
    },
    serviceRequests,
    saveServiceRequest: (request: ServiceVisitRequest) => {
      setServiceRequests(prev => {
        const index = prev.findIndex(r => r.id === request.id);
        if (index >= 0) {
          const newRequests = [...prev];
          newRequests[index] = request;
          return newRequests;
        }
        return [request, ...prev];
      });
      addNotification('Service Request', `New service visit request received.`, 'warning', 'General', 'high');
    },
    productFamilies,
    saveProductFamily: (family: ProductFamily) => {
      setProductFamilies(prev => {
        const index = prev.findIndex(f => f.id === family.id);
        if (index >= 0) {
          const newFamilies = [...prev];
          newFamilies[index] = family;
          return newFamilies;
        }
        return [family, ...prev];
      });
    },
    deleteProductFamily: (id: string) => {
      setProductFamilies(prev => prev.filter(f => f.id !== id));
      // Also delete related variants
      setProductVariants(prev => prev.filter(v => v.familyId !== id));
    },
    productVariants,
    rateVersions,
    setRateVersions,
    saveRateVersion: (version: RateVersion) => {
      setRateVersions(prev => {
        const index = prev.findIndex(r => r.id === version.id);
        if (index >= 0) {
          const newVersions = [...prev];
          newVersions[index] = version;
          return newVersions;
        }
        return [version, ...prev];
      });
    },

    generatePVCForBOQItem: (item: BOQItem): string => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      const segment = (len: number) => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      const pvcCode = `PV-${segment(5)}-${segment(5)}-${segment(5)}`;
      
      // Register in Verification Registry
      const newEntry: VerificationRegistryEntry = {
        id: crypto.randomUUID(),
        svcCode: pvcCode,
        documentType: 'Product',
        documentRef: item.name,
        internalId: item.id,
        generatedAt: new Date().toISOString(),
        generatedBy: 'Direct Entry',
        status: 'Active',
        version: 1,
        metadata: {
          customerName: 'Direct Quote Item',
          isCurrent: true,
          productDetails: {
            sku: 'Custom',
            name: item.name,
            family: 'Custom',
            category: 'Custom',
            status: 'Active'
          }
        },
        accessCount: 0
      };
      setVerificationRegistry(prev => [newEntry, ...prev]);
      return pvcCode;
    },

    // --- Document Verification Service ---
    verificationRegistry,
    registerDocument: (
      docType: DocumentType, 
      docRef: string, 
      internalId: string, 
      metadata: VerificationRegistryEntry['metadata'],
      version: number = 1
    ) => {
      const svcSeq = numberingService.getSequence('system_svc');
      const svcPrefix = svcSeq?.prefix || 'SV';
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      const segment = (len: number) => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      const svcCode = `${svcPrefix}-${segment(5)}-${segment(5)}-${segment(5)}`;
      numberingService.consumeNextNumber('system_svc');
      
      const newEntry: VerificationRegistryEntry = {
        id: crypto.randomUUID(),
        svcCode,
        documentType: docType,
        documentRef: docRef,
        internalId,
        generatedAt: new Date().toISOString(),
        generatedBy: 'System Automator',
        status: 'Active',
        version,
        metadata: { ...metadata, isCurrent: true },
        accessCount: 0
      };

      setVerificationRegistry(prev => [newEntry, ...prev]);
      return svcCode;
    },
    verifySVC: (code: string) => {
      const entry = verificationRegistry.find(e => e.svcCode.toUpperCase() === code.toUpperCase());
      if (entry) {
        setVerificationRegistry(prev => prev.map(e => e.id === entry.id ? { ...e, accessCount: e.accessCount + 1, lastAccessed: new Date().toISOString() } : e));
      }
      return entry;
    },
    
    // --- New Modules State ---
    suppliers, setSuppliers,
    purchaseOrders, setPurchaseOrders,
    personnel, setPersonnel,
    equipment, setEquipment,
    projectPhases, setProjectPhases,
    inspectionResults, setInspectionResults,
    ncrs, setNcrs,
    warrantyCertificates, setWarrantyCertificates,

    saveSupplier: (supplier: Supplier) => {
      setSuppliers(prev => {
        const index = prev.findIndex(s => s.id === supplier.id);
        if (index >= 0) {
          const newSuppliers = [...prev];
          newSuppliers[index] = supplier;
          return newSuppliers;
        }
        return [supplier, ...prev];
      });
    },
    deleteSupplier: (id: string) => {
      setSuppliers(prev => prev.filter(s => s.id !== id));
      addAuditLog('Delete Supplier', `Supplier ${id} removed`, 'General');
    },
    savePurchaseOrder: (po: PurchaseOrder) => {
      setPurchaseOrders(prev => {
        const index = prev.findIndex(p => p.id === po.id);
        if (index >= 0) {
          const newPOs = [...prev];
          newPOs[index] = po;
          return newPOs;
        }
        return [po, ...prev];
      });
    },
    deletePurchaseOrder: (id: string) => {
      setPurchaseOrders(prev => prev.filter(p => p.id !== id));
      addAuditLog('Delete PO', `Purchase order ${id} removed`, 'General');
    },
    savePersonnel: (person: Personnel) => {
      setPersonnel(prev => {
        const index = prev.findIndex(p => p.id === person.id);
        if (index >= 0) {
          const newPersonnel = [...prev];
          newPersonnel[index] = person;
          return newPersonnel;
        }
        return [person, ...prev];
      });
    },
    deletePersonnel: (id: string) => {
      setPersonnel(prev => prev.filter(p => p.id !== id));
      addAuditLog('Delete Personnel', `Personnel record ${id} removed`, 'General');
    },
    saveEquipment: (device: Equipment) => {
      setEquipment(prev => {
        const index = prev.findIndex(e => e.id === device.id);
        if (index >= 0) {
          const newEquipment = [...prev];
          newEquipment[index] = device;
          return newEquipment;
        }
        return [device, ...prev];
      });
    },
    deleteEquipment: (id: string) => {
      setEquipment(prev => prev.filter(e => e.id !== id));
      addAuditLog('Delete Equipment', `Equipment asset ${id} removed`, 'General');
    },
    saveProjectPhase: (phase: ProjectPhase) => {
      setProjectPhases(prev => {
        const index = prev.findIndex(p => p.id === phase.id);
        if (index >= 0) {
          const newPhases = [...prev];
          newPhases[index] = phase;
          return newPhases;
        }
        return [phase, ...prev];
      });
    },
    deleteProjectPhase: (id: string) => {
      setProjectPhases(prev => prev.filter(p => p.id !== id));
    },
    saveInspectionResult: (result: InspectionResult) => {
      setInspectionResults(prev => {
        const index = prev.findIndex(r => r.id === result.id);
        if (index >= 0) {
          const newResults = [...prev];
          newResults[index] = result;
          return newResults;
        }
        return [result, ...prev];
      });
    },
    deleteInspectionResult: (id: string) => {
      setInspectionResults(prev => prev.filter(r => r.id !== id));
      addAuditLog('Delete Inspection', `Inspection record ${id} removed`, 'General');
    },
    saveNCR: (ncr: NonConformanceReport) => {
      setNcrs(prev => {
        const index = prev.findIndex(n => n.id === ncr.id);
        if (index >= 0) {
          const newNcrs = [...prev];
          newNcrs[index] = ncr;
          return newNcrs;
        }
        return [ncr, ...prev];
      });
    },
    deleteNCR: (id: string) => {
      setNcrs(prev => prev.filter(n => n.id !== id));
      addAuditLog('Delete NCR', `Non-conformance report ${id} removed`, 'General');
    },
    saveWarrantyCertificate: (cert: WarrantyCertificate) => {
      setWarrantyCertificates(prev => {
        const index = prev.findIndex(c => c.id === cert.id);
        if (index >= 0) {
          const newCerts = [...prev];
          newCerts[index] = cert;
          return newCerts;
        }
        return [cert, ...prev];
      });
    },
    deleteWarrantyCertificate: (id: string) => {
      setWarrantyCertificates(prev => prev.filter(c => c.id !== id));
      addAuditLog('Delete Warranty', `Warranty certificate ${id} removed`, 'General');
    },
    deleteServiceRequest: (id: string) => {
      setServiceRequests(prev => prev.filter(r => r.id !== id));
    },
    deleteInquiry: (id: string) => {
      setInquiries(prev => prev.filter(i => i.id !== id));
    },
    deleteRateVersion: (id: string) => {
      setRateVersions(prev => prev.filter(r => r.id !== id));
    },

    // --- Specs & Calcs ---
    specificationLibrary,
    saveSpecification: (spec: SpecificationLibraryItem) => {
      setSpecificationLibrary(prev => {
        const index = prev.findIndex(s => s.id === spec.id);
        if (index >= 0) {
          const next = [...prev];
          next[index] = spec;
          return next;
        }
        return [spec, ...prev];
      });
    },
    deleteSpecification: (id: string) => {
      setSpecificationLibrary(prev => prev.filter(s => s.id !== id));
    },
    calculationSheets,
    saveCalculationSheet: (sheet: CalculationLibrarySheet) => {
      setCalculationSheets(prev => {
        const index = prev.findIndex(s => s.id === sheet.id);
        if (index >= 0) {
          const next = [...prev];
          next[index] = sheet;
          return next;
        }
        return [sheet, ...prev];
      });
    },
    deleteCalculationSheet: (id: string) => {
      setCalculationSheets(prev => prev.filter(s => s.id !== id));
    }
  };
};
