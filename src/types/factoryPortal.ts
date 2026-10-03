// ============================================================================
// INNOVISTA ENTERPRISE FACTORY, WORKSHOP & SITE EXECUTION CONTROL PLATFORM
// Complete Domain Model & Cross-Portal Traceability Types
// ============================================================================

export type FactoryOwnershipType =
  | 'Innovista Owned'
  | 'Partnered Factory'
  | 'Contracted Factory'
  | 'External Supplier'
  | 'Subcontractor'
  | 'Strategic Partner'
  | 'External Fabricator';

export type FactoryFacilityType =
  | 'Integrated Facade & Curtain Wall Plant'
  | 'Aluminium Windows & Doors Workshop'
  | 'Structural Steel & Heavy Welding Factory'
  | 'Architectural Glass Processing Plant'
  | 'Powder Coating & Surface Treatment Plant'
  | 'ACP & Metal Cladding Fabrication Hub'
  | 'Joinery, Woodwork & Furniture Workshop'
  | 'Precast & Modular Construction Yard'
  | 'MEP & Electrical Assembly Workshop'
  | 'Multi-Discipline Site Workshop';

export type FactoryCapabilityCode =
  | 'Aluminium Fabrication'
  | 'Steel Fabrication'
  | 'Structural Welding (AWS/ISO)'
  | 'CNC Machining & Milling'
  | 'Glass Cutting & Tempering'
  | 'Double Glazing (DGU) Assembly'
  | 'Powder Coating & Anodizing'
  | 'Spray Painting & PVDF Coating'
  | 'ACP Routing & Folding'
  | 'Woodworking & Joinery'
  | 'Custom Furniture Production'
  | 'Electrical Panel & Harness Assembly'
  | 'Plumbing & Piping Prefabrication'
  | 'Precast Concrete Elements'
  | 'Unitized Curtain Wall Assembly'
  | 'Structural Glazing & Silicone'
  | 'Heavy Crating & Export Packaging'
  | 'Site Erection & Glazing Installation';

// 16-Stage Gate Execution Statuses as specified
export type ExecutionStageStatus =
  | 'Draft'
  | 'Assigned'
  | 'Planned'
  | 'Ready'
  | 'In Progress'
  | 'Submitted for Inspection'
  | 'Rejected'
  | 'Rework Required'
  | 'Approved'
  | 'Completed'
  | 'Packed'
  | 'Dispatched'
  | 'Delivered'
  | 'Installed'
  | 'Accepted'
  | 'Closed';

export const EXECUTION_STAGE_ORDER: ExecutionStageStatus[] = [
  'Draft',
  'Assigned',
  'Planned',
  'Ready',
  'In Progress',
  'Submitted for Inspection',
  'Rejected',
  'Rework Required',
  'Approved',
  'Completed',
  'Packed',
  'Dispatched',
  'Delivered',
  'Installed',
  'Accepted',
  'Closed'
];

export interface RecordAuditMetadata {
  createdBy: string;
  createdByRole: string;
  createdAt: string;
  updatedBy: string;
  updatedByRole: string;
  updatedAt: string;
  revision: number;
  status: string;
  approvalHistory: {
    stage: string;
    actorName: string;
    actorRole: string;
    decision: 'Approved' | 'Rejected' | 'Submitted' | 'Rework Requested' | 'Verified';
    timestamp: string;
    remarks: string;
  }[];
}

export interface FactoryProductionArea {
  id: string;
  code: string;
  name: string;
  areaSqm: number;
  bayType: 'Cutting' | 'Machining' | 'Welding' | 'Assembly' | 'Glazing' | 'Coating' | 'QC & Testing' | 'Packing & Dispatch' | 'Raw Material Store' | 'Finished Goods Yard';
  supervisorName: string;
  maxConcurrentWorkOrders: number;
  activeWorkOrdersCount: number;
  utilizationPercent: number;
}

export interface FactoryMasterProfile {
  id: string;
  factoryCode: string; // e.g., FAC-INV-01, FAC-SUP-04
  code?: string;
  name: string;
  facilityType: FactoryFacilityType;
  ownershipType: FactoryOwnershipType;
  linkedSupplierId?: string; // Links to central procurementService Supplier
  partnerRelationshipTier: 'Core Internal' | 'Tier-1 Strategic Partner' | 'Approved Subcontractor' | 'Specialist Fabricator' | 'Spot Vendor';
  status: 'Active' | 'High Load' | 'Maintenance Window' | 'Audit Hold' | 'Suspended';
  
  // Location & Contacts
  address: string;
  city: string;
  country: string;
  gpsCoordinates: string;
  primaryContactPerson: string;
  primaryContactRole: string;
  contactPhone: string;
  contactEmail: string;
  factoryManagerName: string;
  managerName?: string;
  chiefEngineerName: string;
  qaLeadName: string;
  hseOfficerName: string;

  // Capabilities & Production Scope
  operatingAreas: string[];
  capabilities: FactoryCapabilityCode[];
  materialsHandled: string[];
  productsManufactured: string[];
  fabricationTypes: string[];

  // Capacity & Shifts
  maximumCapacityUnitsPerMonth: number;
  monthlyCapacityTonnesOrSqm: number;
  capacityUnitLabel: 'm²' | 'Tonnes' | 'Units' | 'Linear Meters';
  currentCapacityUtilization: number; // 0-100%
  standardLeadTimeDays: number;
  workingShifts: {
    shiftName: string;
    hours: string;
    activeWorkers: number;
  }[];
  workingHoursPerDay: number;
  workingDaysPerWeek: number;
  holidaysCalendar: string[];

