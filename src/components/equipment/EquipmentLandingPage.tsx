import React from 'react';
import {
  Wrench,
  Settings,
  ShieldAlert,
  Activity,
  CheckCircle2,
  Plus,
  Calendar,
  Clock,
  MapPin,
  AlertTriangle,
  Truck,
  QrCode,
  Fuel,
  Gauge,
  FileCheck,
  Package,
  DollarSign,
  ArrowLeftRight,
  Users,
  Building2,
  Layers,
  History,
  FileText
} from 'lucide-react';
import {
  PortalCommandCenterLanding,
  QuickActionGroup,
  CommandPrimaryPortal
} from '../common/PortalCommandCenterLanding';
import { Equipment, Project } from '../../types';
import { EquipmentMasterAsset } from '../../services/equipmentControlService';

export type EquipmentTab =
  | 'landing'
  | 'inventory'
  | 'allocation'
  | 'operations'
  | 'inspections'
  | 'maintenance'
  | 'parts_cost';

interface EquipmentLandingPageProps {
  equipment: Equipment[];
  masterAssets?: EquipmentMasterAsset[];
  projects?: Project[];
  onNavigateTab: (tab: EquipmentTab) => void;
  onOpenAddEquipment?: () => void;
  onOpenMachinePassport?: (equipmentId: string) => void;
  onNavigatePortal?: (portalView: string, subTab?: string) => void;
  onExportCSV: () => void;
  onExportPDF: () => void;
}

