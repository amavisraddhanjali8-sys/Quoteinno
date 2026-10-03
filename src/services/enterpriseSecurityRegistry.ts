// ============================================================================
// INNOVISTA CENTRAL AUTHORIZATION REGISTRY & ENTERPRISE SEED DATA
// Portals, User Types, 35 Access Templates, Organizations, Branches,
// Project/Factory Scopes, Record-Level Grants, Connected APIs & Policies
// ============================================================================

import {
  PortalRegistryEntry,
  UserTypeDefinition,
  PermissionTemplate,
  ExternalOrganization,
  BranchDefinition,
  ProjectUserAssignment,
  FactoryUserAssignment,
  RecordLevelAccessGrant,
  ConnectedApplicationClient,
  BreakGlassEmergencySession,
  SecurityPolicyConfiguration,
  ApiScopeCode
} from '../types/security';

export const ALL_API_SCOPES: { code: ApiScopeCode; domain: string; label: string; risk: 'Low' | 'Medium' | 'High' | 'Critical' }[] = [
  { code: 'project:read', domain: 'project', label: 'Read Project Charters, WBS & Schedules', risk: 'Low' },
  { code: 'project:write', domain: 'project', label: 'Mutate Project Progress, Variations & Milestones', risk: 'High' },
  { code: 'factory:read', domain: 'factory', label: 'Read Factory Work Orders, Bays & Cutting Lists', risk: 'Low' },
  { code: 'factory:write', domain: 'factory', label: 'Update Fabrication Tasks, Worksheets & Dispatches', risk: 'Medium' },
  { code: 'quality:read', domain: 'quality', label: 'Read ITPs, Inspections, MTCs & NCR Status', risk: 'Low' },
  { code: 'quality:write', domain: 'quality', label: 'Submit QC Inspections, Raise NCRs & Dispositions', risk: 'High' },
  { code: 'hse:read', domain: 'hse', label: 'Read PTW Work Permits, JSA & Safety Logs', risk: 'Low' },
  { code: 'hse:write', domain: 'hse', label: 'Issue Work Permits, Log Incidents & Stop-Work', risk: 'High' },
  { code: 'inventory:read', domain: 'inventory', label: 'Read Warehouse Stock, GRNs & Reorder Levels', risk: 'Low' },
  { code: 'inventory:write', domain: 'inventory', label: 'Post Stock Movements, Issue Materials & Scrap', risk: 'High' },
  { code: 'accounting:read', domain: 'accounting', label: 'Read GL Balances, AR/AP & Financial Statements', risk: 'High' },
  { code: 'accounting:write', domain: 'accounting', label: 'Post Journal Vouchers, Approve Payments & PVC', risk: 'Critical' },
  { code: 'hr:read', domain: 'hr', label: 'Read Employee Directory, Shifts & Biometric Punches', risk: 'Medium' },
  { code: 'hr:write', domain: 'hr', label: 'Write Biometric Attendance, Loans & Paysheets', risk: 'Critical' },
  { code: 'documents:read', domain: 'documents', label: 'Read Controlled AFC Drawings & Method Statements', risk: 'Low' },
  { code: 'documents:write', domain: 'documents', label: 'Upload Revisions, Approve Transmittals & Archive', risk: 'Medium' },
  { code: 'reports:read', domain: 'reports', label: 'View Executive KPIs, Aging & Variance Analytics', risk: 'Medium' },
  { code: 'reports:export', domain: 'reports', label: 'Export Bulk Financial, BOQ & Audit Datasets', risk: 'High' },
  { code: 'users:read', domain: 'users', label: 'Read User Profiles, Departments & Org Hierarchy', risk: 'Medium' },
  { code: 'roles:read', domain: 'roles', label: 'Inspect RBAC Role Definitions & Templates', risk: 'Medium' },
  { code: 'permissions:verify', domain: 'permissions', label: 'Invoke Central Permission Evaluation Engine', risk: 'Low' },
  { code: 'system:health', domain: 'system', label: 'Read Gateway Telemetry, Policies & Audit Stream', risk: 'Critical' }
];

