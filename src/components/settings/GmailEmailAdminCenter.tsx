import React, { useState, useEffect, useMemo } from 'react';
import {
  Mail,
  Plus,
  Edit3,
  Trash2,
  Send,
  RefreshCw,
  Eye,
  Code,
  FileText,
  History,
  Sliders,
  Sparkles,
  Search,
  Inbox,
  RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';
import {
  centralEmailService,
  EmailTemplate,
  EmailTemplateCategory,
  SystemEmailEventType,
  NotificationChannelType,
  EmailDeliveryTrace,
  AVAILABLE_TEMPLATE_VARIABLES
} from '../../services/centralEmailService';
import {
  initAuth,
  googleSignIn,
  logoutGoogle,
  subscribeGoogleAuth,
  fetchGmailProfile,
  fetchGmailMessages,
  sendGmailViaApi,
  createGmailDraftViaApi,
  trashGmailMessageViaApi,
  GmailProfileInfo,
  GmailMessageSummary
} from '../../services/googleWorkspaceAuth';
import { useSecurity } from '../../context/SecurityContext';
import { SYSTEM_PORTAL_DIRECTORY } from '../../services/centralMessagingService';
import { securityService } from '../../services/securityService';

const TEMPLATE_CATEGORIES: EmailTemplateCategory[] = [
  'Security & Identity',
  'Tasks, Instructions & Approvals',
  'Projects & Engineering',
  'Quality (QA/QC) & HSE',
  'Commercial, Finance & Invoicing',
  'Procurement, Customer & Supplier',
  'System Announcements & Emergency'
];

const EVENT_TYPES: { value: SystemEmailEventType; label: string }[] = [
  { value: 'USER_REGISTRATION', label: 'USER_REGISTRATION — New User Registration' },
  { value: 'ACCOUNT_ACTIVATION', label: 'ACCOUNT_ACTIVATION — Account Activation' },
  { value: 'USER_LOGIN', label: 'USER_LOGIN — Login Security Notification' },
  { value: 'PASSWORD_RESET_REQUEST', label: 'PASSWORD_RESET_REQUEST — Password Reset' },
  { value: 'PASSWORD_CHANGED', label: 'PASSWORD_CHANGED — Password Changed' },
  { value: 'OTP_REQUESTED', label: 'OTP_REQUESTED — Email OTP / 2FA Code' },
  { value: 'SUSPICIOUS_LOGIN_ALERT', label: 'SUSPICIOUS_LOGIN_ALERT — Lockout / Suspicious Login' },
  { value: 'ROLE_PERMISSION_CHANGED', label: 'ROLE_PERMISSION_CHANGED — Role / Permission Update' },
  { value: 'ACCESS_REQUEST_DECISION', label: 'ACCESS_REQUEST_DECISION — Access Approval / Rejection' },
  { value: 'PROJECT_ASSIGNED', label: 'PROJECT_ASSIGNED — Project Assignment & Milestone' },
  { value: 'TASK_ASSIGNED', label: 'TASK_ASSIGNED — Task Assignment' },
  { value: 'INSTRUCTION_ISSUED', label: 'INSTRUCTION_ISSUED — Official Instruction' },
  { value: 'APPROVAL_REQUESTED', label: 'APPROVAL_REQUESTED — Workflow Approval Request' },
  { value: 'NCR_CREATED', label: 'NCR_CREATED — Quality NCR Alert' },
  { value: 'HSE_ALERT', label: 'HSE_ALERT — HSE Safety Alert' },
  { value: 'INVOICE_ISSUED', label: 'INVOICE_ISSUED — Commercial Invoice Issued' },
  { value: 'QUOTATION_SENT', label: 'QUOTATION_SENT — Quotation Proposal' },
  { value: 'RFQ_INVITATION', label: 'RFQ_INVITATION — Procurement RFQ / PO Notice' },
  { value: 'SYSTEM_ANNOUNCEMENT', label: 'SYSTEM_ANNOUNCEMENT — Official News Bulletin' },
  { value: 'MAINTENANCE_EMERGENCY', label: 'MAINTENANCE_EMERGENCY — Emergency Broadcast' },
  { value: 'CUSTOM_EVENT', label: 'CUSTOM_EVENT — Custom Business Event' }
];

interface PendingMutatingAction {
  title: string;
  description: string;
  confirmLabel: string;
  isDanger?: boolean;
  onConfirm: () => Promise<void>;
}

export const GmailEmailAdminCenter: React.FC = () => {
  const { currentUser, effectiveUser, hasPermission } = useSecurity();
  const activeUser = effectiveUser || currentUser;

  const isAdmin =
    !activeUser ||
    activeUser.roleId === 'role-superadmin' ||
    activeUser.adminAuthorityLevel === 'SUPER_ADMINISTRATOR' ||
    activeUser.roleId === 'role-sysadmin' ||
    hasPermission('security.admin') ||
    hasPermission('settings.manage');

  const [subTab, setSubTab] = useState<
    'templates' | 'mailbox' | 'event-engine' | 'traces' | 'preferences'
  >('templates');

  // Google OAuth & Gmail Live State
  const [googleConnected, setGoogleConnected] = useState(false);
  const [googleUserEmail, setGoogleUserEmail] = useState<string | null>(null);
  const [isSigningInGoogle, setIsSigningInGoogle] = useState(false);
  const [gmailProfile, setGmailProfile] = useState<GmailProfileInfo | null>(null);
  const [gmailMessages, setGmailMessages] = useState<GmailMessageSummary[]>([]);
  const [gmailSearchQuery, setGmailSearchQuery] = useState('in:inbox');
  const [isLoadingGmail, setIsLoadingGmail] = useState(false);

  // Central Email Service State
  const [templates, setTemplates] = useState<EmailTemplate[]>(() =>
    centralEmailService.getTemplates()
  );
  const [traces, setTraces] = useState<EmailDeliveryTrace[]>(() =>
    centralEmailService.getDeliveryTraces()
  );
  const [serviceConfig, setServiceConfig] = useState(() =>
    centralEmailService.getConfiguration()
  );
  const [userPrefs, setUserPrefs] = useState(() =>
    centralEmailService.getUserPreferences(activeUser?.id || 'usr-admin-01')
  );

  // Explicit Confirmation Modal State (MANDATORY for Gmail API mutations)
  const [pendingConfirm, setPendingConfirm] = useState<PendingMutatingAction | null>(null);
  const [isExecutingConfirm, setIsExecutingConfirm] = useState(false);

  // Template Manager Filter & Editor State
  const [templateSearch, setTemplateSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    templates[0]?.id || ''
  );
  const [isEditingTemplate, setIsEditingTemplate] = useState(false);
  const [isCreatingNewTemplate, setIsCreatingNewTemplate] = useState(false);
  const [previewMode, setPreviewMode] = useState<'html' | 'plain' | 'code' | 'versions'>(
    'html'
  );

  // Template Editor Form Fields
  const [editName, setEditName] = useState('');
  const [editEventType, setEditEventType] = useState<SystemEmailEventType>('CUSTOM_EVENT');
  const [editCategory, setEditCategory] = useState<EmailTemplateCategory>(
    'Tasks, Instructions & Approvals'
  );
  const [editDescription, setEditDescription] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [editHtmlBody, setEditHtmlBody] = useState('');
  const [editPlainText, setEditPlainText] = useState('');
  const [editPriority, setEditPriority] = useState<'low' | 'normal' | 'high' | 'critical'>(
    'normal'
  );
  const [editMandatory, setEditMandatory] = useState(false);
  const [editChannels, setEditChannels] = useState<NotificationChannelType[]>([
    'email',
    'in_app'
  ]);
  const [editPortalId, setEditPortalId] = useState('company-control-center');
  const [editRecipientRoles, setEditRecipientRoles] = useState<string[]>([]);
  const [editChangeNote, setEditChangeNote] = useState('');

  // Direct Compose / Test Send State
  const [composeTo, setComposeTo] = useState(
    activeUser?.email || 'stallonboost.mkt@gmail.com'
  );
  const [composeCc, setComposeCc] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');

  // Event Engine Dispatcher State
  const [simEventType, setSimEventType] = useState<SystemEmailEventType>('TASK_ASSIGNED');
  const [simTargetEmails, setSimTargetEmails] = useState(
    activeUser?.email || 'stallonboost.mkt@gmail.com'
  );
  const [simTargetRole, setSimTargetRole] = useState('');
  const [simProjectCode, setSimProjectCode] = useState('PRJ-2026-001');
  const [simTaskTitle, setSimTaskTitle] = useState(
    'CW-04 Curtain Wall Mullion Thermal Break Verification'
  );
  const [simSummary, setSimSummary] = useState(
    'Please verify shop drawing tolerances and submit QA/QC hold point sign-off.'
  );
  const [simAmount, setSimAmount] = useState('LKR 1,450,000.00');
  const [simScheduledFor, setSimScheduledFor] = useState('');
  const [simRecurring, setSimRecurring] = useState<'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY'>(
    'NONE'
  );

  // Selected Trace Modal
  const [inspectedTrace, setInspectedTrace] = useState<EmailDeliveryTrace | null>(null);

  useEffect(() => {
    const unsubAuth = initAuth();
    const unsubState = subscribeGoogleAuth(state => {
      setGoogleConnected(state.hasToken);
      setGoogleUserEmail(state.user?.email || null);
      if (state.hasToken) {
        loadLiveGmailData();
      } else {
        setGmailProfile(null);
        setGmailMessages([]);
      }
    });
    const unsubEmail = centralEmailService.subscribe(() => {
      setTemplates(centralEmailService.getTemplates());
      setTraces(centralEmailService.getDeliveryTraces());
      setServiceConfig(centralEmailService.getConfiguration());
      if (activeUser) {
        setUserPrefs(centralEmailService.getUserPreferences(activeUser.id));
      }
    });

    return () => {
      unsubAuth();
      unsubState();
      unsubEmail();
    };
  }, [activeUser?.id]);

  const loadLiveGmailData = async (customQuery?: string) => {
    setIsLoadingGmail(true);
    try {
      const [profile, messages] = await Promise.all([
        fetchGmailProfile(),
        fetchGmailMessages(customQuery ?? gmailSearchQuery, 12)
      ]);
      if (profile) setGmailProfile(profile);
      setGmailMessages(messages);
    } catch (err: any) {
      console.warn('Gmail API fetch warning:', err);
    } finally {
      setIsLoadingGmail(false);
    }
  };

  const handleGoogleConnect = async () => {
    setIsSigningInGoogle(true);
    try {
      const res = await googleSignIn();
      if (res) {
        toast.success(`Connected to Gmail as ${res.user.email}`);
        await loadLiveGmailData();
      }
    } catch (err: any) {
      toast.error(err?.message || 'Google Sign-In was cancelled or failed.');
    } finally {
      setIsSigningInGoogle(false);
    }
  };

  const handleGoogleDisconnect = async () => {
    await logoutGoogle();
    toast.info('Disconnected Google OAuth session');
  };

  const filteredTemplates = useMemo(() => {
    return templates.filter(tpl => {
      if (categoryFilter !== 'ALL' && tpl.category !== categoryFilter) return false;
      if (templateSearch.trim()) {
        const q = templateSearch.toLowerCase();
        return (
          tpl.name.toLowerCase().includes(q) ||
          tpl.templateCode.toLowerCase().includes(q) ||
          tpl.eventType.toLowerCase().includes(q) ||
          tpl.subject.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [templates, categoryFilter, templateSearch]);

  const activeTemplate = useMemo(() => {
    return (
      templates.find(t => t.id === selectedTemplateId) ||
      filteredTemplates[0] ||
      templates[0]
    );
  }, [templates, filteredTemplates, selectedTemplateId]);

  const startCreateNewTemplate = () => {
    setIsCreatingNewTemplate(true);
    setIsEditingTemplate(true);
    setEditName('');
    setEditEventType('CUSTOM_EVENT');
    setEditCategory('Tasks, Instructions & Approvals');
    setEditDescription('Custom enterprise email & notification template');
    setEditSubject('[{{company_name}}] Notification: {{task_title}} ({{reference_no}})');
    setEditHtmlBody(`<div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:14px;">
  <h2 style="color:#0f172a;margin-top:0;">{{task_title}}</h2>
  <p>Hello <strong>{{user_name}}</strong> ({{role_name}}),</p>
  <p>{{summary}}</p>
  <p><strong>Project:</strong> {{project_name}} ({{project_code}})<br/><strong>Reference:</strong> {{reference_no}}</p>
  <p style="margin-top:20px;">
    <a href="{{deep_link}}" style="background:#f97316;color:#ffffff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:700;">Open in {{portal_name}} →</a>
  </p>
</div>`);
    setEditPlainText(
      'Hello {{user_name}},\n\n{{task_title}}\n{{summary}}\nProject: {{project_name}} ({{project_code}})\nOpen Portal: {{deep_link}}'
    );
    setEditPriority('normal');
    setEditMandatory(false);
    setEditChannels(['email', 'in_app']);
    setEditPortalId('company-control-center');
    setEditRecipientRoles([]);
    setEditChangeNote('Created custom template');
  };

  const startEditSelectedTemplate = (tpl: EmailTemplate) => {
    setIsCreatingNewTemplate(false);
    setIsEditingTemplate(true);
    setEditName(tpl.name);
    setEditEventType(tpl.eventType);
    setEditCategory(tpl.category);
    setEditDescription(tpl.description);
    setEditSubject(tpl.subject);
    setEditHtmlBody(tpl.htmlBody);
    setEditPlainText(tpl.plainTextBody);
    setEditPriority(tpl.defaultPriority);
    setEditMandatory(tpl.isMandatorySecurity);
    setEditChannels([...tpl.defaultChannels]);
    setEditPortalId(tpl.defaultPortalId || 'company-control-center');
    setEditRecipientRoles([...tpl.defaultRecipientRoles]);
    setEditChangeNote('');
  };

  const handleSaveTemplate = () => {
    if (!editName.trim() || !editSubject.trim()) {
      toast.error('Please enter both a Template Name and Subject Line.');
      return;
    }

    if (isCreatingNewTemplate) {
      const created = centralEmailService.createTemplate(
        {
          eventType: editEventType,
          name: editName.trim(),
          category: editCategory,
          description: editDescription.trim(),
          subject: editSubject.trim(),
          htmlBody: editHtmlBody,
          plainTextBody: editPlainText,
          availableVariables: AVAILABLE_TEMPLATE_VARIABLES,
          defaultPriority: editPriority,
          isMandatorySecurity: editMandatory,
          isActive: true,
          defaultChannels: editChannels,
          defaultRecipientRoles: editRecipientRoles,
          defaultRecipientDepartments: [],
          ccRoles: [],
          bccRoles: [],
          defaultPortalId: editPortalId,
          updatedBy: activeUser?.fullName || 'Administrator'
        },
        activeUser?.fullName || 'Administrator'
      );
      setSelectedTemplateId(created.id);
      setIsEditingTemplate(false);
      setIsCreatingNewTemplate(false);
      toast.success(`Created template ${created.templateCode}`);
    } else if (activeTemplate) {
      centralEmailService.updateTemplate(
        activeTemplate.id,
        {
          eventType: editEventType,
          name: editName.trim(),
          category: editCategory,
          description: editDescription.trim(),
          subject: editSubject.trim(),
          htmlBody: editHtmlBody,
          plainTextBody: editPlainText,
          defaultPriority: editPriority,
          isMandatorySecurity: editMandatory,
          defaultChannels: editChannels,
          defaultRecipientRoles: editRecipientRoles,
          defaultPortalId: editPortalId
        },
        editChangeNote.trim() || 'Updated via Settings Template Manager',
        activeUser?.fullName || 'Administrator'
      );
      setIsEditingTemplate(false);
      toast.success(`Saved ${activeTemplate.templateCode} (v${activeTemplate.version + 1})`);
    }
  };

  // Sample variables for live template preview
  const samplePreviewVars = useMemo(
    () => ({
      company_name: serviceConfig.companyHeaderTitle,
      user_name: activeUser?.fullName || 'Alexander Vance',
      user_email: activeUser?.email || 'stallonboost.mkt@gmail.com',
      role_name: activeUser?.roleName || 'Super Administrator',
      department: activeUser?.department || 'OPERATIONS',
      project_code: 'PRJ-2026-001',
      project_name: 'Sapphire Tower Curtain Wall Package',
      task_code: 'TSK-2026-0412',
      task_title: 'AFC Structural Facade Submittal Verification',
      date: new Date().toLocaleString(),
      amount: 'LKR 4,850,000.00',
      status: 'Approved / Active',
      portal_name: 'Project Management Portal',
      deep_link: `${window.location.origin}/?portal=project-management&record=PRJ-2026-001&auth_verify=1`,
      otp_code: '482910',
      reference_no: 'REF-2026-0982',
      actor_name: activeUser?.fullName || 'Alexander Vance',
      summary:
        'All structural thermal-break calculations and CWCT hose test reports have been verified.'
    }),
    [serviceConfig.companyHeaderTitle, activeUser]
  );

  const previewSubject = useMemo(() => {
    const raw = isEditingTemplate ? editSubject : activeTemplate?.subject || '';
    return centralEmailService.renderTemplateString(raw, samplePreviewVars);
  }, [isEditingTemplate, editSubject, activeTemplate, samplePreviewVars]);

  const previewHtml = useMemo(() => {
    const raw = isEditingTemplate ? editHtmlBody : activeTemplate?.htmlBody || '';
    return centralEmailService.renderTemplateString(raw, samplePreviewVars);
  }, [isEditingTemplate, editHtmlBody, activeTemplate, samplePreviewVars]);

  const previewPlain = useMemo(() => {
    const raw = isEditingTemplate ? editPlainText : activeTemplate?.plainTextBody || '';
    return centralEmailService.renderTemplateString(raw, samplePreviewVars);
  }, [isEditingTemplate, editPlainText, activeTemplate, samplePreviewVars]);

  // Confirmation wrapper for sending/mutating Gmail API data
  const requestSendTemplateTest = (tpl: EmailTemplate) => {
    const targetRecipient =
      googleUserEmail || activeUser?.email || 'stallonboost.mkt@gmail.com';
    setPendingConfirm({
      title: `Send Test Email via Gmail?`,
      description: `This will send "${tpl.name}" (${tpl.templateCode}) to ${targetRecipient} using your connected Gmail account.`,
      confirmLabel: 'Confirm & Send Email',
      onConfirm: async () => {
        const trace = await centralEmailService.dispatchSystemEvent({
          eventType: tpl.eventType,
          templateIdOverride: tpl.id,
          triggeringPortal: 'system-administration',
          triggeringAction: 'Manual Template Test Dispatch',
          actorUser: activeUser,
          targetEmails: [targetRecipient],
          variables: samplePreviewVars
        });
        if (trace.status === 'SENT_VIA_GMAIL') {
          toast.success(`Email sent via Gmail API (ID: ${trace.gmailMessageId})`);
        } else {
          toast.info(
            `Event logged & queued (${trace.traceCode}). Connect Google Sign-In to transmit live via Gmail.`
          );
        }
      }
    });
  };

  const requestDispatchSimulatedEvent = () => {
    const emailList = simTargetEmails
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    setPendingConfirm({
      title: `Dispatch System Event [${simEventType}]?`,
      description: `This will trigger the "${simEventType}" workflow across configured channels and send email(s) to ${
        emailList.join(', ') || 'authorized RBAC recipients'
      }.`,
      confirmLabel: 'Confirm & Dispatch Event',
      onConfirm: async () => {
        const isOtp = simEventType === 'OTP_REQUESTED';
        const otpData = isOtp
          ? centralEmailService.issueSecureOtp(emailList[0] || 'user')
          : null;

        const trace = await centralEmailService.dispatchSystemEvent({
          eventType: simEventType,
          triggeringPortal: 'project-management',
          triggeringAction: 'Central Event Engine Dispatch',
          actorUser: activeUser,
          targetEmails: emailList,
          targetRoleIds: simTargetRole ? [simTargetRole] : undefined,
          targetProjectId: simProjectCode,
          scheduledFor: simScheduledFor || undefined,
          recurringPattern: simRecurring,
          variables: {
            project_code: simProjectCode,
            project_name: 'Sapphire Tower Facade Package',
            task_title: simTaskTitle,
            summary: simSummary,
            amount: simAmount,
            otp_code: otpData?.otpPlainForEmailOnly || '482910'
          }
        });
        toast.success(`Dispatched event ${trace.traceCode} (${trace.status})`);
        setSubTab('traces');
      }
    });
  };

  const requestSendDirectGmail = () => {
    const toEmails = composeTo
      .split(',')
      .map(e => e.trim())
      .filter(Boolean);
    if (toEmails.length === 0 || !composeSubject.trim() || !composeBody.trim()) {
      toast.error('Please provide recipient(s), subject, and message body.');
      return;
    }

    setPendingConfirm({
      title: `Send Email via Gmail to ${toEmails.length} Recipient(s)?`,
      description: `Subject: "${composeSubject}"\nRecipients: ${toEmails.join(', ')}\n\nPlease confirm before sending this email on your behalf.`,
      confirmLabel: 'Send Email Now',
      onConfirm: async () => {
        const res = await sendGmailViaApi({
          fromName: serviceConfig.senderDisplayName,
          fromEmail: googleUserEmail || serviceConfig.senderReplyToEmail,
          to: toEmails,
          cc: composeCc
            .split(',')
            .map(e => e.trim())
            .filter(Boolean),
          subject: composeSubject.trim(),
          plainText: composeBody,
          htmlBody: `<div style="font-family:Inter,Arial,sans-serif;font-size:14px;line-height:1.6;color:#1e293b;">${composeBody.replace(
            /\n/g,
            '<br/>'
          )}</div>`
        });
        toast.success(`Sent via Gmail (Message ID: ${res.id})`);
        setComposeSubject('');
        setComposeBody('');
        await loadLiveGmailData();
      }
    });
  };

  const requestSaveGmailDraft = () => {
    const toEmails = composeTo
      .split(',')
      .map(e => e.trim())
      .filter(Boolean);
    if (!composeSubject.trim()) {
      toast.error('Please enter a subject for the draft.');
      return;
    }

    setPendingConfirm({
      title: 'Create Draft in Gmail?',
      description: `Save draft "${composeSubject}" in your connected Gmail account?`,
      confirmLabel: 'Save Draft',
      onConfirm: async () => {
        const res = await createGmailDraftViaApi({
          fromName: serviceConfig.senderDisplayName,
          fromEmail: googleUserEmail || serviceConfig.senderReplyToEmail,
          to: toEmails.length > 0 ? toEmails : [googleUserEmail || 'stallonboost.mkt@gmail.com'],
          subject: composeSubject.trim(),
          plainText: composeBody,
          htmlBody: `<p>${composeBody.replace(/\n/g, '<br/>')}</p>`
        });
        toast.success(`Draft saved in Gmail (Draft ID: ${res.id})`);
      }
    });
  };

  const requestTrashGmailMessage = (msg: GmailMessageSummary) => {
    setPendingConfirm({
      title: 'Move Gmail Message to Trash?',
      description: `Are you sure you want to move "${msg.subject}" (from ${msg.from}) to Trash in your Gmail account?`,
      confirmLabel: 'Move to Trash',
      isDanger: true,
      onConfirm: async () => {
        await trashGmailMessageViaApi(msg.id);
        toast.success('Message moved to Gmail Trash');
        await loadLiveGmailData();
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Google Workspace Gmail OAuth Connection & Status */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-slate-900">
                Centralized Gmail &amp; Email Notification Service
              </h2>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  googleConnected
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                {googleConnected ? `Connected: ${googleUserEmail}` : 'OAuth Ready · Queue Active'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Unified Gmail API dispatcher, editable HTML/plain-text templates, RBAC recipient resolver, secure OTP engine, and end-to-end delivery traceability.
            </p>
            {gmailProfile && (
              <div className="flex items-center gap-4 mt-2 text-[11px] text-slate-500 font-mono">
                <span>Gmail Account: {gmailProfile.emailAddress}</span>
                <span>Total Messages: {gmailProfile.messagesTotal}</span>
                <span>Threads: {gmailProfile.threadsTotal}</span>
              </div>
            )}
          </div>
        </div>

        {/* Official "Sign in with Google" Button or Connected Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          {googleConnected ? (
            <>
              <button
                type="button"
                onClick={() => loadLiveGmailData()}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingGmail ? 'animate-spin' : ''}`} />
                <span>Sync Gmail</span>
              </button>
              <button
                type="button"
                onClick={handleGoogleDisconnect}
                className="px-3 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-xs font-semibold text-rose-700 cursor-pointer"
              >
                Disconnect Google
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleGoogleConnect}
              disabled={isSigningInGoogle}
              className="gsi-material-button inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 shadow-xs text-xs font-semibold text-slate-800 transition-all cursor-pointer"
            >
              <div className="w-4 h-4 shrink-0">
                <svg
                  version="1.1"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 48 48"
                  style={{ display: 'block', width: '100%', height: '100%' }}
                >
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                  />
                  <path fill="none" d="M0 0h48v48H0z" />
                </svg>
              </div>
              <span>{isSigningInGoogle ? 'Connecting...' : 'Sign in with Google'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub-Navigation Bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        {[
          {
            id: 'templates',
            label: `Email Templates (${templates.length})`,
            icon: FileText
          },
          {
            id: 'mailbox',
            label: 'Live Gmail & Composer',
            icon: Inbox
          },
          {
            id: 'event-engine',
            label: 'Event & Trigger Engine',
            icon: Sparkles
          },
          {
            id: 'traces',
            label: `Delivery Logs & Queue (${traces.length})`,
            icon: History
          },
          {
            id: 'preferences',
            label: 'Notification Preferences & Config',
            icon: Sliders
          }
        ].map(tab => {
          const Icon = tab.icon;
          const active = subTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSubTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                active
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* =================================================================== */}
      {/* TAB 1: CENTRALIZED EMAIL TEMPLATE MANAGER (ADD & EDIT TEMPLATES)    */}
      {/* =================================================================== */}
      {subTab === 'templates' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Template List & Filters */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-4 flex flex-col h-[680px]">
            <div className="flex items-center justify-between gap-2 mb-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Template Registry ({filteredTemplates.length})
              </h3>
              {isAdmin && (
                <button
                  type="button"
                  onClick={startCreateNewTemplate}
                  className="px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Template</span>
                </button>
              )}
            </div>

            {/* Search & Category Filter */}
            <div className="space-y-2 mb-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={templateSearch}
                  onChange={e => setTemplateSearch(e.target.value)}
                  placeholder="Search templates by name, code, or event..."
                  className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500"
                />
              </div>
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              >
                <option value="ALL">All Categories ({templates.length})</option>
                {TEMPLATE_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Scrollable Template List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {filteredTemplates.map(tpl => {
                const isSelected = activeTemplate?.id === tpl.id && !isCreatingNewTemplate;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => {
                      setSelectedTemplateId(tpl.id);
                      setIsEditingTemplate(false);
                      setIsCreatingNewTemplate(false);
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-orange-50/70 border-orange-300 shadow-2xs'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono font-bold text-orange-600">
                        {tpl.templateCode} · v{tpl.version}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                          tpl.isMandatorySecurity
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {tpl.isMandatorySecurity ? 'Mandatory Security' : tpl.defaultPriority}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-900 mt-1 truncate">{tpl.name}</p>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      Event: <span className="font-mono">{tpl.eventType}</span>
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Template Inspector / Editor */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 flex flex-col h-[680px] overflow-y-auto">
            {isEditingTemplate ? (
              /* TEMPLATE CREATE / EDIT FORM */
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {isCreatingNewTemplate
                        ? 'Create New Email & Notification Template'
                        : `Edit Template — ${activeTemplate?.templateCode}`}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Use dynamic variables like {'{{user_name}}'}, {'{{project_name}}'}, {'{{deep_link}}'}, or {'{{otp_code}}'}.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingTemplate(false);
                        setIsCreatingNewTemplate(false);
                      }}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveTemplate}
                      className="px-4 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold cursor-pointer"
                    >
                      Save Template
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Template Name
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      placeholder="e.g. Project Variation Approval Notice"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      System Event Trigger
                    </label>
                    <select
                      value={editEventType}
                      onChange={e => setEditEventType(e.target.value as SystemEmailEventType)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
                    >
                      {EVENT_TYPES.map(ev => (
                        <option key={ev.value} value={ev.value}>
                          {ev.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Category
                    </label>
                    <select
                      value={editCategory}
                      onChange={e => setEditCategory(e.target.value as EmailTemplateCategory)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
                    >
                      {TEMPLATE_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Authorized Target Portal Deep Link
                    </label>
                    <select
                      value={editPortalId}
                      onChange={e => setEditPortalId(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
                    >
                      {SYSTEM_PORTAL_DIRECTORY.map(p => (
                        <option key={p.id} value={p.targetPortalId || p.id}>
                          {p.title} ({p.targetPortalId || p.id})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-slate-700">Priority:</span>
                    {(['low', 'normal', 'high', 'critical'] as const).map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setEditPriority(p)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize cursor-pointer ${
                          editPriority === p
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>

                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editMandatory}
                      onChange={e => setEditMandatory(e.target.checked)}
                      className="rounded border-slate-300 text-orange-500"
                    />
                    <span>Mandatory Security Email (Cannot be unsubscribed)</span>
                  </label>
                </div>

                {/* Channels */}
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <span className="font-semibold text-slate-700">Active Channels:</span>
                  {(
                    [
                      { id: 'email', label: 'Gmail / Email' },
                      { id: 'in_app', label: 'In-System Notification' },
                      { id: 'message_panel', label: 'Central Message Panel' }
                    ] as const
                  ).map(ch => {
                    const checked = editChannels.includes(ch.id);
                    return (
                      <label
                        key={ch.id}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            setEditChannels(prev =>
                              checked ? prev.filter(c => c !== ch.id) : [...prev, ch.id]
                            );
                          }}
                        />
                        <span>{ch.label}</span>
                      </label>
                    );
                  })}
                </div>

                {/* Subject Line */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Subject Line
                  </label>
                  <input
                    type="text"
                    value={editSubject}
                    onChange={e => setEditSubject(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-200 rounded-xl"
                  />
                </div>

                {/* Clickable Variable Chips */}
                <div>
                  <span className="block text-[11px] font-semibold text-slate-500 mb-1.5">
                    Click a variable to append to HTML Body:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {AVAILABLE_TEMPLATE_VARIABLES.map(v => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setEditHtmlBody(prev => `${prev} ${v}`)}
                        className="px-2 py-0.5 rounded bg-slate-100 hover:bg-orange-50 text-slate-700 hover:text-orange-600 font-mono text-[10px] border border-slate-200 cursor-pointer"
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                {/* HTML Body */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Branded HTML Email Body
                  </label>
                  <textarea
                    rows={7}
                    value={editHtmlBody}
                    onChange={e => setEditHtmlBody(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-200 rounded-xl"
                  />
                </div>

                {/* Plain-Text Fallback */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Plain-Text Fallback Body
                  </label>
                  <textarea
                    rows={3}
                    value={editPlainText}
                    onChange={e => setEditPlainText(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-200 rounded-xl"
                  />
                </div>

                {!isCreatingNewTemplate && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Version Change Note
                    </label>
                    <input
                      type="text"
                      value={editChangeNote}
                      onChange={e => setEditChangeNote(e.target.value)}
                      placeholder="Describe what changed in this version..."
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
                    />
                  </div>
                )}
              </div>
            ) : activeTemplate ? (
              /* TEMPLATE INSPECTOR & LIVE PREVIEW */
              <div className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-orange-600">
                        {activeTemplate.templateCode} (v{activeTemplate.version})
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">
                        {activeTemplate.category}
                      </span>
                      {activeTemplate.isMandatorySecurity && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-bold">
                          Mandatory Security
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-1">
                      {activeTemplate.name}
                    </h3>
                    <p className="text-xs text-slate-500">{activeTemplate.description}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => requestSendTemplateTest(activeTemplate)}
                      className="px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Test Send via Gmail</span>
                    </button>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => startEditSelectedTemplate(activeTemplate)}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit Template</span>
                      </button>
                    )}
                    {isAdmin && !activeTemplate.isSystemDefault && (
                      <button
                        type="button"
                        onClick={() => {
                          centralEmailService.deleteTemplate(activeTemplate.id);
                          toast.info('Custom template deleted');
                        }}
                        className="p-1.5 rounded-xl border border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-500 cursor-pointer"
                        title="Delete Custom Template"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Rendered Subject Bar */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>
                      Event Trigger: <strong className="font-mono">{activeTemplate.eventType}</strong>
                    </span>
                    <span>
                      Channels:{' '}
                      <strong>{activeTemplate.defaultChannels.join(' + ').toUpperCase()}</strong>
                    </span>
                  </div>
                  <div className="font-semibold text-slate-900">
                    Subject Preview: <span className="font-normal">{previewSubject}</span>
                  </div>
                </div>

                {/* Preview Mode Switcher */}
                <div className="flex items-center gap-2">
                  {[
                    { id: 'html', label: 'Branded HTML Preview', icon: Eye },
                    { id: 'plain', label: 'Plain-Text Fallback', icon: FileText },
                    { id: 'code', label: 'HTML Source & Variables', icon: Code },
                    {
                      id: 'versions',
                      label: `Version History (${(activeTemplate.versionHistory || []).length})`,
                      icon: History
                    }
                  ].map(m => {
                    const Icon = m.icon;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPreviewMode(m.id as any)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                          previewMode === m.id
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{m.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Preview Viewport */}
                {previewMode === 'html' && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-100 p-4 overflow-x-auto">
                    <div
                      className="printable-sheet"
                      dangerouslySetInnerHTML={{ __html: previewHtml }}
                    />
                  </div>
                )}

                {previewMode === 'plain' && (
                  <pre className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono whitespace-pre-wrap text-slate-800">
                    {previewPlain}
                  </pre>
                )}

                {previewMode === 'code' && (
                  <div className="space-y-3">
                    <pre className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-[11px] font-mono whitespace-pre-wrap text-slate-800 max-h-72 overflow-y-auto">
                      {activeTemplate.htmlBody}
                    </pre>
                  </div>
                )}

                {previewMode === 'versions' && (
                  <div className="space-y-2">
                    {(activeTemplate.versionHistory || []).length === 0 ? (
                      <p className="text-xs text-slate-500 py-4 text-center">
                        Currently on initial version v{activeTemplate.version}. Edit and save to create version snapshots.
                      </p>
                    ) : (
                      activeTemplate.versionHistory.map(ver => (
                        <div
                          key={ver.version}
                          className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                        >
                          <div>
                            <p className="font-bold text-slate-900">
                              Version v{ver.version} — {ver.changeNote}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              By {ver.updatedBy} on {new Date(ver.updatedAt).toLocaleString()}
                            </p>
                          </div>
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => {
                                centralEmailService.updateTemplate(
                                  activeTemplate.id,
                                  {
                                    subject: ver.subject,
                                    htmlBody: ver.htmlBody,
                                    plainTextBody: ver.plainTextBody
                                  },
                                  `Rolled back to v${ver.version}`,
                                  activeUser?.fullName || 'Administrator'
                                );
                                toast.success(`Rolled back template to v${ver.version}`);
                              }}
                              className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Restore v{ver.version}</span>
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2: LIVE GMAIL MAILBOX & DIRECT COMPOSER                         */}
      {/* =================================================================== */}
      {subTab === 'mailbox' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Compose & Send via Gmail API */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Send className="w-4 h-4 text-orange-500" />
              <span>Compose &amp; Send via Gmail API</span>
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                To (comma-separated emails)
              </label>
              <input
                type="text"
                value={composeTo}
                onChange={e => setComposeTo(e.target.value)}
                placeholder="recipient@company.com"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                CC (optional)
              </label>
              <input
                type="text"
                value={composeCc}
                onChange={e => setComposeCc(e.target.value)}
                placeholder="cc@company.com"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Subject
              </label>
              <input
                type="text"
                value={composeSubject}
                onChange={e => setComposeSubject(e.target.value)}
                placeholder="Enter email subject..."
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Message Body
              </label>
              <textarea
                rows={6}
                value={composeBody}
                onChange={e => setComposeBody(e.target.value)}
                placeholder="Write your message..."
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={requestSendDirectGmail}
                className="flex-1 py-2.5 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Email</span>
              </button>
              <button
                type="button"
                onClick={requestSaveGmailDraft}
                className="py-2.5 px-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Save Draft
              </button>
            </div>
          </div>

          {/* Connected Gmail Inbox / Sent Viewer */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Inbox className="w-4 h-4 text-orange-500" />
                <span>Connected Gmail Messages</span>
              </h3>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={gmailSearchQuery}
                  onChange={e => setGmailSearchQuery(e.target.value)}
                  placeholder="e.g. in:inbox or in:sent"
                  className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl w-44"
                />
                <button
                  type="button"
                  onClick={() => loadLiveGmailData(gmailSearchQuery)}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold cursor-pointer"
                >
                  Search
                </button>
              </div>
            </div>

            {!googleConnected ? (
              <div className="p-8 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-center space-y-3">
                <p className="text-xs font-semibold text-slate-700">
                  Sign in with Google above to view and manage live Gmail messages
                </p>
                <p className="text-xs text-slate-500">
                  Once connected with permission, your live Gmail inbox/sent threads appear here.
                </p>
              </div>
            ) : gmailMessages.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                {isLoadingGmail ? 'Loading Gmail messages...' : 'No messages found for this query.'}
              </div>
            ) : (
              <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                {gmailMessages.map(msg => (
                  <div
                    key={msg.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 truncate">{msg.subject}</p>
                      <p className="text-[11px] text-slate-600 truncate">
                        From: {msg.from} · To: {msg.to}
                      </p>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">{msg.snippet}</p>
                      <p className="text-[10px] font-mono text-slate-400 mt-1">{msg.date}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => requestTrashGmailMessage(msg)}
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-500 shrink-0 cursor-pointer"
                      title="Move to Gmail Trash"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 3: CENTRAL EVENT & NOTIFICATION ENGINE DISPATCHER               */}
      {/* =================================================================== */}
      {subTab === 'event-engine' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-5">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Central Notification &amp; Event Engine
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Trigger any business or security event (`USER_LOGIN`, `OTP_REQUESTED`, `TASK_ASSIGNED`, `NCR_CREATED`, `INVOICE_ISSUED`, etc.) to resolve RBAC recipients, render the assigned template, attach an authorized portal deep link, and dispatch across Gmail + In-System Notification + Message Panel.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                System Event Type
              </label>
              <select
                value={simEventType}
                onChange={e => setSimEventType(e.target.value as SystemEmailEventType)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
              >
                {EVENT_TYPES.map(ev => (
                  <option key={ev.value} value={ev.value}>
                    {ev.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Direct Recipient Email(s)
              </label>
              <input
                type="text"
                value={simTargetEmails}
                onChange={e => setSimTargetEmails(e.target.value)}
                placeholder="email1@domain.com, email2@domain.com"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                RBAC Role Group Recipient (Optional)
              </label>
              <select
                value={simTargetRole}
                onChange={e => setSimTargetRole(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
              >
                <option value="">Direct Recipients Only</option>
                <option value="ALL">All Active Users (Broadcast)</option>
                {securityService.getRoles().map(r => (
                  <option key={r.id} value={r.id}>
                    Role: {r.name} ({r.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Project Code Scope
              </label>
              <input
                type="text"
                value={simProjectCode}
                onChange={e => setSimProjectCode(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Task / Record Title
              </label>
              <input
                type="text"
                value={simTaskTitle}
                onChange={e => setSimTaskTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Amount / Commercial Value
              </label>
              <input
                type="text"
                value={simAmount}
                onChange={e => setSimAmount(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Scheduled Delivery (Optional)
              </label>
              <input
                type="datetime-local"
                value={simScheduledFor}
                onChange={e => setSimScheduledFor(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Recurring Schedule
              </label>
              <select
                value={simRecurring}
                onChange={e => setSimRecurring(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
              >
                <option value="NONE">One-Time Delivery</option>
                <option value="DAILY">Daily Recurring</option>
                <option value="WEEKLY">Weekly Recurring</option>
                <option value="MONTHLY">Monthly Recurring</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Event Summary / Instruction Body
            </label>
            <textarea
              rows={3}
              value={simSummary}
              onChange={e => setSimSummary(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={requestDispatchSimulatedEvent}
              className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Trigger Event &amp; Send Notification</span>
            </button>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 4: END-TO-END TRACEABILITY LEDGER & RETRY QUEUE                 */}
      {/* =================================================================== */}
      {subTab === 'traces' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                End-to-End Email &amp; Notification Traceability Ledger
              </h3>
              <p className="text-xs text-slate-500">
                Complete audit chain: Event → Portal/Action → Sender → Recipient → Template (v#) → Authorized Deep Link → Delivery Result (Secrets Redacted).
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setPendingConfirm({
                  title: 'Flush Queued Emails via Gmail API?',
                  description:
                    'This will send all queued/retryable emails in the outbox using your connected Google account.',
                  confirmLabel: 'Flush Queue Now',
                  onConfirm: async () => {
                    const res = await centralEmailService.flushQueuedEmails();
                    toast.success(
                      `Queue processed: ${res.sentCount} sent, ${res.failedCount} remaining.`
                    );
                  }
                });
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Flush Outbox Queue</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] text-slate-500 uppercase">
                  <th className="py-2.5 px-3">Trace ID</th>
                  <th className="py-2.5 px-3">Event &amp; Portal</th>
                  <th className="py-2.5 px-3">Template</th>
                  <th className="py-2.5 px-3">Recipients</th>
                  <th className="py-2.5 px-3">Channels</th>
                  <th className="py-2.5 px-3">Delivery Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {traces.map(trc => (
                  <tr key={trc.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-3 font-mono font-bold text-orange-600">
                      {trc.traceCode}
                      <div className="text-[10px] font-normal text-slate-400">
                        {new Date(trc.createdAt).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{trc.eventType}</div>
                      <div className="text-[11px] text-slate-500">
                        {trc.triggeringPortal} · {trc.triggeringAction}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-800">{trc.templateName}</div>
                      <div className="text-[10px] font-mono text-slate-400">
                        {trc.templateCode} (v{trc.templateVersion})
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-medium text-slate-800 truncate max-w-[180px]">
                        {trc.recipients.to.join(', ')}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {trc.recipients.resolvedRuleSummary}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex flex-wrap gap-1">
                        {trc.channelsDispatched.map(ch => (
                          <span
                            key={ch}
                            className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-mono"
                          >
                            {ch}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          trc.status === 'SENT_VIA_GMAIL'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : trc.status === 'FAILED_RETRYABLE'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {trc.status}
                      </span>
                      {trc.gmailMessageId && (
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                          Gmail ID: {trc.gmailMessageId}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setInspectedTrace(trc)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold cursor-pointer"
                        >
                          Trace
                        </button>
                        {trc.status !== 'SENT_VIA_GMAIL' && (
                          <button
                            type="button"
                            onClick={() => {
                              setPendingConfirm({
                                title: `Transmit ${trc.traceCode} via Gmail?`,
                                description: `Send "${trc.subjectRendered}" to ${trc.recipients.to.join(
                                  ', '
                                )} via Gmail API?`,
                                confirmLabel: 'Send via Gmail',
                                onConfirm: async () => {
                                  await centralEmailService.retryDeliveryTrace(trc.id);
                                  toast.success(`Sent ${trc.traceCode} via Gmail`);
                                }
                              });
                            }}
                            className="px-2.5 py-1 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold cursor-pointer"
                          >
                            Send
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 5: NOTIFICATION PREFERENCES & SENDER IDENTITY CONFIG            */}
      {/* =================================================================== */}
      {subTab === 'preferences' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* User Notification Preferences */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                My Notification Preferences ({activeUser?.fullName})
              </h3>
              <p className="text-xs text-slate-500">
                Control non-critical notification categories. Mandatory security &amp; authentication emails cannot be disabled.
              </p>
            </div>

            <div className="space-y-2">
              {TEMPLATE_CATEGORIES.map(cat => {
                const isMandatory = cat === 'Security & Identity';
                const enabled = isMandatory ? true : userPrefs.categories[cat];
                return (
                  <label
                    key={cat}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 cursor-pointer"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900">{cat}</p>
                      <p className="text-[11px] text-slate-500">
                        {isMandatory
                          ? 'Mandatory security & OTP notifications (Locked ON)'
                          : 'Allow email & in-system notifications for this category'}
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={enabled}
                      disabled={isMandatory}
                      onChange={e => {
                        if (isMandatory) return;
                        const updated = centralEmailService.updateUserPreferences(
                          activeUser?.id || 'usr-admin-01',
                          {
                            categories: {
                              ...userPrefs.categories,
                              [cat]: e.target.checked
                            }
                          }
                        );
                        setUserPrefs(updated);
                        toast.success('Notification preferences updated');
                      }}
                      className="w-4 h-4 rounded text-orange-500"
                    />
                  </label>
                );
              })}
            </div>
          </div>

          {/* Admin Sender Identity & Rate-Limit Configuration */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Sender Identity &amp; Delivery Policy
              </h3>
              <p className="text-xs text-slate-500">
                Configure centralized sender branding, reply-to address, and retry policies.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Sender Display Name
                </label>
                <input
                  type="text"
                  value={serviceConfig.senderDisplayName}
                  onChange={e =>
                    setServiceConfig(
                      centralEmailService.updateConfiguration({
                        senderDisplayName: e.target.value
                      })
                    )
                  }
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Default Reply-To / Support Email
                </label>
                <input
                  type="email"
                  value={serviceConfig.senderReplyToEmail}
                  onChange={e =>
                    setServiceConfig(
                      centralEmailService.updateConfiguration({
                        senderReplyToEmail: e.target.value
                      })
                    )
                  }
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Header Brand Title
                </label>
                <input
                  type="text"
                  value={serviceConfig.companyHeaderTitle}
                  onChange={e =>
                    setServiceConfig(
                      centralEmailService.updateConfiguration({
                        companyHeaderTitle: e.target.value
                      })
                    )
                  }
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Rate Limit (Emails / Min)
                  </label>
                  <input
                    type="number"
                    value={serviceConfig.enforceRateLimitPerMinute}
                    onChange={e =>
                      setServiceConfig(
                        centralEmailService.updateConfiguration({
                          enforceRateLimitPerMinute: Number(e.target.value) || 30
                        })
                      )
                    }
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Max Automatic Retries
                  </label>
                  <input
                    type="number"
                    value={serviceConfig.maxRetryAttempts}
                    onChange={e =>
                      setServiceConfig(
                        centralEmailService.updateConfiguration({
                          maxRetryAttempts: Number(e.target.value) || 3
                        })
                      )
                    }
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TRACE INSPECTION MODAL                                              */}
      {/* =================================================================== */}
      {inspectedTrace && (
        <div className="fixed inset-0 z-[220] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-orange-600">
                  {inspectedTrace.traceCode}
                </span>
                <h4 className="text-base font-bold text-slate-900">
                  {inspectedTrace.subjectRendered}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setInspectedTrace(null)}
                className="px-3 py-1 rounded-lg border border-slate-200 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div>
                <strong>Event:</strong> {inspectedTrace.eventType}
              </div>
              <div>
                <strong>Triggering Portal:</strong> {inspectedTrace.triggeringPortal}
              </div>
              <div>
                <strong>Sender:</strong> {inspectedTrace.senderIdentity.name} (
                {inspectedTrace.senderIdentity.email})
              </div>
              <div>
                <strong>Recipients:</strong> {inspectedTrace.recipients.to.join(', ')}
              </div>
              <div>
                <strong>Template:</strong> {inspectedTrace.templateCode} (v
                {inspectedTrace.templateVersion})
              </div>
              <div>
                <strong>Status:</strong> {inspectedTrace.status} (Attempts:{' '}
                {inspectedTrace.deliveryAttempts})
              </div>
              {inspectedTrace.authorizedDeepLink && (
                <div className="col-span-2 truncate">
                  <strong>Authorized Deep Link:</strong>{' '}
                  <span className="font-mono text-[11px] text-orange-600">
                    {inspectedTrace.authorizedDeepLink.url}
                  </span>
                </div>
              )}
            </div>

            <div>
              <p className="text-xs font-bold text-slate-700 mb-1">
                Sanitized Audit Variables (Secrets Masked):
              </p>
              <pre className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] font-mono overflow-x-auto">
                {JSON.stringify(inspectedTrace.sanitizedVariables, null, 2)}
              </pre>
            </div>

            <div>
              <p className="text-xs font-bold text-slate-700 mb-1">Rendered HTML Email:</p>
              <div
                className="p-4 rounded-xl border border-slate-200 bg-slate-100 printable-sheet"
                dangerouslySetInnerHTML={{ __html: inspectedTrace.htmlRendered }}
              />
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* EXPLICIT USER CONFIRMATION MODAL FOR GMAIL API OPERATIONS           */}
      {/* =================================================================== */}
      {pendingConfirm && (
        <div className="fixed inset-0 z-[240] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  pendingConfirm.isDanger
                    ? 'bg-rose-50 text-rose-600'
                    : 'bg-orange-50 text-orange-600'
                }`}
              >
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">{pendingConfirm.title}</h4>
                <p className="text-xs text-slate-600 whitespace-pre-line mt-1">
                  {pendingConfirm.description}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={isExecutingConfirm}
                onClick={() => setPendingConfirm(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isExecutingConfirm}
                onClick={async () => {
                  setIsExecutingConfirm(true);
                  try {
                    await pendingConfirm.onConfirm();
                    setPendingConfirm(null);
                  } catch (err: any) {
                    toast.error(err?.message || 'Operation failed');
                  } finally {
                    setIsExecutingConfirm(false);
                  }
                }}
                className={`px-4 py-2 rounded-xl text-white text-xs font-bold cursor-pointer ${
                  pendingConfirm.isDanger
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-orange-500 hover:bg-orange-600'
                }`}
              >
                {isExecutingConfirm ? 'Processing...' : pendingConfirm.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
