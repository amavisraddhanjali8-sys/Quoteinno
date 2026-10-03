import { SecurityUser } from '../types/security';

export interface UserLandingRoute {
  view: string;
  operationalSubPortal?: string;
  operationalPortalId?: string;
  badgeLabel: string;
  portalTitle: string;
}

export interface DemoPortalAccount {
  id: string;
  name: string;
  role: string;
  label: string;
  portalTitle: string;
  colorClass: string;
}

export const DEMO_PORTAL_ACCOUNTS: DemoPortalAccount[] = [
  {
    id: 'usr-01',
    name: 'Alexander Vance',
    role: 'Super Administrator',
    label: 'Super Admin',
    portalTitle: 'Innovista Company Control Center',
    colorClass: 'text-orange-600'
  },
  {
    id: 'usr-02',
    name: 'Marcus Sterling',
    role: 'Senior Project Manager',
    label: 'Project Mgr',
    portalTitle: 'Assigned Projects & WBS Hub',
    colorClass: 'text-blue-600'
  },
  {
    id: 'usr-10',
    name: 'Roshan De Silva',
    role: 'Factory Manager',
    label: 'Factory Mgr',
    portalTitle: 'Factories Execution & Production Hub',
    colorClass: 'text-emerald-600'
  },
  {
    id: 'usr-11',
    name: 'Tariq Al-Mansoor',
    role: 'External Factory Manager',
    label: 'Ext. Factory',
    portalTitle: 'External Partner Factory Hub (fac-ext-01)',
    colorClass: 'text-indigo-600'
  },
  {
    id: 'usr-04',
    name: 'Priya Nair',
    role: 'QA/QC Inspector',
    label: 'QA/QC',
    portalTitle: 'Quality Control, ITPs & Compliance',
    colorClass: 'text-purple-600'
  },
  {
    id: 'usr-05',
    name: 'Victoria Chen',
    role: 'Finance Manager',
    label: 'Finance',
    portalTitle: 'Corporate Accounting & Financial Hub',
    colorClass: 'text-amber-600'
  },
  {
    id: 'usr-07',
    name: 'Tariq Al-Mansoor (Procurement)',
    role: 'Procurement Manager',
    label: 'Procurement',
    portalTitle: 'Procurement & Supply Chain Hub',
    colorClass: 'text-teal-600'
  },
  {
    id: 'usr-12',
    name: 'Deshamanya K. Balendra',
    role: 'B2B Client Representative',
    label: 'Client Org',
    portalTitle: 'Client Self-Service Portal (PRJ-2026-001)',
    colorClass: 'text-rose-600'
  }
];

/**
 * Resolves the authoritative landing portal and operational sub-portal
 * for any authenticated internal or external user based on their
 * UserType, Role, Organization Type, and Department.
 */
