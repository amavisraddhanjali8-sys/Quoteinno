// ============================================================================
// INNOVISTA CENTRAL REST API GATEWAY & BUSINESS LOGIC SERVICES
// Unified Data Access Layer enforcing RBAC/ABAC, Audit Engine, Approvals & Object Storage
// ============================================================================

import { 
  UnifiedProjectControlRecord,
  QualityInspectionPlan,
  QualityInspectionExecution,
  QualityAlert,
  NonConformanceReport,
  CorrectivePreventiveAction,
  MaterialTraceabilityRecord,
  ProductMaster,
  BillOfMaterialItem,
  OperationRoutingStep,
  WorkCenter,
  MachineResource,
  ToolOrEquipment,
  FleetVehicle,
  ResourceAllocationSlot,
  MaintenanceRecord,
  ObjectStorageAttachment,
  UniversalApprovalRequest,
  CentralNotificationItem,
  CentralAuditRecord,
  ExactOperationalPermission,
  OperationalTask,
  DrillDownNode
} from '../types/operationalControl';
import { SecurityUser } from '../types/security';
import { securityService } from './securityService';

// Storage keys for persistent simulation
const STORAGE_KEYS = {
  PROJECTS: 'innovista_op_projects_v1',
  INSPECTION_PLANS: 'innovista_op_qc_plans_v1',
  INSPECTIONS: 'innovista_op_qc_inspections_v1',
  QUALITY_ALERTS: 'innovista_op_qc_alerts_v1',
  NCRS: 'innovista_op_qc_ncrs_v1',
  CAPAS: 'innovista_op_qc_capas_v1',
  TRACEABILITY: 'innovista_op_traceability_v1',
  PRODUCTS: 'innovista_op_products_v1',
  BOM_ITEMS: 'innovista_op_bom_items_v1',
  ROUTINGS: 'innovista_op_routings_v1',
  WORK_CENTERS: 'innovista_op_work_centers_v1',
  MACHINES: 'innovista_op_machines_v1',
  TOOLS: 'innovista_op_tools_v1',
  VEHICLES: 'innovista_op_vehicles_v1',
  ALLOCATIONS: 'innovista_op_allocations_v1',
  MAINTENANCE: 'innovista_op_maintenance_v1',
  ATTACHMENTS: 'innovista_op_attachments_v1',
  APPROVALS: 'innovista_op_approvals_v1',
  NOTIFICATIONS: 'innovista_op_notifications_v1',
  AUDIT_LOGS: 'innovista_op_audit_logs_v1'
};

class CentralApiGateway {
  private projects: UnifiedProjectControlRecord[] = [];
  private inspectionPlans: QualityInspectionPlan[] = [];
  private inspections: QualityInspectionExecution[] = [];
  private qualityAlerts: QualityAlert[] = [];
  private ncrs: NonConformanceReport[] = [];
  private capas: CorrectivePreventiveAction[] = [];
  private traceability: MaterialTraceabilityRecord[] = [];
  private products: ProductMaster[] = [];
  private bomItems: BillOfMaterialItem[] = [];
  private routings: OperationRoutingStep[] = [];
  private workCenters: WorkCenter[] = [];
  private machines: MachineResource[] = [];
  private tools: ToolOrEquipment[] = [];
  private vehicles: FleetVehicle[] = [];
  private allocations: ResourceAllocationSlot[] = [];
  private maintenance: MaintenanceRecord[] = [];
  private attachments: ObjectStorageAttachment[] = [];
  private approvals: UniversalApprovalRequest[] = [];
  private notifications: CentralNotificationItem[] = [];
  private auditLogs: CentralAuditRecord[] = [];

  constructor() {
    this.initializeData();
  }

  // --- Central Authorization Check (RBAC + Scope Engine) ---
  private checkPermission(user: SecurityUser | null, permission: ExactOperationalPermission, projectId?: string): void {
    if (!user) {
      throw new Error('401 Unauthorized: Session expired or missing authentication token');
    }
    // Superadmin bypass
    if (user.roleName === 'Super Administrator' || user.id === 'usr-admin-01') {
      return;
    }

    const hasPerm = securityService.hasPermission(user, permission);
    if (!hasPerm) {
      throw new Error(`403 Forbidden: User '${user.username}' lacks required permission '${permission}'`);
    }

    // Project Scope validation
    if (projectId && user.defaultScope === 'Project') {
      const allowed = user.assignedProjectIds?.includes(projectId);
      if (!allowed) {
        throw new Error(`403 Forbidden: User '${user.username}' does not have access scope to project '${projectId}'`);
      }
    }
  }

  // --- Central Audit Engine ---
  private logAudit(
    user: SecurityUser | null,
    action: CentralAuditRecord['action'],
    module: CentralAuditRecord['module'],
    recordId: string,
    recordIdentifier: string,
    oldValue: any,
    newValue: any,
    changeSummary: string
  ): void {
    const auditRecord: CentralAuditRecord = {
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      userId: user?.id || 'usr-system',
      username: user?.fullName || 'System Gateway',
      userRole: user?.roleName || 'System Service',
      userDepartment: user?.department || 'OPERATIONS',
      action,
      module,
      recordId,
      recordIdentifier,
      oldValueJson: oldValue ? JSON.stringify(oldValue) : undefined,
      newValueJson: newValue ? JSON.stringify(newValue) : undefined,
      device: typeof navigator !== 'undefined' ? navigator.userAgent : 'Server / API Node',
      ipAddress: '192.168.10.42 (Enterprise Intranet)',
      changeSummary
    };

    this.auditLogs.unshift(auditRecord);
    if (this.auditLogs.length > 500) this.auditLogs.pop();
    this.persist(STORAGE_KEYS.AUDIT_LOGS, this.auditLogs);
  }

  // --- Central Notification Engine ---
  public dispatchNotification(
    user: SecurityUser | null,
    title: string,
    message: string,
    severity: 'info' | 'warning' | 'critical',
    portal: CentralNotificationItem['linkAction']['portal'],
    entityId?: string
  ): void {
    const notif: CentralNotificationItem = {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      recipientUserId: user?.id,
      recipientRole: user?.roleName,
      title,
      message,
      channel: 'IN_APP',
      severity,
      isRead: false,
      linkAction: { portal, entityId },
      createdAt: new Date().toISOString()
    };
    this.notifications.unshift(notif);
    this.persist(STORAGE_KEYS.NOTIFICATIONS, this.notifications);
  }

