import {
  FactoryMasterProfile,
  FactoryWorkPackageAssignment,
  FactoryExecutionTask,
  FactoryTaskSubTask,
  DailyFactoryActivityReport,
  DigitalWorksheetRecord,
  FactoryOnsiteIncidentOrDamageRecord,
  MediaEvidenceRecord,
  ProjectResourceAllocationRecord,
  FactoryQualityInspectionRecord,
  FactoryHseRecord,
  FactoryDispatchAndSiteRecord,
  ControlledTechnicalDocument,
  GeneratedFactoryDocument,
  FactoryPartnerRegistrationRecord,
  FactoryProjectSupervisorAssignment,
  FactoryProcurementRecord,
  FactoryHrPayrollRecord,
  FactoryFinanceAccountingRecord,
  TaskOrSubTaskQcState
} from '../../types/factoryPortal';
import { FactoryRecordDocumentSpec } from './FactoryQuotationDocumentModal';

export function buildFactoryProfileDocSpec(f: FactoryMasterProfile): FactoryRecordDocumentSpec {
  return {
    entityType: 'FACTORY_PROFILE',
    recordId: f.id,
    docTitle: 'FACTORY RECORD',
    docNo: f.factoryCode,
    docDate: f.audit?.updatedAt?.slice(0, 10) || '2026-09-26',
    projectName: 'Assigned Projects',
    projectId: f.linkedProjectIds?.[0] || 'PRJ-2026-001',
    clientName: f.ownershipType,
    factoryName: f.name,
    factoryCode: f.factoryCode,
    factoryLocation: `${f.address}, ${f.city}`,
    workPackageCode: 'MASTER-FAC',
    responsibleOfficer: `${f.factoryManagerName} (Factory Manager) | QA: ${f.qaLeadName}`,
    strategyBox1Label: 'Type',
    strategyBox1Value: f.ownershipType,
    strategyBox2Label: 'Status',
    strategyBox2Value: f.status,
    strategyBox3Label: 'Capacity',
    strategyBox3Value: `${f.maximumCapacityUnitsPerMonth.toLocaleString()} ${f.capacityUnitLabel}/Mo (${f.currentCapacityUtilization}%)`,
    justificationOrNotes: `Type: ${f.facilityType} | License: ${f.tradeLicenseNo} | Phone: ${f.contactPhone}`,
    specificationTerms: [
      {
        no: '3.1',
        title: 'Work Capabilities',
        content: (f.capabilities || []).join(', ') || 'General Fabrication'
      },
      {
        no: '3.2',
        title: 'Materials & Products',
        content: `Materials: ${(f.materialsHandled || []).join(', ')} | Products: ${(f.productsManufactured || []).join(', ')}`
      },
      {
        no: '3.3',
        title: 'Quality & Safety Score',
        content: `Quality: ${f.performanceScorecard?.qualityAcceptanceRate ?? 98}% | On-Time: ${f.performanceScorecard?.onTimeCompletionRate ?? 95}% | Safety: ${f.performanceScorecard?.safetyComplianceRate ?? 100}%`
      }
    ],
    scheduleRows:
      f.productionAreas && f.productionAreas.length > 0
        ? f.productionAreas.map((bay, idx) => ({
            no: `1.${idx + 1}`,
            name: `${bay.code} — ${bay.name}`,
            description: `Bay: ${bay.bayType} | Supervisor: ${bay.supervisorName} | Area: ${bay.areaSqm} m²`,
            pvcCode: `${f.factoryCode}-${bay.code}`,
            unit: 'Orders',
            qty: bay.activeWorkOrdersCount,
            rateOrMetric: `Max ${bay.maxConcurrentWorkOrders}`,
            amountOrStatus: `${bay.utilizationPercent}% Used`,
            isMain: idx === 0
          }))
        : [
            {
              no: '1.1',
              name: f.name,
              description: `${f.facilityType} (${f.ownershipType})`,
              pvcCode: f.factoryCode,
              unit: f.capacityUnitLabel,
              qty: f.maximumCapacityUnitsPerMonth,
              rateOrMetric: `${f.currentCapacityUtilization}% Used`,
              amountOrStatus: f.status,
              isMain: true
            }
          ],
    summaryTotals: [
      { label: 'Monthly Capacity', value: `${f.maximumCapacityUnitsPerMonth.toLocaleString()} ${f.capacityUnitLabel}` },
      { label: 'Current Load', value: `${f.currentCapacityUtilization}%` },
      { label: 'Quality Score', value: `${f.performanceScorecard?.qualityAcceptanceRate ?? 98}%` }
    ],
    editableFields: {
      title: f.name,
      status: f.status,
      quantity: f.maximumCapacityUnitsPerMonth,
      date: f.audit?.updatedAt?.slice(0, 10) || '2026-09-26',
      notes: f.facilityType
    }
  };
}

export function buildWorkPackageDocSpec(wp: FactoryWorkPackageAssignment): FactoryRecordDocumentSpec {
  return {
    entityType: 'WORK_PACKAGE',
    recordId: wp.id,
    docTitle: 'WORK PACKAGE SHEET',
    docNo: wp.packageCode,
    docDate: wp.assignedDate || '2026-09-26',
    projectName: wp.projectName,
    projectId: wp.projectId,
    clientName: wp.clientName || 'Project Client',
    factoryName: wp.factoryName,
    factoryCode: wp.factoryId.toUpperCase(),
    factoryLocation: wp.siteAddress || wp.factoryName,
    workPackageCode: wp.packageCode,
    responsibleOfficer: `${wp.assignedByProjectManager} (PM) | Supervisor: ${wp.factorySupervisorName}`,
    strategyBox1Label: 'Factory Type',
    strategyBox1Value: wp.ownershipType,
    strategyBox2Label: 'Status',
    strategyBox2Value: wp.stageStatus,
    strategyBox3Label: 'Progress',
    strategyBox3Value: `${wp.completionPercent}% (${wp.completedQuantity}/${wp.plannedQuantity} ${wp.unit})`,
    justificationOrNotes: `Scope: ${wp.scopeDescription} | Due Date: ${wp.deadlineDate}`,
    specificationTerms: [
      {
        no: '3.1',
        title: 'Work Scope & BOQ',
        content: `${wp.title} — ${wp.scopeDescription} (BOQ: ${(wp.boqReferenceCodes || []).join(', ')})`
      },
      {
        no: '3.2',
        title: 'Key Dates',
        content: `Assigned: ${wp.assignedDate} | Start: ${wp.plannedStartDate} | Due: ${wp.deadlineDate}`
      },
      {
        no: '3.3',
        title: 'Delivery & Quality Count',
        content: `Sent: ${wp.dispatchedQuantity} ${wp.unit} | Installed: ${wp.installedQuantity} ${wp.unit} | Rework: ${wp.reworkQuantity} | Rejected: ${wp.rejectedQuantity}`
      }
    ],
    scheduleRows:
      wp.linkedBoqItems && wp.linkedBoqItems.length > 0
        ? wp.linkedBoqItems.map((b, idx) => ({
            no: `1.${idx + 1}`,
            name: `${b.code} — ${b.name}`,
            description: `Type: ${b.category} | Factory: ${wp.factoryName}`,
            pvcCode: `${wp.packageCode}-${b.code}`,
            unit: b.unit,
            qty: b.qty,
            rateOrMetric: `Rs. ${b.rate.toLocaleString()}`,
            amountOrStatus: `Rs. ${b.amount.toLocaleString()}`,
            isMain: idx === 0
          }))
        : [
            {
              no: '1.1',
              name: wp.title,
              description: wp.scopeDescription,
              pvcCode: wp.packageCode,
              unit: wp.unit,
              qty: wp.plannedQuantity,
              rateOrMetric: `${wp.completionPercent}% Done`,
              amountOrStatus: `Rs. ${wp.budgetedValue.toLocaleString()}`,
              isMain: true
            }
          ],
    summaryTotals: [
      { label: 'Planned Qty', value: `${wp.plannedQuantity} ${wp.unit}` },
      { label: 'Completed Qty', value: `${wp.completedQuantity} ${wp.unit} (${wp.completionPercent}%)` },
      { label: 'Total Budget', value: `Rs. ${wp.budgetedValue.toLocaleString()}` }
    ],
    editableFields: {
      title: wp.title,
      status: wp.stageStatus,
      quantity: wp.plannedQuantity,
      date: wp.deadlineDate,
      notes: wp.scopeDescription
    }
  };
}

