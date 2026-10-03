import React, { useState, useMemo } from 'react';
import { Project, BOQItem, VariationStatus, Quote } from '../types';
import { 
  SlidersHorizontal, 
  Layers, 
  FileText, 
  Download, 
  TrendingUp, 
  PlusCircle, 
  Trash2, 
  CreditCard, 
  Scale, 
  Search, 
  Package, 
  Box, 
  Printer, 
  ChevronDown, 
  ChevronUp,
  FileSpreadsheet,
  Building2,
  AlertCircle,
  Folder,
  List
} from 'lucide-react';
import { cn } from '../lib/utils';

interface VariationManagerPortalProps {
  projects: Project[];
  quotes?: Quote[];
  onUpdateProjectStatus: (id: string, status: Project['status']) => void;
  onDeleteProject: (id: string) => void;
  onSelectProject: (project: Project, tab?: 'overview' | 'variations' | 'payments' | 'audit') => void;
  onOpenDownloadPortal: (type: 'Project' | 'Variation' | 'Timeline' | 'Invoice' | 'Quote' | 'Dashboard' | 'AllDocuments' | 'AuditLog', data: any) => void;
  onNavigateToPostEvaluation: (project: Project) => void;
}

// Helper to determine if an item is a leaf item for total calculations
export const isLeafItem = (item: BOQItem, index: number, allItems: BOQItem[]) => {
  if (item.itemType === 'Title') return false;
  if (item.itemType === 'Sub') return true;
  if (item.itemType === 'Main') {
    const nextItem = allItems[index + 1];
    return !nextItem || nextItem.itemType !== 'Sub';
  }
  return true;
};

// Formats currency nicely
const formatLKR = (val: number) => {
  return 'LKR ' + Math.round(val).toLocaleString();
};

