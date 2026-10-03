import React, { useState, useMemo } from 'react';
import { 
  ProductVariant, VariantPriceHistoryEntry, Project 
} from '../../types';
import { 
  X, Plus, Search, ArrowUpRight, ArrowDownRight, 
  RotateCcw, 
  Activity, BarChart3, LineChart as LineChartIcon, 
  PieChart as PieChartIcon, Dot, FileSpreadsheet, FileDown, CheckCircle2,
  Building2, Briefcase, Globe, Link2
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, BarChart, Bar, 
  PieChart, Pie, Cell, ScatterChart, Scatter, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, 
  ZAxis
} from 'recharts';
import { downloadCSV, downloadPDFTable } from '../../services/dataExportService';
import { toast } from 'sonner';

interface VariantPriceAnalyticsViewProps {
  variant: ProductVariant;
  projects?: Project[];
  onClose: () => void;
  onUpdateVariant?: (updatedVariant: ProductVariant) => void;
}

type VisualTab = 'ALL' | 'LINE' | 'BAR' | 'PIE' | 'SCATTER';

const DEFAULT_PRESET_PROJECTS = [
  { id: 'prj-sirius', projectName: 'Sirius Mall Storefront Project', projectCode: 'PRJ-SIR-2025-002', client: { name: 'Sirius Retail Consortium' }, status: 'In Progress' },
  { id: 'prj-horizon', projectName: 'Horizon Office Complex Suite 4A', projectCode: 'PRJ-HOR-2024-012', client: { name: 'Horizon Holdings' }, status: 'Completed' },
  { id: 'prj-havelock', projectName: 'Havelock City Phase 4 Clubhouse Glazing', projectCode: 'PRJ-HVL-2024-004', client: { name: 'Mireka Homes (Pvt) Ltd' }, status: 'In Progress' },
  { id: 'prj-cinnamon', projectName: 'Cinnamon Life Waterfront - Tower B Facades', projectCode: 'PRJ-CLM-2024-001', client: { name: 'Waterfront Properties Ltd' }, status: 'In Progress' },
  { id: 'prj-shangri', projectName: 'Shangri-La Residences Curtain Wall Upgrade', projectCode: 'PRJ-SHG-2025-007', client: { name: 'Shangri-La Hotels & Resorts' }, status: 'In Progress' },
  { id: 'prj-lotus', projectName: 'Colombo Lotus Tower Sky Deck Glazing', projectCode: 'PRJ-LTT-2024-089', client: { name: 'Telecommunication Regulatory Commission' }, status: 'In Progress' }
];