export function buildTaskDocSpec(t: FactoryExecutionTask): FactoryRecordDocumentSpec {
  const tAny = t as any;
  const bayName =
    t.productionBayName ||
    t.productionAreaName ||
    tAny.bayOrLine ||
    t.factoryName ||
    'Main Fabrication Bay';
  const drawingNo = t.drawingNumber || 'DRW-FAB-101';
  const drawingRev = t.latestApprovedRevision || t.drawingRevision || 'Rev C';
  const cleanWorkflow = (t.assignedWorkflowName || t.operationStep || 'Standard Fabrication Flow')
    .replace(/\s*[→➔➜➡⟶⇒▸▶]\s*/g, ' -> ');

  const rows: FactoryRecordDocumentSpec['scheduleRows'] = [
    {
      no: '1.1',
      name: `${t.taskCode} - ${t.title}`,
      description: `Flow: ${cleanWorkflow} | Drawing: ${drawingNo} (${drawingRev}) | Bay: ${bayName}`,
      pvcCode: t.taskCode,
      unit: t.unit,
      qty: `${t.completedQuantity}/${t.plannedQuantity}`,
      rateOrMetric: `${t.actualHours}/${t.plannedHours} Hrs`,
      amountOrStatus: t.stageStatus,
      isMain: true
    },
    ...(t.subTasks || []).map((st, idx) => ({
      no: `1.1.${idx + 1}`,
      name: `${st.subTaskCode} - ${st.title}`,
      description: `Worker: ${st.assignedPersonName || 'Assigned Worker'} | Machine: ${st.assignedMachineName || 'Assigned Machine'} | Dates: ${st.startDate} to ${st.endDate}`,
      pvcCode: st.subTaskCode,
      unit: st.unit,
      qty: `${st.completedQty}/${st.plannedQty}`,
      rateOrMetric: st.isCriticalPath ? 'Critical' : 'Normal',
      amountOrStatus: st.status
    }))
  ];

  return {
    entityType: 'TASK',
    recordId: t.id,
    docTitle: `TASK SHEET (${(t.orderType || 'WORK ORDER').toUpperCase()})`,
    docNo: t.taskCode,
    docDate: t.startDate || '2026-09-26',
    projectName: t.projectName,
    projectId: t.projectId,
    factoryName: t.factoryName,
    factoryCode: (t.factoryId || 'FAC-01').toUpperCase(),
    factoryLocation: bayName,
    workPackageCode: t.workPackageCode,
    responsibleOfficer: `${t.supervisorName || 'Factory Supervisor'} (Supervisor) | Team: ${(t.assignedWorkerNames || []).join(', ') || 'Assigned Team'}`,
    strategyBox1Label: 'Type & Priority',
    strategyBox1Value: `${t.orderType || 'Work Order'} (${t.priority || 'High'})`,
    strategyBox2Label: 'Status',
    strategyBox2Value: t.stageStatus,
    strategyBox3Label: 'Schedule Type',
    strategyBox3Value: t.isCriticalPath ? 'Critical (0d Float)' : `Normal (${t.floatDays || 0}d Float)`,
    justificationOrNotes: `Flow: ${cleanWorkflow} | Machines: ${(t.assignedMachineNames || []).join(', ') || 'Standard Machine'} | Note: ${t.supervisorRemarks || 'On track'}`,
    specificationTerms: [
      {
        no: '2.1',
        title: 'Workers & Machines',
        content: `Workers: ${(t.assignedWorkerNames || []).join(', ') || 'Assigned Team'} | Machines: ${(t.assignedMachineNames || []).join(', ') || 'Assigned Machine'}`
      },
      {
        no: '2.2',
        title: 'Drawing Details',
        content: `Drawing: ${drawingNo} (${drawingRev}) | Checked: ${t.workerConfirmedLatestRevision ? 'Yes' : 'Pending'}`
      },
      {
        no: '2.3',
        title: 'Work Dates',
        content: `Start: ${t.startDate} | Target End: ${t.targetDate}`
      }
    ],
    scheduleRows: rows,
    summaryTotals: [
      { label: 'Planned Qty', value: `${t.plannedQuantity} ${t.unit}` },
      { label: 'Completed Qty', value: `${t.completedQuantity} ${t.unit}` },
      { label: 'Work Hours', value: `${t.actualHours} / ${t.plannedHours} Hrs` }
    ],
    editableFields: {
      title: t.title,
      status: t.stageStatus,
      quantity: t.plannedQuantity,
      date: t.targetDate,
      notes: t.supervisorRemarks
    }
  };
}

export function buildSubTaskDocSpec(
  stOrParent: FactoryTaskSubTask | FactoryExecutionTask,
  parentCodeOrSub?: string | FactoryTaskSubTask
): FactoryRecordDocumentSpec {
  const isFirstSubTask = 'subTaskCode' in stOrParent;
  const st: FactoryTaskSubTask = isFirstSubTask
    ? (stOrParent as FactoryTaskSubTask)
    : (parentCodeOrSub as FactoryTaskSubTask);
  const parentCode = isFirstSubTask
    ? typeof parentCodeOrSub === 'string'
      ? parentCodeOrSub
      : st.parentTaskId
    : (stOrParent as FactoryExecutionTask).taskCode;
  const projectName = isFirstSubTask ? st.projectId : (stOrParent as FactoryExecutionTask).projectName;
  const factoryName = isFirstSubTask ? st.factoryId : (stOrParent as FactoryExecutionTask).factoryName;

  return {
    entityType: 'SUB_TASK',
    recordId: st.id,
    docTitle: 'SUB-TASK SHEET',
    docNo: st.subTaskCode,
    docDate: st.startDate,
    projectName,
    projectId: st.projectId,
    factoryName,
    factoryCode: st.factoryId.toUpperCase(),
    factoryLocation: factoryName,
    workPackageCode: parentCode || 'SUB-TASK',
    responsibleOfficer: st.assignedPersonName,
    strategyBox1Label: 'Main Task',
    strategyBox1Value: `${parentCode}`,
    strategyBox2Label: 'Status',
    strategyBox2Value: st.status,
    strategyBox3Label: 'Priority',
    strategyBox3Value: st.isCriticalPath ? 'Critical' : 'Normal',
    justificationOrNotes: `Flow: ${st.workflowName} | Machine: ${st.assignedMachineName}`,
    specificationTerms: [
      {
        no: '3.1',
        title: 'Worker & Machine',
        content: `Worker: ${st.assignedPersonName} | Machine: ${st.assignedMachineName} | Flow: ${st.workflowName}`
      },
      {
        no: '3.2',
        title: 'Work Dates',
        content: `Start: ${st.startDate} | End: ${st.endDate}`
      }
    ],
    scheduleRows: [
      {
        no: '1.1',
        name: `${st.subTaskCode} — ${st.title}`,
        description: `Main Task: ${parentCode} | Machine: ${st.assignedMachineName}`,
        pvcCode: st.subTaskCode,
        unit: st.unit,
        qty: `${st.completedQty}/${st.plannedQty}`,
        rateOrMetric: st.assignedPersonName,
        amountOrStatus: st.status,
        isMain: true
      }
    ],
    summaryTotals: [
      { label: 'Planned Qty', value: `${st.plannedQty} ${st.unit}` },
      { label: 'Completed Qty', value: `${st.completedQty} ${st.unit}` }
    ],
    editableFields: {
      title: st.title,
      status: st.status,
      quantity: st.plannedQty,
      date: st.endDate,
      notes: st.workflowName
    }
  };
}

export function buildDailyReportDocSpec(r: DailyFactoryActivityReport): FactoryRecordDocumentSpec {
  return {
    entityType: 'DAILY_REPORT',
    recordId: r.id,
    docTitle: 'DAILY WORK REPORT',
    docNo: r.reportNo,
    docDate: r.date,
    projectName: r.projectName,
    projectId: r.projectId,
    factoryName: r.factoryName,
    factoryCode: r.factoryId.toUpperCase(),
    factoryLocation: `${r.factoryName} (${r.weatherOrShopCondition})`,
    workPackageCode: 'DAILY-LOG',
    responsibleOfficer: `${r.shiftSupervisor} (Supervisor)`,
    strategyBox1Label: 'Workers & Hours',
    strategyBox1Value: `${r.activeWorkersCount} Workers (${r.totalManHours} Hrs)`,
    strategyBox2Label: 'Status',
    strategyBox2Value: r.status,
    strategyBox3Label: 'Daily Output',
    strategyBox3Value: `${r.completedUnitsToday} / ${r.plannedUnitsToday} Units`,
    justificationOrNotes: r.supervisorComments,
    specificationTerms: [
      {
        no: '3.1',
        title: 'Work Done Today',
        content: `Planned: ${r.plannedActivitiesSummary}\nDone: ${r.completedActivitiesSummary}`
      },
      {
        no: '3.2',
        title: 'Materials & Machines Used',
        content: `Materials: ${r.materialsUsedSummary} | Machines: ${r.activeMachinesCount} (${r.machineHoursLogged} Hrs)`
      },
      {
        no: '3.3',
        title: 'Quality, Safety & Delays',
        content: `Quality: ${r.qualityIssuesSummary} | Safety: ${r.hseIssuesSummary} | Delays: ${r.delaysEncountered}`
      }
    ],
    scheduleRows: [
      {
        no: '1.1',
        name: `Daily Shift Work (${r.date})`,
        description: r.completedActivitiesSummary,
        pvcCode: r.reportNo,
        unit: 'Units',
        qty: `${r.completedUnitsToday}/${r.plannedUnitsToday}`,
        rateOrMetric: `${r.totalManHours} Hrs`,
        amountOrStatus: r.status,
        isMain: true
      }
    ],
    summaryTotals: [
      { label: 'Planned Today', value: `${r.plannedUnitsToday} Units` },
      { label: 'Completed Today', value: `${r.completedUnitsToday} Units` },
      { label: 'Total Hours', value: `${r.totalManHours} Hrs` }
    ],
    editableFields: {
      title: r.completedActivitiesSummary,
      status: r.status,
      quantity: r.completedUnitsToday,
      date: r.date,
      notes: r.supervisorComments
    }
  };
}

