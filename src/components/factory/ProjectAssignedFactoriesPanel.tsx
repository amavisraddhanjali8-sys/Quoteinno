import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Factory,
  UserCheck,
  ShoppingCart,
  Users,
  Landmark,
  Plus,
  Activity,
  X
} from 'lucide-react';
import { factoryExecutionService } from '../../services/factoryExecutionService';
import { FactoryErpAndSupervisorsTab } from './FactoryErpAndSupervisorsTab';
import { FactoryQuotationDocumentModal, FactoryRecordDocumentSpec } from './FactoryQuotationDocumentModal';
import { useSecurity } from '../../context/SecurityContext';
import { toast } from 'sonner';

interface ProjectAssignedFactoriesPanelProps {
  project: {
    id: string;
    projectName?: string;
    name?: string;
    projectCode?: string;
    clientName?: string;
    [key: string]: any;
  };
  onRefreshProject?: () => void;
}

export const ProjectAssignedFactoriesPanel: React.FC<ProjectAssignedFactoriesPanelProps> = ({
  project,
  onRefreshProject
}) => {
  const { currentUser } = useSecurity();
  const [refreshTick, setRefreshTick] = useState(0);
  const [selectedFactoryForErpModal, setSelectedFactoryForErpModal] = useState<{
    factoryId: string;
    initialSubTab: 'supervisors' | 'procurement' | 'hr_payroll' | 'finance_contracts';
  } | null>(null);
  const [isAssignFactoryOpen, setIsAssignFactoryOpen] = useState(false);
  const [assignFactoryForm, setAssignFactoryForm] = useState({
    factoryId: 'fac-01',
    workPackageTitle: '',
    scopeSummary: '',
    supervisorUserId: 'usr-eng-01',
    supervisorRole: 'Project / Site Engineer' as const,
    grantFactoryManagerAuthority: true
  });
  const [docModalSpec, setDocModalSpec] = useState<FactoryRecordDocumentSpec | null>(null);

  const triggerRefresh = () => {
    setRefreshTick(t => t + 1);
    onRefreshProject?.();
  };

  const allFactories = useMemo(
    () => factoryExecutionService.getFactories(),
    [refreshTick]
  );

  const consolidated = useMemo(
    () => factoryExecutionService.getProjectFactoryConsolidatedSummary(project.id),
    [project.id, refreshTick]
  );

  const availableUsers = useMemo(
    () => factoryExecutionService.getAssignableSupervisingUsers(),
    []
  );

  const handleAssignFactoryToProject = (e: React.FormEvent) => {
    e.preventDefault();
    const fac = allFactories.find(f => f.id === assignFactoryForm.factoryId);
    if (!fac) return;

    const pkgTitle = assignFactoryForm.workPackageTitle.trim() || `${project.projectName} — ${fac.name} Fabrication & Execution Package`;
    const wpCode = `WP-${project.projectCode || project.id.slice(0, 6).toUpperCase()}-${Math.floor(100 + Math.random() * 899)}`;

    // 1. Create Work Package linking Factory to Project
    factoryExecutionService.saveWorkPackage({
      id: `wp-${Date.now()}`,
      packageCode: wpCode,
      title: pkgTitle,
      projectId: project.id,
      projectCode: project.projectCode || project.id,
      projectName: project.projectName,
      clientName: project.client?.name || 'Corporate Client',
      factoryId: fac.id,
      factoryName: fac.name,
      allocationType: fac.ownershipType === 'Innovista Owned' ? 'Internal Factory' : 'External Partner',
      status: 'In Production',
      priority: 'High',
      startDate: project.startDate || new Date().toISOString().split('T')[0],
      targetDispatchDate: project.endDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      progressPercent: 15,
      supervisorId: assignFactoryForm.supervisorUserId,
      supervisorName: availableUsers.find(u => u.id === assignFactoryForm.supervisorUserId)?.name || 'Assigned Engineer',
      totalEstimatedHours: 240,
      loggedHours: 0,
      boqReference: `BOQ-${project.projectCode || project.id}`,
      drawingRevision: 'Rev A',
      specialInstructions: assignFactoryForm.scopeSummary || `Assigned ${fac.name} (${fac.ownershipType}) to execute project ${project.projectName}.`,
      createdAt: new Date().toISOString()
    });

    // 2. Assign Selected Engineer / QC Inspector / Supervisor for this Factory + Project
    const targetUser = availableUsers.find(u => u.id === assignFactoryForm.supervisorUserId);
    if (targetUser) {
      factoryExecutionService.saveSupervisorAssignment(currentUser, {
        factoryId: fac.id,
        factoryName: fac.name,
        ownershipType: fac.ownershipType,
        projectId: project.id,
        projectName: project.projectName,
        userId: targetUser.id,
        employeeId: (targetUser as any).employeeId || `EMP-${Math.floor(100 + Math.random() * 899)}`,
        username: (targetUser as any).username || targetUser.name.toLowerCase().replace(/\s+/g, '.'),
        userName: targetUser.name,
        fullName: targetUser.name,
        email: targetUser.email || '',
        phone: (targetUser as any).phone || '',
        roleName: targetUser.role || 'Project Engineer',
        department: (targetUser as any).department || 'PRODUCTION',
        supervisingRole: assignFactoryForm.supervisorRole,
        hasFactoryManagerAuthority: assignFactoryForm.grantFactoryManagerAuthority,
        permissions: {
          canManageTasksAndChecklists: true,
          canManageWorkPackagesAndTasks: true,
          canManageQualityAndNcr: true,
          canManageProcurement: true,
          canManageHrAndPayroll: fac.ownershipType === 'Innovista Owned',
          canManageFinanceAndInvoices: true,
          canManageContractsAndAgreements: true
        },
        assignedBy: currentUser?.fullName || 'Project Manager',
        assignedAt: new Date().toISOString().split('T')[0],
        status: 'Active'
      });
    }

    toast.success(`Factory "${fac.name}" assigned to Project "${project.projectName}" with live tracking & supervisor authority.`);
    setIsAssignFactoryOpen(false);
    setAssignFactoryForm({
      ...assignFactoryForm,
      workPackageTitle: '',
      scopeSummary: ''
    });
    triggerRefresh();
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-orange-500 text-white flex items-center justify-center shadow-2xs">
              <Factory size={15} />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              Assigned Factories & Project Execution ERP Hub
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200">
              {consolidated.assignedFactories.length} Assigned {consolidated.assignedFactories.length === 1 ? 'Factory' : 'Factories'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            All factory updates (Work Packages, Tasks, QC Checklists, Supervising Engineers/QC Inspectors, Procurement RQ/Quotation/PO/GRN/QC/NCR/Return, HR Payroll for Owned Factories, and Invoices/Contracts/Accounting) are recorded & synced with <strong className="text-slate-700">{project.projectCode || project.id}</strong>.
          </p>
        </div>

        <button
          onClick={() => setIsAssignFactoryOpen(true)}
          className="px-3.5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors shrink-0"
        >
          <Plus size={14} />
          <span>Assign Factory / Supervisor to Project</span>
        </button>
      </div>

      {/* Project-Level Factory KPI Rollup */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Work Packages / Tasks</span>
          <span className="text-sm font-black text-slate-900 mt-0.5 block">
            {consolidated.workPackages.length} WP • {consolidated.completedTasksCount}/{consolidated.tasks.length} Tasks
          </span>
          <span className="text-[10px] text-emerald-600 font-semibold">{consolidated.overallFactoryProgress}% Avg Progress</span>
        </div>

        <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-200/70">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block">Supervising Team</span>
          <span className="text-sm font-black text-indigo-950 mt-0.5 block">
            {consolidated.supervisors.length} Assigned
          </span>
          <span className="text-[10px] text-indigo-700 font-semibold">
            {consolidated.supervisors.filter(s => s.hasFactoryManagerAuthority).length} with Factory Mgr Authority
          </span>
        </div>

        <div className="p-3 rounded-xl bg-orange-50/50 border border-orange-200/70">
          <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 block">Procurement Chain</span>
          <span className="text-sm font-black text-orange-950 mt-0.5 block">
            {consolidated.procurementRecords.length} Docs
          </span>
          <span className="text-[10px] text-orange-700 font-semibold font-mono">
            LKR {consolidated.totalProcurementPoValue.toLocaleString()}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200/70">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">Owned Factory Payroll</span>
          <span className="text-sm font-black text-emerald-950 mt-0.5 block font-mono">
            LKR {consolidated.totalPayrollCost.toLocaleString()}
          </span>
          <span className="text-[10px] text-emerald-700 font-semibold">
            {consolidated.hrPayrollRecords.length} Direct HR/Payroll Runs
          </span>
        </div>

        <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-200/70">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block">Factory Invoices</span>
          <span className="text-sm font-black text-blue-950 mt-0.5 block font-mono">
            LKR {consolidated.totalInvoicedAmount.toLocaleString()}
          </span>
          <span className="text-[10px] text-blue-700 font-semibold">
            {consolidated.financeRecords.filter(f => f.recordCategory === 'INVOICE').length} Project Invoices
          </span>
        </div>

        <div className="p-3 rounded-xl bg-purple-50/50 border border-purple-200/70">
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 block">Contracts & Agreements</span>
          <span className="text-sm font-black text-purple-950 mt-0.5 block font-mono">
            LKR {consolidated.totalContractValue.toLocaleString()}
          </span>
          <span className="text-[10px] text-purple-700 font-semibold">
            {consolidated.financeRecords.filter(f => f.recordCategory === 'CONTRACT_AGREEMENT').length} Active Agreements
          </span>
        </div>
      </div>

      {/* Per-Factory Cards */}
      {consolidated.assignedFactories.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/40">
          <Factory size={28} className="mx-auto text-slate-300 mb-2" />
          <p className="text-xs font-bold text-slate-700">No Factories Assigned to This Project Yet</p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Click "Assign Factory / Supervisor to Project" above to allocate an Owned Factory or Outsourced Partner Factory and manage its full ERP & QC lifecycle.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {consolidated.assignedFactories.map(fac => {
            const isOwned = fac.ownershipType === 'Innovista Owned';
            const facWps = consolidated.workPackages.filter(w => w.factoryId === fac.id);
            const facTasks = consolidated.tasks.filter(t => t.factoryId === fac.id);
            const facSupervisors = consolidated.supervisors.filter(s => s.factoryId === fac.id);
            const facProc = consolidated.procurementRecords.filter(p => p.factoryId === fac.id);
            const facHr = consolidated.hrPayrollRecords.filter(h => h.factoryId === fac.id);
            const facFin = consolidated.financeRecords.filter(f => f.factoryId === fac.id);
            const facLogs = consolidated.recentFactoryAuditLogs.filter(l => l.factoryId === fac.id).slice(0, 3);

            return (
              <div
                key={fac.id}
                className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/40 hover:bg-white transition-all space-y-3"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-2.5 border-b border-slate-200/60">
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                      isOwned ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white'
                    }`}>
                      {fac.code.split('-').pop()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-black text-slate-900">{fac.name}</h4>
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200/70 text-slate-800">
                          {fac.code}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          isOwned
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-indigo-50 text-indigo-800 border-indigo-300'
                        }`}>
                          {isOwned ? 'OWNED FACTORY • Direct System Management (Procurement, HR, Finance)' : `${fac.ownershipType.toUpperCase()} • Contracts, Invoices, Accounting & Procurement Chain`}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Location: <strong className="text-slate-700">{fac.city}</strong> • Factory Lead: <strong className="text-slate-700">{fac.managerName}</strong> • Project Scope: <strong className="text-orange-700">{project.projectCode} ({project.projectName})</strong>
                      </p>
                    </div>
                  </div>

                  {/* Quick Portal Launchers for this Factory + Project */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={() => setSelectedFactoryForErpModal({ factoryId: fac.id, initialSubTab: 'supervisors' })}
                      className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[11px] font-bold flex items-center gap-1 transition-colors"
                    >
                      <UserCheck size={12} />
                      <span>Supervisors ({facSupervisors.length})</span>
                    </button>
                    <button
                      onClick={() => setSelectedFactoryForErpModal({ factoryId: fac.id, initialSubTab: 'procurement' })}
                      className="px-2.5 py-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 text-[11px] font-bold flex items-center gap-1 transition-colors"
                    >
                      <ShoppingCart size={12} />
                      <span>Procurement (RQ/PO/GRN/QC/NCR/Ret: {facProc.length})</span>
                    </button>
                    {isOwned && (
                      <button
                        onClick={() => setSelectedFactoryForErpModal({ factoryId: fac.id, initialSubTab: 'hr_payroll' })}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[11px] font-bold flex items-center gap-1 transition-colors"
                      >
                        <Users size={12} />
                        <span>HR & Payroll ({facHr.length})</span>
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedFactoryForErpModal({ factoryId: fac.id, initialSubTab: 'finance_contracts' })}
                      className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[11px] font-bold flex items-center gap-1 transition-colors"
                    >
                      <Landmark size={12} />
                      <span>Invoices, Contracts & Accounting ({facFin.length})</span>
                    </button>
                  </div>
                </div>

                {/* Summary Grid for this Factory on this Project */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                  {/* Col 1: Assigned Supervisors */}
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200/70 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Assigned Supervising Team</span>
                      <span className="text-[10px] font-bold text-indigo-600">{facSupervisors.length} Staff</span>
                    </div>
                    {facSupervisors.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic">No supervisors assigned yet</p>
                    ) : (
                      <div className="space-y-1">
                        {facSupervisors.map(sup => (
                          <div key={sup.id} className="flex items-center justify-between text-[11px] bg-slate-50 px-2 py-1 rounded border border-slate-100">
                            <div className="truncate pr-1">
                              <span className="font-bold text-slate-800">{sup.userName}</span>
                              <span className="text-[10px] text-slate-500 block">{sup.supervisingRole}</span>
                            </div>
                            {sup.hasFactoryManagerAuthority && (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold shrink-0" title="Has full individual Factory Manager authority for this Factory & Project">
                                FM Auth
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Col 2: Work Packages & Production */}
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200/70 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Production & QC Status</span>
                      <span className="text-[10px] font-bold text-orange-600">{facWps.length} Work Pkgs</span>
                    </div>
                    {facWps.slice(0, 2).map(wp => (
                      <div key={wp.id} className="text-[11px] bg-slate-50 px-2 py-1 rounded border border-slate-100">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-slate-800">{wp.packageCode}</span>
                          <span className="text-[10px] font-bold text-emerald-700">{wp.progressPercent}%</span>
                        </div>
                        <p className="text-[10px] text-slate-500 truncate">{wp.title}</p>
                      </div>
                    ))}
                    <div className="text-[10px] text-slate-500 flex items-center justify-between pt-0.5">
                      <span>Tasks: {facTasks.filter(t => t.status === 'Completed').length}/{facTasks.length} Done</span>
                      <span>QC Inspections: {consolidated.qualityInspections.filter(q => q.factoryId === fac.id).length}</span>
                    </div>
                  </div>

                  {/* Col 3: Procurement Chain (RQ -> Quotation -> PO -> GRN -> QC -> NCR -> Return) */}
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200/70 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Procurement Chain</span>
                      <span className="text-[10px] font-bold text-orange-600">{facProc.length} Records</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {(['RQ', 'QUOTATION', 'PO', 'GRN', 'QC_INSPECTION', 'NCR_REPORT', 'RETURN_NOTE'] as const).map(st => {
                        const count = facProc.filter(r => r.stage === st).length;
                        return (
                          <span
                            key={st}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border ${
                              count > 0
                                ? st === 'NCR_REPORT' || st === 'RETURN_NOTE'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : 'bg-orange-50 text-orange-800 border-orange-200'
                                : 'bg-slate-50 text-slate-400 border-slate-200'
                            }`}
                          >
                            {st.replace('_REPORT', '').replace('_INSPECTION', '').replace('_NOTE', '')}: {count}
                          </span>
                        );
                      })}
                    </div>
                    {facProc.slice(0, 2).map(pr => (
                      <div key={pr.id} className="text-[10px] text-slate-600 truncate bg-slate-50 px-2 py-0.5 rounded">
                        <strong className="font-mono text-slate-800">{pr.recordNo}</strong> • {pr.title}
                      </div>
                    ))}
                  </div>

                  {/* Col 4: Finance, Invoices, Contracts & Owned HR Payroll */}
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200/70 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-slate-400">
                        {isOwned ? 'HR Payroll, Invoices & Ledger' : 'Contracts, Invoices & Ledger'}
                      </span>
                      <span className="text-[10px] font-bold text-blue-600">{facFin.length + facHr.length} Docs</span>
                    </div>
                    {isOwned && (
                      <div className="text-[11px] bg-emerald-50/70 border border-emerald-200/70 px-2 py-1 rounded flex items-center justify-between">
                        <span className="text-emerald-800 font-semibold">Direct HR Payroll:</span>
                        <span className="font-mono font-bold text-emerald-900">
                          LKR {facHr.reduce((s, h) => s + h.netPayableLkr, 0).toLocaleString()}
                        </span>
                      </div>
                    )}
                    <div className="text-[11px] bg-blue-50/70 border border-blue-200/70 px-2 py-1 rounded flex items-center justify-between">
                      <span className="text-blue-800 font-semibold">Invoices ({facFin.filter(f => f.recordCategory === 'INVOICE').length}):</span>
                      <span className="font-mono font-bold text-blue-900">
                        LKR {facFin.filter(f => f.recordCategory === 'INVOICE').reduce((s, f) => s + f.totalAmountLkr, 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-[11px] bg-purple-50/70 border border-purple-200/70 px-2 py-1 rounded flex items-center justify-between">
                      <span className="text-purple-800 font-semibold">Contracts ({facFin.filter(f => f.recordCategory === 'CONTRACT_AGREEMENT').length}):</span>
                      <span className="font-mono font-bold text-purple-900">
                        LKR {facFin.filter(f => f.recordCategory === 'CONTRACT_AGREEMENT').reduce((s, f) => s + f.totalAmountLkr, 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Recent Factory Updates Recorded for this Project */}
                {facLogs.length > 0 && (
                  <div className="pt-2 border-t border-slate-200/60 flex items-center gap-2 overflow-x-auto text-[11px]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0 flex items-center gap-1">
                      <Activity size={11} className="text-orange-500" />
                      Latest Recorded Factory Updates:
                    </span>
                    {facLogs.map(log => (
                      <span
                        key={log.id}
                        className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 whitespace-nowrap"
                      >
                        <strong className="text-slate-800">{log.actionType}</strong>: {log.recordCode} — {log.summary} ({log.actorName})
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal to Assign a Factory + Supervisor to this Project */}
      {isAssignFactoryOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Factory size={16} className="text-orange-400" />
                <h3 className="text-sm font-bold">Assign Factory & Supervising Lead to Project</h3>
              </div>
              <button onClick={() => setIsAssignFactoryOpen(false)} className="text-slate-400 hover:text-white">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleAssignFactoryToProject} className="p-5 space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-orange-50 border border-orange-200 text-orange-900">
                Project: <strong>{project.projectCode || project.id} — {project.projectName}</strong>
                <p className="text-[11px] text-orange-700 mt-0.5">
                  Assigning a factory links all factory production, QC inspections, procurement chain (RQ/PO/GRN/NCR/Return), HR payroll (for Owned Factories), and contracts/invoices to this project.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Factory (Owned or Partner/Subcontractor) *</label>
                <select
                  value={assignFactoryForm.factoryId}
                  onChange={e => setAssignFactoryForm({ ...assignFactoryForm, factoryId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-semibold text-slate-800"
                >
                  {allFactories.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.code} — {f.name} ({f.ownershipType})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Work Package Title *</label>
                <input
                  type="text"
                  required
                  value={assignFactoryForm.workPackageTitle}
                  onChange={e => setAssignFactoryForm({ ...assignFactoryForm, workPackageTitle: e.target.value })}
                  placeholder={`e.g., ${project.projectName} — Curtain Wall & Glazing Fabrication`}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assign Supervising Engineer / QC</label>
                  <select
                    value={assignFactoryForm.supervisorUserId}
                    onChange={e => setAssignFactoryForm({ ...assignFactoryForm, supervisorUserId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                  >
                    {availableUsers.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Supervising Role</label>
                  <select
                    value={assignFactoryForm.supervisorRole}
                    onChange={e => setAssignFactoryForm({ ...assignFactoryForm, supervisorRole: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="Project / Site Engineer">Project / Site Engineer</option>
                    <option value="QC Inspector">QC Inspector</option>
                    <option value="Factory Manager">Factory Manager</option>
                    <option value="Production Supervisor">Production Supervisor</option>
                    <option value="Procurement Officer">Procurement Officer</option>
                    <option value="Finance & Accounts Officer">Finance & Accounts Officer</option>
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={assignFactoryForm.grantFactoryManagerAuthority}
                  onChange={e => setAssignFactoryForm({ ...assignFactoryForm, grantFactoryManagerAuthority: e.target.checked })}
                  className="rounded text-emerald-600"
                />
                <span className="text-[11px] font-bold text-emerald-900">
                  Grant Individual Factory Manager Authority for this Factory & Project
                </span>
              </label>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Execution & Technical Instructions</label>
                <textarea
                  rows={2}
                  value={assignFactoryForm.scopeSummary}
                  onChange={e => setAssignFactoryForm({ ...assignFactoryForm, scopeSummary: e.target.value })}
                  placeholder="Specify fabrication drawings, QC hold points, delivery batch milestones..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAssignFactoryOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-xs"
                >
                  Assign Factory & Record in Project
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Scoped Factory ERP Modal (Opens the exact Factory + Project context directly from Project Portal) */}
      {selectedFactoryForErpModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9998] bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-slate-50 rounded-2xl border border-slate-200 shadow-2xl w-full max-w-7xl max-h-[92vh] flex flex-col overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <Factory size={18} className="text-orange-400" />
                <div>
                  <h3 className="text-sm font-bold">
                    Scoped Factory & Project Portal — {allFactories.find(f => f.id === selectedFactoryForErpModal.factoryId)?.name}
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Strictly Scoped to Project: <strong className="text-orange-300">{project.projectCode || project.id} ({project.projectName})</strong> • All changes immediately sync with Project Dossier
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedFactoryForErpModal(null);
                  triggerRefresh();
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1"
              >
                <X size={14} />
                <span>Close & Sync to Project</span>
              </button>
            </div>
            <div className="p-4 sm:p-5 overflow-y-auto flex-1">
              <FactoryErpAndSupervisorsTab
                selectedFactoryId={selectedFactoryForErpModal.factoryId}
                selectedProjectId={project.id}
                projects={[project]}
                initialSubTab={selectedFactoryForErpModal.initialSubTab}
                onOpenDocModal={(spec: any) => setDocModalSpec(spec)}
                onRefreshParent={triggerRefresh}
              />
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Printable Document Modal */}
      {docModalSpec && (
        <FactoryQuotationDocumentModal
          isOpen={!!docModalSpec}
          onClose={() => setDocModalSpec(null)}
          spec={docModalSpec}
        />
      )}
    </div>
  );
};
