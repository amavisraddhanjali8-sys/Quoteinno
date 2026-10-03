import React, { useState, useMemo } from 'react';
import {
  Layout,
  Cpu,
  FileText,
  CreditCard,
  Package,
  CheckCircle2,
  Truck,
  Landmark,
  Building2,
  Users,
  ShieldCheck,
  Plus,
  ArrowRight,
  Clock,
  HardHat,
  Search,
  Calendar,
  ClipboardList,
  BarChart3,
  Award,
  Radio,
  FileSpreadsheet,
  Download,
  Check,
  AlertTriangle,
  SlidersHorizontal,
  Wrench,
  Scale,
  DollarSign,
  Settings,
  History,
  UserCheck,
  Medal,
  GraduationCap,
  GanttChart,
  HeartHandshake,
  Store,
  TrendingUp,
  FolderTree,
  Boxes,
  FileCheck,
  FolderOpen,
  LayoutDashboard,
  ShoppingCart,
  Layers,
  ShieldAlert,
  RefreshCw
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useSecurity } from '../context/SecurityContext';
import { hrService } from '../services/hrService';
import { securityService } from '../services/securityService';
import { CentralPortalId } from '../types/security';

interface HomePageProps {
  onNavigate: (view: string, subTab?: string, extraParams?: any) => void;
  onNewQuote: () => void;
  onImportModal: () => void;
  onExportSnapshot: () => void;
  quotesCount?: number;
  projectsCount?: number;
  invoicesCount?: number;
  clientsCount?: number;
}

export interface SystemAction {
  id: string;
  name: string;
  badge?: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  action: () => void;
  permissionCode?: string;
}

export interface SystemSubSubPortal {
  id: string;
  name: string;
  badge?: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  permissionCode?: string;
  actions: SystemAction[];
}

export interface SystemSubPortal {
  id: string;
  name: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: string;
  permissionCode?: string;
  viewTarget: string;
  subTabTarget?: string;
  extraParams?: any;
  subSubPortals: SystemSubSubPortal[];
}

export interface SystemDomain {
  id: string;
  name: string;
  shortLabel: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: string;
  permissionDomain?: string;
  subPortals: SystemSubPortal[];
}

export interface QuickActionItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  action: () => void;
  permission?: string;
  centralPortalId?: CentralPortalId;
  color: string;
}

export interface QuickActionGroup {
  portalId: string;
  portalName: string;
  portalIcon: React.ComponentType<{ size?: number; className?: string }>;
  actions: QuickActionItem[];
}

