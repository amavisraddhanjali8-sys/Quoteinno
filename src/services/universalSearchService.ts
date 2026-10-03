import { CentralPortalId, SecurityUser } from '../types/security';
import { THEME_MODE_OPTIONS, ThemeMode } from '../context/ThemeContext';
import {
  Quote,
  Project,
  Client,
  Invoice,
  Payment,
  Adjustment,
  ItemTemplate,
  ProductFamily,
  ProductVariant,
  QuoteTemplate,
  Notification
} from '../types';
import { ALL_89_PROCUREMENT_DOCUMENTS } from './procurementAllDocsService';
import { procurementService } from './procurementService';
import { centralMessagingService } from './centralMessagingService';
import { centralEmailService } from './centralEmailService';
import { factoryExecutionService } from './factoryExecutionService';
import { hrService } from './hrService';
import { equipmentControlService } from './equipmentControlService';
import { qualityControlService } from './qualityControlService';
import { safetyControlService } from './safetyControlService';
import { NavTabConfig } from '../navigationConfig';
import { NavDropdownItem } from '../components/NestedNavDropdown';

export type SearchGroupCategory =
  | 'Portals'
  | 'Features'
  | 'Actions'
  | 'Records'
  | 'Documents';

export type SearchRecordTypeFilter =
  | 'All'
  | 'Portal'
  | 'Feature'
  | 'Action'
  | 'Project'
  | 'Customer'
  | 'Supplier'
  | 'Employee'
  | 'User'
  | 'Equipment'
  | 'Product'
  | 'BOQ'
  | 'Quote'
  | 'Invoice'
  | 'PO'
  | 'RFQ'
  | 'Task'
  | 'Message'
  | 'Alert'
  | 'Document'
  | 'Report';

export interface SearchAccessContext {
  user: SecurityUser | null;
  isSuperAdmin: boolean;
  canAccessPortal: (portalId: CentralPortalId) => boolean;
  hasPermission: (permissionKey: string) => boolean;
}

export interface UniversalSearchResultItem {
  id: string;
  group: SearchGroupCategory;
  /** Concise 1-line title using simple words */
  title: string;
  /** Optional short code/ID (e.g., QT-1001, PRJ-01, PO-202, #14) */
  code?: string;
  /** Short 1-2 word type label (e.g., Portal, Project, Quote, Invoice, PO, Action) */
  recordType: string;
  /** Short 1-2 word context on the same single line (e.g., Sales, Active, LKR 120K) */
  contextLabel?: string;
  /** Search keywords, synonyms, abbreviations (never rendered as multi-line description) */
  keywords: string[];
  /** Optional RBAC requirements */
  portalId?: CentralPortalId;
  requiredPermission?: string;
  customAccessCheck?: (ctx: SearchAccessContext) => boolean;
  /** Handler to directly open the portal/record or execute the action */
  onSelect: () => void;
  /** Pre-computed normalized search string for fast indexing */
  _searchIndex?: string;
}

export type DynamicSearchProvider = (ctx: SearchAccessContext) => UniversalSearchResultItem[];

export interface UniversalSearchQueryOptions {
  query: string;
  groupFilter?: 'All' | SearchGroupCategory;
  typeFilter?: SearchRecordTypeFilter;
  limitPerGroup?: number;
  maxTotalResults?: number;
}

export interface GroupedUniversalSearchResults {
  totalCount: number;
  groups: Record<SearchGroupCategory, UniversalSearchResultItem[]>;
  flatList: UniversalSearchResultItem[];
  suggestions: UniversalSearchResultItem[];
}

const RECENT_SEARCHES_KEY = 'innovista_universal_recent_searches_v1';
const MAX_RECENT_SEARCHES = 8;

/**
 * Abbreviation & Natural Language Synonym Map
 * Allows partial words, abbreviations, and natural-language queries to match records and actions.
 */
const ABBREVIATION_SYNONYMS: Record<string, string[]> = {
  po: ['purchase order', 'purchasing', 'orders', 'procurement'],
  pos: ['purchase order', 'point of sale', 'new quote'],
  rfq: ['request for quotation', 'sourcing', 'tender', 'bid'],
  pr: ['purchase requisition', 'requisition', 'demand'],
  grn: ['goods receipt', 'receiving', 'delivery note'],
  scn: ['service completion', 'subcontract'],
  boq: ['bill of quantities', 'items', 'engineering', 'pricing', 'catalog'],
  bom: ['bill of materials', 'boq', 'production'],
  vo: ['variation', 'variation order', 'change order'],
  ncr: ['non conformance', 'quality hold', 'defect', 'quarantine'],
  qc: ['quality', 'inspection', 'itp', 'iqc', 'testing'],
  qa: ['quality', 'assurance', 'inspection'],
  hse: ['safety', 'permit', 'ptw', 'incident', 'risk', 'jsa'],
  ptw: ['permit to work', 'safety', 'site'],
  hr: ['workforce', 'employee', 'personnel', 'timesheet', 'payroll'],
  wps: ['payroll', 'salary', 'wage'],
  ar: ['receivables', 'invoice', 'collection', 'payment'],
  ap: ['payables', 'supplier invoice', '3-way match'],
  gl: ['general ledger', 'accounting', 'chart of accounts'],
  inv: ['invoice', 'billing', 'inventory', 'warehouse'],
  qt: ['quote', 'quotation', 'estimate'],
  prj: ['project', 'site', 'lifecycle', 'wbs'],
  wbs: ['phases', 'lifecycle', 'schedule', 'gantt'],
  sup: ['supplier', 'vendor', 'procurement'],
  vnd: ['vendor', 'supplier'],
  cust: ['customer', 'client', 'crm'],
  cli: ['client', 'customer'],
  eqp: ['equipment', 'machinery', 'plant', 'maintenance'],
  doc: ['document', 'package', 'drawing', 'verification', 'certificate'],
  svc: ['verification', 'security code', 'trust'],
  pvc: ['verification', 'product code', 'payment code'],
  iam: ['security', 'access control', 'roles', 'permissions', 'users'],
  rbac: ['roles', 'permissions', 'access control', 'security'],
  msg: ['message', 'chat', 'tunnel', 'communication'],
  chat: ['message', 'conversation', 'stealth tunnel'],
  mail: ['gmail', 'email', 'template', 'notification'],
  add: ['new', 'create'],
  create: ['new', 'add'],
  make: ['new', 'create'],
  open: ['portal', 'view', 'go'],
  go: ['portal', 'open'],
  staff: ['employee', 'workforce', 'personnel', 'user'],
  worker: ['employee', 'workforce', 'personnel']
};