  // Compliance, Certifications, Licenses & Insurance
  certifications: {
    code: string; // e.g. ISO 9001:2015, ISO 45001, AWS D1.1, Qualicoat
    issuer: string;
    expiryDate: string;
    status: 'Valid' | 'Expiring Soon' | 'Expired';
  }[];
  tradeLicenseNo: string;
  licenseExpiryDate: string;
  insurancePolicyNo: string;
  insuranceCoverageAmount: number;
  insuranceExpiryDate: string;
  safetyRequirements: string[];
  qualityCapabilities: string[];

  // Linked Operational Resources (IDs linked to central HR, Equipment, Inventory)
  productionAreas: FactoryProductionArea[];
  storageAreas: {
    name: string;
    type: 'Raw Profile Rack' | 'Glass A-Frame Bay' | 'Chemical & Paint Store' | 'Hardware Cage' | 'Crated Dispatch Yard';
    capacityStatus: string;
  }[];
  linkedProjectIds: string[];
  assignedEmployeeIds: string[]; // Linked to hrService
  assignedMachineIds: string[]; // Linked to equipmentControlService
  assignedVehicleIds: string[];

  // Configurable Performance Metrics (Calculated & Traceable to Actual Records)
  performanceScorecard: {
    overallScore: number;
    onTimeCompletionRate: number;
    productivityIndex: number;
    qualityAcceptanceRate: number;
    rejectionRate: number;
    reworkRate: number;
    defectRatePerUnit: number;
    deliveryPerformanceRate: number;
    avgResponseTimeHours: number;
    capacityUtilizationRate: number;
    labourProductivityRate: number;
    machineUtilizationRate: number;
    materialWastagePercent: number;
    safetyComplianceRate: number;
    documentationComplianceRate: number;
    historicalCompletedValue: number;
  };

  audit: RecordAuditMetadata;
}

// --- Work Package & Factory Assignment (Project -> Factory -> Work Package) ---
export interface LinkedProjectBoqItem {
  id: string;
  code: string;
  name: string;
  category: string;
  qty: number;
  unit: string;
  rate: number;
  amount: number;
}

export interface ProjectExecutionPlanItem {
  id: string;
  phaseName: string;
  plannedStart: string;
  plannedEnd: string;
  owner: string;
  status: 'Planned' | 'Progressing' | 'Quality Check' | 'Completed';
  notes?: string;
}

export interface TaskSupportingDocument {
  id: string;
  fileName: string;
  fileType: string; // Any document type: PDF, CAD/DWG, Excel, Word, Image, Video, ZIP, etc.
  docCategory: string;
  fileSize: string;
  uploadedBy: string;
  uploadedAt: string;
  dataUrl?: string;
}

export interface FactoryWorkPackageAssignment {
  id: string;
  packageCode: string; // e.g., FWP-2026-001
  projectId: string;
  projectName: string;
  projectCode?: string;
  clientName?: string;
  siteAddress?: string;
  projectCategory?: string;
  projectStartDate?: string;
  projectEndDate?: string;
  projectTotalValue?: number;
  linkedBoqItems?: LinkedProjectBoqItem[];
  executionPlan?: ProjectExecutionPlanItem[];
  factoryId: string;
  factoryName: string;
  ownershipType: FactoryOwnershipType;
  allocationType?: 'Internal Factory' | 'External Partner' | string;
  title: string;
  scopeDescription: string;
  boqReferenceCodes: string[];
  drawingNumbers: string[];
  specificationCodes: string[];
  methodStatementCode: string;
  itpPlanCode: string;
  plannedQuantity: number;
  completedQuantity: number;
  rejectedQuantity: number;
  reworkQuantity: number;
  dispatchedQuantity: number;
  installedQuantity: number;
  unit: string;
  budgetedValue: number;
  actualCostIncurred: number;
  startDate: string;
  deadlineDate: string;
  forecastCompletionDate: string;
  priority: 'Low' | 'Normal' | 'High' | 'Urgent' | 'Critical Path';
  responsibleManager: string;
  assignedEngineer: string;
  assignedByProjectManager?: string;
  factorySupervisorName?: string;
  assignedDate?: string;
  plannedStartDate?: string;
  executionInstructions: string;
  stageStatus: ExecutionStageStatus;
  status?: string;
  completionPercent: number;
  progressPercent?: number;
  approvalMatrixTier: 'Tier 1 - Supervisor' | 'Tier 2 - Factory & Project Manager' | 'Tier 3 - QA + PM + Director';
  resourceGovernance?: ProjectResourceGovernanceConfig;
  audit: RecordAuditMetadata;
}

// --- Task Card / Work Order / Job Card / Production Order ---
export type FactoryTaskOrderType =
  | 'Work Order'
  | 'Job Card'
  | 'Production Order'
  | 'Fabrication Order'
  | 'Cutting List Order'
  | 'Rework Order'
  | 'Site Installation Order';

export interface CuttingListEntry {
  id: string;
  barOrSheetRef: string;
  profileOrMaterialCode: string;
  description: string;
  cutLengthMm: number;
  cutWidthMm?: number;
  angleLeftDeg: number;
  angleRightDeg: number;
  quantityRequired: number;
  quantityCut: number;
  offcutLengthMm: number;
  scrapMm: number;
  status: 'Pending' | 'Cut' | 'Verified';
}

export interface TaskMaterialRequirement {
  id: string;
  inventoryItemId: string; // Linked to central procurementService inventory
  itemCode: string;
  materialCode?: string;
  materialName: string;
  unit: string;
  requiredQty: number;
  issuedQty: number;
  consumedQty: number;
  returnedQty: number;
  wastageQty: number;
  scrapQty: number;
  shortageQty: number;
  batchHeatLotNo: string;
  status: 'Available' | 'Partial Issue' | 'Fully Issued' | 'Shortage';
}

