import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Bell,
  X,
  Check,
  Search,
  Megaphone,
  FileText,
  ExternalLink,
  Paperclip,
  Pin,
  Trash2,
  Plus,
  Send,
  Download,
  MessageSquare,
  Upload,
  Edit3,
  Sparkles,
  ListChecks,
  Link2,
  Mail,
  AlarmClock,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import { Notification } from '../types';
import { useSecurity } from '../context/SecurityContext';
import { centralEmailService } from '../services/centralEmailService';
import {
  approvalSlaAlertService,
  subscribeSlaUpdates
} from '../services/approvalSlaAlertService';
import {
  centralMessagingService,
  LinkedPortalObject,
  SYSTEM_PORTAL_DIRECTORY
} from '../services/centralMessagingService';
import {
  notificationNewsService,
  UnifiedAccountNotification,
  NewsSpecialAttachment,
  NewsSpecialLink,
  PublishedNewsBulletin
} from '../services/notificationNewsService';

interface NotificationCenterProps {
  notifications: Notification[];
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
  onDelete: (id: string) => void;
  onAction?: (action: Notification['action']) => void;
  onTogglePin?: (id: string) => void;
  onOpenMessagesPortal?: () => void;
}

type FeedScopeFilter = 'all' | 'deadlines' | 'unread' | 'official_news' | 'tasks_approvals' | 'pinned';

const QUICK_TEMPLATES: {
  label: string;
  type: PublishedNewsBulletin['bulletinType'];
  priority: 'low' | 'medium' | 'high';
  title: string;
  subtitle: string;
  content: string;
  keyPoints: string[];
}[] = [
  {
    label: 'Company Update',
    type: 'Executive News',
    priority: 'medium',
    title: 'Monthly Company & Project Update',
    subtitle: 'All Staff',
    content:
      'Please review the updated project schedule and monthly targets for all active sites and workshops.',
    keyPoints: ['Check updated project timelines', 'Submit weekly progress by Friday']
  },
  {
    label: 'Price Change',
    type: 'Commercial Update',
    priority: 'high',
    title: 'Updated Aluminium & Glass Price List',
    subtitle: 'Sales, BOQ & Procurement',
    content:
      'New material rates for aluminium profiles and glass units are now active in the BOQ Catalog.',
    keyPoints: ['Use new rates for all new quotes', 'Download attached rate sheet']
  },
  {
    label: 'Safety Rule',
    type: 'Safety & HSE Alert',
    priority: 'high',
    title: 'Site Crane & Glass Lifting Safety',
    subtitle: 'Site & Factory Teams',
    content:
      'Check wind speed and safety harnesses before lifting any glass or curtain wall panels.',
    keyPoints: ['Stop crane lifts in high wind', 'Complete daily safety check']
  },
  {
    label: 'Factory Notice',
    type: 'Operations Directive',
    priority: 'medium',
    title: 'Weekly Factory Production Schedule',
    subtitle: 'Workshop & Production',
    content:
      'Updated cutting and assembly schedule for this week. Scan all completed panels before dispatch.',
    keyPoints: ['Update digital job cards', 'Scan QR tags before loading']
  },
  {
    label: 'HR Notice',
    type: 'Policy & HR Circular',
    priority: 'low',
    title: 'Holiday & Timesheet Reminder',
    subtitle: 'All Employees',
    content:
      'Please submit leave requests and overtime sheets before the 25th of this month.',
    keyPoints: ['Submit timesheets by the 25th', 'Contact HR for any questions']
  }
];