export const EquipmentLandingPage: React.FC<EquipmentLandingPageProps> = ({
  equipment,
  masterAssets = [],
  onNavigateTab,
  onOpenAddEquipment,
  onOpenMachinePassport,
  onNavigatePortal,
  onExportCSV,
  onExportPDF
}) => {
  const totalCount = masterAssets.length || equipment.length;
  const activeCount = masterAssets.filter(
    a => a.lifecycleState === 'Operating' || a.lifecycleState === 'Available' || a.lifecycleState === 'Allocated'
  ).length;
  const maintCount = masterAssets.filter(
    a => a.lifecycleState === 'Maintenance' || a.lifecycleState === 'Breakdown' || a.lifecycleState === 'Repair'
  ).length;

  // 6-Card 3x2 Quick Actions Grid with simple words & minimal UI
  const quickActionGroups: QuickActionGroup[] = [
    {
      portalId: 'registry-qr',
      portalName: '1. Asset Registry & QR Passport',
      portalIcon: Wrench,
      actions: [
        {
          id: 'qa-add-machine',
          label: 'Add Machine',
          icon: Plus,
          action: () => {
            onNavigateTab('inventory');
            onOpenAddEquipment?.();
          },
          color: 'bg-orange-600 hover:bg-orange-700 text-white'
        },
        {
          id: 'qa-master-list',
          label: 'Master List',
          icon: Wrench,
          action: () => onNavigateTab('inventory'),
          color: 'bg-slate-800 hover:bg-slate-900 text-white'
        },
        {
          id: 'qa-qr-passport',
          label: 'QR & Timeline',
          icon: QrCode,
          action: () => {
            onNavigateTab('inventory');
            if (masterAssets[0]) onOpenMachinePassport?.(masterAssets[0].equipmentId);
          },
          color: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
        },
        {
          id: 'qa-lifecycle',
          label: 'Lifecycle State',
          icon: History,
          action: () => onNavigateTab('inventory'),
          color: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
        }
      ]
    },
    {
      portalId: 'allocation-handover',
      portalName: '2. Allocation, Site & Handover',
      portalIcon: Truck,
      actions: [
        {
          id: 'qa-allocate-site',
          label: 'Allocate to Site',
          icon: MapPin,
          action: () => onNavigateTab('allocation'),
          color: 'bg-blue-600 hover:bg-blue-700 text-white'
        },
        {
          id: 'qa-handover-cert',
          label: 'Handover Cert',
          icon: FileCheck,
          action: () => onNavigateTab('allocation'),
          color: 'bg-slate-800 hover:bg-slate-900 text-white'
        },
        {
          id: 'qa-mobilize-transfer',
          label: 'Move / Transfer',
          icon: ArrowLeftRight,
          action: () => onNavigateTab('allocation'),
          color: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
        },
        {
          id: 'qa-operator-lock',
          label: 'Operator Check',
          icon: Users,
          action: () => onNavigateTab('allocation'),
          color: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
        }
      ]
    },
    {
      portalId: 'meter-fuel',
      portalName: '3. Daily Log, Meter & Fuel',
      portalIcon: Gauge,
      actions: [
        {
          id: 'qa-log-meter',
          label: 'Log Hours',
          icon: Gauge,
          action: () => onNavigateTab('operations'),
          color: 'bg-emerald-600 hover:bg-emerald-700 text-white'
        },
        {
          id: 'qa-issue-fuel',
          label: 'Fuel & Lube',
          icon: Fuel,
          action: () => onNavigateTab('operations'),
          color: 'bg-slate-800 hover:bg-slate-900 text-white'
        },
        {
          id: 'qa-fuel-rate',
          label: 'Litres / Hour',
          icon: Activity,
          action: () => onNavigateTab('operations'),
          color: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
        },
        {
          id: 'qa-idle-alert',
          label: 'Fuel Alerts',
          icon: AlertTriangle,
          action: () => onNavigateTab('operations'),
          color: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
        }
      ]
    },
    {
      portalId: 'inspections-compliance',
      portalName: '4. Inspections & Compliance',
      portalIcon: CheckCircle2,
      actions: [
        {
          id: 'qa-daily-check',
          label: 'New Inspection',
          icon: CheckCircle2,
          action: () => onNavigateTab('inspections'),
          color: 'bg-teal-600 hover:bg-teal-700 text-white'
        },
        {
          id: 'qa-calib-lock',
          label: 'Calibration Lock',
          icon: ShieldAlert,
          action: () => onNavigateTab('inspections'),
          color: 'bg-slate-800 hover:bg-slate-900 text-white'
        },
        {
          id: 'qa-docs-ins',
          label: 'Insurance & Docs',
          icon: FileText,
          action: () => onNavigateTab('inspections'),
          color: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
        },
        {
          id: 'qa-warranty',
          label: 'Warranty Track',
          icon: Calendar,
          action: () => onNavigateTab('inspections'),
          color: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
        }
      ]
    },
    {
      portalId: 'maintenance-breakdown',
      portalName: '5. Maintenance & Breakdowns',
      portalIcon: Settings,
      actions: [
        {
          id: 'qa-work-order',
          label: 'Work Orders',
          icon: Settings,
          action: () => onNavigateTab('maintenance'),
          color: 'bg-indigo-600 hover:bg-indigo-700 text-white'
        },
        {
          id: 'qa-breakdown',
          label: 'Report Breakdown',
          icon: AlertTriangle,
          action: () => onNavigateTab('maintenance'),
          color: 'bg-rose-600 hover:bg-rose-700 text-white'
        },
        {
          id: 'qa-service-plan',
          label: '250h Service Plan',
          icon: Clock,
          action: () => onNavigateTab('maintenance'),
          color: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
        },
        {
          id: 'qa-workshop-bay',
          label: 'Workshop Bays',
          icon: Wrench,
          action: () => onNavigateTab('maintenance'),
          color: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
        }
      ]
    },
    {
      portalId: 'parts-cost-links',
      portalName: '6. Parts, Cost & Linked Portals',
      portalIcon: DollarSign,
      actions: [
        {
          id: 'qa-parts-tires',
          label: 'Parts & Tires',
          icon: Package,
          action: () => onNavigateTab('parts_cost'),
          color: 'bg-purple-600 hover:bg-purple-700 text-white'
        },
        {
          id: 'qa-cost-tco',
          label: 'Cost & TCO',
          icon: DollarSign,
          action: () => onNavigateTab('parts_cost'),
          color: 'bg-slate-800 hover:bg-slate-900 text-white'
        },
        {
          id: 'qa-link-procure',
          label: 'Buy Spares (PO)',
          icon: Truck,
          action: () => onNavigatePortal?.('procurement', 'pr'),
          color: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
        },
        {
          id: 'qa-link-workforce',
          label: 'Operators (HR)',
          icon: Users,
          action: () => onNavigatePortal?.('resource-management', 'certifications'),
          color: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
        }
      ]
    }
  ];

  // 4-Column Universal Portal Directory with simple words
  const primaryPortals: CommandPrimaryPortal[] = [
    {
      id: 'port-eq-registry',
      name: 'Equipment Master Registry & Lifecycle',
      shortLabel: '1. Master Registry',
      icon: Wrench,
      badge: `${totalCount} Units`,
      targetTab: 'inventory',
      onLaunch: () => onNavigateTab('inventory'),
      subPortals: [
        {
          id: 'sub-eq-master',
          name: 'Machine Master & 22 Categories',
          icon: Wrench,
          badge: `${activeCount} Active`,
          onLaunch: () => onNavigateTab('inventory'),
          subSubPortals: [
            {
              id: 'ssp-eq-id',
              name: 'Asset Identity, Specs & Attachments',
              icon: Wrench,
              actions: [
                { id: 'act-eq-open-list', name: 'Open Master Equipment List', badge: 'List', action: () => onNavigateTab('inventory') },
                { id: 'act-eq-add-new', name: 'Add New Machine or Tool', badge: 'Create', action: () => { onNavigateTab('inventory'); onOpenAddEquipment?.(); } },
                { id: 'act-eq-export-csv', name: 'Export Asset Register CSV', badge: 'CSV', action: onExportCSV }
              ]
            },
            {
              id: 'ssp-eq-qr-timeline',
              name: 'QR Code & Complete Machine History',
              icon: QrCode,
              actions: [
                {
                  id: 'act-eq-open-passport',
                  name: 'Open 360° Machine Passport & Timeline',
                  badge: '360°',
                  action: () => {
                    onNavigateTab('inventory');
                    if (masterAssets[0]) onOpenMachinePassport?.(masterAssets[0].equipmentId);
                  }
                },
                { id: 'act-eq-lifecycle-state', name: 'Update Machine Lifecycle State', badge: 'State', action: () => onNavigateTab('inventory') }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'port-eq-allocation',
      name: 'Allocation, Mobilization & Handover',
      shortLabel: '2. Site Allocation',
      icon: Truck,
      badge: 'Sites',
      targetTab: 'allocation',
      onLaunch: () => onNavigateTab('allocation'),
      subPortals: [
        {
          id: 'sub-eq-site-alloc',
          name: 'Site Allocation & Operator Check',
          icon: MapPin,
          badge: 'Dispatch',
          onLaunch: () => onNavigateTab('allocation'),
          subSubPortals: [
            {
              id: 'ssp-eq-assign',
              name: 'Project Assignment & Operator Lock',
              icon: Users,
              actions: [
                { id: 'act-eq-alloc-open', name: 'Allocate Machine to Project Site', badge: 'Assign', action: () => onNavigateTab('allocation') },
                { id: 'act-eq-op-auth', name: 'Verify Operator License & Block Expired', badge: 'Safety Lock', action: () => onNavigateTab('allocation') }
              ]
            },
            {
              id: 'ssp-eq-handover',
              name: 'Mobilization, Transfer & Handover Cert',
              icon: FileCheck,
              actions: [
                { id: 'act-eq-handover-cert', name: 'Issue Machine Handover Certificate', badge: 'Cert', action: () => onNavigateTab('allocation') },
                { id: 'act-eq-transfer', name: 'Record Site-to-Site / Yard Transfer', badge: 'Transfer', action: () => onNavigateTab('allocation') }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'port-eq-operations',
      name: 'Daily Logbook, Hour Meter & Fuel',
      shortLabel: '3. Meter & Fuel',
      icon: Gauge,
      badge: 'Daily',
      targetTab: 'operations',
      onLaunch: () => onNavigateTab('operations'),
      subPortals: [
        {
          id: 'sub-eq-meter-fuel',
          name: 'Hour Meter & Fuel Consumption',
          icon: Fuel,
          badge: 'L/hr',
          onLaunch: () => onNavigateTab('operations'),
          subSubPortals: [
            {
              id: 'ssp-eq-daily-log',
              name: 'Opening/Closing Meter & Idle Hours',
              icon: Gauge,
              actions: [
                { id: 'act-eq-log-hours', name: 'Record Daily Meter & Operating Hours', badge: 'Meter', action: () => onNavigateTab('operations') },
                { id: 'act-eq-log-fuel', name: 'Record Fuel & Lubricant Issue', badge: 'Fuel', action: () => onNavigateTab('operations') },
                { id: 'act-eq-fuel-alert', name: 'Check Abnormal Fuel Variance Alerts', badge: 'Alert', action: () => onNavigateTab('operations') }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'port-eq-inspections',
      name: 'Inspections, Calibration & Compliance',
      shortLabel: '4. Inspections & Docs',
      icon: CheckCircle2,
      badge: 'Safety',
      targetTab: 'inspections',
      onLaunch: () => onNavigateTab('inspections'),
      subPortals: [
        {
          id: 'sub-eq-checklists',
          name: 'Pre-Start, Safety & Calibration Control',
          icon: CheckCircle2,
          badge: 'Checks',
          onLaunch: () => onNavigateTab('inspections'),
          subSubPortals: [
            {
              id: 'ssp-eq-insp-list',
              name: 'Inspection Checklists & Calibration Lock',
              icon: ShieldAlert,
              actions: [
                { id: 'act-eq-new-insp', name: 'Run Daily / Pre-Mobilization Inspection', badge: 'Check', action: () => onNavigateTab('inspections') },
                { id: 'act-eq-cal-status', name: 'Check Expired Calibration Usage Lock', badge: 'Lock', action: () => onNavigateTab('inspections') },
                { id: 'act-eq-docs-vault', name: 'Track Insurance, Lifting Certs & Warranty', badge: 'Docs', action: () => onNavigateTab('inspections') }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'port-eq-maintenance',
      name: 'Preventive Maintenance, Breakdowns & Workshop',
      shortLabel: '5. Maintenance & WO',
      icon: Settings,
      badge: `${maintCount} Active`,
      targetTab: 'maintenance',
      onLaunch: () => onNavigateTab('maintenance'),
      subPortals: [
        {
          id: 'sub-eq-pm-wo',
          name: '250h Service Plan, Breakdowns & Work Orders',
          icon: Settings,
          badge: 'Workshop',
          onLaunch: () => onNavigateTab('maintenance'),
          subSubPortals: [
            {
              id: 'ssp-eq-pm-calc',
              name: 'Automatic Remaining Hours & Work Orders',
              icon: Wrench,
              actions: [
                { id: 'act-eq-pm-view', name: 'View 250h Service Countdown & Due List', badge: 'Plan', action: () => onNavigateTab('maintenance') },
                { id: 'act-eq-new-wo', name: 'Create Preventive / Breakdown Work Order', badge: 'WO', action: () => onNavigateTab('maintenance') },
                { id: 'act-eq-pdf-report', name: 'Export Fleet & Service PDF Report', badge: 'PDF', action: onExportPDF }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'port-eq-parts-cost',
      name: 'Spare Parts, Tires, Project Cost & TCO',
      shortLabel: '6. Parts, Cost & KPIs',
      icon: DollarSign,
      badge: 'LKR',
      targetTab: 'parts_cost',
      onLaunch: () => onNavigateTab('parts_cost'),
      subPortals: [
        {
          id: 'sub-eq-spares-tco',
          name: 'Parts Inventory, Project Cost & Fleet KPIs',
          icon: Package,
          badge: 'TCO',
          onLaunch: () => onNavigateTab('parts_cost'),
          subSubPortals: [
            {
              id: 'ssp-eq-parts-stock',
              name: 'Spare Parts, Tires, Batteries & Cost/Hr',
              icon: DollarSign,
              actions: [
                { id: 'act-eq-parts-open', name: 'Manage Spare Parts, Tires & Batteries', badge: 'Stock', action: () => onNavigateTab('parts_cost') },
                { id: 'act-eq-tco-open', name: 'View Machine TCO, Cost/Hr & Project Charge', badge: 'Cost', action: () => onNavigateTab('parts_cost') },
                { id: 'act-eq-kpi-open', name: 'View Utilization %, MTBF, MTTR & Disposal', badge: 'KPIs', action: () => onNavigateTab('parts_cost') }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'port-eq-linked-portals',
      name: 'Connected Company Portals (One-Click Links)',
      shortLabel: '7. Linked Portals',
      icon: Layers,
      badge: '6 Links',
      onLaunch: () => onNavigatePortal?.('projects'),
      subPortals: [
        {
          id: 'sub-eq-cross-links',
          name: 'Direct Links to Projects, HR, Procurement & Finance',
          icon: Layers,
          badge: 'Integrated',
          subSubPortals: [
            {
              id: 'ssp-eq-links-all',
              name: 'Cross-Portal Workflows',
              icon: Building2,
              actions: [
                { id: 'act-lnk-projects', name: 'Open Projects & Site Directory', badge: 'Projects', action: () => onNavigatePortal?.('projects') },
                { id: 'act-lnk-workforce', name: 'Open Workforce & Operator Certifications', badge: 'Workforce', action: () => onNavigatePortal?.('resource-management', 'certifications') },
                { id: 'act-lnk-procurement', name: 'Open Procurement (Buy Spare Parts / RFQ)', badge: 'Procurement', action: () => onNavigatePortal?.('procurement', 'pr') },
                { id: 'act-lnk-finance', name: 'Open Project Cost Post-Evaluation', badge: 'Finance', action: () => onNavigatePortal?.('post-evaluation') },
                { id: 'act-lnk-safety', name: 'Open Site Safety & Incident Portal', badge: 'Safety', action: () => onNavigatePortal?.('site-management', 'incidents') },
                { id: 'act-lnk-plant', name: 'Open Plant Work Centers & Shop Floor', badge: 'Plant', action: () => onNavigatePortal?.('operational-control', 'resource') }
              ]
            }
          ]
        }
      ]
    }
  ];

  return (
    <PortalCommandCenterLanding
      portalTitle="Equipment & Machinery Command Hub"
      badgeLabel="Asset Lifecycle Hub"
      statusBadge="Fleet Active"
      quickActionGroups={quickActionGroups}
      primaryPortals={primaryPortals}
      onLaunchPortal={(p) => {
        if (p.targetTab) onNavigateTab(p.targetTab as EquipmentTab);
      }}
      searchPlaceholder="Search machines, site allocation, meter logs, parts, cost..."
    />
  );
};
