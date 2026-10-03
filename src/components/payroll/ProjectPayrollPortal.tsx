import React, { useState, useMemo } from 'react';
import {
  Building2,
  Plus,
  Search,
  CheckCircle2,
  Printer,
  ArrowLeft,
  X,
  Edit2,
  Check,
  Users
} from 'lucide-react';
import {
  ProjectPayrollPlan,
  ProjectBudgetItem
} from '../../types/payroll';
import { payrollService } from '../../services/payrollService';

export interface ProjectPayrollPortalProps {
  onBackToLanding?: () => void;
}

export const ProjectPayrollPortal: React.FC<ProjectPayrollPortalProps> = ({
  onBackToLanding
}) => {
  const [plans, setPlans] = useState<ProjectPayrollPlan[]>(() =>
    payrollService.getProjectPayrollPlans()
  );

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & form states
  const [isNewPlanModalOpen, setIsNewPlanModalOpen] = useState(false);
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanNotes, setNewPlanNotes] = useState('');

  // Editing budget item row
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editRoleName, setEditRoleName] = useState('');
  const [editPersonnelName, setEditPersonnelName] = useState('');
  const [editHeadcount, setEditHeadcount] = useState(1);
  const [editPlannedManDays, setEditPlannedManDays] = useState(30);
  const [editDailyRate, setEditDailyRate] = useState(500);
  const [editPlannedOvertime, setEditPlannedOvertime] = useState(0);
  const [editPlannedSiteAllowance, setEditPlannedSiteAllowance] = useState(0);
  const [editActualHours, setEditActualHours] = useState(0);
  const [editActualCost, setEditActualCost] = useState(0);

  // New item modal
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [newItemRole, setNewItemRole] = useState('');
  const [newItemPersonnel, setNewItemPersonnel] = useState('');
  const [newItemHeadcount, setNewItemHeadcount] = useState(1);
  const [newItemManDays, setNewItemManDays] = useState(30);
  const [newItemDailyRate, setNewItemDailyRate] = useState(500);
  const [newItemOvertime, setNewItemOvertime] = useState(0);
  const [newItemSiteAllowance, setNewItemSiteAllowance] = useState(0);

  // Flash notice
  const [flash, setFlash] = useState<string | null>(null);
  const showFlash = (msg: string) => {
    setFlash(msg);
    setTimeout(() => setFlash(null), 3000);
  };

  const refreshPlans = () => {
    setPlans(payrollService.getProjectPayrollPlans());
  };

  // Group plans by Project
  const projectsSummary = useMemo(() => {
    const map = new Map<string, {
      projectId: string;
      projectName: string;
      plansCount: number;
      totalBudget: number;
      actualCost: number;
      burnRatePercent: number;
      headcount: number;
    }>();

    plans.forEach(p => {
      const existing = map.get(p.projectId);
      const planHeadcount = p.items.reduce((acc, it) => acc + (it.headcount || 1), 0);

      if (!existing) {
        map.set(p.projectId, {
          projectId: p.projectId,
          projectName: p.projectName,
          plansCount: 1,
          totalBudget: p.totalPlannedCost,
          actualCost: p.actualCostToDate,
          burnRatePercent: p.burnRatePercent,
          headcount: planHeadcount
        });
      } else {
        existing.plansCount += 1;
        // Keep active plan totals as primary
        if (p.isActive) {
          existing.totalBudget = p.totalPlannedCost;
          existing.actualCost = p.actualCostToDate;
          existing.burnRatePercent = p.burnRatePercent;
          existing.headcount = planHeadcount;
        }
      }
    });

    return Array.from(map.values());
  }, [plans]);

  const filteredProjects = useMemo(() => {
    return projectsSummary.filter(p =>
      p.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.projectId.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [projectsSummary, searchQuery]);

  // Current active project plans
  const currentProjectPlans = useMemo(() => {
    if (!selectedProjectId) return [];
    return plans.filter(p => p.projectId === selectedProjectId);
  }, [plans, selectedProjectId]);

  const activePlan = useMemo(() => {
    if (selectedPlanId) {
      return currentProjectPlans.find(p => p.id === selectedPlanId) || currentProjectPlans[0] || null;
    }
    return currentProjectPlans.find(p => p.isActive) || currentProjectPlans[0] || null;
  }, [currentProjectPlans, selectedPlanId]);

  const handleStartEditItem = (item: ProjectBudgetItem) => {
    setEditingItemId(item.id);
    setEditRoleName(item.roleName);
    setEditPersonnelName(item.personnelName);
    setEditHeadcount(item.headcount);
    setEditPlannedManDays(item.plannedManDays);
    setEditDailyRate(item.dailyRate);
    setEditPlannedOvertime(item.plannedOvertime);
    setEditPlannedSiteAllowance(item.plannedSiteAllowance);
    setEditActualHours(item.actualHoursWorked);
    setEditActualCost(item.actualCost);
  };

  const handleSaveEditItem = () => {
    if (!activePlan || !editingItemId) return;

    const plannedBasic = editPlannedManDays * editDailyRate;
    const totalPlanned = plannedBasic + editPlannedOvertime + editPlannedSiteAllowance;
    const variance = totalPlanned - editActualCost;
    const variancePercent = totalPlanned > 0 ? ((totalPlanned - editActualCost) / totalPlanned) * 100 : 0;

    const updatedItem: ProjectBudgetItem = {
      id: editingItemId,
      roleName: editRoleName,
      personnelName: editPersonnelName,
      headcount: editHeadcount,
      plannedManDays: editPlannedManDays,
      dailyRate: editDailyRate,
      plannedBasic,
      plannedOvertime: editPlannedOvertime,
      plannedSiteAllowance: editPlannedSiteAllowance,
      totalPlannedCost: totalPlanned,
      actualHoursWorked: editActualHours,
      actualCost: editActualCost,
      variance,
      variancePercent: Number(variancePercent.toFixed(1))
    };

    payrollService.updateProjectBudgetItem(activePlan.id, updatedItem);
    refreshPlans();
    setEditingItemId(null);
    showFlash('Updated project labor budget line item.');
  };

  const handleCreateNewPlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !newPlanName.trim()) return;

    const currentProj = projectsSummary.find(p => p.projectId === selectedProjectId);
    const newPlan: ProjectPayrollPlan = {
      id: `pplan-${Date.now()}`,
      projectId: selectedProjectId,
      projectName: currentProj?.projectName || 'Project',
      planName: newPlanName.trim(),
      code: `LAB-PLN-${Date.now().toString().slice(-4)}`,
      currency: 'AED',
      isActive: false,
      notes: newPlanNotes.trim(),
      totalPlannedCost: 0,
      actualCostToDate: 0,
      variance: 0,
      burnRatePercent: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: []
    };

    const saved = payrollService.saveProjectPayrollPlan(newPlan);
    refreshPlans();
    setSelectedPlanId(saved.id);
    setIsNewPlanModalOpen(false);
    setNewPlanName('');
    setNewPlanNotes('');
    showFlash(`Created new plan: ${saved.planName}`);
  };

  const handleAddItemToBudget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePlan || !newItemRole.trim()) return;

    const plannedBasic = newItemManDays * newItemDailyRate;
    const totalPlanned = plannedBasic + newItemOvertime + newItemSiteAllowance;

    const newItem: ProjectBudgetItem = {
      id: `pbi-${Date.now()}`,
      roleName: newItemRole.trim(),
      personnelName: newItemPersonnel.trim() || 'Assigned Crew',
      headcount: newItemHeadcount,
      plannedManDays: newItemManDays,
      dailyRate: newItemDailyRate,
      plannedBasic,
      plannedOvertime: newItemOvertime,
      plannedSiteAllowance: newItemSiteAllowance,
      totalPlannedCost: totalPlanned,
      actualHoursWorked: 0,
      actualCost: 0,
      variance: totalPlanned,
      variancePercent: 100
    };

    payrollService.updateProjectBudgetItem(activePlan.id, newItem);
    refreshPlans();
    setIsAddItemModalOpen(false);
    setNewItemRole('');
    setNewItemPersonnel('');
    showFlash('Added new role to project labor budget.');
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-5 text-slate-800">
      
      {/* Flash message */}
      {flash && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{flash}</span>
          </div>
          <button onClick={() => setFlash(null)} className="text-emerald-500 hover:text-emerald-800">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Breadcrumb & Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5">
          {onBackToLanding && (
            <button
              onClick={onBackToLanding}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Back to Payroll Command Center"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <Building2 className="w-4 h-4" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold tracking-tight text-slate-900">
                Project-Based Payroll & Labor Budgets
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                Multi-Plan Budgeting
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Manage multi-tier project payroll plans, customize role rates & man-days, and compare with actual timesheet costs.
            </p>
          </div>
        </div>

        {selectedProjectId && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedProjectId(null)}
              className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 border border-slate-200 cursor-pointer"
            >
              All Project Cards
            </button>

            <button
              onClick={handlePrintReport}
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 border border-slate-200 shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Print Labor Report</span>
            </button>
          </div>
        )}
      </div>

      {/* VIEW 1: ALL PROJECT CARDS */}
      {!selectedProjectId && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-3 shadow-xs">
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects for payroll planning..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:bg-white"
              />
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Showing {filteredProjects.length} Projects
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map(proj => {
              const variance = proj.totalBudget - proj.actualCost;
              const isOverBudget = proj.burnRatePercent > 100;

              return (
                <div
                  key={proj.projectId}
                  onClick={() => setSelectedProjectId(proj.projectId)}
                  className="bg-white border border-slate-200 hover:border-blue-400 rounded-xl p-4 shadow-xs transition-all cursor-pointer group flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                          {proj.projectId}
                        </span>
                        <h3 className="text-xs font-bold text-slate-900 mt-1.5 group-hover:text-blue-600 transition-colors">
                          {proj.projectName}
                        </h3>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {proj.plansCount} Plans
                      </span>
                    </div>

                    {/* Progress Burn Rate Bar */}
                    <div className="space-y-1 pt-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-500">Budget Burn Rate</span>
                        <span className={`font-bold font-mono ${isOverBudget ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {proj.burnRatePercent}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${isOverBudget ? 'bg-rose-500' : 'bg-blue-600'}`}
                          style={{ width: `${Math.min(proj.burnRatePercent, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <div className="text-[10px] text-slate-400">Total Planned Labor</div>
                      <div className="font-bold text-slate-900 font-mono">
                        AED {proj.totalBudget.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">Actual Disbursed</div>
                      <div className="font-bold text-slate-900 font-mono">
                        AED {proj.actualCost.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">Net Variance</div>
                      <div className={`font-bold font-mono ${variance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {variance >= 0 ? '+' : ''}AED {variance.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Users className="w-3 h-3 text-slate-400" />
                      {proj.headcount} Allocated Workers
                    </span>
                    <span className="font-bold text-blue-600 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      Open Plans & Budget &rarr;
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: DRILLDOWN FOR SELECTED PROJECT */}
      {selectedProjectId && activePlan && (
        <div className="space-y-5">
          
          {/* Project Details Bar with Plan Switcher */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {activePlan.projectId}
                </span>
                <h3 className="text-sm font-bold text-slate-900">
                  {activePlan.projectName}
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {activePlan.notes || 'Project labor plan and cost comparison ledger.'}
              </p>
            </div>

            {/* Plans Tabs and Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
                {currentProjectPlans.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPlanId(p.id)}
                    className={`px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                      activePlan.id === p.id
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {p.planName}
                    {p.isActive && (
                      <span className="ml-1.5 px-1 py-0.2 rounded text-[9px] bg-emerald-100 text-emerald-800">
                        Active
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setIsNewPlanModalOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Plan</span>
              </button>

              <button
                onClick={() => setIsAddItemModalOpen(true)}
                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1 shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Budget Item</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Comparison Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Total Planned Budget
              </span>
              <div className="text-lg font-bold text-slate-900 font-mono mt-1">
                AED {activePlan.totalPlannedCost.toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-500">Base salary + OT + site allowances</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Actual Disbursed Cost
              </span>
              <div className="text-lg font-bold text-slate-900 font-mono mt-1">
                AED {activePlan.actualCostToDate.toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-500">Reconciled against timesheets</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Budget Variance (&plusmn;)
              </span>
              <div className={`text-lg font-bold font-mono mt-1 ${activePlan.variance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {activePlan.variance >= 0 ? '+' : ''}AED {activePlan.variance.toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-500">{activePlan.variance >= 0 ? 'Savings under budget' : 'Overrun notice'}</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Burn Rate Percentage
              </span>
              <div className="text-lg font-bold text-slate-900 font-mono mt-1">
                {activePlan.burnRatePercent}%
              </div>
              <div className="w-full h-1 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                <div
                  className={`h-full ${activePlan.burnRatePercent > 100 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                  style={{ width: `${Math.min(activePlan.burnRatePercent, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Interactive Editable Budget List Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Labor Budget Lines & Actual Comparison ({activePlan.items.length} Roles)
                </h4>
                <p className="text-[11px] text-slate-500">
                  Click 'Edit' on any line to adjust man-days, daily rates, allowances, and compare planned vs actual.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-600">
                  <tr>
                    <th className="py-2.5 px-3">Role & Allocated Crew</th>
                    <th className="py-2.5 px-2 text-center">Headcount</th>
                    <th className="py-2.5 px-2 text-right">Planned Days</th>
                    <th className="py-2.5 px-2 text-right">Daily Rate</th>
                    <th className="py-2.5 px-2 text-right">Planned Basic</th>
                    <th className="py-2.5 px-2 text-right">Planned OT</th>
                    <th className="py-2.5 px-2 text-right">Site Allow.</th>
                    <th className="py-2.5 px-3 text-right bg-blue-50/50 font-black">Planned Total</th>
                    <th className="py-2.5 px-3 text-right bg-slate-100/60 font-black">Actual Cost</th>
                    <th className="py-2.5 px-2 text-right">Variance (&plusmn;)</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {activePlan.items.map(item => {
                    const isEditing = editingItemId === item.id;

                    if (isEditing) {
                      return (
                        <tr key={item.id} className="bg-blue-50/60 border-y-2 border-blue-400">
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={editRoleName}
                              onChange={(e) => setEditRoleName(e.target.value)}
                              className="w-full text-xs px-2 py-1 bg-white border border-slate-300 rounded font-semibold text-slate-900 mb-1"
                              placeholder="Role title"
                            />
                            <input
                              type="text"
                              value={editPersonnelName}
                              onChange={(e) => setEditPersonnelName(e.target.value)}
                              className="w-full text-[11px] px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-600"
                              placeholder="Personnel name or crew"
                            />
                          </td>

                          <td className="py-2 px-2 text-center">
                            <input
                              type="number"
                              min={1}
                              value={editHeadcount}
                              onChange={(e) => setEditHeadcount(Number(e.target.value))}
                              className="w-12 text-xs px-1.5 py-1 bg-white border border-slate-300 rounded text-center font-bold"
                            />
                          </td>

                          <td className="py-2 px-2 text-right">
                            <input
                              type="number"
                              min={0}
                              value={editPlannedManDays}
                              onChange={(e) => setEditPlannedManDays(Number(e.target.value))}
                              className="w-16 text-xs px-1.5 py-1 bg-white border border-slate-300 rounded text-right font-mono"
                            />
                          </td>

                          <td className="py-2 px-2 text-right">
                            <input
                              type="number"
                              min={0}
                              value={editDailyRate}
                              onChange={(e) => setEditDailyRate(Number(e.target.value))}
                              className="w-16 text-xs px-1.5 py-1 bg-white border border-slate-300 rounded text-right font-mono font-bold"
                            />
                          </td>

                          <td className="py-2 px-2 text-right font-mono font-bold text-slate-700">
                            {(editPlannedManDays * editDailyRate).toLocaleString()}
                          </td>

                          <td className="py-2 px-2 text-right">
                            <input
                              type="number"
                              min={0}
                              value={editPlannedOvertime}
                              onChange={(e) => setEditPlannedOvertime(Number(e.target.value))}
                              className="w-16 text-xs px-1.5 py-1 bg-white border border-slate-300 rounded text-right font-mono text-amber-600"
                            />
                          </td>

                          <td className="py-2 px-2 text-right">
                            <input
                              type="number"
                              min={0}
                              value={editPlannedSiteAllowance}
                              onChange={(e) => setEditPlannedSiteAllowance(Number(e.target.value))}
                              className="w-16 text-xs px-1.5 py-1 bg-white border border-slate-300 rounded text-right font-mono"
                            />
                          </td>

                          <td className="py-2 px-3 text-right font-mono font-black text-blue-700 bg-blue-100/50">
                            {(editPlannedManDays * editDailyRate + editPlannedOvertime + editPlannedSiteAllowance).toLocaleString()}
                          </td>

                          <td className="py-2 px-3 text-right bg-slate-100/80">
                            <input
                              type="number"
                              min={0}
                              value={editActualCost}
                              onChange={(e) => setEditActualCost(Number(e.target.value))}
                              className="w-20 text-xs px-1.5 py-1 bg-white border border-slate-300 rounded text-right font-mono font-bold"
                            />
                          </td>

                          <td className="py-2 px-2 text-right font-mono text-[11px] text-slate-500">
                            Live
                          </td>

                          <td className="py-2 px-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={handleSaveEditItem}
                                className="p-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                                title="Save changes"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingItemId(null)}
                                className="p-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 cursor-pointer"
                                title="Cancel"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900">{item.roleName}</div>
                          <div className="text-[11px] text-slate-500">{item.personnelName}</div>
                        </td>

                        <td className="py-2.5 px-2 text-center font-bold text-slate-700">
                          {item.headcount}
                        </td>

                        <td className="py-2.5 px-2 text-right font-mono text-slate-700">
                          {item.plannedManDays}d
                        </td>

                        <td className="py-2.5 px-2 text-right font-mono font-bold text-slate-800">
                          AED {item.dailyRate}
                        </td>

                        <td className="py-2.5 px-2 text-right font-mono text-slate-600">
                          AED {item.plannedBasic.toLocaleString()}
                        </td>

                        <td className="py-2.5 px-2 text-right font-mono text-amber-600">
                          AED {item.plannedOvertime.toLocaleString()}
                        </td>

                        <td className="py-2.5 px-2 text-right font-mono text-slate-600">
                          AED {item.plannedSiteAllowance.toLocaleString()}
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-900 bg-blue-50/40">
                          AED {item.totalPlannedCost.toLocaleString()}
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 bg-slate-50">
                          AED {item.actualCost.toLocaleString()}
                        </td>

                        <td className={`py-2.5 px-2 text-right font-mono font-bold text-[11px] ${item.variance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {item.variance >= 0 ? '+' : ''}AED {item.variance.toLocaleString()}
                        </td>

                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => handleStartEditItem(item)}
                            className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 transition-colors cursor-pointer"
                            title="Edit budget line"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {activePlan.items.length === 0 && (
                    <tr>
                      <td colSpan={11} className="p-8 text-center text-slate-400 text-xs">
                        No labor roles added to this budget plan yet. Click "Add Budget Item" above.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE NEW PROJECT PAYROLL PLAN                                    */}
      {/* ========================================================================= */}
      {isNewPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Create Project Payroll Plan
              </h3>
              <button
                onClick={() => setIsNewPlanModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewPlan} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Plan Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newPlanName}
                  onChange={(e) => setNewPlanName(e.target.value)}
                  placeholder="e.g. Plan C: Subcontractor Direct Allocation"
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Plan Notes & Shift Assumptions
                </label>
                <textarea
                  rows={3}
                  value={newPlanNotes}
                  onChange={(e) => setNewPlanNotes(e.target.value)}
                  placeholder="Shift schedules, man-power limits, overtime caps..."
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewPlanModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Plan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD BUDGET ROLE ITEM                                               */}
      {/* ========================================================================= */}
      {isAddItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Add Role to Labor Budget
              </h3>
              <button
                onClick={() => setIsAddItemModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddItemToBudget} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Role / Designation Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newItemRole}
                  onChange={(e) => setNewItemRole(e.target.value)}
                  placeholder="e.g. Master Welder, Glazing Installer, Rigger"
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Allocated Crew / Personnel Name
                </label>
                <input
                  type="text"
                  value={newItemPersonnel}
                  onChange={(e) => setNewItemPersonnel(e.target.value)}
                  placeholder="e.g. Kasun Bandara / Fabrication Gang"
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Headcount
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={newItemHeadcount}
                    onChange={(e) => setNewItemHeadcount(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Planned Days
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={newItemManDays}
                    onChange={(e) => setNewItemManDays(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Daily Rate (AED)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={newItemDailyRate}
                    onChange={(e) => setNewItemDailyRate(Number(e.target.value))}
                    className="w-full text-xs px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Planned OT (AED)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={newItemOvertime}
                    onChange={(e) => setNewItemOvertime(Number(e.target.value))}
                    className="w-full text-xs px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Site Allow. (AED)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={newItemSiteAllowance}
                    onChange={(e) => setNewItemSiteAllowance(Number(e.target.value))}
                    className="w-full text-xs px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddItemModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Line Item</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