// ============================================================================
// 1. CENTRAL PORTAL REGISTRY (22 REGISTERED PORTALS)
// ============================================================================
export const SEED_PORTAL_REGISTRY: PortalRegistryEntry[] = [
  {
    portalId: 'company-control-center',
    portalName: 'Company Control Center (Home Hub)',
    shortName: 'Control Center',
    category: 'Core Enterprise',
    appViewTarget: 'home',
    moduleHierarchy: [
      {
        moduleId: 'mod-home-launcher',
        moduleName: 'Universal Portal Directory',
        features: ['Portal Cards Launcher', 'Quick Action Hub', 'Enterprise Pulse'],
        availableActions: ['view', 'execute'],
        permissionPrefix: 'project'
      }
    ],
    availableActions: ['view', 'execute'],
    requiredPermissions: ['project.view'],
    supportedScopes: ['Global', 'Organization', 'Branch', 'Department', 'Project', 'Factory'],
    apiEndpoints: ['GET /api/v1/portal-directory', 'GET /api/v1/pulse-metrics'],
    sensitiveOperations: ['System Snapshot PDF Export'],
    requiredRoles: ['SUPER_ADMIN', 'SYSTEM_ADMIN', 'EXECUTIVE', 'OPERATIONS_MANAGER', 'PROJECT_MANAGER'],
    auditEvents: ['PORTAL_LAUNCHED', 'SNAPSHOT_EXPORTED'],
    dependentServices: ['securityService', 'centralApiGateway']
  },
  {
    portalId: 'executive-dashboard',
    portalName: 'Executive Multi-Perspective Cockpit',
    shortName: 'Executive',
    category: 'Core Enterprise',
    appViewTarget: 'dashboard',
    moduleHierarchy: [
      {
        moduleId: 'mod-exec-kpi',
        moduleName: '7-Perspective Board Analytics',
        features: ['Executive P&L', 'Finance Cashflow', 'Operations Velocity', 'Quality FTPR', 'CRM Pipeline'],
        availableActions: ['view', 'export', 'print'],
        permissionPrefix: 'mgmt_report'
      }
    ],
    availableActions: ['view', 'export', 'print', 'configure'],
    requiredPermissions: ['mgmt_report.view', 'proj_report.view'],
    supportedScopes: ['Global', 'Branch', 'Department'],
    apiEndpoints: ['GET /api/v1/executive/kpis', 'POST /api/v1/executive/export'],
    sensitiveOperations: ['Board Margin Override', 'Bulk BOM Price Simulation'],
    requiredRoles: ['SUPER_ADMIN', 'EXECUTIVE', 'MANAGING_DIRECTOR', 'FINANCE_MANAGER', 'OPERATIONS_MANAGER'],
    auditEvents: ['DATA_EXPORT', 'CONFIDENTIAL_ACCESS'],
    dependentServices: ['centralApiGateway', 'accountingControlService', 'bomPricingService']
  },
  {
    portalId: 'project-management',
    portalName: 'Project Management & Lifecycle WBS',
    shortName: 'Projects',
    category: 'Engineering & Projects',
    appViewTarget: 'projects',
    operationalSubPortal: 'project_management',
    moduleHierarchy: [
      {
        moduleId: 'mod-proj-charter',
        moduleName: 'Project Directory & Charters',
        features: ['Project Creation', 'Milestone Billing Tiers', 'Contract Sum & Retention'],
        availableActions: ['view', 'create', 'edit', 'delete', 'approve', 'assign', 'close', 'reopen'],
        permissionPrefix: 'project'
      },
      {
        moduleId: 'mod-proj-wbs',
        moduleName: 'WBS Phases, Gantt & Risk Register',
        features: ['WBS Phase Gates', 'Interactive Gantt', 'Risk Matrix', 'Handover TOC Protocol'],
        availableActions: ['view', 'create', 'edit', 'approve', 'submit', 'export'],
        permissionPrefix: 'planning'
      },
      {
        moduleId: 'mod-proj-variations',
        moduleName: 'Variation Order (VO) Engine',
        features: ['Additions & Omissions', 'Cost Variance Evaluation', 'Post-Mortem Analysis'],
        availableActions: ['view', 'create', 'edit', 'approve', 'reject', 'print'],
        permissionPrefix: 'execution'
      }
    ],
    availableActions: ['view', 'create', 'edit', 'delete', 'approve', 'reject', 'submit', 'assign', 'reassign', 'export', 'print', 'close', 'reopen'],
    requiredPermissions: ['project.view', 'planning.view', 'execution.view'],
    supportedScopes: ['Global', 'Branch', 'Department', 'Project', 'Assigned Records'],
    apiEndpoints: ['GET /api/v1/projects', 'POST /api/v1/projects', 'PATCH /api/v1/projects/:id/progress', 'POST /api/v1/projects/:id/variations'],
    sensitiveOperations: ['Contract Sum Modification', 'Variation Approval', 'Project Deletion'],
    requiredRoles: ['PROJECT_MANAGER', 'OPERATIONS_MANAGER', 'PROJECT_ENGINEER', 'QS', 'SITE_SUPERVISOR'],
    auditEvents: ['PROJECT_ASSIGNED', 'VARIATION_APPROVED', 'PROJECT_STATUS_CHANGED'],
    dependentServices: ['centralApiGateway', 'costEvaluationService']
  },
  {
    portalId: 'construction-site-management',
    portalName: 'Construction Site & Field Operations',
    shortName: 'Site Control',
    category: 'Engineering & Projects',
    appViewTarget: 'site-management',
    operationalSubPortal: 'shop_floor',
    moduleHierarchy: [
      {
        moduleId: 'mod-site-execution',
        moduleName: 'Site Erection, WIR & Daily Logs',
        features: ['Elevation Installation Tracking', 'Site Diary', 'Subcontractor SCN Verification'],
        availableActions: ['view', 'create', 'edit', 'submit', 'approve', 'upload'],
        permissionPrefix: 'site'
      }
    ],
    availableActions: ['view', 'create', 'edit', 'submit', 'approve', 'reject', 'assign', 'upload', 'print'],
    requiredPermissions: ['site.view', 'execution.view'],
    supportedScopes: ['Global', 'Branch', 'Project', 'Assigned Records'],
    apiEndpoints: ['GET /api/v1/sites', 'POST /api/v1/sites/daily-logs', 'POST /api/v1/sites/wir-inspection'],
    sensitiveOperations: ['Site Handover Sign-Off', 'Emergency Stop-Work Order'],
    requiredRoles: ['SITE_MANAGER', 'SITE_SUPERVISOR', 'SITE_ENGINEER', 'PROJECT_MANAGER', 'HSE_OFFICER'],
    auditEvents: ['SITE_PERMIT_ISSUED', 'SITE_WIR_APPROVED'],
    dependentServices: ['safetyControlService', 'factoryExecutionService']
  },
  {
    portalId: 'factory-workshop-management',
    portalName: 'Factory & Workshop Execution Control (11 Sub-Portals)',
    shortName: 'Factories',
    category: 'Factory & Operations',
    appViewTarget: 'operational-control',
    operationalSubPortal: 'factories',
    moduleHierarchy: [
      {
        moduleId: 'mod-fac-registry',
        moduleName: 'Factories Master & Project Assignment',
        features: ['Factory Cards Grid', 'Assign Project to Factory', '18 Fabrication Capabilities', 'Production Bays'],
        availableActions: ['view', 'create', 'edit', 'assign', 'reassign', 'configure'],
        permissionPrefix: 'execution'
      },
      {
        moduleId: 'mod-fac-tasks',
        moduleName: 'Work Packages, Plans & Shop-Floor Tasks',
        features: ['Execution Plan Phases', 'Work Orders & Job Cards', 'Universal Task File Upload', '16-Stage Gate'],
        availableActions: ['view', 'create', 'edit', 'submit', 'approve', 'reject', 'upload', 'download', 'execute', 'close'],
        permissionPrefix: 'execution'
      },
      {
        moduleId: 'mod-fac-worksheets',
        moduleName: 'Digital Worksheets, Daily Reports & Evidence',
        features: ['9 Fabrication Worksheet Types', 'Daily Factory Activity Reports', 'Geo-Tagged Photo/Video Evidence'],
        availableActions: ['view', 'create', 'edit', 'approve', 'upload', 'print'],
        permissionPrefix: 'execution'
      }
    ],
    availableActions: ['view', 'create', 'edit', 'delete', 'submit', 'approve', 'reject', 'assign', 'reassign', 'upload', 'download', 'print', 'execute', 'close'],
    requiredPermissions: ['execution.view', 'project.view'],
    supportedScopes: ['Global', 'Branch', 'Factory', 'Workshop', 'Project', 'Assigned Records'],
    apiEndpoints: ['GET /api/v1/factories', 'POST /api/v1/factories/:id/work-packages', 'PATCH /api/v1/factory-tasks/:id/stage'],
    sensitiveOperations: ['Factory Audit Hold', 'AFC Drawing Revision Override', 'Work Package Budget Reallocation'],
    requiredRoles: ['FACTORY_MANAGER', 'WORKSHOP_MANAGER', 'PRODUCTION_MANAGER', 'FABRICATOR', 'MACHINE_OPERATOR', 'EXTERNAL_FACTORY_MANAGER', 'EXTERNAL_FACTORY_WORKER'],
    auditEvents: ['FACTORY_ASSIGNED', 'WORK_PACKAGE_DISPATCHED', 'STAGE_GATE_TRANSITION'],
    dependentServices: ['factoryExecutionService', 'qualityControlService', 'equipmentControlService']
  },
  {
    portalId: 'production-control',
    portalName: 'Production Planning, BOM & CNC Routing',
    shortName: 'Production',
    category: 'Factory & Operations',
    appViewTarget: 'operational-control',
    operationalSubPortal: 'product',
    moduleHierarchy: [
      {
        moduleId: 'mod-prod-bom',
        moduleName: 'Multi-Level BOM & Cutting Lists',
        features: ['Profile Optimization', 'Scrap Allowance', 'CNC Operation Routings'],
        availableActions: ['view', 'create', 'edit', 'approve', 'lock', 'export', 'print'],
        permissionPrefix: 'engineering'
      }
    ],
    availableActions: ['view', 'create', 'edit', 'approve', 'lock', 'export', 'print', 'execute'],
    requiredPermissions: ['engineering.view', 'boq.view'],
    supportedScopes: ['Global', 'Department', 'Factory', 'Project'],
    apiEndpoints: ['GET /api/v1/production/boms', 'POST /api/v1/production/cutting-lists'],
    sensitiveOperations: ['BOM Cost Standard Change', 'AFC Revision Lock'],
    requiredRoles: ['PRODUCTION_MANAGER', 'FACTORY_MANAGER', 'PROJECT_ENGINEER', 'ARCHITECT_DESIGNER'],
    auditEvents: ['BOM_REVISION_LOCKED', 'CUTTING_LIST_RELEASED'],
    dependentServices: ['factoryExecutionService', 'bomPricingService']
  },
  {
    portalId: 'quality-assurance',
    portalName: 'Quality Assurance, ITP, Lab Testing & NCR Control',
    shortName: 'Quality (QA/QC)',
    category: 'Factory & Operations',
    appViewTarget: 'quality-control',
    operationalSubPortal: 'quality',
    moduleHierarchy: [
      {
        moduleId: 'mod-qc-itp',
        moduleName: 'ITP Hold Points, MIR, FAI & FAT Inspections',
        features: ['Incoming Material QC (MTC)', 'Dimensional & DFT Checks', 'CWCT Water Hose Tests'],
        availableActions: ['view', 'create', 'edit', 'approve', 'reject', 'upload', 'print'],
        permissionPrefix: 'qc'
      },
      {
        moduleId: 'mod-qc-ncr',
        moduleName: 'NCR Quarantine, 5-Why Root Cause & CAPA',
        features: ['Quarantine Cage Hold', 'Supplier Debit Intercept', 'ISO 17025 Gauge Calibration'],
        availableActions: ['view', 'create', 'edit', 'approve', 'reject', 'close', 'reopen'],
        permissionPrefix: 'qc'
      }
    ],
    availableActions: ['view', 'create', 'edit', 'approve', 'reject', 'submit', 'upload', 'print', 'close', 'reopen'],
    requiredPermissions: ['qc.view'],
    supportedScopes: ['Global', 'Branch', 'Factory', 'Project'],
    apiEndpoints: ['GET /api/v1/quality/inspections', 'POST /api/v1/quality/ncrs', 'PATCH /api/v1/quality/ncrs/:id/disposition'],
    sensitiveOperations: ['Stop-Line Quality Alert', 'NCR Concession Approval', 'FAT Release Certificate'],
    requiredRoles: ['QA_QC', 'QUALITY_MANAGER', 'QUALITY_INSPECTOR', 'FACTORY_MANAGER'],
    auditEvents: ['NCR_RAISED', 'STOP_LINE_TRIGGERED', 'QC_HOLD_RELEASED'],
    dependentServices: ['qualityControlService', 'factoryExecutionService', 'procurementService']
  },
  {
    portalId: 'hse-safety',
    portalName: 'Health, Safety & Environment (HSE & PTW Permits)',
    shortName: 'Safety (HSE)',
    category: 'Factory & Operations',
    appViewTarget: 'site-management',
    moduleHierarchy: [
      {
        moduleId: 'mod-hse-ptw',
        moduleName: 'Permit-to-Work (PTW), JSA & Incident CAPA',
        features: ['Hot Work / Height / Confined Space Permits', 'Toolbox Talks', 'Harness & Scaffold Tags', 'Near-Miss Investigation'],
        availableActions: ['view', 'create', 'edit', 'approve', 'reject', 'close', 'print'],
        permissionPrefix: 'site'
      }
    ],
    availableActions: ['view', 'create', 'edit', 'approve', 'reject', 'close', 'print'],
    requiredPermissions: ['site.view'],
    supportedScopes: ['Global', 'Branch', 'Factory', 'Project'],
    apiEndpoints: ['GET /api/v1/hse/permits', 'POST /api/v1/hse/incidents'],
    sensitiveOperations: ['High-Risk PTW Authorization', 'LTIFR Incident Classification'],
    requiredRoles: ['HSE_OFFICER', 'SITE_MANAGER', 'SITE_SUPERVISOR', 'FACTORY_MANAGER'],
    auditEvents: ['PTW_AUTHORIZED', 'SAFETY_INCIDENT_LOGGED'],
    dependentServices: ['safetyControlService']
  },
  {
    portalId: 'human-resources',
    portalName: 'Human Capital Management (18 Sub-Portals & Biometrics)',
    shortName: 'Human Capital (HR)',
    category: 'Commercial & Finance',
    appViewTarget: 'operational-control',
    operationalSubPortal: 'hr',
    moduleHierarchy: [
      {
        moduleId: 'mod-hr-master',
        moduleName: 'Employee 360° Master, ATS & Onboarding',
        features: ['Organization Positions', 'Applicant Pipeline', 'Employee & Manager Self-Service (ESS/MSS)'],
        availableActions: ['view', 'create', 'edit', 'approve', 'archive', 'export'],
        permissionPrefix: 'hr'
      },
      {
        moduleId: 'mod-hr-biometrics',
        moduleName: 'Biometric & Laser Terminals, Meal Scans & Loans',
        features: ['ZKTeco/Laser Arrival-Departure State', 'Meal Benefit Fund Rollover', 'Staff Loan Amortization'],
        availableActions: ['view', 'create', 'edit', 'approve', 'configure', 'execute'],
        permissionPrefix: 'hr'
      },
      {
        moduleId: 'mod-hr-payroll',
        moduleName: 'EPF 8%/12%, ETF 3%, Gratuity & WPS Payroll',
        features: ['Paysheet Calculation Engine', 'Statutory Reconciliation', 'Disciplinary & Exit Clearance'],
        availableActions: ['view', 'create', 'edit', 'approve', 'lock', 'export', 'print'],
        permissionPrefix: 'payroll'
      }
    ],
    availableActions: ['view', 'create', 'edit', 'delete', 'approve', 'reject', 'lock', 'export', 'print', 'configure'],
    requiredPermissions: ['hr.view', 'payroll.view'],
    supportedScopes: ['Global', 'Branch', 'Department', 'Own Records', 'Restricted'],
    apiEndpoints: ['GET /api/v1/hr/employees', 'POST /api/v1/hr/biometric-punch', 'POST /api/v1/hr/paysheets/run'],
    sensitiveOperations: ['Basic Salary Modification', 'WPS Bank File Generation', 'Disciplinary Termination'],
    requiredRoles: ['HR_MANAGER', 'HR_OFFICER', 'PAYROLL_OFFICER', 'MANAGING_DIRECTOR'],
    auditEvents: ['SALARY_MODIFIED', 'PAYROLL_BATCH_APPROVED', 'EMPLOYEE_TERMINATED'],
    dependentServices: ['hrService', 'payrollService', 'accountingControlService']
  },
  {
    portalId: 'accounting-finance',
    portalName: 'Corporate Accounting (10 Pillars), Treasury & Tax/VAT',
    shortName: 'Accounting & Finance',
    category: 'Commercial & Finance',
    appViewTarget: 'accounting',
    operationalSubPortal: 'finance',
    moduleHierarchy: [
      {
        moduleId: 'mod-acc-gl',
        moduleName: 'General Ledger, COA, AR, AP & 3-Way Match',
        features: ['Double-Entry Journal Vouchers', 'Customer Receipts', 'Supplier 3-Way Match & PVC Tokens'],
        availableActions: ['view', 'create', 'edit', 'approve', 'reject', 'lock', 'unlock', 'export'],
        permissionPrefix: 'accounting'
      },
      {
        moduleId: 'mod-acc-treasury',
        moduleName: 'Bank Reconciliation, WIP, Retentions & Statutory Close',
        features: ['Multi-Currency Treasury', 'Project WIP Earned Value', 'VAT Return & Fiscal Period Lock'],
        availableActions: ['view', 'create', 'edit', 'approve', 'lock', 'print', 'export'],
        permissionPrefix: 'finance'
      }
    ],
    availableActions: ['view', 'create', 'edit', 'delete', 'approve', 'reject', 'lock', 'unlock', 'export', 'print'],
    requiredPermissions: ['accounting.view', 'finance.view', 'invoice.view'],
    supportedScopes: ['Global', 'Branch', 'Department', 'Project'],
    apiEndpoints: ['GET /api/v1/accounting/gl', 'POST /api/v1/accounting/journal-vouchers', 'POST /api/v1/accounting/pvc-verify'],
    sensitiveOperations: ['Fiscal Period Hard Close', 'Journal Voucher Reversal', 'Supplier Payment Disbursement'],
    requiredRoles: ['FINANCE_MANAGER', 'ACCOUNTANT', 'ACCOUNTS_EXECUTIVE', 'INTERNAL_AUDITOR', 'EXECUTIVE'],
    auditEvents: ['JOURNAL_POSTED', 'PAYMENT_DISBURSED', 'FISCAL_PERIOD_LOCKED'],
    dependentServices: ['accountingControlService', 'procurementService']
  },
  {
    portalId: 'inventory-warehouse',
    portalName: 'Warehouse Inventory, GRN, Barcode & Scrap Reclaim',
    shortName: 'Inventory & Stores',
    category: 'Factory & Operations',
    appViewTarget: 'procurement',
    moduleHierarchy: [
      {
        moduleId: 'mod-inv-stock',
        moduleName: 'Multi-Branch Stock Ledger, GRN & 7-Day Scrap Reclaim',
        features: ['Inbound GRN Barcode Scanning', 'Material Issue to Factory Tasks', 'Reorder Alerts', 'Scrap Reclaim Intercept'],
        availableActions: ['view', 'create', 'edit', 'approve', 'transfer', 'export', 'print'],
        permissionPrefix: 'grn'
      }
    ],
    availableActions: ['view', 'create', 'edit', 'approve', 'transfer', 'export', 'print'],
    requiredPermissions: ['grn.view', 'resource.view'],
    supportedScopes: ['Global', 'Branch', 'Factory', 'Project'],
    apiEndpoints: ['GET /api/v1/inventory/stock', 'POST /api/v1/inventory/grn', 'POST /api/v1/inventory/issue'],
    sensitiveOperations: ['Stock Write-Off / Adjustment', 'Conditional QC Material Release'],
    requiredRoles: ['STORE_OFFICER', 'INVENTORY_OFFICER', 'PROCUREMENT_MANAGER', 'FACTORY_MANAGER'],
    auditEvents: ['GRN_ACCEPTED', 'MATERIAL_ISSUED', 'SCRAP_RECLAIMED'],
    dependentServices: ['procurementService', 'factoryExecutionService']
  },
  {
    portalId: 'procurement-supply-chain',
    portalName: 'Procurement & Supply Chain (ProcureFlow & 89 Documents)',
    shortName: 'Procurement',
    category: 'Commercial & Finance',
    appViewTarget: 'procurement',
    moduleHierarchy: [
      {
        moduleId: 'mod-proc-sourcing',
        moduleName: 'PRs, RFQs, Reverse Dutch Auctions & POs',
        features: ['Purchase Requisitions', 'Bid Tabulation Matrix', 'Live Reverse Auctions', 'Dual-Authorized POs'],
        availableActions: ['view', 'create', 'edit', 'submit', 'approve', 'reject', 'export', 'print'],
        permissionPrefix: 'po'
      },
      {
        moduleId: 'mod-proc-costing',
        moduleName: 'Cost Items Hub, MOQ Tiers & 89 Master Documents',
        features: ['Supplier MOQ Rate Cards', 'BOM Cost Propagation', '89 Official Procurement Forms Engine'],
        availableActions: ['view', 'create', 'edit', 'approve', 'print', 'download'],
        permissionPrefix: 'purchasing'
      }
    ],
    availableActions: ['view', 'create', 'edit', 'delete', 'submit', 'approve', 'reject', 'export', 'print', 'download'],
    requiredPermissions: ['purchasing.view', 'po.view', 'rfq.view', 'supplier.view'],
    supportedScopes: ['Global', 'Branch', 'Department', 'Project'],
    apiEndpoints: ['GET /api/v1/procurement/pos', 'POST /api/v1/procurement/rfqs', 'POST /api/v1/procurement/auctions'],
    sensitiveOperations: ['Emergency Safety Fast-Track PO', 'Framework Price-Lock Modification', 'Supplier Blacklisting'],
    requiredRoles: ['PROCUREMENT_MANAGER', 'PROCUREMENT_OFFICER', 'BUYER', 'FINANCE_MANAGER'],
    auditEvents: ['PO_APPROVED', 'EMERGENCY_PO_ISSUED', 'SUPPLIER_EVALUATED'],
    dependentServices: ['procurementService', 'procurementCostService', 'procurementAllDocsService']
  },
  {
    portalId: 'logistics-dispatch',
    portalName: 'Logistics, Crate Packing, Fleet & Site Dispatch',
    shortName: 'Logistics & Dispatch',
    category: 'Factory & Operations',
    appViewTarget: 'operational-control',
    operationalSubPortal: 'factories',
    moduleHierarchy: [
      {
        moduleId: 'mod-log-dispatch',
        moduleName: 'Packing Lists (PKL), Delivery Notes (DN) & Transit',
        features: ['QR Crate Tagging', 'Vehicle & Driver Assignment', 'Site Delivery Confirmation'],
        availableActions: ['view', 'create', 'edit', 'submit', 'approve', 'print', 'execute'],
        permissionPrefix: 'execution'
      }
    ],
    availableActions: ['view', 'create', 'edit', 'submit', 'approve', 'print', 'execute'],
    requiredPermissions: ['execution.view', 'site.view'],
    supportedScopes: ['Global', 'Branch', 'Factory', 'Project', 'Assigned Records'],
    apiEndpoints: ['GET /api/v1/logistics/dispatches', 'POST /api/v1/logistics/delivery-confirm'],
    sensitiveOperations: ['Gate Pass Release', 'Site Damage Claim Filing'],
    requiredRoles: ['LOGISTICS_MANAGER', 'DRIVER', 'STORE_OFFICER', 'FACTORY_MANAGER', 'SITE_SUPERVISOR'],
    auditEvents: ['DISPATCH_RELEASED', 'SITE_DELIVERY_RECEIVED'],
    dependentServices: ['factoryExecutionService', 'equipmentControlService']
  },
  {
    portalId: 'equipment-machinery',
    portalName: 'Plant Machinery, CNC Assets & Preventive Maintenance',
    shortName: 'Equipment & Plant',
    category: 'Factory & Operations',
    appViewTarget: 'equipment-management',
    operationalSubPortal: 'resource',
    moduleHierarchy: [
      {
        moduleId: 'mod-eq-assets',
        moduleName: 'Equipment Inventory, Maintenance & Pre-Start Checks',
        features: ['CNC & Crane Registry', 'MTBF/MTTR Maintenance Logs', 'Daily Operator Safety Checks'],
        availableActions: ['view', 'create', 'edit', 'assign', 'transfer', 'approve'],
        permissionPrefix: 'equipment'
      }
    ],
    availableActions: ['view', 'create', 'edit', 'assign', 'transfer', 'approve', 'export'],
    requiredPermissions: ['equipment.view', 'resource.view'],
    supportedScopes: ['Global', 'Branch', 'Factory', 'Project'],
    apiEndpoints: ['GET /api/v1/equipment/assets', 'POST /api/v1/equipment/maintenance'],
    sensitiveOperations: ['Equipment Decommissioning', 'Third-Party Lifting Certification Override'],
    requiredRoles: ['OPERATIONS_MANAGER', 'FACTORY_MANAGER', 'MACHINE_OPERATOR', 'TECHNICIAN'],
    auditEvents: ['EQUIPMENT_ALLOCATED', 'MAINTENANCE_COMPLETED'],
    dependentServices: ['equipmentControlService']
  },
  {
    portalId: 'document-control',
    portalName: 'Document Control Vault, AFC Drawings & Verification',
    shortName: 'Document Control',
    category: 'Engineering & Projects',
    appViewTarget: 'verification',
    operationalSubPortal: 'document_control',
    moduleHierarchy: [
      {
        moduleId: 'mod-doc-vault',
        moduleName: 'Controlled Drawings, Transmittals & Anti-Tamper SVC/PVC',
        features: ['AFC Drawing Revisions', 'Worker Read-Confirmation', 'Cryptographic Hash Verification'],
        availableActions: ['view', 'create', 'upload', 'download', 'approve', 'archive', 'share', 'print'],
        permissionPrefix: 'doc'
      }
    ],
    availableActions: ['view', 'create', 'edit', 'upload', 'download', 'approve', 'archive', 'share', 'print'],
    requiredPermissions: ['doc.view', 'engineering.view'],
    supportedScopes: ['Global', 'Organization', 'Branch', 'Project', 'Factory'],
    apiEndpoints: ['GET /api/v1/documents', 'POST /api/v1/documents/verify-svc'],
    sensitiveOperations: ['Superseded Revision Purge', 'External Organization Document Release'],
    requiredRoles: ['PROJECT_ENGINEER', 'ARCHITECT_DESIGNER', 'PROJECT_MANAGER', 'CONSULTANT'],
    auditEvents: ['DOCUMENT_DOWNLOAD', 'DRAWING_REVISION_APPROVED'],
    dependentServices: ['factoryExecutionService', 'centralApiGateway']
  },
  {
    portalId: 'customer-portal',
    portalName: 'External Customer & Client Workspace Portal',
    shortName: 'Customer Portal',
    category: 'External Ecosystem',
    appViewTarget: 'portal-view',
    isExternalPortal: true,
    moduleHierarchy: [
      {
        moduleId: 'mod-cust-workspace',
        moduleName: 'Client Projects, Quotations, Invoices, Approvals & Warranty',
        features: ['Live Project Progress', 'Quotation & Variation Approval', 'Milestone Invoices', 'DLP & Warranty Claims'],
        availableActions: ['view', 'approve', 'reject', 'comment', 'download', 'print'],
        permissionPrefix: 'project'
      }
    ],
    availableActions: ['view', 'approve', 'reject', 'comment', 'download', 'print'],
    requiredPermissions: ['project.view'],
    supportedScopes: ['Organization', 'Project', 'Own Records'],
    apiEndpoints: ['GET /api/v1/customer-portal/projects', 'POST /api/v1/customer-portal/approvals'],
    sensitiveOperations: ['Client Variation Sign-Off', 'Client Quotation Acceptance'],
    requiredRoles: ['CUSTOMER', 'RESIDENT_CLIENT', 'B2B_CLIENT'],
    auditEvents: ['CLIENT_PORTAL_ACCESSED', 'CLIENT_VARIATION_APPROVED'],
    dependentServices: ['securityService', 'collaborationService']
  },
  {
    portalId: 'supplier-portal',
    portalName: 'External Supplier, Bidding & Compliance Portal',
    shortName: 'Supplier Portal',
    category: 'External Ecosystem',
    appViewTarget: 'procurement',
    isExternalPortal: true,
    moduleHierarchy: [
      {
        moduleId: 'mod-sup-bidding',
        moduleName: 'RFQ Bids, Reverse Auctions, POs, ASN & Invoices',
        features: ['RFQ Quotation Submission', 'Live Dutch Auction Bidding', 'Compliance COI/ISO Upload'],
        availableActions: ['view', 'create', 'submit', 'upload', 'download'],
        permissionPrefix: 'rfq'
      }
    ],
    availableActions: ['view', 'create', 'submit', 'upload', 'download', 'comment'],
    requiredPermissions: ['rfq.view', 'po.view'],
    supportedScopes: ['Organization', 'Assigned Records', 'Own Records'],
    apiEndpoints: ['GET /api/v1/supplier-portal/rfqs', 'POST /api/v1/supplier-portal/bids'],
    sensitiveOperations: ['Auction Price Bid Submission', 'Tax Invoice Upload'],
    requiredRoles: ['SUPPLIER', 'SUBCONTRACTOR'],
    auditEvents: ['SUPPLIER_BID_SUBMITTED', 'SUPPLIER_DOC_UPLOADED'],
    dependentServices: ['procurementService', 'securityService']
  },
  {
    portalId: 'partner-factory-portal',
    portalName: 'External Factory, Workshop & Subcontractor Portal',
    shortName: 'Partner Factory Portal',
    category: 'External Ecosystem',
    appViewTarget: 'operational-control',
    operationalSubPortal: 'factories',
    isExternalPortal: true,
    moduleHierarchy: [
      {
        moduleId: 'mod-ext-fac',
        moduleName: 'Assigned Work Packages, Drawings, Worksheets & QC Submissions',
        features: ['Work Package Acceptance', 'Assigned Task Execution', 'Worksheet & QC Upload', 'Dispatch Notification'],
        availableActions: ['view', 'edit', 'submit', 'upload', 'download', 'print', 'execute'],
        permissionPrefix: 'execution'
      }
    ],
    availableActions: ['view', 'edit', 'submit', 'upload', 'download', 'print', 'execute'],
    requiredPermissions: ['execution.view'],
    supportedScopes: ['Organization', 'Factory', 'Workshop', 'Project', 'Assigned Records'],
    apiEndpoints: ['GET /api/v1/partner-factory/work-packages', 'POST /api/v1/partner-factory/progress'],
    sensitiveOperations: ['Work Package Order Acceptance', 'External FAT Submission'],
    requiredRoles: ['EXTERNAL_FACTORY_MANAGER', 'EXTERNAL_FACTORY_WORKER', 'SUBCONTRACTOR', 'STRATEGIC_PARTNER'],
    auditEvents: ['EXTERNAL_WP_ACCEPTED', 'EXTERNAL_PROGRESS_LOGGED'],
    dependentServices: ['factoryExecutionService', 'securityService']
  },
  {
    portalId: 'reporting-analytics',
    portalName: 'Enterprise Financial, Project & Operational Reporting',
    shortName: 'Reporting & Analytics',
    category: 'Commercial & Finance',
    appViewTarget: 'reporting',
    moduleHierarchy: [
      {
        moduleId: 'mod-rep-statements',
        moduleName: 'SOA, AR Aging, Retention, DSO & Project Variance',
        features: ['Statement of Account', '30/60/90/120+ Aging', 'Retention Release Tracker', 'Bad Debt Provision'],
        availableActions: ['view', 'export', 'print', 'share'],
        permissionPrefix: 'mgmt_report'
      }
    ],
    availableActions: ['view', 'export', 'print', 'share'],
    requiredPermissions: ['mgmt_report.view', 'proj_report.view'],
    supportedScopes: ['Global', 'Branch', 'Department', 'Project'],
    apiEndpoints: ['GET /api/v1/reports/financial', 'GET /api/v1/reports/project-variance'],
    sensitiveOperations: ['Full Ledger CSV Export'],
    requiredRoles: ['EXECUTIVE', 'FINANCE_MANAGER', 'ACCOUNTANT', 'PROJECT_MANAGER', 'OPERATIONS_MANAGER'],
    auditEvents: ['DATA_EXPORT', 'REPORT_PRINTED'],
    dependentServices: ['accountingControlService', 'costEvaluationService']
  },
  {
    portalId: 'engineering-qs-boq',
    portalName: 'BOQ Engineering, Variant Matrix & Pricing Intelligence',
    shortName: 'Engineering & QS',
    category: 'Engineering & Projects',
    appViewTarget: 'boq-items',
    moduleHierarchy: [
      {
        moduleId: 'mod-eng-boq',
        moduleName: 'Master BOQ Catalog, Multi-Dimensional Variants & Spec Engine',
        features: ['BOQ Item Registry', 'Product Variant Matrix', 'Smart Technical Spec Engine', 'Pricing Intelligence'],
        availableActions: ['view', 'create', 'edit', 'delete', 'approve', 'lock', 'import', 'export'],
        permissionPrefix: 'boq'
      }
    ],
    availableActions: ['view', 'create', 'edit', 'delete', 'approve', 'lock', 'unlock', 'import', 'export'],
    requiredPermissions: ['boq.view', 'engineering.view'],
    supportedScopes: ['Global', 'Department', 'Project'],
    apiEndpoints: ['GET /api/v1/boq/items', 'POST /api/v1/boq/variants', 'POST /api/v1/boq/rate-versions'],
    sensitiveOperations: ['Master Rate Lock', 'Bulk Margin Recalculation'],
    requiredRoles: ['QS', 'PROJECT_ENGINEER', 'ARCHITECT_DESIGNER', 'SALES_MANAGER'],
    auditEvents: ['BOQ_LOCKED', 'RATE_VERSION_PUBLISHED'],
    dependentServices: ['variantEngineService', 'bomPricingService']
  },
  {
    portalId: 'sales-crm-quotes',
    portalName: 'Sales, CRM, Quotation Builder & Client Directory',
    shortName: 'Quotes & CRM',
    category: 'Commercial & Finance',
    appViewTarget: 'history',
    moduleHierarchy: [
      {
        moduleId: 'mod-sales-quotes',
        moduleName: 'Quotation Live Editor, Measurement Sheet & Client CRM',
        features: ['8-Stage Quotation Pipeline', 'Geometric Takeoff Sheet', 'Multi-Layout PDF Generator', 'Client Credit & Commissions'],
        availableActions: ['view', 'create', 'edit', 'delete', 'submit', 'approve', 'export', 'print', 'share'],
        permissionPrefix: 'boq'
      }
    ],
    availableActions: ['view', 'create', 'edit', 'delete', 'submit', 'approve', 'export', 'print', 'share'],
    requiredPermissions: ['boq.view', 'project.view'],
    supportedScopes: ['Global', 'Branch', 'Department', 'Own Records'],
    apiEndpoints: ['GET /api/v1/quotes', 'POST /api/v1/quotes', 'POST /api/v1/clients'],
    sensitiveOperations: ['Discount Threshold Override', 'Hidden Sales Commission Configuration'],
    requiredRoles: ['SALES_MANAGER', 'SALES_OFFICER', 'QS', 'PROJECT_MANAGER', 'EXECUTIVE'],
    auditEvents: ['QUOTE_APPROVED', 'QUOTE_CONVERTED_TO_PROJECT'],
    dependentServices: ['pdfGenerator', 'centralApiGateway']
  },
  {
    portalId: 'system-administration',
    portalName: 'Central Identity, User, Role, Portal & Permission Control Center',
    shortName: 'Admin & Security',
    category: 'Governance',
    appViewTarget: 'settings',
    operationalSubPortal: 'admin',
    moduleHierarchy: [
      {
        moduleId: 'mod-sys-iam',
        moduleName: 'Central Identity, RBAC/ABAC Matrix, Scopes & Audit Engine',
        features: [
          'User Lifecycle Management',
          'User Types & 35 Role Templates',
          'Portal & Access Matrix',
          'Project/Factory/Organization Scoping',
          'Access Review & Why-Access Debugger',
          'Impersonation Preview & Break-Glass',
          'Connected Apps & API Scopes',
          'Tamper-Resistant Security Audit Trail'
        ],
        availableActions: ['view', 'create', 'edit', 'delete', 'approve', 'reject', 'assign', 'lock', 'unlock', 'configure', 'admin'],
        permissionPrefix: 'security'
      }
    ],
    availableActions: ['view', 'create', 'edit', 'delete', 'approve', 'reject', 'assign', 'lock', 'unlock', 'configure', 'admin'],
    requiredPermissions: ['security.view', 'security.admin'],
    supportedScopes: ['Global', 'Department', 'Portal', 'Project', 'Factory'],
    apiEndpoints: [
      'POST /api/v1/iam/evaluate',
      'GET /api/v1/iam/users',
      'POST /api/v1/iam/roles',
      'POST /api/v1/iam/break-glass',
      'POST /api/v1/iam/api-keys'
    ],
    sensitiveOperations: [
      'Super Admin Privilege Assignment',
      'Break-Glass Emergency Activation',
      'Security Policy Modification',
      'Global Session Revocation',
      'API Key Rotation'
    ],
    requiredRoles: ['SUPER_ADMIN', 'SYSTEM_ADMIN', 'DEPT_ADMIN'],
    auditEvents: ['USER_CREATED', 'ROLE_CHANGED', 'PERMISSION_GRANTED', 'BREAK_GLASS_ACTIVATED', 'POLICY_UPDATED'],
    dependentServices: ['securityService']
  }
];

