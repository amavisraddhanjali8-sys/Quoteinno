import { CentralPortalId, SecurityUser } from '../types/security';
import { securityService } from './securityService';

export type ConversationChannelType =
  | 'direct'
  | 'group'
  | 'community'
  | 'department'
  | 'project'
  | 'factory'
  | 'client'
  | 'supplier'
  | 'announcement'
  | 'broadcast';

export type ConversationStatus = 'open' | 'awaiting_action' | 'paused' | 'closed';

export type MessagePriority = 'normal' | 'important' | 'urgent' | 'critical';

export type MessageDeliveryStatus = 'sending' | 'sent' | 'delivered' | 'read';

export type MessageContentType =
  | 'text'
  | 'task'
  | 'instruction'
  | 'approval'
  | 'portal_link'
  | 'document'
  | 'voice'
  | 'system_event'
  | 'announcement';

export interface LinkedPortalObject {
  id: string;
  objectType:
    | 'portal'
    | 'project'
    | 'factory_task'
    | 'quotation'
    | 'invoice'
    | 'boq_item'
    | 'qc_inspection'
    | 'hse_record'
    | 'procurement_po'
    | 'hr_schedule'
    | 'document';
  title: string;
  code: string;
  subtitle: string;
  targetView: string;
  targetSubTab?: string;
  targetPortalId: CentralPortalId;
  requiredPermission?: string;
  recordId?: string;
  statusBadge?: string;
  metricsLabel?: string;
}

export interface MessageTaskPayload {
  taskId: string;
  taskCode: string;
  taskNumber?: string;
  title: string;
  taskTitle?: string;
  description: string;
  assignedToUserId: string;
  assignedToName: string;
  assignedToRole?: string;
  dueDate: string;
  priority: MessagePriority;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'escalated' | 'rejected';
  progressPercent: number;
  requiresApproval: boolean;
  approvedBy?: string;
  linkedPortal?: LinkedPortalObject;
}

export interface MessageApprovalPayload {
  approvalId: string;
  referenceCode: string;
  requestType: 'BOQ Variation' | 'Purchase Order' | 'QC Release' | 'Dispatch Clearance' | 'Invoice Sign-off' | 'Portal Access';
  title: string;
  requestTitle?: string;
  amountOrScope: string;
  amountValue?: string;
  status: 'pending' | 'approved' | 'rejected' | 'revision_requested';
  decidedBy?: string;
  decidedAt?: string;
  decisionNote?: string;
  linkedPortal?: LinkedPortalObject;
}

export interface MessageAttachment {
  id: string;
  name: string;
  fileType: 'pdf' | 'dwg' | 'xlsx' | 'image' | 'voice' | 'zip' | 'location';
  sizeLabel: string;
  url?: string;
  durationLabel?: string;
  previewText?: string;
}

export interface MessageReaction {
  emoji: string;
  userIds: string[];
  userNames: string[];
}

export interface QuickReplyAction {
  id: string;
  label: string;
  actionType: 'open_portal' | 'reply_text' | 'accept_task' | 'complete_task' | 'approve_request' | 'acknowledge';
  payload?: string;
  linkedPortal?: LinkedPortalObject;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  senderAvatarInitials: string;
  timestamp: string;
  createdAtIso: string;
  contentType: MessageContentType;
  content: string;
  priority: MessagePriority;
  deliveryStatus: MessageDeliveryStatus;
  readByUserIds: string[];
  isPinned?: boolean;
  isBookmarked?: boolean;
  isEdited?: boolean;
  requiresAcknowledgement?: boolean;
  acknowledgedByUserIds?: string[];
  scheduledFor?: string;
  replyToMessageId?: string;
  replyToSenderName?: string;
  replyToSnippet?: string;
  mentions?: string[];
  linkedPortal?: LinkedPortalObject;
  taskPayload?: MessageTaskPayload;
  approvalPayload?: MessageApprovalPayload;
  attachments?: MessageAttachment[];
  reactions?: MessageReaction[];
  quickActions?: QuickReplyAction[];
}

export interface ConversationNote {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  authorInitials: string;
  timestamp: string;
  content: string;
}

export interface ConversationCustomAttribute {
  id: string;
  label: string;
  value: string;
}

export interface ConversationThread {
  id: string;
  referenceNumber: string;
  title: string;
  subtitle: string;
  channelType: ConversationChannelType;
  channelLabel: string;
  status: ConversationStatus;
  avatarInitials: string;
  avatarColor: string;
  isOnline: boolean;
  unreadCount: number;
  isPinned: boolean;
  assignedToUserId?: string;
  assignedToName?: string;
  participantUserIds: string[];
  allowedRoleIds: string[];
  allowedDepartments: string[];
  projectId?: string;
  projectName?: string;
  factoryId?: string;
  factoryName?: string;
  contactPhone?: string;
  contactEmail?: string;
  contactAddress?: string;
  defaultLinkedPortal?: LinkedPortalObject;
  customAttributes: ConversationCustomAttribute[];
  notes: ConversationNote[];
  lastMessageText: string;
  lastMessageTime: string;
  lastActivityIso: string;
}

export interface MessageTemplate {
  id: string;
  slashCommand: string;
  title: string;
  category: 'Task & Instruction' | 'Quality & HSE' | 'Factory & Dispatch' | 'Commercial & Finance' | 'General';
  content: string;
  defaultPriority: MessagePriority;
  suggestedPortal?: LinkedPortalObject;
}

export interface RoleCommunicationPolicy {
  roleId: string;
  roleName: string;
  canDirectMessageAllRoles: boolean;
  canCreateGroups: boolean;
  canCreateCommunities: boolean;
  canSendAnnouncements: boolean;
  canSystemBroadcast: boolean;
  canAssignTasks: boolean;
  canSendInstructions: boolean;
  canSharePortalsAndRecords: boolean;
  canShareControlledDocuments: boolean;
  canViewDepartmentHistory: boolean;
  allowedTargetCategories: ('INTERNAL' | 'PROFESSIONAL' | 'COMMERCIAL' | 'CLIENT')[];
}

export interface MessagingAuditEntry {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  conversationId: string;
  conversationTitle: string;
  details: string;
}

const STORAGE_KEYS = {
  THREADS: 'innovista_central_msg_threads_v2',
  MESSAGES: 'innovista_central_msg_items_v2',
  TEMPLATES: 'innovista_central_msg_templates_v2',
  POLICIES: 'innovista_central_msg_policies_v2',
  AUDIT: 'innovista_central_msg_audit_v2'
};

