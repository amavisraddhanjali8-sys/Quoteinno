import React from 'react';
import {
  Building2,
  FolderTree,
  Scale,
  CreditCard,
  Landmark,
  Clock,
  CheckCircle2,
  Plus,
  Download,
  TrendingUp,
  ShieldCheck,
  AlertCircle,
  Users,
  Coins
} from 'lucide-react';
import {
  PortalCommandCenterLanding,
  QuickActionGroup,
  CommandPrimaryPortal
} from '../common/PortalCommandCenterLanding';
import { PayrollPeriodRecord } from '../../types/payroll';
import { PayrollPortalTab } from './PayrollCenter';

interface PayrollLandingPageProps {
  activePeriod: PayrollPeriodRecord;
  periods: PayrollPeriodRecord[];
  selectedPeriodId: string;
  onSelectPeriodId: (id: string) => void;
  onApprovePayroll: (periodId: string) => void;
  onDisbursePayroll: (periodId: string) => void;
  onNavigateTab: (tab: PayrollPortalTab) => void;
  projectPlansCount: number;
  quickPayoutsCount: number;
}

export const PayrollLandingPage: React.FC<PayrollLandingPageProps> = ({
  activePeriod,
  periods,
  selectedPeriodId,
  onSelectPeriodId,
  onApprovePayroll,
  onDisbursePayroll,
  onNavigateTab,
  projectPlansCount,
  quickPayoutsCount
}) => {
  // Quick Actions categorized cleanly under stream cards matching the uploaded image
  const payrollQuickActions: QuickActionGroup[] = [
    {
      portalId: 'disbursement-wps',
      portalName: 'WPS & Banking Stream',
      portalIcon: Landmark,
      actions: [
        {
          id: 'qa-auth-release',
          label: 'Authorize Batch',
          icon: CheckCircle2,
          action: () => onApprovePayroll(activePeriod.id),
          color: 'bg-emerald-600 hover:bg-emerald-700 text-white'
        },
        {
          id: 'qa-transmit-wps',
          label: 'Transmit WPS SIF',
          icon: Landmark,
          action: () => onDisbursePayroll(activePeriod.id),
          color: 'bg-sky-600 hover:bg-sky-700 text-white'
        },
        {
          id: 'qa-export-sif',
          label: 'Download SIF',
          icon: Download,
          action: () => {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(activePeriod, null, 2));
            const downloadAnchor = document.createElement('a');
            downloadAnchor.setAttribute("href", dataStr);
            downloadAnchor.setAttribute("download", `WPS_SIF_${activePeriod.cycleNumber}.json`);
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();
          },
          color: 'bg-slate-700 hover:bg-slate-800 text-white'
        },
        {
          id: 'qa-salary-reg',
          label: 'Salary Sheet',
          icon: CreditCard,
          action: () => onNavigateTab('monthly-register'),
          color: 'bg-indigo-600 hover:bg-indigo-700 text-white'
        }
      ]
    },
    {
      portalId: 'project-labor',
      portalName: 'Project Labor & Budgets',
      portalIcon: Building2,
      actions: [
        {
          id: 'qa-proj-plans',
          label: 'Labor Budgets',
          icon: Building2,
          action: () => onNavigateTab('project-payroll'),
          color: 'bg-blue-600 hover:bg-blue-700 text-white'
        },
        {
          id: 'qa-timesheet-match',
          label: 'Verify Timesheets',
          icon: Clock,
          action: () => onNavigateTab('project-payroll'),
          color: 'bg-teal-600 hover:bg-teal-700 text-white'
        },
        {
          id: 'qa-labor-variance',
          label: 'Variance Heatmap',
          icon: Scale,
          action: () => onNavigateTab('project-payroll'),
          color: 'bg-cyan-700 hover:bg-cyan-800 text-white'
        }
      ]
    },
    {
      portalId: 'dept-budget',
      portalName: 'Cost Center Operations',
      portalIcon: FolderTree,
      actions: [
        {
          id: 'qa-fab-burn',
          label: 'Fab Yard Burn',
          icon: FolderTree,
          action: () => onNavigateTab('dept-payroll'),
          color: 'bg-emerald-700 hover:bg-emerald-800 text-white'
        },
        {
          id: 'qa-comm-burn',
          label: 'Commercial Burn',
          icon: FolderTree,
          action: () => onNavigateTab('dept-payroll'),
          color: 'bg-amber-600 hover:bg-amber-700 text-white'
        },
        {
          id: 'qa-headcount-cap',
          label: 'Headcount Caps',
          icon: Building2,
          action: () => onNavigateTab('dept-payroll'),
          color: 'bg-purple-700 hover:bg-purple-800 text-white'
        }
      ]
    },
    {
      portalId: 'statutory-payouts',
      portalName: 'Statutory, Tax & Payouts',
      portalIcon: Scale,
      actions: [
        {
          id: 'qa-epf-remit',
          label: 'EPF 20% Remit',
          icon: Scale,
          action: () => onNavigateTab('statutory'),
          color: 'bg-rose-600 hover:bg-rose-700 text-white'
        },
        {
          id: 'qa-etf-remit',
          label: 'ETF 3% Remit',
          icon: Scale,
          action: () => onNavigateTab('statutory'),
          color: 'bg-pink-600 hover:bg-pink-700 text-white'
        },
        {
          id: 'qa-record-payout',
          label: 'Record Cash Voucher',
          icon: Plus,
          action: () => onNavigateTab('quick-payouts'),
          color: 'bg-amber-700 hover:bg-amber-800 text-white'
        },
        {
          id: 'qa-adv-ledger',
          label: 'Advances Log',
          icon: CreditCard,
          action: () => onNavigateTab('quick-payouts'),
          color: 'bg-stone-700 hover:bg-stone-800 text-white'
        }
      ]
    }
  ];

  // Comprehensive master hierarchy of all sub-portals, sub-sub-portals, and commands
  const payrollPortals: CommandPrimaryPortal[] = [
    // 1. MONTHLY SALARY REGISTER & WPS
    {
      id: 'port-monthly-register',
      name: 'Monthly Salary Register & WPS Disbursement',
      shortLabel: 'Salary Register',
      icon: Landmark,
      badge: `${activePeriod.totalEmployees} Staff`,
      targetTab: 'monthly-register',
      onLaunch: () => onNavigateTab('monthly-register'),
      subPortals: [
        {
          id: 'sub-reg-master',
          name: 'Official Monthly Cycle Register',
          icon: Landmark,
          badge: activePeriod.status,
          subSubPortals: [
            {
              id: 'ssp-reg-employees',
              name: 'Staff Payroll Master Sheet',
              badge: 'Master',
              icon: Landmark,
              actions: [
                { id: 'act-reg-view-full', name: 'Open Complete Monthly Salary Register', badge: 'View All', action: () => onNavigateTab('monthly-register') },
                { id: 'act-reg-payslips', name: 'Generate Individual Employee Payslips', badge: 'Payslips', action: () => onNavigateTab('monthly-register') },
                { id: 'act-reg-batch-print', name: 'Batch Print Monthly Payslip Dossier', badge: 'Print', action: () => onNavigateTab('monthly-register') },
                { id: 'act-reg-export-excel', name: 'Export Master Register to Excel / CSV', badge: 'Export', action: () => onNavigateTab('monthly-register') }
              ]
            },
            {
              id: 'ssp-reg-adjustments',
              name: 'Cycle Adjustments & Prorations',
              badge: 'Prorations',
              icon: Scale,
              actions: [
                { id: 'act-reg-unpaid-leave', name: 'Unpaid Leave (LWP) Deductions Engine', badge: 'Deductions', action: () => onNavigateTab('monthly-register') },
                { id: 'act-reg-mid-join', name: 'Mid-Month Joining Prorated Days Calculation', badge: 'Prorated', action: () => onNavigateTab('monthly-register') },
                { id: 'act-reg-arrears', name: 'Retroactive Salary Arrears Disbursement', badge: 'Arrears', action: () => onNavigateTab('monthly-register') }
              ]
            }
          ]
        },
        {
          id: 'sub-reg-wps-batch',
          name: 'Central Bank WPS SIF Transmission',
          icon: CheckCircle2,
          badge: 'WPS',
          subSubPortals: [
            {
              id: 'ssp-wps-sif',
              name: 'WPS SIF File Generation',
              badge: 'SIF',
              icon: CheckCircle2,
              actions: [
                { id: 'act-wps-export-sif', name: 'Generate Official Central Bank SIF File', badge: 'Export SIF', action: () => onDisbursePayroll(activePeriod.id) },
                { id: 'act-wps-auth-release', name: 'Dual Authorization Signoff for Disbursement', badge: 'Authorize', action: () => onApprovePayroll(activePeriod.id) },
                { id: 'act-wps-bank-ack', name: 'Corporate Bank Settlement Acknowledgment', badge: 'Bank Ack', action: () => onNavigateTab('monthly-register') },
                { id: 'act-wps-mol-compliance', name: 'Ministry of Human Resources (MOHRE) 80% Rule', badge: 'Compliance', action: () => onNavigateTab('monthly-register') }
              ]
            }
          ]
        }
      ]
    },

    // 2. PROJECT-BASED LABOR & MILESTONE BUDGETS
    {
      id: 'port-project-payroll',
      name: 'Project Payroll & Labor Budgets',
      shortLabel: 'Project Labor',
      icon: Building2,
      badge: projectPlansCount,
      targetTab: 'project-payroll',
      onLaunch: () => onNavigateTab('project-payroll'),
      subPortals: [
        {
          id: 'sub-labor-plans',
          name: 'Multi-Tier Labor Plans',
          icon: Building2,
          badge: 'Plans',
          subSubPortals: [
            {
              id: 'ssp-active-plans',
              name: 'Active Project Labor Plans',
              badge: 'Active',
              icon: Building2,
              actions: [
                { id: 'act-plan-a', name: 'ABC Commercial Factory Fitting (Plan A)', badge: 'Open', action: () => onNavigateTab('project-payroll') },
                { id: 'act-plan-b', name: 'Metropolitan Luxury Tower Façade (Plan A)', badge: 'Open', action: () => onNavigateTab('project-payroll') },
                { id: 'act-plan-rates', name: 'Man-Day Budget Rate Caps Configuration', badge: 'Rates', action: () => onNavigateTab('project-payroll') },
                { id: 'act-plan-export', name: 'Export Project Labor Budget Schedule', badge: 'Export', action: () => onNavigateTab('project-payroll') }
              ]
            },
            {
              id: 'ssp-subcon-crew',
              name: 'Subcontractor Labor Packs',
              badge: 'Crews',
              icon: Users,
              actions: [
                { id: 'act-subcon-glazing', name: 'Specialist Glazing Installer Daily Labor Allocation', badge: 'Specialist', action: () => onNavigateTab('project-payroll') },
                { id: 'act-subcon-welders', name: 'Certified 6G Welders Project Billing Matrix', badge: '6G Welders', action: () => onNavigateTab('project-payroll') },
                { id: 'act-subcon-signoff', name: 'Project Engineer Site Labor Verification Signoff', badge: 'Signoff', action: () => onNavigateTab('project-payroll') }
              ]
            }
          ]
        },
        {
          id: 'sub-labor-audit',
          name: 'Actual vs Planned Variance',
          icon: Clock,
          badge: 'Timesheets',
          subSubPortals: [
            {
              id: 'ssp-timesheet-match',
              name: 'Timesheet Variance Reconciliation',
              badge: 'Variance',
              icon: Clock,
              actions: [
                { id: 'act-ts-compare', name: 'Compare Planned vs Actual Site Timesheets', badge: 'Compare', action: () => onNavigateTab('project-payroll') },
                { id: 'act-ts-overtime', name: 'Site Overtime 1.5x / 2.0x Allocation', badge: 'Overtime', action: () => onNavigateTab('project-payroll') },
                { id: 'act-ts-burn', name: 'Labor Burn Rate vs Contract Milestone', badge: 'Milestones', action: () => onNavigateTab('project-payroll') }
              ]
            }
          ]
        }
      ]
    },

    // 3. DEPARTMENT-BASED PAYROLL & COST CENTERS
    {
      id: 'port-dept-payroll',
      name: 'Department-Based Payroll & Cost Centers',
      shortLabel: 'Departments',
      icon: FolderTree,
      badge: 'Cost Centers',
      targetTab: 'dept-payroll',
      onLaunch: () => onNavigateTab('dept-payroll'),
      subPortals: [
        {
          id: 'sub-dept-alloc',
          name: 'Department Headcount Allocations',
          icon: FolderTree,
          badge: 'Headcount',
          subSubPortals: [
            {
              id: 'ssp-ops-dept',
              name: 'Operations & Plant Cost Centers',
              badge: '74.2% Burn',
              icon: FolderTree,
              actions: [
                { id: 'act-dept-fab', name: 'Fabrication Yard & Operations Register', badge: 'Ops', action: () => onNavigateTab('dept-payroll') },
                { id: 'act-dept-site', name: 'Site Installation & Glazing Crew Register', badge: 'Site', action: () => onNavigateTab('dept-payroll') },
                { id: 'act-dept-comm', name: 'Commercial & Administrative Cost Center', badge: 'Admin', action: () => onNavigateTab('dept-payroll') },
                { id: 'act-dept-reconcile', name: 'Departmental Budget Reconcile', badge: 'Reconcile', action: () => onNavigateTab('dept-payroll') }
              ]
            }
          ]
        },
        {
          id: 'sub-dept-caps',
          name: 'Cost Center Overrun Controls',
          icon: Scale,
          badge: 'Controls',
          subSubPortals: [
            {
              id: 'ssp-dept-caps-ctrl',
              name: 'Operational Budget Caps',
              badge: 'Limits',
              icon: Scale,
              actions: [
                { id: 'act-cap-tracker', name: 'Department Burn Rate Pace Monitor', badge: 'Monitor', action: () => onNavigateTab('dept-payroll') },
                { id: 'act-cap-alerts', name: 'Cost Center Overrun Alert Thresholds', badge: 'Alerts', action: () => onNavigateTab('dept-payroll') }
              ]
            }
          ]
        }
      ]
    },

    // 4. STATUTORY & SOCIAL SECURITY COMPLIANCE
    {
      id: 'port-statutory',
      name: 'Accounting & Statutory (EPF / ETF / Taxes)',
      shortLabel: 'Statutory & Taxes',
      icon: Scale,
      badge: 'EPF/ETF',
      targetTab: 'statutory',
      onLaunch: () => onNavigateTab('statutory'),
      subPortals: [
        {
          id: 'sub-stat-funds',
          name: 'Statutory Funds & Remittance',
          icon: Scale,
          badge: 'Funds',
          subSubPortals: [
            {
              id: 'ssp-epf-etf',
              name: 'EPF & ETF Remittance Ledgers',
              badge: 'Matched',
              icon: Scale,
              actions: [
                { id: 'act-epf-20', name: 'EPF 20% (12% Employer + 8% Employee) Remittance', badge: 'EPF 20%', action: () => onNavigateTab('statutory') },
                { id: 'act-etf-3', name: 'ETF 3% Statutory Schedule Ledger', badge: 'ETF 3%', action: () => onNavigateTab('statutory') },
                { id: 'act-stat-bank', name: 'Statutory Bank Statement Reconciliation', badge: 'Bank', action: () => onNavigateTab('statutory') },
                { id: 'act-stat-download', name: 'Download Government Compliance Schedule', badge: 'Download', action: () => onNavigateTab('statutory') }
              ]
            },
            {
              id: 'ssp-gratuity',
              name: 'End of Service Gratuity (EOSB)',
              badge: 'Gratuity',
              icon: Coins,
              actions: [
                { id: 'act-eosb-calc', name: 'Statutory EOSB Gratuity Accrual Ledger', badge: 'Accrual', action: () => onNavigateTab('statutory') },
                { id: 'act-eosb-settle', name: 'Final Settlement Voucher Calculation', badge: 'Settlement', action: () => onNavigateTab('statutory') }
              ]
            }
          ]
        },
        {
          id: 'sub-stat-gl',
          name: 'General Ledger Direct Sync',
          icon: Landmark,
          badge: 'GL Journals',
          subSubPortals: [
            {
              id: 'ssp-gl-post',
              name: 'Job Cost Direct Journal Entries',
              badge: 'GL Post',
              icon: Landmark,
              actions: [
                { id: 'act-gl-journal-post', name: 'Post Monthly Payroll to General Ledger', badge: 'Post', action: () => onNavigateTab('statutory') },
                { id: 'act-gl-cost-alloc', name: 'Direct Project Job Cost Journal Allocation', badge: 'Job Cost', action: () => onNavigateTab('statutory') }
              ]
            }
          ]
        }
      ]
    },

    // 5. QUICK PAYOUTS, ADVANCES & EXPENSE RECOVERY
    {
      id: 'port-quick-payouts',
      name: 'Quick Payouts, Advances & Emergency Loans',
      shortLabel: 'Quick Payouts',
      icon: CreditCard,
      badge: quickPayoutsCount,
      targetTab: 'quick-payouts',
      onLaunch: () => onNavigateTab('quick-payouts'),
      subPortals: [
        {
          id: 'sub-payout-cash',
          name: 'Site Petty Cash & Daily Vouchers',
          icon: CreditCard,
          badge: 'Cash',
          subSubPortals: [
            {
              id: 'ssp-cash-records',
              name: 'Instant Site Cash Payments',
              badge: 'Vouchers',
              icon: CreditCard,
              actions: [
                { id: 'act-cash-record-new', name: 'Record New Quick Payout', badge: 'New Cash', action: () => onNavigateTab('quick-payouts') },
                { id: 'act-cash-vouchers-log', name: 'Site Per Diem & Cash Overtime Vouchers', badge: 'Vouchers', action: () => onNavigateTab('quick-payouts') },
                { id: 'act-cash-signoffs', name: 'Cashier Daily Settlement Signoff', badge: 'Signoff', action: () => onNavigateTab('quick-payouts') }
              ]
            }
          ]
        },
        {
          id: 'sub-payout-advances',
          name: 'Salary Advances & Recovery',
          icon: Landmark,
          badge: 'Advances',
          subSubPortals: [
            {
              id: 'ssp-adv-ledger',
              name: 'Staff Advances Ledger',
              badge: 'Recovery',
              icon: Landmark,
              actions: [
                { id: 'act-adv-active-log', name: 'Active Salary Advances Master Ledger', badge: 'Ledger', action: () => onNavigateTab('quick-payouts') },
                { id: 'act-adv-schedule', name: 'Monthly Payroll Recovery Deductions', badge: 'Deductions', action: () => onNavigateTab('quick-payouts') }
              ]
            }
          ]
        }
      ]
    },

    // 6. OVERTIME, SHIFTS & ALLOWANCES ENGINE
    {
      id: 'port-overtime-shifts',
      name: 'Overtime, Shifts & Night Differential',
      shortLabel: 'Overtime & Shifts',
      icon: Clock,
      badge: '1.5x / 2.0x',
      targetTab: 'monthly-register',
      onLaunch: () => onNavigateTab('monthly-register'),
      subPortals: [
        {
          id: 'sub-ot-multipliers',
          name: 'Overtime Premium Rates',
          icon: Clock,
          badge: 'Multipliers',
          subSubPortals: [
            {
              id: 'ssp-ot-standard',
              name: 'Standard OT & Weekend Calculations',
              badge: '1.25x-1.5x',
              icon: Clock,
              actions: [
                { id: 'act-ot-weekday', name: 'Weekday Overtime (1.25x Base Hourly)', badge: '1.25x', action: () => onNavigateTab('monthly-register') },
                { id: 'act-ot-weekend', name: 'Friday / Weekend Overtime (1.50x Base Hourly)', badge: '1.50x', action: () => onNavigateTab('monthly-register') },
                { id: 'act-ot-holiday', name: 'Official National Holiday Rate (2.00x Base)', badge: '2.00x', action: () => onNavigateTab('monthly-register') }
              ]
            },
            {
              id: 'ssp-ot-special',
              name: 'Site Hazard & Night Differentials',
              badge: 'Special',
              icon: AlertCircle,
              actions: [
                { id: 'act-ot-night', name: 'Night Shift Differential (10 PM to 6 AM)', badge: '+15%', action: () => onNavigateTab('monthly-register') },
                { id: 'act-ot-height', name: 'High-Elevation Structural Hazard Allowance', badge: 'Height Pay', action: () => onNavigateTab('monthly-register') }
              ]
            }
          ]
        }
      ]
    },

    // 7. DISCREPANCY AUDITS & PAYROLL ANALYTICS
    {
      id: 'port-payroll-analytics',
      name: 'Payroll Auditing, Approvals & Cost Analytics',
      shortLabel: 'Audits & Analytics',
      icon: TrendingUp,
      badge: 'Audit Trail',
      targetTab: 'dept-payroll',
      onLaunch: () => onNavigateTab('dept-payroll'),
      subPortals: [
        {
          id: 'sub-audit-fraud',
          name: 'Integrity Checks & Ghost Worker Audit',
          icon: ShieldCheck,
          badge: 'Zero Fraud',
          subSubPortals: [
            {
              id: 'ssp-audit-checks',
              name: 'Automated Integrity Audits',
              badge: 'Verified',
              icon: ShieldCheck,
              actions: [
                { id: 'act-audit-ghost', name: 'Run Biometric Punch vs Payroll Cross-Match', badge: 'Biometric', action: () => onNavigateTab('monthly-register') },
                { id: 'act-audit-iban', name: 'Duplicate IBAN & Bank Account Detector', badge: 'IBAN Check', action: () => onNavigateTab('monthly-register') },
                { id: 'act-audit-ceiling', name: 'Overtime Cap Breaches (>2.5h/day) Review', badge: 'Cap Breaches', action: () => onNavigateTab('monthly-register') }
              ]
            }
          ]
        },
        {
          id: 'sub-analytics-burn',
          name: 'Labor Burn Rate & Man-Hour Yield',
          icon: TrendingUp,
          badge: 'Yield',
          subSubPortals: [
            {
              id: 'ssp-analytics-kpis',
              name: 'Executive Labor Metrics',
              badge: 'KPIs',
              icon: TrendingUp,
              actions: [
                { id: 'act-kpi-manhour-cost', name: 'Effective Cost Per Man-Hour (Fabrication vs Site)', badge: 'Hourly Cost', action: () => onNavigateTab('dept-payroll') },
                { id: 'act-kpi-payroll-trend', name: 'Quarterly Payroll Expenditure Trend Graph', badge: 'Trends', action: () => onNavigateTab('dept-payroll') },
                { id: 'act-kpi-variance-summary', name: 'Budget vs Actual Payroll Variance Summary', badge: 'Variance', action: () => onNavigateTab('project-payroll') }
              ]
            }
          ]
        }
      ]
    }
  ];

  return (
    <PortalCommandCenterLanding
      portalTitle="Payroll & Workforce Accounting Master"
      badgeLabel="Command Center"
      statusBadge="WPS Central Verified"
      headerControls={
        <div className="flex items-center gap-2">
          <select
            value={selectedPeriodId}
            onChange={(e) => onSelectPeriodId(e.target.value)}
            className="bg-slate-50 text-slate-800 border border-slate-200 text-xs px-2.5 py-1 rounded-lg outline-none font-semibold"
          >
            {periods.map(p => (
              <option key={p.id} value={p.id}>{p.month} ({p.status})</option>
            ))}
          </select>
          {activePeriod?.status === 'Pending Review' && (
            <button
              onClick={() => onApprovePayroll(activePeriod.id)}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1 shadow-xs cursor-pointer transition-colors"
            >
              <CheckCircle2 size={12} />
              <span>Authorize</span>
            </button>
          )}
          {activePeriod?.status === 'Approved' && (
            <button
              onClick={() => onDisbursePayroll(activePeriod.id)}
              className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1 shadow-xs cursor-pointer transition-colors"
            >
              <Landmark size={12} />
              <span>Disburse WPS</span>
            </button>
          )}
        </div>
      }
      quickActionGroups={payrollQuickActions}
      primaryPortals={payrollPortals}
      onLaunchPortal={(p) => {
        if (p.targetTab) onNavigateTab(p.targetTab as PayrollPortalTab);
      }}
      searchPlaceholder="Search payroll modules, budgets, WPS & commands..."
    />
  );
};
