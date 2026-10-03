import { securityService } from './securityService';
import { numberingService } from './numberingService';
import { centralMessagingService, SYSTEM_PORTAL_DIRECTORY } from './centralMessagingService';
import {
  getAccessToken,
  getConnectedGoogleUser,
  sendGmailViaApi
} from './googleWorkspaceAuth';
import { SecurityUser } from '../types/security';

export type SystemEmailEventType =
  | 'USER_REGISTRATION'
  | 'ACCOUNT_ACTIVATION'
  | 'USER_LOGIN'
  | 'PASSWORD_RESET_REQUEST'
  | 'PASSWORD_CHANGED'
  | 'OTP_REQUESTED'
  | 'RECOVERY_CODES_ISSUED'
  | 'SUSPICIOUS_LOGIN_ALERT'
  | 'ACCOUNT_STATUS_CHANGED'
  | 'ROLE_PERMISSION_CHANGED'
  | 'ACCESS_REQUEST_DECISION'
  | 'PROJECT_ASSIGNED'
  | 'PROJECT_STATUS_CHANGED'
  | 'TASK_ASSIGNED'
  | 'TASK_REMINDER'
  | 'INSTRUCTION_ISSUED'
  | 'APPROVAL_REQUESTED'
  | 'NCR_CREATED'
  | 'HSE_ALERT'
  | 'INSPECTION_REQUESTED'
  | 'DOCUMENT_APPROVED'
  | 'INVOICE_ISSUED'
  | 'PAYMENT_RECEIVED'
  | 'QUOTATION_SENT'
  | 'RFQ_INVITATION'
  | 'PURCHASE_ORDER_ISSUED'
  | 'CUSTOMER_NOTIFICATION'
  | 'SUPPLIER_NOTIFICATION'
  | 'SYSTEM_ANNOUNCEMENT'
  | 'MAINTENANCE_EMERGENCY'
  | 'CUSTOM_EVENT';

export type EmailTemplateCategory =
  | 'Security & Identity'
  | 'Tasks, Instructions & Approvals'
  | 'Projects & Engineering'
  | 'Quality (QA/QC) & HSE'
  | 'Commercial, Finance & Invoicing'
  | 'Procurement, Customer & Supplier'
  | 'System Announcements & Emergency';

export type NotificationChannelType = 'email' | 'in_app' | 'message_panel';

export interface EmailTemplateVersion {
  version: number;
  updatedAt: string;
  updatedBy: string;
  subject: string;
  htmlBody: string;
  plainTextBody: string;
  changeNote: string;
}

export interface EmailTemplate {
  id: string;
  templateCode: string;
  eventType: SystemEmailEventType;
  name: string;
  category: EmailTemplateCategory;
  description: string;
  subject: string;
  htmlBody: string;
  plainTextBody: string;
  availableVariables: string[];
  defaultPriority: 'low' | 'normal' | 'high' | 'critical';
  isMandatorySecurity: boolean;
  isActive: boolean;
  isSystemDefault: boolean;
  defaultChannels: NotificationChannelType[];
  defaultRecipientRoles: string[];
  defaultRecipientDepartments: string[];
  ccRoles: string[];
  bccRoles: string[];
  defaultPortalId?: string;
  version: number;
  versionHistory: EmailTemplateVersion[];
  updatedAt: string;
  updatedBy: string;
}

export interface EmailAttachmentMeta {
  name: string;
  mimeType: string;
  sizeBytes: number;
  url?: string;
}

export interface EmailDeliveryTrace {
  id: string;
  traceCode: string;
  idempotencyKey: string;
  eventType: SystemEmailEventType;
  eventLabel: string;
  triggeringPortal: string;
  triggeringAction: string;
  senderIdentity: {
    userId: string;
    name: string;
    email: string;
    role: string;
  };
  recipients: {
    to: string[];
    cc: string[];
    bcc: string[];
    resolvedRuleSummary: string;
  };
  templateId: string;
  templateCode: string;
  templateName: string;
  templateVersion: number;
  subjectRendered: string;
  htmlRendered: string;
  plainTextRendered: string;
  authorizedDeepLink?: {
    url: string;
    portalId: string;
    portalName: string;
    recordId?: string;
    requiredPermission?: string;
  };
  attachments: EmailAttachmentMeta[];
  channelsDispatched: NotificationChannelType[];
  priority: 'low' | 'normal' | 'high' | 'critical';
  isMandatorySecurity: boolean;
  status:
    | 'SENT_VIA_GMAIL'
    | 'QUEUED_FOR_GMAIL'
    | 'SCHEDULED'
    | 'FAILED_RETRYABLE'
    | 'SUPPRESSED_BY_PREFERENCE';
  deliveryAttempts: number;
  maxRetries: number;
  gmailMessageId?: string;
  gmailThreadId?: string;
  lastError?: string;
  scheduledFor?: string;
  recurringPattern?: 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
  sanitizedVariables: Record<string, string>;
  createdAt: string;
  lastAttemptAt: string;
}

export interface UserEmailNotificationPreferences {
  userId: string;
  emailEnabled: boolean;
  inAppEnabled: boolean;
  messagePanelEnabled: boolean;
  categories: {
    'Security & Identity': boolean; // Always locked to true (mandatory)
    'Tasks, Instructions & Approvals': boolean;
    'Projects & Engineering': boolean;
    'Quality (QA/QC) & HSE': boolean;
    'Commercial, Finance & Invoicing': boolean;
    'Procurement, Customer & Supplier': boolean;
    'System Announcements & Emergency': boolean;
  };
  digestFrequency: 'IMMEDIATE' | 'HOURLY_DIGEST' | 'DAILY_SUMMARY';
  updatedAt: string;
}

export interface GmailServiceConfiguration {
  senderDisplayName: string;
  senderReplyToEmail: string;
  companyBrandColor: string;
  companyHeaderTitle: string;
  companyFooterAddress: string;
  enforceRateLimitPerMinute: number;
  maxRetryAttempts: number;
  enableAutoQueueFlushOnAuth: boolean;
  includeAuthorizedDeepLinks: boolean;
}

const STORAGE_KEYS = {
  TEMPLATES: 'innovista_central_email_templates_v1',
  DELIVERY_TRACES: 'innovista_central_email_traces_v1',
  USER_PREFS: 'innovista_central_email_user_prefs_v1',
  CONFIG: 'innovista_central_gmail_config_v1'
};

export const AVAILABLE_TEMPLATE_VARIABLES = [
  '{{user_name}}',
  '{{user_email}}',
  '{{role_name}}',
  '{{department}}',
  '{{project_code}}',
  '{{project_name}}',
  '{{task_code}}',
  '{{task_title}}',
  '{{date}}',
  '{{amount}}',
  '{{status}}',
  '{{portal_name}}',
  '{{deep_link}}',
  '{{otp_code}}',
  '{{company_name}}',
  '{{reference_no}}',
  '{{actor_name}}',
  '{{summary}}'
];

const SENSITIVE_KEYS = [
  'otp',
  'otp_code',
  'password',
  'new_password',
  'recovery_code',
  'recovery_codes',
  'token',
  'access_token',
  'secret',
  'api_key'
];

function wrapBrandedHtml(
  heading: string,
  badgeText: string,
  badgeColor: string,
  innerHtml: string,
  ctaLabel = 'Open Authorized Portal Record'
): string {
  return `<div style="font-family:'Plus Jakarta Sans',Inter,Arial,sans-serif;max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
  <div style="background:#0f172a;padding:20px 26px;display:flex;align-items:center;justify-content:space-between;">
    <div>
      <div style="color:#f97316;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">{{company_name}}</div>
      <div style="color:#ffffff;font-size:17px;font-weight:700;margin-top:3px;">${heading}</div>
    </div>
    <span style="background:${badgeColor};color:#ffffff;padding:4px 10px;border-radius:999px;font-size:11px;font-weight:700;">${badgeText}</span>
  </div>
  <div style="padding:26px;color:#1e293b;font-size:14px;line-height:1.6;">
    ${innerHtml}
    <div style="margin-top:24px;padding-top:18px;border-top:1px solid #e2e8f0;">
      <a href="{{deep_link}}" style="display:inline-block;background:#f97316;color:#ffffff;text-decoration:none;padding:11px 20px;border-radius:10px;font-weight:700;font-size:13px;">${ctaLabel} →</a>
    </div>
  </div>
  <div style="background:#f8fafc;padding:14px 26px;border-top:1px solid #e2e8f0;font-size:11px;color:#64748b;">
    Reference: <strong>{{reference_no}}</strong> · Portal: <strong>{{portal_name}}</strong> · Date: {{date}}<br/>
    Protected by Innovista Central RBAC &amp; Identity Engine. Links require active session &amp; role authorization.
  </div>
</div>`;
}

