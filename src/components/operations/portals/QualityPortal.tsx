import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, AlertTriangle, CheckCircle2, FileCheck, 
  AlertOctagon, Lock, Unlock, Download, Calendar, AlarmClock
} from 'lucide-react';
import { centralApiGateway } from '../../../services/centralApiGateway';
import { 
  QualityInspectionPlan, QualityInspectionExecution, QualityAlert, 
  NonConformanceReport, CorrectivePreventiveAction, MaterialTraceabilityRecord 
} from '../../../types/operationalControl';
import { useSecurity } from '../../../context/SecurityContext';
import { RoleScopedFactoryProjectHub } from './RoleScopedFactoryProjectHub';
import { GoogleWorkspaceSignInButton } from '../SlaApprovalAlertCenterModal';
import { approvalSlaAlertService } from '../../../services/approvalSlaAlertService';
import { toast } from 'sonner';

export const QualityPortal: React.FC = () => {
  const { currentUser } = useSecurity();
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'sla_approvals' | 'itp_plans' | 'inspections' | 'alerts' | 'ncr' | 'capa' | 'hold_release' | 'traceability' | 'reports'
  >('dashboard');

  const [plans, setPlans] = useState<QualityInspectionPlan[]>([]);
  const [inspections, setInspections] = useState<QualityInspectionExecution[]>([]);
  const [alerts, setAlerts] = useState<QualityAlert[]>([]);
  const [ncrs, setNcrs] = useState<NonConformanceReport[]>([]);
  const [capas, setCapas] = useState<CorrectivePreventiveAction[]>([]);
  const [traceability, setTraceability] = useState<MaterialTraceabilityRecord[]>([]);

  // Execution modal state + SLA scheduling
  const [isInspecting, setIsInspecting] = useState(false);
  const [newBatchNo, setNewBatchNo] = useState('BATCH-2026-');
  const [newResult, setNewResult] = useState<'Passed' | 'Passed with Remarks' | 'Rejected - NCR Initiated'>('Passed');
  const [newFindings, setNewFindings] = useState('');
  const [qcSlaMinutes, setQcSlaMinutes] = useState<number>(60);
  const [qcCustomDeadline, setQcCustomDeadline] = useState<string>('');
  const [qcSyncCalendar, setQcSyncCalendar] = useState<boolean>(true);
  const [qcAssignedRoles] = useState<string[]>([
    'QA/QC Inspector',
    'Factory Manager',
    'Project Factory Engineer'
  ]);

  // NCR modal state + SLA scheduling
  const [isCreatingNcr, setIsCreatingNcr] = useState(false);
  const [ncrTitle, setNcrTitle] = useState('');
  const [ncrCategory, setNcrCategory] = useState<NonConformanceReport['defectCategory']>('Dimensional Deviation');
  const [ncrQty, setNcrQty] = useState(1);
  const [ncrDesc, setNcrDesc] = useState('');
  const [ncrSlaMinutes, setNcrSlaMinutes] = useState<number>(120);
  const [ncrSyncCalendar, setNcrSyncCalendar] = useState<boolean>(true);

  useEffect(() => {
    try {
      setPlans(centralApiGateway.getQualityInspectionPlans(currentUser));
      setInspections(centralApiGateway.getInspections(currentUser));
      setAlerts(centralApiGateway.getQualityAlerts(currentUser));
      setNcrs(centralApiGateway.getNcrs(currentUser));
      setCapas(centralApiGateway.getCapas(currentUser));
      setTraceability(centralApiGateway.getTraceability(currentUser));
    } catch (e) {
      console.error(e);
    }
  }, [currentUser]);

  const handleRunInspection = async () => {
    try {
      centralApiGateway.executeInspection(currentUser, {
        planId: plans[0]?.id || 'plan-01',
        projectId: 'proj-001',
        productBatchNumber: newBatchNo,
        inspectorName: currentUser?.fullName || 'Senior QA Inspector',
        inspectionType: 'In-Process Fabrication',
        overallResult: newResult,
        findings: newFindings || '100% Dimensional checkpoints verified within ISO 2768 tolerance.',
        checkResults: [
          { checkpointId: 'cp-1', passed: newResult !== 'Rejected - NCR Initiated', recordedValue: 'All dimensions in spec' }
        ],
        attachments: []
      });

      // Schedule mandatory QC Inspection Approval SLA & Google Calendar Reminder
      const slaRes = await approvalSlaAlertService.createSlaRecord(currentUser, {
        linkedRecordId: newBatchNo || `IQC-${Date.now()}`,
        recordTitle: `QC Inspection Approval: Batch ${newBatchNo} (${newResult})`,
        recordDescription:
          newFindings ||
          'Mandatory QC Inspection sign-off required within SLA window. Persistent alert will trigger if deadline expires.',
        category: 'QC_INSPECTION_APPROVAL',
        factoryId: 'fac-inv-01',
        factoryName: 'Innovista Colombo Aluminium & Glazing Plant',
        projectId: 'PRJ-2026-001',
        projectName: 'Altair Tower Skybridge Glazing',
        assignedRoles: qcAssignedRoles.length > 0 ? qcAssignedRoles : ['QA/QC Inspector', 'Factory Manager'],
        slaDurationMinutes: qcSlaMinutes,
        customDeadlineIso: qcCustomDeadline || undefined,
        priority: newResult === 'Rejected - NCR Initiated' ? 'Critical' : 'Urgent',
        syncToGoogleCalendar: qcSyncCalendar
      });

      toast.success(
        slaRes.calendarSynced
          ? `QC Inspection submitted with ${qcSlaMinutes}m Approval SLA & synced to Google Calendar!`
          : `QC Inspection submitted with ${qcSlaMinutes}m Approval SLA (${slaRes.record.referenceCode})!`
      );

      setInspections(centralApiGateway.getInspections(currentUser));
      setIsInspecting(false);
      setNewFindings('');
      setQcCustomDeadline('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to record inspection');
    }
  };

  const handleCreateNcr = async () => {
    if (!ncrTitle.trim()) {
      toast.error('Please enter NCR title');
      return;
    }
    try {
      centralApiGateway.createNcr(currentUser, {
        projectId: 'proj-001',
        title: ncrTitle,
        severity: 'Major',
        status: 'Logged',
        source: 'Workshop Line',
        defectCategory: ncrCategory,
        description: ncrDesc || 'Out of spec deviation logged by QA Inspector.',
        suspectQuantity: ncrQty,
        quarantineLocation: 'Yellow Quarantine Bay QC-02',
        disposition: 'Pending',
        costOfPoorQuality: 1500,
        capaRequired: true
      });

      const slaRes = await approvalSlaAlertService.createSlaRecord(currentUser, {
        linkedRecordId: `NCR-2026-${Math.floor(100 + Math.random() * 899)}`,
        recordTitle: `NCR Disposition & Action Approval: ${ncrTitle} (${ncrCategory})`,
        recordDescription:
          ncrDesc ||
          `Quarantined ${ncrQty} unit(s) in Yellow Quarantine Bay QC-02. Mandatory disposition & corrective action required within SLA.`,
        category: 'NCR_DISPOSITION_ACTION',
        factoryId: 'fac-inv-01',
        factoryName: 'Innovista Colombo Aluminium & Glazing Plant',
        projectId: 'PRJ-2026-001',
        projectName: 'Altair Tower Skybridge Glazing',
        assignedRoles: ['QA/QC Inspector', 'Factory Manager', 'Project Factory Engineer'],
        slaDurationMinutes: ncrSlaMinutes,
        priority: 'Critical',
        syncToGoogleCalendar: ncrSyncCalendar
      });

      toast.success(
        slaRes.calendarSynced
          ? `NCR issued with ${ncrSlaMinutes}m Disposition SLA & synced to Google Calendar!`
          : `NCR issued with ${ncrSlaMinutes}m Disposition SLA (${slaRes.record.referenceCode})!`
      );

      setNcrs(centralApiGateway.getNcrs(currentUser));
      setIsCreatingNcr(false);
      setNcrTitle('');
      setNcrDesc('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to create NCR');
    }
  };

  const handleResolveAlert = (alertId: string) => {
    try {
      centralApiGateway.resolveQualityAlert(currentUser, alertId, 'Inspector verified root cause corrected & line safe to resume');
      setAlerts(centralApiGateway.getQualityAlerts(currentUser));
    } catch (err: any) {
      alert(err.message || 'Failed to resolve alert');
    }
  };

  return (
    <div className="space-y-6">
      {/* Role-Based Factory & Project QC Inspection, NCR, Return & Supervising Hub */}
      <RoleScopedFactoryProjectHub
        portalName="Quality Control, Inspection & NCR Portal"
        defaultSubTab="procurement"
      />

      {/* Top QA Navigation Hub */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                Quality Assurance & QC
              </span>
              <span className="text-xs text-slate-400">Total Quality Management (TQM) Engine</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
              Quality Control Department
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Inspection plans, digital checklists, Andon line-stop alerts, NCR dispositioning, 5-Why CAPA, and complete mill certificate material traceability.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsInspecting(true)}
              className="px-3.5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <FileCheck className="w-4 h-4" /> Run Digital Inspection
            </button>
            <button
              onClick={() => setIsCreatingNcr(true)}
              className="px-3.5 py-2 text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <AlertTriangle className="w-4 h-4" /> Log NCR
            </button>
          </div>
        </div>

        {/* Sub-portal Tabs */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-4 border-t border-slate-100">
          {[
            { id: 'dashboard', label: 'Quality Dashboard' },
            { id: 'itp_plans', label: `Inspection Plans (${plans.length})` },
            { id: 'inspections', label: `Inspections (${inspections.length})` },
            { id: 'alerts', label: `Quality Alerts (${alerts.length})` },
            { id: 'ncr', label: `NCR Management (${ncrs.length})` },
            { id: 'capa', label: `CAPA Root-Cause (${capas.length})` },
            { id: 'hold_release', label: 'Hold / Release' },
            { id: 'traceability', label: `Traceability (${traceability.length})` },
            { id: 'reports', label: 'Quality Reports' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${activeTab === tab.id ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Modal: Run Inspection + Schedule QC Approval SLA & Google Calendar */}
      {isInspecting && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-emerald-600" />
              Execute Quality Inspection (ITP) & Schedule Approval SLA
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Batch / Barcode Identifier:</label>
                <input 
                  type="text" 
                  value={newBatchNo}
                  onChange={e => setNewBatchNo(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Inspection Verdict:</label>
                <select 
                  value={newResult}
                  onChange={e => setNewResult(e.target.value as any)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-slate-50"
                >
                  <option value="Passed">Passed (Conforms to Specification)</option>
                  <option value="Passed with Remarks">Passed with Remarks</option>
                  <option value="Rejected - NCR Initiated">Rejected - NCR Initiated</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Inspector Findings & Measurements:</label>
                <textarea 
                  value={newFindings}
                  onChange={e => setNewFindings(e.target.value)}
                  placeholder="Record caliper readings, dye penetrant results, coating DFT (microns), etc."
                  rows={2}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              {/* Mandatory QC Approval SLA Deadline & Google Calendar Section */}
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-950 flex items-center gap-1.5">
                    <AlarmClock className="w-4 h-4 text-amber-600" />
                    Mandatory QC Approval Deadline & Alert SLA
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-200 text-amber-900">
                    Persistent Alert Until Approved
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-amber-900 mb-1">
                      Required Approval Window:
                    </label>
                    <select
                      value={qcSlaMinutes}
                      onChange={e => setQcSlaMinutes(Number(e.target.value))}
                      className="w-full p-1.5 border border-amber-300 rounded-lg bg-white text-xs font-semibold"
                    >
                      <option value={15}>15 Minutes (Immediate Hold)</option>
                      <option value={30}>30 Minutes (Rapid Shopfloor)</option>
                      <option value={60}>1 Hour (Standard IQC/FAT)</option>
                      <option value={120}>2 Hours (Engineering/QC Sign-off)</option>
                      <option value={240}>4 Hours (Same Shift)</option>
                      <option value={1440}>24 Hours (1 Day)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-amber-900 mb-1">
                      Or Specific Deadline Time:
                    </label>
                    <input
                      type="datetime-local"
                      value={qcCustomDeadline}
                      onChange={e => setQcCustomDeadline(e.target.value)}
                      className="w-full p-1.5 border border-amber-300 rounded-lg bg-white text-xs"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-indigo-950">
                    <input
                      type="checkbox"
                      checked={qcSyncCalendar}
                      onChange={e => setQcSyncCalendar(e.target.checked)}
                    />
                    <span>Sync Deadline & Snooze Reminders to Google Calendar</span>
                  </label>
                  <GoogleWorkspaceSignInButton compact />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button 
                onClick={() => setIsInspecting(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button 
                onClick={handleRunInspection}
                className="px-4 py-1.5 text-xs font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-1.5"
              >
                <Calendar className="w-3.5 h-3.5" />
                Sign, Schedule SLA & Submit Inspection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create NCR */}
      {isCreatingNcr && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-lg w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              Issue Non-Conformance Report (NCR) & Schedule Action SLA
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">NCR Title:</label>
                <input 
                  type="text" 
                  value={ncrTitle}
                  onChange={e => setNcrTitle(e.target.value)}
                  placeholder="e.g. Weld undercut along flange box beam"
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Defect Category:</label>
                  <select 
                    value={ncrCategory}
                    onChange={e => setNcrCategory(e.target.value as any)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-slate-50"
                  >
                    <option value="Dimensional Deviation">Dimensional Deviation</option>
                    <option value="Weld Porosity / Crack">Weld Porosity / Crack</option>
                    <option value="Coating Blister">Coating Blister</option>
                    <option value="Material Substitution">Material Substitution</option>
                    <option value="Assembly Misalignment">Assembly Misalignment</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Suspect Quantity:</label>
                  <input 
                    type="number" 
                    min="1"
                    value={ncrQty}
                    onChange={e => setNcrQty(Number(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Description & Evidence:</label>
                <textarea 
                  value={ncrDesc}
                  onChange={e => setNcrDesc(e.target.value)}
                  rows={2}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-rose-900 flex items-center gap-1">
                    <AlarmClock className="w-3.5 h-3.5" /> NCR Disposition SLA Window:
                  </span>
                  <select
                    value={ncrSlaMinutes}
                    onChange={e => setNcrSlaMinutes(Number(e.target.value))}
                    className="p-1 border border-rose-300 rounded bg-white text-xs font-bold"
                  >
                    <option value={30}>30 Minutes (Critical Line Stop)</option>
                    <option value={60}>1 Hour</option>
                    <option value={120}>2 Hours (Standard NCR SLA)</option>
                    <option value={240}>4 Hours</option>
                    <option value={1440}>24 Hours</option>
                  </select>
                </div>
                <label className="flex items-center gap-1.5 text-[11px] font-semibold text-rose-950 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ncrSyncCalendar}
                    onChange={e => setNcrSyncCalendar(e.target.checked)}
                  />
                  <span>Sync NCR Disposition Deadline & Reminders to Google Calendar</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button 
                onClick={() => setIsCreatingNcr(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateNcr}
                className="px-4 py-1.5 text-xs font-bold bg-rose-600 text-white rounded-lg hover:bg-rose-700"
              >
                Issue NCR, Schedule SLA & Quarantine
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 1: Quality Dashboard */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-400 block font-medium">First Pass Yield (FPY)</span>
              <span className="text-2xl font-bold text-emerald-600 mt-1 block">98.4%</span>
              <span className="text-[11px] text-slate-500 mt-1 block">Above ISO benchmark (97%)</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-400 block font-medium">Active Open NCRs</span>
              <span className="text-2xl font-bold text-amber-600 mt-1 block">{ncrs.filter(n => n.status !== 'Closed').length} Active</span>
              <span className="text-[11px] text-slate-500 mt-1 block">1 Pending Disposition</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-400 block font-medium">Line Stop Alerts</span>
              <span className="text-2xl font-bold text-slate-900 mt-1 block">
                {alerts.filter(a => a.isStopLineActive).length} Halted
              </span>
              <span className="text-[11px] text-emerald-600 mt-1 block">All production bays running</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-400 block font-medium">Traceability Coverage</span>
              <span className="text-2xl font-bold text-indigo-600 mt-1 block">100%</span>
              <span className="text-[11px] text-slate-500 mt-1 block">Heat & Mill certificates verified</span>
            </div>
          </div>

          {/* Active Quality Alerts (Andon) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-amber-500" />
              Live Workshop Andon Quality Alerts
            </h4>
            <div className="divide-y divide-slate-100">
              {alerts.map(a => (
                <div key={a.id} className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs">{a.alertNumber}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${a.severity === 'CRITICAL_STOP_LINE' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
                        {a.severity}
                      </span>
                      <span className="font-semibold text-slate-800 text-xs">{a.title}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Station: <strong>{a.workStationName}</strong> • Reported by: {a.issuedBy} • Containment: {a.containmentAction}
                    </div>
                  </div>

                  {!a.resolved ? (
                    <button
                      onClick={() => handleResolveAlert(a.id)}
                      className="px-3 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold rounded-lg border border-emerald-200"
                    >
                      Resolve & Release
                    </button>
                  ) : (
                    <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Resolved
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Inspection Plans */}
      {activeTab === 'itp_plans' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h4 className="text-sm font-bold text-slate-900">Registered Inspection & Test Plans (ITP)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plans.map(p => (
              <div key={p.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900">{p.planNumber}</span>
                  <span className="px-2 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800 text-[10px]">{p.status}</span>
                </div>
                <h5 className="text-xs font-bold text-slate-800">{p.title}</h5>
                <div className="text-xs text-slate-500 space-y-1">
                  <div>Type: <strong className="text-slate-700">{p.inspectionType}</strong></div>
                  <div>Standard: <strong className="text-slate-700">{p.standardReference}</strong></div>
                  <div>Frequency: {p.frequency}</div>
                  {p.mandatoryHoldPoint && (
                    <div className="text-rose-600 font-semibold text-[11px] flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Mandatory Hold Point (Cannot advance work order until approved)
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Inspections List */}
      {activeTab === 'inspections' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h4 className="text-sm font-bold text-slate-900">Executed Inspection Records</h4>
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
            {inspections.map(i => (
              <div key={i.id} className="p-4 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{i.inspectionNumber}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${i.overallResult === 'Passed' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                      {i.overallResult}
                    </span>
                    <span className="text-slate-500">Batch: {i.productBatchNumber}</span>
                  </div>
                  <div className="text-slate-600 mt-1">
                    Findings: {i.findings}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Inspector: {i.inspectorName} • Date: {new Date(i.inspectionDate).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Quality Alerts */}
      {activeTab === 'alerts' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h4 className="text-sm font-bold text-slate-900">Quality Alerts Log</h4>
          <div className="space-y-3">
            {alerts.map(a => (
              <div key={a.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{a.alertNumber}: {a.title}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${a.resolved ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                    {a.resolved ? 'Resolved' : 'Active Alert'}
                  </span>
                </div>
                <div className="text-slate-600">Station: <strong>{a.workStationName}</strong> • Category: {a.category}</div>
                <div className="text-slate-500">Containment: {a.containmentAction}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: NCR Management */}
      {activeTab === 'ncr' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h4 className="text-sm font-bold text-slate-900">Non-Conformance Reports (NCR)</h4>
          <div className="space-y-3">
            {ncrs.map(n => (
              <div key={n.id} className="p-4 rounded-xl border border-amber-200 bg-amber-50/30 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-amber-950">{n.ncrNumber}</span>
                    <span className="font-semibold text-slate-800">{n.title}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-900">{n.status}</span>
                  </div>
                  <span className="text-rose-600 font-bold">COPQ: AED {n.costOfPoorQuality.toLocaleString()}</span>
                </div>
                <p className="text-slate-600">{n.description}</p>
                <div className="flex flex-wrap items-center gap-4 text-slate-500 pt-1 border-t border-amber-200/50">
                  <span>Defect: <strong>{n.defectCategory}</strong></span>
                  <span>Quarantine: <strong>{n.quarantineLocation}</strong></span>
                  <span>Disposition: <strong className="text-slate-900">{n.disposition}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 6: CAPA Root Cause */}
      {activeTab === 'capa' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h4 className="text-sm font-bold text-slate-900">Corrective and Preventive Actions (CAPA)</h4>
          <div className="space-y-4">
            {capas.map(c => (
              <div key={c.id} className="p-5 rounded-xl border border-slate-200 bg-slate-50 text-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{c.capaNumber}</span>
                    <span className="font-semibold text-slate-800">{c.title}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-100 text-indigo-800">{c.status}</span>
                </div>
                <div className="p-3 rounded-lg bg-white border border-slate-200 text-slate-700">
                  <strong>Root Cause (5-Why):</strong> {c.rootCauseSummary}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <h5 className="font-bold text-slate-800 mb-1">Corrective Measures:</h5>
                    <ul className="list-disc pl-4 space-y-1 text-slate-600">
                      {c.correctiveActions.map((ca, idx) => (
                        <li key={idx} className={ca.completed ? 'line-through text-slate-400' : ''}>
                          {ca.action} ({ca.owner})
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-800 mb-1">Systemic Preventive Measures:</h5>
                    <ul className="list-disc pl-4 space-y-1 text-slate-600">
                      {c.preventiveActions.map((pa, idx) => (
                        <li key={idx}>
                          {pa.action} ({pa.owner})
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 7: Hold / Release */}
      {activeTab === 'hold_release' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h4 className="text-sm font-bold text-slate-900">Quarantine & Hold / Release Register</h4>
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 text-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Unlock className="w-5 h-5 text-emerald-600" />
              <div>
                <span className="font-bold text-slate-900">Bay QC-01 (Structural Cantilever Sub-assemblies)</span>
                <p className="text-slate-600">Released by QA Inspector David Okafor after 100% UT weld clearance.</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full font-bold bg-emerald-100 text-emerald-800 text-[11px]">RELEASED TO SITE</span>
          </div>

          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 text-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-amber-600" />
              <div>
                <span className="font-bold text-slate-900">Bay QC-02 (Perforated Screen Panels)</span>
                <p className="text-slate-600">Quarantined under NCR-2026-0018 pending hole pitch rework.</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full font-bold bg-amber-100 text-amber-800 text-[11px]">ACTIVE HOLD</span>
          </div>
        </div>
      )}

      {/* Tab 8: Traceability Matrix */}
      {activeTab === 'traceability' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h4 className="text-sm font-bold text-slate-900">Heat Number & Mill Certificate Traceability Matrix</h4>
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
            {traceability.map(t => (
              <div key={t.id} className="p-4 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">{t.heatNumber}</span>
                    <span className="font-bold text-slate-900">{t.materialGrade}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                      Mill Cert Validated
                    </span>
                  </div>
                  <div className="text-slate-500 mt-1">
                    Mill Cert: <strong>{t.millCertificateNumber}</strong> • Supplier: {t.supplierName} • Barcode: {t.batchBarcode}
                  </div>
                  <div className="text-slate-400 mt-0.5 text-[11px]">
                    Allocated Project: {t.assignedProjectCode} • Received: {t.quantityReceived} KG • Consumed: {t.quantityConsumed} KG
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-mono text-slate-500 block">NDT Ref: {t.ndtReportRef}</span>
                  <span className="text-xs font-bold text-emerald-600">PMI Positive</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 9: Quality Reports */}
      {activeTab === 'reports' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h4 className="text-sm font-bold text-slate-900">Automated Quality Reports & Dossiers</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <span className="font-bold text-slate-900 text-xs block">Monthly ISO 9001:2015 QA Summary</span>
              <p className="text-xs text-slate-500">Defect density, Cost of Poor Quality (COPQ), and calibration compliance rates.</p>
              <button 
                onClick={() => alert('Generating formal PDF Quality Summary Report...')}
                className="w-full py-1.5 text-xs font-semibold text-emerald-700 bg-white hover:bg-emerald-50 rounded-lg border border-emerald-200 flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Export PDF Dossier
              </button>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <span className="font-bold text-slate-900 text-xs block">Comprehensive Mill Certificate Dossier</span>
              <p className="text-xs text-slate-500">Complete bundle of raw material test certificates and chemical analysis (PMI).</p>
              <button 
                onClick={() => alert('Generating Mill Certificate Binder...')}
                className="w-full py-1.5 text-xs font-semibold text-emerald-700 bg-white hover:bg-emerald-50 rounded-lg border border-emerald-200 flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Export Traceability Binder
              </button>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <span className="font-bold text-slate-900 text-xs block">NCR & CAPA Effectiveness Audit</span>
              <p className="text-xs text-slate-500">Root cause closure rate and verification metrics for executive management.</p>
              <button 
                onClick={() => alert('Exporting CAPA audit spreadsheet...')}
                className="w-full py-1.5 text-xs font-semibold text-emerald-700 bg-white hover:bg-emerald-50 rounded-lg border border-emerald-200 flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Export Excel Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
