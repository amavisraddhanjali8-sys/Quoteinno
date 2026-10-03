import React, { useState, useMemo } from 'react';
import { 
  Folder, 
  Search, 
  Plus, 
  User, 
  MapPin, 
  FileText, 
  ArrowLeft,
  ExternalLink,
  Building2,
  Trash2,
  Kanban as KanbanIcon,
  GanttChart as GanttIcon,
  LayoutGrid,
  List,
  CheckSquare,
  Square,
  Clock,
  Send,
  Scale,
  Package,
  Receipt,
  CheckCircle2,
  X
} from 'lucide-react';
import { Project, Quote, Invoice, Client, CustomerCategory } from '../types';
import { cn } from '../lib/utils';
import { ExportActions } from './common/ExportActions';
import { exportProjectsCSV, exportProjectsPDF } from '../services/dataExportService';
import { ConfirmationModal } from './ConfirmationModal';
import { toast } from 'sonner';
import { ContextualDocumentModal } from './procurement/documents/ContextualDocumentModal';
import { ProjectAssignedFactoriesPanel } from './factory/ProjectAssignedFactoriesPanel';

interface ProjectManagerProps {
  projects: Project[];
  quotes: Quote[];
  invoices?: Invoice[];
  clients?: Client[];
  onViewProject: (p: Project) => void;
  onViewQuote: (q: Quote) => void;
  onNewProject?: () => void;
  onSaveProject?: (project: Project) => void;
  onDeleteProject: (id: string) => void;
  onUpdateStatus: (id: string, status: Project['status']) => void;
  onCreateQuoteForProject?: (p: Project) => void;
  onCreateInvoiceForProject?: (p: Project) => void;
  onViewClient?: (c: Client) => void;
  onOpenDownloadPortal?: (type: any, data: any) => void;
  onOpenPostEvaluation?: (p: Project) => void;
  onOpenCatalog?: (context?: 'project') => void;
}

