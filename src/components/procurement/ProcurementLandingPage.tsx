import React, { useState, useMemo } from 'react';
import {
  LayoutDashboard,
  DollarSign,
  FileText,
  ShoppingCart,
  FileSpreadsheet,
  Radio,
  Boxes,
  FileCheck,
  CheckCircle2,
  ShieldAlert,
  Layers,
  Scale,
  HardHat,
  FolderOpen,
  Users,
  TrendingUp,
  Plus,
  Search,
  ArrowRight,
  Check,
  RefreshCw,
  Building2,
  Medal,
  FolderTree,
  ShieldCheck,
  BarChart3,
  CreditCard,
  Clock,
  SlidersHorizontal
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useSecurity } from '../../context/SecurityContext';
import { ProcurementTab } from './ProcurementHub';

export interface ProcurementAction {
  id: string;
  name: string;
  badge?: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  action: () => void;
  permissionCode?: string;
}

export interface ProcurementSubSubPortal {
  id: string;
  name: string;
  badge?: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  permissionCode?: string;
  actions: ProcurementAction[];
}

export interface ProcurementSubPortal {
  id: string;
  name: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: string;
  permissionCode?: string;
  tabTarget: ProcurementTab;
  subSubPortals: ProcurementSubSubPortal[];
}

export interface ProcurementDomain {
  id: string;
  name: string;
  shortLabel: string;
  tabTarget: ProcurementTab;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: string | number;
  subPortals: ProcurementSubPortal[];
}

export interface QuickActionItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  action: () => void;
  permission?: string;
  color: string;
}

export interface QuickActionGroup {
  portalId: string;
  portalName: string;
  portalIcon: React.ComponentType<{ size?: number; className?: string }>;
  actions: QuickActionItem[];
}

interface ProcurementLandingPageProps {
  onNavigateTab: (tab: ProcurementTab) => void;
  onOpenNewPo: () => void;
  onOpenNewPr: () => void;
  onOpenNewNcr: () => void;
  onOpenNewScrap: () => void;
  onOpenNewEmergency: () => void;
  onSyncCentral: () => void;
  counts: {
    pos: number;
    pr: number;
    rfq: number;
    auctions: number;
    grn: number;
    scn: number;
    invoices: number;
    ncrs: number;
    inventory: number;
    scrap: number;
    emergency: number;
    contracts: number;
    suppliers: number;
    costItems: number;
    documents: number;
  };
}