export interface FactoryExecutionTask {
  id: string;
  taskCode: string; // e.g., WO-2026-104, JC-2026-412
  orderType: FactoryTaskOrderType;
  workPackageId: string;
  workPackageCode: string;
  projectId: string;
  projectName: string;
  factoryId: string;
  factoryName: string;
  productionAreaId: string;
  productionAreaName: string;
  productionBayName?: string;
  bayOrLine?: string;
  title: string;
  description?: string;
  materialBatchCode?: string;
  operationStep: string; // e.g., "CNC 5-Axis Profile Milling", "TIG Structural Welding", "DGU Structural Silicone Glazing"
  capabilityRequired: FactoryCapabilityCode;

  // Technical & Revision Gate
  drawingNumber: string;
  drawingRevision: string;
  latestApprovedRevision: string;
  workerConfirmedLatestRevision: boolean;
  confirmedByWorkerName?: string;
  confirmedAt?: string;
  methodStatementRef: string;
  checklistTemplateCode: string;

  // Assignments (Linked to Central HR & Equipment)
  supervisorName: string;
  assignedWorkerIds: string[];
  assignedWorkerNames: string[];
  assignedMachineIds: string[];
  assignedMachineNames: string[];

  // Quantities & Cycle Time
  unit: string;
  plannedQuantity: number;
  completedQuantity: number;
  rejectedQuantity: number;
  reworkQuantity: number;
  remainingQuantity: number;
  plannedHours: number;
  actualHours: number;
  cycleTimeMinutesPerUnit: number;

  // Dates & Priority
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  startDate: string;
  targetDate: string;
  actualCompletionDate?: string;
  stageStatus: ExecutionStageStatus;

  // Dependencies & Stage-Gate Controls
  predecessorTaskIds: string[];
  requiresMaterialIssueComplete: boolean;
  requiresDrawingConfirmation: boolean;
  requiresQualityInspectionPass: boolean;
  requiresHsePermitActive: boolean;
  linkedHsePermitNo?: string;
  linkedInspectionId?: string;
  linkedNcrId?: string;

  // Cutting Lists & Material Linkage
  cuttingList: CuttingListEntry[];
  materials: TaskMaterialRequirement[];
  supportingDocuments?: TaskSupportingDocument[];
  evidenceAttachments?: OnsiteEvidenceAttachment[];
  progressPercent?: number;
  status?: string;
  stage?: string;
  supervisorRemarks?: string;
  assignedSupervisorName?: string;
  workflowNotes?: string;
  plannedQty?: number;
  completedQty?: number;

  // Bottleneck & Delay Tracking
  isBottleneck: boolean;
  delayHours: number;
  delayReason?: string;

  // External Partner Acceptance
  externalPartnerAccepted: boolean;
  externalPartnerAcceptedAt?: string;

  // Sub-tasks, Workflows & Critical Path (CPM)
  assignedWorkflowName?: string;
  subTasks?: FactoryTaskSubTask[];
  successorTaskIds?: string[];
  durationDays?: number;
  earlyStartDay?: number;
  earlyFinishDay?: number;
  lateStartDay?: number;
  lateFinishDay?: number;
  floatDays?: number;
  isCriticalPath?: boolean;

  audit: RecordAuditMetadata;
}

// --- Configurable Digital Worksheets ---
export type DigitalWorksheetActivityType =
  | 'Aluminium Windows & Doors Fabrication'
  | 'Unitized Curtain Wall Assembly'
  | 'Structural Steel Fabrication & Fit-Up'
  | 'AWS/ISO Certified Welding Log'
  | 'Architectural Glass Cutting & DGU Sealing'
  | 'Powder Coating & DFT Micron Log'
  | 'ACP Cladding Routing & Cassette Folding'
  | 'Woodworking & Architectural Joinery'
  | 'Site Erection & Facade Alignment';

export interface WorksheetMeasurementEntry {
  id: string;
  parameterName: string; // e.g., "Overall Frame Width (mm)", "Diagonal Difference (mm)", "Weld Fillet Leg (mm)", "DFT Coating Thickness (µm)"
  nominalValue: number;
  tolerancePlusMm: number;
  toleranceMinusMm: number;
  actualMeasuredValue: number;
  unit: string;
  withinSpec: boolean;
}

export interface DigitalWorksheetRecord {
  id: string;
  worksheetNo: string; // e.g., DWS-2026-0089
  activityType: DigitalWorksheetActivityType;
  projectId: string;
  projectName: string;
  factoryId: string;
  factoryName: string;
  workPackageId: string;
  taskId: string;
  taskCode: string;
  drawingNumber: string;
  drawingRevision: string;
  recordedDate: string;
  shift: 'Morning Shift' | 'Evening Shift' | 'Night Shift';
  recordedByWorkerName: string;
  verifiedBySupervisorName: string;
  machineId?: string;
  machineName?: string;
  machineMeterReadingStart: number;
  machineMeterReadingEnd: number;
  labourHoursLogged: number;
  plannedQtyForShift: number;
  producedQty: number;
  acceptedQty: number;
  rejectedQty: number;
  reworkQty: number;
  materialConsumedSummary: string;
  wastageRecordedQty: number;
  wastageUnit: string;
  cuttingDetails: string;
  weldingDetails: string;
  assemblyDetails: string;
  measurements: WorksheetMeasurementEntry[];
  inspectionResult: 'Pass' | 'Hold for QC' | 'Rework Required' | 'Fail';
  problemsEncountered: string;
  supervisorRemarks: string;
  operationStep?: string;
  completedQty?: number;
  date?: string;
  remarks?: string;
  workDate?: string;
  operationPerformed?: string;
  workstationOrMachine?: string;
  outputQuantity?: number;
  unit?: string;
  verifiedBySupervisor?: string;
  qualityNotes?: string;
  operatorName?: string;
  operatorNames?: string[];
  machineUsed?: string;
  plannedQty?: number;
  cuttingAndMillingDetails?: string;
  assemblyAndGlazingDetails?: string;
  materialConsumedNotes?: string;
  operatorId?: string;
  supervisorName?: string;
  hoursWorked?: number;
  materialBatchCode?: string;
  wastageQty?: number;
  completionStatus: 'Draft' | 'Submitted' | 'Supervisor Verified' | 'QC Approved' | 'Rejected';
  syncedFromOfflineMobile?: boolean;
  audit: RecordAuditMetadata;
}

