import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  Home,
  Layout, 
  History, 
  Settings, 
  Plus, 
  FileText, 
  Download, 
  CheckCircle2, 
  Calendar, 
  User, 
  Clock, 
  CreditCard, 
  Search,
  Info,
  Building2,
  X,
  PlusCircle,
  Bell,
  BarChart3,
  Package,
  ShieldCheck,
  GanttChart,
  HardHat,
  Wrench,
  Medal,
  Users,
  Radio,
  Store,
  ChevronDown,
  ExternalLink,
  Menu,
  FileSpreadsheet,
  Scale,
  FolderTree,
  SlidersHorizontal,
  Cpu,
  TrendingUp,
  LogOut,
  ChevronRight,
  RotateCw,
  MessageSquare,
  Mail
} from 'lucide-react';
import { ConfirmationModal } from './components/ConfirmationModal';
import { DataImportModal } from './components/data-import/DataImportModal';
import { ImportEntityType } from './services/dataImportService';
import { 
  Quote, 
  BOQItem, 
  QuoteStatus, 
  ItemTemplate,
  MeasurementSheet,
  MeasurementRow,
  MeasurementUnit,
  CalculationMethod,
  PdfLayout,
  QuoteTemplate,
  Notification,
  Invoice,
  InvoiceType,
  InvoiceStatus,
  Payment,
  Adjustment,
  Project,
  Client,
  ProjectActualCostRecord,
  ProductVariant
} from './types';
import { ProjectManager } from './components/ProjectManager';
import { ProjectLifecyclePortal } from './components/ProjectLifecyclePortal';
import { QualityControlPortal } from './components/QualityControlPortal';
import { ResourceManagementPortal } from './components/ResourceManagementPortal';
import { WorkforceTab } from './components/workforce/WorkforceLandingPage';
import { EquipmentManagementPortal } from './components/EquipmentManagementPortal';
import { EquipmentTab } from './components/equipment/EquipmentLandingPage';
import { SiteManagementPortal } from './components/SiteManagementPortal';
import { WarrantyPortal } from './components/WarrantyPortal';
import { WarrantyTab } from './components/warranty/WarrantyLandingPage';
import { QuotePortal } from './components/QuotePortal';
import { generateDefaultJobsForItem } from './lib/utils';
import { ItemCatalog } from './components/ItemCatalog';
import { QuoteTemplateManager } from './components/QuoteTemplateManager';
import { SaveTemplateModal } from './components/SaveTemplateModal';
import { Settings as SettingsComponent, SettingsTab } from './components/Settings';
import { SecurityTab } from './components/security/AccessControlCenter';
import { NotificationCenter } from './components/NotificationCenter';
import { Toaster, toast } from 'sonner';
import { 
  generateVariationReport, 
  generateFullSystemSnapshotPDF,
  generateSystemWideDocumentsZIP
} from './pdfGenerator';
import { Dashboard, DashboardPerspective } from './components/Dashboard';
import { PricingIntelligenceDashboard } from './components/PricingIntelligenceDashboard';
import { BulkPriceUpdateRule, simulateBulkPriceUpdate } from './services/bomPricingService';
import { ProjectVariationEditor } from './components/ProjectVariationEditor';
import { InvoiceManager } from './components/InvoiceManager';
import { AccountingPortal } from './components/AccountingPortal';
import { ReportingPortal } from './components/ReportingPortal';
import { BOQItemManager, BOQTab } from './components/BOQItemManager';
import { DownloadPortal } from './components/DownloadPortal';
import { ClientManager } from './components/ClientManager';
import { CustomerPortal } from './components/CustomerPortal';
import { DocumentVerificationPortal } from './components/DocumentVerificationPortal';
import { StealthCommunicationTunnel } from './components/StealthCommunicationTunnel';
import { ProjectPostEvaluationPortal } from './components/ProjectPostEvaluationPortal';
import { VariationManagerPortal } from './components/VariationManagerPortal';
import { ProcurementHub, ProcurementTab } from './components/procurement/ProcurementHub';
import { ProcurementCostManager } from './components/procurement/ProcurementCostManager';
import { procurementService } from './services/procurementService';
import { PayrollCenter } from './components/payroll/PayrollCenter';
import { generateSeedActualCostRecords } from './services/costEvaluationService';
import { numberingService } from './services/numberingService';
import { OperationalControlCenter, OperationalPortalId } from './components/operations/OperationalControlCenter';
import { approvalSlaAlertService, subscribeSlaUpdates } from './services/approvalSlaAlertService';
import { notificationNewsService } from './services/notificationNewsService';
import { HomePage } from './components/HomePage';
import { NestedNavDropdown } from './components/NestedNavDropdown';
import { getNavigationTabs } from './navigationConfig';
import { motion, AnimatePresence } from 'motion/react';
import { cn, getQuoteTotalBreakdown } from './lib/utils';
import { useSecurity } from './context/SecurityContext';
import { useTheme, THEME_MODE_OPTIONS } from './context/ThemeContext';
import { ThemeModeDropdown } from './components/common/ThemeModeDropdown';
import { loginMediaService } from './services/loginMediaService';
import { LoginPage } from './components/auth/LoginPage';
import { securityService } from './services/securityService';
import { centralEmailService } from './services/centralEmailService';
import { SYSTEM_PORTAL_DIRECTORY, centralMessagingService } from './services/centralMessagingService';
import { getUniquePortalForUser } from './utils/userPortalRouting';
import { SecurityUser } from './types/security';
import { UniversalGlobalSearchBar } from './components/common/UniversalGlobalSearchBar';
import { buildSystemUniversalSearchIndex, SearchAccessContext } from './services/universalSearchService';

import { useQuoteData } from './hooks/useQuoteData';
import { INITIAL_QUOTE, SAMPLE_CLIENTS, INITIAL_COMPANY_SETTINGS } from './constants';