export const VariationManagerPortal: React.FC<VariationManagerPortalProps> = ({
  projects,
  onUpdateProjectStatus,
  onDeleteProject,
  onSelectProject,
  onOpenDownloadPortal,
  onNavigateToPostEvaluation
}) => {
  const [activeViewMode, setActiveViewMode] = useState<'list' | 'cards' | 'material-matrix' | 'full-reports'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'In Progress' | 'Completed' | 'On Hold'>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'Additional' | 'Omitted'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>('ALL');
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});

  const toggleProjectExpand = (projectId: string) => {
    setExpandedProjects(prev => ({
      ...prev,
      [projectId]: !prev[projectId]
    }));
  };

  // -------------------------------------------------------------
  // Calculate Global Portfolio & Variation Metrics
  // -------------------------------------------------------------
  const portfolioMetrics = useMemo(() => {
    let totalOriginalSum = 0;
    let totalAdditionsSum = 0;
    let totalOmissionsSum = 0;
    let totalAddedItemsCount = 0;
    let totalOmittedItemsCount = 0;
    let projectsWithVariationsCount = 0;

    const projectCalculations = projects.map(p => {
      const leafItems = p.items.filter((item, index) => isLeafItem(item, index, p.items));
      const originalTotal = p.originalSum ?? leafItems
        .filter(i => i.variationStatus !== 'Additional')
        .reduce((sum, i) => sum + i.amount, 0);
      
      const additionalItems = leafItems.filter(i => i.variationStatus === 'Additional');
      const omittedItems = leafItems.filter(i => i.variationStatus === 'Omitted');

      const additionalTotal = additionalItems.reduce((sum, i) => sum + i.amount, 0);
      const omittedTotal = omittedItems.reduce((sum, i) => sum + i.amount, 0);
      const revisedTotal = originalTotal + additionalTotal - omittedTotal;
      const netChange = additionalTotal - omittedTotal;
      const hasVariations = additionalItems.length > 0 || omittedItems.length > 0;

      if (hasVariations) projectsWithVariationsCount++;

      totalOriginalSum += originalTotal;
      totalAdditionsSum += additionalTotal;
      totalOmissionsSum += omittedTotal;
      totalAddedItemsCount += additionalItems.length;
      totalOmittedItemsCount += omittedItems.length;

      return {
        project: p,
        originalTotal,
        additionalTotal,
        omittedTotal,
        revisedTotal,
        netChange,
        hasVariations,
        additionalItems,
        omittedItems,
        leafItems
      };
    });

    const cumulativeNetDelta = totalAdditionsSum - totalOmissionsSum;
    const totalRevisedSum = totalOriginalSum + cumulativeNetDelta;
    const netDeltaPercent = totalOriginalSum > 0 ? (cumulativeNetDelta / totalOriginalSum) * 100 : 0;

    const inProgressCount = projects.filter(p => p.status === 'In Progress').length;
    const completedCount = projects.filter(p => p.status === 'Completed').length;
    const onHoldCount = projects.filter(p => p.status === 'On Hold').length;

    return {
      totalProjects: projects.length,
      inProgressCount,
      completedCount,
      onHoldCount,
      projectsWithVariationsCount,
      unchangedProjectsCount: projects.length - projectsWithVariationsCount,
      totalOriginalSum,
      totalAdditionsSum,
      totalOmissionsSum,
      cumulativeNetDelta,
      totalRevisedSum,
      netDeltaPercent,
      totalAddedItemsCount,
      totalOmittedItemsCount,
      projectCalculations
    };
  }, [projects]);

  // -------------------------------------------------------------
  // Flatten All Altered Product & Material Variation Items
  // -------------------------------------------------------------
  const allVariationItems = useMemo(() => {
    const list: Array<{
      variationCode: string;
      projectId: string;
      projectCode: string;
      quoteNo: string;
      projectName: string;
      clientName: string;
      projectStatus: string;
      item: BOQItem;
      variationType: VariationStatus;
      category: string;
      materialSpecText: string;
    }> = [];

    portfolioMetrics.projectCalculations.forEach(calc => {
      const pCode = calc.project.projectCode || calc.project.id.slice(0, 10);
      const qNo = calc.project.originalQuoteNo || calc.project.quoteId || '';

      calc.leafItems.forEach((item, itemIdx) => {
        if (item.variationStatus === 'Additional' || item.variationStatus === 'Omitted') {
          // Extract material summary text
          let specSummary = item.category || 'General Works';
          const spec = item.specification;
          if (spec) {
            const parts: string[] = [];
            if (spec.core?.systemType) parts.push(spec.core.systemType);
            if (spec.materials?.aluminium && spec.materials.aluminium.length > 0) {
              const al = spec.materials.aluminium[0];
              parts.push(`Alum: ${al.series || al.brand || ''} ${al.finish || ''}`.trim());
            }
            if (spec.materials?.glass && spec.materials.glass.length > 0) {
              const gl = spec.materials.glass[0];
              parts.push(`Glass: ${gl.thickness || ''} ${gl.type || ''}`.trim());
            }
            if (spec.materials?.accessories && spec.materials.accessories.length > 0) {
              parts.push(`Hdw: ${spec.materials.accessories.map(a => a.name).join(', ')}`);
            }
            if (parts.length > 0) specSummary = parts.join(' · ');
          }

          const variationCode = item.pvcCode || item.productCode || (item.no ? `VO-${item.no}` : `VAR-${String(itemIdx + 1).padStart(3, '0')}`);

          list.push({
            variationCode,
            projectId: calc.project.id,
            projectCode: pCode,
            quoteNo: qNo,
            projectName: calc.project.projectName,
            clientName: calc.project.client?.name || 'Client',
            projectStatus: calc.project.status,
            item,
            variationType: item.variationStatus,
            category: item.category || 'Architectural Aluminium',
            materialSpecText: specSummary
          });
        }
      });
    });

    return list;
  }, [portfolioMetrics]);

  // All distinct categories for filtering
  const distinctCategories = useMemo(() => {
    const set = new Set<string>();
    allVariationItems.forEach(i => {
      if (i.category) set.add(i.category);
    });
    return Array.from(set).sort();
  }, [allVariationItems]);

  // Filtered variation items
  const filteredVariationItems = useMemo(() => {
    return allVariationItems.filter(vi => {
      if (selectedProjectFilter !== 'ALL' && vi.projectId !== selectedProjectFilter && vi.projectCode !== selectedProjectFilter) return false;
      if (typeFilter !== 'ALL' && vi.variationType !== typeFilter) return false;
      if (categoryFilter !== 'ALL' && vi.category !== categoryFilter) return false;
      if (statusFilter !== 'ALL' && vi.projectStatus !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = vi.item.name.toLowerCase().includes(q);
        const matchDesc = (vi.item.description || '').toLowerCase().includes(q);
        const matchCode = (vi.item.productCode || vi.item.pvcCode || vi.variationCode || '').toLowerCase().includes(q);
        const matchProj = vi.projectName.toLowerCase().includes(q);
        const matchProjCode = vi.projectCode.toLowerCase().includes(q);
        const matchQuote = vi.quoteNo.toLowerCase().includes(q);
        const matchClient = vi.clientName.toLowerCase().includes(q);
        const matchSpec = vi.materialSpecText.toLowerCase().includes(q);
        if (!matchName && !matchDesc && !matchCode && !matchProj && !matchProjCode && !matchQuote && !matchClient && !matchSpec) return false;
      }
      return true;
    });
  }, [allVariationItems, selectedProjectFilter, typeFilter, categoryFilter, statusFilter, searchQuery]);

  // Filtered projects for Cards view
  const filteredProjectCalcs = useMemo(() => {
    return portfolioMetrics.projectCalculations.filter(calc => {
      if (statusFilter !== 'ALL' && calc.project.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchProj = calc.project.projectName.toLowerCase().includes(q);
        const matchClient = calc.project.client?.name?.toLowerCase().includes(q);
        const matchQuote = (calc.project.originalQuoteNo || '').toLowerCase().includes(q);
        const matchItems = calc.leafItems.some(i => 
          i.name.toLowerCase().includes(q) || 
          (i.description || '').toLowerCase().includes(q) ||
          (i.productCode || '').toLowerCase().includes(q)
        );
        if (!matchProj && !matchClient && !matchQuote && !matchItems) return false;
      }
      return true;
    });
  }, [portfolioMetrics, statusFilter, searchQuery]);

  // Category breakdown for reporting
  const categoryImpactReport = useMemo(() => {
    const map: Record<string, { additions: number; omissions: number; itemsCount: number }> = {};
    allVariationItems.forEach(vi => {
      const cat = vi.category || 'General';
      if (!map[cat]) {
        map[cat] = { additions: 0, omissions: 0, itemsCount: 0 };
      }
      map[cat].itemsCount += 1;
      if (vi.variationType === 'Additional') {
        map[cat].additions += vi.item.amount;
      } else if (vi.variationType === 'Omitted') {
        map[cat].omissions += vi.item.amount;
      }
    });

    return Object.entries(map).map(([category, stats]) => ({
      category,
      additions: stats.additions,
      omissions: stats.omissions,
      netDelta: stats.additions - stats.omissions,
      itemsCount: stats.itemsCount
    })).sort((a, b) => Math.abs(b.netDelta) - Math.abs(a.netDelta));
  }, [allVariationItems]);

  // Export CSV handler
  const handleExportCSV = () => {
    const headers = [
      'Project Name',
      'Client',
      'Item Code',
      'Item Description',
      'Category',
      'Material / Technical Specs',
      'Variation Status',
      'Unit',
      'Quantity',
      'Rate (LKR)',
      'Total Amount (LKR)'
    ];

    const rows = allVariationItems.map(vi => [
      `"${vi.projectName.replace(/"/g, '""')}"`,
      `"${vi.clientName.replace(/"/g, '""')}"`,
      `"${(vi.item.productCode || vi.item.pvcCode || vi.item.no || '').replace(/"/g, '""')}"`,
      `"${vi.item.name.replace(/"/g, '""')}"`,
      `"${vi.category.replace(/"/g, '""')}"`,
      `"${vi.materialSpecText.replace(/"/g, '""')}"`,
      vi.variationType,
      vi.item.unit || 'Nos',
      vi.item.qty,
      vi.item.rate,
      vi.item.amount
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Variation_Scope_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-3 pb-10 font-sans text-slate-900">
      {/* ------------------------------------------------------------- */}
      {/* 1. TOP RIBBON WITH INTEGRATED EXECUTIVE SUMMARY ROW           */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        {/* Header Row: Title, Description, and Primary Actions */}
        <header className="px-5 py-2.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-white">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <SlidersHorizontal size={16} />
            </div>
            <div className="flex items-baseline gap-2 min-w-0">
              <h1 className="text-sm font-bold text-slate-900 whitespace-nowrap">Variation & Scope Manager</h1>
              <span className="text-xs text-slate-500 font-normal truncate hidden md:inline">
                • Commercial governance for additions, omissions, material schedules & revised contract values
              </span>
            </div>
          </div>

          {/* Quick Global Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              title="Download Variation Orders Spreadsheet"
            >
              <FileSpreadsheet size={13} className="text-emerald-600" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (projects.length > 0) {
                  onOpenDownloadPortal('Variation', projects[0]);
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              <Download size={13} />
              <span>Full VO Dossier</span>
            </button>
          </div>
        </header>

        {/* SUMMARY ROW: Instant Visibility of Project Count & Cumulative Net Variation Delta */}
        <div className="px-5 py-3 bg-slate-50/70 border-b border-slate-200/80">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 items-center">
            {/* Total Project Count Metric */}
            <div className="flex flex-col">
              <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                <Building2 size={12} className="text-slate-400" />
                <span>Total Projects</span>
              </div>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-lg font-bold font-mono text-slate-900 leading-tight">
                  {portfolioMetrics.totalProjects}
                </span>
                <span className="text-[11px] text-slate-500">projects</span>
              </div>
              <div className="text-[10px] text-slate-400 font-normal mt-0.5 truncate">
                {portfolioMetrics.inProgressCount} Active · {portfolioMetrics.completedCount} Done
              </div>
            </div>

            {/* Projects with Variations */}
            <div className="flex flex-col">
              <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                <Layers size={12} className="text-slate-400" />
                <span>Scope Status</span>
              </div>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-lg font-bold font-mono text-slate-900 leading-tight">
                  {portfolioMetrics.projectsWithVariationsCount}
                </span>
                <span className="text-[11px] text-slate-500">with variations</span>
              </div>
              <div className="text-[10px] text-slate-400 font-normal mt-0.5 truncate">
                {portfolioMetrics.unchangedProjectsCount} on baseline scope
              </div>
            </div>

            {/* Cumulative Net Variation Delta (Instant Visibility) */}
            <div className="flex flex-col col-span-2 md:col-span-2 lg:col-span-2 p-2.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                  Cumulative Net Variation Delta
                </span>
                <span className={cn(
                  "text-[11px] font-bold font-mono px-2 py-0.5 rounded-md",
                  portfolioMetrics.cumulativeNetDelta >= 0 
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60" 
                    : "bg-rose-50 text-rose-700 border border-rose-200/60"
                )}>
                  {portfolioMetrics.cumulativeNetDelta >= 0 ? '+' : ''}{portfolioMetrics.netDeltaPercent.toFixed(1)}% shift
                </span>
              </div>

              <div className="flex items-baseline gap-2 mt-1">
                <span className={cn(
                  "text-xl font-extrabold font-mono tracking-tight",
                  portfolioMetrics.cumulativeNetDelta >= 0 ? "text-emerald-700" : "text-rose-700"
                )}>
                  {portfolioMetrics.cumulativeNetDelta >= 0 ? '+' : '-'} {formatLKR(Math.abs(portfolioMetrics.cumulativeNetDelta))}
                </span>
              </div>

              <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-1 font-mono pt-1 border-t border-slate-100">
                <span className="text-emerald-700 font-semibold">
                  Add: +{formatLKR(portfolioMetrics.totalAdditionsSum)} ({portfolioMetrics.totalAddedItemsCount})
                </span>
                <span className="text-slate-300">|</span>
                <span className="text-rose-700 font-semibold">
                  Omit: -{formatLKR(portfolioMetrics.totalOmissionsSum)} ({portfolioMetrics.totalOmittedItemsCount})
                </span>
              </div>
            </div>

            {/* Original vs Revised Sums */}
            <div className="flex flex-col">
              <span className="text-[11px] text-slate-500 font-medium">Original Portfolio Sum</span>
              <span className="text-sm font-bold font-mono text-slate-800 mt-0.5">
                {formatLKR(portfolioMetrics.totalOriginalSum)}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5">Initial awarded contracts</span>
            </div>

            <div className="flex flex-col">
              <span className="text-[11px] text-slate-500 font-medium">Revised Portfolio Sum</span>
              <span className="text-sm font-bold font-mono text-orange-600 mt-0.5">
                {formatLKR(portfolioMetrics.totalRevisedSum)}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5">Current reconciled value</span>
            </div>
          </div>
        </div>

        {/* View Switcher & Filter Ribbon */}
        <div className="px-5 py-2 flex flex-wrap items-center justify-between gap-3 bg-white text-xs">
          {/* View Mode Buttons */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg gap-0.5">
            <button
              type="button"
              onClick={() => setActiveViewMode('list')}
              className={cn(
                "px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer flex items-center gap-1.5",
                activeViewMode === 'list'
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <List size={13} className={activeViewMode === 'list' ? "text-orange-500" : "text-slate-400"} />
              <span>List View (One-Line Records)</span>
              <span className="text-[10px] font-mono text-slate-400">({allVariationItems.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveViewMode('cards')}
              className={cn(
                "px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer flex items-center gap-1.5",
                activeViewMode === 'cards'
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <Building2 size={13} className={activeViewMode === 'cards' ? "text-orange-500" : "text-slate-400"} />
              <span>Project Cards</span>
              <span className="text-[10px] font-mono text-slate-400">({projects.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveViewMode('material-matrix')}
              className={cn(
                "px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer flex items-center gap-1.5",
                activeViewMode === 'material-matrix'
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <Package size={13} className={activeViewMode === 'material-matrix' ? "text-orange-500" : "text-slate-400"} />
              <span>Product & Material Detail</span>
              <span className="text-[10px] font-mono text-slate-400">({allVariationItems.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveViewMode('full-reports')}
              className={cn(
                "px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer flex items-center gap-1.5",
                activeViewMode === 'full-reports'
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <FileText size={13} className={activeViewMode === 'full-reports' ? "text-orange-500" : "text-slate-400"} />
              <span>Full Reports & KPIs</span>
            </button>
          </div>

          {/* Quick Search & Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative w-48 sm:w-60">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search PK, Project FK, Quote FK, items..."
                className="w-full pl-8 pr-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium placeholder:text-slate-400 focus:outline-hidden focus:border-orange-500 transition-all"
              />
            </div>

            {/* Project Code (FK) Filter */}
            <select
              value={selectedProjectFilter}
              onChange={(e) => setSelectedProjectFilter(e.target.value)}
              className="px-2.5 py-1 bg-orange-50/70 border border-orange-200/80 rounded-lg text-xs font-semibold text-orange-900 outline-none cursor-pointer max-w-[180px] truncate"
            >
              <option value="ALL">All Projects (FK)</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>
                  [{p.projectCode || p.id.slice(0, 8)}] {p.projectName}
                </option>
              ))}
            </select>

            {(activeViewMode === 'cards' || activeViewMode === 'list') && (
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-none cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="On Hold">On Hold</option>
              </select>
            )}

            {(activeViewMode === 'material-matrix' || activeViewMode === 'list') && (
              <>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as any)}
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-none cursor-pointer"
                >
                  <option value="ALL">All Variations (Add + Omit)</option>
                  <option value="Additional">Additions Only</option>
                  <option value="Omitted">Omissions Only</option>
                </select>

                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-none cursor-pointer max-w-[150px] truncate"
                >
                  <option value="ALL">All Categories</option>
                  {distinctCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. EXECUTIVE VARIATION KPIS STRIP                             */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* KPI 1: Cumulative Delta Impact */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <div className="w-7 h-7 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center">
              <TrendingUp size={15} />
            </div>
            <span className="text-[11px] font-semibold text-slate-500">Commercial Delta</span>
          </div>
          <p className="text-xs text-slate-500 font-normal">Cumulative Net Scope Delta</p>
          <h3 className="text-lg font-bold font-mono text-slate-900 mt-0.5">
            {portfolioMetrics.cumulativeNetDelta >= 0 ? '+' : '-'} {formatLKR(Math.abs(portfolioMetrics.cumulativeNetDelta))}
          </h3>
          <p className="text-[10px] text-slate-400 mt-1">
            {portfolioMetrics.netDeltaPercent >= 0 ? '+' : ''}{portfolioMetrics.netDeltaPercent.toFixed(1)}% shift from baseline sum
          </p>
        </div>

        {/* KPI 2: Portfolio Scope Exposure */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <div className="w-7 h-7 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
              <Building2 size={15} />
            </div>
            <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
              {portfolioMetrics.totalProjects > 0 
                ? Math.round((portfolioMetrics.projectsWithVariationsCount / portfolioMetrics.totalProjects) * 100) 
                : 0}% Active
            </span>
          </div>
          <p className="text-xs text-slate-500 font-normal">Variation Exposure</p>
          <h3 className="text-lg font-bold font-mono text-slate-900 mt-0.5">
            {portfolioMetrics.projectsWithVariationsCount} / {portfolioMetrics.totalProjects} Projects
          </h3>
          <p className="text-[10px] text-slate-400 mt-1">
            Projects with active additions or deductions
          </p>
        </div>

        {/* KPI 3: Line Items Affected */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <div className="w-7 h-7 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
              <Box size={15} />
            </div>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
              {allVariationItems.length} Total Lines
            </span>
          </div>
          <p className="text-xs text-slate-500 font-normal">Products & Materials Impacted</p>
          <h3 className="text-lg font-bold font-mono text-slate-900 mt-0.5">
            +{portfolioMetrics.totalAddedItemsCount} Add / -{portfolioMetrics.totalOmittedItemsCount} Omit
          </h3>
          <p className="text-[10px] text-slate-400 mt-1">
            Distinct BOQ line items altered across scope
          </p>
        </div>

        {/* KPI 4: Financial Governance Index */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <div className="w-7 h-7 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
              <Scale size={15} />
            </div>
            <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
              Reconciled
            </span>
          </div>
          <p className="text-xs text-slate-500 font-normal">Average Net VO / Project</p>
          <h3 className="text-lg font-bold font-mono text-slate-900 mt-0.5">
            {portfolioMetrics.projectsWithVariationsCount > 0 
              ? formatLKR(portfolioMetrics.cumulativeNetDelta / portfolioMetrics.projectsWithVariationsCount)
              : 'LKR 0'}
          </h3>
          <p className="text-[10px] text-slate-400 mt-1">
            Across {portfolioMetrics.projectsWithVariationsCount || 1} modified contracts
          </p>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 0. VIEW 0: ONE-LINE ROW ENTERPRISE LIST VIEW                  */}
      {/* ------------------------------------------------------------- */}
      {activeViewMode === 'list' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[10px] font-bold text-slate-600 uppercase tracking-wider select-none whitespace-nowrap">
                  <th className="py-2.5 px-3">Variation ID (PK)</th>
                  <th className="py-2.5 px-3">Project Code (FK)</th>
                  <th className="py-2.5 px-3">Quotation # (FK)</th>
                  <th className="py-2.5 px-3">Project Name</th>
                  <th className="py-2.5 px-3">Client</th>
                  <th className="py-2.5 px-3 text-center">Type</th>
                  <th className="py-2.5 px-3">BOQ Line Item / Scope</th>
                  <th className="py-2.5 px-3 text-right">Qty & Unit</th>
                  <th className="py-2.5 px-3 text-right">Rate</th>
                  <th className="py-2.5 px-3 text-right">Variation Sum</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVariationItems.length > 0 ? (
                  filteredVariationItems.map((vi, idx) => {
                    const targetProj = projects.find(p => p.id === vi.projectId);
                    return (
                      <tr key={`${vi.projectId}-${vi.item.id}-${idx}`} className="hover:bg-slate-50/70 transition-colors whitespace-nowrap group">
                        {/* PK: Variation ID */}
                        <td className="py-2.5 px-3">
                          <button
                            onClick={() => targetProj && onSelectProject(targetProj, 'variations')}
                            className="font-mono font-bold text-xs text-slate-900 bg-slate-100 hover:bg-orange-50 hover:text-orange-600 px-2 py-0.5 rounded border border-slate-200/80 transition-colors inline-flex items-center gap-1.5 shadow-2xs"
                            title="Primary Key: Variation ID (Click to open variations editor)"
                          >
                            <SlidersHorizontal size={12} className="text-orange-500 shrink-0" />
                            <span>PK: {vi.variationCode}</span>
                          </button>
                        </td>

                        {/* FK: Project Code */}
                        <td className="py-2.5 px-3">
                          <button
                            onClick={() => setSelectedProjectFilter(vi.projectId)}
                            className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-orange-700 bg-orange-50 hover:bg-orange-100 px-2 py-0.5 rounded border border-orange-200/80 transition-colors shadow-2xs"
                            title={`Foreign Key: Project Code ${vi.projectCode} (Click to filter)`}
                          >
                            <Folder size={11} className="text-orange-500 shrink-0" />
                            <span>FK: {vi.projectCode}</span>
                          </button>
                        </td>

                        {/* FK: Quotation Number */}
                        <td className="py-2.5 px-3">
                          {vi.quoteNo ? (
                            <span 
                              className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/80"
                              title={`Foreign Key Quotation: ${vi.quoteNo}`}
                            >
                              <span>FK: {vi.quoteNo}</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">FK: None</span>
                          )}
                        </td>

                        {/* Project Name (Single Line) */}
                        <td className="py-2.5 px-3 max-w-[200px]">
                          <span className="font-semibold text-slate-900 truncate block" title={vi.projectName}>
                            {vi.projectName}
                          </span>
                        </td>

                        {/* Client (Single Line) */}
                        <td className="py-2.5 px-3 max-w-[150px]">
                          <span className="font-medium text-slate-700 truncate block" title={vi.clientName}>
                            {vi.clientName}
                          </span>
                        </td>

                        {/* Type */}
                        <td className="py-2.5 px-3 text-center">
                          <span className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border",
                            vi.variationType === 'Additional' ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"
                          )}>
                            {vi.variationType === 'Additional' ? '+ Additional' : '- Omission'}
                          </span>
                        </td>

                        {/* Item Description (Single Line) */}
                        <td className="py-2.5 px-3 max-w-[260px]">
                          <span className="font-medium text-slate-800 truncate block" title={vi.item.description || vi.item.name}>
                            {vi.item.description || vi.item.name}
                          </span>
                        </td>

                        {/* Qty & Unit */}
                        <td className="py-2.5 px-3 text-right font-mono text-[11px] text-slate-600">
                          {vi.item.qty} {vi.item.unit}
                        </td>

                        {/* Rate */}
                        <td className="py-2.5 px-3 text-right font-mono text-[11px] text-slate-600">
                          Rs. {vi.item.rate.toLocaleString()}
                        </td>

                        {/* Amount */}
                        <td className={cn(
                          "py-2.5 px-3 text-right font-mono font-bold text-xs",
                          vi.variationType === 'Additional' ? "text-emerald-600" : "text-rose-600"
                        )}>
                          {vi.variationType === 'Additional' ? '+' : '-'} Rs. {vi.item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>

                        {/* Project Status */}
                        <td className="py-2.5 px-3 text-center">
                          <span className="text-[10px] font-medium px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full border border-slate-200/80">
                            {vi.projectStatus}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => targetProj && onSelectProject(targetProj, 'variations')}
                              className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-semibold transition-colors shadow-2xs"
                              title="Edit Variations for this Project"
                            >
                              Edit VO
                            </button>
                            <button
                              onClick={() => targetProj && onOpenDownloadPortal('Variation', targetProj)}
                              className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Download Variation Order PDF"
                            >
                              <Download size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={12} className="py-12 text-center text-slate-400">
                      <SlidersHorizontal size={32} className="mx-auto text-slate-300 mb-2" />
                      <p className="text-xs font-medium text-slate-600">No variations match your filter criteria.</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Try changing your search term, project filter, or status filter.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. VIEW 1: PROJECT CARDS WITH INLINE PRODUCT & MATERIAL DRILLDOWN */}
      {/* ------------------------------------------------------------- */}
      {activeViewMode === 'cards' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3.5">
          {filteredProjectCalcs.map(({ project: p, originalTotal, additionalTotal, omittedTotal, revisedTotal, netChange, additionalItems, omittedItems }) => {
            const isExpanded = !!expandedProjects[p.id];
            const totalVariationLines = additionalItems.length + omittedItems.length;

            return (
              <div 
                key={p.id} 
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col justify-between hover:border-slate-300 transition-colors"
              >
                <div className="p-4 sm:p-5">
                  {/* Top Bar: Status, Quote #, Delete */}
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <select 
                        value={p.status}
                        onChange={(e) => onUpdateProjectStatus(p.id, e.target.value as any)}
                        className={cn(
                          "px-2.5 py-1 rounded-md text-[11px] font-semibold border cursor-pointer outline-none transition-colors",
                          p.status === 'In Progress' ? "bg-amber-50 text-amber-800 border-amber-200" :
                          p.status === 'Completed' ? "bg-emerald-50 text-emerald-800 border-emerald-200" :
                          "bg-slate-100 text-slate-800 border-slate-200"
                        )}
                      >
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="On Hold">On Hold</option>
                      </select>

                      <button
                        onClick={() => onDeleteProject(p.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                        title="Delete Project"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-mono text-slate-400">{p.originalQuoteNo || 'PROJ'}</span>
                      {totalVariationLines > 0 ? (
                        <span className="text-[10px] font-semibold text-orange-600 bg-orange-50 border border-orange-200/60 px-2 py-0.5 rounded-md">
                          {totalVariationLines} Variations
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">Baseline</span>
                      )}
                    </div>
                  </div>

                  {/* Project & Client */}
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">{p.projectName}</h3>
                  <p className="text-xs text-slate-500 mb-3">{p.client?.name || 'Customer'}</p>

                  {/* Financial Scope Matrix */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-500 font-medium block">Original Contract</span>
                      <p className="text-xs font-bold font-mono text-slate-900 mt-0.5">
                        {formatLKR(originalTotal)}
                      </p>
                    </div>
                    <div className="p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-100">
                      <span className="text-[10px] text-emerald-800 font-medium block">Approved Additions</span>
                      <p className="text-xs font-bold font-mono text-emerald-800 mt-0.5">
                        +{formatLKR(additionalTotal)}
                      </p>
                    </div>
                    <div className="p-2.5 bg-rose-50/60 rounded-xl border border-rose-100">
                      <span className="text-[10px] text-rose-800 font-medium block">Approved Omissions</span>
                      <p className="text-xs font-bold font-mono text-rose-800 mt-0.5">
                        -{formatLKR(omittedTotal)}
                      </p>
                    </div>
                  </div>

                  {/* Revised Contract Sum & Net Delta Banner */}
                  <div className="p-3 bg-white rounded-xl text-slate-900 border border-slate-200/90 flex justify-between items-center shadow-2xs mb-3">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Revised Contract Sum</span>
                      <p className="text-base font-bold font-mono text-slate-900 mt-0.5">{formatLKR(revisedTotal)}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Net Scope Delta</span>
                      <p className={cn(
                        "text-xs font-bold font-mono mt-0.5",
                        netChange >= 0 ? "text-emerald-700" : "text-rose-700"
                      )}>
                        {netChange >= 0 ? '+' : ''}{originalTotal > 0 ? (netChange / originalTotal * 100).toFixed(1) : '0.0'}% ({formatLKR(netChange)})
                      </p>
                    </div>
                  </div>

                  {/* Product and Material Variations Collapsible Section */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/40">
                    <button
                      type="button"
                      onClick={() => toggleProjectExpand(p.id)}
                      className="w-full px-3.5 py-2 flex items-center justify-between text-left hover:bg-slate-100/60 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Package size={13} className="text-orange-500" />
                        <span className="text-xs font-semibold text-slate-800">
                          Product & Material Details ({totalVariationLines})
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                        <span>{isExpanded ? 'Hide Details' : 'View Breakdown'}</span>
                        {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="p-3 border-t border-slate-200 bg-white space-y-2">
                        {totalVariationLines === 0 ? (
                          <p className="text-xs text-slate-400 py-2 text-center">
                            No product or material variations recorded for this project yet.
                          </p>
                        ) : (
                          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                            {/* Additional items */}
                            {additionalItems.map((item) => (
                              <div key={item.id} className="p-2.5 rounded-lg border border-emerald-100 bg-emerald-50/30 text-xs">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-1.5 py-0.2 rounded font-mono">
                                        ADDITION
                                      </span>
                                      <span className="font-semibold text-slate-900 truncate">
                                        {item.name}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">
                                      {item.description || 'No description'}
                                    </p>
                                    <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1 font-mono">
                                      <span>Category: {item.category || 'General'}</span>
                                      <span>·</span>
                                      <span>Qty: {item.qty} {item.unit}</span>
                                      <span>·</span>
                                      <span>Rate: {formatLKR(item.rate)}</span>
                                    </div>
                                  </div>
                                  <span className="text-xs font-bold font-mono text-emerald-800 shrink-0">
                                    +{formatLKR(item.amount)}
                                  </span>
                                </div>
                              </div>
                            ))}

                            {/* Omitted items */}
                            {omittedItems.map((item) => (
                              <div key={item.id} className="p-2.5 rounded-lg border border-rose-100 bg-rose-50/30 text-xs">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[10px] font-bold text-rose-800 bg-rose-100/80 px-1.5 py-0.2 rounded font-mono">
                                        OMISSION
                                      </span>
                                      <span className="font-semibold text-slate-900 truncate line-through opacity-80">
                                        {item.name}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">
                                      {item.description || 'No description'}
                                    </p>
                                    <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1 font-mono">
                                      <span>Category: {item.category || 'General'}</span>
                                      <span>·</span>
                                      <span>Qty: {item.qty} {item.unit}</span>
                                      <span>·</span>
                                      <span>Rate: {formatLKR(item.rate)}</span>
                                    </div>
                                  </div>
                                  <span className="text-xs font-bold font-mono text-rose-800 shrink-0">
                                    -{formatLKR(item.amount)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="p-3 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-1.5">
                  <button 
                    onClick={() => {
                      onOpenDownloadPortal('Variation', p);
                    }}
                    className="flex-1 min-w-[100px] py-1.5 px-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors shadow-2xs flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Download size={12} />
                    <span>VO Report</span>
                  </button>

                  <button 
                    onClick={() => onSelectProject(p, 'variations')}
                    className="flex-1 min-w-[100px] py-1.5 px-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <PlusCircle size={12} />
                    <span>Record VO</span>
                  </button>

                  <button 
                    onClick={() => onSelectProject(p, 'payments')}
                    className="flex-1 min-w-[100px] py-1.5 px-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors shadow-2xs flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <CreditCard size={12} />
                    <span>Milestones</span>
                  </button>

                  <button 
                    onClick={() => onNavigateToPostEvaluation(p)}
                    className="flex-1 min-w-[100px] py-1.5 px-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200/80 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition-colors shadow-2xs flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Scale size={12} />
                    <span>Post-Eval</span>
                  </button>
                </div>
              </div>
            );
          })}

          {filteredProjectCalcs.length === 0 && (
            <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
              <AlertCircle size={32} className="mx-auto text-slate-300 mb-2" />
              <h3 className="text-sm font-semibold text-slate-900">No matching projects found</h3>
              <p className="text-slate-500 text-xs mt-0.5">Try clearing search filters or add a project from won quotations.</p>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. VIEW 2: PRODUCT & MATERIAL DETAIL MATRIX                   */}
      {/* ------------------------------------------------------------- */}
      {activeViewMode === 'material-matrix' && (
        <div className="space-y-3">
          {/* Material Category Quick Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {categoryImpactReport.map(item => (
              <div 
                key={item.category}
                onClick={() => setCategoryFilter(categoryFilter === item.category ? 'ALL' : item.category)}
                className={cn(
                  "p-2.5 rounded-xl border text-xs cursor-pointer transition-all",
                  categoryFilter === item.category
                    ? "bg-orange-50 border-orange-300 text-orange-900 shadow-2xs"
                    : "bg-white border-slate-200/80 hover:border-slate-300 text-slate-800"
                )}
              >
                <div className="text-[10px] text-slate-500 font-medium truncate">{item.category}</div>
                <div className={cn(
                  "text-xs font-bold font-mono mt-0.5",
                  item.netDelta >= 0 ? "text-emerald-700" : "text-rose-700"
                )}>
                  {item.netDelta >= 0 ? '+' : ''}{formatLKR(item.netDelta)}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {item.itemsCount} line items
                </div>
              </div>
            ))}
          </div>

          {/* Granular Line-Item Table */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="px-5 py-2.5 border-b border-slate-100 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-xs font-bold text-slate-900">Product & Material Variations Ledger</h3>
                <p className="text-[11px] text-slate-500">Every altered, added, or omitted product line with specifications</p>
              </div>
              <span className="text-xs font-mono font-semibold text-slate-500">
                Showing {filteredVariationItems.length} items
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 text-[11px] font-semibold text-slate-600 border-b border-slate-200/80">
                    <th className="py-2.5 px-4">Project & Client</th>
                    <th className="py-2.5 px-3">Item / PVC Code</th>
                    <th className="py-2.5 px-4">Product Name & Specifications</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-center">Type</th>
                    <th className="py-2.5 px-3 text-right">Qty / Unit</th>
                    <th className="py-2.5 px-3 text-right">Unit Rate</th>
                    <th className="py-2.5 px-4 text-right">Total Impact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredVariationItems.map((vi, idx) => (
                    <tr key={`${vi.projectId}-${vi.item.id}-${idx}`} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-2.5 px-4">
                        <div className="font-semibold text-slate-900 leading-snug">{vi.projectName}</div>
                        <div className="text-[10px] text-slate-400">{vi.clientName}</div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                        {vi.item.productCode || vi.item.pvcCode || vi.item.no || '—'}
                      </td>
                      <td className="py-2.5 px-4 max-w-sm">
                        <div className="font-semibold text-slate-800">{vi.item.name}</div>
                        <div className="text-[10px] text-slate-500 line-clamp-1">{vi.materialSpecText}</div>
                        {vi.item.description && (
                          <div className="text-[10px] text-slate-400 line-clamp-1 italic mt-0.5">{vi.item.description}</div>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                          {vi.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={cn(
                          "text-[10px] font-bold font-mono px-2 py-0.5 rounded-md",
                          vi.variationType === 'Additional' 
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200" 
                            : "bg-rose-50 text-rose-800 border border-rose-200"
                        )}>
                          {vi.variationType === 'Additional' ? '+ ADDITION' : '- OMISSION'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                        {vi.item.qty} {vi.item.unit}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                        {formatLKR(vi.item.rate)}
                      </td>
                      <td className={cn(
                        "py-2.5 px-4 text-right font-bold font-mono",
                        vi.variationType === 'Additional' ? "text-emerald-700" : "text-rose-700"
                      )}>
                        {vi.variationType === 'Additional' ? '+' : '-'} {formatLKR(vi.item.amount)}
                      </td>
                    </tr>
                  ))}

                  {filteredVariationItems.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        No product or material variations match the selected filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 5. VIEW 3: FULL REPORTS & RECONCILIATION                      */}
      {/* ------------------------------------------------------------- */}
      {activeViewMode === 'full-reports' && (
        <div className="space-y-3.5">
          {/* Executive Summary Report Header */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Portfolio Scope Reconciliation & Audit Report</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Comprehensive variance auditing between awarded contracts and approved variation scope
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              >
                <Printer size={13} />
                <span>Print Report</span>
              </button>
              <button
                type="button"
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              >
                <Download size={13} />
                <span>Download CSV Audit</span>
              </button>
            </div>
          </div>

          {/* Project-by-Project Reconciliation Table */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900">1. Project Contract Sum Reconciliation</h3>
              <span className="text-[11px] text-slate-400">Values in Sri Lankan Rupees (LKR)</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-semibold text-slate-600 border-b border-slate-200/80">
                    <th className="py-2.5 px-4">Project Name</th>
                    <th className="py-2.5 px-3">Client</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Original Value</th>
                    <th className="py-2.5 px-3 text-right">Additions</th>
                    <th className="py-2.5 px-3 text-right">Omissions</th>
                    <th className="py-2.5 px-3 text-right">Net Delta</th>
                    <th className="py-2.5 px-4 text-right">Revised Contract Sum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {portfolioMetrics.projectCalculations.map((calc) => (
                    <tr key={calc.project.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-2.5 px-4 font-semibold text-slate-900">{calc.project.projectName}</td>
                      <td className="py-2.5 px-3 text-slate-600">{calc.project.client?.name || '—'}</td>
                      <td className="py-2.5 px-3">
                        <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                          {calc.project.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700">{formatLKR(calc.originalTotal)}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-700">+{formatLKR(calc.additionalTotal)}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-rose-700">-{formatLKR(calc.omittedTotal)}</td>
                      <td className={cn(
                        "py-2.5 px-3 text-right font-bold font-mono",
                        calc.netChange >= 0 ? "text-emerald-700" : "text-rose-700"
                      )}>
                        {calc.netChange >= 0 ? '+' : ''}{formatLKR(calc.netChange)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-bold font-mono text-slate-900">
                        {formatLKR(calc.revisedTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50/90 font-bold border-t border-slate-200 text-slate-900 text-xs">
                    <td className="py-3 px-4" colSpan={3}>Portfolio Totals</td>
                    <td className="py-3 px-3 text-right font-mono">{formatLKR(portfolioMetrics.totalOriginalSum)}</td>
                    <td className="py-3 px-3 text-right font-mono text-emerald-700">+{formatLKR(portfolioMetrics.totalAdditionsSum)}</td>
                    <td className="py-3 px-3 text-right font-mono text-rose-700">-{formatLKR(portfolioMetrics.totalOmissionsSum)}</td>
                    <td className={cn(
                      "py-3 px-3 text-right font-mono",
                      portfolioMetrics.cumulativeNetDelta >= 0 ? "text-emerald-700" : "text-rose-700"
                    )}>
                      {portfolioMetrics.cumulativeNetDelta >= 0 ? '+' : ''}{formatLKR(portfolioMetrics.cumulativeNetDelta)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-orange-600">
                      {formatLKR(portfolioMetrics.totalRevisedSum)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Category-wise Breakdown Table */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900">2. Material Category Variation Distribution</h3>
              <span className="text-[11px] text-slate-400">Trade impact analysis</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-semibold text-slate-600 border-b border-slate-200/80">
                    <th className="py-2.5 px-4">Material / Product Category</th>
                    <th className="py-2.5 px-3 text-center">Items Altered</th>
                    <th className="py-2.5 px-3 text-right">Additions (LKR)</th>
                    <th className="py-2.5 px-3 text-right">Omissions (LKR)</th>
                    <th className="py-2.5 px-4 text-right">Net Financial Variance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {categoryImpactReport.map((cat) => (
                    <tr key={cat.category} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-2.5 px-4 font-semibold text-slate-900">{cat.category}</td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-600">{cat.itemsCount}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-700">+{formatLKR(cat.additions)}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-rose-700">-{formatLKR(cat.omissions)}</td>
                      <td className={cn(
                        "py-2.5 px-4 text-right font-bold font-mono",
                        cat.netDelta >= 0 ? "text-emerald-700" : "text-rose-700"
                      )}>
                        {cat.netDelta >= 0 ? '+' : ''}{formatLKR(cat.netDelta)}
                      </td>
                    </tr>
                  ))}
                  {categoryImpactReport.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400">
                        No category variation data available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