  // --- 1. Project Control Center APIs ---
  public getProjects(user: SecurityUser | null): UnifiedProjectControlRecord[] {
    this.checkPermission(user, 'project.view');
    if (!user || user.roleName === 'Super Administrator' || user.defaultScope === 'Global') {
      return [...this.projects];
    }
    if (user.defaultScope === 'Project') {
      return this.projects.filter(p => user.assignedProjectIds?.includes(p.id));
    }
    return [...this.projects];
  }

  public getProjectById(user: SecurityUser | null, id: string): UnifiedProjectControlRecord | undefined {
    this.checkPermission(user, 'project.view', id);
    return this.projects.find(p => p.id === id);
  }

  public updateProjectProgress(user: SecurityUser | null, id: string, progress: number, notes?: string): UnifiedProjectControlRecord {
    this.checkPermission(user, 'project.edit', id);
    const proj = this.projects.find(p => p.id === id);
    if (!proj) throw new Error('Project not found');

    const oldVal = { progress: proj.overallProgress };
    proj.overallProgress = Math.min(100, Math.max(0, progress));
    if (proj.overallProgress === 100) proj.status = 'Closed';

    this.persist(STORAGE_KEYS.PROJECTS, this.projects);
    this.logAudit(user, 'UPDATE', 'Project Control', id, proj.projectCode, oldVal, { progress, notes }, notes || `Updated project progress to ${progress}%`);
    this.dispatchNotification(user, 'Project Progress Updated', `${proj.projectCode} progress updated to ${progress}% by ${user?.fullName}`, 'info', 'project-management', id);
    return proj;
  }

  // --- 2. Shop Floor & Task APIs ---
  public getShopFloorTasks(user: SecurityUser | null, workCenterId?: string): OperationalTask[] {
    this.checkPermission(user, 'task.view');
    const allTasks = this.projects.flatMap(p => p.tasks);
    if (workCenterId) {
      return allTasks.filter(t => t.workCenterId === workCenterId);
    }
    return allTasks;
  }

  public updateTaskProgress(
    user: SecurityUser | null,
    taskId: string,
    deltaGood: number,
    deltaScrap: number,
    hoursWorked: number,
    markComplete?: boolean
  ): OperationalTask {
    this.checkPermission(user, 'task.complete');
    for (const proj of this.projects) {
      const task = proj.tasks.find(t => t.id === taskId);
      if (task) {
        const oldState = { ...task };
        task.quantityCompleted += deltaGood;
        task.quantityScrapped += deltaScrap;
        task.actualHours += hoursWorked;
        
        if (markComplete || task.quantityCompleted >= task.quantityPlanned) {
          task.status = 'Done';
          task.completedAt = new Date().toISOString();
        } else {
          task.status = 'In Progress';
        }

        this.persist(STORAGE_KEYS.PROJECTS, this.projects);
        this.logAudit(
          user, 
          'UPDATE', 
          'Shop Floor', 
          taskId, 
          task.taskNumber, 
          oldState, 
          task, 
          `Operator ${user?.fullName} logged ${deltaGood} good parts, ${deltaScrap} scrap on ${task.taskNumber}`
        );
        return task;
      }
    }
    throw new Error('Task not found');
  }

  // --- 3. Quality Subsystem APIs ---
  public getQualityInspectionPlans(user: SecurityUser | null, projectId?: string): QualityInspectionPlan[] {
    this.checkPermission(user, 'quality.view');
    if (projectId) return this.inspectionPlans.filter(p => p.projectId === projectId);
    return [...this.inspectionPlans];
  }

  public getInspections(user: SecurityUser | null): QualityInspectionExecution[] {
    this.checkPermission(user, 'quality.view');
    return [...this.inspections];
  }

  public executeInspection(
    user: SecurityUser | null,
    inspection: Omit<QualityInspectionExecution, 'id' | 'inspectionNumber' | 'inspectionDate'>
  ): QualityInspectionExecution {
    this.checkPermission(user, 'quality.inspect', inspection.projectId);
    const newExec: QualityInspectionExecution = {
      ...inspection,
      id: `insp-${Date.now()}`,
      inspectionNumber: `INSP-2026-${String(this.inspections.length + 1).padStart(4, '0')}`,
      inspectionDate: new Date().toISOString()
    };
    this.inspections.unshift(newExec);
    this.persist(STORAGE_KEYS.INSPECTIONS, this.inspections);

    this.logAudit(
      user, 
      'CREATE', 
      'Inspections', 
      newExec.id, 
      newExec.inspectionNumber, 
      null, 
      newExec, 
      `Executed ${newExec.inspectionType} inspection with result: ${newExec.overallResult}`
    );

    if (newExec.overallResult.includes('Rejected')) {
      this.dispatchNotification(
        user,
        'Inspection Failed - Quality Alert',
        `Inspection ${newExec.inspectionNumber} rejected. Non-Conformance workflow initiated.`,
        'critical',
        'quality'
      );
    }

    return newExec;
  }

  public getQualityAlerts(user: SecurityUser | null): QualityAlert[] {
    this.checkPermission(user, 'quality.view');
    return [...this.qualityAlerts];
  }

  public triggerQualityAlert(
    user: SecurityUser | null,
    title: string,
    workStationName: string,
    description: string,
    isStopLine: boolean
  ): QualityAlert {
    this.checkPermission(user, 'quality.view'); // Shop floor operators can raise alert
    const alert: QualityAlert = {
      id: `alt-${Date.now()}`,
      alertNumber: `ALT-QA-${Date.now().toString().slice(-4)}`,
      title,
      category: isStopLine ? 'Critical Quality Defect' : 'Machine Calibration Drifting',
      severity: isStopLine ? 'CRITICAL_STOP_LINE' : 'High',
      isStopLineActive: isStopLine,
      issuedBy: user?.fullName || 'Shop Floor Operator',
      issuedAt: new Date().toISOString(),
      workStationName,
      description,
      containmentAction: isStopLine ? 'LINE HALTED. Do not process further parts until QA release.' : 'Parts quarantined pending inspection.',
      resolved: false
    };
    this.qualityAlerts.unshift(alert);
    this.persist(STORAGE_KEYS.QUALITY_ALERTS, this.qualityAlerts);

    this.logAudit(user, isStopLine ? 'STOP_LINE' : 'CREATE', 'Quality NCR', alert.id, alert.alertNumber, null, alert, `Triggered Quality Alert on ${workStationName}: ${title}`);
    this.dispatchNotification(
      user,
      isStopLine ? 'EMERGENCY: Line Stop Triggered' : 'Quality Alert Logged',
      `${title} at ${workStationName} by ${user?.fullName}`,
      isStopLine ? 'critical' : 'warning',
      'quality'
    );
    return alert;
  }

