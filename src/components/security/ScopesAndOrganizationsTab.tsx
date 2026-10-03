import React, { useState } from 'react';
import {
  FolderKanban,
  Factory,
  Building2,
  FileLock2,
  Plus,
  Trash2,
  CheckCircle2,
  ShieldAlert,
  MapPin,
  Lock
} from 'lucide-react';
import {
  SecurityUser,
  ProjectUserAssignment,
  FactoryUserAssignment,
  ExternalOrganization,
  BranchDefinition,
  RecordLevelAccessGrant,
  ProjectRoleType
} from '../../types/security';
import { securityService } from '../../services/securityService';

interface ScopesAndOrganizationsTabProps {
  mode: 'PROJECT_FACTORY_SCOPES' | 'ORGANIZATIONS_BRANCHES';
  users: SecurityUser[];
  actorUsername: string;
  isAdminAuthority: boolean;
  onRefresh: () => void;
  onNotify: (msg: string) => void;
}

const AVAILABLE_PROJECTS = [
  { id: 'PRJ-2026-001', name: 'Sapphire Marina Mixed-Use Tower Curtain Wall' },
  { id: 'PRJ-2026-002', name: 'Orion Skybridge Structural Steel & Glazing' },
  { id: 'PRJ-2026-003', name: 'Emerald Bay Hospital Unitized Facade' },
  { id: 'PRJ-2025-001', name: 'Cinnamon Life Integrated Resort Facade' },
  { id: 'PRJ-2025-002', name: 'Port City Financial Center Atrium' }
];

const AVAILABLE_FACTORIES = [
  { id: 'fac-inv-01', name: 'Innovista Central Curtain Wall & Aluminium Plant (Colombo)', external: false },
  { id: 'fac-inv-02', name: 'Innovista Heavy Structural Steel & Coating Workshop (Kandy)', external: false },
  { id: 'fac-ext-01', name: 'Al-Futtaim Architectural Metalworks (External Partner Plant)', external: true },
  { id: 'fac-ext-02', name: 'Lanka Structural Steel & Powder Coaters (External Workshop)', external: true }
];

