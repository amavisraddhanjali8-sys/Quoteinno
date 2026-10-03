import {
  FactoryMasterProfile,
  FactoryWorkPackageAssignment,
  FactoryExecutionTask,
  DigitalWorksheetRecord,
  ControlledTechnicalDocument,
  DailyFactoryActivityReport,
  MediaEvidenceRecord,
  FactoryQualityInspectionRecord,
  FactoryDispatchAndSiteRecord,
  FactoryApprovalMatrixRule,
  GeneratedFactoryDocument,
  GeneratedFactoryDocType,
  OfflineSyncQueueItem,
  ExecutionStageStatus,
  FactoryCapabilityCode,
  FactoryHseRecord,
  FactoryTaskSubTask,
  ProjectResourceGovernanceConfig,
  ProjectResourceAllocationRecord,
  FactoryOnsiteIncidentOrDamageRecord,
  OnsiteEvidenceAttachment,
  FactoryPartnerRegistrationRecord,
  FactoryRecordEntityType,
  FactorySystemApprovalMetadata,
  FactoryAuditLogEntry,
  ProjectMasterQcChecklistItem,
  TaskOrSubTaskQcItemCheck,
  TaskOrSubTaskDefectReport,
  TaskOrSubTaskQcState,
  FactoryProjectSupervisorAssignment,
  FactorySupervisingRoleType,
  FactoryProcurementStageType,
  FactoryProcurementRecord,
  FactoryHrPayrollRecord,
  FactoryFinanceRecordCategory,
  FactoryFinanceAccountingRecord
} from '../types/factoryPortal';
import { securityService } from './securityService';
import { SEED_FACTORIES, SEED_WORK_PACKAGES } from './factoryExecutionSeedData';
import {
  SEED_TASKS,
  SEED_WORKSHEETS,
  SEED_DOCUMENTS,
  SEED_DAILY_REPORTS,
  SEED_MEDIA_EVIDENCE,
  SEED_QUALITY_INSPECTIONS,
  SEED_DISPATCHES,
  SEED_APPROVAL_RULES,
  SEED_GENERATED_DOCS,
  SEED_OFFLINE_QUEUE
} from './factoryExecutionSeedDataPart2';
import { hrService } from './hrService';
import { equipmentControlService } from './equipmentControlService';
import { procurementService } from './procurementService';
import { qualityControlService } from './qualityControlService';
import { numberingService } from './numberingService';
import { safetyControlService } from './safetyControlService';
import { centralApiGateway } from './centralApiGateway';
import { SecurityUser } from '../types/security';

const STORAGE_KEYS = {
  FACTORIES: 'innovista_factory_master_v2',
  WORK_PACKAGES: 'innovista_factory_wp_v2',
  TASKS: 'innovista_factory_tasks_v2',
  WORKSHEETS: 'innovista_factory_worksheets_v2',
  DOCUMENTS: 'innovista_factory_docs_v2',
  DAILY_REPORTS: 'innovista_factory_daily_v2',
  MEDIA_EVIDENCE: 'innovista_factory_media_v2',
  INSPECTIONS: 'innovista_factory_inspections_v2',
  DISPATCHES: 'innovista_factory_dispatches_v2',
  APPROVAL_RULES: 'innovista_factory_approval_rules_v2',
  GENERATED_DOCS: 'innovista_factory_gendocs_v2',
  OFFLINE_QUEUE: 'innovista_factory_offline_v2',
  CUSTOM_CAPABILITIES: 'innovista_factory_capabilities_v2',
  FACTORY_NOTIFICATIONS: 'innovista_factory_notifications_v2',
  RESOURCE_GOVERNANCE: 'innovista_factory_res_gov_v2',
  RESOURCE_ALLOCATIONS: 'innovista_factory_res_alloc_v2',
  ONSITE_DAMAGES_INCIDENTS: 'innovista_factory_onsite_incidents_v2',
  FACTORY_PARTNERS: 'innovista_factory_partners_v2',
  RECORD_APPROVALS: 'innovista_factory_record_approvals_v2',
  FACTORY_AUDIT_LOGS: 'innovista_factory_audit_logs_v2',
  TASK_SUBTASK_QC_STATES: 'innovista_factory_task_subtask_qc_v3',
  SUPERVISOR_ASSIGNMENTS: 'innovista_factory_sup_assignments_v1',
  FACTORY_PROCUREMENT: 'innovista_factory_procurement_chain_v1',
  FACTORY_HR_PAYROLL: 'innovista_factory_hr_payroll_v1',
  FACTORY_FINANCE_CONTRACTS: 'innovista_factory_finance_contracts_v1'
};

export const PROJECT_MASTER_QC_CHECKLIST: ProjectMasterQcChecklistItem[] = [
  {
    id: 'mqc-01',
    code: 'MQC-01',
    category: 'Material & Profile Verification',
    parameter: 'Material & Mill Certificate Check',
    standardSpecification: '6063-T6 / S355JR Verified'
  },
  {
    id: 'mqc-02',
    code: 'MQC-02',
    category: 'CNC Cutting & Milling Tolerance',
    parameter: 'Cut Length & Angle Check',
    standardSpecification: 'Tolerance ±0.5 mm / ±0.2°'
  },
  {
    id: 'mqc-03',
    code: 'MQC-03',
    category: 'Welding & Structural Fit-Up',
    parameter: 'Frame Squareness & Fit-Up',
    standardSpecification: 'Diagonal ≤ 1.5 mm'
  },
  {
    id: 'mqc-04',
    code: 'MQC-04',
    category: 'Glazing & Silicone Sealing',
    parameter: 'Glass Sealant & Gasket Check',
    standardSpecification: 'Continuous Seal Pass'
  },
  {
    id: 'mqc-05',
    code: 'MQC-05',
    category: 'Surface Coating & DFT',
    parameter: 'Coating Thickness & Finish',
    standardSpecification: 'DFT ≥ 60 µm • No Scratch'
  },
  {
    id: 'mqc-06',
    code: 'MQC-06',
    category: 'Pre-Dispatch Packing & Tagging',
    parameter: 'Protective Film, Barcode & Crate',
    standardSpecification: '100% Tagged & Packed'
  }
];

export const STANDARD_FACTORY_WORKFLOWS: string[] = [
  'WF-01: CNC 5-Axis Cutting -> Milling -> Assembly -> QC FAT',
  'WF-02: Structural Welding (AWS D1.1) -> NDT Check -> Blast & Coating',
  'WF-03: Glass Cutting -> Tempering -> DGU Structural Silicone -> Curing',
  'WF-04: ACP Routing -> Cassette Folding -> Sub-Frame Assembly -> Crating',
  'WF-05: Custom Joinery Milling -> Veneer Pressing -> Finishing -> Pre-Dispatch QC'
];

const DEFAULT_CAPABILITIES: FactoryCapabilityCode[] = [
  'Aluminium Fabrication',
  'Steel Fabrication',
  'Structural Welding (AWS/ISO)',
  'CNC Machining & Milling',
  'Glass Cutting & Tempering',
  'Double Glazing (DGU) Assembly',
  'Powder Coating & Anodizing',
  'Spray Painting & PVDF Coating',
  'ACP Routing & Folding',
  'Woodworking & Joinery',
  'Custom Furniture Production',
  'Electrical Panel & Harness Assembly',
  'Plumbing & Piping Prefabrication',
  'Precast Concrete Elements',
  'Unitized Curtain Wall Assembly',
  'Structural Glazing & Silicone',
  'Heavy Crating & Export Packaging',
  'Site Erection & Glazing Installation'
];

class FactoryExecutionService {
  private factories: FactoryMasterProfile[] = [];
  private workPackages: FactoryWorkPackageAssignment[] = [];
  private tasks: FactoryExecutionTask[] = [];
  private worksheets: DigitalWorksheetRecord[] = [];
  private documents: ControlledTechnicalDocument[] = [];
  private dailyReports: DailyFactoryActivityReport[] = [];
  private mediaEvidence: MediaEvidenceRecord[] = [];
  private inspections: FactoryQualityInspectionRecord[] = [];
  private dispatches: FactoryDispatchAndSiteRecord[] = [];
  private approvalRules: FactoryApprovalMatrixRule[] = [];
  private generatedDocs: GeneratedFactoryDocument[] = [];
  private offlineQueue: OfflineSyncQueueItem[] = [];
  private capabilities: string[] = [];
  private factoryNotificationCounts: Record<string, number> = {};
  private resourceGovernanceMap: Record<string, ProjectResourceGovernanceConfig> = {};
  private resourceAllocations: ProjectResourceAllocationRecord[] = [];
  private onsiteDamagesAndIncidents: FactoryOnsiteIncidentOrDamageRecord[] = [];
  private factoryPartners: FactoryPartnerRegistrationRecord[] = [];
  private recordApprovalsMap: Record<string, FactorySystemApprovalMetadata> = {};
  private factoryAuditLogs: FactoryAuditLogEntry[] = [];
  private taskSubTaskQcStates: Record<string, TaskOrSubTaskQcState> = {};
  private supervisorAssignments: FactoryProjectSupervisorAssignment[] = [];
  private factoryProcurementRecords: FactoryProcurementRecord[] = [];
  private factoryHrPayrollRecords: FactoryHrPayrollRecord[] = [];
  private factoryFinanceRecords: FactoryFinanceAccountingRecord[] = [];

  constructor() {
    this.init();
  }