  public resolveQualityAlert(user: SecurityUser | null, alertId: string, resolutionNotes: string): QualityAlert {
    this.checkPermission(user, 'quality.approve');
    const alert = this.qualityAlerts.find(a => a.id === alertId);
    if (!alert) throw new Error('Alert not found');
    alert.resolved = true;
    alert.resolvedAt = new Date().toISOString();
    alert.resolvedBy = user?.fullName;
    alert.isStopLineActive = false;
    alert.containmentAction += ` | Resolved: ${resolutionNotes}`;

    this.persist(STORAGE_KEYS.QUALITY_ALERTS, this.qualityAlerts);
    this.logAudit(user, 'APPROVE', 'Quality NCR', alert.id, alert.alertNumber, null, alert, `Resolved Quality Alert: ${resolutionNotes}`);
    return alert;
  }

  public getNcrs(user: SecurityUser | null): NonConformanceReport[] {
    this.checkPermission(user, 'quality.view');
    return [...this.ncrs];
  }

  public createNcr(user: SecurityUser | null, ncr: Omit<NonConformanceReport, 'id' | 'ncrNumber' | 'createdAt'>): NonConformanceReport {
    this.checkPermission(user, 'quality.ncr.create', ncr.projectId);
    const newNcr: NonConformanceReport = {
      ...ncr,
      id: `ncr-${Date.now()}`,
      ncrNumber: `NCR-2026-${String(this.ncrs.length + 1).padStart(4, '0')}`,
      createdAt: new Date().toISOString()
    };
    this.ncrs.unshift(newNcr);
    this.persist(STORAGE_KEYS.NCRS, this.ncrs);

    this.logAudit(user, 'CREATE', 'Quality NCR', newNcr.id, newNcr.ncrNumber, null, newNcr, `Created NCR: ${newNcr.title} (${newNcr.defectCategory})`);
    this.dispatchNotification(user, 'New NCR Created', `${newNcr.ncrNumber}: ${newNcr.title}`, 'warning', 'quality');
    return newNcr;
  }

  public updateNcrDisposition(
    user: SecurityUser | null, 
    ncrId: string, 
    disposition: NonConformanceReport['disposition'],
    cost: number
  ): NonConformanceReport {
    this.checkPermission(user, 'quality.approve');
    const ncr = this.ncrs.find(n => n.id === ncrId);
    if (!ncr) throw new Error('NCR not found');
    const old = { disposition: ncr.disposition, status: ncr.status };
    ncr.disposition = disposition;
    ncr.dispositionApprovedBy = user?.fullName;
    ncr.costOfPoorQuality = cost;
    ncr.status = 'Disposition Assigned';

    this.persist(STORAGE_KEYS.NCRS, this.ncrs);
    this.logAudit(user, 'APPROVE', 'Quality NCR', ncr.id, ncr.ncrNumber, old, ncr, `Assigned disposition: ${disposition}`);
    return ncr;
  }

  public getCapas(user: SecurityUser | null): CorrectivePreventiveAction[] {
    this.checkPermission(user, 'quality.view');
    return [...this.capas];
  }

  public manageCapa(user: SecurityUser | null, capa: CorrectivePreventiveAction): CorrectivePreventiveAction {
    this.checkPermission(user, 'quality.capa.manage');
    const index = this.capas.findIndex(c => c.id === capa.id);
    if (index >= 0) {
      this.capas[index] = capa;
    } else {
      this.capas.unshift(capa);
    }
    this.persist(STORAGE_KEYS.CAPAS, this.capas);
    this.logAudit(user, 'UPDATE', 'Quality NCR', capa.id, capa.capaNumber, null, capa, `Updated CAPA: ${capa.title}`);
    return capa;
  }

  public getTraceability(user: SecurityUser | null): MaterialTraceabilityRecord[] {
    this.checkPermission(user, 'quality.view');
    return [...this.traceability];
  }

  // --- 4. Product & Resource Management APIs ---
  public getProducts(user: SecurityUser | null): ProductMaster[] {
    this.checkPermission(user, 'product.view');
    return [...this.products];
  }

  public getBomsForProduct(user: SecurityUser | null, productId: string): BillOfMaterialItem[] {
    this.checkPermission(user, 'product.view');
    return this.bomItems.filter(b => b.productId === productId);
  }

  public getRoutingsForProduct(user: SecurityUser | null, productId: string): OperationRoutingStep[] {
    this.checkPermission(user, 'product.view');
    return this.routings.filter(r => r.productId === productId).sort((a, b) => a.stepSequence - b.stepSequence);
  }

  public getWorkCenters(user: SecurityUser | null): WorkCenter[] {
    this.checkPermission(user, 'resource.view');
    return [...this.workCenters];
  }

  public getMachines(user: SecurityUser | null): MachineResource[] {
    this.checkPermission(user, 'resource.view');
    return [...this.machines];
  }

  public getTools(user: SecurityUser | null): ToolOrEquipment[] {
    this.checkPermission(user, 'resource.view');
    return [...this.tools];
  }

  public getVehicles(user: SecurityUser | null): FleetVehicle[] {
    this.checkPermission(user, 'resource.view');
    return [...this.vehicles];
  }

  public getAllocations(user: SecurityUser | null): ResourceAllocationSlot[] {
    this.checkPermission(user, 'resource.view');
    return [...this.allocations];
  }

  public allocateResource(user: SecurityUser | null, slot: Omit<ResourceAllocationSlot, 'id'>): ResourceAllocationSlot {
    this.checkPermission(user, 'resource.allocate', slot.projectId);
    const newSlot: ResourceAllocationSlot = {
      ...slot,
      id: `alloc-${Date.now()}`
    };
    this.allocations.push(newSlot);
    this.persist(STORAGE_KEYS.ALLOCATIONS, this.allocations);

    this.logAudit(user, 'ALLOCATE', 'Resource Engine', newSlot.id, newSlot.resourceName, null, newSlot, `Allocated ${newSlot.resourceType} ${newSlot.resourceName} to ${newSlot.projectCode}`);
    return newSlot;
  }