export const ProcurementLandingPage: React.FC<ProcurementLandingPageProps> = ({
  onNavigateTab,
  onOpenNewPo,
  onOpenNewPr,
  onOpenNewNcr,
  onOpenNewScrap,
  onOpenNewEmergency,
  onSyncCentral,
  counts
}) => {
  const { currentUser } = useSecurity();

  // Administrator clearance check
  const isAdmin = useMemo(() => {
    if (!currentUser) return true;
    if (currentUser.roleId === 'role-superadmin' || currentUser.id === 'usr-admin-01') return true;
    const roleLower = (currentUser.roleName || '').toLowerCase();
    return roleLower.includes('super administrator') || roleLower.includes('admin') || roleLower.includes('procurement');
  }, [currentUser]);

  // Master 17 Portals Architecture matching 1:1 with all circled items in the user screenshot:
  // Overview, $ Costing, Documents, Orders, Requests, Sourcing, Auctions, Receiving, Services,
  // Invoices, Quality, Stock, Scrap, Emergency, Contracts, Suppliers, Analytics
  const portals: ProcurementDomain[] = useMemo(() => {
    return [
      // 1. OVERVIEW
      {
        id: 'port-overview',
        name: 'Overview',
        shortLabel: 'Overview',
        tabTarget: 'overview',
        icon: LayoutDashboard,
        badge: 'Cockpit',
        subPortals: [
          {
            id: 'sub-ov-ops',
            name: 'Operations & Pulse',
            icon: LayoutDashboard,
            badge: 'Pulse',
            tabTarget: 'overview',
            subSubPortals: [
              {
                id: 'ssp-ov-live',
                name: 'Live Operations Pulse',
                badge: 'Pulse',
                icon: LayoutDashboard,
                actions: [
                  { id: 'act-ov-cockpit', name: 'Open Live Cockpit Hub', badge: 'Hub', action: () => onNavigateTab('overview') },
                  { id: 'act-ov-sync', name: 'Sync Central Database', badge: 'Sync', action: onSyncCentral },
                  { id: 'act-ov-kpis', name: 'Procurement KPIs & Metrics', badge: 'KPIs', action: () => onNavigateTab('overview') },
                  { id: 'act-ov-cat-spend', name: 'Category Spend Distribution', badge: 'Spend', action: () => onNavigateTab('overview') }
                ]
              },
              {
                id: 'ssp-ov-trends',
                name: 'Commitments & Pace',
                badge: 'Trends',
                icon: TrendingUp,
                actions: [
                  { id: 'act-ov-commitments', name: 'Commitments vs Delivered Chart', badge: 'Trends', action: () => onNavigateTab('overview') },
                  { id: 'act-ov-savings', name: 'Procurement Savings Realization', badge: 'Savings', action: () => onNavigateTab('overview') },
                  { id: 'act-ov-burn', name: 'Procurement Burn Rate Pace', badge: 'Burn', action: () => onNavigateTab('overview') }
                ]
              }
            ]
          },
          {
            id: 'sub-ov-risk',
            name: 'Vendor Concentration',
            icon: ShieldCheck,
            badge: 'Risk',
            tabTarget: 'overview',
            subSubPortals: [
              {
                id: 'ssp-ov-exposure',
                name: 'Supplier Risk Exposure',
                badge: 'Risk',
                icon: BarChart3,
                actions: [
                  { id: 'act-ov-top-suppliers', name: 'Top 5 Strategic Suppliers Exposure', badge: 'Exposure', action: () => onNavigateTab('overview') },
                  { id: 'act-ov-delivery-alerts', name: 'Critical Pathway Delivery Alerts', badge: 'Alerts', action: () => onNavigateTab('overview') },
                  { id: 'act-ov-funnel', name: 'Active Sourcing Pipeline Funnel', badge: 'Funnel', action: () => onNavigateTab('overview') }
                ]
              }
            ]
          }
        ]
      },

      // 2. $ COSTING
      {
        id: 'port-costing',
        name: 'Costing & Rates',
        shortLabel: '$ Costing',
        tabTarget: 'costing',
        icon: DollarSign,
        badge: counts.costItems,
        subPortals: [
          {
            id: 'sub-cost-catalog',
            name: 'Material Cost Register',
            icon: DollarSign,
            badge: 'Catalog',
            tabTarget: 'costing',
            subSubPortals: [
              {
                id: 'ssp-cost-mgr',
                name: 'Cost Items Hub',
                badge: 'Items',
                icon: DollarSign,
                actions: [
                  { id: 'act-cost-mgr-open', name: 'Material Cost Items Hub', badge: 'Catalog', action: () => onNavigateTab('costing') },
                  { id: 'act-cost-benchmarks', name: 'Procurement Rate Benchmarks', badge: 'Benchmark', action: () => onNavigateTab('costing') },
                  { id: 'act-cost-variances', name: 'Supplier Rate Variances', badge: 'Delta', action: () => onNavigateTab('costing') },
                  { id: 'act-cost-new-item', name: 'Create Material Cost Item', badge: 'New Item', action: () => onNavigateTab('costing') }
                ]
              },
              {
                id: 'ssp-cost-specs',
                name: 'Variants & Specs Engine',
                badge: 'BOM',
                icon: SlidersHorizontal,
                actions: [
                  { id: 'act-cost-variants', name: 'Material Variant Dimensions Matrix', badge: 'Matrix', action: () => onNavigateTab('costing') },
                  { id: 'act-cost-moq', name: 'Vendor MOQ Price Breaks', badge: 'MOQ', action: () => onNavigateTab('costing') },
                  { id: 'act-cost-dep', name: 'Product Dependency Engine', badge: 'Dependencies', action: () => onNavigateTab('costing') },
                  { id: 'act-cost-qr', name: 'Barcode & QR Item Labels', badge: 'QR', action: () => onNavigateTab('costing') }
                ]
              }
            ]
          },
          {
            id: 'sub-cost-intelligence',
            name: 'Rate Escalation Analysis',
            icon: TrendingUp,
            badge: 'Forecast',
            tabTarget: 'costing',
            subSubPortals: [
              {
                id: 'ssp-cost-forecast',
                name: 'Inflation & Target Margins',
                badge: 'Margin',
                icon: TrendingUp,
                actions: [
                  { id: 'act-cost-escalation', name: 'Material Escalation Forecast', badge: 'Escalation', action: () => onNavigateTab('costing') },
                  { id: 'act-cost-target-margin', name: 'Target Cost vs Quoted Rate Audit', badge: 'Target', action: () => onNavigateTab('costing') },
                  { id: 'act-cost-savings-reg', name: 'Procurement Savings Registry', badge: 'Savings', action: () => onNavigateTab('costing') }
                ]
              }
            ]
          }
        ]
      },

      // 3. DOCUMENTS 89
      {
        id: 'port-documents',
        name: 'Procurement Documents',
        shortLabel: 'Documents',
        tabTarget: 'documents',
        icon: FileText,
        badge: 89,
        subPortals: [
          {
            id: 'sub-doc-setup',
            name: 'Setup & Master Docs (1-22)',
            icon: Building2,
            badge: '1-22',
            tabTarget: 'documents',
            subSubPortals: [
              {
                id: 'ssp-doc-gov',
                name: 'Policies & Onboarding',
                badge: 'Setup',
                icon: FileText,
                actions: [
                  { id: 'act-doc-01', name: 'Procurement Strategy & Policy (Doc 01)', badge: 'Doc 01', action: () => onNavigateTab('documents') },
                  { id: 'act-doc-vendor-kyv', name: 'Vendor Onboarding & Code of Conduct (Docs 02-05)', badge: 'KYV', action: () => onNavigateTab('documents') },
                  { id: 'act-doc-doa', name: 'Spend Thresholds & DOA Matrix (Doc 12)', badge: 'DOA', action: () => onNavigateTab('documents') },
                  { id: 'act-doc-fin-health', name: 'Supplier Financial Health Audit Checklist (Doc 18)', badge: 'Audit', action: () => onNavigateTab('documents') }
                ]
              },
              {
                id: 'ssp-doc-contracts',
                name: 'Standard Contract Forms',
                badge: 'Contracts',
                icon: FolderOpen,
                actions: [
                  { id: 'act-doc-spa', name: 'Standard Purchase Agreement Template (Doc 20)', badge: 'SPA', action: () => onNavigateTab('documents') },
                  { id: 'act-doc-msa', name: 'Master Service Agreement MSA (Doc 22)', badge: 'MSA', action: () => onNavigateTab('documents') }
                ]
              }
            ]
          },
          {
            id: 'sub-doc-project',
            name: 'Project Procurement (23-40)',
            icon: FolderTree,
            badge: '23-40',
            tabTarget: 'documents',
            subSubPortals: [
              {
                id: 'ssp-doc-pps',
                name: 'Schedules & Long Leads',
                badge: 'Schedule',
                icon: FolderTree,
                actions: [
                  { id: 'act-doc-boq-sync', name: 'Bill of Materials BOQ Sync Form (Doc 25)', badge: 'BOQ', action: () => onNavigateTab('documents') },
                  { id: 'act-doc-pps-sched', name: 'Project Procurement Schedule PPS (Doc 28)', badge: 'PPS', action: () => onNavigateTab('documents') },
                  { id: 'act-doc-longlead', name: 'Long-Lead Item Identification Matrix (Doc 32)', badge: 'Lead Time', action: () => onNavigateTab('documents') },
                  { id: 'act-doc-rfq-pkg', name: 'RFQ Package Checklist & Signoff (Doc 38)', badge: 'RFQ', action: () => onNavigateTab('documents') }
                ]
              }
            ]
          },
          {
            id: 'sub-doc-material',
            name: 'Material & Tech (41-89)',
            icon: ShieldCheck,
            badge: '41-89',
            tabTarget: 'documents',
            subSubPortals: [
              {
                id: 'ssp-doc-mtc',
                name: 'MTC & Inspections',
                badge: 'QA/QC',
                icon: ShieldCheck,
                actions: [
                  { id: 'act-doc-mtc-cert', name: 'Mill Test Certificate MTC Verification (Doc 44)', badge: 'MTC', action: () => onNavigateTab('documents') },
                  { id: 'act-doc-grn-qc', name: 'Material Receiving & Visual QC Sheet (Doc 49)', badge: 'QC', action: () => onNavigateTab('documents') },
                  { id: 'act-doc-ncn', name: 'Non-Conformance Notice NCN Form (Doc 65)', badge: 'NCN', action: () => onNavigateTab('documents') },
                  { id: 'act-doc-all-89', name: 'View All 89 Formal Documents Registry', badge: 'All 89', action: () => onNavigateTab('documents') }
                ]
              }
            ]
          }
        ]
      },

      // 4. ORDERS (POS)
      {
        id: 'port-orders',
        name: 'Purchase Orders',
        shortLabel: 'Orders',
        tabTarget: 'pos',
        icon: ShoppingCart,
        badge: counts.pos,
        subPortals: [
          {
            id: 'sub-po-issuance',
            name: 'Order Issuance & SoD',
            icon: ShoppingCart,
            badge: 'Issuance',
            tabTarget: 'pos',
            subSubPortals: [
              {
                id: 'ssp-po-auth',
                name: 'Authorizations & Queue',
                badge: 'Queue',
                icon: ShoppingCart,
                actions: [
                  { id: 'act-po-new-modal', name: '+ Create New Purchase Order', badge: 'New PO', action: onOpenNewPo },
                  { id: 'act-po-register', name: 'Purchase Orders Master Register', badge: 'All POs', action: () => onNavigateTab('pos') },
                  { id: 'act-po-sod-signoff', name: 'Dual Authorization Signoff (SoD)', badge: 'Dual SoD', action: () => onNavigateTab('pos') },
                  { id: 'act-po-dispatch', name: 'Dispatch Order to Vendor', badge: 'Dispatch', action: () => onNavigateTab('pos') }
                ]
              },
              {
                id: 'ssp-po-tracking',
                name: 'Milestones & Tracking',
                badge: 'Milestones',
                icon: Clock,
                actions: [
                  { id: 'act-po-milestones', name: 'Material Delivery Milestones', badge: 'Delivery', action: () => onNavigateTab('pos') },
                  { id: 'act-po-balances', name: 'Partial Delivery & Line Balances', badge: 'Balances', action: () => onNavigateTab('pos') },
                  { id: 'act-po-pdf-print', name: 'Purchase Order PDF Document View', badge: 'PDF', action: () => onNavigateTab('pos') },
                  { id: 'act-po-expedite', name: 'Expedited Delivery Escalation', badge: 'Expedite', action: () => onNavigateTab('pos') }
                ]
              }
            ]
          },
          {
            id: 'sub-po-revisions',
            name: 'Amendments & Ledger',
            icon: Scale,
            badge: 'Ledger',
            tabTarget: 'pos',
            subSubPortals: [
              {
                id: 'ssp-po-amend',
                name: 'Variations & Commitments',
                badge: 'Amend',
                icon: Scale,
                actions: [
                  { id: 'act-po-revision-log', name: 'PO Revision & Quantity Variation', badge: 'Variation', action: () => onNavigateTab('pos') },
                  { id: 'act-po-cancel-audit', name: 'Cancellation & Restocking Audit', badge: 'Audit', action: () => onNavigateTab('pos') },
                  { id: 'act-po-commitment-ledger', name: 'Project Commitment Ledger Status', badge: 'Ledger', action: () => onNavigateTab('pos') }
                ]
              }
            ]
          }
        ]
      },

      // 5. REQUESTS (PR)
      {
        id: 'port-requests',
        name: 'Purchase Requisitions',
        shortLabel: 'Requests',
        tabTarget: 'pr',
        icon: FileText,
        badge: counts.pr,
        subPortals: [
          {
            id: 'sub-pr-workflow',
            name: 'Requisition Workflow',
            icon: FileText,
            badge: 'Queue',
            tabTarget: 'pr',
            subSubPortals: [
              {
                id: 'ssp-pr-queue',
                name: 'Approval Queue & Priority',
                badge: 'Workflow',
                icon: FileText,
                actions: [
                  { id: 'act-pr-new-modal', name: '+ New Purchase Requisition (PR)', badge: 'New PR', action: onOpenNewPr },
                  { id: 'act-pr-approvals', name: 'Requisition Approvals Queue', badge: 'Pending', action: () => onNavigateTab('pr') },
                  { id: 'act-pr-urgent', name: 'Urgent Material Requisitions', badge: 'Urgent', action: () => onNavigateTab('pr') },
                  { id: 'act-pr-depts', name: 'Departmental PR Allocation', badge: 'Depts', action: () => onNavigateTab('pr') }
                ]
              },
              {
                id: 'ssp-pr-conversion',
                name: 'Conversion & Budget Gate',
                badge: 'Convert',
                icon: Scale,
                actions: [
                  { id: 'act-pr-convert-po', name: 'Convert Requisition to Direct PO', badge: 'To PO', action: () => onNavigateTab('pr') },
                  { id: 'act-pr-convert-rfq', name: 'Convert Requisition to RFQ Tender', badge: 'To RFQ', action: () => onNavigateTab('pr') },
                  { id: 'act-pr-budget-check', name: 'Project Budget Gate Verification', badge: 'Budget', action: () => onNavigateTab('pr') },
                  { id: 'act-pr-lifecycle', name: 'Requisition Lifecycle Status', badge: 'Status', action: () => onNavigateTab('pr') }
                ]
              }
            ]
          }
        ]
      },

      // 6. SOURCING (RFQ)
      {
        id: 'port-sourcing',
        name: 'Sourcing & RFQ Tenders',
        shortLabel: 'Sourcing',
        tabTarget: 'rfq',
        icon: FileSpreadsheet,
        badge: counts.rfq,
        subPortals: [
          {
            id: 'sub-rfq-bids',
            name: 'RFQ Tenders & Quotes',
            icon: FileSpreadsheet,
            badge: 'Tenders',
            tabTarget: 'rfq',
            subSubPortals: [
              {
                id: 'ssp-rfq-reg',
                name: 'Tender Submissions',
                badge: 'Quotes',
                icon: FileSpreadsheet,
                actions: [
                  { id: 'act-rfq-manage-hub', name: 'Vendor RFQs & Bids Register', badge: 'RFQs', action: () => onNavigateTab('rfq') },
                  { id: 'act-rfq-issue', name: 'Issue Sourcing RFQ Tender', badge: 'Issue RFQ', action: () => onNavigateTab('rfq') },
                  { id: 'act-rfq-compare', name: 'Bid Comparison Matrix', badge: 'Matrix', action: () => onNavigateTab('rfq') },
                  { id: 'act-rfq-submissions', name: 'Vendor Quotation Submissions Log', badge: 'Quotes', action: () => onNavigateTab('rfq') }
                ]
              },
              {
                id: 'ssp-rfq-eval',
                name: 'Bid Evaluation & Award',
                badge: 'Award',
                icon: CheckCircle2,
                actions: [
                  { id: 'act-rfq-lowest-comp', name: 'Lowest Compliant Bid Evaluator', badge: 'Lowest', action: () => onNavigateTab('rfq') },
                  { id: 'act-rfq-scores', name: 'Commercial & Technical Scorecards', badge: 'Scorecard', action: () => onNavigateTab('rfq') },
                  { id: 'act-rfq-award-po', name: 'Award Tender & Draft PO', badge: 'Award PO', action: () => onNavigateTab('rfq') },
                  { id: 'act-rfq-negotiations', name: 'Negotiation Variance Summary', badge: 'Savings', action: () => onNavigateTab('rfq') }
                ]
              }
            ]
          }
        ]
      },

      // 7. AUCTIONS (DUTCH & REVERSE)
      {
        id: 'port-auctions',
        name: 'Reverse & Dutch Auctions',
        shortLabel: 'Auctions',
        tabTarget: 'auctions',
        icon: Radio,
        badge: counts.auctions,
        subPortals: [
          {
            id: 'sub-auc-floor',
            name: 'Live Auction Floor',
            icon: Radio,
            badge: 'Live',
            tabTarget: 'auctions',
            subSubPortals: [
              {
                id: 'ssp-auc-dynamic',
                name: 'Dynamic Clock Bidding',
                badge: 'Clock',
                icon: Radio,
                actions: [
                  { id: 'act-auc-live-floor', name: 'Live Dutch Auction Floor', badge: 'Live', action: () => onNavigateTab('auctions') },
                  { id: 'act-auc-clock-monitor', name: 'Real-Time Clock Price Tick Monitor', badge: 'Ticks', action: () => onNavigateTab('auctions') },
                  { id: 'act-auc-instant-bid', name: 'Place Real-Time Supplier Bid', badge: 'Bid', action: () => onNavigateTab('auctions') },
                  { id: 'act-auc-ranking', name: 'Live Bidder Rank & Floor Log', badge: 'Ranks', action: () => onNavigateTab('auctions') }
                ]
              },
              {
                id: 'ssp-auc-award',
                name: 'Awards & Realized Savings',
                badge: 'Savings',
                icon: TrendingUp,
                actions: [
                  { id: 'act-auc-close-award', name: 'Close Auction & Award Winning PO', badge: 'Award', action: () => onNavigateTab('auctions') },
                  { id: 'act-auc-savings-rep', name: 'Auction Savings Realization Report', badge: 'Savings', action: () => onNavigateTab('auctions') },
                  { id: 'act-auc-bid-history', name: 'Historical Bid Traceability Log', badge: 'Audit', action: () => onNavigateTab('auctions') }
                ]
              }
            ]
          }
        ]
      },

      // 8. RECEIVING (GRN)
      {
        id: 'port-receiving',
        name: 'Goods Receiving (GRN)',
        shortLabel: 'Receiving',
        tabTarget: 'grn',
        icon: Boxes,
        badge: counts.grn,
        subPortals: [
          {
            id: 'sub-grn-yard',
            name: 'Yard Receiving & Barcode',
            icon: Boxes,
            badge: 'Receiving',
            tabTarget: 'grn',
            subSubPortals: [
              {
                id: 'ssp-grn-receipts',
                name: 'Goods Receipts Notes',
                badge: 'GRNs',
                icon: Boxes,
                actions: [
                  { id: 'act-grn-create', name: 'Create Goods Receipt Note (GRN)', badge: 'New GRN', action: () => onNavigateTab('grn') },
                  { id: 'act-grn-scan', name: 'Barcode & QR Code Material Scan', badge: 'Scan QR', action: () => onNavigateTab('grn') },
                  { id: 'act-grn-register', name: 'Goods Receipts Master Register', badge: 'Register', action: () => onNavigateTab('grn') },
                  { id: 'act-grn-dn-check', name: 'Delivery Note (DN) Verification', badge: 'DN Verify', action: () => onNavigateTab('grn') }
                ]
              },
              {
                id: 'ssp-grn-quality-gate',
                name: 'Storage & Quarantine',
                badge: 'Storage',
                icon: CheckCircle2,
                actions: [
                  { id: 'act-grn-bay-bin', name: 'Storage Bay & Bin Location Allocation', badge: 'Bay-Bin', action: () => onNavigateTab('grn') },
                  { id: 'act-grn-po-match', name: 'PO vs Received Discrepancy Audit', badge: 'Match', action: () => onNavigateTab('grn') },
                  { id: 'act-grn-quarantine', name: 'Damaged Goods Quarantine Hold', badge: 'Quarantine', action: () => onNavigateTab('grn') }
                ]
              }
            ]
          }
        ]
      },

      // 9. SERVICES (SCN)
      {
        id: 'port-services',
        name: 'Subcontractor Notes (SCN)',
        shortLabel: 'Services',
        tabTarget: 'scn',
        icon: FileCheck,
        badge: counts.scn,
        subPortals: [
          {
            id: 'sub-scn-service',
            name: 'Subcontractor Work Signoffs',
            icon: FileCheck,
            badge: 'Signoffs',
            tabTarget: 'scn',
            subSubPortals: [
              {
                id: 'ssp-scn-milestones',
                name: 'Milestone Completion Notes',
                badge: 'SCNs',
                icon: FileCheck,
                actions: [
                  { id: 'act-scn-new', name: 'Create Subcontractor SCN', badge: 'New SCN', action: () => onNavigateTab('scn') },
                  { id: 'act-scn-signoffs', name: 'Milestone Completion Signoffs', badge: 'Certs', action: () => onNavigateTab('scn') },
                  { id: 'act-scn-tri-sig', name: 'Tri-Signature Signoff (Site/QA/PM)', badge: 'Tri-Sign', action: () => onNavigateTab('scn') },
                  { id: 'act-scn-reg', name: 'Subcontractor Services Register', badge: 'Register', action: () => onNavigateTab('scn') }
                ]
              },
              {
                id: 'ssp-scn-retention',
                name: 'Field Measures & Retention',
                badge: 'Billing',
                icon: Scale,
                actions: [
                  { id: 'act-scn-measure', name: 'Field Quantity Measurement Sheet', badge: 'Quantity', action: () => onNavigateTab('scn') },
                  { id: 'act-scn-ret-tracker', name: 'Retention Deduction & Release Tracker', badge: 'Retention', action: () => onNavigateTab('scn') },
                  { id: 'act-scn-billing', name: 'SCN Progress Billing Authorization', badge: 'Billing', action: () => onNavigateTab('scn') }
                ]
              }
            ]
          }
        ]
      },

      // 10. INVOICES (3-WAY MATCH)
      {
        id: 'port-invoices',
        name: '3-Way Match & Invoicing',
        shortLabel: 'Invoices',
        tabTarget: 'invoices',
        icon: CheckCircle2,
        badge: counts.invoices,
        subPortals: [
          {
            id: 'sub-inv-matching',
            name: '3-Way Match Engine',
            icon: CheckCircle2,
            badge: 'Matching',
            tabTarget: 'invoices',
            subSubPortals: [
              {
                id: 'ssp-inv-verify',
                name: 'Automated 3-Way Match',
                badge: 'Verify',
                icon: CheckCircle2,
                actions: [
                  { id: 'act-3way-open', name: '3-Way Invoice Match Register', badge: 'Match', action: () => onNavigateTab('invoices') },
                  { id: 'act-3way-tol', name: 'PO-GRN-Invoice Tolerance Check', badge: 'Tolerance', action: () => onNavigateTab('invoices') },
                  { id: 'act-3way-pvc', name: 'Price Variance Authorization (PVC)', badge: 'PVC', action: () => onNavigateTab('invoices') },
                  { id: 'act-3way-discrepancy', name: 'Discrepancy Exception Holds Queue', badge: 'Holds', action: () => onNavigateTab('invoices') }
                ]
              },
              {
                id: 'ssp-inv-ap-release',
                name: 'Payment Release & Cost Sync',
                badge: 'AP Release',
                icon: CreditCard,
                actions: [
                  { id: 'act-3way-approve', name: 'Approve Verified Supplier Invoice', badge: 'Approve', action: () => onNavigateTab('invoices') },
                  { id: 'act-3way-cost-sync', name: 'Sync with Actual Cost Ledger', badge: 'Sync Cost', action: () => onNavigateTab('invoices') },
                  { id: 'act-3way-release-pay', name: 'Accounts Payable Payment Release', badge: 'AP Release', action: () => onNavigateTab('invoices') }
                ]
              }
            ]
          }
        ]
      },

      // 11. QUALITY (NCR)
      {
        id: 'port-quality',
        name: 'Quality NCR & Holds',
        shortLabel: 'Quality',
        tabTarget: 'ncrs',
        icon: ShieldAlert,
        badge: counts.ncrs,
        subPortals: [
          {
            id: 'sub-ncr-defects',
            name: 'Defect Logging & Holds',
            icon: ShieldAlert,
            badge: 'Holds',
            tabTarget: 'ncrs',
            subSubPortals: [
              {
                id: 'ssp-ncr-holds',
                name: 'NCR Registry & Intercept',
                badge: 'Intercept',
                icon: ShieldAlert,
                actions: [
                  { id: 'act-ncr-log-modal', name: '+ Log Non-Conformance Report', badge: 'New NCR', action: onOpenNewNcr },
                  { id: 'act-ncr-registry', name: 'Quality NCR Registry & Holds', badge: 'All NCRs', action: () => onNavigateTab('ncrs') },
                  { id: 'act-ncr-intercept', name: 'Immediate Payment Intercept to AP', badge: 'Intercept', action: () => onNavigateTab('ncrs') },
                  { id: 'act-ncr-quarantine-hold', name: 'Material Quarantine Protocol', badge: 'Quarantine', action: () => onNavigateTab('ncrs') }
                ]
              },
              {
                id: 'ssp-ncr-capa',
                name: 'CAPA & Debit Intercept',
                badge: 'CAPA',
                icon: ShieldCheck,
                actions: [
                  { id: 'act-ncr-5why', name: '5-Why CAPA Resolution & Verification', badge: '5-Why', action: () => onNavigateTab('ncrs') },
                  { id: 'act-ncr-debit', name: 'Debit Note Generation for Rejections', badge: 'Debit Note', action: () => onNavigateTab('ncrs') },
                  { id: 'act-ncr-clearance', name: 'Supplier Quality Sanctions Clearance', badge: 'Clearance', action: () => onNavigateTab('ncrs') }
                ]
              }
            ]
          }
        ]
      },

      // 12. STOCK (INVENTORY)
      {
        id: 'port-stock',
        name: 'Warehouse Stock & Inventory',
        shortLabel: 'Stock',
        tabTarget: 'inventory',
        icon: Layers,
        badge: counts.inventory,
        subPortals: [
          {
            id: 'sub-inv-levels',
            name: 'Stock Levels & Balances',
            icon: Layers,
            badge: 'Levels',
            tabTarget: 'inventory',
            subSubPortals: [
              {
                id: 'ssp-inv-stock-reg',
                name: 'Stock Register & Safety',
                badge: 'Balances',
                icon: Layers,
                actions: [
                  { id: 'act-inv-reg', name: 'Warehouse Stock Register', badge: 'Stock', action: () => onNavigateTab('inventory') },
                  { id: 'act-inv-reorder', name: 'Reorder Level & Safety Stock Alerts', badge: 'Alerts', action: () => onNavigateTab('inventory') },
                  { id: 'act-inv-movements', name: 'Stock In / Out Movement Ledger', badge: 'Ledger', action: () => onNavigateTab('inventory') },
                  { id: 'act-inv-perpetual', name: 'Perpetual Physical Count Audit', badge: 'Audit', action: () => onNavigateTab('inventory') }
                ]
              },
              {
                id: 'ssp-inv-transfers',
                name: 'Project Allocations',
                badge: 'Transfers',
                icon: Building2,
                actions: [
                  { id: 'act-inv-res', name: 'Project Material Reservation', badge: 'Reserve', action: () => onNavigateTab('inventory') },
                  { id: 'act-inv-xfer', name: 'Inter-Site Material Transfer Note', badge: 'Transfer', action: () => onNavigateTab('inventory') },
                  { id: 'act-inv-fifo', name: 'FIFO Stock Valuation & Cost Audit', badge: 'Valuation', action: () => onNavigateTab('inventory') }
                ]
              }
            ]
          }
        ]
      },

      // 13. SCRAP (CIRCULAR RECOVERY)
      {
        id: 'port-scrap',
        name: 'Scrap & Circular Economy',
        shortLabel: 'Scrap',
        tabTarget: 'scrap',
        icon: Scale,
        badge: counts.scrap,
        subPortals: [
          {
            id: 'sub-scrap-recovery',
            name: 'Declarations & Intercept',
            icon: Scale,
            badge: 'Recovery',
            tabTarget: 'scrap',
            subSubPortals: [
              {
                id: 'ssp-scrap-lots',
                name: '7-Day Intercept Window',
                badge: 'Intercept',
                icon: Scale,
                actions: [
                  { id: 'act-scrap-declare-modal', name: '+ Declare Scrap Material Lot', badge: 'Declare', action: onOpenNewScrap },
                  { id: 'act-scrap-reg', name: 'Scrap & Circular Recovery Register', badge: 'Register', action: () => onNavigateTab('scrap') },
                  { id: 'act-scrap-hold-window', name: '7-Day Internal Intercept Window', badge: '7-Day Hold', action: () => onNavigateTab('scrap') },
                  { id: 'act-scrap-val', name: 'Circular Salvage Valuation Log', badge: 'Value', action: () => onNavigateTab('scrap') }
                ]
              },
              {
                id: 'ssp-scrap-reuse',
                name: 'Project Redirection & Reuse',
                badge: 'Reuse',
                icon: RefreshCw,
                actions: [
                  { id: 'act-scrap-redirect', name: 'Project Redirection & Site Reuse', badge: 'Reclaim', action: () => onNavigateTab('scrap') },
                  { id: 'act-scrap-tickets', name: 'Salvage Weighbridge Tickets Register', badge: 'Weighbridge', action: () => onNavigateTab('scrap') },
                  { id: 'act-scrap-diverted', name: 'Zero Landfill Diverted Tonnage', badge: 'Zero Waste', action: () => onNavigateTab('scrap') }
                ]
              }
            ]
          }
        ]
      },

      // 14. EMERGENCY PROCUREMENT
      {
        id: 'port-emergency',
        name: 'Emergency Fast-Track',
        shortLabel: 'Emergency',
        tabTarget: 'emergency',
        icon: HardHat,
        badge: counts.emergency,
        subPortals: [
          {
            id: 'sub-emg-fasttrack',
            name: 'Safety Bypass Orders',
            icon: HardHat,
            badge: 'Fast-Track',
            tabTarget: 'emergency',
            subSubPortals: [
              {
                id: 'ssp-emg-orders',
                name: 'Immediate Authorization',
                badge: 'Urgent',
                icon: HardHat,
                actions: [
                  { id: 'act-emg-new-modal', name: '+ Fast-Track Emergency PO', badge: 'Express PO', action: onOpenNewEmergency },
                  { id: 'act-emg-register', name: 'Emergency Procurement Register', badge: 'Register', action: () => onNavigateTab('emergency') },
                  { id: 'act-emg-safety', name: 'HSE Safety-Critical Dispatch', badge: 'Safety', action: () => onNavigateTab('emergency') },
                  { id: 'act-emg-work-auth', name: 'Immediate Work Order Release', badge: 'Work Order', action: () => onNavigateTab('emergency') }
                ]
              },
              {
                id: 'ssp-emg-compliance',
                name: 'Retroactive Compliance',
                badge: 'Audits',
                icon: ShieldCheck,
                actions: [
                  { id: 'act-emg-audit-queue', name: 'Mandatory Retroactive Audit Queue', badge: 'Audit', action: () => onNavigateTab('emergency') },
                  { id: 'act-emg-justification', name: 'Safety Justification Review Signoff', badge: 'Signoff', action: () => onNavigateTab('emergency') },
                  { id: 'act-emg-variance', name: 'Emergency Cost Variance Reconciliation', badge: 'Reconcile', action: () => onNavigateTab('emergency') }
                ]
              }
            ]
          }
        ]
      },

      // 15. CONTRACTS (BPA)
      {
        id: 'port-contracts',
        name: 'Framework Contracts (BPA)',
        shortLabel: 'Contracts',
        tabTarget: 'contracts',
        icon: FolderOpen,
        badge: counts.contracts,
        subPortals: [
          {
            id: 'sub-cnt-bpa',
            name: 'Framework Agreements',
            icon: FolderOpen,
            badge: 'BPA',
            tabTarget: 'contracts',
            subSubPortals: [
              {
                id: 'ssp-cnt-blanket',
                name: 'Agreements & Price Locks',
                badge: 'Price Lock',
                icon: FolderOpen,
                actions: [
                  { id: 'act-cnt-register', name: 'Framework Agreements Register', badge: 'Contracts', action: () => onNavigateTab('contracts') },
                  { id: 'act-cnt-pricelock', name: 'Price Lock & Rate Guarantee Terms', badge: 'Rate Lock', action: () => onNavigateTab('contracts') },
                  { id: 'act-cnt-moq', name: 'MOQ Terms & Tiered Rebates', badge: 'MOQ', action: () => onNavigateTab('contracts') },
                  { id: 'act-cnt-spend-cap', name: 'Cumulative Spend vs Contract Cap', badge: 'Cap Check', action: () => onNavigateTab('contracts') }
                ]
              },
              {
                id: 'ssp-cnt-renewals',
                name: 'SLA Terms & Renewals',
                badge: 'Renewals',
                icon: Scale,
                actions: [
                  { id: 'act-cnt-renew-alerts', name: 'Contract Expiry & Renewal Alerts', badge: 'Renewals', action: () => onNavigateTab('contracts') },
                  { id: 'act-cnt-sla-penalties', name: 'SLA Penalties & Liquidated Damages', badge: 'SLA', action: () => onNavigateTab('contracts') },
                  { id: 'act-cnt-compliance-audit', name: 'Vendor Legal Compliance Audit', badge: 'Legal', action: () => onNavigateTab('contracts') }
                ]
              }
            ]
          }
        ]
      },

      // 16. SUPPLIERS (AVL)
      {
        id: 'port-suppliers',
        name: 'Approved Vendor List (AVL)',
        shortLabel: 'Suppliers',
        tabTarget: 'suppliers',
        icon: Users,
        badge: counts.suppliers,
        subPortals: [
          {
            id: 'sub-sup-avl',
            name: 'Vendor Directory & KYV',
            icon: Building2,
            badge: 'AVL',
            tabTarget: 'suppliers',
            subSubPortals: [
              {
                id: 'ssp-sup-directory',
                name: 'Approved Directory',
                badge: 'Active',
                icon: Building2,
                actions: [
                  { id: 'act-sup-hub', name: 'Approved Vendor List (AVL) Hub', badge: 'All AVL', action: () => onNavigateTab('suppliers') },
                  { id: 'act-sup-onboard', name: 'Supplier Onboarding & Qualification', badge: 'KYV', action: () => onNavigateTab('suppliers') },
                  { id: 'act-sup-licenses', name: 'Trade License & Compliance Vault', badge: 'Compliance', action: () => onNavigateTab('suppliers') },
                  { id: 'act-sup-matrix', name: 'Supply Capability Category Matrix', badge: 'Matrix', action: () => onNavigateTab('suppliers') }
                ]
              },
              {
                id: 'ssp-sup-performance',
                name: 'OTIF Ratings & Scorecards',
                badge: 'OTIF',
                icon: Medal,
                actions: [
                  { id: 'act-sup-scorecards', name: 'OTIF Rating & Performance Cards', badge: 'OTIF', action: () => onNavigateTab('suppliers') },
                  { id: 'act-sup-defect-rates', name: 'Supplier Quality Defect Rates', badge: 'Defects', action: () => onNavigateTab('suppliers') },
                  { id: 'act-sup-tiers', name: 'Vendor Tier Classification', badge: 'Tiers', action: () => onNavigateTab('suppliers') }
                ]
              }
            ]
          }
        ]
      },

      // 17. ANALYTICS
      {
        id: 'port-analytics',
        name: 'Spend Intelligence & Analytics',
        shortLabel: 'Analytics',
        tabTarget: 'analytics',
        icon: TrendingUp,
        badge: 'Analytics',
        subPortals: [
          {
            id: 'sub-an-spend',
            name: 'Spend Intelligence & Pareto',
            icon: BarChart3,
            badge: 'Pareto',
            tabTarget: 'analytics',
            subSubPortals: [
              {
                id: 'ssp-an-pareto',
                name: 'Spend Breakdown & Trends',
                badge: 'Pareto',
                icon: BarChart3,
                actions: [
                  { id: 'act-an-dashboard', name: 'Spend Intelligence Dashboard', badge: 'Spend', action: () => onNavigateTab('analytics') },
                  { id: 'act-an-pareto-chart', name: 'Category Pareto (80/20) Spend Chart', badge: 'Pareto', action: () => onNavigateTab('analytics') },
                  { id: 'act-an-inflation-idx', name: 'Material Cost Inflation Index', badge: 'Inflation', action: () => onNavigateTab('analytics') },
                  { id: 'act-an-cost-avoidance', name: 'Procurement Cost Avoidance Report', badge: 'Savings', action: () => onNavigateTab('analytics') }
                ]
              },
              {
                id: 'ssp-an-risk-matrix',
                name: 'Supply Chain Risk & HHI',
                badge: 'HHI',
                icon: TrendingUp,
                actions: [
                  { id: 'act-an-hhi-index', name: 'HHI Supplier Concentration Index', badge: 'HHI', action: () => onNavigateTab('analytics') },
                  { id: 'act-an-single-source', name: 'Single-Source Vulnerability Matrix', badge: 'Risk', action: () => onNavigateTab('analytics') },
                  { id: 'act-an-exposure-log', name: 'Financial Exposure Risk Ledger', badge: 'Exposure', action: () => onNavigateTab('analytics') }
                ]
              }
            ]
          }
        ]
      }
    ];
  }, [counts, onNavigateTab, onOpenNewPo, onOpenNewPr, onOpenNewNcr, onOpenNewScrap, onOpenNewEmergency, onSyncCentral]);

  // Quick Action Functional Buttons divided and listed down under their respective portal names
  // 1-2 words only, complete solid colors, white text and icons, no descriptions (Exact Home page style)
  const quickActionGroups: QuickActionGroup[] = useMemo(() => {
    return [
      {
        portalId: 'commercial-orders',
        portalName: 'Orders & Requisitions',
        portalIcon: ShoppingCart,
        actions: [
          {
            id: 'qa-new-po',
            label: '+ New Order',
            icon: Plus,
            action: onOpenNewPo,
            color: 'bg-orange-600 hover:bg-orange-700 text-white'
          },
          {
            id: 'qa-new-pr',
            label: '+ Add PR',
            icon: Plus,
            action: onOpenNewPr,
            color: 'bg-amber-600 hover:bg-amber-700 text-white'
          },
          {
            id: 'qa-orders-reg',
            label: 'All Orders',
            icon: ShoppingCart,
            action: () => onNavigateTab('pos'),
            color: 'bg-orange-700 hover:bg-orange-800 text-white'
          },
          {
            id: 'qa-pr-reg',
            label: 'Requisitions',
            icon: FileText,
            action: () => onNavigateTab('pr'),
            color: 'bg-amber-700 hover:bg-amber-800 text-white'
          }
        ]
      },
      {
        portalId: 'sourcing-costing',
        portalName: 'Sourcing & Costing',
        portalIcon: DollarSign,
        actions: [
          {
            id: 'qa-costing-hub',
            label: 'Cost Items',
            icon: DollarSign,
            action: () => onNavigateTab('costing'),
            color: 'bg-blue-600 hover:bg-blue-700 text-white'
          },
          {
            id: 'qa-rfq-hub',
            label: 'RFQ Sourcing',
            icon: FileSpreadsheet,
            action: () => onNavigateTab('rfq'),
            color: 'bg-indigo-600 hover:bg-indigo-700 text-white'
          },
          {
            id: 'qa-auction-floor',
            label: 'Dutch Floor',
            icon: Radio,
            action: () => onNavigateTab('auctions'),
            color: 'bg-violet-600 hover:bg-violet-700 text-white'
          },
          {
            id: 'qa-89-docs',
            label: '89 Docs',
            icon: FileText,
            action: () => onNavigateTab('documents'),
            color: 'bg-slate-700 hover:bg-slate-800 text-white'
          }
        ]
      },
      {
        portalId: 'receiving-plant',
        portalName: 'Receiving & Services',
        portalIcon: Boxes,
        actions: [
          {
            id: 'qa-grn-yard',
            label: 'Receive GRN',
            icon: Boxes,
            action: () => onNavigateTab('grn'),
            color: 'bg-teal-700 hover:bg-teal-800 text-white'
          },
          {
            id: 'qa-scn-serv',
            label: 'SCN Services',
            icon: FileCheck,
            action: () => onNavigateTab('scn'),
            color: 'bg-cyan-700 hover:bg-cyan-800 text-white'
          },
          {
            id: 'qa-wh-stock',
            label: 'Stock Alert',
            icon: Layers,
            action: () => onNavigateTab('inventory'),
            color: 'bg-purple-700 hover:bg-purple-800 text-white'
          },
          {
            id: 'qa-scrap-declare',
            label: 'Declare Scrap',
            icon: Scale,
            action: onOpenNewScrap,
            color: 'bg-stone-700 hover:bg-stone-800 text-white'
          }
        ]
      },
      {
        portalId: 'governance-risk',
        portalName: 'Governance, Quality & Risk',
        portalIcon: ShieldAlert,
        actions: [
          {
            id: 'qa-3way-match',
            label: '3-Way Match',
            icon: CheckCircle2,
            action: () => onNavigateTab('invoices'),
            color: 'bg-emerald-700 hover:bg-emerald-800 text-white'
          },
          {
            id: 'qa-ncr-log',
            label: 'Log NCR',
            icon: ShieldAlert,
            action: onOpenNewNcr,
            color: 'bg-rose-700 hover:bg-rose-800 text-white'
          },
          {
            id: 'qa-emg-po',
            label: 'Emergency PO',
            icon: HardHat,
            action: onOpenNewEmergency,
            color: 'bg-red-700 hover:bg-red-800 text-white'
          },
          {
            id: 'qa-bpa-contracts',
            label: 'BPA Contracts',
            icon: FolderOpen,
            action: () => onNavigateTab('contracts'),
            color: 'bg-sky-700 hover:bg-sky-800 text-white'
          },
          {
            id: 'qa-avl-suppliers',
            label: 'Suppliers AVL',
            icon: Users,
            action: () => onNavigateTab('suppliers'),
            color: 'bg-teal-800 hover:bg-teal-900 text-white'
          },
          {
            id: 'qa-spend-analytics',
            label: 'Spend Trends',
            icon: TrendingUp,
            action: () => onNavigateTab('analytics'),
            color: 'bg-fuchsia-700 hover:bg-fuchsia-800 text-white'
          }
        ]
      }
    ];
  }, [onOpenNewPo, onOpenNewPr, onOpenNewNcr, onOpenNewScrap, onOpenNewEmergency, onNavigateTab]);

  const totalQuickActions = useMemo(() => {
    return quickActionGroups.reduce((acc, g) => acc + g.actions.length, 0);
  }, [quickActionGroups]);

  // Selection states for 4-Column Explorer
  const [selectedPortalIndex, setSelectedPortalIndex] = useState<number>(0);
  const [selectedSubPortalIndex, setSelectedSubPortalIndex] = useState<number>(0);
  const [selectedSubSubIndex, setSelectedSubSubIndex] = useState<number>(0);
  const [searchFilter, setSearchFilter] = useState<string>('');

  const activePortal = portals[selectedPortalIndex] || portals[0];
  const activeSubPortals = activePortal?.subPortals || [];
  const activeSubPortal = activeSubPortals[selectedSubPortalIndex] || activeSubPortals[0];
  const activeSubSubPortals = activeSubPortal?.subSubPortals || [];
  const activeSubSub = activeSubSubPortals[selectedSubSubIndex] || activeSubSubPortals[0];
  const activeActions = activeSubSub?.actions || [];

  const handleLaunchPortal = () => {
    if (activeSubPortal?.tabTarget) {
      onNavigateTab(activeSubPortal.tabTarget);
    } else if (activePortal?.tabTarget) {
      onNavigateTab(activePortal.tabTarget);
    }
  };

  // Search filter
  const filterMatches = (text: string) => {
    if (!searchFilter.trim()) return true;
    return text.toLowerCase().includes(searchFilter.toLowerCase().trim());
  };

  return (
    <div className="space-y-3 pb-8">
      {/* ========================================================================= */}
      {/* 1. SIMPLIFIED HEADER (MATCHING HOME PAGE STYLE)                           */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-xs flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-slate-900 tracking-tight">
              Procurement Operations Hub
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-orange-50 border border-orange-200 text-orange-700 font-semibold font-mono">
              17 Operational Modules
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onSyncCentral}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            title="Synchronize all procurement records with central database"
          >
            <RefreshCw size={12} className="text-slate-500" />
            <span>Central Sync</span>
          </button>

          <div className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-slate-800">{currentUser?.fullName || 'Alexander Vance'}</span>
            <span className="text-slate-400">·</span>
            <span className="text-orange-600 font-medium">
              {isAdmin ? 'Super Admin' : currentUser?.roleName || 'Procurement Officer'}
            </span>
          </div>

          <div className="px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
            RBAC Active
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. QUICK ACTIONS DIVIDED UNDER THEIR PORTAL NAMES                         */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-1 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Quick Actions by Procurement Stream
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono font-medium">
              {quickActionGroups.length} Streams • {totalQuickActions} Actions
            </span>
          </div>
          <span className="text-[10px] text-slate-400">Divided under stream names for one-click access</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
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
      {/* 3. UNIVERSAL PORTAL DIRECTORY & COMPLETE ACTIONS HIERARCHY                */}
      {/* (ALL 17 CIRCLED PORTALS > SUB-PORTALS > SUB-SUB-PORTALS > EVERY ACTION)    */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col">
        {/* Explorer Header */}
        <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <LayoutDashboard size={16} className="text-orange-500" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Procurement Portal Directory & Complete Actions Hierarchy
            </h2>
            <span className="text-[10px] px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md font-mono font-semibold">
              {portals.length} Portals • All Circled Modules
            </span>
          </div>

          <div className="relative w-full sm:w-72">
            <Search size={13} className="text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search procurement modules & actions..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-7 pr-3 py-1 bg-white border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:border-orange-500 transition-all"
            />
          </div>
        </div>

        {/* 4-Column Simplified Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-200 min-h-[480px]">
          {/* ---------------------------------------------------- */}
          {/* COLUMN 1: PRIMARY PORTALS (ALL 17 FROM SCREENSHOT)   */}
          {/* ---------------------------------------------------- */}
          <div className="p-2.5 bg-slate-50/40 flex flex-col">
            <div className="h-6 px-1.5 border-b border-slate-200 flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Marked Portals ({portals.length})
              </span>
              <span className="text-[10px] font-mono text-slate-400">All 17</span>
            </div>

            <div className="space-y-1 overflow-y-auto custom-scrollbar flex-1 max-h-[480px]">
              {portals.map((p, idx) => {
                const Icon = p.icon;
                const isSelected = selectedPortalIndex === idx;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSelectedPortalIndex(idx);
                      setSelectedSubPortalIndex(0);
                      setSelectedSubSubIndex(0);
                    }}
                    className={cn(
                      "w-full text-left px-2 py-1.5 rounded-lg text-xs flex items-center justify-between gap-1.5 transition-all cursor-pointer font-medium",
                      isSelected
                        ? "bg-white text-orange-600 font-bold shadow-xs border border-slate-200"
                        : "text-slate-700 hover:bg-white hover:text-slate-900 border border-transparent"
                    )}
                  >
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <Icon size={13} className={isSelected ? "text-orange-500 shrink-0" : "text-slate-400 shrink-0"} />
                      <span className="truncate">{p.shortLabel}</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {p.badge !== undefined && (
                        <span className={cn(
                          "text-[9px] px-1.5 py-0.2 rounded font-mono font-semibold",
                          isSelected ? "bg-orange-100 text-orange-700" : "bg-slate-200 text-slate-600"
                        )}>
                          {p.badge}
                        </span>
                      )}
                      <ArrowRight size={10} className={isSelected ? "text-orange-500" : "text-slate-300"} />
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
                {activePortal?.name || 'Sub-Portals'}
              </span>
              <span className="text-[10px] font-mono text-slate-400">{activeSubPortals.length}</span>
            </div>

            <div className="space-y-1 overflow-y-auto custom-scrollbar flex-1 max-h-[480px]">
              {activeSubPortals.length === 0 ? (
                <div className="text-center py-12 text-xs text-slate-400">
                  No sub-portals available.
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
          <div className="p-2.5 bg-slate-50/25 flex flex-col">
            <div className="h-6 px-1.5 border-b border-slate-200 flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
                Sub-Portals of Sub-Portal
              </span>
              <span className="text-[10px] font-mono text-slate-400">{activeSubSubPortals.length}</span>
            </div>

            <div className="space-y-1 overflow-y-auto custom-scrollbar flex-1 max-h-[480px]">
              {activeSubSubPortals.length === 0 ? (
                <div className="text-center py-12 text-xs text-slate-400">
                  Select a sub-portal.
                </div>
              ) : (
                activeSubSubPortals.map((ssp, idx) => {
                  const SspIcon = ssp.icon || FolderTree;
                  const isSelected = selectedSubSubIndex === idx;
                  return (
                    <button
                      key={ssp.id}
                      type="button"
                      onClick={() => setSelectedSubSubIndex(idx)}
                      className={cn(
                        "w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between gap-2 transition-all cursor-pointer font-medium",
                        isSelected
                          ? "bg-white text-orange-950 font-bold border border-orange-300 shadow-2xs"
                          : "text-slate-700 hover:bg-white hover:text-slate-900 border border-slate-100"
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
          {/* COLUMN 4: EVERY ACTION & DIRECT COMMANDS              */}
          {/* ---------------------------------------------------- */}
          <div className="p-3 bg-white flex flex-col justify-between">
            <div className="flex-1 flex flex-col">
              <div className="h-6 px-1.5 border-b border-slate-200 flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Every Action & Command ({activeActions.length})
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Direct Execute</span>
              </div>

              <div className="space-y-1.5 overflow-y-auto custom-scrollbar flex-1 max-h-[410px]">
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
                        className="px-2.5 py-2 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-orange-50/40 hover:border-orange-200 transition-all flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <Check size={12} className="text-orange-600 shrink-0" />
                          <span className="text-xs font-semibold text-slate-800 truncate">{act.name}</span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {act.badge && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-600 font-mono font-medium">
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
            {activePortal && (
              <div className="pt-2.5 border-t border-slate-100 mt-2">
                <button
                  type="button"
                  onClick={handleLaunchPortal}
                  className="w-full py-2 px-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs rounded-lg shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>Launch {activePortal.shortLabel} Portal</span>
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
