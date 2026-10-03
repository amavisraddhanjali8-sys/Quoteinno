import { SecurityUser } from '../types/security';
import {
  createGoogleCalendarEvent,
  updateGoogleCalendarEvent,
  getAccessToken
} from './googleWorkspaceAuth';

export type ApprovalSlaCategory =
  | 'QC_INSPECTION_APPROVAL'
  | 'NCR_DISPOSITION_ACTION'
  | 'PROCUREMENT_APPROVAL'
  | 'FINANCE_INVOICE_CONTRACT_APPROVAL'
  | 'HR_PAYROLL_DISBURSEMENT_APPROVAL'
  | 'FACTORY_WORK_PACKAGE_SIGNOFF';

export type ApprovalSlaStatus =
  | 'Pending Action'
  | 'Overdue - Alert Triggered'
  | 'Acknowledged & Snoozed'
  | 'Completed / Approved'
  | 'Rejected';

export interface SlaSnoozeHistoryItem {
  id: string;
  snoozedByUserId: string;
  snoozedByName: string;
  snoozedByRole: string;
  snoozedAtIso: string;
  snoozedUntilIso: string;
  snoozeDurationMinutes: number;
  acknowledgementNote: string;
  syncedToGoogleCalendar: boolean;
  googleCalendarEventId?: string;
  googleCalendarHtmlLink?: string;
}

export interface ApprovalSlaRecord {
  id: string;
  referenceCode: string;
  linkedRecordId: string;
  recordTitle: string;
  recordDescription: string;
  category: ApprovalSlaCategory;
  categoryLabel: string;
  factoryId: string;
  factoryName: string;
  projectId: string;
  projectName: string;
  createdByUserId: string;
  createdByName: string;
  createdAtIso: string;
  assignedUserIds: string[];
  assignedUserNames: string[];
  assignedUserEmails: string[];
  assignedRoles: string[];
  slaDurationMinutes: number;
  deadlineIso: string;
  priority: 'Normal' | 'High' | 'Urgent' | 'Critical';
  status: ApprovalSlaStatus;
  acknowledgedByUserId?: string;
  acknowledgedByName?: string;
  acknowledgedAtIso?: string;
  acknowledgementNote?: string;
  snoozedUntilIso?: string;
  snoozeCount: number;
  snoozeHistory: SlaSnoozeHistoryItem[];
  completedByUserId?: string;
  completedByName?: string;
  completedByRole?: string;
  completedAtIso?: string;
  completionVerdict?: 'Approved' | 'Approved with Remarks' | 'Rejected';
  completionRemarks?: string;
  syncToGoogleCalendar: boolean;
  googleCalendarEventId?: string;
  googleCalendarHtmlLink?: string;
  lastAlertTriggeredAtIso?: string;
}

const STORAGE_KEY_SLA_RECORDS = 'innovista_approval_sla_records_v3';

const CATEGORY_LABELS: Record<ApprovalSlaCategory, string> = {
  QC_INSPECTION_APPROVAL: 'QC Approval',
  NCR_DISPOSITION_ACTION: 'NCR Action',
  PROCUREMENT_APPROVAL: 'PO Approval',
  FINANCE_INVOICE_CONTRACT_APPROVAL: 'Invoice Approval',
  HR_PAYROLL_DISBURSEMENT_APPROVAL: 'Payroll Approval',
  FACTORY_WORK_PACKAGE_SIGNOFF: 'Work Package'
};

const nowMs = Date.now();