  public getMaintenanceRecords(user: SecurityUser | null): MaintenanceRecord[] {
    this.checkPermission(user, 'resource.view');
    return [...this.maintenance];
  }

  // --- 5. Object Storage / Documents APIs ---
  public getAttachments(user: SecurityUser | null, category?: ObjectStorageAttachment['category']): ObjectStorageAttachment[] {
    this.checkPermission(user, 'document.view');
    if (category) return this.attachments.filter(a => a.category === category);
    return [...this.attachments];
  }

  public uploadAttachment(
    user: SecurityUser | null,
    file: { name: string; sizeKb: number; mimeType: string; category: ObjectStorageAttachment['category'] }
  ): ObjectStorageAttachment {
    this.checkPermission(user, 'document.upload');
    const attachment: ObjectStorageAttachment = {
      id: `att-${Date.now()}`,
      fileName: file.name,
      fileSizeKb: file.sizeKb,
      mimeType: file.mimeType,
      storageKey: `s3://innovista-enterprise-vault/vault/${Date.now()}_${file.name}`,
      downloadUrl: `https://storage.innovista.internal/vault/${Date.now()}_${file.name}`,
      category: file.category,
      version: 'Rev A',
      uploadedBy: user?.fullName || 'Authorized User',
      uploadedAt: new Date().toISOString(),
      checksumSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      approvalStatus: 'Approved'
    };
    this.attachments.unshift(attachment);
    this.persist(STORAGE_KEYS.ATTACHMENTS, this.attachments);

    this.logAudit(user, 'CREATE', 'Documents', attachment.id, attachment.fileName, null, attachment, `Uploaded document ${attachment.fileName} to object storage`);
    return attachment;
  }

  // --- 6. Universal Approval Engine APIs ---
  public getApprovalRequests(user: SecurityUser | null): UniversalApprovalRequest[] {
    if (!user) return [];
    return [...this.approvals];
  }

  public processApprovalStep(
    user: SecurityUser | null,
    approvalId: string,
    decision: 'Approved' | 'Rejected',
    comments?: string
  ): UniversalApprovalRequest {
    if (!user) throw new Error('Unauthorized');
    const app = this.approvals.find(a => a.id === approvalId);
    if (!app) throw new Error('Approval request not found');

    const step = app.steps.find(s => s.stepOrder === app.currentStepOrder);
    if (!step) throw new Error('Active step not found');

    step.status = decision;
    step.comments = comments;
    step.decidedAt = new Date().toISOString();
    step.assignedApproverName = user.fullName;

    if (decision === 'Rejected') {
      app.status = 'Rejected';
    } else {
      if (app.currentStepOrder < app.totalSteps) {
        app.currentStepOrder += 1;
      } else {
        app.status = 'Approved';
      }
    }

    this.persist(STORAGE_KEYS.APPROVALS, this.approvals);
    this.logAudit(user, decision === 'Approved' ? 'APPROVE' : 'REJECT', 'Project Control', app.id, app.entityTitle, null, app, `Approval decision: ${decision} on step ${step.stepOrder}`);
    this.dispatchNotification(user, `Approval ${decision}`, `${app.entityTitle} was ${decision.toLowerCase()} by ${user.fullName}`, decision === 'Approved' ? 'info' : 'warning', 'executive');
    return app;
  }

  // --- 7. Central Audit Logs & Drill-Down APIs ---
  public getAuditLogs(user: SecurityUser | null): CentralAuditRecord[] {
    this.checkPermission(user, 'admin.audit.view');
    return [...this.auditLogs];
  }

  public getNotifications(user: SecurityUser | null): CentralNotificationItem[] {
    if (!user) return [];
    return [...this.notifications];
  }

  public markNotificationRead(id: string): void {
    const n = this.notifications.find(item => item.id === id);
    if (n) {
      n.isRead = true;
      this.persist(STORAGE_KEYS.NOTIFICATIONS, this.notifications);
    }
  }

  // --- Drill-down Hierarchy (Company → Dept → Project → Work Package → Task → Transaction → Document) ---
  public getDrillDownTree(user: SecurityUser | null): DrillDownNode {
    const allProjects = this.getProjects(user);

    return {
      id: 'node-company',
      level: 'company',
      name: 'Innovista Holdings Enterprise',
      code: 'INN-HQ',
      status: 'Active',
      progressPercent: 78,
      budgetAllocated: 14500000,
      actualSpent: 11200000,
      health: 'Healthy',
      metadata: {
        totalEmployees: 148,
        activeProjects: allProjects.length,
        openNcrs: this.ncrs.filter(n => n.status !== 'Closed').length
      },
      childrenCount: 3
    };
  }

  // --- External Future Procurement API Adapter Simulation ---
  public receiveExternalProcurementWebhook(
    apiKey: string,
    payload: { poNumber: string; grnNumber: string; items: { materialCode: string; qty: number; heatNo: string }[] }
  ): { status: 'SUCCESS' | 'REJECTED'; syncId: string; message: string } {
    if (!apiKey || apiKey !== 'innovista_procurement_key_2026') {
      return { status: 'REJECTED', syncId: '', message: 'Invalid API Key' };
    }
    // Automatically creates traceability records and releases material to project
    payload.items.forEach(item => {
      this.traceability.unshift({
        id: `trc-${Date.now()}-${Math.floor(Math.random()*1000)}`,
        heatNumber: item.heatNo,
        millCertificateNumber: `MC-${item.heatNo}-EN10204`,
        supplierName: 'Certified Metals Global Ltd',
        materialGrade: 'S355JR / SS316',
        batchBarcode: `BC-${item.heatNo}`,
        quantityReceived: item.qty,
        quantityConsumed: 0,
        assignedProjectCode: 'PRJ-2026-001',
        drawingReference: 'DWG-MET-082',
        ndtReportRef: 'NDT-UT-PASS-091',
        inspectionPassed: true
      });
    });
    this.persist(STORAGE_KEYS.TRACEABILITY, this.traceability);
    return {
      status: 'SUCCESS',
      syncId: `sync-${Date.now()}`,
      message: `Inbound GRN ${payload.grnNumber} ingested into material traceability engine.`
    };
  }

