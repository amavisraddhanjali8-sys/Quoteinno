import React, { useState, useMemo } from 'react';
import {
  Users,
  Wrench,
  Package,
  Download,
  Sliders,
  Plus,
  Layers,
  Eye,
  Printer,
  Trash2
} from 'lucide-react';
import { FactoryQuotationDocumentModal, FactoryRecordDocumentSpec } from './FactoryQuotationDocumentModal';
import {
  buildResourceAllocationDocSpec,
  buildGenericResourceDocSpec
} from './factoryDocumentBuilders';
import {
  FactoryMasterProfile,
  FactoryExecutionTask,
  FactoryWorkPackageAssignment,
  ProjectResourceCategory,
  ResourceGovernanceOwner,
  ProjectResourceAllocationRecord
} from '../../types/factoryPortal';
import { SecurityUser } from '../../types/security';
import { factoryExecutionService } from '../../services/factoryExecutionService';
import { hrService } from '../../services/hrService';
import { equipmentControlService } from '../../services/equipmentControlService';
import { procurementService } from '../../services/procurementService';
import { toast } from 'sonner';

interface ResourcesAndMaterialsTabProps {
  currentUser?: SecurityUser | null;
  factories: FactoryMasterProfile[];
  workPackages?: FactoryWorkPackageAssignment[];
  tasks: FactoryExecutionTask[];
  onRefresh?: () => void;
}

const GOVERNANCE_OPTIONS: ResourceGovernanceOwner[] = [
  'Innovista Managed',
  'Factory Self-Managed',
  'Under Turnkey Contract',
  'Customer / Project Supplied',
  'Supplier / Partner Provided'
];

const RESOURCE_CATEGORIES: ProjectResourceCategory[] = [
  'Workforce / People',
  'Raw Materials & Profiles',
  'Components & Hardware',
  'Machinery & Equipment',
  'Tools & Consumables',
  'Overheads & Utilities',
  'Vehicles & Logistics',
  'Subcontracted Services'
];