const SEED_SLA_RECORDS: ApprovalSlaRecord[] = [
  {
    id: 'sla-qc-001',
    referenceCode: 'SLA-QC-01',
    linkedRecordId: 'IQC-804',
    recordTitle: 'QC Approval: Mullion Batch #09A',
    recordDescription: 'Approve Curtain Wall QC.',
    category: 'QC_INSPECTION_APPROVAL',
    categoryLabel: CATEGORY_LABELS.QC_INSPECTION_APPROVAL,
    factoryId: 'fac-inv-01',
    factoryName: 'Colombo Plant',
    projectId: 'PRJ-2026-001',
    projectName: 'Altair Tower',
    createdByUserId: 'usr-fac-01',
    createdByName: 'Rohan Wijesinghe',
    createdAtIso: new Date(nowMs - 150 * 60 * 1000).toISOString(),
    assignedUserIds: ['usr-qc-01'],
    assignedUserNames: ['David Okafor'],
    assignedUserEmails: ['qc@innovista.com'],
    assignedRoles: ['Quality Inspector', 'Quality Manager (QA/QC)'],
    slaDurationMinutes: 120,
    deadlineIso: new Date(nowMs - 30 * 60 * 1000).toISOString(),
    priority: 'Critical',
    status: 'Overdue - Alert Triggered',
    snoozeCount: 0,
    snoozeHistory: [],
    syncToGoogleCalendar: true,
    lastAlertTriggeredAtIso: new Date(nowMs - 5 * 60 * 1000).toISOString()
  },
  {
    id: 'sla-qc-002',
    referenceCode: 'SLA-QC-02',
    linkedRecordId: 'FAT-112',
    recordTitle: 'QC Approval: DGU Water Test',
    recordDescription: 'Approve FAT water test.',
    category: 'QC_INSPECTION_APPROVAL',
    categoryLabel: CATEGORY_LABELS.QC_INSPECTION_APPROVAL,
    factoryId: 'fac-inv-01',
    factoryName: 'Colombo Plant',
    projectId: 'PRJ-2026-002',
    projectName: 'Port City Marina',
    createdByUserId: 'usr-fac-01',
    createdByName: 'Rohan Wijesinghe',
    createdAtIso: new Date(nowMs - 95 * 60 * 1000).toISOString(),
    assignedUserIds: ['usr-qc-01'],
    assignedUserNames: ['David Okafor'],
    assignedUserEmails: ['qc@innovista.com'],
    assignedRoles: ['Quality Inspector', 'Quality Manager (QA/QC)'],
    slaDurationMinutes: 60,
    deadlineIso: new Date(nowMs - 15 * 60 * 1000).toISOString(),
    priority: 'Urgent',
    status: 'Overdue - Alert Triggered',
    snoozeCount: 0,
    snoozeHistory: [],
    syncToGoogleCalendar: true,
    lastAlertTriggeredAtIso: new Date(nowMs - 2 * 60 * 1000).toISOString()
  },
  {
    id: 'sla-proc-003',
    referenceCode: 'SLA-PO-03',
    linkedRecordId: 'PO-409',
    recordTitle: 'PO Approval: Spider Fittings',
    recordDescription: 'Approve PO #409.',
    category: 'PROCUREMENT_APPROVAL',
    categoryLabel: CATEGORY_LABELS.PROCUREMENT_APPROVAL,
    factoryId: 'fac-part-01',
    factoryName: 'Lanka Glass Plant',
    projectId: 'PRJ-2026-001',
    projectName: 'Altair Tower',
    createdByUserId: 'usr-pm-01',
    createdByName: 'Marcus Sterling',
    createdAtIso: new Date(nowMs - 40 * 60 * 1000).toISOString(),
    assignedUserIds: ['usr-proc-01'],
    assignedUserNames: ['Tariq Mansoor'],
    assignedUserEmails: ['procurement@innovista.com'],
    assignedRoles: ['Procurement Manager', 'Procurement Officer'],
    slaDurationMinutes: 30,
    deadlineIso: new Date(nowMs - 10 * 60 * 1000).toISOString(),
    priority: 'High',
    status: 'Overdue - Alert Triggered',
    snoozeCount: 0,
    snoozeHistory: [],
    syncToGoogleCalendar: true,
    lastAlertTriggeredAtIso: new Date(nowMs - 1 * 60 * 1000).toISOString()
  },
  {
    id: 'sla-fin-004',
    referenceCode: 'SLA-FIN-04',
    linkedRecordId: 'INV-718',
    recordTitle: 'Invoice Approval: Milestone 50%',
    recordDescription: 'Approve Invoice #718.',
    category: 'FINANCE_INVOICE_CONTRACT_APPROVAL',
    categoryLabel: CATEGORY_LABELS.FINANCE_INVOICE_CONTRACT_APPROVAL,
    factoryId: 'fac-inv-01',
    factoryName: 'Colombo Plant',
    projectId: 'PRJ-2026-001',
    projectName: 'Altair Tower',
    createdByUserId: 'usr-pm-01',
    createdByName: 'Marcus Sterling',
    createdAtIso: new Date(nowMs - 60 * 60 * 1000).toISOString(),
    assignedUserIds: ['usr-fin-01'],
    assignedUserNames: ['Elena Rostova'],
    assignedUserEmails: ['finance@innovista.com'],
    assignedRoles: ['Finance Manager', 'Accountant'],
    slaDurationMinutes: 45,
    deadlineIso: new Date(nowMs - 5 * 60 * 1000).toISOString(),
    priority: 'High',
    status: 'Overdue - Alert Triggered',
    snoozeCount: 0,
    snoozeHistory: [],
    syncToGoogleCalendar: true,
    lastAlertTriggeredAtIso: new Date(nowMs - 1 * 60 * 1000).toISOString()
  },
  {
    id: 'sla-exec-005',
    referenceCode: 'SLA-EX-05',
    linkedRecordId: 'VO-2026-009',
    recordTitle: 'Variation Approval: VO-09',
    recordDescription: 'Approve Podium Canopy VO.',
    category: 'FINANCE_INVOICE_CONTRACT_APPROVAL',
    categoryLabel: CATEGORY_LABELS.FINANCE_INVOICE_CONTRACT_APPROVAL,
    factoryId: 'fac-inv-01',
    factoryName: 'Colombo Plant',
    projectId: 'PRJ-2026-001',
    projectName: 'Altair Tower',
    createdByUserId: 'usr-pm-01',
    createdByName: 'Marcus Sterling',
    createdAtIso: new Date(nowMs - 50 * 60 * 1000).toISOString(),
    assignedUserIds: ['usr-admin-01', 'usr-pm-01'],
    assignedUserNames: ['Alexander Vance', 'Marcus Sterling'],
    assignedUserEmails: ['admin@innovista.com', 'pm@innovista.com'],
    assignedRoles: ['Super Administrator', 'Managing Director / Executive', 'Project Manager'],
    slaDurationMinutes: 45,
    deadlineIso: new Date(nowMs - 5 * 60 * 1000).toISOString(),
    priority: 'High',
    status: 'Overdue - Alert Triggered',
    snoozeCount: 0,
    snoozeHistory: [],
    syncToGoogleCalendar: true,
    lastAlertTriggeredAtIso: new Date(nowMs - 1 * 60 * 1000).toISOString()
  }
];