// --- Controlled Drawings & Technical Documents ---
export interface ControlledTechnicalDocument {
  id: string;
  docNumber: string; // e.g., DRW-CW-2026-104
  documentCode?: string;
  revision?: string;
  discipline?: string;
  title: string;
  preparedBy?: string;
  category:
    | 'Shop Drawing'
    | 'Fabrication Drawing'
    | 'Cutting List Sheet'
    | 'Bill of Quantities (BOQ)'
    | 'Technical Specification'
    | 'Method Statement (MOS)'
    | 'Inspection & Test Plan (ITP)'
    | 'Structural Calculation';
  projectId: string;
  projectName: string;
  factoryId: string;
  factoryName: string;
  workPackageId: string;
  currentRevision: string; // e.g. "Rev C"
  previousRevisions: {
    rev: string;
    date: string;
    author: string;
    notes: string;
  }[];
  approvalStatus: 'Draft' | 'Submitted' | 'Consultant Approved' | 'Approved for Construction (AFC)' | 'Superseded';
  technicalInstructions: string;
  fileSize: string;
  dataUrl?: string;
  distributedToFactories: string[];
  workerReadConfirmations: {
    workerName: string;
    role: string;
    revisionConfirmed: string;
    timestamp: string;
  }[];
  audit: RecordAuditMetadata;
}

// --- Daily Factory / Site Activity Report ---
export interface DailyFactoryActivityReport {
  id: string;
  reportNo: string; // e.g., DFAR-2026-1024
  date: string;
  factoryId: string;
  factoryName: string;
  projectId: string;
  projectName: string;
  shiftSupervisor: string;
  weatherOrShopCondition: string;
  plannedActivitiesSummary: string;
  completedActivitiesSummary: string;
  plannedUnitsToday: number;
  completedUnitsToday: number;
  activeWorkersCount: number;
  totalManHours: number;
  overtimeHours: number;
  activeMachinesCount: number;
  machineHoursLogged: number;
  materialsUsedSummary: string;
  delaysEncountered: string;
  delayReasonCategory: 'None' | 'Material Shortage' | 'Machine Breakdown' | 'Drawing Hold / RFI' | 'Quality Rework' | 'Power / Utility Outage' | 'Weather / Site Access';
  delayDurationHours: number;
  qualityIssuesSummary: string;
  hseIssuesSummary: string;
  toolboxTalkTopic: string;
  measurementsSummary: string;
  nextDayPlan: string;
  supervisorComments: string;
  evidenceAttachmentIds: string[];
  status: 'Submitted' | 'Reviewed by PM' | 'Approved';
  audit: RecordAuditMetadata;
}

// --- Photographic & Video Evidence Record ---
export interface MediaEvidenceRecord {
  id: string;
  evidenceCode: string; // e.g., EVD-2026-501
  mediaType: 'Photograph' | 'Video Walkthrough' | 'Drone / Site Scan' | 'Thermal / NDT Image';
  stageCategory: 'Before Execution' | 'During Fabrication / Production' | 'QC Inspection & Testing' | 'Packing & Loading' | 'Site Delivery & Installation' | 'After Completion';
  projectId: string;
  projectName: string;
  factoryId: string;
  factoryName: string;
  workPackageId: string;
  taskId: string;
  taskCode: string;
  activityName: string;
  capturedAt: string;
  gpsLocation: string;
  capturedByName: string;
  capturedByRole: string;
  description: string;
  dimensionsVerifiedText?: string;
  thumbnailPreviewUrl: string;
  mediaUrl?: string;
  fileName?: string;
  fileSizeLabel?: string;
  verifiedByQa: boolean;
  audit: RecordAuditMetadata;
}

// --- Quality Inspection, Rejection & Rework Record ---
export interface FactoryQualityInspectionRecord {
  id: string;
  inspectionNo: string; // e.g., FIR-2026-301
  inspectionType:
    | 'Incoming Material Inspection (MIR)'
    | 'First Article Inspection (FAI)'
    | 'Dimensional & Cutting Check'
    | 'Welding & NDT Inspection'
    | 'Surface Treatment / Coating DFT'
    | 'Final Factory Acceptance Test (FAT)'
    | 'Pre-Dispatch Packing Verification'
    | 'Site Installation Inspection (WIR)';
  itpReference: string;
  projectId: string;
  projectName: string;
  factoryId: string;
  factoryName: string;
  workPackageId: string;
  taskId: string;
  taskCode: string;
  taskTitle?: string;
  requestedBy: string;
  requestDate: string;
  inspectorName: string;
  inspectionDate: string;
  qtySubmitted: number;
  qtyApproved: number;
  qtyRejected: number;
  qtyReworkRequired: number;
  acceptedQuantity?: number;
  date?: string;
  correctiveActionRequired?: string;
  dimensionalCheckPassed?: boolean;
  coatingAndFinishPassed?: boolean;
  structuralSealantPassed?: boolean;
  factoryManagerApproval?: {
    isApproved: boolean;
    approvedByName: string;
    approvedByUserId: string;
    approvedAt: string;
  };
  pmOrAdminApproval?: {
    isApproved: boolean;
    approvedByName: string;
    approvedByUserId: string;
    approvedAt: string;
  };
  checklistResults: {
    item: string;
    standard: string;
    measured: string;
    result: 'Pass' | 'Fail' | 'N/A';
  }[];
  decision: 'Pending Inspection' | 'Approved' | 'Conditionally Approved' | 'Rework Required' | 'Rejected - NCR Raised';
  linkedCentralNcrCode?: string;
  defectDescription?: string;
  rootCause5Why?: string;
  correctiveActionPlan?: string;
  reworkTaskId?: string;
  reinspectionStatus?: 'Not Applicable' | 'Pending Reinspection' | 'Reinspected & Passed';
  clientOrConsultantSignOff?: string;
  audit: RecordAuditMetadata;
}

