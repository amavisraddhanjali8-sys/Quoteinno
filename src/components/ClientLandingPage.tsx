import React from 'react';
import {
  User,
  Building2,
  ExternalLink,
  FileText,
  CreditCard,
  CheckCircle2,
  MessageSquare,
  FolderTree,
  Plus,
  Download,
  TrendingUp,
  Scale,
  Award,
  Kanban,
  LayoutGrid,
  List
} from 'lucide-react';
import {
  PortalCommandCenterLanding,
  QuickActionGroup,
  CommandPrimaryPortal
} from './common/PortalCommandCenterLanding';
import { Client, Invoice, Project } from '../types';

interface ClientLandingPageProps {
  clients: Client[];
  projects?: Project[];
  invoices?: Invoice[];
  onNewClient: () => void;
  onViewPortal: (client: Client) => void;
  onSelectViewMode: (mode: 'table' | 'cards' | 'kanban') => void;
  onOpenClientDetails?: (client: Client) => void;
  onExportCSV: () => void;
  onExportPDF: () => void;
}

export const ClientLandingPage: React.FC<ClientLandingPageProps> = ({
  clients,
  invoices = [],
  onNewClient,
  onViewPortal,
  onSelectViewMode,
  onOpenClientDetails,
  onExportCSV,
  onExportPDF
}) => {
  const defaultClient = clients[0];

  const quickActionGroups: QuickActionGroup[] = [
    {
      portalId: 'crm-actions',
      portalName: 'Client CRM & Directory',
      portalIcon: User,
      actions: [
        {
          id: 'qa-new-client',
          label: 'New Client',
          icon: Plus,
          action: onNewClient,
          color: 'bg-orange-600 hover:bg-orange-700 text-white'
        },
        {
          id: 'qa-table-view',
          label: 'Table View',
          icon: List,
          action: () => onSelectViewMode('table'),
          color: 'bg-slate-700 hover:bg-slate-800 text-white'
        },
        {
          id: 'qa-kanban-view',
          label: 'Kanban CRM',
          icon: Kanban,
          action: () => onSelectViewMode('kanban'),
          color: 'bg-purple-600 hover:bg-purple-700 text-white'
        },
        {
          id: 'qa-cards-view',
          label: 'Grid Cards',
          icon: LayoutGrid,
          action: () => onSelectViewMode('cards'),
          color: 'bg-blue-600 hover:bg-blue-700 text-white'
        }
      ]
    },
    {
      portalId: 'portal-actions',
      portalName: 'Dedicated Client Portal',
      portalIcon: ExternalLink,
      actions: [
        {
          id: 'qa-launch-portal',
          label: 'Open Client Portal',
          icon: ExternalLink,
          action: () => defaultClient && onViewPortal(defaultClient),
          color: 'bg-emerald-600 hover:bg-emerald-700 text-white'
        },
        {
          id: 'qa-export-pdf',
          label: 'Export PDF Report',
          icon: Download,
          action: onExportPDF,
          color: 'bg-rose-600 hover:bg-rose-700 text-white'
        },
        {
          id: 'qa-export-csv',
          label: 'Export CSV Master',
          icon: Download,
          action: onExportCSV,
          color: 'bg-teal-700 hover:bg-teal-800 text-white'
        }
      ]
    },
    {
      portalId: 'commercial-actions',
      portalName: 'Commercial & Financial',
      portalIcon: CreditCard,
      actions: [
        {
          id: 'qa-invoices-summary',
          label: 'Client Invoices',
          icon: CreditCard,
          action: () => onSelectViewMode('table'),
          color: 'bg-indigo-600 hover:bg-indigo-700 text-white'
        },
        {
          id: 'qa-statements',
          label: 'Statements of Account',
          icon: FileText,
          action: () => onSelectViewMode('table'),
          color: 'bg-amber-600 hover:bg-amber-700 text-white'
        },
        {
          id: 'qa-retainage',
          label: 'Retainage Release',
          icon: Scale,
          action: () => onSelectViewMode('table'),
          color: 'bg-cyan-700 hover:bg-cyan-800 text-white'
        }
      ]
    },
    {
      portalId: 'comms-actions',
      portalName: 'Communication & Delivery',
      portalIcon: MessageSquare,
      actions: [
        {
          id: 'qa-open-chat',
          label: 'Client Chat Tunnel',
          icon: MessageSquare,
          action: () => defaultClient && onOpenClientDetails?.(defaultClient),
          color: 'bg-sky-600 hover:bg-sky-700 text-white'
        },
        {
          id: 'qa-milestones',
          label: 'Site Handover Tracker',
          icon: CheckCircle2,
          action: () => onSelectViewMode('table'),
          color: 'bg-emerald-700 hover:bg-emerald-800 text-white'
        },
        {
          id: 'qa-feedback-csat',
          label: 'CSAT & Feedback',
          icon: Award,
          action: () => onSelectViewMode('table'),
          color: 'bg-amber-700 hover:bg-amber-800 text-white'
        }
      ]
    }
  ];

  const primaryPortals: CommandPrimaryPortal[] = [
    // 1. CLIENT CRM & MASTER DIRECTORY
    {
      id: 'port-client-crm',
      name: 'Client CRM & Master Directory',
      shortLabel: '1. Directory & CRM',
      icon: User,
      badge: `${clients.length} Clients`,
      onLaunch: () => onSelectViewMode('table'),
      subPortals: [
        {
          id: 'sub-crm-directory',
          name: 'Corporate & Government Clients',
          icon: Building2,
          badge: 'Corporate',
          subSubPortals: [
            {
              id: 'ssp-crm-corporate',
              name: 'Enterprise Tier Accounts',
              badge: 'Tier 1',
              icon: Building2,
              actions: [
                { id: 'act-crm-table', name: 'Open Enterprise Clients Table', badge: 'Table', action: () => onSelectViewMode('table') },
                { id: 'act-crm-add', name: 'Register New Corporate Client', badge: 'New', action: onNewClient },
                { id: 'act-crm-export', name: 'Export Complete Client Database (CSV)', badge: 'CSV', action: onExportCSV }
              ]
            },
            {
              id: 'ssp-crm-kanban',
              name: 'CRM Pipeline & Lead Stages',
              badge: 'Pipeline',
              icon: Kanban,
              actions: [
                { id: 'act-crm-kanban-view', name: 'Interactive CRM Pipeline Board', badge: 'Kanban', action: () => onSelectViewMode('kanban') },
                { id: 'act-crm-in-negotiation', name: 'Filter Clients In Active Negotiation', badge: 'Negotiation', action: () => onSelectViewMode('kanban') }
              ]
            }
          ]
        },
        {
          id: 'sub-crm-categories',
          name: 'Categories & Industry Sectors',
          icon: FolderTree,
          badge: 'Sectors',
          subSubPortals: [
            {
              id: 'ssp-crm-sectors',
              name: 'Commercial, Residential & Industrial',
              badge: 'Sectors',
              icon: FolderTree,
              actions: [
                { id: 'act-sec-commercial', name: 'High-Rise Commercial Glass Clients', badge: 'Commercial', action: () => onSelectViewMode('table') },
                { id: 'act-sec-industrial', name: 'Steel Fabrication Industrial Clients', badge: 'Industrial', action: () => onSelectViewMode('table') }
              ]
            }
          ]
        }
      ]
    },

    // 2. DEDICATED CLIENT PORTAL
    {
      id: 'port-client-portal-view',
      name: 'Dedicated Client Self-Service Portal',
      shortLabel: '2. Dedicated Portal',
      icon: ExternalLink,
      badge: 'Interactive',
      onLaunch: () => defaultClient && onViewPortal(defaultClient),
      subPortals: [
        {
          id: 'sub-portal-selfservice',
          name: 'Client Perspective & Approvals',
          icon: ExternalLink,
          badge: 'Client UI',
          subSubPortals: [
            {
              id: 'ssp-portal-quotes',
              name: 'Quotation Review & Digital Signoff',
              badge: 'Quotes',
              icon: FileText,
              actions: [
                { id: 'act-portal-view-first', name: 'Launch Dedicated Client Portal Hub', badge: 'Launch', action: () => defaultClient && onViewPortal(defaultClient) },
                { id: 'act-portal-quote-sign', name: 'Review Pending Proposal Submissions', badge: 'Review', action: () => defaultClient && onViewPortal(defaultClient) }
              ]
            },
            {
              id: 'ssp-portal-progress',
              name: 'Live Fabrication Progress & Media',
              badge: 'Progress',
              icon: TrendingUp,
              actions: [
                { id: 'act-portal-media-feed', name: 'Inspect Yard Fabrication Photos & Inspection Reports', badge: 'Photos', action: () => defaultClient && onViewPortal(defaultClient) },
                { id: 'act-portal-milestone-signoff', name: 'Digital Milestone Acceptance Signoff', badge: 'Signoff', action: () => defaultClient && onViewPortal(defaultClient) }
              ]
            }
          ]
        }
      ]
    },

    // 3. COMMERCIAL INVOICING & STATEMENTS
    {
      id: 'port-client-finance',
      name: 'Commercial Invoicing & Accounts',
      shortLabel: '3. Invoicing & Ledger',
      icon: CreditCard,
      badge: `${invoices.length} Invoices`,
      onLaunch: () => onSelectViewMode('table'),
      subPortals: [
        {
          id: 'sub-fin-invoices',
          name: 'Tax Invoices & Payment Status',
          icon: CreditCard,
          badge: 'Billing',
          subSubPortals: [
            {
              id: 'ssp-fin-receivables',
              name: 'Receivables & Aging Summary',
              badge: 'Aging',
              icon: CreditCard,
              actions: [
                { id: 'act-fin-aging-report', name: 'Generate 30/60/90 Day Aging Analysis', badge: 'Aging', action: () => onSelectViewMode('table') },
                { id: 'act-fin-statements', name: 'Print Client Monthly Statement of Account', badge: 'Statement', action: () => onSelectViewMode('table') },
                { id: 'act-fin-retainage-calc', name: 'Retainage Ledger & Defect Liability Release', badge: 'Retainage', action: () => onSelectViewMode('table') }
              ]
            }
          ]
        }
      ]
    },

    // 4. CLIENT CHAT & COMMUNICATIONS
    {
      id: 'port-client-comms',
      name: 'Client Communications & Site Tunnel',
      shortLabel: '4. Communications',
      icon: MessageSquare,
      badge: 'Live Chat',
      onLaunch: () => defaultClient && onOpenClientDetails?.(defaultClient),
      subPortals: [
        {
          id: 'sub-comms-chat',
          name: 'Direct Messaging & Instructions',
          icon: MessageSquare,
          badge: 'Direct Tunnel',
          subSubPortals: [
            {
              id: 'ssp-comms-threads',
              name: 'Site Coordination & Clarifications',
              badge: 'Threads',
              icon: MessageSquare,
              actions: [
                { id: 'act-comms-open-drawer', name: 'Open Real-Time Chat & Site Log Tunnel', badge: 'Open Chat', action: () => defaultClient && onOpenClientDetails?.(defaultClient) },
                { id: 'act-comms-call-logs', name: 'Review Formal Client Transmittals Log', badge: 'Transmittals', action: () => defaultClient && onOpenClientDetails?.(defaultClient) }
              ]
            }
          ]
        }
      ]
    },

    // 5. CLIENT SATISFACTION & REPUTATION
    {
      id: 'port-client-csat',
      name: 'Customer Satisfaction & Quality Rating',
      shortLabel: '5. CSAT & Quality',
      icon: Award,
      badge: '98.4% CSAT',
      onLaunch: () => onSelectViewMode('table'),
      subPortals: [
        {
          id: 'sub-csat-metrics',
          name: 'Post-Project Handover Feedback',
          icon: Award,
          badge: 'Feedback',
          subSubPortals: [
            {
              id: 'ssp-csat-reviews',
              name: 'Net Promoter Score & Testimonials',
              badge: 'NPS',
              icon: Award,
              actions: [
                { id: 'act-csat-nps-survey', name: 'Review Project Handover Survey Scores', badge: 'NPS 78', action: () => onSelectViewMode('table') },
                { id: 'act-csat-repeat-rate', name: 'Calculate Repeat Client Lifetime Value', badge: 'LTV', action: () => onSelectViewMode('table') }
              ]
            }
          ]
        }
      ]
    }
  ];

  return (
    <PortalCommandCenterLanding
      portalTitle="Client Relationship & Commercial Portal"
      badgeLabel="Client Ecosystem"
      statusBadge="CRM Active"
      headerControls={
        <div className="flex items-center gap-2">
          <button
            onClick={() => onSelectViewMode('table')}
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1 shadow-xs cursor-pointer transition-colors"
          >
            <List size={12} />
            <span>Table</span>
          </button>
          <button
            onClick={() => onSelectViewMode('kanban')}
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1 shadow-xs cursor-pointer transition-colors"
          >
            <Kanban size={12} />
            <span>Kanban</span>
          </button>
          <button
            onClick={onNewClient}
            className="px-2.5 py-1 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1 shadow-xs cursor-pointer transition-colors"
          >
            <Plus size={12} />
            <span>New Client</span>
          </button>
        </div>
      }
      quickActionGroups={quickActionGroups}
      primaryPortals={primaryPortals}
      onLaunchPortal={(p) => {
        if (p.onLaunch) p.onLaunch();
      }}
      searchPlaceholder="Search clients, proposals, invoices & CRM records..."
    />
  );
};