// ============================================================================
// 2. STRUCTURED USER TYPES (35 CONFIGURABLE USER TYPES)
// ============================================================================
export const SEED_USER_TYPES: UserTypeDefinition[] = [
  {
    id: 'ut-super-admin',
    code: 'SUPER_ADMIN',
    name: 'Super Administrator',
    category: 'Internal Administration',
    isExternal: false,
    defaultRoleId: 'role-superadmin',
    defaultScope: 'Global',
    defaultPortalIds: SEED_PORTAL_REGISTRY.map(p => p.portalId),
    requiresMfaByDefault: true,
    description: 'Unconstrained master authority across all portals, security policies, break-glass, and system governance.'
  },
  {
    id: 'ut-sys-admin',
    code: 'SYSTEM_ADMINISTRATOR',
    name: 'System Administrator',
    category: 'Internal Administration',
    isExternal: false,
    defaultRoleId: 'role-sysadmin',
    defaultScope: 'Global',
    defaultPortalIds: ['company-control-center', 'system-administration', 'document-control', 'executive-dashboard'],
    requiresMfaByDefault: true,
    description: 'Manages user lifecycle, roles, MFA, sessions, connected API clients, and system configuration.'
  },
  {
    id: 'ut-executive',
    code: 'EXECUTIVE',
    name: 'Executive / C-Suite Director',
    category: 'Internal Management',
    isExternal: false,
    defaultRoleId: 'role-md',
    defaultScope: 'Global',
    defaultPortalIds: ['company-control-center', 'executive-dashboard', 'project-management', 'accounting-finance', 'reporting-analytics', 'factory-workshop-management', 'procurement-supply-chain', 'human-resources'],
    requiresMfaByDefault: true,
    description: 'Board-level oversight, final approval authority, and company-wide financial/operational visibility.'
  },
  {
    id: 'ut-management',
    code: 'MANAGEMENT',
    name: 'Department / General Management',
    category: 'Internal Management',
    isExternal: false,
    defaultRoleId: 'role-deptadmin',
    defaultScope: 'Department',
    defaultPortalIds: ['company-control-center', 'executive-dashboard', 'project-management', 'reporting-analytics'],
    requiresMfaByDefault: true,
    description: 'Senior departmental leadership with approval and resource allocation authority within their division.'
  },
  {
    id: 'ut-ops-mgr',
    code: 'OPERATIONS_MANAGER',
    name: 'Operations Manager',
    category: 'Internal Management',
    isExternal: false,
    defaultRoleId: 'role-opsmgr',
    defaultScope: 'Department',
    defaultPortalIds: ['company-control-center', 'executive-dashboard', 'project-management', 'construction-site-management', 'factory-workshop-management', 'production-control', 'quality-assurance', 'hse-safety', 'equipment-machinery', 'logistics-dispatch'],
    requiresMfaByDefault: true,
    description: 'Multi-project and multi-factory operational authority across fabrication, site execution, QA/QC, and fleet.'
  },
  {
    id: 'ut-proj-mgr',
    code: 'PROJECT_MANAGER',
    name: 'Project Manager',
    category: 'Internal Engineering & Site',
    isExternal: false,
    defaultRoleId: 'role-pm',
    defaultScope: 'Project',
    defaultPortalIds: ['company-control-center', 'project-management', 'construction-site-management', 'factory-workshop-management', 'quality-assurance', 'hse-safety', 'document-control', 'reporting-analytics'],
    requiresMfaByDefault: false,
    description: 'End-to-end delivery, WBS scheduling, variation management, and factory work package assignment for authorized projects.'
  },
  {
    id: 'ut-proj-eng',
    code: 'PROJECT_ENGINEER',
    name: 'Project Engineer',
    category: 'Internal Engineering & Site',
    isExternal: false,
    defaultRoleId: 'role-engineer',
    defaultScope: 'Project',
    defaultPortalIds: ['company-control-center', 'project-management', 'production-control', 'engineering-qs-boq', 'document-control', 'quality-assurance'],
    requiresMfaByDefault: false,
    description: 'Technical calculations, AFC shop drawings, BOM preparation, and method statements for assigned projects.'
  },
  {
    id: 'ut-qs',
    code: 'QS',
    name: 'Quantity Surveyor (QS)',
    category: 'Internal Engineering & Site',
    isExternal: false,
    defaultRoleId: 'role-qs',
    defaultScope: 'Department',
    defaultPortalIds: ['company-control-center', 'engineering-qs-boq', 'sales-crm-quotes', 'project-management', 'procurement-supply-chain', 'reporting-analytics'],
    requiresMfaByDefault: false,
    description: 'BOQ engineering, geometric measurement takeoffs, product variants, rate benchmarking, and variation valuations.'
  },
  {
    id: 'ut-architect',
    code: 'ARCHITECT_DESIGNER',
    name: 'Architect / Facade Designer',
    category: 'Internal Engineering & Site',
    isExternal: false,
    defaultRoleId: 'role-designer',
    defaultScope: 'Project',
    defaultPortalIds: ['company-control-center', 'engineering-qs-boq', 'production-control', 'document-control', 'project-management'],
    requiresMfaByDefault: false,
    description: 'System specifications, curtain wall profiles, CAD/BIM modeling, and aesthetic/thermal compliance.'
  },
  {
    id: 'ut-site-sup',
    code: 'SITE_SUPERVISOR',
    name: 'Site Supervisor / Foreman',
    category: 'Internal Engineering & Site',
    isExternal: false,
    defaultRoleId: 'role-sitesup',
    defaultScope: 'Project',
    defaultPortalIds: ['company-control-center', 'construction-site-management', 'hse-safety', 'quality-assurance', 'logistics-dispatch', 'document-control'],
    requiresMfaByDefault: false,
    description: 'On-site installation crew supervision, daily site diaries, PTW permits, WIR requests, and delivery receiving.'
  },
  {
    id: 'ut-site-eng',
    code: 'SITE_ENGINEER',
    name: 'Site Engineer',
    category: 'Internal Engineering & Site',
    isExternal: false,
    defaultRoleId: 'role-sitemgr',
    defaultScope: 'Project',
    defaultPortalIds: ['company-control-center', 'construction-site-management', 'project-management', 'quality-assurance', 'hse-safety', 'document-control'],
    requiresMfaByDefault: false,
    description: 'Field engineering verification, elevation setting-out, WIR inspections, and site progress certification.'
  },
  {
    id: 'ut-qa-qc',
    code: 'QA_QC_OFFICER',
    name: 'QA/QC Engineer / Inspector',
    category: 'Internal Engineering & Site',
    isExternal: false,
    defaultRoleId: 'role-qcinsp',
    defaultScope: 'Project',
    defaultPortalIds: ['company-control-center', 'quality-assurance', 'factory-workshop-management', 'construction-site-management', 'document-control'],
    requiresMfaByDefault: false,
    description: 'ITP hold-point inspections, MTC verification, FAI/FAT sign-off, NCR creation, and CAPA verification.'
  },
  {
    id: 'ut-hse',
    code: 'HSE_OFFICER',
    name: 'HSE Safety Officer',
    category: 'Internal Engineering & Site',
    isExternal: false,
    defaultRoleId: 'role-sitemgr',
    defaultScope: 'Branch',
    defaultPortalIds: ['company-control-center', 'hse-safety', 'construction-site-management', 'factory-workshop-management'],
    requiresMfaByDefault: false,
    description: 'Permit-to-Work (PTW) authorization, JSA hazard control, toolbox talks, PPE audits, and incident investigation.'
  },
  {
    id: 'ut-fac-mgr',
    code: 'FACTORY_MANAGER',
    name: 'Factory Manager',
    category: 'Internal Factory & Production',
    isExternal: false,
    defaultRoleId: 'role-opsmgr',
    defaultScope: 'Factory',
    defaultPortalIds: ['company-control-center', 'factory-workshop-management', 'production-control', 'quality-assurance', 'hse-safety', 'inventory-warehouse', 'equipment-machinery', 'logistics-dispatch'],
    requiresMfaByDefault: false,
    description: 'Full plant management for assigned factory/factories, bay scheduling, work package execution, and dispatch sign-off.'
  },
  {
    id: 'ut-workshop-mgr',
    code: 'WORKSHOP_MANAGER',
    name: 'Workshop Manager',
    category: 'Internal Factory & Production',
    isExternal: false,
    defaultRoleId: 'role-sitesup',
    defaultScope: 'Workshop',
    defaultPortalIds: ['company-control-center', 'factory-workshop-management', 'production-control', 'quality-assurance', 'equipment-machinery'],
    requiresMfaByDefault: false,
    description: 'Manages fabrication bays, shift supervisors, digital worksheets, and daily workshop output.'
  },
  {
    id: 'ut-prod-mgr',
    code: 'PRODUCTION_MANAGER',
    name: 'Production Manager',
    category: 'Internal Factory & Production',
    isExternal: false,
    defaultRoleId: 'role-pm',
    defaultScope: 'Factory',
    defaultPortalIds: ['company-control-center', 'factory-workshop-management', 'production-control', 'inventory-warehouse', 'quality-assurance', 'logistics-dispatch'],
    requiresMfaByDefault: false,
    description: 'Controls master production schedules, cutting lists, material requisitions, and stage-gate throughput.'
  },
  {
    id: 'ut-fabricator',
    code: 'FABRICATOR',
    name: 'Shop-Floor Fabricator / Welder',
    category: 'Internal Factory & Production',
    isExternal: false,
    defaultRoleId: 'role-sitesup',
    defaultScope: 'Assigned Records',
    defaultPortalIds: ['factory-workshop-management', 'document-control'],
    requiresMfaByDefault: false,
    description: 'Executes assigned fabrication job cards, confirms AFC drawing revisions, and logs digital worksheet output.'
  },
  {
    id: 'ut-machine-op',
    code: 'MACHINE_OPERATOR',
    name: 'CNC & Plant Machine Operator',
    category: 'Internal Factory & Production',
    isExternal: false,
    defaultRoleId: 'role-sitesup',
    defaultScope: 'Assigned Records',
    defaultPortalIds: ['factory-workshop-management', 'equipment-machinery'],
    requiresMfaByDefault: false,
    description: 'Operates CNC centers/saws, performs daily pre-start machine checks, and logs piece counts.'
  },
  {
    id: 'ut-store-officer',
    code: 'STORE_RESOURCE_OFFICER',
    name: 'Store & Warehouse Officer',
    category: 'Internal Factory & Production',
    isExternal: false,
    defaultRoleId: 'role-inv',
    defaultScope: 'Branch',
    defaultPortalIds: ['company-control-center', 'inventory-warehouse', 'procurement-supply-chain', 'factory-workshop-management', 'logistics-dispatch'],
    requiresMfaByDefault: false,
    description: 'Manages inbound GRNs, barcode bin locations, factory material issuance, and scrap reclamation.'
  },
  {
    id: 'ut-hr-mgr',
    code: 'HR_MANAGER',
    name: 'HR & People Operations Manager',
    category: 'Internal Commercial & Support',
    isExternal: false,
    defaultRoleId: 'role-hrmgr',
    defaultScope: 'Department',
    defaultPortalIds: ['company-control-center', 'human-resources', 'reporting-analytics'],
    requiresMfaByDefault: true,
    description: 'Full human capital governance, recruitment, biometric terminals, loans, compensation, and WPS payroll approval.'
  },
  {
    id: 'ut-hr-off',
    code: 'HR_OFFICER',
    name: 'HR & Crewing Officer',
    category: 'Internal Commercial & Support',
    isExternal: false,
    defaultRoleId: 'role-hrmgr',
    defaultScope: 'Branch',
    defaultPortalIds: ['company-control-center', 'human-resources'],
    requiresMfaByDefault: false,
    description: 'Manages employee records, shift rosters, biometric attendance logs, meal scans, and onboarding.'
  },
  {
    id: 'ut-fin-mgr',
    code: 'FINANCE_MANAGER',
    name: 'Finance Manager / Controller',
    category: 'Internal Commercial & Support',
    isExternal: false,
    defaultRoleId: 'role-finmgr',
    defaultScope: 'Global',
    defaultPortalIds: ['company-control-center', 'accounting-finance', 'reporting-analytics', 'executive-dashboard', 'procurement-supply-chain'],
    requiresMfaByDefault: true,
    description: 'Controls General Ledger, Treasury, 3-Way Match PVC authorization, VAT returns, and statutory financial close.'
  },
  {
    id: 'ut-accountant',
    code: 'FINANCE_ACCOUNTING_OFFICER',
    name: 'Accountant / Finance Officer',
    category: 'Internal Commercial & Support',
    isExternal: false,
    defaultRoleId: 'role-accountant',
    defaultScope: 'Department',
    defaultPortalIds: ['company-control-center', 'accounting-finance', 'reporting-analytics'],
    requiresMfaByDefault: false,
    description: 'Prepares customer invoices, books supplier bills, reconciles bank statements, and tracks retentions.'
  },
  {
    id: 'ut-sales-mgr',
    code: 'SALES_MANAGER',
    name: 'Sales & Commercial Manager',
    category: 'Internal Commercial & Support',
    isExternal: false,
    defaultRoleId: 'role-qs',
    defaultScope: 'Department',
    defaultPortalIds: ['company-control-center', 'sales-crm-quotes', 'engineering-qs-boq', 'customer-portal', 'reporting-analytics'],
    requiresMfaByDefault: false,
    description: 'Leads client acquisition, tender pricing strategy, quotation approvals, and CRM pipeline conversion.'
  },
  {
    id: 'ut-sales-off',
    code: 'SALES_OFFICER',
    name: 'Sales & Estimation Executive',
    category: 'Internal Commercial & Support',
    isExternal: false,
    defaultRoleId: 'role-projcoord',
    defaultScope: 'Own Records',
    defaultPortalIds: ['company-control-center', 'sales-crm-quotes', 'engineering-qs-boq'],
    requiresMfaByDefault: false,
    description: 'Drafts client quotations, manages client inquiries, and coordinates site measurement visits.'
  },
  {
    id: 'ut-logistics-mgr',
    code: 'LOGISTICS_MANAGER',
    name: 'Logistics & Fleet Manager',
    category: 'Internal Factory & Production',
    isExternal: false,
    defaultRoleId: 'role-inv',
    defaultScope: 'Branch',
    defaultPortalIds: ['company-control-center', 'logistics-dispatch', 'inventory-warehouse', 'equipment-machinery', 'factory-workshop-management'],
    requiresMfaByDefault: false,
    description: 'Oversees crate packing, fleet dispatch scheduling, customs clearance, and site delivery tracking.'
  },
  {
    id: 'ut-driver',
    code: 'DRIVER',
    name: 'Fleet Driver / Transport Operator',
    category: 'Internal Factory & Production',
    isExternal: false,
    defaultRoleId: 'role-projcoord',
    defaultScope: 'Assigned Records',
    defaultPortalIds: ['logistics-dispatch'],
    requiresMfaByDefault: false,
    description: 'Views assigned delivery manifests, scans crate QR codes, and captures site delivery sign-off.'
  },
  {
    id: 'ut-customer',
    code: 'CUSTOMER',
    name: 'Customer / Client Account',
    category: 'External Client',
    isExternal: true,
    defaultRoleId: 'role-projcoord',
    defaultScope: 'Organization',
    defaultPortalIds: ['customer-portal'],
    requiresMfaByDefault: false,
    description: 'External client access strictly isolated to their organization’s projects, quotes, invoices, approvals, and warranty certificates.'
  },
  {
    id: 'ut-resident-client',
    code: 'RESIDENT_CLIENT',
    name: 'Resident / Villa Owner Client',
    category: 'External Client',
    isExternal: true,
    defaultRoleId: 'role-projcoord',
    defaultScope: 'Own Records',
    defaultPortalIds: ['customer-portal'],
    requiresMfaByDefault: false,
    description: 'Private residential client with access to their villa quotation, installation milestones, and warranty certificate.'
  },
  {
    id: 'ut-b2b-client',
    code: 'B2B_CLIENT',
    name: 'B2B Developer / Main Contractor Client',
    category: 'External Client',
    isExternal: true,
    defaultRoleId: 'role-projcoord',
    defaultScope: 'Organization',
    defaultPortalIds: ['customer-portal', 'document-control'],
    requiresMfaByDefault: true,
    description: 'Commercial developer or main contractor representative authorized to review submittals, approve variations, and track valuations.'
  },
  {
    id: 'ut-supplier',
    code: 'SUPPLIER',
    name: 'External Material Supplier',
    category: 'External Supply Chain & Factory',
    isExternal: true,
    defaultRoleId: 'role-buyer',
    defaultScope: 'Organization',
    defaultPortalIds: ['supplier-portal'],
    requiresMfaByDefault: false,
    description: 'External vendor restricted to invited RFQs, reverse auctions, issued POs, compliance uploads, and invoice status.'
  },
  {
    id: 'ut-subcontractor',
    code: 'SUBCONTRACTOR',
    name: 'External Subcontractor',
    category: 'External Supply Chain & Factory',
    isExternal: true,
    defaultRoleId: 'role-sitesup',
    defaultScope: 'Organization',
    defaultPortalIds: ['partner-factory-portal', 'supplier-portal'],
    requiresMfaByDefault: false,
    description: 'Specialized installation or fabrication subcontractor accessing assigned work packages and submitting SCN progress.'
  },
  {
    id: 'ut-strategic-partner',
    code: 'STRATEGIC_PARTNER',
    name: 'Strategic JV / Consortium Partner',
    category: 'External Supply Chain & Factory',
    isExternal: true,
    defaultRoleId: 'role-projcoord',
    defaultScope: 'Organization',
    defaultPortalIds: ['partner-factory-portal', 'project-management', 'document-control'],
    requiresMfaByDefault: true,
    description: 'Joint-venture partner with scoped visibility into shared project milestones, drawings, and factory work packages.'
  },
  {
    id: 'ut-ext-fac-mgr',
    code: 'EXTERNAL_FACTORY_MANAGER',
    name: 'External Factory Manager',
    category: 'External Supply Chain & Factory',
    isExternal: true,
    defaultRoleId: 'role-opsmgr',
    defaultScope: 'Factory',
    defaultPortalIds: ['partner-factory-portal', 'factory-workshop-management', 'document-control'],
    requiresMfaByDefault: true,
    description: 'Manages an external partner factory; sees only projects, work packages, drawings, worksheets, and QC records assigned to that factory.'
  },
  {
    id: 'ut-ext-fac-worker',
    code: 'EXTERNAL_FACTORY_WORKER',
    name: 'External Factory / Workshop Worker',
    category: 'External Supply Chain & Factory',
    isExternal: true,
    defaultRoleId: 'role-sitesup',
    defaultScope: 'Assigned Records',
    defaultPortalIds: ['partner-factory-portal'],
    requiresMfaByDefault: false,
    description: 'Operates inside an external factory; accesses only tasks and drawings explicitly assigned by their Factory Manager.'
  },
  {
    id: 'ut-consultant',
    code: 'CONSULTANT',
    name: 'External Engineer / Facade Consultant',
    category: 'External Consultant',
    isExternal: true,
    defaultRoleId: 'role-engineer',
    defaultScope: 'Project',
    defaultPortalIds: ['document-control', 'quality-assurance', 'project-management'],
    requiresMfaByDefault: true,
    description: 'Independent consultant reviewing AFC drawings, structural calculations, ITP hold points, and witness tests for assigned projects.'
  },
  {
    id: 'ut-view-only',
    code: 'VIEW_ONLY',
    name: 'Read-Only Observer / Auditor',
    category: 'Internal Commercial & Support',
    isExternal: false,
    defaultRoleId: 'role-auditor',
    defaultScope: 'Department',
    defaultPortalIds: ['company-control-center', 'reporting-analytics', 'document-control'],
    requiresMfaByDefault: false,
    description: 'Strictly non-mutating read access to authorized portals and reports.'
  }
];

