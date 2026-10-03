import React, { useState, useMemo } from 'react';
import { 
  Folder, 
  Search, 
  User, 
  AlertTriangle, 
  GanttChart, 
  ChevronRight,
  FileCheck2,
  HardHat,
  Check,
  Plus,
  Trash2,
  Edit2,
  X,
  Factory
} from 'lucide-react';
import { Project, ProjectPhase, Personnel, Equipment } from '../types';
import { cn } from '../lib/utils';
import { ExportActions } from './common/ExportActions';
import { downloadCSV, downloadPDFTable } from '../services/dataExportService';
import { ProjectAssignedFactoriesPanel } from './factory/ProjectAssignedFactoriesPanel';

interface LifecyclePhaseItem {
  id: string;
  name: string;
  status: 'Completed' | 'In Progress' | 'Pending';
  date: string;
  owner: string;
}

interface RiskItem {
  id: string;
  title: string;
  severity: 'High' | 'Medium' | 'Low';
  mitigation: string;
  status: 'Controlled' | 'Active' | 'Resolved';
}

interface HandoverItem {
  id: string;
  title: string;
  completed: boolean;
}

interface ProjectLifecyclePortalProps {
  projects: Project[];
  projectPhases?: ProjectPhase[];
  personnel?: Personnel[];
  equipment?: Equipment[];
  onViewProject: (p: Project) => void;
  onUpdateStatus: (id: string, status: Project['status']) => void;
  onDeleteProject?: (id: string) => void;
  initialTab?: 'dashboard' | 'phases' | 'risks' | 'handover' | 'factories_erp';
}