export function buildWorksheetDocSpec(w: DigitalWorksheetRecord): FactoryRecordDocumentSpec {
  const wAny = w as any;
  const docDate = w.workDate || wAny.date || '2026-09-26';
  const opStep = w.operationPerformed || wAny.operationStep || 'Shop-Floor Fabrication';
  const workstation = w.workstationOrMachine || wAny.workstationBay || w.factoryName || 'Bay A';
  const doneQty = w.outputQuantity ?? wAny.completedQty ?? 0;
  const targetQty = wAny.targetQty ?? doneQty;
  const unit = w.unit || 'Units';
  const status = w.verifiedBySupervisor ? 'Verified' : wAny.completionStatus || 'Submitted';
  const notes = w.qualityNotes || wAny.remarks || 'Verified on shop floor';

  return {
    entityType: 'WORKSHEET',
    recordId: w.id,
    docTitle: 'WORKSHEET RECORD',
    docNo: w.worksheetNo || 'DWS-001',
    docDate,
    projectName: w.projectName || 'Project',
    projectId: w.projectId || 'PRJ-2026-001',
    factoryName: w.factoryName || 'Factory',
    factoryCode: (w.factoryId || 'FAC-01').toUpperCase(),
    factoryLocation: workstation,
    workPackageCode: w.taskCode || 'TASK-01',
    responsibleOfficer: `${w.operatorName || wAny.workerName || 'Operator'} (${w.operatorId || wAny.workerEmployeeId || 'OP-01'}) | Checked: ${w.supervisorName || wAny.verifiedBySupervisorName || 'Supervisor'}`,
    strategyBox1Label: 'Shift & Bay',
    strategyBox1Value: `${w.shift || 'Day Shift'} — ${workstation}`,
    strategyBox2Label: 'Status',
    strategyBox2Value: status,
    strategyBox3Label: 'Hours Logged',
    strategyBox3Value: `${w.hoursWorked ?? wAny.totalHours ?? 8} Hrs`,
    justificationOrNotes: notes,
    specificationTerms: [
      {
        no: '3.1',
        title: 'Work Step & Drawing',
        content: `Step: ${opStep} | Task: ${w.taskCode || '-'} | Drawing: ${w.drawingNumber || wAny.drawingNumberUsed || 'AFC-DWG'} (${w.drawingRevision || wAny.drawingRevisionUsed || 'Rev A'})`
      },
      {
        no: '3.2',
        title: 'Material Batch & Quality Notes',
        content: `Batch: ${w.materialBatchCode || wAny.materialBatchLotNo || 'STD-LOT'} | Wastage: ${w.wastageQty ?? wAny.scrapOffcutKg ?? 0} | Notes: ${notes}`
      }
    ],
    scheduleRows: [
      {
        no: '1.1',
        name: `${w.worksheetNo || 'DWS'} — ${opStep}`,
        description: `Worker: ${w.operatorName || wAny.workerName || 'Operator'} (${w.hoursWorked ?? 8} Hrs) | Machine: ${workstation}`,
        pvcCode: w.worksheetNo || 'DWS-001',
        unit,
        qty: `${doneQty}/${targetQty}`,
        rateOrMetric: `Wastage: ${w.wastageQty ?? 0}`,
        amountOrStatus: status,
        isMain: true
      }
    ],
    summaryTotals: [
      { label: 'Target Qty', value: `${targetQty} ${unit}` },
      { label: 'Done Qty', value: `${doneQty} ${unit}` },
      { label: 'Work Hours', value: `${w.hoursWorked ?? 8} Hrs` }
    ],
    editableFields: {
      title: opStep,
      status,
      quantity: Number(doneQty) || 1,
      date: docDate,
      notes
    }
  };
}

export function buildOnsiteRecordDocSpec(o: FactoryOnsiteIncidentOrDamageRecord): FactoryRecordDocumentSpec {
  return {
    entityType: 'ONSITE_RECORD',
    recordId: o.id,
    docTitle: `${o.recordCategory.toUpperCase()} REPORT`,
    docNo: o.recordNo,
    docDate: o.date,
    projectName: o.projectName,
    projectId: o.projectId,
    factoryName: o.factoryName,
    factoryCode: o.factoryId.toUpperCase(),
    factoryLocation: o.factoryName,
    workPackageCode: o.taskCode,
    responsibleOfficer: `${o.reportedBy} (${o.reportedByRole})`,
    strategyBox1Label: 'Type & Level',
    strategyBox1Value: `${o.recordCategory} (${o.severity})`,
    strategyBox2Label: 'Status',
    strategyBox2Value: o.status,
    strategyBox3Label: 'Affected Qty',
    strategyBox3Value: `${o.affectedQty} ${o.unit}`,
    justificationOrNotes: `Cause: ${o.rootCause}\nFix Action: ${o.correctiveAction}`,
    specificationTerms: [
      {
        no: '3.1',
        title: 'Cause',
        content: o.rootCause
      },
      {
        no: '3.2',
        title: 'Fix Action',
        content: o.correctiveAction
      },
      {
        no: '3.3',
        title: 'Attached Files',
        content:
          (o.evidenceAttachments || [])
            .map(a => `${a.fileName} (${a.mediaKind}, ${a.fileSizeLabel})`)
            .join(', ') || 'No files'
      }
    ],
    scheduleRows: [
      {
        no: '1.1',
        name: `${o.recordNo} — ${o.title}`,
        description: `Task: ${o.taskCode} | Type: ${o.recordCategory} | Level: ${o.severity}`,
        pvcCode: o.recordNo,
        unit: o.unit,
        qty: o.affectedQty,
        rateOrMetric: o.severity,
        amountOrStatus: o.status,
        isMain: true
      }
    ],
    editableFields: {
      title: o.title,
      status: o.status,
      quantity: o.affectedQty,
      date: o.date,
      notes: o.correctiveAction
    }
  };
}

export function buildMediaEvidenceDocSpec(m: MediaEvidenceRecord): FactoryRecordDocumentSpec {
  return {
    entityType: 'MEDIA_EVIDENCE',
    recordId: m.id,
    docTitle: 'PHOTO & VIDEO PROOF SHEET',
    docNo: m.evidenceCode,
    docDate: m.capturedAt.slice(0, 10),
    projectName: m.projectName,
    projectId: m.projectId,
    factoryName: m.factoryName,
    factoryCode: m.factoryId.toUpperCase(),
    factoryLocation: m.gpsLocation || m.factoryName,
    workPackageCode: m.taskCode,
    responsibleOfficer: `${m.capturedByName} (${m.capturedByRole})`,
    strategyBox1Label: 'File Type',
    strategyBox1Value: m.mediaType,
    strategyBox2Label: 'QA Check',
    strategyBox2Value: m.verifiedByQa ? 'Checked' : 'Pending',
    strategyBox3Label: 'Stage',
    strategyBox3Value: m.stageCategory,
    justificationOrNotes: m.dimensionsVerifiedText,
    specificationTerms: [
      {
        no: '3.1',
        title: 'Work Details',
        content: `${m.description} (${m.activityName})`
      },
      {
        no: '3.2',
        title: 'File & Size Check',
        content: `File: ${m.fileName || m.evidenceCode} (${m.fileSizeLabel || '≤ 1 MB'}) | Check: ${m.dimensionsVerifiedText}`
      }
    ],
    scheduleRows: [
      {
        no: '1.1',
        name: `${m.evidenceCode} — ${m.activityName}`,
        description: m.description,
        pvcCode: m.evidenceCode,
        unit: m.mediaType,
        qty: 1,
        rateOrMetric: m.fileSizeLabel || 'Checked',
        amountOrStatus: m.verifiedByQa ? 'Checked' : 'Submitted',
        isMain: true
      }
    ],
    editableFields: {
      title: m.description,
      status: m.verifiedByQa ? 'Checked' : 'Submitted',
      quantity: 1,
      date: m.capturedAt.slice(0, 10),
      notes: m.dimensionsVerifiedText
    }
  };
}

