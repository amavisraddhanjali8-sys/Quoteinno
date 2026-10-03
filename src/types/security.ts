// ============================================================================
// INNOVISTA CENTRAL IDENTITY, USER, ROLE, PORTAL & PERMISSION CONTROL CENTER
// Single Authoritative Security & Authorization Layer — Type Definitions
// Hierarchy: Organization → Branch → Department → Portal → Module → Feature
//            → Action → Project → Site/Factory/Workshop → Record
// ============================================================================

export type AccountStatus = 
  | 'Invited'
  | 'Pending Verification'
  | 'Pending Activation' 
  | 'Onboarding'
  | 'Active' 
  | 'On Leave'
  | 'Inactive' 
  | 'Suspended' 
  | 'Locked' 
  | 'Deactivated'
  | 'Terminated'
  | 'Archived';

export type DepartmentCode = 
  | 'OPERATIONS' 
  | 'COMMERCIAL_ADMIN' 
  | 'PROCUREMENT_SUPPLY_CHAIN'
  | 'MANAGEMENT'
  | 'PROJECT_MANAGEMENT'
  | 'QUALITY'
  | 'HSE'
  | 'HR'
  | 'FINANCE'
  | 'ENGINEERING'
  | 'FACTORY_PRODUCTION'
  | 'LOGISTICS'
  | 'SYSTEM'
  | 'ENGINEERING_QS'
  | 'FINANCE_ACCOUNTING'
  | 'HR_ADMIN';

export type PermissionAction = 
  | 'view' 
  | 'create' 
  | 'edit' 
  | 'delete' 
  | 'archive'
  | 'restore' 
  | 'approve' 
  | 'reject' 
  | 'submit' 
  | 'assign' 
  | 'reassign'
  | 'transfer' 
  | 'import' 
  | 'export' 
  | 'download' 
  | 'upload' 
  | 'print' 
  | 'share'
  | 'comment'
  | 'execute'
  | 'close'
  | 'reopen'
  | 'lock' 
  | 'unlock' 
  | 'manage'
  | 'configure' 
  | 'admin';

export type AccessScopeType = 
  | 'Global' 
  | 'Organization'
  | 'Branch' 
  | 'Department' 
  | 'Portal'
  | 'Team' 
  | 'Project' 
  | 'Factory'
  | 'Workshop'
  | 'Assigned Records' 
  | 'Own Records' 
  | 'Restricted';

export type AdminAuthorityLevel =
  | 'SUPER_ADMINISTRATOR'
  | 'SYSTEM_ADMINISTRATOR'
  | 'DEPARTMENT_ADMINISTRATOR'
  | 'PORTAL_ADMINISTRATOR'
  | 'PROJECT_ADMINISTRATOR'
  | 'FACTORY_ADMINISTRATOR'
  | 'STANDARD_USER'
  | 'NONE';

export type UserTypeCode =
  | 'SYSTEM_ADMINISTRATOR'
  | 'SUPER_ADMIN'
  | 'EXECUTIVE'
  | 'MANAGEMENT'
  | 'OPERATIONS_MANAGER'
  | 'PROJECT_MANAGER'
  | 'PROJECT_ENGINEER'
  | 'QS'
  | 'ARCHITECT'
  | 'DESIGNER'
  | 'ARCHITECT_DESIGNER'
  | 'SITE_SUPERVISOR'
  | 'SITE_ENGINEER'
  | 'QA_QC_OFFICER'
  | 'HSE_OFFICER'
  | 'FACTORY_MANAGER'
  | 'WORKSHOP_MANAGER'
  | 'PRODUCTION_MANAGER'
  | 'FABRICATOR'
  | 'MACHINE_OPERATOR'
  | 'STORE_RESOURCE_OFFICER'
  | 'HR_MANAGER'
  | 'HR_OFFICER'
  | 'FINANCE_MANAGER'
  | 'FINANCE_ACCOUNTING_OFFICER'
  | 'SALES_MANAGER'
  | 'SALES_OFFICER'
  | 'LOGISTICS_MANAGER'
  | 'CUSTOMER'
  | 'RESIDENT_CLIENT'
  | 'B2B_CLIENT'
  | 'SUPPLIER'
  | 'SUBCONTRACTOR'
  | 'STRATEGIC_PARTNER'
  | 'EXTERNAL_FACTORY'
  | 'EXTERNAL_FACTORY_MANAGER'
  | 'EXTERNAL_FACTORY_WORKER'
  | 'EXTERNAL_WORKSHOP'
  | 'DRIVER'
  | 'TECHNICIAN'
  | 'CONSULTANT'
  | 'VIEW_ONLY';

