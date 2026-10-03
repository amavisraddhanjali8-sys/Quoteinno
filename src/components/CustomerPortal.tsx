import React, { useState, useMemo, useEffect } from 'react';
import { 
  Building2, 
  User, 
  Layout, 
  FileText, 
  ShoppingCart, 
  DollarSign, 
  Files, 
  MessageSquare, 
  Clock, 
  Download, 
  MapPin, 
  Phone, 
  Mail, 
  ShieldCheck, 
  Info, 
  ArrowLeft,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Plus,
  Send,
  Upload,
  Search,
  Paperclip,
  Wrench,
  HelpCircle,
  Menu,
  Globe,
  PlusCircle,
  Tag as TagIcon,
  Filter,
  Trash2,
  Edit2,
  X
} from 'lucide-react';
import { 
  Client, 
  Project, 
  Quote, 
  Invoice, 
  Payment, 
  Adjustment, 
  Inquiry, 
  ServiceVisitRequest,
  CustomerCategory,
  QuoteStatus,
  InvoiceStatus
} from '../types';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { ExportActions } from './common/ExportActions';
import { downloadCSV, downloadPDFTable } from '../services/dataExportService';

interface CustomerDoc {
  id: string;
  name: string;
  type: string;
  date: string;
  size: string;
}

interface CustomerPortalProps {
  client: Client;
  allClients?: Client[];
  onSelectClient?: (client: Client) => void;
  projects: Project[];
  quotes: Quote[];
  invoices: Invoice[];
  payments: Payment[];
  adjustments: Adjustment[];
  inquiries: Inquiry[];
  serviceRequests?: ServiceVisitRequest[];
  onBack: () => void;
  onSendInquiry?: (inquiry: Inquiry) => void;
  onDeleteInquiry?: (id: string) => void;
  onSendServiceRequest?: (request: ServiceVisitRequest) => void;
  onDeleteServiceRequest?: (id: string) => void;
  onSaveClient?: (client: Client) => void;
  onDeleteClient?: (id: string) => void;
  initialTab?: 'profile' | 'projects' | 'quotes' | 'orders' | 'finance' | 'documents' | 'messages' | 'service';
  onNavigate?: (view: any) => void;
}

