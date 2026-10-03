import React from 'react';
import {
  ShieldCheck,
  ClipboardCheck,
  AlertTriangle,
  Plus,
  Download,
  CheckCircle2,
  Medal,
  Activity,
  Layers,
  FileText,
  Target,
  Scale,
  PackageCheck,
  FlaskConical,
  Gauge,
  Truck,
  Wrench,
  Building2,
  FolderCheck
} from 'lucide-react';
import {
  PortalCommandCenterLanding,
  QuickActionGroup,
  CommandPrimaryPortal
} from '../common/PortalCommandCenterLanding';
import { NonConformanceReport, InspectionResult, Project, Quote } from '../../types';
import {
  IqcMaterialRecord,
  QualityLabTestRecord,
  GaugeCalibrationRecord,
  QaHandoverDossierRecord
} from '../../services/qualityControlService';

export type QualityTab =
  | 'landing'
  | 'inspections'
  | 'iqc'
  | 'testing'
  | 'ncrs'
  | 'calibration'
  | 'standards';

interface QualityLandingPageProps {
  inspectionResults: InspectionResult[];
  ncrs: NonConformanceReport[];
  iqcRecords?: IqcMaterialRecord[];
  labTests?: QualityLabTestRecord[];
  gaugeRecords?: GaugeCalibrationRecord[];
  dossierRecords?: QaHandoverDossierRecord[];
  projects?: Project[];
  quotes?: Quote[];
  onNavigateTab: (tab: QualityTab) => void;
  onOpenAddInspection?: () => void;
  onOpenAddIqc?: () => void;
  onOpenAddTest?: () => void;
  onOpenAddNcr?: () => void;
  onOpenAddGauge?: () => void;
  onOpenAddStandard?: () => void;
  onNavigatePortal?: (portalView: string, subTab?: string) => void;
  onExportCSV: () => void;
  onExportPDF: () => void;
}

