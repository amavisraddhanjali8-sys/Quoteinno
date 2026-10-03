import React from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  FileCheck,
  Phone,
  Plus,
  Download,
  CheckCircle2,
  HardHat,
  HeartPulse,
  Flame,
  FileText,
  Layers,
  Scale,
  Wrench,
  Users,
  Truck,
  Building2,
  ClipboardCheck,
  Package,
  Lock
} from 'lucide-react';
import {
  PortalCommandCenterLanding,
  QuickActionGroup,
  CommandPrimaryPortal
} from '../common/PortalCommandCenterLanding';
import { SitePermit, IncidentReport, Project } from '../../types';
import {
  HseRiskJsaRecord,
  HseSiteInspectionRecord,
  PpeInventoryRecord
} from '../../services/safetyControlService';

export type SafetyTab =
  | 'landing'
  | 'permits'
  | 'risks'
  | 'inspections'
  | 'hse'
  | 'incidents'
  | 'contacts';

interface SafetyLandingPageProps {
  sitePermits: SitePermit[];
  incidentReports: IncidentReport[];
  riskRecords?: HseRiskJsaRecord[];
  inspectionRecords?: HseSiteInspectionRecord[];
  ppeRecords?: PpeInventoryRecord[];
  projects?: Project[];
  onNavigateTab: (tab: SafetyTab) => void;
  onOpenAddPermit?: () => void;
  onOpenAddIncident?: () => void;
  onOpenAddRisk?: () => void;
  onOpenAddInspection?: () => void;
  onOpenAddBrief?: () => void;
  onNavigatePortal?: (portalView: string, subTab?: string) => void;
  onExportCSV: () => void;
  onExportPDF: () => void;
}