export const SEED_EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'etpl-001',
    templateCode: 'ETPL-2026-101',
    eventType: 'USER_REGISTRATION',
    name: 'New User Registration & Onboarding',
    category: 'Security & Identity',
    description: 'Sent automatically when a new user account is registered or provisioned.',
    subject: '[{{company_name}}] Welcome {{user_name}} — Account Provisioned ({{role_name}})',
    htmlBody: wrapBrandedHtml(
      'Welcome to Innovista Control Center',
      'IDENTITY',
      '#f97316',
      `<p>Hello <strong>{{user_name}}</strong>,</p>
       <p>Your enterprise account has been registered under <strong>{{department}}</strong> with the role <strong>{{role_name}}</strong>.</p>
       <p><strong>Account Summary:</strong><br/>Email: {{user_email}}<br/>Status: {{status}}<br/>Provisioned By: {{actor_name}}</p>
       <p>{{summary}}</p>`,
      'Sign In to Control Center'
    ),
    plainTextBody:
      'Hello {{user_name}},\n\nYour enterprise account has been registered under {{department}} with role {{role_name}}.\nStatus: {{status}}\nOpen Control Center: {{deep_link}}',
    availableVariables: AVAILABLE_TEMPLATE_VARIABLES,
    defaultPriority: 'high',
    isMandatorySecurity: true,
    isActive: true,
    isSystemDefault: true,
    defaultChannels: ['email', 'in_app'],
    defaultRecipientRoles: [],
    defaultRecipientDepartments: [],
    ccRoles: ['SUPER_ADMIN'],
    bccRoles: [],
    defaultPortalId: 'system-administration',
    version: 1,
    versionHistory: [],
    updatedAt: '2026-09-26T08:00:00Z',
    updatedBy: 'System Bootstrap'
  },
  {
    id: 'etpl-002',
    templateCode: 'ETPL-2026-102',
    eventType: 'ACCOUNT_ACTIVATION',
    name: 'Account Activation & Scope Clearance',
    category: 'Security & Identity',
    description: 'Sent when an administrator activates an account and grants portal/project clearance.',
    subject: '[{{company_name}}] Account Activated — {{user_name}} ({{role_name}})',
    htmlBody: wrapBrandedHtml(
      'Your Account is Now Active',
      'ACTIVATED',
      '#10b981',
      `<p>Hello <strong>{{user_name}}</strong>,</p>
       <p>Your account status is now <strong>{{status}}</strong> and your RBAC role <strong>{{role_name}}</strong> is active.</p>
       <p>{{summary}}</p>`,
      'Access Authorized Portal'
    ),
    plainTextBody:
      'Hello {{user_name}},\nYour account is now Active with role {{role_name}}.\n{{summary}}\nAccess Portal: {{deep_link}}',
    availableVariables: AVAILABLE_TEMPLATE_VARIABLES,
    defaultPriority: 'high',
    isMandatorySecurity: true,
    isActive: true,
    isSystemDefault: true,
    defaultChannels: ['email', 'in_app', 'message_panel'],
    defaultRecipientRoles: [],
    defaultRecipientDepartments: [],
    ccRoles: [],
    bccRoles: [],
    defaultPortalId: 'company-control-center',
    version: 1,
    versionHistory: [],
    updatedAt: '2026-09-26T08:00:00Z',
    updatedBy: 'System Bootstrap'
  },
  {
    id: 'etpl-003',
    templateCode: 'ETPL-2026-103',
    eventType: 'USER_LOGIN',
    name: 'Login Security Notification',
    category: 'Security & Identity',
    description: 'Security notification dispatched upon user authentication.',
    subject: '[Security Alert] New Sign-In Detected for {{user_name}}',
    htmlBody: wrapBrandedHtml(
      'New Sign-In to Your Account',
      'SECURITY',
      '#3b82f6',
      `<p>Hello <strong>{{user_name}}</strong>,</p>
       <p>A new sign-in was recorded for your account (<strong>{{user_email}}</strong>) as <strong>{{role_name}}</strong> on {{date}}.</p>
       <p>{{summary}}</p>`,
      'Review Active Sessions'
    ),
    plainTextBody:
      'Hello {{user_name}},\nA new sign-in was recorded for {{user_email}} ({{role_name}}) on {{date}}.\n{{summary}}\nReview: {{deep_link}}',
    availableVariables: AVAILABLE_TEMPLATE_VARIABLES,
    defaultPriority: 'normal',
    isMandatorySecurity: true,
    isActive: true,
    isSystemDefault: true,
    defaultChannels: ['email', 'in_app'],
    defaultRecipientRoles: [],
    defaultRecipientDepartments: [],
    ccRoles: [],
    bccRoles: [],
    defaultPortalId: 'system-administration',
    version: 1,
    versionHistory: [],
    updatedAt: '2026-09-26T08:00:00Z',
    updatedBy: 'System Bootstrap'
  },
  {
    id: 'etpl-004',
    templateCode: 'ETPL-2026-104',
    eventType: 'PASSWORD_RESET_REQUEST',
    name: 'Password Reset Request',
    category: 'Security & Identity',
    description: 'Triggered when a user requests a password recovery link or reset token.',
    subject: '[{{company_name}}] Password Reset Instructions for {{user_name}}',
    htmlBody: wrapBrandedHtml(
      'Password Reset Request',
      'RECOVERY',
      '#f59e0b',
      `<p>Hello <strong>{{user_name}}</strong>,</p>
       <p>We received a request to reset the password for your account (<strong>{{user_email}}</strong>).</p>
       <p>Verification / One-Time Reset Code: <strong style="font-family:monospace;font-size:16px;background:#f1f5f9;padding:4px 8px;border-radius:6px;">{{otp_code}}</strong></p>
       <p>If you did not initiate this request, please contact your System Administrator immediately.</p>`,
      'Complete Password Reset'
    ),
    plainTextBody:
      'Hello {{user_name}},\nPassword reset requested for {{user_email}}.\nVerification Code: {{otp_code}}\nReset link: {{deep_link}}',
    availableVariables: AVAILABLE_TEMPLATE_VARIABLES,
    defaultPriority: 'critical',
    isMandatorySecurity: true,
    isActive: true,
    isSystemDefault: true,
    defaultChannels: ['email'],
    defaultRecipientRoles: [],
    defaultRecipientDepartments: [],
    ccRoles: [],
    bccRoles: [],
    defaultPortalId: 'system-administration',
    version: 1,
    versionHistory: [],
    updatedAt: '2026-09-26T08:00:00Z',
    updatedBy: 'System Bootstrap'
  },
  {
    id: 'etpl-005',
    templateCode: 'ETPL-2026-105',
    eventType: 'PASSWORD_CHANGED',
    name: 'Password Changed Confirmation',
    category: 'Security & Identity',
    description: 'Mandatory security confirmation sent whenever a user password is changed.',
    subject: '[Security Confirmation] Your Password Was Changed',
    htmlBody: wrapBrandedHtml(
      'Password Changed Successfully',
      'SECURITY',
      '#10b981',
      `<p>Hello <strong>{{user_name}}</strong>,</p>
       <p>Your account password was changed on <strong>{{date}}</strong> by <strong>{{actor_name}}</strong>.</p>
       <p>{{summary}}</p>`,
      'Open Security Settings'
    ),
    plainTextBody:
      'Hello {{user_name}},\nYour account password was changed on {{date}}.\n{{summary}}\nSecurity Portal: {{deep_link}}',
    availableVariables: AVAILABLE_TEMPLATE_VARIABLES,
    defaultPriority: 'high',
    isMandatorySecurity: true,
    isActive: true,
    isSystemDefault: true,
    defaultChannels: ['email', 'in_app'],
    defaultRecipientRoles: [],
    defaultRecipientDepartments: [],
    ccRoles: [],
    bccRoles: [],
    defaultPortalId: 'system-administration',
    version: 1,
    versionHistory: [],
    updatedAt: '2026-09-26T08:00:00Z',
    updatedBy: 'System Bootstrap'
  },
  {
    id: 'etpl-006',
    templateCode: 'ETPL-2026-106',
    eventType: 'OTP_REQUESTED',
    name: 'Email OTP / 2FA Login Verification Code',
    category: 'Security & Identity',
    description: 'One-time verification code for 2FA login and sensitive action confirmation.',
    subject: '[{{company_name}}] Your Verification Code ({{reference_no}})',
    htmlBody: wrapBrandedHtml(
      'One-Time Verification Code (OTP)',
      '2FA OTP',
      '#dc2626',
      `<p>Hello <strong>{{user_name}}</strong>,</p>
       <p>Use the following one-time verification code to complete your sign-in or authorization:</p>
       <div style="margin:18px 0;padding:16px;background:#f8fafc;border:1px dashed #94a3b8;border-radius:12px;text-align:center;">
         <span style="font-family:monospace;font-size:26px;font-weight:800;letter-spacing:0.3em;color:#0f172a;">{{otp_code}}</span>
       </div>
       <p style="font-size:12px;color:#64748b;">This code expires in 10 minutes and can only be used once. Never share this code with anyone.</p>`,
      'Return to Verification Screen'
    ),
    plainTextBody:
      'Hello {{user_name}},\nYour one-time verification code is: {{otp_code}}\nThis code expires in 10 minutes and is valid for one use only.',
    availableVariables: AVAILABLE_TEMPLATE_VARIABLES,
    defaultPriority: 'critical',
    isMandatorySecurity: true,
    isActive: true,
    isSystemDefault: true,
    defaultChannels: ['email'],
    defaultRecipientRoles: [],
    defaultRecipientDepartments: [],
    ccRoles: [],
    bccRoles: [],
    defaultPortalId: 'system-administration',
    version: 1,
    versionHistory: [],
    updatedAt: '2026-09-26T08:00:00Z',
    updatedBy: 'System Bootstrap'
  },
  {
    id: 'etpl-007',
    templateCode: 'ETPL-2026-107',
    eventType: 'SUSPICIOUS_LOGIN_ALERT',
    name: 'Suspicious Login / Account Lockout Alert',
    category: 'Security & Identity',
    description: 'Triggered when repeated failed login attempts or anomalous access occurs.',
    subject: '[CRITICAL SECURITY] Account Lockout / Suspicious Login — {{user_name}}',
    htmlBody: wrapBrandedHtml(
      'Suspicious Login / Lockout Alert',
      'CRITICAL',
      '#dc2626',
      `<p>Attention <strong>{{user_name}}</strong> &amp; Security Administrators,</p>
       <p>Multiple failed authentication attempts or a security policy lockout was triggered for account <strong>{{user_email}}</strong>.</p>
       <p>Current Status: <strong>{{status}}</strong><br/>Details: {{summary}}</p>`,
      'Inspect Security Audit Ledger'
    ),
    plainTextBody:
      'CRITICAL SECURITY ALERT: Account lockout or suspicious login detected for {{user_name}} ({{user_email}}).\nStatus: {{status}}\nDetails: {{summary}}\nInspect: {{deep_link}}',
    availableVariables: AVAILABLE_TEMPLATE_VARIABLES,
    defaultPriority: 'critical',
    isMandatorySecurity: true,
    isActive: true,
    isSystemDefault: true,
    defaultChannels: ['email', 'in_app', 'message_panel'],
    defaultRecipientRoles: ['SUPER_ADMIN', 'SYSTEM_ADMIN'],
    defaultRecipientDepartments: [],
    ccRoles: [],
    bccRoles: [],
    defaultPortalId: 'system-administration',
    version: 1,
    versionHistory: [],
    updatedAt: '2026-09-26T08:00:00Z',
    updatedBy: 'System Bootstrap'
  },
  {
    id: 'etpl-008',
    templateCode: 'ETPL-2026-108',
    eventType: 'ROLE_PERMISSION_CHANGED',
    name: 'Role, Scope & Permission Change Notice',
    category: 'Security & Identity',
    description: 'Dispatched when a user role, permission template, or portal scope is updated.',
    subject: '[{{company_name}}] Access Scope & Role Updated — {{role_name}}',
    htmlBody: wrapBrandedHtml(
      'Role & Permission Scope Updated',
      'RBAC UPDATE',
      '#6366f1',
      `<p>Hello <strong>{{user_name}}</strong>,</p>
       <p>Your role or permission assignments have been updated by <strong>{{actor_name}}</strong>.</p>
       <p><strong>Updated Role:</strong> {{role_name}}<br/><strong>Department:</strong> {{department}}<br/><strong>Summary:</strong> {{summary}}</p>`,
      'View My Authorized Portals'
    ),
    plainTextBody:
      'Hello {{user_name}},\nYour RBAC role/permissions have been updated by {{actor_name}}.\nRole: {{role_name}}\nSummary: {{summary}}\nView: {{deep_link}}',
    availableVariables: AVAILABLE_TEMPLATE_VARIABLES,
    defaultPriority: 'high',
    isMandatorySecurity: true,
    isActive: true,
    isSystemDefault: true,
    defaultChannels: ['email', 'in_app', 'message_panel'],
    defaultRecipientRoles: [],
    defaultRecipientDepartments: [],
    ccRoles: [],
    bccRoles: [],
    defaultPortalId: 'system-administration',
    version: 1,
    versionHistory: [],
    updatedAt: '2026-09-26T08:00:00Z',
    updatedBy: 'System Bootstrap'
  },
  {
    id: 'etpl-009',
    templateCode: 'ETPL-2026-109',
    eventType: 'ACCESS_REQUEST_DECISION',
    name: 'Access Request Approval / Rejection',
    category: 'Security & Identity',
    description: 'Sent when an access or role elevation request is approved or rejected.',
    subject: '[{{company_name}}] Access Request {{status}} — {{reference_no}}',
    htmlBody: wrapBrandedHtml(
      'Access Request Decision',
      '{{status}}',
      '#0ea5e9',
      `<p>Hello <strong>{{user_name}}</strong>,</p>
       <p>Your access request (<strong>{{reference_no}}</strong>) has been marked as <strong>{{status}}</strong> by <strong>{{actor_name}}</strong>.</p>
       <p>{{summary}}</p>`,
      'Open Access Control Center'
    ),
    plainTextBody:
      'Hello {{user_name}},\nYour access request {{reference_no}} is {{status}}.\n{{summary}}\nOpen: {{deep_link}}',
    availableVariables: AVAILABLE_TEMPLATE_VARIABLES,
    defaultPriority: 'high',
    isMandatorySecurity: true,
    isActive: true,
    isSystemDefault: true,
    defaultChannels: ['email', 'in_app', 'message_panel'],
    defaultRecipientRoles: ['SUPER_ADMIN'],
    defaultRecipientDepartments: [],
    ccRoles: [],
    bccRoles: [],
    defaultPortalId: 'system-administration',
    version: 1,
    versionHistory: [],
    updatedAt: '2026-09-26T08:00:00Z',
    updatedBy: 'System Bootstrap'
  },
  {
    id: 'etpl-010',
    templateCode: 'ETPL-2026-110',
    eventType: 'TASK_ASSIGNED',
    name: 'Task Assignment & Execution Notice',
    category: 'Tasks, Instructions & Approvals',
    description: 'Dispatched when a task is assigned or converted from a message.',
    subject: '[Task {{task_code}}] {{task_title}} — Assigned to {{user_name}}',
    htmlBody: wrapBrandedHtml(
      'New Task Assigned to You',
      'TASK',
      '#f97316',
      `<p>Hello <strong>{{user_name}}</strong>,</p>
       <p><strong>{{actor_name}}</strong> has assigned a task to you in <strong>{{portal_name}}</strong>:</p>
       <div style="background:#f8fafc;border-left:4px solid #f97316;padding:12px 16px;border-radius:8px;margin:14px 0;">
         <div><strong>Task ID:</strong> {{task_code}}</div>
         <div><strong>Title:</strong> {{task_title}}</div>
         <div><strong>Project:</strong> {{project_name}} ({{project_code}})</div>
         <div><strong>Due / Status:</strong> {{date}} · {{status}}</div>
       </div>
       <p>{{summary}}</p>`,
      'Open Task in Authorized Portal'
    ),
    plainTextBody:
      'Hello {{user_name}},\nTask {{task_code}}: {{task_title}} has been assigned to you by {{actor_name}}.\nProject: {{project_name}}\nSummary: {{summary}}\nOpen Task: {{deep_link}}',
    availableVariables: AVAILABLE_TEMPLATE_VARIABLES,
    defaultPriority: 'high',
    isMandatorySecurity: false,
    isActive: true,
    isSystemDefault: true,
    defaultChannels: ['email', 'in_app', 'message_panel'],
    defaultRecipientRoles: [],
    defaultRecipientDepartments: [],
    ccRoles: [],
    bccRoles: [],
    defaultPortalId: 'project-management',
    version: 1,
    versionHistory: [],
    updatedAt: '2026-09-26T08:00:00Z',
    updatedBy: 'System Bootstrap'
  },
  {
    id: 'etpl-011',
    templateCode: 'ETPL-2026-111',
    eventType: 'INSTRUCTION_ISSUED',
    name: 'Official Instruction & Site/Factory Directive',
    category: 'Tasks, Instructions & Approvals',
    description: 'Sent when an official engineering, factory, or site instruction is issued.',
    subject: '[OFFICIAL INSTRUCTION {{reference_no}}] {{task_title}}',
    htmlBody: wrapBrandedHtml(
      'Official Operational Instruction',
      'INSTRUCTION',
      '#dc2626',
      `<p>Attention <strong>{{user_name}}</strong> ({{role_name}}),</p>
       <p>An official instruction (<strong>{{reference_no}}</strong>) has been issued by <strong>{{actor_name}}</strong> for project <strong>{{project_name}}</strong>.</p>
       <p><strong>Directive:</strong> {{summary}}</p>`,
      'Acknowledge Instruction in Portal'
    ),
    plainTextBody:
      'OFFICIAL INSTRUCTION {{reference_no}} issued by {{actor_name}} for {{project_name}}.\nDirective: {{summary}}\nAcknowledge: {{deep_link}}',
    availableVariables: AVAILABLE_TEMPLATE_VARIABLES,
    defaultPriority: 'critical',
    isMandatorySecurity: false,
    isActive: true,
    isSystemDefault: true,
    defaultChannels: ['email', 'in_app', 'message_panel'],
    defaultRecipientRoles: [],
    defaultRecipientDepartments: [],
    ccRoles: [],
    bccRoles: [],
    defaultPortalId: 'factory-workshop-management',
    version: 1,
    versionHistory: [],
    updatedAt: '2026-09-26T08:00:00Z',
    updatedBy: 'System Bootstrap'
  },
  {
    id: 'etpl-012',
    templateCode: 'ETPL-2026-112',
    eventType: 'APPROVAL_REQUESTED',
    name: 'Workflow Sign-Off & Approval Request',
    category: 'Tasks, Instructions & Approvals',
    description: 'Sent to approvers when a document, variation, PO, or gate requires sign-off.',
    subject: '[Approval Required: {{reference_no}}] {{task_title}} ({{project_code}})',
    htmlBody: wrapBrandedHtml(
      'Workflow Approval Required',
      'APPROVAL',
      '#8b5cf6',
      `<p>Hello <strong>{{user_name}}</strong>,</p>
       <p><strong>{{actor_name}}</strong> has requested your formal approval for <strong>{{task_title}}</strong> (Ref: <strong>{{reference_no}}</strong>).</p>
       <p><strong>Project:</strong> {{project_name}} ({{project_code}})<br/><strong>Value / Impact:</strong> {{amount}}<br/><strong>Details:</strong> {{summary}}</p>`,
      'Review & Approve / Reject'
    ),
    plainTextBody:
      'Approval Required ({{reference_no}}): {{task_title}} requested by {{actor_name}}.\nProject: {{project_name}}\nValue: {{amount}}\nReview: {{deep_link}}',
    availableVariables: AVAILABLE_TEMPLATE_VARIABLES,
    defaultPriority: 'high',
    isMandatorySecurity: false,
    isActive: true,
    isSystemDefault: true,
    defaultChannels: ['email', 'in_app', 'message_panel'],
    defaultRecipientRoles: [],
    defaultRecipientDepartments: [],
    ccRoles: [],
    bccRoles: [],
    defaultPortalId: 'project-management',
    version: 1,
    versionHistory: [],
    updatedAt: '2026-09-26T08:00:00Z',
    updatedBy: 'System Bootstrap'
  },
  {
    id: 'etpl-013',
    templateCode: 'ETPL-2026-113',
    eventType: 'PROJECT_ASSIGNED',
    name: 'Project Assignment & Milestone Notification',
    category: 'Projects & Engineering',
    description: 'Sent when a user or team is assigned to a project or a milestone updates.',
    subject: '[Project {{project_code}}] {{project_name}} — {{status}}',
    htmlBody: wrapBrandedHtml(
      'Project Assignment & Milestone Notice',
      'PROJECT',
      '#2563eb',
      `<p>Hello <strong>{{user_name}}</strong>,</p>
       <p>Project <strong>{{project_name}} ({{project_code}})</strong> has been updated by <strong>{{actor_name}}</strong>.</p>
       <p><strong>Current Status:</strong> {{status}}<br/><strong>Summary:</strong> {{summary}}</p>`,
      'Open Project Control Portal'
    ),
    plainTextBody:
      'Project {{project_name}} ({{project_code}}) status: {{status}}.\nSummary: {{summary}}\nOpen Project: {{deep_link}}',
    availableVariables: AVAILABLE_TEMPLATE_VARIABLES,
    defaultPriority: 'normal',
    isMandatorySecurity: false,
    isActive: true,
    isSystemDefault: true,
    defaultChannels: ['email', 'in_app', 'message_panel'],
    defaultRecipientRoles: ['PROJECT_MANAGER'],
    defaultRecipientDepartments: ['OPERATIONS'],
    ccRoles: [],
    bccRoles: [],
    defaultPortalId: 'project-management',
    version: 1,
    versionHistory: [],
    updatedAt: '2026-09-26T08:00:00Z',
    updatedBy: 'System Bootstrap'
  },
  {
    id: 'etpl-014',
    templateCode: 'ETPL-2026-114',
    eventType: 'NCR_CREATED',
    name: 'Quality Non-Conformance Report (NCR) Alert',
    category: 'Quality (QA/QC) & HSE',
    description: 'Dispatched immediately when a QA/QC Non-Conformance Report or hold point is raised.',
    subject: '[QA/QC NCR {{reference_no}}] Non-Conformance Raised on {{project_code}}',
    htmlBody: wrapBrandedHtml(
      'Quality Non-Conformance Report (NCR)',
      'QA/QC HOLD',
      '#e11d48',
      `<p>Attention Quality &amp; Production Team,</p>
       <p>An NCR (<strong>{{reference_no}}</strong>) has been logged by <strong>{{actor_name}}</strong> on project <strong>{{project_name}} ({{project_code}})</strong>.</p>
       <p><strong>Status:</strong> {{status}}<br/><strong>Inspection Findings:</strong> {{summary}}</p>`,
      'Open QA/QC Inspection Portal'
    ),
    plainTextBody:
      'QA/QC NCR {{reference_no}} raised on {{project_name}} ({{project_code}}) by {{actor_name}}.\nFindings: {{summary}}\nOpen QA/QC Portal: {{deep_link}}',
    availableVariables: AVAILABLE_TEMPLATE_VARIABLES,
    defaultPriority: 'critical',
    isMandatorySecurity: false,
    isActive: true,
    isSystemDefault: true,
    defaultChannels: ['email', 'in_app', 'message_panel'],
    defaultRecipientRoles: ['QUALITY_INSPECTOR', 'FACTORY_MANAGER', 'PROJECT_MANAGER'],
    defaultRecipientDepartments: ['QUALITY', 'FACTORY_PRODUCTION'],
    ccRoles: ['SUPER_ADMIN'],
    bccRoles: [],
    defaultPortalId: 'quality-assurance',
    version: 1,
    versionHistory: [],
    updatedAt: '2026-09-26T08:00:00Z',
    updatedBy: 'System Bootstrap'
  },
  {
    id: 'etpl-015',
    templateCode: 'ETPL-2026-115',
    eventType: 'HSE_ALERT',
    name: 'HSE Safety Permit (PTW) & Incident Alert',
    category: 'Quality (QA/QC) & HSE',
    description: 'Dispatched for Permit-to-Work (PTW) authorizations and site/factory safety alerts.',
    subject: '[HSE SAFETY {{reference_no}}] {{task_title}} — {{project_code}}',
    htmlBody: wrapBrandedHtml(
      'Health, Safety & Environment (HSE) Alert',
      'HSE SAFETY',
      '#d97706',
      `<p>Attention Site &amp; Factory Personnel,</p>
       <p>An HSE Safety event (<strong>{{reference_no}}</strong>) was recorded by <strong>{{actor_name}}</strong>.</p>
       <p><strong>Location / Project:</strong> {{project_name}}<br/><strong>Status:</strong> {{status}}<br/><strong>Details:</strong> {{summary}}</p>`,
      'Open Site & HSE Portal'
    ),
    plainTextBody:
      'HSE SAFETY ALERT ({{reference_no}}): {{task_title}} on {{project_name}}.\nDetails: {{summary}}\nOpen HSE Portal: {{deep_link}}',
    availableVariables: AVAILABLE_TEMPLATE_VARIABLES,
    defaultPriority: 'critical',
    isMandatorySecurity: false,
    isActive: true,
    isSystemDefault: true,
    defaultChannels: ['email', 'in_app', 'message_panel'],
    defaultRecipientRoles: [],
    defaultRecipientDepartments: ['HSE', 'OPERATIONS'],
    ccRoles: ['SUPER_ADMIN'],
    bccRoles: [],
    defaultPortalId: 'hse-safety',
    version: 1,
    versionHistory: [],
    updatedAt: '2026-09-26T08:00:00Z',
    updatedBy: 'System Bootstrap'
  },
  {
    id: 'etpl-016',
    templateCode: 'ETPL-2026-116',
    eventType: 'INVOICE_ISSUED',
    name: 'Commercial Invoice & Billing Statement',
    category: 'Commercial, Finance & Invoicing',
    description: 'Sent when an invoice, progress billing, or payment notification is issued.',
    subject: '[Invoice {{reference_no}}] {{project_name}} — Amount: {{amount}}',
    htmlBody: wrapBrandedHtml(
      'Commercial Invoice Notification',
      'FINANCE',
      '#059669',
      `<p>Dear <strong>{{user_name}}</strong>,</p>
       <p>Invoice <strong>{{reference_no}}</strong> has been issued for <strong>{{project_name}} ({{project_code}})</strong>.</p>
       <div style="background:#f8fafc;border:1px solid #e2e8f0;padding:14px;border-radius:10px;margin:14px 0;">
         <div><strong>Invoice No:</strong> {{reference_no}}</div>
         <div><strong>Amount Due:</strong> {{amount}}</div>
         <div><strong>Status / Due Date:</strong> {{status}} · {{date}}</div>
       </div>
       <p>{{summary}}</p>`,
      'View Invoice in Finance Portal'
    ),
    plainTextBody:
      'Invoice {{reference_no}} for {{project_name}} ({{project_code}}).\nAmount: {{amount}}\nStatus: {{status}}\nView Invoice: {{deep_link}}',
    availableVariables: AVAILABLE_TEMPLATE_VARIABLES,
    defaultPriority: 'high',
    isMandatorySecurity: false,
    isActive: true,
    isSystemDefault: true,
    defaultChannels: ['email', 'in_app', 'message_panel'],
    defaultRecipientRoles: ['FINANCE_MANAGER', 'ACCOUNTANT'],
    defaultRecipientDepartments: ['COMMERCIAL_ADMIN'],
    ccRoles: [],
    bccRoles: [],
    defaultPortalId: 'accounting-finance',
    version: 1,
    versionHistory: [],
    updatedAt: '2026-09-26T08:00:00Z',
    updatedBy: 'System Bootstrap'
  },
  {
    id: 'etpl-017',
    templateCode: 'ETPL-2026-117',
    eventType: 'QUOTATION_SENT',
    name: 'Commercial Quotation & BOQ Proposal',
    category: 'Commercial, Finance & Invoicing',
    description: 'Sent when a quotation or variation proposal is transmitted to a client or approver.',
    subject: '[Quotation {{reference_no}}] {{project_name}} — {{amount}}',
    htmlBody: wrapBrandedHtml(
      'Commercial Quotation & BOQ Proposal',
      'QUOTATION',
      '#f97316',
      `<p>Dear <strong>{{user_name}}</strong>,</p>
       <p>Quotation <strong>{{reference_no}}</strong> for <strong>{{project_name}}</strong> is ready for review.</p>
       <p><strong>Proposed Value:</strong> {{amount}}<br/><strong>Status:</strong> {{status}}<br/><strong>Notes:</strong> {{summary}}</p>`,
      'Open Quotation & BOQ'
    ),
    plainTextBody:
      'Quotation {{reference_no}} for {{project_name}} ({{amount}}).\nStatus: {{status}}\nSummary: {{summary}}\nOpen: {{deep_link}}',
    availableVariables: AVAILABLE_TEMPLATE_VARIABLES,
    defaultPriority: 'normal',
    isMandatorySecurity: false,
    isActive: true,
    isSystemDefault: true,
    defaultChannels: ['email', 'in_app'],
    defaultRecipientRoles: [],
    defaultRecipientDepartments: ['COMMERCIAL_ADMIN', 'ENGINEERING'],
    ccRoles: [],
    bccRoles: [],
    defaultPortalId: 'sales-crm-quotes',
    version: 1,
    versionHistory: [],
    updatedAt: '2026-09-26T08:00:00Z',
    updatedBy: 'System Bootstrap'
  },
  {
    id: 'etpl-018',
    templateCode: 'ETPL-2026-118',
    eventType: 'RFQ_INVITATION',
    name: 'Procurement RFQ & Purchase Order Notice',
    category: 'Procurement, Customer & Supplier',
    description: 'Dispatched to suppliers and procurement officers for RFQs, POs, and GRNs.',
    subject: '[Procurement {{reference_no}}] {{task_title}} — {{company_name}}',
    htmlBody: wrapBrandedHtml(
      'Procurement & Supply Chain Notice',
      'PROCUREMENT',
      '#0d9488',
      `<p>Dear <strong>{{user_name}}</strong>,</p>
       <p>A procurement event (<strong>{{reference_no}} — {{task_title}}</strong>) has been published by <strong>{{actor_name}}</strong>.</p>
       <p><strong>Project:</strong> {{project_name}}<br/><strong>Value / Package:</strong> {{amount}}<br/><strong>Details:</strong> {{summary}}</p>`,
      'Open Procurement / Supplier Portal'
    ),
    plainTextBody:
      'Procurement Notice {{reference_no}}: {{task_title}}.\nProject: {{project_name}}\nDetails: {{summary}}\nOpen Portal: {{deep_link}}',
    availableVariables: AVAILABLE_TEMPLATE_VARIABLES,
    defaultPriority: 'normal',
    isMandatorySecurity: false,
    isActive: true,
    isSystemDefault: true,
    defaultChannels: ['email', 'in_app', 'message_panel'],
    defaultRecipientRoles: ['PROCUREMENT_MANAGER', 'SUPPLIER_PORTAL_USER'],
    defaultRecipientDepartments: ['PROCUREMENT_SUPPLY_CHAIN'],
    ccRoles: [],
    bccRoles: [],
    defaultPortalId: 'procurement-supply-chain',
    version: 1,
    versionHistory: [],
    updatedAt: '2026-09-26T08:00:00Z',
    updatedBy: 'System Bootstrap'
  },
  {
    id: 'etpl-019',
    templateCode: 'ETPL-2026-119',
    eventType: 'SYSTEM_ANNOUNCEMENT',
    name: 'Official Company News & Executive Broadcast',
    category: 'System Announcements & Emergency',
    description: 'Used when administrators publish official company news or policy bulletins.',
    subject: '[Official Bulletin {{reference_no}}] {{task_title}}',
    htmlBody: wrapBrandedHtml(
      'Official News Bulletin',
      'NEWS BULLETIN',
      '#0f172a',
      `<p>Dear <strong>{{user_name}}</strong>,</p>
       <p><strong>{{actor_name}}</strong> has published an official bulletin (<strong>{{reference_no}}</strong>):</p>
       <h3 style="margin:12px 0 6px;color:#0f172a;">{{task_title}}</h3>
       <p>{{summary}}</p>`,
      'Read Full Bulletin in Notification Center'
    ),
    plainTextBody:
      'Official Bulletin {{reference_no}}: {{task_title}}\nPublished by {{actor_name}}\n\n{{summary}}\n\nRead Bulletin: {{deep_link}}',
    availableVariables: AVAILABLE_TEMPLATE_VARIABLES,
    defaultPriority: 'high',
    isMandatorySecurity: false,
    isActive: true,
    isSystemDefault: true,
    defaultChannels: ['email', 'in_app', 'message_panel'],
    defaultRecipientRoles: [],
    defaultRecipientDepartments: [],
    ccRoles: [],
    bccRoles: [],
    defaultPortalId: 'company-control-center',
    version: 1,
    versionHistory: [],
    updatedAt: '2026-09-26T08:00:00Z',
    updatedBy: 'System Bootstrap'
  },
  {
    id: 'etpl-020',
    templateCode: 'ETPL-2026-120',
    eventType: 'MAINTENANCE_EMERGENCY',
    name: 'System Emergency & Maintenance Broadcast',
    category: 'System Announcements & Emergency',
    description: 'Mandatory high-priority broadcast for emergency notices and scheduled maintenance.',
    subject: '[URGENT BROADCAST] {{task_title}} — {{company_name}}',
    htmlBody: wrapBrandedHtml(
      'Urgent System Broadcast',
      'EMERGENCY',
      '#dc2626',
      `<p>Attention All Authorized Personnel (<strong>{{user_name}}</strong>),</p>
       <p><strong>{{task_title}}</strong></p>
       <p>{{summary}}</p>`,
      'Open Control Center'
    ),
    plainTextBody:
      'URGENT SYSTEM BROADCAST: {{task_title}}\n{{summary}}\nControl Center: {{deep_link}}',
    availableVariables: AVAILABLE_TEMPLATE_VARIABLES,
    defaultPriority: 'critical',
    isMandatorySecurity: true,
    isActive: true,
    isSystemDefault: true,
    defaultChannels: ['email', 'in_app', 'message_panel'],
    defaultRecipientRoles: [],
    defaultRecipientDepartments: [],
    ccRoles: [],
    bccRoles: [],
    defaultPortalId: 'company-control-center',
    version: 1,
    versionHistory: [],
    updatedAt: '2026-09-26T08:00:00Z',
    updatedBy: 'System Bootstrap'
  }
];

