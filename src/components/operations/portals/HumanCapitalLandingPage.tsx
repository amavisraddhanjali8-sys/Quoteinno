import React from 'react';
import {
  Users,
  Building2,
  Briefcase,
  UserCheck,
  ShieldCheck,
  Clock,
  DollarSign,
  Award,
  GraduationCap,
  AlertCircle,
  FileText,
  TrendingUp,
  BarChart3,
  Plus,
  Calendar,
  Layers,
  CheckCircle2,
  FolderTree,
  Scale,
  CreditCard,
  Fingerprint,
  Scan,
  Coffee,
  FileSpreadsheet,
  Sliders,
  Zap
} from 'lucide-react';
import {
  PortalCommandCenterLanding,
  QuickActionGroup,
  CommandPrimaryPortal
} from '../../common/PortalCommandCenterLanding';
import { HRPortalView } from '../../../types/hr';

interface HumanCapitalLandingPageProps {
  onNavigatePortal: (portal: HRPortalView) => void;
  onQuickPunch: (type: 'IN' | 'OUT') => void;
  onOpenBiometrics?: () => void;
  onOpenAddEmployee: () => void;
  onOpenAddVacancy: () => void;
  onOpenApplyLeave: () => void;
  onOpenLogCase: () => void;
  onExportCSV: () => void;
  counts: {
    totalEmployees: number;
    activeVacancies: number;
    pendingLeave: number;
    openCases: number;
    todayPresent: number;
  };
}