// --- Dispatch Manifest Line Item (Project Items, Finished Products, Raw Materials & Hardware) ---
export interface DispatchManifestLineItem {
  id: string;
  itemCode: string;
  itemCategory:
    | 'Project BOQ Item'
    | 'Finished Product / Task'
    | 'Finished Product'
    | 'Raw Material / Profile'
    | 'Hardware / Accessory'
    | 'Site Consumable / Tool';
  itemName?: string;
  description?: string;
  sourceRef?: string; // BOQ code, Task code, or SKU
  crateOrPalletNo?: string;
  crateOrBatchNo?: string;
  dimensionsOrSpec?: string;
  specificationOrDimensions?: string;
  plannedQty?: number;
  dispatchedQty: number;
  installedQty?: number;
  unit: string;
  unitWeightKg?: number;
  totalWeightKg?: number;
  weightKg?: number;
  qcVerified?: boolean;
  remarks?: string;
}

// --- Dispatch, Packing, Logistics & Site Installation Linkage ---
export interface FactoryDispatchAndSiteRecord {
  id: string;
  dispatchNo: string; // e.g., DSP-2026-088
  dispatchNoteNo?: string;
  siteLogisticsStatus?: string;
  fatCompleted?: boolean;
  deliveryNoteNo: string; // e.g., DN-2026-088
  packingListNo: string; // e.g., PKL-2026-088
  gatePassNo?: string;
  siteLocation?: string;
  receivedByAtSite?: string;
  projectId: string;
  projectName: string;
  factoryId: string;
  factoryName: string;
  workPackageId: string;
  taskIds: string[];
  itemDescription: string;
  dispatchLineItems?: DispatchManifestLineItem[];
  totalCratesOrPallets: number;
  totalQuantityDispatched: number;
  unit: string;
  grossWeightKg: number;
  qrBatchLabelCode: string;
  packingVerifiedBy: string;
  loadingPhotoVerified: boolean;
  vehicleRegistrationNo: string;
  vehicleType: string;
  driverName: string;
  driverPhone: string;
  dispatchDate: string;
  expectedSiteArrival: string;
  actualSiteArrival?: string;
  siteDeliveryLocation: string;
  receivedBySiteEngineer?: string;
  damagedQuantity: number;
  missingQuantity: number;
  damageRemarks?: string;

  // Site Installation Linkage
  assignedSiteInstallationTeam: string;
  siteSupervisorName: string;
  installationZoneOrElevation: string; // e.g., "North Facade Level 08-12"
  installedQuantity: number;
  installationProgressPercent: number;
  siteInspectionRef?: string;
  siteInspectionNotes?: string;
  clientAcceptanceCertificateNo?: string;
  lifecycleStage:
    | 'Packed at Factory'
    | 'Loaded & Dispatched'
    | 'In Transit to Site'
    | 'Delivered & Received at Site'
    | 'Site Installation In Progress'
    | 'Installed - Pending WIR Inspection'
    | 'Inspect & Approved on Site'
    | 'Client Accepted & Handed Over';
  audit: RecordAuditMetadata;
}

// --- Configurable Approval Matrix Rule ---
export interface FactoryApprovalMatrixRule {
  id: string;
  ruleCode: string;
  name: string;
  projectScope: string; // 'All Projects' or specific project
  factoryOwnershipScope: FactoryOwnershipType | 'All Factory Types';
  minWorkValueThreshold: number;
  taskOrStageTrigger: string;
  requiredApproverRoles: string[];
  slaHours: number;
  mandatoryQualityHoldPoint: boolean;
  active: boolean;
}

// --- Generated Operational Document Record (25+ Document Types) ---
export type GeneratedFactoryDocType =
  | 'Work Order (WO)'
  | 'Job Card (JC)'
  | 'Production Order (PO-FAB)'
  | 'Task Assignment Sheet'
  | 'Digital Worksheet Printout'
  | 'Fabrication Sheet'
  | 'Profile & Sheet Cutting List'
  | 'Material Issue & Consumption Record'
  | 'Factory Inspection Request (FIR)'
  | 'Quality Inspection Report (QIR)'
  | 'Daily Factory Activity Report (DFAR)'
  | 'Weekly Progress & Earned Value Report'
  | 'Work Package Completion Certificate'
  | 'Crate & Pallet Packing List'
  | 'Site Delivery Note (DN)'
  | 'Gate Pass & Dispatch Record'
  | 'Factory Acceptance Certificate (FAC)'
  | 'Rework Instruction & Rectification Sheet'
  | 'Non-Conformance Report (NCR)'
  | 'Machine Preventive Maintenance Record'
  | 'Factory HSE Toolbox & Permit Record'
  | 'Attendance-Linked Production Sheet'
  | 'Photographic Evidence Dossier'
  | 'Site Installation Handover Certificate'
  | 'Project & Factory Closeout Dossier';

