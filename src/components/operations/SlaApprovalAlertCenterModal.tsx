import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  BellRing,
  Clock,
  Calendar,
  CheckCircle2,
  AlarmClock,
  ShieldCheck,
  Plus,
  ExternalLink,
  X,
  RefreshCw,
  LogOut,
  Zap,
  History
} from 'lucide-react';
import {
  approvalSlaAlertService,
  ApprovalSlaRecord,
  ApprovalSlaCategory,
  subscribeSlaUpdates,
  buildGoogleCalendarTemplateUrl
} from '../../services/approvalSlaAlertService';
import {
  googleSignIn,
  logoutGoogle,
  subscribeGoogleAuth,
  listUpcomingGoogleCalendarEvents,
  GoogleCalendarEventResult
} from '../../services/googleWorkspaceAuth';
import { useSecurity } from '../../context/SecurityContext';
import { factoryExecutionService } from '../../services/factoryExecutionService';
import { toast } from 'sonner';

const SLA_DURATION_OPTIONS = [
  { label: '15 Minutes (Immediate QC Hold)', value: 15 },
  { label: '30 Minutes (Rapid Shopfloor QC)', value: 30 },
  { label: '1 Hour (Standard IQC / FAT Approval)', value: 60 },
  { label: '2 Hours (Engineering / QC Sign-off)', value: 120 },
  { label: '4 Hours (Same-Shift SLA)', value: 240 },
  { label: '24 Hours (1 Working Day)', value: 1440 },
  { label: '48 Hours (2 Working Days)', value: 2880 }
];

const SNOOZE_PRESET_OPTIONS = [
  { label: '15 Minutes', minutes: 15 },
  { label: '30 Minutes', minutes: 30 },
  { label: '1 Hour', minutes: 60 },
  { label: '2 Hours', minutes: 120 },
  { label: '4 Hours', minutes: 240 },
  { label: 'Tomorrow (24 Hours)', minutes: 1440 }
];

const AUTHORIZED_ROLES_LIST = [
  'QA/QC Inspector',
  'Quality Control Manager',
  'Factory Manager',
  'Project Factory Engineer',
  'Procurement Officer',
  'Finance & Accounting Officer',
  'HR & Payroll Officer',
  'Project Manager'
];

export function formatRemainingOrOverdue(targetIso: string): {
  label: string;
  isOverdue: boolean;
} {
  const diffMs = new Date(targetIso).getTime() - Date.now();
  const absMin = Math.max(1, Math.round(Math.abs(diffMs) / 60000));
  const hrs = Math.floor(absMin / 60);
  const mins = absMin % 60;
  const timeStr = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;

  if (diffMs <= 0) {
    return { label: `OVERDUE by ${timeStr}`, isOverdue: true };
  }
  return { label: `Due in ${timeStr}`, isOverdue: false };
}

/**
 * Official Google Sign-In Button following Google Identity branding guidelines
 */
export const GoogleWorkspaceSignInButton: React.FC<{
  onSuccess?: () => void;
  compact?: boolean;
}> = ({ onSuccess, compact = false }) => {
  const [authState, setAuthState] = useState<{ user: any | null; hasToken: boolean }>({
    user: null,
    hasToken: false
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return subscribeGoogleAuth(state => {
      setAuthState(state);
    });
  }, []);

  const handleSignIn = async () => {
    try {
      setLoading(true);
      const res = await googleSignIn();
      if (res) {
        toast.success(`Connected Google Calendar & Workspace as ${res.user.email}`);
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      toast.error(err.message || 'Google Sign-In failed or was cancelled');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await logoutGoogle();
    toast.info('Disconnected from Google Calendar session.');
  };

  if (authState.hasToken && authState.user) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="font-semibold truncate max-w-[180px]">
          Google Calendar Connected ({authState.user.email})
        </span>
        <button
          type="button"
          onClick={handleSignOut}
          className="p-1 rounded hover:bg-emerald-100 text-emerald-700"
          title="Disconnect Google Account"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleSignIn}
      disabled={loading}
      className={`gsi-material-button inline-flex items-center gap-2.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl shadow-2xs transition-all font-semibold cursor-pointer ${
        compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-xs'
      }`}
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
      <span className="gsi-material-button-contents">
        {loading ? 'Connecting Google Calendar...' : 'Sign in with Google'}
      </span>
    </button>
  );
};

interface SlaApprovalHubProps {
  factoryId?: string;
  projectId?: string;
  defaultCategory?: ApprovalSlaCategory | 'ALL';
  compactEmbedded?: boolean;
  onCloseModal?: () => void;
}

