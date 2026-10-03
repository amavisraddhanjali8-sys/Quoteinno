import React, { useState, useMemo, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  Lock,
  Key,
  Building2,
  CheckCircle2,
  FileText,
  Activity,
  UserCheck,
  Search,
  Plus,
  ChevronRight,
  FolderTree,
  GitPullRequest,
  Laptop,
  ShieldAlert,
  RefreshCw,
  Scale,
  Cpu,
  Globe,
  Layers,
  KeyRound,
  Copy,
  Ban,
  Eye
} from 'lucide-react';
import { useSecurity } from '../../context/SecurityContext';
import {
  SecurityUser,
  AccountStatus,
  ConfigurableUserTypeCode,
  AdminAuthorityLevel
} from '../../types/security';
import { securityService } from '../../services/securityService';
import { AccountTypeManager } from '../collaboration/AccountTypeManager';
import { EcosystemDirectoryView } from '../collaboration/EcosystemDirectoryView';
import { ProjectTeamMatrix } from '../collaboration/ProjectTeamMatrix';
import { PortalAndTemplateControlTab } from './PortalAndTemplateControlTab';
import { ScopesAndOrganizationsTab } from './ScopesAndOrganizationsTab';
import { EvaluationEngineAndApiTab } from './EvaluationEngineAndApiTab';

export type SecurityTab =
  | 'dashboard'
  | 'evaluation-engine'
  | 'portals'
  | 'templates'
  | 'project-access'
  | 'organizations'
  | 'users'
  | 'roles'
  | 'departments'
  | 'requests'
  | 'delegations'
  | 'sod'
  | 'api-apps'
  | 'sessions'
  | 'audit'
  | 'ecosystem'
  | 'account-types'
  | 'project-teams';

export interface AccessControlCenterProps {
  initialSecurityTab?: SecurityTab;
}

