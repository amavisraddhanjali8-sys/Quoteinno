import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  ShieldCheck,
  Truck,
  Plus,
  HardHat,
  AlertTriangle,
  Paperclip,
  Eye,
  Download,
  Zap,
  Trash2,
  FileSpreadsheet,
  Printer,
  CheckSquare,
  Upload,
  CheckCircle2,
  Maximize2,
  Minimize2,
  FileText,
  Image as ImageIcon,
  X,
  Edit3,
  XCircle
} from 'lucide-react';
import { FactoryQuotationDocumentModal, FactoryRecordDocumentSpec } from './FactoryQuotationDocumentModal';
import {
  buildInspectionDocSpec,
  buildOnsiteIncidentDocSpec,
  buildHseDocSpec,
  buildDispatchDocSpec,
  buildTaskDocSpec,
  buildSubTaskDocSpec,
  buildChecklistDocSpec
} from './factoryDocumentBuilders';
import {
  FactoryMasterProfile,
  FactoryWorkPackageAssignment,
  FactoryExecutionTask,
  FactoryQualityInspectionRecord,
  FactoryHseRecord,
  FactoryDispatchAndSiteRecord,
  FactoryOnsiteIncidentOrDamageRecord,
  OnsiteEvidenceAttachment,
  DispatchManifestLineItem
} from '../../types/factoryPortal';
import { SecurityUser } from '../../types/security';
import { factoryExecutionService } from '../../services/factoryExecutionService';
import { procurementService } from '../../services/procurementService';
import { toast } from 'sonner';

interface QualityHseAndDispatchTabProps {
  mode: 'quality_hse' | 'dispatch_site';
  currentUser: SecurityUser | null;
  factories: FactoryMasterProfile[];
  workPackages: FactoryWorkPackageAssignment[];
  tasks: FactoryExecutionTask[];
  inspections: FactoryQualityInspectionRecord[];
  hseRecords: FactoryHseRecord[];
  dispatches: FactoryDispatchAndSiteRecord[];
  onRefresh: () => void;
}

const DISPATCH_CATEGORIES: DispatchManifestLineItem['itemCategory'][] = [
  'Project BOQ Item',
  'Finished Product',
  'Raw Material / Profile',
  'Hardware / Accessory',
  'Site Consumable / Tool'
];

const QUICK_INSERT_PRESETS: Array<Omit<DispatchManifestLineItem, 'id'>> = [
  {
    itemCode: 'BOQ-CW-101',
    itemCategory: 'Project BOQ Item',
    description: 'Unitized Curtain Wall Panel Type A',
    specificationOrDimensions: '2400mm x 3600mm • 28mm Low-E DGU',
    crateOrBatchNo: 'CRT-A01',
    plannedQty: 12,
    dispatchedQty: 12,
    unit: 'Panels',
    weightKg: 1680,
    remarks: 'QA Passed & Tagged'
  },
  {
    itemCode: 'PRD-LVR-204',
    itemCategory: 'Finished Product',
    description: 'Powder-Coated Acoustic Louver Cassette',
    specificationOrDimensions: '1800mm x 1200mm • RAL 7016',
    crateOrBatchNo: 'CRT-L02',
    plannedQty: 16,
    dispatchedQty: 16,
    unit: 'Units',
    weightKg: 640,
    remarks: 'Protective film applied'
  },
  {
    itemCode: 'MAT-ALU-6063',
    itemCategory: 'Raw Material / Profile',
    description: '6063-T6 Transom & Mullion Sub-Frame Profiles',
    specificationOrDimensions: '6000mm Stock Length • PVDF Finish',
    crateOrBatchNo: 'BND-M04',
    plannedQty: 40,
    dispatchedQty: 40,
    unit: 'Lengths',
    weightKg: 520,
    remarks: 'Site trim & infill stock'
  },
  {
    itemCode: 'HRD-SS316-09',
    itemCategory: 'Hardware / Accessory',
    description: 'SS316 Heavy-Duty Curtain Wall Anchor Brackets & Shims',
    specificationOrDimensions: 'M16 Chemical Anchor Set + Serrated Washer',
    crateOrBatchNo: 'BOX-H08',
    plannedQty: 48,
    dispatchedQty: 48,
    unit: 'Sets',
    weightKg: 195,
    remarks: 'Complete with mill certs'
  }
];