export const SlaApprovalHubPanel: React.FC<SlaApprovalHubProps> = ({
  factoryId = 'ALL',
  projectId = 'ALL',
  defaultCategory = 'ALL',
  compactEmbedded = false,
  onCloseModal
}) => {
  const { currentUser, users: allUsers } = useSecurity();
  const [tick, setTick] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState<ApprovalSlaCategory | 'ALL'>(defaultCategory);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OVERDUE' | 'ACTIVE' | 'SNOOZED' | 'COMPLETED'>('ALL');

  // Google Calendar state
  const [googleAuth, setGoogleAuth] = useState<{ user: any | null; hasToken: boolean }>({
    user: null,
    hasToken: false
  });
  const [calendarEvents, setCalendarEvents] = useState<GoogleCalendarEventResult[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [showCalendarDrawer, setShowCalendarDrawer] = useState(false);

  // Modals for Acknowledge & Snooze, Complete Action, and Schedule New SLA
  const [snoozingRecord, setSnoozingRecord] = useState<ApprovalSlaRecord | null>(null);
  const [snoozeMinutes, setSnoozeMinutes] = useState<number>(30);
  const [customSnoozeTime, setCustomSnoozeTime] = useState<string>('');
  const [snoozeNote, setSnoozeNote] = useState<string>(
    'Acknowledged QC / Approval alert. Physical verification in progress — snoozing reminder on Google Calendar.'
  );
  const [syncSnoozeToGCal, setSyncSnoozeToGCal] = useState<boolean>(true);
  const [isSubmittingSnooze, setIsSubmittingSnooze] = useState(false);

  const [actingRecord, setActingRecord] = useState<ApprovalSlaRecord | null>(null);
  const [actionVerdict, setActionVerdict] = useState<'Approved' | 'Approved with Remarks' | 'Rejected'>('Approved');
  const [actionRemarks, setActionRemarks] = useState<string>(
    'All dimensional, coating, and specification tolerances verified and signed off within SLA.'
  );
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // Create new SLA deadline modal
  const [isCreatingSla, setIsCreatingSla] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newLinkedId, setNewLinkedId] = useState(`IQC-2026-${Math.floor(100 + Math.random() * 899)}`);
  const [newCategory, setNewCategory] = useState<ApprovalSlaCategory>('QC_INSPECTION_APPROVAL');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState<'Normal' | 'High' | 'Urgent' | 'Critical'>('Critical');
  const [newDurationMins, setNewDurationMins] = useState<number>(60);
  const [newCustomDeadline, setNewCustomDeadline] = useState<string>('');
  const [newRoles, setNewRoles] = useState<string[]>(['QA/QC Inspector', 'Factory Manager']);
  const [newSyncCal, setNewSyncCal] = useState<boolean>(true);
  const [isSavingNewSla, setIsSavingNewSla] = useState(false);

  const factories = useMemo(() => factoryExecutionService.getFactories(), []);
  const [newFactoryId, setNewFactoryId] = useState<string>(
    factoryId !== 'ALL' ? factoryId : factories[0]?.id || 'fac-inv-01'
  );
  const [newProjectId, setNewProjectId] = useState<string>(
    projectId !== 'ALL' ? projectId : 'PRJ-2026-001'
  );

  useEffect(() => {
    const unsubSla = subscribeSlaUpdates(() => setTick(t => t + 1));
    const unsubAuth = subscribeGoogleAuth(state => setGoogleAuth(state));
    const interval = setInterval(() => {
      approvalSlaAlertService.evaluateAndGetRecords();
      setTick(t => t + 1);
    }, 10000);
    return () => {
      unsubSla();
      unsubAuth();
      clearInterval(interval);
    };
  }, []);

  const refreshGoogleCalendarEvents = async () => {
    if (!googleAuth.hasToken) return;
    try {
      setLoadingEvents(true);
      const items = await listUpcomingGoogleCalendarEvents(12);
      setCalendarEvents(items);
    } catch (err: any) {
      console.warn(err);
    } finally {
      setLoadingEvents(false);
    }
  };

  useEffect(() => {
    if (googleAuth.hasToken) {
      refreshGoogleCalendarEvents();
    }
  }, [googleAuth.hasToken]);

  const allScopedRecords = useMemo(
    () =>
      approvalSlaAlertService.getScopedRecords({
        user: currentUser,
        factoryId,
        projectId,
        category: categoryFilter
      }),
    [currentUser, factoryId, projectId, categoryFilter, tick]
  );

  const filteredRecords = useMemo(() => {
    return allScopedRecords.filter(r => {
      if (statusFilter === 'OVERDUE') return r.status === 'Overdue - Alert Triggered';
      if (statusFilter === 'ACTIVE')
        return r.status !== 'Completed / Approved' && r.status !== 'Rejected';
      if (statusFilter === 'SNOOZED') return r.status === 'Acknowledged & Snoozed';
      if (statusFilter === 'COMPLETED')
        return r.status === 'Completed / Approved' || r.status === 'Rejected';
      return true;
    });
  }, [allScopedRecords, statusFilter]);

  const overdueCount = allScopedRecords.filter(r => r.status === 'Overdue - Alert Triggered').length;
  const snoozedCount = allScopedRecords.filter(r => r.status === 'Acknowledged & Snoozed').length;
  const pendingCount = allScopedRecords.filter(r => r.status === 'Pending Action').length;
  const completedCount = allScopedRecords.filter(
    r => r.status === 'Completed / Approved' || r.status === 'Rejected'
  ).length;

  const handleAcknowledgeAndSnooze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!snoozingRecord) return;
    try {
      setIsSubmittingSnooze(true);
      const res = await approvalSlaAlertService.acknowledgeAndSnoozeSlaRecord(
        snoozingRecord.id,
        currentUser,
        {
          snoozeDurationMinutes: snoozeMinutes,
          customSnoozeUntilIso: customSnoozeTime || undefined,
          acknowledgementNote: snoozeNote,
          syncToGoogleCalendar: syncSnoozeToGCal
        }
      );

      if (res.calendarSynced) {
        toast.success(
          `Alert Acknowledged & Snoozed until ${new Date(
            res.record.snoozedUntilIso!
          ).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Synced to Google Calendar!`
        );
        refreshGoogleCalendarEvents();
      } else {
        toast.success(
          `Alert Acknowledged & Snoozed until ${new Date(
            res.record.snoozedUntilIso!
          ).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. (Sign in with Google to auto-sync to Google Calendar)`
        );
      }
      setSnoozingRecord(null);
      setCustomSnoozeTime('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to snooze alert');
    } finally {
      setIsSubmittingSnooze(false);
    }
  };

  const handleCompleteAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actingRecord) return;
    try {
      setIsSubmittingAction(true);
      await approvalSlaAlertService.completeSlaRecordAction(actingRecord.id, currentUser, {
        verdict: actionVerdict,
        remarks: actionRemarks
      });
      toast.success(
        `${actingRecord.referenceCode} marked as ${actionVerdict}! Persistent SLA alerts resolved.`
      );
      if (googleAuth.hasToken) {
        refreshGoogleCalendarEvents();
      }
      setActingRecord(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to complete approval action');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleCreateNewSla = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      toast.error('Please enter a title for the approval / action record');
      return;
    }
    try {
      setIsSavingNewSla(true);
      const fac = factories.find(f => f.id === newFactoryId) || factories[0];
      const matchedUsers = (allUsers || []).filter(u =>
        newRoles.some(r => (u.roleName || '').toLowerCase().includes(r.toLowerCase()))
      );
      const res = await approvalSlaAlertService.createSlaRecord(currentUser, {
        linkedRecordId: newLinkedId,
        recordTitle: newTitle.trim(),
        recordDescription:
          newDesc.trim() ||
          `Scheduled SLA approval action required within ${newDurationMins} minutes. Persistent alerts will trigger after deadline until completed.`,
        category: newCategory,
        factoryId: fac?.id || 'fac-inv-01',
        factoryName: fac?.name || 'Innovista Colombo Aluminium Plant',
        projectId: newProjectId,
        projectName:
          newProjectId === 'PRJ-2026-002'
            ? 'Port City Marina Acoustic Façade'
            : 'Altair Tower Skybridge Glazing',
        assignedUserIds: matchedUsers.map(u => u.id),
        assignedUserNames:
          matchedUsers.length > 0 ? matchedUsers.map(u => `${u.fullName} (${u.designation || u.roleName || 'Member'})`) : newRoles,
        assignedUserEmails: matchedUsers.map(u => u.email).filter(Boolean),
        assignedRoles: newRoles.length > 0 ? newRoles : ['QA/QC Inspector', 'Factory Manager'],
        slaDurationMinutes: newDurationMins,
        customDeadlineIso: newCustomDeadline || undefined,
        priority: newPriority,
        syncToGoogleCalendar: newSyncCal
      });

      if (res.calendarSynced) {
        toast.success(
          `Scheduled SLA Deadline (${res.record.referenceCode}) & created Google Calendar reminder event!`
        );
        refreshGoogleCalendarEvents();
      } else {
        toast.success(
          `Scheduled SLA Deadline (${res.record.referenceCode}). Alert will trigger automatically if not completed before deadline.`
        );
      }

      setIsCreatingSla(false);
      setNewTitle('');
      setNewDesc('');
      setNewCustomDeadline('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to schedule SLA approval record');
    } finally {
      setIsSavingNewSla(false);
    }
  };

  const handleManualCalendarSync = async (rec: ApprovalSlaRecord) => {
    if (!googleAuth.hasToken) {
      toast.info('Connecting to Google Calendar first...');
      try {
        const signRes = await googleSignIn();
        if (!signRes) return;
      } catch (err: any) {
        toast.error(err.message || 'Please sign in with Google to sync directly.');
        return;
      }
    }
    try {
      const synced = await approvalSlaAlertService.syncRecordToGoogleCalendar(rec.id, currentUser);
      toast.success(`Synced "${rec.recordTitle}" to your Google Calendar!`);
      refreshGoogleCalendarEvents();
      if (synced.htmlLink) {
        // Provide instant feedback
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to sync with Google Calendar API');
    }
  };

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden ${compactEmbedded ? 'p-1 border-0 shadow-none' : ''}`}>
      {/* Header Banner */}
      <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-400/40 flex items-center justify-center text-rose-300 shrink-0">
            <AlarmClock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-white">
                SLA Approval Deadlines, Triggered Alerts, Snooze & Google Calendar Sync
              </h3>
              {overdueCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-600 text-white animate-pulse">
                  {overdueCount} OVERDUE ALERT{overdueCount > 1 ? 'S' : ''} TRIGGERED
                </span>
              )}
              {snoozedCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/40">
                  {snoozedCount} Snoozed on Calendar
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Schedule mandatory response times when creating QC Inspections, NCRs, POs, Invoices, or Payroll records. Overdue records trigger persistent alerts until approved, with Acknowledge & Snooze synced to Google Calendar.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <GoogleWorkspaceSignInButton
            compact
            onSuccess={() => {
              refreshGoogleCalendarEvents();
            }}
          />

          {googleAuth.hasToken && (
            <button
              type="button"
              onClick={() => {
                setShowCalendarDrawer(!showCalendarDrawer);
                refreshGoogleCalendarEvents();
              }}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>My Calendar Events ({calendarEvents.length})</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsCreatingSla(true)}
            className="px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Schedule Approval SLA</span>
          </button>

          {onCloseModal && (
            <button
              type="button"
              onClick={onCloseModal}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Live Google Calendar Synced Events Drawer */}
      {showCalendarDrawer && googleAuth.hasToken && (
        <div className="p-4 bg-indigo-950/95 text-white border-b border-indigo-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-300" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-200">
                Live Google Calendar Primary Events & Snooze Reminders
              </h4>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={refreshGoogleCalendarEvents}
                className="px-2.5 py-1 rounded bg-indigo-900 hover:bg-indigo-800 text-[11px] font-semibold flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${loadingEvents ? 'animate-spin' : ''}`} />
                Refresh Calendar
              </button>
              <button
                type="button"
                onClick={() => setShowCalendarDrawer(false)}
                className="text-xs text-indigo-300 hover:text-white"
              >
                Hide
              </button>
            </div>
          </div>

          {calendarEvents.length === 0 ? (
            <div className="text-xs text-indigo-200 py-3">
              No upcoming events found in the last 24h. Click "Sync to Google Calendar" or "Acknowledge & Snooze" on any SLA item below to push reminders directly to your Google Calendar!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {calendarEvents.slice(0, 6).map(ev => (
                <div
                  key={ev.id}
                  className="p-3 rounded-xl bg-indigo-900/60 border border-indigo-700/70 flex flex-col justify-between gap-2 text-xs"
                >
                  <div>
                    <div className="font-bold text-white line-clamp-1">{ev.summary}</div>
                    <div className="text-[11px] text-indigo-300 mt-0.5">
                      {ev.start?.dateTime
                        ? new Date(ev.start.dateTime).toLocaleString()
                        : ev.start?.date}
                    </div>
                  </div>
                  {ev.htmlLink && (
                    <a
                      href={ev.htmlLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-300 hover:underline"
                    >
                      Open in Google Calendar <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Filter & KPI Strip */}
      <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'ALL', label: `All SLA Records (${allScopedRecords.length})` },
            { id: 'OVERDUE', label: `Triggered Alerts (${overdueCount})` },
            { id: 'SNOOZED', label: `Acknowledged & Snoozed (${snoozedCount})` },
            { id: 'ACTIVE', label: `Pending Action (${pendingCount + overdueCount + snoozedCount})` },
            { id: 'COMPLETED', label: `Completed / Approved (${completedCount})` }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? tab.id === 'OVERDUE'
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value as any)}
            className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-800"
          >
            <option value="ALL">All Approval Categories</option>
            <option value="QC_INSPECTION_APPROVAL">QC Inspection Approvals (Special Focus)</option>
            <option value="NCR_DISPOSITION_ACTION">NCR Disposition & CAPA Actions</option>
            <option value="PROCUREMENT_APPROVAL">Procurement (RQ / RFQ / PO / GRN / Return)</option>
            <option value="FINANCE_INVOICE_CONTRACT_APPROVAL">Finance, Invoices & Contracts</option>
            <option value="HR_PAYROLL_DISBURSEMENT_APPROVAL">Owned Factory HR & Payroll</option>
            <option value="FACTORY_WORK_PACKAGE_SIGNOFF">Factory Work Package Sign-off</option>
          </select>
        </div>
      </div>

      {/* SLA Records List */}
      <div className="p-5 space-y-3">
        {filteredRecords.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs bg-slate-50 rounded-xl border border-slate-200">
            No SLA approval records match the current filter.
          </div>
        ) : (
          filteredRecords.map(rec => {
            const isOverdue = rec.status === 'Overdue - Alert Triggered';
            const isSnoozed = rec.status === 'Acknowledged & Snoozed';
            const isCompleted =
              rec.status === 'Completed / Approved' || rec.status === 'Rejected';
            const timeInfo = formatRemainingOrOverdue(
              isSnoozed && rec.snoozedUntilIso ? rec.snoozedUntilIso : rec.deadlineIso
            );

            const templateCalUrl = buildGoogleCalendarTemplateUrl({
              title: `[SLA Reminder] ${rec.recordTitle}`,
              details: `${rec.recordDescription}\nRef: ${rec.referenceCode} (${rec.linkedRecordId})\nFactory: ${rec.factoryName}\nProject: ${rec.projectName}`,
              startIso: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
              endIso: new Date(
                Math.max(
                  Date.now() + 35 * 60 * 1000,
                  new Date(rec.snoozedUntilIso || rec.deadlineIso).getTime()
                )
              ).toISOString(),
              location: `${rec.factoryName} — ${rec.projectName}`
            });

            return (
              <div
                key={rec.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isOverdue
                    ? 'bg-rose-50/70 border-rose-300 shadow-xs'
                    : isSnoozed
                    ? 'bg-amber-50/60 border-amber-300'
                    : isCompleted
                    ? 'bg-emerald-50/40 border-emerald-200'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-900 text-white">
                        {rec.referenceCode}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">
                        {rec.categoryLabel}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          isOverdue
                            ? 'bg-rose-600 text-white animate-pulse'
                            : isSnoozed
                            ? 'bg-amber-500 text-white'
                            : isCompleted
                            ? 'bg-emerald-600 text-white'
                            : 'bg-blue-600 text-white'
                        }`}
                      >
                        {rec.status}
                      </span>
                      {!isCompleted && (
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 ${
                            timeInfo.isOverdue
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          {isSnoozed
                            ? `Snoozed until ${new Date(rec.snoozedUntilIso!).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })} (${timeInfo.label})`
                            : `Deadline: ${new Date(rec.deadlineIso).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })} (${timeInfo.label})`}
                        </span>
                      )}
                      {rec.googleCalendarEventId && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> Synced with Google Calendar
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-slate-900">{rec.recordTitle}</h4>
                    <p className="text-xs text-slate-600">{rec.recordDescription}</p>

                    <div className="pt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
                      <span>
                        Factory: <strong className="text-slate-800">{rec.factoryName}</strong>
                      </span>
                      <span>
                        Project: <strong className="text-slate-800">{rec.projectName}</strong>
                      </span>
                      <span>
                        Linked Ref: <strong className="text-slate-800">{rec.linkedRecordId}</strong>
                      </span>
                      <span>
                        Authorised Roles:{' '}
                        <strong className="text-indigo-700">{rec.assignedRoles.join(', ')}</strong>
                      </span>
                    </div>

                    {/* Snooze / Acknowledgement History */}
                    {rec.snoozeHistory && rec.snoozeHistory.length > 0 && (
                      <div className="mt-2 p-2.5 rounded-xl bg-white/90 border border-amber-200 text-[11px] space-y-1">
                        <div className="font-bold text-amber-900 flex items-center gap-1.5">
                          <History className="w-3.5 h-3.5 text-amber-600" />
                          Latest Acknowledgement & Snooze (Snooze Count: {rec.snoozeCount}):
                        </div>
                        <div className="text-slate-700">
                          <strong>{rec.snoozeHistory[0].snoozedByName}</strong> (
                          {rec.snoozeHistory[0].snoozedByRole}): "{rec.snoozeHistory[0].acknowledgementNote}" —
                          Reminder set for{' '}
                          <strong>
                            {new Date(rec.snoozeHistory[0].snoozedUntilIso).toLocaleString()}
                          </strong>
                        </div>
                      </div>
                    )}

                    {/* Completion details */}
                    {isCompleted && (
                      <div className="mt-2 p-2.5 rounded-xl bg-emerald-100/70 border border-emerald-200 text-[11px] text-emerald-950">
                        <strong>{rec.completionVerdict}</strong> by{' '}
                        <strong>{rec.completedByName}</strong> ({rec.completedByRole}) on{' '}
                        {rec.completedAtIso ? new Date(rec.completedAtIso).toLocaleString() : ''} — "
                        {rec.completionRemarks}"
                      </div>
                    )}
                  </div>

                  {/* Action Buttons Column */}
                  <div className="flex flex-wrap lg:flex-col items-stretch justify-end gap-2 shrink-0 min-w-[210px]">
                    {!isCompleted && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setActingRecord(rec);
                            setActionVerdict('Approved');
                          }}
                          className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Approve / Complete Job</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSnoozingRecord(rec);
                            setSnoozeMinutes(30);
                          }}
                          className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                            isOverdue
                              ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-2xs'
                              : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                          }`}
                        >
                          <AlarmClock className="w-4 h-4" />
                          <span>Acknowledge & Snooze</span>
                        </button>
                      </>
                    )}

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleManualCalendarSync(rec)}
                        className="flex-1 px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                        title="Push or update this deadline on your Google Calendar via API"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{rec.googleCalendarEventId ? 'Update Calendar' : 'Sync to Calendar'}</span>
                      </button>

                      {rec.googleCalendarHtmlLink ? (
                        <a
                          href={rec.googleCalendarHtmlLink}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center gap-1"
                          title="Open synced event in Google Calendar"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <a
                          href={templateCalUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center gap-1"
                          title="Open Google Calendar Event Template"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>

                    {!isCompleted && !isOverdue && (
                      <button
                        type="button"
                        onClick={() => {
                          approvalSlaAlertService.triggerImmediateOverdueAlertForDemo(rec.id);
                          toast.warning(
                            `Deadline expired for ${rec.referenceCode}! Persistent Overdue Alert triggered.`
                          );
                        }}
                        className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-semibold flex items-center justify-center gap-1 cursor-pointer"
                        title="Simulate deadline expiration to test triggered alert & snooze"
                      >
                        <Zap className="w-3 h-3" /> Test Deadline Trigger Now
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ===================================================================== */}
      {/* MODAL 1: ACKNOWLEDGE & SNOOZE REMINDER (WITH GOOGLE CALENDAR SYNC)    */}
      {/* ===================================================================== */}
      {snoozingRecord &&
        createPortal(
          <div className="fixed inset-0 z-[9999] bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
            <form
              onSubmit={handleAcknowledgeAndSnooze}
              className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <AlarmClock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Acknowledge Alert & Schedule Snooze Reminder
                    </h3>
                    <p className="text-xs text-slate-500">
                      {snoozingRecord.referenceCode} • {snoozingRecord.categoryLabel}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSnoozingRecord(null)}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950">
                <div className="font-bold">{snoozingRecord.recordTitle}</div>
                <div className="text-[11px] text-amber-800 mt-0.5">
                  Acknowledging this alert pauses the alarm until your selected snooze time and schedules a Google Calendar reminder. If the job is still not completed when the snooze expires, the alert will automatically trigger again.
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Select Snooze Reminder Duration:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {SNOOZE_PRESET_OPTIONS.map(opt => (
                      <button
                        key={opt.minutes}
                        type="button"
                        onClick={() => {
                          setSnoozeMinutes(opt.minutes);
                          setCustomSnoozeTime('');
                        }}
                        className={`py-2 px-2.5 rounded-xl font-bold border text-xs transition-all cursor-pointer ${
                          snoozeMinutes === opt.minutes && !customSnoozeTime
                            ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-2xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        + {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">
                    Or Pick Exact Snooze Date & Time (Optional):
                  </label>
                  <input
                    type="datetime-local"
                    value={customSnoozeTime}
                    onChange={e => setCustomSnoozeTime(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-xl text-xs bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">
                    Acknowledgement Reason / Status Note:
                  </label>
                  <textarea
                    rows={2}
                    value={snoozeNote}
                    onChange={e => setSnoozeNote(e.target.value)}
                    placeholder="Enter reason for snoozing (e.g., Waiting for lab ultrasonic test readout in 30 mins)..."
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs"
                  />
                </div>

                <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-between gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={syncSnoozeToGCal}
                      onChange={e => setSyncSnoozeToGCal(e.target.checked)}
                      className="rounded text-indigo-600"
                    />
                    <span className="font-bold text-indigo-950">
                      Sync Snooze Reminder to Google Calendar
                    </span>
                  </label>
                  <GoogleWorkspaceSignInButton compact />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSnoozingRecord(null)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSnooze}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Calendar className="w-4 h-4" />
                  <span>
                    {isSubmittingSnooze
                      ? 'Syncing Snooze...'
                      : 'Acknowledge & Snooze with Calendar Reminder'}
                  </span>
                </button>
              </div>
            </form>
          </div>,
          document.body
        )}

      {/* ===================================================================== */}
      {/* MODAL 2: COMPLETE APPROVAL / SIGN-OFF ACTION                          */}
      {/* ===================================================================== */}
      {actingRecord &&
        createPortal(
          <div className="fixed inset-0 z-[9999] bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
            <form
              onSubmit={handleCompleteAction}
              className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Execute Authorised Approval & Resolve SLA Alert
                    </h3>
                    <p className="text-xs text-slate-500">
                      {actingRecord.referenceCode} • Acting as {currentUser?.fullName} (
                      {currentUser?.roleName})
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActingRecord(null)}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <div className="font-bold text-slate-900">{actingRecord.recordTitle}</div>
                <div className="text-slate-600">{actingRecord.recordDescription}</div>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Approval Decision / Verdict:
                  </label>
                  <select
                    value={actionVerdict}
                    onChange={e => setActionVerdict(e.target.value as any)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-bold bg-slate-50"
                  >
                    <option value="Approved">Approved (Full Conformance / Released)</option>
                    <option value="Approved with Remarks">
                      Approved with Remarks (Conditional Release)
                    </option>
                    <option value="Rejected">Rejected (Quarantine / Rework Required)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Inspector / Approver Sign-off Remarks:
                  </label>
                  <textarea
                    rows={3}
                    value={actionRemarks}
                    onChange={e => setActionRemarks(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActingRecord(null)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAction}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {isSubmittingAction ? 'Recording Sign-Off...' : 'Sign & Complete Approval'}
                  </span>
                </button>
              </div>
            </form>
          </div>,
          document.body
        )}

      {/* ===================================================================== */}
      {/* MODAL 3: SCHEDULE NEW APPROVAL SLA & GOOGLE CALENDAR DEADLINE         */}
      {/* ===================================================================== */}
      {isCreatingSla &&
        createPortal(
          <div className="fixed inset-0 z-[9999] bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
            <form
              onSubmit={handleCreateNewSla}
              className="bg-white rounded-2xl border border-slate-200 max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Schedule Record Approval Deadline & Google Calendar Alert
                    </h3>
                    <p className="text-xs text-slate-500">
                      Assign authorised roles/users and set the exact time window before overdue alerts trigger.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreatingSla(false)}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Approval Category:</label>
                    <select
                      value={newCategory}
                      onChange={e => setNewCategory(e.target.value as ApprovalSlaCategory)}
                      className="w-full p-2 border border-slate-300 rounded-xl bg-slate-50 font-semibold"
                    >
                      <option value="QC_INSPECTION_APPROVAL">
                        QC Inspection Approval (Special Focus)
                      </option>
                      <option value="NCR_DISPOSITION_ACTION">NCR Disposition & CAPA Action</option>
                      <option value="PROCUREMENT_APPROVAL">
                        Procurement Approval (RQ/Quotation/PO/GRN)
                      </option>
                      <option value="FINANCE_INVOICE_CONTRACT_APPROVAL">
                        Finance, Invoice & Contract Approval
                      </option>
                      <option value="HR_PAYROLL_DISBURSEMENT_APPROVAL">
                        Owned Factory HR & Payroll Approval
                      </option>
                      <option value="FACTORY_WORK_PACKAGE_SIGNOFF">
                        Factory Work Package Sign-off
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Linked Record / Batch Code:
                    </label>
                    <input
                      type="text"
                      value={newLinkedId}
                      onChange={e => setNewLinkedId(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-xl font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Approval / Action Title:
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="e.g., QC Inspection Approval: Anodized Curtain Wall Mullion Batch #B-402"
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Factory:</label>
                    <select
                      value={newFactoryId}
                      onChange={e => setNewFactoryId(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-xl bg-slate-50"
                    >
                      {factories.map(f => (
                        <option key={f.id} value={f.id}>
                          {f.code} — {f.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Project:</label>
                    <select
                      value={newProjectId}
                      onChange={e => setNewProjectId(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-xl bg-slate-50"
                    >
                      <option value="PRJ-2026-001">PRJ-2026-001 — Altair Tower Skybridge Glazing</option>
                      <option value="PRJ-2026-002">PRJ-2026-002 — Port City Marina Acoustic Façade</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Allowed SLA Time Window:
                    </label>
                    <select
                      value={newDurationMins}
                      onChange={e => setNewDurationMins(Number(e.target.value))}
                      className="w-full p-2 border border-slate-300 rounded-xl bg-slate-50 font-semibold"
                    >
                      {SLA_DURATION_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Or Specific Deadline Date/Time:
                    </label>
                    <input
                      type="datetime-local"
                      value={newCustomDeadline}
                      onChange={e => setNewCustomDeadline(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-xl bg-slate-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Priority / Severity Level:</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['Normal', 'High', 'Urgent', 'Critical'] as const).map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setNewPriority(p)}
                        className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          newPriority === p
                            ? p === 'Critical'
                              ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                              : 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Authorised Roles Required to Act (Receives Direct Alerts):
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {AUTHORIZED_ROLES_LIST.map(role => {
                      const active = newRoles.includes(role);
                      return (
                        <button
                          key={role}
                          type="button"
                          onClick={() =>
                            setNewRoles(prev =>
                              prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
                            )
                          }
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                            active
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {role}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Instructions & Inspection Criteria:
                  </label>
                  <textarea
                    rows={2}
                    value={newDesc}
                    onChange={e => setNewDesc(e.target.value)}
                    placeholder="Specify tolerances, documents, or sign-off requirements..."
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  />
                </div>

                <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-between gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newSyncCal}
                      onChange={e => setNewSyncCal(e.target.checked)}
                      className="rounded text-indigo-600"
                    />
                    <span className="font-bold text-indigo-950">
                      Automatically Create Deadline Reminder on Google Calendar
                    </span>
                  </label>
                  <GoogleWorkspaceSignInButton compact />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreatingSla(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingNewSla}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Calendar className="w-4 h-4" />
                  <span>
                    {isSavingNewSla ? 'Scheduling SLA...' : 'Schedule SLA & Sync Google Calendar'}
                  </span>
                </button>
              </div>
            </form>
          </div>,
          document.body
        )}
    </div>
  );
};

/**
 * Global Persistent Alert Bar shown across the application whenever any SLA Approval
 * (especially QC Inspection Approval) is Overdue / Triggered for the current user or role.
 */
export const GlobalSlaPersistentAlertBanner: React.FC = () => {
  const { currentUser } = useSecurity();
  const [tick, setTick] = useState(0);
  const [isHubModalOpen, setIsHubModalOpen] = useState(false);
  const [quickSnoozeTarget, setQuickSnoozeTarget] = useState<ApprovalSlaRecord | null>(null);
  const [quickSnoozeMins, setQuickSnoozeMins] = useState<number>(30);
  const [quickSnoozeNote, setQuickSnoozeNote] = useState<string>(
    'Acknowledged overdue QC / Approval alert — snoozed with Google Calendar reminder.'
  );
  const [isSnoozing, setIsSnoozing] = useState(false);

  useEffect(() => {
    const unsub = subscribeSlaUpdates(() => setTick(t => t + 1));
    const timer = setInterval(() => {
      approvalSlaAlertService.evaluateAndGetRecords();
      setTick(t => t + 1);
    }, 8000);
    return () => {
      unsub();
      clearInterval(timer);
    };
  }, []);

  const allRecords = useMemo(
    () => approvalSlaAlertService.getScopedRecords({ user: currentUser }),
    [currentUser, tick]
  );

  const overdueRecords = useMemo(
    () =>
      allRecords.filter(
        r =>
          r.status === 'Overdue - Alert Triggered' &&
          approvalSlaAlertService.isUserAuthorizedForRecord(currentUser, r)
      ),
    [allRecords, currentUser]
  );

  const snoozedRecords = useMemo(
    () => allRecords.filter(r => r.status === 'Acknowledged & Snoozed'),
    [allRecords]
  );

  const handleQuickSnoozeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickSnoozeTarget) return;
    try {
      setIsSnoozing(true);
      const res = await approvalSlaAlertService.acknowledgeAndSnoozeSlaRecord(
        quickSnoozeTarget.id,
        currentUser,
        {
          snoozeDurationMinutes: quickSnoozeMins,
          acknowledgementNote: quickSnoozeNote,
          syncToGoogleCalendar: true
        }
      );
      toast.success(
        res.calendarSynced
          ? `Acknowledged & Snoozed for ${quickSnoozeMins} mins (Synced to Google Calendar!)`
          : `Acknowledged & Snoozed for ${quickSnoozeMins} mins!`
      );
      setQuickSnoozeTarget(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to snooze alert');
    } finally {
      setIsSnoozing(false);
    }
  };

  const handleQuickApprove = async (rec: ApprovalSlaRecord) => {
    try {
      await approvalSlaAlertService.completeSlaRecordAction(rec.id, currentUser, {
        verdict: 'Approved',
        remarks: `Approved directly from Persistent SLA Alert Banner by ${currentUser?.fullName}.`
      });
      toast.success(`Approved ${rec.referenceCode}! Alert resolved.`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve record');
    }
  };

  return (
    <>
      {overdueRecords.length > 0 ? (
        <div className="bg-gradient-to-r from-rose-700 via-red-600 to-rose-700 text-white px-4 py-2.5 shadow-md border-b border-rose-500">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="p-1.5 rounded-lg bg-white/15 text-white animate-bounce shrink-0">
                <BellRing className="w-4 h-4" />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded bg-amber-300 text-slate-950 text-[10px] font-black uppercase">
                    {overdueRecords.length} SLA DEADLINE ALERT{overdueRecords.length > 1 ? 'S' : ''} TRIGGERED
                  </span>
                  <span className="text-xs font-bold text-white truncate">
                    {overdueRecords[0].referenceCode}: {overdueRecords[0].recordTitle}
                  </span>
                </div>
                <p className="text-[11px] text-rose-100 truncate">
                  Assigned to: <strong>{overdueRecords[0].assignedRoles.join(', ')}</strong> •{' '}
                  {overdueRecords[0].factoryName} ({overdueRecords[0].projectName}) — Persistent alert active until job is completed or snoozed.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  setQuickSnoozeTarget(overdueRecords[0]);
                  setQuickSnoozeMins(30);
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <AlarmClock className="w-3.5 h-3.5" />
                <span>Acknowledge & Snooze (Calendar)</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickApprove(overdueRecords[0])}
                className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Approve Now</span>
              </button>

              <button
                type="button"
                onClick={() => setIsHubModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-slate-950/60 hover:bg-slate-950 text-white border border-white/25 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>SLA & Calendar Hub ({allRecords.length})</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 text-slate-200 px-4 py-1.5 border-b border-slate-800 text-xs">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                <strong>SLA Approval & Google Calendar Monitor:</strong> No overdue alerts right now
                {snoozedRecords.length > 0
                  ? ` (${snoozedRecords.length} snoozed reminder(s) scheduled on Google Calendar)`
                  : ''}.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsHubModalOpen(true)}
              className="px-2.5 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-[11px] flex items-center gap-1 cursor-pointer border border-slate-700"
            >
              <Calendar className="w-3 h-3" /> Open SLA Deadlines & Google Calendar Hub
            </button>
          </div>
        </div>
      )}

      {/* Quick Acknowledge & Snooze Modal from Banner */}
      {quickSnoozeTarget &&
        createPortal(
          <div className="fixed inset-0 z-[9999] bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
            <form
              onSubmit={handleQuickSnoozeSubmit}
              className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <AlarmClock className="w-5 h-5 text-amber-600" />
                  Acknowledge & Snooze on Google Calendar
                </h3>
                <button
                  type="button"
                  onClick={() => setQuickSnoozeTarget(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs">
                <div className="font-bold text-rose-950">{quickSnoozeTarget.recordTitle}</div>
                <div className="text-[11px] text-rose-700 mt-0.5">
                  Ref: {quickSnoozeTarget.referenceCode} • {quickSnoozeTarget.factoryName}
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Snooze Duration (Alert will re-trigger if not completed):
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {SNOOZE_PRESET_OPTIONS.map(opt => (
                      <button
                        key={opt.minutes}
                        type="button"
                        onClick={() => setQuickSnoozeMins(opt.minutes)}
                        className={`py-2 px-2 rounded-xl font-bold border text-xs cursor-pointer ${
                          quickSnoozeMins === opt.minutes
                            ? 'bg-amber-500 text-slate-950 border-amber-600'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        + {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Acknowledgement Note:
                  </label>
                  <textarea
                    rows={2}
                    value={quickSnoozeNote}
                    onChange={e => setQuickSnoozeNote(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-xl text-xs"
                  />
                </div>

                <div className="pt-1 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-600">
                    Google Calendar Auto-Sync:
                  </span>
                  <GoogleWorkspaceSignInButton compact />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setQuickSnoozeTarget(null)}
                  className="px-3 py-1.5 rounded-xl text-xs text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSnoozing}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 flex items-center gap-1.5 cursor-pointer"
                >
                  <Calendar className="w-4 h-4" />
                  <span>{isSnoozing ? 'Syncing...' : 'Acknowledge & Snooze'}</span>
                </button>
              </div>
            </form>
          </div>,
          document.body
        )}

      {/* Full SLA & Google Calendar Hub Modal */}
      {isHubModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[9998] bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="max-w-6xl w-full max-h-[92vh] overflow-y-auto rounded-2xl shadow-2xl">
              <SlaApprovalHubPanel onCloseModal={() => setIsHubModalOpen(false)} />
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
