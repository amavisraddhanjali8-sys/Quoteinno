// ============================================================================
// INNOVISTA INTEGRATED OPERATIONAL CONTROL PLATFORM - DOMAIN TYPES
// ============================================================================

import { DepartmentCode } from './security';

// --- Authorization & Scope ---
export type OperationalPortalId =
  | 'executive'
  | 'project-management'
  | 'shop-floor'
  | 'quality'
  | 'product'
  | 'resource'
  | 'hr'
  | 'finance'
  | 'document-control'
  | 'admin';

export type ExactOperationalPermission =
  | 'project.view'
  | 'project.create'
  | 'project.edit'
  | 'project.approve'
  | 'task.view'
  | 'task.assign'
  | 'task.complete'
  | 'quality.view'
  | 'quality.inspect'
  | 'quality.approve'
  | 'quality.reject'
  | 'quality.ncr.create'
  | 'quality.capa.manage'
  | 'product.view'
  | 'product.create'
  | 'product.edit'
  | 'product.revise'
  | 'resource.view'
  | 'resource.allocate'
  | 'resource.release'
  | 'employee.view'
  | 'employee.edit'
  | 'finance.view'
  | 'finance.approve'
  | 'document.view'
  | 'document.upload'
  | 'document.approve'
  | 'report.view'
  | 'report.export'
  | 'admin.users.manage'
  | 'admin.roles.manage'
  | 'admin.audit.view';

// --- Company Drill-Down Hierarchy ---
// Company → Department → Project → Work Package → Task → Transaction → Document
export interface DrillDownNode {
  id: string;
  level: 'company' | 'department' | 'project' | 'work_package' | 'task' | 'transaction' | 'document';
  name: string;
  code: string;
  status: string;
  progressPercent: number;
  budgetAllocated: number;
  actualSpent: number;
  health: 'Healthy' | 'Caution' | 'Critical';
  parentId?: string;
  metadata?: Record<string, any>;
  childrenCount?: number;
}

// --- Central Project Control Center Connected Data ---
export interface ProjectContractSummary {
  contractNumber: string;
  clientName: string;
  contractValue: number;
  effectiveDate: string;
  completionDate: string;
  paymentTerms: string;
  retentionPercent: number;
  penaltyClause: string;
  signedDocumentUrl?: string;
}

export interface WorkPackage {
  id: string;
  projectId: string;
  code: string; // e.g. "WP-01-FAB"
  name: string;
  scopeSummary: string;
  leadEngineer: string;
  status: 'Draft' | 'Planned' | 'In Progress' | 'Inspection' | 'Completed';
  startDate: string;
  dueDate: string;
  progress: number;
  budgetAmount: number;
  actualCost: number;
  tasksCount: number;
}

export interface OperationalTask {
  id: string;
  workPackageId: string;
  projectId: string;
  taskNumber: string;
  title: string;
  description: string;
  assignedToUserId?: string;
  assignedToName: string;
  workCenterId: string;
  workCenterName: string;
  machineId?: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Pending' | 'Ready' | 'In Progress' | 'Quality Hold' | 'Done';
  plannedHours: number;
  actualHours: number;
  quantityPlanned: number;
  quantityCompleted: number;
  quantityScrapped: number;
  startDate?: string;
  completedAt?: string;
}

export interface ProjectMilestone {
  id: string;
  projectId: string;
  name: string;
  targetDate: string;
  actualDate?: string;
  status: 'Pending' | 'On Track' | 'Delayed' | 'Achieved';
  billingTriggerPercent: number;
  billingAmount: number;
}

export interface ProjectIssue {
  id: string;
  projectId: string;
  issueNumber: string;
  title: string;
  severity: 'Minor' | 'Moderate' | 'Major' | 'Showstopper';
  status: 'Open' | 'Investigating' | 'Mitigated' | 'Closed';
  reportedBy: string;
  reportedDate: string;
  assignedTo: string;
  resolutionPlan?: string;
}

export interface ProjectVariationRecord {
  id: string;
  projectId: string;
  variationNumber: string;
  title: string;
  reason: string;
  requestedBy: string;
  costImpact: number;
  timeImpactDays: number;
  approvalStatus: 'Draft' | 'Submitted' | 'Manager Approved' | 'Client Approved' | 'Rejected';
  dateSubmitted: string;
}