export type ConfigurableUserTypeCode = UserTypeCode | string;

export interface UserTypeDefinition {
  id: string;
  code: ConfigurableUserTypeCode;
  name: string;
  category: 'Internal Administration' | 'Internal Management' | 'Internal Engineering & Site' | 'Internal Factory & Production' | 'Internal Commercial & Support' | 'External Client' | 'External Supply Chain & Factory' | 'External Consultant';
  isExternal: boolean;
  defaultRoleId: string;
  defaultScope: AccessScopeType;
  defaultPortalIds: string[];
  requiresMfaByDefault: boolean;
  description: string;
}

export type CentralPortalId =
  | 'company-control-center'
  | 'executive-dashboard'
  | 'project-management'
  | 'construction-site-management'
  | 'factory-workshop-management'
  | 'production-control'
  | 'quality-assurance'
  | 'hse-safety'
  | 'human-resources'
  | 'accounting-finance'
  | 'inventory-warehouse'
  | 'procurement-supply-chain'
  | 'logistics-dispatch'
  | 'equipment-machinery'
  | 'document-control'
  | 'customer-portal'
  | 'supplier-portal'
  | 'partner-factory-portal'
  | 'reporting-analytics'
  | 'engineering-qs-boq'
  | 'sales-crm-quotes'
  | 'system-administration';

export interface PortalModuleDefinition {
  moduleId: string;
  moduleName: string;
  features: string[];
  availableActions: PermissionAction[];
  permissionPrefix: string;
}

export interface PortalRegistryEntry {
  portalId: CentralPortalId;
  portalName: string;
  shortName: string;
  category: 'Core Enterprise' | 'Engineering & Projects' | 'Factory & Operations' | 'Commercial & Finance' | 'External Ecosystem' | 'Governance';
  appViewTarget: string;
  operationalSubPortal?: string;
  moduleHierarchy: PortalModuleDefinition[];
  availableActions: PermissionAction[];
  requiredPermissions: string[];
  supportedScopes: AccessScopeType[];
  apiEndpoints: string[];
  sensitiveOperations: string[];
  requiredRoles: string[];
  auditEvents: string[];
  dependentServices: string[];
  isExternalPortal?: boolean;
}

export interface PermissionTemplate {
  id: string;
  code: string;
  name: string;
  targetUserType: UserTypeCode;
  departmentCode?: DepartmentCode;
  version: number;
  isStandard: boolean;
  clonedFromId?: string;
  description: string;
  defaultScope: AccessScopeType;
  authorizedPortalIds: CentralPortalId[];
  permissionCodes: string[];
  versionHistory: {
    version: number;
    updatedAt: string;
    updatedBy: string;
    changeNotes: string;
    permissionCount: number;
  }[];
  createdAt: string;
  updatedAt: string;
}

export type ExternalOrganizationType =
  | 'INTERNAL_HQ'
  | 'CUSTOMER'
  | 'RESIDENT_CLIENT'
  | 'B2B_CLIENT'
  | 'SUPPLIER'
  | 'SUBCONTRACTOR'
  | 'STRATEGIC_PARTNER'
  | 'EXTERNAL_FACTORY'
  | 'EXTERNAL_WORKSHOP'
  | 'CONSULTANT';

export interface ExternalOrganization {
  id: string;
  orgCode: string;
  name: string;
  orgType: ExternalOrganizationType;
  status: 'Active' | 'Pending Verification' | 'Suspended' | 'Archived';
  primaryContactName: string;
  primaryContactEmail: string;
  phone: string;
  country: string;
  city: string;
  linkedClientId?: string;
  linkedSupplierId?: string;
  linkedFactoryIds: string[];
  assignedProjectIds: string[];
  assignedWorkPackageIds: string[];
  authorizedPortalIds: CentralPortalId[];
  documentVisibilityScope: ('Approved Drawings' | 'BOQ & Contracts' | 'Worksheets' | 'QC Inspections' | 'Invoices & Payments' | 'Progress Reports' | 'Warranty Certificates')[];
  canApproveVariations?: boolean;
  canApproveDrawings?: boolean;
  canSubmitProgress?: boolean;
  createdAt: string;
}