// ============================================================================
// 3. STANDARD PERMISSION TEMPLATES (WITH CLONING & VERSION HISTORY)
// ============================================================================
export const SEED_PERMISSION_TEMPLATES: PermissionTemplate[] = [
  {
    id: 'tpl-super-admin',
    code: 'SUPER_ADMIN',
    name: 'Super Administrator Master Template',
    targetUserType: 'SUPER_ADMIN',
    departmentCode: 'SYSTEM',
    version: 3,
    isStandard: true,
    description: 'Complete unrestricted authorization across all 22 portals, 24 modules, and 480+ permission codes.',
    defaultScope: 'Global',
    authorizedPortalIds: SEED_PORTAL_REGISTRY.map(p => p.portalId),
    permissionCodes: ['*'],
    versionHistory: [
      { version: 1, updatedAt: '2026-01-10T08:00:00Z', updatedBy: 'System Bootstrap', changeNotes: 'Initial enterprise baseline', permissionCount: 480 },
      { version: 2, updatedAt: '2026-05-14T10:30:00Z', updatedBy: 'Alexander Vance', changeNotes: 'Added Factory Execution & Biometric HR scopes', permissionCount: 480 },
      { version: 3, updatedAt: '2026-09-01T09:00:00Z', updatedBy: 'Alexander Vance', changeNotes: 'Added Break-Glass & Connected API Client governance', permissionCount: 480 }
    ],
    createdAt: '2026-01-10T08:00:00Z',
    updatedAt: '2026-09-01T09:00:00Z'
  },
  {
    id: 'tpl-project-manager',
    code: 'PROJECT_MANAGER',
    name: 'Project Manager Standard Package',
    targetUserType: 'PROJECT_MANAGER',
    departmentCode: 'OPERATIONS',
    version: 2,
    isStandard: true,
    description: 'Standard access package for Project Managers covering WBS planning, factory assignment, site control, and variation submissions.',
    defaultScope: 'Project',
    authorizedPortalIds: ['company-control-center', 'project-management', 'construction-site-management', 'factory-workshop-management', 'quality-assurance', 'hse-safety', 'document-control', 'reporting-analytics'],
    permissionCodes: [
      'project.view', 'project.create', 'project.edit', 'project.submit', 'project.assign', 'project.export',
      'planning.view', 'planning.create', 'planning.edit', 'planning.submit', 'planning.approve',
      'execution.view', 'execution.create', 'execution.edit', 'execution.submit', 'execution.assign',
      'qc.view', 'qc.create', 'boq.view', 'boq.edit', 'boq.submit', 'resource.view', 'resource.assign',
      'site.view', 'site.create', 'site.edit', 'doc.view', 'doc.upload', 'doc.download', 'proj_report.view', 'proj_report.export'
    ],
    versionHistory: [
      { version: 1, updatedAt: '2026-02-01T08:00:00Z', updatedBy: 'Alexander Vance', changeNotes: 'Standard PM permissions', permissionCount: 28 },
      { version: 2, updatedAt: '2026-08-15T11:20:00Z', updatedBy: 'Alexander Vance', changeNotes: 'Added Factory Work Package assignment rights', permissionCount: 31 }
    ],
    createdAt: '2026-02-01T08:00:00Z',
    updatedAt: '2026-08-15T11:20:00Z'
  },
  {
    id: 'tpl-site-supervisor',
    code: 'SITE_SUPERVISOR',
    name: 'Site Supervisor & Field Foreman Package',
    targetUserType: 'SITE_SUPERVISOR',
    departmentCode: 'OPERATIONS',
    version: 1,
    isStandard: true,
    description: 'Field execution package for site supervisors: daily logs, PTW requests, delivery receiving, and WIR inspections.',
    defaultScope: 'Project',
    authorizedPortalIds: ['company-control-center', 'construction-site-management', 'hse-safety', 'quality-assurance', 'logistics-dispatch', 'document-control'],
    permissionCodes: [
      'project.view', 'planning.view', 'execution.view', 'execution.edit', 'execution.submit',
      'site.view', 'site.create', 'site.edit', 'qc.view', 'qc.create', 'doc.view', 'doc.download'
    ],
    versionHistory: [
      { version: 1, updatedAt: '2026-02-10T08:00:00Z', updatedBy: 'Alexander Vance', changeNotes: 'Initial Site Supervisor template', permissionCount: 12 }
    ],
    createdAt: '2026-02-10T08:00:00Z',
    updatedAt: '2026-02-10T08:00:00Z'
  },
  {
    id: 'tpl-qa-qc-engineer',
    code: 'QA_QC',
    name: 'QA/QC Engineer & ITP Inspector Package',
    targetUserType: 'QA_QC_OFFICER',
    departmentCode: 'QUALITY',
    version: 2,
    isStandard: true,
    description: 'Quality Assurance template with authority to inspect, approve/reject hold points, raise NCRs, and manage CAPAs.',
    defaultScope: 'Project',
    authorizedPortalIds: ['company-control-center', 'quality-assurance', 'factory-workshop-management', 'construction-site-management', 'document-control'],
    permissionCodes: [
      'qc.view', 'qc.create', 'qc.edit', 'qc.submit', 'qc.approve', 'qc.reject', 'qc.upload', 'qc.print',
      'project.view', 'execution.view', 'site.view', 'doc.view', 'doc.upload', 'doc.download'
    ],
    versionHistory: [
      { version: 1, updatedAt: '2026-02-15T08:00:00Z', updatedBy: 'Alexander Vance', changeNotes: 'Initial QC Inspector template', permissionCount: 14 },
      { version: 2, updatedAt: '2026-07-20T14:00:00Z', updatedBy: 'Alexander Vance', changeNotes: 'Added Factory FAT & NCR Quarantine Hold controls', permissionCount: 14 }
    ],
    createdAt: '2026-02-15T08:00:00Z',
    updatedAt: '2026-07-20T14:00:00Z'
  },
  {
    id: 'tpl-factory-manager',
    code: 'FACTORY_MANAGER',
    name: 'Internal Factory & Plant Manager Package',
    targetUserType: 'FACTORY_MANAGER',
    departmentCode: 'FACTORY_PRODUCTION',
    version: 2,
    isStandard: true,
    description: 'Full plant execution authority for assigned factory: work packages, tasks, worksheets, bays, machinery, and dispatch.',
    defaultScope: 'Factory',
    authorizedPortalIds: ['company-control-center', 'factory-workshop-management', 'production-control', 'quality-assurance', 'hse-safety', 'inventory-warehouse', 'equipment-machinery', 'logistics-dispatch', 'document-control'],
    permissionCodes: [
      'execution.view', 'execution.create', 'execution.edit', 'execution.submit', 'execution.approve', 'execution.assign',
      'project.view', 'planning.view', 'qc.view', 'qc.create', 'resource.view', 'resource.assign',
      'equipment.view', 'equipment.edit', 'grn.view', 'doc.view', 'doc.upload', 'doc.download', 'doc.print'
    ],
    versionHistory: [
      { version: 1, updatedAt: '2026-03-01T08:00:00Z', updatedBy: 'Alexander Vance', changeNotes: 'Initial Factory Manager package', permissionCount: 19 },
      { version: 2, updatedAt: '2026-09-10T09:00:00Z', updatedBy: 'Alexander Vance', changeNotes: 'Added 6-Stage Supervisor Hub & Crate Dispatch controls', permissionCount: 19 }
    ],
    createdAt: '2026-03-01T08:00:00Z',
    updatedAt: '2026-09-10T09:00:00Z'
  },
  {
    id: 'tpl-hr-officer',
    code: 'HR_OFFICER',
    name: 'HR & Crewing Officer Package',
    targetUserType: 'HR_OFFICER',
    departmentCode: 'HR',
    version: 1,
    isStandard: true,
    description: 'Human Resources operational package covering employee profiles, biometric terminals, meal scans, and paysheet drafting.',
    defaultScope: 'Department',
    authorizedPortalIds: ['company-control-center', 'human-resources'],
    permissionCodes: [
      'hr.view', 'hr.create', 'hr.edit', 'hr.submit', 'hr.upload', 'hr.export',
      'payroll.view', 'payroll.create', 'payroll.edit', 'payroll.submit'
    ],
    versionHistory: [
      { version: 1, updatedAt: '2026-03-12T08:00:00Z', updatedBy: 'Alexander Vance', changeNotes: 'Initial HR Officer package', permissionCount: 10 }
    ],
    createdAt: '2026-03-12T08:00:00Z',
    updatedAt: '2026-03-12T08:00:00Z'
  },
  {
    id: 'tpl-accountant',
    code: 'ACCOUNTANT',
    name: 'Corporate Accountant Package (SoD Compliant)',
    targetUserType: 'FINANCE_ACCOUNTING_OFFICER',
    departmentCode: 'FINANCE',
    version: 1,
    isStandard: true,
    description: 'Accounting operational package for GL vouchers, AR invoicing, AP 3-way match verification, and tax preparation (excludes final payout approval per SoD).',
    defaultScope: 'Department',
    authorizedPortalIds: ['company-control-center', 'accounting-finance', 'reporting-analytics'],
    permissionCodes: [
      'accounting.view', 'accounting.create', 'accounting.edit', 'accounting.submit', 'accounting.export',
      'finance.view', 'finance.create', 'finance.edit', 'finance.submit', 'mgmt_report.view', 'mgmt_report.export'
    ],
    versionHistory: [
      { version: 1, updatedAt: '2026-03-15T08:00:00Z', updatedBy: 'Alexander Vance', changeNotes: 'SoD-compliant Accountant template', permissionCount: 11 }
    ],
    createdAt: '2026-03-15T08:00:00Z',
    updatedAt: '2026-03-15T08:00:00Z'
  },
  {
    id: 'tpl-customer',
    code: 'CUSTOMER',
    name: 'External Customer / Client Portal Package',
    targetUserType: 'CUSTOMER',
    departmentCode: 'COMMERCIAL_ADMIN',
    version: 1,
    isStandard: true,
    description: 'Organization-isolated client access to view their own projects, quotes, milestone invoices, and warranty certificates, and approve variations.',
    defaultScope: 'Organization',
    authorizedPortalIds: ['customer-portal'],
    permissionCodes: ['project.view', 'boq.view', 'doc.view', 'doc.download', 'proj_report.view'],
    versionHistory: [
      { version: 1, updatedAt: '2026-04-01T08:00:00Z', updatedBy: 'Alexander Vance', changeNotes: 'External Customer isolation package', permissionCount: 5 }
    ],
    createdAt: '2026-04-01T08:00:00Z',
    updatedAt: '2026-04-01T08:00:00Z'
  },
  {
    id: 'tpl-supplier',
    code: 'SUPPLIER',
    name: 'External Supplier & Bidding Portal Package',
    targetUserType: 'SUPPLIER',
    departmentCode: 'PROCUREMENT_SUPPLY_CHAIN',
    version: 1,
    isStandard: true,
    description: 'Vendor portal access restricted to invited RFQs, reverse auctions, issued POs, and compliance document uploads.',
    defaultScope: 'Organization',
    authorizedPortalIds: ['supplier-portal'],
    permissionCodes: ['rfq.view', 'rfq.submit', 'po.view', 'doc.upload', 'doc.download'],
    versionHistory: [
      { version: 1, updatedAt: '2026-04-05T08:00:00Z', updatedBy: 'Alexander Vance', changeNotes: 'External Supplier portal template', permissionCount: 5 }
    ],
    createdAt: '2026-04-05T08:00:00Z',
    updatedAt: '2026-04-05T08:00:00Z'
  },
  {
    id: 'tpl-external-factory',
    code: 'EXTERNAL_FACTORY_MANAGER',
    name: 'External Factory / Fabricator Partner Package',
    targetUserType: 'EXTERNAL_FACTORY_MANAGER',
    departmentCode: 'FACTORY_PRODUCTION',
    version: 2,
    isStandard: true,
    description: 'Strict factory-scoped access for external fabrication partners: view assigned work packages, AFC drawings, submit worksheets, and request QC.',
    defaultScope: 'Factory',
    authorizedPortalIds: ['partner-factory-portal', 'factory-workshop-management', 'document-control'],
    permissionCodes: [
      'execution.view', 'execution.edit', 'execution.submit', 'execution.upload',
      'qc.view', 'qc.create', 'doc.view', 'doc.upload', 'doc.download', 'doc.print'
    ],
    versionHistory: [
      { version: 1, updatedAt: '2026-05-01T08:00:00Z', updatedBy: 'Alexander Vance', changeNotes: 'Initial External Fabricator template', permissionCount: 10 },
      { version: 2, updatedAt: '2026-09-12T10:00:00Z', updatedBy: 'Alexander Vance', changeNotes: 'Enforced strict Factory ID & Work Package isolation', permissionCount: 10 }
    ],
    createdAt: '2026-05-01T08:00:00Z',
    updatedAt: '2026-09-12T10:00:00Z'
  }
];

