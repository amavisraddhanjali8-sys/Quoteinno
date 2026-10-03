import React, { useState, useMemo } from 'react';
import { 
  User, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Mail, 
  Phone, 
  MapPin, 
  X,
  ChevronRight,
  ExternalLink,
  LayoutGrid,
  List,
  Kanban as KanbanIcon,
  MessageSquare,
  Send,
  Clock,
  Play,
  Pause,
  Folder,
  LayoutDashboard
} from 'lucide-react';
import { Client, Invoice, Project, CustomerCategory } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { ConfirmationModal } from './ConfirmationModal';
import { cn } from '../lib/utils';
import { ExportActions } from './common/ExportActions';
import { exportClientsCSV, exportClientsPDF } from '../services/dataExportService';
import { ClientLandingPage } from './ClientLandingPage';

interface ClientManagerProps {
  clients: Client[];
  invoices?: Invoice[];
  projects?: Project[];
  onSaveClient: (client: Client) => void;
  onDeleteClient: (id: string) => void;
  onViewPortal?: (client: Client) => void;
  onNavigateToProject?: (projectId: string) => void;
  onNewProjectForClient?: (client: Client) => void;
}

export const ClientManager: React.FC<ClientManagerProps> = ({ 
  clients, 
  invoices = [],
  projects = [],
  onSaveClient, 
  onDeleteClient,
  onViewPortal,
  onNavigateToProject,
  onNewProjectForClient
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | CustomerCategory>('All');
  const [selectedStatus, setSelectedStatus] = useState<'All' | string>('All');
  const [selectedProjectFilter, setSelectedProjectFilter] = useState('All');
  const [sortBy] = useState<'name' | 'value' | 'date'>('name');
  const [viewMode, setViewMode] = useState<'landing' | 'table' | 'cards' | 'kanban'>('landing');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Modals & Drawers
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);
  const [drawerClient, setDrawerClient] = useState<Client | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  
  // Chat state for Image 1 drawer
  const [chatInput, setChatInput] = useState('');
  const [clientChats, setClientChats] = useState<Record<string, Array<{ id: string; sender: string; time: string; text: string; isMe?: boolean }>>>({
    default: [
      { id: 'c1', sender: 'Operations Lead', time: '10:14 AM', text: 'Hi, we sent over the revised structural glazing schedule for review.' },
      { id: 'c2', sender: 'Client Contact', time: '10:28 AM', text: 'Got it. The site team will verify anchorage points this afternoon.' },
      { id: 'c3', sender: 'You', time: '10:45 AM', text: 'Excellent, our site supervisor will be on site at 2:00 PM for the sign-off.', isMe: true }
    ]
  });

  // Kanban lanes
  const [kanbanLanes] = useState<Array<{ id: string; name: string; color: string }>>([
    { id: 'Active', name: 'Active & Accepted', color: '#10b981' },
    { id: 'In Negotiation', name: 'In Negotiation', color: '#f59e0b' },
    { id: 'On Hold', name: 'On Hold / Review', color: '#8b5cf6' },
    { id: 'Inactive', name: 'Inactive', color: '#94a3b8' }
  ]);

  // Form Data for Add/Edit Modal
  const initialFormData: Partial<Client> = {
    category: CustomerCategory.COMPANY,
    name: '',
    tradeName: '',
    registrationNo: '',
    taxNo: '',
    phone: '',
    address: '',
    email: '',
    industry: 'Commercial Construction',
    status: 'Active',
    creditLimit: 5000000,
    paymentTerms: 'Credit 30 Days',
    currency: 'LKR',
    sinceDate: new Date().toISOString().split('T')[0],
    tier: 'Tier 1'
  };

  const [formData, setFormData] = useState<Partial<Client>>(initialFormData);

  // Client computed deal values
  const clientFinancials = useMemo(() => {
    const map = new Map<string, { totalInvoiced: number; totalPaid: number; balanceDue: number; priority: 'high' | 'medium' | 'low'; nextStep: string }>();
    
    clients.forEach((c, index) => {
      const cInvoices = invoices.filter(inv => inv.client.id === c.id);
      const totalInvoiced = cInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
      const totalPaid = cInvoices.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0);
      const balanceDue = cInvoices.reduce((sum, inv) => sum + (inv.balanceDue || 0), 0);
      
      // Assign realistic next steps
      const steps = [
        'Start project implementation',
        'Finalize commercial BOQ sign-off',
        'Site laser measurement verification',
        'Follow-up on payment milestone',
        'Awaiting architectural sign-off',
        'Prepare handover documentation'
      ];
      const nextStep = steps[index % steps.length];
      
      // Determine priority indicator (3 bars)
      const priority = (totalInvoiced > 1000000 || c.tier === 'Tier 1') ? 'high' : totalInvoiced > 300000 ? 'medium' : 'low';
      
      map.set(c.id, { totalInvoiced, totalPaid, balanceDue, priority, nextStep });
    });
    
    return map;
  }, [clients, invoices]);

  // Filter & Sort
  const filteredClients = useMemo(() => {
    return clients
      .filter(c => {
        const q = searchTerm.toLowerCase().trim();
        const matchesSearch = !q ||
          c.name.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q) ||
          (c.registrationNo && c.registrationNo.toLowerCase().includes(q)) ||
          (c.tradeName && c.tradeName.toLowerCase().includes(q)) ||
          (c.email && c.email.toLowerCase().includes(q)) ||
          (c.address && c.address.toLowerCase().includes(q));
        
        const matchesCat = selectedCategory === 'All' || c.category === selectedCategory;
        const matchesStat = selectedStatus === 'All' || c.status === selectedStatus;

        // Project Filter (FK)
        const clientProjects = projects.filter(p => p.client?.id === c.id || (p.client?.name && p.client.name.toLowerCase() === c.name.toLowerCase()));
        const targetProj = projects.find(p => p.id === selectedProjectFilter || p.projectCode === selectedProjectFilter);
        const matchesProject = selectedProjectFilter === 'All' || 
          clientProjects.some(p => p.id === selectedProjectFilter || p.projectCode === selectedProjectFilter || (targetProj && p.id === targetProj.id));

        return matchesSearch && matchesCat && matchesStat && matchesProject;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'value') {
          const valA = clientFinancials.get(a.id)?.totalInvoiced || 0;
          const valB = clientFinancials.get(b.id)?.totalInvoiced || 0;
          return valB - valA;
        }
        return (b.sinceDate || '').localeCompare(a.sinceDate || '');
      });
  }, [clients, searchTerm, selectedCategory, selectedStatus, selectedProjectFilter, projects, sortBy, clientFinancials]);

  // Bulk selection handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredClients.map(c => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleOpenModal = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setFormData(client);
    } else {
      setEditingClient(null);
      setFormData(initialFormData);
    }
    setIsModalOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) return;

    const newClient: Client = {
      id: editingClient ? editingClient.id : `cli-${Date.now()}`,
      category: formData.category || CustomerCategory.COMPANY,
      name: formData.name.trim(),
      tradeName: formData.tradeName?.trim() || formData.name.trim(),
      registrationNo: formData.registrationNo?.trim() || '',
      taxNo: formData.taxNo?.trim() || '',
      phone: formData.phone?.trim() || '',
      address: formData.address?.trim() || '',
      email: formData.email?.trim() || '',
      industry: formData.industry?.trim() || 'General',
      status: formData.status || 'Active',
      creditLimit: Number(formData.creditLimit) || 0,
      paymentTerms: formData.paymentTerms || 'Credit 30 Days',
      currency: formData.currency || 'LKR',
      sinceDate: formData.sinceDate || new Date().toISOString().split('T')[0],
      tier: formData.tier || 'Tier 1',
      source: editingClient?.source || 'Direct',
      isCommHidden: editingClient?.isCommHidden ?? true,
      isTaxExempt: editingClient?.isTaxExempt ?? false,
      language: editingClient?.language || 'en',
      hasSpecialPricing: editingClient?.hasSpecialPricing || false,
      contactPersons: editingClient?.contactPersons || [],
      addresses: editingClient?.addresses || []
    };

    onSaveClient(newClient);
    setIsModalOpen(false);
  };

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !drawerClient) return;

    const newMsg = {
      id: `c-${Date.now()}`,
      sender: 'You',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: chatInput.trim(),
      isMe: true
    };

    setClientChats(prev => ({
      ...prev,
      [drawerClient.id]: [...(prev[drawerClient.id] || prev.default || []), newMsg]
    }));
    setChatInput('');
  };

  // Helper for Status Pill matching Connect360 Image 6
  const getStatusPill = (status: string) => {
    switch (status) {
      case 'Accepted':
      case 'Active':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/80">Accepted</span>;
      case 'In Negotiation':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200/80">In Negotiation</span>;
      case 'Follow-Up Required':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-orange-50 text-orange-700 border border-orange-200/80">Follow-Up Required</span>;
      case 'Under Review':
      case 'On Hold':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200/80">Under Review</span>;
      case 'Prospecting':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-sky-50 text-sky-700 border border-sky-200/80">Prospecting</span>;
      case 'Rejected':
      case 'Inactive':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200/80">Rejected</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  // 3-Bar Priority Signal Indicator (Image 6)
  const renderPrioritySignal = (priority: 'high' | 'medium' | 'low') => {
    return (
      <div className="flex items-end gap-0.5 h-3.5" title={`Priority: ${priority}`}>
        <div className={cn("w-1 rounded-xs transition-colors", priority === 'high' ? "h-2 bg-emerald-500" : priority === 'medium' ? "h-2 bg-amber-500" : "h-2 bg-slate-300")} />
        <div className={cn("w-1 rounded-xs transition-colors", priority === 'high' ? "h-2.5 bg-emerald-500" : priority === 'medium' ? "h-2.5 bg-amber-500" : "h-1 bg-slate-200")} />
        <div className={cn("w-1 rounded-xs transition-colors", priority === 'high' ? "h-3.5 bg-emerald-500" : "h-1 bg-slate-200")} />
      </div>
    );
  };

  return (
    <div className="space-y-2.5 pb-8">
      {/* Header - Single Line Ribbon */}
      <header className="bg-white border border-slate-200/80 px-5 py-2.5 rounded-xl flex items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <User size={16} />
          </div>
          <div className="flex items-baseline gap-2 min-w-0">
            <h1 className="text-sm font-bold text-slate-900 whitespace-nowrap">
              Business Partner CRM
            </h1>
            <span className="text-xs text-slate-500 font-normal truncate hidden sm:inline">
              • Clients, enterprise accounts & directory ({clients.length} partners)
            </span>
          </div>
        </div>

        {/* Action Buttons ONLY */}
        <div className="flex items-center gap-2 shrink-0">
          <ExportActions 
            onExportCSV={() => exportClientsCSV(clients)}
            onExportPDF={() => exportClientsPDF(clients)}
            labelCSV="CSV"
            labelPDF="PDF"
          />

          <button 
            onClick={() => handleOpenModal()}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-semibold transition-all shadow-2xs"
          >
            <Plus size={13} />
            <span>Add Client</span>
          </button>
        </div>
      </header>

      {/* ---------------------------------------------------- */}
      {/* 2. BULK SELECTION & FILTER BAR (Connect360 Image 6) */}
      {/* ---------------------------------------------------- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white border border-slate-200/80 rounded-2xl p-3 shadow-xs">
        <div className="flex items-center gap-3">
          {/* Selected Count Badge (Image 6) */}
          <div className="flex items-center gap-2">
            <span className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors",
              selectedIds.length > 0 ? "bg-orange-50 text-orange-700 border border-orange-200/80" : "bg-slate-100 text-slate-600"
            )}>
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
              {selectedIds.length} Selected
            </span>

            {selectedIds.length > 0 && (
              <button 
                onClick={() => setSelectedIds([])}
                className="text-[11px] text-slate-400 hover:text-slate-600 underline"
              >
                Clear
              </button>
            )}
          </div>

          <div className="h-4 w-px bg-slate-200" />

          {/* Quick Filters */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text"
                placeholder="Search by Client ID (PK), Project (FK), Name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 w-56"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as any)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 text-slate-700"
            >
              <option value="All">All Categories</option>
              <option value={CustomerCategory.COMPANY}>Enterprise</option>
              <option value={CustomerCategory.INDIVIDUAL}>Individual</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 text-slate-700"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Accepted / Active</option>
              <option value="In Negotiation">In Negotiation</option>
              <option value="Follow-Up Required">Follow-Up Required</option>
              <option value="Under Review">Under Review</option>
              <option value="On Hold">On Hold</option>
              <option value="Inactive">Rejected / Inactive</option>
            </select>

            {/* Project Filter (FK) */}
            <div className="flex items-center gap-1.5 bg-orange-50/70 px-2.5 py-1.5 rounded-xl border border-orange-200/80">
              <Folder size={12} className="text-orange-500 shrink-0" />
              <select
                value={selectedProjectFilter}
                onChange={(e) => setSelectedProjectFilter(e.target.value)}
                className="bg-transparent text-xs font-semibold text-orange-900 outline-none cursor-pointer max-w-[160px] truncate"
                title="Filter by Project (Foreign Key)"
              >
                <option value="All">All Projects (FK)</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>
                    [{p.projectCode || p.id.slice(0, 8)}] {p.projectName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Result Count (Image 6) */}
          <span className="text-xs text-slate-500 font-medium">
            {filteredClients.length} Results
          </span>

          {/* View Toggles */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl">
            <button
              onClick={() => setViewMode('landing')}
              className={cn(
                "p-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1",
                viewMode === 'landing' ? "bg-white text-orange-600 shadow-xs font-semibold" : "text-slate-500 hover:text-slate-900"
              )}
              title="Command Center Landing"
            >
              <LayoutDashboard size={14} />
              <span className="hidden sm:inline text-[11px]">Command Hub</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                "p-1.5 rounded-lg text-xs font-medium transition-colors",
                viewMode === 'table' ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
              )}
              title="Table View (Connect360)"
            >
              <List size={14} />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={cn(
                "p-1.5 rounded-lg text-xs font-medium transition-colors",
                viewMode === 'cards' ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
              )}
              title="Cards View"
            >
              <LayoutGrid size={14} />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={cn(
                "p-1.5 rounded-lg text-xs font-medium transition-colors",
                viewMode === 'kanban' ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
              )}
              title="Kanban Board"
            >
              <KanbanIcon size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 0. MAIN CONTENT: LANDING PAGE (Command Center)       */}
      {/* ---------------------------------------------------- */}
      {viewMode === 'landing' && (
        <ClientLandingPage
          clients={clients}
          projects={projects}
          invoices={invoices}
          onNewClient={handleOpenModal}
          onViewPortal={(c) => onViewPortal?.(c)}
          onSelectViewMode={setViewMode}
          onOpenClientDetails={(c) => setDrawerClient(c)}
          onExportCSV={() => exportClientsCSV(clients)}
          onExportPDF={() => exportClientsPDF(clients)}
        />
      )}

      {/* ---------------------------------------------------- */}
      {/* 3. MAIN CONTENT: TABLE VIEW (Exact Connect360 Image 6) */}
      {/* ---------------------------------------------------- */}
      {viewMode === 'table' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200/80 text-slate-400 font-medium select-none whitespace-nowrap">
                  <th className="py-3 pl-4 w-10">
                    <input 
                      type="checkbox"
                      checked={selectedIds.length > 0 && selectedIds.length === filteredClients.length}
                      onChange={handleSelectAll}
                      className="rounded border-slate-300 text-orange-500 focus:ring-orange-400"
                    />
                  </th>
                  <th className="py-3 px-3 font-semibold text-slate-700">Client ID (PK)</th>
                  <th className="py-3 px-3 font-semibold text-slate-700">Project Code (FK)</th>
                  <th className="py-3 px-2 w-12 text-center">Priority</th>
                  <th className="py-3 px-3 font-semibold text-slate-700">Client Name</th>
                  <th className="py-3 px-3 font-semibold text-slate-700">Company</th>
                  <th className="py-3 px-3 font-semibold text-slate-700 text-right">Listed Price</th>
                  <th className="py-3 px-3 font-semibold text-slate-700">Address</th>
                  <th className="py-3 px-3 font-semibold text-slate-700 text-center">Status</th>
                  <th className="py-3 px-3 font-semibold text-slate-700 text-center">Date</th>
                  <th className="py-3 px-3 font-semibold text-slate-700">Next Step</th>
                  <th className="py-3 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClients.map((client) => {
                  const fin = clientFinancials.get(client.id);
                  const isSelected = selectedIds.includes(client.id);
                  const displayValue = fin?.totalInvoiced && fin.totalInvoiced > 0 
                    ? `LKR ${fin.totalInvoiced.toLocaleString()}` 
                    : `LKR ${(client.creditLimit || 3500000).toLocaleString()}`;
                  const matchingProjects = projects.filter(p => p.client?.id === client.id || (p.client?.name && p.client.name.toLowerCase() === client.name.toLowerCase()));
                  const pCode = matchingProjects[0]?.projectCode || (matchingProjects[0] ? matchingProjects[0].id.slice(0, 10) : null);

                  return (
                    <tr 
                      key={client.id}
                      onClick={() => setDrawerClient(client)}
                      className={cn(
                        "hover:bg-slate-50/80 transition-colors cursor-pointer group whitespace-nowrap",
                        isSelected && "bg-orange-50/30"
                      )}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 pl-4" onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectOne(client.id)}
                          className="rounded border-slate-300 text-orange-500 focus:ring-orange-400"
                        />
                      </td>

                      {/* PK: Client ID */}
                      <td className="py-3.5 px-3" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setDrawerClient(client)}
                          className="font-mono font-bold text-xs text-slate-900 bg-slate-100 hover:bg-orange-50 hover:text-orange-600 px-2 py-0.5 rounded border border-slate-200 inline-flex items-center gap-1 shadow-2xs transition-colors"
                          title={`Primary Key: ${client.registrationNo || client.id} (Click for Details)`}
                        >
                          <User size={11} className="text-orange-500 shrink-0" />
                          <span>PK: {client.registrationNo || client.id.slice(0, 8).toUpperCase()}</span>
                        </button>
                      </td>

                      {/* FK: Project Code */}
                      <td className="py-3.5 px-3" onClick={(e) => e.stopPropagation()}>
                        {pCode ? (
                          <button
                            onClick={() => setSelectedProjectFilter(matchingProjects[0].id)}
                            className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-orange-700 bg-orange-50 hover:bg-orange-100 px-2 py-0.5 rounded border border-orange-200/80 transition-colors shadow-2xs"
                            title={`Foreign Key: Project Code ${pCode} (Click to filter)`}
                          >
                            <Folder size={11} className="text-orange-500 shrink-0" />
                            <span>FK: {pCode}</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">FK: None</span>
                        )}
                      </td>

                      {/* 3-Bar Signal Priority (Image 6) */}
                      <td className="py-3.5 px-2 text-center">
                        <div className="flex justify-center">
                          {renderPrioritySignal(fin?.priority || 'medium')}
                        </div>
                      </td>

                      {/* Client Name with Avatar */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center text-slate-500 font-bold">
                            {client.avatar ? (
                              <img src={client.avatar} alt={client.name} className="w-full h-full object-cover" />
                            ) : (
                              client.name.charAt(0)
                            )}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 group-hover:text-orange-600 transition-colors block">
                              {client.name}
                            </span>
                            <span className="text-[11px] text-slate-400 truncate block">
                              {client.email || 'partner@enterprise.lk'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Company with colored dot indicator */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "w-2 h-2 rounded-full shrink-0",
                            client.category === CustomerCategory.COMPANY ? "bg-indigo-500" : "bg-sky-400"
                          )}></span>
                          <span className="font-medium text-slate-700">{client.tradeName || client.name}</span>
                        </div>
                      </td>

                      {/* Listed Price / Deal Value */}
                      <td className="py-3.5 px-3 text-right">
                        <span className="font-mono font-semibold text-slate-900">
                          {displayValue}
                        </span>
                      </td>

                      {/* Address */}
                      <td className="py-3.5 px-3 text-slate-500">
                        <div className="flex items-center gap-1.5 truncate max-w-[180px]" title={client.address}>
                          <MapPin size={12} className="text-slate-400 shrink-0" />
                          <span className="truncate">{client.address || 'Colombo, Sri Lanka'}</span>
                        </div>
                      </td>

                      {/* Status Pill (Image 6) */}
                      <td className="py-3.5 px-3 text-center">
                        {getStatusPill(client.status)}
                      </td>

                      {/* Registration Date */}
                      <td className="py-3.5 px-3 text-center text-slate-500 font-mono text-[11px]">
                        {client.sinceDate || '2026-03-12'}
                      </td>

                      {/* Next Step */}
                      <td className="py-3.5 px-3 text-slate-600 font-medium">
                        <span className="inline-block truncate max-w-[200px]" title={fin?.nextStep}>
                          {fin?.nextStep || 'Start project implementation'}
                        </span>
                      </td>

                      {/* Row Actions */}
                      <td className="py-3.5 pr-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setDrawerClient(client)}
                            className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            title="Open Member Drawer & Chat"
                          >
                            <MessageSquare size={13} />
                          </button>
                          <button
                            onClick={() => handleOpenModal(client)}
                            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={13} />
                          </button>
                          {onViewPortal && (
                            <button
                              onClick={() => onViewPortal(client)}
                              className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Customer Portal"
                            >
                              <ExternalLink size={13} />
                            </button>
                          )}
                          <button
                            onClick={() => setClientToDelete(client.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredClients.length === 0 && (
            <div className="py-12 text-center text-xs text-slate-400">
              No matching business partners found. Click "+ Add new" to create one.
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 4. CARDS VIEW                                        */}
      {/* ---------------------------------------------------- */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => {
            const fin = clientFinancials.get(client.id);
            return (
              <div 
                key={client.id}
                onClick={() => setDrawerClient(client)}
                className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs hover:border-orange-300 hover:shadow-sm transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 overflow-hidden">
                        {client.avatar ? (
                          <img src={client.avatar} alt={client.name} className="w-full h-full object-cover" />
                        ) : (
                          client.name.charAt(0)
                        )}
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900 group-hover:text-orange-600 transition-colors">{client.name}</h3>
                        <p className="text-[11px] text-slate-400">{client.industry || 'Commercial Construction'}</p>
                      </div>
                    </div>
                    {getStatusPill(client.status)}
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 my-3">
                    <div className="flex items-center gap-2">
                      <Mail size={12} className="text-slate-400 shrink-0" />
                      <span className="truncate">{client.email || 'partner@enterprise.lk'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone size={12} className="text-slate-400 shrink-0" />
                      <span className="font-mono">{client.phone || '+94 11 234 5678'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={12} className="text-slate-400 shrink-0" />
                      <span className="truncate">{client.address || 'Colombo 07, Sri Lanka'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Annual Deal Value</span>
                    <span className="text-xs font-semibold font-mono text-slate-900">
                      LKR {(fin?.totalInvoiced || client.creditLimit || 3500000).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setDrawerClient(client)}
                      className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                      title="Chat"
                    >
                      <MessageSquare size={13} />
                    </button>
                    <button
                      onClick={() => handleOpenModal(client)}
                      className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 5. KANBAN VIEW                                       */}
      {/* ---------------------------------------------------- */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {kanbanLanes.map((lane) => {
            const laneClients = filteredClients.filter(c => {
              if (lane.id === 'Active') return c.status === 'Active' || c.status === 'Accepted';
              if (lane.id === 'In Negotiation') return c.status === 'In Negotiation';
              if (lane.id === 'On Hold') return c.status === 'On Hold' || c.status === 'Under Review';
              return c.status === 'Inactive' || c.status === 'Rejected';
            });

            return (
              <div key={lane.id} className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex flex-col space-y-3 min-h-[450px]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: lane.color }}></span>
                    <h3 className="text-xs font-semibold text-slate-800">{lane.name}</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-white text-slate-600 text-[10px] font-bold border border-slate-200">
                    {laneClients.length}
                  </span>
                </div>

                <div className="space-y-2.5 flex-1">
                  {laneClients.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => setDrawerClient(c)}
                      className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs hover:shadow-sm hover:border-orange-300 transition-all cursor-pointer group"
                    >
                      <h4 className="text-xs font-semibold text-slate-900 group-hover:text-orange-600 transition-colors">{c.name}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">{c.tradeName || c.industry}</p>
                      <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-100 text-[11px]">
                        <span className="text-slate-500 font-mono font-medium">
                          LKR {(clientFinancials.get(c.id)?.totalInvoiced || c.creditLimit || 3500000).toLocaleString()}
                        </span>
                        <ChevronRight size={12} className="text-slate-300 group-hover:text-orange-500 transition-colors" />
                      </div>
                    </div>
                  ))}
                  {laneClients.length === 0 && (
                    <div className="py-10 text-center text-xs text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                      Empty Lane
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 6. MEMBER PROFILE & QUICK CHAT DRAWER (Image 1 Style) */}
      {/* ---------------------------------------------------- */}
      <AnimatePresence>
        {drawerClient && (
          <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-slate-900/30 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between border-l border-slate-200"
            >
              {/* Drawer Header */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User size={16} className="text-orange-500" />
                  <h3 className="text-sm font-semibold text-slate-900">Partner Details & Live Chat</h3>
                </div>
                <button
                  onClick={() => setDrawerClient(null)}
                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Drawer Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {/* Member Profile Banner (Image 1) */}
                <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100">
                  <div className="relative">
                    <img 
                      src={drawerClient.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"} 
                      alt={drawerClient.name} 
                      className="w-12 h-12 rounded-full object-cover border border-slate-200"
                    />
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" title="Online"></span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 truncate">{drawerClient.name}</h4>
                    <p className="text-xs text-slate-500 truncate">{drawerClient.email || 'partner@enterprise.lk'}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-orange-50 text-orange-700 border border-orange-200/60">
                        {drawerClient.tier || 'Enterprise Partner'}
                      </span>
                      <span className="text-[11px] text-slate-400">{drawerClient.tradeName || drawerClient.industry}</span>
                    </div>
                  </div>
                </div>

                {/* Linked Projects for this Client (Foreign Key Integration) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Folder size={14} className="text-orange-500" />
                      <span>Linked Projects ({projects.filter(p => p.client?.id === drawerClient.id || p.client?.name === drawerClient.name).length})</span>
                    </h5>
                    {onNewProjectForClient && (
                      <button
                        onClick={() => onNewProjectForClient(drawerClient)}
                        className="text-[11px] font-semibold text-orange-600 hover:underline flex items-center gap-0.5"
                      >
                        <Plus size={11} /> New Project
                      </button>
                    )}
                  </div>

                  {projects.filter(p => p.client?.id === drawerClient.id || p.client?.name === drawerClient.name).length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic">No projects registered under this client yet.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                      {projects
                        .filter(p => p.client?.id === drawerClient.id || p.client?.name === drawerClient.name)
                        .map(p => (
                          <div key={p.id} className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between gap-2 text-xs">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-[10px] font-bold text-orange-600 bg-orange-50 px-1 rounded">
                                  {p.projectCode || p.id.slice(0, 8)}
                                </span>
                                <span className="font-semibold text-slate-900 truncate">{p.projectName}</span>
                              </div>
                              <span className="text-[10px] text-slate-400 block mt-0.5">
                                {p.status} • {p.currency || 'Rs.'} {p.totalValue.toLocaleString()}
                              </span>
                            </div>
                            {onNavigateToProject && (
                              <button
                                onClick={() => onNavigateToProject(p.id)}
                                className="px-2 py-1 bg-white border border-slate-200 hover:bg-orange-50 hover:text-orange-600 text-slate-700 rounded-lg text-[10px] font-bold shrink-0 transition-colors"
                              >
                                Open Hub
                              </button>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* Meeting Schedule Widget (Image 1) */}
                <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl">
                  <div className="flex items-center justify-between text-[11px] text-amber-800 font-medium mb-1">
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> Upcoming Sync
                    </span>
                    <span>Tomorrow 10:00 AM</span>
                  </div>
                  <h5 className="text-xs font-semibold text-slate-900">Commercial Proposal Review</h5>
                  <p className="text-[11px] text-slate-600 mt-0.5">Discussing facade glazing bill of quantities & payment milestones.</p>
                </div>

                {/* Voice Note Memo Player (Image 1) */}
                <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
                    <span>Voice Memo from Site Engineer</span>
                    <span className="font-mono">1:12</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                      className="w-8 h-8 rounded-full bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center transition-colors shadow-xs shrink-0"
                    >
                      {isPlayingAudio ? <Pause size={13} /> : <Play size={13} className="ml-0.5" />}
                    </button>
                    {/* Audio Waveform */}
                    <div className="flex-1 flex items-center gap-1 h-5">
                      {[30, 60, 90, 50, 20, 75, 100, 65, 40, 55, 85, 45, 25, 65, 80, 35].map((h, i) => (
                        <div 
                          key={i} 
                          className={cn(
                            "flex-1 rounded-full transition-all",
                            isPlayingAudio && i < 9 ? "bg-orange-500" : "bg-slate-300"
                          )}
                          style={{ height: `${h}%` }}
                        ></div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Live Conversation Stream (Image 1) */}
                <div>
                  <h5 className="text-xs font-semibold text-slate-900 mb-2.5">Communication Stream</h5>
                  <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                    {(clientChats[drawerClient.id] || clientChats.default).map((m) => (
                      <div 
                        key={m.id} 
                        className={cn(
                          "p-3 rounded-xl text-xs",
                          m.isMe ? "bg-orange-50 border border-orange-200/60 ml-4" : "bg-slate-50 border border-slate-200/60 mr-4"
                        )}
                      >
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                          <span className="font-semibold text-slate-700">{m.sender}</span>
                          <span>{m.time}</span>
                        </div>
                        <p className="text-slate-800 leading-relaxed">{m.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Message Composer Box (Image 1) */}
              <div className="p-4 border-t border-slate-100 bg-white">
                <form onSubmit={handleSendChatMessage} className="relative flex items-center">
                  <input 
                    type="text"
                    placeholder="Write message to client team..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="w-full pl-3 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500"
                  />
                  <button 
                    type="submit"
                    className="absolute right-1.5 p-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors shadow-xs"
                  >
                    <Send size={13} />
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ---------------------------------------------------- */}
      {/* 7. CLEAN ADD / EDIT PARTNER MODAL                    */}
      {/* ---------------------------------------------------- */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-xl max-w-xl w-full overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-sm font-semibold text-slate-900">
                  {editingClient ? 'Edit Business Partner' : 'New Business Partner Entry'}
                </h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveForm} className="p-6 space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Company / Client Name *</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. Access Engineering PLC"
                      value={formData.name || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Trade Name / Brand</label>
                    <input 
                      type="text"
                      placeholder="e.g. Access Towers"
                      value={formData.tradeName || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, tradeName: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500"
                    >
                      <option value={CustomerCategory.COMPANY}>Enterprise / Corporate</option>
                      <option value={CustomerCategory.INDIVIDUAL}>Individual / Private</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500"
                    >
                      <option value="Active">Accepted / Active</option>
                      <option value="In Negotiation">In Negotiation</option>
                      <option value="Follow-Up Required">Follow-Up Required</option>
                      <option value="Under Review">Under Review</option>
                      <option value="On Hold">On Hold</option>
                      <option value="Inactive">Rejected / Inactive</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Email</label>
                    <input 
                      type="email"
                      placeholder="contact@access.lk"
                      value={formData.email || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Phone</label>
                    <input 
                      type="text"
                      placeholder="+94 11 234 5678"
                      value={formData.phone || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block font-medium text-slate-700 mb-1">Address / Site Location</label>
                    <input 
                      type="text"
                      placeholder="Level 14, Access Towers, Colombo 02, Sri Lanka"
                      value={formData.address || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Credit Limit (LKR)</label>
                    <input 
                      type="number"
                      value={formData.creditLimit || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, creditLimit: Number(e.target.value) }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Payment Terms</label>
                    <select
                      value={formData.paymentTerms}
                      onChange={(e) => setFormData(prev => ({ ...prev, paymentTerms: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500"
                    >
                      <option value="Immediate">Immediate / COD</option>
                      <option value="Credit 14 Days">Credit 14 Days</option>
                      <option value="Credit 30 Days">Credit 30 Days</option>
                      <option value="Credit 60 Days">Credit 60 Days</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium transition-colors shadow-xs"
                  >
                    Save Partner
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal for Delete */}
      <ConfirmationModal
        isOpen={!!clientToDelete}
        title="Delete Business Partner"
        message="Are you sure you want to delete this business partner? All associated historical transactions will remain archived."
        confirmText="Delete Partner"
        onConfirm={() => {
          if (clientToDelete) {
            onDeleteClient(clientToDelete);
            setClientToDelete(null);
          }
        }}
        onClose={() => setClientToDelete(null)}
      />
    </div>
  );
};