export const QualityHseAndDispatchTab: React.FC<QualityHseAndDispatchTabProps> = ({
  mode,
  currentUser,
  factories,
  workPackages,
  tasks,
  inspections,
  hseRecords,
  dispatches,
  onRefresh
}) => {
  const [qcSubView, setQcSubView] = useState<'master_checklists' | 'inspections' | 'onsite_damages' | 'hse'>('master_checklists');
  const [localTick, setLocalTick] = useState(0);
  const [fullScreenMasterChecklists, setFullScreenMasterChecklists] = useState(false);
  const [activeChecklistTarget, setActiveChecklistTarget] = useState<{
    targetType: 'TASK' | 'SUB_TASK';
    targetId: string;
  } | null>(null);

  // Dedicated Upload Images & Documents Regarding Task & Progresses Modal State
  const [uploadTaskProgressTarget, setUploadTaskProgressTarget] = useState<FactoryExecutionTask | null>(null);
  const [uploadChecklistTarget, setUploadChecklistTarget] = useState<{
    targetType: 'TASK' | 'SUB_TASK';
    targetId: string;
  } | null>(null);
  const [uploadProgressAttachments, setUploadProgressAttachments] = useState<OnsiteEvidenceAttachment[]>([]);
  const [uploadProgressPct, setUploadProgressPct] = useState<number>(0);
  const [uploadProgressCompletedQty, setUploadProgressCompletedQty] = useState<number>(0);
  const [uploadProgressStage, setUploadProgressStage] = useState<string>('In Production / Assembly');
  const [uploadProgressInspector, setUploadProgressInspector] = useState<string>('');
  const [uploadProgressDrawingRef, setUploadProgressDrawingRef] = useState<string>('');
  const [uploadProgressNotes, setUploadProgressNotes] = useState<string>('');
  const [uploadProgressError, setUploadProgressError] = useState<string>('');

  // PM/Admin Reject & Defect Report Modal State (Full Screen)
  const [rejectTarget, setRejectTarget] = useState<{
    targetType: 'TASK' | 'SUB_TASK' | 'INSPECTION';
    targetId: string;
    targetCode: string;
    targetTitle: string;
  } | null>(null);
  const [rejectReason, setRejectReason] = useState('Dimensional tolerance or surface finish evidence does not match AFC specification.');
  const [rejectInstructions, setRejectInstructions] = useState('Re-machine / rectify the defective section, verify with calibrated gauge, and upload clear corrected photo/video evidence.');
  const [rejectFileName, setRejectFileName] = useState('');
  const [rejectFileSize, setRejectFileSize] = useState('');
  const [rejectFileDataUrl, setRejectFileDataUrl] = useState('');

  // PM/Admin Unique Checklist Item Add / Edit Modal State (Full Screen)
  const [checklistItemModal, setChecklistItemModal] = useState<{
    mode: 'add' | 'edit';
    targetType: 'TASK' | 'SUB_TASK';
    targetId: string;
    masterItemId?: string;
    category: string;
    parameter: string;
    standardSpecification: string;
    acceptanceCriteria: string;
  } | null>(null);

  const handleOpenTaskProgressUpload = (
    task: FactoryExecutionTask,
    checklistTarget?: { targetType: 'TASK' | 'SUB_TASK'; targetId: string }
  ) => {
    setUploadTaskProgressTarget(task);
    setUploadChecklistTarget(checklistTarget || { targetType: 'TASK', targetId: task.id });
    const qcState = factoryExecutionService.getTaskOrSubTaskQcState(
      checklistTarget?.targetType || 'TASK',
      checklistTarget?.targetId || task.id
    );
    setUploadProgressAttachments(
      (qcState.evidenceAttachments || []).length > 0
        ? [...(qcState.evidenceAttachments || [])]
        : task.evidenceAttachments
        ? [...task.evidenceAttachments]
        : []
    );
    setUploadProgressPct(task.progressPercent || 0);
    setUploadProgressCompletedQty(task.completedQuantity || 0);
    setUploadProgressStage(task.status === 'Completed' ? 'Completed & Final QC' : 'In Production / Assembly');
    setUploadProgressInspector(currentUser?.fullName || task.assignedSupervisorName || 'Factory Supervisor');
    setUploadProgressDrawingRef(`DWG-${task.taskCode}-REV-A`);
    setUploadProgressNotes('');
    setUploadProgressError('');
  };

  const handleSelectTaskProgressFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploadProgressError('');
    for (const file of files) {
      const validation = factoryExecutionService.validateEvidenceFileSize(file);
      if (!validation.valid) {
        setUploadProgressError(validation.error || 'File exceeds size limit');
        toast.error(validation.error || 'File exceeds size limit');
        continue;
      }
      try {
        const dataUrl = await factoryExecutionService.readFileAsDataUrl(file);
        const att: OnsiteEvidenceAttachment = {
          id: `tprog-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          fileName: file.name,
          mediaKind: validation.mediaKind,
          fileSizeBytes: validation.fileSizeBytes,
          fileSizeLabel: validation.fileSizeLabel,
          maxLimitLabel: validation.maxLimitLabel,
          dataUrl,
          uploadedBy: uploadProgressInspector || currentUser?.fullName || 'Factory Supervisor',
          uploadedAt: new Date().toISOString().slice(0, 10)
        };
        setUploadProgressAttachments(prev => [att, ...prev]);
        toast.success(`Uploaded ${file.name} (${validation.fileSizeLabel})`);
      } catch {
        toast.error(`Failed to read ${file.name}`);
      }
    }
    e.target.value = '';
  };

  const handleSaveTaskProgressUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTaskProgressTarget) return;
    if (uploadChecklistTarget && uploadProgressAttachments.length > 0) {
      uploadProgressAttachments.forEach(att => {
        const existing = factoryExecutionService
          .getTaskOrSubTaskQcState(uploadChecklistTarget.targetType, uploadChecklistTarget.targetId)
          .evidenceAttachments.some(x => x.id === att.id || x.fileName === att.fileName);
        if (!existing) {
          factoryExecutionService.uploadTaskOrSubTaskEvidence(
            currentUser,
            uploadChecklistTarget.targetType,
            uploadChecklistTarget.targetId,
            {
              fileName: att.fileName,
              mediaKind: att.mediaKind,
              fileSizeBytes: att.fileSizeBytes,
              fileSizeLabel: att.fileSizeLabel,
              maxLimitLabel: att.maxLimitLabel,
              dataUrl: att.dataUrl,
              remarks: uploadProgressNotes || uploadProgressStage
            }
          );
        }
      });
    }
    factoryExecutionService.saveTask(currentUser, {
      ...uploadTaskProgressTarget,
      progressPercent: Number(uploadProgressPct) || uploadTaskProgressTarget.progressPercent,
      completedQuantity: Number(uploadProgressCompletedQty) || uploadTaskProgressTarget.completedQuantity,
      evidenceAttachments: uploadProgressAttachments,
      workflowNotes: uploadProgressNotes.trim()
        ? `${uploadTaskProgressTarget.workflowNotes ? uploadTaskProgressTarget.workflowNotes + ' | ' : ''}[${uploadProgressStage} - Ref: ${uploadProgressDrawingRef}]: ${uploadProgressNotes.trim()}`
        : uploadTaskProgressTarget.workflowNotes
    });
    setLocalTick(t => t + 1);
    onRefresh();
    setUploadTaskProgressTarget(null);
    setUploadChecklistTarget(null);
    toast.success(`Saved ${uploadProgressAttachments.length} evidence file(s) & task progress`);
  };

  const handleRejectFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validation = factoryExecutionService.validateEvidenceFileSize(file);
    if (!validation.valid) {
      toast.error(validation.error || 'File exceeds size limit');
      e.target.value = '';
      return;
    }
    setRejectFileName(file.name);
    setRejectFileSize(`${validation.fileSizeLabel} (${validation.maxLimitLabel})`);
    try {
      const dataUrl = await factoryExecutionService.readFileAsDataUrl(file);
      setRejectFileDataUrl(dataUrl);
    } catch {
      setRejectFileDataUrl('');
    }
  };

  const handleSubmitRejectQc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectTarget) return;
    try {
      const targetType = rejectTarget.targetType === 'SUB_TASK' ? 'SUB_TASK' : 'TASK';
      factoryExecutionService.rejectTaskOrSubTaskQcByPmOrAdmin(
        currentUser,
        targetType,
        rejectTarget.targetId,
        {
          reason: rejectReason,
          instructions: rejectInstructions,
          attachmentFileName: rejectFileName || undefined,
          attachmentSizeLabel: rejectFileSize || undefined,
          attachmentDataUrl: rejectFileDataUrl || undefined
        }
      );
      setLocalTick(t => t + 1);
      setRejectTarget(null);
      setRejectFileName('');
      setRejectFileSize('');
      setRejectFileDataUrl('');
      onRefresh();
      toast.success('Rejected & Defect Report Issued to Factory Manager');
    } catch (err: any) {
      toast.error(err.message || 'Could not reject');
    }
  };

  const handleSaveChecklistItemModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checklistItemModal) return;
    try {
      if (checklistItemModal.mode === 'add') {
        factoryExecutionService.addQcChecklistItem(
          currentUser,
          checklistItemModal.targetType,
          checklistItemModal.targetId,
          {
            category: checklistItemModal.category,
            parameter: checklistItemModal.parameter,
            standardSpecification: checklistItemModal.standardSpecification
          }
        );
        toast.success('Unique Checklist Item Added');
      } else if (checklistItemModal.masterItemId) {
        factoryExecutionService.updateQcChecklistItem(
          currentUser,
          checklistItemModal.targetType,
          checklistItemModal.targetId,
          checklistItemModal.masterItemId,
          {
            category: checklistItemModal.category,
            parameter: checklistItemModal.parameter,
            standardSpecification: checklistItemModal.standardSpecification
          }
        );
        toast.success('Unique Checklist Item Updated');
      }
      setLocalTick(t => t + 1);
      setChecklistItemModal(null);
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || 'Only Admin or Project Manager can modify checklist items.');
    }
  };

  const handleDeleteChecklistItem = (
    targetType: 'TASK' | 'SUB_TASK',
    targetId: string,
    masterItemId: string
  ) => {
    try {
      factoryExecutionService.deleteQcChecklistItem(
        currentUser,
        targetType,
        targetId,
        masterItemId
      );
      setLocalTick(t => t + 1);
      onRefresh();
      toast.success('Checklist Item Deleted');
    } catch (err: any) {
      toast.error(err.message || 'Only Admin or Project Manager can delete checklist items.');
    }
  };

  const canApproveQc = useMemo(
    () => factoryExecutionService.canApproveQualityInspection(currentUser),
    [currentUser]
  );

  const isFmAccount = useMemo(
    () => factoryExecutionService.isFactoryManagerAccount(currentUser),
    [currentUser]
  );

  const handleFmCheckAllAndUpload = (
    targetType: 'TASK' | 'SUB_TASK',
    targetId: string,
    fileName?: string
  ) => {
    if (!isFmAccount) {
      toast.error('Only Factory Manager / Supervisor can run and upload QC checklists.');
      return;
    }
    const qcState = factoryExecutionService.getTaskOrSubTaskQcState(targetType, targetId);
    if ((qcState.evidenceAttachments || []).length === 0) {
      toast.error('Mandatory: Upload at least 1 evidence (Document/Image ≤1MB or Video ≤5MB) before checking or approving.');
      const pTask =
        tasks.find(t => t.id === targetId || (t.subTasks || []).some(st => st.id === targetId)) || tasks[0];
      if (pTask) handleOpenTaskProgressUpload(pTask, { targetType, targetId });
      return;
    }
    try {
      const state = factoryExecutionService.runAndUploadFactoryManagerQcInspection(
        currentUser,
        targetType,
        targetId,
        fileName
      );
      setLocalTick(t => t + 1);
      onRefresh();
      toast.success(
        `Checked & approved by Factory Manager (${state.systemChecklistUploadedFileName})`
      );
    } catch (err: any) {
      toast.error(err.message || 'Upload at least 1 evidence first');
    }
  };

  const handlePmOrAdminApprove = (targetType: 'TASK' | 'SUB_TASK', targetId: string) => {
    if (!canApproveQc) {
      toast.error('Only Project Manager or Admin can approve Quality Inspections.');
      return;
    }
    try {
      const state = factoryExecutionService.approveTaskOrSubTaskQcByPmOrAdmin(
        currentUser,
        targetType,
        targetId
      );
      setLocalTick(t => t + 1);
      onRefresh();
      toast.success(
        `Quality Inspection Approved by ${state.approvedByName} (ID: ${state.approvedByUserId})`
      );
    } catch (err: any) {
      toast.error(err.message || 'Only Project Manager or Admin can approve QC');
    }
  };

  const inventoryItems = useMemo(() => procurementService.getInventory(), []);

  const onsiteRecords = useMemo(() => {
    const all = factoryExecutionService.getOnsiteIncidentsAndDamages();
    const facIds = new Set(factories.map(f => f.id));
    return all.filter(r => facIds.size === 0 || facIds.has(r.factoryId));
  }, [factories, localTick]);

  // Detail Modals for Quality & Safety
  const [viewingInspection, setViewingInspection] = useState<FactoryQualityInspectionRecord | null>(null);
  const [viewingOnsite, setViewingOnsite] = useState<FactoryOnsiteIncidentOrDamageRecord | null>(null);
  const [viewingHse, setViewingHse] = useState<FactoryHseRecord | null>(null);
  const [previewAttachment, setPreviewAttachment] = useState<OnsiteEvidenceAttachment | null>(null);
  const [docSpec, setDocSpec] = useState<FactoryRecordDocumentSpec | null>(null);

  // New Inspection Modal (Advanced Form)
  const [showInspModal, setShowInspModal] = useState(false);
  const [inspTaskId, setInspTaskId] = useState(tasks[0]?.id || 'ftask-01');
  const [inspType, setInspType] = useState<FactoryQualityInspectionRecord['inspectionType']>('Final Factory Acceptance Test (FAT)');
  const [inspDecision, setInspDecision] = useState<FactoryQualityInspectionRecord['decision']>('Approved');
  const [inspQtySubmitted, setInspQtySubmitted] = useState(24);
  const [inspQtyApproved, setInspQtyApproved] = useState(24);
  const [inspQtyRejected, setInspQtyRejected] = useState(0);
  const [inspQtyRework, setInspQtyRework] = useState(0);
  const [inspStandardRef, setInspStandardRef] = useState('ISO 9001:2015 / BS EN 13830');
  const [inspDrawingRef, setInspDrawingRef] = useState('AFC-DWG-2026-R2');
  const [inspBatchLotNo, setInspBatchLotNo] = useState('BATCH-2026-Q1');
  const [inspInstrumentUsed, setInspInstrumentUsed] = useState('Digital Vernier Caliper, ElcometerDFT & Laser Level');
  const [inspDimCheck, setInspDimCheck] = useState<'Pass' | 'Fail'>('Pass');
  const [inspCoatCheck, setInspCoatCheck] = useState<'Pass' | 'Fail'>('Pass');
  const [inspStructCheck, setInspStructCheck] = useState<'Pass' | 'Fail'>('Pass');
  const [inspCorrectiveAction, setInspCorrectiveAction] = useState('');
  const [inspRemarks, setInspRemarks] = useState('');

  // New Onsite Progress / Mistake / Quality Damage / Incident Modal (Advanced Form)
  const [showOnsiteModal, setShowOnsiteModal] = useState(false);
  const [onsiteCategory, setOnsiteCategory] = useState<FactoryOnsiteIncidentOrDamageRecord['recordCategory']>('Quality Damage');
  const [onsiteSeverity, setOnsiteSeverity] = useState<FactoryOnsiteIncidentOrDamageRecord['severity']>('Medium');
  const [onsiteTaskId, setOnsiteTaskId] = useState(tasks[0]?.id || 'ftask-01');
  const [onsiteTitle, setOnsiteTitle] = useState('');
  const [onsiteDescription, setOnsiteDescription] = useState('');
  const [onsiteRootCause, setOnsiteRootCause] = useState('Machine Calibration / Handling');
  const [onsiteBayZone, setOnsiteBayZone] = useState('Bay B - CNC & Assembly Line 02');
  const [onsiteShift, setOnsiteShift] = useState('Day Shift (08:00 - 17:00)');
  const [onsiteCostImpact, setOnsiteCostImpact] = useState(15000);
  const [onsiteResponsiblePerson, setOnsiteResponsiblePerson] = useState('Shop Floor Lead Supervisor');
  const [onsitePreventiveMeasure, setOnsitePreventiveMeasure] = useState('Recalibrate fixture stops & update operator SOP');
  const [onsiteQty, setOnsiteQty] = useState(2);
  const [onsiteUnit, setOnsiteUnit] = useState('Panels');
  const [onsiteStatus, setOnsiteStatus] = useState<FactoryOnsiteIncidentOrDamageRecord['status']>('Under Review');
  const [onsiteCorrective, setOnsiteCorrective] = useState('');
  const [onsiteAttachments, setOnsiteAttachments] = useState<OnsiteEvidenceAttachment[]>([]);
  const [onsiteFileError, setOnsiteFileError] = useState('');

  // New Dispatch Modal with Full Details Sheet & Quick Insert (Advanced Form)
  const [showDspModal, setShowDspModal] = useState(false);
  const [dspWpId, setDspWpId] = useState(workPackages[0]?.id || 'fwp-01');
  const [dspDesc, setDspDesc] = useState('');
  const [dspVehicle, setDspVehicle] = useState('WP LM-8821');
  const [dspDriver, setDspDriver] = useState('Bandula Jayasinghe');
  const [dspDriverContact, setDspDriverContact] = useState('+94 77 412 8890');
  const [dspTransporterCompany, setDspTransporterCompany] = useState('Invention Logistics & Heavy Haulage');
  const [dspGatePassNo, setDspGatePassNo] = useState(`GP-${new Date().getFullYear()}-${String(dispatches.length + 101)}`);
  const [dspSecuritySealNo, setDspSecuritySealNo] = useState(`SEAL-${Math.floor(100000 + Math.random() * 900000)}`);
  const [dspSiteLocation, setDspSiteLocation] = useState('Main Tower Site - North Facade');
  const [dspSiteReceiver, setDspSiteReceiver] = useState('Eng. Kasun Perera (Site Manager)');
  const [dspPackagingMethod, setDspPackagingMethod] = useState('Heavy-Duty Steel A-Frames & Foam Interleaving');
  const [dspSpecialHandling, setDspSpecialHandling] = useState('Crane Unloading Only — Keep Upright — Fragile Glazing');
  const [dspLineItems, setDspLineItems] = useState<DispatchManifestLineItem[]>([
    {
      id: `dli-init-1`,
      ...QUICK_INSERT_PRESETS[0]
    }
  ]);

  // View / Edit Dispatch Full Details Sheet Modal
  const [viewingDispatch, setViewingDispatch] = useState<FactoryDispatchAndSiteRecord | null>(null);
  const [editingSheetItems, setEditingSheetItems] = useState<DispatchManifestLineItem[]>([]);

  const handleOnsiteFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validation = factoryExecutionService.validateEvidenceFileSize(file);
    if (!validation.valid) {
      setOnsiteFileError(validation.error || 'File exceeds size limit');
      toast.error(validation.error || 'File exceeds size limit');
      e.target.value = '';
      return;
    }
    setOnsiteFileError('');
    try {
      const dataUrl = await factoryExecutionService.readFileAsDataUrl(file);
      const newAtt: OnsiteEvidenceAttachment = {
        id: `att-${Date.now()}`,
        fileName: file.name,
        mediaKind: validation.mediaKind,
        fileSizeBytes: validation.fileSizeBytes,
        fileSizeLabel: validation.fileSizeLabel,
        maxLimitLabel: validation.maxLimitLabel,
        dataUrl,
        uploadedBy: currentUser?.fullName || 'Factory Inspector',
        uploadedAt: new Date().toISOString().slice(0, 10)
      };
      setOnsiteAttachments(prev => [newAtt, ...prev]);
      toast.success(`Attached ${validation.mediaKind} (${validation.fileSizeLabel})`);
    } catch {
      toast.error('Failed to read file');
    }
  };

  const handleSaveInspection = (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveDecision =
      inspDecision === 'Approved' && !canApproveQc ? 'Pending Inspection' : inspDecision;
    const detailsNote = [
      inspRemarks.trim(),
      `Std: ${inspStandardRef}`,
      `Dwg: ${inspDrawingRef}`,
      `Lot: ${inspBatchLotNo}`,
      `Instruments: ${inspInstrumentUsed}`,
      !canApproveQc ? 'Uploaded by Factory Manager — Pending Project Manager / Admin Approval' : ''
    ]
      .filter(Boolean)
      .join(' | ');

    factoryExecutionService.recordQualityInspection(currentUser, {
      taskId: inspTaskId,
      inspectionType: inspType,
      decision: effectiveDecision,
      qtySubmitted: inspQtySubmitted,
      qtyApproved: effectiveDecision === 'Approved' ? inspQtyApproved : 0,
      qtyRejected: inspQtyRejected || (effectiveDecision.includes('Rejected') ? 2 : 0),
      qtyReworkRequired: inspQtyRework || (effectiveDecision === 'Rework Required' ? 2 : 0),
      dimensionalCheckPassed: inspDimCheck === 'Pass',
      coatingAndFinishPassed: inspCoatCheck === 'Pass',
      structuralSealantPassed: inspStructCheck === 'Pass',
      correctiveActionPlan: inspCorrectiveAction.trim() || undefined,
      defectDescription: detailsNote || undefined
    });
    toast.success(
      !canApproveQc
        ? 'Inspection Uploaded by Factory Manager — Awaiting PM / Admin Approval'
        : 'Inspection Saved'
    );
    setShowInspModal(false);
    setInspRemarks('');
    setInspCorrectiveAction('');
    onRefresh();
  };

  const handleSaveOnsiteRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onsiteTitle.trim() || onsiteFileError) return;
    const task = tasks.find(t => t.id === onsiteTaskId) || tasks[0];
    const fullDescription = [
      onsiteDescription.trim() || onsiteTitle.trim(),
      `Zone: ${onsiteBayZone}`,
      `Shift: ${onsiteShift}`,
      `Root Cause: ${onsiteRootCause}`,
      `Responsible: ${onsiteResponsiblePerson}`,
      `Est. Cost Impact: LKR ${onsiteCostImpact.toLocaleString()}`
    ].join(' | ');

    const fullCorrective = [
      onsiteCorrective.trim() || 'Rectified & verified on shop floor',
      onsitePreventiveMeasure.trim() ? `Preventive Action: ${onsitePreventiveMeasure.trim()}` : ''
    ]
      .filter(Boolean)
      .join(' — ');

    factoryExecutionService.saveOnsiteIncidentOrDamage(currentUser, {
      recordCategory: onsiteCategory,
      severity: onsiteSeverity,
      taskId: task?.id,
      factoryId: task?.factoryId || factories[0]?.id || 'fac-inv-01',
      projectId: task?.projectId || workPackages[0]?.projectId || 'PRJ-2026-001',
      projectName: task?.projectName || workPackages[0]?.projectName || 'Sirius Mall Storefront',
      workPackageId: task?.workPackageId || workPackages[0]?.id || 'fwp-01',
      title: onsiteTitle.trim(),
      description: fullDescription,
      affectedQty: onsiteQty,
      unit: onsiteUnit,
      status: onsiteStatus,
      correctiveAction: fullCorrective,
      evidenceAttachments: onsiteAttachments
    });
    setShowOnsiteModal(false);
    setOnsiteTitle('');
    setOnsiteDescription('');
    setOnsiteCorrective('');
    setOnsiteAttachments([]);
    setLocalTick(t => t + 1);
    onRefresh();
    toast.success('Onsite Record & Evidence Saved');
  };

  // Quick Insert Helpers for New Dispatch Modal
  const quickInsertIntoNewDispatch = (item: Omit<DispatchManifestLineItem, 'id'>) => {
    setDspLineItems(prev => [
      ...prev,
      {
        ...item,
        id: `dli-${Date.now()}-${Math.floor(Math.random() * 999)}`
      }
    ]);
    toast.success(`Quick inserted: ${item.itemCode}`);
  };

  // Quick Insert Helpers for Viewing/Editing Dispatch Sheet
  const quickInsertIntoActiveSheet = (item: Omit<DispatchManifestLineItem, 'id'>) => {
    setEditingSheetItems(prev => [
      ...prev,
      {
        ...item,
        id: `dli-${Date.now()}-${Math.floor(Math.random() * 999)}`
      }
    ]);
    toast.success(`Quick inserted: ${item.itemCode}`);
  };

  const handleSaveDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    const totalQty = dspLineItems.reduce((sum, it) => sum + (Number(it.dispatchedQty) || 0), 0) || 1;
    const summaryDesc =
      dspDesc.trim() ||
      (dspLineItems.length > 0
        ? `${dspLineItems[0].description}${dspLineItems.length > 1 ? ` (+${dspLineItems.length - 1} items)` : ''}`
        : 'Crated Panels & Project Items');

    factoryExecutionService.saveDispatchOrUpdateSiteStage(currentUser, {
      workPackageId: dspWpId,
      itemDescription: summaryDesc,
      totalQuantityDispatched: totalQty,
      vehicleRegistrationNo: `${dspVehicle} (${dspTransporterCompany})`,
      driverName: `${dspDriver} (${dspDriverContact})`,
      siteLocation: dspSiteLocation,
      receivedByAtSite: dspSiteReceiver,
      siteInspectionNotes: `Gate Pass: ${dspGatePassNo} | Seal: ${dspSecuritySealNo} | Packaging: ${dspPackagingMethod} | Handling: ${dspSpecialHandling}`,
      dispatchLineItems: dspLineItems
    });
    toast.success('Dispatch & Full Details Sheet Saved');
    setShowDspModal(false);
    setDspDesc('');
    onRefresh();
  };

  const handleOpenDispatchSheet = (dsp: FactoryDispatchAndSiteRecord) => {
    setViewingDispatch(dsp);
    setEditingSheetItems(
      dsp.dispatchLineItems && dsp.dispatchLineItems.length > 0
        ? dsp.dispatchLineItems.map(i => ({ ...i }))
        : [
            {
              id: `dli-${dsp.id}-1`,
              itemCode: 'BOQ-ITEM-01',
              itemCategory: 'Project BOQ Item',
              description: dsp.itemDescription,
              specificationOrDimensions: 'As per AFC Shop Drawing',
              crateOrBatchNo: 'CRT-01',
              plannedQty: dsp.totalQuantityDispatched,
              dispatchedQty: dsp.totalQuantityDispatched,
              unit: dsp.unit,
              weightKg: 850,
              remarks: 'Verified & Loaded'
            }
          ]
    );
  };

  const handleSaveEditedDispatchSheet = () => {
    if (!viewingDispatch) return;
    const totalQty = editingSheetItems.reduce((sum, it) => sum + (Number(it.dispatchedQty) || 0), 0) || 1;
    const updated = factoryExecutionService.saveDispatchOrUpdateSiteStage(currentUser, {
      id: viewingDispatch.id,
      workPackageId: viewingDispatch.workPackageId,
      totalQuantityDispatched: totalQty,
      dispatchLineItems: editingSheetItems
    });
    setViewingDispatch(updated);
    onRefresh();
    toast.success('Dispatch Full Details Sheet Updated');
  };

  const handleExportDispatchSheetCsv = (dsp: FactoryDispatchAndSiteRecord, items: DispatchManifestLineItem[]) => {
    const headers = [
      'DispatchNo',
      'DeliveryNote',
      'Project',
      'ItemCode',
      'Category',
      'Description',
      'Specification_Dimensions',
      'Crate_Batch',
      'PlannedQty',
      'DispatchedQty',
      'Unit',
      'WeightKg',
      'Remarks'
    ];
    const rows = items.map(it => [
      dsp.dispatchNo,
      dsp.deliveryNoteNo,
      `"${dsp.projectName}"`,
      it.itemCode,
      `"${it.itemCategory}"`,
      `"${it.description}"`,
      `"${it.specificationOrDimensions}"`,
      it.crateOrBatchNo,
      it.plannedQty,
      it.dispatchedQty,
      it.unit,
      it.weightKg,
      `"${it.remarks || ''}"`
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dsp.dispatchNo}_Full_Details_Sheet.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${dsp.dispatchNo} Full Details Sheet`);
  };

  const handleAdvanceDispatchStage = (
    dsp: FactoryDispatchAndSiteRecord,
    nextStage: FactoryDispatchAndSiteRecord['lifecycleStage'],
    installedQty?: number
  ) => {
    const qty = installedQty !== undefined ? installedQty : dsp.installedQuantity;
    const pct = Math.min(100, Math.round((qty / Math.max(1, dsp.totalQuantityDispatched)) * 100));
    const updated = factoryExecutionService.saveDispatchOrUpdateSiteStage(currentUser, {
      id: dsp.id,
      workPackageId: dsp.workPackageId,
      lifecycleStage: nextStage,
      installedQuantity: qty,
      installationProgressPercent: pct
    });
    if (viewingDispatch && viewingDispatch.id === dsp.id) {
      setViewingDispatch(updated);
    }
    toast.success('Dispatch Updated');
    onRefresh();
  };

  if (mode === 'quality_hse') {
    const totalSubTasksCount = tasks.reduce((sum, t) => sum + (t.subTasks?.length || 0), 0);
    const simpleQcStatus = (st: string) => {
      if (st.includes('Rejected')) return 'Rejected';
      if (st.includes('Approved')) return 'Approved';
      if (st.includes('Submitted')) return 'Uploaded';
      if (st.includes('Progress')) return 'Checking';
      if (st.includes('Rework')) return 'Rework';
      return 'Pending';
    };

    return (
      <div className="space-y-4" data-qc-tick={localTick}>
        <div className="bg-white rounded-xl border border-slate-200/80 px-4 py-2.5 shadow-2xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1">
            <button
              onClick={() => setQcSubView('master_checklists')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                qcSubView === 'master_checklists'
                  ? 'bg-white text-orange-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckSquare className={`w-3.5 h-3.5 ${qcSubView === 'master_checklists' ? 'text-orange-500' : 'text-slate-400'}`} />
              Checklists ({tasks.length + totalSubTasksCount})
            </button>
            <button
              onClick={() => setQcSubView('inspections')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                qcSubView === 'inspections'
                  ? 'bg-white text-orange-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className={`w-3.5 h-3.5 ${qcSubView === 'inspections' ? 'text-orange-500' : 'text-slate-400'}`} />
              Inspections ({inspections.length})
            </button>
            <button
              onClick={() => setQcSubView('onsite_damages')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                qcSubView === 'onsite_damages'
                  ? 'bg-white text-orange-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <AlertTriangle className={`w-3.5 h-3.5 ${qcSubView === 'onsite_damages' ? 'text-orange-500' : 'text-slate-400'}`} />
              Damages ({onsiteRecords.length})
            </button>
            <button
              onClick={() => setQcSubView('hse')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                qcSubView === 'hse'
                  ? 'bg-white text-orange-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <HardHat className={`w-3.5 h-3.5 ${qcSubView === 'hse' ? 'text-orange-500' : 'text-slate-400'}`} />
              Safety ({hseRecords.length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            {isFmAccount && tasks[0] && (
              <button
                onClick={() => handleOpenTaskProgressUpload(tasks[0])}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload
              </button>
            )}
            <button
              onClick={() => setShowOnsiteModal(true)}
              className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Damage
            </button>
            <button
              onClick={() => setShowInspModal(true)}
              className="px-3.5 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Inspect
            </button>
          </div>
        </div>

        {/* 0. PROJECT MASTER QC CHECKLISTS (SINGLE-LINE ROWS, SIMPLE WORDS, 1-WORD BUTTONS, SYSTEM-WIDE FIXED FULLSCREEN) */}
        {qcSubView === 'master_checklists' && (() => {
          const masterChecklistsNode = (
            <div
              className={
                fullScreenMasterChecklists
                  ? 'fixed inset-0 bg-white flex flex-col overflow-hidden'
                  : 'bg-white rounded-2xl border border-slate-200/80 shadow-xs w-full overflow-hidden flex flex-col'
              }
              style={
                fullScreenMasterChecklists
                  ? {
                      position: 'fixed',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      width: '100vw',
                      height: '100vh',
                      zIndex: 2147483640
                    }
                  : undefined
              }
            >
              <div
                className={`px-5 py-3 border-b flex items-center justify-between gap-2 shrink-0 ${
                  fullScreenMasterChecklists ? 'bg-white text-slate-900 border-slate-200' : 'bg-slate-50/70 border-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-slate-900">
                    Checklists ({tasks.length + totalSubTasksCount})
                  </span>
                  <span className="text-xs text-slate-500">
                    {isFmAccount ? '1st Step: Factory Manager Check & Approve' : '2nd Step: PM / Admin Approval (After FM Check)'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {isFmAccount && tasks[0] && (
                    <button
                      onClick={() => handleOpenTaskProgressUpload(tasks[0])}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Upload
                    </button>
                  )}
                  <button
                    onClick={() => setFullScreenMasterChecklists(prev => !prev)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer ${
                      fullScreenMasterChecklists
                        ? 'bg-rose-600 hover:bg-rose-500 text-white'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    {fullScreenMasterChecklists ? (
                      <>
                        <Minimize2 className="w-3.5 h-3.5" />
                        Exit
                      </>
                    ) : (
                      <>
                        <Maximize2 className="w-3.5 h-3.5" />
                        Fullscreen
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className={fullScreenMasterChecklists ? 'flex-1 overflow-auto p-4' : 'w-full overflow-x-auto'}>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-semibold text-slate-500">
                      <th className="py-2.5 px-4 whitespace-nowrap">Type</th>
                      <th className="py-2.5 px-4 whitespace-nowrap">Code</th>
                      <th className="py-2.5 px-4 whitespace-nowrap">Title</th>
                      <th className="py-2.5 px-4 whitespace-nowrap">Evidence</th>
                      <th className="py-2.5 px-4 whitespace-nowrap">Checks</th>
                      <th className="py-2.5 px-4 whitespace-nowrap">Status</th>
                      <th className="py-2.5 px-4 text-right whitespace-nowrap">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {tasks.map(t => {
                      const tQc = factoryExecutionService.getTaskOrSubTaskQcState('TASK', t.id);
                      const tChecked = tQc.checklistItems.filter(i => i.checked).length;
                      const tEvCount = (tQc.evidenceAttachments || []).length;
                      const statusWord = simpleQcStatus(tQc.qcStatus);
                      return (
                        <React.Fragment key={t.id}>
                          <tr className="hover:bg-slate-50/80 bg-white">
                            <td className="py-2 px-4 whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-200 text-[10px] font-bold">
                                Task
                              </span>
                            </td>
                            <td className="py-2 px-4 font-mono font-bold text-orange-600 whitespace-nowrap">
                              {t.taskCode}
                            </td>
                            <td className="py-2 px-4 font-bold text-slate-900 whitespace-nowrap max-w-[260px] truncate">
                              {t.title}
                            </td>
                            <td className="py-2 px-4 whitespace-nowrap">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  tEvCount > 0
                                    ? 'bg-sky-50 text-sky-700 border border-sky-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}
                              >
                                {tEvCount} File{tEvCount === 1 ? '' : 's'}
                              </span>
                            </td>
                            <td className="py-2 px-4 font-mono font-semibold text-sky-700 whitespace-nowrap">
                              {tChecked}/{tQc.checklistItems.length}
                            </td>
                            <td className="py-2 px-4 whitespace-nowrap">
                              <span
                                className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                  statusWord === 'Approved'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : statusWord === 'Rejected'
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : statusWord === 'Uploaded'
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : 'bg-slate-100 text-slate-600 border-slate-200'
                                }`}
                              >
                                {statusWord}
                              </span>
                            </td>
                            <td className="py-2 px-4 text-right whitespace-nowrap">
                              <div className="inline-flex items-center justify-end gap-1.5">
                                {tQc.defectReport && (
                                  <button
                                    onClick={() => factoryExecutionService.downloadDefectReport('TASK', t.id)}
                                    className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-semibold inline-flex items-center gap-1"
                                  >
                                    <Download className="w-3 h-3" />
                                    Defect
                                  </button>
                                )}
                                {isFmAccount && (
                                  <button
                                    onClick={() => handleOpenTaskProgressUpload(t, { targetType: 'TASK', targetId: t.id })}
                                    className="px-2.5 py-1 rounded bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-[11px] font-semibold inline-flex items-center gap-1"
                                  >
                                    <Upload className="w-3 h-3" />
                                    Upload
                                  </button>
                                )}
                                {isFmAccount && (
                                  <button
                                    onClick={() => handleFmCheckAllAndUpload('TASK', t.id)}
                                    className="px-2.5 py-1 rounded bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 text-[11px] font-semibold inline-flex items-center gap-1"
                                  >
                                    <CheckSquare className="w-3 h-3" />
                                    Check
                                  </button>
                                )}
                                {canApproveQc && (
                                  <>
                                    <button
                                      onClick={() => handlePmOrAdminApprove('TASK', t.id)}
                                      disabled={!tQc.factoryManagerApproval?.isApproved}
                                      title={
                                        !tQc.factoryManagerApproval?.isApproved
                                          ? '1st Step Required: Factory Manager must check and approve first'
                                          : '2nd Step: Approve Checklist'
                                      }
                                      className={`px-2.5 py-1 rounded text-[11px] font-semibold inline-flex items-center gap-1 ${
                                        !tQc.factoryManagerApproval?.isApproved
                                          ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                                          : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                                      }`}
                                    >
                                      <CheckCircle2 className="w-3 h-3" />
                                      Approve
                                    </button>
                                    <button
                                      onClick={() =>
                                        setRejectTarget({
                                          targetType: 'TASK',
                                          targetId: t.id,
                                          targetCode: t.taskCode,
                                          targetTitle: t.title
                                        })
                                      }
                                      disabled={!tQc.factoryManagerApproval?.isApproved}
                                      className={`px-2.5 py-1 rounded text-[11px] font-semibold inline-flex items-center gap-1 ${
                                        !tQc.factoryManagerApproval?.isApproved
                                          ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                                          : 'bg-rose-600 hover:bg-rose-700 text-white cursor-pointer'
                                      }`}
                                    >
                                      <XCircle className="w-3 h-3" />
                                      Reject
                                    </button>
                                  </>
                                )}
                                <button
                                  onClick={() => setDocSpec(buildChecklistDocSpec(tQc))}
                                  className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold inline-flex items-center gap-1"
                                  title="Download Checklist PDF"
                                >
                                  <Printer className="w-3 h-3 text-emerald-600" />
                                  Check Doc
                                </button>
                                <button
                                  onClick={() => setDocSpec(buildTaskDocSpec(t))}
                                  className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold inline-flex items-center gap-1"
                                >
                                  <Printer className="w-3 h-3 text-orange-500" />
                                  Doc
                                </button>
                                <button
                                  onClick={() => setActiveChecklistTarget({ targetType: 'TASK', targetId: t.id })}
                                  className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold inline-flex items-center gap-1"
                                >
                                  <Maximize2 className="w-3 h-3" />
                                  Fullscreen
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Sub-Task QC Checklists under this Task */}
                          {(t.subTasks || []).map(st => {
                            const sQc = factoryExecutionService.getTaskOrSubTaskQcState('SUB_TASK', st.id);
                            const sChecked = sQc.checklistItems.filter(i => i.checked).length;
                            const sEvCount = (sQc.evidenceAttachments || []).length;
                            const subStatusWord = simpleQcStatus(sQc.qcStatus);
                            return (
                              <tr key={st.id} className="hover:bg-slate-50/70 bg-slate-50/35">
                                <td className="py-2 px-4 whitespace-nowrap">
                                  <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">
                                    Sub-Task
                                  </span>
                                </td>
                                <td className="py-2 px-4 font-mono font-bold text-slate-700 whitespace-nowrap">
                                  {st.subTaskCode}
                                </td>
                                <td className="py-2 px-4 font-semibold text-slate-800 whitespace-nowrap max-w-[260px] truncate">
                                  {st.title}
                                </td>
                                <td className="py-2 px-4 whitespace-nowrap">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                      sEvCount > 0
                                        ? 'bg-sky-50 text-sky-700 border border-sky-200'
                                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                                    }`}
                                  >
                                    {sEvCount} File{sEvCount === 1 ? '' : 's'}
                                  </span>
                                </td>
                                <td className="py-2 px-4 font-mono font-semibold text-sky-700 whitespace-nowrap">
                                  {sChecked}/{sQc.checklistItems.length}
                                </td>
                                <td className="py-2 px-4 whitespace-nowrap">
                                  <span
                                    className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                      subStatusWord === 'Approved'
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        : subStatusWord === 'Rejected'
                                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                                        : subStatusWord === 'Uploaded'
                                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                                        : 'bg-slate-100 text-slate-600 border-slate-200'
                                    }`}
                                  >
                                    {subStatusWord}
                                  </span>
                                </td>
                                <td className="py-2 px-4 text-right whitespace-nowrap">
                                  <div className="inline-flex items-center justify-end gap-1.5">
                                    {sQc.defectReport && (
                                      <button
                                        onClick={() => factoryExecutionService.downloadDefectReport('SUB_TASK', st.id)}
                                        className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-semibold inline-flex items-center gap-1"
                                      >
                                        <Download className="w-3 h-3" />
                                        Defect
                                      </button>
                                    )}
                                    {isFmAccount && (
                                      <button
                                        onClick={() => handleOpenTaskProgressUpload(t, { targetType: 'SUB_TASK', targetId: st.id })}
                                        className="px-2.5 py-1 rounded bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-[11px] font-semibold inline-flex items-center gap-1"
                                      >
                                        <Upload className="w-3 h-3" />
                                        Upload
                                      </button>
                                    )}
                                    {isFmAccount && (
                                      <button
                                        onClick={() => handleFmCheckAllAndUpload('SUB_TASK', st.id)}
                                        className="px-2.5 py-1 rounded bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 text-[11px] font-semibold inline-flex items-center gap-1"
                                      >
                                        <CheckSquare className="w-3 h-3" />
                                        Check
                                      </button>
                                    )}
                                    {canApproveQc && (
                                      <>
                                        <button
                                          onClick={() => handlePmOrAdminApprove('SUB_TASK', st.id)}
                                          disabled={!sQc.factoryManagerApproval?.isApproved}
                                          title={
                                            !sQc.factoryManagerApproval?.isApproved
                                              ? '1st Step Required: Factory Manager must check and approve first'
                                              : '2nd Step: Approve Checklist'
                                          }
                                          className={`px-2.5 py-1 rounded text-[11px] font-semibold inline-flex items-center gap-1 ${
                                            !sQc.factoryManagerApproval?.isApproved
                                              ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                                              : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                                          }`}
                                        >
                                          <CheckCircle2 className="w-3 h-3" />
                                          Approve
                                        </button>
                                        <button
                                          onClick={() =>
                                            setRejectTarget({
                                              targetType: 'SUB_TASK',
                                              targetId: st.id,
                                              targetCode: st.subTaskCode,
                                              targetTitle: st.title
                                            })
                                          }
                                          disabled={!sQc.factoryManagerApproval?.isApproved}
                                          className={`px-2.5 py-1 rounded text-[11px] font-semibold inline-flex items-center gap-1 ${
                                            !sQc.factoryManagerApproval?.isApproved
                                              ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                                              : 'bg-rose-600 hover:bg-rose-700 text-white cursor-pointer'
                                          }`}
                                        >
                                          <XCircle className="w-3 h-3" />
                                          Reject
                                        </button>
                                      </>
                                    )}
                                    <button
                                      onClick={() => setDocSpec(buildChecklistDocSpec(sQc))}
                                      className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold inline-flex items-center gap-1"
                                      title="Download SubTask Checklist PDF"
                                    >
                                      <Printer className="w-3 h-3 text-emerald-600" />
                                      Check Doc
                                    </button>
                                    <button
                                      onClick={() => setDocSpec(buildSubTaskDocSpec(st, t.taskCode))}
                                      className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold inline-flex items-center gap-1"
                                    >
                                      <Printer className="w-3 h-3 text-orange-500" />
                                      Doc
                                    </button>
                                    <button
                                      onClick={() => setActiveChecklistTarget({ targetType: 'SUB_TASK', targetId: st.id })}
                                      className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold inline-flex items-center gap-1"
                                    >
                                      <Maximize2 className="w-3 h-3" />
                                      Fullscreen
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );

          if (fullScreenMasterChecklists && typeof document !== 'undefined') {
            return createPortal(masterChecklistsNode, document.body);
          }
          return masterChecklistsNode;
        })()}

        {/* Interactive Project Master QC Checklist Modal — FITS & FIXED TO 100% OF SYSTEM SCREEN OVER ALL NAVBARS */}
        {activeChecklistTarget && (() => {
          const qcState = factoryExecutionService.getTaskOrSubTaskQcState(
            activeChecklistTarget.targetType,
            activeChecklistTarget.targetId
          );
          const checkedCount = qcState.checklistItems.filter(i => i.checked).length;
          const evList = qcState.evidenceAttachments || [];
          const parentTask =
            activeChecklistTarget.targetType === 'TASK'
              ? tasks.find(t => t.id === activeChecklistTarget.targetId) || tasks[0]
              : tasks.find(t => (t.subTasks || []).some(st => st.id === activeChecklistTarget.targetId)) || tasks[0];

          const checklistModalNode = (
            <div
              className="fixed inset-0 bg-white flex flex-col overflow-hidden"
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: '100vw',
                height: '100vh',
                zIndex: 2147483642
              }}
            >
              <div className="px-6 py-3.5 border-b border-slate-200 bg-white text-slate-900 flex flex-wrap items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-lg bg-orange-500 text-white font-mono text-xs font-bold">
                    {qcState.targetCode}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {qcState.targetTitle}
                    </h3>
                    <div className="text-[11px] text-slate-600">
                      Evidence: <span className="font-bold text-sky-700">{evList.length} File(s)</span> · Checks: <span className="text-orange-600 font-bold">{checkedCount}/{qcState.checklistItems.length}</span> · 1st Step (FM): <span className="font-bold text-slate-900">{qcState.factoryManagerApproval?.isApproved ? 'Approved' : 'Pending'}</span> · 2nd Step (PM/Admin): <span className="text-emerald-600 font-bold">{qcState.pmOrAdminApproval?.isApproved ? 'Approved' : qcState.qcStatus.includes('Rejected') ? 'Rejected' : 'Pending'}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {canApproveQc && (
                    <button
                      onClick={() =>
                        setChecklistItemModal({
                          mode: 'add',
                          targetType: activeChecklistTarget.targetType,
                          targetId: activeChecklistTarget.targetId,
                          category: 'Dimensional & Tolerance',
                          parameter: '',
                          standardSpecification: '±0.5mm per AFC Drawing',
                          acceptanceCriteria: '100% Verified & Recorded'
                        })
                      }
                      className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Item
                    </button>
                  )}
                  {isFmAccount && parentTask && (
                    <button
                      onClick={() => handleOpenTaskProgressUpload(parentTask, activeChecklistTarget)}
                      className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Upload Evidence
                    </button>
                  )}
                  {isFmAccount && (
                    <button
                      onClick={() =>
                        handleFmCheckAllAndUpload(
                          activeChecklistTarget.targetType,
                          activeChecklistTarget.targetId
                        )
                      }
                      className="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                      Check & Approve (FM)
                    </button>
                  )}
                  {canApproveQc && (
                    <>
                      <button
                        onClick={() =>
                          handlePmOrAdminApprove(
                            activeChecklistTarget.targetType,
                            activeChecklistTarget.targetId
                          )
                        }
                        disabled={!qcState.factoryManagerApproval?.isApproved}
                        title={
                          !qcState.factoryManagerApproval?.isApproved
                            ? '1st Step Required: Factory Manager must check and approve first'
                            : '2nd Step: Approve Checklist'
                        }
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 ${
                          !qcState.factoryManagerApproval?.isApproved
                            ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Approve
                      </button>
                      <button
                        onClick={() =>
                          setRejectTarget({
                            targetType: activeChecklistTarget.targetType,
                            targetId: activeChecklistTarget.targetId,
                            targetCode: qcState.targetCode,
                            targetTitle: qcState.targetTitle
                          })
                        }
                        disabled={!qcState.factoryManagerApproval?.isApproved}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 ${
                          !qcState.factoryManagerApproval?.isApproved
                            ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                            : 'bg-rose-600 hover:bg-rose-500 text-white cursor-pointer'
                        }`}
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Reject
                      </button>
                    </>
                  )}
                  {parentTask && (
                    <button
                      onClick={() => setDocSpec(buildTaskDocSpec(parentTask))}
                      className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5 text-orange-500" />
                      Doc
                    </button>
                  )}
                  <button
                    onClick={() => setDocSpec(buildChecklistDocSpec(qcState))}
                    className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    title="Download or Print Checklist as PDF"
                  >
                    <Printer className="w-3.5 h-3.5 text-orange-400" />
                    Checklist Doc (PDF)
                  </button>
                  <button
                    onClick={() => setActiveChecklistTarget(null)}
                    className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    Exit
                  </button>
                </div>
              </div>

              {/* Quick Switcher Bar Across All Tasks & Sub-Tasks Checklists */}
              <div className="px-6 py-2 bg-slate-100 border-b border-slate-200 flex items-center gap-2 overflow-x-auto shrink-0">
                <span className="text-[11px] font-bold text-slate-500 uppercase shrink-0">Switch:</span>
                {tasks.map(tk => (
                  <React.Fragment key={tk.id}>
                    <button
                      onClick={() => setActiveChecklistTarget({ targetType: 'TASK', targetId: tk.id })}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold shrink-0 transition-colors ${
                        activeChecklistTarget.targetType === 'TASK' && activeChecklistTarget.targetId === tk.id
                          ? 'bg-orange-500 text-white shadow-2xs'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {tk.taskCode}
                    </button>
                    {(tk.subTasks || []).map(st => (
                      <button
                        key={st.id}
                        onClick={() => setActiveChecklistTarget({ targetType: 'SUB_TASK', targetId: st.id })}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold shrink-0 transition-colors ${
                          activeChecklistTarget.targetType === 'SUB_TASK' && activeChecklistTarget.targetId === st.id
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {st.subTaskCode}
                      </button>
                    ))}
                  </React.Fragment>
                ))}
              </div>

              <div className="flex-1 p-6 overflow-y-auto bg-slate-50 space-y-4 text-xs">
                {/* Defect Report Banner if Rejected */}
                {qcState.defectReport && (
                  <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="font-bold text-rose-900">
                        REJECTED — Defect Report #{qcState.defectReport.reportNo} (By {qcState.defectReport.rejectedByName})
                      </div>
                      <div className="text-rose-800">
                        <span className="font-semibold">Reason:</span> {qcState.defectReport.reason}
                      </div>
                      <div className="text-rose-800">
                        <span className="font-semibold">Correction Instructions:</span> {qcState.defectReport.instructions}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          factoryExecutionService.downloadDefectReport(
                            activeChecklistTarget.targetType,
                            activeChecklistTarget.targetId
                          )
                        }
                        className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold inline-flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download Defect Report
                      </button>
                      {isFmAccount && parentTask && (
                        <button
                          onClick={() => handleOpenTaskProgressUpload(parentTask, activeChecklistTarget)}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold inline-flex items-center gap-1.5"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          Upload Corrected Fix
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Uploaded Evidences & View/Download */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-slate-900">
                      Mandatory Evidences ({evList.length}) — Images & Documents max 1MB, Video max 5MB
                    </div>
                    {isFmAccount && parentTask && (
                      <button
                        onClick={() => handleOpenTaskProgressUpload(parentTask, activeChecklistTarget)}
                        className="px-3 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-semibold inline-flex items-center gap-1"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        Upload Evidence
                      </button>
                    )}
                  </div>
                  {evList.length === 0 ? (
                    <div className="text-rose-600 font-semibold">
                      No evidence uploaded yet. Factory Manager must upload at least 1 evidence before checking or approving.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {evList.map(att => (
                        <div
                          key={att.id}
                          className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 truncate">{att.fileName}</div>
                            <div className="text-[10px] text-slate-500">
                              {att.mediaKind} · {att.fileSizeLabel} ({att.maxLimitLabel})
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => setPreviewAttachment(att)}
                              className="px-2 py-1 rounded bg-sky-50 hover:bg-sky-100 text-sky-700 text-[11px] font-semibold inline-flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" />
                              View
                            </button>
                            <button
                              onClick={() =>
                                factoryExecutionService.downloadMediaOrFile(
                                  att.fileName,
                                  att.dataUrl,
                                  `Target: ${qcState.targetCode}\nFile: ${att.fileName}`
                                )
                              }
                              className="px-2 py-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-semibold inline-flex items-center gap-1"
                            >
                              <Download className="w-3 h-3" />
                              Download
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {qcState.systemChecklistUploadedFileName && (
                  <div className="px-4 py-2.5 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-between gap-3">
                    <div className="font-semibold text-sky-950 truncate">
                      File: {qcState.systemChecklistUploadedFileName} ({qcState.submittedByFactoryManagerName})
                    </div>
                    <button
                      onClick={() =>
                        factoryExecutionService.downloadMediaOrFile(
                          qcState.systemChecklistUploadedFileName || 'System_QC_Checklist.txt',
                          undefined,
                          `SYSTEM GENERATED QC CHECKLIST\nControl No: ${qcState.systemChecklistControlNo}\nTarget: ${qcState.targetCode} — ${qcState.targetTitle}\nSubmitted By: ${qcState.submittedByFactoryManagerName}\nApproval Status: ${qcState.qcStatus}`
                        )
                      }
                      className="px-3 py-1 rounded-lg bg-sky-700 hover:bg-sky-800 text-white text-xs font-semibold inline-flex items-center gap-1 shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </button>
                  </div>
                )}

                {qcState.approvedByName && (
                  <div className="px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-semibold">
                    Approved by {qcState.approvedByName} ({qcState.approvedByRole}) on {qcState.approvedAt}
                  </div>
                )}

                <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs w-full overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500">
                        {isFmAccount && <th className="py-2.5 px-4 w-14 whitespace-nowrap">Check</th>}
                        <th className="py-2.5 px-4 whitespace-nowrap">Code</th>
                        <th className="py-2.5 px-4 whitespace-nowrap">Category</th>
                        <th className="py-2.5 px-4 whitespace-nowrap">Item</th>
                        <th className="py-2.5 px-4 whitespace-nowrap">Standard</th>
                        <th className="py-2.5 px-4 whitespace-nowrap">Status</th>
                        {canApproveQc && <th className="py-2.5 px-4 text-right whitespace-nowrap">Admin / PM Edit</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {qcState.checklistItems.map(item => (
                        <tr
                          key={item.masterItemId}
                          onClick={() => {
                            if (!isFmAccount) return;
                            factoryExecutionService.toggleQcChecklistItem(
                              currentUser,
                              activeChecklistTarget.targetType,
                              activeChecklistTarget.targetId,
                              item.masterItemId
                            );
                            setLocalTick(t => t + 1);
                          }}
                          className={`hover:bg-slate-50 ${isFmAccount ? 'cursor-pointer' : ''}`}
                        >
                          {isFmAccount && (
                            <td className="py-2.5 px-4 whitespace-nowrap">
                              <input
                                type="checkbox"
                                checked={item.checked}
                                onChange={() => {}}
                                className="w-4 h-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                              />
                            </td>
                          )}
                          <td className="py-2.5 px-4 font-mono font-bold text-orange-600 whitespace-nowrap">{item.code}</td>
                          <td className="py-2.5 px-4 font-semibold text-slate-700 whitespace-nowrap">{item.category}</td>
                          <td className="py-2.5 px-4 font-bold text-slate-900 whitespace-nowrap">{item.parameter}</td>
                          <td className="py-2.5 px-4 text-slate-600 whitespace-nowrap">{item.standardSpecification}</td>
                          <td className="py-2.5 px-4 text-xs font-semibold whitespace-nowrap">
                            {item.checked ? (
                              <span className="text-emerald-700">Passed</span>
                            ) : (
                              <span className="text-slate-400">Pending</span>
                            )}
                          </td>
                          {canApproveQc && (
                            <td
                              className="py-2.5 px-4 text-right whitespace-nowrap"
                              onClick={e => e.stopPropagation()}
                            >
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setChecklistItemModal({
                                      mode: 'edit',
                                      targetType: activeChecklistTarget.targetType,
                                      targetId: activeChecklistTarget.targetId,
                                      masterItemId: item.masterItemId,
                                      category: item.category,
                                      parameter: item.parameter,
                                      standardSpecification: item.standardSpecification,
                                      acceptanceCriteria: item.standardSpecification
                                    })
                                  }
                                  className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold inline-flex items-center gap-1"
                                >
                                  <Edit3 className="w-3 h-3" />
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDeleteChecklistItem(
                                      activeChecklistTarget.targetType,
                                      activeChecklistTarget.targetId,
                                      item.masterItemId
                                    )
                                  }
                                  className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-600 text-[11px] font-semibold inline-flex items-center gap-1"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  Delete
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );

          if (typeof document !== 'undefined') {
            return createPortal(checklistModalNode, document.body);
          }
          return checklistModalNode;
        })()}

        {/* 1. Inspections Compact Row per Record + View Button */}
        {qcSubView === 'inspections' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-semibold text-slate-400">
                    <th className="py-2.5 px-4">Code</th>
                    <th className="py-2.5 px-4">Type</th>
                    <th className="py-2.5 px-4">Task</th>
                    <th className="py-2.5 px-4">Decision</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {inspections.map(ins => (
                    <tr key={ins.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-4 font-mono font-bold text-orange-600 whitespace-nowrap">{ins.inspectionNo}</td>
                      <td className="py-2.5 px-4 font-bold text-slate-900 whitespace-nowrap">{ins.inspectionType}</td>
                      <td className="py-2.5 px-4 font-mono text-sky-700 whitespace-nowrap">{ins.taskCode}</td>
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            ins.decision === 'Approved'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                              : 'bg-amber-50 text-amber-700 border-amber-200/80'
                          }`}
                        >
                          {ins.decision}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          {isFmAccount && (
                            <button
                              onClick={() => {
                                try {
                                  factoryExecutionService.approveQualityInspectionRecordByFactoryManager(
                                    currentUser,
                                    ins.id
                                  );
                                  setLocalTick(t => t + 1);
                                  onRefresh();
                                  toast.success(`1st Step Checked by Factory Manager: ${ins.inspectionNo}`);
                                } catch (err: any) {
                                  toast.error(err?.message || 'Check failed');
                                }
                              }}
                              className="px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 text-[11px] font-semibold inline-flex items-center gap-1"
                            >
                              <CheckSquare className="w-3.5 h-3.5" />
                              Check
                            </button>
                          )}
                          {canApproveQc && (
                            <button
                              onClick={() => {
                                try {
                                  factoryExecutionService.approveQualityInspectionRecordByPmOrAdmin(
                                    currentUser,
                                    ins.id
                                  );
                                  setLocalTick(t => t + 1);
                                  onRefresh();
                                  toast.success(`2nd Step Approved by PM/Admin: ${ins.inspectionNo}`);
                                } catch (err: any) {
                                  toast.error(err?.message || 'Factory Manager must check first');
                                }
                              }}
                              disabled={!ins.factoryManagerApproval?.isApproved}
                              title={
                                !ins.factoryManagerApproval?.isApproved
                                  ? '1st Step Required: Factory Manager must check and approve first'
                                  : '2nd Step: Approve QC Inspection'
                              }
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1 ${
                                !ins.factoryManagerApproval?.isApproved
                                  ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                              }`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Approve
                            </button>
                          )}
                          <button
                            onClick={() => setDocSpec(buildInspectionDocSpec(ins))}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold inline-flex items-center gap-1"
                          >
                            <Printer className="w-3.5 h-3.5 text-orange-500" />
                            Doc
                          </button>
                          <button
                            onClick={() => setViewingInspection(ins)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold inline-flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                            View
                          </button>
                          <button
                            onClick={() => {
                              if (!confirm(`Delete inspection record ${ins.inspectionNo}?`)) return;
                              factoryExecutionService.deleteFactoryRecord(currentUser, 'QUALITY_INSPECTION', ins.id);
                              setLocalTick(t => t + 1);
                              onRefresh();
                              toast.success('Inspection record deleted');
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

        {/* 2. Onsite Progress, Mistakes, Quality Damages & Incidents (Compact Row + View Button) */}
        {qcSubView === 'onsite_damages' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-semibold text-slate-400">
                    <th className="py-2.5 px-4">Code</th>
                    <th className="py-2.5 px-4">Category</th>
                    <th className="py-2.5 px-4">Finding</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {onsiteRecords.map(rec => (
                    <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-4 font-mono font-bold text-orange-600 whitespace-nowrap">{rec.recordNo}</td>
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            rec.recordCategory === 'Onsite Progress'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-red-50 text-red-700 border-red-200'
                          }`}
                        >
                          {rec.recordCategory}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-bold text-slate-900 whitespace-nowrap">{rec.title}</td>
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold">
                          {rec.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => setDocSpec(buildOnsiteIncidentDocSpec(rec))}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold inline-flex items-center gap-1"
                          >
                            <Printer className="w-3.5 h-3.5 text-orange-500" />
                            Doc
                          </button>
                          <button
                            onClick={() => setViewingOnsite(rec)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold inline-flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                            View
                          </button>
                          <button
                            onClick={() => {
                              if (!confirm(`Delete incident/damage record ${rec.recordNo}?`)) return;
                              factoryExecutionService.deleteFactoryRecord(currentUser, 'ONSITE_RECORD', rec.id);
                              setLocalTick(t => t + 1);
                              onRefresh();
                              toast.success('Incident/damage record deleted');
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

        {/* 3. Safety Compact Row per Record + View Button */}
        {qcSubView === 'hse' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-semibold text-slate-400">
                    <th className="py-2.5 px-4">Code</th>
                    <th className="py-2.5 px-4">Title</th>
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {hseRecords.map(h => (
                    <tr key={h.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-4 font-mono font-bold text-amber-700 whitespace-nowrap">{h.recordCode}</td>
                      <td className="py-2.5 px-4 font-bold text-slate-900 whitespace-nowrap">{h.title}</td>
                      <td className="py-2.5 px-4 font-mono text-slate-600 whitespace-nowrap">{h.date}</td>
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-[10px] font-bold">
                          {h.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => setDocSpec(buildHseDocSpec(h))}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold inline-flex items-center gap-1"
                          >
                            <Printer className="w-3.5 h-3.5 text-orange-500" />
                            Doc
                          </button>
                          <button
                            onClick={() => setViewingHse(h)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold inline-flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                            View
                          </button>
                          <button
                            onClick={() => {
                              if (!confirm(`Delete safety record ${h.recordCode}?`)) return;
                              factoryExecutionService.deleteFactoryRecord(currentUser, 'HSE_RECORD', h.id);
                              setLocalTick(t => t + 1);
                              onRefresh();
                              toast.success('Safety record deleted');
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

        {/* View Quality Inspection Full Details Modal */}
        {viewingInspection && (
          <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-orange-600">{viewingInspection.inspectionNo}</span>
                  <h3 className="text-sm font-bold text-slate-900">{viewingInspection.inspectionType}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const spec = buildInspectionDocSpec(viewingInspection);
                      setViewingInspection(null);
                      setDocSpec(spec);
                    }}
                    className="px-3 py-1 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold inline-flex items-center gap-1"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print / Approve Document
                  </button>
                  <button
                    onClick={() => setViewingInspection(null)}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-xs font-semibold"
                  >
                    Close
                  </button>
                </div>
              </div>
              <div className="p-5 grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                  <div className="text-[10px] font-semibold text-slate-400">Task Reference</div>
                  <div className="font-mono font-bold text-sky-700 mt-0.5">
                    {viewingInspection.taskCode} — {viewingInspection.taskTitle}
                  </div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                  <div className="text-[10px] font-semibold text-slate-400">Project / Factory</div>
                  <div className="font-bold text-slate-900 mt-0.5">
                    {viewingInspection.projectName} ({viewingInspection.factoryName})
                  </div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                  <div className="text-[10px] font-semibold text-slate-400">Submitted / Approved Qty</div>
                  <div className="font-mono font-bold text-emerald-700 mt-0.5">
                    {viewingInspection.qtyApproved} / {viewingInspection.qtySubmitted}
                  </div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                  <div className="text-[10px] font-semibold text-slate-400">Rework / Rejected Qty</div>
                  <div className="font-mono font-bold text-amber-700 mt-0.5">
                    Rework: {viewingInspection.qtyReworkRequired} • Rejected: {viewingInspection.qtyRejected}
                  </div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                  <div className="text-[10px] font-semibold text-slate-400">Inspector & Date</div>
                  <div className="font-semibold text-slate-800 mt-0.5">
                    {viewingInspection.inspectorName} • {viewingInspection.inspectionDate}
                  </div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                  <div className="text-[10px] font-semibold text-slate-400">Decision</div>
                  <div className="font-bold text-slate-900 mt-0.5">{viewingInspection.decision}</div>
                </div>
                {viewingInspection.defectDescription && (
                  <div className="col-span-2 bg-amber-50/70 p-3 rounded-xl border border-amber-200/80">
                    <div className="text-[10px] font-semibold text-amber-700">Findings / Remarks</div>
                    <div className="font-medium text-slate-800 mt-0.5">{viewingInspection.defectDescription}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* View Onsite Record Full Details + View & Download Media Modal */}
        {viewingOnsite && (
          <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-xl w-full overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-orange-600">{viewingOnsite.recordNo}</span>
                  <h3 className="text-sm font-bold text-slate-900">{viewingOnsite.title}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const spec = buildOnsiteIncidentDocSpec(viewingOnsite);
                      setViewingOnsite(null);
                      setDocSpec(spec);
                    }}
                    className="px-3 py-1 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold inline-flex items-center gap-1"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print / Approve Document
                  </button>
                  <button
                    onClick={() => setViewingOnsite(null)}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-xs font-semibold"
                  >
                    Close
                  </button>
                </div>
              </div>
              <div className="p-5 space-y-4 text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                  <div>
                    <div className="text-[10px] font-semibold text-slate-400">Category & Severity</div>
                    <div className="font-bold text-slate-900 mt-0.5">
                      {viewingOnsite.recordCategory} ({viewingOnsite.severity})
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold text-slate-400">Task</div>
                    <div className="font-mono font-bold text-sky-700 mt-0.5">{viewingOnsite.taskCode}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold text-slate-400">Affected Qty</div>
                    <div className="font-mono font-bold text-slate-900 mt-0.5">
                      {viewingOnsite.affectedQty} {viewingOnsite.unit}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold text-slate-400">Project</div>
                    <div className="font-semibold text-slate-800 mt-0.5">{viewingOnsite.projectName}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold text-slate-400">Factory</div>
                    <div className="font-semibold text-slate-800 mt-0.5">{viewingOnsite.factoryName}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold text-slate-400">Reported By</div>
                    <div className="font-semibold text-slate-800 mt-0.5">
                      {viewingOnsite.reportedBy} • {viewingOnsite.reportedAt}
                    </div>
                  </div>
                  <div className="col-span-2 sm:col-span-3">
                    <div className="text-[10px] font-semibold text-slate-400">Corrective Action</div>
                    <div className="font-semibold text-slate-800 mt-0.5">{viewingOnsite.correctiveAction}</div>
                  </div>
                </div>

                {/* Evidence Attachments with View & Download */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-800">
                    Uploaded Evidence ({viewingOnsite.evidenceAttachments.length})
                  </div>
                  {viewingOnsite.evidenceAttachments.length === 0 ? (
                    <div className="text-slate-400 text-xs">No attachments uploaded.</div>
                  ) : (
                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                      {viewingOnsite.evidenceAttachments.map(att => (
                        <div key={att.id} className="px-3.5 py-2.5 flex items-center justify-between bg-white">
                          <div className="flex items-center gap-2">
                            <Paperclip className="w-3.5 h-3.5 text-sky-600" />
                            <div>
                              <div className="font-bold text-slate-900">{att.fileName}</div>
                              <div className="text-[10px] text-slate-500">
                                {att.mediaKind} • {att.fileSizeLabel} ({att.maxLimitLabel})
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setPreviewAttachment(att)}
                              className="px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 text-[11px] font-semibold inline-flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              View
                            </button>
                            <button
                              onClick={() => {
                                factoryExecutionService.downloadMediaOrFile(
                                  att.fileName,
                                  att.dataUrl,
                                  `Onsite Record: ${viewingOnsite.recordNo}\nTitle: ${viewingOnsite.title}\nFile: ${att.fileName}`
                                );
                                toast.success(`Downloaded ${att.fileName}`);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold inline-flex items-center gap-1"
                            >
                              <Download className="w-3.5 h-3.5" />
                              Download
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Status Update Controls */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="font-bold text-slate-700">Update Status:</span>
                  <div className="flex items-center gap-1.5">
                    {(['Open', 'Under Rectification', 'QC Verified', 'Closed'] as const).map(st => (
                      <button
                        key={st}
                        onClick={() => {
                          const updated = factoryExecutionService.updateOnsiteIncidentStatus(viewingOnsite.id, st);
                          if (updated) setViewingOnsite({ ...updated });
                          setLocalTick(t => t + 1);
                          onRefresh();
                          toast.success(`Status: ${st}`);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold ${
                          viewingOnsite.status === st
                            ? 'bg-orange-500 text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Preview Uploaded Image / Video / Document Modal */}
        {previewAttachment && (
          <div className="fixed inset-0 bg-slate-900/70 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{previewAttachment.fileName}</h3>
                  <p className="text-[11px] text-slate-500">
                    {previewAttachment.mediaKind} • {previewAttachment.fileSizeLabel}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      factoryExecutionService.downloadMediaOrFile(
                        previewAttachment.fileName,
                        previewAttachment.dataUrl,
                        `Attachment: ${previewAttachment.fileName}`
                      );
                      toast.success(`Downloaded ${previewAttachment.fileName}`);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold inline-flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </button>
                  <button
                    onClick={() => setPreviewAttachment(null)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold"
                  >
                    Close
                  </button>
                </div>
              </div>
              <div className="p-5 flex items-center justify-center bg-slate-950 min-h-[280px] max-h-[70vh] overflow-auto">
                {previewAttachment.mediaKind === 'Video' && previewAttachment.dataUrl ? (
                  <video
                    src={previewAttachment.dataUrl}
                    controls
                    className="max-h-[60vh] w-full rounded-lg"
                  />
                ) : previewAttachment.mediaKind === 'Image' && previewAttachment.dataUrl ? (
                  <img
                    src={previewAttachment.dataUrl}
                    alt={previewAttachment.fileName}
                    className="max-h-[60vh] object-contain rounded-lg"
                  />
                ) : (
                  <div className="text-center text-slate-200 space-y-2 p-6">
                    <div className="text-sm font-bold">{previewAttachment.fileName}</div>
                    <div className="text-xs text-slate-400">
                      {previewAttachment.mediaKind} ({previewAttachment.fileSizeLabel}) — Ready for download
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* View HSE Record Modal */}
        {viewingHse && (
          <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-amber-700">{viewingHse.recordCode}</span>
                  <h3 className="text-sm font-bold text-slate-900">{viewingHse.title}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const spec = buildHseDocSpec(viewingHse);
                      setViewingHse(null);
                      setDocSpec(spec);
                    }}
                    className="px-3 py-1 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold inline-flex items-center gap-1"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print / Approve Document
                  </button>
                  <button
                    onClick={() => setViewingHse(null)}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-xs font-semibold"
                  >
                    Close
                  </button>
                </div>
              </div>
              <div className="p-5 grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                  <div className="text-[10px] font-semibold text-slate-400">Project</div>
                  <div className="font-bold text-slate-900 mt-0.5">{viewingHse.projectName}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                  <div className="text-[10px] font-semibold text-slate-400">Factory</div>
                  <div className="font-bold text-slate-900 mt-0.5">{viewingHse.factoryName}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                  <div className="text-[10px] font-semibold text-slate-400">Date</div>
                  <div className="font-mono font-bold text-slate-800 mt-0.5">{viewingHse.date}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                  <div className="text-[10px] font-semibold text-slate-400">Status</div>
                  <div className="font-bold text-emerald-700 mt-0.5">{viewingHse.status}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dedicated Modal: Upload Images & Documents Regarding Task & Progresses */}
        {uploadTaskProgressTarget && (() => {
          const uploadModalNode = (
            <div
              className="fixed inset-0 bg-white flex flex-col overflow-hidden"
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: '100vw',
                height: '100vh',
                zIndex: 2147483645
              }}
            >
              <div className="w-full h-full flex flex-col overflow-hidden bg-white">
                <div className="px-6 py-4 border-b border-slate-200 bg-white text-slate-900 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-mono text-xs font-bold">
                      {uploadTaskProgressTarget.taskCode}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Upload Task & Progress Evidences (Images, Documents ≤1MB, Videos ≤5MB) — {uploadTaskProgressTarget.title}
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Mandatory: At least 1 evidence required before Factory Manager can check or approve
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setUploadTaskProgressTarget(null)}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 text-xs font-semibold cursor-pointer"
                  >
                    Close
                  </button>
                </div>

                <form onSubmit={handleSaveTaskProgressUpload} className="p-6 overflow-y-auto space-y-5 text-xs">
                  {/* Section 1: Task & Progress Update */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                      1. Task Execution & Progress Details
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Switch Target Task</label>
                        <select
                          value={uploadTaskProgressTarget.id}
                          onChange={e => {
                            const nextTask = tasks.find(tk => tk.id === e.target.value);
                            if (nextTask) handleOpenTaskProgressUpload(nextTask);
                          }}
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-semibold"
                        >
                          {tasks.map(tk => (
                            <option key={tk.id} value={tk.id}>
                              {tk.taskCode} — {tk.title}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Task Progress (%)</label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={uploadProgressPct}
                          onChange={e => setUploadProgressPct(Number(e.target.value))}
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Completed Qty ({uploadTaskProgressTarget.unit})
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={uploadProgressCompletedQty}
                          onChange={e => setUploadProgressCompletedQty(Number(e.target.value))}
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Execution Stage</label>
                        <select
                          value={uploadProgressStage}
                          onChange={e => setUploadProgressStage(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                        >
                          <option value="Material Preparation & Cutting">Material Preparation & Cutting</option>
                          <option value="In Production / Assembly">In Production / Assembly</option>
                          <option value="Surface Coating / Glazing">Surface Coating / Glazing</option>
                          <option value="In-Process QC Verification">In-Process QC Verification</option>
                          <option value="Completed & Final QC">Completed & Final QC</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Drawing / Document Ref.</label>
                        <input
                          type="text"
                          value={uploadProgressDrawingRef}
                          onChange={e => setUploadProgressDrawingRef(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Uploaded By / Supervisor</label>
                        <input
                          type="text"
                          value={uploadProgressInspector}
                          onChange={e => setUploadProgressInspector(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <label className="block text-xs font-bold text-slate-700 mb-1">Progress & Inspection Remarks</label>
                        <input
                          type="text"
                          value={uploadProgressNotes}
                          onChange={e => setUploadProgressNotes(e.target.value)}
                          placeholder="Describe current task progress, completed milestones, or document notes..."
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Upload Images & Documents */}
                  <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-200/80 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="text-xs font-bold text-indigo-950">
                          2. Select Images, Progress Photos & Technical Documents
                        </div>
                        <div className="text-[11px] text-indigo-700">
                          Supports Images (JPG, PNG, WEBP), Documents (PDF, DOC, XLSX) & Videos
                        </div>
                      </div>
                      <label className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold inline-flex items-center gap-2 cursor-pointer shadow-2xs">
                        <Upload className="w-4 h-4" />
                        <span>Choose Images & Documents</span>
                        <input
                          type="file"
                          multiple
                          accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
                          onChange={handleSelectTaskProgressFiles}
                          className="hidden"
                        />
                      </label>
                    </div>
                    {uploadProgressError && (
                      <div className="text-xs font-bold text-red-600">{uploadProgressError}</div>
                    )}

                    {uploadProgressAttachments.length === 0 ? (
                      <div className="p-4 rounded-xl bg-white border border-slate-200 text-center text-slate-400">
                        No images or documents attached to this task yet. Click "Choose Images & Documents" above.
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100 bg-white border border-slate-200 rounded-xl overflow-hidden">
                        {uploadProgressAttachments.map(att => (
                          <div key={att.id} className="px-4 py-2.5 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              {att.mediaKind === 'Image' ? (
                                <ImageIcon className="w-4 h-4 text-indigo-600" />
                              ) : (
                                <FileText className="w-4 h-4 text-orange-500" />
                              )}
                              <div>
                                <div className="font-bold text-slate-900">{att.fileName}</div>
                                <div className="text-[10px] text-slate-500">
                                  {att.mediaKind} • {att.fileSizeLabel} • Uploaded by {att.uploadedBy} on {att.uploadedAt}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setPreviewAttachment(att)}
                                className="px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 text-[11px] font-semibold inline-flex items-center gap-1"
                              >
                                <Eye className="w-3 h-3" /> View
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  factoryExecutionService.downloadMediaOrFile(
                                    att.fileName,
                                    att.dataUrl,
                                    `Task: ${uploadTaskProgressTarget.taskCode}\nFile: ${att.fileName}`
                                  )
                                }
                                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold inline-flex items-center gap-1"
                              >
                                <Download className="w-3 h-3" /> Download
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setUploadProgressAttachments(prev => prev.filter(x => x.id !== att.id))
                                }
                                className="p-1 rounded-lg hover:bg-red-50 text-red-500"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setUploadTaskProgressTarget(null)}
                      className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-2xs"
                    >
                      Save
                    </button>
                  </div>
                </form>
              </div>
            </div>
          );

          if (typeof document !== 'undefined') {
            return createPortal(uploadModalNode, document.body);
          }
          return uploadModalNode;
        })()}

        {/* New Inspection Modal (Full Screen White Header) */}
        {showInspModal && (
          <div className="fixed inset-0 bg-white z-[9998] flex flex-col overflow-hidden">
            <div className="w-full h-full flex flex-col overflow-hidden bg-white">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white text-slate-900 shrink-0">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">New Factory Quality Inspection (ITP / FAT / MIR)</h3>
                  <p className="text-[11px] text-slate-500">
                    Complete technical inspection parameters, sample quantities, test instruments & compliance checks
                  </p>
                </div>
                <button
                  onClick={() => setShowInspModal(false)}
                  className="px-3 py-1 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 text-xs font-semibold"
                >
                  Close
                </button>
              </div>
              <form onSubmit={handleSaveInspection} className="p-6 overflow-y-auto space-y-5 text-xs">
                {/* Section 1: Target Task & Reference */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-orange-600">
                    1. Target Task & Engineering Reference
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">Target Task</label>
                      <select
                        value={inspTaskId}
                        onChange={e => setInspTaskId(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-semibold"
                      >
                        {tasks.map(t => (
                          <option key={t.id} value={t.id}>
                            {t.taskCode} — {t.title} ({t.projectName})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Inspection Type</label>
                      <select
                        value={inspType}
                        onChange={e => setInspType(e.target.value as any)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                      >
                        <option value="Incoming Material Inspection (MIR)">Incoming Material (MIR)</option>
                        <option value="First Article Inspection (FAI)">First Article (FAI)</option>
                        <option value="Dimensional & Cutting Check">Dimensional Check</option>
                        <option value="Welding & NDT Inspection">Welding & NDT</option>
                        <option value="Surface Treatment / Coating DFT">Coating / DFT</option>
                        <option value="Final Factory Acceptance Test (FAT)">Final FAT</option>
                        <option value="Pre-Dispatch Packing Verification">Pre-Dispatch QC</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">ITP / Standard Reference</label>
                      <input
                        type="text"
                        value={inspStandardRef}
                        onChange={e => setInspStandardRef(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">AFC Shop Drawing No.</label>
                      <input
                        type="text"
                        value={inspDrawingRef}
                        onChange={e => setInspDrawingRef(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Batch / Heat / Lot No.</label>
                      <input
                        type="text"
                        value={inspBatchLotNo}
                        onChange={e => setInspBatchLotNo(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Quantities & Technical Checkpoints */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-orange-600">
                    2. Sampled Quantities & Technical Parameter Verification
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Submitted Qty</label>
                      <input
                        type="number"
                        value={inspQtySubmitted}
                        onChange={e => {
                          const v = Number(e.target.value);
                          setInspQtySubmitted(v);
                          setInspQtyApproved(v);
                        }}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Approved Qty</label>
                      <input
                        type="number"
                        value={inspQtyApproved}
                        onChange={e => setInspQtyApproved(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-mono text-emerald-700 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Rework Qty</label>
                      <input
                        type="number"
                        value={inspQtyRework}
                        onChange={e => setInspQtyRework(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-mono text-amber-700"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Rejected Qty</label>
                      <input
                        type="number"
                        value={inspQtyRejected}
                        onChange={e => setInspQtyRejected(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-mono text-red-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Dimensional Check</label>
                      <select
                        value={inspDimCheck}
                        onChange={e => setInspDimCheck(e.target.value as 'Pass' | 'Fail')}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                      >
                        <option value="Pass">Pass (±0.5mm Tol.)</option>
                        <option value="Fail">Fail — Out of Tol.</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Coating / Finish DFT</label>
                      <select
                        value={inspCoatCheck}
                        onChange={e => setInspCoatCheck(e.target.value as 'Pass' | 'Fail')}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                      >
                        <option value="Pass">Pass (≥ 65 Microns)</option>
                        <option value="Fail">Fail — Below Spec</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Structural / Sealant</label>
                      <select
                        value={inspStructCheck}
                        onChange={e => setInspStructCheck(e.target.value as 'Pass' | 'Fail')}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                      >
                        <option value="Pass">Pass — Verified</option>
                        <option value="Fail">Fail — Adhesion Issue</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Inspection Decision</label>
                      <select
                        value={inspDecision}
                        onChange={e => setInspDecision(e.target.value as any)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-bold"
                      >
                        <option value="Approved">Approved</option>
                        <option value="Conditionally Approved">Conditionally Approved</option>
                        <option value="Rework Required">Rework Required</option>
                        <option value="Rejected - NCR Raised">Rejected (Raise NCR)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 3: Instruments, Findings & Corrective Action */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-orange-600">
                    3. Calibrated Instruments, Findings & Disposition
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Calibrated Test Instruments Used</label>
                      <input
                        type="text"
                        value={inspInstrumentUsed}
                        onChange={e => setInspInstrumentUsed(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Corrective / Disposition Action Plan</label>
                      <input
                        type="text"
                        value={inspCorrectiveAction}
                        onChange={e => setInspCorrectiveAction(e.target.value)}
                        placeholder="Release for crating / quarantine non-conforming units"
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">Detailed Inspector Remarks & Measurements</label>
                      <textarea
                        rows={2}
                        value={inspRemarks}
                        onChange={e => setInspRemarks(e.target.value)}
                        placeholder="Record diagonal tolerances, DFT readings, weld penetration notes..."
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowInspModal(false)}
                    className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold shadow-2xs"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Log Onsite Progress, Mistake, Quality Damage or Incident Modal (Full Screen White Header) */}
        {showOnsiteModal && (
          <div className="fixed inset-0 bg-white z-[9998] flex flex-col overflow-hidden">
            <div className="w-full h-full flex flex-col overflow-hidden bg-white">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white text-slate-900 shrink-0">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Log Onsite Progress, Execution Mistake, Quality Damage or Safety Incident
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Complete root cause analysis, cost impact, CAPA plan, and attach verified shop-floor evidence
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowOnsiteModal(false);
                    setOnsiteFileError('');
                  }}
                  className="px-3 py-1 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 text-xs font-semibold"
                >
                  Close
                </button>
              </div>
              <form onSubmit={handleSaveOnsiteRecord} className="p-6 overflow-y-auto space-y-5 text-xs">
                {/* Section 1: Classification & Task Link */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-orange-600">
                    1. Classification, Severity & Linked Task
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                      <select
                        value={onsiteCategory}
                        onChange={e => setOnsiteCategory(e.target.value as any)}
                        className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-lg bg-white font-semibold"
                      >
                        <option value="Quality Damage">Quality Damage</option>
                        <option value="Execution Mistake">Execution Mistake</option>
                        <option value="Material Defect">Material Defect</option>
                        <option value="Safety / Site Incident">Safety / Incident</option>
                        <option value="Onsite Progress">Onsite Progress</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Severity Level</label>
                      <select
                        value={onsiteSeverity}
                        onChange={e => setOnsiteSeverity(e.target.value as any)}
                        className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Initial Status</label>
                      <select
                        value={onsiteStatus}
                        onChange={e => setOnsiteStatus(e.target.value as any)}
                        className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                      >
                        <option value="Open">Open</option>
                        <option value="Under Review">Under Review</option>
                        <option value="Under Rectification">Under Rectification</option>
                        <option value="QC Verified">QC Verified</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Shift</label>
                      <select
                        value={onsiteShift}
                        onChange={e => setOnsiteShift(e.target.value)}
                        className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                      >
                        <option value="Day Shift (08:00 - 17:00)">Day Shift (08:00 - 17:00)</option>
                        <option value="Evening Shift (17:00 - 01:00)">Evening Shift (17:00 - 01:00)</option>
                        <option value="Night Shift (01:00 - 08:00)">Night Shift (01:00 - 08:00)</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">Linked Task</label>
                      <select
                        value={onsiteTaskId}
                        onChange={e => setOnsiteTaskId(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                      >
                        {tasks.map(t => (
                          <option key={t.id} value={t.id}>
                            {t.taskCode} — {t.title}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">Factory Bay / Workstation Zone</label>
                      <input
                        type="text"
                        value={onsiteBayZone}
                        onChange={e => setOnsiteBayZone(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Finding Details, Root Cause & Impact */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-orange-600">
                    2. Finding Description, Root Cause & Cost / Quantity Impact
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">Title / Headline Finding *</label>
                      <input
                        type="text"
                        required
                        value={onsiteTitle}
                        onChange={e => setOnsiteTitle(e.target.value)}
                        placeholder="e.g., Powder coat abrasion on mullion batch / CNC mitre offset"
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Affected Qty</label>
                      <input
                        type="number"
                        value={onsiteQty}
                        onChange={e => setOnsiteQty(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Unit</label>
                      <input
                        type="text"
                        value={onsiteUnit}
                        onChange={e => setOnsiteUnit(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">Root Cause Category</label>
                      <input
                        type="text"
                        value={onsiteRootCause}
                        onChange={e => setOnsiteRootCause(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Est. Cost Impact (LKR)</label>
                      <input
                        type="number"
                        value={onsiteCostImpact}
                        onChange={e => setOnsiteCostImpact(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Responsible Lead</label>
                      <input
                        type="text"
                        value={onsiteResponsiblePerson}
                        onChange={e => setOnsiteResponsiblePerson(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                      />
                    </div>
                    <div className="sm:col-span-4">
                      <label className="block text-xs font-bold text-slate-700 mb-1">Detailed Technical Description</label>
                      <textarea
                        rows={2}
                        value={onsiteDescription}
                        onChange={e => setOnsiteDescription(e.target.value)}
                        placeholder="Provide full technical context, profile numbers, and inspection observations..."
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 3: CAPA & Evidence Upload */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-orange-600">
                    3. Corrective / Preventive Action (CAPA) & Evidence Attachments
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Immediate Corrective Action</label>
                      <input
                        type="text"
                        value={onsiteCorrective}
                        onChange={e => setOnsiteCorrective(e.target.value)}
                        placeholder="Re-machine / re-coat & QC verify"
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Long-Term Preventive Action</label>
                      <input
                        type="text"
                        value={onsitePreventiveMeasure}
                        onChange={e => setOnsitePreventiveMeasure(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700">Onsite Evidence (Images, Videos, Documents)</label>
                      <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                        Max 1MB per Image/Doc • Max 5MB per Video
                      </span>
                    </div>
                    <input
                      type="file"
                      accept="image/*,video/*,.pdf,.doc,.docx"
                      onChange={handleOnsiteFileSelect}
                      className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white"
                    />
                    {onsiteFileError && (
                      <p className="text-[11px] font-semibold text-red-600 mt-1">{onsiteFileError}</p>
                    )}
                    {onsiteAttachments.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {onsiteAttachments.map(att => (
                          <span
                            key={att.id}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-semibold"
                          >
                            {att.fileName} ({att.fileSizeLabel} • {att.maxLimitLabel})
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowOnsiteModal(false)}
                    className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={Boolean(onsiteFileError)}
                    className="px-5 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-xs font-semibold shadow-2xs"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Full-Screen Modal: PM / Admin Reject & Issue Defect Report */}
        {rejectTarget && (
          <div className="fixed inset-0 bg-white z-[2147483646] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-white text-slate-900 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-sm font-bold text-rose-700">
                  Reject & Issue Defect Report — {rejectTarget.targetCode} ({rejectTarget.targetTitle})
                </h3>
                <p className="text-[11px] text-slate-500">
                  Provide rejection reason, correction instructions, and optional defect markup file for Factory Manager
                </p>
              </div>
              <button
                onClick={() => setRejectTarget(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 text-xs font-semibold"
              >
                Close
              </button>
            </div>
            <form onSubmit={handleSubmitRejectQc} className="flex-1 p-6 overflow-y-auto space-y-4 text-xs max-w-4xl">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Rejection Reason *</label>
                <textarea
                  rows={3}
                  required
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mandatory Correction Instructions for Factory Manager *
                </label>
                <textarea
                  rows={3}
                  required
                  value={rejectInstructions}
                  onChange={e => setRejectInstructions(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Upload Defect Markup / Instruction File (Image/Doc ≤ 1MB, Video ≤ 5MB)
                </label>
                <input
                  type="file"
                  accept="image/*,video/*,.pdf,.doc,.docx"
                  onChange={handleRejectFileChange}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white"
                />
                {rejectFileName && (
                  <div className="mt-1 text-[11px] font-semibold text-emerald-700">
                    Attached: {rejectFileName} ({rejectFileSize})
                  </div>
                )}
              </div>
              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectTarget(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
                >
                  Confirm Reject & Send Defect Report
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Full-Screen Modal: Admin / PM Add or Edit Unique Checklist Item */}
        {checklistItemModal && (
          <div className="fixed inset-0 bg-white z-[2147483646] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-white text-slate-900 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {checklistItemModal.mode === 'add' ? 'Add Unique Checklist Item' : 'Edit Unique Checklist Item'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Only Admin or Project Manager can add, edit, or delete unique task/sub-task checklist items
                </p>
              </div>
              <button
                onClick={() => setChecklistItemModal(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 text-xs font-semibold"
              >
                Close
              </button>
            </div>
            <form onSubmit={handleSaveChecklistItemModal} className="flex-1 p-6 overflow-y-auto space-y-4 text-xs max-w-3xl">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
                <input
                  type="text"
                  required
                  value={checklistItemModal.category}
                  onChange={e => setChecklistItemModal({ ...checklistItemModal, category: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Checklist Parameter / Check Item *</label>
                <input
                  type="text"
                  required
                  value={checklistItemModal.parameter}
                  onChange={e => setChecklistItemModal({ ...checklistItemModal, parameter: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Standard / Tolerance *</label>
                <input
                  type="text"
                  required
                  value={checklistItemModal.standardSpecification}
                  onChange={e => setChecklistItemModal({ ...checklistItemModal, standardSpecification: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Acceptance Criteria *</label>
                <input
                  type="text"
                  required
                  value={checklistItemModal.acceptanceCriteria}
                  onChange={e => setChecklistItemModal({ ...checklistItemModal, acceptanceCriteria: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                />
              </div>
              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setChecklistItemModal(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold"
                >
                  Save Checklist Item
                </button>
              </div>
            </form>
          </div>
        )}

        {docSpec && (
          <FactoryQuotationDocumentModal
            spec={docSpec}
            currentUser={currentUser}
            onClose={() => setDocSpec(null)}
            onRefresh={() => {
              setLocalTick(t => t + 1);
              onRefresh();
            }}
          />
        )}
      </div>
    );
  }

  // DISPATCH MODE (Compact Single Row per Record + Full Details Sheet & Quick Insert)
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200/80 px-4 py-2.5 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-orange-500" />
          <h2 className="text-xs font-bold text-slate-800">Dispatches ({dispatches.length})</h2>
        </div>
        <button
          onClick={() => setShowDspModal(true)}
          className="px-3.5 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Dispatch
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-semibold text-slate-400">
                <th className="py-2.5 px-4">Code</th>
                <th className="py-2.5 px-4">Batch / Summary</th>
                <th className="py-2.5 px-4">Project</th>
                <th className="py-2.5 px-4 text-right">Items / Qty</th>
                <th className="py-2.5 px-4">Stage</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {dispatches.map(dsp => {
                const itemCount = dsp.dispatchLineItems?.length || 1;
                return (
                  <tr key={dsp.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-4 font-mono font-bold text-orange-600 whitespace-nowrap">{dsp.dispatchNo}</td>
                    <td className="py-2.5 px-4 font-bold text-slate-900 whitespace-nowrap">{dsp.itemDescription}</td>
                    <td className="py-2.5 px-4 text-slate-600 whitespace-nowrap">{dsp.projectName}</td>
                    <td className="py-2.5 px-4 text-right font-mono font-semibold text-sky-700 whitespace-nowrap">
                      {itemCount} items • {dsp.totalQuantityDispatched} {dsp.unit}
                    </td>
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full bg-sky-50 border border-sky-200/80 text-sky-700 text-[10px] font-bold">
                        {dsp.lifecycleStage}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => setDocSpec(buildDispatchDocSpec(dsp))}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold inline-flex items-center gap-1"
                        >
                          <Printer className="w-3.5 h-3.5 text-orange-500" />
                          Doc
                        </button>
                        <button
                          onClick={() => handleOpenDispatchSheet(dsp)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          Sheet
                        </button>
                        <button
                          onClick={() => handleAdvanceDispatchStage(dsp, 'Delivered & Received at Site')}
                          className="px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 border border-sky-200/80 text-[11px] font-semibold text-sky-700"
                        >
                          Delivered
                        </button>
                        <button
                          onClick={() => {
                            if (!confirm(`Delete dispatch record ${dsp.dispatchNo}?`)) return;
                            factoryExecutionService.deleteFactoryRecord(currentUser, 'DISPATCH', dsp.id);
                            onRefresh();
                            toast.success('Dispatch deleted');
                          }}
                          className="p-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* View & Quick-Insert Dispatch Full Details Sheet Modal (Full Screen) */}
      {viewingDispatch && (
        <div className="fixed inset-0 bg-white z-[9998] flex flex-col overflow-hidden">
          <div className="w-full h-full flex flex-col overflow-hidden bg-white">
            <div className="px-5 py-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 bg-white">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-orange-500" />
                <span className="font-mono text-xs font-bold text-orange-600">{viewingDispatch.dispatchNo}</span>
                <h3 className="text-sm font-bold text-slate-900">
                  Dispatch Full Details Sheet — {viewingDispatch.projectName}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const spec = buildDispatchDocSpec({
                      ...viewingDispatch,
                      dispatchLineItems: editingSheetItems
                    });
                    setViewingDispatch(null);
                    setDocSpec(spec);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5 text-orange-500" />
                  Print / Approve Document
                </button>
                <button
                  onClick={() => handleExportDispatchSheetCsv(viewingDispatch, editingSheetItems)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export Sheet CSV
                </button>
                <button
                  onClick={handleSaveEditedDispatchSheet}
                  className="px-3.5 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold shadow-2xs"
                >
                  Save Sheet
                </button>
                <button
                  onClick={() => setViewingDispatch(null)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Header Metadata Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <div>
                  <div className="text-[10px] font-semibold text-slate-400">Delivery Note / Packing</div>
                  <div className="font-mono font-bold text-slate-800 mt-0.5">
                    {viewingDispatch.deliveryNoteNo} • {viewingDispatch.packingListNo}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold text-slate-400">Gate Pass</div>
                  <div className="font-mono font-bold text-slate-800 mt-0.5">{viewingDispatch.gatePassNo}</div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold text-slate-400">Vehicle & Driver</div>
                  <div className="font-semibold text-slate-800 mt-0.5">
                    {viewingDispatch.vehicleRegistrationNo} ({viewingDispatch.driverName})
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold text-slate-400">Dispatched / Installed</div>
                  <div className="font-mono font-bold text-sky-700 mt-0.5">
                    {viewingDispatch.installedQuantity}/{viewingDispatch.totalQuantityDispatched} {viewingDispatch.unit}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold text-slate-400">Stage</div>
                  <div className="font-bold text-emerald-700 mt-0.5">{viewingDispatch.lifecycleStage}</div>
                </div>
              </div>

              {/* Quick Insert Bar for Project Items, Finished Products & Materials */}
              <div className="bg-orange-50/60 border border-orange-200/80 rounded-xl p-3 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-orange-800">
                    <Zap className="w-3.5 h-3.5 text-orange-500" />
                    Quick Insert Project Item, Product, or Material:
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {QUICK_INSERT_PRESETS.map(preset => (
                      <button
                        key={preset.itemCode}
                        type="button"
                        onClick={() => quickInsertIntoActiveSheet(preset)}
                        className="px-2.5 py-1 rounded-lg bg-white hover:bg-orange-100 border border-orange-200 text-slate-800 text-[11px] font-semibold transition-colors"
                      >
                        + {preset.itemCategory.split(' ')[0]}: {preset.itemCode}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        quickInsertIntoActiveSheet({
                          itemCode: `ITM-${Math.floor(100 + Math.random() * 899)}`,
                          itemCategory: 'Project BOQ Item',
                          description: 'Custom Project Item / Component',
                          specificationOrDimensions: 'Standard Spec',
                          crateOrBatchNo: 'CRT-NEW',
                          plannedQty: 10,
                          dispatchedQty: 10,
                          unit: 'Units',
                          weightKg: 120,
                          remarks: 'Ready'
                        })
                      }
                      className="px-2.5 py-1 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-semibold"
                    >
                      + Blank Row
                    </button>
                  </div>
                </div>

                {/* Dropdown Quick Insert from Project Tasks & Inventory Materials */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <select
                    onChange={e => {
                      const t = tasks.find(tk => tk.id === e.target.value);
                      if (!t) return;
                      quickInsertIntoActiveSheet({
                        itemCode: t.taskCode,
                        itemCategory: 'Finished Product',
                        description: t.title,
                        specificationOrDimensions: `${t.drawingNumber} (${t.drawingRevision})`,
                        crateOrBatchNo: `CRT-${t.taskCode.slice(-3)}`,
                        plannedQty: t.plannedQty,
                        dispatchedQty: t.completedQty || t.plannedQty,
                        unit: t.unit,
                        weightKg: (t.completedQty || 10) * 45,
                        remarks: `Task ${t.taskCode} Product`
                      });
                      e.target.value = '';
                    }}
                    className="px-2.5 py-1.5 text-xs border border-orange-200 rounded-lg bg-white"
                  >
                    <option value="">⚡ Quick Insert from Project Tasks / Products...</option>
                    {tasks.map(t => (
                      <option key={t.id} value={t.id}>
                        [PRODUCT] {t.taskCode} — {t.title} ({t.completedQty}/{t.plannedQty} {t.unit})
                      </option>
                    ))}
                  </select>

                  <select
                    onChange={e => {
                      const inv = inventoryItems.find(i => i.id === e.target.value);
                      if (!inv) return;
                      quickInsertIntoActiveSheet({
                        itemCode: inv.sku,
                        itemCategory: 'Raw Material / Profile',
                        description: inv.name,
                        specificationOrDimensions: inv.category || 'Standard Grade',
                        crateOrBatchNo: `MAT-${inv.sku.slice(-3)}`,
                        plannedQty: 20,
                        dispatchedQty: 20,
                        unit: inv.unit || 'Units',
                        weightKg: 150,
                        remarks: 'Material Dispatch'
                      });
                      e.target.value = '';
                    }}
                    className="px-2.5 py-1.5 text-xs border border-orange-200 rounded-lg bg-white"
                  >
                    <option value="">⚡ Quick Insert from Inventory Materials / Hardware...</option>
                    {inventoryItems.slice(0, 12).map(inv => (
                      <option key={inv.id} value={inv.id}>
                        [MATERIAL] {inv.sku} — {inv.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Editable Full Details Sheet Table */}
              <div className="border border-slate-200 rounded-xl overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500">
                      <th className="py-2 px-2.5">Item Code</th>
                      <th className="py-2 px-2.5">Category</th>
                      <th className="py-2 px-2.5">Description</th>
                      <th className="py-2 px-2.5">Spec / Dimensions</th>
                      <th className="py-2 px-2.5">Crate / Batch</th>
                      <th className="py-2 px-2.5 text-right">Dispatched Qty</th>
                      <th className="py-2 px-2.5">Unit</th>
                      <th className="py-2 px-2.5 text-right">Weight (kg)</th>
                      <th className="py-2 px-2.5">Remarks</th>
                      <th className="py-2 px-2.5 text-right">Del</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {editingSheetItems.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50/70">
                        <td className="p-1.5">
                          <input
                            type="text"
                            value={item.itemCode}
                            onChange={e => {
                              const next = [...editingSheetItems];
                              next[idx] = { ...item, itemCode: e.target.value };
                              setEditingSheetItems(next);
                            }}
                            className="w-24 px-2 py-1 border border-slate-200 rounded font-mono text-[11px]"
                          />
                        </td>
                        <td className="p-1.5">
                          <select
                            value={item.itemCategory}
                            onChange={e => {
                              const next = [...editingSheetItems];
                              next[idx] = { ...item, itemCategory: e.target.value as any };
                              setEditingSheetItems(next);
                            }}
                            className="px-2 py-1 border border-slate-200 rounded text-[11px] bg-white"
                          >
                            {DISPATCH_CATEGORIES.map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-1.5">
                          <input
                            type="text"
                            value={item.description}
                            onChange={e => {
                              const next = [...editingSheetItems];
                              next[idx] = { ...item, description: e.target.value };
                              setEditingSheetItems(next);
                            }}
                            className="w-44 px-2 py-1 border border-slate-200 rounded text-[11px] font-semibold"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="text"
                            value={item.specificationOrDimensions}
                            onChange={e => {
                              const next = [...editingSheetItems];
                              next[idx] = { ...item, specificationOrDimensions: e.target.value };
                              setEditingSheetItems(next);
                            }}
                            className="w-40 px-2 py-1 border border-slate-200 rounded text-[11px]"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="text"
                            value={item.crateOrBatchNo}
                            onChange={e => {
                              const next = [...editingSheetItems];
                              next[idx] = { ...item, crateOrBatchNo: e.target.value };
                              setEditingSheetItems(next);
                            }}
                            className="w-24 px-2 py-1 border border-slate-200 rounded font-mono text-[11px]"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="number"
                            value={item.dispatchedQty}
                            onChange={e => {
                              const next = [...editingSheetItems];
                              next[idx] = { ...item, dispatchedQty: Number(e.target.value) };
                              setEditingSheetItems(next);
                            }}
                            className="w-20 px-2 py-1 border border-slate-200 rounded text-right font-mono text-[11px]"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="text"
                            value={item.unit}
                            onChange={e => {
                              const next = [...editingSheetItems];
                              next[idx] = { ...item, unit: e.target.value };
                              setEditingSheetItems(next);
                            }}
                            className="w-16 px-2 py-1 border border-slate-200 rounded text-[11px]"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="number"
                            value={item.weightKg}
                            onChange={e => {
                              const next = [...editingSheetItems];
                              next[idx] = { ...item, weightKg: Number(e.target.value) };
                              setEditingSheetItems(next);
                            }}
                            className="w-20 px-2 py-1 border border-slate-200 rounded text-right font-mono text-[11px]"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="text"
                            value={item.remarks || ''}
                            onChange={e => {
                              const next = [...editingSheetItems];
                              next[idx] = { ...item, remarks: e.target.value };
                              setEditingSheetItems(next);
                            }}
                            className="w-32 px-2 py-1 border border-slate-200 rounded text-[11px]"
                          />
                        </td>
                        <td className="p-1.5 text-right">
                          <button
                            type="button"
                            onClick={() => setEditingSheetItems(prev => prev.filter((_, i) => i !== idx))}
                            className="p-1 rounded hover:bg-red-50 text-red-500"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Dispatch Modal with Quick Insert & Full Details Sheet (Full Screen White Header) */}
      {showDspModal && (
        <div className="fixed inset-0 bg-white z-[9998] flex flex-col overflow-hidden">
          <div className="w-full h-full flex flex-col overflow-hidden bg-white">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white text-slate-900 shrink-0">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  New Factory Dispatch, Gate Pass & Itemized Full Details Sheet
                </h3>
                <p className="text-[11px] text-slate-500">
                  Complete project assignment, logistics & haulage details, site receiver, packaging instructions & itemized manifest
                </p>
              </div>
              <button
                onClick={() => setShowDspModal(false)}
                className="px-3 py-1 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 text-xs font-semibold"
              >
                Close
              </button>
            </div>
            <form onSubmit={handleSaveDispatch} className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Section 1: Project, Gate Pass & Site Destination */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-orange-600">
                  1. Project Assignment, Gate Pass & Site Destination
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Project Work Package</label>
                    <select
                      value={dspWpId}
                      onChange={e => setDspWpId(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-semibold"
                    >
                      {workPackages.map(w => (
                        <option key={w.id} value={w.id}>
                          {w.packageCode} — {w.projectName} ({w.factoryName})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Dispatch Summary Title</label>
                    <input
                      type="text"
                      value={dspDesc}
                      onChange={e => setDspDesc(e.target.value)}
                      placeholder="Auto-summarized from manifest items if blank"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Gate Pass No.</label>
                    <input
                      type="text"
                      value={dspGatePassNo}
                      onChange={e => setDspGatePassNo(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Security Seal No.</label>
                    <input
                      type="text"
                      value={dspSecuritySealNo}
                      onChange={e => setDspSecuritySealNo(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Delivery Site Location</label>
                    <input
                      type="text"
                      value={dspSiteLocation}
                      onChange={e => setDspSiteLocation(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Site Receiver / Engineer</label>
                    <input
                      type="text"
                      value={dspSiteReceiver}
                      onChange={e => setDspSiteReceiver(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Transport, Vehicle & Crating Specifications */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-orange-600">
                  2. Transport Fleet, Driver & Packaging / Handling Specifications
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Transporter / Logistics Co.</label>
                    <input
                      type="text"
                      value={dspTransporterCompany}
                      onChange={e => setDspTransporterCompany(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Vehicle Registration No.</label>
                    <input
                      type="text"
                      value={dspVehicle}
                      onChange={e => setDspVehicle(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Driver Name</label>
                    <input
                      type="text"
                      value={dspDriver}
                      onChange={e => setDspDriver(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Driver Contact No.</label>
                    <input
                      type="text"
                      value={dspDriverContact}
                      onChange={e => setDspDriverContact(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Crating & Protection Method</label>
                    <input
                      type="text"
                      value={dspPackagingMethod}
                      onChange={e => setDspPackagingMethod(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Special Unloading & Rigging Instructions</label>
                    <input
                      type="text"
                      value={dspSpecialHandling}
                      onChange={e => setDspSpecialHandling(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Quick Insert Bar */}
              <div className="bg-orange-50/60 border border-orange-200/80 rounded-xl p-3 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-orange-800 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-orange-500" />
                    Quick Insert Items (Project Items, Products, Materials):
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {QUICK_INSERT_PRESETS.map(preset => (
                      <button
                        key={preset.itemCode}
                        type="button"
                        onClick={() => quickInsertIntoNewDispatch(preset)}
                        className="px-2.5 py-1 rounded-lg bg-white hover:bg-orange-100 border border-orange-200 text-slate-800 text-[11px] font-semibold"
                      >
                        + {preset.itemCode}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        quickInsertIntoNewDispatch({
                          itemCode: `ITM-${Math.floor(100 + Math.random() * 899)}`,
                          itemCategory: 'Project BOQ Item',
                          description: 'Custom Project Item',
                          specificationOrDimensions: 'Standard',
                          crateOrBatchNo: 'CRT-02',
                          plannedQty: 10,
                          dispatchedQty: 10,
                          unit: 'Units',
                          weightKg: 100,
                          remarks: ''
                        })
                      }
                      className="px-2.5 py-1 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-semibold"
                    >
                      + Custom Row
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    onChange={e => {
                      const t = tasks.find(tk => tk.id === e.target.value);
                      if (!t) return;
                      quickInsertIntoNewDispatch({
                        itemCode: t.taskCode,
                        itemCategory: 'Finished Product',
                        description: t.title,
                        specificationOrDimensions: `${t.drawingNumber} (${t.drawingRevision})`,
                        crateOrBatchNo: `CRT-${t.taskCode.slice(-3)}`,
                        plannedQty: t.plannedQty,
                        dispatchedQty: t.completedQty || t.plannedQty,
                        unit: t.unit,
                        weightKg: (t.completedQty || 10) * 45,
                        remarks: 'Task Output'
                      });
                      e.target.value = '';
                    }}
                    className="px-2.5 py-1.5 text-xs border border-orange-200 rounded-lg bg-white"
                  >
                    <option value="">⚡ Quick Insert Project Task / Product...</option>
                    {tasks.map(t => (
                      <option key={t.id} value={t.id}>
                        [PRODUCT] {t.taskCode} — {t.title}
                      </option>
                    ))}
                  </select>

                  <select
                    onChange={e => {
                      const inv = inventoryItems.find(i => i.id === e.target.value);
                      if (!inv) return;
                      quickInsertIntoNewDispatch({
                        itemCode: inv.sku,
                        itemCategory: 'Raw Material / Profile',
                        description: inv.name,
                        specificationOrDimensions: inv.category || 'Material Spec',
                        crateOrBatchNo: `MAT-${inv.sku.slice(-3)}`,
                        plannedQty: 25,
                        dispatchedQty: 25,
                        unit: inv.unit || 'Units',
                        weightKg: 140,
                        remarks: 'Site Material'
                      });
                      e.target.value = '';
                    }}
                    className="px-2.5 py-1.5 text-xs border border-orange-200 rounded-lg bg-white"
                  >
                    <option value="">⚡ Quick Insert Material / Hardware...</option>
                    {inventoryItems.slice(0, 12).map(inv => (
                      <option key={inv.id} value={inv.id}>
                        [MATERIAL] {inv.sku} — {inv.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="border border-slate-200 rounded-xl overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500">
                      <th className="py-2 px-2.5">Code</th>
                      <th className="py-2 px-2.5">Category</th>
                      <th className="py-2 px-2.5">Description</th>
                      <th className="py-2 px-2.5">Spec / Dimensions</th>
                      <th className="py-2 px-2.5">Crate</th>
                      <th className="py-2 px-2.5 text-right">Qty</th>
                      <th className="py-2 px-2.5">Unit</th>
                      <th className="py-2 px-2.5 text-right">Del</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {dspLineItems.map((item, idx) => (
                      <tr key={item.id}>
                        <td className="p-1.5">
                          <input
                            type="text"
                            value={item.itemCode}
                            onChange={e => {
                              const next = [...dspLineItems];
                              next[idx] = { ...item, itemCode: e.target.value };
                              setDspLineItems(next);
                            }}
                            className="w-24 px-2 py-1 border border-slate-200 rounded font-mono text-[11px]"
                          />
                        </td>
                        <td className="p-1.5">
                          <select
                            value={item.itemCategory}
                            onChange={e => {
                              const next = [...dspLineItems];
                              next[idx] = { ...item, itemCategory: e.target.value as any };
                              setDspLineItems(next);
                            }}
                            className="px-2 py-1 border border-slate-200 rounded text-[11px] bg-white"
                          >
                            {DISPATCH_CATEGORIES.map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-1.5">
                          <input
                            type="text"
                            value={item.description}
                            onChange={e => {
                              const next = [...dspLineItems];
                              next[idx] = { ...item, description: e.target.value };
                              setDspLineItems(next);
                            }}
                            className="w-44 px-2 py-1 border border-slate-200 rounded text-[11px]"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="text"
                            value={item.specificationOrDimensions}
                            onChange={e => {
                              const next = [...dspLineItems];
                              next[idx] = { ...item, specificationOrDimensions: e.target.value };
                              setDspLineItems(next);
                            }}
                            className="w-36 px-2 py-1 border border-slate-200 rounded text-[11px]"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="text"
                            value={item.crateOrBatchNo}
                            onChange={e => {
                              const next = [...dspLineItems];
                              next[idx] = { ...item, crateOrBatchNo: e.target.value };
                              setDspLineItems(next);
                            }}
                            className="w-20 px-2 py-1 border border-slate-200 rounded font-mono text-[11px]"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="number"
                            value={item.dispatchedQty}
                            onChange={e => {
                              const next = [...dspLineItems];
                              next[idx] = { ...item, dispatchedQty: Number(e.target.value) };
                              setDspLineItems(next);
                            }}
                            className="w-16 px-2 py-1 border border-slate-200 rounded text-right font-mono text-[11px]"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="text"
                            value={item.unit}
                            onChange={e => {
                              const next = [...dspLineItems];
                              next[idx] = { ...item, unit: e.target.value };
                              setDspLineItems(next);
                            }}
                            className="w-16 px-2 py-1 border border-slate-200 rounded text-[11px]"
                          />
                        </td>
                        <td className="p-1.5 text-right">
                          <button
                            type="button"
                            onClick={() => setDspLineItems(prev => prev.filter((_, i) => i !== idx))}
                            className="p-1 rounded hover:bg-red-50 text-red-500"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDspModal(false)}
                  className="px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold shadow-2xs"
                >
                  Save
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
          onRefresh={() => {
            setLocalTick(t => t + 1);
            onRefresh();
          }}
        />
      )}
    </div>
  );
};