// ============================================================================
// 4. BRANCHES & FACILITIES MASTER
// ============================================================================
export const SEED_BRANCHES: BranchDefinition[] = [
  {
    id: 'br-hq-01',
    branchCode: 'BR-HQ-01',
    name: 'Head Office',
    type: 'Head Office',
    city: 'Colombo / Dubai HQ',
    country: 'Sri Lanka / UAE',
    isHeadOffice: true,
    managerName: 'Alexander Vance',
    status: 'Active'
  },
  {
    id: 'br-store-01',
    branchCode: 'BR-STR-01',
    name: 'Main Store',
    type: 'Main Store',
    city: 'Colombo Central',
    country: 'Sri Lanka',
    isHeadOffice: false,
    managerName: 'Tariq Mansoor',
    status: 'Active'
  },
  {
    id: 'br-dxb-01',
    branchCode: 'BR-FAB-DXB',
    name: 'Dubai Fabrication Yard',
    type: 'Fabrication Plant',
    city: 'Dubai Industrial City',
    country: 'UAE',
    isHeadOffice: false,
    managerName: 'Marcus Sterling',
    status: 'Active'
  },
  {
    id: 'br-auh-01',
    branchCode: 'BR-SITE-AUH',
    name: 'Abu Dhabi Site Hub',
    type: 'Site Operations Hub',
    city: 'Abu Dhabi Reem Island',
    country: 'UAE',
    isHeadOffice: false,
    managerName: 'Samir Al-Nasser',
    status: 'Active'
  },
  {
    id: 'br-cmb-01',
    branchCode: 'BR-CMB-01',
    name: 'Colombo Central',
    type: 'Fabrication Plant',
    city: 'Colombo',
    country: 'Sri Lanka',
    isHeadOffice: false,
    managerName: 'Rohan Wijesinghe',
    status: 'Active'
  },
  {
    id: 'br-kdy-01',
    branchCode: 'BR-KDY-01',
    name: 'Kandy Hub',
    type: 'Regional Office',
    city: 'Kandy',
    country: 'Sri Lanka',
    isHeadOffice: false,
    managerName: 'Kasun Perera',
    status: 'Active'
  }
];