export interface GeneratedFactoryDocument {
  id: string;
  docControlNo: string;
  docType: GeneratedFactoryDocType;
  title: string;
  projectId: string;
  projectName: string;
  factoryId: string;
  factoryName: string;
  workPackageCode?: string;
  taskCode?: string;
  generatedBy: string;
  generatedAt: string;
  revision: string;
  status: 'Draft' | 'Issued' | 'Approved' | 'Signed-Off';
  summaryData: Record<string, string | number>;
}

// --- Offline Mobile Queue Item ---
export interface OfflineSyncQueueItem {
  id: string;
  recordType: 'Task Progress' | 'Digital Worksheet' | 'Photo Evidence' | 'Daily Activity Log' | 'Inspection Request';
  factoryName: string;
  taskCode: string;
  summary: string;
  capturedBy: string;
  capturedAtOffline: string;
  syncStatus: 'Queued (Offline)' | 'Synchronized';
  payload: any;
}

export interface FactoryHseRecord {
  id: string;
  recordCode: string;
  title: string;
  factoryId: string;
  factoryName: string;
  projectId: string;
  projectName: string;
  date: string;
  status: string;
}

// --- Sub-Task & Workflow Execution Record ---
export interface FactoryTaskSubTask {
  id: string;
  subTaskCode: string;
  parentTaskId: string;
  parentTaskCode: string;
  projectId: string;
  factoryId: string;
  workPackageId: string;
  title: string;
  assignedPersonName: string;
  assignedMachineName: string;
  workflowName: string;
  plannedQty: number;
  completedQty: number;
  unit: string;
  startDate: string;
  endDate: string;
  isCriticalPath: boolean;
  status: 'Planned' | 'In Progress' | 'QC Check' | 'Completed';
}

// --- Project-Level Resource Governance Setup (Owned vs Partnered vs Contracted) ---
export type ResourceGovernanceOwner =
  | 'Innovista Managed'
  | 'Factory Self-Managed'
  | 'Under Turnkey Contract'
  | 'Customer / Project Supplied'
  | 'Supplier / Partner Provided';

export interface ProjectResourceGovernanceConfig {
  workPackageId: string;
  projectId: string;
  factoryId: string;
  workforceGovernance: ResourceGovernanceOwner;
  materialsGovernance: ResourceGovernanceOwner;
  machineryGovernance: ResourceGovernanceOwner;
  overheadsGovernance: ResourceGovernanceOwner;
  utilitiesAndToolsGovernance: ResourceGovernanceOwner;
  updatedBy: string;
  updatedAt: string;
}

// --- Project-Level Resource Allocation Record (Non-Duplicating Reference to Master Records) ---
export type ProjectResourceCategory =
  | 'Workforce / People'
  | 'Raw Materials & Profiles'
  | 'Components & Hardware'
  | 'Machinery & Equipment'
  | 'Tools & Consumables'
  | 'Overheads & Utilities'
  | 'Vehicles & Logistics'
  | 'Subcontracted Services';

export interface ProjectResourceAllocationRecord {
  id: string;
  allocationCode: string;
  projectId: string;
  projectName: string;
  factoryId: string;
  factoryName: string;
  workPackageId: string;
  taskId?: string;
  taskCode?: string;
  category: ProjectResourceCategory;
  masterRecordId: string; // Reference to HR, Equipment, Procurement/Inventory, Partner, or Cost Code
  resourceCode: string;
  resourceName: string;
  managedBy: ResourceGovernanceOwner;
  plannedQty: number;
  issuedOrActiveQty: number;
  consumedQty: number;
  wastageOrDamageQty: number;
  unit: string;
  unitCost: number;
  totalAllocatedCost: number;
  status: 'Planned' | 'Reserved' | 'Issued / Active' | 'Consumed' | 'Shortage' | 'Damaged' | 'Returned';
  notes?: string;
  contractRef?: string;
  updatedAt: string;
}

// --- On-Site Progress, Mistake, Quality Damage & Incident Record (1MB Image/Doc, 5MB Video) ---
export interface OnsiteEvidenceAttachment {
  id: string;
  fileName: string;
  mediaKind: 'Image' | 'Document' | 'Video';
  fileSizeBytes: number;
  fileSizeLabel: string;
  maxLimitLabel: '≤ 1 MB (Image/Doc)' | '≤ 5 MB (Video)';
  uploadedBy: string;
  uploadedAt: string;
  dataUrl?: string;
  caption?: string;
  remarks?: string;
}

export interface FactoryOnsiteIncidentOrDamageRecord {
  id: string;
  recordNo: string; // e.g., ONSITE-2026-401
  recordCategory: 'Onsite Progress' | 'Execution Mistake' | 'Quality Damage' | 'Material Defect' | 'Safety / Site Incident';
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  projectId: string;
  projectName: string;
  factoryId: string;
  factoryName: string;
  workPackageId: string;
  taskId: string;
  taskCode: string;
  title: string;
  description?: string;
  affectedQty: number;
  unit: string;
  rootCause: string;
  correctiveAction: string;
  reportedBy: string;
  reportedByRole: string;
  reportedAt?: string;
  date: string;
  status: 'Open' | 'Under Review' | 'Under Rectification' | 'QC Verified' | 'Closed';
  evidenceAttachments: OnsiteEvidenceAttachment[];
}

// --- Factory Partner Portal Record (Sales Partners, Supplier Partners, Subcontractors) ---
export type FactoryPartnerType =
  | 'Partnered Factory'
  | 'Contracted Factory'
  | 'Sales Partner'
  | 'Supplier Partner'
  | 'Subcontractor Partner'
  | 'Logistics Partner';

