import React, { useState, useMemo } from 'react';
import { 
  Project, 
  BOQItem, 
  ProductVariant, 
  ProjectActualCostRecord, 
  ProjectActualCostCategory,
  ProjectPostEvaluationItem,
  Quote,
  QuoteStatus
} from '../types';
import { 
  calculateProjectPostEvaluationSummary
} from '../services/costEvaluationService';
import { 
  Scale, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calculator, 
  Plus, 
  Trash2, 
  Edit2, 
  FileText, 
  ArrowLeft, 
  BarChart3, 
  Layers, 
  Search, 
  Download, 
  ExternalLink, 
  Building2, 
  Package, 
  ChevronRight,
  X,
  PlusCircle,
  HelpCircle,
  LayoutGrid,
  List,
  ArrowLeftRight,
  Award,
  Trophy,
  SlidersHorizontal
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend, 
  PieChart, 
  Pie, 
  Cell
} from 'recharts';
import { toast } from 'sonner';

interface ProjectPostEvaluationPortalProps {
  projects: Project[];
  quotes?: Quote[];
  onCreateProjectFromQuote?: (quote: Quote) => void;
  productVariants: ProductVariant[];
  actualCostRecords: ProjectActualCostRecord[];
  onAddActualCostRecord: (record: Omit<ProjectActualCostRecord, 'id'>) => void;
  onUpdateActualCostRecord: (record: ProjectActualCostRecord) => void;
  onDeleteActualCostRecord: (id: string) => void;
  onAddItemToProject: (projectId: string, item: Partial<BOQItem>) => void;
  onNavigateToVariations?: (projectId: string) => void;
  initialProjectId?: string;
  onBackToProjects?: () => void;
  onOpenCatalog?: (context?: 'post-evaluation') => void;
}

const COST_CATEGORY_COLORS: Record<string, string> = {
  MATERIAL: '#0284c7', // Sky
  LABOUR: '#10b981',   // Emerald
  OVERHEAD: '#f59e0b', // Amber
  SUBCONTRACT: '#6366f1', // Indigo
  EQUIPMENT: '#8b5cf6', // Purple
  OTHER: '#ec4899'     // Pink
};