export const ProjectLifecyclePortal: React.FC<ProjectLifecyclePortalProps> = ({ 
  projects,
  onViewProject,
  onUpdateStatus,
  onDeleteProject,
  initialTab = 'dashboard'
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'phases' | 'risks' | 'handover' | 'factories_erp'>(initialTab);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(projects[0]?.id || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | Project['status']>('All');
  const [projectCodeFilter, setProjectCodeFilter] = useState<string>('All');

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  React.useEffect(() => {
    if (!selectedProjectId && projects.length > 0) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  // Selected project for detail view
  const selectedProject = useMemo(() => 
    projects.find(p => p.id === selectedProjectId), 
    [projects, selectedProjectId]
  );

  const stats = useMemo(() => {
    const active = projects.filter(p => p.status === 'In Progress');
    const completed = projects.filter(p => p.status === 'Completed');
    const onHold = projects.filter(p => p.status === 'On Hold');
    const totalVal = projects.reduce((s, p) => s + (p.totalValue || 0), 0);

    return {
      totalProjects: projects.length,
      inProgress: active.length,
      completed: completed.length,
      onHold: onHold.length,
      totalValue: totalVal,
      avgProgress: active.length > 0 ? 68 : 100
    };
  }, [projects]);

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const pCode = p.projectCode || p.id;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        p.projectName.toLowerCase().includes(q) ||
        pCode.toLowerCase().includes(q) ||
        p.client.name.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
      const matchesProjectCode = projectCodeFilter === 'All' || p.id === projectCodeFilter || p.projectCode === projectCodeFilter;
      return matchesSearch && matchesStatus && matchesProjectCode;
    });
  }, [projects, searchQuery, statusFilter, projectCodeFilter]);

  // Interactive Phases state
  const [phasesList, setPhasesList] = useState<LifecyclePhaseItem[]>([
    { id: 'p1', name: 'Design Sign-off & BOQ Finalization', status: 'Completed', date: 'Oct 04', owner: 'Design Lead' },
    { id: 'p2', name: 'Aluminium Extrusion & Powder-Coating', status: 'In Progress', date: 'Oct 14', owner: 'Fabrication Team' },
    { id: 'p3', name: 'Glass Toughening & Glazing Assembly', status: 'Pending', date: 'Oct 22', owner: 'Glass Factory' },
    { id: 'p4', name: 'Site Structural Anchor Alignment', status: 'Pending', date: 'Nov 02', owner: 'Site Engineer' },
    { id: 'p5', name: 'Final Water Tightness & QA Handover', status: 'Pending', date: 'Nov 12', owner: 'QA Inspector' }
  ]);

  // Interactive Risks state
  const [risksList, setRisksList] = useState<RiskItem[]>([
    { id: 'r1', title: 'Extrusion Profile Custom Dye Delay', severity: 'Medium', mitigation: 'Pre-ordered 15% surplus buffer stock', status: 'Controlled' },
    { id: 'r2', title: 'Heavy Monsoon Rain at Site B Opening', severity: 'High', mitigation: 'Mobile temporary scaffolding weather-tarps installed', status: 'Active' },
    { id: 'r3', title: 'Specialized Crane Access Clearance', severity: 'Low', mitigation: 'Municipal traffic permit cleared for Sunday hoisting', status: 'Resolved' }
  ]);

  // Interactive Handover Checklist state
  const [handoverChecklist, setHandoverChecklist] = useState<HandoverItem[]>([
    { id: 'h1', title: 'As-Built CAD & Elevation Drawings Submitted', completed: true },
    { id: 'h2', title: 'Silicone Joint Pressure & Spray Test Certified', completed: true },
    { id: 'h3', title: 'Double-Glazed Warranty Certificates Handed Over', completed: false },
    { id: 'h4', title: 'Client Operation & Maintenance Manual Delivered', completed: false },
    { id: 'h5', title: 'Final Retention Release Documentation Signed', completed: false }
  ]);

  // Modals
  const [isAddingPhase, setIsAddingPhase] = useState(false);
  const [editingPhase, setEditingPhase] = useState<LifecyclePhaseItem | null>(null);
  const [phaseForm, setPhaseForm] = useState({
    name: '',
    status: 'Pending' as LifecyclePhaseItem['status'],
    date: 'Nov 15',
    owner: 'Site Engineer'
  });

  const [isAddingRisk, setIsAddingRisk] = useState(false);
  const [editingRisk, setEditingRisk] = useState<RiskItem | null>(null);
  const [riskForm, setRiskForm] = useState({
    title: '',
    severity: 'Medium' as RiskItem['severity'],
    mitigation: '',
    status: 'Active' as RiskItem['status']
  });

  const [isAddingHandover, setIsAddingHandover] = useState(false);
  const [editingHandover, setEditingHandover] = useState<HandoverItem | null>(null);
  const [handoverForm, setHandoverForm] = useState({
    title: '',
    completed: false
  });

  // Handlers
  const handleDeletePhase = (id: string) => {
    if (window.confirm('Delete this project lifecycle milestone phase?')) {
      setPhasesList(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleSavePhase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phaseForm.name.trim()) return;

    if (editingPhase) {
      setPhasesList(prev => prev.map(p => p.id === editingPhase.id ? { ...editingPhase, ...phaseForm } : p));
      setEditingPhase(null);
    } else {
      setPhasesList(prev => [...prev, { id: `p-${Date.now()}`, ...phaseForm }]);
      setIsAddingPhase(false);
    }
  };

  const handleDeleteRisk = (id: string) => {
    if (window.confirm('Delete this risk register item?')) {
      setRisksList(prev => prev.filter(r => r.id !== id));
    }
  };

  const handleSaveRisk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!riskForm.title.trim()) return;

    if (editingRisk) {
      setRisksList(prev => prev.map(r => r.id === editingRisk.id ? { ...editingRisk, ...riskForm } : r));
      setEditingRisk(null);
    } else {
      setRisksList(prev => [...prev, { id: `r-${Date.now()}`, ...riskForm }]);
      setIsAddingRisk(false);
    }
  };

  const handleDeleteHandover = (id: string) => {
    if (window.confirm('Delete this handover checklist criterion?')) {
      setHandoverChecklist(prev => prev.filter(h => h.id !== id));
    }
  };

  const handleSaveHandover = (e: React.FormEvent) => {
    e.preventDefault();
    if (!handoverForm.title.trim()) return;

    if (editingHandover) {
      setHandoverChecklist(prev => prev.map(h => h.id === editingHandover.id ? { ...editingHandover, ...handoverForm } : h));
      setEditingHandover(null);
    } else {
      setHandoverChecklist(prev => [...prev, { id: `h-${Date.now()}`, ...handoverForm }]);
      setIsAddingHandover(false);
    }
  };

  const toggleHandover = (id: string) => {
    setHandoverChecklist(prev => prev.map(h => h.id === id ? { ...h, completed: !h.completed } : h));
  };

  return (
    <div className="space-y-2.5 pb-8">
      {/* Title Ribbon - One Line Ribbon with Simple Description & Only Buttons */}
      <header className="px-5 py-2.5 bg-white border border-slate-200/80 rounded-xl shadow-2xs">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <GanttChart size={16} />
            </div>
            <div className="flex items-baseline gap-2 min-w-0">
              <h1 className="text-sm font-bold text-slate-900 whitespace-nowrap">Project Lifecycle</h1>
              <span className="text-xs text-slate-500 font-normal truncate hidden sm:inline">
                • Phases, delivery tracking & handover ({stats.totalProjects} projects, {stats.inProgress} active)
              </span>
            </div>
          </div>

          {/* Action Buttons ONLY */}
          <div className="flex items-center gap-2 shrink-0">
            <ExportActions 
              onExportCSV={() => {
                const headers = ['Project Name', 'Client', 'Status', 'Value'];
                const rows = projects.map(p => [
                  `"${p.projectName}"`,
                  `"${p.client.name}"`,
                  `"${p.status}"`,
                  `"${p.totalValue || p.originalSum || 0}"`
                ]);
                downloadCSV(`projects-lifecycle-${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
              }}
              onExportPDF={() => {
                const headers = ['Project', 'Client', 'Status', 'Value'];
                const rows = projects.map(p => {
                  const val = p.totalValue || p.originalSum || 0;
                  return [
                    p.projectName,
                    p.client.name,
                    p.status,
                    val ? `LKR ${val.toLocaleString()}` : '-'
                  ];
                });
                downloadPDFTable('Projects Lifecycle Summary', headers, rows, 'projects-lifecycle.pdf', 'Overview of project progress and statuses');
              }}
              labelCSV="CSV"
              labelPDF="PDF"
            />
          </div>
        </div>
      </header>

      {/* Sub Portals Navigation Tabs */}
      <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/80 overflow-x-auto">
        {[
          { id: 'dashboard', label: 'Fleet Overview', icon: Folder },
          { id: 'factories_erp', label: 'Assigned Factories & ERP Updates', icon: Factory },
          { id: 'phases', label: 'Lifecycle Phases', icon: GanttChart },
          { id: 'risks', label: 'Risk Matrix', icon: AlertTriangle },
          { id: 'handover', label: 'QC & Handover', icon: FileCheck2 },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap",
              activeTab === tab.id 
                ? "bg-white text-slate-900 shadow-xs border border-slate-200/60 font-semibold" 
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            )}
          >
            <tab.icon size={13} className={activeTab === tab.id ? "text-orange-500" : "text-slate-400"} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Main Tab 1: Fleet Overview & Active Execution */}
      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left 2 Cols: Projects Table */}
          <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden flex flex-col">
            <div className="p-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/40">
              <div className="relative flex-1 max-w-sm">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Search by Project Code (PK), Name, Client..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:border-orange-500 transition-colors shadow-2xs"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Project Code (PK) Filter */}
                <div className="flex items-center gap-1.5 bg-orange-50/70 px-2.5 py-1.5 rounded-xl border border-orange-200/80">
                  <Folder size={12} className="text-orange-500 shrink-0" />
                  <select
                    value={projectCodeFilter}
                    onChange={(e) => setProjectCodeFilter(e.target.value)}
                    className="bg-transparent text-xs font-semibold text-orange-900 outline-none cursor-pointer max-w-[170px] truncate"
                    title="Filter by Project Code (Primary Key)"
                  >
                    <option value="All">All Projects (PK)</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.projectCode || p.id} - {p.projectName}
                      </option>
                    ))}
                  </select>
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none shadow-2xs cursor-pointer"
                >
                  <option value="All">All Statuses</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="On Hold">On Hold</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/75 text-[10px] font-bold text-slate-600 uppercase tracking-wider select-none whitespace-nowrap">
                    <th className="py-2.5 px-3">Project Code (PK)</th>
                    <th className="py-2.5 px-3">Project Name</th>
                    <th className="py-2.5 px-3">Client Account</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-center">Progress</th>
                    <th className="py-2.5 px-3 text-right">Contract Value</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredProjects.map((p) => {
                    const isSelected = p.id === selectedProjectId;
                    return (
                      <tr 
                        key={p.id}
                        onClick={() => setSelectedProjectId(p.id)}
                        className={cn(
                          "cursor-pointer transition-colors hover:bg-slate-50/80 whitespace-nowrap group",
                          isSelected ? "bg-orange-50/40" : ""
                        )}
                      >
                        {/* PK: Project Code */}
                        <td className="py-2.5 px-3">
                          <span 
                            className="font-mono font-bold text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-200/80 inline-flex items-center gap-1 shadow-2xs"
                            title={`Primary Key: Project Code ${p.projectCode || p.id}`}
                          >
                            <Folder size={11} className="text-orange-500 shrink-0" />
                            <span>PK: {p.projectCode || p.id.slice(0, 10)}</span>
                          </span>
                        </td>

                        {/* Project Name (Single Line) */}
                        <td className="py-2.5 px-3 max-w-[200px]">
                          <span className="font-semibold text-slate-900 truncate block" title={p.projectName}>
                            {p.projectName}
                          </span>
                        </td>

                        {/* Client Account (Single Line) */}
                        <td className="py-2.5 px-3 max-w-[160px]">
                          <div className="flex items-center gap-1 text-slate-600 truncate" title={p.client.name}>
                            <User size={11} className="text-slate-400 shrink-0" />
                            <span className="truncate">{p.client.name}</span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-2.5 px-3 text-center">
                          <select
                            value={p.status}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => onUpdateStatus(p.id, e.target.value as Project['status'])}
                            className={cn(
                              "px-2 py-0.5 rounded-full text-[10px] font-semibold border cursor-pointer focus:outline-none focus:ring-1 focus:ring-orange-500",
                              p.status === 'In Progress' ? "bg-amber-50 text-amber-700 border-amber-200" :
                              p.status === 'Completed' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                              "bg-slate-100 text-slate-700 border-slate-200"
                            )}
                          >
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                            <option value="On Hold">On Hold</option>
                          </select>
                        </td>

                        {/* Progress */}
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className={cn(
                                  "h-full rounded-full transition-all",
                                  p.status === 'Completed' ? "bg-emerald-500 w-full" : "bg-orange-500 w-2/3"
                                )}
                              />
                            </div>
                            <span className="font-mono text-[10px] text-slate-600">
                              {p.status === 'Completed' ? '100%' : '65%'}
                            </span>
                          </div>
                        </td>

                        {/* Contract Value */}
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                          {p.currency || 'LKR'} {(p.totalValue || 0).toLocaleString()}
                        </td>

                        {/* Actions */}
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onViewProject(p);
                              }}
                              className="px-2 py-1 text-[11px] font-medium text-slate-700 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors inline-flex items-center gap-1"
                            >
                              <span>Dossier</span>
                              <ChevronRight size={12} />
                            </button>
                            {onDeleteProject && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (window.confirm(`Delete project "${p.projectName}"?`)) {
                                    onDeleteProject(p.id);
                                  }
                                }}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Delete Project"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredProjects.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                        No projects matched your criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Sidebar: Active Lifecycle Milestone & Quick Dossier */}
          <div className="space-y-4">
            {/* Selected Project Milestone Card */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider text-[11px]">
                  {selectedProject ? selectedProject.projectName : 'Select Project'}
                </h3>
                <span className="text-[11px] font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                  Milestone Sequence
                </span>
              </div>

              {selectedProject ? (
                <div className="space-y-3 mt-4">
                  {phasesList.map((phase, idx) => (
                    <div key={phase.id} className="flex gap-3 items-start relative pb-3 last:pb-0">
                      {idx < phasesList.length - 1 && (
                        <div className="absolute left-3.5 top-6 bottom-0 w-px bg-slate-200" />
                      )}
                      <div className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold z-10",
                        phase.status === 'Completed' ? "bg-emerald-500 text-white" :
                        phase.status === 'In Progress' ? "bg-orange-500 text-white ring-4 ring-orange-100" :
                        "bg-slate-100 text-slate-400"
                      )}>
                        {phase.status === 'Completed' ? <Check size={14} /> : idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-semibold text-slate-800 truncate">{phase.name}</h5>
                          <span className="text-[10px] text-slate-400 font-mono">{phase.date}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{phase.owner} • {phase.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs">
                  Click any project row on the left to inspect its active milestone stage.
                </div>
              )}
            </div>

            {/* Safety & Compliance Card */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-slate-900">Site Execution Health</h3>
                <HardHat size={16} className="text-orange-500" />
              </div>
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Structural Seal QA</span>
                  <span className="font-semibold text-emerald-600">Passed (100%)</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">On-Site Installers</span>
                  <span className="font-semibold text-slate-800">14 Certified</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Days Lost to Injury</span>
                  <span className="font-semibold text-emerald-600">0 Days</span>
                </div>
              </div>
            </div>
          </div>

          {selectedProject && (
            <div className="lg:col-span-3">
              <ProjectAssignedFactoriesPanel project={selectedProject} />
            </div>
          )}
        </div>
      )}

      {/* Tab: Assigned Factories & ERP Updates */}
      {activeTab === 'factories_erp' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Select Project to View & Manage Assigned Factories</h3>
              <p className="text-xs text-slate-500">Inspect and manage Owned Factory ERP (Procurement, HR Payroll, Finance) and Partner Factory (Procurement, Contracts, Invoices) for the selected project.</p>
            </div>
            <select
              value={selectedProjectId || ''}
              onChange={e => setSelectedProjectId(e.target.value)}
              className="px-3 py-2 bg-orange-50 border border-orange-200 rounded-xl text-xs font-bold text-orange-900 outline-none"
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>
                  {p.projectCode || p.id} — {p.projectName}
                </option>
              ))}
            </select>
          </div>
          {selectedProject && (
            <ProjectAssignedFactoriesPanel project={selectedProject} />
          )}
        </div>
      )}

      {/* Tab 2: Lifecycle Phases & Timeline */}
      {activeTab === 'phases' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Standard Architectural Aluminium & Glazing Lifecycle</h3>
              <p className="text-xs text-slate-500 mt-0.5">Every project follows our rigorous engineering verification process.</p>
            </div>
            <button
              onClick={() => {
                setEditingPhase(null);
                setPhaseForm({
                  name: '',
                  status: 'Pending',
                  date: 'Nov 15',
                  owner: 'Site Engineer'
                });
                setIsAddingPhase(true);
              }}
              className="px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-medium transition-colors shadow-xs flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>Add Phase</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {phasesList.map((phase, idx) => (
              <div key={phase.id} className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 flex flex-col justify-between hover:border-slate-300 transition-colors">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-orange-600">Phase 0{idx+1}</span>
                    <div className="flex items-center gap-1">
                      <span className={cn(
                        "text-[10px] font-medium px-2 py-0.5 rounded-full",
                        phase.status === 'Completed' ? "bg-emerald-50 text-emerald-700" :
                        phase.status === 'In Progress' ? "bg-orange-50 text-orange-700" :
                        "bg-slate-100 text-slate-600"
                      )}>
                        {phase.status}
                      </span>
                      <button
                        onClick={() => {
                          setEditingPhase(phase);
                          setPhaseForm({
                            name: phase.name,
                            status: phase.status,
                            date: phase.date,
                            owner: phase.owner
                          });
                        }}
                        className="p-1 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                        title="Edit Phase"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        onClick={() => handleDeletePhase(phase.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete Phase"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                  <h4 className="text-xs font-semibold text-slate-900">{phase.name}</h4>
                  <p className="text-[11px] text-slate-500 mt-1">Responsible: {phase.owner}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Target Date</span>
                  <span className="font-mono text-slate-700 font-medium">{phase.date}, 2026</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Risk Register */}
      {activeTab === 'risks' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Active Risk Register & Mitigation</h3>
              <p className="text-xs text-slate-500 mt-0.5">Preventative measures recorded by site engineers.</p>
            </div>
            <button
              onClick={() => {
                setEditingRisk(null);
                setRiskForm({
                  title: '',
                  severity: 'Medium',
                  mitigation: '',
                  status: 'Active'
                });
                setIsAddingRisk(true);
              }}
              className="px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-medium transition-colors shadow-xs flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>Log Risk Item</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {risksList.map(risk => (
              <div key={risk.id} className="p-4 bg-slate-50/60 border border-slate-200/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-[10px] font-medium px-2 py-0.5 rounded-md",
                      risk.severity === 'High' ? "bg-rose-50 text-rose-700" :
                      risk.severity === 'Medium' ? "bg-amber-50 text-amber-700" :
                      "bg-blue-50 text-blue-700"
                    )}>
                      {risk.severity} Severity
                    </span>
                    <h4 className="text-xs font-semibold text-slate-900">{risk.title}</h4>
                  </div>
                  <p className="text-xs text-slate-600">Mitigation: {risk.mitigation}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700">
                    {risk.status}
                  </span>
                  <button
                    onClick={() => {
                      setEditingRisk(risk);
                      setRiskForm({
                        title: risk.title,
                        severity: risk.severity,
                        mitigation: risk.mitigation,
                        status: risk.status
                      });
                    }}
                    className="p-1 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                    title="Edit Risk"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    onClick={() => handleDeleteRisk(risk.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete Risk"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: QC Handover Checklist */}
      {activeTab === 'handover' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Commissioning & Final Handover Checklist</h3>
              <p className="text-xs text-slate-500 mt-0.5">Mandatory protocols before issuance of retention release.</p>
            </div>
            <button
              onClick={() => {
                setEditingHandover(null);
                setHandoverForm({ title: '', completed: false });
                setIsAddingHandover(true);
              }}
              className="px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-medium transition-colors shadow-xs flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>Add Checklist Item</span>
            </button>
          </div>

          <div className="space-y-2">
            {handoverChecklist.map(item => (
              <div 
                key={item.id} 
                className="flex items-center justify-between p-3.5 bg-slate-50/60 border border-slate-200/80 rounded-xl"
              >
                <div 
                  onClick={() => toggleHandover(item.id)}
                  className="flex items-center gap-3 cursor-pointer flex-1"
                >
                  <div className={cn(
                    "w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors",
                    item.completed ? "bg-emerald-500 text-white" : "border border-slate-300 bg-white"
                  )}>
                    {item.completed && <Check size={13} />}
                  </div>
                  <span className={cn(
                    "text-xs font-medium select-none",
                    item.completed ? "text-slate-800 line-through opacity-80" : "text-slate-700"
                  )}>
                    {item.title}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingHandover(item);
                      setHandoverForm({
                        title: item.title,
                        completed: item.completed
                      });
                    }}
                    className="p-1 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                    title="Edit Item"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    onClick={() => handleDeleteHandover(item.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete Item"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Phase Modal */}
      {(isAddingPhase || editingPhase) && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                {editingPhase ? 'Edit Lifecycle Phase' : 'Add Lifecycle Milestone'}
              </h3>
              <button onClick={() => { setIsAddingPhase(false); setEditingPhase(null); }} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSavePhase} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phase Name *</label>
                <input
                  type="text"
                  required
                  value={phaseForm.name}
                  onChange={e => setPhaseForm({ ...phaseForm, name: e.target.value })}
                  placeholder="e.g. Aluminium Profile Cutting & Deburring"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-orange-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={phaseForm.status}
                    onChange={e => setPhaseForm({ ...phaseForm, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-orange-500 bg-white"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Date</label>
                  <input
                    type="text"
                    value={phaseForm.date}
                    onChange={e => setPhaseForm({ ...phaseForm, date: e.target.value })}
                    placeholder="e.g. Nov 15"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-orange-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Owner / Team Responsible</label>
                <input
                  type="text"
                  value={phaseForm.owner}
                  onChange={e => setPhaseForm({ ...phaseForm, owner: e.target.value })}
                  placeholder="e.g. Fabrication Lead"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-orange-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setIsAddingPhase(false); setEditingPhase(null); }}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-semibold shadow-xs"
                >
                  {editingPhase ? 'Save Changes' : 'Add Phase'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Risk Modal */}
      {(isAddingRisk || editingRisk) && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                {editingRisk ? 'Edit Risk Record' : 'Log Project Risk Item'}
              </h3>
              <button onClick={() => { setIsAddingRisk(false); setEditingRisk(null); }} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveRisk} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Risk Title *</label>
                <input
                  type="text"
                  required
                  value={riskForm.title}
                  onChange={e => setRiskForm({ ...riskForm, title: e.target.value })}
                  placeholder="e.g. Sealant curing delay due to weather"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-orange-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Severity</label>
                  <select
                    value={riskForm.severity}
                    onChange={e => setRiskForm({ ...riskForm, severity: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-orange-500 bg-white"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={riskForm.status}
                    onChange={e => setRiskForm({ ...riskForm, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-orange-500 bg-white"
                  >
                    <option value="Active">Active</option>
                    <option value="Controlled">Controlled</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mitigation Plan</label>
                <textarea
                  rows={2}
                  value={riskForm.mitigation}
                  onChange={e => setRiskForm({ ...riskForm, mitigation: e.target.value })}
                  placeholder="Actions taken to neutralize or manage this risk..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-orange-500 resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setIsAddingRisk(false); setEditingRisk(null); }}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-semibold shadow-xs"
                >
                  {editingRisk ? 'Save Risk' : 'Log Risk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Handover Modal */}
      {(isAddingHandover || editingHandover) && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                {editingHandover ? 'Edit Handover Item' : 'Add Handover Protocol'}
              </h3>
              <button onClick={() => { setIsAddingHandover(false); setEditingHandover(null); }} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveHandover} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Checklist Criterion *</label>
                <input
                  type="text"
                  required
                  value={handoverForm.title}
                  onChange={e => setHandoverForm({ ...handoverForm, title: e.target.value })}
                  placeholder="e.g. Acoustic & Thermal Insulation Certification Signed"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-orange-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="handoverChecked"
                  checked={handoverForm.completed}
                  onChange={e => setHandoverForm({ ...handoverForm, completed: e.target.checked })}
                  className="rounded text-orange-500"
                />
                <label htmlFor="handoverChecked" className="text-xs text-slate-700 font-medium">Mark as already completed</label>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setIsAddingHandover(false); setEditingHandover(null); }}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-semibold shadow-xs"
                >
                  {editingHandover ? 'Update Item' : 'Add to Checklist'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