const SIMPLE_TOPIC_OPTIONS: {
  value: PublishedNewsBulletin['bulletinType'];
  label: string;
}[] = [
  { value: 'Executive News', label: 'General News' },
  { value: 'Commercial Update', label: 'Price & Sales' },
  { value: 'Operations Directive', label: 'Factory & Work' },
  { value: 'Safety & HSE Alert', label: 'Safety Alert' },
  { value: 'Policy & HR Circular', label: 'HR & Staff' },
  { value: 'System Release', label: 'System Update' }
];

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  onClose,
  onMarkAsRead,
  onClearAll,
  onDelete,
  onAction,
  onTogglePin,
  onOpenMessagesPortal
}) => {
  const {
    currentUser,
    effectiveUser,
    users: allSecurityUsers,
    accessRequests,
    canAccessPortal,
    hasPermission
  } = useSecurity();

  const activeUser = effectiveUser || currentUser;
  const isAdmin =
    !activeUser ||
    activeUser.roleId === 'role-superadmin' ||
    activeUser.adminAuthorityLevel === 'SUPER_ADMINISTRATOR' ||
    activeUser.roleId === 'role-enterprise-admin' ||
    activeUser.roleId === 'role-gm' ||
    hasPermission('security.admin') ||
    hasPermission('settings.manage');

  const [refreshTick, setRefreshTick] = useState(0);
  const triggerRefresh = () => setRefreshTick(t => t + 1);

  useEffect(() => {
    const unsub = subscribeSlaUpdates(() => setRefreshTick(t => t + 1));
    const timer = setInterval(() => {
      approvalSlaAlertService.evaluateAndGetRecords();
      setRefreshTick(t => t + 1);
    }, 3000);
    return () => {
      unsub();
      clearInterval(timer);
    };
  }, []);

  const handleMarkDeadlineOrTaskDone = async (item: UnifiedAccountNotification, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      if (item.sourceKind === 'sla_deadline' && item.slaRecordId) {
        await approvalSlaAlertService.completeSlaRecordAction(item.slaRecordId, activeUser || null, {
          verdict: 'Approved',
          remarks: 'Done'
        });
      }
      notificationNewsService.markItemDone(item.id);
      triggerRefresh();
      toast.success('Task done');
    } catch (err: any) {
      toast.error(err.message || 'Could not mark done');
    }
  };

  const handleSnoozeDeadlineOrTask = async (
    item: UnifiedAccountNotification,
    minutes: number,
    e?: React.MouseEvent
  ) => {
    if (e) e.stopPropagation();
    try {
      if (item.sourceKind === 'sla_deadline' && item.slaRecordId) {
        await approvalSlaAlertService.acknowledgeAndSnoozeSlaRecord(
          item.slaRecordId,
          activeUser || null,
          {
            snoozeDurationMinutes: minutes,
            acknowledgementNote: 'Snoozed',
            syncToGoogleCalendar: true
          }
        );
      } else {
        notificationNewsService.snoozeItem(item.id, minutes);
      }
      triggerRefresh();
      const label = minutes < 60 ? `${minutes}m` : `${Math.round(minutes / 60)}h`;
      toast.info(`Snoozed for ${label}`);
    } catch (err: any) {
      toast.error(err.message || 'Could not snooze');
    }
  };

  // Simple Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [feedFilter, setFeedFilter] = useState<FeedScopeFilter>('all');
  const [domainFilter, setDomainFilter] = useState<string>('all');

  // Note input
  const [noteText, setNoteText] = useState('');

  // In-Portal News Studio State
  const [isPublishingMode, setIsPublishingMode] = useState(false);
  const [editingBulletinId, setEditingBulletinId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [newsTitle, setNewsTitle] = useState('');
  const [newsSubtitle, setNewsSubtitle] = useState('');
  const [newsContent, setNewsContent] = useState('');
  const [newsKeyPoints, setNewsKeyPoints] = useState<string[]>([]);
  const [newKeyPointText, setNewKeyPointText] = useState('');
  const [newsDate, setNewsDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [newsType, setNewsType] =
    useState<PublishedNewsBulletin['bulletinType']>('Executive News');
  const [newsPriority, setNewsPriority] = useState<'low' | 'medium' | 'high'>('high');
  const [newsTargetRoles, setNewsTargetRoles] = useState<string[]>(['ALL']);
  const [newsPortalId, setNewsPortalId] = useState<string>('');
  const [newsAttachments, setNewsAttachments] = useState<NewsSpecialAttachment[]>([]);
  const [newFileName, setNewFileName] = useState('');
  const [newsLinks, setNewsLinks] = useState<NewsSpecialLink[]>([]);
  const [newLinkLabel, setNewLinkLabel] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newsRequireConfirm, setNewsRequireConfirm] = useState(true);
  const [newsPinTop, setNewsPinTop] = useState(true);

  const uniqueRoles = useMemo(() => {
    return Array.from(new Set(allSecurityUsers.map(u => `${u.roleId}:::${u.roleName}`))).map(s => {
      const [id, name] = s.split(':::');
      return { id, name };
    });
  }, [allSecurityUsers]);

  // Unified items
  const unifiedItems: UnifiedAccountNotification[] = useMemo(() => {
    const userId = activeUser?.id || 'usr-superadmin';
    const items: UnifiedAccountNotification[] = [];

    // 0. Active Deadline Alerts (Only a few words; disappears when Done or Snoozed until time comes)
    const activeDeadlines = approvalSlaAlertService.getActiveAlertsForNotificationHub(activeUser || null);
    activeDeadlines.forEach(rec => {
      const notifId = `notif-sla-${rec.id}`;
      if (notificationNewsService.isItemHiddenBySnoozeOrDone(notifId)) {
        return;
      }
      const matchedRole =
        rec.assignedRoles.find(
          r =>
            activeUser?.roleName &&
            (activeUser.roleName.toLowerCase().includes(r.toLowerCase()) ||
              r.toLowerCase().includes(activeUser.roleName.toLowerCase()))
        ) ||
        activeUser?.roleName ||
        rec.assignedRoles[0] ||
        'Assigned to You';
      items.push({
        id: notifId,
        slaRecordId: rec.id,
        deadlineIso: rec.deadlineIso,
        referenceCode: rec.referenceCode,
        sourceKind: 'sla_deadline',
        title: rec.recordTitle,
        subtitle: `${rec.projectName} · Overdue`,
        message: rec.recordDescription,
        category: 'Deadline',
        type: 'error',
        priority: 'high',
        timestamp: rec.lastAlertTriggeredAtIso || rec.deadlineIso,
        isRead: false,
        isPinned: true,
        publishedByName: rec.factoryName,
        publishedByRole: rec.categoryLabel,
        targetScopeLabel: matchedRole,
        action: {
          label: 'Open Portal',
          view: 'operational-control',
          data: { tab: 'quality_hse' }
        },
        attachments: [],
        specialLinks: [],
        notes: notificationNewsService.getNotesForSystemNotification(notifId)
      });
    });

    // 1. News Bulletins
    const bulletins = notificationNewsService.getBulletinsForUser(activeUser || null);
    bulletins.forEach(b => {
      items.push({
        id: b.id,
        referenceCode: b.referenceCode,
        sourceKind: 'admin_news',
        title: b.title,
        subtitle: b.subtitle || 'All Staff',
        message: b.content,
        keyPoints: b.keyPoints || [],
        effectiveDate: b.effectiveDate,
        category: 'News',
        type: b.priority === 'high' ? 'warning' : 'info',
        priority: b.priority,
        timestamp: b.publishedAtIso,
        isRead: b.readByUserIds.includes(userId),
        isPinned: b.pinnedByUserIds.includes(userId) || Boolean(b.isPinnedGlobal),
        publishedByName: b.publishedByName,
        publishedByRole: b.publishedByRole,
        targetScopeLabel: activeUser?.roleName || 'Selected Teams',
        action: b.linkedPortal
          ? {
              label: `Open ${b.linkedPortal.title}`,
              view: b.linkedPortal.targetView,
              data: { tab: b.linkedPortal.targetSubTab }
            }
          : undefined,
        linkedPortal: b.linkedPortal,
        attachments: b.attachments,
        specialLinks: b.specialLinks,
        requiresAcknowledgement: b.requiresAcknowledgement,
        isAcknowledged: b.acknowledgedByUserIds.includes(userId),
        acknowledgedCount: b.acknowledgedByUserIds.length,
        readCount: b.readByUserIds.length,
        notes: b.notes
      });
    });

    // 2. Access Requests (Only user's own requests, or Pending requests requiring Admin review)
    accessRequests.forEach(req => {
      const isMyReq = Boolean(activeUser && (req.requesterId === activeUser.id || (req as any).requesterUserId === activeUser.id));
      const isActionableAdminReq = Boolean(isAdmin && (req.status === 'Pending Review' || req.status === 'Awaiting 2nd Admin Approval'));
      if (isMyReq || isActionableAdminReq) {
        const reqId = `notif-rbac-${req.id}`;
        if (notificationNewsService.isItemHiddenBySnoozeOrDone(reqId)) {
          return;
        }
        const isApproved = req.status === 'Admin Approved' || req.status === 'Manager Approved';
        const isPending = req.status === 'Pending Review' || req.status === 'Awaiting 2nd Admin Approval';
        const targetRes = req.requestedItem || req.requestedResource || 'Resource';
        const reasonText = req.justification || req.reason || 'Standard authorization requested';
        const reqTime = req.createdAt || req.requestedAt || new Date().toISOString();
        items.push({
          id: reqId,
          referenceCode: `ACC-${req.id.slice(-4).toUpperCase()}`,
          sourceKind: 'security_rbac',
          title:
            isApproved
              ? `Access Approved: ${targetRes}`
              : `Access Request: ${targetRes}`,
          subtitle: req.requesterName,
          message:
            isApproved
              ? `Access granted to "${targetRes}" for ${req.requesterName}.`
              : `${req.requesterName} requested access to "${targetRes}". Reason: ${reasonText}`,
          category: 'Security',
          type: isApproved ? 'success' : 'info',
          priority: isPending ? 'high' : 'medium',
          timestamp: reqTime,
          isRead: !isPending,
          isPinned: isPending,
          publishedByName: req.reviewedBy || 'Security',
          publishedByRole: 'Admin',
          targetScopeLabel: isMyReq ? activeUser?.fullName || req.requesterName : 'Security Admin',
          action: isAdmin
            ? { label: 'Open Access Control', view: 'settings', data: { tab: 'access-control' } }
            : { label: 'Go Home', view: 'home' },
          attachments: [],
          specialLinks: [],
          notes: notificationNewsService.getNotesForSystemNotification(reqId)
        });
      }
    });

    // 3. Assigned Tasks (Strictly tasks assigned to the active user/role)
    const allChatMessages = centralMessagingService.getAllMessages();
    allChatMessages.forEach(m => {
      if (!activeUser || !m.taskPayload || m.taskPayload.status === 'completed') {
        return;
      }
      const tp = m.taskPayload;
      const isDirectIdMatch = tp.assignedToUserId === activeUser.id;
      const isNameMatch = Boolean(
        tp.assignedToName &&
          activeUser.fullName &&
          tp.assignedToName.toLowerCase() === activeUser.fullName.toLowerCase()
      );
      const isRoleMatch = Boolean(
        tp.assignedToRole &&
          activeUser.roleName &&
          activeUser.roleName.toLowerCase().includes(tp.assignedToRole.toLowerCase())
      );

      if (isDirectIdMatch || isNameMatch || isRoleMatch) {
        const tId = `notif-task-${m.id}`;
        if (notificationNewsService.isItemHiddenBySnoozeOrDone(tId)) {
          return;
        }
        items.push({
          id: tId,
          referenceCode: tp.taskCode,
          sourceKind: 'task_assignment',
          title: tp.title,
          subtitle: `Due ${tp.dueDate}`,
          message: tp.description.split('.')[0] + '.',
          category: 'Task',
          type:
            tp.priority === 'urgent' || tp.priority === 'critical'
              ? 'warning'
              : 'info',
          priority: tp.priority === 'normal' ? 'medium' : 'high',
          timestamp: m.createdAtIso,
          isRead: false,
          isPinned: true,
          publishedByName: m.senderName,
          publishedByRole: m.senderRole,
          targetScopeLabel: activeUser.fullName || tp.assignedToName,
          linkedPortal: tp.linkedPortal,
          action: tp.linkedPortal
            ? {
                label: `Open ${tp.linkedPortal.title}`,
                view: tp.linkedPortal.targetView,
                data: { tab: tp.linkedPortal.targetSubTab }
              }
            : { label: 'Open Messages', view: 'stealth-tunnel' },
          attachments: [],
          specialLinks: [],
          notes: notificationNewsService.getNotesForSystemNotification(tId)
        });
      }
    });

    // 4. System Notifications (Strictly filtered for active user relevance)
    notifications.forEach(n => {
      if (notificationNewsService.isItemHiddenBySnoozeOrDone(n.id)) {
        return;
      }
      if (!notificationNewsService.isSystemNotificationEligibleForUser(n, activeUser || null)) {
        return;
      }
      const resolvedPortal = notificationNewsService.resolvePortalForNotification(n);
      items.push({
        id: n.id,
        referenceCode: `ALT-${n.id.slice(-4).toUpperCase()}`,
        sourceKind: 'system_alert',
        title: n.title,
        subtitle: n.category || 'Alert',
        message: n.message,
        category: n.category || 'Alert',
        type: n.type,
        priority: n.priority || 'medium',
        timestamp: n.timestamp,
        isRead: n.isRead,
        isPinned: Boolean(n.isPinned),
        publishedByName: 'System',
        publishedByRole: n.category || 'Alert',
        targetScopeLabel: activeUser?.fullName || 'You',
        action:
          n.action ||
          (resolvedPortal
            ? {
                label: `Open ${resolvedPortal.title}`,
                view: resolvedPortal.targetView,
                data: { tab: resolvedPortal.targetSubTab }
              }
            : undefined),
        linkedPortal: resolvedPortal,
        attachments: [],
        specialLinks: [],
        notes: notificationNewsService.getNotesForSystemNotification(n.id)
      });
    });

    const seen = new Set<string>();
    return items.filter(it => {
      if (seen.has(it.id)) return false;
      seen.add(it.id);
      return true;
    });
  }, [notifications, activeUser, accessRequests, isAdmin, refreshTick]);

  const filteredItems = useMemo(() => {
    return unifiedItems
      .filter(item => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const match =
            item.title.toLowerCase().includes(q) ||
            item.message.toLowerCase().includes(q) ||
            item.category.toLowerCase().includes(q);
          if (!match) return false;
        }

        if (feedFilter === 'deadlines' && item.sourceKind !== 'sla_deadline') return false;
        if (feedFilter === 'unread' && item.isRead) return false;
        if (feedFilter === 'official_news' && item.sourceKind !== 'admin_news') return false;
        if (
          feedFilter === 'tasks_approvals' &&
          item.sourceKind !== 'sla_deadline' &&
          item.sourceKind !== 'task_assignment' &&
          item.sourceKind !== 'security_rbac'
        ) {
          return false;
        }
        if (feedFilter === 'pinned' && !item.isPinned) return false;

        if (domainFilter !== 'all') {
          const catLower = item.category.toLowerCase();
          const titleLower = item.title.toLowerCase();
          if (domainFilter === 'news' && item.sourceKind !== 'admin_news') return false;
          if (
            domainFilter === 'finance' &&
            !titleLower.includes('invoice') &&
            !titleLower.includes('payment') &&
            !catLower.includes('status') &&
            !catLower.includes('accounting')
          ) {
            return false;
          }
          if (
            domainFilter === 'projects' &&
            !titleLower.includes('project') &&
            !catLower.includes('variation') &&
            !catLower.includes('boq')
          ) {
            return false;
          }
          if (
            domainFilter === 'operations' &&
            item.sourceKind !== 'task_assignment' &&
            !catLower.includes('operations') &&
            !catLower.includes('safety')
          ) {
            return false;
          }
          if (domainFilter === 'security' && item.sourceKind !== 'security_rbac') return false;
        }

        return true;
      })
      .sort((a, b) => {
        if ((a.sourceKind === 'sla_deadline') !== (b.sourceKind === 'sla_deadline')) {
          return a.sourceKind === 'sla_deadline' ? -1 : 1;
        }
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });
  }, [unifiedItems, searchQuery, feedFilter, domainFilter]);

  const [selectedItemId, setSelectedItemId] = useState<string>(
    filteredItems[0]?.id || unifiedItems[0]?.id || ''
  );

  useEffect(() => {
    if (filteredItems.length > 0 && !filteredItems.some(i => i.id === selectedItemId)) {
      setSelectedItemId(filteredItems[0].id);
    }
  }, [filteredItems, selectedItemId]);

  const activeItem: UnifiedAccountNotification | null = useMemo(
    () => unifiedItems.find(i => i.id === selectedItemId) || filteredItems[0] || null,
    [unifiedItems, filteredItems, selectedItemId]
  );

  const counts = useMemo(() => {
    return {
      total: unifiedItems.length,
      deadlines: unifiedItems.filter(i => i.sourceKind === 'sla_deadline').length,
      unread: unifiedItems.filter(i => !i.isRead).length,
      news: unifiedItems.filter(i => i.sourceKind === 'admin_news').length,
      tasks: unifiedItems.filter(
        i =>
          i.sourceKind === 'sla_deadline' ||
          i.sourceKind === 'task_assignment' ||
          i.sourceKind === 'security_rbac'
      ).length,
      pinned: unifiedItems.filter(i => i.isPinned).length
    };
  }, [unifiedItems]);

  const handleSelectItem = (item: UnifiedAccountNotification) => {
    setIsPublishingMode(false);
    setSelectedItemId(item.id);
    if (!item.isRead) {
      if (item.sourceKind === 'admin_news') {
        notificationNewsService.markBulletinRead(item.id, activeUser?.id || 'usr-superadmin');
        triggerRefresh();
      } else {
        onMarkAsRead(item.id);
      }
    }
  };

  const handleToggleItemPin = (item: UnifiedAccountNotification) => {
    if (item.sourceKind === 'admin_news') {
      notificationNewsService.toggleBulletinPin(item.id, activeUser?.id || 'usr-superadmin');
      triggerRefresh();
    } else if (onTogglePin) {
      onTogglePin(item.id);
    }
  };

  const handleDeleteItem = (item: UnifiedAccountNotification) => {
    if (item.sourceKind === 'admin_news') {
      if (!isAdmin) {
        toast.error('Only Admins can delete news.');
        return;
      }
      notificationNewsService.deleteBulletin(item.id);
      triggerRefresh();
      toast.success('News deleted');
    } else {
      onDelete(item.id);
    }
  };

  const handleExecutePortalAction = (
    item: UnifiedAccountNotification,
    portalObj?: LinkedPortalObject
  ) => {
    if (portalObj) {
      const allowed = centralMessagingService.canUserOpenLinkedPortal(activeUser || null, portalObj);
      if (!allowed) {
        toast.error(`No access to ${portalObj.title}.`);
        return;
      }
      if (onAction) {
        onAction({
          label: `Open ${portalObj.title}`,
          view: portalObj.targetView,
          data: { tab: portalObj.targetSubTab }
        });
      }
      onClose();
      return;
    }

    if (item.action && onAction) {
      onAction(item.action);
      onClose();
    }
  };

  const handleDownloadAttachment = (att: NewsSpecialAttachment) => {
    const content = `INNOVISTA FILE\nName: ${att.name}\nDate: ${new Date().toLocaleDateString()}`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = att.name;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${att.name}`);
  };

  const handleSaveNote = () => {
    if (!activeItem || !noteText.trim()) return;
    const author = activeUser || allSecurityUsers[0];
    if (!author) return;
    notificationNewsService.addNoteToItem(activeItem.id, noteText.trim(), author);
    setNoteText('');
    triggerRefresh();
    toast.success('Note saved');
  };

  // Start New or Edit News Studio
  const startNewNews = () => {
    setEditingBulletinId(null);
    setNewsTitle('');
    setNewsSubtitle('');
    setNewsContent('');
    setNewsKeyPoints([]);
    setNewKeyPointText('');
    setNewsDate(new Date().toISOString().slice(0, 10));
    setNewsType('Executive News');
    setNewsPriority('high');
    setNewsTargetRoles(['ALL']);
    setNewsPortalId('');
    setNewsAttachments([]);
    setNewsLinks([]);
    setNewsRequireConfirm(true);
    setNewsPinTop(true);
    setIsPublishingMode(true);
  };

  const startEditNews = (itemId: string) => {
    const existing = notificationNewsService.getBulletinById(itemId);
    if (!existing) return;
    setEditingBulletinId(existing.id);
    setNewsTitle(existing.title);
    setNewsSubtitle(existing.subtitle);
    setNewsContent(existing.content);
    setNewsKeyPoints(existing.keyPoints || []);
    setNewKeyPointText('');
    setNewsDate(existing.effectiveDate || existing.publishedAtIso.slice(0, 10));
    setNewsType(existing.bulletinType);
    setNewsPriority(existing.priority);
    setNewsTargetRoles(existing.targetRoleIds || ['ALL']);
    setNewsPortalId(existing.linkedPortal?.id || '');
    setNewsAttachments(existing.attachments || []);
    setNewsLinks((existing.specialLinks || []).filter(l => l.linkType !== 'portal'));
    setNewsRequireConfirm(existing.requiresAcknowledgement);
    setNewsPinTop(existing.isPinnedGlobal ?? true);
    setIsPublishingMode(true);
  };

  const applyNewsTemplate = (tpl: (typeof QUICK_TEMPLATES)[number]) => {
    setNewsTitle(tpl.title);
    setNewsSubtitle(tpl.subtitle);
    setNewsContent(tpl.content);
    setNewsKeyPoints([...tpl.keyPoints]);
    setNewsType(tpl.type);
    setNewsPriority(tpl.priority);
  };

  const toggleTargetRole = (roleId: string) => {
    if (roleId === 'ALL') {
      setNewsTargetRoles(['ALL']);
      return;
    }
    setNewsTargetRoles(prev => {
      const clean = prev.filter(r => r !== 'ALL');
      if (clean.includes(roleId)) {
        const next = clean.filter(r => r !== roleId);
        return next.length === 0 ? ['ALL'] : next;
      }
      return [...clean, roleId];
    });
  };

  const handleAddKeyPoint = () => {
    if (!newKeyPointText.trim()) return;
    setNewsKeyPoints(prev => [...prev, newKeyPointText.trim()]);
    setNewKeyPointText('');
  };

  const handleUploadNewsFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf';
      const fileType: NewsSpecialAttachment['fileType'] =
        ext === 'dwg'
          ? 'dwg'
          : ext === 'xlsx' || ext === 'xls' || ext === 'csv'
          ? 'xlsx'
          : ext === 'png' || ext === 'jpg' || ext === 'jpeg' || ext === 'webp'
          ? 'image'
          : 'pdf';
      const kb = Math.max(1, Math.round(file.size / 1024));
      const sizeLabel = kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`;
      setNewsAttachments(prev => [
        ...prev,
        {
          id: `natt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: file.name,
          fileType,
          sizeLabel,
          description: 'File'
        }
      ]);
    });
    if (e.target) e.target.value = '';
  };

  const handleQuickAddFile = () => {
    if (!newFileName.trim()) return;
    const name = newFileName.includes('.') ? newFileName.trim() : `${newFileName.trim()}.pdf`;
    setNewsAttachments(prev => [
      ...prev,
      {
        id: `natt-${Date.now()}`,
        name,
        fileType: 'pdf',
        sizeLabel: '1.2 MB',
        description: 'File'
      }
    ]);
    setNewFileName('');
  };

  const handleAddWebLink = () => {
    if (!newLinkLabel.trim()) return;
    setNewsLinks(prev => [
      ...prev,
      {
        id: `nlnk-${Date.now()}`,
        label: newLinkLabel.trim(),
        url: newLinkUrl.trim() || 'https://innovista.lk',
        linkType: 'external_url'
      }
    ]);
    setNewLinkLabel('');
    setNewLinkUrl('');
  };

  const handlePublishOrSaveNews = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsTitle.trim() || !newsContent.trim()) {
      toast.error('Please enter a title and message.');
      return;
    }

    const publisher = activeUser || allSecurityUsers[0];
    if (!publisher) return;

    const linkedPortal = SYSTEM_PORTAL_DIRECTORY.find(p => p.id === newsPortalId);
    const subtitleVal =
      newsSubtitle.trim() || (newsTargetRoles.includes('ALL') ? 'All Staff' : 'Selected Teams');

    if (editingBulletinId) {
      notificationNewsService.updateNewsBulletin(editingBulletinId, {
        title: newsTitle.trim(),
        subtitle: subtitleVal,
        content: newsContent.trim(),
        keyPoints: newsKeyPoints,
        effectiveDate: newsDate,
        bulletinType: newsType,
        priority: newsPriority,
        targetRoleIds: newsTargetRoles,
        attachments: newsAttachments,
        specialLinks: newsLinks,
        linkedPortal,
        requiresAcknowledgement: newsRequireConfirm,
        isPinnedGlobal: newsPinTop
      });
      setIsPublishingMode(false);
      setSelectedItemId(editingBulletinId);
      triggerRefresh();
      toast.success('News updated');
    } else {
      const created = notificationNewsService.publishNewsBulletin(
        {
          title: newsTitle.trim(),
          subtitle: subtitleVal,
          content: newsContent.trim(),
          keyPoints: newsKeyPoints,
          effectiveDate: newsDate,
          bulletinType: newsType,
          priority: newsPriority,
          targetRoleIds: newsTargetRoles,
          targetDepartments: ['ALL'],
          attachments: newsAttachments,
          specialLinks: newsLinks,
          linkedPortal,
          requiresAcknowledgement: newsRequireConfirm,
          isPinnedGlobal: newsPinTop
        },
        publisher
      );
      void centralEmailService.triggerEvent({
        eventType:
          newsType === 'Safety & HSE Alert' && newsPriority === 'high'
            ? 'MAINTENANCE_EMERGENCY'
            : 'SYSTEM_ANNOUNCEMENT',
        triggeringPortal: 'Notification & News Portal',
        triggeringAction: `Published News Bulletin: ${created.title} (${created.referenceCode})`,
        senderUserId: publisher.id,
        targetRoleIds: newsTargetRoles,
        variables: {
          document_number: created.referenceCode,
          task_title: created.title,
          summary: `${created.content}${
            newsKeyPoints.length > 0 ? `\n\nKey Points:\n• ${newsKeyPoints.join('\n• ')}` : ''
          }`,
          status: created.bulletinType
        },
        portalId: linkedPortal?.id || 'company-control-center',
        recordId: created.referenceCode,
        attachments: newsAttachments.map(a => ({
          name: a.name,
          mimeType: 'application/pdf',
          sizeBytes: 256000
        }))
      });
      setIsPublishingMode(false);
      setFeedFilter('all');
      setSelectedItemId(created.id);
      triggerRefresh();
      toast.success('News published & queued for email delivery');
    }
  };

  // Deduplicated extra links for the active item (excluding primary action label so it never repeats)
  const uniqueExtraLinks = useMemo(() => {
    if (!activeItem) return [];
    const primaryLabel = activeItem.action?.label?.toLowerCase().trim();
    const seenLabels = new Set<string>();
    if (primaryLabel) seenLabels.add(primaryLabel);

    return activeItem.specialLinks.filter(lnk => {
      const key = lnk.label.toLowerCase().trim();
      if (seenLabels.has(key)) return false;
      seenLabels.add(key);
      return true;
    });
  }, [activeItem]);

  return (
    <div className="fixed inset-0 z-[180] w-screen h-screen bg-white flex overflow-hidden select-none">
      {/* 1. Simple Left Menu */}
      <aside className="w-52 shrink-0 bg-slate-50 border-r border-slate-200 flex flex-col justify-between h-full p-4">
        <div className="space-y-5">
          {/* Brand Title */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                <Bell className="w-3.5 h-3.5" />
              </div>
              <span className="text-sm font-bold text-slate-900">Notifications</span>
            </div>
          </div>

          {/* Primary Publish News Button */}
          {isAdmin && (
            <button
              type="button"
              onClick={startNewNews}
              className={`w-full py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                isPublishingMode && !editingBulletinId
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'bg-slate-900 hover:bg-slate-800 text-white'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Publish News</span>
            </button>
          )}

          {/* Simple Views */}
          <div className="space-y-1">
            {[
              { id: 'all', label: 'All', count: counts.total },
              { id: 'deadlines', label: 'Deadlines', count: counts.deadlines },
              { id: 'unread', label: 'Unread', count: counts.unread },
              { id: 'official_news', label: 'News', count: counts.news },
              { id: 'tasks_approvals', label: 'Tasks', count: counts.tasks },
              { id: 'pinned', label: 'Saved', count: counts.pinned }
            ].map(item => {
              const active = !isPublishingMode && feedFilter === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setIsPublishingMode(false);
                    setFeedFilter(item.id as FeedScopeFilter);
                  }}
                  className={`w-full px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                    active
                      ? 'bg-white text-slate-900 font-semibold shadow-2xs border border-slate-200/80'
                      : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
                  }`}
                >
                  <span>{item.label}</span>
                  <span className="text-[11px] font-mono tabular-nums text-slate-400">
                    {item.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Simple Topics */}
          <div className="space-y-1 pt-2 border-t border-slate-200/80">
            <p className="px-3 text-[11px] font-medium text-slate-400 mb-1">Topics</p>
            {[
              { id: 'all', label: 'All Topics' },
              { id: 'news', label: 'News' },
              ...(isAdmin || canAccessPortal('accounting-finance')
                ? [{ id: 'finance', label: 'Finance' }]
                : []),
              ...(isAdmin || canAccessPortal('project-management')
                ? [{ id: 'projects', label: 'Projects' }]
                : []),
              ...(isAdmin || canAccessPortal('factory-workshop-management')
                ? [{ id: 'operations', label: 'Factory' }]
                : []),
              { id: 'security', label: 'Security' }
            ].map(ch => {
              const active = !isPublishingMode && domainFilter === ch.id;
              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => {
                    setIsPublishingMode(false);
                    setDomainFilter(ch.id);
                  }}
                  className={`w-full px-3 py-1.5 rounded-lg text-xs text-left transition-colors cursor-pointer ${
                    active
                      ? 'bg-slate-200/80 text-slate-900 font-semibold'
                      : 'text-slate-600 hover:bg-slate-200/40 hover:text-slate-900'
                  }`}
                >
                  {ch.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Simple Bottom Controls */}
        <div className="space-y-1.5 pt-3 border-t border-slate-200">
          {onOpenMessagesPortal && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenMessagesPortal();
              }}
              className="w-full px-3 py-2 rounded-lg text-xs text-slate-600 hover:bg-slate-200/60 hover:text-slate-900 flex items-center gap-2 cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Messages</span>
            </button>
          )}

          {onAction && (
            <button
              type="button"
              onClick={() => {
                onAction({
                  label: 'Gmail & Email Templates',
                  view: 'settings',
                  data: { tab: 'email-templates' }
                });
                onClose();
              }}
              className="w-full px-3 py-2 rounded-lg text-xs text-slate-600 hover:bg-slate-200/60 hover:text-slate-900 flex items-center gap-2 cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email & Templates</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClearAll}
            className="w-full px-3 py-2 rounded-lg text-xs text-slate-600 hover:bg-slate-200/60 hover:text-slate-900 text-left cursor-pointer"
          >
            Clear Read
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full px-3 py-2 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Exit</span>
          </button>
        </div>
      </aside>

      {/* 2. Simple Feed List */}
      <section className="w-85 shrink-0 bg-white border-r border-slate-200 flex flex-col h-full overflow-hidden">
        {/* Search Bar */}
        <div className="p-3.5 border-b border-slate-100">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full pl-8 pr-7 py-2 bg-slate-100/80 focus:bg-white border border-transparent focus:border-slate-300 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {filteredItems.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-400">No items found.</div>
          ) : (
            filteredItems.map(item => {
              const isSelected = !isPublishingMode && activeItem?.id === item.id;
              const isNews = item.sourceKind === 'admin_news';
              const isDeadlineOrTask =
                item.sourceKind === 'sla_deadline' || item.sourceKind === 'task_assignment';
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelectItem(item)}
                  className={`px-4 py-3.5 cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-slate-100/90'
                      : item.sourceKind === 'sla_deadline'
                      ? 'bg-rose-50/40 hover:bg-rose-50/80'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      {!item.isRead && (
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            item.sourceKind === 'sla_deadline' ? 'bg-rose-600' : 'bg-blue-600'
                          }`}
                        />
                      )}
                      <span
                        className={
                          item.sourceKind === 'sla_deadline'
                            ? 'font-bold text-rose-600'
                            : isNews
                            ? 'font-semibold text-orange-600'
                            : 'font-medium'
                        }
                      >
                        {item.category}
                      </span>
                      <span>·</span>
                      <span>
                        {new Date(item.timestamp).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    {item.isPinned && <Pin className="w-3 h-3 text-slate-400 shrink-0" />}
                  </div>

                  <h4
                    className={`text-xs truncate ${
                      !item.isRead ? 'font-bold text-slate-900' : 'font-medium text-slate-800'
                    }`}
                  >
                    {item.title}
                  </h4>

                  <p className="text-xs text-slate-500 truncate mt-0.5">{item.message}</p>

                  {isDeadlineOrTask && (
                    <div className="mt-2 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={e => handleMarkDeadlineOrTaskDone(item, e)}
                        className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3 h-3" /> Done
                      </button>
                      <button
                        type="button"
                        onClick={e => handleSnoozeDeadlineOrTask(item, 1, e)}
                        className="px-2 py-0.5 rounded bg-amber-100 hover:bg-amber-200 text-amber-900 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                        title="Snooze 1 minute"
                      >
                        <AlarmClock className="w-3 h-3" /> Snooze 1m
                      </button>
                      <button
                        type="button"
                        onClick={e => handleSnoozeDeadlineOrTask(item, 30, e)}
                        className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold cursor-pointer"
                        title="Snooze 30 minutes"
                      >
                        30m
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* 3. Main Full-Height Workspace: Either News Publisher Studio OR Simple Reader */}
      <main className="flex-1 bg-white flex flex-col h-full min-w-0 overflow-hidden">
        {isPublishingMode ? (
          /* ENHANCED NEWS PUBLISHING STUDIO */
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Top Bar */}
            <header className="px-8 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <Megaphone className="w-5 h-5 text-orange-600" />
                <h2 className="text-base font-bold text-slate-900">
                  {editingBulletinId ? 'Edit News' : 'Publish News'}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPublishingMode(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handlePublishOrSaveNews}
                  className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{editingBulletinId ? 'Save Changes' : 'Publish Now'}</span>
                </button>
              </div>
            </header>

            {/* Split Editor & Live Preview */}
            <div className="flex-1 overflow-y-auto grid grid-cols-1 xl:grid-cols-[1fr_380px] divide-y xl:divide-y-0 xl:divide-x divide-slate-200">
              {/* Left: Clean Simple Editor */}
              <form onSubmit={handlePublishOrSaveNews} className="p-8 space-y-6 max-w-3xl">
                {/* Quick Templates */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                    <span>Quick Start Templates</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_TEMPLATES.map(tpl => (
                      <button
                        key={tpl.label}
                        type="button"
                        onClick={() => applyNewsTemplate(tpl)}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium transition-colors cursor-pointer"
                      >
                        {tpl.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Topic, Priority, Date */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Topic
                    </label>
                    <select
                      value={newsType}
                      onChange={e => setNewsType(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-slate-400"
                    >
                      {SIMPLE_TOPIC_OPTIONS.map(t => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Priority
                    </label>
                    <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg">
                      {[
                        { id: 'low', label: 'Normal' },
                        { id: 'medium', label: 'Important' },
                        { id: 'high', label: 'Urgent' }
                      ].map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setNewsPriority(p.id as any)}
                          className={`py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                            newsPriority === p.id
                              ? 'bg-white text-slate-900 shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Date
                    </label>
                    <input
                      type="date"
                      value={newsDate}
                      onChange={e => setNewsDate(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-slate-400"
                    />
                  </div>
                </div>

                {/* Title, Summary, Message */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Headline *
                    </label>
                    <input
                      type="text"
                      required
                      value={newsTitle}
                      onChange={e => setNewsTitle(e.target.value)}
                      placeholder="Enter news title..."
                      className="w-full px-3.5 py-2.5 text-sm font-medium bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Short Summary
                    </label>
                    <input
                      type="text"
                      value={newsSubtitle}
                      onChange={e => setNewsSubtitle(e.target.value)}
                      placeholder="e.g., For Factory & Site Teams"
                      className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Message *
                    </label>
                    <textarea
                      rows={5}
                      required
                      value={newsContent}
                      onChange={e => setNewsContent(e.target.value)}
                      placeholder="Write your announcement clearly..."
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-slate-400 leading-relaxed"
                    />
                  </div>
                </div>

                {/* Key Action Points */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                    <ListChecks className="w-3.5 h-3.5 text-slate-500" />
                    <span>Key Points (Optional)</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newKeyPointText}
                      onChange={e => setNewKeyPointText(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddKeyPoint();
                        }
                      }}
                      placeholder="Add a key point and press Enter..."
                      className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={handleAddKeyPoint}
                      className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                  {newsKeyPoints.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      {newsKeyPoints.map((pt, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-50 text-xs text-slate-800"
                        >
                          <span>• {pt}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setNewsKeyPoints(prev => prev.filter((_, i) => i !== idx))
                            }
                            className="text-slate-400 hover:text-rose-600"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Audience */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-600">Send To</label>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => toggleTargetRole('ALL')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        newsTargetRoles.includes('ALL')
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      Everyone
                    </button>
                    {uniqueRoles.map(r => {
                      const active =
                        !newsTargetRoles.includes('ALL') && newsTargetRoles.includes(r.id);
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => toggleTargetRole(r.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                            active
                              ? 'bg-slate-900 text-white'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {r.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Portal Link & Files */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                  {/* Portal & Web Links */}
                  <div className="space-y-2.5">
                    <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                      <Link2 className="w-3.5 h-3.5 text-slate-500" />
                      <span>Portal & Web Links</span>
                    </label>
                    <select
                      value={newsPortalId}
                      onChange={e => setNewsPortalId(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                    >
                      <option value="">No Portal Link</option>
                      {SYSTEM_PORTAL_DIRECTORY.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.title}
                        </option>
                      ))}
                    </select>

                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={newLinkLabel}
                        onChange={e => setNewLinkLabel(e.target.value)}
                        placeholder="Link name"
                        className="flex-1 px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                      />
                      <input
                        type="text"
                        value={newLinkUrl}
                        onChange={e => setNewLinkUrl(e.target.value)}
                        placeholder="https://..."
                        className="flex-1 px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={handleAddWebLink}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {newsLinks.map(lnk => (
                      <div
                        key={lnk.id}
                        className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-50 text-xs"
                      >
                        <span className="truncate font-medium text-slate-700">{lnk.label}</span>
                        <button
                          type="button"
                          onClick={() => setNewsLinks(prev => prev.filter(l => l.id !== lnk.id))}
                          className="text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* File Attachments */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                        <Paperclip className="w-3.5 h-3.5 text-slate-500" />
                        <span>Files ({newsAttachments.length})</span>
                      </label>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        onChange={handleUploadNewsFiles}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload File</span>
                      </button>
                    </div>

                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={newFileName}
                        onChange={e => setNewFileName(e.target.value)}
                        placeholder="Or enter file name (e.g. Circular.pdf)"
                        className="flex-1 px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={handleQuickAddFile}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {newsAttachments.map(att => (
                      <div
                        key={att.id}
                        className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-50 text-xs"
                      >
                        <span className="truncate font-medium text-slate-700">{att.name}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setNewsAttachments(prev => prev.filter(a => a.id !== att.id))
                          }
                          className="text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Options */}
                <div className="flex flex-wrap items-center gap-6 pt-3 border-t border-slate-100">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newsPinTop}
                      onChange={e => setNewsPinTop(e.target.checked)}
                      className="rounded border-slate-300 text-slate-900"
                    />
                    <span>Pin to top</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newsRequireConfirm}
                      onChange={e => setNewsRequireConfirm(e.target.checked)}
                      className="rounded border-slate-300 text-slate-900"
                    />
                    <span>Ask staff to confirm reading</span>
                  </label>
                </div>
              </form>

              {/* Right: Live News Preview */}
              <div className="p-8 bg-slate-50/60 space-y-4">
                <p className="text-xs font-semibold text-slate-400">Live Preview</p>
                <div className="p-6 rounded-xl bg-white border border-slate-200 space-y-4">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-semibold text-orange-600">
                      {SIMPLE_TOPIC_OPTIONS.find(t => t.value === newsType)?.label || 'News'}
                    </span>
                    <span>·</span>
                    <span>{newsDate}</span>
                    {newsPriority === 'high' && (
                      <>
                        <span>·</span>
                        <span className="font-semibold text-rose-600">Urgent</span>
                      </>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900">
                    {newsTitle || 'Your News Title'}
                  </h3>

                  {newsSubtitle && <p className="text-xs text-slate-500">{newsSubtitle}</p>}

                  <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {newsContent || 'Your news message will appear here...'}
                  </p>

                  {newsKeyPoints.length > 0 && (
                    <div className="pt-2 space-y-1.5">
                      <p className="text-xs font-semibold text-slate-900">Key Points</p>
                      {newsKeyPoints.map((pt, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-slate-700">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{pt}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {newsAttachments.length > 0 && (
                    <div className="pt-2 space-y-1">
                      <p className="text-xs font-semibold text-slate-500">
                        Files ({newsAttachments.length})
                      </p>
                      {newsAttachments.map(att => (
                        <div key={att.id} className="text-xs text-slate-700 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-slate-400" />
                          <span>{att.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : activeItem ? (
          /* SIMPLE READER VIEW */
          <>
            {/* Clean Top Header */}
            <header className="px-8 py-4 border-b border-slate-200 flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-2 text-xs text-slate-500 min-w-0">
                <span className="font-semibold text-slate-800">{activeItem.category}</span>
                <span>·</span>
                <span className="font-mono">{activeItem.referenceCode}</span>
                <span>·</span>
                <span className="truncate">By {activeItem.publishedByName}</span>
                {activeItem.readCount !== undefined && (
                  <>
                    <span>·</span>
                    <span>{activeItem.readCount} read</span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {isAdmin && activeItem.sourceKind === 'admin_news' && (
                  <button
                    type="button"
                    onClick={() => startEditNews(activeItem.id)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleToggleItemPin(activeItem)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 cursor-pointer ${
                    activeItem.isPinned
                      ? 'border-blue-200 bg-blue-50 text-blue-700'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <Pin className="w-3.5 h-3.5" />
                  <span>{activeItem.isPinned ? 'Saved' : 'Save'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteItem(activeItem)}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-500 cursor-pointer"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </header>

            {/* Clean Reader Body */}
            <div className="flex-1 overflow-y-auto px-8 py-8">
              <div className="max-w-3xl space-y-6">
                {/* Title & Meta */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>{new Date(activeItem.timestamp).toLocaleString()}</span>
                    <span>·</span>
                    <span>To: {activeItem.targetScopeLabel}</span>
                    {activeItem.priority === 'high' && (
                      <>
                        <span>·</span>
                        <span className="font-semibold text-rose-600">Urgent</span>
                      </>
                    )}
                  </div>

                  <h1 className="text-xl font-bold text-slate-900 leading-snug">
                    {activeItem.title}
                  </h1>

                  {activeItem.subtitle && (
                    <p className="text-xs font-medium text-slate-500">{activeItem.subtitle}</p>
                  )}
                </div>

                {/* Main Content */}
                <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap pt-2 border-t border-slate-100">
                  {activeItem.message}
                </div>

                {/* Concise Done & Snooze Bar for Deadline Alerts & Tasks */}
                {(activeItem.sourceKind === 'sla_deadline' ||
                  activeItem.sourceKind === 'task_assignment') && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                      <AlarmClock className="w-4 h-4 text-rose-600" />
                      <span>Deadline Action</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleMarkDeadlineOrTaskDone(activeItem)}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Done</span>
                      </button>
                      {[
                        { label: 'Snooze 1m', mins: 1 },
                        { label: '15m', mins: 15 },
                        { label: '30m', mins: 30 },
                        { label: '1h', mins: 60 }
                      ].map(opt => (
                        <button
                          key={opt.mins}
                          type="button"
                          onClick={() => handleSnoozeDeadlineOrTask(activeItem, opt.mins)}
                          className="px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-950 text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <AlarmClock className="w-3.5 h-3.5" />
                          <span>{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Key Points (if any) */}
                {activeItem.keyPoints && activeItem.keyPoints.length > 0 && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <p className="text-xs font-bold text-slate-900">Key Points</p>
                    <div className="space-y-1.5">
                      {activeItem.keyPoints.map((pt, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{pt}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Confirm Reading Bar for News */}
                {activeItem.requiresAcknowledgement && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
                    <span className="text-xs text-slate-600">
                      Confirmed by {activeItem.acknowledgedCount || 1} staff
                    </span>
                    {!activeItem.isAcknowledged ? (
                      <button
                        type="button"
                        onClick={() => {
                          notificationNewsService.acknowledgeBulletin(
                            activeItem.id,
                            activeUser?.id || 'usr-superadmin'
                          );
                          triggerRefresh();
                          toast.success('Confirmed');
                        }}
                        className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer"
                      >
                        Confirm Read
                      </button>
                    ) : (
                      <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                        <Check className="w-4 h-4" /> Confirmed
                      </span>
                    )}
                  </div>
                )}

                {/* Single Primary Action & Unique Links (No Duplicates) */}
                {(activeItem.action || uniqueExtraLinks.length > 0) && (
                  <div className="flex flex-wrap items-center gap-2.5 pt-2">
                    {activeItem.action && (
                      <button
                        type="button"
                        onClick={() =>
                          handleExecutePortalAction(activeItem, activeItem.linkedPortal)
                        }
                        className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-2 cursor-pointer"
                      >
                        <span>{activeItem.action.label}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {uniqueExtraLinks.map(lnk => (
                      <button
                        key={lnk.id}
                        type="button"
                        onClick={() => {
                          if (lnk.portalObject) {
                            handleExecutePortalAction(activeItem, lnk.portalObject);
                          } else {
                            window.open(lnk.url, '_blank', 'noopener,noreferrer');
                          }
                        }}
                        className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-semibold flex items-center gap-2 cursor-pointer"
                      >
                        <span>{lnk.label}</span>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Attached Files */}
                {activeItem.attachments.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <p className="text-xs font-semibold text-slate-500">
                      Files ({activeItem.attachments.length})
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {activeItem.attachments.map(att => (
                        <div
                          key={att.id}
                          onClick={() => handleDownloadAttachment(att)}
                          className="p-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 flex items-center justify-between gap-3 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <FileText className="w-4 h-4 text-slate-500 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-slate-900 truncate">
                                {att.name}
                              </p>
                              <p className="text-[11px] text-slate-400">{att.sizeLabel}</p>
                            </div>
                          </div>
                          <Download className="w-4 h-4 text-slate-500 shrink-0" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Simple Notes */}
                <div className="pt-6 border-t border-slate-100 space-y-3">
                  <p className="text-xs font-semibold text-slate-500">Notes</p>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={noteText}
                      onChange={e => setNoteText(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSaveNote();
                        }
                      }}
                      placeholder="Write a quick note..."
                      className="flex-1 px-3.5 py-2 rounded-lg border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-400"
                    />
                    <button
                      type="button"
                      onClick={handleSaveNote}
                      className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer"
                    >
                      Save
                    </button>
                  </div>

                  {activeItem.notes.length > 0 && (
                    <div className="space-y-2 pt-1">
                      {activeItem.notes.map(n => (
                        <div
                          key={n.id}
                          className="p-3 rounded-lg bg-slate-50 text-xs flex items-start justify-between gap-4"
                        >
                          <div className="space-y-0.5">
                            <span className="font-semibold text-slate-800">{n.authorName}</span>
                            <p className="text-slate-600">{n.text}</p>
                          </div>
                          <span className="text-[11px] text-slate-400 shrink-0">{n.timestamp}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-12 text-center">
            <p className="text-xs text-slate-400">Select an item to read.</p>
          </div>
        )}
      </main>
    </div>
  );
};