export function buildResourceAllocationDocSpec(ra: ProjectResourceAllocationRecord): FactoryRecordDocumentSpec {
  return {
    entityType: 'RESOURCE_ALLOCATION',
    recordId: ra.id,
    docTitle: 'RESOURCE SHEET',
    docNo: ra.allocationCode,
    docDate: ra.updatedAt,
    projectName: ra.projectName,
    projectId: ra.projectId,
    factoryName: ra.factoryName,
    factoryCode: ra.factoryId.toUpperCase(),
    factoryLocation: ra.factoryName,
    workPackageCode: ra.workPackageId,
    responsibleOfficer: ra.managedBy,
    strategyBox1Label: 'Category',
    strategyBox1Value: ra.category,
    strategyBox2Label: 'Status',
    strategyBox2Value: ra.status,
    strategyBox3Label: 'Managed By',
    strategyBox3Value: ra.managedBy,
    justificationOrNotes: `Master ID: ${ra.masterRecordId} (${ra.resourceCode})`,
    specificationTerms: [
      {
        no: '3.1',
        title: 'Resource Info',
        content: `Item: ${ra.resourceName} (${ra.resourceCode}) | Managed By: ${ra.managedBy}`
      },
      {
        no: '3.2',
        title: 'Quantities',
        content: `Planned: ${ra.plannedQty} ${ra.unit} | Active: ${ra.issuedOrActiveQty} ${ra.unit} | Used: ${ra.consumedQty} ${ra.unit} | Waste: ${ra.wastageOrDamageQty} ${ra.unit}`
      }
    ],
    scheduleRows: [
      {
        no: '1.1',
        name: `${ra.resourceCode} — ${ra.resourceName}`,
        description: `Type: ${ra.category} | Managed By: ${ra.managedBy}`,
        pvcCode: ra.allocationCode,
        unit: ra.unit,
        qty: ra.plannedQty,
        rateOrMetric: `Rs. ${ra.unitCost.toLocaleString()}`,
        amountOrStatus: `Rs. ${ra.totalAllocatedCost.toLocaleString()}`,
        isMain: true
      }
    ],
    summaryTotals: [
      { label: 'Planned Qty', value: `${ra.plannedQty} ${ra.unit}` },
      { label: 'Unit Cost', value: `Rs. ${ra.unitCost.toLocaleString()}` },
      { label: 'Total Cost', value: `Rs. ${ra.totalAllocatedCost.toLocaleString()}` }
    ],
    editableFields: {
      title: ra.resourceName,
      status: ra.status,
      quantity: ra.plannedQty,
      date: ra.updatedAt,
      notes: ra.managedBy
    }
  };
}

export function buildQualityInspectionDocSpec(qi: FactoryQualityInspectionRecord): FactoryRecordDocumentSpec {
  const qiAny = qi as any;
  const rawList: any[] = qi.checklistResults || qiAny.checklistParameters || [];
  const checklistRows = rawList.map((cp: any, idx: number) => ({
    no: `1.${idx + 1}`,
    name: String(cp.item || cp.parameter || `Check ${idx + 1}`),
    description: `Rule: ${cp.standard || cp.specification || 'Standard'} | Measured: ${cp.measured || cp.actualMeasured || 'Verified'}`,
    pvcCode: `${qi.inspectionNo || 'FIR-001'}-${idx + 1}`,
    unit: 'Check',
    qty: 1,
    rateOrMetric: String(cp.measured || cp.actualMeasured || 'Verified'),
    amountOrStatus: String(cp.result || 'Pass'),
    isMain: idx === 0
  }));

  const qtySub = qi.qtySubmitted ?? qiAny.inspectedQuantity ?? 1;
  const qtyApp = qi.qtyApproved ?? qiAny.acceptedQuantity ?? qtySub;
  const qtyRew = qi.qtyReworkRequired ?? qiAny.reworkQuantity ?? 0;
  const qtyRej = qi.qtyRejected ?? qiAny.rejectedQuantity ?? 0;
  const unit = qiAny.unit || 'Units';
  const docDate = qi.inspectionDate || qi.requestDate || qiAny.date || '2026-09-26';
  const notes = qi.correctiveActionPlan || qi.defectDescription || qiAny.correctiveActionRequired || 'All quality checks verified.';

  return {
    entityType: 'QUALITY_INSPECTION',
    recordId: qi.id,
    docTitle: 'QUALITY CHECK REPORT (QC)',
    docNo: qi.inspectionNo || 'FIR-2026-001',
    docDate,
    projectName: qi.projectName || 'Project',
    projectId: qi.projectId || 'PRJ-2026-001',
    factoryName: qi.factoryName || 'Factory',
    factoryCode: (qi.factoryId || 'FAC-01').toUpperCase(),
    factoryLocation: qi.factoryName || 'Factory Floor',
    workPackageCode: qi.taskCode || 'TASK-01',
    responsibleOfficer: `${qi.inspectorName || 'QC Inspector'} (QC Inspector)`,
    strategyBox1Label: 'Check Stage',
    strategyBox1Value: qi.inspectionType || 'Factory QC Check',
    strategyBox2Label: 'Result',
    strategyBox2Value: qi.decision || 'Pending Inspection',
    strategyBox3Label: '1st / 2nd Approval',
    strategyBox3Value: `${qi.factoryManagerApproval?.isApproved ? '1st FM: Approved' : '1st FM: Pending'} | ${qi.pmOrAdminApproval?.isApproved ? '2nd PM: Approved' : '2nd PM: Pending'}`,
    justificationOrNotes: notes,
    specificationTerms: [
      {
        no: '3.1',
        title: 'Checked Quantities',
        content: `Checked: ${qtySub} ${unit} | Passed: ${qtyApp} ${unit} | Rework: ${qtyRew} ${unit} | Rejected: ${qtyRej} ${unit}`
      },
      {
        no: '3.2',
        title: '2-Step Checklist Approval Status',
        content: `1st Step (Factory Manager): ${qi.factoryManagerApproval?.isApproved ? `${qi.factoryManagerApproval.approvedByName} (${qi.factoryManagerApproval.approvedAt})` : 'Pending Factory Manager Check'} | 2nd Step (PM / Admin): ${qi.pmOrAdminApproval?.isApproved ? `${qi.pmOrAdminApproval.approvedByName} (${qi.pmOrAdminApproval.approvedAt})` : 'Waiting for PM/Admin Approval'}`
      }
    ],
    scheduleRows:
      checklistRows.length > 0
        ? checklistRows
        : [
            {
              no: '1.1',
              name: `${qi.inspectionNo || 'FIR'} — ${qi.taskCode || 'Task QC'}`,
              description: qi.inspectionType || 'Quality Inspection',
              pvcCode: qi.inspectionNo || 'FIR-001',
              unit,
              qty: qtySub,
              rateOrMetric: `Pass: ${qtyApp}`,
              amountOrStatus: qi.decision || 'Pending',
              isMain: true
            }
          ],
    summaryTotals: [
      { label: 'Checked Qty', value: `${qtySub} ${unit}` },
      { label: 'Passed Qty', value: `${qtyApp} ${unit}` },
      { label: 'Final Result', value: qi.decision || 'Pending' }
    ],
    editableFields: {
      title: qi.inspectorName || 'QC Inspector',
      status: qi.decision || 'Pending',
      quantity: Number(qtyApp) || 1,
      date: docDate,
      notes
    }
  };
}

export function buildHseRecordDocSpec(hs: FactoryHseRecord): FactoryRecordDocumentSpec {
  return {
    entityType: 'HSE_RECORD',
    recordId: hs.id,
    docTitle: 'SAFETY CHECK RECORD (HSE)',
    docNo: hs.recordCode,
    docDate: hs.date,
    projectName: hs.projectName,
    projectId: hs.projectId,
    factoryName: hs.factoryName,
    factoryCode: hs.factoryId.toUpperCase(),
    factoryLocation: hs.factoryName,
    workPackageCode: 'HSE-CTRL',
    responsibleOfficer: 'Safety Officer',
    strategyBox1Label: 'Type',
    strategyBox1Value: 'Shop-Floor Safety',
    strategyBox2Label: 'Status',
    strategyBox2Value: hs.status,
    strategyBox3Label: 'Standard',
    strategyBox3Value: 'Safety Checked',
    specificationTerms: [
      {
        no: '3.1',
        title: 'Safety Check Scope',
        content: `${hs.title} — Checked at ${hs.factoryName} for ${hs.projectName}.`
      }
    ],
    scheduleRows: [
      {
        no: '1.1',
        name: `${hs.recordCode} — ${hs.title}`,
        description: `Factory: ${hs.factoryName} | Project: ${hs.projectName}`,
        pvcCode: hs.recordCode,
        unit: 'Check',
        qty: 1,
        rateOrMetric: hs.date,
        amountOrStatus: hs.status,
        isMain: true
      }
    ],
    editableFields: {
      title: hs.title,
      status: hs.status,
      quantity: 1,
      date: hs.date
    }
  };
}

