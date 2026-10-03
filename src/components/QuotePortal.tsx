import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Briefcase, 
  Calendar, 
  Download, 
  ArrowLeft,
  Copy,
  MapPin,
  User,
  Phone,
  Mail,
  Building2,
  Percent,
  CreditCard,
  Layout,
  Save,
  Sparkles,
  Info,
  DollarSign,
  TrendingUp,
  SlidersHorizontal,
  X,
  Folder
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  Quote, 
  QuoteStatus, 
  BOQItem, 
  Project, 
  Client, 
  CompanySettings, 
  QuoteTemplate, 
  PdfLayout, 
  PricingMethod, 
  ProjectStage
} from '../types';
import { cn, getQuoteTotalBreakdown } from '../lib/utils';
import { BOQTable } from './BOQTable';
import { TermsEditor } from './TermsEditor';
import { TimelineEditor } from './TimelineEditor';
import { LivePreview } from './LivePreview';
import { ConfirmationModal } from './ConfirmationModal';
import { ExportActions } from './common/ExportActions';
import { exportQuotesCSV, exportQuotesPDF } from '../services/dataExportService';

interface QuotePortalProps {
  mode: 'list' | 'editor';
  quotes: Quote[];
  quote: Quote;
  projects: Project[];
  clients: Client[];
  templates: QuoteTemplate[];
  companySettings: CompanySettings;
  selectedLayout: PdfLayout;
  onSetSelectedLayout: (layout: PdfLayout) => void;
  onUpdateQuote: (quote: Quote) => void;
  onSaveQuote: () => void;
  onNewQuote: () => void;
  onEditQuote: (quote: Quote) => void;
  onDuplicateQuote: (quote: Quote) => void;
  onDeleteQuote: (id: string) => void;
  onUpdateQuoteStatus: (id: string, status: QuoteStatus) => void;
  onSaveClient: (client: Client) => Client;
  onApplyTemplate: (template: QuoteTemplate) => void;
  onOpenSaveTemplateModal: () => void;
  onOpenTemplateManager: () => void;
  onOpenDownloadPortal: (config: { type: 'Project' | 'Quote' | 'Dashboard' | 'Variation' | 'Invoice' | 'AllDocuments' | 'Timeline' | 'AuditLog'; data: any }) => void;
  onBackToList: () => void;
  onActivateProject?: (quoteId: string) => void;
  // BOQTable callbacks
  onAddItem: (type?: 'Title' | 'Main' | 'Sub') => void;
  onMoveItem: (id: string, direction: 'up' | 'down') => void;
  onDeleteItem: (id: string) => void;
  onDuplicateItem: (id: string) => void;
  onInsertItem: (type: 'Title' | 'Main' | 'Sub', index: number) => void;
  onOpenCatalog: () => void;
  onSaveAsTemplate: (item: BOQItem) => void;
  generatePVCForBOQItem: (item: BOQItem) => string;
}

