import React, { useState, useMemo } from 'react';
import {
  Factory,
  UserCheck,
  ChevronDown,
  ChevronUp,
  Folder
} from 'lucide-react';
import { useSecurity } from '../../../context/SecurityContext';
import { factoryExecutionService } from '../../../services/factoryExecutionService';
import { FactoryErpAndSupervisorsTab, FactoryErpSubPortalMode } from '../../factory/FactoryErpAndSupervisorsTab';
import { FactoryQuotationDocumentModal, FactoryRecordDocumentSpec } from '../../factory/FactoryQuotationDocumentModal';
import { SecurityUser } from '../../../types/security';

interface RoleScopedFactoryProjectHubProps {
  portalName: string;
  defaultSubTab: 'supervisors' | 'procurement' | 'hr_payroll' | 'finance_contracts';
  ownedFactoriesOnly?: boolean;
}

export const RoleScopedFactoryProjectHub: React.FC<RoleScopedFactoryProjectHubProps> = ({
  portalName,
  defaultSubTab,
  ownedFactoriesOnly = false
}) => {
  const { currentUser, users, switchUser } = useSecurity();
  const [refreshTick, setRefreshTick] = useState(0);
  const [isExpanded, setIsExpanded] = useState(true);
  const [docModalSpec, setDocModalSpec] = useState<FactoryRecordDocumentSpec | null>(null);

  const allFactories = useMemo(() => {
    const list = factoryExecutionService.getFactories();
    return ownedFactoriesOnly ? list.filter(f => f.ownershipType === 'Innovista Owned') : list;
  }, [ownedFactoriesOnly, refreshTick]);

  const userAssignments = useMemo(
    () => factoryExecutionService.getUserFactorySupervisingAssignments(currentUser),
    [currentUser, refreshTick]
  );

  // Determine accessible factories for this user
  const accessibleFactories = useMemo(() => {
    const isGlobalOrExec =
      currentUser.adminAuthorityLevel === 'SUPER_ADMINISTRATOR' ||
      currentUser.adminAuthorityLevel === 'SYSTEM_ADMINISTRATOR' ||
      factoryExecutionService.isFactoryManagerAccount(currentUser);
    if (isGlobalOrExec || userAssignments.length === 0) {
      return allFactories;
    }
    const assignedFactoryIds = new Set(userAssignments.map(a => a.factoryId));
    const filtered = allFactories.filter(f => assignedFactoryIds.has(f.id));
    return filtered.length > 0 ? filtered : allFactories;
  }, [allFactories, currentUser, userAssignments]);

  const [selectedFactoryId, setSelectedFactoryId] = useState<string>(
    accessibleFactories[0]?.id || 'fac-01'
  );

  // Projects linked to this factory
  const factoryProjects = useMemo(() => {
    const wps = factoryExecutionService.getWorkPackages(selectedFactoryId);
    const sups = factoryExecutionService.getSupervisorAssignments(selectedFactoryId);
    const procs = factoryExecutionService.getProcurementRecords(selectedFactoryId);
    const fins = factoryExecutionService.getFinanceRecords(selectedFactoryId);

    const map = new Map<string, { id: string; projectCode: string; projectName: string }>();
    wps.forEach(w => {
      if (w.projectId) map.set(w.projectId, { id: w.projectId, projectCode: w.projectCode || w.projectId, projectName: w.projectName });
    });
    sups.forEach((s: any) => {
      if (s.projectId) map.set(s.projectId, { id: s.projectId, projectCode: s.projectId, projectName: s.projectName });
    });
    procs.forEach((p: any) => {
      if (p.projectId) map.set(p.projectId, { id: p.projectId, projectCode: p.docCode || p.projectId, projectName: p.projectName });
    });
    fins.forEach((f: any) => {
      if (f.projectId) map.set(f.projectId, { id: f.projectId, projectCode: f.recordCode || f.projectId, projectName: f.projectName });
    });

    if (map.size === 0) {
      map.set('proj-altair-01', { id: 'proj-altair-01', projectCode: 'PRJ-2026-001', projectName: 'Altair Tower Skybridge Glazing' });
      map.set('proj-portcity-02', { id: 'proj-portcity-02', projectCode: 'PRJ-2026-002', projectName: 'Port City Marina Acoustic Façade' });
    }
    return Array.from(map.values());
  }, [selectedFactoryId, refreshTick]);

  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');

  const selectedFactory = useMemo(
    () => accessibleFactories.find(f => f.id === selectedFactoryId) || accessibleFactories[0],
    [accessibleFactories, selectedFactoryId]
  );

  const hasFactoryMgrAuth = useMemo(
    () =>
      factoryExecutionService.isFactoryManagerAccount(
        currentUser,
        selectedFactory?.id,
        selectedProjectId === 'ALL' ? undefined : selectedProjectId
      ),
    [currentUser, selectedFactory, selectedProjectId, refreshTick]
  );

  const erpMode: FactoryErpSubPortalMode = useMemo(() => {
    switch (defaultSubTab) {
      case 'supervisors':
        return 'erp_supervisors';
      case 'procurement':
        return 'erp_procurement';
      case 'hr_payroll':
        return 'erp_hr_payroll';
      case 'finance_contracts':
      default:
        return 'erp_finance_contracts';
    }
  }, [defaultSubTab]);

  const workPackages = useMemo(
    () => factoryExecutionService.getWorkPackages(selectedFactory?.id),
    [selectedFactory, refreshTick]
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Top Role Authority & Scope Ribbon */}
      <div className="px-5 py-3.5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-400/40 flex items-center justify-center text-orange-300 shrink-0">
            <Factory size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-white">
                {portalName} — Factory & Project Scoped Operations
              </h3>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                hasFactoryMgrAuth
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                  : 'bg-amber-500/20 text-amber-300 border-amber-400/40'
              }`}>
                {hasFactoryMgrAuth
                  ? 'Individual Factory Manager Authority Active'
                  : 'Standard Role Access'}
              </span>
              {userAssignments.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-200 border border-indigo-400/40">
                  {userAssignments.length} Assigned Project/Factory Supervising Scope(s)
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Active Account: <strong className="text-white">{currentUser.fullName}</strong> ({currentUser.roleName || currentUser.userType || 'User'}) • Only Factory-related and Project-related records in your scope are displayed and manageable below.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Role Account Switcher to test Engineer / QC Inspector / Factory Manager / Finance / HR permissions */}
          {users && users.length > 0 && (
            <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1">
              <UserCheck size={12} className="text-orange-400 shrink-0" />
              <span className="text-[10px] font-bold uppercase text-slate-400">Role Account:</span>
              <select
                value={currentUser.id}
                onChange={e => switchUser(e.target.value)}
                className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer max-w-[190px] truncate"
                title="Switch Role-Based Account to test Factory & Project permissions"
              >
                {users.map((u: SecurityUser) => (
                  <option key={u.id} value={u.id} className="text-slate-900">
                    {u.fullName} — {u.roleName || u.userType}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Factory Scope Selector */}
          <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1">
            <Factory size={12} className="text-emerald-400 shrink-0" />
            <select
              value={selectedFactory?.id || ''}
              onChange={e => setSelectedFactoryId(e.target.value)}
              className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer max-w-[210px] truncate"
            >
              {accessibleFactories.map(f => (
                <option key={f.id} value={f.id} className="text-slate-900">
                  {f.code} — {f.name} ({f.ownershipType})
                </option>
              ))}
            </select>
          </div>

          {/* Project Scope Selector */}
          <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1">
            <Folder size={12} className="text-orange-400 shrink-0" />
            <select
              value={selectedProjectId}
              onChange={e => setSelectedProjectId(e.target.value)}
              className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer max-w-[190px] truncate"
            >
              <option value="ALL" className="text-slate-900">All Factory Projects ({factoryProjects.length})</option>
              {factoryProjects.map(p => (
                <option key={p.id} value={p.id} className="text-slate-900">
                  {p.projectCode} — {p.projectName}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 border border-slate-700"
          >
            {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            <span>{isExpanded ? 'Collapse' : 'Expand Factory Hub'}</span>
          </button>
        </div>
      </div>

      {/* Main Scoped Factory & Project ERP Body */}
      {isExpanded && selectedFactory && (
        <div className="p-4 sm:p-5 bg-slate-50/50">
          <FactoryErpAndSupervisorsTab
            mode={erpMode}
            currentUser={currentUser}
            factories={allFactories}
            workPackages={workPackages}
            selectedFactoryId={selectedFactory.id}
            selectedProjectId={selectedProjectId === 'ALL' ? undefined : selectedProjectId}
            onRefresh={() => setRefreshTick(t => t + 1)}
          />
        </div>
      )}

      {docModalSpec && (
        <FactoryQuotationDocumentModal
          spec={docModalSpec}
          currentUser={currentUser}
          canAuthorize={hasFactoryMgrAuth}
          onClose={() => setDocModalSpec(null)}
          onRefresh={() => setRefreshTick(t => t + 1)}
        />
      )}
    </div>
  );
};
