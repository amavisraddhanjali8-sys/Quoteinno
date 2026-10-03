import React, { useState, useEffect } from 'react';
import { 
  FolderKanban, FileText, ShieldCheck, AlertOctagon, Layers, Factory
} from 'lucide-react';
import { centralApiGateway } from '../../../services/centralApiGateway';
import { UnifiedProjectControlRecord } from '../../../types/operationalControl';
import { useSecurity } from '../../../context/SecurityContext';
import { ProjectAssignedFactoriesPanel } from '../../factory/ProjectAssignedFactoriesPanel';
import { RoleScopedFactoryProjectHub } from './RoleScopedFactoryProjectHub';

export const ProjectManagementPortal: React.FC = () => {
  const { currentUser } = useSecurity();
  const [projects, setProjects] = useState<UnifiedProjectControlRecord[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('proj-001');
  const [activeSubTab, setActiveSubTab] = useState<
    'overview' | 'factories_erp' | 'contract_scope' | 'boq_budget' | 'schedule_tasks' | 'quality_issues' | 'variations_payments'
  >('overview');
  const [isUpdatingProgress, setIsUpdatingProgress] = useState(false);
  const [progressVal, setProgressVal] = useState(68);

  useEffect(() => {
    try {
      const projs = centralApiGateway.getProjects(currentUser);
      setProjects(projs);
      if (projs.length > 0 && !selectedProjectId) {
        setSelectedProjectId(projs[0].id);
        setProgressVal(projs[0].overallProgress);
      }
    } catch (e) {
      console.error(e);
    }
  }, [currentUser]);

  const activeProject = projects.find(p => p.id === selectedProjectId) || projects[0];

  const handleProgressSave = () => {
    if (!activeProject) return;
    try {
      const updated = centralApiGateway.updateProjectProgress(currentUser, activeProject.id, progressVal);
      setProjects(projects.map(p => p.id === updated.id ? updated : p));
      setIsUpdatingProgress(false);
    } catch (err: any) {
      alert(err.message || 'Progress update failed');
    }
  };

  if (!activeProject) {
    return (
      <div className="p-8 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
        No projects available in current authorization scope.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Project Selector */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-200">
                Project Control Center
              </span>
              <span className="text-xs text-slate-400">All-in-One Connected Project Ledger</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <FolderKanban className="w-6 h-6 text-orange-600" />
              {activeProject.projectCode}: {activeProject.name}
            </h2>
            <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3">
              <span>Client: <strong className="text-slate-800">{activeProject.clientName}</strong></span>
              <span>•</span>
              <span>Branch: <strong className="text-slate-800">{activeProject.branch}</strong></span>
              <span>•</span>
              <span>Status: <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">{activeProject.status}</span></span>
              <span>•</span>
              <span>Health: <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-semibold">{activeProject.health}</span></span>
            </div>
          </div>

          {/* Project Switcher */}
          <div className="flex items-center gap-3">
            <select
              value={selectedProjectId}
              onChange={e => {
                setSelectedProjectId(e.target.value);
                const pr = projects.find(p => p.id === e.target.value);
                if (pr) setProgressVal(pr.overallProgress);
              }}
              className="px-3 py-2 text-xs font-medium border border-slate-300 rounded-xl bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.projectCode} - {p.name}</option>
              ))}
            </select>

            <button 
              onClick={() => setIsUpdatingProgress(!isUpdatingProgress)}
              className="px-3 py-2 text-xs font-semibold bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow-xs transition-colors"
            >
              Update Progress
            </button>
          </div>
        </div>

        {/* Quick Progress Bar & Inline Editor */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold text-slate-700">Consolidated Physical Progress</span>
            <span className="font-bold text-orange-600">{activeProject.overallProgress}% Complete</span>
          </div>
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-orange-500 to-amber-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${activeProject.overallProgress}%` }}
            />
          </div>

          {isUpdatingProgress && (
            <div className="mt-4 p-4 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1">
                <label className="text-xs font-bold text-orange-900">Set Verified Progress (%):</label>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={progressVal}
                  onChange={e => setProgressVal(Number(e.target.value))}
                  className="flex-1 accent-orange-600"
                />
                <span className="text-sm font-bold text-orange-900 w-12 text-center">{progressVal}%</span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleProgressSave}
                  className="px-3 py-1.5 text-xs font-bold bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  Save to API
                </button>
                <button 
                  onClick={() => setIsUpdatingProgress(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Control Center Connected Sub-Tabs */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-4 border-t border-slate-100">
          <button
            onClick={() => setActiveSubTab('overview')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${activeSubTab === 'overview' ? 'bg-orange-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
          >
            Overview & Hub
          </button>
          <button
            onClick={() => setActiveSubTab('factories_erp')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${activeSubTab === 'factories_erp' ? 'bg-orange-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
          >
            <Factory className="w-3.5 h-3.5" />
            Assigned Factories & ERP Updates
          </button>
          <button
            onClick={() => setActiveSubTab('contract_scope')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${activeSubTab === 'contract_scope' ? 'bg-orange-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
          >
            Customer, Contract & Scope
          </button>
          <button
            onClick={() => setActiveSubTab('boq_budget')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${activeSubTab === 'boq_budget' ? 'bg-orange-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
          >
            BOQ, Budget & Costs
          </button>
          <button
            onClick={() => setActiveSubTab('schedule_tasks')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${activeSubTab === 'schedule_tasks' ? 'bg-orange-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
          >
            Schedule, Milestones & Tasks
          </button>
          <button
            onClick={() => setActiveSubTab('quality_issues')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${activeSubTab === 'quality_issues' ? 'bg-orange-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
          >
            Quality, NCRs & Issues
          </button>
          <button
            onClick={() => setActiveSubTab('variations_payments')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${activeSubTab === 'variations_payments' ? 'bg-orange-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
          >
            Variations & Payments
          </button>
        </div>
      </div>

      {/* Assigned Factories & ERP Updates (Always available on Overview or Factories Tab) */}
      {(activeSubTab === 'overview' || activeSubTab === 'factories_erp') && (
        <div className="space-y-4">
          <ProjectAssignedFactoriesPanel
            project={activeProject}
          />
          {activeSubTab === 'factories_erp' && (
            <RoleScopedFactoryProjectHub
              portalName="Project Control — Factory Supervisors, Procurement, HR & Finance"
              defaultSubTab="supervisors"
            />
          )}
        </div>
      )}

      {/* Subtab Contents */}
      {activeSubTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Key Metrics Column */}
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Financial Snapshot</h4>
              <div className="mt-3 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Contract Value:</span>
                  <span className="font-bold text-slate-900">AED {activeProject.contract.contractValue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Allocated Budget:</span>
                  <span className="font-bold text-slate-900">AED {activeProject.budget.totalBudget.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Actual Cost Incurred:</span>
                  <span className="font-bold text-slate-900">AED {activeProject.costs.totalActual.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Projected Margin:</span>
                  <span className="font-bold text-emerald-600">+AED {activeProject.costs.variance.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Quality & Safety Status</h4>
              <div className="mt-3 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Open NCRs:</span>
                  <span className="font-bold text-amber-600">{activeProject.openNcrCount} Pending</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Active Quality Holds:</span>
                  <span className="font-bold text-emerald-600">{activeProject.activeHoldCount} Zero Stop</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Documents Vault:</span>
                  <span className="font-bold text-indigo-600">{activeProject.documentsCount} Attachments</span>
                </div>
              </div>
            </div>
          </div>

          {/* Work Packages List */}
          <div className="md:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900">WBS Work Packages ({activeProject.workPackages.length})</h4>
              <span className="text-xs text-slate-400">Engineering to Handover Breakdown</span>
            </div>

            <div className="space-y-3">
              {activeProject.workPackages.map(wp => (
                <div key={wp.id} className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-all bg-slate-50/50">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900 text-white">{wp.code}</span>
                        <h5 className="text-xs font-bold text-slate-900">{wp.name}</h5>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{wp.scopeSummary}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${wp.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                      {wp.status}
                    </span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-200/70 grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Lead</span>
                      <span className="font-medium text-slate-800">{wp.leadEngineer}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Budget Absorbed</span>
                      <span className="font-medium text-slate-800">AED {(wp.actualCost / 1000).toFixed(0)}K / {(wp.budgetAmount / 1000).toFixed(0)}K</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Progress</span>
                      <span className="font-bold text-orange-600">{wp.progress}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'contract_scope' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-orange-600" />
                Contract Particulars
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">Contract Number:</span>
                  <span className="font-semibold text-slate-800">{activeProject.contract.contractNumber}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">Client:</span>
                  <span className="font-semibold text-slate-800">{activeProject.contract.clientName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">Total Contract Value:</span>
                  <span className="font-bold text-emerald-600">AED {activeProject.contract.contractValue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">Retention Clause:</span>
                  <span className="font-semibold text-slate-800">{activeProject.contract.retentionPercent}%</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Payment Terms:</span>
                  <span className="font-semibold text-slate-800">{activeProject.contract.paymentTerms}</span>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                Technical Scope of Work
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed">
                {activeProject.scopeSummary}
              </p>
              <div className="mt-4 pt-3 border-t border-slate-200 text-xs text-slate-500">
                Penalty Terms: <span className="font-medium text-slate-700">{activeProject.contract.penaltyClause}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'boq_budget' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <span className="text-xs text-slate-400 block">BOQ Total Line Items</span>
              <span className="text-xl font-bold text-slate-900">{activeProject.boqSummary.totalItems} Items</span>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <span className="text-xs text-slate-400 block">Total Material Weight</span>
              <span className="text-xl font-bold text-slate-900">{activeProject.boqSummary.totalMaterialWeightKg.toLocaleString()} KG</span>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <span className="text-xs text-slate-400 block">Consolidated BOQ Value</span>
              <span className="text-xl font-bold text-emerald-600">AED {activeProject.boqSummary.boqValue.toLocaleString()}</span>
            </div>
          </div>

          <h4 className="text-sm font-bold text-slate-900 pt-2">Budget Allocation vs Actual Cost Absorption:</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="p-3 border border-slate-200 rounded-xl">
              <span className="text-slate-400 block">Materials</span>
              <div className="font-bold text-slate-900 mt-1">AED {activeProject.costs.actualMaterial.toLocaleString()}</div>
              <span className="text-[10px] text-slate-500">Budget: AED {activeProject.budget.allocatedMaterial.toLocaleString()}</span>
            </div>
            <div className="p-3 border border-slate-200 rounded-xl">
              <span className="text-slate-400 block">Workshop Labor</span>
              <div className="font-bold text-slate-900 mt-1">AED {activeProject.costs.actualLabor.toLocaleString()}</div>
              <span className="text-[10px] text-slate-500">Budget: AED {activeProject.budget.allocatedLabor.toLocaleString()}</span>
            </div>
            <div className="p-3 border border-slate-200 rounded-xl">
              <span className="text-slate-400 block">Machine Operations</span>
              <div className="font-bold text-slate-900 mt-1">AED {activeProject.costs.actualMachine.toLocaleString()}</div>
              <span className="text-[10px] text-slate-500">Budget: AED {activeProject.budget.allocatedMachine.toLocaleString()}</span>
            </div>
            <div className="p-3 border border-slate-200 rounded-xl">
              <span className="text-slate-400 block">Subcontracts</span>
              <div className="font-bold text-slate-900 mt-1">AED {activeProject.costs.actualSubcontract.toLocaleString()}</div>
              <span className="text-[10px] text-emerald-600 font-semibold">Under Ceiling</span>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'schedule_tasks' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-900">Contractual Milestones & Billing Triggers:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {activeProject.milestones.map(m => (
                <div key={m.id} className="p-4 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900">{m.name}</span>
                    <div className="text-slate-500 mt-0.5">Target: {m.targetDate} {m.actualDate && `• Achieved: ${m.actualDate}`}</div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${m.status === 'Achieved' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>
                      {m.status}
                    </span>
                    <div className="text-slate-700 font-bold mt-1">AED {m.billingAmount.toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h4 className="text-sm font-bold text-slate-900">Dispatched Operational Tasks & Job Cards:</h4>
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {activeProject.tasks.map(t => (
                <div key={t.id} className="p-4 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{t.taskNumber}</span>
                      <span className="font-semibold text-slate-800">{t.title}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${t.status === 'Done' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                        {t.status}
                      </span>
                    </div>
                    <div className="text-slate-500 mt-1">
                      Station: <strong>{t.workCenterName}</strong> • Assigned: {t.assignedToName}
                    </div>
                  </div>
                  <div className="text-right text-xs">
                    <div className="font-bold text-slate-900">{t.quantityCompleted} / {t.quantityPlanned} Completed</div>
                    <div className="text-[10px] text-slate-400">{t.actualHours} hrs logged</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'quality_issues' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Quality Holds & NCRs ({activeProject.openNcrCount})
              </h4>
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-900">NCR-2026-0018: Bracket Pitch Deviation</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-200 text-amber-900">Disposition Assigned</span>
                </div>
                <p className="text-slate-600 mt-1">Hole pitch deviation on 4 screen panels. Quarantined in Bay QC-02.</p>
                <div className="mt-2 text-slate-500">Disposition: <strong>Rework</strong> • COPQ: AED 2,800</div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-rose-600" />
                Active Project Issues ({activeProject.issues.length})
              </h4>
              {activeProject.issues.map(iss => (
                <div key={iss.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{iss.issueNumber}: {iss.title}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-800">{iss.status}</span>
                  </div>
                  <div className="text-slate-600 mt-1">Plan: {iss.resolutionPlan}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'variations_payments' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div>
            <h4 className="text-sm font-bold text-slate-900">Approved & Pending Variations (VO):</h4>
            <div className="mt-3 space-y-3">
              {activeProject.variations.map(v => (
                <div key={v.id} className="p-4 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{v.variationNumber}</span>
                      <span className="font-semibold text-slate-800">{v.title}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">{v.approvalStatus}</span>
                    </div>
                    <div className="text-slate-500 mt-0.5">Reason: {v.reason} • Schedule Impact: +{v.timeImpactDays} days</div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-indigo-700 text-sm">AED {v.costImpact.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-sm font-bold text-slate-900">Payment Milestones & Invoices:</h4>
            <div className="mt-3 space-y-2">
              {activeProject.payments.map(p => (
                <div key={p.id} className="p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900">{p.invoiceNumber}</span>
                    <span className="text-slate-500 ml-2">({p.milestoneName})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-900">AED {p.amount.toLocaleString()}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${p.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                      {p.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
