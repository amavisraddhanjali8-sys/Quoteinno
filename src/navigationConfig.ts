import {
  Home, Layout, History, Settings, Plus, FileText, Download, CheckCircle2,
  User, Clock, CreditCard, Building2,
  BarChart3, Package, ShieldCheck, GanttChart, HardHat, Wrench,
  Medal, Users, Radio, Store, Layers, Sliders, FileSpreadsheet,
  Scale, FolderTree, SlidersHorizontal, Cpu, TrendingUp,
  ExternalLink, Info, HeartHandshake, Landmark, Truck, PackageCheck, ClipboardList,
  Briefcase, UserCheck, Award, GraduationCap, AlertCircle, DollarSign, LayoutDashboard
} from 'lucide-react';
import { NavDropdownItem } from './components/NestedNavDropdown';
import { hrService } from './services/hrService';
import { securityService } from './services/securityService';
import { CentralPortalId } from './types/security';

export interface NavTabConfig {
  id: string;
  label: string;
  icon: any;
  isActive: boolean;
  badge?: string;
  items: NavDropdownItem[];
  onDirectClick?: () => void;
}

export interface NavigationConfigParams {
  userId?: string;
  view: string;
  setView: (view: any) => void;
  dashboardPerspective?: string;
  setDashboardPerspective?: (p: any) => void;
  showCatalog: boolean;
  quotesCount: number;
  projectsCount: number;
  invoicesCount: number;
  clientsCount: number;
  personnelCount: number;
  equipmentCount: number;
  ncrsCount: number;
  warrantyCount: number;
  auditCount: number;
  setOpenDropdown: (val: string | null) => void;
  handleNewQuote: () => void;
  setShowCatalog: (show: boolean) => void;
  setCatalogInitialTab: (tab: any) => void;
  setBoqInitialTab: (tab: any) => void;
  setShowTemplateManager: (show: boolean) => void;
  handleOpenImportModal: (entity?: any) => void;
  setInvoiceProjectFilter: (filter: string | null) => void;
  handleCreateProject: () => void;
  setLifecycleTab: (tab: 'dashboard' | 'phases' | 'risks' | 'handover') => void;
  setAccountingTab: (tab: any) => void;
  setAccountingProjectFilter: (filter: string | null) => void;
  setReportingReport: (report: 'Statement' | 'Aging' | 'Retention' | 'BadDebt' | 'Project' | 'Collection') => void;
  setIsDownloadPortalOpen: (open: boolean) => void;
  selectedPortalClient: any;
  setSelectedPortalClient: (client: any) => void;
  clients: any[];
  setResourceTab: (tab: any) => void;
  setEquipmentTab: (tab: any) => void;
  setSiteTab: (tab: any) => void;
  setQcTab: (tab: any) => void;
  setWarrantyTab: (tab: any) => void;
  setProcurementTab?: (tab: any) => void;
  setOperationalPortalId?: (portalId: any) => void;
  setSettingsInitialTab?: (tab: any) => void;
  setSecurityInitialTab?: (tab: any) => void;
}

