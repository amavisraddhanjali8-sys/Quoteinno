import React from 'react';
import {
  Building2,
  CreditCard,
  FileText,
  TrendingUp,
  History,
  Plus,
  Download,
  Scale,
  Landmark,
  Briefcase,
  ShieldCheck,
  CheckCircle2,
  Truck,
  Layers,
  Folder,
  DollarSign,
  Receipt,
  Lock,
  Users
} from 'lucide-react';
import {
  PortalCommandCenterLanding,
  QuickActionGroup,
  CommandPrimaryPortal
} from '../common/PortalCommandCenterLanding';
import {
  GlJournalRecord,
  AccountsPayableRecord,
  BankReconcileRecord,
  ProjectCommitmentWipRecord,
  FixedAssetAccountingRecord,
  PeriodCloseStepRecord
} from '../../services/accountingControlService';

export type AccountingTab =
  | 'landing'
  | 'overview'
  | 'gl'
  | 'payments'
  | 'ap'
  | 'bank'
  | 'reconciliation'
  | 'project_accounting'
  | 'payroll'
  | 'parties'
  | 'adjustments'
  | 'ledgers'
  | 'assets_tax_close'
  | 'recurring'
  | 'reports';

interface AccountingLandingPageProps {
  journals: GlJournalRecord[];
  apRecords: AccountsPayableRecord[];
  bankRecords: BankReconcileRecord[];
  wipRecords: ProjectCommitmentWipRecord[];
  assetRecords: FixedAssetAccountingRecord[];
  closeSteps: PeriodCloseStepRecord[];
  paymentsCount: number;
  adjustmentsCount: number;
  clientsCount: number;
  onNavigateTab: (tab: AccountingTab) => void;
  onOpenRecordPayment: () => void;
  onOpenNewJournal: () => void;
  onOpenNewApBill: () => void;
  onOpenNewBankEntry: () => void;
  onOpenNewAdjustment: () => void;
  onOpenNewAsset: () => void;
  onNavigatePortal?: (portalView: string, subTab?: string) => void;
  onExportPDF: () => void;
}

