import React from 'react';
import {
  Users,
  Clock,
  HardHat,
  Medal,
  Plus,
  Calendar,
  ShieldCheck,
  Scale,
  Award,
  CheckCircle2,
  Briefcase,
  UserCheck,
  Fingerprint,
  Scan,
  Radio,
  Zap,
  Coffee,
  DollarSign,
  CreditCard,
  FileSpreadsheet,
  Sliders,
  BarChart3,
  FileText
} from 'lucide-react';
import {
  PortalCommandCenterLanding,
  QuickActionGroup,
  CommandPrimaryPortal
} from '../common/PortalCommandCenterLanding';
import { Personnel, TimeEntry, Project } from '../../types';

export type WorkforceTab =
  | 'landing'
  | 'biometrics'
  | 'paysheet'
  | 'personnel'
  | 'timesheets'
  | 'deployment'
  | 'certifications'
  | 'recruitment'
  | 'lifecycle'
  | 'performance'
  | 'leaves'
  | 'disciplinary'
  | 'analytics';

interface WorkforceLandingPageProps {
  personnel: Personnel[];
  timeEntries?: TimeEntry[];
  projects?: Project[];
  onNavigateTab: (tab: WorkforceTab) => void;
  onOpenAddPersonnel?: () => void;
  onExportCSV: () => void;
  onExportPDF: () => void;
}