export const ProjectPostEvaluationPortal: React.FC<ProjectPostEvaluationPortalProps> = ({
  projects,
  quotes,
  onCreateProjectFromQuote,
  productVariants,
  actualCostRecords,
  onAddActualCostRecord,
  onUpdateActualCostRecord,
  onDeleteActualCostRecord,
  onAddItemToProject,
  onNavigateToVariations,
  initialProjectId,
  onBackToProjects,
  onOpenCatalog
}) => {
  // Selected Project State
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    initialProjectId || (projects.length > 0 ? projects[0].id : null)
  );

  // View Mode for Project Directory / Selector: 'CARDS' | 'LIST'
  const [projectViewMode, setProjectViewMode] = useState<'CARDS' | 'LIST'>('CARDS');

  // Status Filter for Projects: 'ALL' | 'IN_PROGRESS' | 'COMPLETED'
  const [projectStatusFilter, setProjectStatusFilter] = useState<'ALL' | 'IN_PROGRESS' | 'COMPLETED'>('ALL');

  // Active view inside project: 'DASHBOARD' | 'ITEMS_TABLE' | 'VARIANCE_MATRIX' | 'COST_JOURNAL' | 'VARIATIONS_LINK'
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'ITEMS_TABLE' | 'VARIANCE_MATRIX' | 'COST_JOURNAL' | 'VARIATIONS_LINK'>('DASHBOARD');

  // Search and Filters
  const [projectSearch, setProjectSearch] = useState('');
  const [itemSearch, setItemSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [healthFilter, setHealthFilter] = useState<string>('ALL');

  // Modals
  const [isLogCostModalOpen, setIsLogCostModalOpen] = useState(false);
  const [isAddVariantModalOpen, setIsAddVariantModalOpen] = useState(false);
  const [isAddAdHocCostModalOpen, setIsAddAdHocCostModalOpen] = useState(false);
  const [inspectingItem, setInspectingItem] = useState<ProjectPostEvaluationItem | null>(null);
  const [editingCostRecord, setEditingCostRecord] = useState<ProjectActualCostRecord | null>(null);

  // Form State: Log Actual Cost Record
  const [costFormItemId, setCostFormItemId] = useState<string>('');
  const [costFormCategory, setCostFormCategory] = useState<ProjectActualCostCategory>('MATERIAL');
  const [costFormType, setCostFormType] = useState<string>('Raw Material Procurement');
  const [costFormDescription, setCostFormDescription] = useState<string>('');
  const [costFormInvoiceNo, setCostFormInvoiceNo] = useState<string>('');
  const [costFormSupplier, setCostFormSupplier] = useState<string>('');
  const [costFormQty, setCostFormQty] = useState<number>(1);
  const [costFormUnit, setCostFormUnit] = useState<string>('sqft');
  const [costFormUnitRate, setCostFormUnitRate] = useState<number>(0);
  const [costFormTotalAmount, setCostFormTotalAmount] = useState<number>(0);
  const [costFormDate, setCostFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [costFormNotes, setCostFormNotes] = useState<string>('');

  // Form State: Add Variant to Project
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [variantAddQty, setVariantAddQty] = useState<number>(10);
  const [variantAddRate, setVariantAddRate] = useState<number>(0);
  const [variantAddUnit, setVariantAddUnit] = useState<string>('sqft');
  const [variantAddNotes, setVariantAddNotes] = useState<string>('');

  // Form State: Add Ad-hoc Unbudgeted Cost Item
  const [adHocTitle, setAdHocTitle] = useState<string>('');
  const [adHocCategory, setAdHocCategory] = useState<ProjectActualCostCategory>('OTHER');
  const [adHocCostType, setAdHocCostType] = useState<string>('Unbudgeted Site Expenditure');
  const [adHocSupplier, setAdHocSupplier] = useState<string>('');
  const [adHocInvoiceNo, setAdHocInvoiceNo] = useState<string>('');
  const [adHocAmount, setAdHocAmount] = useState<number>(0);
  const [adHocReason, setAdHocReason] = useState<string>('');

  // Current selected project
  const currentProject = useMemo(() => {
    return projects.find(p => p.id === selectedProjectId) || null;
  }, [projects, selectedProjectId]);

  // Project evaluation calculation results
  const evaluation = useMemo(() => {
    if (!currentProject) return null;
    const projectRecords = actualCostRecords.filter(r => r.projectId === currentProject.id);
    return calculateProjectPostEvaluationSummary(currentProject, projectRecords, productVariants);
  }, [currentProject, actualCostRecords, productVariants]);

  // Project Tiles Metrics (for tile landing view)
  const projectSummaries = useMemo(() => {
    return projects.map(proj => {
      const records = actualCostRecords.filter(r => r.projectId === proj.id);
      return calculateProjectPostEvaluationSummary(proj, records, productVariants);
    });
  }, [projects, actualCostRecords, productVariants]);

  // Won Quotes that do not have an active project yet
  const wonQuotesWithoutProject = useMemo(() => {
    if (!quotes) return [];
    const projectQuoteIds = new Set(projects.map(p => p.quoteId).filter(Boolean));
    return quotes.filter(q => 
      (q.status === QuoteStatus.WON || q.status === QuoteStatus.PROJECT) && 
      !projectQuoteIds.has(q.id) &&
      (projectSearch.trim() === '' || 
        q.projectName.toLowerCase().includes(projectSearch.toLowerCase()) || 
        q.quoteNo.toLowerCase().includes(projectSearch.toLowerCase()) ||
        q.client.name.toLowerCase().includes(projectSearch.toLowerCase())
      )
    );
  }, [quotes, projects, projectSearch]);

  // Filtered Project Summaries for Directory View
  const filteredProjectSummaries = useMemo(() => {
    return projectSummaries.filter(ps => {
      // Status filter
      if (projectStatusFilter === 'IN_PROGRESS' && ps.summary.projectStatus !== 'In Progress') {
        return false;
      }
      if (projectStatusFilter === 'COMPLETED' && ps.summary.projectStatus !== 'Completed') {
        return false;
      }

      // Search query (matches project name, client name, status, or original quote ref)
      if (projectSearch.trim()) {
        const query = projectSearch.toLowerCase();
        const matchesName = ps.summary.projectName.toLowerCase().includes(query);
        const matchesClient = ps.summary.clientName.toLowerCase().includes(query);
        const matchesStatus = ps.summary.projectStatus.toLowerCase().includes(query);
        const proj = projects.find(p => p.id === ps.summary.projectId);
        const matchesQuoteNo = proj?.originalQuoteNo?.toLowerCase().includes(query);
        return matchesName || matchesClient || matchesStatus || !!matchesQuoteNo;
      }
      return true;
    });
  }, [projectSummaries, projectSearch, projectStatusFilter, projects]);

  // Filtered Items inside current project
  const filteredItems = useMemo(() => {
    if (!evaluation) return [];
    return evaluation.items.filter(item => {
      const matchesSearch = 
        item.name.toLowerCase().includes(itemSearch.toLowerCase()) ||
        item.itemNo.toLowerCase().includes(itemSearch.toLowerCase()) ||
        (item.variantCode && item.variantCode.toLowerCase().includes(itemSearch.toLowerCase()));
      const matchesCategory = categoryFilter === 'ALL' || item.category === categoryFilter;
      const matchesHealth = healthFilter === 'ALL' || item.healthStatus === healthFilter;
      return matchesSearch && matchesCategory && matchesHealth;
    });
  }, [evaluation, itemSearch, categoryFilter, healthFilter]);

  // Chart Data: Offered Revenue vs Standard Cost vs Actual Cost
  const itemComparisonChartData = useMemo(() => {
    if (!evaluation) return [];
    return evaluation.items.slice(0, 8).map(it => ({
      name: it.itemNo + ' ' + it.name.substring(0, 14) + (it.name.length > 14 ? '…' : ''),
      fullName: it.name,
      'Offered Price': Math.round(it.offeredTotalRevenue),
      'Standard Cost': Math.round(it.standardTotalCost),
      'Actual Cost': Math.round(it.actualTotalCost),
      'Cost Variance': Math.round(it.costVarianceAmount)
    }));
  }, [evaluation]);

  // Chart Data: Standard Cost Variance Breakdown (Accounting Techniques)
  const varianceDecompositionChartData = useMemo(() => {
    if (!evaluation) return [];
    const s = evaluation.summary;
    return [
      { technique: 'Material Price (MPV)', amount: Math.round(s.materialPriceVariance), fill: s.materialPriceVariance >= 0 ? '#10b981' : '#ef4444' },
      { technique: 'Material Usage (MUV)', amount: Math.round(s.materialUsageVariance), fill: s.materialUsageVariance >= 0 ? '#10b981' : '#ef4444' },
      { technique: 'Labour Rate (LRV)', amount: Math.round(s.labourRateVariance), fill: s.labourRateVariance >= 0 ? '#10b981' : '#ef4444' },
      { technique: 'Labour Efficiency (LEV)', amount: Math.round(s.labourEfficiencyVariance), fill: s.labourEfficiencyVariance >= 0 ? '#10b981' : '#ef4444' },
      { technique: 'Overhead Spending', amount: Math.round(s.overheadSpendingVariance), fill: s.overheadSpendingVariance >= 0 ? '#10b981' : '#ef4444' },
      { technique: 'Net Total Variance', amount: Math.round(s.netCostVariance), fill: s.netCostVariance >= 0 ? '#0284c7' : '#dc2626' },
    ];
  }, [evaluation]);

  // Chart Data: Actual Cost Distribution Pie Chart
  const costDistributionData = useMemo(() => {
    if (!evaluation) return [];
    const s = evaluation.summary;
    const data = [
      { name: 'Direct Materials', value: s.totalMaterialActualCost, color: COST_CATEGORY_COLORS.MATERIAL },
      { name: 'Direct Labour', value: s.totalLabourActualCost, color: COST_CATEGORY_COLORS.LABOUR },
      { name: 'Overheads & Site', value: s.totalOverheadActualCost, color: COST_CATEGORY_COLORS.OVERHEAD },
      { name: 'Ad-hoc & Other', value: s.totalOtherActualCost, color: COST_CATEGORY_COLORS.OTHER },
    ].filter(d => d.value > 0);
    return data;
  }, [evaluation]);

  // Open Log Cost modal for a specific item
  const handleOpenLogCost = (itemId?: string) => {
    if (itemId) {
      setCostFormItemId(itemId);
      const item = evaluation?.items.find(i => i.id === itemId);
      if (item) {
        setCostFormUnit(item.unit);
      }
    } else {
      setCostFormItemId('');
    }
    setCostFormCategory('MATERIAL');
    setCostFormType('Raw Material Purchase');
    setCostFormDescription('');
    setCostFormInvoiceNo('');
    setCostFormSupplier('');
    setCostFormQty(1);
    setCostFormUnitRate(0);
    setCostFormTotalAmount(0);
    setCostFormNotes('');
    setCostFormDate(new Date().toISOString().split('T')[0]);
    setIsLogCostModalOpen(true);
  };

  // Submit Log Cost Record
  const handleSubmitCostRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject) return;

    const totalCost = costFormTotalAmount > 0 
      ? costFormTotalAmount 
      : (costFormQty * costFormUnitRate);

    if (totalCost <= 0) {
      toast.error('Please specify a valid actual cost amount');
      return;
    }

    const linkedItem = evaluation?.items.find(i => i.id === costFormItemId);

    if (editingCostRecord) {
      onUpdateActualCostRecord({
        ...editingCostRecord,
        projectItemId: costFormItemId || undefined,
        itemName: linkedItem?.name || editingCostRecord.itemName,
        costCategory: costFormCategory,
        costType: costFormType,
        description: costFormDescription || `Actual ${costFormCategory.toLowerCase()} allocation`,
        invoiceOrReceiptNo: costFormInvoiceNo,
        supplierOrPayee: costFormSupplier,
        quantity: Number(costFormQty) || 1,
        unit: costFormUnit,
        unitRate: Number(costFormUnitRate) || totalCost,
        totalActualCost: totalCost,
        date: costFormDate,
        notes: costFormNotes
      });
      toast.success('Actual cost record updated');
      setEditingCostRecord(null);
    } else {
      onAddActualCostRecord({
        projectId: currentProject.id,
        projectItemId: costFormItemId || undefined,
        itemName: linkedItem?.name,
        costCategory: costFormCategory,
        costType: costFormType,
        description: costFormDescription || `Actual ${costFormCategory.toLowerCase()} allocation`,
        invoiceOrReceiptNo: costFormInvoiceNo,
        supplierOrPayee: costFormSupplier,
        date: costFormDate,
        quantity: Number(costFormQty) || 1,
        unit: costFormUnit,
        unitRate: Number(costFormUnitRate) || totalCost,
        totalActualCost: totalCost,
        notes: costFormNotes,
        paymentStatus: 'Paid'
      });
      toast.success('Actual cost record saved to project ledger');
    }

    setIsLogCostModalOpen(false);
  };

  // Submit Add Variant Item into Project
  const handleAddVariantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject) return;
    const variant = productVariants.find(v => v.id === selectedVariantId);
    if (!variant) {
      toast.error('Please select a product variant');
      return;
    }

    const qty = Math.max(1, Number(variantAddQty) || 1);
    const rate = variantAddRate > 0 ? variantAddRate : (variant.pricing?.sellingPrice || 3500);
    const unitCost = variant.bom?.totalCost || (rate * 0.72);

    const newItem: Partial<BOQItem> = {
      id: crypto.randomUUID(),
      no: `${(currentProject.items?.length || 0) + 1}.0`,
      name: variant.variantName,
      description: variant.notes || `${variant.variantCode} - ${variant.familyId || 'Standard Extrusion'}`,
      itemType: 'Main',
      category: variant.categoryName || 'Aluminium',
      unit: (variantAddUnit || variant.unit || 'sqft') as any,
      qty,
      rate,
      discountPercent: 0,
      amount: qty * rate,
      variantId: variant.id,
      variantCode: variant.variantCode,
      costAtTimeOfQuote: unitCost,
      variationStatus: 'Original'
    };

    onAddItemToProject(currentProject.id, newItem);
    toast.success(`Variant ${variant.variantCode} added to project with standard cost baseline`);
    setIsAddVariantModalOpen(false);
    setSelectedVariantId('');
  };

  // Submit Add Ad-hoc / Unbudgeted Cost Item
  const handleAddAdHocSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject) return;
    if (!adHocTitle.trim() || adHocAmount <= 0) {
      toast.error('Please enter a description and actual cost amount');
      return;
    }

    onAddActualCostRecord({
      projectId: currentProject.id,
      costCategory: adHocCategory,
      costType: adHocCostType || 'Unbudgeted Site Expenditure',
      description: adHocTitle,
      invoiceOrReceiptNo: adHocInvoiceNo || `ADHOC-${Date.now().toString().slice(-4)}`,
      supplierOrPayee: adHocSupplier,
      date: new Date().toISOString().split('T')[0],
      quantity: 1,
      unit: 'Lot',
      unitRate: adHocAmount,
      totalActualCost: adHocAmount,
      isAdHocCostItem: true,
      notes: adHocReason || 'Ad-hoc actual cost added without initial standard BOM definition',
      paymentStatus: 'Approved'
    });

    toast.success('Ad-hoc cost item logged into project evaluation engine');
    setIsAddAdHocCostModalOpen(false);
    setAdHocTitle('');
    setAdHocAmount(0);
    setAdHocReason('');
  };

  // Handle Edit existing cost record
  const handleStartEditRecord = (record: ProjectActualCostRecord) => {
    setEditingCostRecord(record);
    setCostFormItemId(record.projectItemId || '');
    setCostFormCategory(record.costCategory);
    setCostFormType(record.costType);
    setCostFormDescription(record.description);
    setCostFormInvoiceNo(record.invoiceOrReceiptNo || '');
    setCostFormSupplier(record.supplierOrPayee || '');
    setCostFormQty(record.quantity);
    setCostFormUnit(record.unit);
    setCostFormUnitRate(record.unitRate);
    setCostFormTotalAmount(record.totalActualCost);
    setCostFormDate(record.date);
    setCostFormNotes(record.notes || '');
    setIsLogCostModalOpen(true);
  };

  // Export Summary to CSV
  const handleExportCSV = () => {
    if (!evaluation) return;
    const headers = [
      'Item No',
      'Item Name',
      'Variant Code',
      'Category',
      'Offered Qty',
      'Unit',
      'Offered Rate (LKR)',
      'Offered Revenue (LKR)',
      'Std Unit Cost (LKR)',
      'Total Std Cost (LKR)',
      'Actual Cost (LKR)',
      'Actual Unit Cost (LKR)',
      'Cost Variance (LKR)',
      'Variance %',
      'Std Margin %',
      'Actual Margin %',
      'Margin Slippage %',
      'Health Status'
    ];

    const rows = evaluation.items.map(it => [
      `"${it.itemNo}"`,
      `"${it.name.replace(/"/g, '""')}"`,
      `"${it.variantCode || ''}"`,
      `"${it.category}"`,
      it.offeredQty,
      `"${it.unit}"`,
      it.offeredUnitRate,
      it.offeredTotalRevenue,
      it.standardUnitCost,
      it.standardTotalCost,
      it.actualTotalCost,
      it.actualUnitCost.toFixed(2),
      it.costVarianceAmount,
      it.costVariancePercent.toFixed(2),
      it.standardMarginPercent.toFixed(2),
      it.actualMarginPercent.toFixed(2),
      it.marginVariancePercent.toFixed(2),
      `"${it.healthStatus}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Post_Evaluation_${currentProject?.projectName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Post evaluation report exported as CSV');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Top Header Bar - Single Line Ribbon */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-6 py-2.5 shadow-2xs">
        <div className="w-full flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            {selectedProjectId && (
              <button
                type="button"
                onClick={() => {
                  setSelectedProjectId(null);
                  onBackToProjects?.();
                }}
                className="inline-flex items-center gap-1 px-2 py-1 hover:bg-slate-100 rounded-lg text-slate-700 text-xs font-semibold transition-colors border border-slate-200 shrink-0"
                title="Back to All Projects Directory"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Projects</span>
              </button>
            )}
            <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Scale size={16} />
            </div>
            <div className="flex items-baseline gap-2 min-w-0">
              <h1 className="text-sm font-bold text-slate-900 whitespace-nowrap">
                Post-Evaluation & Costing
              </h1>
              <span className="text-xs text-slate-500 font-normal truncate hidden sm:inline">
                • Standard vs. actual variance & profit analysis
              </span>
            </div>
          </div>

          {/* Action Buttons ONLY */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Quick Project Select Dropdown */}
            {projects.length > 0 && (
              <select
                value={selectedProjectId || ''}
                onChange={(e) => setSelectedProjectId(e.target.value || null)}
                className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-orange-500 outline-none cursor-pointer"
              >
                <option value="">All Projects ({projects.length})</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.projectName} ({p.status || 'Won'})
                  </option>
                ))}
              </select>
            )}

            {onOpenCatalog && (
              <button
                type="button"
                onClick={() => onOpenCatalog('post-evaluation')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-200/80 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg shadow-2xs transition-colors"
                title="Open Master Item Catalog for Standard Rates & Variance Items"
              >
                <Package className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden sm:inline">Item Catalog</span>
              </button>
            )}

            {currentProject && (
              <>
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Export</span> CSV
                </button>
                {onNavigateToVariations && (
                  <button
                    type="button"
                    onClick={() => onNavigateToVariations(currentProject.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Variations</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Container - Full Width fluid layout, removing blank margins */}
      <main className="w-full px-4 sm:px-6 lg:px-8 pt-4 pb-16">
        {/* VIEW 1: PROJECT DIRECTORY (When no project is selected or user clicked All Won Projects) */}
        {!selectedProjectId || !currentProject ? (
          <div className="space-y-5">
            {/* Directory Header Bar with Search, Status Filter Pills & Card/List Switcher */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900">Awarded & Won Projects Directory</h2>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-200 flex items-center gap-1">
                      <Award className="w-3.5 h-3.5" /> Won Contracts
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Select a project in Card or List view below to evaluate offered revenue against standard cost baselines and actual incurred vouchers
                  </p>
                </div>

                {/* Right controls: Search Input & View Mode Toggle */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Real-time Search Box */}
                  <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search project, quote ref, client..."
                      value={projectSearch}
                      onChange={(e) => setProjectSearch(e.target.value)}
                      className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                    {projectSearch && (
                      <button
                        type="button"
                        onClick={() => setProjectSearch('')}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                        title="Clear search"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Card vs List View Mode Toggle */}
                  <div className="inline-flex rounded-lg border border-slate-200 p-1 bg-slate-50 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setProjectViewMode('CARDS')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                        projectViewMode === 'CARDS'
                          ? 'bg-white text-blue-800 shadow-2xs border border-slate-200'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                      title="View as Cards"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      <span>Cards</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setProjectViewMode('LIST')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                        projectViewMode === 'LIST'
                          ? 'bg-white text-blue-800 shadow-2xs border border-slate-200'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                      title="View as Dense List Table"
                    >
                      <List className="w-3.5 h-3.5" />
                      <span>List</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                <span className="text-xs font-medium text-slate-400 mr-1 flex items-center gap-1">
                  <SlidersHorizontal className="w-3.5 h-3.5" /> Filter:
                </span>
                <button
                  type="button"
                  onClick={() => setProjectStatusFilter('ALL')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                    projectStatusFilter === 'ALL'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All Projects ({projectSummaries.length})
                </button>
                <button
                  type="button"
                  onClick={() => setProjectStatusFilter('IN_PROGRESS')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                    projectStatusFilter === 'IN_PROGRESS'
                      ? 'bg-blue-800 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Won / In Progress ({projectSummaries.filter(ps => ps.summary.projectStatus === 'In Progress').length})
                </button>
                <button
                  type="button"
                  onClick={() => setProjectStatusFilter('COMPLETED')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                    projectStatusFilter === 'COMPLETED'
                      ? 'bg-emerald-800 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Completed ({projectSummaries.filter(ps => ps.summary.projectStatus === 'Completed').length})
                </button>
              </div>
            </div>

            {/* Additional Won Quotations Banner (if any won quotes have not been converted to project yet) */}
            {wonQuotesWithoutProject.length > 0 && (
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-5 shadow-2xs">
                <div className="flex items-center justify-between gap-4 mb-3">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-emerald-600" />
                    <h3 className="text-sm font-bold text-emerald-950">
                      Awarded Won Quotations Ready for Cost Post-Evaluation ({wonQuotesWithoutProject.length})
                    </h3>
                  </div>
                  <span className="text-[11px] text-emerald-700 font-medium">
                    Click any won quotation below to immediately initiate its post-evaluation engine
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {wonQuotesWithoutProject.map(wq => (
                    <div
                      key={wq.id}
                      onClick={() => {
                        if (onCreateProjectFromQuote) {
                          onCreateProjectFromQuote(wq);
                        } else {
                          toast.info(`Opening won quote ${wq.quoteNo} for evaluation`);
                        }
                      }}
                      className="bg-white/90 hover:bg-white rounded-xl border border-emerald-200 hover:border-emerald-400 p-3.5 shadow-2xs cursor-pointer transition-all flex items-center justify-between group"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                            {wq.quoteNo}
                          </span>
                          <span className="text-[10px] font-semibold text-emerald-700">Won Award</span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 mt-1 group-hover:text-emerald-800">
                          {wq.projectName}
                        </h4>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {wq.client.name} • LKR {Math.round(wq.grandTotal || wq.items?.reduce((s, i) => s + (i.amount || 0), 0) || 0).toLocaleString()}
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 group-hover:translate-x-0.5 transition-transform">
                        Evaluate <ChevronRight className="w-4 h-4" />
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {filteredProjectSummaries.length === 0 && wonQuotesWithoutProject.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-2xs">
                <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800">No Projects Matching Filter</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  {projectSearch ? `No projects found matching "${projectSearch}". Try clearing your search query.` : 'There are no active or won projects available. Convert a won quotation or create a new project to start post-evaluation.'}
                </p>
                {projectSearch && (
                  <button
                    type="button"
                    onClick={() => { setProjectSearch(''); setProjectStatusFilter('ALL'); }}
                    className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors"
                  >
                    Clear Filter & Show All
                  </button>
                )}
              </div>
            ) : projectViewMode === 'CARDS' ? (
              /* --- CARD VIEW: Fluid Bento Grid --- */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filteredProjectSummaries.map(({ summary, items }) => {
                  const healthColor = 
                    summary.evaluationHealth === 'HEALTHY' ? 'text-emerald-800 bg-emerald-50 border-emerald-200' :
                    summary.evaluationHealth === 'MODERATE_RISK' ? 'text-amber-800 bg-amber-50 border-amber-200' :
                    'text-rose-800 bg-rose-50 border-rose-200';

                  const healthLabel = 
                    summary.evaluationHealth === 'HEALTHY' ? 'Favorable / On Target' :
                    summary.evaluationHealth === 'MODERATE_RISK' ? 'Margin Warning' :
                    'Cost Overrun Alert';

                  return (
                    <div
                      key={summary.projectId}
                      onClick={() => setSelectedProjectId(summary.projectId)}
                      className="bg-white rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all duration-200 p-5 cursor-pointer flex flex-col justify-between group shadow-2xs"
                    >
                      <div>
                        {/* Card Top Header */}
                        <div className="flex items-start justify-between gap-2.5 mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                                {summary.projectStatus}
                              </span>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                                <Award className="w-3 h-3" /> Won
                              </span>
                            </div>
                            <h3 className="text-base font-bold text-slate-900 mt-1.5 group-hover:text-blue-800 transition-colors truncate">
                              {summary.projectName}
                            </h3>
                            <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{summary.clientName}</span>
                            </div>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${healthColor}`}>
                            {healthLabel}
                          </span>
                        </div>

                        {/* Financial Metrics Grid */}
                        <div className="grid grid-cols-2 gap-2.5 my-3 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                          <div>
                            <div className="text-[10px] text-slate-400 uppercase font-semibold">Offered Revenue</div>
                            <div className="font-mono font-bold text-slate-900 text-xs sm:text-sm mt-0.5 truncate">
                              LKR {Math.round(summary.totalOfferedRevenue).toLocaleString()}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-400 uppercase font-semibold">Standard Cost</div>
                            <div className="font-mono font-bold text-slate-700 text-xs sm:text-sm mt-0.5 truncate">
                              LKR {Math.round(summary.totalStandardCost).toLocaleString()}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-400 uppercase font-semibold">Actual Cost</div>
                            <div className="font-mono font-bold text-slate-900 text-xs sm:text-sm mt-0.5 truncate">
                              LKR {Math.round(summary.totalActualCost).toLocaleString()}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-400 uppercase font-semibold">Net Cost Variance</div>
                            <div className={`font-mono font-bold text-xs sm:text-sm mt-0.5 flex items-center gap-1 truncate ${summary.isFavorable ? 'text-emerald-800' : 'text-rose-800'}`}>
                              {summary.isFavorable ? <TrendingUp className="w-3.5 h-3.5 shrink-0" /> : <TrendingDown className="w-3.5 h-3.5 shrink-0" />}
                              <span>{summary.isFavorable ? '+' : ''}{Math.round(summary.netCostVariance).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>

                        {/* Margin Progress Bar */}
                        <div className="space-y-1.5 text-xs">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-slate-500">Realized Gross Margin:</span>
                            <span className="font-mono font-bold text-slate-800">
                              {summary.actualMarginPercent.toFixed(1)}% <span className="text-slate-400 font-normal">(Std: {summary.standardMarginPercent.toFixed(1)}%)</span>
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all ${
                                summary.actualMarginPercent >= summary.standardMarginPercent ? 'bg-emerald-500' :
                                summary.actualMarginPercent >= 15 ? 'bg-amber-500' : 'bg-rose-500'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(0, summary.actualMarginPercent))}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Card Action Footer */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-medium text-[11px]">
                          {items.length} items offered
                        </span>
                        <span className="inline-flex items-center gap-1 text-blue-800 font-bold group-hover:translate-x-0.5 transition-transform">
                          Evaluate Project <ChevronRight className="w-4 h-4" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* --- LIST VIEW: Dense Professional Data Table --- */
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/90 text-slate-600 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                        <th className="py-3 px-4">Project & Won Reference</th>
                        <th className="py-3 px-4">Client</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-4 text-right">Offered Revenue</th>
                        <th className="py-3 px-4 text-right">Standard Budget</th>
                        <th className="py-3 px-4 text-right">Actual Cost</th>
                        <th className="py-3 px-4 text-right">Cost Variance</th>
                        <th className="py-3 px-4 text-center">Realized Margin</th>
                        <th className="py-3 px-4 text-center">Health</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredProjectSummaries.map(({ summary, items }) => {
                        const healthColor = 
                          summary.evaluationHealth === 'HEALTHY' ? 'text-emerald-800 bg-emerald-50 border-emerald-200' :
                          summary.evaluationHealth === 'MODERATE_RISK' ? 'text-amber-800 bg-amber-50 border-amber-200' :
                          'text-rose-800 bg-rose-50 border-rose-200';

                        const healthLabel = 
                          summary.evaluationHealth === 'HEALTHY' ? 'On Target' :
                          summary.evaluationHealth === 'MODERATE_RISK' ? 'Warning' :
                          'Overrun';

                        return (
                          <tr
                            key={summary.projectId}
                            onClick={() => setSelectedProjectId(summary.projectId)}
                            className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
                          >
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900 group-hover:text-blue-800 transition-colors text-sm">
                                {summary.projectName}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                ID: {summary.projectId.substring(0, 8)}... • {items.length} items
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-semibold text-slate-700 flex items-center gap-1.5">
                                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                {summary.clientName}
                              </div>
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                                {summary.projectStatus}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                              LKR {Math.round(summary.totalOfferedRevenue).toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-slate-700 whitespace-nowrap">
                              LKR {Math.round(summary.totalStandardCost).toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                              LKR {Math.round(summary.totalActualCost).toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1 ${summary.isFavorable ? 'text-emerald-700' : 'text-rose-700'}`}>
                                {summary.isFavorable ? '+' : ''}{Math.round(summary.netCostVariance).toLocaleString()}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center whitespace-nowrap">
                              <div className="font-mono font-bold text-slate-800">
                                {summary.actualMarginPercent.toFixed(1)}%
                              </div>
                              <div className="text-[10px] text-slate-400">
                                (Std: {summary.standardMarginPercent.toFixed(1)}%)
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center whitespace-nowrap">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${healthColor}`}>
                                {healthLabel}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedProjectId(summary.projectId);
                                }}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-800 hover:bg-blue-900 text-white font-semibold text-xs rounded-lg shadow-2xs transition-colors"
                              >
                                Evaluate <ChevronRight className="w-3.5 h-3.5" />
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
          </div>
        ) : (
          /* VIEW 2: INSIDE SELECTED PROJECT - POST EVALUATION ENGINE */
          evaluation && (
            <div className="space-y-6">
              {/* Project Executive Header & KPI Summary */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
                <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 pb-5 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-800 font-bold border border-blue-200">
                        {currentProject.status || 'Active Project'}
                      </span>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                        <Award className="w-3.5 h-3.5" /> Won Contract
                      </span>
                      {currentProject.originalQuoteNo && (
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          Ref: {currentProject.originalQuoteNo}
                        </span>
                      )}
                      <span className="text-xs text-slate-400">
                        Initiated: {currentProject.startDate || 'Current'}
                      </span>
                      {/* Switch Project Button */}
                      <button
                        type="button"
                        onClick={() => setSelectedProjectId(null)}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold shadow-2xs transition-colors ml-1"
                        title="Return to projects list / card selection"
                      >
                        <ArrowLeftRight className="w-3 h-3 text-blue-600" />
                        <span>Switch Project</span>
                      </button>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">{currentProject.projectName}</h2>
                    <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      Client: <span className="font-semibold text-slate-700">{currentProject.client?.name || 'Client'}</span>
                      <span className="mx-1">•</span>
                      <span>Total Offered Items: <strong>{evaluation.items.length}</strong></span>
                      {evaluation.summary.totalAdHocCosts > 0 && (
                        <>
                          <span className="mx-1">•</span>
                          <span className="text-amber-800 font-medium">Includes Unbudgeted Ad-hoc Costs</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Primary Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenLogCost()}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-800 hover:bg-blue-900 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Log Actual Cost
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddVariantModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded-lg shadow-2xs transition-colors"
                    >
                      <Package className="w-4 h-4 text-slate-500" />
                      Add Variant to Project
                    </button>
                    {onOpenCatalog && (
                      <button
                        type="button"
                        onClick={() => onOpenCatalog('post-evaluation')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold rounded-lg transition-colors shadow-2xs"
                        title="Browse and add items/variants from the full-screen visual catalog"
                      >
                        <Package className="w-4 h-4 text-indigo-600" />
                        From Item Catalog
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsAddAdHocCostModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold rounded-lg transition-colors"
                      title="Add unbudgeted cost where no standard cost was defined"
                    >
                      <PlusCircle className="w-4 h-4" />
                      Add Ad-hoc / New Cost Item
                    </button>
                  </div>
                </div>

                {/* KPI Metrics Strip */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 pt-5">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Offered Revenue</div>
                    <div className="text-base font-bold font-mono text-slate-900 mt-1">
                      LKR {evaluation.summary.totalOfferedRevenue.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Contract Quoted Value</div>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Standard Cost (Budget)</div>
                    <div className="text-base font-bold font-mono text-slate-800 mt-1">
                      LKR {evaluation.summary.totalStandardCost.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Std Margin: <span className="font-semibold">{evaluation.summary.standardMarginPercent.toFixed(1)}%</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Actual Cost Incurred</div>
                    <div className="text-base font-bold font-mono text-slate-900 mt-1">
                      LKR {evaluation.summary.totalActualCost.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {evaluation.items.reduce((acc, it) => acc + it.costRecordsCount, 0) + evaluation.unassignedCostRecords.length} cost logs recorded
                    </div>
                  </div>

                  <div className={`p-3.5 rounded-xl border ${
                    evaluation.summary.isFavorable 
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' 
                      : 'bg-rose-50/70 border-rose-200 text-rose-950'
                  }`}>
                    <div className="text-[11px] font-bold uppercase tracking-wide opacity-80">Net Cost Variance</div>
                    <div className="text-base font-bold font-mono mt-1 flex items-center gap-1">
                      {evaluation.summary.isFavorable ? '+' : ''}
                      LKR {evaluation.summary.netCostVariance.toLocaleString()}
                    </div>
                    <div className="text-[10px] font-semibold mt-0.5">
                      {evaluation.summary.isFavorable ? 'Favorable (Savings)' : 'Unfavorable (Overrun)'} ({evaluation.summary.variancePercentage.toFixed(1)}%)
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Actual Realized Margin</div>
                    <div className={`text-base font-bold font-mono mt-1 ${
                      evaluation.summary.actualMarginPercent >= evaluation.summary.standardMarginPercent ? 'text-emerald-800' :
                      evaluation.summary.actualMarginPercent >= 15 ? 'text-amber-800' : 'text-rose-800'
                    }`}>
                      {evaluation.summary.actualMarginPercent.toFixed(1)}%
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Slippage: {evaluation.summary.marginErosionPercent >= 0 ? '+' : ''}{evaluation.summary.marginErosionPercent.toFixed(1)}%
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Break-Even Baseline</div>
                    <div className="text-base font-bold font-mono text-slate-800 mt-1">
                      LKR {Math.round(evaluation.summary.breakEvenRevenue).toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Cost/Offer Ratio: <span className="font-semibold">{evaluation.summary.costToOfferRatio.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex border-b border-slate-200 bg-white rounded-xl px-2 shadow-2xs overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setActiveTab('DASHBOARD')}
                  className={`px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                    activeTab === 'DASHBOARD' 
                      ? 'border-blue-600 text-blue-800' 
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  Analytics & Visualizations
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('ITEMS_TABLE')}
                  className={`px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                    activeTab === 'ITEMS_TABLE' 
                      ? 'border-blue-600 text-blue-800' 
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  Items Offered Post-Evaluation ({evaluation.items.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('VARIANCE_MATRIX')}
                  className={`px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                    activeTab === 'VARIANCE_MATRIX' 
                      ? 'border-blue-600 text-blue-800' 
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Calculator className="w-4 h-4" />
                  Standard Cost Variance Matrix (Techniques)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('COST_JOURNAL')}
                  className={`px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                    activeTab === 'COST_JOURNAL' 
                      ? 'border-blue-600 text-blue-800' 
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Actual Costs Ledger / Journal ({actualCostRecords.filter(r => r.projectId === currentProject.id).length})
                </button>
                {onNavigateToVariations && (
                  <button
                    type="button"
                    onClick={() => onNavigateToVariations(currentProject.id)}
                    className="px-4 py-3 text-xs font-bold border-b-2 border-transparent text-slate-500 hover:text-blue-800 whitespace-nowrap transition-colors flex items-center gap-1.5 ml-auto"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Sync with Variations Editor
                  </button>
                )}
              </div>

              {/* TAB 1: VISUAL ANALYTICS DASHBOARD */}
              {activeTab === 'DASHBOARD' && (
                <div className="space-y-6">
                  {/* Row 1: Offered vs Standard vs Actual Bar Chart */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">Offered Price vs Standard Cost vs Actual Incurred</h3>
                          <p className="text-xs text-slate-500">Comparative financial rollup by offered item variant</p>
                        </div>
                        <span className="text-[11px] font-mono text-slate-400">Values in LKR</span>
                      </div>
                      <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={itemComparisonChartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" />
                            <YAxis tick={{ fontSize: 11 }} tickFormatter={(val) => `LKR ${(val / 1000).toFixed(0)}k`} />
                            <Tooltip 
                              formatter={(value: any) => [`LKR ${Number(value).toLocaleString()}`, '']}
                              contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                            />
                            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                            <Bar dataKey="Offered Price" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Standard Cost" fill="#64748b" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Actual Cost" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Cost Structure Donut Chart */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Actual Cost Category Breakdown</h3>
                        <p className="text-xs text-slate-500 mb-2">Proportion of incurred expenditure</p>
                        <div className="h-56 w-full relative">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={costDistributionData}
                                cx="50%"
                                cy="50%"
                                innerRadius={55}
                                outerRadius={80}
                                paddingAngle={3}
                                dataKey="value"
                              >
                                {costDistributionData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(val: any) => [`LKR ${Number(val).toLocaleString()}`, '']} />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <div className="text-[10px] text-slate-400 font-medium uppercase">Total Actual</div>
                            <div className="text-xs font-bold font-mono text-slate-900">
                              LKR {(evaluation.summary.totalActualCost / 1000).toFixed(0)}k
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                        {costDistributionData.map((item) => (
                          <div key={item.name} className="flex justify-between items-center text-[11px]">
                            <div className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                              <span className="text-slate-600">{item.name}</span>
                            </div>
                            <span className="font-mono font-bold text-slate-800">
                              LKR {item.value.toLocaleString()} ({((item.value / evaluation.summary.totalActualCost) * 100).toFixed(1)}%)
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Standard Costing Variance Decomposition Waterfall */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900">Standard Costing Variance Analysis (Accounting Techniques)</h3>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                            Green = Favorable (Savings)
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-rose-50 text-rose-800 font-bold border border-rose-200">
                            Red = Unfavorable (Cost Overrun)
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          Decomposed into Material Price Variance, Material Usage Variance, Labour Rate Variance, Labour Efficiency Variance, and Overhead Spending
                        </p>
                      </div>
                    </div>

                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={varianceDecompositionChartData} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="technique" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} tickFormatter={(val) => `LKR ${(val / 1000).toFixed(0)}k`} />
                          <Tooltip 
                            formatter={(value: any) => [`LKR ${Number(value).toLocaleString()} (${Number(value) >= 0 ? 'Favorable' : 'Unfavorable'})`, 'Variance']}
                            contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                          />
                          <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                            {varianceDecompositionChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Technique Explanations Footer */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100 text-xs">
                      <div className="bg-slate-50 p-3 rounded-xl">
                        <div className="font-bold text-slate-800 flex items-center gap-1.5">
                          <Package className="w-3.5 h-3.5 text-blue-700" />
                          Direct Materials Variance
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1">
                          Price Variance: <strong>LKR {evaluation.summary.materialPriceVariance.toLocaleString()}</strong> | Usage Variance: <strong>LKR {evaluation.summary.materialUsageVariance.toLocaleString()}</strong>
                        </div>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl">
                        <div className="font-bold text-slate-800 flex items-center gap-1.5">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-700" />
                          Direct Labour Variance
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1">
                          Wage Rate Variance: <strong>LKR {evaluation.summary.labourRateVariance.toLocaleString()}</strong> | Efficiency Variance: <strong>LKR {evaluation.summary.labourEfficiencyVariance.toLocaleString()}</strong>
                        </div>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl">
                        <div className="font-bold text-slate-800 flex items-center gap-1.5">
                          <Scale className="w-3.5 h-3.5 text-amber-700" />
                          Overhead & Ad-hoc Allocation
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1">
                          Overhead Spending: <strong>LKR {evaluation.summary.overheadSpendingVariance.toLocaleString()}</strong> | Unbudgeted Ad-hoc: <strong>LKR {evaluation.summary.totalAdHocCosts.toLocaleString()}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: ITEMS OFFERED POST-EVALUATION TABLE */}
              {activeTab === 'ITEMS_TABLE' && (
                <div className="space-y-4">
                  {/* Filters and Search Bar */}
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                    <div className="relative w-full sm:w-80">
                      <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Filter item name, code, or number..."
                        value={itemSearch}
                        onChange={(e) => setItemSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg px-3 py-2 text-slate-700 focus:outline-hidden"
                      >
                        <option value="ALL">All Categories</option>
                        <option value="Aluminium">Aluminium</option>
                        <option value="Glass">Glass</option>
                        <option value="Steel">Steel</option>
                        <option value="Services">Services</option>
                      </select>
                      <select
                        value={healthFilter}
                        onChange={(e) => setHealthFilter(e.target.value)}
                        className="bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg px-3 py-2 text-slate-700 focus:outline-hidden"
                      >
                        <option value="ALL">All Health States</option>
                        <option value="EXCELLENT">Excellent / High Margin</option>
                        <option value="ON_TRACK">On Track</option>
                        <option value="WARNING">Warning</option>
                        <option value="CRITICAL_OVERRUN">Critical Overrun</option>
                      </select>
                    </div>
                  </div>

                  {/* Main Evaluation Table */}
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                          <tr>
                            <th className="p-3.5">Item & Variant</th>
                            <th className="p-3.5">Scope Qty</th>
                            <th className="p-3.5 text-right">Offered Rate</th>
                            <th className="p-3.5 text-right">Total Revenue</th>
                            <th className="p-3.5 text-right">Std Unit Cost</th>
                            <th className="p-3.5 text-right">Total Std Cost</th>
                            <th className="p-3.5 text-right">Actual Cost Incurred</th>
                            <th className="p-3.5 text-right">Cost Variance</th>
                            <th className="p-3.5 text-center">Margin Std vs Act</th>
                            <th className="p-3.5 text-center">Health</th>
                            <th className="p-3.5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredItems.map(it => {
                            const isFavorable = it.costVarianceAmount >= 0;
                            return (
                              <tr key={it.id} className="hover:bg-slate-50/70 transition-colors">
                                <td className="p-3.5">
                                  <div className="font-bold text-slate-900">{it.itemNo} {it.name}</div>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    {it.variantCode ? (
                                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                                        {it.variantCode}
                                      </span>
                                    ) : (
                                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                                        Ad-hoc Spec
                                      </span>
                                    )}
                                    <span className="text-[10px] text-slate-400">{it.category}</span>
                                    {it.variationStatus && it.variationStatus !== 'Original' && (
                                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
                                        {it.variationStatus}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="p-3.5 font-mono">
                                  {it.offeredQty} {it.unit}
                                </td>
                                <td className="p-3.5 text-right font-mono font-medium">
                                  LKR {it.offeredUnitRate.toLocaleString()}
                                </td>
                                <td className="p-3.5 text-right font-mono font-bold text-slate-900">
                                  LKR {it.offeredTotalRevenue.toLocaleString()}
                                </td>
                                <td className="p-3.5 text-right font-mono text-slate-600">
                                  LKR {Math.round(it.standardUnitCost).toLocaleString()}
                                </td>
                                <td className="p-3.5 text-right font-mono text-slate-800">
                                  LKR {Math.round(it.standardTotalCost).toLocaleString()}
                                </td>
                                <td className="p-3.5 text-right font-mono font-bold text-slate-900">
                                  LKR {it.actualTotalCost.toLocaleString()}
                                  <div className="text-[10px] text-slate-400 font-normal">
                                    {it.costRecordsCount} records
                                  </div>
                                </td>
                                <td className="p-3.5 text-right font-mono">
                                  <span className={`font-bold ${isFavorable ? 'text-emerald-800' : 'text-rose-800'}`}>
                                    {isFavorable ? '+' : ''}LKR {it.costVarianceAmount.toLocaleString()}
                                  </span>
                                  <div className={`text-[10px] font-semibold ${isFavorable ? 'text-emerald-700' : 'text-rose-700'}`}>
                                    {isFavorable ? 'F (Savings)' : 'U (Overrun)'} ({it.costVariancePercent.toFixed(1)}%)
                                  </div>
                                </td>
                                <td className="p-3.5 text-center font-mono">
                                  <div className="font-bold text-slate-800">
                                    {it.actualMarginPercent.toFixed(1)}%
                                  </div>
                                  <div className="text-[10px] text-slate-400">
                                    Std: {it.standardMarginPercent.toFixed(1)}% ({it.marginVariancePercent >= 0 ? '+' : ''}{it.marginVariancePercent.toFixed(1)}%)
                                  </div>
                                </td>
                                <td className="p-3.5 text-center">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                    it.healthStatus === 'EXCELLENT' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                                    it.healthStatus === 'ON_TRACK' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                                    it.healthStatus === 'WARNING' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                                    'bg-rose-50 text-rose-800 border-rose-200'
                                  }`}>
                                    {it.healthStatus.replace('_', ' ')}
                                  </span>
                                </td>
                                <td className="p-3.5 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenLogCost(it.id)}
                                      className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 text-[11px] font-semibold rounded transition-colors"
                                      title="Log actual cost voucher for this item"
                                    >
                                      + Log Cost
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setInspectingItem(it)}
                                      className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                                      title="Inspect variance breakdown"
                                    >
                                      <HelpCircle className="w-4 h-4" />
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
                </div>
              )}

              {/* TAB 3: STANDARD COST VARIANCE MATRIX (ACCOUNTING TECHNIQUES) */}
              {activeTab === 'VARIANCE_MATRIX' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Standard Costing Decomposition by Item</h3>
                        <p className="text-xs text-slate-500">
                          Granular calculation of Material Price Variance (MPV), Material Usage (MUV), Labour Rate (LRV), and Efficiency (LEV)
                        </p>
                      </div>
                      <span className="text-xs text-slate-500 font-mono">F = Favorable | U = Unfavorable</span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                          <tr>
                            <th className="p-3">Item Spec</th>
                            <th className="p-3 text-right">Material Price (MPV)</th>
                            <th className="p-3 text-right">Material Usage (MUV)</th>
                            <th className="p-3 text-right">Labour Rate (LRV)</th>
                            <th className="p-3 text-right">Labour Efficiency (LEV)</th>
                            <th className="p-3 text-right">Overhead Spending</th>
                            <th className="p-3 text-right">Net Item Variance</th>
                            <th className="p-3">Root Cause & Variance Notes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {evaluation.items.map(it => {
                            const v = it.variances;
                            return (
                              <tr key={it.id} className="hover:bg-slate-50/60">
                                <td className="p-3 font-semibold text-slate-900">
                                  {it.itemNo} {it.name}
                                </td>
                                <td className={`p-3 text-right font-mono font-bold ${v.materialPriceVariance >= 0 ? 'text-emerald-800' : 'text-rose-800'}`}>
                                  {v.materialPriceVariance >= 0 ? '+' : ''}{Math.round(v.materialPriceVariance).toLocaleString()} {v.materialPriceVariance >= 0 ? '(F)' : '(U)'}
                                </td>
                                <td className={`p-3 text-right font-mono font-bold ${v.materialUsageVariance >= 0 ? 'text-emerald-800' : 'text-rose-800'}`}>
                                  {v.materialUsageVariance >= 0 ? '+' : ''}{Math.round(v.materialUsageVariance).toLocaleString()} {v.materialUsageVariance >= 0 ? '(F)' : '(U)'}
                                </td>
                                <td className={`p-3 text-right font-mono font-bold ${v.labourRateVariance >= 0 ? 'text-emerald-800' : 'text-rose-800'}`}>
                                  {v.labourRateVariance >= 0 ? '+' : ''}{Math.round(v.labourRateVariance).toLocaleString()} {v.labourRateVariance >= 0 ? '(F)' : '(U)'}
                                </td>
                                <td className={`p-3 text-right font-mono font-bold ${v.labourEfficiencyVariance >= 0 ? 'text-emerald-800' : 'text-rose-800'}`}>
                                  {v.labourEfficiencyVariance >= 0 ? '+' : ''}{Math.round(v.labourEfficiencyVariance).toLocaleString()} {v.labourEfficiencyVariance >= 0 ? '(F)' : '(U)'}
                                </td>
                                <td className={`p-3 text-right font-mono font-bold ${v.overheadSpendingVariance >= 0 ? 'text-emerald-800' : 'text-rose-800'}`}>
                                  {v.overheadSpendingVariance >= 0 ? '+' : ''}{Math.round(v.overheadSpendingVariance).toLocaleString()}
                                </td>
                                <td className={`p-3 text-right font-mono font-bold ${it.costVarianceAmount >= 0 ? 'text-emerald-900 bg-emerald-50/50' : 'text-rose-900 bg-rose-50/50'}`}>
                                  {it.costVarianceAmount >= 0 ? '+' : ''}{Math.round(it.costVarianceAmount).toLocaleString()}
                                </td>
                                <td className="p-3 text-slate-500 text-[11px]">
                                  {it.costVarianceAmount >= 0 
                                    ? 'Within standard costing bounds. Good procurement efficiency.'
                                    : 'Cost overrun driven by raw materials price fluctuations & overtime hours.'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: ACTUAL COSTS LEDGER / JOURNAL */}
              {activeTab === 'COST_JOURNAL' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Project Cost Incurred Journal</h3>
                      <p className="text-xs text-slate-500">
                        Itemized log of every actual procurement receipt, labour payroll, subcontractor invoice, and ad-hoc cost
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenLogCost()}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-800 hover:bg-blue-900 text-white text-xs font-semibold rounded-lg transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Log New Actual Cost
                      </button>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                          <tr>
                            <th className="p-3.5">Date</th>
                            <th className="p-3.5">Cost Category</th>
                            <th className="p-3.5">Description & Payee</th>
                            <th className="p-3.5">Linked Item / Variant</th>
                            <th className="p-3.5">Voucher / Invoice #</th>
                            <th className="p-3.5 text-right">Qty & Unit</th>
                            <th className="p-3.5 text-right">Unit Rate</th>
                            <th className="p-3.5 text-right">Total Actual Cost</th>
                            <th className="p-3.5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {actualCostRecords.filter(r => r.projectId === currentProject.id).length === 0 ? (
                            <tr>
                              <td colSpan={9} className="p-8 text-center text-slate-400">
                                No actual cost records logged for this project yet. Click "+ Log Actual Cost" to begin recording actual expenditure.
                              </td>
                            </tr>
                          ) : (
                            actualCostRecords.filter(r => r.projectId === currentProject.id).map(record => (
                              <tr key={record.id} className="hover:bg-slate-50/70">
                                <td className="p-3.5 font-mono text-slate-600 whitespace-nowrap">
                                  {record.date}
                                </td>
                                <td className="p-3.5">
                                  <span 
                                    className="text-[10px] font-bold px-2 py-0.5 rounded text-white font-mono"
                                    style={{ backgroundColor: COST_CATEGORY_COLORS[record.costCategory] || '#64748b' }}
                                  >
                                    {record.costCategory}
                                  </span>
                                  {record.isAdHocCostItem && (
                                    <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 font-bold">
                                      Ad-hoc
                                    </span>
                                  )}
                                </td>
                                <td className="p-3.5">
                                  <div className="font-semibold text-slate-900">{record.description}</div>
                                  <div className="text-[11px] text-slate-500">
                                    {record.supplierOrPayee && `Payee: ${record.supplierOrPayee} • `}
                                    {record.costType}
                                  </div>
                                </td>
                                <td className="p-3.5 font-medium text-slate-700">
                                  {record.itemName || 'Project General Allocation'}
                                </td>
                                <td className="p-3.5 font-mono text-slate-600">
                                  {record.invoiceOrReceiptNo || '—'}
                                </td>
                                <td className="p-3.5 text-right font-mono">
                                  {record.quantity} {record.unit}
                                </td>
                                <td className="p-3.5 text-right font-mono">
                                  LKR {record.unitRate.toLocaleString()}
                                </td>
                                <td className="p-3.5 text-right font-mono font-bold text-slate-900">
                                  LKR {record.totalActualCost.toLocaleString()}
                                </td>
                                <td className="p-3.5 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleStartEditRecord(record)}
                                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                                      title="Edit Record"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (confirm('Delete this actual cost record?')) {
                                          onDeleteActualCostRecord(record.id);
                                          toast.success('Cost record deleted');
                                        }
                                      }}
                                      className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors"
                                      title="Delete Record"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        )}
      </main>

      {/* MODAL 1: LOG ACTUAL COST RECORD */}
      {isLogCostModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900">
                  {editingCostRecord ? 'Edit Actual Cost Record' : 'Log Actual Cost Incurred'}
                </h3>
                <p className="text-xs text-slate-500">Record voucher against standard project budget</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsLogCostModalOpen(false);
                  setEditingCostRecord(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitCostRecord} className="p-6 space-y-4 text-xs">
              {/* Linked Item Dropdown */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Target Item in Project Scope
                </label>
                <select
                  value={costFormItemId}
                  onChange={(e) => {
                    setCostFormItemId(e.target.value);
                    const item = evaluation?.items.find(i => i.id === e.target.value);
                    if (item) setCostFormUnit(item.unit);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">General Project Allocation (Unassigned to specific item)</option>
                  {evaluation?.items.map(it => (
                    <option key={it.id} value={it.id}>
                      {it.itemNo} - {it.name} ({it.variantCode || it.category})
                    </option>
                  ))}
                </select>
              </div>

              {/* Category & Cost Type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cost Category</label>
                  <select
                    value={costFormCategory}
                    onChange={(e) => setCostFormCategory(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="MATERIAL">Direct Material</option>
                    <option value="LABOUR">Direct Labour</option>
                    <option value="OVERHEAD">Overhead / Machinery</option>
                    <option value="SUBCONTRACT">Subcontracting</option>
                    <option value="EQUIPMENT">Equipment Rental</option>
                    <option value="OTHER">Other Expense</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cost Type / Allocation</label>
                  <input
                    type="text"
                    value={costFormType}
                    onChange={(e) => setCostFormType(e.target.value)}
                    placeholder="e.g. Raw Profile Extrusion"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description / Purpose</label>
                <input
                  type="text"
                  value={costFormDescription}
                  onChange={(e) => setCostFormDescription(e.target.value)}
                  placeholder="e.g. Extrusion delivery for 2nd floor windows"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Invoice # and Supplier */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Invoice / Receipt #</label>
                  <input
                    type="text"
                    value={costFormInvoiceNo}
                    onChange={(e) => setCostFormInvoiceNo(e.target.value)}
                    placeholder="e.g. INV-AL-8832"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Supplier / Payee</label>
                  <input
                    type="text"
                    value={costFormSupplier}
                    onChange={(e) => setCostFormSupplier(e.target.value)}
                    placeholder="e.g. Alumex PLC"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Quantity, Rate, Total */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    step="any"
                    value={costFormQty}
                    onChange={(e) => {
                      const q = Number(e.target.value);
                      setCostFormQty(q);
                      if (costFormUnitRate > 0) {
                        setCostFormTotalAmount(Math.round(q * costFormUnitRate));
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Unit Rate (LKR)</label>
                  <input
                    type="number"
                    step="any"
                    value={costFormUnitRate}
                    onChange={(e) => {
                      const r = Number(e.target.value);
                      setCostFormUnitRate(r);
                      if (costFormQty > 0) {
                        setCostFormTotalAmount(Math.round(costFormQty * r));
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Total Actual (LKR)</label>
                  <input
                    type="number"
                    step="any"
                    value={costFormTotalAmount}
                    onChange={(e) => setCostFormTotalAmount(Number(e.target.value))}
                    className="w-full bg-blue-50/50 border border-blue-200 rounded-lg p-2 text-blue-900 font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Date & Notes */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Incurred Date</label>
                  <input
                    type="date"
                    value={costFormDate}
                    onChange={(e) => setCostFormDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Internal Notes</label>
                  <input
                    type="text"
                    value={costFormNotes}
                    onChange={(e) => setCostFormNotes(e.target.value)}
                    placeholder="e.g. Overtime approved by site lead"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsLogCostModalOpen(false);
                    setEditingCostRecord(null);
                  }}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-800 hover:bg-blue-900 text-white rounded-lg font-semibold shadow-2xs"
                >
                  {editingCostRecord ? 'Save Changes' : 'Record Actual Cost'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD VARIANT TO PROJECT WITH STANDARD BOM BASELINE */}
      {isAddVariantModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900">Add Item Variant to Project</h3>
                <p className="text-xs text-slate-500">Injects variant with standard BOM cost baseline into project scope</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddVariantModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddVariantSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Product Variant</label>
                <select
                  value={selectedVariantId}
                  onChange={(e) => {
                    const vId = e.target.value;
                    setSelectedVariantId(vId);
                    const v = productVariants.find(item => item.id === vId);
                    if (v) {
                      setVariantAddRate(v.pricing?.sellingPrice || 3500);
                      setVariantAddUnit(v.unit || 'sqft');
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">-- Choose from Catalog Product Variants --</option>
                  {productVariants.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.variantCode} - {v.variantName} (Std Cost: LKR {Math.round(v.bom?.totalCost || 0).toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              {selectedVariantId && (() => {
                const v = productVariants.find(item => item.id === selectedVariantId);
                if (!v) return null;
                return (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>Standard Rolled-Up BOM Cost:</span>
                      <span className="font-mono text-blue-800">
                        LKR {Math.round(v.bom?.totalCost || 0).toLocaleString()} /{v.unit || 'sqft'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 grid grid-cols-3 gap-2 pt-1 border-t border-slate-200">
                      <div>Material: LKR {Math.round(v.bom?.directMaterialCost || 0).toLocaleString()}</div>
                      <div>Labour: LKR {Math.round(v.bom?.directLabourCost || 0).toLocaleString()}</div>
                      <div>Overhead: LKR {Math.round(v.bom?.totalOverheadCost || 0).toLocaleString()}</div>
                    </div>
                  </div>
                );
              })()}

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contract Quantity</label>
                  <input
                    type="number"
                    step="any"
                    value={variantAddQty}
                    onChange={(e) => setVariantAddQty(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Unit</label>
                  <input
                    type="text"
                    value={variantAddUnit}
                    onChange={(e) => setVariantAddUnit(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Offered Rate (LKR)</label>
                  <input
                    type="number"
                    step="any"
                    value={variantAddRate}
                    onChange={(e) => setVariantAddRate(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Scope & Specification Notes</label>
                <textarea
                  rows={2}
                  value={variantAddNotes}
                  onChange={(e) => setVariantAddNotes(e.target.value)}
                  placeholder="Location or specific variation instructions"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddVariantModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-800 hover:bg-blue-900 text-white rounded-lg font-semibold shadow-2xs"
                >
                  Add Variant Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD AD-HOC / UNBUDGETED COST ITEM */}
      {isAddAdHocCostModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-amber-50">
              <div>
                <h3 className="font-bold text-amber-950">Add Ad-hoc / New Cost Item</h3>
                <p className="text-xs text-amber-800">For unbudgeted costs without predefined standard costs</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddAdHocCostModalOpen(false)}
                className="p-1 text-amber-800 hover:text-amber-950 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddAdHocSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Item Title / Cost Name</label>
                <input
                  type="text"
                  value={adHocTitle}
                  onChange={(e) => setAdHocTitle(e.target.value)}
                  placeholder="e.g. Unforeseen Scaffold Hoist Permit"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={adHocCategory}
                    onChange={(e) => setAdHocCategory(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-hidden"
                  >
                    <option value="OTHER">Other / Site Unbudgeted</option>
                    <option value="EQUIPMENT">Equipment Rental</option>
                    <option value="SUBCONTRACT">Specialist Subcontract</option>
                    <option value="MATERIAL">Emergency Material</option>
                    <option value="LABOUR">Unbudgeted Labour Shift</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cost Sub-Type</label>
                  <input
                    type="text"
                    value={adHocCostType}
                    onChange={(e) => setAdHocCostType(e.target.value)}
                    placeholder="e.g. Emergency Hoisting"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Actual Amount (LKR)</label>
                <input
                  type="number"
                  step="any"
                  value={adHocAmount}
                  onChange={(e) => setAdHocAmount(Number(e.target.value))}
                  className="w-full bg-amber-50/50 border border-amber-200 rounded-lg p-2 text-slate-900 font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payee / Supplier</label>
                  <input
                    type="text"
                    value={adHocSupplier}
                    onChange={(e) => setAdHocSupplier(e.target.value)}
                    placeholder="e.g. Municipal Council"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Invoice / Receipt #</label>
                  <input
                    type="text"
                    value={adHocInvoiceNo}
                    onChange={(e) => setAdHocInvoiceNo(e.target.value)}
                    placeholder="e.g. REC-9921"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Justification & Variation Claim Notes</label>
                <textarea
                  rows={2}
                  value={adHocReason}
                  onChange={(e) => setAdHocReason(e.target.value)}
                  placeholder="Explain why this cost was incurred and whether it can be claimed as a project variation..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddAdHocCostModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-800 hover:bg-amber-900 text-white rounded-lg font-semibold shadow-2xs"
                >
                  Add Cost Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: ITEM VARIANCE INSPECTION BREAKDOWN */}
      {inspectingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div>
                <div className="text-[10px] font-mono font-bold text-blue-800">
                  {inspectingItem.itemNo} • {inspectingItem.variantCode || 'Catalog Item'}
                </div>
                <h3 className="font-bold text-slate-900 text-base">{inspectingItem.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectingItem(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {/* Financial Rollup Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Offered Revenue</div>
                  <div className="font-bold font-mono text-slate-900 mt-0.5">
                    LKR {inspectingItem.offeredTotalRevenue.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    LKR {inspectingItem.offeredUnitRate.toLocaleString()} /{inspectingItem.unit}
                  </div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Standard Cost</div>
                  <div className="font-bold font-mono text-slate-800 mt-0.5">
                    LKR {Math.round(inspectingItem.standardTotalCost).toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Std Margin: {inspectingItem.standardMarginPercent.toFixed(1)}%
                  </div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Actual Incurred</div>
                  <div className="font-bold font-mono text-slate-900 mt-0.5">
                    LKR {inspectingItem.actualTotalCost.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Act Margin: {inspectingItem.actualMarginPercent.toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Standard Cost Variance Table */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-100 font-bold text-slate-800 border-b border-slate-200 flex justify-between">
                  <span>Standard Cost Variance Decomposition</span>
                  <span className={inspectingItem.costVarianceAmount >= 0 ? 'text-emerald-800' : 'text-rose-800'}>
                    Net: {inspectingItem.costVarianceAmount >= 0 ? '+' : ''}LKR {inspectingItem.costVarianceAmount.toLocaleString()}
                  </span>
                </div>
                <div className="p-3 space-y-2">
                  <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                    <span className="font-semibold text-slate-700">Material Price Variance (MPV)</span>
                    <span className={`font-mono font-bold ${inspectingItem.variances.materialPriceVariance >= 0 ? 'text-emerald-800' : 'text-rose-800'}`}>
                      {inspectingItem.variances.materialPriceVariance >= 0 ? '+' : ''}LKR {Math.round(inspectingItem.variances.materialPriceVariance).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                    <span className="font-semibold text-slate-700">Material Usage Variance (MUV)</span>
                    <span className={`font-mono font-bold ${inspectingItem.variances.materialUsageVariance >= 0 ? 'text-emerald-800' : 'text-rose-800'}`}>
                      {inspectingItem.variances.materialUsageVariance >= 0 ? '+' : ''}LKR {Math.round(inspectingItem.variances.materialUsageVariance).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                    <span className="font-semibold text-slate-700">Labour Rate Variance (LRV)</span>
                    <span className={`font-mono font-bold ${inspectingItem.variances.labourRateVariance >= 0 ? 'text-emerald-800' : 'text-rose-800'}`}>
                      {inspectingItem.variances.labourRateVariance >= 0 ? '+' : ''}LKR {Math.round(inspectingItem.variances.labourRateVariance).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                    <span className="font-semibold text-slate-700">Labour Efficiency Variance (LEV)</span>
                    <span className={`font-mono font-bold ${inspectingItem.variances.labourEfficiencyVariance >= 0 ? 'text-emerald-800' : 'text-rose-800'}`}>
                      {inspectingItem.variances.labourEfficiencyVariance >= 0 ? '+' : ''}LKR {Math.round(inspectingItem.variances.labourEfficiencyVariance).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="font-semibold text-slate-700">Overhead Spending Variance</span>
                    <span className={`font-mono font-bold ${inspectingItem.variances.overheadSpendingVariance >= 0 ? 'text-emerald-800' : 'text-rose-800'}`}>
                      {inspectingItem.variances.overheadSpendingVariance >= 0 ? '+' : ''}LKR {Math.round(inspectingItem.variances.overheadSpendingVariance).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setInspectingItem(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg"
                >
                  Close Inspection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