export const ProjectManager: React.FC<ProjectManagerProps> = ({ 
  projects, 
  quotes, 
  invoices = [],
  clients = [],
  onViewProject, 
  onViewQuote,
  onNewProject,
  onSaveProject,
  onDeleteProject,
  onUpdateStatus,
  onCreateQuoteForProject,
  onCreateInvoiceForProject,
  onViewClient,
  onOpenDownloadPortal,
  onOpenPostEvaluation,
  onOpenCatalog
}) => {
  const [activeView, setActiveView] = useState<'list' | 'kanban' | 'gantt' | 'grid'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | Project['status']>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [projectCodeFilter, setProjectCodeFilter] = useState<string>('All');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [projectDocModal, setProjectDocModal] = useState<{ isOpen: boolean; project?: Project | null }>({
    isOpen: false,
    project: null
  });

  // Selected Project for Right Drawer in Kanban view (defaults to first project)
  const [drawerProjectId, setDrawerProjectId] = useState<string | null>(projects[0]?.id || null);

  // Completed item tracking for checkboxes in cards (persists locally per project)
  const [completedItemsMap, setCompletedItemsMap] = useState<Record<string, boolean>>({});

  // Project site chat/notes state per project
  const [chatInput, setChatInput] = useState('');
  const [projectNotes, setProjectNotes] = useState<Record<string, { id: string; sender: string; time: string; text: string; isMe?: boolean }[]>>({
    'proj-altair-01': [
      { id: 'm1', sender: 'Mira Brown (Site Lead)', time: '09:15 AM', text: 'Extruded aluminium batch delivered to Colombo 02 site. Inspection scheduled with client.' },
      { id: 'm2', sender: 'David Lee (Fabricator)', time: '09:40 AM', text: 'Checked mullion profiles against fabrication drawings. Verified 2.0mm thickness.' }
    ],
    'proj-portcity-02': [
      { id: 'm3', sender: 'Sophia Chen (Glazing Lead)', time: '10:00 AM', text: 'Acoustic glass panels received at Port City terminal. Crane rigging completed.' }
    ]
  });

  // Create Project Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isQuickAddClient, setIsQuickAddClient] = useState(false);
  const [quickClientName, setQuickClientName] = useState('');
  const [quickClientPhone, setQuickClientPhone] = useState('');
  const [quickClientAddress, setQuickClientAddress] = useState('');

  const nextProjectCode = useMemo(() => {
    const year = new Date().getFullYear();
    const count = projects.length + 1;
    return `PRJ-${year}-${String(count).padStart(3, '0')}`;
  }, [projects.length]);

  const [projectForm, setProjectForm] = useState<{
    projectCode: string;
    projectName: string;
    clientId: string;
    siteAddress: string;
    category: string;
    status: Project['status'];
    totalValue: number;
    startDate: string;
    endDate: string;
    notes: string;
  }>({
    projectCode: nextProjectCode,
    projectName: '',
    clientId: clients[0]?.id || '',
    siteAddress: clients[0]?.address || '',
    category: 'Aluminium',
    status: 'New Request',
    totalValue: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: ''
  });

  // Filtered projects by search, status, and category
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const pCode = p.projectCode || p.id;
      const q = searchQuery.toLowerCase().trim();
      const pQuotes = quotes.filter(quoteItem => quoteItem.projectId === p.id || (quoteItem.projectCode && quoteItem.projectCode === p.projectCode) || (quoteItem.projectName && quoteItem.projectName === p.projectName));
      const matchesQuote = pQuotes.some(qi => qi.quoteNo.toLowerCase().includes(q));
      const matchesSearch = !q ||
        p.projectName.toLowerCase().includes(q) ||
        pCode.toLowerCase().includes(q) ||
        matchesQuote ||
        (p.client?.name && p.client.name.toLowerCase().includes(q)) ||
        (p.siteAddress && p.siteAddress.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q));
      const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
      const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
      const matchesProjectCode = projectCodeFilter === 'All' || p.id === projectCodeFilter || (p.projectCode && p.projectCode === projectCodeFilter);
      return matchesSearch && matchesStatus && matchesCategory && matchesProjectCode;
    });
  }, [projects, searchQuery, statusFilter, categoryFilter, projectCodeFilter, quotes]);

  // Active drawer project
  const drawerProject = useMemo(() => {
    if (drawerProjectId) {
      const found = projects.find(p => p.id === drawerProjectId);
      if (found) return found;
    }
    return projects[0] || null;
  }, [projects, drawerProjectId]);

  // Selected project for full dossier view
  const selectedProject = useMemo(() => 
    projects.find(p => p.id === selectedProjectId), 
    [projects, selectedProjectId]
  );

  // Linked quotes for selected project
  const projectQuotes = useMemo(() => {
    if (!selectedProject) return [];
    return quotes.filter(q => 
      q.projectId === selectedProject.id || 
      (q.projectName && q.projectName === selectedProject.projectName)
    ).sort((a, b) => new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime());
  }, [quotes, selectedProject]);

  // Linked invoices for selected project
  const projectInvoices = useMemo(() => {
    if (!selectedProject) return [];
    return invoices.filter(i => 
      i.projectId === selectedProject.id || 
      (i.projectName && i.projectName === selectedProject.projectName)
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [invoices, selectedProject]);

  // Linked quotes & invoices for drawer project
  const drawerProjectQuotes = useMemo(() => {
    if (!drawerProject) return [];
    return quotes.filter(q => 
      q.projectId === drawerProject.id || 
      (q.projectName && q.projectName === drawerProject.projectName)
    );
  }, [quotes, drawerProject]);

  const drawerProjectInvoices = useMemo(() => {
    if (!drawerProject) return [];
    return invoices.filter(i => 
      i.projectId === drawerProject.id || 
      (i.projectName && i.projectName === drawerProject.projectName)
    );
  }, [invoices, drawerProject]);

  // Toggle subtask/item completion
  const toggleItemCompletion = (itemId: string) => {
    setCompletedItemsMap(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  // Add site chat message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !drawerProject) return;
    const newMsg = {
      id: `msg-${Date.now()}`,
      sender: 'You (Project Lead)',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: chatInput.trim(),
      isMe: true
    };
    setProjectNotes(prev => ({
      ...prev,
      [drawerProject.id]: [...(prev[drawerProject.id] || []), newMsg]
    }));
    setChatInput('');
  };

  // Open Create Project Modal
  const handleOpenCreateModal = () => {
    onNewProject?.();
    setProjectForm({
      projectCode: `PRJ-${new Date().getFullYear()}-${String(projects.length + 1).padStart(3, '0')}`,
      projectName: '',
      clientId: clients[0]?.id || '',
      siteAddress: clients[0]?.address || '',
      category: 'Aluminium',
      status: 'New Request',
      totalValue: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: ''
    });
    setIsQuickAddClient(false);
    setIsCreateModalOpen(true);
  };

  // Handle client selection in project creation modal
  const handleClientSelect = (clientId: string) => {
    const selected = clients.find(c => c.id === clientId);
    setProjectForm(prev => ({
      ...prev,
      clientId,
      siteAddress: selected?.address || prev.siteAddress
    }));
  };

  // Submit Create Project
  const handleCreateProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectForm.projectName.trim()) {
      toast.error('Please enter a project title');
      return;
    }

    let targetClient: Client;
    if (isQuickAddClient) {
      if (!quickClientName.trim()) {
        toast.error('Please enter the client name');
        return;
      }
      targetClient = {
        id: `c-${Date.now()}`,
        name: quickClientName.trim(),
        phone: quickClientPhone || '+94 11 000 0000',
        address: quickClientAddress || projectForm.siteAddress || 'Colombo, Sri Lanka',
        category: CustomerCategory.COMPANY,
        status: 'Active',
        creditLimit: 2000000,
        paymentTerms: '30 Days Net',
        currency: 'LKR',
        language: 'English',
        sinceDate: new Date().toISOString().split('T')[0],
        contactPersons: [],
        addresses: [],
        source: 'Direct',
        tier: 'Tier 1',
        isCommHidden: true,
        isTaxExempt: false,
        hasSpecialPricing: false
      };
    } else {
      const existing = clients.find(c => c.id === projectForm.clientId);
      targetClient = existing || (clients[0] as Client) || {
        id: `c-default`,
        name: 'Default Client',
        category: CustomerCategory.COMPANY,
        phone: '',
        address: projectForm.siteAddress,
        status: 'Active',
        creditLimit: 0,
        paymentTerms: '',
        currency: 'LKR',
        language: 'English',
        sinceDate: '',
        contactPersons: [],
        addresses: [],
        source: 'Direct',
        tier: 'Tier 1',
        isCommHidden: true,
        isTaxExempt: false,
        hasSpecialPricing: false
      };
    }

    const newProj: Project = {
      id: crypto.randomUUID(),
      projectCode: projectForm.projectCode || `PRJ-${Date.now().toString().slice(-4)}`,
      quoteId: '',
      allQuoteIds: [],
      projectName: projectForm.projectName.trim(),
      client: targetClient,
      startDate: projectForm.startDate,
      endDate: projectForm.endDate,
      siteAddress: projectForm.siteAddress || targetClient.address,
      category: projectForm.category,
      status: projectForm.status,
      totalValue: Number(projectForm.totalValue) || 0,
      originalSum: Number(projectForm.totalValue) || 0,
      currency: 'Rs.',
      items: [],
      paymentTiers: [
        { id: crypto.randomUUID(), phase: 'Advance Mobilization', percentage: 40, amount: (Number(projectForm.totalValue) || 0) * 0.4, status: 'Pending' },
        { id: crypto.randomUUID(), phase: 'Installation Progress', percentage: 40, amount: (Number(projectForm.totalValue) || 0) * 0.4, status: 'Pending' },
        { id: crypto.randomUUID(), phase: 'Handover & Certification', percentage: 20, amount: (Number(projectForm.totalValue) || 0) * 0.2, status: 'Pending' }
      ],
      auditLogs: [{
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        action: 'Project Initialized',
        details: `Created project card ${projectForm.projectCode}: ${projectForm.projectName}`,
        user: 'Lead Project Engineer',
        type: 'General'
      }],
      notes: projectForm.notes
    };

    if (onSaveProject) {
      onSaveProject(newProj);
    }
    setIsCreateModalOpen(false);
    setDrawerProjectId(newProj.id);
    toast.success(`Project ${newProj.projectCode} Created!`, {
      description: 'Project is now available as a foreign key across Quotations, Invoices, and Customers.'
    });
  };

  // Helper for category styling
  const getCategoryColor = (cat?: string) => {
    switch (cat) {
      case 'Aluminium': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Glass': return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'Façade': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Civil': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Steel': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Design': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  // Helper for column dot color
  const getColumnDotColor = (col: string) => {
    switch (col) {
      case 'New Request': return 'bg-rose-500';
      case 'In Progress': return 'bg-amber-500';
      case 'Complete': return 'bg-emerald-500';
      default: return 'bg-slate-400';
    }
  };

  // If a specific project is opened for full dossier view
  if (selectedProject) {
    return (
      <div className="space-y-2.5 animate-fadeIn">
        {/* Header - Single Line Ribbon */}
        <header className="bg-white border border-slate-200/80 px-5 py-2.5 rounded-xl flex items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <button 
              onClick={() => setSelectedProjectId(null)}
              className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200/80 rounded-lg transition-colors shadow-2xs shrink-0"
              title="Back to Projects Hub"
            >
              <ArrowLeft size={14} />
            </button>
            <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-2xs font-mono font-bold text-xs">
              {selectedProject.projectCode ? selectedProject.projectCode.split('-').pop() : 'PRJ'}
            </div>
            <div className="flex items-baseline gap-2 min-w-0">
              <h1 className="text-sm font-bold text-slate-900 whitespace-nowrap">
                {selectedProject.projectName}
              </h1>
              <span className="font-mono text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-200/60 font-semibold">
                ID: {selectedProject.projectCode || selectedProject.id}
              </span>
              <span className="text-xs text-slate-500 font-normal truncate hidden sm:inline">
                • {selectedProject.client.name} ({selectedProject.status})
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {onCreateQuoteForProject && (
              <button 
                onClick={() => onCreateQuoteForProject(selectedProject)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200/80 rounded-lg text-xs font-semibold transition-all shadow-2xs"
                title="Create a new quote linked to this project"
              >
                <Plus size={13} />
                <span>New Quote</span>
              </button>
            )}

            {onCreateInvoiceForProject && (
              <button 
                onClick={() => onCreateInvoiceForProject(selectedProject)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 rounded-lg text-xs font-semibold transition-all shadow-2xs"
                title="Create a new invoice linked to this project"
              >
                <Receipt size={13} />
                <span>New Invoice</span>
              </button>
            )}

            {onOpenDownloadPortal && (
              <button 
                onClick={() => onOpenDownloadPortal('Project', selectedProject)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-all shadow-2xs"
              >
                <FileText size={13} />
                <span className="hidden sm:inline">Reports</span>
              </button>
            )}

            <button 
              onClick={() => setProjectDocModal({
                isOpen: true,
                project: selectedProject
              })}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/80 rounded-lg text-xs font-semibold transition-all shadow-2xs"
              title="Generate Project Procurement Documents (Plan, Strategy, Schedule, BOQ, BOM, Technical Specs)"
            >
              <FileText size={13} className="text-amber-600" />
              <span>Procurement Package</span>
            </button>

            <button 
              onClick={() => onViewProject(selectedProject)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-semibold transition-all shadow-2xs"
            >
              <ExternalLink size={13} />
              <span>Variations & BOQ</span>
            </button>

            <button 
              onClick={(e) => {
                e.stopPropagation();
                setProjectToDelete(selectedProject.id);
              }}
              className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200/60 rounded-lg transition-colors shadow-2xs"
              title="Delete Project"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            {/* Project Dossier Card */}
            <div className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded border", getCategoryColor(selectedProject.category))}>
                    {selectedProject.category || 'Aluminium'}
                  </span>
                  <span className="text-xs text-orange-600 font-semibold font-mono">
                    {selectedProject.projectCode || selectedProject.id}
                  </span>
                </div>
                <select
                  value={selectedProject.status}
                  onChange={(e) => onUpdateStatus(selectedProject.id, e.target.value as Project['status'])}
                  className="px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-slate-50 border border-slate-200 text-slate-800 outline-none focus:border-orange-500 cursor-pointer"
                >
                  <option value="New Request">New Request</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="On Hold">On Hold</option>
                </select>
              </div>
              <h2 className="text-xl font-bold text-slate-900">{selectedProject.projectName}</h2>
              <p className="text-xs text-slate-500 mt-1">
                Client: <strong className="text-slate-700">{selectedProject.client.name}</strong> | Site Location: <strong className="text-slate-700">{selectedProject.siteAddress || selectedProject.client.address}</strong>
              </p>

              <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100">
                <div>
                  <span className="text-xs text-slate-400">Total Contract Value</span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedProject.currency || 'Rs.'} {selectedProject.totalValue.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Commencement Date</span>
                  <p className="text-sm font-semibold text-slate-900 mt-0.5">{selectedProject.startDate}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">BOQ Scope Items</span>
                  <p className="text-sm font-semibold text-slate-900 mt-0.5">{selectedProject.items.length} items recorded</p>
                </div>
              </div>
            </div>

            {/* Assigned Factories & Project Factory Execution ERP Hub */}
            <ProjectAssignedFactoriesPanel project={selectedProject} />

            {/* Linked Quotations */}
            <div className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FileText size={15} className="text-orange-500" />
                  <span>Linked Quotation History (Foreign Key: Project ID)</span>
                </h3>
                {onCreateQuoteForProject && (
                  <button
                    onClick={() => onCreateQuoteForProject(selectedProject)}
                    className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1"
                  >
                    <Plus size={12} />
                    <span>Create Quote</span>
                  </button>
                )}
              </div>
              
              {projectQuotes.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                  No quotations created for this project yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {projectQuotes.map(q => (
                    <div key={q.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-orange-200 hover:bg-orange-50/20 transition-all">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-800">{q.quoteNo}</span>
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            {q.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">Submitted: {q.submittedDate} | Type: {q.quoteType}</p>
                      </div>
                      <button 
                        onClick={() => onViewQuote(q)}
                        className="px-3 py-1 bg-slate-100 hover:bg-orange-500 hover:text-white rounded-lg text-xs font-medium transition-colors"
                      >
                        View Quote
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Linked Invoices */}
            <div className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Receipt size={15} className="text-blue-500" />
                  <span>Linked Invoices (Foreign Key: Project ID)</span>
                </h3>
                {onCreateInvoiceForProject && (
                  <button
                    onClick={() => onCreateInvoiceForProject(selectedProject)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Plus size={12} />
                    <span>Create Invoice</span>
                  </button>
                )}
              </div>
              
              {projectInvoices.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                  No invoices issued for this project yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {projectInvoices.map(inv => (
                    <div key={inv.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/20 transition-all">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-800">{inv.invoiceNo}</span>
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                            {inv.type}
                          </span>
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            {inv.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">Date: {inv.date} | Grand Total: {inv.currency || 'Rs.'} {inv.grandTotal.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-900 block">{inv.currency || 'Rs.'} {inv.grandTotal.toLocaleString()}</span>
                        <span className="text-[10px] text-slate-500">Balance: {inv.currency || 'Rs.'} {inv.balanceDue.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {/* Client Card */}
            <div className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-900">Client Information</h3>
                {onViewClient && (
                  <button
                    onClick={() => onViewClient(selectedProject.client)}
                    className="text-xs font-semibold text-orange-600 hover:text-orange-700"
                  >
                    View Profile
                  </button>
                )}
              </div>
              <div className="space-y-2.5 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <User size={14} className="text-slate-400" />
                  <span className="font-semibold text-slate-800">{selectedProject.client.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 size={14} className="text-slate-400" />
                  <span>{selectedProject.client.tradeName || 'Corporate Partner'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-slate-400" />
                  <span>{selectedProject.siteAddress || selectedProject.client.address}</span>
                </div>
              </div>
            </div>

            {/* Scope / Notes */}
            <div className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-2">Scope & Engineering Notes</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {selectedProject.notes || 'Full execution specifications, bill of quantities, and fabrication requirements managed in the Variations portal.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2.5 animate-fadeIn">
      {/* Header - Single Line Ribbon */}
      <header className="bg-white border border-slate-200/80 px-5 py-2.5 rounded-xl flex items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Folder size={16} />
          </div>
          <div className="flex items-baseline gap-2 min-w-0">
            <h1 className="text-sm font-bold text-slate-900 whitespace-nowrap">
              Project Operations Hub
            </h1>
            <span className="text-xs text-slate-500 font-normal truncate hidden sm:inline">
              • Schedules, timeline Gantt & site execution ({projects.length} active)
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <ExportActions 
            onExportCSV={() => exportProjectsCSV(projects)}
            onExportPDF={() => exportProjectsPDF(projects)}
            labelCSV="CSV"
            labelPDF="PDF"
          />

          {onOpenCatalog && (
            <button
              type="button"
              onClick={() => onOpenCatalog('project')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 rounded-lg text-xs font-semibold transition-all shadow-2xs"
              title="Open Master Item Catalog for Project BOQ & Specifications"
            >
              <Package size={13} className="text-indigo-600" />
              <span className="hidden sm:inline">Item Catalog</span>
            </button>
          )}

          <button 
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-semibold transition-all shadow-2xs"
          >
            <Plus size={13} />
            <span>Add Project</span>
          </button>
        </div>
      </header>

      {/* Sub-portal / Views Navigation Strip */}
      <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200/80 shadow-2xs">
        <button
          onClick={() => setActiveView('list')}
          className={cn(
            "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all",
            activeView === 'list' 
              ? "bg-orange-50 text-orange-600 border border-orange-200/60 shadow-2xs" 
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          )}
        >
          <List size={13} className={activeView === 'list' ? "text-orange-500" : "text-slate-400"} />
          <span>List View (One-Line Records)</span>
        </button>
        <button
          onClick={() => setActiveView('kanban')}
          className={cn(
            "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all",
            activeView === 'kanban' 
              ? "bg-orange-50 text-orange-600 border border-orange-200/60 shadow-2xs" 
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          )}
        >
          <KanbanIcon size={13} className={activeView === 'kanban' ? "text-orange-500" : "text-slate-400"} />
          <span>Kanban Board</span>
        </button>
        <button
          onClick={() => setActiveView('gantt')}
          className={cn(
            "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all",
            activeView === 'gantt' 
              ? "bg-orange-50 text-orange-600 border border-orange-200/60 shadow-2xs" 
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          )}
        >
          <GanttIcon size={13} className={activeView === 'gantt' ? "text-orange-500" : "text-slate-400"} />
          <span>Gantt Schedule</span>
        </button>
        <button
          onClick={() => setActiveView('grid')}
          className={cn(
            "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all",
            activeView === 'grid' 
              ? "bg-orange-50 text-orange-600 border border-orange-200/60 shadow-2xs" 
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          )}
        >
          <LayoutGrid size={13} className={activeView === 'grid' ? "text-orange-500" : "text-slate-400"} />
          <span>Project Cards</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* 0. HIGH-DENSITY ENTERPRISE LIST VIEW (ONE-LINE ROW)      */}
      {/* ========================================================= */}
      {activeView === 'list' && (
        <div className="space-y-3">
          {/* List View Filter & Search Bar */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-[280px]">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by Project Code (PK), Quotation # (FK), Name, Client, Category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium placeholder:text-slate-400 focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Project Code (PK) Filter */}
              <div className="flex items-center gap-1.5 bg-orange-50/70 px-2.5 py-1.5 rounded-xl border border-orange-200/80">
                <Folder size={12} className="text-orange-500 shrink-0" />
                <select
                  value={projectCodeFilter}
                  onChange={(e) => setProjectCodeFilter(e.target.value)}
                  className="text-xs bg-transparent font-semibold text-orange-900 focus:outline-none cursor-pointer max-w-[170px] truncate"
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

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="text-xs bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:border-orange-500 cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="New Request">New Request</option>
                <option value="Planning">Planning</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="On Hold">On Hold</option>
              </select>

              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:border-orange-500 cursor-pointer"
              >
                <option value="All">All Categories</option>
                <option value="Aluminium">Aluminium</option>
                <option value="Glass">Glass</option>
                <option value="Façade">Façade</option>
                <option value="Civil">Civil</option>
                <option value="Steel">Steel</option>
                <option value="Design">Design</option>
              </select>

              {/* Summary Counter */}
              <span className="text-xs font-mono font-semibold text-slate-500 bg-slate-100 px-2.5 py-1.5 rounded-xl border border-slate-200/60">
                {filteredProjects.length} / {projects.length} Records
              </span>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[10px] font-bold text-slate-600 uppercase tracking-wider select-none whitespace-nowrap">
                    <th className="py-2.5 px-3">Project Code (PK)</th>
                    <th className="py-2.5 px-3">Quotation # (FK)</th>
                    <th className="py-2.5 px-3">Project Name</th>
                    <th className="py-2.5 px-3">Client Account</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Site Location</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Contract Sum</th>
                    <th className="py-2.5 px-3 text-center">Progress</th>
                    <th className="py-2.5 px-3 text-center">Invoices</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProjects.map((p) => {
                    const pQuotes = quotes.filter(q => q.projectId === p.id || (q.projectCode && q.projectCode === p.projectCode) || (q.projectName && q.projectName === p.projectName));
                    const pInvoices = invoices.filter(inv => inv.projectId === p.id || (inv.projectName && inv.projectName === p.projectName));
                    const completedCount = p.items.filter(i => completedItemsMap[`${p.id}-${i.id}`]).length;
                    const progressPct = p.items.length > 0 ? Math.round((completedCount / p.items.length) * 100) : (p.status === 'Completed' ? 100 : p.status === 'In Progress' ? 50 : 10);
                    const catColor = getCategoryColor(p.category);

                    return (
                      <tr key={p.id} className="hover:bg-orange-50/20 transition-colors whitespace-nowrap group">
                        {/* PK: Project Code */}
                        <td className="py-2.5 px-3">
                          <button
                            onClick={() => setSelectedProjectId(p.id)}
                            className="inline-flex items-center gap-1.5 font-mono font-bold text-xs text-orange-600 bg-orange-50 hover:bg-orange-100 px-2 py-0.5 rounded border border-orange-200/80 transition-colors shadow-2xs"
                            title={`Primary Key: Project Code ${p.projectCode || p.id} (Click to open Project Dossier)`}
                          >
                            <Folder size={12} className="text-orange-500 shrink-0" />
                            <span>PK: {p.projectCode || p.id.slice(0, 10)}</span>
                          </button>
                        </td>

                        {/* FK: Quotation Number */}
                        <td className="py-2.5 px-3">
                          {pQuotes.length > 0 ? (
                            <button
                              onClick={() => onViewQuote(pQuotes[0])}
                              className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-orange-50 hover:text-orange-600 px-2 py-0.5 rounded border border-slate-200/80 transition-colors shadow-2xs"
                              title={`Foreign Key Quotation: ${pQuotes[0].quoteNo} (Click to View Quote)`}
                            >
                              <FileText size={11} className="text-orange-500 shrink-0" />
                              <span>FK: {pQuotes[0].quoteNo}</span>
                              {pQuotes.length > 1 && <span className="text-[9px] text-slate-400">+{pQuotes.length - 1}</span>}
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">FK: None</span>
                          )}
                        </td>

                        {/* Project Name (Single Line) */}
                        <td className="py-2.5 px-3 max-w-[220px]">
                          <button
                            onClick={() => onViewProject(p)}
                            className="font-bold text-slate-900 hover:text-orange-600 truncate block text-left transition-colors"
                            title={`${p.projectName} - Click to open Variations & BOQ`}
                          >
                            {p.projectName}
                          </button>
                        </td>

                        {/* Client Account (Single Line) */}
                        <td className="py-2.5 px-3 max-w-[160px]">
                          <div className="flex items-center gap-1.5 truncate">
                            <User size={12} className="text-slate-400 shrink-0" />
                            <span className="font-medium text-slate-700 truncate" title={p.client?.name}>
                              {p.client?.name || 'Unassigned'}
                            </span>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-2.5 px-3">
                          <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border", catColor)}>
                            {p.category || 'Aluminium'}
                          </span>
                        </td>

                        {/* Site Location (Single Line) */}
                        <td className="py-2.5 px-3 max-w-[180px]">
                          <div className="flex items-center gap-1 text-slate-500 truncate" title={p.siteAddress}>
                            <MapPin size={11} className="text-slate-400 shrink-0" />
                            <span className="truncate">{p.siteAddress || p.client?.address || 'Site Pending'}</span>
                          </div>
                        </td>

                        {/* Status Dropdown */}
                        <td className="py-2.5 px-3 text-center">
                          <select
                            value={p.status}
                            onChange={(e) => onUpdateStatus(p.id, e.target.value as any)}
                            className="text-[10px] font-semibold bg-white border border-slate-200 rounded-full px-2 py-0.5 cursor-pointer focus:outline-none focus:ring-1 focus:ring-orange-500"
                          >
                            <option value="New Request">New Request</option>
                            <option value="Planning">Planning</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                            <option value="On Hold">On Hold</option>
                          </select>
                        </td>

                        {/* Contract Sum */}
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                          {p.currency || 'Rs.'} {p.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>

                        {/* Progress % */}
                        <td className="py-2.5 px-3 text-center">
                          <div className="inline-flex items-center gap-1.5">
                            <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-orange-500 rounded-full" style={{ width: `${progressPct}%` }} />
                            </div>
                            <span className="font-mono text-[10px] text-slate-600 font-semibold">{progressPct}%</span>
                          </div>
                        </td>

                        {/* Linked Quotes (FK Target) */}
                        <td className="py-2.5 px-3 text-center">
                          {pQuotes.length > 0 ? (
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => onViewQuote(pQuotes[0])}
                                className="font-mono text-[10px] font-bold px-2 py-0.5 rounded border bg-orange-50 text-orange-700 border-orange-200/80 hover:bg-orange-100 transition-colors shadow-2xs"
                                title={`Foreign Key: Quotation ${pQuotes[0].quoteNo} (Click to open)`}
                              >
                                <span>FK: {pQuotes[0].quoteNo}</span>
                              </button>
                              {pQuotes.length > 1 && (
                                <span className="text-[9px] font-mono font-bold bg-slate-100 text-slate-600 px-1 py-0.5 rounded" title={`${pQuotes.length} total linked quotes`}>
                                  +{pQuotes.length - 1}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">None</span>
                          )}
                        </td>

                        {/* Linked Invoices (FK Target) */}
                        <td className="py-2.5 px-3 text-center">
                          <span 
                            className={cn(
                              "font-mono text-[10px] font-semibold px-2 py-0.5 rounded border inline-block",
                              pInvoices.length > 0 ? "bg-blue-50 text-blue-700 border-blue-200/60" : "bg-slate-50 text-slate-400 border-slate-200"
                            )}
                            title={`${pInvoices.length} invoice(s) linked via Foreign Key`}
                          >
                            {pInvoices.length}
                          </span>
                        </td>

                        {/* Actions (Single Line) */}
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setSelectedProjectId(p.id)}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-semibold transition-colors"
                              title="Open Project Dossier"
                            >
                              Dossier
                            </button>

                            <button
                              onClick={() => onViewProject(p)}
                              className="px-2 py-1 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200/60 rounded-lg text-[10px] font-semibold transition-colors"
                              title="Variations & BOQ"
                            >
                              BOQ
                            </button>

                            <button
                              onClick={() => setProjectDocModal({
                                isOpen: true,
                                project: p
                              })}
                              className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/60 rounded-lg text-[10px] font-semibold transition-colors flex items-center gap-1"
                              title="Project Procurement Package (Plan, Schedule, Strategy, BOQ, BOM, Technical Specs)"
                            >
                              <FileText size={10} className="text-amber-600" />
                              <span>Docs</span>
                            </button>

                            {onCreateQuoteForProject && (
                              <button
                                onClick={() => onCreateQuoteForProject(p)}
                                className="p-1 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                title="Create Quote for this Project"
                              >
                                <Plus size={13} />
                              </button>
                            )}

                            {onCreateInvoiceForProject && (
                              <button
                                onClick={() => onCreateInvoiceForProject(p)}
                                className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Create Invoice for this Project"
                              >
                                <Receipt size={13} />
                              </button>
                            )}

                            <button
                              onClick={() => setProjectToDelete(p.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Delete Project"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredProjects.length === 0 && (
                    <tr>
                      <td colSpan={11} className="py-12 text-center text-slate-400 text-xs">
                        No projects found matching the criteria. Click "+ Add Project" to initialize a project card.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 1. DYNAMIC REAL PROJECT KANBAN BOARD VIEW                  */}
      {/* ========================================================= */}
      {activeView === 'kanban' && (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
          {/* Main 3 Kanban Columns (Takes 3 columns on xl) */}
          <div className="xl:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
            {(['New Request', 'In Progress', 'Complete'] as const).map((col) => {
              // Match projects into columns
              const colProjects = projects.filter(p => {
                if (col === 'New Request') return p.status === 'New Request' || p.status === 'Planning';
                if (col === 'In Progress') return p.status === 'In Progress' || !p.status;
                if (col === 'Complete') return p.status === 'Completed' || p.status === 'Complete';
                return false;
              });

              return (
                <div key={col} className="space-y-3">
                  {/* Column Header */}
                  <div className="flex items-center justify-between px-3 py-2 bg-white border border-slate-200/80 rounded-xl shadow-xs">
                    <div className="flex items-center gap-2">
                      <span className={cn("w-2 h-2 rounded-full", getColumnDotColor(col))}></span>
                      <h3 className="text-xs font-semibold text-slate-800">{col}</h3>
                    </div>
                    <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      {colProjects.length}
                    </span>
                  </div>

                  {/* Column Project Cards */}
                  <div className="space-y-3 min-h-[450px]">
                    {colProjects.length === 0 ? (
                      <div className="p-6 bg-white/60 border border-dashed border-slate-200 rounded-2xl text-center">
                        <p className="text-xs text-slate-400 font-medium">No projects in this stage</p>
                        <button
                          onClick={handleOpenCreateModal}
                          className="mt-2 text-xs text-orange-600 font-semibold hover:underline inline-flex items-center gap-1"
                        >
                          <Plus size={11} /> Create Project
                        </button>
                      </div>
                    ) : (
                      colProjects.map((project) => {
                        const isSelected = drawerProject?.id === project.id;
                        
                        // Calculate item completion count from items
                        const totalItemsCount = project.items?.length || 0;
                        const completedItemsCount = project.items?.filter(it => completedItemsMap[it.id] || it.variationStatus === 'Original').length || 0;
                        const progressRatio = totalItemsCount > 0 ? Math.round((completedItemsCount / totalItemsCount) * 100) : (project.status === 'Completed' ? 100 : 35);

                        // Count linked quotes and invoices
                        const linkedQuotesCount = quotes.filter(q => q.projectId === project.id || (q.projectName && q.projectName === project.projectName)).length;
                        const linkedInvoicesCount = invoices.filter(i => i.projectId === project.id || (i.projectName && i.projectName === project.projectName)).length;

                        return (
                          <div 
                            key={project.id}
                            onClick={() => setDrawerProjectId(project.id)}
                            className={cn(
                              "p-4 bg-white border rounded-2xl shadow-xs cursor-pointer transition-all hover:shadow-sm",
                              isSelected ? "border-orange-500 ring-2 ring-orange-500/10" : "border-slate-200/80 hover:border-slate-300"
                            )}
                          >
                            {/* Card Category Tag & Foreign Key Badge */}
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-1.5">
                                <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-md border", getCategoryColor(project.category))}>
                                  {project.category || 'Aluminium'}
                                </span>
                                <span className="font-mono text-[10px] font-bold text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-200/60">
                                  {project.projectCode || project.id.slice(0, 8)}
                                </span>
                              </div>
                              <span className="text-[11px] font-semibold text-slate-500">
                                {totalItemsCount > 0 ? `${completedItemsCount}/${totalItemsCount} Done` : `${progressRatio}%`}
                              </span>
                            </div>

                            {/* Project Title */}
                            <h4 className="text-xs font-bold text-slate-900 mb-1 leading-snug">
                              {project.projectName}
                            </h4>

                            {/* Client & Address Info */}
                            <p className="text-[11px] text-slate-500 mb-2 truncate flex items-center gap-1">
                              <Building2 size={11} className="text-slate-400 shrink-0" />
                              <span>{project.client?.name || 'Client'}</span>
                              <span className="text-slate-300">•</span>
                              <span className="truncate">{project.siteAddress || project.client?.address || 'Site Pending'}</span>
                            </p>

                            {/* BOQ / Scope Items Preview Checklist */}
                            <div className="space-y-1.5 mb-3 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                              {project.items && project.items.length > 0 ? (
                                project.items.slice(0, 3).map((it) => {
                                  const isChecked = !!completedItemsMap[it.id];
                                  return (
                                    <div 
                                      key={it.id} 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleItemCompletion(it.id);
                                      }}
                                      className="flex items-center gap-2 text-[11px] text-slate-600 hover:text-slate-900 cursor-pointer"
                                    >
                                      {isChecked ? (
                                        <CheckSquare size={13} className="text-orange-500 shrink-0" />
                                      ) : (
                                        <Square size={13} className="text-slate-300 shrink-0" />
                                      )}
                                      <span className={cn("truncate", isChecked && "line-through text-slate-400")}>
                                        {it.name}
                                      </span>
                                    </div>
                                  );
                                })
                              ) : (
                                <div className="text-[10px] text-slate-400 italic flex items-center justify-between">
                                  <span>No BOQ items added yet</span>
                                  {onCreateQuoteForProject && (
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onCreateQuoteForProject(project);
                                      }}
                                      className="text-orange-600 font-semibold hover:underline"
                                    >
                                      + Build Quote
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Metrics & Foreign Key Link Badges */}
                            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                              <span className="font-semibold text-slate-800">
                                {project.currency || 'Rs.'} {project.totalValue.toLocaleString()}
                              </span>
                              <div className="flex items-center gap-2">
                                <span 
                                  title={`${linkedQuotesCount} Quotations linked to this project`}
                                  className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200"
                                >
                                  <FileText size={10} className="text-orange-500" />
                                  <span>{linkedQuotesCount} Q</span>
                                </span>
                                <span 
                                  title={`${linkedInvoicesCount} Invoices linked to this project`}
                                  className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200"
                                >
                                  <Receipt size={10} className="text-blue-500" />
                                  <span>{linkedInvoicesCount} Inv</span>
                                </span>
                              </div>
                            </div>

                            {/* Quick Action Strip on Card */}
                            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                              <div className="flex items-center gap-1">
                                {onCreateQuoteForProject && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onCreateQuoteForProject(project);
                                    }}
                                    className="px-2 py-0.5 rounded bg-orange-50 hover:bg-orange-100 text-orange-700 font-medium transition-colors"
                                    title="Create new quotation for this project"
                                  >
                                    + Quote
                                  </button>
                                )}
                                {onCreateInvoiceForProject && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onCreateInvoiceForProject(project);
                                    }}
                                    className="px-2 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium transition-colors"
                                    title="Create new invoice for this project"
                                  >
                                    + Invoice
                                  </button>
                                )}
                              </div>

                              <div className="flex items-center gap-1">
                                <select
                                  value={project.status}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    onUpdateStatus(project.id, e.target.value as Project['status']);
                                  }}
                                  className="text-[10px] font-medium bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-slate-700 cursor-pointer"
                                >
                                  <option value="New Request">New Request</option>
                                  <option value="In Progress">In Progress</option>
                                  <option value="Completed">Completed</option>
                                  <option value="On Hold">On Hold</option>
                                </select>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setProjectToDelete(project.id);
                                  }}
                                  className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                                  title="Delete Project"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Drawer / Sidebar: Selected Real Project Details & Site Sync */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
            {drawerProject ? (
              <div className="space-y-4">
                {/* Team Lead / Project Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                      {drawerProject.client?.name ? drawerProject.client.name.slice(0, 2).toUpperCase() : 'PR'}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{drawerProject.client?.name}</h4>
                      <p className="text-[11px] text-slate-500 font-mono">ID: {drawerProject.projectCode || drawerProject.id}</p>
                    </div>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" title="Live Project Status Active"></span>
                </div>

                {/* Project Overview Box */}
                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-900">{drawerProject.projectName}</span>
                    <span className="font-bold text-orange-600">{drawerProject.currency || 'Rs.'} {drawerProject.totalValue.toLocaleString()}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1">
                    <MapPin size={11} className="text-slate-400 shrink-0" />
                    <span className="truncate">{drawerProject.siteAddress || drawerProject.client?.address}</span>
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200/60">
                    <span>Start: {drawerProject.startDate}</span>
                    <span>Status: <strong className="text-slate-700">{drawerProject.status}</strong></span>
                  </div>
                </div>

                {/* Linked Quotations Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <FileText size={13} className="text-orange-500" />
                      <span>Linked Quotations ({drawerProjectQuotes.length})</span>
                    </h5>
                    {onCreateQuoteForProject && (
                      <button
                        onClick={() => onCreateQuoteForProject(drawerProject)}
                        className="text-[11px] font-semibold text-orange-600 hover:underline flex items-center gap-0.5"
                      >
                        <Plus size={11} /> New Quote
                      </button>
                    )}
                  </div>

                  {drawerProjectQuotes.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic">No quotes created under this Project ID yet.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-[110px] overflow-y-auto pr-1">
                      {drawerProjectQuotes.map(q => (
                        <div key={q.id} className="flex items-center justify-between p-2 bg-orange-50/40 border border-orange-100 rounded-lg text-xs">
                          <div>
                            <span className="font-mono font-bold text-slate-800">{q.quoteNo}</span>
                            <span className="text-[10px] text-slate-400 block">{q.submittedDate} • {q.status}</span>
                          </div>
                          <button
                            onClick={() => onViewQuote(q)}
                            className="text-[11px] font-medium text-orange-600 hover:text-orange-700 bg-white px-2 py-0.5 rounded border border-orange-200"
                          >
                            View
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Linked Invoices Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Receipt size={13} className="text-blue-500" />
                      <span>Linked Invoices ({drawerProjectInvoices.length})</span>
                    </h5>
                    {onCreateInvoiceForProject && (
                      <button
                        onClick={() => onCreateInvoiceForProject(drawerProject)}
                        className="text-[11px] font-semibold text-blue-600 hover:underline flex items-center gap-0.5"
                      >
                        <Plus size={11} /> New Invoice
                      </button>
                    )}
                  </div>

                  {drawerProjectInvoices.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic">No invoices issued under this Project ID yet.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-[110px] overflow-y-auto pr-1">
                      {drawerProjectInvoices.map(inv => (
                        <div key={inv.id} className="flex items-center justify-between p-2 bg-blue-50/40 border border-blue-100 rounded-lg text-xs">
                          <div>
                            <span className="font-mono font-bold text-slate-800">{inv.invoiceNo}</span>
                            <span className="text-[10px] text-slate-400 block">{inv.type} • {inv.status}</span>
                          </div>
                          <span className="font-bold text-slate-800 text-[11px]">{inv.currency || 'Rs.'} {inv.grandTotal.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Daily Site Sync Schedule */}
                <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl">
                  <div className="flex items-center justify-between text-[11px] text-amber-800 font-semibold mb-1">
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> Daily Site Sync
                    </span>
                    <span>09:30 - 10:00 AM</span>
                  </div>
                  <p className="text-[11px] text-slate-600">Site coordination meeting for {drawerProject.projectName}.</p>
                </div>

                {/* Site Activity & Team Notes Feed */}
                <div>
                  <h5 className="text-xs font-semibold text-slate-900 mb-1.5">Project Site Notes & Updates</h5>
                  <div className="space-y-2 max-h-[120px] overflow-y-auto pr-1">
                    {(projectNotes[drawerProject.id] || [
                      { id: 'def1', sender: 'Site Lead', time: '09:00 AM', text: `Project initialized. Ready for quotation and client site inspection.` }
                    ]).map((m) => (
                      <div 
                        key={m.id} 
                        className={cn(
                          "p-2 rounded-xl text-xs",
                          m.isMe ? "bg-orange-50/80 border border-orange-200/60 ml-2" : "bg-slate-50 border border-slate-100 mr-2"
                        )}
                      >
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                          <span className="font-semibold text-slate-700">{m.sender}</span>
                          <span>{m.time}</span>
                        </div>
                        <p className="text-slate-800 text-[11px] leading-relaxed">{m.text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add Site Note Form */}
                <form onSubmit={handleSendMessage} className="pt-2 border-t border-slate-100">
                  <div className="relative flex items-center">
                    <input 
                      type="text"
                      placeholder={`Add note for ${drawerProject.projectCode || 'Project'}...`}
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      className="w-full pl-3 pr-9 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500"
                    />
                    <button 
                      type="submit"
                      className="absolute right-1.5 p-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
                    >
                      <Send size={11} />
                    </button>
                  </div>
                </form>

                {/* Open Full Project Dossier Button */}
                <button
                  onClick={() => setSelectedProjectId(drawerProject.id)}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs mt-2"
                >
                  <ExternalLink size={13} />
                  <span>Open Full Project Dossier & Variations</span>
                </button>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">
                Click any project card to inspect details, linked quotes, and site logs.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 2. DYNAMIC GANTT TIMELINE SCHEDULE VIEW (Grounded on Real Projects) */}
      {/* ================================================================= */}
      {activeView === 'gantt' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Interactive Execution Schedule (Gantt)</h3>
              <p className="text-xs text-slate-500 mt-0.5">Real-time schedule for active projects, execution milestones, and worker allocation.</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-orange-500"></span> In Progress
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span> Completed
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-blue-500"></span> New Request / Scheduled
              </span>
            </div>
          </div>

          {/* Gantt Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse min-w-[850px]">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-medium bg-slate-50/50">
                  <th className="py-2.5 pl-3 w-[260px]">Project & Milestone Work Item</th>
                  <th className="py-2.5 text-center w-[75px]">Progress</th>
                  <th className="py-2.5 text-center w-[85px]">Project ID</th>
                  <th className="py-2.5 text-center w-[85px]">Start</th>
                  <th className="py-2.5 text-center w-[85px]">Target</th>
                  {/* Timeline Date Grid Columns */}
                  <th className="py-2.5 text-center text-slate-600 font-semibold border-l border-slate-200">Phase 1: Mobilization</th>
                  <th className="py-2.5 text-center text-slate-600 font-semibold border-l border-slate-200">Phase 2: Fabrication</th>
                  <th className="py-2.5 text-center text-slate-600 font-semibold border-l border-slate-200">Phase 3: Erection</th>
                  <th className="py-2.5 text-center text-slate-600 font-semibold border-l border-slate-200">Phase 4: Handover</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {projects.map((project) => {
                  const hasItems = project.items && project.items.length > 0;
                  const isCompleted = project.status === 'Completed';

                  return (
                    <React.Fragment key={project.id}>
                      {/* Project Header Row */}
                      <tr className="bg-slate-50/80 font-bold text-slate-800">
                        <td className="py-2.5 pl-3 text-xs flex items-center gap-2">
                          <Folder size={14} className="text-orange-500" />
                          <span className="truncate">{project.projectName}</span>
                          <span className="text-[10px] font-normal text-slate-400">({project.client?.name})</span>
                        </td>
                        <td className="py-2.5 text-center font-bold text-slate-700">
                          {isCompleted ? '100%' : '55%'}
                        </td>
                        <td className="py-2.5 text-center font-mono text-[10px] text-orange-600 font-bold">
                          {project.projectCode || project.id.slice(0, 8)}
                        </td>
                        <td className="py-2.5 text-center text-slate-500">{project.startDate}</td>
                        <td className="py-2.5 text-center text-slate-500">{project.endDate || 'Target 60d'}</td>
                        <td colSpan={4} className="py-2.5 px-2 border-l border-slate-200 relative">
                          <div className={cn(
                            "h-5 rounded-md text-[10px] text-white font-medium flex items-center px-2 shadow-xs transition-all",
                            isCompleted ? "bg-emerald-500 w-[95%]" : "bg-orange-500 w-[60%]"
                          )}>
                            {isCompleted ? 'Completed Execution' : `${project.status} (${project.currency || 'Rs.'} ${project.totalValue.toLocaleString()})`}
                          </div>
                        </td>
                      </tr>

                      {/* Items / Subtasks if present */}
                      {hasItems ? (
                        project.items.map((it, idx) => (
                          <tr key={it.id} className="hover:bg-slate-50/60">
                            <td className="py-2 pl-7 font-medium text-slate-700 truncate">
                              • {it.name}
                            </td>
                            <td className="py-2 text-center text-slate-600 text-[11px]">
                              {it.qty} {it.unit}
                            </td>
                            <td className="py-2 text-center font-mono text-[10px] text-slate-400">
                              {it.variantCode || `ITM-0${idx + 1}`}
                            </td>
                            <td className="py-2 text-center text-slate-400 text-[11px]">-</td>
                            <td className="py-2 text-center text-slate-400 text-[11px]">-</td>
                            <td colSpan={4} className="py-2 px-2 border-l border-slate-200 relative">
                              <div 
                                className="h-4 rounded bg-slate-300 text-[9px] text-slate-700 font-medium flex items-center px-2"
                                style={{ marginLeft: `${(idx % 3) * 25}%`, width: '35%' }}
                              >
                                {it.category} Scope
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr className="hover:bg-slate-50/60 text-slate-400 text-[11px]">
                          <td colSpan={5} className="py-2 pl-7 italic">
                            No BOQ subtasks defined yet • Ready for quotation
                          </td>
                          <td colSpan={4} className="py-2 px-2 border-l border-slate-200">
                            <span className="text-[10px] text-slate-400 italic">Timeline awaiting item breakdown</span>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. PROJECTS DIRECTORY / CARDS VIEW                         */}
      {/* ========================================================= */}
      {activeView === 'grid' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="p-3 bg-white border border-slate-200/80 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text"
                placeholder="Search projects by title, project ID, or client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-orange-500"
              />
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {(['All', 'New Request', 'In Progress', 'Completed', 'On Hold'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors",
                    statusFilter === st ? "bg-orange-500 text-white shadow-xs" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  )}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Project Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredProjects.map((project) => {
              const pQuotesCount = quotes.filter(q => q.projectId === project.id || (q.projectName && q.projectName === project.projectName)).length;
              const pInvoicesCount = invoices.filter(i => i.projectId === project.id || (i.projectName && i.projectName === project.projectName)).length;

              return (
                <div 
                  key={project.id}
                  onClick={() => setSelectedProjectId(project.id)}
                  className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs hover:border-orange-300 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={cn("px-2 py-0.5 rounded text-[10px] font-semibold border", getCategoryColor(project.category))}>
                          {project.category || 'Aluminium'}
                        </span>
                        <span className="font-mono text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                          {project.projectCode || project.id.slice(0, 8)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-full text-[10px] font-semibold",
                          project.status === 'In Progress' ? "bg-amber-50 text-amber-700 border border-amber-200" :
                          project.status === 'Completed' ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                          "bg-rose-50 text-rose-700 border border-rose-200"
                        )}>
                          {project.status}
                        </span>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setProjectToDelete(project.id);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{project.projectName}</h3>
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                      <User size={12} className="text-slate-400" />
                      <span>{project.client?.name}</span>
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                      {project.siteAddress || project.client?.address || 'Site Pending'}
                    </p>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="text-slate-400 text-[11px]">Total Contract Value</span>
                        <p className="font-bold text-slate-900 mt-0.5">{project.currency || 'Rs.'} {project.totalValue.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 text-[11px]">Start Date</span>
                        <p className="text-slate-600 mt-0.5">{project.startDate}</p>
                      </div>
                    </div>

                    {/* Foreign Key Counter Links */}
                    <div className="flex items-center justify-between text-xs pt-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                          {pQuotesCount} Quotes
                        </span>
                        <span className="text-[10px] font-semibold text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                          {pInvoicesCount} Invoices
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {onCreateQuoteForProject && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onCreateQuoteForProject(project);
                            }}
                            className="px-2 py-1 text-[11px] font-semibold text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
                          >
                            + Quote
                          </button>
                        )}
                        {onOpenPostEvaluation && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenPostEvaluation(project);
                            }}
                            className="px-2 py-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors flex items-center gap-1 border border-emerald-200/50"
                            title="Open standard cost vs actual cost post-evaluation engine"
                          >
                            <Scale size={11} />
                            <span>Audit</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. CREATE NEW PROJECT MODAL                                */}
      {/* ========================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-xl w-full p-6 shadow-xl animate-fadeIn space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-xs">
                  <Folder size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Create New Project Card</h3>
                  <p className="text-xs text-slate-500">Every quotation, invoice, and milestone attaches to this Project ID.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateProjectSubmit} className="space-y-4">
              {/* Row 1: Project Code & Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">Project ID / Code (Primary Key)</label>
                  <input 
                    type="text"
                    required
                    value={projectForm.projectCode}
                    onChange={(e) => setProjectForm({ ...projectForm, projectCode: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:bg-white focus:outline-none focus:border-orange-500"
                    placeholder="e.g. PRJ-2026-010"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">Category / Trade</label>
                  <select 
                    value={projectForm.category}
                    onChange={(e) => setProjectForm({ ...projectForm, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="Aluminium">Aluminium Works</option>
                    <option value="Glass">Glass & Glazing</option>
                    <option value="Façade">Façade Engineering</option>
                    <option value="Civil">Civil & Architectural</option>
                    <option value="Steel">Structural Steel</option>
                    <option value="Installation">Site Installation & Services</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Project Title */}
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Project Title *</label>
                <input 
                  type="text"
                  required
                  value={projectForm.projectName}
                  onChange={(e) => setProjectForm({ ...projectForm, projectName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:border-orange-500"
                  placeholder="e.g. Lotus Tower Commercial Storefront & Glazing"
                />
              </div>

              {/* Row 3: Client Selection & Quick Add */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">Client / Customer *</label>
                  <button
                    type="button"
                    onClick={() => setIsQuickAddClient(!isQuickAddClient)}
                    className="text-xs text-orange-600 font-semibold hover:underline"
                  >
                    {isQuickAddClient ? 'Select Existing Client' : '+ Quick Add New Client'}
                  </button>
                </div>

                {isQuickAddClient ? (
                  <div className="p-3 bg-orange-50/60 rounded-xl border border-orange-200/80 space-y-2">
                    <input 
                      type="text"
                      placeholder="Client / Company Name"
                      value={quickClientName}
                      onChange={(e) => setQuickClientName(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-orange-200 rounded-lg text-xs"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input 
                        type="text"
                        placeholder="Phone Number"
                        value={quickClientPhone}
                        onChange={(e) => setQuickClientPhone(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-orange-200 rounded-lg text-xs"
                      />
                      <input 
                        type="text"
                        placeholder="Billing / Site Address"
                        value={quickClientAddress}
                        onChange={(e) => setQuickClientAddress(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-orange-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                ) : (
                  <select 
                    value={projectForm.clientId}
                    onChange={(e) => handleClientSelect(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-orange-500"
                  >
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.tradeName ? `(${c.tradeName})` : ''} - {c.address}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Row 4: Site Address */}
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Work Site Location Address</label>
                <div className="relative">
                  <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text"
                    value={projectForm.siteAddress}
                    onChange={(e) => setProjectForm({ ...projectForm, siteAddress: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:border-orange-500"
                    placeholder="e.g. 45 Galle Road, Colombo 03"
                  />
                </div>
              </div>

              {/* Row 5: Initial Status & Budget */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">Initial Status</label>
                  <select 
                    value={projectForm.status}
                    onChange={(e) => setProjectForm({ ...projectForm, status: e.target.value as Project['status'] })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="New Request">New Request (Pipeline)</option>
                    <option value="In Progress">In Progress (Execution)</option>
                    <option value="On Hold">On Hold</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">Estimated Contract Value (Rs.)</label>
                  <input 
                    type="number"
                    value={projectForm.totalValue || ''}
                    onChange={(e) => setProjectForm({ ...projectForm, totalValue: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:border-orange-500"
                    placeholder="e.g. 2500000"
                  />
                </div>
              </div>

              {/* Row 6: Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">Start Date</label>
                  <input 
                    type="date"
                    value={projectForm.startDate}
                    onChange={(e) => setProjectForm({ ...projectForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">Target Completion Date</label>
                  <input 
                    type="date"
                    value={projectForm.endDate}
                    onChange={(e) => setProjectForm({ ...projectForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Row 7: Notes */}
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Scope Notes / Remarks</label>
                <textarea 
                  rows={2}
                  value={projectForm.notes}
                  onChange={(e) => setProjectForm({ ...projectForm, notes: e.target.value })}
                  placeholder="Outline key architectural specs, client preferences, or tender conditions..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:border-orange-500"
                ></textarea>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                >
                  <CheckCircle2 size={14} />
                  <span>Create Project Card</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Project Deletion */}
      <ConfirmationModal
        isOpen={!!projectToDelete}
        title="Delete Project Card"
        message="Are you sure you want to delete this project? All foreign key associations across quotations and invoices will remain intact but dissociated."
        confirmText="Yes, Delete Project"
        cancelText="Cancel"
        onConfirm={() => {
          if (projectToDelete) {
            onDeleteProject(projectToDelete);
            if (drawerProjectId === projectToDelete) {
              setDrawerProjectId(null);
            }
            if (selectedProjectId === projectToDelete) {
              setSelectedProjectId(null);
            }
            setProjectToDelete(null);
            toast.success('Project removed successfully');
          }
        }}
        onClose={() => setProjectToDelete(null)}
      />

      {/* Project Procurement Package Modal */}
      <ContextualDocumentModal
        isOpen={projectDocModal.isOpen}
        onClose={() => setProjectDocModal(prev => ({ ...prev, isOpen: false }))}
        title={projectDocModal.project ? `Project Procurement Package: ${projectDocModal.project.projectName}` : 'Project Procurement Documents'}
        subtitle={projectDocModal.project ? `Project Code: ${projectDocModal.project.projectCode || projectDocModal.project.id} • Client: ${projectDocModal.project.client?.name || 'Assigned Client'}` : undefined}
        relevantDocNumbers={[23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 47, 48, 49, 61, 62, 69, 70, 74, 87]}
        context={{
          projectId: projectDocModal.project?.id,
          projectCode: projectDocModal.project?.projectCode,
          projectName: projectDocModal.project?.projectName,
          clientName: projectDocModal.project?.client?.name,
          projectLocation: projectDocModal.project?.siteAddress,
          contractValue: projectDocModal.project?.totalValue
        }}
      />
    </div>
  );
};