export const SYSTEM_PORTAL_DIRECTORY: LinkedPortalObject[] = [
  {
    id: 'portal-factories',
    objectType: 'portal',
    title: 'Factories & Workshop Control',
    code: 'PRT-FAC-01',
    subtitle: 'Operational Control Center • Production & CNC Lines',
    targetView: 'operational-control',
    targetSubTab: 'factories',
    targetPortalId: 'factory-workshop-management',
    requiredPermission: 'factory.view',
    statusBadge: 'Active Live',
    metricsLabel: '4 Factories • 18 Work Packages'
  },
  {
    id: 'portal-factory-tasks',
    objectType: 'factory_task',
    title: 'Factory Production Tasks & Planning',
    code: 'PRT-TSK-02',
    subtitle: 'Operational Control Center • Shopfloor Task Board',
    targetView: 'operational-control',
    targetSubTab: 'tasks_planning',
    targetPortalId: 'production-control',
    requiredPermission: 'production.view',
    statusBadge: 'Execution',
    metricsLabel: 'Cutting, Welding & Glazing Tasks'
  },
  {
    id: 'portal-worksheets',
    objectType: 'portal',
    title: 'Digital Worksheets & Daily Logs',
    code: 'PRT-WKS-03',
    subtitle: 'Operational Control Center • Daily Output & Evidence',
    targetView: 'operational-control',
    targetSubTab: 'worksheets_daily',
    targetPortalId: 'production-control',
    requiredPermission: 'production.view',
    statusBadge: 'Daily Sync'
  },
  {
    id: 'portal-projects',
    objectType: 'project',
    title: 'Project Management & Register',
    code: 'PRT-PRJ-04',
    subtitle: 'Projects Portal • Master Execution & Variations',
    targetView: 'projects',
    targetPortalId: 'project-management',
    requiredPermission: 'project.view',
    statusBadge: 'Portfolio'
  },
  {
    id: 'portal-lifecycle',
    objectType: 'hr_schedule',
    title: 'Project Lifecycle & Schedules',
    code: 'PRT-SCH-05',
    subtitle: 'Gantt Milestones, Phases & Resource Allocation',
    targetView: 'project-lifecycle',
    targetSubTab: 'phases',
    targetPortalId: 'project-management',
    requiredPermission: 'project.view',
    statusBadge: 'Milestones'
  },
  {
    id: 'portal-quotes',
    objectType: 'quotation',
    title: 'Sales Quotations & Estimations',
    code: 'PRT-QTE-06',
    subtitle: 'Sales & CRM • Commercial Proposals & Revisions',
    targetView: 'history',
    targetPortalId: 'sales-crm-quotes',
    requiredPermission: 'quotes.view',
    statusBadge: 'Commercial'
  },
  {
    id: 'portal-boq',
    objectType: 'boq_item',
    title: 'Engineering BOQ & Specs Engine',
    code: 'PRT-BOQ-07',
    subtitle: 'Engineering & QS • Master Catalog & BOM Pricing',
    targetView: 'boq-items',
    targetPortalId: 'engineering-qs-boq',
    requiredPermission: 'boq.view',
    statusBadge: 'QS / Engineering'
  },
  {
    id: 'portal-procurement',
    objectType: 'procurement_po',
    title: 'Procurement & Supply Chain Hub',
    code: 'PRT-PRC-08',
    subtitle: 'Purchase Orders, RFQs, GRNs & 89 Doc Packages',
    targetView: 'procurement',
    targetSubTab: 'landing',
    targetPortalId: 'procurement-supply-chain',
    requiredPermission: 'procurement.view',
    statusBadge: 'Supply Chain'
  },
  {
    id: 'portal-quality',
    objectType: 'qc_inspection',
    title: 'Quality Assurance & NCR Control',
    code: 'PRT-QAC-09',
    subtitle: 'QA/QC Portal • Inspections, Tolerances & NCRs',
    targetView: 'quality-control',
    targetSubTab: 'landing',
    targetPortalId: 'quality-assurance',
    requiredPermission: 'qc.view',
    statusBadge: 'ISO-9001'
  },
  {
    id: 'portal-safety',
    objectType: 'hse_record',
    title: 'Construction Site & HSE Safety',
    code: 'PRT-HSE-10',
    subtitle: 'Site Permits, Toolbox Talks & Incident Control',
    targetView: 'site-management',
    targetSubTab: 'landing',
    targetPortalId: 'construction-site-management',
    requiredPermission: 'site.view',
    statusBadge: 'Zero Harm'
  },
  {
    id: 'portal-accounting',
    objectType: 'invoice',
    title: 'Accounting, Invoices & Ledgers',
    code: 'PRT-FIN-11',
    subtitle: 'Finance Portal • Receivables, Billing & Cashflow',
    targetView: 'accounting',
    targetSubTab: 'overview',
    targetPortalId: 'accounting-finance',
    requiredPermission: 'finance.view',
    statusBadge: 'Financials'
  },
  {
    id: 'portal-hr',
    objectType: 'hr_schedule',
    title: 'Human Capital & Workforce Roster',
    code: 'PRT-HRM-12',
    subtitle: 'Workforce Portal • Attendance, Shifts & Teams',
    targetView: 'resource-management',
    targetSubTab: 'landing',
    targetPortalId: 'human-resources',
    requiredPermission: 'hr.view',
    statusBadge: 'HR & Roster'
  },
  {
    id: 'portal-equipment',
    objectType: 'portal',
    title: 'Equipment & Plant Machinery',
    code: 'PRT-EQP-13',
    subtitle: 'Asset Telemetry, Calibration & Maintenance Logs',
    targetView: 'equipment-management',
    targetSubTab: 'landing',
    targetPortalId: 'equipment-machinery',
    requiredPermission: 'equipment.view',
    statusBadge: 'Assets'
  },
  {
    id: 'portal-documents',
    objectType: 'document',
    title: 'Controlled Drawings & Submittals',
    code: 'PRT-DOC-14',
    subtitle: 'Document Control • IFC Drawings & QR Verification',
    targetView: 'operational-control',
    targetSubTab: 'documents_drawings',
    targetPortalId: 'document-control',
    requiredPermission: 'document.view',
    statusBadge: 'Controlled'
  }
];

const SEED_TEMPLATES: MessageTemplate[] = [
  {
    id: 'tpl-1',
    slashCommand: '/task-assign',
    title: 'Assign Shopfloor Fabrication Task',
    category: 'Task & Instruction',
    content: 'Please initiate fabrication for the attached work package according to the latest IFC shop drawings. Confirm material readiness and update progress in the Factory Tasks portal.',
    defaultPriority: 'important',
    suggestedPortal: SYSTEM_PORTAL_DIRECTORY[1]
  },
  {
    id: 'tpl-2',
    slashCommand: '/qc-inspect',
    title: 'Request Urgent QA/QC Inspection',
    category: 'Quality & HSE',
    content: 'Batch fabrication is complete and staged at Bay 2. Requesting immediate QA/QC dimensional and coating thickness inspection before dispatch clearance.',
    defaultPriority: 'urgent',
    suggestedPortal: SYSTEM_PORTAL_DIRECTORY[8]
  },
  {
    id: 'tpl-3',
    slashCommand: '/boq-verify',
    title: 'BOQ Variation & Rate Verification',
    category: 'Commercial & Finance',
    content: 'Please review the updated BOQ variation quantities and unit rates for client sign-off. Open the linked Engineering BOQ portal to approve.',
    defaultPriority: 'important',
    suggestedPortal: SYSTEM_PORTAL_DIRECTORY[6]
  },
  {
    id: 'tpl-4',
    slashCommand: '/dispatch-ready',
    title: 'Site Dispatch & Crane Readiness',
    category: 'Factory & Dispatch',
    content: 'Curtain wall unitized panels are crated and ready for loading. Site Supervisor please confirm tower crane slot and unloading bay access by 07:00 AM.',
    defaultPriority: 'urgent',
    suggestedPortal: SYSTEM_PORTAL_DIRECTORY[0]
  },
  {
    id: 'tpl-5',
    slashCommand: '/po-approval',
    title: 'Purchase Order Release Request',
    category: 'Commercial & Finance',
    content: 'Kindly review and approve the attached Purchase Order for raw aluminium extrusions and DGU glass panels to prevent production lead-time delay.',
    defaultPriority: 'important',
    suggestedPortal: SYSTEM_PORTAL_DIRECTORY[7]
  },
  {
    id: 'tpl-6',
    slashCommand: '/hse-directive',
    title: 'Mandatory Site HSE Safety Instruction',
    category: 'Quality & HSE',
    content: 'Mandatory HSE Directive: Verify wind-speed telemetry and harness anchor certification before commencing high-level facade installation today.',
    defaultPriority: 'critical',
    suggestedPortal: SYSTEM_PORTAL_DIRECTORY[9]
  }
];

