import React, { useState } from 'react';
import {
  X,
  Compass,
  ClipboardList,
  Users,
  ShieldCheck,
  Briefcase,
  FileText,
  CreditCard,
  ExternalLink,
  Send
} from 'lucide-react';
import { SecurityUser } from '../../types/security';
import { Project, Quote, Invoice } from '../../types';
import {
  LinkedPortalObject,
  MessagePriority,
  MessageTaskPayload,
  MessageApprovalPayload,
  ConversationChannelType,
  RoleCommunicationPolicy,
  MessagingAuditEntry
} from '../../services/centralMessagingService';
import { numberingService } from '../../services/numberingService';

interface PortalObjectPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  authorizedPortals: LinkedPortalObject[];
  projects?: Project[];
  quotes?: Quote[];
  invoices?: Invoice[];
  onSelectObject: (obj: LinkedPortalObject) => void;
}

export const PortalObjectPickerModal: React.FC<PortalObjectPickerModalProps> = ({
  isOpen,
  onClose,
  authorizedPortals,
  projects = [],
  quotes = [],
  invoices = [],
  onSelectObject
}) => {
  const [activeTab, setActiveTab] = useState<'portals' | 'projects' | 'quotes' | 'invoices'>('portals');
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const projectObjects: LinkedPortalObject[] = projects.map(p => ({
    id: `obj-prj-${p.id}`,
    objectType: 'project',
    title: `Project: ${p.projectName}`,
    code: p.projectCode || p.id.slice(0, 8).toUpperCase(),
    subtitle: `${p.client?.name || 'Client'} • Status: ${p.status}`,
    targetView: 'project-details',
    targetPortalId: 'project-management',
    requiredPermission: 'project.view',
    recordId: p.id,
    statusBadge: p.status
  }));

  const quoteObjects: LinkedPortalObject[] = quotes.map(q => ({
    id: `obj-qte-${q.id}`,
    objectType: 'quotation',
    title: `Quotation ${q.quoteNo}: ${q.projectName || q.client.name}`,
    code: q.quoteNo,
    subtitle: `${q.client.name} • LKR ${q.grandTotal.toLocaleString()}`,
    targetView: 'editor',
    targetPortalId: 'sales-crm-quotes',
    requiredPermission: 'quotes.view',
    recordId: q.id,
    statusBadge: q.status
  }));

  const invoiceObjects: LinkedPortalObject[] = invoices.map(inv => ({
    id: `obj-inv-${inv.id}`,
    objectType: 'invoice',
    title: `Invoice ${inv.invoiceNo}: ${inv.client.name}`,
    code: inv.invoiceNo,
    subtitle: `${inv.type} • LKR ${inv.grandTotal.toLocaleString()}`,
    targetView: 'invoices',
    targetPortalId: 'accounting-finance',
    requiredPermission: 'finance.view',
    recordId: inv.id,
    statusBadge: inv.status
  }));

  const listToRender =
    activeTab === 'portals'
      ? authorizedPortals
      : activeTab === 'projects'
      ? projectObjects
      : activeTab === 'quotes'
      ? quoteObjects
      : invoiceObjects;

  const filtered = listToRender.filter(
    item =>
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.code.toLowerCase().includes(search.toLowerCase()) ||
      item.subtitle.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[82vh]">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Attach System Portal, Function or Record</h3>
              <p className="text-xs text-slate-500">
                Recipients with authorized RBAC permissions can open the exact portal or record in 1 click
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 pt-3 pb-2 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            {[
              { id: 'portals', label: `Portals & Functions (${authorizedPortals.length})`, icon: Compass },
              { id: 'projects', label: `Projects (${projectObjects.length})`, icon: Briefcase },
              { id: 'quotes', label: `Quotations (${quoteObjects.length})`, icon: FileText },
              { id: 'invoices', label: `Invoices (${invoiceObjects.length})`, icon: CreditCard }
            ].map(t => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as any)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    activeTab === t.id ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Filter portal or record..."
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 w-52"
          />
        </div>

        <div className="p-5 overflow-y-auto space-y-2 flex-1">
          {filtered.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-400">
              No matching authorized portals or system records found.
            </div>
          ) : (
            filtered.map(item => (
              <div
                key={item.id}
                onClick={() => {
                  onSelectObject(item);
                  onClose();
                }}
                className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition-all flex items-center justify-between gap-3 cursor-pointer group"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 group-hover:text-blue-700">{item.title}</span>
                    <span className="text-[11px] font-mono text-slate-500">· {item.code}</span>
                    {item.statusBadge && (
                      <span className="text-[11px] text-blue-600 font-medium">· {item.statusBadge}</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{item.subtitle}</p>
                </div>
                <button className="px-3 py-1.5 rounded-lg bg-slate-900 group-hover:bg-blue-600 text-white text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors">
                  <span>Attach Link</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

interface AssignTaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: SecurityUser[];
  authorizedPortals: LinkedPortalObject[];
  defaultAssigneeId?: string;
  initialText?: string;
  onSubmitTaskOrApproval: (data: {
    mode: 'task' | 'instruction' | 'approval';
    messageText: string;
    priority: MessagePriority;
    linkedPortal?: LinkedPortalObject;
    taskPayload?: MessageTaskPayload;
    approvalPayload?: MessageApprovalPayload;
  }) => void;
}

export const AssignTaskFormModal: React.FC<AssignTaskFormModalProps> = ({
  isOpen,
  onClose,
  users,
  authorizedPortals,
  defaultAssigneeId,
  initialText = '',
  onSubmitTaskOrApproval
}) => {
  const [mode, setMode] = useState<'task' | 'instruction' | 'approval'>('task');
  const [title, setTitle] = useState(initialText || '');
  const [description, setDescription] = useState('');
  const [assigneeId, setAssigneeId] = useState(defaultAssigneeId || (users[0]?.id ?? 'usr-fac-mgr-1'));
  const [dueDate, setDueDate] = useState('2026-09-29');
  const [priority, setPriority] = useState<MessagePriority>('important');
  const [selectedPortalId, setSelectedPortalId] = useState<string>(authorizedPortals[0]?.id || '');
  const [requestType, setRequestType] = useState<MessageApprovalPayload['requestType']>('BOQ Variation');
  const [amountOrScope, setAmountOrScope] = useState('LKR 4,850,000');

  if (!isOpen) return null;

  const targetUser = users.find(u => u.id === assigneeId) || users[0];
  const linkedPortal = authorizedPortals.find(p => p.id === selectedPortalId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (mode === 'approval') {
      const refCode = numberingService.consumeNextNumber('approval_request');
      onSubmitTaskOrApproval({
        mode: 'approval',
        messageText: description.trim() || `Formal Approval Request: ${title} (${amountOrScope})`,
        priority,
        linkedPortal,
        approvalPayload: {
          approvalId: `apr-${Date.now()}`,
          referenceCode: refCode,
          requestType,
          title: title.trim(),
          amountOrScope,
          status: 'pending',
          linkedPortal
        }
      });
    } else {
      const taskCode = numberingService.consumeNextNumber(mode === 'instruction' ? 'instruction' : 'task');
      onSubmitTaskOrApproval({
        mode,
        messageText:
          description.trim() ||
          `${mode === 'instruction' ? 'Operational Instruction' : 'Assigned Task'} [${taskCode}]: ${title.trim()}`,
        priority,
        linkedPortal,
        taskPayload: {
          taskId: `tsk-${Date.now()}`,
          taskCode,
          title: title.trim(),
          description: description.trim() || title.trim(),
          assignedToUserId: targetUser?.id || 'usr-fac-mgr-1',
          assignedToName: targetUser?.fullName || 'Team Member',
          assignedToRole: targetUser?.roleName || 'Staff',
          dueDate,
          priority,
          status: 'pending',
          progressPercent: 0,
          requiresApproval: true,
          linkedPortal
        }
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Assign Task, Instruction or Approval Form</h3>
              <p className="text-xs text-slate-500">Dispatch structured work items with direct portal deep-links</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
            {[
              { id: 'task', label: 'Task Assignment' },
              { id: 'instruction', label: 'Formal Instruction' },
              { id: 'approval', label: 'Approval Request' }
            ].map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => setMode(item.id as any)}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  mode === item.id ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {mode === 'approval' ? 'Approval Subject / Title' : 'Task or Instruction Title'}
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={
                mode === 'approval'
                  ? 'e.g., Approve Variation VO-12 for Tempered Laminated Glazing'
                  : 'e.g., Complete CNC Cutting & Mitre Inspection for Level 15 Frames'
              }
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-blue-500"
            />
          </div>

          {mode === 'approval' ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Approval Category</label>
                <select
                  value={requestType}
                  onChange={e => setRequestType(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option value="BOQ Variation">BOQ Variation</option>
                  <option value="Purchase Order">Purchase Order</option>
                  <option value="QC Release">QC Release</option>
                  <option value="Dispatch Clearance">Dispatch Clearance</option>
                  <option value="Invoice Sign-off">Invoice Sign-off</option>
                  <option value="Portal Access">Portal Access</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Value / Scope Summary</label>
                <input
                  type="text"
                  value={amountOrScope}
                  onChange={e => setAmountOrScope(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assign To (Role & Account)</label>
                <select
                  value={assigneeId}
                  onChange={e => setAssigneeId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                >
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} ({u.roleName})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Link Target Portal / Module</label>
              <select
                value={selectedPortalId}
                onChange={e => setSelectedPortalId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
              >
                <option value="">None (Message Only)</option>
                {authorizedPortals.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Priority Level</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as MessagePriority)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
              >
                <option value="normal">Normal</option>
                <option value="important">Important</option>
                <option value="urgent">Urgent</option>
                <option value="critical">Critical Escalation</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Detailed Instructions / Remarks</label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Specify exact deliverables, drawing references, or quality tolerances..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-blue-500"
            />
          </div>
        </div>

        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Dispatch to Thread</span>
          </button>
        </div>
      </form>
    </div>
  );
};

interface NewChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: SecurityUser[];
  authorizedPortals: LinkedPortalObject[];
  policy: RoleCommunicationPolicy;
  onCreateChannel: (params: {
    title: string;
    subtitle: string;
    channelType: ConversationChannelType;
    participantUserIds: string[];
    allowedRoleIds: string[];
    allowedDepartments: string[];
    defaultLinkedPortal?: LinkedPortalObject;
    initialMessage: string;
    priority: MessagePriority;
  }) => void;
}

export const NewChannelModal: React.FC<NewChannelModalProps> = ({
  isOpen,
  onClose,
  users,
  authorizedPortals,
  policy,
  onCreateChannel
}) => {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [channelType, setChannelType] = useState<ConversationChannelType>('group');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [selectedPortalId, setSelectedPortalId] = useState<string>(authorizedPortals[0]?.id || '');
  const [initialMessage, setInitialMessage] = useState('');
  const [priority, setPriority] = useState<MessagePriority>('normal');

  if (!isOpen) return null;

  const uniqueRoles = Array.from(new Set(users.map(u => `${u.roleId}:::${u.roleName}`))).map(s => {
    const [id, name] = s.split(':::');
    return { id, name };
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !initialMessage.trim()) return;

    const linkedPortal = authorizedPortals.find(p => p.id === selectedPortalId);
    const matchingUsers =
      selectedRole === 'ALL' ? users.map(u => u.id) : users.filter(u => u.roleId === selectedRole).map(u => u.id);

    onCreateChannel({
      title: title.trim(),
      subtitle: subtitle.trim() || `${channelType.toUpperCase()} • Role & Scope Channel`,
      channelType,
      participantUserIds: matchingUsers,
      allowedRoleIds: selectedRole === 'ALL' ? ['ALL'] : [selectedRole],
      allowedDepartments: ['ALL'],
      defaultLinkedPortal: linkedPortal,
      initialMessage: initialMessage.trim(),
      priority
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Create Group, Community or Broadcast Channel</h3>
              <p className="text-xs text-slate-500">Connect roles, departments, project teams, or factory workshops</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Channel Type</label>
              <select
                value={channelType}
                onChange={e => setChannelType(e.target.value as ConversationChannelType)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
              >
                <option value="group">Team Group Chat</option>
                <option value="department">Department Channel</option>
                <option value="project">Project Coordination Chat</option>
                <option value="factory">Factory / Workshop Channel</option>
                {policy.canCreateCommunities && <option value="community">Cross-Role Community</option>}
                <option value="client">Client B2B Channel</option>
                <option value="supplier">Supplier / Partner Channel</option>
                {policy.canSendAnnouncements && <option value="announcement">Official Announcement</option>}
                {policy.canSystemBroadcast && <option value="broadcast">System-Wide Broadcast</option>}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Role Scope</label>
              <select
                value={selectedRole}
                onChange={e => setSelectedRole(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
              >
                <option value="ALL">All Permitted Roles</option>
                {uniqueRoles.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Channel / Community Name</label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g., Curtain Wall Installation Taskforce — Zone B"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Linked Portal</label>
              <select
                value={selectedPortalId}
                onChange={e => setSelectedPortalId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
              >
                <option value="">None</option>
                {authorizedPortals.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Default Priority</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as MessagePriority)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
              >
                <option value="normal">Normal</option>
                <option value="important">Important</option>
                <option value="urgent">Urgent</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Scope Subtitle</label>
            <input
              type="text"
              value={subtitle}
              onChange={e => setSubtitle(e.target.value)}
              placeholder="e.g., Factory Operations & Site Supervisors"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Opening Message / Directive</label>
            <textarea
              rows={3}
              required
              value={initialMessage}
              onChange={e => setInitialMessage(e.target.value)}
              placeholder="Write the opening message or instruction for this channel..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>
        </div>

        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
          >
            Create Channel & Send
          </button>
        </div>
      </form>
    </div>
  );
};

interface CommunicationAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  policies: RoleCommunicationPolicy[];
  auditLogs: MessagingAuditEntry[];
  isAdmin: boolean;
  onUpdatePolicy: (policy: RoleCommunicationPolicy) => void;
}

export const CommunicationAdminModal: React.FC<CommunicationAdminModalProps> = ({
  isOpen,
  onClose,
  policies,
  auditLogs,
  isAdmin,
  onUpdatePolicy
}) => {
  const [tab, setTab] = useState<'matrix' | 'audit'>('matrix');

  if (!isOpen) return null;

  const toggleField = (policy: RoleCommunicationPolicy, field: keyof RoleCommunicationPolicy) => {
    if (!isAdmin) return;
    onUpdatePolicy({
      ...policy,
      [field]: !policy[field]
    });
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-5xl max-h-[86vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Central Communication Governance & RBAC Matrix
              </h3>
              <p className="text-xs text-slate-500">
                Control who can message whom, create communities, broadcast, assign tasks, and share system portals
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setTab('matrix')}
                className={`px-3 py-1 rounded-md text-xs font-semibold ${
                  tab === 'matrix' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Role Permissions Matrix ({policies.length})
              </button>
              <button
                onClick={() => setTab('audit')}
                className={`px-3 py-1 rounded-md text-xs font-semibold ${
                  tab === 'audit' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Communication Audit Trail ({auditLogs.length})
              </button>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {tab === 'matrix' ? (
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-600">
                    <th className="py-3 px-4">System Role</th>
                    <th className="py-3 px-3 text-center">Message All Roles</th>
                    <th className="py-3 px-3 text-center">Create Groups</th>
                    <th className="py-3 px-3 text-center">Communities</th>
                    <th className="py-3 px-3 text-center">Announcements</th>
                    <th className="py-3 px-3 text-center">Broadcasts</th>
                    <th className="py-3 px-3 text-center">Assign Tasks</th>
                    <th className="py-3 px-3 text-center">Instructions</th>
                    <th className="py-3 px-3 text-center">Share Portals</th>
                    <th className="py-3 px-3 text-center">Controlled Docs</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {policies.map(p => (
                    <tr key={p.roleId} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-4 font-semibold text-slate-900">{p.roleName}</td>
                      {(
                        [
                          'canDirectMessageAllRoles',
                          'canCreateGroups',
                          'canCreateCommunities',
                          'canSendAnnouncements',
                          'canSystemBroadcast',
                          'canAssignTasks',
                          'canSendInstructions',
                          'canSharePortalsAndRecords',
                          'canShareControlledDocuments'
                        ] as (keyof RoleCommunicationPolicy)[]
                      ).map(field => {
                        const enabled = Boolean(p[field]);
                        return (
                          <td key={field} className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              disabled={!isAdmin || p.roleId === 'role-superadmin'}
                              onClick={() => toggleField(p, field)}
                              className={`w-8 h-4.5 rounded-full transition-colors inline-flex items-center px-0.5 ${
                                enabled ? 'bg-blue-600 justify-end' : 'bg-slate-200 justify-start'
                              } ${!isAdmin || p.roleId === 'role-superadmin' ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                              <span className="w-3.5 h-3.5 rounded-full bg-white shadow-2xs" />
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="space-y-2">
              {auditLogs.map(log => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-4 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{log.action}</span>
                      <span className="text-slate-400">·</span>
                      <span className="font-medium text-blue-600">{log.conversationTitle}</span>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-600">
                        {log.actorName} ({log.actorRole})
                      </span>
                    </div>
                    <p className="text-slate-500 mt-0.5">{log.details}</p>
                  </div>
                  <span className="font-mono text-[11px] text-slate-400 shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