// ============================================================================
// 5. ORGANIZATIONS (INTERNAL & EXTERNAL MULTI-TENANT ENTITIES)
// ============================================================================
export const SEED_EXTERNAL_ORGANIZATIONS: ExternalOrganization[] = [
  {
    id: 'org-inv-hq',
    orgCode: 'ORG-INV-001',
    name: 'Innovista Precision Engineering Corp (Internal HQ)',
    orgType: 'INTERNAL_HQ',
    status: 'Active',
    primaryContactName: 'Alexander Vance',
    primaryContactEmail: 'admin@innovista.com',
    phone: '+971 4 880 4000',
    country: 'UAE / Sri Lanka',
    city: 'Dubai / Colombo',
    linkedFactoryIds: ['fac-inv-01', 'fac-inv-02'],
    assignedProjectIds: ['*'],
    assignedWorkPackageIds: ['*'],
    authorizedPortalIds: SEED_PORTAL_REGISTRY.map(p => p.portalId),
    documentVisibilityScope: ['Approved Drawings', 'BOQ & Contracts', 'Worksheets', 'QC Inspections', 'Invoices & Payments', 'Progress Reports', 'Warranty Certificates'],
    canApproveVariations: true,
    canApproveDrawings: true,
    canSubmitProgress: true,
    createdAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'org-ext-fac-01',
    orgCode: 'ORG-EXT-FAC-01',
    name: 'Al-Futtaim Architectural Metalworks LLC',
    orgType: 'EXTERNAL_FACTORY',
    status: 'Active',
    primaryContactName: 'Hassan Al-Maktoum',
    primaryContactEmail: 'hassan@alfuttaim-metal.ae',
    phone: '+971 4 339 1122',
    country: 'UAE',
    city: 'Jebel Ali Industrial',
    linkedFactoryIds: ['fac-ext-01'],
    assignedProjectIds: ['PRJ-2026-001'],
    assignedWorkPackageIds: ['fwp-02'],
    authorizedPortalIds: ['partner-factory-portal', 'factory-workshop-management', 'document-control'],
    documentVisibilityScope: ['Approved Drawings', 'Worksheets', 'QC Inspections', 'Progress Reports'],
    canApproveVariations: false,
    canApproveDrawings: false,
    canSubmitProgress: true,
    createdAt: '2026-02-15T09:00:00Z'
  },
  {
    id: 'org-ext-fac-02',
    orgCode: 'ORG-EXT-FAC-02',
    name: 'Lanka Structural Steel & Powder Coaters Pvt Ltd',
    orgType: 'EXTERNAL_WORKSHOP',
    status: 'Active',
    primaryContactName: 'Nalin Bandara',
    primaryContactEmail: 'nalin@lankasteelcoat.lk',
    phone: '+94 11 290 5544',
    country: 'Sri Lanka',
    city: 'Biyagama Export Zone',
    linkedFactoryIds: ['fac-ext-02'],
    assignedProjectIds: ['PRJ-2026-002'],
    assignedWorkPackageIds: ['fwp-03'],
    authorizedPortalIds: ['partner-factory-portal'],
    documentVisibilityScope: ['Approved Drawings', 'Worksheets', 'QC Inspections'],
    canApproveVariations: false,
    canApproveDrawings: false,
    canSubmitProgress: true,
    createdAt: '2026-03-10T09:00:00Z'
  },
  {
    id: 'org-cust-01',
    orgCode: 'ORG-CUST-01',
    name: 'Sapphire Towers Development PLC (B2B Client)',
    orgType: 'B2B_CLIENT',
    status: 'Active',
    primaryContactName: 'Vikram Rajapaksa',
    primaryContactEmail: 'vikram@sapphiretowers.lk',
    phone: '+94 11 233 9900',
    country: 'Sri Lanka',
    city: 'Colombo 01',
    linkedClientId: 'CLI-001',
    linkedFactoryIds: [],
    assignedProjectIds: ['PRJ-2026-001'],
    assignedWorkPackageIds: [],
    authorizedPortalIds: ['customer-portal', 'document-control'],
    documentVisibilityScope: ['Approved Drawings', 'BOQ & Contracts', 'Invoices & Payments', 'Progress Reports', 'Warranty Certificates'],
    canApproveVariations: true,
    canApproveDrawings: true,
    canSubmitProgress: false,
    createdAt: '2026-01-20T09:00:00Z'
  },
  {
    id: 'org-sup-01',
    orgCode: 'ORG-SUP-01',
    name: 'Gulf Extrusions & Architectural Glass Co.',
    orgType: 'SUPPLIER',
    status: 'Active',
    primaryContactName: 'Karim El-Masri',
    primaryContactEmail: 'karim@gulfextrusions.ae',
    phone: '+971 4 884 6600',
    country: 'UAE',
    city: 'Dubai',
    linkedSupplierId: 'SUP-001',
    linkedFactoryIds: [],
    assignedProjectIds: ['PRJ-2026-001', 'PRJ-2026-002'],
    assignedWorkPackageIds: [],
    authorizedPortalIds: ['supplier-portal'],
    documentVisibilityScope: ['BOQ & Contracts', 'QC Inspections'],
    canApproveVariations: false,
    canApproveDrawings: false,
    canSubmitProgress: false,
    createdAt: '2026-02-01T09:00:00Z'
  },
  {
    id: 'org-cons-01',
    orgCode: 'ORG-CONS-01',
    name: 'Arup Facade & Structural Advisory Group',
    orgType: 'CONSULTANT',
    status: 'Active',
    primaryContactName: 'Dr. Clara Vance-Sterling',
    primaryContactEmail: 'clara.facade@arup-advisory.com',
    phone: '+971 4 550 2100',
    country: 'UAE',
    city: 'Dubai DIFC',
    linkedFactoryIds: [],
    assignedProjectIds: ['PRJ-2026-001'],
    assignedWorkPackageIds: ['fwp-01', 'fwp-02'],
    authorizedPortalIds: ['document-control', 'quality-assurance', 'project-management'],
    documentVisibilityScope: ['Approved Drawings', 'QC Inspections', 'Progress Reports'],
    canApproveVariations: false,
    canApproveDrawings: true,
    canSubmitProgress: false,
    createdAt: '2026-02-20T09:00:00Z'
  }
];