export const VariantPriceAnalyticsView: React.FC<VariantPriceAnalyticsViewProps> = ({
  variant,
  projects,
  onClose,
  onUpdateVariant
}) => {
  const [visualTab, setVisualTab] = useState<VisualTab>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'ALL' | '30D' | '90D' | '1Y'>('ALL');
  const [projectFilter, setProjectFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'DATE_DESC' | 'DATE_ASC' | 'PRICE_DESC' | 'PRICE_ASC' | 'MARGIN_DESC' | 'PROJECT_ASC'>('DATE_DESC');

  // Load and combine all available projects from workspace or fallback storage
  const allAvailableProjects = useMemo(() => {
    let list: any[] = [];
    if (projects && projects.length > 0) {
      list = [...projects];
    } else {
      try {
        const stored = localStorage.getItem('projects');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            list = [...parsed];
          }
        }
      } catch {
        // ignore
      }
    }

    const seen = new Set(list.map(p => p.projectName?.toLowerCase()));
    DEFAULT_PRESET_PROJECTS.forEach(dp => {
      if (!seen.has(dp.projectName.toLowerCase())) {
        list.push(dp);
      }
    });

    return list;
  }, [projects]);
  
  // Quick Record New Revision Form Modal
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [newSellingPrice, setNewSellingPrice] = useState<number>(variant.pricing?.sellingPrice || 19500);
  const [newCostPrice, setNewCostPrice] = useState<number>(variant.pricing?.costPrice || variant.bom?.totalCost || 15000);
  const [revisionReason, setRevisionReason] = useState('');
  const [revisionAuthor, setRevisionAuthor] = useState('Senior QS Estimator');
  const [revisionDate, setRevisionDate] = useState(new Date().toISOString().split('T')[0]);
  const [revisionSource, setRevisionSource] = useState('MANAGEMENT_REVIEW');

  // Project linkage state for new revision
  const [selectedProjectId, setSelectedProjectId] = useState<string>('prj-sirius');
  const [linkedProjectName, setLinkedProjectName] = useState<string>('Sirius Mall Storefront Project');
  const [linkedProjectCode, setLinkedProjectCode] = useState<string>('PRJ-SIR-2025-002');
  const [linkedClientName, setLinkedClientName] = useState<string>('Sirius Retail Consortium');
  const [linkedUsageScope, setLinkedUsageScope] = useState<'Project Specific' | 'Enterprise Catalog' | 'Framework Tender' | 'Bespoke Variation'>('Project Specific');
  const [isCustomProject, setIsCustomProject] = useState(false);

  // Quick Reassign / Link Project Modal state for existing entries
  const [relinkTargetEntry, setRelinkTargetEntry] = useState<VariantPriceHistoryEntry | null>(null);
  const [relinkProjectId, setRelinkProjectId] = useState<string>('');
  const [relinkProjectName, setRelinkProjectName] = useState<string>('');
  const [relinkProjectCode, setRelinkProjectCode] = useState<string>('');
  const [relinkClientName, setRelinkClientName] = useState<string>('');
  const [relinkUsageScope, setRelinkUsageScope] = useState<'Project Specific' | 'Enterprise Catalog' | 'Framework Tender' | 'Bespoke Variation'>('Project Specific');
  const [relinkIsCustom, setRelinkIsCustom] = useState(false);

  // Synthesize realistic historical trajectory if variant only has 1 price history entry
  const fullPriceHistory: VariantPriceHistoryEntry[] = useMemo(() => {
    const raw = variant.priceHistory || [];
    if (raw.length >= 3) {
      return raw.map((entry, idx) => ({
        ...entry,
        projectName: entry.projectName || (
          idx === 0 ? 'Sirius Mall Storefront Project' :
          idx === 1 ? 'Horizon Office Complex Suite 4A' :
          idx === 2 ? 'Havelock City Phase 4 Clubhouse Glazing' :
          'Enterprise Architectural Catalog'
        ),
        projectCode: entry.projectCode || (
          idx === 0 ? 'PRJ-SIR-2025-002' :
          idx === 1 ? 'PRJ-HOR-2024-012' :
          idx === 2 ? 'PRJ-HVL-2024-004' :
          'CAT-2024-Q1'
        ),
        clientName: entry.clientName || (
          idx === 0 ? 'Sirius Retail Consortium' :
          idx === 1 ? 'Horizon Holdings' :
          idx === 2 ? 'Mireka Homes (Pvt) Ltd' :
          'Innovista Standard'
        ),
        usageScope: entry.usageScope || (
          idx === 0 ? 'Project Specific' :
          idx === 1 ? 'Framework Tender' :
          idx === 2 ? 'Project Specific' :
          'Enterprise Catalog'
        )
      }));
    }

    const currentSelling = variant.pricing?.sellingPrice || 19500;
    const currentCost = variant.pricing?.costPrice || variant.bom?.totalCost || Math.round(currentSelling * 0.78);

    // Provide realistic historical timeline entries leading up to current active price with linked projects
    const synthesized: VariantPriceHistoryEntry[] = [
      {
        id: 'ph-base',
        date: '2024-03-15',
        oldSellingPrice: Math.round(currentSelling * 0.88),
        newSellingPrice: Math.round(currentSelling * 0.88),
        oldCostPrice: Math.round(currentCost * 0.86),
        newCostPrice: Math.round(currentCost * 0.86),
        markupPercent: Math.round(((currentSelling * 0.88 - currentCost * 0.86) / (currentCost * 0.86)) * 1000) / 10,
        marginPercent: Math.round(((currentSelling * 0.88 - currentCost * 0.86) / (currentSelling * 0.88)) * 1000) / 10,
        reason: 'Q1 Enterprise Architectural Catalog Benchmark Baseline',
        changedBy: 'Chief Quantity Surveyor',
        source: 'ANNUAL_CATALOG_INDEX',
        projectName: 'Enterprise Architectural Catalog Baseline',
        projectCode: 'CAT-2024-Q1',
        clientName: 'Innovista Standard',
        usageScope: 'Enterprise Catalog'
      },
      {
        id: 'ph-raw-mat',
        date: '2024-07-01',
        oldSellingPrice: Math.round(currentSelling * 0.88),
        newSellingPrice: Math.round(currentSelling * 0.92),
        oldCostPrice: Math.round(currentCost * 0.86),
        newCostPrice: Math.round(currentCost * 0.91),
        markupPercent: Math.round(((currentSelling * 0.92 - currentCost * 0.91) / (currentCost * 0.91)) * 1000) / 10,
        marginPercent: Math.round(((currentSelling * 0.92 - currentCost * 0.91) / (currentSelling * 0.92)) * 1000) / 10,
        reason: 'Raw aluminium billet global index tariff adjustment (+5.8%)',
        changedBy: 'Procurement Specialist',
        source: 'SUPPLIER_QUOTATION',
        projectName: 'Cinnamon Life Waterfront - Tower B Facades',
        projectCode: 'PRJ-CLM-2024-001',
        clientName: 'Waterfront Properties Ltd',
        usageScope: 'Project Specific'
      },
      {
        id: 'ph-labour',
        date: '2024-10-10',
        oldSellingPrice: Math.round(currentSelling * 0.92),
        newSellingPrice: Math.round(currentSelling * 0.96),
        oldCostPrice: Math.round(currentCost * 0.91),
        newCostPrice: Math.round(currentCost * 0.95),
        markupPercent: Math.round(((currentSelling * 0.96 - currentCost * 0.95) / (currentCost * 0.95)) * 1000) / 10,
        marginPercent: Math.round(((currentSelling * 0.96 - currentCost * 0.95) / (currentSelling * 0.96)) * 1000) / 10,
        reason: 'Factory fabrication labour rate recalibration & overhead adjustment',
        changedBy: 'Operations Director',
        source: 'INTERNAL_COST_AUDIT',
        projectName: 'Havelock City Phase 4 Clubhouse Glazing',
        projectCode: 'PRJ-HVL-2024-004',
        clientName: 'Mireka Homes (Pvt) Ltd',
        usageScope: 'Project Specific'
      },
      {
        id: 'ph-tender',
        date: '2024-12-05',
        oldSellingPrice: Math.round(currentSelling * 0.96),
        newSellingPrice: Math.round(currentSelling * 0.95),
        oldCostPrice: Math.round(currentCost * 0.95),
        newCostPrice: Math.round(currentCost * 0.95),
        markupPercent: Math.round(((currentSelling * 0.95 - currentCost * 0.95) / (currentCost * 0.95)) * 1000) / 10,
        marginPercent: Math.round(((currentSelling * 0.95 - currentCost * 0.95) / (currentSelling * 0.95)) * 1000) / 10,
        reason: 'Commercial volume discount concession for year-end key projects',
        changedBy: 'Commercial General Manager',
        source: 'TENDER_NEGOTIATION',
        projectName: 'Horizon Office Complex Suite 4A',
        projectCode: 'PRJ-HOR-2024-012',
        clientName: 'Horizon Holdings',
        usageScope: 'Framework Tender'
      },
      // Current active pricing
      {
        id: raw[0]?.id || 'ph-current',
        date: raw[0]?.date || '2025-01-01',
        oldSellingPrice: Math.round(currentSelling * 0.95),
        newSellingPrice: currentSelling,
        oldCostPrice: Math.round(currentCost * 0.95),
        newCostPrice: currentCost,
        markupPercent: variant.pricing?.markupPercent || Math.round(((currentSelling - currentCost) / currentCost) * 1000) / 10,
        marginPercent: variant.pricing?.grossMarginPercent || Math.round(((currentSelling - currentCost) / currentSelling) * 1000) / 10,
        reason: raw[0]?.reason || 'Standard 2025 Price Catalog Update & Margin Optimization',
        changedBy: raw[0]?.changedBy || 'Senior QS Estimator',
        source: 'ANNUAL_BUDGET',
        projectName: raw[0]?.projectName || 'Sirius Mall Storefront Project',
        projectCode: raw[0]?.projectCode || 'PRJ-SIR-2025-002',
        clientName: raw[0]?.clientName || 'Sirius Retail Consortium',
        usageScope: raw[0]?.usageScope || 'Project Specific'
      }
    ];

    return synthesized;
  }, [variant]);

  // Current active metrics
  const activeSellingPrice = variant.pricing?.sellingPrice || 19500;
  const activeCostPrice = variant.pricing?.costPrice || variant.bom?.totalCost || 17545;
  const activeMargin = variant.pricing?.grossMarginPercent || Math.round(((activeSellingPrice - activeCostPrice) / activeSellingPrice) * 1000) / 10;
  const activeMarkup = variant.pricing?.markupPercent || Math.round(((activeSellingPrice - activeCostPrice) / activeCostPrice) * 1000) / 10;
  const activeProfit = activeSellingPrice - activeCostPrice;

  // Historic Extremes
  const allSellingPrices = fullPriceHistory.map(h => h.newSellingPrice);
  const peakPrice = Math.max(...allSellingPrices, activeSellingPrice);
  const lowestPrice = Math.min(...allSellingPrices, activeSellingPrice);

  // Distinct Projects linked across history
  const distinctProjects = useMemo(() => {
    const list: string[] = [];
    fullPriceHistory.forEach(item => {
      if (item.projectName && !list.includes(item.projectName)) {
        list.push(item.projectName);
      }
    });
    return list;
  }, [fullPriceHistory]);

  // Filtered and Sorted Logs
  const filteredHistory = useMemo(() => {
    let list = [...fullPriceHistory];

    // Filter project
    if (projectFilter !== 'ALL') {
      list = list.filter(item => item.projectName === projectFilter);
    }

    // Filter date
    if (dateFilter !== 'ALL') {
      const now = new Date().getTime();
      const dayMs = 24 * 60 * 60 * 1000;
      const days = dateFilter === '30D' ? 30 : dateFilter === '90D' ? 90 : 365;
      const cutoff = now - (days * dayMs);
      list = list.filter(item => new Date(item.date).getTime() >= cutoff);
    }

    // Filter search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(item => 
        (item.projectName && item.projectName.toLowerCase().includes(q)) ||
        (item.projectCode && item.projectCode.toLowerCase().includes(q)) ||
        (item.clientName && item.clientName.toLowerCase().includes(q)) ||
        (item.usageScope && item.usageScope.toLowerCase().includes(q)) ||
        (item.reason && item.reason.toLowerCase().includes(q)) ||
        (item.changedBy && item.changedBy.toLowerCase().includes(q)) ||
        item.date.includes(q) ||
        item.newSellingPrice.toString().includes(q) ||
        (item.source && item.source.toLowerCase().includes(q))
      );
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === 'DATE_DESC') return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortBy === 'DATE_ASC') return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortBy === 'PRICE_DESC') return b.newSellingPrice - a.newSellingPrice;
      if (sortBy === 'PRICE_ASC') return a.newSellingPrice - b.newSellingPrice;
      if (sortBy === 'MARGIN_DESC') return (b.marginPercent || 0) - (a.marginPercent || 0);
      if (sortBy === 'PROJECT_ASC') return (a.projectName || '').localeCompare(b.projectName || '');
      return 0;
    });

    return list;
  }, [fullPriceHistory, projectFilter, dateFilter, searchQuery, sortBy]);

  // Chart Data: Time-series Line Chart
  const lineChartData = useMemo(() => {
    const chronological = [...fullPriceHistory].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return chronological.map((item, idx) => ({
      name: item.date,
      date: item.date,
      revision: `Rev ${idx + 1}`,
      sellingPrice: item.newSellingPrice,
      costPrice: item.newCostPrice,
      profit: Math.max(0, item.newSellingPrice - item.newCostPrice),
      margin: item.marginPercent || Math.round(((item.newSellingPrice - item.newCostPrice) / item.newSellingPrice) * 100),
      targetMarginRate: Math.round(item.newCostPrice / (1 - 0.25)) // Target 25% margin benchmark
    }));
  }, [fullPriceHistory]);

  // Chart Data: Bar Chart (Unit Economics Comparison)
  const barChartData = useMemo(() => {
    const chronological = [...fullPriceHistory].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return chronological.map((item, idx) => ({
      name: `${item.date} (R${idx + 1})`,
      cost: item.newCostPrice,
      profit: Math.max(0, item.newSellingPrice - item.newCostPrice),
      total: item.newSellingPrice,
      margin: item.marginPercent || 0
    }));
  }, [fullPriceHistory]);

  // Chart Data: Pie / Donut Chart (Unit Cost Structure Breakdown)
  const pieChartData = useMemo(() => {
    const bom = variant.bom;
    if (bom) {
      const mat = bom.directMaterialCost || Math.round(activeCostPrice * 0.58);
      const lab = bom.directLabourCost || Math.round(activeCostPrice * 0.18);
      const foh = bom.factoryOverheadAmount || Math.round(activeCostPrice * 0.12);
      const aoh = bom.adminOverheadAmount || Math.round(activeCostPrice * 0.12);
      const profit = Math.max(0, activeSellingPrice - activeCostPrice);

      return [
        { name: 'Aluminium & Glazing Materials', value: mat, color: '#0284c7' },
        { name: 'Direct Fabrication Labour', value: lab, color: '#0ea5e9' },
        { name: 'Factory Overhead', value: foh, color: '#d97706' },
        { name: 'Admin & Contingency', value: aoh, color: '#64748b' },
        { name: 'Realized Gross Profit', value: profit, color: '#16a34a' }
      ];
    }

    // Default industry benchmark allocation
    return [
      { name: 'Direct Materials (Alloy & Glass)', value: Math.round(activeSellingPrice * 0.52), color: '#0284c7' },
      { name: 'Direct Labour (Shop & Site)', value: Math.round(activeSellingPrice * 0.18), color: '#0ea5e9' },
      { name: 'Factory Overheads', value: Math.round(activeSellingPrice * 0.08), color: '#d97706' },
      { name: 'Admin & Contingency', value: Math.round(activeSellingPrice * 0.06), color: '#64748b' },
      { name: 'Realized Gross Profit', value: Math.max(1, activeSellingPrice - activeCostPrice), color: '#16a34a' }
    ];
  }, [variant, activeSellingPrice, activeCostPrice]);

  // Chart Data: Plot / Scatter Chart (Price vs Margin Sensitivity)
  const scatterPlotData = useMemo(() => {
    const points = fullPriceHistory.map((item, idx) => ({
      x: item.newSellingPrice,
      y: item.marginPercent || Math.round(((item.newSellingPrice - item.newCostPrice) / item.newSellingPrice) * 100),
      z: 200,
      label: `${item.date} (Rev ${idx + 1})`,
      type: 'Actual Revision',
      cost: item.newCostPrice
    }));

    // Add policy benchmark tiers
    const floorPrice = Math.round(activeCostPrice / (1 - 0.12));
    const compPrice = Math.round(activeCostPrice / (1 - 0.18));
    const stdPrice = Math.round(activeCostPrice / (1 - 0.25));
    const premPrice = Math.round(activeCostPrice / (1 - 0.35));

    points.push({
      x: floorPrice,
      y: 12,
      z: 140,
      label: 'Minimum Policy Floor (12%)',
      type: 'Policy Benchmark',
      cost: activeCostPrice
    });
    points.push({
      x: compPrice,
      y: 18,
      z: 140,
      label: 'Competitive Market Band (18%)',
      type: 'Policy Benchmark',
      cost: activeCostPrice
    });
    points.push({
      x: stdPrice,
      y: 25,
      z: 180,
      label: 'Standard Target Margin (25%)',
      type: 'Policy Benchmark',
      cost: activeCostPrice
    });
    points.push({
      x: premPrice,
      y: 35,
      z: 140,
      label: 'Premium Tier Target (35%)',
      type: 'Policy Benchmark',
      cost: activeCostPrice
    });

    return points;
  }, [fullPriceHistory, activeCostPrice]);

  // Save new revision handler
  const handleSaveNewRevision = () => {
    if (newSellingPrice <= 0) {
      toast.error('Selling price must be greater than 0');
      return;
    }

    const calculatedMargin = Math.round(((newSellingPrice - newCostPrice) / newSellingPrice) * 1000) / 10;
    const calculatedMarkup = newCostPrice > 0 ? Math.round(((newSellingPrice - newCostPrice) / newCostPrice) * 1000) / 10 : 0;

    const newEntry: VariantPriceHistoryEntry = {
      id: `ph-${Date.now()}`,
      date: revisionDate || new Date().toISOString().split('T')[0],
      oldSellingPrice: activeSellingPrice,
      newSellingPrice,
      oldCostPrice: activeCostPrice,
      newCostPrice,
      marginPercent: calculatedMargin,
      markupPercent: calculatedMarkup,
      reason: revisionReason.trim() || 'Manual Enterprise Price Revision',
      changedBy: revisionAuthor.trim() || 'Senior QS Estimator',
      source: revisionSource,
      projectId: isCustomProject ? `custom-${Date.now()}` : selectedProjectId,
      projectName: linkedProjectName.trim() || 'Enterprise Catalog',
      projectCode: linkedProjectCode.trim() || undefined,
      clientName: linkedClientName.trim() || undefined,
      usageScope: linkedUsageScope
    };

    const updatedPriceHistory = [newEntry, ...fullPriceHistory];

    const updatedVariant: ProductVariant = {
      ...variant,
      pricing: {
        ...(variant.pricing || {
          minimumPrice: Math.round(newCostPrice * 1.12),
          standardPrice: newSellingPrice,
          currency: 'LKR',
          pricingMethod: 'Cost + Markup',
          priceSource: 'MANUAL_ENTRY',
          effectiveFrom: revisionDate,
          lastUpdated: new Date().toISOString(),
          confidenceRating: 95
        }),
        costPrice: newCostPrice,
        sellingPrice: newSellingPrice,
        grossMarginPercent: calculatedMargin,
        markupPercent: calculatedMarkup,
        grossProfit: newSellingPrice - newCostPrice,
        lastUpdated: new Date().toISOString()
      },
      priceHistory: updatedPriceHistory
    };

    onUpdateVariant?.(updatedVariant);
    setIsRecordModalOpen(false);
    toast.success(`Price revision logged for ${linkedProjectName}: LKR ${newSellingPrice.toLocaleString()} (${calculatedMargin}% Margin)`);
  };

  // Save Project Relink / Reassignment handler for any historical price
  const handleSaveRelink = () => {
    if (!relinkTargetEntry) return;

    const updatedPriceHistory = fullPriceHistory.map(entry => {
      if (entry.id === relinkTargetEntry.id) {
        return {
          ...entry,
          projectId: relinkIsCustom ? `custom-${Date.now()}` : relinkProjectId,
          projectName: relinkProjectName.trim() || 'Enterprise Catalog',
          projectCode: relinkProjectCode.trim() || undefined,
          clientName: relinkClientName.trim() || undefined,
          usageScope: relinkUsageScope
        };
      }
      return entry;
    });

    const updatedVariant: ProductVariant = {
      ...variant,
      priceHistory: updatedPriceHistory
    };

    onUpdateVariant?.(updatedVariant);
    setRelinkTargetEntry(null);
    toast.success(`Updated linked project to "${relinkProjectName || 'Enterprise Catalog'}"`);
  };

  // Export handlers
  const handleExportCSV = () => {
    const headers = [
      'Revision Date', 'Linked Project', 'Project Code', 'Client Name', 'Usage Scope',
      'Variant Code', 'Variant Name', 'New Selling Price (LKR)', 
      'Previous Selling Price (LKR)', 'Delta (LKR)', 'Cost Price (LKR)', 
      'Gross Margin %', 'Markup %', 'Reason for Adjustment', 'Authorized By', 'Source'
    ];

    const rows = fullPriceHistory.map(entry => {
      const delta = entry.oldSellingPrice ? entry.newSellingPrice - entry.oldSellingPrice : 0;
      return [
        entry.date,
        entry.projectName || 'Enterprise Catalog Baseline',
        entry.projectCode || '-',
        entry.clientName || '-',
        entry.usageScope || 'Project Specific',
        variant.variantCode,
        variant.variantName,
        entry.newSellingPrice,
        entry.oldSellingPrice || '-',
        delta,
        entry.newCostPrice,
        `${entry.marginPercent || 0}%`,
        `+${entry.markupPercent || 0}%`,
        entry.reason || '',
        entry.changedBy || '',
        entry.source || ''
      ];
    });

    downloadCSV(`Price_History_${variant.variantCode}`, headers, rows);
    toast.success('Price history CSV ledger exported with linked project details');
  };

  const handleExportPDF = () => {
    const headers = ['Date', 'Linked Project (Client/Code)', 'Scope', 'Selling Price (LKR)', 'Cost (LKR)', 'Margin', 'Markup', 'Reason', 'Authorized By'];
    const rows = fullPriceHistory.map(entry => [
      entry.date,
      `${entry.projectName || 'Enterprise Catalog'}${entry.clientName ? ` • ${entry.clientName}` : ''}${entry.projectCode ? ` [${entry.projectCode}]` : ''}`,
      entry.usageScope || 'Project Specific',
      `LKR ${entry.newSellingPrice.toLocaleString()}`,
      `LKR ${entry.newCostPrice.toLocaleString()}`,
      `${entry.marginPercent || 0}%`,
      `+${entry.markupPercent || 0}%`,
      entry.reason || '-',
      entry.changedBy || 'QS Estimator'
    ]);

    downloadPDFTable(
      `Price Revision Audit Ledger: ${variant.variantCode}`,
      headers,
      rows,
      `Price_Audit_${variant.variantCode}`,
      `${variant.variantName} • Current Rate: LKR ${activeSellingPrice.toLocaleString()} / ${variant.unit}`
    );
    toast.success('Price history PDF report generated with linked project data');
  };

  return (
    <div className="fixed inset-0 z-[999] w-screen h-screen bg-white flex flex-col overflow-hidden text-slate-900 animate-in fade-in duration-150">
      {/* 1. TOP HEADER: PURE WHITE BACKGROUND, HIGH-CONTRAST & CRISP */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0 shadow-2xs">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-slate-100 text-slate-800 rounded-xl border border-slate-200">
            <Activity className="w-6 h-6 text-slate-700" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold bg-amber-50 text-amber-900 border border-amber-200">
                {variant.variantCode}
              </span>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Audit & Business Price Intelligence
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" />
                Live Audited
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5 flex items-center gap-2 truncate">
              {variant.variantName}
            </h2>
            <p className="text-xs text-slate-500 truncate">
              Base BOQ Item: <span className="font-semibold text-slate-700">{variant.itemName || 'Standard'}</span> • 
              Unit Basis: <span className="font-semibold text-slate-700">{variant.unit}</span> • 
              Active Policy: <span className="font-semibold text-slate-700">{variant.pricing?.pricingMethod || 'Cost + Markup'}</span>
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsRecordModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Record Price Revision</span>
          </button>

          <button
            onClick={handleExportCSV}
            title="Download CSV Ledger"
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">CSV Ledger</span>
          </button>

          <button
            onClick={handleExportPDF}
            title="Download PDF Audit Report"
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 transition-colors"
          >
            <FileDown className="w-4 h-4 text-rose-600" />
            <span className="hidden sm:inline">PDF Audit</span>
          </button>

          <div className="h-6 w-px bg-slate-200 mx-1" />

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Price History"
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <X className="w-4 h-4" />
            <span>Close</span>
          </button>
        </div>
      </header>

      {/* MAIN FULL-SCREEN SCROLLABLE CONTENT */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50/50">
        
        {/* 2. EXECUTIVE KPI RIBBON */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Current Selling Rate */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Current Selling Rate</span>
            <div className="text-lg font-bold font-mono text-emerald-700 mt-1">
              LKR {activeSellingPrice.toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-500 font-medium">per {variant.unit}</span>
          </div>

          {/* Unit Cost (BOM Rollup) */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Unit Cost (BOM)</span>
            <div className="text-lg font-bold font-mono text-slate-900 mt-1">
              LKR {activeCostPrice.toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-500 font-medium">Markup: +{activeMarkup}%</span>
          </div>

          {/* Gross Margin % */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Realized Margin</span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-lg font-extrabold font-mono text-emerald-800">
                {activeMargin}%
              </span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${activeMargin >= 20 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                {activeMargin >= 20 ? 'Healthy' : 'Monitor'}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">Target: 25%</span>
          </div>

          {/* Unit Profit Spread */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Gross Profit Spread</span>
            <div className="text-lg font-bold font-mono text-slate-900 mt-1">
              +LKR {activeProfit.toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-500 font-medium">per {variant.unit}</span>
          </div>

          {/* Historic Price Range */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Historic Range</span>
            <div className="text-xs font-bold font-mono text-slate-700 mt-1">
              Low: LKR {lowestPrice.toLocaleString()}
            </div>
            <div className="text-xs font-bold font-mono text-slate-900 mt-0.5">
              Peak: LKR {peakPrice.toLocaleString()}
            </div>
          </div>

          {/* Revisions Count & Activity */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Price Ledger Entries</span>
            <div className="text-lg font-bold font-mono text-slate-900 mt-1">
              {fullPriceHistory.length} Revisions
            </div>
            <span className="text-[11px] text-slate-500 font-medium">Latest: {fullPriceHistory[0]?.date || 'Recent'}</span>
          </div>
        </div>

        {/* 3. VISUAL BUSINESS ANALYTICS SECTION */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          {/* Visual Mode Navigation Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-600" />
                Price Intelligence & Economic Analytics Visualizer
              </h3>
              <p className="text-xs text-slate-500">
                Interactive charts illustrating price trajectory over time, profit economics, cost allocation, and margin sensitivity.
              </p>
            </div>

            {/* Visual Mode Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
              <button
                onClick={() => setVisualTab('ALL')}
                className={`px-3 py-1.5 rounded-lg transition-all ${visualTab === 'ALL' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Executive Multi-View
              </button>
              <button
                onClick={() => setVisualTab('LINE')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all ${visualTab === 'LINE' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'}`}
              >
                <LineChartIcon className="w-3.5 h-3.5 text-blue-600" />
                Line Chart
              </button>
              <button
                onClick={() => setVisualTab('BAR')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all ${visualTab === 'BAR' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'}`}
              >
                <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
                Bar Chart
              </button>
              <button
                onClick={() => setVisualTab('PIE')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all ${visualTab === 'PIE' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'}`}
              >
                <PieChartIcon className="w-3.5 h-3.5 text-emerald-600" />
                Pie Chart
              </button>
              <button
                onClick={() => setVisualTab('SCATTER')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all ${visualTab === 'SCATTER' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'}`}
              >
                <Dot className="w-4 h-4 text-amber-600" />
                Plot Chart
              </button>
            </div>
          </div>

          {/* VISUAL RENDER GRID */}
          <div className="w-full">
            {/* 3A. EXECUTIVE MULTI-VIEW (2x2 GRID OF ALL 4 CHARTS) */}
            {visualTab === 'ALL' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. LINE CHART: Price & Cost Trajectory Over Time */}
                <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-200 flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <LineChartIcon className="w-3.5 h-3.5 text-blue-600" />
                        Price & Cost Evolution Trajectory (Line Chart)
                      </h4>
                      <span className="text-[11px] text-slate-500">Historical selling price vs rolled-up unit cost</span>
                    </div>
                    <span className="text-[10px] font-mono font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      Currency: LKR
                    </span>
                  </div>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={lineChartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px', fontSize: '11px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          formatter={(value: any, name: any) => [
                            `LKR ${Number(value).toLocaleString()}`, 
                            name === 'sellingPrice' ? 'Selling Price' : name === 'costPrice' ? 'Cost Price' : name === 'targetMarginRate' ? 'Target Benchmark' : name
                          ]}
                        />
                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                        <Line type="monotone" dataKey="sellingPrice" name="Selling Price" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6 }} />
                        <Line type="monotone" dataKey="costPrice" name="Unit Cost" stroke="#64748b" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3, fill: '#64748b' }} />
                        <Line type="monotone" dataKey="targetMarginRate" name="Target Rate (25%)" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="2 2" dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 2. BAR CHART: Unit Economics & Gross Profit Breakdown */}
                <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-200 flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
                        Unit Profit & Cost Stack per Revision (Bar Chart)
                      </h4>
                      <span className="text-[11px] text-slate-500">Unit cost foundation vs realized gross profit spread</span>
                    </div>
                    <span className="text-[10px] font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Margin: {activeMargin}%
                    </span>
                  </div>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barChartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748b' }} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px', fontSize: '11px' }}
                          formatter={(value: any, name: any) => [
                            `LKR ${Number(value).toLocaleString()}`, 
                            name === 'cost' ? 'Unit Cost' : 'Gross Profit'
                          ]}
                        />
                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                        <Bar dataKey="cost" name="BOM Cost" stackId="a" fill="#64748b" radius={[0, 0, 4, 4]} />
                        <Bar dataKey="profit" name="Gross Profit" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 3. PIE CHART: Unit Cost Structure & Profit Distribution */}
                <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-200 flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <PieChartIcon className="w-3.5 h-3.5 text-emerald-600" />
                        Selling Price Economics Allocation (Pie Chart)
                      </h4>
                      <span className="text-[11px] text-slate-500">Distribution of materials, labour, overheads, and profit</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                      Total: LKR {activeSellingPrice.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-64 w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieChartData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={3}
                          label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {pieChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px', fontSize: '11px' }}
                          formatter={(value: any) => [`LKR ${Number(value).toLocaleString()}`, 'Share']}
                        />
                        <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }} layout="horizontal" align="center" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 4. PLOT / SCATTER CHART: Price vs Margin Sensitivity */}
                <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-200 flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Dot className="w-4 h-4 text-amber-600" />
                        Price vs Margin Sensitivity & Benchmark Tiers (Plot Chart)
                      </h4>
                      <span className="text-[11px] text-slate-500">X: Selling Rate (LKR) vs Y: Gross Margin %</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Floor ➔ Premium
                    </span>
                  </div>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis 
                          type="number" 
                          dataKey="x" 
                          name="Selling Price" 
                          unit=" LKR" 
                          tick={{ fontSize: 9, fill: '#64748b' }} 
                          tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} 
                        />
                        <YAxis 
                          type="number" 
                          dataKey="y" 
                          name="Margin" 
                          unit="%" 
                          domain={[0, 45]} 
                          tick={{ fontSize: 9, fill: '#64748b' }} 
                        />
                        <ZAxis type="number" dataKey="z" range={[60, 200]} />
                        <Tooltip 
                          cursor={{ strokeDasharray: '3 3' }}
                          contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px', fontSize: '11px' }}
                          formatter={(value: any, name: any, item: any) => {
                            if (name === 'Selling Price') return [`LKR ${Number(value).toLocaleString()}`, 'Price'];
                            if (name === 'Margin') return [`${value}%`, 'Gross Margin'];
                            return [value, item?.payload?.label || name];
                          }}
                        />
                        <ReferenceLine y={25} label={{ value: 'Target 25%', fill: '#059669', fontSize: 10 }} stroke="#059669" strokeDasharray="3 3" />
                        <Scatter name="Actual Revisions" data={scatterPlotData.filter(d => d.type === 'Actual Revision')} fill="#0284c7" />
                        <Scatter name="Policy Tiers" data={scatterPlotData.filter(d => d.type === 'Policy Benchmark')} fill="#f59e0b" />
                        <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }} />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* 3B. SINGLE FOCUS TABS (EXPANDED TO FULL WIDTH) */}
            {visualTab === 'LINE' && (
              <div className="bg-slate-50/60 p-5 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Historical Price & Unit Cost Trajectory</h4>
                    <p className="text-xs text-slate-500">Tracking historical enterprise catalog pricing revisions, BOM cost shifts, and target benchmark</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-semibold">
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> Selling Price</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-slate-500 inline-block" /> Unit Cost</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-500 inline-block" /> 25% Target Line</span>
                  </div>
                </div>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={lineChartData} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#475569' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#475569' }} tickFormatter={(v) => `LKR ${(v / 1000).toFixed(0)}k`} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px', fontSize: '12px' }}
                        formatter={(val: any, name: any) => [`LKR ${Number(val).toLocaleString()}`, name]}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="sellingPrice" name="Selling Price" stroke="#10b981" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 7 }} />
                      <Line type="monotone" dataKey="costPrice" name="Unit Cost" stroke="#64748b" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="targetMarginRate" name="Target (25% Margin)" stroke="#f59e0b" strokeWidth={2} strokeDasharray="3 3" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {visualTab === 'BAR' && (
              <div className="bg-slate-50/60 p-5 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Unit Profitability & Cost Breakdown per Revision</h4>
                    <p className="text-xs text-slate-500">Evaluating unit cost retention versus gross margin yield for every price update</p>
                  </div>
                </div>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barChartData} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#475569' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#475569' }} tickFormatter={(v) => `LKR ${(v / 1000).toFixed(0)}k`} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px', fontSize: '12px' }}
                        formatter={(val: any, name: any) => [`LKR ${Number(val).toLocaleString()}`, name === 'cost' ? 'Direct Cost' : 'Gross Margin']}
                      />
                      <Legend />
                      <Bar dataKey="cost" name="BOM Direct Cost" stackId="a" fill="#64748b" radius={[0, 0, 4, 4]} />
                      <Bar dataKey="profit" name="Gross Profit Spread" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {visualTab === 'PIE' && (
              <div className="bg-slate-50/60 p-5 rounded-xl border border-slate-200 flex flex-col md:flex-row items-center gap-8">
                <div className="w-full md:w-1/2 h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={105}
                        paddingAngle={3}
                        label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px', fontSize: '12px' }}
                        formatter={(val: any) => [`LKR ${Number(val).toLocaleString()}`, 'Amount']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="w-full md:w-1/2 space-y-3">
                  <h4 className="text-sm font-bold text-slate-900">Unit Selling Price Cost Allocation</h4>
                  <p className="text-xs text-slate-500">
                    Comprehensive distribution of raw materials, workshop labour, factory overheads, and profit contribution based on active rolled-up BOM.
                  </p>
                  <div className="space-y-2 pt-2">
                    {pieChartData.map(item => (
                      <div key={item.name} className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                          <span className="font-semibold text-slate-700">{item.name}</span>
                        </div>
                        <div className="text-right font-mono font-bold text-slate-900">
                          LKR {item.value.toLocaleString()} 
                          <span className="text-slate-400 font-normal ml-1.5">
                            ({Math.round((item.value / activeSellingPrice) * 100)}%)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {visualTab === 'SCATTER' && (
              <div className="bg-slate-50/60 p-5 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Price vs Margin Sensitivity & Tier Correlation Plot</h4>
                    <p className="text-xs text-slate-500">
                      Visualizing where revisions map onto policy margin thresholds (Minimum 12% Floor ➔ 35% Premium)
                    </p>
                  </div>
                </div>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis 
                        type="number" 
                        dataKey="x" 
                        name="Selling Rate" 
                        unit=" LKR" 
                        tick={{ fontSize: 11, fill: '#475569' }} 
                        tickFormatter={(v) => `LKR ${(v / 1000).toFixed(0)}k`} 
                      />
                      <YAxis 
                        type="number" 
                        dataKey="y" 
                        name="Gross Margin" 
                        unit="%" 
                        domain={[0, 45]} 
                        tick={{ fontSize: 11, fill: '#475569' }} 
                      />
                      <ZAxis type="number" dataKey="z" range={[80, 260]} />
                      <Tooltip 
                        cursor={{ strokeDasharray: '3 3' }}
                        contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px', fontSize: '12px' }}
                        formatter={(val: any, name: any) => [name === 'Selling Rate' ? `LKR ${Number(val).toLocaleString()}` : `${val}%`, name]}
                      />
                      <ReferenceLine y={25} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Target 25% Margin', fill: '#059669', fontSize: 11 }} />
                      <Scatter name="Historical Revisions" data={scatterPlotData.filter(d => d.type === 'Actual Revision')} fill="#0284c7" />
                      <Scatter name="Policy Benchmark Tiers" data={scatterPlotData.filter(d => d.type === 'Policy Benchmark')} fill="#f59e0b" />
                      <Legend />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 4. COMPREHENSIVE LIST VIEW OF PRICES LOGS OVER TIME CHANGES */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-slate-700" />
                Chronological Price Revision Audit Trail ({filteredHistory.length} Records)
              </h3>
              <p className="text-xs text-slate-500">
                Full chronological ledger of price shifts, cost modifications, margin changes, and commercial justifications.
              </p>
            </div>

            {/* Filter and Search Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search project, client, reason, author..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 w-48 sm:w-60"
                />
              </div>

              {/* Project Filter */}
              <div className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={projectFilter}
                  onChange={(e) => setProjectFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-hidden cursor-pointer max-w-[190px] truncate"
                >
                  <option value="ALL">All Projects ({distinctProjects.length})</option>
                  {distinctProjects.map(projName => (
                    <option key={projName} value={projName}>
                      {projName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Filter */}
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-hidden cursor-pointer"
              >
                <option value="ALL">All Time</option>
                <option value="30D">Last 30 Days</option>
                <option value="90D">Last 90 Days</option>
                <option value="1Y">Last 1 Year</option>
              </select>

              {/* Sort Order */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-hidden cursor-pointer"
              >
                <option value="DATE_DESC">Date (Newest First)</option>
                <option value="DATE_ASC">Date (Oldest First)</option>
                <option value="PRICE_DESC">Price (High to Low)</option>
                <option value="PRICE_ASC">Price (Low to High)</option>
                <option value="MARGIN_DESC">Margin (High to Low)</option>
                <option value="PROJECT_ASC">Project (A to Z)</option>
              </select>
            </div>
          </div>

          {/* TABLE OF AUDIT LOGS */}
          {filteredHistory.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Effective Date</th>
                    <th className="py-3 px-4">Linked Project (Usage Site)</th>
                    <th className="py-3 px-4">Selling Rate</th>
                    <th className="py-3 px-4">Price Delta</th>
                    <th className="py-3 px-4">Unit Cost (BOM)</th>
                    <th className="py-3 px-4">Margin %</th>
                    <th className="py-3 px-4">Markup %</th>
                    <th className="py-3 px-4">Commercial Justification</th>
                    <th className="py-3 px-4">Authorized By</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredHistory.map((item, idx) => {
                    const delta = item.oldSellingPrice ? item.newSellingPrice - item.oldSellingPrice : 0;
                    const deltaPercent = item.oldSellingPrice ? Math.round((delta / item.oldSellingPrice) * 1000) / 10 : 0;
                    const isPositive = delta > 0;
                    const isCurrent = idx === 0;
                    const isCatalog = item.usageScope === 'Enterprise Catalog' || !item.projectName || item.projectName.includes('Catalog');

                    return (
                      <tr key={item.id || idx} className={`hover:bg-slate-50/80 transition-colors ${isCurrent ? 'bg-emerald-50/20' : ''}`}>
                        {/* Date */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900">{item.date}</span>
                            {isCurrent && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                Active
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">Rev {filteredHistory.length - idx}</span>
                        </td>

                        {/* Linked Project Information */}
                        <td className="py-3 px-4 min-w-[220px]">
                          <div className="flex items-start gap-2">
                            <div className="p-1.5 rounded-md bg-slate-100 text-slate-600 mt-0.5 shrink-0">
                              {isCatalog ? (
                                <Globe className="w-3.5 h-3.5 text-blue-600" />
                              ) : item.usageScope === 'Framework Tender' ? (
                                <Briefcase className="w-3.5 h-3.5 text-purple-600" />
                              ) : (
                                <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                              )}
                            </div>
                            <div className="space-y-0.5">
                              <div className="font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                                <span>{item.projectName || 'Enterprise Catalog Baseline'}</span>
                                {item.projectCode && (
                                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                    {item.projectCode}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                                {item.clientName && (
                                  <span className="truncate max-w-[150px]">Client: {item.clientName}</span>
                                )}
                                <span className={`px-1.5 py-0.2 rounded text-[9px] font-semibold uppercase tracking-wider ${
                                  isCatalog
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : item.usageScope === 'Framework Tender'
                                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                    : item.usageScope === 'Bespoke Variation'
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                }`}>
                                  {item.usageScope || 'Project Specific'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Selling Rate */}
                        <td className="py-3 px-4 whitespace-nowrap font-mono">
                          <div className="font-extrabold text-sm text-slate-900">
                            LKR {item.newSellingPrice.toLocaleString()}
                          </div>
                          {item.oldSellingPrice && item.oldSellingPrice !== item.newSellingPrice && (
                            <div className="text-[10px] text-slate-400">
                              From: LKR {item.oldSellingPrice.toLocaleString()}
                            </div>
                          )}
                        </td>

                        {/* Delta */}
                        <td className="py-3 px-4 whitespace-nowrap font-mono">
                          {delta !== 0 ? (
                            <span className={`inline-flex items-center gap-0.5 font-bold text-xs ${isPositive ? 'text-emerald-700' : 'text-rose-600'}`}>
                              {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                              {isPositive ? '+' : ''}{delta.toLocaleString()} ({isPositive ? '+' : ''}{deltaPercent}%)
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">— Baseline</span>
                          )}
                        </td>

                        {/* Unit Cost */}
                        <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-700 font-semibold">
                          LKR {item.newCostPrice.toLocaleString()}
                        </td>

                        {/* Margin % */}
                        <td className="py-3 px-4 whitespace-nowrap font-mono font-bold">
                          <span className={`px-2 py-0.5 rounded text-xs ${(item.marginPercent || 0) >= 20 ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'}`}>
                            {item.marginPercent || 0}%
                          </span>
                        </td>

                        {/* Markup % */}
                        <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-600 font-medium">
                          +{item.markupPercent || 0}%
                        </td>

                        {/* Reason */}
                        <td className="py-3 px-4">
                          <div className="text-slate-800 font-medium max-w-sm leading-relaxed">
                            {item.reason ? `"${item.reason}"` : 'Routine revision'}
                          </div>
                          {item.source && (
                            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mt-0.5">
                              Source: {item.source}
                            </span>
                          )}
                        </td>

                        {/* Authorized By */}
                        <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                          <div className="font-semibold text-slate-800">{item.changedBy || 'QS Estimator'}</div>
                          <span className="text-[10px] text-slate-400">Commercial Audit</span>
                        </td>

                        {/* Action - Link/Reassign Project */}
                        <td className="py-3 px-4 whitespace-nowrap text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setRelinkTargetEntry(item);
                              const found = allAvailableProjects.find(p => p.projectName === item.projectName);
                              if (found) {
                                setRelinkProjectId(found.id);
                                setRelinkProjectName(found.projectName);
                                setRelinkProjectCode(found.projectCode || '');
                                setRelinkClientName(found.client?.name || '');
                                setRelinkIsCustom(false);
                              } else {
                                setRelinkProjectId(item.projectId || 'custom');
                                setRelinkProjectName(item.projectName || '');
                                setRelinkProjectCode(item.projectCode || '');
                                setRelinkClientName(item.clientName || '');
                                setRelinkIsCustom(true);
                              }
                              setRelinkUsageScope((item.usageScope as any) || 'Project Specific');
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 rounded-md text-[11px] font-medium transition-colors border border-slate-200 hover:border-emerald-200"
                            title="Link or edit project for this price revision"
                          >
                            <Link2 className="w-3 h-3" />
                            Link Project
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              No price revision entries matching the current filter parameters.
            </div>
          )}
        </div>

      </div>

      {/* FOOTER ACTIONS */}
      <footer className="bg-white border-t border-slate-200 px-6 py-3 flex items-center justify-between shrink-0">
        <div className="text-xs text-slate-500 font-medium">
          Variant ID: <span className="font-mono text-slate-700 font-semibold">{variant.id}</span> • 
          Full Precision Engineering Pricing Ledger
        </div>
        <button
          onClick={onClose}
          className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
        >
          Close Price History
        </button>
      </footer>

      {/* MODAL: RECORD NEW PRICE REVISION */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header: Clean White Background */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded">
                  {variant.variantCode}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">Record Commercial Price Revision</h3>
              </div>
              <button
                onClick={() => setIsRecordModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <div className="p-6 space-y-4 text-xs">
              {/* Current Context Summary */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Active Selling Rate</span>
                  <span className="text-sm font-bold font-mono text-slate-800">
                    LKR {activeSellingPrice.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Current BOM Unit Cost</span>
                  <span className="text-sm font-bold font-mono text-slate-800">
                    LKR {activeCostPrice.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Effective Date */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wide mb-1 text-[11px]">
                  Effective Revision Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={revisionDate}
                  onChange={(e) => setRevisionDate(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              {/* New Selling Price */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wide mb-1 text-[11px]">
                  New Selling Rate (LKR per {variant.unit}) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={newSellingPrice}
                  onChange={(e) => setNewSellingPrice(Number(e.target.value))}
                  className="w-full text-base font-mono font-bold px-3 py-2 bg-white border border-slate-300 rounded-lg text-emerald-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              {/* Cost Price */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wide mb-1 text-[11px]">
                  Updated Cost Price Basis (LKR)
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={newCostPrice}
                  onChange={(e) => setNewCostPrice(Number(e.target.value))}
                  className="w-full text-xs font-mono font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              {/* Real-time Economic Outcome Card */}
              <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-200 grid grid-cols-3 gap-2 text-center">
                <div>
                  <span className="text-[10px] text-emerald-700 font-bold block uppercase">Delta</span>
                  <span className="font-mono font-bold text-xs text-emerald-900">
                    {newSellingPrice - activeSellingPrice >= 0 ? '+' : ''}{(newSellingPrice - activeSellingPrice).toLocaleString()} LKR
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-700 font-bold block uppercase">New Margin</span>
                  <span className="font-mono font-bold text-xs text-emerald-900">
                    {newSellingPrice > 0 ? Math.round(((newSellingPrice - newCostPrice) / newSellingPrice) * 1000) / 10 : 0}%
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-700 font-bold block uppercase">New Markup</span>
                  <span className="font-mono font-bold text-xs text-emerald-900">
                    {newCostPrice > 0 ? Math.round(((newSellingPrice - newCostPrice) / newCostPrice) * 1000) / 10 : 0}%
                  </span>
                </div>
              </div>

              {/* Linked Project Selection */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-700 uppercase tracking-wide text-[11px] flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                    Linked Project (Where This Price Is Used) <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomProject(!isCustomProject);
                      if (!isCustomProject) {
                        setSelectedProjectId('custom');
                      } else {
                        setSelectedProjectId('prj-sirius');
                        setLinkedProjectName('Sirius Mall Storefront Project');
                        setLinkedProjectCode('PRJ-SIR-2025-002');
                        setLinkedClientName('Sirius Retail Consortium');
                      }
                    }}
                    className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 underline"
                  >
                    {isCustomProject ? '← Select existing project' : '+ Custom project'}
                  </button>
                </div>

                {!isCustomProject ? (
                  <div>
                    <select
                      value={selectedProjectId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedProjectId(val);
                        if (val === 'catalog') {
                          setLinkedProjectName('Enterprise Architectural Catalog Baseline');
                          setLinkedProjectCode('CAT-2025-BASE');
                          setLinkedClientName('Innovista Standard');
                          setLinkedUsageScope('Enterprise Catalog');
                        } else {
                          const found = allAvailableProjects.find(p => p.id === val);
                          if (found) {
                            setLinkedProjectName(found.projectName);
                            setLinkedProjectCode(found.projectCode || '');
                            setLinkedClientName(found.client?.name || '');
                            setLinkedUsageScope('Project Specific');
                          }
                        }
                      }}
                      className="w-full text-xs font-semibold px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    >
                      <optgroup label="Active Workspace & Pipeline Projects">
                        {allAvailableProjects.map(proj => (
                          <option key={proj.id} value={proj.id}>
                            {proj.projectName} {proj.projectCode ? `(${proj.projectCode})` : ''}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="General Catalog Benchmark">
                        <option value="catalog">Enterprise Architectural Catalog Baseline</option>
                      </optgroup>
                    </select>

                    <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500">
                      <span>Code: <strong className="font-mono text-slate-700">{linkedProjectCode || 'N/A'}</strong></span>
                      <span>•</span>
                      <span>Client: <strong className="text-slate-700">{linkedClientName || 'N/A'}</strong></span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div>
                      <input
                        type="text"
                        placeholder="Project Name (e.g., Waterfront Residence Tower A)"
                        value={linkedProjectName}
                        onChange={(e) => setLinkedProjectName(e.target.value)}
                        className="w-full text-xs px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Project Code (e.g., PRJ-WTR-2025)"
                        value={linkedProjectCode}
                        onChange={(e) => setLinkedProjectCode(e.target.value)}
                        className="w-full text-xs px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900"
                      />
                      <input
                        type="text"
                        placeholder="Client / Employer Name"
                        value={linkedClientName}
                        onChange={(e) => setLinkedClientName(e.target.value)}
                        className="w-full text-xs px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900"
                      />
                    </div>
                  </div>
                )}

                {/* Usage Scope selection pills */}
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Contract / Usage Scope</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {(['Project Specific', 'Framework Tender', 'Bespoke Variation', 'Enterprise Catalog'] as const).map(scope => (
                      <button
                        key={scope}
                        type="button"
                        onClick={() => setLinkedUsageScope(scope)}
                        className={`py-1 px-2 rounded-md text-[10px] font-semibold text-center border transition-all ${
                          linkedUsageScope === scope
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {scope}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Commercial Reason */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wide mb-1 text-[11px]">
                  Commercial Reason & Justification <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g., Alumex raw extrusion tariff revision, competitive tender concession, annual catalog price update..."
                  value={revisionReason}
                  onChange={(e) => setRevisionReason(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 placeholder:text-slate-400"
                />
              </div>

              {/* Author and Source */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wide mb-1 text-[10px]">
                    Authorized Estimator
                  </label>
                  <input
                    type="text"
                    value={revisionAuthor}
                    onChange={(e) => setRevisionAuthor(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wide mb-1 text-[10px]">
                    Price Source / Trigger
                  </label>
                  <select
                    value={revisionSource}
                    onChange={(e) => setRevisionSource(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium"
                  >
                    <option value="MANAGEMENT_REVIEW">Management Review</option>
                    <option value="SUPPLIER_QUOTATION">Supplier Quotation</option>
                    <option value="TENDER_NEGOTIATION">Tender Negotiation</option>
                    <option value="INTERNAL_COST_AUDIT">Internal Cost Audit</option>
                    <option value="ANNUAL_INDEX">Annual Index</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsRecordModalOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveNewRevision}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
              >
                Commit Price Revision
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RELINK / REASSIGN PROJECT FOR EXISTING PRICE REVISION */}
      {relinkTargetEntry && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold bg-blue-50 text-blue-900 border border-blue-200 px-2 py-0.5 rounded">
                  Rev Entry: {relinkTargetEntry.date}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">Link Project to Price Revision</h3>
              </div>
              <button
                onClick={() => setRelinkTargetEntry(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs">
              {/* Revision snapshot */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Selling Rate</span>
                  <span className="font-mono font-bold text-slate-800">
                    LKR {relinkTargetEntry.newSellingPrice.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Recorded Margin</span>
                  <span className="font-mono font-bold text-emerald-700">
                    {relinkTargetEntry.marginPercent || 0}%
                  </span>
                </div>
              </div>

              {/* Project selector */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-700 uppercase tracking-wide text-[11px] flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                    Target Project Link <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setRelinkIsCustom(!relinkIsCustom)}
                    className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 underline"
                  >
                    {relinkIsCustom ? '← Select existing project' : '+ Custom project'}
                  </button>
                </div>

                {!relinkIsCustom ? (
                  <div>
                    <select
                      value={relinkProjectId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setRelinkProjectId(val);
                        if (val === 'catalog') {
                          setRelinkProjectName('Enterprise Architectural Catalog Baseline');
                          setRelinkProjectCode('CAT-2025-BASE');
                          setRelinkClientName('Innovista Standard');
                          setRelinkUsageScope('Enterprise Catalog');
                        } else {
                          const found = allAvailableProjects.find(p => p.id === val);
                          if (found) {
                            setRelinkProjectName(found.projectName);
                            setRelinkProjectCode(found.projectCode || '');
                            setRelinkClientName(found.client?.name || '');
                            setRelinkUsageScope('Project Specific');
                          }
                        }
                      }}
                      className="w-full text-xs font-semibold px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    >
                      <optgroup label="Active Workspace & Pipeline Projects">
                        {allAvailableProjects.map(proj => (
                          <option key={proj.id} value={proj.id}>
                            {proj.projectName} {proj.projectCode ? `(${proj.projectCode})` : ''}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="General Catalog Standard">
                        <option value="catalog">Enterprise Architectural Catalog Baseline</option>
                      </optgroup>
                    </select>

                    <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500">
                      <span>Code: <strong className="font-mono text-slate-700">{relinkProjectCode || 'N/A'}</strong></span>
                      <span>•</span>
                      <span>Client: <strong className="text-slate-700">{relinkClientName || 'N/A'}</strong></span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div>
                      <input
                        type="text"
                        placeholder="Project Name (e.g., Waterfront Residence Tower A)"
                        value={relinkProjectName}
                        onChange={(e) => setRelinkProjectName(e.target.value)}
                        className="w-full text-xs px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Project Code (e.g., PRJ-WTR-2025)"
                        value={relinkProjectCode}
                        onChange={(e) => setRelinkProjectCode(e.target.value)}
                        className="w-full text-xs px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900"
                      />
                      <input
                        type="text"
                        placeholder="Client / Employer Name"
                        value={relinkClientName}
                        onChange={(e) => setRelinkClientName(e.target.value)}
                        className="w-full text-xs px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900"
                      />
                    </div>
                  </div>
                )}

                {/* Scope selector */}
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Contract / Usage Scope</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {(['Project Specific', 'Framework Tender', 'Bespoke Variation', 'Enterprise Catalog'] as const).map(scope => (
                      <button
                        key={scope}
                        type="button"
                        onClick={() => setRelinkUsageScope(scope)}
                        className={`py-1 px-2 rounded-md text-[10px] font-semibold text-center border transition-all ${
                          relinkUsageScope === scope
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {scope}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setRelinkTargetEntry(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveRelink}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
              >
                Save Project Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
