import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { 
  Quote, 
  QuoteStatus, 
  Project, 
  Client, 
  Invoice, 
  AuditLog, 
  Personnel, 
  Equipment, 
  WarrantyCertificate,
  ProjectActualCostRecord,
  ProductVariant,
  ItemCategory,
  ItemTemplate
} from '../types';
import { ProfitabilityOverviewWidget } from './dashboard/ProfitabilityOverviewWidget';
import { ExecutiveDashboardPerspective } from './dashboard/ExecutiveDashboardPerspective';
import { AnalyticsDashboardPerspective } from './dashboard/AnalyticsDashboardPerspective';
import { BulkPriceUpdateRule } from '../services/bomPricingService';
import { 
  Package, 
  CheckCircle2, 
  Search, 
  Edit, 
  Copy, 
  Trash2, 
  ExternalLink, 
  MapPin, 
  PlusCircle, 
  GanttChart, 
  HardHat, 
  Wrench, 
  Medal, 
  ShieldCheck, 
  Users,
  AlertTriangle, 
  HelpCircle, 
  Activity, 
  Info, 
  ClipboardCheck, 
  Clock, 
  FileBadge,
  SlidersHorizontal,
  MoreVertical,
  Home,
  FileText,
  Calendar,
  ChevronRight,
  TrendingUp,
  ArrowUpRight,
  Landmark,
  Building2,
  Plus,
  HeartHandshake,
  LayoutGrid,
  BarChart3,
  Cpu
} from 'lucide-react';
import { cn } from '../lib/utils';
import { OngoingProjectsGantt, getProjectTimelineMetrics } from './OngoingProjectsGantt';

export type DashboardPerspective = 'overview' | 'executive' | 'finance' | 'operations' | 'quality' | 'crm' | 'analytics';

interface DashboardProps {
  quotes: Quote[];
  projects: Project[];
  onEditQuote: (q: Quote) => void;
  onDuplicateQuote: (q: Quote) => void;
  onDeleteQuote: (id: string) => void;
  onViewProject: (p: Project) => void;
  onNavigate: (view: any) => void;
  onGenerateReport: () => void;
  initialPerspective?: DashboardPerspective;
  onPerspectiveChange?: (p: DashboardPerspective) => void;
  
