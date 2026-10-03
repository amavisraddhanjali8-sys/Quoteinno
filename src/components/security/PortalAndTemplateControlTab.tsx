import React, { useState } from 'react';
import {
  Globe,
  Layers,
  Copy,
  CheckCircle2,
  XCircle,
  Lock,
  Unlock,
  History,
  UserCheck,
  Code2,
  AlertTriangle,
  Plus,
  Building2
} from 'lucide-react';
import {
  PortalRegistryEntry,
  UserTypeDefinition,
  PermissionTemplate,
  SecurityUser,
  CentralPortalId
} from '../../types/security';
import { securityService } from '../../services/securityService';

interface PortalAndTemplateControlTabProps {
  mode: 'PORTALS' | 'TEMPLATES';
  users: SecurityUser[];
  actorUsername: string;
  isAdminAuthority: boolean;
  onRefresh: () => void;
  onNotify: (msg: string) => void;
}

export const PortalAndTemplateControlTab: React.FC<PortalAndTemplateControlTabProps> = ({
  mode,
  users,
  actorUsername,
  isAdminAuthority,
  onRefresh,
  onNotify
}) => {
  const [portals] = useState<PortalRegistryEntry[]>(() => securityService.getPortalRegistry());
  const [userTypes] = useState<UserTypeDefinition[]>(() => securityService.getUserTypes());
  const [templates, setTemplates] = useState<PermissionTemplate[]>(() => securityService.getPermissionTemplates());

  const [selectedPortalId, setSelectedPortalId] = useState<CentralPortalId>('factory-workshop-management');
  const [selectedUserIdForPortal, setSelectedUserIdForPortal] = useState<string>(users[1]?.id || users[0]?.id || '');

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(templates[0]?.id || '');
  const [cloneName, setCloneName] = useState('');
  const [cloneCode, setCloneCode] = useState('');
  const [applyTargetUserId, setApplyTargetUserId] = useState<string>(users[1]?.id || users[0]?.id || '');
  const [changeNoteInput, setChangeNoteInput] = useState('');

  const selectedPortal = portals.find(p => p.portalId === selectedPortalId) || portals[0];
  const selectedTemplate = templates.find(t => t.id === selectedTemplateId) || templates[0];

  const handleToggleUserPortalAccess = (user: SecurityUser, portalId: CentralPortalId) => {
    if (!isAdminAuthority) {
      onNotify('Only authorized Administrators can modify portal access.');
      return;
    }
    const currentlyAllowed = securityService.canAccessPortal(user.id, portalId);
    const currentAuth = new Set<CentralPortalId>(user.authorizedPortalIds || []);
    const currentRevoked = new Set<CentralPortalId>(user.revokedPortalIds || []);

    if (currentlyAllowed) {
      currentAuth.delete(portalId);
      currentRevoked.add(portalId);
    } else {
      currentRevoked.delete(portalId);
      currentAuth.add(portalId);
    }

    securityService.updateUser(
      user.id,
      {
        authorizedPortalIds: Array.from(currentAuth),
        revokedPortalIds: Array.from(currentRevoked)
      },
      actorUsername
    );
    onRefresh();
    onNotify(
      `${currentlyAllowed ? 'Revoked' : 'Granted'} portal [${portalId}] for ${user.fullName}.`
    );
  };

  const handleCloneTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate || !cloneName.trim() || !cloneCode.trim()) return;
    const cloned = securityService.clonePermissionTemplate(
      selectedTemplate.id,
      cloneName.trim(),
      cloneCode.trim(),
      actorUsername
    );
    setTemplates(securityService.getPermissionTemplates());
    setSelectedTemplateId(cloned.id);
    setCloneName('');
    setCloneCode('');
    onRefresh();
    onNotify(`Cloned permission template [${cloned.name}] (v1).`);
  };

  const handleToggleTemplatePortal = (portalId: CentralPortalId) => {
    if (!selectedTemplate || !isAdminAuthority) return;
    const exists = selectedTemplate.authorizedPortalIds.includes(portalId);
    const nextPortals = exists
      ? selectedTemplate.authorizedPortalIds.filter(p => p !== portalId)
      : [...selectedTemplate.authorizedPortalIds, portalId];

    const updated = securityService.updatePermissionTemplate(
      selectedTemplate.id,
      { authorizedPortalIds: nextPortals },
      changeNoteInput.trim() || `${exists ? 'Removed' : 'Added'} portal ${portalId}`,
      actorUsername
    );
    setTemplates(securityService.getPermissionTemplates());
    setSelectedTemplateId(updated.id);
    setChangeNoteInput('');
    onRefresh();
    onNotify(`Updated template [${updated.name}] to v${updated.version}.`);
  };

  const handleApplyTemplate = () => {
    if (!selectedTemplate || !applyTargetUserId || !isAdminAuthority) return;
    const updatedUser = securityService.applyTemplateToUser(
      applyTargetUserId,
      selectedTemplate.id,
      actorUsername
    );
    onRefresh();
    onNotify(`Applied template [${selectedTemplate.name}] to ${updatedUser.fullName}.`);
  };

  if (mode === 'PORTALS') {
    const targetUser = users.find(u => u.id === selectedUserIdForPortal) || users[0];
    return (
      <div className="space-y-6">
        {/* Top Portal Matrix Selector */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Globe className="w-5 h-5 text-orange-500" />
                Central Portal Access Registry ({portals.length} Registered Enterprise Portals)
              </h3>
              <p className="text-xs text-slate-500">
                Every internal, factory, project, customer, and supplier portal is registered centrally with module hierarchy, API endpoints, and independent access toggles.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">Inspect User Portal Access:</span>
              <select
                value={selectedUserIdForPortal}
                onChange={e => setSelectedUserIdForPortal(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
              >
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.fullName} ({u.roleName} — {u.isExternalUser ? 'External' : 'Internal'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {portals.map(p => {
              const isSelected = p.portalId === selectedPortal.portalId;
              const userAllowed = targetUser ? securityService.canAccessPortal(targetUser.id, p.portalId) : false;
              return (
                <div
                  key={p.portalId}
                  onClick={() => setSelectedPortalId(p.portalId)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                      : 'bg-slate-50/70 hover:bg-white border-slate-200 text-slate-900'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                          isSelected ? 'bg-orange-500 text-white' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {p.category}
                      </span>
                      {p.isExternalPortal && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">
                          EXTERNAL
                        </span>
                      )}
                    </div>
                    <div className="font-black text-xs mt-1">{p.portalName}</div>
                    <div className={`text-[10px] font-mono mt-0.5 ${isSelected ? 'text-slate-400' : 'text-slate-500'}`}>
                      ID: {p.portalId}
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-700/20 flex items-center justify-between">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold ${
                        userAllowed ? 'text-emerald-500' : 'text-rose-500'
                      }`}
                    >
                      {userAllowed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      {targetUser?.fullName.split(' ')[0]}: {userAllowed ? 'Authorized' : 'Blocked'}
                    </span>
                    <button
                      type="button"
                      onClick={ev => {
                        ev.stopPropagation();
                        if (targetUser) handleToggleUserPortalAccess(targetUser, p.portalId);
                      }}
                      className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer ${
                        userAllowed
                          ? 'bg-rose-500/15 text-rose-500 hover:bg-rose-500/25'
                          : 'bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25'
                      }`}
                    >
                      {userAllowed ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                      {userAllowed ? 'Revoke' : 'Grant'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Portal Deep Architecture & Dependency Map */}
        {selectedPortal && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-orange-600">
                  Portal Dependency & Authorization Contract
                </span>
                <h4 className="text-lg font-black text-slate-900 mt-0.5">{selectedPortal.portalName}</h4>
                <p className="text-xs text-slate-500 font-mono">
                  portalId: {selectedPortal.portalId} • appViewTarget: {selectedPortal.appViewTarget}
                  {selectedPortal.operationalSubPortal ? ` • operationalSubPortal: ${selectedPortal.operationalSubPortal}` : ''}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {selectedPortal.supportedScopes.map(sc => (
                  <span
                    key={sc}
                    className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold"
                  >
                    Scope: {sc}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Module Hierarchy */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-orange-500" />
                  Module & Feature Hierarchy
                </div>
                {selectedPortal.moduleHierarchy.map(m => (
                  <div key={m.moduleId} className="p-3 rounded-lg bg-white border border-slate-200">
                    <div className="text-xs font-bold text-slate-900">{m.moduleName}</div>
                    <div className="text-[10px] font-mono text-orange-600 mb-1.5">
                      Prefix: {m.permissionPrefix}.*
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {m.features.map(f => (
                        <span key={f} className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium">
                          {f}
                        </span>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {m.availableActions.map(act => (
                        <span
                          key={act}
                          className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold uppercase"
                        >
                          {act}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Protected API Endpoints & Dependent Services */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Code2 className="w-4 h-4 text-blue-600" />
                  Protected API Endpoints & Services
                </div>
                <div className="space-y-1.5">
                  {selectedPortal.apiEndpoints.map(ep => (
                    <div
                      key={ep}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 text-emerald-300 font-mono text-[11px]"
                    >
                      {ep}
                    </div>
                  ))}
                </div>
                <div className="pt-2">
                  <div className="text-[11px] font-bold text-slate-600 mb-1">Dependent Backend Services:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedPortal.dependentServices.map(srv => (
                      <span
                        key={srv}
                        className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 font-mono text-[11px] font-semibold"
                      >
                        {srv}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sensitive Operations, Required Permissions & Audit Events */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Sensitive Operations & Audit Events
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-600 mb-1">High-Risk Operations:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedPortal.sensitiveOperations.map(op => (
                      <span
                        key={op}
                        className="px-2 py-1 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold"
                      >
                        {op}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-600 mb-1">Required Base Permissions:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedPortal.requiredPermissions.map(rp => (
                      <span
                        key={rp}
                        className="px-2 py-0.5 rounded bg-slate-200 text-slate-900 font-mono text-[10px] font-bold"
                      >
                        {rp}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-600 mb-1">Emitted Security Audit Events:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedPortal.auditEvents.map(ae => (
                      <span
                        key={ae}
                        className="px-2 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200 font-mono text-[10px] font-bold"
                      >
                        {ae}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // MODE === 'TEMPLATES' (User Types & Versioned Permission Templates)
  return (
    <div className="space-y-6">
      {/* Structured User Type Catalog */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-orange-500" />
              Structured Enterprise User Type Classification ({userTypes.length} Configurable User Types)
            </h3>
            <p className="text-xs text-slate-500">
              User types are separate from individual roles—providing default access profiles, MFA rules, and internal vs external organization boundaries without bypassing explicit authorization rules.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 max-h-72 overflow-y-auto pr-1">
          {userTypes.map(ut => (
            <div
              key={ut.id}
              className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-xs font-black text-slate-900">{ut.name}</span>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      ut.isExternal
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {ut.isExternal ? 'EXTERNAL' : 'INTERNAL'}
                  </span>
                </div>
                <div className="text-[10px] font-mono text-orange-600 font-bold">{ut.code}</div>
                <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">{ut.description}</p>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-200/80 flex items-center justify-between text-[10px] text-slate-500 font-semibold">
                <span>Scope: {ut.defaultScope}</span>
                <span>{ut.defaultPortalIds.length} Portals</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Permission Templates & Version History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div>
            <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Copy className="w-4 h-4 text-orange-500" />
              Permission Templates ({templates.length})
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Clone standard access packages and customize them without changing the original master template.
            </p>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {templates.map(tpl => {
              const isSelected = tpl.id === selectedTemplate?.id;
              return (
                <div
                  key={tpl.id}
                  onClick={() => setSelectedTemplateId(tpl.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                      : 'bg-slate-50 hover:bg-white border-slate-200 text-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-black">{tpl.name}</span>
                    <div className="flex items-center gap-1">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          tpl.isStandard
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {tpl.isStandard ? 'Standard' : 'Cloned Custom'}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-700 text-white">
                        v{tpl.version}
                      </span>
                    </div>
                  </div>
                  <div className={`text-[11px] mt-1 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                    {tpl.description}
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[10px] font-semibold">
                    <span className="text-orange-400">User Type: {tpl.targetUserType}</span>
                    <span>
                      {tpl.authorizedPortalIds.length} Portals • {tpl.permissionCodes.length} Permissions
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Clone Template Form */}
          {selectedTemplate && isAdminAuthority && (
            <form onSubmit={handleCloneTemplate} className="pt-3 border-t border-slate-200 space-y-2.5">
              <div className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-orange-500" />
                Clone [{selectedTemplate.name}] into Custom Template
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={cloneName}
                  onChange={e => setCloneName(e.target.value)}
                  placeholder="New Template Name"
                  className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  required
                />
                <input
                  type="text"
                  value={cloneCode}
                  onChange={e => setCloneCode(e.target.value)}
                  placeholder="TPL-CUSTOM-01"
                  className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                Clone & Initialize Version 1
              </button>
            </form>
          )}
        </div>

        {/* Selected Template Details, Portal Toggles & Version History */}
        {selectedTemplate && (
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-orange-600">
                  Template Code: {selectedTemplate.code} • Version v{selectedTemplate.version}
                </span>
                <h4 className="text-lg font-black text-slate-900">{selectedTemplate.name}</h4>
                <p className="text-xs text-slate-500">{selectedTemplate.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={applyTargetUserId}
                  onChange={e => setApplyTargetUserId(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold"
                >
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} (@{u.username})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleApplyTemplate}
                  className="px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  Apply Template
                </button>
              </div>
            </div>

            {/* Authorized Portals in Template */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                  Authorized Portals in Package ({selectedTemplate.authorizedPortalIds.length})
                </span>
                <input
                  type="text"
                  value={changeNoteInput}
                  onChange={e => setChangeNoteInput(e.target.value)}
                  placeholder="Optional version change note before toggling..."
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] w-64"
                />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {portals.map(p => {
                  const active = selectedTemplate.authorizedPortalIds.includes(p.portalId);
                  return (
                    <button
                      key={p.portalId}
                      type="button"
                      onClick={() => handleToggleTemplatePortal(p.portalId)}
                      className={`p-2.5 rounded-xl border text-left text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                        active
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                          : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      <span className="truncate">{p.shortName}</span>
                      {active ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Template Version History */}
            <div className="pt-3 border-t border-slate-100">
              <div className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5 mb-2.5">
                <History className="w-4 h-4 text-blue-600" />
                Immutable Template Version History
              </div>
              <div className="space-y-2">
                {selectedTemplate.versionHistory.map(vh => (
                  <div
                    key={vh.version}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-mono font-black text-orange-600 mr-2">v{vh.version}</span>
                      <span className="font-semibold text-slate-800">{vh.changeNotes}</span>
                      <span className="text-slate-400 ml-2">by {vh.updatedBy}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {vh.permissionCount} perms • {new Date(vh.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