const DEFAULT_GMAIL_CONFIG: GmailServiceConfiguration = {
  senderDisplayName: 'Innovista Central Communications',
  senderReplyToEmail: 'stallonboost.mkt@gmail.com',
  companyBrandColor: '#f97316',
  companyHeaderTitle: 'Innovista Precision Suite',
  companyFooterAddress: 'Colombo Central Plant & Dubai Fabrication Hub',
  enforceRateLimitPerMinute: 30,
  maxRetryAttempts: 3,
  enableAutoQueueFlushOnAuth: true,
  includeAuthorizedDeepLinks: true
};

class CentralEmailService {
  private templates: EmailTemplate[] = [];
  private traces: EmailDeliveryTrace[] = [];
  private userPrefs: Record<string, UserEmailNotificationPreferences> = {};
  private config: GmailServiceConfiguration = { ...DEFAULT_GMAIL_CONFIG };
  private listeners = new Set<() => void>();

  // In-memory secure OTP store (never persisted in plain text to logs)
  private otpStore = new Map<
    string,
    { codeHash: string; expiresAt: number; used: boolean; attemptsInWindow: number }
  >();

  constructor() {
    this.loadState();
  }

  private loadState() {
    try {
      const rawTemplates = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
      if (rawTemplates) {
        const parsed = JSON.parse(rawTemplates);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.templates = parsed;
        } else {
          this.templates = [...SEED_EMAIL_TEMPLATES];
        }
      } else {
        this.templates = [...SEED_EMAIL_TEMPLATES];
      }
    } catch {
      this.templates = [...SEED_EMAIL_TEMPLATES];
    }