export const WorkforceLandingPage: React.FC<WorkforceLandingPageProps> = ({
  personnel,
  timeEntries = [],
  onNavigateTab,
  onOpenAddPersonnel,
  onExportCSV,
  onExportPDF
}) => {
  const activeCount = personnel.filter(p => (p.status as string) === 'Active' || p.status === 'Assigned').length;
  const certifiedCount = personnel.filter(p => p.certifications && p.certifications.length > 0).length;

  // 6-Card 3x2 Grid matching the exact visual style of the uploaded screenshot
  const quickActionGroups: QuickActionGroup[] = [
    {
      portalId: 'biometrics-attendance',
      portalName: 'Biometrics & Laser Scan',
      portalIcon: Fingerprint,
      actions: [
        {
          id: 'qa-bio-arrival',
          label: 'Arrival / Leave Scan',
          icon: Fingerprint,
          action: () => onNavigateTab('biometrics'),
          color: 'bg-orange-600 hover:bg-orange-700 text-white'
        },
        {
          id: 'qa-laser-card',
          label: 'Laser Card Scan',
          icon: Scan,
          action: () => onNavigateTab('biometrics'),
          color: 'bg-slate-800 hover:bg-slate-900 text-white'
        },
        {
          id: 'qa-shift-late',
          label: 'Shift & Late Rule',
          icon: Clock,
          action: () => onNavigateTab('biometrics'),
          color: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
        },
        {
          id: 'qa-ot-quota',
          label: 'Overtime Quota',
          icon: Zap,
          action: () => onNavigateTab('biometrics'),
          color: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
        }
      ]
    },
    {
      portalId: 'meals-welfare',
      portalName: 'Tea, Meals & Welfare Funds',
      portalIcon: Coffee,
      actions: [
        {
          id: 'qa-meal-scan',
          label: 'Scan Tea & Lunch',
          icon: Coffee,
          action: () => onNavigateTab('biometrics'),
          color: 'bg-emerald-600 hover:bg-emerald-700 text-white'
        },
        {
          id: 'qa-meal-config',
          label: 'Define Meal Rates',
          icon: Sliders,
          action: () => onNavigateTab('biometrics'),
          color: 'bg-slate-800 hover:bg-slate-900 text-white'
        },
        {
          id: 'qa-unclaimed-ben',
          label: 'Unclaimed Benefits',
          icon: Award,
          action: () => onNavigateTab('paysheet'),
          color: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
        },
        {
          id: 'qa-meal-deduct',
          label: 'Salary Deductions',
          icon: DollarSign,
          action: () => onNavigateTab('paysheet'),
          color: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
        }
      ]
    },
    {
      portalId: 'paysheet-statutory',
      portalName: 'Paysheet & Sri Lanka EPF/ETF',
      portalIcon: FileSpreadsheet,
      actions: [
        {
          id: 'qa-master-paysheet',
          label: 'Master Paysheet',
          icon: FileSpreadsheet,
          action: () => onNavigateTab('paysheet'),
          color: 'bg-blue-600 hover:bg-blue-700 text-white'
        },
        {
          id: 'qa-epf-etf-rates',
          label: 'EPF 8/12% & ETF 3%',
          icon: Scale,
          action: () => onNavigateTab('paysheet'),
          color: 'bg-slate-800 hover:bg-slate-900 text-white'
        },
        {
          id: 'qa-gratuity-calc',
          label: 'Gratuity Accrual',
          icon: ShieldCheck,
          action: () => onNavigateTab('paysheet'),
          color: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
        },
        {
          id: 'qa-emp-setup',
          label: 'Employee Pay Setup',
          icon: Sliders,
          action: () => onNavigateTab('paysheet'),
          color: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
        }
      ]
    },
    {
      portalId: 'loans-bonuses',
      portalName: 'Loans, Bonuses & Contracts',
      portalIcon: CreditCard,
      actions: [
        {
          id: 'qa-issue-loan',
          label: 'Loans & Interest',
          icon: CreditCard,
          action: () => onNavigateTab('paysheet'),
          color: 'bg-indigo-600 hover:bg-indigo-700 text-white'
        },
        {
          id: 'qa-special-bonus',
          label: 'Special Bonuses',
          icon: Award,
          action: () => onNavigateTab('paysheet'),
          color: 'bg-slate-800 hover:bg-slate-900 text-white'
        },
        {
          id: 'qa-allowances',
          label: 'Allowances',
          icon: DollarSign,
          action: () => onNavigateTab('paysheet'),
          color: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
        },
        {
          id: 'qa-contracts-comm',
          label: 'Contracts & Comm.',
          icon: FileText,
          action: () => onNavigateTab('paysheet'),
          color: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
        }
      ]
    },
    {
      portalId: 'roster-talent',
      portalName: 'Workforce Roster & Talent',
      portalIcon: Users,
      actions: [
        {
          id: 'qa-add-staff',
          label: 'Add Personnel',
          icon: Plus,
          action: () => {
            onNavigateTab('personnel');
            onOpenAddPersonnel?.();
          },
          color: 'bg-purple-600 hover:bg-purple-700 text-white'
        },
        {
          id: 'qa-staff-roster',
          label: 'Staff Directory',
          icon: Users,
          action: () => onNavigateTab('personnel'),
          color: 'bg-slate-800 hover:bg-slate-900 text-white'
        },
        {
          id: 'qa-recruitment',
          label: 'Recruitment ATS',
          icon: Briefcase,
          action: () => onNavigateTab('recruitment'),
          color: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
        },
        {
          id: 'qa-lifecycle',
          label: 'Onboarding & Exit',
          icon: UserCheck,
          action: () => onNavigateTab('lifecycle'),
          color: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
        }
      ]
    },
    {
      portalId: 'site-governance',
      portalName: 'Site Deployment & Governance',
      portalIcon: HardHat,
      actions: [
        {
          id: 'qa-timesheets',
          label: 'Timesheets',
          icon: Clock,
          action: () => onNavigateTab('timesheets'),
          color: 'bg-teal-600 hover:bg-teal-700 text-white'
        },
        {
          id: 'qa-deployment',
          label: 'Site Deployment',
          icon: HardHat,
          action: () => onNavigateTab('deployment'),
          color: 'bg-slate-800 hover:bg-slate-900 text-white'
        },
        {
          id: 'qa-certifications',
          label: 'Certifications',
          icon: Medal,
          action: () => onNavigateTab('certifications'),
          color: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
        },
        {
          id: 'qa-leaves',
          label: 'Leave Ledger',
          icon: Calendar,
          action: () => onNavigateTab('leaves'),
          color: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
        },
        {
          id: 'qa-kpis',
          label: 'KPIs & Cases',
          icon: Scale,
          action: () => onNavigateTab('performance'),
          color: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
        },
        {
          id: 'qa-analytics',
          label: 'BI Analytics',
          icon: BarChart3,
          action: () => onNavigateTab('analytics'),
          color: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
        }
      ]
    }
  ];

  // Complete 4-Column Universal Portal Directory Hierarchy
  const primaryPortals: CommandPrimaryPortal[] = [
    {
      id: 'port-wf-biometrics',
      name: 'Biometrics, Arrival/Leave & Meals',
      shortLabel: '1. Biometrics & Meals',
      icon: Fingerprint,
      badge: 'Live',
      targetTab: 'biometrics',
      onLaunch: () => onNavigateTab('biometrics'),
      subPortals: [
        {
          id: 'sub-wf-arrival-leave',
          name: 'Arrival to Leave State Engine',
          icon: Fingerprint,
          badge: 'Core',
          onLaunch: () => onNavigateTab('biometrics'),
          subSubPortals: [
            {
              id: 'ssp-wf-bio-punch',
              name: 'Biometric & Laser Terminal',
              icon: Fingerprint,
              actions: [
                { id: 'act-wf-bio-in', name: 'Record Employee Arrival Scan', badge: 'Arrival', action: () => onNavigateTab('biometrics') },
                { id: 'act-wf-bio-out', name: 'Enforce Next Action as Leave', badge: 'Leave', action: () => onNavigateTab('biometrics') },
                { id: 'act-wf-laser-scan', name: 'Laser Barcode / RFID Card Scan', badge: 'Laser', action: () => onNavigateTab('biometrics') }
              ]
            },
            {
              id: 'ssp-wf-shift-late',
              name: 'Shift Punctuality & Late Flagging',
              icon: Clock,
              actions: [
                { id: 'act-wf-shift-assign', name: 'Assign Shift Start & End Time', badge: 'Shift', action: () => onNavigateTab('biometrics') },
                { id: 'act-wf-late-detect', name: 'Auto-Detect Late Arrival Minutes', badge: 'Late', action: () => onNavigateTab('biometrics') }
              ]
            },
            {
              id: 'ssp-wf-ot-quota',
              name: 'Overtime Approval & Quota Cap',
              icon: Zap,
              actions: [
                { id: 'act-wf-ot-approve', name: 'Toggle Employee Overtime Eligibility', badge: 'Approve', action: () => onNavigateTab('biometrics') },
                { id: 'act-wf-ot-cap', name: 'Set Assigned Overtime Hours Cap', badge: 'Quota', action: () => onNavigateTab('biometrics') }
              ]
            }
          ]
        },
        {
          id: 'sub-wf-meal-tea',
          name: 'Tea, Lunch & Meal Card Scanner',
          icon: Coffee,
          badge: 'Welfare',
          onLaunch: () => onNavigateTab('biometrics'),
          subSubPortals: [
            {
              id: 'ssp-wf-meal-scanner',
              name: 'Biometric & Card Meal Issuance',
              icon: Coffee,
              actions: [
                { id: 'act-wf-tea-scan', name: 'Scan Morning / Evening Tea', badge: 'Scan', action: () => onNavigateTab('biometrics') },
                { id: 'act-wf-lunch-scan', name: 'Scan Executive / Staff Lunch', badge: 'Scan', action: () => onNavigateTab('biometrics') },
                { id: 'act-wf-dinner-scan', name: 'Scan Overtime Dinner / Refreshment', badge: 'Scan', action: () => onNavigateTab('biometrics') }
              ]
            },
            {
              id: 'ssp-wf-meal-items',
              name: 'Custom Meal & Fund Rules',
              icon: Sliders,
              actions: [
                { id: 'act-wf-add-meal', name: 'Define Meal / Tea Item & Value', badge: 'Create', action: () => onNavigateTab('biometrics') },
                { id: 'act-wf-unclaimed', name: 'Auto-Credit Unclaimed Meal Benefit', badge: 'Benefit', action: () => onNavigateTab('biometrics') },
                { id: 'act-wf-deduct-meal', name: 'Deduct Unfunded Meals from Salary', badge: 'Deduct', action: () => onNavigateTab('biometrics') }
              ]
            }
          ]
        },
        {
          id: 'sub-wf-muster',
          name: 'Live Gate Muster & Hardware',
          icon: Radio,
          badge: 'Gate',
          onLaunch: () => onNavigateTab('biometrics'),
          subSubPortals: [
            {
              id: 'ssp-wf-gate-feed',
              name: 'Real-Time Gate Feed',
              icon: Radio,
              actions: [
                { id: 'act-wf-gate-logs', name: 'View Single-Line Scan Ledger', badge: 'View', action: () => onNavigateTab('biometrics') },
                { id: 'act-wf-bulk-sync', name: 'Import Offline Terminal Logs', badge: 'Sync', action: () => onNavigateTab('biometrics') }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'port-wf-paysheet',
      name: 'Paysheet, EPF/ETF, Loans & Benefits',
      shortLabel: '2. Paysheet & EPF/ETF',
      icon: DollarSign,
      badge: 'LKR',
      targetTab: 'paysheet',
      onLaunch: () => onNavigateTab('paysheet'),
      subPortals: [
        {
          id: 'sub-wf-master-paysheet',
          name: 'Master Paysheet & Net Pay Engine',
          icon: FileSpreadsheet,
          badge: 'Core',
          onLaunch: () => onNavigateTab('paysheet'),
          subSubPortals: [
            {
              id: 'ssp-wf-pay-table',
              name: 'Single-Line Master Paysheet',
              icon: FileSpreadsheet,
              actions: [
                { id: 'act-wf-open-paysheet', name: 'Launch Master Paysheet Register', badge: 'View', action: () => onNavigateTab('paysheet') },
                { id: 'act-wf-export-pay', name: 'Export Paysheet CSV Report', badge: 'Export', action: () => onNavigateTab('paysheet') }
              ]
            },
            {
              id: 'ssp-wf-meal-reconcile',
              name: 'Meal Benefit & Deduction Sync',
              icon: Coffee,
              actions: [
                { id: 'act-wf-view-unclaimed', name: 'View Unclaimed Meal Benefits Added', badge: 'Benefit', action: () => onNavigateTab('paysheet') },
                { id: 'act-wf-view-deducted', name: 'View Unfunded Meal Deductions', badge: 'Deduct', action: () => onNavigateTab('paysheet') }
              ]
            }
          ]
        },
        {
          id: 'sub-wf-srilanka-law',
          name: 'Sri Lankan Statutory EPF & ETF',
          icon: Scale,
          badge: 'Statutory',
          onLaunch: () => onNavigateTab('paysheet'),
          subSubPortals: [
            {
              id: 'ssp-wf-epf-rates',
              name: 'Configurable EPF & ETF Rates',
              icon: Scale,
              actions: [
                { id: 'act-wf-epf-emp', name: 'Adjust Employee EPF Rate (Default 8%)', badge: '8%', action: () => onNavigateTab('paysheet') },
                { id: 'act-wf-epf-empr', name: 'Adjust Employer EPF Rate (Default 12%)', badge: '12%', action: () => onNavigateTab('paysheet') },
                { id: 'act-wf-etf-empr', name: 'Adjust Employer ETF Rate (Default 3%)', badge: '3%', action: () => onNavigateTab('paysheet') }
              ]
            }
          ]
        },
        {
          id: 'sub-wf-loans',
          name: 'Employee Loans & Repayments',
          icon: CreditCard,
          badge: 'Loans',
          onLaunch: () => onNavigateTab('paysheet'),
          subSubPortals: [
            {
              id: 'ssp-wf-loan-mgr',
              name: 'Loan Principal & Interest Setup',
              icon: CreditCard,
              actions: [
                { id: 'act-wf-new-loan', name: 'Issue Loan / Salary Advance', badge: 'Create', action: () => onNavigateTab('paysheet') },
                { id: 'act-wf-zero-int', name: 'Configure 0% or Custom Interest Rate', badge: '0% / %', action: () => onNavigateTab('paysheet') },
                { id: 'act-wf-loan-deduct', name: 'Auto-Deduct Monthly Installment', badge: 'Auto', action: () => onNavigateTab('paysheet') }
              ]
            }
          ]
        },
        {
          id: 'sub-wf-comp-setup',
          name: 'Gratuity, Bonuses, Allowances & Contracts',
          icon: Award,
          badge: 'Advanced',
          onLaunch: () => onNavigateTab('paysheet'),
          subSubPortals: [
            {
              id: 'ssp-wf-gratuity-bonus',
              name: 'Gratuity & Special Bonuses',
              icon: Award,
              actions: [
                { id: 'act-wf-gratuity', name: 'Calculate Gratuity Accrual & Years', badge: 'Gratuity', action: () => onNavigateTab('paysheet') },
                { id: 'act-wf-spec-bonus', name: 'Assign Special Bonus with Custom Type', badge: 'Bonus', action: () => onNavigateTab('paysheet') }
              ]
            },
            {
              id: 'ssp-wf-allow-contract',
              name: 'Allowances, Contracts & Commissions',
              icon: DollarSign,
              actions: [
                { id: 'act-wf-allowances', name: 'Setup EPF-Liable & Non-EPF Allowances', badge: 'Setup', action: () => onNavigateTab('paysheet') },
                { id: 'act-wf-contracts', name: 'Setup Contract Payouts & Commissions', badge: 'Setup', action: () => onNavigateTab('paysheet') }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'port-wf-personnel',
      name: 'Workforce Roster & Directory',
      shortLabel: '3. Staff Roster',
      icon: Users,
      badge: personnel.length,
      targetTab: 'personnel',
      onLaunch: () => onNavigateTab('personnel'),
      subPortals: [
        {
          id: 'sub-wf-directory',
          name: 'Master Personnel Roster',
          icon: Users,
          badge: `${activeCount} Active`,
          onLaunch: () => onNavigateTab('personnel'),
          subSubPortals: [
            {
              id: 'ssp-wf-craftsmen',
              name: 'Employee Profiles & Trades',
              icon: Users,
              actions: [
                { id: 'act-wf-view-all', name: 'Open Personnel Roster', badge: 'View', action: () => onNavigateTab('personnel') },
                { id: 'act-wf-add-craftsman', name: 'Register New Personnel', badge: 'Create', action: () => { onNavigateTab('personnel'); onOpenAddPersonnel?.(); } },
                { id: 'act-wf-export-roster', name: 'Export Roster CSV', badge: 'Export', action: onExportCSV }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'port-wf-timesheets',
      name: 'Timesheets & Attendance Ledger',
      shortLabel: '4. Timesheets',
      icon: Clock,
      badge: timeEntries.length,
      targetTab: 'timesheets',
      onLaunch: () => onNavigateTab('timesheets'),
      subPortals: [
        {
          id: 'sub-wf-clock',
          name: 'Daily Hours & Overtime Ledger',
          icon: Clock,
          badge: 'Hours',
          onLaunch: () => onNavigateTab('timesheets'),
          subSubPortals: [
            {
              id: 'ssp-wf-ts-verify',
              name: 'Timesheet Verification',
              icon: CheckCircle2,
              actions: [
                { id: 'act-wf-verify-hours', name: 'Open Timesheet Register', badge: 'View', action: () => onNavigateTab('timesheets') },
                { id: 'act-wf-export-pdf', name: 'Export Workforce PDF Summary', badge: 'PDF', action: onExportPDF }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'port-wf-deployment',
      name: 'Site Deployment & Crew Matrix',
      shortLabel: '5. Site Deployment',
      icon: HardHat,
      targetTab: 'deployment',
      onLaunch: () => onNavigateTab('deployment'),
      subPortals: [
        {
          id: 'sub-wf-dispatch',
          name: 'Project Crew Allocation',
          icon: HardHat,
          badge: 'Sites',
          onLaunch: () => onNavigateTab('deployment'),
          subSubPortals: [
            {
              id: 'ssp-wf-site-crews',
              name: 'Active Site Dispatch',
              icon: HardHat,
              actions: [
                { id: 'act-wf-view-deploy', name: 'Open Site Deployment Matrix', badge: 'View', action: () => onNavigateTab('deployment') }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'port-wf-certifications',
      name: 'Certifications & Skill Passports',
      shortLabel: '6. Certifications',
      icon: Medal,
      badge: certifiedCount,
      targetTab: 'certifications',
      onLaunch: () => onNavigateTab('certifications'),
      subPortals: [
        {
          id: 'sub-wf-certs-registry',
          name: 'Trade Licenses & HSE Passports',
          icon: Medal,
          badge: 'Compliance',
          onLaunch: () => onNavigateTab('certifications'),
          subSubPortals: [
            {
              id: 'ssp-wf-certs-list',
              name: 'Credential Expiry Tracker',
              icon: ShieldCheck,
              actions: [
                { id: 'act-wf-view-certs', name: 'Open Certifications Registry', badge: 'View', action: () => onNavigateTab('certifications') }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'port-wf-recruitment',
      name: 'Recruitment & Talent Pipeline',
      shortLabel: '7. Recruitment ATS',
      icon: Briefcase,
      targetTab: 'recruitment',
      onLaunch: () => onNavigateTab('recruitment'),
      subPortals: [
        {
          id: 'sub-wf-rec-pipe',
          name: 'Job Requisitions & Candidates',
          icon: Briefcase,
          badge: 'ATS',
          onLaunch: () => onNavigateTab('recruitment'),
          subSubPortals: [
            {
              id: 'ssp-wf-vacancies',
              name: 'Hiring Pipeline',
              icon: UserCheck,
              actions: [
                { id: 'act-wf-vacancies-list', name: 'Open Recruitment Pipeline', badge: 'View', action: () => onNavigateTab('recruitment') }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'port-wf-lifecycle',
      name: 'Onboarding, Probation & Exit',
      shortLabel: '8. Staff Lifecycle',
      icon: UserCheck,
      targetTab: 'lifecycle',
      onLaunch: () => onNavigateTab('lifecycle'),
      subPortals: [
        {
          id: 'sub-wf-probation',
          name: 'Onboarding & Offboarding',
          icon: UserCheck,
          badge: 'Lifecycle',
          onLaunch: () => onNavigateTab('lifecycle'),
          subSubPortals: [
            {
              id: 'ssp-wf-exit-flow',
              name: 'Probation & Exit Clearances',
              icon: UserCheck,
              actions: [
                { id: 'act-wf-probation-radar', name: 'Open Lifecycle Portal', badge: 'View', action: () => onNavigateTab('lifecycle') }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'port-wf-performance',
      name: 'KPI Scorecards & Appraisals',
      shortLabel: '9. Performance KPIs',
      icon: Award,
      targetTab: 'performance',
      onLaunch: () => onNavigateTab('performance'),
      subPortals: [
        {
          id: 'sub-wf-kpi-metrics',
          name: 'Productivity & Quality Reviews',
          icon: Award,
          badge: 'KPIs',
          onLaunch: () => onNavigateTab('performance'),
          subSubPortals: [
            {
              id: 'ssp-wf-kpi-detail',
              name: 'Employee Appraisals',
              icon: Award,
              actions: [
                { id: 'act-wf-view-kpis', name: 'Open Performance Portal', badge: 'View', action: () => onNavigateTab('performance') }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'port-wf-leaves',
      name: 'Leaves, Holidays & Advances',
      shortLabel: '10. Leaves & Advances',
      icon: Calendar,
      targetTab: 'leaves',
      onLaunch: () => onNavigateTab('leaves'),
      subPortals: [
        {
          id: 'sub-wf-leave-requests',
          name: 'Leave Requests & Quotas',
          icon: Calendar,
          badge: 'Leaves',
          onLaunch: () => onNavigateTab('leaves'),
          subSubPortals: [
            {
              id: 'ssp-wf-advances',
              name: 'Leave & Advance Ledger',
              icon: Calendar,
              actions: [
                { id: 'act-wf-leave-board', name: 'Open Leaves & Advances', badge: 'View', action: () => onNavigateTab('leaves') }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'port-wf-disciplinary',
      name: 'Disciplinary & Grievance Cases',
      shortLabel: '11. Disciplinary Cases',
      icon: Scale,
      targetTab: 'disciplinary',
      onLaunch: () => onNavigateTab('disciplinary'),
      subPortals: [
        {
          id: 'sub-wf-case-files',
          name: 'Incident & Grievance Logs',
          icon: Scale,
          badge: 'Cases',
          onLaunch: () => onNavigateTab('disciplinary'),
          subSubPortals: [
            {
              id: 'ssp-wf-hse-cases',
              name: 'Hearings & Warnings',
              icon: Scale,
              actions: [
                { id: 'act-wf-active-cases', name: 'Open Disciplinary Portal', badge: 'View', action: () => onNavigateTab('disciplinary') }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'port-wf-analytics',
      name: 'Workforce BI & Cost Analytics',
      shortLabel: '12. BI Analytics',
      icon: BarChart3,
      targetTab: 'analytics',
      onLaunch: () => onNavigateTab('analytics'),
      subPortals: [
        {
          id: 'sub-wf-analytics-dash',
          name: 'Utilization & Cost Ratios',
          icon: BarChart3,
          badge: 'BI',
          onLaunch: () => onNavigateTab('analytics'),
          subSubPortals: [
            {
              id: 'ssp-wf-utilization',
              name: 'Workforce Intelligence',
              icon: BarChart3,
              actions: [
                { id: 'act-wf-view-analytics', name: 'Open Workforce Analytics', badge: 'View', action: () => onNavigateTab('analytics') }
              ]
            }
          ]
        }
      ]
    }
  ];

  return (
    <PortalCommandCenterLanding
      portalTitle="Workforce & HR Command Hub"
      badgeLabel="Operations Hub"
      statusBadge="RBAC Active"
      quickActionGroups={quickActionGroups}
      primaryPortals={primaryPortals}
      onLaunchPortal={(p) => {
        if (p.targetTab) onNavigateTab(p.targetTab as WorkforceTab);
      }}
      searchPlaceholder="Search workforce portals, shifts, paysheets..."
    />
  );
};
