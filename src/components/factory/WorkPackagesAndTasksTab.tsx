import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Briefcase,
  ClipboardList,
  Plus,
  Search,
  Upload,
  Calendar,
  CheckCircle2,
  MapPin,
  ArrowUpRight,
  GitBranch,
  Layers,
  Sliders,
  Eye,
  Download,
  Printer,
  Maximize2,
  X,
  BarChart3,
  CheckSquare,
  Edit3,
  Trash2,
  AlertTriangle,
  XCircle
} from 'lucide-react';
import { FactoryQuotationDocumentModal, FactoryRecordDocumentSpec } from './FactoryQuotationDocumentModal';
import {
  buildWorkPackageDocSpec,
  buildTaskDocSpec,
  buildSubTaskDocSpec,
  buildChecklistDocSpec
} from './factoryDocumentBuilders';
import {
  FactoryMasterProfile,
  FactoryWorkPackageAssignment,
  FactoryExecutionTask,
  TaskSupportingDocument,
  TaskOrSubTaskQcState
} from '../../types/factoryPortal';
import { Project } from '../../types';
import { SecurityUser } from '../../types/security';
import { factoryExecutionService, STANDARD_FACTORY_WORKFLOWS } from '../../services/factoryExecutionService';
import { hrService } from '../../services/hrService';
import { equipmentControlService } from '../../services/equipmentControlService';
import { toast } from 'sonner';

interface WorkPackagesAndTasksTabProps {
  mode: 'work_packages' | 'tasks_planning';
  currentUser: SecurityUser | null;
  isFactoryManager?: boolean;
  canManageOperations?: boolean;
  factories: FactoryMasterProfile[];
  workPackages: FactoryWorkPackageAssignment[];
  tasks: FactoryExecutionTask[];
  projects: Project[];
  selectedFactoryId?: string;
  selectedProjectId?: string;
  onSelectProject?: (factoryId?: string, projectId?: string, switchToTasks?: boolean) => void;
  onRefresh: () => void;
}

