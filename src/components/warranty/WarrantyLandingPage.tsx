import React from 'react';
import {
  HeartHandshake,
  Medal,
  Clock,
  History,
  Plus,
  Download,
  CheckCircle2,
  LifeBuoy
} from 'lucide-react';
import {
  PortalCommandCenterLanding,
  QuickActionGroup,
  CommandPrimaryPortal
} from '../common/PortalCommandCenterLanding';
import { WarrantyCertificate, AfterSalesServiceRequest, Project } from '../../types';

export type WarrantyTab = 'landing' | 'certificates' | 'requests' | 'history';

interface WarrantyLandingPageProps {
  warrantyCertificates: WarrantyCertificate[];
  afterSalesRequests: AfterSalesServiceRequest[];
  projects?: Project[];
  onNavigateTab: (tab: WarrantyTab) => void;
  onOpenAddCertificate?: () => void;
  onOpenAddRequest?: () => void;
  onExportCSV: () => void;
  onExportPDF: () => void;
}

export const WarrantyLandingPage: React.FC<WarrantyLandingPageProps> = ({
  warrantyCertificates,
  afterSalesRequests,
  onNavigateTab,
  onOpenAddCertificate,
  onOpenAddRequest,
  onExportCSV,
  onExportPDF
}) => {
  const activeCertificates = warrantyCertificates.filter(c => c.status === 'Active').length;
  const pendingRequests = afterSalesRequests.filter(r => r.status === 'New' || r.status === 'Scheduled').length;

  const quickActionGroups: QuickActionGroup[] = [
    {
      portalId: 'cert-actions',
      portalName: 'Warranty Certificates',
      portalIcon: Medal,
      actions: [
        {
          id: 'qa-issue-cert',
          label: 'Issue Certificate',
          icon: Plus,
          action: () => {
            onNavigateTab('certificates');
            onOpenAddCertificate?.();
          },
          color: 'bg-orange-600 hover:bg-orange-700 text-white'
        },
        {
          id: 'qa-certs-view',
          label: 'Certificates Register',
          icon: Medal,
          action: () => onNavigateTab('certificates'),
          color: 'bg-slate-700 hover:bg-slate-800 text-white'
        },
        {
          id: 'qa-export-csv',
          label: 'Export CSV',
          icon: Download,
          action: onExportCSV,
          color: 'bg-emerald-600 hover:bg-emerald-700 text-white'
        },
        {
          id: 'qa-export-pdf',
          label: 'Export PDF',
          icon: Download,
          action: onExportPDF,
          color: 'bg-rose-600 hover:bg-rose-700 text-white'
        }
      ]
    },
    {
      portalId: 'request-actions',
      portalName: 'After-Sales Service SLA',
      portalIcon: LifeBuoy,
      actions: [
        {
          id: 'qa-log-claim',
          label: 'Log Service Claim',
          icon: Plus,
          action: () => {
            onNavigateTab('requests');
            onOpenAddRequest?.();
          },
          color: 'bg-amber-600 hover:bg-amber-700 text-white'
        },
        {
          id: 'qa-requests-view',
          label: 'Claims SLA Queue',
          icon: LifeBuoy,
          action: () => onNavigateTab('requests'),
          color: 'bg-purple-600 hover:bg-purple-700 text-white'
        }
      ]
    },
    {
      portalId: 'history-actions',
      portalName: 'Service History & Logs',
      portalIcon: History,
      actions: [
        {
          id: 'qa-history-view',
          label: 'Field Tech Logs',
          icon: History,
          action: () => onNavigateTab('history'),
          color: 'bg-sky-600 hover:bg-sky-700 text-white'
        },
        {
          id: 'qa-dlp-radar',
          label: 'DLP Expiry Radar',
          icon: Clock,
          action: () => onNavigateTab('history'),
          color: 'bg-teal-700 hover:bg-teal-800 text-white'
        }
      ]
    },
    {
      portalId: 'signoff-actions',
      portalName: 'Client Acceptance & AMC',
      portalIcon: HeartHandshake,
      actions: [
        {
          id: 'qa-client-signoff',
          label: 'Client Signoff',
          icon: CheckCircle2,
          action: () => onNavigateTab('certificates'),
          color: 'bg-indigo-600 hover:bg-indigo-700 text-white'
        },
        {
          id: 'qa-amc-contracts',
          label: 'Maintenance AMC',
          icon: HeartHandshake,
          action: () => onNavigateTab('certificates'),
          color: 'bg-cyan-700 hover:bg-cyan-800 text-white'
        }
      ]
    }
  ];

  const primaryPortals: CommandPrimaryPortal[] = [
    // 1. WARRANTY CERTIFICATES & BONDS
    {
      id: 'port-war-certificates',
      name: 'Warranty Certificates & Performance Guarantees',
      shortLabel: '1. Warranty Certificates',
      icon: Medal,
      badge: `${activeCertificates} Active`,
      targetTab: 'certificates',
      onLaunch: () => onNavigateTab('certificates'),
      subPortals: [
        {
          id: 'sub-cert-bonds',
          name: '10-Year Structural & 5-Year Finish Bonds',
          icon: Medal,
          badge: 'Guarantees',
          subSubPortals: [
            {
              id: 'ssp-cert-types',
              name: 'Structural Glazing & Powder Coating Bonds',
              badge: 'Certificates',
              icon: Medal,
              actions: [
                { id: 'act-cert-view-all', name: 'Open Master Warranty Certificates Register', badge: 'Certificates', action: () => onNavigateTab('certificates') },
                { id: 'act-cert-issue-new', name: 'Issue Formal Warranty Certificate & Bond', badge: 'Issue', action: () => { onNavigateTab('certificates'); onOpenAddCertificate?.(); } },
                { id: 'act-cert-water-tight', name: 'Water Tightness & Weatherseal Guarantee', badge: 'Sealant', action: () => onNavigateTab('certificates') }
              ]
            }
          ]
        }
      ]
    },

    // 2. AFTER-SALES SERVICE REQUESTS
    {
      id: 'port-war-requests',
      name: 'After-Sales Service Requests & Claims SLA',
      shortLabel: '2. Service Requests (SLA)',
      icon: LifeBuoy,
      badge: `${pendingRequests} Pending`,
      targetTab: 'requests',
      onLaunch: () => onNavigateTab('requests'),
      subPortals: [
        {
          id: 'sub-req-sla',
          name: '48-Hour Response SLA Queue',
          icon: LifeBuoy,
          badge: 'Claims',
          subSubPortals: [
            {
              id: 'ssp-req-tickets',
              name: 'Hardware, Sealant & Glass Defects',
              badge: 'SLA Tickets',
              icon: LifeBuoy,
              actions: [
                { id: 'act-req-view-all', name: 'Open After-Sales Service Claims Register', badge: 'Queue', action: () => onNavigateTab('requests') },
                { id: 'act-req-log-new', name: 'Log Customer Warranty Claim / Ticket', badge: 'Log Claim', action: () => { onNavigateTab('requests'); onOpenAddRequest?.(); } },
                { id: 'act-req-assign-tech', name: 'Dispatch Field Service Repair Technician', badge: 'Dispatch', action: () => onNavigateTab('requests') }
              ]
            }
          ]
        }
      ]
    },

    // 3. SERVICE HISTORY & DLP
    {
      id: 'port-war-history',
      name: 'Service History & Defect Liability (DLP)',
      shortLabel: '3. History & DLP',
      icon: History,
      badge: 'DLP Active',
      targetTab: 'history',
      onLaunch: () => onNavigateTab('history'),
      subPortals: [
        {
          id: 'sub-his-dlp',
          name: 'Defect Liability Period (DLP) Tracking',
          icon: Clock,
          badge: 'DLP Expiry',
          subSubPortals: [
            {
              id: 'ssp-his-signoffs',
              name: 'Field Technician Logs & Client Acceptance',
              badge: 'Signoffs',
              icon: History,
              actions: [
                { id: 'act-his-view-all', name: 'Open Service History & Completed Repairs Log', badge: 'History', action: () => onNavigateTab('history') },
                { id: 'act-his-dlp-release', name: 'Final DLP Expiry & Retention Money Clearance', badge: 'Retention', action: () => onNavigateTab('history') },
                { id: 'act-his-parts-consumed', name: 'Replacement Parts & Fasteners Consumption', badge: 'Parts', action: () => onNavigateTab('history') }
              ]
            }
          ]
        }
      ]
    }
  ];

  return (
    <PortalCommandCenterLanding
      portalTitle="Warranty & After-Sales Service Command Center"
      badgeLabel="Client Guarantee Suite"
      statusBadge="Warranty Active"
      headerControls={
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateTab('certificates')}
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1 shadow-xs cursor-pointer transition-colors"
          >
            <Medal size={12} />
            <span>Certificates</span>
          </button>
          <button
            onClick={() => onNavigateTab('requests')}
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1 shadow-xs cursor-pointer transition-colors"
          >
            <LifeBuoy size={12} />
            <span>Requests</span>
          </button>
          <button
            onClick={() => {
              onNavigateTab('certificates');
              onOpenAddCertificate?.();
            }}
            className="px-2.5 py-1 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1 shadow-xs cursor-pointer transition-colors"
          >
            <Plus size={12} />
            <span>Issue Certificate</span>
          </button>
        </div>
      }
      quickActionGroups={quickActionGroups}
      primaryPortals={primaryPortals}
      onLaunchPortal={(p) => {
        if (p.targetTab) onNavigateTab(p.targetTab as WarrantyTab);
      }}
      searchPlaceholder="Search warranty certificates, service requests, DLP & maintenance logs..."
    />
  );
};