export interface FactoryPartnerRegistrationRecord {
  id: string;
  partnerCode: string;
  partnerName: string;
  partnerType: FactoryPartnerType;
  linkedMasterSupplierId?: string;
  linkedFactoryId: string;
  linkedFactoryName: string;
  linkedProjectId: string;
  linkedProjectName: string;
  contactPerson: string;
  phone: string;
  email: string;
  city: string;
  contractOrAgreementRef: string;
  materialsOrServicesScope: string;
  ratingScore: number;
  performanceRating?: number;
  status: 'Active' | 'Approved' | 'Under Review' | 'Suspended';
  registeredAt: string;
}

// --- Universal Factory Record Approval, Revision, Edit, Delete & Audit Trail ---
export type FactoryRecordEntityType =
  | 'FACTORY_PROFILE'
  | 'WORK_PACKAGE'
  | 'TASK'
  | 'SUB_TASK'
  | 'DAILY_REPORT'
  | 'WORKSHEET'
  | 'ONSITE_RECORD'
  | 'MEDIA_EVIDENCE'
  | 'RESOURCE_ALLOCATION'
  | 'QUALITY_INSPECTION'
  | 'HSE_RECORD'
  | 'DISPATCH'
  | 'TECHNICAL_DOCUMENT'
  | 'GENERATED_DOCUMENT'
  | 'PARTNER'
  | 'SUPERVISOR_ASSIGNMENT'
  | 'FACTORY_PROCUREMENT'
  | 'FACTORY_HR_PAYROLL'
  | 'FACTORY_FINANCE_CONTRACT';

// --- Factory & Project Supervising Team Assignment (Engineers, QC Inspectors, Supervisors, Procurement, Finance, HR) ---
export type FactorySupervisingRoleType =
  | 'Factory Manager'
  | 'Project Factory Engineer'
  | 'Project / Site Engineer'
  | 'QA/QC Inspector'
  | 'Factory Supervisor'
  | 'Procurement Officer'
  | 'Finance & Accounting Officer'
  | 'HR & Payroll Officer'
  | 'Partner Factory Representative';

export interface FactoryProjectSupervisorAssignment {
  id: string;
  assignmentCode: string; // e.g., FSA-2026-001
  userId: string;
  employeeId: string;
  username: string;
  fullName: string;
  userName?: string;
  roleName: string;
  supervisingRole: FactorySupervisingRoleType;
  department: string;
  email: string;
  phone: string;
  factoryId: string;
  factoryName: string;
  ownershipType: FactoryOwnershipType;
  projectId: string;
  projectName: string;
  workPackageId: string;
  /** Grants full individual Factory Manager authority & access for the assigned factory and project */
  hasFactoryManagerAuthority: boolean;
  permissions: {
    canManageTasksAndChecklists: boolean;
    canManageWorkPackagesAndTasks?: boolean;
    canManageQualityAndNcr: boolean;
    canManageProcurement: boolean;
    canManageHrAndPayroll: boolean;
    canManageFinanceAndInvoices: boolean;
    canManageContractsAndAgreements: boolean;
  };
  assignedBy: string;
  assignedAt: string;
  status: 'Active' | 'Suspended';
}

// --- Factory & Project Scoped Procurement Chain (RQ, Quotation, PO, GRN, QC Inspection, NCR Report, Return) ---
export type FactoryProcurementStageType =
  | 'RQ'
  | 'QUOTATION'
  | 'PO'
  | 'GRN'
  | 'QC_INSPECTION'
  | 'NCR_REPORT'
  | 'RETURN';

export interface FactoryProcurementRecord {
  id: string;
  docCode: string; // e.g., FAC-RQ-2026-101, FAC-QT-2026-101, FAC-PO-2026-101, FAC-GRN-2026-101, FAC-IQC-2026-101, FAC-NCR-2026-101, FAC-RET-2026-101
  recordNo?: string;
  stageType: FactoryProcurementStageType;
  stage?: string;
  factoryId: string;
  factoryName: string;
  ownershipType: FactoryOwnershipType;
  projectId: string;
  projectName: string;
  workPackageId: string;
  supplierOrPartnerName: string;
  linkedRefCode: string;
  title: string;
  itemSummary: string;
  quantity: number;
  acceptedQty: number;
  rejectedQty: number;
  unit: string;
  unitRate: number;
  totalAmount: number;
  date: string;
  status:
    | 'Draft'
    | 'Submitted'
    | 'Approved'
    | 'Ordered'
    | 'Received (GRN)'
    | 'QC Passed'
    | 'NCR Open'
    | 'Returned to Vendor'
    | 'Closed';
  inspectorOrOfficer: string;
  remarks: string;
  updatedAt: string;
}

// --- Owned Factory Direct HR & Payroll Record (Project-Scoped & Factory-Scoped) ---
export interface FactoryHrPayrollRecord {
  id: string;
  payrollCode: string; // e.g., FAC-PAY-2026-09-01
  factoryId: string;
  factoryName: string;
  ownershipType: FactoryOwnershipType;
  projectId: string;
  projectName: string;
  workPackageId: string;
  employeeId: string;
  employeeName: string;
  roleOrTrade: string;
  department: string;
  payPeriod: string; // e.g., "2026-09"
  daysWorked: number;
  overtimeHours: number;
  basicSalary: number;
  overtimePay: number;
  projectAllowance: number;
  epfEtfDeduction: number;
  netPay: number;
  netPayableLkr?: number;
  attendanceRatePct: number;
  status: 'Draft' | 'Verified by FM' | 'Approved' | 'Paid';
  updatedBy: string;
  updatedAt: string;
}

// --- Factory & Project Scoped Finance, Invoices, Accounting & Contracts/Agreements Record ---
export type FactoryFinanceRecordCategory =
  | 'INVOICE'
  | 'ACCOUNTING_ENTRY'
  | 'CONTRACT_AGREEMENT';

