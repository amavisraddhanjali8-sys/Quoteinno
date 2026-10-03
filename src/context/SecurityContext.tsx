import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  SecurityUser,
  Role,
  Department,
  Designation,
  Permission,
  UserSession,
  SegregationOfDutyRule,
  AccessRequest,
  PermissionDelegation,
  SecurityAuditEvent,
  AccountStatus,
  AccessScopeType,
  CentralPortalId,
  AuthorizationDecisionTrace,
  PermissionAction
} from '../types/security';
import { securityService } from '../services/securityService';
import { centralEmailService } from '../services/centralEmailService';

export interface SecurityStats {
  totalUsers: number;
  activeUsers: number;
  lockedUsers: number;
  suspendedUsers: number;
  mfaEnabledCount: number;
  totalRoles: number;
  activeSessions: number;
  pendingAccessRequests: number;
  activeDelegations: number;
  securityAlertsToday: number;
  externalOrganizationsCount: number;
  connectedAppsCount: number;
  activeBreakGlassCount: number;
}

export interface SecurityContextValue {
  currentUser: SecurityUser;
  impersonatedUser: SecurityUser | null;
  effectiveUser: SecurityUser;
  isAuthenticated: boolean;
  effectivePermissions: string[];
  users: SecurityUser[];
  roles: Role[];
  permissions: Permission[];
  departments: Department[];
  designations: Designation[];
  sessions: UserSession[];
  sodRules: SegregationOfDutyRule[];
  accessRequests: AccessRequest[];
  delegations: PermissionDelegation[];
  auditLogs: SecurityAuditEvent[];
  stats: SecurityStats;
  isAdminAuthority: boolean;

  // Authentication & Session Switching
  login: (usernameOrEmail: string, password?: string) => { success: boolean; message: string; user?: SecurityUser };
  logout: () => void;
  switchUser: (userId: string) => void;
  impersonate: (userId: string | null) => void;
  impersonateUser: (userId: string | null) => void;

  // Central Authorization & Permission Evaluation Engine
  hasPermission: (
    permissionCode: string,
    context?: {
      projectId?: string;
      branch?: string;
      department?: string;
      factoryId?: string;
      portalId?: CentralPortalId;
      recordId?: string;
    }
  ) => boolean;
  can: (
    permissionCode: string,
    context?: {
      projectId?: string;
      branch?: string;
      department?: string;
      factoryId?: string;
      portalId?: CentralPortalId;
      recordId?: string;
    }
  ) => boolean;
  canAccessScope: (requiredScope: AccessScopeType, targetValue?: string) => boolean;
  canAccessPortal: (portalId: CentralPortalId) => boolean;
  canAccessProject: (projectId: string) => boolean;
  canAccessFactory: (factoryId: string) => boolean;
  filterAuthorizedProjects: <T extends { id?: string; projectId?: string; code?: string }>(projects: T[]) => T[];
  filterAuthorizedFactories: <T extends { id?: string; factoryId?: string }>(factories: T[]) => T[];
  evaluateAccess: (params: {
    permissionCode: string;
    portalId?: CentralPortalId;
    action?: PermissionAction | string;
    targetProjectId?: string;
    targetFactoryId?: string;
    targetBranch?: string;
    targetOrgId?: string;
    targetRecordId?: string;
    emitAuditOnDeny?: boolean;
  }) => AuthorizationDecisionTrace;

  // Administration Actions
  saveUser: (user: SecurityUser) => void;
  setUserStatus: (userId: string, status: AccountStatus, reason?: string) => void;
  terminateSession: (sessionId: string) => void;
  forceLogoutAllDevices: (userId: string) => void;
  saveRole: (role: Role) => void;
  createAccessRequest: (req: Omit<AccessRequest, 'id' | 'requestNumber' | 'requestedAt' | 'status'>) => void;
  reviewAccessRequest: (requestId: string, decision: 'Approved' | 'Rejected', notes?: string) => void;
  createDelegation: (del: Omit<PermissionDelegation, 'id' | 'createdAt' | 'status'>) => void;
  revokeDelegation: (delegationId: string) => void;
  refreshData: () => void;
  refreshSecurityState: () => void;
}

const SecurityContext = createContext<SecurityContextValue | undefined>(undefined);