type SlaSubscriber = () => void;
const subscribers = new Set<SlaSubscriber>();

function notifySubscribers() {
  subscribers.forEach(fn => {
    try {
      fn();
    } catch {}
  });
}

export function subscribeSlaUpdates(listener: SlaSubscriber): () => void {
  subscribers.add(listener);
  return () => {
    subscribers.delete(listener);
  };
}

function loadRecords(): ApprovalSlaRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SLA_RECORDS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_SLA_RECORDS, JSON.stringify(SEED_SLA_RECORDS));
      return [...SEED_SLA_RECORDS];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (e) {
    console.warn('Failed to load SLA records:', e);
  }
  return [...SEED_SLA_RECORDS];
}

function saveRecords(records: ApprovalSlaRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY_SLA_RECORDS, JSON.stringify(records));
  } catch (e) {
    console.warn('Failed to save SLA records:', e);
  }
  notifySubscribers();
}

export function buildGoogleCalendarTemplateUrl(params: {
  title: string;
  details: string;
  startIso: string;
  endIso: string;
  location?: string;
}): string {
  const fmt = (iso: string) =>
    new Date(iso)
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}/, '');
  const url = new URL('https://calendar.google.com/calendar/render');
  url.searchParams.set('action', 'TEMPLATE');
  url.searchParams.set('text', params.title);
  url.searchParams.set('details', params.details);
  url.searchParams.set('location', params.location || 'Innovista ERP Portal');
  url.searchParams.set('dates', `${fmt(params.startIso)}/${fmt(params.endIso)}`);
  return url.toString();
}