export interface BranchDefinition {
  id: string;
  branchCode: string;
  name: string;
  type: 'Head Office' | 'Main Store' | 'Fabrication Plant' | 'Site Operations Hub' | 'Regional Office' | 'Logistics Hub';
  city: string;
  country: string;
  isHeadOffice: boolean;
  managerName: string;
  activeUsersCount?: number;
  status: 'Active' | 'Maintenance' | 'Inactive';
}

export type ProjectRoleType =
  | 'Project Manager'
  | 'Project Engineer'
  | 'QS'
  | 'Site Supervisor'
  | 'QA/QC'
  | 'HSE'
  | 'Factory Coordinator'
  | 'Customer Representative'
  | 'External Fabricator'
  | 'Viewer';

export interface ProjectUserAssignment {
  id: string;
  projectId: string;
  projectName: string;
  userId: string;
  userFullName: string;
  projectRole: ProjectRoleType;
  allowedActions: PermissionAction[];
  canApproveMilestones: boolean;
  canViewFinancials: boolean;
  assignedBy: string;
  assignedAt: string;
}

export interface FactoryUserAssignment {
  id: string;
  factoryId: string;
  factoryName: string;
  isExternalFactory: boolean;
  userId: string;
  userFullName: string;
  factoryRole: 'Factory Manager' | 'Workshop Manager' | 'Production Manager' | 'QA/QC Inspector' | 'HSE Officer' | 'Fabricator' | 'Machine Operator' | 'Store Officer' | 'External Coordinator';
  assignedProjectIds: string[];
  assignedWorkPackageIds: string[];
  allowedActions: PermissionAction[];
  assignedBy: string;
  assignedAt: string;
}

export interface RecordLevelAccessGrant {
  id: string;
  recordCategory: 'Confidential HR Document' | 'Salary & Payroll Sheet' | 'Executive Financial Ledger' | 'Master Contract Agreement' | 'Disciplinary Case' | 'Security Configuration' | 'Sensitive Client Record';
  recordId: string;
  recordTitle: string;
  classification: DocumentClassification;
  authorizedUserIds: string[];
  authorizedRoleIds: string[];
  deniedUserIds: string[];
  allowedActions: PermissionAction[];
  ownerUserId: string;
  createdAt: string;
}

export type ApiScopeCode =
  | 'project:read'
  | 'project:write'
  | 'factory:read'
  | 'factory:write'
  | 'quality:read'
  | 'quality:write'
  | 'hse:read'
  | 'hse:write'
  | 'inventory:read'
  | 'inventory:write'
  | 'accounting:read'
  | 'accounting:write'
  | 'hr:read'
  | 'hr:write'
  | 'documents:read'
  | 'documents:write'
  | 'reports:read'
  | 'reports:export'
  | 'users:read'
  | 'roles:read'
  | 'permissions:verify'
  | 'system:health';

export interface ConnectedApplicationClient {
  id: string;
  appCode: string;
  appName: string;
  appType: 'Mobile Application' | 'Shop-Floor Terminal' | 'External Partner Bridge' | 'ERP Microservice' | 'Biometric Hardware Gateway' | 'BI Analytics Connector';
  clientId: string;
  apiKeyPrefix: string;
  apiKeyHash: string;
  status: 'Active' | 'Revoked' | 'Rate Limited' | 'Pending Approval';
  grantedScopes: ApiScopeCode[];
  restrictedProjectIds: string[];
  restrictedFactoryIds: string[];
  rateLimitPerMinute: number;
  lastUsedAt?: string;
  lastIpAddress?: string;
  createdBy: string;
  createdAt: string;
  rotatedAt?: string;
}

export interface BreakGlassEmergencySession {
  id: string;
  sessionCode: string;
  activatedByUserId: string;
  activatedByName: string;
  authorizedByAdminName: string;
  targetRoleElevated: string;
  targetScope: string;
  reason: string;
  incidentTicketRef: string;
  mfaVerified: boolean;
  startedAt: string;
  expiresAt: string;
  endedAt?: string;
  status: 'Active' | 'Expired' | 'Terminated';
  actionsLogged: string[];
}