// ============================================================================
// 6. PROJECT-BASED & FACTORY-BASED EXPLICIT ACCESS ASSIGNMENTS
// ============================================================================
export const SEED_PROJECT_ASSIGNMENTS: ProjectUserAssignment[] = [
  {
    id: 'pa-01',
    projectId: 'PRJ-2026-001',
    projectName: 'Sapphire Marina Mixed-Use Tower Curtain Wall',
    userId: 'usr-pm-01',
    userFullName: 'Marcus Sterling',
    projectRole: 'Project Manager',
    allowedActions: ['view', 'create', 'edit', 'submit', 'approve', 'assign', 'export', 'print'],
    canApproveMilestones: true,
    canViewFinancials: true,
    assignedBy: 'Alexander Vance',
    assignedAt: '2026-01-15T09:00:00Z'
  },
  {
    id: 'pa-02',
    projectId: 'PRJ-2026-001',
    projectName: 'Sapphire Marina Mixed-Use Tower Curtain Wall',
    userId: 'usr-qc-01',
    userFullName: 'David Okafor',
    projectRole: 'QA/QC',
    allowedActions: ['view', 'create', 'edit', 'approve', 'reject', 'upload', 'print'],
    canApproveMilestones: false,
    canViewFinancials: false,
    assignedBy: 'Marcus Sterling',
    assignedAt: '2026-01-18T09:00:00Z'
  },
  {
    id: 'pa-03',
    projectId: 'PRJ-2026-001',
    projectName: 'Sapphire Marina Mixed-Use Tower Curtain Wall',
    userId: 'usr-qs-01',
    userFullName: 'Julian Chen',
    projectRole: 'QS',
    allowedActions: ['view', 'create', 'edit', 'submit', 'export', 'print'],
    canApproveMilestones: false,
    canViewFinancials: true,
    assignedBy: 'Marcus Sterling',
    assignedAt: '2026-01-20T09:00:00Z'
  },
  {
    id: 'pa-04',
    projectId: 'PRJ-2026-001',
    projectName: 'Sapphire Marina Mixed-Use Tower Curtain Wall',
    userId: 'usr-ext-fac-01',
    userFullName: 'Hassan Al-Maktoum',
    projectRole: 'External Fabricator',
    allowedActions: ['view', 'edit', 'submit', 'upload', 'print'],
    canApproveMilestones: false,
    canViewFinancials: false,
    assignedBy: 'Marcus Sterling',
    assignedAt: '2026-02-16T09:00:00Z'
  },
  {
    id: 'pa-05',
    projectId: 'PRJ-2026-001',
    projectName: 'Sapphire Marina Mixed-Use Tower Curtain Wall',
    userId: 'usr-cust-01',
    userFullName: 'Vikram Rajapaksa',
    projectRole: 'Customer Representative',
    allowedActions: ['view', 'approve', 'reject', 'comment', 'download', 'print'],
    canApproveMilestones: true,
    canViewFinancials: true,
    assignedBy: 'Alexander Vance',
    assignedAt: '2026-01-22T09:00:00Z'
  }
];