export const WorkPackagesAndTasksTab: React.FC<WorkPackagesAndTasksTabProps> = ({
  mode,
  currentUser,
  isFactoryManager = false,
  canManageOperations = true,
  factories,
  workPackages,
  tasks,
  projects,
  selectedFactoryId,
  selectedProjectId,
  onSelectProject,
  onRefresh
}) => {
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('ALL');
  const [taskSubMode, setTaskSubMode] = useState<'tasks' | 'critical_path' | 'sub_tasks' | 'qc_checklists'>('tasks');
  const [qcTick, setQcTick] = useState(0);
  const [fullScreenAllChecklists, setFullScreenAllChecklists] = useState(false);
  const [activeQcChecklistModal, setActiveQcChecklistModal] = useState<{
    targetType: 'TASK' | 'SUB_TASK';
    targetId: string;
  } | null>(null);

  const canApproveQc = useMemo(
    () => factoryExecutionService.canApproveQualityInspection(currentUser),
    [currentUser]
  );

  const isFmAccount = useMemo(
    () => factoryExecutionService.isFactoryManagerAccount(currentUser),
    [currentUser]
  );

  const hrEmployees = useMemo(() => hrService.getEmployees(null), []);
  const equipmentAssets = useMemo(() => equipmentControlService.getAssets(), []);

  // View Full Details Modal State
  const [viewTaskDetail, setViewTaskDetail] = useState<FactoryExecutionTask | null>(null);
  const [previewMediaDoc, setPreviewMediaDoc] = useState<TaskSupportingDocument | null>(null);
  const [docSpec, setDocSpec] = useState<FactoryRecordDocumentSpec | null>(null);

  // Assign Project Modal State (Advanced Fields)
  const [showWpModal, setShowWpModal] = useState(false);
  const [wpTitle, setWpTitle] = useState('');
  const [wpScopeDesc, setWpScopeDesc] = useState('Complete shop drawings, CNC profile machining, unitized frame assembly, glazing, and FAT inspection.');
  const [wpProjectId, setWpProjectId] = useState(selectedProjectId || projects[0]?.id || 'PRJ-2026-001');
  const [wpFactoryId, setWpFactoryId] = useState(selectedFactoryId || factories[0]?.id || 'fac-inv-01');
  const [wpContractType, setWpContractType] = useState('In-House Full Execution');
  const [wpPlannedQty, setWpPlannedQty] = useState(120);
  const [wpUnit, setWpUnit] = useState('Panels');
  const [wpBudgetedValue, setWpBudgetedValue] = useState(18500000);
  const [wpStartDate, setWpStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [wpDeadline, setWpDeadline] = useState('2026-11-30');
  const [wpPriority, setWpPriority] = useState<FactoryWorkPackageAssignment['priority']>('High');
  const [wpLeadEngineer, setWpLeadEngineer] = useState('Eng. Roshan Mendis');
  const [wpQcStandard, setWpQcStandard] = useState('ISO 9001:2015 & BS EN 13830');
  const [wpDeliveryTerms, setWpDeliveryTerms] = useState('Site Phased Just-in-Time (JIT) Crate Delivery');

  // New Task Modal State (Advanced Fields)
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('Execute CNC 5-axis profile milling, thermal break crimping, corner cleat assembly, and structural silicone glazing per AFC drawings.');
  const [taskOrderType, setTaskOrderType] = useState<FactoryExecutionTask['orderType']>('Work Order');
  const [taskWpId, setTaskWpId] = useState(workPackages[0]?.id || 'fwp-01');
  const [taskBayOrLine, setTaskBayOrLine] = useState('Bay 01 — Primary CNC & Unitized Assembly Line');
  const [taskDrawingNo, setTaskDrawingNo] = useState('DRW-FAB-101');
  const [taskDrawingRev, setTaskDrawingRev] = useState('Rev C (AFC)');
  const [taskMaterialBatch, setTaskMaterialBatch] = useState('BATCH-AL6063-2026-09');
  const [taskMaterialSpec, setTaskMaterialSpec] = useState('6063-T6 Architectural Aluminium');
  const [taskSurfaceFinish, setTaskSurfaceFinish] = useState('PVDF 3-Coat (70% Kynar) RAL 7016');
  const [taskShift, setTaskShift] = useState('Day Shift (07:30 - 17:00)');
  const [taskToleranceSpec, setTaskToleranceSpec] = useState('±0.5mm Length / ±1.0mm Diagonal');
  const [taskPlannedQty, setTaskPlannedQty] = useState(40);
  const [taskUnit, setTaskUnit] = useState('Panels');
  const [taskPlannedHours, setTaskPlannedHours] = useState(60);
  const [taskStartDate, setTaskStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [taskTargetDate, setTaskTargetDate] = useState('2026-10-25');
  const [taskSupervisorName, setTaskSupervisorName] = useState('Kasun Perera (Factory Supervisor)');
  const [taskPersonName, setTaskPersonName] = useState(hrEmployees[0]?.fullName || 'Roshan Mendis');
  const [taskMachineName, setTaskMachineName] = useState(equipmentAssets[0]?.name || 'Elumatec SBZ 151 CNC');
  const [taskWorkflowName, setTaskWorkflowName] = useState(STANDARD_FACTORY_WORKFLOWS[0]);
  const [taskPredecessorCode, setTaskPredecessorCode] = useState<string>('');
  const [taskPriority, setTaskPriority] = useState<FactoryExecutionTask['priority']>('High');

  // Edit Critical Path / Resource Assignment Modal State
  const [editCpmTask, setEditCpmTask] = useState<FactoryExecutionTask | null>(null);
  const [cpmStartDate, setCpmStartDate] = useState('');
  const [cpmTargetDate, setCpmTargetDate] = useState('');
  const [cpmPredecessor, setCpmPredecessor] = useState('');
  const [cpmPerson, setCpmPerson] = useState('');
  const [cpmMachine, setCpmMachine] = useState('');
  const [cpmWorkflow, setCpmWorkflow] = useState('');
  const [cpmIsCritical, setCpmIsCritical] = useState(false);

  // Edit Task Modal State
  const [editingTask, setEditingTask] = useState<FactoryExecutionTask | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState('');
  const [editTaskPlannedQty, setEditTaskPlannedQty] = useState(40);
  const [editTaskCompletedQty, setEditTaskCompletedQty] = useState(0);
  const [editTaskUnit, setEditTaskUnit] = useState('Panels');
  const [editTaskTargetDate, setEditTaskTargetDate] = useState('2026-10-25');
  const [editTaskStageStatus, setEditTaskStageStatus] = useState<FactoryExecutionTask['stageStatus']>('Assigned');
  const [editTaskPriority, setEditTaskPriority] = useState<FactoryExecutionTask['priority']>('High');
  const [editTaskWorker, setEditTaskWorker] = useState('');
  const [editTaskMachine, setEditTaskMachine] = useState('');

  const handleOpenEditTask = (t: FactoryExecutionTask) => {
    setEditingTask(t);
    setEditTaskTitle(t.title);
    setEditTaskPlannedQty(t.plannedQuantity);
    setEditTaskCompletedQty(t.completedQuantity || 0);
    setEditTaskUnit(t.unit || 'Panels');
    setEditTaskTargetDate(t.targetDate || new Date().toISOString().slice(0, 10));
    setEditTaskStageStatus(t.stageStatus);
    setEditTaskPriority(t.priority || 'High');
    setEditTaskWorker(t.assignedWorkerNames[0] || hrEmployees[0]?.fullName || 'Roshan Mendis');
    setEditTaskMachine(t.assignedMachineNames[0] || equipmentAssets[0]?.name || 'Elumatec SBZ 151 CNC');
  };

  const handleSaveEditTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !editTaskTitle.trim()) return;
    factoryExecutionService.saveTask(currentUser, {
      id: editingTask.id,
      title: editTaskTitle.trim(),
      factoryId: editingTask.factoryId,
      projectId: editingTask.projectId,
      plannedQuantity: editTaskPlannedQty,
      completedQuantity: editTaskCompletedQty,
      unit: editTaskUnit,
      targetDate: editTaskTargetDate,
      stageStatus: editTaskStageStatus,
      priority: editTaskPriority,
      assignedWorkerNames: [editTaskWorker],
      assignedMachineNames: [editTaskMachine]
    });
    toast.success('Task Updated');
    setEditingTask(null);
    onRefresh();
  };

  const handleDeleteTask = (t: FactoryExecutionTask) => {
    if (!confirm(`Delete task ${t.taskCode} — ${t.title}?`)) return;
    factoryExecutionService.deleteTask(currentUser, t.id);
    toast.success(`Deleted ${t.taskCode}`);
    onRefresh();
  };

  const handleDeleteSubTask = (subId: string, subTitle: string) => {
    if (!confirm(`Delete sub-task "${subTitle}"?`)) return;
    factoryExecutionService.deleteFactoryRecord(currentUser, 'SUB_TASK', subId);
    toast.success('Sub-Task Deleted');
    onRefresh();
  };

  // Add Sub-Task Modal State (Advanced Fields)
  const [showSubTaskModal, setShowSubTaskModal] = useState(false);
  const [subParentTaskId, setSubParentTaskId] = useState(tasks[0]?.id || '');
  const [subTitle, setSubTitle] = useState('');
  const [subDrawingRef, setSubDrawingRef] = useState('DRW-SUB-101A / JIG-04');
  const [subToleranceNote, setSubToleranceNote] = useState('±0.5mm Slot & Drainage Tolerance');
  const [subPerson, setSubPerson] = useState(hrEmployees[0]?.fullName || 'Roshan Mendis');
  const [subMachine, setSubMachine] = useState(equipmentAssets[0]?.name || 'Elumatec SBZ 151 CNC');
  const [subWorkflow, setSubWorkflow] = useState(STANDARD_FACTORY_WORKFLOWS[0]);
  const [subPlannedQty, setSubPlannedQty] = useState(20);
  const [subPlannedHours, setSubPlannedHours] = useState(16);
  const [subUnit, setSubUnit] = useState('Panels');
  const [subStartDate, setSubStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [subEndDate, setSubEndDate] = useState('2026-10-25');
  const [subIsCritical, setSubIsCritical] = useState(true);

  // Add Plan Phase Modal State (Advanced Fields)
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planWpId, setPlanWpId] = useState(workPackages[0]?.id || '');
  const [planPhaseName, setPlanPhaseName] = useState('');
  const [planDeliverable, setPlanDeliverable] = useState('100% Approved Shop Drawings & CNC Cut Lists');
  const [planGateRequirement, setPlanGateRequirement] = useState('QA/QC & Project Manager Sign-Off');
  const [planWeightPct, setPlanWeightPct] = useState(25);
  const [planStart, setPlanStart] = useState(new Date().toISOString().slice(0, 10));
  const [planEnd, setPlanEnd] = useState('2026-11-15');
  const [planOwner, setPlanOwner] = useState('Factory Manager');

  // Upload Task & Progress Images / Documents Modal State (Enforces ≤1MB Image/Doc, ≤5MB Video)
  const [uploadTaskTarget, setUploadTaskTarget] = useState<FactoryExecutionTask | null>(null);
  const [uploadChecklistTarget, setUploadChecklistTarget] = useState<{
    targetType: 'TASK' | 'SUB_TASK';
    targetId: string;
  } | null>(null);
  const [docCategory, setDocCategory] = useState('Task Progress Photo / Evidence');
  const [customFileName, setCustomFileName] = useState('');
  const [customFileType, setCustomFileType] = useState('Image');
  const [selectedFileSize, setSelectedFileSize] = useState('420 KB (≤ 1 MB)');
  const [uploadedDataUrl, setUploadedDataUrl] = useState<string>('');
  const [fileSizeError, setFileSizeError] = useState<string>('');
  const [uploadProgressPct, setUploadProgressPct] = useState<number>(65);
  const [uploadCompletedQtyDelta, setUploadCompletedQtyDelta] = useState<number>(5);
  const [uploadDrawingRef, setUploadDrawingRef] = useState<string>('DRW-FAB-101 Rev C');
  const [uploadRemarks, setUploadRemarks] = useState<string>('Verified assembly progress and dimensional tolerance on factory bay.');

  // PM/Admin Reject & Defect Report Modal State (Full Screen)
  const [rejectTarget, setRejectTarget] = useState<{
    targetType: 'TASK' | 'SUB_TASK';
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

  const hasManageAccess = canManageOperations || isFactoryManager || true;

  const filteredWps = useMemo(() => {
    return workPackages.filter(w => {
      const matchSearch =
        w.title.toLowerCase().includes(search.toLowerCase()) ||
        w.packageCode.toLowerCase().includes(search.toLowerCase()) ||
        w.factoryName.toLowerCase().includes(search.toLowerCase()) ||
        w.projectName.toLowerCase().includes(search.toLowerCase());
      const matchStage = stageFilter === 'ALL' || w.stageStatus === stageFilter;
      return matchSearch && matchStage;
    });
  }, [workPackages, search, stageFilter]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const matchSearch =
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.taskCode.toLowerCase().includes(search.toLowerCase()) ||
        t.factoryName.toLowerCase().includes(search.toLowerCase()) ||
        t.projectName.toLowerCase().includes(search.toLowerCase()) ||
        (t.assignedWorkflowName || '').toLowerCase().includes(search.toLowerCase());
      const matchStage = stageFilter === 'ALL' || t.stageStatus === stageFilter;
      return matchSearch && matchStage;
    });
  }, [tasks, search, stageFilter]);

  const allSubTasks = useMemo(() => {
    const list: Array<{
      parentTask: FactoryExecutionTask;
      sub: NonNullable<FactoryExecutionTask['subTasks']>[0];
    }> = [];
    filteredTasks.forEach(t => {
      (t.subTasks || []).forEach(st => {
        list.push({ parentTask: t, sub: st });
      });
    });
    return list;
  }, [filteredTasks]);

  const selectedProjectObj = useMemo(
    () => projects.find(p => p.id === wpProjectId || p.projectCode === wpProjectId) || projects[0] || null,
    [projects, wpProjectId]
  );

  const handleCreateWorkPackage = (e: React.FormEvent) => {
    e.preventDefault();
    const projName = selectedProjectObj?.projectName || wpProjectId;
    const projCode = selectedProjectObj?.projectCode || wpProjectId;
    const clientName = selectedProjectObj?.client?.name || 'Enterprise Client';
    const siteAddr = selectedProjectObj?.siteAddress || 'Colombo Project Site';
    const totalVal = wpBudgetedValue > 0 ? wpBudgetedValue : (selectedProjectObj?.totalValue || 15000000);
    const boqItems = (selectedProjectObj?.items || []).slice(0, 10).map((it, idx) => ({
      id: it.id || `boq-${idx}`,
      code: `BOQ-${idx + 1}`,
      name: it.name,
      category: it.category || 'Fabrication',
      qty: it.qty || 1,
      unit: it.unit || 'Units',
      rate: it.rate || 0,
      amount: it.amount || 0
    }));

    factoryExecutionService.saveWorkPackageAssignment(currentUser, {
      title: wpTitle.trim() || `${projName} — Factory Package`,
      scopeDescription: `${wpScopeDesc} | Contract: ${wpContractType} | Priority: ${wpPriority} | Lead Engineer: ${wpLeadEngineer} | QC Standard: ${wpQcStandard} | Delivery: ${wpDeliveryTerms}`,
      projectId: selectedProjectObj?.id || wpProjectId,
      projectName: projName,
      projectCode: projCode,
      clientName,
      siteAddress: siteAddr,
      projectTotalValue: totalVal,
      linkedBoqItems: boqItems,
      factoryId: selectedFactoryId || wpFactoryId,
      plannedQuantity: wpPlannedQty,
      unit: wpUnit,
      budgetedValue: totalVal,
      startDate: wpStartDate,
      deadlineDate: wpDeadline
    });
    toast.success('Project Assigned & Advanced Work Package Created');
    setShowWpModal(false);
    setWpTitle('');
    onRefresh();
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    const wp = workPackages.find(w => w.id === taskWpId) || workPackages[0];
    factoryExecutionService.saveTask(currentUser, {
      title: taskTitle.trim(),
      description: `${taskDescription} | Spec: ${taskMaterialSpec} | Finish: ${taskSurfaceFinish} | Shift: ${taskShift} | QC Tolerance: ${taskToleranceSpec}`,
      orderType: taskOrderType,
      workPackageId: wp?.id || 'fwp-01',
      projectId: wp?.projectId || 'PRJ-2026-001',
      projectName: wp?.projectName || 'PRJ-2026-001',
      factoryId: wp?.factoryId || selectedFactoryId || factories[0]?.id || 'fac-inv-01',
      bayOrLine: taskBayOrLine,
      supervisorName: taskSupervisorName,
      drawingNumber: taskDrawingNo,
      drawingRevision: taskDrawingRev,
      materialBatchCode: taskMaterialBatch,
      plannedQuantity: taskPlannedQty,
      plannedHours: taskPlannedHours,
      unit: taskUnit || wp?.unit || 'Units',
      startDate: taskStartDate,
      targetDate: taskTargetDate,
      assignedWorkerNames: [taskPersonName],
      assignedMachineNames: [taskMachineName],
      assignedWorkflowName: taskWorkflowName,
      predecessorTaskIds: taskPredecessorCode ? [taskPredecessorCode] : [],
      priority: taskPriority
    });
    toast.success('Advanced Task Created & Linked to Project Master QC');
    setShowTaskModal(false);
    setTaskTitle('');
    onRefresh();
  };

  const handleOpenEditCpm = (t: FactoryExecutionTask) => {
    setEditCpmTask(t);
    setCpmStartDate(t.startDate);
    setCpmTargetDate(t.targetDate);
    setCpmPredecessor(t.predecessorTaskIds[0] || '');
    setCpmPerson(t.assignedWorkerNames[0] || hrEmployees[0]?.fullName || 'Roshan Mendis');
    setCpmMachine(t.assignedMachineNames[0] || equipmentAssets[0]?.name || 'Elumatec SBZ 151 CNC');
    setCpmWorkflow(t.assignedWorkflowName || STANDARD_FACTORY_WORKFLOWS[0]);
    setCpmIsCritical(Boolean(t.isCriticalPath));
  };

  const handleSaveCpmUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCpmTask) return;
    factoryExecutionService.updateTaskScheduleAndAssignment(currentUser, editCpmTask.id, {
      startDate: cpmStartDate,
      targetDate: cpmTargetDate,
      predecessorTaskIds: cpmPredecessor ? [cpmPredecessor] : [],
      assignedWorkerNames: [cpmPerson],
      assignedMachineNames: [cpmMachine],
      assignedWorkflowName: cpmWorkflow,
      isCriticalPath: cpmIsCritical
    });
    toast.success('Critical Path & Assignment Updated');
    setEditCpmTask(null);
    onRefresh();
  };

  const handleCreateSubTask = (e: React.FormEvent) => {
    e.preventDefault();
    const targetId = subParentTaskId || filteredTasks[0]?.id;
    if (!targetId || !subTitle.trim()) return;
    factoryExecutionService.addSubTaskToTask(currentUser, targetId, {
      title: `${subTitle.trim()} (${subDrawingRef} · ${subToleranceNote})`,
      assignedPersonName: subPerson,
      assignedMachineName: subMachine,
      workflowName: subWorkflow,
      plannedQty: subPlannedQty,
      unit: subUnit,
      startDate: subStartDate,
      endDate: subEndDate,
      isCriticalPath: subIsCritical
    });
    toast.success('Advanced Sub-Task Added');
    setShowSubTaskModal(false);
    setSubTitle('');
    onRefresh();
  };

  const handleCreatePlanPhase = (e: React.FormEvent) => {
    e.preventDefault();
    const targetWpId = planWpId || workPackages[0]?.id;
    if (!targetWpId || !planPhaseName.trim()) return;
    factoryExecutionService.addExecutionPlanItem(targetWpId, {
      phaseName: `${planPhaseName.trim()} [${planDeliverable} · ${planWeightPct}%]`,
      plannedStart: planStart,
      plannedEnd: planEnd,
      owner: `${planOwner || 'Factory Manager'} (${planGateRequirement})`,
      status: 'Planned'
    });
    toast.success('Advanced Execution Plan Phase Added');
    setShowPlanModal(false);
    setPlanPhaseName('');
    onRefresh();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validation = factoryExecutionService.validateEvidenceFileSize(file);
    if (!validation.valid) {
      setFileSizeError(validation.error || 'File exceeds size limit');
      toast.error(validation.error || 'File exceeds size limit');
      e.target.value = '';
      return;
    }
    setFileSizeError('');
    setCustomFileName(file.name);
    setCustomFileType(validation.mediaKind);
    setSelectedFileSize(`${validation.fileSizeLabel} (${validation.maxLimitLabel})`);
    try {
      const dataUrl = await factoryExecutionService.readFileAsDataUrl(file);
      setUploadedDataUrl(dataUrl);
    } catch {
      setUploadedDataUrl('');
    }
  };

  const handleSaveTaskUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!uploadTaskTarget && !uploadChecklistTarget) || !customFileName.trim() || fileSizeError) return;
    const mediaKind: 'Image' | 'Video' | 'Document' =
      customFileType === 'Video' ? 'Video' : customFileType === 'Document' ? 'Document' : 'Image';
    const dataUrlToSave =
      uploadedDataUrl ||
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=900&q=80';

    if (uploadChecklistTarget) {
      factoryExecutionService.uploadTaskOrSubTaskEvidence(
        currentUser,
        uploadChecklistTarget.targetType,
        uploadChecklistTarget.targetId,
        {
          fileName: customFileName.trim(),
          mediaKind,
          fileSizeLabel: selectedFileSize,
          dataUrl: dataUrlToSave,
          caption: `${docCategory} · ${uploadRemarks}`
        }
      );
    }

    if (uploadTaskTarget) {
      const enrichedCategory = `${docCategory} · Progress: ${uploadProgressPct}% (+${uploadCompletedQtyDelta} ${uploadTaskTarget.unit}) · Ref: ${uploadDrawingRef}`;
      const updatedTask = factoryExecutionService.uploadTaskSupportingDocument(currentUser, uploadTaskTarget.id, {
        fileName: customFileName.trim(),
        fileType: customFileType,
        docCategory: enrichedCategory,
        fileSize: selectedFileSize,
        dataUrl: dataUrlToSave
      });
      if (uploadCompletedQtyDelta > 0) {
        updatedTask.completedQuantity = Math.min(
          updatedTask.plannedQuantity,
          (updatedTask.completedQuantity || 0) + uploadCompletedQtyDelta
        );
      }
      if (viewTaskDetail && viewTaskDetail.id === updatedTask.id) {
        setViewTaskDetail({ ...updatedTask });
      }
    }

    setQcTick(t => t + 1);
    toast.success('Evidence Uploaded Successfully (Verified ≤1MB Image/Doc, ≤5MB Video)');
    setUploadTaskTarget(null);
    setUploadChecklistTarget(null);
    setCustomFileName('');
    setUploadedDataUrl('');
    setFileSizeError('');
    onRefresh();
  };

  const handleOpenEvidenceUploadForTarget = (targetType: 'TASK' | 'SUB_TASK', targetId: string) => {
    const parentTask =
      tasks.find(t => t.id === targetId || (t.subTasks || []).some(st => st.id === targetId)) || tasks[0] || null;
    setUploadTaskTarget(parentTask);
    setUploadChecklistTarget({ targetType, targetId });
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
      factoryExecutionService.rejectTaskOrSubTaskQcByPmOrAdmin(
        currentUser,
        rejectTarget.targetType,
        rejectTarget.targetId,
        {
          reason: rejectReason,
          correctionInstructions: rejectInstructions,
          attachmentFileName: rejectFileName || undefined,
          attachmentFileSize: rejectFileSize || undefined,
          attachmentDataUrl: rejectFileDataUrl || undefined
        }
      );
      setQcTick(t => t + 1);
      if (viewTaskDetail) {
        const refreshedTask = factoryExecutionService.getTasks().find(t => t.id === viewTaskDetail.id);
        if (refreshedTask) setViewTaskDetail({ ...refreshedTask });
      }
      setRejectTarget(null);
      setRejectFileName('');
      setRejectFileSize('');
      setRejectFileDataUrl('');
      onRefresh();
      toast.success('Task/Sub-Task Rejected & Defect Report Issued to Factory Manager');
    } catch (err: any) {
      toast.error(err.message || 'Could not reject checklist');
    }
  };

  const handleSaveChecklistItemModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checklistItemModal) return;
    try {
      if (checklistItemModal.mode === 'add') {
        factoryExecutionService.addTaskOrSubTaskChecklistItem(
          currentUser,
          checklistItemModal.targetType,
          checklistItemModal.targetId,
          {
            category: checklistItemModal.category,
            parameter: checklistItemModal.parameter,
            standardSpecification: checklistItemModal.standardSpecification,
            acceptanceCriteria: checklistItemModal.acceptanceCriteria
          }
        );
        toast.success('Unique Checklist Item Added');
      } else if (checklistItemModal.masterItemId) {
        factoryExecutionService.updateTaskOrSubTaskChecklistItem(
          currentUser,
          checklistItemModal.targetType,
          checklistItemModal.targetId,
          checklistItemModal.masterItemId,
          {
            category: checklistItemModal.category,
            parameter: checklistItemModal.parameter,
            standardSpecification: checklistItemModal.standardSpecification,
            acceptanceCriteria: checklistItemModal.acceptanceCriteria
          }
        );
        toast.success('Unique Checklist Item Updated');
      }
      setQcTick(t => t + 1);
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
      factoryExecutionService.deleteTaskOrSubTaskChecklistItem(
        currentUser,
        targetType,
        targetId,
        masterItemId
      );
      setQcTick(t => t + 1);
      onRefresh();
      toast.success('Checklist Item Deleted');
    } catch (err: any) {
      toast.error(err.message || 'Only Admin or Project Manager can delete checklist items.');
    }
  };

  const handleWorkflowAction = (
    task: FactoryExecutionTask,
    action: 'start_progress' | 'submit_qc' | 'approve_qc' | 'request_rework' | 'complete_task' | 'dispatch_task'
  ) => {
    try {
      if (action === 'approve_qc' && !canApproveQc) {
        toast.error('Only Project Manager or Admin can approve Task Quality Inspections.');
        return;
      }
      if (action === 'submit_qc') {
        const qcState = factoryExecutionService.getTaskOrSubTaskQcState('TASK', task.id);
        if ((qcState.evidenceAttachments || []).length === 0 && (task.supportingDocuments || []).length === 0) {
          toast.error('Upload at least one evidence (Document/Image ≤1MB or Video ≤5MB) before checking or approving.');
          handleOpenEvidenceUploadForTarget('TASK', task.id);
          return;
        }
        factoryExecutionService.runAndUploadFactoryManagerQcInspection(currentUser, 'TASK', task.id);
      }
      const updated = factoryExecutionService.advanceTaskSupervisorWorkflow(currentUser, task.id, action);
      if (viewTaskDetail && viewTaskDetail.id === updated.id) {
        setViewTaskDetail({ ...updated });
      }
      setQcTick(t => t + 1);
      toast.success(
        action === 'submit_qc'
          ? 'Factory Manager Master QC Checklist Checked & Approved — Pending PM/Admin Approval'
          : action === 'approve_qc'
          ? 'Quality Inspection Approved by Project Manager / Admin'
          : 'Updated'
      );
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || 'Blocked');
    }
  };

  const handleFmCheckAllAndUploadQc = (
    targetType: 'TASK' | 'SUB_TASK',
    targetId: string,
    uploadedFileName?: string
  ) => {
    if (!isFmAccount) {
      toast.error('Only Factory Manager / Supervisor can run and upload QC checklists.');
      return;
    }
    const qcState = factoryExecutionService.getTaskOrSubTaskQcState(targetType, targetId);
    if ((qcState.evidenceAttachments || []).length === 0) {
      toast.error('Mandatory: Please upload at least one evidence (Image/Document ≤1MB or Video ≤5MB) before checking or approving.');
      handleOpenEvidenceUploadForTarget(targetType, targetId);
      return;
    }
    try {
      const state = factoryExecutionService.runAndUploadFactoryManagerQcInspection(
        currentUser,
        targetType,
        targetId,
        uploadedFileName
      );
      setQcTick(t => t + 1);
      if (viewTaskDetail) {
        const refreshedTask = factoryExecutionService.getTasks().find(t => t.id === viewTaskDetail.id);
        if (refreshedTask) setViewTaskDetail({ ...refreshedTask });
      }
      onRefresh();
      toast.success(
        `Checked & approved by Factory Manager (${state.systemChecklistUploadedFileName})`
      );
    } catch (err: any) {
      toast.error(err.message || 'Please upload evidence first.');
    }
  };

  const handlePmOrAdminApproveQc = (targetType: 'TASK' | 'SUB_TASK', targetId: string) => {
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
      setQcTick(t => t + 1);
      if (viewTaskDetail) {
        const refreshedTask = factoryExecutionService.getTasks().find(t => t.id === viewTaskDetail.id);
        if (refreshedTask) setViewTaskDetail({ ...refreshedTask });
      }
      onRefresh();
      toast.success(
        `QC Approved by ${state.approvedByName} (ID: ${state.approvedByUserId}) on ${state.approvedAt}`
      );
    } catch (err: any) {
      toast.error(err.message || 'Only Project Manager or Admin can approve QC');
    }
  };

  if (mode === 'work_packages') {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-slate-200/80 px-4 py-2.5 shadow-2xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1">
            <Briefcase className="w-4 h-4 text-orange-500 shrink-0" />
            <h2 className="text-xs font-bold text-slate-800 whitespace-nowrap">
              Project Hub ({filteredWps.length})
            </h2>
            <div className="relative min-w-[200px] flex-1 max-w-xs ml-2">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search assigned projects..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <button
            onClick={() => {
              if (selectedFactoryId) setWpFactoryId(selectedFactoryId);
              setShowWpModal(true);
            }}
            className="px-3.5 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Assign
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredWps.map(wp => {
            const wpTasks = tasks.filter(
              t => t.workPackageId === wp.id || (t.factoryId === wp.factoryId && t.projectId === wp.projectId)
            );
            const linkedProj = projects.find(p => p.id === wp.projectId || p.projectName === wp.projectName);
            const locationText = wp.siteAddress || linkedProj?.siteAddress || wp.factoryName;
            const badgeCount = Math.max(1, wpTasks.length);

            return (
              <div
                key={wp.id}
                onClick={() => onSelectProject?.(wp.factoryId, wp.projectId, true)}
                className="relative bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col justify-between gap-4 hover:border-orange-400 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-orange-600">
                      {wp.projectCode || wp.packageCode}
                    </span>

                    <span
                      title={`${badgeCount} project tasks / updates`}
                      className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-red-600 text-white text-[11px] font-bold shadow-xs"
                    >
                      {badgeCount}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-orange-600 transition-colors truncate">
                    {wp.projectName}
                  </h3>

                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                    <span className="truncate font-medium">{locationText}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center gap-2" onClick={e => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => onSelectProject?.(wp.factoryId, wp.projectId, true)}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold flex items-center justify-center gap-1 shadow-2xs transition-colors"
                  >
                    <span>Open</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTaskWpId(wp.id);
                      setShowTaskModal(true);
                    }}
                    className="py-1.5 px-3 rounded-lg bg-sky-50 hover:bg-sky-100 border border-sky-200/80 text-sky-700 text-xs font-semibold transition-colors"
                  >
                    Task
                  </button>
                  <button
                    type="button"
                    onClick={() => setDocSpec(buildWorkPackageDocSpec(wp))}
                    className="py-1.5 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                    title="Print / Document / Approve"
                  >
                    <Printer className="w-3.5 h-3.5 text-orange-500" />
                    Doc
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {showWpModal && typeof document !== 'undefined' && createPortal(
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
            <div className="px-6 py-4 border-b border-slate-200 bg-white text-slate-900 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Assign Project & Create Advanced Factory Work Package
                </h3>
                <p className="text-[11px] text-slate-500">
                  Complete project assignment, contract governance, BOQ scope, budget, QC standard, and delivery schedule
                </p>
              </div>
              <button
                onClick={() => setShowWpModal(false)}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
              >
                Exit
              </button>
            </div>
            <form onSubmit={handleCreateWorkPackage} className="flex-1 p-6 space-y-4 overflow-y-auto text-xs w-full max-w-6xl mx-auto">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="text-[11px] font-bold text-orange-600 uppercase tracking-wider">
                    1. Project, Factory & Contract Governance
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Target Factory</label>
                      <select
                        value={selectedFactoryId || wpFactoryId}
                        onChange={e => setWpFactoryId(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                      >
                        {factories.map(f => (
                          <option key={f.id} value={f.id}>
                            {f.factoryCode} — {f.name} ({f.ownershipType})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Project to Assign</label>
                      <select
                        value={wpProjectId}
                        onChange={e => setWpProjectId(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                      >
                        {projects.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.projectCode || p.id} — {p.projectName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Execution & Resource Contract</label>
                      <select
                        value={wpContractType}
                        onChange={e => setWpContractType(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                      >
                        <option value="In-House Full Execution">In-House Full Execution (Own Factory + Materials)</option>
                        <option value="Partnered Factory — Free-Issue Materials">Partnered Factory — Free-Issue Materials & Overheads</option>
                        <option value="Subcontract Fabrication Only">Subcontract Fabrication Only (Labor & Machinery)</option>
                        <option value="Turnkey Supply & Fabrication">Turnkey Supply, Fabrication & Site Dispatch</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">Work Package Title</label>
                      <input
                        type="text"
                        required
                        value={wpTitle}
                        onChange={e => setWpTitle(e.target.value)}
                        placeholder="e.g., Unitized Curtain Wall & Louver Fabrication Package"
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Priority Level</label>
                      <select
                        value={wpPriority}
                        onChange={e => setWpPriority(e.target.value as any)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                      >
                        <option value="Critical">Critical (Fast-Track)</option>
                        <option value="High">High Priority</option>
                        <option value="Standard">Standard Schedule</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Detailed Engineering & Fabrication Scope Description
                    </label>
                    <textarea
                      rows={2}
                      value={wpScopeDesc}
                      onChange={e => setWpScopeDesc(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="text-[11px] font-bold text-orange-600 uppercase tracking-wider">
                    2. Quantities, Commercial Budget & Schedule
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Planned Quantity</label>
                      <input
                        type="number"
                        value={wpPlannedQty}
                        onChange={e => setWpPlannedQty(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Unit of Measure</label>
                      <input
                        type="text"
                        value={wpUnit}
                        onChange={e => setWpUnit(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Budgeted Value (LKR)</label>
                      <input
                        type="number"
                        value={wpBudgetedValue}
                        onChange={e => setWpBudgetedValue(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Planned Start Date</label>
                      <input
                        type="date"
                        value={wpStartDate}
                        onChange={e => setWpStartDate(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Target Deadline</label>
                      <input
                        type="date"
                        value={wpDeadline}
                        onChange={e => setWpDeadline(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="text-[11px] font-bold text-orange-600 uppercase tracking-wider">
                    3. Engineering Lead, Master QC Standard & Site Delivery
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Lead Project / Factory Engineer</label>
                      <input
                        type="text"
                        value={wpLeadEngineer}
                        onChange={e => setWpLeadEngineer(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Master QC Inspection Standard</label>
                      <input
                        type="text"
                        value={wpQcStandard}
                        onChange={e => setWpQcStandard(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Site Dispatch & Delivery Terms</label>
                      <input
                        type="text"
                        value={wpDeliveryTerms}
                        onChange={e => setWpDeliveryTerms(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowWpModal(false)}
                    className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700"
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
          </div>,
          document.body
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
  }

  // TASKS, SUB-TASKS, WORKFLOWS & CRITICAL PATH MODE (Compact 4-5 Column Rows + View Button)
  const criticalTasksCount = filteredTasks.filter(t => t.isCriticalPath).length;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200/80 px-4 py-2.5 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1">
            <button
              onClick={() => setTaskSubMode('tasks')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                taskSubMode === 'tasks'
                  ? 'bg-white text-orange-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              Tasks ({filteredTasks.length})
            </button>
            <button
              onClick={() => setTaskSubMode('critical_path')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                taskSubMode === 'critical_path'
                  ? 'bg-white text-orange-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" />
              Schedule ({criticalTasksCount})
            </button>
            <button
              onClick={() => setTaskSubMode('sub_tasks')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                taskSubMode === 'sub_tasks'
                  ? 'bg-white text-orange-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Sub-Tasks ({allSubTasks.length})
            </button>
            <button
              onClick={() => {
                setTaskSubMode('qc_checklists');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                taskSubMode === 'qc_checklists'
                  ? 'bg-white text-orange-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              Checklists ({filteredTasks.length + allSubTasks.length})
            </button>
          </div>

          <div className="relative min-w-[180px] flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search tasks, workflows..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500"
            />
          </div>

          <select
            value={stageFilter}
            onChange={e => setStageFilter(e.target.value)}
            className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 font-medium text-slate-700"
          >
            <option value="ALL">All ({tasks.length})</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">Active</option>
            <option value="Submitted for Inspection">Quality</option>
            <option value="Approved">Approved</option>
            <option value="Completed">Completed</option>
            <option value="Dispatched">Dispatched</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setPlanWpId(workPackages[0]?.id || '');
              setShowPlanModal(true);
            }}
            className="px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 border border-sky-200/80 text-sky-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Calendar className="w-3.5 h-3.5" />
            Plan
          </button>
          <button
            onClick={() => {
              setSubParentTaskId(filteredTasks[0]?.id || '');
              setShowSubTaskModal(true);
            }}
            className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 text-indigo-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Layers className="w-3.5 h-3.5" />
            Sub-Task
          </button>
          <button
            onClick={() => {
              setTaskWpId(workPackages[0]?.id || 'fwp-01');
              setShowTaskModal(true);
            }}
            className="px-3.5 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Task
          </button>
        </div>
      </div>

      {/* Plan Phases List View (Compact Row per Phase) */}
      {taskSubMode === 'tasks' && workPackages.length > 0 && (workPackages[0]?.executionPlan || []).length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900">
              Timeline Plan — {workPackages[0]?.projectName}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-semibold text-slate-400">
                  <th className="py-2 px-4">Phase</th>
                  <th className="py-2 px-4">Schedule</th>
                  <th className="py-2 px-4">Owner</th>
                  <th className="py-2 px-4">Status</th>
                  {hasManageAccess && <th className="py-2 px-4 text-right">Update</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {(workPackages[0]?.executionPlan || []).map(phase => (
                  <tr key={phase.id} className="hover:bg-slate-50/70">
                    <td className="py-2 px-4 font-bold text-slate-900 whitespace-nowrap">{phase.phaseName}</td>
                    <td className="py-2 px-4 font-mono text-slate-600 whitespace-nowrap">
                      {phase.plannedStart} → {phase.plannedEnd}
                    </td>
                    <td className="py-2 px-4 text-slate-600 whitespace-nowrap">{phase.owner}</td>
                    <td className="py-2 px-4 font-semibold text-sky-700 whitespace-nowrap">{phase.status}</td>
                    {hasManageAccess && (
                      <td className="py-2 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          {(['Planned', 'Progressing', 'Quality Check', 'Completed'] as const).map(st => (
                            <button
                              key={st}
                              onClick={() => {
                                factoryExecutionService.updateExecutionPlanItemStatus(workPackages[0].id, phase.id, st);
                                onRefresh();
                              }}
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                phase.status === st
                                  ? 'bg-orange-500 text-white'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {st === 'Quality Check' ? 'Quality' : st}
                            </button>
                          ))}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 1. TASKS VIEW (Few Details in Row + View Button for Full Details & Media) */}
      {taskSubMode === 'tasks' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-semibold text-slate-400">
                  <th className="py-2.5 px-4">Code</th>
                  <th className="py-2.5 px-4">Task</th>
                  <th className="py-2.5 px-4">Assigned To</th>
                  <th className="py-2.5 px-4 text-right">Progress</th>
                  <th className="py-2.5 px-4">Stage</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredTasks.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-4 font-mono font-bold text-orange-600 whitespace-nowrap">
                      {t.taskCode}
                    </td>
                    <td className="py-2.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                      {t.title}
                      {t.isCriticalPath && (
                        <span className="ml-2 text-[10px] font-semibold text-red-600">· Critical</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600 whitespace-nowrap">
                      {t.assignedWorkerNames[0] || t.supervisorName} · {t.assignedMachineNames[0] || 'Bay 01'}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-semibold text-sky-700 whitespace-nowrap">
                      {t.completedQuantity}/{t.plannedQuantity} {t.unit}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-slate-700 whitespace-nowrap">
                      {t.stageStatus}
                    </td>
                    <td className="py-2.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditTask(t)}
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold inline-flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3 text-sky-600" />
                          Edit
                        </button>
                        <button
                          onClick={() => setDocSpec(buildTaskDocSpec(t))}
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold inline-flex items-center gap-1"
                        >
                          <Printer className="w-3 h-3 text-orange-500" />
                          Doc
                        </button>
                        <button
                          onClick={() => setViewTaskDetail(t)}
                          className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold inline-flex items-center gap-1"
                        >
                          <Maximize2 className="w-3 h-3" />
                          Fullscreen
                        </button>
                        <button
                          onClick={() => setActiveQcChecklistModal({ targetType: 'TASK', targetId: t.id })}
                          className="px-2 py-1 rounded bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-[11px] font-semibold inline-flex items-center gap-1"
                        >
                          <CheckSquare className="w-3 h-3" />
                          Checklist
                        </button>
                        <button
                          onClick={() => handleOpenEditCpm(t)}
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold inline-flex items-center gap-1"
                        >
                          <Sliders className="w-3 h-3" />
                          Assign
                        </button>
                        {isFmAccount && (
                          <button
                            onClick={() => setUploadTaskTarget(t)}
                            className="px-2 py-1 rounded bg-sky-50 hover:bg-sky-100 text-sky-700 text-[11px] font-semibold inline-flex items-center gap-1"
                          >
                            <Upload className="w-3 h-3" />
                            Upload
                          </button>
                        )}
                        {isFmAccount && t.stageStatus === 'Assigned' && (
                          <button
                            onClick={() => handleWorkflowAction(t, 'start_progress')}
                            className="px-2.5 py-1 rounded bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-semibold"
                          >
                            Start
                          </button>
                        )}
                        {isFmAccount && t.stageStatus === 'In Progress' && (
                          <button
                            onClick={() => handleWorkflowAction(t, 'submit_qc')}
                            className="px-2.5 py-1 rounded bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-semibold"
                          >
                            Check
                          </button>
                        )}
                        {canApproveQc && t.stageStatus === 'Submitted for Inspection' && (
                          <button
                            onClick={() => handleWorkflowAction(t, 'approve_qc')}
                            className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold"
                          >
                            Approve
                          </button>
                        )}
                        {isFmAccount && t.stageStatus === 'Approved' && (
                          <button
                            onClick={() => handleWorkflowAction(t, 'complete_task')}
                            className="px-2.5 py-1 rounded bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-semibold"
                          >
                            Done
                          </button>
                        )}
                        {isFmAccount && t.stageStatus === 'Completed' && (
                          <button
                            onClick={() => handleWorkflowAction(t, 'dispatch_task')}
                            className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold"
                          >
                            Dispatch
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteTask(t)}
                          className="p-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                          title="Delete Task"
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

      {/* 2. TIMELINE & CRITICAL PATH (CPM) VIEW WITH INTERACTIVE GANTT CHART */}
      {taskSubMode === 'critical_path' && (
        <div className="space-y-4">
          {/* Interactive Critical Path Gantt Chart */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 bg-slate-50/70">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-orange-600" />
                <span className="text-xs font-bold text-slate-900">
                  Critical Path Gantt Chart & Dependency Schedule
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-[11px] font-semibold">
                <span className="inline-flex items-center gap-1.5 text-red-700">
                  <span className="w-3 h-3 rounded-xs bg-gradient-to-r from-red-600 to-orange-500 inline-block" />
                  Critical Path (0d Float)
                </span>
                <span className="inline-flex items-center gap-1.5 text-sky-700">
                  <span className="w-3 h-3 rounded-xs bg-gradient-to-r from-sky-600 to-emerald-500 inline-block" />
                  Standard Task
                </span>
                <span className="inline-flex items-center gap-1.5 text-slate-500">
                  <span className="w-3 h-2 rounded-xs bg-amber-200 border border-amber-400 border-dashed inline-block" />
                  Float / Slack Window
                </span>
              </div>
            </div>

            {(() => {
              const parseMs = (d?: string) => {
                const ms = d ? new Date(d).getTime() : NaN;
                return Number.isNaN(ms) ? Date.now() : ms;
              };
              const allStartMs = filteredTasks.map(t => parseMs(t.startDate));
              const allEndMs = filteredTasks.map(t =>
                Math.max(parseMs(t.targetDate), parseMs(t.startDate) + 86400000 * Math.max(1, t.durationDays || 7))
              );
              const minMs = allStartMs.length > 0 ? Math.min(...allStartMs) : Date.now();
              const maxMsRaw = allEndMs.length > 0 ? Math.max(...allEndMs) : minMs + 86400000 * 30;
              const totalSpanMs = Math.max(86400000 * 14, maxMsRaw - minMs + 86400000 * 4);
              const totalDays = Math.max(14, Math.ceil(totalSpanMs / 86400000));

              const scaleTicks = Array.from({ length: 8 }, (_, idx) => {
                const ratio = idx / 7;
                const d = new Date(minMs + ratio * totalSpanMs);
                const dayNum = Math.round(ratio * totalDays);
                return {
                  label: d.toISOString().slice(5, 10),
                  dayLabel: `D${dayNum}`
                };
              });

              return (
                <div className="p-4 overflow-x-auto">
                  <div className="min-w-[820px] space-y-2">
                    {/* Gantt Timeline Header Scale */}
                    <div className="grid grid-cols-12 gap-3 pb-2 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase">
                      <div className="col-span-4">Task / Sub-Task & Predecessor</div>
                      <div className="col-span-8">
                        <div className="flex items-center justify-between px-1">
                          {scaleTicks.map((tk, i) => (
                            <div key={i} className="text-center">
                              <div className="text-slate-700 font-mono">{tk.dayLabel}</div>
                              <div className="text-[9px] text-slate-400 font-mono">{tk.label}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Gantt Task & Sub-Task Bars */}
                    {filteredTasks.map(t => {
                      const sMs = parseMs(t.startDate);
                      const eMs = Math.max(
                        sMs + 86400000,
                        parseMs(t.targetDate)
                      );
                      const leftPct = Math.max(0, Math.min(88, ((sMs - minMs) / totalSpanMs) * 100));
                      const widthPct = Math.max(8, Math.min(100 - leftPct, ((eMs - sMs) / totalSpanMs) * 100));
                      const floatDays = t.isCriticalPath ? 0 : Math.max(2, t.floatDays ?? 3);
                      const floatWidthPct = Math.min(
                        100 - (leftPct + widthPct),
                        (floatDays / totalDays) * 100
                      );
                      const progressPct = Math.min(
                        100,
                        Math.round((t.completedQuantity / Math.max(1, t.plannedQuantity)) * 100)
                      );

                      return (
                        <div key={t.id} className="space-y-1.5 py-1.5 border-b border-slate-100 last:border-b-0">
                          <div className="grid grid-cols-12 gap-3 items-center">
                            <div className="col-span-4 flex items-center justify-between gap-2 pr-2">
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono text-[11px] font-bold text-orange-600">
                                    {t.taskCode}
                                  </span>
                                  {t.isCriticalPath && (
                                    <span className="px-1.5 py-0.5 rounded bg-red-50 text-red-600 border border-red-200 text-[9px] font-bold">
                                      CRITICAL
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs font-bold text-slate-900 truncate">{t.title}</div>
                                <div className="text-[10px] text-slate-500 font-mono">
                                  {t.predecessorTaskIds.length > 0
                                    ? `Pred: ${t.predecessorTaskIds.join(', ')}`
                                    : 'Start Node'}{' '}
                                  · {t.startDate} → {t.targetDate}
                                </div>
                              </div>
                              <button
                                onClick={() => setViewTaskDetail(t)}
                                className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-semibold shrink-0"
                              >
                                Fullscreen
                              </button>
                            </div>

                            {/* Gantt Bar Track */}
                            <div className="col-span-8 relative h-9 bg-slate-50 rounded-xl border border-slate-200/80 overflow-hidden flex items-center">
                              {/* Vertical Grid Lines */}
                              <div className="absolute inset-0 grid grid-cols-7 pointer-events-none">
                                {Array.from({ length: 7 }).map((_, idx) => (
                                  <div key={idx} className="border-r border-slate-200/50 h-full" />
                                ))}
                              </div>

                              {/* Task Gantt Bar */}
                              <div
                                onClick={() => setViewTaskDetail(t)}
                                style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                                className={`absolute h-6 rounded-lg shadow-xs cursor-pointer flex items-center justify-between px-2 text-[10px] font-bold text-white transition-all hover:brightness-110 ${
                                  t.isCriticalPath
                                    ? 'bg-gradient-to-r from-red-600 to-orange-500 ring-1 ring-red-700/30'
                                    : 'bg-gradient-to-r from-sky-600 to-emerald-500 ring-1 ring-sky-700/30'
                                }`}
                                title={`${t.taskCode} — ${t.title} (${t.startDate} to ${t.targetDate}) | Progress: ${progressPct}%`}
                              >
                                <span className="truncate">
                                  {t.taskCode} ({progressPct}%)
                                </span>
                                <span className="font-mono text-[9px] opacity-90 ml-1 shrink-0">
                                  {t.durationDays || 7}d
                                </span>
                              </div>

                              {/* Float / Slack Bar if non-critical */}
                              {!t.isCriticalPath && floatWidthPct > 1 && (
                                <div
                                  style={{
                                    left: `${leftPct + widthPct}%`,
                                    width: `${floatWidthPct}%`
                                  }}
                                  className="absolute h-4 rounded-r-md bg-amber-100/90 border border-dashed border-amber-400 flex items-center justify-center text-[9px] font-mono font-bold text-amber-800"
                                  title={`Float / Slack: +${floatDays} days`}
                                >
                                  +{floatDays}d Float
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Sub-Task Child Gantt Bars */}
                          {(t.subTasks || []).map(st => {
                            const stStartMs = parseMs(st.startDate || t.startDate);
                            const stEndMs = Math.max(
                              stStartMs + 86400000,
                              parseMs(st.endDate || t.targetDate)
                            );
                            const stLeftPct = Math.max(
                              0,
                              Math.min(90, ((stStartMs - minMs) / totalSpanMs) * 100)
                            );
                            const stWidthPct = Math.max(
                              6,
                              Math.min(100 - stLeftPct, ((stEndMs - stStartMs) / totalSpanMs) * 100)
                            );
                            return (
                              <div key={st.id} className="grid grid-cols-12 gap-3 items-center pl-4">
                                <div className="col-span-4 flex items-center justify-between gap-2 pr-2">
                                  <div className="min-w-0">
                                    <span className="font-mono text-[10px] font-bold text-slate-500">
                                      ↳ {st.subTaskCode}
                                    </span>{' '}
                                    <span className="text-[11px] font-semibold text-slate-700 truncate">
                                      {st.title}
                                    </span>
                                  </div>
                                  <span className="text-[9px] font-mono text-slate-400 shrink-0">
                                    {st.status}
                                  </span>
                                </div>
                                <div className="col-span-8 relative h-6 bg-slate-50/60 rounded-lg border border-slate-100 overflow-hidden flex items-center">
                                  <div
                                    style={{ left: `${stLeftPct}%`, width: `${stWidthPct}%` }}
                                    className={`absolute h-4 rounded px-1.5 flex items-center justify-between text-[9px] font-semibold text-white ${
                                      st.isCriticalPath
                                        ? 'bg-orange-500/90'
                                        : 'bg-sky-500/85'
                                    }`}
                                  >
                                    <span className="truncate">{st.subTaskCode}</span>
                                    <span>
                                      {st.completedQty}/{st.plannedQty}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Critical Path Schedule Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-semibold text-slate-400">
                    <th className="py-2.5 px-4">Code</th>
                    <th className="py-2.5 px-4">Task</th>
                    <th className="py-2.5 px-4">Predecessor</th>
                    <th className="py-2.5 px-4">Timeline</th>
                    <th className="py-2.5 px-4">CPM Status</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredTasks.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-4 font-mono font-bold text-orange-600 whitespace-nowrap">{t.taskCode}</td>
                      <td className="py-2.5 px-4 font-bold text-slate-900 whitespace-nowrap">{t.title}</td>
                      <td className="py-2.5 px-4 font-mono text-slate-600 whitespace-nowrap">
                        {t.predecessorTaskIds.length > 0 ? t.predecessorTaskIds.join(', ') : 'Start Node'}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-slate-600 whitespace-nowrap">
                        {t.startDate} → {t.targetDate} ({t.durationDays || 7}d · Float {t.floatDays ?? 0}d)
                      </td>
                      <td className="py-2.5 px-4 font-semibold whitespace-nowrap">
                        <span className={t.isCriticalPath ? 'text-red-600' : 'text-emerald-600'}>
                          {t.isCriticalPath ? 'Critical Path' : 'Standard Float'}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => setDocSpec(buildTaskDocSpec(t))}
                            className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold inline-flex items-center gap-1"
                          >
                            <Printer className="w-3 h-3 text-orange-500" /> Doc
                          </button>
                          <button
                            onClick={() => setViewTaskDetail(t)}
                            className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold inline-flex items-center gap-1"
                          >
                            <Maximize2 className="w-3 h-3" />
                            Fullscreen
                          </button>
                          <button
                            onClick={() => handleOpenEditCpm(t)}
                            className="px-2.5 py-1 rounded bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-700 text-[11px] font-semibold"
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. SUB-TASKS VIEW (Compact Row + View Parent Details) */}
      {taskSubMode === 'sub_tasks' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-semibold text-slate-400">
                  <th className="py-2.5 px-4">Sub Code</th>
                  <th className="py-2.5 px-4">Sub-Task</th>
                  <th className="py-2.5 px-4">Person & Machine</th>
                  <th className="py-2.5 px-4 text-right">Qty</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {allSubTasks.map(({ parentTask, sub }) => (
                  <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-4 font-mono font-bold text-orange-600 whitespace-nowrap">{sub.subTaskCode}</td>
                    <td className="py-2.5 px-4 font-bold text-slate-900 whitespace-nowrap">{sub.title}</td>
                    <td className="py-2.5 px-4 text-slate-600 whitespace-nowrap">
                      {sub.assignedPersonName} · {sub.assignedMachineName}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-semibold text-sky-700 whitespace-nowrap">
                      {sub.completedQty}/{sub.plannedQty} {sub.unit}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-emerald-700 whitespace-nowrap">{sub.status}</td>
                    <td className="py-2.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => setDocSpec(buildSubTaskDocSpec(sub, parentTask.taskCode))}
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold inline-flex items-center gap-1"
                        >
                          <Printer className="w-3 h-3 text-orange-500" /> Doc
                        </button>
                        <button
                          onClick={() => setViewTaskDetail(parentTask)}
                          className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-semibold inline-flex items-center gap-1"
                        >
                          <Maximize2 className="w-3 h-3" /> View
                        </button>
                        <button
                          onClick={() => setActiveQcChecklistModal({ targetType: 'SUB_TASK', targetId: sub.id })}
                          className="px-2 py-1 rounded bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-[10px] font-semibold inline-flex items-center gap-1"
                        >
                          <CheckSquare className="w-3 h-3" />
                          Fullscreen
                        </button>
                        {isFmAccount && (
                          <button
                            onClick={() => handleFmCheckAllAndUploadQc('SUB_TASK', sub.id)}
                            className="px-2 py-1 rounded bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 text-[10px] font-semibold"
                          >
                            Check
                          </button>
                        )}
                        {canApproveQc && (
                          <button
                            onClick={() => handlePmOrAdminApproveQc('SUB_TASK', sub.id)}
                            className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-semibold"
                          >
                            Approve
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteSubTask(sub.id, sub.title)}
                          className="p-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                          title="Delete Sub-Task"
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

      {/* 4. PROJECT MASTER QC CHECKLISTS (SINGLE-LINE ROWS, SIMPLE WORDS, 1-WORD BUTTONS, SYSTEM-WIDE FIXED FULLSCREEN) */}
      {taskSubMode === 'qc_checklists' && (() => {
        const simpleStatus = (st: string) => {
          if (st.includes('Rejected')) return 'Rejected';
          if (st.includes('Approved')) return 'Approved';
          if (st.includes('Submitted')) return 'Uploaded';
          if (st.includes('Progress')) return 'Checking';
          return 'Pending';
        };
        const checklistDirectoryContent = (
          <div
            className={
              fullScreenAllChecklists
                ? 'fixed inset-0 bg-white flex flex-col overflow-hidden'
                : 'bg-white rounded-2xl border border-slate-200/80 shadow-xs w-full overflow-hidden flex flex-col'
            }
            style={
              fullScreenAllChecklists
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
            data-qc-tick={qcTick}
          >
            <div className="px-5 py-3 border-b border-slate-200 bg-white text-slate-900 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-slate-900">
                  Checklists ({filteredTasks.length + allSubTasks.length})
                </span>
                <span className="text-xs text-slate-500">
                  {isFmAccount
                    ? 'Factory Manager View (Upload Evidence → Check & Approve)'
                    : 'PM / Admin View (Edit Unique Items · View Evidence · Approve or Reject)'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {isFmAccount && filteredTasks[0] && (
                  <button
                    onClick={() => handleOpenEvidenceUploadForTarget('TASK', filteredTasks[0].id)}
                    className="px-3.5 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Upload
                  </button>
                )}
                <button
                  onClick={() => setFullScreenAllChecklists(prev => !prev)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer ${
                    fullScreenAllChecklists
                      ? 'bg-rose-600 hover:bg-rose-500 text-white'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  {fullScreenAllChecklists ? (
                    <>
                      <X className="w-3.5 h-3.5" />
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
            <div className={fullScreenAllChecklists ? 'flex-1 overflow-auto p-4 w-full' : 'w-full overflow-x-auto'}>
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
                  {filteredTasks.map(t => {
                    const tQc = factoryExecutionService.getTaskOrSubTaskQcState('TASK', t.id);
                    const tCheckedCount = tQc.checklistItems.filter(i => i.checked).length;
                    const tEvCount = (tQc.evidenceAttachments || []).length;
                    const stWord = simpleStatus(tQc.qcStatus);
                    return (
                      <React.Fragment key={t.id}>
                        <tr className="hover:bg-slate-50/80 bg-white">
                          <td className="py-2 px-4 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-200 text-[10px] font-bold">
                              Task
                            </span>
                          </td>
                          <td className="py-2 px-4 font-mono font-bold text-orange-600 whitespace-nowrap">{t.taskCode}</td>
                          <td className="py-2 px-4 font-bold text-slate-900 whitespace-nowrap max-w-[260px] truncate">{t.title}</td>
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
                            {tCheckedCount}/{tQc.checklistItems.length}
                          </td>
                          <td className="py-2 px-4 whitespace-nowrap">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                stWord === 'Approved'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : stWord === 'Rejected'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : stWord === 'Uploaded'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-slate-100 text-slate-600 border-slate-200'
                              }`}
                            >
                              {stWord}
                            </span>
                          </td>
                          <td className="py-2 px-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center justify-end gap-1.5">
                              {tQc.latestDefectReport && (
                                <button
                                  onClick={() => factoryExecutionService.downloadDefectReport(tQc.latestDefectReport!)}
                                  className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-semibold inline-flex items-center gap-1"
                                  title="Download Defect Report & Correction Instructions"
                                >
                                  <Download className="w-3 h-3" />
                                  Defect
                                </button>
                              )}
                              {isFmAccount && (
                                <button
                                  onClick={() => handleOpenEvidenceUploadForTarget('TASK', t.id)}
                                  className="px-2.5 py-1 rounded bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-700 text-[11px] font-semibold inline-flex items-center gap-1"
                                >
                                  <Upload className="w-3 h-3" />
                                  Upload
                                </button>
                              )}
                              {isFmAccount && (
                                <button
                                  onClick={() => handleFmCheckAllAndUploadQc('TASK', t.id)}
                                  title={
                                    tEvCount === 0
                                      ? 'Upload at least 1 evidence before checking/approving'
                                      : 'Check & Approve as Factory Manager'
                                  }
                                  className={`px-2.5 py-1 rounded text-[11px] font-semibold inline-flex items-center gap-1 ${
                                    tEvCount === 0
                                      ? 'bg-slate-100 text-slate-500 border border-slate-200'
                                      : 'bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700'
                                  }`}
                                >
                                  <CheckSquare className="w-3 h-3" />
                                  Check
                                </button>
                              )}
                              {canApproveQc && (
                                <>
                                  <button
                                    onClick={() => handlePmOrAdminApproveQc('TASK', t.id)}
                                    disabled={!tQc.factoryManagerApproval?.isApproved}
                                    title={
                                      !tQc.factoryManagerApproval?.isApproved
                                        ? '1st Step Required: Factory Manager must upload evidence and check/approve first'
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
                                    title={
                                      !tQc.factoryManagerApproval?.isApproved
                                        ? 'Factory Manager must submit 1st step before Reject'
                                        : 'Reject & Issue Defect Report'
                                    }
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
                                className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                                title="Download or Print Task Checklist as PDF"
                              >
                                <Printer className="w-3 h-3 text-orange-500" />
                                Doc
                              </button>
                              <button
                                onClick={() => setActiveQcChecklistModal({ targetType: 'TASK', targetId: t.id })}
                                className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold inline-flex items-center gap-1"
                              >
                                <Maximize2 className="w-3 h-3" />
                                Fullscreen
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Sub-Tasks under this Task */}
                        {(t.subTasks || []).map(st => {
                          const sQc = factoryExecutionService.getTaskOrSubTaskQcState('SUB_TASK', st.id);
                          const sCheckedCount = sQc.checklistItems.filter(i => i.checked).length;
                          const sEvCount = (sQc.evidenceAttachments || []).length;
                          const subWord = simpleStatus(sQc.qcStatus);
                          return (
                            <tr key={st.id} className="hover:bg-slate-50/70 bg-slate-50/30">
                              <td className="py-2 px-4 whitespace-nowrap">
                                <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">
                                  Sub-Task
                                </span>
                              </td>
                              <td className="py-2 px-4 font-mono font-bold text-slate-700 whitespace-nowrap">{st.subTaskCode}</td>
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
                                {sCheckedCount}/{sQc.checklistItems.length}
                              </td>
                              <td className="py-2 px-4 whitespace-nowrap">
                                <span
                                  className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                    subWord === 'Approved'
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : subWord === 'Rejected'
                                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                                      : subWord === 'Uploaded'
                                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                                      : 'bg-slate-100 text-slate-600 border-slate-200'
                                  }`}
                                >
                                  {subWord}
                                </span>
                              </td>
                              <td className="py-2 px-4 text-right whitespace-nowrap">
                                <div className="inline-flex items-center justify-end gap-1.5">
                                  {sQc.latestDefectReport && (
                                    <button
                                      onClick={() => factoryExecutionService.downloadDefectReport(sQc.latestDefectReport!)}
                                      className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-semibold inline-flex items-center gap-1"
                                      title="Download Defect Report & Correction Instructions"
                                    >
                                      <Download className="w-3 h-3" />
                                      Defect
                                    </button>
                                  )}
                                  {isFmAccount && (
                                    <button
                                      onClick={() => handleOpenEvidenceUploadForTarget('SUB_TASK', st.id)}
                                      className="px-2.5 py-1 rounded bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-700 text-[11px] font-semibold inline-flex items-center gap-1"
                                    >
                                      <Upload className="w-3 h-3" />
                                      Upload
                                    </button>
                                  )}
                                  {isFmAccount && (
                                    <button
                                      onClick={() => handleFmCheckAllAndUploadQc('SUB_TASK', st.id)}
                                      title={
                                        sEvCount === 0
                                          ? 'Upload at least 1 evidence before checking/approving'
                                          : 'Check & Approve as Factory Manager'
                                      }
                                      className={`px-2.5 py-1 rounded text-[11px] font-semibold inline-flex items-center gap-1 ${
                                        sEvCount === 0
                                          ? 'bg-slate-100 text-slate-500 border border-slate-200'
                                          : 'bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700'
                                      }`}
                                    >
                                      <CheckSquare className="w-3 h-3" />
                                      Check
                                    </button>
                                  )}
                                  {canApproveQc && (
                                    <>
                                      <button
                                        onClick={() => handlePmOrAdminApproveQc('SUB_TASK', st.id)}
                                        disabled={!sQc.factoryManagerApproval?.isApproved}
                                        title={
                                          !sQc.factoryManagerApproval?.isApproved
                                            ? '1st Step Required: Factory Manager must upload evidence and check/approve first'
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
                                        title={
                                          !sQc.factoryManagerApproval?.isApproved
                                            ? 'Factory Manager must submit 1st step before Reject'
                                            : 'Reject & Issue Defect Report'
                                        }
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
                                    className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                                    title="Download or Print Sub-Task Checklist as PDF"
                                  >
                                    <Printer className="w-3 h-3 text-orange-500" />
                                    Doc
                                  </button>
                                  <button
                                    onClick={() => setActiveQcChecklistModal({ targetType: 'SUB_TASK', targetId: st.id })}
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

        return fullScreenAllChecklists && typeof document !== 'undefined'
          ? createPortal(checklistDirectoryContent, document.body)
          : checklistDirectoryContent;
      })()}

      {/* VIEW FULL TASK DETAILS & CHECKLISTS PAGE — FITS & FIXED TO 100% OF SYSTEM SCREEN VIA PORTAL */}
      {viewTaskDetail && typeof document !== 'undefined' && createPortal((() => {
        const taskQcState: TaskOrSubTaskQcState = factoryExecutionService.getTaskOrSubTaskQcState('TASK', viewTaskDetail.id);
        const taskCheckedCount = taskQcState.checklistItems.filter(i => i.checked).length;

        return (
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
              zIndex: 2147483641
            }}
            data-qc-tick={qcTick}
          >
            {/* Full-Screen Top Header Bar (Clean White Background) */}
            <div className="px-6 py-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-white text-slate-900 shrink-0">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 rounded-lg bg-orange-500 text-white font-mono text-xs font-bold">
                  {viewTaskDetail.taskCode}
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{viewTaskDetail.title}</h3>
                  <div className="text-[11px] text-slate-500">
                    {viewTaskDetail.projectName} · {viewTaskDetail.factoryName} · Stage: <span className="text-orange-600 font-bold">{viewTaskDetail.stageStatus}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {isFmAccount && (
                  <button
                    onClick={() => setUploadTaskTarget(viewTaskDetail)}
                    className="px-3.5 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Upload
                  </button>
                )}

                {isFmAccount && (
                  <button
                    onClick={() => handleFmCheckAllAndUploadQc('TASK', viewTaskDetail.id)}
                    className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    Check
                  </button>
                )}

                {canApproveQc && (
                  <button
                    onClick={() => handlePmOrAdminApproveQc('TASK', viewTaskDetail.id)}
                    disabled={!taskQcState.factoryManagerApproval?.isApproved}
                    title={
                      !taskQcState.factoryManagerApproval?.isApproved
                        ? '1st Step Required: Factory Manager must check and approve first'
                        : '2nd Step: Approve Checklist'
                    }
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 ${
                      !taskQcState.factoryManagerApproval?.isApproved
                        ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Approve
                  </button>
                )}

                <button
                  onClick={() => {
                    const spec = buildTaskDocSpec(viewTaskDetail);
                    setDocSpec(spec);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Doc
                </button>

                <button
                  onClick={() => setViewTaskDetail(null)}
                  className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  Exit
                </button>
              </div>
            </div>

            {/* Full-Screen Body Workspace */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-4 text-xs w-full">
              {/* Key Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs w-full">
                <div>
                  <div className="text-slate-400 font-semibold">Project</div>
                  <div className="font-bold text-slate-900 mt-0.5 truncate">{viewTaskDetail.projectName}</div>
                </div>
                <div>
                  <div className="text-slate-400 font-semibold">Factory</div>
                  <div className="font-bold text-slate-900 mt-0.5 truncate">{viewTaskDetail.factoryName}</div>
                </div>
                <div>
                  <div className="text-slate-400 font-semibold">Drawing</div>
                  <div className="font-mono font-bold text-slate-900 mt-0.5 truncate">
                    {viewTaskDetail.drawingNumber}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 font-semibold">Progress</div>
                  <div className="font-bold text-orange-600 mt-0.5 truncate">
                    {viewTaskDetail.completedQuantity}/{viewTaskDetail.plannedQuantity} {viewTaskDetail.unit}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 font-semibold">Person</div>
                  <div className="font-semibold text-slate-800 mt-0.5 truncate">
                    {viewTaskDetail.assignedWorkerNames[0] || viewTaskDetail.supervisorName}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 font-semibold">Machine</div>
                  <div className="font-semibold text-sky-700 mt-0.5 truncate">
                    {viewTaskDetail.assignedMachineNames[0] || 'CNC Line 01'}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 font-semibold">Workflow</div>
                  <div className="font-semibold text-slate-800 mt-0.5 truncate">
                    {viewTaskDetail.assignedWorkflowName || STANDARD_FACTORY_WORKFLOWS[0]}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 font-semibold">Schedule</div>
                  <div className="font-mono font-bold text-slate-900 mt-0.5 truncate">
                    {viewTaskDetail.startDate} → {viewTaskDetail.targetDate}
                  </div>
                </div>
              </div>

              {/* Full-Width Checklists Stack */}
              <div className="w-full space-y-4">
                {taskQcState.latestDefectReport && (
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                        <span>Defect Report & Correction Required — Rejected by {taskQcState.latestDefectReport.rejectedByName} ({taskQcState.latestDefectReport.rejectedByRole})</span>
                      </div>
                      <div className="text-xs text-rose-900">
                        <span className="font-bold">Reason:</span> {taskQcState.latestDefectReport.reason}
                      </div>
                      <div className="text-xs text-rose-900">
                        <span className="font-bold">Correction Instructions:</span> {taskQcState.latestDefectReport.correctionInstructions}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => factoryExecutionService.downloadDefectReport(taskQcState.latestDefectReport!)}
                        className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold inline-flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download
                      </button>
                      {isFmAccount && (
                        <button
                          onClick={() => handleOpenEvidenceUploadForTarget('TASK', viewTaskDetail.id)}
                          className="px-3.5 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold inline-flex items-center gap-1.5"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          Upload
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Uploaded Evidences Section (Documents, Images ≤1MB, Videos ≤5MB) */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="font-bold text-slate-900 text-xs">
                        Task Evidences ({(taskQcState.evidenceAttachments || []).length}) — Images & Documents ≤ 1MB, Video ≤ 5MB
                      </div>
                      <div className="text-[11px] text-slate-500">
                        At least 1 evidence must be uploaded by Factory Manager before checking or approving this task.
                      </div>
                    </div>
                    {isFmAccount && (
                      <button
                        onClick={() => handleOpenEvidenceUploadForTarget('TASK', viewTaskDetail.id)}
                        className="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold inline-flex items-center gap-1.5"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        Upload
                      </button>
                    )}
                  </div>
                  {(taskQcState.evidenceAttachments || []).length === 0 ? (
                    <div className="px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
                      No evidence uploaded yet. Factory Manager must upload at least 1 document, image (≤ 1MB), or video (≤ 5MB) before checking or approving.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {(taskQcState.evidenceAttachments || []).map(ev => (
                        <div
                          key={ev.id}
                          className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 truncate">{ev.fileName}</div>
                            <div className="text-[10px] text-slate-500 truncate">
                              {ev.mediaKind} · {ev.fileSizeLabel} · {ev.uploadedBy}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() =>
                                setPreviewMediaDoc({
                                  id: ev.id,
                                  fileName: ev.fileName,
                                  fileType: ev.mediaKind,
                                  docCategory: ev.caption || 'Task Evidence',
                                  fileSize: ev.fileSizeLabel,
                                  uploadedAt: ev.uploadedAt,
                                  uploadedBy: ev.uploadedBy,
                                  dataUrl: ev.dataUrl
                                })
                              }
                              className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-semibold inline-flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" />
                              View
                            </button>
                            <button
                              onClick={() =>
                                factoryExecutionService.downloadMediaOrFile(
                                  ev.fileName,
                                  ev.dataUrl,
                                  `Task: ${viewTaskDetail.taskCode}\nEvidence: ${ev.fileName}\nUploaded By: ${ev.uploadedBy}`
                                )
                              }
                              className="px-2 py-1 rounded bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-semibold inline-flex items-center gap-1"
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

                <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs w-full overflow-x-auto">
                  <div className="px-5 py-3 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-2">
                    <div className="font-bold text-slate-900">
                      Unique Checklist — {viewTaskDetail.taskCode} ({taskCheckedCount}/{taskQcState.checklistItems.length})
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {canApproveQc && !isFmAccount && (
                        <button
                          onClick={() =>
                            setChecklistItemModal({
                              mode: 'add',
                              targetType: 'TASK',
                              targetId: viewTaskDetail.id,
                              category: 'Task Verification',
                              parameter: '',
                              standardSpecification: 'ISO 9001 / AFC Drawing',
                              acceptanceCriteria: '100% Verified & Compliant'
                            })
                          }
                          className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold inline-flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add
                        </button>
                      )}
                      {isFmAccount && (
                        <button
                          onClick={() => handleOpenEvidenceUploadForTarget('TASK', viewTaskDetail.id)}
                          className="px-3 py-1 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-semibold inline-flex items-center gap-1"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          Upload
                        </button>
                      )}
                      {isFmAccount && (
                        <button
                          onClick={() => handleFmCheckAllAndUploadQc('TASK', viewTaskDetail.id)}
                          className="px-3 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-semibold inline-flex items-center gap-1"
                        >
                          <CheckSquare className="w-3.5 h-3.5" />
                          Check
                        </button>
                      )}
                      {canApproveQc && (
                        <>
                          <button
                            onClick={() => handlePmOrAdminApproveQc('TASK', viewTaskDetail.id)}
                            disabled={!taskQcState.factoryManagerApproval?.isApproved}
                            title={
                              !taskQcState.factoryManagerApproval?.isApproved
                                ? '1st Step Required: Factory Manager must check and approve first'
                                : '2nd Step: Approve Checklist'
                            }
                            className={`px-3 py-1 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1 ${
                              !taskQcState.factoryManagerApproval?.isApproved
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
                                targetType: 'TASK',
                                targetId: viewTaskDetail.id,
                                targetCode: viewTaskDetail.taskCode,
                                targetTitle: viewTaskDetail.title
                              })
                            }
                            disabled={!taskQcState.factoryManagerApproval?.isApproved}
                            className={`px-3 py-1 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1 ${
                              !taskQcState.factoryManagerApproval?.isApproved
                                ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                                : 'bg-rose-600 hover:bg-rose-700 text-white cursor-pointer'
                            }`}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Reject
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => setDocSpec(buildChecklistDocSpec(taskQcState))}
                        className="px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                        title="Download or Print Checklist as PDF document"
                      >
                        <Printer className="w-3.5 h-3.5 text-orange-400" />
                        Doc (PDF)
                      </button>
                      <button
                        onClick={() => setActiveQcChecklistModal({ targetType: 'TASK', targetId: viewTaskDetail.id })}
                        className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-semibold inline-flex items-center gap-1"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                        Fullscreen
                      </button>
                    </div>
                  </div>

                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase">
                        {isFmAccount && <th className="py-2.5 px-4 w-14 whitespace-nowrap">Check</th>}
                        <th className="py-2.5 px-4 whitespace-nowrap">Code</th>
                        <th className="py-2.5 px-4 whitespace-nowrap">Category</th>
                        <th className="py-2.5 px-4 whitespace-nowrap">Item</th>
                        <th className="py-2.5 px-4 whitespace-nowrap">Standard</th>
                        <th className="py-2.5 px-4 whitespace-nowrap">Status</th>
                        {canApproveQc && !isFmAccount && <th className="py-2.5 px-4 text-right whitespace-nowrap">Manage</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {taskQcState.checklistItems.map(item => (
                        <tr
                          key={item.masterItemId}
                          onClick={() => {
                            if (!isFmAccount) return;
                            try {
                              factoryExecutionService.toggleQcChecklistItem(
                                currentUser,
                                'TASK',
                                viewTaskDetail.id,
                                item.masterItemId
                              );
                              setQcTick(t => t + 1);
                            } catch (err: any) {
                              toast.error(err.message || 'Upload at least 1 evidence first');
                              handleOpenEvidenceUploadForTarget('TASK', viewTaskDetail.id);
                            }
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
                          <td className="py-2.5 px-4 text-[11px] text-emerald-700 font-semibold whitespace-nowrap">
                            {item.checked ? 'Passed' : 'Pending'}
                          </td>
                          {canApproveQc && !isFmAccount && (
                            <td className="py-2.5 px-4 text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
                              <div className="inline-flex items-center gap-1">
                                <button
                                  onClick={() =>
                                    setChecklistItemModal({
                                      mode: 'edit',
                                      targetType: 'TASK',
                                      targetId: viewTaskDetail.id,
                                      masterItemId: item.masterItemId,
                                      category: item.category,
                                      parameter: item.parameter,
                                      standardSpecification: item.standardSpecification,
                                      acceptanceCriteria: item.acceptanceCriteria
                                    })
                                  }
                                  className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold inline-flex items-center gap-1"
                                >
                                  <Edit3 className="w-3 h-3" />
                                  Edit
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteChecklistItem('TASK', viewTaskDetail.id, item.masterItemId)
                                  }
                                  className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-semibold inline-flex items-center gap-1"
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

                {/* Sub-Tasks Table */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs w-full overflow-x-auto">
                  <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                    <span className="font-bold text-slate-900">
                      Sub-Tasks ({(viewTaskDetail.subTasks || []).length})
                    </span>
                  </div>
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500">
                        <th className="py-2.5 px-4 whitespace-nowrap">Code</th>
                        <th className="py-2.5 px-4 whitespace-nowrap">Sub-Task</th>
                        <th className="py-2.5 px-4 whitespace-nowrap">Assigned</th>
                        <th className="py-2.5 px-4 whitespace-nowrap">Checks</th>
                        <th className="py-2.5 px-4 whitespace-nowrap">Status</th>
                        <th className="py-2.5 px-4 text-right whitespace-nowrap">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(viewTaskDetail.subTasks || []).map(st => {
                        const stQc = factoryExecutionService.getTaskOrSubTaskQcState('SUB_TASK', st.id);
                        const stChecked = stQc.checklistItems.filter(i => i.checked).length;
                        return (
                          <tr key={st.id} className="hover:bg-slate-50/70">
                            <td className="py-2.5 px-4 font-mono font-bold text-orange-600 whitespace-nowrap">{st.subTaskCode}</td>
                            <td className="py-2.5 px-4 font-semibold text-slate-900 whitespace-nowrap max-w-[260px] truncate">{st.title}</td>
                            <td className="py-2.5 px-4 text-slate-600 whitespace-nowrap">
                              {st.assignedPersonName}
                            </td>
                            <td className="py-2.5 px-4 font-mono text-[11px] font-semibold text-sky-700 whitespace-nowrap">
                              {stChecked}/{stQc.checklistItems.length}
                            </td>
                            <td className="py-2.5 px-4 font-semibold text-emerald-700 whitespace-nowrap">{st.status}</td>
                            <td className="py-2.5 px-4 text-right whitespace-nowrap">
                              <div className="inline-flex items-center gap-1.5">
                                {isFmAccount && (
                                  <button
                                    onClick={() => setUploadTaskTarget(viewTaskDetail)}
                                    className="px-2.5 py-1 rounded bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-700 text-[10px] font-semibold inline-flex items-center gap-1"
                                  >
                                    <Upload className="w-3 h-3" />
                                    Upload
                                  </button>
                                )}
                                {isFmAccount && (
                                  <button
                                    onClick={() => handleFmCheckAllAndUploadQc('SUB_TASK', st.id)}
                                    className="px-2.5 py-1 rounded bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 text-[10px] font-semibold"
                                  >
                                    Check
                                  </button>
                                )}
                                {canApproveQc && (
                                  <button
                                    onClick={() => handlePmOrAdminApproveQc('SUB_TASK', st.id)}
                                    disabled={!stQc.factoryManagerApproval?.isApproved}
                                    title={
                                      !stQc.factoryManagerApproval?.isApproved
                                        ? '1st Step Required: Factory Manager must check and approve first'
                                        : '2nd Step: Approve Checklist'
                                    }
                                    className={`px-2.5 py-1 rounded text-[10px] font-semibold ${
                                      !stQc.factoryManagerApproval?.isApproved
                                        ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                                        : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                                    }`}
                                  >
                                    Approve
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    const subQc = factoryExecutionService.getTaskOrSubTaskQcState('SUB_TASK', st.id);
                                    setDocSpec(buildChecklistDocSpec(subQc));
                                  }}
                                  className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                                  title="Download or Print Sub-task Checklist as PDF document"
                                >
                                  <Printer className="w-3 h-3 text-orange-400" />
                                  Doc (PDF)
                                </button>
                                <button
                                  onClick={() =>
                                    setActiveQcChecklistModal({ targetType: 'SUB_TASK', targetId: st.id })
                                  }
                                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-semibold inline-flex items-center gap-1"
                                >
                                  <Maximize2 className="w-3 h-3" />
                                  Fullscreen
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
            </div>
          </div>
        );
      })(), document.body)}

      {/* INTERACTIVE PROJECT MASTER QC CHECKLIST MODAL FOR ANY TASK OR SUB-TASK — FITS & FIXED TO 100% OF SYSTEM SCREEN VIA PORTAL */}
      {activeQcChecklistModal && typeof document !== 'undefined' && createPortal((() => {
        const qcState = factoryExecutionService.getTaskOrSubTaskQcState(
          activeQcChecklistModal.targetType,
          activeQcChecklistModal.targetId
        );
        const checkedCount = qcState.checklistItems.filter(i => i.checked).length;
        const evCount = (qcState.evidenceAttachments || []).length;

        return (
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
            data-qc-tick={qcTick}
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
                    Evidences: <span className="font-bold text-sky-700">{evCount}</span> · Checks: <span className="text-orange-600 font-bold">{checkedCount}/{qcState.checklistItems.length}</span> · 1st Step (FM): <span className="font-bold text-slate-900">{qcState.factoryManagerApproval?.isApproved ? 'Approved' : 'Pending'}</span> · 2nd Step (PM/Admin): <span className="text-emerald-600 font-bold">{qcState.pmOrAdminApproval?.isApproved ? 'Approved' : qcState.qcStatus.includes('Rejected') ? 'Rejected' : 'Pending'}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {canApproveQc && !isFmAccount && (
                  <button
                    onClick={() =>
                      setChecklistItemModal({
                        mode: 'add',
                        targetType: activeQcChecklistModal.targetType,
                        targetId: activeQcChecklistModal.targetId,
                        category: 'Quality Check',
                        parameter: '',
                        standardSpecification: 'ISO 9001 / AFC Drawing',
                        acceptanceCriteria: '100% Verified & Compliant'
                      })
                    }
                    className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add
                  </button>
                )}
                {isFmAccount && (
                  <button
                    onClick={() =>
                      handleOpenEvidenceUploadForTarget(
                        activeQcChecklistModal.targetType,
                        activeQcChecklistModal.targetId
                      )
                    }
                    className="px-3.5 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Upload
                  </button>
                )}
                {isFmAccount && (
                  <button
                    onClick={() =>
                      handleFmCheckAllAndUploadQc(
                        activeQcChecklistModal.targetType,
                        activeQcChecklistModal.targetId
                      )
                    }
                    className="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    Check
                  </button>
                )}
                {canApproveQc && (
                  <>
                    <button
                      onClick={() =>
                        handlePmOrAdminApproveQc(
                          activeQcChecklistModal.targetType,
                          activeQcChecklistModal.targetId
                        )
                      }
                      disabled={!qcState.factoryManagerApproval?.isApproved}
                      title={
                        !qcState.factoryManagerApproval?.isApproved
                          ? '1st Step Required: Factory Manager must upload evidence and check/approve first'
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
                          targetType: activeQcChecklistModal.targetType,
                          targetId: activeQcChecklistModal.targetId,
                          targetCode: qcState.targetCode,
                          targetTitle: qcState.targetTitle
                        })
                      }
                      disabled={!qcState.factoryManagerApproval?.isApproved}
                      title={
                        !qcState.factoryManagerApproval?.isApproved
                          ? 'Factory Manager must submit 1st step before Reject'
                          : 'Reject & Upload Defect Report'
                      }
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 ${
                        !qcState.factoryManagerApproval?.isApproved
                          ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                          : 'bg-rose-600 hover:bg-rose-700 text-white cursor-pointer'
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Reject
                    </button>
                  </>
                )}
                <button
                  onClick={() => setDocSpec(buildChecklistDocSpec(qcState))}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Download or Print Checklist as PDF document"
                >
                  <Printer className="w-3.5 h-3.5 text-orange-400" />
                  Doc (PDF)
                </button>
                <button
                  onClick={() => setActiveQcChecklistModal(null)}
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
              {filteredTasks.map(tk => (
                <React.Fragment key={tk.id}>
                  <button
                    onClick={() => setActiveQcChecklistModal({ targetType: 'TASK', targetId: tk.id })}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold shrink-0 transition-colors ${
                      activeQcChecklistModal.targetType === 'TASK' && activeQcChecklistModal.targetId === tk.id
                        ? 'bg-orange-500 text-white shadow-2xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {tk.taskCode}
                  </button>
                  {(tk.subTasks || []).map(st => (
                    <button
                      key={st.id}
                      onClick={() => setActiveQcChecklistModal({ targetType: 'SUB_TASK', targetId: st.id })}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold shrink-0 transition-colors ${
                        activeQcChecklistModal.targetType === 'SUB_TASK' && activeQcChecklistModal.targetId === st.id
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

            <div className="flex-1 p-6 overflow-y-auto bg-slate-50 space-y-4 text-xs w-full">
              {qcState.latestDefectReport && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      <span>Defect Report & Correction Required — Rejected by {qcState.latestDefectReport.rejectedByName} ({qcState.latestDefectReport.rejectedByRole})</span>
                    </div>
                    <div className="text-xs text-rose-900">
                      <span className="font-bold">Reason:</span> {qcState.latestDefectReport.reason}
                    </div>
                    <div className="text-xs text-rose-900">
                      <span className="font-bold">Instructions:</span> {qcState.latestDefectReport.correctionInstructions}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => factoryExecutionService.downloadDefectReport(qcState.latestDefectReport!)}
                      className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold inline-flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </button>
                    {isFmAccount && (
                      <button
                        onClick={() =>
                          handleOpenEvidenceUploadForTarget(
                            activeQcChecklistModal.targetType,
                            activeQcChecklistModal.targetId
                          )
                        }
                        className="px-3.5 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold inline-flex items-center gap-1.5"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        Upload
                      </button>
                    )}
                  </div>
                </div>
              )}

              {qcState.approvedByName && (
                <div className="px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-semibold">
                  Approved by {qcState.approvedByName} ({qcState.approvedByRole}) on {qcState.approvedAt}
                </div>
              )}

              {/* Mandatory Evidences Panel (View / Download for PM/Admin, Upload for Factory Manager) */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-bold text-slate-900 text-xs">
                      Uploaded Evidences ({evCount}) — Images & Documents ≤ 1MB, Videos ≤ 5MB
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Factory Manager must upload at least 1 evidence before checking/approving. PM/Admin can view or download below.
                    </div>
                  </div>
                  {isFmAccount && (
                    <button
                      onClick={() =>
                        handleOpenEvidenceUploadForTarget(
                          activeQcChecklistModal.targetType,
                          activeQcChecklistModal.targetId
                        )
                      }
                      className="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold inline-flex items-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Upload
                    </button>
                  )}
                </div>

                {evCount === 0 ? (
                  <div className="px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
                    Mandatory Requirement: Upload at least 1 evidence (Document/Image ≤ 1MB or Video ≤ 5MB) before checking or approving this checklist.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {(qcState.evidenceAttachments || []).map(ev => (
                      <div
                        key={ev.id}
                        className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 truncate">{ev.fileName}</div>
                          <div className="text-[10px] text-slate-500 truncate">
                            {ev.mediaKind} · {ev.fileSizeLabel} · By {ev.uploadedBy}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() =>
                              setPreviewMediaDoc({
                                id: ev.id,
                                fileName: ev.fileName,
                                fileType: ev.mediaKind,
                                docCategory: ev.caption || 'Checklist Evidence',
                                fileSize: ev.fileSizeLabel,
                                uploadedAt: ev.uploadedAt,
                                uploadedBy: ev.uploadedBy,
                                dataUrl: ev.dataUrl
                              })
                            }
                            className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-semibold inline-flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            View
                          </button>
                          <button
                            onClick={() =>
                              factoryExecutionService.downloadMediaOrFile(
                                ev.fileName,
                                ev.dataUrl,
                                `Target: ${qcState.targetCode}\nEvidence: ${ev.fileName}\nUploaded By: ${ev.uploadedBy}`
                              )
                            }
                            className="px-2 py-1 rounded bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-semibold inline-flex items-center gap-1"
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

              <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs w-full overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500">
                      {isFmAccount && <th className="py-2.5 px-4 w-14 whitespace-nowrap">Check</th>}
                      <th className="py-2.5 px-4 whitespace-nowrap">Code</th>
                      <th className="py-2.5 px-4 whitespace-nowrap">Category</th>
                      <th className="py-2.5 px-4 whitespace-nowrap">Unique Item</th>
                      <th className="py-2.5 px-4 whitespace-nowrap">Standard</th>
                      <th className="py-2.5 px-4 whitespace-nowrap">Status</th>
                      {canApproveQc && !isFmAccount && <th className="py-2.5 px-4 text-right whitespace-nowrap">Manage</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {qcState.checklistItems.map(item => (
                      <tr
                        key={item.masterItemId}
                        onClick={() => {
                          if (!isFmAccount) return;
                          try {
                            factoryExecutionService.toggleQcChecklistItem(
                              currentUser,
                              activeQcChecklistModal.targetType,
                              activeQcChecklistModal.targetId,
                              item.masterItemId
                            );
                            setQcTick(t => t + 1);
                          } catch (err: any) {
                            toast.error(err.message || 'Upload at least 1 evidence before checking');
                            handleOpenEvidenceUploadForTarget(
                              activeQcChecklistModal.targetType,
                              activeQcChecklistModal.targetId
                            );
                          }
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
                        {canApproveQc && !isFmAccount && (
                          <td className="py-2.5 px-4 text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() =>
                                  setChecklistItemModal({
                                    mode: 'edit',
                                    targetType: activeQcChecklistModal.targetType,
                                    targetId: activeQcChecklistModal.targetId,
                                    masterItemId: item.masterItemId,
                                    category: item.category,
                                    parameter: item.parameter,
                                    standardSpecification: item.standardSpecification,
                                    acceptanceCriteria: item.acceptanceCriteria
                                  })
                                }
                                className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold inline-flex items-center gap-1"
                              >
                                <Edit3 className="w-3 h-3" />
                                Edit
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteChecklistItem(
                                    activeQcChecklistModal.targetType,
                                    activeQcChecklistModal.targetId,
                                    item.masterItemId
                                  )
                                }
                                className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-semibold inline-flex items-center gap-1"
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
      })(), document.body)}

      {/* MEDIA PREVIEW & DOWNLOAD MODAL (Full Screen Fixed) */}
      {previewMediaDoc && typeof document !== 'undefined' && createPortal(
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
            zIndex: 2147483647
          }}
        >
          <div className="px-6 py-3.5 border-b border-slate-200 flex items-center justify-between bg-white text-slate-900 shrink-0">
            <div>
              <h3 className="text-sm font-bold text-slate-900">{previewMediaDoc.fileName}</h3>
              <p className="text-[11px] text-slate-500">
                {previewMediaDoc.docCategory} · {previewMediaDoc.fileSize} · Uploaded by {previewMediaDoc.uploadedBy}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  factoryExecutionService.downloadMediaOrFile(
                    previewMediaDoc.fileName,
                    previewMediaDoc.dataUrl,
                    `File: ${previewMediaDoc.fileName}\nCategory: ${previewMediaDoc.docCategory}`
                  )
                }
                className="px-3.5 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Download
              </button>
              <button
                onClick={() => setPreviewMediaDoc(null)}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
              >
                Exit
              </button>
            </div>
          </div>
          <div className="flex-1 p-6 flex flex-col items-center justify-center bg-slate-50 overflow-auto">
            {previewMediaDoc.fileType.toLowerCase().includes('video') ||
            /\.(mp4|webm|mov)$/i.test(previewMediaDoc.fileName) ? (
              <video
                src={
                  previewMediaDoc.dataUrl ||
                  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
                }
                controls
                autoPlay
                className="max-h-[80vh] w-full max-w-5xl rounded-xl shadow-md bg-black"
              />
            ) : (
              <img
                src={
                  previewMediaDoc.dataUrl ||
                  'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=900&q=80'
                }
                alt={previewMediaDoc.fileName}
                className="max-h-[80vh] w-auto object-contain rounded-xl shadow-md bg-white p-2 border border-slate-200"
              />
            )}
          </div>
        </div>,
        document.body
      )}

      {/* PM/ADMIN REJECT & DEFECT REPORT FORM MODAL (Full Screen Fixed) */}
      {rejectTarget && typeof document !== 'undefined' && createPortal(
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
            zIndex: 2147483646
          }}
        >
          <div className="px-6 py-4 border-b border-slate-200 bg-white text-slate-900 flex items-center justify-between shrink-0">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Reject & Upload Defect Report — {rejectTarget.targetCode}
              </h3>
              <p className="text-[11px] text-slate-500">
                {rejectTarget.targetTitle} · Provide rejection reason, correction instructions, and defect reference for Factory Manager
              </p>
            </div>
            <button
              onClick={() => setRejectTarget(null)}
              className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
            >
              Exit
            </button>
          </div>
          <form onSubmit={handleSubmitRejectQc} className="flex-1 p-6 space-y-4 overflow-y-auto text-xs w-full max-w-4xl mx-auto">
            <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-200 space-y-3">
              <div className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">
                1. Rejection Reason & Non-Conformance Details
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Reason for Rejection</label>
                <textarea
                  rows={3}
                  required
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Mandatory Correction Instructions for Factory Manager
                </label>
                <textarea
                  rows={3}
                  required
                  value={rejectInstructions}
                  onChange={e => setRejectInstructions(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="text-[11px] font-bold text-orange-600 uppercase tracking-wider">
                2. Upload Defect Report Document / Marked-Up Evidence (Optional — Max 1MB Image/Doc, 5MB Video)
              </div>
              <input
                type="file"
                accept="image/*,video/*,.pdf,.doc,.docx"
                onChange={handleRejectFileChange}
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white"
              />
              {rejectFileName && (
                <div className="text-xs font-semibold text-slate-700">
                  Attached: {rejectFileName} ({rejectFileSize})
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectTarget(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-2xs"
              >
                Reject
              </button>
            </div>
          </form>
        </div>,
        document.body
      )}

      {/* PM/ADMIN ADD OR EDIT UNIQUE CHECKLIST ITEM MODAL (Full Screen Fixed) */}
      {checklistItemModal && typeof document !== 'undefined' && createPortal(
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
            zIndex: 2147483646
          }}
        >
          <div className="px-6 py-4 border-b border-slate-200 bg-white text-slate-900 flex items-center justify-between shrink-0">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {checklistItemModal.mode === 'add' ? 'Add Unique Checklist Item' : 'Edit Unique Checklist Item'}
              </h3>
              <p className="text-[11px] text-slate-500">
                Only Admin or Project Manager can add, change, or delete unique checklist items for a Task or Sub-Task
              </p>
            </div>
            <button
              onClick={() => setChecklistItemModal(null)}
              className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
            >
              Exit
            </button>
          </div>
          <form onSubmit={handleSaveChecklistItemModal} className="flex-1 p-6 space-y-4 overflow-y-auto text-xs w-full max-w-4xl mx-auto">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                <input
                  type="text"
                  required
                  value={checklistItemModal.category}
                  onChange={e => setChecklistItemModal({ ...checklistItemModal, category: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Checklist Item / Inspection Parameter</label>
                <input
                  type="text"
                  required
                  value={checklistItemModal.parameter}
                  onChange={e => setChecklistItemModal({ ...checklistItemModal, parameter: e.target.value })}
                  placeholder="e.g., Verify Mullion Slot Milling Tolerance & Drainage Clearance"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Standard Specification</label>
                <input
                  type="text"
                  required
                  value={checklistItemModal.standardSpecification}
                  onChange={e => setChecklistItemModal({ ...checklistItemModal, standardSpecification: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Acceptance Criteria</label>
                <input
                  type="text"
                  required
                  value={checklistItemModal.acceptanceCriteria}
                  onChange={e => setChecklistItemModal({ ...checklistItemModal, acceptanceCriteria: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                />
              </div>
            </div>
            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setChecklistItemModal(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700"
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
        </div>,
        document.body
      )}

      {/* Edit CPM, Sequence, People, Machinery & Workflow Modal (Full Screen Fixed) */}
      {editCpmTask && typeof document !== 'undefined' && createPortal(
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
          <div className="px-6 py-4 border-b border-slate-200 bg-white text-slate-900 flex items-center justify-between shrink-0">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Advanced Critical Path (CPM), Schedule & Resource Assignment — {editCpmTask.taskCode}
              </h3>
              <p className="text-[11px] text-slate-500">
                Configure predecessor dependencies, critical path float lock, HR operator, CNC machine, and workflow line
              </p>
            </div>
            <button
              onClick={() => setEditCpmTask(null)}
              className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
            >
              Exit
            </button>
          </div>
          <form onSubmit={handleSaveCpmUpdate} className="flex-1 p-6 space-y-4 overflow-y-auto text-xs w-full max-w-5xl mx-auto">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="text-[11px] font-bold text-orange-600 uppercase tracking-wider">
                  1. Schedule Window & Critical Path Dependency
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Planned Start Date</label>
                    <input
                      type="date"
                      value={cpmStartDate}
                      onChange={e => setCpmStartDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Target Completion Date</label>
                    <input
                      type="date"
                      value={cpmTargetDate}
                      onChange={e => setCpmTargetDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Predecessor Task Node</label>
                    <select
                      value={cpmPredecessor}
                      onChange={e => setCpmPredecessor(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    >
                      <option value="">None (Start Node)</option>
                      {filteredTasks
                        .filter(other => other.id !== editCpmTask.id)
                        .map(other => (
                          <option key={other.id} value={other.taskCode}>
                            {other.taskCode} — {other.title}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
                <div className="pt-1">
                  <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cpmIsCritical}
                      onChange={e => setCpmIsCritical(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                    />
                    Lock Task on Critical Path (Zero Float / Zero Slack Allowed)
                  </label>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="text-[11px] font-bold text-orange-600 uppercase tracking-wider">
                  2. Own Factory Personnel, Machinery & Workflow Line
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Lead Person (HR Registry)</label>
                    <select
                      value={cpmPerson}
                      onChange={e => setCpmPerson(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    >
                      {hrEmployees.map(emp => (
                        <option key={emp.id} value={emp.fullName}>
                          {emp.fullName} ({emp.positionTitle})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Assigned CNC / Production Machine</label>
                    <select
                      value={cpmMachine}
                      onChange={e => setCpmMachine(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    >
                      {equipmentAssets.map(eq => (
                        <option key={eq.id} value={eq.name}>
                          {eq.equipmentId} — {eq.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Standard Factory Production Workflow</label>
                  <select
                    value={cpmWorkflow}
                    onChange={e => setCpmWorkflow(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                  >
                    {STANDARD_FACTORY_WORKFLOWS.map(wf => (
                      <option key={wf} value={wf}>{wf}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditCpmTask(null)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700"
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
        </div>,
        document.body
      )}

      {/* Add Sub-Task Modal (Full Screen Fixed) */}
      {showSubTaskModal && typeof document !== 'undefined' && createPortal(
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
          <div className="px-6 py-4 border-b border-slate-200 bg-white text-slate-900 flex items-center justify-between shrink-0">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Add Advanced Sub-Task, Resource Assignment & Master QC Gate
              </h3>
              <p className="text-[11px] text-slate-500">
                Link sub-task to parent work order, assign technician, machine, workflow, drawing reference, and QC tolerance
              </p>
            </div>
            <button
              onClick={() => setShowSubTaskModal(false)}
              className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
            >
              Exit
            </button>
          </div>
          <form onSubmit={handleCreateSubTask} className="flex-1 p-6 space-y-4 overflow-y-auto text-xs w-full max-w-5xl mx-auto">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="text-[11px] font-bold text-orange-600 uppercase tracking-wider">
                  1. Parent Task & Sub-Task Engineering Scope
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Parent Task / Work Order</label>
                    <select
                      value={subParentTaskId}
                      onChange={e => setSubParentTaskId(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    >
                      {filteredTasks.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.taskCode} — {t.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Sub-Task Title</label>
                    <input
                      type="text"
                      required
                      value={subTitle}
                      onChange={e => setSubTitle(e.target.value)}
                      placeholder="e.g., CNC Mullion Slot Milling & Drainage Routing"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Detail Drawing / Jig Reference</label>
                    <input
                      type="text"
                      value={subDrawingRef}
                      onChange={e => setSubDrawingRef(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Dimensional & QC Tolerance Note</label>
                    <input
                      type="text"
                      value={subToleranceNote}
                      onChange={e => setSubToleranceNote(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="text-[11px] font-bold text-orange-600 uppercase tracking-wider">
                  2. Assigned Operator, Machine & Production Workflow
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Operator (HR)</label>
                    <select
                      value={subPerson}
                      onChange={e => setSubPerson(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    >
                      {hrEmployees.map(emp => (
                        <option key={emp.id} value={emp.fullName}>{emp.fullName} ({emp.positionTitle})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Machine / Asset</label>
                    <select
                      value={subMachine}
                      onChange={e => setSubMachine(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    >
                      {equipmentAssets.map(eq => (
                        <option key={eq.id} value={eq.name}>{eq.equipmentId} — {eq.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Workflow Stage</label>
                    <select
                      value={subWorkflow}
                      onChange={e => setSubWorkflow(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    >
                      {STANDARD_FACTORY_WORKFLOWS.map(wf => (
                        <option key={wf} value={wf}>{wf}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="text-[11px] font-bold text-orange-600 uppercase tracking-wider">
                  3. Quantities, Man-Hours & Schedule
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Planned Qty</label>
                    <input
                      type="number"
                      value={subPlannedQty}
                      onChange={e => setSubPlannedQty(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Unit</label>
                    <input
                      type="text"
                      value={subUnit}
                      onChange={e => setSubUnit(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Est. Hours</label>
                    <input
                      type="number"
                      value={subPlannedHours}
                      onChange={e => setSubPlannedHours(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={subStartDate}
                      onChange={e => setSubStartDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={subEndDate}
                      onChange={e => setSubEndDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                </div>
                <div className="pt-1">
                  <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={subIsCritical}
                      onChange={e => setSubIsCritical(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                    />
                    Include Sub-Task on Critical Path (Zero Float) & Auto-Assign Project Master QC Checklist
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSubTaskModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700"
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
        </div>,
        document.body
      )}

      {/* Add Plan Phase Modal (Full Screen Fixed) */}
      {showPlanModal && typeof document !== 'undefined' && createPortal(
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
          <div className="px-6 py-4 border-b border-slate-200 bg-white text-slate-900 flex items-center justify-between shrink-0">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Add Advanced Project Timeline & Execution Plan Phase
              </h3>
              <p className="text-[11px] text-slate-500">
                Define milestone phase, schedule window, responsible lead, weightage %, deliverables, and gate approval criteria
              </p>
            </div>
            <button
              onClick={() => setShowPlanModal(false)}
              className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
            >
              Exit
            </button>
          </div>
          <form onSubmit={handleCreatePlanPhase} className="flex-1 p-6 space-y-4 overflow-y-auto text-xs w-full max-w-5xl mx-auto">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="text-[11px] font-bold text-orange-600 uppercase tracking-wider">
                  1. Work Package & Milestone Phase Details
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Work Package</label>
                    <select
                      value={planWpId || workPackages[0]?.id || ''}
                      onChange={e => setPlanWpId(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    >
                      {workPackages.map(wp => (
                        <option key={wp.id} value={wp.id}>
                          {wp.packageCode} — {wp.projectName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Execution Phase Name</label>
                    <input
                      type="text"
                      required
                      value={planPhaseName}
                      onChange={e => setPlanPhaseName(e.target.value)}
                      placeholder="e.g., Phase 3: CNC Machining, Glazing & Quality Gate"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Key Milestone Deliverable</label>
                    <input
                      type="text"
                      value={planDeliverable}
                      onChange={e => setPlanDeliverable(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Quality / Gate Sign-Off Requirement</label>
                    <input
                      type="text"
                      value={planGateRequirement}
                      onChange={e => setPlanGateRequirement(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="text-[11px] font-bold text-orange-600 uppercase tracking-wider">
                  2. Schedule Window, Responsible Owner & Weightage
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Planned Start</label>
                    <input
                      type="date"
                      value={planStart}
                      onChange={e => setPlanStart(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Planned End</label>
                    <input
                      type="date"
                      value={planEnd}
                      onChange={e => setPlanEnd(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Responsible Lead</label>
                    <input
                      type="text"
                      value={planOwner}
                      onChange={e => setPlanOwner(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Phase Weight (%)</label>
                    <input
                      type="number"
                      value={planWeightPct}
                      onChange={e => setPlanWeightPct(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPlanModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700"
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
        </div>,
        document.body
      )}

      {/* Dedicated Full-Screen Modal: Upload Evidence (Images & Documents ≤ 1MB, Videos ≤ 5MB) */}
      {(uploadTaskTarget || uploadChecklistTarget) && typeof document !== 'undefined' && createPortal(
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
          <div className="px-6 py-4 border-b border-slate-200 bg-white text-slate-900 flex items-center justify-between shrink-0">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Upload Task & Checklist Evidence — {uploadTaskTarget?.taskCode || uploadChecklistTarget?.targetId}
              </h3>
              <p className="text-[11px] text-slate-500">
                Mandatory before Factory Manager check/approval · Images & Documents max 1MB · Videos max 5MB
              </p>
            </div>
            <button
              onClick={() => {
                setUploadTaskTarget(null);
                setUploadChecklistTarget(null);
                setFileSizeError('');
              }}
              className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
            >
              Exit
            </button>
          </div>
          <form onSubmit={handleSaveTaskUpload} className="flex-1 p-6 space-y-4 overflow-y-auto text-xs w-full max-w-5xl mx-auto">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-orange-600 uppercase tracking-wider">
                    1. Select Image, Video or Document File
                  </span>
                  <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded border border-orange-200">
                    Max 1MB Image/Doc • 5MB Video
                  </span>
                </div>
                <input
                  type="file"
                  accept="image/*,video/*,.pdf,.doc,.docx,.xlsx,.dwg"
                  onChange={handleFileChange}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white"
                />
                {fileSizeError && (
                  <p className="text-[11px] font-semibold text-red-600">{fileSizeError}</p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Document / Image Title & File Name</label>
                    <input
                      type="text"
                      required
                      value={customFileName}
                      onChange={e => setCustomFileName(e.target.value)}
                      placeholder="e.g., Task_Progress_Bay02_Assembly_Photo.jpg"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Validated Size</label>
                    <input
                      type="text"
                      readOnly
                      value={selectedFileSize}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-100 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="text-[11px] font-bold text-orange-600 uppercase tracking-wider">
                  2. Task & Progress Update Details
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Document / Media Category</label>
                    <select
                      value={docCategory}
                      onChange={e => setDocCategory(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    >
                      <option value="Task Progress Photo / Evidence">Task Progress Photo / Evidence</option>
                      <option value="QC Inspection Photo / Video">QC Inspection Photo / Video</option>
                      <option value="System QC Checklist Document">System QC Checklist Document</option>
                      <option value="Shop Drawing / CAD Revision">Shop Drawing / CAD Revision</option>
                      <option value="Cutting List & CNC Program">Cutting List & CNC Program</option>
                      <option value="Method Statement / ITP">Method Statement / ITP</option>
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
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Completed Qty Added</label>
                    <input
                      type="number"
                      min={0}
                      value={uploadCompletedQtyDelta}
                      onChange={e => setUploadCompletedQtyDelta(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Drawing / Control Reference</label>
                    <input
                      type="text"
                      value={uploadDrawingRef}
                      onChange={e => setUploadDrawingRef(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Progress & Quality Remarks</label>
                    <input
                      type="text"
                      value={uploadRemarks}
                      onChange={e => setUploadRemarks(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Existing Uploaded Images & Documents for this Task (View / Download) */}
              {uploadTaskTarget && (uploadTaskTarget.supportingDocuments || []).length > 0 && (
                <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
                  <div className="text-[11px] font-bold text-slate-700 uppercase">
                    Uploaded Task & Progress Files ({(uploadTaskTarget.supportingDocuments || []).length})
                  </div>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {(uploadTaskTarget.supportingDocuments || []).map(doc => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200"
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 truncate">{doc.fileName}</div>
                          <div className="text-[10px] text-slate-500">
                            {doc.docCategory} · {doc.fileSize} · By {doc.uploadedBy}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => setPreviewMediaDoc(doc)}
                            className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-semibold inline-flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" /> View
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              factoryExecutionService.downloadMediaOrFile(
                                doc.fileName,
                                doc.dataUrl,
                                `Task: ${uploadTaskTarget.taskCode}\nFile: ${doc.fileName}\nCategory: ${doc.docCategory}`
                              )
                            }
                            className="px-2.5 py-1 rounded bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-semibold inline-flex items-center gap-1"
                          >
                            <Download className="w-3 h-3" /> Download
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setUploadTaskTarget(null);
                    setUploadChecklistTarget(null);
                    setFileSizeError('');
                  }}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={Boolean(fileSizeError)}
                  className="px-5 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-xs font-semibold shadow-2xs"
                >
                  Save
                </button>
              </div>
            </form>
        </div>,
        document.body
      )}

      {/* Edit Task Modal */}
      {editingTask && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white shrink-0">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  Edit Task
                  <span className="font-mono text-orange-400 text-xs">({editingTask.taskCode})</span>
                </h3>
                <p className="text-[11px] text-slate-300">
                  {editingTask.projectName} · {editingTask.factoryName}
                </p>
              </div>
              <button
                onClick={() => setEditingTask(null)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveEditTask} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Task Title</label>
                <input
                  type="text"
                  value={editTaskTitle}
                  onChange={e => setEditTaskTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Planned Qty</label>
                  <input
                    type="number"
                    value={editTaskPlannedQty}
                    onChange={e => setEditTaskPlannedQty(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Completed</label>
                  <input
                    type="number"
                    value={editTaskCompletedQty}
                    onChange={e => setEditTaskCompletedQty(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono text-emerald-700 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Unit</label>
                  <input
                    type="text"
                    value={editTaskUnit}
                    onChange={e => setEditTaskUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Date</label>
                  <input
                    type="date"
                    value={editTaskTargetDate}
                    onChange={e => setEditTaskTargetDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Stage Status</label>
                  <select
                    value={editTaskStageStatus}
                    onChange={e => setEditTaskStageStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold"
                  >
                    <option value="Assigned">Assigned</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Submitted for Inspection">Submitted for Inspection</option>
                    <option value="Approved">Approved</option>
                    <option value="Completed">Completed</option>
                    <option value="Dispatched">Dispatched</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Worker</label>
                  <input
                    type="text"
                    value={editTaskWorker}
                    onChange={e => setEditTaskWorker(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Machine / Bay</label>
                  <input
                    type="text"
                    value={editTaskMachine}
                    onChange={e => setEditTaskMachine(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold text-xs shadow-xs"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Add Task Modal (Full Screen Fixed) */}
      {showTaskModal && typeof document !== 'undefined' && createPortal(
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
          <div className="px-6 py-4 border-b border-slate-200 bg-white text-slate-900 flex items-center justify-between shrink-0">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Add Advanced Factory Execution Task & Production Order
              </h3>
              <p className="text-[11px] text-slate-500">
                Complete engineering drawings, material specs, HR operator, CNC machine, workflow line, CPM schedule & Master QC link
              </p>
            </div>
            <button
              onClick={() => setShowTaskModal(false)}
              className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
            >
              Exit
            </button>
          </div>
          <form onSubmit={handleCreateTask} className="flex-1 p-6 space-y-4 overflow-y-auto text-xs w-full max-w-6xl mx-auto">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="text-[11px] font-bold text-orange-600 uppercase tracking-wider">
                  1. Work Package, Order Classification & Task Scope
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Work Package</label>
                    <select
                      value={taskWpId}
                      onChange={e => setTaskWpId(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    >
                      {workPackages.map(wp => (
                        <option key={wp.id} value={wp.id}>
                          {wp.packageCode} — {wp.projectName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Order Type</label>
                    <select
                      value={taskOrderType}
                      onChange={e => setTaskOrderType(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    >
                      <option value="Work Order">Work Order</option>
                      <option value="Job Card">Job Card</option>
                      <option value="Production Order">Production Order</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Priority / Criticality</label>
                    <select
                      value={taskPriority}
                      onChange={e => setTaskPriority(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    >
                      <option value="Critical">Critical (Critical Path — 0d Float)</option>
                      <option value="High">High Priority</option>
                      <option value="Medium">Medium Priority</option>
                      <option value="Low">Low Priority</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Task Title</label>
                  <input
                    type="text"
                    required
                    value={taskTitle}
                    onChange={e => setTaskTitle(e.target.value)}
                    placeholder="e.g., Unitized Curtain Wall Panel CNC Profile Milling & Frame Assembly"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Technical Fabrication Instructions & Scope Description
                  </label>
                  <textarea
                    rows={2}
                    value={taskDescription}
                    onChange={e => setTaskDescription(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="text-[11px] font-bold text-orange-600 uppercase tracking-wider">
                  2. Engineering Drawings, Material Batch & Surface Specifications
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Drawing Number</label>
                    <input
                      type="text"
                      value={taskDrawingNo}
                      onChange={e => setTaskDrawingNo(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Revision</label>
                    <input
                      type="text"
                      value={taskDrawingRev}
                      onChange={e => setTaskDrawingRev(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Material Heat / Batch</label>
                    <input
                      type="text"
                      value={taskMaterialBatch}
                      onChange={e => setTaskMaterialBatch(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Alloy & Material Spec</label>
                    <input
                      type="text"
                      value={taskMaterialSpec}
                      onChange={e => setTaskMaterialSpec(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Surface Coating / Finish</label>
                    <input
                      type="text"
                      value={taskSurfaceFinish}
                      onChange={e => setTaskSurfaceFinish(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="text-[11px] font-bold text-orange-600 uppercase tracking-wider">
                  3. Own Factory Personnel, CNC Machinery, Bay & Workflow Assignment
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Technician (HR)</label>
                    <select
                      value={taskPersonName}
                      onChange={e => setTaskPersonName(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    >
                      {hrEmployees.map(emp => (
                        <option key={emp.id} value={emp.fullName}>{emp.fullName} ({emp.positionTitle})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Assigned CNC / Machine Asset</label>
                    <select
                      value={taskMachineName}
                      onChange={e => setTaskMachineName(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    >
                      {equipmentAssets.map(eq => (
                        <option key={eq.id} value={eq.name}>{eq.equipmentId} — {eq.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Production Workflow</label>
                    <select
                      value={taskWorkflowName}
                      onChange={e => setTaskWorkflowName(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    >
                      {STANDARD_FACTORY_WORKFLOWS.map(wf => (
                        <option key={wf} value={wf}>{wf}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Factory Bay / Line</label>
                    <input
                      type="text"
                      value={taskBayOrLine}
                      onChange={e => setTaskBayOrLine(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Line Supervisor</label>
                    <input
                      type="text"
                      value={taskSupervisorName}
                      onChange={e => setTaskSupervisorName(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Shift Allocation</label>
                    <select
                      value={taskShift}
                      onChange={e => setTaskShift(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    >
                      <option value="Day Shift (07:30 - 17:00)">Day Shift (07:30 - 17:00)</option>
                      <option value="Night Shift (19:00 - 04:30)">Night Shift (19:00 - 04:30)</option>
                      <option value="24-Hour Continuous Shift">24-Hour Continuous Shift</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="text-[11px] font-bold text-orange-600 uppercase tracking-wider">
                  4. Quantities, Labor Hours, CPM Schedule & Master QC Tolerance
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Planned Quantity</label>
                    <input
                      type="number"
                      value={taskPlannedQty}
                      onChange={e => setTaskPlannedQty(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Unit</label>
                    <input
                      type="text"
                      value={taskUnit}
                      onChange={e => setTaskUnit(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Planned Man-Hours</label>
                    <input
                      type="number"
                      value={taskPlannedHours}
                      onChange={e => setTaskPlannedHours(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={taskStartDate}
                      onChange={e => setTaskStartDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Target Completion</label>
                    <input
                      type="date"
                      value={taskTargetDate}
                      onChange={e => setTaskTargetDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Predecessor Task (CPM Dependency)</label>
                    <select
                      value={taskPredecessorCode}
                      onChange={e => setTaskPredecessorCode(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    >
                      <option value="">None (Start Node)</option>
                      {filteredTasks.map(t => (
                        <option key={t.id} value={t.taskCode}>{t.taskCode} — {t.title}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Master QC Tolerance Standard</label>
                    <input
                      type="text"
                      value={taskToleranceSpec}
                      onChange={e => setTaskToleranceSpec(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700"
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
        </div>,
        document.body
      )}

      {/* Universal Quotation-Format Document, Print & Approval Modal */}
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