export interface ProjectPaymentRecord {
  id: string;
  projectId: string;
  invoiceNumber: string;
  milestoneName: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: 'Unbilled' | 'Invoiced' | 'Paid' | 'Overdue';
}

// Complete Project Control Center Aggregate Model
export interface UnifiedProjectControlRecord {
  id: string;
  projectCode: string;
  name: string;
  clientName: string;
  branch: string;
  status: 'Inception' | 'Engineering' | 'Fabrication' | 'Assembly' | 'QC Inspection' | 'Site Installation' | 'Handover' | 'Closed';
  health: 'Healthy' | 'Caution' | 'Critical';
  overallProgress: number;
  startDate: string;
  targetCompletionDate: string;
  
  // Connected Subsystems
  contract: ProjectContractSummary;
  scopeSummary: string;
  boqSummary: {
    totalItems: number;
    totalMaterialWeightKg: number;
    boqValue: number;
  };
  budget: {
    allocatedMaterial: number;
    allocatedLabor: number;
    allocatedMachine: number;
    allocatedOverhead: number;
    contingency: number;
    totalBudget: number;
  };
  costs: {
    actualMaterial: number;
    actualLabor: number;
    actualMachine: number;
    actualSubcontract: number;
    totalActual: number;
    variance: number; // positive is favorable, negative is overrun
  };
  workPackages: WorkPackage[];
  milestones: ProjectMilestone[];
  tasks: OperationalTask[];
  issues: ProjectIssue[];
  variations: ProjectVariationRecord[];
  payments: ProjectPaymentRecord[];
  activeHoldCount: number;
  openNcrCount: number;
  documentsCount: number;
}

// ============================================================================
// QUALITY SUBSYSTEM TYPES
// ============================================================================

export type QualityInspectionType =
  | 'Receiving / Raw Material'
  | 'In-Process Fabrication'
  | 'Welding & NDT'
  | 'Dimensional & Fit-up'
  | 'Surface Coating & Paint'
  | 'Pre-Shipment FAT'
  | 'Site Installation Inspection';

export interface QualityInspectionPlan {
  id: string;
  planNumber: string;
  projectId: string;
  title: string;
  inspectionType: QualityInspectionType;
  standardReference: string; // e.g. "AWS D1.1 / ISO 9001:2015"
  frequency: '100% Full Inspection' | 'Sample 10%' | 'First Article & Last Article' | 'Random Spot Check';
  mandatoryHoldPoint: boolean;
  assignedInspectorId?: string;
  assignedInspectorName: string;
  status: 'Active' | 'Under Review' | 'Archived';
  checklistItemsCount: number;
}

export interface QualityChecklistItem {
  id: string;
  planId: string;
  itemNumber: number;
  checkpoint: string;
  specificationCriteria: string;
  tolerance: string;
  inspectionMethod: 'Visual' | 'Digital Caliper' | 'Ultrasonic NDT' | 'Coating Thickness Gauge' | 'Torque Wrench';
  isMandatory: boolean;
}

export interface QualityInspectionExecution {
  id: string;
  inspectionNumber: string;
  planId: string;
  projectId: string;
  workPackageId?: string;
  taskId?: string;
  productBatchNumber: string;
  inspectorName: string;
  inspectionDate: string;
  inspectionType: QualityInspectionType;
  overallResult: 'Pending' | 'Passed' | 'Passed with Remarks' | 'Rejected - NCR Initiated' | 'Quarantined';
  findings: string;
  checkResults: {
    checkpointId: string;
    passed: boolean;
    recordedValue?: string;
    notes?: string;
  }[];
  attachments: ObjectStorageAttachment[];
  approvedBy?: string;
  approvedAt?: string;
}