export const HomePage: React.FC<HomePageProps> = ({
  onNavigate,
  onNewQuote,
  onImportModal,
  onExportSnapshot
}) => {
  const { currentUser, effectiveUser, hasPermission, accessRequests, createAccessRequest, refreshData } = useSecurity();
  const activeUser = effectiveUser || currentUser;

  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [reqTargetPortalId, setReqTargetPortalId] = useState<CentralPortalId>('procurement-supply-chain');
  const [reqJustification, setReqJustification] = useState('');
  const [reqDuration, setReqDuration] = useState<'Permanent' | 'Temporary (7 days)' | 'Temporary (30 days)' | 'Temporary (90 days)'>('Permanent');
  const [reqSubmittedToast, setReqSubmittedToast] = useState<string | null>(null);

  // Master clearance check for Super Administrator only
  const isAdmin = useMemo(() => {
    if (!activeUser) return false;
    return (
      activeUser.roleId === 'role-superadmin' ||
      activeUser.adminAuthorityLevel === 'SUPER_ADMINISTRATOR'
    );
  }, [activeUser]);

  const canPortal = (portalId: CentralPortalId): boolean => {
    if (isAdmin) return true;
    if (!activeUser) return false;
    return securityService.canAccessPortal(activeUser.id, portalId);
  };

  // Master Universal Portals Architecture matching 1:1 with all Portals in the Navigation Bar
  // 10 Primary Portals: Dashboard, Control Platform, Quotes, Invoices, Products, Projects, Procurement, Finance, Operations, System
  const domains: SystemDomain[] = useMemo(() => {
    return [
      // 1. DASHBOARD PORTAL
      {
        id: 'nav-dashboard',
        name: 'Dashboard',
        shortLabel: 'Dashboard',
        icon: Layout,
        badge: 'Analytics',
        permissionDomain: 'dashboard',
        subPortals: [
          {
            id: 'sub-dash-perspectives',
            name: 'Executive Views',
            icon: BarChart3,
            badge: 'Executive',
            permissionCode: 'dashboard:view',
            viewTarget: 'dashboard',
            extraParams: { perspective: 'overview' },
            subSubPortals: [
              {
                id: 'ssp-dash-overview',
                name: 'Overview Hub',
                badge: 'Live',
                icon: Layout,
                actions: [
                  { id: 'act-dash-ov', name: 'Overview Hub', badge: 'Pulse', action: () => onNavigate('dashboard', undefined, { perspective: 'overview' }) },
                  { id: 'act-dash-exec', name: 'Executive Cockpit', badge: 'C-Level', action: () => onNavigate('dashboard', undefined, { perspective: 'executive' }) },
                  { id: 'act-dash-analytics', name: 'Analytics & KPIs', badge: 'Metrics', action: () => onNavigate('dashboard', undefined, { perspective: 'analytics' }) }
                ]
              },
              {
                id: 'ssp-dash-commercial',
                name: 'Commercial Pulse',
                badge: 'Finance',
                icon: Landmark,
                actions: [
                  { id: 'act-dash-fin', name: 'Finance Perspective', badge: 'Cashflow', action: () => onNavigate('dashboard', undefined, { perspective: 'finance' }) },
                  { id: 'act-dash-crm', name: 'CRM & Pipeline', badge: 'Sales', action: () => onNavigate('dashboard', undefined, { perspective: 'crm' }) },
                  { id: 'act-dash-pricing', name: 'Pricing Intelligence', badge: 'Margins', action: () => onNavigate('dashboard', undefined, { perspective: 'analytics' }) }
                ]
              }
            ]
          },
          {
            id: 'sub-dash-operational',
            name: 'Operations Views',
            icon: HardHat,
            badge: 'Shop Floor',
            permissionCode: 'dashboard:view',
            viewTarget: 'dashboard',
            extraParams: { perspective: 'operations' },
            subSubPortals: [
              {
                id: 'ssp-dash-ops',
                name: 'Operational Pulse',
                badge: 'Plant',
                icon: HardHat,
                actions: [
                  { id: 'act-dash-op-view', name: 'Operations View', badge: 'Throughput', action: () => onNavigate('dashboard', undefined, { perspective: 'operations' }) },
                  { id: 'act-dash-qc-view', name: 'Quality Perspective', badge: 'Yield', action: () => onNavigate('dashboard', undefined, { perspective: 'quality' }) }
                ]
              }
            ]
          }
        ]
      },

      // 2. CONTROL PLATFORM PORTAL (FACTORY, WORKSHOP & SITE EXECUTION)
      {
        id: 'nav-control-platform',
        name: 'Control Platform',
        shortLabel: 'Control Platform',
        icon: Cpu,
        badge: 'Factory & Site',
        permissionDomain: 'operations',
        subPortals: [
          {
            id: 'sub-ctrl-executive',
            name: 'Factory Command & Registry',
            icon: Building2,
            badge: 'Plants',
            permissionCode: 'operations:view',
            viewTarget: 'operational-control',
            extraParams: { portal: 'dashboard' },
            subSubPortals: [
              {
                id: 'ssp-ctrl-exec',
                name: 'Factory Command Dashboard',
                badge: 'Live',
                icon: Building2,
                actions: [
                  { id: 'act-ctrl-exec-view', name: 'Command Dashboard', badge: 'Live', action: () => onNavigate('operational-control', undefined, { portal: 'dashboard' }) },
                  { id: 'act-ctrl-exec-kpis', name: 'Factory Master Registry', badge: 'Plants', action: () => onNavigate('operational-control', undefined, { portal: 'factories' }) }
                ]
              },
              {
                id: 'ssp-ctrl-pm',
                name: 'Work Packages & Scopes',
                badge: 'WPs',
                icon: CheckCircle2,
                actions: [
                  { id: 'act-ctrl-pm-hub', name: 'Assign Work Packages', badge: 'Scopes', action: () => onNavigate('operational-control', undefined, { portal: 'work_packages' }) },
                  { id: 'act-ctrl-pm-gates', name: '16-Stage Gate Control', badge: 'Gates', action: () => onNavigate('operational-control', undefined, { portal: 'tasks_planning' }) }
                ]
              }
            ]
          },
          {
            id: 'sub-ctrl-shopfloor',
            name: 'Production, Tasks & Worksheets',
            icon: Wrench,
            badge: 'Shop Floor',
            permissionCode: 'operations:view',
            viewTarget: 'operational-control',
            extraParams: { portal: 'tasks_planning' },
            subSubPortals: [
              {
                id: 'ssp-ctrl-shop',
                name: 'Tasks, Work Orders & Gantt',
                badge: 'Orders',
                icon: Wrench,
                actions: [
                  { id: 'act-ctrl-terminal', name: 'Task Cards & Work Orders', badge: 'WOs', action: () => onNavigate('operational-control', undefined, { portal: 'tasks_planning' }) },
                  { id: 'act-ctrl-fabrication', name: 'Digital Worksheets & Daily Log', badge: 'Sheets', action: () => onNavigate('operational-control', undefined, { portal: 'worksheets_daily' }) }
                ]
              },
              {
                id: 'ssp-ctrl-eng',
                name: 'Workforce, Machines & BOM',
                badge: 'Resources',
                icon: Package,
                actions: [
                  { id: 'act-ctrl-eng-spec', name: 'Crew, CNC & Material BOM', badge: 'Sync', action: () => onNavigate('operational-control', undefined, { portal: 'resources_materials' }) },
                  { id: 'act-ctrl-bom-rev', name: 'Drawings & 25+ Doc Generator', badge: 'Docs', action: () => onNavigate('operational-control', undefined, { portal: 'documents_drawings' }) }
                ]
              }
            ]
          },
          {
            id: 'sub-ctrl-assurance',
            name: 'Quality, HSE & Site Dispatch',
            icon: ShieldCheck,
            badge: 'QA & Site',
            permissionCode: 'qc:view',
            viewTarget: 'operational-control',
            extraParams: { portal: 'quality_hse' },
            subSubPortals: [
              {
                id: 'ssp-ctrl-qa',
                name: 'Quality (ITP/NCR) & HSE',
                badge: 'QC/HSE',
                icon: ShieldCheck,
                actions: [
                  { id: 'act-ctrl-qa-itp', name: 'Inspections, Rework & HSE', badge: 'FIR', action: () => onNavigate('operational-control', undefined, { portal: 'quality_hse' }) },
                  { id: 'act-ctrl-qa-ncr', name: 'Packing, Dispatch & Site Install', badge: 'Site', action: () => onNavigate('operational-control', undefined, { portal: 'dispatch_site' }) }
                ]
              },
              {
                id: 'ssp-ctrl-assets',
                name: 'Performance & Partner Portal',
                badge: 'Partner',
                icon: Cpu,
                actions: [
                  { id: 'act-ctrl-fleet-stat', name: 'Factory Scorecard & Audit', badge: 'KPIs', action: () => onNavigate('operational-control', undefined, { portal: 'analytics_audit' }) },
                  { id: 'act-ctrl-pm-schedule', name: 'External Partner Portal', badge: 'External', action: () => onNavigate('operational-control', undefined, { portal: 'partner_portal' }) }
                ]
              }
            ]
          }
        ]
      },

      // 3. QUOTES PORTAL
      {
        id: 'nav-quotes',
        name: 'Quotes',
        shortLabel: 'Quotes',
        icon: FileText,
        badge: 'Sales',
        permissionDomain: 'quotes',
        subPortals: [
          {
            id: 'sub-q-register',
            name: 'Quote Register & History',
            icon: History,
            badge: 'Register',
            permissionCode: 'quotes:view',
            viewTarget: 'history',
            subSubPortals: [
              {
                id: 'ssp-q-records',
                name: 'Quote Records',
                badge: 'Live',
                icon: FileText,
                actions: [
                  { id: 'act-q-all', name: 'All Quotes', badge: 'List', action: () => onNavigate('history') },
                  { id: 'act-q-create', name: 'Draft Quote', badge: 'New', action: onNewQuote, permissionCode: 'quotes:create' },
                  { id: 'act-q-revisions', name: 'Quote Revisions', badge: 'History', action: () => onNavigate('history') }
                ]
              },
              {
                id: 'ssp-q-editor',
                name: 'Quote Editor & BOQ',
                badge: 'Editor',
                icon: FileText,
                actions: [
                  { id: 'act-q-editor-open', name: 'Open BOQ Editor', badge: 'Editor', action: () => onNavigate('editor') },
                  { id: 'act-q-editor-calc', name: 'Margin Calculator', badge: 'Rates', action: () => onNavigate('editor') }
                ]
              }
            ]
          },
          {
            id: 'sub-q-templates',
            name: 'Templates & Assemblies',
            icon: ClipboardList,
            badge: 'Presets',
            permissionCode: 'quotes:view',
            viewTarget: 'history',
            subTabTarget: 'templates',
            subSubPortals: [
              {
                id: 'ssp-q-tmpl-presets',
                name: 'BOQ Templates',
                badge: 'Presets',
                icon: ClipboardList,
                actions: [
                  { id: 'act-q-tmpl-list', name: 'Preset Templates', badge: 'View', action: () => onNavigate('history', 'templates') },
                  { id: 'act-q-tmpl-assemblies', name: 'Standard Assemblies', badge: 'BOQ', action: () => onNavigate('history', 'templates') }
                ]
              },
              {
                id: 'ssp-q-proposals',
                name: 'Customer Proposals',
                badge: 'PDF',
                icon: Building2,
                actions: [
                  { id: 'act-q-prop-letter', name: 'Cover Letters', badge: 'Letters', action: () => onNavigate('history') },
                  { id: 'act-q-prop-terms', name: 'Contract Terms', badge: 'Terms', action: () => onNavigate('history') }
                ]
              }
            ]
          }
        ]
      },

      // 4. INVOICES PORTAL
      {
        id: 'nav-invoices',
        name: 'Invoices',
        shortLabel: 'Invoices',
        icon: CreditCard,
        badge: 'Billing',
        permissionDomain: 'invoices',
        subPortals: [
          {
            id: 'sub-inv-register',
            name: 'Invoice Register & Claims',
            icon: CreditCard,
            badge: 'Claims',
            permissionCode: 'invoices:view',
            viewTarget: 'invoices',
            subSubPortals: [
              {
                id: 'ssp-inv-tax',
                name: 'Tax Invoices',
                badge: 'Register',
                icon: CreditCard,
                actions: [
                  { id: 'act-inv-list', name: 'All Tax Invoices', badge: 'List', action: () => onNavigate('invoices') },
                  { id: 'act-inv-create', name: 'New Invoice Claim', badge: 'Claim', action: () => onNavigate('invoices'), permissionCode: 'invoices:create' },
                  { id: 'act-inv-payment-log', name: 'Log Customer Payment', badge: 'Receipt', action: () => onNavigate('accounting', 'payments') }
                ]
              },
              {
                id: 'ssp-inv-status',
                name: 'Billing Statuses',
                badge: 'Filter',
                icon: Clock,
                actions: [
                  { id: 'act-inv-pending', name: 'Pending Approvals', badge: 'Pending', action: () => onNavigate('invoices') },
                  { id: 'act-inv-overdue', name: 'Overdue Claims', badge: 'Overdue', action: () => onNavigate('invoices') }
                ]
              }
            ]
          },
          {
            id: 'sub-inv-recurring',
            name: 'Recurring & Collections',
            icon: Clock,
            badge: 'Schedules',
            permissionCode: 'invoices:view',
            viewTarget: 'accounting',
            subTabTarget: 'recurring',
            subSubPortals: [
              {
                id: 'ssp-inv-recurring',
                name: 'Recurring Billing',
                badge: 'Retainers',
                icon: Clock,
                actions: [
                  { id: 'act-rec-contracts', name: 'Retainer Contracts', badge: 'Recurring', action: () => onNavigate('accounting', 'recurring') },
                  { id: 'act-rec-cycles', name: 'Auto Billing Cycles', badge: 'Automated', action: () => onNavigate('accounting', 'recurring') }
                ]
              },
              {
                id: 'ssp-inv-aging',
                name: 'Collections & Aging',
                badge: 'Reports',
                icon: BarChart3,
                actions: [
                  { id: 'act-col-aging', name: 'AR Aging Report', badge: 'Aging', action: () => onNavigate('reporting', 'Aging') },
                  { id: 'act-col-retention', name: 'Retention Money Held', badge: 'Retention', action: () => onNavigate('reporting', 'Retention') }
                ]
              }
            ]
          }
        ]
      },

      // 5. PRODUCTS PORTAL
      {
        id: 'nav-products',
        name: 'Products',
        shortLabel: 'Products',
        icon: Package,
        badge: 'Catalog',
        permissionDomain: 'items',
        subPortals: [
          {
            id: 'sub-prod-catalog',
            name: 'Item Catalog & Library',
            icon: Store,
            badge: 'Library',
            permissionCode: 'items:view',
            viewTarget: 'boq-items',
            subTabTarget: 'CATEGORIES_ITEMS',
            subSubPortals: [
              {
                id: 'ssp-prod-master',
                name: 'Master Items & BOM',
                badge: 'BOM',
                icon: Package,
                actions: [
                  { id: 'act-prod-all', name: 'All Products & Items', badge: 'Items', action: () => onNavigate('boq-items', 'CATEGORIES_ITEMS') },
                  { id: 'act-prod-breakdown', name: 'Assembly Breakdown', badge: 'Rates', action: () => onNavigate('boq-items', 'CATEGORIES_ITEMS') },
                  { id: 'act-prod-import', name: 'Import Item Catalog', badge: 'CSV', action: onImportModal }
                ]
              },
              {
                id: 'ssp-prod-categories',
                name: 'Category Tree',
                badge: 'Tree',
                icon: FolderTree,
                actions: [
                  { id: 'act-cat-aluminum', name: 'Architectural Aluminum', badge: 'Extrusions', action: () => onNavigate('boq-items', 'CATEGORIES_ITEMS') },
                  { id: 'act-cat-hardware', name: 'Hardware & Fittings', badge: 'Hardware', action: () => onNavigate('boq-items', 'CATEGORIES_ITEMS') }
                ]
              }
            ]
          },
          {
            id: 'sub-prod-engineering',
            name: 'Variants & Intelligence',
            icon: SlidersHorizontal,
            badge: 'Variants',
            permissionCode: 'items:manage',
            viewTarget: 'boq-items',
            subTabTarget: 'VARIANTS_LIST',
            subSubPortals: [
              {
                id: 'ssp-prod-variants',
                name: 'Product Variants',
                badge: 'Matrix',
                icon: SlidersHorizontal,
                actions: [
                  { id: 'act-var-config', name: 'Variant Matrix', badge: 'Matrix', action: () => onNavigate('boq-items', 'VARIANTS_LIST') },
                  { id: 'act-var-finishes', name: 'Finish & Colors', badge: 'Powder', action: () => onNavigate('boq-items', 'VARIANTS_LIST') }
                ]
              },
              {
                id: 'ssp-prod-pricing',
                name: 'Pricing Intelligence',
                badge: 'Margins',
                icon: TrendingUp,
                actions: [
                  { id: 'act-price-margin', name: 'Bulk Margin Rules', badge: 'Rules', action: () => onNavigate('boq-items', 'PRICING_INTELLIGENCE') },
                  { id: 'act-price-sim', name: 'Cost Escalation', badge: 'Forecast', action: () => onNavigate('boq-items', 'PRICING_INTELLIGENCE') }
                ]
              }
            ]
          }
        ]
      },

      // 6. PROJECTS PORTAL
      {
        id: 'nav-projects',
        name: 'Projects',
        shortLabel: 'Projects',
        icon: CheckCircle2,
        badge: 'Execution',
        permissionDomain: 'projects',
        subPortals: [
          {
            id: 'sub-proj-directory',
            name: 'Project Directory & Hub',
            icon: CheckCircle2,
            badge: 'Active',
            permissionCode: 'projects:view',
            viewTarget: 'projects',
            subSubPortals: [
              {
                id: 'ssp-proj-active',
                name: 'Active Projects',
                badge: 'Jobs',
                icon: CheckCircle2,
                actions: [
                  { id: 'act-proj-list-all', name: 'Project Dashboard', badge: 'All', action: () => onNavigate('projects') },
                  { id: 'act-proj-new-job', name: 'Create Project', badge: 'New', action: () => onNavigate('projects') },
                  { id: 'act-proj-handover', name: 'Project Handover', badge: 'Signoff', action: () => onNavigate('project-lifecycle', 'handover') }
                ]
              },
              {
                id: 'ssp-proj-variations',
                name: 'Scope Variations (VO)',
                badge: 'VO',
                icon: Scale,
                actions: [
                  { id: 'act-vo-registry', name: 'Variation Logs', badge: 'Claims', action: () => onNavigate('variation-manager') },
                  { id: 'act-vo-impact', name: 'Cost Impact Analysis', badge: 'Impact', action: () => onNavigate('variation-manager') }
                ]
              }
            ]
          },
          {
            id: 'sub-proj-lifecycle',
            name: 'Lifecycle & Evaluation',
            icon: GanttChart,
            badge: 'Phases',
            permissionCode: 'projects:view',
            viewTarget: 'project-lifecycle',
            subTabTarget: 'dashboard',
            subSubPortals: [
              {
                id: 'ssp-proj-milestones',
                name: 'Phases & Gantt',
                badge: 'Gantt',
                icon: GanttChart,
                actions: [
                  { id: 'act-phase-gantt', name: 'Milestone Gantt', badge: 'Timeline', action: () => onNavigate('project-lifecycle', 'dashboard') },
                  { id: 'act-phase-risks', name: 'Risk Management Matrix', badge: 'Risks', action: () => onNavigate('project-lifecycle', 'risks') }
                ]
              },
              {
                id: 'ssp-proj-evaluation',
                name: 'Post Evaluation',
                badge: 'Closeout',
                icon: Award,
                actions: [
                  { id: 'act-eval-closeout', name: 'Closeout Variance Audit', badge: 'Audit', action: () => onNavigate('post-evaluation') },
                  { id: 'act-eval-cpi', name: 'Cost Performance (CPI)', badge: 'Index', action: () => onNavigate('post-evaluation') }
                ]
              }
            ]
          }
        ]
      },

      // 7. PROCUREMENT PORTAL
      {
        id: 'nav-procurement',
        name: 'Procurement',
        shortLabel: 'Procurement',
        icon: Truck,
        badge: 'Supply',
        permissionDomain: 'procurement',
        subPortals: [
          // Sub-Portal: Documents (All 89 Formal Procurement Documents Hub)
          {
            id: 'sub-proc-documents',
            name: 'Documents',
            icon: FileText,
            badge: '89 Forms',
            permissionCode: 'procurement:view',
            viewTarget: 'procurement',
            extraParams: { procTab: 'documents' },
            subSubPortals: [
              {
                id: 'ssp-proc-setup-docs',
                name: 'Setup',
                badge: '22',
                icon: FileText,
                actions: [
                  { id: 'act-doc-all-forms', name: 'All 89 Documents Registry', badge: 'Hub', action: () => onNavigate('procurement', undefined, { procTab: 'documents' }) },
                  { id: 'act-doc-setup-reg', name: 'Supplier Setup & Governance', badge: 'Setup', action: () => onNavigate('procurement', undefined, { procTab: 'documents' }) }
                ]
              },
              {
                id: 'ssp-proc-project-docs',
                name: 'Project',
                badge: '18',
                icon: FileText,
                actions: [
                  { id: 'act-doc-proj-plans', name: 'Project Procurement Plans & Schedules', badge: 'Project', action: () => onNavigate('procurement', undefined, { procTab: 'documents' }) }
                ]
              },
              {
                id: 'ssp-proc-req-docs',
                name: 'Requirement',
                badge: '20',
                icon: FileText,
                actions: [
                  { id: 'act-doc-req-mats', name: 'Material Requisitions, BOM & BOQ', badge: 'Requirement', action: () => onNavigate('procurement', undefined, { procTab: 'documents' }) }
                ]
              },
              {
                id: 'ssp-proc-tech-docs',
                name: 'Technical',
                badge: '29',
                icon: FileText,
                actions: [
                  { id: 'act-doc-tech-specs', name: 'Technical Specs, Compliance & Deviations', badge: 'Technical', action: () => onNavigate('procurement', undefined, { procTab: 'documents' }) }
                ]
              }
            ]
          },

          // Sub-Portal 1: Overview & Cockpit
          {
            id: 'sub-proc-overview',
            name: 'Strategic Cockpit & Overview',
            icon: LayoutDashboard,
            badge: 'Pulse',
            permissionCode: 'procurement:view',
            viewTarget: 'procurement',
            extraParams: { procTab: 'overview' },
            subSubPortals: [
              {
                id: 'ssp-proc-cockpit-ops',
                name: 'Live Operations Pulse',
                badge: 'Pulse',
                icon: LayoutDashboard,
                actions: [
                  { id: 'act-proc-cockpit-view', name: 'Procurement Cockpit Hub', badge: 'Live', action: () => onNavigate('procurement', undefined, { procTab: 'overview' }) },
                  { id: 'act-proc-sync-data', name: 'Central Projects Sync', badge: 'Sync', action: () => onNavigate('procurement', undefined, { procTab: 'overview' }) },
                  { id: 'act-proc-kpi-summary', name: 'Live Procurement KPIs', badge: 'KPIs', action: () => onNavigate('procurement', undefined, { procTab: 'overview' }) },
                  { id: 'act-proc-spend-distribution', name: 'Category Spend Distribution', badge: 'Spend', action: () => onNavigate('procurement', undefined, { procTab: 'overview' }) }
                ]
              },
              {
                id: 'ssp-proc-cockpit-trends',
                name: 'Commitments & Sourcing Trends',
                badge: 'Trends',
                icon: TrendingUp,
                actions: [
                  { id: 'act-proc-commitments-trend', name: 'Commitments vs Delivered Trends', badge: 'Delivery', action: () => onNavigate('procurement', undefined, { procTab: 'overview' }) },
                  { id: 'act-proc-monthly-savings', name: 'Monthly Savings Realization', badge: 'Savings', action: () => onNavigate('procurement', undefined, { procTab: 'overview' }) },
                  { id: 'act-proc-budget-tracking', name: 'Procurement Burn Rate Pace', badge: 'Burn', action: () => onNavigate('procurement', undefined, { procTab: 'overview' }) }
                ]
              }
            ]
          },

          // Sub-Portal 2: Costing & Rate Intelligence
          {
            id: 'sub-proc-costing',
            name: 'Costing & Rate Intelligence',
            icon: DollarSign,
            badge: 'Costing',
            permissionCode: 'procurement:view',
            viewTarget: 'procurement',
            extraParams: { procTab: 'costing' },
            subSubPortals: [
              {
                id: 'ssp-proc-cost-register',
                name: 'Material Cost Register',
                badge: 'Rates',
                icon: DollarSign,
                actions: [
                  { id: 'act-proc-cost-mgr', name: 'Material Cost Items Manager', badge: 'Catalog', action: () => onNavigate('procurement', undefined, { procTab: 'costing' }) },
                  { id: 'act-proc-rate-benchmarks', name: 'Procurement Rate Benchmarks', badge: 'Benchmark', action: () => onNavigate('procurement', undefined, { procTab: 'costing' }) },
                  { id: 'act-proc-rate-variance', name: 'Supplier Rate Variances', badge: 'Delta', action: () => onNavigate('procurement', undefined, { procTab: 'costing' }) },
                  { id: 'act-proc-cost-entry', name: 'New Material Cost Entry', badge: 'Create', action: () => onNavigate('procurement', undefined, { procTab: 'costing' }) }
                ]
              },
              {
                id: 'ssp-proc-cost-analysis',
                name: 'Escalation & Savings Analysis',
                badge: 'Forecast',
                icon: TrendingUp,
                actions: [
                  { id: 'act-proc-cost-escalation', name: 'Material Escalation Forecast', badge: 'Forecast', action: () => onNavigate('procurement', undefined, { procTab: 'costing' }) },
                  { id: 'act-proc-target-margin', name: 'Target Cost vs Quoted Rate Audit', badge: 'Audit', action: () => onNavigate('procurement', undefined, { procTab: 'costing' }) },
                  { id: 'act-proc-savings-register', name: 'Procurement Savings Registry', badge: 'Savings', action: () => onNavigate('procurement', undefined, { procTab: 'costing' }) }
                ]
              }
            ]
          },

          // Sub-Portal 3: Purchase Requisitions (PR)
          {
            id: 'sub-proc-pr',
            name: 'Requisitions & Approvals (PR)',
            icon: FileText,
            badge: 'PR',
            permissionCode: 'procurement:view',
            viewTarget: 'procurement',
            extraParams: { procTab: 'pr' },
            subSubPortals: [
              {
                id: 'ssp-proc-req-queue',
                name: 'Requisition Workflow & Queue',
                badge: 'Workflow',
                icon: FileText,
                actions: [
                  { id: 'act-pr-create-btn', name: 'New Purchase Requisition (PR)', badge: 'New PR', action: () => onNavigate('procurement', undefined, { procTab: 'pr' }) },
                  { id: 'act-pr-approvals-queue', name: 'Requisition Approvals Queue', badge: 'Pending', action: () => onNavigate('procurement', undefined, { procTab: 'pr' }) },
                  { id: 'act-pr-priority-urgent', name: 'Urgent Material Requisitions', badge: 'Urgent', action: () => onNavigate('procurement', undefined, { procTab: 'pr' }) },
                  { id: 'act-pr-dept-tracking', name: 'Departmental PR Tracking', badge: 'Depts', action: () => onNavigate('procurement', undefined, { procTab: 'pr' }) }
                ]
              },
              {
                id: 'ssp-proc-req-conversion',
                name: 'Budget Gates & Conversion',
                badge: 'Conversion',
                icon: Scale,
                actions: [
                  { id: 'act-pr-convert-po', name: 'Convert Requisition to PO', badge: 'To PO', action: () => onNavigate('procurement', undefined, { procTab: 'pr' }) },
                  { id: 'act-pr-convert-rfq', name: 'Convert Requisition to RFQ Tender', badge: 'To RFQ', action: () => onNavigate('procurement', undefined, { procTab: 'pr' }) },
                  { id: 'act-pr-budget-limit', name: 'Budget Allocation Verification', badge: 'Budget', action: () => onNavigate('procurement', undefined, { procTab: 'pr' }) },
                  { id: 'act-pr-status-tracker', name: 'Requisition Lifecycle Status', badge: 'Status', action: () => onNavigate('procurement', undefined, { procTab: 'pr' }) }
                ]
              }
            ]
          },

          // Sub-Portal 4: Sourcing & RFQ Tenders
          {
            id: 'sub-proc-rfq',
            name: 'Sourcing & RFQ Tenders',
            icon: ClipboardList,
            badge: 'Sourcing',
            permissionCode: 'procurement:view',
            viewTarget: 'procurement',
            extraParams: { procTab: 'rfq' },
            subSubPortals: [
              {
                id: 'ssp-proc-rfqs-bids',
                name: 'Vendor RFQs & Quotations',
                badge: 'Bids',
                icon: ClipboardList,
                actions: [
                  { id: 'act-rfq-manage-btn', name: 'Vendor RFQs & Bids Register', badge: 'RFQs', action: () => onNavigate('procurement', undefined, { procTab: 'rfq' }) },
                  { id: 'act-rfq-issue-tender', name: 'Issue Sourcing RFQ Tender', badge: 'Tender', action: () => onNavigate('procurement', undefined, { procTab: 'rfq' }) },
                  { id: 'act-rfq-compare-matrix', name: 'Bid Comparison Matrix', badge: 'Matrix', action: () => onNavigate('procurement', undefined, { procTab: 'rfq' }) },
                  { id: 'act-rfq-submissions-log', name: 'Vendor Quotation Submissions', badge: 'Quotes', action: () => onNavigate('procurement', undefined, { procTab: 'rfq' }) }
                ]
              },
              {
                id: 'ssp-proc-rfq-eval',
                name: 'Bid Evaluation & Award',
                badge: 'Award',
                icon: CheckCircle2,
                actions: [
                  { id: 'act-rfq-lowest-compliant', name: 'Lowest Compliant Bid Evaluator', badge: 'Evaluator', action: () => onNavigate('procurement', undefined, { procTab: 'rfq' }) },
                  { id: 'act-rfq-scorecards', name: 'Commercial & Technical Scorecards', badge: 'Score', action: () => onNavigate('procurement', undefined, { procTab: 'rfq' }) },
                  { id: 'act-rfq-award-draft-po', name: 'Award Tender & Draft PO', badge: 'Award', action: () => onNavigate('procurement', undefined, { procTab: 'rfq' }) }
                ]
              }
            ]
          },

          // Sub-Portal 5: Dutch & Reverse Auctions
          {
            id: 'sub-proc-auctions',
            name: 'Dutch & Reverse Auctions',
            icon: Radio,
            badge: 'Auctions',
            permissionCode: 'procurement:view',
            viewTarget: 'procurement',
            extraParams: { procTab: 'auctions' },
            subSubPortals: [
              {
                id: 'ssp-proc-auctions-live',
                name: 'Live Dynamic Auction Floor',
                badge: 'Live',
                icon: Radio,
                actions: [
                  { id: 'act-auc-live-btn', name: 'Live Dutch Auction Floor', badge: 'Live', action: () => onNavigate('procurement', undefined, { procTab: 'auctions' }) },
                  { id: 'act-auc-launch-clock', name: 'Launch Clock Dutch Auction', badge: 'Clock', action: () => onNavigate('procurement', undefined, { procTab: 'auctions' }) },
                  { id: 'act-auc-place-bid', name: 'Place Real-Time Supplier Bid', badge: 'Bid', action: () => onNavigate('procurement', undefined, { procTab: 'auctions' }) },
                  { id: 'act-auc-price-ticks', name: 'Auction Floor Price Tick Monitor', badge: 'Ticks', action: () => onNavigate('procurement', undefined, { procTab: 'auctions' }) }
                ]
              },
              {
                id: 'ssp-proc-auctions-award',
                name: 'Auction Awards & Traceability',
                badge: 'Audit',
                icon: TrendingUp,
                actions: [
                  { id: 'act-auc-close-award-btn', name: 'Close Auction & Award Winning PO', badge: 'Award PO', action: () => onNavigate('procurement', undefined, { procTab: 'auctions' }) },
                  { id: 'act-auc-savings-btn', name: 'Auction Savings Realization Report', badge: 'Savings', action: () => onNavigate('procurement', undefined, { procTab: 'auctions' }) },
                  { id: 'act-auc-bid-history', name: 'Historical Bid Traceability Log', badge: 'History', action: () => onNavigate('procurement', undefined, { procTab: 'auctions' }) }
                ]
              }
            ]
          },

          // Sub-Portal 6: Purchase Orders (PO)
          {
            id: 'sub-proc-pos',
            name: 'Purchase Orders (PO)',
            icon: ShoppingCart,
            badge: 'Orders',
            permissionCode: 'procurement:po',
            viewTarget: 'procurement',
            extraParams: { procTab: 'pos' },
            subSubPortals: [
              {
                id: 'ssp-proc-orders-po',
                name: 'Order Issuance & Authorization',
                badge: 'Issuance',
                icon: ShoppingCart,
                actions: [
                  { id: 'act-po-register-hub', name: 'Purchase Orders Register', badge: 'All POs', action: () => onNavigate('procurement', undefined, { procTab: 'pos' }) },
                  { id: 'act-po-issue-btn', name: 'Issue Formal Purchase Order', badge: 'Formal PO', action: () => onNavigate('procurement', undefined, { procTab: 'pos' }) },
                  { id: 'act-po-dual-auth', name: 'Dual Authorization Signoff (SoD)', badge: 'Signoff', action: () => onNavigate('procurement', undefined, { procTab: 'pos' }) },
                  { id: 'act-po-dispatch-vendor', name: 'Dispatch Order to Vendor', badge: 'Dispatch', action: () => onNavigate('procurement', undefined, { procTab: 'pos' }) }
                ]
              },
              {
                id: 'ssp-proc-orders-tracking',
                name: 'Order Tracking & Milestones',
                badge: 'Tracking',
                icon: Clock,
                actions: [
                  { id: 'act-po-delivery-milestones', name: 'Material Delivery Milestones', badge: 'Milestones', action: () => onNavigate('procurement', undefined, { procTab: 'pos' }) },
                  { id: 'act-po-balances-monitor', name: 'Partial Delivery & Balances', badge: 'Balances', action: () => onNavigate('procurement', undefined, { procTab: 'pos' }) },
                  { id: 'act-po-doc-pdf-view', name: 'Purchase Order PDF Document', badge: 'PDF', action: () => onNavigate('procurement', undefined, { procTab: 'pos' }) },
                  { id: 'act-po-expedited-escalation', name: 'Expedited Delivery Escalation', badge: 'Expedite', action: () => onNavigate('procurement', undefined, { procTab: 'pos' }) }
                ]
              }
            ]
          },

          // Sub-Portal 7: Framework Contracts & Price Locks
          {
            id: 'sub-proc-contracts',
            name: 'Framework Contracts & Price Locks',
            icon: FolderOpen,
            badge: 'Agreements',
            permissionCode: 'procurement:view',
            viewTarget: 'procurement',
            extraParams: { procTab: 'contracts' },
            subSubPortals: [
              {
                id: 'ssp-proc-contracts-blanket',
                name: 'Framework Agreements (BPA)',
                badge: 'BPA',
                icon: FolderOpen,
                actions: [
                  { id: 'act-contract-framework', name: 'Framework Agreements Register', badge: 'Contracts', action: () => onNavigate('procurement', undefined, { procTab: 'contracts' }) },
                  { id: 'act-contract-pricelock', name: 'Price Lock & Rate Guarantee Terms', badge: 'Price Lock', action: () => onNavigate('procurement', undefined, { procTab: 'contracts' }) },
                  { id: 'act-contract-moq-terms', name: 'Minimum Order Quantity (MOQ) Terms', badge: 'MOQ', action: () => onNavigate('procurement', undefined, { procTab: 'contracts' }) }
                ]
              },
              {
                id: 'ssp-proc-contracts-caps',
                name: 'Contract Cap & Renewals',
                badge: 'Caps',
                icon: Scale,
                actions: [
                  { id: 'act-contract-cap-spend', name: 'Cumulative Spend vs Contract Cap', badge: 'Cap Check', action: () => onNavigate('procurement', undefined, { procTab: 'contracts' }) },
                  { id: 'act-contract-renewals-alert', name: 'Contract Expiry & Renewal Alerts', badge: 'Renewals', action: () => onNavigate('procurement', undefined, { procTab: 'contracts' }) },
                  { id: 'act-contract-sla-penalties', name: 'SLA Terms & Liquidated Damages', badge: 'SLA', action: () => onNavigate('procurement', undefined, { procTab: 'contracts' }) }
                ]
              }
            ]
          },

          // Sub-Portal 8: Approved Vendor List (AVL)
          {
            id: 'sub-proc-suppliers',
            name: 'Approved Vendor List (AVL)',
            icon: Building2,
            badge: 'Suppliers',
            permissionCode: 'procurement:view',
            viewTarget: 'procurement',
            extraParams: { procTab: 'suppliers' },
            subSubPortals: [
              {
                id: 'ssp-proc-vendors-avl',
                name: 'Approved Vendor Directory',
                badge: 'Directory',
                icon: Building2,
                actions: [
                  { id: 'act-ven-directory', name: 'Approved Vendor List (AVL) Hub', badge: 'Active', action: () => onNavigate('procurement', undefined, { procTab: 'suppliers' }) },
                  { id: 'act-ven-onboarding-eval', name: 'Supplier Onboarding & Qualification', badge: 'KYV', action: () => onNavigate('procurement', undefined, { procTab: 'suppliers' }) },
                  { id: 'act-ven-compliance-vault', name: 'Trade License & Compliance Vault', badge: 'Compliance', action: () => onNavigate('procurement', undefined, { procTab: 'suppliers' }) },
                  { id: 'act-ven-category-matrix', name: 'Supply Capability Category Matrix', badge: 'Matrix', action: () => onNavigate('procurement', undefined, { procTab: 'suppliers' }) }
                ]
              },
              {
                id: 'ssp-proc-vendors-otif',
                name: 'Vendor Performance & OTIF',
                badge: 'Scorecards',
                icon: Medal,
                actions: [
                  { id: 'act-ven-scorecards', name: 'OTIF Rating & Performance Cards', badge: 'OTIF', action: () => onNavigate('procurement', undefined, { procTab: 'suppliers' }) },
                  { id: 'act-ven-defect-rates', name: 'Supplier Quality Defect Rates', badge: 'Defects', action: () => onNavigate('procurement', undefined, { procTab: 'suppliers' }) },
                  { id: 'act-ven-tier-classification', name: 'Vendor Tier Classification', badge: 'Tiers', action: () => onNavigate('procurement', undefined, { procTab: 'suppliers' }) }
                ]
              }
            ]
          },

          // Sub-Portal 9: Goods Receiving (GRN)
          {
            id: 'sub-proc-grn',
            name: 'Goods Receiving (GRN)',
            icon: Boxes,
            badge: 'Receiving',
            permissionCode: 'procurement:grn',
            viewTarget: 'procurement',
            extraParams: { procTab: 'grn' },
            subSubPortals: [
              {
                id: 'ssp-proc-grn-receiving',
                name: 'Goods Receipts & Yard Inspections',
                badge: 'Inspections',
                icon: Boxes,
                actions: [
                  { id: 'act-grn-create-btn', name: 'Create Goods Receipt (GRN)', badge: 'Receive', action: () => onNavigate('procurement', undefined, { procTab: 'grn' }) },
                  { id: 'act-grn-scan-btn', name: 'Barcode & QR Code Inspection', badge: 'Barcode', action: () => onNavigate('procurement', undefined, { procTab: 'grn' }) },
                  { id: 'act-grn-registry-hub', name: 'Goods Receipts Register', badge: 'GRNs', action: () => onNavigate('procurement', undefined, { procTab: 'grn' }) },
                  { id: 'act-grn-dn-verify', name: 'Delivery Note (DN) Verification', badge: 'DN Check', action: () => onNavigate('procurement', undefined, { procTab: 'grn' }) }
                ]
              },
              {
                id: 'ssp-proc-grn-gates',
                name: 'Quality Gate & Storage Allocation',
                badge: 'Stock In',
                icon: CheckCircle2,
                actions: [
                  { id: 'act-grn-discrepancy-check', name: 'PO vs Received Discrepancy Audit', badge: 'Audit', action: () => onNavigate('procurement', undefined, { procTab: 'grn' }) },
                  { id: 'act-grn-bay-bin-alloc', name: 'Storage Bay & Bin Location Allocation', badge: 'Bay Bin', action: () => onNavigate('procurement', undefined, { procTab: 'grn' }) },
                  { id: 'act-grn-quarantine-hold', name: 'Damaged Goods Quarantine Hold', badge: 'Quarantine', action: () => onNavigate('procurement', undefined, { procTab: 'grn' }) }
                ]
              }
            ]
          },

          // Sub-Portal 10: Subcontractor Service Notes (SCN)
          {
            id: 'sub-proc-scn',
            name: 'Subcontractor Service Notes (SCN)',
            icon: FileCheck,
            badge: 'Services',
            permissionCode: 'procurement:grn',
            viewTarget: 'procurement',
            extraParams: { procTab: 'scn' },
            subSubPortals: [
              {
                id: 'ssp-proc-scn-service',
                name: 'Subcontractor Work Signoffs',
                badge: 'Signoffs',
                icon: FileCheck,
                actions: [
                  { id: 'act-scn-create-btn', name: 'Create Subcontractor SCN', badge: 'New SCN', action: () => onNavigate('procurement', undefined, { procTab: 'scn' }) },
                  { id: 'act-scn-milestones-btn', name: 'Milestone Completion Signoffs', badge: 'Certs', action: () => onNavigate('procurement', undefined, { procTab: 'scn' }) },
                  { id: 'act-scn-tri-signature', name: 'Tri-Signature Signoff (Site/QA/PM)', badge: '3-Signs', action: () => onNavigate('procurement', undefined, { procTab: 'scn' }) }
                ]
              },
              {
                id: 'ssp-proc-scn-retention',
                name: 'Field Measurements & Retention',
                badge: 'Retention',
                icon: Scale,
                actions: [
                  { id: 'act-scn-measure-verify', name: 'Field Quantity Measurement Verification', badge: 'Verified', action: () => onNavigate('procurement', undefined, { procTab: 'scn' }) },
                  { id: 'act-scn-retention-release', name: 'Retention Deduction & Release Tracker', badge: 'Retention', action: () => onNavigate('procurement', undefined, { procTab: 'scn' }) },
                  { id: 'act-scn-progress-billing', name: 'SCN Progress Billing Signoff', badge: 'Billing', action: () => onNavigate('procurement', undefined, { procTab: 'scn' }) }
                ]
              }
            ]
          },

          // Sub-Portal 11: Warehouse Inventory & Stock
          {
            id: 'sub-proc-inventory',
            name: 'Warehouse Inventory & Stock',
            icon: Layers,
            badge: 'Stock',
            permissionCode: 'procurement:view',
            viewTarget: 'procurement',
            extraParams: { procTab: 'inventory' },
            subSubPortals: [
              {
                id: 'ssp-proc-inventory-wh',
                name: 'Stock Levels & Balances',
                badge: 'Levels',
                icon: Layers,
                actions: [
                  { id: 'act-inv-stock-btn', name: 'Warehouse Stock Register', badge: 'Levels', action: () => onNavigate('procurement', undefined, { procTab: 'inventory' }) },
                  { id: 'act-inv-reorder-btn', name: 'Reorder Level & Safety Stock Alerts', badge: 'Alerts', action: () => onNavigate('procurement', undefined, { procTab: 'inventory' }) },
                  { id: 'act-inv-movements-log', name: 'Stock In / Out Movement Ledger', badge: 'Ledger', action: () => onNavigate('procurement', undefined, { procTab: 'inventory' }) }
                ]
              },
              {
                id: 'ssp-proc-inventory-alloc',
                name: 'Project Allocations & Transfers',
                badge: 'Allocations',
                icon: Truck,
                actions: [
                  { id: 'act-inv-project-reservation', name: 'Project Material Reservation', badge: 'Reserved', action: () => onNavigate('procurement', undefined, { procTab: 'inventory' }) },
                  { id: 'act-inv-transfer-note', name: 'Inter-Site Material Transfer Note', badge: 'Transfer', action: () => onNavigate('procurement', undefined, { procTab: 'inventory' }) },
                  { id: 'act-inv-fifo-valuation', name: 'Stock Valuation & FIFO Cost Audit', badge: 'Valuation', action: () => onNavigate('procurement', undefined, { procTab: 'inventory' }) }
                ]
              }
            ]
          },

          // Sub-Portal 12: Scrap & Circular Recovery
          {
            id: 'sub-proc-scrap',
            name: 'Scrap & Circular Recovery',
            icon: Scale,
            badge: 'Recovery',
            permissionCode: 'procurement:view',
            viewTarget: 'procurement',
            extraParams: { procTab: 'scrap' },
            subSubPortals: [
              {
                id: 'ssp-proc-scrap-reclaim',
                name: 'Scrap Declarations & Intercept',
                badge: 'Intercept',
                icon: Scale,
                actions: [
                  { id: 'act-scrap-log-btn', name: 'Scrap & Recovery Register', badge: 'Scrap', action: () => onNavigate('procurement', undefined, { procTab: 'scrap' }) },
                  { id: 'act-scrap-declare-lot', name: 'Declare Scrap Material Cut-Offs', badge: 'Declare', action: () => onNavigate('procurement', undefined, { procTab: 'scrap' }) },
                  { id: 'act-scrap-intercept-window', name: '7-Day Internal Intercept Window', badge: '7-Day Hold', action: () => onNavigate('procurement', undefined, { procTab: 'scrap' }) }
                ]
              },
              {
                id: 'ssp-proc-scrap-circular',
                name: 'Project Redirection & Reuse',
                badge: 'Reuse',
                icon: RefreshCw,
                actions: [
                  { id: 'act-scrap-redirect-btn', name: 'Project Redirection & Site Reuse', badge: 'Reuse', action: () => onNavigate('procurement', undefined, { procTab: 'scrap' }) },
                  { id: 'act-scrap-weighbridge-log', name: 'Salvage Weighbridge Register', badge: 'Weight', action: () => onNavigate('procurement', undefined, { procTab: 'scrap' }) },
                  { id: 'act-scrap-recovery-value', name: 'Circular Recovery Value Tracker', badge: 'Value', action: () => onNavigate('procurement', undefined, { procTab: 'scrap' }) }
                ]
              }
            ]
          },

          // Sub-Portal 13: 3-Way Match & Invoicing
          {
            id: 'sub-proc-invoices',
            name: '3-Way Match & Invoicing',
            icon: CreditCard,
            badge: 'Matching',
            permissionCode: 'procurement:view',
            viewTarget: 'procurement',
            extraParams: { procTab: 'invoices' },
            subSubPortals: [
              {
                id: 'ssp-proc-gov-3way',
                name: '3-Way Match Verification',
                badge: 'Match',
                icon: CreditCard,
                actions: [
                  { id: 'act-3way-match-btn', name: '3-Way Invoice Match Register', badge: 'Match', action: () => onNavigate('procurement', undefined, { procTab: 'invoices' }) },
                  { id: 'act-3way-tolerance-check', name: 'PO-GRN-Invoice Tolerance Check', badge: 'Tolerance', action: () => onNavigate('procurement', undefined, { procTab: 'invoices' }) },
                  { id: 'act-3way-pvc-btn', name: 'PVC Price Variance Authorization', badge: 'PVC', action: () => onNavigate('procurement', undefined, { procTab: 'invoices' }) }
                ]
              },
              {
                id: 'ssp-proc-invoices-ap',
                name: 'Payment Approvals & Cost Sync',
                badge: 'Approvals',
                icon: CheckCircle2,
                actions: [
                  { id: 'act-3way-approve-invoice', name: 'Approve Verified Supplier Invoice', badge: 'Approve', action: () => onNavigate('procurement', undefined, { procTab: 'invoices' }) },
                  { id: 'act-3way-cost-sync', name: 'Sync with Actual Cost Ledger', badge: 'Sync Cost', action: () => onNavigate('procurement', undefined, { procTab: 'invoices' }) },
                  { id: 'act-3way-ap-release', name: 'Accounts Payable Payment Release', badge: 'AP Release', action: () => onNavigate('procurement', undefined, { procTab: 'invoices' }) }
                ]
              }
            ]
          },

          // Sub-Portal 14: Quality NCR Holds & Intercept
          {
            id: 'sub-proc-ncrs',
            name: 'Quality NCR Holds & Intercept',
            icon: ShieldAlert,
            badge: 'Holds',
            permissionCode: 'procurement:view',
            viewTarget: 'procurement',
            extraParams: { procTab: 'ncrs' },
            subSubPortals: [
              {
                id: 'ssp-proc-gov-holds',
                name: 'Defect Logging & Payment Holds',
                badge: 'Holds',
                icon: ShieldAlert,
                actions: [
                  { id: 'act-ncr-hold-btn', name: 'Quality NCR Registry & Holds', badge: 'Holds', action: () => onNavigate('procurement', undefined, { procTab: 'ncrs' }) },
                  { id: 'act-ncr-issue-defect', name: 'Issue Material Non-Conformance', badge: 'Issue NCR', action: () => onNavigate('procurement', undefined, { procTab: 'ncrs' }) },
                  { id: 'act-debit-intercept-btn', name: 'Debit Intercept Note to AP', badge: 'Debit', action: () => onNavigate('procurement', undefined, { procTab: 'ncrs' }) }
                ]
              },
              {
                id: 'ssp-proc-ncrs-capa',
                name: 'CAPA & Supplier Clearance',
                badge: 'CAPA',
                icon: ShieldCheck,
                actions: [
                  { id: 'act-ncr-capa-resolution', name: '5-Why CAPA Resolution & Verification', badge: 'CAPA', action: () => onNavigate('procurement', undefined, { procTab: 'ncrs' }) },
                  { id: 'act-ncr-debit-generation', name: 'Debit Note Generation for Rejections', badge: 'Debit Note', action: () => onNavigate('procurement', undefined, { procTab: 'ncrs' }) },
                  { id: 'act-ncr-supplier-clearance', name: 'Supplier Quality Sanctions Clearance', badge: 'Clearance', action: () => onNavigate('procurement', undefined, { procTab: 'ncrs' }) }
                ]
              }
            ]
          },

          // Sub-Portal 15: Emergency Fast-Track Procurement
          {
            id: 'sub-proc-emergency',
            name: 'Emergency Fast-Track Procurement',
            icon: HardHat,
            badge: 'Fast-Track',
            permissionCode: 'procurement:view',
            viewTarget: 'procurement',
            extraParams: { procTab: 'emergency' },
            subSubPortals: [
              {
                id: 'ssp-proc-emergency-dispatch',
                name: 'Emergency Orders & Work Orders',
                badge: 'Fast-Track',
                icon: HardHat,
                actions: [
                  { id: 'act-emg-fasttrack', name: 'Fast-Track Emergency PO Entry', badge: 'Urgent', action: () => onNavigate('procurement', undefined, { procTab: 'emergency' }) },
                  { id: 'act-emg-safety-critical', name: 'HSE Safety-Critical Dispatch', badge: 'Safety', action: () => onNavigate('procurement', undefined, { procTab: 'emergency' }) },
                  { id: 'act-emg-work-auth', name: 'Emergency Work Order Authorization', badge: 'Work Order', action: () => onNavigate('procurement', undefined, { procTab: 'emergency' }) }
                ]
              },
              {
                id: 'ssp-proc-emergency-audit',
                name: 'Retroactive Audits & Compliance',
                badge: 'Audits',
                icon: ShieldCheck,
                actions: [
                  { id: 'act-emg-audit', name: 'Mandatory Retroactive Audits Queue', badge: 'Audits', action: () => onNavigate('procurement', undefined, { procTab: 'emergency' }) },
                  { id: 'act-emg-exception-review', name: 'Safety Justification Review', badge: 'Review', action: () => onNavigate('procurement', undefined, { procTab: 'emergency' }) },
                  { id: 'act-emg-variance-reconcile', name: 'Emergency Cost Variance Reconcile', badge: 'Reconcile', action: () => onNavigate('procurement', undefined, { procTab: 'emergency' }) }
                ]
              }
            ]
          },

          // Sub-Portal 16: Spend Intelligence & Analytics
          {
            id: 'sub-proc-analytics',
            name: 'Spend Intelligence & Analytics',
            icon: TrendingUp,
            badge: 'Analytics',
            permissionCode: 'procurement:view',
            viewTarget: 'procurement',
            extraParams: { procTab: 'analytics' },
            subSubPortals: [
              {
                id: 'ssp-proc-gov-spend',
                name: 'Spend Intelligence & Pareto',
                badge: 'Analytics',
                icon: BarChart3,
                actions: [
                  { id: 'act-spend-analytics-btn', name: 'Spend Intelligence Dashboard', badge: 'Spend', action: () => onNavigate('procurement', undefined, { procTab: 'analytics' }) },
                  { id: 'act-spend-pareto-analysis', name: 'Category Pareto (80/20) Spend', badge: 'Pareto', action: () => onNavigate('procurement', undefined, { procTab: 'analytics' }) },
                  { id: 'act-spend-inflation-index', name: 'Material Cost Inflation Index', badge: 'Inflation', action: () => onNavigate('procurement', undefined, { procTab: 'analytics' }) }
                ]
              },
              {
                id: 'ssp-proc-analytics-risk',
                name: 'Supply Chain Risk & HHI',
                badge: 'HHI',
                icon: TrendingUp,
                actions: [
                  { id: 'act-hhi-index-btn', name: 'HHI Supplier Concentration Index', badge: 'HHI', action: () => onNavigate('procurement', undefined, { procTab: 'analytics' }) },
                  { id: 'act-single-source-matrix', name: 'Single-Source Vulnerability Matrix', badge: 'Risk', action: () => onNavigate('procurement', undefined, { procTab: 'analytics' }) },
                  { id: 'act-savings-avoidance-report', name: 'Procurement Cost Avoidance Report', badge: 'Savings', action: () => onNavigate('procurement', undefined, { procTab: 'analytics' }) }
                ]
              }
            ]
          }
        ]
      },

      // 8. FINANCE PORTAL
      {
        id: 'nav-finance',
        name: 'Finance',
        shortLabel: 'Finance',
        icon: Landmark,
        badge: 'Accounts',
        permissionDomain: 'finance',
        subPortals: [
          {
            id: 'sub-fin-accounting',
            name: 'Accounting & Ledgers',
            icon: Landmark,
            badge: 'Ledgers',
            permissionCode: 'accounting:view',
            viewTarget: 'accounting',
            subTabTarget: 'ledgers',
            subSubPortals: [
              {
                id: 'ssp-fin-gl',
                name: 'General Ledger',
                badge: 'COA',
                icon: Landmark,
                actions: [
                  { id: 'act-fin-overview-btn', name: 'Accounting Overview', badge: 'Overview', action: () => onNavigate('accounting', 'overview') },
                  { id: 'act-fin-coa-btn', name: 'Chart of Accounts (COA)', badge: 'COA', action: () => onNavigate('accounting', 'ledgers') },
                  { id: 'act-fin-journals-btn', name: 'Journal Entries', badge: 'Journals', action: () => onNavigate('accounting', 'ledgers') }
                ]
              },
              {
                id: 'ssp-fin-payments',
                name: 'Customer Receipts',
                badge: 'Payments',
                icon: DollarSign,
                actions: [
                  { id: 'act-fin-receipt-btn', name: 'Record Customer Payment', badge: 'Receipt', action: () => onNavigate('accounting', 'payments') },
                  { id: 'act-fin-bank-btn', name: 'Bank Reconciliation', badge: 'Bank', action: () => onNavigate('accounting', 'payments') }
                ]
              },
              {
                id: 'ssp-fin-costs',
                name: 'Job Cost Adjustments',
                badge: 'Costs',
                icon: Scale,
                actions: [
                  { id: 'act-cost-actuals-btn', name: 'Actual Cost Records', badge: 'Actuals', action: () => onNavigate('accounting', 'adjustments') },
                  { id: 'act-cost-variance-btn', name: 'Project Margin Health', badge: 'Margin', action: () => onNavigate('accounting', 'overview') }
                ]
              }
            ]
          },
          {
            id: 'sub-fin-reports',
            name: 'Financial Reports',
            icon: FileSpreadsheet,
            badge: 'Reports',
            permissionCode: 'reporting:view',
            viewTarget: 'reporting',
            subTabTarget: 'Statement',
            subSubPortals: [
              {
                id: 'ssp-rep-statements',
                name: 'Statements & Aging',
                badge: 'AR',
                icon: FileSpreadsheet,
                actions: [
                  { id: 'act-rep-stmt-btn', name: 'Customer Statement', badge: 'SOA', action: () => onNavigate('reporting', 'Statement') },
                  { id: 'act-rep-aging-btn', name: 'AR Aging (30-90 Days)', badge: 'Aging', action: () => onNavigate('reporting', 'Aging') },
                  { id: 'act-rep-collect-btn', name: 'Collection Efficiency', badge: 'Cash', action: () => onNavigate('reporting', 'Collection') }
                ]
              },
              {
                id: 'ssp-rep-retentions',
                name: 'Retention & Bad Debt',
                badge: 'Claims',
                icon: Scale,
                actions: [
                  { id: 'act-rep-ret-btn', name: 'Retention Money Held', badge: 'Defects', action: () => onNavigate('reporting', 'Retention') },
                  { id: 'act-rep-baddebt-btn', name: 'Bad Debt Provisions', badge: 'Provisions', action: () => onNavigate('reporting', 'BadDebt') },
                  { id: 'act-rep-proj-btn', name: 'Project Cost Variance', badge: 'Job Costs', action: () => onNavigate('reporting', 'Project') }
                ]
              }
            ]
          },
          {
            id: 'sub-fin-payroll-wps',
            name: 'Payroll & WPS Center',
            icon: DollarSign,
            badge: 'Payroll',
            permissionCode: 'hr:payroll',
            viewTarget: 'payroll',
            subSubPortals: [
              {
                id: 'ssp-pay-runs',
                name: 'Payroll Processing',
                badge: 'Salary',
                icon: DollarSign,
                actions: [
                  { id: 'act-pay-batch-btn', name: 'Run Monthly Payroll', badge: 'Batch', action: () => onNavigate('payroll') },
                  { id: 'act-pay-wps-btn', name: 'WPS Bank Transfer File', badge: 'WPS', action: () => onNavigate('payroll') },
                  { id: 'act-pay-stubs-btn', name: 'Generate Paystubs PDF', badge: 'PDF', action: () => onNavigate('payroll') }
                ]
              },
              {
                id: 'ssp-pay-statutory',
                name: 'Statutory Filings',
                badge: 'Taxes',
                icon: Scale,
                actions: [
                  { id: 'act-pay-epf-btn', name: 'EPF / ETF Filings', badge: 'EPF', action: () => onNavigate('payroll') },
                  { id: 'act-pay-advances-btn', name: 'Salary Advances', badge: 'Loans', action: () => onNavigate('payroll') }
                ]
              }
            ]
          }
        ]
      },

      // 9. OPERATIONS PORTAL
      {
        id: 'nav-operations',
        name: 'Operations',
        shortLabel: 'Operations',
        icon: Users,
        badge: 'Plant & Site',
        permissionDomain: 'operations',
        subPortals: [
          {
            id: 'sub-ops-hr',
            name: 'Human Capital (HR)',
            icon: Users,
            badge: 'Staff',
            permissionCode: 'hr:personnel',
            viewTarget: 'operational-control',
            extraParams: { portal: 'hr', hrSub: 'admin' },
            subSubPortals: [
              {
                id: 'ssp-hr-workforce',
                name: 'Workforce & Directory',
                badge: 'Staff',
                icon: UserCheck,
                actions: [
                  { id: 'act-hr-exec-overview', name: 'Executive HR Overview', badge: 'Overview', action: () => { hrService.setActiveSubPortal('executive'); onNavigate('operational-control', undefined, { portal: 'hr' }); } },
                  { id: 'act-hr-emp-dir', name: 'Employee Directory', badge: 'Staff', action: () => { hrService.setActiveSubPortal('admin'); onNavigate('operational-control', undefined, { portal: 'hr' }); } },
                  { id: 'act-hr-ess', name: 'Self-Service (ESS)', badge: 'ESS', action: () => { hrService.setActiveSubPortal('ess'); onNavigate('operational-control', undefined, { portal: 'hr' }); } },
                  { id: 'act-hr-mss', name: 'Manager Portal (MSS)', badge: 'MSS', action: () => { hrService.setActiveSubPortal('mss'); onNavigate('operational-control', undefined, { portal: 'hr' }); } }
                ]
              },
              {
                id: 'ssp-hr-attendance',
                name: 'Time & Attendance',
                badge: 'Clock',
                icon: Clock,
                actions: [
                  { id: 'act-hr-punch-clock', name: 'Punch Terminal', badge: 'Clock In', action: () => { hrService.setActiveSubPortal('attendance'); onNavigate('operational-control', undefined, { portal: 'hr' }); } },
                  { id: 'act-hr-timesheet-appr', name: 'Timesheet Approvals', badge: 'Hours', action: () => { hrService.setActiveSubPortal('attendance'); onNavigate('operational-control', undefined, { portal: 'hr' }); } }
                ]
              },
              {
                id: 'ssp-hr-performance-lms',
                name: 'Talent & Development',
                badge: 'Talent',
                icon: GraduationCap,
                actions: [
                  { id: 'act-hr-recruitment-ats', name: 'Recruitment (ATS)', badge: 'Hiring', action: () => { hrService.setActiveSubPortal('recruitment'); onNavigate('operational-control', undefined, { portal: 'hr' }); } },
                  { id: 'act-hr-perf-cycles', name: 'Performance Cycles', badge: 'KPIs', action: () => { hrService.setActiveSubPortal('performance'); onNavigate('operational-control', undefined, { portal: 'hr' }); } },
                  { id: 'act-hr-skills-lms', name: 'Skills & LMS Academy', badge: 'LMS', action: () => { hrService.setActiveSubPortal('learning'); onNavigate('operational-control', undefined, { portal: 'hr' }); } }
                ]
              },
              {
                id: 'ssp-hr-relations-vault',
                name: 'Relations & Vault',
                badge: 'Relations',
                icon: HeartHandshake,
                actions: [
                  { id: 'act-hr-cases-log', name: 'Relations & Cases Log', badge: 'Discipline', action: () => { hrService.setActiveSubPortal('relations'); onNavigate('operational-control', undefined, { portal: 'hr' }); } },
                  { id: 'act-hr-compliance-vault', name: 'Compliance Vault', badge: 'Docs', action: () => { hrService.setActiveSubPortal('documents'); onNavigate('operational-control', undefined, { portal: 'hr' }); } },
                  { id: 'act-hr-analytics-view', name: 'Workforce Planning & HR Analytics', badge: 'Analytics', action: () => { hrService.setActiveSubPortal('analytics'); onNavigate('operational-control', undefined, { portal: 'hr' }); } }
                ]
              }
            ]
          },
          {
            id: 'sub-ops-clients',
            name: 'Clients & CRM',
            icon: Building2,
            badge: 'CRM',
            permissionCode: 'clients:view',
            viewTarget: 'clients',
            subSubPortals: [
              {
                id: 'ssp-ops-client-crm',
                name: 'Client Directory',
                badge: 'CRM',
                icon: Users,
                actions: [
                  { id: 'act-client-dir-btn', name: 'Client Directory', badge: 'List', action: () => onNavigate('clients') },
                  { id: 'act-client-portal-btn', name: 'Customer Portal View', badge: 'External', action: () => onNavigate('customer-portal') }
                ]
              }
            ]
          },
          {
            id: 'sub-ops-workforce-field',
            name: 'Workforce & Timesheets',
            icon: Users,
            badge: 'Field',
            permissionCode: 'operations:view',
            viewTarget: 'resource-management',
            subTabTarget: 'personnel',
            subSubPortals: [
              {
                id: 'ssp-field-deployment',
                name: 'Field Crew Deployment',
                badge: 'Crews',
                icon: HardHat,
                actions: [
                  { id: 'act-res-personnel', name: 'Personnel Register', badge: 'Staff', action: () => onNavigate('resource-management', 'personnel') },
                  { id: 'act-res-timesheets', name: 'Weekly Timesheets', badge: 'Hours', action: () => onNavigate('resource-management', 'timesheets') },
                  { id: 'act-res-deployment', name: 'Site Deployment', badge: 'Crews', action: () => onNavigate('resource-management', 'deployment') },
                  { id: 'act-res-certs', name: 'Certifications Register', badge: 'Pass', action: () => onNavigate('resource-management', 'certifications') }
                ]
              }
            ]
          },
          {
            id: 'sub-ops-equipment-fleet',
            name: 'Equipment Fleet',
            icon: Wrench,
            badge: 'Fleet',
            permissionCode: 'equipment:view',
            viewTarget: 'equipment-management',
            subTabTarget: 'inventory',
            subSubPortals: [
              {
                id: 'ssp-fleet-inventory',
                name: 'Machinery Inventory',
                badge: 'Fleet',
                icon: Wrench,
                actions: [
                  { id: 'act-eq-inventory', name: 'Equipment Register', badge: 'Assets', action: () => onNavigate('equipment-management', 'inventory') },
                  { id: 'act-eq-maintenance', name: 'Maintenance Log', badge: 'PM', action: () => onNavigate('equipment-management', 'maintenance') },
                  { id: 'act-eq-inspections', name: 'Pre-Start Inspections', badge: 'Check', action: () => onNavigate('equipment-management', 'inspections') }
                ]
              }
            ]
          },
          {
            id: 'sub-ops-site-safety',
            name: 'Safety & Site Management',
            icon: HardHat,
            badge: 'Site',
            permissionCode: 'operations:view',
            viewTarget: 'site-management',
            subTabTarget: 'permits',
            subSubPortals: [
              {
                id: 'ssp-site-permits-hse',
                name: 'Permits & HSE',
                badge: 'HSE',
                icon: HardHat,
                actions: [
                  { id: 'act-site-permits-btn', name: 'Work Permits', badge: 'Permits', action: () => onNavigate('site-management', 'permits') },
                  { id: 'act-site-hse-btn', name: 'HSE Safety Audits', badge: 'HSE', action: () => onNavigate('site-management', 'hse') },
                  { id: 'act-site-incidents-btn', name: 'Incident Logs', badge: 'Incidents', action: () => onNavigate('site-management', 'incidents') },
                  { id: 'act-site-contacts-btn', name: 'Emergency Contacts', badge: 'Contacts', action: () => onNavigate('site-management', 'contacts') }
                ]
              }
            ]
          },
          {
            id: 'sub-ops-quality-control',
            name: 'Quality Assurance (QA/QC)',
            icon: ShieldCheck,
            badge: 'QC',
            permissionCode: 'qc:view',
            viewTarget: 'quality-control',
            subTabTarget: 'inspections',
            subSubPortals: [
              {
                id: 'ssp-qc-itp-ncr',
                name: 'ITP & NCR Logs',
                badge: 'QC',
                icon: ShieldCheck,
                actions: [
                  { id: 'act-qc-inspect-btn', name: 'ITP Inspections', badge: 'Test', action: () => onNavigate('quality-control', 'inspections') },
                  { id: 'act-qc-ncrs-btn', name: 'Active NCRs', badge: 'NCR', action: () => onNavigate('quality-control', 'ncrs') },
                  { id: 'act-qc-standards-btn', name: 'Material Standards', badge: 'MTC', action: () => onNavigate('quality-control', 'standards') }
                ]
              }
            ]
          },
          {
            id: 'sub-ops-aftersales-warranty',
            name: 'After Sales & Warranty',
            icon: Medal,
            badge: 'Warranty',
            permissionCode: 'quality:view',
            viewTarget: 'after-sales',
            subTabTarget: 'requests',
            subSubPortals: [
              {
                id: 'ssp-warranty-certs-service',
                name: 'Certificates & Requests',
                badge: 'Warranty',
                icon: Medal,
                actions: [
                  { id: 'act-warr-requests-btn', name: 'Service Requests', badge: 'Tickets', action: () => onNavigate('after-sales', 'requests') },
                  { id: 'act-warr-certs-btn', name: 'Warranty Certificates', badge: 'Cert', action: () => onNavigate('after-sales', 'certificates') },
                  { id: 'act-warr-history-btn', name: 'Maintenance History', badge: 'Log', action: () => onNavigate('after-sales', 'history') }
                ]
              }
            ]
          }
        ]
      },

      // 10. SYSTEM PORTAL
      {
        id: 'nav-system',
        name: 'System',
        shortLabel: 'System',
        icon: ShieldCheck,
        badge: 'Security',
        permissionDomain: 'system',
        subPortals: [
          {
            id: 'sub-sys-trust',
            name: 'Trust & Verification',
            icon: ShieldCheck,
            badge: 'Verification',
            permissionCode: 'system:view',
            viewTarget: 'verification',
            subSubPortals: [
              {
                id: 'ssp-sys-verify',
                name: 'Document QR Verification',
                badge: 'QR',
                icon: ShieldCheck,
                actions: [
                  { id: 'act-verify-qr-btn', name: 'Document Verification', badge: 'QR Hash', action: () => onNavigate('verification') },
                  { id: 'act-verify-tunnel-btn', name: 'Stealth Audit Tunnel', badge: 'Tunnel', action: () => onNavigate('stealth-tunnel') }
                ]
              }
            ]
          },
          {
            id: 'sub-sys-governance',
            name: 'Security & Access Control',
            icon: Settings,
            badge: 'RBAC',
            permissionCode: 'settings:manage',
            viewTarget: 'settings',
            subTabTarget: 'access-control',
            subSubPortals: [
              {
                id: 'ssp-sys-rbac-admin',
                name: 'Access Control (RBAC)',
                badge: 'Roles',
                icon: ShieldCheck,
                actions: [
                  { id: 'act-rbac-users-btn', name: 'User Management', badge: 'Users', action: () => onNavigate('settings', 'access-control') },
                  { id: 'act-rbac-matrix-btn', name: 'Permission Matrix', badge: 'Matrix', action: () => onNavigate('settings', 'access-control') },
                  { id: 'act-sys-audit-log-btn', name: 'System Audit Trail', badge: 'Audit', action: () => onNavigate('audit-log') }
                ]
              }
            ]
          },
          {
            id: 'sub-sys-config',
            name: 'Settings & Data Management',
            icon: Settings,
            badge: 'Data',
            permissionCode: 'settings:manage',
            viewTarget: 'settings',
            subTabTarget: 'general',
            subSubPortals: [
              {
                id: 'ssp-sys-company-data',
                name: 'Company & Data',
                badge: 'Setup',
                icon: Settings,
                actions: [
                  { id: 'act-sys-company-btn', name: 'Company Settings', badge: 'Profile', action: () => onNavigate('settings', 'general') },
                  { id: 'act-sys-branding-btn', name: 'Branding & Templates', badge: 'Logo', action: () => onNavigate('settings', 'branding') },
                  { id: 'act-sys-import-btn', name: 'Universal Data Import', badge: 'Import', action: onImportModal },
                  { id: 'act-sys-snapshot-btn', name: 'Full System Snapshot', badge: 'PDF', action: onExportSnapshot }
                ]
              }
            ]
          }
        ]
      }
    ];
  }, [onNavigate, onNewQuote, onImportModal, onExportSnapshot]);

  // Strict Central Portal & Action RBAC Evaluation for Universal Portal Directory
  const evaluateSubPortalEligibility = (sub: SystemSubPortal): boolean => {
    if (isAdmin) return true;
    if (!activeUser) return false;

    const vt = sub.viewTarget;
    const portalParam = sub.extraParams?.portal;
    const procTab = sub.extraParams?.procTab;
    const hrSub = sub.extraParams?.hrSub;

    if (vt === 'dashboard') {
      if (activeUser.isExternalUser) return false;
      if (sub.id === 'sub-dash-pricing') {
        return (
          (canPortal('reporting-analytics') && hasPermission('reports.view')) ||
          (canPortal('engineering-qs-boq') && hasPermission('boq.edit'))
        );
      }
      return (
        ((canPortal('executive-dashboard') || canPortal('reporting-analytics')) && hasPermission('reports.view')) ||
        (!activeUser.isExternalUser &&
          (hasPermission('project.view') || hasPermission('finance.view') || hasPermission('quotes.view')))
      );
    }

    if (vt === 'operational-control') {
      if (portalParam === 'hr') {
        if (!canPortal('human-resources') || !hasPermission('hr.view')) return false;
        if (hrSub === 'payroll' && !hasPermission('payroll.view')) return false;
        return true;
      }
      switch (portalParam) {
        case 'factories':
          return canPortal('factory-workshop-management') && hasPermission('factory.view');
        case 'work_packages':
        case 'dashboard':
          return (
            (canPortal('factory-workshop-management') && hasPermission('factory.view')) ||
            (canPortal('production-control') && hasPermission('production.view'))
          );
        case 'tasks_planning':
        case 'worksheets_daily':
          return (
            (canPortal('production-control') && hasPermission('production.view')) ||
            (canPortal('factory-workshop-management') && hasPermission('factory.view'))
          );
        case 'resources_materials':
          return (
            (canPortal('equipment-machinery') && hasPermission('equipment.view')) ||
            (canPortal('inventory-warehouse') && hasPermission('inventory.view')) ||
            (canPortal('factory-workshop-management') && hasPermission('factory.manage'))
          );
        case 'quality_hse':
          return (
            (canPortal('quality-assurance') && hasPermission('qc.view')) ||
            (canPortal('hse-safety') && hasPermission('hse.view'))
          );
        case 'dispatch_site':
          return (
            (canPortal('logistics-dispatch') && hasPermission('logistics.view')) ||
            (canPortal('factory-workshop-management') && hasPermission('factory.manage'))
          );
        case 'documents_drawings':
          return canPortal('document-control') && hasPermission('document.view');
        case 'analytics_audit':
          return canPortal('reporting-analytics') && hasPermission('reports.view');
        case 'partner_portal':
          return (
            (canPortal('partner-factory-portal') && hasPermission('subcontractor.view')) ||
            (canPortal('factory-workshop-management') && hasPermission('factory.manage'))
          );
        default:
          return (
            (canPortal('factory-workshop-management') && hasPermission('factory.view')) ||
            (canPortal('production-control') && hasPermission('production.view'))
          );
      }
    }

    if (vt === 'history' || vt === 'editor') {
      if (!canPortal('sales-crm-quotes') || !hasPermission('quotes.view')) return false;
      if (vt === 'editor') {
        return hasPermission('quotes.create') || hasPermission('quotes.edit') || hasPermission('quotes.view');
      }
      return true;
    }

    if (vt === 'boq-items') {
      return canPortal('engineering-qs-boq') && hasPermission('boq.view');
    }

    if (vt === 'invoices' || vt === 'accounting') {
      return canPortal('accounting-finance') && hasPermission('finance.view');
    }

    if (vt === 'reporting') {
      return canPortal('reporting-analytics') && hasPermission('reports.view');
    }

    if (vt === 'payroll') {
      return canPortal('human-resources') && hasPermission('payroll.view');
    }

    if (vt === 'projects' || vt === 'project-lifecycle') {
      return canPortal('project-management') && hasPermission('project.view');
    }

    if (vt === 'variation-manager') {
      return (canPortal('project-management') || canPortal('engineering-qs-boq')) && hasPermission('variation.view');
    }

    if (vt === 'post-evaluation') {
      return (
        (canPortal('project-management') || canPortal('engineering-qs-boq') || canPortal('accounting-finance')) &&
        (hasPermission('project.approve') || hasPermission('boq.view') || hasPermission('finance.view'))
      );
    }

    if (vt === 'procurement' || vt === 'procurement-costs') {
      if (procTab === 'grn' || procTab === 'inventory' || procTab === 'scrap') {
        return (
          (canPortal('inventory-warehouse') && hasPermission('inventory.view')) ||
          (canPortal('procurement-supply-chain') && hasPermission('procurement.view'))
        );
      }
      if (procTab === 'scn') {
        return (
          (canPortal('partner-factory-portal') && hasPermission('subcontractor.view')) ||
          (canPortal('procurement-supply-chain') && hasPermission('procurement.view'))
        );
      }
      if (procTab === 'suppliers' || procTab === 'rfq' || procTab === 'pos' || procTab === 'contracts' || procTab === 'invoices') {
        return (
          (canPortal('supplier-portal') && hasPermission('supplier.view')) ||
          (canPortal('procurement-supply-chain') && hasPermission('procurement.view'))
        );
      }
      if (procTab === 'ncrs') {
        return (
          (canPortal('quality-assurance') && hasPermission('qc.view')) ||
          (canPortal('procurement-supply-chain') && hasPermission('procurement.view'))
        );
      }
      return canPortal('procurement-supply-chain') && hasPermission('procurement.view');
    }

    if (vt === 'clients') {
      return canPortal('sales-crm-quotes') && hasPermission('clients.view');
    }

    if (vt === 'portal-view' || vt === 'customer-portal') {
      return canPortal('customer-portal') && hasPermission('clients.view');
    }

    if (vt === 'resource-management') {
      return canPortal('human-resources') && hasPermission('hr.view');
    }

    if (vt === 'equipment-management') {
      return canPortal('equipment-machinery') && hasPermission('equipment.view');
    }

    if (vt === 'site-management') {
      return (
        (canPortal('construction-site-management') && hasPermission('site.view')) ||
        (canPortal('hse-safety') && hasPermission('hse.view'))
      );
    }

    if (vt === 'quality-control') {
      return canPortal('quality-assurance') && hasPermission('qc.view');
    }

    if (vt === 'after-sales' || vt === 'warranty') {
      return (
        (canPortal('quality-assurance') && hasPermission('qc.view')) ||
        (canPortal('customer-portal') && hasPermission('clients.view'))
      );
    }

    if (vt === 'verification') {
      return (
        (canPortal('document-control') && hasPermission('document.view')) ||
        (canPortal('system-administration') && hasPermission('security.admin'))
      );
    }

    if (vt === 'stealth-tunnel') {
      return canPortal('system-administration') && hasPermission('security.admin');
    }

    if (vt === 'audit-log') {
      return canPortal('system-administration') && (hasPermission('security.audit') || hasPermission('security.admin'));
    }

    if (vt === 'settings') {
      return (
        canPortal('system-administration') &&
        (hasPermission('security.admin') || hasPermission('security.configure') || hasPermission('settings.manage'))
      );
    }

    if (sub.permissionCode) {
      return hasPermission(sub.permissionCode);
    }

    return false;
  };

  const canAccessAction = (act: SystemAction, sub?: SystemSubPortal) => {
    if (isAdmin) return true;
    if (act.permissionCode && !hasPermission(act.permissionCode)) return false;

    const labelLower = `${act.name} ${act.badge || ''}`.toLowerCase();
    const vt = sub?.viewTarget || '';

    // Import actions require System Administration & settings.manage
    if (labelLower.includes('import')) {
      return canPortal('system-administration') && hasPermission('settings.manage');
    }

    // Export / Snapshot actions require export permissions
    if (labelLower.includes('export') || labelLower.includes('snapshot') || labelLower.includes('download zip')) {
      return hasPermission('reports.export') || hasPermission('quotes.export') || hasPermission('document.download');
    }

    // Approval / Sign-off actions require domain approve permission
    if (labelLower.includes('approve') || labelLower.includes('sign-off') || labelLower.includes('authorization')) {
      if (vt === 'history' || vt === 'editor') return hasPermission('quotes.approve');
      if (vt === 'boq-items') return hasPermission('boq.approve');
      if (vt === 'projects' || vt === 'project-lifecycle') return hasPermission('project.approve');
      if (vt === 'variation-manager') return hasPermission('variation.approve');
      if (vt === 'invoices' || vt === 'accounting') return hasPermission('finance.approve');
      if (vt === 'procurement') return hasPermission('procurement.approve');
      if (vt === 'quality-control') return hasPermission('qc.approve');
      if (vt === 'site-management') return hasPermission('hse.approve') || hasPermission('site.edit');
      if (vt === 'resource-management') return hasPermission('hr.approve');
    }

    // Create / New / Issue / Edit actions require write permissions in their domain
    if (
      labelLower.includes('new ') ||
      labelLower.includes('create') ||
      labelLower.includes('add ') ||
      labelLower.includes('clone') ||
      labelLower.includes('issue ')
    ) {
      if (vt === 'history' || vt === 'editor') return hasPermission('quotes.create') || hasPermission('quotes.edit');
      if (vt === 'clients') return hasPermission('clients.create') || hasPermission('clients.edit');
      if (vt === 'boq-items') return hasPermission('boq.edit');
      if (vt === 'projects' || vt === 'project-lifecycle') return hasPermission('project.create') || hasPermission('project.edit');
      if (vt === 'variation-manager') return hasPermission('variation.create');
      if (vt === 'invoices' || vt === 'accounting') return hasPermission('finance.create');
      if (vt === 'procurement') {
        return (
          hasPermission('procurement.create') ||
          hasPermission('inventory.edit') ||
          hasPermission('supplier.submit') ||
          hasPermission('subcontractor.submit')
        );
      }
      if (vt === 'resource-management') return hasPermission('hr.edit');
      if (vt === 'equipment-management') return hasPermission('equipment.edit');
    }

    return true;
  };

  const canAccessSubSubPortal = (subSub: SystemSubSubPortal, sub?: SystemSubPortal) => {
    if (isAdmin) return true;
    if (subSub.permissionCode && !hasPermission(subSub.permissionCode)) return false;
    return subSub.actions.some(a => canAccessAction(a, sub));
  };

  const canAccessSubPortal = (sub: SystemSubPortal) => {
    if (isAdmin) return true;
    if (!evaluateSubPortalEligibility(sub)) return false;
    return sub.subSubPortals.some(ssp => canAccessSubSubPortal(ssp, sub));
  };

  const canAccessDomain = (domain: SystemDomain) => {
    if (isAdmin) return true;
    return domain.subPortals.some(canAccessSubPortal);
  };

  // Filter accessible hierarchy
  const accessibleDomains = useMemo(() => {
    return domains
      .filter(canAccessDomain)
      .map(d => ({
        ...d,
        subPortals: d.subPortals
          .filter(canAccessSubPortal)
          .map(sp => ({
            ...sp,
            subSubPortals: sp.subSubPortals
              .filter(ssp => canAccessSubSubPortal(ssp, sp))
              .map(ssp => ({
                ...ssp,
                actions: ssp.actions.filter(a => canAccessAction(a, sp))
              }))
          }))
      }));
  }, [domains, isAdmin, activeUser, hasPermission, accessRequests]);

  // Navigation Index State for 4-Column Explorer
  const [selectedDomainIndex, setSelectedDomainIndex] = useState<number>(0);
  const [selectedSubPortalIndex, setSelectedSubPortalIndex] = useState<number>(0);
  const [selectedSubSubIndex, setSelectedSubSubIndex] = useState<number>(0);
  const [searchFilter, setSearchFilter] = useState<string>('');

  const activeDomain = accessibleDomains[selectedDomainIndex] || accessibleDomains[0];
  const activeSubPortals = activeDomain?.subPortals || [];
  const activeSubPortal = activeSubPortals[selectedSubPortalIndex] || activeSubPortals[0];
  const activeSubSubPortals = activeSubPortal?.subSubPortals || [];
  const activeSubSub = activeSubSubPortals[selectedSubSubIndex] || activeSubSubPortals[0];
  const activeActions = activeSubSub?.actions || [];

  // Quick Action Functional Buttons divided and listed down under their respective portal names
  // 1-2 words only, complete solid colors, white text and icons, no descriptions
  const quickActionGroups = useMemo(() => {
    const rawGroups: QuickActionGroup[] = [
      {
        portalId: 'commercial',
        portalName: 'Commercial & Sales',
        portalIcon: FileText,
        actions: [
          {
            id: 'qa-quote',
            label: 'New Quote',
            icon: Plus,
            action: onNewQuote,
            permission: 'quotes.create',
            centralPortalId: 'sales-crm-quotes',
            color: 'bg-orange-600 hover:bg-orange-700 text-white'
          },
          {
            id: 'qa-catalog',
            label: 'Rate Catalog',
            icon: Package,
            action: () => onNavigate('boq-items', 'CATEGORIES_ITEMS'),
            permission: 'boq.view',
            centralPortalId: 'engineering-qs-boq',
            color: 'bg-orange-700 hover:bg-orange-800 text-white'
          },
          {
            id: 'qa-pricing',
            label: 'BOM Pricing',
            icon: BarChart3,
            action: () => onNavigate('boq-items', 'PRICING_INTELLIGENCE'),
            permission: 'boq.edit',
            centralPortalId: 'engineering-qs-boq',
            color: 'bg-blue-700 hover:bg-blue-800 text-white'
          },
          {
            id: 'qa-client',
            label: 'New Client',
            icon: Users,
            action: () => onNavigate('clients'),
            permission: 'clients.create',
            centralPortalId: 'sales-crm-quotes',
            color: 'bg-pink-600 hover:bg-pink-700 text-white'
          },
          {
            id: 'qa-portal',
            label: 'Client Portal',
            icon: Building2,
            action: () => onNavigate('customer-portal'),
            permission: 'clients.view',
            centralPortalId: 'customer-portal',
            color: 'bg-teal-700 hover:bg-teal-800 text-white'
          }
        ]
      },
      {
        portalId: 'factory-production',
        portalName: 'Factories & Production',
        portalIcon: Building2,
        actions: [
          {
            id: 'qa-fac-hub',
            label: 'Factories',
            icon: Building2,
            action: () => onNavigate('operational-control', undefined, { portal: 'factories' }),
            permission: 'factory.view',
            centralPortalId: 'factory-workshop-management',
            color: 'bg-slate-800 hover:bg-slate-900 text-white'
          },
          {
            id: 'qa-fac-wp',
            label: 'Assignments',
            icon: ClipboardList,
            action: () => onNavigate('operational-control', undefined, { portal: 'work_packages' }),
            permission: 'factory.view',
            centralPortalId: 'factory-workshop-management',
            color: 'bg-orange-600 hover:bg-orange-700 text-white'
          },
          {
            id: 'qa-fac-tasks',
            label: 'Shop Tasks',
            icon: Wrench,
            action: () => onNavigate('operational-control', undefined, { portal: 'tasks_planning' }),
            permission: 'production.view',
            centralPortalId: 'production-control',
            color: 'bg-indigo-600 hover:bg-indigo-700 text-white'
          },
          {
            id: 'qa-fac-sheets',
            label: 'Worksheets',
            icon: FileSpreadsheet,
            action: () => onNavigate('operational-control', undefined, { portal: 'worksheets_daily' }),
            permission: 'production.view',
            centralPortalId: 'production-control',
            color: 'bg-emerald-600 hover:bg-emerald-700 text-white'
          }
        ]
      },
      {
        portalId: 'operations',
        portalName: 'Operations & Plant',
        portalIcon: HardHat,
        actions: [
          {
            id: 'qa-proj',
            label: 'Project Hub',
            icon: CheckCircle2,
            action: () => onNavigate('projects'),
            permission: 'project.view',
            centralPortalId: 'project-management',
            color: 'bg-indigo-600 hover:bg-indigo-700 text-white'
          },
          {
            id: 'qa-qc',
            label: 'QC Check',
            icon: ShieldCheck,
            action: () => onNavigate('quality-control', 'inspections'),
            permission: 'qc.view',
            centralPortalId: 'quality-assurance',
            color: 'bg-purple-600 hover:bg-purple-700 text-white'
          },
          {
            id: 'qa-equip',
            label: 'Equipment',
            icon: Wrench,
            action: () => onNavigate('equipment-management'),
            permission: 'equipment.view',
            centralPortalId: 'equipment-machinery',
            color: 'bg-violet-600 hover:bg-violet-700 text-white'
          },
          {
            id: 'qa-site',
            label: 'Site Diary',
            icon: HardHat,
            action: () => onNavigate('site-management'),
            permission: 'site.view',
            centralPortalId: 'construction-site-management',
            color: 'bg-yellow-600 hover:bg-yellow-700 text-white'
          },
          {
            id: 'qa-vo',
            label: 'Variations',
            icon: Scale,
            action: () => onNavigate('variation-manager'),
            permission: 'variation.view',
            centralPortalId: 'project-management',
            color: 'bg-red-600 hover:bg-red-700 text-white'
          },
          {
            id: 'qa-warranty',
            label: 'Warranty',
            icon: Award,
            action: () => onNavigate('warranty'),
            permission: 'qc.view',
            centralPortalId: 'quality-assurance',
            color: 'bg-green-600 hover:bg-green-700 text-white'
          },
          {
            id: 'qa-tickets',
            label: 'Service Tickets',
            icon: SlidersHorizontal,
            action: () => onNavigate('after-sales'),
            permission: 'clients.view',
            centralPortalId: 'customer-portal',
            color: 'bg-fuchsia-600 hover:bg-fuchsia-700 text-white'
          }
        ]
      },
      {
        portalId: 'hr',
        portalName: 'Human Capital & HR',
        portalIcon: Users,
        actions: [
          {
            id: 'qa-att',
            label: 'Attendance',
            icon: Clock,
            action: () => { hrService.setActiveSubPortal('attendance'); onNavigate('operational-control', undefined, { portal: 'hr' }); },
            permission: 'hr.view',
            centralPortalId: 'human-resources',
            color: 'bg-blue-600 hover:bg-blue-700 text-white'
          },
          {
            id: 'qa-leave',
            label: 'Apply Leave',
            icon: Calendar,
            action: () => { hrService.setActiveSubPortal('ess'); onNavigate('operational-control', undefined, { portal: 'hr' }); },
            permission: 'hr.view',
            centralPortalId: 'human-resources',
            color: 'bg-teal-600 hover:bg-teal-700 text-white'
          },
          {
            id: 'qa-timesheet',
            label: 'Timesheets',
            icon: Clock,
            action: () => onNavigate('resource-management', 'timesheets'),
            permission: 'hr.view',
            centralPortalId: 'human-resources',
            color: 'bg-sky-600 hover:bg-sky-700 text-white'
          },
          {
            id: 'qa-payroll',
            label: 'Payroll Run',
            icon: DollarSign,
            action: () => { hrService.setActiveSubPortal('payroll'); onNavigate('operational-control', undefined, { portal: 'hr' }); },
            permission: 'payroll.view',
            centralPortalId: 'human-resources',
            color: 'bg-emerald-700 hover:bg-emerald-800 text-white'
          },
          {
            id: 'qa-case',
            label: 'HR Case',
            icon: AlertTriangle,
            action: () => { hrService.setActiveSubPortal('relations'); onNavigate('operational-control', undefined, { portal: 'hr' }); },
            permission: 'hr.edit',
            centralPortalId: 'human-resources',
            color: 'bg-rose-600 hover:bg-rose-700 text-white'
          }
        ]
      },
      {
        portalId: 'procurement',
        portalName: 'Procurement & Supply',
        portalIcon: Truck,
        actions: [
          {
            id: 'qa-cockpit',
            label: 'Overview',
            icon: LayoutDashboard,
            action: () => onNavigate('procurement', undefined, { procTab: 'overview' }),
            permission: 'procurement.view',
            centralPortalId: 'procurement-supply-chain',
            color: 'bg-orange-600 hover:bg-orange-700 text-white'
          },
          {
            id: 'qa-costing',
            label: 'Cost Rates',
            icon: DollarSign,
            action: () => onNavigate('procurement', undefined, { procTab: 'costing' }),
            permission: 'procurement.view',
            centralPortalId: 'procurement-supply-chain',
            color: 'bg-emerald-600 hover:bg-emerald-700 text-white'
          },
          {
            id: 'qa-pr',
            label: 'Requisition',
            icon: FileText,
            action: () => onNavigate('procurement', undefined, { procTab: 'pr' }),
            permission: 'procurement.create',
            centralPortalId: 'procurement-supply-chain',
            color: 'bg-amber-600 hover:bg-amber-700 text-white'
          },
          {
            id: 'qa-rfq',
            label: 'RFQ Bids',
            icon: ClipboardList,
            action: () => onNavigate('procurement', undefined, { procTab: 'rfq' }),
            permission: 'procurement.view',
            centralPortalId: 'procurement-supply-chain',
            color: 'bg-blue-600 hover:bg-blue-700 text-white'
          },
          {
            id: 'qa-po',
            label: 'Purchase Order',
            icon: ShoppingCart,
            action: () => onNavigate('procurement', undefined, { procTab: 'pos' }),
            permission: 'procurement.approve',
            centralPortalId: 'procurement-supply-chain',
            color: 'bg-amber-700 hover:bg-amber-800 text-white'
          },
          {
            id: 'qa-auction',
            label: 'Dutch Auction',
            icon: Radio,
            action: () => onNavigate('procurement', undefined, { procTab: 'auctions' }),
            permission: 'procurement.view',
            centralPortalId: 'procurement-supply-chain',
            color: 'bg-indigo-700 hover:bg-indigo-800 text-white'
          },
          {
            id: 'qa-grn',
            label: 'Goods Receipt',
            icon: Boxes,
            action: () => onNavigate('procurement', undefined, { procTab: 'grn' }),
            permission: 'inventory.view',
            centralPortalId: 'inventory-warehouse',
            color: 'bg-lime-700 hover:bg-lime-800 text-white'
          },
          {
            id: 'qa-scn',
            label: 'Service Notes',
            icon: FileCheck,
            action: () => onNavigate('procurement', undefined, { procTab: 'scn' }),
            permission: 'subcontractor.view',
            centralPortalId: 'partner-factory-portal',
            color: 'bg-teal-700 hover:bg-teal-800 text-white'
          },
          {
            id: 'qa-3way',
            label: '3-Way Match',
            icon: CreditCard,
            action: () => onNavigate('procurement', undefined, { procTab: 'invoices' }),
            permission: 'procurement.view',
            centralPortalId: 'procurement-supply-chain',
            color: 'bg-emerald-700 hover:bg-emerald-800 text-white'
          },
          {
            id: 'qa-ncr',
            label: 'Quality NCR',
            icon: ShieldAlert,
            action: () => onNavigate('procurement', undefined, { procTab: 'ncrs' }),
            permission: 'qc.view',
            centralPortalId: 'quality-assurance',
            color: 'bg-rose-700 hover:bg-rose-800 text-white'
          },
          {
            id: 'qa-stock',
            label: 'Stock Register',
            icon: Layers,
            action: () => onNavigate('procurement', undefined, { procTab: 'inventory' }),
            permission: 'inventory.view',
            centralPortalId: 'inventory-warehouse',
            color: 'bg-violet-700 hover:bg-violet-800 text-white'
          },
          {
            id: 'qa-contracts',
            label: 'Contracts',
            icon: FolderOpen,
            action: () => onNavigate('procurement', undefined, { procTab: 'contracts' }),
            permission: 'procurement.view',
            centralPortalId: 'procurement-supply-chain',
            color: 'bg-cyan-700 hover:bg-cyan-800 text-white'
          },
          {
            id: 'qa-suppliers',
            label: 'Suppliers AVL',
            icon: Building2,
            action: () => onNavigate('procurement', undefined, { procTab: 'suppliers' }),
            permission: 'supplier.view',
            centralPortalId: 'supplier-portal',
            color: 'bg-sky-700 hover:bg-sky-800 text-white'
          },
          {
            id: 'qa-emergency',
            label: 'Emergency PO',
            icon: HardHat,
            action: () => onNavigate('procurement', undefined, { procTab: 'emergency' }),
            permission: 'procurement.create',
            centralPortalId: 'procurement-supply-chain',
            color: 'bg-red-700 hover:bg-red-800 text-white'
          },
          {
            id: 'qa-spend',
            label: 'Spend Analytics',
            icon: TrendingUp,
            action: () => onNavigate('procurement', undefined, { procTab: 'analytics' }),
            permission: 'procurement.view',
            centralPortalId: 'procurement-supply-chain',
            color: 'bg-purple-700 hover:bg-purple-800 text-white'
          }
        ]
      },
      {
        portalId: 'finance',
        portalName: 'Finance & Accounts',
        portalIcon: CreditCard,
        actions: [
          {
            id: 'qa-inv',
            label: 'New Invoice',
            icon: CreditCard,
            action: () => onNavigate('invoices'),
            permission: 'finance.create',
            centralPortalId: 'accounting-finance',
            color: 'bg-emerald-600 hover:bg-emerald-700 text-white'
          },
          {
            id: 'qa-pay-record',
            label: 'Record Payment',
            icon: DollarSign,
            action: () => onNavigate('accounting', 'payments'),
            permission: 'finance.view',
            centralPortalId: 'accounting-finance',
            color: 'bg-cyan-700 hover:bg-cyan-800 text-white'
          },
          {
            id: 'qa-aging',
            label: 'Aging Report',
            icon: FileSpreadsheet,
            action: () => onNavigate('reporting', 'Aging'),
            permission: 'reports.view',
            centralPortalId: 'reporting-analytics',
            color: 'bg-slate-700 hover:bg-slate-800 text-white'
          }
        ]
      },
      {
        portalId: 'governance',
        portalName: 'Governance & System',
        portalIcon: ShieldCheck,
        actions: [
          {
            id: 'qa-audit',
            label: 'Audit Log',
            icon: History,
            action: () => onNavigate('audit-log'),
            permission: 'security.audit',
            centralPortalId: 'system-administration',
            color: 'bg-zinc-700 hover:bg-zinc-800 text-white'
          },
          {
            id: 'qa-import',
            label: 'Data Import',
            icon: FileSpreadsheet,
            action: onImportModal,
            permission: 'settings.manage',
            centralPortalId: 'system-administration',
            color: 'bg-cyan-700 hover:bg-cyan-800 text-white'
          },
          {
            id: 'qa-snapshot',
            label: 'Snapshot',
            icon: Download,
            action: onExportSnapshot,
            permission: 'reports.export',
            centralPortalId: 'reporting-analytics',
            color: 'bg-slate-700 hover:bg-slate-800 text-white'
          },
          {
            id: 'qa-settings',
            label: 'Settings',
            icon: Settings,
            action: () => onNavigate('settings'),
            permission: 'settings.manage',
            centralPortalId: 'system-administration',
            color: 'bg-gray-700 hover:bg-gray-800 text-white'
          }
        ]
      }
    ];

    if (isAdmin) return rawGroups;

    return rawGroups
      .map(group => ({
        ...group,
        actions: group.actions.filter(a => {
          if (a.centralPortalId && !canPortal(a.centralPortalId)) return false;
          if (a.permission && !hasPermission(a.permission)) return false;
          return true;
        })
      }))
      .filter(group => group.actions.length > 0);
  }, [isAdmin, activeUser, hasPermission, onNewQuote, onNavigate, onImportModal, onExportSnapshot]);

  const totalQuickActions = useMemo(() => {
    return quickActionGroups.reduce((acc, g) => acc + g.actions.length, 0);
  }, [quickActionGroups]);

  const handleLaunchSubPortal = () => {
    if (!activeSubPortal) return;
    if (activeSubPortal.viewTarget === 'operational-control' && activeSubPortal.extraParams?.portal === 'hr') {
      if (activeSubPortal.extraParams.hrSub) {
        hrService.setActiveSubPortal(activeSubPortal.extraParams.hrSub as any);
      }
    }
    onNavigate(activeSubPortal.viewTarget, activeSubPortal.subTabTarget, activeSubPortal.extraParams);
  };

  // Search filter matching across domains, sub-portals, sub-sub-portals, and actions
  const filterMatches = (text: string) => {
    if (!searchFilter.trim()) return true;
    return text.toLowerCase().includes(searchFilter.toLowerCase().trim());
  };

  const allRegisteredPortals = useMemo(() => securityService.getPortalRegistry(), [activeUser]);
  const restrictedPortals = useMemo(() => {
    if (!activeUser) return [];
    return allRegisteredPortals.filter(p => !securityService.canAccessPortal(activeUser.id, p.portalId));
  }, [allRegisteredPortals, activeUser]);

  const myAccessRequests = useMemo(() => {
    if (!activeUser) return [];
    return accessRequests.filter(r => r.requesterId === activeUser.id);
  }, [accessRequests, activeUser]);

  const handleSubmitPortalAccessRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUser) return;
    const targetPortal = allRegisteredPortals.find(p => p.portalId === reqTargetPortalId);
    if (!targetPortal) return;

    createAccessRequest({
      requesterId: activeUser.id,
      requesterName: activeUser.fullName,
      requesterRole: activeUser.roleName,
      requesterDepartment: activeUser.department,
      requestType: 'Portal Access',
      requestedItem: `${targetPortal.portalName} (${targetPortal.requiredPermissions.join(', ')})`,
      targetPortalId: targetPortal.portalId,
      requestedPermissionCodes: targetPortal.requiredPermissions,
      justification: reqJustification.trim() || `Requesting operational access to ${targetPortal.portalName}.`,
      duration: reqDuration,
      isHighRisk: targetPortal.portalId === 'system-administration' || targetPortal.portalId === 'accounting-finance'
    });

    refreshData();
    setReqJustification('');
    setIsAccessModalOpen(false);
    setReqSubmittedToast(`Access request submitted for ${targetPortal.portalName}. Once approved by Administrator, it will immediately appear in your account.`);
    setTimeout(() => setReqSubmittedToast(null), 5000);
  };

  return (
    <div className="space-y-3 pb-8">
      {reqSubmittedToast && (
        <div className="bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg border border-slate-700 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck size={15} className="text-emerald-400 shrink-0" />
            <span>{reqSubmittedToast}</span>
          </div>
          <button onClick={() => setReqSubmittedToast(null)} className="text-slate-400 hover:text-white ml-4">
            &times;
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. RED AREA: SIMPLIFIED HEADER (NO STAR ICON, NO DESCRIPTION, FEW WORDS)  */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h1 className="text-base font-bold text-slate-900 tracking-tight">
            Innovista Operations Hub
          </h1>
          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
            {accessibleDomains.length} Authorized Portals
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {!isAdmin && restrictedPortals.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setReqTargetPortalId(restrictedPortals[0].portalId);
                setIsAccessModalOpen(true);
              }}
              className="px-2.5 py-1 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus size={12} />
              <span>Request Portal Access</span>
            </button>
          )}

          <div className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-slate-800">{activeUser?.fullName || 'Alexander Vance'}</span>
            <span className="text-slate-400">·</span>
            <span className="text-orange-600 font-medium">
              {isAdmin ? 'Super Admin' : activeUser?.roleName}
            </span>
          </div>

          <div className="px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
            RBAC Enforced
          </div>
        </div>
      </div>

      {/* Request Portal / Feature Access Modal */}
      {isAccessModalOpen && (
        <div className="fixed inset-0 z-[200] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Request Additional Portal or Feature Access</h3>
                <p className="text-[11px] text-slate-500">
                  Restricted portals are hidden by default. Once approved by an Administrator, the portal and its actions will immediately appear on your account.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAccessModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmitPortalAccessRequest} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Restricted Portal to Request</label>
                <select
                  value={reqTargetPortalId}
                  onChange={e => setReqTargetPortalId(e.target.value as CentralPortalId)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-900"
                >
                  {restrictedPortals.map(p => (
                    <option key={p.portalId} value={p.portalId}>
                      {p.portalName} ({p.category}) — Requires: {p.requiredPermissions.join(', ')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Access Duration</label>
                <select
                  value={reqDuration}
                  onChange={e => setReqDuration(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-900"
                >
                  <option value="Permanent">Permanent Role/Account Scope</option>
                  <option value="Temporary (30 days)">Temporary — 30 Days</option>
                  <option value="Temporary (7 days)">Temporary — 7 Days</option>
                  <option value="Temporary (90 days)">Temporary — 90 Days</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Operational Justification</label>
                <textarea
                  required
                  rows={3}
                  value={reqJustification}
                  onChange={e => setReqJustification(e.target.value)}
                  placeholder="Describe why your role requires access to this portal and its workflows..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-900"
                />
              </div>

              {myAccessRequests.length > 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 space-y-1.5 max-h-32 overflow-y-auto">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Your Recent Access Requests</span>
                  {myAccessRequests.map(r => (
                    <div key={r.id} className="flex items-center justify-between text-[11px]">
                      <span className="truncate max-w-[260px] text-slate-700 font-medium">{r.requestedItem}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                          r.status === 'Admin Approved'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : r.status === 'Rejected'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {r.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAccessModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold"
                >
                  Submit Access Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. BLUE AREA: QUICK ACTIONS DIVIDED UNDER THEIR PORTALS NAMES             */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-1 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Quick Actions by Portal
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono font-medium">
              {quickActionGroups.length} Portals • {totalQuickActions} Actions
            </span>
          </div>
          <span className="text-[10px] text-slate-400">Divided under portal names for one-click access</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {quickActionGroups.map(group => {
            const GroupIcon = group.portalIcon;
            return (
              <div
                key={group.portalId}
                className="bg-slate-50/70 border border-slate-200/90 rounded-xl p-2.5 flex flex-col justify-between hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-200/70">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <GroupIcon size={13} className="text-orange-500" />
                    <span>{group.portalName}</span>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-white text-slate-500 border border-slate-200 font-mono font-semibold">
                    {group.actions.length}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {group.actions.map(qa => {
                    const Icon = qa.icon;
                    return (
                      <button
                        key={qa.id}
                        type="button"
                        onClick={qa.action}
                        className={cn(
                          "px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95",
                          qa.color
                        )}
                        title={qa.label}
                      >
                        <Icon size={12} className="shrink-0 text-white" />
                        <span className="truncate">{qa.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. GREEN AREA: UNIVERSAL PORTAL DIRECTORY & COMPLETE ACTIONS HIERARCHY    */}
      {/* (ALL 10 NAVBAR PORTALS > SUB-PORTALS > SUB-PORTALS OF SUB-PORTAL >        */}
      {/*  EVERY ACTION IN SIMPLIFIED DESIGN, NO LONG DESCRIPTIONS)                 */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col">
        {/* Explorer Header */}
        <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <Layout size={16} className="text-orange-500" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Universal Portal Directory
            </h2>
            <span className="text-[10px] px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md font-mono font-semibold">
              {accessibleDomains.length} Portals • All Navbar Modules
            </span>
          </div>

          <div className="relative w-full sm:w-64">
            <Search size={13} className="text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search portals, modules & actions..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-7 pr-3 py-1 bg-white border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:border-orange-500 transition-all"
            />
          </div>
        </div>

        {/* 4-Column Simplified Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-200 min-h-[460px]">
          {/* ---------------------------------------------------- */}
          {/* COLUMN 1: PRIMARY PORTALS (ALL 10 FROM NAVBAR)       */}
          {/* ---------------------------------------------------- */}
          <div className="p-2.5 bg-white flex flex-col">
            <div className="h-6 px-1.5 border-b border-slate-200 flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Primary Portals</span>
              <span className="text-[10px] font-mono text-slate-400">{accessibleDomains.length}</span>
            </div>

            <div className="space-y-1 overflow-y-auto custom-scrollbar flex-1 max-h-[420px]">
              {accessibleDomains.map((domain, idx) => {
                const DomainIcon = domain.icon;
                const isSelected = selectedDomainIndex === idx;
                return (
                  <button
                    key={domain.id}
                    type="button"
                    onClick={() => {
                      setSelectedDomainIndex(idx);
                      setSelectedSubPortalIndex(0);
                      setSelectedSubSubIndex(0);
                    }}
                    className={cn(
                      "w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between gap-2 transition-all cursor-pointer font-medium",
                      isSelected
                        ? "bg-orange-50 text-orange-600 font-bold shadow-xs border border-orange-200"
                        : "text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-transparent"
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <DomainIcon size={14} className={isSelected ? "text-orange-500" : "text-slate-400"} />
                      <span className="truncate">{domain.shortLabel}</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-mono">
                        {domain.subPortals.length}
                      </span>
                      <ArrowRight size={11} className={isSelected ? "text-orange-500" : "text-slate-300"} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ---------------------------------------------------- */}
          {/* COLUMN 2: SUB-PORTALS                                */}
          {/* ---------------------------------------------------- */}
          <div className="p-2.5 bg-white flex flex-col">
            <div className="h-6 px-1.5 border-b border-slate-200 flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
                {activeDomain?.shortLabel || 'Sub-Portals'}
              </span>
              <span className="text-[10px] font-mono text-slate-400">{activeSubPortals.length}</span>
            </div>

            <div className="space-y-1 overflow-y-auto custom-scrollbar flex-1 max-h-[420px]">
              {activeSubPortals.length === 0 ? (
                <div className="text-center py-12 text-xs text-slate-400">
                  No sub-portals accessible.
                </div>
              ) : (
                activeSubPortals.map((sub, idx) => {
                  const SubIcon = sub.icon;
                  const isSelected = selectedSubPortalIndex === idx;
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => {
                        setSelectedSubPortalIndex(idx);
                        setSelectedSubSubIndex(0);
                      }}
                      className={cn(
                        "w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between gap-2 transition-all cursor-pointer font-medium",
                        isSelected
                          ? "bg-orange-50 text-orange-700 font-bold border border-orange-200"
                          : "text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-transparent"
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <SubIcon size={14} className={isSelected ? "text-orange-600" : "text-slate-400"} />
                        <span className="truncate">{sub.name}</span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {sub.badge && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-semibold uppercase">
                            {sub.badge}
                          </span>
                        )}
                        <ArrowRight size={11} className={isSelected ? "text-orange-600" : "text-slate-300"} />
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* ---------------------------------------------------- */}
          {/* COLUMN 3: SUB-PORTALS OF SUB-PORTAL                  */}
          {/* ---------------------------------------------------- */}
          <div className="p-2.5 bg-white flex flex-col">
            <div className="h-6 px-1.5 border-b border-slate-200 flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
                Sub-Portals of Sub-Portal
              </span>
              <span className="text-[10px] font-mono text-slate-400">{activeSubSubPortals.length}</span>
            </div>

            <div className="space-y-1 overflow-y-auto custom-scrollbar flex-1 max-h-[420px]">
              {activeSubSubPortals.length === 0 ? (
                <div className="text-center py-12 text-xs text-slate-400">
                  Select a sub-portal.
                </div>
              ) : (
                activeSubSubPortals.map((ssp, idx) => {
                  const SspIcon = ssp.icon || FolderTreeIcon;
                  const isSelected = selectedSubSubIndex === idx;
                  return (
                    <button
                      key={ssp.id}
                      type="button"
                      onClick={() => setSelectedSubSubIndex(idx)}
                      className={cn(
                        "w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between gap-2 transition-all cursor-pointer font-medium",
                        isSelected
                          ? "bg-orange-50 text-orange-950 font-bold border border-orange-300 shadow-2xs"
                          : "text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-slate-100"
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <SspIcon size={13} className={isSelected ? "text-orange-500" : "text-slate-400"} />
                        <span className="truncate">{ssp.name}</span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 font-mono">
                          {ssp.actions.length} acts
                        </span>
                        <ArrowRight size={10} className={isSelected ? "text-orange-500" : "text-slate-300"} />
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* ---------------------------------------------------- */}
          {/* COLUMN 4: EVERY ACTION IN THE SYSTEM & LAUNCH BUTTON  */}
          {/* ---------------------------------------------------- */}
          <div className="p-3 bg-white flex flex-col justify-between">
            <div className="flex-1 flex flex-col">
              <div className="h-6 px-1.5 border-b border-slate-200 flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Every Action ({activeActions.length})
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Direct Execute</span>
              </div>

              <div className="space-y-1.5 overflow-y-auto custom-scrollbar flex-1 max-h-[350px]">
                {activeActions.length === 0 ? (
                  <div className="text-center py-12 text-xs text-slate-400">
                    No actions available.
                  </div>
                ) : (
                  activeActions
                    .filter(act => filterMatches(act.name))
                    .map(act => (
                      <div
                        key={act.id}
                        className="px-2.5 py-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-orange-50/40 hover:border-orange-200 transition-all flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <Check size={12} className="text-orange-600 shrink-0" />
                          <span className="text-xs font-semibold text-slate-800 truncate">{act.name}</span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {act.badge && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono font-medium">
                              {act.badge}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={act.action}
                            className="text-[10px] px-2.5 py-0.5 bg-orange-600 hover:bg-orange-700 text-white rounded font-semibold transition-colors cursor-pointer shadow-2xs"
                          >
                            Open
                          </button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>

            {/* Launch Sub-Portal Direct Button */}
            {activeSubPortal && (
              <div className="pt-2.5 border-t border-slate-100 mt-2">
                <button
                  type="button"
                  onClick={handleLaunchSubPortal}
                  className="w-full py-2 px-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs rounded-lg shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>Launch Portal</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper icon
const FolderTreeIcon: React.FC<{ size?: number; className?: string }> = ({ size = 13, className }) => (
  <FolderTree size={size} className={className} />
);