export function buildDispatchDocSpec(d: FactoryDispatchAndSiteRecord): FactoryRecordDocumentSpec {
  const dAny = d as any;
  const docNo = d.dispatchNo || dAny.dispatchNoteNo || 'DSP-2026-001';
  const vehicle = d.vehicleRegistrationNo || dAny.vehiclePlateNo || 'WP LM-8821';
  const siteLoc = d.siteLocation || dAny.destinationSiteName || 'Project Site';
  const status = d.lifecycleStage || dAny.siteLogisticsStatus || 'Dispatched from Factory';
  const receiver = d.receivedByAtSite || dAny.receivedBySiteSupervisor || 'Site Engineer';

  const rows =
    d.dispatchLineItems && d.dispatchLineItems.length > 0
      ? d.dispatchLineItems.map((li: any, idx) => ({
          no: `1.${idx + 1}`,
          name: `${li.itemCode || `ITM-${idx + 1}`} — ${li.description || li.itemName || 'Dispatch Item'}`,
          description: `Type: ${li.itemCategory || 'Item'} | Size: ${li.specificationOrDimensions || li.dimensionsOrSpec || 'Standard'} | Crate: ${li.crateOrBatchNo || li.crateOrPalletNo || 'CRT-01'}`,
          pvcCode: `${docNo}-${li.itemCode || idx + 1}`,
          unit: li.unit || d.unit || 'Units',
          qty: li.dispatchedQty ?? 1,
          rateOrMetric: `${li.weightKg ?? li.totalWeightKg ?? 100} kg`,
          amountOrStatus: li.remarks || 'QC Passed',
          isMain: idx === 0
        }))
      : [
          {
            no: '1.1',
            name: d.itemDescription || 'Dispatched Items',
            description: `Packing List: ${d.packingListNo || '-'} | Gate Pass: ${d.gatePassNo || '-'}`,
            pvcCode: docNo,
            unit: d.unit || 'Units',
            qty: d.totalQuantityDispatched ?? 1,
            rateOrMetric: `${d.deliveryNoteNo || 'DN-01'}`,
            amountOrStatus: status,
            isMain: true
          }
        ];

  return {
    entityType: 'DISPATCH',
    recordId: d.id,
    docTitle: 'DELIVERY & DISPATCH NOTE',
    docNo,
    docDate: d.dispatchDate || '2026-09-26',
    projectName: d.projectName || 'Project',
    projectId: d.projectId || 'PRJ-2026-001',
    factoryName: d.factoryName || 'Factory',
    factoryCode: (d.factoryId || 'FAC-01').toUpperCase(),
    factoryLocation: `From ${d.factoryName || 'Factory'} to ${siteLoc}`,
    workPackageCode: d.workPackageId || dAny.workPackageCode || 'WP-01',
    responsibleOfficer: `Driver: ${d.driverName || 'Driver'} (${vehicle}) | Receiver: ${receiver}`,
    strategyBox1Label: 'Gate Pass',
    strategyBox1Value: `${d.packingListNo || 'PL-01'} / ${d.gatePassNo || 'GP-01'}`,
    strategyBox2Label: 'Status',
    strategyBox2Value: status,
    strategyBox3Label: 'Delivery Note',
    strategyBox3Value: `${d.deliveryNoteNo || docNo}`,
    justificationOrNotes: `Vehicle: ${vehicle} | Driver: ${d.driverName || '-'} | Site: ${siteLoc}`,
    specificationTerms: [
      {
        no: '3.1',
        title: 'Transport Details',
        content: `Gate Pass: ${d.gatePassNo || '-'} | Packing List: ${d.packingListNo || '-'} | Vehicle: ${vehicle} | Driver: ${d.driverName || '-'}`
      },
      {
        no: '3.2',
        title: 'Site Delivery & Install',
        content: `Site: ${siteLoc} | Sent: ${d.totalQuantityDispatched ?? 0} ${d.unit || 'Units'} | Installed: ${d.installedQuantity ?? 0} ${d.unit || 'Units'}`
      }
    ],
    scheduleRows: rows,
    summaryTotals: [
      { label: 'Delivery Note', value: `${d.deliveryNoteNo || docNo}` },
      { label: 'Sent Qty', value: `${d.totalQuantityDispatched ?? 0} ${d.unit || 'Units'}` },
      { label: 'Installed Qty', value: `${d.installedQuantity ?? 0} ${d.unit || 'Units'}` }
    ],
    editableFields: {
      title: d.itemDescription || 'Dispatch',
      status,
      quantity: d.totalQuantityDispatched ?? 1,
      date: d.dispatchDate || '2026-09-26',
      notes: siteLoc
    }
  };
}

export function buildTechnicalDocumentDocSpec(doc: ControlledTechnicalDocument): FactoryRecordDocumentSpec {
  return {
    entityType: 'TECHNICAL_DOCUMENT',
    recordId: doc.id,
    docTitle: `${doc.category.toUpperCase()} SHEET`,
    docNo: doc.docNumber,
    docDate: doc.audit?.updatedAt?.slice(0, 10) || '2026-09-26',
    projectName: doc.projectName,
    projectId: doc.projectId,
    factoryName: doc.factoryName,
    factoryCode: doc.factoryId.toUpperCase(),
    factoryLocation: doc.factoryName,
    workPackageCode: doc.workPackageId,
    responsibleOfficer: `${doc.audit?.updatedBy || 'Engineer'} (${doc.audit?.updatedByRole || 'Engineering'})`,
    strategyBox1Label: 'Category',
    strategyBox1Value: doc.category,
    strategyBox2Label: 'Status',
    strategyBox2Value: doc.approvalStatus,
    strategyBox3Label: 'Revision',
    strategyBox3Value: doc.currentRevision,
    justificationOrNotes: doc.technicalInstructions,
    specificationTerms: [
      {
        no: '3.1',
        title: 'Work Instructions',
        content: doc.technicalInstructions
      },
      {
        no: '3.2',
        title: 'File Details',
        content: `Sent To: ${(doc.distributedToFactories || []).join(', ')} | Size: ${doc.fileSize || 'PDF/CAD'}`
      }
    ],
    scheduleRows: [
      {
        no: '1.1',
        name: `${doc.docNumber} — ${doc.title}`,
        description: `${doc.category} (${doc.currentRevision}) — ${doc.technicalInstructions}`,
        pvcCode: doc.docNumber,
        unit: 'Doc',
        qty: 1,
        rateOrMetric: doc.currentRevision,
        amountOrStatus: doc.approvalStatus,
        isMain: true
      }
    ],
    editableFields: {
      title: doc.title,
      status: doc.approvalStatus,
      quantity: 1,
      date: doc.audit?.updatedAt?.slice(0, 10) || '2026-09-26',
      notes: doc.technicalInstructions
    }
  };
}

export function buildGeneratedDocumentDocSpec(gd: GeneratedFactoryDocument): FactoryRecordDocumentSpec {
  const entries = Object.entries(gd.summaryData || {});
  return {
    entityType: 'GENERATED_DOCUMENT',
    recordId: gd.id,
    docTitle: gd.docType.toUpperCase(),
    docNo: gd.docControlNo,
    docDate: gd.generatedAt.slice(0, 10),
    projectName: gd.projectName,
    projectId: gd.projectId,
    factoryName: gd.factoryName,
    factoryCode: gd.factoryId.toUpperCase(),
    factoryLocation: gd.factoryName,
    workPackageCode: gd.workPackageCode || gd.taskCode || 'DOC-CTRL',
    responsibleOfficer: gd.generatedBy,
    strategyBox1Label: 'Doc Type',
    strategyBox1Value: gd.docType,
    strategyBox2Label: 'Status',
    strategyBox2Value: gd.status,
    strategyBox3Label: 'Revision',
    strategyBox3Value: gd.revision,
    specificationTerms: entries.map(([k, v], idx) => ({
      no: `3.${idx + 1}`,
      title: k,
      content: String(v)
    })),
    scheduleRows: [
      {
        no: '1.1',
        name: `${gd.docControlNo} — ${gd.title}`,
        description: `Type: ${gd.docType} | By: ${gd.generatedBy}`,
        pvcCode: gd.docControlNo,
        unit: 'Doc',
        qty: 1,
        rateOrMetric: gd.revision,
        amountOrStatus: gd.status,
        isMain: true
      }
    ],
    editableFields: {
      title: gd.title,
      status: gd.status,
      quantity: 1,
      date: gd.generatedAt.slice(0, 10)
    }
  };
}

export function buildPartnerDocSpec(p: FactoryPartnerRegistrationRecord): FactoryRecordDocumentSpec {
  return {
    entityType: 'PARTNER',
    recordId: p.id,
    docTitle: 'PARTNER RECORD',
    docNo: p.partnerCode,
    docDate: p.registeredAt,
    projectName: p.linkedProjectName,
    projectId: p.linkedProjectId,
    clientName: p.partnerName,
    factoryName: p.linkedFactoryName,
    factoryCode: p.linkedFactoryId.toUpperCase(),
    factoryLocation: `${p.city} (${p.phone})`,
    workPackageCode: p.contractOrAgreementRef,
    responsibleOfficer: `${p.contactPerson} (${p.partnerType})`,
    strategyBox1Label: 'Type',
    strategyBox1Value: p.partnerType,
    strategyBox2Label: 'Status',
    strategyBox2Value: p.status,
    strategyBox3Label: 'Score',
    strategyBox3Value: `${p.ratingScore}%`,
    justificationOrNotes: `Contract: ${p.contractOrAgreementRef} | Scope: ${p.materialsOrServicesScope}`,
    specificationTerms: [
      {
        no: '3.1',
        title: 'Contact Info',
        content: `Partner: ${p.partnerName} | Contact: ${p.contactPerson} | Phone: ${p.phone} | Email: ${p.email}`
      },
      {
        no: '3.2',
        title: 'Work & Supply Scope',
        content: `${p.materialsOrServicesScope} (Ref: ${p.contractOrAgreementRef})`
      }
    ],
    scheduleRows: [
      {
        no: '1.1',
        name: `${p.partnerCode} — ${p.partnerName}`,
        description: `${p.partnerType}: ${p.materialsOrServicesScope}`,
        pvcCode: p.partnerCode,
        unit: 'Partner',
        qty: 1,
        rateOrMetric: `${p.ratingScore}%`,
        amountOrStatus: p.status,
        isMain: true
      }
    ],
    editableFields: {
      title: p.partnerName,
      status: p.status,
      quantity: 1,
      date: p.registeredAt,
      notes: p.materialsOrServicesScope
    }
  };
}

