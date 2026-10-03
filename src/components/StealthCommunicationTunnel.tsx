import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search,
  MessageSquare,
  CheckSquare,
  Home,
  Users,
  Megaphone,
  LayoutGrid,
  Settings,
  ShieldCheck,
  PanelLeftClose,
  Filter,
  X,
  MoreHorizontal,
  Pause,
  Check,
  UserPlus,
  ChevronDown,
  Paperclip,
  Smile,
  Image as ImageIcon,
  Compass,
  ClipboardList,
  Send,
  Plus,
  Building2,
  Briefcase,
  Globe,
  Mic,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { useSecurity } from '../context/SecurityContext';
import { Project, Quote, Invoice } from '../types';
import { centralEmailService } from '../services/centralEmailService';
import {
  centralMessagingService,
  ConversationThread,
  ChatMessage,
  LinkedPortalObject,
  MessagePriority,
  MessageAttachment,
  ConversationChannelType,
  ConversationStatus
} from '../services/centralMessagingService';
import { MessageBubbleItem } from './messaging/MessageBubbleItem';
import { RightContextInspector } from './messaging/RightContextInspector';
import {
  PortalObjectPickerModal,
  AssignTaskFormModal,
  NewChannelModal,
  CommunicationAdminModal
} from './messaging/MessagingModals';

export interface StealthCommunicationTunnelProps {
  projects?: Project[];
  quotes?: Quote[];
  invoices?: Invoice[];
  onNavigateToPortal?: (targetView: string, subTab?: string, recordId?: string) => void;
}

type InboxScopeFilter =
  | 'all'
  | 'assigned_to_me'
  | 'unassigned'
  | 'tasks_instructions'
  | 'saved_bookmarked'
  | 'sent_items';