    try {
      const rawTraces = localStorage.getItem(STORAGE_KEYS.DELIVERY_TRACES);
      if (rawTraces) {
        this.traces = JSON.parse(rawTraces);
      } else {
        this.traces = this.createInitialSeedTraces();
      }
    } catch {
      this.traces = this.createInitialSeedTraces();
    }

    try {
      const rawPrefs = localStorage.getItem(STORAGE_KEYS.USER_PREFS);
      if (rawPrefs) {
        this.userPrefs = JSON.parse(rawPrefs);
      }
    } catch {}

    try {
      const rawCfg = localStorage.getItem(STORAGE_KEYS.CONFIG);
      if (rawCfg) {
        this.config = { ...DEFAULT_GMAIL_CONFIG, ...JSON.parse(rawCfg) };
      }
    } catch {}
  }

  private createInitialSeedTraces(): EmailDeliveryTrace[] {
    const now = new Date().toISOString();
    return [
      {
        id: 'trc-seed-1',
        traceCode: 'EML-2026-10010',
        idempotencyKey: 'idem-seed-login-1',
        eventType: 'USER_LOGIN',
        eventLabel: 'Login Security Notification',
        triggeringPortal: 'system-administration',
        triggeringAction: 'Authentication Gateway Sign-In',
        senderIdentity: {
          userId: 'usr-admin-01',
          name: 'Innovista Security Gateway',
          email: 'stallonboost.mkt@gmail.com',
          role: 'Super Administrator'
        },
        recipients: {
          to: ['admin@innovista.com'],
          cc: [],
          bcc: [],
          resolvedRuleSummary: 'Direct Account Holder (Mandatory Security)'
        },
        templateId: 'etpl-003',
        templateCode: 'ETPL-2026-103',
        templateName: 'Login Security Notification',
        templateVersion: 1,
        subjectRendered: '[Security Alert] New Sign-In Detected for Alexander Vance',
        htmlRendered: '<p>Verified sign-in for Alexander Vance (Super Administrator).</p>',
        plainTextRendered: 'Verified sign-in for Alexander Vance (Super Administrator).',
        authorizedDeepLink: {
          url: `${window.location.origin}/?portal=system-administration&record=sess-01&verify_rbac=1`,
          portalId: 'system-administration',
          portalName: 'System Administration',
          recordId: 'sess-01',
          requiredPermission: 'security.view'
        },
        attachments: [],
        channelsDispatched: ['email', 'in_app'],
        priority: 'normal',
        isMandatorySecurity: true,
        status: 'QUEUED_FOR_GMAIL',
        deliveryAttempts: 1,
        maxRetries: 3,
        sanitizedVariables: {
          user_name: 'Alexander Vance',
          role_name: 'Super Administrator',
          otp_code: '******** [REDACTED-SECRET]'
        },
        createdAt: now,
        lastAttemptAt: now
      }
    ];
  }

  private persist() {
    try {
      localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(this.templates));
      localStorage.setItem(STORAGE_KEYS.DELIVERY_TRACES, JSON.stringify(this.traces));
      localStorage.setItem(STORAGE_KEYS.USER_PREFS, JSON.stringify(this.userPrefs));
      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(this.config));
    } catch (e) {
      console.error('Failed to persist centralEmailService state', e);
    }
    this.listeners.forEach(fn => {
      try {
        fn();
      } catch {}
    });
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  // --- CONFIGURATION ---
  public getConfiguration(): GmailServiceConfiguration {
    return { ...this.config };
  }

  public updateConfiguration(patch: Partial<GmailServiceConfiguration>): GmailServiceConfiguration {
    this.config = { ...this.config, ...patch };
    this.persist();
    return { ...this.config };
  }

  // --- TEMPLATE MANAGER (CREATE, EDIT, CLONE, VERSIONING, DELETE) ---
  public getTemplates(): EmailTemplate[] {
    return [...this.templates];
  }

  public getTemplateById(id: string): EmailTemplate | undefined {
    return this.templates.find(t => t.id === id);
  }

  public getTemplateByEvent(eventType: SystemEmailEventType): EmailTemplate {
    return (
      this.templates.find(t => t.eventType === eventType && t.isActive) ||
      this.templates[0]
    );
  }

  public createTemplate(
    payload: Omit<
      EmailTemplate,
      'id' | 'templateCode' | 'version' | 'versionHistory' | 'updatedAt' | 'isSystemDefault'
    >,
    actorName = 'Administrator'
  ): EmailTemplate {
    const now = new Date().toISOString();
    const code = numberingService.consumeNextNumber('email_template');
    const created: EmailTemplate = {
      ...payload,
      id: `etpl-${Date.now()}`,
      templateCode: code,
      isSystemDefault: false,
      version: 1,
      versionHistory: [
        {
          version: 1,
          updatedAt: now,
          updatedBy: actorName,
          subject: payload.subject,
          htmlBody: payload.htmlBody,
          plainTextBody: payload.plainTextBody,
          changeNote: 'Initial template creation'
        }
      ],
      updatedAt: now,
      updatedBy: actorName
    };
    this.templates = [created, ...this.templates];
    this.persist();
    return created;
  }

  public updateTemplate(
    id: string,
    updates: Partial<EmailTemplate>,
    changeNote = 'Updated template content & configuration',
    actorName = 'Administrator'
  ): EmailTemplate | null {
    const idx = this.templates.findIndex(t => t.id === id);
    if (idx < 0) return null;

    const current = this.templates[idx];
    const now = new Date().toISOString();
    const nextVersion = (current.version || 1) + 1;

    const historyEntry: EmailTemplateVersion = {
      version: current.version || 1,
      updatedAt: current.updatedAt,
      updatedBy: current.updatedBy,
      subject: current.subject,
      htmlBody: current.htmlBody,
      plainTextBody: current.plainTextBody,
      changeNote
    };

    const updated: EmailTemplate = {
      ...current,
      ...updates,
      version: nextVersion,
      versionHistory: [historyEntry, ...(current.versionHistory || []).slice(0, 14)],
      updatedAt: now,
      updatedBy: actorName
    };

    this.templates[idx] = updated;
    this.persist();
    return updated;
  }

  public deleteTemplate(id: string): boolean {
    const target = this.templates.find(t => t.id === id);
    if (!target || target.isSystemDefault) return false;
    this.templates = this.templates.filter(t => t.id !== id);
    this.persist();
    return true;
  }

  // --- USER NOTIFICATION PREFERENCES ---
  public getUserPreferences(userId: string): UserEmailNotificationPreferences {
    if (!this.userPrefs[userId]) {
      this.userPrefs[userId] = {
        userId,
        emailEnabled: true,
        inAppEnabled: true,
        messagePanelEnabled: true,
        categories: {
          'Security & Identity': true,
          'Tasks, Instructions & Approvals': true,
          'Projects & Engineering': true,
          'Quality (QA/QC) & HSE': true,
          'Commercial, Finance & Invoicing': true,
          'Procurement, Customer & Supplier': true,
          'System Announcements & Emergency': true
        },
        digestFrequency: 'IMMEDIATE',
        updatedAt: new Date().toISOString()
      };
    }
    // Enforce mandatory security category
    this.userPrefs[userId].categories['Security & Identity'] = true;
    return { ...this.userPrefs[userId] };
  }

  public updateUserPreferences(
    userId: string,
    patch: Partial<UserEmailNotificationPreferences>
  ): UserEmailNotificationPreferences {
    const current = this.getUserPreferences(userId);
    const updated: UserEmailNotificationPreferences = {
      ...current,
      ...patch,
      categories: {
        ...current.categories,
        ...(patch.categories || {}),
        'Security & Identity': true // Mandatory security emails can never be disabled
      },
      updatedAt: new Date().toISOString()
    };
    this.userPrefs[userId] = updated;
    this.persist();
    return updated;
  }

  // --- SECURE OTP GENERATION & VERIFICATION (NEVER LOGGED IN PLAIN TEXT) ---
  public issueSecureOtp(userEmailOrId: string): { otpPlainForEmailOnly: string; expiresAt: string } {
    const existing = this.otpStore.get(userEmailOrId);
    const now = Date.now();
    if (existing && existing.attemptsInWindow >= 5 && now < existing.expiresAt) {
      throw new Error('OTP rate limit exceeded (maximum 5 requests per 10 minutes).');
    }

    const otpPlain = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAtMs = now + 10 * 60 * 1000;
    const simpleHash = `sha256_otp_${btoa(otpPlain).replace(/=+$/, '')}`;

    this.otpStore.set(userEmailOrId, {
      codeHash: simpleHash,
      expiresAt: expiresAtMs,
      used: false,
      attemptsInWindow: (existing?.attemptsInWindow || 0) + 1
    });

    return {
      otpPlainForEmailOnly: otpPlain,
      expiresAt: new Date(expiresAtMs).toISOString()
    };
  }

  public async generateAndSendOtp(
    email: string,
    purpose = 'LOGIN_2FA',
    userName = 'Authorized User'
  ): Promise<{ sent: boolean; expiresAt: string }> {
    const key = `${email.toLowerCase().trim()}_${purpose}`;
    try {
      const { otpPlainForEmailOnly, expiresAt } = this.issueSecureOtp(key);
      await this.dispatchSystemEvent({
        eventType: 'OTP_REQUESTED',
        triggeringPortal: 'Central Identity & MFA Gateway',
        triggeringAction: `OTP Verification Code Issued (${purpose})`,
        targetEmails: [email],
        variables: {
          user_name: userName,
          user_email: email,
          otp_code: otpPlainForEmailOnly,
          expiry_minutes: '10',
          summary: `One-time verification code issued for ${purpose}.`
        },
        portalId: 'company-control-center'
      });
      return { sent: true, expiresAt };
    } catch {
      return { sent: false, expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString() };
    }
  }

  public verifyOtp(
    email: string,
    purpose = 'LOGIN_2FA',
    code: string
  ): { valid: boolean; message: string } {
    const cleanCode = (code || '').trim();
    if (!cleanCode) {
      return { valid: false, message: 'Verification code is required.' };
    }
    const key = `${email.toLowerCase().trim()}_${purpose}`;
    const record = this.otpStore.get(key) || this.otpStore.get(email);
    if (!record) {
      return { valid: false, message: 'No active OTP session or code expired.' };
    }
    if (record.used) {
      return { valid: false, message: 'This verification code has already been used.' };
    }
    if (Date.now() > record.expiresAt) {
      return { valid: false, message: 'This verification code has expired.' };
    }
    const inputHash = `sha256_otp_${btoa(cleanCode).replace(/=+$/, '')}`;
    if (record.codeHash !== inputHash) {
      return { valid: false, message: 'Invalid verification code.' };
    }
    record.used = true;
    this.otpStore.set(key, record);
    return { valid: true, message: 'OTP verified.' };
  }

  public async triggerEvent(params: {
    eventType: SystemEmailEventType;
    templateIdOverride?: string;
    triggeringPortal: string;
    triggeringAction: string;
    actorUser?: SecurityUser | null;
    senderUserId?: string;
    targetUserIds?: string[];
    targetEmails?: string[];
    targetRoleIds?: string[];
    targetRoles?: string[];
    targetDepartments?: string[];
    targetProjectId?: string;
    ccEmails?: string[];
    bccEmails?: string[];
    variables?: Record<string, string>;
    portalId?: string;
    recordId?: string;
    attachments?: EmailAttachmentMeta[];
    channelsOverride?: NotificationChannelType[];
    scheduledFor?: string;
    recurringPattern?: 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
    idempotencyKey?: string;
  }): Promise<EmailDeliveryTrace> {
    const resolvedActor =
      params.actorUser ||
      (params.senderUserId
        ? securityService.getUsers().find(u => u.id === params.senderUserId) || null
        : null);
    return this.dispatchSystemEvent({
      ...params,
      actorUser: resolvedActor
    });
  }

  // --- TEMPLATE VARIABLE INTERPOLATION & SECRET REDACTION ---
  public renderTemplateString(raw: string, variables: Record<string, string>): string {
    let output = raw;
    Object.entries(variables).forEach(([key, val]) => {
      const cleanKey = key.replace(/^\{\{|\}\}$/g, '').trim();
      const regex = new RegExp(`\\{\\{\\s*${cleanKey}\\s*\\}\\}`, 'gi');
      output = output.replace(regex, val ?? '');
    });
    // Replace any remaining unpopulated variables with sensible defaults
    output = output.replace(/\{\{\s*company_name\s*\}\}/gi, this.config.companyHeaderTitle);
    output = output.replace(/\{\{\s*date\s*\}\}/gi, new Date().toLocaleString());
    output = output.replace(/\{\{\s*deep_link\s*\}\}/gi, window.location.origin);
    output = output.replace(/\{\{\s*[a-zA-Z0-9_]+\s*\}\}/g, '—');
    return output;
  }

  public sanitizeVariablesForLogs(variables: Record<string, string>): Record<string, string> {
    const sanitized: Record<string, string> = {};
    Object.entries(variables).forEach(([key, value]) => {
      const lower = key.toLowerCase();
      if (SENSITIVE_KEYS.some(sk => lower.includes(sk))) {
        sanitized[key] = '******** [REDACTED-SECRET]';
      } else {
        sanitized[key] = value;
      }
    });
    return sanitized;
  }

  // --- AUTHORIZED DEEP LINK BUILDER ---
  public buildAuthorizedDeepLink(params: {
    portalId?: string;
    recordId?: string;
    requiredPermission?: string;
  }) {
    const portalId = params.portalId || 'company-control-center';
    const portalMeta = SYSTEM_PORTAL_DIRECTORY.find(p => p.id === portalId || p.targetPortalId === portalId);
    const url = new URL(window.location.origin);
    url.searchParams.set('portal', portalId);
    if (params.recordId) url.searchParams.set('record', params.recordId);
    url.searchParams.set('auth_verify', '1');

    return {
      url: url.toString(),
      portalId,
      portalName: portalMeta?.title || 'Control Center',
      recordId: params.recordId,
      requiredPermission: params.requiredPermission || portalMeta?.requiredPermission
    };
  }

  // --- RBAC RECIPIENT RESOLUTION ---
  public resolveRecipients(params: {
    targetUserIds?: string[];
    targetEmails?: string[];
    targetRoleIds?: string[];
    targetDepartments?: string[];
    targetProjectId?: string;
    ccRoles?: string[];
    bccRoles?: string[];
  }): {
    toEmails: string[];
    ccEmails: string[];
    bccEmails: string[];
    matchedUsers: SecurityUser[];
    ruleSummary: string;
  } {
    const allUsers = securityService.getUsers().filter(u => u.accountStatus === 'Active');
    const matchedMap = new Map<string, SecurityUser>();
    const directEmails = new Set<string>(
      (params.targetEmails || []).map(e => e.trim()).filter(Boolean)
    );
    const summaryParts: string[] = [];

    if (params.targetUserIds && params.targetUserIds.length > 0) {
      allUsers.forEach(u => {
        if (params.targetUserIds!.includes(u.id) || params.targetUserIds!.includes(u.username)) {
          matchedMap.set(u.id, u);
        }
      });
      summaryParts.push(`${params.targetUserIds.length} Direct User(s)`);
    }

    if (params.targetRoleIds && params.targetRoleIds.length > 0) {
      if (params.targetRoleIds.includes('ALL')) {
        allUsers.forEach(u => matchedMap.set(u.id, u));
        summaryParts.push('All Active Roles');
      } else {
        allUsers.forEach(u => {
          if (
            params.targetRoleIds!.includes(u.roleId) ||
            params.targetRoleIds!.includes(u.userType) ||
            params.targetRoleIds!.some(r => u.roleName.toLowerCase().includes(r.toLowerCase()))
          ) {
            matchedMap.set(u.id, u);
          }
        });
        summaryParts.push(`Roles: ${params.targetRoleIds.join(', ')}`);
      }
    }

    if (params.targetDepartments && params.targetDepartments.length > 0) {
      if (!params.targetDepartments.includes('ALL')) {
        allUsers.forEach(u => {
          if (params.targetDepartments!.includes(u.department)) {
            matchedMap.set(u.id, u);
          }
        });
        summaryParts.push(`Depts: ${params.targetDepartments.join(', ')}`);
      }
    }

    if (params.targetProjectId) {
      allUsers.forEach(u => {
        if (securityService.canAccessProject(u.id, params.targetProjectId!)) {
          matchedMap.set(u.id, u);
        }
      });
      summaryParts.push(`Project Scope: ${params.targetProjectId}`);
    }

    const matchedUsers = Array.from(matchedMap.values());
    matchedUsers.forEach(u => {
      if (u.email) directEmails.add(u.email);
    });

    const googleUser = getConnectedGoogleUser();
    if (directEmails.size === 0 && googleUser?.email) {
      directEmails.add(googleUser.email);
    }

    const ccSet = new Set<string>();
    if (params.ccRoles && params.ccRoles.length > 0) {
      allUsers.forEach(u => {
        if (params.ccRoles!.includes(u.userType) || params.ccRoles!.includes(u.roleId)) {
          if (u.email && !directEmails.has(u.email)) ccSet.add(u.email);
        }
      });
    }

    const bccSet = new Set<string>();
    if (params.bccRoles && params.bccRoles.length > 0) {
      allUsers.forEach(u => {
        if (params.bccRoles!.includes(u.userType) || params.bccRoles!.includes(u.roleId)) {
          if (u.email && !directEmails.has(u.email) && !ccSet.has(u.email)) {
            bccSet.add(u.email);
          }
        }
      });
    }

    return {
      toEmails: Array.from(directEmails),
      ccEmails: Array.from(ccSet),
      bccEmails: Array.from(bccSet),
      matchedUsers,
      ruleSummary: summaryParts.join(' · ') || 'Explicit Recipient List'
    };
  }

  // --- CENTRAL EVENT ENGINE DISPATCHER ---
  public async dispatchSystemEvent(params: {
    eventType: SystemEmailEventType;
    templateIdOverride?: string;
    triggeringPortal: string;
    triggeringAction: string;
    actorUser?: SecurityUser | null;
    targetUserIds?: string[];
    targetEmails?: string[];
    targetRoleIds?: string[];
    targetDepartments?: string[];
    targetProjectId?: string;
    ccEmails?: string[];
    bccEmails?: string[];
    variables?: Record<string, string>;
    portalId?: string;
    recordId?: string;
    attachments?: EmailAttachmentMeta[];
    channelsOverride?: NotificationChannelType[];
    scheduledFor?: string;
    recurringPattern?: 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
    idempotencyKey?: string;
  }): Promise<EmailDeliveryTrace> {
    const template = params.templateIdOverride
      ? this.getTemplateById(params.templateIdOverride) || this.getTemplateByEvent(params.eventType)
      : this.getTemplateByEvent(params.eventType);

    // Prevent duplicate dispatch for identical idempotency key
    const idemKey =
      params.idempotencyKey ||
      `${params.eventType}_${params.recordId || 'global'}_${Math.floor(Date.now() / 5000)}`;
    const existingDuplicate = this.traces.find(t => t.idempotencyKey === idemKey);
    if (existingDuplicate) {
      return existingDuplicate;
    }

    const resolved = this.resolveRecipients({
      targetUserIds: params.targetUserIds,
      targetEmails: params.targetEmails,
      targetRoleIds: params.targetRoleIds || template.defaultRecipientRoles,
      targetDepartments: params.targetDepartments || template.defaultRecipientDepartments,
      targetProjectId: params.targetProjectId,
      ccRoles: template.ccRoles,
      bccRoles: template.bccRoles
    });

    const primaryRecipientUser = resolved.matchedUsers[0];
    const traceCode = numberingService.consumeNextNumber('email_dispatch_trace');
    const deepLinkObj = this.buildAuthorizedDeepLink({
      portalId: params.portalId || template.defaultPortalId || params.triggeringPortal,
      recordId: params.recordId || traceCode
    });

    const mergedVars: Record<string, string> = {
      company_name: this.config.companyHeaderTitle,
      user_name: primaryRecipientUser?.fullName || params.variables?.user_name || 'Authorized User',
      user_email:
        primaryRecipientUser?.email ||
        resolved.toEmails[0] ||
        params.variables?.user_email ||
        'user@innovista.com',
      role_name: primaryRecipientUser?.roleName || params.variables?.role_name || 'Authorized Role',
      department:
        primaryRecipientUser?.department || params.variables?.department || 'Operations',
      project_code: params.targetProjectId || params.variables?.project_code || 'PRJ-2026-001',
      project_name: params.variables?.project_name || 'Sapphire Tower Facade Package',
      task_code: params.variables?.task_code || params.recordId || traceCode,
      task_title: params.variables?.task_title || template.name,
      date: new Date().toLocaleString(),
      amount: params.variables?.amount || 'LKR 0.00',
      status: params.variables?.status || 'Active',
      portal_name: deepLinkObj.portalName,
      deep_link: deepLinkObj.url,
      reference_no: params.variables?.reference_no || params.recordId || traceCode,
      actor_name: params.actorUser?.fullName || params.variables?.actor_name || 'System Engine',
      summary: params.variables?.summary || template.description,
      ...(params.variables || {})
    };

    const subjectRendered = this.renderTemplateString(template.subject, mergedVars);
    const htmlRendered = this.renderTemplateString(template.htmlBody, mergedVars);
    const plainTextRendered = this.renderTemplateString(template.plainTextBody, mergedVars);

    const channels = params.channelsOverride || template.defaultChannels;

    // Check user notification preferences if non-mandatory
    let suppressedByPref = false;
    if (!template.isMandatorySecurity && primaryRecipientUser) {
      const prefs = this.getUserPreferences(primaryRecipientUser.id);
      if (!prefs.emailEnabled || !prefs.categories[template.category]) {
        suppressedByPref = true;
      }
    }

    const toList = resolved.toEmails.length > 0 ? resolved.toEmails : ['stallonboost.mkt@gmail.com'];
    const ccList = Array.from(new Set([...resolved.ccEmails, ...(params.ccEmails || [])]));
    const bccList = Array.from(new Set([...resolved.bccEmails, ...(params.bccEmails || [])]));

    let status: EmailDeliveryTrace['status'] = 'QUEUED_FOR_GMAIL';
    let gmailMessageId: string | undefined;
    let gmailThreadId: string | undefined;
    let lastError: string | undefined;

    if (suppressedByPref) {
      status = 'SUPPRESSED_BY_PREFERENCE';
    } else if (params.scheduledFor && new Date(params.scheduledFor).getTime() > Date.now()) {
      status = 'SCHEDULED';
    } else if (channels.includes('email')) {
      const accessToken = await getAccessToken();
      if (accessToken) {
        try {
          const googleUser = getConnectedGoogleUser();
          const sendRes = await sendGmailViaApi({
            fromName: this.config.senderDisplayName,
            fromEmail: googleUser?.email || this.config.senderReplyToEmail,
            to: toList,
            cc: ccList,
            bcc: bccList,
            subject: subjectRendered,
            plainText: plainTextRendered,
            htmlBody: htmlRendered,
            priority: template.defaultPriority
          });
          status = 'SENT_VIA_GMAIL';
          gmailMessageId = sendRes.id;
          gmailThreadId = sendRes.threadId;
        } catch (err: any) {
          status = 'FAILED_RETRYABLE';
          lastError = err?.message || 'Gmail API transmission error';
        }
      } else {
        status = 'QUEUED_FOR_GMAIL';
      }
    }

    // Fan-out to In-System Notification Center & Message Panel if configured
    if (channels.includes('in_app') && params.eventType === 'SYSTEM_ANNOUNCEMENT') {
      // News items are already in notificationNewsService
    }

    if (channels.includes('message_panel') && params.actorUser) {
      try {
        const threadsList = centralMessagingService.getAuthorizedThreadsForUser(params.actorUser);
        if (threadsList.length > 0) {
          const userInitials = params.actorUser.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'SYS';
          centralMessagingService.sendMessage({
            conversationId: threadsList[0].id,
            senderId: params.actorUser.id,
            senderName: params.actorUser.fullName,
            senderRole: params.actorUser.roleName || 'System',
            senderAvatarInitials: userInitials,
            content: `[${template.name}] ${subjectRendered} — ${mergedVars.summary}`,
            contentType: 'system_event',
            priority: template.defaultPriority === 'critical' ? 'urgent' : 'normal'
          }, params.actorUser);
        }
      } catch {}
    }

    const now = new Date().toISOString();
    const trace: EmailDeliveryTrace = {
      id: `trc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      traceCode,
      idempotencyKey: idemKey,
      eventType: params.eventType,
      eventLabel: template.name,
      triggeringPortal: params.triggeringPortal,
      triggeringAction: params.triggeringAction,
      senderIdentity: {
        userId: params.actorUser?.id || 'system-engine',
        name: params.actorUser?.fullName || this.config.senderDisplayName,
        email:
          getConnectedGoogleUser()?.email ||
          params.actorUser?.email ||
          this.config.senderReplyToEmail,
        role: params.actorUser?.roleName || 'Central Email Engine'
      },
      recipients: {
        to: toList,
        cc: ccList,
        bcc: bccList,
        resolvedRuleSummary: resolved.ruleSummary
      },
      templateId: template.id,
      templateCode: template.templateCode,
      templateName: template.name,
      templateVersion: template.version,
      subjectRendered,
      htmlRendered,
      plainTextRendered,
      authorizedDeepLink: deepLinkObj,
      attachments: params.attachments || [],
      channelsDispatched: channels,
      priority: template.defaultPriority,
      isMandatorySecurity: template.isMandatorySecurity,
      status,
      deliveryAttempts: 1,
      maxRetries: this.config.maxRetryAttempts,
      gmailMessageId,
      gmailThreadId,
      lastError,
      scheduledFor: params.scheduledFor,
      recurringPattern: params.recurringPattern || 'NONE',
      sanitizedVariables: this.sanitizeVariablesForLogs(mergedVars),
      createdAt: now,
      lastAttemptAt: now
    };

    this.traces = [trace, ...this.traces];
    this.persist();

    // Also record in central security audit log (with redacted secrets)
    securityService.logAuditEvent({
      userId: params.actorUser?.id,
      username: params.actorUser?.username || 'central-email-engine',
      userFullName: params.actorUser?.fullName || 'Central Email Engine',
      userRole: params.actorUser?.roleName || 'System Service',
      action: `EMAIL_EVENT_${params.eventType}`,
      target: `Trace ${traceCode} -> ${toList.join(', ')}`,
      details: `Template [${template.templateCode} v${template.version}] Status: ${status}${
        gmailMessageId ? ` (Gmail ID: ${gmailMessageId})` : ''
      }`,
      severity: template.defaultPriority === 'critical' ? 'Warning' : 'Info'
    });

    return trace;
  }

  // --- RETRY QUEUED OR FAILED EMAILS VIA GMAIL API ---
  public async retryDeliveryTrace(traceId: string): Promise<EmailDeliveryTrace | null> {
    const idx = this.traces.findIndex(t => t.id === traceId);
    if (idx < 0) return null;

    const trace = this.traces[idx];
    const token = await getAccessToken();
    if (!token) {
      throw new Error('Please connect your Google account with Gmail permission first.');
    }

    const googleUser = getConnectedGoogleUser();
    const now = new Date().toISOString();

    try {
      const sendRes = await sendGmailViaApi({
        fromName: this.config.senderDisplayName,
        fromEmail: googleUser?.email || this.config.senderReplyToEmail,
        to: trace.recipients.to,
        cc: trace.recipients.cc,
        bcc: trace.recipients.bcc,
        subject: trace.subjectRendered,
        plainText: trace.plainTextRendered,
        htmlBody: trace.htmlRendered,
        priority: trace.priority
      });

      const updated: EmailDeliveryTrace = {
        ...trace,
        status: 'SENT_VIA_GMAIL',
        deliveryAttempts: trace.deliveryAttempts + 1,
        gmailMessageId: sendRes.id,
        gmailThreadId: sendRes.threadId,
        lastError: undefined,
        lastAttemptAt: now
      };
      this.traces[idx] = updated;
      this.persist();
      return updated;
    } catch (err: any) {
      const updated: EmailDeliveryTrace = {
        ...trace,
        status: 'FAILED_RETRYABLE',
        deliveryAttempts: trace.deliveryAttempts + 1,
        lastError: err?.message || 'Retry failed',
        lastAttemptAt: now
      };
      this.traces[idx] = updated;
      this.persist();
      throw err;
    }
  }

  public async flushQueuedEmails(): Promise<{ sentCount: number; failedCount: number }> {
    const queued = this.traces.filter(
      t => t.status === 'QUEUED_FOR_GMAIL' || t.status === 'FAILED_RETRYABLE'
    );
    let sentCount = 0;
    let failedCount = 0;

    for (const item of queued) {
      try {
        await this.retryDeliveryTrace(item.id);
        sentCount++;
      } catch {
        failedCount++;
      }
    }
    return { sentCount, failedCount };
  }

  public getDeliveryTraces(): EmailDeliveryTrace[] {
    return [...this.traces];
  }
}

export const centralEmailService = new CentralEmailService();