export interface FactoryFinanceAccountingRecord {
  id: string;
  recordCode: string; // e.g., FAC-INV-2026-201, FAC-ACC-2026-301, FAC-CNT-2026-401
  recordCategory: FactoryFinanceRecordCategory;
  subType: string;
  factoryId: string;
  factoryName: string;
  ownershipType: FactoryOwnershipType;
  projectId: string;
  projectName: string;
  workPackageId: string;
  counterpartyName: string;
  referenceDocCode: string;
  title: string;
  description: string;
  grossAmount: number;
  taxOrVatAmount: number;
  retentionOrDeductionAmount: number;
  netAmount: number;
  totalAmountLkr?: number;
  date: string;
  dueDateOrExpiry: string;
  status:
    | 'Draft'
    | 'Submitted'
    | 'Verified'
    | 'Approved'
    | 'Paid'
    | 'Active Agreement'
    | 'Posted to GL';
  preparedBy: string;
  approvedBy?: string;
  updatedAt: string;
}

export interface FactorySystemApprovalMetadata {
  recordKey: string; // `${entityType}:${recordId}`
  entityType: FactoryRecordEntityType;
  recordId: string;
  recordCode: string;
  recordTitle: string;
  isApproved: boolean;
  approvalStatus: 'Pending Approval' | 'Approved' | 'Revised' | 'Rejected';
  approvedThroughSystemText: string;
  approvedByAccountName: string; // e.g. "Alexander Vance (@superadmin)"
  approvedByUserId: string; // e.g. "usr-admin-01 (EMP-001)"
  approvedByUsername: string; // e.g. "superadmin"
  approvedByFullName: string; // e.g. "Alexander Vance"
  approvedByRole: string; // e.g. "Super Administrator"
  approvedAt: string; // e.g. "2026-09-27 10:15:00"
  revisionNumber: number;
  revisionNotes?: string;
}

export interface FactoryAuditLogEntry {
  id: string;
  timestamp: string;
  action: 'APPROVED' | 'REVISED' | 'EDITED' | 'DELETED' | 'DOCUMENT_GENERATED' | 'PRINTED' | 'CREATED';
  actionType?: string;
  entityType: FactoryRecordEntityType;
  recordId: string;
  recordCode: string;
  recordTitle: string;
  factoryId: string;
  factoryName: string;
  projectId: string;
  projectName: string;
  actorUserId: string;
  actorEmployeeId: string;
  actorUsername: string;
  actorFullName: string;
  actorName?: string;
  performedByName?: string;
  performedByUsername?: string;
  performedById?: string;
  actorAccountDisplay: string; // e.g. "Alexander Vance (@superadmin | ID: usr-admin-01)"
  actorRole: string;
  revisionNumber: number;
  details: string;
  summary?: string;
}

// --- Project Master QC Checklist & Task / Sub-Task QC Inspection State ---
export interface ProjectMasterQcChecklistItem {
  id: string;
  code: string; // e.g. MQC-01
  category:
    | 'Material & Profile Verification'
    | 'CNC Cutting & Milling Tolerance'
    | 'Welding & Structural Fit-Up'
    | 'Glazing & Silicone Sealing'
    | 'Surface Coating & DFT'
    | 'Pre-Dispatch Packing & Tagging';
  parameter: string;
  standardSpecification: string;
}

export interface TaskOrSubTaskQcItemCheck {
  masterItemId: string;
  code: string;
  category: string;
  parameter: string;
  standardSpecification: string;
  acceptanceCriteria?: string;
  checked: boolean;
  checkedBy?: string;
  checkedAt?: string;
}

export interface TaskOrSubTaskDefectReport {
  reportNo: string;
  rejectedByName: string;
  rejectedByUsername: string;
  rejectedByUserId: string;
  rejectedByRole: string;
  rejectedAt: string;
  reason: string;
  instructions: string;
  correctionInstructions?: string;
  attachmentFileName?: string;
  attachmentDataUrl?: string;
  attachmentSizeLabel?: string;
  attachmentMediaKind?: 'Image' | 'Document' | 'Video';
  resolvedByFactoryManager?: boolean;
  resolvedAt?: string;
  correctionNotes?: string;
}

export interface TaskOrSubTaskQcState {
  id: string;
  targetType: 'TASK' | 'SUB_TASK';
  targetId: string;
  targetCode: string;
  targetTitle: string;
  parentTaskId?: string;
  parentTaskCode?: string;
  projectId: string;
  projectName: string;
  factoryId: string;
  factoryName: string;
  workPackageId: string;
  checklistItems: TaskOrSubTaskQcItemCheck[];
  evidenceAttachments?: OnsiteEvidenceAttachment[];
  systemChecklistGenerated: boolean;
  systemChecklistControlNo?: string;
  systemChecklistUploadedFileName?: string;
  systemChecklistUploadedAt?: string;
  submittedByFactoryManagerName?: string;
  submittedByFactoryManagerId?: string;
  submittedAt?: string;
  factoryManagerApproval?: {
    isApproved: boolean;
    approvedByName: string;
    approvedByUserId: string;
    approvedAt: string;
  };
  pmOrAdminApproval?: {
    isApproved: boolean;
    approvedByName: string;
    approvedByUserId: string;
    approvedAt: string;
  };
  defectReport?: TaskOrSubTaskDefectReport;
  latestDefectReport?: TaskOrSubTaskDefectReport;
  qcStatus:
    | 'Not Started'
    | 'In Progress (FM Checking)'
    | 'Submitted by FM (Pending PM/Admin Approval)'
    | 'Approved by PM/Admin'
    | 'Rework Required'
    | 'Rejected — Correction Required';
  approvedByName?: string;
  approvedByUsername?: string;
  approvedByUserId?: string;
  approvedByRole?: string;
  approvedAt?: string;
}