export function resolveUserLandingRoute(user?: SecurityUser | null): UserLandingRoute {
  if (!user) {
    return {
      view: 'home',
      badgeLabel: 'Company Control Center',
      portalTitle: 'Innovista Workspace'
    };
  }

  const roleId = (user.roleId || '').toLowerCase();
  const roleName = (user.roleName || '').toLowerCase();
  const userType = user.userType || 'STANDARD';
  const dept = user.department;

  // 1. Super Admin / System Admin / Managing Director -> Executive or Home Control Center
  if (
    roleId === 'role-superadmin' ||
    roleId === 'role-sysadmin' ||
    roleId === 'role-md' ||
    userType === 'SUPER_ADMIN' ||
    userType === 'SYSTEM_ADMINISTRATOR' ||
    userType === 'EXECUTIVE'
  ) {
    return {
      view: 'home',
      badgeLabel: 'Executive & Global Control',
      portalTitle: 'Innovista Company Control Center'
    };
  }

  // 2. External Partner Factory Manager / External Workshop Operator -> Factories Portal (Isolated to assigned Factory)
  if (
    userType === 'EXTERNAL_FACTORY' ||
    userType === 'EXTERNAL_FACTORY_MANAGER' ||
    userType === 'EXTERNAL_FACTORY_WORKER' ||
    userType === 'EXTERNAL_WORKSHOP' ||
    roleId === 'role-ext-fac-mgr' ||
    roleId === 'role-ext-fac-worker'
  ) {
    return {
      view: 'operational-control',
      operationalSubPortal: 'factories',
      operationalPortalId: 'factories',
      badgeLabel: 'External Partner Factory Hub',
      portalTitle: 'Assigned Factory & Work Package Execution'
    };
  }

  // 3. Internal Factory Manager / Workshop Manager / Production Manager / Fabricator -> Factories Portal
  if (
    userType === 'FACTORY_MANAGER' ||
    userType === 'WORKSHOP_MANAGER' ||
    userType === 'PRODUCTION_MANAGER' ||
    userType === 'FABRICATOR' ||
    userType === 'MACHINE_OPERATOR' ||
    roleId === 'role-facmgr' ||
    roleId === 'role-workshopmgr' ||
    roleId === 'role-prodmgr' ||
    roleId === 'role-fabricator' ||
    dept === 'FACTORY_PRODUCTION'
  ) {
    return {
      view: 'operational-control',
      operationalSubPortal: 'factories',
      operationalPortalId: 'factories',
      badgeLabel: 'Factories & Shop-Floor Control',
      portalTitle: 'Factories Execution & Production Hub'
    };
  }

  // 4. Customer / Resident Client / B2B Client -> Customer Portal
  if (
    userType === 'CUSTOMER' ||
    userType === 'RESIDENT_CLIENT' ||
    userType === 'B2B_CLIENT' ||
    roleId === 'role-customer'
  ) {
    return {
      view: 'portal-view',
      badgeLabel: 'Client Self-Service Portal',
      portalTitle: 'Project Progress, Submittals & Approvals'
    };
  }

  // 5. External Supplier / Subcontractor -> Procurement & Supplier Hub
  if (
    userType === 'SUPPLIER' ||
    userType === 'SUBCONTRACTOR' ||
    roleId === 'role-supplier'
  ) {
    return {
      view: 'procurement',
      badgeLabel: 'Supplier & Vendor Portal',
      portalTitle: 'RFQs, Purchase Orders & Delivery ASN'
    };
  }

  // 6. Procurement Department Roles -> Procurement & Supply Chain Hub
  if (
    dept === 'PROCUREMENT_SUPPLY_CHAIN' ||
    roleId.includes('proc') ||
    roleId.includes('buyer') ||
    roleId.includes('supplier')
  ) {
    return {
      view: 'procurement',
      badgeLabel: 'Procurement & Supply Chain Hub',
      portalTitle: 'Procurement, RFQ, PO & Supplier Control'
    };
  }

  // 7. Quality Assurance / QA-QC Inspector -> Quality Control Portal
  if (
    userType === 'QA_QC_OFFICER' ||
    dept === 'QUALITY' ||
    roleId.includes('qc') ||
    roleName.includes('quality')
  ) {
    return {
      view: 'quality-control',
      operationalSubPortal: 'quality',
      operationalPortalId: 'quality_hse',
      badgeLabel: 'QA/QC Inspection & NCR Hub',
      portalTitle: 'Quality Control, ITPs & Compliance'
    };
  }

  // 8. Site Manager / Site Supervisor / HSE Officer -> Site Management Portal
  if (
    userType === 'SITE_SUPERVISOR' ||
    userType === 'SITE_ENGINEER' ||
    userType === 'HSE_OFFICER' ||
    dept === 'HSE' ||
    roleId.includes('site') ||
    roleName.includes('site')
  ) {
    return {
      view: 'site-management',
      operationalSubPortal: 'shop_floor',
      operationalPortalId: 'worksheets_daily',
      badgeLabel: 'Field & Site Operations Hub',
      portalTitle: 'Site Management, Permits & Daily Logs'
    };
  }

  // 9. Quantity Surveyor (QS) / Engineer / Architect -> Engineering & BOQ
  if (
    userType === 'QS' ||
    userType === 'PROJECT_ENGINEER' ||
    userType === 'ARCHITECT' ||
    userType === 'DESIGNER' ||
    dept === 'ENGINEERING' ||
    dept === 'ENGINEERING_QS' ||
    roleId === 'role-qs' ||
    roleId === 'role-engineer' ||
    roleName.includes('quantity surveyor')
  ) {
    return {
      view: 'boq-items',
      operationalSubPortal: 'product',
      operationalPortalId: 'tasks_planning',
      badgeLabel: 'Engineering, QS & BOQ Hub',
      portalTitle: 'Products, Engineering Drawings & BOQ Control'
    };
  }

  // 10. Resource & Plant Manager -> Operational Control (Resource & Plant Allocation)
  if (
    userType === 'STORE_RESOURCE_OFFICER' ||
    roleId === 'role-resmgr' ||
    roleName.includes('resource')
  ) {
    return {
      view: 'resource-management',
      operationalSubPortal: 'resource_allocation',
      operationalPortalId: 'resources_materials',
      badgeLabel: 'Resource & Plant Operations',
      portalTitle: 'Workforce & Equipment Dispatch'
    };
  }

  // 11. Finance / Accounting -> Accounting & Financial Control
  if (
    userType === 'FINANCE_MANAGER' ||
    userType === 'FINANCE_ACCOUNTING_OFFICER' ||
    dept === 'FINANCE' ||
    dept === 'FINANCE_ACCOUNTING' ||
    roleId.includes('fin') ||
    roleId.includes('acct') ||
    roleName.includes('finance') ||
    roleName.includes('accountant')
  ) {
    return {
      view: 'accounting',
      operationalSubPortal: 'accounting',
      operationalPortalId: 'analytics_audit',
      badgeLabel: 'Financial & Accounting Hub',
      portalTitle: 'Corporate Accounting, Invoicing & Ledger'
    };
  }

  // 12. HR & Payroll -> HR & Workforce Portal
  if (
    userType === 'HR_MANAGER' ||
    userType === 'HR_OFFICER' ||
    dept === 'HR' ||
    dept === 'HR_ADMIN' ||
    roleId.includes('hr') ||
    roleName.includes('hr') ||
    roleName.includes('human resource')
  ) {
    return {
      view: 'operational-control',
      operationalSubPortal: 'hr',
      operationalPortalId: 'hr',
      badgeLabel: 'Human Capital & Payroll Hub',
      portalTitle: 'HR Master, Attendance & Payroll'
    };
  }

  // 13. Project Manager / Project Coordinator / Operations Manager -> Projects Hub
  if (
    userType === 'PROJECT_MANAGER' ||
    userType === 'OPERATIONS_MANAGER' ||
    roleId === 'role-pm' ||
    roleId === 'role-pcoord' ||
    roleId === 'role-opsmanager' ||
    dept === 'OPERATIONS' ||
    dept === 'PROJECT_MANAGEMENT'
  ) {
    return {
      view: 'projects',
      operationalSubPortal: 'project_management',
      operationalPortalId: 'factories',
      badgeLabel: 'Project Delivery & WBS Hub',
      portalTitle: 'Assigned Projects, Milestones & Variations'
    };
  }

  // Fallback -> Company Control Center Home
  return {
    view: 'home',
    badgeLabel: 'Department Portal',
    portalTitle: 'Innovista Workspace'
  };
}

export function getUniquePortalForUser(user?: SecurityUser | null): UserLandingRoute {
  return resolveUserLandingRoute(user);
}