export const HumanCapitalLandingPage: React.FC<HumanCapitalLandingPageProps> = ({
  onNavigatePortal,
  onQuickPunch,
  onOpenBiometrics,
  onOpenAddEmployee,
  onOpenAddVacancy,
  onOpenApplyLeave,
  onOpenLogCase,
  onExportCSV,
  counts
}) => {
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
          action: () => onNavigatePortal('biometrics'),
          color: 'bg-orange-600 hover:bg-orange-700 text-white'
        },
        {
          id: 'qa-laser-card',
          label: 'Laser Card Scan',
          icon: Scan,
          action: () => onOpenBiometrics ? onOpenBiometrics() : onNavigatePortal('biometrics'),
          color: 'bg-slate-800 hover:bg-slate-900 text-white'
        },
        {
          id: 'qa-punch-in',
          label: 'Mark Arrival',
          icon: Clock,
          action: () => onQuickPunch('IN'),
          color: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
        },
        {
          id: 'qa-punch-out',
          label: 'Mark Leave',
          icon: Zap,
          action: () => onQuickPunch('OUT'),
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
          action: () => onNavigatePortal('meals'),
          color: 'bg-emerald-600 hover:bg-emerald-700 text-white'
        },
        {
          id: 'qa-meal-config',
          label: 'Define Meal Rates',
          icon: Sliders,
          action: () => onNavigatePortal('meals'),
          color: 'bg-slate-800 hover:bg-slate-900 text-white'
        },
        {
          id: 'qa-unclaimed-ben',
          label: 'Unclaimed Benefits',
          icon: Award,
          action: () => onNavigatePortal('compensation'),
          color: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
        },
        {
          id: 'qa-meal-deduct',
          label: 'Salary Deductions',
          icon: DollarSign,
          action: () => onNavigatePortal('compensation'),
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
          action: () => onNavigatePortal('compensation'),
          color: 'bg-blue-600 hover:bg-blue-700 text-white'
        },
        {
          id: 'qa-epf-etf',
          label: 'EPF 8/12% & ETF 3%',
          icon: Scale,
          action: () => onNavigatePortal('compensation'),
          color: 'bg-slate-800 hover:bg-slate-900 text-white'
        },
        {
          id: 'qa-gratuity',
          label: 'Gratuity Accrual',
          icon: ShieldCheck,
          action: () => onNavigatePortal('compensation'),
          color: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
        },
        {
          id: 'qa-payroll-reg',
          label: 'Payroll Register',
          icon: DollarSign,
          action: () => onNavigatePortal('payroll'),
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
          id: 'qa-loans',
          label: 'Loans & Interest',
          icon: CreditCard,
          action: () => onNavigatePortal('loans'),
          color: 'bg-indigo-600 hover:bg-indigo-700 text-white'
        },
        {
          id: 'qa-bonuses',
          label: 'Special Bonuses',
          icon: Award,
          action: () => onNavigatePortal('compensation'),
          color: 'bg-slate-800 hover:bg-slate-900 text-white'
        },
        {
          id: 'qa-allowances',
          label: 'Allowances',
          icon: DollarSign,
          action: () => onNavigatePortal('compensation'),
          color: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
        },
        {
          id: 'qa-contracts',
          label: 'Contracts & Comm.',
          icon: FileText,
          action: () => onNavigatePortal('compensation'),
          color: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
        }
      ]
    },
    {
      portalId: 'talent-stream',
      portalName: 'HR Master & Recruitment',
      portalIcon: Users,
      actions: [
        {
          id: 'qa-add-employee',
          label: 'Add Employee',
          icon: Plus,
          action: onOpenAddEmployee,
          color: 'bg-purple-600 hover:bg-purple-700 text-white'
        },
        {
          id: 'qa-admin-dir',
          label: 'Staff Directory',
          icon: Users,
          action: () => onNavigatePortal('admin'),
          color: 'bg-slate-800 hover:bg-slate-900 text-white'
        },
        {
          id: 'qa-recruitment',
          label: 'Recruitment ATS',
          icon: Briefcase,
          action: () => onNavigatePortal('recruitment'),
          color: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
        },
        {
          id: 'qa-ess-mss',
          label: 'ESS / MSS Portal',
          icon: UserCheck,
          action: () => onNavigatePortal('ess'),
          color: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
        }
      ]
    },
    {
      portalId: 'governance-stream',
      portalName: 'Executive, LMS & Governance',
      portalIcon: BarChart3,
      actions: [
        {
          id: 'qa-exec-dash',
          label: 'Executive HR',
          icon: Building2,
          action: () => onNavigatePortal('executive'),
          color: 'bg-teal-600 hover:bg-teal-700 text-white'
        },
        {
          id: 'qa-performance',
          label: 'Performance',
          icon: Award,
          action: () => onNavigatePortal('performance'),
          color: 'bg-slate-800 hover:bg-slate-900 text-white'
        },
        {
          id: 'qa-learning',
          label: 'Learning LMS',
          icon: GraduationCap,
          action: () => onNavigatePortal('learning'),
          color: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
        },
        {
          id: 'qa-relations',
          label: 'Relations & Cases',
          icon: AlertCircle,
          action: () => onNavigatePortal('relations'),
          color: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
        },
        {
          id: 'qa-docs-vault',
          label: 'Docs Vault',
          icon: FileText,
          action: () => onNavigatePortal('documents'),
          color: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
        },
        {
          id: 'qa-hr-kpis',
          label: 'BI Analytics',
          icon: BarChart3,
          action: () => onNavigatePortal('analytics'),
          color: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
        }
      ]
    }
  ];

  // Complete 4-Column Universal Portal Directory Hierarchy
  const primaryPortals: CommandPrimaryPortal[] = [
    {
      id: 'port-hr-biometrics',
      name: 'Biometrics, Shift & Meal Scanner',
      shortLabel: '1. Biometrics & Meals',
      icon: Fingerprint,
      badge: 'Live',
      targetTab: 'biometrics',
      onLaunch: () => onNavigatePortal('biometrics'),
      subPortals: [
        {
          id: 'sub-bio-arrival',
          name: 'Arrival to Leave & Shift Late',
          icon: Fingerprint,
          badge: 'Core',
          onLaunch: () => onNavigatePortal('biometrics'),
          subSubPortals: [
            {
              id: 'ssp-bio-punch',
              name: 'Arrival to Leave State Engine',
              icon: Fingerprint,
              actions: [
                { id: 'act-bio-open', name: 'Record Arrival Biometric / Laser Scan', badge: 'Arrival', action: () => onNavigatePortal('biometrics') },
                { id: 'act-bio-leave', name: 'Enforce Next Action as Leave Scan', badge: 'Leave', action: () => onNavigatePortal('biometrics') },
                { id: 'act-bio-shift', name: 'Shift Start Punctuality & Late Flag', badge: 'Late', action: () => onNavigatePortal('biometrics') },
                { id: 'act-bio-ot', name: 'Approved Overtime Quota Enforcement', badge: 'OT Cap', action: () => onNavigatePortal('biometrics') }
              ]
            }
          ]
        },
        {
          id: 'sub-bio-meals',
          name: 'Tea, Lunch & Welfare Card Scan',
          icon: Coffee,
          badge: 'Welfare',
          onLaunch: () => onNavigatePortal('meals'),
          subSubPortals: [
            {
              id: 'ssp-meal-scan',
              name: 'Meal & Refreshment Terminal',
              icon: Coffee,
              actions: [
                { id: 'act-meal-open', name: 'Scan Card / Biometric for Tea & Lunch', badge: 'Scan', action: () => onNavigatePortal('meals') },
                { id: 'act-meal-define', name: 'Define Meal / Tea Item & Value', badge: 'Config', action: () => onNavigatePortal('meals') },
                { id: 'act-meal-unclaimed', name: 'Auto-Add Unclaimed Fund to Benefits', badge: 'Benefit', action: () => onNavigatePortal('compensation') },
                { id: 'act-meal-deduct', name: 'Deduct Unfunded Meal from Salary', badge: 'Deduct', action: () => onNavigatePortal('compensation') }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'port-hr-compensation',
      name: 'Paysheet, EPF/ETF, Loans & Bonuses',
      shortLabel: '2. Paysheet & EPF/ETF',
      icon: DollarSign,
      badge: 'LKR',
      targetTab: 'compensation',
      onLaunch: () => onNavigatePortal('compensation'),
      subPortals: [
        {
          id: 'sub-comp-sheet',
          name: 'Master Paysheet & Sri Lanka Law',
          icon: FileSpreadsheet,
          badge: 'Statutory',
          onLaunch: () => onNavigatePortal('compensation'),
          subSubPortals: [
            {
              id: 'ssp-comp-all',
              name: 'Master Paysheet & EPF/ETF Rates',
              icon: DollarSign,
              actions: [
                { id: 'act-comp-open', name: 'Open Single-Line Master Paysheet', badge: 'View', action: () => onNavigatePortal('compensation') },
                { id: 'act-comp-epf', name: 'Adjust Sri Lanka EPF (8%/12%) & ETF (3%)', badge: 'Rates', action: () => onNavigatePortal('compensation') }
              ]
            },
            {
              id: 'ssp-comp-adv',
              name: 'Gratuity, Bonuses, Allowances & Contracts',
              icon: Award,
              actions: [
                { id: 'act-comp-gratuity', name: 'Setup Gratuity Accrual & Service Years', badge: 'Gratuity', action: () => onNavigatePortal('compensation') },
                { id: 'act-comp-bonus', name: 'Assign Special Bonuses with Types', badge: 'Bonus', action: () => onNavigatePortal('compensation') },
                { id: 'act-comp-contract', name: 'Configure Allowances, Contracts & Comm.', badge: 'Setup', action: () => onNavigatePortal('compensation') }
              ]
            }
          ]
        },
        {
          id: 'sub-comp-loans',
          name: 'Employee Loans & Interest Engine',
          icon: CreditCard,
          badge: 'Loans',
          onLaunch: () => onNavigatePortal('loans'),
          subSubPortals: [
            {
              id: 'ssp-loans-mgmt',
              name: 'Loan Repayments & 0% Interest',
              icon: CreditCard,
              actions: [
                { id: 'act-loans-open', name: 'Issue Employee Loan / Advance', badge: 'Create', action: () => onNavigatePortal('loans') },
                { id: 'act-loans-zero', name: 'Configure 0% or Custom Interest Rate', badge: '0% / %', action: () => onNavigatePortal('loans') }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'port-hr-executive',
      name: 'Executive HR Cockpit',
      shortLabel: '3. Executive HR',
      icon: Building2,
      targetTab: 'executive',
      onLaunch: () => onNavigatePortal('executive'),
      subPortals: [
        {
          id: 'sub-exec-kpis',
          name: 'Executive Summary & Org Chart',
          icon: Building2,
          badge: `${counts.totalEmployees}`,
          onLaunch: () => onNavigatePortal('executive'),
          subSubPortals: [
            {
              id: 'ssp-exec-summary',
              name: 'Headcount & Org Tree',
              icon: FolderTree,
              actions: [
                { id: 'act-exec-cockpit', name: 'Open Executive HR Portal', badge: 'View', action: () => onNavigatePortal('executive') },
                { id: 'act-exec-export', name: 'Export HR Master CSV', badge: 'Export', action: onExportCSV }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'port-hr-admin',
      name: 'HR Master & Employee Directory',
      shortLabel: '4. HR Master',
      icon: Users,
      badge: counts.totalEmployees,
      targetTab: 'admin',
      onLaunch: () => onNavigatePortal('admin'),
      subPortals: [
        {
          id: 'sub-admin-roster',
          name: 'Employee Directory & Lifecycle',
          icon: Users,
          badge: 'Core',
          onLaunch: () => onNavigatePortal('admin'),
          subSubPortals: [
            {
              id: 'ssp-admin-profiles',
              name: 'Profiles, Contracts & Assets',
              icon: Layers,
              actions: [
                { id: 'act-admin-browse', name: 'Open HR Master Directory', badge: 'View', action: () => onNavigatePortal('admin') },
                { id: 'act-admin-add-emp', name: 'Register New Employee', badge: 'Create', action: onOpenAddEmployee }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'port-hr-recruitment',
      name: 'Recruitment & ATS Pipeline',
      shortLabel: '5. Recruitment ATS',
      icon: Briefcase,
      badge: counts.activeVacancies,
      targetTab: 'recruitment',
      onLaunch: () => onNavigatePortal('recruitment'),
      subPortals: [
        {
          id: 'sub-ats-jobs',
          name: 'Vacancies & Candidate Pipeline',
          icon: Briefcase,
          badge: 'ATS',
          onLaunch: () => onNavigatePortal('recruitment'),
          subSubPortals: [
            {
              id: 'ssp-ats-postings',
              name: 'Job Openings & Offers',
              icon: Briefcase,
              actions: [
                { id: 'act-ats-view-jobs', name: 'Open Recruitment Portal', badge: 'View', action: () => onNavigatePortal('recruitment') },
                { id: 'act-ats-new-job', name: 'Publish Job Vacancy', badge: 'Create', action: onOpenAddVacancy }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'port-hr-ess',
      name: 'Employee Self-Service (ESS)',
      shortLabel: '6. ESS Portal',
      icon: UserCheck,
      targetTab: 'ess',
      onLaunch: () => onNavigatePortal('ess'),
      subPortals: [
        {
          id: 'sub-ess-requests',
          name: 'Employee Self-Service',
          icon: Calendar,
          badge: 'Self',
          onLaunch: () => onNavigatePortal('ess'),
          subSubPortals: [
            {
              id: 'ssp-ess-leave-mgmt',
              name: 'Leave Requests & Payslips',
              icon: Calendar,
              actions: [
                { id: 'act-ess-open', name: 'Open ESS Portal', badge: 'View', action: () => onNavigatePortal('ess') },
                { id: 'act-ess-apply-leave', name: 'Submit Leave Application', badge: 'Modal', action: onOpenApplyLeave }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'port-hr-mss',
      name: 'Manager Self-Service (MSS)',
      shortLabel: '7. MSS Portal',
      icon: ShieldCheck,
      targetTab: 'mss',
      onLaunch: () => onNavigatePortal('mss'),
      subPortals: [
        {
          id: 'sub-mss-approvals',
          name: 'Team Approvals & Rosters',
          icon: CheckCircle2,
          badge: `${counts.pendingLeave} Pending`,
          onLaunch: () => onNavigatePortal('mss'),
          subSubPortals: [
            {
              id: 'ssp-mss-queue',
              name: 'Leave & OT Approval Queue',
              icon: CheckCircle2,
              actions: [
                { id: 'act-mss-open-queue', name: 'Open MSS Portal', badge: 'View', action: () => onNavigatePortal('mss') }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'port-hr-attendance',
      name: 'Attendance & Shift Roster',
      shortLabel: '8. Attendance',
      icon: Clock,
      badge: counts.todayPresent,
      targetTab: 'attendance',
      onLaunch: () => onNavigatePortal('attendance'),
      subPortals: [
        {
          id: 'sub-att-live',
          name: 'Daily Attendance & Shifts',
          icon: Clock,
          badge: 'Logs',
          onLaunch: () => onNavigatePortal('attendance'),
          subSubPortals: [
            {
              id: 'ssp-att-punches',
              name: 'Attendance Logs',
              icon: Clock,
              actions: [
                { id: 'act-att-roster-view', name: 'Open Attendance Portal', badge: 'View', action: () => onNavigatePortal('attendance') }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'port-hr-payroll',
      name: 'Payroll & Salary Register',
      shortLabel: '9. Payroll Register',
      icon: DollarSign,
      targetTab: 'payroll',
      onLaunch: () => onNavigatePortal('payroll'),
      subPortals: [
        {
          id: 'sub-pay-integration',
          name: 'Salary & Disbursement Register',
          icon: DollarSign,
          badge: 'Finance',
          onLaunch: () => onNavigatePortal('payroll'),
          subSubPortals: [
            {
              id: 'ssp-pay-scales',
              name: 'Payroll Ledger',
              icon: DollarSign,
              actions: [
                { id: 'act-pay-view-scales', name: 'Open Payroll Portal', badge: 'View', action: () => onNavigatePortal('payroll') }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'port-hr-performance',
      name: 'Performance & KPI Appraisals',
      shortLabel: '10. Performance',
      icon: Award,
      targetTab: 'performance',
      onLaunch: () => onNavigatePortal('performance'),
      subPortals: [
        {
          id: 'sub-perf-cycles',
          name: 'KPIs & Appraisal Cycles',
          icon: Award,
          badge: 'KPIs',
          onLaunch: () => onNavigatePortal('performance'),
          subSubPortals: [
            {
              id: 'ssp-perf-kpis',
              name: 'Employee Appraisals',
              icon: Award,
              actions: [
                { id: 'act-perf-reviews', name: 'Open Performance Portal', badge: 'View', action: () => onNavigatePortal('performance') }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'port-hr-learning',
      name: 'Learning & Training LMS',
      shortLabel: '11. Learning LMS',
      icon: GraduationCap,
      targetTab: 'learning',
      onLaunch: () => onNavigatePortal('learning'),
      subPortals: [
        {
          id: 'sub-learn-courses',
          name: 'Training Courses & Certifications',
          icon: GraduationCap,
          badge: 'LMS',
          onLaunch: () => onNavigatePortal('learning'),
          subSubPortals: [
            {
              id: 'ssp-learn-modules',
              name: 'Course Catalog',
              icon: GraduationCap,
              actions: [
                { id: 'act-learn-catalog', name: 'Open Learning Portal', badge: 'View', action: () => onNavigatePortal('learning') }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'port-hr-relations',
      name: 'Employee Relations & Disciplinary',
      shortLabel: '12. Relations & Cases',
      icon: AlertCircle,
      badge: counts.openCases,
      targetTab: 'relations',
      onLaunch: () => onNavigatePortal('relations'),
      subPortals: [
        {
          id: 'sub-rel-cases',
          name: 'Disciplinary & Grievance Cases',
          icon: AlertCircle,
          badge: 'Cases',
          onLaunch: () => onNavigatePortal('relations'),
          subSubPortals: [
            {
              id: 'ssp-rel-investigations',
              name: 'Investigations & Hearings',
              icon: AlertCircle,
              actions: [
                { id: 'act-rel-case-archive', name: 'Open Relations Portal', badge: 'View', action: () => onNavigatePortal('relations') },
                { id: 'act-rel-log-case', name: 'Log New Disciplinary Case', badge: 'Modal', action: onOpenLogCase }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'port-hr-documents',
      name: 'Document & Compliance Vault',
      shortLabel: '13. Document Vault',
      icon: FileText,
      targetTab: 'documents',
      onLaunch: () => onNavigatePortal('documents'),
      subPortals: [
        {
          id: 'sub-doc-vault',
          name: 'Contracts, Visas & IDs',
          icon: FileText,
          badge: 'Vault',
          onLaunch: () => onNavigatePortal('documents'),
          subSubPortals: [
            {
              id: 'ssp-doc-records',
              name: 'Document Expiry Tracker',
              icon: FileText,
              actions: [
                { id: 'act-doc-visa-tracker', name: 'Open Document Vault', badge: 'View', action: () => onNavigatePortal('documents') }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'port-hr-planning',
      name: 'Workforce Capacity Planning',
      shortLabel: '14. Workforce Planning',
      icon: TrendingUp,
      targetTab: 'planning',
      onLaunch: () => onNavigatePortal('planning'),
      subPortals: [
        {
          id: 'sub-plan-capacity',
          name: 'Headcount & Budget Forecast',
          icon: TrendingUp,
          badge: 'Plan',
          onLaunch: () => onNavigatePortal('planning'),
          subSubPortals: [
            {
              id: 'ssp-plan-gaps',
              name: 'Manpower Demand',
              icon: TrendingUp,
              actions: [
                { id: 'act-plan-forecast', name: 'Open Planning Portal', badge: 'View', action: () => onNavigatePortal('planning') }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'port-hr-analytics',
      name: 'HR Intelligence & BI Analytics',
      shortLabel: '15. BI Analytics',
      icon: BarChart3,
      targetTab: 'analytics',
      onLaunch: () => onNavigatePortal('analytics'),
      subPortals: [
        {
          id: 'sub-analytics-bi',
          name: 'Attrition, Diversity & Cost BI',
          icon: BarChart3,
          badge: 'BI',
          onLaunch: () => onNavigatePortal('analytics'),
          subSubPortals: [
            {
              id: 'ssp-analytics-dash',
              name: 'HR Metrics & Reports',
              icon: BarChart3,
              actions: [
                { id: 'act-bi-nationalization', name: 'Open Analytics Portal', badge: 'View', action: () => onNavigatePortal('analytics') }
              ]
            }
          ]
        }
      ]
    }
  ];

  return (
    <PortalCommandCenterLanding
      portalTitle="HR & Workforce Command Hub"
      badgeLabel="Operations Hub"
      statusBadge="RBAC Active"
      quickActionGroups={quickActionGroups}
      primaryPortals={primaryPortals}
      onLaunchPortal={(p) => {
        if (p.targetTab) onNavigatePortal(p.targetTab as HRPortalView);
      }}
      searchPlaceholder="Search HR portals, shifts, paysheets, loans..."
    />
  );
};