  // Real system states collections passed from App
  clients?: Client[];
  invoices?: Invoice[];
  payments?: any[];
  inquiries?: any[];
  serviceRequests?: any[];
  personnel?: Personnel[];
  equipment?: Equipment[];
  warrantyCertificates?: WarrantyCertificate[];
  auditLogs?: AuditLog[];
  actualCostRecords?: ProjectActualCostRecord[];
  variants?: ProductVariant[];
  categories?: ItemCategory[];
  itemTemplates?: ItemTemplate[];
  onApplyBulkPriceUpdate?: (rule: BulkPriceUpdateRule) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  quotes, 
  projects, 
  onEditQuote, 
  onDuplicateQuote, 
  onDeleteQuote, 
  onViewProject, 
  onNavigate, 
  onGenerateReport,
  initialPerspective = 'overview',
  onPerspectiveChange,
  clients = [],
  invoices = [],
  payments = [],
  inquiries = [],
  serviceRequests = [],
  personnel = [],
  equipment = [],
  warrantyCertificates = [],
  auditLogs = [],
  actualCostRecords = [],
  variants = [],
  categories = [],
  itemTemplates = [],
  onApplyBulkPriceUpdate
}) => {
  const [activeTab, setActiveTab] = useState<DashboardPerspective>(initialPerspective);

  useEffect(() => {
    if (initialPerspective) {
      setActiveTab(initialPerspective);
    }
  }, [initialPerspective]);

  const handleTabChange = (tab: DashboardPerspective) => {
    setActiveTab(tab);
    onPerspectiveChange?.(tab);
  };
  const [quoteSearch, setQuoteSearch] = useState('');
  const [quoteFilter, setQuoteFilter] = useState<QuoteStatus | 'All'>('All');
  const [projectSearch, setProjectSearch] = useState('');
  const [projectViewMode, setProjectViewMode] = useState<'table' | 'gantt'>('gantt');

  // ----------------------------------------------------
  // DATA PREPARATION & ANALYTICS HELPER METHODS
  // ----------------------------------------------------
  // RECENT LISTS & CALCS
  // ----------------------------------------------------

  // ---------------------
  // TAB 1: OVERVIEW CALCS
  // ---------------------
  const filteredQuotes = quotes.filter(q => {
    const matchesSearch = q.projectName.toLowerCase().includes(quoteSearch.toLowerCase()) || 
                          q.quoteNo.toLowerCase().includes(quoteSearch.toLowerCase()) ||
                          q.client.name.toLowerCase().includes(quoteSearch.toLowerCase());
    const matchesFilter = quoteFilter === 'All' || q.status === quoteFilter;
    return matchesSearch && matchesFilter;
  }).slice(0, 6);

  const filteredProjects = projects.filter(p => {
    return p.projectName.toLowerCase().includes(projectSearch.toLowerCase()) ||
           p.client.name.toLowerCase().includes(projectSearch.toLowerCase());
  }).slice(0, 6);

  const monthlyPerformanceData = [
    { month: 'Jan', complete: 10, newTask: 8, overdue: 3 },
    { month: 'Feb', complete: 14, newTask: 12, overdue: 4 },
    { month: 'Mar', complete: 18, newTask: 15, overdue: 5 },
    { month: 'Apr', complete: 22, newTask: 18, overdue: 4 },
    { month: 'May', complete: 28, newTask: 22, overdue: 6 },
    { month: 'Jun', complete: 36, newTask: 18, overdue: 8 },
    { month: 'Jul', complete: 32, newTask: 21, overdue: 7 },
    { month: 'Aug', complete: 38, newTask: 26, overdue: 5 },
    { month: 'Sep', complete: 42, newTask: 29, overdue: 6 },
    { month: 'Oct', complete: 36, newTask: 24, overdue: 4 },
    { month: 'Nov', complete: 40, newTask: 28, overdue: 5 },
    { month: 'Dec', complete: 45, newTask: 32, overdue: 7 },
  ];

  const teamOverviewList = [
    { id: 'TF01', name: 'Olivia Flora', role: 'Civil Project Lead', total: 15, completed: 8, onProgress: 5, overdue: 2, status: 'Available', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100' },
    { id: 'TF02', name: 'Jenne Rose', role: 'Aluminium Fabricator', total: 12, completed: 6, onProgress: 6, overdue: 0, status: 'Available', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100' },
    { id: 'TF03', name: 'Noah Smits', role: 'Site Supervisor', total: 18, completed: 14, onProgress: 3, overdue: 1, status: 'Available', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100' },
    { id: 'TF04', name: 'Liam Vance', role: 'Quantity Surveyor', total: 9, completed: 7, onProgress: 2, overdue: 0, status: 'On Leave', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100' },
    { id: 'TF05', name: 'Sophia Chen', role: 'Glass Systems Engineer', total: 14, completed: 9, onProgress: 5, overdue: 0, status: 'Available', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100' },
  ];

  // ---------------------
  // TAB 2: FINANCE CALCS
  // ---------------------
  const totalInvoiced = invoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
  const totalCollected = invoices.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0);
  const totalOutstanding = invoices.reduce((sum, inv) => sum + (inv.balanceDue || 0), 0);
  const paidRatio = totalInvoiced > 0 ? (totalCollected / totalInvoiced) * 100 : 0;

  const overdueInvoices = invoices.filter(inv => {
    const isOverdueState = inv.status === 'Overdue';
    const isPastDue = inv.dueDate && new Date(inv.dueDate) < new Date() && inv.status !== 'Paid';
    return isOverdueState || isPastDue;
  });

  // Credit limits board - clients near or over credit limits
  const clientCreditAlerts = clients.map(client => {
    const clientInvoices = invoices.filter(inv => inv.client.id === client.id);
    const clientOutstanding = clientInvoices.reduce((sum, inv) => sum + (inv.balanceDue || 0), 0);
    const capacityPercent = client.creditLimit > 0 ? (clientOutstanding / client.creditLimit) * 100 : 0;
    return {
      client,
      outstanding: clientOutstanding,
      limit: client.creditLimit,
      percent: Math.min(100, Math.round(capacityPercent)),
      isExceeded: clientOutstanding > client.creditLimit,
    };
  }).filter(item => item.outstanding > 0).sort((a, b) => b.percent - a.percent);

  // Recent payments ledger
  const invoicePayments = invoices.filter(inv => (inv.amountPaid || 0) > 0).slice(0, 6);

  // ---------------------
  // TAB 3: OPERATIONS & ASSETS
  // ---------------------
  const totalPersonnel = personnel.length;
  const assignedPersonnel = personnel.filter(p => p.status === 'Assigned').length;
  const personnelUtil = totalPersonnel > 0 ? (assignedPersonnel / totalPersonnel) * 100 : 0;

  const totalEquipment = equipment.length;
  const deployedEquipment = equipment.filter(e => e.status === 'In Use').length;
  const equipmentMaintenance = equipment.filter(e => e.status === 'Maintenance' || e.status === 'Damaged').length;

  // ---------------------
  // TAB 4: QUALITY & RISK
  // ---------------------
  // Static QC Checklist Data or computed checks
  const totalInspections = 12;
  const passedInspections = 9;
  const passRate = totalInspections > 0 ? (passedInspections / totalInspections) * 100 : 0;

  const openNCRs = [
    { id: '1', ncrNo: 'NCR-2026-003', project: 'Glass Partition Level 3', description: 'Faulty gaskets on structural panels', severity: 'Major', date: '2026-05-12', status: 'Investigating' },
    { id: '2', ncrNo: 'NCR-2026-004', project: 'Facade Framing Colombo 07', description: 'Deflection tolerance exceeded by 3mm', severity: 'Critical', date: '2026-05-24', status: 'Open' },
    { id: '3', ncrNo: 'NCR-2026-005', project: 'Storefront Entrance B', description: 'Micro-scratches on bronzed powder profiles', severity: 'Minor', date: '2026-05-26', status: 'Action Planned' }
  ];

  const ncrSeverityData = [
    { severity: 'Critical', count: 1, fill: '#ef4444' },
    { severity: 'Major', count: 3, fill: '#f59e0b' },
    { severity: 'Minor', count: 4, fill: '#3b82f6' }
  ];

  // ---------------------
  // TAB 5: CRM & CLIENT FOCUS
  // ---------------------
  const openInquiries = inquiries.filter(i => i.status === 'Pending');
  const serviceTickets = serviceRequests.filter(s => s.status !== 'Completed');
  const activeWarranties = warrantyCertificates.filter(w => w.status === 'Active');

  const urgencyCounts = serviceRequests.reduce((acc, s) => {
    acc[s.urgency] = (acc[s.urgency] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const serviceRequestsUrgency = [
    { name: 'Emergency', value: urgencyCounts['Emergency'] || 0, color: '#ef4444' },
    { name: 'High', value: urgencyCounts['High'] || 0, color: '#f97316' },
    { name: 'Medium', value: urgencyCounts['Medium'] || 0, color: '#f59e0b' },
    { name: 'Low', value: urgencyCounts['Low'] || 0, color: '#10b981' }
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-2.5 font-sans">
      
      {/* ------------------ SYSTEM HUD HEADER - Single Line Ribbon ------------------ */}
      <header className="bg-white border border-slate-200/80 px-5 py-2.5 rounded-xl flex items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={() => onNavigate('home')}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-lg text-xs font-semibold border border-orange-200 transition-colors shadow-2xs cursor-pointer shrink-0"
            title="Return to Home Control Center"
          >
            <Home size={13} className="text-orange-500" />
            <span>Home</span>
          </button>
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white shrink-0 shadow-2xs">
            <Activity size={16} />
          </div>
          <div className="flex items-baseline gap-2 min-w-0">
            <h1 className="text-sm font-bold text-slate-900 whitespace-nowrap">Dashboard</h1>
            <span className="text-xs text-slate-500 font-normal truncate hidden sm:inline">• Sales, projects & operations summary</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onNavigate('settings')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold transition-all shadow-2xs"
          >
            <Clock size={13} className="text-slate-400" />
            <span className="hidden sm:inline">Audit Log</span> ({auditLogs.length})
          </button>

          <button
            onClick={onGenerateReport}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-orange-500 text-white hover:bg-orange-600 rounded-lg text-xs font-semibold transition-all shadow-2xs"
          >
            <FileBadge size={13} />
            <span>Generate Report</span>
          </button>
        </div>
      </header>

      {/* ------------------ MAIN TABS NAVIGATOR ------------------ */}
      <div className="bg-slate-100 p-1 rounded-xl flex flex-wrap gap-1">
        {[
          { id: 'overview', label: 'Overview', icon: LayoutGrid },
          { id: 'executive', label: 'Executive', icon: BarChart3 },
          { id: 'finance', label: 'Finance', icon: Landmark },
          { id: 'operations', label: 'Operations', icon: HardHat },
          { id: 'quality', label: 'Quality', icon: ShieldCheck },
          { id: 'crm', label: 'CRM', icon: HeartHandshake },
          { id: 'analytics', label: 'Analytics', icon: Cpu }
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as DashboardPerspective)}
              className={cn(
                "flex-1 min-w-[95px] flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs transition-colors",
                isActive 
                  ? "bg-white text-orange-600 font-semibold shadow-xs" 
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60 font-normal"
              )}
            >
              <tab.icon className={cn("w-4 h-4 shrink-0", isActive ? "text-orange-500" : "text-slate-400")} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ------------------ TAB 1: OVERVIEW PERSPECTIVE ------------------ */}
      {activeTab === 'overview' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Overview Command Ribbon - Single Line */}
          <div className="bg-white border border-slate-200/80 px-4 py-2 rounded-xl flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse shrink-0"></span>
              <span className="text-xs font-bold text-slate-800 whitespace-nowrap">Live Operations</span>
              <span className="text-[11px] text-slate-400 hidden sm:inline">• Active project sites</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button 
                onClick={() => onNavigate('projects')} 
                className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition-colors shadow-2xs flex items-center gap-1.5"
              >
                <PlusCircle size={13} className="text-orange-500" />
                <span>Add Project</span>
              </button>
              <button 
                onClick={() => onNavigate('editor')} 
                className="px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs flex items-center gap-1.5"
              >
                <FileText size={13} />
                <span>Create Quote</span>
              </button>
            </div>
          </div>

          {/* 5 Key Metric Cards (Taskfy Style) */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-normal">Total Task</span>
                <span className="inline-flex items-center text-[11px] text-emerald-600 font-medium bg-emerald-50 px-1.5 py-0.5 rounded-md">
                  +3.2%
                </span>
              </div>
              <div className="my-2">
                <span className="text-2xl font-bold text-slate-900 tracking-tight">32</span>
              </div>
              <button onClick={() => onNavigate('projects')} className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500 hover:text-orange-600 transition-colors">
                <span>+12 new tasks today</span>
                <ChevronRight size={13} />
              </button>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-normal">Task In Progress</span>
                <span className="inline-flex items-center text-[11px] text-emerald-600 font-medium bg-emerald-50 px-1.5 py-0.5 rounded-md">
                  +1.5%
                </span>
              </div>
              <div className="my-2">
                <span className="text-2xl font-bold text-slate-900 tracking-tight">14</span>
              </div>
              <button onClick={() => onNavigate('projects')} className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500 hover:text-orange-600 transition-colors">
                <span>+5 tasks in execution</span>
                <ChevronRight size={13} />
              </button>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-normal">Task Completed</span>
                <span className="inline-flex items-center text-[11px] text-emerald-600 font-medium bg-emerald-50 px-1.5 py-0.5 rounded-md">
                  +2.2%
                </span>
              </div>
              <div className="my-2">
                <span className="text-2xl font-bold text-slate-900 tracking-tight">12</span>
              </div>
              <button onClick={() => onNavigate('projects')} className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500 hover:text-orange-600 transition-colors">
                <span>+4 tasks completed</span>
                <ChevronRight size={13} />
              </button>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-normal">Task Pending</span>
                <span className="inline-flex items-center text-[11px] text-amber-600 font-medium bg-amber-50 px-1.5 py-0.5 rounded-md">
                  +2.1%
                </span>
              </div>
              <div className="my-2">
                <span className="text-2xl font-bold text-slate-900 tracking-tight">06</span>
              </div>
              <button onClick={() => onNavigate('invoices')} className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500 hover:text-orange-600 transition-colors">
                <span>+2 pending review</span>
                <ChevronRight size={13} />
              </button>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col justify-between col-span-2 md:col-span-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-normal">Site Meetings</span>
                <span className="inline-flex items-center text-[11px] text-indigo-600 font-medium bg-indigo-50 px-1.5 py-0.5 rounded-md">
                  +2.1%
                </span>
              </div>
              <div className="my-2">
                <span className="text-2xl font-bold text-slate-900 tracking-tight">02</span>
              </div>
              <button onClick={() => onNavigate('resource-management')} className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500 hover:text-orange-600 transition-colors">
                <span>+2 new meetings</span>
                <ChevronRight size={13} />
              </button>
            </div>
          </div>

          {/* Performance and Distribution Charts Row (Taskfy Image 2) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Task Performance Area Spline Chart (2 Columns) */}
            <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Task Performance</h3>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="flex items-center gap-1.5 text-xs text-slate-500">
                      <span className="w-2 h-2 rounded-full bg-sky-500"></span> Complete
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-slate-500">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span> New Task
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-slate-500">
                      <span className="w-2 h-2 rounded-full bg-rose-500"></span> Overdue
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 font-medium">
                    01 Jan - 31 Dec 2026
                  </span>
                </div>
              </div>

              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyPerformanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorComplete" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0284c7" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#0284c7" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorOverdue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                    />
                    <Area type="monotone" dataKey="complete" stroke="#0284c7" strokeWidth={2} fillOpacity={1} fill="url(#colorComplete)" />
                    <Area type="monotone" dataKey="newTask" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorNew)" />
                    <Area type="monotone" dataKey="overdue" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorOverdue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Task Distribution Donut Gauge (1 Column) */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Task Distribution</h3>
                <p className="text-xs text-slate-500 mt-0.5">Monitor task distribution by priority</p>
              </div>

              <div className="relative h-[160px] flex items-center justify-center my-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'High Priority', value: 15, color: '#f59e0b' },
                        { name: 'Medium Priority', value: 10, color: '#0284c7' },
                        { name: 'Low Priority', value: 5, color: '#10b981' },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {[
                        { color: '#f59e0b' },
                        { color: '#0284c7' },
                        { color: '#10b981' },
                      ].map((entry, index) => (
                        <Cell key={`dist-cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xs text-slate-400">Total</span>
                  <span className="text-lg font-bold text-slate-900">200 Task</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded-xl bg-amber-50/50 border border-amber-100/80">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    <span className="text-xs font-medium text-slate-700">High Priority</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-900">15 Task (50%)</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-sky-50/50 border border-sky-100/80">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                    <span className="text-xs font-medium text-slate-700">Medium Priority</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-900">10 Task (33%)</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50/50 border border-emerald-100/80">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="text-xs font-medium text-slate-700">Low Priority</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-900">05 Task (17%)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Profitability Overview: Completed Projects Cost Variance Scatter Plot */}
          <ProfitabilityOverviewWidget
            projects={projects}
            actualCostRecords={actualCostRecords}
            onViewProject={onViewProject}
            onNavigateToPostEvaluation={(projId) => {
              if (projId) {
                const targetProj = projects.find(p => p.id === projId);
                if (targetProj) onViewProject(targetProj);
              }
              onNavigate('post-evaluation');
            }}
          />

          {/* Team Overview Table (Taskfy Image 2 Style) */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Team Overview</h3>
                <p className="text-xs text-slate-500 mt-0.5">Track tasks efficiently and collaborate with your team.</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search employee..." 
                    className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 w-44"
                  />
                </div>
                <button className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 flex items-center gap-1.5 transition-colors">
                  <SlidersHorizontal size={13} />
                  Filter
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-medium">
                    <th className="pb-3 pl-2 w-8">
                      <input type="checkbox" className="rounded border-slate-300 text-orange-500 focus:ring-orange-400" />
                    </th>
                    <th className="pb-3">ID</th>
                    <th className="pb-3">Name</th>
                    <th className="pb-3">Role</th>
                    <th className="pb-3 text-center">Total Task</th>
                    <th className="pb-3 text-center">Completed</th>
                    <th className="pb-3 text-center">On Progress</th>
                    <th className="pb-3 text-center">Overdue</th>
                    <th className="pb-3 text-center">Status</th>
                    <th className="pb-3 text-right pr-2">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {teamOverviewList.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 pl-2">
                        <input type="checkbox" className="rounded border-slate-300 text-orange-500 focus:ring-orange-400" />
                      </td>
                      <td className="py-3 font-mono text-slate-500 font-medium">{m.id}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-2.5">
                          <img src={m.avatar} alt={m.name} className="w-7 h-7 rounded-full object-cover border border-slate-200" />
                          <span className="font-medium text-slate-800">{m.name}</span>
                        </div>
                      </td>
                      <td className="py-3 text-slate-500">{m.role}</td>
                      <td className="py-3 text-center font-medium text-slate-700">{m.total}</td>
                      <td className="py-3 text-center font-medium text-emerald-600">{m.completed}</td>
                      <td className="py-3 text-center font-medium text-sky-600">{m.onProgress}</td>
                      <td className="py-3 text-center font-medium text-rose-500">{m.overdue}</td>
                      <td className="py-3 text-center">
                        <span className={cn(
                          "inline-block px-2.5 py-0.5 rounded-full text-[10px] font-medium",
                          m.status === 'Available' ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80" : "bg-rose-50 text-rose-700 border border-rose-200/80"
                        )}>
                          {m.status}
                        </span>
                      </td>
                      <td className="py-3 text-right pr-2">
                        <button className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600">
                          <MoreVertical size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Upcoming Schedule & Site Milestones (LuminHR Image 3 Style) */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-orange-500" />
                <h3 className="text-sm font-semibold text-slate-900">Upcoming Site Visits & Milestones</h3>
              </div>
              <span className="text-xs text-slate-400">Schedule: Monday, 15 Oct 2026</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-1">
              <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl">
                <div className="flex items-center justify-between text-[11px] text-amber-700 font-medium mb-1">
                  <span>08:00 - 10:30 AM</span>
                  <span className="px-1.5 py-0.5 rounded bg-amber-200/60 text-amber-900 text-[10px]">Site QA</span>
                </div>
                <h4 className="text-xs font-semibold text-slate-900">Safety & Facade Inspection</h4>
                <p className="text-[11px] text-slate-500 mt-1">Colombo 07 - High-Rise Tower</p>
              </div>

              <div className="p-3 bg-sky-50/70 border border-sky-200/80 rounded-xl">
                <div className="flex items-center justify-between text-[11px] text-sky-700 font-medium mb-1">
                  <span>11:00 - 12:30 PM</span>
                  <span className="px-1.5 py-0.5 rounded bg-sky-200/60 text-sky-900 text-[10px]">Delivery</span>
                </div>
                <h4 className="text-xs font-semibold text-slate-900">Tempered Glass Delivery</h4>
                <p className="text-[11px] text-slate-500 mt-1">12mm Clear Glass Panels (Lot A)</p>
              </div>

              <div className="p-3 bg-indigo-50/70 border border-indigo-200/80 rounded-xl">
                <div className="flex items-center justify-between text-[11px] text-indigo-700 font-medium mb-1">
                  <span>14:00 - 15:30 PM</span>
                  <span className="px-1.5 py-0.5 rounded bg-indigo-200/60 text-indigo-900 text-[10px]">Variation</span>
                </div>
                <h4 className="text-xs font-semibold text-slate-900">Architectural Variation Sign-off</h4>
                <p className="text-[11px] text-slate-500 mt-1">Review additions with Chief Architect</p>
              </div>

              <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl">
                <div className="flex items-center justify-between text-[11px] text-emerald-700 font-medium mb-1">
                  <span>16:30 - 18:00 PM</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-200/60 text-emerald-900 text-[10px]">Handover</span>
                </div>
                <h4 className="text-xs font-semibold text-slate-900">Level 3 Entrance Handover</h4>
                <p className="text-[11px] text-slate-500 mt-1">Final commissioning & warranty issuance</p>
              </div>
            </div>
          </div>

          {/* Quick Portal Shortcuts Bento Grid */}
          <div className="bg-white border border-slate-200/80 p-4 rounded-2xl relative overflow-hidden shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <ClipboardCheck size={16} className="text-slate-500" />
              <h2 className="text-xs font-semibold text-slate-700">Quick Access Portals</h2>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
              <PortalCardCompact 
                title="Variations"
                sub="Omission & additions"
                icon={<PlusCircle size={15} className="text-blue-500" />}
                onClick={() => onNavigate('variation-manager')}
                colorClass="hover:border-blue-300 hover:bg-blue-50/20"
              />
              <PortalCardCompact 
                title="Management"
                sub="Project Lifecycles"
                icon={<GanttChart size={15} className="text-indigo-500" />}
                onClick={() => onNavigate('project-lifecycle')}
                colorClass="hover:border-indigo-300 hover:bg-indigo-50/20"
              />
              <PortalCardCompact 
                title="Checklists"
                sub="Quality & NCRs"
                icon={<ShieldCheck size={15} className="text-rose-500" />}
                onClick={() => onNavigate('quality-control')}
                colorClass="hover:border-rose-300 hover:bg-rose-50/20"
              />
              <PortalCardCompact 
                title="Workforce Hub"
                sub="Labor register"
                icon={<Users size={15} className="text-cyan-500" />}
                onClick={() => onNavigate('resource-management')}
                colorClass="hover:border-cyan-300 hover:bg-cyan-50/20"
              />
              <PortalCardCompact 
                title="Equipments"
                sub="Fleet & Calibration"
                icon={<Wrench size={15} className="text-amber-500" />}
                onClick={() => onNavigate('equipment-management')}
                colorClass="hover:border-amber-300 hover:bg-amber-50/20"
              />
              <PortalCardCompact 
                title="Site Permits"
                sub="HSE & Safety logs"
                icon={<HardHat size={15} className="text-orange-500" />}
                onClick={() => onNavigate('site-management')}
                colorClass="hover:border-orange-300 hover:bg-orange-50/20"
              />
              <PortalCardCompact 
                title="Warranty Hub"
                sub="Certificates & requests"
                icon={<Medal size={15} className="text-purple-500" />}
                onClick={() => onNavigate('after-sales')}
                colorClass="hover:border-purple-300 hover:bg-purple-50/20"
              />
            </div>
          </div>

          {/* Interactive Lists Section */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* Recent Quotations */}
            <div className="bg-white rounded-md border border-slate-200 flex flex-col overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-tight">Recent Quotations</h3>
                  <p className="text-[10px] font-bold text-slate-400 tracking-wide mt-0.5">Manage your latest commercial proposals</p>
                </div>
                <div className="flex items-center gap-1.5 font-sans">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={11} />
                    <input 
                      type="text"
                      placeholder="Search offers..."
                      value={quoteSearch}
                      onChange={(e) => setQuoteSearch(e.target.value)}
                      className="pl-7 pr-3 py-1 bg-slate-50 border border-slate-200 rounded text-[9.5px] font-bold focus:ring-1 focus:ring-slate-400 w-full md:w-34 font-mono"
                    />
                  </div>
                  <select 
                    value={quoteFilter}
                    onChange={(e) => setQuoteFilter(e.target.value as any)}
                    className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-[9.5px] font-bold tracking-tight focus:ring-1 focus:ring-slate-400"
                  >
                    <option value="All">All status</option>
                    {Object.values(QuoteStatus).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex-1 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="px-3 py-2 text-[9px] font-bold text-slate-400 tracking-wide">Quote no</th>
                      <th className="px-3 py-2 text-[9px] font-bold text-slate-400 tracking-wide">Project name</th>
                      <th className="px-3 py-2 text-[9px] font-bold text-slate-400 tracking-wide">Client name</th>
                      <th className="px-3 py-2 text-[9px] font-bold text-slate-400 tracking-wide">Current status</th>
                      <th className="px-3 py-2 text-[9px] font-bold text-slate-400 tracking-wide text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredQuotes.map((q) => (
                      <tr key={q.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-3 py-2 text-[10px] font-mono font-bold text-slate-600">{q.quoteNo}</td>
                        <td className="px-3 py-2">
                           <p className="text-[10px] font-bold text-slate-900 truncate max-w-[155px]">{q.projectName}</p>
                           <p className="text-[8px] text-slate-400 font-bold font-mono tracking-tighter mt-0.5">{q.submittedDate}</p>
                        </td>
                        <td className="px-3 py-2 text-[10px] font-semibold text-slate-600 truncate max-w-[110px]">{q.client.name}</td>
                        <td className="px-3 py-2">
                          <span className={cn(
                            "px-1.5 py-0.5 rounded text-[8px] font-bold border",
                            q.status === QuoteStatus.WON ? "bg-emerald-500 text-white border-emerald-400" :
                            q.status === QuoteStatus.LOST ? "bg-rose-500 text-white border-rose-400" :
                            q.status === QuoteStatus.SENT ? "bg-blue-600 text-white border-blue-400" : "bg-slate-400 text-white border-slate-300"
                          )}>
                            {q.status}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => {
                                onEditQuote(q);
                              }}
                              className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
                              title="Edit"
                            >
                              <Edit size={11} />
                            </button>
                            <button 
                              onClick={() => onDuplicateQuote(q)}
                              className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-all"
                              title="Duplicate"
                            >
                              <Copy size={11} />
                            </button>
                            <button 
                              onClick={() => onDeleteQuote(q.id)}
                              className="p-1 text-slate-400 hover:text-red-600 hover:bg-rose-50 rounded transition-all"
                              title="Delete"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredQuotes.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-3 py-8 text-center text-slate-400">
                          <Package size={18} className="mx-auto text-slate-200 mb-1" />
                          <p className="text-[10px] font-bold">No proposals found</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Active Projects */}
            <div className="bg-white rounded-md border border-slate-200 flex flex-col overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-tight">Ongoing Construction Sites</h3>
                  <p className="text-[10px] font-medium text-slate-400 mt-0.5">Track executions and live physical works</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setProjectViewMode('gantt')}
                      className={cn(
                        "px-2 py-1 text-[10px] font-bold rounded flex items-center gap-1 transition-all",
                        projectViewMode === 'gantt' ? "bg-white text-blue-600 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                      )}
                      title="Gantt Timeline View"
                    >
                      <GanttChart size={12} />
                      Gantt
                    </button>
                    <button
                      type="button"
                      onClick={() => setProjectViewMode('table')}
                      className={cn(
                        "px-2 py-1 text-[10px] font-bold rounded flex items-center gap-1 transition-all",
                        projectViewMode === 'table' ? "bg-white text-blue-600 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                      )}
                      title="Table List View"
                    >
                      <LayoutGrid size={12} />
                      Table
                    </button>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={11} />
                    <input 
                      type="text"
                      placeholder="Search site works..."
                      value={projectSearch}
                      onChange={(e) => setProjectSearch(e.target.value)}
                      className="pl-7 pr-3 py-1 bg-slate-50 border border-slate-200 rounded text-[9.5px] font-bold focus:ring-1 focus:ring-slate-400 w-full md:w-34 font-mono"
                    />
                  </div>
                </div>
              </div>

              {projectViewMode === 'gantt' ? (
                <div className="p-3 divide-y divide-slate-100 flex-1 overflow-y-auto max-h-[380px]">
                  {filteredProjects.map((p) => {
                    const metrics = getProjectTimelineMetrics(p);
                    return (
                      <div key={p.id} className="py-2.5 first:pt-1 last:pb-1 group">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="min-w-0">
                            <span 
                              onClick={() => onViewProject(p)} 
                              className="text-[11px] font-bold text-slate-900 hover:text-blue-600 cursor-pointer truncate block"
                            >
                              {p.projectName}
                            </span>
                            <span className="text-[9px] text-slate-400 font-medium">
                              {p.client.name} • {metrics.durationDays} Days Duration
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className={cn(
                              "text-[9px] font-mono font-bold px-1.5 py-0.5 rounded",
                              metrics.isOverdue 
                                ? "bg-rose-50 text-rose-700 border border-rose-200" 
                                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            )}>
                              {metrics.isOverdue ? 'Delayed' : `${metrics.progress}% complete`}
                            </span>
                            <button 
                              onClick={() => onViewProject(p)}
                              className="p-1 text-slate-400 hover:text-blue-600 rounded"
                            >
                              <ExternalLink size={11} />
                            </button>
                          </div>
                        </div>

                        {/* Linear timeline bar showing project start and expected completion dates */}
                        <div className="space-y-1">
                          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden relative">
                            <div 
                              className={cn(
                                "h-full rounded-full transition-all duration-500",
                                metrics.isOverdue ? "bg-rose-500" : "bg-gradient-to-r from-blue-500 to-indigo-600"
                              )}
                              style={{ width: `${metrics.progress}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono">
                            <span className="flex items-center gap-1">
                              <span className="text-slate-400">Start:</span>
                              <span className="font-semibold text-slate-700">{metrics.startDate}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="text-slate-400">Target Handover:</span>
                              <span className={cn("font-semibold", metrics.isOverdue ? "text-rose-600" : "text-slate-800")}>
                                {metrics.expectedCompletionDate}
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {filteredProjects.length === 0 && (
                    <div className="py-8 text-center text-slate-400">
                      <Package size={18} className="mx-auto text-slate-200 mb-1" />
                      <p className="text-[10px] font-bold">No ongoing projects found</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50">
                        <th className="px-3 py-2 text-[9px] font-bold text-slate-400 tracking-wide">Project details</th>
                        <th className="px-3 py-2 text-[9px] font-bold text-slate-400 tracking-wide">Client name</th>
                        <th className="px-3 py-2 text-[9px] font-bold text-slate-400 tracking-wide">Commenced</th>
                        <th className="px-3 py-2 text-[9px] font-bold text-slate-400 tracking-wide">Variations</th>
                        <th className="px-3 py-2 text-[9px] font-bold text-slate-400 tracking-wide text-right">View details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredProjects.map((p) => {
                        const variationValue = p.totalValue - (p.originalSum || p.totalValue);
                        return (
                          <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-3 py-2">
                              <p className="text-[10px] font-bold text-slate-900 truncate max-w-[155px]">{p.projectName}</p>
                              <div className="flex items-center gap-1 text-[8px] text-slate-400 font-bold mt-0.5">
                                <MapPin size={8} className="text-slate-400" /> {p.client.address}
                              </div>
                            </td>
                            <td className="px-3 py-2 text-[10px] font-semibold text-slate-600 truncate max-w-[110px]">{p.client.name}</td>
                            <td className="px-3 py-2 text-[10px] font-mono font-bold text-slate-500">{p.startDate}</td>
                            <td className="px-3 py-2">
                              <p className={cn(
                                "text-[10px] font-bold font-mono",
                                variationValue > 0 ? "text-emerald-600" : 
                                variationValue < 0 ? "text-rose-600" : "text-slate-400"
                              )}>
                                {variationValue !== 0 ? (
                                  <>
                                    {variationValue > 0 ? '+' : ''}
                                    LKR {variationValue.toLocaleString()}
                                  </>
                                ) : 'Nil'}
                              </p>
                            </td>
                            <td className="px-3 py-2 text-right">
                              <button 
                                onClick={() => onViewProject(p)}
                                className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
                                title="Open Detail Portal"
                              >
                                <ExternalLink size={12} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredProjects.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-3 py-8 text-center text-slate-400">
                            <CheckCircle2 size={18} className="mx-auto text-slate-200 mb-1" />
                            <p className="text-[10px] font-bold">No active systems construction</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Simplified Gantt Chart View for Ongoing Projects */}
          <OngoingProjectsGantt 
            projects={projects}
            onViewProject={onViewProject}
          />
        </div>
      )}

      {/* ------------------ TAB: EXECUTIVE INTELLIGENCE PERSPECTIVE ------------------ */}
      {activeTab === 'executive' && (
        <ExecutiveDashboardPerspective
          quotes={quotes}
          projects={projects}
          clients={clients}
          invoices={invoices}
          payments={payments}
          actualCostRecords={actualCostRecords}
          onViewProject={onViewProject}
          onNavigate={onNavigate}
          onGenerateReport={onGenerateReport}
        />
      )}

      {/* ------------------ TAB 2: FINANCIAL INTELLIGENCE PERSPECTIVE ------------------ */}
      {activeTab === 'finance' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Finance Command Ribbon - Single Line */}
          <div className="bg-white border border-slate-200/80 px-4 py-2 rounded-xl flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2 min-w-0">
              <Landmark size={15} className="text-emerald-600 shrink-0" />
              <span className="text-xs font-bold text-slate-800 whitespace-nowrap">Treasury & Cashflow</span>
              <span className="text-[11px] text-slate-400 hidden sm:inline">• LKR Base Currency</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => onNavigate('accounting')}
                className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold transition-colors shadow-2xs flex items-center gap-1.5"
              >
                <Building2 size={13} className="text-slate-500" />
                <span>Accounting Portal</span>
              </button>
              <button
                onClick={() => onNavigate('invoices')}
                className="px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs flex items-center gap-1.5"
              >
                <Plus size={13} />
                <span>New Invoice</span>
              </button>
            </div>
          </div>

          {/* 5 Master Financial KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Gross Invoiced</span>
                <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 flex items-center gap-0.5">
                  <TrendingUp size={10} /> +16.8%
                </span>
              </div>
              <p className="text-xl font-bold text-slate-900 mt-2">LKR {totalInvoiced.toLocaleString()}</p>
              <p className="text-[11px] text-slate-400 mt-1">{invoices.length} billings generated</p>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Liquid Collections</span>
                <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">
                  {paidRatio.toFixed(1)}% Rate
                </span>
              </div>
              <p className="text-xl font-bold text-emerald-600 mt-2">LKR {totalCollected.toLocaleString()}</p>
              <p className="text-[11px] text-slate-400 mt-1">{payments.length} receipt settlements</p>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Accounts Receivable</span>
                <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-amber-50 text-amber-700">
                  Exposure
                </span>
              </div>
              <p className="text-xl font-bold text-amber-600 mt-2">LKR {totalOutstanding.toLocaleString()}</p>
              <p className="text-[11px] text-slate-400 mt-1">{overdueInvoices.length} past due date</p>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Retention Withheld</span>
                <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700">
                  5% DLP
                </span>
              </div>
              <p className="text-xl font-bold text-slate-900 mt-2">LKR {Math.round(totalInvoiced * 0.05).toLocaleString()}</p>
              <p className="text-[11px] text-slate-400 mt-1">Releases at project handover</p>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Gross Margin %</span>
                <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">
                  Healthy
                </span>
              </div>
              <p className="text-xl font-bold text-slate-900 mt-2">34.8%</p>
              <p className="text-[11px] text-slate-400 mt-1">LKR {Math.round(totalInvoiced * 0.348).toLocaleString()} est. net profit</p>
            </div>
          </div>

          {/* Visual Financial Analytics Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Revenue vs Collections vs Direct Costs Trend */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs lg:col-span-2 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Revenue, Inflow & Direct Cost Trajectory</h3>
                  <p className="text-xs text-slate-500">Monthly billing vs liquid cash collections vs aluminium & glass direct expenses</p>
                </div>
                <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                  6-Month Trend
                </span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[
                    { month: 'May', Invoiced: 8500000, Collected: 7200000, DirectCost: 4800000 },
                    { month: 'Jun', Invoiced: 11200000, Collected: 9600000, DirectCost: 6500000 },
                    { month: 'Jul', Invoiced: 9800000, Collected: 8900000, DirectCost: 5800000 },
                    { month: 'Aug', Invoiced: 14500000, Collected: 12100000, DirectCost: 8400000 },
                    { month: 'Sep', Invoiced: 16800000, Collected: 13900000, DirectCost: 9900000 },
                    { month: 'Oct (Proj)', Invoiced: 18400000, Collected: 15600000, DirectCost: 10600000 }
                  ]}>
                    <defs>
                      <linearGradient id="colorInvoiced" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0.0}/>
                      </linearGradient>
                      <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => `${(val/1000000).toFixed(1)}M`} />
                    <Tooltip 
                      formatter={(val: any) => [`LKR ${Number(val).toLocaleString()}`, '']}
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }} 
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Area type="monotone" dataKey="Invoiced" stroke="#f97316" strokeWidth={2} fillOpacity={1} fill="url(#colorInvoiced)" />
                    <Area type="monotone" dataKey="Collected" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorCollected)" />
                    <Area type="monotone" dataKey="DirectCost" stroke="#64748b" strokeWidth={1.5} strokeDasharray="3 3" fillOpacity={0} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* A/R Aging Distribution */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-slate-900">A/R Aging Schedule</h3>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-amber-50 text-amber-700">Receivables</span>
                </div>
                <p className="text-xs text-slate-500 mb-4">Outstanding exposure grouped by maturity</p>

                <div className="space-y-3">
                  {[
                    { label: '0-30 Days (Current)', amount: Math.round(totalOutstanding * 0.54) || 2850000, percent: 54, color: 'bg-emerald-500' },
                    { label: '31-60 Days', amount: Math.round(totalOutstanding * 0.26) || 1350000, percent: 26, color: 'bg-blue-500' },
                    { label: '61-90 Days', amount: Math.round(totalOutstanding * 0.12) || 620000, percent: 12, color: 'bg-amber-500' },
                    { label: '90+ Days (Past Due)', amount: Math.round(totalOutstanding * 0.08) || 410000, percent: 8, color: 'bg-rose-500' }
                  ].map((bracket, i) => (
                    <div key={i} className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-100">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-medium text-slate-700">{bracket.label}</span>
                        <span className="font-semibold text-slate-900 font-mono">LKR {bracket.amount.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div className={cn("h-full rounded-full transition-all", bracket.color)} style={{ width: `${bracket.percent}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Weighted Dues Recovery</span>
                <span className="font-semibold text-slate-900 font-mono">22.4 Days Avg</span>
              </div>
            </div>
          </div>

          {/* Profitability Overview: Completed Projects Cost Variance Scatter Plot */}
          <ProfitabilityOverviewWidget
            projects={projects}
            actualCostRecords={actualCostRecords}
            onViewProject={onViewProject}
            onNavigateToPostEvaluation={(projId) => {
              if (projId) {
                const targetProj = projects.find(p => p.id === projId);
                if (targetProj) onViewProject(targetProj);
              }
              onNavigate('post-evaluation');
            }}
          />

          {/* Project Profitability P&L & Credit Limits Dual Column */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Project P&L Leaderboard */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs lg:col-span-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Active Projects P&L & Profitability</h3>
                    <p className="text-xs text-slate-500">Contract value, billings, direct materials/labor cost, and realized gross profit</p>
                  </div>
                  <button 
                    onClick={() => onNavigate('reporting')}
                    className="text-xs text-orange-600 font-medium hover:text-orange-700 flex items-center gap-1"
                  >
                    <span>Full P&L Report</span>
                    <ArrowUpRight size={13} />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-100 text-[11px] font-medium text-slate-400 pb-2">
                        <th className="pb-2 font-medium">Project & Client</th>
                        <th className="pb-2 font-medium">Contract Sum</th>
                        <th className="pb-2 font-medium">Invoiced</th>
                        <th className="pb-2 font-medium">Direct Cost</th>
                        <th className="pb-2 font-medium">Est. Profit</th>
                        <th className="pb-2 font-medium text-right">Margin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {projects.slice(0, 5).map((project, idx) => {
                        const contractSum = project.totalValue || (8500000 + (idx * 3200000));
                        const invoicedSum = Math.round(contractSum * (0.4 + (idx * 0.12)));
                        const costSum = Math.round(invoicedSum * 0.65);
                        const profit = invoicedSum - costSum;
                        const marginPercent = invoicedSum > 0 ? (profit / invoicedSum) * 100 : 35;
                        return (
                          <tr key={project.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3 pr-2">
                              <p className="font-semibold text-slate-900 truncate max-w-[180px]">{project.projectName}</p>
                              <p className="text-[11px] text-slate-400">{project.client?.name || 'Developer Partner'}</p>
                            </td>
                            <td className="py-3 font-mono text-slate-700 font-medium">LKR {contractSum.toLocaleString()}</td>
                            <td className="py-3 font-mono text-slate-700">LKR {invoicedSum.toLocaleString()}</td>
                            <td className="py-3 font-mono text-slate-500">LKR {costSum.toLocaleString()}</td>
                            <td className="py-3 font-mono font-semibold text-emerald-600">LKR {profit.toLocaleString()}</td>
                            <td className="py-3 text-right">
                              <span className={cn(
                                "px-2 py-0.5 rounded-md text-[10px] font-semibold font-mono",
                                marginPercent >= 35 ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60" :
                                marginPercent >= 25 ? "bg-blue-50 text-blue-700 border border-blue-200/60" :
                                "bg-amber-50 text-amber-700 border border-amber-200/60"
                              )}>
                                {marginPercent.toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      {projects.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                            No project financial records found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Credit Limit & Exposure Risk Radar */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-slate-900">Credit Limits & Exposure</h3>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-rose-50 text-rose-700">Risk Radar</span>
                </div>
                <p className="text-xs text-slate-500 mb-3">Accounts approaching credit ceilings</p>

                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {clientCreditAlerts.slice(0, 4).map((item, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-50/70 border border-slate-100">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-slate-900 truncate max-w-[140px]">{item.client.name}</span>
                        <span className={cn(
                          "text-[10px] font-bold px-1.5 py-0.5 rounded",
                          item.isExceeded ? "bg-rose-100 text-rose-700" :
                          item.percent >= 80 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                        )}>
                          {item.percent}% Limit
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono mb-1.5">
                        <span>Due: LKR {item.outstanding.toLocaleString()}</span>
                        <span>Ceiling: LKR {item.limit.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div className={cn(
                          "h-full rounded-full transition-all",
                          item.isExceeded ? "bg-rose-500" : item.percent >= 80 ? "bg-amber-500" : "bg-emerald-500"
                        )} style={{ width: `${Math.min(100, item.percent)}%` }} />
                      </div>
                    </div>
                  ))}
                  {clientCreditAlerts.length === 0 && (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      <CheckCircle2 size={16} className="mx-auto text-emerald-500 mb-1" />
                      All accounts safely within credit limits.
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Credit Policy Enforcement</span>
                <span className="text-emerald-600 font-medium flex items-center gap-1">
                  <ShieldCheck size={13} /> Strict 30-Day Terms
                </span>
              </div>
            </div>
          </div>

          {/* Overdue Action Queue & Cleared Inflow Feed */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* Overdue Recovery Queue */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  <h3 className="text-sm font-semibold text-slate-900">Overdue Invoices Action Queue</h3>
                </div>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-rose-50 text-rose-700">
                  {overdueInvoices.length} Action Items
                </span>
              </div>

              <div className="space-y-2.5 max-h-[220px] overflow-y-auto">
                {overdueInvoices.map((inv) => (
                  <div key={inv.id} className="p-3 bg-rose-50/40 border border-rose-100 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-slate-900">{inv.client?.name || 'Client Account'}</p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <span className="font-mono text-slate-700">{inv.invoiceNo}</span>
                        <span>•</span>
                        <span className="text-rose-600 font-medium">Due: {inv.dueDate || 'Immediate'}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-rose-600">LKR {(inv.balanceDue || 0).toLocaleString()}</p>
                      <button 
                        onClick={() => onNavigate('invoices')}
                        className="mt-1 text-[10px] text-slate-600 hover:text-slate-900 underline font-medium"
                      >
                        Send Reminder
                      </button>
                    </div>
                  </div>
                ))}
                {overdueInvoices.length === 0 && (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    <CheckCircle2 size={16} className="mx-auto text-emerald-500 mb-1" />
                    No overdue invoices. Accounts receivable in pristine standing.
                  </div>
                )}
              </div>
            </div>

            {/* Influx Payments Feed */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <h3 className="text-sm font-semibold text-slate-900">Cleared Liquid Collections Stream</h3>
                </div>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700">
                  Real-time Feed
                </span>
              </div>

              <div className="space-y-2.5 max-h-[220px] overflow-y-auto">
                {invoicePayments.map((inv) => (
                  <div key={inv.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-slate-900">{inv.client?.name || 'Client Account'}</p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <span className="font-mono text-slate-700">Inv: {inv.invoiceNo}</span>
                        <span>•</span>
                        <span>Bank Transfer / Clearing</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-emerald-600">+LKR {(inv.amountPaid || 0).toLocaleString()}</p>
                      <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded mt-0.5 inline-block">Cleared</span>
                    </div>
                  </div>
                ))}
                {invoicePayments.length === 0 && (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    No recent payment postings recorded yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------ TAB 3: OPERATIONS & FIELD EXECUTION PERSPECTIVE ------------------ */}
      {activeTab === 'operations' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Operations Command Ribbon - Single Line */}
          <div className="bg-white border border-slate-200/80 px-4 py-2 rounded-xl flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2 min-w-0">
              <HardHat size={15} className="text-blue-600 shrink-0" />
              <span className="text-xs font-bold text-slate-800 whitespace-nowrap">Site Operations</span>
              <span className="text-[11px] text-slate-400 hidden sm:inline">• 6 Active Sites</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => onNavigate('resource-management')}
                className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold transition-colors shadow-2xs flex items-center gap-1.5"
              >
                <Users size={13} className="text-slate-500" />
                <span>Workforce</span>
              </button>
              <button
                onClick={() => onNavigate('equipment-management')}
                className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold transition-colors shadow-2xs flex items-center gap-1.5"
              >
                <Wrench size={13} className="text-slate-500" />
                <span>Equipment</span>
              </button>
              <button
                onClick={() => onNavigate('project-lifecycle')}
                className="px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs flex items-center gap-1.5"
              >
                <GanttChart size={13} />
                <span>Timelines</span>
              </button>
            </div>
          </div>

          {/* 5 Master Operations KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Active Sites</span>
                <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">
                  Live
                </span>
              </div>
              <p className="text-xl font-bold text-slate-900 mt-2">{projects.filter(p => p.status === 'In Progress').length || 6} Projects</p>
              <p className="text-[11px] text-slate-400 mt-1">Facade & window erection</p>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Crew Deployed</span>
                <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">
                  {personnelUtil > 0 ? `${personnelUtil.toFixed(0)}%` : '78%'} Utilized
                </span>
              </div>
              <p className="text-xl font-bold text-slate-900 mt-2">{assignedPersonnel || 14} / {totalPersonnel || 18}</p>
              <p className="text-[11px] text-slate-400 mt-1">Glaziers, leads & supervisors</p>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Fleet & Rig Assets</span>
                <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-amber-50 text-amber-700">
                  {deployedEquipment || 10} In Field
                </span>
              </div>
              <p className="text-xl font-bold text-slate-900 mt-2">{totalEquipment || 14} Units</p>
              <p className="text-[11px] text-slate-400 mt-1">{equipmentMaintenance || 2} in calibration service</p>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Shop Fabrication</span>
                <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-purple-50 text-purple-700">
                  Run-rate
                </span>
              </div>
              <p className="text-xl font-bold text-slate-900 mt-2">520 m² / wk</p>
              <p className="text-[11px] text-slate-400 mt-1">CNC cutting & unitized assembly</p>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>HSE Incident-Free</span>
                <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">
                  Safe
                </span>
              </div>
              <p className="text-xl font-bold text-emerald-600 mt-2">148 Days</p>
              <p className="text-[11px] text-slate-400 mt-1">99.8% safety compliance score</p>
            </div>
          </div>

          {/* Live Construction Milestones Radar */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Live Site Milestone Progression Radar</h3>
                <p className="text-xs text-slate-500">Real-time facade erection stages from substructure anchoring to field water penetration testing</p>
              </div>
              <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                6 Active Construction Sites
              </span>
            </div>

            <div className="space-y-4">
              {[
                { 
                  name: 'Grand Hyatt Residencies Tower B - Curtain Wall', 
                  client: 'John Keells Properties', 
                  location: 'Colombo 03', 
                  stage: 'Panel Glazing & Gasket Sealing', 
                  progress: 74, 
                  crew: 8, 
                  lead: 'Marcus Silva (Civil Eng)', 
                  targetDate: '2026-10-15',
                  steps: ['Anchors Fixed', 'Transoms Erected', 'Panel Glazing', 'Weather Seal', 'Testing', 'Handover'],
                  activeStep: 2
                },
                { 
                  name: 'Prime Grand Ward Place - Thermal Break Facade', 
                  client: 'Prime Lands Residencies', 
                  location: 'Colombo 07', 
                  stage: 'Mullion & Transom Framing', 
                  progress: 48, 
                  crew: 6, 
                  lead: 'Rohan Jayasuriya (Structural Lead)', 
                  targetDate: '2026-11-20',
                  steps: ['Anchors Fixed', 'Transoms Erected', 'Panel Glazing', 'Weather Seal', 'Testing', 'Handover'],
                  activeStep: 1
                },
                { 
                  name: 'Port City Luxury Yacht Club - Frameless Structural Glass', 
                  client: 'Access Engineering PLC', 
                  location: 'Colombo Port City', 
                  stage: 'Water Penetration Chamber Testing', 
                  progress: 92, 
                  crew: 5, 
                  lead: 'Kavinda Perera (QA Manager)', 
                  targetDate: '2026-09-30',
                  steps: ['Anchors Fixed', 'Transoms Erected', 'Panel Glazing', 'Weather Seal', 'Testing', 'Handover'],
                  activeStep: 4
                }
              ].map((site, i) => (
                <div key={i} className="p-4 rounded-xl border border-slate-200/70 bg-slate-50/40 hover:bg-slate-50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-semibold text-slate-900">{site.name}</h4>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                          {site.progress}% Complete
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Client: <strong className="text-slate-700">{site.client}</strong> • Loc: <span className="text-slate-700">{site.location}</span> • Lead: <span className="text-slate-700">{site.lead}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>Crew on site: <strong className="text-slate-800">{site.crew}</strong></span>
                      <span>Target: <strong className="text-slate-800 font-mono">{site.targetDate}</strong></span>
                    </div>
                  </div>

                  {/* Step progression indicators */}
                  <div className="grid grid-cols-6 gap-2 pt-2 border-t border-slate-200/50">
                    {site.steps.map((step, sIdx) => {
                      const isPast = sIdx < site.activeStep;
                      const isCurrent = sIdx === site.activeStep;
                      return (
                        <div key={sIdx} className="space-y-1">
                          <div className={cn(
                            "h-1.5 rounded-full transition-all",
                            isPast ? "bg-emerald-500" : isCurrent ? "bg-orange-500 animate-pulse" : "bg-slate-200"
                          )} />
                          <p className={cn(
                            "text-[9.5px] truncate font-medium",
                            isPast ? "text-emerald-700" : isCurrent ? "text-orange-600 font-semibold" : "text-slate-400"
                          )}>
                            {step}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dual Split: Technical Crew Deployment & Fleet Machinery Radar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Workforce Field Deployment Roster */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs lg:col-span-2">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Workforce Field Roster & Shift Status</h3>
                  <p className="text-xs text-slate-500">Live technical deployment of Glaziers, Structural Fitters and QA Supervisors</p>
                </div>
                <button
                  onClick={() => onNavigate('resource-management')}
                  className="text-xs text-orange-600 font-medium hover:text-orange-700 flex items-center gap-1"
                >
                  <span>Manage Crew</span>
                  <ArrowUpRight size={13} />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] font-medium text-slate-400 pb-2">
                      <th className="pb-2 font-medium">Technician / Lead</th>
                      <th className="pb-2 font-medium">Trade Role</th>
                      <th className="pb-2 font-medium">Site Assignment</th>
                      <th className="pb-2 font-medium">Certification</th>
                      <th className="pb-2 font-medium text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {personnel.slice(0, 5).map((member) => (
                      <tr key={member.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 pr-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[11px] font-semibold text-slate-700">
                              {member.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900">{member.name}</p>
                              <p className="text-[10px] text-slate-400 font-mono">{member.employeeId || member.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 text-slate-700">{member.role}</td>
                        <td className="py-2.5 text-slate-600 truncate max-w-[140px]">{member.currentProjectId || 'Grand Hyatt Tower B'}</td>
                        <td className="py-2.5">
                          <span className="text-[10px] font-medium px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                            {member.certifications?.[0]?.type || 'SLS Glazing L3'}
                          </span>
                        </td>
                        <td className="py-2.5 text-right">
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-medium",
                            member.status === 'Available' ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60" :
                            member.status === 'On Leave' ? "bg-slate-100 text-slate-600" : "bg-blue-50 text-blue-700"
                          )}>
                            {member.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Fleet Machinery Health & Calibration Radar */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-slate-900">Machinery Fleet & Tool Health</h3>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-amber-50 text-amber-700">Calibration</span>
                </div>
                <p className="text-xs text-slate-500 mb-3">Deployment and service readiness</p>

                <div className="space-y-3">
                  {[
                    { name: 'Dual-Head CNC Mitre Saw #1', code: 'EQ-CNC-01', location: 'Factory Shop-Floor', status: 'Available', calDue: '2026-12-10' },
                    { name: 'Glass Vacuum Suction Crane 650kg', code: 'EQ-CRN-04', location: 'Grand Hyatt Site', status: 'In Use', calDue: '2026-10-05' },
                    { name: 'Thermal Barrier Crimp Machine', code: 'EQ-CRM-02', location: 'Assembly Line 2', status: 'Available', calDue: '2026-11-15' },
                    { name: 'Mobile Boom Hoist 24m', code: 'EQ-HST-03', location: 'Service Depot', status: 'Maintenance', calDue: '2026-09-20' }
                  ].map((eq, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-100 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-slate-900">{eq.name}</p>
                        <div className="flex items-center gap-2 text-[10.5px] text-slate-500 mt-0.5 font-mono">
                          <span>{eq.code}</span>
                          <span>•</span>
                          <span>{eq.location}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-medium",
                          eq.status === 'Available' ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60" :
                          eq.status === 'In Use' ? "bg-blue-50 text-blue-700 border border-blue-200/60" :
                          "bg-amber-50 text-amber-700 border border-amber-200/60"
                        )}>
                          {eq.status}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-1 font-mono">Cal: {eq.calDue}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Fleet Availability Index</span>
                <span className="font-semibold text-slate-900 font-mono">85.7% Ready</span>
              </div>
            </div>
          </div>

          {/* Site Operations Gantt Timeline */}
          <OngoingProjectsGantt 
            projects={projects}
            onViewProject={onViewProject}
          />
        </div>
      )}

      {/* ------------------ TAB 4: QUALITY & RISK COMPLIANCE PERSPECTIVE ------------------ */}
      {activeTab === 'quality' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Quality Command Ribbon - Single Line */}
          <div className="bg-white border border-slate-200/80 px-4 py-2 rounded-xl flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2 min-w-0">
              <ShieldCheck size={15} className="text-emerald-600 shrink-0" />
              <span className="text-xs font-bold text-slate-800 whitespace-nowrap">Quality Assurance</span>
              <span className="text-[11px] text-slate-400 hidden sm:inline">• SLS 1283 Standards</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => onNavigate('quality-control')}
                className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold transition-colors shadow-2xs flex items-center gap-1.5"
              >
                <ClipboardCheck size={13} className="text-slate-500" />
                <span>Checklists</span>
              </button>
              <button
                onClick={() => onNavigate('quality-control')}
                className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold transition-colors shadow-2xs flex items-center gap-1.5"
              >
                <AlertTriangle size={13} className="text-amber-500" />
                <span>Defects</span>
              </button>
              <button
                onClick={() => onNavigate('quality-control')}
                className="px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs flex items-center gap-1.5"
              >
                <ShieldCheck size={13} />
                <span>Launch Audit</span>
              </button>
            </div>
          </div>

          {/* 5 Master Quality KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Checklist Pass Rate</span>
                <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">
                  Compliant
                </span>
              </div>
              <p className="text-xl font-bold text-emerald-600 mt-2">{passRate.toFixed(1)}%</p>
              <p className="text-[11px] text-slate-400 mt-1">{passedInspections} passed / {totalInspections} total runs</p>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Open NCR Reports</span>
                <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-amber-50 text-amber-700">
                  Actioning
                </span>
              </div>
              <p className="text-xl font-bold text-slate-900 mt-2">{openNCRs.length} Defects</p>
              <p className="text-[11px] text-slate-400 mt-1">1 Critical • 1 Major • 1 Minor</p>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Mean Resolution</span>
                <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">
                  Velocity
                </span>
              </div>
              <p className="text-xl font-bold text-slate-900 mt-2">3.8 Days</p>
              <p className="text-[11px] text-slate-400 mt-1">NCR closed within target SLA</p>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Chamber Testing</span>
                <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-purple-50 text-purple-700">
                  ASTM E283
                </span>
              </div>
              <p className="text-xl font-bold text-slate-900 mt-2">100% Passed</p>
              <p className="text-[11px] text-slate-400 mt-1">Water infiltration & wind load</p>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Calibration Accuracy</span>
                <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">
                  Certified
                </span>
              </div>
              <p className="text-xl font-bold text-slate-900 mt-2">99.4%</p>
              <p className="text-[11px] text-slate-400 mt-1">Torque wrenches & laser gauges</p>
            </div>
          </div>

          {/* Quality Visual Analytics Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Defect Severity Chart */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-slate-900">Defect Severity Profile</h3>
                <span className="text-[11px] font-medium px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">NCR Distribution</span>
              </div>
              <p className="text-xs text-slate-500 mb-4">Breakdown of non-conformity severity across active projects</p>
              <div className="h-[210px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ncrSeverityData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="severity" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#ffffff', 
                        border: '1px solid #e2e8f0', 
                        borderRadius: '12px', 
                        fontSize: '11px', 
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' 
                      }} 
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={36}>
                      {ncrSeverityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Quality Standard Compliance Checklist Matrix */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs lg:col-span-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-slate-900">Standard Specifications & ITP Matrix</h3>
                  <span className="text-[11px] font-medium px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md">Active Standards</span>
                </div>
                <p className="text-xs text-slate-500 mb-3">Verification against architectural aluminum and glazing specifications</p>

                <div className="space-y-2.5">
                  {[
                    { code: 'ASTM E283 / E330', title: 'Air Leakage & Structural Wind Load Test', standard: 'ASTM International', status: 'Passed', score: '100%' },
                    { code: 'SLS 1283:2006', title: 'Specification for Aluminum Alloy Windows & Doors', standard: 'Sri Lanka Standards', status: 'Passed', score: '98.5%' },
                    { code: 'AAMA 501.2', title: 'Field Water Penetration Resistance Hose Test', standard: 'AAMA Fenestration', status: 'Active Audit', score: 'In Progress' },
                    { code: 'BS EN 12150-1', title: 'Thermally Toughened Soda Lime Silicate Safety Glass', standard: 'British Standards', status: 'Passed', score: '99.2%' }
                  ].map((std, i) => (
                    <div key={i} className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-slate-900">{std.code}</span>
                          <span className="text-[10px] text-slate-400">•</span>
                          <span className="text-[11px] text-slate-500 font-medium">{std.standard}</span>
                        </div>
                        <p className="font-medium text-slate-700 mt-0.5">{std.title}</p>
                      </div>
                      <div className="text-right">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-medium",
                          std.status === 'Passed' ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60" : "bg-blue-50 text-blue-700 border border-blue-200/60"
                        )}>
                          {std.status}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-1 font-mono">{std.score}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Compliance Benchmark Index</span>
                <span className="font-semibold text-emerald-600 font-mono">99.4% Conformance</span>
              </div>
            </div>
          </div>

          {/* Active NCR Registry & Inspection Log Feed */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Active Non-Conformance Reports (NCR) */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs lg:col-span-2">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Active Non-Conformance Report (NCR) Registry</h3>
                  <p className="text-xs text-slate-500">Track corrective actions, engineer assignments, and resolution deadlines</p>
                </div>
                <button
                  onClick={() => onNavigate('quality-control')}
                  className="text-xs text-orange-600 font-medium hover:text-orange-700 flex items-center gap-1"
                >
                  <span>Open NCR Register</span>
                  <ArrowUpRight size={13} />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] font-medium text-slate-400 pb-2">
                      <th className="pb-2 font-medium">NCR Code</th>
                      <th className="pb-2 font-medium">Project Site</th>
                      <th className="pb-2 font-medium">Defect Description</th>
                      <th className="pb-2 font-medium">Severity</th>
                      <th className="pb-2 font-medium text-right">Action State</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {openNCRs.map((ncr) => (
                      <tr key={ncr.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 font-mono font-semibold text-slate-800 pr-2">{ncr.ncrNo}</td>
                        <td className="py-3 font-medium text-slate-900 truncate max-w-[140px]">{ncr.project}</td>
                        <td className="py-3 text-slate-600 truncate max-w-[220px]">{ncr.description}</td>
                        <td className="py-3">
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-medium border",
                            ncr.severity === 'Critical' ? "bg-rose-50 text-rose-700 border-rose-200/60" :
                            ncr.severity === 'Major' ? "bg-amber-50 text-amber-700 border-amber-200/60" : 
                            "bg-blue-50 text-blue-700 border-blue-200/60"
                          )}>
                            {ncr.severity}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                            {ncr.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Quality Inspection Log Feed */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-slate-900">Live Inspection Stream</h3>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700">Live Log</span>
                </div>
                <p className="text-xs text-slate-500 mb-3">Field supervisor verification stamps</p>

                <div className="space-y-3">
                  {[
                    { project: 'Grand Hyatt Tower B', check: 'Mullion plumb & alignment verified within 1.5mm tolerance', inspector: 'Marcus Silva', time: '1 hr ago', status: 'Passed' },
                    { project: 'Prime Grand Ward Place', check: 'Thermal break structural screw torque check (8.5 Nm)', inspector: 'Rohan J.', time: '3 hrs ago', status: 'Passed' },
                    { project: 'Port City Yacht Club', check: 'Structural silicone bead adhesion test (ASTM C1135)', inspector: 'Kavinda P.', time: 'Yesterday', status: 'Audit Ready' }
                  ].map((audit, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-100 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-slate-900">{audit.project}</p>
                        <span className="text-[10px] font-medium px-2 py-0.2 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200/60">
                          {audit.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 line-clamp-2">{audit.check}</p>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 pt-1.5 border-t border-slate-100">
                        <span>Lead: <strong className="text-slate-700">{audit.inspector}</strong></span>
                        <span>{audit.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Audited Items This Month</span>
                <span className="font-semibold text-slate-900 font-mono">148 Checkpoints</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------ TAB 5: CRM & CLIENT FOCUS PERSPECTIVE ------------------ */}
      {activeTab === 'crm' && (
        <div className="space-y-4 animate-fadeIn">
          {/* CRM Command Ribbon - Single Line */}
          <div className="bg-white border border-slate-200/80 px-4 py-2 rounded-xl flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2 min-w-0">
              <HeartHandshake size={15} className="text-purple-600 shrink-0" />
              <span className="text-xs font-bold text-slate-800 whitespace-nowrap">Client Engagement</span>
              <span className="text-[11px] text-slate-400 hidden sm:inline">• CSAT: 4.9 / 5.0</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => onNavigate('clients')}
                className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold transition-colors shadow-2xs flex items-center gap-1.5"
              >
                <Users size={13} className="text-slate-500" />
                <span>Directory</span>
              </button>
              <button
                onClick={() => onNavigate('customer-portal')}
                className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold transition-colors shadow-2xs flex items-center gap-1.5"
              >
                <ExternalLink size={13} className="text-slate-500" />
                <span>Portal</span>
              </button>
              <button
                onClick={() => onNavigate('after-sales')}
                className="px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs flex items-center gap-1.5"
              >
                <Medal size={13} />
                <span>Warranty</span>
              </button>
            </div>
          </div>

          {/* 5 Master CRM KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Enterprise Clients</span>
                <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">
                  Tier 1
                </span>
              </div>
              <p className="text-xl font-bold text-slate-900 mt-2">{clients.length} Accounts</p>
              <p className="text-[11px] text-slate-400 mt-1">Developers, builders & architects</p>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Inbound Inquiries</span>
                <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-amber-50 text-amber-700">
                  {openInquiries.length} Pending
                </span>
              </div>
              <p className="text-xl font-bold text-slate-900 mt-2">{inquiries.length} Inquiries</p>
              <p className="text-[11px] text-slate-400 mt-1">Avg 1.8 hr response turnaround</p>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Service Helpdesk</span>
                <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-rose-50 text-rose-700">
                  Site Visits
                </span>
              </div>
              <p className="text-xl font-bold text-slate-900 mt-2">{serviceTickets.length} Open</p>
              <p className="text-[11px] text-slate-400 mt-1">Scheduled maintenance & seal checks</p>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Active Warranties</span>
                <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">
                  10-Yr Guarantee
                </span>
              </div>
              <p className="text-xl font-bold text-slate-900 mt-2">{activeWarranties.length} Issued</p>
              <p className="text-[11px] text-slate-400 mt-1">Structural & finish warranties</p>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Client NPS / CSAT</span>
                <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">
                  Premier
                </span>
              </div>
              <p className="text-xl font-bold text-emerald-600 mt-2">4.9 / 5.0</p>
              <p className="text-[11px] text-slate-400 mt-1">98% repeat project preference</p>
            </div>
          </div>

          {/* CRM Visual Analytics Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Service Ticket Urgency distribution */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-slate-900">Service Tickets by Urgency</h3>
                <span className="text-[11px] font-medium px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">Helpdesk</span>
              </div>
              <p className="text-xs text-slate-500 mb-3">Field support requests categorized by urgency</p>
              <div className="h-[210px] flex items-center justify-center">
                {serviceRequestsUrgency.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={serviceRequestsUrgency}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {serviceRequestsUrgency.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#ffffff', 
                          border: '1px solid #e2e8f0', 
                          borderRadius: '12px', 
                          fontSize: '11px', 
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' 
                        }} 
                      />
                      <Legend verticalAlign="bottom" height={28} wrapperStyle={{ fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center text-slate-400 text-xs">
                    <Info size={16} className="mx-auto text-slate-300 mb-1" />
                    No active service tickets
                  </div>
                )}
              </div>
            </div>

            {/* Top Enterprise Clients Portfolio */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs lg:col-span-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-slate-900">Key Enterprise Accounts & Exposure</h3>
                  <span className="text-[11px] font-medium px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md">Corporate Portfolio</span>
                </div>
                <p className="text-xs text-slate-500 mb-3">Principal developers and general contractors with active contracts</p>

                <div className="space-y-2.5">
                  {clients.slice(0, 4).map((c, i) => (
                    <div key={c.id || i} className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl flex items-center justify-between text-xs hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-orange-100/70 text-orange-700 font-semibold flex items-center justify-center text-xs">
                          {c.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{c.name}</p>
                          <p className="text-[11px] text-slate-500">{(c.contactPersons?.[0]?.name || c.tradeName || 'Key Account')} • {c.email || c.phone}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-slate-900 font-mono">Credit: LKR {(c.creditLimit / 1000000).toFixed(1)}M</p>
                        <span className="text-[10px] font-medium px-2 py-0.2 rounded bg-emerald-50 text-emerald-700 mt-0.5 inline-block">
                          Active Partner
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Account Coverage Health</span>
                <span className="font-semibold text-slate-900 font-mono">100% Verified Contact Points</span>
              </div>
            </div>
          </div>

          {/* Client Inquiries Inbox & Active Helpdesk Stream */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Customer Inquiries Inbox */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs lg:col-span-2">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Recent Client Inquiries Feed</h3>
                  <p className="text-xs text-slate-500">Inbound specifications, RFQs, and consultation requests</p>
                </div>
                <button
                  onClick={() => onNavigate('customer-portal')}
                  className="text-xs text-orange-600 font-medium hover:text-orange-700 flex items-center gap-1"
                >
                  <span>Open Inquiries Portal</span>
                  <ArrowUpRight size={13} />
                </button>
              </div>

              <div className="space-y-2.5 max-h-[260px] overflow-y-auto">
                {inquiries.map((inq) => (
                  <div key={inq.id} className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl space-y-1.5 text-xs">
                    <div className="flex justify-between items-center">
                      <p className="font-semibold text-slate-900">{inq.subject}</p>
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-medium border",
                        inq.status === 'Pending' ? "bg-amber-50 text-amber-700 border-amber-200/60" : "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                      )}>
                        {inq.status}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px] line-clamp-2">{inq.message}</p>
                    <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1 border-t border-slate-100/60 font-mono">
                      <span>Channel: {inq.preferredResponse}</span>
                      <span>Logged: {inq.createdAt}</span>
                    </div>
                  </div>
                ))}
                {inquiries.length === 0 && (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    <HelpCircle size={18} className="mx-auto text-slate-300 mb-1" />
                    No customer inquiries currently registered.
                  </div>
                )}
              </div>
            </div>

            {/* Post-Handover Warranty Certificates Portfolio */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-slate-900">Warranty Certificates</h3>
                  <span className="text-[11px] font-medium px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md">10-Yr Guarantee</span>
                </div>
                <p className="text-xs text-slate-500 mb-3">Issued post-handover guarantee certificates</p>

                <div className="space-y-2.5 max-h-[220px] overflow-y-auto">
                  {warrantyCertificates.map((cert) => (
                    <div key={cert.id} className="p-2.5 bg-slate-50/70 border border-slate-100 rounded-xl space-y-1 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-mono font-bold text-slate-600 text-[10px]">{cert.certificateNo}</span>
                        <span className={cn(
                          "px-2 py-0.5 rounded-md text-[10px] font-medium",
                          cert.status === 'Active' ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60" :
                          cert.status === 'Expiring Soon' ? "bg-amber-50 text-amber-700 border border-amber-200/60" :
                          "bg-rose-50 text-rose-700 border border-rose-200/60"
                        )}>
                          {cert.status}
                        </span>
                      </div>
                      <p className="font-semibold text-slate-900 truncate">{cert.customerName}</p>
                      <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1">
                        <span>{cert.type}</span>
                        <span className="font-mono">Expires: {cert.endDate}</span>
                      </div>
                    </div>
                  ))}
                  {warrantyCertificates.length === 0 && (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      <Medal size={18} className="mx-auto text-slate-300 mb-1" />
                      No active warranty certificates on file.
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Coverage Guarantee</span>
                <span className="font-semibold text-emerald-600 font-mono">100% SLS Guaranteed</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------ TAB: ANALYTICS & PRICING INTELLIGENCE PERSPECTIVE ------------------ */}
      {activeTab === 'analytics' && (
        <AnalyticsDashboardPerspective
          variants={variants}
          categories={categories}
          itemTemplates={itemTemplates}
          onApplyBulkPriceUpdate={onApplyBulkPriceUpdate}
          onNavigate={onNavigate}
          quotes={quotes}
          projects={projects}
        />
      )}
    </div>
  );
};

// ----------------------------------------------------
// MODULAR MINI INTERACTION BLOCKS / COMPONENT ACCENTS
// ----------------------------------------------------

const PortalCardCompact = ({ title, sub, icon, onClick, colorClass }: { title: string; sub: string; icon: React.ReactNode; onClick: () => void; colorClass: string }) => (
  <button 
    onClick={onClick}
    className={cn(
      "p-3.5 bg-white border border-slate-200/80 rounded-xl transition-all text-left flex flex-col justify-between items-start outline-none hover:bg-slate-50 hover:border-slate-300 shadow-xs", 
      colorClass
    )}
  >
    <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 mb-2">
      {icon}
    </div>
    <div className="text-left">
      <h4 className="text-xs font-semibold text-slate-900 leading-tight mb-0.5">{title}</h4>
      <p className="text-[11px] text-slate-500 font-normal leading-tight">{sub}</p>
    </div>
  </button>
);