export function buildGenericResourceDocSpec(input: {
  id: string;
  code: string;
  title: string;
  category: string;
  factoryName: string;
  projectName: string;
  governance: string;
  status: string;
  fields: Array<{ label: string; value: string | number }>;
}): FactoryRecordDocumentSpec {
  return {
    entityType: 'RESOURCE_ALLOCATION',
    recordId: input.id,
    docTitle: 'RESOURCE SHEET',
    docNo: input.code,
    docDate: new Date().toISOString().slice(0, 10),
    projectName: input.projectName,
    projectId: 'PRJ-2026-001',
    factoryName: input.factoryName,
    factoryCode: 'FAC-RES',
    factoryLocation: input.factoryName,
    workPackageCode: 'RES-MASTER',
    responsibleOfficer: input.governance,
    strategyBox1Label: 'Category',
    strategyBox1Value: input.category,
    strategyBox2Label: 'Status',
    strategyBox2Value: input.status,
    strategyBox3Label: 'Managed By',
    strategyBox3Value: input.governance,
    specificationTerms: input.fields.map((f, idx) => ({
      no: `3.${idx + 1}`,
      title: f.label,
      content: String(f.value)
    })),
    scheduleRows: [
      {
        no: '1.1',
        name: `${input.code} — ${input.title}`,
        description: input.fields.map(f => `${f.label}: ${f.value}`).join(' | '),
        pvcCode: input.code,
        unit: 'Unit',
        qty: 1,
        rateOrMetric: input.governance,
        amountOrStatus: input.status,
        isMain: true
      }
    ],
    editableFields: {
      title: input.title,
      status: input.status,
      quantity: 1,
      date: new Date().toISOString().slice(0, 10),
      notes: input.governance
    }
  };
}

export const buildDailyLogDocSpec = buildDailyReportDocSpec;
export const buildEvidenceDocSpec = buildMediaEvidenceDocSpec;
export const buildInspectionDocSpec = buildQualityInspectionDocSpec;
export const buildOnsiteIncidentDocSpec = buildOnsiteRecordDocSpec;
export const buildHseDocSpec = buildHseRecordDocSpec;

export function buildSupervisorAssignmentDocSpec(
  sa: FactoryProjectSupervisorAssignment
): FactoryRecordDocumentSpec {
  return {
    entityType: 'SUPERVISOR_ASSIGNMENT',
    recordId: sa.id,
    docTitle: 'FACTORY SUPERVISOR AUTHORITY CHARTER',
    docNo: sa.assignmentCode,
    docDate: sa.assignedAt,
    projectName: sa.projectName,
    projectId: sa.projectId,
    factoryName: sa.factoryName,
    factoryCode: sa.factoryId.toUpperCase(),
    factoryLocation: `${sa.factoryName} (${sa.ownershipType})`,
    workPackageCode: sa.workPackageId,
    responsibleOfficer: `${sa.fullName} (@${sa.username} | ${sa.employeeId})`,
    strategyBox1Label: 'Supervising Role',
    strategyBox1Value: sa.supervisingRole,
    strategyBox2Label: 'FM Authority',
    strategyBox2Value: sa.hasFactoryManagerAuthority ? 'Full Factory Manager Authority' : 'Scoped Authority',
    strategyBox3Label: 'Status',
    strategyBox3Value: sa.status,
    justificationOrNotes: `Assigned by ${sa.assignedBy} on ${sa.assignedAt} for Factory ${sa.factoryName} & Project ${sa.projectName}`,
    specificationTerms: [
      {
        no: '3.1',
        title: 'Assigned Officer & Project Scope',
        content: `Officer: ${sa.fullName} (${sa.roleName}) | Email: ${sa.email} | Phone: ${sa.phone} | Factory: ${sa.factoryName} | Project: ${sa.projectName}`
      },
      {
        no: '3.2',
        title: 'Individual Authority Matrix',
        content: `Factory Manager Authority: ${sa.hasFactoryManagerAuthority ? 'YES' : 'NO'} | Tasks: ${sa.permissions.canManageTasksAndChecklists ? 'Yes' : 'No'} | QC/NCR: ${sa.permissions.canManageQualityAndNcr ? 'Yes' : 'No'} | Procurement: ${sa.permissions.canManageProcurement ? 'Yes' : 'No'} | HR/Payroll: ${sa.permissions.canManageHrAndPayroll ? 'Yes' : 'No'} | Finance/Invoices: ${sa.permissions.canManageFinanceAndInvoices ? 'Yes' : 'No'} | Contracts: ${sa.permissions.canManageContractsAndAgreements ? 'Yes' : 'No'}`
      }
    ],
    scheduleRows: [
      {
        no: '1.1',
        name: `${sa.assignmentCode} — ${sa.fullName}`,
        description: `${sa.supervisingRole} on ${sa.projectName} (${sa.factoryName})`,
        pvcCode: sa.assignmentCode,
        unit: 'Officer',
        qty: 1,
        rateOrMetric: sa.hasFactoryManagerAuthority ? 'FM Authority' : 'Supervisor',
        amountOrStatus: sa.status,
        isMain: true
      }
    ],
    editableFields: {
      title: sa.fullName,
      status: sa.status,
      quantity: 1,
      date: sa.assignedAt,
      notes: `${sa.supervisingRole} (${sa.projectName})`
    }
  };
}

export function buildFactoryProcurementDocSpec(
  pr: FactoryProcurementRecord
): FactoryRecordDocumentSpec {
  const acceptedAmount = Math.round(pr.acceptedQty * pr.unitRate);
  const rejectedAmount = Math.round(pr.rejectedQty * pr.unitRate);

  return {
    entityType: 'FACTORY_PROCUREMENT',
    recordId: pr.id,
    docTitle: `FACTORY PROCUREMENT — ${pr.stageType.toUpperCase()}`,
    docNo: pr.docCode,
    docDate: pr.date,
    projectName: pr.projectName,
    projectId: pr.projectId,
    factoryName: pr.factoryName,
    factoryCode: pr.factoryId.toUpperCase(),
    factoryLocation: `${pr.factoryName} (${pr.ownershipType})`,
    workPackageCode: pr.linkedRefCode,
    responsibleOfficer: pr.inspectorOrOfficer,
    strategyBox1Label: 'Stage',
    strategyBox1Value: pr.stageType,
    strategyBox2Label: 'Status',
    strategyBox2Value: pr.status,
    strategyBox3Label: 'Total Value',
    strategyBox3Value: `LKR ${pr.totalAmount.toLocaleString()}`,
    justificationOrNotes: `${pr.remarks} | Vendor/Partner: ${pr.supplierOrPartnerName} | Inspection Officer: ${pr.inspectorOrOfficer}`,
    specificationTerms: [
      {
        no: '3.1',
        title: 'Supplier / Partner & Reference',
        content: `Counterparty: ${pr.supplierOrPartnerName} | Linked Ref: ${pr.linkedRefCode} | Officer: ${pr.inspectorOrOfficer} | Date: ${pr.date}`
      },
      {
        no: '3.2',
        title: 'Quantities & Material Details',
        content: `Description: ${pr.itemSummary} | Unit: ${pr.unit} | Planned Qty: ${pr.quantity} | Accepted: ${pr.acceptedQty} | Rejected: ${pr.rejectedQty}`
      },
      {
        no: '3.3',
        title: 'Valuation & Accounting',
        content: `Unit Rate: LKR ${pr.unitRate.toLocaleString()} | Gross Total: LKR ${pr.totalAmount.toLocaleString()} | Accepted Value: LKR ${acceptedAmount.toLocaleString()} | Rejected Value: LKR ${rejectedAmount.toLocaleString()}`
      }
    ],
    scheduleRows: [
      {
        no: '1.1',
        name: `${pr.docCode} — ${pr.title}`,
        description: `Scope: ${pr.itemSummary} | Supplier: ${pr.supplierOrPartnerName}`,
        pvcCode: pr.docCode,
        unit: pr.unit,
        qty: pr.quantity,
        rateOrMetric: `LKR ${pr.unitRate.toLocaleString()}`,
        amountOrStatus: `LKR ${pr.totalAmount.toLocaleString()}`,
        isMain: true
      },
      {
        no: '1.2',
        name: 'Delivered & Accepted Quality Goods',
        description: `Passed inspection criteria according to standard specifications`,
        pvcCode: `${pr.docCode}-ACC`,
        unit: pr.unit,
        qty: pr.acceptedQty,
        rateOrMetric: `LKR ${pr.unitRate.toLocaleString()}`,
        amountOrStatus: `LKR ${acceptedAmount.toLocaleString()} (Accepted)`
      },
      {
        no: '1.3',
        name: 'Defective / Rejected Items (Quarantined)',
        description: `Quarantined or returned to vendor for replacement / credit note`,
        pvcCode: `${pr.docCode}-REJ`,
        unit: pr.unit,
        qty: pr.rejectedQty,
        rateOrMetric: `LKR ${pr.unitRate.toLocaleString()}`,
        amountOrStatus: `LKR ${rejectedAmount.toLocaleString()} (Rejected)`
      },
      {
        no: '1.4',
        name: 'Net Certified Goods Invoiced Amount',
        description: `Net payable certified for invoice processing and inventory ledger`,
        pvcCode: `${pr.docCode}-NET`,
        unit: 'LKR',
        qty: 1,
        rateOrMetric: 'Certified',
        amountOrStatus: `LKR ${acceptedAmount.toLocaleString()} (${pr.status})`,
        isMain: true
      }
    ],
    summaryTotals: [
      { label: 'Total Purchase Order', value: `LKR ${pr.totalAmount.toLocaleString()}` },
      { label: 'Accepted Goods Value', value: `LKR ${acceptedAmount.toLocaleString()}` },
      { label: 'Rejected Defectives', value: `LKR ${rejectedAmount.toLocaleString()}` },
      { label: 'Net Payable', value: `LKR ${acceptedAmount.toLocaleString()}` }
    ],
    editableFields: {
      title: pr.title,
      status: pr.status,
      quantity: pr.quantity,
      date: pr.date,
      notes: pr.remarks
    }
  };
}

