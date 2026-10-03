import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Camera,
  ClipboardCheck,
  CheckCircle2,
  Eye,
  Download,
  Printer,
  Trash2,
  Edit3
} from 'lucide-react';
import { FactoryQuotationDocumentModal, FactoryRecordDocumentSpec } from './FactoryQuotationDocumentModal';
import {
  buildDailyLogDocSpec,
  buildWorksheetDocSpec,
  buildEvidenceDocSpec
} from './factoryDocumentBuilders';
import {
  FactoryMasterProfile,
  FactoryExecutionTask,
  DigitalWorksheetRecord,
  DailyFactoryActivityReport,
  MediaEvidenceRecord
} from '../../types/factoryPortal';
import { SecurityUser } from '../../types/security';
import { factoryExecutionService } from '../../services/factoryExecutionService';
import { toast } from 'sonner';

interface WorksheetsDailyAndMediaTabProps {
  currentUser: SecurityUser | null;
  factories: FactoryMasterProfile[];
  tasks: FactoryExecutionTask[];
  worksheets: DigitalWorksheetRecord[];
  dailyReports: DailyFactoryActivityReport[];
  mediaEvidence: MediaEvidenceRecord[];
  onRefresh: () => void;
}

export const WorksheetsDailyAndMediaTab: React.FC<WorksheetsDailyAndMediaTabProps> = ({
  currentUser,
  factories,
  tasks,
  worksheets,
  dailyReports,
  mediaEvidence,
  onRefresh
}) => {
  const [subView, setSubView] = useState<'worksheets' | 'daily_reports' | 'media_evidence'>('daily_reports');
  const isFmAccount = useMemo(
    () => factoryExecutionService.isFactoryManagerAccount(currentUser),
    [currentUser]
  );
  const canApprove = useMemo(
    () => factoryExecutionService.canApproveQualityInspection(currentUser),
    [currentUser]
  );

  // View Full Details Modals
  const [viewDailyReport, setViewDailyReport] = useState<DailyFactoryActivityReport | null>(null);
  const [viewWorksheet, setViewWorksheet] = useState<DigitalWorksheetRecord | null>(null);
  const [viewEvidence, setViewEvidence] = useState<MediaEvidenceRecord | null>(null);
  const [docSpec, setDocSpec] = useState<FactoryRecordDocumentSpec | null>(null);

  // Edit States for Daily Reports and Worksheets
  const [editingDailyReport, setEditingDailyReport] = useState<DailyFactoryActivityReport | null>(null);
  const [editingWorksheet, setEditingWorksheet] = useState<DigitalWorksheetRecord | null>(null);

  // Worksheet Form State (Advanced Form)
  const [showWsModal, setShowWsModal] = useState(false);
  const [wsTaskId, setWsTaskId] = useState(tasks[0]?.id || 'ftask-01');
  const [wsActivity, setWsActivity] = useState<DigitalWorksheetRecord['activityType']>('Unitized Curtain Wall Assembly');
  const [wsShift, setWsShift] = useState('Day Shift (08:00 - 17:00)');
  const [wsBayStation, setWsBayStation] = useState('Bay A — CNC & Assembly Line 01');
  const [wsMachineCode, setWsMachineCode] = useState('EQ-CNC-5AX-01');
  const [wsSupervisor, setWsSupervisor] = useState(currentUser?.fullName || 'Nimal Jayawardena');
  const [wsOperatorNames, setWsOperatorNames] = useState('Kamal Perera, Sunil Silva, Ruwan Dias');
  const [wsPlannedQty, setWsPlannedQty] = useState(14);
  const [wsProducedQty, setWsProducedQty] = useState(12);
  const [wsAcceptedQty, setWsAcceptedQty] = useState(12);
  const [wsReworkQty, setWsReworkQty] = useState(0);
  const [wsHours, setWsHours] = useState(8);
  const [wsCuttingDetails, setWsCuttingDetails] = useState('5-Axis CNC profile mitre cutting & drainage slot milling (±0.3mm)');
  const [wsAssemblyDetails, setWsAssemblyDetails] = useState('Crimped corner cleats, EPDM gasket insertion & structural glazing prep');
  const [wsMaterialConsumed, setWsMaterialConsumed] = useState('6063-T6 Mullion/Transom profiles, SS316 cleats & EPDM gaskets');

  // Daily Report Form State (Advanced Form)
  const [showDailyModal, setShowDailyModal] = useState(false);
  const [drFactoryId, setDrFactoryId] = useState(factories[0]?.id || 'fac-inv-01');
  const [drProjectId, setDrProjectId] = useState(tasks[0]?.projectId || 'PRJ-2026-001');
  const [drDate, setDrDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [drShiftSupervisor, setDrShiftSupervisor] = useState(currentUser?.fullName || 'Nimal Jayawardena');
  const [drPlannedUnits, setDrPlannedUnits] = useState(30);
  const [drUnitsCompleted, setDrUnitsCompleted] = useState(28);
  const [drWorkers, setDrWorkers] = useState(24);
  const [drMachines, setDrMachines] = useState(4);
  const [drHours, setDrHours] = useState(192);
  const [drActivitiesSummary, setDrActivitiesSummary] = useState('Completed CNC cutting, frame crimping, and structural sealant application for Tower A batch.');
  const [drMaterialsSummary, setDrMaterialsSummary] = useState('Issued 48 lengths of 6063-T6 profiles, 24 DGU glass panels, and 12 drums of structural silicone.');
  const [drQualitySummary, setDrQualitySummary] = useState('All diagonal & DFT checks within ±0.5mm and ≥65μm specification.');
  const [drMeasurementsSummary, setDrMeasurementsSummary] = useState('Frame diagonals verified at 3200x1500mm (±0.4mm); Shore A hardness 42.');
  const [drToolboxTopic, setDrToolboxTopic] = useState('Overhead Gantry Crane Rigging, Vacuum Glass Lifter Safety & PPE');
  const [drHseSummary, setDrHseSummary] = useState('Zero LTI — 100% PPE compliance verified across all bays.');

  // Media Evidence Form State (Advanced Form)
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [evTaskId, setEvTaskId] = useState(tasks[0]?.id || 'ftask-01');
  const [evMediaType, setEvMediaType] = useState<MediaEvidenceRecord['mediaType']>('Photograph');
  const [evStage, setEvStage] = useState<MediaEvidenceRecord['stageCategory']>('During Fabrication / Production');
  const [evDrawingRef, setEvDrawingRef] = useState('AFC-DWG-CW-104 Rev B');
  const [evLocationBay, setEvLocationBay] = useState('Bay B — Quality & Glazing Station');
  const [evCapturedBy, setEvCapturedBy] = useState(currentUser?.fullName || 'Factory QA Inspector');
  const [evDesc, setEvDesc] = useState('');
  const [evTechnicalNotes, setEvTechnicalNotes] = useState('Verified dimensional tolerance and sealant bite width prior to crating.');
  const [evFileName, setEvFileName] = useState('');
  const [evFileLabel, setEvFileLabel] = useState('380 KB (≤ 1 MB Image/Doc)');
  const [evDataUrl, setEvDataUrl] = useState('');
  const [evFileError, setEvFileError] = useState('');

  const handleEvidenceFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const res = factoryExecutionService.validateEvidenceFileSize(file);
    if (!res.valid) {
      setEvFileError(res.error || 'File exceeds size limit');
      toast.error(res.error || 'File exceeds size limit');
      e.target.value = '';
      return;
    }
    setEvFileError('');
    setEvFileName(file.name);
    setEvFileLabel(`${res.fileSizeLabel} (${res.maxLimitLabel})`);
    if (res.mediaKind === 'Video') {
      setEvMediaType('Video Walkthrough');
    } else {
      setEvMediaType('Photograph');
    }
    if (!evDesc.trim()) {
      setEvDesc(file.name);
    }
    try {
      const dataUrl = await factoryExecutionService.readFileAsDataUrl(file);
      setEvDataUrl(dataUrl);
    } catch {
      setEvDataUrl('');
    }
  };

  const handleOpenEditDailyReport = (rep: DailyFactoryActivityReport) => {
    setEditingDailyReport(rep);
    setDrFactoryId(rep.factoryId);
    setDrProjectId(rep.projectId);
    setDrDate(rep.date);
    setDrShiftSupervisor(rep.shiftSupervisor);
    setDrPlannedUnits(rep.plannedUnitsToday);
    setDrUnitsCompleted(rep.completedUnitsToday);
    setDrWorkers(rep.activeWorkersCount);
    setDrMachines(rep.activeMachinesCount);
    setDrHours(rep.totalManHours);
    setDrActivitiesSummary(rep.completedActivitiesSummary || rep.plannedActivitiesSummary || '');
    setDrMaterialsSummary(rep.materialsUsedSummary || '');
    setDrQualitySummary(rep.qualityIssuesSummary || '');
    setDrMeasurementsSummary(rep.measurementsSummary || '');
    setDrToolboxTopic(rep.toolboxTalkTopic || '');
    setDrHseSummary(rep.hseIssuesSummary || '');
    setShowDailyModal(true);
  };

  const handleOpenEditWorksheet = (ws: DigitalWorksheetRecord) => {
    setEditingWorksheet(ws);
    setWsTaskId(ws.taskId);
    setWsActivity(ws.activityType);
    setWsShift(ws.shift);
    setWsSupervisor(ws.verifiedBySupervisorName || ws.recordedByWorkerName);
    setWsOperatorNames(ws.recordedByWorkerName);
    setWsPlannedQty(ws.plannedQtyForShift);
    setWsProducedQty(ws.producedQty);
    setWsAcceptedQty(ws.acceptedQty);
    setWsReworkQty(ws.reworkQty);
    setWsHours(ws.labourHoursLogged);
    setWsCuttingDetails(ws.cuttingDetails || '');
    setWsAssemblyDetails(ws.assemblyDetails || '');
    setWsMaterialConsumed(ws.materialConsumedSummary || '');
    setShowWsModal(true);
  };

  const handleSaveWorksheet = (e: React.FormEvent) => {
    e.preventDefault();
    factoryExecutionService.saveWorksheet(currentUser, {
      id: editingWorksheet?.id,
      worksheetNo: editingWorksheet?.worksheetNo,
      taskId: wsTaskId,
      activityType: wsActivity,
      shift: wsShift as any,
      supervisorName: wsSupervisor,
      operatorNames: wsOperatorNames.split(',').map(s => s.trim()).filter(Boolean),
      machineUsed: `${wsMachineCode} (${wsBayStation})`,
      plannedQty: wsPlannedQty,
      producedQty: wsProducedQty,
      acceptedQty: wsAcceptedQty,
      reworkQty: wsReworkQty,
      labourHoursLogged: wsHours,
      cuttingAndMillingDetails: wsCuttingDetails,
      assemblyAndGlazingDetails: wsAssemblyDetails,
      materialConsumedNotes: wsMaterialConsumed
    });
    toast.success(editingWorksheet ? 'Worksheet Updated' : 'Digital Worksheet Saved');
    setEditingWorksheet(null);
    setShowWsModal(false);
    onRefresh();
  };

  const handleSaveDailyReport = (e: React.FormEvent) => {
    e.preventDefault();
    factoryExecutionService.saveDailyReport(currentUser, {
      id: editingDailyReport?.id,
      reportNo: editingDailyReport?.reportNo,
      factoryId: drFactoryId,
      projectId: drProjectId,
      date: drDate,
      shiftSupervisor: drShiftSupervisor,
      plannedUnitsToday: drPlannedUnits,
      completedUnitsToday: drUnitsCompleted,
      activeWorkersCount: drWorkers,
      activeMachinesCount: drMachines,
      totalManHours: drHours,
      completedActivitiesSummary: drActivitiesSummary,
      materialsUsedSummary: drMaterialsSummary,
      qualityIssuesSummary: drQualitySummary,
      measurementsSummary: drMeasurementsSummary,
      toolboxTalkTopic: drToolboxTopic,
      hseIssuesSummary: drHseSummary
    });
    toast.success(editingDailyReport ? 'Daily Log Updated' : 'Daily Production Log Saved');
    setEditingDailyReport(null);
    setShowDailyModal(false);
    onRefresh();
  };

  const handleSaveMedia = (e: React.FormEvent) => {
    e.preventDefault();
    if (evFileError) return;
    const task = tasks.find(t => t.id === evTaskId) || tasks[0];
    const defaultUrl =
      evMediaType === 'Video Walkthrough'
        ? 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
        : 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=900&q=80';
    factoryExecutionService.addMediaEvidence(currentUser, {
      taskId: task?.id,
      factoryId: task?.factoryId || factories[0]?.id || 'fac-inv-01',
      projectId: task?.projectId || 'PRJ-2026-001',
      mediaType: evMediaType,
      stageCategory: evStage,
      description: `${evDesc.trim() || 'Onsite Evidence'} [Dwg: ${evDrawingRef} · Bay: ${evLocationBay} · By: ${evCapturedBy}] — ${evTechnicalNotes}`,
      fileName: evFileName || `${evMediaType === 'Video Walkthrough' ? 'Onsite_Video.mp4' : 'Onsite_Photo.jpg'}`,
      fileSizeLabel: evFileLabel,
      mediaUrl: evDataUrl || defaultUrl,
      thumbnailPreviewUrl: evDataUrl || defaultUrl
    });
    toast.success('Advanced Evidence Uploaded — Ready to View & Download');
    setShowMediaModal(false);
    setEvDesc('');
    setEvFileName('');
    setEvDataUrl('');
    setEvFileError('');
    onRefresh();
  };

  const handleVerifyReport = (
    reportId: string,
    role: 'Factory Manager' | 'Project Manager' | 'Admin'
  ) => {
    const updated = factoryExecutionService.verifyAndApproveDailyReport(currentUser, reportId, role);
    if (viewDailyReport && viewDailyReport.id === updated.id) {
      setViewDailyReport({ ...updated });
    }
    toast.success(`Inspected & Approved by ${role}`);
    onRefresh();
  };

  const handleVerifyWorksheet = (
    wsId: string,
    role: 'Factory Manager' | 'Project Manager' | 'Admin'
  ) => {
    const updated = factoryExecutionService.verifyAndApproveWorksheet(currentUser, wsId, role);
    if (viewWorksheet && viewWorksheet.id === updated.id) {
      setViewWorksheet({ ...updated });
    }
    toast.success(`Inspected & Approved by ${role}`);
    onRefresh();
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200/80 px-4 py-2.5 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1">
          <button
            onClick={() => setSubView('daily_reports')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              subView === 'daily_reports'
                ? 'bg-white text-orange-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ClipboardCheck className={`w-3.5 h-3.5 ${subView === 'daily_reports' ? 'text-orange-500' : 'text-slate-400'}`} />
            Logs
          </button>
          <button
            onClick={() => setSubView('worksheets')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              subView === 'worksheets'
                ? 'bg-white text-orange-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className={`w-3.5 h-3.5 ${subView === 'worksheets' ? 'text-orange-500' : 'text-slate-400'}`} />
            Sheets
          </button>
          <button
            onClick={() => setSubView('media_evidence')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              subView === 'media_evidence'
                ? 'bg-white text-orange-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Camera className={`w-3.5 h-3.5 ${subView === 'media_evidence' ? 'text-orange-500' : 'text-slate-400'}`} />
            Evidence
          </button>
        </div>

        {isFmAccount && (
          <div className="flex items-center gap-2">
            {subView === 'worksheets' && (
              <button
                onClick={() => setShowWsModal(true)}
                className="px-3.5 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                New
              </button>
            )}
            {subView === 'daily_reports' && (
              <button
                onClick={() => setShowDailyModal(true)}
                className="px-3.5 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                New
              </button>
            )}
            {subView === 'media_evidence' && (
              <button
                onClick={() => setShowMediaModal(true)}
                className="px-3.5 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Upload
              </button>
            )}
          </div>
        )}
      </div>

      {/* 1. Daily Logs (Single Line Row per Record + Simple Words + 1-Word Buttons) */}
      {subView === 'daily_reports' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-semibold text-slate-400 whitespace-nowrap">
                  <th className="py-2 px-3">Code</th>
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3">Factory</th>
                  <th className="py-2 px-3">Project</th>
                  <th className="py-2 px-3 text-right">Qty</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {dailyReports.map(rep => (
                  <tr key={rep.id} className="hover:bg-slate-50/70 transition-colors whitespace-nowrap">
                    <td className="py-2 px-3 font-mono font-bold text-orange-600 whitespace-nowrap">{rep.reportNo}</td>
                    <td className="py-2 px-3 font-mono text-slate-600 whitespace-nowrap">{rep.date}</td>
                    <td className="py-2 px-3 font-bold text-slate-900 whitespace-nowrap">{rep.factoryName}</td>
                    <td className="py-2 px-3 text-slate-600 whitespace-nowrap">{rep.projectName}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                      {rep.completedUnitsToday}/{rep.plannedUnitsToday}
                    </td>
                    <td className="py-2 px-3 font-semibold text-emerald-700 whitespace-nowrap">
                      {rep.status === 'Reviewed by PM' ? 'Verified' : rep.status}
                    </td>
                    <td className="py-2 px-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => setDocSpec(buildDailyLogDocSpec(rep))}
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold inline-flex items-center gap-1"
                        >
                          <Printer className="w-3 h-3 text-orange-500" /> Doc
                        </button>
                        <button
                          onClick={() => setViewDailyReport(rep)}
                          className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-semibold inline-flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" /> View
                        </button>
                        <button
                          onClick={() => handleOpenEditDailyReport(rep)}
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold inline-flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3 text-sky-600" /> Edit
                        </button>
                        {isFmAccount && (
                          <button
                            onClick={() => handleVerifyReport(rep.id, 'Factory Manager')}
                            className="px-2 py-1 rounded bg-sky-50 hover:bg-sky-100 text-sky-700 text-[10px] font-semibold"
                          >
                            Check
                          </button>
                        )}
                        {canApprove && (
                          <button
                            onClick={() => handleVerifyReport(rep.id, 'Admin')}
                            className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-semibold inline-flex items-center gap-0.5"
                          >
                            <CheckCircle2 className="w-3 h-3" /> Approve
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (!confirm(`Delete daily log ${rep.reportNo}?`)) return;
                            factoryExecutionService.deleteDailyReport(currentUser, rep.id);
                            onRefresh();
                            toast.success('Log deleted');
                          }}
                          className="p-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. Worksheets (Single Line Row per Record + Simple Words + 1-Word Buttons) */}
      {subView === 'worksheets' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-semibold text-slate-400 whitespace-nowrap">
                  <th className="py-2 px-3">Code</th>
                  <th className="py-2 px-3">Task</th>
                  <th className="py-2 px-3">Activity</th>
                  <th className="py-2 px-3 text-right">Qty</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {worksheets.map(ws => (
                  <tr key={ws.id} className="hover:bg-slate-50/70 transition-colors whitespace-nowrap">
                    <td className="py-2 px-3 font-mono font-bold text-orange-600 whitespace-nowrap">{ws.worksheetNo}</td>
                    <td className="py-2 px-3 font-mono font-bold text-sky-700 whitespace-nowrap">{ws.taskCode}</td>
                    <td className="py-2 px-3 font-bold text-slate-900 whitespace-nowrap">{ws.activityType}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                      {ws.acceptedQty}/{ws.producedQty}
                    </td>
                    <td className="py-2 px-3 font-semibold text-emerald-700 whitespace-nowrap">
                      {ws.completionStatus === 'Supervisor Verified' ? 'Checked' : ws.completionStatus === 'QC Approved' ? 'Approved' : ws.completionStatus}
                    </td>
                    <td className="py-2 px-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => setDocSpec(buildWorksheetDocSpec(ws))}
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold inline-flex items-center gap-1"
                        >
                          <Printer className="w-3 h-3 text-orange-500" /> Doc
                        </button>
                        <button
                          onClick={() => setViewWorksheet(ws)}
                          className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-semibold inline-flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" /> View
                        </button>
                        <button
                          onClick={() => handleOpenEditWorksheet(ws)}
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold inline-flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3 text-sky-600" /> Edit
                        </button>
                        {isFmAccount && (
                          <button
                            onClick={() => handleVerifyWorksheet(ws.id, 'Factory Manager')}
                            className="px-2 py-1 rounded bg-sky-50 hover:bg-sky-100 text-sky-700 text-[10px] font-semibold"
                          >
                            Check
                          </button>
                        )}
                        {canApprove && (
                          <button
                            onClick={() => handleVerifyWorksheet(ws.id, 'Admin')}
                            className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-semibold"
                          >
                            Approve
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (!confirm(`Delete worksheet ${ws.worksheetNo}?`)) return;
                            factoryExecutionService.deleteWorksheet(currentUser, ws.id);
                            onRefresh();
                            toast.success('Worksheet deleted');
                          }}
                          className="p-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Media Evidence (Single Line Row + Simple Words + 1-Word Buttons) */}
      {subView === 'media_evidence' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-semibold text-slate-400 whitespace-nowrap">
                  <th className="py-2 px-3">Code</th>
                  <th className="py-2 px-3">Task</th>
                  <th className="py-2 px-3">Type</th>
                  <th className="py-2 px-3">Title</th>
                  <th className="py-2 px-3">Stage</th>
                  <th className="py-2 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {mediaEvidence.map(ev => (
                  <tr key={ev.id} className="hover:bg-slate-50/70 transition-colors whitespace-nowrap">
                    <td className="py-2 px-3 font-mono font-bold text-orange-600 whitespace-nowrap">{ev.evidenceCode}</td>
                    <td className="py-2 px-3 font-mono font-bold text-sky-700 whitespace-nowrap">{ev.taskCode}</td>
                    <td className="py-2 px-3 font-semibold text-slate-800 whitespace-nowrap">
                      {ev.mediaType === 'Video Walkthrough' ? 'Video' : 'Photo'}
                    </td>
                    <td className="py-2 px-3 font-bold text-slate-900 whitespace-nowrap truncate max-w-xs">{ev.description}</td>
                    <td className="py-2 px-3 text-emerald-700 font-semibold whitespace-nowrap">
                      {ev.stageCategory.split(' ')[0]}
                    </td>
                    <td className="py-2 px-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => setDocSpec(buildEvidenceDocSpec(ev))}
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold inline-flex items-center gap-1"
                        >
                          <Printer className="w-3 h-3 text-orange-500" /> Doc
                        </button>
                        <button
                          onClick={() => setViewEvidence(ev)}
                          className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold inline-flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" /> View
                        </button>
                        <button
                          onClick={() =>
                            factoryExecutionService.downloadMediaOrFile(
                              ev.fileName || `${ev.evidenceCode}_${ev.mediaType === 'Video Walkthrough' ? 'Video.mp4' : 'Photo.jpg'}`,
                              ev.mediaUrl || ev.thumbnailPreviewUrl,
                              `Evidence: ${ev.evidenceCode}\nDescription: ${ev.description}`
                            )
                          }
                          className="px-2 py-1 rounded bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-semibold inline-flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" /> Save
                        </button>
                        <button
                          onClick={() => {
                            if (!confirm(`Delete evidence ${ev.evidenceCode}?`)) return;
                            factoryExecutionService.deleteFactoryRecord('MEDIA_EVIDENCE', ev.id);
                            onRefresh();
                            toast.success('Evidence deleted');
                          }}
                          className="p-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW DAILY LOG FULL DETAILS MODAL */}
      {viewDailyReport && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[88vh] flex flex-col overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <span className="font-mono text-xs font-bold text-orange-600">{viewDailyReport.reportNo}</span>
                <h3 className="text-sm font-bold text-slate-900">
                  Daily Factory Activity Report — {viewDailyReport.date}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const spec = buildDailyLogDocSpec(viewDailyReport);
                    setViewDailyReport(null);
                    setDocSpec(spec);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" /> Doc
                </button>
                <button
                  onClick={() => setViewDailyReport(null)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <div className="text-slate-400 font-semibold">Factory</div>
                  <div className="font-bold text-slate-900 mt-0.5">{viewDailyReport.factoryName}</div>
                </div>
                <div>
                  <div className="text-slate-400 font-semibold">Project</div>
                  <div className="font-bold text-slate-900 mt-0.5">{viewDailyReport.projectName}</div>
                </div>
                <div>
                  <div className="text-slate-400 font-semibold">Units Completed</div>
                  <div className="font-mono font-bold text-emerald-700 mt-0.5">
                    {viewDailyReport.completedUnitsToday}/{viewDailyReport.plannedUnitsToday}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 font-semibold">Status</div>
                  <div className="font-bold text-orange-600 mt-0.5">{viewDailyReport.status}</div>
                </div>
                <div>
                  <div className="text-slate-400 font-semibold">Active Workers</div>
                  <div className="font-mono font-bold text-slate-800 mt-0.5">{viewDailyReport.activeWorkersCount}</div>
                </div>
                <div>
                  <div className="text-slate-400 font-semibold">Total Man-Hours</div>
                  <div className="font-mono font-bold text-slate-800 mt-0.5">{viewDailyReport.totalManHours}h</div>
                </div>
                <div>
                  <div className="text-slate-400 font-semibold">Machines Active</div>
                  <div className="font-mono font-bold text-slate-800 mt-0.5">{viewDailyReport.activeMachinesCount}</div>
                </div>
                <div>
                  <div className="text-slate-400 font-semibold">Shift Supervisor</div>
                  <div className="font-semibold text-slate-800 mt-0.5">{viewDailyReport.shiftSupervisor}</div>
                </div>
              </div>

              <div className="space-y-2 border border-slate-200 rounded-xl p-3.5">
                <div>
                  <span className="font-bold text-slate-700">Completed Activities: </span>
                  <span className="text-slate-600">{viewDailyReport.completedActivitiesSummary}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-700">Materials Used: </span>
                  <span className="text-slate-600">{viewDailyReport.materialsUsedSummary}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-700">Quality & Measurements: </span>
                  <span className="text-slate-600">
                    {viewDailyReport.qualityIssuesSummary} · {viewDailyReport.measurementsSummary}
                  </span>
                </div>
                <div>
                  <span className="font-bold text-slate-700">HSE & Toolbox Talk: </span>
                  <span className="text-slate-600">
                    {viewDailyReport.hseIssuesSummary} ({viewDailyReport.toolboxTalkTopic})
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-800">Action:</span>
                <div className="flex items-center gap-1.5">
                  {isFmAccount && (
                    <button
                      onClick={() => handleVerifyReport(viewDailyReport.id, 'Factory Manager')}
                      className="px-2.5 py-1 rounded bg-sky-50 hover:bg-sky-100 text-sky-700 font-semibold"
                    >
                      Check
                    </button>
                  )}
                  {canApprove && (
                    <button
                      onClick={() => handleVerifyReport(viewDailyReport.id, 'Admin')}
                      className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                    >
                      Approve
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW WORKSHEET FULL DETAILS MODAL */}
      {viewWorksheet && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[88vh] flex flex-col overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <span className="font-mono text-xs font-bold text-orange-600">{viewWorksheet.worksheetNo}</span>
                <h3 className="text-sm font-bold text-slate-900">{viewWorksheet.activityType}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const spec = buildWorksheetDocSpec(viewWorksheet);
                    setViewWorksheet(null);
                    setDocSpec(spec);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" /> Doc
                </button>
                <button
                  onClick={() => setViewWorksheet(null)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <div className="text-slate-400 font-semibold">Task</div>
                  <div className="font-mono font-bold text-sky-700 mt-0.5">{viewWorksheet.taskCode}</div>
                </div>
                <div>
                  <div className="text-slate-400 font-semibold">Produced / Accepted</div>
                  <div className="font-mono font-bold text-emerald-700 mt-0.5">
                    {viewWorksheet.acceptedQty}/{viewWorksheet.producedQty}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 font-semibold">Labour Hours</div>
                  <div className="font-mono font-bold text-slate-900 mt-0.5">{viewWorksheet.labourHoursLogged}h</div>
                </div>
                <div>
                  <div className="text-slate-400 font-semibold">Verified By</div>
                  <div className="font-semibold text-slate-800 mt-0.5">{viewWorksheet.verifiedBySupervisorName}</div>
                </div>
              </div>
              <div className="space-y-2 border border-slate-200 rounded-xl p-3.5">
                <div>
                  <span className="font-bold text-slate-700">Cutting Details: </span>
                  <span className="text-slate-600">{viewWorksheet.cuttingDetails}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-700">Assembly Details: </span>
                  <span className="text-slate-600">{viewWorksheet.assemblyDetails}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-700">Materials Consumed: </span>
                  <span className="text-slate-600">{viewWorksheet.materialConsumedSummary}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW & DOWNLOAD ONSITE EVIDENCE IMAGE / VIDEO MODAL */}
      {viewEvidence && (
        <div className="fixed inset-0 bg-slate-900/75 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <span className="font-mono text-xs font-bold text-orange-600">{viewEvidence.evidenceCode}</span>
                <h3 className="text-sm font-bold text-slate-900">{viewEvidence.description}</h3>
                <p className="text-[11px] text-slate-500">
                  {viewEvidence.mediaType} · {viewEvidence.stageCategory} · Task {viewEvidence.taskCode} · {viewEvidence.fileSizeLabel || (viewEvidence.mediaType === 'Video Walkthrough' ? '≤ 5 MB Video' : '≤ 1 MB Image/Doc')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    factoryExecutionService.downloadMediaOrFile(
                      viewEvidence.fileName || `${viewEvidence.evidenceCode}_${viewEvidence.mediaType === 'Video Walkthrough' ? 'Video.mp4' : 'Photo.jpg'}`,
                      viewEvidence.mediaUrl || viewEvidence.thumbnailPreviewUrl,
                      `Evidence: ${viewEvidence.evidenceCode}\nDescription: ${viewEvidence.description}`
                    )
                  }
                  className="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </button>
                <button
                  onClick={() => setViewEvidence(null)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="p-5 flex flex-col items-center justify-center bg-slate-950 min-h-[300px] max-h-[70vh] overflow-auto">
              {viewEvidence.mediaType === 'Video Walkthrough' ||
              (viewEvidence.mediaUrl && viewEvidence.mediaUrl.startsWith('data:video')) ? (
                <video
                  src={
                    viewEvidence.mediaUrl ||
                    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
                  }
                  controls
                  autoPlay
                  className="max-h-[55vh] w-full rounded-lg"
                />
              ) : (
                <img
                  src={
                    viewEvidence.mediaUrl ||
                    viewEvidence.thumbnailPreviewUrl ||
                    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=900&q=80'
                  }
                  alt={viewEvidence.description}
                  className="max-h-[55vh] w-auto object-contain rounded-lg"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Worksheet Modal (Advanced Multi-Section Form) */}
      {showWsModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-[9998] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-sm font-bold text-white">
                  {editingWorksheet ? `Edit Digital Worksheet (${editingWorksheet.worksheetNo})` : 'Create Advanced Digital Production Worksheet'}
                </h3>
                <p className="text-[11px] text-slate-300">
                  Log task, production line/bay, shift, CNC machine, operators, quantities, man-hours, and technical fabrication details
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingWorksheet(null);
                  setShowWsModal(false);
                }}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold"
              >
                Close
              </button>
            </div>
            <form onSubmit={handleSaveWorksheet} className="p-6 space-y-4 overflow-y-auto text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="text-[11px] font-bold text-orange-600 uppercase tracking-wider">
                  1. Linked Task, Shift & Production Bay / Machine
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Task / Work Order</label>
                    <select
                      value={wsTaskId}
                      onChange={e => setWsTaskId(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    >
                      {tasks.map(t => (
                        <option key={t.id} value={t.id}>{t.taskCode} — {t.title}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Fabrication Activity</label>
                    <input
                      type="text"
                      value={wsActivity}
                      onChange={e => setWsActivity(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Shift Schedule</label>
                    <select
                      value={wsShift}
                      onChange={e => setWsShift(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    >
                      <option value="Day Shift (08:00 - 17:00)">Day Shift (08:00 - 17:00)</option>
                      <option value="Night Shift (19:00 - 04:00)">Night Shift (19:00 - 04:00)</option>
                      <option value="Overtime Shift">Overtime Shift</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Production Bay / Station</label>
                    <input
                      type="text"
                      value={wsBayStation}
                      onChange={e => setWsBayStation(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">CNC / Equipment Asset Code</label>
                    <input
                      type="text"
                      value={wsMachineCode}
                      onChange={e => setWsMachineCode(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="text-[11px] font-bold text-orange-600 uppercase tracking-wider">
                  2. Supervisor, Operators, Output Quantities & Man-Hours
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Line Supervisor</label>
                    <input
                      type="text"
                      value={wsSupervisor}
                      onChange={e => setWsSupervisor(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Technicians / Operators (Comma Separated)</label>
                    <input
                      type="text"
                      value={wsOperatorNames}
                      onChange={e => setWsOperatorNames(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Planned Qty</label>
                    <input
                      type="number"
                      value={wsPlannedQty}
                      onChange={e => setWsPlannedQty(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Produced Qty</label>
                    <input
                      type="number"
                      value={wsProducedQty}
                      onChange={e => setWsProducedQty(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Accepted Qty</label>
                    <input
                      type="number"
                      value={wsAcceptedQty}
                      onChange={e => setWsAcceptedQty(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Rework Qty</label>
                    <input
                      type="number"
                      value={wsReworkQty}
                      onChange={e => setWsReworkQty(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Labor Hours</label>
                    <input
                      type="number"
                      value={wsHours}
                      onChange={e => setWsHours(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="text-[11px] font-bold text-orange-600 uppercase tracking-wider">
                  3. Technical Cutting, Assembly, Glazing & Material Notes
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">CNC Cutting & Milling Details</label>
                    <input
                      type="text"
                      value={wsCuttingDetails}
                      onChange={e => setWsCuttingDetails(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Assembly & Glazing Details</label>
                    <input
                      type="text"
                      value={wsAssemblyDetails}
                      onChange={e => setWsAssemblyDetails(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Materials Consumed</label>
                    <input
                      type="text"
                      value={wsMaterialConsumed}
                      onChange={e => setWsMaterialConsumed(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingWorksheet(null);
                    setShowWsModal(false);
                  }}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold shadow-2xs"
                >
                  {editingWorksheet ? 'Update Worksheet' : 'Save Worksheet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Daily Log Modal (Advanced Multi-Section Form) */}
      {showDailyModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-[9998] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-sm font-bold text-white">
                  {editingDailyReport ? `Edit Daily Log (${editingDailyReport.reportNo})` : 'Create Advanced Daily Factory Production & Inspection Log'}
                </h3>
                <p className="text-[11px] text-slate-300">
                  Subject to multi-tier verification by Factory Manager, Project Manager & Admin
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingDailyReport(null);
                  setShowDailyModal(false);
                }}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold"
              >
                Close
              </button>
            </div>
            <form onSubmit={handleSaveDailyReport} className="p-6 space-y-4 overflow-y-auto text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="text-[11px] font-bold text-orange-600 uppercase tracking-wider">
                  1. Factory, Project, Report Date & Shift Supervision
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Factory</label>
                    <select
                      value={drFactoryId}
                      onChange={e => setDrFactoryId(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    >
                      {factories.map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Project Code</label>
                    <input
                      type="text"
                      value={drProjectId}
                      onChange={e => setDrProjectId(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Report Date</label>
                    <input
                      type="date"
                      value={drDate}
                      onChange={e => setDrDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Shift Supervisor</label>
                    <input
                      type="text"
                      value={drShiftSupervisor}
                      onChange={e => setDrShiftSupervisor(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="text-[11px] font-bold text-orange-600 uppercase tracking-wider">
                  2. Daily Output, Workforce, Machinery & Man-Hours
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Planned Units</label>
                    <input
                      type="number"
                      value={drPlannedUnits}
                      onChange={e => setDrPlannedUnits(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Completed Units</label>
                    <input
                      type="number"
                      value={drUnitsCompleted}
                      onChange={e => setDrUnitsCompleted(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Active Workers</label>
                    <input
                      type="number"
                      value={drWorkers}
                      onChange={e => setDrWorkers(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Active Machines</label>
                    <input
                      type="number"
                      value={drMachines}
                      onChange={e => setDrMachines(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Total Man-Hours</label>
                    <input
                      type="number"
                      value={drHours}
                      onChange={e => setDrHours(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="text-[11px] font-bold text-orange-600 uppercase tracking-wider">
                  3. Execution Activities, Materials, QC Measurements & HSE Summary
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Daily Production Activities Summary</label>
                    <input
                      type="text"
                      value={drActivitiesSummary}
                      onChange={e => setDrActivitiesSummary(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Materials & Consumables Utilized</label>
                    <input
                      type="text"
                      value={drMaterialsSummary}
                      onChange={e => setDrMaterialsSummary(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Quality Inspection Summary</label>
                    <input
                      type="text"
                      value={drQualitySummary}
                      onChange={e => setDrQualitySummary(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Measurements & Tolerances Logged</label>
                    <input
                      type="text"
                      value={drMeasurementsSummary}
                      onChange={e => setDrMeasurementsSummary(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Toolbox Talk Topic</label>
                    <input
                      type="text"
                      value={drToolboxTopic}
                      onChange={e => setDrToolboxTopic(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">HSE Observations & Compliance</label>
                    <input
                      type="text"
                      value={drHseSummary}
                      onChange={e => setDrHseSummary(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingDailyReport(null);
                    setShowDailyModal(false);
                  }}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold shadow-2xs"
                >
                  {editingDailyReport ? 'Update Daily Log' : 'Save Daily Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Media Evidence Modal (Advanced Multi-Section Form — 1MB Image/Doc, 5MB Video) */}
      {showMediaModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-[9998] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Upload Advanced Onsite Image, Video & Document Evidence
                </h3>
                <p className="text-[11px] text-slate-300">
                  Link evidence to task, stage, drawing reference, factory bay, and inspector remarks
                </p>
              </div>
              <button
                onClick={() => setShowMediaModal(false)}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold"
              >
                Close
              </button>
            </div>
            <form onSubmit={handleSaveMedia} className="p-6 space-y-4 overflow-y-auto text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-orange-600 uppercase tracking-wider">
                    1. Select Image, Video or Document File
                  </span>
                  <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                    Max 1MB Image/Doc • 5MB Video
                  </span>
                </div>
                <input
                  type="file"
                  accept="image/*,video/*,.pdf,.doc,.docx"
                  onChange={handleEvidenceFileSelect}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white"
                />
                {evFileError && (
                  <p className="text-[11px] font-semibold text-red-600 mt-1">{evFileError}</p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Media Classification</label>
                    <select
                      value={evMediaType}
                      onChange={e => setEvMediaType(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    >
                      <option value="Photograph">Photograph</option>
                      <option value="Video Walkthrough">Video Walkthrough</option>
                      <option value="QC Inspection Clip">QC Inspection Clip</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Execution Stage</label>
                    <select
                      value={evStage}
                      onChange={e => setEvStage(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    >
                      <option value="Before Execution">Before Execution</option>
                      <option value="During Fabrication / Production">During Fabrication / Production</option>
                      <option value="QC Inspection & Testing">QC Inspection & Testing</option>
                      <option value="Packing & Loading">Packing & Loading</option>
                      <option value="After Completion">After Completion</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Size Policy</label>
                    <input
                      type="text"
                      readOnly
                      value={evFileLabel}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-100 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="text-[11px] font-bold text-orange-600 uppercase tracking-wider">
                  2. Linked Task, Drawing Reference, Location & Technical Notes
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Linked Task</label>
                    <select
                      value={evTaskId}
                      onChange={e => setEvTaskId(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    >
                      {tasks.map(t => (
                        <option key={t.id} value={t.id}>{t.taskCode} — {t.title}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Evidence Title</label>
                    <input
                      type="text"
                      required
                      value={evDesc}
                      onChange={e => setEvDesc(e.target.value)}
                      placeholder="CNC Frame Tolerance & Weld Verification"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Drawing Reference</label>
                    <input
                      type="text"
                      value={evDrawingRef}
                      onChange={e => setEvDrawingRef(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Factory Bay / Station</label>
                    <input
                      type="text"
                      value={evLocationBay}
                      onChange={e => setEvLocationBay(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Captured By</label>
                    <input
                      type="text"
                      value={evCapturedBy}
                      onChange={e => setEvCapturedBy(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Technical Observation & Inspection Remarks</label>
                  <input
                    type="text"
                    value={evTechnicalNotes}
                    onChange={e => setEvTechnicalNotes(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowMediaModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={Boolean(evFileError)}
                  className="px-5 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-xs font-semibold shadow-2xs"
                >
                  Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {docSpec && (
        <FactoryQuotationDocumentModal
          spec={docSpec}
          currentUser={currentUser}
          onClose={() => setDocSpec(null)}
          onRefresh={onRefresh}
        />
      )}
    </div>
  );
};