  // --- Persistence Helper ---
  private persist(key: string, data: any): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(data));
      }
    } catch {
      // Storage quota resilience
    }
  }

  private load<T>(key: string, fallback: T): T {
    try {
      if (typeof localStorage !== 'undefined') {
        const item = localStorage.getItem(key);
        if (item) return JSON.parse(item);
      }
    } catch {
      // ignore
    }
    return fallback;
  }

  // --- Seed Initialization ---
  private initializeData(): void {
    // 1. Projects
    this.projects = this.load<UnifiedProjectControlRecord[]>(STORAGE_KEYS.PROJECTS, [
      {
        id: 'proj-001',
        projectCode: 'PRJ-2026-001',
        name: 'Dubai Marina Luxury Architectural Canopy',
        clientName: 'Emaar Development PJSC',
        branch: 'Dubai South Fabrication Yard',
        status: 'Fabrication',
        health: 'Healthy',
        overallProgress: 68,
        startDate: '2026-01-10',
        targetCompletionDate: '2026-11-30',
        contract: {
          contractNumber: 'CNT-2026-EMAAR-09',
          clientName: 'Emaar Development PJSC',
          contractValue: 4850000,
          effectiveDate: '2026-01-10',
          completionDate: '2026-11-30',
          paymentTerms: '30 Days Net, Milestone Progress Billing',
          retentionPercent: 10,
          penaltyClause: '0.1% per calendar day capped at 10%'
        },
        scopeSummary: 'Structural stainless steel bespoke canopy, laser cut decorative filigree, structural glass glazing and integrated LED channels.',
        boqSummary: {
          totalItems: 42,
          totalMaterialWeightKg: 38500,
          boqValue: 4850000
        },
        budget: {
          allocatedMaterial: 1950000,
          allocatedLabor: 980000,
          allocatedMachine: 520000,
          allocatedOverhead: 350000,
          contingency: 250000,
          totalBudget: 4050000
        },
        costs: {
          actualMaterial: 1820000,
          actualLabor: 640000,
          actualMachine: 380000,
          actualSubcontract: 110000,
          totalActual: 2950000,
          variance: 1100000
        },
        workPackages: [
          {
            id: 'wp-01',
            projectId: 'proj-001',
            code: 'WP-01-FOUNDATION',
            name: 'Base Plates & Anchor Bolt Assemblies',
            scopeSummary: 'Heavy plate cutting, drilling, and anchor bolt galvanizing',
            leadEngineer: 'Marcus Sterling',
            status: 'Completed',
            startDate: '2026-01-15',
            dueDate: '2026-03-01',
            progress: 100,
            budgetAmount: 450000,
            actualCost: 412000,
            tasksCount: 4
          },
          {
            id: 'wp-02',
            projectId: 'proj-001',
            code: 'WP-02-CANTILEVER',
            name: 'Primary Box Girder & Cantilever Arms',
            scopeSummary: 'Submerged arc welding, box girder fit-up, and Ultrasonic NDT',
            leadEngineer: 'Julian Chen',
            status: 'In Progress',
            startDate: '2026-03-05',
            dueDate: '2026-08-15',
            progress: 72,
            budgetAmount: 1850000,
            actualCost: 1420000,
            tasksCount: 8
          },
          {
            id: 'wp-03',
            projectId: 'proj-001',
            code: 'WP-03-CLADDING',
            name: 'Decorative Perforated SS Panels',
            scopeSummary: 'Fiber laser perforations, robotic bending, and PVD titanium coating',
            leadEngineer: 'David Okafor',
            status: 'In Progress',
            startDate: '2026-06-01',
            dueDate: '2026-10-15',
            progress: 45,
            budgetAmount: 1200000,
            actualCost: 650000,
            tasksCount: 6
          }
        ],
        milestones: [
          { id: 'm-01', projectId: 'proj-001', name: 'Engineering Submittals & IFC Drawings', targetDate: '2026-02-15', actualDate: '2026-02-12', status: 'Achieved', billingTriggerPercent: 15, billingAmount: 727500 },
          { id: 'm-02', projectId: 'proj-001', name: 'Raw Material Delivery & Mill Certs Validation', targetDate: '2026-03-30', actualDate: '2026-03-28', status: 'Achieved', billingTriggerPercent: 20, billingAmount: 970000 },
          { id: 'm-03', projectId: 'proj-001', name: 'Factory Acceptance Test (FAT) 50% Assembly', targetDate: '2026-07-20', status: 'On Track', billingTriggerPercent: 25, billingAmount: 1212500 },
          { id: 'm-04', projectId: 'proj-001', name: 'Site Delivery & Structural Erection', targetDate: '2026-10-15', status: 'Pending', billingTriggerPercent: 30, billingAmount: 1455000 },
          { id: 'm-05', projectId: 'proj-001', name: 'Final Handover & Warranty Sign-Off', targetDate: '2026-11-30', status: 'Pending', billingTriggerPercent: 10, billingAmount: 485000 }
        ],
        tasks: [
          {
            id: 'tsk-01',
            workPackageId: 'wp-02',
            projectId: 'proj-001',
            taskNumber: 'JOB-2026-104',
            title: 'MIG Welding of Cantilever Flange Joint #4',
            description: 'Execute multi-pass MIG welding per WPS-04. 100% visual inspection and dye penetrant test mandatory.',
            assignedToName: 'Hamdan Al-Sayed (Certified Welder 6G)',
            workCenterId: 'wc-weld-01',
            workCenterName: 'Heavy Welding Bay A',
            priority: 'High',
            status: 'In Progress',
            plannedHours: 32,
            actualHours: 21.5,
            quantityPlanned: 12,
            quantityCompleted: 8,
            quantityScrapped: 0
          },
          {
            id: 'tsk-02',
            workPackageId: 'wp-03',
            projectId: 'proj-001',
            taskNumber: 'JOB-2026-105',
            title: 'CNC Laser Cutting of 3mm Filigree Screens',
            description: 'Fiber laser cut Grade 316 panels per CAD drawing DWG-PAN-44. Nitrogen assist gas.',
            assignedToName: 'Rami Varma (Laser Specialist)',
            workCenterId: 'wc-cnc-01',
            workCenterName: 'CNC Laser & Plasma Center',
            priority: 'Medium',
            status: 'Ready',
            plannedHours: 40,
            actualHours: 0,
            quantityPlanned: 64,
            quantityCompleted: 0,
            quantityScrapped: 0
          },
          {
            id: 'tsk-03',
            workPackageId: 'wp-02',
            projectId: 'proj-001',
            taskNumber: 'JOB-2026-106',
            title: 'Ultrasonic NDT on Flange Butt Welds',
            description: 'Third-party ASNT Level II ultrasonic flaw detection on critical tension welds.',
            assignedToName: 'David Okafor (QA Inspector)',
            workCenterId: 'wc-qc-01',
            workCenterName: 'NDT & Inspection Zone',
            priority: 'Critical',
            status: 'Ready',
            plannedHours: 16,
            actualHours: 0,
            quantityPlanned: 24,
            quantityCompleted: 0,
            quantityScrapped: 0
          }
        ],
        issues: [
          {
            id: 'iss-01',
            projectId: 'proj-001',
            issueNumber: 'ISS-082',
            title: 'Subcontractor PVD coating chamber delayed by 4 days',
            severity: 'Moderate',
            status: 'Mitigated',
            reportedBy: 'Julian Chen',
            reportedDate: '2026-07-02',
            assignedTo: 'Marcus Sterling',
            resolutionPlan: 'Re-routed batch to alternative accredited coater in Sharjah.'
          }
        ],
        variations: [
          {
            id: 'var-01',
            projectId: 'proj-001',
            variationNumber: 'VO-PRJ-01',
            title: 'Addition of concealed RGBW linear lighting extrusion channels',
            reason: 'Architectural aesthetic upgrade by Client design team',
            requestedBy: 'Emaar Lead Architect',
            costImpact: 145000,
            timeImpactDays: 5,
            approvalStatus: 'Client Approved',
            dateSubmitted: '2026-04-12'
          }
        ],
        payments: [
          { id: 'pay-01', projectId: 'proj-001', invoiceNumber: 'INV-2026-0041', milestoneName: 'Engineering Submittals & IFC Drawings', amount: 727500, dueDate: '2026-03-15', paidDate: '2026-03-10', status: 'Paid' },
          { id: 'pay-02', projectId: 'proj-001', invoiceNumber: 'INV-2026-0089', milestoneName: 'Raw Material Delivery & Mill Certs', amount: 970000, dueDate: '2026-04-30', paidDate: '2026-04-25', status: 'Paid' },
          { id: 'pay-03', projectId: 'proj-001', invoiceNumber: 'INV-2026-0142', milestoneName: 'FAT 50% Assembly Progress', amount: 1212500, dueDate: '2026-08-20', status: 'Invoiced' }
        ],
        activeHoldCount: 0,
        openNcrCount: 1,
        documentsCount: 28
      }
    ]);

    // 2. Inspection Plans
    this.inspectionPlans = this.load<QualityInspectionPlan[]>(STORAGE_KEYS.INSPECTION_PLANS, [
      {
        id: 'plan-01',
        planNumber: 'ITP-WELD-001',
        projectId: 'proj-001',
        title: 'Structural Steel Welded Assembly Inspection & Test Plan',
        inspectionType: 'Welding & NDT',
        standardReference: 'AWS D1.1 / ISO 5817 Level B',
        frequency: '100% Full Inspection',
        mandatoryHoldPoint: true,
        assignedInspectorName: 'David Okafor',
        status: 'Active',
        checklistItemsCount: 6
      },
      {
        id: 'plan-02',
        planNumber: 'ITP-COAT-002',
        projectId: 'proj-001',
        title: 'Architectural Powder & PVD Coating Inspection Plan',
        inspectionType: 'Surface Coating & Paint',
        standardReference: 'Qualicoat Class 2 / ISO 2808',
        frequency: 'Sample 10%',
        mandatoryHoldPoint: false,
        assignedInspectorName: 'David Okafor',
        status: 'Active',
        checklistItemsCount: 5
      }
    ]);

    // 3. Inspections
    this.inspections = this.load<QualityInspectionExecution[]>(STORAGE_KEYS.INSPECTIONS, [
      {
        id: 'insp-01',
        inspectionNumber: 'INSP-2026-0042',
        planId: 'plan-01',
        projectId: 'proj-001',
        productBatchNumber: 'BATCH-FLANGE-441',
        inspectorName: 'David Okafor',
        inspectionDate: '2026-09-18T10:30:00Z',
        inspectionType: 'Welding & NDT',
        overallResult: 'Passed',
        findings: 'Full root penetration confirmed via ultrasonic testing. Zero porosity or cracks detected.',
        checkResults: [
          { checkpointId: 'cp-1', passed: true, recordedValue: 'Leg length 8.2mm (Spec: 8.0mm ±0.5)' },
          { checkpointId: 'cp-2', passed: true, recordedValue: '100% UT clear' }
        ],
        attachments: [],
        approvedBy: 'Alexander Vance',
        approvedAt: '2026-09-18T14:00:00Z'
      }
    ]);

    // 4. Quality Alerts
    this.qualityAlerts = this.load<QualityAlert[]>(STORAGE_KEYS.QUALITY_ALERTS, [
      {
        id: 'alt-01',
        alertNumber: 'ALT-QA-901',
        projectId: 'proj-001',
        title: 'Shielding gas mixture ratio deviation on MIG Station 2',
        category: 'Machine Calibration Drifting',
        severity: 'Warning',
        isStopLineActive: false,
        issuedBy: 'Hamdan Al-Sayed',
        issuedAt: '2026-09-22T08:15:00Z',
        workStationName: 'Heavy Welding Bay A',
        description: 'Argon/CO2 flowmeter fluctuated below 15 L/min. Regulator replaced immediately.',
        containmentAction: 'Re-tested welds with dye penetrant. No defects propagated.',
        resolved: true,
        resolvedAt: '2026-09-22T09:30:00Z',
        resolvedBy: 'David Okafor'
      }
    ]);

    // 5. NCRs
    this.ncrs = this.load<NonConformanceReport[]>(STORAGE_KEYS.NCRS, [
      {
        id: 'ncr-01',
        ncrNumber: 'NCR-2026-0018',
        projectId: 'proj-001',
        title: 'Perforated bracket pitch deviation on Screen Panel #14',
        severity: 'Minor',
        status: 'Disposition Assigned',
        source: 'Workshop Line',
        defectCategory: 'Dimensional Deviation',
        description: 'Center-to-center hole pitch measured 154mm against drawing requirement of 150mm ±1.0mm.',
        suspectQuantity: 4,
        quarantineLocation: 'Yellow Quarantine Bay QC-02',
        rootCauseAnalysis: 'Operator loaded wrong CNC G-code sub-routine revision file (Rev A instead of Rev B).',
        disposition: 'Rework',
        dispositionApprovedBy: 'Alexander Vance',
        costOfPoorQuality: 2800,
        capaRequired: true,
        createdAt: '2026-09-20T11:00:00Z'
      }
    ]);

    // 6. CAPAs
    this.capas = this.load<CorrectivePreventiveAction[]>(STORAGE_KEYS.CAPAS, [
      {
        id: 'capa-01',
        capaNumber: 'CAPA-2026-005',
        ncrId: 'ncr-01',
        projectId: 'proj-001',
        title: 'CNC G-code Automated Revision Interlock',
        status: 'Action Plan',
        leadInvestigator: 'Julian Chen',
        targetCompletionDate: '2026-10-15',
        rootCauseSummary: 'Operator manually selected older file from local machine USB drive instead of pulling live released file from Central Document Server.',
        correctiveActions: [
          { action: 'Scrap defective brackets and re-cut under active Rev B file', owner: 'Rami Varma', dueDate: '2026-09-25', completed: true },
          { action: 'Disable local USB ports on CNC controller and force network DNC link', owner: 'IT Systems Admin', dueDate: '2026-10-05', completed: false }
        ],
        preventiveActions: [
          { action: 'Implement barcode scan on Job Card that automatically loads exact approved CNC program', owner: 'Julian Chen', dueDate: '2026-10-15', completed: false }
        ]
      }
    ]);

    // 7. Traceability
    this.traceability = this.load<MaterialTraceabilityRecord[]>(STORAGE_KEYS.TRACEABILITY, [
      {
        id: 'trc-01',
        heatNumber: 'HEAT-7782-SS316',
        millCertificateNumber: 'MILL-OUTOKUMPU-98214',
        supplierName: 'Outokumpu Stainless Oy',
        materialGrade: 'Grade SS316L (1.4404)',
        batchBarcode: 'BC-SS316-7782',
        quantityReceived: 4500,
        quantityConsumed: 3200,
        assignedProjectCode: 'PRJ-2026-001',
        drawingReference: 'DWG-CANOPY-P01',
        ndtReportRef: 'PMI-XRF-PASS-221',
        inspectionPassed: true
      },
      {
        id: 'trc-02',
        heatNumber: 'HEAT-9904-S355',
        millCertificateNumber: 'MILL-EMIRATES-STEEL-440',
        supplierName: 'Emirates Steel Arkan',
        materialGrade: 'Structural Steel S355JR',
        batchBarcode: 'BC-S355-9904',
        quantityReceived: 32000,
        quantityConsumed: 28500,
        assignedProjectCode: 'PRJ-2026-001',
        drawingReference: 'DWG-CANOPY-G01',
        ndtReportRef: 'CHARPY-V-PASS-88',
        inspectionPassed: true
      }
    ]);

    // 8. Products
    this.products = this.load<ProductMaster[]>(STORAGE_KEYS.PRODUCTS, [
      {
        id: 'prd-01',
        productCode: 'PRD-CANOPY-ARCH-01',
        name: 'Aerodynamic Cantilever Canopy Module 6m x 4m',
        category: 'Architectural Metal',
        standardUnit: 'SET',
        currentRevision: 'Rev C',
        activeVariantsCount: 4,
        drawingNumber: 'CAD-INN-CNP-001-C',
        specificationSummary: 'High-tensile Grade 316 stainless steel frame with integrated rainwater gutter and double laminated tempered glass rebate.',
        baseMaterialGrade: 'SS316L & S355JR',
        leadTimeDays: 28,
        standardCostEst: 95000,
        status: 'Active'
      },
      {
        id: 'prd-02',
        productCode: 'PRD-LOUVER-PERF-02',
        name: 'Acoustic Motorized Sun Louver System',
        category: 'Façade Cladding',
        standardUnit: 'SQM',
        currentRevision: 'Rev B',
        activeVariantsCount: 6,
        drawingNumber: 'CAD-INN-LVR-002-B',
        specificationSummary: 'Extruded aluminum aerofoil louvers with internal acoustic rockwool damping and linear actuator integration.',
        baseMaterialGrade: 'Alloy 6063-T6',
        leadTimeDays: 21,
        standardCostEst: 1450,
        status: 'Active'
      }
    ]);

    // 9. Work Centers
    this.workCenters = this.load<WorkCenter[]>(STORAGE_KEYS.WORK_CENTERS, [
      { id: 'wc-cnc-01', code: 'WC-LASER-01', name: 'High-Power Fiber Laser Cutting Center', department: 'OPERATIONS', location: 'Bay 1 North', dailyCapacityHours: 20, hourlyCostRate: 180, activeWorkers: 2, status: 'Operational' },
      { id: 'wc-weld-01', code: 'WC-WELD-01', name: 'Heavy Structural MIG & TIG Welding Bay', department: 'OPERATIONS', location: 'Bay 2 Central', dailyCapacityHours: 16, hourlyCostRate: 140, activeWorkers: 6, status: 'Operational' },
      { id: 'wc-coat-01', code: 'WC-SURF-01', name: 'Automated Sandblast & Liquid Coating Line', department: 'OPERATIONS', location: 'Bay 3 South', dailyCapacityHours: 16, hourlyCostRate: 220, activeWorkers: 4, status: 'Operational' },
      { id: 'wc-qc-01', code: 'WC-NDT-01', name: 'Quality Metrology & Non-Destructive Testing Lab', department: 'OPERATIONS', location: 'QA Clean Room', dailyCapacityHours: 12, hourlyCostRate: 110, activeWorkers: 2, status: 'Operational' }
    ]);

    // 10. Machines
    this.machines = this.load<MachineResource[]>(STORAGE_KEYS.MACHINES, [
      { id: 'm-01', workCenterId: 'wc-cnc-01', machineCode: 'CNC-FIBER-12KW', name: 'Trumpf TruLaser 5030 12kW Fiber Laser', brandModel: 'Trumpf 5030', serialNumber: 'TR-2024-998', tonnageOrSpec: '12,000 Watts / 3000x1500 Bed', installationDate: '2024-03-15', status: 'Running', utilizationRatePercent: 88, lastCalibrationDate: '2026-06-01', nextCalibrationDue: '2026-12-01', totalOperatingHours: 4820 },
      { id: 'm-02', workCenterId: 'wc-weld-01', machineCode: 'ROBOT-MIG-01', name: 'KUKA 6-Axis Robotic Arc Welder Station', brandModel: 'KUKA KR Cybertech', serialNumber: 'KU-88712', tonnageOrSpec: '6-Axis / Fronius TPS 500i', installationDate: '2024-08-10', status: 'Running', utilizationRatePercent: 92, lastCalibrationDate: '2026-08-15', nextCalibrationDue: '2027-02-15', totalOperatingHours: 3650 }
    ]);

    // 11. Tools & Vehicles
    this.tools = this.load<ToolOrEquipment[]>(STORAGE_KEYS.TOOLS, [
      { id: 't-01', code: 'TOOL-UT-01', name: 'Olympus Epoch 650 Ultrasonic Flaw Detector', type: 'Precision Measuring Tool', location: 'QA Lab Safe 1', status: 'Available', calibrationDueDate: '2026-11-20' },
      { id: 't-02', code: 'TOOL-XRF-02', name: 'Thermo Niton XL2 XRF Material Analyzer (PMI)', type: 'Precision Measuring Tool', location: 'QA Lab Safe 2', status: 'Available', calibrationDueDate: '2026-12-15' }
    ]);

    this.vehicles = this.load<FleetVehicle[]>(STORAGE_KEYS.VEHICLES, [
      { id: 'v-01', vehicleCode: 'TRUCK-FLAT-01', plateNumber: 'DXB-C-9821', model: 'Mercedes-Benz Actros 3340', type: 'Heavy Flatbed Truck', capacityTon: 35, status: 'Depot Ready', assignedDriver: 'Kareem Mansoor', fuelCardNumber: 'ENOC-8871-01', insuranceExpiry: '2027-04-15' }
    ]);

    // 12. Allocations
    this.allocations = this.load<ResourceAllocationSlot[]>(STORAGE_KEYS.ALLOCATIONS, [
      { id: 'alc-01', resourceType: 'Machine', resourceId: 'm-01', resourceName: 'Trumpf TruLaser 12kW', projectId: 'proj-001', projectCode: 'PRJ-2026-001', startDate: '2026-09-20', endDate: '2026-10-05', allocatedHours: 120, allocatedPercent: 85 }
    ]);

    // 13. Maintenance
    this.maintenance = this.load<MaintenanceRecord[]>(STORAGE_KEYS.MAINTENANCE, [
      { id: 'mnt-01', resourceCode: 'CNC-FIBER-12KW', resourceName: 'Trumpf TruLaser 12kW', maintenanceType: 'Preventive Schedule', scheduledDate: '2026-09-28', cost: 3500, technician: 'Trumpf Service Engineer', partsReplaced: 'Protective optical window & nozzle ceramic', status: 'Scheduled' }
    ]);

    // 14. Universal Approvals
    this.approvals = this.load<UniversalApprovalRequest[]>(STORAGE_KEYS.APPROVALS, [
      {
        id: 'app-01',
        entityType: 'VARIATION_ORDER',
        entityId: 'var-01',
        entityTitle: 'VO-PRJ-01: Concealed LED Extrusion Upgrade',
        projectCode: 'PRJ-2026-001',
        financialAmount: 145000,
        requestedBy: 'Marcus Sterling',
        submittedAt: '2026-09-21T14:30:00Z',
        currentStepOrder: 2,
        totalSteps: 3,
        status: 'Pending',
        steps: [
          { stepOrder: 1, requiredRoleOrPermission: 'project.approve', assignedApproverName: 'Marcus Sterling (PM)', status: 'Approved', comments: 'Schedule validated with no critical path impact.', decidedAt: '2026-09-21T15:00:00Z' },
          { stepOrder: 2, requiredRoleOrPermission: 'finance.approve', assignedApproverName: 'Elena Rostova (Finance)', status: 'Pending', comments: 'Checking client credit and variation advance payment terms.' },
          { stepOrder: 3, requiredRoleOrPermission: 'admin.users.manage', assignedApproverName: 'Alexander Vance (MD)', status: 'Pending' }
        ]
      }
    ]);

    // 15. Attachments
    this.attachments = this.load<ObjectStorageAttachment[]>(STORAGE_KEYS.ATTACHMENTS, [
      {
        id: 'att-01',
        fileName: 'DWG-CANOPY-GEN-REV-C.dwg.pdf',
        fileSizeKb: 4820,
        mimeType: 'application/pdf',
        storageKey: 's3://innovista-enterprise-vault/drawings/PRJ-001/DWG-CANOPY-GEN-REV-C.pdf',
        downloadUrl: 'https://storage.innovista.internal/drawings/PRJ-001/DWG-CANOPY-GEN-REV-C.pdf',
        category: 'CAD Drawing',
        version: 'Rev C',
        uploadedBy: 'Julian Chen',
        uploadedAt: '2026-09-15T09:00:00Z',
        approvalStatus: 'Approved'
      }
    ]);

    // 16. Audit Logs
    this.auditLogs = this.load<CentralAuditRecord[]>(STORAGE_KEYS.AUDIT_LOGS, [
      {
        id: 'aud-001',
        timestamp: '2026-09-23T08:30:00Z',
        userId: 'usr-admin-01',
        username: 'Alexander Vance',
        userRole: 'Super Administrator',
        userDepartment: 'COMMERCIAL_ADMIN',
        action: 'APPROVE',
        module: 'Quality NCR',
        recordId: 'ncr-01',
        recordIdentifier: 'NCR-2026-0018',
        device: 'Workstation Chrome (Win11)',
        ipAddress: '192.168.10.12',
        changeSummary: 'Approved rework disposition for perforated brackets'
      }
    ]);
  }
}

export const centralApiGateway = new CentralApiGateway();