export function buildFactoryHrPayrollDocSpec(
  hr: FactoryHrPayrollRecord
): FactoryRecordDocumentSpec {
  const dailyRate = Math.round(hr.basicSalary / (hr.daysWorked || 26));
  const hourlyOtRate = hr.overtimeHours > 0 ? Math.round(hr.overtimePay / hr.overtimeHours) : 0;
  const epfEmployeeRate = Math.round(hr.basicSalary * 0.08);
  const epfEmployerRate = Math.round(hr.basicSalary * 0.12);
  const etfEmployerRate = Math.round(hr.basicSalary * 0.03);
  const grossEarnings = hr.basicSalary + hr.overtimePay + hr.projectAllowance;

  return {
    entityType: 'FACTORY_HR_PAYROLL',
    recordId: hr.id,
    docTitle: 'FACTORY EMPLOYEE SALARY PAYSLIP',
    docNo: hr.payrollCode,
    docDate: hr.updatedAt ? hr.updatedAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
    projectName: hr.projectName,
    projectId: hr.projectId,
    factoryName: hr.factoryName,
    factoryCode: hr.factoryId.toUpperCase(),
    factoryLocation: `${hr.factoryName} (${hr.ownershipType})`,
    workPackageCode: hr.workPackageId,
    responsibleOfficer: `${hr.employeeName} (${hr.employeeId} — ${hr.roleOrTrade})`,
    strategyBox1Label: 'Pay Period',
    strategyBox1Value: hr.payPeriod,
    strategyBox2Label: 'Status',
    strategyBox2Value: hr.status,
    strategyBox3Label: 'Net Pay',
    strategyBox3Value: `LKR ${hr.netPay.toLocaleString()}`,
    justificationOrNotes: `Department: ${hr.department} | Trade: ${hr.roleOrTrade} | Worked: ${hr.daysWorked} days (${hr.attendanceRatePct}% Attendance) | Overtime: ${hr.overtimeHours} hrs | Payment Status: ${hr.status}`,
    specificationTerms: [
      {
        no: '3.1',
        title: 'Employee Details & Assignment',
        content: `Employee: ${hr.employeeName} | ID: ${hr.employeeId} | Trade / Role: ${hr.roleOrTrade} | Department: ${hr.department} | Factory: ${hr.factoryName} | Project: ${hr.projectName}`
      },
      {
        no: '3.2',
        title: 'Attendance & Time Record',
        content: `Pay Period: ${hr.payPeriod} | Days Worked: ${hr.daysWorked} Days | Attendance Ratio: ${hr.attendanceRatePct}% | Overtime Hours Logged: ${hr.overtimeHours} Hours`
      },
      {
        no: '3.3',
        title: 'Statutory Compliance (Sri Lanka Labour Law)',
        content: `EPF Employee: 8% (LKR ${epfEmployeeRate.toLocaleString()}) | EPF Employer: 12% (LKR ${epfEmployerRate.toLocaleString()}) | ETF Employer: 3% (LKR ${etfEmployerRate.toLocaleString()}) | Combined Deduction: LKR ${hr.epfEtfDeduction.toLocaleString()}`
      }
    ],
    scheduleRows: [
      {
        no: '1.1',
        name: 'Basic Wages / Salary',
        description: `Basic remuneration for ${hr.daysWorked} days worked at factory line`,
        pvcCode: `${hr.payrollCode}-BASIC`,
        unit: 'Days',
        qty: hr.daysWorked,
        rateOrMetric: `LKR ${dailyRate.toLocaleString()}/day`,
        amountOrStatus: `LKR ${hr.basicSalary.toLocaleString()}`,
        isMain: true
      },
      {
        no: '1.2',
        name: 'Overtime Shift Allowances (OT)',
        description: `Overtime production hours verified by shift supervisor`,
        pvcCode: `${hr.payrollCode}-OT`,
        unit: 'Hours',
        qty: hr.overtimeHours,
        rateOrMetric: hourlyOtRate > 0 ? `LKR ${hourlyOtRate.toLocaleString()}/hr` : 'Standard OT',
        amountOrStatus: `LKR ${hr.overtimePay.toLocaleString()}`
      },
      {
        no: '1.3',
        name: 'Factory Site & Project Allowance',
        description: `Project execution and specialized fabrication incentive allowance`,
        pvcCode: `${hr.payrollCode}-ALLW`,
        unit: 'Allowance',
        qty: 1,
        rateOrMetric: `LKR ${hr.projectAllowance.toLocaleString()}`,
        amountOrStatus: `LKR ${hr.projectAllowance.toLocaleString()}`
      },
      {
        no: '1.4',
        name: 'Gross Remuneration Total',
        description: `Total gross remuneration prior to statutory deductions`,
        pvcCode: `${hr.payrollCode}-GROSS`,
        unit: 'Gross',
        qty: 1,
        rateOrMetric: 'Total Earnings',
        amountOrStatus: `LKR ${grossEarnings.toLocaleString()}`,
        isMain: true
      },
      {
        no: '1.5',
        name: 'Employee Statutory EPF Deduction (8%)',
        description: `Employee statutory Employees' Provident Fund contribution`,
        pvcCode: `${hr.payrollCode}-EPF8`,
        unit: 'Deduction',
        qty: 1,
        rateOrMetric: '8.0%',
        amountOrStatus: `-LKR ${epfEmployeeRate.toLocaleString()}`
      },
      {
        no: '1.6',
        name: 'Total Statutory Deductions (EPF/ETF)',
        description: `Statutory deductions remitted to Central Bank of Sri Lanka`,
        pvcCode: `${hr.payrollCode}-DED`,
        unit: 'Deduction',
        qty: 1,
        rateOrMetric: 'Statutory',
        amountOrStatus: `-LKR ${hr.epfEtfDeduction.toLocaleString()}`
      },
      {
        no: '1.7',
        name: 'Employer EPF (12%) & ETF (3%) Contribution',
        description: `Employer statutory contribution benefits (EPF 12% + ETF 3%)`,
        pvcCode: `${hr.payrollCode}-EMPBEN`,
        unit: 'Statutory Fund',
        qty: 1,
        rateOrMetric: '15.0%',
        amountOrStatus: `+LKR ${(epfEmployerRate + etfEmployerRate).toLocaleString()}`
      },
      {
        no: '1.8',
        name: 'Net Payable Remuneration (Take-Home Pay)',
        description: `Net remuneration credited to employee bank account`,
        pvcCode: `${hr.payrollCode}-NET`,
        unit: 'Net Pay',
        qty: 1,
        rateOrMetric: 'Bank Transfer',
        amountOrStatus: `LKR ${hr.netPay.toLocaleString()}`,
        isMain: true
      }
    ],
    summaryTotals: [
      { label: 'Basic Salary', value: `LKR ${hr.basicSalary.toLocaleString()}` },
      { label: 'Gross Earnings', value: `LKR ${grossEarnings.toLocaleString()}` },
      { label: 'Statutory Deductions', value: `LKR ${hr.epfEtfDeduction.toLocaleString()}` },
      { label: 'Net Payable Salary', value: `LKR ${hr.netPay.toLocaleString()}` }
    ],
    editableFields: {
      title: hr.employeeName,
      status: hr.status,
      quantity: hr.daysWorked,
      date: hr.updatedAt,
      notes: `Net Pay: LKR ${hr.netPay.toLocaleString()}`
    }
  };
}