  private load<T>(key: string, seed: T): T {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed as unknown as T;
      }
    } catch (e) {
      console.error('Failed to load factory storage key', key, e);
    }
    localStorage.setItem(key, JSON.stringify(seed));
    return seed;
  }

  private save<T>(key: string, data: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save factory storage key', key, e);
    }
  }

  private init() {
    this.factories = this.load(STORAGE_KEYS.FACTORIES, SEED_FACTORIES);
    this.workPackages = this.load(STORAGE_KEYS.WORK_PACKAGES, SEED_WORK_PACKAGES);
    this.tasks = this.load(STORAGE_KEYS.TASKS, SEED_TASKS);
    this.worksheets = this.load(STORAGE_KEYS.WORKSHEETS, SEED_WORKSHEETS);
    this.documents = this.load(STORAGE_KEYS.DOCUMENTS, SEED_DOCUMENTS);
    this.dailyReports = this.load(STORAGE_KEYS.DAILY_REPORTS, SEED_DAILY_REPORTS);
    this.mediaEvidence = this.load(STORAGE_KEYS.MEDIA_EVIDENCE, SEED_MEDIA_EVIDENCE);
    this.inspections = this.load(STORAGE_KEYS.INSPECTIONS, SEED_QUALITY_INSPECTIONS);
    this.dispatches = this.load(STORAGE_KEYS.DISPATCHES, SEED_DISPATCHES);
    this.approvalRules = this.load(STORAGE_KEYS.APPROVAL_RULES, SEED_APPROVAL_RULES);
    this.generatedDocs = this.load(STORAGE_KEYS.GENERATED_DOCS, SEED_GENERATED_DOCS);
    this.offlineQueue = this.load(STORAGE_KEYS.OFFLINE_QUEUE, SEED_OFFLINE_QUEUE);
    this.capabilities = this.load(STORAGE_KEYS.CUSTOM_CAPABILITIES, DEFAULT_CAPABILITIES);
    this.initFactoryNotifications();
    this.initEnhancedSubPortalsData();
    this.initFactoryErpAndSupervisors();
    this.initApprovalsAndAuditLogs();
  }

  private initFactoryNotifications() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.FACTORY_NOTIFICATIONS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          this.factoryNotificationCounts = parsed;
          return;
        }
      }
    } catch (e) {
      console.error('Failed to load factory notifications', e);
    }

    const initialCounts: Record<string, number> = {};
    this.factories.forEach(f => {
      const activeTasks = this.tasks.filter(
        t => t.factoryId === f.id && ['In Progress', 'Submitted for Inspection', 'Rework Required'].includes(t.stageStatus)
      ).length;
      const recentWs = this.worksheets.filter(w => w.factoryId === f.id).length;
      const recentInsp = this.inspections.filter(i => i.factoryId === f.id).length;
      const recentDsp = this.dispatches.filter(d => d.factoryId === f.id).length;
      initialCounts[f.id] = Math.max(1, activeTasks + recentWs + recentInsp + recentDsp);
    });
    this.factoryNotificationCounts = initialCounts;
    this.save(STORAGE_KEYS.FACTORY_NOTIFICATIONS, this.factoryNotificationCounts);
  }

  public recordFactoryUpdateNotification(factoryId: string, increment = 1): number {
    if (!factoryId) return 0;
    const current = this.factoryNotificationCounts[factoryId] || 0;
    this.factoryNotificationCounts[factoryId] = current + increment;
    this.save(STORAGE_KEYS.FACTORY_NOTIFICATIONS, this.factoryNotificationCounts);
    return this.factoryNotificationCounts[factoryId];
  }

  public getFactoryNotificationCounts(): Record<string, number> {
    const result: Record<string, number> = { ...this.factoryNotificationCounts };
    this.factories.forEach(f => {
      if (typeof result[f.id] !== 'number') {
        const count =
          this.tasks.filter(t => t.factoryId === f.id).length +
          this.worksheets.filter(w => w.factoryId === f.id).length;
        result[f.id] = Math.max(1, count);
      }
    });
    return result;
  }

  public syncAllPendingQueueItems(user: SecurityUser | null = null): number {
    return this.syncAllOfflineRecords(user);
  }

  // --- Getters ---
  public getFactories(): FactoryMasterProfile[] {
    return [...this.factories];
  }

  public getWorkPackages(factoryId?: string, projectId?: string): FactoryWorkPackageAssignment[] {
    return this.workPackages.filter(w => {
      const matchFac = !factoryId || factoryId === 'ALL' || w.factoryId === factoryId;
      const matchPrj = !projectId || projectId === 'ALL' || w.projectId === projectId || w.projectName === projectId;
      return matchFac && matchPrj;
    });
  }

  public saveWorkPackage(
    userOrWp: any,
    maybeWp?: any
  ): FactoryWorkPackageAssignment {
    if (maybeWp) {
      return this.createOrUpdateWorkPackage(userOrWp as SecurityUser, maybeWp);
    }
    return this.createOrUpdateWorkPackage(null, userOrWp);
  }

  public getProcurementRecords(factoryId?: string, projectId?: string): FactoryProcurementRecord[] {
    return this.getFactoryProcurementRecords(factoryId, projectId);
  }

  public getFinanceRecords(factoryId?: string, projectId?: string): FactoryFinanceAccountingRecord[] {
    return this.getFactoryFinanceRecords(factoryId, projectId);
  }

  public getTasks(factoryId?: string, projectId?: string): FactoryExecutionTask[] {
    return this.tasks.filter(t => {
      const matchFac = !factoryId || factoryId === 'ALL' || t.factoryId === factoryId;
      const matchPrj = !projectId || projectId === 'ALL' || t.projectId === projectId || t.projectName === projectId;
      return matchFac && matchPrj;
    });
  }

  public getWorksheets(factoryId?: string, projectId?: string): DigitalWorksheetRecord[] {
    return this.worksheets.filter(w => {
      const matchFac = !factoryId || factoryId === 'ALL' || w.factoryId === factoryId;
      const matchPrj = !projectId || projectId === 'ALL' || w.projectId === projectId || w.projectName === projectId;
      return matchFac && matchPrj;
    });
  }

  public getDocuments(factoryId?: string, projectId?: string): ControlledTechnicalDocument[] {
    return this.documents.filter(d => {
      const matchFac = !factoryId || factoryId === 'ALL' || d.factoryId === factoryId;
      const matchPrj = !projectId || projectId === 'ALL' || d.projectId === projectId || d.projectName === projectId;
      return matchFac && matchPrj;
    });
  }

  public getControlledDocuments(factoryId?: string, projectId?: string): ControlledTechnicalDocument[] {
    return this.getDocuments(factoryId, projectId);
  }

  public getControlledTechnicalDocuments(factoryId?: string, projectId?: string): ControlledTechnicalDocument[] {
    return this.getDocuments(factoryId, projectId);
  }

  public getDailyReports(factoryId?: string, projectId?: string): DailyFactoryActivityReport[] {
    return this.dailyReports.filter(r => {
      const matchFac = !factoryId || factoryId === 'ALL' || r.factoryId === factoryId;
      const matchPrj = !projectId || projectId === 'ALL' || r.projectId === projectId || r.projectName === projectId;
      return matchFac && matchPrj;
    });
  }

  public getMediaEvidence(factoryId?: string, projectId?: string): MediaEvidenceRecord[] {
    return this.mediaEvidence.filter(m => {
      const matchFac = !factoryId || factoryId === 'ALL' || m.factoryId === factoryId;
      const matchPrj = !projectId || projectId === 'ALL' || m.projectId === projectId || m.projectName === projectId;
      return matchFac && matchPrj;
    });
  }

  public getInspections(factoryId?: string, projectId?: string): FactoryQualityInspectionRecord[] {
    return this.inspections.filter(i => {
      const matchFac = !factoryId || factoryId === 'ALL' || i.factoryId === factoryId;
      const matchPrj = !projectId || projectId === 'ALL' || i.projectId === projectId || i.projectName === projectId;
      return matchFac && matchPrj;
    });
  }

  public getQualityInspections(factoryId?: string, projectId?: string): FactoryQualityInspectionRecord[] {
    return this.getInspections(factoryId, projectId);
  }

  public getHseRecords(): FactoryHseRecord[] {
    return this.dailyReports.map((r, idx) => ({
      id: `hse-${r.id || idx}`,
      recordCode: `HSE-2026-${101 + idx}`,
      title: r.toolboxTalkTopic || 'Daily Shop-Floor Toolbox & PPE Compliance Check',
      factoryId: r.factoryId,
      factoryName: r.factoryName,
      projectId: r.projectId,
      projectName: r.projectName,
      date: r.date,
      status: 'Compliant'
    }));
  }

  public getDispatches(factoryId?: string, projectId?: string): FactoryDispatchAndSiteRecord[] {
    return this.dispatches.filter(d => {
      const matchFac = !factoryId || factoryId === 'ALL' || d.factoryId === factoryId;
      const matchPrj = !projectId || projectId === 'ALL' || d.projectId === projectId || d.projectName === projectId;
      return matchFac && matchPrj;
    });
  }

  public getApprovalRules(): FactoryApprovalMatrixRule[] {
    return [...this.approvalRules];
  }

  public getGeneratedDocs(): GeneratedFactoryDocument[] {
    return [...this.generatedDocs];
  }

  public getGeneratedDocuments(): GeneratedFactoryDocument[] {
    return [...this.generatedDocs];
  }

  public saveFactory(
    user: SecurityUser | null,
    profile: Partial<FactoryMasterProfile> & { name: string }
  ): FactoryMasterProfile {
    return this.registerOrUpdateFactory(user, profile);
  }

  public saveWorkPackageAssignment(
    user: SecurityUser | null,
    wp: Partial<FactoryWorkPackageAssignment> & { title: string; factoryId: string; projectId: string }
  ): FactoryWorkPackageAssignment {
    return this.createOrUpdateWorkPackage(user, wp);
  }

  public getOfflineQueue(): OfflineSyncQueueItem[] {
    return [...this.offlineQueue];
  }

  public getCapabilities(): string[] {
    return [...this.capabilities];
  }

  public addCustomCapability(cap: string): string[] {
    if (cap && !this.capabilities.includes(cap)) {
      this.capabilities.push(cap);
      this.save(STORAGE_KEYS.CUSTOM_CAPABILITIES, this.capabilities);
    }
    return [...this.capabilities];
  }

  // --- Central Cross-System Live Data Bridges (Non-Duplicating) ---
  public getCentralCrossPortalSnapshot(user: SecurityUser | null) {
    const hrEmployees = hrService.getEmployees(user);
    const equipmentAssets = equipmentControlService.getAssets();
    const equipmentMaintenance = equipmentControlService.getWorkOrders();
    const equipmentBreakdowns = equipmentMaintenance.filter(w => w.orderType === 'Breakdown');
    const procurementInventory = procurementService.getInventory();
    const procurementSuppliers = procurementService.getSuppliers();
    const qualityIqc = qualityControlService.getIqcRecords();
    const qualityLabTests = qualityControlService.getLabTests();
    const hseRisks = safetyControlService.getRisks();
    const hseInspections = safetyControlService.getInspections();
    const hsePpe = safetyControlService.getPpeInventory();

    return {
      hrEmployees,
      equipmentAssets,
      equipmentBreakdowns,
      equipmentMaintenance,
      procurementInventory,
      procurementSuppliers,
      qualityIqc,
      qualityLabTests,
      hseRisks,
      hseInspections,
      hsePpe
    };
  }

  // --- 1. Register or Update Factory / Workshop ---
  public registerOrUpdateFactory(
    user: SecurityUser | null,
    profile: Partial<FactoryMasterProfile> & { name: string }
  ): FactoryMasterProfile {
    const now = new Date().toISOString();
    const actorName = user?.fullName || 'Alexander Vance';
    const actorRole = user?.roleName || 'Super Administrator';

    const existingIdx = profile.id ? this.factories.findIndex(f => f.id === profile.id) : -1;
    if (existingIdx >= 0) {
      const prev = this.factories[existingIdx];
      const updated: FactoryMasterProfile = {
        ...prev,
        ...profile,
        audit: {
          ...prev.audit,
          updatedBy: actorName,
          updatedByRole: actorRole,
          updatedAt: now,
          revision: prev.audit.revision + 1,
          approvalHistory: [
            ...prev.audit.approvalHistory,
            {
              stage: 'Master Profile Updated',
              actorName,
              actorRole,
              decision: 'Approved',
              timestamp: now,
              remarks: 'Updated capabilities, capacity, or project linkage.'
            }
          ]
        }
      };
      this.factories[existingIdx] = updated;
      this.save(STORAGE_KEYS.FACTORIES, this.factories);
      return updated;
    }

    const newFactory: FactoryMasterProfile = {
      id: `fac-${Date.now()}`,
      factoryCode: profile.factoryCode || numberingService.consumeNextNumber('factory_code'),
      name: profile.name,
      facilityType: profile.facilityType || 'Integrated Facade & Curtain Wall Plant',
      ownershipType: profile.ownershipType || 'Innovista Owned',
      linkedSupplierId: profile.linkedSupplierId,
      partnerRelationshipTier: profile.partnerRelationshipTier || 'Core Internal',
      status: profile.status || 'Active',
      address: profile.address || 'Industrial Zone Block C',
      city: profile.city || 'Colombo',
      country: profile.country || 'Sri Lanka',
      gpsCoordinates: profile.gpsCoordinates || '6.9271° N, 79.8612° E',
      primaryContactPerson: profile.primaryContactPerson || actorName,
      primaryContactRole: profile.primaryContactRole || 'Plant Manager',
      contactPhone: profile.contactPhone || '+94 11 200 0000',
      contactEmail: profile.contactEmail || 'plant@innovista.com',
      factoryManagerName: profile.factoryManagerName || actorName,
      chiefEngineerName: profile.chiefEngineerName || 'Eng. Nuwan Senanayake',
      qaLeadName: profile.qaLeadName || 'Marcus Silva',
      hseOfficerName: profile.hseOfficerName || 'Dinesh Jayawardena',
      operatingAreas: profile.operatingAreas || ['Main Fabrication Bay 01', 'Assembly & Glazing Bay 02', 'QC & Dispatch Bay 03'],
      capabilities: profile.capabilities || ['Aluminium Fabrication', 'CNC Machining & Milling', 'Unitized Curtain Wall Assembly'],
      materialsHandled: profile.materialsHandled || ['6063-T6 Extrusions', 'DGU Glass', 'Structural Steel'],
      productsManufactured: profile.productsManufactured || ['Curtain Wall Panels', 'Windows & Doors'],
      fabricationTypes: profile.fabricationTypes || ['CNC Machining', 'Assembly & Glazing'],
      maximumCapacityUnitsPerMonth: profile.maximumCapacityUnitsPerMonth || 3000,
      monthlyCapacityTonnesOrSqm: profile.monthlyCapacityTonnesOrSqm || 2500,
      capacityUnitLabel: profile.capacityUnitLabel || 'm²',
      currentCapacityUtilization: profile.currentCapacityUtilization ?? 45,
      standardLeadTimeDays: profile.standardLeadTimeDays || 14,
      workingShifts: profile.workingShifts || [{ shiftName: 'Day Shift', hours: '07:30 - 16:30', activeWorkers: 25 }],
      workingHoursPerDay: profile.workingHoursPerDay || 9,
      workingDaysPerWeek: profile.workingDaysPerWeek || 6,
      holidaysCalendar: ['2026-05-01'],
      certifications: profile.certifications || [
        { code: 'ISO 9001:2015 QMS', issuer: 'SGS', expiryDate: '2028-01-01', status: 'Valid' }
      ],
      tradeLicenseNo: profile.tradeLicenseNo || `LIC-${Date.now().toString().slice(-5)}`,
      licenseExpiryDate: profile.licenseExpiryDate || '2027-12-31',
      insurancePolicyNo: profile.insurancePolicyNo || `INS-${Date.now().toString().slice(-5)}`,
      insuranceCoverageAmount: profile.insuranceCoverageAmount || 100000000,
      insuranceExpiryDate: profile.insuranceExpiryDate || '2027-12-31',
      safetyRequirements: profile.safetyRequirements || ['Mandatory PPE', 'Daily Toolbox Briefing'],
      qualityCapabilities: profile.qualityCapabilities || ['Dimensional Laser Check', 'DFT Coating Gauge'],
      productionAreas: profile.productionAreas || [
        { id: `pa-${Date.now()}`, code: 'BAY-01', name: 'Primary Fabrication & Assembly Line', areaSqm: 1500, bayType: 'Assembly', supervisorName: actorName, maxConcurrentWorkOrders: 8, activeWorkOrdersCount: 2, utilizationPercent: 45 }
      ],
      storageAreas: profile.storageAreas || [
        { name: 'Main Raw Material Store', type: 'Raw Profile Rack', capacityStatus: '40% Full' }
      ],
      linkedProjectIds: profile.linkedProjectIds || ['Sirius Mall Storefront'],
      assignedEmployeeIds: profile.assignedEmployeeIds || ['emp-001'],
      assignedMachineIds: profile.assignedMachineIds || ['EQ-CNC-01'],
      assignedVehicleIds: profile.assignedVehicleIds || ['VEH-TRK-01'],
      performanceScorecard: {
        overallScore: 93.0,
        onTimeCompletionRate: 94.0,
        productivityIndex: 92.0,
        qualityAcceptanceRate: 97.5,
        rejectionRate: 2.5,
        reworkRate: 1.9,
        defectRatePerUnit: 0.019,
        deliveryPerformanceRate: 95.0,
        avgResponseTimeHours: 3.0,
        capacityUtilizationRate: profile.currentCapacityUtilization ?? 45,
        labourProductivityRate: 91.0,
        machineUtilizationRate: 84.0,
        materialWastagePercent: 2.6,
        safetyComplianceRate: 99.0,
        documentationComplianceRate: 96.0,
        historicalCompletedValue: 25000000
      },
      audit: {
        createdBy: actorName,
        createdByRole: actorRole,
        createdAt: now,
        updatedBy: actorName,
        updatedByRole: actorRole,
        updatedAt: now,
        revision: 1,
        status: 'Approved',
        approvalHistory: [
          { stage: 'Initial Registration', actorName, actorRole, decision: 'Approved', timestamp: now, remarks: 'Registered as operational entity.' }
        ]
      }
    };

    this.factories.unshift(newFactory);
    this.save(STORAGE_KEYS.FACTORIES, this.factories);
    centralApiGateway.dispatchNotification(user, 'Factory Registered', `${newFactory.name} (${newFactory.factoryCode}) commissioned in Control Platform.`, 'info', 'project-management', newFactory.id);
    return newFactory;
  }

  // --- 2. Assign Work Package to Factory ---
  public createOrUpdateWorkPackage(
    user: SecurityUser | null,
    wp: Partial<FactoryWorkPackageAssignment> & { title: string; factoryId: string; projectId: string }
  ): FactoryWorkPackageAssignment {
    const now = new Date().toISOString();
    const actorName = user?.fullName || 'Marcus Sterling';
    const actorRole = user?.roleName || 'Project Manager';
    const factory = this.factories.find(f => f.id === wp.factoryId) || this.factories[0];

    const existingIdx = wp.id
      ? this.workPackages.findIndex(w => w.id === wp.id)
      : this.workPackages.findIndex(
          w => w.factoryId === factory.id && (w.projectId === wp.projectId || w.projectName === wp.projectName)
        );
    if (existingIdx >= 0) {
      const prev = this.workPackages[existingIdx];
      const completedQty = wp.completedQuantity ?? prev.completedQuantity;
      const plannedQty = wp.plannedQuantity ?? prev.plannedQuantity;
      const updated: FactoryWorkPackageAssignment = {
        ...prev,
        ...wp,
        completionPercent: plannedQty > 0 ? Math.min(100, Math.round((completedQty / plannedQty) * 100)) : prev.completionPercent,
        audit: {
          ...prev.audit,
          updatedBy: actorName,
          updatedByRole: actorRole,
          updatedAt: now,
          revision: prev.audit.revision + 1,
          status: wp.stageStatus || prev.stageStatus,
          approvalHistory: [
            ...prev.audit.approvalHistory,
            {
              stage: `Stage Updated to ${wp.stageStatus || prev.stageStatus}`,
              actorName,
              actorRole,
              decision: 'Approved',
              timestamp: now,
              remarks: `Updated work package ${prev.packageCode}`
            }
          ]
        }
      };
      this.workPackages[existingIdx] = updated;
      this.save(STORAGE_KEYS.WORK_PACKAGES, this.workPackages);
      return updated;
    }

    const newWp: FactoryWorkPackageAssignment = {
      id: `fwp-${Date.now()}`,
      packageCode: wp.packageCode || numberingService.consumeNextNumber('work_package'),
      projectId: wp.projectId,
      projectName: wp.projectName || wp.projectId,
      projectCode: wp.projectCode || wp.projectId,
      clientName: wp.clientName || 'Enterprise Client',
      siteAddress: wp.siteAddress || 'Colombo Project Site',
      projectStartDate: wp.projectStartDate || wp.startDate || now.slice(0, 10),
      projectEndDate: wp.projectEndDate || wp.deadlineDate || '2026-11-15',
      projectTotalValue: wp.projectTotalValue || wp.budgetedValue || 15000000,
      linkedBoqItems: wp.linkedBoqItems || [],
      executionPlan: wp.executionPlan || [
        { id: `plan-${Date.now()}-1`, phaseName: 'Shop Drawings & Material Release', plannedStart: wp.startDate || now.slice(0, 10), plannedEnd: wp.deadlineDate || '2026-11-15', owner: wp.assignedEngineer || factory.chiefEngineerName, status: 'Planned' },
        { id: `plan-${Date.now()}-2`, phaseName: 'CNC Cutting & Fabrication', plannedStart: wp.startDate || now.slice(0, 10), plannedEnd: wp.deadlineDate || '2026-11-15', owner: factory.factoryManagerName, status: 'Planned' },
        { id: `plan-${Date.now()}-3`, phaseName: 'Quality Inspection (ITP / FAT)', plannedStart: wp.startDate || now.slice(0, 10), plannedEnd: wp.deadlineDate || '2026-11-15', owner: factory.qaLeadName, status: 'Planned' }
      ],
      factoryId: factory.id,
      factoryName: factory.name,
      ownershipType: factory.ownershipType,
      title: wp.title,
      scopeDescription: wp.scopeDescription || 'Complete shop drawing verification, CNC fabrication, assembly, QC FAT inspection, and site delivery.',
      boqReferenceCodes: wp.boqReferenceCodes || ['BOQ-FAB-101'],
      drawingNumbers: wp.drawingNumbers || ['DRW-FAB-2026-01 Rev A'],
      specificationCodes: wp.specificationCodes || ['SPEC-STD-01'],
      methodStatementCode: wp.methodStatementCode || 'MOS-FAB-01',
      itpPlanCode: wp.itpPlanCode || 'ITP-QC-01',
      plannedQuantity: wp.plannedQuantity || 100,
      completedQuantity: wp.completedQuantity || 0,
      rejectedQuantity: 0,
      reworkQuantity: 0,
      dispatchedQuantity: 0,
      installedQuantity: 0,
      unit: wp.unit || 'Units',
      budgetedValue: wp.budgetedValue || 15000000,
      actualCostIncurred: wp.actualCostIncurred || 0,
      startDate: wp.startDate || now.slice(0, 10),
      deadlineDate: wp.deadlineDate || '2026-11-15',
      forecastCompletionDate: wp.forecastCompletionDate || wp.deadlineDate || '2026-11-15',
      priority: wp.priority || 'High',
      responsibleManager: wp.responsibleManager || actorName,
      assignedEngineer: wp.assignedEngineer || factory.chiefEngineerName,
      executionInstructions: wp.executionInstructions || 'Execute strictly per AFC drawings and ITP hold points.',
      stageStatus: wp.stageStatus || 'Assigned',
      completionPercent: 0,
      approvalMatrixTier: (wp.budgetedValue || 15000000) >= 25000000 ? 'Tier 3 - QA + PM + Director' : 'Tier 2 - Factory & Project Manager',
      audit: {
        createdBy: actorName,
        createdByRole: actorRole,
        createdAt: now,
        updatedBy: actorName,
        updatedByRole: actorRole,
        updatedAt: now,
        revision: 1,
        status: 'Assigned',
        approvalHistory: [
          { stage: 'Work Package Assigned to Factory', actorName, actorRole, decision: 'Approved', timestamp: now, remarks: `Assigned to ${factory.name}` }
        ]
      }
    };

    // Ensure factory links to project
    if (!factory.linkedProjectIds.includes(wp.projectId)) {
      factory.linkedProjectIds.push(wp.projectId);
      this.save(STORAGE_KEYS.FACTORIES, this.factories);
    }

    this.workPackages.unshift(newWp);
    this.save(STORAGE_KEYS.WORK_PACKAGES, this.workPackages);
    this.recordFactoryUpdateNotification(factory.id, 1);
    centralApiGateway.dispatchNotification(user, 'New Work Package Assigned', `${newWp.packageCode} assigned to ${factory.name}`, 'info', 'project-management', newWp.id);
    return newWp;
  }

  // --- 3. Task Dependency & Stage-Gate Validation Engine ---
  public validateTaskStageTransition(
    task: FactoryExecutionTask,
    targetStage: ExecutionStageStatus
  ): { allowed: boolean; blockerReasons: string[] } {
    const reasons: string[] = [];

    // Check predecessor tasks before moving to In Progress or beyond
    const executionStagesRequiringPredecessors: ExecutionStageStatus[] = [
      'In Progress', 'Submitted for Inspection', 'Approved', 'Completed', 'Packed', 'Dispatched', 'Delivered', 'Installed', 'Accepted', 'Closed'
    ];
    if (executionStagesRequiringPredecessors.includes(targetStage) && task.predecessorTaskIds.length > 0) {
      for (const predId of task.predecessorTaskIds) {
        const pred = this.tasks.find(t => t.id === predId || t.taskCode === predId);
        if (pred && !['Approved', 'Completed', 'Packed', 'Dispatched', 'Delivered', 'Installed', 'Accepted', 'Closed'].includes(pred.stageStatus)) {
          reasons.push(`Predecessor task ${pred.taskCode} (${pred.title}) is in '${pred.stageStatus}' status and must be Approved/Completed first.`);
        }
      }
    }

    // Check Latest Approved Drawing Revision confirmation before In Progress / Completed
    if (['In Progress', 'Submitted for Inspection', 'Completed'].includes(targetStage) && task.requiresDrawingConfirmation) {
      if (!task.workerConfirmedLatestRevision || task.drawingRevision !== task.latestApprovedRevision) {
        reasons.push(`Worker/Supervisor has not confirmed the latest approved drawing revision (${task.drawingNumber} ${task.latestApprovedRevision}).`);
      }
    }

    // Check Material Issue before Completed
    if (['Completed', 'Packed', 'Dispatched'].includes(targetStage) && task.requiresMaterialIssueComplete) {
      const hasShortage = task.materials.some(m => m.status === 'Shortage' || m.issuedQty < m.requiredQty);
      if (hasShortage) {
        reasons.push(`Required materials for ${task.taskCode} have unfulfilled shortages or incomplete store issue.`);
      }
    }

    // Check Quality Inspection before Approved / Completed / Packed / Dispatched
    if (['Completed', 'Packed', 'Dispatched', 'Delivered', 'Installed', 'Accepted', 'Closed'].includes(targetStage) && task.requiresQualityInspectionPass) {
      const linkedInsp = this.inspections.find(i => i.taskId === task.id || i.id === task.linkedInspectionId);
      if (!linkedInsp || !['Approved', 'Conditionally Approved'].includes(linkedInsp.decision)) {
        reasons.push(`Mandatory Quality Inspection (FIR/ITP) for ${task.taskCode} is not yet Approved.`);
      }
    }

    return {
      allowed: reasons.length === 0,
      blockerReasons: reasons
    };
  }

  // --- 4. Create or Update Task / Work Order / Job Card ---
  public saveTask(
    user: SecurityUser | null,
    taskInput: Partial<FactoryExecutionTask> & { title: string; factoryId: string; projectId: string }
  ): { task: FactoryExecutionTask; warning?: string } {
    const now = new Date().toISOString();
    const actorName = user?.fullName || 'Eng. Nuwan Senanayake';
    const actorRole = user?.roleName || 'Production Engineer';
    const factory = this.factories.find(f => f.id === taskInput.factoryId) || this.factories[0];
    const wp = this.workPackages.find(w => w.id === taskInput.workPackageId) || this.workPackages[0];

    const existingIdx = taskInput.id ? this.tasks.findIndex(t => t.id === taskInput.id) : -1;
    if (existingIdx >= 0) {
      const prev = this.tasks[existingIdx];
      const nextStage = taskInput.stageStatus || prev.stageStatus;
      if (nextStage !== prev.stageStatus) {
        const validation = this.validateTaskStageTransition({ ...prev, ...taskInput }, nextStage);
        if (!validation.allowed) {
          throw new Error(`Stage Gate Blocked: ${validation.blockerReasons.join(' | ')}`);
        }
      }

      const planned = taskInput.plannedQuantity ?? prev.plannedQuantity;
      const completed = taskInput.completedQuantity ?? prev.completedQuantity;
      const updated: FactoryExecutionTask = {
        ...prev,
        ...taskInput,
        remainingQuantity: Math.max(0, planned - completed),
        actualCompletionDate: ['Completed', 'Packed', 'Dispatched', 'Closed'].includes(nextStage) ? (prev.actualCompletionDate || now.slice(0, 10)) : prev.actualCompletionDate,
        audit: {
          ...prev.audit,
          updatedBy: actorName,
          updatedByRole: actorRole,
          updatedAt: now,
          revision: prev.audit.revision + 1,
          status: nextStage,
          approvalHistory: [
            ...prev.audit.approvalHistory,
            {
              stage: `Task Updated (${nextStage})`,
              actorName,
              actorRole,
              decision: 'Approved',
              timestamp: now,
              remarks: `Completed: ${completed}/${planned} ${prev.unit}`
            }
          ]
        }
      };
      this.tasks[existingIdx] = updated;
      this.save(STORAGE_KEYS.TASKS, this.tasks);
      this.recordFactoryUpdateNotification(updated.factoryId, 1);
      this.recalculateWorkPackageProgress(updated.workPackageId);
      return { task: updated };
    }

    const plannedQty = taskInput.plannedQuantity || 50;
    const completedQty = taskInput.completedQuantity || 0;
    const orderTypeKey =
      taskInput.orderType === 'Job Card'
        ? 'job_card'
        : taskInput.orderType === 'Production Order'
        ? 'production_order'
        : taskInput.orderType === 'Cutting List Order'
        ? 'cutting_list'
        : 'work_order';
    const newTask: FactoryExecutionTask = {
      id: `ftask-${Date.now()}`,
      taskCode: taskInput.taskCode || numberingService.consumeNextNumber(orderTypeKey),
      orderType: taskInput.orderType || 'Work Order',
      workPackageId: wp.id,
      workPackageCode: wp.packageCode,
      projectId: taskInput.projectId,
      projectName: taskInput.projectName || wp.projectName,
      factoryId: factory.id,
      factoryName: factory.name,
      productionAreaId: taskInput.productionAreaId || factory.productionAreas[0]?.id || 'pa-01',
      productionAreaName:
        taskInput.productionAreaName ||
        (taskInput as any).productionBayName ||
        (taskInput as any).bayOrLine ||
        factory.productionAreas[0]?.name ||
        'Main Bay 01',
      title: taskInput.title,
      operationStep: taskInput.operationStep || 'Step 10: CNC Cutting, Machining & Assembly',
      capabilityRequired: taskInput.capabilityRequired || 'Aluminium Fabrication',
      drawingNumber: taskInput.drawingNumber || 'DRW-FAB-101',
      drawingRevision: taskInput.drawingRevision || 'Rev C',
      latestApprovedRevision: taskInput.latestApprovedRevision || taskInput.drawingRevision || 'Rev C',
      workerConfirmedLatestRevision: taskInput.workerConfirmedLatestRevision ?? true,
      confirmedByWorkerName: actorName,
      confirmedAt: now,
      methodStatementRef: taskInput.methodStatementRef || wp.methodStatementCode,
      checklistTemplateCode: taskInput.checklistTemplateCode || 'CHK-FAB-STD-01',
      supervisorName: taskInput.supervisorName || factory.factoryManagerName,
      assignedWorkerIds: taskInput.assignedWorkerIds || ['emp-001'],
      assignedWorkerNames: taskInput.assignedWorkerNames || ['Roshan Mendis'],
      assignedMachineIds: taskInput.assignedMachineIds || ['EQ-CNC-01'],
      assignedMachineNames: taskInput.assignedMachineNames || ['Elumatec SBZ 151 5-Axis CNC'],
      unit: taskInput.unit || wp.unit || 'Units',
      plannedQuantity: plannedQty,
      completedQuantity: completedQty,
      rejectedQuantity: 0,
      reworkQuantity: 0,
      remainingQuantity: Math.max(0, plannedQty - completedQty),
      plannedHours: taskInput.plannedHours || 40,
      actualHours: taskInput.actualHours || 0,
      cycleTimeMinutesPerUnit: taskInput.cycleTimeMinutesPerUnit || 45,
      priority: taskInput.priority || 'High',
      startDate: taskInput.startDate || now.slice(0, 10),
      targetDate: taskInput.targetDate || wp.deadlineDate,
      stageStatus: taskInput.stageStatus || 'Assigned',
      predecessorTaskIds: taskInput.predecessorTaskIds || [],
      requiresMaterialIssueComplete: taskInput.requiresMaterialIssueComplete ?? true,
      requiresDrawingConfirmation: taskInput.requiresDrawingConfirmation ?? true,
      requiresQualityInspectionPass: taskInput.requiresQualityInspectionPass ?? true,
      requiresHsePermitActive: taskInput.requiresHsePermitActive ?? false,
      cuttingList: taskInput.cuttingList || [],
      materials: taskInput.materials || [
        {
          id: `tm-${Date.now()}`,
          inventoryItemId: 'inv-001',
          itemCode: 'MAT-ALU-6063',
          materialName: 'Primary Architectural Extrusion / Plate Stock',
          unit: 'Bars',
          requiredQty: plannedQty,
          issuedQty: plannedQty,
          consumedQty: 0,
          returnedQty: 0,
          wastageQty: 0,
          scrapQty: 0,
          shortageQty: 0,
          batchHeatLotNo: `LOT-2026-${Math.floor(1000 + Math.random() * 8999)}`,
          status: 'Fully Issued'
        }
      ],
      supportingDocuments: taskInput.supportingDocuments || [],
      isBottleneck: false,
      delayHours: 0,
      externalPartnerAccepted: factory.ownershipType === 'Innovista Owned',
      assignedWorkflowName: taskInput.assignedWorkflowName || STANDARD_FACTORY_WORKFLOWS[0],
      subTasks: taskInput.subTasks || [],
      audit: {
        createdBy: actorName,
        createdByRole: actorRole,
        createdAt: now,
        updatedBy: actorName,
        updatedByRole: actorRole,
        updatedAt: now,
        revision: 1,
        status: 'Assigned',
        approvalHistory: [
          { stage: 'Task Created & Assigned', actorName, actorRole, decision: 'Approved', timestamp: now, remarks: `Issued to ${factory.name}` }
        ]
      }
    };

    this.tasks.unshift(newTask);
    this.recomputeCriticalPathInternal();
    this.save(STORAGE_KEYS.TASKS, this.tasks);
    this.recordFactoryUpdateNotification(factory.id, 1);
    return { task: newTask };
  }

  public confirmLatestDrawingRevision(user: SecurityUser | null, taskId: string): FactoryExecutionTask {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) throw new Error('Task not found');
    const now = new Date().toISOString();
    task.drawingRevision = task.latestApprovedRevision;
    task.workerConfirmedLatestRevision = true;
    task.confirmedByWorkerName = user?.fullName || task.supervisorName;
    task.confirmedAt = now;
    this.save(STORAGE_KEYS.TASKS, this.tasks);
    return task;
  }

  public uploadTaskSupportingDocument(
    user: SecurityUser | null,
    taskId: string,
    doc: { fileName: string; fileType: string; docCategory: string; fileSize: string; dataUrl?: string }
  ): FactoryExecutionTask {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) throw new Error('Task not found');
    const now = new Date().toISOString();
    const actorName = user?.fullName || task.supervisorName || 'Factory Supervisor';
    const newDoc = {
      id: `tdoc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      fileName: doc.fileName,
      fileType: doc.fileType || 'Document',
      docCategory: doc.docCategory || 'Supporting File',
      fileSize: doc.fileSize || '420 KB (≤ 1 MB)',
      uploadedBy: actorName,
      uploadedAt: now.slice(0, 10),
      dataUrl: doc.dataUrl
    };
    task.supportingDocuments = [newDoc, ...(task.supportingDocuments || [])];

    const isVideo =
      (doc.fileType || '').toLowerCase().includes('video') ||
      /\.(mp4|mov|webm|avi|mkv)$/i.test(doc.fileName);
    const isImage =
      (doc.fileType || '').toLowerCase().includes('image') ||
      /\.(jpg|jpeg|png|webp|gif|bmp|svg)$/i.test(doc.fileName);
    const mediaKind: 'Image' | 'Document' | 'Video' = isVideo ? 'Video' : isImage ? 'Image' : 'Document';

    const evAtt: OnsiteEvidenceAttachment = {
      id: newDoc.id,
      fileName: doc.fileName,
      mediaKind,
      fileSizeBytes: isVideo ? 1800 * 1024 : 420 * 1024,
      fileSizeLabel: doc.fileSize || (isVideo ? '1.8 MB' : '420 KB'),
      maxLimitLabel: isVideo ? '≤ 5 MB (Video)' : '≤ 1 MB (Image/Doc)',
      uploadedBy: actorName,
      uploadedAt: now.slice(0, 10),
      dataUrl: doc.dataUrl
    };
    task.evidenceAttachments = [evAtt, ...(task.evidenceAttachments || [])];

    const qcState = this.getTaskOrSubTaskQcState('TASK', task.id);
    qcState.evidenceAttachments = [evAtt, ...(qcState.evidenceAttachments || [])];
    this.taskSubTaskQcStates[`TASK:${task.id}`] = { ...qcState };
    this.saveTaskSubTaskQcStatesMap();

    this.save(STORAGE_KEYS.TASKS, this.tasks);
    this.recordFactoryUpdateNotification(task.factoryId, 1);
    return task;
  }

  public addExecutionPlanItem(
    workPackageId: string,
    planItem: { phaseName: string; plannedStart: string; plannedEnd: string; owner: string; status?: 'Planned' | 'Progressing' | 'Quality Check' | 'Completed'; notes?: string }
  ): FactoryWorkPackageAssignment {
    const wp = this.workPackages.find(w => w.id === workPackageId);
    if (!wp) throw new Error('Work Package not found');
    const item = {
      id: `plan-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      phaseName: planItem.phaseName,
      plannedStart: planItem.plannedStart,
      plannedEnd: planItem.plannedEnd,
      owner: planItem.owner,
      status: planItem.status || 'Planned',
      notes: planItem.notes
    };
    wp.executionPlan = [...(wp.executionPlan || []), item];
    this.save(STORAGE_KEYS.WORK_PACKAGES, this.workPackages);
    this.recordFactoryUpdateNotification(wp.factoryId, 1);
    return wp;
  }

  public updateExecutionPlanItemStatus(
    workPackageId: string,
    planItemId: string,
    status: 'Planned' | 'Progressing' | 'Quality Check' | 'Completed'
  ): FactoryWorkPackageAssignment {
    const wp = this.workPackages.find(w => w.id === workPackageId);
    if (!wp) throw new Error('Work Package not found');
    wp.executionPlan = (wp.executionPlan || []).map(p => p.id === planItemId ? { ...p, status } : p);
    this.save(STORAGE_KEYS.WORK_PACKAGES, this.workPackages);
    this.recordFactoryUpdateNotification(wp.factoryId, 1);
    return wp;
  }

  public advanceTaskSupervisorWorkflow(
    user: SecurityUser | null,
    taskId: string,
    action: 'start_progress' | 'submit_qc' | 'approve_qc' | 'request_rework' | 'complete_task' | 'dispatch_task',
    qtyIncrement?: number,
    remarks?: string
  ): FactoryExecutionTask {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) throw new Error('Task not found');
    const now = new Date().toISOString();
    const actorName = user?.fullName || task.supervisorName || 'Factory Supervisor';
    const actorRole = user?.roleName || 'Factory Supervisor';

    if (action === 'start_progress') {
      task.workerConfirmedLatestRevision = true;
      task.drawingRevision = task.latestApprovedRevision;
      task.stageStatus = 'In Progress';
      if (qtyIncrement && qtyIncrement > 0) {
        task.completedQuantity = Math.min(task.plannedQuantity, task.completedQuantity + qtyIncrement);
        task.remainingQuantity = Math.max(0, task.plannedQuantity - task.completedQuantity);
      }
    } else if (action === 'submit_qc') {
      task.workerConfirmedLatestRevision = true;
      task.drawingRevision = task.latestApprovedRevision;
      if (qtyIncrement && qtyIncrement > 0) {
        task.completedQuantity = Math.min(task.plannedQuantity, task.completedQuantity + qtyIncrement);
        task.remainingQuantity = Math.max(0, task.plannedQuantity - task.completedQuantity);
      } else if (task.completedQuantity === 0) {
        task.completedQuantity = task.plannedQuantity;
        task.remainingQuantity = 0;
      }
      task.stageStatus = 'Submitted for Inspection';
      this.runAndUploadFactoryManagerQcInspection(user, 'TASK', task.id);
    } else if (action === 'approve_qc') {
      if (!this.canApproveQualityInspection(user)) {
        throw new Error('Only Project Manager or Admin can approve Quality Inspections. Factory Manager can run and upload QC.');
      }
      this.approveTaskOrSubTaskQcByPmOrAdmin(user, 'TASK', task.id, remarks);
      task.stageStatus = 'Approved';
    } else if (action === 'request_rework') {
      this.recordQualityInspection(user, {
        taskId: task.id,
        decision: 'Rework Required',
        qtySubmitted: task.completedQuantity || task.plannedQuantity,
        qtyReworkRequired: 1,
        defectDescription: remarks || 'Rework requested during QC check.'
      });
      task.stageStatus = 'Rework Required';
    } else if (action === 'complete_task') {
      task.completedQuantity = task.plannedQuantity;
      task.remainingQuantity = 0;
      task.materials = task.materials.map(m => ({ ...m, issuedQty: m.requiredQty, status: 'Fully Issued' }));
      if (!task.linkedInspectionId) {
        this.recordQualityInspection(user, {
          taskId: task.id,
          decision: 'Approved',
          qtySubmitted: task.plannedQuantity,
          qtyApproved: task.plannedQuantity
        });
      }
      task.stageStatus = 'Completed';
      task.actualCompletionDate = now.slice(0, 10);
    } else if (action === 'dispatch_task') {
      task.stageStatus = 'Dispatched';
      this.saveDispatchOrUpdateSiteStage(user, {
        workPackageId: task.workPackageId,
        taskIds: [task.id],
        itemDescription: `${task.taskCode} — ${task.title}`,
        totalQuantityDispatched: task.completedQuantity || task.plannedQuantity,
        unit: task.unit
      });
    }

    task.audit.updatedBy = actorName;
    task.audit.updatedByRole = actorRole;
    task.audit.updatedAt = now;
    task.audit.status = task.stageStatus;
    task.audit.approvalHistory.push({
      stage: `Workflow: ${task.stageStatus}`,
      actorName,
      actorRole,
      decision: action === 'request_rework' ? 'Rework Requested' : 'Approved',
      timestamp: now,
      remarks: remarks || `Moved to ${task.stageStatus}`
    });

    this.save(STORAGE_KEYS.TASKS, this.tasks);
    this.recordFactoryUpdateNotification(task.factoryId, 1);
    this.recalculateWorkPackageProgress(task.workPackageId);
    return task;
  }

  // --- 5. Digital Worksheet Recording (Updates Task & WP Progress Automatically) ---
  public saveWorksheet(
    user: SecurityUser | null,
    wsInput: Partial<DigitalWorksheetRecord> & { taskId: string; producedQty: number }
  ): DigitalWorksheetRecord {
    const now = new Date().toISOString();
    const actorName = user?.fullName || wsInput.recordedByWorkerName || 'Kasun Perera';
    const actorRole = user?.roleName || 'Shop-Floor Supervisor';
    const task = this.tasks.find(t => t.id === wsInput.taskId) || this.tasks[0];

    if (wsInput.id) {
      const idx = this.worksheets.findIndex(w => w.id === wsInput.id);
      if (idx !== -1) {
        const existing = this.worksheets[idx];
        const updated: DigitalWorksheetRecord = {
          ...existing,
          ...wsInput,
          audit: {
            ...existing.audit,
            updatedBy: actorName,
            updatedByRole: actorRole,
            updatedAt: now,
            revision: (existing.audit?.revision || 1) + 1
          }
        };
        this.worksheets[idx] = updated;
        this.save(STORAGE_KEYS.WORKSHEETS, this.worksheets);
        return updated;
      }
    }

    const newWs: DigitalWorksheetRecord = {
      id: `dws-${Date.now()}`,
      worksheetNo: wsInput.worksheetNo || `DWS-2026-${Math.floor(1000 + Math.random() * 8999)}`,
      activityType: wsInput.activityType || 'Unitized Curtain Wall Assembly',
      projectId: task.projectId,
      projectName: task.projectName,
      factoryId: task.factoryId,
      factoryName: task.factoryName,
      workPackageId: task.workPackageId,
      taskId: task.id,
      taskCode: task.taskCode,
      drawingNumber: task.drawingNumber,
      drawingRevision: task.drawingRevision,
      recordedDate: wsInput.recordedDate || now.slice(0, 10),
      shift: wsInput.shift || 'Morning Shift',
      recordedByWorkerName: wsInput.recordedByWorkerName || actorName,
      verifiedBySupervisorName: wsInput.verifiedBySupervisorName || task.supervisorName,
      machineId: wsInput.machineId || task.assignedMachineIds[0],
      machineName: wsInput.machineName || task.assignedMachineNames[0],
      machineMeterReadingStart: wsInput.machineMeterReadingStart || 1200,
      machineMeterReadingEnd: wsInput.machineMeterReadingEnd || 1208,
      labourHoursLogged: wsInput.labourHoursLogged || 8,
      plannedQtyForShift: wsInput.plannedQtyForShift || wsInput.producedQty,
      producedQty: wsInput.producedQty,
      acceptedQty: wsInput.acceptedQty ?? wsInput.producedQty,
      rejectedQty: wsInput.rejectedQty || 0,
      reworkQty: wsInput.reworkQty || 0,
      materialConsumedSummary: wsInput.materialConsumedSummary || 'Standard BOM allocation consumed per unit',
      wastageRecordedQty: wsInput.wastageRecordedQty || 0.2,
      wastageUnit: wsInput.wastageUnit || 'kg',
      cuttingDetails: wsInput.cuttingDetails || 'Verified against CNC cutting list',
      weldingDetails: wsInput.weldingDetails || 'Per approved WPS specification',
      assemblyDetails: wsInput.assemblyDetails || 'Gaskets, hardware & sealants verified',
      measurements: wsInput.measurements || [
        { id: `m-${Date.now()}-1`, parameterName: 'Primary Dimension Width (mm)', nominalValue: 1500, tolerancePlusMm: 1.5, toleranceMinusMm: 1.5, actualMeasuredValue: 1500.2, unit: 'mm', withinSpec: true },
        { id: `m-${Date.now()}-2`, parameterName: 'Diagonal Squareness |D1-D2| (mm)', nominalValue: 0, tolerancePlusMm: 1.5, toleranceMinusMm: 0, actualMeasuredValue: 0.7, unit: 'mm', withinSpec: true }
      ],
      inspectionResult: wsInput.inspectionResult || 'Pass',
      problemsEncountered: wsInput.problemsEncountered || 'None',
      supervisorRemarks: wsInput.supervisorRemarks || 'Verified on shop floor.',
      completionStatus: wsInput.completionStatus || 'Supervisor Verified',
      syncedFromOfflineMobile: wsInput.syncedFromOfflineMobile,
      audit: {
        createdBy: actorName,
        createdByRole: actorRole,
        createdAt: now,
        updatedBy: actorName,
        updatedByRole: actorRole,
        updatedAt: now,
        revision: 1,
        status: wsInput.completionStatus || 'Supervisor Verified',
        approvalHistory: []
      }
    };

    this.worksheets.unshift(newWs);
    this.save(STORAGE_KEYS.WORKSHEETS, this.worksheets);

    // Update linked task quantities
    task.completedQuantity = Math.min(task.plannedQuantity, task.completedQuantity + (newWs.acceptedQty || 0));
    task.rejectedQuantity += newWs.rejectedQty || 0;
    task.reworkQuantity += newWs.reworkQty || 0;
    task.remainingQuantity = Math.max(0, task.plannedQuantity - task.completedQuantity);
    task.actualHours += newWs.labourHoursLogged || 0;
    if (task.stageStatus === 'Assigned' || task.stageStatus === 'Planned' || task.stageStatus === 'Ready') {
      task.stageStatus = 'In Progress';
    }
    this.save(STORAGE_KEYS.TASKS, this.tasks);
    this.recordFactoryUpdateNotification(task.factoryId, 1);
    this.recalculateWorkPackageProgress(task.workPackageId);

    return newWs;
  }

  // --- 6. Quality Inspection, Approval / Rejection & Automatic Rework Loop ---
  public recordQualityInspection(
    user: SecurityUser | null,
    inspInput: Partial<FactoryQualityInspectionRecord> & { taskId: string; decision: FactoryQualityInspectionRecord['decision'] }
  ): FactoryQualityInspectionRecord {
    const now = new Date().toISOString();
    const actorName = user?.fullName || inspInput.inspectorName || 'David Okafor';
    const actorRole = user?.roleName || 'Quality Inspector';
    const task = this.tasks.find(t => t.id === inspInput.taskId) || this.tasks[0];

    const newInsp: FactoryQualityInspectionRecord = {
      id: `finsp-${Date.now()}`,
      inspectionNo: inspInput.inspectionNo || `FIR-2026-${Math.floor(305 + Math.random() * 600)}`,
      inspectionType: inspInput.inspectionType || 'Final Factory Acceptance Test (FAT)',
      itpReference: inspInput.itpReference || 'ITP-CW-2026-01',
      projectId: task.projectId,
      projectName: task.projectName,
      factoryId: task.factoryId,
      factoryName: task.factoryName,
      workPackageId: task.workPackageId,
      taskId: task.id,
      taskCode: task.taskCode,
      requestedBy: inspInput.requestedBy || task.supervisorName,
      requestDate: inspInput.requestDate || now.slice(0, 10),
      inspectorName: actorName,
      inspectionDate: now.slice(0, 10),
      qtySubmitted: inspInput.qtySubmitted ?? task.completedQuantity,
      qtyApproved: inspInput.qtyApproved ?? (inspInput.decision === 'Approved' ? task.completedQuantity : 0),
      qtyRejected: inspInput.qtyRejected ?? 0,
      qtyReworkRequired: inspInput.qtyReworkRequired ?? 0,
      checklistResults: inspInput.checklistResults || [
        { item: 'Dimensional & Tolerance Verification', standard: 'Per AFC Drawing ±1.0mm', measured: 'Within Spec', result: inspInput.decision.includes('Rejected') ? 'Fail' : 'Pass' },
        { item: 'Material & MTC Traceability Check', standard: 'EN 10204 3.1 Cert', measured: 'Verified', result: 'Pass' }
      ],
      decision: inspInput.decision,
      linkedCentralNcrCode: inspInput.decision.includes('Rejected') || inspInput.decision === 'Rework Required' ? `NCR-2026-${Math.floor(100 + Math.random() * 899)}` : undefined,
      defectDescription: inspInput.defectDescription,
      rootCause5Why: inspInput.rootCause5Why,
      correctiveActionPlan: inspInput.correctiveActionPlan,
      reinspectionStatus: inspInput.decision === 'Rework Required' || inspInput.decision.includes('Rejected') ? 'Pending Reinspection' : 'Not Applicable',
      clientOrConsultantSignOff: inspInput.clientOrConsultantSignOff,
      audit: {
        createdBy: actorName,
        createdByRole: actorRole,
        createdAt: now,
        updatedBy: actorName,
        updatedByRole: actorRole,
        updatedAt: now,
        revision: 1,
        status: inspInput.decision,
        approvalHistory: [
          {
            stage: `QA Inspection Decision: ${inspInput.decision}`,
            actorName,
            actorRole,
            decision: inspInput.decision === 'Approved' ? 'Approved' : inspInput.decision === 'Rework Required' ? 'Rework Requested' : 'Rejected',
            timestamp: now,
            remarks: inspInput.defectDescription || 'Inspection completed per ITP.'
          }
        ]
      }
    };

    this.inspections.unshift(newInsp);
    this.save(STORAGE_KEYS.INSPECTIONS, this.inspections);

    // Automatically update task stageStatus based on QC decision
    task.linkedInspectionId = newInsp.id;
    if (inspInput.decision === 'Approved' || inspInput.decision === 'Conditionally Approved') {
      task.stageStatus = 'Approved';
    } else if (inspInput.decision === 'Rework Required') {
      task.stageStatus = 'Rework Required';
      task.reworkQuantity += newInsp.qtyReworkRequired || 1;
    } else if (inspInput.decision === 'Rejected - NCR Raised') {
      task.stageStatus = 'Rejected';
      task.rejectedQuantity += newInsp.qtyRejected || 1;
      task.linkedNcrId = newInsp.linkedCentralNcrCode;
    }
    this.save(STORAGE_KEYS.TASKS, this.tasks);
    this.recordFactoryUpdateNotification(task.factoryId, 1);
    this.recalculateWorkPackageProgress(task.workPackageId);

    return newInsp;
  }

  // --- 7. Dispatch, Packing & Site Installation Progression ---
  public saveDispatchOrUpdateSiteStage(
    user: SecurityUser | null,
    dspInput: Partial<FactoryDispatchAndSiteRecord> & { workPackageId: string }
  ): FactoryDispatchAndSiteRecord {
    const now = new Date().toISOString();
    const actorName = user?.fullName || 'Marcus Silva';
    const actorRole = user?.roleName || 'Logistics / Site Coordinator';
    const wp = this.workPackages.find(w => w.id === dspInput.workPackageId) || this.workPackages[0];

    const existingIdx = dspInput.id ? this.dispatches.findIndex(d => d.id === dspInput.id) : -1;
    if (existingIdx >= 0) {
      const prev = this.dispatches[existingIdx];
      const updated: FactoryDispatchAndSiteRecord = {
        ...prev,
        ...dspInput,
        audit: {
          ...prev.audit,
          updatedBy: actorName,
          updatedByRole: actorRole,
          updatedAt: now,
          revision: prev.audit.revision + 1,
          status: dspInput.lifecycleStage || prev.lifecycleStage,
          approvalHistory: [
            ...prev.audit.approvalHistory,
            {
              stage: dspInput.lifecycleStage || prev.lifecycleStage,
              actorName,
              actorRole,
              decision: 'Verified',
              timestamp: now,
              remarks: `Installed Qty: ${dspInput.installedQuantity ?? prev.installedQuantity}/${prev.totalQuantityDispatched}`
            }
          ]
        }
      };
      this.dispatches[existingIdx] = updated;
      this.save(STORAGE_KEYS.DISPATCHES, this.dispatches);
      this.recordFactoryUpdateNotification(updated.factoryId, 1);
      this.recalculateWorkPackageProgress(updated.workPackageId);
      return updated;
    }

    const lineItems = dspInput.dispatchLineItems || [];
    const computedQty =
      lineItems.length > 0
        ? lineItems.reduce((sum, it) => sum + (Number(it.dispatchedQty) || 0), 0)
        : dspInput.totalQuantityDispatched || 24;
    const computedWeight =
      lineItems.length > 0
        ? lineItems.reduce((sum, it) => sum + (Number(it.totalWeightKg) || 0), 0)
        : dspInput.grossWeightKg || computedQty * 280;
    const qty = computedQty;
    const newDsp: FactoryDispatchAndSiteRecord = {
      id: `fdsp-${Date.now()}`,
      dispatchNo: dspInput.dispatchNo || `DSP-2026-${Math.floor(100 + Math.random() * 899)}`,
      deliveryNoteNo: dspInput.deliveryNoteNo || `DN-2026-${Math.floor(100 + Math.random() * 899)}`,
      packingListNo: dspInput.packingListNo || `PKL-2026-${Math.floor(100 + Math.random() * 899)}`,
      projectId: wp.projectId,
      projectName: wp.projectName,
      factoryId: wp.factoryId,
      factoryName: wp.factoryName,
      workPackageId: wp.id,
      taskIds: dspInput.taskIds || [],
      itemDescription: dspInput.itemDescription || `${wp.title} - Crated Batch`,
      dispatchLineItems: lineItems,
      totalCratesOrPallets: dspInput.totalCratesOrPallets || Math.max(1, lineItems.length || 4),
      totalQuantityDispatched: qty,
      unit: dspInput.unit || wp.unit,
      grossWeightKg: computedWeight,
      qrBatchLabelCode: `QR-${wp.packageCode}-${Date.now().toString().slice(-4)}`,
      packingVerifiedBy: dspInput.packingVerifiedBy || actorName,
      loadingPhotoVerified: true,
      vehicleRegistrationNo: dspInput.vehicleRegistrationNo || 'WP LM-8821 (Low-Bed Trailer)',
      vehicleType: dspInput.vehicleType || '40ft Air-Ride Flatbed',
      driverName: dspInput.driverName || 'Bandula Jayasinghe',
      driverPhone: dspInput.driverPhone || '+94 77 312 8840',
      dispatchDate: dspInput.dispatchDate || now.slice(0, 10),
      expectedSiteArrival: dspInput.expectedSiteArrival || `${now.slice(0, 10)} 15:30`,
      siteDeliveryLocation: dspInput.siteDeliveryLocation || `${wp.projectName} - Tower Crane Zone A`,
      damagedQuantity: 0,
      missingQuantity: 0,
      assignedSiteInstallationTeam: dspInput.assignedSiteInstallationTeam || 'Site Facade Erection Team Alpha',
      siteSupervisorName: dspInput.siteSupervisorName || 'Samir Al-Nasser',
      installationZoneOrElevation: dspInput.installationZoneOrElevation || 'Main Elevation Grid A-F',
      installedQuantity: dspInput.installedQuantity || 0,
      installationProgressPercent: 0,
      lifecycleStage: dspInput.lifecycleStage || 'Loaded & Dispatched',
      audit: {
        createdBy: actorName,
        createdByRole: actorRole,
        createdAt: now,
        updatedBy: actorName,
        updatedByRole: actorRole,
        updatedAt: now,
        revision: 1,
        status: 'Loaded & Dispatched',
        approvalHistory: [
          { stage: 'Packing & Dispatch Release', actorName, actorRole, decision: 'Approved', timestamp: now, remarks: `Dispatched ${qty} ${wp.unit} to site.` }
        ]
      }
    };

    this.dispatches.unshift(newDsp);
    this.save(STORAGE_KEYS.DISPATCHES, this.dispatches);
    this.recordFactoryUpdateNotification(wp.factoryId, 1);
    this.recalculateWorkPackageProgress(wp.id);
    return newDsp;
  }

  // --- 8. Daily Report, Media Evidence, Document Control & Document Generation ---
  public saveDailyReport(
    user: SecurityUser | null,
    reportInput: Partial<DailyFactoryActivityReport> & { factoryId: string; projectId: string }
  ): DailyFactoryActivityReport {
    const now = new Date().toISOString();
    const actorName = user?.fullName || reportInput.shiftSupervisor || 'Eng. Chaminda Rajapakse';
    const actorRole = user?.roleName || 'Plant Supervisor';
    const factory = this.factories.find(f => f.id === reportInput.factoryId) || this.factories[0];

    if (reportInput.id) {
      const idx = this.dailyReports.findIndex(r => r.id === reportInput.id);
      if (idx !== -1) {
        const existing = this.dailyReports[idx];
        const updated: DailyFactoryActivityReport = {
          ...existing,
          ...reportInput,
          audit: {
            ...existing.audit,
            updatedBy: actorName,
            updatedByRole: actorRole,
            updatedAt: now,
            revision: (existing.audit?.revision || 1) + 1
          }
        };
        this.dailyReports[idx] = updated;
        this.save(STORAGE_KEYS.DAILY_REPORTS, this.dailyReports);
        return updated;
      }
    }

    const newRep: DailyFactoryActivityReport = {
      id: `dfar-${Date.now()}`,
      reportNo: `DFAR-2026-${Math.floor(1030 + Math.random() * 899)}`,
      date: reportInput.date || now.slice(0, 10),
      factoryId: factory.id,
      factoryName: factory.name,
      projectId: reportInput.projectId,
      projectName: reportInput.projectName || reportInput.projectId,
      shiftSupervisor: reportInput.shiftSupervisor || actorName,
      weatherOrShopCondition: reportInput.weatherOrShopCondition || 'Shop Floor Optimal (24°C, 50% RH)',
      plannedActivitiesSummary: reportInput.plannedActivitiesSummary || 'Scheduled CNC fabrication, assembly and QC verification.',
      completedActivitiesSummary: reportInput.completedActivitiesSummary || 'Completed scheduled shift targets per work orders.',
      plannedUnitsToday: reportInput.plannedUnitsToday || 25,
      completedUnitsToday: reportInput.completedUnitsToday || 25,
      activeWorkersCount: reportInput.activeWorkersCount || 32,
      totalManHours: reportInput.totalManHours || 256,
      overtimeHours: reportInput.overtimeHours || 16,
      activeMachinesCount: reportInput.activeMachinesCount || 5,
      machineHoursLogged: reportInput.machineHoursLogged || 40,
      materialsUsedSummary: reportInput.materialsUsedSummary || 'Extrusions, DGU Glass & Structural Sealants per BOM',
      delaysEncountered: reportInput.delaysEncountered || 'None',
      delayReasonCategory: reportInput.delayReasonCategory || 'None',
      delayDurationHours: reportInput.delayDurationHours || 0,
      qualityIssuesSummary: reportInput.qualityIssuesSummary || 'Zero critical defects',
      hseIssuesSummary: reportInput.hseIssuesSummary || 'Zero incidents • 100% PPE compliance',
      toolboxTalkTopic: reportInput.toolboxTalkTopic || 'Safe Material Handling & Machine Guarding Check',
      measurementsSummary: reportInput.measurementsSummary || 'All spot-checks within ±1.0mm tolerance',
      nextDayPlan: reportInput.nextDayPlan || 'Continue next batch fabrication and FAT testing',
      supervisorComments: reportInput.supervisorComments || 'On track with master schedule.',
      evidenceAttachmentIds: [],
      status: 'Submitted',
      audit: {
        createdBy: actorName,
        createdByRole: actorRole,
        createdAt: now,
        updatedBy: actorName,
        updatedByRole: actorRole,
        updatedAt: now,
        revision: 1,
        status: 'Submitted',
        approvalHistory: []
      }
    };

    this.dailyReports.unshift(newRep);
    this.save(STORAGE_KEYS.DAILY_REPORTS, this.dailyReports);
    this.recordFactoryUpdateNotification(factory.id, 1);
    return newRep;
  }

  public addMediaEvidence(
    user: SecurityUser | null,
    evdInput: Partial<MediaEvidenceRecord> & { description: string; factoryId: string; projectId: string }
  ): MediaEvidenceRecord {
    const now = new Date().toISOString();
    const actorName = user?.fullName || evdInput.capturedByName || 'Kasun Perera';
    const actorRole = user?.roleName || 'Supervisor';
    const factory = this.factories.find(f => f.id === evdInput.factoryId) || this.factories[0];
    const task = this.tasks.find(t => t.id === evdInput.taskId) || this.tasks[0];

    const newEvd: MediaEvidenceRecord = {
      id: `evd-${Date.now()}`,
      evidenceCode: `EVD-2026-${Math.floor(510 + Math.random() * 480)}`,
      mediaType: evdInput.mediaType || 'Photograph',
      stageCategory: evdInput.stageCategory || 'During Fabrication / Production',
      projectId: evdInput.projectId,
      projectName: evdInput.projectName || evdInput.projectId,
      factoryId: factory.id,
      factoryName: factory.name,
      workPackageId: evdInput.workPackageId || task.workPackageId,
      taskId: task.id,
      taskCode: task.taskCode,
      activityName: evdInput.activityName || task.title,
      capturedAt: now,
      gpsLocation: evdInput.gpsLocation || factory.gpsCoordinates,
      capturedByName: actorName,
      capturedByRole: actorRole,
      description: evdInput.description,
      dimensionsVerifiedText: evdInput.dimensionsVerifiedText || 'Verified against AFC Drawing',
      thumbnailPreviewUrl:
        evdInput.mediaUrl ||
        evdInput.thumbnailPreviewUrl ||
        'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
      mediaUrl:
        evdInput.mediaUrl ||
        evdInput.thumbnailPreviewUrl ||
        'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
      fileName: evdInput.fileName || `${evdInput.evidenceCode || 'Evidence'}.jpg`,
      fileSizeLabel: evdInput.fileSizeLabel || '420 KB (≤ 1 MB Image/Doc)',
      verifiedByQa: true,
      audit: {
        createdBy: actorName,
        createdByRole: actorRole,
        createdAt: now,
        updatedBy: actorName,
        updatedByRole: actorRole,
        updatedAt: now,
        revision: 1,
        status: 'Verified',
        approvalHistory: []
      }
    };

    this.mediaEvidence.unshift(newEvd);
    this.save(STORAGE_KEYS.MEDIA_EVIDENCE, this.mediaEvidence);
    this.recordFactoryUpdateNotification(factory.id, 1);
    return newEvd;
  }

  public uploadOrReviseTechnicalDocument(
    user: SecurityUser | null,
    docInput: Partial<ControlledTechnicalDocument> & { docNumber: string; title: string; factoryId: string; projectId: string }
  ): ControlledTechnicalDocument {
    const now = new Date().toISOString();
    const actorName = user?.fullName || 'Eng. Nuwan Senanayake';
    const actorRole = user?.roleName || 'Chief Engineer';
    const factory = this.factories.find(f => f.id === docInput.factoryId) || this.factories[0];

    const existingIdx = this.documents.findIndex(d => d.docNumber === docInput.docNumber || d.id === docInput.id);
    if (existingIdx >= 0) {
      const prev = this.documents[existingIdx];
      const newRev = docInput.currentRevision || `Rev ${String.fromCharCode(prev.currentRevision.charCodeAt(prev.currentRevision.length - 1) + 1)}`;
      const updated: ControlledTechnicalDocument = {
        ...prev,
        ...docInput,
        currentRevision: newRev,
        previousRevisions: [
          ...prev.previousRevisions,
          { rev: prev.currentRevision, date: now.slice(0, 10), author: prev.audit.updatedBy, notes: 'Superseded by newer revision' }
        ],
        audit: {
          ...prev.audit,
          updatedBy: actorName,
          updatedByRole: actorRole,
          updatedAt: now,
          revision: prev.audit.revision + 1,
          status: docInput.approvalStatus || prev.approvalStatus,
          approvalHistory: [
            ...prev.audit.approvalHistory,
            { stage: `Revised to ${newRev}`, actorName, actorRole, decision: 'Approved', timestamp: now, remarks: docInput.technicalInstructions || 'Issued new revision.' }
          ]
        }
      };
      this.documents[existingIdx] = updated;
      this.save(STORAGE_KEYS.DOCUMENTS, this.documents);
      // Flag tasks using this drawing so workers must confirm new revision
      this.tasks.forEach(t => {
        if (t.drawingNumber === updated.docNumber && t.latestApprovedRevision !== newRev) {
          t.latestApprovedRevision = newRev;
          t.workerConfirmedLatestRevision = false;
        }
      });
      this.save(STORAGE_KEYS.TASKS, this.tasks);
      return updated;
    }

    const newDoc: ControlledTechnicalDocument = {
      id: `cdoc-${Date.now()}`,
      docNumber: docInput.docNumber,
      title: docInput.title,
      category: docInput.category || 'Fabrication Drawing',
      projectId: docInput.projectId,
      projectName: docInput.projectName || docInput.projectId,
      factoryId: factory.id,
      factoryName: factory.name,
      workPackageId: docInput.workPackageId || 'fwp-01',
      currentRevision: docInput.currentRevision || 'Rev A',
      previousRevisions: [],
      approvalStatus: docInput.approvalStatus || 'Approved for Construction (AFC)',
      technicalInstructions: docInput.technicalInstructions || 'Verify all critical tolerances before cutting.',
      fileSize: docInput.fileSize || '680 KB (≤ 1 MB Image/Doc)',
      dataUrl: docInput.dataUrl,
      distributedToFactories: [factory.name],
      workerReadConfirmations: [],
      audit: {
        createdBy: actorName,
        createdByRole: actorRole,
        createdAt: now,
        updatedBy: actorName,
        updatedByRole: actorRole,
        updatedAt: now,
        revision: 1,
        status: 'Approved for Construction (AFC)',
        approvalHistory: []
      }
    };

    this.documents.unshift(newDoc);
    this.save(STORAGE_KEYS.DOCUMENTS, this.documents);
    this.recordFactoryUpdateNotification(factory.id, 1);
    return newDoc;
  }

  public generateOperationalDocument(
    user: SecurityUser | null,
    docType: GeneratedFactoryDocType,
    projectId: string,
    factoryId: string,
    workPackageCode?: string,
    taskCode?: string,
    summaryData?: Record<string, string | number>
  ): GeneratedFactoryDocument {
    const factory = this.factories.find(f => f.id === factoryId) || this.factories[0];
    const newDoc: GeneratedFactoryDocument = {
      id: `gdoc-${Date.now()}`,
      docControlNo: `DOC-${docType.slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 8999)}`,
      docType,
      title: `${docType} — ${factory.name} (${taskCode || workPackageCode || projectId})`,
      projectId,
      projectName: projectId,
      factoryId: factory.id,
      factoryName: factory.name,
      workPackageCode,
      taskCode,
      generatedBy: user?.fullName || 'Marcus Sterling',
      generatedAt: new Date().toISOString(),
      revision: 'Rev A',
      status: 'Issued',
      summaryData: summaryData || {
        Factory: factory.factoryCode,
        Project: projectId,
        WorkPackage: workPackageCode || 'All Active',
        TaskRef: taskCode || 'Master Schedule',
        Verification: 'Traceable & Audited'
      }
    };

    this.generatedDocs.unshift(newDoc);
    this.save(STORAGE_KEYS.GENERATED_DOCS, this.generatedDocs);
    this.recordFactoryUpdateNotification(factory.id, 1);
    return newDoc;
  }

  // --- 9. Offline Mobile Queue & Sync ---
  public queueOfflineMobileRecord(
    recordType: OfflineSyncQueueItem['recordType'],
    factoryName: string,
    taskCode: string,
    summary: string,
    capturedBy: string,
    payload: any
  ): OfflineSyncQueueItem {
    const item: OfflineSyncQueueItem = {
      id: `off-${Date.now()}`,
      recordType,
      factoryName,
      taskCode,
      summary,
      capturedBy,
      capturedAtOffline: new Date().toISOString(),
      syncStatus: 'Queued (Offline)',
      payload
    };
    this.offlineQueue.unshift(item);
    this.save(STORAGE_KEYS.OFFLINE_QUEUE, this.offlineQueue);
    return item;
  }

  public syncAllOfflineRecords(user: SecurityUser | null): number {
    let syncedCount = 0;
    for (const item of this.offlineQueue) {
      if (item.syncStatus === 'Queued (Offline)') {
        item.syncStatus = 'Synchronized';
        syncedCount++;
        if (item.recordType === 'Task Progress' && item.payload?.taskId) {
          const t = this.tasks.find(tk => tk.id === item.payload.taskId || tk.taskCode === item.taskCode);
          if (t) {
            t.completedQuantity = Math.min(t.plannedQuantity, t.completedQuantity + (item.payload.deltaCompleted || 1));
            t.remainingQuantity = Math.max(0, t.plannedQuantity - t.completedQuantity);
            t.actualHours += item.payload.hours || 2;
          }
        }
      }
    }
    this.save(STORAGE_KEYS.TASKS, this.tasks);
    this.save(STORAGE_KEYS.OFFLINE_QUEUE, this.offlineQueue);
    if (syncedCount > 0) {
      centralApiGateway.dispatchNotification(user, 'Offline Mobile Records Synchronized', `${syncedCount} shop-floor/site records synced to central database.`, 'info', 'shop-floor');
    }
    return syncedCount;
  }

  private recalculateWorkPackageProgress(workPackageId: string) {
    const wp = this.workPackages.find(w => w.id === workPackageId);
    if (!wp) return;
    const wpTasks = this.tasks.filter(t => t.workPackageId === workPackageId);
    if (wpTasks.length > 0) {
      const totalPlanned = wpTasks.reduce((s, t) => s + t.plannedQuantity, 0);
      const totalDone = wpTasks.reduce((s, t) => s + t.completedQuantity, 0);
      const totalRej = wpTasks.reduce((s, t) => s + t.rejectedQuantity, 0);
      const totalRew = wpTasks.reduce((s, t) => s + t.reworkQuantity, 0);
      if (totalPlanned > 0) {
        wp.completionPercent = Math.min(100, Math.round((totalDone / totalPlanned) * 100));
      }
      wp.rejectedQuantity = totalRej;
      wp.reworkQuantity = totalRew;
    }
    const wpDispatches = this.dispatches.filter(d => d.workPackageId === workPackageId);
    if (wpDispatches.length > 0) {
      wp.dispatchedQuantity = wpDispatches.reduce((s, d) => s + d.totalQuantityDispatched, 0);
      wp.installedQuantity = wpDispatches.reduce((s, d) => s + d.installedQuantity, 0);
    }
    this.save(STORAGE_KEYS.WORK_PACKAGES, this.workPackages);
  }

  // --- 10. Evidence File Size Validation (1MB max per Image/Document, 5MB max per Video) ---
  public validateEvidenceFileSize(file: File): {
    valid: boolean;
    mediaKind: 'Image' | 'Document' | 'Video';
    fileSizeBytes: number;
    fileSizeLabel: string;
    maxLimitLabel: '≤ 1 MB (Image/Doc)' | '≤ 5 MB (Video)';
    error?: string;
  } {
    const isVideo =
      file.type.startsWith('video/') ||
      /\.(mp4|mov|webm|avi|mkv)$/i.test(file.name);
    const isImage =
      file.type.startsWith('image/') ||
      /\.(jpg|jpeg|png|webp|gif|bmp|svg)$/i.test(file.name);
    const mediaKind: 'Image' | 'Document' | 'Video' = isVideo ? 'Video' : isImage ? 'Image' : 'Document';
    const maxBytes = isVideo ? 5 * 1024 * 1024 : 1 * 1024 * 1024;
    const maxLimitLabel = isVideo ? '≤ 5 MB (Video)' : '≤ 1 MB (Image/Doc)';
    const sizeKb = Math.max(1, Math.round(file.size / 1024));
    const fileSizeLabel = sizeKb >= 1024 ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : `${sizeKb} KB`;

    if (file.size > maxBytes) {
      return {
        valid: false,
        mediaKind,
        fileSizeBytes: file.size,
        fileSizeLabel,
        maxLimitLabel,
        error: `${mediaKind} "${file.name}" (${fileSizeLabel}) exceeds the ${isVideo ? '5 MB video' : '1 MB image/document'} limit.`
      };
    }

    return {
      valid: true,
      mediaKind,
      fileSizeBytes: file.size,
      fileSizeLabel,
      maxLimitLabel
    };
  }

  public readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  public downloadMediaOrFile(fileName: string, dataUrl?: string, fallbackText?: string) {
    const safeName = fileName || `Factory_Record_${Date.now()}.txt`;
    if (dataUrl && (dataUrl.startsWith('data:') || dataUrl.startsWith('blob:'))) {
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = safeName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }
    if (dataUrl && dataUrl.startsWith('http')) {
      fetch(dataUrl)
        .then(r => r.blob())
        .then(blob => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = safeName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        })
        .catch(() => {
          const blob = new Blob([fallbackText || `File: ${safeName}\nSource: ${dataUrl}`], {
            type: 'text/plain;charset=utf-8'
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = safeName;
          a.click();
          URL.revokeObjectURL(url);
        });
      return;
    }
    const blob = new Blob(
      [
        fallbackText ||
          `INNOVISTA FACTORY EXECUTION RECORD\nFile Name: ${safeName}\nExported At: ${new Date().toISOString()}\nStatus: Verified & Controlled`
      ],
      { type: 'text/plain;charset=utf-8' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = safeName;
    a.click();
    URL.revokeObjectURL(url);
  }

  private initEnhancedSubPortalsData() {
    // 0. Ensure existing dispatches have rich itemized manifest line items (Project BOQ Items, Finished Products, Raw Materials)
    let dspChanged = false;
    this.dispatches.forEach((d, idx) => {
      if (!d.dispatchLineItems || d.dispatchLineItems.length === 0) {
        d.dispatchLineItems = [
          {
            id: `dli-${d.id}-1`,
            itemCode: `BOQ-CW-0${idx + 1}`,
            itemCategory: 'Project BOQ Item',
            itemName: `${d.itemDescription} — Main Elevation Curtain Wall Panel`,
            sourceRef: `BOQ-10${idx + 1}`,
            crateOrPalletNo: `CRT-0${idx + 1}A`,
            dimensionsOrSpec: '1500mm × 3600mm (6063-T6 PVDF + 28mm DGU)',
            dispatchedQty: Math.max(1, Math.round(d.totalQuantityDispatched * 0.6)),
            installedQty: Math.min(d.installedQuantity, Math.round(d.totalQuantityDispatched * 0.6)),
            unit: d.unit || 'Panels',
            unitWeightKg: 145,
            totalWeightKg: Math.max(1, Math.round(d.totalQuantityDispatched * 0.6)) * 145,
            qcVerified: true,
            remarks: 'FAT Passed & Protective Film Applied'
          },
          {
            id: `dli-${d.id}-2`,
            itemCode: `PRD-FAB-0${idx + 1}`,
            itemCategory: 'Finished Product / Task',
            itemName: 'CNC Milled Transom & Mullion Sub-Assemblies',
            sourceRef: d.taskIds[0] || 'WO-2026-101',
            crateOrPalletNo: `CRT-0${idx + 1}B`,
            dimensionsOrSpec: 'Custom Milled per AFC Rev C',
            dispatchedQty: Math.max(1, d.totalQuantityDispatched - Math.round(d.totalQuantityDispatched * 0.6)),
            installedQty: Math.max(0, d.installedQuantity - Math.round(d.totalQuantityDispatched * 0.6)),
            unit: d.unit || 'Sets',
            unitWeightKg: 85,
            totalWeightKg:
              Math.max(1, d.totalQuantityDispatched - Math.round(d.totalQuantityDispatched * 0.6)) * 85,
            qcVerified: true,
            remarks: 'Pre-fitted EPDM gaskets included'
          },
          {
            id: `dli-${d.id}-3`,
            itemCode: `MAT-HDW-0${idx + 1}`,
            itemCategory: 'Hardware / Accessory',
            itemName: 'SS316 Deadload Anchor Brackets, Shims & Structural Silicone Kit',
            sourceRef: 'INV-HDW-316',
            crateOrPalletNo: `PLT-0${idx + 1}C`,
            dimensionsOrSpec: 'ASTM A240 Grade 316 + Dow Corning 995',
            dispatchedQty: 24,
            installedQty: 18,
            unit: 'Kits',
            unitWeightKg: 12,
            totalWeightKg: 288,
            qcVerified: true,
            remarks: 'Site installation hardware pack'
          }
        ];
        dspChanged = true;
      }
    });
    if (dspChanged) {
      this.save(STORAGE_KEYS.DISPATCHES, this.dispatches);
    }
    // 1. Ensure tasks have workflows, subTasks, and Critical Path calculation
    let tasksChanged = false;
    this.tasks.forEach((t, idx) => {
      if (!t.assignedWorkflowName) {
        t.assignedWorkflowName = STANDARD_FACTORY_WORKFLOWS[idx % STANDARD_FACTORY_WORKFLOWS.length];
        tasksChanged = true;
      } else if (/[→➔➜➡⟶⇒▸▶]/.test(t.assignedWorkflowName)) {
        t.assignedWorkflowName = t.assignedWorkflowName.replace(/\s*[→➔➜➡⟶⇒▸▶]\s*/g, ' -> ');
        tasksChanged = true;
      }
      if (!t.productionAreaName) {
        t.productionAreaName = (t as any).productionBayName || (t as any).bayOrLine || t.factoryName || 'Main Fabrication Bay';
        tasksChanged = true;
      }
      if (!t.drawingNumber) {
        t.drawingNumber = 'DRW-FAB-101';
        tasksChanged = true;
      }
      if (!t.subTasks || t.subTasks.length === 0) {
        t.subTasks = [
          {
            id: `sub-${t.id}-1`,
            subTaskCode: `${t.taskCode}-S1`,
            parentTaskId: t.id,
            parentTaskCode: t.taskCode,
            projectId: t.projectId,
            factoryId: t.factoryId,
            workPackageId: t.workPackageId,
            title: 'Profile Cutting & CNC Milling Setup',
            assignedPersonName: t.assignedWorkerNames[0] || 'Roshan Mendis',
            assignedMachineName: t.assignedMachineNames[0] || 'Elumatec SBZ 151 CNC',
            workflowName: t.assignedWorkflowName,
            plannedQty: t.plannedQuantity,
            completedQty: Math.min(t.plannedQuantity, Math.max(10, t.completedQuantity)),
            unit: t.unit,
            startDate: t.startDate,
            endDate: t.targetDate,
            isCriticalPath: idx % 2 === 0,
            status: t.completedQuantity >= t.plannedQuantity ? 'Completed' : 'In Progress'
          },
          {
            id: `sub-${t.id}-2`,
            subTaskCode: `${t.taskCode}-S2`,
            parentTaskId: t.id,
            parentTaskCode: t.taskCode,
            projectId: t.projectId,
            factoryId: t.factoryId,
            workPackageId: t.workPackageId,
            title: 'Assembly, Glazing & Dimensional QC Check',
            assignedPersonName: t.supervisorName || 'Kasun Perera',
            assignedMachineName: 'Pneumatic Assembly & Glazing Table',
            workflowName: t.assignedWorkflowName,
            plannedQty: t.plannedQuantity,
            completedQty: t.completedQuantity,
            unit: t.unit,
            startDate: t.startDate,
            endDate: t.targetDate,
            isCriticalPath: idx % 2 === 0,
            status: t.completedQuantity >= t.plannedQuantity ? 'Completed' : 'Planned'
          }
        ];
        tasksChanged = true;
      } else {
        t.subTasks.forEach(st => {
          if (st.workflowName && /[→➔➜➡⟶⇒▸▶]/.test(st.workflowName)) {
            st.workflowName = st.workflowName.replace(/\s*[→➔➜➡⟶⇒▸▶]\s*/g, ' -> ');
            tasksChanged = true;
          }
        });
      }
    });
    this.recomputeCriticalPathInternal();
    if (tasksChanged) {
      this.save(STORAGE_KEYS.TASKS, this.tasks);
    }

    // 2. Resource Governance Map per Work Package
    try {
      const rawGov = localStorage.getItem(STORAGE_KEYS.RESOURCE_GOVERNANCE);
      if (rawGov) {
        this.resourceGovernanceMap = JSON.parse(rawGov) || {};
      }
    } catch {
      this.resourceGovernanceMap = {};
    }
    this.workPackages.forEach(wp => {
      if (!this.resourceGovernanceMap[wp.id]) {
        const isOwned = wp.ownershipType === 'Innovista Owned';
        const isContracted = wp.ownershipType === 'Contracted Factory' || wp.ownershipType === 'Subcontractor';
        this.resourceGovernanceMap[wp.id] = {
          workPackageId: wp.id,
          projectId: wp.projectId,
          factoryId: wp.factoryId,
          workforceGovernance: isOwned ? 'Factory Self-Managed' : isContracted ? 'Under Turnkey Contract' : 'Supplier / Partner Provided',
          materialsGovernance: isOwned ? 'Innovista Managed' : isContracted ? 'Under Turnkey Contract' : 'Innovista Managed',
          machineryGovernance: isOwned ? 'Factory Self-Managed' : 'Supplier / Partner Provided',
          overheadsGovernance: isOwned ? 'Factory Self-Managed' : isContracted ? 'Under Turnkey Contract' : 'Innovista Managed',
          utilitiesAndToolsGovernance: isOwned ? 'Factory Self-Managed' : 'Under Turnkey Contract',
          updatedBy: 'System Control',
          updatedAt: new Date().toISOString().slice(0, 10)
        };
      }
    });
    this.save(STORAGE_KEYS.RESOURCE_GOVERNANCE, this.resourceGovernanceMap);

    // 3. Seed Project Resource Allocations (Linked to Master HR, Equipment, Procurement, Overheads)
    const defaultAllocations: ProjectResourceAllocationRecord[] = [];
    this.workPackages.slice(0, 4).forEach((wp, idx) => {
      const gov = this.resourceGovernanceMap[wp.id];
      defaultAllocations.push(
        {
          id: `res-alloc-wf-${wp.id}`,
          allocationCode: `RES-WF-${101 + idx}`,
          projectId: wp.projectId,
          projectName: wp.projectName,
          factoryId: wp.factoryId,
          factoryName: wp.factoryName,
          workPackageId: wp.id,
          category: 'Workforce / People',
          masterRecordId: `EMP-00${idx + 1}`,
          resourceCode: `EMP-00${idx + 1}`,
          resourceName: 'Facade Fabrication & Glazing Squad',
          managedBy: gov?.workforceGovernance || 'Factory Self-Managed',
          plannedQty: 18,
          issuedOrActiveQty: 18,
          consumedQty: 16,
          wastageOrDamageQty: 0,
          unit: 'Workers',
          unitCost: 45000,
          totalAllocatedCost: 810000,
          status: 'Issued / Active',
          updatedAt: new Date().toISOString().slice(0, 10)
        },
        {
          id: `res-alloc-mat-${wp.id}`,
          allocationCode: `RES-MAT-${201 + idx}`,
          projectId: wp.projectId,
          projectName: wp.projectName,
          factoryId: wp.factoryId,
          factoryName: wp.factoryName,
          workPackageId: wp.id,
          category: 'Raw Materials & Profiles',
          masterRecordId: `INV-ALU-6063-${idx + 1}`,
          resourceCode: 'MAT-ALU-6063-T6',
          resourceName: '6063-T6 Thermal Break Curtain Wall Profiles & DGU Glass',
          managedBy: gov?.materialsGovernance || 'Innovista Managed',
          plannedQty: wp.plannedQuantity,
          issuedOrActiveQty: wp.plannedQuantity,
          consumedQty: wp.completedQuantity,
          wastageOrDamageQty: 1,
          unit: wp.unit,
          unitCost: 28500,
          totalAllocatedCost: wp.plannedQuantity * 28500,
          status: 'Issued / Active',
          updatedAt: new Date().toISOString().slice(0, 10)
        },
        {
          id: `res-alloc-eq-${wp.id}`,
          allocationCode: `RES-EQ-${301 + idx}`,
          projectId: wp.projectId,
          projectName: wp.projectName,
          factoryId: wp.factoryId,
          factoryName: wp.factoryName,
          workPackageId: wp.id,
          category: 'Machinery & Equipment',
          masterRecordId: `EQ-CNC-0${idx + 1}`,
          resourceCode: `EQ-CNC-0${idx + 1}`,
          resourceName: 'Elumatec SBZ 151 5-Axis CNC & Double Mitre Line',
          managedBy: gov?.machineryGovernance || 'Factory Self-Managed',
          plannedQty: 160,
          issuedOrActiveQty: 140,
          consumedQty: 112,
          wastageOrDamageQty: 0,
          unit: 'Hours',
          unitCost: 4500,
          totalAllocatedCost: 720000,
          status: 'Issued / Active',
          updatedAt: new Date().toISOString().slice(0, 10)
        },
        {
          id: `res-alloc-ovh-${wp.id}`,
          allocationCode: `RES-OVH-${401 + idx}`,
          projectId: wp.projectId,
          projectName: wp.projectName,
          factoryId: wp.factoryId,
          factoryName: wp.factoryName,
          workPackageId: wp.id,
          category: 'Overheads & Utilities',
          masterRecordId: `COST-OVH-0${idx + 1}`,
          resourceCode: `OVH-UTIL-0${idx + 1}`,
          resourceName: 'Shop-Floor Power, Compressed Air, Crating & Plant Overheads',
          managedBy: gov?.overheadsGovernance || 'Under Turnkey Contract',
          plannedQty: 1,
          issuedOrActiveQty: 1,
          consumedQty: 1,
          wastageOrDamageQty: 0,
          unit: 'Lot',
          unitCost: 350000,
          totalAllocatedCost: 350000,
          status: 'Issued / Active',
          updatedAt: new Date().toISOString().slice(0, 10)
        }
      );
    });
    this.resourceAllocations = this.load(STORAGE_KEYS.RESOURCE_ALLOCATIONS, defaultAllocations);

    // 4. Seed Onsite Progress, Mistakes, Quality Damages & Incidents
    const seedOnsiteRecords: FactoryOnsiteIncidentOrDamageRecord[] = this.tasks.slice(0, 3).map((t, idx) => ({
      id: `onsite-${idx + 1}`,
      recordNo: `ONSITE-2026-${401 + idx}`,
      recordCategory: idx === 0 ? 'Onsite Progress' : idx === 1 ? 'Quality Damage' : 'Execution Mistake',
      severity: idx === 0 ? 'Low' : idx === 1 ? 'High' : 'Medium',
      projectId: t.projectId,
      projectName: t.projectName,
      factoryId: t.factoryId,
      factoryName: t.factoryName,
      workPackageId: t.workPackageId,
      taskId: t.id,
      taskCode: t.taskCode,
      title:
        idx === 0
          ? 'Batch 01 Curtain Wall Frames CNC Milled & Assembled Ahead of Schedule'
          : idx === 1
          ? 'Surface Scratch on PVDF Transom Bar During Crating Handling'
          : 'Miter Cut Tolerance Deviation (+1.8mm) on Mullion Bracket Slot',
      affectedQty: idx === 0 ? 15 : 2,
      unit: t.unit,
      rootCause:
        idx === 0
          ? 'Optimized CNC nesting and dual-shift execution'
          : idx === 1
          ? 'Missing foam spacer between crate layer 2 and 3'
          : 'CNC fixture clamp offset prior to calibration',
      correctiveAction:
        idx === 0
          ? 'Proceed to QC FAT sign-off and dispatch'
          : idx === 1
          ? 'Re-coated affected 2 bars and inserted protective PE foam separators'
          : 'Recalibrated CNC stop and re-machined replacement mullions',
      reportedBy: t.supervisorName || 'Eng. Chaminda Rajapakse',
      reportedByRole: 'Factory Manager',
      date: new Date().toISOString().slice(0, 10),
      status: idx === 0 ? 'QC Verified' : 'Under Rectification',
      evidenceAttachments: [
        {
          id: `att-seed-${idx + 1}`,
          fileName: idx === 1 ? 'Damage_Inspection_Photo.jpg' : 'Onsite_Verification_Photo.jpg',
          mediaKind: 'Image',
          fileSizeBytes: 420 * 1024,
          fileSizeLabel: '420 KB',
          maxLimitLabel: '≤ 1 MB (Image/Doc)',
          uploadedBy: t.supervisorName || 'Factory Manager',
          uploadedAt: new Date().toISOString().slice(0, 10),
          dataUrl:
            idx === 1
              ? 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=900&q=80'
              : 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=900&q=80'
        }
      ]
    }));
    this.onsiteDamagesAndIncidents = this.load(STORAGE_KEYS.ONSITE_DAMAGES_INCIDENTS, seedOnsiteRecords);

    // 5. Seed Factory Partners (Partnered Factories, Sales Partners, Supplier Partners, Subcontractors)
    const seedPartners: FactoryPartnerRegistrationRecord[] = [
      {
        id: 'fpart-01',
        partnerCode: 'PRT-SUP-101',
        partnerName: 'Lanka Aluminium Extrusions & Powder Coating PLC',
        partnerType: 'Supplier Partner',
        linkedMasterSupplierId: 'SUP-001',
        linkedFactoryId: this.factories[0]?.id || 'fac-inv-01',
        linkedFactoryName: this.factories[0]?.name || 'Colombo Plant',
        linkedProjectId: this.workPackages[0]?.projectId || 'PRJ-2026-001',
        linkedProjectName: this.workPackages[0]?.projectName || 'Sirius Mall Storefront',
        contactPerson: 'Rohan Wijesuriya',
        phone: '+94 11 244 8800',
        email: 'supply@lankaalu.lk',
        city: 'Ekala',
        contractOrAgreementRef: 'MSA-ALU-2026-01',
        materialsOrServicesScope: '6063-T6 Architectural Profiles & PVDF Coating',
        ratingScore: 96.5,
        status: 'Approved',
        registeredAt: '2026-01-15'
      },
      {
        id: 'fpart-02',
        partnerCode: 'PRT-SLS-102',
        partnerName: 'Apex Facade & Commercial Glazing Channel Partners',
        partnerType: 'Sales Partner',
        linkedFactoryId: this.factories[0]?.id || 'fac-inv-01',
        linkedFactoryName: this.factories[0]?.name || 'Colombo Plant',
        linkedProjectId: this.workPackages[0]?.projectId || 'PRJ-2026-001',
        linkedProjectName: this.workPackages[0]?.projectName || 'Sirius Mall Storefront',
        contactPerson: 'Nadia Fernando',
        phone: '+94 77 788 4210',
        email: 'nadia@apexfacade.com',
        city: 'Colombo',
        contractOrAgreementRef: 'SLA-SALES-2026-04',
        materialsOrServicesScope: 'Commercial Project Specification & Facade Sales Distribution',
        ratingScore: 94.0,
        status: 'Active',
        registeredAt: '2026-02-10'
      },
      {
        id: 'fpart-03',
        partnerCode: 'PRT-FAC-103',
        partnerName: 'EuroGlass Tempering & DGU Processing Partner Plant',
        partnerType: 'Partnered Factory',
        linkedMasterSupplierId: 'SUP-002',
        linkedFactoryId: this.factories[1]?.id || this.factories[0]?.id || 'fac-inv-01',
        linkedFactoryName: this.factories[1]?.name || this.factories[0]?.name || 'Glass Plant',
        linkedProjectId: this.workPackages[0]?.projectId || 'PRJ-2026-001',
        linkedProjectName: this.workPackages[0]?.projectName || 'Sirius Mall Storefront',
        contactPerson: 'Suresh Perera',
        phone: '+94 11 290 5511',
        email: 'ops@euroglass.lk',
        city: 'Biyagama',
        contractOrAgreementRef: 'CNT-DGU-2026-09',
        materialsOrServicesScope: 'Low-E Double Glazed Units & Structural Laminated Glass',
        ratingScore: 95.2,
        status: 'Approved',
        registeredAt: '2026-02-22'
      }
    ];
    this.factoryPartners = this.load(STORAGE_KEYS.FACTORY_PARTNERS, seedPartners);
  }

  // --- 11. Critical Path Method (CPM) Calculation & Schedule Management ---
  private recomputeCriticalPathInternal() {
    // Group tasks by workPackageId and calculate ES, EF, LS, LF, Float, and Critical Path
    const byWp = new Map<string, FactoryExecutionTask[]>();
    this.tasks.forEach(t => {
      const list = byWp.get(t.workPackageId) || [];
      list.push(t);
      byWp.set(t.workPackageId, list);
    });

    byWp.forEach(wpTasks => {
      const taskMap = new Map<string, FactoryExecutionTask>();
      wpTasks.forEach(t => {
        const startMs = Date.parse(t.startDate) || Date.now();
        const endMs = Date.parse(t.targetDate) || startMs + 7 * 86400000;
        const dur = Math.max(1, Math.round((endMs - startMs) / 86400000));
        t.durationDays = dur;
        t.earlyStartDay = 0;
        t.earlyFinishDay = dur;
        t.successorTaskIds = [];
        taskMap.set(t.id, t);
        taskMap.set(t.taskCode, t);
      });

      // Forward pass
      wpTasks.forEach(t => {
        let maxPredEf = 0;
        (t.predecessorTaskIds || []).forEach(predKey => {
          const pred = taskMap.get(predKey);
          if (pred) {
            maxPredEf = Math.max(maxPredEf, pred.earlyFinishDay || pred.durationDays || 1);
            if (!pred.successorTaskIds?.includes(t.taskCode)) {
              pred.successorTaskIds = [...(pred.successorTaskIds || []), t.taskCode];
            }
          }
        });
        t.earlyStartDay = maxPredEf;
        t.earlyFinishDay = maxPredEf + (t.durationDays || 1);
      });

      const projectDuration = Math.max(1, ...wpTasks.map(t => t.earlyFinishDay || 1));

      // Backward pass
      [...wpTasks].reverse().forEach(t => {
        const succs = wpTasks.filter(other =>
          (other.predecessorTaskIds || []).some(p => p === t.id || p === t.taskCode)
        );
        if (succs.length === 0) {
          t.lateFinishDay = projectDuration;
        } else {
          t.lateFinishDay = Math.min(...succs.map(s => s.lateStartDay ?? projectDuration));
        }
        t.lateStartDay = Math.max(0, (t.lateFinishDay || projectDuration) - (t.durationDays || 1));
        t.floatDays = Math.max(0, (t.lateStartDay || 0) - (t.earlyStartDay || 0));
        t.isCriticalPath = t.floatDays === 0 || t.priority === 'Critical' || t.isBottleneck;
      });
    });
  }

  public getStandardWorkflows(): string[] {
    return [...STANDARD_FACTORY_WORKFLOWS];
  }

  public updateTaskScheduleAndAssignment(
    user: SecurityUser | null,
    taskId: string,
    updates: {
      startDate?: string;
      targetDate?: string;
      predecessorTaskIds?: string[];
      assignedWorkerNames?: string[];
      assignedMachineNames?: string[];
      assignedWorkflowName?: string;
      isCriticalPath?: boolean;
      priority?: FactoryExecutionTask['priority'];
    }
  ): FactoryExecutionTask {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) throw new Error('Task not found');
    const now = new Date().toISOString();
    const actorName = user?.fullName || 'Project / Factory Controller';
    const actorRole = user?.roleName || 'Controller';

    if (updates.startDate) task.startDate = updates.startDate;
    if (updates.targetDate) task.targetDate = updates.targetDate;
    if (updates.predecessorTaskIds) task.predecessorTaskIds = updates.predecessorTaskIds;
    if (updates.assignedWorkerNames) task.assignedWorkerNames = updates.assignedWorkerNames;
    if (updates.assignedMachineNames) task.assignedMachineNames = updates.assignedMachineNames;
    if (updates.assignedWorkflowName) task.assignedWorkflowName = updates.assignedWorkflowName;
    if (updates.priority) task.priority = updates.priority;

    this.recomputeCriticalPathInternal();
    if (typeof updates.isCriticalPath === 'boolean') {
      task.isCriticalPath = updates.isCriticalPath;
      if (updates.isCriticalPath) task.floatDays = 0;
    }

    task.audit.updatedBy = actorName;
    task.audit.updatedByRole = actorRole;
    task.audit.updatedAt = now;
    task.audit.revision += 1;
    task.audit.approvalHistory.push({
      stage: 'Critical Path / Resource / Workflow Updated',
      actorName,
      actorRole,
      decision: 'Approved',
      timestamp: now,
      remarks: `Target: ${task.targetDate} | Workflow: ${task.assignedWorkflowName || 'Standard'}`
    });

    this.save(STORAGE_KEYS.TASKS, this.tasks);
    this.recordFactoryUpdateNotification(task.factoryId, 1);
    return task;
  }

  public addSubTaskToTask(
    _user: SecurityUser | null,
    taskId: string,
    subInput: {
      title: string;
      assignedPersonName: string;
      assignedMachineName: string;
      workflowName: string;
      plannedQty: number;
      startDate: string;
      endDate: string;
      isCriticalPath?: boolean;
      unit?: string;
    }
  ): FactoryExecutionTask {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) throw new Error('Task not found');
    const nextIdx = (task.subTasks?.length || 0) + 1;
    const newSub: FactoryTaskSubTask = {
      id: `sub-${task.id}-${Date.now()}`,
      subTaskCode: `${task.taskCode}-S${nextIdx}`,
      parentTaskId: task.id,
      parentTaskCode: task.taskCode,
      projectId: task.projectId,
      factoryId: task.factoryId,
      workPackageId: task.workPackageId,
      title: subInput.title,
      assignedPersonName: subInput.assignedPersonName || task.assignedWorkerNames[0] || 'Roshan Mendis',
      assignedMachineName: subInput.assignedMachineName || task.assignedMachineNames[0] || 'CNC Center',
      workflowName: subInput.workflowName || task.assignedWorkflowName || STANDARD_FACTORY_WORKFLOWS[0],
      plannedQty: subInput.plannedQty || task.plannedQuantity,
      completedQty: 0,
      unit: subInput.unit || task.unit,
      startDate: subInput.startDate || task.startDate,
      endDate: subInput.endDate || task.targetDate,
      isCriticalPath: Boolean(subInput.isCriticalPath ?? task.isCriticalPath),
      status: 'Planned'
    };
    task.subTasks = [...(task.subTasks || []), newSub];
    this.save(STORAGE_KEYS.TASKS, this.tasks);
    this.recordFactoryUpdateNotification(task.factoryId, 1);
    return task;
  }

  public updateSubTaskStatus(
    _user: SecurityUser | null,
    taskId: string,
    subTaskId: string,
    status: FactoryTaskSubTask['status']
  ): FactoryExecutionTask {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) throw new Error('Task not found');
    task.subTasks = (task.subTasks || []).map(st => {
      if (st.id !== subTaskId) return st;
      return {
        ...st,
        status,
        completedQty: status === 'Completed' ? st.plannedQty : st.completedQty
      };
    });
    this.save(STORAGE_KEYS.TASKS, this.tasks);
    this.recordFactoryUpdateNotification(task.factoryId, 1);
    return task;
  }

  // --- 12. Multi-Role Inspection & Approval of Daily Logs & Worksheets (Factory Manager, Project Manager, Admin) ---
  public verifyAndApproveDailyReport(
    user: SecurityUser | null,
    reportId: string,
    approverAuthority: 'Factory Manager' | 'Project Manager' | 'Admin'
  ): DailyFactoryActivityReport {
    const rep = this.dailyReports.find(r => r.id === reportId);
    if (!rep) throw new Error('Daily report not found');
    const now = new Date().toISOString();
    const actorName = user?.fullName || approverAuthority;
    rep.status = approverAuthority === 'Factory Manager' ? 'Reviewed by PM' : 'Approved';
    rep.audit.updatedBy = actorName;
    rep.audit.updatedByRole = approverAuthority;
    rep.audit.updatedAt = now;
    rep.audit.approvalHistory.push({
      stage: `Inspected & Approved by ${approverAuthority}`,
      actorName,
      actorRole: approverAuthority,
      decision: 'Approved',
      timestamp: now,
      remarks: `Verified daily log ${rep.reportNo}`
    });
    this.save(STORAGE_KEYS.DAILY_REPORTS, this.dailyReports);
    this.recordFactoryUpdateNotification(rep.factoryId, 1);
    return rep;
  }

  public verifyAndApproveWorksheet(
    user: SecurityUser | null,
    worksheetId: string,
    approverAuthority: 'Factory Manager' | 'Project Manager' | 'Admin'
  ): DigitalWorksheetRecord {
    const ws = this.worksheets.find(w => w.id === worksheetId);
    if (!ws) throw new Error('Worksheet not found');
    const now = new Date().toISOString();
    const actorName = user?.fullName || approverAuthority;
    ws.completionStatus = approverAuthority === 'Factory Manager' ? 'Supervisor Verified' : 'QC Approved';
    ws.verifiedBySupervisorName = `${actorName} (${approverAuthority})`;
    ws.audit.updatedBy = actorName;
    ws.audit.updatedByRole = approverAuthority;
    ws.audit.updatedAt = now;
    this.save(STORAGE_KEYS.WORKSHEETS, this.worksheets);
    this.recordFactoryUpdateNotification(ws.factoryId, 1);
    return ws;
  }

  // --- 13. Project-Level Resource Governance & Resource Allocations ---
  public getProjectResourceGovernance(workPackageId: string): ProjectResourceGovernanceConfig | undefined {
    return this.resourceGovernanceMap[workPackageId];
  }

  public getAllResourceGovernance(): Record<string, ProjectResourceGovernanceConfig> {
    return { ...this.resourceGovernanceMap };
  }

  public saveProjectResourceGovernance(
    user: SecurityUser | null,
    config: ProjectResourceGovernanceConfig
  ): ProjectResourceGovernanceConfig {
    const updated: ProjectResourceGovernanceConfig = {
      ...config,
      updatedBy: user?.fullName || 'Project / Factory Controller',
      updatedAt: new Date().toISOString().slice(0, 10)
    };
    this.resourceGovernanceMap[config.workPackageId] = updated;
    this.save(STORAGE_KEYS.RESOURCE_GOVERNANCE, this.resourceGovernanceMap);
    this.recordFactoryUpdateNotification(config.factoryId, 1);
    return updated;
  }

  public getProjectResourceAllocations(projectId?: string, factoryId?: string): ProjectResourceAllocationRecord[] {
    let list = [...this.resourceAllocations];
    if (projectId) list = list.filter(r => r.projectId === projectId);
    if (factoryId) list = list.filter(r => r.factoryId === factoryId);
    return list;
  }

  public saveProjectResourceAllocation(
    _user: SecurityUser | null,
    input: Partial<ProjectResourceAllocationRecord> & {
      factoryId: string;
      projectId: string;
      workPackageId: string;
      resourceName: string;
    }
  ): ProjectResourceAllocationRecord {
    const fac = this.factories.find(f => f.id === input.factoryId) || this.factories[0];
    const wp = this.workPackages.find(w => w.id === input.workPackageId) || this.workPackages[0];
    const now = new Date().toISOString().slice(0, 10);

    const existingIdx = input.id ? this.resourceAllocations.findIndex(r => r.id === input.id) : -1;
    if (existingIdx >= 0) {
      const prev = this.resourceAllocations[existingIdx];
      const planned = input.plannedQty ?? prev.plannedQty;
      const unitCost = input.unitCost ?? prev.unitCost;
      const updated: ProjectResourceAllocationRecord = {
        ...prev,
        ...input,
        plannedQty: planned,
        unitCost,
        totalAllocatedCost: planned * unitCost,
        updatedAt: now
      };
      this.resourceAllocations[existingIdx] = updated;
      this.save(STORAGE_KEYS.RESOURCE_ALLOCATIONS, this.resourceAllocations);
      this.recordFactoryUpdateNotification(updated.factoryId, 1);
      return updated;
    }

    const plannedQty = input.plannedQty || 10;
    const unitCost = input.unitCost || 15000;
    const newRec: ProjectResourceAllocationRecord = {
      id: `res-alloc-${Date.now()}`,
      allocationCode: input.allocationCode || `RES-${Math.floor(500 + Math.random() * 499)}`,
      projectId: input.projectId,
      projectName: input.projectName || wp?.projectName || input.projectId,
      factoryId: fac.id,
      factoryName: fac.name,
      workPackageId: input.workPackageId,
      taskId: input.taskId,
      taskCode: input.taskCode,
      category: input.category || 'Raw Materials & Profiles',
      masterRecordId: input.masterRecordId || `MST-${Date.now().toString().slice(-4)}`,
      resourceCode: input.resourceCode || `REF-${Date.now().toString().slice(-4)}`,
      resourceName: input.resourceName,
      managedBy: input.managedBy || 'Innovista Managed',
      plannedQty,
      issuedOrActiveQty: input.issuedOrActiveQty ?? plannedQty,
      consumedQty: input.consumedQty ?? 0,
      wastageOrDamageQty: input.wastageOrDamageQty ?? 0,
      unit: input.unit || 'Units',
      unitCost,
      totalAllocatedCost: plannedQty * unitCost,
      status: input.status || 'Issued / Active',
      updatedAt: now
    };
    this.resourceAllocations.unshift(newRec);
    this.save(STORAGE_KEYS.RESOURCE_ALLOCATIONS, this.resourceAllocations);
    this.recordFactoryUpdateNotification(fac.id, 1);
    return newRec;
  }

  // --- 14. On-Site Progress, Mistakes, Quality Damages & Incidents (with 1MB Image/Doc, 5MB Video Evidence) ---
  public getOnsiteIncidentsAndDamages(): FactoryOnsiteIncidentOrDamageRecord[] {
    return [...this.onsiteDamagesAndIncidents];
  }

  public saveOnsiteIncidentOrDamage(
    user: SecurityUser | null,
    input: Partial<FactoryOnsiteIncidentOrDamageRecord> & {
      title: string;
      factoryId: string;
      projectId: string;
      taskId?: string;
    }
  ): FactoryOnsiteIncidentOrDamageRecord {
    const fac = this.factories.find(f => f.id === input.factoryId) || this.factories[0];
    const task = this.tasks.find(t => t.id === input.taskId) || this.tasks[0];
    const now = new Date().toISOString().slice(0, 10);

    const newRec: FactoryOnsiteIncidentOrDamageRecord = {
      id: `onsite-${Date.now()}`,
      recordNo: `ONSITE-2026-${Math.floor(410 + Math.random() * 580)}`,
      recordCategory: input.recordCategory || 'Quality Damage',
      severity: input.severity || 'Medium',
      projectId: input.projectId || task?.projectId || 'PRJ-2026-001',
      projectName: input.projectName || task?.projectName || input.projectId,
      factoryId: fac.id,
      factoryName: fac.name,
      workPackageId: input.workPackageId || task?.workPackageId || 'fwp-01',
      taskId: task?.id || 'ftask-01',
      taskCode: task?.taskCode || 'WO-2026-101',
      title: input.title,
      affectedQty: input.affectedQty ?? 1,
      unit: input.unit || task?.unit || 'Units',
      rootCause: input.rootCause || 'Shop-floor execution variance',
      correctiveAction: input.correctiveAction || 'Rectification & QC reinspection scheduled',
      reportedBy: user?.fullName || 'Eng. Chaminda Rajapakse',
      reportedByRole: user?.roleName || 'Factory Manager',
      date: now,
      status: input.status || 'Open',
      evidenceAttachments: input.evidenceAttachments || []
    };

    this.onsiteDamagesAndIncidents.unshift(newRec);
    this.save(STORAGE_KEYS.ONSITE_DAMAGES_INCIDENTS, this.onsiteDamagesAndIncidents);
    this.recordFactoryUpdateNotification(fac.id, 1);
    return newRec;
  }

  public updateOnsiteIncidentStatus(
    id: string,
    status: FactoryOnsiteIncidentOrDamageRecord['status']
  ): FactoryOnsiteIncidentOrDamageRecord | undefined {
    const rec = this.onsiteDamagesAndIncidents.find(r => r.id === id);
    if (!rec) return undefined;
    rec.status = status;
    this.save(STORAGE_KEYS.ONSITE_DAMAGES_INCIDENTS, this.onsiteDamagesAndIncidents);
    this.recordFactoryUpdateNotification(rec.factoryId, 1);
    return rec;
  }

  // --- 15. Factory Partners (Sales Partners, Supplier Partners, Subcontractors, Partnered Factories) ---
  public getFactoryPartners(): FactoryPartnerRegistrationRecord[] {
    return [...this.factoryPartners];
  }

  public saveFactoryPartner(
    _user: SecurityUser | null,
    input: Partial<FactoryPartnerRegistrationRecord> & {
      partnerName: string;
      partnerType: FactoryPartnerRegistrationRecord['partnerType'];
      linkedFactoryId: string;
      linkedProjectId: string;
    }
  ): FactoryPartnerRegistrationRecord {
    const fac = this.factories.find(f => f.id === input.linkedFactoryId) || this.factories[0];
    const wp = this.workPackages.find(w => w.projectId === input.linkedProjectId) || this.workPackages[0];
    const newPartner: FactoryPartnerRegistrationRecord = {
      id: `fpart-${Date.now()}`,
      partnerCode: input.partnerCode || `PRT-${Math.floor(110 + Math.random() * 880)}`,
      partnerName: input.partnerName,
      partnerType: input.partnerType,
      linkedMasterSupplierId: input.linkedMasterSupplierId,
      linkedFactoryId: fac.id,
      linkedFactoryName: fac.name,
      linkedProjectId: input.linkedProjectId,
      linkedProjectName: input.linkedProjectName || wp?.projectName || input.linkedProjectId,
      contactPerson: input.contactPerson || 'Partner Director',
      phone: input.phone || '+94 11 250 0000',
      email: input.email || 'partner@innovista.com',
      city: input.city || fac.city,
      contractOrAgreementRef: input.contractOrAgreementRef || `AGR-2026-${Math.floor(10 + Math.random() * 89)}`,
      materialsOrServicesScope: input.materialsOrServicesScope || 'Approved Factory Supply & Execution Scope',
      ratingScore: input.ratingScore || 95.0,
      status: input.status || 'Approved',
      registeredAt: new Date().toISOString().slice(0, 10)
    };
    this.factoryPartners.unshift(newPartner);
    this.save(STORAGE_KEYS.FACTORY_PARTNERS, this.factoryPartners);
    this.recordFactoryUpdateNotification(fac.id, 1);
    return newPartner;
  }

  // --- 16. Universal Factory Record Approval, Revision, Edit, Delete & Audit Trail ---
  private initApprovalsAndAuditLogs() {
    try {
      const rawApprovals = localStorage.getItem(STORAGE_KEYS.RECORD_APPROVALS);
      if (rawApprovals) {
        this.recordApprovalsMap = JSON.parse(rawApprovals) || {};
      }
    } catch {
      this.recordApprovalsMap = {};
    }

    const seedAudit: FactoryAuditLogEntry[] = [
      {
        id: 'faud-seed-01',
        timestamp: '2026-09-26 09:15:00',
        action: 'APPROVED',
        entityType: 'TASK',
        recordId: this.tasks[0]?.id || 'ftask-01',
        recordCode: this.tasks[0]?.taskCode || 'WO-2026-101',
        recordTitle: this.tasks[0]?.title || 'CNC Profile Milling & Frame Assembly',
        factoryId: this.factories[0]?.id || 'fac-inv-01',
        factoryName: this.factories[0]?.name || 'Innovista Central Plant',
        projectId: this.workPackages[0]?.projectId || 'PRJ-2026-001',
        projectName: this.workPackages[0]?.projectName || 'Sirius Mall Storefront',
        actorUserId: 'usr-admin-01',
        actorEmployeeId: 'EMP-001',
        actorUsername: 'superadmin',
        actorFullName: 'Alexander Vance',
        actorAccountDisplay: 'Alexander Vance (@superadmin | ID: usr-admin-01)',
        actorRole: 'Super Administrator',
        revisionNumber: 1,
        details: 'Approved through system with verified QC tolerance & critical path sign-off.'
      },
      {
        id: 'faud-seed-02',
        timestamp: '2026-09-26 11:30:00',
        action: 'APPROVED',
        entityType: 'QUALITY_INSPECTION',
        recordId: this.inspections[0]?.id || 'fqc-01',
        recordCode: this.inspections[0]?.inspectionNo || 'QIR-2026-301',
        recordTitle: `${this.inspections[0]?.inspectionType || 'FAT'} — ${this.inspections[0]?.taskCode || 'WO-2026-101'}`,
        factoryId: this.factories[0]?.id || 'fac-inv-01',
        factoryName: this.factories[0]?.name || 'Innovista Central Plant',
        projectId: this.workPackages[0]?.projectId || 'PRJ-2026-001',
        projectName: this.workPackages[0]?.projectName || 'Sirius Mall Storefront',
        actorUserId: 'usr-fac-01',
        actorEmployeeId: 'EMP-051',
        actorUsername: 'rohan.factory',
        actorFullName: 'Rohan Wijesinghe',
        actorAccountDisplay: 'Rohan Wijesinghe (@rohan.factory | ID: usr-fac-01)',
        actorRole: 'Factory Manager',
        revisionNumber: 1,
        details: 'Factory Acceptance Inspection approved through system.'
      },
      {
        id: 'faud-seed-03',
        timestamp: '2026-09-26 14:20:00',
        action: 'APPROVED',
        entityType: 'DISPATCH',
        recordId: this.dispatches[0]?.id || 'fdsp-01',
        recordCode: this.dispatches[0]?.dispatchNoteNo || 'DN-2026-801',
        recordTitle: this.dispatches[0]?.itemDescription || 'Curtain Wall Panels Batch 01',
        factoryId: this.factories[0]?.id || 'fac-inv-01',
        factoryName: this.factories[0]?.name || 'Innovista Central Plant',
        projectId: this.workPackages[0]?.projectId || 'PRJ-2026-001',
        projectName: this.workPackages[0]?.projectName || 'Sirius Mall Storefront',
        actorUserId: 'usr-pm-01',
        actorEmployeeId: 'EMP-042',
        actorUsername: 'marcus.pm',
        actorFullName: 'Marcus Sterling',
        actorAccountDisplay: 'Marcus Sterling (@marcus.pm | ID: usr-pm-01)',
        actorRole: 'Project Manager',
        revisionNumber: 1,
        details: 'Dispatch manifest & gate pass approved through system for site delivery.'
      }
    ];

    this.factoryAuditLogs = this.load(STORAGE_KEYS.FACTORY_AUDIT_LOGS, seedAudit);
  }

  private resolveRecordBasicInfo(
    entityType: FactoryRecordEntityType,
    recordId: string
  ): {
    code: string;
    title: string;
    factoryId: string;
    factoryName: string;
    projectId: string;
    projectName: string;
    status: string;
    revision: number;
    defaultApproved: boolean;
  } {
    const defaultFac = this.factories[0];
    const defaultWp = this.workPackages[0];
    let code = recordId;
    let title = 'Factory Operational Record';
    let factoryId = defaultFac?.id || 'fac-inv-01';
    let factoryName = defaultFac?.name || 'Innovista Plant';
    let projectId = defaultWp?.projectId || 'PRJ-2026-001';
    let projectName = defaultWp?.projectName || 'Master Project';
    let status = 'Active';
    let revision = 1;
    let defaultApproved = false;

    if (entityType === 'FACTORY_PROFILE') {
      const f = this.factories.find(x => x.id === recordId || x.factoryCode === recordId);
      if (f) {
        code = f.factoryCode;
        title = `${f.name} (${f.ownershipType})`;
        factoryId = f.id;
        factoryName = f.name;
        status = f.status;
        revision = f.audit?.revision || 1;
        defaultApproved = f.status === 'Active';
      }
    } else if (entityType === 'WORK_PACKAGE') {
      const wp = this.workPackages.find(x => x.id === recordId || x.packageCode === recordId);
      if (wp) {
        code = wp.packageCode;
        title = wp.title;
        factoryId = wp.factoryId;
        factoryName = wp.factoryName;
        projectId = wp.projectId;
        projectName = wp.projectName;
        status = wp.stageStatus;
        revision = wp.audit?.revision || 1;
        defaultApproved = ['Approved', 'Completed', 'Dispatched', 'In Progress'].includes(wp.stageStatus);
      }
    } else if (entityType === 'TASK') {
      const t = this.tasks.find(x => x.id === recordId || x.taskCode === recordId);
      if (t) {
        code = t.taskCode;
        title = t.title;
        factoryId = t.factoryId;
        factoryName = t.factoryName;
        projectId = t.projectId;
        projectName = t.projectName;
        status = t.stageStatus;
        revision = t.audit?.revision || 1;
        defaultApproved = ['Approved', 'Completed', 'Packed', 'Dispatched', 'Delivered', 'Installed', 'Accepted'].includes(t.stageStatus);
      }
    } else if (entityType === 'SUB_TASK') {
      for (const t of this.tasks) {
        const st = (t.subTasks || []).find(s => s.id === recordId || s.subTaskCode === recordId);
        if (st) {
          code = st.subTaskCode;
          title = `${st.title} (${t.taskCode})`;
          factoryId = t.factoryId;
          factoryName = t.factoryName;
          projectId = t.projectId;
          projectName = t.projectName;
          status = st.status;
          defaultApproved = st.status === 'Completed';
          break;
        }
      }
    } else if (entityType === 'DAILY_REPORT') {
      const r = this.dailyReports.find(x => x.id === recordId || x.reportNo === recordId);
      if (r) {
        code = r.reportNo;
        title = `Daily Production Log — ${r.date}`;
        factoryId = r.factoryId;
        factoryName = r.factoryName;
        projectId = r.projectId;
        projectName = r.projectName;
        status = r.status;
        revision = r.audit?.revision || 1;
        defaultApproved = r.status === 'Approved' || r.status === 'Reviewed by PM';
      }
    } else if (entityType === 'WORKSHEET') {
      const w = this.worksheets.find(x => x.id === recordId || x.worksheetNo === recordId);
      if (w) {
        code = w.worksheetNo;
        title = `${w.operationStep} (${w.taskCode})`;
        factoryId = w.factoryId;
        factoryName = w.factoryName;
        projectId = w.projectId;
        projectName = w.projectName;
        status = w.completionStatus;
        revision = w.audit?.revision || 1;
        defaultApproved = w.completionStatus === 'QC Approved' || w.completionStatus === 'Supervisor Verified';
      }
    } else if (entityType === 'ONSITE_RECORD') {
      const o = this.onsiteDamagesAndIncidents.find(x => x.id === recordId || x.recordNo === recordId);
      if (o) {
        code = o.recordNo;
        title = `${o.recordCategory}: ${o.title}`;
        factoryId = o.factoryId;
        factoryName = o.factoryName;
        projectId = o.projectId;
        projectName = o.projectName;
        status = o.status;
        defaultApproved = o.status === 'QC Verified' || o.status === 'Closed';
      }
    } else if (entityType === 'MEDIA_EVIDENCE') {
      const m = this.mediaEvidence.find(x => x.id === recordId || x.evidenceCode === recordId);
      if (m) {
        code = m.evidenceCode;
        title = `${m.mediaType}: ${m.description}`;
        factoryId = m.factoryId;
        factoryName = m.factoryName;
        projectId = m.projectId;
        projectName = m.projectName;
        status = m.verifiedByQa ? 'Verified' : 'Submitted';
        revision = m.audit?.revision || 1;
        defaultApproved = Boolean(m.verifiedByQa);
      }
    } else if (entityType === 'RESOURCE_ALLOCATION') {
      const ra = this.resourceAllocations.find(x => x.id === recordId || x.allocationCode === recordId);
      if (ra) {
        code = ra.allocationCode;
        title = `${ra.resourceName} (${ra.category})`;
        factoryId = ra.factoryId;
        factoryName = ra.factoryName;
        projectId = ra.projectId;
        projectName = ra.projectName;
        status = ra.status;
        defaultApproved = ra.status === 'Issued / Active' || ra.status === 'Consumed';
      }
    } else if (entityType === 'QUALITY_INSPECTION') {
      const qi = this.inspections.find(x => x.id === recordId || x.inspectionNo === recordId);
      if (qi) {
        code = qi.inspectionNo;
        title = `${qi.inspectionType} — ${qi.taskCode}`;
        factoryId = qi.factoryId;
        factoryName = qi.factoryName;
        projectId = qi.projectId;
        projectName = qi.projectName;
        status = qi.decision;
        revision = qi.audit?.revision || 1;
        defaultApproved = qi.decision === 'Approved';
      }
    } else if (entityType === 'HSE_RECORD') {
      const hs = this.getHseRecords().find(x => x.id === recordId || x.recordCode === recordId);
      if (hs) {
        code = hs.recordCode;
        title = hs.title;
        factoryId = hs.factoryId;
        factoryName = hs.factoryName;
        projectId = hs.projectId;
        projectName = hs.projectName;
        status = hs.status;
        defaultApproved = true;
      }
    } else if (entityType === 'DISPATCH') {
      const d = this.dispatches.find(x => x.id === recordId || x.dispatchNoteNo === recordId);
      if (d) {
        code = d.dispatchNoteNo;
        title = d.itemDescription;
        factoryId = d.factoryId;
        factoryName = d.factoryName;
        projectId = d.projectId;
        projectName = d.projectName;
        status = d.siteLogisticsStatus;
        revision = d.audit?.revision || 1;
        defaultApproved = d.fatCompleted;
      }
    } else if (entityType === 'TECHNICAL_DOCUMENT') {
      const doc = this.documents.find(x => x.id === recordId || x.docNumber === recordId);
      if (doc) {
        code = doc.docNumber;
        title = doc.title;
        factoryId = doc.factoryId;
        factoryName = doc.factoryName;
        projectId = doc.projectId;
        projectName = doc.projectName;
        status = doc.approvalStatus;
        revision = doc.audit?.revision || 1;
        defaultApproved = doc.approvalStatus.includes('Approved');
      }
    } else if (entityType === 'GENERATED_DOCUMENT') {
      const gd = this.generatedDocs.find(x => x.id === recordId || x.docControlNo === recordId);
      if (gd) {
        code = gd.docControlNo;
        title = gd.title;
        factoryId = gd.factoryId;
        factoryName = gd.factoryName;
        projectId = gd.projectId;
        projectName = gd.projectName;
        status = gd.status;
        defaultApproved = gd.status === 'Approved' || gd.status === 'Signed-Off' || gd.status === 'Issued';
      }
    } else if (entityType === 'PARTNER') {
      const p = this.factoryPartners.find(x => x.id === recordId || x.partnerCode === recordId);
      if (p) {
        code = p.partnerCode;
        title = `${p.partnerName} (${p.partnerType})`;
        factoryId = p.linkedFactoryId;
        factoryName = p.linkedFactoryName;
        projectId = p.linkedProjectId;
        projectName = p.linkedProjectName;
        status = p.status;
        defaultApproved = p.status === 'Approved' || p.status === 'Active';
      }
    } else if (entityType === 'SUPERVISOR_ASSIGNMENT') {
      const sa = this.supervisorAssignments.find(x => x.id === recordId || x.assignmentCode === recordId);
      if (sa) {
        code = sa.assignmentCode;
        title = `${sa.fullName} — ${sa.supervisingRole}`;
        factoryId = sa.factoryId;
        factoryName = sa.factoryName;
        projectId = sa.projectId;
        projectName = sa.projectName;
        status = sa.status;
        defaultApproved = sa.status === 'Active';
      }
    } else if (entityType === 'FACTORY_PROCUREMENT') {
      const pr = this.factoryProcurementRecords.find(x => x.id === recordId || x.docCode === recordId);
      if (pr) {
        code = pr.docCode;
        title = `[${pr.stageType}] ${pr.title}`;
        factoryId = pr.factoryId;
        factoryName = pr.factoryName;
        projectId = pr.projectId;
        projectName = pr.projectName;
        status = pr.status;
        defaultApproved = ['Approved', 'Ordered', 'Received (GRN)', 'QC Passed', 'Closed'].includes(pr.status);
      }
    } else if (entityType === 'FACTORY_HR_PAYROLL') {
      const hr = this.factoryHrPayrollRecords.find(x => x.id === recordId || x.payrollCode === recordId);
      if (hr) {
        code = hr.payrollCode;
        title = `${hr.employeeName} (${hr.payPeriod})`;
        factoryId = hr.factoryId;
        factoryName = hr.factoryName;
        projectId = hr.projectId;
        projectName = hr.projectName;
        status = hr.status;
        defaultApproved = hr.status === 'Approved' || hr.status === 'Paid';
      }
    } else if (entityType === 'FACTORY_FINANCE_CONTRACT') {
      const fn = this.factoryFinanceRecords.find(x => x.id === recordId || x.recordCode === recordId);
      if (fn) {
        code = fn.recordCode;
        title = `[${fn.recordCategory}] ${fn.title}`;
        factoryId = fn.factoryId;
        factoryName = fn.factoryName;
        projectId = fn.projectId;
        projectName = fn.projectName;
        status = fn.status;
        defaultApproved = ['Approved', 'Paid', 'Active Agreement', 'Posted to GL'].includes(fn.status);
      }
    }

    return { code, title, factoryId, factoryName, projectId, projectName, status, revision, defaultApproved };
  }

  public getRecordApprovalMetadata(
    entityType: FactoryRecordEntityType,
    recordId: string
  ): FactorySystemApprovalMetadata {
    const key = `${entityType}:${recordId}`;
    const existing = this.recordApprovalsMap[key];
    if (existing) return existing;

    const info = this.resolveRecordBasicInfo(entityType, recordId);
    const defaultMeta: FactorySystemApprovalMetadata = {
      recordKey: key,
      entityType,
      recordId,
      recordCode: info.code,
      recordTitle: info.title,
      isApproved: info.defaultApproved,
      approvalStatus: info.defaultApproved ? 'Approved' : 'Pending Approval',
      approvedThroughSystemText: info.defaultApproved
        ? 'Approved through Innovista Fabriconix System'
        : 'Pending System Approval',
      approvedByAccountName: info.defaultApproved ? 'Alexander Vance (@superadmin)' : 'Pending Authorized Sign-Off',
      approvedByUserId: info.defaultApproved ? 'usr-admin-01 (EMP-001)' : 'N/A',
      approvedByUsername: info.defaultApproved ? 'superadmin' : 'pending',
      approvedByFullName: info.defaultApproved ? 'Alexander Vance' : 'Pending Approver',
      approvedByRole: info.defaultApproved ? 'Super Administrator' : 'Authorized Approver',
      approvedAt: info.defaultApproved ? '2026-09-26 09:30:00' : 'Pending',
      revisionNumber: info.revision
    };
    return defaultMeta;
  }

  private recordAuditEntry(
    user: SecurityUser | null,
    action: FactoryAuditLogEntry['action'],
    entityType: FactoryRecordEntityType,
    recordId: string,
    details: string,
    overrideRevision?: number
  ): FactoryAuditLogEntry {
    const info = this.resolveRecordBasicInfo(entityType, recordId);
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const actorUserId = user?.id || 'usr-admin-01';
    const actorEmpId = user?.employeeId || 'EMP-001';
    const actorUsername = user?.username || 'superadmin';
    const actorFullName = user?.fullName || 'Alexander Vance';
    const actorRole = user?.roleName || 'Super Administrator';
    const actorAccountDisplay = `${actorFullName} (@${actorUsername} | ID: ${actorUserId}${actorEmpId ? ` / ${actorEmpId}` : ''})`;

    const entry: FactoryAuditLogEntry = {
      id: `faud-${Date.now()}-${Math.floor(100 + Math.random() * 899)}`,
      timestamp: nowStr,
      action,
      entityType,
      recordId,
      recordCode: info.code,
      recordTitle: info.title,
      factoryId: info.factoryId,
      factoryName: info.factoryName,
      projectId: info.projectId,
      projectName: info.projectName,
      actorUserId,
      actorEmployeeId: actorEmpId,
      actorUsername,
      actorFullName,
      actorAccountDisplay,
      actorRole,
      revisionNumber: overrideRevision ?? info.revision,
      details
    };

    this.factoryAuditLogs.unshift(entry);
    this.save(STORAGE_KEYS.FACTORY_AUDIT_LOGS, this.factoryAuditLogs);

    try {
      securityService.logAuditEvent({
        userId: actorUserId,
        username: actorUsername,
        userRole: actorRole,
        department: user?.department || 'FACTORY_PRODUCTION',
        action: `FACTORY_${entityType}_${action}`,
        module: 'Factory & Site Execution',
        target: `${info.code} — ${info.title}`,
        details: `${details} | Approved/Action By: ${actorAccountDisplay}`,
        severity: action === 'DELETED' ? 'Warning' : 'Info'
      });
    } catch {
      // non-blocking
    }

    return entry;
  }

  public getFactoryAuditLogs(
    factoryId?: string,
    projectId?: string,
    recordId?: string
  ): FactoryAuditLogEntry[] {
    return this.factoryAuditLogs.filter(log => {
      const matchFac = !factoryId || factoryId === 'ALL' || log.factoryId === factoryId;
      const matchPrj = !projectId || projectId === 'ALL' || log.projectId === projectId;
      const matchRec = !recordId || log.recordId === recordId || log.recordCode === recordId;
      return matchFac && matchPrj && matchRec;
    });
  }

  public approveFactoryRecord(
    user: SecurityUser | null,
    entityType: FactoryRecordEntityType,
    recordId: string,
    remarks = 'Approved through system after operational verification'
  ): FactorySystemApprovalMetadata {
    const info = this.resolveRecordBasicInfo(entityType, recordId);
    const key = `${entityType}:${recordId}`;
    const prev = this.getRecordApprovalMetadata(entityType, recordId);
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);

    const actorUserId = user?.id || 'usr-admin-01';
    const actorEmpId = user?.employeeId || 'EMP-001';
    const actorUsername = user?.username || 'superadmin';
    const actorFullName = user?.fullName || 'Alexander Vance';
    const actorRole = user?.roleName || 'Super Administrator';
    const isFm = this.isFactoryManagerAccount(user);

    // Enforce 2-step approval for TASK, SUB_TASK, and QUALITY_INSPECTION
    if (entityType === 'TASK' || entityType === 'SUB_TASK') {
      if (isFm) {
        this.runAndUploadFactoryManagerQcInspection(user, entityType, recordId);
        return this.getRecordApprovalMetadata(entityType, recordId);
      }
      if (!this.isFmChecklistCompletedAndApproved(entityType, recordId)) {
        throw new Error(
          'Factory Manager must fill, check all items, and approve first before Project Manager / Admin can approve.'
        );
      }
    } else if (entityType === 'QUALITY_INSPECTION') {
      if (isFm) {
        this.approveInspectionByFactoryManager(user, recordId);
        return this.getRecordApprovalMetadata(entityType, recordId);
      }
      if (!this.isInspectionFmCheckedAndApproved(recordId)) {
        throw new Error(
          'Factory Manager must check and approve the QC checklist first before Project Manager / Admin can approve.'
        );
      }
    }

    // Update underlying record status to Approved
    if (entityType === 'FACTORY_PROFILE') {
      const f = this.factories.find(x => x.id === recordId);
      if (f) {
        f.status = 'Active';
        this.save(STORAGE_KEYS.FACTORIES, this.factories);
      }
    } else if (entityType === 'WORK_PACKAGE') {
      const wp = this.workPackages.find(x => x.id === recordId);
      if (wp) {
        wp.stageStatus = 'Approved';
        this.save(STORAGE_KEYS.WORK_PACKAGES, this.workPackages);
      }
    } else if (entityType === 'TASK') {
      const t = this.tasks.find(x => x.id === recordId);
      if (t) {
        t.stageStatus = 'Approved';
        this.save(STORAGE_KEYS.TASKS, this.tasks);
      }
    } else if (entityType === 'SUB_TASK') {
      this.tasks.forEach(t => {
        (t.subTasks || []).forEach(st => {
          if (st.id === recordId) st.status = 'Completed';
        });
      });
      this.save(STORAGE_KEYS.TASKS, this.tasks);
    } else if (entityType === 'DAILY_REPORT') {
      const r = this.dailyReports.find(x => x.id === recordId);
      if (r) {
        r.status = 'Approved';
        this.save(STORAGE_KEYS.DAILY_REPORTS, this.dailyReports);
      }
    } else if (entityType === 'WORKSHEET') {
      const w = this.worksheets.find(x => x.id === recordId);
      if (w) {
        w.completionStatus = 'QC Approved';
        w.verifiedBySupervisorName = `${actorFullName} (${actorUsername} | ${actorUserId})`;
        this.save(STORAGE_KEYS.WORKSHEETS, this.worksheets);
      }
    } else if (entityType === 'ONSITE_RECORD') {
      const o = this.onsiteDamagesAndIncidents.find(x => x.id === recordId);
      if (o) {
        o.status = 'QC Verified';
        this.save(STORAGE_KEYS.ONSITE_DAMAGES_INCIDENTS, this.onsiteDamagesAndIncidents);
      }
    } else if (entityType === 'MEDIA_EVIDENCE') {
      const m = this.mediaEvidence.find(x => x.id === recordId);
      if (m) {
        m.verifiedByQa = true;
        this.save(STORAGE_KEYS.MEDIA_EVIDENCE, this.mediaEvidence);
      }
    } else if (entityType === 'RESOURCE_ALLOCATION') {
      const ra = this.resourceAllocations.find(x => x.id === recordId);
      if (ra) {
        ra.status = 'Issued / Active';
        this.save(STORAGE_KEYS.RESOURCE_ALLOCATIONS, this.resourceAllocations);
      }
    } else if (entityType === 'QUALITY_INSPECTION') {
      const qi = this.inspections.find(x => x.id === recordId);
      if (qi) {
        qi.decision = 'Approved';
        this.save(STORAGE_KEYS.INSPECTIONS, this.inspections);
      }
    } else if (entityType === 'DISPATCH') {
      const d = this.dispatches.find(x => x.id === recordId);
      if (d) {
        d.fatCompleted = true;
        d.siteLogisticsStatus = 'Inspect & Approved on Site';
        this.save(STORAGE_KEYS.DISPATCHES, this.dispatches);
      }
    } else if (entityType === 'TECHNICAL_DOCUMENT') {
      const doc = this.documents.find(x => x.id === recordId);
      if (doc) {
        doc.approvalStatus = 'Approved for Construction (AFC)';
        this.save(STORAGE_KEYS.DOCUMENTS, this.documents);
      }
    } else if (entityType === 'GENERATED_DOCUMENT') {
      const gd = this.generatedDocs.find(x => x.id === recordId);
      if (gd) {
        gd.status = 'Approved';
        this.save(STORAGE_KEYS.GENERATED_DOCS, this.generatedDocs);
      }
    } else if (entityType === 'PARTNER') {
      const p = this.factoryPartners.find(x => x.id === recordId);
      if (p) {
        p.status = 'Approved';
        this.save(STORAGE_KEYS.FACTORY_PARTNERS, this.factoryPartners);
      }
    } else if (entityType === 'SUPERVISOR_ASSIGNMENT') {
      const sa = this.supervisorAssignments.find(x => x.id === recordId);
      if (sa) {
        sa.status = 'Active';
        this.save(STORAGE_KEYS.SUPERVISOR_ASSIGNMENTS, this.supervisorAssignments);
      }
    } else if (entityType === 'FACTORY_PROCUREMENT') {
      const pr = this.factoryProcurementRecords.find(x => x.id === recordId);
      if (pr) {
        pr.status = pr.stageType === 'QC_INSPECTION' ? 'QC Passed' : pr.stageType === 'GRN' ? 'Received (GRN)' : 'Approved';
        this.save(STORAGE_KEYS.FACTORY_PROCUREMENT, this.factoryProcurementRecords);
      }
    } else if (entityType === 'FACTORY_HR_PAYROLL') {
      const hr = this.factoryHrPayrollRecords.find(x => x.id === recordId);
      if (hr) {
        hr.status = 'Approved';
        this.save(STORAGE_KEYS.FACTORY_HR_PAYROLL, this.factoryHrPayrollRecords);
      }
    } else if (entityType === 'FACTORY_FINANCE_CONTRACT') {
      const fn = this.factoryFinanceRecords.find(x => x.id === recordId);
      if (fn) {
        fn.status = fn.recordCategory === 'CONTRACT_AGREEMENT' ? 'Active Agreement' : fn.recordCategory === 'ACCOUNTING_ENTRY' ? 'Posted to GL' : 'Approved';
        this.save(STORAGE_KEYS.FACTORY_FINANCE_CONTRACTS, this.factoryFinanceRecords);
      }
    }

    const updatedMeta: FactorySystemApprovalMetadata = {
      recordKey: key,
      entityType,
      recordId,
      recordCode: info.code,
      recordTitle: info.title,
      isApproved: true,
      approvalStatus: 'Approved',
      approvedThroughSystemText: 'Approved through Innovista Fabriconix System',
      approvedByAccountName: `${actorFullName} (@${actorUsername})`,
      approvedByUserId: `${actorUserId}${actorEmpId ? ` (${actorEmpId})` : ''}`,
      approvedByUsername: actorUsername,
      approvedByFullName: actorFullName,
      approvedByRole: actorRole,
      approvedAt: nowStr,
      revisionNumber: prev.revisionNumber || 1,
      revisionNotes: remarks
    };

    this.recordApprovalsMap[key] = updatedMeta;
    this.save(STORAGE_KEYS.RECORD_APPROVALS, this.recordApprovalsMap);
    this.recordFactoryUpdateNotification(info.factoryId, 1);

    this.recordAuditEntry(
      user,
      'APPROVED',
      entityType,
      recordId,
      `Approved through system on ${nowStr}. Remarks: ${remarks}`,
      updatedMeta.revisionNumber
    );

    return updatedMeta;
  }

  public reviseOrEditFactoryRecord(
    user: SecurityUser | null,
    entityType: FactoryRecordEntityType,
    recordId: string,
    updates: {
      title?: string;
      status?: string;
      quantity?: number;
      date?: string;
      notes?: string;
    },
    isRevision = true
  ): FactorySystemApprovalMetadata {
    const key = `${entityType}:${recordId}`;
    const prev = this.getRecordApprovalMetadata(entityType, recordId);
    const nextRev = isRevision ? (prev.revisionNumber || 1) + 1 : prev.revisionNumber || 1;

    if (entityType === 'FACTORY_PROFILE') {
      const f = this.factories.find(x => x.id === recordId);
      if (f) {
        if (updates.title) f.name = updates.title;
        if (updates.status) f.status = updates.status as any;
        if (typeof updates.quantity === 'number') f.maximumCapacityUnitsPerMonth = updates.quantity;
        f.audit.revision = nextRev;
        this.save(STORAGE_KEYS.FACTORIES, this.factories);
      }
    } else if (entityType === 'WORK_PACKAGE') {
      const wp = this.workPackages.find(x => x.id === recordId);
      if (wp) {
        if (updates.title) wp.title = updates.title;
        if (updates.status) wp.stageStatus = updates.status as any;
        if (typeof updates.quantity === 'number') wp.plannedQuantity = updates.quantity;
        if (updates.date) wp.deadlineDate = updates.date;
        wp.audit.revision = nextRev;
        this.save(STORAGE_KEYS.WORK_PACKAGES, this.workPackages);
      }
    } else if (entityType === 'TASK') {
      const t = this.tasks.find(x => x.id === recordId);
      if (t) {
        if (updates.title) t.title = updates.title;
        if (updates.status) t.stageStatus = updates.status as any;
        if (typeof updates.quantity === 'number') t.plannedQuantity = updates.quantity;
        if (updates.date) t.targetDate = updates.date;
        if (updates.notes) t.supervisorRemarks = updates.notes;
        t.audit.revision = nextRev;
        this.save(STORAGE_KEYS.TASKS, this.tasks);
      }
    } else if (entityType === 'SUB_TASK') {
      this.tasks.forEach(t => {
        (t.subTasks || []).forEach(st => {
          if (st.id === recordId) {
            if (updates.title) st.title = updates.title;
            if (updates.status) st.status = updates.status as any;
            if (typeof updates.quantity === 'number') st.plannedQty = updates.quantity;
            if (updates.date) st.endDate = updates.date;
          }
        });
      });
      this.save(STORAGE_KEYS.TASKS, this.tasks);
    } else if (entityType === 'DAILY_REPORT') {
      const r = this.dailyReports.find(x => x.id === recordId);
      if (r) {
        if (updates.title) r.completedActivitiesSummary = updates.title;
        if (updates.status) r.status = updates.status as any;
        if (typeof updates.quantity === 'number') r.completedUnitsToday = updates.quantity;
        if (updates.date) r.date = updates.date;
        if (updates.notes) r.supervisorComments = updates.notes;
        r.audit.revision = nextRev;
        this.save(STORAGE_KEYS.DAILY_REPORTS, this.dailyReports);
      }
    } else if (entityType === 'WORKSHEET') {
      const w = this.worksheets.find(x => x.id === recordId);
      if (w) {
        if (updates.title) w.operationStep = updates.title;
        if (updates.status) w.completionStatus = updates.status as any;
        if (typeof updates.quantity === 'number') w.completedQty = updates.quantity;
        if (updates.date) w.date = updates.date;
        if (updates.notes) w.remarks = updates.notes;
        w.audit.revision = nextRev;
        this.save(STORAGE_KEYS.WORKSHEETS, this.worksheets);
      }
    } else if (entityType === 'ONSITE_RECORD') {
      const o = this.onsiteDamagesAndIncidents.find(x => x.id === recordId);
      if (o) {
        if (updates.title) o.title = updates.title;
        if (updates.status) o.status = updates.status as any;
        if (typeof updates.quantity === 'number') o.affectedQty = updates.quantity;
        if (updates.date) o.date = updates.date;
        if (updates.notes) o.correctiveAction = updates.notes;
        this.save(STORAGE_KEYS.ONSITE_DAMAGES_INCIDENTS, this.onsiteDamagesAndIncidents);
      }
    } else if (entityType === 'MEDIA_EVIDENCE') {
      const m = this.mediaEvidence.find(x => x.id === recordId);
      if (m) {
        if (updates.title) m.description = updates.title;
        if (updates.notes) m.dimensionsVerifiedText = updates.notes;
        m.audit.revision = nextRev;
        this.save(STORAGE_KEYS.MEDIA_EVIDENCE, this.mediaEvidence);
      }
    } else if (entityType === 'RESOURCE_ALLOCATION') {
      const ra = this.resourceAllocations.find(x => x.id === recordId);
      if (ra) {
        if (updates.title) ra.resourceName = updates.title;
        if (updates.status) ra.status = updates.status as any;
        if (typeof updates.quantity === 'number') {
          ra.plannedQty = updates.quantity;
          ra.totalAllocatedCost = updates.quantity * ra.unitCost;
        }
        this.save(STORAGE_KEYS.RESOURCE_ALLOCATIONS, this.resourceAllocations);
      }
    } else if (entityType === 'QUALITY_INSPECTION') {
      const qi = this.inspections.find(x => x.id === recordId);
      if (qi) {
        if (updates.title) qi.inspectorName = updates.title;
        if (updates.status) qi.decision = updates.status as any;
        if (typeof updates.quantity === 'number') qi.acceptedQuantity = updates.quantity;
        if (updates.date) qi.date = updates.date;
        if (updates.notes) qi.correctiveActionRequired = updates.notes;
        qi.audit.revision = nextRev;
        this.save(STORAGE_KEYS.INSPECTIONS, this.inspections);
      }
    } else if (entityType === 'DISPATCH') {
      const d = this.dispatches.find(x => x.id === recordId);
      if (d) {
        if (updates.title) d.itemDescription = updates.title;
        if (updates.status) d.siteLogisticsStatus = updates.status as any;
        if (typeof updates.quantity === 'number') d.totalQuantityDispatched = updates.quantity;
        if (updates.date) d.dispatchDate = updates.date;
        d.audit.revision = nextRev;
        this.save(STORAGE_KEYS.DISPATCHES, this.dispatches);
      }
    } else if (entityType === 'TECHNICAL_DOCUMENT') {
      const doc = this.documents.find(x => x.id === recordId);
      if (doc) {
        if (updates.title) doc.title = updates.title;
        if (updates.status) doc.approvalStatus = updates.status as any;
        if (updates.notes) doc.technicalInstructions = updates.notes;
        doc.currentRevision = `Rev ${nextRev}`;
        doc.audit.revision = nextRev;
        this.save(STORAGE_KEYS.DOCUMENTS, this.documents);
      }
    } else if (entityType === 'GENERATED_DOCUMENT') {
      const gd = this.generatedDocs.find(x => x.id === recordId);
      if (gd) {
        if (updates.title) gd.title = updates.title;
        if (updates.status) gd.status = updates.status as any;
        gd.revision = `Rev ${nextRev}`;
        this.save(STORAGE_KEYS.GENERATED_DOCS, this.generatedDocs);
      }
    } else if (entityType === 'PARTNER') {
      const p = this.factoryPartners.find(x => x.id === recordId);
      if (p) {
        if (updates.title) p.partnerName = updates.title;
        if (updates.status) p.status = updates.status as any;
        if (updates.notes) p.materialsOrServicesScope = updates.notes;
        this.save(STORAGE_KEYS.FACTORY_PARTNERS, this.factoryPartners);
      }
    }

    const info = this.resolveRecordBasicInfo(entityType, recordId);
    const updatedMeta: FactorySystemApprovalMetadata = {
      ...prev,
      recordCode: info.code,
      recordTitle: info.title,
      revisionNumber: nextRev,
      revisionNotes: updates.notes || prev.revisionNotes
    };

    this.recordApprovalsMap[key] = updatedMeta;
    this.save(STORAGE_KEYS.RECORD_APPROVALS, this.recordApprovalsMap);
    this.recordFactoryUpdateNotification(info.factoryId, 1);

    this.recordAuditEntry(
      user,
      isRevision ? 'REVISED' : 'EDITED',
      entityType,
      recordId,
      `${isRevision ? `Revised to Rev ${nextRev}` : 'Edited record details'}${updates.notes ? ` — Notes: ${updates.notes}` : ''}`,
      nextRev
    );

    return updatedMeta;
  }

  public deleteFactoryRecord(
    userOrEntity: SecurityUser | null | FactoryRecordEntityType | string,
    entityTypeOrId?: FactoryRecordEntityType | string,
    recordIdOrReason?: string,
    maybeReason?: string
  ): boolean {
    let user: SecurityUser | null = null;
    let entityType: FactoryRecordEntityType;
    let recordId: string;
    let reason = 'Deleted by authorized user';

    if (typeof userOrEntity === 'string') {
      entityType = userOrEntity as FactoryRecordEntityType;
      recordId = String(entityTypeOrId || '');
      reason = recordIdOrReason || 'Deleted by authorized user';
    } else {
      user = userOrEntity;
      entityType = entityTypeOrId as FactoryRecordEntityType;
      recordId = String(recordIdOrReason || '');
      reason = maybeReason || 'Deleted by authorized user';
    }

    if ((entityType as string) === 'CONTROLLED_TECHNICAL_DOCUMENT') {
      entityType = 'TECHNICAL_DOCUMENT';
    }
    if ((entityType as string) === 'FACTORY_PARTNER') {
      entityType = 'PARTNER';
    }

    const info = this.resolveRecordBasicInfo(entityType, recordId);

    this.recordAuditEntry(
      user,
      'DELETED',
      entityType,
      recordId,
      `Deleted record [${info.code} — ${info.title}]. Reason: ${reason}`,
      info.revision
    );

    if (entityType === 'FACTORY_PROFILE') {
      this.factories = this.factories.filter(x => x.id !== recordId);
      this.save(STORAGE_KEYS.FACTORIES, this.factories);
    } else if (entityType === 'WORK_PACKAGE') {
      this.workPackages = this.workPackages.filter(x => x.id !== recordId);
      this.save(STORAGE_KEYS.WORK_PACKAGES, this.workPackages);
    } else if (entityType === 'TASK') {
      this.tasks = this.tasks.filter(x => x.id !== recordId);
      this.save(STORAGE_KEYS.TASKS, this.tasks);
    } else if (entityType === 'SUB_TASK') {
      this.tasks.forEach(t => {
        t.subTasks = (t.subTasks || []).filter(st => st.id !== recordId);
      });
      this.save(STORAGE_KEYS.TASKS, this.tasks);
    } else if (entityType === 'DAILY_REPORT') {
      this.dailyReports = this.dailyReports.filter(x => x.id !== recordId);
      this.save(STORAGE_KEYS.DAILY_REPORTS, this.dailyReports);
    } else if (entityType === 'WORKSHEET') {
      this.worksheets = this.worksheets.filter(x => x.id !== recordId);
      this.save(STORAGE_KEYS.WORKSHEETS, this.worksheets);
    } else if (entityType === 'ONSITE_RECORD') {
      this.onsiteDamagesAndIncidents = this.onsiteDamagesAndIncidents.filter(x => x.id !== recordId);
      this.save(STORAGE_KEYS.ONSITE_DAMAGES_INCIDENTS, this.onsiteDamagesAndIncidents);
    } else if (entityType === 'MEDIA_EVIDENCE') {
      this.mediaEvidence = this.mediaEvidence.filter(x => x.id !== recordId);
      this.save(STORAGE_KEYS.MEDIA_EVIDENCE, this.mediaEvidence);
    } else if (entityType === 'RESOURCE_ALLOCATION') {
      this.resourceAllocations = this.resourceAllocations.filter(x => x.id !== recordId);
      this.save(STORAGE_KEYS.RESOURCE_ALLOCATIONS, this.resourceAllocations);
    } else if (entityType === 'QUALITY_INSPECTION') {
      this.inspections = this.inspections.filter(x => x.id !== recordId);
      this.save(STORAGE_KEYS.INSPECTIONS, this.inspections);
    } else if (entityType === 'DISPATCH') {
      this.dispatches = this.dispatches.filter(x => x.id !== recordId);
      this.save(STORAGE_KEYS.DISPATCHES, this.dispatches);
    } else if (entityType === 'TECHNICAL_DOCUMENT') {
      this.documents = this.documents.filter(x => x.id !== recordId);
      this.save(STORAGE_KEYS.DOCUMENTS, this.documents);
    } else if (entityType === 'GENERATED_DOCUMENT') {
      this.generatedDocs = this.generatedDocs.filter(x => x.id !== recordId);
      this.save(STORAGE_KEYS.GENERATED_DOCS, this.generatedDocs);
    } else if (entityType === 'PARTNER') {
      this.factoryPartners = this.factoryPartners.filter(x => x.id !== recordId);
      this.save(STORAGE_KEYS.FACTORY_PARTNERS, this.factoryPartners);
    } else if (entityType === 'SUPERVISOR_ASSIGNMENT') {
      this.supervisorAssignments = this.supervisorAssignments.filter(x => x.id !== recordId);
      this.save(STORAGE_KEYS.SUPERVISOR_ASSIGNMENTS, this.supervisorAssignments);
    } else if (entityType === 'FACTORY_PROCUREMENT') {
      this.factoryProcurementRecords = this.factoryProcurementRecords.filter(x => x.id !== recordId);
      this.save(STORAGE_KEYS.FACTORY_PROCUREMENT, this.factoryProcurementRecords);
    } else if (entityType === 'FACTORY_HR_PAYROLL') {
      this.factoryHrPayrollRecords = this.factoryHrPayrollRecords.filter(x => x.id !== recordId);
      this.save(STORAGE_KEYS.FACTORY_HR_PAYROLL, this.factoryHrPayrollRecords);
    } else if (entityType === 'FACTORY_FINANCE_CONTRACT') {
      this.factoryFinanceRecords = this.factoryFinanceRecords.filter(x => x.id !== recordId);
      this.save(STORAGE_KEYS.FACTORY_FINANCE_CONTRACTS, this.factoryFinanceRecords);
    } else if (entityType === 'HSE_RECORD') {
      if (typeof (safetyControlService as any).deleteHseAudit === 'function') {
        (safetyControlService as any).deleteHseAudit(recordId);
      }
    }

    return true;
  }

  public recordDocumentPrintOrGenerate(
    user: SecurityUser | null,
    entityType: FactoryRecordEntityType,
    recordId: string,
    mode: 'PRINTED' | 'DOCUMENT_GENERATED' = 'DOCUMENT_GENERATED'
  ): GeneratedFactoryDocument {
    const info = this.resolveRecordBasicInfo(entityType, recordId);
    const approval = this.getRecordApprovalMetadata(entityType, recordId);

    this.recordAuditEntry(
      user,
      mode,
      entityType,
      recordId,
      `${mode === 'PRINTED' ? 'Printed' : 'Generated'} Quotation-Format Document for [${info.code} — ${info.title}] (Approval: ${approval.isApproved ? `${approval.approvedByAccountName} ID: ${approval.approvedByUserId} on ${approval.approvedAt}` : 'Pending'})`,
      approval.revisionNumber
    );

    return this.generateOperationalDocument(
      user,
      'Work Order (WO)',
      info.projectId,
      info.factoryId,
      info.code,
      info.code,
      {
        RecordCode: info.code,
        RecordTitle: info.title,
        EntityType: entityType,
        SystemApproval: approval.isApproved
          ? `Approved by ${approval.approvedByAccountName} (${approval.approvedByUserId}) on ${approval.approvedAt}`
          : 'Pending System Approval',
        Revision: `Rev ${approval.revisionNumber}`
      }
    );
  }

  // --- 14. Project Master QC Checklist & Task / Sub-Task QC Workflow (FM Runs/Uploads -> PM/Admin Approves) ---
  public isFactoryManagerAccount(
    user: SecurityUser | null,
    factoryId?: string,
    projectId?: string
  ): boolean {
    if (!user) return false;
    const roleLower = (user.roleName || '').toLowerCase();
    const usernameLower = (user.username || '').toLowerCase();
    if (
      user.roleId === 'role-superadmin' ||
      user.roleId === 'role-sysadmin' ||
      user.roleId === 'role-admin' ||
      user.roleId === 'role-pm' ||
      user.userType === 'SUPER_ADMIN' ||
      user.userType === 'SYSTEM_ADMINISTRATOR' ||
      user.userType === 'PROJECT_MANAGER' ||
      user.adminAuthorityLevel === 'SUPER_ADMINISTRATOR' ||
      user.adminAuthorityLevel === 'SYSTEM_ADMINISTRATOR' ||
      user.adminAuthorityLevel === 'PROJECT_ADMINISTRATOR' ||
      roleLower.includes('project manager') ||
      roleLower.includes('admin') ||
      roleLower === 'pm' ||
      usernameLower.includes('admin') ||
      usernameLower.includes('.pm')
    ) {
      return false;
    }

    // Check if this user (Engineer, QC Inspector, Supervisor, Procurement, Finance, HR, etc.)
    // has been assigned in Factory & Project Supervising Assignments with individual Factory Manager authority
    const assignedWithFmAuthority = this.supervisorAssignments.some(sa => {
      if (sa.status !== 'Active' || !sa.hasFactoryManagerAuthority) return false;
      const userMatches =
        sa.userId === user.id ||
        (sa.username && sa.username.toLowerCase() === usernameLower) ||
        (sa.fullName && sa.fullName.toLowerCase() === (user.fullName || '').toLowerCase());
      if (!userMatches) return false;
      const facMatches = !factoryId || factoryId === 'ALL' || sa.factoryId === factoryId;
      const prjMatches = !projectId || projectId === 'ALL' || sa.projectId === projectId;
      return facMatches && prjMatches;
    });

    if (assignedWithFmAuthority) {
      return true;
    }

    return (
      user.userType === 'FACTORY_MANAGER' ||
      user.userType === 'EXTERNAL_FACTORY_MANAGER' ||
      user.userType === 'WORKSHOP_MANAGER' ||
      user.userType === 'PRODUCTION_MANAGER' ||
      user.userType === 'SITE_SUPERVISOR' ||
      user.userType === 'QA_QC_OFFICER' ||
      user.userType === 'PROJECT_ENGINEER' ||
      user.userType === 'SITE_ENGINEER' ||
      user.roleId === 'role-facmgr' ||
      user.roleId === 'role-ext-fac-mgr' ||
      user.roleId === 'role-facsup' ||
      user.adminAuthorityLevel === 'FACTORY_ADMINISTRATOR' ||
      user.department === 'FACTORY_PRODUCTION' ||
      roleLower.includes('factory') ||
      roleLower.includes('supervisor') ||
      roleLower.includes('workshop')
    );
  }

  public canApproveQualityInspection(user: SecurityUser | null): boolean {
    if (!user) return true;
    if (this.isFactoryManagerAccount(user)) {
      return false;
    }
    return true;
  }

  public getProjectMasterQcChecklist(_projectId?: string): ProjectMasterQcChecklistItem[] {
    return PROJECT_MASTER_QC_CHECKLIST;
  }

  private buildUniqueChecklistForTarget(
    targetType: 'TASK' | 'SUB_TASK',
    targetCode: string,
    targetTitle: string,
    workflowOrStep?: string,
    drawingNo?: string,
    checkedByDefault = false
  ): TaskOrSubTaskQcItemCheck[] {
    const wf = workflowOrStep || targetTitle || 'Production Execution';
    const drw = drawingNo || 'AFC Shop Drawing';
    const prefix = targetCode.replace(/[^A-Z0-9-]/gi, '').slice(-8) || (targetType === 'TASK' ? 'TSK' : 'SUB');
    const uniqueSpecs = [
      {
        code: `${prefix}-QC-01`,
        category: 'Material & Profile Verification',
        parameter: `${targetCode} Material & Profile Grade Check (${targetTitle.slice(0, 36)})`,
        standardSpecification: `Verified per ${drw} & Mill Test Certificate (EN 10204 3.1)`
      },
      {
        code: `${prefix}-QC-02`,
        category: 'CNC Cutting & Milling Tolerance',
        parameter: `${targetCode} Dimensional & Machining Accuracy (${wf.slice(0, 32)})`,
        standardSpecification: `Length ±0.5mm, Diagonal ±1.0mm per ${drw}`
      },
      {
        code: `${prefix}-QC-03`,
        category: 'Welding & Structural Fit-Up',
        parameter: `${targetCode} Joint Fit-Up, Cleat Crimping & Fastener Torque`,
        standardSpecification: 'Zero gap joint alignment & calibrated torque verification'
      },
      {
        code: `${prefix}-QC-04`,
        category: 'Glazing & Silicone Sealing',
        parameter: `${targetCode} Gasket Compression, Sealant Bite & Weatherproofing`,
        standardSpecification: 'Continuous structural bite & shore hardness compliance'
      },
      {
        code: `${prefix}-QC-05`,
        category: 'Surface Coating & DFT',
        parameter: `${targetCode} Surface Finish, Coating DFT & Visual Inspection`,
        standardSpecification: 'DFT ≥ 65 µm, zero scratches, protective film intact'
      },
      {
        code: `${prefix}-QC-06`,
        category: 'Pre-Dispatch Packing & Tagging',
        parameter: `${targetCode} Final Barcode Tagging & Evidence Verification`,
        standardSpecification: 'Barcode label affixed & mandatory shop-floor evidence attached'
      }
    ];

    return uniqueSpecs.map((item, idx) => ({
      masterItemId: `uqc-${targetType.toLowerCase()}-${targetCode}-${idx + 1}`,
      code: item.code,
      category: item.category,
      parameter: item.parameter,
      standardSpecification: item.standardSpecification,
      checked: checkedByDefault,
      checkedBy: checkedByDefault ? 'Rohan Wijesinghe (Factory Manager)' : undefined,
      checkedAt: checkedByDefault ? '2026-09-26' : undefined
    }));
  }

  public getTaskOrSubTaskEvidences(
    targetType: 'TASK' | 'SUB_TASK',
    targetId: string
  ): OnsiteEvidenceAttachment[] {
    const state = this.getTaskOrSubTaskQcState(targetType, targetId);
    const list: OnsiteEvidenceAttachment[] = [...(state.evidenceAttachments || [])];
    const seenNames = new Set(list.map(a => a.fileName));

    if (targetType === 'TASK') {
      const task = this.tasks.find(t => t.id === targetId || t.taskCode === targetId);
      if (task) {
        (task.evidenceAttachments || []).forEach(att => {
          if (!seenNames.has(att.fileName)) {
            seenNames.add(att.fileName);
            list.push(att);
          }
        });
        (task.supportingDocuments || []).forEach(doc => {
          if (doc.fileName.startsWith('System_Generated_QC_Checklist_')) return;
          if (!seenNames.has(doc.fileName)) {
            seenNames.add(doc.fileName);
            const isVideo =
              (doc.fileType || '').toLowerCase().includes('video') ||
              /\.(mp4|mov|webm|avi|mkv)$/i.test(doc.fileName);
            const isImage =
              (doc.fileType || '').toLowerCase().includes('image') ||
              /\.(jpg|jpeg|png|webp|gif|bmp|svg)$/i.test(doc.fileName);
            list.push({
              id: doc.id,
              fileName: doc.fileName,
              mediaKind: isVideo ? 'Video' : isImage ? 'Image' : 'Document',
              fileSizeBytes: isVideo ? 1800 * 1024 : 420 * 1024,
              fileSizeLabel: doc.fileSize || (isVideo ? '1.8 MB' : '420 KB'),
              maxLimitLabel: isVideo ? '≤ 5 MB (Video)' : '≤ 1 MB (Image/Doc)',
              uploadedBy: doc.uploadedBy || 'Factory Manager',
              uploadedAt: (doc.uploadedAt || '2026-09-26').slice(0, 10),
              dataUrl: doc.dataUrl
            });
          }
        });
      }
    }

    return list;
  }

  public hasAtLeastOneEvidence(
    targetType: 'TASK' | 'SUB_TASK',
    targetId: string
  ): boolean {
    return this.getTaskOrSubTaskEvidences(targetType, targetId).length > 0;
  }

  public uploadTaskOrSubTaskEvidence(
    user: SecurityUser | null,
    targetType: 'TASK' | 'SUB_TASK',
    targetId: string,
    attachment: {
      fileName: string;
      mediaKind: 'Image' | 'Document' | 'Video';
      fileSizeBytes?: number;
      fileSizeLabel: string;
      maxLimitLabel?: '≤ 1 MB (Image/Doc)' | '≤ 5 MB (Video)';
      dataUrl?: string;
      remarks?: string;
      caption?: string;
    }
  ): TaskOrSubTaskQcState {
    const maxBytes = attachment.mediaKind === 'Video' ? 5 * 1024 * 1024 : 1 * 1024 * 1024;
    const sizeBytes = attachment.fileSizeBytes || (attachment.mediaKind === 'Video' ? 2 * 1024 * 1024 : 350 * 1024);
    if (sizeBytes > maxBytes) {
      throw new Error(
        `${attachment.mediaKind} exceeds maximum size limit (${attachment.mediaKind === 'Video' ? '5 MB' : '1 MB'}).`
      );
    }

    const state = this.getTaskOrSubTaskQcState(targetType, targetId);
    const actorName = user?.fullName || 'Rohan Wijesinghe (Factory Manager)';
    const nowDate = new Date().toISOString().slice(0, 10);
    const resolvedLimitLabel = attachment.maxLimitLabel || (attachment.mediaKind === 'Video' ? '≤ 5 MB (Video)' : '≤ 1 MB (Image/Doc)');

    const newAtt: OnsiteEvidenceAttachment = {
      id: `evd-qc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      fileName: attachment.fileName,
      mediaKind: attachment.mediaKind,
      fileSizeBytes: sizeBytes,
      fileSizeLabel: attachment.fileSizeLabel,
      maxLimitLabel: resolvedLimitLabel,
      uploadedBy: actorName,
      uploadedAt: nowDate,
      caption: attachment.caption || attachment.remarks,
      remarks: attachment.remarks || attachment.caption,
      dataUrl:
        attachment.dataUrl ||
        (attachment.mediaKind === 'Image'
          ? 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=900&q=80'
          : undefined)
    };

    state.evidenceAttachments = [newAtt, ...(state.evidenceAttachments || [])];
    this.taskSubTaskQcStates[`${targetType}:${targetId}`] = { ...state };
    this.saveTaskSubTaskQcStatesMap();

    // Also attach to parent Task supportingDocuments & evidenceAttachments
    const parentTaskId = targetType === 'TASK' ? targetId : state.parentTaskId || '';
    const task = this.tasks.find(t => t.id === parentTaskId || t.id === targetId);
    if (task) {
      task.evidenceAttachments = [newAtt, ...(task.evidenceAttachments || [])];
      task.supportingDocuments = [
        {
          id: newAtt.id,
          fileName: newAtt.fileName,
          fileType: newAtt.mediaKind,
          docCategory: `${targetType === 'SUB_TASK' ? `Sub-Task ${state.targetCode}` : `Task ${state.targetCode}`} Evidence${attachment.remarks ? ` · ${attachment.remarks}` : ''}`,
          fileSize: `${newAtt.fileSizeLabel} (${newAtt.maxLimitLabel})`,
          uploadedBy: actorName,
          uploadedAt: nowDate,
          dataUrl: newAtt.dataUrl
        },
        ...(task.supportingDocuments || [])
      ];
      this.save(STORAGE_KEYS.TASKS, this.tasks);
    }

    return state;
  }

  // --- Admin / Project Manager Only: Add, Edit & Delete Unique Checklist Items ---
  public addQcChecklistItem(
    user: SecurityUser | null,
    targetType: 'TASK' | 'SUB_TASK',
    targetId: string,
    input: {
      code?: string;
      category: string;
      parameter: string;
      standardSpecification: string;
    }
  ): TaskOrSubTaskQcState {
    if (!this.canApproveQualityInspection(user)) {
      throw new Error('Only Admin or Project Manager can add or modify checklist items.');
    }
    const state = this.getTaskOrSubTaskQcState(targetType, targetId);
    const nextIdx = state.checklistItems.length + 1;
    const prefix = state.targetCode.replace(/[^A-Z0-9-]/gi, '').slice(-8) || 'CHK';
    const newItem: TaskOrSubTaskQcItemCheck = {
      masterItemId: `uqc-custom-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      code: input.code?.trim() || `${prefix}-QC-0${nextIdx}`,
      category: input.category.trim() || 'Material & Profile Verification',
      parameter: input.parameter.trim(),
      standardSpecification: input.standardSpecification.trim() || 'Per Approved AFC Drawing & ISO Standard',
      checked: false
    };
    state.checklistItems = [...state.checklistItems, newItem];
    this.taskSubTaskQcStates[`${targetType}:${targetId}`] = { ...state };
    this.saveTaskSubTaskQcStatesMap();
    return state;
  }

  public updateQcChecklistItem(
    user: SecurityUser | null,
    targetType: 'TASK' | 'SUB_TASK',
    targetId: string,
    masterItemId: string,
    updates: {
      code?: string;
      category?: string;
      parameter?: string;
      standardSpecification?: string;
    }
  ): TaskOrSubTaskQcState {
    if (!this.canApproveQualityInspection(user)) {
      throw new Error('Only Admin or Project Manager can edit checklist items.');
    }
    const state = this.getTaskOrSubTaskQcState(targetType, targetId);
    state.checklistItems = state.checklistItems.map(item => {
      if (item.masterItemId !== masterItemId) return item;
      return {
        ...item,
        code: updates.code !== undefined ? updates.code : item.code,
        category: updates.category !== undefined ? updates.category : item.category,
        parameter: updates.parameter !== undefined ? updates.parameter : item.parameter,
        standardSpecification:
          updates.standardSpecification !== undefined
            ? updates.standardSpecification
            : item.standardSpecification
      };
    });
    this.taskSubTaskQcStates[`${targetType}:${targetId}`] = { ...state };
    this.saveTaskSubTaskQcStatesMap();
    return state;
  }

  public deleteQcChecklistItem(
    user: SecurityUser | null,
    targetType: 'TASK' | 'SUB_TASK',
    targetId: string,
    masterItemId: string
  ): TaskOrSubTaskQcState {
    if (!this.canApproveQualityInspection(user)) {
      throw new Error('Only Admin or Project Manager can delete checklist items.');
    }
    const state = this.getTaskOrSubTaskQcState(targetType, targetId);
    if (state.checklistItems.length <= 1) {
      throw new Error('At least one checklist item must remain.');
    }
    state.checklistItems = state.checklistItems.filter(item => item.masterItemId !== masterItemId);
    this.taskSubTaskQcStates[`${targetType}:${targetId}`] = { ...state };
    this.saveTaskSubTaskQcStatesMap();
    return state;
  }

  public addTaskOrSubTaskChecklistItem(
    user: SecurityUser | null,
    targetType: 'TASK' | 'SUB_TASK',
    targetId: string,
    input: {
      code?: string;
      category: string;
      parameter: string;
      standardSpecification: string;
      acceptanceCriteria?: string;
    }
  ): TaskOrSubTaskQcState {
    return this.addQcChecklistItem(user, targetType, targetId, input);
  }

  public updateTaskOrSubTaskChecklistItem(
    user: SecurityUser | null,
    targetType: 'TASK' | 'SUB_TASK',
    targetId: string,
    masterItemId: string,
    updates: {
      code?: string;
      category?: string;
      parameter?: string;
      standardSpecification?: string;
      acceptanceCriteria?: string;
    }
  ): TaskOrSubTaskQcState {
    return this.updateQcChecklistItem(user, targetType, targetId, masterItemId, updates);
  }

  public deleteTaskOrSubTaskChecklistItem(
    user: SecurityUser | null,
    targetType: 'TASK' | 'SUB_TASK',
    targetId: string,
    masterItemId: string
  ): TaskOrSubTaskQcState {
    return this.deleteQcChecklistItem(user, targetType, targetId, masterItemId);
  }

  public isFmChecklistCompletedAndApproved(
    targetType: 'TASK' | 'SUB_TASK',
    targetId: string
  ): boolean {
    const state = this.getTaskOrSubTaskQcState(targetType, targetId);
    const hasEvidence = this.getTaskOrSubTaskEvidences(targetType, targetId).length > 0;
    const allChecked =
      state.checklistItems.length > 0 && state.checklistItems.every(i => i.checked);
    const fmApproved =
      Boolean(state.factoryManagerApproval?.isApproved) ||
      (Boolean(state.systemChecklistGenerated) &&
        Boolean(state.submittedByFactoryManagerName) &&
        (state.qcStatus === 'Submitted by FM (Pending PM/Admin Approval)' ||
          state.qcStatus === 'Approved by PM/Admin'));
    return hasEvidence && allChecked && fmApproved;
  }

  public isInspectionFmCheckedAndApproved(inspectionId: string): boolean {
    const ins = this.inspections.find(i => i.id === inspectionId);
    if (!ins) return false;
    if (ins.factoryManagerApproval?.isApproved || ins.decision === 'Approved') return true;
    const allPass =
      (ins.checklistResults || []).length > 0 &&
      (ins.checklistResults || []).every(r => r.result === 'Pass');
    const taskFmOk = ins.taskId ? this.isFmChecklistCompletedAndApproved('TASK', ins.taskId) : false;
    const fmFlagged =
      Boolean(ins.itpReference?.startsWith('SYS-QCL')) ||
      Boolean(ins.itpReference?.startsWith('FM-OK')) ||
      Boolean(ins.defectDescription?.includes('Factory Manager'));
    return allPass && (taskFmOk || fmFlagged);
  }

  public approveInspectionByFactoryManager(
    user: SecurityUser | null,
    inspectionId: string
  ): FactoryQualityInspectionRecord {
    const ins = this.inspections.find(i => i.id === inspectionId);
    if (!ins) throw new Error('Inspection not found');
    if (ins.taskId && !this.hasAtLeastOneEvidence('TASK', ins.taskId)) {
      throw new Error(
        'Upload at least 1 evidence (Image/Document ≤ 1MB or Video ≤ 5MB) before checking or approving.'
      );
    }
    const fmFullName = user?.fullName || 'Rohan Wijesinghe';
    const fmUsername = user?.username || 'rohan.factory';
    const fmUserId = user?.id || 'usr-fac-01';
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);

    ins.checklistResults = (ins.checklistResults || []).map(r => ({
      ...r,
      result: 'Pass',
      measured: 'Checked by FM'
    }));
    ins.itpReference = `SYS-QCL-${ins.taskCode}`;
    ins.inspectorName = `${fmFullName} (Factory Manager)`;
    ins.decision = 'Pending Inspection';
    ins.factoryManagerApproval = {
      isApproved: true,
      approvedByName: fmFullName,
      approvedByUserId: fmUserId,
      approvedAt: nowStr
    };
    ins.defectDescription = `1st Approved by Factory Manager ${fmFullName} (@${fmUsername}) on ${nowStr}. Pending PM/Admin 2nd Approval.`;
    this.save(STORAGE_KEYS.INSPECTIONS, this.inspections);

    if (ins.taskId) {
      this.runAndUploadFactoryManagerQcInspection(user, 'TASK', ins.taskId);
    }
    return ins;
  }

  public approveQualityInspectionRecordByFactoryManager(
    user: SecurityUser | null,
    inspectionId: string
  ): FactoryQualityInspectionRecord {
    return this.approveInspectionByFactoryManager(user, inspectionId);
  }

  public approveQualityInspectionRecordByPmOrAdmin(
    user: SecurityUser | null,
    inspectionId: string
  ): FactoryQualityInspectionRecord {
    if (!this.canApproveQualityInspection(user)) {
      throw new Error('Only Project Manager or Admin can grant 2nd Approval.');
    }
    const ins = this.inspections.find(i => i.id === inspectionId);
    if (!ins) throw new Error('Inspection not found');
    if (!this.isInspectionFmCheckedAndApproved(inspectionId)) {
      throw new Error('Factory Manager must upload evidence, check, and approve first.');
    }
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const approverName = user?.fullName || 'Alexander Vance';
    const approverUserId = user?.id || 'usr-admin-01';

    ins.decision = 'Approved';
    ins.qtyApproved = ins.qtySubmitted || 1;
    ins.pmOrAdminApproval = {
      isApproved: true,
      approvedByName: approverName,
      approvedByUserId: approverUserId,
      approvedAt: nowStr
    };
    ins.clientOrConsultantSignOff = `${approverName} (ID: ${approverUserId}) on ${nowStr}`;
    this.save(STORAGE_KEYS.INSPECTIONS, this.inspections);

    if (ins.taskId) {
      try {
        this.approveTaskOrSubTaskQcByPmOrAdmin(user, 'TASK', ins.taskId);
      } catch {
        // ignore if task checklist not yet synced
      }
    }
    return ins;
  }

  private loadTaskSubTaskQcStatesMap(): Record<string, TaskOrSubTaskQcState> {
    if (Object.keys(this.taskSubTaskQcStates).length > 0) {
      return this.taskSubTaskQcStates;
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.TASK_SUBTASK_QC_STATES);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          this.taskSubTaskQcStates = parsed;
        }
      }
    } catch {
      // ignore
    }
    return this.taskSubTaskQcStates;
  }

  private saveTaskSubTaskQcStatesMap() {
    this.save(STORAGE_KEYS.TASK_SUBTASK_QC_STATES, this.taskSubTaskQcStates);
  }

  public getTaskOrSubTaskQcState(
    targetType: 'TASK' | 'SUB_TASK',
    targetId: string
  ): TaskOrSubTaskQcState {
    const map = this.loadTaskSubTaskQcStatesMap();
    const key = `${targetType}:${targetId}`;
    if (map[key]) {
      const existing = map[key];
      // Backfill factoryManagerApproval / pmOrAdminApproval if missing from older state
      if (
        !existing.factoryManagerApproval &&
        existing.systemChecklistGenerated &&
        (existing.qcStatus === 'Submitted by FM (Pending PM/Admin Approval)' ||
          existing.qcStatus === 'Approved by PM/Admin')
      ) {
        existing.factoryManagerApproval = {
          isApproved: true,
          approvedByName: existing.submittedByFactoryManagerName || 'Rohan Wijesinghe (Factory Manager)',
          approvedByUserId: existing.submittedByFactoryManagerId || 'usr-fac-01',
          approvedAt: existing.submittedAt || '2026-09-26 14:20'
        };
      }
      if (!existing.pmOrAdminApproval && existing.qcStatus === 'Approved by PM/Admin') {
        existing.pmOrAdminApproval = {
          isApproved: true,
          approvedByName: existing.approvedByName || 'Alexander Vance',
          approvedByUserId: existing.approvedByUserId || 'usr-admin-01',
          approvedAt: existing.approvedAt || '2026-09-26 16:45'
        };
      }
      if (!existing.evidenceAttachments) {
        existing.evidenceAttachments = [];
      }
      return existing;
    }

    if (targetType === 'TASK') {
      const task = this.tasks.find(t => t.id === targetId || t.taskCode === targetId) || this.tasks[0];
      const isAlreadyApproved =
        task.stageStatus === 'Approved' ||
        task.stageStatus === 'Completed' ||
        task.stageStatus === 'Dispatched';
      const isAlreadySubmitted =
        isAlreadyApproved || task.stageStatus === 'Submitted for Inspection';

      const initialEvidences: OnsiteEvidenceAttachment[] = [];
      (task.evidenceAttachments || []).forEach(att => initialEvidences.push(att));
      (task.supportingDocuments || []).forEach(doc => {
        if (doc.fileName.startsWith('System_Generated_QC_Checklist_')) return;
        const isVideo =
          (doc.fileType || '').toLowerCase().includes('video') ||
          /\.(mp4|mov|webm|avi|mkv)$/i.test(doc.fileName);
        const isImage =
          (doc.fileType || '').toLowerCase().includes('image') ||
          /\.(jpg|jpeg|png|webp|gif|bmp|svg)$/i.test(doc.fileName);
        initialEvidences.push({
          id: doc.id,
          fileName: doc.fileName,
          mediaKind: isVideo ? 'Video' : isImage ? 'Image' : 'Document',
          fileSizeBytes: isVideo ? 1800 * 1024 : 420 * 1024,
          fileSizeLabel: doc.fileSize || '420 KB',
          maxLimitLabel: isVideo ? '≤ 5 MB (Video)' : '≤ 1 MB (Image/Doc)',
          uploadedBy: doc.uploadedBy || 'Rohan Wijesinghe (Factory Manager)',
          uploadedAt: (doc.uploadedAt || '2026-09-26').slice(0, 10),
          dataUrl:
            doc.dataUrl ||
            'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=900&q=80'
        });
      });

      if (isAlreadySubmitted && initialEvidences.length === 0) {
        initialEvidences.push({
          id: `evd-init-${task.id}`,
          fileName: `${task.taskCode}_ShopFloor_Verification_Photo.jpg`,
          mediaKind: 'Image',
          fileSizeBytes: 380 * 1024,
          fileSizeLabel: '380 KB',
          maxLimitLabel: '≤ 1 MB (Image/Doc)',
          uploadedBy: 'Rohan Wijesinghe (Factory Manager)',
          uploadedAt: '2026-09-26',
          dataUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=900&q=80'
        });
      }

      const state: TaskOrSubTaskQcState = {
        id: `qcs-task-${task.id}`,
        targetType: 'TASK',
        targetId: task.id,
        targetCode: task.taskCode,
        targetTitle: task.title,
        projectId: task.projectId,
        projectName: task.projectName,
        factoryId: task.factoryId,
        factoryName: task.factoryName,
        workPackageId: task.workPackageId,
        checklistItems: this.buildUniqueChecklistForTarget(
          'TASK',
          task.taskCode,
          task.title,
          task.assignedWorkflowName || task.operationStep,
          task.drawingNumber,
          isAlreadySubmitted
        ),
        evidenceAttachments: initialEvidences,
        systemChecklistGenerated: isAlreadySubmitted,
        systemChecklistControlNo: isAlreadySubmitted ? `SYS-QCL-${task.taskCode}` : undefined,
        systemChecklistUploadedFileName: isAlreadySubmitted
          ? `System_QC_Checklist_${task.taskCode}.pdf`
          : undefined,
        systemChecklistUploadedAt: isAlreadySubmitted ? '2026-09-26 14:20' : undefined,
        submittedByFactoryManagerName: isAlreadySubmitted
          ? 'Rohan Wijesinghe (@rohan.factory | ID: usr-fac-01)'
          : undefined,
        submittedByFactoryManagerId: isAlreadySubmitted ? 'usr-fac-01' : undefined,
        submittedAt: isAlreadySubmitted ? '2026-09-26 14:20' : undefined,
        factoryManagerApproval: isAlreadySubmitted
          ? {
              isApproved: true,
              approvedByName: 'Rohan Wijesinghe',
              approvedByUserId: 'usr-fac-01',
              approvedAt: '2026-09-26 14:20'
            }
          : undefined,
        pmOrAdminApproval: isAlreadyApproved
          ? {
              isApproved: true,
              approvedByName: 'Alexander Vance',
              approvedByUserId: 'usr-admin-01 (EMP-001)',
              approvedAt: '2026-09-26 16:45'
            }
          : undefined,
        qcStatus: isAlreadyApproved
          ? 'Approved by PM/Admin'
          : isAlreadySubmitted
          ? 'Submitted by FM (Pending PM/Admin Approval)'
          : 'Not Started',
        approvedByName: isAlreadyApproved ? 'Alexander Vance' : undefined,
        approvedByUsername: isAlreadyApproved ? 'superadmin' : undefined,
        approvedByUserId: isAlreadyApproved ? 'usr-admin-01 (EMP-001)' : undefined,
        approvedByRole: isAlreadyApproved ? 'Project Manager / Admin' : undefined,
        approvedAt: isAlreadyApproved ? '2026-09-26 16:45' : undefined
      };

      map[key] = state;
      this.saveTaskSubTaskQcStatesMap();
      return state;
    }

    // SUB_TASK
    let foundSub: FactoryTaskSubTask | undefined;
    let parentTask: FactoryExecutionTask = this.tasks[0];
    for (const t of this.tasks) {
      const st = (t.subTasks || []).find(s => s.id === targetId || s.subTaskCode === targetId);
      if (st) {
        foundSub = st;
        parentTask = t;
        break;
      }
    }

    const sub = foundSub || {
      id: targetId,
      subTaskCode: targetId,
      parentTaskId: parentTask.id,
      parentTaskCode: parentTask.taskCode,
      projectId: parentTask.projectId,
      factoryId: parentTask.factoryId,
      workPackageId: parentTask.workPackageId,
      title: 'Sub-Task Execution',
      assignedPersonName: 'Operator',
      assignedMachineName: 'CNC Machine',
      workflowName: 'Standard Workflow',
      plannedQty: 10,
      completedQty: 10,
      unit: 'Units',
      startDate: '2026-09-26',
      endDate: '2026-09-28',
      isCriticalPath: true,
      status: 'In Progress'
    };

    const isSubApproved = sub.status === 'Completed';
    const isSubSubmitted = isSubApproved || sub.status === 'QC Check';

    const subEvidences: OnsiteEvidenceAttachment[] = isSubSubmitted
      ? [
          {
            id: `evd-init-sub-${sub.id}`,
            fileName: `${sub.subTaskCode}_SubTask_Evidence_Photo.jpg`,
            mediaKind: 'Image',
            fileSizeBytes: 360 * 1024,
            fileSizeLabel: '360 KB',
            maxLimitLabel: '≤ 1 MB (Image/Doc)',
            uploadedBy: 'Rohan Wijesinghe (Factory Manager)',
            uploadedAt: '2026-09-26',
            dataUrl:
              'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=900&q=80'
          }
        ]
      : [];

    const subState: TaskOrSubTaskQcState = {
      id: `qcs-sub-${sub.id}`,
      targetType: 'SUB_TASK',
      targetId: sub.id,
      targetCode: sub.subTaskCode,
      targetTitle: sub.title,
      parentTaskId: parentTask.id,
      parentTaskCode: parentTask.taskCode,
      projectId: parentTask.projectId,
      projectName: parentTask.projectName,
      factoryId: parentTask.factoryId,
      factoryName: parentTask.factoryName,
      workPackageId: parentTask.workPackageId,
      checklistItems: this.buildUniqueChecklistForTarget(
        'SUB_TASK',
        sub.subTaskCode,
        sub.title,
        sub.workflowName,
        parentTask.drawingNumber,
        isSubSubmitted
      ),
      evidenceAttachments: subEvidences,
      systemChecklistGenerated: isSubSubmitted,
      systemChecklistControlNo: isSubSubmitted ? `SYS-QCL-${sub.subTaskCode}` : undefined,
      systemChecklistUploadedFileName: isSubSubmitted
        ? `System_QC_Checklist_${sub.subTaskCode}.pdf`
        : undefined,
      systemChecklistUploadedAt: isSubSubmitted ? '2026-09-26 15:00' : undefined,
      submittedByFactoryManagerName: isSubSubmitted
        ? 'Rohan Wijesinghe (@rohan.factory | ID: usr-fac-01)'
        : undefined,
      submittedByFactoryManagerId: isSubSubmitted ? 'usr-fac-01' : undefined,
      submittedAt: isSubSubmitted ? '2026-09-26 15:00' : undefined,
      factoryManagerApproval: isSubSubmitted
        ? {
            isApproved: true,
            approvedByName: 'Rohan Wijesinghe',
            approvedByUserId: 'usr-fac-01',
            approvedAt: '2026-09-26 15:00'
          }
        : undefined,
      pmOrAdminApproval: isSubApproved
        ? {
            isApproved: true,
            approvedByName: 'Alexander Vance',
            approvedByUserId: 'usr-admin-01 (EMP-001)',
            approvedAt: '2026-09-26 17:10'
          }
        : undefined,
      qcStatus: isSubApproved
        ? 'Approved by PM/Admin'
        : isSubSubmitted
        ? 'Submitted by FM (Pending PM/Admin Approval)'
        : 'Not Started',
      approvedByName: isSubApproved ? 'Alexander Vance' : undefined,
      approvedByUsername: isSubApproved ? 'superadmin' : undefined,
      approvedByUserId: isSubApproved ? 'usr-admin-01 (EMP-001)' : undefined,
      approvedByRole: isSubApproved ? 'Project Manager / Admin' : undefined,
      approvedAt: isSubApproved ? '2026-09-26 17:10' : undefined
    };

    map[key] = subState;
    this.saveTaskSubTaskQcStatesMap();
    return subState;
  }

  public getAllTaskAndSubTaskQcStates(
    factoryId?: string,
    projectId?: string
  ): TaskOrSubTaskQcState[] {
    const result: TaskOrSubTaskQcState[] = [];
    const matchingTasks = this.tasks.filter(t => {
      const facMatch = !factoryId || factoryId === 'ALL' || t.factoryId === factoryId;
      const prjMatch = !projectId || projectId === 'ALL' || t.projectId === projectId;
      return facMatch && prjMatch;
    });

    matchingTasks.forEach(t => {
      result.push(this.getTaskOrSubTaskQcState('TASK', t.id));
      (t.subTasks || []).forEach(st => {
        result.push(this.getTaskOrSubTaskQcState('SUB_TASK', st.id));
      });
    });

    return result;
  }

  public toggleQcChecklistItem(
    user: SecurityUser | null,
    targetType: 'TASK' | 'SUB_TASK',
    targetId: string,
    masterItemId: string
  ): TaskOrSubTaskQcState {
    if (!this.hasAtLeastOneEvidence(targetType, targetId)) {
      throw new Error(
        'Upload at least 1 evidence (Image/Document ≤ 1MB or Video ≤ 5MB) before checking or approving this checklist.'
      );
    }
    const state = this.getTaskOrSubTaskQcState(targetType, targetId);
    const actor = user?.fullName || 'Rohan Wijesinghe (Factory Manager)';
    const nowDate = new Date().toISOString().slice(0, 10);

    state.checklistItems = state.checklistItems.map(item => {
      if (item.masterItemId !== masterItemId) return item;
      const nextChecked = !item.checked;
      return {
        ...item,
        checked: nextChecked,
        checkedBy: nextChecked ? actor : undefined,
        checkedAt: nextChecked ? nowDate : undefined
      };
    });

    const checkedCount = state.checklistItems.filter(i => i.checked).length;
    if (checkedCount < state.checklistItems.length) {
      state.systemChecklistGenerated = false;
      state.submittedByFactoryManagerName = undefined;
      state.submittedAt = undefined;
      state.factoryManagerApproval = undefined;
      state.pmOrAdminApproval = undefined;
      state.approvedByName = undefined;
      state.approvedAt = undefined;
      state.qcStatus = checkedCount === 0 ? 'Not Started' : 'In Progress (FM Checking)';
    } else if (state.qcStatus !== 'Approved by PM/Admin') {
      state.qcStatus = state.systemChecklistGenerated
        ? 'Submitted by FM (Pending PM/Admin Approval)'
        : 'In Progress (FM Checking)';
    }

    this.taskSubTaskQcStates[`${targetType}:${targetId}`] = { ...state };
    this.saveTaskSubTaskQcStatesMap();
    return state;
  }

  public checkAllMasterQcChecklistItems(
    user: SecurityUser | null,
    targetType: 'TASK' | 'SUB_TASK',
    targetId: string
  ): TaskOrSubTaskQcState {
    if (!this.hasAtLeastOneEvidence(targetType, targetId)) {
      throw new Error(
        'Upload at least 1 evidence (Image/Document ≤ 1MB or Video ≤ 5MB) before checking or approving this task.'
      );
    }
    const state = this.getTaskOrSubTaskQcState(targetType, targetId);
    const actor = user?.fullName || 'Rohan Wijesinghe (Factory Manager)';
    const nowDate = new Date().toISOString().slice(0, 10);

    state.checklistItems = state.checklistItems.map(item => ({
      ...item,
      checked: true,
      checkedBy: actor,
      checkedAt: nowDate
    }));

    if (state.qcStatus === 'Not Started' || state.qcStatus === 'Rejected — Correction Required') {
      state.qcStatus = 'In Progress (FM Checking)';
    }

    this.taskSubTaskQcStates[`${targetType}:${targetId}`] = { ...state };
    this.saveTaskSubTaskQcStatesMap();
    return state;
  }

  public runAndUploadFactoryManagerQcInspection(
    user: SecurityUser | null,
    targetType: 'TASK' | 'SUB_TASK',
    targetId: string,
    uploadedFileName?: string
  ): TaskOrSubTaskQcState {
    if (!this.hasAtLeastOneEvidence(targetType, targetId)) {
      throw new Error(
        'Upload at least 1 evidence (Image/Document ≤ 1MB or Video ≤ 5MB) before checking or approving this task.'
      );
    }
    const state = this.checkAllMasterQcChecklistItems(user, targetType, targetId);
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const fmFullName = user?.fullName || 'Rohan Wijesinghe';
    const fmUsername = user?.username || 'rohan.factory';
    const fmUserId = user?.id || 'usr-fac-01';

    const controlNo = `SYS-QCL-${state.targetCode}`;
    const fileName =
      uploadedFileName || `System_Generated_QC_Checklist_${state.targetCode}.pdf`;

    state.systemChecklistGenerated = true;
    state.systemChecklistControlNo = controlNo;
    state.systemChecklistUploadedFileName = fileName;
    state.systemChecklistUploadedAt = nowStr;
    state.submittedByFactoryManagerName = `${fmFullName} (@${fmUsername} | ID: ${fmUserId})`;
    state.submittedByFactoryManagerId = fmUserId;
    state.submittedAt = nowStr;
    state.factoryManagerApproval = {
      isApproved: true,
      approvedByName: fmFullName,
      approvedByUserId: fmUserId,
      approvedAt: nowStr
    };
    state.pmOrAdminApproval = undefined;
    if (state.defectReport) {
      state.defectReport = {
        ...state.defectReport,
        resolvedByFactoryManager: true,
        resolvedAt: nowStr
      };
    }
    state.qcStatus = 'Submitted by FM (Pending PM/Admin Approval)';

    this.taskSubTaskQcStates[`${targetType}:${targetId}`] = { ...state };
    this.saveTaskSubTaskQcStatesMap();

    // Attach system-generated QC checklist to parent Task supportingDocuments & update stage
    const parentTaskId = targetType === 'TASK' ? targetId : state.parentTaskId || '';
    const task = this.tasks.find(t => t.id === parentTaskId || t.id === targetId);
    if (task) {
      const existingDocs = task.supportingDocuments || [];
      if (!existingDocs.some(d => d.fileName === fileName)) {
        task.supportingDocuments = [
          {
            id: `sdoc-qcl-${Date.now()}`,
            fileName,
            fileType: 'System QC Checklist PDF',
            docCategory: 'QC Photo / Video',
            fileSize: '340 KB (≤ 1 MB)',
            uploadedBy: `${fmFullName} (Factory Manager)`,
            uploadedAt: nowStr.slice(0, 10)
          },
          ...existingDocs
        ];
      }

      if (targetType === 'TASK') {
        if (task.completedQuantity === 0) {
          task.completedQuantity = task.plannedQuantity;
          task.remainingQuantity = 0;
        }
        task.stageStatus = 'Submitted for Inspection';

        const existingInsp = this.inspections.find(
          i => i.taskId === task.id && i.decision === 'Pending Inspection'
        );
        if (!existingInsp) {
          this.inspections.unshift({
            id: `finsp-qcl-${Date.now()}`,
            inspectionNo: `FIR-2026-${Math.floor(400 + Math.random() * 500)}`,
            inspectionType: 'Final Factory Acceptance Test (FAT)',
            itpReference: controlNo,
            projectId: task.projectId,
            projectName: task.projectName,
            factoryId: task.factoryId,
            factoryName: task.factoryName,
            workPackageId: task.workPackageId,
            taskId: task.id,
            taskCode: task.taskCode,
            requestedBy: `${fmFullName} (@${fmUsername})`,
            requestDate: nowStr.slice(0, 10),
            inspectorName: `${fmFullName} (Factory Manager)`,
            inspectionDate: nowStr.slice(0, 10),
            qtySubmitted: task.completedQuantity || task.plannedQuantity,
            qtyApproved: 0,
            qtyRejected: 0,
            qtyReworkRequired: 0,
            factoryManagerApproval: {
              isApproved: true,
              approvedByName: fmFullName,
              approvedByUserId: fmUserId,
              approvedAt: nowStr
            },
            checklistResults: state.checklistItems.map(ci => ({
              item: `${ci.code} — ${ci.parameter}`,
              standard: ci.standardSpecification,
              measured: 'Checked & Verified vs Unique Task QC Checklist',
              result: ci.checked ? 'Pass' : 'Fail'
            })),
            decision: 'Pending Inspection',
            defectDescription: `1st Step Approved by Factory Manager ${fmFullName} with ${this.getTaskOrSubTaskEvidences(targetType, targetId).length} evidence file(s). Awaiting PM/Admin 2nd Approval.`,
            audit: {
              createdBy: fmFullName,
              createdByRole: 'Factory Manager',
              createdAt: nowStr,
              updatedBy: fmFullName,
              updatedByRole: 'Factory Manager',
              updatedAt: nowStr,
              revision: 1,
              status: 'Pending Inspection',
              approvalHistory: []
            }
          });
          this.save(STORAGE_KEYS.INSPECTIONS, this.inspections);
        }
      } else {
        task.subTasks = (task.subTasks || []).map(st =>
          st.id === targetId ? { ...st, status: 'QC Check', completedQty: st.plannedQty } : st
        );
      }

      this.save(STORAGE_KEYS.TASKS, this.tasks);
    }

    this.recordAuditEntry(
      user,
      'DOCUMENT_GENERATED',
      targetType,
      targetId,
      `Factory Manager (${fmFullName} | ID: ${fmUserId}) verified evidences, checked all unique QC Checklist items and submitted [${fileName}]. Status: Pending PM/Admin Approval.`
    );

    return state;
  }

  public approveTaskOrSubTaskQcByPmOrAdmin(
    user: SecurityUser | null,
    targetType: 'TASK' | 'SUB_TASK',
    targetId: string,
    remarks = '2nd Approved by Project Manager / Admin after Factory Manager 1st Approval & Evidence Verification'
  ): TaskOrSubTaskQcState {
    if (!this.canApproveQualityInspection(user)) {
      throw new Error('Only Project Manager or Admin can grant 2nd Approval.');
    }

    if (!this.isFmChecklistCompletedAndApproved(targetType, targetId)) {
      throw new Error(
        'Factory Manager must upload at least 1 evidence, check all items, and approve first before Project Manager / Admin can approve.'
      );
    }

    const state = this.getTaskOrSubTaskQcState(targetType, targetId);
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const approverName = user?.fullName || 'Alexander Vance';
    const approverUsername = user?.username || 'superadmin';
    const approverUserId = `${user?.id || 'usr-admin-01'}${user?.employeeId ? ` (${user.employeeId})` : ' (EMP-001)'}`;
    const approverRole = user?.roleName || 'Project Manager / Admin';

    state.qcStatus = 'Approved by PM/Admin';
    state.approvedByName = approverName;
    state.approvedByUsername = approverUsername;
    state.approvedByUserId = approverUserId;
    state.approvedByRole = approverRole;
    state.approvedAt = nowStr;
    state.pmOrAdminApproval = {
      isApproved: true,
      approvedByName: approverName,
      approvedByUserId: approverUserId,
      approvedAt: nowStr
    };

    this.taskSubTaskQcStates[`${targetType}:${targetId}`] = { ...state };
    this.saveTaskSubTaskQcStatesMap();

    // Update underlying Task / Sub-Task & linked Quality Inspection record
    if (targetType === 'TASK') {
      const task = this.tasks.find(t => t.id === targetId);
      if (task) {
        task.stageStatus = 'Approved';
        if (task.completedQuantity === 0) {
          task.completedQuantity = task.plannedQuantity;
          task.remainingQuantity = 0;
        }
        this.save(STORAGE_KEYS.TASKS, this.tasks);

        const pendingInsp = this.inspections.find(i => i.taskId === task.id);
        if (pendingInsp) {
          pendingInsp.decision = 'Approved';
          pendingInsp.qtyApproved = pendingInsp.qtySubmitted || task.plannedQuantity;
          pendingInsp.pmOrAdminApproval = {
            isApproved: true,
            approvedByName: approverName,
            approvedByUserId: approverUserId,
            approvedAt: nowStr
          };
          pendingInsp.clientOrConsultantSignOff = `${approverName} (@${approverUsername} | ID: ${approverUserId}) on ${nowStr}`;
          this.save(STORAGE_KEYS.INSPECTIONS, this.inspections);
          this.approveFactoryRecord(user, 'QUALITY_INSPECTION', pendingInsp.id, remarks);
        } else {
          const createdInsp = this.recordQualityInspection(user, {
            taskId: task.id,
            decision: 'Approved',
            qtySubmitted: task.plannedQuantity,
            qtyApproved: task.plannedQuantity,
            defectDescription: remarks
          });
          this.approveFactoryRecord(user, 'QUALITY_INSPECTION', createdInsp.id, remarks);
        }
      }
      this.approveFactoryRecord(user, 'TASK', targetId, remarks);
    } else {
      this.tasks.forEach(t => {
        t.subTasks = (t.subTasks || []).map(st =>
          st.id === targetId ? { ...st, status: 'Completed', completedQty: st.plannedQty } : st
        );
      });
      this.save(STORAGE_KEYS.TASKS, this.tasks);
      this.approveFactoryRecord(user, 'SUB_TASK', targetId, remarks);
    }

    return state;
  }

  public rejectTaskOrSubTaskQcByPmOrAdmin(
    user: SecurityUser | null,
    targetType: 'TASK' | 'SUB_TASK',
    targetId: string,
    payload: {
      reason: string;
      instructions?: string;
      correctionInstructions?: string;
      attachmentFileName?: string;
      attachmentFileSize?: string;
      attachmentDataUrl?: string;
      attachmentSizeLabel?: string;
      attachmentMediaKind?: 'Image' | 'Document' | 'Video';
    }
  ): TaskOrSubTaskQcState {
    if (!this.canApproveQualityInspection(user)) {
      throw new Error('Only Project Manager or Admin can reject and issue a Defect Report.');
    }
    const resolvedInstructions = (payload.instructions || payload.correctionInstructions || '').trim();
    if (!payload.reason?.trim() || !resolvedInstructions) {
      throw new Error('Rejection reason and correction instructions are required.');
    }

    const state = this.getTaskOrSubTaskQcState(targetType, targetId);
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const reviewerName = user?.fullName || 'Alexander Vance';
    const reviewerUsername = user?.username || 'superadmin';
    const reviewerUserId = `${user?.id || 'usr-admin-01'}${user?.employeeId ? ` (${user.employeeId})` : ' (EMP-001)'}`;
    const reviewerRole = user?.roleName || 'Project Manager / Admin';
    const reportNo = `DEF-${state.targetCode}-${Math.floor(100 + Math.random() * 899)}`;

    const defRep: TaskOrSubTaskDefectReport = {
      reportNo,
      rejectedByName: reviewerName,
      rejectedByUsername: reviewerUsername,
      rejectedByUserId: reviewerUserId,
      rejectedByRole: reviewerRole,
      rejectedAt: nowStr,
      reason: payload.reason.trim(),
      instructions: resolvedInstructions,
      correctionInstructions: resolvedInstructions,
      attachmentFileName: payload.attachmentFileName || `Defect_Report_${reportNo}.txt`,
      attachmentDataUrl: payload.attachmentDataUrl,
      attachmentSizeLabel: payload.attachmentSizeLabel || payload.attachmentFileSize || '240 KB (≤ 1 MB)',
      attachmentMediaKind: payload.attachmentMediaKind || 'Document',
      resolvedByFactoryManager: false
    };

    state.defectReport = defRep;
    state.latestDefectReport = defRep;

    state.qcStatus = 'Rejected — Correction Required';
    state.factoryManagerApproval = undefined;
    state.pmOrAdminApproval = undefined;
    state.systemChecklistGenerated = false;
    state.approvedByName = undefined;
    state.approvedAt = undefined;

    this.taskSubTaskQcStates[`${targetType}:${targetId}`] = { ...state };
    this.saveTaskSubTaskQcStatesMap();

    if (targetType === 'TASK') {
      const task = this.tasks.find(t => t.id === targetId);
      if (task) {
        task.stageStatus = 'Rework Required';
        task.reworkQuantity = (task.reworkQuantity || 0) + 1;
        this.save(STORAGE_KEYS.TASKS, this.tasks);

        const pendingInsp = this.inspections.find(i => i.taskId === task.id);
        if (pendingInsp) {
          pendingInsp.decision = 'Rework Required';
          pendingInsp.qtyReworkRequired = 1;
          pendingInsp.factoryManagerApproval = undefined;
          pendingInsp.defectDescription = `[${reportNo}] Rejected by ${reviewerName}: ${payload.reason.trim()} | Fix Instructions: ${resolvedInstructions}`;
          pendingInsp.correctiveActionPlan = resolvedInstructions;
          this.save(STORAGE_KEYS.INSPECTIONS, this.inspections);
        }
      }
    } else {
      this.tasks.forEach(t => {
        t.subTasks = (t.subTasks || []).map(st =>
          st.id === targetId ? { ...st, status: 'In Progress' } : st
        );
      });
      this.save(STORAGE_KEYS.TASKS, this.tasks);
    }

    this.recordAuditEntry(
      user,
      'REVISED',
      targetType,
      targetId,
      `Rejected by ${reviewerName} (${reviewerRole}) — Defect Report ${reportNo}. Reason: ${payload.reason.trim()} | Correction Instructions: ${resolvedInstructions}`
    );

    return state;
  }

  public downloadDefectReport(
    targetTypeOrDefect: 'TASK' | 'SUB_TASK' | TaskOrSubTaskDefectReport,
    maybeTargetId?: string
  ) {
    let def: TaskOrSubTaskDefectReport | undefined;
    let targetType = 'TASK / SUB_TASK';
    let targetCode = 'DEF';
    let targetTitle = 'Defect Report';
    let projectName = 'Factory Project';
    let factoryName = 'Execution Facility';

    if (typeof targetTypeOrDefect === 'object' && targetTypeOrDefect !== null) {
      def = targetTypeOrDefect;
      targetCode = def.reportNo;
    } else if (maybeTargetId) {
      const state = this.getTaskOrSubTaskQcState(targetTypeOrDefect as 'TASK' | 'SUB_TASK', maybeTargetId);
      def = state.defectReport || state.latestDefectReport;
      targetType = state.targetType;
      targetCode = state.targetCode;
      targetTitle = state.targetTitle;
      projectName = state.projectName;
      factoryName = state.factoryName;
    }

    if (!def) {
      throw new Error('No Defect Report found for this record.');
    }
    const reportText = [
      '====================================================================',
      `OFFICIAL DEFECT & CORRECTION REPORT — ${def.reportNo}`,
      '====================================================================',
      `Target Type       : ${targetType}`,
      `Target Code       : ${targetCode}`,
      `Target Title      : ${targetTitle}`,
      `Project           : ${projectName}`,
      `Factory           : ${factoryName}`,
      '--------------------------------------------------------------------',
      `Rejected By       : ${def.rejectedByName} (@${def.rejectedByUsername})`,
      `Authority / Role  : ${def.rejectedByRole}`,
      `Reviewer ID       : ${def.rejectedByUserId}`,
      `Rejected Date/Time: ${def.rejectedAt}`,
      '--------------------------------------------------------------------',
      '1. REJECTION REASON / DEFECT FINDINGS:',
      def.reason,
      '',
      '2. MANDATORY CORRECTION INSTRUCTIONS FOR FACTORY MANAGER:',
      def.instructions,
      '--------------------------------------------------------------------',
      'REQUIRED ACTION BY FACTORY MANAGER:',
      '- Download and review this Defect Report.',
      '- Rectify all listed errors on the factory floor.',
      '- Upload corrected evidence (Image/Document ≤ 1MB or Video ≤ 5MB).',
      '- Re-check all unique checklist items and submit for PM/Admin approval.',
      '===================================================================='
    ].join('\n');

    this.downloadMediaOrFile(
      def.attachmentFileName || `Defect_Report_${def.reportNo}.txt`,
      def.attachmentDataUrl,
      reportText
    );
  }

  // ============================================================================
  // 15. FACTORY & PROJECT SUPERVISING ASSIGNMENTS, PROCUREMENT CHAIN, HR/PAYROLL & FINANCE/CONTRACTS
  // ============================================================================
  private initFactoryErpAndSupervisors() {
    const seedSupervisors: FactoryProjectSupervisorAssignment[] = [
      {
        id: 'fsa-01',
        assignmentCode: 'FSA-2026-001',
        userId: 'usr-10',
        employeeId: 'EMP-010',
        username: 'roshan.desilva',
        fullName: 'Roshan De Silva',
        roleName: 'Factory Manager',
        supervisingRole: 'Factory Manager',
        department: 'FACTORY_PRODUCTION',
        email: 'roshan.desilva@innovista.lk',
        phone: '+94 77 210 4401',
        factoryId: 'fac-inv-01',
        factoryName: 'Innovista Central Facade & Glazing Plant',
        ownershipType: 'Innovista Owned',
        projectId: 'PRJ-2026-001',
        projectName: 'Sirius Mall Storefront',
        workPackageId: 'fwp-01',
        hasFactoryManagerAuthority: true,
        permissions: {
          canManageTasksAndChecklists: true,
          canManageQualityAndNcr: true,
          canManageProcurement: true,
          canManageHrAndPayroll: true,
          canManageFinanceAndInvoices: true,
          canManageContractsAndAgreements: true
        },
        assignedBy: 'Alexander Vance (Super Administrator)',
        assignedAt: '2026-09-10',
        status: 'Active'
      },
      {
        id: 'fsa-02',
        assignmentCode: 'FSA-2026-002',
        userId: 'usr-03',
        employeeId: 'EMP-003',
        username: 'nuwan.perera',
        fullName: 'Eng. Nuwan Perera',
        roleName: 'Senior Facade Engineer',
        supervisingRole: 'Project Factory Engineer',
        department: 'ENGINEERING',
        email: 'nuwan.perera@innovista.lk',
        phone: '+94 77 312 8820',
        factoryId: 'fac-inv-01',
        factoryName: 'Innovista Central Facade & Glazing Plant',
        ownershipType: 'Innovista Owned',
        projectId: 'PRJ-2026-001',
        projectName: 'Sirius Mall Storefront',
        workPackageId: 'fwp-01',
        hasFactoryManagerAuthority: true,
        permissions: {
          canManageTasksAndChecklists: true,
          canManageQualityAndNcr: true,
          canManageProcurement: true,
          canManageHrAndPayroll: false,
          canManageFinanceAndInvoices: false,
          canManageContractsAndAgreements: true
        },
        assignedBy: 'Marcus Sterling (Senior Project Manager)',
        assignedAt: '2026-09-12',
        status: 'Active'
      },
      {
        id: 'fsa-03',
        assignmentCode: 'FSA-2026-003',
        userId: 'usr-04',
        employeeId: 'EMP-004',
        username: 'priya.nair',
        fullName: 'Priya Nair',
        roleName: 'QA/QC Inspector',
        supervisingRole: 'QA/QC Inspector',
        department: 'QUALITY',
        email: 'priya.nair@innovista.lk',
        phone: '+94 77 450 9912',
        factoryId: 'fac-inv-01',
        factoryName: 'Innovista Central Facade & Glazing Plant',
        ownershipType: 'Innovista Owned',
        projectId: 'PRJ-2026-001',
        projectName: 'Sirius Mall Storefront',
        workPackageId: 'fwp-01',
        hasFactoryManagerAuthority: true,
        permissions: {
          canManageTasksAndChecklists: true,
          canManageQualityAndNcr: true,
          canManageProcurement: true,
          canManageHrAndPayroll: false,
          canManageFinanceAndInvoices: false,
          canManageContractsAndAgreements: false
        },
        assignedBy: 'Marcus Sterling (Senior Project Manager)',
        assignedAt: '2026-09-12',
        status: 'Active'
      },
      {
        id: 'fsa-04',
        assignmentCode: 'FSA-2026-004',
        userId: 'usr-07',
        employeeId: 'EMP-007',
        username: 'tariq.procurement',
        fullName: 'Tariq Al-Mansoor (Procurement)',
        roleName: 'Procurement Manager',
        supervisingRole: 'Procurement Officer',
        department: 'PROCUREMENT_SUPPLY_CHAIN',
        email: 'procurement@innovista.lk',
        phone: '+94 77 880 3310',
        factoryId: 'fac-inv-01',
        factoryName: 'Innovista Central Facade & Glazing Plant',
        ownershipType: 'Innovista Owned',
        projectId: 'PRJ-2026-001',
        projectName: 'Sirius Mall Storefront',
        workPackageId: 'fwp-01',
        hasFactoryManagerAuthority: true,
        permissions: {
          canManageTasksAndChecklists: false,
          canManageQualityAndNcr: true,
          canManageProcurement: true,
          canManageHrAndPayroll: false,
          canManageFinanceAndInvoices: true,
          canManageContractsAndAgreements: true
        },
        assignedBy: 'Alexander Vance (Super Administrator)',
        assignedAt: '2026-09-14',
        status: 'Active'
      },
      {
        id: 'fsa-05',
        assignmentCode: 'FSA-2026-005',
        userId: 'usr-05',
        employeeId: 'EMP-005',
        username: 'victoria.chen',
        fullName: 'Victoria Chen',
        roleName: 'Finance Manager',
        supervisingRole: 'Finance & Accounting Officer',
        department: 'FINANCE_ACCOUNTING',
        email: 'victoria.chen@innovista.lk',
        phone: '+94 77 610 1122',
        factoryId: 'fac-inv-01',
        factoryName: 'Innovista Central Facade & Glazing Plant',
        ownershipType: 'Innovista Owned',
        projectId: 'PRJ-2026-001',
        projectName: 'Sirius Mall Storefront',
        workPackageId: 'fwp-01',
        hasFactoryManagerAuthority: true,
        permissions: {
          canManageTasksAndChecklists: false,
          canManageQualityAndNcr: false,
          canManageProcurement: true,
          canManageHrAndPayroll: true,
          canManageFinanceAndInvoices: true,
          canManageContractsAndAgreements: true
        },
        assignedBy: 'Alexander Vance (Super Administrator)',
        assignedAt: '2026-09-14',
        status: 'Active'
      },
      {
        id: 'fsa-06',
        assignmentCode: 'FSA-2026-006',
        userId: 'usr-11',
        employeeId: 'EXT-101',
        username: 'tariq.partner',
        fullName: 'Tariq Al-Mansoor',
        roleName: 'External Factory Manager',
        supervisingRole: 'Partner Factory Representative',
        department: 'FACTORY_PRODUCTION',
        email: 'tariq@apex-steel.lk',
        phone: '+94 77 901 5520',
        factoryId: 'fac-ext-01',
        factoryName: 'Apex Structural Steel & Coating Works',
        ownershipType: 'Partnered Factory',
        projectId: 'PRJ-2026-002',
        projectName: 'Port City Commercial Tower',
        workPackageId: 'fwp-03',
        hasFactoryManagerAuthority: true,
        permissions: {
          canManageTasksAndChecklists: true,
          canManageQualityAndNcr: true,
          canManageProcurement: true,
          canManageHrAndPayroll: false,
          canManageFinanceAndInvoices: true,
          canManageContractsAndAgreements: true
        },
        assignedBy: 'Marcus Sterling (Senior Project Manager)',
        assignedAt: '2026-09-15',
        status: 'Active'
      }
    ];

    const seedProcurement: FactoryProcurementRecord[] = [
      // Owned Factory (fac-inv-01) — Full 7-step chain for PRJ-2026-001
      {
        id: 'fpr-01',
        docCode: 'FAC-RQ-2026-101',
        stageType: 'RQ',
        factoryId: 'fac-inv-01',
        factoryName: 'Innovista Central Facade & Glazing Plant',
        ownershipType: 'Innovista Owned',
        projectId: 'PRJ-2026-001',
        projectName: 'Sirius Mall Storefront',
        workPackageId: 'fwp-01',
        supplierOrPartnerName: 'Alumex Extrusions PLC',
        linkedRefCode: 'BOQ-101 / FWP-2026-001',
        title: 'Material Requisition — 6063-T6 Curtain Wall Mullion Profiles',
        itemSummary: 'Heavy-duty 150x65mm Thermal Break Mullions (PVDF RAL 7016)',
        quantity: 240,
        acceptedQty: 240,
        rejectedQty: 0,
        unit: 'Bars (6m)',
        unitRate: 18500,
        totalAmount: 4440000,
        date: '2026-09-14',
        status: 'Approved',
        inspectorOrOfficer: 'Eng. Nuwan Perera',
        remarks: 'Approved for immediate shop-floor CNC release under Project Sirius Mall Storefront.',
        updatedAt: '2026-09-14'
      },
      {
        id: 'fpr-02',
        docCode: 'FAC-QT-2026-101',
        stageType: 'QUOTATION',
        factoryId: 'fac-inv-01',
        factoryName: 'Innovista Central Facade & Glazing Plant',
        ownershipType: 'Innovista Owned',
        projectId: 'PRJ-2026-001',
        projectName: 'Sirius Mall Storefront',
        workPackageId: 'fwp-01',
        supplierOrPartnerName: 'Alumex Extrusions PLC',
        linkedRefCode: 'FAC-RQ-2026-101',
        title: 'Supplier Quotation — Architectural Extrusions & Thermal Strips',
        itemSummary: '6063-T6 Mullions + Polyamide PA66 GF25 Thermal Break Strips',
        quantity: 240,
        acceptedQty: 240,
        rejectedQty: 0,
        unit: 'Bars (6m)',
        unitRate: 18200,
        totalAmount: 4368000,
        date: '2026-09-16',
        status: 'Approved',
        inspectorOrOfficer: 'Tariq Al-Mansoor (Procurement)',
        remarks: 'Negotiated 30-day credit & mill test certificate EN 10204 3.1 inclusion.',
        updatedAt: '2026-09-16'
      },
      {
        id: 'fpr-03',
        docCode: 'FAC-PO-2026-101',
        stageType: 'PO',
        factoryId: 'fac-inv-01',
        factoryName: 'Innovista Central Facade & Glazing Plant',
        ownershipType: 'Innovista Owned',
        projectId: 'PRJ-2026-001',
        projectName: 'Sirius Mall Storefront',
        workPackageId: 'fwp-01',
        supplierOrPartnerName: 'Alumex Extrusions PLC',
        linkedRefCode: 'FAC-QT-2026-101',
        title: 'Purchase Order — Curtain Wall Extrusion Batch #A1',
        itemSummary: '240 Bars 6063-T6 Mullion Profiles delivered to Ragama Plant Bay A',
        quantity: 240,
        acceptedQty: 240,
        rejectedQty: 0,
        unit: 'Bars (6m)',
        unitRate: 18200,
        totalAmount: 4368000,
        date: '2026-09-18',
        status: 'Ordered',
        inspectorOrOfficer: 'Tariq Al-Mansoor (Procurement)',
        remarks: 'PO issued and linked to Project PRJ-2026-001 & Factory FAC-INV-01.',
        updatedAt: '2026-09-18'
      },
      {
        id: 'fpr-04',
        docCode: 'FAC-GRN-2026-101',
        stageType: 'GRN',
        factoryId: 'fac-inv-01',
        factoryName: 'Innovista Central Facade & Glazing Plant',
        ownershipType: 'Innovista Owned',
        projectId: 'PRJ-2026-001',
        projectName: 'Sirius Mall Storefront',
        workPackageId: 'fwp-01',
        supplierOrPartnerName: 'Alumex Extrusions PLC',
        linkedRefCode: 'FAC-PO-2026-101',
        title: 'Goods Received Note — Extrusion Delivery at Factory Store',
        itemSummary: '240 Bars received; 234 Bars intact, 6 Bars flagged for surface scratch check',
        quantity: 240,
        acceptedQty: 234,
        rejectedQty: 6,
        unit: 'Bars (6m)',
        unitRate: 18200,
        totalAmount: 4258800,
        date: '2026-09-21',
        status: 'Received (GRN)',
        inspectorOrOfficer: 'Roshan De Silva (Factory Manager)',
        remarks: 'Stored in Rack R-04. 6 bars quarantined for QC inspection.',
        updatedAt: '2026-09-21'
      },
      {
        id: 'fpr-05',
        docCode: 'FAC-IQC-2026-101',
        stageType: 'QC_INSPECTION',
        factoryId: 'fac-inv-01',
        factoryName: 'Innovista Central Facade & Glazing Plant',
        ownershipType: 'Innovista Owned',
        projectId: 'PRJ-2026-001',
        projectName: 'Sirius Mall Storefront',
        workPackageId: 'fwp-01',
        supplierOrPartnerName: 'Alumex Extrusions PLC',
        linkedRefCode: 'FAC-GRN-2026-101',
        title: 'Incoming QC Inspection — PVDF Coating DFT & Alloy Webster Hardness',
        itemSummary: 'Elcometer DFT ≥ 65µm & Webster Hardness ≥ 12 HW verified on 234 bars',
        quantity: 240,
        acceptedQty: 234,
        rejectedQty: 6,
        unit: 'Bars (6m)',
        unitRate: 18200,
        totalAmount: 4258800,
        date: '2026-09-22',
        status: 'QC Passed',
        inspectorOrOfficer: 'Priya Nair (QA/QC Inspector)',
        remarks: '234 bars released to CNC Line; NCR raised for 6 scratched bars.',
        updatedAt: '2026-09-22'
      },
      {
        id: 'fpr-06',
        docCode: 'FAC-NCR-2026-101',
        stageType: 'NCR_REPORT',
        factoryId: 'fac-inv-01',
        factoryName: 'Innovista Central Facade & Glazing Plant',
        ownershipType: 'Innovista Owned',
        projectId: 'PRJ-2026-001',
        projectName: 'Sirius Mall Storefront',
        workPackageId: 'fwp-01',
        supplierOrPartnerName: 'Alumex Extrusions PLC',
        linkedRefCode: 'FAC-IQC-2026-101',
        title: 'Non-Conformance Report — Transit Coating Scratches on 6 Mullion Bars',
        itemSummary: 'Deep transit abrasion exceeding Qualicoat Class 2 acceptance criteria',
        quantity: 6,
        acceptedQty: 0,
        rejectedQty: 6,
        unit: 'Bars (6m)',
        unitRate: 18200,
        totalAmount: 109200,
        date: '2026-09-22',
        status: 'NCR Open',
        inspectorOrOfficer: 'Priya Nair (QA/QC Inspector)',
        remarks: 'Tagged with Red Hold Label in Quarantine Bay; Return note initiated.',
        updatedAt: '2026-09-22'
      },
      {
        id: 'fpr-07',
        docCode: 'FAC-RET-2026-101',
        stageType: 'RETURN',
        factoryId: 'fac-inv-01',
        factoryName: 'Innovista Central Facade & Glazing Plant',
        ownershipType: 'Innovista Owned',
        projectId: 'PRJ-2026-001',
        projectName: 'Sirius Mall Storefront',
        workPackageId: 'fwp-01',
        supplierOrPartnerName: 'Alumex Extrusions PLC',
        linkedRefCode: 'FAC-NCR-2026-101',
        title: 'Vendor Material Return & Debit Note — 6 Rejected Mullion Bars',
        itemSummary: 'Returned to vendor for free-of-charge replacement & credit adjustment',
        quantity: 6,
        acceptedQty: 0,
        rejectedQty: 6,
        unit: 'Bars (6m)',
        unitRate: 18200,
        totalAmount: 109200,
        date: '2026-09-23',
        status: 'Returned to Vendor',
        inspectorOrOfficer: 'Roshan De Silva (Factory Manager)',
        remarks: 'Gate pass GP-RET-09 issued; replacement batch scheduled.',
        updatedAt: '2026-09-23'
      },
      // Other / Partnered Factory (fac-ext-01) — Procurement Chain for PRJ-2026-002
      {
        id: 'fpr-08',
        docCode: 'FAC-RQ-2026-201',
        stageType: 'RQ',
        factoryId: 'fac-ext-01',
        factoryName: 'Apex Structural Steel & Coating Works',
        ownershipType: 'Partnered Factory',
        projectId: 'PRJ-2026-002',
        projectName: 'Port City Commercial Tower',
        workPackageId: 'fwp-03',
        supplierOrPartnerName: 'Ceylon Heavy Steel Imports Ltd',
        linkedRefCode: 'FWP-2026-003',
        title: 'Partner Factory Requisition — S355JR Steel Spider Brackets & Embeds',
        itemSummary: 'Laser-cut 20mm S355JR structural steel gussets & hot-dip galvanized embeds',
        quantity: 85,
        acceptedQty: 85,
        rejectedQty: 0,
        unit: 'Sets',
        unitRate: 42000,
        totalAmount: 3570000,
        date: '2026-09-17',
        status: 'Approved',
        inspectorOrOfficer: 'Tariq Al-Mansoor',
        remarks: 'Project-specific requisition managed via Partner Factory Portal.',
        updatedAt: '2026-09-17'
      },
      {
        id: 'fpr-09',
        docCode: 'FAC-PO-2026-201',
        stageType: 'PO',
        factoryId: 'fac-ext-01',
        factoryName: 'Apex Structural Steel & Coating Works',
        ownershipType: 'Partnered Factory',
        projectId: 'PRJ-2026-002',
        projectName: 'Port City Commercial Tower',
        workPackageId: 'fwp-03',
        supplierOrPartnerName: 'Apex Structural Steel & Coating Works',
        linkedRefCode: 'FAC-RQ-2026-201',
        title: 'Subcontract Purchase Order — Steel Canopy & Bracket Fabrication',
        itemSummary: 'Full fabrication, NDT ultrasonic weld testing & HDG coating for 85 sets',
        quantity: 85,
        acceptedQty: 85,
        rejectedQty: 0,
        unit: 'Sets',
        unitRate: 42000,
        totalAmount: 3570000,
        date: '2026-09-19',
        status: 'Approved',
        inspectorOrOfficer: 'Tariq Al-Mansoor (Procurement)',
        remarks: 'Linked to Subcontract Agreement FAC-CNT-2026-402.',
        updatedAt: '2026-09-19'
      },
      {
        id: 'fpr-10',
        docCode: 'FAC-GRN-2026-201',
        stageType: 'GRN',
        factoryId: 'fac-ext-01',
        factoryName: 'Apex Structural Steel & Coating Works',
        ownershipType: 'Partnered Factory',
        projectId: 'PRJ-2026-002',
        projectName: 'Port City Commercial Tower',
        workPackageId: 'fwp-03',
        supplierOrPartnerName: 'Apex Structural Steel & Coating Works',
        linkedRefCode: 'FAC-PO-2026-201',
        title: 'Partner Factory GRN & Lot Receipt — Batch 1 Steel Brackets',
        itemSummary: '50 Sets completed, galvanized & received for joint QC inspection',
        quantity: 50,
        acceptedQty: 48,
        rejectedQty: 2,
        unit: 'Sets',
        unitRate: 42000,
        totalAmount: 2016000,
        date: '2026-09-24',
        status: 'Received (GRN)',
        inspectorOrOfficer: 'Priya Nair (QA/QC Inspector)',
        remarks: '48 sets passed magnetic particle & zinc micron check; 2 sets sent for touch-up.',
        updatedAt: '2026-09-24'
      }
    ];

    const seedHrPayroll: FactoryHrPayrollRecord[] = [
      {
        id: 'fhr-01',
        payrollCode: 'FAC-PAY-2026-09-01',
        factoryId: 'fac-inv-01',
        factoryName: 'Innovista Central Facade & Glazing Plant',
        ownershipType: 'Innovista Owned',
        projectId: 'PRJ-2026-001',
        projectName: 'Sirius Mall Storefront',
        workPackageId: 'fwp-01',
        employeeId: 'EMP-010',
        employeeName: 'Roshan De Silva',
        roleOrTrade: 'Factory Manager',
        department: 'Factory Production',
        payPeriod: '2026-09',
        daysWorked: 26,
        overtimeHours: 14,
        basicSalary: 185000,
        overtimePay: 24500,
        projectAllowance: 35000,
        epfEtfDeduction: 14800,
        netPay: 229700,
        attendanceRatePct: 100,
        status: 'Approved',
        updatedBy: 'Victoria Chen (Finance Manager)',
        updatedAt: '2026-09-25'
      },
      {
        id: 'fhr-02',
        payrollCode: 'FAC-PAY-2026-09-02',
        factoryId: 'fac-inv-01',
        factoryName: 'Innovista Central Facade & Glazing Plant',
        ownershipType: 'Innovista Owned',
        projectId: 'PRJ-2026-001',
        projectName: 'Sirius Mall Storefront',
        workPackageId: 'fwp-01',
        employeeId: 'EMP-003',
        employeeName: 'Eng. Nuwan Perera',
        roleOrTrade: 'Project Factory Engineer',
        department: 'Engineering & CNC',
        payPeriod: '2026-09',
        daysWorked: 25,
        overtimeHours: 18,
        basicSalary: 165000,
        overtimePay: 29700,
        projectAllowance: 30000,
        epfEtfDeduction: 13200,
        netPay: 211500,
        attendanceRatePct: 96,
        status: 'Approved',
        updatedBy: 'Victoria Chen (Finance Manager)',
        updatedAt: '2026-09-25'
      },
      {
        id: 'fhr-03',
        payrollCode: 'FAC-PAY-2026-09-03',
        factoryId: 'fac-inv-01',
        factoryName: 'Innovista Central Facade & Glazing Plant',
        ownershipType: 'Innovista Owned',
        projectId: 'PRJ-2026-001',
        projectName: 'Sirius Mall Storefront',
        workPackageId: 'fwp-01',
        employeeId: 'EMP-004',
        employeeName: 'Priya Nair',
        roleOrTrade: 'QA/QC Inspector',
        department: 'Quality Control',
        payPeriod: '2026-09',
        daysWorked: 26,
        overtimeHours: 12,
        basicSalary: 140000,
        overtimePay: 18000,
        projectAllowance: 25000,
        epfEtfDeduction: 11200,
        netPay: 171800,
        attendanceRatePct: 100,
        status: 'Verified by FM',
        updatedBy: 'Roshan De Silva (Factory Manager)',
        updatedAt: '2026-09-26'
      },
      {
        id: 'fhr-04',
        payrollCode: 'FAC-PAY-2026-09-04',
        factoryId: 'fac-inv-01',
        factoryName: 'Innovista Central Facade & Glazing Plant',
        ownershipType: 'Innovista Owned',
        projectId: 'PRJ-2026-001',
        projectName: 'Sirius Mall Storefront',
        workPackageId: 'fwp-01',
        employeeId: 'EMP-104',
        employeeName: 'Kasun Mendis',
        roleOrTrade: 'Lead 5-Axis CNC Operator',
        department: 'Shop Floor Fabrication',
        payPeriod: '2026-09',
        daysWorked: 26,
        overtimeHours: 32,
        basicSalary: 95000,
        overtimePay: 38400,
        projectAllowance: 15000,
        epfEtfDeduction: 7600,
        netPay: 140800,
        attendanceRatePct: 100,
        status: 'Paid',
        updatedBy: 'Victoria Chen (Finance Manager)',
        updatedAt: '2026-09-26'
      }
    ];

    const seedFinance: FactoryFinanceAccountingRecord[] = [
      // Owned Factory (fac-inv-01) — Contract, Invoices, and Accounting Entries for PRJ-2026-001
      {
        id: 'ffn-01',
        recordCode: 'FAC-CNT-2026-401',
        recordCategory: 'CONTRACT_AGREEMENT',
        subType: 'Internal Plant Work Package Charter & SLA',
        factoryId: 'fac-inv-01',
        factoryName: 'Innovista Central Facade & Glazing Plant',
        ownershipType: 'Innovista Owned',
        projectId: 'PRJ-2026-001',
        projectName: 'Sirius Mall Storefront',
        workPackageId: 'fwp-01',
        counterpartyName: 'Innovista Central Facade & Glazing Plant (Internal Division)',
        referenceDocCode: 'FWP-2026-001',
        title: 'Owned Plant Execution Charter — Sirius Mall Unitized Curtain Wall',
        description: 'Direct in-house fabrication, glazing, QA/QC FAT testing, HR payroll & procurement allocation.',
        grossAmount: 18500000,
        taxOrVatAmount: 0,
        retentionOrDeductionAmount: 0,
        netAmount: 18500000,
        date: '2026-09-10',
        dueDateOrExpiry: '2026-12-31',
        status: 'Active Agreement',
        preparedBy: 'Marcus Sterling (Senior Project Manager)',
        approvedBy: 'Alexander Vance (Super Administrator)',
        updatedAt: '2026-09-10'
      },
      {
        id: 'ffn-02',
        recordCode: 'FAC-INV-2026-201',
        recordCategory: 'INVOICE',
        subType: 'Supplier Material Invoice',
        factoryId: 'fac-inv-01',
        factoryName: 'Innovista Central Facade & Glazing Plant',
        ownershipType: 'Innovista Owned',
        projectId: 'PRJ-2026-001',
        projectName: 'Sirius Mall Storefront',
        workPackageId: 'fwp-01',
        counterpartyName: 'Alumex Extrusions PLC',
        referenceDocCode: 'FAC-PO-2026-101 / FAC-GRN-2026-101',
        title: 'Supplier Tax Invoice — 234 Accepted 6063-T6 Mullion Bars',
        description: 'Billed against GRN FAC-GRN-2026-101 after deducting 6 NCR returned bars (FAC-RET-2026-101).',
        grossAmount: 4258800,
        taxOrVatAmount: 766584,
        retentionOrDeductionAmount: 109200,
        netAmount: 4916184,
        date: '2026-09-23',
        dueDateOrExpiry: '2026-10-23',
        status: 'Approved',
        preparedBy: 'Victoria Chen (Finance Manager)',
        approvedBy: 'Alexander Vance (Super Administrator)',
        updatedAt: '2026-09-24'
      },
      {
        id: 'ffn-03',
        recordCode: 'FAC-ACC-2026-301',
        recordCategory: 'ACCOUNTING_ENTRY',
        subType: 'Direct Labour & Payroll Posting',
        factoryId: 'fac-inv-01',
        factoryName: 'Innovista Central Facade & Glazing Plant',
        ownershipType: 'Innovista Owned',
        projectId: 'PRJ-2026-001',
        projectName: 'Sirius Mall Storefront',
        workPackageId: 'fwp-01',
        counterpartyName: 'Factory Shop-Floor & Engineering Payroll (2026-09)',
        referenceDocCode: 'FAC-PAY-2026-09',
        title: 'Project WIP Labour & Overtime Cost Allocation — Sirius Mall',
        description: 'Direct factory payroll & overtime posted to Project PRJ-2026-001 WIP Ledger.',
        grossAmount: 808400,
        taxOrVatAmount: 0,
        retentionOrDeductionAmount: 46800,
        netAmount: 761600,
        date: '2026-09-26',
        dueDateOrExpiry: '2026-09-30',
        status: 'Posted to GL',
        preparedBy: 'Victoria Chen (Finance Manager)',
        approvedBy: 'Alexander Vance (Super Administrator)',
        updatedAt: '2026-09-26'
      },
      // Other / Partnered Factory (fac-ext-01) — Contract, Invoice & Accounting for PRJ-2026-002
      {
        id: 'ffn-04',
        recordCode: 'FAC-CNT-2026-402',
        recordCategory: 'CONTRACT_AGREEMENT',
        subType: 'Subcontract Fabrication & Coating Agreement',
        factoryId: 'fac-ext-01',
        factoryName: 'Apex Structural Steel & Coating Works',
        ownershipType: 'Partnered Factory',
        projectId: 'PRJ-2026-002',
        projectName: 'Port City Commercial Tower',
        workPackageId: 'fwp-03',
        counterpartyName: 'Apex Structural Steel & Coating Works',
        referenceDocCode: 'FWP-2026-003',
        title: 'Partner Factory Subcontract Agreement — Structural Steel Canopies & Brackets',
        description: '10% retention, mandatory AWS D1.1 ultrasonic weld reports, and joint FAT sign-off.',
        grossAmount: 14200000,
        taxOrVatAmount: 2556000,
        retentionOrDeductionAmount: 1420000,
        netAmount: 15336000,
        date: '2026-09-12',
        dueDateOrExpiry: '2026-12-15',
        status: 'Active Agreement',
        preparedBy: 'Tariq Al-Mansoor (Procurement)',
        approvedBy: 'Marcus Sterling (Senior Project Manager)',
        updatedAt: '2026-09-12'
      },
      {
        id: 'ffn-05',
        recordCode: 'FAC-INV-2026-202',
        recordCategory: 'INVOICE',
        subType: 'Subcontractor Milestone Invoice',
        factoryId: 'fac-ext-01',
        factoryName: 'Apex Structural Steel & Coating Works',
        ownershipType: 'Partnered Factory',
        projectId: 'PRJ-2026-002',
        projectName: 'Port City Commercial Tower',
        workPackageId: 'fwp-03',
        counterpartyName: 'Apex Structural Steel & Coating Works',
        referenceDocCode: 'FAC-PO-2026-201 / FAC-GRN-2026-201',
        title: 'Partner Factory Interim Payment Certificate #01 — 48 Accepted Steel Sets',
        description: 'Verified against GRN FAC-GRN-2026-201 and QC Inspection pass; 10% retention applied.',
        grossAmount: 2016000,
        taxOrVatAmount: 362880,
        retentionOrDeductionAmount: 201600,
        netAmount: 2177280,
        date: '2026-09-25',
        dueDateOrExpiry: '2026-10-25',
        status: 'Verified',
        preparedBy: 'Tariq Al-Mansoor',
        approvedBy: 'Victoria Chen (Finance Manager)',
        updatedAt: '2026-09-25'
      }
    ];

    this.supervisorAssignments = this.load(STORAGE_KEYS.SUPERVISOR_ASSIGNMENTS, seedSupervisors);
    this.factoryProcurementRecords = this.load(STORAGE_KEYS.FACTORY_PROCUREMENT, seedProcurement);
    this.factoryHrPayrollRecords = this.load(STORAGE_KEYS.FACTORY_HR_PAYROLL, seedHrPayroll);
    this.factoryFinanceRecords = this.load(STORAGE_KEYS.FACTORY_FINANCE_CONTRACTS, seedFinance);
  }

  public getSupervisorAssignments(
    factoryId?: string,
    projectId?: string
  ): FactoryProjectSupervisorAssignment[] {
    return this.supervisorAssignments.filter(a => {
      const matchFac = !factoryId || factoryId === 'ALL' || a.factoryId === factoryId;
      const matchPrj =
        !projectId ||
        projectId === 'ALL' ||
        a.projectId === projectId ||
        a.projectName === projectId;
      return matchFac && matchPrj;
    });
  }

  public getUserFactorySupervisingAssignments(
    user: SecurityUser | null,
    factoryId?: string,
    projectId?: string
  ): FactoryProjectSupervisorAssignment[] {
    if (!user) return [];
    const uname = (user.username || '').toLowerCase();
    const fname = (user.fullName || '').toLowerCase();
    return this.getSupervisorAssignments(factoryId, projectId).filter(
      a =>
        a.status === 'Active' &&
        (a.userId === user.id ||
          a.username.toLowerCase() === uname ||
          a.fullName.toLowerCase() === fname)
    );
  }

  public hasModuleAuthorityInFactory(
    user: SecurityUser | null,
    moduleKey: keyof FactoryProjectSupervisorAssignment['permissions'],
    factoryId?: string,
    projectId?: string
  ): boolean {
    if (!user) return true;
    const roleLower = (user.roleName || '').toLowerCase();
    if (
      user.roleId === 'role-superadmin' ||
      user.roleId === 'role-sysadmin' ||
      user.roleId === 'role-admin' ||
      user.roleId === 'role-pm' ||
      user.userType === 'SUPER_ADMIN' ||
      user.userType === 'SYSTEM_ADMINISTRATOR' ||
      user.userType === 'PROJECT_MANAGER' ||
      roleLower.includes('admin') ||
      roleLower.includes('project manager')
    ) {
      return true;
    }
    const assignments = this.getUserFactorySupervisingAssignments(user, factoryId, projectId);
    if (assignments.some(a => a.hasFactoryManagerAuthority || a.permissions[moduleKey])) {
      return true;
    }
    if (this.isFactoryManagerAccount(user, factoryId, projectId)) {
      return true;
    }
    if (moduleKey === 'canManageProcurement' && user.department === 'PROCUREMENT_SUPPLY_CHAIN') return true;
    if (moduleKey === 'canManageFinanceAndInvoices' && user.department === 'FINANCE_ACCOUNTING') return true;
    if (moduleKey === 'canManageHrAndPayroll' && user.department === 'HR_ADMIN') return true;
    if (moduleKey === 'canManageQualityAndNcr' && user.department === 'QUALITY') return true;
    return false;
  }

  public saveSupervisorAssignment(
    userOrInput:
      | SecurityUser
      | null
      | (Partial<FactoryProjectSupervisorAssignment> & {
          fullName?: string;
          userName?: string;
          supervisingRole: FactorySupervisingRoleType;
          factoryId: string;
          projectId: string;
        }),
    inputMaybe?: Partial<FactoryProjectSupervisorAssignment> & {
      fullName?: string;
      userName?: string;
      supervisingRole: FactorySupervisingRoleType;
      factoryId: string;
      projectId: string;
    }
  ): FactoryProjectSupervisorAssignment {
    let user: SecurityUser | null = null;
    let input: any;
    if (inputMaybe) {
      user = userOrInput as SecurityUser | null;
      input = inputMaybe;
    } else {
      input = userOrInput;
    }
    const resolvedFullName = input.fullName || input.userName || 'Assigned Supervisor';
    const fac = this.factories.find(f => f.id === input.factoryId) || this.factories[0];
    const wp =
      this.workPackages.find(
        w =>
          w.factoryId === fac.id &&
          (w.projectId === input.projectId || w.projectName === input.projectId)
      ) ||
      this.workPackages.find(w => w.projectId === input.projectId) ||
      this.workPackages[0];

    const existingIdx = input.id
      ? this.supervisorAssignments.findIndex(a => a.id === input.id)
      : -1;

    const record: FactoryProjectSupervisorAssignment = {
      id: input.id || `fsa-${Date.now()}`,
      assignmentCode:
        input.assignmentCode ||
        `FSA-2026-${String(this.supervisorAssignments.length + 1).padStart(3, '0')}`,
      userId: input.userId || `usr-sup-${Date.now()}`,
      employeeId: input.employeeId || `EMP-${100 + this.supervisorAssignments.length + 1}`,
      username:
        input.username ||
        resolvedFullName
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '.')
          .replace(/\.+/g, '.'),
      fullName: resolvedFullName,
      roleName: input.roleName || input.supervisingRole,
      supervisingRole: input.supervisingRole,
      department: input.department || 'FACTORY_PRODUCTION',
      email: input.email || 'supervisor@innovista.lk',
      phone: input.phone || '+94 77 200 4000',
      factoryId: fac.id,
      factoryName: fac.name,
      ownershipType: fac.ownershipType,
      projectId: wp?.projectId || input.projectId,
      projectName: input.projectName || wp?.projectName || input.projectId,
      workPackageId: input.workPackageId || wp?.id || 'fwp-01',
      hasFactoryManagerAuthority:
        input.hasFactoryManagerAuthority !== undefined ? input.hasFactoryManagerAuthority : true,
      permissions: input.permissions || {
        canManageTasksAndChecklists: true,
        canManageQualityAndNcr: true,
        canManageProcurement: true,
        canManageHrAndPayroll: fac.ownershipType === 'Innovista Owned',
        canManageFinanceAndInvoices: true,
        canManageContractsAndAgreements: true
      },
      assignedBy: user?.fullName || 'Project / Factory Administrator',
      assignedAt: new Date().toISOString().slice(0, 10),
      status: input.status || 'Active'
    };

    if (existingIdx >= 0) {
      this.supervisorAssignments[existingIdx] = record;
    } else {
      this.supervisorAssignments.unshift(record);
    }
    this.save(STORAGE_KEYS.SUPERVISOR_ASSIGNMENTS, this.supervisorAssignments);
    this.recordFactoryUpdateNotification(fac.id, 1);
    this.recordAuditEntry(
      user,
      existingIdx >= 0 ? 'EDITED' : 'CREATED',
      'SUPERVISOR_ASSIGNMENT',
      record.id,
      `Assigned ${record.fullName} as ${record.supervisingRole} (Individual Factory Manager Authority: ${record.hasFactoryManagerAuthority ? 'YES' : 'Scoped'}) for Factory [${fac.name}] on Project [${record.projectName}].`
    );
    return record;
  }

  public deleteSupervisorAssignment(user: SecurityUser | null, id: string): boolean {
    const found = this.supervisorAssignments.find(a => a.id === id);
    if (!found) return false;
    this.supervisorAssignments = this.supervisorAssignments.filter(a => a.id !== id);
    this.save(STORAGE_KEYS.SUPERVISOR_ASSIGNMENTS, this.supervisorAssignments);
    this.recordAuditEntry(
      user,
      'DELETED',
      'SUPERVISOR_ASSIGNMENT',
      id,
      `Removed supervising assignment ${found.assignmentCode} (${found.fullName}) from ${found.factoryName}`
    );
    return true;
  }

  public deleteFactoryProcurementRecord(user: SecurityUser | null, id: string): boolean {
    const found = this.factoryProcurementRecords.find(r => r.id === id);
    if (!found) return false;
    this.factoryProcurementRecords = this.factoryProcurementRecords.filter(r => r.id !== id);
    this.save(STORAGE_KEYS.FACTORY_PROCUREMENT, this.factoryProcurementRecords);
    this.recordAuditEntry(
      user,
      'DELETED',
      'FACTORY_PROCUREMENT',
      id,
      `Deleted procurement record ${found.docCode} (${found.stageType}) — ${found.title}`
    );
    return true;
  }

  public deleteFactoryHrPayrollRecord(user: SecurityUser | null, id: string): boolean {
    const found = this.factoryHrPayrollRecords.find(r => r.id === id);
    if (!found) return false;
    this.factoryHrPayrollRecords = this.factoryHrPayrollRecords.filter(r => r.id !== id);
    this.save(STORAGE_KEYS.FACTORY_HR_PAYROLL, this.factoryHrPayrollRecords);
    this.recordAuditEntry(
      user,
      'DELETED',
      'FACTORY_HR_PAYROLL',
      id,
      `Deleted HR payroll record ${found.payrollCode} for ${found.employeeName}`
    );
    return true;
  }

  public deleteFactoryFinanceRecord(user: SecurityUser | null, id: string): boolean {
    const found = this.factoryFinanceRecords.find(r => r.id === id);
    if (!found) return false;
    this.factoryFinanceRecords = this.factoryFinanceRecords.filter(r => r.id !== id);
    this.save(STORAGE_KEYS.FACTORY_FINANCE_CONTRACTS, this.factoryFinanceRecords);
    this.recordAuditEntry(
      user,
      'DELETED',
      'FACTORY_FINANCE_CONTRACT',
      id,
      `Deleted finance record ${found.recordCode} (${found.recordCategory}) — ${found.title}`
    );
    return true;
  }

  public deleteTask(user: SecurityUser | null, id: string): boolean {
    const found = this.tasks.find(t => t.id === id);
    if (!found) return false;
    this.tasks = this.tasks.filter(t => t.id !== id);
    this.save(STORAGE_KEYS.TASKS, this.tasks);
    this.recordAuditEntry(
      user,
      'DELETED',
      'TASK',
      id,
      `Deleted task ${found.taskCode} — ${found.title}`
    );
    this.recalculateWorkPackageProgress(found.workPackageId);
    return true;
  }

  public deleteDailyReport(user: SecurityUser | null, id: string): boolean {
    const found = this.dailyReports.find(d => d.id === id);
    if (!found) return false;
    this.dailyReports = this.dailyReports.filter(d => d.id !== id);
    this.save(STORAGE_KEYS.DAILY_REPORTS, this.dailyReports);
    this.recordAuditEntry(
      user,
      'DELETED',
      'DAILY_REPORT',
      id,
      `Deleted daily activity report ${found.reportNo}`
    );
    return true;
  }

  public deleteWorksheet(user: SecurityUser | null, id: string): boolean {
    const found = this.worksheets.find(w => w.id === id);
    if (!found) return false;
    this.worksheets = this.worksheets.filter(w => w.id !== id);
    this.save(STORAGE_KEYS.WORKSHEETS, this.worksheets);
    this.recordAuditEntry(
      user,
      'DELETED',
      'WORKSHEET',
      id,
      `Deleted worksheet ${found.worksheetNo}`
    );
    return true;
  }

  public getFactoryProcurementRecords(
    factoryId?: string,
    projectId?: string,
    stageType?: FactoryProcurementStageType | 'ALL'
  ): FactoryProcurementRecord[] {
    return this.factoryProcurementRecords.filter(r => {
      const matchFac = !factoryId || factoryId === 'ALL' || r.factoryId === factoryId;
      const matchPrj =
        !projectId ||
        projectId === 'ALL' ||
        r.projectId === projectId ||
        r.projectName === projectId;
      const matchStage = !stageType || stageType === 'ALL' || r.stageType === stageType;
      return matchFac && matchPrj && matchStage;
    });
  }

  public saveFactoryProcurementRecord(
    user: SecurityUser | null,
    input: Partial<FactoryProcurementRecord> & {
      stageType: FactoryProcurementStageType;
      factoryId: string;
      projectId: string;
      title: string;
    }
  ): FactoryProcurementRecord {
    const fac = this.factories.find(f => f.id === input.factoryId) || this.factories[0];
    const wp =
      this.workPackages.find(
        w =>
          w.factoryId === fac.id &&
          (w.projectId === input.projectId || w.projectName === input.projectId)
      ) ||
      this.workPackages.find(w => w.projectId === input.projectId) ||
      this.workPackages[0];

    const stagePrefixMap: Record<FactoryProcurementStageType, string> = {
      RQ: 'FAC-RQ',
      QUOTATION: 'FAC-QT',
      PO: 'FAC-PO',
      GRN: 'FAC-GRN',
      QC_INSPECTION: 'FAC-IQC',
      NCR_REPORT: 'FAC-NCR',
      RETURN: 'FAC-RET'
    };

    const defaultStatusMap: Record<FactoryProcurementStageType, FactoryProcurementRecord['status']> = {
      RQ: 'Submitted',
      QUOTATION: 'Submitted',
      PO: 'Ordered',
      GRN: 'Received (GRN)',
      QC_INSPECTION: 'QC Passed',
      NCR_REPORT: 'NCR Open',
      RETURN: 'Returned to Vendor'
    };

    const qty = Number(input.quantity) || 1;
    const rate = Number(input.unitRate) || 0;
    const rej = Number(input.rejectedQty) || 0;
    const acc = input.acceptedQty !== undefined ? Number(input.acceptedQty) : Math.max(0, qty - rej);
    const total = input.totalAmount !== undefined ? Number(input.totalAmount) : qty * rate;

    const record: FactoryProcurementRecord = {
      id: input.id || `fpr-${Date.now()}`,
      docCode:
        input.docCode ||
        `${stagePrefixMap[input.stageType]}-2026-${100 + this.factoryProcurementRecords.length + 1}`,
      stageType: input.stageType,
      factoryId: fac.id,
      factoryName: fac.name,
      ownershipType: fac.ownershipType,
      projectId: wp?.projectId || input.projectId,
      projectName: input.projectName || wp?.projectName || input.projectId,
      workPackageId: input.workPackageId || wp?.id || 'fwp-01',
      supplierOrPartnerName: input.supplierOrPartnerName || fac.name,
      linkedRefCode: input.linkedRefCode || wp?.packageCode || 'FWP-2026-001',
      title: input.title,
      itemSummary: input.itemSummary || input.title,
      quantity: qty,
      acceptedQty: acc,
      rejectedQty: rej,
      unit: input.unit || 'Units',
      unitRate: rate,
      totalAmount: total,
      date: input.date || new Date().toISOString().slice(0, 10),
      status: input.status || defaultStatusMap[input.stageType],
      inspectorOrOfficer: input.inspectorOrOfficer || user?.fullName || fac.factoryManagerName,
      remarks: input.remarks || `Recorded under ${fac.name} for Project ${wp?.projectName || input.projectId}`,
      updatedAt: new Date().toISOString().slice(0, 10)
    };

    const existingIdx = input.id
      ? this.factoryProcurementRecords.findIndex(r => r.id === input.id)
      : -1;
    if (existingIdx >= 0) {
      this.factoryProcurementRecords[existingIdx] = record;
    } else {
      this.factoryProcurementRecords.unshift(record);
    }
    this.save(STORAGE_KEYS.FACTORY_PROCUREMENT, this.factoryProcurementRecords);
    this.recordFactoryUpdateNotification(fac.id, 1);

    this.recordAuditEntry(
      user,
      existingIdx >= 0 ? 'EDITED' : 'CREATED',
      'FACTORY_PROCUREMENT',
      record.id,
      `Recorded [${record.stageType}] ${record.docCode} — ${record.title} (LKR ${record.totalAmount.toLocaleString()}) for Factory ${fac.name} & Project ${record.projectName}`
    );

    return record;
  }

  public advanceFactoryProcurementStage(
    user: SecurityUser | null,
    recordId: string,
    nextStatus: FactoryProcurementRecord['status']
  ): FactoryProcurementRecord | null {
    const rec = this.factoryProcurementRecords.find(r => r.id === recordId);
    if (!rec) return null;
    rec.status = nextStatus;
    rec.updatedAt = new Date().toISOString().slice(0, 10);
    this.save(STORAGE_KEYS.FACTORY_PROCUREMENT, this.factoryProcurementRecords);
    this.recordFactoryUpdateNotification(rec.factoryId, 1);
    this.recordAuditEntry(
      user,
      'APPROVED',
      'FACTORY_PROCUREMENT',
      rec.id,
      `Updated procurement record ${rec.docCode} (${rec.stageType}) status to [${nextStatus}]`
    );
    return rec;
  }

  public getFactoryHrPayrollRecords(
    factoryId?: string,
    projectId?: string
  ): FactoryHrPayrollRecord[] {
    return this.factoryHrPayrollRecords.filter(r => {
      const matchFac = !factoryId || factoryId === 'ALL' || r.factoryId === factoryId;
      const matchPrj =
        !projectId ||
        projectId === 'ALL' ||
        r.projectId === projectId ||
        r.projectName === projectId;
      return matchFac && matchPrj;
    });
  }

  public saveFactoryHrPayrollRecord(
    user: SecurityUser | null,
    input: Partial<FactoryHrPayrollRecord> & {
      factoryId: string;
      projectId: string;
      employeeName: string;
    }
  ): FactoryHrPayrollRecord {
    const fac = this.factories.find(f => f.id === input.factoryId) || this.factories[0];
    const wp =
      this.workPackages.find(
        w =>
          w.factoryId === fac.id &&
          (w.projectId === input.projectId || w.projectName === input.projectId)
      ) ||
      this.workPackages.find(w => w.projectId === input.projectId) ||
      this.workPackages[0];

    const basic = Number(input.basicSalary) || 120000;
    const otHours = Number(input.overtimeHours) || 0;
    const otPay = input.overtimePay !== undefined ? Number(input.overtimePay) : Math.round(otHours * (basic / 200) * 1.5);
    const allowance = Number(input.projectAllowance) || 20000;
    const deduction = input.epfEtfDeduction !== undefined ? Number(input.epfEtfDeduction) : Math.round(basic * 0.08);
    const netPay = basic + otPay + allowance - deduction;

    const record: FactoryHrPayrollRecord = {
      id: input.id || `fhr-${Date.now()}`,
      payrollCode:
        input.payrollCode ||
        `FAC-PAY-2026-09-${String(this.factoryHrPayrollRecords.length + 1).padStart(2, '0')}`,
      factoryId: fac.id,
      factoryName: fac.name,
      ownershipType: fac.ownershipType,
      projectId: wp?.projectId || input.projectId,
      projectName: input.projectName || wp?.projectName || input.projectId,
      workPackageId: input.workPackageId || wp?.id || 'fwp-01',
      employeeId: input.employeeId || `EMP-${110 + this.factoryHrPayrollRecords.length}`,
      employeeName: input.employeeName,
      roleOrTrade: input.roleOrTrade || 'Factory Specialist / Engineer',
      department: input.department || 'Factory Production',
      payPeriod: input.payPeriod || '2026-09',
      daysWorked: Number(input.daysWorked) || 25,
      overtimeHours: otHours,
      basicSalary: basic,
      overtimePay: otPay,
      projectAllowance: allowance,
      epfEtfDeduction: deduction,
      netPay,
      attendanceRatePct: Number(input.attendanceRatePct) || 98,
      status: input.status || 'Verified by FM',
      updatedBy: user?.fullName || fac.factoryManagerName,
      updatedAt: new Date().toISOString().slice(0, 10)
    };

    const existingIdx = input.id
      ? this.factoryHrPayrollRecords.findIndex(r => r.id === input.id)
      : -1;
    if (existingIdx >= 0) {
      this.factoryHrPayrollRecords[existingIdx] = record;
    } else {
      this.factoryHrPayrollRecords.unshift(record);
    }
    this.save(STORAGE_KEYS.FACTORY_HR_PAYROLL, this.factoryHrPayrollRecords);
    this.recordFactoryUpdateNotification(fac.id, 1);

    this.recordAuditEntry(
      user,
      existingIdx >= 0 ? 'EDITED' : 'CREATED',
      'FACTORY_HR_PAYROLL',
      record.id,
      `Recorded Factory HR & Payroll ${record.payrollCode} for ${record.employeeName} (Net Pay: LKR ${record.netPay.toLocaleString()}) on Project ${record.projectName}`
    );

    return record;
  }

  public updateFactoryHrPayrollStatus(
    user: SecurityUser | null,
    id: string,
    status: FactoryHrPayrollRecord['status']
  ): FactoryHrPayrollRecord | null {
    const rec = this.factoryHrPayrollRecords.find(r => r.id === id);
    if (!rec) return null;
    rec.status = status;
    rec.updatedBy = user?.fullName || 'Authorized Officer';
    rec.updatedAt = new Date().toISOString().slice(0, 10);
    this.save(STORAGE_KEYS.FACTORY_HR_PAYROLL, this.factoryHrPayrollRecords);
    this.recordFactoryUpdateNotification(rec.factoryId, 1);
    this.recordAuditEntry(
      user,
      'APPROVED',
      'FACTORY_HR_PAYROLL',
      rec.id,
      `Updated Factory Payroll ${rec.payrollCode} (${rec.employeeName}) status to [${status}]`
    );
    return rec;
  }

  public getFactoryFinanceRecords(
    factoryId?: string,
    projectId?: string,
    category?: FactoryFinanceRecordCategory | 'ALL'
  ): FactoryFinanceAccountingRecord[] {
    return this.factoryFinanceRecords.filter(r => {
      const matchFac = !factoryId || factoryId === 'ALL' || r.factoryId === factoryId;
      const matchPrj =
        !projectId ||
        projectId === 'ALL' ||
        r.projectId === projectId ||
        r.projectName === projectId;
      const matchCat = !category || category === 'ALL' || r.recordCategory === category;
      return matchFac && matchPrj && matchCat;
    });
  }

  public saveFactoryFinanceRecord(
    user: SecurityUser | null,
    input: Partial<FactoryFinanceAccountingRecord> & {
      recordCategory: FactoryFinanceRecordCategory;
      factoryId: string;
      projectId: string;
      title: string;
    }
  ): FactoryFinanceAccountingRecord {
    const fac = this.factories.find(f => f.id === input.factoryId) || this.factories[0];
    const wp =
      this.workPackages.find(
        w =>
          w.factoryId === fac.id &&
          (w.projectId === input.projectId || w.projectName === input.projectId)
      ) ||
      this.workPackages.find(w => w.projectId === input.projectId) ||
      this.workPackages[0];

    const prefixMap: Record<FactoryFinanceRecordCategory, string> = {
      INVOICE: 'FAC-INV',
      ACCOUNTING_ENTRY: 'FAC-ACC',
      CONTRACT_AGREEMENT: 'FAC-CNT'
    };

    const gross = Number(input.grossAmount) || 0;
    const tax = input.taxOrVatAmount !== undefined ? Number(input.taxOrVatAmount) : 0;
    const ret = input.retentionOrDeductionAmount !== undefined ? Number(input.retentionOrDeductionAmount) : 0;
    const net = input.netAmount !== undefined ? Number(input.netAmount) : gross + tax - ret;

    const record: FactoryFinanceAccountingRecord = {
      id: input.id || `ffn-${Date.now()}`,
      recordCode:
        input.recordCode ||
        `${prefixMap[input.recordCategory]}-2026-${200 + this.factoryFinanceRecords.length + 1}`,
      recordCategory: input.recordCategory,
      subType:
        input.subType ||
        (input.recordCategory === 'CONTRACT_AGREEMENT'
          ? 'Factory Execution Agreement'
          : input.recordCategory === 'ACCOUNTING_ENTRY'
          ? 'Project WIP Cost Entry'
          : 'Factory Progress / Supplier Invoice'),
      factoryId: fac.id,
      factoryName: fac.name,
      ownershipType: fac.ownershipType,
      projectId: wp?.projectId || input.projectId,
      projectName: input.projectName || wp?.projectName || input.projectId,
      workPackageId: input.workPackageId || wp?.id || 'fwp-01',
      counterpartyName: input.counterpartyName || fac.name,
      referenceDocCode: input.referenceDocCode || wp?.packageCode || 'FWP-2026-001',
      title: input.title,
      description:
        input.description ||
        `Scoped to Factory ${fac.name} (${fac.ownershipType}) & Project ${wp?.projectName || input.projectId}`,
      grossAmount: gross,
      taxOrVatAmount: tax,
      retentionOrDeductionAmount: ret,
      netAmount: net,
      date: input.date || new Date().toISOString().slice(0, 10),
      dueDateOrExpiry: input.dueDateOrExpiry || '2026-11-30',
      status:
        input.status ||
        (input.recordCategory === 'CONTRACT_AGREEMENT'
          ? 'Active Agreement'
          : input.recordCategory === 'ACCOUNTING_ENTRY'
          ? 'Posted to GL'
          : 'Submitted'),
      preparedBy: input.preparedBy || user?.fullName || fac.factoryManagerName,
      approvedBy: input.approvedBy,
      updatedAt: new Date().toISOString().slice(0, 10)
    };

    const existingIdx = input.id
      ? this.factoryFinanceRecords.findIndex(r => r.id === input.id)
      : -1;
    if (existingIdx >= 0) {
      this.factoryFinanceRecords[existingIdx] = record;
    } else {
      this.factoryFinanceRecords.unshift(record);
    }
    this.save(STORAGE_KEYS.FACTORY_FINANCE_CONTRACTS, this.factoryFinanceRecords);

    // Also update WorkPackage actualCostIncurred when an invoice or accounting entry is posted
    if (wp && (record.recordCategory === 'INVOICE' || record.recordCategory === 'ACCOUNTING_ENTRY')) {
      wp.actualCostIncurred = (wp.actualCostIncurred || 0) + record.netAmount;
      this.save(STORAGE_KEYS.WORK_PACKAGES, this.workPackages);
    }

    this.recordFactoryUpdateNotification(fac.id, 1);
    this.recordAuditEntry(
      user,
      existingIdx >= 0 ? 'EDITED' : 'CREATED',
      'FACTORY_FINANCE_CONTRACT',
      record.id,
      `Recorded [${record.recordCategory}] ${record.recordCode} — ${record.title} (Net LKR ${record.netAmount.toLocaleString()}) for Factory ${fac.name} & Project ${record.projectName}`
    );

    return record;
  }

  public updateFactoryFinanceStatus(
    user: SecurityUser | null,
    id: string,
    status: FactoryFinanceAccountingRecord['status']
  ): FactoryFinanceAccountingRecord | null {
    const rec = this.factoryFinanceRecords.find(r => r.id === id);
    if (!rec) return null;
    rec.status = status;
    rec.approvedBy = user?.fullName || 'Finance / Project Controller';
    rec.updatedAt = new Date().toISOString().slice(0, 10);
    this.save(STORAGE_KEYS.FACTORY_FINANCE_CONTRACTS, this.factoryFinanceRecords);
    this.recordFactoryUpdateNotification(rec.factoryId, 1);
    this.recordAuditEntry(
      user,
      'APPROVED',
      'FACTORY_FINANCE_CONTRACT',
      rec.id,
      `Updated [${rec.recordCategory}] ${rec.recordCode} status to [${status}]`
    );
    return rec;
  }

  /**
   * Consolidated Project <-> Factory live integration summary for Project Portal
   * Ensures every factory assigned to a project records and exposes all updates
   * (Tasks, QC Checklists, Supervising Team, Procurement RQ/PO/GRN/QC/NCR/Return, HR Payroll, Invoices, Accounting & Contracts)
   */
  public getProjectFactoryConsolidatedSummary(projectIdOrName?: string) {
    const matchPrj = (pid: string, pname: string) => {
      if (!projectIdOrName || projectIdOrName === 'ALL') return true;
      const q = projectIdOrName.toLowerCase();
      return (
        (pid || '').toLowerCase() === q ||
        (pname || '').toLowerCase() === q ||
        (pname || '').toLowerCase().includes(q)
      );
    };

    const assignedWorkPackages = this.workPackages.filter(w => matchPrj(w.projectId, w.projectName));
    const assignedFactoryIds = new Set(assignedWorkPackages.map(w => w.factoryId));
    const assignedFactories = this.factories.filter(f =>
      assignedFactoryIds.has(f.id) || (f.linkedProjectIds || []).some(pid => matchPrj(pid, pid))
    );
    const projectTasks = this.tasks.filter(t => matchPrj(t.projectId, t.projectName));
    const projectInspections = this.inspections.filter(i => matchPrj(i.projectId, i.projectName));
    const projectDispatches = this.dispatches.filter(d => matchPrj(d.projectId, d.projectName));
    const projectSupervisors = this.supervisorAssignments.filter(s => matchPrj(s.projectId, s.projectName));
    const projectProcurement = this.factoryProcurementRecords.filter(p => matchPrj(p.projectId, p.projectName));
    const projectHrPayroll = this.factoryHrPayrollRecords.filter(h => matchPrj(h.projectId, h.projectName));
    const projectFinance = this.factoryFinanceRecords.filter(f => matchPrj(f.projectId, f.projectName));
    const projectAuditLogs = this.factoryAuditLogs
      .filter(l => matchPrj(l.projectId, l.projectName))
      .slice(0, 25);

    const completedTasksCount = projectTasks.filter(t => t.stageStatus === 'Completed' || t.stageStatus === 'Dispatched' || t.stageStatus === 'Installed' || t.stageStatus === 'Accepted').length;
    const overallFactoryProgress = assignedWorkPackages.length > 0
      ? Math.round(assignedWorkPackages.reduce((acc, w) => acc + (w.completionPercent || 0), 0) / assignedWorkPackages.length)
      : (projectTasks.length > 0 ? Math.round((completedTasksCount / projectTasks.length) * 100) : 0);
    const totalProcurementPoValue = projectProcurement
      .filter(p => p.stageType === 'PO' || p.stageType === 'GRN' || p.status === 'Ordered')
      .reduce((acc, p) => acc + (Number(p.totalAmount) || 0), 0);
    const totalPayrollCost = projectHrPayroll.reduce((acc, h) => acc + (Number(h.netPay || h.netPayableLkr) || 0), 0);
    const totalInvoicedAmount = projectFinance
      .filter(f => f.recordCategory === 'INVOICE')
      .reduce((acc, f) => acc + (Number(f.netAmount || f.totalAmountLkr) || 0), 0);
    const totalContractValue = projectFinance
      .filter(f => f.recordCategory === 'CONTRACT_AGREEMENT')
      .reduce((acc, f) => acc + (Number(f.grossAmount || f.totalAmountLkr) || 0), 0);

    return {
      assignedFactories,
      assignedWorkPackages,
      workPackages: assignedWorkPackages,
      projectTasks,
      tasks: projectTasks,
      projectInspections,
      qualityInspections: projectInspections,
      projectDispatches,
      dispatches: projectDispatches,
      projectSupervisors,
      supervisors: projectSupervisors,
      projectProcurement,
      procurementRecords: projectProcurement,
      projectHrPayroll,
      hrPayrollRecords: projectHrPayroll,
      projectFinance,
      financeRecords: projectFinance,
      projectAuditLogs,
      recentFactoryAuditLogs: projectAuditLogs,
      completedTasksCount,
      overallFactoryProgress,
      totalProcurementPoValue,
      totalPayrollCost,
      totalInvoicedAmount,
      totalContractValue
    };
  }

  public getAssignableSupervisingUsers(): Array<{ id: string; name: string; role: string; email: string }> {
    return [
      { id: 'usr-eng-01', name: 'Eng. Nuwan Perera', role: 'Senior Facade Engineer', email: 'nuwan.perera@innovista.lk' },
      { id: 'usr-qc-01', name: 'Priya Nair', role: 'QA/QC Inspector', email: 'priya.nair@innovista.lk' },
      { id: 'usr-fac-01', name: 'Roshan De Silva', role: 'Factory Manager', email: 'roshan.desilva@innovista.lk' },
      { id: 'usr-sup-02', name: 'Chaminda Rajapakse', role: 'Plant Supervisor', email: 'chaminda.r@innovista.lk' },
      { id: 'usr-proc-01', name: 'Tariq Al-Mansoor', role: 'Procurement Specialist', email: 'tariq.mansoor@innovista.lk' },
      { id: 'usr-fin-01', name: 'Dilshan Silva', role: 'Finance & Accounting Officer', email: 'dilshan.silva@innovista.lk' },
      { id: 'usr-hr-01', name: 'Shanthi Fernando', role: 'Human Resources Officer', email: 'shanthi.fernando@innovista.lk' }
    ];
  }
}

export const factoryExecutionService = new FactoryExecutionService();