export const QuotePortal: React.FC<QuotePortalProps> = ({
  mode,
  quotes,
  quote,
  projects,
  clients,
  templates,
  companySettings,
  selectedLayout,
  onSetSelectedLayout,
  onUpdateQuote,
  onSaveQuote,
  onNewQuote,
  onEditQuote,
  onDuplicateQuote,
  onDeleteQuote,
  onUpdateQuoteStatus,
  onSaveClient,
  onApplyTemplate: _onApplyTemplate,
  onOpenSaveTemplateModal,
  onOpenTemplateManager,
  onOpenDownloadPortal,
  onBackToList,
  onActivateProject,
  onAddItem,
  onMoveItem,
  onDeleteItem,
  onDuplicateItem,
  onInsertItem,
  onOpenCatalog,
  onSaveAsTemplate,
  generatePVCForBOQItem
}) => {
  // List View States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | 'All' | 'Active'>('All');
  const [stageFilter, setStageFilter] = useState<ProjectStage | 'All'>('All');
  const [pricingFilter, setPricingFilter] = useState<PricingMethod | 'All'>('All');
  const [projectFilter, setProjectFilter] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');
  const [sortBy, setSortBy] = useState<'date' | 'value' | 'name' | 'status'>('date');
  const [quoteToDelete, setQuoteToDelete] = useState<string | null>(null);

  // Editor View States
  const [editorTab, setEditorTab] = useState<'form' | 'timeline' | 'preview'>('form');

  // Active Quote Calculations
  const {
    subTotal,
    discountAmount,
    taxAmount,
    grandTotal
  } = useMemo(() => getQuoteTotalBreakdown(quote), [quote]);

  // Master KPI Metrics for List View
  const kpis = useMemo(() => {
    const totalCount = quotes.length;
    
    // Total gross pipeline value
    const totalPipelineValue = quotes.reduce((acc, q) => {
      const breakdown = getQuoteTotalBreakdown(q);
      return acc + breakdown.grandTotal;
    }, 0);

    // Won quotes
    const wonQuotes = quotes.filter(q => q.status === QuoteStatus.WON || q.status === QuoteStatus.PROJECT);
    const wonValue = wonQuotes.reduce((acc, q) => {
      const breakdown = getQuoteTotalBreakdown(q);
      return acc + breakdown.grandTotal;
    }, 0);

    // Active pipeline (Draft, Site Visit, Internal Review, Sent)
    const activeQuotes = quotes.filter(q => 
      q.status === QuoteStatus.DRAFT || 
      q.status === QuoteStatus.SITE_VISIT || 
      q.status === QuoteStatus.INTERNAL_REVIEW || 
      q.status === QuoteStatus.SENT
    );
    const activeValue = activeQuotes.reduce((acc, q) => {
      const breakdown = getQuoteTotalBreakdown(q);
      return acc + breakdown.grandTotal;
    }, 0);

    const winRate = totalCount > 0 ? (wonQuotes.length / totalCount) * 100 : 0;
    const avgDealSize = totalCount > 0 ? totalPipelineValue / totalCount : 0;

    return {
      totalCount,
      totalPipelineValue,
      wonCount: wonQuotes.length,
      wonValue,
      activeCount: activeQuotes.length,
      activeValue,
      winRate,
      avgDealSize
    };
  }, [quotes]);

  // Filtered & Sorted Quotes
  const filteredQuotes = useMemo(() => {
    return quotes.filter(q => {
      const qProjectCode = q.projectCode || '';
      const qProjectId = q.projectId || '';
      const matchesSearch = 
        q.quoteNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        qProjectCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        qProjectId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (q.client.tradeName && q.client.tradeName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (q.workSiteLocation && q.workSiteLocation.toLowerCase().includes(searchQuery.toLowerCase()));

      let matchesStatus = true;
      if (statusFilter === 'Active') {
        matchesStatus = q.status !== QuoteStatus.LOST && q.status !== QuoteStatus.PROJECT;
      } else if (statusFilter !== 'All') {
        matchesStatus = q.status === statusFilter;
      }

      const matchesStage = stageFilter === 'All' || q.projectStage === stageFilter;
      const matchesPricing = pricingFilter === 'All' || q.pricingMethod === pricingFilter;
      const targetProj = projects.find(p => p.id === projectFilter || p.projectCode === projectFilter);
      const matchesProject = projectFilter === 'All' || 
        q.projectId === projectFilter || 
        (q.projectCode && q.projectCode === projectFilter) ||
        (targetProj && (q.projectId === targetProj.id || q.projectCode === targetProj.projectCode || q.projectName === targetProj.projectName));

      return matchesSearch && matchesStatus && matchesStage && matchesPricing && matchesProject;
    }).sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.submittedDate || 0).getTime() - new Date(a.submittedDate || 0).getTime();
      }
      if (sortBy === 'value') {
        const valA = getQuoteTotalBreakdown(a).grandTotal;
        const valB = getQuoteTotalBreakdown(b).grandTotal;
        return valB - valA;
      }
      if (sortBy === 'name') {
        return a.projectName.localeCompare(b.projectName);
      }
      if (sortBy === 'status') {
        return a.status.localeCompare(b.status);
      }
      return 0;
    });
  }, [quotes, searchQuery, statusFilter, stageFilter, pricingFilter, sortBy, projectFilter, projects]);

  // Helper for Status Pills styling
  const getStatusBadge = (status: QuoteStatus) => {
    switch (status) {
      case QuoteStatus.DRAFT:
        return {
          bg: 'bg-slate-50 text-slate-700 border-slate-200/80',
          dot: 'bg-slate-400'
        };
      case QuoteStatus.SITE_VISIT:
        return {
          bg: 'bg-sky-50 text-sky-700 border-sky-200/60',
          dot: 'bg-sky-500'
        };
      case QuoteStatus.INTERNAL_REVIEW:
        return {
          bg: 'bg-purple-50 text-purple-700 border-purple-200/60',
          dot: 'bg-purple-500'
        };
      case QuoteStatus.SENT:
        return {
          bg: 'bg-blue-50 text-blue-700 border-blue-200/60',
          dot: 'bg-blue-500'
        };
      case QuoteStatus.WON:
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
          dot: 'bg-emerald-500'
        };
      case QuoteStatus.LOST:
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-200/60',
          dot: 'bg-rose-500'
        };
      case QuoteStatus.PROJECT:
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-200/60',
          dot: 'bg-amber-500'
        };
      default:
        return {
          bg: 'bg-slate-50 text-slate-600 border-slate-200/80',
          dot: 'bg-slate-400'
        };
    }
  };

  // Pipeline Stepper Steps
  const stepperSteps = [
    { status: QuoteStatus.DRAFT, icon: FileText, label: 'Draft', desc: 'Initial take-off' },
    { status: QuoteStatus.SITE_VISIT, icon: MapPin, label: 'Site Visit', desc: 'Field measurements' },
    { status: QuoteStatus.INTERNAL_REVIEW, icon: Search, label: 'Review', desc: 'Margin approval' },
    { status: QuoteStatus.SENT, icon: Download, label: 'Sent', desc: 'Delivered to client' },
    { status: QuoteStatus.WON, icon: CheckCircle2, label: 'Won', desc: 'Client accepted' },
    { status: QuoteStatus.PROJECT, icon: Layout, label: 'Project', desc: 'Active execution' },
  ];

  // Preset Declarations
  const declarationPresets = [
    {
      title: 'Standard Architectural Glazing',
      text: 'We hereby offer to execute and complete the whole of the works described in the above Bill of Quantities in accordance with the specified drawings, specifications, SLS 107/ASTM standards, and subject to our standard terms and conditions of contract.'
    },
    {
      title: 'Fabrication & Supply Only',
      text: 'Quotation valid for the fabrication and factory-gate supply of aluminium joinery units. Excludes on-site hoisting, installation, perimeter mastic sealing, and civil works unless expressly line-itemed above.'
    },
    {
      title: 'Material Price Fluctuation Clause',
      text: 'Due to ongoing volatility in global aluminium ingot and float glass pricing, rates quoted herein are subject to re-confirmation if official purchase orders are not confirmed within the validity period.'
    }
  ];

  /* ------------------------------------------------------------------------- */
  /*                              LIST / REGISTER VIEW                         */
  /* ------------------------------------------------------------------------- */
  if (mode === 'list') {
    return (
      <div className="space-y-2.5 pb-8 animate-in fade-in duration-300">
        {/* Header - Single Line Ribbon */}
        <header className="bg-white border border-slate-200/80 px-5 py-2.5 rounded-xl flex items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Briefcase size={16} />
            </div>
            <div className="flex items-baseline gap-2 min-w-0">
              <h1 className="text-sm font-bold text-slate-900 whitespace-nowrap">
                Quotation Management
              </h1>
              <span className="text-xs text-slate-500 font-normal truncate hidden sm:inline">
                • Architectural BOQs & estimation studio ({quotes.length} total)
              </span>
            </div>
          </div>

          {/* Action Buttons ONLY */}
          <div className="flex items-center gap-2 shrink-0">
            <ExportActions 
              onExportCSV={() => exportQuotesCSV(filteredQuotes)}
              onExportPDF={() => exportQuotesPDF(filteredQuotes)}
              labelCSV="CSV"
              labelPDF="PDF"
            />

            <button
              onClick={onOpenTemplateManager}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-all shadow-2xs"
            >
              <FileText size={13} className="text-slate-500" />
              <span className="hidden sm:inline">Templates</span> ({templates.length})
            </button>
            <button
              onClick={() => {
                if (quotes.length > 0) {
                  onOpenDownloadPortal({ type: 'Quote', data: quotes[0] });
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-all shadow-2xs"
              title="Batch Export Quotation Records"
            >
              <Download size={13} className="text-slate-500" />
              <span className="hidden sm:inline">Dossier</span>
            </button>
            <button
              onClick={onNewQuote}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-semibold transition-all shadow-2xs"
            >
              <Plus size={13} />
              <span>New Quote</span>
            </button>
          </div>
        </header>

        {/* Master KPI Metrics Banner */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-500">Total Issued</span>
              <span className="p-1.5 bg-slate-50 text-slate-600 rounded-lg border border-slate-100">
                <FileText size={13} />
              </span>
            </div>
            <div className="mt-2">
              <span className="text-lg font-bold font-mono text-slate-900">{kpis.totalCount}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {companySettings.defaultCurrency} {kpis.totalPipelineValue.toLocaleString(undefined, { maximumFractionDigits: 0 })} Gross
              </span>
            </div>
          </div>

          <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-emerald-700">Won & Converted</span>
              <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
                <CheckCircle2 size={13} />
              </span>
            </div>
            <div className="mt-2">
              <span className="text-lg font-bold font-mono text-emerald-600">
                {companySettings.defaultCurrency} {kpis.wonValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
              <div className="flex items-center gap-1 text-[10px] text-emerald-600 mt-0.5 font-medium">
                <TrendingUp size={11} />
                <span>{kpis.winRate.toFixed(1)}% Win Rate</span>
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-blue-700">Active Pipeline</span>
              <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
                <Clock size={13} />
              </span>
            </div>
            <div className="mt-2">
              <span className="text-lg font-bold font-mono text-blue-600">
                {companySettings.defaultCurrency} {kpis.activeValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {kpis.activeCount} quotations pending
              </span>
            </div>
          </div>

          <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-500">Average Contract</span>
              <span className="p-1.5 bg-slate-50 text-slate-600 rounded-lg border border-slate-100">
                <DollarSign size={13} />
              </span>
            </div>
            <div className="mt-2">
              <span className="text-lg font-bold font-mono text-slate-900">
                {companySettings.defaultCurrency} {kpis.avgDealSize.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Per bid estimate</span>
            </div>
          </div>

          <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-xs col-span-2 md:col-span-1 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-500">Avg. Turnaround</span>
              <span className="p-1.5 bg-orange-50 text-orange-600 rounded-lg border border-orange-100">
                <Sparkles size={13} />
              </span>
            </div>
            <div className="mt-2">
              <span className="text-lg font-bold font-mono text-orange-600">2.4 Days</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">SLS / ASTM compliant</span>
            </div>
          </div>
        </div>

        {/* Filter & Search Controls Bar */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Search by Quotation # (PK), Project Code (FK), Client, Title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Dropdown Filters & Layout Toggle */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Stage Filter */}
              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value as any)}
                className="text-xs bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-2 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-orange-500"
              >
                <option value="All">All Stages</option>
                <option value="Budgetary">Budgetary</option>
                <option value="Detailed BOQ">Detailed BOQ</option>
                <option value="Final">Final</option>
                <option value="Revised">Revised</option>
                <option value="Variation">Variation</option>
              </select>

              {/* Pricing Filter */}
              <select
                value={pricingFilter}
                onChange={(e) => setPricingFilter(e.target.value as any)}
                className="text-xs bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-2 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-orange-500"
              >
                <option value="All">All Pricing Methods</option>
                <option value="Unit Rate">Unit Rate</option>
                <option value="Fixed Price">Fixed Price</option>
                <option value="Lump Sum">Lump Sum</option>
                <option value="Cost Plus">Cost Plus</option>
                <option value="Time & Material">Time & Material</option>
              </select>

              {/* Project Foreign Key Filter */}
              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="text-xs bg-orange-50/60 border border-orange-200/80 rounded-xl px-2.5 py-2 font-semibold text-orange-900 focus:outline-none focus:ring-1 focus:ring-orange-500"
                title="Filter by Project Code (Foreign Key)"
              >
                <option value="All">All Projects (FK)</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>
                    [{p.projectCode || p.id.slice(0, 8)}] {p.projectName}
                  </option>
                ))}
              </select>

              {/* Sort By */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-xs bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-2 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-orange-500"
              >
                <option value="date">Newest First</option>
                <option value="value">Highest Value</option>
                <option value="name">Project Name</option>
                <option value="status">Status</option>
              </select>

              {/* Grid / Table View Switcher */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/80">
                <button
                  onClick={() => setViewMode('cards')}
                  className={cn(
                    "px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1",
                    viewMode === 'cards' ? "bg-white text-slate-900 shadow-2xs font-semibold" : "text-slate-500 hover:text-slate-900"
                  )}
                  title="Card Grid View"
                >
                  <Layout size={13} />
                  <span className="hidden sm:inline">Cards</span>
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={cn(
                    "px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1",
                    viewMode === 'table' ? "bg-white text-slate-900 shadow-2xs font-semibold" : "text-slate-500 hover:text-slate-900"
                  )}
                  title="Tabular View"
                >
                  <SlidersHorizontal size={13} />
                  <span className="hidden sm:inline">Table</span>
                </button>
              </div>
            </div>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 border-t border-slate-100 no-scrollbar">
            {(['All', 'Active', ...Object.values(QuoteStatus)] as const).map((status) => {
              const count = status === 'All' 
                ? quotes.length 
                : status === 'Active'
                ? quotes.filter(q => q.status !== QuoteStatus.LOST && q.status !== QuoteStatus.PROJECT).length
                : quotes.filter(q => q.status === status).length;

              const isSelected = statusFilter === status;

              return (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status as any)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0",
                    isSelected
                      ? "bg-slate-900 text-white font-semibold shadow-2xs"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  <span>{status}</span>
                  <span className={cn(
                    "px-1.5 py-0.2 rounded-full text-[9px] font-mono",
                    isSelected ? "bg-slate-800 text-white" : "bg-slate-200/80 text-slate-600"
                  )}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content: Cards View */}
        {viewMode === 'cards' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
            {filteredQuotes.map((q) => {
              const totals = getQuoteTotalBreakdown(q);
              const badge = getStatusBadge(q.status);
              const isWon = q.status === QuoteStatus.WON;
              const hasProject = projects.some(p => p.quoteId === q.id);

              return (
                <div 
                  key={q.id}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between overflow-hidden group"
                >
                  <div className="p-4 space-y-3">
                    {/* Top Row: Ref, Status, Stage */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-xs font-bold text-slate-900 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/80">
                          {q.quoteNo}
                        </span>
                        {q.version > 1 && (
                          <span className="text-[10px] font-mono text-slate-400">v{q.version}</span>
                        )}
                        {(q.projectId || q.projectCode) && (
                          <span className="font-mono text-[10px] font-bold text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-200/70 flex items-center gap-1" title={`Linked to Project ${q.projectId}`}>
                            <Folder size={10} className="text-orange-500" />
                            <span>{q.projectCode || q.projectId?.slice(0, 8)}</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <select
                          value={q.status}
                          onChange={(e) => onUpdateQuoteStatus(q.id, e.target.value as QuoteStatus)}
                          className={cn(
                            "text-[10px] font-medium border rounded-full px-2 py-0.5 cursor-pointer focus:outline-none focus:ring-1 focus:ring-orange-500",
                            badge.bg
                          )}
                        >
                          {Object.values(QuoteStatus).map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Project Title & Client Details */}
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 line-clamp-1 group-hover:text-orange-600 transition-colors">
                        {q.projectName}
                      </h3>
                      <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                        <User size={12} className="text-slate-400 shrink-0" />
                        <span className="font-medium text-slate-700 truncate">{q.client.name}</span>
                        {q.client.tradeName && (
                          <span className="text-slate-400 text-[11px] truncate">({q.client.tradeName})</span>
                        )}
                      </div>
                      {q.workSiteLocation && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                          <MapPin size={11} className="shrink-0" />
                          <span className="truncate">{q.workSiteLocation}</span>
                        </div>
                      )}
                    </div>

                    {/* Meta Badges */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      <span className="text-[10px] px-2 py-0.5 bg-slate-50 text-slate-600 rounded-md border border-slate-100 font-medium">
                        {q.projectStage || 'Detailed BOQ'}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 bg-slate-50 text-slate-600 rounded-md border border-slate-100 font-medium">
                        {q.pricingMethod || 'Unit Rate'}
                      </span>
                      {q.scopeCoverage && (
                        <span className="text-[10px] px-2 py-0.5 bg-orange-50/70 text-orange-700 rounded-md border border-orange-100 font-medium">
                          {q.scopeCoverage}
                        </span>
                      )}
                    </div>

                    {/* Value & BOQ Summary */}
                    <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">Contract Value</span>
                        <div className="text-sm font-bold font-mono text-slate-900 mt-0.5">
                          <span className="text-xs text-slate-500 font-normal mr-1">{q.currency}</span>
                          {totals.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">Scope</span>
                        <span className="text-xs font-semibold text-slate-700 font-mono mt-0.5 block">
                          {q.items.length} BOQ Lines
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="px-4 py-3 bg-white border-t border-slate-100 flex items-center justify-between gap-1.5">
                    <button
                      onClick={() => onEditQuote(q)}
                      className="flex-1 py-1.5 px-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-medium transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                    >
                      <Edit2 size={12} />
                      <span>Edit & Estimate</span>
                    </button>

                    {isWon && !hasProject && (
                      <button
                        onClick={() => {
                          if (onActivateProject) {
                            onActivateProject(q.id);
                          } else {
                            onUpdateQuoteStatus(q.id, QuoteStatus.PROJECT);
                          }
                        }}
                        className="py-1.5 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-medium transition-colors flex items-center gap-1 shadow-2xs"
                        title="Convert to Live Project"
                      >
                        <Briefcase size={12} />
                        <span className="hidden sm:inline">Project</span>
                      </button>
                    )}

                    <button
                      onClick={() => onDuplicateQuote(q)}
                      className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
                      title="Duplicate Quote"
                    >
                      <Copy size={13} />
                    </button>

                    <button
                      onClick={() => onOpenDownloadPortal({ type: 'Quote', data: q })}
                      className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
                      title="Download PDF"
                    >
                      <Download size={13} />
                    </button>

                    <button
                      onClick={() => setQuoteToDelete(q.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                      title="Delete Quote"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredQuotes.length === 0 && (
              <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                <FileText size={36} className="mx-auto text-slate-300 mb-3" />
                <h3 className="text-sm font-semibold text-slate-900">No quotations found</h3>
                <p className="text-slate-500 text-xs mt-1">Try adjusting your search terms or filters to find what you need.</p>
                <div className="mt-4 flex items-center justify-center gap-2">
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('All');
                      setStageFilter('All');
                      setPricingFilter('All');
                    }}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition-colors"
                  >
                    Reset Filters
                  </button>
                  <button
                    onClick={onNewQuote}
                    className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-medium transition-colors"
                  >
                    + Create Quotation
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Content: Enterprise Data Table / List View */}
        {viewMode === 'table' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[10px] font-bold text-slate-600 uppercase tracking-wider select-none whitespace-nowrap">
                    <th className="py-2.5 px-3">Quotation # (PK)</th>
                    <th className="py-2.5 px-3">Project ID (FK)</th>
                    <th className="py-2.5 px-3">Project Title</th>
                    <th className="py-2.5 px-3">Client Account</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Stage</th>
                    <th className="py-2.5 px-3 text-center">Items</th>
                    <th className="py-2.5 px-3 text-right">Contract Sum</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredQuotes.map((q) => {
                    const totals = getQuoteTotalBreakdown(q);
                    const badge = getStatusBadge(q.status);
                    const resolvedProj = projects.find(p => p.id === q.projectId || (q.projectCode && p.projectCode === q.projectCode) || p.projectName === q.projectName);
                    const pCode = q.projectCode || resolvedProj?.projectCode || (q.projectId ? q.projectId.slice(0, 10) : null);

                    return (
                      <tr key={q.id} className="hover:bg-slate-50/70 transition-colors whitespace-nowrap">
                        {/* PK: Quotation Number (Primary ID) */}
                        <td className="py-2.5 px-3">
                          <button
                            onClick={() => onEditQuote(q)}
                            className="font-mono font-bold text-xs text-slate-900 bg-slate-100 hover:bg-orange-50 hover:text-orange-600 px-2 py-0.5 rounded border border-slate-200/80 transition-colors inline-flex items-center gap-1.5 shadow-2xs"
                            title="Primary Key: Quotation Number (Click to Edit)"
                          >
                            <FileText size={12} className="text-orange-500 shrink-0" />
                            <span>PK: {q.quoteNo}</span>
                          </button>
                        </td>

                        {/* FK: Project Number / Code (Foreign Key) */}
                        <td className="py-2.5 px-3">
                          {pCode ? (
                            <button
                              onClick={() => {
                                const matchingProj = projects.find(p => p.id === q.projectId || p.projectCode === pCode);
                                if (matchingProj) {
                                  setProjectFilter(matchingProj.id);
                                  toast.info(`Filtered quotes by project: ${pCode}`);
                                }
                              }}
                              className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-orange-700 bg-orange-50 hover:bg-orange-100 px-2 py-0.5 rounded border border-orange-200/80 transition-colors shadow-2xs"
                              title={`Foreign Key: Project Code ${pCode} (Click to filter quotes)`}
                            >
                              <Folder size={11} className="text-orange-500 shrink-0" />
                              <span>FK: {pCode}</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">FK: None</span>
                          )}
                        </td>

                        {/* Project Title (Single Line) */}
                        <td className="py-2 px-3 max-w-[220px]">
                          <span className="font-semibold text-slate-900 truncate block" title={q.projectName}>
                            {q.projectName}
                          </span>
                        </td>

                        {/* Client Account (Single Line) */}
                        <td className="py-2 px-3 max-w-[170px]">
                          <span className="font-medium text-slate-700 truncate block" title={q.client.name}>
                            {q.client.name}
                          </span>
                        </td>

                        {/* Submitted Date */}
                        <td className="py-2 px-3 font-mono text-[11px] text-slate-500">
                          {q.submittedDate || 'Draft'}
                        </td>

                        {/* Stage */}
                        <td className="py-2 px-3">
                          <span className="inline-block text-[10px] font-medium px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                            {q.projectStage}
                          </span>
                        </td>

                        {/* Items count */}
                        <td className="py-2 px-3 text-center font-mono text-[11px] text-slate-500">
                          {q.items.length}
                        </td>

                        {/* Contract Sum */}
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                          {q.currency} {totals.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>

                        {/* Status dropdown */}
                        <td className="py-2 px-3 text-center">
                          <select
                            value={q.status}
                            onChange={(e) => onUpdateQuoteStatus(q.id, e.target.value as QuoteStatus)}
                            className={cn(
                              "text-[10px] font-semibold border rounded-full px-2.5 py-0.5 cursor-pointer focus:outline-none focus:ring-1 focus:ring-orange-500",
                              badge.bg
                            )}
                          >
                            {Object.values(QuoteStatus).map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </td>

                        {/* Actions */}
                        <td className="py-2 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => onEditQuote(q)}
                              className="p-1.5 text-slate-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                              title="Edit Quote"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => onDuplicateQuote(q)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Duplicate Quote"
                            >
                              <Copy size={13} />
                            </button>
                            <button
                              onClick={() => onOpenDownloadPortal({ type: 'Quote', data: q })}
                              className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Download PDF"
                            >
                              <Download size={13} />
                            </button>
                            <button
                              onClick={() => setQuoteToDelete(q.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Delete Quote"
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
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <ConfirmationModal
          isOpen={!!quoteToDelete}
          onClose={() => setQuoteToDelete(null)}
          onConfirm={() => {
            if (quoteToDelete) {
              onDeleteQuote(quoteToDelete);
              setQuoteToDelete(null);
            }
          }}
          title="Delete Quotation"
          message="Are you sure you want to delete this quotation? This action will permanently remove all BOQ line items and calculation sheets."
          confirmText="Delete Quotation"
          type="danger"
        />
      </div>
    );
  }

  /* ------------------------------------------------------------------------- */
  /*                              STUDIO / EDITOR VIEW                         */
  /* ------------------------------------------------------------------------- */
  return (
    <div className="space-y-2.5 pb-8 animate-in fade-in duration-300">
      {/* Studio Header Bar - Single Line Ribbon */}
      <header className="bg-white border border-slate-200/80 px-5 py-2.5 rounded-xl flex items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={onBackToList}
            className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200/80 rounded-lg transition-colors shadow-2xs shrink-0"
            title="Back to Quotation Register"
          >
            <ArrowLeft size={14} />
          </button>
          <div className="flex items-baseline gap-2 min-w-0">
            <h1 className="text-sm font-bold text-slate-900 whitespace-nowrap">
              {quote.quoteNo || 'New Draft'}
            </h1>
            <span className="text-xs text-slate-500 font-normal truncate hidden sm:inline">
              • {quote.projectName || 'Quotation Studio & Estimator'}
            </span>
          </div>
        </div>

        {/* Header Action Tools ONLY */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Status Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200/80">
            <span className="text-[10px] font-medium text-slate-500">Status:</span>
            <select
              value={quote.status}
              onChange={(e) => onUpdateQuote({ ...quote, status: e.target.value as QuoteStatus })}
              className="text-xs font-semibold bg-transparent border-0 cursor-pointer focus:ring-0 text-slate-800 p-0"
            >
              {Object.values(QuoteStatus).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Template Dropdowns */}
          <button
            onClick={onOpenTemplateManager}
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold transition-all shadow-2xs"
          >
            <FileText size={13} className="text-slate-500" />
            <span>Apply Template</span>
          </button>

          <button
            onClick={onOpenSaveTemplateModal}
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold transition-all shadow-2xs"
          >
            <Save size={13} className="text-slate-500" />
            <span>Save Template</span>
          </button>

          {/* PDF Layout Selector */}
          <div className="hidden sm:flex items-center gap-1.5 bg-white border border-slate-200 px-2 py-1 rounded-lg shadow-2xs">
            <Layout size={13} className="text-slate-400" />
            <select
              value={selectedLayout}
              onChange={(e) => onSetSelectedLayout(e.target.value as PdfLayout)}
              className="text-xs font-semibold bg-transparent border-0 cursor-pointer focus:ring-0 text-slate-700 p-0"
            >
              <option value="Detailed">Detailed BOQ</option>
              <option value="Compact">Compact Summary</option>
              <option value="Summary">Budgetary Only</option>
              <option value="Executive">Executive Scope</option>
            </select>
          </div>

          {/* Download & Save Buttons */}
          <button
            onClick={() => onOpenDownloadPortal({ type: 'Quote', data: quote })}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold transition-all shadow-2xs"
          >
            <Download size={13} className="text-slate-500" />
            <span className="hidden sm:inline">Download</span>
          </button>

          <button
            onClick={onSaveQuote}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-semibold transition-all shadow-2xs"
          >
            <CheckCircle2 size={13} />
            <span>Save</span>
          </button>
        </div>
      </header>

      {/* Interactive Pipeline Stepper */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between max-w-4xl mx-auto relative px-4">
          <div className="absolute top-4 left-8 right-8 h-0.5 bg-slate-100 -z-0" />
          
          {stepperSteps.map((step, idx, arr) => {
            const isCompleted = arr.findIndex(s => s.status === quote.status) >= idx;
            const isCurrent = quote.status === step.status;

            return (
              <div
                key={step.status}
                onClick={() => onUpdateQuote({ ...quote, status: step.status })}
                className="flex flex-col items-center gap-1.5 relative z-10 cursor-pointer group"
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center transition-all border-2",
                  isCurrent 
                    ? "bg-orange-500 border-orange-500 text-white shadow-md shadow-orange-500/30 scale-105"
                    : isCompleted 
                    ? "bg-slate-900 border-slate-900 text-white" 
                    : "bg-white border-slate-200 text-slate-400 group-hover:border-slate-300"
                )}>
                  <step.icon size={13} />
                </div>
                <div className="text-center">
                  <span className={cn(
                    "text-[11px] font-semibold block",
                    isCurrent ? "text-orange-600 font-bold" : isCompleted ? "text-slate-900" : "text-slate-400"
                  )}>
                    {step.label}
                  </span>
                  <span className="text-[9px] text-slate-400 hidden sm:block">
                    {step.desc}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Studio Navigation Tabs */}
      <div className="flex bg-white p-1 rounded-2xl border border-slate-200/80 shadow-xs">
        <button
          onClick={() => setEditorTab('form')}
          className={cn(
            "flex-1 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2",
            editorTab === 'form' 
              ? "bg-slate-900 text-white shadow-2xs" 
              : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
          )}
        >
          <FileText size={14} />
          <span>BOQ & Commercial Terms</span>
        </button>
        <button
          onClick={() => setEditorTab('timeline')}
          className={cn(
            "flex-1 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2",
            editorTab === 'timeline' 
              ? "bg-slate-900 text-white shadow-2xs" 
              : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
          )}
        >
          <Calendar size={14} />
          <span>Project Timeline & Milestones</span>
        </button>
        <button
          onClick={() => setEditorTab('preview')}
          className={cn(
            "flex-1 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2",
            editorTab === 'preview' 
              ? "bg-slate-900 text-white shadow-2xs" 
              : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
          )}
        >
          <Layout size={14} />
          <span>Document Live Preview</span>
        </button>
      </div>

      {/* Main Studio Views */}
      {editorTab === 'form' && (
        <div className="space-y-4">
          {/* Card 1: Project Information */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-orange-50 text-orange-600 rounded-lg border border-orange-100">
                  <Layout size={14} />
                </span>
                <h2 className="font-semibold text-sm text-slate-900">Project Information</h2>
              </div>
              <span className="text-[11px] font-mono text-slate-400">Ref: {quote.quoteNo}</span>
            </div>

            {/* Parent Project Linkage (Primary Key / Foreign Key) */}
            <div className="p-3.5 bg-orange-50/60 rounded-xl border border-orange-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-2xs font-mono font-bold text-xs">
                  <Folder size={15} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">Parent Project Linkage</span>
                    <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-orange-100 text-orange-800 border border-orange-200">
                      Foreign Key: Project ID
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Connect this quotation to a project card. Client details, site address, and past BOQ items will auto-sync.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <select
                  value={quote.projectId || projects.find(p => p.projectName === quote.projectName)?.id || ''}
                  onChange={(e) => {
                    const selId = e.target.value;
                    const p = projects.find(proj => proj.id === selId);
                    if (p) {
                      onUpdateQuote({
                        ...quote,
                        projectId: p.id,
                        projectCode: p.projectCode || p.id,
                        projectName: p.projectName,
                        client: { ...p.client },
                        workSiteLocation: p.siteAddress || p.client.address || p.projectName,
                        items: quote.items.length === 0 && p.items && p.items.length > 0 
                          ? p.items.map(it => ({ ...it, id: crypto.randomUUID(), variationStatus: 'Original' }))
                          : quote.items,
                        terms: p.terms || quote.terms,
                        paymentTiers: p.paymentTiers || quote.paymentTiers
                      });
                      toast.success(`Connected to Project ${p.projectCode || p.projectName}!`, {
                        description: 'Client details and site location auto-populated.'
                      });
                    } else {
                      onUpdateQuote({
                        ...quote,
                        projectId: undefined,
                        projectCode: undefined
                      });
                    }
                  }}
                  className="text-xs font-semibold bg-white border border-orange-200 rounded-xl px-3 py-2 text-slate-800 shadow-2xs focus:outline-none focus:border-orange-500 cursor-pointer min-w-[240px]"
                >
                  <option value="">-- No Project Linked (Independent Draft) --</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>
                      [{p.projectCode || p.id.slice(0, 8)}] {p.projectName} ({p.client?.name})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Project Title</label>
                <input
                  type="text"
                  value={quote.projectName ?? ''}
                  onChange={(e) => onUpdateQuote({ ...quote, projectName: e.target.value })}
                  placeholder="e.g. Grand Hyatt Tower B Structural Glazing"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Work Site Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                  <input
                    type="text"
                    value={quote.workSiteLocation ?? ''}
                    onChange={(e) => onUpdateQuote({ ...quote, workSiteLocation: e.target.value })}
                    placeholder="e.g. Galle Face, Colombo 03"
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Sales Representative / Estimator</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                  <input
                    type="text"
                    value={quote.salesRepresentative ?? ''}
                    onChange={(e) => onUpdateQuote({ ...quote, salesRepresentative: e.target.value })}
                    placeholder="e.g. John Doe (Lead Estimator)"
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Pricing Method</label>
                <select
                  value={quote.pricingMethod}
                  onChange={(e) => onUpdateQuote({ ...quote, pricingMethod: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all cursor-pointer"
                >
                  <option value="Fixed Price">Fixed Price</option>
                  <option value="Unit Rate">Unit Rate</option>
                  <option value="Time & Material">Time & Material</option>
                  <option value="Cost Plus">Cost Plus (%)</option>
                  <option value="Lump Sum">Lump Sum</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Project Stage</label>
                <select
                  value={quote.projectStage}
                  onChange={(e) => onUpdateQuote({ ...quote, projectStage: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all cursor-pointer"
                >
                  <option value="Budgetary">Budgetary (Preliminary)</option>
                  <option value="Detailed BOQ">Detailed BOQ</option>
                  <option value="Final">Final Quotation</option>
                  <option value="Revised">Revised Quotation</option>
                  <option value="Variation">Variation Quotation</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Scope Coverage</label>
                <select
                  value={quote.scopeCoverage}
                  onChange={(e) => onUpdateQuote({ ...quote, scopeCoverage: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all cursor-pointer"
                >
                  <option value="Supply Only">Supply Only</option>
                  <option value="Labor Only">Labor Only</option>
                  <option value="Supply & Install">Supply & Install</option>
                  <option value="Turnkey">Turnkey Project</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Submitted Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                  <input
                    type="date"
                    value={quote.submittedDate ?? ''}
                    onChange={(e) => onUpdateQuote({ ...quote, submittedDate: e.target.value })}
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Validity (Days)</label>
                <input
                  type="number"
                  value={quote.validityDays ?? 30}
                  onChange={(e) => {
                    const days = parseInt(e.target.value) || 0;
                    const validUntil = new Date(new Date(quote.submittedDate).getTime() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                    onUpdateQuote({ ...quote, validityDays: days, validUntil });
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Currency</label>
                <select
                  value={quote.currency}
                  onChange={(e) => onUpdateQuote({ ...quote, currency: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all cursor-pointer"
                >
                  {companySettings.currencies.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Conditional Fields */}
            {(quote.pricingMethod === 'Cost Plus' || quote.pricingMethod === 'Lump Sum' || quote.projectStage === 'Budgetary' || quote.projectStage === 'Revised' || quote.projectStage === 'Variation') && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                {quote.pricingMethod === 'Cost Plus' && (
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700">Cost Plus Margin (%)</label>
                    <input
                      type="number"
                      value={quote.marginPercent ?? 0}
                      onChange={(e) => onUpdateQuote({ ...quote, marginPercent: parseFloat(e.target.value) || 0 })}
                      placeholder="e.g. 15"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all"
                    />
                  </div>
                )}

                {quote.pricingMethod === 'Lump Sum' && (
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700">Lump Sum Contract Value</label>
                    <input
                      type="number"
                      value={quote.lumpSumAmount ?? 0}
                      onChange={(e) => onUpdateQuote({ ...quote, lumpSumAmount: parseFloat(e.target.value) || 0 })}
                      placeholder="e.g. 1500000"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all"
                    />
                  </div>
                )}

                {quote.projectStage === 'Budgetary' && (
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700">Confidence Factor (%)</label>
                    <input
                      type="number"
                      value={quote.confidenceLevel ?? 80}
                      onChange={(e) => onUpdateQuote({ ...quote, confidenceLevel: parseFloat(e.target.value) || 0 })}
                      placeholder="e.g. 85"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all"
                    />
                  </div>
                )}

                {(quote.projectStage === 'Revised' || quote.projectStage === 'Variation') && (
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-medium text-slate-700">Variation Justification / Engineering Rationale</label>
                    <textarea
                      value={quote.justification ?? ''}
                      onChange={(e) => onUpdateQuote({ ...quote, justification: e.target.value })}
                      placeholder="Detail architectural changes, wind-load alterations, or omitted panels..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all min-h-[70px] resize-none"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Card 2: Client Particulars */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-orange-50 text-orange-600 rounded-lg border border-orange-100">
                  <User size={14} />
                </span>
                <h2 className="font-semibold text-sm text-slate-900">Client Details & Tender Contact</h2>
              </div>
              
              <div className="flex items-center gap-2">
                <select
                  value={quote.client.id || ''}
                  onChange={(e) => {
                    const c = clients.find(cl => cl.id === e.target.value);
                    if (c) {
                      onUpdateQuote({ ...quote, client: { ...c } });
                    }
                  }}
                  className="text-xs font-medium bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1.5 cursor-pointer focus:outline-none focus:ring-1 focus:ring-orange-500"
                >
                  <option value="">Load Registered Client</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>

                <button
                  onClick={() => {
                    const saved = onSaveClient(quote.client);
                    onUpdateQuote({ ...quote, client: saved });
                  }}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition-colors flex items-center gap-1 shadow-2xs"
                  title="Save or update this client profile in the directory"
                >
                  <Save size={12} />
                  <span>Save Client</span>
                </button>
              </div>
            </div>

            {/* Link to Existing Project for Variations */}
            {(quote.projectStage === 'Variation' || quote.projectStage === 'Revised') && (
              <div className="p-3 bg-orange-50/50 rounded-xl border border-orange-200/60 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-orange-800">
                  <Info size={14} className="shrink-0" />
                  <span>Link to Live Project (Auto-populate specifications and past BOQs):</span>
                </div>
                <select
                  value={projects.find(p => p.projectName === quote.projectName)?.id || ''}
                  onChange={(e) => {
                    const p = projects.find(proj => proj.id === e.target.value);
                    if (p) {
                      onUpdateQuote({
                        ...quote,
                        projectName: p.projectName,
                        client: { ...p.client },
                        workSiteLocation: p.projectName,
                        items: p.items.map(item => ({ ...item, id: crypto.randomUUID(), variationStatus: 'Original' })),
                        terms: p.terms || quote.terms,
                        paymentTiers: p.paymentTiers || quote.paymentTiers
                      });
                    }
                  }}
                  className="text-xs bg-white border border-orange-200 rounded-xl px-3 py-1.5 font-medium text-slate-800"
                >
                  <option value="">Select Project</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.projectName} ({p.client?.name})</option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Legal Client Name / Purchaser</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                  <input
                    type="text"
                    value={quote.client?.name ?? ''}
                    onChange={(e) => onUpdateQuote({ ...quote, client: { ...quote.client, name: e.target.value } })}
                    placeholder="e.g. John Doe / Access Engineering PLC"
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Trade Name / Enterprise Entity</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                  <input
                    type="text"
                    value={quote.client?.tradeName ?? ''}
                    onChange={(e) => onUpdateQuote({ ...quote, client: { ...quote.client, tradeName: e.target.value } })}
                    placeholder="e.g. Hyatt Hotels Lanka (Pvt) Ltd"
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Telephone / Mobile</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                  <input
                    type="text"
                    value={quote.client.phone ?? ''}
                    onChange={(e) => onUpdateQuote({ ...quote, client: { ...quote.client, phone: e.target.value } })}
                    placeholder="e.g. +94 11 234 5678"
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Official Tender Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                  <input
                    type="email"
                    value={quote.client.email ?? ''}
                    onChange={(e) => onUpdateQuote({ ...quote, client: { ...quote.client, email: e.target.value } })}
                    placeholder="e.g. procurement@hyatt.com"
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Tax / VAT Registration No.</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                  <input
                    type="text"
                    value={quote.client.taxNo ?? ''}
                    onChange={(e) => onUpdateQuote({ ...quote, client: { ...quote.client, taxNo: e.target.value } })}
                    placeholder="e.g. VAT10293847-7000"
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Purchaser Billing / Work Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                  <input
                    type="text"
                    value={quote.client.address ?? ''}
                    onChange={(e) => onUpdateQuote({ ...quote, client: { ...quote.client, address: e.target.value } })}
                    placeholder="e.g. No. 45, High Level Road, Colombo"
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Bill of Quantities (BOQTable) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <BOQTable 
              items={quote.items} 
              currency={quote.currency}
              onChange={(items) => onUpdateQuote({ ...quote, items })} 
              onAddItem={onAddItem}
              onMoveItem={onMoveItem}
              onDeleteItem={onDeleteItem}
              onDuplicateItem={onDuplicateItem}
              onInsertItem={onInsertItem}
              onOpenCatalog={onOpenCatalog}
              onSaveAsTemplate={onSaveAsTemplate}
              onGeneratePVC={generatePVCForBOQItem}
            />
          </div>

          {/* Card 4: Declaration & Specifications Note */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-orange-50 text-orange-600 rounded-lg border border-orange-100">
                  <FileText size={14} />
                </span>
                <h2 className="font-semibold text-sm text-slate-900">Formal Quotation Declaration & Cover Note</h2>
              </div>
              <div className="flex items-center gap-1.5">
                {declarationPresets.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => onUpdateQuote({ ...quote, declaration: preset.text })}
                    className="px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-[10px] font-medium border border-slate-200/80 transition-colors"
                  >
                    {preset.title}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              value={quote.declaration ?? ''}
              onChange={(e) => onUpdateQuote({ ...quote, declaration: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all min-h-[90px] resize-none"
              placeholder="Provide contractual assurances, compliance statements, or quotation validity guarantees..."
            />
          </div>

          {/* Card 5: Contractual Terms & Conditions */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <TermsEditor 
              terms={quote.terms} 
              onChange={(terms) => onUpdateQuote({ ...quote, terms })} 
            />
          </div>

          {/* Card 6: Precision Financial Summary & Milestone Schedule */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Financial Ledger & Payment Milestones */}
            <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-orange-50 text-orange-600 rounded-lg border border-orange-100">
                    <CreditCard size={14} />
                  </span>
                  <h2 className="font-semibold text-sm text-slate-900">Commercial Summary & Deductions</h2>
                </div>
                <span className="text-xs font-mono font-bold text-slate-900">
                  {quote.currency}
                </span>
              </div>

              {/* Subtotal & Discounts */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">BOQ Sub Total</span>
                  <span className="font-mono font-bold text-slate-900">
                    {subTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-xs font-medium text-slate-700 block">Commercial Discount (%)</span>
                    <span className="text-[10px] text-slate-400">Negotiated bid rebate</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-200">
                      <Percent size={11} className="text-slate-400" />
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={quote.discountPercent ?? 0}
                        onChange={(e) => onUpdateQuote({ ...quote, discountPercent: parseFloat(e.target.value) || 0 })}
                        className="w-12 bg-transparent text-right font-mono text-xs font-bold text-slate-900 focus:outline-none"
                      />
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-600">
                      - {discountAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Additional Project Charges */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-slate-700">Ancillary Surcharges</span>
                    <button
                      onClick={() => {
                        const name = prompt('Enter charge title (e.g. Scaffolding, Mobile Crane, Structural Report):');
                        if (name) {
                          onUpdateQuote({
                            ...quote,
                            additionalCharges: [...quote.additionalCharges, { id: crypto.randomUUID(), name, amount: 0 }]
                          });
                        }
                      }}
                      className="text-[10px] bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-md font-medium text-slate-700 transition-colors"
                    >
                      + Add Surcharge
                    </button>
                  </div>

                  {quote.additionalCharges.map((charge) => (
                    <div key={charge.id} className="flex items-center justify-between gap-2 p-2 bg-slate-50 rounded-xl border border-slate-100">
                      <input
                        type="text"
                        value={charge.name}
                        onChange={(e) => {
                          const updated = quote.additionalCharges.map(c => 
                            c.id === charge.id ? { ...c, name: e.target.value } : c
                          );
                          onUpdateQuote({ ...quote, additionalCharges: updated });
                        }}
                        className="bg-transparent text-xs font-medium text-slate-800 flex-1 focus:outline-none"
                      />
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 font-mono">{quote.currency}</span>
                        <input
                          type="number"
                          value={charge.amount}
                          onChange={(e) => {
                            const updated = quote.additionalCharges.map(c => 
                              c.id === charge.id ? { ...c, amount: parseFloat(e.target.value) || 0 } : c
                            );
                            onUpdateQuote({ ...quote, additionalCharges: updated });
                          }}
                          className="w-24 bg-white border border-slate-200 rounded-lg px-2 py-0.5 text-right text-xs font-mono font-bold text-slate-900 focus:outline-none"
                        />
                        <button
                          onClick={() => {
                            const updated = quote.additionalCharges.filter(c => c.id !== charge.id);
                            onUpdateQuote({ ...quote, additionalCharges: updated });
                          }}
                          className="text-slate-400 hover:text-rose-600 transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Tax / VAT Toggle */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-medium text-slate-700 block">Value Added Tax (VAT)</span>
                      <span className="text-[10px] text-slate-400">
                        {quote.isTaxInclusive ? 'Inclusive in unit rates' : 'Exclusive (added at settlement)'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => onUpdateQuote({ ...quote, isTaxInclusive: !quote.isTaxInclusive })}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors",
                          quote.isTaxInclusive 
                            ? "bg-slate-900 text-white border-slate-900" 
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        )}
                      >
                        {quote.isTaxInclusive ? 'Tax Inclusive' : 'Tax Exclusive'}
                      </button>

                      {!quote.isTaxInclusive && (
                        <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
                          <Percent size={11} className="text-slate-400" />
                          <input
                            type="number"
                            value={quote.taxPercent ?? 0}
                            onChange={(e) => onUpdateQuote({ ...quote, taxPercent: parseFloat(e.target.value) || 0 })}
                            className="w-10 bg-transparent text-right font-mono text-xs font-bold text-slate-900 focus:outline-none"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {!quote.isTaxInclusive && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-medium">Calculated VAT Sum</span>
                      <span className="font-mono font-bold text-slate-800">
                        {quote.currency} {taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Payment Milestone Schedule & Total Card */}
            <div className="lg:col-span-6 space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-orange-50 text-orange-600 rounded-lg border border-orange-100">
                      <Calendar size={14} />
                    </span>
                    <h2 className="font-semibold text-sm text-slate-900">Payment Tiers & Schedule</h2>
                  </div>
                  <button
                    onClick={() => {
                      const phase = prompt('Milestone Title (e.g. Mobilization Advance, Glass Delivery, Testing, Handover):');
                      if (phase) {
                        onUpdateQuote({
                          ...quote,
                          paymentTiers: [
                            ...(quote.paymentTiers || []),
                            { id: crypto.randomUUID(), phase, percentage: 0, amount: 0, status: 'Pending' }
                          ]
                        });
                      }
                    }}
                    className="text-xs px-2.5 py-1 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg font-medium transition-colors"
                  >
                    + Add Milestone
                  </button>
                </div>

                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {(quote.paymentTiers || []).map((tier) => (
                    <div key={tier.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between gap-3">
                      <input
                        type="text"
                        value={tier.phase}
                        onChange={(e) => {
                          const updated = quote.paymentTiers?.map(t => 
                            t.id === tier.id ? { ...t, phase: e.target.value } : t
                          );
                          onUpdateQuote({ ...quote, paymentTiers: updated });
                        }}
                        className="bg-transparent text-xs font-semibold text-slate-800 flex-1 focus:outline-none"
                      />
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                          <Percent size={10} className="text-slate-400" />
                          <input
                            type="number"
                            value={tier.percentage}
                            onChange={(e) => {
                              const pct = parseFloat(e.target.value) || 0;
                              const updated = quote.paymentTiers?.map(t => 
                                t.id === tier.id ? { ...t, percentage: pct, amount: (grandTotal * pct) / 100 } : t
                              );
                              onUpdateQuote({ ...quote, paymentTiers: updated });
                            }}
                            className="w-10 bg-transparent text-right font-mono text-xs font-bold text-slate-900 focus:outline-none"
                          />
                        </div>
                        <span className="font-mono text-xs font-bold text-slate-700 min-w-[90px] text-right">
                          {((grandTotal * tier.percentage) / 100).toLocaleString(undefined, { minimumFractionDigits: 0 })}
                        </span>
                        <button
                          onClick={() => {
                            const updated = quote.paymentTiers?.filter(t => t.id !== tier.id);
                            onUpdateQuote({ ...quote, paymentTiers: updated });
                          }}
                          className="text-slate-400 hover:text-rose-600 transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {(!quote.paymentTiers || quote.paymentTiers.length === 0) && (
                    <div className="py-6 text-center text-slate-400 text-xs">
                      No payment milestones configured. Click "+ Add Milestone" to schedule contract progress claims.
                    </div>
                  )}
                </div>

                {quote.paymentTiers && quote.paymentTiers.length > 0 && (
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <span className="text-slate-500 font-medium">Total Allocated:</span>
                    <span className={cn(
                      "font-mono font-bold px-2 py-0.5 rounded-md",
                      quote.paymentTiers.reduce((s, t) => s + t.percentage, 0) === 100 
                        ? "bg-emerald-50 text-emerald-700" 
                        : "bg-amber-50 text-amber-700"
                    )}>
                      {quote.paymentTiers.reduce((s, t) => s + t.percentage, 0)}% of Contract Sum
                    </span>
                  </div>
                )}
              </div>

              {/* Total Payable Hero Card */}
              <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 font-medium block">
                    Final Tender Contract Value
                  </span>
                  <div className="text-2xl font-bold font-mono text-white mt-1">
                    <span className="text-sm text-orange-400 mr-1.5">{quote.currency}</span>
                    {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    {quote.items.length} BOQ line items • SLS/ASTM Certified
                  </span>
                </div>

                <button
                  onClick={onSaveQuote}
                  className="px-5 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl text-xs transition-colors shadow-xs shadow-orange-500/20 flex items-center gap-2"
                >
                  <CheckCircle2 size={16} />
                  <span>Save Quotation</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Timeline & Milestones View */}
      {editorTab === 'timeline' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <TimelineEditor 
            quote={quote} 
            onChange={(timeline) => onUpdateQuote({ ...quote, timeline })} 
            settings={companySettings}
          />
        </div>
      )}

      {/* Live Document Preview View */}
      {editorTab === 'preview' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-orange-50 text-orange-600 rounded-lg border border-orange-100">
                <Layout size={14} />
              </span>
              <h2 className="font-semibold text-sm text-slate-900">Real-Time Quotation Document Preview</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Layout Template:</span>
              <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-xs font-semibold text-slate-800">
                {selectedLayout}
              </span>
            </div>
          </div>
          <div className="max-h-[850px] overflow-y-auto rounded-xl border border-slate-100 bg-slate-50 p-4">
            <LivePreview quote={quote} layout={selectedLayout} settings={companySettings} />
          </div>
        </div>
      )}
    </div>
  );
};