export const SEED_FACTORY_ASSIGNMENTS: FactoryUserAssignment[] = [
  {
    id: 'fa-01',
    factoryId: 'fac-inv-01',
    factoryName: 'Innovista Central Curtain Wall & Aluminium Plant (Colombo)',
    isExternalFactory: false,
    userId: 'usr-pm-01',
    userFullName: 'Marcus Sterling',
    factoryRole: 'Factory Manager',
    assignedProjectIds: ['PRJ-2026-001', 'PRJ-2026-002'],
    assignedWorkPackageIds: ['fwp-01', 'fwp-03'],
    allowedActions: ['view', 'create', 'edit', 'submit', 'approve', 'assign', 'upload', 'print', 'execute'],
    assignedBy: 'Alexander Vance',
    assignedAt: '2026-01-15T09:00:00Z'
  },
  {
    id: 'fa-02',
    factoryId: 'fac-inv-01',
    factoryName: 'Innovista Central Curtain Wall & Aluminium Plant (Colombo)',
    isExternalFactory: false,
    userId: 'usr-qc-01',
    userFullName: 'David Okafor',
    factoryRole: 'QA/QC Inspector',
    assignedProjectIds: ['PRJ-2026-001', 'PRJ-2026-002'],
    assignedWorkPackageIds: ['fwp-01', 'fwp-02', 'fwp-03'],
    allowedActions: ['view', 'create', 'edit', 'approve', 'reject', 'upload', 'print'],
    assignedBy: 'Alexander Vance',
    assignedAt: '2026-01-16T09:00:00Z'
  },
  {
    id: 'fa-03',
    factoryId: 'fac-ext-01',
    factoryName: 'Al-Futtaim Architectural Metalworks (External Partner Plant)',
    isExternalFactory: true,
    userId: 'usr-ext-fac-01',
    userFullName: 'Hassan Al-Maktoum',
    factoryRole: 'Factory Manager',
    assignedProjectIds: ['PRJ-2026-001'],
    assignedWorkPackageIds: ['fwp-02'],
    allowedActions: ['view', 'edit', 'submit', 'upload', 'download', 'print', 'execute'],
    assignedBy: 'Marcus Sterling',
    assignedAt: '2026-02-15T09:00:00Z'
  }
];

// ============================================================================
// 7. RECORD-LEVEL SENSITIVE ACCESS GRANTS
// ============================================================================
export const SEED_RECORD_ACCESS_GRANTS: RecordLevelAccessGrant[] = [
  {
    id: 'rlg-01',
    recordCategory: 'Salary & Payroll Sheet',
    recordId: 'PAY-RUN-2026-09',
    recordTitle: 'Executive & Senior Management September 2026 WPS Payroll Master',
    classification: 'Highly Confidential',
    authorizedUserIds: ['usr-admin-01', 'usr-hr-01', 'usr-fin-01'],
    authorizedRoleIds: ['role-superadmin', 'role-hrmgr', 'role-finmgr'],
    deniedUserIds: ['usr-pm-01', 'usr-qs-01', 'usr-qc-01'],
    allowedActions: ['view', 'approve', 'export'],
    ownerUserId: 'usr-hr-01',
    createdAt: '2026-09-01T08:00:00Z'
  },
  {
    id: 'rlg-02',
    recordCategory: 'Master Contract Agreement',
    recordId: 'CNT-SAPPHIRE-2026',
    recordTitle: 'Sapphire Marina Tower FIDIC Turnkey Facade Contract & Margin Breakdown',
    classification: 'Confidential',
    authorizedUserIds: ['usr-admin-01', 'usr-pm-01', 'usr-fin-01', 'usr-qs-01'],
    authorizedRoleIds: ['role-superadmin', 'role-md', 'role-finmgr'],
    deniedUserIds: ['usr-ext-fac-01', 'usr-sup-01'],
    allowedActions: ['view', 'download', 'print'],
    ownerUserId: 'usr-admin-01',
    createdAt: '2026-01-15T08:00:00Z'
  },
  {
    id: 'rlg-03',
    recordCategory: 'Disciplinary Case',
    recordId: 'HR-CASE-2026-014',
    recordTitle: 'Confidential Site Safety Violation Inquiry — Bay 04',
    classification: 'Restricted',
    authorizedUserIds: ['usr-admin-01', 'usr-hr-01'],
    authorizedRoleIds: ['role-superadmin', 'role-hrmgr'],
    deniedUserIds: [],
    allowedActions: ['view', 'edit', 'close'],
    ownerUserId: 'usr-hr-01',
    createdAt: '2026-08-20T08:00:00Z'
  },
  {
    id: 'rlg-04',
    recordCategory: 'Security Configuration',
    recordId: 'SEC-CORE-POLICY-V4',
    recordTitle: 'Innovista Root RBAC, MFA & Break-Glass Cryptographic Configuration',
    classification: 'Restricted',
    authorizedUserIds: ['usr-admin-01'],
    authorizedRoleIds: ['role-superadmin'],
    deniedUserIds: [],
    allowedActions: ['view', 'configure', 'admin'],
    ownerUserId: 'usr-admin-01',
    createdAt: '2026-01-01T00:00:00Z'
  }
];

// ============================================================================
// 8. CONNECTED SOFTWARE APPLICATIONS & API CLIENTS
// ============================================================================
export const SEED_CONNECTED_APPLICATIONS: ConnectedApplicationClient[] = [
  {
    id: 'app-mobile-field',
    appCode: 'APP-MOB-01',
    appName: 'Innovista Site & Field Companion Mobile App (iOS / Android)',
    appType: 'Mobile Application',
    clientId: 'cli_inv_mobile_field_99281a',
    apiKeyPrefix: 'inv_live_mob_88a2',
    apiKeyHash: 'sha256:9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    status: 'Active',
    grantedScopes: ['project:read', 'factory:read', 'quality:read', 'quality:write', 'hse:read', 'hse:write', 'documents:read', 'permissions:verify'],
    restrictedProjectIds: ['*'],
    restrictedFactoryIds: ['*'],
    rateLimitPerMinute: 600,
    lastUsedAt: '2026-09-26T09:45:00Z',
    lastIpAddress: '10.42.18.119',
    createdBy: 'Alexander Vance',
    createdAt: '2026-01-12T08:00:00Z'
  },
  {
    id: 'app-cnc-bridge',
    appCode: 'APP-CNC-02',
    appName: 'Shop-Floor Elumatec 5-Axis CNC & Barcode Telemetry Bridge',
    appType: 'Shop-Floor Terminal',
    clientId: 'cli_inv_cnc_telemetry_4410b',
    apiKeyPrefix: 'inv_live_cnc_41f9',
    apiKeyHash: 'sha256:4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
    status: 'Active',
    grantedScopes: ['factory:read', 'factory:write', 'inventory:read', 'documents:read'],
    restrictedProjectIds: ['PRJ-2026-001', 'PRJ-2026-002'],
    restrictedFactoryIds: ['fac-inv-01', 'fac-inv-02'],
    rateLimitPerMinute: 1200,
    lastUsedAt: '2026-09-26T10:12:00Z',
    lastIpAddress: '192.168.10.204',
    createdBy: 'Alexander Vance',
    createdAt: '2026-02-04T08:00:00Z'
  },
  {
    id: 'app-ext-partner-sync',
    appCode: 'APP-EXT-03',
    appName: 'Al-Futtaim External Fabricator EDI Gateway',
    appType: 'External Partner Bridge',
    clientId: 'cli_ext_alfuttaim_edi_7731c',
    apiKeyPrefix: 'inv_ext_afm_77c1',
    apiKeyHash: 'sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    status: 'Active',
    grantedScopes: ['factory:read', 'factory:write', 'quality:read', 'documents:read'],
    restrictedProjectIds: ['PRJ-2026-001'],
    restrictedFactoryIds: ['fac-ext-01'],
    rateLimitPerMinute: 120,
    lastUsedAt: '2026-09-26T08:30:00Z',
    lastIpAddress: '185.93.22.10',
    createdBy: 'Marcus Sterling',
    createdAt: '2026-03-19T08:00:00Z'
  },
  {
    id: 'app-biometric-hw',
    appCode: 'APP-BIO-04',
    appName: 'ZKTeco & Honeywell Laser Terminal Attendance/Meal Sync Engine',
    appType: 'Biometric Hardware Gateway',
    clientId: 'cli_inv_biometric_gate_1109d',
    apiKeyPrefix: 'inv_live_bio_19d4',
    apiKeyHash: 'sha256:d4735e3a265e16eee03f59718b9b5d03019c07d8b6c51f90da3a666eec13ab35',
    status: 'Active',
    grantedScopes: ['hr:read', 'hr:write', 'system:health'],
    restrictedProjectIds: [],
    restrictedFactoryIds: ['fac-inv-01', 'fac-inv-02'],
    rateLimitPerMinute: 2400,
    lastUsedAt: '2026-09-26T10:15:00Z',
    lastIpAddress: '192.168.12.50',
    createdBy: 'Sara Jenkins',
    createdAt: '2026-02-28T08:00:00Z'
  },
  {
    id: 'app-procure-bridge',
    appCode: 'APP-PRC-05',
    appName: 'ProcureFlow Nexus 3-Way Match & Bank WPS Connector',
    appType: 'ERP Microservice',
    clientId: 'cli_inv_procure_wps_5582e',
    apiKeyPrefix: 'inv_live_prc_55e8',
    apiKeyHash: 'sha256:4e07408562bedb8b60ce05c1decfe3ad16b72230967de01f640b7e4729b49fce',
    status: 'Active',
    grantedScopes: ['inventory:read', 'inventory:write', 'accounting:read', 'accounting:write', 'reports:read'],
    restrictedProjectIds: ['*'],
    restrictedFactoryIds: ['*'],
    rateLimitPerMinute: 300,
    lastUsedAt: '2026-09-26T09:50:00Z',
    lastIpAddress: '10.10.0.14',
    createdBy: 'Elena Rostova',
    createdAt: '2026-03-05T08:00:00Z'
  }
];

// ============================================================================
// 9. BREAK-GLASS EMERGENCY ACCESS SESSIONS & GLOBAL SECURITY POLICY
// ============================================================================
export const SEED_BREAK_GLASS_SESSIONS: BreakGlassEmergencySession[] = [
  {
    id: 'bg-2026-01',
    sessionCode: 'BG-EMG-2026-009',
    activatedByUserId: 'usr-pm-01',
    activatedByName: 'Marcus Sterling',
    authorizedByAdminName: 'Alexander Vance',
    targetRoleElevated: 'Operations Manager (Emergency Factory Release)',
    targetScope: 'Factory: fac-inv-01 / Project: PRJ-2026-001',
    reason: 'Urgent midnight crane slot at Sapphire Marina Tower required emergency FAT & Dispatch release while Quality Manager was airborne.',
    incidentTicketRef: 'INC-OPS-2026-441',
    mfaVerified: true,
    startedAt: '2026-09-18T22:15:00Z',
    expiresAt: '2026-09-19T02:15:00Z',
    endedAt: '2026-09-19T00:40:00Z',
    status: 'Terminated',
    actionsLogged: [
      '22:18 — Approved FAT Inspection FIR-2026-008',
      '22:24 — Authorized Crate Packing List PKL-2026-019',
      '22:31 — Released Gate Pass DN-2026-019 for Vehicle WP LM-8821'
    ]
  }
];

export const DEFAULT_SECURITY_POLICY: SecurityPolicyConfiguration = {
  enforceDenyByDefault: true,
  enforceMandatoryMfaForAdmins: true,
  enforceMandatoryMfaForFinance: true,
  enforceStrictProjectScoping: true,
  enforceStrictFactoryScoping: true,
  enforceExternalOrgIsolation: true,
  requireDualApprovalForHighRiskPrivileges: true,
  maxFailedLoginAttempts: 5,
  lockoutDurationMinutes: 15,
  sessionExpirationHours: 24,
  inactivityTimeoutMinutes: 30,
  suspiciousIpDetectionEnabled: true,
  passwordMinLength: 8,
  passwordRotationDays: 90,
  breakGlassMaxDurationMinutes: 240
};