const SEED_THREADS: ConversationThread[] = [
  {
    id: 'conv-fac-ops',
    referenceNumber: '20260926114201',
    title: 'Rohan Wickramasinghe',
    subtitle: 'Factory Manager • Colombo Aluminium Plant',
    channelType: 'factory',
    channelLabel: 'Factory Execution',
    status: 'open',
    avatarInitials: 'RW',
    avatarColor: 'bg-pink-500',
    isOnline: true,
    unreadCount: 2,
    isPinned: true,
    assignedToUserId: 'usr-superadmin',
    assignedToName: 'Alexander Vance',
    participantUserIds: ['usr-superadmin', 'usr-fac-mgr-1', 'usr-pm-1', 'usr-qc-1', 'usr-sup-alu'],
    allowedRoleIds: ['role-superadmin', 'role-enterprise-admin', 'role-gm', 'role-factory-mgr', 'role-pm', 'role-site-sup', 'role-qc-insp'],
    allowedDepartments: ['Executive & Governance', 'Factory Operations', 'Project Management', 'Quality Assurance', 'Aluminium Workshop'],
    projectId: 'PRJ-2026-001',
    projectName: 'Shangri-La Sky Tower Facade',
    factoryId: 'FAC-CMB-01',
    factoryName: 'FAC-CMB-01 — Colombo Main Aluminium & Glazing Plant',
    contactPhone: '+94 77 412 8890',
    contactEmail: 'rohan.w@innovista.lk',
    contactAddress: 'Bay 4, Ekala Industrial Zone, Ja-Ela, Sri Lanka',
    defaultLinkedPortal: SYSTEM_PORTAL_DIRECTORY[1],
    customAttributes: [
      { id: 'attr-1', label: 'Work Package', value: 'WP-2026-104 (Unitized Curtain Wall)' },
      { id: 'attr-2', label: 'Shift Status', value: 'Shift A — 94% Capacity' }
    ],
    notes: [
      {
        id: 'note-1',
        authorId: 'usr-pm-1',
        authorName: 'Eng. Nuwan Perera',
        authorRole: 'Project Manager',
        authorInitials: 'NP',
        timestamp: 'Today, 09:45',
        content: 'Confirmed with Rohan that Level 14-18 unitized frames must pass QC inspection by 4 PM tomorrow before crane slot allocation.'
      },
      {
        id: 'note-2',
        authorId: 'usr-qc-1',
        authorName: 'Nalin Jayawardena',
        authorRole: 'Quality Inspector',
        authorInitials: 'NJ',
        timestamp: 'Today, 10:15',
        content: 'Sealant adhesion test samples passed 100% tensile threshold. Uploaded certificate to Quality Assurance portal.'
      },
      {
        id: 'note-3',
        authorId: 'usr-superadmin',
        authorName: 'Alexander Vance',
        authorRole: 'Super Administrator',
        authorInitials: 'AV',
        timestamp: 'Today, 11:05',
        content: 'Approved overtime shift for CNC machining center #2 to clear remaining transom profiles.'
      }
    ],
    lastMessageText: 'CNC batch #42 is complete. Linked the Factory Tasks portal and QC request for immediate release.',
    lastMessageTime: '13.34',
    lastActivityIso: '2026-09-26T13:34:00Z'
  },
  {
    id: 'conv-pm-commercial',
    referenceNumber: '20260926109842',
    title: 'Eng. Nuwan Perera',
    subtitle: 'Project Manager • Project & BOQ Coordination',
    channelType: 'project',
    channelLabel: 'Project Team B2B',
    status: 'awaiting_action',
    avatarInitials: 'NP',
    avatarColor: 'bg-blue-600',
    isOnline: true,
    unreadCount: 1,
    isPinned: true,
    assignedToUserId: 'usr-superadmin',
    assignedToName: 'Alexander Vance',
    participantUserIds: ['usr-superadmin', 'usr-pm-1', 'usr-qs-1', 'usr-fin-1', 'usr-gm'],
    allowedRoleIds: ['role-superadmin', 'role-enterprise-admin', 'role-gm', 'role-pm', 'role-est-eng', 'role-finance'],
    allowedDepartments: ['Executive & Governance', 'Project Management', 'Engineering & QS', 'Finance & Accounts'],
    projectId: 'PRJ-2026-001',
    projectName: 'Shangri-La Sky Tower Facade',
    contactPhone: '+94 71 229 5412',
    contactEmail: 'nuwan.p@innovista.lk',
    contactAddress: 'Level 12, World Trade Center, Colombo 01',
    defaultLinkedPortal: SYSTEM_PORTAL_DIRECTORY[3],
    customAttributes: [
      { id: 'attr-pm-1', label: 'Variation Ref', value: 'VO-2026-009 (LKR 14.2M)' },
      { id: 'attr-pm-2', label: 'Schedule SPI', value: '1.04 (Ahead of Plan)' }
    ],
    notes: [
      {
        id: 'note-pm-1',
        authorId: 'usr-qs-1',
        authorName: 'Chaminda Silva',
        authorRole: 'Estimation Engineer',
        authorInitials: 'CS',
        timestamp: 'Yesterday, 17:20',
        content: 'Verified acoustic laminated glass rate adjustment in BOQ Engine. Ready for executive approval.'
      }
    ],
    lastMessageText: 'Submitted Variation Order VO-2026-009 for LKR 14,250,000. Please approve or open Project Portal.',
    lastMessageTime: '12.50',
    lastActivityIso: '2026-09-26T12:50:00Z'
  },
  {
    id: 'conv-qc-hse',
    referenceNumber: '20260926095120',
    title: 'Nalin Jayawardena',
    subtitle: 'Quality Inspector • QA/QC & HSE Inspection Desk',
    channelType: 'department',
    channelLabel: 'Quality & HSE',
    status: 'open',
    avatarInitials: 'NJ',
    avatarColor: 'bg-emerald-600',
    isOnline: true,
    unreadCount: 3,
    isPinned: false,
    assignedToUserId: 'usr-superadmin',
    assignedToName: 'Alexander Vance',
    participantUserIds: ['usr-superadmin', 'usr-qc-1', 'usr-fac-mgr-1', 'usr-sup-alu'],
    allowedRoleIds: ['role-superadmin', 'role-enterprise-admin', 'role-gm', 'role-qc-insp', 'role-factory-mgr', 'role-site-sup', 'role-pm'],
    allowedDepartments: ['Quality Assurance', 'Factory Operations', 'Aluminium Workshop', 'Project Management'],
    factoryId: 'FAC-CMB-01',
    factoryName: 'FAC-CMB-01 — Colombo Main Aluminium & Glazing Plant',
    contactPhone: '+94 77 908 3311',
    contactEmail: 'nalin.j@innovista.lk',
    contactAddress: 'QA Testing Lab, Ekala Complex, Ja-Ela',
    defaultLinkedPortal: SYSTEM_PORTAL_DIRECTORY[8],
    customAttributes: [
      { id: 'attr-qc-1', label: 'Inspection Batch', value: 'INS-2026-881 (65 Microns PVDF)' }
    ],
    notes: [],
    lastMessageText: 'Inspection INS-2026-881 passed. Attached QA/QC portal link and signed test certificate.',
    lastMessageTime: '11.40',
    lastActivityIso: '2026-09-26T11:40:00Z'
  },
  {
    id: 'conv-proc-supplier',
    referenceNumber: '20260926083419',
    title: 'Tharindu Bandara & Suppliers',
    subtitle: 'Procurement Officer • Supply Chain & RFQ Desk',
    channelType: 'supplier',
    channelLabel: 'Procurement B2B',
    status: 'awaiting_action',
    avatarInitials: 'TB',
    avatarColor: 'bg-amber-600',
    isOnline: true,
    unreadCount: 1,
    isPinned: false,
    assignedToUserId: 'usr-proc-1',
    assignedToName: 'Tharindu Bandara',
    participantUserIds: ['usr-superadmin', 'usr-proc-1', 'usr-store-1', 'usr-fin-1', 'usr-ext-supplier'],
    allowedRoleIds: ['role-superadmin', 'role-enterprise-admin', 'role-gm', 'role-procurement', 'role-store-mgr', 'role-finance', 'role-viewer'],
    allowedDepartments: ['Procurement', 'Warehouse & Stores', 'Finance & Accounts', 'External Supplier'],
    contactPhone: '+94 76 554 1920',
    contactEmail: 'tharindu.b@innovista.lk',
    contactAddress: 'Central Supply Chain Hub, Peliyagoda',
    defaultLinkedPortal: SYSTEM_PORTAL_DIRECTORY[7],
    customAttributes: [
      { id: 'attr-pr-1', label: 'Active PO', value: 'PO-2026-0419 (Thermal Break Profiles)' }
    ],
    notes: [],
    lastMessageText: 'Shipment container MSCU-992814 arrived at Colombo Port. Linked Procurement & GRN portal.',
    lastMessageTime: '10.22',
    lastActivityIso: '2026-09-26T10:22:00Z'
  },
  {
    id: 'conv-finance-billing',
    referenceNumber: '20260926079104',
    title: 'Malini Fonseka',
    subtitle: 'Finance Officer • Invoicing, Ledger & Payroll Control',
    channelType: 'department',
    channelLabel: 'Finance & Accounts',
    status: 'open',
    avatarInitials: 'MF',
    avatarColor: 'bg-indigo-600',
    isOnline: false,
    unreadCount: 0,
    isPinned: false,
    assignedToUserId: 'usr-fin-1',
    assignedToName: 'Malini Fonseka',
    participantUserIds: ['usr-superadmin', 'usr-fin-1', 'usr-gm', 'usr-hr-1'],
    allowedRoleIds: ['role-superadmin', 'role-enterprise-admin', 'role-gm', 'role-finance', 'role-hr-mgr'],
    allowedDepartments: ['Finance & Accounts', 'Executive Management', 'Human Resources'],
    contactPhone: '+94 11 234 9900',
    contactEmail: 'malini.f@innovista.lk',
    contactAddress: 'Corporate Finance Floor, Colombo 03',
    defaultLinkedPortal: SYSTEM_PORTAL_DIRECTORY[10],
    customAttributes: [
      { id: 'attr-fin-1', label: 'Progress Claim', value: 'IPC-07 (LKR 38,500,000)' }
    ],
    notes: [],
    lastMessageText: 'Interim Payment Certificate IPC-07 reconciled. Click to open Accounting & Invoices portal.',
    lastMessageTime: '09.15',
    lastActivityIso: '2026-09-26T09:15:00Z'
  },
  {
    id: 'conv-client-vip',
    referenceNumber: '20260926064210',
    title: 'David H. Al-Mansoor',
    subtitle: 'B2B Client • Al-Mansoor Real Estate Development',
    channelType: 'client',
    channelLabel: 'Client Portal B2B',
    status: 'open',
    avatarInitials: 'DA',
    avatarColor: 'bg-purple-600',
    isOnline: true,
    unreadCount: 0,
    isPinned: false,
    assignedToUserId: 'usr-sales-1',
    assignedToName: 'Kasun Rajapaksa',
    participantUserIds: ['usr-superadmin', 'usr-sales-1', 'usr-pm-1', 'usr-ext-client'],
    allowedRoleIds: ['role-superadmin', 'role-enterprise-admin', 'role-gm', 'role-sales-mgr', 'role-pm', 'role-viewer'],
    allowedDepartments: ['Sales & Marketing', 'Project Management', 'External Client'],
    projectId: 'PRJ-2026-001',
    projectName: 'Shangri-La Sky Tower Facade',
    contactPhone: '+971 50 882 9104',
    contactEmail: 'd.almansoor@almansoor-dev.ae',
    contactAddress: '5467 Marina Bay Tower, Suite 511, Colombo / Dubai',
    defaultLinkedPortal: SYSTEM_PORTAL_DIRECTORY[5],
    customAttributes: [
      { id: 'attr-cli-1', label: 'Account Tier', value: 'Platinum Developer Partner' }
    ],
    notes: [],
    lastMessageText: 'Thank you for sharing the updated quotation and mock-up schedule.',
    lastMessageTime: 'Yesterday',
    lastActivityIso: '2026-09-25T18:10:00Z'
  },
  {
    id: 'conv-broadcast-all',
    referenceNumber: '20260926000001',
    title: 'Innovista System Broadcast & Announcements',
    subtitle: 'All Roles & Departments • Official Governance Channel',
    channelType: 'announcement',
    channelLabel: 'System Broadcast',
    status: 'open',
    avatarInitials: 'IN',
    avatarColor: 'bg-orange-600',
    isOnline: true,
    unreadCount: 0,
    isPinned: true,
    assignedToUserId: 'usr-superadmin',
    assignedToName: 'Alexander Vance',
    participantUserIds: ['ALL'],
    allowedRoleIds: ['ALL'],
    allowedDepartments: ['ALL'],
    contactPhone: 'Internal Ext. 100',
    contactEmail: 'governance@innovista.lk',
    contactAddress: 'Innovista Precision Suite HQ',
    defaultLinkedPortal: SYSTEM_PORTAL_DIRECTORY[0],
    customAttributes: [
      { id: 'attr-brd-1', label: 'Broadcast Scope', value: 'Enterprise-Wide (All 15 Roles)' }
    ],
    notes: [],
    lastMessageText: 'Q3 Factory & Site ISO-9001 / HSE Audit schedule published. Please acknowledge receipt.',
    lastMessageTime: 'Yesterday',
    lastActivityIso: '2026-09-25T15:00:00Z'
  }
];