export interface SecurityPolicyConfiguration {
  enforceDenyByDefault: boolean;
  enforceMandatoryMfaForAdmins: boolean;
  enforceMandatoryMfaForFinance: boolean;
  enforceStrictProjectScoping: boolean;
  enforceStrictFactoryScoping: boolean;
  enforceExternalOrgIsolation: boolean;
  requireDualApprovalForHighRiskPrivileges: boolean;
  maxFailedLoginAttempts: number;
  lockoutDurationMinutes: number;
  sessionExpirationHours: number;
  inactivityTimeoutMinutes: number;
  suspiciousIpDetectionEnabled: boolean;
  passwordMinLength: number;
  passwordRotationDays: number;
  breakGlassMaxDurationMinutes: number;
}

export interface AuthorizationEvaluationStep {
  stepNumber: number;
  stepName:
    | '1. User Authentication'
    | '2. Account Status Check'
    | '3. User Type Profile'
    | '4. Role Resolution'
    | '5. Permission & Explicit Deny Resolution'
    | '6. Organization / Branch / Department Scope'
    | '7. Project Scope Check'
    | '8. Factory / Workshop Scope Check'
    | '9. Record-Level Classification Check'
    | '10. Action Permission Verification'
    | '11. Policy Conditions (MFA / SoD / Break-Glass)'
    | '12. Final Decision'
    | '13. Security Audit Event';
  passed: boolean;
  detail: string;
}

export interface AuthorizationDecisionTrace {
  evaluationId: string;
  timestamp: string;
  userId: string;
  username: string;
  userFullName: string;
  userType: ConfigurableUserTypeCode;
  roleName: string;
  portalId?: CentralPortalId;
  moduleName?: string;
  action: PermissionAction | string;
  permissionCode: string;
  targetProjectId?: string;
  targetFactoryId?: string;
  targetBranch?: string;
  targetOrgId?: string;
  targetRecordId?: string;
  allowed: boolean;
  summaryExplanation: string;
  steps: AuthorizationEvaluationStep[];
}

export type DocumentClassification = 
  | 'Public' 
  | 'Internal' 
  | 'Confidential' 
  | 'Highly Confidential' 
  | 'Restricted';

export interface Department {
  id: string;
  code: DepartmentCode;
  name: string;
  description: string;
  color: string;
  subDepartments: string[];
  headOfDepartmentId?: string;
  defaultTemplateId?: string;
  isActive: boolean;
}

export interface Designation {
  id: string;
  title: string;
  departmentCode: DepartmentCode;
  level: 'Executive' | 'Management' | 'Senior' | 'Operational' | 'Staff';
  description?: string;
}

export interface Permission {
  id: string;
  code: string; // e.g. "project.create", "boq.approve", "invoice.edit"
  module: string; // e.g. "Project Management", "Invoicing", "Quality Control"
  portalId?: CentralPortalId;
  departmentCode: DepartmentCode | 'SYSTEM';
  action: PermissionAction;
  name: string;
  description: string;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  requiresDualApproval?: boolean;
  isHighRisk?: boolean;
}