export const SafetyLandingPage: React.FC<SafetyLandingPageProps> = ({
  sitePermits,
  incidentReports,
  riskRecords = [],
  inspectionRecords = [],
  ppeRecords = [],
  onNavigateTab,
  onOpenAddPermit,
  onOpenAddIncident,
  onOpenAddRisk,
  onOpenAddInspection,
  onOpenAddBrief,
  onNavigatePortal,
  onExportCSV,
  onExportPDF
}) => {
  const activePermitsCount = sitePermits.filter(
    p => p.status === 'Active'
  ).length;
  const openIncidentsCount = incidentReports.filter(
    i => i.status !== 'Closed'
  ).length;
  const approvedRisksCount = riskRecords.filter(
    r => r.status === 'Approved'
  ).length;
  const safeTagsCount = inspectionRecords.filter(
    i => i.tagStatus === 'Green Tag (Safe)'
  ).length;
  const lowPpeCount = ppeRecords.filter(p => p.stockQty <= p.minStock).length;

  // 6-Card (3x2) Quick Actions Grid with simple words & minimal UI
  const quickActionGroups: QuickActionGroup[] = [
    {
      portalId: 'ptw-actions',
      portalName: '1. Work Permits (PTW)',
      portalIcon: FileCheck,
      actions: [
        {
          id: 'qa-issue-ptw',
          label: 'Issue PTW',
          icon: Plus,
          action: () => {
            onNavigateTab('permits');
            onOpenAddPermit?.();
          },
          color: 'bg-orange-600 hover:bg-orange-700 text-white'
        },
        {
          id: 'qa-ptw-list',
          label: 'Active PTWs',
          icon: FileCheck,
          action: () => onNavigateTab('permits'),
          color: 'bg-slate-800 hover:bg-slate-900 text-white'
        },
        {
          id: 'qa-hot-heights',
          label: 'Hot / Heights',
          icon: Flame,
          action: () => onNavigateTab('permits'),
          color: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
        },
        {
          id: 'qa-loto-lock',
          label: 'LOTO Lock',
          icon: Lock,
          action: () => onNavigateTab('permits'),
          color: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
        }
      ]
    },
    {
      portalId: 'risk-jsa-actions',
      portalName: '2. Risk & JSA Control',
      portalIcon: Scale,
      actions: [
        {
          id: 'qa-new-jsa',
          label: 'New JSA',
          icon: Plus,
          action: () => {
            onNavigateTab('risks');
            onOpenAddRisk?.();
          },
          color: 'bg-blue-600 hover:bg-blue-700 text-white'
        },
        {
          id: 'qa-risk-list',
          label: 'Risk Matrix',
          icon: Scale,
          action: () => onNavigateTab('risks'),
          color: 'bg-slate-800 hover:bg-slate-900 text-white'
        },
        {
          id: 'qa-controls',
          label: 'Controls Check',
          icon: CheckCircle2,
          action: () => onNavigateTab('risks'),
          color: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
        },
        {
          id: 'qa-stop-work',
          label: 'Stop Work',
          icon: ShieldAlert,
          action: () => onNavigateTab('risks'),
          color: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
        }
      ]
    },
    {
      portalId: 'inspections-ppe-actions',
      portalName: '3. Inspections & PPE',
      portalIcon: ClipboardCheck,
      actions: [
        {
          id: 'qa-site-walk',
          label: 'New Tag Check',
          icon: ClipboardCheck,
          action: () => {
            onNavigateTab('inspections');
            onOpenAddInspection?.();
          },
          color: 'bg-emerald-600 hover:bg-emerald-700 text-white'
        },
        {
          id: 'qa-scaffold-tag',
          label: 'Scaffold Tags',
          icon: CheckCircle2,
          action: () => onNavigateTab('inspections'),
          color: 'bg-slate-800 hover:bg-slate-900 text-white'
        },
        {
          id: 'qa-ppe-stock',
          label: 'PPE Stock',
          icon: HardHat,
          action: () => onNavigateTab('inspections'),
          color: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
        },
        {
          id: 'qa-fire-gear',
          label: 'Fire & Rigging',
          icon: Flame,
          action: () => onNavigateTab('inspections'),
          color: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
        }
      ]
    },
    {
      portalId: 'toolbox-induction-actions',
      portalName: '4. Toolbox & Induction',
      portalIcon: HardHat,
      actions: [
        {
          id: 'qa-new-talk',
          label: 'Log Briefing',
          icon: Plus,
          action: () => {
            onNavigateTab('hse');
            onOpenAddBrief?.();
          },
          color: 'bg-teal-600 hover:bg-teal-700 text-white'
        },
        {
          id: 'qa-toolbox-list',
          label: 'Toolbox Log',
          icon: HardHat,
          action: () => onNavigateTab('hse'),
          color: 'bg-slate-800 hover:bg-slate-900 text-white'
        },
        {
          id: 'qa-induction',
          label: 'Site Induction',
          icon: Users,
          action: () => onNavigateTab('hse'),
          color: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
        },
        {
          id: 'qa-worker-certs',
          label: 'Worker Certs',
          icon: FileText,
          action: () => onNavigatePortal?.('resource-management', 'certifications'),
          color: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
        }
      ]
    },
    {
      portalId: 'incident-capa-actions',
      portalName: '5. Incidents & CAPA',
      portalIcon: AlertTriangle,
      actions: [
        {
          id: 'qa-log-incident',
          label: 'Log Incident',
          icon: AlertTriangle,
          action: () => {
            onNavigateTab('incidents');
            onOpenAddIncident?.();
          },
          color: 'bg-rose-600 hover:bg-rose-700 text-white'
        },
        {
          id: 'qa-incidents-view',
          label: 'Incident Log',
          icon: FileText,
          action: () => onNavigateTab('incidents'),
          color: 'bg-slate-800 hover:bg-slate-900 text-white'
        },
        {
          id: 'qa-5why-capa',
          label: '5-Why CAPA',
          icon: CheckCircle2,
          action: () => onNavigateTab('incidents'),
          color: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
        },
        {
          id: 'qa-export-pdf',
          label: 'Export PDF',
          icon: Download,
          action: onExportPDF,
          color: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
        }
      ]
    },
    {
      portalId: 'emergency-links-actions',
      portalName: '6. Emergency & Links',
      portalIcon: Phone,
      actions: [
        {
          id: 'qa-hotline',
          label: '24/7 Contacts',
          icon: Phone,
          action: () => onNavigateTab('contacts'),
          color: 'bg-purple-600 hover:bg-purple-700 text-white'
        },
        {
          id: 'qa-evac-drills',
          label: 'Evac Drills',
          icon: HeartPulse,
          action: () => onNavigateTab('contacts'),
          color: 'bg-slate-800 hover:bg-slate-900 text-white'
        },
        {
          id: 'qa-link-eq',
          label: 'Machine Safety',
          icon: Wrench,
          action: () => onNavigatePortal?.('equipment-management', 'inspections'),
          color: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
        },
        {
          id: 'qa-link-ppe-po',
          label: 'Buy PPE (PO)',
          icon: Truck,
          action: () => onNavigatePortal?.('procurement', 'pr'),
          color: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
        }
      ]
    }
  ];

  // 4-Column Universal Portal Directory with simple words
  const primaryPortals: CommandPrimaryPortal[] = [
    {
      id: 'port-safety-permits',
      name: 'Work Permits (PTW) & Lockout',
      shortLabel: '1. Work Permits',
      icon: FileCheck,
      badge: `${activePermitsCount} Active`,
      targetTab: 'permits',
      onLaunch: () => onNavigateTab('permits'),
      subPortals: [
        {
          id: 'sub-ptw-active',
          name: 'High-Risk Work Clearances',
          icon: FileCheck,
          badge: 'PTW',
          onLaunch: () => onNavigateTab('permits'),
          subSubPortals: [
            {
              id: 'ssp-ptw-types',
              name: 'Heights, Hot Work, Lifting & LOTO',
              badge: 'Clearance',
              icon: Flame,
              actions: [
                { id: 'act-ptw-view-all', name: 'Open Active Work Permits List', badge: 'List', action: () => onNavigateTab('permits') },
                { id: 'act-ptw-issue-new', name: 'Issue New Work Permit (PTW)', badge: 'Issue', action: () => { onNavigateTab('permits'); onOpenAddPermit?.(); } },
                { id: 'act-ptw-export-csv', name: 'Export Work Permits CSV', badge: 'CSV', action: onExportCSV }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'port-safety-risks',
      name: 'Risk Assessment & JSA Register',
      shortLabel: '2. Risk & JSA',
      icon: Scale,
      badge: `${approvedRisksCount} Approved`,
      targetTab: 'risks',
      onLaunch: () => onNavigateTab('risks'),
      subPortals: [
        {
          id: 'sub-risk-hira',
          name: 'Job Safety Analysis (JSA / HIRA)',
          icon: Scale,
          badge: 'Matrix',
          onLaunch: () => onNavigateTab('risks'),
          subSubPortals: [
            {
              id: 'ssp-risk-controls',
              name: 'Hazard Rating & Control Measures',
              badge: 'Controls',
              icon: ShieldAlert,
              actions: [
                { id: 'act-risk-open', name: 'Open JSA & Risk Register', badge: 'JSA', action: () => onNavigateTab('risks') },
                { id: 'act-risk-new', name: 'Create Task Risk Assessment', badge: 'New', action: () => { onNavigateTab('risks'); onOpenAddRisk?.(); } }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'port-safety-inspections',
      name: 'Site Inspections, Scaffolds & PPE',
      shortLabel: '3. Tags & PPE',
      icon: ClipboardCheck,
      badge: lowPpeCount > 0 ? `${lowPpeCount} Low PPE` : `${safeTagsCount} Safe`,
      targetTab: 'inspections',
      onLaunch: () => onNavigateTab('inspections'),
      subPortals: [
        {
          id: 'sub-insp-tags',
          name: 'Scaffold Tags, Fire Gear & PPE Stock',
          icon: ClipboardCheck,
          badge: 'Tags',
          onLaunch: () => onNavigateTab('inspections'),
          subSubPortals: [
            {
              id: 'ssp-insp-ppe',
              name: 'Green/Red Tags & Worker PPE Issue',
              badge: 'PPE',
              icon: Package,
              actions: [
                { id: 'act-insp-open', name: 'View Scaffold, Fire & Lifting Tags', badge: 'Tags', action: () => onNavigateTab('inspections') },
                { id: 'act-insp-new', name: 'Record Site Safety Tag Inspection', badge: 'Check', action: () => { onNavigateTab('inspections'); onOpenAddInspection?.(); } },
                { id: 'act-ppe-manage', name: 'Issue Worker PPE & Check Minimum Stock', badge: 'PPE', action: () => onNavigateTab('inspections') }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'port-safety-hse',
      name: 'Toolbox Talks & Site Inductions',
      shortLabel: '4. Toolbox & Induction',
      icon: HardHat,
      badge: 'Daily',
      targetTab: 'hse',
      onLaunch: () => onNavigateTab('hse'),
      subPortals: [
        {
          id: 'sub-hse-briefs',
          name: 'Morning Briefings & Worker Induction',
          icon: HardHat,
          badge: 'Briefs',
          onLaunch: () => onNavigateTab('hse'),
          subSubPortals: [
            {
              id: 'ssp-hse-briefings',
              name: 'Daily Shift Talk & Attendance Log',
              badge: 'Log',
              icon: HardHat,
              actions: [
                { id: 'act-hse-toolbox-log', name: 'Open Toolbox Talk & Induction List', badge: 'List', action: () => onNavigateTab('hse') },
                { id: 'act-hse-new-brief', name: 'Schedule / Record Toolbox Briefing', badge: 'Add', action: () => { onNavigateTab('hse'); onOpenAddBrief?.(); } }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'port-safety-incidents',
      name: 'Incident Log, Near-Miss & CAPA',
      shortLabel: '5. Incidents & CAPA',
      icon: AlertTriangle,
      badge: `${openIncidentsCount} Open`,
      targetTab: 'incidents',
      onLaunch: () => onNavigateTab('incidents'),
      subPortals: [
        {
          id: 'sub-inc-investigations',
          name: 'Near Misses, First-Aid & 5-Why CAPA',
          icon: AlertTriangle,
          badge: 'CAPA',
          onLaunch: () => onNavigateTab('incidents'),
          subSubPortals: [
            {
              id: 'ssp-inc-reports',
              name: 'Incident Investigation & Closure',
              badge: 'Reports',
              icon: AlertTriangle,
              actions: [
                { id: 'act-inc-view-all', name: 'Open HSE Incident & CAPA Register', badge: 'Log', action: () => onNavigateTab('incidents') },
                { id: 'act-inc-report-new', name: 'Report New Incident or Near-Miss', badge: 'Report', action: () => { onNavigateTab('incidents'); onOpenAddIncident?.(); } },
                { id: 'act-inc-pdf', name: 'Export HSE Compliance PDF Report', badge: 'PDF', action: onExportPDF }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'port-safety-emergency',
      name: 'Emergency Contacts & Evac Drills',
      shortLabel: '6. Emergency & Drills',
      icon: Phone,
      badge: '24/7',
      targetTab: 'contacts',
      onLaunch: () => onNavigateTab('contacts'),
      subPortals: [
        {
          id: 'sub-em-hotline',
          name: '24/7 Hotlines & Muster Drills',
          icon: Phone,
          badge: 'Hotline',
          onLaunch: () => onNavigateTab('contacts'),
          subSubPortals: [
            {
              id: 'ssp-em-numbers',
              name: 'Medic, Fire & Evacuation Drills',
              badge: 'Drills',
              icon: HeartPulse,
              actions: [
                { id: 'act-em-directory', name: 'Open Emergency Contact List', badge: 'Contacts', action: () => onNavigateTab('contacts') },
                { id: 'act-em-drills', name: 'View & Log Site Evacuation Drills', badge: 'Drills', action: () => onNavigateTab('contacts') }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'port-safety-linked',
      name: 'Connected Portals (One-Click Links)',
      shortLabel: '7. Linked Portals',
      icon: Layers,
      badge: '6 Links',
      onLaunch: () => onNavigatePortal?.('projects'),
      subPortals: [
        {
          id: 'sub-safety-links',
          name: 'Direct Links to Projects, HR, Fleet & PO',
          icon: Layers,
          badge: 'Integrated',
          subSubPortals: [
            {
              id: 'ssp-safety-links-all',
              name: 'Cross-Portal Safety Workflows',
              badge: 'Links',
              icon: Building2,
              actions: [
                { id: 'act-s-lnk-projects', name: 'Open Projects & Site Risk Register', badge: 'Projects', action: () => onNavigatePortal?.('projects') },
                { id: 'act-s-lnk-workforce', name: 'Open Workforce Safety Certifications', badge: 'Workforce', action: () => onNavigatePortal?.('resource-management', 'certifications') },
                { id: 'act-s-lnk-equipment', name: 'Open Equipment Pre-Start & Calibration', badge: 'Equipment', action: () => onNavigatePortal?.('equipment-management', 'inspections') },
                { id: 'act-s-lnk-procure', name: 'Order PPE & Safety Gear in Procurement', badge: 'Procurement', action: () => onNavigatePortal?.('procurement', 'pr') },
                { id: 'act-s-lnk-quality', name: 'Open Quality Assurance & NCR Portal', badge: 'Quality', action: () => onNavigatePortal?.('quality-control', 'ncrs') },
                { id: 'act-s-lnk-shop', name: 'Open Shop Floor & Plant Safety', badge: 'Plant', action: () => onNavigatePortal?.('operational-control', 'shop_floor') }
              ]
            }
          ]
        }
      ]
    }
  ];

  return (
    <PortalCommandCenterLanding
      portalTitle="Safety & HSE Command Hub"
      badgeLabel="Zero Harm Hub"
      statusBadge="HSE Active"
      quickActionGroups={quickActionGroups}
      primaryPortals={primaryPortals}
      onLaunchPortal={(p) => {
        if (p.targetTab) onNavigateTab(p.targetTab as SafetyTab);
      }}
      searchPlaceholder="Search permits, JSA risks, scaffold tags, PPE, toolbox talks, incidents..."
    />
  );
};