const SEED_MESSAGES: ChatMessage[] = [
  // Thread 1: Rohan Wickramasinghe (Factory Execution)
  {
    id: 'msg-101',
    conversationId: 'conv-fac-ops',
    senderId: 'usr-superadmin',
    senderName: 'Alexander Vance',
    senderRole: 'Super Administrator',
    senderAvatarInitials: 'AV',
    timestamp: '13.28',
    createdAtIso: '2026-09-26T13:28:00Z',
    contentType: 'instruction',
    content: 'Thank you. Please confirm the completed unit count and target dispatch date for Work Package WP-2026-104 (e.g., 120 Curtain Wall panels, September 28th).',
    priority: 'important',
    deliveryStatus: 'read',
    readByUserIds: ['usr-superadmin', 'usr-fac-mgr-1', 'usr-pm-1'],
    linkedPortal: SYSTEM_PORTAL_DIRECTORY[0]
  },
  {
    id: 'msg-102',
    conversationId: 'conv-fac-ops',
    senderId: 'usr-fac-mgr-1',
    senderName: 'Rohan Wickramasinghe',
    senderRole: 'Factory Manager',
    senderAvatarInitials: 'RW',
    timestamp: '13.30',
    createdAtIso: '2026-09-26T13:30:00Z',
    contentType: 'text',
    content: '125 Unitized Panels completed, September 28th dispatch slot locked.',
    priority: 'normal',
    deliveryStatus: 'read',
    readByUserIds: ['usr-superadmin', 'usr-fac-mgr-1']
  },
  {
    id: 'msg-103',
    conversationId: 'conv-fac-ops',
    senderId: 'usr-superadmin',
    senderName: 'Alexander Vance',
    senderRole: 'Super Administrator',
    senderAvatarInitials: 'AV',
    timestamp: '13.32',
    createdAtIso: '2026-09-26T13:32:00Z',
    contentType: 'portal_link',
    content: 'Thank you! I have linked the Factory Production Tasks portal and assigned the pre-dispatch QA/QC verification task. What action would you like to take next?',
    priority: 'important',
    deliveryStatus: 'read',
    readByUserIds: ['usr-superadmin', 'usr-fac-mgr-1', 'usr-qc-1'],
    linkedPortal: SYSTEM_PORTAL_DIRECTORY[1],
    taskPayload: {
      taskId: 'tsk-msg-409',
      taskCode: 'TSK-FAC-409',
      title: 'Complete Final Glazing & Silicone Cure Check — Batch #42',
      description: 'Verify structural silicone shore-A hardness and barcode scan all 125 unitized panels into the dispatch manifest.',
      assignedToUserId: 'usr-fac-mgr-1',
      assignedToName: 'Rohan Wickramasinghe',
      assignedToRole: 'Factory Manager',
      dueDate: '2026-09-27',
      priority: 'urgent',
      status: 'in_progress',
      progressPercent: 80,
      requiresApproval: true,
      linkedPortal: SYSTEM_PORTAL_DIRECTORY[1]
    },
    quickActions: [
      {
        id: 'qa-open-tasks',
        label: 'Open Factory Tasks Portal',
        actionType: 'open_portal',
        linkedPortal: SYSTEM_PORTAL_DIRECTORY[1]
      },
      {
        id: 'qa-open-qc',
        label: 'Open QA/QC Inspection Hub',
        actionType: 'open_portal',
        linkedPortal: SYSTEM_PORTAL_DIRECTORY[8]
      }
    ]
  },
  {
    id: 'msg-104',
    conversationId: 'conv-fac-ops',
    senderId: 'usr-fac-mgr-1',
    senderName: 'Rohan Wickramasinghe',
    senderRole: 'Factory Manager',
    senderAvatarInitials: 'RW',
    timestamp: '13.33',
    createdAtIso: '2026-09-26T13:33:00Z',
    contentType: 'text',
    content: 'Open QA/QC Inspection Hub & Notify @Quality Inspector',
    priority: 'normal',
    deliveryStatus: 'read',
    readByUserIds: ['usr-superadmin', 'usr-fac-mgr-1'],
    mentions: ['@Quality Inspector']
  },
  {
    id: 'msg-105',
    conversationId: 'conv-fac-ops',
    senderId: 'system',
    senderName: 'Innovista Central Router',
    senderRole: 'System Engine',
    senderAvatarInitials: 'SYS',
    timestamp: '13.33',
    createdAtIso: '2026-09-26T13:33:30Z',
    contentType: 'system_event',
    content: 'Task TSK-FAC-409 synchronized with Factory Control Center & QA/QC Inspector Nalin Jayawardena',
    priority: 'normal',
    deliveryStatus: 'read',
    readByUserIds: ['usr-superadmin', 'usr-fac-mgr-1', 'usr-qc-1']
  },
  {
    id: 'msg-106',
    conversationId: 'conv-fac-ops',
    senderId: 'usr-superadmin',
    senderName: 'Alexander Vance',
    senderRole: 'Super Administrator',
    senderAvatarInitials: 'AV',
    timestamp: '13.34',
    createdAtIso: '2026-09-26T13:34:00Z',
    contentType: 'portal_link',
    content: 'Hi Rohan, this is Alexander from Executive Operations. I see CNC batch #42 is ready for dispatch. Could you confirm if the 125 panels are logged in your Digital Worksheet or pending QA sign-off?',
    priority: 'urgent',
    deliveryStatus: 'read',
    readByUserIds: ['usr-superadmin', 'usr-fac-mgr-1'],
    linkedPortal: SYSTEM_PORTAL_DIRECTORY[2],
    attachments: [
      {
        id: 'att-dwg-1',
        name: 'IFC_CurtainWall_Bay4_Elevations_Rev04.dwg',
        fileType: 'dwg',
        sizeLabel: '4.8 MB',
        previewText: 'Controlled CAD Shop Drawing • Verified QR Hash'
      },
      {
        id: 'att-pdf-1',
        name: 'Batch42_Dispatch_Manifest_FAC_CMB_01.pdf',
        fileType: 'pdf',
        sizeLabel: '1.2 MB',
        previewText: '125 Panels • Crates #12–#19'
      }
    ]
  },

  // Thread 2: Eng. Nuwan Perera (Project & Commercial)
  {
    id: 'msg-201',
    conversationId: 'conv-pm-commercial',
    senderId: 'usr-pm-1',
    senderName: 'Eng. Nuwan Perera',
    senderRole: 'Project Manager',
    senderAvatarInitials: 'NP',
    timestamp: '12.42',
    createdAtIso: '2026-09-26T12:42:00Z',
    contentType: 'approval',
    content: 'Submitted Variation Order VO-2026-009 for Shangri-La Sky Tower Podium Canopy (LKR 14,250,000). Please review the linked Project Variation & BOQ portal and approve directly from this message.',
    priority: 'urgent',
    deliveryStatus: 'read',
    readByUserIds: ['usr-superadmin', 'usr-pm-1'],
    linkedPortal: SYSTEM_PORTAL_DIRECTORY[3],
    approvalPayload: {
      approvalId: 'apr-vo-009',
      referenceCode: 'VO-2026-009',
      requestType: 'BOQ Variation',
      title: 'Podium Spider-Fitting Acoustic Laminated Canopy Upgrade',
      amountOrScope: 'LKR 14,250,000 (+8.4% Margin)',
      status: 'pending',
      linkedPortal: SYSTEM_PORTAL_DIRECTORY[3]
    },
    quickActions: [
      {
        id: 'qa-open-prj',
        label: 'Open Project Register',
        actionType: 'open_portal',
        linkedPortal: SYSTEM_PORTAL_DIRECTORY[3]
      },
      {
        id: 'qa-open-boq',
        label: 'Inspect Engineering BOQ',
        actionType: 'open_portal',
        linkedPortal: SYSTEM_PORTAL_DIRECTORY[6]
      }
    ]
  },

  // Thread 3: Nalin Jayawardena (Quality & HSE)
  {
    id: 'msg-301',
    conversationId: 'conv-qc-hse',
    senderId: 'usr-qc-1',
    senderName: 'Nalin Jayawardena',
    senderRole: 'Quality Inspector',
    senderAvatarInitials: 'NJ',
    timestamp: '11.40',
    createdAtIso: '2026-09-26T11:40:00Z',
    contentType: 'portal_link',
    content: 'Inspection INS-2026-881 for PVDF powder coating thickness (68.4 microns average) passed all ISO-9001 tolerances. You can open the Quality Assurance portal directly below.',
    priority: 'important',
    deliveryStatus: 'delivered',
    readByUserIds: ['usr-qc-1'],
    linkedPortal: SYSTEM_PORTAL_DIRECTORY[8],
    quickActions: [
      {
        id: 'qa-qc-open',
        label: 'Open Quality Assurance Portal',
        actionType: 'open_portal',
        linkedPortal: SYSTEM_PORTAL_DIRECTORY[8]
      }
    ]
  },

  // Thread 4: Tharindu Bandara (Procurement)
  {
    id: 'msg-401',
    conversationId: 'conv-proc-supplier',
    senderId: 'usr-proc-1',
    senderName: 'Tharindu Bandara',
    senderRole: 'Procurement Officer',
    senderAvatarInitials: 'TB',
    timestamp: '10.22',
    createdAtIso: '2026-09-26T10:22:00Z',
    contentType: 'portal_link',
    content: 'Shipment container MSCU-992814 (Thermal Break Aluminium Profiles) has cleared customs. Linked the Procurement & Supply Chain Hub for GRN receiving and cost reconciliation.',
    priority: 'important',
    deliveryStatus: 'delivered',
    readByUserIds: ['usr-proc-1'],
    linkedPortal: SYSTEM_PORTAL_DIRECTORY[7],
    quickActions: [
      {
        id: 'qa-proc-open',
        label: 'Open Procurement & PO Hub',
        actionType: 'open_portal',
        linkedPortal: SYSTEM_PORTAL_DIRECTORY[7]
      }
    ]
  },

  // Thread 5: Malini Fonseka (Finance)
  {
    id: 'msg-501',
    conversationId: 'conv-finance-billing',
    senderId: 'usr-fin-1',
    senderName: 'Malini Fonseka',
    senderRole: 'Finance Officer',
    senderAvatarInitials: 'MF',
    timestamp: '09.15',
    createdAtIso: '2026-09-26T09:15:00Z',
    contentType: 'portal_link',
    content: 'Interim Payment Certificate IPC-07 (LKR 38,500,000) has been reconciled against client retention ledger. Use the portal link below to view the live Accounting Ledger.',
    priority: 'normal',
    deliveryStatus: 'read',
    readByUserIds: ['usr-superadmin', 'usr-fin-1'],
    linkedPortal: SYSTEM_PORTAL_DIRECTORY[10],
    quickActions: [
      {
        id: 'qa-fin-open',
        label: 'Open Accounting & Invoices Portal',
        actionType: 'open_portal',
        linkedPortal: SYSTEM_PORTAL_DIRECTORY[10]
      }
    ]
  },

  // Thread 6: Client B2B
  {
    id: 'msg-601',
    conversationId: 'conv-client-vip',
    senderId: 'usr-ext-client',
    senderName: 'David H. Al-Mansoor',
    senderRole: 'B2B Client',
    senderAvatarInitials: 'DA',
    timestamp: 'Yesterday',
    createdAtIso: '2026-09-25T18:10:00Z',
    contentType: 'portal_link',
    content: 'Thank you for sharing the updated commercial quotation QT-2026-104 and project milestone schedule. Our consultant team reviewed the DGU glass specifications.',
    priority: 'normal',
    deliveryStatus: 'read',
    readByUserIds: ['usr-superadmin', 'usr-sales-1', 'usr-ext-client'],
    linkedPortal: SYSTEM_PORTAL_DIRECTORY[5]
  },

  // Thread 7: System Broadcast
  {
    id: 'msg-701',
    conversationId: 'conv-broadcast-all',
    senderId: 'usr-superadmin',
    senderName: 'Alexander Vance',
    senderRole: 'Super Administrator',
    senderAvatarInitials: 'AV',
    timestamp: 'Yesterday',
    createdAtIso: '2026-09-25T15:00:00Z',
    contentType: 'announcement',
    content: 'OFFICIAL BROADCAST: Q3 Factory & Site ISO-9001 / HSE Audit schedule is now live across all factories and active project sites. All Department Heads, Factory Managers, and Site Supervisors must verify their checklists.',
    priority: 'critical',
    deliveryStatus: 'read',
    readByUserIds: ['usr-superadmin', 'usr-fac-mgr-1', 'usr-pm-1', 'usr-qc-1'],
    requiresAcknowledgement: true,
    acknowledgedByUserIds: ['usr-superadmin', 'usr-fac-mgr-1', 'usr-qc-1'],
    linkedPortal: SYSTEM_PORTAL_DIRECTORY[9]
  }
];