export interface QualityAlert {
  id: string;
  alertNumber: string;
  projectId?: string;
  workCenterId?: string;
  title: string;
  category: 'Safety' | 'Critical Quality Defect' | 'Machine Calibration Drifting' | 'Material Out of Spec';
  severity: 'Warning' | 'High' | 'CRITICAL_STOP_LINE';
  isStopLineActive: boolean;
  issuedBy: string;
  issuedAt: string;
  workStationName: string;
  description: string;
  containmentAction: string;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface NonConformanceReport {
  id: string;
  ncrNumber: string;
  projectId: string;
  title: string;
  severity: 'Minor' | 'Major' | 'Critical';
  status: 'Logged' | 'Under Investigation' | 'Disposition Assigned' | 'CAPA Pending' | 'Closed';
  source: 'Incoming Inspection' | 'Workshop Line' | 'Client Inspector' | 'Site Audit';
  defectCategory: 'Dimensional Deviation' | 'Weld Porosity / Crack' | 'Coating Blister' | 'Material Substitution' | 'Assembly Misalignment';
  description: string;
  suspectQuantity: number;
  quarantineLocation: string;
  rootCauseAnalysis?: string;
  disposition: 'Pending' | 'Rework' | 'Repair' | 'Scrap' | 'Use As-Is (Concession Requested)';
  dispositionApprovedBy?: string;
  costOfPoorQuality: number;
  capaRequired: boolean;
  capaId?: string;
  createdAt: string;
  closedAt?: string;
}

export interface CorrectivePreventiveAction {
  id: string;
  capaNumber: string;
  ncrId?: string;
  projectId?: string;
  title: string;
  status: 'Draft' | 'Root Cause 5-Why' | 'Action Plan' | 'Implementation' | 'Verification of Effectiveness' | 'Closed';
  leadInvestigator: string;
  targetCompletionDate: string;
  rootCauseSummary: string;
  correctiveActions: {
    action: string;
    owner: string;
    dueDate: string;
    completed: boolean;
  }[];
  preventiveActions: {
    action: string;
    owner: string;
    dueDate: string;
    completed: boolean;
  }[];
  effectivenessReviewDate?: string;
  isEffective?: boolean;
}

export interface MaterialTraceabilityRecord {
  id: string;
  heatNumber: string;
  millCertificateNumber: string;
  supplierName: string;
  materialGrade: string; // e.g. "SS316L", "Structural Steel S355JR"
  batchBarcode: string;
  quantityReceived: number;
  quantityConsumed: number;
  assignedProjectCode: string;
  drawingReference: string;
  ndtReportRef?: string;
  inspectionPassed: boolean;
}

// ============================================================================
// PRODUCT & RESOURCE MANAGEMENT TYPES
// ============================================================================

export interface ProductMaster {
  id: string;
  productCode: string; // e.g. "PRD-MET-CANOPY-001"
  name: string;
  category: 'Architectural Metal' | 'Structural Steel' | 'Façade Cladding' | 'Balustrades & Railings' | 'Bespoke Enclosures';
  standardUnit: 'PCS' | 'LM' | 'SQM' | 'SET';
  currentRevision: string; // e.g. "Rev C"
  activeVariantsCount: number;
  drawingNumber: string;
  specificationSummary: string;
  baseMaterialGrade: string;
  leadTimeDays: number;
  standardCostEst: number;
  status: 'Active' | 'Engineering Review' | 'Obsolete';
}

export interface BillOfMaterialItem {
  id: string;
  productId: string;
  itemNumber: number;
  materialCode: string;
  description: string;
  componentType: 'Raw Material' | 'Fastener' | 'Sub-Assembly' | 'Consumable' | 'Bought-Out Finish';
  unitOfMeasure: string;
  quantityPerUnit: number;
  scrapAllowancePercent: number;
  unitCostEstimate: number;
  supplierReference?: string;
}

export interface OperationRoutingStep {
  id: string;
  productId: string;
  stepSequence: number; // 10, 20, 30...
  operationName: string; // e.g. "CNC Plasma Cutting", "MIG Robotic Welding", "Surface Sandblasting"
  workCenterId: string;
  workCenterName: string;
  standardSetupMinutes: number;
  standardRunMinutesPerUnit: number;
  requiredOperatorSkill: string;
  qualityCheckRequired: boolean;
}

export interface WorkCenter {
  id: string;
  code: string;
  name: string;
  department: DepartmentCode;
  location: string;
  dailyCapacityHours: number;
  hourlyCostRate: number;
  activeWorkers: number;
  status: 'Operational' | 'Limited Capacity' | 'Maintenance Shutdown';
}

export interface MachineResource {
  id: string;
  workCenterId: string;
  machineCode: string;
  name: string;
  brandModel: string;
  serialNumber: string;
  tonnageOrSpec: string;
  installationDate: string;
  status: 'Running' | 'Idle' | 'Maintenance' | 'Breakdown';
  utilizationRatePercent: number;
  lastCalibrationDate: string;
  nextCalibrationDue: string;
  totalOperatingHours: number;
}

export interface ToolOrEquipment {
  id: string;
  code: string;
  name: string;
  type: 'Precision Measuring Tool' | 'Welding Set' | 'Heavy Lifting Crane' | 'Drilling Rig' | 'Safety Harness Set';
  location: string;
  status: 'Available' | 'Checked Out' | 'Under Calibration' | 'Damaged';
  assignedToUser?: string;
  calibrationDueDate: string;
}

export interface FleetVehicle {
  id: string;
  vehicleCode: string;
  plateNumber: string;
  model: string;
  type: 'Heavy Flatbed Truck' | 'Boom Crane Truck' | 'Site Crew Van' | 'Forklift';
  capacityTon: number;
  status: 'In Transit' | 'Depot Ready' | 'Service Due';
  assignedDriver: string;
  fuelCardNumber: string;
  insuranceExpiry: string;
}

export interface ResourceAllocationSlot {
  id: string;
  resourceType: 'Machine' | 'WorkCenter' | 'Tool' | 'Vehicle';
  resourceId: string;
  resourceName: string;
  projectId: string;
  projectCode: string;
  taskId?: string;
  startDate: string;
  endDate: string;
  allocatedHours: number;
  allocatedPercent: number;
}

export interface MaintenanceRecord {
  id: string;
  resourceCode: string;
  resourceName: string;
  maintenanceType: 'Preventive Schedule' | 'Emergency Repair' | 'Calibration Certification';
  scheduledDate: string;
  completedDate?: string;
  cost: number;
  technician: string;
  partsReplaced: string;
  status: 'Scheduled' | 'In Progress' | 'Completed';
}

// ============================================================================
// OBJECT STORAGE & DOCUMENT CONTROL
// ============================================================================

export interface ObjectStorageAttachment {
  id: string;
  fileName: string;
  fileSizeKb: number;
  mimeType: string;
  storageKey: string; // e.g. "s3://innovista-vault/projects/PRJ-01/dwg-rev3.pdf"
  downloadUrl: string;
  category: 'CAD Drawing' | 'Structural Calculation' | 'Inspection Photo' | 'Mill Certificate' | 'Contract' | 'NCR Evidence';
  version: string;
  uploadedBy: string;
  uploadedAt: string;
  checksumSha256?: string;
  approvalStatus: 'Draft' | 'Approved' | 'Superseded';
}

// ============================================================================
// CENTRAL REUSABLE ENGINES
// ============================================================================

export interface UniversalApprovalRequest {
  id: string;
  entityType: 'PROJECT_CHARTER' | 'BUDGET_OVERRUN' | 'DRAWING_REVISION' | 'NCR_DISPOSITION' | 'VARIATION_ORDER' | 'ACCESS_GRANT';
  entityId: string;
  entityTitle: string;
  projectCode?: string;
  financialAmount?: number;
  requestedBy: string;
  submittedAt: string;
  currentStepOrder: number;
  totalSteps: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  steps: {
    stepOrder: number;
    requiredRoleOrPermission: string;
    assignedApproverName: string;
    status: 'Pending' | 'Approved' | 'Rejected' | 'Skipped';
    comments?: string;
    decidedAt?: string;
  }[];
}

export interface CentralNotificationItem {
  id: string;
  recipientUserId?: string;
  recipientRole?: string;
  title: string;
  message: string;
  channel: 'IN_APP' | 'EMAIL_SIMULATED' | 'PUSH_WHATSAPP';
  severity: 'info' | 'warning' | 'critical';
  isRead: boolean;
  linkAction?: {
    portal: OperationalPortalId;
    entityId?: string;
  };
  createdAt: string;
}

export interface CentralAuditRecord {
  id: string;
  timestamp: string;
  userId: string;
  username: string;
  userRole: string;
  userDepartment: DepartmentCode;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT' | 'STOP_LINE' | 'DISPATCH' | 'ALLOCATE';
  module: 'Project Control' | 'Quality NCR' | 'Inspections' | 'Shop Floor' | 'Product BOM' | 'Resource Engine' | 'Documents';
  recordId: string;
  recordIdentifier: string;
  oldValueJson?: string;
  newValueJson?: string;
  device: string;
  ipAddress: string;
  changeSummary: string;
}
