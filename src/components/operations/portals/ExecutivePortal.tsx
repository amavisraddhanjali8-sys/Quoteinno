import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, ShieldCheck, ChevronRight, 
  DollarSign, Layers, ArrowUpRight, CheckCircle2,
  Cpu
} from 'lucide-react';
import { centralApiGateway } from '../../../services/centralApiGateway';
import { UnifiedProjectControlRecord, UniversalApprovalRequest } from '../../../types/operationalControl';
import { useSecurity } from '../../../context/SecurityContext';

export const ExecutivePortal: React.FC = () => {
  const { currentUser } = useSecurity();
  const [projects, setProjects] = useState<UnifiedProjectControlRecord[]>([]);
  const [approvals, setApprovals] = useState<UniversalApprovalRequest[]>([]);
  const [activeDrillLevel, setActiveDrillLevel] = useState<'company' | 'department' | 'project' | 'work_package'>('company');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('proj-001');

  useEffect(() => {
    try {
      const p = centralApiGateway.getProjects(currentUser);
      setProjects(p);
      const a = centralApiGateway.getApprovalRequests(currentUser);
      setApprovals(a);
    } catch (e) {
      console.error(e);
    }
  }, [currentUser]);

  const totalContractValue = projects.reduce((acc, p) => acc + p.contract.contractValue, 0);
  const totalActualCost = projects.reduce((acc, p) => acc + p.costs.totalActual, 0);
  const avgProgress = projects.length > 0 
    ? Math.round(projects.reduce((acc, p) => acc + p.overallProgress, 0) / projects.length) 
    : 0;
  const pendingApprovals = approvals.filter(a => a.status === 'Pending');

  const handleApprovalAction = (approvalId: string, decision: 'Approved' | 'Rejected') => {
    try {
      centralApiGateway.processApprovalStep(currentUser, approvalId, decision, `Executive sign-off by ${currentUser?.fullName}`);
      setApprovals(centralApiGateway.getApprovalRequests(currentUser));
    } catch (err: any) {
      alert(err.message || 'Approval action failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-6 rounded-2xl border border-slate-700/60 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Executive Portal
              </span>
              <span className="text-xs text-slate-400">Enterprise Operations Oversight</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              C-Suite Operational Control & Health
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Real-time multi-department financial absorption, quality assurance KPIs, critical path variances, and executive multi-tier approvals.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs text-slate-400">Active User Scope</div>
              <div className="text-sm font-semibold text-white">{currentUser?.fullName} ({currentUser?.roleName})</div>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-lg">
              HQ
            </div>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-700/70">
          <div className="bg-slate-800/60 backdrop-blur p-4 rounded-xl border border-slate-700">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Active Revenue Backlog</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white mt-1">
              AED {(totalContractValue / 1000000).toFixed(2)}M
            </div>
            <div className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1 font-medium">
              <TrendingUp className="w-3 h-3" /> Across {projects.length} Active Contracts
            </div>
          </div>

          <div className="bg-slate-800/60 backdrop-blur p-4 rounded-xl border border-slate-700">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>WIP Cost Absorption</span>
              <Cpu className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-bold text-white mt-1">
              AED {(totalActualCost / 1000000).toFixed(2)}M
            </div>
            <div className="text-[11px] text-cyan-300 mt-1 font-medium">
              Actual Labor & Material Absorbed
            </div>
          </div>

          <div className="bg-slate-800/60 backdrop-blur p-4 rounded-xl border border-slate-700">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Weighted Physical Progress</span>
              <TrendingUp className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-white mt-1">
              {avgProgress}%
            </div>
            <div className="w-full bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-amber-400 h-full rounded-full" style={{ width: `${avgProgress}%` }} />
            </div>
          </div>

          <div className="bg-slate-800/60 backdrop-blur p-4 rounded-xl border border-slate-700">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Executive Approvals</span>
              <ShieldCheck className="w-4 h-4 text-violet-400" />
            </div>
            <div className="text-2xl font-bold text-white mt-1">
              {pendingApprovals.length} <span className="text-xs font-normal text-slate-400">Action Required</span>
            </div>
            <div className="text-[11px] text-violet-300 mt-1 font-medium">
              Variations, Budgets & Revisions
            </div>
          </div>
        </div>
      </div>

      {/* Drill-down Hierarchy (Company → Department → Project → Work Package → Task) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              Enterprise Operational Drill-Down Engine
            </h3>
            <p className="text-xs text-slate-500">
              Drill down through corporate hierarchy: Company → Department → Project → Work Package → Task → Transaction → Document
            </p>
          </div>

          {/* Breadcrumb Steps */}
          <div className="flex items-center gap-1.5 text-xs bg-slate-50 p-1.5 rounded-xl border border-slate-200">
            <button 
              onClick={() => setActiveDrillLevel('company')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${activeDrillLevel === 'company' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              1. Company
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <button 
              onClick={() => setActiveDrillLevel('department')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${activeDrillLevel === 'department' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              2. Department
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <button 
              onClick={() => setActiveDrillLevel('project')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${activeDrillLevel === 'project' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              3. Project
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <button 
              onClick={() => setActiveDrillLevel('work_package')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${activeDrillLevel === 'work_package' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              4. Work Package / Task
            </button>
          </div>
        </div>

        {/* Drill-down Viewport */}
        <div className="mt-5">
          {activeDrillLevel === 'company' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border-2 border-indigo-500/30 bg-indigo-50/40">
                <div className="text-xs font-semibold uppercase text-indigo-700 tracking-wider">Enterprise HQ</div>
                <div className="text-lg font-bold text-slate-900 mt-1">Innovista Holdings Enterprise</div>
                <div className="text-xs text-slate-600 mt-1">Master consolidated balance & production metrics across 3 manufacturing hubs.</div>
                <div className="mt-4 pt-3 border-t border-indigo-100 flex items-center justify-between text-xs text-slate-600">
                  <span>Progress: <strong className="text-slate-900">78%</strong></span>
                  <span>Active Projects: <strong className="text-slate-900">{projects.length}</strong></span>
                </div>
                <button 
                  onClick={() => setActiveDrillLevel('department')}
                  className="mt-3 w-full py-1.5 text-xs font-semibold text-indigo-700 bg-white hover:bg-indigo-100/60 rounded-lg border border-indigo-200 transition-colors flex items-center justify-center gap-1"
                >
                  Drill Down into Departments <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
                <div className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Operational Health</div>
                <div className="text-lg font-bold text-emerald-600 mt-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-5 h-5" /> 98.4% First Pass Yield
                </div>
                <div className="text-xs text-slate-600 mt-1">QA inspection hold rates remain well within ISO 9001:2015 tolerance thresholds.</div>
                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
                  <span>Open NCRs: <strong className="text-amber-600">1</strong></span>
                  <span>Active Stops: <strong className="text-emerald-600">0</strong></span>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
                <div className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Financial Variance</div>
                <div className="text-lg font-bold text-indigo-600 mt-1">
                  +AED 1.10M Favorable
                </div>
                <div className="text-xs text-slate-600 mt-1">Consolidated material yield optimization and robotic welding cycle gains.</div>
                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
                  <span>Margin: <strong className="text-emerald-600">22.8%</strong></span>
                  <span>Retention: <strong className="text-slate-900">AED 485K</strong></span>
                </div>
              </div>
            </div>
          )}

          {activeDrillLevel === 'department' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div 
                onClick={() => setActiveDrillLevel('project')}
                className="p-5 rounded-xl border-2 border-orange-500/40 bg-orange-50/40 hover:bg-orange-50 cursor-pointer transition-all hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-orange-200 text-orange-800">DEPT-01</span>
                  <ArrowUpRight className="w-4 h-4 text-orange-600" />
                </div>
                <h4 className="text-base font-bold text-slate-900 mt-2">1. Operations & Workshop</h4>
                <p className="text-xs text-slate-600 mt-1">Project management, shop-floor execution, CNC cutting, MIG welding, and site installation.</p>
                <div className="mt-4 pt-3 border-t border-orange-200/80 text-xs flex justify-between">
                  <span className="text-slate-500">Utilization: <strong className="text-slate-800">89%</strong></span>
                  <span className="text-orange-700 font-semibold">Click to Drill Projects →</span>
                </div>
              </div>

              <div 
                onClick={() => setActiveDrillLevel('project')}
                className="p-5 rounded-xl border border-slate-200 hover:border-sky-400 bg-white hover:bg-sky-50/30 cursor-pointer transition-all hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-sky-100 text-sky-800">DEPT-02</span>
                  <ArrowUpRight className="w-4 h-4 text-sky-600" />
                </div>
                <h4 className="text-base font-bold text-slate-900 mt-2">2. Quality Assurance (QA/QC)</h4>
                <p className="text-xs text-slate-600 mt-1">ITP inspection plans, NDT testing, digital checklists, NCR quarantine, and CAPA resolution.</p>
                <div className="mt-4 pt-3 border-t border-slate-200 text-xs flex justify-between">
                  <span className="text-slate-500">Inspections: <strong className="text-slate-800">42 Run</strong></span>
                  <span className="text-sky-700 font-semibold">View QA Matrix →</span>
                </div>
              </div>

              <div 
                onClick={() => setActiveDrillLevel('project')}
                className="p-5 rounded-xl border border-slate-200 hover:border-emerald-400 bg-white hover:bg-emerald-50/30 cursor-pointer transition-all hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">DEPT-03</span>
                  <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                </div>
                <h4 className="text-base font-bold text-slate-900 mt-2">3. Product & Resource Master</h4>
                <p className="text-xs text-slate-600 mt-1">Multi-level BOMs, operation routings, CNC fiber lasers, robotic welders, and maintenance.</p>
                <div className="mt-4 pt-3 border-t border-slate-200 text-xs flex justify-between">
                  <span className="text-slate-500">Machines: <strong className="text-slate-800">12 Assets</strong></span>
                  <span className="text-emerald-700 font-semibold">View Master Data →</span>
                </div>
              </div>
            </div>
          )}

          {activeDrillLevel === 'project' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Select a project to inspect Work Packages & shop-floor tasks:</span>
                <span className="font-semibold text-indigo-600">{projects.length} Projects in Database</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.map(p => (
                  <div 
                    key={p.id}
                    onClick={() => { setSelectedProjectId(p.id); setActiveDrillLevel('work_package'); }}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedProjectId === p.id ? 'border-indigo-600 bg-indigo-50/40 shadow-sm' : 'border-slate-200 bg-white hover:border-indigo-300'}`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-900 text-white">{p.projectCode}</span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">{p.status}</span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 mt-2">{p.name}</h4>
                        <div className="text-xs text-slate-500 mt-0.5">Client: <strong className="text-slate-700">{p.clientName}</strong></div>
                      </div>
                      <ArrowUpRight className="w-5 h-5 text-indigo-600" />
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Contract Value</span>
                        <span className="font-semibold text-slate-900">AED {(p.contract.contractValue / 1000).toFixed(0)}K</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Actual Absorbed</span>
                        <span className="font-semibold text-slate-900">AED {(p.costs.totalActual / 1000).toFixed(0)}K</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Progress</span>
                        <span className="font-bold text-indigo-600">{p.overallProgress}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeDrillLevel === 'work_package' && (
            <div>
              {(() => {
                const currentProj = projects.find(p => p.id === selectedProjectId) || projects[0];
                if (!currentProj) return <div className="text-xs text-slate-400">No project selected</div>;

                return (
                  <div className="space-y-4">
                    <div className="p-3.5 bg-slate-900 text-white rounded-xl flex items-center justify-between">
                      <div>
                        <span className="text-xs text-amber-400 font-semibold">{currentProj.projectCode}</span>
                        <div className="text-sm font-bold">{currentProj.name}</div>
                      </div>
                      <button 
                        onClick={() => setActiveDrillLevel('project')}
                        className="text-xs px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700"
                      >
                        ← Back to Projects
                      </button>
                    </div>

                    <h5 className="text-xs font-bold uppercase text-slate-500 tracking-wider mt-2">
                      Decomposed Work Packages & Active Shop-Floor Operations:
                    </h5>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {currentProj.workPackages.map(wp => (
                        <div key={wp.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-900">{wp.code}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${wp.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                              {wp.status}
                            </span>
                          </div>
                          <div className="text-xs font-semibold text-slate-800 mt-1">{wp.name}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">Lead: {wp.leadEngineer}</div>

                          <div className="w-full bg-slate-200 h-1.5 rounded-full mt-3 overflow-hidden">
                            <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${wp.progress}%` }} />
                          </div>
                          <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                            <span>Completion: {wp.progress}%</span>
                            <span>Budget: AED {(wp.budgetAmount / 1000).toFixed(0)}k</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Operational Tasks linked */}
                    <div className="mt-4 border border-slate-200 rounded-xl overflow-hidden">
                      <div className="bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-700 border-b border-slate-200">
                        Dispatched Workshop Operations & Job Cards
                      </div>
                      <div className="divide-y divide-slate-100 bg-white">
                        {currentProj.tasks.map(task => (
                          <div key={task.id} className="p-3 text-xs flex flex-col md:flex-row md:items-center justify-between gap-2 hover:bg-slate-50">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900">{task.taskNumber}</span>
                                <span className="font-medium text-slate-700">{task.title}</span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${task.status === 'Done' ? 'bg-emerald-100 text-emerald-800' : 'bg-sky-100 text-sky-800'}`}>
                                  {task.status}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                Station: <strong>{task.workCenterName}</strong> • Operator: {task.assignedToName}
                              </div>
                            </div>
                            <div className="text-right text-xs">
                              <div className="text-slate-700 font-medium">
                                {task.quantityCompleted} / {task.quantityPlanned} Completed
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {task.actualHours} hrs logged / {task.plannedHours} planned
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      {/* Executive Reusable Approval Engine Queue */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-500" />
              Central Multi-Step Approval Engine
            </h3>
            <p className="text-xs text-slate-500">
              Universal approval pipeline supporting Project Charters, Variation Orders, Quality Concessions, and Engineering Revisions.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            {pendingApprovals.length} Awaiting Executive Review
          </span>
        </div>

        <div className="mt-4 divide-y divide-slate-100">
          {approvals.map(req => (
            <div key={req.id} className="py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">
                    {req.entityType}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900">{req.entityTitle}</h4>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${req.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                    {req.status}
                  </span>
                </div>
                <div className="text-xs text-slate-500">
                  Project: <strong>{req.projectCode}</strong> • Submitted by: {req.requestedBy} • Step {req.currentStepOrder} of {req.totalSteps}
                </div>
                {req.financialAmount && (
                  <div className="text-xs font-semibold text-indigo-700">
                    Financial Impact: AED {req.financialAmount.toLocaleString()}
                  </div>
                )}
              </div>

              {req.status === 'Pending' && (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleApprovalAction(req.id, 'Approved')}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
                  >
                    Approve Request
                  </button>
                  <button 
                    onClick={() => handleApprovalAction(req.id, 'Rejected')}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
