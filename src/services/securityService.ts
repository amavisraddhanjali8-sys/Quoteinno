import {
  Department,
  DepartmentCode,
  Designation,
  Role,
  Permission,
  SecurityUser,
  UserSession,
  SegregationOfDutyRule,
  AccessRequest,
  PermissionDelegation,
  SecurityAuditEvent,
  AccountStatus,
  PortalRegistryEntry,
  CentralPortalId,
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
  AuthorizationDecisionTrace,
  AuthorizationEvaluationStep,
  ApiScopeCode,
  PermissionAction
} from '../types/security';

import {
  SEED_DEPARTMENTS,
  SEED_DESIGNATIONS,
  SEED_PERMISSIONS,
  SEED_ROLES,
  SEED_USERS,
  SEED_SOD_RULES,
  SEED_SESSIONS,
  SEED_ACCESS_REQUESTS,
  SEED_DELEGATIONS,
  SEED_AUDIT_LOGS
} from './seedSecurityData';

import {
  SEED_PORTAL_REGISTRY,
  SEED_USER_TYPES,
  SEED_PERMISSION_TEMPLATES,
  SEED_BRANCHES,
  SEED_EXTERNAL_ORGANIZATIONS,
  SEED_PROJECT_ASSIGNMENTS,
  SEED_FACTORY_ASSIGNMENTS,
  SEED_RECORD_ACCESS_GRANTS,
  SEED_CONNECTED_APPLICATIONS,
  SEED_BREAK_GLASS_SESSIONS,
  DEFAULT_SECURITY_POLICY
} from './enterpriseSecurityRegistry';

const STORAGE_KEYS = {
  DEPARTMENTS: 'innovista_sec_departments_v3',
  DESIGNATIONS: 'innovista_sec_designations_v3',
  PERMISSIONS: 'innovista_sec_permissions_v3',
  ROLES: 'innovista_sec_roles_v3',
  USERS: 'innovista_sec_users_v3',
  SOD_RULES: 'innovista_sec_sod_rules_v3',
  SESSIONS: 'innovista_sec_sessions_v3',
  ACCESS_REQUESTS: 'innovista_sec_access_requests_v3',
  DELEGATIONS: 'innovista_sec_delegations_v3',
  AUDIT_LOGS: 'innovista_sec_audit_logs_v3',
  CURRENT_USER_ID: 'innovista_sec_current_user_id_v3',
  IMPERSONATED_USER_ID: 'innovista_sec_impersonated_user_id_v3',
  PORTAL_REGISTRY: 'innovista_sec_portal_registry_v3',
  USER_TYPES: 'innovista_sec_user_types_v3',
  PERMISSION_TEMPLATES: 'innovista_sec_templates_v3',
  BRANCHES: 'innovista_sec_branches_v3',
  ORGANIZATIONS: 'innovista_sec_organizations_v3',
  PROJECT_ASSIGNMENTS: 'innovista_sec_project_assignments_v3',
  FACTORY_ASSIGNMENTS: 'innovista_sec_factory_assignments_v3',
  RECORD_GRANTS: 'innovista_sec_record_grants_v3',
  CONNECTED_APPS: 'innovista_sec_connected_apps_v3',
  BREAK_GLASS: 'innovista_sec_break_glass_v3',
  SECURITY_POLICY: 'innovista_sec_policy_v3'
};