export const StealthCommunicationTunnel: React.FC<StealthCommunicationTunnelProps> = ({
  projects = [],
  quotes = [],
  invoices = [],
  onNavigateToPortal
}) => {
  const { currentUser, effectiveUser, users: allSecurityUsers } = useSecurity();
  const activeUser = effectiveUser || currentUser;
  const isSuperAdmin =
    !activeUser ||
    activeUser.roleId === 'role-superadmin' ||
    activeUser.adminAuthorityLevel === 'SUPER_ADMINISTRATOR' ||
    activeUser.roleId === 'role-enterprise-admin';

  const [refreshTick, setRefreshTick] = useState(0);
  const triggerRefresh = () => setRefreshTick(t => t + 1);

  // Navigation & filter states
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [inboxFilter, setInboxFilter] = useState<InboxScopeFilter>('assigned_to_me');
  const [statusFilter, setStatusFilter] = useState<'all' | ConversationStatus>('all');
  const [channelFilter, setChannelFilter] = useState<'all' | ConversationChannelType>('all');
  const [onlyOpenChip, setOnlyOpenChip] = useState<boolean>(true);
  const [sortNewestChip, setSortNewestChip] = useState<boolean>(true);
  const [showLeftColumn, setShowLeftColumn] = useState<boolean>(true);

  // Authorized threads, portals, policies
  const authorizedThreads = useMemo(
    () => centralMessagingService.getAuthorizedThreadsForUser(activeUser || null),
    [activeUser, refreshTick]
  );

  const authorizedPortals = useMemo(
    () => centralMessagingService.getAuthorizedPortalsForUser(activeUser || null),
    [activeUser, refreshTick]
  );

  const userPolicy = useMemo(
    () => centralMessagingService.getPolicyForUser(activeUser || null),
    [activeUser, refreshTick]
  );

  const allPolicies = useMemo(
    () => centralMessagingService.getAllPolicies(),
    [refreshTick]
  );

  const auditLogs = useMemo(
    () => centralMessagingService.getAuditLogs(),
    [refreshTick]
  );

  const templates = useMemo(
    () => centralMessagingService.getTemplates(),
    [refreshTick]
  );

  // Filtered threads list
  const filteredThreads = useMemo(() => {
    const allMessages = centralMessagingService.getAllMessages();

    return authorizedThreads
      .filter(t => {
        if (sidebarSearch.trim()) {
          const q = sidebarSearch.toLowerCase();
          const matchTitle = t.title.toLowerCase().includes(q);
          const matchSub = t.subtitle.toLowerCase().includes(q);
          const matchMsg = t.lastMessageText.toLowerCase().includes(q);
          if (!matchTitle && !matchSub && !matchMsg) return false;
        }

        if (inboxFilter === 'assigned_to_me' && activeUser) {
          const isAssigned =
            t.assignedToUserId === activeUser.id ||
            t.participantUserIds.includes(activeUser.id) ||
            t.participantUserIds.includes('ALL');
          if (!isAssigned) return false;
        } else if (inboxFilter === 'unassigned') {
          if (t.assignedToUserId) return false;
        } else if (inboxFilter === 'tasks_instructions') {
          const hasTasks = allMessages.some(
            m =>
              m.conversationId === t.id &&
              (m.contentType === 'task' || m.contentType === 'instruction' || m.contentType === 'approval')
          );
          if (!hasTasks) return false;
        } else if (inboxFilter === 'saved_bookmarked') {
          const hasSaved = allMessages.some(m => m.conversationId === t.id && (m.isBookmarked || m.isPinned));
          if (!hasSaved && !t.isPinned) return false;
        } else if (inboxFilter === 'sent_items' && activeUser) {
          const hasSent = allMessages.some(m => m.conversationId === t.id && m.senderId === activeUser.id);
          if (!hasSent) return false;
        }

        if (statusFilter !== 'all' && t.status !== statusFilter) return false;
        if (channelFilter !== 'all' && t.channelType !== channelFilter) return false;
        if (onlyOpenChip && t.status === 'closed') return false;

        return true;
      })
      .sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        const diff = new Date(b.lastActivityIso).getTime() - new Date(a.lastActivityIso).getTime();
        return sortNewestChip ? diff : -diff;
      });
  }, [
    authorizedThreads,
    sidebarSearch,
    inboxFilter,
    statusFilter,
    channelFilter,
    onlyOpenChip,
    sortNewestChip,
    activeUser,
    refreshTick
  ]);

  const [selectedThreadId, setSelectedThreadId] = useState<string>(
    authorizedThreads[0]?.id || 'conv-fac-ops'
  );

  useEffect(() => {
    if (filteredThreads.length > 0 && !filteredThreads.some(t => t.id === selectedThreadId)) {
      setSelectedThreadId(filteredThreads[0].id);
    }
  }, [filteredThreads, selectedThreadId]);

  const activeThread: ConversationThread | null = useMemo(
    () =>
      authorizedThreads.find(t => t.id === selectedThreadId) ||
      filteredThreads[0] ||
      null,
    [authorizedThreads, filteredThreads, selectedThreadId]
  );

  const threadMessages = useMemo(
    () => (activeThread ? centralMessagingService.getMessagesForThread(activeThread.id) : []),
    [activeThread, refreshTick]
  );

  // Composer states
  const [composerText, setComposerText] = useState('');
  const [composerPriority, setComposerPriority] = useState<MessagePriority>('normal');
  const [requireAck, setRequireAck] = useState(false);
  const [attachedPortal, setAttachedPortal] = useState<LinkedPortalObject | undefined>(undefined);
  const [attachedFiles, setAttachedFiles] = useState<MessageAttachment[]>([]);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);

  // Modal states
  const [isPortalPickerOpen, setIsPortalPickerOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskModalInitialText, setTaskModalInitialText] = useState('');
  const [isNewChannelOpen, setIsNewChannelOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [threadMessages.length, selectedThreadId]);

  const handleSelectThread = (threadId: string) => {
    setSelectedThreadId(threadId);
    if (activeUser) {
      centralMessagingService.markThreadRead(threadId, activeUser.id);
      triggerRefresh();
    }
  };

  // Counts for left sidebar
  const counts = useMemo(() => {
    const total = authorizedThreads.length;
    const assigned = activeUser
      ? authorizedThreads.filter(
          t =>
            t.assignedToUserId === activeUser.id ||
            t.participantUserIds.includes(activeUser.id) ||
            t.participantUserIds.includes('ALL')
        ).length
      : total;
    const unassigned = authorizedThreads.filter(t => !t.assignedToUserId).length;
    const openCount = authorizedThreads.filter(t => t.status === 'open').length;
    const awaitingCount = authorizedThreads.filter(t => t.status === 'awaiting_action').length;
    const pausedCount = authorizedThreads.filter(t => t.status === 'paused').length;

    const byChannel = (type: ConversationChannelType) =>
      authorizedThreads.filter(t => t.channelType === type).length;

    return {
      total,
      assigned,
      unassigned,
      openCount,
      awaitingCount,
      pausedCount,
      direct: byChannel('direct'),
      factory: byChannel('factory'),
      project: byChannel('project'),
      department: byChannel('department'),
      client: byChannel('client') + byChannel('supplier'),
      announcement: byChannel('announcement') + byChannel('broadcast')
    };
  }, [authorizedThreads, activeUser]);

  // Send standard/enhanced message
  const handleSendMessage = () => {
    if (!activeThread || (!composerText.trim() && !attachedPortal && attachedFiles.length === 0)) return;
    const sender = activeUser || {
      id: 'usr-superadmin',
      fullName: 'Alexander Vance',
      roleName: 'Super Administrator',
      roleId: 'role-superadmin'
    };

    const initials = sender.fullName
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

    centralMessagingService.sendMessage(
      {
        conversationId: activeThread.id,
        senderId: sender.id,
        senderName: sender.fullName,
        senderRole: sender.roleName,
        senderAvatarInitials: initials,
        contentType: attachedPortal ? 'portal_link' : 'text',
        content:
          composerText.trim() ||
          (attachedPortal ? `Shared system portal link: ${attachedPortal.title}` : 'Shared attachment'),
        priority: composerPriority,
        requiresAcknowledgement: requireAck,
        acknowledgedByUserIds: requireAck ? [sender.id] : undefined,
        replyToMessageId: replyingTo?.id,
        replyToSenderName: replyingTo?.senderName,
        replyToSnippet: replyingTo?.content.slice(0, 80),
        linkedPortal: attachedPortal,
        attachments: attachedFiles.length > 0 ? attachedFiles : undefined,
        quickActions: attachedPortal
          ? [
              {
                id: `qa-${Date.now()}`,
                label: `Open ${attachedPortal.title}`,
                actionType: 'open_portal',
                linkedPortal: attachedPortal
              }
            ]
          : undefined
      },
      activeUser || null
    );

    setComposerText('');
    setAttachedPortal(undefined);
    setAttachedFiles([]);
    setReplyingTo(null);
    setComposerPriority('normal');
    setRequireAck(false);
    setShowSlashMenu(false);
    setShowMentionMenu(false);
    triggerRefresh();
  };

  // Navigate to linked portal with strict RBAC validation
  const handleOpenPortalLink = (portal: LinkedPortalObject) => {
    const allowed = centralMessagingService.canUserOpenLinkedPortal(activeUser || null, portal);
    if (!allowed) {
      toast.error(
        `Access Restricted: Your role (${activeUser?.roleName}) does not have permission for ${portal.title}. Request access from Administrator.`
      );
      return;
    }

    toast.success(`Opening ${portal.title}...`);
    if (onNavigateToPortal) {
      onNavigateToPortal(portal.targetView, portal.targetSubTab, portal.recordId);
    }
  };

  // Attach sample engineering/site document or voice note
  const handleAttachQuickFile = (type: 'dwg' | 'pdf' | 'voice') => {
    const newAtt: MessageAttachment =
      type === 'dwg'
        ? {
            id: `att-${Date.now()}`,
            name: 'Shop_Drawing_Rev05_Structural_Glazing.dwg',
            fileType: 'dwg',
            sizeLabel: '3.6 MB',
            previewText: 'CAD Drawing • IFC Verified'
          }
        : type === 'voice'
        ? {
            id: `att-${Date.now()}`,
            name: 'Site_Voice_Instruction_Note.mp3',
            fileType: 'voice',
            sizeLabel: '420 KB',
            durationLabel: '0:32',
            previewText: 'Recorded Voice Directive'
          }
        : {
            id: `att-${Date.now()}`,
            name: 'QA_Inspection_Checklist_Signed.pdf',
            fileType: 'pdf',
            sizeLabel: '1.1 MB',
            previewText: 'ISO-9001 Quality Record'
          };

    setAttachedFiles(prev => [...prev, newAtt]);
    toast.info(`Attached ${newAtt.name}`);
  };

  const fallbackUser = activeUser || allSecurityUsers[0];

  return (
    <div className="h-[calc(100vh-108px)] min-h-[640px] w-full bg-white border-t border-slate-200 flex overflow-hidden select-none">
      {/* 1. Far-Left Slim Icon Rail matching reference UI */}
      <div className="w-13 shrink-0 bg-[#F8FAFC] border-r border-slate-200 flex flex-col items-center justify-between py-3.5">
        <div className="flex flex-col items-center gap-3">
          {/* Top Brand Chat Icon */}
          <button
            type="button"
            onClick={() => {
              setInboxFilter('all');
              setChannelFilter('all');
              setStatusFilter('all');
            }}
            className="w-8 h-8 rounded-lg bg-[#F04438] text-white flex items-center justify-center shadow-xs hover:opacity-95 transition-opacity"
            title="Innovista Central Communication Hub"
          >
            <MessageSquare className="w-4 h-4" />
          </button>

          <div className="w-6 h-px bg-slate-200 my-0.5" />

          {/* Slim Rail Navigation Icons */}
          <button
            type="button"
            onClick={() => setShowLeftColumn(!showLeftColumn)}
            title="Toggle Filter Sidebar"
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
              showLeftColumn ? 'text-slate-700 hover:bg-slate-200/70' : 'bg-blue-50 text-blue-600'
            }`}
          >
            <Search className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setInboxFilter('tasks_instructions')}
            title="Tasks, Instructions & Approvals Inbox"
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
              inboxFilter === 'tasks_instructions'
                ? 'bg-blue-50 text-blue-600'
                : 'text-slate-500 hover:bg-slate-200/70 hover:text-slate-800'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              if (onNavigateToPortal) onNavigateToPortal('home');
            }}
            title="Return to Innovista Home Center"
            className="w-8 h-8 rounded-lg text-slate-500 hover:bg-slate-200/70 hover:text-slate-800 flex items-center justify-center transition-colors"
          >
            <Home className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsNewChannelOpen(true)}
            title="Create Group, Role Community or Project Chat"
            className="w-8 h-8 rounded-lg text-slate-500 hover:bg-slate-200/70 hover:text-slate-800 flex items-center justify-center transition-colors"
          >
            <Users className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              setInboxFilter('all');
              setChannelFilter('announcement');
            }}
            title="Announcements & System Broadcasts"
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
              channelFilter === 'announcement'
                ? 'bg-blue-50 text-blue-600'
                : 'text-slate-500 hover:bg-slate-200/70 hover:text-slate-800'
            }`}
          >
            <Megaphone className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsPortalPickerOpen(true)}
            title="Attach & Send Portal / System Record Link"
            className="w-8 h-8 rounded-lg text-slate-500 hover:bg-slate-200/70 hover:text-slate-800 flex items-center justify-center transition-colors"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              setInboxFilter('assigned_to_me');
              setChannelFilter('all');
            }}
            title="Active Chat Inbox"
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
              inboxFilter === 'assigned_to_me' && channelFilter === 'all'
                ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-200'
                : 'text-slate-500 hover:bg-slate-200/70'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
          </button>
        </div>

        {/* Bottom Governance & User Avatar */}
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={() => setIsAdminModalOpen(true)}
            title="Communication RBAC Matrix & Audit Trail"
            className="w-8 h-8 rounded-lg text-slate-500 hover:bg-slate-200/70 hover:text-slate-900 flex items-center justify-center transition-colors"
          >
            <ShieldCheck className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              if (onNavigateToPortal) onNavigateToPortal('settings', 'profile');
            }}
            title="Account & Notification Settings"
            className="w-8 h-8 rounded-lg text-slate-500 hover:bg-slate-200/70 hover:text-slate-900 flex items-center justify-center transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>

          <div className="relative" title={`${fallbackUser?.fullName} (${fallbackUser?.roleName})`}>
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center">
              {fallbackUser?.fullName
                .split(' ')
                .map(n => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase() || 'AV'}
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
          </div>
        </div>
      </div>

      {/* 2. Column 1: Chat Navigation Sidebar (INBOX, STATUS, CHANNEL, AGENTS) */}
      {showLeftColumn && (
        <aside className="w-56 shrink-0 bg-[#F8FAFC] border-r border-slate-200 flex flex-col h-full overflow-hidden">
          <div className="px-4 pt-3.5 pb-2.5 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Chat</h2>
            <button
              type="button"
              onClick={() => setIsNewChannelOpen(true)}
              title="New Group, Community or Broadcast"
              className="p-1 rounded-lg hover:bg-slate-200/70 text-slate-600"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Search chat input with ⌘ K */}
          <div className="px-3 mb-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={sidebarSearch}
                onChange={e => setSidebarSearch(e.target.value)}
                placeholder="Search chat"
                className="w-full pl-8 pr-11 py-1.5 bg-slate-200/60 focus:bg-white border border-transparent focus:border-slate-300 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none transition-all"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-white text-[10px] font-medium text-slate-400 shadow-2xs">
                ⌘ K
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-5 text-xs">
            {/* INBOX Section */}
            <div className="space-y-1">
              <p className="px-2 text-[10px] font-semibold text-slate-400 tracking-wider uppercase mb-1.5">
                Inbox
              </p>
              {[
                { id: 'all', label: 'All', count: counts.total },
                { id: 'assigned_to_me', label: 'Assigned to me', count: counts.assigned },
                { id: 'unassigned', label: 'Unassigned', count: counts.unassigned },
                { id: 'tasks_instructions', label: 'Tasks & Instructions' },
                { id: 'saved_bookmarked', label: 'Saved & Pinned' },
                { id: 'sent_items', label: 'Sent Items' }
              ].map(item => {
                const active = inboxFilter === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setInboxFilter(item.id as InboxScopeFilter)}
                    className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors ${
                      active
                        ? 'bg-slate-200/80 text-slate-900 font-semibold'
                        : 'text-slate-600 hover:bg-slate-200/40 hover:text-slate-900'
                    }`}
                  >
                    <span className="truncate">{item.label}</span>
                    {item.count !== undefined && (
                      <span className="text-[11px] font-mono tabular-nums text-slate-500">
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* STATUS Section */}
            <div className="space-y-1">
              <p className="px-2 text-[10px] font-semibold text-slate-400 tracking-wider uppercase mb-1.5">
                Status
              </p>
              {[
                { id: 'all', label: 'All', dot: 'bg-slate-500', count: counts.total },
                { id: 'open', label: 'Agent / Active', dot: 'bg-blue-600', count: counts.openCount },
                { id: 'awaiting_action', label: 'Awaiting action', dot: 'bg-amber-500', count: counts.awaitingCount },
                { id: 'paused', label: 'Paused', dot: 'bg-yellow-500', count: counts.pausedCount }
              ].map(st => {
                const active = statusFilter === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setStatusFilter(st.id as any)}
                    className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors ${
                      active
                        ? 'bg-slate-200/80 text-slate-900 font-semibold'
                        : 'text-slate-600 hover:bg-slate-200/40 hover:text-slate-900'
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <span className={`w-2 h-2 rounded-full ${st.dot} shrink-0`} />
                      <span className="truncate">{st.label}</span>
                    </span>
                    <span className="text-[11px] font-mono tabular-nums text-slate-400">
                      {st.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* CHANNEL Section */}
            <div className="space-y-1">
              <p className="px-2 text-[10px] font-semibold text-slate-400 tracking-wider uppercase mb-1.5">
                Channel
              </p>
              {[
                { id: 'all', label: 'All', icon: MessageSquare, count: counts.total },
                { id: 'factory', label: 'Factory & Shop', icon: Building2, count: counts.factory },
                { id: 'project', label: 'Project Teams', icon: Briefcase, count: counts.project },
                { id: 'department', label: 'Role & Dept', icon: Users, count: counts.department },
                { id: 'client', label: 'Clients & B2B', icon: Globe, count: counts.client },
                { id: 'announcement', label: 'Broadcasts', icon: Megaphone, count: counts.announcement }
              ].map(ch => {
                const Icon = ch.icon;
                const active = channelFilter === ch.id;
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => setChannelFilter(ch.id as any)}
                    className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors ${
                      active
                        ? 'bg-slate-200/80 text-slate-900 font-semibold'
                        : 'text-slate-600 hover:bg-slate-200/40 hover:text-slate-900'
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <Icon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{ch.label}</span>
                    </span>
                    <span className="text-[11px] font-mono tabular-nums text-slate-400">
                      {ch.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* AGENTS / ROLE DIRECTORY Section */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between px-2">
                <p className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase">
                  Agents & Roles
                </p>
                <span className="text-[10px] text-slate-400">{allSecurityUsers.length}</span>
              </div>

              <div className="space-y-1.5">
                {allSecurityUsers.map((u, idx) => {
                  const initials = u.fullName
                    .split(' ')
                    .map(n => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase();
                  const isOnline = u.accountStatus === 'Active' && idx < 9;
                  const badgeColors = [
                    'bg-pink-200 text-pink-900',
                    'bg-emerald-200 text-emerald-900',
                    'bg-slate-200 text-slate-800',
                    'bg-blue-200 text-blue-900',
                    'bg-amber-200 text-amber-900'
                  ];
                  const colorClass = badgeColors[idx % badgeColors.length];

                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        if (!fallbackUser) return;
                        const thread = centralMessagingService.startOrOpenDirectChat(fallbackUser, u);
                        setInboxFilter('all');
                        setChannelFilter('all');
                        setStatusFilter('all');
                        setSelectedThreadId(thread.id);
                        triggerRefresh();
                        toast.success(`Opened direct conversation with ${u.fullName} (${u.roleName})`);
                      }}
                      className="w-full px-2 py-1.5 rounded-lg hover:bg-slate-200/60 flex items-center gap-2.5 text-left transition-colors"
                    >
                      <div className="relative shrink-0">
                        <div
                          className={`w-7 h-7 rounded-full ${colorClass} text-[10px] font-bold flex items-center justify-center`}
                        >
                          {initials}
                        </div>
                        {isOnline && (
                          <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 border border-white" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-slate-800 truncate leading-tight">
                          {u.fullName}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {isOnline ? 'Online' : 'Offline'} · {u.roleName}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* 3. Column 2: Conversation Thread List */}
      <section className="w-[300px] shrink-0 bg-white border-r border-slate-200 flex flex-col h-full overflow-hidden">
        {/* Top User / View Header */}
        <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => setShowLeftColumn(!showLeftColumn)}
              className="p-1 rounded-md hover:bg-slate-100 text-slate-500"
              title="Collapse/Expand Sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
            <h3 className="text-sm font-bold text-slate-900 truncate">
              {fallbackUser?.fullName || 'Alexander Vance'}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setIsNewChannelOpen(true)}
            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold flex items-center gap-1 shrink-0"
          >
            <Plus className="w-3 h-3" />
            <span>New</span>
          </button>
        </div>

        {/* Filter Chips Bar matching "Open x" | "Newest x" in reference screenshot */}
        <div className="px-4 py-2.5 flex items-center gap-2 flex-wrap border-b border-slate-100 shrink-0">
          <button
            type="button"
            onClick={() => {
              setOnlyOpenChip(!onlyOpenChip);
            }}
            className="relative p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
            title="Toggle Open Filter"
          >
            <Filter className="w-3.5 h-3.5" />
            <span className="w-2 h-2 rounded-full bg-orange-500 absolute -top-0.5 -right-0.5 border border-white" />
          </button>

          {onlyOpenChip && (
            <button
              type="button"
              onClick={() => setOnlyOpenChip(false)}
              className="px-2.5 py-1 rounded-lg border border-blue-500 bg-blue-50/40 text-slate-800 text-xs font-medium flex items-center gap-1.5"
            >
              <span>Open</span>
              <X className="w-3 h-3 text-slate-500" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setSortNewestChip(!sortNewestChip)}
            className="px-2.5 py-1 rounded-lg border border-blue-500 bg-blue-50/40 text-slate-800 text-xs font-medium flex items-center gap-1.5"
          >
            <span>{sortNewestChip ? 'Newest' : 'Oldest'}</span>
            <X className="w-3 h-3 text-slate-500" />
          </button>
        </div>

        {/* Thread Cards List */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-1">
          {filteredThreads.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No conversations match the current filter.
            </div>
          ) : (
            filteredThreads.map(thread => {
              const isSelected = activeThread?.id === thread.id;
              return (
                <div
                  key={thread.id}
                  onClick={() => handleSelectThread(thread.id)}
                  className={`p-3 rounded-xl cursor-pointer transition-all flex items-start gap-3 ${
                    isSelected
                      ? 'bg-[#F1F3F5] shadow-2xs'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="relative shrink-0 mt-0.5">
                    <div
                      className={`w-10 h-10 rounded-full ${thread.avatarColor} text-white text-xs font-bold flex items-center justify-center`}
                    >
                      {thread.avatarInitials}
                    </div>
                    {thread.isOnline && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{thread.title}</h4>
                      <MoreHorizontal className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-1">
                      <p className="text-xs text-slate-500 truncate">{thread.lastMessageText}</p>
                      {thread.unreadCount > 0 && (
                        <span className="w-4.5 h-4.5 rounded-full bg-[#F04438] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                          {thread.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* 4. Column 3: Main Active Conversation Stream */}
      <main className="flex-1 bg-white flex flex-col h-full min-w-0 overflow-hidden">
        {activeThread ? (
          <>
            {/* Conversation Header matching screenshot ("Cora Goyette • Online" | "II Pause" | "✓ Close" | Assignee dropdown) */}
            <header className="px-6 py-3 border-b border-slate-200 flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-9 h-9 rounded-full ${activeThread.avatarColor} text-white text-xs font-bold flex items-center justify-center shrink-0`}
                >
                  {activeThread.avatarInitials}
                </div>
                <div className="min-w-0">
                  <h2 className="text-xs font-bold text-slate-900 truncate">{activeThread.title}</h2>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        activeThread.isOnline ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                    />
                    <span>{activeThread.isOnline ? 'Online' : 'Offline'}</span>
                    <span>·</span>
                    <span className="truncate">{activeThread.subtitle}</span>
                  </div>
                </div>
              </div>

              {/* Right Action Controls */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const nextStatus = activeThread.status === 'paused' ? 'open' : 'paused';
                    centralMessagingService.updateThreadStatus(
                      activeThread.id,
                      nextStatus,
                      activeUser || null
                    );
                    triggerRefresh();
                    toast.info(
                      nextStatus === 'paused' ? 'Conversation paused' : 'Conversation resumed'
                    );
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Pause className="w-3.5 h-3.5" />
                  <span>{activeThread.status === 'paused' ? 'Resume' : 'Pause'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const nextStatus = activeThread.status === 'closed' ? 'open' : 'closed';
                    centralMessagingService.updateThreadStatus(
                      activeThread.id,
                      nextStatus,
                      activeUser || null
                    );
                    triggerRefresh();
                    toast.success(
                      nextStatus === 'closed' ? 'Conversation marked closed' : 'Conversation reopened'
                    );
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{activeThread.status === 'closed' ? 'Reopen' : 'Close'}</span>
                </button>

                {/* Role / Assignee Selector Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-1.5"
                    title="Assign Conversation to Role / User"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>

                  {showAssigneeDropdown && (
                    <div className="absolute right-0 top-full mt-1.5 w-60 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 max-h-64 overflow-y-auto">
                      <p className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase">
                        Assign Thread To Account
                      </p>
                      {allSecurityUsers.map(u => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => {
                            centralMessagingService.assignThread(
                              activeThread.id,
                              u.id,
                              u.fullName,
                              activeUser || null
                            );
                            setShowAssigneeDropdown(false);
                            triggerRefresh();
                            toast.success(`Assigned conversation to ${u.fullName}`);
                          }}
                          className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 flex items-center justify-between"
                        >
                          <span className="font-medium text-slate-800 truncate">{u.fullName}</span>
                          <span className="text-[10px] text-slate-400 truncate ml-2">{u.roleName}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </header>

            {/* Message Stream */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {threadMessages.map(msg => (
                <MessageBubbleItem
                  key={msg.id}
                  message={msg}
                  currentUser={fallbackUser}
                  onReply={m => setReplyingTo(m)}
                  onTogglePin={id => {
                    centralMessagingService.toggleMessagePin(id);
                    triggerRefresh();
                  }}
                  onToggleBookmark={id => {
                    centralMessagingService.toggleMessageBookmark(id);
                    triggerRefresh();
                    toast.success('Saved to Bookmarked Messages');
                  }}
                  onToggleReaction={(id, emoji) => {
                    if (!fallbackUser) return;
                    centralMessagingService.toggleReaction(id, emoji, fallbackUser);
                    triggerRefresh();
                  }}
                  onConvertToTask={m => {
                    setTaskModalInitialText(m.content);
                    setIsTaskModalOpen(true);
                  }}
                  onDelete={id => {
                    centralMessagingService.deleteMessage(id, activeUser || null);
                    triggerRefresh();
                  }}
                  onAcknowledge={id => {
                    if (!fallbackUser) return;
                    centralMessagingService.acknowledgeMessage(id, fallbackUser.id);
                    triggerRefresh();
                    toast.success('Directive acknowledged & logged in audit trail');
                  }}
                  onUpdateTaskStatus={(id, status) => {
                    centralMessagingService.updateTaskStatusInMessage(id, status, activeUser || null);
                    triggerRefresh();
                    toast.success(`Task status updated to ${status.replace('_', ' ')}`);
                  }}
                  onUpdateApprovalStatus={(id, decision) => {
                    centralMessagingService.updateApprovalStatusInMessage(
                      id,
                      decision,
                      activeUser || null
                    );
                    triggerRefresh();
                    toast.success(`Request ${decision.replace('_', ' ')}`);
                  }}
                  onOpenPortalLink={handleOpenPortalLink}
                  onQuickReplyText={text => {
                    setComposerText(text);
                  }}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Bottom Composer Area matching screenshot ("Type '/' to use template message", "Assign to Form", "Send ▷") */}
            <div className="px-6 pb-4 pt-2 bg-white relative shrink-0">
              {/* Slash Command Templates Popup */}
              {showSlashMenu && (
                <div className="absolute left-6 bottom-full mb-2 w-96 bg-white rounded-xl shadow-2xl border border-slate-200 py-2 z-50">
                  <div className="px-3 py-1 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700">
                      Slash Message & Portal Templates
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowSlashMenu(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="max-h-56 overflow-y-auto divide-y divide-slate-50">
                    {templates.map(tpl => (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => {
                          setComposerText(tpl.content);
                          setComposerPriority(tpl.defaultPriority);
                          if (tpl.suggestedPortal) setAttachedPortal(tpl.suggestedPortal);
                          setShowSlashMenu(false);
                        }}
                        className="w-full text-left px-3.5 py-2 hover:bg-blue-50/50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-blue-600">
                            {tpl.slashCommand}
                          </span>
                          <span className="text-[10px] text-slate-400">{tpl.category}</span>
                        </div>
                        <p className="text-xs font-semibold text-slate-800">{tpl.title}</p>
                        <p className="text-[11px] text-slate-500 truncate">{tpl.content}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* @Role & @Account Mention Popup */}
              {showMentionMenu && (
                <div className="absolute left-6 bottom-full mb-2 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 py-1.5 z-50 max-h-52 overflow-y-auto">
                  <p className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase">
                    Mention Role or Team Member
                  </p>
                  {[
                    '@Project Manager',
                    '@Factory Manager',
                    '@Quality Inspector',
                    '@Site Supervisor',
                    '@Finance Officer',
                    '@Procurement Officer',
                    ...allSecurityUsers.map(u => `@${u.fullName}`)
                  ].map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        setComposerText(prev => `${prev.replace(/@$/, '')}${tag} `);
                        setShowMentionMenu(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 font-medium"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              )}

              {/* Composer Box Container */}
              <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs focus-within:border-slate-300 transition-all">
                {/* Pending Reply / Portal Link / File Attachments Strip */}
                {(replyingTo || attachedPortal || attachedFiles.length > 0 || composerPriority !== 'normal' || requireAck) && (
                  <div className="flex flex-wrap items-center gap-2 pb-2.5 mb-2.5 border-b border-slate-100 text-xs">
                    {replyingTo && (
                      <div className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 flex items-center gap-2">
                        <span>Replying to {replyingTo.senderName}</span>
                        <button type="button" onClick={() => setReplyingTo(null)}>
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    {attachedPortal && (
                      <div className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-semibold flex items-center gap-1.5">
                        <Compass className="w-3.5 h-3.5" />
                        <span>Portal Link: {attachedPortal.title}</span>
                        <button type="button" onClick={() => setAttachedPortal(undefined)}>
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    {attachedFiles.map(f => (
                      <div
                        key={f.id}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 flex items-center gap-1.5"
                      >
                        <span className="truncate max-w-[160px]">{f.name}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setAttachedFiles(prev => prev.filter(item => item.id !== f.id))
                          }
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}

                    {composerPriority !== 'normal' && (
                      <button
                        type="button"
                        onClick={() => setComposerPriority('normal')}
                        className="px-2 py-0.5 rounded bg-orange-50 text-orange-700 font-semibold uppercase text-[10px]"
                      >
                        Priority: {composerPriority} ×
                      </button>
                    )}

                    {requireAck && (
                      <button
                        type="button"
                        onClick={() => setRequireAck(false)}
                        className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-semibold text-[10px]"
                      >
                        Requires Acknowledgement ×
                      </button>
                    )}
                  </div>
                )}

                {/* Textarea */}
                <textarea
                  rows={2}
                  value={composerText}
                  onChange={e => {
                    const val = e.target.value;
                    setComposerText(val);
                    if (val.endsWith('/')) {
                      setShowSlashMenu(true);
                    } else if (!val.includes('/')) {
                      setShowSlashMenu(false);
                    }
                    if (val.endsWith('@')) {
                      setShowMentionMenu(true);
                    } else {
                      setShowMentionMenu(false);
                    }
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder='Type " / " to use template message, " @ " to mention role/account, or attach a portal...'
                  className="w-full text-xs text-slate-800 placeholder:text-slate-400 bg-transparent resize-none focus:outline-none"
                />

                {/* Composer Bottom Toolbar */}
                <div className="flex items-center justify-between pt-2 mt-1">
                  {/* Left Icons matching Paperclip, Smile, Image, Add Portal/Template */}
                  <div className="flex items-center gap-3 text-slate-500">
                    <button
                      type="button"
                      onClick={() => handleAttachQuickFile('pdf')}
                      title="Attach Document / PDF / BOQ"
                      className="hover:text-slate-800 transition-colors cursor-pointer"
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowMentionMenu(!showMentionMenu)}
                      title="Mention @Role or @User"
                      className="hover:text-slate-800 transition-colors cursor-pointer"
                    >
                      <Smile className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAttachQuickFile('dwg')}
                      title="Attach CAD Shop Drawing / Site Photo"
                      className="hover:text-slate-800 transition-colors cursor-pointer"
                    >
                      <ImageIcon className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsPortalPickerOpen(true)}
                      title="Attach Innovista Portal, Function or System Record Deep-Link"
                      className="hover:text-blue-600 transition-colors flex items-center gap-1 text-xs font-medium cursor-pointer"
                    >
                      <Compass className="w-4 h-4 text-blue-600" />
                      <span className="hidden sm:inline text-slate-600 hover:text-blue-600">
                        Attach Portal
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAttachQuickFile('voice')}
                      title="Record Voice Instruction"
                      className="hover:text-slate-800 transition-colors cursor-pointer"
                    >
                      <Mic className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setComposerPriority(prev =>
                          prev === 'normal'
                            ? 'important'
                            : prev === 'important'
                            ? 'urgent'
                            : prev === 'urgent'
                            ? 'critical'
                            : 'normal'
                        )
                      }
                      title="Cycle Message Priority (Normal / Important / Urgent / Critical)"
                      className={`hover:text-orange-600 transition-colors cursor-pointer ${
                        composerPriority !== 'normal' ? 'text-orange-600' : ''
                      }`}
                    >
                      <AlertCircle className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Right Action Buttons matching "Assign to Form" and orange "Send ▷" */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setTaskModalInitialText(composerText);
                        setIsTaskModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <ClipboardList className="w-3.5 h-3.5 text-slate-600" />
                      <span>Assign to Form</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSendMessage}
                      className="px-4 py-1.5 rounded-xl bg-[#E04F33] hover:bg-[#d04125] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                    >
                      <span>Send</span>
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-12 text-center">
            <p className="text-xs text-slate-400">Select a conversation to begin messaging.</p>
          </div>
        )}
      </main>

      {/* 5. Column 4: Right Context, Attributes, Linked Portals & Team Notes Inspector */}
      <RightContextInspector
        thread={activeThread}
        threadMessages={threadMessages}
        onAddNote={content => {
          if (!activeThread || !fallbackUser) return;
          centralMessagingService.addNoteToThread(activeThread.id, content, fallbackUser);
          triggerRefresh();
          toast.success('Internal note added to thread');
        }}
        onAddAttribute={(label, value) => {
          if (!activeThread) return;
          centralMessagingService.addCustomAttribute(activeThread.id, label, value);
          triggerRefresh();
          toast.success(`Added attribute: ${label}`);
        }}
        onOpenPortalLink={handleOpenPortalLink}
        onOpenPortalPicker={() => setIsPortalPickerOpen(true)}
        onOpenTaskModal={() => {
          setTaskModalInitialText('');
          setIsTaskModalOpen(true);
        }}
      />

      {/* Modals for Attaching Portals/Records, Assigning Tasks/Approvals, Creating Channels, and RBAC Governance */}
      <PortalObjectPickerModal
        isOpen={isPortalPickerOpen}
        onClose={() => setIsPortalPickerOpen(false)}
        authorizedPortals={authorizedPortals}
        projects={projects}
        quotes={quotes}
        invoices={invoices}
        onSelectObject={obj => {
          setAttachedPortal(obj);
          toast.success(`Attached link to ${obj.title}`);
        }}
      />

      <AssignTaskFormModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        users={allSecurityUsers}
        authorizedPortals={authorizedPortals}
        defaultAssigneeId={activeThread?.assignedToUserId}
        initialText={taskModalInitialText}
        onSubmitTaskOrApproval={data => {
          if (!activeThread || !fallbackUser) return;
          const initials = fallbackUser.fullName
            .split(' ')
            .map(n => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();

          centralMessagingService.sendMessage(
            {
              conversationId: activeThread.id,
              senderId: fallbackUser.id,
              senderName: fallbackUser.fullName,
              senderRole: fallbackUser.roleName,
              senderAvatarInitials: initials,
              contentType: data.mode,
              content: data.messageText,
              priority: data.priority,
              linkedPortal: data.linkedPortal,
              taskPayload: data.taskPayload,
              approvalPayload: data.approvalPayload,
              quickActions: data.linkedPortal
                ? [
                    {
                      id: `qa-${Date.now()}`,
                      label: `Open ${data.linkedPortal.title}`,
                      actionType: 'open_portal',
                      linkedPortal: data.linkedPortal
                    }
                  ]
                : undefined
            },
            fallbackUser
          );
          void centralEmailService.triggerEvent({
            eventType:
              data.mode === 'approval'
                ? 'APPROVAL_REQUESTED'
                : data.mode === 'instruction'
                ? 'INSTRUCTION_ISSUED'
                : 'TASK_ASSIGNED',
            triggeringPortal: `Message Panel (${activeThread.title})`,
            triggeringAction: `Dispatched ${data.mode.toUpperCase()} in thread "${activeThread.title}"`,
            senderUserId: fallbackUser.id,
            targetUserIds: data.taskPayload?.assignedToUserId
              ? [data.taskPayload.assignedToUserId]
              : activeThread.assignedToUserId
              ? [activeThread.assignedToUserId]
              : undefined,
            variables: {
              task_code: data.taskPayload?.taskNumber || data.approvalPayload?.referenceCode || 'TSK-2026',
              task_title:
                data.taskPayload?.taskTitle ||
                data.approvalPayload?.requestTitle ||
                activeThread.title,
              due_date: data.taskPayload?.dueDate || new Date().toLocaleDateString('en-GB'),
              document_number:
                data.approvalPayload?.referenceCode ||
                data.taskPayload?.taskNumber ||
                activeThread.id,
              amount: data.approvalPayload?.amountValue || 'N/A',
              summary: data.messageText,
              status: 'Pending Action'
            },
            portalId: data.linkedPortal?.id || 'company-control-center',
            recordId:
              data.taskPayload?.taskNumber ||
              data.approvalPayload?.referenceCode ||
              activeThread.id
          });
          setComposerText('');
          triggerRefresh();
          toast.success('Dispatched to Message Panel & Central Email Service');
        }}
      />

      <NewChannelModal
        isOpen={isNewChannelOpen}
        onClose={() => setIsNewChannelOpen(false)}
        users={allSecurityUsers}
        authorizedPortals={authorizedPortals}
        policy={userPolicy}
        onCreateChannel={params => {
          if (!fallbackUser) return;
          const created = centralMessagingService.createChannelOrGroup(params, fallbackUser);
          setInboxFilter('all');
          setChannelFilter('all');
          setStatusFilter('all');
          setSelectedThreadId(created.id);
          triggerRefresh();
          toast.success(`Created channel "${created.title}"`);
        }}
      />

      <CommunicationAdminModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        policies={allPolicies}
        auditLogs={auditLogs}
        isAdmin={isSuperAdmin}
        onUpdatePolicy={updated => {
          centralMessagingService.updatePolicy(updated, activeUser || null);
          triggerRefresh();
          toast.success(`Updated communication permissions for ${updated.roleName}`);
        }}
      />
    </div>
  );
};