export function buildFactoryFinanceDocSpec(
  fn: FactoryFinanceAccountingRecord
): FactoryRecordDocumentSpec {
  return {
    entityType: 'FACTORY_FINANCE_CONTRACT',
    recordId: fn.id,
    docTitle: `FACTORY ${fn.recordCategory.replace(/_/g, ' ').toUpperCase()}`,
    docNo: fn.recordCode,
    docDate: fn.date,
    projectName: fn.projectName,
    projectId: fn.projectId,
    factoryName: fn.factoryName,
    factoryCode: fn.factoryId.toUpperCase(),
    factoryLocation: `${fn.factoryName} (${fn.ownershipType})`,
    workPackageCode: fn.referenceDocCode,
    responsibleOfficer: `${fn.preparedBy}${fn.approvedBy ? ` | Approved: ${fn.approvedBy}` : ''}`,
    strategyBox1Label: 'Category',
    strategyBox1Value: `${fn.recordCategory} (${fn.subType})`,
    strategyBox2Label: 'Status',
    strategyBox2Value: fn.status,
    strategyBox3Label: 'Net Amount',
    strategyBox3Value: `LKR ${fn.netAmount.toLocaleString()}`,
    justificationOrNotes: `${fn.description} | Counterparty: ${fn.counterpartyName} | Due / Expiry Date: ${fn.dueDateOrExpiry}`,
    specificationTerms: [
      {
        no: '3.1',
        title: 'Counterparty & Contract / Document Reference',
        content: `Counterparty: ${fn.counterpartyName} | Reference Code: ${fn.referenceDocCode} | Category: ${fn.recordCategory} | Sub-Type: ${fn.subType}`
      },
      {
        no: '3.2',
        title: 'Schedule & Milestone Dates',
        content: `Entry Date: ${fn.date} | Due Date / Expiry: ${fn.dueDateOrExpiry} | Prepared By: ${fn.preparedBy} | Approved By: ${fn.approvedBy || 'Pending Approval'}`
      },
      {
        no: '3.3',
        title: 'Financial Breakdown',
        content: `Gross Value: LKR ${fn.grossAmount.toLocaleString()} | Tax/VAT: LKR ${fn.taxOrVatAmount.toLocaleString()} | Retention/Deduction: LKR ${fn.retentionOrDeductionAmount.toLocaleString()} | Net Certified Amount: LKR ${fn.netAmount.toLocaleString()}`
      }
    ],
    scheduleRows: [
      {
        no: '1.1',
        name: `${fn.recordCode} — ${fn.title}`,
        description: `Scope: ${fn.description} | Category: ${fn.recordCategory} (${fn.subType})`,
        pvcCode: fn.recordCode,
        unit: 'Scope',
        qty: 1,
        rateOrMetric: `LKR ${fn.grossAmount.toLocaleString()}`,
        amountOrStatus: `LKR ${fn.grossAmount.toLocaleString()}`,
        isMain: true
      },
      {
        no: '1.2',
        name: 'Government Taxes & VAT Assessment',
        description: `Value Added Tax & Social Security Contribution Levy (VAT/SSCL)`,
        pvcCode: `${fn.recordCode}-TAX`,
        unit: 'Tax',
        qty: 1,
        rateOrMetric: 'Statutory VAT',
        amountOrStatus: `+LKR ${fn.taxOrVatAmount.toLocaleString()}`
      },
      {
        no: '1.3',
        name: 'Contractual Retention & Deduction',
        description: `Performance retention or advance deduction as per contract clause`,
        pvcCode: `${fn.recordCode}-RET`,
        unit: 'Retention',
        qty: 1,
        rateOrMetric: 'Contract Clause',
        amountOrStatus: `-LKR ${fn.retentionOrDeductionAmount.toLocaleString()}`
      },
      {
        no: '1.4',
        name: 'Net Certified & Payable Settlement',
        description: `Net payable certified for invoice settlement or agreement disbursement`,
        pvcCode: `${fn.recordCode}-NET`,
        unit: 'Net Amount',
        qty: 1,
        rateOrMetric: 'Certified',
        amountOrStatus: `LKR ${fn.netAmount.toLocaleString()} (${fn.status})`,
        isMain: true
      }
    ],
    summaryTotals: [
      { label: 'Gross Amount', value: `LKR ${fn.grossAmount.toLocaleString()}` },
      { label: 'Taxes / VAT', value: `LKR ${fn.taxOrVatAmount.toLocaleString()}` },
      { label: 'Retention Deduction', value: `LKR ${fn.retentionOrDeductionAmount.toLocaleString()}` },
      { label: 'Net Certified Amount', value: `LKR ${fn.netAmount.toLocaleString()}` }
    ],
    editableFields: {
      title: fn.title,
      status: fn.status,
      quantity: 1,
      date: fn.date,
      notes: fn.description
    }
  };
}

export function buildChecklistDocSpec(
  qcState: TaskOrSubTaskQcState
): FactoryRecordDocumentSpec {
  const checkedItems = (qcState.checklistItems || []).filter(i => i.checked).length;
  const totalItems = (qcState.checklistItems || []).length;
  const passedPct = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

  const rows: FactoryRecordDocumentSpec['scheduleRows'] = (qcState.checklistItems || []).map((item, idx) => ({
    no: `1.${idx + 1}`,
    name: item.parameter,
    description: `Specification: ${item.standardSpecification}${item.checkedBy ? ` | Checked by: ${item.checkedBy} on ${item.checkedAt ? item.checkedAt.slice(0, 10) : ''}` : ''}`,
    pvcCode: `${qcState.targetCode}-CHK-${String(idx + 1).padStart(2, '0')}`,
    unit: 'Check',
    qty: 1,
    rateOrMetric: item.standardSpecification,
    amountOrStatus: item.checked ? 'PASSED / VERIFIED' : 'PENDING CHECK',
    isMain: idx === 0
  }));

  return {
    entityType: qcState.targetType === 'TASK' ? 'TASK' : 'SUB_TASK',
    recordId: qcState.targetId,
    docTitle: `QUALITY & EXECUTION CHECKLIST — ${qcState.targetCode}`,
    docNo: `${qcState.targetCode}-CHK`,
    docDate: qcState.submittedAt ? qcState.submittedAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
    projectName: qcState.projectName,
    projectId: qcState.projectId,
    factoryName: qcState.factoryName,
    factoryCode: qcState.factoryId.toUpperCase(),
    factoryLocation: `${qcState.factoryName} — Main Bay`,
    workPackageCode: qcState.workPackageId,
    responsibleOfficer: qcState.approvedByName || qcState.submittedByFactoryManagerName || 'Factory Manager & QA Lead',
    strategyBox1Label: 'Target Code',
    strategyBox1Value: `${qcState.targetCode} (${qcState.targetType})`,
    strategyBox2Label: 'QC Status',
    strategyBox2Value: qcState.qcStatus,
    strategyBox3Label: 'Compliance',
    strategyBox3Value: `${checkedItems}/${totalItems} Checks (${passedPct}%)`,
    justificationOrNotes: `Checklist for ${qcState.targetTitle}. 1st Step FM Check: ${qcState.factoryManagerApproval?.isApproved ? 'Approved' : 'Pending'} | 2nd Step PM/Admin: ${qcState.pmOrAdminApproval?.isApproved ? 'Approved' : 'Pending'}`,
    specificationTerms: [
      {
        no: '3.1',
        title: 'Checklist Scope & Target Details',
        content: `Target: ${qcState.targetTitle} (${qcState.targetCode}) | Scope: ${qcState.targetType} | Factory: ${qcState.factoryName} | Project: ${qcState.projectName}`
      },
      {
        no: '3.2',
        title: 'Two-Step Verification Gate',
        content: `1st Step Factory Manager: ${qcState.factoryManagerApproval?.isApproved ? `Approved by ${qcState.factoryManagerApproval.approvedByName} (${qcState.factoryManagerApproval.approvedAt})` : 'Pending Check & Evidence'} | 2nd Step PM/Admin: ${qcState.pmOrAdminApproval?.isApproved ? `Approved by ${qcState.pmOrAdminApproval.approvedByName} (${qcState.pmOrAdminApproval.approvedAt})` : 'Pending Final Approval'}`
      },
      {
        no: '3.3',
        title: 'Inspection Standard',
        content: 'Conducted under ISO 9001:2015 Quality Management Standards, project AFC fabrication drawings, and certified method statements.'
      }
    ],
    scheduleRows: rows,
    summaryTotals: [
      { label: 'Total Parameters', value: String(totalItems) },
      { label: 'Passed Checks', value: String(checkedItems) },
      { label: 'Pending Checks', value: String(totalItems - checkedItems) },
      { label: 'Compliance Rate', value: `${passedPct}%` }
    ],
    editableFields: {
      title: qcState.targetTitle,
      status: qcState.qcStatus,
      quantity: totalItems,
      date: new Date().toISOString().slice(0, 10),
      notes: `${checkedItems}/${totalItems} Checks Passed`
    }
  };
}