const SEED_POLICIES: RoleCommunicationPolicy[] = [
  {
    roleId: 'role-superadmin',
    roleName: 'Super Administrator',
    canDirectMessageAllRoles: true,
    canCreateGroups: true,
    canCreateCommunities: true,
    canSendAnnouncements: true,
    canSystemBroadcast: true,
    canAssignTasks: true,
    canSendInstructions: true,
    canSharePortalsAndRecords: true,
    canShareControlledDocuments: true,
    canViewDepartmentHistory: true,
    allowedTargetCategories: ['INTERNAL', 'PROFESSIONAL', 'COMMERCIAL', 'CLIENT']
  },
  {
    roleId: 'role-enterprise-admin',
    roleName: 'Enterprise Administrator',
    canDirectMessageAllRoles: true,
    canCreateGroups: true,
    canCreateCommunities: true,
    canSendAnnouncements: true,
    canSystemBroadcast: true,
    canAssignTasks: true,
    canSendInstructions: true,
    canSharePortalsAndRecords: true,
    canShareControlledDocuments: true,
    canViewDepartmentHistory: true,
    allowedTargetCategories: ['INTERNAL', 'PROFESSIONAL', 'COMMERCIAL', 'CLIENT']
  },
  {
    roleId: 'role-gm',
    roleName: 'General Manager',
    canDirectMessageAllRoles: true,
    canCreateGroups: true,
    canCreateCommunities: true,
    canSendAnnouncements: true,
    canSystemBroadcast: true,
    canAssignTasks: true,
    canSendInstructions: true,
    canSharePortalsAndRecords: true,
    canShareControlledDocuments: true,
    canViewDepartmentHistory: true,
    allowedTargetCategories: ['INTERNAL', 'PROFESSIONAL', 'COMMERCIAL', 'CLIENT']
  },
  {
    roleId: 'role-pm',
    roleName: 'Project Manager',
    canDirectMessageAllRoles: true,
    canCreateGroups: true,
    canCreateCommunities: false,
    canSendAnnouncements: true,
    canSystemBroadcast: false,
    canAssignTasks: true,
    canSendInstructions: true,
    canSharePortalsAndRecords: true,
    canShareControlledDocuments: true,
    canViewDepartmentHistory: true,
    allowedTargetCategories: ['INTERNAL', 'PROFESSIONAL', 'COMMERCIAL', 'CLIENT']
  },
  {
    roleId: 'role-factory-mgr',
    roleName: 'Factory Manager',
    canDirectMessageAllRoles: true,
    canCreateGroups: true,
    canCreateCommunities: false,
    canSendAnnouncements: true,
    canSystemBroadcast: false,
    canAssignTasks: true,
    canSendInstructions: true,
    canSharePortalsAndRecords: true,
    canShareControlledDocuments: true,
    canViewDepartmentHistory: true,
    allowedTargetCategories: ['INTERNAL', 'PROFESSIONAL', 'COMMERCIAL']
  },
  {
    roleId: 'role-sales-mgr',
    roleName: 'Sales Manager',
    canDirectMessageAllRoles: false,
    canCreateGroups: true,
    canCreateCommunities: false,
    canSendAnnouncements: false,
    canSystemBroadcast: false,
    canAssignTasks: true,
    canSendInstructions: false,
    canSharePortalsAndRecords: true,
    canShareControlledDocuments: false,
    canViewDepartmentHistory: true,
    allowedTargetCategories: ['INTERNAL', 'CLIENT', 'COMMERCIAL']
  },
  {
    roleId: 'role-est-eng',
    roleName: 'Estimation Engineer (QS)',
    canDirectMessageAllRoles: false,
    canCreateGroups: true,
    canCreateCommunities: false,
    canSendAnnouncements: false,
    canSystemBroadcast: false,
    canAssignTasks: true,
    canSendInstructions: true,
    canSharePortalsAndRecords: true,
    canShareControlledDocuments: true,
    canViewDepartmentHistory: true,
    allowedTargetCategories: ['INTERNAL', 'PROFESSIONAL']
  },
  {
    roleId: 'role-qc-insp',
    roleName: 'Quality Inspector (QA/QC)',
    canDirectMessageAllRoles: false,
    canCreateGroups: false,
    canCreateCommunities: false,
    canSendAnnouncements: true,
    canSystemBroadcast: false,
    canAssignTasks: true,
    canSendInstructions: true,
    canSharePortalsAndRecords: true,
    canShareControlledDocuments: true,
    canViewDepartmentHistory: true,
    allowedTargetCategories: ['INTERNAL', 'PROFESSIONAL']
  },
  {
    roleId: 'role-site-sup',
    roleName: 'Site Supervisor',
    canDirectMessageAllRoles: false,
    canCreateGroups: false,
    canCreateCommunities: false,
    canSendAnnouncements: false,
    canSystemBroadcast: false,
    canAssignTasks: true,
    canSendInstructions: true,
    canSharePortalsAndRecords: true,
    canShareControlledDocuments: true,
    canViewDepartmentHistory: false,
    allowedTargetCategories: ['INTERNAL', 'PROFESSIONAL']
  },
  {
    roleId: 'role-finance',
    roleName: 'Finance Officer',
    canDirectMessageAllRoles: false,
    canCreateGroups: true,
    canCreateCommunities: false,
    canSendAnnouncements: false,
    canSystemBroadcast: false,
    canAssignTasks: true,
    canSendInstructions: false,
    canSharePortalsAndRecords: true,
    canShareControlledDocuments: false,
    canViewDepartmentHistory: true,
    allowedTargetCategories: ['INTERNAL', 'CLIENT', 'COMMERCIAL']
  },
  {
    roleId: 'role-hr-mgr',
    roleName: 'HR Manager',
    canDirectMessageAllRoles: true,
    canCreateGroups: true,
    canCreateCommunities: true,
    canSendAnnouncements: true,
    canSystemBroadcast: false,
    canAssignTasks: true,
    canSendInstructions: true,
    canSharePortalsAndRecords: true,
    canShareControlledDocuments: false,
    canViewDepartmentHistory: true,
    allowedTargetCategories: ['INTERNAL']
  },
  {
    roleId: 'role-procurement',
    roleName: 'Procurement Officer',
    canDirectMessageAllRoles: false,
    canCreateGroups: true,
    canCreateCommunities: false,
    canSendAnnouncements: false,
    canSystemBroadcast: false,
    canAssignTasks: true,
    canSendInstructions: true,
    canSharePortalsAndRecords: true,
    canShareControlledDocuments: true,
    canViewDepartmentHistory: true,
    allowedTargetCategories: ['INTERNAL', 'COMMERCIAL']
  },
  {
    roleId: 'role-store-mgr',
    roleName: 'Store Manager',
    canDirectMessageAllRoles: false,
    canCreateGroups: false,
    canCreateCommunities: false,
    canSendAnnouncements: false,
    canSystemBroadcast: false,
    canAssignTasks: true,
    canSendInstructions: false,
    canSharePortalsAndRecords: true,
    canShareControlledDocuments: false,
    canViewDepartmentHistory: false,
    allowedTargetCategories: ['INTERNAL', 'COMMERCIAL']
  },
  {
    roleId: 'role-viewer',
    roleName: 'External Partner / Viewer',
    canDirectMessageAllRoles: false,
    canCreateGroups: false,
    canCreateCommunities: false,
    canSendAnnouncements: false,
    canSystemBroadcast: false,
    canAssignTasks: false,
    canSendInstructions: false,
    canSharePortalsAndRecords: false,
    canShareControlledDocuments: false,
    canViewDepartmentHistory: false,
    allowedTargetCategories: ['INTERNAL']
  }
];