export const AccessControlCenter: React.FC<AccessControlCenterProps> = ({
  initialSecurityTab = 'dashboard'
}) => {
  const {
    effectiveUser,
    impersonatedUser,
    isAdminAuthority,
    users,
    roles,
    permissions,
    departments,
    sessions,
    accessRequests,
    delegations,
    sodRules,
    auditLogs,
    stats,
    saveUser,
    setUserStatus,
    terminateSession,
    forceLogoutAllDevices,
    saveRole,
    reviewAccessRequest,
    createDelegation,
    revokeDelegation,
    impersonate,
    refreshData
  } = useSecurity();

  const [activeTab, setActiveTab] = useState<SecurityTab>(initialSecurityTab);
  const [toastBanner, setToastBanner] = useState<string | null>(null);

  const notify = (msg: string) => {
    setToastBanner(msg);
    setTimeout(() => {
      setToastBanner(prev => (prev === msg ? null : prev));
    }, 4500);
  };

  useEffect(() => {
    if (initialSecurityTab) {
      setActiveTab(initialSecurityTab);
    }
  }, [initialSecurityTab]);

  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');

  // Modals & form states
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<SecurityUser | null>(null);
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);
  const [selectedRoleForMatrix, setSelectedRoleForMatrix] = useState<string>(roles[0]?.id || 'role-superadmin');
  const [cloneRoleName, setCloneRoleName] = useState('');
  const [cloneRoleCode, setCloneRoleCode] = useState('');
  const [auditSearchQuery, setAuditSearchQuery] = useState('');
  const [auditSeverityFilter, setAuditSeverityFilter] = useState<string>('ALL');
  const [newDelegationModal, setNewDelegationModal] = useState(false);

  // New Delegation Form
  const [delDelegator, setDelDelegator] = useState(effectiveUser?.id || users[0]?.id || '');
  const [delDelegatee, setDelDelegatee] = useState(users[1]?.id || '');
  const [delPermissions, setDelPermissions] = useState<string[]>(['project.approve', 'boq.approve']);
  const [delStartDate, setDelStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [delEndDate, setDelEndDate] = useState(new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10));
  const [delReason, setDelReason] = useState('Delegation during project site travel.');

  const userTypes = useMemo(() => securityService.getUserTypes(), [users]);
  const templates = useMemo(() => securityService.getPermissionTemplates(), [users]);
  const externalOrgs = useMemo(() => securityService.getExternalOrganizations(), [users]);
  const portalRegistry = useMemo(() => securityService.getPortalRegistry(), [users]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchQuery =
        u.fullName.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        u.username.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        u.employeeId.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        (u.organizationName && u.organizationName.toLowerCase().includes(userSearchQuery.toLowerCase()));

      const matchDept = selectedDeptFilter === 'ALL' || u.department === selectedDeptFilter;
      const matchStatus = selectedStatusFilter === 'ALL' || u.accountStatus === selectedStatusFilter;
      const matchCategory =
        selectedCategoryFilter === 'ALL' ||
        (selectedCategoryFilter === 'EXTERNAL' && u.isExternalUser) ||
        (selectedCategoryFilter === 'INTERNAL' && !u.isExternalUser) ||
        (selectedCategoryFilter === 'ADMIN' && u.adminAuthorityLevel && u.adminAuthorityLevel !== 'NONE');

      return matchQuery && matchDept && matchStatus && matchCategory;
    });
  }, [users, userSearchQuery, selectedDeptFilter, selectedStatusFilter, selectedCategoryFilter]);

  // Filtered Audit Logs
  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter(log => {
      const matchQuery =
        log.username.toLowerCase().includes(auditSearchQuery.toLowerCase()) ||
        log.target.toLowerCase().includes(auditSearchQuery.toLowerCase()) ||
        log.action.toLowerCase().includes(auditSearchQuery.toLowerCase()) ||
        (log.details && log.details.toLowerCase().includes(auditSearchQuery.toLowerCase()));

      const matchSev = auditSeverityFilter === 'ALL' || log.severity === auditSeverityFilter;
      return matchQuery && matchSev;
    });
  }, [auditLogs, auditSearchQuery, auditSeverityFilter]);

  const getStatusColor = (status: AccountStatus) => {
    switch (status) {
      case 'Active':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'Pending Activation':
      case 'Invited':
      case 'Pending Verification':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'Suspended':
      case 'On Leave':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
      case 'Locked':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
      case 'Terminated':
      case 'Archived':
      case 'Deactivated':
        return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
      default:
        return 'bg-slate-500/10 text-slate-600 border-slate-500/20';
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'Critical':
      case 'Security Alert':
        return 'text-rose-600 bg-rose-500/10 border border-rose-500/20';
      case 'Warning':
        return 'text-amber-600 bg-amber-500/10 border border-amber-500/20';
      default:
        return 'text-slate-600 bg-slate-500/10 border border-slate-500/20';
    }
  };

  const currentRoleForMatrix = roles.find(r => r.id === selectedRoleForMatrix) || roles[0];

  const togglePermissionForRole = (permCode: string) => {
    if (!isAdminAuthority) {
      notify('Access Denied: Only authorized Administrators can modify role permissions.');
      return;
    }
    if (!currentRoleForMatrix) return;
    const exists = currentRoleForMatrix.permissionCodes.includes(permCode);
    const updatedCodes = exists
      ? currentRoleForMatrix.permissionCodes.filter(c => c !== permCode)
      : [...currentRoleForMatrix.permissionCodes, permCode];

    saveRole({
      ...currentRoleForMatrix,
      permissionCodes: updatedCodes
    });
    notify(`Updated role [${currentRoleForMatrix.name}]: ${exists ? 'Removed' : 'Granted'} ${permCode}`);
  };

  const toggleExplicitDenyForRole = (permCode: string) => {
    if (!isAdminAuthority) {
      notify('Access Denied: Only authorized Administrators can configure explicit deny rules.');
      return;
    }
    if (!currentRoleForMatrix) return;
    const currentDenies = currentRoleForMatrix.deniedPermissionCodes || [];
    const exists = currentDenies.includes(permCode);
    const updatedDenies = exists
      ? currentDenies.filter(c => c !== permCode)
      : [...currentDenies, permCode];

    saveRole({
      ...currentRoleForMatrix,
      deniedPermissionCodes: updatedDenies
    });
    notify(`Explicit Deny Rule ${exists ? 'removed' : 'enforced'} for [${permCode}] on ${currentRoleForMatrix.name}`);
  };

  const handleCloneRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdminAuthority || !currentRoleForMatrix || !cloneRoleName.trim() || !cloneRoleCode.trim()) return;
    const cloned = securityService.cloneRole(
      currentRoleForMatrix.id,
      cloneRoleName.trim(),
      cloneRoleCode.trim(),
      effectiveUser.username
    );
    refreshData();
    setSelectedRoleForMatrix(cloned.id);
    setCloneRoleName('');
    setCloneRoleCode('');
    notify(`Cloned role [${currentRoleForMatrix.name}] into [${cloned.name}]`);
  };

  const handleCreateDelegationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdminAuthority && delDelegator !== effectiveUser.id) {
      notify('Normal users cannot delegate authority on behalf of other accounts.');
      return;
    }
    const delegatorUser = users.find(u => u.id === delDelegator);
    const delegateeUser = users.find(u => u.id === delDelegatee);

    if (!delegatorUser || !delegateeUser) return;

    createDelegation({
      delegatorId: delegatorUser.id,
      delegatorName: delegatorUser.fullName,
      delegatorRole: delegatorUser.roleName,
      delegateeId: delegateeUser.id,
      delegateeName: delegateeUser.fullName,
      delegateeRole: delegateeUser.roleName,
      delegatedPermissions: delPermissions,
      scope: delegatorUser.defaultScope,
      startDate: delStartDate,
      endDate: delEndDate,
      reason: delReason
    });

    setNewDelegationModal(false);
    notify(`Created time-bound authority delegation from ${delegatorUser.fullName} to ${delegateeUser.fullName}.`);
  };

  return (
    <div className="space-y-5">
      {/* Notification Toast */}
      {toastBanner && (
        <div className="bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg border border-slate-700 flex items-center justify-between text-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-orange-400 shrink-0" />
            <span>{toastBanner}</span>
          </div>
          <button onClick={() => setToastBanner(null)} className="text-slate-400 hover:text-white ml-4">
            &times;
          </button>
        </div>
      )}

      {/* Non-Admin Authority Protection Banner */}
      {!isAdminAuthority && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-900">
          <div className="flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold">Read-Only Security Inspection Mode: </span>
              <span>
                Active account <strong>{effectiveUser.fullName}</strong> ({effectiveUser.roleName}) does not hold Administrative Authority. Self-elevation and privilege modifications are strictly blocked by Central Authorization Policy.
              </span>
            </div>
          </div>
          {impersonatedUser && (
            <button
              onClick={() => impersonate(null)}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold shrink-0"
            >
              Exit Impersonation
            </button>
          )}
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-sm font-bold tracking-tight text-slate-900">
                Central Identity, User, Role, Portal & Permission Control Center
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-orange-50 text-orange-700 border border-orange-200">
                10-Layer Hierarchy · 21 Portals · 33 User Types
              </span>
              {impersonatedUser && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  Impersonating: {impersonatedUser.fullName}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Organization → Branch → Department → Portal → Module → Feature → Action → Project → Site/Factory/Workshop → Record
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500">
            Active Authority:{' '}
            <strong className="text-slate-800 font-semibold">{effectiveUser?.fullName}</strong>{' '}
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">
              {effectiveUser?.adminAuthorityLevel || effectiveUser?.roleName}
            </span>
          </span>
          {impersonatedUser && (
            <button
              onClick={() => {
                impersonate(null);
                notify('Ended persona impersonation; restored primary administrator session.');
              }}
              className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold"
            >
              Restore Admin
            </button>
          )}
          <button
            onClick={() => {
              refreshData();
              notify('Synchronized Central Identity & Authorization State.');
            }}
            className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors flex items-center gap-1.5 border border-slate-200 shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Sync Engine</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-1.5 flex items-center gap-1 overflow-x-auto shadow-xs text-xs">
        {[
          { id: 'dashboard', label: 'Control Overview', icon: Activity },
          { id: 'evaluation-engine', label: '13-Step Evaluation Engine', icon: Cpu },
          { id: 'portals', label: `Portal Registry (${portalRegistry.length})`, icon: Globe },
          { id: 'templates', label: `User Types & Templates (${templates.length})`, icon: Layers },
          { id: 'project-access', label: 'Project, Factory & Record Scopes', icon: Building2 },
          { id: 'organizations', label: `External Orgs & Branches (${externalOrgs.length})`, icon: FolderTree },
          { id: 'users', label: `Users & Lifecycle (${users.length})`, icon: UserCheck },
          { id: 'roles', label: `RBAC Matrix (${roles.length})`, icon: Key },
          { id: 'requests', label: `Privilege Approvals (${stats.pendingAccessRequests})`, icon: GitPullRequest },
          { id: 'delegations', label: `Delegations (${delegations.length})`, icon: Users },
          { id: 'sod', label: `SoD Rules (${sodRules.length})`, icon: Scale },
          { id: 'api-apps', label: 'API Apps & Break-Glass', icon: KeyRound },
          { id: 'sessions', label: `Sessions (${sessions.length})`, icon: Laptop },
          { id: 'audit', label: `Audit Ledger (${auditLogs.length})`, icon: FileText },
          { id: 'ecosystem', label: 'Ecosystem Directory', icon: Users },
          { id: 'account-types', label: 'Account Profiles', icon: FolderTree },
          { id: 'project-teams', label: 'Team Matrix', icon: Building2 }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as SecurityTab)}
              className={`px-2.5 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                isActive
                  ? 'bg-orange-500 text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ===================================================================== */}
      {/* ENTERPRISE SUB-PORTAL TABS                                            */}
      {/* ===================================================================== */}
      {activeTab === 'evaluation-engine' && (
        <EvaluationEngineAndApiTab
          mode="EVALUATION_ENGINE"
          users={users}
          actorUsername={effectiveUser.username}
          isAdminAuthority={isAdminAuthority}
          onRefresh={refreshData}
          onNotify={notify}
        />
      )}

      {activeTab === 'api-apps' && (
        <EvaluationEngineAndApiTab
          mode="API_APPS_AND_BREAKGLASS"
          users={users}
          actorUsername={effectiveUser.username}
          isAdminAuthority={isAdminAuthority}
          onRefresh={refreshData}
          onNotify={notify}
        />
      )}

      {activeTab === 'portals' && (
        <PortalAndTemplateControlTab
          mode="PORTALS"
          users={users}
          actorUsername={effectiveUser.username}
          isAdminAuthority={isAdminAuthority}
          onRefresh={refreshData}
          onNotify={notify}
        />
      )}

      {activeTab === 'templates' && (
        <PortalAndTemplateControlTab
          mode="TEMPLATES"
          users={users}
          actorUsername={effectiveUser.username}
          isAdminAuthority={isAdminAuthority}
          onRefresh={refreshData}
          onNotify={notify}
        />
      )}

      {activeTab === 'project-access' && (
        <ScopesAndOrganizationsTab
          mode="PROJECT_FACTORY_SCOPES"
          users={users}
          actorUsername={effectiveUser.username}
          isAdminAuthority={isAdminAuthority}
          onRefresh={refreshData}
          onNotify={notify}
        />
      )}

      {activeTab === 'organizations' && (
        <ScopesAndOrganizationsTab
          mode="ORGANIZATIONS_BRANCHES"
          users={users}
          actorUsername={effectiveUser.username}
          isAdminAuthority={isAdminAuthority}
          onRefresh={refreshData}
          onNotify={notify}
        />
      )}

      {activeTab === 'ecosystem' && <EcosystemDirectoryView />}
      {activeTab === 'account-types' && <AccountTypeManager />}
      {activeTab === 'project-teams' && <ProjectTeamMatrix />}

      {/* ===================================================================== */}
      {/* TAB 1: SECURITY DASHBOARD PERSPECTIVE                                 */}
      {/* ===================================================================== */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
            <div className="card p-4 cursor-pointer hover:border-orange-300 transition-colors" onClick={() => setActiveTab('users')}>
              <span className="text-xs text-slate-500">Total Identity Accounts</span>
              <p className="text-2xl font-bold text-slate-900 mt-1">{stats.totalUsers}</p>
              <div className="flex items-center gap-1.5 mt-2 text-[11px] text-emerald-600">
                <UserCheck className="w-3.5 h-3.5" />
                <span>{stats.activeUsers} Active · {users.filter(u => u.isExternalUser).length} External</span>
              </div>
            </div>

            <div className="card p-4 cursor-pointer hover:border-orange-300 transition-colors" onClick={() => setActiveTab('portals')}>
              <span className="text-xs text-slate-500">Central Portals</span>
              <p className="text-2xl font-bold text-slate-900 mt-1">{portalRegistry.length}</p>
              <div className="flex items-center gap-1.5 mt-2 text-[11px] text-indigo-600">
                <Globe className="w-3.5 h-3.5" />
                <span>Single Authoritative Gate</span>
              </div>
            </div>

            <div className="card p-4 cursor-pointer hover:border-orange-300 transition-colors" onClick={() => setActiveTab('roles')}>
              <span className="text-xs text-slate-500">RBAC Roles & Types</span>
              <p className="text-2xl font-bold text-slate-900 mt-1">{stats.totalRoles}</p>
              <div className="flex items-center gap-1.5 mt-2 text-[11px] text-slate-500">
                <Key className="w-3.5 h-3.5" />
                <span>{userTypes.length} User Types · {permissions.length} Perms</span>
              </div>
            </div>

            <div className="card p-4 cursor-pointer hover:border-orange-300 transition-colors" onClick={() => setActiveTab('organizations')}>
              <span className="text-xs text-slate-500">External Organizations</span>
              <p className="text-2xl font-bold text-blue-600 mt-1">{stats.externalOrganizationsCount}</p>
              <div className="flex items-center gap-1.5 mt-2 text-[11px] text-blue-600">
                <Building2 className="w-3.5 h-3.5" />
                <span>Factories, Clients, Suppliers</span>
              </div>
            </div>

            <div className="card p-4 cursor-pointer hover:border-orange-300 transition-colors" onClick={() => setActiveTab('requests')}>
              <span className="text-xs text-slate-500">Approval Queue</span>
              <p className="text-2xl font-bold text-orange-600 mt-1">{stats.pendingAccessRequests}</p>
              <div className="flex items-center gap-1.5 mt-2 text-[11px] text-orange-600">
                <GitPullRequest className="w-3.5 h-3.5" />
                <span>High-risk privilege requests</span>
              </div>
            </div>

            <div className="card p-4 cursor-pointer hover:border-orange-300 transition-colors" onClick={() => setActiveTab('audit')}>
              <span className="text-xs text-slate-500">Security Alerts</span>
              <p className="text-2xl font-bold text-rose-600 mt-1">{stats.securityAlertsToday}</p>
              <div className="flex items-center gap-1.5 mt-2 text-[11px] text-rose-600">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>{stats.lockedUsers} Locked · {stats.activeSessions} Sessions</span>
              </div>
            </div>
          </div>

          {/* 10-Layer Architecture Banner */}
          <div className="card p-4 bg-slate-900 text-white border-slate-800">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-orange-400 font-semibold">
                  Central Authorization Hierarchy & 13-Step Evaluation Pipeline
                </span>
                <h3 className="text-sm font-bold mt-0.5">
                  Every Internal Portal, Factory/Workshop Terminal, Project Workspace & External Partner App Evaluates Here
                </h3>
              </div>
              <button
                onClick={() => setActiveTab('evaluation-engine')}
                className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>Launch 13-Step Policy Simulator</span>
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-1.5 mt-3 text-[10px]">
              {[
                '1. Organization',
                '2. Branch',
                '3. Department',
                '4. Portal',
                '5. Module',
                '6. Feature',
                '7. Action (22)',
                '8. Project Scope',
                '9. Factory/Site',
                '10. Record ACL'
              ].map((step, i) => (
                <div key={i} className="bg-slate-800/90 border border-slate-700 rounded px-2 py-1.5 text-slate-200 font-mono text-center truncate">
                  {step}
                </div>
              ))}
            </div>
          </div>

          {/* Quick Operational Status Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Department Distribution */}
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center justify-between">
                <span>Configurable Departments</span>
                <span className="text-xs text-slate-400 font-normal">{departments.length} Units</span>
              </h3>
              <div className="space-y-2.5 mt-4 max-h-96 overflow-y-auto pr-1">
                {departments.map(dept => {
                  const deptUsersCount = users.filter(u => u.department === dept.code).length;
                  return (
                    <div key={dept.id} className="p-3 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-900">{dept.name}</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-100 font-medium text-slate-700">
                          {deptUsersCount} users
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{dept.description}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {dept.subDepartments.slice(0, 3).map((sub, sIdx) => (
                          <span key={sIdx} className="text-[10px] bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded text-slate-600">
                            {sub}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Center: Segregation of Duties Warnings */}
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center justify-between">
                <span>Separation of Duties (SoD) Active Rules</span>
                <span className="text-xs text-emerald-600 font-normal">Enforced</span>
              </h3>
              <div className="space-y-2.5 mt-4 max-h-96 overflow-y-auto pr-1">
                {sodRules.map(rule => (
                  <div key={rule.id} className="p-3 rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-900">{rule.ruleName}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-medium border ${
                          rule.severity === 'Strict Block'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {rule.severity}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">{rule.description}</p>
                    <div className="mt-2 flex items-center gap-1.5 text-[10px] font-mono text-slate-600">
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded">{rule.conflictingPermissionA}</span>
                      <span className="text-rose-500 font-bold">≠</span>
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded">{rule.conflictingPermissionB}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Recent Security Events */}
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center justify-between">
                <span>Recent Security Audit Events</span>
                <button
                  onClick={() => setActiveTab('audit')}
                  className="text-xs text-orange-600 hover:text-orange-700 font-medium"
                >
                  View Full Ledger
                </button>
              </h3>
              <div className="space-y-2.5 mt-4 max-h-96 overflow-y-auto pr-1">
                {auditLogs.slice(0, 6).map(log => (
                  <div key={log.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800 font-mono text-[11px]">{log.action}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${getSeverityBadge(log.severity)}`}>
                        {log.severity}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px] mt-1 line-clamp-2">{log.details || log.target}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5">
                      <span>
                        {log.username} · {log.ipAddress}
                      </span>
                      <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: USER MANAGEMENT & ACCOUNT LIFECYCLE CENTER                     */}
      {/* ===================================================================== */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Action Bar */}
          <div className="card p-4 flex flex-col lg:flex-row items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search user, email, org, ID..."
                  value={userSearchQuery}
                  onChange={e => setUserSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-orange-500"
                />
              </div>

              <select
                value={selectedCategoryFilter}
                onChange={e => setSelectedCategoryFilter(e.target.value)}
                className="text-xs py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
              >
                <option value="ALL">All Account Categories</option>
                <option value="INTERNAL">Internal Employees</option>
                <option value="EXTERNAL">External Organizations (Factories/Clients)</option>
                <option value="ADMIN">Administrators</option>
              </select>

              <select
                value={selectedDeptFilter}
                onChange={e => setSelectedDeptFilter(e.target.value)}
                className="text-xs py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
              >
                <option value="ALL">All Departments</option>
                {departments.map(d => (
                  <option key={d.id} value={d.code}>
                    {d.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedStatusFilter}
                onChange={e => setSelectedStatusFilter(e.target.value)}
                className="text-xs py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
              >
                <option value="ALL">All Lifecycle Statuses</option>
                <option value="Active">Active</option>
                <option value="Invited">Invited</option>
                <option value="Pending Verification">Pending Verification</option>
                <option value="Pending Activation">Pending Activation</option>
                <option value="Suspended">Suspended</option>
                <option value="On Leave">On Leave</option>
                <option value="Locked">Locked</option>
                <option value="Deactivated">Deactivated</option>
                <option value="Terminated">Terminated</option>
                <option value="Archived">Archived</option>
              </select>
            </div>

            {isAdminAuthority && (
              <button
                onClick={() => setIsNewUserModalOpen(true)}
                className="btn-primary text-xs shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                Provision Account (Deny-by-Default)
              </button>
            )}
          </div>

          {/* User Table */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="py-3 px-4">Identity & Organization</th>
                    <th className="py-3 px-4">User Type & Role</th>
                    <th className="py-3 px-4">Branch, Projects & Factories</th>
                    <th className="py-3 px-4">Lifecycle Status</th>
                    <th className="py-3 px-4">MFA & Authority</th>
                    <th className="py-3 px-4 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-full font-bold flex items-center justify-center text-xs shrink-0 ${
                              user.isExternalUser
                                ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {user.fullName.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-slate-900">{user.fullName}</span>
                              {user.isExternalUser && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                  External Org
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-500 block">
                              {user.email} · {user.employeeId}
                            </span>
                            {user.organizationName && (
                              <span className="text-[10px] text-indigo-600 font-medium block">
                                Org: {user.organizationName}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800 block">{user.roleName}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 inline-block mt-0.5">
                          Type: {user.userType || 'PROJECT_ENGINEER'}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Dept: {user.department}</span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="text-slate-800 font-medium block">
                          {user.branch} ({user.defaultScope})
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          Projects: {user.assignedProjectIds?.join(', ') || 'None'}
                        </span>
                        {user.assignedFactoryIds && user.assignedFactoryIds.length > 0 && (
                          <span className="text-[10px] text-orange-700 font-medium block">
                            Factories: {user.assignedFactoryIds.join(', ')}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${getStatusColor(
                            user.accountStatus
                          )}`}
                        >
                          {user.accountStatus}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        {user.mfaEnabled ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            {user.mfaMethod || 'TOTP'}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 block">MFA Disabled</span>
                        )}
                        {user.adminAuthorityLevel && user.adminAuthorityLevel !== 'NONE' && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-200 inline-block mt-1">
                            {user.adminAuthorityLevel}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          <button
                            onClick={() => {
                              impersonate(user.id);
                              notify(`Now impersonating ${user.fullName} (${user.roleName}) for live RBAC verification.`);
                            }}
                            className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded text-[11px] font-medium flex items-center gap-1"
                            title="Impersonate User to Verify Portal & Project Access"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Inspect</span>
                          </button>

                          {isAdminAuthority && (
                            <>
                              <button
                                onClick={() => setSelectedUserForEdit(user)}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium"
                              >
                                Configure
                              </button>
                              {user.accountStatus === 'Locked' && (
                                <button
                                  onClick={() => {
                                    setUserStatus(user.id, 'Active', 'Manual unlock by Admin');
                                    notify(`Unlocked account for ${user.fullName}.`);
                                  }}
                                  className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded text-[11px] font-medium border border-purple-200"
                                >
                                  Unlock
                                </button>
                              )}
                              {user.accountStatus === 'Active' ? (
                                <button
                                  onClick={() => {
                                    setUserStatus(user.id, 'Suspended', 'Administrative freeze');
                                    notify(`Suspended account for ${user.fullName}. All active sessions revoked.`);
                                  }}
                                  className="px-2 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 rounded text-[11px] transition-colors"
                                >
                                  Suspend
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setUserStatus(user.id, 'Active', 'Administrative activation');
                                    notify(`Activated account for ${user.fullName}.`);
                                  }}
                                  className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded text-[11px] font-medium border border-emerald-200"
                                >
                                  Activate
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: ROLE MANAGEMENT, CLONING & 22-ACTION PERMISSION MATRIX         */}
      {/* ===================================================================== */}
      {activeTab === 'roles' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left: Role Catalog Selector & Role Cloning */}
            <div className="lg:col-span-1 space-y-4">
              <div className="card p-4">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Enterprise Roles ({roles.length})
                </h3>
                <div className="space-y-1 max-h-[460px] overflow-y-auto pr-1">
                  {roles.map(r => (
                    <button
                      key={r.id}
                      onClick={() => setSelectedRoleForMatrix(r.id)}
                      className={`w-full text-left p-2.5 rounded-lg text-xs transition-colors flex items-center justify-between ${
                        selectedRoleForMatrix === r.id
                          ? 'bg-orange-500 text-white font-medium shadow-sm'
                          : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div className="truncate">
                        <span className="block truncate">{r.name}</span>
                        <span
                          className={`text-[10px] block ${
                            selectedRoleForMatrix === r.id ? 'text-orange-100' : 'text-slate-400'
                          }`}
                        >
                          {r.permissionCodes.length} allow · {(r.deniedPermissionCodes || []).length} deny · {r.defaultScope}
                        </span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>

              {isAdminAuthority && currentRoleForMatrix && (
                <form onSubmit={handleCloneRole} className="card p-4 space-y-2.5 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900">
                    <Copy className="w-3.5 h-3.5 text-orange-600" />
                    <span>Clone Selected Role</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Create a customizable role derivative from <strong>{currentRoleForMatrix.name}</strong>.
                  </p>
                  <input
                    type="text"
                    required
                    placeholder="New Role Name (e.g. Senior Site QS)"
                    value={cloneRoleName}
                    onChange={e => setCloneRoleName(e.target.value)}
                    className="input-field text-xs"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Role Code (e.g. SENIOR_SITE_QS)"
                    value={cloneRoleCode}
                    onChange={e => setCloneRoleCode(e.target.value)}
                    className="input-field text-xs font-mono"
                  />
                  <button type="submit" className="btn-primary w-full text-xs">
                    Clone & Customize Role
                  </button>
                </form>
              )}
            </div>

            {/* Right: Granular Permission Matrix for Selected Role */}
            <div className="lg:col-span-3">
              {currentRoleForMatrix && (
                <div className="card p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <span>{currentRoleForMatrix.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono border border-slate-200">
                          {currentRoleForMatrix.code} (v{currentRoleForMatrix.version || 1})
                        </span>
                        {currentRoleForMatrix.isSystem && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-mono border border-amber-200">
                            Core System Role
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">{currentRoleForMatrix.description}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold text-emerald-700 block">
                        {currentRoleForMatrix.permissionCodes.length} Granted ·{' '}
                        <span className="text-rose-600">
                          {(currentRoleForMatrix.deniedPermissionCodes || []).length} Explicit Deny
                        </span>
                      </span>
                      <span className="text-[11px] text-slate-400 block">
                        Default Scope: {currentRoleForMatrix.defaultScope}
                      </span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 flex items-center justify-between">
                    <span>
                      <strong>Click action pill</strong> to toggle Grant/Revoke.{' '}
                      <strong>Click Ban icon</strong> to enforce an Explicit Deny override (blocks inherited access).
                    </span>
                  </div>

                  {/* Permissions Breakdown by Functional Domain */}
                  <div className="space-y-5">
                    {[
                      'Operations & Site Execution',
                      'Factory & Workshop Production',
                      'Finance, HR & Commercial',
                      'Procurement & Supply Chain',
                      'System & Security Administration'
                    ].map(domain => {
                      const domainPerms = permissions.filter(p => {
                        if (domain === 'Factory & Workshop Production') {
                          return (
                            p.departmentCode === 'FACTORY_PRODUCTION' ||
                            p.module.toLowerCase().includes('factory') ||
                            p.module.toLowerCase().includes('production') ||
                            p.module.toLowerCase().includes('quality') ||
                            p.module.toLowerCase().includes('hse')
                          );
                        }
                        if (domain === 'Operations & Site Execution') {
                          return (
                            (p.departmentCode === 'OPERATIONS' ||
                              p.departmentCode === 'PROJECT_MANAGEMENT' ||
                              p.departmentCode === 'ENGINEERING_QS') &&
                            !p.module.toLowerCase().includes('factory') &&
                            !p.module.toLowerCase().includes('production') &&
                            !p.module.toLowerCase().includes('quality') &&
                            !p.module.toLowerCase().includes('hse')
                          );
                        }
                        if (domain === 'Finance, HR & Commercial') {
                          return (
                            p.departmentCode === 'COMMERCIAL_ADMIN' ||
                            p.departmentCode === 'FINANCE_ACCOUNTING' ||
                            p.departmentCode === 'HR_ADMIN'
                          );
                        }
                        if (domain === 'Procurement & Supply Chain') {
                          return p.departmentCode === 'PROCUREMENT_SUPPLY_CHAIN' || p.departmentCode === 'LOGISTICS';
                        }
                        return p.departmentCode === 'SYSTEM';
                      });

                      const modules = Array.from(new Set(domainPerms.map(p => p.module)));
                      if (modules.length === 0) return null;

                      return (
                        <div key={domain} className="border border-slate-200 rounded-xl overflow-hidden">
                          <div className="bg-slate-50 px-4 py-2.5 font-semibold text-xs text-slate-700 border-b border-slate-200 flex items-center justify-between">
                            <span>{domain}</span>
                            <span className="text-[11px] text-slate-400">{modules.length} Modules</span>
                          </div>

                          <div className="p-4 space-y-4">
                            {modules.map(modName => {
                              const modPerms = domainPerms.filter(p => p.module === modName);

                              return (
                                <div key={modName} className="space-y-2">
                                  <span className="text-xs font-semibold text-slate-900 block">{modName}</span>
                                  <div className="flex flex-wrap gap-1.5">
                                    {modPerms.map(perm => {
                                      const isGranted = currentRoleForMatrix.permissionCodes.includes(perm.code);
                                      const isDenied = (currentRoleForMatrix.deniedPermissionCodes || []).includes(perm.code);
                                      return (
                                        <div
                                          key={perm.id}
                                          className={`inline-flex items-center rounded border text-[11px] font-mono overflow-hidden ${
                                            isDenied
                                              ? 'bg-rose-50 border-rose-300 text-rose-700'
                                              : isGranted
                                              ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30 font-semibold'
                                              : 'bg-slate-100 text-slate-500 border-slate-200'
                                          }`}
                                        >
                                          <button
                                            type="button"
                                            onClick={() => togglePermissionForRole(perm.code)}
                                            className="px-2 py-1 flex items-center gap-1 hover:bg-black/5 cursor-pointer"
                                            title={`${perm.code}: ${perm.description}`}
                                          >
                                            {isGranted && !isDenied ? (
                                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                            ) : null}
                                            <span>{perm.action}</span>
                                            {perm.isHighRisk && (
                                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="High-Risk Permission" />
                                            )}
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => toggleExplicitDenyForRole(perm.code)}
                                            className={`px-1.5 py-1 border-l cursor-pointer ${
                                              isDenied
                                                ? 'bg-rose-600 text-white border-rose-600'
                                                : 'border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                            }`}
                                            title="Toggle Explicit Deny Override"
                                          >
                                            <Ban className="w-2.5 h-2.5" />
                                          </button>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: ACCESS REQUESTS & APPROVAL-BASED PRIVILEGE CHANGES             */}
      {/* ===================================================================== */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          <div className="card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-0.5">
                Approval-Based Privilege Changes & Access Request Queue
              </h3>
              <p className="text-xs text-slate-500">
                High-risk permissions, external factory scopes, and role elevations require second administrator or Super Administrator approval.
              </p>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded bg-orange-50 text-orange-700 border border-orange-200">
              Dual-Admin Policy Active
            </span>
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="py-3 px-4">Request # & Requester</th>
                    <th className="py-3 px-4">Type & Requested Scope/Permission</th>
                    <th className="py-3 px-4">Risk & Duration</th>
                    <th className="py-3 px-4">Business Justification</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Admin Review</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {accessRequests.map(req => (
                    <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-mono text-slate-500 block text-[11px]">{req.requestNumber}</span>
                        <span className="font-semibold text-slate-900 block">{req.requesterName}</span>
                        <span className="text-[10px] text-slate-400">{req.requesterRole}</span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-800 block">{req.requestType}</span>
                        <span className="text-[11px] text-orange-700 font-mono block">{req.requestedItem}</span>
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        <span className="block">{req.duration || 'Permanent'}</span>
                        {req.isHighRisk && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-semibold inline-block mt-0.5">
                            High-Risk Dual Approval
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-600 max-w-xs">
                        <p className="text-[11px] line-clamp-2">{req.justification}</p>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                            req.status === 'Admin Approved'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : req.status === 'Rejected'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {req.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        {req.status === 'Pending Review' || req.status === 'Manager Approved' ? (
                          isAdminAuthority ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  reviewAccessRequest(req.id, 'Approved', 'Approved via Central Access Control Center');
                                  notify(`Authorized privilege request ${req.requestNumber} for ${req.requesterName}.`);
                                }}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-medium"
                              >
                                Authorize
                              </button>
                              <button
                                onClick={() => {
                                  reviewAccessRequest(req.id, 'Rejected', 'Declined by Administrator');
                                  notify(`Rejected privilege request ${req.requestNumber}.`);
                                }}
                                className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-xs font-medium"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-amber-600">Requires Admin Authority</span>
                          )
                        ) : (
                          <span className="text-[11px] text-slate-400">Reviewed by {req.reviewedBy}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 5: DELEGATIONS                                                    */}
      {/* ===================================================================== */}
      {activeTab === 'delegations' && (
        <div className="space-y-4">
          <div className="card p-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Time-Bound Authority Delegation Engine</h3>
              <p className="text-xs text-slate-500">
                Grant temporary proxy approvals to authorized subordinates with automatic expiration and audit tracking.
              </p>
            </div>
            <button onClick={() => setNewDelegationModal(true)} className="btn-primary text-xs">
              <Plus className="w-3.5 h-3.5" />
              New Delegation
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {delegations.map(del => (
              <div key={del.id} className="card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                      del.status === 'Active'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {del.status}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {del.startDate} to {del.endDate}
                  </span>
                </div>

                <div>
                  <div className="text-xs text-slate-500">Delegator</div>
                  <span className="text-sm font-semibold text-slate-900 block">{del.delegatorName}</span>
                  <span className="text-[11px] text-slate-500">{del.delegatorRole}</span>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <div className="text-xs text-slate-500">Authorized Delegatee</div>
                  <span className="text-sm font-semibold text-slate-900 block">{del.delegateeName}</span>
                  <span className="text-[11px] text-slate-500">{del.delegateeRole}</span>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-medium text-slate-700 block mb-1">Delegated Privileges:</span>
                  <div className="flex flex-wrap gap-1">
                    {del.delegatedPermissions.map(p => (
                      <span key={p} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-mono">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded">{del.reason}</p>

                {del.status === 'Active' && isAdminAuthority && (
                  <button
                    onClick={() => {
                      revokeDelegation(del.id);
                      notify(`Revoked delegation for ${del.delegateeName}.`);
                    }}
                    className="w-full py-1 text-xs text-rose-600 hover:text-rose-700 font-medium border border-rose-200 rounded hover:bg-rose-50 transition-colors"
                  >
                    Revoke Delegation Immediately
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 6: ACTIVE SESSIONS & DEVICE TRACKING                              */}
      {/* ===================================================================== */}
      {activeTab === 'sessions' && (
        <div className="space-y-4">
          <div className="card p-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Active Terminal Sessions ({sessions.length})</h3>
              <p className="text-xs text-slate-500">
                Multi-device tracking, IP addresses, and remote session revocation.
              </p>
            </div>
            {effectiveUser && isAdminAuthority && (
              <button
                onClick={() => {
                  forceLogoutAllDevices(effectiveUser.id);
                  notify('Disconnected all remote sessions.');
                }}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-medium transition-colors"
              >
                Disconnect All Remote Sessions
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sessions.map(sess => (
              <div key={sess.id} className="card p-4 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                    <Laptop className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{sess.fullName}</span>
                      {sess.isCurrent && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-200">
                          Current Device
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-600 block mt-0.5">
                      {sess.device} · {sess.browser}
                    </span>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                      <span>IP: {sess.ipAddress}</span>
                      <span>·</span>
                      <span>{sess.location}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-1">
                      Logged in: {new Date(sess.loginTime).toLocaleString()}
                    </span>
                  </div>
                </div>

                {!sess.isCurrent && isAdminAuthority && (
                  <button
                    onClick={() => {
                      terminateSession(sess.id);
                      notify(`Revoked session for ${sess.fullName}.`);
                    }}
                    className="px-2.5 py-1 text-xs text-rose-600 hover:bg-rose-50 border border-rose-200 rounded font-medium transition-colors shrink-0"
                  >
                    Revoke Session
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 7: SECURITY AUDIT LEDGER                                          */}
      {/* ===================================================================== */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="card p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter audit events, users, actions..."
                  value={auditSearchQuery}
                  onChange={e => setAuditSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-orange-500"
                />
              </div>

              <select
                value={auditSeverityFilter}
                onChange={e => setAuditSeverityFilter(e.target.value)}
                className="text-xs py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
              >
                <option value="ALL">All Severities</option>
                <option value="Info">Info</option>
                <option value="Warning">Warning</option>
                <option value="Security Alert">Security Alert</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            <span className="text-xs text-slate-500">
              Showing {filteredAuditLogs.length} immutable audit records
            </span>
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Event Action</th>
                    <th className="py-3 px-4">Actor & IP</th>
                    <th className="py-3 px-4">Target Resource</th>
                    <th className="py-3 px-4">Before / After & Details</th>
                    <th className="py-3 px-4 text-right">Severity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredAuditLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900 font-mono text-[11px]">
                        {log.action}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-800 block">{log.username}</span>
                        <span className="text-[11px] text-slate-400 font-mono block">{log.ipAddress}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">{log.target}</td>
                      <td className="py-3 px-4 text-slate-600 max-w-md">
                        {(log.oldValue || log.newValue) && (
                          <div className="text-[10px] font-mono text-slate-500 mb-0.5">
                            {log.oldValue ? `${log.oldValue} → ` : ''}
                            <span className="text-slate-800 font-semibold">{log.newValue}</span>
                          </div>
                        )}
                        <p className="text-[11px]">{log.details || '—'}</p>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${getSeverityBadge(log.severity)}`}>
                          {log.severity}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 9: ORGANIZATIONAL STRUCTURE                                       */}
      {/* ===================================================================== */}
      {activeTab === 'departments' && (
        <div className="space-y-6">
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-1">Configurable Departmental Hierarchy</h3>
            <p className="text-xs text-slate-500">
              Structural boundaries for Operations, Project Management, Quality, HSE, Factory/Production, Finance, HR, Engineering, Logistics, and Procurement.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {departments.map(dept => (
              <div key={dept.id} className="card p-5 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-base font-bold text-slate-900">{dept.name}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-100 rounded text-slate-600">
                    {dept.code}
                  </span>
                </div>
                <p className="text-xs text-slate-600">{dept.description}</p>

                <div>
                  <span className="text-xs font-semibold text-slate-700 block mb-2">Sub-Departments & Units:</span>
                  <div className="space-y-1.5">
                    {dept.subDepartments.map((sub, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-xs text-slate-600 p-2 rounded bg-slate-50 border border-slate-200/60"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                        <span>{sub}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 10: SEGREGATION OF DUTIES (SoD)                                   */}
      {/* ===================================================================== */}
      {activeTab === 'sod' && (
        <div className="space-y-6">
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-1">Separation of Duties (SoD) Policy Engine</h3>
            <p className="text-xs text-slate-500">
              Sensitive actions require different users for preparation, approval, and execution across financial approvals, user privilege changes, quotation approvals, payment releases, and quality sign-offs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sodRules.map(rule => (
              <div key={rule.id} className="card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{rule.ruleName}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-medium border ${
                      rule.severity === 'Strict Block'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {rule.severity}
                  </span>
                </div>
                <p className="text-xs text-slate-600">{rule.description}</p>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Preparation / Request Action:</span>
                    <span className="font-semibold text-slate-800">{rule.conflictingPermissionA}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Approval / Release Action:</span>
                    <span className="font-semibold text-rose-700">{rule.conflictingPermissionB}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: PROVISION NEW USER ACCOUNT (DENY-BY-DEFAULT)                   */}
      {/* ===================================================================== */}
      {isNewUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card max-w-lg w-full p-6 space-y-4 bg-white animate-in fade-in max-h-[90vh] overflow-y-auto">
            <div>
              <h3 className="text-base font-bold text-slate-900">Provision Enterprise User Account</h3>
              <p className="text-[11px] text-slate-500">
                Enforces Deny-by-Default security: new accounts receive zero project/factory scopes until explicitly assigned.
              </p>
            </div>
            <form
              onSubmit={e => {
                e.preventDefault();
                if (!isAdminAuthority) return;
                const form = e.currentTarget;
                const roleIdVal = (form.elements.namedItem('roleId') as HTMLSelectElement).value;
                const userTypeVal = (form.elements.namedItem('userType') as HTMLSelectElement).value as ConfigurableUserTypeCode;
                const orgIdVal = (form.elements.namedItem('organizationId') as HTMLSelectElement).value;
                const orgObj = externalOrgs.find(o => o.id === orgIdVal);
                const selectedRole = roles.find(r => r.id === roleIdVal);

                const newUser: SecurityUser = {
                  id: `usr-${Date.now()}`,
                  employeeId: (form.elements.namedItem('employeeId') as HTMLInputElement).value,
                  fullName: (form.elements.namedItem('fullName') as HTMLInputElement).value,
                  username: (form.elements.namedItem('username') as HTMLInputElement).value,
                  email: (form.elements.namedItem('email') as HTMLInputElement).value,
                  mobile: '+94 77 000 0000',
                  department: (form.elements.namedItem('department') as HTMLSelectElement).value as any,
                  designation: (form.elements.namedItem('designation') as HTMLInputElement).value,
                  userType: userTypeVal as ConfigurableUserTypeCode,
                  roleId: roleIdVal,
                  roleName: selectedRole?.name || 'Viewer',
                  branch: (form.elements.namedItem('branch') as HTMLSelectElement).value,
                  assignedBranches: [(form.elements.namedItem('branch') as HTMLSelectElement).value],
                  employmentStatus: orgObj ? 'External Partner' : 'Full-Time',
                  accountStatus: 'Active',
                  mfaEnabled: (form.elements.namedItem('mfaEnabled') as HTMLInputElement).checked,
                  defaultScope: 'Own Records',
                  assignedProjectIds: [],
                  assignedFactoryIds: [],
                  isExternalUser: Boolean(orgObj),
                  organizationId: orgObj?.id,
                  organizationName: orgObj?.name,
                  adminAuthorityLevel: 'NONE',
                  failedLoginAttempts: 0,
                  lastPasswordChange: new Date().toISOString(),
                  createdBy: effectiveUser?.username || 'admin',
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                };
                saveUser(newUser);
                setIsNewUserModalOpen(false);
                notify(`Provisioned account for ${newUser.fullName} under Deny-by-Default policy.`);
              }}
              className="space-y-3 text-xs"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-text">Employee / Partner ID</label>
                  <input name="employeeId" required defaultValue={`EMP-${Math.floor(200 + Math.random() * 700)}`} className="input-field" />
                </div>
                <div>
                  <label className="label-text">Full Name</label>
                  <input name="fullName" required placeholder="e.g. Kasun Perera" className="input-field" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-text">Corporate Username</label>
                  <input name="username" required placeholder="e.g. kasun.p" className="input-field" />
                </div>
                <div>
                  <label className="label-text">Work Email</label>
                  <input name="email" type="email" required placeholder="kasun@innovista.com" className="input-field" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-text">Structured User Type (33 Profiles)</label>
                  <select name="userType" className="input-field">
                    {userTypes.map(ut => (
                      <option key={ut.code} value={ut.code}>
                        {ut.name} ({ut.category})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label-text">RBAC Role</label>
                  <select name="roleId" defaultValue="role-viewer" className="input-field">
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-text">Department</label>
                  <select name="department" className="input-field">
                    {departments.map(d => (
                      <option key={d.id} value={d.code}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label-text">Designation</label>
                  <input name="designation" defaultValue="Project Engineer" className="input-field" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-text">Primary Branch</label>
                  <select name="branch" className="input-field">
                    <option value="Head Office (Colombo)">Head Office (Colombo)</option>
                    <option value="Main Store">Main Store</option>
                    <option value="Dubai Fabrication Yard">Dubai Fabrication Yard</option>
                    <option value="Abu Dhabi Site Hub">Abu Dhabi Site Hub</option>
                  </select>
                </div>
                <div>
                  <label className="label-text">Organization (If External)</label>
                  <select name="organizationId" defaultValue="" className="input-field">
                    <option value="">Internal Innovista Employee</option>
                    {externalOrgs.map(org => (
                      <option key={org.id} value={org.id}>
                        {org.name} ({org.orgType})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input name="mfaEnabled" type="checkbox" defaultChecked className="rounded" />
                  <span className="text-slate-700 font-medium">Require Mandatory MFA for this Account</span>
                </label>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsNewUserModalOpen(false)}
                  className="btn-secondary w-1/2"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary w-1/2">
                  Save & Provision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: CREATE DELEGATION                                              */}
      {/* ===================================================================== */}
      {newDelegationModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card max-w-md w-full p-6 space-y-4 bg-white animate-in fade-in">
            <h3 className="text-base font-bold text-slate-900">Delegate Authority</h3>
            <form onSubmit={handleCreateDelegationSubmit} className="space-y-3 text-xs">
              <div>
                <label className="label-text">Delegator (Originator)</label>
                <select
                  value={delDelegator}
                  onChange={e => setDelDelegator(e.target.value)}
                  className="input-field"
                >
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} ({u.roleName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label-text">Delegatee (Authorized Proxy)</label>
                <select
                  value={delDelegatee}
                  onChange={e => setDelDelegatee(e.target.value)}
                  className="input-field"
                >
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} ({u.roleName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="label-text">Start Date</label>
                  <input
                    type="date"
                    value={delStartDate}
                    onChange={e => setDelStartDate(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label-text">End Date (Auto-Expiry)</label>
                  <input
                    type="date"
                    value={delEndDate}
                    onChange={e => setDelEndDate(e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="label-text">Select Delegated Permissions</label>
                <div className="grid grid-cols-2 gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-lg">
                  {[
                    'project.approve',
                    'boq.approve',
                    'invoice.approve',
                    'payment.approve',
                    'purchase.approve',
                    'quality.approve'
                  ].map(p => (
                    <label key={p} className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-700">
                      <input
                        type="checkbox"
                        checked={delPermissions.includes(p)}
                        onChange={e => {
                          if (e.target.checked) {
                            setDelPermissions([...delPermissions, p]);
                          } else {
                            setDelPermissions(delPermissions.filter(item => item !== p));
                          }
                        }}
                        className="rounded text-orange-600"
                      />
                      <span>{p}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="label-text">Reason for Proxy Delegation</label>
                <textarea
                  value={delReason}
                  onChange={e => setDelReason(e.target.value)}
                  rows={2}
                  className="input-field"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setNewDelegationModal(false)}
                  className="btn-secondary w-1/2"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary w-1/2">
                  Confirm Delegation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: EDIT USER ACCOUNT, SCOPES & AUTHORITY                          */}
      {/* ===================================================================== */}
      {selectedUserForEdit && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card max-w-xl w-full p-6 space-y-4 bg-white animate-in fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Configure User Identity, Role & Scopes</h3>
                <p className="text-xs text-slate-500">
                  {selectedUserForEdit.fullName} ({selectedUserForEdit.employeeId})
                </p>
              </div>
              <button
                onClick={() => setSelectedUserForEdit(null)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                if (!isAdminAuthority) return;
                const form = e.currentTarget;
                const roleIdVal = (form.elements.namedItem('roleId') as HTMLSelectElement).value;
                const projectsRaw = (form.elements.namedItem('assignedProjectIds') as HTMLInputElement).value;
                const factoriesRaw = (form.elements.namedItem('assignedFactoryIds') as HTMLInputElement).value;

                const updated: SecurityUser = {
                  ...selectedUserForEdit,
                  fullName: (form.elements.namedItem('fullName') as HTMLInputElement).value,
                  email: (form.elements.namedItem('email') as HTMLInputElement).value,
                  mobile: (form.elements.namedItem('mobile') as HTMLInputElement).value,
                  department: (form.elements.namedItem('department') as HTMLSelectElement).value as any,
                  designation: (form.elements.namedItem('designation') as HTMLInputElement).value,
                  userType: (form.elements.namedItem('userType') as HTMLSelectElement).value as ConfigurableUserTypeCode,
                  adminAuthorityLevel: (form.elements.namedItem('adminAuthorityLevel') as HTMLSelectElement).value as AdminAuthorityLevel,
                  roleId: roleIdVal,
                  roleName: roles.find(r => r.id === roleIdVal)?.name || selectedUserForEdit.roleName,
                  branch: (form.elements.namedItem('branch') as HTMLSelectElement).value,
                  defaultScope: (form.elements.namedItem('defaultScope') as HTMLSelectElement).value as any,
                  accountStatus: (form.elements.namedItem('accountStatus') as HTMLSelectElement).value as AccountStatus,
                  assignedProjectIds: projectsRaw
                    .split(',')
                    .map(s => s.trim())
                    .filter(Boolean),
                  assignedFactoryIds: factoriesRaw
                    .split(',')
                    .map(s => s.trim())
                    .filter(Boolean),
                  mfaEnabled: (form.elements.namedItem('mfaEnabled') as HTMLInputElement).checked
                };
                saveUser(updated);
                setSelectedUserForEdit(null);
                notify(`Saved identity and scope configuration for ${updated.fullName}.`);
              }}
              className="space-y-3 text-xs"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-text">Full Name</label>
                  <input name="fullName" defaultValue={selectedUserForEdit.fullName} required className="input-field" />
                </div>
                <div>
                  <label className="label-text">Email Address</label>
                  <input name="email" type="email" defaultValue={selectedUserForEdit.email} required className="input-field" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-text">Structured User Type</label>
                  <select
                    name="userType"
                    defaultValue={selectedUserForEdit.userType || 'PROJECT_ENGINEER'}
                    className="input-field"
                  >
                    {userTypes.map(ut => (
                      <option key={ut.code} value={ut.code}>
                        {ut.name} ({ut.category})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label-text">Administrative Authority Level</label>
                  <select
                    name="adminAuthorityLevel"
                    defaultValue={selectedUserForEdit.adminAuthorityLevel || 'NONE'}
                    className="input-field"
                  >
                    <option value="NONE">NONE (Standard User)</option>
                    <option value="PROJECT_ADMINISTRATOR">PROJECT_ADMINISTRATOR</option>
                    <option value="PORTAL_ADMINISTRATOR">PORTAL_ADMINISTRATOR</option>
                    <option value="DEPARTMENT_ADMINISTRATOR">DEPARTMENT_ADMINISTRATOR</option>
                    <option value="SYSTEM_ADMINISTRATOR">SYSTEM_ADMINISTRATOR</option>
                    <option value="SUPER_ADMINISTRATOR">SUPER_ADMINISTRATOR</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-text">Department</label>
                  <select name="department" defaultValue={selectedUserForEdit.department} className="input-field">
                    {departments.map(d => (
                      <option key={d.id} value={d.code}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label-text">Assigned RBAC Role</label>
                  <select name="roleId" defaultValue={selectedUserForEdit.roleId} className="input-field">
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="label-text">Branch</label>
                  <select name="branch" defaultValue={selectedUserForEdit.branch} className="input-field">
                    <option value="Head Office (Colombo)">Head Office (Colombo)</option>
                    <option value="Main Store">Main Store</option>
                    <option value="Dubai Fabrication Yard">Dubai Fabrication Yard</option>
                    <option value="Abu Dhabi Site Hub">Abu Dhabi Site Hub</option>
                  </select>
                </div>
                <div>
                  <label className="label-text">Default Scope</label>
                  <select name="defaultScope" defaultValue={selectedUserForEdit.defaultScope} className="input-field">
                    <option value="Global">Global</option>
                    <option value="Organization">Organization</option>
                    <option value="Branch">Branch</option>
                    <option value="Department">Department</option>
                    <option value="Project">Project</option>
                    <option value="Factory">Factory</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Own Records">Own Records</option>
                  </select>
                </div>
                <div>
                  <label className="label-text">Lifecycle Status</label>
                  <select name="accountStatus" defaultValue={selectedUserForEdit.accountStatus} className="input-field">
                    <option value="Active">Active</option>
                    <option value="Invited">Invited</option>
                    <option value="Pending Verification">Pending Verification</option>
                    <option value="Pending Activation">Pending Activation</option>
                    <option value="Suspended">Suspended</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Locked">Locked</option>
                    <option value="Deactivated">Deactivated</option>
                    <option value="Terminated">Terminated</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-text">Authorized Project IDs (comma-separated or *)</label>
                  <input
                    name="assignedProjectIds"
                    defaultValue={(selectedUserForEdit.assignedProjectIds || []).join(', ')}
                    placeholder="PRJ-2026-001, PRJ-2026-002"
                    className="input-field font-mono"
                  />
                </div>
                <div>
                  <label className="label-text">Authorized Factory IDs (comma-separated or *)</label>
                  <input
                    name="assignedFactoryIds"
                    defaultValue={(selectedUserForEdit.assignedFactoryIds || []).join(', ')}
                    placeholder="fac-inv-01, fac-ext-01"
                    className="input-field font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-text">Mobile</label>
                  <input name="mobile" defaultValue={selectedUserForEdit.mobile} className="input-field" />
                </div>
                <div>
                  <label className="label-text">Designation</label>
                  <input name="designation" defaultValue={selectedUserForEdit.designation} className="input-field" />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    name="mfaEnabled"
                    type="checkbox"
                    defaultChecked={selectedUserForEdit.mfaEnabled}
                    className="rounded text-orange-600"
                  />
                  <span className="text-slate-700 font-medium">Require Multi-Factor Authentication (MFA)</span>
                </label>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedUserForEdit(null)}
                  className="btn-secondary w-1/2"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary w-1/2">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