export default function App() {
  const {
    quotes, setQuotes,
    projects, setProjects,
    clients, setClients,
    invoices, setInvoices,
    payments, setPayments,
    adjustments, setAdjustments,
    auditLogs, setAuditLogs,
    notifications, setNotifications,
    templates, setTemplates,
    companySettings, setCompanySettings,
    saveQuote, deleteQuote: deleteQuoteHook, updateQuoteStatus,
    saveProject, deleteProject: deleteProjectHook,
    saveInvoice, deleteInvoice,
    savePayment, deletePayment, saveAdjustment, deleteAdjustment,
    saveClient, deleteClient,
    saveInquiry, deleteInquiry, saveServiceRequest, deleteServiceRequest,
    inquiries, serviceRequests,
    deleteItemTemplate, saveItemTemplate,
    updateProjectStatus,
    restoreData,
    itemTemplates, setItemTemplates,
    itemCategories,
    productFamilies,
    productVariants,
    rateVersions,
    saveProductFamily,
    deleteProductFamily,
    saveProductVariant,
    saveRateVersion,
    verificationRegistry,
    registerDocument,
    verifySVC,
    generatePVCForBOQItem,
    personnel, setPersonnel,
    equipment, setEquipment,
    projectPhases,
    inspectionResults,
    ncrs,
    warrantyCertificates
  } = useQuoteData();

  const addNotification = (
    title: string | Omit<Notification, 'id' | 'timestamp' | 'isRead'>,
    message?: string,
    type: Notification['type'] = 'info',
    category: Notification['category'] = 'General',
    priority: Notification['priority'] = 'low',
    action?: Notification['action'],
    id?: string
  ) => {
    const titleText = typeof title === 'object' ? title.title : title;
    const messageText = typeof title === 'object' ? title.message : message;
    const typeStr = typeof title === 'object' ? title.type : type;

    const resolvedId = id || (typeof title === 'object' ? (title as any).id : undefined) || crypto.randomUUID();
    const currentActorId = (securityService.getCurrentUser())?.id;

    const newNotif: Notification = typeof title === 'object' 
      ? { targetUserId: currentActorId, ...title, id: resolvedId, timestamp: new Date().toISOString(), isRead: false } as Notification
      : {
          id: resolvedId,
          title,
          message: message || '',
          timestamp: new Date().toISOString(),
          type: typeStr || 'info',
          category,
          priority,
          isRead: false,
          targetUserId: currentActorId,
          action
        };

    setNotifications(prev => {
      if (prev.some(n => n.id === newNotif.id)) {
        return prev;
      }
      const toastFn = typeStr === 'error' ? toast.error : 
                    typeStr === 'success' ? toast.success : 
                    typeStr === 'warning' ? toast.warning : toast.info;
      toastFn(titleText, {
        description: messageText,
      });
      return [newNotif, ...prev];
    });
  };

  const [view, setView] = useState<'home' | 'dashboard' | 'history' | 'editor' | 'projects' | 'settings' | 'project-details' | 'audit-log' | 'variation-manager' | 'invoices' | 'accounting' | 'reporting' | 'clients' | 'portal-view' | 'customer-portal' | 'boq-items' | 'verification' | 'project-lifecycle' | 'quality-control' | 'resource-management' | 'equipment-management' | 'site-management' | 'after-sales' | 'warranty' | 'stealth-tunnel' | 'post-evaluation' | 'pricing-intelligence' | 'procurement' | 'procurement-costs' | 'payroll' | 'operational-control'>('home');
  const [operationalPortalId, setOperationalPortalId] = useState<OperationalPortalId>('factories');
  const [procurementTab, setProcurementTab] = useState<ProcurementTab>('landing');
  const [dashboardPerspective, setDashboardPerspective] = useState<DashboardPerspective>('overview');
  const [selectedPortalClient, setSelectedPortalClient] = useState<Client | null>(null);
  const [globalSearch, setGlobalSearch] = useState('');
  const [isAddNewOpen, setIsAddNewOpen] = useState(false);
  const [isBranchOpen, setIsBranchOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState('Main Store');
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [projectTab, setProjectTab] = useState<'overview' | 'variations' | 'payments' | 'audit' | 'documents' | 'history'>('overview');
  const [lifecycleTab, setLifecycleTab] = useState<'dashboard' | 'phases' | 'risks' | 'handover'>('dashboard');
  const [accountingTab, setAccountingTab] = useState<'landing' | 'overview' | 'gl' | 'payments' | 'ap' | 'bank' | 'project_accounting' | 'adjustments' | 'ledgers' | 'assets_tax_close' | 'reports' | 'recurring'>('landing');
  const [reportingReport, setReportingReport] = useState<'Statement' | 'Aging' | 'Collection' | 'Retention' | 'Project' | 'BadDebt'>('Statement');
  const [qcTab, setQcTab] = useState<'landing' | 'inspections' | 'iqc' | 'testing' | 'ncrs' | 'calibration' | 'standards'>('landing');
  const [resourceTab, setResourceTab] = useState<WorkforceTab>('landing');
  const [equipmentTab, setEquipmentTab] = useState<EquipmentTab>('landing');
  const [siteTab, setSiteTab] = useState<'landing' | 'permits' | 'risks' | 'inspections' | 'hse' | 'incidents' | 'contacts'>('landing');
  const [warrantyTab, setWarrantyTab] = useState<WarrantyTab>('landing');
  const [customerPortalTab] = useState<'profile' | 'projects' | 'quotes' | 'orders' | 'finance' | 'documents' | 'messages' | 'service'>('projects');
  const [invoiceProjectFilter, setInvoiceProjectFilter] = useState<string | null>(null);
  const [accountingProjectFilter, setAccountingProjectFilter] = useState<string | null>(null);
  const [preselectedInvoiceId, setPreselectedInvoiceId] = useState<string | null>(null);
  const [quote, setQuote] = useState<Quote>(INITIAL_QUOTE);
  const [showCatalog, setShowCatalog] = useState(false);
  const [catalogInitialTab, setCatalogInitialTab] = useState<'CATEGORIES' | 'OVERVIEW'>('CATEGORIES');
  const [boqInitialTab, setBoqInitialTab] = useState<BOQTab>('CATEGORIES_ITEMS');
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedLayout, setSelectedLayout] = useState<PdfLayout>('Detailed');
  const [isDownloadPortalOpen, setIsDownloadPortalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importDefaultEntity, setImportDefaultEntity] = useState<ImportEntityType>('boq_items');

  // Enterprise Security and Identity Gateway
  const { 
    currentUser, 
    effectiveUser,
    effectivePermissions,
    users: securityUsers,
    roles: securityRoles,
    accessRequests,
    createAccessRequest,
    hasPermission,
    canAccessPortal,
    isAuthenticated, 
    logout, 
    refreshData: refreshSecurityData
  } = useSecurity();
  const { theme, isDarkMode, toggleDarkMode, setTheme } = useTheme();
  const activeSecurityUser = effectiveUser || currentUser;
  const isSuperAdminUser =
    !activeSecurityUser ||
    activeSecurityUser.roleId === 'role-superadmin' ||
    activeSecurityUser.adminAuthorityLevel === 'SUPER_ADMINISTRATOR';
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<SettingsTab>('profile');
  const [securityInitialTab, setSecurityInitialTab] = useState<SecurityTab>('dashboard');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [isRefreshingData, setIsRefreshingData] = useState(false);
  const [slaTick, setSlaTick] = useState(0);

  useEffect(() => {
    const unsub = subscribeSlaUpdates(() => setSlaTick(t => t + 1));
    const timer = setInterval(() => {
      approvalSlaAlertService.evaluateAndGetRecords();
      setSlaTick(t => t + 1);
    }, 5000);
    return () => {
      unsub();
      clearInterval(timer);
    };
  }, []);

  const activeDeadlineAlertsCount = useMemo(
    () => approvalSlaAlertService.getActiveAlertsForNotificationHub(activeSecurityUser).length,
    [activeSecurityUser, slaTick]
  );

  // In-system data refresh handler: refreshes system datasets without logging out
  const handleRefreshSystemData = useCallback(() => {
    if (isRefreshingData) return;
    setIsRefreshingData(true);

    // 1. Refresh security service & audit log datasets (maintains currentUser session)
    refreshSecurityData();

    // 2. Refresh business registers from local storage
    try {
      const savedQuotes = localStorage.getItem('quotes');
      if (savedQuotes) setQuotes(JSON.parse(savedQuotes));

      const savedProjects = localStorage.getItem('projects');
      if (savedProjects) setProjects(JSON.parse(savedProjects));

      const savedClients = localStorage.getItem('clients');
      if (savedClients) setClients(JSON.parse(savedClients));

      const savedInvoices = localStorage.getItem('invoices');
      if (savedInvoices) setInvoices(JSON.parse(savedInvoices));

      const savedPayments = localStorage.getItem('payments');
      if (savedPayments) setPayments(JSON.parse(savedPayments));

      const savedAdjustments = localStorage.getItem('adjustments');
      if (savedAdjustments) setAdjustments(JSON.parse(savedAdjustments));

      const savedTemplates = localStorage.getItem('templates');
      if (savedTemplates) setTemplates(JSON.parse(savedTemplates));

      const savedItemTemplates = localStorage.getItem('itemTemplates');
      if (savedItemTemplates) setItemTemplates(JSON.parse(savedItemTemplates));

      const savedPersonnel = localStorage.getItem('personnel');
      if (savedPersonnel) setPersonnel(JSON.parse(savedPersonnel));

      const savedEquipment = localStorage.getItem('equipment');
      if (savedEquipment) setEquipment(JSON.parse(savedEquipment));
    } catch (e) {
      console.error('Error refreshing system data from storage:', e);
    }

    setTimeout(() => {
      setIsRefreshingData(false);
      toast.success('System Data Refreshed', {
        description: 'All portal registers, BOQ catalogs, and security ledgers have been synchronized. Active session maintained.',
        duration: 3500
      });
    }, 600);
  }, [
    isRefreshingData,
    refreshSecurityData,
    setQuotes,
    setProjects,
    setClients,
    setInvoices,
    setPayments,
    setAdjustments,
    setTemplates,
    setItemTemplates,
    setPersonnel,
    setEquipment
  ]);

  // Actual Cost Records State for Standard Cost Variance & Post-Evaluation
  const [actualCostRecords, setActualCostRecords] = useState<ProjectActualCostRecord[]>(() => {
    const saved = localStorage.getItem('project_actual_costs');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Failed to parse saved actual cost records', e);
      }
    }
    return generateSeedActualCostRecords(projects);
  });

  useEffect(() => {
    localStorage.setItem('project_actual_costs', JSON.stringify(actualCostRecords));
  }, [actualCostRecords]);

  const handleAddActualCostRecord = (record: Omit<ProjectActualCostRecord, 'id'>) => {
    const newRecord: ProjectActualCostRecord = {
      ...record,
      id: `cost-rec-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      invoiceOrReceiptNo: record.invoiceOrReceiptNo || numberingService.consumeNextNumber('actual_cost_voucher')
    };
    setActualCostRecords(prev => [newRecord, ...prev]);
    addNotification('Actual Cost Logged', `Logged ${newRecord.costCategory} actual cost for ${newRecord.costType}`, 'success', 'Accounting', 'low');
  };

  const handleUpdateActualCostRecord = (record: ProjectActualCostRecord) => {
    setActualCostRecords(prev => prev.map(r => r.id === record.id ? record : r));
    addNotification('Cost Record Updated', `Updated cost record ${record.invoiceOrReceiptNo || record.id}`, 'info', 'Accounting', 'low');
  };

  const handleDeleteActualCostRecord = (id: string) => {
    setActualCostRecords(prev => prev.filter(r => r.id !== id));
    addNotification('Cost Record Deleted', `Cost record removed`, 'info', 'Accounting', 'low');
  };

  const handleApplyBulkPriceUpdate = (rule: BulkPriceUpdateRule) => {
    const previewItems = simulateBulkPriceUpdate(productVariants, rule);
    previewItems.forEach(item => {
      const existing = productVariants.find(v => v.id === item.variantId);
      if (existing) {
        const updatedVariant: ProductVariant = {
          ...existing,
          pricing: existing.pricing ? {
            ...existing.pricing,
            costPrice: item.newCost,
            sellingPrice: item.newSellingPrice,
            grossMarginPercent: item.newMarginPercent,
            lastUpdated: new Date().toISOString()
          } : {
            costPrice: item.newCost,
            sellingPrice: item.newSellingPrice,
            standardPrice: item.newSellingPrice,
            minimumPrice: Math.round(item.newCost * 1.1),
            pricingMethod: 'Cost + Markup',
            markupPercent: item.newCost > 0 ? Math.round(((item.newSellingPrice - item.newCost) / item.newCost) * 1000) / 10 : 25,
            grossMarginPercent: item.newMarginPercent,
            grossProfit: item.newSellingPrice - item.newCost,
            priceSource: 'MANUAL_ENTRY',
            currency: 'LKR',
            effectiveFrom: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
          }
        };
        saveProductVariant(updatedVariant);
      }
    });
    addNotification(
      'Bulk Price Update Applied',
      `Applied ${rule.adjustmentScope} (${rule.mode === 'PERCENTAGE' ? (rule.value > 0 ? `+${rule.value}%` : `${rule.value}%`) : `${rule.value} LKR`}) across ${previewItems.length} variant components: ${rule.reason}`,
      'success',
      'System',
      'medium'
    );
  };

  const handleAddItemToProject = (projectId: string, partialItem: Partial<BOQItem>) => {
    const targetProject = projects.find(p => p.id === projectId);
    if (!targetProject) return;

    const newItem: BOQItem = {
      id: crypto.randomUUID(),
      no: (targetProject.items.length + 1).toString(),
      name: partialItem.name || 'New Item',
      description: partialItem.description || '',
      itemType: partialItem.itemType || 'Main',
      category: partialItem.category || 'Aluminium',
      unit: partialItem.unit || 'sqft',
      qty: partialItem.qty || 1,
      rate: partialItem.rate || 0,
      discountPercent: partialItem.discountPercent || 0,
      amount: (partialItem.qty || 1) * (partialItem.rate || 0),
      variationStatus: 'Additional',
      variantId: partialItem.variantId,
      rateVersionId: partialItem.rateVersionId,
      costAtTimeOfQuote: partialItem.costAtTimeOfQuote
    };

    const updatedProject: Project = {
      ...targetProject,
      items: [...targetProject.items, newItem]
    };

    setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
    if (selectedProject?.id === updatedProject.id) {
      setSelectedProject(updatedProject);
    }
    addNotification('Item Added to Project', `Added "${newItem.name}" to ${targetProject.projectName}`, 'success', 'Variation', 'medium');
  };

  const handleOpenImportModal = (entity?: ImportEntityType) => {
    if (entity) {
      setImportDefaultEntity(entity);
    } else {
      if (view === 'boq-items') setImportDefaultEntity('boq_items');
      else if (view === 'clients') setImportDefaultEntity('clients');
      else if (view === 'projects') setImportDefaultEntity('projects');
      else if (view === 'invoices') setImportDefaultEntity('invoices');
      else if (view === 'resource-management') setImportDefaultEntity('personnel');
      else if (view === 'equipment-management') setImportDefaultEntity('equipment');
      else if (view === 'editor') setImportDefaultEntity('boq_lines');
      else setImportDefaultEntity('boq_items');
    }
    setIsImportModalOpen(true);
  };
  const [initialVerificationCode, setInitialVerificationCode] = useState('');
  const [downloadConfig, setDownloadConfig] = useState<{ type: 'Quote' | 'Project' | 'Variation' | 'AuditLog' | 'AllDocuments' | 'Timeline' | 'Dashboard' | 'Invoice', data: any }>({ type: 'Quote', data: INITIAL_QUOTE });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleAppNavigate = (e: Event) => {
      const customEvent = e as CustomEvent<{ view: string; tab?: BOQTab; itemId?: string; variantId?: string }>;
      if (customEvent.detail?.view) {
        setView(customEvent.detail.view as any);
        if (customEvent.detail.tab && customEvent.detail.view === 'boq-items') {
          setBoqInitialTab(customEvent.detail.tab);
        }
      }
    };
    window.addEventListener('app:navigate', handleAppNavigate);
    return () => window.removeEventListener('app:navigate', handleAppNavigate);
  }, []);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.nav-dropdown-wrapper')) {
        setOpenDropdown(null);
      }
      if (!target.closest('.add-new-wrapper')) {
        setIsAddNewOpen(false);
      }
      if (!target.closest('.branch-wrapper')) {
        setIsBranchOpen(false);
      }
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const svc = params.get('svc') || params.get('pvc') || params.get('cvc');
    if (svc) {
      setInitialVerificationCode(svc);
      setView('verification');
      return;
    }

    const portalParam = params.get('portal');
    const recordIdParam = params.get('recordId');
    if (portalParam) {
      if (portalParam === 'system-administration') {
        setSettingsInitialTab('email-templates');
        setView('settings');
        return;
      }
      const portalObj = SYSTEM_PORTAL_DIRECTORY.find(p => p.id === portalParam);
      if (portalObj) {
        const allowed = centralMessagingService.canUserOpenLinkedPortal(
          effectiveUser || currentUser || null,
          portalObj
        );
        if (allowed) {
          handleNotificationAction({
            label: `Open ${portalObj.title}`,
            view: portalObj.targetView,
            data: { tab: portalObj.targetSubTab, recordId: recordIdParam }
          });
        } else {
          toast.error(
            `Access Restricted: Your account does not have RBAC permission to open ${portalObj.title}.`
          );
        }
      }
    }
  }, []);

  const handleNotificationAction = (action: Notification['action']) => {
    if (!action) return;
    
    switch (action.view) {
      case 'project-details':
        if (action.data?.projectId) {
          const project = projects.find(p => p.id === action.data.projectId);
          if (project) {
            setSelectedProject(project);
            setView('project-details');
            if (action.data.tab) setProjectTab(action.data.tab as any);
          }
        } else if (projects.length > 0) {
          setSelectedProject(projects[0]);
          setView('project-details');
        }
        break;
      case 'quote-details':
        if (action.data?.quoteId) {
          const q = quotes.find(item => item.id === action.data.quoteId);
          if (q) {
            setQuote(q);
            setView('editor');
          }
        }
        break;
      case 'invoices':
        setView('invoices');
        break;
      case 'accounting':
        setView('accounting');
        if (action.data?.tab) {
          setAccountingTab(action.data.tab as any);
        }
        if (action.data?.invoiceId) {
          setPreselectedInvoiceId(action.data.invoiceId);
        }
        break;
      case 'dashboard':
        setView('dashboard');
        break;
      case 'variations':
        if (action.data?.projectId) {
          const project = projects.find(p => p.id === action.data.projectId);
          if (project) {
            setSelectedProject(project);
            setView('project-details');
            setProjectTab('variations');
          }
        } else {
          setView('variation-manager');
        }
        break;
      case 'history':
        setView('history');
        break;
      case 'projects':
        setView('projects');
        break;
      case 'settings':
        if (action.data?.tab) {
          setSettingsInitialTab(action.data.tab as any);
        }
        setView('settings');
        break;
      case 'home':
        setView('home');
        break;
      case 'operational-control':
        if (action.data?.tab) {
          setOperationalPortalId(action.data.tab as any);
        }
        setView('operational-control');
        break;
      case 'procurement':
        if (action.data?.tab) {
          setProcurementTab(action.data.tab as any);
        }
        setView('procurement');
        break;
      case 'audit-log':
        setView('audit-log');
        break;
      case 'variation-manager':
        setView('variation-manager');
        break;
      case 'clients':
        setView('clients');
        break;
      case 'portal-view':
      case 'customer-portal':
        if (action.data?.clientId) {
          const cl = clients.find(c => c.id === action.data.clientId);
          if (cl) setSelectedPortalClient(cl);
        } else if (!selectedPortalClient && clients.length > 0) {
          setSelectedPortalClient(clients[0]);
        }
        setView('portal-view');
        break;
      case 'quality-control':
        setView('quality-control');
        break;
      case 'resource-management':
        setView('resource-management');
        break;
      case 'equipment-management':
        setView('equipment-management');
        break;
      case 'site-management':
        setView('site-management');
        break;
      case 'after-sales':
      case 'warranty':
        setView('after-sales');
        break;
      case 'verification':
        setView('verification');
        break;
      case 'stealth-tunnel':
        setView('stealth-tunnel');
        break;
      case 'boq-items':
        setView('boq-items');
        break;
      case 'project-lifecycle':
        setView('project-lifecycle');
        break;
      case 'reporting':
        setView('reporting');
        break;
    }
    setShowNotifications(false);
  };

  const togglePinNotification = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, isPinned: !n.isPinned } : n
    ));
  };

  // Sync download portal data when underlying quote or projects change
  useEffect(() => {
    if (!isDownloadPortalOpen || !downloadConfig.data) return;

    if (downloadConfig.type === 'Quote' || downloadConfig.type === 'Timeline') {
      // If we're editing the current quote, sync with it
      if (downloadConfig.data.id === quote.id) {
        setDownloadConfig(prev => ({ ...prev, data: quote }));
      } else {
        // Otherwise look in the quotes list
        const latest = quotes.find(q => q.id === downloadConfig.data.id);
        if (latest) setDownloadConfig(prev => ({ ...prev, data: latest }));
      }
    } else if (['Project', 'Variation', 'AllDocuments'].includes(downloadConfig.type)) {
      const latest = projects.find(p => p.id === downloadConfig.data.id);
      if (latest) setDownloadConfig(prev => ({ ...prev, data: latest }));
    } else if (downloadConfig.type === 'Invoice') {
      const latest = invoices.find(i => i.id === downloadConfig.data.id);
      if (latest) setDownloadConfig(prev => ({ ...prev, data: latest }));
    }
  }, [quote, quotes, projects, invoices, isDownloadPortalOpen, downloadConfig.type, downloadConfig.data?.id]);

  const handleAddPayment = (payment: Payment) => {
    savePayment(payment);
    void centralEmailService.triggerEvent({
      eventType: 'PAYMENT_RECEIVED',
      triggeringPortal: 'Accounting & Finance Portal',
      triggeringAction: `Payment Recorded (${payment.referenceNumber || payment.id})`,
      senderUserId: (effectiveUser || currentUser)?.id,
      variables: {
        document_number: payment.referenceNumber || payment.id,
        invoice_number: payment.invoiceId,
        amount: `LKR ${payment.amount.toLocaleString()}`,
        status: 'Cleared / Verified',
        summary: `Payment of LKR ${payment.amount.toLocaleString()} recorded via ${payment.method}.`
      },
      portalId: 'accounting-finance',
      recordId: payment.invoiceId
    });
  };

  const handleAddAdjustment = (adjustment: Adjustment) => {
    saveAdjustment(adjustment);
  };
  const handleUpdateQuote = (updatedQuote: Quote) => {
    if (quote.id === updatedQuote.id) {
      setQuote(updatedQuote);
    }
    saveQuote(updatedQuote);
  };

  const handleUpdateProject = (updatedProject: Project) => {
    saveProject(updatedProject);
    if (selectedProject?.id === updatedProject.id) {
      setSelectedProject(updatedProject);
    }
    void centralEmailService.triggerEvent({
      eventType: 'PROJECT_STATUS_CHANGED',
      triggeringPortal: 'Project Management Portal',
      triggeringAction: `Project Updated: ${updatedProject.projectName} (${updatedProject.status})`,
      senderUserId: (effectiveUser || currentUser)?.id,
      variables: {
        project_code: updatedProject.id,
        project_name: updatedProject.projectName,
        status: updatedProject.status,
        summary: `Project "${updatedProject.projectName}" status is ${updatedProject.status}.`
      },
      portalId: 'project-management',
      recordId: updatedProject.id
    });
  };
  const getDefaultLayout = (type: string): PdfLayout => {
    switch (type) {
      case 'Executive': return 'Executive';
      case 'Budgetary': return 'Summary';
      case 'Unit Rate': return 'Detailed';
      default: return 'Detailed';
    }
  };

  useEffect(() => {
    setSelectedLayout(getDefaultLayout(quote.quoteType));
  }, [quote.quoteType]);

  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type?: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'danger'
  });

  // Process recurring invoices
  const handleProcessRecurring = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    const newInvoices: Invoice[] = [];
    let currentNextNumber = companySettings.nextInvoiceNumber;
    let hasChanges = false;

    const updatedInvoices = invoices.map(invoice => {
      if (invoice.type === InvoiceType.RECURRING && invoice.recurringConfig) {
        let nextDate = invoice.recurringConfig.nextDate;
        let tempUpdatedInvoice = { ...invoice };
        let generatedForThisParent = false;

        while (nextDate <= today && (!invoice.recurringConfig.endDate || nextDate <= invoice.recurringConfig.endDate)) {
          // Generate new invoice
          const newInvoice: Invoice = {
            ...invoice,
            id: crypto.randomUUID(),
            invoiceNo: `${companySettings.invoiceNumberPrefix}${currentNextNumber}`,
            type: InvoiceType.STANDARD,
            status: InvoiceStatus.DRAFT,
            date: nextDate,
            dueDate: new Date(new Date(nextDate).getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            recurringConfig: undefined,
            amountPaid: 0,
            balanceDue: invoice.grandTotal
          };
          newInvoices.push(newInvoice);
          currentNextNumber++;
          generatedForThisParent = true;
          hasChanges = true;

          // Calculate next date
          const next = new Date(nextDate);
          if (invoice.recurringConfig.frequency === 'Weekly') next.setDate(next.getDate() + 7);
          else if (invoice.recurringConfig.frequency === 'Monthly') next.setMonth(next.getMonth() + 1);
          else if (invoice.recurringConfig.frequency === 'Quarterly') next.setMonth(next.getMonth() + 3);
          else if (invoice.recurringConfig.frequency === 'Yearly') next.setFullYear(next.getFullYear() + 1);
          nextDate = next.toISOString().split('T')[0];
        }

        if (generatedForThisParent) {
          tempUpdatedInvoice.recurringConfig = {
            ...invoice.recurringConfig!,
            nextDate: nextDate
          };
          return tempUpdatedInvoice;
        }
      }
      return invoice;
    });

    if (hasChanges) {
      setInvoices([...updatedInvoices, ...newInvoices]);
      setCompanySettings(prev => ({ ...prev, nextInvoiceNumber: currentNextNumber }));
      addNotification(
        'Recurring Invoices Generated', 
        `${newInvoices.length} new invoices have been generated based on recurring schedules.`, 
        'success', 
        'System'
      );
    }
    localStorage.setItem('lastRecurringCheck', today);
  }, [invoices, companySettings, addNotification]);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const lastCheck = localStorage.getItem('lastRecurringCheck');
    
    if (lastCheck !== today) {
      handleProcessRecurring();
    }
  }, [handleProcessRecurring]);

  // --- Notification & Reminder Manager ---
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const newNotifications: Notification[] = [];

      // 1. Quote Expiry Reminders (Only for QS / Engineering / Sales roles)
      quotes.forEach(q => {
        if (q.status === QuoteStatus.SENT && q.validUntil) {
          if (q.validUntil === todayStr) {
            const id = `quote-expiry-today-${q.id}`;
            if (!notifications.some(n => n.id === id)) {
              newNotifications.push({
                id,
                title: 'Quote Expiring Today',
                message: `Quotation ${q.quoteNo} for ${q.client.name} expires today.`,
                timestamp: now.toISOString(),
                type: 'warning',
                priority: 'high',
                category: 'Status',
                isRead: false,
                targetRoleIds: ['role-qs', 'role-engineer']
              });
            }
          } else if (q.validUntil <= threeDaysFromNow && q.validUntil > todayStr) {
            const id = `quote-expiry-soon-${q.id}`;
            if (!notifications.some(n => n.id === id)) {
              newNotifications.push({
                id,
                title: 'Quote Expiring Soon',
                message: `Quotation ${q.quoteNo} for ${q.client.name} will expire on ${q.validUntil}.`,
                timestamp: now.toISOString(),
                type: 'info',
                priority: 'medium',
                category: 'Status',
                isRead: false,
                targetRoleIds: ['role-qs', 'role-engineer']
              });
            }
          }
        }
      });

      // 2. Overdue Payment Reminders (Only for Finance roles)
      projects.forEach(p => {
        if (p.status === 'In Progress' && p.paymentTiers) {
          p.paymentTiers.forEach(tier => {
            if (tier.status === 'Pending' && tier.dueDate && tier.dueDate < todayStr) {
              const id = `payment-overdue-${p.id}-${tier.id}`;
              if (!notifications.some(n => n.id === id)) {
                newNotifications.push({
                  id,
                  title: 'Payment Overdue',
                  message: `Payment for "${tier.phase}" in project ${p.projectName} is overdue since ${tier.dueDate}.`,
                  timestamp: now.toISOString(),
                  type: 'error',
                  priority: 'high',
                  category: 'Status',
                  isRead: false,
                  targetRoleIds: ['role-finmgr', 'role-acct'],
                  action: { label: 'View Project', view: 'project-details', data: { projectId: p.id, tab: 'finance' } }
                });
              }
            }
          });
        }
      });

      // 3. Overdue Invoices (Only for Finance roles)
      invoices.forEach(inv => {
        if (inv.status !== InvoiceStatus.COLLECTED_PAYMENT && inv.status !== InvoiceStatus.CANCELLED && inv.dueDate < todayStr) {
          const id = `invoice-overdue-${inv.id}`;
          if (!notifications.some(n => n.id === id)) {
            newNotifications.push({
              id,
              title: 'Invoice Overdue',
              message: `Invoice ${inv.invoiceNo} for ${inv.client.name} is overdue since ${inv.dueDate}.`,
              timestamp: now.toISOString(),
              type: 'error',
              priority: 'high',
              category: 'Status',
              isRead: false,
              targetRoleIds: ['role-finmgr', 'role-acct'],
              action: { label: 'View Accounting', view: 'accounting', data: { tab: 'payments' } }
            });
          }
        }
      });

      // 4. Recurring Invoices Due (Only for Finance roles)
      invoices.forEach(inv => {
        if (inv.type === InvoiceType.RECURRING && inv.recurringConfig?.isActive && inv.recurringConfig?.nextDate && inv.recurringConfig.nextDate <= todayStr) {
          const id = `recurring-due-${inv.id}`;
          if (!notifications.some(n => n.id === id)) {
            newNotifications.push({
              id,
              title: 'Recurring Invoice Due',
              message: `Recurring invoice ${inv.invoiceNo} is due for generation today.`,
              timestamp: now.toISOString(),
              type: 'info',
              priority: 'medium',
              category: 'System',
              isRead: false,
              targetRoleIds: ['role-finmgr', 'role-acct'],
              action: { label: 'View Accounting', view: 'accounting', data: { tab: 'payments' } }
            });
          }
        }
      });

      // 5. Timeline Job Reminders (Only for Project Manager & Site roles)
      projects.forEach(p => {
        if (p.status === 'In Progress' && p.timeline?.jobs) {
          p.timeline.jobs.forEach(job => {
            if (job.status === 'Pending' && job.startDate === todayStr) {
              const id = `job-start-today-${p.id}-${job.id}`;
              if (!notifications.some(n => n.id === id)) {
                newNotifications.push({
                  id,
                  title: 'Job Starting Today',
                  message: `Job "${job.title}" for project ${p.projectName} is scheduled to start today.`,
                  timestamp: now.toISOString(),
                  type: 'info',
                  priority: 'medium',
                  category: 'Status',
                  isRead: false,
                  targetRoleIds: ['role-pm', 'role-pcoord', 'role-sitemgr', 'role-sitesup'],
                  action: { label: 'View Project', view: 'project-details', data: { projectId: p.id } }
                });
              }
            } else if (job.status !== 'Completed' && job.endDate < todayStr) {
              const id = `job-delayed-${p.id}-${job.id}`;
              if (!notifications.some(n => n.id === id)) {
                newNotifications.push({
                  id,
                  title: 'Job Delayed',
                  message: `Job "${job.title}" for project ${p.projectName} is past its end date (${job.endDate}).`,
                  timestamp: now.toISOString(),
                  type: 'warning',
                  priority: 'high',
                  category: 'Status',
                  isRead: false,
                  targetRoleIds: ['role-pm', 'role-pcoord', 'role-sitemgr', 'role-sitesup'],
                  action: { label: 'View Project', view: 'project-details', data: { projectId: p.id } }
                });
              }
            }
          });
        }
      });

      setNotifications(prev => {
        const combined = [...newNotifications, ...prev];
        const seen = new Set<string>();
        return combined.filter(item => {
          if (seen.has(item.id)) return false;
          seen.add(item.id);
          return true;
        });
      });
    };

    // Run check on mount and then every hour
    checkReminders();
    const interval = setInterval(checkReminders, 3600000);
    return () => clearInterval(interval);
  }, [quotes, projects, invoices]); // Re-run when data changes to catch new items

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const deleteQuote = (id: string) => {
    setConfirmationModal({
      isOpen: true,
      title: 'Delete Quotation',
      message: 'Are you sure you want to delete this quotation? This action cannot be undone.',
      onConfirm: () => {
        deleteQuoteHook(id);
      },
      type: 'danger'
    });
  };

  const deleteProject = (id: string) => {
    setConfirmationModal({
      isOpen: true,
      title: 'Delete Project',
      message: 'Are you sure you want to delete this project? This action cannot be undone.',
      onConfirm: () => {
        deleteProjectHook(id);
        if (selectedProject?.id === id) {
          setSelectedProject(null);
          setView('projects');
        }
      },
      type: 'danger'
    });
  };

  const exportAllData = () => {
    const data = {
      companySettings,
      quotes,
      projects,
      clients,
      templates,
      notifications,
      invoices,
      payments,
      adjustments,
      auditLogs,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `innovista-metal-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    addNotification('Data Exported', 'All system data has been exported to JSON.', 'success');
  };

  const resetSystem = () => {
    setQuotes([]);
    setProjects([]);
    setClients(SAMPLE_CLIENTS);
    setAuditLogs([]);
    setNotifications([]);
    setInvoices([]);
    setPayments([]);
    setAdjustments([]);
    setCompanySettings(INITIAL_COMPANY_SETTINGS);
    addNotification('System Reset', 'All data has been cleared successfully.', 'info');
  };

  const generateAuditReport = () => {
    generateFullSystemSnapshotPDF(quotes, projects, auditLogs, companySettings);
    addNotification('Report Generated', 'System audit report has been generated.', 'success', 'System', 'low', { label: 'View Audit Log', view: 'audit-log' });
  };

  const exportAllDocuments = async () => {
    addNotification('Generating ZIP', 'Preparing all documents for download...', 'info');
    try {
      await generateSystemWideDocumentsZIP(quotes, projects, invoices, auditLogs, companySettings);
      addNotification('Download Ready', 'All documents have been packaged.', 'success');
    } catch (error) {
      console.error('ZIP generation error:', error);
      addNotification('Download Failed', 'Error generating ZIP file.', 'error');
    }
  };

  const importAllData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        restoreData(data);
      } catch (error) {
        console.error('Data import error:', error);
        addNotification('Import Failed', 'Invalid backup file format.', 'error');
      }
    };
    reader.readAsText(file);
  };

  // --- Handlers ---
  const handleSave = () => {
    if (!quote.projectName || !quote.client?.name) {
      addNotification('Error', 'Please fill in project name and client details.', 'error');
      return;
    }

    const savedQuote = saveQuote(quote);
    
    // Auto-save client if new or updated
    if (quote.client?.name) {
      saveClient(quote.client);
    }

    addNotification(
      !quote.id ? 'Quote Created' : 'Quote Updated',
      `Quotation ${savedQuote.quoteNo} has been saved successfully.`,
      'success'
    );

    void centralEmailService.triggerEvent({
      eventType: 'QUOTATION_SENT',
      triggeringPortal: 'BOQ & Quotation Portal',
      triggeringAction: `Quotation Saved: ${savedQuote.quoteNo}`,
      senderUserId: (effectiveUser || currentUser)?.id,
      targetEmails: savedQuote.client?.email ? [savedQuote.client.email] : undefined,
      variables: {
        quotation_number: savedQuote.quoteNo,
        document_number: savedQuote.quoteNo,
        project_name: savedQuote.projectName,
        user_name: savedQuote.client?.name || 'Valued Client',
        status: savedQuote.status,
        summary: `Quotation ${savedQuote.quoteNo} for ${savedQuote.projectName} has been prepared.`
      },
      portalId: 'boq-quotation-management',
      recordId: savedQuote.quoteNo
    });

    // Reset quote state after saving
    const nextQuoteNo = numberingService.peekNextNumber('quotation');
    setQuote({
      ...INITIAL_QUOTE,
      quoteNo: nextQuoteNo,
      id: '',
      items: [],
      client: { ...INITIAL_QUOTE.client },
      paymentTiers: INITIAL_QUOTE.paymentTiers.map(t => ({ ...t, id: crypto.randomUUID() })),
      timeline: { ...INITIAL_QUOTE.timeline, id: crypto.randomUUID() }
    });

    setView('history');
  };

  const handleNewQuote = () => {
    const newQuoteNo = numberingService.peekNextNumber('quotation');
    setQuote({
      ...INITIAL_QUOTE,
      quoteNo: newQuoteNo,
      id: '',
      items: [],
      client: { ...INITIAL_QUOTE.client },
      paymentTiers: INITIAL_QUOTE.paymentTiers.map(t => ({ ...t, id: crypto.randomUUID() })),
      timeline: { ...INITIAL_QUOTE.timeline, id: crypto.randomUUID() }
    });
    setView('editor');
  };

  const applyTemplate = (
    template: QuoteTemplate,
    options?: {
      mode?: 'replace' | 'append';
      includeItems?: boolean;
      includeTerms?: boolean;
      includeMilestones?: boolean;
      includeCommercial?: boolean;
    }
  ) => {
    const mode = options?.mode || 'replace';
    const includeItems = options?.includeItems !== false;
    const includeTerms = options?.includeTerms !== false;
    const includeMilestones = options?.includeMilestones !== false;
    const includeCommercial = options?.includeCommercial !== false;

    const mappedItems = template.items.map(item => ({ ...item, id: crypto.randomUUID() }));
    const finalItems = includeItems
      ? (mode === 'append' ? [...quote.items, ...mappedItems] : mappedItems)
      : quote.items;

    setQuote({
      ...quote,
      ...(includeCommercial ? {
        quoteType: template.quoteType,
        pricingMethod: template.pricingMethod || quote.pricingMethod,
        projectStage: template.projectStage || quote.projectStage,
        scopeCoverage: template.scopeCoverage || quote.scopeCoverage,
        validityDays: template.validityDays,
        advancePercent: template.advancePercent,
        taxPercent: template.taxPercent,
        isTaxInclusive: template.isTaxInclusive,
        estimatedDeliveryDays: template.estimatedDeliveryDays,
        currency: template.currency || quote.currency,
      } : {}),
      terms: includeTerms ? template.terms : quote.terms,
      items: finalItems,
      additionalCharges: template.additionalCharges || quote.additionalCharges || [],
      paymentTiers: (includeMilestones && template.paymentTiers && template.paymentTiers.length > 0)
        ? template.paymentTiers.map(pt => ({ ...pt, id: crypto.randomUUID(), status: 'Pending' }))
        : quote.paymentTiers
    });
    setShowTemplateManager(false);
    addNotification(
      'Template Applied', 
      `Applied ${template.name} (${mode === 'append' ? `appended ${mappedItems.length} items` : `loaded ${mappedItems.length} items`})!`, 
      'success'
    );
  };

  const handleSaveTemplateToLibrary = (updatedOrNewTemplate: QuoteTemplate) => {
    setTemplates(prev => {
      const idx = prev.findIndex(t => t.id === updatedOrNewTemplate.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = updatedOrNewTemplate;
        return next;
      }
      return [updatedOrNewTemplate, ...prev];
    });
    addNotification('Template Saved', `Template "${updatedOrNewTemplate.name}" saved to library!`, 'success');
  };

  const handleDeleteTemplateFromLibrary = (templateId: string) => {
    setTemplates(prev => prev.filter(t => t.id !== templateId));
    addNotification('Template Deleted', 'Template removed from library', 'info');
  };

  const createNew = () => {
    const quoteNo = numberingService.peekNextNumber('quotation');
    setQuote({
      ...INITIAL_QUOTE,
      id: '',
      quoteNo,
      currency: companySettings.defaultCurrency,
      submittedDate: new Date().toISOString().split('T')[0],
    });
    setView('editor');
  };

  const editQuote = (q: Quote) => {
    setQuote(q);
    setView('editor');
  };

  const duplicateQuote = (q: Quote) => {
    const quoteNo = numberingService.peekNextNumber('quotation');
    const duplicated: Quote = {
      ...q,
      id: '', // Will be generated on save
      quoteNo,
      status: QuoteStatus.DRAFT,
      submittedDate: new Date().toISOString().split('T')[0],
      projectName: `${q.projectName} (Copy)`,
      version: 1,
    };
    setQuote(duplicated);
    setView('editor');
    addNotification('Quote Duplicated', 'Quotation duplicated for reuse!', 'success', 'BOQ', 'low', { label: 'Edit Quote', view: 'quote-details', data: { quoteId: duplicated.id } });
  };

  const handleCreateProject = (fromQuote?: Quote) => {
    const q = fromQuote;
    const totals = q ? getQuoteTotalBreakdown(q) : null;
    const nextCode = numberingService.consumeNextNumber('project');
    const newProject: Project = {
      id: crypto.randomUUID(),
      projectCode: nextCode,
      quoteId: q ? q.id : '',
      allQuoteIds: q ? [q.id] : [],
      projectName: q ? q.projectName : 'New Architectural Project',
      client: q ? { ...q.client } : { ...(clients[0] || INITIAL_QUOTE.client) },
      startDate: new Date().toISOString().split('T')[0],
      siteAddress: q?.workSiteLocation || q?.client?.address || clients[0]?.address || 'Colombo, Sri Lanka',
      category: 'Aluminium',
      status: q ? 'In Progress' : 'New Request',
      totalValue: totals ? totals.grandTotal : 0,
      originalSum: totals ? totals.grandTotal : 0,
      currency: q?.currency || 'Rs.',
      items: q ? q.items.map(it => ({ ...it, id: crypto.randomUUID() })) : [],
      documentSettings: q ? q.documentSettings : INITIAL_QUOTE.documentSettings,
      auditLogs: [{
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        action: 'Project Created',
        details: q ? `Converted from Quote ${q.quoteNo}` : `Manually created project ${nextCode}`,
        user: 'Lead Project Engineer',
        type: 'General'
      }],
      paymentTiers: q?.paymentTiers || [],
      notes: ''
    };
    saveProject(newProject);
    if (q) {
      updateQuoteStatus(q.id, QuoteStatus.PROJECT);
    }
    setSelectedProject(newProject);
    setProjectTab('variations');
    setView('project-details');
    addNotification('Project Created', `New project ${newProject.projectCode} created!`, 'success', 'System', 'low', { label: 'View Project', view: 'project-details', data: { projectId: newProject.id } });
  };

  const handleCreateQuoteForProject = (project: Project) => {
    const newQuote: Quote = {
      ...INITIAL_QUOTE,
      id: crypto.randomUUID(),
      quoteNo: numberingService.peekNextNumber('quotation'),
      projectId: project.id,
      projectCode: project.projectCode || project.id,
      projectName: project.projectName,
      workSiteLocation: project.siteAddress || project.client.address || project.projectName,
      client: { ...project.client },
      items: project.items && project.items.length > 0 
        ? project.items.map(it => ({ ...it, id: crypto.randomUUID(), variationStatus: 'Original' }))
        : [],
      terms: project.terms || INITIAL_QUOTE.terms,
      paymentTiers: project.paymentTiers || INITIAL_QUOTE.paymentTiers,
      currency: project.currency || 'Rs.',
      submittedDate: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: QuoteStatus.DRAFT,
      version: 1
    };
    setQuote(newQuote);
    setView('editor');
    addNotification('Quotation Builder', `Initialized quote for ${project.projectCode || project.projectName}`, 'success', 'BOQ');
  };

  const handleCreateInvoiceForProject = (project: Project) => {
    setInvoiceProjectFilter(project.id);
    setView('invoices');
    addNotification('Invoice Hub', `Filtered for Project ${project.projectCode || project.projectName}`, 'info', 'Accounting');
  };

  const onViewQuote = (q: Quote) => {
    setQuote(q);
    setView('editor');
  };

  const handleInsertTemplates = (selectedTemplates: ItemTemplate[]) => {
    if (view === 'project-details' && selectedProject) {
      const newItems: BOQItem[] = selectedTemplates.map((template, index) => {
        const itemId = crypto.randomUUID();
        
        let measurements = undefined;
        if (template.measurements) {
          measurements = {
            ...template.measurements,
            id: crypto.randomUUID(),
            itemId: itemId,
            rows: template.measurements.rows.map(r => ({ ...r, id: crypto.randomUUID() }))
          };
        } else if (template.width || template.height || template.length) {
          const row: MeasurementRow = {
            id: crypto.randomUUID(),
            description: 'Standard Size',
            count: 1,
            shape: 'Rectangle',
            length: template.length || 0,
            width: template.width || 0,
            height: template.height || 0,
            isDeduction: false,
            total: 0
          };

          let method: CalculationMethod = 'Area';
          if (template.unit === 'sqft') method = 'Area';
          else if (template.unit === 'ft') method = 'Linear';
          
          if (method === 'Area') row.total = row.length * row.width;
          else if (method === 'Linear') row.total = row.length;

          measurements = {
            id: crypto.randomUUID(),
            itemId: itemId,
            method,
            unit: 'ft' as MeasurementUnit,
            rows: [row],
            totalQuantity: row.total
          };
        }

        const qty = measurements ? measurements.totalQuantity : ((template as any).quantity || 1);
        const subtotal = qty * template.rate;
        const discount = subtotal * ((template.discountPercent || 0) / 100);
        const baseAmount = subtotal - discount;
        const exclusiveCharges = template.itemCharges?.filter(c => !c.isInclusive).reduce((sum, c) => sum + c.amount, 0) || 0;

        return {
          id: itemId,
          no: (selectedProject.items.length + index + 1).toString(),
          pvcCode: template.pvcCode,
          name: template.name,
          description: template.description,
          itemType: 'Main',
          category: template.category,
          unit: template.unit,
          qty,
          rate: template.rate,
          discountPercent: template.discountPercent || 0,
          amount: baseAmount + exclusiveCharges,
          calculations: measurements ? `Measured: ${measurements.totalQuantity.toFixed(2)} ${template.unit}` : '',
          specification: template.specification,
          itemCharges: template.itemCharges?.map(c => ({ ...c, id: crypto.randomUUID() })),
          measurements,
          variationStatus: 'Additional',
          variantId: template.variantId,
          rateVersionId: template.rateVersionId,
          baseRateAtTimeOfQuote: template.variantId ? template.rate : undefined
        };
      });

      const updatedProject = {
        ...selectedProject,
        items: [...selectedProject.items, ...newItems]
      };
      setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
      setSelectedProject(updatedProject);
      setShowCatalog(false);
      addNotification('Variations Added', 'Items added to project variations!', 'success', 'Variation', 'medium', { label: 'View Variations', view: 'variations', data: { projectId: selectedProject.id } });
      return;
    }

    let currentTimelineJobs = [...(quote.timeline?.jobs || [])];
    
    const newItems: BOQItem[] = selectedTemplates.map((template, index) => {
      const itemId = crypto.randomUUID();
      const templateBarcode = (template as any).variantBarcode || (template as any).barcode || (template.productCode ? `VAR-${template.productCode.replace(/[^A-Za-z0-9]/g, '')}-01` : `VAR-ITM-${template.id.slice(0, 6).toUpperCase()}`);
      const newItem: BOQItem = {
        id: itemId,
        no: (quote.items.length + index + 1).toString(),
        pvcCode: template.pvcCode,
        productCode: template.productCode,
        name: template.name,
        description: template.description,
        itemType: 'Main',
        category: template.category,
        unit: template.unit,
        qty: (template as any).quantity || 1,
        rate: template.rate,
        discountPercent: template.discountPercent || 0,
        amount: 0,
        calculations: '',
        specification: template.specification,
        itemCharges: template.itemCharges?.map(c => ({ ...c, id: crypto.randomUUID() })),
        templateId: template.id,
        variantId: template.variantId,
        variantCode: (template as any).variantCode || template.productCode,
        variantBarcode: templateBarcode,
        barcode: templateBarcode,
        rateVersionId: template.rateVersionId,
        baseRateAtTimeOfQuote: template.variantId ? template.rate : undefined
      };
      
      // If template has measurements, restore them
      if (template.measurements) {
        newItem.measurements = {
          ...template.measurements,
          id: crypto.randomUUID(),
          itemId: itemId,
          rows: template.measurements.rows.map(r => ({ ...r, id: crypto.randomUUID() }))
        };
        newItem.qty = newItem.measurements.totalQuantity;
        newItem.calculations = `Measured: ${newItem.measurements.totalQuantity.toFixed(2)} ${newItem.unit} (${newItem.measurements.method})`;
      } else if (template.width || template.height || template.length) {
        const row: MeasurementRow = {
          id: crypto.randomUUID(),
          description: 'Standard Size',
          count: 1,
          shape: 'Rectangle',
          length: template.length || 0,
          width: template.width || 0,
          height: template.height || 0,
          isDeduction: false,
          total: 0
        };

        let method: CalculationMethod = 'Area';
        if (template.unit === 'sqft') method = 'Area';
        else if (template.unit === 'ft') method = 'Linear';
        
        // Calculate initial total for the row
        if (method === 'Area') row.total = row.length * row.width;
        else if (method === 'Linear') row.total = row.length;

        const sheet: MeasurementSheet = {
          id: crypto.randomUUID(),
          itemId: itemId,
          method,
          unit: 'ft' as MeasurementUnit,
          rows: [row],
          totalQuantity: row.total
        };

        newItem.measurements = sheet;
        newItem.qty = sheet.totalQuantity;
        newItem.calculations = `Measured: ${sheet.totalQuantity.toFixed(2)} ${newItem.unit} (${sheet.method})`;
      }
      
      const subtotal = newItem.qty * newItem.rate;
      const discount = subtotal * (newItem.discountPercent / 100);
      const baseAmount = subtotal - discount;
      const exclusiveCharges = newItem.itemCharges?.filter(c => !c.isInclusive).reduce((sum, c) => sum + c.amount, 0) || 0;
      
      newItem.amount = baseAmount + exclusiveCharges;

      // Automatically generate jobs for this item
      const itemJobs = generateDefaultJobsForItem(newItem);
      currentTimelineJobs = [...currentTimelineJobs, ...itemJobs];

      return newItem;
    });

    setQuote({
      ...quote,
      items: [...quote.items, ...newItems],
      timeline: {
        ...(quote.timeline || { id: crypto.randomUUID(), quoteId: quote.id, jobs: [] }),
        jobs: currentTimelineJobs
      }
    });
    setShowCatalog(false);
  };

  const handleQuickAddItem = (
    template: ItemTemplate & { quantity?: number; selectedVariant?: ProductVariant },
    targetProjectId?: string
  ) => {
    // 1. Resolve target project
    const targetProject = (targetProjectId && projects.find(p => p.id === targetProjectId))
      || selectedProject
      || projects.find(p => p.status === 'In Progress')
      || projects[0];

    const itemId = crypto.randomUUID();
    const qty = template.quantity && template.quantity > 0 ? template.quantity : 1;

    let measurements = undefined;
    if (template.measurements) {
      measurements = {
        ...template.measurements,
        id: crypto.randomUUID(),
        itemId: itemId,
        rows: template.measurements.rows.map(r => ({ ...r, id: crypto.randomUUID() }))
      };
    } else if (template.width || template.height || template.length) {
      const row: MeasurementRow = {
        id: crypto.randomUUID(),
        description: 'Standard Size',
        count: 1,
        shape: 'Rectangle',
        length: template.length || 0,
        width: template.width || 0,
        height: template.height || 0,
        isDeduction: false,
        total: 0
      };

      let method: CalculationMethod = 'Area';
      if (template.unit === 'sqft') method = 'Area';
      else if (template.unit === 'ft') method = 'Linear';
      
      if (method === 'Area') row.total = row.length * row.width;
      else if (method === 'Linear') row.total = row.length;

      measurements = {
        id: crypto.randomUUID(),
        itemId: itemId,
        method,
        unit: 'ft' as MeasurementUnit,
        rows: [row],
        totalQuantity: row.total
      };
    }

    const effectiveQty = measurements ? measurements.totalQuantity : qty;
    const subtotal = effectiveQty * template.rate;
    const discount = subtotal * ((template.discountPercent || 0) / 100);
    const baseAmount = subtotal - discount;
    const exclusiveCharges = template.itemCharges?.filter(c => !c.isInclusive).reduce((sum, c) => sum + c.amount, 0) || 0;

    const newItem: BOQItem = {
      id: itemId,
      no: targetProject ? (targetProject.items.length + 1).toString() : (quote.items.length + 1).toString(),
      pvcCode: template.pvcCode,
      name: template.name,
      description: template.description,
      itemType: 'Main',
      category: template.category,
      unit: template.unit,
      qty: effectiveQty,
      rate: template.rate,
      discountPercent: template.discountPercent || 0,
      amount: baseAmount + exclusiveCharges,
      calculations: measurements ? `Measured: ${measurements.totalQuantity.toFixed(2)} ${template.unit}` : '',
      specification: template.specification,
      itemCharges: template.itemCharges?.map(c => ({ ...c, id: crypto.randomUUID() })),
      measurements,
      templateId: template.id,
      variantId: template.variantId,
      rateVersionId: template.rateVersionId,
      baseRateAtTimeOfQuote: template.variantId ? template.rate : undefined,
      variationStatus: targetProject ? 'Additional' : undefined
    };

    // Append to active project's BOQ
    if (targetProject) {
      const updatedItems = [...targetProject.items, newItem];
      const newTotalValue = updatedItems.reduce((sum, i) => sum + (i.amount || (i.qty * i.rate)), 0);
      const updatedProject: Project = {
        ...targetProject,
        items: updatedItems,
        totalValue: newTotalValue
      };

      setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
      if (selectedProject?.id === updatedProject.id) {
        setSelectedProject(updatedProject);
      }

      addNotification(
        'Quick Added to Project BOQ',
        `Appended ${effectiveQty}x "${newItem.name}" directly to ${targetProject.projectName}'s BOQ.`,
        'success',
        'BOQ',
        'low'
      );
    }

    // Also update current quote if open in editor
    if (view === 'editor') {
      let currentTimelineJobs = [...(quote.timeline?.jobs || [])];
      const itemJobs = generateDefaultJobsForItem(newItem);
      currentTimelineJobs = [...currentTimelineJobs, ...itemJobs];

      setQuote(prev => ({
        ...prev,
        items: [...prev.items, newItem],
        timeline: {
          ...(prev.timeline || { id: crypto.randomUUID(), quoteId: prev.id, jobs: [] }),
          jobs: currentTimelineJobs
        }
      }));

      if (!targetProject) {
        addNotification(
          'Quick Added to Active Quote',
          `Appended ${effectiveQty}x "${newItem.name}" directly to current Quote BOQ.`,
          'success',
          'BOQ',
          'low'
        );
      }
    }

    return {
      success: true,
      targetName: targetProject ? targetProject.projectName : 'Active Quote',
      isProject: !!targetProject,
      itemId
    };
  };

  const handleAddItem = (type: 'Title' | 'Main' | 'Sub' = 'Main') => {
    const newItemId = crypto.randomUUID();
    const itemNum = quote.items.length + 1;
    const defaultBarcode = type === 'Title' ? undefined : `VAR-ALW-${String(itemNum).padStart(3, '0')}`;
    const newItem: BOQItem = {
      id: newItemId,
      no: itemNum.toString(),
      name: '',
      description: '',
      itemType: type,
      category: 'Aluminium',
      unit: type === 'Title' ? 'None' : 'sqft',
      qty: type === 'Title' ? 0 : 1,
      rate: 0,
      discountPercent: 0,
      amount: 0,
      productCode: type === 'Title' ? undefined : 'AL-WD-001',
      variantCode: type === 'Title' ? undefined : `AL-WIN-70-2W-${String(itemNum).padStart(3, '0')}`,
      variantBarcode: defaultBarcode,
      barcode: defaultBarcode
    };
    
    // Automatically generate jobs for this item (only for Main and Sub items)
    let updatedTimeline = quote.timeline;
    if (type !== 'Title') {
      const newJobs = generateDefaultJobsForItem(newItem);
      updatedTimeline = {
        ...(quote.timeline || { id: crypto.randomUUID(), quoteId: quote.id, jobs: [] }),
        jobs: [...(quote.timeline?.jobs || []), ...newJobs]
      };
    }

    setQuote({
      ...quote,
      items: [...quote.items, newItem],
      timeline: updatedTimeline
    });
  };

  const handleDeleteItem = (id: string) => {
    const newItems = quote.items.filter(item => item.id !== id);
    const newJobs = quote.timeline?.jobs.filter(job => job.itemId !== id) || [];
    setQuote({
      ...quote,
      items: newItems,
      timeline: quote.timeline ? { ...quote.timeline, jobs: newJobs } : undefined
    });
  };

  const handleDuplicateItem = (id: string) => {
    const index = quote.items.findIndex(item => item.id === id);
    if (index === -1) return;
    
    const item = quote.items[index];
    const newItemId = crypto.randomUUID();
    const newItem = { 
      ...item, 
      id: newItemId,
      measurements: item.measurements ? { ...item.measurements, id: crypto.randomUUID() } : undefined,
      itemCharges: item.itemCharges?.map(c => ({ ...c, id: crypto.randomUUID() })),
      specification: item.specification ? JSON.parse(JSON.stringify(item.specification)) : undefined
    };
    
    const newItems = [...quote.items];
    newItems.splice(index + 1, 0, newItem);
    
    let updatedTimeline = quote.timeline;
    if (item.itemType !== 'Title') {
      const originalJobs = quote.timeline?.jobs.filter(job => job.itemId === id) || [];
      const duplicatedJobs = originalJobs.map(job => ({
        ...job,
        id: crypto.randomUUID(),
        itemId: newItemId
      }));
      updatedTimeline = {
        ...(quote.timeline || { id: crypto.randomUUID(), quoteId: quote.id, jobs: [] }),
        jobs: [...(quote.timeline?.jobs || []), ...duplicatedJobs]
      };
    }
    
    setQuote({
      ...quote,
      items: newItems,
      timeline: updatedTimeline
    });
  };

  const handleInsertItem = (type: 'Title' | 'Main' | 'Sub', index: number) => {
    const newItemId = crypto.randomUUID();
    const shortCode = crypto.randomUUID().slice(0, 4).toUpperCase();
    const defaultBarcode = type === 'Title' ? undefined : `VAR-BOQ-${shortCode}`;
    const newItem: BOQItem = {
      id: newItemId,
      no: '',
      name: '',
      description: '',
      itemType: type,
      category: 'Aluminium',
      unit: type === 'Title' ? 'None' : 'sqft',
      qty: type === 'Title' ? 0 : 1,
      rate: 0,
      discountPercent: 0,
      amount: 0,
      productCode: type === 'Title' ? undefined : 'AL-WD-001',
      variantCode: type === 'Title' ? undefined : `AL-WIN-VAR-${shortCode}`,
      variantBarcode: defaultBarcode,
      barcode: defaultBarcode
    };
    
    const newItems = [...quote.items];
    newItems.splice(index + 1, 0, newItem);
    
    let updatedTimeline = quote.timeline;
    if (type !== 'Title') {
      const newJobs = generateDefaultJobsForItem(newItem);
      updatedTimeline = {
        ...(quote.timeline || { id: crypto.randomUUID(), quoteId: quote.id, jobs: [] }),
        jobs: [...(quote.timeline?.jobs || []), ...newJobs]
      };
    }
    
    setQuote({
      ...quote,
      items: newItems,
      timeline: updatedTimeline
    });
  };

  const handleMoveItem = (id: string, direction: 'up' | 'down') => {
    const index = quote.items.findIndex(item => item.id === id);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === quote.items.length - 1) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const newItems = [...quote.items];
    const [movedItem] = newItems.splice(index, 1);
    newItems.splice(newIndex, 0, movedItem);
    
    setQuote({
      ...quote,
      items: newItems
    });
  };

  const handleSaveAsTemplate = (item: BOQItem) => {
    const newTemplate: ItemTemplate = {
      id: crypto.randomUUID(),
      pvcCode: item.pvcCode,
      variantId: item.variantId,
      name: item.name,
      description: item.description,
      category: item.category,
      unit: item.unit,
      rate: item.rate,
      discountPercent: item.discountPercent,
      isPopular: false,
      specification: item.specification,
      itemCharges: item.itemCharges,
      measurements: item.measurements,
      productType: item.productType || 'Product',
      status: item.status || 'Active',
      productCode: item.productCode
    };

    // If item has measurements, we could potentially save dimensions too
    if (item.measurements && item.measurements.rows.length > 0) {
      const firstRow = item.measurements.rows[0];
      newTemplate.length = firstRow.length;
      newTemplate.width = firstRow.width;
      newTemplate.height = firstRow.height;
    }
    
    saveItemTemplate(newTemplate);
  };

  const handleViewHistoryItem = (type: 'Quote' | 'Invoice' | 'Payment' | 'Adjustment' | 'Variation', id: string) => {
    if (type === 'Quote') {
      const q = quotes.find(q => q.id === id);
      if (q) {
        setQuote(q);
        setView('editor');
      }
    } else if (type === 'Invoice') {
      setView('invoices');
    } else if (type === 'Payment') {
      setAccountingTab('payments');
      setView('accounting');
    } else if (type === 'Adjustment') {
      setAccountingTab('adjustments');
      setView('accounting');
    } else if (type === 'Variation') {
      setProjectTab('variations');
    }
  };



  const navTabs = useMemo(() => {
    return getNavigationTabs({
      userId: activeSecurityUser?.id,
      view,
      setView,
      dashboardPerspective,
      setDashboardPerspective,
      showCatalog,
      quotesCount: quotes.length,
      projectsCount: projects.length,
      invoicesCount: invoices.length,
      clientsCount: clients.length,
      personnelCount: personnel.length,
      equipmentCount: equipment.length,
      ncrsCount: ncrs.length,
      warrantyCount: warrantyCertificates.length,
      auditCount: auditLogs.length,
      setOpenDropdown,
      handleNewQuote,
      setShowCatalog,
      setCatalogInitialTab,
      setBoqInitialTab,
      setShowTemplateManager,
      handleOpenImportModal,
      setInvoiceProjectFilter,
      handleCreateProject,
      setLifecycleTab,
      setAccountingTab,
      setAccountingProjectFilter,
      setReportingReport,
      setIsDownloadPortalOpen,
      selectedPortalClient,
      setSelectedPortalClient,
      clients,
      setResourceTab,
      setEquipmentTab,
      setSiteTab,
      setQcTab,
      setWarrantyTab,
      setProcurementTab,
      setOperationalPortalId,
      setSettingsInitialTab,
      setSecurityInitialTab,
    });
  }, [
    activeSecurityUser?.id,
    effectivePermissions,
    securityUsers,
    securityRoles,
    accessRequests,
    view,
    dashboardPerspective,
    showCatalog,
    operationalPortalId,
    quotes.length,
    projects.length,
    invoices.length,
    clients.length,
    personnel.length,
    equipment.length,
    ncrs.length,
    warrantyCertificates.length,
    auditLogs.length,
    selectedPortalClient,
    clients,
    handleNewQuote,
    handleCreateProject,
    handleOpenImportModal,
    setShowCatalog,
    setCatalogInitialTab,
    setBoqInitialTab,
    setShowTemplateManager,
    setInvoiceProjectFilter,
    setLifecycleTab,
    setAccountingTab,
    setAccountingProjectFilter,
    setReportingReport,
    setIsDownloadPortalOpen,
    setSelectedPortalClient,
    setResourceTab,
    setEquipmentTab,
    setSiteTab,
    setQcTab,
    setWarrantyTab,
    setView
  ]);

  const searchAccessContext = useMemo<SearchAccessContext>(() => ({
    user: activeSecurityUser || null,
    isSuperAdmin: isSuperAdminUser,
    canAccessPortal,
    hasPermission
  }), [activeSecurityUser, isSuperAdminUser, canAccessPortal, hasPermission]);

  const universalSearchItems = useMemo(() => {
    return buildSystemUniversalSearchIndex({
      navTabs,
      quotes,
      projects,
      clients,
      invoices,
      payments,
      adjustments,
      itemTemplates,
      productFamilies,
      productVariants,
      templates,
      notifications,
      personnel,
      equipment,
      ncrs,
      warrantyCertificates,
      verificationRegistry,
      securityUsers,
      isDarkMode,
      setView,
      setQuote,
      setSelectedProject,
      setProjectTab,
      setSelectedPortalClient,
      setInvoiceProjectFilter,
      setPreselectedInvoiceId,
      setAccountingTab,
      setReportingReport,
      setProcurementTab,
      setOperationalPortalId,
      setResourceTab,
      setEquipmentTab,
      setSiteTab,
      setQcTab,
      setWarrantyTab,
      setBoqInitialTab,
      setCatalogInitialTab,
      setShowCatalog,
      setShowTemplateManager,
      setShowNotifications,
      setSettingsInitialTab,
      setSecurityInitialTab,
      setInitialVerificationCode,
      handleNewQuote,
      handleCreateProject,
      handleOpenImportModal,
      handleRefreshSystemData,
      toggleDarkMode,
      setTheme,
      exportAllData,
      exportAllDocuments
    });
  }, [
    navTabs,
    quotes,
    projects,
    clients,
    invoices,
    payments,
    adjustments,
    itemTemplates,
    productFamilies,
    productVariants,
    templates,
    notifications,
    personnel,
    equipment,
    ncrs,
    warrantyCertificates,
    verificationRegistry,
    securityUsers,
    isDarkMode,
    theme
  ]);

  // Evaluate required portal & permissions for the currently active view
  const viewRequirement = useMemo(() => {
    switch (view) {
      case 'home':
      case 'stealth-tunnel':
        return null;
      case 'settings':
        if (settingsInitialTab === 'profile') return null;
        return { portalId: 'system-administration' as const, portalName: 'Admin & Security Control Center', perm: 'settings.manage' };
      case 'dashboard':
        return { portalId: 'executive-dashboard' as const, portalName: 'Executive Dashboard', perm: 'reports.view' };
      case 'history':
      case 'editor':
        return { portalId: 'sales-crm-quotes' as const, portalName: 'Sales, CRM & Quotations', perm: 'quotes.view' };
      case 'clients':
        return { portalId: 'sales-crm-quotes' as const, portalName: 'Client Directory & CRM', perm: 'clients.view' };
      case 'portal-view':
      case 'customer-portal':
        return { portalId: 'customer-portal' as const, portalName: 'Customer Portal', perm: 'clients.view' };
      case 'boq-items':
      case 'pricing-intelligence':
        return { portalId: 'engineering-qs-boq' as const, portalName: 'BOQ Engineering & Pricing', perm: 'boq.view' };
      case 'projects':
      case 'project-details':
        return { portalId: 'project-management' as const, portalName: 'Project Management', perm: 'project.view' };
      case 'project-lifecycle':
        if (lifecycleTab === 'phases') return null; // Allowed via Account Menu 'New Schedules'
        return { portalId: 'project-management' as const, portalName: 'Project Lifecycle & WBS', perm: 'project.view' };
      case 'variation-manager':
        return { portalId: 'project-management' as const, portalName: 'Variation Order (VO) Manager', perm: 'variation.view' };
      case 'post-evaluation':
        return { portalId: 'project-management' as const, portalName: 'Project Post-Evaluation', perm: 'project.view' };
      case 'invoices':
      case 'accounting':
        return { portalId: 'accounting-finance' as const, portalName: 'Accounting & Finance', perm: 'finance.view' };
      case 'reporting':
        return { portalId: 'reporting-analytics' as const, portalName: 'Enterprise Reporting & Analytics', perm: 'reports.view' };
      case 'payroll':
        return { portalId: 'human-resources' as const, portalName: 'Payroll & WPS Center', perm: 'payroll.view' };
      case 'resource-management':
        return { portalId: 'human-resources' as const, portalName: 'Human Capital & Workforce', perm: 'hr.view' };
      case 'equipment-management':
        return { portalId: 'equipment-machinery' as const, portalName: 'Equipment & Plant Machinery', perm: 'equipment.view' };
      case 'site-management':
        return { portalId: 'construction-site-management' as const, portalName: 'Site & HSE Safety Control', perm: 'site.view' };
      case 'quality-control':
      case 'after-sales':
      case 'warranty':
        return { portalId: 'quality-assurance' as const, portalName: 'Quality Assurance (QA/QC)', perm: 'qc.view' };
      case 'procurement':
      case 'procurement-costs':
        return { portalId: 'procurement-supply-chain' as const, portalName: 'Procurement & Supply Chain', perm: 'procurement.view' };
      case 'operational-control':
        if (operationalPortalId === 'hr') {
          return { portalId: 'human-resources' as const, portalName: 'Human Capital Management (HR)', perm: 'hr.view' };
        }
        return { portalId: 'factory-workshop-management' as const, portalName: 'Factory & Workshop Control', perm: 'factory.view' };
      case 'verification':
        return { portalId: 'document-control' as const, portalName: 'Document Control & Verification', perm: 'document.view' };
      case 'audit-log':
        return { portalId: 'system-administration' as const, portalName: 'Global Audit Trail', perm: 'security.audit' };
      default:
        return null;
    }
  }, [view, settingsInitialTab, lifecycleTab, operationalPortalId]);

  const isCurrentViewPermitted = useMemo(() => {
    if (isSuperAdminUser || !viewRequirement) return true;
    if (view === 'dashboard') {
      if (activeSecurityUser?.isExternalUser) return false;
      return (
        canAccessPortal('executive-dashboard') ||
        canAccessPortal('reporting-analytics') ||
        hasPermission('project.view') ||
        hasPermission('finance.view') ||
        hasPermission('quotes.view')
      );
    }
    if (view === 'procurement' || view === 'procurement-costs') {
      return (
        (canAccessPortal('procurement-supply-chain') && hasPermission('procurement.view')) ||
        (canAccessPortal('inventory-warehouse') && hasPermission('inventory.view')) ||
        (canAccessPortal('supplier-portal') && hasPermission('supplier.view')) ||
        (canAccessPortal('partner-factory-portal') && hasPermission('subcontractor.view'))
      );
    }
    if (view === 'operational-control') {
      if (operationalPortalId === 'hr') {
        return canAccessPortal('human-resources') && hasPermission('hr.view');
      }
      return (
        (canAccessPortal('factory-workshop-management') && hasPermission('factory.view')) ||
        (canAccessPortal('production-control') && hasPermission('production.view')) ||
        (canAccessPortal('partner-factory-portal') && hasPermission('subcontractor.view'))
      );
    }
    if (view === 'site-management') {
      return (
        (canAccessPortal('construction-site-management') && hasPermission('site.view')) ||
        (canAccessPortal('hse-safety') && hasPermission('hse.view'))
      );
    }
    if (view === 'after-sales' || view === 'warranty') {
      return (
        (canAccessPortal('quality-assurance') && hasPermission('qc.view')) ||
        (canAccessPortal('customer-portal') && hasPermission('clients.view'))
      );
    }
    return canAccessPortal(viewRequirement.portalId) && hasPermission(viewRequirement.perm);
  }, [
    isSuperAdminUser,
    viewRequirement,
    view,
    operationalPortalId,
    activeSecurityUser,
    canAccessPortal,
    hasPermission,
    effectivePermissions,
    accessRequests
  ]);

  const canCreateQuote = isSuperAdminUser || (canAccessPortal('sales-crm-quotes') && hasPermission('quotes.create'));
  const canCreateInvoice = isSuperAdminUser || (canAccessPortal('accounting-finance') && hasPermission('finance.create'));
  const canCreateProduct = isSuperAdminUser || (canAccessPortal('engineering-qs-boq') && hasPermission('boq.edit'));
  const canCreateClient = isSuperAdminUser || (canAccessPortal('sales-crm-quotes') && hasPermission('clients.create'));
  const canCreateProject = isSuperAdminUser || (canAccessPortal('project-management') && hasPermission('project.create'));
  const canViewProcDocs = isSuperAdminUser || (canAccessPortal('procurement-supply-chain') && hasPermission('procurement.view'));
  const canImportData = isSuperAdminUser || (canAccessPortal('system-administration') && hasPermission('settings.manage'));
  const canManageSystemSettings = isSuperAdminUser || (canAccessPortal('system-administration') && (hasPermission('settings.manage') || hasPermission('security.view') || hasPermission('security.admin')));
  const hasAnyAddNewAction = canCreateQuote || canCreateInvoice || canCreateProduct || canCreateClient || canCreateProject || canViewProcDocs || canImportData;

  const handleAuthSuccess = useCallback((authenticatedUser?: SecurityUser) => {
    setShowAuthModal(false);
    const targetUser = authenticatedUser || currentUser;
    if (targetUser) {
      const portalRoute = getUniquePortalForUser(targetUser);
      if (portalRoute.operationalPortalId) {
        setOperationalPortalId(portalRoute.operationalPortalId as OperationalPortalId);
      }
      setView(portalRoute.view as any);
      toast.success(`Welcome, ${targetUser.fullName}`, {
        description: `Authenticated as ${targetUser.roleName}.`
      });
    }
  }, [currentUser]);

  if (!isAuthenticated || !currentUser) {
    return <LoginPage onSuccess={handleAuthSuccess} />;
  }

  if (showAuthModal) {
    return <LoginPage onSuccess={handleAuthSuccess} onCancel={() => setShowAuthModal(false)} />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-900">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200/80 shadow-xs">
        {/* Row 1: Brand, Branch, Search, Quick Actions, Profile */}
        <div className="h-16 px-4 md:px-6 flex items-center justify-between gap-4 relative z-20 bg-white">
          {/* Left: Hamburger (mobile), Brand & Branch Selector */}
          <div className="flex items-center gap-3 md:gap-4 shrink-0">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <div 
              className="flex items-center gap-2.5 cursor-pointer select-none"
              onClick={() => { setView('home'); setMobileMenuOpen(false); }}
            >
              {(() => {
                const mediaCfg = loginMediaService.getSettings();
                const lightLogoUrl = companySettings.logo || mediaCfg.companyLogoUrl;
                const darkLogoUrl = companySettings.logoDark || mediaCfg.companyLogoDarkUrl;
                const activeNavLogo = isDarkMode ? (darkLogoUrl || lightLogoUrl) : (lightLogoUrl || darkLogoUrl);
                return activeNavLogo ? (
                  <img
                    src={activeNavLogo}
                    alt="Company Logo"
                    className="h-9 max-w-[130px] object-contain rounded-lg"
                  />
                ) : (
                  <div className="w-9 h-9 bg-orange-500 rounded-lg flex items-center justify-center text-white text-base shadow-sm">
                    🛍️
                  </div>
                );
              })()}
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-base text-slate-900 leading-tight">Dreams</span>
                  <span className="text-[10px] font-semibold text-orange-500 uppercase tracking-wide bg-orange-50 px-1.5 py-0.5 rounded">POS</span>
                </div>
                <p className="text-[11px] text-slate-400 font-normal hidden sm:block">
                  {loginMediaService.getSettings().systemName || 'Innovista Precision Suite'}
                </p>
              </div>
            </div>

            {/* Branch Selector Dropdown */}
            <div className="relative hidden md:block branch-wrapper">
              <button
                onClick={() => setIsBranchOpen(!isBranchOpen)}
                className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 transition-colors"
              >
                <Store size={13} className="text-orange-500" />
                <span>{selectedBranch}</span>
                <ChevronDown size={13} className="text-slate-400" />
              </button>

              {isBranchOpen && (
                <div className="absolute left-0 top-full mt-1.5 w-44 bg-white rounded-lg shadow-lg border border-slate-200 py-1.5 z-40">
                  {['Main Store', 'Colombo Central', 'Kandy Hub', 'Airport Logistics'].map((branch) => (
                    <button
                      key={branch}
                      onClick={() => {
                        setSelectedBranch(branch);
                        setIsBranchOpen(false);
                      }}
                      className={cn(
                        "w-full text-left px-3 py-2 text-xs transition-colors",
                        selectedBranch === branch 
                          ? "bg-orange-50 text-orange-600 font-medium" 
                          : "text-slate-700 hover:bg-slate-50"
                      )}
                    >
                      {branch}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Center: Universal Global Search Bar */}
          <UniversalGlobalSearchBar
            allItems={universalSearchItems}
            accessContext={searchAccessContext}
            query={globalSearch}
            onQueryChange={setGlobalSearch}
          />

          {/* Right: Quick Actions, Alerts, Settings, Profile */}
          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            {/* Primary "+ Add New" Button (Filtered by role permissions) */}
            {hasAnyAddNewAction && (
              <div className="relative add-new-wrapper">
                <button
                  onClick={() => setIsAddNewOpen(!isAddNewOpen)}
                  className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg font-medium text-xs transition-colors shadow-xs"
                >
                  <Plus size={14} />
                  <span className="hidden sm:inline">Add New</span>
                </button>

                {isAddNewOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-lg shadow-lg border border-slate-200 py-1.5 z-40">
                    {canCreateQuote && (
                      <button
                        onClick={() => {
                          handleNewQuote();
                          setIsAddNewOpen(false);
                        }}
                        className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <FileText size={14} className="text-orange-500" />
                        New Quote
                      </button>
                    )}
                    {canCreateInvoice && (
                      <button
                        onClick={() => {
                          setView('invoices');
                          setIsAddNewOpen(false);
                        }}
                        className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <CreditCard size={14} className="text-emerald-500" />
                        New Invoice
                      </button>
                    )}
                    {canCreateProduct && (
                      <button
                        onClick={() => {
                          setView('boq-items');
                          setIsAddNewOpen(false);
                        }}
                        className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <Package size={14} className="text-blue-500" />
                        New Product
                      </button>
                    )}
                    {canCreateClient && (
                      <button
                        onClick={() => {
                          setView('clients');
                          setIsAddNewOpen(false);
                        }}
                        className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <User size={14} className="text-purple-500" />
                        New Client
                      </button>
                    )}
                    {canCreateProject && (
                      <button
                        onClick={() => {
                          setView('projects');
                          setIsAddNewOpen(false);
                        }}
                        className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <CheckCircle2 size={14} className="text-indigo-500" />
                        New Project
                      </button>
                    )}
                    {canViewProcDocs && (
                      <button
                        onClick={() => {
                          setProcurementTab('documents');
                          setView('procurement');
                          setIsAddNewOpen(false);
                        }}
                        className="w-full text-left px-3.5 py-2 text-xs font-medium text-amber-700 hover:bg-amber-50 flex items-center gap-2 border-t border-slate-100"
                      >
                        <FileText size={14} className="text-amber-600" />
                        Procurement Document
                      </button>
                    )}
                    {canImportData && (
                      <button
                        onClick={() => {
                          handleOpenImportModal();
                          setIsAddNewOpen(false);
                        }}
                        className="w-full text-left px-3.5 py-2 text-xs font-bold text-sky-700 hover:bg-sky-50 flex items-center gap-2 border-t border-slate-100"
                      >
                        <FileSpreadsheet size={14} className="text-sky-600" />
                        Import Excel / CSV
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Universal Data Import Studio Button (Only if permitted) */}
            {canImportData && (
              <button
                onClick={() => handleOpenImportModal()}
                className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white px-3 py-1.5 rounded-lg font-medium text-xs transition-colors shadow-xs"
                title="Import & Verify Data from CSV/Excel"
              >
                <FileSpreadsheet size={14} />
                <span className="hidden sm:inline">Import Data</span>
              </button>
            )}

            {/* POS Quick Button (Only if permitted to create quotes) */}
            {canCreateQuote && (
              <button
                onClick={() => handleNewQuote()}
                className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg font-medium text-xs transition-colors shadow-xs"
              >
                POS
              </button>
            )}

            <div className="h-4 w-px bg-slate-200 hidden sm:block mx-0.5" />

            {/* Direct Universal Home Navigation Button */}
            <button
              onClick={() => {
                setView('home');
                setOpenDropdown(null);
              }}
              title="Navigate to Home Control Center"
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer select-none",
                view === 'home'
                  ? "bg-orange-600 text-white shadow-orange-200 ring-2 ring-orange-200"
                  : "bg-orange-50 hover:bg-orange-600 text-orange-600 hover:text-white border border-orange-200 hover:border-orange-600"
              )}
            >
              <Home size={14} className={view === 'home' ? 'text-white' : 'text-orange-500 hover:text-white'} />
              <span>Home</span>
            </button>

            {/* System Data Refresh Button (Refreshes data only, keeps user logged in) */}
            <button
              onClick={handleRefreshSystemData}
              disabled={isRefreshingData}
              title="Refresh System Data (Keep Active Session)"
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all border shadow-xs cursor-pointer select-none",
                isRefreshingData
                  ? "bg-amber-50 text-amber-700 border-amber-300 ring-2 ring-amber-200"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border-slate-200 hover:border-slate-300"
              )}
            >
              <RotateCw 
                size={14} 
                className={cn(
                  "text-slate-600 transition-transform", 
                  isRefreshingData && "animate-spin text-amber-600"
                )} 
              />
              <span className="hidden sm:inline">Refresh Data</span>
            </button>

            {/* System Theme Mode Dropdown (Light, Black, Night Blue, Cream, Charcoal, Emerald Night) */}
            <ThemeModeDropdown compact />

            {/* Notification Bell with Badge */}
            <button
              onClick={() => setShowNotifications(true)}
              title="Notifications"
              className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Bell size={17} />
              {(notifications.filter(
                n =>
                  !n.isRead &&
                  !notificationNewsService.isItemHiddenBySnoozeOrDone(n.id) &&
                  notificationNewsService.isSystemNotificationEligibleForUser(n, activeSecurityUser || null)
              ).length +
                activeDeadlineAlertsCount) > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>

            {/* Settings Gear (Only if permitted for System Administration) */}
            {canManageSystemSettings && (
              <button
                onClick={() => setView('settings')}
                title="Settings"
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  view === 'settings' 
                    ? "text-orange-600 bg-orange-50" 
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                )}
              >
                <Settings size={17} />
              </button>
            )}

            {/* Enterprise User Profile & Security Controller */}
            <div className="relative pl-2 border-l border-slate-200">
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 transition-colors text-left"
                title="Manage User Account & Role-Based Access"
              >
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    {currentUser 
                      ? currentUser.fullName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
                      : 'AV'}
                  </div>
                  <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
                    currentUser?.accountStatus === 'Active' ? 'bg-emerald-500' : 'bg-amber-500'
                  }`} />
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-xs font-semibold text-slate-800 leading-tight truncate max-w-[120px]">
                    {currentUser?.fullName || 'Alexander Vance'}
                  </p>
                  <p className="text-[10px] text-orange-600 font-medium truncate max-w-[120px]">
                    {currentUser?.roleName || 'Super Administrator'}
                  </p>
                </div>
                <ChevronDown size={13} className="text-slate-400 hidden lg:block" />
              </button>

              {/* Clean User Account Menu: Profile, New Schedules, New Notifications, Messages (Chats), and Sign Out */}
              {userDropdownOpen && (
                <>
                  {/* Backdrop to close on outside click */}
                  <div 
                    className="fixed inset-0 z-[140]" 
                    onClick={() => {
                      setUserDropdownOpen(false);
                    }} 
                  />

                  <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 py-2.5 px-2.5 z-[150] animate-in fade-in">
                    {/* User Profile Header & Profile Action */}
                    <div className="pb-2.5 border-b border-slate-100">
                      <div className="flex items-center gap-2.5 px-1">
                        <div className="w-10 h-10 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
                          {currentUser 
                            ? currentUser.fullName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
                            : 'AV'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-900 truncate">{currentUser?.fullName}</p>
                          <p className="text-[11px] text-slate-500 truncate">{currentUser?.email}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-orange-50 text-orange-700 font-mono border border-orange-200 font-medium">
                              {currentUser?.employeeId}
                            </span>
                            <span className="text-[10px] text-slate-400 truncate">· {currentUser?.roleName}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSettingsInitialTab('profile');
                          setView('settings');
                          setUserDropdownOpen(false);
                        }}
                        className="mt-2.5 w-full text-left px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-lg flex items-center justify-between font-medium border border-slate-200/80 transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <User size={14} className="text-orange-500 shrink-0" />
                          <span>My Profile</span>
                        </span>
                        <ChevronRight size={13} className="text-slate-400" />
                      </button>
                    </div>

                    {/* Account Activity Portals: New Schedules, New Notifications, Messages (Chats) */}
                    <div className="py-2 border-b border-slate-100 space-y-1">
                      {/* 1. New Schedules */}
                      <button
                        type="button"
                        onClick={() => {
                          setLifecycleTab('phases');
                          setView('project-lifecycle');
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-2.5 py-2 text-xs text-slate-700 hover:bg-orange-50/70 hover:text-orange-950 rounded-lg flex items-center justify-between font-medium transition-colors group cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            <Calendar size={14} />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 group-hover:text-orange-950 leading-tight">New Schedules</p>
                            <p className="text-[10px] text-slate-400">Upcoming tasks & milestones</p>
                          </div>
                        </div>
                        <span className="px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold">
                          {projects.length || 3}
                        </span>
                      </button>

                      {/* 2. New Notifications */}
                      <button
                        type="button"
                        onClick={() => {
                          setShowNotifications(true);
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-2.5 py-2 text-xs text-slate-700 hover:bg-orange-50/70 hover:text-orange-950 rounded-lg flex items-center justify-between font-medium transition-colors group cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                            <Bell size={14} />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 group-hover:text-orange-950 leading-tight">New Notifications</p>
                            <p className="text-[10px] text-slate-400">Account alerts & updates</p>
                          </div>
                        </div>
                        <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">
                          {notifications.filter(n => !n.isRead).length + activeDeadlineAlertsCount}
                        </span>
                      </button>

                      {/* 3. Message (Chats) */}
                      <button
                        type="button"
                        onClick={() => {
                          setView('stealth-tunnel');
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-2.5 py-2 text-xs text-slate-700 hover:bg-orange-50/70 hover:text-orange-950 rounded-lg flex items-center justify-between font-medium transition-colors group cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                            <MessageSquare size={14} />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 group-hover:text-orange-950 leading-tight">Message (Chats)</p>
                            <p className="text-[10px] text-slate-400">Direct & team conversations</p>
                          </div>
                        </div>
                        <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                          4
                        </span>
                      </button>

                      {/* 4. Gmail & Email Templates */}
                      <button
                        type="button"
                        onClick={() => {
                          setSettingsInitialTab('email-templates');
                          setView('settings');
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-2.5 py-2 text-xs text-slate-700 hover:bg-orange-50/70 hover:text-orange-950 rounded-lg flex items-center justify-between font-medium transition-colors group cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                            <Mail size={14} />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 group-hover:text-orange-950 leading-tight">Gmail & Email Templates</p>
                            <p className="text-[10px] text-slate-400">Email service, templates & logs</p>
                          </div>
                        </div>
                        <span className="px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold">
                          {centralEmailService.getTemplates().length}
                        </span>
                      </button>
                    </div>

                    {/* Sign Out Action & Theme Mode Selector */}
                    <div className="pt-1.5 space-y-1.5">
                      <div className="px-2 py-1">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                          Display Theme Mode
                        </p>
                        <div className="grid grid-cols-3 gap-1">
                          {THEME_MODE_OPTIONS.map(opt => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => setTheme(opt.id)}
                              className={cn(
                                "px-2 py-1 rounded-md text-[10px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer",
                                theme === opt.id
                                  ? "bg-orange-500 text-white"
                                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                              )}
                            >
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{
                                  backgroundColor: opt.swatchBg,
                                  boxShadow: 'inset 0 0 0 1px rgba(128,128,128,0.4)'
                                }}
                              />
                              <span className="truncate">{opt.shortLabel}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          logout();
                          setUserDropdownOpen(false);
                          setShowAuthModal(false);
                        }}
                        className="w-full text-left px-2.5 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2 font-semibold transition-colors cursor-pointer"
                      >
                        <LogOut size={14} className="text-rose-600 shrink-0" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Row 2: Top Navigation Horizontal Bar with Deep Nested Dropdowns */}
        <div className="h-11 px-4 md:px-6 bg-white border-t border-slate-200 flex items-center overflow-visible relative z-10 shadow-2xs">
          <nav className="flex items-center gap-1 shrink-0">
            {navTabs.map((tab, idx) => (
              <NestedNavDropdown
                key={tab.id}
                label={tab.label}
                icon={tab.icon}
                isActive={tab.isActive}
                isOpen={openDropdown === tab.id}
                onToggle={() => setOpenDropdown(openDropdown === tab.id ? null : tab.id)}
                onMouseEnter={() => {
                  if (openDropdown && openDropdown !== tab.id) {
                    setOpenDropdown(tab.id);
                  }
                }}
                onClose={() => setOpenDropdown(null)}
                items={tab.items}
                align={idx >= navTabs.length - 2 ? 'right' : 'left'}
                onDirectClick={tab.onDirectClick}
              />
            ))}
          </nav>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-3 max-h-[80vh] overflow-y-auto shadow-xl space-y-4">
            {/* Mobile search bar if on small screen */}
            <div className="relative sm:hidden">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text"
                placeholder="Search..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between px-2 pt-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Main</p>
                <button
                  onClick={handleRefreshSystemData}
                  disabled={isRefreshingData}
                  className="flex items-center gap-1 text-[11px] font-semibold text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100/80 px-2 py-0.5 rounded border border-amber-200 transition-colors"
                  title="Refresh System Data (Keep Active Session)"
                >
                  <RotateCw size={11} className={cn("transition-transform", isRefreshingData && "animate-spin")} />
                  <span>Refresh Data</span>
                </button>
              </div>
              <button
                onClick={() => { setView('home'); setMobileMenuOpen(false); }}
                className={cn("w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium", view === 'home' ? "bg-orange-50 text-orange-600" : "text-slate-700 hover:bg-slate-50")}
              >
                <Home size={15} /> Home Control Center
              </button>
              <button
                onClick={() => { setView('dashboard'); setMobileMenuOpen(false); }}
                className={cn("w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium", view === 'dashboard' ? "bg-orange-50 text-orange-600" : "text-slate-700 hover:bg-slate-50")}
              >
                <Layout size={15} /> Dashboard
              </button>
              <button
                onClick={() => { setView('history'); setMobileMenuOpen(false); }}
                className={cn("w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium", (view === 'history' || view === 'editor') ? "bg-orange-50 text-orange-600" : "text-slate-700 hover:bg-slate-50")}
              >
                <FileText size={15} /> Quotes
              </button>
              <div className="pt-1">
                <button
                  onClick={() => { setView('boq-items'); setBoqInitialTab('CATEGORIES_ITEMS'); setMobileMenuOpen(false); }}
                  className={cn("w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium", view === 'boq-items' ? "bg-orange-50 text-orange-600" : "text-slate-700 hover:bg-slate-50")}
                >
                  <span className="flex items-center gap-2.5">
                    <Package size={15} /> Products
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">Portals</span>
                </button>
                <div className="ml-7 mt-1 pl-2 border-l border-slate-200 space-y-1">
                  <button
                    onClick={() => { setCatalogInitialTab('OVERVIEW'); setShowCatalog(true); setMobileMenuOpen(false); }}
                    className="w-full text-left py-1 text-[11px] text-slate-600 hover:text-orange-600 flex items-center gap-2"
                  >
                    <Store size={12} className="text-blue-500" />
                    <span>Catalog</span>
                  </button>
                  <button
                    onClick={() => { setCatalogInitialTab('CATEGORIES'); setShowCatalog(true); setMobileMenuOpen(false); }}
                    className="w-full text-left py-1 text-[11px] text-slate-600 hover:text-orange-600 flex items-center gap-2"
                  >
                    <FolderTree size={12} className="text-emerald-500" />
                    <span>Categories</span>
                  </button>
                  <button
                    onClick={() => { setBoqInitialTab('VARIANTS_LIST'); setView('boq-items'); setMobileMenuOpen(false); }}
                    className="w-full text-left py-1 text-[11px] text-slate-600 hover:text-orange-600 flex items-center gap-2"
                  >
                    <SlidersHorizontal size={12} className="text-slate-400" />
                    <span>Variants</span>
                  </button>
                  <button
                    onClick={() => { setBoqInitialTab('SPEC_ENGINE'); setView('boq-items'); setMobileMenuOpen(false); }}
                    className="w-full text-left py-1 text-[11px] text-slate-600 hover:text-orange-600 flex items-center gap-2"
                  >
                    <Cpu size={12} className="text-slate-400" />
                    <span>Specs</span>
                  </button>
                  <button
                    onClick={() => { setBoqInitialTab('PRICING_INTELLIGENCE'); setView('boq-items'); setMobileMenuOpen(false); }}
                    className="w-full text-left py-1 text-[11px] text-slate-600 hover:text-orange-600 flex items-center gap-2"
                  >
                    <TrendingUp size={12} className="text-slate-400" />
                    <span>Pricing</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-1 pt-2 border-t border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">Finance</p>
              <button
                onClick={() => { setInvoiceProjectFilter(null); setView('invoices'); setMobileMenuOpen(false); }}
                className={cn("w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium", view === 'invoices' ? "bg-orange-50 text-orange-600" : "text-slate-700 hover:bg-slate-50")}
              >
                <CreditCard size={15} /> Invoices
              </button>
              <button
                onClick={() => { setAccountingProjectFilter(null); setView('accounting'); setMobileMenuOpen(false); }}
                className={cn("w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium", view === 'accounting' ? "bg-orange-50 text-orange-600" : "text-slate-700 hover:bg-slate-50")}
              >
                <Building2 size={15} /> Accounting
              </button>
              <button
                onClick={() => { setView('reporting'); setMobileMenuOpen(false); }}
                className={cn("w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium", view === 'reporting' ? "bg-orange-50 text-orange-600" : "text-slate-700 hover:bg-slate-50")}
              >
                <BarChart3 size={15} /> Reports
              </button>
            </div>

            <div className="space-y-1 pt-2 border-t border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">Projects</p>
              <button
                onClick={() => { setView('projects'); setMobileMenuOpen(false); }}
                className={cn("w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium", (view === 'projects' || view === 'project-details') ? "bg-orange-50 text-orange-600" : "text-slate-700 hover:bg-slate-50")}
              >
                <CheckCircle2 size={15} /> Projects
              </button>
              <button
                onClick={() => { setView('variation-manager'); setMobileMenuOpen(false); }}
                className={cn("w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium", view === 'variation-manager' ? "bg-orange-50 text-orange-600" : "text-slate-700 hover:bg-slate-50")}
              >
                <PlusCircle size={15} /> Variations
              </button>
              <button
                onClick={() => { setView('project-lifecycle'); setMobileMenuOpen(false); }}
                className={cn("w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium", view === 'project-lifecycle' ? "bg-orange-50 text-orange-600" : "text-slate-700 hover:bg-slate-50")}
              >
                <GanttChart size={15} /> Lifecycle
              </button>
              <button
                onClick={() => { setView('post-evaluation'); setMobileMenuOpen(false); }}
                className={cn("w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium", view === 'post-evaluation' ? "bg-orange-50 text-orange-600" : "text-slate-700 hover:bg-slate-50")}
              >
                <Scale size={15} /> Evaluation
              </button>
            </div>

            <div className="space-y-1 pt-2 border-t border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">Operations</p>
              <button
                onClick={() => { setView('clients'); setMobileMenuOpen(false); }}
                className={cn("w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium", view === 'clients' ? "bg-orange-50 text-orange-600" : "text-slate-700 hover:bg-slate-50")}
              >
                <User size={15} /> Clients
              </button>
              <button
                onClick={() => {
                  if (!selectedPortalClient && clients.length > 0) setSelectedPortalClient(clients[0]);
                  setView('portal-view');
                  setMobileMenuOpen(false);
                }}
                className={cn("w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium", (view === 'portal-view' || view === 'customer-portal') ? "bg-orange-50 text-orange-600" : "text-slate-700 hover:bg-slate-50")}
              >
                <ExternalLink size={15} /> Portal
              </button>
              <button
                onClick={() => { setView('resource-management'); setMobileMenuOpen(false); }}
                className={cn("w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium", view === 'resource-management' ? "bg-orange-50 text-orange-600" : "text-slate-700 hover:bg-slate-50")}
              >
                <Users size={15} /> Workforce
              </button>
              <button
                onClick={() => { setView('equipment-management'); setMobileMenuOpen(false); }}
                className={cn("w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium", view === 'equipment-management' ? "bg-orange-50 text-orange-600" : "text-slate-700 hover:bg-slate-50")}
              >
                <Wrench size={15} /> Equipment
              </button>
              <button
                onClick={() => { setView('site-management'); setMobileMenuOpen(false); }}
                className={cn("w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium", view === 'site-management' ? "bg-orange-50 text-orange-600" : "text-slate-700 hover:bg-slate-50")}
              >
                <HardHat size={15} /> Safety
              </button>
              <button
                onClick={() => { setView('quality-control'); setMobileMenuOpen(false); }}
                className={cn("w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium", view === 'quality-control' ? "bg-orange-50 text-orange-600" : "text-slate-700 hover:bg-slate-50")}
              >
                <ShieldCheck size={15} /> Quality
              </button>
              <button
                onClick={() => { setView('after-sales'); setMobileMenuOpen(false); }}
                className={cn("w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium", (view === 'after-sales' || view === 'warranty') ? "bg-orange-50 text-orange-600" : "text-slate-700 hover:bg-slate-50")}
              >
                <Medal size={15} /> Warranty
              </button>
            </div>

            <div className="space-y-1 pt-2 border-t border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">System</p>
              <button
                onClick={() => { setView('verification'); setMobileMenuOpen(false); }}
                className={cn("w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium", view === 'verification' ? "bg-orange-50 text-orange-600" : "text-slate-700 hover:bg-slate-50")}
              >
                <ShieldCheck size={15} /> Trust
              </button>
              <button
                onClick={() => { setView('stealth-tunnel'); setMobileMenuOpen(false); }}
                className={cn("w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium", view === 'stealth-tunnel' ? "bg-orange-50 text-orange-600" : "text-slate-700 hover:bg-slate-50")}
              >
                <Radio size={15} /> Messages
              </button>
              <button
                onClick={() => { setView('audit-log'); setMobileMenuOpen(false); }}
                className={cn("w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium", view === 'audit-log' ? "bg-orange-50 text-orange-600" : "text-slate-700 hover:bg-slate-50")}
              >
                <Clock size={15} /> Audit
              </button>
              <button
                onClick={() => { setView('settings'); setMobileMenuOpen(false); }}
                className={cn("w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium", view === 'settings' ? "bg-orange-50 text-orange-600" : "text-slate-700 hover:bg-slate-50")}
              >
                <Settings size={15} /> Settings
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full min-h-screen bg-[#F8FAFC]">
        {!isCurrentViewPermitted && viewRequirement ? (
          <div className="w-full max-w-xl mx-auto px-4 py-16">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-lg text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center mx-auto">
                <ShieldCheck size={24} />
              </div>
              <div className="space-y-1">
                <h2 className="text-base font-bold text-slate-900">
                  Portal Access Restricted: {viewRequirement.portalName}
                </h2>
                <p className="text-xs text-slate-500">
                  Your current role (<span className="font-semibold text-slate-700">{activeSecurityUser?.roleName}</span>) does not include access to <span className="font-mono text-slate-700">{viewRequirement.portalId}</span>. Once an Administrator approves your access request, this portal and its permitted actions will immediately appear on your account.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setView('home')}
                  className="px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Return to Home Hub
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!activeSecurityUser) return;
                    const portalEntry = securityService.getPortalRegistry().find(p => p.portalId === viewRequirement.portalId);
                    createAccessRequest({
                      requesterId: activeSecurityUser.id,
                      requesterName: activeSecurityUser.fullName,
                      requesterRole: activeSecurityUser.roleName,
                      requesterDepartment: activeSecurityUser.department,
                      requestType: 'Portal Access',
                      requestedItem: `${viewRequirement.portalName} (${portalEntry?.requiredPermissions.join(', ') || viewRequirement.perm})`,
                      targetPortalId: viewRequirement.portalId,
                      requestedPermissionCodes: portalEntry?.requiredPermissions || [viewRequirement.perm],
                      justification: `Requesting access to ${viewRequirement.portalName} for operational duties.`,
                      duration: 'Permanent',
                      isHighRisk: viewRequirement.portalId === 'system-administration' || viewRequirement.portalId === 'accounting-finance'
                    });
                    refreshSecurityData();
                    addNotification(
                      'Access Request Submitted',
                      `Requested access to ${viewRequirement.portalName}. Once approved by Administrator, it will immediately appear on your account.`,
                      'success',
                      'System'
                    );
                    setView('home');
                  }}
                  className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold cursor-pointer shadow-xs"
                >
                  Request Portal Access
                </button>
              </div>
            </div>
          </div>
        ) : (
        <AnimatePresence mode="wait">
          {view === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full px-3 sm:px-4 md:px-6 py-2.5"
            >
              <HomePage
                onNavigate={(targetView, subTab, extraParams) => {
                  if (extraParams?.portal) {
                    setOperationalPortalId(extraParams.portal);
                  }
                  if (extraParams?.perspective) {
                    setDashboardPerspective(extraParams.perspective);
                  }
                  if (subTab) {
                    if (targetView === 'boq-items') setBoqInitialTab(subTab as any);
                    if (targetView === 'accounting') setAccountingTab(subTab as any);
                    if (targetView === 'quality-control') setQcTab(subTab as any);
                    if (targetView === 'equipment-management') setEquipmentTab(subTab as any);
                    if (targetView === 'site-management') setSiteTab(subTab as any);
                    if (targetView === 'settings') setSettingsInitialTab(subTab as any);
                    if (targetView === 'reporting') setReportingReport(subTab as any);
                    if (targetView === 'after-sales') setWarrantyTab(subTab as any);
                    if (targetView === 'project-lifecycle') setLifecycleTab(subTab as any);
                    if (targetView === 'resource-management') setResourceTab(subTab as any);
                  }
                  if (extraParams?.procTab) {
                    setProcurementTab(extraParams.procTab);
                  }
                  setView(targetView as any);
                }}
                onNewQuote={handleNewQuote}
                onImportModal={() => handleOpenImportModal()}
                onExportSnapshot={() => {
                  generateFullSystemSnapshotPDF(quotes, projects, auditLogs, companySettings);
                }}
                quotesCount={quotes.length}
                projectsCount={projects.length}
                invoicesCount={invoices.length}
                clientsCount={clients.length}
              />
            </motion.div>
          )}

          {view === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full px-3 sm:px-4 md:px-6 py-2.5"
            >
              <Dashboard 
                quotes={quotes} 
                projects={projects}
                clients={clients}
                invoices={invoices}
                payments={payments}
                inquiries={inquiries}
                serviceRequests={serviceRequests}
                personnel={personnel}
                equipment={equipment}
                warrantyCertificates={warrantyCertificates}
                auditLogs={auditLogs}
                actualCostRecords={actualCostRecords}
                initialPerspective={dashboardPerspective}
                onPerspectiveChange={setDashboardPerspective}
                variants={productVariants}
                categories={itemCategories}
                itemTemplates={itemTemplates}
                onApplyBulkPriceUpdate={handleApplyBulkPriceUpdate}
                onEditQuote={(q) => {
                  setQuote(q);
                  setView('editor');
                }}
                onDuplicateQuote={duplicateQuote}
                onDeleteQuote={deleteQuote}
                onViewProject={(p) => {
                  setSelectedProject(p);
                  setView('projects');
                }}
                onNavigate={(v) => {
                  if (['overview', 'executive', 'finance', 'operations', 'quality', 'crm', 'analytics'].includes(v)) {
                    setDashboardPerspective(v);
                    setView('dashboard');
                  } else {
                    setView(v);
                  }
                }}
                onGenerateReport={() => {
                  setDownloadConfig({ type: 'Dashboard', data: null });
                  setIsDownloadPortalOpen(true);
                }}
              />
            </motion.div>
          )}

          {view === 'clients' && (
            <motion.div
              key="clients"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full px-3 sm:px-4 md:px-6 py-2.5"
            >
              <ClientManager 
                clients={clients}
                invoices={invoices}
                projects={projects}
                onSaveClient={saveClient}
                onDeleteClient={deleteClient}
                onNavigateToProject={(projId) => {
                  const p = projects.find(item => item.id === projId);
                  if (p) setSelectedProject(p);
                  setView('projects');
                }}
                onNewProjectForClient={(_client) => {
                  handleCreateProject(undefined);
                }}
                onViewPortal={(client) => {
                  setSelectedPortalClient(client);
                  setView('portal-view');
                }}
              />
            </motion.div>
          )}

          {(view === 'portal-view' || view === 'customer-portal') && (
            <motion.div
              key="portal-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-white overflow-hidden"
            >
              {(() => {
                const activeClient = selectedPortalClient || clients[0];
                if (!activeClient) {
                  return (
                    <div className="p-12 text-center">
                      <p className="text-slate-500 font-medium">No clients available to display in Customer Portal.</p>
                      <button onClick={() => setView('clients')} className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm">
                        Go to Clients CRM
                      </button>
                    </div>
                  );
                }
                return (
                  <CustomerPortal 
                    client={activeClient}
                    allClients={clients}
                    onSelectClient={(c) => setSelectedPortalClient(c)}
                    projects={projects.filter(p => p.client.id === activeClient.id)}
                    quotes={quotes.filter(q => q.client.id === activeClient.id)}
                    invoices={invoices.filter(i => i.client.id === activeClient.id)}
                    payments={payments.filter(p => p.clientId === activeClient.id)}
                    adjustments={adjustments.filter(a => a.clientId === activeClient.id)}
                    inquiries={inquiries.filter(i => i.customerId === activeClient.id)}
                    serviceRequests={serviceRequests.filter(s => s.customerId === activeClient.id)}
                    onBack={() => setView('clients')}
                    onSendInquiry={saveInquiry}
                    onDeleteInquiry={deleteInquiry}
                    onSendServiceRequest={saveServiceRequest}
                    onDeleteServiceRequest={deleteServiceRequest}
                    onSaveClient={saveClient}
                    onDeleteClient={(id) => {
                      deleteClient(id);
                      setView('clients');
                    }}
                    initialTab={customerPortalTab}
                    onNavigate={(targetView) => setView(targetView)}
                  />
                );
              })()}
            </motion.div>
          )}

          {view === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full px-3 sm:px-4 md:px-6 py-2.5"
            >
              <QuotePortal
                mode="list"
                quotes={quotes}
                quote={quote}
                projects={projects}
                clients={clients}
                templates={templates}
                companySettings={companySettings}
                selectedLayout={selectedLayout}
                onSetSelectedLayout={setSelectedLayout}
                onUpdateQuote={setQuote}
                onSaveQuote={handleSave}
                onNewQuote={createNew}
                onEditQuote={(q) => {
                  setQuote(q);
                  setView('editor');
                }}
                onDuplicateQuote={(q) => {
                  duplicateQuote(q);
                }}
                onDeleteQuote={(id) => {
                  deleteQuoteHook(id);
                }}
                onUpdateQuoteStatus={updateQuoteStatus}
                onSaveClient={saveClient}
                onApplyTemplate={applyTemplate}
                onOpenSaveTemplateModal={() => setShowSaveTemplateModal(true)}
                onOpenTemplateManager={() => setShowTemplateManager(true)}
                onOpenDownloadPortal={(config) => {
                  setDownloadConfig(config);
                  setIsDownloadPortalOpen(true);
                }}
                onBackToList={() => setView('history')}
                onActivateProject={(quoteId) => {
                  const targetQuote = quotes.find(q => q.id === quoteId);
                  if (targetQuote) {
                    handleCreateProject(targetQuote);
                  }
                }}
                onAddItem={handleAddItem}
                onMoveItem={handleMoveItem}
                onDeleteItem={handleDeleteItem}
                onDuplicateItem={handleDuplicateItem}
                onInsertItem={handleInsertItem}
                onOpenCatalog={() => setShowCatalog(true)}
                onSaveAsTemplate={handleSaveAsTemplate}
                generatePVCForBOQItem={generatePVCForBOQItem}
              />
            </motion.div>
          )}

          {view === 'projects' && (
            <motion.div
              key="projects"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full px-3 sm:px-4 md:px-6 py-2.5"
            >
              <ProjectManager 
                projects={projects}
                quotes={quotes}
                invoices={invoices}
                clients={clients}
                onSaveProject={saveProject}
                onViewProject={(p) => {
                  setSelectedProject(p);
                  setProjectTab('variations');
                  setView('project-details');
                }}
                onNewProject={handleCreateProject}
                onUpdateStatus={updateProjectStatus}
                onViewQuote={onViewQuote}
                onDeleteProject={deleteProject}
                onCreateQuoteForProject={handleCreateQuoteForProject}
                onCreateInvoiceForProject={handleCreateInvoiceForProject}
                onViewClient={(c) => {
                  setSelectedPortalClient(c);
                  setView('clients');
                }}
                onOpenPostEvaluation={(p) => {
                  setSelectedProject(p);
                  setView('post-evaluation');
                }}
                onOpenDownloadPortal={(type, data) => {
                  setDownloadConfig({ type, data });
                  setIsDownloadPortalOpen(true);
                }}
              />
            </motion.div>
          )}

          {view === 'audit-log' && (
            <motion.div
              key="audit-log"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full px-3 sm:px-4 md:px-6 py-2.5"
            >
              <header className="mb-2.5 bg-white border border-slate-200 rounded-xl px-5 py-2.5 flex items-center justify-between gap-4 shadow-2xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <History size={16} />
                  </div>
                  <div className="flex items-baseline gap-2 min-w-0">
                    <h1 className="text-sm font-bold text-slate-900 whitespace-nowrap">Global Audit Log</h1>
                    <span className="text-xs text-slate-500 font-normal truncate hidden sm:inline">• Real-time activity history across all projects</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button 
                    onClick={() => {
                      const allLogs = projects.flatMap(p => (p.auditLogs || []).map(log => ({ ...log, projectName: p.projectName })));
                      setDownloadConfig({ type: 'AuditLog', data: allLogs });
                      setIsDownloadPortalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                  >
                    <Download size={13} />
                    <span>Download Report</span>
                  </button>
                </div>
              </header>

              <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 space-y-4">
                  {projects.flatMap(p => (p.auditLogs || []).map(log => ({ ...log, projectName: p.projectName }))).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((log) => (
                    <div key={log.id} className="flex gap-4 p-4 bg-slate-50 rounded-md border border-slate-100 hover:bg-slate-100 transition-colors">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                        log.type === 'Variation' ? "bg-blue-100 text-blue-600" :
                        log.type === 'Status' ? "bg-amber-100 text-amber-600" :
                        log.type === 'Timeline' ? "bg-emerald-100 text-emerald-600" :
                        "bg-slate-200 text-slate-600"
                      )}>
                        {log.type === 'Variation' ? <PlusCircle size={20} /> :
                         log.type === 'Status' ? <Info size={20} /> :
                         log.type === 'Timeline' ? <Calendar size={20} /> :
                         <FileText size={20} />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-xs font-bold text-slate-900">{log.action}</h3>
                            <span className="text-[9px] px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded font-bold tracking-widest">{log.projectName}</span>
                          </div>
                          <span className="text-[9px] font-mono text-slate-400">{new Date(log.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mb-2">{log.details}</p>
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1 text-[8px] font-bold text-slate-400 tracking-widest">
                            <User size={10} /> {log.user}
                          </span>
                          <span className={cn(
                            "px-1.5 py-0.5 rounded text-[7px] font-bold tracking-widest",
                            log.type === 'Variation' ? "bg-blue-50 text-blue-600" :
                            log.type === 'Status' ? "bg-amber-50 text-amber-600" :
                            log.type === 'Timeline' ? "bg-emerald-50 text-emerald-600" :
                            "bg-slate-100 text-slate-500"
                          )}>
                            {log.type}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {projects.every(p => !p.auditLogs || p.auditLogs.length === 0) && (
                    <div className="text-center py-20">
                      <History size={48} className="mx-auto text-slate-200 mb-4" />
                      <p className="text-slate-500 font-bold">No activity logs found</p>
                      <p className="text-slate-400 text-xs mt-1">Activities will appear here as you manage projects</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {view === 'variation-manager' && (
            <motion.div
              key="variation-manager"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full px-3 sm:px-4 md:px-6 py-2.5"
            >
              <VariationManagerPortal
                projects={projects}
                quotes={quotes}
                onUpdateProjectStatus={updateProjectStatus}
                onDeleteProject={deleteProject}
                onSelectProject={(project, tab = 'variations') => {
                  setSelectedProject(project);
                  setProjectTab(tab);
                  setView('project-details');
                }}
                onOpenDownloadPortal={(type, data) => {
                  setDownloadConfig({ type, data });
                  setIsDownloadPortalOpen(true);
                }}
                onNavigateToPostEvaluation={(project) => {
                  setSelectedProject(project);
                  setView('post-evaluation');
                }}
              />
            </motion.div>
          )}

          {view === 'invoices' && (
            <motion.div
              key="invoices"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full px-3 sm:px-4 md:px-6 py-2.5"
            >
              <InvoiceManager 
                invoices={invoices}
                projects={projects}
                quotes={quotes}
                clients={clients}
                adjustments={adjustments}
                settings={companySettings}
                onUpdateInvoices={setInvoices}
                onSaveInvoice={saveInvoice}
                onDeleteInvoice={deleteInvoice}
                onUpdateSettings={setCompanySettings}
                onAddNotification={addNotification}
                onSaveClient={saveClient}
                onAddPayment={savePayment}
                projectIdFilter={invoiceProjectFilter}
                onOpenCatalog={() => setShowCatalog(true)}
                onNavigateToAccounting={(tab, invoiceId) => {
                  setAccountingTab(tab);
                  setPreselectedInvoiceId(invoiceId || null);
                  setView('accounting');
                }}
                onNavigateToProject={(projectId, tab = 'variations') => {
                  const p = projects.find(item => item.id === projectId || item.projectCode === projectId);
                  if (p) {
                    setSelectedProject(p);
                    setProjectTab(tab as any);
                    setView('project-details');
                  } else {
                    setView('projects');
                  }
                }}
                onNavigateToQuote={(quoteId) => {
                  const q = quotes.find(item => item.id === quoteId || item.quoteNo === quoteId);
                  if (q) {
                    setQuote(q);
                    setView('editor');
                  } else {
                    setView('history');
                  }
                }}
                onNavigateToVariationManager={(projectId) => {
                  if (projectId) {
                    const p = projects.find(item => item.id === projectId || item.projectCode === projectId);
                    if (p) {
                      setSelectedProject(p);
                      setProjectTab('variations');
                      setView('project-details');
                      return;
                    }
                  }
                  setView('variation-manager');
                }}
                onNavigateToFinance={() => {
                  setOperationalPortalId('finance');
                  setView('operational-control');
                }}
                onNavigateToCustomerPortal={(client) => {
                  setSelectedPortalClient(client);
                  setView('portal-view');
                }}
                onNavigateToVerification={() => {
                  setView('verification');
                }}
                onOpenDownloadPortal={(invoice) => {
                  setDownloadConfig({ type: 'Invoice', data: invoice });
                  setIsDownloadPortalOpen(true);
                }}
              />
            </motion.div>
          )}

          {view === 'project-lifecycle' && (
            <motion.div
              key="project-lifecycle"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="w-full h-full px-3 sm:px-4 md:px-6 py-2.5"
            >
              <ProjectLifecyclePortal 
                projects={projects}
                projectPhases={projectPhases}
                personnel={personnel}
                equipment={equipment}
                initialTab={lifecycleTab}
                onViewProject={(p) => {
                  setSelectedProject(p);
                  setView('project-details');
                }}
                onUpdateStatus={updateProjectStatus}
              />
            </motion.div>
          )}

          {view === 'quality-control' && (
            <motion.div
              key="quality-control"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="w-full px-3 sm:px-4 md:px-6 py-2.5"
            >
              <QualityControlPortal 
                inspectionResults={inspectionResults}
                ncrs={ncrs}
                projects={projects}
                quotes={quotes}
                initialTab={qcTab}
                onTabChange={setQcTab}
                onNavigateToPortal={(targetPortal: string, subTab?: string) => {
                  if (targetPortal === 'operational-control' && subTab) {
                    setOperationalPortalId(subTab as any);
                  }
                  if (targetPortal === 'resource-management' && subTab) {
                    setResourceTab(subTab as any);
                  }
                  if (targetPortal === 'equipment-management' && subTab) {
                    setEquipmentTab(subTab as any);
                  }
                  if (targetPortal === 'procurement' && subTab) {
                    setProcurementTab(subTab as any);
                  }
                  if (targetPortal === 'accounting' && subTab) {
                    setAccountingTab(subTab as any);
                  }
                  if (targetPortal === 'site-management' && subTab) {
                    setSiteTab(subTab as any);
                  }
                  if ((targetPortal === 'after-sales' || targetPortal === 'warranty') && subTab) {
                    setWarrantyTab(subTab as any);
                  }
                  setView(targetPortal as any);
                }}
              />
            </motion.div>
          )}

          {view === 'resource-management' && (
            <motion.div
              key="resource-management"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="w-full px-3 sm:px-4 md:px-6 py-2.5"
            >
              <ResourceManagementPortal 
                personnel={personnel}
                projects={projects}
                timeEntries={[]}
                initialTab={resourceTab}
                onTabChange={setResourceTab}
              />
            </motion.div>
          )}

          {view === 'equipment-management' && (
            <motion.div
              key="equipment-management"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="w-full px-3 sm:px-4 md:px-6 py-2.5"
            >
              <EquipmentManagementPortal 
                equipment={equipment}
                projects={projects}
                initialTab={equipmentTab}
                onTabChange={setEquipmentTab}
                onNavigateToPortal={(targetPortal: string, subTab?: string) => {
                  if (targetPortal === 'operational-control' && subTab) {
                    setOperationalPortalId(subTab as any);
                  }
                  if (targetPortal === 'resource-management' && subTab) {
                    setResourceTab(subTab as any);
                  }
                  if (targetPortal === 'procurement' && subTab) {
                    setProcurementTab(subTab as any);
                  }
                  if (targetPortal === 'accounting' && subTab) {
                    setAccountingTab(subTab as any);
                  }
                  if (targetPortal === 'quality-control' && subTab) {
                    setQcTab(subTab as any);
                  }
                  if (targetPortal === 'site-management' && subTab) {
                    setSiteTab(subTab as any);
                  }
                  setView(targetPortal as any);
                }}
              />
            </motion.div>
          )}

          {view === 'site-management' && (
            <motion.div
              key="site-management"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="w-full px-3 sm:px-4 md:px-6 py-2.5"
            >
              <SiteManagementPortal 
                projects={projects}
                incidentReports={[]}
                sitePermits={[]}
                initialTab={siteTab}
                onTabChange={setSiteTab}
                onNavigateToPortal={(targetPortal: string, subTab?: string) => {
                  if (targetPortal === 'operational-control' && subTab) {
                    setOperationalPortalId(subTab as any);
                  }
                  if (targetPortal === 'resource-management' && subTab) {
                    setResourceTab(subTab as any);
                  }
                  if (targetPortal === 'equipment-management' && subTab) {
                    setEquipmentTab(subTab as any);
                  }
                  if (targetPortal === 'procurement' && subTab) {
                    setProcurementTab(subTab as any);
                  }
                  if (targetPortal === 'accounting' && subTab) {
                    setAccountingTab(subTab as any);
                  }
                  if (targetPortal === 'quality-control' && subTab) {
                    setQcTab(subTab as any);
                  }
                  setView(targetPortal as any);
                }}
              />
            </motion.div>
          )}

          {(view === 'after-sales' || view === 'warranty') && (
            <motion.div
              key="after-sales"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="w-full px-3 sm:px-4 md:px-6 py-2.5"
            >
              <WarrantyPortal 
                projects={projects}
                warrantyCertificates={warrantyCertificates}
                afterSalesRequests={[]}
                initialTab={warrantyTab}
                onTabChange={setWarrantyTab}
              />
            </motion.div>
          )}

          {view === 'accounting' && (
            <motion.div
              key="accounting"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full px-3 sm:px-4 md:px-6 py-2.5"
            >
              <AccountingPortal 
                invoices={invoices}
                payments={payments}
                adjustments={adjustments}
                clients={clients}
                projects={projects}
                settings={companySettings}
                initialTab={accountingTab}
                quotes={quotes}
                warrantyCertificates={warrantyCertificates}
                equipment={equipment}
                personnel={personnel}
                preselectedInvoiceId={preselectedInvoiceId}
                onClearPreselectedInvoice={() => setPreselectedInvoiceId(null)}
                projectIdFilter={accountingProjectFilter}
                onAddPayment={handleAddPayment}
                onDeletePayment={deletePayment}
                onUpdatePayment={savePayment}
                onAddAdjustment={handleAddAdjustment}
                onDeleteAdjustment={deleteAdjustment}
                onUpdateAdjustment={saveAdjustment}
                onAddNotification={addNotification}
                onProcessRecurring={handleProcessRecurring}
                onNavigateToPortal={(target: string, subTab?: string) => {
                  if (target === 'projects') {
                    setView('projects');
                  } else if (target === 'invoices') {
                    setView('invoices');
                  } else if (target === 'procurement') {
                    setProcurementTab((subTab as any) || 'landing');
                    setView('procurement');
                  } else if (target === 'payroll') {
                    setView('payroll');
                  } else if (target === 'equipment' || target === 'equipment-management') {
                    setEquipmentTab((subTab as any) || 'landing');
                    setView('equipment-management');
                  } else if (target === 'quality' || target === 'quality-control') {
                    setQcTab((subTab as any) || 'landing');
                    setView('quality-control');
                  } else if (target === 'site-management') {
                    setSiteTab((subTab as any) || 'landing');
                    setView('site-management');
                  } else if (target === 'resource-management') {
                    setResourceTab((subTab as any) || 'landing');
                    setView('resource-management');
                  } else if (target === 'operational-control') {
                    if (subTab) setOperationalPortalId(subTab as any);
                    setView('operational-control');
                  } else if (target === 'reporting') {
                    setView('reporting');
                  } else {
                    setView(target as any);
                  }
                }}
              />
            </motion.div>
          )}

          {view === 'reporting' && (
            <motion.div
              key="reporting"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full px-3 sm:px-4 md:px-6 py-2.5"
            >
              <ReportingPortal initialReport={reportingReport} />
            </motion.div>
          )}

          {view === 'procurement' && (
            <motion.div
              key="procurement"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full px-3 sm:px-4 md:px-6 py-2.5"
            >
              <ProcurementHub 
                initialTab={procurementTab} 
                projects={projects}
                onUpdateProjects={setProjects}
                invoices={invoices}
                onSaveInvoice={saveInvoice}
                itemCatalog={itemTemplates}
                productVariants={productVariants}
                onAddActualCostRecord={handleAddActualCostRecord}
                onNavigateToProject={(projId) => {
                  const target = projects.find(p => p.id === projId);
                  if (target) {
                    setSelectedProject(target);
                    setView('project-details');
                  }
                }}
              />
            </motion.div>
          )}

          {view === 'procurement-costs' && (
            <motion.div
              key="procurement-costs"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full h-full px-3 sm:px-4 md:px-6 py-2.5"
            >
              <ProcurementCostManager
                projects={projects}
                suppliers={procurementService.getSuppliers()}
                productVariants={productVariants}
                itemTemplates={itemTemplates}
                onUpdateProductVariant={saveProductVariant}
                currency={companySettings.defaultCurrency || 'LKR'}
                isStandalonePortal={true}
                onNavigateToProject={(projId) => {
                  const target = projects.find(p => p.id === projId);
                  if (target) {
                    setSelectedProject(target);
                    setView('project-details');
                  }
                }}
              />
            </motion.div>
          )}

          {view === 'payroll' && (
            <motion.div
              key="payroll"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full px-3 sm:px-4 md:px-6 py-2.5"
            >
              <PayrollCenter />
            </motion.div>
          )}

          {view === 'operational-control' && (
            <motion.div
              key="operational-control"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full px-3 sm:px-4 md:px-6 py-2.5"
            >
              <OperationalControlCenter
                initialPortal={operationalPortalId}
                projects={projects}
                onNavigateHome={() => setView('home')}
                onNavigateToPortal={(targetPortal: string, subTab?: string) => {
                  if (targetPortal === 'resource-management' && subTab) {
                    setResourceTab(subTab as any);
                  }
                  if (targetPortal === 'equipment-management' && subTab) {
                    setEquipmentTab(subTab as any);
                  }
                  if (targetPortal === 'procurement' && subTab) {
                    setProcurementTab(subTab as any);
                  }
                  if (targetPortal === 'accounting' && subTab) {
                    setAccountingTab(subTab as any);
                  }
                  if (targetPortal === 'quality-control' && subTab) {
                    setQcTab(subTab as any);
                  }
                  if (targetPortal === 'site-management' && subTab) {
                    setSiteTab(subTab as any);
                  }
                  setView(targetPortal as any);
                }}
              />
            </motion.div>
          )}

          {view === 'stealth-tunnel' && (
            <motion.div
              key="stealth-tunnel"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full"
            >
              <StealthCommunicationTunnel
                projects={projects}
                quotes={quotes}
                invoices={invoices}
                onNavigateToPortal={(targetView, subTab, recordId) => {
                  if (targetView === 'operational-control' && subTab) {
                    setOperationalPortalId(subTab as any);
                  }
                  if (targetView === 'project-details' && recordId) {
                    const foundProj = projects.find(p => p.id === recordId);
                    if (foundProj) setSelectedProject(foundProj);
                  }
                  if (targetView === 'editor' && recordId) {
                    const foundQuote = quotes.find(q => q.id === recordId);
                    if (foundQuote) setQuote(foundQuote);
                  }
                  if (targetView === 'invoices' && recordId) {
                    setPreselectedInvoiceId(recordId);
                  }
                  if (targetView === 'procurement' && subTab) {
                    setProcurementTab(subTab as any);
                  }
                  if (targetView === 'accounting' && subTab) {
                    setAccountingTab(subTab as any);
                  }
                  if (targetView === 'quality-control' && subTab) {
                    setQcTab(subTab as any);
                  }
                  if (targetView === 'site-management' && subTab) {
                    setSiteTab(subTab as any);
                  }
                  if (targetView === 'resource-management' && subTab) {
                    setResourceTab(subTab as any);
                  }
                  if (targetView === 'equipment-management' && subTab) {
                    setEquipmentTab(subTab as any);
                  }
                  if (targetView === 'project-lifecycle' && subTab) {
                    setLifecycleTab(subTab as any);
                  }
                  if (targetView === 'settings' && subTab) {
                    setSettingsInitialTab(subTab as any);
                  }
                  setView(targetView as any);
                }}
              />
            </motion.div>
          )}

          {view === 'boq-items' && (
            <motion.div
              key="boq-items"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full h-full px-3 sm:px-4 md:px-6 py-2.5"
            >
              <BOQItemManager 
                initialTab={boqInitialTab}
                onOpenCatalog={() => setShowCatalog(true)}
                onNavigateToCostPortal={() => setView('procurement-costs')}
              />
            </motion.div>
          )}

          {view === 'project-details' && (
            <motion.div
              key="project-details"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full px-3 sm:px-4 md:px-6 py-2.5"
            >
              {(() => {
                const proj = selectedProject || projects[0];
                if (!proj) {
                  return (
                    <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
                      <p className="text-slate-600 font-medium">No projects available</p>
                      <button onClick={() => setView('projects')} className="mt-3 px-4 py-2 bg-orange-500 text-white rounded-lg text-xs font-semibold">
                        View Projects List
                      </button>
                    </div>
                  );
                }
                return (
                  <ProjectVariationEditor 
                    project={proj}
                    initialTab={projectTab}
                    quotes={quotes}
                    invoices={invoices}
                    payments={payments}
                    adjustments={adjustments}
                    onUpdateProject={(updated) => {
                      setProjects(projects.map(p => p.id === updated.id ? updated : p));
                      setSelectedProject(updated);
                      addNotification('Project Updated', 'Project variations saved!', 'success', 'Variation', 'low', { label: 'View Project', view: 'project-details', data: { projectId: updated.id } });
                    }}
                    onBack={() => setView('projects')}
                    onGenerateVariationReport={(p) => generateVariationReport(p, companySettings)}
                    onOpenCatalog={() => setShowCatalog(true)}
                    onDeleteProject={deleteProject}
                    onViewItem={handleViewHistoryItem}
                    onNavigateToPortal={(portal, filters) => {
                      if (portal === 'invoices') {
                        setInvoiceProjectFilter(filters?.projectId || null);
                        setView('invoices');
                      } else if (portal === 'accounting') {
                        setAccountingProjectFilter(filters?.projectId || null);
                        if (filters?.tab) setAccountingTab(filters.tab);
                        setView('accounting');
                      }
                    }}
                    onNavigateToPostEvaluation={() => setView('post-evaluation')}
                    settings={companySettings}
                  />
                );
              })()}
            </motion.div>
          )}

          {view === 'post-evaluation' && (
            <motion.div
              key="post-evaluation"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full px-3 sm:px-4 md:px-6 py-2.5"
            >
              <ProjectPostEvaluationPortal
                projects={projects}
                quotes={quotes}
                onCreateProjectFromQuote={handleCreateProject}
                productVariants={productVariants}
                actualCostRecords={actualCostRecords}
                onAddActualCostRecord={handleAddActualCostRecord}
                onUpdateActualCostRecord={handleUpdateActualCostRecord}
                onDeleteActualCostRecord={handleDeleteActualCostRecord}
                onAddItemToProject={handleAddItemToProject}
                onNavigateToVariations={(projId) => {
                  const p = projects.find(item => item.id === projId);
                  if (p) setSelectedProject(p);
                  setProjectTab('variations');
                  setView('project-details');
                }}
                onBackToProjects={() => setView('projects')}
                initialProjectId={selectedProject?.id}
              />
            </motion.div>
          )}

          {view === 'pricing-intelligence' && (
            <motion.div
              key="pricing-intelligence"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full px-3 sm:px-4 md:px-6 py-2.5"
            >
              <PricingIntelligenceDashboard
                variants={productVariants}
                categories={itemCategories}
                itemTemplates={itemTemplates}
                onApplyBulkPriceUpdate={handleApplyBulkPriceUpdate}
              />
            </motion.div>
          )}

          {view === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full px-3 sm:px-4 md:px-6 py-2.5"
            >
              <SettingsComponent 
                settings={companySettings} 
                initialTab={settingsInitialTab}
                initialSecurityTab={securityInitialTab}
                onSave={(s) => {
                  setCompanySettings(s);
                  addNotification('Settings Saved', 'Settings saved successfully!', 'success', 'System', 'low', { label: 'View Settings', view: 'settings' });
                }} 
                onExportAll={exportAllData}
                onImportAll={importAllData}
                onExportAllDocuments={exportAllDocuments}
                onResetSystem={resetSystem}
                onGenerateAuditReport={generateAuditReport}
              />
            </motion.div>
          )}

          {view === 'editor' && (
            <motion.div
              key="editor"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full px-3 sm:px-4 md:px-6 py-2.5"
            >
              <QuotePortal
                mode="editor"
                quotes={quotes}
                quote={quote}
                projects={projects}
                clients={clients}
                templates={templates}
                companySettings={companySettings}
                selectedLayout={selectedLayout}
                onSetSelectedLayout={setSelectedLayout}
                onUpdateQuote={setQuote}
                onSaveQuote={handleSave}
                onNewQuote={createNew}
                onEditQuote={(q) => {
                  setQuote(q);
                  setView('editor');
                }}
                onDuplicateQuote={(q) => {
                  duplicateQuote(q);
                }}
                onDeleteQuote={(id) => {
                  deleteQuoteHook(id);
                  setView('history');
                }}
                onUpdateQuoteStatus={updateQuoteStatus}
                onSaveClient={saveClient}
                onApplyTemplate={applyTemplate}
                onOpenSaveTemplateModal={() => setShowSaveTemplateModal(true)}
                onOpenTemplateManager={() => setShowTemplateManager(true)}
                onOpenDownloadPortal={(config) => {
                  setDownloadConfig(config);
                  setIsDownloadPortalOpen(true);
                }}
                onBackToList={() => setView('history')}
                onActivateProject={(quoteId) => {
                  const targetQuote = quotes.find(q => q.id === quoteId);
                  if (targetQuote) {
                    handleCreateProject(targetQuote);
                  }
                }}
                onAddItem={handleAddItem}
                onMoveItem={handleMoveItem}
                onDeleteItem={handleDeleteItem}
                onDuplicateItem={handleDuplicateItem}
                onInsertItem={handleInsertItem}
                onOpenCatalog={() => setShowCatalog(true)}
                onSaveAsTemplate={handleSaveAsTemplate}
                generatePVCForBOQItem={generatePVCForBOQItem}
              />
            </motion.div>
          )}
          {view === 'verification' && (
            <motion.div
              key="verification"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full h-full min-h-screen"
            >
              <DocumentVerificationPortal 
                onVerify={verifySVC}
                onClose={() => setView('dashboard')}
                isInternal={true}
                initialCode={initialVerificationCode}
                verificationRegistry={verificationRegistry}
                settings={companySettings}
                quotes={quotes}
                invoices={invoices}
                projects={projects}
                registerDocument={registerDocument}
                onOpenDocument={(entry) => {
                  if (entry.documentType === 'Quotation') {
                    const q = quotes.find(q => q.id === entry.internalId);
                    if (q) {
                      editQuote(q);
                    }
                  } else if (entry.documentType === 'Invoice') {
                    setView('invoices');
                  } else if (entry.documentType === 'AccountStatement') {
                    setView('projects');
                  }
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
        )}
      </main>

      <Toaster position="top-right" richColors />
      <AnimatePresence>
        {showNotifications && (
          <NotificationCenter
            notifications={notifications}
            onClose={() => setShowNotifications(false)}
            onMarkAsRead={markNotificationAsRead}
            onClearAll={clearAllNotifications}
            onDelete={deleteNotification}
            onAction={handleNotificationAction}
            onTogglePin={togglePinNotification}
            onOpenMessagesPortal={() => setView('stealth-tunnel')}
          />
        )}
      </AnimatePresence>

      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          deleteQuoteHook(quote.id);
          setView('history');
          setShowDeleteConfirm(false);
        }}
        title="Delete Quote"
        message="Are you sure you want to delete this quote? This action cannot be undone."
        confirmText="Delete Quote"
        type="danger"
      />

      {showCatalog && (
        <ItemCatalog 
          templates={itemTemplates}
          initialTab={catalogInitialTab}
          onSelectItems={handleInsertTemplates} 
          onClose={() => setShowCatalog(false)} 
          onDeleteTemplate={deleteItemTemplate}
          onUpdateTemplate={saveItemTemplate}
          productFamilies={productFamilies}
          productVariants={productVariants}
          rateVersions={rateVersions}
          onSaveFamily={saveProductFamily}
          onSaveVariant={saveProductVariant}
          onSaveRate={saveRateVersion}
          categories={itemCategories}
          onDeleteCategory={deleteProductFamily}
          activeProject={selectedProject || projects.find(p => p.status === 'In Progress') || projects[0]}
          projects={projects}
          onQuickAdd={handleQuickAddItem}
        />
      )}

      {showSaveTemplateModal && (
        <SaveTemplateModal
          isOpen={showSaveTemplateModal}
          onClose={() => setShowSaveTemplateModal(false)}
          onSave={(newTemplate) => {
            handleSaveTemplateToLibrary(newTemplate);
            setShowSaveTemplateModal(false);
          }}
          quote={quote}
        />
      )}

      {showTemplateManager && (
        <QuoteTemplateManager 
          templates={templates}
          onSelectTemplate={applyTemplate}
          onSaveTemplate={handleSaveTemplateToLibrary}
          onDeleteTemplate={handleDeleteTemplateFromLibrary}
          onClose={() => setShowTemplateManager(false)}
          currentQuote={quote}
          clients={clients}
          onSaveClient={saveClient}
          itemCatalog={itemTemplates}
          productVariants={productVariants}
          itemCategories={itemCategories}
          productFamilies={productFamilies}
          rateVersions={rateVersions}
          onSaveItemTemplate={saveItemTemplate}
          onSaveProductVariant={saveProductVariant}
          companySettings={companySettings}
          onProceedToQuotation={(createdQuote) => {
            setQuote(createdQuote);
            saveQuote(createdQuote);
            setView('editor');
            setShowTemplateManager(false);
            addNotification(
              'Design Quotation Initialized',
              `Created ${createdQuote.quoteNo} for ${createdQuote.client.name} from Design Hub.`,
              'success',
              'BOQ'
            );
          }}
          onCreateProjectFromDesign={(createdQuote) => {
            saveQuote(createdQuote);
            handleCreateProject(createdQuote);
            setShowTemplateManager(false);
          }}
        />
      )}

      {/* Download Portal */}
      <DownloadPortal
        isOpen={isDownloadPortalOpen}
        onClose={() => setIsDownloadPortalOpen(false)}
        type={downloadConfig.type}
        data={downloadConfig.data}
        settings={companySettings}
        onUpdateQuote={handleUpdateQuote}
        onUpdateProject={handleUpdateProject}
        allQuotes={quotes}
        allProjects={projects}
        allAuditLogs={auditLogs}
        allInvoices={invoices}
        allPayments={payments}
        allAdjustments={adjustments}
        verificationRegistry={verificationRegistry}
        registerDocument={registerDocument}
      />

      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={() => setConfirmationModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmationModal.onConfirm}
        title={confirmationModal.title}
        message={confirmationModal.message}
        type={confirmationModal.type}
      />

      {/* Universal CSV & Excel Import Studio with Staging & Veracity Confirmation */}
      <DataImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        defaultEntity={importDefaultEntity}
        existingData={{
          itemTemplates,
          clients,
          projects,
          invoices,
          personnel,
          equipment,
          categories: itemCategories
        }}
        onCommitItemTemplates={(newItems, summary) => {
          setItemTemplates(newItems);
          addNotification('BOQ Master Catalog Updated', summary, 'info', 'BOQ');
          setAuditLogs(prev => [{
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            action: 'IMPORT_BOQ_ITEMS',
            details: summary,
            user: 'Admin',
            type: 'System'
          }, ...prev]);
        }}
        onCommitClients={(newClientsList, summary) => {
          setClients(newClientsList);
          addNotification('Clients Directory Updated', summary, 'info', 'General');
          setAuditLogs(prev => [{
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            action: 'IMPORT_CLIENTS',
            details: summary,
            user: 'Admin',
            type: 'System'
          }, ...prev]);
        }}
        onCommitProjects={(newProjectsList, summary) => {
          setProjects(newProjectsList);
          addNotification('Project Register Updated', summary, 'info', 'General');
          setAuditLogs(prev => [{
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            action: 'IMPORT_PROJECTS',
            details: summary,
            user: 'Admin',
            type: 'System'
          }, ...prev]);
        }}
        onCommitInvoices={(newInvoicesList, summary) => {
          setInvoices(newInvoicesList);
          addNotification('Invoices Register Updated', summary, 'info', 'Accounting');
          setAuditLogs(prev => [{
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            action: 'IMPORT_INVOICES',
            details: summary,
            user: 'Admin',
            type: 'Accounting'
          }, ...prev]);
        }}
        onCommitPersonnel={(newPersonnelList, summary) => {
          setPersonnel(newPersonnelList);
          addNotification('Personnel Roster Updated', summary, 'info', 'General');
        }}
        onCommitEquipment={(newEquipmentList, summary) => {
          setEquipment(newEquipmentList);
          addNotification('Equipment Inventory Updated', summary, 'info', 'General');
        }}
        onCommitBOQLines={(lines, summary) => {
          setQuote(prev => ({
            ...prev,
            items: [...prev.items, ...lines]
          }));
          addNotification('BOQ Lines Appended', summary, 'info', 'BOQ');
        }}
      />
      {/* Universal Floating Home Button for Easy 1-Click Return Anywhere */}
      {view !== 'home' && (
        <button
          onClick={() => {
            setView('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="fixed bottom-6 left-6 z-40 flex items-center gap-2 px-3.5 py-2 bg-slate-900/90 hover:bg-orange-600 text-white text-xs font-bold rounded-full shadow-xl backdrop-blur-md transition-all duration-200 hover:scale-105 border border-slate-700/60 hover:border-orange-500 group cursor-pointer"
          title="Return to Home Dashboard"
        >
          <Home size={15} className="text-orange-400 group-hover:text-white transition-colors" />
          <span>Home</span>
        </button>
      )}

      <Toaster richColors position="top-right" />
    </div>
  );
}