export const approvalSlaAlertService = {
  getCategoryLabel(category: ApprovalSlaCategory): string {
    return CATEGORY_LABELS[category] || category;
  },

  /**
   * Evaluates all records against current time.
   * Any Pending Action record past `deadlineIso`, or any `Acknowledged & Snoozed` record past `snoozedUntilIso`,
   * automatically transitions to `Overdue - Alert Triggered` so alerts persist until the job is done.
   */
  evaluateAndGetRecords(): ApprovalSlaRecord[] {
    const records = loadRecords();
    const now = Date.now();
    let changed = false;

    const updated = records.map(rec => {
      if (rec.status === 'Completed / Approved' || rec.status === 'Rejected') {
        return rec;
      }

      if (rec.status === 'Acknowledged & Snoozed' && rec.snoozedUntilIso) {
        const snoozeEnd = new Date(rec.snoozedUntilIso).getTime();
        if (now >= snoozeEnd) {
          changed = true;
          return {
            ...rec,
            status: 'Overdue - Alert Triggered' as ApprovalSlaStatus,
            snoozedUntilIso: undefined,
            lastAlertTriggeredAtIso: new Date(now).toISOString()
          };
        }
        return rec;
      }

      const deadlineTime = new Date(rec.deadlineIso).getTime();
      if (now >= deadlineTime && rec.status !== 'Overdue - Alert Triggered') {
        changed = true;
        return {
          ...rec,
          status: 'Overdue - Alert Triggered' as ApprovalSlaStatus,
          lastAlertTriggeredAtIso: new Date(now).toISOString()
        };
      }

      return rec;
    });

    if (changed) {
      saveRecords(updated);
    }
    return updated;
  },

  /**
   * Checks if a user is directly assigned/related to this SLA record.
   * Only records directly related to the user are pushed.
   */
  isUserAuthorizedForRecord(user: SecurityUser | null, rec: ApprovalSlaRecord): boolean {
    if (!user) return false;

    // Respect explicit project/factory denials
    if (rec.projectId && user.deniedProjectIds?.includes(rec.projectId)) return false;
    if (rec.factoryId && user.deniedFactoryIds?.includes(rec.factoryId)) return false;

    // 1. Direct User ID match
    if (rec.assignedUserIds.includes(user.id)) return true;

    // 2. Direct Email match
    if (
      user.email &&
      rec.assignedUserEmails.some(e => e.toLowerCase() === user.email.toLowerCase())
    ) {
      return true;
    }

    // 3. Direct Full Name match
    if (
      user.fullName &&
      rec.assignedUserNames.some(
        n => n.toLowerCase() === user.fullName.toLowerCase()
      )
    ) {
      return true;
    }

    // 4. Direct Role match (strictly matching the user's role)
    const roleLower = (user.roleName || '').toLowerCase().trim();
    if (
      roleLower &&
      rec.assignedRoles.some(r => {
        const rl = r.toLowerCase().trim();
        if (!rl) return false;
        return rl === roleLower || roleLower.includes(rl) || rl.includes(roleLower);
      })
    ) {
      return true;
    }

    return false;
  },

  getScopedRecords(params?: {
    user?: SecurityUser | null;
    factoryId?: string;
    projectId?: string;
    category?: ApprovalSlaCategory | 'ALL';
    onlyActiveOrOverdue?: boolean;
  }): ApprovalSlaRecord[] {
    let list: ApprovalSlaRecord[] = this.evaluateAndGetRecords();

    if (params?.user) {
      list = list.filter((r: ApprovalSlaRecord) => this.isUserAuthorizedForRecord(params.user || null, r));
    }

    if (params?.factoryId && params.factoryId !== 'ALL') {
      list = list.filter((r: ApprovalSlaRecord) => r.factoryId === params.factoryId);
    }
    if (params?.projectId && params.projectId !== 'ALL') {
      list = list.filter(
        (r: ApprovalSlaRecord) => r.projectId === params.projectId || r.projectName === params.projectId
      );
    }
    if (params?.category && params.category !== 'ALL') {
      list = list.filter((r: ApprovalSlaRecord) => r.category === params.category);
    }
    if (params?.onlyActiveOrOverdue) {
      list = list.filter(
        (r: ApprovalSlaRecord) => r.status !== 'Completed / Approved' && r.status !== 'Rejected'
      );
    }

    // Sort Overdue first, then Snoozed, then Pending Action by earliest deadline, then Completed
    return list.sort((a: ApprovalSlaRecord, b: ApprovalSlaRecord) => {
      const rank = (s: ApprovalSlaStatus) => {
        if (s === 'Overdue - Alert Triggered') return 0;
        if (s === 'Acknowledged & Snoozed') return 1;
        if (s === 'Pending Action') return 2;
        return 3;
      };
      const diff = rank(a.status) - rank(b.status);
      if (diff !== 0) return diff;
      return new Date(a.deadlineIso).getTime() - new Date(b.deadlineIso).getTime();
    });
  },

  /**
   * Returns only active deadline alerts whose time has come and are neither Done nor currently Snoozed.
   * When a task is marked Done or Snoozed, it disappears immediately until the snooze time comes.
   */
  getActiveAlertsForNotificationHub(user?: SecurityUser | null): ApprovalSlaRecord[] {
    const all: ApprovalSlaRecord[] = this.evaluateAndGetRecords();
    const now = Date.now();
    return all.filter((rec: ApprovalSlaRecord) => {
      if (rec.status === 'Completed / Approved' || rec.status === 'Rejected') {
        return false;
      }
      if (rec.status === 'Acknowledged & Snoozed' && rec.snoozedUntilIso) {
        if (now < new Date(rec.snoozedUntilIso).getTime()) {
          return false;
        }
      }
      if (rec.status === 'Pending Action') {
        if (now < new Date(rec.deadlineIso).getTime()) {
          return false;
        }
      }
      return this.isUserAuthorizedForRecord(user || null, rec);
    });
  },

  /**
   * Creates a new Approval SLA record when a record is created or submitted for approval.
   * Optionally syncs the deadline directly to the user's Google Calendar if signed in.
   */
  async createSlaRecord(
    user: SecurityUser | null,
    input: {
      linkedRecordId: string;
      recordTitle: string;
      recordDescription: string;
      category: ApprovalSlaCategory;
      factoryId: string;
      factoryName: string;
      projectId: string;
      projectName: string;
      assignedUserIds?: string[];
      assignedUserNames?: string[];
      assignedUserEmails?: string[];
      assignedRoles: string[];
      slaDurationMinutes: number;
      customDeadlineIso?: string;
      priority: 'Normal' | 'High' | 'Urgent' | 'Critical';
      syncToGoogleCalendar: boolean;
    }
  ): Promise<{ record: ApprovalSlaRecord; calendarSynced: boolean; calendarError?: string }> {
    const records = loadRecords();
    const now = Date.now();
    const deadlineIso =
      input.customDeadlineIso && !Number.isNaN(new Date(input.customDeadlineIso).getTime())
        ? new Date(input.customDeadlineIso).toISOString()
        : new Date(now + Math.max(1, input.slaDurationMinutes) * 60 * 1000).toISOString();

    const isAlreadyOverdue = new Date(deadlineIso).getTime() <= now;

    const newRec: ApprovalSlaRecord = {
      id: `sla-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      referenceCode: `SLA-${input.category.split('_')[0]}-2026-${Math.floor(100 + Math.random() * 899)}`,
      linkedRecordId: input.linkedRecordId,
      recordTitle: input.recordTitle,
      recordDescription: input.recordDescription,
      category: input.category,
      categoryLabel: CATEGORY_LABELS[input.category] || input.category,
      factoryId: input.factoryId,
      factoryName: input.factoryName,
      projectId: input.projectId,
      projectName: input.projectName,
      createdByUserId: user?.id || 'usr-system',
      createdByName: user?.fullName || 'Authorised Engineer',
      createdAtIso: new Date(now).toISOString(),
      assignedUserIds: input.assignedUserIds || ['usr-superadmin'],
      assignedUserNames:
        input.assignedUserNames && input.assignedUserNames.length > 0
          ? input.assignedUserNames
          : input.assignedRoles,
      assignedUserEmails: input.assignedUserEmails || [],
      assignedRoles: input.assignedRoles,
      slaDurationMinutes: input.slaDurationMinutes,
      deadlineIso,
      priority: input.priority,
      status: isAlreadyOverdue ? 'Overdue - Alert Triggered' : 'Pending Action',
      snoozeCount: 0,
      snoozeHistory: [],
      syncToGoogleCalendar: input.syncToGoogleCalendar
    };

    let calendarSynced = false;
    let calendarError: string | undefined;

    if (input.syncToGoogleCalendar) {
      const token = await getAccessToken();
      if (token) {
        try {
          const startMs = Math.max(now + 60 * 1000, new Date(deadlineIso).getTime() - 30 * 60 * 1000);
          const endMs = Math.max(startMs + 15 * 60 * 1000, new Date(deadlineIso).getTime());
          const gcalEvent = await createGoogleCalendarEvent({
            summary: `[SLA APPROVAL DEADLINE] ${newRec.recordTitle}`,
            description: `${newRec.recordDescription}\n\nReference: ${newRec.referenceCode} (${newRec.linkedRecordId})\nFactory: ${newRec.factoryName}\nProject: ${newRec.projectName}\nAssigned Roles: ${newRec.assignedRoles.join(', ')}\nPriority: ${newRec.priority}`,
            startIso: new Date(startMs).toISOString(),
            endIso: new Date(endMs).toISOString(),
            location: `${newRec.factoryName} — ${newRec.projectName}`,
            attendeeEmails: newRec.assignedUserEmails,
            reminderMinutesBefore: [5, 15, 30]
          });
          newRec.googleCalendarEventId = gcalEvent.id;
          newRec.googleCalendarHtmlLink = gcalEvent.htmlLink;
          calendarSynced = true;
        } catch (err: any) {
          calendarError = err.message || 'Could not sync to Google Calendar API';
        }
      }
    }

    const updated = [newRec, ...records];
    saveRecords(updated);
    return { record: newRec, calendarSynced, calendarError };
  },

  /**
   * Acknowledge an active/overdue alert and set a Snooze Reminder.
   * Syncs the new snooze reminder timestamp to Google Calendar (creating or updating the Calendar event).
   * Once the snooze window elapses, if the record is still not completed, the alert triggers again!
   */
  async acknowledgeAndSnoozeSlaRecord(
    recordId: string,
    user: SecurityUser | null,
    params: {
      snoozeDurationMinutes: number;
      customSnoozeUntilIso?: string;
      acknowledgementNote: string;
      syncToGoogleCalendar: boolean;
    }
  ): Promise<{
    record: ApprovalSlaRecord;
    calendarSynced: boolean;
    calendarHtmlLink?: string;
    calendarError?: string;
  }> {
    const records = loadRecords();
    const idx = records.findIndex(r => r.id === recordId);
    if (idx === -1) {
      throw new Error('SLA Record not found');
    }

    const target = { ...records[idx] };
    const now = Date.now();
    const snoozedUntilIso =
      params.customSnoozeUntilIso && !Number.isNaN(new Date(params.customSnoozeUntilIso).getTime())
        ? new Date(params.customSnoozeUntilIso).toISOString()
        : new Date(now + Math.max(1, params.snoozeDurationMinutes) * 60 * 1000).toISOString();

    let calendarSynced = false;
    let calendarHtmlLink = target.googleCalendarHtmlLink;
    let calendarEventId = target.googleCalendarEventId;
    let calendarError: string | undefined;

    if (params.syncToGoogleCalendar) {
      const token = await getAccessToken();
      if (token) {
        try {
          const snoozeEndMs = new Date(snoozedUntilIso).getTime();
          const snoozeStartMs = Math.max(now + 30 * 1000, snoozeEndMs - 15 * 60 * 1000);
          const eventSummary = `[SNOOZED REMINDER #${target.snoozeCount + 1}] ${target.recordTitle}`;
          const eventDescription =
            `Acknowledged by: ${user?.fullName || 'Authorised Officer'} (${user?.roleName || 'Staff'})\n` +
            `Acknowledgement Note: ${params.acknowledgementNote || 'Acknowledged — scheduled follow-up reminder.'}\n\n` +
            `Original SLA Ref: ${target.referenceCode} (${target.linkedRecordId})\n` +
            `Factory: ${target.factoryName}\n` +
            `Project: ${target.projectName}\n` +
            `Action Required: Complete approval/action before snooze expires or alert will re-trigger.`;

          if (target.googleCalendarEventId) {
            const updatedEv = await updateGoogleCalendarEvent(target.googleCalendarEventId, {
              summary: eventSummary,
              description: eventDescription,
              startIso: new Date(snoozeStartMs).toISOString(),
              endIso: new Date(snoozeEndMs).toISOString(),
              reminderMinutesBefore: [5, 10]
            });
            calendarEventId = updatedEv.id;
            calendarHtmlLink = updatedEv.htmlLink;
            calendarSynced = true;
          } else {
            const createdEv = await createGoogleCalendarEvent({
              summary: eventSummary,
              description: eventDescription,
              startIso: new Date(snoozeStartMs).toISOString(),
              endIso: new Date(snoozeEndMs).toISOString(),
              location: `${target.factoryName} — ${target.projectName}`,
              attendeeEmails: target.assignedUserEmails,
              reminderMinutesBefore: [5, 10]
            });
            calendarEventId = createdEv.id;
            calendarHtmlLink = createdEv.htmlLink;
            calendarSynced = true;
          }
        } catch (err: any) {
          calendarError = err.message || 'Failed to sync snooze reminder to Google Calendar';
        }
      }
    }

    const historyEntry: SlaSnoozeHistoryItem = {
      id: `snz-${Date.now()}`,
      snoozedByUserId: user?.id || 'usr-current',
      snoozedByName: user?.fullName || 'Authorised Officer',
      snoozedByRole: user?.roleName || 'Quality / Factory Lead',
      snoozedAtIso: new Date(now).toISOString(),
      snoozedUntilIso,
      snoozeDurationMinutes: params.snoozeDurationMinutes,
      acknowledgementNote:
        params.acknowledgementNote || 'Alert acknowledged. Snoozed for follow-up action.',
      syncedToGoogleCalendar: calendarSynced,
      googleCalendarEventId: calendarEventId,
      googleCalendarHtmlLink: calendarHtmlLink
    };

    target.status = 'Acknowledged & Snoozed';
    target.acknowledgedByUserId = user?.id || 'usr-current';
    target.acknowledgedByName = user?.fullName || 'Authorised Officer';
    target.acknowledgedAtIso = new Date(now).toISOString();
    target.acknowledgementNote =
      params.acknowledgementNote || 'Alert acknowledged. Snoozed for follow-up action.';
    target.snoozedUntilIso = snoozedUntilIso;
    target.snoozeCount = (target.snoozeCount || 0) + 1;
    target.snoozeHistory = [historyEntry, ...(target.snoozeHistory || [])];
    target.googleCalendarEventId = calendarEventId;
    target.googleCalendarHtmlLink = calendarHtmlLink;

    records[idx] = target;
    saveRecords(records);

    return {
      record: target,
      calendarSynced,
      calendarHtmlLink,
      calendarError
    };
  },

  /**
   * Manually syncs any SLA record to Google Calendar via the Google Calendar REST API.
   */
  async syncRecordToGoogleCalendar(
    recordId: string,
    user: SecurityUser | null
  ): Promise<{ record: ApprovalSlaRecord; htmlLink: string }> {
    const records = loadRecords();
    const idx = records.findIndex(r => r.id === recordId);
    if (idx === -1) {
      throw new Error('SLA Record not found');
    }

    const target = { ...records[idx] };
    const targetIso = target.snoozedUntilIso || target.deadlineIso;
    const endMs = Math.max(Date.now() + 15 * 60 * 1000, new Date(targetIso).getTime());
    const startMs = Math.max(Date.now() + 60 * 1000, endMs - 30 * 60 * 1000);

    const summary =
      target.status === 'Acknowledged & Snoozed'
        ? `[SNOOZED SLA REMINDER] ${target.recordTitle}`
        : `[SLA APPROVAL DEADLINE] ${target.recordTitle}`;

    const description =
      `${target.recordDescription}\n\n` +
      `SLA Reference: ${target.referenceCode} (${target.linkedRecordId})\n` +
      `Category: ${target.categoryLabel}\n` +
      `Factory: ${target.factoryName}\n` +
      `Project: ${target.projectName}\n` +
      `Status: ${target.status}\n` +
      `Synced by: ${user?.fullName || 'Authorised User'}`;

    let evResult;
    if (target.googleCalendarEventId) {
      evResult = await updateGoogleCalendarEvent(target.googleCalendarEventId, {
        summary,
        description,
        startIso: new Date(startMs).toISOString(),
        endIso: new Date(endMs).toISOString(),
        reminderMinutesBefore: [5, 15]
      });
    } else {
      evResult = await createGoogleCalendarEvent({
        summary,
        description,
        startIso: new Date(startMs).toISOString(),
        endIso: new Date(endMs).toISOString(),
        location: `${target.factoryName} — ${target.projectName}`,
        attendeeEmails: target.assignedUserEmails,
        reminderMinutesBefore: [5, 15]
      });
    }

    target.googleCalendarEventId = evResult.id;
    target.googleCalendarHtmlLink = evResult.htmlLink;
    target.syncToGoogleCalendar = true;

    records[idx] = target;
    saveRecords(records);

    return { record: target, htmlLink: evResult.htmlLink };
  },

  /**
   * Performs the required approval / action on the SLA record, marking the job done
   * and permanently resolving the persistent overdue alert.
   */
  async completeSlaRecordAction(
    recordId: string,
    user: SecurityUser | null,
    params: {
      verdict: 'Approved' | 'Approved with Remarks' | 'Rejected';
      remarks: string;
    }
  ): Promise<ApprovalSlaRecord> {
    const records = loadRecords();
    const idx = records.findIndex(r => r.id === recordId);
    if (idx === -1) {
      throw new Error('SLA Record not found');
    }

    const target = { ...records[idx] };
    target.status = params.verdict === 'Rejected' ? 'Rejected' : 'Completed / Approved';
    target.completedByUserId = user?.id || 'usr-current';
    target.completedByName = user?.fullName || 'Authorised Approver';
    target.completedByRole = user?.roleName || 'Approving Authority';
    target.completedAtIso = new Date().toISOString();
    target.completionVerdict = params.verdict;
    target.completionRemarks =
      params.remarks || `${params.verdict} and signed off within SLA Control Center.`;

    // If synced to Google Calendar and token is active, update calendar event title to [COMPLETED]
    if (target.googleCalendarEventId) {
      const token = await getAccessToken();
      if (token) {
        try {
          await updateGoogleCalendarEvent(target.googleCalendarEventId, {
            summary: `[${params.verdict.toUpperCase()}] ${target.recordTitle}`,
            description: `${target.recordDescription}\n\n Action Completed by ${target.completedByName} (${target.completedByRole}) at ${new Date(target.completedAtIso).toLocaleString()}\nVerdict: ${params.verdict}\nRemarks: ${target.completionRemarks}`
          });
        } catch {}
      }
    }

    records[idx] = target;
    saveRecords(records);
    return target;
  },

  /**
   * Simulates expiring a deadline or snooze timer immediately so users can test
   * the live overdue alert trigger & snooze flow on any record.
   */
  triggerImmediateOverdueAlertForDemo(recordId: string): ApprovalSlaRecord | null {
    const records = loadRecords();
    const idx = records.findIndex(r => r.id === recordId);
    if (idx === -1) return null;

    const target = { ...records[idx] };
    const pastIso = new Date(Date.now() - 60 * 1000).toISOString();
    target.deadlineIso = pastIso;
    if (target.snoozedUntilIso) {
      target.snoozedUntilIso = pastIso;
    }
    target.status = 'Overdue - Alert Triggered';
    target.lastAlertTriggeredAtIso = new Date().toISOString();

    records[idx] = target;
    saveRecords(records);
    return target;
  }
};