export const QualityLandingPage: React.FC<QualityLandingPageProps> = ({
  inspectionResults,
  ncrs,
  iqcRecords = [],
  labTests = [],
  gaugeRecords = [],
  dossierRecords = [],
  onNavigateTab,
  onOpenAddInspection,
  onOpenAddIqc,
  onOpenAddTest,
  onOpenAddNcr,
  onOpenAddGauge,
  onOpenAddStandard,
  onNavigatePortal,
  onExportCSV,
  onExportPDF
}) => {
  const passedInspectionsCount = inspectionResults.filter(
    i => i.overallStatus === 'Passed' || (i as any).status === 'Pass'
  ).length;
  const openNcrsCount = ncrs.filter(
    n => n.status !== 'Closed' && n.status !== 'Resolved'
  ).length;
  const acceptedIqcCount = iqcRecords.filter(r => r.status === 'Accepted').length;
  const passedTestsCount = labTests.filter(t => t.result === 'Pass').length;
  const dueSoonGaugesCount = gaugeRecords.filter(g => g.status !== 'Calibrated').length;
  const signedDossiersCount = dossierRecords.filter(d => d.status === 'Signed Off').length;

  // 6-Card (3x2) Quick Actions Grid with simple words & minimal UI
  const quickActionGroups: QuickActionGroup[] = [
    {
      portalId: 'itp-inspection-actions',
      portalName: '1. QC Inspections (ITP)',
      portalIcon: ClipboardCheck,
      actions: [
        {
          id: 'qa-new-inspection',
          label: 'Log Inspection',
          icon: Plus,
          action: () => {
            onNavigateTab('inspections');
            onOpenAddInspection?.();
          },
          color: 'bg-orange-600 hover:bg-orange-700 text-white'
        },
        {
          id: 'qa-itp-list',
          label: 'ITP Register',
          icon: ClipboardCheck,
          action: () => onNavigateTab('inspections'),
          color: 'bg-slate-800 hover:bg-slate-900 text-white'
        },
        {
          id: 'qa-hold-points',
          label: 'Hold Points',
          icon: CheckCircle2,
          action: () => onNavigateTab('inspections'),
          color: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
        },
        {
          id: 'qa-site-qc',
          label: 'Site Glazing QC',
          icon: ShieldCheck,
          action: () => onNavigateTab('inspections'),
          color: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
        }
      ]
    },
    {
      portalId: 'iqc-material-actions',
      portalName: '2. Incoming QC (IQC)',
      portalIcon: PackageCheck,
      actions: [
        {
          id: 'qa-new-iqc',
          label: 'Log Batch IQC',
          icon: Plus,
          action: () => {
            onNavigateTab('iqc');
            onOpenAddIqc?.();
          },
          color: 'bg-blue-600 hover:bg-blue-700 text-white'
        },
        {
          id: 'qa-iqc-list',
          label: 'Material IQC',
          icon: PackageCheck,
          action: () => onNavigateTab('iqc'),
          color: 'bg-slate-800 hover:bg-slate-900 text-white'
        },
        {
          id: 'qa-mtc-verify',
          label: 'Verify MTC',
          icon: FileText,
          action: () => onNavigateTab('iqc'),
          color: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
        },
        {
          id: 'qa-link-grn',
          label: 'Link GRN (PO)',
          icon: Truck,
          action: () => onNavigatePortal?.('procurement', 'grn'),
          color: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
        }
      ]
    },
    {
      portalId: 'lab-site-tests-actions',
      portalName: '3. Lab & Water Tests',
      portalIcon: FlaskConical,
      actions: [
        {
          id: 'qa-new-test',
          label: 'Log Test Result',
          icon: Plus,
          action: () => {
            onNavigateTab('testing');
            onOpenAddTest?.();
          },
          color: 'bg-emerald-600 hover:bg-emerald-700 text-white'
        },
        {
          id: 'qa-coating-dft',
          label: 'Coating DFT',
          icon: Scale,
          action: () => onNavigateTab('testing'),
          color: 'bg-slate-800 hover:bg-slate-900 text-white'
        },
        {
          id: 'qa-water-hose',
          label: 'Water Hose Test',
          icon: Activity,
          action: () => onNavigateTab('testing'),
          color: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
        },
        {
          id: 'qa-silicone-peel',
          label: 'Silicone Peel',
          icon: Target,
          action: () => onNavigateTab('testing'),
          color: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
        }
      ]
    },
    {
      portalId: 'ncr-quarantine-actions',
      portalName: '4. NCR & Quarantine',
      portalIcon: AlertTriangle,
      actions: [
        {
          id: 'qa-raise-ncr',
          label: 'Raise NCR',
          icon: AlertTriangle,
          action: () => {
            onNavigateTab('ncrs');
            onOpenAddNcr?.();
          },
          color: 'bg-rose-600 hover:bg-rose-700 text-white'
        },
        {
          id: 'qa-ncr-list',
          label: 'NCR Register',
          icon: FileText,
          action: () => onNavigateTab('ncrs'),
          color: 'bg-slate-800 hover:bg-slate-900 text-white'
        },
        {
          id: 'qa-capa-close',
          label: 'CAPA Actions',
          icon: CheckCircle2,
          action: () => onNavigateTab('ncrs'),
          color: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
        },
        {
          id: 'qa-vendor-debit',
          label: 'Vendor Debit',
          icon: Truck,
          action: () => onNavigatePortal?.('procurement', 'pr'),
          color: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
        }
      ]
    },
    {
      portalId: 'gauge-calibration-actions',
      portalName: '5. Gauge Calibration',
      portalIcon: Gauge,
      actions: [
        {
          id: 'qa-add-gauge',
          label: 'Add Instrument',
          icon: Plus,
          action: () => {
            onNavigateTab('calibration');
            onOpenAddGauge?.();
          },
          color: 'bg-teal-600 hover:bg-teal-700 text-white'
        },
        {
          id: 'qa-gauge-list',
          label: 'Gauge Register',
          icon: Gauge,
          action: () => onNavigateTab('calibration'),
          color: 'bg-slate-800 hover:bg-slate-900 text-white'
        },
        {
          id: 'qa-cal-certs',
          label: 'Calib Certs',
          icon: CheckCircle2,
          action: () => onNavigateTab('calibration'),
          color: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
        },
        {
          id: 'qa-eq-link',
          label: 'Machine Calib',
          icon: Wrench,
          action: () => onNavigatePortal?.('equipment-management', 'inspections'),
          color: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
        }
      ]
    },
    {
      portalId: 'standards-handover-actions',
      portalName: '6. Standards & Handover',
      portalIcon: Medal,
      actions: [
        {
          id: 'qa-add-standard',
          label: 'Add Standard',
          icon: Plus,
          action: () => {
            onNavigateTab('standards');
            onOpenAddStandard?.();
          },
          color: 'bg-purple-600 hover:bg-purple-700 text-white'
        },
        {
          id: 'qa-iso-codes',
          label: 'ISO / BS Codes',
          icon: Medal,
          action: () => onNavigateTab('standards'),
          color: 'bg-slate-800 hover:bg-slate-900 text-white'
        },
        {
          id: 'qa-handover-pack',
          label: 'QA Handover',
          icon: FolderCheck,
          action: () => onNavigateTab('standards'),
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
    }
  ];

  // 4-Column Universal Portal Directory with simple words
  const primaryPortals: CommandPrimaryPortal[] = [
    {
      id: 'port-qc-inspections',
      name: 'QC Inspections & Hold Points (ITP)',
      shortLabel: '1. QC Inspections',
      icon: ClipboardCheck,
      badge: `${passedInspectionsCount} Passed`,
      targetTab: 'inspections',
      onLaunch: () => onNavigateTab('inspections'),
      subPortals: [
        {
          id: 'sub-itp-checklists',
          name: 'Fabrication & Site Glazing Hold Points',
          icon: ClipboardCheck,
          badge: 'ITP',
          onLaunch: () => onNavigateTab('inspections'),
          subSubPortals: [
            {
              id: 'ssp-itp-items',
              name: 'In-Process, Final & Site Erection Checks',
              badge: 'Checks',
              icon: ClipboardCheck,
              actions: [
                { id: 'act-itp-view-all', name: 'Open QC Inspections & ITP List', badge: 'List', action: () => onNavigateTab('inspections') },
                { id: 'act-itp-log-new', name: 'Record New QC Stage Inspection', badge: 'Log', action: () => { onNavigateTab('inspections'); onOpenAddInspection?.(); } },
                { id: 'act-itp-export-csv', name: 'Export Inspections CSV', badge: 'CSV', action: onExportCSV }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'port-qc-iqc',
      name: 'Incoming Material QC (IQC) & MTCs',
      shortLabel: '2. Incoming QC (IQC)',
      icon: PackageCheck,
      badge: `${acceptedIqcCount} Accepted`,
      targetTab: 'iqc',
      onLaunch: () => onNavigateTab('iqc'),
      subPortals: [
        {
          id: 'sub-iqc-batches',
          name: 'Aluminium, Glass, Sealant & Hardware IQC',
          icon: PackageCheck,
          badge: 'MTC',
          onLaunch: () => onNavigateTab('iqc'),
          subSubPortals: [
            {
              id: 'ssp-iqc-certs',
              name: 'Mill Test Certificates & Batch Release',
              badge: 'Batch',
              icon: FileText,
              actions: [
                { id: 'act-iqc-open', name: 'Open Incoming Material IQC Register', badge: 'IQC', action: () => onNavigateTab('iqc') },
                { id: 'act-iqc-new', name: 'Log Incoming Batch & MTC Check', badge: 'New', action: () => { onNavigateTab('iqc'); onOpenAddIqc?.(); } }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'port-qc-testing',
      name: 'Lab & Site Performance Tests',
      shortLabel: '3. Lab & Water Tests',
      icon: FlaskConical,
      badge: `${passedTestsCount} Pass`,
      targetTab: 'testing',
      onLaunch: () => onNavigateTab('testing'),
      subPortals: [
        {
          id: 'sub-lab-tests',
          name: 'Coating DFT, Water Hose & Silicone Peel',
          icon: FlaskConical,
          badge: 'Tests',
          onLaunch: () => onNavigateTab('testing'),
          subSubPortals: [
            {
              id: 'ssp-lab-readings',
              name: 'Micron Readings, AAMA Water & Glass Tests',
              badge: 'Lab',
              icon: Activity,
              actions: [
                { id: 'act-tst-open', name: 'View Lab & Site Performance Test Log', badge: 'Tests', action: () => onNavigateTab('testing') },
                { id: 'act-tst-new', name: 'Record New DFT, Water or Peel Test', badge: 'Record', action: () => { onNavigateTab('testing'); onOpenAddTest?.(); } }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'port-qc-ncrs',
      name: 'NCR Register, Quarantine & CAPA',
      shortLabel: '4. NCR & Quarantine',
      icon: AlertTriangle,
      badge: `${openNcrsCount} Open`,
      targetTab: 'ncrs',
      onLaunch: () => onNavigateTab('ncrs'),
      subPortals: [
        {
          id: 'sub-ncr-active',
          name: 'Defect Quarantine, Root Cause & Rework',
          icon: AlertTriangle,
          badge: 'CAPA',
          onLaunch: () => onNavigateTab('ncrs'),
          subSubPortals: [
            {
              id: 'ssp-ncr-items',
              name: 'Non-Conformance Closure & Vendor Returns',
              badge: 'NCR',
              icon: AlertTriangle,
              actions: [
                { id: 'act-ncr-view-all', name: 'Open Non-Conformance (NCR) Register', badge: 'NCRs', action: () => onNavigateTab('ncrs') },
                { id: 'act-ncr-raise-new', name: 'Raise New Non-Conformance Report', badge: 'Raise', action: () => { onNavigateTab('ncrs'); onOpenAddNcr?.(); } }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'port-qc-calibration',
      name: 'Measuring Gauge & Tool Calibration',
      shortLabel: '5. Gauge Calibration',
      icon: Gauge,
      badge: dueSoonGaugesCount > 0 ? `${dueSoonGaugesCount} Due` : `${gaugeRecords.length} Valid`,
      targetTab: 'calibration',
      onLaunch: () => onNavigateTab('calibration'),
      subPortals: [
        {
          id: 'sub-cal-gauges',
          name: 'DFT Gauges, Calipers, Durometers & Manifolds',
          icon: Gauge,
          badge: 'ISO',
          onLaunch: () => onNavigateTab('calibration'),
          subSubPortals: [
            {
              id: 'ssp-cal-certs',
              name: 'SLSI Calibration Certificates & Due Dates',
              badge: 'Certs',
              icon: CheckCircle2,
              actions: [
                { id: 'act-cal-open', name: 'Open Measuring Instrument Register', badge: 'Gauges', action: () => onNavigateTab('calibration') },
                { id: 'act-cal-new', name: 'Register New Measuring Gauge / Tool', badge: 'Add', action: () => { onNavigateTab('calibration'); onOpenAddGauge?.(); } }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'port-qc-standards',
      name: 'Testing Standards & Client QA Handover',
      shortLabel: '6. Standards & Handover',
      icon: Medal,
      badge: `${signedDossiersCount} Signed`,
      targetTab: 'standards',
      onLaunch: () => onNavigateTab('standards'),
      subPortals: [
        {
          id: 'sub-std-codes',
          name: 'ISO / BS / ASTM Codes & Final QA Dossiers',
          icon: Medal,
          badge: 'Dossier',
          onLaunch: () => onNavigateTab('standards'),
          subSubPortals: [
            {
              id: 'ssp-std-library',
              name: 'Tolerances & Client Handover Sign-Off',
              badge: 'Handover',
              icon: FolderCheck,
              actions: [
                { id: 'act-std-view-all', name: 'Open Standards & Handover Dossiers', badge: 'Open', action: () => onNavigateTab('standards') },
                { id: 'act-std-add', name: 'Add Mandatory Testing Standard', badge: 'Add', action: () => { onNavigateTab('standards'); onOpenAddStandard?.(); } },
                { id: 'act-std-pdf', name: 'Export QA Compliance Report PDF', badge: 'PDF', action: onExportPDF }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'port-qc-linked',
      name: 'Connected Portals (One-Click Links)',
      shortLabel: '7. Linked Portals',
      icon: Layers,
      badge: '6 Links',
      onLaunch: () => onNavigatePortal?.('projects'),
      subPortals: [
        {
          id: 'sub-qc-links',
          name: 'Direct Links to Projects, PO, Shop & Warranty',
          icon: Layers,
          badge: 'Integrated',
          subSubPortals: [
            {
              id: 'ssp-qc-links-all',
              name: 'Cross-Portal Quality Workflows',
              badge: 'Links',
              icon: Building2,
              actions: [
                { id: 'act-q-lnk-projects', name: 'Open Projects & BOQ Specifications', badge: 'Projects', action: () => onNavigatePortal?.('projects') },
                { id: 'act-q-lnk-procure', name: 'Open Procurement GRN & Vendor Returns', badge: 'Procurement', action: () => onNavigatePortal?.('procurement', 'grn') },
                { id: 'act-q-lnk-shop', name: 'Open Shop Floor Fabrication QC', badge: 'Shop Floor', action: () => onNavigatePortal?.('operational-control', 'shop_floor') },
                { id: 'act-q-lnk-equipment', name: 'Open Equipment & Machine Calibration', badge: 'Equipment', action: () => onNavigatePortal?.('equipment-management', 'inspections') },
                { id: 'act-q-lnk-safety', name: 'Open Safety & HSE Portal', badge: 'Safety', action: () => onNavigatePortal?.('site-management', 'inspections') },
                { id: 'act-q-lnk-warranty', name: 'Open Warranty Certificates & Handover', badge: 'Warranty', action: () => onNavigatePortal?.('after-sales', 'certificates') }
              ]
            }
          ]
        }
      ]
    }
  ];

  return (
    <PortalCommandCenterLanding
      portalTitle="Quality Control & QA Command Hub"
      badgeLabel="ISO 9001:2015 Hub"
      statusBadge="QA Active"
      quickActionGroups={quickActionGroups}
      primaryPortals={primaryPortals}
      onLaunchPortal={(p) => {
        if (p.targetTab) onNavigateTab(p.targetTab as QualityTab);
      }}
      searchPlaceholder="Search ITP inspections, incoming MTC batches, DFT/water tests, NCRs, gauges, standards..."
    />
  );
};