export const CustomerPortal: React.FC<CustomerPortalProps> = ({
  client,
  allClients,
  onSelectClient,
  projects,
  quotes,
  invoices,
  inquiries,
  serviceRequests = [],
  onBack,
  onSendInquiry,
  onDeleteInquiry,
  onSendServiceRequest,
  onDeleteServiceRequest,
  onSaveClient,
  onDeleteClient,
  initialTab = 'projects',
  onNavigate: _onNavigate
}) => {
  const [activeTab, setActiveTab ] = useState<'profile' | 'projects' | 'quotes' | 'orders' | 'finance' | 'documents' | 'messages' | 'service'>(initialTab);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projectSearch, setProjectSearch] = useState('');
  const [quoteSearch, setQuoteSearch] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Interactive Documents State
  const [documentsList, setDocumentsList] = useState<CustomerDoc[]>([
    { id: 'doc-1', name: 'FABRICATION_DRAWINGS_V1.PDF', type: 'Drawing', date: '2024-03-20', size: '4.2 MB' },
    { id: 'doc-2', name: 'STRUCTURAL_CERT_294.PDF', type: 'Compliance', date: '2024-03-15', size: '1.1 MB' },
    { id: 'doc-3', name: 'ALUMINIUM_ALLOY_6063_DATA.PDF', type: 'Specs', date: '2024-03-10', size: '0.8 MB' },
    { id: 'doc-4', name: 'WARRANTY_CERTIFICATE_992.PDF', type: 'Warranty', date: '2024-02-28', size: '1.5 MB' }
  ]);
  const [isAddingDoc, setIsAddingDoc] = useState(false);
  const [editingDoc, setEditingDoc] = useState<CustomerDoc | null>(null);
  const [docForm, setDocForm] = useState({ name: '', type: 'Drawing', size: '2.5 MB' });

  // Interactive Inquiries State
  const [localInquiries, setLocalInquiries] = useState<Inquiry[]>(inquiries);
  useEffect(() => {
    setLocalInquiries(inquiries);
  }, [inquiries]);

  const [inquiryText, setInquiryText] = useState('');
  const [isAddingInquiryModal, setIsAddingInquiryModal] = useState(false);
  const [inquiryForm, setInquiryForm] = useState({
    subject: '',
    message: '',
    regardingType: 'Project' as Inquiry['regardingType'],
    regardingId: projects[0]?.id || ''
  });

  // Interactive Service Requests State
  const [localRequests, setLocalRequests] = useState<ServiceVisitRequest[]>(serviceRequests);
  useEffect(() => {
    setLocalRequests(serviceRequests);
  }, [serviceRequests]);

  const [serviceForm, setServiceForm] = useState({
    projectId: projects[0]?.id || '',
    issueDetails: '',
    urgency: 'Medium' as ServiceVisitRequest['urgency'],
    preferredDate: new Date().toISOString().split('T')[0]
  });

  // Client Profile Editing State
  const [isEditingClient, setIsEditingClient] = useState(false);
  const [clientForm, setClientForm] = useState({
    name: client.name,
    tradeName: client.tradeName || '',
    email: client.email || '',
    phone: client.phone || '',
    website: client.website || '',
    taxNo: client.taxNo || '',
    registrationNo: client.registrationNo || '',
    address: client.address || ''
  });

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    projects.forEach(p => p.tags?.forEach(t => tags.add(t)));
    quotes.forEach(q => q.client.tags?.forEach(t => tags.add(t)));
    client.tags?.forEach(t => tags.add(t));
    return Array.from(tags);
  }, [projects, quotes, client.tags]);

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchesSearch = p.projectName.toLowerCase().includes(projectSearch.toLowerCase());
      const matchesTags = selectedTags.length === 0 || selectedTags.every(t => p.tags?.includes(t));
      return matchesSearch && matchesTags;
    });
  }, [projects, projectSearch, selectedTags]);

  const activeProjects = filteredProjects.filter(p => p.status === 'In Progress');
  const completedProjects = filteredProjects.filter(p => p.status === 'Completed');

  const filteredQuotes = useMemo(() => {
    return quotes.filter(q => {
      const isClient = q.client.id === client.id;
      const matchesSearch = q.projectName.toLowerCase().includes(quoteSearch.toLowerCase()) || q.quoteNo.toLowerCase().includes(quoteSearch.toLowerCase());
      const matchesTags = selectedTags.length === 0 || selectedTags.every(t => q.client.tags?.includes(t));
      return isClient && matchesSearch && matchesTags;
    });
  }, [quotes, client.id, quoteSearch, selectedTags]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => inv.client.id === client.id);
  }, [invoices, client.id]);

  const outstandingBalance = useMemo(() => {
    return filteredInvoices.reduce((sum, inv) => sum + inv.balanceDue, 0);
  }, [filteredInvoices]);

  const tabs = [
    { id: 'profile', icon: User, label: 'Portal Profile' },
    { id: 'projects', icon: Layout, label: 'Project Flux' },
    { id: 'quotes', icon: FileText, label: 'Quotations' },
    { id: 'orders', icon: ShoppingCart, label: 'Order Status' },
    { id: 'finance', icon: DollarSign, label: 'Financial Matrix' },
    { id: 'documents', icon: Files, label: 'Archive/Repo' },
    { id: 'messages', icon: MessageSquare, label: 'Neural Mesh / Chat' },
    { id: 'service', icon: Wrench, label: 'Service Hub' }
  ];

  const activeTabClass = "bg-blue-50 text-blue-700 border border-blue-200/60 shadow-2xs font-semibold";
  const inactiveTabClass = "text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-700 font-sans selection:bg-blue-100">
      {/* Sidebar Navigation */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200/80 transition-all duration-300 lg:translate-x-0 shadow-xs",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center gap-3 mb-6 px-2 shrink-0">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-xs font-bold text-xs">IM</div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 tracking-wide">Innovista Master</h1>
              <p className="text-[9px] font-semibold text-blue-600 tracking-wider">Enterprise Customer Portal</p>
            </div>
          </div>

          <nav className="flex-1 space-y-0.5 overflow-y-auto no-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as any); setIsSidebarOpen(false); }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[11px] font-medium tracking-wide transition-all duration-200",
                  activeTab === tab.id ? activeTabClass : inactiveTabClass
                )}
              >
                <tab.icon size={15} className={activeTab === tab.id ? "text-blue-600" : "text-slate-400"} />
                {tab.label}
              </button>
            ))}
          </nav>

          <button 
            onClick={onBack}
            className="mt-auto flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all border border-transparent hover:border-rose-200/60"
          >
            <ArrowLeft size={14} /> Decouple Portal
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="lg:pl-72 min-h-screen transition-all duration-300">
        {/* Top Navigation / Header */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-6 py-2.5 flex items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg shrink-0"
            >
              <Menu size={16} />
            </button>
            <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Building2 size={16} />
            </div>
            <div className="flex items-baseline gap-2 min-w-0">
              <h2 className="text-sm font-bold text-slate-900 whitespace-nowrap">
                Customer Portal
              </h2>
              <span className="text-xs text-slate-500 font-normal truncate hidden sm:inline">
                • {tabs.find(t => t.id === activeTab)?.label || 'Workspace'} — {client.name}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Export Actions for Customer Portal */}
            <ExportActions 
              onExportCSV={() => {
                if (activeTab === 'projects') {
                  const headers = ['Project Name', 'Location', 'Status', 'Progress', 'Start Date', 'End Date'];
                  const rows = filteredProjects.map(p => {
                    const pAny = p as any;
                    return [
                      `"${p.projectName}"`,
                      `"${pAny.siteAddress || p.client?.address || ''}"`,
                      `"${p.status}"`,
                      `"${pAny.progress || 0}%"`,
                      `"${p.startDate}"`,
                      `"${pAny.endDate || ''}"`
                    ];
                  });
                  downloadCSV(`client-${client.name.replace(/\s+/g, '-').toLowerCase()}-projects.csv`, headers, rows);
                } else if (activeTab === 'quotes') {
                  const headers = ['Quote No', 'Project Name', 'Version', 'Total Amount', 'Status', 'Valid Until'];
                  const rows = filteredQuotes.map(q => [
                    `"${q.quoteNo}"`,
                    `"${q.projectName}"`,
                    `"v${q.version}"`,
                    `"${q.currency} ${calculateQuoteTotal(q)}"`,
                    `"${q.status}"`,
                    `"${q.validUntil || ''}"`
                  ]);
                  downloadCSV(`client-${client.name.replace(/\s+/g, '-').toLowerCase()}-quotes.csv`, headers, rows);
                } else if (activeTab === 'finance') {
                  const headers = ['Invoice No', 'Project', 'Date', 'Grand Total', 'Paid', 'Status'];
                  const rows = filteredInvoices.map(i => [
                    `"${i.invoiceNo}"`,
                    `"${i.projectName}"`,
                    `"${i.date}"`,
                    `"LKR ${i.grandTotal}"`,
                    `"LKR ${i.amountPaid}"`,
                    `"${i.status}"`
                  ]);
                  downloadCSV(`client-${client.name.replace(/\s+/g, '-').toLowerCase()}-invoices.csv`, headers, rows);
                } else {
                  const headers = ['Client Attribute', 'Value'];
                  const rows = [
                    ['"Name"', `"${client.name}"`],
                    ['"Category"', `"${client.category}"`],
                    ['"Classification"', `"${client.classification || ''}"`],
                    ['"Email"', `"${client.email || ''}"`],
                    ['"Phone"', `"${client.phone || ''}"`],
                    ['"Credit Limit"', `"LKR ${client.creditLimit}"`],
                    ['"Outstanding Balance"', `"LKR ${outstandingBalance}"`],
                    ['"Payment Terms"', `"${client.paymentTerms}"`]
                  ];
                  downloadCSV(`client-${client.name.replace(/\s+/g, '-').toLowerCase()}-profile.csv`, headers, rows);
                }
              }}
              onExportPDF={() => {
                if (activeTab === 'projects') {
                  const headers = ['Project Name', 'Location', 'Status', 'Progress'];
                  const rows = filteredProjects.map(p => {
                    const pAny = p as any;
                    return [
                      p.projectName,
                      pAny.siteAddress || p.client?.address || 'N/A',
                      p.status,
                      `${pAny.progress || 0}%`
                    ];
                  });
                  downloadPDFTable(
                    `${client.name} — Project Portfolio`,
                    headers,
                    rows,
                    `client-${client.name.replace(/\s+/g, '-').toLowerCase()}-projects.pdf`,
                    'Active and completed aluminium & glazing execution milestones'
                  );
                } else if (activeTab === 'quotes') {
                  const headers = ['Quote No', 'Project Name', 'Total Amount', 'Status'];
                  const rows = filteredQuotes.map(q => [
                    q.quoteNo,
                    q.projectName,
                    `${q.currency} ${calculateQuoteTotal(q).toLocaleString()}`,
                    q.status
                  ]);
                  downloadPDFTable(
                    `${client.name} — Quotations & Proposals`,
                    headers,
                    rows,
                    `client-${client.name.replace(/\s+/g, '-').toLowerCase()}-quotes.pdf`,
                    'Official BOQ estimates and technical proposals'
                  );
                } else if (activeTab === 'finance') {
                  const headers = ['Invoice No', 'Project', 'Date', 'Total', 'Status'];
                  const rows = filteredInvoices.map(i => [
                    i.invoiceNo,
                    i.projectName,
                    i.date,
                    `LKR ${i.grandTotal.toLocaleString()}`,
                    i.status
                  ]);
                  downloadPDFTable(
                    `${client.name} — Financial Invoices & Ledger`,
                    headers,
                    rows,
                    `client-${client.name.replace(/\s+/g, '-').toLowerCase()}-invoices.pdf`,
                    `Current outstanding ledger balance: LKR ${outstandingBalance.toLocaleString()}`
                  );
                } else {
                  const headers = ['Attribute', 'Detail'];
                  const rows = [
                    ['Client Legal Name', client.name],
                    ['Entity Classification', `${client.category} — ${client.classification || 'General'}`],
                    ['Registration / Tax ID', `${client.registrationNo || 'N/A'} / ${client.taxNo || 'N/A'}`],
                    ['Communication Channel', `${client.email || 'N/A'} | ${client.phone || 'N/A'}`],
                    ['Credit Facility', `LKR ${client.creditLimit.toLocaleString()} (Terms: ${client.paymentTerms})`],
                    ['Outstanding Balance', `LKR ${outstandingBalance.toLocaleString()}`]
                  ];
                  downloadPDFTable(
                    `Client Dossier — ${client.name}`,
                    headers,
                    rows,
                    `client-${client.name.replace(/\s+/g, '-').toLowerCase()}-dossier.pdf`,
                    'Official customer profile, compliance matrix and credit account summary'
                  );
                }
              }}
              labelCSV="Export CSV"
              labelPDF="Export PDF"
            />

            {allClients && onSelectClient && allClients.length > 1 && (
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 shadow-2xs">
                <User size={13} className="text-orange-500 shrink-0" />
                <select
                  value={client.id}
                  onChange={(e) => {
                    const found = allClients.find(c => c.id === e.target.value);
                    if (found) onSelectClient(found);
                  }}
                  className="bg-transparent text-xs text-slate-800 border-none outline-none cursor-pointer pr-1"
                >
                  {allClients.map(c => (
                    <option key={c.id} value={c.id} className="bg-white text-slate-900">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={onBack}
              title="Return to ERP"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-200/80 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold transition-colors shrink-0"
            >
              <ArrowLeft size={13} />
              <span className="hidden sm:inline">Exit</span>
            </button>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="p-4 lg:p-6 w-full space-y-6 pb-24">
          {activeTab === 'profile' && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
               <div className="xl:col-span-2 space-y-6">
                  <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden group">
                     <div className="relative">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                           <div className="flex items-center gap-4">
                              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 border border-blue-100 shadow-2xs">
                                 {client.category === CustomerCategory.COMPANY ? <Building2 size={28} /> : <User size={28} />}
                              </div>
                              <div>
                                 <h3 className="text-xl font-bold text-slate-900 tracking-tight">{client.name}</h3>
                                 <p className="text-xs font-medium text-slate-500 mt-1">{client.tradeName || 'No Trade Name Specified'}</p>
                              </div>
                           </div>
                           <div className="flex items-center gap-2 self-start sm:self-auto">
                              <button
                                 onClick={() => {
                                    setClientForm({
                                       name: client.name,
                                       tradeName: client.tradeName || '',
                                       email: client.email || '',
                                       phone: client.phone || '',
                                       website: client.website || '',
                                       taxNo: client.taxNo || '',
                                       registrationNo: client.registrationNo || '',
                                       address: client.address || ''
                                    });
                                    setIsEditingClient(true);
                                 }}
                                 className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors"
                              >
                                 <Edit2 size={13} />
                                 <span>Edit Profile</span>
                              </button>
                              {onDeleteClient && (
                                 <button
                                    onClick={() => {
                                       if (window.confirm(`Are you sure you want to delete customer "${client.name}"? This action cannot be undone.`)) {
                                          onDeleteClient(client.id);
                                          onBack();
                                       }
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-xl border border-rose-200 transition-colors"
                                 >
                                    <Trash2 size={13} />
                                    <span>Delete</span>
                                 </button>
                              )}
                           </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="space-y-4">
                              <h4 className="text-xs font-semibold text-slate-900 tracking-tight border-b border-slate-100 pb-2">Operational Registry</h4>
                              <div className="space-y-2">
                                 <ProfileField label="Identity type" value={client.category} icon={Info} />
                                 <ProfileField label="Classification" value={client.classification || 'General'} icon={ShieldCheck} />
                                 <ProfileField label="Official reg no" value={client.registrationNo || 'Unclassified'} icon={ShieldCheck} />
                                 <ProfileField label="Tax matrix id" value={client.taxNo || 'Not recorded'} icon={DollarSign} />
                                 <ProfileField label="Registry date" value={client.sinceDate} icon={Calendar} />
                              </div>
                           </div>
                           <div className="space-y-4">
                              <h4 className="text-xs font-semibold text-slate-900 tracking-tight border-b border-slate-100 pb-2">Communications & Meta</h4>
                              <div className="space-y-2">
                                 <ProfileField label="Operational email" value={client.email || 'None'} icon={Mail} />
                                 <ProfileField label="Global hotline" value={client.phone || 'None'} icon={Phone} />
                                 <ProfileField label="Digital hub" value={client.website || 'Offline'} icon={Globe} />
                                 <ProfileField label="Language mode" value={client.language} icon={MessageSquare} />
                                 {client.tags && client.tags.length > 0 && (
                                   <div className="pt-3 border-t border-slate-100 mt-3">
                                      <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Strategic Tags</p>
                                      <div className="flex flex-wrap gap-1.5">
                                        {client.tags.map((tag, i) => (
                                          <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[9px] font-medium rounded-md border border-blue-200/60">
                                            {tag}
                                          </span>
                                        ))}
                                      </div>
                                   </div>
                                 )}
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                     <h4 className="text-xs font-semibold text-slate-900 tracking-tight border-b border-slate-100 pb-2 mb-4">Contact Directory</h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {client.contactPersons.map(person => (
                           <div key={person.id} className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/80 hover:border-blue-300 hover:bg-white transition-all group/person">
                              <div className="flex items-center justify-between mb-3">
                                 <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-slate-500 group-hover/person:text-blue-600 border border-slate-200/80 shadow-2xs transition-colors">
                                       <User size={16} />
                                    </div>
                                    <div>
                                       <h4 className="text-sm font-semibold text-slate-900">{person.name}</h4>
                                       <p className="text-[10px] text-slate-500">{person.jobTitle}</p>
                                    </div>
                                 </div>
                                 {person.isPrimary && (
                                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[9px] font-semibold rounded-md border border-blue-200/60">Primary</span>
                                 )}
                              </div>
                              <div className="space-y-1">
                                 <div className="flex items-center gap-2 text-xs text-slate-600">
                                    <Mail size={12} className="text-slate-400" /> {person.email}
                                 </div>
                                 <div className="flex items-center gap-2 text-xs text-slate-600">
                                    <Phone size={12} className="text-slate-400" /> {person.phone}
                                 </div>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>

               <div className="space-y-6">
                  <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                     <h4 className="text-xs font-semibold text-slate-900 tracking-tight border-b border-slate-100 pb-2 mb-4">Registered Addresses</h4>
                     <div className="space-y-3">
                        {client.addresses.map(addr => (
                           <div key={addr.id} className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/80">
                              <div className="flex items-center gap-2 mb-1.5">
                                 <span className="text-[9px] font-semibold text-blue-700 px-2 py-0.5 bg-blue-50 rounded-full border border-blue-100">{addr.label}</span>
                              </div>
                              <p className="text-xs font-medium text-slate-800 leading-tight">{addr.street}</p>
                              <p className="text-[11px] text-slate-500 mt-1">{addr.city}, {addr.state} {addr.postalCode}</p>
                           </div>
                        ))}
                     </div>
                  </div>

                  <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                     <h4 className="text-xs font-semibold text-slate-900 tracking-tight border-b border-slate-100 pb-2 mb-4">Financial Facility</h4>
                     <div className="space-y-4">
                        <div>
                           <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Outstanding Ledger Balance</p>
                           <p className="text-2xl font-bold text-slate-900 tracking-tight">LKR {outstandingBalance.toLocaleString()}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                           <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                              <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Credit Limit</p>
                              <p className="text-xs font-bold text-slate-900">LKR {client.creditLimit.toLocaleString()}</p>
                           </div>
                           <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                              <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Payment Cycle</p>
                              <p className="text-xs font-bold text-slate-900">{client.paymentTerms}</p>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'projects' && (
            <div className="space-y-6">
               {/* Search & Tag Filter */}
               <div className="flex flex-col md:flex-row items-center gap-4">
                  <div className="flex-1 flex items-center gap-3 bg-white px-3 py-2 rounded-xl border border-slate-200/80 w-full group focus-within:border-blue-400 shadow-xs transition-all">
                     <Search size={16} className="text-slate-400 group-focus-within:text-blue-600" />
                     <input 
                        type="text" 
                        value={projectSearch}
                        onChange={(e) => setProjectSearch(e.target.value)}
                        placeholder="Search project database..." 
                        className="bg-transparent border-none outline-none flex-1 text-xs font-medium text-slate-800 placeholder:text-slate-400"
                     />
                  </div>
                  {allTags.length > 0 && (
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-0">
                       <Filter size={14} className="text-slate-400 shrink-0" />
                       <div className="flex gap-1.5">
                          {allTags.map(tag => (
                             <button
                                key={tag}
                                onClick={() => setSelectedTags(prev => 
                                   prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                                )}
                                className={cn(
                                   "px-3 py-1 rounded-lg text-[10px] font-semibold transition-all whitespace-nowrap border uppercase",
                                   selectedTags.includes(tag)
                                      ? "bg-blue-600 border-blue-600 text-white shadow-2xs"
                                      : "bg-white border-slate-200/80 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                                )}
                             >
                                {tag}
                             </button>
                          ))}
                       </div>
                    </div>
                  )}
               </div>

               {/* Active Projects */}
               <section className="space-y-3">
                  <div className="flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-blue-600" />
                     <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Active Projects ({activeProjects.length})</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {activeProjects.map(project => (
                        <ProjectCard key={project.id} project={project} onClick={() => { if(project.id === selectedProjectId) setSelectedProjectId(null); else setSelectedProjectId(project.id); }} />
                     ))}
                  </div>
               </section>

               {/* Completed Projects */}
               <section className="space-y-3">
                  <div className="flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-emerald-600" />
                     <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Archived & Delivered ({completedProjects.length})</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {completedProjects.map(project => (
                        <ProjectCard key={project.id} project={project} onClick={() => setSelectedProjectId(project.id)} />
                     ))}
                  </div>
               </section>
            </div>
          )}

          {activeTab === 'quotes' && (
            <div className="space-y-6">
               {/* Search & Tag Filter */}
               <div className="flex flex-col md:flex-row items-center gap-4">
                  <div className="flex-1 flex items-center gap-3 bg-white px-3 py-2 rounded-xl border border-slate-200/80 w-full group focus-within:border-blue-400 shadow-xs transition-all">
                     <Search size={16} className="text-slate-400 group-focus-within:text-blue-600" />
                     <input 
                        type="text" 
                        value={quoteSearch}
                        onChange={(e) => setQuoteSearch(e.target.value)}
                        placeholder="Search quotation reference or project..." 
                        className="bg-transparent border-none outline-none flex-1 text-xs font-medium text-slate-800 placeholder:text-slate-400"
                     />
                  </div>
                  {allTags.length > 0 && (
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-0">
                       <Filter size={14} className="text-slate-400 shrink-0" />
                       <div className="flex gap-1.5">
                          {allTags.map(tag => (
                             <button
                                key={tag}
                                onClick={() => setSelectedTags(prev => 
                                   prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                                )}
                                className={cn(
                                   "px-3 py-1 rounded-lg text-[10px] font-semibold transition-all whitespace-nowrap border uppercase",
                                   selectedTags.includes(tag)
                                      ? "bg-blue-600 border-blue-600 text-white shadow-2xs"
                                      : "bg-white border-slate-200/80 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                                )}
                             >
                                {tag}
                             </button>
                          ))}
                       </div>
                    </div>
                  )}
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-4">
                     {filteredQuotes.map(quote => (
                         <div key={quote.id} className="p-5 bg-white rounded-2xl border border-slate-200/80 hover:border-blue-300 transition-all group shadow-xs">
                           <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3.5">
                                 <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 font-bold border border-blue-100 text-xs">BOQ</div>
                                 <div>
                                    <h4 className="text-sm font-semibold text-slate-900 leading-tight">{quote.projectName}</h4>
                                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                       <span className="text-[10px] text-slate-500">{quote.quoteNo} • Revision {quote.version}</span>
                                       {(quote.projectCode || quote.projectId) && (
                                          <span className="font-mono text-[9px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                                             {quote.projectCode || quote.projectId}
                                          </span>
                                       )}
                                    </div>
                                 </div>
                              </div>
                              <div className="text-right">
                                 <p className="text-base font-bold text-slate-900">{quote.currency} {calculateQuoteTotal(quote).toLocaleString()}</p>
                                 <span className={cn(
                                    "inline-block px-2.5 py-0.5 rounded-full text-[9px] font-semibold mt-0.5 border",
                                    quote.status === QuoteStatus.SENT || quote.status === QuoteStatus.WON ? "bg-emerald-50 text-emerald-700 border-emerald-200" : 
                                    "bg-amber-50 text-amber-700 border-amber-200"
                                 )}>
                                    {quote.status}
                                 </span>
                              </div>
                           </div>

                           <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                              <div className="flex items-center gap-4 text-xs text-slate-500">
                                 <div className="flex items-center gap-1.5">
                                    <Calendar size={13} className="text-slate-400" /> EXP: {quote.validUntil || 'N/A'}
                                 </div>
                                 <div className="flex items-center gap-1.5">
                                    <Clock size={13} className="text-slate-400" /> LEAD: {quote.estimatedDeliveryDays} DAYS
                                 </div>
                              </div>
                              <div className="flex items-center gap-2">
                                 <button className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-all border border-slate-200/80">Preview Hub</button>
                                 <button className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-all shadow-2xs">Download PDF</button>
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>

                  <div className="space-y-6">
                     <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100 shadow-xs relative overflow-hidden">
                        <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-4">Quotation Protocols</h4>
                        <div className="space-y-4">
                           <ProtocolItem title="Review" desc="Verify all line items, specs, and materials in the schedule." />
                           <ProtocolItem title="Clarification" desc="Use the Message Hub for any architectural or technical queries." />
                           <ProtocolItem title="Acceptance" desc="Download, sign, and upload for Order Activation." />
                        </div>
                     </div>

                     <div className="p-6 bg-white rounded-2xl border border-slate-200/80 text-center space-y-4 shadow-xs">
                        <HelpCircle className="mx-auto text-slate-400" size={32} />
                        <div>
                           <h5 className="text-sm font-semibold text-slate-900">Need Custom Specs?</h5>
                           <p className="text-xs text-slate-500 mt-1">Our engineering team is directly accessible via the portal.</p>
                        </div>
                        <button className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200/80 transition-all">Open Inquiry Thread</button>
                     </div>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'finance' && (
            <div className="space-y-6">
               {/* Financial Dashboard */}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <StatCard label="Total Invoiced" value={`LKR ${filteredInvoices.reduce((sum, i) => sum + i.grandTotal, 0).toLocaleString()}`} icon={FileText} color="blue" />
                  <StatCard label="Total Remitted" value={`LKR ${filteredInvoices.reduce((sum, i) => sum + i.amountPaid, 0).toLocaleString()}`} icon={CheckCircle2} color="emerald" />
                  <StatCard label="Outstanding Balance" value={`LKR ${outstandingBalance.toLocaleString()}`} icon={AlertCircle} color="amber" />
               </div>

               <div className="space-y-4">
                  <div className="flex items-center justify-between">
                     <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Electronic Invoices & Statements</h3>
                     <button className="text-xs font-semibold text-blue-600 hover:underline">Download Statement</button>
                  </div>

                  <div className="overflow-hidden bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                     <table className="w-full border-collapse">
                        <thead>
                           <tr className="bg-slate-50 border-b border-slate-200/80">
                              <th className="px-5 py-3.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Reference</th>
                              <th className="px-5 py-3.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Project</th>
                              <th className="px-5 py-3.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Issue Date</th>
                              <th className="px-5 py-3.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Net Amount</th>
                              <th className="px-5 py-3.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                              <th className="px-5 py-3.5 text-right text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                           {filteredInvoices.map(inv => (
                              <tr key={inv.id} className="hover:bg-slate-50 transition-colors group">
                                 <td className="px-5 py-4 text-xs font-semibold text-slate-900">{inv.invoiceNo}</td>
                                 <td className="px-5 py-4 text-xs text-slate-600">{inv.projectName}</td>
                                 <td className="px-5 py-4 text-xs text-slate-500">{inv.date}</td>
                                 <td className="px-5 py-4 text-xs font-bold text-slate-900">LKR {inv.grandTotal.toLocaleString()}</td>
                                 <td className="px-5 py-4">
                                    <span className={cn(
                                       "px-2.5 py-0.5 rounded-full text-[9px] font-semibold border",
                                       inv.status === InvoiceStatus.PAID ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                       inv.status === InvoiceStatus.PARTIAL ? "bg-amber-50 text-amber-700 border-amber-200" :
                                       "bg-slate-100 text-slate-700 border-slate-200"
                                    )}>
                                       {inv.status}
                                    </span>
                                 </td>
                                 <td className="px-5 py-4 text-right">
                                    <button className="w-8 h-8 bg-slate-50 rounded-lg inline-flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-slate-200/80 transition-all">
                                       <Download size={14} />
                                    </button>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>
            </div>
          )}          {activeTab === 'messages' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[500px]">
               {/* Inquiry History */}
               <div className="lg:col-span-1 space-y-4 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-1">
                     <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Conversations</h3>
                     <button 
                        onClick={() => setIsAddingInquiryModal(true)}
                        title="New Inquiry"
                        className="w-7 h-7 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center text-blue-600 transition-colors"
                     >
                        <Plus size={14} />
                     </button>
                  </div>
                  <div className="relative mb-3">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                     <input 
                        type="text" 
                        placeholder="Search threads..."
                        className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-400"
                     />
                  </div>

                  <div className="space-y-2 overflow-y-auto max-h-[400px] no-scrollbar">
                     {localInquiries.length > 0 ? localInquiries.map(inquiry => (
                        <div key={inquiry.id} className="p-3 bg-slate-50/70 hover:bg-blue-50/50 rounded-xl border border-slate-200/80 transition-all group relative">
                           <div className="flex items-center justify-between mb-1">
                              <span className="text-[9px] font-semibold text-blue-600 uppercase tracking-wider">{inquiry.regardingType}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-slate-400">{new Date(inquiry.createdAt).toLocaleDateString()}</span>
                                <button
                                   onClick={(e) => {
                                      e.stopPropagation();
                                      if (window.confirm('Are you sure you want to delete this conversation thread?')) {
                                         if (onDeleteInquiry) onDeleteInquiry(inquiry.id);
                                         setLocalInquiries(prev => prev.filter(i => i.id !== inquiry.id));
                                      }
                                   }}
                                   title="Delete Conversation"
                                   className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                >
                                   <Trash2 size={12} />
                                </button>
                              </div>
                           </div>
                           <h5 className="text-xs font-semibold text-slate-900 truncate">{inquiry.subject}</h5>
                           <p className="text-[11px] text-slate-500 truncate mt-0.5">{inquiry.message}</p>
                        </div>
                     )) : (
                        <div className="text-center py-12">
                           <MessageSquare className="mx-auto text-slate-300 mb-2" size={32} />
                           <p className="text-xs font-medium text-slate-500">No active conversations</p>
                        </div>
                     )}
                  </div>
               </div>

               {/* Chat / New Message UI */}
               <div className="lg:col-span-2 flex flex-col bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
                  <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 border border-blue-100"><Send size={16} /></div>
                        <div>
                           <h3 className="text-sm font-semibold text-slate-900">Direct Support Channel</h3>
                           <p className="text-[10px] text-emerald-600 font-medium">Channel Active • Direct Desk Connection</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="text-xs text-slate-500 font-medium">Team Online</span>
                     </div>
                  </div>

                  <div className="flex-1 p-8 flex items-center justify-center text-center">
                     <div className="max-w-md space-y-4">
                        <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mx-auto border border-slate-200/80"><PlusCircle size={24} /></div>
                        <div>
                           <h4 className="text-sm font-semibold text-slate-900">Start a New Inquiry Thread</h4>
                           <p className="text-xs text-slate-500 mt-1 leading-relaxed">Select a project, quote, or delivery item to initiate a ticket directly with our engineering team.</p>
                        </div>
                        <button 
                           onClick={() => setIsAddingInquiryModal(true)}
                           className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all"
                        >
                           Launch Connection Form
                        </button>
                     </div>
                  </div>

                  <form 
                     onSubmit={(e) => {
                        e.preventDefault();
                        if (!inquiryText.trim()) return;
                        const newInq: Inquiry = {
                           id: 'inq-' + Date.now(),
                           customerId: client.id,
                           subject: inquiryText.slice(0, 30) + (inquiryText.length > 30 ? '...' : ''),
                           message: inquiryText,
                           regardingType: 'Project',
                           regardingId: projects[0]?.id || 'GENERAL',
                           preferredResponse: 'Email',
                           status: 'Pending',
                           createdAt: new Date().toISOString(),
                           history: []
                        };
                        if (onSendInquiry) onSendInquiry(newInq);
                        setLocalInquiries(prev => [newInq, ...prev]);
                        setInquiryText('');
                     }}
                     className="p-3 bg-slate-50 border-t border-slate-200/80 flex items-center gap-2"
                  >
                     <button type="button" className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-lg transition-all"><Paperclip size={16} /></button>
                     <input 
                        type="text" 
                        value={inquiryText}
                        onChange={(e) => setInquiryText(e.target.value)}
                        placeholder="Type a message or reference an item..." 
                        className="flex-1 bg-white px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-400" 
                     />
                     <button type="submit" className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-2xs transition-colors"><Send size={15} /></button>
                  </form>
               </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-6">
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <DocCategory icon={Building2} label="Architectural Plans" count={documentsList.filter(d => d.type === 'Drawing').length} color="blue" />
                  <DocCategory icon={ShieldCheck} label="Compliance Certs" count={documentsList.filter(d => d.type === 'Compliance').length} color="emerald" />
                  <DocCategory icon={FileText} label="Contracts & Agreements" count={documentsList.filter(d => d.type === 'Warranty' || d.type === 'Contract').length} color="indigo" />
                  <DocCategory icon={Upload} label="Uploaded Bills" count={invoices.length} color="amber" />
               </div>

               <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                     <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Document Repository</h3>
                     <div className="flex items-center gap-2">
                        <button 
                           onClick={() => {
                              setEditingDoc(null);
                              setDocForm({ name: '', type: 'Drawing', size: '2.5 MB' });
                              setIsAddingDoc(true);
                           }}
                           className="flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                        >
                           <Plus size={13} />
                           <span>Add Document</span>
                        </button>
                     </div>
                  </div>
                  <div className="divide-y divide-slate-100">
                     {documentsList.map(doc => (
                        <DocumentRow 
                           key={doc.id}
                           name={doc.name} 
                           type={doc.type} 
                           date={doc.date} 
                           size={doc.size}
                           onEdit={() => {
                              setEditingDoc(doc);
                              setDocForm({ name: doc.name, type: doc.type, size: doc.size });
                              setIsAddingDoc(true);
                           }}
                           onDelete={() => {
                              if (window.confirm(`Are you sure you want to delete document "${doc.name}"?`)) {
                                 setDocumentsList(prev => prev.filter(d => d.id !== doc.id));
                              }
                           }}
                        />
                     ))}
                  </div>
                  <div className="p-6 bg-slate-50/50 text-center border-t border-slate-100">
                     <div 
                        onClick={() => {
                           setEditingDoc(null);
                           setDocForm({ name: '', type: 'Drawing', size: '2.5 MB' });
                           setIsAddingDoc(true);
                        }}
                        className="inline-flex flex-col items-center group cursor-pointer"
                     >
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 border border-slate-200/80 transition-all mb-2 shadow-2xs">
                           <Upload size={18} />
                        </div>
                        <h4 className="text-xs font-semibold text-slate-800">Upload Customer Assets</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">Maximum file size: 50MB (PDF, DXF, DWG)</p>
                     </div>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'service' && (
            <div className="max-w-3xl mx-auto space-y-6 py-4">
               <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mx-auto border border-blue-100 shadow-2xs">
                     <Wrench size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Service & Warranty Desk</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">Request on-site maintenance, repairs, or structural realignment.</p>
               </div>

               <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs relative overflow-hidden">
                   <form 
                     onSubmit={(e) => {
                        e.preventDefault();
                        if (!serviceForm.issueDetails.trim()) return;
                        const req: ServiceVisitRequest = {
                           id: 'srv-' + Date.now(),
                           customerId: client.id,
                           projectId: serviceForm.projectId || (projects[0]?.id || 'N/A'),
                           description: serviceForm.issueDetails,
                           urgency: serviceForm.urgency,
                           preferredDate: serviceForm.preferredDate,
                           preferredTimeSlot: 'Morning',
                           siteContact: client.name,
                           sitePhone: client.phone || 'N/A',
                           photos: [],
                           status: 'Pending',
                           createdAt: new Date().toISOString()
                        };
                        if (onSendServiceRequest) onSendServiceRequest(req);
                        setLocalRequests(prev => [req, ...prev]);
                        setServiceForm({
                           projectId: projects[0]?.id || '',
                           issueDetails: '',
                           urgency: 'Medium',
                           preferredDate: new Date().toISOString().split('T')[0]
                        });
                        alert('Service request submitted successfully.');
                     }}
                     className="space-y-4"
                  >
                     <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">Project Reference</label>
                        <select 
                           value={serviceForm.projectId}
                           onChange={(e) => setServiceForm({ ...serviceForm, projectId: e.target.value })}
                           className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-blue-400"
                        >
                           <option value="">Select Active or Completed Project</option>
                           {projects.map(p => <option key={p.id} value={p.id}>{p.projectName}</option>)}
                        </select>
                     </div>
                     <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">Issue / Request Details</label>
                        <textarea 
                           rows={3} 
                           value={serviceForm.issueDetails}
                           onChange={(e) => setServiceForm({ ...serviceForm, issueDetails: e.target.value })}
                           required
                           className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-blue-400 resize-none" 
                           placeholder="Describe the maintenance requirement or structural issue..." 
                        />
                     </div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                           <label className="text-xs font-semibold text-slate-700">Priority Level</label>
                           <select 
                              value={serviceForm.urgency}
                              onChange={(e) => setServiceForm({ ...serviceForm, urgency: e.target.value as any })}
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-blue-400"
                           >
                              <option value="Low">Low Priority</option>
                              <option value="Medium">Medium Priority</option>
                              <option value="High">Urgent Site Attention</option>
                              <option value="Emergency">Emergency / Structural</option>
                           </select>
                        </div>
                        <div className="space-y-1">
                           <label className="text-xs font-semibold text-slate-700">Preferred Inspection Date</label>
                           <input 
                              type="date" 
                              value={serviceForm.preferredDate}
                              onChange={(e) => setServiceForm({ ...serviceForm, preferredDate: e.target.value })}
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-blue-400" 
                           />
                        </div>
                     </div>
                     <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all">
                        Submit Service Request
                     </button>
                  </form>
               </div>

               {/* Submitted Service Requests History with Delete */}
               {localRequests.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
                     <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Submitted Service Requests</h4>
                     <div className="divide-y divide-slate-100">
                        {localRequests.map(req => {
                           const reqProject = projects.find(p => p.id === req.projectId);
                           return (
                           <div key={req.id} className="py-3 flex items-center justify-between gap-4">
                              <div className="min-w-0">
                                 <div className="flex items-center gap-2">
                                    <span className={cn(
                                       "px-2 py-0.5 rounded text-[10px] font-semibold",
                                       req.urgency === 'Emergency' ? "bg-rose-100 text-rose-700" :
                                       req.urgency === 'High' ? "bg-amber-100 text-amber-700" :
                                       "bg-blue-100 text-blue-700"
                                    )}>
                                       {req.urgency}
                                    </span>
                                    <span className="text-xs font-semibold text-slate-900 truncate">{reqProject?.projectName || req.projectId || 'General Project'}</span>
                                    <span className="text-[10px] text-slate-400">• Preferred: {req.preferredDate}</span>
                                 </div>
                                 <p className="text-xs text-slate-600 mt-1 truncate">{req.description}</p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                 <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-medium rounded">
                                    {req.status}
                                 </span>
                                 <button
                                    onClick={() => {
                                       if (window.confirm('Are you sure you want to delete this service ticket?')) {
                                          if (onDeleteServiceRequest) onDeleteServiceRequest(req.id);
                                          setLocalRequests(prev => prev.filter(r => r.id !== req.id));
                                       }
                                    }}
                                    title="Delete Ticket"
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                 >
                                    <Trash2 size={13} />
                                 </button>
                              </div>
                           </div>
                        );})}
                     </div>
                  </div>
               )}

               <div className="p-4 bg-white rounded-2xl border border-slate-200/80 flex items-center gap-3.5 shadow-xs">
                  <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600 shrink-0 border border-emerald-100"><ShieldCheck size={20} /></div>
                  <div>
                     <h5 className="text-xs font-semibold text-slate-900">Active Structural Warranty</h5>
                     <p className="text-[11px] text-slate-500 mt-0.5">All installations are covered under our comprehensive structural & powder-coat warranty protocol.</p>
                  </div>
               </div>
            </div>
          )}
        </div>

        {/* Modal: Edit Client Profile */}
        {isEditingClient && (
           <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden">
                 <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h3 className="text-sm font-bold text-slate-900">Edit Customer Profile</h3>
                    <button onClick={() => setIsEditingClient(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded">
                       <X size={16} />
                    </button>
                 </div>
                 <form 
                    onSubmit={(e) => {
                       e.preventDefault();
                       const updated: Client = {
                          ...client,
                          name: clientForm.name,
                          tradeName: clientForm.tradeName,
                          email: clientForm.email,
                          phone: clientForm.phone,
                          website: clientForm.website,
                          taxNo: clientForm.taxNo,
                          registrationNo: clientForm.registrationNo,
                          address: clientForm.address
                       };
                       if (onSaveClient) onSaveClient(updated);
                       setIsEditingClient(false);
                    }}
                    className="p-5 space-y-4"
                 >
                    <div>
                       <label className="text-xs font-semibold text-slate-700">Official Company / Client Name</label>
                       <input 
                          type="text" 
                          required
                          value={clientForm.name} 
                          onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                          className="w-full mt-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-blue-400"
                       />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                       <div>
                          <label className="text-xs font-semibold text-slate-700">Trade Name</label>
                          <input 
                             type="text" 
                             value={clientForm.tradeName} 
                             onChange={(e) => setClientForm({ ...clientForm, tradeName: e.target.value })}
                             className="w-full mt-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-blue-400"
                          />
                       </div>
                       <div>
                          <label className="text-xs font-semibold text-slate-700">Registration No</label>
                          <input 
                             type="text" 
                             value={clientForm.registrationNo} 
                             onChange={(e) => setClientForm({ ...clientForm, registrationNo: e.target.value })}
                             className="w-full mt-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-blue-400"
                          />
                       </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                       <div>
                          <label className="text-xs font-semibold text-slate-700">Email Address</label>
                          <input 
                             type="email" 
                             value={clientForm.email} 
                             onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                             className="w-full mt-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-blue-400"
                          />
                       </div>
                       <div>
                          <label className="text-xs font-semibold text-slate-700">Phone</label>
                          <input 
                             type="text" 
                             value={clientForm.phone} 
                             onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })}
                             className="w-full mt-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-blue-400"
                          />
                       </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                       <div>
                          <label className="text-xs font-semibold text-slate-700">Tax Matrix ID</label>
                          <input 
                             type="text" 
                             value={clientForm.taxNo} 
                             onChange={(e) => setClientForm({ ...clientForm, taxNo: e.target.value })}
                             className="w-full mt-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-blue-400"
                          />
                       </div>
                       <div>
                          <label className="text-xs font-semibold text-slate-700">Website</label>
                          <input 
                             type="text" 
                             value={clientForm.website} 
                             onChange={(e) => setClientForm({ ...clientForm, website: e.target.value })}
                             className="w-full mt-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-blue-400"
                          />
                       </div>
                    </div>
                    <div>
                       <label className="text-xs font-semibold text-slate-700">Physical Address</label>
                       <input 
                          type="text" 
                          value={clientForm.address} 
                          onChange={(e) => setClientForm({ ...clientForm, address: e.target.value })}
                          className="w-full mt-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-blue-400"
                       />
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                       <button 
                          type="button" 
                          onClick={() => setIsEditingClient(false)}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                       >
                          Cancel
                       </button>
                       <button 
                          type="submit" 
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs"
                       >
                          Save Changes
                       </button>
                    </div>
                 </form>
              </div>
           </div>
        )}

        {/* Modal: Add/Edit Document */}
        {isAddingDoc && (
           <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden">
                 <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h3 className="text-sm font-bold text-slate-900">{editingDoc ? 'Edit Document' : 'Upload / Add Document'}</h3>
                    <button onClick={() => setIsAddingDoc(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded">
                       <X size={16} />
                    </button>
                 </div>
                 <form 
                    onSubmit={(e) => {
                       e.preventDefault();
                       if (!docForm.name.trim()) return;
                       if (editingDoc) {
                          setDocumentsList(prev => prev.map(d => d.id === editingDoc.id ? { ...d, name: docForm.name, type: docForm.type, size: docForm.size } : d));
                       } else {
                          const newDoc: CustomerDoc = {
                             id: 'doc-' + Date.now(),
                             name: docForm.name,
                             type: docForm.type,
                             date: new Date().toISOString().split('T')[0],
                             size: docForm.size || '1.5 MB'
                          };
                          setDocumentsList(prev => [newDoc, ...prev]);
                       }
                       setIsAddingDoc(false);
                    }}
                    className="p-5 space-y-4"
                 >
                    <div>
                       <label className="text-xs font-semibold text-slate-700">Document File Name</label>
                       <input 
                          type="text" 
                          required
                          value={docForm.name} 
                          onChange={(e) => setDocForm({ ...docForm, name: e.target.value })}
                          placeholder="e.g. ELEVATION_PLAN_V2.PDF"
                          className="w-full mt-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-blue-400"
                       />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                       <div>
                          <label className="text-xs font-semibold text-slate-700">Document Category</label>
                          <select 
                             value={docForm.type}
                             onChange={(e) => setDocForm({ ...docForm, type: e.target.value })}
                             className="w-full mt-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-blue-400"
                          >
                             <option value="Drawing">Drawing / CAD</option>
                             <option value="Compliance">Compliance Cert</option>
                             <option value="Specs">Material Specs</option>
                             <option value="Warranty">Warranty</option>
                             <option value="Contract">Agreement</option>
                          </select>
                       </div>
                       <div>
                          <label className="text-xs font-semibold text-slate-700">File Size</label>
                          <input 
                             type="text" 
                             value={docForm.size} 
                             onChange={(e) => setDocForm({ ...docForm, size: e.target.value })}
                             className="w-full mt-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-blue-400"
                          />
                       </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                       <button 
                          type="button" 
                          onClick={() => setIsAddingDoc(false)}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                       >
                          Cancel
                       </button>
                       <button 
                          type="submit" 
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs"
                       >
                          {editingDoc ? 'Save Document' : 'Add Document'}
                       </button>
                    </div>
                 </form>
              </div>
           </div>
        )}

        {/* Modal: Launch Connection / New Inquiry */}
        {isAddingInquiryModal && (
           <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden">
                 <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h3 className="text-sm font-bold text-slate-900">New Inquiry Thread</h3>
                    <button onClick={() => setIsAddingInquiryModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded">
                       <X size={16} />
                    </button>
                 </div>
                 <form 
                    onSubmit={(e) => {
                       e.preventDefault();
                       if (!inquiryForm.subject.trim() || !inquiryForm.message.trim()) return;
                       const newInq: Inquiry = {
                          id: 'inq-' + Date.now(),
                          customerId: client.id,
                          subject: inquiryForm.subject,
                          message: inquiryForm.message,
                          regardingType: inquiryForm.regardingType,
                          regardingId: inquiryForm.regardingId || 'GENERAL',
                          preferredResponse: 'Email',
                          status: 'Pending',
                          createdAt: new Date().toISOString(),
                          history: []
                       };
                       if (onSendInquiry) onSendInquiry(newInq);
                       setLocalInquiries(prev => [newInq, ...prev]);
                       setInquiryForm({
                          subject: '',
                          message: '',
                          regardingType: 'Project',
                          regardingId: projects[0]?.id || ''
                       });
                       setIsAddingInquiryModal(false);
                    }}
                    className="p-5 space-y-4"
                 >
                    <div>
                       <label className="text-xs font-semibold text-slate-700">Subject</label>
                       <input 
                          type="text" 
                          required
                          value={inquiryForm.subject} 
                          onChange={(e) => setInquiryForm({ ...inquiryForm, subject: e.target.value })}
                          placeholder="e.g. Schedule Clarification on North Facade"
                          className="w-full mt-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-blue-400"
                       />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                       <div>
                          <label className="text-xs font-semibold text-slate-700">Reference Type</label>
                          <select 
                             value={inquiryForm.regardingType}
                             onChange={(e) => setInquiryForm({ ...inquiryForm, regardingType: e.target.value as any })}
                             className="w-full mt-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-blue-400"
                          >
                             <option value="Project">Project</option>
                             <option value="Quote">Quote</option>
                             <option value="Invoice">Invoice</option>
                             <option value="General">General</option>
                          </select>
                       </div>
                       <div>
                          <label className="text-xs font-semibold text-slate-700">Reference Project</label>
                          <select 
                             value={inquiryForm.regardingId}
                             onChange={(e) => setInquiryForm({ ...inquiryForm, regardingId: e.target.value })}
                             className="w-full mt-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-blue-400"
                          >
                             <option value="">None / General</option>
                             {projects.map(p => <option key={p.id} value={p.id}>{p.projectName}</option>)}
                          </select>
                       </div>
                    </div>
                    <div>
                       <label className="text-xs font-semibold text-slate-700">Message</label>
                       <textarea 
                          rows={4}
                          required
                          value={inquiryForm.message} 
                          onChange={(e) => setInquiryForm({ ...inquiryForm, message: e.target.value })}
                          placeholder="Provide details for our technical engineering support..."
                          className="w-full mt-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-blue-400 resize-none"
                       />
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                       <button 
                          type="button" 
                          onClick={() => setIsAddingInquiryModal(false)}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                       >
                          Cancel
                       </button>
                       <button 
                          type="submit" 
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs"
                       >
                          Send Inquiry
                       </button>
                    </div>
                 </form>
              </div>
           </div>
        )}
      </main>
    </div>
  );
};

const ProfileField = ({ label, value, icon: Icon }: { label: string, value: string, icon: any }) => (
  <div className="flex items-center gap-3 group">
    <div className="w-9 h-9 bg-slate-50 rounded-xl flex items-center justify-center text-slate-500 group-hover:text-blue-600 border border-slate-200/80 transition-colors shadow-2xs">
      <Icon size={15} />
    </div>
    <div>
      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
      <p className="text-xs font-medium text-slate-800">{value}</p>
    </div>
  </div>
);

const ProjectCard = ({ project, onClick }: { project: any, onClick: () => void }) => {
  return (
    <div 
      onClick={onClick}
      className="p-5 bg-white rounded-2xl border border-slate-200/80 hover:border-blue-300 transition-all cursor-pointer group shadow-xs relative overflow-hidden"
    >
      <div className="flex items-start justify-between mb-4">
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 font-mono font-bold border border-blue-100 text-[10px] shrink-0">
               {project.projectCode ? project.projectCode.split('-').slice(1).join('-') : 'PRJ'}
            </div>
            <div>
               <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">{project.projectName}</h4>
                  <span className="font-mono text-[9px] font-bold text-blue-600 bg-blue-50 px-1 py-0.2 rounded border border-blue-100">
                     {project.projectCode || project.id.slice(0, 8)}
                  </span>
               </div>
               <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                  <MapPin size={11} className="text-slate-400" /> {project.siteAddress || 'Site Address Pending'}
               </p>
            </div>
         </div>
         <span className={cn(
            "px-2.5 py-0.5 rounded-full text-[9px] font-semibold border shrink-0",
            project.status === 'In Progress' ? "bg-blue-50 text-blue-700 border-blue-200" :
            project.status === 'Completed' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
            "bg-slate-100 text-slate-700 border-slate-200"
         )}>
            {project.status}
         </span>
      </div>

      {project.tags && project.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
           {project.tags.map((tag: string, i: number) => (
              <span key={i} className="flex items-center gap-1 px-2 py-0.5 bg-slate-50 border border-slate-200/80 rounded-md text-[9px] font-medium text-slate-600">
                 <TagIcon size={8} /> {tag}
              </span>
           ))}
        </div>
      )}

      <div className="space-y-1.5 mb-4">
         <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Project Milestones</span>
            <span className="font-semibold text-blue-600">{project.progress || 35}%</span>
         </div>
         <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <motion.div 
               initial={{ width: 0 }}
               animate={{ width: `${project.progress || 35}%` }}
               className="h-full bg-blue-600 rounded-full"
            />
         </div>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs">
         <div>
            <span className="text-[10px] text-slate-500 block">Commenced</span>
            <span className="font-medium text-slate-800">{new Date(project.startDate).toLocaleDateString()}</span>
         </div>
         <div>
            <span className="text-[10px] text-slate-500 block">Target Delivery</span>
            <span className="font-medium text-slate-800">{project.endDate || 'TBD'}</span>
         </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon: Icon, color }: { label: string, value: string, icon: any, color: string }) => (
  <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs relative group overflow-hidden hover:border-blue-300 transition-all">
    <div className="flex items-center gap-3 mb-2">
      <div className={cn(
         "w-8 h-8 rounded-lg flex items-center justify-center border",
         color === 'blue' ? "bg-blue-50 text-blue-600 border-blue-100" :
         color === 'emerald' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
         "bg-amber-50 text-amber-600 border-amber-100"
      )}>
         <Icon size={16} />
      </div>
      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
    </div>
    <p className="text-xl font-bold text-slate-900 tracking-tight">{value}</p>
  </div>
);

const ProtocolItem = ({ title, desc }: { title: string, desc: string }) => (
  <div className="flex gap-3">
    <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
    <div>
      <h6 className="text-xs font-semibold text-slate-900">{title}</h6>
      <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{desc}</p>
    </div>
  </div>
);

const DocCategory = ({ icon: Icon, label, count, color }: { icon: any, label: string, count: number, color: string }) => (
  <div className="p-4 bg-white rounded-xl border border-slate-200/80 hover:border-blue-300 hover:bg-blue-50/20 transition-all cursor-pointer group shadow-xs">
    <div className={cn(
      "w-8 h-8 rounded-lg flex items-center justify-center mb-2.5 border",
      color === 'blue' ? "bg-blue-50 text-blue-600 border-blue-100" :
      color === 'emerald' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
      color === 'indigo' ? "bg-indigo-50 text-indigo-600 border-indigo-100" :
      "bg-amber-50 text-amber-600 border-amber-100"
    )}>
      <Icon size={16} />
    </div>
    <h4 className="text-xs font-semibold text-slate-900">{label}</h4>
    <p className="text-[11px] text-slate-500 mt-0.5">{count} files archived</p>
  </div>
);

const DocumentRow = ({ 
  name, 
  type, 
  date, 
  size,
  onEdit,
  onDelete
}: { 
  name: string; 
  type: string; 
  date: string; 
  size: string;
  onEdit?: () => void;
  onDelete?: () => void;
}) => (
  <div className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors group">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-500 border border-slate-200/80"><FileText size={14} /></div>
      <div>
         <p className="text-xs font-semibold text-slate-900">{name}</p>
         <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500">
            <span className="text-blue-600 font-medium">{type}</span>
            <span>•</span>
            <span>{size}</span>
         </div>
      </div>
    </div>
    <div className="flex items-center gap-2">
      <div className="hidden sm:block text-right text-xs text-slate-500 mr-4">
         <p className="text-[10px] text-slate-400">Date Added</p>
         <p className="font-medium text-slate-700">{date}</p>
      </div>
      <button 
         title="Download"
         className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg border border-slate-200/80 transition-all shadow-2xs"
      >
         <Download size={13} />
      </button>
      {onEdit && (
        <button
           onClick={onEdit}
           title="Edit Document"
           className="p-1.5 bg-slate-50 hover:bg-blue-50 text-slate-500 hover:text-blue-600 rounded-lg border border-slate-200/80 transition-all shadow-2xs"
        >
           <Edit2 size={13} />
        </button>
      )}
      {onDelete && (
        <button
           onClick={onDelete}
           title="Delete Document"
           className="p-1.5 bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-lg border border-slate-200/80 transition-all shadow-2xs"
        >
           <Trash2 size={13} />
        </button>
      )}
    </div>
  </div>
);

// Helper function needed because it's not exported from utils usually
const calculateQuoteTotal = (quote: Quote): number => {
  if (!quote.items) return 0;
  const subtotal = quote.items.reduce((sum, item) => sum + (item.amount || 0), 0);
  const discountAmount = (subtotal * (quote.discountPercent || 0)) / 100;
  const taxAmount = ((subtotal - discountAmount) * (quote.taxPercent || 0)) / 100;
  const additionalChargesTotal = quote.additionalCharges?.reduce((sum, charge) => sum + charge.amount, 0) || 0;
  return subtotal - discountAmount + taxAmount + additionalChargesTotal;
};