class CentralMessagingService {
  private threads: ConversationThread[] = [];
  private messages: ChatMessage[] = [];
  private templates: MessageTemplate[] = [];
  private policies: RoleCommunicationPolicy[] = [];
  private auditLogs: MessagingAuditEntry[] = [];

  constructor() {
    this.init();
  }

  private load<T>(key: string, seed: T): T {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed as unknown as T;
      }
    } catch (e) {
      console.error('Failed to load messaging key:', key, e);
    }
    localStorage.setItem(key, JSON.stringify(seed));
    return seed;
  }

  private save<T>(key: string, data: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save messaging key:', key, e);
    }
  }

  private init(): void {
    this.threads = this.load(STORAGE_KEYS.THREADS, SEED_THREADS);
    this.messages = this.load(STORAGE_KEYS.MESSAGES, SEED_MESSAGES);
    this.templates = this.load(STORAGE_KEYS.TEMPLATES, SEED_TEMPLATES);
    this.policies = this.load(STORAGE_KEYS.POLICIES, SEED_POLICIES);
    this.auditLogs = this.load(STORAGE_KEYS.AUDIT, [
      {
        id: 'maud-1',
        timestamp: new Date().toISOString(),
        actorId: 'usr-superadmin',
        actorName: 'Alexander Vance',
        actorRole: 'Super Administrator',
        action: 'TASK_PORTAL_DISPATCH',
        conversationId: 'conv-fac-ops',
        conversationTitle: 'Rohan Wickramasinghe',
        details: 'Assigned task TSK-FAC-409 with deep-link to Factory Production Tasks portal.'
      }
    ]);
  }

  public getPolicyForUser(user: SecurityUser | null): RoleCommunicationPolicy {
    if (!user) return SEED_POLICIES[0];
    if (user.roleId === 'role-superadmin' || user.adminAuthorityLevel === 'SUPER_ADMINISTRATOR') {
      return SEED_POLICIES[0];
    }
    return (
      this.policies.find(p => p.roleId === user.roleId) || {
        roleId: user.roleId,
        roleName: user.roleName,
        canDirectMessageAllRoles: false,
        canCreateGroups: false,
        canCreateCommunities: false,
        canSendAnnouncements: false,
        canSystemBroadcast: false,
        canAssignTasks: true,
        canSendInstructions: true,
        canSharePortalsAndRecords: true,
        canShareControlledDocuments: false,
        canViewDepartmentHistory: false,
        allowedTargetCategories: ['INTERNAL']
      }
    );
  }

  public getAllPolicies(): RoleCommunicationPolicy[] {
    return [...this.policies];
  }

  public updatePolicy(updated: RoleCommunicationPolicy, actor: SecurityUser | null): void {
    this.policies = this.policies.map(p => (p.roleId === updated.roleId ? updated : p));
    this.save(STORAGE_KEYS.POLICIES, this.policies);
    this.recordAudit(
      actor,
      'COMMUNICATION_POLICY_UPDATED',
      'system',
      'RBAC Policy Matrix',
      `Updated communication permissions for role ${updated.roleName}`
    );
  }

  public getAuthorizedThreadsForUser(user: SecurityUser | null): ConversationThread[] {
    if (!user) return [...this.threads];
    const isSuper =
      user.roleId === 'role-superadmin' ||
      user.adminAuthorityLevel === 'SUPER_ADMINISTRATOR' ||
      user.roleId === 'role-enterprise-admin' ||
      user.roleId === 'role-gm';

    if (isSuper) return [...this.threads];

    return this.threads.filter(t => {
      if (t.participantUserIds.includes('ALL') || t.allowedRoleIds.includes('ALL')) return true;
      if (t.participantUserIds.includes(user.id)) return true;
      if (t.assignedToUserId === user.id) return true;
      if (t.allowedRoleIds.includes(user.roleId)) return true;
      if (user.department && t.allowedDepartments.includes(user.department)) return true;
      return false;
    });
  }

  public getAuthorizedPortalsForUser(user: SecurityUser | null): LinkedPortalObject[] {
    if (!user) return SYSTEM_PORTAL_DIRECTORY;
    const isSuper =
      user.roleId === 'role-superadmin' ||
      user.adminAuthorityLevel === 'SUPER_ADMINISTRATOR';
    if (isSuper) return SYSTEM_PORTAL_DIRECTORY;

    return SYSTEM_PORTAL_DIRECTORY.filter(portal => {
      const canPortal = securityService.canAccessPortal(user.id, portal.targetPortalId);
      const canPerm = portal.requiredPermission
        ? securityService.hasPermission(user.id, portal.requiredPermission)
        : true;
      return canPortal && canPerm;
    });
  }

  public canUserOpenLinkedPortal(user: SecurityUser | null, portal: LinkedPortalObject): boolean {
    if (!user) return true;
    if (
      user.roleId === 'role-superadmin' ||
      user.adminAuthorityLevel === 'SUPER_ADMINISTRATOR'
    ) {
      return true;
    }
    const canPortal = securityService.canAccessPortal(user.id, portal.targetPortalId);
    const canPerm = portal.requiredPermission
      ? securityService.hasPermission(user.id, portal.requiredPermission)
      : true;
    return canPortal && canPerm;
  }

  public getMessagesForThread(conversationId: string): ChatMessage[] {
    return this.messages.filter(m => m.conversationId === conversationId);
  }

  public getAllMessages(): ChatMessage[] {
    return [...this.messages];
  }

  public getTemplates(): MessageTemplate[] {
    return [...this.templates];
  }

  public getAuditLogs(): MessagingAuditEntry[] {
    return [...this.auditLogs];
  }

  public sendMessage(
    msg: Omit<ChatMessage, 'id' | 'timestamp' | 'createdAtIso' | 'deliveryStatus' | 'readByUserIds'>,
    actor: SecurityUser | null
  ): ChatMessage {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}.${String(now.getMinutes()).padStart(2, '0')}`;
    const newMsg: ChatMessage = {
      ...msg,
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: timeStr,
      createdAtIso: now.toISOString(),
      deliveryStatus: 'read',
      readByUserIds: [msg.senderId]
    };

    this.messages = [...this.messages, newMsg];
    this.save(STORAGE_KEYS.MESSAGES, this.messages);

    this.threads = this.threads.map(t => {
      if (t.id === msg.conversationId) {
        return {
          ...t,
          lastMessageText: msg.content,
          lastMessageTime: timeStr,
          lastActivityIso: now.toISOString(),
          status: msg.contentType === 'task' || msg.contentType === 'approval' ? 'awaiting_action' : t.status
        };
      }
      return t;
    });
    this.save(STORAGE_KEYS.THREADS, this.threads);

    const thread = this.threads.find(t => t.id === msg.conversationId);
    this.recordAudit(
      actor,
      msg.contentType === 'task'
        ? 'TASK_ASSIGNED_IN_CHAT'
        : msg.contentType === 'portal_link'
        ? 'PORTAL_LINK_SHARED'
        : msg.contentType === 'approval'
        ? 'APPROVAL_REQUEST_SENT'
        : 'MESSAGE_SENT',
      msg.conversationId,
      thread?.title || 'Conversation',
      `${msg.content.slice(0, 90)}${msg.linkedPortal ? ` [Linked: ${msg.linkedPortal.title}]` : ''}`
    );

    return newMsg;
  }

  public startOrOpenDirectChat(currentUser: SecurityUser, targetUser: SecurityUser): ConversationThread {
    const existing = this.threads.find(
      t =>
        (t.channelType === 'direct' || t.title === targetUser.fullName) &&
        t.participantUserIds.includes(targetUser.id)
    );
    if (existing) {
      return existing;
    }

    const initials = targetUser.fullName
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

    const colors = ['bg-blue-600', 'bg-emerald-600', 'bg-purple-600', 'bg-pink-500', 'bg-amber-600', 'bg-indigo-600'];
    const color = colors[targetUser.fullName.length % colors.length];

    const newThread: ConversationThread = {
      id: `conv-dir-${Date.now()}`,
      referenceNumber: `${Date.now()}`,
      title: targetUser.fullName,
      subtitle: `${targetUser.roleName} • ${targetUser.department}`,
      channelType: 'direct',
      channelLabel: 'Direct Role Chat',
      status: 'open',
      avatarInitials: initials,
      avatarColor: color,
      isOnline: targetUser.accountStatus === 'Active',
      unreadCount: 0,
      isPinned: false,
      assignedToUserId: currentUser.id,
      assignedToName: currentUser.fullName,
      participantUserIds: [currentUser.id, targetUser.id],
      allowedRoleIds: [currentUser.roleId, targetUser.roleId],
      allowedDepartments: [currentUser.department, targetUser.department],
      contactPhone: targetUser.phone || '+94 77 100 2000',
      contactEmail: targetUser.email,
      contactAddress: `${targetUser.department} Office, Innovista Complex`,
      customAttributes: [
        { id: `attr-${Date.now()}`, label: 'Employee ID', value: targetUser.employeeId }
      ],
      notes: [],
      lastMessageText: `Direct channel initialized with ${targetUser.fullName} (${targetUser.roleName}).`,
      lastMessageTime: 'Just now',
      lastActivityIso: new Date().toISOString()
    };

    this.threads = [newThread, ...this.threads];
    this.save(STORAGE_KEYS.THREADS, this.threads);

    this.sendMessage(
      {
        conversationId: newThread.id,
        senderId: currentUser.id,
        senderName: currentUser.fullName,
        senderRole: currentUser.roleName,
        senderAvatarInitials: currentUser.fullName
          .split(' ')
          .map(n => n[0])
          .slice(0, 2)
          .join('')
          .toUpperCase(),
        contentType: 'system_event',
        content: `Direct role-verified channel established between ${currentUser.fullName} (${currentUser.roleName}) and ${targetUser.fullName} (${targetUser.roleName}).`,
        priority: 'normal'
      },
      currentUser
    );

    return newThread;
  }

  public createChannelOrGroup(
    params: {
      title: string;
      subtitle: string;
      channelType: ConversationChannelType;
      participantUserIds: string[];
      allowedRoleIds: string[];
      allowedDepartments: string[];
      projectId?: string;
      projectName?: string;
      factoryId?: string;
      factoryName?: string;
      defaultLinkedPortal?: LinkedPortalObject;
      initialMessage: string;
      priority: MessagePriority;
    },
    creator: SecurityUser
  ): ConversationThread {
    const initials = params.title
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

    const channelLabelMap: Record<ConversationChannelType, string> = {
      direct: 'Direct Chat',
      group: 'Team Group',
      community: 'Role Community',
      department: 'Department Channel',
      project: 'Project Team Chat',
      factory: 'Factory Workshop',
      client: 'Client B2B',
      supplier: 'Supplier Partner',
      announcement: 'Announcement Channel',
      broadcast: 'System Broadcast'
    };

    const newThread: ConversationThread = {
      id: `conv-${Date.now()}`,
      referenceNumber: `${Date.now()}`,
      title: params.title,
      subtitle: params.subtitle,
      channelType: params.channelType,
      channelLabel: channelLabelMap[params.channelType],
      status: 'open',
      avatarInitials: initials || 'CH',
      avatarColor: params.channelType === 'announcement' || params.channelType === 'broadcast' ? 'bg-orange-600' : 'bg-blue-600',
      isOnline: true,
      unreadCount: 0,
      isPinned: params.channelType === 'announcement' || params.channelType === 'broadcast',
      assignedToUserId: creator.id,
      assignedToName: creator.fullName,
      participantUserIds: params.participantUserIds,
      allowedRoleIds: params.allowedRoleIds,
      allowedDepartments: params.allowedDepartments,
      projectId: params.projectId,
      projectName: params.projectName,
      factoryId: params.factoryId,
      factoryName: params.factoryName,
      defaultLinkedPortal: params.defaultLinkedPortal,
      contactEmail: creator.email,
      contactPhone: creator.phone || '+94 11 200 3000',
      contactAddress: params.factoryName || params.projectName || 'Innovista Enterprise Network',
      customAttributes: [],
      notes: [],
      lastMessageText: params.initialMessage,
      lastMessageTime: 'Just now',
      lastActivityIso: new Date().toISOString()
    };

    this.threads = [newThread, ...this.threads];
    this.save(STORAGE_KEYS.THREADS, this.threads);

    this.sendMessage(
      {
        conversationId: newThread.id,
        senderId: creator.id,
        senderName: creator.fullName,
        senderRole: creator.roleName,
        senderAvatarInitials: creator.fullName
          .split(' ')
          .map(n => n[0])
          .slice(0, 2)
          .join('')
          .toUpperCase(),
        contentType:
          params.channelType === 'announcement' || params.channelType === 'broadcast'
            ? 'announcement'
            : params.defaultLinkedPortal
            ? 'portal_link'
            : 'text',
        content: params.initialMessage,
        priority: params.priority,
        linkedPortal: params.defaultLinkedPortal,
        requiresAcknowledgement: params.channelType === 'announcement' || params.channelType === 'broadcast',
        acknowledgedByUserIds: [creator.id],
        quickActions: params.defaultLinkedPortal
          ? [
              {
                id: `qa-${Date.now()}`,
                label: `Open ${params.defaultLinkedPortal.title}`,
                actionType: 'open_portal',
                linkedPortal: params.defaultLinkedPortal
              }
            ]
          : undefined
      },
      creator
    );

    return newThread;
  }

  public updateThreadStatus(
    conversationId: string,
    status: ConversationStatus,
    actor: SecurityUser | null
  ): void {
    this.threads = this.threads.map(t => (t.id === conversationId ? { ...t, status } : t));
    this.save(STORAGE_KEYS.THREADS, this.threads);
    const thread = this.threads.find(t => t.id === conversationId);
    this.recordAudit(actor, 'THREAD_STATUS_CHANGED', conversationId, thread?.title || '', `Status changed to ${status}`);
  }

  public assignThread(
    conversationId: string,
    assigneeId: string,
    assigneeName: string,
    actor: SecurityUser | null
  ): void {
    this.threads = this.threads.map(t =>
      t.id === conversationId ? { ...t, assignedToUserId: assigneeId, assignedToName: assigneeName } : t
    );
    this.save(STORAGE_KEYS.THREADS, this.threads);

    this.sendMessage(
      {
        conversationId,
        senderId: 'system',
        senderName: 'System Router',
        senderRole: 'System',
        senderAvatarInitials: 'SYS',
        contentType: 'system_event',
        content: `Chat assigned to ${assigneeName} by ${actor?.fullName || 'Administrator'}`,
        priority: 'normal'
      },
      actor
    );
  }

  public markThreadRead(conversationId: string, userId: string): void {
    this.threads = this.threads.map(t =>
      t.id === conversationId ? { ...t, unreadCount: 0 } : t
    );
    this.save(STORAGE_KEYS.THREADS, this.threads);

    this.messages = this.messages.map(m => {
      if (m.conversationId === conversationId && !m.readByUserIds.includes(userId)) {
        return { ...m, readByUserIds: [...m.readByUserIds, userId], deliveryStatus: 'read' };
      }
      return m;
    });
    this.save(STORAGE_KEYS.MESSAGES, this.messages);
  }

  public addNoteToThread(
    conversationId: string,
    content: string,
    author: SecurityUser
  ): void {
    const now = new Date();
    const note: ConversationNote = {
      id: `note-${Date.now()}`,
      authorId: author.id,
      authorName: author.fullName,
      authorRole: author.roleName,
      authorInitials: author.fullName
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase(),
      timestamp: `Today, ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
      content
    };

    this.threads = this.threads.map(t =>
      t.id === conversationId ? { ...t, notes: [note, ...t.notes] } : t
    );
    this.save(STORAGE_KEYS.THREADS, this.threads);
  }

  public addCustomAttribute(
    conversationId: string,
    label: string,
    value: string
  ): void {
    const attr: ConversationCustomAttribute = {
      id: `attr-${Date.now()}`,
      label,
      value
    };
    this.threads = this.threads.map(t =>
      t.id === conversationId
        ? { ...t, customAttributes: [...t.customAttributes, attr] }
        : t
    );
    this.save(STORAGE_KEYS.THREADS, this.threads);
  }

  public updateTaskStatusInMessage(
    messageId: string,
    newStatus: MessageTaskPayload['status'],
    actor: SecurityUser | null
  ): void {
    let targetConvId = '';
    let taskCode = '';
    this.messages = this.messages.map(m => {
      if (m.id === messageId && m.taskPayload) {
        targetConvId = m.conversationId;
        taskCode = m.taskPayload.taskCode;
        const progress =
          newStatus === 'completed'
            ? 100
            : newStatus === 'in_progress'
            ? 60
            : newStatus === 'accepted'
            ? 25
            : m.taskPayload.progressPercent;
        return {
          ...m,
          taskPayload: {
            ...m.taskPayload,
            status: newStatus,
            progressPercent: progress
          }
        };
      }
      return m;
    });
    this.save(STORAGE_KEYS.MESSAGES, this.messages);

    if (targetConvId) {
      this.sendMessage(
        {
          conversationId: targetConvId,
          senderId: 'system',
          senderName: 'Task Engine',
          senderRole: 'System',
          senderAvatarInitials: 'TSK',
          contentType: 'system_event',
          content: `Task ${taskCode} status updated to ${newStatus.toUpperCase()} by ${actor?.fullName || 'User'}`,
          priority: 'normal'
        },
        actor
      );
    }
  }

  public updateApprovalStatusInMessage(
    messageId: string,
    decision: 'approved' | 'rejected' | 'revision_requested',
    actor: SecurityUser | null
  ): void {
    let targetConvId = '';
    let refCode = '';
    this.messages = this.messages.map(m => {
      if (m.id === messageId && m.approvalPayload) {
        targetConvId = m.conversationId;
        refCode = m.approvalPayload.referenceCode;
        return {
          ...m,
          approvalPayload: {
            ...m.approvalPayload,
            status: decision,
            decidedBy: actor?.fullName || 'Administrator',
            decidedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        };
      }
      return m;
    });
    this.save(STORAGE_KEYS.MESSAGES, this.messages);

    if (targetConvId) {
      this.sendMessage(
        {
          conversationId: targetConvId,
          senderId: 'system',
          senderName: 'Approval Workflow',
          senderRole: 'System',
          senderAvatarInitials: 'APR',
          contentType: 'system_event',
          content: `Request ${refCode} marked as ${decision.replace('_', ' ').toUpperCase()} by ${actor?.fullName || 'Approver'}`,
          priority: 'normal'
        },
        actor
      );
    }
  }

  public toggleMessagePin(messageId: string): void {
    this.messages = this.messages.map(m =>
      m.id === messageId ? { ...m, isPinned: !m.isPinned } : m
    );
    this.save(STORAGE_KEYS.MESSAGES, this.messages);
  }

  public toggleMessageBookmark(messageId: string): void {
    this.messages = this.messages.map(m =>
      m.id === messageId ? { ...m, isBookmarked: !m.isBookmarked } : m
    );
    this.save(STORAGE_KEYS.MESSAGES, this.messages);
  }

  public acknowledgeMessage(messageId: string, userId: string): void {
    this.messages = this.messages.map(m => {
      if (m.id === messageId) {
        const list = m.acknowledgedByUserIds || [];
        if (!list.includes(userId)) {
          return { ...m, acknowledgedByUserIds: [...list, userId] };
        }
      }
      return m;
    });
    this.save(STORAGE_KEYS.MESSAGES, this.messages);
  }

  public toggleReaction(messageId: string, emoji: string, user: SecurityUser): void {
    this.messages = this.messages.map(m => {
      if (m.id !== messageId) return m;
      const existing = m.reactions || [];
      const found = existing.find(r => r.emoji === emoji);
      let nextReactions: MessageReaction[];
      if (found) {
        if (found.userIds.includes(user.id)) {
          const nextIds = found.userIds.filter(id => id !== user.id);
          const nextNames = found.userNames.filter(n => n !== user.fullName);
          nextReactions =
            nextIds.length === 0
              ? existing.filter(r => r.emoji !== emoji)
              : existing.map(r => (r.emoji === emoji ? { ...r, userIds: nextIds, userNames: nextNames } : r));
        } else {
          nextReactions = existing.map(r =>
            r.emoji === emoji
              ? { ...r, userIds: [...r.userIds, user.id], userNames: [...r.userNames, user.fullName] }
              : r
          );
        }
      } else {
        nextReactions = [...existing, { emoji, userIds: [user.id], userNames: [user.fullName] }];
      }
      return { ...m, reactions: nextReactions };
    });
    this.save(STORAGE_KEYS.MESSAGES, this.messages);
  }

  public deleteMessage(messageId: string, actor: SecurityUser | null): void {
    const target = this.messages.find(m => m.id === messageId);
    this.messages = this.messages.filter(m => m.id !== messageId);
    this.save(STORAGE_KEYS.MESSAGES, this.messages);
    if (target) {
      this.recordAudit(actor, 'MESSAGE_DELETED', target.conversationId, 'Conversation', `Deleted message ${messageId}`);
    }
  }

  private recordAudit(
    actor: SecurityUser | null,
    action: string,
    conversationId: string,
    conversationTitle: string,
    details: string
  ): void {
    const entry: MessagingAuditEntry = {
      id: `maud-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      timestamp: new Date().toISOString(),
      actorId: actor?.id || 'system',
      actorName: actor?.fullName || 'System Engine',
      actorRole: actor?.roleName || 'System',
      action,
      conversationId,
      conversationTitle,
      details
    };
    this.auditLogs = [entry, ...this.auditLogs.slice(0, 199)];
    this.save(STORAGE_KEYS.AUDIT, this.auditLogs);
  }
}

export const centralMessagingService = new CentralMessagingService();