class UniversalSearchService {
  private customProviders: Map<string, DynamicSearchProvider> = new Map();

  /**
   * Register a reusable search provider for any current or future portal, table, or module.
   */
  public registerSearchProvider(id: string, provider: DynamicSearchProvider): void {
    this.customProviders.set(id, provider);
  }

  public unregisterSearchProvider(id: string): void {
    this.customProviders.delete(id);
  }

  /**
   * Check whether the active user is permitted to see/execute a search item.
   */
  public isItemAuthorized(item: UniversalSearchResultItem, ctx: SearchAccessContext): boolean {
    if (ctx.isSuperAdmin) return true;
    if (item.customAccessCheck) {
      return item.customAccessCheck(ctx);
    }
    if (item.portalId && !ctx.canAccessPortal(item.portalId)) {
      return false;
    }
    if (item.requiredPermission && !ctx.hasPermission(item.requiredPermission)) {
      return false;
    }
    return true;
  }

  /**
   * Normalize and index an item for fast sub-millisecond matching.
   */
  public prepareItem(item: UniversalSearchResultItem): UniversalSearchResultItem {
    const raw = [
      item.title,
      item.code || '',
      item.recordType,
      item.contextLabel || '',
      item.group,
      ...item.keywords
    ]
      .join(' ')
      .toLowerCase();
    item._searchIndex = raw;
    return item;
  }