export interface Role {
  id: string;
  name: string;
  code: string;
  departmentCode?: DepartmentCode;
  userTypeCode?: UserTypeCode;
  adminAuthorityLevel?: AdminAuthorityLevel;
  isSystem: boolean;
  isExternalRole?: boolean;
  description: string;
  defaultScope: AccessScopeType;
  authorizedPortalIds?: CentralPortalId[];
  permissionCodes: string[];
  deniedPermissionCodes?: string[];
  version?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SecurityUser {
  id: string;
  employeeId: string;
  fullName: string;
  username: string;
  email: string;
  mobile: string;
  profileImage?: string;
  userType?: ConfigurableUserTypeCode;
  adminAuthorityLevel?: AdminAuthorityLevel;
  isExternalUser?: boolean;
  organizationId?: string;
  organizationName?: string;
  organizationType?: ExternalOrganizationType;
  department: DepartmentCode;
  secondaryDepartments?: DepartmentCode[];
  designation: string;
  roleId: string;
  roleName: string;
  secondaryRoleIds?: string[];
  permissionTemplateId?: string;
  branch: string; // Primary branch
  assignedBranches: string[];
  managerId?: string;
  managerName?: string;
  employmentStatus: 'Full-Time' | 'Contract' | 'Probation' | 'Consultant' | 'External Partner' | 'Customer Account' | 'Terminated';
  accountStatus: AccountStatus;
  status?: AccountStatus;
  phone?: string;
  mfaEnabled: boolean;
  mfaMethod?: 'TOTP' | 'EMAIL_OTP' | 'RECOVERY_CODE';
  recoveryCodesRemaining?: number;
  defaultScope: AccessScopeType;
  authorizedPortalIds?: CentralPortalId[];
  revokedPortalIds?: CentralPortalId[];
  assignedProjectIds: string[]; // Project-level access control
  deniedProjectIds?: string[];
  assignedFactoryIds?: string[]; // Factory/Workshop-level access control
  deniedFactoryIds?: string[];
  assignedWorkshopIds?: string[];
  directPermissionCodes?: string[]; // Explicit allow overrides
  deniedPermissionCodes?: string[]; // Explicit deny overrides (reduce inherited privileges)
  failedLoginAttempts: number;
  lockedUntil?: string | null;
  lastLogin?: string;
  lastPasswordChange: string;
  onboardingCompleted?: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserSession {
  id: string;
  userId: string;
  username: string;
  fullName: string;
  userType?: ConfigurableUserTypeCode;
  roleName?: string;
  device: string;
  browser: string;
  os: string;
  ipAddress: string;
  location: string;
  authMethod?: 'Password + TOTP MFA' | 'Password + Email OTP' | 'SSO Corporate' | 'Break-Glass Token' | 'Direct Terminal';
  isSuspicious?: boolean;
  lastActivity: string;
  loginTime: string;
  isCurrent: boolean;
  expiresAt: string;
}

export interface TemporaryAccessGrant {
  id: string;
  userId: string;
  userName: string;
  permissionCode: string;
  permissionName: string;
  scope: AccessScopeType;
  startDate: string;
  expiryDate: string;
  reason: string;
  grantedBy: string;
  grantedAt: string;
  isActive: boolean;
}

export interface PermissionDelegation {
  id: string;
  delegatorId: string;
  delegatorName: string;
  delegatorRole: string;
  delegateeId: string;
  delegateeName: string;
  delegateeRole: string;
  delegatedPermissions: string[];
  scope: AccessScopeType;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'Active' | 'Scheduled' | 'Expired' | 'Revoked';
  approvedBy?: string;
  createdAt: string;
}

export interface AccessRequest {
  id: string;
  requestNumber: string;
  requesterId: string;
  requesterName: string;
  requesterRole: string;
  requesterDepartment: DepartmentCode;
  requestType: 'Role Change' | 'Project Access' | 'Factory Access' | 'Portal Access' | 'Branch Access' | 'Temporary Permission' | 'Scope Elevation' | 'High-Risk Privilege';
  requestedItem: string; // e.g. "Project-Dubai-Marina-01", "finance.approve"
  requestedResource?: string;
  reason?: string;
  requestedAt?: string;
  targetPortalId?: CentralPortalId;
  targetProjectId?: string;
  targetFactoryId?: string;
  requestedPermissionCodes?: string[];
  requestedPermissions?: string[];
  requestedRoleId?: string;
  requestedRoleName?: string;
  riskLevel?: 'Low' | 'Medium' | 'High' | 'Critical';
  requiresDualApproval?: boolean;
  currentLevel?: string;
  requestedLevel?: string;
  justification: string;
  isHighRisk?: boolean;
  requiresSecondAdminApproval?: boolean;
  firstApproverName?: string;
  secondApproverName?: string;
  duration?: 'Permanent' | 'Temporary (7 days)' | 'Temporary (30 days)' | 'Temporary (90 days)';
  expiryDate?: string;
  status: 'Pending Review' | 'Awaiting 2nd Admin Approval' | 'Manager Approved' | 'Admin Approved' | 'Rejected' | 'Revoked';
  reviewerComments?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt?: string;
}

export interface ApprovalWorkflowStep {
  stepNumber: number;
  roleName: string;
  approverUserId?: string;
  approverName?: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Skipped';
  actionTimestamp?: string;
  comments?: string;
}

export interface ApprovalWorkflowInstance {
  id: string;
  workflowType: 'Project Variation' | 'Purchase Order' | 'Invoice Payment' | 'Quality NCR Closure' | 'Access Request';
  entityId: string;
  entityTitle: string;
  currentStepIndex: number;
  steps: ApprovalWorkflowStep[];
  overallStatus: 'In Progress' | 'Approved' | 'Rejected' | 'Cancelled';
  initiatedBy: string;
  initiatedAt: string;
  completedAt?: string;
}

export interface SegregationOfDutyRule {
  id: string;
  ruleCode: string;
  ruleName: string;
  category?: 'Financial Approval' | 'Privilege Escalation' | 'Procurement & Receiving' | 'Quality & Production' | 'Master Data & Security';
  description: string;
  conflictingPermissionA: string;
  conflictingPermissionB: string;
  severity: 'Warning' | 'Strict Block';
  isActive: boolean;
}

export interface SecurityAuditEvent {
  id: string;
  correlationId?: string;
  userId?: string;
  username: string;
  userFullName?: string;
  userRole?: string;
  department?: DepartmentCode | string;
  moduleName?: string;
  action: 
    | 'LOGIN_SUCCESS' 
    | 'LOGIN_FAILED' 
    | 'LOGOUT' 
    | 'FORCE_LOGOUT'
    | 'PASSWORD_CHANGE' 
    | 'PASSWORD_RESET_REQUEST' 
    | 'PASSWORD_RESET_COMPLETE'
    | 'ACCOUNT_LOCKED' 
    | 'ACCOUNT_UNLOCKED' 
    | 'ACCOUNT_SUSPENDED' 
    | 'ACCOUNT_ACTIVATED' 
    | 'ACCOUNT_DEACTIVATED'
    | 'ACCOUNT_ARCHIVED'
    | 'USER_CREATED' 
    | 'USER_EDITED' 
    | 'USER_TRANSFERRED'
    | 'ROLE_CHANGED' 
    | 'PERMISSION_GRANTED' 
    | 'PERMISSION_REVOKED'
    | 'PORTAL_ACCESS_CHANGED'
    | 'PROJECT_ASSIGNED'
    | 'FACTORY_ASSIGNED'
    | 'ORGANIZATION_ASSIGNED'
    | 'TEMPLATE_CLONED'
    | 'MFA_ENABLED' 
    | 'MFA_DISABLED' 
    | 'ACCESS_REQUEST_SUBMITTED' 
    | 'ACCESS_REQUEST_APPROVED' 
    | 'ACCESS_REQUEST_REJECTED' 
    | 'DELEGATION_CREATED' 
    | 'DELEGATION_REVOKED' 
    | 'BREAK_GLASS_ACTIVATED'
    | 'BREAK_GLASS_ENDED'
    | 'IMPERSONATION_STARTED'
    | 'IMPERSONATION_ENDED'
    | 'API_KEY_CREATED'
    | 'API_KEY_ROTATED'
    | 'API_KEY_REVOKED'
    | 'POLICY_UPDATED'
    | 'ACCESS_DENIED'
    | 'ACCESS_DENIED_ATTEMPT'
    | 'DATA_EXPORT' 
    | 'DOCUMENT_DOWNLOAD' 
    | 'CONFIDENTIAL_ACCESS'
    | (string & {});
  target: string;
  portalId?: string;
  projectId?: string;
  factoryId?: string;
  previousValue?: string;
  oldValue?: string;
  newValue?: string;
  details?: string;
  ipAddress: string;
  device: string;
  severity: 'Info' | 'Warning' | 'Security Alert' | 'Critical';
  timestamp: string;
}

export interface SecurityStats {
  totalUsers: number;
  activeUsers: number;
  externalUsers?: number;
  pendingActivationUsers: number;
  suspendedUsers: number;
  lockedUsers: number;
  activeSessions: number;
  adminCount: number;
  totalRoles: number;
  totalPortals?: number;
  totalOrganizations?: number;
  connectedAppsCount?: number;
  activeBreakGlassCount?: number;
  pendingAccessRequests: number;
  securityAlertsToday: number;
}