export const SecurityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<SecurityUser>(() => securityService.getCurrentUser());
  const [impersonatedUser, setImpersonatedUser] = useState<SecurityUser | null>(() => securityService.getImpersonatedUser());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [users, setUsers] = useState<SecurityUser[]>(() => securityService.getUsers());
  const [roles, setRoles] = useState<Role[]>(() => securityService.getRoles());
  const [permissions, setPermissions] = useState<Permission[]>(() => securityService.getPermissions());
  const [departments, setDepartments] = useState<Department[]>(() => securityService.getDepartments());
  const [designations, setDesignations] = useState<Designation[]>(() => securityService.getDesignations());
  const [sessions, setSessions] = useState<UserSession[]>(() => securityService.getSessions());
  const [sodRules, setSodRules] = useState<SegregationOfDutyRule[]>(() => securityService.getSoDRules());
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>(() => securityService.getAccessRequests());
  const [delegations, setDelegations] = useState<PermissionDelegation[]>(() => securityService.getDelegations());
  const [auditLogs, setAuditLogs] = useState<SecurityAuditEvent[]>(() => securityService.getAuditLogs());

  const effectiveUser = impersonatedUser || currentUser;

  const [effectivePermissions, setEffectivePermissions] = useState<string[]>(() => {
    const active = securityService.getImpersonatedUser() || securityService.getCurrentUser();
    return securityService.getEffectivePermissionCodes(active.id);
  });

  const refreshData = useCallback(() => {
    const curr = securityService.getCurrentUser();
    const imp = securityService.getImpersonatedUser();
    const active = imp || curr;
    setCurrentUser(curr);
    setImpersonatedUser(imp);
    setUsers(securityService.getUsers());
    setRoles(securityService.getRoles());
    setPermissions(securityService.getPermissions());
    setDepartments(securityService.getDepartments());
    setDesignations(securityService.getDesignations());
    setSessions(securityService.getSessions());
    setSodRules(securityService.getSoDRules());
    setAccessRequests(securityService.getAccessRequests());
    setDelegations(securityService.getDelegations());
    setAuditLogs(securityService.getAuditLogs());
    setEffectivePermissions(securityService.getEffectivePermissionCodes(active.id));
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const stats: SecurityStats = useMemo(() => {
    const rawStats = securityService.getSecurityStats();
    return {
      ...rawStats,
      externalOrganizationsCount: securityService.getExternalOrganizations().length,
      connectedAppsCount: securityService.getConnectedApplications().length,
      activeBreakGlassCount: securityService.getBreakGlassSessions().filter(b => b.status === 'Active').length
    };
  }, [users, roles, sessions, accessRequests, delegations, auditLogs]);

  const login = useCallback(
    (usernameOrEmail: string, password?: string) => {
      const result = securityService.authenticate(usernameOrEmail, password || 'Innovista#2026');
      if (result.success && result.user) {
        setIsAuthenticated(true);
        refreshData();
        void centralEmailService.triggerEvent({
          eventType: 'USER_LOGIN',
          triggeringPortal: 'Identity & Access Control',
          triggeringAction: `User Login (${result.user.username})`,
          senderUserId: result.user.id,
          targetUserIds: [result.user.id],
          variables: {
            user_name: result.user.fullName,
            user_email: result.user.email,
            role_name: result.user.roleName || result.user.roleId,
            department: result.user.department,
            status: 'Authenticated Session Active'
          },
          portalId: 'company-control-center'
        });
      } else if (!result.success) {
        const matchedUser = securityService
          .getUsers()
          .find(
            u =>
              u.username.toLowerCase() === usernameOrEmail.toLowerCase() ||
              u.email.toLowerCase() === usernameOrEmail.toLowerCase()
          );
        if (matchedUser) {
          void centralEmailService.triggerEvent({
            eventType: 'SUSPICIOUS_LOGIN_ALERT',
            triggeringPortal: 'Identity & Access Control',
            triggeringAction: `Failed Login / Lockout Alert (${matchedUser.username})`,
            targetUserIds: [matchedUser.id],
            targetRoleIds: ['role-superadmin'],
            variables: {
              user_name: matchedUser.fullName,
              user_email: matchedUser.email,
              status: result.error || 'Failed Login Attempt',
              summary: `Authentication failed for ${matchedUser.username}: ${result.error || 'Invalid credentials'}`
            },
            portalId: 'system-administration'
          });
        }
      }
      return {
        success: result.success,
        message: result.error || 'Authenticated',
        user: result.user
      };
    },
    [refreshData]
  );

  const logout = useCallback(() => {
    securityService.impersonateUser(null, currentUser.username);
    setIsAuthenticated(false);
    refreshData();
  }, [currentUser.username, refreshData]);

  const switchUser = useCallback(
    (userId: string) => {
      securityService.setCurrentUser(userId);
      setIsAuthenticated(true);
      refreshData();
    },
    [refreshData]
  );

  const impersonate = useCallback(
    (userId: string | null) => {
      securityService.impersonateUser(userId, currentUser.username);
      refreshData();
    },
    [currentUser.username, refreshData]
  );

  const hasPermission = useCallback(
    (
      permissionCode: string,
      context?: {
        projectId?: string;
        branch?: string;
        department?: string;
        factoryId?: string;
        portalId?: CentralPortalId;
        recordId?: string;
      }
    ) => {
      return securityService.hasPermission(effectiveUser.id, permissionCode, context);
    },
    [effectiveUser]
  );

  const canAccessScope = useCallback(
    (requiredScope: AccessScopeType, targetValue?: string) => {
      if (effectiveUser.defaultScope === 'Global' || effectiveUser.roleId === 'role-superadmin') return true;
      if (requiredScope === 'Project' && targetValue) {
        return securityService.canAccessProject(effectiveUser.id, targetValue);
      }
      if (requiredScope === 'Factory' && targetValue) {
        return securityService.canAccessFactory(effectiveUser.id, targetValue);
      }
      if (requiredScope === 'Branch' && targetValue) {
        const branches = effectiveUser.assignedBranches?.length ? effectiveUser.assignedBranches : [effectiveUser.branch];
        return branches.includes('*') || branches.includes(targetValue);
      }
      if (requiredScope === 'Department' && targetValue) {
        return effectiveUser.department === targetValue;
      }
      return true;
    },
    [effectiveUser]
  );

  const canAccessPortal = useCallback(
    (portalId: CentralPortalId) => {
      return securityService.canAccessPortal(effectiveUser.id, portalId);
    },
    [effectiveUser]
  );

  const canAccessProject = useCallback(
    (projectId: string) => {
      return securityService.canAccessProject(effectiveUser.id, projectId);
    },
    [effectiveUser]
  );

  const canAccessFactory = useCallback(
    (factoryId: string) => {
      return securityService.canAccessFactory(effectiveUser.id, factoryId);
    },
    [effectiveUser]
  );

  const filterAuthorizedProjects = useCallback(
    <T extends { id?: string; projectId?: string; code?: string }>(projects: T[]) => {
      return securityService.filterAuthorizedProjects(effectiveUser.id, projects);
    },
    [effectiveUser]
  );

  const filterAuthorizedFactories = useCallback(
    <T extends { id?: string; factoryId?: string }>(factories: T[]) => {
      return securityService.filterAuthorizedFactories(effectiveUser.id, factories);
    },
    [effectiveUser]
  );

  const evaluateAccess = useCallback(
    (params: {
      permissionCode: string;
      portalId?: CentralPortalId;
      action?: PermissionAction | string;
      targetProjectId?: string;
      targetFactoryId?: string;
      targetBranch?: string;
      targetOrgId?: string;
      targetRecordId?: string;
      emitAuditOnDeny?: boolean;
    }) => {
      return securityService.evaluateCentralAuthorization({
        ...params,
        userId: effectiveUser.id
      });
    },
    [effectiveUser]
  );

  const isAdminAuthority = securityService.canAdministerUsers(effectiveUser);

  const saveUser = useCallback(
    (user: SecurityUser) => {
      const existing = securityService.getUsers().find(u => u.id === user.id);
      securityService.saveUser(user, effectiveUser.username);
      refreshData();
      if (!existing) {
        void centralEmailService.triggerEvent({
          eventType: 'USER_REGISTRATION',
          triggeringPortal: 'System Administration — Access Control',
          triggeringAction: `New User Account Provisioned (${user.username})`,
          senderUserId: effectiveUser.id,
          targetEmails: [user.email],
          variables: {
            user_name: user.fullName,
            user_email: user.email,
            role_name: user.roleName || user.roleId,
            department: user.department,
            status: user.status
          },
          portalId: 'company-control-center'
        });
      } else {
        void centralEmailService.triggerEvent({
          eventType: 'ROLE_PERMISSION_CHANGED',
          triggeringPortal: 'System Administration — Access Control',
          triggeringAction: `User Role / Permissions Updated (${user.username})`,
          senderUserId: effectiveUser.id,
          targetUserIds: [user.id],
          variables: {
            user_name: user.fullName,
            user_email: user.email,
            role_name: user.roleName || user.roleId,
            department: user.department,
            status: user.status,
            summary: `Account profile, role (${user.roleName || user.roleId}), or portal permissions updated by ${effectiveUser.fullName}.`
          },
          portalId: 'system-administration'
        });
      }
    },
    [effectiveUser.id, effectiveUser.fullName, effectiveUser.username, refreshData]
  );

  const setUserStatus = useCallback(
    (userId: string, status: AccountStatus, reason?: string) => {
      const targetUser = securityService.getUsers().find(u => u.id === userId);
      securityService.setUserStatus(userId, status, reason, effectiveUser.username);
      refreshData();
      if (targetUser) {
        void centralEmailService.triggerEvent({
          eventType: status === 'Active' ? 'ACCOUNT_ACTIVATION' : 'ROLE_PERMISSION_CHANGED',
          triggeringPortal: 'System Administration — Access Control',
          triggeringAction: `Account Status Changed to ${status} (${targetUser.username})`,
          senderUserId: effectiveUser.id,
          targetUserIds: [targetUser.id],
          variables: {
            user_name: targetUser.fullName,
            user_email: targetUser.email,
            role_name: targetUser.roleName || targetUser.roleId,
            department: targetUser.department,
            status,
            summary: reason || `Account status changed to ${status} by ${effectiveUser.fullName}.`
          },
          portalId: 'company-control-center'
        });
      }
    },
    [effectiveUser.id, effectiveUser.fullName, effectiveUser.username, refreshData]
  );

  const terminateSession = useCallback(
    (sessionId: string) => {
      securityService.terminateSession(sessionId, effectiveUser.username);
      refreshData();
    },
    [effectiveUser.username, refreshData]
  );

  const forceLogoutAllDevices = useCallback(
    (userId: string) => {
      securityService.forceLogoutAllDevices(userId, effectiveUser.username);
      refreshData();
    },
    [effectiveUser.username, refreshData]
  );

  const saveRole = useCallback(
    (role: Role) => {
      securityService.saveRole(role, effectiveUser.username);
      refreshData();
    },
    [effectiveUser.username, refreshData]
  );

  const createAccessRequest = useCallback(
    (req: Omit<AccessRequest, 'id' | 'requestNumber' | 'requestedAt' | 'status'>) => {
      securityService.createAccessRequest(req);
      refreshData();
    },
    [refreshData]
  );

  const reviewAccessRequest = useCallback(
    (requestId: string, decision: 'Approved' | 'Rejected', notes?: string) => {
      const targetReq = securityService.getAccessRequests().find(r => r.id === requestId);
      securityService.reviewAccessRequest(
        requestId,
        decision === 'Approved' ? 'Admin Approved' : 'Rejected',
        notes || 'Reviewed via Access Control Center',
        effectiveUser.fullName
      );
      refreshData();
      if (targetReq) {
        void centralEmailService.triggerEvent({
          eventType: 'ACCESS_REQUEST_DECISION',
          triggeringPortal: 'System Administration — Access Requests',
          triggeringAction: `Access Request ${targetReq.requestNumber} ${decision}`,
          senderUserId: effectiveUser.id,
          targetUserIds: [targetReq.requesterId],
          variables: {
            user_name: targetReq.requesterName,
            role_name: targetReq.requestedRoleName || targetReq.requestedPermissions.join(', '),
            department: targetReq.requesterDepartment,
            status: decision,
            document_number: targetReq.requestNumber,
            summary: notes || `Your access request (${targetReq.requestNumber}) has been ${decision.toLowerCase()} by ${effectiveUser.fullName}.`
          },
          portalId: 'system-administration',
          recordId: targetReq.requestNumber
        });
      }
    },
    [effectiveUser.id, effectiveUser.fullName, refreshData]
  );

  const createDelegation = useCallback(
    (del: Omit<PermissionDelegation, 'id' | 'createdAt' | 'status'>) => {
      securityService.createDelegation(del);
      refreshData();
    },
    [refreshData]
  );

  const revokeDelegation = useCallback(
    (delegationId: string) => {
      securityService.revokeDelegation(delegationId, effectiveUser.username);
      refreshData();
    },
    [effectiveUser.username, refreshData]
  );

  return (
    <SecurityContext.Provider
      value={{
        currentUser,
        impersonatedUser,
        effectiveUser,
        isAuthenticated,
        effectivePermissions,
        users,
        roles,
        permissions,
        departments,
        designations,
        sessions,
        sodRules,
        accessRequests,
        delegations,
        auditLogs,
        stats,
        isAdminAuthority,
        login,
        logout,
        switchUser,
        impersonate,
        impersonateUser: impersonate,
        hasPermission,
        can: hasPermission,
        canAccessScope,
        canAccessPortal,
        canAccessProject,
        canAccessFactory,
        filterAuthorizedProjects,
        filterAuthorizedFactories,
        evaluateAccess,
        saveUser,
        setUserStatus,
        terminateSession,
        forceLogoutAllDevices,
        saveRole,
        createAccessRequest,
        reviewAccessRequest,
        createDelegation,
        revokeDelegation,
        refreshData,
        refreshSecurityState: refreshData
      }}
    >
      {children}
    </SecurityContext.Provider>
  );
};

export const useSecurity = (): SecurityContextValue => {
  const ctx = useContext(SecurityContext);
  if (!ctx) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return ctx;
};