  /**
   * Expand user query tokens using abbreviation & natural-language mapping.
   */
  private parseQueryTokens(rawQuery: string): {
    cleanQuery: string;
    tokens: string[];
    expandedGroups: string[][];
    intentGroupBoost?: SearchGroupCategory;
  } {
    const cleanQuery = rawQuery.trim().toLowerCase();
    if (!cleanQuery) {
      return { cleanQuery: '', tokens: [], expandedGroups: [] };
    }

    const rawTokens = cleanQuery
      .replace(/[^\w\s#-]/g, ' ')
      .split(/\s+/)
      .filter(Boolean);

    // Detect natural language intent prefixes
    let intentGroupBoost: SearchGroupCategory | undefined;
    if (rawTokens.length > 0) {
      const first = rawTokens[0];
      if (['create', 'new', 'add', 'make', 'run', 'export', 'import', 'toggle'].includes(first)) {
        intentGroupBoost = 'Actions';
      } else if (['open', 'goto', 'navigate', 'portal', 'page', 'menu'].includes(first)) {
        intentGroupBoost = 'Portals';
      } else if (['doc', 'document', 'form', 'pdf', 'certificate', 'template'].includes(first)) {
        intentGroupBoost = 'Documents';
      } else if (['report', 'feature', 'analytics', 'chart'].includes(first)) {
        intentGroupBoost = 'Features';
      }
    }

    // Filter out pure stop-words when multi-word natural query is typed
    const stopWords = new Set(['the', 'to', 'in', 'for', 'of', 'a', 'an', 'please', 'show', 'me', 'find', 'search', 'go']);
    const meaningfulTokens =
      rawTokens.length > 1
        ? rawTokens.filter(t => !stopWords.has(t))
        : rawTokens;

    const finalTokens = meaningfulTokens.length > 0 ? meaningfulTokens : rawTokens;

    const expandedGroups = finalTokens.map(token => {
      const synonyms = ABBREVIATION_SYNONYMS[token] || [];
      return [token, ...synonyms];
    });

    return {
      cleanQuery,
      tokens: finalTokens,
      expandedGroups,
      intentGroupBoost
    };
  }

  /**
   * Score an item against the parsed query. Returns 0 if no match.
   */
  private scoreItem(
    item: UniversalSearchResultItem,
    cleanQuery: string,
    tokens: string[],
    expandedGroups: string[][],
    intentGroupBoost?: SearchGroupCategory
  ): number {
    const indexStr = item._searchIndex || '';
    const titleLower = item.title.toLowerCase();
    const codeLower = (item.code || '').toLowerCase();
    const typeLower = item.recordType.toLowerCase();

    // Every token group must match at least one term in the item's search index
    for (const group of expandedGroups) {
      const matched = group.some(term => indexStr.includes(term));
      if (!matched) return 0;
    }

    let score = 10;

    // Exact code or title match
    if (codeLower && codeLower === cleanQuery) score += 120;
    else if (codeLower && codeLower.startsWith(cleanQuery)) score += 80;
    else if (codeLower && codeLower.includes(cleanQuery)) score += 50;

    if (titleLower === cleanQuery) score += 100;
    else if (titleLower.startsWith(cleanQuery)) score += 65;
    else if (titleLower.includes(cleanQuery)) score += 40;

    if (typeLower === cleanQuery || typeLower.startsWith(cleanQuery)) {
      score += 35;
    }

    // Token-level prefix bonuses
    for (const token of tokens) {
      if (titleLower.split(/\s+/).some(w => w.startsWith(token))) {
        score += 18;
      }
      if (codeLower.includes(token)) {
        score += 22;
      }
    }

    if (intentGroupBoost && item.group === intentGroupBoost) {
      score += 30;
    }

    return score;
  }

  /**
   * Execute a fast, permission-aware universal search across all indexed items and registered providers.
   */
  public executeSearch(
    allItems: UniversalSearchResultItem[],
    ctx: SearchAccessContext,
    options: UniversalSearchQueryOptions
  ): GroupedUniversalSearchResults {
    const {
      query,
      groupFilter = 'All',
      typeFilter = 'All',
      limitPerGroup = 6,
      maxTotalResults = 30
    } = options;

    // Merge items from any registered external/dynamic providers
    let combinedItems = [...allItems];
    this.customProviders.forEach(provider => {
      try {
        const dynamicItems = provider(ctx).map(it => this.prepareItem(it));
        combinedItems = combinedItems.concat(dynamicItems);
      } catch (e) {
        console.error('Universal search provider error:', e);
      }
    });

    // 1. Filter by RBAC permissions first
    const authorizedItems = combinedItems.filter(item => this.isItemAuthorized(item, ctx));

    const emptyGroups: Record<SearchGroupCategory, UniversalSearchResultItem[]> = {
      Portals: [],
      Features: [],
      Actions: [],
      Records: [],
      Documents: []
    };

    const { cleanQuery, tokens, expandedGroups, intentGroupBoost } = this.parseQueryTokens(query);

    // If no query, return default quick suggestions (authorized top Portals & Actions)
    if (!cleanQuery) {
      const quickSuggestions = authorizedItems
        .filter(item =>
          (groupFilter === 'All' || item.group === groupFilter) &&
          (typeFilter === 'All' || item.recordType.toLowerCase() === typeFilter.toLowerCase())
        )
        .slice(0, 12);

      quickSuggestions.forEach(item => {
        if (emptyGroups[item.group].length < limitPerGroup) {
          emptyGroups[item.group].push(item);
        }
      });

      const flatList = [
        ...emptyGroups.Portals,
        ...emptyGroups.Features,
        ...emptyGroups.Actions,
        ...emptyGroups.Records,
        ...emptyGroups.Documents
      ];

      return {
        totalCount: flatList.length,
        groups: emptyGroups,
        flatList,
        suggestions: authorizedItems.filter(i => i.group === 'Portals' || i.group === 'Actions').slice(0, 6)
      };
    }

    // 2. Score and filter matching items
    const scored: { item: UniversalSearchResultItem; score: number }[] = [];

    for (const item of authorizedItems) {
      if (groupFilter !== 'All' && item.group !== groupFilter) continue;
      if (typeFilter !== 'All' && item.recordType.toLowerCase() !== typeFilter.toLowerCase()) continue;

      const score = this.scoreItem(item, cleanQuery, tokens, expandedGroups, intentGroupBoost);
      if (score > 0) {
        scored.push({ item, score });
      }
    }

    scored.sort((a, b) => b.score - a.score);

    let totalAdded = 0;
    for (const { item } of scored) {
      if (totalAdded >= maxTotalResults) break;
      const effectiveGroupLimit = groupFilter === 'All' ? limitPerGroup : maxTotalResults;
      if (emptyGroups[item.group].length < effectiveGroupLimit) {
        emptyGroups[item.group].push(item);
        totalAdded++;
      }
    }

    const flatList: UniversalSearchResultItem[] = [
      ...emptyGroups.Portals,
      ...emptyGroups.Features,
      ...emptyGroups.Actions,
      ...emptyGroups.Records,
      ...emptyGroups.Documents
    ];

    // Useful fallback suggestions when no results match
    const suggestions =
      flatList.length === 0
        ? authorizedItems
            .filter(i => i.group === 'Portals' || i.group === 'Actions' || i.group === 'Features')
            .slice(0, 6)
        : [];

    return {
      totalCount: scored.length,
      groups: emptyGroups,
      flatList,
      suggestions
    };
  }

  /**
   * Recent Searches Management (per user)
   */
  public getRecentSearches(userId?: string): string[] {
    try {
      const key = `${RECENT_SEARCHES_KEY}_${userId || 'anon'}`;
      const raw = localStorage.getItem(key);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT_SEARCHES) : [];
    } catch {
      return [];
    }
  }

  public addRecentSearch(query: string, userId?: string): string[] {
    const clean = query.trim();
    if (!clean || clean.length < 2) return this.getRecentSearches(userId);
    try {
      const key = `${RECENT_SEARCHES_KEY}_${userId || 'anon'}`;
      const current = this.getRecentSearches(userId).filter(
        q => q.toLowerCase() !== clean.toLowerCase()
      );
      const updated = [clean, ...current].slice(0, MAX_RECENT_SEARCHES);
      localStorage.setItem(key, JSON.stringify(updated));
      return updated;
    } catch {
      return [];
    }
  }

  public removeRecentSearch(query: string, userId?: string): string[] {
    try {
      const key = `${RECENT_SEARCHES_KEY}_${userId || 'anon'}`;
      const updated = this.getRecentSearches(userId).filter(
        q => q.toLowerCase() !== query.toLowerCase()
      );
      localStorage.setItem(key, JSON.stringify(updated));
      return updated;
    } catch {
      return [];
    }
  }

  public clearRecentSearches(userId?: string): void {
    try {
      const key = `${RECENT_SEARCHES_KEY}_${userId || 'anon'}`;
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }
}

export const universalSearchService = new UniversalSearchService();

/**
 * Builder parameters for indexing the entire Innovista system state into 1-line searchable items.
 */
export interface SystemSearchIndexParams {
  navTabs: NavTabConfig[];
  quotes: Quote[];
  projects: Project[];
  clients: Client[];
  invoices: Invoice[];
  payments: Payment[];
  adjustments: Adjustment[];
  itemTemplates: ItemTemplate[];
  productFamilies: ProductFamily[];
  productVariants: ProductVariant[];
  templates: QuoteTemplate[];
  notifications: Notification[];
  personnel: any[];
  equipment: any[];
  ncrs: any[];
  warrantyCertificates: any[];
  verificationRegistry: any[];
  securityUsers: SecurityUser[];
  isDarkMode: boolean;
  // Navigation & Action Handlers
  setView: (view: any) => void;
  setQuote: (q: Quote) => void;
  setSelectedProject: (p: Project) => void;
  setProjectTab: (tab: any) => void;
  setSelectedPortalClient: (c: Client) => void;
  setInvoiceProjectFilter: (id: string | null) => void;
  setPreselectedInvoiceId: (id: string | null) => void;
  setAccountingTab: (tab: any) => void;
  setReportingReport: (rep: any) => void;
  setProcurementTab: (tab: any) => void;
  setOperationalPortalId: (id: any) => void;
  setResourceTab: (tab: any) => void;
  setEquipmentTab: (tab: any) => void;
  setSiteTab: (tab: any) => void;
  setQcTab: (tab: any) => void;
  setWarrantyTab: (tab: any) => void;
  setBoqInitialTab: (tab: any) => void;
  setCatalogInitialTab: (tab: any) => void;
  setShowCatalog: (show: boolean) => void;
  setShowTemplateManager: (show: boolean) => void;
  setShowNotifications: (show: boolean) => void;
  setSettingsInitialTab: (tab: any) => void;
  setSecurityInitialTab: (tab: any) => void;
  setInitialVerificationCode: (code: string) => void;
  handleNewQuote: () => void;
  handleCreateProject: () => void;
  handleOpenImportModal: (entity?: any) => void;
  handleRefreshSystemData: () => void;
  toggleDarkMode: () => void;
  setTheme?: (mode: ThemeMode) => void;
  exportAllData: () => void;
  exportAllDocuments: () => void;
}

/**
 * Builds the complete, RBAC-tagged, single-line search index across all Portals, Features, Actions, Records & Documents.
 */
export function buildSystemUniversalSearchIndex(
  params: SystemSearchIndexParams
): UniversalSearchResultItem[] {
  const items: UniversalSearchResultItem[] = [];
  const seenNavLabels = new Set<string>();

  const add = (item: UniversalSearchResultItem) => {
    items.push(universalSearchService.prepareItem(item));
  };

  // ---------------------------------------------------------------------------
  // 1. PORTALS & FEATURES (from Navigation Tree + Core System Portals)
  // ---------------------------------------------------------------------------
  const traverseNavItems = (
    list: NavDropdownItem[],
    parentLabel: string,
    depth: number
  ) => {
    for (const node of list) {
      const cleanName = node.name.replace(/^\d+\.\s*/, '').trim();
      const uniqueKey = `${parentLabel}>${cleanName}`;

      if (node.onClick && !seenNavLabels.has(uniqueKey)) {
        seenNavLabels.add(uniqueKey);
        const isFeatureOrReport =
          depth >= 2 ||
          /report|aging|statement|retention|baddebt|analytics|matrix|engine|pricing|template|import|audit|evaluation/i.test(
            cleanName
          );

        add({
          id: `nav-${uniqueKey.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
          group: isFeatureOrReport ? 'Features' : 'Portals',
          title: cleanName,
          recordType: isFeatureOrReport ? 'Feature' : depth === 0 ? 'Portal' : 'Sub-Portal',
          contextLabel: parentLabel,
          keywords: [cleanName, parentLabel, 'portal', 'open', 'page', 'module', 'menu'],
          onSelect: () => node.onClick?.()
        });
      }

      if (node.children && node.children.length > 0) {
        traverseNavItems(node.children, cleanName, depth + 1);
      }
    }
  };

  // Top-level Home & Core Portals (Already RBAC-filtered by getNavigationTabs for userId)
  add({
    id: 'portal-home-center',
    group: 'Portals',
    title: 'Home',
    recordType: 'Portal',
    contextLabel: 'Main',
    keywords: ['home', 'control center', 'main', 'start', 'landing'],
    onSelect: () => params.setView('home')
  });

  params.navTabs.forEach(tab => {
    if (tab.onDirectClick && !seenNavLabels.has(tab.label)) {
      seenNavLabels.add(tab.label);
      add({
        id: `portal-tab-${tab.id}`,
        group: 'Portals',
        title: tab.label,
        recordType: 'Portal',
        contextLabel: 'Main',
        keywords: [tab.label, 'portal', 'module', 'main'],
        onSelect: () => tab.onDirectClick?.()
      });
    }
    traverseNavItems(tab.items, tab.label, 1);
  });

  // Additional Direct Portals & Modules
  add({
    id: 'portal-message-panel',
    group: 'Portals',
    title: 'Messages & Chat',
    recordType: 'Portal',
    contextLabel: 'Comms',
    keywords: ['message', 'chat', 'stealth tunnel', 'inbox', 'conversations', 'tasks'],
    onSelect: () => params.setView('stealth-tunnel')
  });

  add({
    id: 'portal-notifications',
    group: 'Portals',
    title: 'Notifications & News',
    recordType: 'Portal',
    contextLabel: 'Alerts',
    keywords: ['notifications', 'alerts', 'news', 'bulletins', 'announcements'],
    onSelect: () => params.setShowNotifications(true)
  });

  add({
    id: 'portal-gmail-settings',
    group: 'Portals',
    title: 'Gmail & Email Templates',
    recordType: 'Portal',
    contextLabel: 'Settings',
    portalId: 'system-administration',
    requiredPermission: 'settings.manage',
    keywords: ['gmail', 'email', 'templates', 'smtp', 'oauth', 'notifications', 'delivery logs'],
    onSelect: () => {
      params.setSettingsInitialTab('email-templates');
      params.setView('settings');
    }
  });

  add({
    id: 'portal-profile-settings',
    group: 'Features',
    title: 'My Profile',
    recordType: 'Feature',
    contextLabel: 'Account',
    keywords: ['profile', 'account', 'my profile', 'password', 'preferences'],
    onSelect: () => {
      params.setSettingsInitialTab('profile');
      params.setView('settings');
    }
  });

  add({
    id: 'portal-branding-settings',
    group: 'Features',
    title: 'Branding & Login Media',
    recordType: 'Feature',
    contextLabel: 'Settings',
    portalId: 'system-administration',
    requiredPermission: 'settings.manage',
    keywords: ['branding', 'logo', 'login video', 'slideshow', 'company name', 'dark logo'],
    onSelect: () => {
      params.setSettingsInitialTab('branding');
      params.setView('settings');
    }
  });

  // ---------------------------------------------------------------------------
  // 2. AUTHORIZED QUICK ACTIONS
  // ---------------------------------------------------------------------------
  add({
    id: 'action-new-quote',
    group: 'Actions',
    title: 'New Quote',
    recordType: 'Action',
    contextLabel: 'Sales',
    portalId: 'sales-crm-quotes',
    requiredPermission: 'quotes.create',
    keywords: ['create quote', 'new quotation', 'add quote', 'pos', 'estimate'],
    onSelect: () => params.handleNewQuote()
  });

  add({
    id: 'action-new-project',
    group: 'Actions',
    title: 'New Project',
    recordType: 'Action',
    contextLabel: 'Projects',
    portalId: 'project-management',
    requiredPermission: 'project.create',
    keywords: ['create project', 'new project', 'add project', 'charter'],
    onSelect: () => params.handleCreateProject()
  });

  add({
    id: 'action-new-invoice',
    group: 'Actions',
    title: 'New Invoice',
    recordType: 'Action',
    contextLabel: 'Finance',
    portalId: 'accounting-finance',
    requiredPermission: 'finance.create',
    keywords: ['create invoice', 'new invoice', 'add invoice', 'bill client'],
    onSelect: () => {
      params.setInvoiceProjectFilter(null);
      params.setView('invoices');
    }
  });

  add({
    id: 'action-new-client',
    group: 'Actions',
    title: 'New Client',
    recordType: 'Action',
    contextLabel: 'CRM',
    portalId: 'sales-crm-quotes',
    requiredPermission: 'clients.create',
    keywords: ['create client', 'new customer', 'add client', 'register customer'],
    onSelect: () => params.setView('clients')
  });

  add({
    id: 'action-new-product',
    group: 'Actions',
    title: 'New Product / BOQ Item',
    recordType: 'Action',
    contextLabel: 'Engineering',
    portalId: 'engineering-qs-boq',
    requiredPermission: 'boq.edit',
    keywords: ['create product', 'new product', 'add boq item', 'catalog item'],
    onSelect: () => {
      params.setBoqInitialTab('CATEGORIES_ITEMS');
      params.setView('boq-items');
    }
  });

  add({
    id: 'action-import-data',
    group: 'Actions',
    title: 'Import Excel / CSV',
    recordType: 'Action',
    contextLabel: 'System',
    portalId: 'system-administration',
    requiredPermission: 'settings.manage',
    keywords: ['import', 'csv', 'excel', 'upload data', 'bulk import'],
    onSelect: () => params.handleOpenImportModal()
  });

  add({
    id: 'action-refresh-data',
    group: 'Actions',
    title: 'Refresh Data',
    recordType: 'Action',
    contextLabel: 'System',
    keywords: ['refresh', 'sync', 'reload data', 'update registers'],
    onSelect: () => params.handleRefreshSystemData()
  });

  THEME_MODE_OPTIONS.forEach(opt => {
    add({
      id: `action-theme-${opt.id}`,
      group: 'Actions',
      title: `Theme: ${opt.label}`,
      recordType: 'Action',
      contextLabel: opt.shortLabel,
      keywords: [opt.label, opt.shortLabel, 'theme', 'mode', 'dark mode', 'night blue', 'cream mode', 'black mode', 'light mode'],
      onSelect: () => {
        if (params.setTheme) {
          params.setTheme(opt.id);
        } else {
          params.toggleDarkMode();
        }
      }
    });
  });

  add({
    id: 'action-export-backup',
    group: 'Actions',
    title: 'Export System Backup',
    recordType: 'Action',
    contextLabel: 'System',
    portalId: 'system-administration',
    requiredPermission: 'settings.manage',
    keywords: ['export', 'backup', 'json', 'download data'],
    onSelect: () => params.exportAllData()
  });

  add({
    id: 'action-export-zip',
    group: 'Actions',
    title: 'Download All Documents ZIP',
    recordType: 'Action',
    contextLabel: 'System',
    portalId: 'system-administration',
    requiredPermission: 'settings.manage',
    keywords: ['zip', 'download all documents', 'archive', 'export pdfs'],
    onSelect: () => params.exportAllDocuments()
  });

  add({
    id: 'action-open-catalog',
    group: 'Actions',
    title: 'Open Product Catalog',
    recordType: 'Action',
    contextLabel: 'Catalog',
    portalId: 'engineering-qs-boq',
    requiredPermission: 'boq.view',
    keywords: ['open catalog', 'product library', 'browse items'],
    onSelect: () => {
      params.setCatalogInitialTab('OVERVIEW');
      params.setShowCatalog(true);
    }
  });

  // ---------------------------------------------------------------------------
  // 3. RECORDS (Projects, Customers, Suppliers, Employees, Users, Equipment,
  //    Products, BOQ Items, Quotes, Invoices, POs, RFQs, Tasks, Messages, etc.)
  // ---------------------------------------------------------------------------

  // 3A. Projects & Project BOQ / Variations
  params.projects.forEach(p => {
    add({
      id: `rec-project-${p.id}`,
      group: 'Records',
      title: `${p.projectName} (${p.client?.name || 'Client'})`,
      code: p.projectCode || p.id.slice(0, 8).toUpperCase(),
      recordType: 'Project',
      contextLabel: p.status,
      portalId: 'project-management',
      requiredPermission: 'project.view',
      keywords: [
        p.projectName,
        p.projectCode || '',
        p.client?.name || '',
        p.siteAddress || '',
        p.category || '',
        p.status,
        'project'
      ],
      onSelect: () => {
        params.setSelectedProject(p);
        params.setProjectTab('overview');
        params.setView('project-details');
      }
    });
  });

  // 3B. Quotations & BOQs
  params.quotes.forEach(q => {
    add({
      id: `rec-quote-${q.id || q.quoteNo}`,
      group: 'Records',
      title: `${q.projectName || 'Quotation'} · ${q.client?.name || ''}`,
      code: q.quoteNo,
      recordType: 'Quote',
      contextLabel: `${q.currency || 'LKR'} ${(q.grandTotal || 0).toLocaleString()}`,
      portalId: 'sales-crm-quotes',
      requiredPermission: 'quotes.view',
      keywords: [
        q.quoteNo,
        q.projectName || '',
        q.client?.name || '',
        q.status || '',
        String(q.grandTotal || ''),
        'quote',
        'quotation',
        'boq'
      ],
      onSelect: () => {
        params.setQuote(q);
        params.setView('editor');
      }
    });
  });

  // 3C. Customers / Clients
  params.clients.forEach(c => {
    add({
      id: `rec-client-${c.id}`,
      group: 'Records',
      title: c.name,
      code: c.company || c.phone || undefined,
      recordType: 'Customer',
      contextLabel: c.email || 'CRM',
      portalId: 'sales-crm-quotes',
      requiredPermission: 'clients.view',
      keywords: [
        c.name,
        c.company || '',
        c.email || '',
        c.phone || '',
        c.address || '',
        'customer',
        'client'
      ],
      onSelect: () => {
        params.setSelectedPortalClient(c);
        params.setView('clients');
      }
    });
  });

  // 3D. Invoices
  params.invoices.forEach(inv => {
    add({
      id: `rec-invoice-${inv.id}`,
      group: 'Records',
      title: `${inv.client?.name || 'Client'} · ${inv.projectName || 'Invoice'}`,
      code: inv.invoiceNo,
      recordType: 'Invoice',
      contextLabel: `LKR ${(inv.grandTotal || 0).toLocaleString()}`,
      portalId: 'accounting-finance',
      requiredPermission: 'finance.view',
      keywords: [
        inv.invoiceNo,
        inv.client?.name || '',
        inv.projectName || '',
        inv.status || '',
        String(inv.grandTotal || ''),
        'invoice',
        'billing'
      ],
      onSelect: () => {
        params.setPreselectedInvoiceId(inv.id);
        params.setInvoiceProjectFilter(null);
        params.setView('invoices');
      }
    });
  });

  // 3E. Payments
  params.payments.forEach(pay => {
    add({
      id: `rec-payment-${pay.id}`,
      group: 'Records',
      title: `Payment · ${pay.method}`,
      code: pay.referenceNumber || pay.id.slice(0, 8).toUpperCase(),
      recordType: 'Invoice',
      contextLabel: `LKR ${(pay.amount || 0).toLocaleString()}`,
      portalId: 'accounting-finance',
      requiredPermission: 'finance.view',
      keywords: [
        pay.referenceNumber || '',
        pay.method || '',
        String(pay.amount || ''),
        'payment',
        'receipt'
      ],
      onSelect: () => {
        params.setAccountingTab('payments');
        params.setView('accounting');
      }
    });
  });

  // 3F. Products & BOQ Items
  params.itemTemplates.forEach(prod => {
    add({
      id: `rec-product-${prod.id}`,
      group: 'Records',
      title: prod.name,
      code: prod.pvcCode || prod.productCode || undefined,
      recordType: 'Product',
      contextLabel: `${prod.category} · LKR ${(prod.rate || 0).toLocaleString()}`,
      portalId: 'engineering-qs-boq',
      requiredPermission: 'boq.view',
      keywords: [
        prod.name,
        prod.pvcCode || '',
        prod.productCode || '',
        prod.category || '',
        prod.unit || '',
        'product',
        'boq',
        'item'
      ],
      onSelect: () => {
        params.setBoqInitialTab('CATEGORIES_ITEMS');
        params.setView('boq-items');
      }
    });
  });

  // 3G. Product Variants
  params.productVariants.forEach(v => {
    add({
      id: `rec-variant-${v.id}`,
      group: 'Records',
      title: v.variantName,
      code: v.sku || v.variantCode,
      recordType: 'BOQ',
      contextLabel: `LKR ${(v.pricing?.sellingPrice || 0).toLocaleString()}`,
      portalId: 'engineering-qs-boq',
      requiredPermission: 'boq.view',
      keywords: [
        v.variantName,
        v.sku || '',
        v.variantCode || '',
        'variant',
        'boq',
        'matrix'
      ],
      onSelect: () => {
        params.setBoqInitialTab('VARIANTS_LIST');
        params.setView('boq-items');
      }
    });
  });

  // 3H. Suppliers, Purchase Orders (PO), RFQs, Requisitions (PR), GRNs, Warehouse Stock
  try {
    const suppliers = procurementService.getSuppliers();
    suppliers.forEach(sup => {
      add({
        id: `rec-supplier-${sup.id}`,
        group: 'Records',
        title: sup.name,
        code: sup.vendorCode,
        recordType: 'Supplier',
        contextLabel: sup.category,
        portalId: 'procurement-supply-chain',
        requiredPermission: 'procurement.view',
        keywords: [
          sup.name,
          sup.vendorCode,
          sup.category,
          sup.contactPerson,
          sup.email,
          sup.city,
          'supplier',
          'vendor'
        ],
        onSelect: () => {
          params.setProcurementTab('suppliers');
          params.setView('procurement');
        }
      });
    });

    const pos = procurementService.getPurchaseOrders();
    pos.forEach(po => {
      add({
        id: `rec-po-${po.id}`,
        group: 'Records',
        title: `${po.supplierName} · ${po.projectName || 'Order'}`,
        code: po.poNumber,
        recordType: 'PO',
        contextLabel: `${po.currency} ${(po.totalAmount || 0).toLocaleString()}`,
        portalId: 'procurement-supply-chain',
        requiredPermission: 'procurement.view',
        keywords: [
          po.poNumber,
          po.supplierName,
          po.projectName || '',
          po.status,
          'purchase order',
          'po'
        ],
        onSelect: () => {
          params.setProcurementTab('pos');
          params.setView('procurement');
        }
      });
    });

    const rfqs = procurementService.getRfqs();
    rfqs.forEach(rfq => {
      add({
        id: `rec-rfq-${rfq.id}`,
        group: 'Records',
        title: rfq.title,
        code: rfq.rfqNumber,
        recordType: 'RFQ',
        contextLabel: rfq.status,
        portalId: 'procurement-supply-chain',
        requiredPermission: 'procurement.view',
        keywords: [
          rfq.rfqNumber,
          rfq.title,
          rfq.projectName || '',
          rfq.status,
          'rfq',
          'tender',
          'sourcing'
        ],
        onSelect: () => {
          params.setProcurementTab('rfq');
          params.setView('procurement');
        }
      });
    });

    const prs = procurementService.getRequisitions();
    prs.forEach(pr => {
      add({
        id: `rec-pr-${pr.id}`,
        group: 'Records',
        title: `${pr.projectName} · ${pr.requestedBy}`,
        code: pr.requisitionNumber,
        recordType: 'PO',
        contextLabel: pr.status,
        portalId: 'procurement-supply-chain',
        requiredPermission: 'procurement.view',
        keywords: [
          pr.requisitionNumber,
          pr.projectName,
          pr.requestedBy,
          pr.department,
          'requisition',
          'pr'
        ],
        onSelect: () => {
          params.setProcurementTab('pr');
          params.setView('procurement');
        }
      });
    });

    const inventory = procurementService.getInventory();
    inventory.forEach(invItem => {
      add({
        id: `rec-stock-${invItem.id}`,
        group: 'Records',
        title: invItem.name,
        code: invItem.code,
        recordType: 'Product',
        contextLabel: `${invItem.availableQuantity} ${invItem.unit}`,
        portalId: 'procurement-supply-chain',
        requiredPermission: 'procurement.view',
        keywords: [
          invItem.name,
          invItem.code,
          invItem.category,
          invItem.warehouse,
          'inventory',
          'stock',
          'warehouse'
        ],
        onSelect: () => {
          params.setProcurementTab('inventory');
          params.setView('procurement');
        }
      });
    });
  } catch (e) {
    console.error('Error indexing procurement records:', e);
  }

  // 3I. Employees / Workforce (from App state + hrService)
  const seenEmployeeIds = new Set<string>();
  const allEmployees = [...(params.personnel || []), ...(hrService.getEmployees?.() || [])];
  allEmployees.forEach(emp => {
    const empId = emp.id || emp.employeeCode;
    if (!empId || seenEmployeeIds.has(empId)) return;
    seenEmployeeIds.add(empId);
    const fullName = emp.name || emp.fullName || 'Employee';
    add({
      id: `rec-emp-${empId}`,
      group: 'Records',
      title: fullName,
      code: emp.employeeCode || emp.id?.slice(0, 8),
      recordType: 'Employee',
      contextLabel: emp.role || emp.designation || emp.department || 'HR',
      portalId: 'human-resources',
      requiredPermission: 'hr.view',
      keywords: [
        fullName,
        emp.employeeCode || '',
        emp.role || '',
        emp.designation || '',
        emp.department || '',
        emp.trade || '',
        'employee',
        'workforce',
        'staff',
        'hr'
      ],
      onSelect: () => {
        params.setResourceTab('personnel');
        params.setView('resource-management');
      }
    });
  });

  // 3J. System Users (RBAC Security Users)
  params.securityUsers.forEach(u => {
    add({
      id: `rec-user-${u.id}`,
      group: 'Records',
      title: u.fullName,
      code: u.employeeId,
      recordType: 'User',
      contextLabel: u.roleName,
      portalId: 'system-administration',
      requiredPermission: 'security.view',
      keywords: [
        u.fullName,
        u.email,
        u.username,
        u.employeeId,
        u.roleName,
        u.department,
        'user',
        'account',
        'rbac'
      ],
      onSelect: () => {
        params.setSettingsInitialTab('access-control');
        params.setSecurityInitialTab('ecosystem');
        params.setView('settings');
      }
    });
  });

  // 3K. Equipment & Machinery
  const seenEquipIds = new Set<string>();
  const allEquip = [...(params.equipment || []), ...(equipmentControlService.getAssets?.() || [])];
  allEquip.forEach(eq => {
    const eqId = eq.id || eq.assetTag;
    if (!eqId || seenEquipIds.has(eqId)) return;
    seenEquipIds.add(eqId);
    add({
      id: `rec-equip-${eqId}`,
      group: 'Records',
      title: eq.name,
      code: eq.assetTag || eq.serialNumber || eq.code,
      recordType: 'Equipment',
      contextLabel: eq.status || eq.category || 'Plant',
      portalId: 'equipment-machinery',
      requiredPermission: 'equipment.view',
      keywords: [
        eq.name,
        eq.assetTag || '',
        eq.serialNumber || '',
        eq.category || '',
        eq.status || '',
        'equipment',
        'machinery',
        'tool',
        'plant'
      ],
      onSelect: () => {
        params.setEquipmentTab('inventory');
        params.setView('equipment-management');
      }
    });
  });

  // 3L. Factory Profiles, Work Packages & Production Tasks
  try {
    const factories = factoryExecutionService.getFactories();
    factories.forEach(fac => {
      add({
        id: `rec-factory-${fac.id}`,
        group: 'Records',
        title: fac.name,
        code: fac.code,
        recordType: 'Portal',
        contextLabel: fac.city || fac.status,
        portalId: 'factory-workshop-management',
        requiredPermission: 'factory.view',
        keywords: [fac.name, fac.code, fac.city || '', fac.managerName || '', 'factory', 'workshop'],
        onSelect: () => {
          params.setOperationalPortalId('factories');
          params.setView('operational-control');
        }
      });
    });

    const facTasks = factoryExecutionService.getTasks();
    facTasks.forEach(t => {
      add({
        id: `rec-factask-${t.id}`,
        group: 'Records',
        title: t.title,
        code: t.taskCode,
        recordType: 'Task',
        contextLabel: t.status,
        portalId: 'factory-workshop-management',
        requiredPermission: 'factory.view',
        keywords: [
          t.taskCode,
          t.title,
          t.assignedSupervisorName || '',
          t.stage || '',
          t.status,
          'task',
          'factory task',
          'production'
        ],
        onSelect: () => {
          params.setOperationalPortalId('tasks_planning');
          params.setView('operational-control');
        }
      });
    });
  } catch (e) {
    console.error('Error indexing factory records:', e);
  }

  // 3M. Messages, Chat Threads & Assigned Chat Tasks
  try {
    const threads = centralMessagingService.getAuthorizedThreadsForUser(null);
    threads.forEach(th => {
      add({
        id: `rec-thread-${th.id}`,
        group: 'Records',
        title: th.title,
        code: th.channelLabel,
        recordType: 'Message',
        contextLabel: th.status === 'awaiting_action' ? 'Action Due' : 'Chat',
        keywords: [
          th.title,
          th.subtitle || '',
          th.channelLabel,
          th.lastMessageText || '',
          'message',
          'chat',
          'conversation'
        ],
        onSelect: () => params.setView('stealth-tunnel')
      });
    });

    const allMsgs = centralMessagingService.getAllMessages();
    allMsgs.forEach(m => {
      if (m.taskPayload) {
        add({
          id: `rec-msgtask-${m.id}`,
          group: 'Records',
          title: m.taskPayload.title,
          code: m.taskPayload.taskCode,
          recordType: 'Task',
          contextLabel: m.taskPayload.assignedToName,
          keywords: [
            m.taskPayload.taskCode,
            m.taskPayload.title,
            m.taskPayload.assignedToName,
            m.taskPayload.status,
            'task',
            'assigned task'
          ],
          onSelect: () => params.setView('stealth-tunnel')
        });
      }
    });
  } catch (e) {
    console.error('Error indexing messages:', e);
  }

  // 3N. Quality NCRs, Inspections, HSE Permits & Warranties
  try {
    const allNcrs = [...(params.ncrs || []), ...((qualityControlService as any).getNCRs?.() || [])];
    const seenNcrs = new Set<string>();
    allNcrs.forEach(ncr => {
      const ncrId = ncr.id || ncr.ncrNo || ncr.ncrNumber;
      if (!ncrId || seenNcrs.has(ncrId)) return;
      seenNcrs.add(ncrId);
      add({
        id: `rec-ncr-${ncrId}`,
        group: 'Records',
        title: ncr.title || ncr.description || 'Quality NCR',
        code: ncr.ncrNo || ncr.ncrNumber || ncrId.slice(0, 8),
        recordType: 'Alert',
        contextLabel: ncr.severity || ncr.status || 'QC',
        portalId: 'quality-assurance',
        requiredPermission: 'qc.view',
        keywords: [
          ncr.ncrNo || '',
          ncr.ncrNumber || '',
          ncr.title || '',
          ncr.projectName || '',
          'ncr',
          'quality',
          'defect'
        ],
        onSelect: () => {
          params.setQcTab('ncrs');
          params.setView('quality-control');
        }
      });
    });

    const permits = (safetyControlService as any).getPermits?.() || [];
    permits.forEach((ptw: any) => {
      add({
        id: `rec-ptw-${ptw.id}`,
        group: 'Records',
        title: ptw.workDescription || ptw.type || 'Work Permit',
        code: ptw.permitNumber || ptw.id,
        recordType: 'Document',
        contextLabel: ptw.status || 'HSE',
        portalId: 'construction-site-management',
        requiredPermission: 'site.view',
        keywords: [
          ptw.permitNumber || '',
          ptw.type || '',
          ptw.workDescription || '',
          ptw.location || '',
          'permit',
          'ptw',
          'safety',
          'hse'
        ],
        onSelect: () => {
          params.setSiteTab('permits');
          params.setView('site-management');
        }
      });
    });
  } catch (e) {
    console.error('Error indexing QC/HSE records:', e);
  }

  // 3O. Notifications
  params.notifications.slice(0, 25).forEach(n => {
    add({
      id: `rec-notif-${n.id}`,
      group: 'Records',
      title: n.title,
      recordType: 'Alert',
      contextLabel: n.category || 'System',
      keywords: [n.title, n.message || '', n.category || '', 'notification', 'alert'],
      onSelect: () => params.setShowNotifications(true)
    });
  });

  // ---------------------------------------------------------------------------
  // 4. DOCUMENTS (89 Procurement Packages, Controlled Drawings, Templates,
  //    Email Templates, Verification Registry)
  // ---------------------------------------------------------------------------

  // 4A. All 89 Procurement Document Packages
  ALL_89_PROCUREMENT_DOCUMENTS.forEach(doc => {
    add({
      id: `doc-proc-${doc.id}`,
      group: 'Documents',
      title: doc.title,
      code: `#${doc.docNumber} ${doc.docCode}`,
      recordType: 'Document',
      contextLabel: doc.group,
      portalId: 'procurement-supply-chain',
      requiredPermission: 'procurement.view',
      keywords: [
        doc.title,
        doc.docCode,
        String(doc.docNumber),
        doc.group,
        'procurement document',
        'form',
        'package'
      ],
      onSelect: () => {
        params.setProcurementTab('documents');
        params.setView('procurement');
      }
    });
  });

  // 4B. Controlled Factory Drawings & Technical Documents
  try {
    const facDocs = factoryExecutionService.getDocuments();
    facDocs.forEach(d => {
      add({
        id: `doc-factory-${d.id}`,
        group: 'Documents',
        title: d.title,
        code: d.documentCode,
        recordType: 'Document',
        contextLabel: `Rev ${d.revision}`,
        portalId: 'factory-workshop-management',
        requiredPermission: 'factory.view',
        keywords: [
          d.documentCode,
          d.title,
          d.category,
          d.projectName || '',
          'drawing',
          'shop drawing',
          'technical document'
        ],
        onSelect: () => {
          params.setOperationalPortalId('documents_drawings');
          params.setView('operational-control');
        }
      });
    });
  } catch (e) {
    console.error('Error indexing factory documents:', e);
  }

  // 4C. Quote Templates
  params.templates.forEach(tpl => {
    add({
      id: `doc-quotetpl-${tpl.id}`,
      group: 'Documents',
      title: tpl.name,
      recordType: 'Document',
      contextLabel: 'Quote Template',
      portalId: 'sales-crm-quotes',
      requiredPermission: 'quotes.view',
      keywords: [tpl.name, tpl.quoteType || '', 'template', 'quote template'],
      onSelect: () => params.setShowTemplateManager(true)
    });
  });

  // 4D. Email Templates
  try {
    const emailTpls = centralEmailService.getTemplates();
    emailTpls.forEach(et => {
      add({
        id: `doc-emailtpl-${et.id}`,
        group: 'Documents',
        title: et.name,
        code: et.templateCode,
        recordType: 'Document',
        contextLabel: 'Email Template',
        portalId: 'system-administration',
        requiredPermission: 'settings.manage',
        keywords: [et.name, et.templateCode || '', et.category, et.subject, 'email template', 'gmail'],
        onSelect: () => {
          params.setSettingsInitialTab('email-templates');
          params.setView('settings');
        }
      });
    });
  } catch (e) {
    console.error('Error indexing email templates:', e);
  }

  // 4E. Document Verification Registry (SVC / PVC / CVC)
  (params.verificationRegistry || []).slice(0, 30).forEach((ver: any) => {
    const code = ver.svcCode || ver.pvcCode || ver.code;
    if (!code) return;
    add({
      id: `doc-ver-${code}`,
      group: 'Documents',
      title: ver.documentTitle || ver.projectName || 'Verified Document',
      code,
      recordType: 'Document',
      contextLabel: 'Verified',
      portalId: 'document-control',
      requiredPermission: 'document.view',
      keywords: [code, ver.documentTitle || '', ver.clientName || '', 'verification', 'svc', 'pvc'],
      onSelect: () => {
        params.setInitialVerificationCode(code);
        params.setView('verification');
      }
    });
  });

  return items;
}