export const ResourcesAndMaterialsTab: React.FC<ResourcesAndMaterialsTabProps> = ({
  currentUser = null,
  factories,
  workPackages = [],
  tasks,
  onRefresh
}) => {
  const [subView, setSubView] = useState<'allocations' | 'workforce' | 'machinery' | 'materials'>('allocations');
  const [localTick, setLocalTick] = useState(0);

  const activeWp = workPackages[0] || factoryExecutionService.getWorkPackages()[0];
  const activeFac = factories[0] || factoryExecutionService.getFactories()[0];

  const governance = useMemo(
    () =>
      (activeWp && factoryExecutionService.getProjectResourceGovernance(activeWp.id)) || {
        workPackageId: activeWp?.id || 'fwp-01',
        projectId: activeWp?.projectId || 'PRJ-2026-001',
        factoryId: activeFac?.id || 'fac-inv-01',
        workforceGovernance: 'Factory Self-Managed' as ResourceGovernanceOwner,
        materialsGovernance: 'Innovista Managed' as ResourceGovernanceOwner,
        machineryGovernance: 'Factory Self-Managed' as ResourceGovernanceOwner,
        overheadsGovernance: 'Under Turnkey Contract' as ResourceGovernanceOwner,
        utilitiesAndToolsGovernance: 'Factory Self-Managed' as ResourceGovernanceOwner,
        updatedBy: 'System',
        updatedAt: new Date().toISOString().slice(0, 10)
      },
    [activeWp, activeFac, localTick]
  );

  const [wfGov, setWfGov] = useState<ResourceGovernanceOwner>(governance.workforceGovernance);
  const [matGov, setMatGov] = useState<ResourceGovernanceOwner>(governance.materialsGovernance);
  const [eqGov, setEqGov] = useState<ResourceGovernanceOwner>(governance.machineryGovernance);
  const [ovhGov, setOvhGov] = useState<ResourceGovernanceOwner>(governance.overheadsGovernance);

  const employees = useMemo(() => hrService.getEmployees(null), []);
  const equipmentAssets = useMemo(() => equipmentControlService.getAssets(), []);
  const inventoryItems = useMemo(() => procurementService.getInventory(), []);

  const projectAllocations = useMemo(() => {
    const all = factoryExecutionService.getProjectResourceAllocations();
    const facIds = new Set(factories.map(f => f.id));
    return all.filter(r => facIds.size === 0 || facIds.has(r.factoryId));
  }, [factories, localTick]);

  // Allocate Resource Modal State (Advanced Form)
  const [showAllocModal, setShowAllocModal] = useState(false);
  const [allocCategory, setAllocCategory] = useState<ProjectResourceCategory>('Raw Materials & Profiles');
  const [allocManagedBy, setAllocManagedBy] = useState<ResourceGovernanceOwner>('Innovista Managed');
  const [allocMasterRef, setAllocMasterRef] = useState(inventoryItems[0]?.sku || 'MAT-ALU-6063');
  const [allocName, setAllocName] = useState('');
  const [allocSpecGrade, setAllocSpecGrade] = useState('Alloy 6063-T6 / ISO 9001 Certified');
  const [allocSupplierOrSource, setAllocSupplierOrSource] = useState('Innovista Central Store / Approved Partner');
  const [allocBatchOrSerial, setAllocBatchOrSerial] = useState('BATCH-2026-09-A1');
  const [allocBayLocation, setAllocBayLocation] = useState('Bay A — Primary Fabrication Line');
  const [allocRequiredDate, setAllocRequiredDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [allocQty, setAllocQty] = useState(25);
  const [allocIssuedQty, setAllocIssuedQty] = useState(25);
  const [allocUnit, setAllocUnit] = useState('Units');
  const [allocUnitCost, setAllocUnitCost] = useState(18500);
  const [allocNotes, setAllocNotes] = useState('Allocated exclusively under project governance — no duplicate entry');

  // View Details Modal State
  const [viewingAlloc, setViewingAlloc] = useState<ProjectResourceAllocationRecord | null>(null);
  const [docSpec, setDocSpec] = useState<FactoryRecordDocumentSpec | null>(null);
  const [viewingGenericDetail, setViewingGenericDetail] = useState<{
    title: string;
    code: string;
    badge: string;
    fields: Array<{ label: string; value: string | number }>;
  } | null>(null);

  const allTaskMaterials = useMemo(() => {
    const list: Array<{
      taskCode: string;
      taskTitle: string;
      factoryName: string;
      projectName: string;
      mat: FactoryExecutionTask['materials'][0];
    }> = [];
    tasks.forEach(t => {
      t.materials.forEach(m => {
        list.push({
          taskCode: t.taskCode,
          taskTitle: t.title,
          factoryName: t.factoryName,
          projectName: t.projectName,
          mat: m
        });
      });
    });
    return list;
  }, [tasks]);

  const handleSaveGovernance = () => {
    if (!activeWp) return;
    factoryExecutionService.saveProjectResourceGovernance(currentUser, {
      workPackageId: activeWp.id,
      projectId: activeWp.projectId,
      factoryId: activeWp.factoryId,
      workforceGovernance: wfGov,
      materialsGovernance: matGov,
      machineryGovernance: eqGov,
      overheadsGovernance: ovhGov,
      utilitiesAndToolsGovernance: ovhGov,
      updatedBy: currentUser?.fullName || 'Controller',
      updatedAt: new Date().toISOString().slice(0, 10)
    });
    setLocalTick(t => t + 1);
    onRefresh?.();
    toast.success('Project Resource Setup Saved');
  };

  const handleSaveAllocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!allocName.trim()) return;
    factoryExecutionService.saveProjectResourceAllocation(currentUser, {
      factoryId: activeFac?.id || 'fac-inv-01',
      projectId: activeWp?.projectId || 'PRJ-2026-001',
      projectName: activeWp?.projectName || 'Sirius Mall Storefront',
      workPackageId: activeWp?.id || 'fwp-01',
      category: allocCategory,
      managedBy: allocManagedBy,
      masterRecordId: allocMasterRef,
      resourceCode: allocMasterRef,
      resourceName: `${allocName.trim()} (${allocSpecGrade})`,
      plannedQty: allocQty,
      issuedOrActiveQty: allocIssuedQty,
      unit: allocUnit,
      unitCost: allocUnitCost,
      notes: `Source: ${allocSupplierOrSource} | Batch/Serial: ${allocBatchOrSerial} | Bay: ${allocBayLocation} | Required: ${allocRequiredDate} | ${allocNotes}`
    });
    setShowAllocModal(false);
    setAllocName('');
    setLocalTick(t => t + 1);
    onRefresh?.();
    toast.success('Advanced Resource Linked to Project (De-duplicated)');
  };

  const handleUpdateAllocStatus = (
    rec: ProjectResourceAllocationRecord,
    status: ProjectResourceAllocationRecord['status']
  ) => {
    const updated = factoryExecutionService.saveProjectResourceAllocation(currentUser, {
      ...rec,
      status
    });
    if (viewingAlloc && viewingAlloc.id === rec.id) {
      setViewingAlloc(updated);
    }
    setLocalTick(t => t + 1);
    onRefresh?.();
    toast.success(`Status: ${status}`);
  };

  const handleExportBomCsv = () => {
    const headers = ['Code', 'Project', 'Factory', 'Category', 'Resource', 'ManagedBy', 'PlannedQty', 'Unit', 'Status'];
    const rows = projectAllocations.map(r => [
      r.allocationCode,
      `"${r.projectName}"`,
      `"${r.factoryName}"`,
      `"${r.category}"`,
      `"${r.resourceName}"`,
      `"${r.managedBy}"`,
      r.plannedQty,
      r.unit,
      r.status
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Project_Resources_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported CSV');
  };

  return (
    <div className="space-y-4">
      {/* Project-Factory Resource Governance Setup Row */}
      <div className="bg-white rounded-xl border border-slate-200/80 px-4 py-2.5 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-orange-500 shrink-0" />
          <span className="text-xs font-bold text-slate-900 whitespace-nowrap">
            Resource Setup ({activeFac?.ownershipType || 'Factory'}):
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1">
            <span className="text-slate-500 font-semibold">People:</span>
            <select
              value={wfGov}
              onChange={e => setWfGov(e.target.value as ResourceGovernanceOwner)}
              className="px-2 py-1 text-[11px] border border-slate-200 rounded-lg bg-slate-50 font-semibold text-slate-800"
            >
              {GOVERNANCE_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-slate-500 font-semibold">Materials:</span>
            <select
              value={matGov}
              onChange={e => setMatGov(e.target.value as ResourceGovernanceOwner)}
              className="px-2 py-1 text-[11px] border border-slate-200 rounded-lg bg-slate-50 font-semibold text-slate-800"
            >
              {GOVERNANCE_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-slate-500 font-semibold">Equipment:</span>
            <select
              value={eqGov}
              onChange={e => setEqGov(e.target.value as ResourceGovernanceOwner)}
              className="px-2 py-1 text-[11px] border border-slate-200 rounded-lg bg-slate-50 font-semibold text-slate-800"
            >
              {GOVERNANCE_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-slate-500 font-semibold">Overheads:</span>
            <select
              value={ovhGov}
              onChange={e => setOvhGov(e.target.value as ResourceGovernanceOwner)}
              className="px-2 py-1 text-[11px] border border-slate-200 rounded-lg bg-slate-50 font-semibold text-slate-800"
            >
              {GOVERNANCE_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleSaveGovernance}
            className="px-3 py-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-semibold transition-colors"
          >
            Save
          </button>
        </div>
      </div>

      {/* Sub-Navigation Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200/80 px-4 py-2.5 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1">
          <button
            onClick={() => setSubView('allocations')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              subView === 'allocations'
                ? 'bg-white text-orange-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className={`w-3.5 h-3.5 ${subView === 'allocations' ? 'text-orange-500' : 'text-slate-400'}`} />
            Resources
          </button>
          <button
            onClick={() => setSubView('workforce')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              subView === 'workforce'
                ? 'bg-white text-orange-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className={`w-3.5 h-3.5 ${subView === 'workforce' ? 'text-orange-500' : 'text-slate-400'}`} />
            Workforce
          </button>
          <button
            onClick={() => setSubView('machinery')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              subView === 'machinery'
                ? 'bg-white text-orange-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Wrench className={`w-3.5 h-3.5 ${subView === 'machinery' ? 'text-orange-500' : 'text-slate-400'}`} />
            Machines
          </button>
          <button
            onClick={() => setSubView('materials')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              subView === 'materials'
                ? 'bg-white text-orange-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Package className={`w-3.5 h-3.5 ${subView === 'materials' ? 'text-orange-500' : 'text-slate-400'}`} />
            Materials
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAllocModal(true)}
            className="px-3.5 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add
          </button>
          <button
            onClick={handleExportBomCsv}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
        </div>
      </div>

      {/* 1. Project Resource Allocations (Compact Row per Record + View Button) */}
      {subView === 'allocations' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-semibold text-slate-400">
                  <th className="py-2.5 px-4">Code</th>
                  <th className="py-2.5 px-4">Resource</th>
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4">Managed By</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {projectAllocations.map(rec => (
                  <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-4 font-mono font-bold text-orange-600 whitespace-nowrap">{rec.allocationCode}</td>
                    <td className="py-2.5 px-4 font-bold text-slate-900 whitespace-nowrap">{rec.resourceName}</td>
                    <td className="py-2.5 px-4 text-slate-600 whitespace-nowrap">{rec.category}</td>
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-[10px] font-bold">
                        {rec.managedBy}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-[10px] font-bold">
                        {rec.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => setDocSpec(buildResourceAllocationDocSpec(rec))}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold inline-flex items-center gap-1"
                        >
                          <Printer className="w-3.5 h-3.5 text-orange-500" />
                          Doc
                        </button>
                        <button
                          onClick={() => setViewingAlloc(rec)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          View
                        </button>
                        <button
                          onClick={() => {
                            if (!confirm(`Delete resource allocation ${rec.allocationCode} (${rec.resourceName})?`)) return;
                            factoryExecutionService.deleteFactoryRecord('RESOURCE_ALLOCATION', rec.id);
                            setLocalTick(t => t + 1);
                            onRefresh?.();
                            toast.success('Resource allocation deleted');
                          }}
                          className="p-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. Workforce (Compact Row per Record + View Button) */}
      {subView === 'workforce' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-semibold text-slate-400">
                  <th className="py-2.5 px-4">HR ID</th>
                  <th className="py-2.5 px-4">Worker</th>
                  <th className="py-2.5 px-4">Role</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {employees.slice(0, 12).map((emp, idx) => {
                  const fac = factories[idx % factories.length] || factories[0];
                  const workerTasks = tasks.filter(
                    t => t.assignedWorkerNames.includes(emp.fullName) || t.factoryId === fac?.id
                  );
                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-4 font-mono font-bold text-orange-600 whitespace-nowrap">{emp.employeeCode || emp.id}</td>
                      <td className="py-2.5 px-4 font-bold text-slate-900 whitespace-nowrap">{emp.fullName}</td>
                      <td className="py-2.5 px-4 text-slate-600 whitespace-nowrap">{emp.positionTitle}</td>
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 font-semibold text-[10px]">
                          Active
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() =>
                            setViewingGenericDetail({
                              title: emp.fullName,
                              code: emp.employeeCode || emp.id,
                              badge: wfGov,
                              fields: [
                                { label: 'Role / Position', value: emp.positionTitle },
                                { label: 'Department', value: emp.department || 'Operations' },
                                { label: 'Assigned Factory', value: fac?.name || 'Primary Facility' },
                                { label: 'Workforce Governance', value: wfGov },
                                {
                                  label: 'Assigned Tasks',
                                  value: workerTasks.map(t => t.taskCode).join(', ') || 'Active Floor Assignment'
                                },
                                { label: 'Status', value: 'Active' }
                              ]
                            })
                          }
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Machines (Compact Row per Record + View Button) */}
      {subView === 'machinery' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-semibold text-slate-400">
                  <th className="py-2.5 px-4">Asset Code</th>
                  <th className="py-2.5 px-4">Machine</th>
                  <th className="py-2.5 px-4 text-right">Load</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {equipmentAssets.slice(0, 12).map((eq, idx) => {
                  const fac = factories[idx % factories.length] || factories[0];
                  const utilPct = Math.min(100, Math.round((eq.currentMeter / Math.max(1, eq.nextServiceMeter)) * 100));
                  return (
                    <tr key={eq.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-4 font-mono font-bold text-orange-600 whitespace-nowrap">{eq.equipmentId}</td>
                      <td className="py-2.5 px-4 font-bold text-slate-900 whitespace-nowrap">{eq.name}</td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-sky-700">{utilPct}%</td>
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-[10px] font-bold">
                          {eq.lifecycleState}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() =>
                            setViewingGenericDetail({
                              title: eq.name,
                              code: eq.equipmentId,
                              badge: eq.lifecycleState,
                              fields: [
                                { label: 'Factory Facility', value: fac?.name || 'Primary Facility' },
                                { label: 'Equipment Governance', value: eqGov },
                                { label: 'Utilization Load', value: `${utilPct}%` },
                                { label: 'Current Meter', value: `${eq.currentMeter} hrs` },
                                { label: 'Next Service Meter', value: `${eq.nextServiceMeter} hrs` },
                                { label: 'Category', value: eq.category || 'CNC / Industrial' }
                              ]
                            })
                          }
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. BOM Materials (Compact Row per Record + View Button) */}
      {subView === 'materials' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-semibold text-slate-400">
                  <th className="py-2.5 px-4">Task</th>
                  <th className="py-2.5 px-4">Material</th>
                  <th className="py-2.5 px-4 text-right">Issued / Req</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {allTaskMaterials.map((row, idx) => (
                  <tr key={`${row.taskCode}-${idx}`} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-4 font-mono font-bold text-orange-600 whitespace-nowrap">{row.taskCode}</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900 whitespace-nowrap">{row.mat.materialName}</td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-600 whitespace-nowrap">
                      {row.mat.issuedQty}/{row.mat.requiredQty} {row.mat.unit}
                    </td>
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 font-semibold text-[10px]">
                        {row.mat.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() =>
                          setViewingGenericDetail({
                            title: row.mat.materialName,
                            code: row.mat.materialCode,
                            badge: row.mat.status,
                            fields: [
                              { label: 'Task Reference', value: `${row.taskCode} — ${row.taskTitle}` },
                              { label: 'Project', value: row.projectName },
                              { label: 'Factory', value: row.factoryName },
                              { label: 'Material Governance', value: matGov },
                              { label: 'Required Quantity', value: `${row.mat.requiredQty} ${row.mat.unit}` },
                              { label: 'Issued Quantity', value: `${row.mat.issuedQty} ${row.mat.unit}` },
                              { label: 'Consumed Quantity', value: `${row.mat.consumedQty} ${row.mat.unit}` },
                              { label: 'Wastage Quantity', value: `${row.mat.wastageQty} ${row.mat.unit}` }
                            ]
                          })
                        }
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View Project Resource Allocation Full Details Modal */}
      {viewingAlloc && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-xl w-full overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-orange-600">{viewingAlloc.allocationCode}</span>
                <h3 className="text-sm font-bold text-slate-900">{viewingAlloc.resourceName}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const spec = buildResourceAllocationDocSpec(viewingAlloc);
                    setViewingAlloc(null);
                    setDocSpec(spec);
                  }}
                  className="px-3 py-1 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold inline-flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Doc
                </button>
                <button
                  onClick={() => setViewingAlloc(null)}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                <div>
                  <div className="text-[10px] font-semibold text-slate-400">Master Record ID</div>
                  <div className="font-mono font-bold text-sky-700 mt-0.5">{viewingAlloc.masterRecordId}</div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold text-slate-400">Category</div>
                  <div className="font-bold text-slate-800 mt-0.5">{viewingAlloc.category}</div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold text-slate-400">Governance / Owner</div>
                  <div className="font-bold text-indigo-700 mt-0.5">{viewingAlloc.managedBy}</div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold text-slate-400">Project</div>
                  <div className="font-semibold text-slate-800 mt-0.5">{viewingAlloc.projectName}</div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold text-slate-400">Factory</div>
                  <div className="font-semibold text-slate-800 mt-0.5">{viewingAlloc.factoryName}</div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold text-slate-400">Contract Reference</div>
                  <div className="font-mono font-semibold text-slate-700 mt-0.5">{viewingAlloc.contractRef || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold text-slate-400">Planned Qty</div>
                  <div className="font-mono font-bold text-slate-900 mt-0.5">
                    {viewingAlloc.plannedQty} {viewingAlloc.unit}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold text-slate-400">Issued / Active Qty</div>
                  <div className="font-mono font-bold text-emerald-600 mt-0.5">
                    {viewingAlloc.issuedOrActiveQty} {viewingAlloc.unit}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold text-slate-400">Allocated Cost</div>
                  <div className="font-mono font-bold text-slate-900 mt-0.5">
                    LKR {viewingAlloc.totalAllocatedCost.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-700">Status:</span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {([
                    { val: 'Planned', label: 'Planned' },
                    { val: 'Reserved', label: 'Reserved' },
                    { val: 'Issued / Active', label: 'Active' },
                    { val: 'Consumed', label: 'Used' },
                    { val: 'Returned', label: 'Returned' },
                    { val: 'Shortage', label: 'Short' },
                    { val: 'Damaged', label: 'Damaged' }
                  ] as const).map(st => (
                    <button
                      key={st.val}
                      onClick={() => handleUpdateAllocStatus(viewingAlloc, st.val)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold ${
                        viewingAlloc.status === st.val
                          ? 'bg-orange-500 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generic Detail Modal for Workforce / Machines / BOM Materials */}
      {viewingGenericDetail && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-orange-600">{viewingGenericDetail.code}</span>
                <h3 className="text-sm font-bold text-slate-900">{viewingGenericDetail.title}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const spec = buildGenericResourceDocSpec({
                      id: viewingGenericDetail.code,
                      code: viewingGenericDetail.code,
                      title: viewingGenericDetail.title,
                      category: viewingGenericDetail.badge,
                      factoryName: activeFac?.name || 'Factory Facility',
                      projectName: activeWp?.projectName || 'Project Workspace',
                      governance: viewingGenericDetail.badge,
                      status: 'Active',
                      fields: viewingGenericDetail.fields
                    });
                    setViewingGenericDetail(null);
                    setDocSpec(spec);
                  }}
                  className="px-3 py-1 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold inline-flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Doc
                </button>
                <button
                  onClick={() => setViewingGenericDetail(null)}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="p-5 grid grid-cols-2 gap-3 text-xs">
              {viewingGenericDetail.fields.map((f, i) => (
                <div key={i} className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                  <div className="text-[10px] font-semibold text-slate-400">{f.label}</div>
                  <div className="font-bold text-slate-900 mt-0.5">{f.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Project Resource Allocation Modal (Advanced Multi-Section Form) */}
      {showAllocModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-[9998] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Allocate Advanced Project & Factory Resource (De-duplicated Registry)
                </h3>
                <p className="text-[11px] text-slate-300">
                  Link HR workforce, CNC machinery, raw materials, or overheads under project governance without record duplication
                </p>
              </div>
              <button
                onClick={() => setShowAllocModal(false)}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold"
              >
                Close
              </button>
            </div>
            <form onSubmit={handleSaveAllocation} className="p-6 space-y-4 overflow-y-auto text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="text-[11px] font-bold text-orange-600 uppercase tracking-wider">
                  1. Resource Classification, Governance Model & Master Registry Link
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Resource Category</label>
                    <select
                      value={allocCategory}
                      onChange={e => setAllocCategory(e.target.value as ProjectResourceCategory)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    >
                      {RESOURCE_CATEGORIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Managed / Supplied By (Governance)</label>
                    <select
                      value={allocManagedBy}
                      onChange={e => setAllocManagedBy(e.target.value as ResourceGovernanceOwner)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    >
                      {GOVERNANCE_OPTIONS.map(o => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Quick Link Existing Master Record (HR / Equipment / Inventory — Prevents Duplication)
                  </label>
                  <select
                    onChange={e => {
                      const val = e.target.value;
                      if (!val) return;
                      const [code, name, unit] = val.split('||');
                      setAllocMasterRef(code);
                      setAllocName(name);
                      if (unit) setAllocUnit(unit);
                    }}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-semibold"
                  >
                    <option value="">-- Select Master Item to Auto-Fill (No Duplication) --</option>
                    <optgroup label="Inventory & Materials">
                      {inventoryItems.slice(0, 8).map(it => (
                        <option key={it.id} value={`${it.sku}||${it.name}||${it.unit || 'Units'}`}>
                          [MAT] {it.sku} — {it.name}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Equipment & Machinery">
                      {equipmentAssets.slice(0, 6).map(eq => (
                        <option key={eq.id} value={`${eq.equipmentId}||${eq.name}||Units`}>
                          [EQP] {eq.equipmentId} — {eq.name}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="HR Workforce">
                      {employees.slice(0, 6).map(emp => (
                        <option key={emp.id} value={`${emp.employeeCode || emp.id}||${emp.fullName} (${emp.positionTitle})||Persons`}>
                          [HR] {emp.employeeCode || emp.id} — {emp.fullName}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Master Record Ref / SKU</label>
                    <input
                      type="text"
                      required
                      value={allocMasterRef}
                      onChange={e => setAllocMasterRef(e.target.value)}
                      placeholder="EMP-01 / EQ-CNC-01 / MAT-101"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Resource Name / Description</label>
                    <input
                      type="text"
                      required
                      value={allocName}
                      onChange={e => setAllocName(e.target.value)}
                      placeholder="DGU Silicone & Spacer Package / 6063-T6 Mullion Profiles"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="text-[11px] font-bold text-orange-600 uppercase tracking-wider">
                  2. Technical Specification, Source, Batch & Factory Bay Allocation
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Technical Grade / Spec</label>
                    <input
                      type="text"
                      value={allocSpecGrade}
                      onChange={e => setAllocSpecGrade(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Supplier / Source Store</label>
                    <input
                      type="text"
                      value={allocSupplierOrSource}
                      onChange={e => setAllocSupplierOrSource(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Heat Batch / Serial No</label>
                    <input
                      type="text"
                      value={allocBatchOrSerial}
                      onChange={e => setAllocBatchOrSerial(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Bay / Line</label>
                    <input
                      type="text"
                      value={allocBayLocation}
                      onChange={e => setAllocBayLocation(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="text-[11px] font-bold text-orange-600 uppercase tracking-wider">
                  3. Quantities, Unit Cost, Required Date & Control Notes
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Planned Qty</label>
                    <input
                      type="number"
                      value={allocQty}
                      onChange={e => setAllocQty(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Issued / Active Qty</label>
                    <input
                      type="number"
                      value={allocIssuedQty}
                      onChange={e => setAllocIssuedQty(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Unit</label>
                    <input
                      type="text"
                      value={allocUnit}
                      onChange={e => setAllocUnit(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Unit Cost (LKR)</label>
                    <input
                      type="number"
                      value={allocUnitCost}
                      onChange={e => setAllocUnitCost(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Required Date</label>
                    <input
                      type="date"
                      value={allocRequiredDate}
                      onChange={e => setAllocRequiredDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Allocation & Governance Remarks</label>
                  <input
                    type="text"
                    value={allocNotes}
                    onChange={e => setAllocNotes(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAllocModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold shadow-2xs"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {docSpec && (
        <FactoryQuotationDocumentModal
          spec={docSpec}
          currentUser={currentUser}
          onClose={() => setDocSpec(null)}
          onRefresh={() => {
            setLocalTick(t => t + 1);
            onRefresh?.();
          }}
        />
      )}
    </div>
  );
};