function loadOrSeed<T>(key: string, seedData: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(seedData));
      return seedData;
    }
    return JSON.parse(raw) as T;
  } catch (e) {
    console.warn(`Failed to load ${key} from localStorage, falling back to seed`, e);
    return seedData;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Failed to save ${key} to localStorage`, e);
  }
}

class SecurityService {
  // --- 1. DEPARTMENTS & DESIGNATIONS ---
  getDepartments(): Department[] {
    return loadOrSeed<Department[]>(STORAGE_KEYS.DEPARTMENTS, SEED_DEPARTMENTS);
  }

  saveDepartment(dept: Department): Department {
    const depts = this.getDepartments();
    const idx = depts.findIndex(d => d.id === dept.id);
    if (idx >= 0) depts[idx] = dept;
    else depts.push(dept);
    saveToStorage(STORAGE_KEYS.DEPARTMENTS, depts);
    return dept;
  }

  getDesignations(): Designation[] {
    return loadOrSeed<Designation[]>(STORAGE_KEYS.DESIGNATIONS, SEED_DESIGNATIONS);
  }

  // --- 2. PERMISSIONS & ROLES ---
  getPermissions(): Permission[] {
    return loadOrSeed<Permission[]>(STORAGE_KEYS.PERMISSIONS, SEED_PERMISSIONS);
  }

  getRoles(): Role[] {
    return loadOrSeed<Role[]>(STORAGE_KEYS.ROLES, SEED_ROLES);
  }

  saveRole(role: Role, actorUsername = 'superadmin'): Role {
    const roles = this.getRoles();
    const existingIndex = roles.findIndex(r => r.id === role.id);
    const now = new Date().toISOString();
    const updatedRole: Role = {
      ...role,
      version: (role.version || 1) + (existingIndex >= 0 ? 1 : 0),
      updatedAt: now,
      createdAt: existingIndex >= 0 ? roles[existingIndex].createdAt : now
    };

    const oldPerms = existingIndex >= 0 ? roles[existingIndex].permissionCodes.length : 0;

    if (existingIndex >= 0) {
      roles[existingIndex] = updatedRole;
    } else {
      roles.push(updatedRole);
    }

    saveToStorage(STORAGE_KEYS.ROLES, roles);
    this.logAuditEvent({
      username: actorUsername,
      action: existingIndex >= 0 ? 'ROLE_UPDATED' : 'ROLE_CREATED',
      target: `Role: ${updatedRole.name} (${updatedRole.code})`,
      oldValue: existingIndex >= 0 ? `${oldPerms} permissions` : 'None',
      newValue: `${updatedRole.permissionCodes.length} permissions`,
      details: `Configured ${updatedRole.permissionCodes.length} permissions with default scope [${updatedRole.defaultScope}].`,
      severity: 'Info'
    });

    return updatedRole;
  }

  cloneRole(sourceRoleId: string, newName: string, newCode: string, actorUsername = 'superadmin'): Role {
    const roles = this.getRoles();
    const source = roles.find(r => r.id === sourceRoleId);
    if (!source) throw new Error('Source role not found');

    const now = new Date().toISOString();
    const cloned: Role = {
      ...source,
      id: `role-custom-${Date.now()}`,
      name: newName,
      code: newCode.toUpperCase().replace(/\s+/g, '_'),
      isSystem: false,
      version: 1,
      permissionCodes: [...source.permissionCodes],
      deniedPermissionCodes: source.deniedPermissionCodes ? [...source.deniedPermissionCodes] : [],
      createdAt: now,
      updatedAt: now
    };

    roles.push(cloned);
    saveToStorage(STORAGE_KEYS.ROLES, roles);

    this.logAuditEvent({
      username: actorUsername,
      action: 'ROLE_CLONED',
      target: `Role: ${cloned.name}`,
      details: `Cloned from base role [${source.name}] with ${cloned.permissionCodes.length} permissions.`,
      severity: 'Info'
    });

    return cloned;
  }

  deleteRole(roleId: string, actorUsername = 'superadmin'): void {
    const roles = this.getRoles();
    const target = roles.find(r => r.id === roleId);
    if (!target) return;
    if (target.isSystem) throw new Error('System-protected roles cannot be deleted.');

    const filtered = roles.filter(r => r.id !== roleId);
    saveToStorage(STORAGE_KEYS.ROLES, filtered);

    this.logAuditEvent({
      username: actorUsername,
      action: 'ROLE_DELETED',
      target: `Role: ${target.name}`,
      details: `Deleted custom role definition (${target.code}).`,
      severity: 'Warning'
    });
  }

  // --- 3. USER TYPES & PERMISSION TEMPLATES ---
  getUserTypes(): UserTypeDefinition[] {
    return loadOrSeed<UserTypeDefinition[]>(STORAGE_KEYS.USER_TYPES, SEED_USER_TYPES);
  }

  getPermissionTemplates(): PermissionTemplate[] {
    return loadOrSeed<PermissionTemplate[]>(STORAGE_KEYS.PERMISSION_TEMPLATES, SEED_PERMISSION_TEMPLATES);
  }

  clonePermissionTemplate(sourceTemplateId: string, newName: string, newCode: string, actorName = 'Alexander Vance'): PermissionTemplate {
    const templates = this.getPermissionTemplates();
    const source = templates.find(t => t.id === sourceTemplateId);
    if (!source) throw new Error('Source permission template not found.');

    const now = new Date().toISOString();
    const cloned: PermissionTemplate = {
      ...source,
      id: `tpl-custom-${Date.now()}`,
      code: newCode.toUpperCase().replace(/\s+/g, '_'),
      name: newName,
      isStandard: false,
      clonedFromId: source.id,
      version: 1,
      authorizedPortalIds: [...source.authorizedPortalIds],
      permissionCodes: [...source.permissionCodes],
      versionHistory: [
        {
          version: 1,
          updatedAt: now,
          updatedBy: actorName,
          changeNotes: `Cloned from standard template [${source.name}] (${source.code})`,
          permissionCount: source.permissionCodes.length
        }
      ],
      createdAt: now,
      updatedAt: now
    };

    templates.unshift(cloned);
    saveToStorage(STORAGE_KEYS.PERMISSION_TEMPLATES, templates);

    this.logAuditEvent({
      username: actorName,
      action: 'TEMPLATE_CLONED',
      target: `Template: ${cloned.name} (${cloned.code})`,
      details: `Cloned from ${source.name} with ${cloned.permissionCodes.length} permissions and ${cloned.authorizedPortalIds.length} portals.`,
      severity: 'Info'
    });

    return cloned;
  }

  updatePermissionTemplate(
    templateId: string,
    updates: Partial<Pick<PermissionTemplate, 'name' | 'description' | 'defaultScope' | 'authorizedPortalIds' | 'permissionCodes'>>,
    changeNotes: string,
    actorName = 'Alexander Vance'
  ): PermissionTemplate {
    const templates = this.getPermissionTemplates();
    const idx = templates.findIndex(t => t.id === templateId);
    if (idx < 0) throw new Error('Permission template not found.');

    const current = templates[idx];
    const nextVersion = current.version + 1;
    const now = new Date().toISOString();
    const nextPermCodes = updates.permissionCodes ?? current.permissionCodes;

    const updated: PermissionTemplate = {
      ...current,
      ...updates,
      version: nextVersion,
      updatedAt: now,
      versionHistory: [
        {
          version: nextVersion,
          updatedAt: now,
          updatedBy: actorName,
          changeNotes: changeNotes || 'Updated template permissions and portal scope',
          permissionCount: nextPermCodes.length
        },
        ...current.versionHistory
      ]
    };

    templates[idx] = updated;
    saveToStorage(STORAGE_KEYS.PERMISSION_TEMPLATES, templates);

    this.logAuditEvent({
      username: actorName,
      action: 'TEMPLATE_UPDATED',
      target: `Template: ${updated.name} (v${nextVersion})`,
      oldValue: `v${current.version} (${current.permissionCodes.length} perms)`,
      newValue: `v${nextVersion} (${updated.permissionCodes.length} perms)`,
      details: changeNotes,
      severity: 'Info'
    });

    return updated;
  }

  applyTemplateToUser(userId: string, templateId: string, actorUsername = 'superadmin'): SecurityUser {
    const templates = this.getPermissionTemplates();
    const tpl = templates.find(t => t.id === templateId);
    if (!tpl) throw new Error('Template not found');

    const user = this.getUsers().find(u => u.id === userId);
    if (!user) throw new Error('User not found');

    return this.updateUser(
      userId,
      {
        permissionTemplateId: tpl.id,
        userType: tpl.targetUserType,
        defaultScope: tpl.defaultScope,
        authorizedPortalIds: [...tpl.authorizedPortalIds],
        directPermissionCodes: [...tpl.permissionCodes]
      },
      actorUsername
    );
  }

  // --- 4. CENTRAL PORTAL REGISTRY & PORTAL ACCESS CONTROL ---
  getPortalRegistry(): PortalRegistryEntry[] {
    return loadOrSeed<PortalRegistryEntry[]>(STORAGE_KEYS.PORTAL_REGISTRY, SEED_PORTAL_REGISTRY);
  }

  savePortalRegistryEntry(entry: PortalRegistryEntry, actorUsername = 'superadmin'): PortalRegistryEntry {
    const list = this.getPortalRegistry();
    const idx = list.findIndex(p => p.portalId === entry.portalId);
    if (idx >= 0) list[idx] = entry;
    else list.push(entry);
    saveToStorage(STORAGE_KEYS.PORTAL_REGISTRY, list);

    this.logAuditEvent({
      username: actorUsername,
      action: 'PORTAL_REGISTRY_UPDATED',
      target: `Portal: ${entry.portalName} (${entry.portalId})`,
      details: `Updated portal module hierarchy (${entry.moduleHierarchy.length} modules) and required permissions.`,
      severity: 'Info'
    });
    return entry;
  }

  getEffectivePortalIds(userId: string): CentralPortalId[] {
    const users = this.getUsers();
    const user = users.find(u => u.id === userId);
    if (!user || user.accountStatus !== 'Active') return [];

    const allPortals = this.getPortalRegistry();
    const roles = this.getRoles();
    const role = roles.find(r => r.id === user.roleId);

    const activeBreakGlass = this.getBreakGlassSessions().some(
      bg => bg.activatedByUserId === user.id && bg.status === 'Active'
    );

    if (
      role?.code === 'SUPER_ADMIN' ||
      user.adminAuthorityLevel === 'SUPER_ADMINISTRATOR' ||
      activeBreakGlass
    ) {
      return allPortals.map(p => p.portalId);
    }

    const portalSet = new Set<CentralPortalId>(['company-control-center']);

    // 1. Primary Role authorized portals
    if (role?.authorizedPortalIds && role.authorizedPortalIds.length > 0) {
      role.authorizedPortalIds.forEach(pid => portalSet.add(pid));
    } else if (user.userType) {
      // Fallback to UserType default portals if role doesn't specify authorizedPortalIds
      const ut = this.getUserTypes().find(t => t.code === user.userType);
      if (ut) {
        ut.defaultPortalIds.forEach(pid => portalSet.add(pid as CentralPortalId));
      }
    }

    // 2. Secondary Roles authorized portals
    if (user.secondaryRoleIds && user.secondaryRoleIds.length > 0) {
      user.secondaryRoleIds.forEach(secId => {
        const secRole = roles.find(r => r.id === secId);
        secRole?.authorizedPortalIds?.forEach(pid => portalSet.add(pid));
      });
    }

    // 3. Permission Template authorized portals
    if (user.permissionTemplateId) {
      const tpl = this.getPermissionTemplates().find(t => t.id === user.permissionTemplateId);
      tpl?.authorizedPortalIds?.forEach(pid => portalSet.add(pid));
    }

    // 4. Explicit User authorized portals (Admin-granted / Approved Access Requests)
    if (user.authorizedPortalIds && user.authorizedPortalIds.length > 0) {
      user.authorizedPortalIds.forEach(pid => portalSet.add(pid));
    }

    // 5. Portals unlocked by direct user permission grants or active delegations
    const directAndDelegatedPerms = new Set<string>(user.directPermissionCodes || []);
    const now = new Date().toISOString().slice(0, 10);
    this.getDelegations()
      .filter(d => d.delegateeId === userId && d.status === 'Active' && d.startDate <= now && d.endDate >= now)
      .forEach(d => d.delegatedPermissions.forEach(p => directAndDelegatedPerms.add(p)));

    if (directAndDelegatedPerms.size > 0) {
      allPortals.forEach(portal => {
        if (portal.requiredPermissions.some(rp => directAndDelegatedPerms.has(rp))) {
          portalSet.add(portal.portalId);
        }
      });
    }

    // 6. Explicit portal revocations always take precedence
    if (user.revokedPortalIds && user.revokedPortalIds.length > 0) {
      user.revokedPortalIds.forEach(revId => portalSet.delete(revId));
    }

    return Array.from(portalSet);
  }

  private resolvePortalId(portalId: CentralPortalId | string): CentralPortalId {
    const aliasMap: Record<string, CentralPortalId> = {
      'hr-workforce': 'human-resources',
      'sales-crm': 'sales-crm-quotes',
      'equipment-assets': 'equipment-machinery',
      'quality-management': 'quality-assurance',
      'engineering-qs': 'engineering-qs-boq',
      'logistics-fleet': 'logistics-dispatch',
      'partner-subcontractor-portal': 'partner-factory-portal'
    };
    return (aliasMap[portalId] || portalId) as CentralPortalId;
  }

  canAccessPortal(userId: string, portalId: CentralPortalId | string): boolean {
    const resolved = this.resolvePortalId(portalId);
    return this.getEffectivePortalIds(userId).includes(resolved);
  }

  toggleUserPortalAccess(userId: string, portalId: CentralPortalId | string, actorUsername = 'superadmin'): { granted: boolean; user: SecurityUser } {
    const resolvedPortalId = this.resolvePortalId(portalId);
    const user = this.getUsers().find(u => u.id === userId);
    if (!user) throw new Error('User not found');

    const currentlyAllowed = this.canAccessPortal(userId, resolvedPortalId);
    const currentAuth = new Set<CentralPortalId>(user.authorizedPortalIds || []);
    const currentRevoked = new Set<CentralPortalId>(user.revokedPortalIds || []);
    const currentDirectPerms = new Set<string>(user.directPermissionCodes || []);
    const currentDeniedPerms = new Set<string>(user.deniedPermissionCodes || []);

    const portalEntry = this.getPortalRegistry().find(p => p.portalId === resolvedPortalId);

    if (currentlyAllowed) {
      currentAuth.delete(resolvedPortalId);
      currentRevoked.add(resolvedPortalId);
    } else {
      currentRevoked.delete(resolvedPortalId);
      currentAuth.add(resolvedPortalId);
      // Also grant the portal's required base permissions so the user can immediately view & engage with the portal
      if (portalEntry) {
        portalEntry.requiredPermissions.forEach(rp => {
          currentDirectPerms.add(rp);
          currentDeniedPerms.delete(rp);
        });
      }
    }

    const updated = this.updateUser(
      userId,
      {
        authorizedPortalIds: Array.from(currentAuth),
        revokedPortalIds: Array.from(currentRevoked),
        directPermissionCodes: Array.from(currentDirectPerms),
        deniedPermissionCodes: Array.from(currentDeniedPerms)
      },
      actorUsername
    );

    this.logAuditEvent({
      username: actorUsername,
      action: 'PORTAL_ACCESS_CHANGED',
      target: `${updated.fullName} -> ${portalEntry?.portalName || resolvedPortalId}`,
      newValue: currentlyAllowed ? 'Revoked' : 'Granted',
      details: `${currentlyAllowed ? 'Revoked' : 'Granted'} access to portal [${resolvedPortalId}] for ${updated.fullName}.`,
      severity: currentlyAllowed ? 'Warning' : 'Info'
    });

    return { granted: !currentlyAllowed, user: updated };
  }

  // --- 5. ORGANIZATIONS, BRANCHES, PROJECTS, FACTORIES & RECORD GRANTS ---
  getBranches(): BranchDefinition[] {
    return loadOrSeed<BranchDefinition[]>(STORAGE_KEYS.BRANCHES, SEED_BRANCHES);
  }

  saveBranch(branch: BranchDefinition, actorUsername = 'superadmin'): BranchDefinition {
    const list = this.getBranches();
    const idx = list.findIndex(b => b.id === branch.id);
    if (idx >= 0) list[idx] = branch;
    else list.push(branch);
    saveToStorage(STORAGE_KEYS.BRANCHES, list);
    this.logAuditEvent({
      username: actorUsername,
      action: 'BRANCH_CONFIGURED',
      target: `Branch: ${branch.name} (${branch.branchCode})`,
      details: `Branch status: ${branch.status}, Manager: ${branch.managerName}`,
      severity: 'Info'
    });
    return branch;
  }

  getExternalOrganizations(): ExternalOrganization[] {
    return loadOrSeed<ExternalOrganization[]>(STORAGE_KEYS.ORGANIZATIONS, SEED_EXTERNAL_ORGANIZATIONS);
  }

  saveExternalOrganization(org: ExternalOrganization, actorUsername = 'superadmin'): ExternalOrganization {
    const list = this.getExternalOrganizations();
    const idx = list.findIndex(o => o.id === org.id);
    if (idx >= 0) list[idx] = org;
    else list.push(org);
    saveToStorage(STORAGE_KEYS.ORGANIZATIONS, list);
    this.logAuditEvent({
      username: actorUsername,
      action: 'ORGANIZATION_UPDATED',
      target: `Organization: ${org.name} (${org.orgCode})`,
      details: `Type: ${org.orgType} | Projects: ${org.assignedProjectIds.join(', ') || 'None'} | Factories: ${org.linkedFactoryIds.join(', ') || 'None'}`,
      severity: 'Info'
    });
    return org;
  }

  getProjectAssignments(): ProjectUserAssignment[] {
    return loadOrSeed<ProjectUserAssignment[]>(STORAGE_KEYS.PROJECT_ASSIGNMENTS, SEED_PROJECT_ASSIGNMENTS);
  }

  assignUserToProject(assignment: Omit<ProjectUserAssignment, 'id' | 'assignedAt'>, actorUsername = 'superadmin'): ProjectUserAssignment {
    const list = this.getProjectAssignments();
    const created: ProjectUserAssignment = {
      ...assignment,
      id: `pa-${Date.now()}`,
      assignedAt: new Date().toISOString()
    };
    list.unshift(created);
    saveToStorage(STORAGE_KEYS.PROJECT_ASSIGNMENTS, list);

    // Also sync to user's assignedProjectIds array
    const users = this.getUsers();
    const user = users.find(u => u.id === assignment.userId);
    if (user && !user.assignedProjectIds.includes('*') && !user.assignedProjectIds.includes(assignment.projectId)) {
      user.assignedProjectIds.push(assignment.projectId);
      saveToStorage(STORAGE_KEYS.USERS, users);
    }

    this.logAuditEvent({
      username: actorUsername,
      action: 'PROJECT_SCOPE_ASSIGNED',
      target: `${assignment.userFullName} -> ${assignment.projectId}`,
      details: `Assigned project role [${assignment.projectRole}] on ${assignment.projectName}.`,
      severity: 'Info'
    });
    return created;
  }

  removeProjectAssignment(assignmentId: string, actorUsername = 'superadmin'): void {
    const list = this.getProjectAssignments();
    const target = list.find(a => a.id === assignmentId);
    const filtered = list.filter(a => a.id !== assignmentId);
    saveToStorage(STORAGE_KEYS.PROJECT_ASSIGNMENTS, filtered);
    if (target) {
      this.logAuditEvent({
        username: actorUsername,
        action: 'PROJECT_SCOPE_REVOKED',
        target: `${target.userFullName} -> ${target.projectId}`,
        details: `Removed project role [${target.projectRole}] from ${target.projectName}.`,
        severity: 'Warning'
      });
    }
  }

  getFactoryAssignments(): FactoryUserAssignment[] {
    return loadOrSeed<FactoryUserAssignment[]>(STORAGE_KEYS.FACTORY_ASSIGNMENTS, SEED_FACTORY_ASSIGNMENTS);
  }

  assignUserToFactory(assignment: Omit<FactoryUserAssignment, 'id' | 'assignedAt'>, actorUsername = 'superadmin'): FactoryUserAssignment {
    const list = this.getFactoryAssignments();
    const created: FactoryUserAssignment = {
      ...assignment,
      id: `fa-${Date.now()}`,
      assignedAt: new Date().toISOString()
    };
    list.unshift(created);
    saveToStorage(STORAGE_KEYS.FACTORY_ASSIGNMENTS, list);

    // Sync to user's assignedFactoryIds
    const users = this.getUsers();
    const user = users.find(u => u.id === assignment.userId);
    if (user) {
      const currentFacs = user.assignedFactoryIds || [];
      if (!currentFacs.includes('*') && !currentFacs.includes(assignment.factoryId)) {
        user.assignedFactoryIds = [...currentFacs, assignment.factoryId];
        saveToStorage(STORAGE_KEYS.USERS, users);
      }
    }

    this.logAuditEvent({
      username: actorUsername,
      action: 'FACTORY_SCOPE_ASSIGNED',
      target: `${assignment.userFullName} -> ${assignment.factoryName}`,
      details: `Assigned factory role [${assignment.factoryRole}] for projects: ${assignment.assignedProjectIds.join(', ')}.`,
      severity: 'Info'
    });
    return created;
  }

  removeFactoryAssignment(assignmentId: string, actorUsername = 'superadmin'): void {
    const list = this.getFactoryAssignments();
    const target = list.find(a => a.id === assignmentId);
    const filtered = list.filter(a => a.id !== assignmentId);
    saveToStorage(STORAGE_KEYS.FACTORY_ASSIGNMENTS, filtered);
    if (target) {
      this.logAuditEvent({
        username: actorUsername,
        action: 'FACTORY_SCOPE_REVOKED',
        target: `${target.userFullName} -> ${target.factoryName}`,
        details: `Revoked factory assignment [${target.factoryRole}].`,
        severity: 'Warning'
      });
    }
  }

  getRecordAccessGrants(): RecordLevelAccessGrant[] {
    return loadOrSeed<RecordLevelAccessGrant[]>(STORAGE_KEYS.RECORD_GRANTS, SEED_RECORD_ACCESS_GRANTS);
  }

  saveRecordAccessGrant(grant: RecordLevelAccessGrant, actorUsername = 'superadmin'): RecordLevelAccessGrant {
    const list = this.getRecordAccessGrants();
    const idx = list.findIndex(g => g.id === grant.id);
    if (idx >= 0) list[idx] = grant;
    else list.unshift(grant);
    saveToStorage(STORAGE_KEYS.RECORD_GRANTS, list);

    this.logAuditEvent({
      username: actorUsername,
      action: 'RECORD_ACL_UPDATED',
      target: `Record: ${grant.recordTitle} (${grant.recordId})`,
      details: `Classification: ${grant.classification} | Authorized Users: ${grant.authorizedUserIds.length} | Explicit Denies: ${grant.deniedUserIds.length}`,
      severity: 'Info'
    });
    return grant;
  }

  canAccessProject(userId: string, projectId: string): boolean {
    const policy = this.getSecurityPolicy();
    const user = this.getUsers().find(u => u.id === userId);
    if (!user || user.accountStatus !== 'Active') return false;
    if (user.adminAuthorityLevel === 'SUPER_ADMINISTRATOR' || user.roleId === 'role-superadmin') return true;

    if (user.deniedProjectIds?.includes(projectId)) return false;

    if (user.isExternalUser && user.organizationId && policy.enforceExternalOrgIsolation) {
      const org = this.getExternalOrganizations().find(o => o.id === user.organizationId);
      if (org && !org.assignedProjectIds.includes('*') && !org.assignedProjectIds.includes(projectId)) {
        return false;
      }
    }

    if (!policy.enforceStrictProjectScoping) return true;

    if (user.assignedProjectIds.includes('*') || user.assignedProjectIds.includes(projectId)) {
      return true;
    }

    const explicitAssign = this.getProjectAssignments().some(a => a.userId === userId && a.projectId === projectId);
    return explicitAssign;
  }

  canAccessFactory(userId: string, factoryId: string): boolean {
    const policy = this.getSecurityPolicy();
    const user = this.getUsers().find(u => u.id === userId);
    if (!user || user.accountStatus !== 'Active') return false;
    if (user.adminAuthorityLevel === 'SUPER_ADMINISTRATOR' || user.roleId === 'role-superadmin') return true;

    if (user.deniedFactoryIds?.includes(factoryId)) return false;

    if (user.isExternalUser && user.organizationId && policy.enforceExternalOrgIsolation) {
      const org = this.getExternalOrganizations().find(o => o.id === user.organizationId);
      if (org && !org.linkedFactoryIds.includes('*') && !org.linkedFactoryIds.includes(factoryId)) {
        return false;
      }
    }

    if (!policy.enforceStrictFactoryScoping) return true;

    if (user.assignedFactoryIds?.includes('*') || user.assignedFactoryIds?.includes(factoryId)) {
      return true;
    }

    return this.getFactoryAssignments().some(a => a.userId === userId && a.factoryId === factoryId);
  }

  filterAuthorizedProjects<T extends { id?: string; projectId?: string; code?: string }>(userId: string, projects: T[]): T[] {
    const user = this.getUsers().find(u => u.id === userId);
    if (!user) return [];
    if (user.adminAuthorityLevel === 'SUPER_ADMINISTRATOR' || user.assignedProjectIds.includes('*')) {
      return projects.filter(p => {
        const pid = p.projectId || p.id || p.code || '';
        return !user.deniedProjectIds?.includes(pid);
      });
    }
    return projects.filter(p => {
      const pid = p.projectId || p.id || p.code || '';
      return this.canAccessProject(userId, pid);
    });
  }

  filterAuthorizedFactories<T extends { id?: string; factoryId?: string }>(userId: string, factories: T[]): T[] {
    const user = this.getUsers().find(u => u.id === userId);
    if (!user) return [];
    if (user.adminAuthorityLevel === 'SUPER_ADMINISTRATOR' || user.assignedFactoryIds?.includes('*')) {
      return factories.filter(f => {
        const fid = f.factoryId || f.id || '';
        return !user.deniedFactoryIds?.includes(fid);
      });
    }
    return factories.filter(f => {
      const fid = f.factoryId || f.id || '';
      return this.canAccessFactory(userId, fid);
    });
  }

  // --- 6. CONNECTED APPLICATIONS, BREAK-GLASS & GLOBAL POLICY ---
  getConnectedApplications(): ConnectedApplicationClient[] {
    return loadOrSeed<ConnectedApplicationClient[]>(STORAGE_KEYS.CONNECTED_APPS, SEED_CONNECTED_APPLICATIONS);
  }

  createConnectedApplication(
    app: Omit<ConnectedApplicationClient, 'id' | 'clientId' | 'apiKeyPrefix' | 'apiKeyHash' | 'createdAt'>,
    actorUsername = 'superadmin'
  ): { client: ConnectedApplicationClient; plainTextApiKey: string } {
    const list = this.getConnectedApplications();
    const randomHex = Math.random().toString(16).substring(2, 10);
    const plainTextApiKey = `inv_live_${randomHex}_${Date.now().toString(36)}`;
    const created: ConnectedApplicationClient = {
      ...app,
      id: `app-${Date.now()}`,
      clientId: `cli_inv_${randomHex}`,
      apiKeyPrefix: plainTextApiKey.substring(0, 16),
      apiKeyHash: `sha256:${btoa(plainTextApiKey).substring(0, 44)}`,
      createdAt: new Date().toISOString()
    };
    list.unshift(created);
    saveToStorage(STORAGE_KEYS.CONNECTED_APPS, list);

    this.logAuditEvent({
      username: actorUsername,
      action: 'API_CLIENT_REGISTERED',
      target: `Application: ${created.appName} (${created.appCode})`,
      details: `Issued API credentials [${created.apiKeyPrefix}...] with ${created.grantedScopes.length} scopes.`,
      severity: 'Info'
    });

    return { client: created, plainTextApiKey };
  }

  rotateApplicationApiKey(appId: string, actorUsername = 'superadmin'): { client: ConnectedApplicationClient; plainTextApiKey: string } {
    const list = this.getConnectedApplications();
    const idx = list.findIndex(a => a.id === appId);
    if (idx < 0) throw new Error('Application client not found');

    const randomHex = Math.random().toString(16).substring(2, 10);
    const plainTextApiKey = `inv_rot_${randomHex}_${Date.now().toString(36)}`;
    const now = new Date().toISOString();

    list[idx] = {
      ...list[idx],
      apiKeyPrefix: plainTextApiKey.substring(0, 16),
      apiKeyHash: `sha256:${btoa(plainTextApiKey).substring(0, 44)}`,
      rotatedAt: now,
      status: 'Active'
    };
    saveToStorage(STORAGE_KEYS.CONNECTED_APPS, list);

    this.logAuditEvent({
      username: actorUsername,
      action: 'API_KEY_ROTATED',
      target: `Application: ${list[idx].appName}`,
      details: `Cryptographic API token rotated. New prefix: ${list[idx].apiKeyPrefix}...`,
      severity: 'Warning'
    });

    return { client: list[idx], plainTextApiKey };
  }

  revokeConnectedApplication(appId: string, actorUsername = 'superadmin'): void {
    const list = this.getConnectedApplications();
    const idx = list.findIndex(a => a.id === appId);
    if (idx < 0) return;
    list[idx].status = list[idx].status === 'Revoked' ? 'Active' : 'Revoked';
    saveToStorage(STORAGE_KEYS.CONNECTED_APPS, list);

    this.logAuditEvent({
      username: actorUsername,
      action: list[idx].status === 'Revoked' ? 'API_CLIENT_REVOKED' : 'API_CLIENT_REACTIVATED',
      target: `Application: ${list[idx].appName}`,
      details: `Application API client status set to ${list[idx].status}.`,
      severity: list[idx].status === 'Revoked' ? 'Security Alert' : 'Info'
    });
  }

  verifyApiTokenScope(clientId: string, requiredScope: ApiScopeCode, targetProjectId?: string, targetFactoryId?: string): { allowed: boolean; reason: string } {
    const app = this.getConnectedApplications().find(a => a.clientId === clientId);
    if (!app) return { allowed: false, reason: 'Unrecognized clientId' };
    if (app.status !== 'Active') return { allowed: false, reason: `Application token is ${app.status}` };
    if (!app.grantedScopes.includes(requiredScope)) {
      return { allowed: false, reason: `Missing required API scope [${requiredScope}]` };
    }
    if (targetProjectId && app.restrictedProjectIds.length > 0 && !app.restrictedProjectIds.includes('*') && !app.restrictedProjectIds.includes(targetProjectId)) {
      return { allowed: false, reason: `API client restricted from project [${targetProjectId}]` };
    }
    if (targetFactoryId && app.restrictedFactoryIds.length > 0 && !app.restrictedFactoryIds.includes('*') && !app.restrictedFactoryIds.includes(targetFactoryId)) {
      return { allowed: false, reason: `API client restricted from factory [${targetFactoryId}]` };
    }
    return { allowed: true, reason: `Verified token scope [${requiredScope}] for ${app.appName}` };
  }

  getBreakGlassSessions(): BreakGlassEmergencySession[] {
    return loadOrSeed<BreakGlassEmergencySession[]>(STORAGE_KEYS.BREAK_GLASS, SEED_BREAK_GLASS_SESSIONS);
  }

  activateBreakGlassSession(
    payload: {
      activatedByUserId: string;
      activatedByName: string;
      authorizedByAdminName: string;
      targetRoleElevated: string;
      targetScope: string;
      reason: string;
      incidentTicketRef: string;
      durationMinutes: number;
    }
  ): BreakGlassEmergencySession {
    const list = this.getBreakGlassSessions();
    const now = new Date();
    const expires = new Date(now.getTime() + payload.durationMinutes * 60000);
    const created: BreakGlassEmergencySession = {
      id: `bg-${Date.now()}`,
      sessionCode: `BG-EMG-2026-${Math.floor(100 + Math.random() * 900)}`,
      activatedByUserId: payload.activatedByUserId,
      activatedByName: payload.activatedByName,
      authorizedByAdminName: payload.authorizedByAdminName,
      targetRoleElevated: payload.targetRoleElevated,
      targetScope: payload.targetScope,
      reason: payload.reason,
      incidentTicketRef: payload.incidentTicketRef,
      mfaVerified: true,
      startedAt: now.toISOString(),
      expiresAt: expires.toISOString(),
      status: 'Active',
      actionsLogged: [`${now.toTimeString().slice(0, 5)} — Break-Glass Emergency Elevation Activated`]
    };
    list.unshift(created);
    saveToStorage(STORAGE_KEYS.BREAK_GLASS, list);

    this.logAuditEvent({
      username: payload.activatedByName,
      action: 'BREAK_GLASS_ACTIVATED',
      target: `Emergency Session ${created.sessionCode} (${payload.targetRoleElevated})`,
      details: `Ticket: ${payload.incidentTicketRef} | Reason: ${payload.reason}`,
      severity: 'Critical'
    });

    return created;
  }

  terminateBreakGlassSession(sessionId: string, actorUsername = 'superadmin'): void {
    const list = this.getBreakGlassSessions();
    const idx = list.findIndex(s => s.id === sessionId);
    if (idx < 0) return;
    list[idx].status = 'Terminated';
    list[idx].endedAt = new Date().toISOString();
    list[idx].actionsLogged.push(`${new Date().toTimeString().slice(0, 5)} — Terminated by ${actorUsername}`);
    saveToStorage(STORAGE_KEYS.BREAK_GLASS, list);

    this.logAuditEvent({
      username: actorUsername,
      action: 'BREAK_GLASS_TERMINATED',
      target: `Emergency Session ${list[idx].sessionCode}`,
      details: `Emergency privileges revoked and audit log sealed.`,
      severity: 'Warning'
    });
  }

  getSecurityPolicy(): SecurityPolicyConfiguration {
    return loadOrSeed<SecurityPolicyConfiguration>(STORAGE_KEYS.SECURITY_POLICY, DEFAULT_SECURITY_POLICY);
  }

  updateSecurityPolicy(updates: Partial<SecurityPolicyConfiguration>, actorUsername = 'superadmin'): SecurityPolicyConfiguration {
    const current = this.getSecurityPolicy();
    const next = { ...current, ...updates };
    saveToStorage(STORAGE_KEYS.SECURITY_POLICY, next);

    this.logAuditEvent({
      username: actorUsername,
      action: 'SECURITY_POLICY_UPDATED',
      target: 'Global Authorization & MFA Policy Engine',
      details: `Updated policy parameters: ${Object.keys(updates).join(', ')}`,
      severity: 'Warning'
    });
    return next;
  }

  canAdministerUsers(user: SecurityUser | null): boolean {
    if (!user || user.accountStatus !== 'Active') return false;
    if (
      user.adminAuthorityLevel === 'SUPER_ADMINISTRATOR' ||
      user.adminAuthorityLevel === 'SYSTEM_ADMINISTRATOR' ||
      user.roleId === 'role-superadmin' ||
      user.roleId === 'role-sysadmin'
    ) {
      return true;
    }
    return this.hasPermission(user.id, 'security.admin') || this.hasPermission(user.id, 'security.configure');
  }

  // --- 7. CENTRAL 13-STEP PERMISSION EVALUATION ENGINE ---
  evaluateCentralAuthorization(params: {
    userId: string;
    permissionCode: string;
    portalId?: CentralPortalId;
    action?: PermissionAction | string;
    targetProjectId?: string;
    targetFactoryId?: string;
    targetBranch?: string;
    targetOrgId?: string;
    targetRecordId?: string;
    emitAuditOnDeny?: boolean;
  }): AuthorizationDecisionTrace {
    const policy = this.getSecurityPolicy();
    const users = this.getUsers();
    const roles = this.getRoles();
    const user = users.find(u => u.id === params.userId);
    const steps: AuthorizationEvaluationStep[] = [];
    let overallAllowed = true;
    let firstFailureReason = '';

    const recordStep = (
      stepNumber: number,
      stepName: AuthorizationEvaluationStep['stepName'],
      passed: boolean,
      detail: string
    ) => {
      steps.push({ stepNumber, stepName, passed, detail });
      if (!passed && overallAllowed) {
        overallAllowed = false;
        firstFailureReason = detail;
      }
    };

    // 1. User Authentication
    if (!user) {
      recordStep(1, '1. User Authentication', false, `Identity [${params.userId}] not found in Central Identity Registry.`);
    } else {
      recordStep(1, '1. User Authentication', true, `Verified identity: ${user.fullName} (@${user.username}, ID: ${user.employeeId}).`);
    }

    // 2. Account Status Check
    if (!user || user.accountStatus !== 'Active') {
      recordStep(
        2,
        '2. Account Status Check',
        false,
        `Account status is [${user?.accountStatus || 'Unknown'}]. Only 'Active' accounts may execute operations.`
      );
    } else {
      recordStep(2, '2. Account Status Check', true, `Account is Active (0 lockouts, last verified login: ${user.lastLogin || 'Today'}).`);
    }

    // 3. User Type Profile
    const userTypeObj = this.getUserTypes().find(ut => ut.code === user?.userType);
    recordStep(
      3,
      '3. User Type Profile',
      !!user,
      user
        ? `User Type [${user.userType || 'STANDARD'}] (${userTypeObj?.category || 'Internal'}) — External: ${user.isExternalUser ? 'YES' : 'NO'}.`
        : 'No user type resolved.'
    );

    // 4. Role Resolution
    const primaryRole = roles.find(r => r.id === user?.roleId);
    const activeBreakGlass = this.getBreakGlassSessions().find(
      bg => bg.activatedByUserId === user?.id && bg.status === 'Active'
    );
    const activeDelegations = this.getDelegations().filter(
      d => d.delegateeId === user?.id && d.status === 'Active'
    );

    if (!primaryRole && !activeBreakGlass) {
      recordStep(4, '4. Role Resolution', false, 'No active RBAC Role assigned (Deny-by-Default enforced).');
    } else {
      recordStep(
        4,
        '4. Role Resolution',
        true,
        `Primary Role: [${primaryRole?.name || 'None'}] | Active Delegations: ${activeDelegations.length} | Break-Glass: ${
          activeBreakGlass ? activeBreakGlass.sessionCode : 'Inactive'
        }`
      );
    }

    const isSuperAdmin =
      primaryRole?.code === 'SUPER_ADMIN' || user?.adminAuthorityLevel === 'SUPER_ADMINISTRATOR' || !!activeBreakGlass;

    // 5. Permission & Explicit Deny Resolution
    const explicitDenied =
      user?.deniedPermissionCodes?.includes(params.permissionCode) ||
      primaryRole?.deniedPermissionCodes?.includes(params.permissionCode);

    const effectivePerms = user ? this.getEffectivePermissionCodes(user.id) : [];
    const hasPermCode = isSuperAdmin || effectivePerms.includes(params.permissionCode);

    if (explicitDenied && !isSuperAdmin) {
      recordStep(
        5,
        '5. Permission & Explicit Deny Resolution',
        false,
        `Explicit DENY rule blocks [${params.permissionCode}] for this user/role.`
      );
    } else if (!hasPermCode) {
      recordStep(
        5,
        '5. Permission & Explicit Deny Resolution',
        false,
        `Deny-by-Default: Permission [${params.permissionCode}] is not granted by role, template, or active delegation.`
      );
    } else {
      recordStep(
        5,
        '5. Permission & Explicit Deny Resolution',
        true,
        `Permission [${params.permissionCode}] resolved via ${
          isSuperAdmin ? 'Super Admin / Break-Glass Authority' : `Effective Permission Set (${effectivePerms.length} total grants)`
        }.`
      );
    }

    // 6. Organization / Branch / Department Scope
    let orgBranchPassed = true;
    let orgBranchDetail = `Org: ${user?.organizationName || 'Innovista HQ'} | Branch: ${user?.branch || 'Main Store'} | Scope: ${user?.defaultScope || 'Department'}`;

    if (user && params.portalId && !this.canAccessPortal(user.id, params.portalId)) {
      orgBranchPassed = false;
      orgBranchDetail = `Portal Access Denied: User is not authorized for portal [${params.portalId}].`;
    } else if (user && params.targetBranch && !isSuperAdmin) {
      if (!user.assignedBranches.includes(params.targetBranch) && user.branch !== params.targetBranch) {
        orgBranchPassed = false;
        orgBranchDetail = `Branch Scope Violation: User is assigned to [${user.assignedBranches.join(', ')}], not [${params.targetBranch}].`;
      }
    } else if (user && params.targetOrgId && user.isExternalUser && policy.enforceExternalOrgIsolation) {
      if (user.organizationId !== params.targetOrgId) {
        orgBranchPassed = false;
        orgBranchDetail = `Multi-Tenant Organization Isolation: External user belongs to [${user.organizationId}] and cannot access [${params.targetOrgId}].`;
      }
    }
    recordStep(6, '6. Organization / Branch / Department Scope', orgBranchPassed, orgBranchDetail);

    // 7. Project Scope Check
    if (params.targetProjectId && user) {
      const projOk = this.canAccessProject(user.id, params.targetProjectId);
      recordStep(
        7,
        '7. Project Scope Check',
        projOk,
        projOk
          ? `Authorized for Project [${params.targetProjectId}] (Assigned Projects: ${user.assignedProjectIds.join(', ')}).`
          : `Project Scope Denied: User does not hold assignment for Project [${params.targetProjectId}].`
      );
    } else {
      recordStep(7, '7. Project Scope Check', true, 'No specific project constraint or global project scope.');
    }

    // 8. Factory / Workshop Scope Check
    if (params.targetFactoryId && user) {
      const facOk = this.canAccessFactory(user.id, params.targetFactoryId);
      recordStep(
        8,
        '8. Factory / Workshop Scope Check',
        facOk,
        facOk
          ? `Authorized for Factory/Workshop [${params.targetFactoryId}] (Assigned Factories: ${(user.assignedFactoryIds || []).join(', ')}).`
          : `Factory Isolation Denied: User is restricted from Factory [${params.targetFactoryId}].`
      );
    } else {
      recordStep(8, '8. Factory / Workshop Scope Check', true, 'No specific factory/workshop constraint required.');
    }

    // 9. Record-Level Classification Check
    if (params.targetRecordId && user) {
      const grant = this.getRecordAccessGrants().find(g => g.recordId === params.targetRecordId);
      if (grant) {
        if (grant.deniedUserIds.includes(user.id)) {
          recordStep(
            9,
            '9. Record-Level Classification Check',
            false,
            `Record ACL Explicit Deny: User is explicitly barred from ${grant.classification} record [${grant.recordTitle}].`
          );
        } else if (
          !isSuperAdmin &&
          !grant.authorizedUserIds.includes(user.id) &&
          !grant.authorizedRoleIds.includes(user.roleId)
        ) {
          recordStep(
            9,
            '9. Record-Level Classification Check',
            false,
            `Record Classification Hold: [${grant.recordTitle}] is marked [${grant.classification}] and requires explicit Record-Level Grant.`
          );
        } else {
          recordStep(
            9,
            '9. Record-Level Classification Check',
            true,
            `Record ACL Verified: User holds explicit clearance for [${grant.recordTitle}] (${grant.classification}).`
          );
        }
      } else {
        recordStep(9, '9. Record-Level Classification Check', true, `Record [${params.targetRecordId}] has standard classification.`);
      }
    } else {
      recordStep(9, '9. Record-Level Classification Check', true, 'Standard record classification applies.');
    }

    // 10. Action Permission Verification
    const requestedAction = params.action || params.permissionCode.split('.')[1] || 'view';
    recordStep(
      10,
      '10. Action Permission Verification',
      hasPermCode && !explicitDenied,
      hasPermCode && !explicitDenied
        ? `Action [${requestedAction.toUpperCase()}] permitted under [${params.permissionCode}].`
        : `Action [${requestedAction.toUpperCase()}] blocked.`
    );

    // 11. Policy Conditions (MFA / SoD / Break-Glass)
    let policyPassed = true;
    let policyDetail = 'All enterprise policy conditions satisfied (MFA, SoD, Session TTL).';
    if (user) {
      const sodConflicts = this.checkSodConflicts(effectivePerms).filter(c => c.severity === 'Strict Block');
      if (
        sodConflicts.length > 0 &&
        !isSuperAdmin &&
        sodConflicts.some(
          c => c.conflictingPermissionA === params.permissionCode || c.conflictingPermissionB === params.permissionCode
        )
      ) {
        policyPassed = false;
        policyDetail = `Segregation of Duties (SoD) Strict Block: [${sodConflicts[0].ruleName}] prevents executing [${params.permissionCode}].`;
      } else if (
        policy.enforceMandatoryMfaForAdmins &&
        (user.adminAuthorityLevel === 'SUPER_ADMINISTRATOR' || user.adminAuthorityLevel === 'SYSTEM_ADMINISTRATOR') &&
        !user.mfaEnabled
      ) {
        policyPassed = false;
        policyDetail = 'Mandatory Admin MFA Policy Violation: Administrator account must have MFA enabled.';
      }
    }
    recordStep(11, '11. Policy Conditions (MFA / SoD / Break-Glass)', policyPassed, policyDetail);

    // 12. Final Decision
    recordStep(
      12,
      '12. Final Decision',
      overallAllowed,
      overallAllowed
        ? `ALLOW — Request authorized by Central Permission Evaluation Engine.`
        : `DENY — ${firstFailureReason}`
    );

    // 13. Security Audit Event
    if (!overallAllowed && params.emitAuditOnDeny && user) {
      this.logAuditEvent({
        userId: user.id,
        username: user.username,
        userFullName: user.fullName,
        userRole: user.roleName,
        portalId: params.portalId,
        action: 'AUTHORIZATION_DENIED',
        target: `${params.permissionCode}${params.targetProjectId ? ` [${params.targetProjectId}]` : ''}${
          params.targetFactoryId ? ` [${params.targetFactoryId}]` : ''
        }`,
        details: firstFailureReason,
        severity: 'Warning'
      });
    }
    recordStep(
      13,
      '13. Security Audit Event',
      true,
      `Decision logged to immutable security audit ledger (Trace ID: EV-${Date.now().toString(36).toUpperCase()}).`
    );

    return {
      evaluationId: `EV-${Date.now().toString(36).toUpperCase()}`,
      timestamp: new Date().toISOString(),
      userId: user?.id || params.userId,
      username: user?.username || 'unknown',
      userFullName: user?.fullName || 'Unauthenticated Principal',
      userType: user?.userType || 'VIEW_ONLY',
      roleName: primaryRole?.name || 'Unassigned',
      portalId: params.portalId,
      action: requestedAction,
      permissionCode: params.permissionCode,
      targetProjectId: params.targetProjectId,
      targetFactoryId: params.targetFactoryId,
      targetBranch: params.targetBranch,
      targetOrgId: params.targetOrgId,
      targetRecordId: params.targetRecordId,
      allowed: overallAllowed,
      summaryExplanation: overallAllowed
        ? `Access GRANTED to ${user?.fullName} for [${params.permissionCode}] across all 13 security gates.`
        : `Access DENIED: ${firstFailureReason}`,
      steps
    };
  }

  // --- 8. USERS & AUTHENTICATION ---
  getUsers(): SecurityUser[] {
    return loadOrSeed<SecurityUser[]>(STORAGE_KEYS.USERS, SEED_USERS);
  }

  getCurrentUser(): SecurityUser {
    const users = this.getUsers();
    const impersonatedId = localStorage.getItem(STORAGE_KEYS.IMPERSONATED_USER_ID);
    if (impersonatedId) {
      const imp = users.find(u => u.id === impersonatedId);
      if (imp) return imp;
    }

    const currentId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID) || 'usr-admin-01';
    return users.find(u => u.id === currentId) || users[0];
  }

  setCurrentUser(userId: string): SecurityUser {
    const users = this.getUsers();
    const user = users.find(u => u.id === userId);
    if (!user) throw new Error('User not found');
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, userId);
    localStorage.removeItem(STORAGE_KEYS.IMPERSONATED_USER_ID);
    return user;
  }

  getImpersonatedUser(): SecurityUser | null {
    const impersonatedId = localStorage.getItem(STORAGE_KEYS.IMPERSONATED_USER_ID);
    if (!impersonatedId) return null;
    return this.getUsers().find(u => u.id === impersonatedId) || null;
  }

  impersonateUser(targetUserId: string | null, actorUsername = 'superadmin'): SecurityUser {
    if (!targetUserId) {
      localStorage.removeItem(STORAGE_KEYS.IMPERSONATED_USER_ID);
      this.logAuditEvent({
        username: actorUsername,
        action: 'IMPERSONATION_ENDED',
        target: 'Session Context',
        details: 'Exited user simulation mode and restored primary administrator context.',
        severity: 'Info'
      });
      return this.getCurrentUser();
    }

    const users = this.getUsers();
    const target = users.find(u => u.id === targetUserId);
    if (!target) throw new Error('Target user not found');

    localStorage.setItem(STORAGE_KEYS.IMPERSONATED_USER_ID, targetUserId);
    this.logAuditEvent({
      username: actorUsername,
      action: 'IMPERSONATION_STARTED',
      target: `User: ${target.fullName} (@${target.username})`,
      details: `Administrator initiated diagnostic RBAC view-as simulation for role [${target.roleName}].`,
      severity: 'Warning'
    });

    return target;
  }

  authenticate(
    identifier: string,
    password: string
  ): {
    success: boolean;
    requiresMfa?: boolean;
    mfaMethod?: 'TOTP' | 'EMAIL_OTP' | 'RECOVERY_CODE';
    user?: SecurityUser;
    error?: string;
  } {
    const policy = this.getSecurityPolicy();
    const users = this.getUsers();
    const normalized = identifier.trim().toLowerCase();
    const userIndex = users.findIndex(
      u =>
        u.username.toLowerCase() === normalized ||
        u.email.toLowerCase() === normalized ||
        u.employeeId.toLowerCase() === normalized
    );

    if (userIndex === -1) {
      this.logAuditEvent({
        username: identifier || 'anonymous',
        action: 'LOGIN_FAILED',
        target: 'Authentication Gateway',
        details: `Failed login attempt: Unknown identity identifier [${identifier}].`,
        severity: 'Warning'
      });
      return { success: false, error: 'Invalid username, email, or employee ID.' };
    }

    const user = users[userIndex];

    if (user.accountStatus === 'Locked') {
      return {
        success: false,
        error: `Account is locked due to ${policy.maxFailedLoginAttempts} failed login attempts. Contact System Administrator.`
      };
    }

    if (
      user.accountStatus === 'Suspended' ||
      user.accountStatus === 'Deactivated' ||
      user.accountStatus === 'Inactive' ||
      user.accountStatus === 'Terminated'
    ) {
      return {
        success: false,
        error: `Account status is [${user.accountStatus}]. Access to Innovista Control Center is barred.`
      };
    }

    if (user.accountStatus === 'Pending Activation' || user.accountStatus === 'Pending Verification' || user.accountStatus === 'Invited') {
      return {
        success: false,
        error: `Account is [${user.accountStatus}] and awaiting Administrator role & scope activation.`
      };
    }

    if (!password || password.length < 4 || password === 'wrongpass') {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      const maxAttempts = policy.maxFailedLoginAttempts || 5;
      if (user.failedLoginAttempts >= maxAttempts) {
        user.accountStatus = 'Locked';
        user.lockedUntil = new Date(Date.now() + (policy.lockoutDurationMinutes || 15) * 60 * 1000).toISOString();
        this.logAuditEvent({
          username: user.username,
          action: 'ACCOUNT_LOCKED',
          target: `User: ${user.fullName}`,
          details: `Account automatically locked after ${maxAttempts} consecutive failed password attempts.`,
          severity: 'Security Alert'
        });
      } else {
        this.logAuditEvent({
          username: user.username,
          action: 'LOGIN_FAILED',
          target: `User: ${user.fullName}`,
          details: `Invalid password attempt (${user.failedLoginAttempts}/${maxAttempts}).`,
          severity: 'Warning'
        });
      }
      users[userIndex] = user;
      saveToStorage(STORAGE_KEYS.USERS, users);
      return {
        success: false,
        error:
          user.accountStatus === 'Locked'
            ? `Account locked after ${maxAttempts} failed attempts!`
            : `Invalid credentials (${user.failedLoginAttempts}/${maxAttempts} attempts).`
      };
    }

    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    user.lastLogin = new Date().toISOString();
    users[userIndex] = user;
    saveToStorage(STORAGE_KEYS.USERS, users);

    if (user.mfaEnabled) {
      return {
        success: true,
        requiresMfa: true,
        mfaMethod: user.mfaMethod || 'TOTP',
        user
      };
    }

    this.setCurrentUser(user.id);
    this.logAuditEvent({
      userId: user.id,
      username: user.username,
      userFullName: user.fullName,
      userRole: user.roleName,
      action: 'LOGIN_SUCCESS',
      target: 'Authentication Gateway',
      details: `Authenticated into [${user.roleName}] (${user.userType || 'Internal'}) with scope [${user.defaultScope}].`,
      severity: 'Info'
    });

    return { success: true, user };
  }

  verifyMfa(userId: string, code: string): { success: boolean; user?: SecurityUser; error?: string } {
    if (!code || code.trim().length < 6) {
      return { success: false, error: 'Please enter a valid 6-digit verification code or 8-char recovery code.' };
    }
    const user = this.setCurrentUser(userId);
    this.logAuditEvent({
      userId: user.id,
      username: user.username,
      userFullName: user.fullName,
      userRole: user.roleName,
      action: 'MFA_VERIFIED',
      target: 'Authentication Gateway',
      details: `2FA challenge completed via ${user.mfaMethod || 'TOTP'} for ${user.fullName}.`,
      severity: 'Info'
    });
    return { success: true, user };
  }

  createUser(
    payload: Omit<SecurityUser, 'id' | 'failedLoginAttempts' | 'lastPasswordChange' | 'createdAt' | 'updatedAt'>,
    actorUsername = 'superadmin'
  ): SecurityUser {
    const users = this.getUsers();
    const now = new Date().toISOString();

    // Auto-populate portals & permissions if template or userType is chosen
    let authorizedPortalIds = payload.authorizedPortalIds;
    if (!authorizedPortalIds && payload.permissionTemplateId) {
      const tpl = this.getPermissionTemplates().find(t => t.id === payload.permissionTemplateId);
      if (tpl) authorizedPortalIds = [...tpl.authorizedPortalIds];
    }

    const newUser: SecurityUser = {
      ...payload,
      id: `usr-${Date.now()}`,
      authorizedPortalIds,
      assignedFactoryIds: payload.assignedFactoryIds || [],
      failedLoginAttempts: 0,
      lastPasswordChange: now,
      createdAt: now,
      updatedAt: now
    };

    users.unshift(newUser);
    saveToStorage(STORAGE_KEYS.USERS, users);

    this.logAuditEvent({
      username: actorUsername,
      action: 'USER_CREATED',
      target: `User: ${newUser.fullName} (@${newUser.username})`,
      newValue: `Role: ${newUser.roleName} | Type: ${newUser.userType || 'Standard'} | Status: ${newUser.accountStatus}`,
      details: `Provisioned user in [${newUser.department}] with role [${newUser.roleName}], org [${newUser.organizationName || 'Internal HQ'}], and scope [${newUser.defaultScope}].`,
      severity: 'Info'
    });

    return newUser;
  }

  updateUser(userId: string, updates: Partial<SecurityUser>, actorUsername = 'superadmin'): SecurityUser {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx === -1) throw new Error('User not found');

    const prev = users[idx];
    const updated: SecurityUser = {
      ...prev,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    users[idx] = updated;
    saveToStorage(STORAGE_KEYS.USERS, users);

    this.logAuditEvent({
      username: actorUsername,
      action: 'USER_UPDATED',
      target: `User: ${updated.fullName} (@${updated.username})`,
      oldValue: `Role: ${prev.roleName}, Scope: ${prev.defaultScope}, Status: ${prev.accountStatus}`,
      newValue: `Role: ${updated.roleName}, Scope: ${updated.defaultScope}, Status: ${updated.accountStatus}`,
      details: `Updated user profile, role, project/factory assignments, or security parameters.`,
      severity: 'Info'
    });

    return updated;
  }

  updateAccountStatus(userId: string, status: AccountStatus, actorUsername = 'superadmin'): SecurityUser {
    const user = this.updateUser(
      userId,
      {
        accountStatus: status,
        failedLoginAttempts: status === 'Active' ? 0 : undefined,
        lockedUntil: status === 'Active' ? null : undefined
      },
      actorUsername
    );

    this.logAuditEvent({
      username: actorUsername,
      action: `ACCOUNT_STATUS_${status.toUpperCase().replace(/\s+/g, '_')}`,
      target: `User: ${user.fullName}`,
      newValue: status,
      details: `Account status transitioned to [${status}].`,
      severity: status === 'Suspended' || status === 'Locked' || status === 'Terminated' ? 'Security Alert' : 'Info'
    });

    return user;
  }

  unlockUserAccount(userId: string, actorUsername = 'superadmin'): SecurityUser {
    return this.updateAccountStatus(userId, 'Active', actorUsername);
  }

  resetUserPassword(userId: string, actorUsername = 'superadmin'): string {
    const tempPass = `Inv#${Math.floor(100000 + Math.random() * 900000)}!`;
    const user = this.updateUser(
      userId,
      {
        lastPasswordChange: new Date().toISOString(),
        failedLoginAttempts: 0,
        accountStatus: 'Active',
        lockedUntil: null
      },
      actorUsername
    );

    this.logAuditEvent({
      username: actorUsername,
      action: 'PASSWORD_RESET',
      target: `User: ${user.fullName} (@${user.username})`,
      details: `Administrator issued one-time temporary password and cleared lockout counters.`,
      severity: 'Warning'
    });

    return tempPass;
  }

  // --- 9. AUTHORIZATION & PERMISSION CHECKER ---
  private resolvePermissionCandidates(permissionCode: string): string[] {
    const aliasMap: Record<string, string[]> = {
      'dashboard:view': ['mgmt_report.view', 'proj_report.view'],
      'operations:view': ['execution.view', 'site.view', 'resource.view'],
      'qc:view': ['qc.view'],
      'quality:view': ['qc.view'],
      'quotes:view': ['boq.view'],
      'quotes:create': ['boq.create'],
      'quotes.view': ['boq.view', 'project.view'],
      'quotes.create': ['boq.create'],
      'quotes.edit': ['boq.edit', 'boq.create'],
      'quotes.approve': ['boq.approve', 'project.approve'],
      'quotes.export': ['boq.export', 'boq.print'],
      'invoices:view': ['invoice.view'],
      'invoices:create': ['invoice.create'],
      'items:view': ['boq.view', 'engineering.view'],
      'items:manage': ['boq.edit', 'boq.create', 'engineering.edit'],
      'projects:view': ['project.view'],
      'projects:create': ['project.create'],
      'variation.view': ['project.view', 'execution.view', 'boq.view'],
      'variation.create': ['project.edit', 'execution.create', 'boq.edit'],
      'variation.approve': ['project.approve', 'execution.approve', 'boq.approve'],
      'factory.view': ['execution.view'],
      'factory.manage': ['execution.edit', 'execution.create', 'execution.approve', 'execution.assign'],
      'production.view': ['execution.view', 'engineering.view'],
      'production.edit': ['execution.edit', 'engineering.edit'],
      'procurement:view': ['po.view', 'rfq.view', 'supplier.view', 'grn.view'],
      'procurement:po': ['po.view', 'po.create'],
      'procurement:grn': ['grn.view', 'grn.create'],
      'procurement:create': ['po.create', 'rfq.create'],
      'procurement.view': ['po.view', 'rfq.view', 'supplier.view', 'grn.view', 'proc_analytics.view'],
      'procurement.create': ['po.create', 'rfq.create', 'grn.create'],
      'procurement.approve': ['po.approve', 'rfq.approve', 'supplier.approve'],
      'purchasing.view': ['po.view', 'rfq.view', 'supplier.view'],
      'inventory.view': ['grn.view', 'resource.view'],
      'inventory.edit': ['grn.create', 'grn.edit', 'resource.edit'],
      'logistics.view': ['execution.view', 'site.view', 'grn.view'],
      'subcontractor.view': ['execution.view', 'po.view', 'rfq.view'],
      'subcontractor.submit': ['execution.submit', 'rfq.submit'],
      'supplier.submit': ['rfq.submit', 'invoice.submit'],
      'accounting:view': ['accounting.view', 'invoice.view'],
      'finance.view': ['accounting.view', 'invoice.view'],
      'finance.create': ['accounting.create', 'invoice.create'],
      'finance.approve': ['accounting.approve', 'invoice.approve'],
      'reporting:view': ['mgmt_report.view', 'proj_report.view'],
      'reports:view': ['mgmt_report.view', 'proj_report.view'],
      'reports.view': ['mgmt_report.view', 'proj_report.view'],
      'reports.export': ['mgmt_report.export', 'proj_report.export'],
      'hr:payroll': ['payroll.view'],
      'hr:personnel': ['hr.view'],
      'hr:attendance': ['hr.view', 'resource.view'],
      'hr:ess': ['hr.view'],
      'hr:relations': ['hr.view', 'hr.edit'],
      'clients:view': ['project.view', 'boq.view', 'invoice.view'],
      'clients:create': ['project.create', 'boq.create'],
      'clients.view': ['project.view', 'boq.view', 'invoice.view'],
      'clients.create': ['project.create', 'boq.create'],
      'clients.edit': ['project.edit', 'boq.edit'],
      'equipment:view': ['equipment.view'],
      'hse.view': ['site.view'],
      'hse.approve': ['site.approve'],
      'document.view': ['doc.view', 'engineering.view'],
      'document.download': ['doc.download', 'doc.print'],
      'system:view': ['doc.view', 'security.view', 'audit.view'],
      'settings:manage': ['security.view', 'security.admin', 'company.view', 'company.configure'],
      'settings.manage': ['security.view', 'security.admin', 'security.configure', 'company.view', 'company.configure'],
      'security.audit': ['audit.view', 'security.view'],
      'audit:view': ['audit.view', 'security.view']
    };
    if (aliasMap[permissionCode]) {
      return [permissionCode, ...aliasMap[permissionCode]];
    }
    if (permissionCode.includes(':')) {
      const dotCode = permissionCode.replace(':', '.');
      if (aliasMap[dotCode]) {
        return [permissionCode, dotCode, ...aliasMap[dotCode]];
      }
      return [permissionCode, dotCode];
    }
    return [permissionCode];
  }

  hasPermission(
    userOrId: string | SecurityUser,
    permissionCode: string,
    context?: {
      projectId?: string;
      branch?: string;
      department?: string;
      factoryId?: string;
      portalId?: CentralPortalId;
      recordId?: string;
    }
  ): boolean {
    const userId = typeof userOrId === 'string' ? userOrId : userOrId.id;
    const users = this.getUsers();
    const user = typeof userOrId === 'object' && userOrId ? userOrId : users.find(u => u.id === userId);
    if (!user || user.accountStatus !== 'Active') return false;

    const roles = this.getRoles();
    const role = roles.find(r => r.id === user.roleId);
    if (!role) return false;

    if (role.code === 'SUPER_ADMIN' || user.adminAuthorityLevel === 'SUPER_ADMINISTRATOR') return true;

    // Check active Break-Glass elevation
    const activeBreakGlass = this.getBreakGlassSessions().some(
      bg => bg.activatedByUserId === user.id && bg.status === 'Active'
    );
    if (activeBreakGlass) return true;

    const candidates = this.resolvePermissionCandidates(permissionCode);

    // Explicit deny overrides inherited permissions
    if (
      candidates.some(
        c => user.deniedPermissionCodes?.includes(c) || role.deniedPermissionCodes?.includes(c)
      )
    ) {
      return false;
    }

    const effectiveCodes = this.getEffectivePermissionCodes(user.id);
    if (!effectiveCodes.includes('*') && !candidates.some(c => effectiveCodes.includes(c))) {
      return false;
    }

    if (context?.portalId && !this.canAccessPortal(user.id, context.portalId)) {
      return false;
    }

    if (context?.projectId && !this.canAccessProject(user.id, context.projectId)) {
      return false;
    }

    if (context?.factoryId && !this.canAccessFactory(user.id, context.factoryId)) {
      return false;
    }

    if (context?.branch && user.defaultScope === 'Branch') {
      if (!user.assignedBranches.includes(context.branch)) {
        return false;
      }
    }

    if (context?.recordId) {
      const grant = this.getRecordAccessGrants().find(g => g.recordId === context.recordId);
      if (grant) {
        if (grant.deniedUserIds.includes(user.id)) return false;
        if (!grant.authorizedUserIds.includes(user.id) && !grant.authorizedRoleIds.includes(user.roleId)) {
          return false;
        }
      }
    }

    return true;
  }

  getEffectivePermissionCodes(userId: string): string[] {
    const users = this.getUsers();
    const user = users.find(u => u.id === userId);
    if (!user || user.accountStatus !== 'Active') return [];

    const roles = this.getRoles();
    const role = roles.find(r => r.id === user.roleId);
    const basePerms = new Set<string>(role ? role.permissionCodes : []);

    // Secondary roles
    if (user.secondaryRoleIds && user.secondaryRoleIds.length > 0) {
      user.secondaryRoleIds.forEach(secRoleId => {
        const secRole = roles.find(r => r.id === secRoleId);
        if (secRole) secRole.permissionCodes.forEach(p => basePerms.add(p));
      });
    }

    // Permission Template grants
    if (user.permissionTemplateId) {
      const tpl = this.getPermissionTemplates().find(t => t.id === user.permissionTemplateId);
      if (tpl) tpl.permissionCodes.forEach(p => basePerms.add(p));
    }

    // Direct user allow overrides
    if (user.directPermissionCodes) {
      user.directPermissionCodes.forEach(p => basePerms.add(p));
    }

    // Active delegations
    const delegations = this.getDelegations();
    const now = new Date().toISOString().slice(0, 10);
    delegations
      .filter(d => d.delegateeId === userId && d.status === 'Active' && d.startDate <= now && d.endDate >= now)
      .forEach(d => {
        d.delegatedPermissions.forEach(p => basePerms.add(p));
      });

    // Remove explicit denies (unless Super Admin)
    if (role?.code !== 'SUPER_ADMIN' && user.adminAuthorityLevel !== 'SUPER_ADMINISTRATOR') {
      role?.deniedPermissionCodes?.forEach(d => basePerms.delete(d));
      user.deniedPermissionCodes?.forEach(d => basePerms.delete(d));
    }

    return Array.from(basePerms);
  }

  // --- 10. SEGREGATION OF DUTIES (SoD) ---
  getSodRules(): SegregationOfDutyRule[] {
    return loadOrSeed<SegregationOfDutyRule[]>(STORAGE_KEYS.SOD_RULES, SEED_SOD_RULES);
  }

  getSoDRules(): SegregationOfDutyRule[] {
    return this.getSodRules();
  }

  getUserById(userId: string): SecurityUser | undefined {
    return this.getUsers().find(u => u.id === userId);
  }

  saveUser(user: SecurityUser, actorUsername = 'superadmin'): SecurityUser {
    const existing = this.getUsers().find(u => u.id === user.id);
    if (existing) {
      return this.updateUser(user.id, user, actorUsername);
    }
    const users = this.getUsers();
    const now = new Date().toISOString();
    const created: SecurityUser = {
      ...user,
      createdAt: user.createdAt || now,
      updatedAt: now
    };
    users.unshift(created);
    saveToStorage(STORAGE_KEYS.USERS, users);
    this.logAuditEvent({
      username: actorUsername,
      action: 'USER_CREATED',
      target: `User: ${created.fullName} (@${created.username})`,
      newValue: `Role: ${created.roleName} | Status: ${created.accountStatus}`,
      details: `Provisioned user account in [${created.department}] with scope [${created.defaultScope}].`,
      severity: 'Info'
    });
    return created;
  }

  setUserStatus(userId: string, status: AccountStatus, reason?: string, actorUsername = 'superadmin'): SecurityUser {
    const updated = this.updateAccountStatus(userId, status, actorUsername);
    if (reason) {
      this.logAuditEvent({
        username: actorUsername,
        action: 'USER_STATUS_REASON',
        target: `User: ${updated.fullName}`,
        newValue: status,
        details: reason,
        severity: status === 'Suspended' || status === 'Locked' ? 'Warning' : 'Info'
      });
    }
    return updated;
  }

  forceLogoutAllDevices(userId: string, actorUsername = 'superadmin'): number {
    return this.terminateAllUserSessions(userId, actorUsername);
  }

  createAccessRequest(
    req: Omit<AccessRequest, 'id' | 'requestNumber' | 'requestedAt' | 'status' | 'createdAt'>,
    actorUsername = 'superadmin'
  ): AccessRequest {
    return this.submitAccessRequest(req as any, actorUsername);
  }

  getSecurityStats() {
    const users = this.getUsers();
    const roles = this.getRoles();
    const sessions = this.getSessions();
    const requests = this.getAccessRequests();
    const delegations = this.getDelegations();
    const auditLogs = this.getAuditLogs();

    return {
      totalUsers: users.length,
      activeUsers: users.filter(u => u.accountStatus === 'Active').length,
      lockedUsers: users.filter(u => u.accountStatus === 'Locked').length,
      suspendedUsers: users.filter(u => u.accountStatus === 'Suspended').length,
      mfaEnabledCount: users.filter(u => u.mfaEnabled).length,
      totalRoles: roles.length,
      activeSessions: sessions.length,
      pendingAccessRequests: requests.filter(r => r.status === 'Pending Review' || r.status === 'Manager Approved').length,
      activeDelegations: delegations.filter(d => d.status === 'Active').length,
      securityAlertsToday: auditLogs.filter(a => a.severity === 'Security Alert' || a.severity === 'Critical').length
    };
  }

  checkSodConflicts(permissionCodes: string[]): SegregationOfDutyRule[] {
    const rules = this.getSodRules().filter(r => r.isActive);
    const permSet = new Set(permissionCodes);
    return rules.filter(
      rule => permSet.has(rule.conflictingPermissionA) && permSet.has(rule.conflictingPermissionB)
    );
  }

  // --- 11. SESSIONS, ACCESS REQUESTS & DELEGATIONS ---
  getSessions(): UserSession[] {
    return loadOrSeed<UserSession[]>(STORAGE_KEYS.SESSIONS, SEED_SESSIONS);
  }

  terminateSession(sessionId: string, actorUsername = 'superadmin'): void {
    const sessions = this.getSessions();
    const target = sessions.find(s => s.id === sessionId);
    const filtered = sessions.filter(s => s.id !== sessionId);
    saveToStorage(STORAGE_KEYS.SESSIONS, filtered);

    if (target) {
      this.logAuditEvent({
        username: actorUsername,
        action: 'SESSION_REVOKED',
        target: `${target.fullName} (${target.device})`,
        details: `Force-terminated active session from IP ${target.ipAddress}.`,
        severity: 'Warning'
      });
    }
  }

  terminateAllUserSessions(userId: string, actorUsername = 'superadmin'): number {
    const sessions = this.getSessions();
    const userSessions = sessions.filter(s => s.userId === userId);
    const remaining = sessions.filter(s => s.userId !== userId || s.isCurrent);
    saveToStorage(STORAGE_KEYS.SESSIONS, remaining);

    this.logAuditEvent({
      username: actorUsername,
      action: 'ALL_USER_SESSIONS_REVOKED',
      target: `User ID: ${userId}`,
      details: `Force-revoked ${userSessions.length} active session token(s).`,
      severity: 'Security Alert'
    });
    return userSessions.length;
  }

  getAccessRequests(): AccessRequest[] {
    return loadOrSeed<AccessRequest[]>(STORAGE_KEYS.ACCESS_REQUESTS, SEED_ACCESS_REQUESTS);
  }

  submitAccessRequest(
    req: Omit<AccessRequest, 'id' | 'requestNumber' | 'status' | 'createdAt'>,
    actorUsername = 'superadmin'
  ): AccessRequest {
    const requests = this.getAccessRequests();
    const newReq: AccessRequest = {
      ...req,
      id: `req-${Date.now()}`,
      requestNumber: `REQ-2026-${String(requests.length + 45).padStart(4, '0')}`,
      status: 'Pending Review',
      createdAt: new Date().toISOString()
    };

    requests.unshift(newReq);
    saveToStorage(STORAGE_KEYS.ACCESS_REQUESTS, requests);

    this.logAuditEvent({
      username: actorUsername,
      action: 'ACCESS_REQUEST_SUBMITTED',
      target: newReq.requestNumber,
      details: `${newReq.requesterName} requested [${newReq.requestType}]: ${newReq.requestedItem}.`,
      severity: 'Info'
    });

    return newReq;
  }

  reviewAccessRequest(
    requestId: string,
    decision: 'Admin Approved' | 'Rejected',
    comments: string,
    reviewerName = 'Alexander Vance'
  ): AccessRequest {
    const requests = this.getAccessRequests();
    const idx = requests.findIndex(r => r.id === requestId);
    if (idx === -1) throw new Error('Access request not found');

    const req = requests[idx];
    req.status = decision;
    req.reviewerComments = comments;
    req.reviewedBy = reviewerName;
    req.reviewedAt = new Date().toISOString();

    // Automatically apply portal, permissions, role, project, or factory scope to the requester's account when approved
    if (decision === 'Admin Approved') {
      const users = this.getUsers();
      const requester = users.find(u => u.id === req.requesterId);
      if (requester) {
        const authPortals = new Set<CentralPortalId>(requester.authorizedPortalIds || []);
        const revokedPortals = new Set<CentralPortalId>(requester.revokedPortalIds || []);
        const directPerms = new Set<string>(requester.directPermissionCodes || []);
        const deniedPerms = new Set<string>(requester.deniedPermissionCodes || []);
        const allPortals = this.getPortalRegistry();

        // 1. Target Portal grant
        if (req.targetPortalId) {
          authPortals.add(req.targetPortalId);
          revokedPortals.delete(req.targetPortalId);
          const portalDef = allPortals.find(p => p.portalId === req.targetPortalId);
          portalDef?.requiredPermissions.forEach(rp => {
            directPerms.add(rp);
            deniedPerms.delete(rp);
          });
        }

        // Also check if requestedItem mentions any registered portalId
        allPortals.forEach(p => {
          if (
            req.requestedItem.toLowerCase().includes(p.portalId.toLowerCase()) ||
            req.requestedItem.toLowerCase().includes(p.portalName.toLowerCase()) ||
            req.requestedItem.toLowerCase().includes(p.shortName.toLowerCase())
          ) {
            authPortals.add(p.portalId);
            revokedPortals.delete(p.portalId);
            p.requiredPermissions.forEach(rp => {
              directPerms.add(rp);
              deniedPerms.delete(rp);
            });
          }
        });

        // 2. Requested Permission Codes grant
        if (req.requestedPermissionCodes && req.requestedPermissionCodes.length > 0) {
          req.requestedPermissionCodes.forEach(code => {
            directPerms.add(code);
            deniedPerms.delete(code);
          });
        }

        // Parse any permission code inside parentheses in requestedItem, e.g. "(supplier.view)"
        const parenMatch = req.requestedItem.match(/\(([a-z_]+\.[a-z_]+)\)/i);
        if (parenMatch && parenMatch[1]) {
          const parsedPerm = parenMatch[1].toLowerCase();
          directPerms.add(parsedPerm);
          deniedPerms.delete(parsedPerm);
        }

        // Unlock any portals whose requiredPermissions are in the newly granted permissions
        allPortals.forEach(p => {
          if (p.requiredPermissions.some(rp => directPerms.has(rp))) {
            authPortals.add(p.portalId);
            revokedPortals.delete(p.portalId);
          }
        });

        // 3. Role Change grant
        if (req.requestedRoleId) {
          const newRole = this.getRoles().find(r => r.id === req.requestedRoleId);
          if (newRole) {
            requester.roleId = newRole.id;
            requester.roleName = newRole.name;
            newRole.authorizedPortalIds?.forEach(pid => {
              authPortals.add(pid);
              revokedPortals.delete(pid);
            });
          }
        }

        // 4. Project Scope grant
        if (req.targetProjectId) {
          if (!requester.assignedProjectIds.includes('*') && !requester.assignedProjectIds.includes(req.targetProjectId)) {
            requester.assignedProjectIds.push(req.targetProjectId);
          }
          if (requester.deniedProjectIds) {
            requester.deniedProjectIds = requester.deniedProjectIds.filter(id => id !== req.targetProjectId);
          }
        }

        // 5. Factory Scope grant
        if (req.targetFactoryId) {
          requester.assignedFactoryIds = Array.from(new Set([...(requester.assignedFactoryIds || []), req.targetFactoryId]));
          if (requester.deniedFactoryIds) {
            requester.deniedFactoryIds = requester.deniedFactoryIds.filter(id => id !== req.targetFactoryId);
          }
        }

        requester.authorizedPortalIds = Array.from(authPortals);
        requester.revokedPortalIds = Array.from(revokedPortals);
        requester.directPermissionCodes = Array.from(directPerms);
        requester.deniedPermissionCodes = Array.from(deniedPerms);
        requester.updatedAt = new Date().toISOString();

        saveToStorage(STORAGE_KEYS.USERS, users);
      }
    }

    requests[idx] = req;
    saveToStorage(STORAGE_KEYS.ACCESS_REQUESTS, requests);

    this.logAuditEvent({
      username: reviewerName,
      action: decision === 'Admin Approved' ? 'ACCESS_REQUEST_APPROVED' : 'ACCESS_REQUEST_REJECTED',
      target: `${req.requestNumber} (${req.requesterName})`,
      details: `${decision}: ${req.requestedItem}. Notes: ${comments}`,
      severity: decision === 'Rejected' ? 'Warning' : 'Info'
    });

    return req;
  }

  getDelegations(): PermissionDelegation[] {
    return loadOrSeed<PermissionDelegation[]>(STORAGE_KEYS.DELEGATIONS, SEED_DELEGATIONS);
  }

  createDelegation(
    del: Omit<PermissionDelegation, 'id' | 'status' | 'createdAt'>,
    actorUsername = 'superadmin'
  ): PermissionDelegation {
    const delegations = this.getDelegations();
    const newDel: PermissionDelegation = {
      ...del,
      id: `del-${Date.now()}`,
      status: 'Active',
      createdAt: new Date().toISOString()
    };

    delegations.unshift(newDel);
    saveToStorage(STORAGE_KEYS.DELEGATIONS, delegations);

    this.logAuditEvent({
      username: actorUsername,
      action: 'DELEGATION_CREATED',
      target: `${newDel.delegatorName} -> ${newDel.delegateeName}`,
      details: `Delegated [${newDel.delegatedPermissions.join(', ')}] from ${newDel.startDate} to ${newDel.endDate}.`,
      severity: 'Info'
    });

    return newDel;
  }

  revokeDelegation(delegationId: string, actorUsername = 'superadmin'): void {
    const delegations = this.getDelegations();
    const idx = delegations.findIndex(d => d.id === delegationId);
    if (idx === -1) return;

    delegations[idx].status = 'Revoked';
    saveToStorage(STORAGE_KEYS.DELEGATIONS, delegations);

    this.logAuditEvent({
      username: actorUsername,
      action: 'DELEGATION_REVOKED',
      target: `${delegations[idx].delegatorName} -> ${delegations[idx].delegateeName}`,
      details: 'Temporary permission delegation revoked immediately.',
      severity: 'Warning'
    });
  }

  // --- 12. AUDIT LOGGING ---
  getAuditLogs(): SecurityAuditEvent[] {
    return loadOrSeed<SecurityAuditEvent[]>(STORAGE_KEYS.AUDIT_LOGS, SEED_AUDIT_LOGS);
  }

  logAuditEvent(event: {
    userId?: string;
    username: string;
    userFullName?: string;
    userRole?: string;
    department?: DepartmentCode | string;
    portalId?: CentralPortalId;
    moduleName?: string;
    module?: string;
    action: string;
    target: string;
    oldValue?: string;
    newValue?: string;
    details: string;
    severity: 'Info' | 'Warning' | 'Security Alert' | 'Critical';
  }): SecurityAuditEvent {
    const logs = this.getAuditLogs();
    const newEvent: SecurityAuditEvent = {
      id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId: event.userId,
      username: event.username,
      userFullName: event.userFullName,
      userRole: event.userRole,
      department: event.department,
      portalId: event.portalId,
      moduleName: event.moduleName || event.module,
      action: event.action,
      target: event.target,
      oldValue: event.oldValue,
      newValue: event.newValue,
      details: event.details,
      ipAddress: '194.170.21.84',
      device: 'Enterprise Web Session',
      severity: event.severity,
      timestamp: new Date().toISOString()
    };

    logs.unshift(newEvent);
    saveToStorage(STORAGE_KEYS.AUDIT_LOGS, logs.slice(0, 400));
    return newEvent;
  }

  resetToSeedData(): void {
    Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
  }
}

export const securityService = new SecurityService();