export const ScopesAndOrganizationsTab: React.FC<ScopesAndOrganizationsTabProps> = ({
  mode,
  users,
  actorUsername,
  isAdminAuthority,
  onRefresh,
  onNotify
}) => {
  const [projectAssignments, setProjectAssignments] = useState<ProjectUserAssignment[]>(() =>
    securityService.getProjectAssignments()
  );
  const [factoryAssignments, setFactoryAssignments] = useState<FactoryUserAssignment[]>(() =>
    securityService.getFactoryAssignments()
  );
  const [organizations, setOrganizations] = useState<ExternalOrganization[]>(() =>
    securityService.getExternalOrganizations()
  );
  const [branches] = useState<BranchDefinition[]>(() => securityService.getBranches());
  const [recordGrants, setRecordGrants] = useState<RecordLevelAccessGrant[]>(() =>
    securityService.getRecordAccessGrants()
  );

  // Project assignment form
  const [paUserId, setPaUserId] = useState(users[1]?.id || users[0]?.id || '');
  const [paProjectId, setPaProjectId] = useState(AVAILABLE_PROJECTS[0].id);
  const [paRole, setPaRole] = useState<ProjectRoleType>('Project Engineer');
  const [paMilestones, setPaMilestones] = useState(false);
  const [paFinancials, setPaFinancials] = useState(false);

  // Factory assignment form
  const [faUserId, setFaUserId] = useState(users[2]?.id || users[0]?.id || '');
  const [faFactoryId, setFaFactoryId] = useState(AVAILABLE_FACTORIES[0].id);
  const [faRole, setFaRole] = useState<FactoryUserAssignment['factoryRole']>('Factory Manager');
  const [faProjectId, setFaProjectId] = useState('PRJ-2026-001');
  const [faWorkPackage, setFaWorkPackage] = useState('fwp-01');

  // New External Organization form
  const [orgName, setOrgName] = useState('');
  const [orgCode, setOrgCode] = useState('');
  const [orgType, setOrgType] = useState<ExternalOrganization['orgType']>('EXTERNAL_FACTORY');
  const [orgContact, setOrgContact] = useState('');
  const [orgEmail, setOrgEmail] = useState('');
  const [orgProjectId, setOrgProjectId] = useState('PRJ-2026-001');
  const [orgFactoryId, setOrgFactoryId] = useState('fac-ext-01');

  const handleAddProjectAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdminAuthority) return;
    const u = users.find(x => x.id === paUserId);
    const p = AVAILABLE_PROJECTS.find(x => x.id === paProjectId);
    if (!u || !p) return;

    securityService.assignUserToProject(
      {
        projectId: p.id,
        projectName: p.name,
        userId: u.id,
        userFullName: u.fullName,
        projectRole: paRole,
        allowedActions: ['view', 'create', 'edit', 'submit', 'upload', 'print'],
        canApproveMilestones: paMilestones,
        canViewFinancials: paFinancials,
        assignedBy: actorUsername
      },
      actorUsername
    );
    setProjectAssignments(securityService.getProjectAssignments());
    onRefresh();
    onNotify(`Assigned ${u.fullName} to project [${p.id}] as ${paRole}.`);
  };

  const handleRemoveProjectAssignment = (id: string) => {
    if (!isAdminAuthority) return;
    securityService.removeProjectAssignment(id, actorUsername);
    setProjectAssignments(securityService.getProjectAssignments());
    onRefresh();
    onNotify('Removed project assignment.');
  };

  const handleAddFactoryAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdminAuthority) return;
    const u = users.find(x => x.id === faUserId);
    const f = AVAILABLE_FACTORIES.find(x => x.id === faFactoryId);
    if (!u || !f) return;

    securityService.assignUserToFactory(
      {
        factoryId: f.id,
        factoryName: f.name,
        isExternalFactory: f.external,
        userId: u.id,
        userFullName: u.fullName,
        factoryRole: faRole,
        assignedProjectIds: [faProjectId],
        assignedWorkPackageIds: [faWorkPackage],
        allowedActions: ['view', 'edit', 'submit', 'upload', 'print', 'execute'],
        assignedBy: actorUsername
      },
      actorUsername
    );
    setFactoryAssignments(securityService.getFactoryAssignments());
    onRefresh();
    onNotify(`Assigned ${u.fullName} to [${f.name}] as ${faRole}.`);
  };

  const handleRemoveFactoryAssignment = (id: string) => {
    if (!isAdminAuthority) return;
    securityService.removeFactoryAssignment(id, actorUsername);
    setFactoryAssignments(securityService.getFactoryAssignments());
    onRefresh();
    onNotify('Removed factory assignment.');
  };

  const handleCreateOrganization = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdminAuthority || !orgName.trim() || !orgCode.trim()) return;
    const created = securityService.saveExternalOrganization(
      {
        id: `org-custom-${Date.now()}`,
        orgCode: orgCode.trim().toUpperCase(),
        name: orgName.trim(),
        orgType,
        status: 'Active',
        primaryContactName: orgContact.trim() || 'Primary Coordinator',
        primaryContactEmail: orgEmail.trim() || 'contact@partner.com',
        phone: '+971 4 000 0000',
        country: 'UAE / Sri Lanka',
        city: 'Industrial Zone',
        linkedFactoryIds: orgType.includes('FACTORY') || orgType.includes('WORKSHOP') ? [orgFactoryId] : [],
        assignedProjectIds: [orgProjectId],
        assignedWorkPackageIds: ['fwp-02'],
        authorizedPortalIds:
          orgType === 'B2B_CLIENT' || orgType === 'CUSTOMER'
            ? ['customer-portal', 'document-control']
            : orgType === 'SUPPLIER'
            ? ['supplier-portal']
            : ['partner-factory-portal', 'factory-workshop-management'],
        documentVisibilityScope: ['Approved Drawings', 'Worksheets', 'QC Inspections', 'Progress Reports'],
        canApproveVariations: orgType === 'B2B_CLIENT',
        canApproveDrawings: orgType === 'B2B_CLIENT' || orgType === 'CONSULTANT',
        canSubmitProgress: orgType.includes('FACTORY') || orgType === 'SUBCONTRACTOR',
        createdAt: new Date().toISOString()
      },
      actorUsername
    );
    setOrganizations(securityService.getExternalOrganizations());
    setOrgName('');
    setOrgCode('');
    onRefresh();
    onNotify(`Registered external organization [${created.name}] (${created.orgCode}).`);
  };

  const handleToggleRecordUserClearance = (grant: RecordLevelAccessGrant, userId: string) => {
    if (!isAdminAuthority) return;
    const isAuth = grant.authorizedUserIds.includes(userId);
    const nextAuth = isAuth
      ? grant.authorizedUserIds.filter(id => id !== userId)
      : [...grant.authorizedUserIds, userId];
    const nextDenied = grant.deniedUserIds.filter(id => id !== userId);

    securityService.saveRecordAccessGrant(
      {
        ...grant,
        authorizedUserIds: nextAuth,
        deniedUserIds: nextDenied
      },
      actorUsername
    );
    setRecordGrants(securityService.getRecordAccessGrants());
    onRefresh();
    onNotify(`Updated record-level clearance for [${grant.recordTitle}].`);
  };

  if (mode === 'PROJECT_FACTORY_SCOPES') {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 1. PROJECT-BASED ACCESS CONTROL */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <FolderKanban className="w-5 h-5 text-blue-600" />
                Project-Based Access Control (Explicit Project Scoping)
              </h3>
              <p className="text-xs text-slate-500">
                A user can be authorized for Project A but restricted from Project B. Portals and backend queries automatically filter project records by this scope.
              </p>
            </div>

            {isAdminAuthority && (
              <form onSubmit={handleAddProjectAssignment} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="text-xs font-black text-slate-800">Assign User to Project Scope</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <select
                    value={paUserId}
                    onChange={e => setPaUserId(e.target.value)}
                    className="bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-xs font-semibold"
                  >
                    {users.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} ({u.roleName})
                      </option>
                    ))}
                  </select>
                  <select
                    value={paProjectId}
                    onChange={e => setPaProjectId(e.target.value)}
                    className="bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-xs font-semibold"
                  >
                    {AVAILABLE_PROJECTS.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.id} — {p.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={paRole}
                    onChange={e => setPaRole(e.target.value as ProjectRoleType)}
                    className="bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-xs font-semibold"
                  >
                    {[
                      'Project Manager',
                      'Project Engineer',
                      'QS',
                      'Site Supervisor',
                      'QA/QC',
                      'HSE',
                      'Factory Coordinator',
                      'Customer Representative',
                      'External Fabricator',
                      'Viewer'
                    ].map(r => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-4 text-xs">
                    <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                      <input
                        type="checkbox"
                        checked={paMilestones}
                        onChange={e => setPaMilestones(e.target.checked)}
                      />
                      Can Approve Milestones
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                      <input
                        type="checkbox"
                        checked={paFinancials}
                        onChange={e => setPaFinancials(e.target.checked)}
                      />
                      Can View Financials
                    </label>
                  </div>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Assign Project
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {projectAssignments.map(pa => (
                <div
                  key={pa.id}
                  className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-900">{pa.userFullName}</span>
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
                        {pa.projectRole}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-mono text-[10px] font-bold">
                        {pa.projectId}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{pa.projectName}</div>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-500">
                      <span>Milestones: {pa.canApproveMilestones ? 'YES' : 'NO'}</span>
                      <span>Financials: {pa.canViewFinancials ? 'YES' : 'NO'}</span>
                    </div>
                  </div>
                  {isAdminAuthority && (
                    <button
                      type="button"
                      onClick={() => handleRemoveProjectAssignment(pa.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 2. FACTORY / WORKSHOP-BASED ACCESS CONTROL */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Factory className="w-5 h-5 text-emerald-600" />
                Factory & Workshop-Based Access Control
              </h3>
              <p className="text-xs text-slate-500">
                Internal and external factory users only see the plants, work packages, drawings, worksheets, QC inspections, and dispatches explicitly assigned to their factory.
              </p>
            </div>

            {isAdminAuthority && (
              <form onSubmit={handleAddFactoryAssignment} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="text-xs font-black text-slate-800">Assign User to Factory / Workshop Scope</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    value={faUserId}
                    onChange={e => setFaUserId(e.target.value)}
                    className="bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-xs font-semibold"
                  >
                    {users.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} ({u.isExternalUser ? 'External' : 'Internal'})
                      </option>
                    ))}
                  </select>
                  <select
                    value={faFactoryId}
                    onChange={e => setFaFactoryId(e.target.value)}
                    className="bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-xs font-semibold"
                  >
                    {AVAILABLE_FACTORIES.map(f => (
                      <option key={f.id} value={f.id}>
                        {f.id} — {f.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <select
                    value={faRole}
                    onChange={e => setFaRole(e.target.value as any)}
                    className="bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-xs font-semibold"
                  >
                    {[
                      'Factory Manager',
                      'Workshop Manager',
                      'Production Manager',
                      'QA/QC Inspector',
                      'HSE Officer',
                      'Fabricator',
                      'Machine Operator',
                      'Store Officer',
                      'External Coordinator'
                    ].map(r => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={faProjectId}
                    onChange={e => setFaProjectId(e.target.value)}
                    placeholder="Project ID (PRJ-2026-001)"
                    className="bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-xs font-mono"
                  />
                  <input
                    type="text"
                    value={faWorkPackage}
                    onChange={e => setFaWorkPackage(e.target.value)}
                    placeholder="Work Package (fwp-01)"
                    className="bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-xs font-mono"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Assign Plant
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {factoryAssignments.map(fa => (
                <div
                  key={fa.id}
                  className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-900">{fa.userFullName}</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                        {fa.factoryRole}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                          fa.isExternalFactory
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {fa.isExternalFactory ? 'EXTERNAL PLANT' : 'INTERNAL PLANT'}
                      </span>
                    </div>
                    <div className="text-[11px] font-semibold text-slate-700 mt-0.5">{fa.factoryName}</div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                      Factory ID: {fa.factoryId} • Authorized Projects: {fa.assignedProjectIds.join(', ')} • Work Packages:{' '}
                      {fa.assignedWorkPackageIds.join(', ')}
                    </div>
                  </div>
                  {isAdminAuthority && (
                    <button
                      type="button"
                      onClick={() => handleRemoveFactoryAssignment(fa.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 3. RECORD-LEVEL CLASSIFICATION & SENSITIVE ACCESS GRANTS */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <FileLock2 className="w-5 h-5 text-rose-600" />
              Record-Level Sensitive Classification ACLs (Confidential HR, Payroll, Contracts & Security)
            </h3>
            <p className="text-xs text-slate-500">
              Granular record-level authorization overrides for Highly Confidential and Restricted records. Explicit user denies always override role inheritance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recordGrants.map(grant => (
              <div key={grant.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-rose-600">
                      {grant.recordCategory} • {grant.recordId}
                    </span>
                    <h4 className="text-xs font-black text-slate-900 mt-0.5">{grant.recordTitle}</h4>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200 text-[10px] font-black uppercase shrink-0">
                    {grant.classification}
                  </span>
                </div>

                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-500 mb-1.5">
                    Toggle Individual User Record Clearance:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {users.map(u => {
                      const isAuth = grant.authorizedUserIds.includes(u.id);
                      const isDenied = grant.deniedUserIds.includes(u.id);
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => handleToggleRecordUserClearance(grant, u.id)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 border transition-all cursor-pointer ${
                            isDenied
                              ? 'bg-rose-100 border-rose-300 text-rose-800'
                              : isAuth
                              ? 'bg-emerald-100 border-emerald-300 text-emerald-900'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {isAuth ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          ) : isDenied ? (
                            <ShieldAlert className="w-3 h-3 text-rose-600" />
                          ) : (
                            <Lock className="w-3 h-3 text-slate-400" />
                          )}
                          {u.fullName.split(' ')[0]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // MODE === 'ORGANIZATIONS_BRANCHES'
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Multi-Tenant External Organizations */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-purple-600" />
              Organization-Based External Access (Customers, Suppliers, Partner Factories & Consultants)
            </h3>
            <p className="text-xs text-slate-500">
              External entities are modeled as isolated multi-tenant organizations rather than internal employees—receiving access strictly to work packages, projects, and document scopes shared with their organization.
            </p>
          </div>

          {isAdminAuthority && (
            <form onSubmit={handleCreateOrganization} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="text-xs font-black text-slate-800">Register External Partner / Client / Supplier Organization</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  value={orgName}
                  onChange={e => setOrgName(e.target.value)}
                  placeholder="Organization Legal Name"
                  className="bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-xs"
                  required
                />
                <input
                  type="text"
                  value={orgCode}
                  onChange={e => setOrgCode(e.target.value)}
                  placeholder="ORG-EXT-009"
                  className="bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-xs font-mono"
                  required
                />
                <select
                  value={orgType}
                  onChange={e => setOrgType(e.target.value as any)}
                  className="bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-xs font-semibold"
                >
                  <option value="EXTERNAL_FACTORY">External Partner Factory</option>
                  <option value="EXTERNAL_WORKSHOP">External Workshop</option>
                  <option value="B2B_CLIENT">B2B Client Organization</option>
                  <option value="RESIDENT_CLIENT">Resident Client</option>
                  <option value="SUPPLIER">Material Supplier / Vendor</option>
                  <option value="SUBCONTRACTOR">Site Subcontractor</option>
                  <option value="CONSULTANT">Engineering Consultant</option>
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                <input
                  type="text"
                  value={orgContact}
                  onChange={e => setOrgContact(e.target.value)}
                  placeholder="Primary Contact Person"
                  className="bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-xs"
                />
                <input
                  type="email"
                  value={orgEmail}
                  onChange={e => setOrgEmail(e.target.value)}
                  placeholder="contact@organization.com"
                  className="bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-xs"
                />
                <select
                  value={orgProjectId}
                  onChange={e => setOrgProjectId(e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-xs font-mono"
                >
                  {AVAILABLE_PROJECTS.map(p => (
                    <option key={p.id} value={p.id}>
                      Scope: {p.id}
                    </option>
                  ))}
                </select>
                <select
                  value={orgFactoryId}
                  onChange={e => setOrgFactoryId(e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-xs font-mono"
                >
                  {AVAILABLE_FACTORIES.map(f => (
                    <option key={f.id} value={f.id}>
                      Plant: {f.id}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="px-3.5 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Organization
                </button>
              </div>
            </form>
          )}

          <div className="space-y-3">
            {organizations.map(org => (
              <div key={org.id} className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-slate-900">{org.name}</span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-mono text-[10px] font-bold">
                      {org.orgCode}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-black">
                      {org.orgType}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                    {org.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-600">
                  <div>
                    <span className="font-bold text-slate-800">Contact:</span> {org.primaryContactName} ({org.primaryContactEmail})
                  </div>
                  <div>
                    <span className="font-bold text-slate-800">Projects:</span>{' '}
                    <span className="font-mono">{org.assignedProjectIds.join(', ') || 'None'}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-800">Linked Plants:</span>{' '}
                    <span className="font-mono">{org.linkedFactoryIds.join(', ') || 'None'}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] font-bold text-slate-500">Document Visibility:</span>
                  {org.documentVisibilityScope.map(doc => (
                    <span
                      key={doc}
                      className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold"
                    >
                      {doc}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Branch-Based Access Control */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-orange-500" />
              Branch Hierarchy ({branches.length} Hubs)
            </h3>
            <p className="text-xs text-slate-500">
              Branch assignments govern regional customer, store inventory, fabrication yard, and operational record visibility.
            </p>
          </div>

          <div className="space-y-2.5">
            {branches.map(br => (
              <div key={br.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-black text-slate-900">{br.name}</span>
                  <span className="px-2 py-0.5 rounded bg-orange-100 text-orange-800 text-[10px] font-bold">
                    {br.type}
                  </span>
                </div>
                <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                  {br.branchCode} • {br.city}, {br.country}
                </div>
                <div className="mt-2 pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-600">Lead: {br.managerName}</span>
                  <span className="font-bold text-emerald-600">
                    {br.isHeadOffice ? 'Head Office (Global)' : br.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