export const AccountingLandingPage: React.FC<AccountingLandingPageProps> = ({
  journals,
  apRecords,
  bankRecords,
  wipRecords,
  assetRecords,
  closeSteps,
  paymentsCount,
  adjustmentsCount,
  clientsCount,
  onNavigateTab,
  onOpenRecordPayment,
  onOpenNewJournal,
  onOpenNewApBill,
  onOpenNewBankEntry,
  onOpenNewAsset,
  onNavigatePortal,
  onExportPDF
}) => {
  const postedJournalsCount = journals.filter(j => j.status === 'Posted').length;
  const matchedApCount = apRecords.filter(a => a.threeWayStatus === '3-Way Matched').length;
  const unmatchedBankCount = bankRecords.filter(b => b.matchStatus !== 'Matched').length;
  const lockedCloseSteps = closeSteps.filter(c => c.status === 'Completed & Locked').length;

  // 6-Card (3x2) Quick Actions Grid with simple words & minimal UI
  const quickActionGroups: QuickActionGroup[] = [
    {
      portalId: 'gl-coa-actions',
      portalName: 'Ledger',
      portalIcon: Scale,
      actions: [
        {
          id: 'qa-post-journal',
          label: 'Post Journal',
          icon: Plus,
          action: () => {
            onNavigateTab('gl');
            onOpenNewJournal();
          },
          color: 'bg-orange-600 hover:bg-orange-700 text-white'
        },
        {
          id: 'qa-journal-list',
          label: 'GL Journals',
          icon: Scale,
          action: () => onNavigateTab('gl'),
          color: 'bg-slate-800 hover:bg-slate-900 text-white'
        },
        {
          id: 'qa-coa-view',
          label: 'Accounts',
          icon: FileText,
          action: () => onNavigateTab('gl'),
          color: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
        },
        {
          id: 'qa-fin-overview',
          label: 'Overview',
          icon: TrendingUp,
          action: () => onNavigateTab('overview'),
          color: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
        }
      ]
    },
    {
      portalId: 'ar-claims-actions',
      portalName: 'Receivables',
      portalIcon: CreditCard,
      actions: [
        {
          id: 'qa-record-receipt',
          label: 'Record Receipt',
          icon: Plus,
          action: onOpenRecordPayment,
          color: 'bg-emerald-600 hover:bg-emerald-700 text-white'
        },
        {
          id: 'qa-ar-receipts',
          label: 'Receipts',
          icon: CreditCard,
          action: () => onNavigateTab('payments'),
          color: 'bg-slate-800 hover:bg-slate-900 text-white'
        },
        {
          id: 'qa-cust-ledgers',
          label: 'Ledgers',
          icon: History,
          action: () => onNavigateTab('ledgers'),
          color: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
        },
        {
          id: 'qa-credit-retention',
          label: 'Retentions',
          icon: Receipt,
          action: () => onNavigateTab('adjustments'),
          color: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
        }
      ]
    },
    {
      portalId: 'ap-3way-actions',
      portalName: 'Payables',
      portalIcon: Receipt,
      actions: [
        {
          id: 'qa-new-ap-bill',
          label: 'Log Bill',
          icon: Plus,
          action: () => {
            onNavigateTab('ap');
            onOpenNewApBill();
          },
          color: 'bg-blue-600 hover:bg-blue-700 text-white'
        },
        {
          id: 'qa-ap-3way',
          label: 'Match Log',
          icon: CheckCircle2,
          action: () => onNavigateTab('ap'),
          color: 'bg-slate-800 hover:bg-slate-900 text-white'
        },
        {
          id: 'qa-sub-retentions',
          label: 'Retentions',
          icon: ShieldCheck,
          action: () => onNavigateTab('ap'),
          color: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
        },
        {
          id: 'qa-link-po-grn',
          label: 'Orders',
          icon: Truck,
          action: () => onNavigatePortal?.('procurement', 'grn'),
          color: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
        }
      ]
    },
    {
      portalId: 'bank-cash-actions',
      portalName: 'Banking',
      portalIcon: Landmark,
      actions: [
        {
          id: 'qa-add-bank-tx',
          label: 'Add Line',
          icon: Plus,
          action: () => {
            onNavigateTab('bank');
            onOpenNewBankEntry();
          },
          color: 'bg-teal-600 hover:bg-teal-700 text-white'
        },
        {
          id: 'qa-bank-rec',
          label: 'Reconcile',
          icon: Landmark,
          action: () => onNavigateTab('reconciliation'),
          color: 'bg-slate-800 hover:bg-slate-900 text-white'
        },
        {
          id: 'qa-petty-cash',
          label: 'Petty Cash',
          icon: DollarSign,
          action: () => onNavigateTab('bank'),
          color: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
        },
        {
          id: 'qa-cash-flow',
          label: 'Cash Flow',
          icon: TrendingUp,
          action: () => onNavigateTab('overview'),
          color: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
        }
      ]
    },
    {
      portalId: 'project-wip-actions',
      portalName: 'Costing',
      portalIcon: Briefcase,
      actions: [
        {
          id: 'qa-proj-cost-view',
          label: 'Project Cost',
          icon: Briefcase,
          action: () => onNavigateTab('project_accounting'),
          color: 'bg-purple-600 hover:bg-purple-700 text-white'
        },
        {
          id: 'qa-commitments',
          label: 'Materials',
          icon: Scale,
          action: () => onNavigateTab('project_accounting'),
          color: 'bg-slate-800 hover:bg-slate-900 text-white'
        },
        {
          id: 'qa-post-eval',
          label: 'Actuals',
          icon: TrendingUp,
          action: () => onNavigatePortal?.('post-evaluation'),
          color: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
        },
        {
          id: 'qa-variations-link',
          label: 'Warranty',
          icon: Folder,
          action: () => onNavigateTab('project_accounting'),
          color: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
        }
      ]
    },
    {
      portalId: 'assets-tax-close-actions',
      portalName: 'Assets',
      portalIcon: Lock,
      actions: [
        {
          id: 'qa-add-asset',
          label: 'Add Asset',
          icon: Plus,
          action: () => {
            onNavigateTab('assets_tax_close');
            onOpenNewAsset();
          },
          color: 'bg-rose-600 hover:bg-rose-700 text-white'
        },
        {
          id: 'qa-deprec-tax',
          label: 'Tax',
          icon: Building2,
          action: () => onNavigateTab('assets_tax_close'),
          color: 'bg-slate-800 hover:bg-slate-900 text-white'
        },
        {
          id: 'qa-month-close',
          label: 'Close',
          icon: Lock,
          action: () => onNavigateTab('assets_tax_close'),
          color: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
        },
        {
          id: 'qa-export-reports',
          label: 'Reports',
          icon: Download,
          action: onExportPDF,
          color: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
        }
      ]
    }
  ];

  // 4-Column Universal Portal Directory with single-word tabs
  const primaryPortals: CommandPrimaryPortal[] = [
    {
      id: 'port-acc-overview',
      name: 'Financial Control Center & Cash Flow',
      shortLabel: 'Overview',
      icon: TrendingUp,
      badge: 'Live KPIs',
      targetTab: 'overview',
      onLaunch: () => onNavigateTab('overview'),
      subPortals: [
        {
          id: 'sub-acc-exec',
          name: 'Liquidity, Working Capital & Aging',
          icon: TrendingUp,
          badge: 'Executive',
          onLaunch: () => onNavigateTab('overview'),
          subSubPortals: [
            {
              id: 'ssp-acc-cash',
              name: 'Cash Position, AR/AP & Margin Summary',
              badge: 'KPIs',
              icon: DollarSign,
              actions: [
                { id: 'act-acc-ov', name: 'Open Financial Control Dashboard', badge: 'Open', action: () => onNavigateTab('overview') },
                { id: 'act-acc-rpt', name: 'Open Statutory & Management Reports', badge: 'Reports', action: () => onNavigateTab('reports') }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'port-acc-gl',
      name: 'General Ledger & Chart of Accounts',
      shortLabel: 'Ledger',
      icon: Scale,
      badge: `${postedJournalsCount} Posted`,
      targetTab: 'gl',
      onLaunch: () => onNavigateTab('gl'),
      subPortals: [
        {
          id: 'sub-gl-journals',
          name: 'Double-Entry Journals & Dimensional COA',
          icon: Scale,
          badge: 'Dr = Cr',
          onLaunch: () => onNavigateTab('gl'),
          subSubPortals: [
            {
              id: 'ssp-gl-entries',
              name: 'Standard, Accrual, Prepayment & Payroll Journals',
              badge: 'GL',
              icon: FileText,
              actions: [
                { id: 'act-gl-open', name: 'Open General Ledger & COA Register', badge: 'GL', action: () => onNavigateTab('gl') },
                { id: 'act-gl-new', name: 'Post Balanced Double-Entry Journal', badge: 'Post', action: () => { onNavigateTab('gl'); onOpenNewJournal(); } }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'port-acc-ar',
      name: 'Accounts Receivable & Claims',
      shortLabel: 'Receivables',
      icon: CreditCard,
      badge: `${paymentsCount} Receipts`,
      targetTab: 'payments',
      onLaunch: () => onNavigateTab('payments'),
      subPortals: [
        {
          id: 'sub-ar-collections',
          name: 'Customer Receipts, Retentions & T-Accounts',
          icon: CreditCard,
          badge: `${clientsCount} Clients`,
          onLaunch: () => onNavigateTab('payments'),
          subSubPortals: [
            {
              id: 'ssp-ar-items',
              name: 'Receipts, Credit Notes & Retention Release',
              badge: 'AR',
              icon: CreditCard,
              actions: [
                { id: 'act-ar-pay', name: 'Open Customer Receipts Register', badge: 'Receipts', action: () => onNavigateTab('payments') },
                { id: 'act-ar-rec-new', name: 'Record New Customer Payment Receipt', badge: 'Record', action: onOpenRecordPayment },
                { id: 'act-ar-ledgers', name: 'Open Customer T-Account Ledgers', badge: 'Ledgers', action: () => onNavigateTab('ledgers') },
                { id: 'act-ar-adj', name: `Open Credit Notes & Retentions (${adjustmentsCount})`, badge: 'Adjust', action: () => onNavigateTab('adjustments') }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'port-acc-ap',
      name: 'Accounts Payable & 3-Way Matching',
      shortLabel: 'Payables',
      icon: Receipt,
      badge: `${matchedApCount} Matched`,
      targetTab: 'ap',
      onLaunch: () => onNavigateTab('ap'),
      subPortals: [
        {
          id: 'sub-ap-3way',
          name: 'PO + GRN + Supplier Bill 3-Way Match',
          icon: Receipt,
          badge: '3-Way',
          onLaunch: () => onNavigateTab('ap'),
          subSubPortals: [
            {
              id: 'ssp-ap-bills',
              name: 'Supplier Bills, Advances & Subcontractor Retention',
              badge: 'AP',
              icon: CheckCircle2,
              actions: [
                { id: 'act-ap-open', name: 'Open Accounts Payable & 3-Way Match', badge: 'AP', action: () => onNavigateTab('ap') },
                { id: 'act-ap-new', name: 'Log Supplier / Subcontractor Invoice', badge: 'New Bill', action: () => { onNavigateTab('ap'); onOpenNewApBill(); } }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'port-acc-bank',
      name: 'Bank Accounts, Petty Cash & Statements',
      shortLabel: 'Banking',
      icon: Landmark,
      badge: unmatchedBankCount > 0 ? `${unmatchedBankCount} Unmatched` : 'Reconciled',
      targetTab: 'bank',
      onLaunch: () => onNavigateTab('bank'),
      subPortals: [
        {
          id: 'sub-bank-rec',
          name: 'Multi-Currency Bank & Site Petty Cash',
          icon: Landmark,
          badge: 'LKR / USD',
          onLaunch: () => onNavigateTab('bank'),
          subSubPortals: [
            {
              id: 'ssp-bank-stmt',
              name: 'Statement Matching & Imprest Count',
              badge: 'Bank',
              icon: Landmark,
              actions: [
                { id: 'act-bnk-open', name: 'Open Bank Reconciliation & Petty Cash', badge: 'Bank', action: () => onNavigateTab('bank') },
                { id: 'act-bnk-new', name: 'Record Bank Statement / Petty Cash Line', badge: 'Add', action: () => { onNavigateTab('bank'); onOpenNewBankEntry(); } }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'port-acc-rec',
      name: 'Bank & Account Reconciliation Process',
      shortLabel: 'Reconciliation',
      icon: CheckCircle2,
      badge: 'Audit Match',
      targetTab: 'reconciliation',
      onLaunch: () => onNavigateTab('reconciliation'),
      subPortals: [
        {
          id: 'sub-rec-process',
          name: 'Statement Balancing, Checks & Transfers',
          icon: CheckCircle2,
          badge: 'Zero Variance',
          onLaunch: () => onNavigateTab('reconciliation'),
          subSubPortals: [
            {
              id: 'ssp-rec-work',
              name: 'Auto-Match & Statement Clearance',
              badge: 'Audit',
              icon: CheckCircle2,
              actions: [
                { id: 'act-rec-run', name: 'Process Bank Reconciliation', badge: 'Run', action: () => onNavigateTab('reconciliation') }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'port-acc-project',
      name: 'Project Costing, Margin & Warranty',
      shortLabel: 'Costing',
      icon: Briefcase,
      badge: `${wipRecords.length} Packages`,
      targetTab: 'project_accounting',
      onLaunch: () => onNavigateTab('project_accounting'),
      subPortals: [
        {
          id: 'sub-proj-wip',
          name: 'Budget vs Committed, Materials, Labour & Machines',
          icon: Briefcase,
          badge: 'Costing',
          onLaunch: () => onNavigateTab('project_accounting'),
          subSubPortals: [
            {
              id: 'ssp-proj-margin',
              name: 'Work Package Cost Control & Margin Protection',
              badge: 'Cost',
              icon: Briefcase,
              actions: [
                { id: 'act-wip-open', name: 'Open Project Cost, Commitments & WIP', badge: 'WIP', action: () => onNavigateTab('project_accounting') },
                { id: 'act-wip-eval', name: 'Open Project Post-Evaluation & Actuals', badge: 'Actuals', action: () => onNavigatePortal?.('post-evaluation') }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'port-acc-parties',
      name: 'Customers, Suppliers, Factories & Staff',
      shortLabel: 'Parties',
      icon: Building2,
      badge: 'Directories',
      targetTab: 'parties',
      onLaunch: () => onNavigateTab('parties'),
      subPortals: [
        {
          id: 'sub-parties-all',
          name: 'Accounts, Balances & Settlements',
          icon: Building2,
          badge: 'Ledgers',
          onLaunch: () => onNavigateTab('parties'),
          subSubPortals: [
            {
              id: 'ssp-parties-mgmt',
              name: 'Unpaid Balance Protection & Statement Generation',
              badge: 'Accounts',
              icon: Building2,
              actions: [
                { id: 'act-pty-open', name: 'Open All Accounting Parties', badge: 'Open', action: () => onNavigateTab('parties') }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'port-acc-payroll',
      name: 'Payroll Wages, Statutory & Advances',
      shortLabel: 'Payroll',
      icon: Users,
      badge: 'HR & Wages',
      targetTab: 'payroll',
      onLaunch: () => onNavigateTab('payroll'),
      subPortals: [
        {
          id: 'sub-pay-all',
          name: 'Paysheets, EPF/ETF Deductions & Posting',
          icon: Users,
          badge: 'Wages',
          onLaunch: () => onNavigateTab('payroll'),
          subSubPortals: [
            {
              id: 'ssp-pay-mgmt',
              name: 'Monthly Payroll Reconciliation',
              badge: 'Payroll',
              icon: Users,
              actions: [
                { id: 'act-pay-open', name: 'Open Accounting Payroll', badge: 'Payroll', action: () => onNavigateTab('payroll') }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'port-acc-assets-close',
      name: 'Fixed Assets, Tax & Period Closing',
      shortLabel: 'Assets',
      icon: Lock,
      badge: `${lockedCloseSteps}/${closeSteps.length} Locked`,
      targetTab: 'assets_tax_close',
      onLaunch: () => onNavigateTab('assets_tax_close'),
      subPortals: [
        {
          id: 'sub-assets-tax',
          name: 'Depreciation, Tax Returns & Period Lock',
          icon: Lock,
          badge: `${assetRecords.length} Assets`,
          onLaunch: () => onNavigateTab('assets_tax_close'),
          subSubPortals: [
            {
              id: 'ssp-assets-close',
              name: 'Fixed Asset Ledger & Period Close',
              badge: 'Close',
              icon: Lock,
              actions: [
                { id: 'act-cls-open', name: 'Open Fixed Assets & Period Close', badge: 'Open', action: () => onNavigateTab('assets_tax_close') }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'port-acc-reports',
      name: 'Formal Documents & Audited Reports',
      shortLabel: 'Reports',
      icon: FileText,
      badge: 'Factory Layout',
      targetTab: 'reports',
      onLaunch: () => onNavigateTab('reports'),
      subPortals: [
        {
          id: 'sub-rep-all',
          name: 'Recorded Statements & PDF Generator',
          icon: FileText,
          badge: 'Audited',
          onLaunch: () => onNavigateTab('reports'),
          subSubPortals: [
            {
              id: 'ssp-rep-mgmt',
              name: 'Audited Corporate Reports Registry',
              badge: 'Reports',
              icon: FileText,
              actions: [
                { id: 'act-rep-open', name: 'Open Reports Registry & Statements', badge: 'Reports', action: () => onNavigateTab('reports') }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'port-acc-linked',
      name: 'Connected Portals',
      shortLabel: 'Portals',
      icon: Layers,
      badge: '7 Links',
      onLaunch: () => onNavigatePortal?.('projects'),
      subPortals: [
        {
          id: 'sub-acc-links',
          name: 'Direct Links to Projects, Invoices, PO, Payroll & Fleet',
          icon: Layers,
          badge: 'Integrated',
          subSubPortals: [
            {
              id: 'ssp-acc-links-all',
              name: 'Source Transaction Portals',
              badge: 'Links',
              icon: Building2,
              actions: [
                { id: 'act-a-lnk-invoices', name: 'Invoices & Claims', badge: 'Invoices', action: () => onNavigatePortal?.('invoices') },
                { id: 'act-a-lnk-projects', name: 'Projects & Variations', badge: 'Projects', action: () => onNavigatePortal?.('projects') },
                { id: 'act-a-lnk-procure', name: 'Procurement Orders', badge: 'Procure', action: () => onNavigatePortal?.('procurement', 'po') },
                { id: 'act-a-lnk-payroll', name: 'Payroll Center', badge: 'Payroll', action: () => onNavigatePortal?.('payroll') },
                { id: 'act-a-lnk-equipment', name: 'Equipment Fleet', badge: 'Fleet', action: () => onNavigatePortal?.('equipment-management', 'costing') },
                { id: 'act-a-lnk-quality', name: 'Quality NCRs', badge: 'Quality', action: () => onNavigatePortal?.('quality-control', 'ncrs') },
                { id: 'act-a-lnk-reporting', name: 'Executive Reporting', badge: 'Reporting', action: () => onNavigatePortal?.('reporting') }
              ]
            }
          ]
        }
      ]
    }
  ];

  return (
    <PortalCommandCenterLanding
      portalTitle="Accounting & Finance Command Hub"
      badgeLabel="IFRS Project Finance"
      statusBadge="GL Balanced"
      quickActionGroups={quickActionGroups}
      primaryPortals={primaryPortals}
      onLaunchPortal={p => {
        if (p.targetTab) onNavigateTab(p.targetTab as AccountingTab);
      }}
      searchPlaceholder="Search GL journals, COA, AR receipts, AP 3-way match, bank lines, project WIP, fixed assets..."
    />
  );
};