export function getNavigationTabs(params: NavigationConfigParams): NavTabConfig[] {
  const {
    view, setView, dashboardPerspective, setDashboardPerspective, showCatalog,
    quotesCount, projectsCount, invoicesCount, clientsCount,
    personnelCount, equipmentCount, ncrsCount, warrantyCount, auditCount,
    setOpenDropdown, handleNewQuote, setShowCatalog, setCatalogInitialTab,
    setBoqInitialTab, setShowTemplateManager, handleOpenImportModal,
    setInvoiceProjectFilter, handleCreateProject, setLifecycleTab,
    setAccountingTab, setAccountingProjectFilter, setReportingReport,
    setIsDownloadPortalOpen, selectedPortalClient, setSelectedPortalClient, clients,
    setResourceTab, setEquipmentTab, setSiteTab, setQcTab, setWarrantyTab, setProcurementTab,
    setOperationalPortalId, setSettingsInitialTab, setSecurityInitialTab
  } = params;

  const close = () => setOpenDropdown(null);

  // Master Portals Hierarchy with Sub-Portals > Sub-Portals > Sub-Portals
  const allPortalsItems: NavDropdownItem[] = [
    {
      name: 'Dashboard',
      icon: Layout,
      children: [
        {
          name: 'Executive Views',
          icon: BarChart3,
          children: [
            {
              name: 'Overview Hub',
              icon: Layout,
              onClick: () => { setDashboardPerspective?.('overview'); setView('dashboard'); close(); }
            },
            {
              name: 'Executive Cockpit',
              icon: BarChart3,
              onClick: () => { setDashboardPerspective?.('executive'); setView('dashboard'); close(); }
            },
            {
              name: 'Analytics & KPIs',
              icon: Cpu,
              onClick: () => { setDashboardPerspective?.('analytics'); setView('dashboard'); close(); }
            }
          ]
        },
        {
          name: 'Commercial & Sales',
          icon: Landmark,
          children: [
            {
              name: 'Finance Perspective',
              icon: Landmark,
              onClick: () => { setDashboardPerspective?.('finance'); setView('dashboard'); close(); }
            },
            {
              name: 'CRM & Pipeline',
              icon: HeartHandshake,
              onClick: () => { setDashboardPerspective?.('crm'); setView('dashboard'); close(); }
            },
            {
              name: 'Pricing & Margins',
              icon: TrendingUp,
              onClick: () => { setDashboardPerspective?.('analytics'); setView('dashboard'); close(); }
            }
          ]
        },
        {
          name: 'Operations & Plant',
          icon: HardHat,
          children: [
            {
              name: 'Operations View',
              icon: HardHat,
              onClick: () => { setDashboardPerspective?.('operations'); setView('dashboard'); close(); }
            },
            {
              name: 'Quality Perspective',
              icon: ShieldCheck,
              onClick: () => { setDashboardPerspective?.('quality'); setView('dashboard'); close(); }
            }
          ]
        }
      ]
    },
    {
      name: 'Procurement',
      icon: Truck,
      children: [
        {
          name: 'Procurement Landing Hub',
          icon: LayoutDashboard,
          onClick: () => { setProcurementTab?.('landing'); setView('procurement'); close(); }
        },
        {
          name: 'Overview & Cockpit',
          icon: LayoutDashboard,
          onClick: () => { setProcurementTab?.('overview'); setView('procurement'); close(); }
        },
        {
          name: 'Cost Items Hub & MOQ Rates',
          icon: DollarSign,
          onClick: () => { setProcurementTab?.('costing'); setView('procurement-costs'); close(); }
        },
        {
          name: 'Procurement Documents (89 Forms)',
          icon: FileText,
          children: [
            {
              name: 'Setup & Master Docs (1-22)',
              icon: Building2,
              onClick: () => { setProcurementTab?.('documents'); setView('procurement'); close(); }
            },
            {
              name: 'Project Procurement (23-40)',
              icon: FolderTree,
              onClick: () => { setProcurementTab?.('documents'); setView('procurement'); close(); }
            },
            {
              name: 'Material & Requirements (41-60)',
              icon: PackageCheck,
              onClick: () => { setProcurementTab?.('documents'); setView('procurement'); close(); }
            },
            {
              name: 'Technical Procurement (61-89)',
              icon: ShieldCheck,
              onClick: () => { setProcurementTab?.('documents'); setView('procurement'); close(); }
            },
            {
              name: 'All 89 Documents Registry',
              icon: FileText,
              onClick: () => { setProcurementTab?.('documents'); setView('procurement'); close(); }
            }
          ]
        },
        {
          name: 'Sourcing & RFQ',
          icon: ClipboardList,
          children: [
            {
              name: 'Requisitions',
              icon: Plus,
              children: [
                {
                  name: 'Requisitions (PR)',
                  icon: Plus,
                  onClick: () => { setProcurementTab?.('pr'); setView('procurement'); close(); }
                },
                {
                  name: 'Approvals Queue',
                  icon: Clock,
                  onClick: () => { setProcurementTab?.('pr'); setView('procurement'); close(); }
                }
              ]
            },
            {
              name: 'Quotations',
              icon: ClipboardList,
              children: [
                {
                  name: 'RFQs & Sourcing Bids',
                  icon: ClipboardList,
                  onClick: () => { setProcurementTab?.('rfq'); setView('procurement'); close(); }
                },
                {
                  name: 'Bid Comparison',
                  icon: BarChart3,
                  onClick: () => { setProcurementTab?.('rfq'); setView('procurement'); close(); }
                }
              ]
            },
            {
              name: 'Auctions',
              icon: Radio,
              children: [
                {
                  name: 'Live Dutch Auctions',
                  icon: Radio,
                  onClick: () => { setProcurementTab?.('auctions'); setView('procurement'); close(); }
                },
                {
                  name: 'Auction History',
                  icon: History,
                  onClick: () => { setProcurementTab?.('auctions'); setView('procurement'); close(); }
                }
              ]
            },
            {
              name: 'Emergency',
              icon: HardHat,
              children: [
                {
                  name: 'Safety Fast-Track',
                  icon: HardHat,
                  onClick: () => { setProcurementTab?.('emergency'); setView('procurement'); close(); }
                },
                {
                  name: 'Retroactive Audits',
                  icon: ShieldCheck,
                  onClick: () => { setProcurementTab?.('emergency'); setView('procurement'); close(); }
                }
              ]
            }
          ]
        },
        {
          name: 'Purchasing',
          icon: FileText,
          children: [
            {
              name: 'Orders',
              icon: FileText,
              children: [
                {
                  name: 'Purchase Orders (PO)',
                  icon: FileText,
                  onClick: () => { setProcurementTab?.('pos'); setView('procurement'); close(); }
                },
                {
                  name: 'Dual Authorization',
                  icon: ShieldCheck,
                  onClick: () => { setProcurementTab?.('pos'); setView('procurement'); close(); }
                }
              ]
            },
            {
              name: 'Contracts',
              icon: FileSpreadsheet,
              children: [
                {
                  name: 'Framework Contracts',
                  icon: FileSpreadsheet,
                  onClick: () => { setProcurementTab?.('contracts'); setView('procurement'); close(); }
                },
                {
                  name: 'Price Lock Terms',
                  icon: Scale,
                  onClick: () => { setProcurementTab?.('contracts'); setView('procurement'); close(); }
                }
              ]
            },
            {
              name: 'Vendors',
              icon: Building2,
              children: [
                {
                  name: 'Suppliers Directory',
                  icon: Building2,
                  onClick: () => { setProcurementTab?.('suppliers'); setView('procurement'); close(); }
                },
                {
                  name: 'Scorecards & Rating',
                  icon: Medal,
                  onClick: () => { setProcurementTab?.('suppliers'); setView('procurement'); close(); }
                }
              ]
            }
          ]
        },
        {
          name: 'Logistics',
          icon: PackageCheck,
          children: [
            {
              name: 'Receiving',
              icon: PackageCheck,
              children: [
                {
                  name: 'Goods Receipt (GRN)',
                  icon: PackageCheck,
                  onClick: () => { setProcurementTab?.('grn'); setView('procurement'); close(); }
                },
                {
                  name: 'Barcode Scanning',
                  icon: Radio,
                  onClick: () => { setProcurementTab?.('grn'); setView('procurement'); close(); }
                }
              ]
            },
            {
              name: 'Subcontracts',
              icon: CheckCircle2,
              children: [
                {
                  name: 'Service Notes (SCN)',
                  icon: CheckCircle2,
                  onClick: () => { setProcurementTab?.('scn'); setView('procurement'); close(); }
                },
                {
                  name: 'Milestone Signoffs',
                  icon: Clock,
                  onClick: () => { setProcurementTab?.('scn'); setView('procurement'); close(); }
                }
              ]
            },
            {
              name: 'Inventory',
              icon: Package,
              children: [
                {
                  name: 'Warehouse Stock',
                  icon: Package,
                  onClick: () => { setProcurementTab?.('inventory'); setView('procurement'); close(); }
                },
                {
                  name: 'Reorder Alerts',
                  icon: Info,
                  onClick: () => { setProcurementTab?.('inventory'); setView('procurement'); close(); }
                }
              ]
            },
            {
              name: 'Reclaim',
              icon: Scale,
              children: [
                {
                  name: 'Scrap & Recovery',
                  icon: Scale,
                  onClick: () => { setProcurementTab?.('scrap'); setView('procurement'); close(); }
                },
                {
                  name: 'Project Redirection',
                  icon: HardHat,
                  onClick: () => { setProcurementTab?.('scrap'); setView('procurement'); close(); }
                }
              ]
            }
          ]
        },
        {
          name: 'Governance',
          icon: ShieldCheck,
          children: [
            {
              name: 'Invoicing',
              icon: CreditCard,
              children: [
                {
                  name: '3-Way Match Invoices',
                  icon: CreditCard,
                  onClick: () => { setProcurementTab?.('invoices'); setView('procurement'); close(); }
                },
                {
                  name: 'PVC Authorization',
                  icon: ShieldCheck,
                  onClick: () => { setProcurementTab?.('invoices'); setView('procurement'); close(); }
                }
              ]
            },
            {
              name: 'Quality',
              icon: ShieldCheck,
              children: [
                {
                  name: 'Quality NCR Holds',
                  icon: ShieldCheck,
                  onClick: () => { setProcurementTab?.('ncrs'); setView('procurement'); close(); }
                },
                {
                  name: 'Debit Intercept',
                  icon: Scale,
                  onClick: () => { setProcurementTab?.('ncrs'); setView('procurement'); close(); }
                }
              ]
            },
            {
              name: 'Analytics',
              icon: BarChart3,
              children: [
                {
                  name: 'Spend Intelligence',
                  icon: BarChart3,
                  onClick: () => { setProcurementTab?.('analytics'); setView('procurement'); close(); }
                },
                {
                  name: 'HHI Concentration',
                  icon: Cpu,
                  onClick: () => { setProcurementTab?.('analytics'); setView('procurement'); close(); }
                }
              ]
            }
          ]
        }
      ]
    },
    {
      name: 'Factories',
      icon: Building2,
      children: [
        {
          name: 'Factories',
          icon: Building2,
          onClick: () => { setOperationalPortalId?.('factories'); setView('operational-control'); close(); }
        },
        {
          name: 'Assignments',
          icon: CheckCircle2,
          onClick: () => { setOperationalPortalId?.('work_packages'); setView('operational-control'); close(); }
        },
        {
          name: 'Tasks',
          icon: Wrench,
          onClick: () => { setOperationalPortalId?.('tasks_planning'); setView('operational-control'); close(); }
        },
        {
          name: 'Worksheets',
          icon: FileSpreadsheet,
          onClick: () => { setOperationalPortalId?.('worksheets_daily'); setView('operational-control'); close(); }
        },
        {
          name: 'Resources',
          icon: Cpu,
          onClick: () => { setOperationalPortalId?.('resources_materials'); setView('operational-control'); close(); }
        },
        {
          name: 'Quality',
          icon: ShieldCheck,
          onClick: () => { setOperationalPortalId?.('quality_hse'); setView('operational-control'); close(); }
        },
        {
          name: 'Dispatch',
          icon: Truck,
          onClick: () => { setOperationalPortalId?.('dispatch_site'); setView('operational-control'); close(); }
        },
        {
          name: 'Documents',
          icon: FileText,
          onClick: () => { setOperationalPortalId?.('documents_drawings'); setView('operational-control'); close(); }
        },
        {
          name: 'Analytics',
          icon: BarChart3,
          onClick: () => { setOperationalPortalId?.('analytics_audit'); setView('operational-control'); close(); }
        },
        {
          name: 'Partners',
          icon: Users,
          onClick: () => { setOperationalPortalId?.('partner_portal'); setView('operational-control'); close(); }
        },
        {
          name: 'Hub',
          icon: LayoutDashboard,
          onClick: () => { setOperationalPortalId?.('dashboard'); setView('operational-control'); close(); }
        }
      ]
    },
    {
      name: 'Quotes',
      icon: FileText,
      children: [
        {
          name: 'Quotations',
          icon: FileText,
          children: [
            {
              name: 'Register',
              icon: History,
              onClick: () => { setView('history'); close(); }
            },
            {
              name: 'Editor',
              icon: FileText,
              onClick: () => { setView('editor'); close(); }
            }
          ]
        },
        {
          name: 'Catalog',
          icon: Store,
          children: [
            {
              name: 'Master Library',
              icon: Store,
              onClick: () => { setCatalogInitialTab('OVERVIEW'); setShowCatalog(true); close(); }
            },
            {
              name: 'Categories Tree',
              icon: FolderTree,
              onClick: () => { setCatalogInitialTab('CATEGORIES'); setShowCatalog(true); close(); }
            }
          ]
        },
        {
          name: 'Engineering',
          icon: Package,
          children: [
            {
              name: 'BOQ Item Manager',
              icon: Package,
              onClick: () => { setBoqInitialTab('CATEGORIES_ITEMS'); setView('boq-items'); close(); }
            },
            {
              name: 'Variant Matrix',
              icon: SlidersHorizontal,
              onClick: () => { setBoqInitialTab('VARIANTS_LIST'); setView('boq-items'); close(); }
            },
            {
              name: 'Smart Spec Engine',
              icon: Cpu,
              onClick: () => { setBoqInitialTab('SPEC_ENGINE'); setView('boq-items'); close(); }
            },
            {
              name: 'Pricing Intelligence',
              icon: TrendingUp,
              onClick: () => { setBoqInitialTab('PRICING_INTELLIGENCE'); setView('boq-items'); close(); }
            }
          ]
        },
        {
          name: 'Templates',
          icon: Sliders,
          children: [
            {
              name: 'Template Library',
              icon: Sliders,
              onClick: () => { setShowTemplateManager(true); close(); }
            }
          ]
        }
      ]
    },
    {
      name: 'Projects',
      icon: CheckCircle2,
      children: [
        {
          name: 'Directory',
          icon: CheckCircle2,
          children: [
            {
              name: 'All Projects',
              icon: CheckCircle2,
              onClick: () => { setView('projects'); close(); }
            },
            {
              name: 'New Project Charter',
              icon: Plus,
              onClick: () => { handleCreateProject?.(); close(); }
            }
          ]
        },
        {
          name: 'Variations',
          icon: Plus,
          children: [
            {
              name: 'Variation Manager',
              icon: Plus,
              onClick: () => { setView('variation-manager'); close(); }
            }
          ]
        },
        {
          name: 'Procurement Package',
          icon: FileText,
          children: [
            {
              name: 'Project Procurement Plan',
              icon: FileText,
              onClick: () => { setProcurementTab?.('documents'); setView('procurement'); close(); }
            },
            {
              name: 'Procurement Strategy & Packages',
              icon: FolderTree,
              onClick: () => { setProcurementTab?.('documents'); setView('procurement'); close(); }
            },
            {
              name: 'BOM / BOQ / MTO Requirements',
              icon: PackageCheck,
              onClick: () => { setProcurementTab?.('documents'); setView('procurement'); close(); }
            }
          ]
        },
        {
          name: 'Lifecycle',
          icon: GanttChart,
          children: [
            {
              name: 'Dashboard',
              icon: Layout,
              onClick: () => { setLifecycleTab('dashboard'); setView('project-lifecycle'); close(); }
            },
            {
              name: 'Phases & WBS',
              icon: FolderTree,
              onClick: () => { setLifecycleTab('phases'); setView('project-lifecycle'); close(); }
            },
            {
              name: 'Risk Register',
              icon: ShieldCheck,
              onClick: () => { setLifecycleTab('risks'); setView('project-lifecycle'); close(); }
            },
            {
              name: 'Handover Protocol',
              icon: CheckCircle2,
              onClick: () => { setLifecycleTab('handover'); setView('project-lifecycle'); close(); }
            }
          ]
        },
        {
          name: 'Evaluation',
          icon: Scale,
          children: [
            {
              name: 'Variance Analysis',
              icon: Scale,
              onClick: () => { setView('post-evaluation'); close(); }
            },
            {
              name: 'Historical Post-Mortem',
              icon: History,
              onClick: () => { setView('post-evaluation'); close(); }
            }
          ]
        }
      ]
    },
    {
      name: 'Finance',
      icon: Building2,
      children: [
        {
          name: 'Invoices',
          icon: CreditCard,
          children: [
            {
              name: 'Invoice Register',
              icon: CreditCard,
              onClick: () => { setInvoiceProjectFilter(null); setView('invoices'); close(); }
            },
            {
              name: 'Recurring Billing',
              icon: Clock,
              onClick: () => { setAccountingTab('recurring'); setView('accounting'); close(); }
            }
          ]
        },
        {
          name: 'Accounting',
          icon: Building2,
          children: [
            {
              name: 'Hub',
              icon: LayoutDashboard,
              onClick: () => { setAccountingProjectFilter(null); setAccountingTab('landing'); setView('accounting'); close(); }
            },
            {
              name: 'Overview',
              icon: BarChart3,
              onClick: () => { setAccountingProjectFilter(null); setAccountingTab('overview'); setView('accounting'); close(); }
            },
            {
              name: 'Journals',
              icon: Scale,
              onClick: () => { setAccountingProjectFilter(null); setAccountingTab('gl'); setView('accounting'); close(); }
            },
            {
              name: 'Receivables',
              icon: CreditCard,
              onClick: () => { setAccountingProjectFilter(null); setAccountingTab('payments'); setView('accounting'); close(); }
            },
            {
              name: 'Payables',
              icon: Truck,
              onClick: () => { setAccountingProjectFilter(null); setAccountingTab('ap'); setView('accounting'); close(); }
            },
            {
              name: 'Banking',
              icon: Landmark,
              onClick: () => { setAccountingProjectFilter(null); setAccountingTab('bank'); setView('accounting'); close(); }
            },
            {
              name: 'Reconciliation',
              icon: CheckCircle2,
              onClick: () => { setAccountingProjectFilter(null); setAccountingTab('reconciliation'); setView('accounting'); close(); }
            },
            {
              name: 'Costing',
              icon: Briefcase,
              onClick: () => { setAccountingProjectFilter(null); setAccountingTab('project_accounting'); setView('accounting'); close(); }
            },
            {
              name: 'Adjustments',
              icon: Scale,
              onClick: () => { setAccountingProjectFilter(null); setAccountingTab('adjustments'); setView('accounting'); close(); }
            },
            {
              name: 'Parties',
              icon: Users,
              onClick: () => { setAccountingProjectFilter(null); setAccountingTab('parties'); setView('accounting'); close(); }
            },
            {
              name: 'Payroll',
              icon: Users,
              onClick: () => { setAccountingProjectFilter(null); setAccountingTab('payroll'); setView('accounting'); close(); }
            },
            {
              name: 'Statements',
              icon: FileText,
              onClick: () => { setAccountingProjectFilter(null); setAccountingTab('ledgers'); setView('accounting'); close(); }
            },
            {
              name: 'Assets',
              icon: ShieldCheck,
              onClick: () => { setAccountingProjectFilter(null); setAccountingTab('assets_tax_close'); setView('accounting'); close(); }
            },
            {
              name: 'Reports',
              icon: FileText,
              onClick: () => { setAccountingProjectFilter(null); setAccountingTab('reports'); setView('accounting'); close(); }
            }
          ]
        },
        {
          name: 'Reports',
          icon: BarChart3,
          children: [
            {
              name: 'Client Statements',
              icon: FileText,
              onClick: () => { setReportingReport('Statement'); setView('reporting'); close(); }
            },
            {
              name: 'Aging Analysis',
              icon: Clock,
              onClick: () => { setReportingReport('Aging'); setView('reporting'); close(); }
            },
            {
              name: 'Collections Center',
              icon: BarChart3,
              onClick: () => { setReportingReport('Collection'); setView('reporting'); close(); }
            },
            {
              name: 'Retention Tracking',
              icon: ShieldCheck,
              onClick: () => { setReportingReport('Retention'); setView('reporting'); close(); }
            },
            {
              name: 'Bad Debt Reserve',
              icon: Scale,
              onClick: () => { setReportingReport('BadDebt'); setView('reporting'); close(); }
            }
          ]
        },
        {
          name: 'Payroll',
          icon: Users,
          children: [
            {
              name: 'Payroll & WPS Center',
              icon: Users,
              onClick: () => { setView('payroll'); close(); }
            }
          ]
        }
      ]
    },
    {
      name: 'Operations',
      icon: Users,
      children: [
        {
          name: 'Clients CRM',
          icon: User,
          children: [
            {
              name: 'Client Directory',
              icon: User,
              onClick: () => { setView('clients'); close(); }
            },
            {
              name: 'Client Dedicated Portal',
              icon: ExternalLink,
              onClick: () => { setView('portal-view'); close(); }
            }
          ]
        },
        {
          name: 'Workforce',
          icon: Users,
          children: [
            {
              name: 'Workforce Command Hub',
              icon: LayoutDashboard,
              onClick: () => { setResourceTab('landing'); setView('resource-management'); close(); }
            },
            {
              name: 'Personnel Roster',
              icon: Users,
              onClick: () => { setResourceTab('personnel'); setView('resource-management'); close(); }
            },
            {
              name: 'Timesheet Verification',
              icon: Clock,
              onClick: () => { setResourceTab('timesheets'); setView('resource-management'); close(); }
            },
            {
              name: 'Site Deployment',
              icon: HardHat,
              onClick: () => { setResourceTab('deployment'); setView('resource-management'); close(); }
            },
            {
              name: 'Certifications & Badges',
              icon: Medal,
              onClick: () => { setResourceTab('certifications'); setView('resource-management'); close(); }
            }
          ]
        },
        {
          name: 'Equipment',
          icon: Wrench,
          children: [
            {
              name: 'Equipment Command Hub',
              icon: LayoutDashboard,
              onClick: () => { setEquipmentTab('landing'); setView('equipment-management'); close(); }
            },
            {
              name: 'Equipment Inventory',
              icon: Wrench,
              onClick: () => { setEquipmentTab('inventory'); setView('equipment-management'); close(); }
            },
            {
              name: 'Preventive Maintenance',
              icon: Clock,
              onClick: () => { setEquipmentTab('maintenance'); setView('equipment-management'); close(); }
            },
            {
              name: 'Equipment Inspections',
              icon: CheckCircle2,
              onClick: () => { setEquipmentTab('inspections'); setView('equipment-management'); close(); }
            }
          ]
        },
        {
          name: 'Safety & HSE',
          icon: HardHat,
          children: [
            {
              name: 'Safety Command Hub',
              icon: LayoutDashboard,
              onClick: () => { setSiteTab('landing'); setView('site-management'); close(); }
            },
            {
              name: 'Work Permits (PTW)',
              icon: FileText,
              onClick: () => { setSiteTab('permits'); setView('site-management'); close(); }
            },
            {
              name: 'Risk & JSA Control',
              icon: Scale,
              onClick: () => { setSiteTab('risks'); setView('site-management'); close(); }
            },
            {
              name: 'Tags & PPE Stock',
              icon: CheckCircle2,
              onClick: () => { setSiteTab('inspections'); setView('site-management'); close(); }
            },
            {
              name: 'Toolbox & Induction',
              icon: ShieldCheck,
              onClick: () => { setSiteTab('hse'); setView('site-management'); close(); }
            },
            {
              name: 'Incidents & CAPA',
              icon: Info,
              onClick: () => { setSiteTab('incidents'); setView('site-management'); close(); }
            },
            {
              name: 'Emergency & Drills',
              icon: Users,
              onClick: () => { setSiteTab('contacts'); setView('site-management'); close(); }
            }
          ]
        },
        {
          name: 'Quality Assurance',
          icon: ShieldCheck,
          children: [
            {
              name: 'Quality Command Hub',
              icon: LayoutDashboard,
              onClick: () => { setQcTab('landing'); setView('quality-control'); close(); }
            },
            {
              name: 'QC Inspections (ITP)',
              icon: CheckCircle2,
              onClick: () => { setQcTab('inspections'); setView('quality-control'); close(); }
            },
            {
              name: 'Incoming QC (IQC & MTC)',
              icon: Package,
              onClick: () => { setQcTab('iqc'); setView('quality-control'); close(); }
            },
            {
              name: 'Lab & Water Tests',
              icon: Scale,
              onClick: () => { setQcTab('testing'); setView('quality-control'); close(); }
            },
            {
              name: 'NCR & Quarantine',
              icon: ShieldCheck,
              onClick: () => { setQcTab('ncrs'); setView('quality-control'); close(); }
            },
            {
              name: 'Gauge Calibration',
              icon: Wrench,
              onClick: () => { setQcTab('calibration'); setView('quality-control'); close(); }
            },
            {
              name: 'Standards & Handover',
              icon: Medal,
              onClick: () => { setQcTab('standards'); setView('quality-control'); close(); }
            }
          ]
        },
        {
          name: 'Warranty',
          icon: HeartHandshake,
          children: [
            {
              name: 'Warranty Command Hub',
              icon: LayoutDashboard,
              onClick: () => { setWarrantyTab('landing'); setView('after-sales'); close(); }
            },
            {
              name: 'Warranty Certificates',
              icon: HeartHandshake,
              onClick: () => { setWarrantyTab('certificates'); setView('after-sales'); close(); }
            },
            {
              name: 'Service Requests',
              icon: Clock,
              onClick: () => { setWarrantyTab('requests'); setView('after-sales'); close(); }
            },
            {
              name: 'Service History Log',
              icon: History,
              onClick: () => { setWarrantyTab('history'); setView('after-sales'); close(); }
            }
          ]
        }
      ]
    },
    {
      name: 'System',
      icon: ShieldCheck,
      children: [
        {
          name: 'Trust & Telemetry',
          icon: ShieldCheck,
          children: [
            {
              name: 'Document Verification',
              icon: ShieldCheck,
              onClick: () => { setView('verification'); close(); }
            },
            {
              name: 'Stealth Tunnel',
              icon: Radio,
              onClick: () => { setView('stealth-tunnel'); close(); }
            }
          ]
        },
        {
          name: 'Security & Central IAM',
          icon: ShieldCheck,
          children: [
            {
              name: 'Central Access Control Hub',
              icon: ShieldCheck,
              onClick: () => {
                setSettingsInitialTab?.('access-control');
                setSecurityInitialTab?.('dashboard');
                setView('settings');
                close();
              }
            },
            {
              name: '13-Step Evaluation Engine',
              icon: Cpu,
              onClick: () => {
                setSettingsInitialTab?.('access-control');
                setSecurityInitialTab?.('evaluation-engine');
                setView('settings');
                close();
              }
            },
            {
              name: 'Portal Registry (21 Portals)',
              icon: Layers,
              onClick: () => {
                setSettingsInitialTab?.('access-control');
                setSecurityInitialTab?.('portals');
                setView('settings');
                close();
              }
            },
            {
              name: 'User Types (33) & Templates',
              icon: UserCheck,
              onClick: () => {
                setSettingsInitialTab?.('access-control');
                setSecurityInitialTab?.('templates');
                setView('settings');
                close();
              }
            },
            {
              name: 'Project, Factory & Record Scopes',
              icon: Building2,
              onClick: () => {
                setSettingsInitialTab?.('access-control');
                setSecurityInitialTab?.('project-access');
                setView('settings');
                close();
              }
            },
            {
              name: 'External Orgs & Branches',
              icon: FolderTree,
              onClick: () => {
                setSettingsInitialTab?.('access-control');
                setSecurityInitialTab?.('organizations');
                setView('settings');
                close();
              }
            },
            {
              name: 'API Apps & Break-Glass',
              icon: Radio,
              onClick: () => {
                setSettingsInitialTab?.('access-control');
                setSecurityInitialTab?.('api-apps');
                setView('settings');
                close();
              }
            },
            {
              name: 'Ecosystem & Accounts',
              icon: Users,
              onClick: () => {
                setSettingsInitialTab?.('access-control');
                setSecurityInitialTab?.('ecosystem');
                setView('settings');
                close();
              }
            },
            {
              name: 'System Audit Trail',
              icon: Clock,
              onClick: () => { setView('audit-log'); close(); }
            }
          ]
        },
        {
          name: 'Configuration',
          icon: Settings,
          children: [
            {
              name: 'Data Import Center',
              icon: FileSpreadsheet,
              onClick: () => { handleOpenImportModal?.(); close(); }
            },
            {
              name: 'Global Settings',
              icon: Settings,
              onClick: () => { setView('settings'); close(); }
            }
          ]
        }
      ]
    }
  ];

  // 1. Dashboard Tab
  const dashboardItems: NavDropdownItem[] = [
    {
      name: 'Overview',
      icon: Layout,
      isActive: view === 'dashboard' && (!dashboardPerspective || dashboardPerspective === 'overview'),
      onClick: () => { 
        setDashboardPerspective?.('overview');
        setView('dashboard'); 
        close(); 
      }
    },
    {
      name: 'Executive',
      icon: BarChart3,
      isActive: view === 'dashboard' && dashboardPerspective === 'executive',
      onClick: () => { 
        setDashboardPerspective?.('executive');
        setView('dashboard'); 
        close(); 
      }
    },
    {
      name: 'Finance',
      icon: Landmark,
      isActive: view === 'dashboard' && dashboardPerspective === 'finance',
      onClick: () => { 
        setDashboardPerspective?.('finance');
        setView('dashboard'); 
        close(); 
      }
    },
    {
      name: 'Operations',
      icon: HardHat,
      isActive: view === 'dashboard' && dashboardPerspective === 'operations',
      onClick: () => { 
        setDashboardPerspective?.('operations');
        setView('dashboard'); 
        close(); 
      }
    },
    {
      name: 'Quality',
      icon: ShieldCheck,
      isActive: view === 'dashboard' && dashboardPerspective === 'quality',
      onClick: () => { 
        setDashboardPerspective?.('quality');
        setView('dashboard'); 
        close(); 
      }
    },
    {
      name: 'CRM',
      icon: HeartHandshake,
      isActive: view === 'dashboard' && dashboardPerspective === 'crm',
      onClick: () => { 
        setDashboardPerspective?.('crm');
        setView('dashboard'); 
        close(); 
      }
    },
    {
      name: 'Analytics',
      icon: Cpu,
      isActive: view === 'pricing-intelligence' || (view === 'dashboard' && dashboardPerspective === 'analytics'),
      onClick: () => { 
        setDashboardPerspective?.('analytics');
        setView('dashboard'); 
        close(); 
      }
    },
    {
      name: 'Portals',
      icon: Layers,
      children: allPortalsItems
    },
    {
      name: 'Pricing',
      icon: TrendingUp,
      isActive: view === 'pricing-intelligence' || (view === 'dashboard' && dashboardPerspective === 'analytics'),
      onClick: () => { 
        setDashboardPerspective?.('analytics');
        setView('dashboard'); 
        close(); 
      }
    }
  ];

  // 2. Quotes Tab
  const quotesItems: NavDropdownItem[] = [
    {
      name: 'Register',
      icon: History,
      isActive: view === 'history',
      badge: quotesCount > 0 ? String(quotesCount) : undefined,
      onClick: () => { setView('history'); close(); }
    },
    {
      name: 'Editor',
      icon: FileText,
      isActive: view === 'editor',
      onClick: () => { setView('editor'); close(); }
    },
    {
      name: 'Catalog',
      icon: Layers,
      children: [
        {
          name: 'Library',
          icon: Store,
          onClick: () => { setCatalogInitialTab('OVERVIEW'); setShowCatalog(true); close(); }
        },
        {
          name: 'Categories',
          icon: FolderTree,
          onClick: () => { setCatalogInitialTab('CATEGORIES'); setShowCatalog(true); close(); }
        }
      ]
    },
    {
      name: 'Products',
      icon: Package,
      children: [
        {
          name: 'BOQ',
          icon: Package,
          onClick: () => { setBoqInitialTab('CATEGORIES_ITEMS'); setView('boq-items'); close(); }
        },
        {
          name: 'Variants',
          icon: SlidersHorizontal,
          children: [
            {
              name: 'Matrix',
              icon: SlidersHorizontal,
              onClick: () => { setBoqInitialTab('VARIANTS_LIST'); setView('boq-items'); close(); }
            },
            {
              name: 'Analytics',
              icon: TrendingUp,
              onClick: () => { setBoqInitialTab('VARIANTS_LIST'); setView('boq-items'); close(); }
            }
          ]
        },
        {
          name: 'Specs',
          icon: Cpu,
          onClick: () => { setBoqInitialTab('SPEC_ENGINE'); setView('boq-items'); close(); }
        },
        {
          name: 'Pricing',
          icon: TrendingUp,
          onClick: () => { setBoqInitialTab('PRICING_INTELLIGENCE'); setView('boq-items'); close(); }
        }
      ]
    },
    {
      name: 'Templates',
      icon: Sliders,
      onClick: () => { setShowTemplateManager(true); close(); }
    },
    {
      name: 'Create',
      icon: Plus,
      onClick: () => { handleNewQuote(); close(); }
    }
  ];

  // 3. Invoices Tab
  const invoicesItems: NavDropdownItem[] = [
    {
      name: 'Register',
      icon: CreditCard,
      isActive: view === 'invoices',
      badge: invoicesCount > 0 ? String(invoicesCount) : undefined,
      onClick: () => { setInvoiceProjectFilter(null); setView('invoices'); close(); }
    },
    {
      name: 'Billing',
      icon: FileText,
      children: [
        {
          name: 'Pending',
          icon: Clock,
          onClick: () => { setInvoiceProjectFilter(null); setView('invoices'); close(); }
        },
        {
          name: 'Paid',
          icon: CheckCircle2,
          onClick: () => { setInvoiceProjectFilter(null); setView('invoices'); close(); }
        },
        {
          name: 'Overdue',
          icon: Info,
          onClick: () => { setInvoiceProjectFilter(null); setView('invoices'); close(); }
        }
      ]
    },
    {
      name: 'Recurring',
      icon: Clock,
      onClick: () => { setAccountingTab('recurring'); setView('accounting'); close(); }
    },
    {
      name: 'Ledgers',
      icon: Building2,
      onClick: () => { setAccountingTab('ledgers'); setView('accounting'); close(); }
    },
    {
      name: 'Collections',
      icon: BarChart3,
      children: [
        {
          name: 'Aging',
          icon: Clock,
          onClick: () => { setReportingReport('Aging'); setView('reporting'); close(); }
        },
        {
          name: 'Retention',
          icon: Scale,
          onClick: () => { setReportingReport('Retention'); setView('reporting'); close(); }
        },
        {
          name: 'BadDebt',
          icon: Info,
          onClick: () => { setReportingReport('BadDebt'); setView('reporting'); close(); }
        }
      ]
    },
    {
      name: 'Create',
      icon: Plus,
      onClick: () => { setInvoiceProjectFilter(null); setView('invoices'); close(); }
    }
  ];

  // 4. Products Tab
  const productsItems: NavDropdownItem[] = [
    {
      name: 'Catalog',
      icon: Store,
      children: [
        {
          name: 'Library',
          icon: Store,
          onClick: () => { setCatalogInitialTab('OVERVIEW'); setShowCatalog(true); close(); }
        },
        {
          name: 'Categories',
          icon: FolderTree,
          onClick: () => { setCatalogInitialTab('CATEGORIES'); setShowCatalog(true); close(); }
        }
      ]
    },
    {
      name: 'BOQ',
      icon: Package,
      children: [
        {
          name: 'Registry',
          icon: Package,
          onClick: () => { setBoqInitialTab('CATEGORIES_ITEMS'); setView('boq-items'); close(); }
        },
        {
          name: 'Variants',
          icon: SlidersHorizontal,
          children: [
            {
              name: 'Matrix',
              icon: SlidersHorizontal,
              onClick: () => { setBoqInitialTab('VARIANTS_LIST'); setView('boq-items'); close(); }
            },
            {
              name: 'Analytics',
              icon: TrendingUp,
              onClick: () => { setBoqInitialTab('VARIANTS_LIST'); setView('boq-items'); close(); }
            }
          ]
        },
        {
          name: 'Specs',
          icon: Cpu,
          onClick: () => { setBoqInitialTab('SPEC_ENGINE'); setView('boq-items'); close(); }
        },
        {
          name: 'Pricing',
          icon: TrendingUp,
          onClick: () => { setBoqInitialTab('PRICING_INTELLIGENCE'); setView('boq-items'); close(); }
        }
      ]
    },
    {
      name: 'Templates',
      icon: Sliders,
      onClick: () => { setShowTemplateManager(true); close(); }
    },
    {
      name: 'Import',
      icon: FileSpreadsheet,
      onClick: () => { handleOpenImportModal('boq_items'); close(); }
    }
  ];

  // 5. Projects Tab
  const projectsItems: NavDropdownItem[] = [
    {
      name: 'Directory',
      icon: CheckCircle2,
      isActive: view === 'projects' || view === 'project-details',
      badge: projectsCount > 0 ? String(projectsCount) : undefined,
      onClick: () => { setView('projects'); close(); }
    },
    {
      name: 'Variations',
      icon: Plus,
      isActive: view === 'variation-manager',
      onClick: () => { setView('variation-manager'); close(); }
    },
    {
      name: 'Lifecycle',
      icon: GanttChart,
      isActive: view === 'project-lifecycle',
      children: [
        {
          name: 'Dashboard',
          icon: Layout,
          onClick: () => { setLifecycleTab('dashboard'); setView('project-lifecycle'); close(); }
        },
        {
          name: 'Phases',
          icon: FolderTree,
          onClick: () => { setLifecycleTab('phases'); setView('project-lifecycle'); close(); }
        },
        {
          name: 'Gantt',
          icon: GanttChart,
          onClick: () => { setLifecycleTab('dashboard'); setView('project-lifecycle'); close(); }
        },
        {
          name: 'Risks',
          icon: ShieldCheck,
          onClick: () => { setLifecycleTab('risks'); setView('project-lifecycle'); close(); }
        },
        {
          name: 'Handover',
          icon: CheckCircle2,
          onClick: () => { setLifecycleTab('handover'); setView('project-lifecycle'); close(); }
        }
      ]
    },
    {
      name: 'Evaluation',
      icon: Scale,
      isActive: view === 'post-evaluation',
      children: [
        {
          name: 'Variance',
          icon: Scale,
          onClick: () => { setView('post-evaluation'); close(); }
        },
        {
          name: 'Costs',
          icon: CreditCard,
          onClick: () => { setView('post-evaluation'); close(); }
        },
        {
          name: 'PostMortem',
          icon: FileText,
          onClick: () => { setView('post-evaluation'); close(); }
        }
      ]
    },
    {
      name: 'Create',
      icon: Plus,
      onClick: () => { handleCreateProject(); close(); }
    }
  ];

  // 6. Finance Tab
  const financeItems: NavDropdownItem[] = [
    {
      name: 'Accounting',
      icon: Building2,
      isActive: view === 'accounting',
      children: [
        {
          name: 'Hub',
          icon: LayoutDashboard,
          onClick: () => { setAccountingTab('landing'); setView('accounting'); close(); }
        },
        {
          name: 'Overview',
          icon: Layout,
          onClick: () => { setAccountingTab('overview'); setView('accounting'); close(); }
        },
        {
          name: 'Ledger',
          icon: Scale,
          onClick: () => { setAccountingTab('gl'); setView('accounting'); close(); }
        },
        {
          name: 'Receivables',
          icon: CreditCard,
          onClick: () => { setAccountingTab('payments'); setView('accounting'); close(); }
        },
        {
          name: 'Payables',
          icon: Truck,
          onClick: () => { setAccountingTab('ap'); setView('accounting'); close(); }
        },
        {
          name: 'Banking',
          icon: Landmark,
          onClick: () => { setAccountingTab('bank'); setView('accounting'); close(); }
        },
        {
          name: 'Reconciliation',
          icon: CheckCircle2,
          onClick: () => { setAccountingTab('reconciliation'); setView('accounting'); close(); }
        },
        {
          name: 'Costing',
          icon: Briefcase,
          onClick: () => { setAccountingTab('project_accounting'); setView('accounting'); close(); }
        },
        {
          name: 'Retentions',
          icon: SlidersHorizontal,
          onClick: () => { setAccountingTab('adjustments'); setView('accounting'); close(); }
        },
        {
          name: 'Parties',
          icon: Users,
          onClick: () => { setAccountingTab('parties'); setView('accounting'); close(); }
        },
        {
          name: 'Payroll',
          icon: Users,
          onClick: () => { setAccountingTab('payroll'); setView('accounting'); close(); }
        },
        {
          name: 'Ledgers',
          icon: FileText,
          onClick: () => { setAccountingTab('ledgers'); setView('accounting'); close(); }
        },
        {
          name: 'Assets',
          icon: ShieldCheck,
          onClick: () => { setAccountingTab('assets_tax_close'); setView('accounting'); close(); }
        },
        {
          name: 'Reports',
          icon: BarChart3,
          onClick: () => { setAccountingTab('reports'); setView('accounting'); close(); }
        },
        {
          name: 'Recurring Billing',
          icon: Clock,
          onClick: () => { setAccountingTab('recurring'); setView('accounting'); close(); }
        }
      ]
    },
    {
      name: 'Reports',
      icon: BarChart3,
      isActive: view === 'reporting',
      children: [
        {
          name: 'Statements',
          icon: FileText,
          onClick: () => { setReportingReport('Statement'); setView('reporting'); close(); }
        },
        {
          name: 'Aging',
          icon: Clock,
          onClick: () => { setReportingReport('Aging'); setView('reporting'); close(); }
        },
        {
          name: 'Collections',
          icon: BarChart3,
          onClick: () => { setReportingReport('Collection'); setView('reporting'); close(); }
        },
        {
          name: 'Retentions',
          icon: Scale,
          onClick: () => { setReportingReport('Retention'); setView('reporting'); close(); }
        },
        {
          name: 'Projects',
          icon: CheckCircle2,
          onClick: () => { setReportingReport('Project'); setView('reporting'); close(); }
        },
        {
          name: 'BadDebt',
          icon: Info,
          onClick: () => { setReportingReport('BadDebt'); setView('reporting'); close(); }
        }
      ]
    },
    {
      name: 'Invoices',
      icon: CreditCard,
      onClick: () => { setInvoiceProjectFilter(null); setView('invoices'); close(); }
    },
    {
      name: 'Payroll & WPS',
      icon: Landmark,
      isActive: view === 'payroll',
      onClick: () => { setView('payroll'); close(); }
    },
    {
      name: 'Export',
      icon: Download,
      onClick: () => { setIsDownloadPortalOpen(true); close(); }
    }
  ];

  // Procurement & Supply Chain Tab
  const procurementItems: NavDropdownItem[] = [
    {
      name: 'Overview & Cockpit',
      icon: LayoutDashboard,
      onClick: () => { setProcurementTab?.('overview'); setView('procurement'); close(); }
    },
    {
      name: 'Cost Items Hub & MOQ Rates',
      icon: DollarSign,
      onClick: () => { setProcurementTab?.('costing'); setView('procurement-costs'); close(); }
    },
    {
      name: 'Sourcing & RFQ',
      icon: ClipboardList,
      children: [
        {
          name: 'Requisitions',
          icon: Plus,
          children: [
            {
              name: 'Requisitions (PR)',
              icon: Plus,
              onClick: () => { setProcurementTab?.('pr'); setView('procurement'); close(); }
            },
            {
              name: 'Approvals Queue',
              icon: Clock,
              onClick: () => { setProcurementTab?.('pr'); setView('procurement'); close(); }
            }
          ]
        },
        {
          name: 'Quotations',
          icon: ClipboardList,
          children: [
            {
              name: 'RFQs & Sourcing Bids',
              icon: ClipboardList,
              onClick: () => { setProcurementTab?.('rfq'); setView('procurement'); close(); }
            },
            {
              name: 'Bid Comparison',
              icon: BarChart3,
              onClick: () => { setProcurementTab?.('rfq'); setView('procurement'); close(); }
            }
          ]
        },
        {
          name: 'Auctions',
          icon: Radio,
          children: [
            {
              name: 'Live Dutch Auctions',
              icon: Radio,
              onClick: () => { setProcurementTab?.('auctions'); setView('procurement'); close(); }
            },
            {
              name: 'Auction History',
              icon: History,
              onClick: () => { setProcurementTab?.('auctions'); setView('procurement'); close(); }
            }
          ]
        },
        {
          name: 'Emergency',
          icon: HardHat,
          children: [
            {
              name: 'Safety Fast-Track',
              icon: HardHat,
              onClick: () => { setProcurementTab?.('emergency'); setView('procurement'); close(); }
            },
            {
              name: 'Retroactive Audits',
              icon: ShieldCheck,
              onClick: () => { setProcurementTab?.('emergency'); setView('procurement'); close(); }
            }
          ]
        }
      ]
    },
    {
      name: 'Purchasing',
      icon: FileText,
      children: [
        {
          name: 'Orders',
          icon: FileText,
          children: [
            {
              name: 'Purchase Orders (PO)',
              icon: FileText,
              onClick: () => { setProcurementTab?.('pos'); setView('procurement'); close(); }
            },
            {
              name: 'Dual Authorization',
              icon: ShieldCheck,
              onClick: () => { setProcurementTab?.('pos'); setView('procurement'); close(); }
            }
          ]
        },
        {
          name: 'Contracts',
          icon: FileSpreadsheet,
          children: [
            {
              name: 'Framework Contracts',
              icon: FileSpreadsheet,
              onClick: () => { setProcurementTab?.('contracts'); setView('procurement'); close(); }
            },
            {
              name: 'Price Lock Terms',
              icon: Scale,
              onClick: () => { setProcurementTab?.('contracts'); setView('procurement'); close(); }
            }
          ]
        },
        {
          name: 'Vendors',
          icon: Building2,
          children: [
            {
              name: 'Suppliers Directory',
              icon: Building2,
              onClick: () => { setProcurementTab?.('suppliers'); setView('procurement'); close(); }
            },
            {
              name: 'Scorecards & Rating',
              icon: Medal,
              onClick: () => { setProcurementTab?.('suppliers'); setView('procurement'); close(); }
            }
          ]
        }
      ]
    },
    {
      name: 'Logistics',
      icon: PackageCheck,
      children: [
        {
          name: 'Receiving',
          icon: PackageCheck,
          children: [
            {
              name: 'Goods Receipt (GRN)',
              icon: PackageCheck,
              onClick: () => { setProcurementTab?.('grn'); setView('procurement'); close(); }
            },
            {
              name: 'Barcode Scanning',
              icon: Radio,
              onClick: () => { setProcurementTab?.('grn'); setView('procurement'); close(); }
            }
          ]
        },
        {
          name: 'Subcontracts',
          icon: CheckCircle2,
          children: [
            {
              name: 'Service Notes (SCN)',
              icon: CheckCircle2,
              onClick: () => { setProcurementTab?.('scn'); setView('procurement'); close(); }
            },
            {
              name: 'Milestone Signoffs',
              icon: Clock,
              onClick: () => { setProcurementTab?.('scn'); setView('procurement'); close(); }
            }
          ]
        },
        {
          name: 'Inventory',
          icon: Package,
          children: [
            {
              name: 'Warehouse Stock',
              icon: Package,
              onClick: () => { setProcurementTab?.('inventory'); setView('procurement'); close(); }
            },
            {
              name: 'Reorder Alerts',
              icon: Info,
              onClick: () => { setProcurementTab?.('inventory'); setView('procurement'); close(); }
            }
          ]
        },
        {
          name: 'Reclaim',
          icon: Scale,
          children: [
            {
              name: 'Scrap & Recovery',
              icon: Scale,
              onClick: () => { setProcurementTab?.('scrap'); setView('procurement'); close(); }
            },
            {
              name: 'Project Redirection',
              icon: HardHat,
              onClick: () => { setProcurementTab?.('scrap'); setView('procurement'); close(); }
            }
          ]
        }
      ]
    },
    {
      name: 'Governance',
      icon: ShieldCheck,
      children: [
        {
          name: 'Invoicing',
          icon: CreditCard,
          children: [
            {
              name: '3-Way Match Invoices',
              icon: CreditCard,
              onClick: () => { setProcurementTab?.('invoices'); setView('procurement'); close(); }
            },
            {
              name: 'PVC Authorization',
              icon: ShieldCheck,
              onClick: () => { setProcurementTab?.('invoices'); setView('procurement'); close(); }
            }
          ]
        },
        {
          name: 'Quality',
          icon: ShieldCheck,
          children: [
            {
              name: 'Quality NCR Holds',
              icon: ShieldCheck,
              onClick: () => { setProcurementTab?.('ncrs'); setView('procurement'); close(); }
            },
            {
              name: 'Debit Intercept',
              icon: Scale,
              onClick: () => { setProcurementTab?.('ncrs'); setView('procurement'); close(); }
            }
          ]
        },
        {
          name: 'Analytics',
          icon: BarChart3,
          children: [
            {
              name: 'Spend Intelligence',
              icon: BarChart3,
              onClick: () => { setProcurementTab?.('analytics'); setView('procurement'); close(); }
            },
            {
              name: 'HHI Concentration',
              icon: Cpu,
              onClick: () => { setProcurementTab?.('analytics'); setView('procurement'); close(); }
            }
          ]
        }
      ]
    }
  ];

  // 7. Operations Tab
  const operationsItems: NavDropdownItem[] = [
    {
      name: 'Human Capital (HR)',
      icon: Users,
      isActive: view === 'operational-control',
      children: [
        {
          name: 'Executive Overview',
          icon: Building2,
          onClick: () => { hrService.setActiveSubPortal('executive'); setOperationalPortalId?.('hr'); setView('operational-control'); close(); }
        },
        {
          name: 'Employee Directory',
          icon: Users,
          onClick: () => { hrService.setActiveSubPortal('admin'); setOperationalPortalId?.('hr'); setView('operational-control'); close(); }
        },
        {
          name: 'Recruitment (ATS)',
          icon: Briefcase,
          onClick: () => { hrService.setActiveSubPortal('recruitment'); setOperationalPortalId?.('hr'); setView('operational-control'); close(); }
        },
        {
          name: 'Self-Service (ESS)',
          icon: UserCheck,
          onClick: () => { hrService.setActiveSubPortal('ess'); setOperationalPortalId?.('hr'); setView('operational-control'); close(); }
        },
        {
          name: 'Manager Portal (MSS)',
          icon: ShieldCheck,
          onClick: () => { hrService.setActiveSubPortal('mss'); setOperationalPortalId?.('hr'); setView('operational-control'); close(); }
        },
        {
          name: 'Attendance & Clock',
          icon: Clock,
          onClick: () => { hrService.setActiveSubPortal('attendance'); setOperationalPortalId?.('hr'); setView('operational-control'); close(); }
        },
        {
          name: 'Performance Cycles',
          icon: Award,
          onClick: () => { hrService.setActiveSubPortal('performance'); setOperationalPortalId?.('hr'); setView('operational-control'); close(); }
        },
        {
          name: 'Skills & LMS',
          icon: GraduationCap,
          onClick: () => { hrService.setActiveSubPortal('learning'); setOperationalPortalId?.('hr'); setView('operational-control'); close(); }
        },
        {
          name: 'Relations & Cases',
          icon: AlertCircle,
          onClick: () => { hrService.setActiveSubPortal('relations'); setOperationalPortalId?.('hr'); setView('operational-control'); close(); }
        },
        {
          name: 'Compliance Vault',
          icon: FileText,
          onClick: () => { hrService.setActiveSubPortal('documents'); setOperationalPortalId?.('hr'); setView('operational-control'); close(); }
        },
        {
          name: 'Workforce Planning',
          icon: TrendingUp,
          onClick: () => { hrService.setActiveSubPortal('planning'); setOperationalPortalId?.('hr'); setView('operational-control'); close(); }
        },
        {
          name: 'HR Analytics',
          icon: BarChart3,
          onClick: () => { hrService.setActiveSubPortal('analytics'); setOperationalPortalId?.('hr'); setView('operational-control'); close(); }
        }
      ]
    },
    {
      name: 'Clients',
      icon: User,
      isActive: view === 'clients',
      badge: clientsCount > 0 ? String(clientsCount) : undefined,
      children: [
        {
          name: 'Directory',
          icon: Users,
          onClick: () => { setView('clients'); close(); }
        },
        {
          name: 'Portal',
          icon: ExternalLink,
          onClick: () => {
            if (!selectedPortalClient && clients.length > 0) setSelectedPortalClient(clients[0]);
            setView('portal-view');
            close();
          }
        }
      ]
    },
    {
      name: 'Workforce',
      icon: Users,
      isActive: view === 'resource-management',
      badge: personnelCount > 0 ? String(personnelCount) : undefined,
      children: [
        {
          name: 'Personnel',
          icon: User,
          onClick: () => { setResourceTab('personnel'); setView('resource-management'); close(); }
        },
        {
          name: 'Timesheets',
          icon: Clock,
          onClick: () => { setResourceTab('timesheets'); setView('resource-management'); close(); }
        },
        {
          name: 'Deployment',
          icon: HardHat,
          onClick: () => { setResourceTab('deployment'); setView('resource-management'); close(); }
        },
        {
          name: 'Certifications',
          icon: Medal,
          onClick: () => { setResourceTab('certifications'); setView('resource-management'); close(); }
        }
      ]
    },
    {
      name: 'Equipment',
      icon: Wrench,
      isActive: view === 'equipment-management',
      badge: equipmentCount > 0 ? String(equipmentCount) : undefined,
      children: [
        {
          name: 'Inventory',
          icon: Package,
          onClick: () => { setEquipmentTab('inventory'); setView('equipment-management'); close(); }
        },
        {
          name: 'Maintenance',
          icon: Wrench,
          onClick: () => { setEquipmentTab('maintenance'); setView('equipment-management'); close(); }
        },
        {
          name: 'Inspections',
          icon: ShieldCheck,
          onClick: () => { setEquipmentTab('inspections'); setView('equipment-management'); close(); }
        }
      ]
    },
    {
      name: 'Safety',
      icon: HardHat,
      isActive: view === 'site-management',
      children: [
        {
          name: 'Command Hub',
          icon: LayoutDashboard,
          onClick: () => { setSiteTab('landing'); setView('site-management'); close(); }
        },
        {
          name: 'Permits (PTW)',
          icon: FileText,
          onClick: () => { setSiteTab('permits'); setView('site-management'); close(); }
        },
        {
          name: 'Risk & JSA',
          icon: Scale,
          onClick: () => { setSiteTab('risks'); setView('site-management'); close(); }
        },
        {
          name: 'Tags & PPE',
          icon: CheckCircle2,
          onClick: () => { setSiteTab('inspections'); setView('site-management'); close(); }
        },
        {
          name: 'Toolbox & Induction',
          icon: ShieldCheck,
          onClick: () => { setSiteTab('hse'); setView('site-management'); close(); }
        },
        {
          name: 'Incidents & CAPA',
          icon: Info,
          onClick: () => { setSiteTab('incidents'); setView('site-management'); close(); }
        },
        {
          name: 'Emergency & Drills',
          icon: Users,
          onClick: () => { setSiteTab('contacts'); setView('site-management'); close(); }
        }
      ]
    },
    {
      name: 'Quality',
      icon: ShieldCheck,
      isActive: view === 'quality-control',
      badge: ncrsCount > 0 ? String(ncrsCount) : undefined,
      children: [
        {
          name: 'Command Hub',
          icon: LayoutDashboard,
          onClick: () => { setQcTab('landing'); setView('quality-control'); close(); }
        },
        {
          name: 'Inspections (ITP)',
          icon: CheckCircle2,
          onClick: () => { setQcTab('inspections'); setView('quality-control'); close(); }
        },
        {
          name: 'Incoming QC (IQC)',
          icon: Package,
          onClick: () => { setQcTab('iqc'); setView('quality-control'); close(); }
        },
        {
          name: 'Lab & Water Tests',
          icon: Scale,
          onClick: () => { setQcTab('testing'); setView('quality-control'); close(); }
        },
        {
          name: 'NCR & Quarantine',
          icon: Info,
          onClick: () => { setQcTab('ncrs'); setView('quality-control'); close(); }
        },
        {
          name: 'Gauge Calibration',
          icon: Wrench,
          onClick: () => { setQcTab('calibration'); setView('quality-control'); close(); }
        },
        {
          name: 'Standards & Handover',
          icon: Medal,
          onClick: () => { setQcTab('standards'); setView('quality-control'); close(); }
        }
      ]
    },
    {
      name: 'Warranty',
      icon: Medal,
      isActive: view === 'after-sales' || view === 'warranty',
      badge: warrantyCount > 0 ? String(warrantyCount) : undefined,
      children: [
        {
          name: 'Certificates',
          icon: FileText,
          onClick: () => { setWarrantyTab('certificates'); setView('after-sales'); close(); }
        },
        {
          name: 'Requests',
          icon: Clock,
          onClick: () => { setWarrantyTab('requests'); setView('after-sales'); close(); }
        },
        {
          name: 'History',
          icon: History,
          onClick: () => { setWarrantyTab('history'); setView('after-sales'); close(); }
        }
      ]
    }
  ];

  // 8. System Tab
  const systemItems: NavDropdownItem[] = [
    {
      name: 'Trust',
      icon: ShieldCheck,
      isActive: view === 'verification',
      children: [
        {
          name: 'Verification',
          icon: ShieldCheck,
          onClick: () => { setView('verification'); close(); }
        },
        {
          name: 'Registry',
          icon: FileText,
          onClick: () => { setView('verification'); close(); }
        },
        {
          name: 'Codes',
          icon: Radio,
          onClick: () => { setView('verification'); close(); }
        }
      ]
    },
    {
      name: 'Tunnel',
      icon: Radio,
      isActive: view === 'stealth-tunnel',
      onClick: () => { setView('stealth-tunnel'); close(); }
    },
    {
      name: 'Central IAM & RBAC',
      icon: ShieldCheck,
      isActive: view === 'settings',
      children: [
        {
          name: 'Central Control Hub',
          icon: ShieldCheck,
          onClick: () => {
            setSettingsInitialTab?.('access-control');
            setSecurityInitialTab?.('dashboard');
            setView('settings');
            close();
          }
        },
        {
          name: '13-Step Policy Simulator',
          icon: Cpu,
          onClick: () => {
            setSettingsInitialTab?.('access-control');
            setSecurityInitialTab?.('evaluation-engine');
            setView('settings');
            close();
          }
        },
        {
          name: 'Portal Registry (21)',
          icon: Layers,
          onClick: () => {
            setSettingsInitialTab?.('access-control');
            setSecurityInitialTab?.('portals');
            setView('settings');
            close();
          }
        },
        {
          name: 'User Types & Templates',
          icon: UserCheck,
          onClick: () => {
            setSettingsInitialTab?.('access-control');
            setSecurityInitialTab?.('templates');
            setView('settings');
            close();
          }
        },
        {
          name: 'Project & Factory Scopes',
          icon: Building2,
          onClick: () => {
            setSettingsInitialTab?.('access-control');
            setSecurityInitialTab?.('project-access');
            setView('settings');
            close();
          }
        },
        {
          name: 'External Orgs & Branches',
          icon: FolderTree,
          onClick: () => {
            setSettingsInitialTab?.('access-control');
            setSecurityInitialTab?.('organizations');
            setView('settings');
            close();
          }
        },
        {
          name: 'Users & Role Matrix',
          icon: Users,
          onClick: () => {
            setSettingsInitialTab?.('access-control');
            setSecurityInitialTab?.('users');
            setView('settings');
            close();
          }
        },
        {
          name: 'API Apps & Break-Glass',
          icon: Radio,
          onClick: () => {
            setSettingsInitialTab?.('access-control');
            setSecurityInitialTab?.('api-apps');
            setView('settings');
            close();
          }
        }
      ]
    },
    {
      name: 'Audit',
      icon: Clock,
      isActive: view === 'audit-log',
      badge: auditCount > 0 ? String(auditCount) : undefined,
      onClick: () => { setView('audit-log'); close(); }
    },
    {
      name: 'Import',
      icon: FileSpreadsheet,
      onClick: () => { handleOpenImportModal(); close(); }
    },
    {
      name: 'Settings',
      icon: Settings,
      isActive: view === 'settings',
      onClick: () => { setView('settings'); close(); }
    }
  ];

  // 9. Factories Portal Items (Factory, Workshop & Site Execution Portal)
  const operationalControlItems: NavDropdownItem[] = [
    {
      name: 'Factories',
      icon: Building2,
      onClick: () => {
        if (setOperationalPortalId) setOperationalPortalId('factories');
        setView('operational-control');
        close();
      }
    },
    {
      name: 'Assignments',
      icon: CheckCircle2,
      onClick: () => {
        if (setOperationalPortalId) setOperationalPortalId('work_packages');
        setView('operational-control');
        close();
      }
    },
    {
      name: 'Tasks',
      icon: Wrench,
      onClick: () => {
        if (setOperationalPortalId) setOperationalPortalId('tasks_planning');
        setView('operational-control');
        close();
      }
    },
    {
      name: 'Worksheets',
      icon: FileSpreadsheet,
      onClick: () => {
        if (setOperationalPortalId) setOperationalPortalId('worksheets_daily');
        setView('operational-control');
        close();
      }
    },
    {
      name: 'Resources',
      icon: Cpu,
      onClick: () => {
        if (setOperationalPortalId) setOperationalPortalId('resources_materials');
        setView('operational-control');
        close();
      }
    },
    {
      name: 'Quality',
      icon: ShieldCheck,
      onClick: () => {
        if (setOperationalPortalId) setOperationalPortalId('quality_hse');
        setView('operational-control');
        close();
      }
    },
    {
      name: 'Dispatch',
      icon: Truck,
      onClick: () => {
        if (setOperationalPortalId) setOperationalPortalId('dispatch_site');
        setView('operational-control');
        close();
      }
    },
    {
      name: 'Documents',
      icon: FileText,
      onClick: () => {
        if (setOperationalPortalId) setOperationalPortalId('documents_drawings');
        setView('operational-control');
        close();
      }
    },
    {
      name: 'Analytics',
      icon: BarChart3,
      onClick: () => {
        if (setOperationalPortalId) setOperationalPortalId('analytics_audit');
        setView('operational-control');
        close();
      }
    },
    {
      name: 'Partners',
      icon: Users,
      onClick: () => {
        if (setOperationalPortalId) setOperationalPortalId('partner_portal');
        setView('operational-control');
        close();
      }
    },
    {
      name: 'Hub',
      icon: LayoutDashboard,
      onClick: () => {
        if (setOperationalPortalId) setOperationalPortalId('dashboard');
        setView('operational-control');
        close();
      }
    }
  ];

  const homeItems: NavDropdownItem[] = [
    {
      name: 'Launch Home Center',
      icon: Home,
      badge: 'Main',
      onClick: () => { setView('home'); close(); }
    },
    {
      name: 'Universal Portals Directory',
      icon: Layers,
      onClick: () => { setView('home'); close(); }
    },
    {
      name: 'Quick Action Hub',
      icon: Plus,
      onClick: () => { setView('home'); close(); }
    }
  ];

  // --- CENTRAL PORTAL & PERMISSION AUTHORIZATION FILTERING ---
  const activeUserId = params.userId;
  const activeUser = activeUserId ? securityService.getUserById(activeUserId) : undefined;
  const isSuperAdmin =
    !activeUser ||
    activeUser.roleId === 'role-superadmin' ||
    activeUser.adminAuthorityLevel === 'SUPER_ADMINISTRATOR';

  const canPortal = (portalId: CentralPortalId): boolean => {
    if (isSuperAdmin || !activeUserId) return true;
    return securityService.canAccessPortal(activeUserId, portalId);
  };

  const canPerm = (permCode: string): boolean => {
    if (isSuperAdmin || !activeUserId) return true;
    return securityService.hasPermission(activeUserId, permCode);
  };

  const filteredOperationalItems = isSuperAdmin
    ? operationalControlItems
    : operationalControlItems.filter(item => {
        switch (item.name) {
          case 'Factories':
            return canPortal('factory-workshop-management') && canPerm('factory.view');
          case 'Assignments':
          case 'Hub':
            return (
              (canPortal('factory-workshop-management') && canPerm('factory.view')) ||
              (canPortal('production-control') && canPerm('production.view'))
            );
          case 'Tasks':
          case 'Worksheets':
            return (
              (canPortal('production-control') && canPerm('production.view')) ||
              (canPortal('factory-workshop-management') && canPerm('factory.view'))
            );
          case 'Resources':
            return (
              (canPortal('equipment-machinery') && canPerm('equipment.view')) ||
              (canPortal('inventory-warehouse') && canPerm('inventory.view')) ||
              (canPortal('factory-workshop-management') && canPerm('factory.manage'))
            );
          case 'Quality':
            return (
              (canPortal('quality-assurance') && canPerm('qc.view')) ||
              (canPortal('hse-safety') && canPerm('hse.view'))
            );
          case 'Dispatch':
            return (
              (canPortal('logistics-dispatch') && canPerm('logistics.view')) ||
              (canPortal('factory-workshop-management') && canPerm('factory.manage'))
            );
          case 'Documents':
            return canPortal('document-control') && canPerm('document.view');
          case 'Analytics':
            return canPortal('reporting-analytics') && canPerm('reports.view');
          case 'Partners':
            return (
              (canPortal('partner-factory-portal') && canPerm('subcontractor.view')) ||
              (canPortal('factory-workshop-management') && canPerm('factory.manage'))
            );
          default:
            return false;
        }
      });

  const filteredQuotesItems = isSuperAdmin
    ? quotesItems
    : canPortal('sales-crm-quotes') && canPerm('quotes.view')
    ? quotesItems.filter(item => {
        if (item.name === 'Register') return canPerm('quotes.view');
        if (item.name === 'Editor') return canPerm('quotes.edit') || canPerm('quotes.create') || canPerm('quotes.view');
        if (item.name === 'Catalog' || item.name === 'Products') return canPortal('engineering-qs-boq') && canPerm('boq.view');
        if (item.name === 'Templates') return canPerm('quotes.edit') || canPerm('quotes.create');
        if (item.name === 'Create') return canPerm('quotes.create');
        return false;
      })
    : [];

  const filteredInvoicesItems = isSuperAdmin
    ? invoicesItems
    : canPortal('accounting-finance') && canPerm('finance.view')
    ? invoicesItems.filter(item => {
        if (['Register', 'Billing', 'Recurring', 'Ledgers'].includes(item.name)) return canPerm('finance.view');
        if (item.name === 'Collections') return canPortal('reporting-analytics') && canPerm('reports.view');
        if (item.name === 'Create') return canPerm('finance.create');
        return false;
      })
    : [];

  const filteredProductsItems = isSuperAdmin
    ? productsItems
    : canPortal('engineering-qs-boq') && canPerm('boq.view')
    ? productsItems.filter(item => {
        if (item.name === 'Catalog' || item.name === 'BOQ') return canPerm('boq.view');
        if (item.name === 'Templates') return canPerm('boq.edit') || canPerm('quotes.edit');
        if (item.name === 'Import') return canPortal('system-administration') && canPerm('settings.manage');
        return false;
      })
    : [];

  const filteredProjectsItems = isSuperAdmin
    ? projectsItems
    : canPortal('project-management') && canPerm('project.view')
    ? projectsItems.filter(item => {
        if (item.name === 'Directory' || item.name === 'Lifecycle') return canPerm('project.view');
        if (item.name === 'Variations') return canPerm('variation.view');
        if (item.name === 'Evaluation') return canPerm('project.approve') || canPerm('boq.view') || canPerm('finance.view');
        if (item.name === 'Create') return canPerm('project.create');
        return false;
      })
    : [];

  const hasProcPortal = canPortal('procurement-supply-chain') && canPerm('procurement.view');
  const hasInvPortal = canPortal('inventory-warehouse') && canPerm('inventory.view');
  const hasSupPortal = canPortal('supplier-portal') && canPerm('supplier.view');
  const hasSubPortal = canPortal('partner-factory-portal') && canPerm('subcontractor.view');

  const filteredProcurementItems = isSuperAdmin
    ? procurementItems
    : hasProcPortal || hasInvPortal || hasSupPortal || hasSubPortal
    ? procurementItems.filter(item => {
        if (item.name === 'Overview & Cockpit' || item.name === 'Cost Items Hub & MOQ Rates') {
          return hasProcPortal;
        }
        if (item.name === 'Sourcing & RFQ' || item.name === 'Purchasing') {
          return hasProcPortal || hasSupPortal;
        }
        if (item.name === 'Logistics') {
          return hasProcPortal || hasInvPortal || hasSubPortal;
        }
        if (item.name === 'Governance') {
          return hasProcPortal || hasSupPortal || (canPortal('quality-assurance') && canPerm('qc.view'));
        }
        return false;
      })
    : [];

  const filteredFinanceItems = isSuperAdmin
    ? financeItems
    : financeItems.filter(item => {
        if (item.name === 'Accounting' || item.name === 'Invoices') {
          return canPortal('accounting-finance') && canPerm('finance.view');
        }
        if (item.name === 'Reports') {
          return canPortal('reporting-analytics') && canPerm('reports.view');
        }
        if (item.name === 'Payroll & WPS') {
          return canPortal('human-resources') && canPerm('payroll.view');
        }
        if (item.name === 'Export') {
          return canPortal('reporting-analytics') && canPerm('reports.export');
        }
        return false;
      });

  const filteredOperationsItems = isSuperAdmin
    ? operationsItems
    : operationsItems
        .map(item => {
          if (item.name === 'Human Capital (HR)' || item.name === 'Workforce') {
            return canPortal('human-resources') && canPerm('hr.view') ? item : null;
          }
          if (item.name === 'Clients') {
            const allowedChildren = (item.children || []).filter(ch => {
              if (ch.name === 'Directory') return canPortal('sales-crm-quotes') && canPerm('clients.view');
              if (ch.name === 'Portal') return canPortal('customer-portal') && canPerm('clients.view');
              return false;
            });
            return allowedChildren.length > 0 ? { ...item, children: allowedChildren } : null;
          }
          if (item.name === 'Equipment') {
            return canPortal('equipment-machinery') && canPerm('equipment.view') ? item : null;
          }
          if (item.name === 'Safety') {
            return (canPortal('construction-site-management') && canPerm('site.view')) ||
              (canPortal('hse-safety') && canPerm('hse.view'))
              ? item
              : null;
          }
          if (item.name === 'Quality') {
            return canPortal('quality-assurance') && canPerm('qc.view') ? item : null;
          }
          if (item.name === 'Warranty') {
            return (canPortal('quality-assurance') && canPerm('qc.view')) ||
              (canPortal('customer-portal') && canPerm('clients.view'))
              ? item
              : null;
          }
          return null;
        })
        .filter((i): i is NavDropdownItem => i !== null);

  const filteredSystemItems = isSuperAdmin
    ? systemItems
    : canPortal('system-administration')
    ? systemItems.filter(item => {
        if (item.name === 'Trust') return canPerm('document.view') || canPerm('security.admin');
        if (item.name === 'Tunnel') return canPerm('security.admin');
        if (item.name === 'Central IAM & RBAC') return canPerm('security.admin') || canPerm('security.configure');
        if (item.name === 'Audit') return canPerm('security.audit') || canPerm('security.admin');
        if (item.name === 'Import' || item.name === 'Settings') return canPerm('settings.manage') || canPerm('security.admin');
        return false;
      })
    : [];

  const filteredAllPortalsItems = isSuperAdmin
    ? allPortalsItems
    : [
        ...(filteredProcurementItems.length > 0 ? [{ name: 'Procurement', icon: Truck, children: filteredProcurementItems }] : []),
        ...(filteredOperationalItems.length > 0 ? [{ name: 'Factories', icon: Building2, children: filteredOperationalItems }] : []),
        ...(filteredQuotesItems.length > 0 ? [{ name: 'Quotes', icon: FileText, children: filteredQuotesItems }] : []),
        ...(filteredProjectsItems.length > 0 ? [{ name: 'Projects', icon: CheckCircle2, children: filteredProjectsItems }] : []),
        ...(filteredFinanceItems.length > 0 ? [{ name: 'Finance', icon: Building2, children: filteredFinanceItems }] : []),
        ...(filteredOperationsItems.length > 0 ? [{ name: 'Operations', icon: Users, children: filteredOperationsItems }] : []),
        ...(filteredSystemItems.length > 0 ? [{ name: 'System', icon: ShieldCheck, children: filteredSystemItems }] : [])
      ];

  const filteredDashboardItems = isSuperAdmin
    ? dashboardItems
    : activeUser?.isExternalUser
    ? []
    : dashboardItems
        .map(item => {
          if (item.name === 'Overview') {
            return canPortal('executive-dashboard') || canPerm('reports.view') || canPerm('project.view') || canPerm('finance.view') || canPerm('quotes.view')
              ? item
              : null;
          }
          if (item.name === 'Executive') {
            return (canPortal('executive-dashboard') || canPortal('reporting-analytics')) && canPerm('reports.view') ? item : null;
          }
          if (item.name === 'Finance') {
            return canPortal('accounting-finance') && canPerm('finance.view') ? item : null;
          }
          if (item.name === 'Operations') {
            return (canPortal('project-management') && canPerm('project.view')) ||
              (canPortal('construction-site-management') && canPerm('site.view'))
              ? item
              : null;
          }
          if (item.name === 'Quality') {
            return canPortal('quality-assurance') && canPerm('qc.view') ? item : null;
          }
          if (item.name === 'CRM') {
            return canPortal('sales-crm-quotes') && (canPerm('clients.view') || canPerm('quotes.view')) ? item : null;
          }
          if (item.name === 'Analytics' || item.name === 'Pricing') {
            return (canPortal('reporting-analytics') && canPerm('reports.view')) ||
              (canPortal('engineering-qs-boq') && canPerm('boq.edit'))
              ? item
              : null;
          }
          if (item.name === 'Portals') {
            return filteredAllPortalsItems.length > 0 ? { ...item, children: filteredAllPortalsItems } : null;
          }
          return null;
        })
        .filter((i): i is NavDropdownItem => i !== null);

  const hasDashboardPerspectives = filteredDashboardItems.some(i => i.name !== 'Portals');

  const rawTabs: NavTabConfig[] = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      isActive: view === 'home',
      badge: 'Hub',
      items: homeItems,
      onDirectClick: () => setView('home')
    },
    ...(hasDashboardPerspectives
      ? [
          {
            id: 'dashboard',
            label: 'Dashboard',
            icon: Layout,
            isActive: view === 'dashboard',
            items: filteredDashboardItems,
            onDirectClick: () => setView('dashboard')
          }
        ]
      : []),
    ...((canPortal('factory-workshop-management') || canPortal('production-control')) && filteredOperationalItems.length > 0
      ? [
          {
            id: 'operational-control',
            label: 'Factories',
            icon: Building2,
            isActive: view === 'operational-control',
            badge: 'Live',
            items: filteredOperationalItems,
            onDirectClick: () => {
              if (setOperationalPortalId) setOperationalPortalId('factories');
              setView('operational-control');
            }
          }
        ]
      : []),
    ...(filteredQuotesItems.length > 0
      ? [
          {
            id: 'quotes',
            label: 'Quotes',
            icon: FileText,
            isActive: ['history', 'editor'].includes(view),
            badge: quotesCount > 0 ? String(quotesCount) : undefined,
            items: filteredQuotesItems
          }
        ]
      : []),
    ...(filteredInvoicesItems.length > 0
      ? [
          {
            id: 'invoices',
            label: 'Invoices',
            icon: CreditCard,
            isActive: view === 'invoices',
            badge: invoicesCount > 0 ? String(invoicesCount) : undefined,
            items: filteredInvoicesItems
          }
        ]
      : []),
    ...(filteredProductsItems.length > 0
      ? [
          {
            id: 'products',
            label: 'Products',
            icon: Package,
            isActive: view === 'boq-items' || showCatalog,
            items: filteredProductsItems
          }
        ]
      : []),
    ...(filteredProjectsItems.length > 0
      ? [
          {
            id: 'projects',
            label: 'Projects',
            icon: CheckCircle2,
            isActive: ['projects', 'project-details', 'variation-manager', 'project-lifecycle', 'post-evaluation'].includes(view),
            badge: projectsCount > 0 ? String(projectsCount) : undefined,
            items: filteredProjectsItems
          }
        ]
      : []),
    ...(filteredProcurementItems.length > 0
      ? [
          {
            id: 'procurement',
            label: 'Procurement',
            icon: Truck,
            isActive: view === 'procurement' || view === 'procurement-costs',
            badge: String(filteredProcurementItems.length),
            items: filteredProcurementItems,
            onDirectClick: () => {
              setProcurementTab?.('landing');
              setView('procurement');
            }
          }
        ]
      : []),
    ...(filteredFinanceItems.length > 0
      ? [
          {
            id: 'finance',
            label: 'Finance',
            icon: Building2,
            isActive: ['accounting', 'reporting', 'payroll'].includes(view),
            items: filteredFinanceItems
          }
        ]
      : []),
    ...(filteredOperationsItems.length > 0
      ? [
          {
            id: 'operations',
            label: 'Operations',
            icon: Users,
            isActive: ['clients', 'portal-view', 'customer-portal', 'resource-management', 'equipment-management', 'site-management', 'quality-control', 'after-sales', 'warranty'].includes(view),
            items: filteredOperationsItems
          }
        ]
      : []),
    ...(filteredSystemItems.length > 0
      ? [
          {
            id: 'system',
            label: 'System',
            icon: ShieldCheck,
            isActive: ['verification', 'stealth-tunnel', 'audit-log', 'settings'].includes(view),
            items: filteredSystemItems
          }
        ]
      : [])
  ];

  return rawTabs;
}
