import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Plus, 
  Radio,
  ShieldAlert,
  Scale,
  HardHat,
  RefreshCw,
  Truck,
  ChevronRight,
  Boxes,
  FileCheck,
  FileSpreadsheet,
  Layers,
  Activity,
  TrendingUp,
  FolderOpen,
  LayoutDashboard,
  ShoppingCart,
  FileText,
  Users,
  DollarSign,
  BarChart3
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { cn } from '../../lib/utils';
import { procurementService } from '../../services/procurementService';
import { procurementCostService } from '../../services/procurementCostService';
import { ProcurementCostManager } from './ProcurementCostManager';
import { ProcurementDocumentsHub } from './documents/ProcurementDocumentsHub';
import { ContextualDocumentModal } from './documents/ContextualDocumentModal';
import { ProcurementLandingPage } from './ProcurementLandingPage';
import { 
  Supplier, 
  RequestForQuotation, 
  PurchaseOrder, 
  GoodsReceiptNote, 
  PurchaseRequisition,
  ReverseAuction,
  ContractAgreement,
  ServiceCompletionNote,
  SupplierInvoice,
  ProcurementNCR,
  InventoryStockItem,
  ScrapRecord,
  EmergencyRequest
} from '../../types/procurement';
import { useSecurity } from '../../context/SecurityContext';
import { BarcodeVisual } from '../boq/BarcodeVisual';

export type ProcurementTab = 
  | 'landing'
  | 'overview'
  | 'costing'
  | 'documents'
  | 'pos' 
  | 'pr' 
  | 'rfq' 
  | 'auctions' 
  | 'grn' 
  | 'scn' 
  | 'invoices' 
  | 'ncrs' 
  | 'inventory' 
  | 'scrap' 
  | 'emergency' 
  | 'contracts' 
  | 'suppliers' 
  | 'evaluation' 
  | 'analytics';

interface ProcurementHubProps {
  initialTab?: ProcurementTab;
  onNavigateToProject?: (projectId: string) => void;
  projects?: any[];
  onUpdateProjects?: (projects: any[]) => void;
  invoices?: any[];
  onSaveInvoice?: (invoice: any) => void;
  itemCatalog?: any[];
  productVariants?: any[];
  onAddActualCostRecord?: (record: any) => void;
}

export const ProcurementHub: React.FC<ProcurementHubProps> = ({ 
  initialTab = 'landing',
  onNavigateToProject,
  projects = [],
  invoices = [],
  onSaveInvoice,
  itemCatalog = [],
  productVariants = [],
  onAddActualCostRecord
}) => {
  const { currentUser, hasPermission } = useSecurity();
  const [activeTab, setActiveTab] = useState<ProcurementTab>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    if (projects && projects.length > 0) {
      procurementService.syncWithCentralData(projects, itemCatalog, productVariants);
      refreshAll();
    }
  }, [projects, itemCatalog, productVariants]);

  // Sync central invoices if passed
  useEffect(() => {
    if (invoices && invoices.length > 0) {
      // Keep invoice counter synchronized
    }
  }, [invoices]);

  // Master Data State
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => procurementService.getSuppliers());
  const [rfqs, setRfqs] = useState<RequestForQuotation[]>(() => procurementService.getRfqs());
  const [pos, setPos] = useState<PurchaseOrder[]>(() => procurementService.getPurchaseOrders());
  const [grns, setGrns] = useState<GoodsReceiptNote[]>(() => procurementService.getGrns());
  const [requisitions, setRequisitions] = useState<PurchaseRequisition[]>(() => procurementService.getRequisitions());
  const [auctions, setAuctions] = useState<ReverseAuction[]>(() => procurementService.getReverseAuctions());
  const [contracts, setContracts] = useState<ContractAgreement[]>(() => procurementService.getContracts());
  const [scns, setScns] = useState<ServiceCompletionNote[]>(() => procurementService.getScns());
  const [invoicesList, setInvoicesList] = useState<SupplierInvoice[]>(() => procurementService.getInvoices());
  const [ncrs, setNcrs] = useState<ProcurementNCR[]>(() => procurementService.getNcrs());
  const [inventory, setInventory] = useState<InventoryStockItem[]>(() => procurementService.getInventory());
  const [scrap, setScrap] = useState<ScrapRecord[]>(() => procurementService.getScrapRecords());
  const [emergencies, setEmergencies] = useState<EmergencyRequest[]>(() => procurementService.getEmergencyRequests());
  const [analytics, setAnalytics] = useState(() => procurementService.getAnalytics());
  const [hhiData, setHhiData] = useState(() => procurementService.calculateHHI());
  const [costItemsCount, setCostItemsCount] = useState(() => procurementCostService.getCostItems().length);

  // Search and Filter States (Single Line)
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [projectFilter, setProjectFilter] = useState('ALL');
  const [actionAlert, setActionAlert] = useState<{ type: 'success' | 'warning' | 'error'; message: string } | null>(null);

  // Modals
  const [isNewPoModalOpen, setIsNewPoModalOpen] = useState(false);
  const [isNewPrModalOpen, setIsNewPrModalOpen] = useState(false);
  const [isNewNcrModalOpen, setIsNewNcrModalOpen] = useState(false);
  const [isNewScrapModalOpen, setIsNewScrapModalOpen] = useState(false);
  const [isNewEmergencyModalOpen, setIsNewEmergencyModalOpen] = useState(false);
  const [selectedPoDetails, setSelectedPoDetails] = useState<PurchaseOrder | null>(null);
  const [selectedGrnBarcode, setSelectedGrnBarcode] = useState<GoodsReceiptNote | null>(null);
  const [auctionBidModal, setAuctionBidModal] = useState<ReverseAuction | null>(null);
  const [auctionBidAmount, setAuctionBidAmount] = useState<number>(0);
  const [selectedBidderSupplierId, setSelectedBidderSupplierId] = useState<string>('');
  const [interceptScrapModal, setInterceptScrapModal] = useState<ScrapRecord | null>(null);
  const [targetReclaimProjectId, setTargetReclaimProjectId] = useState<string>('');

  const defaultProj = projects[0] || { id: 'proj-altair-01', projectName: 'Altair Tower - Luxury Façade & Glazing Package' };

  // Form Temp States
  const [newPrData, setNewPrData] = useState({
    projectId: defaultProj.id,
    projectName: defaultProj.projectName || defaultProj.name || 'Altair Tower - Luxury Façade & Glazing Package',
    department: 'Engineering',
    requestedBy: currentUser?.fullName || 'Site Engineer',
    priority: 'High' as const,
    requiredByDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    itemDesc: '',
    itemQty: 10,
    itemUnit: 'MT',
    itemUnitPrice: 3500,
    category: 'Structural Steel & Alloys' as const,
    justification: ''
  });

  const [newPoData, setNewPoData] = useState({
    supplierId: suppliers[0]?.id || '',
    projectId: defaultProj.id,
    projectName: defaultProj.projectName || defaultProj.name || 'Altair Tower - Luxury Façade & Glazing Package',
    itemDesc: 'Structural Framing Grade S355JR',
    qty: 10,
    unit: 'MT',
    unitPrice: 3800,
    category: 'Structural Steel & Alloys' as const,
    paymentTerms: 'Net 30 Days' as const
  });

  const [newEmergencyData, setNewEmergencyData] = useState({
    projectId: 'PRJ-2026-001',
    projectName: 'Dubai Mall Fashion Avenue Canopy Extension',
    incidentType: 'Equipment Breakdown / Structural Cable Failure',
    estimatedCost: 25000,
    requestedBy: currentUser?.fullName || 'Safety Supervisor',
    description: 'Immediate express parts replacement to resume critical pathway operations.'
  });

  const [newNcrData, setNewNcrData] = useState({
    supplierId: suppliers[0]?.id || '',
    sourceType: 'Site Delivery' as const,
    sourceRef: 'DN-9901',
    projectId: 'PRJ-2026-001',
    projectName: 'Dubai Mall Fashion Avenue Canopy Extension',
    severity: 'Major' as const,
    title: 'Weld joint porosity and dimensional out-of-tolerance',
    description: 'Joint exceeds permitted 2mm gap tolerance per AWS D1.1 specifications.'
  });

  const [newScrapData, setNewScrapData] = useState({
    projectId: 'PRJ-2026-001',
    projectName: 'Dubai Mall Fashion Avenue Canopy Extension',
    materialCategory: 'Structural Steel I-Beam Cut-offs',
    description: 'Clean unpainted structural steel cut-offs 1.5m to 2.8m length.',
    weightKg: 1800,
    estimatedValue: 3200
  });

  const [contextModalConfig, setContextModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    subtitle?: string;
    relevantDocNumbers: number[];
    context: any;
  }>({
    isOpen: false,
    title: '',
    subtitle: '',
    relevantDocNumbers: [],
    context: {}
  });

  const refreshAll = () => {
    procurementService.reloadAll();
    setSuppliers(procurementService.getSuppliers());
    setRfqs(procurementService.getRfqs());
    setPos(procurementService.getPurchaseOrders());
    setGrns(procurementService.getGrns());
    setRequisitions(procurementService.getRequisitions());
    setAuctions(procurementService.getReverseAuctions());
    setContracts(procurementService.getContracts());
    setScns(procurementService.getScns());
    setInvoicesList(procurementService.getInvoices());
    setNcrs(procurementService.getNcrs());
    setInventory(procurementService.getInventory());
    setScrap(procurementService.getScrapRecords());
    setEmergencies(procurementService.getEmergencyRequests());
    setAnalytics(procurementService.getAnalytics());
    setHhiData(procurementService.calculateHHI());
    setCostItemsCount(procurementCostService.getCostItems().length);
  };

  // Actions
  const handleApprovePo = (po: PurchaseOrder) => {
    const canApprove = hasPermission('po.approve') || currentUser?.roleId === 'role-superadmin';
    if (!canApprove) {
      setActionAlert({ type: 'error', message: 'Permission Denied: Requires "po.approve" authorization.' });
      return;
    }
    if (currentUser && po.createdBy.toLowerCase() === currentUser.fullName.toLowerCase() && currentUser.roleId !== 'role-superadmin') {
      setActionAlert({ type: 'warning', message: 'Segregation of Duties (SoD): Rule SOD-PO-PAY prohibits approving orders created by yourself.' });
      return;
    }

    const updated = procurementService.approvePurchaseOrder(po.id, currentUser?.fullName || 'Authorized Approver');
    if (updated) {
      setActionAlert({ type: 'success', message: `Purchase Order ${po.poNumber} approved.` });
      refreshAll();
    }
  };

  const handleIssuePo = (po: PurchaseOrder) => {
    const updated = procurementService.issuePurchaseOrder(po.id);
    if (updated) {
      setActionAlert({ type: 'success', message: `Purchase Order ${po.poNumber} issued to ${po.supplierName}.` });
      refreshAll();
    }
  };

  const handleSubmitRequisition = () => {
    if (!newPrData.itemDesc) {
      setActionAlert({ type: 'error', message: 'Please provide item description.' });
      return;
    }
    const totalEst = newPrData.itemQty * newPrData.itemUnitPrice;
    const res = procurementService.saveRequisition({
      id: '',
      requisitionNumber: '',
      projectId: newPrData.projectId,
      projectName: newPrData.projectName,
      department: newPrData.department,
      requestedBy: newPrData.requestedBy,
      priority: newPrData.priority,
      requiredByDate: newPrData.requiredByDate,
      status: 'Submitted',
      budgetCategoryCode: 'CAT-STL-STRUCT',
      budgetAllocatedAmount: 1500000,
      budgetCommittedAmount: 0,
      budgetExceeded: false,
      justification: newPrData.justification,
      items: [
        {
          id: `pri-${Date.now()}`,
          description: newPrData.itemDesc,
          quantity: newPrData.itemQty,
          unit: newPrData.itemUnit,
          estimatedUnitPrice: newPrData.itemUnitPrice,
          totalEstimatedPrice: totalEst,
          category: newPrData.category,
          requiredDate: newPrData.requiredByDate
        }
      ],
      totalEstimatedCost: totalEst,
      createdAt: new Date().toISOString()
    });

    setActionAlert({
      type: res.budgetBlocked ? 'error' : 'success',
      message: res.message
    });
    setIsNewPrModalOpen(false);
    refreshAll();
  };

  const handleConvertPrToPo = (pr: PurchaseRequisition) => {
    if (pr.status === 'Budget Blocked') {
      setActionAlert({ type: 'error', message: 'Cannot convert: Requisition is blocked by budget allocation limit.' });
      return;
    }
    const sup = suppliers[0];
    const createdPo = procurementService.convertRequisitionToPo(pr.id, sup.id, sup.name);
    if (createdPo) {
      setActionAlert({ type: 'success', message: `Requisition ${pr.requisitionNumber} converted to draft PO ${createdPo.poNumber}.` });
      refreshAll();
    }
  };

  const handleConvertPrToRfq = (pr: PurchaseRequisition) => {
    const createdRfq = procurementService.convertRequisitionToRfq(pr.id);
    if (createdRfq) {
      setActionAlert({ type: 'success', message: `Requisition ${pr.requisitionNumber} converted to RFQ tender ${createdRfq.rfqNumber}.` });
      refreshAll();
    }
  };

  const handlePlaceAuctionBid = () => {
    if (!auctionBidModal || !selectedBidderSupplierId || auctionBidAmount <= 0) return;
    const res = procurementService.placeAuctionBid(auctionBidModal.id, selectedBidderSupplierId, auctionBidAmount);
    setActionAlert({
      type: res.success ? 'success' : 'error',
      message: res.message
    });
    if (res.success) {
      setAuctionBidModal(null);
      refreshAll();
    }
  };

  const handleCloseAuction = (auc: ReverseAuction) => {
    const po = procurementService.closeAuction(auc.id);
    setActionAlert({
      type: 'success',
      message: `Auction ${auc.auctionNumber} closed. PO ${po ? po.poNumber : ''} generated for winning supplier.`
    });
    refreshAll();
  };

  const handleSignScn = (scn: ServiceCompletionNote, role: 'supervisor' | 'site_manager' | 'qa') => {
    const signer = currentUser?.fullName || 'Authorized Engineer';
    procurementService.signScn(scn.id, role, signer);
    setActionAlert({ type: 'success', message: `SCN ${scn.scnNumber} signed by ${signer} (${role}).` });
    refreshAll();
  };

  const handleApproveInvoice = (inv: SupplierInvoice) => {
    const approver = currentUser?.fullName || 'Accounts Payable Officer';
    const res = procurementService.approveInvoice(inv.id, approver);
    setActionAlert({
      type: res.success ? 'success' : 'error',
      message: res.message
    });
    if (res.success) {
      if (onSaveInvoice) {
        onSaveInvoice({
          ...inv,
          status: 'Approved',
          approvedBy: approver,
          approvedAt: new Date().toISOString()
        });
      }
      if (onAddActualCostRecord) {
        const matchingPo = pos.find(p => p.poNumber === inv.poNumber);
        onAddActualCostRecord({
          projectId: matchingPo?.projectId || inv.projectId || 'central-proj',
          costCategory: 'Procurement',
          amount: inv.totalAmount,
          description: `Approved Invoice ${inv.invoiceNumber} (PO: ${inv.poNumber})`,
          date: new Date().toISOString()
        });
      }
      refreshAll();
    }
  };

  const handleIssueNcr = () => {
    const sup = suppliers.find(s => s.id === newNcrData.supplierId);
    if (!sup) return;
    procurementService.issueNcr({
      id: '',
      ncrNumber: '',
      sourceType: newNcrData.sourceType,
      sourceRef: newNcrData.sourceRef,
      supplierId: sup.id,
      supplierName: sup.name,
      projectId: newNcrData.projectId,
      projectName: newNcrData.projectName,
      severity: newNcrData.severity,
      title: newNcrData.title,
      description: newNcrData.description,
      status: 'CAPA Pending',
      holdPaymentApplied: true,
      reportedBy: currentUser?.fullName || 'QA Inspector',
      reportedDate: new Date().toISOString().split('T')[0]
    });
    setActionAlert({
      type: 'warning',
      message: `NCR logged with severity ${newNcrData.severity}. Payment intercept active for supplier ${sup.name}.`
    });
    setIsNewNcrModalOpen(false);
    refreshAll();
  };

  const handleResolveNcr = (ncr: ProcurementNCR) => {
    const resolved = procurementService.resolveNcr(ncr.id, 'Verified corrective replacement batch and updated calibration certificate.');
    setActionAlert({
      type: 'success',
      message: `NCR ${resolved.ncrNumber} resolved. Payment holds cleared.`
    });
    refreshAll();
  };

  const handleDeclareScrap = () => {
    procurementService.declareScrap({
      id: '',
      code: '',
      projectId: newScrapData.projectId,
      projectName: newScrapData.projectName,
      materialCategory: newScrapData.materialCategory,
      description: newScrapData.description,
      weightKg: Number(newScrapData.weightKg),
      estimatedValue: Number(newScrapData.estimatedValue),
      status: 'Intercept Window',
      declarationDate: '',
      interceptExpiryDate: ''
    });
    setActionAlert({
      type: 'success',
      message: 'Scrap lot declared. 7-day mandatory internal intercept window started for site reuse.'
    });
    setIsNewScrapModalOpen(false);
    refreshAll();
  };

  const handleInterceptScrap = () => {
    if (!interceptScrapModal || !targetReclaimProjectId) return;
    const proj = projects.find(p => p.id === targetReclaimProjectId) || { id: targetReclaimProjectId, name: 'Dubai Mall Fashion Avenue Canopy Extension' };
    procurementService.interceptScrapForProject(interceptScrapModal.id, proj.id, proj.name || proj.id, currentUser?.fullName || 'Project Manager');
    setActionAlert({
      type: 'success',
      message: `Scrap lot ${interceptScrapModal.code} reclaimed for ${proj.name || proj.id}. Diverted from landfill (Zero Waste).`
    });
    setInterceptScrapModal(null);
    refreshAll();
  };

  const handleCreateEmergency = () => {
    const res = procurementService.createEmergencyRequest({
      id: '',
      requestNumber: '',
      projectId: newEmergencyData.projectId,
      projectName: newEmergencyData.projectName,
      incidentType: newEmergencyData.incidentType,
      urgencyLevel: 'Critical',
      description: newEmergencyData.description,
      estimatedCost: Number(newEmergencyData.estimatedCost),
      status: 'Pending',
      safetyOverride: true,
      retroactiveAuditComplete: false,
      requestedBy: newEmergencyData.requestedBy,
      createdAt: ''
    });
    setActionAlert({
      type: 'warning',
      message: `Safety bypass authorized: Express PO ${res.expressPo.poNumber} issued immediately. Retroactive audit gate pending.`
    });
    setIsNewEmergencyModalOpen(false);
    refreshAll();
  };

  const handleCreatePo = () => {
    const sup = suppliers.find(s => s.id === newPoData.supplierId) || suppliers[0];
    const subtotal = newPoData.qty * newPoData.unitPrice;
    const vat = subtotal * 0.05;
    procurementService.savePurchaseOrder({
      id: '',
      poNumber: '',
      supplierId: sup.id,
      supplierName: sup.name,
      projectId: newPoData.projectId,
      projectName: newPoData.projectName,
      receivingBranch: 'Dubai Fabrication Yard',
      orderDate: new Date().toISOString().split('T')[0],
      expectedDeliveryDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      items: [
        {
          id: `poi-${Date.now()}`,
          description: newPoData.itemDesc,
          quantity: newPoData.qty,
          receivedQuantity: 0,
          unit: newPoData.unit,
          unitPrice: newPoData.unitPrice,
          totalAmount: subtotal,
          category: newPoData.category
        }
      ],
      subtotal,
      vatRatePercent: 5,
      vatAmount: vat,
      totalAmount: subtotal + vat,
      currency: 'AED',
      paymentTerms: newPoData.paymentTerms,
      status: 'Pending Approval',
      matchingStatus: 'Unmatched',
      createdBy: currentUser?.fullName || 'Alexander Vance',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    setActionAlert({ type: 'success', message: 'New Purchase Order created and queued for dual approval.' });
    setIsNewPoModalOpen(false);
    refreshAll();
  };

  const tabsConfig: { id: ProcurementTab; label: string; icon: any; badge?: number }[] = [
    { id: 'landing', label: 'Landing Hub', icon: LayoutDashboard },
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'costing', label: 'Costing', icon: DollarSign, badge: costItemsCount },
    { id: 'documents', label: 'Documents', icon: FileText, badge: 89 },
    { id: 'pos', label: 'Orders', icon: ShoppingCart, badge: pos.length },
    { id: 'pr', label: 'Requests', icon: FileText, badge: requisitions.length },
    { id: 'rfq', label: 'Sourcing', icon: FileSpreadsheet, badge: rfqs.length },
    { id: 'auctions', label: 'Auctions', icon: Radio, badge: auctions.filter(a => a.status === 'Active').length },
    { id: 'grn', label: 'Receiving', icon: Boxes, badge: grns.length },
    { id: 'scn', label: 'Services', icon: FileCheck, badge: scns.length },
    { id: 'invoices', label: 'Invoices', icon: CheckCircle2, badge: invoicesList.length },
    { id: 'ncrs', label: 'Quality', icon: ShieldAlert, badge: ncrs.filter(n => n.status !== 'Closed').length },
    { id: 'inventory', label: 'Stock', icon: Layers, badge: inventory.length },
    { id: 'scrap', label: 'Scrap', icon: Scale, badge: scrap.length },
    { id: 'emergency', label: 'Emergency', icon: HardHat, badge: emergencies.length },
    { id: 'contracts', label: 'Contracts', icon: FolderOpen, badge: contracts.length },
    { id: 'suppliers', label: 'Suppliers', icon: Users, badge: suppliers.length },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp }
  ];

  const overviewTrendData = [
    { month: 'Apr', commitments: 120000, delivered: 110000, savings: 14000 },
    { month: 'May', commitments: 165000, delivered: 145000, savings: 18500 },
    { month: 'Jun', commitments: 195000, delivered: 180000, savings: 22000 },
    { month: 'Jul', commitments: 140000, delivered: 135000, savings: 15000 },
    { month: 'Aug', commitments: 210000, delivered: 190000, savings: 26500 },
    { month: 'Sep', commitments: 245000, delivered: 205000, savings: 31200 }
  ];

  const categoryPieData = analytics.spendByCategory.map(cat => ({
    name: cat.category.split(' ')[0],
    fullName: cat.category,
    value: cat.amount
  }));

  const PIE_COLORS = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#06b6d4', '#ec4899'];

  return (
    <div className="space-y-3 font-sans text-slate-800">
      {/* 1. Header Card (Matching User's Reference Design) */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-orange-500 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
            <Truck size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">Procurement</h1>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-slate-500 font-normal">Centralized sourcing, orders, 3-way matching & inventory</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              procurementService.syncWithCentralData(projects, itemCatalog, productVariants);
              refreshAll();
              setActionAlert({ type: 'success', message: `Synchronized with ${projects.length} central projects & master materials.` });
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            title="Synchronize with Central Database"
          >
            <RefreshCw size={13} className="text-slate-500" />
            <span>Central Sync</span>
          </button>
          <button
            onClick={() => setIsNewPoModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus size={14} />
            <span>New Order</span>
          </button>
        </div>
      </div>

      {/* 2. Sub-Tabs Bar (One-word labels with minimal space and compact footprint) */}
      <div className="flex items-center gap-1 bg-slate-50/90 p-1 rounded-xl border border-slate-200/90 overflow-x-auto scrollbar-none">
        {tabsConfig.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-2 py-1 rounded-lg text-xs flex items-center gap-1 shrink-0 transition-all cursor-pointer whitespace-nowrap",
                isActive
                  ? "bg-white text-orange-600 shadow-2xs border border-orange-200/80 font-semibold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60 font-medium"
              )}
              title={tab.label}
            >
              <Icon size={12} className={isActive ? "text-orange-600" : "text-slate-400"} />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className={cn(
                  "text-[9px] px-1 py-0.2 rounded-full font-mono font-medium",
                  isActive ? "bg-orange-100 text-orange-700" : "bg-slate-200/70 text-slate-600"
                )}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {activeTab === 'landing' ? (
        <ProcurementLandingPage
          onNavigateTab={(t) => setActiveTab(t)}
          onOpenNewPo={() => setIsNewPoModalOpen(true)}
          onOpenNewPr={() => setIsNewPrModalOpen(true)}
          onOpenNewNcr={() => setIsNewNcrModalOpen(true)}
          onOpenNewScrap={() => setIsNewScrapModalOpen(true)}
          onOpenNewEmergency={() => setIsNewEmergencyModalOpen(true)}
          onSyncCentral={() => {
            procurementService.syncWithCentralData(projects, itemCatalog, productVariants);
            refreshAll();
            setActionAlert({ type: 'success', message: `Synchronized with ${projects.length} central projects & master materials.` });
          }}
          counts={{
            pos: pos.length,
            pr: requisitions.length,
            rfq: rfqs.length,
            auctions: auctions.filter(a => a.status === 'Active').length,
            grn: grns.length,
            scn: scns.length,
            invoices: invoicesList.length,
            ncrs: ncrs.filter(n => n.status !== 'Closed').length,
            inventory: inventory.length,
            scrap: scrap.length,
            emergency: emergencies.length,
            contracts: contracts.length,
            suppliers: suppliers.length,
            costItems: costItemsCount,
            documents: 89
          }}
        />
      ) : (
        <>
          {/* 3. Sub-Header Bar (Status & Quick Launch) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white/80 px-3 py-2 rounded-xl border border-slate-200/70">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-700 flex-wrap">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
              <span className="font-bold text-slate-900">Live Operations</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500">
                Active Central Database: <strong className="text-slate-800 font-mono">{projects.length}</strong> Projects & Master Catalog Connected
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setActiveTab('landing')}
                className="px-2.5 py-1 bg-orange-50 border border-orange-200 hover:bg-orange-100 text-orange-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs mr-1 cursor-pointer"
                title="Return to Procurement Landing Hub"
              >
                <LayoutDashboard size={12} className="text-orange-600" />
                <span>Landing Hub</span>
              </button>
              <button
                onClick={() => setIsNewPrModalOpen(true)}
                className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg flex items-center gap-1 transition-colors shadow-2xs"
              >
                <Plus size={12} className="text-orange-500" />
                <span>Add PR</span>
              </button>
              <button
                onClick={() => setIsNewPoModalOpen(true)}
                className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg flex items-center gap-1 transition-colors shadow-2xs"
              >
                <Plus size={12} className="text-orange-500" />
                <span>Add PO</span>
              </button>
              <button
                onClick={() => setIsNewEmergencyModalOpen(true)}
                className="px-2.5 py-1 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 text-xs font-medium rounded-lg flex items-center gap-1 transition-colors"
              >
                <HardHat size={12} />
                <span>Emergency</span>
              </button>
              <button
                onClick={() => setIsNewScrapModalOpen(true)}
                className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-700 text-xs font-medium rounded-lg flex items-center gap-1 transition-colors"
              >
                <Scale size={12} />
                <span>Scrap Lot</span>
              </button>
              <button
                onClick={() => setIsNewNcrModalOpen(true)}
                className="px-2.5 py-1 bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-700 text-xs font-medium rounded-lg flex items-center gap-1 transition-colors"
              >
                <ShieldAlert size={12} />
                <span>Log NCR</span>
              </button>
            </div>
          </div>

      {/* 4. 5 KPI Stat Cards Row (Exact layout from reference) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white border border-slate-200/90 rounded-xl p-3 hover:border-slate-300 transition-all shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-600 truncate">Total Active POs</span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 shrink-0">+3.2%</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight my-1">{pos.length}</div>
          <button onClick={() => setActiveTab('pos')} className="text-[11px] text-slate-500 hover:text-orange-600 font-medium flex items-center justify-between pt-1.5 border-t border-slate-100 transition-colors">
            <span>+{pos.filter(p => p.status !== 'Completed').length} orders in progress</span>
            <ChevronRight size={13} />
          </button>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-3 hover:border-slate-300 transition-all shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-600 truncate">Pending Requisitions</span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 shrink-0">+1.5%</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight my-1">{requisitions.length}</div>
          <button onClick={() => setActiveTab('pr')} className="text-[11px] text-slate-500 hover:text-orange-600 font-medium flex items-center justify-between pt-1.5 border-t border-slate-100 transition-colors">
            <span>+{requisitions.filter(r => r.status === 'Submitted' || r.status === 'Draft').length} awaiting approval</span>
            <ChevronRight size={13} />
          </button>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-3 hover:border-slate-300 transition-all shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-600 truncate">Active RFQs & Sourcing</span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 shrink-0">+2.2%</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight my-1">{rfqs.length + auctions.length}</div>
          <button onClick={() => setActiveTab('rfq')} className="text-[11px] text-slate-500 hover:text-orange-600 font-medium flex items-center justify-between pt-1.5 border-t border-slate-100 transition-colors">
            <span>+{auctions.filter(a => a.status === 'Active').length} live reverse auctions</span>
            <ChevronRight size={13} />
          </button>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-3 hover:border-slate-300 transition-all shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-600 truncate">3-Way Match Invoices</span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 shrink-0">+2.1%</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight my-1">{invoicesList.length}</div>
          <button onClick={() => setActiveTab('invoices')} className="text-[11px] text-slate-500 hover:text-orange-600 font-medium flex items-center justify-between pt-1.5 border-t border-slate-100 transition-colors">
            <span>0 discrepancy holds</span>
            <ChevronRight size={13} />
          </button>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-3 hover:border-slate-300 transition-all shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-600 truncate">Warehouse Stock Items</span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 shrink-0">+2.8%</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight my-1">{inventory.length}</div>
          <button onClick={() => setActiveTab('inventory')} className="text-[11px] text-slate-500 hover:text-orange-600 font-medium flex items-center justify-between pt-1.5 border-t border-slate-100 transition-colors">
            <span>+{inventory.filter(i => i.availableQuantity <= i.reorderLevel).length} reorders suggested</span>
            <ChevronRight size={13} />
          </button>
        </div>
      </div>

      {/* Action Notification Alert Banner */}
      {actionAlert && (
        <div className={`px-3 py-1.5 rounded-lg flex items-center justify-between text-xs border ${
          actionAlert.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
          actionAlert.type === 'warning' ? 'bg-amber-50 text-amber-800 border-amber-200' :
          'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          <div className="flex items-center gap-1.5">
            {actionAlert.type === 'success' ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
            <span>{actionAlert.message}</span>
          </div>
          <button onClick={() => setActionAlert(null)} className="text-slate-400 hover:text-slate-700 font-bold px-1">&times;</button>
        </div>
      )}

      {/* Single-Line Search & Project Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-1.5 flex flex-wrap items-center gap-2 text-xs">
        <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 rounded text-slate-800 font-semibold shrink-0 text-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
          <span>
            {activeTab === 'overview' && 'Procurement Overview'}
            {activeTab === 'costing' && `Cost Items & Rates (${costItemsCount})`}
            {activeTab === 'documents' && 'Procurement Documents Package (89)'}
            {activeTab === 'pos' && `Purchase Orders (${pos.length})`}
            {activeTab === 'pr' && `Requisitions (${requisitions.length})`}
            {activeTab === 'rfq' && `RFQs & Bids (${rfqs.length})`}
            {activeTab === 'auctions' && `Live Auctions (${auctions.filter(a => a.status === 'Active').length})`}
            {activeTab === 'grn' && `Receiving GRN (${grns.length})`}
            {activeTab === 'scn' && `Service Notes SCN (${scns.length})`}
            {activeTab === 'invoices' && `3-Way Match Invoices (${invoicesList.length})`}
            {activeTab === 'ncrs' && `Quality NCRs (${ncrs.filter(n => n.status !== 'Closed').length})`}
            {activeTab === 'inventory' && `Warehouse Stock (${inventory.length})`}
            {activeTab === 'scrap' && `Scrap & Recovery (${scrap.length})`}
            {activeTab === 'emergency' && `Emergency Bypass (${emergencies.length})`}
            {activeTab === 'contracts' && `Framework Contracts (${contracts.length})`}
            {activeTab === 'suppliers' && `Suppliers Directory (${suppliers.length})`}
            {activeTab === 'analytics' && 'Spend & HHI Analytics'}
          </span>
        </div>

        {/* Central Project Filter Dropdown */}
        <select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700 outline-none max-w-[200px]"
        >
          <option value="ALL">All Central Projects ({projects.length})</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>
              {p.projectName || p.name || p.id}
            </option>
          ))}
        </select>

        <div className="relative flex-1 min-w-[180px]">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by code, supplier, project, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-7 pr-3 py-1 bg-transparent border-0 outline-none text-xs text-slate-800 placeholder:text-slate-400"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700 outline-none"
        >
          <option value="ALL">All Categories</option>
          <option value="Structural Steel & Alloys">Structural Steel & Alloys</option>
          <option value="Aluminium Extrusions & Panels">Aluminium Extrusions & Panels</option>
          <option value="Hardware & Fasteners">Hardware & Fasteners</option>
          <option value="Industrial Coatings & Paints">Industrial Coatings & Paints</option>
          <option value="Architectural Glass">Architectural Glass</option>
          <option value="Welding & Fabrication Consumables">Consumables & Gases</option>
        </select>
      </div>

      {/* 5. Main Tab Content Views (Simple, Single-Line Layouts) */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">

        {/* TAB: OVERVIEW DASHBOARD */}
        {activeTab === 'overview' && (
          <div className="p-3.5 space-y-4">
            {/* Visual Analytics Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              {/* Spend & Velocity Chart */}
              <div className="lg:col-span-2 bg-slate-50/60 border border-slate-200/80 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Activity size={14} className="text-orange-500" />
                    <span className="text-xs font-bold text-slate-800">Procurement Velocity & Spend Commitments (AED)</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500" /> PO Commitments</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Goods Received</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Cost Savings</span>
                  </div>
                </div>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={overviewTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorCommit" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f97316" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0.0}/>
                        </linearGradient>
                        <linearGradient id="colorReceipts" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                      <RechartsTooltip formatter={(v: any) => [`AED ${Number(v).toLocaleString()}`, '']} />
                      <Area type="monotone" dataKey="commitments" stroke="#f97316" strokeWidth={2} fillOpacity={1} fill="url(#colorCommit)" name="Commitments" />
                      <Area type="monotone" dataKey="delivered" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorReceipts)" name="Delivered Receipts" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Category Breakdown Donut */}
              <div className="bg-slate-50/60 border border-slate-200/80 rounded-xl p-3 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-800">Category Sourcing Allocation</span>
                  <span className="text-[10px] text-slate-500 font-mono">AED {(analytics.totalSpendYTD/1000).toFixed(0)}k Total</span>
                </div>
                <div className="h-40 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={36}
                        outerRadius={62}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {categoryPieData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(v: any) => [`AED ${Number(v).toLocaleString()}`, 'Spend']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1 mt-1 text-[11px]">
                  {categoryPieData.slice(0, 4).map((cat, i) => (
                    <div key={cat.name} className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-600 truncate max-w-[140px]">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                        {cat.name}
                      </span>
                      <span className="font-mono font-medium text-slate-800">AED {(cat.value/1000).toFixed(1)}k</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Procurement Activity Strip */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText size={13} className="text-orange-500" />
                  <span className="text-xs font-bold text-slate-800">Active Procurement Pipeline & Recent Actions</span>
                </div>
                <button
                  onClick={() => setActiveTab('pos')}
                  className="text-[11px] font-medium text-orange-600 hover:text-orange-700 flex items-center gap-1"
                >
                  <span>View All {pos.length} Purchase Orders</span>
                  <ChevronRight size={12} />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-white text-slate-400 border-b border-slate-100 text-[11px]">
                      <th className="py-2 px-3">Order / Reference</th>
                      <th className="py-2 px-3">Type</th>
                      <th className="py-2 px-3">Supplier / Vendor</th>
                      <th className="py-2 px-3">Central Project</th>
                      <th className="py-2 px-3 text-right">Amount</th>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pos.slice(0, 5).map(po => (
                      <tr key={po.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2 px-3 font-mono font-semibold text-slate-900">{po.poNumber}</td>
                        <td className="py-2 px-3 text-slate-500">Commercial PO</td>
                        <td className="py-2 px-3 text-slate-700 font-medium">{po.supplierName}</td>
                        <td className="py-2 px-3 text-slate-600 truncate max-w-[200px]">{po.projectName}</td>
                        <td className="py-2 px-3 text-right font-mono font-semibold text-slate-900">AED {po.totalAmount.toLocaleString()}</td>
                        <td className="py-2 px-3">
                          <span className={cn(
                            "px-1.5 py-0.5 rounded text-[10px] font-medium",
                            po.status === 'Issued' ? "bg-emerald-50 text-emerald-700" :
                            po.status === 'Approved' ? "bg-blue-50 text-blue-700" :
                            "bg-amber-50 text-amber-700"
                          )}>
                            {po.status}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right">
                          <button
                            onClick={() => setSelectedPoDetails(po)}
                            className="text-[11px] text-orange-600 hover:text-orange-700 font-medium cursor-pointer"
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB: COSTING (Procurement Cost Items Hub: Materials, Outside Services, Subcontractors, Plant & BOM Dependencies) */}
        {activeTab === 'costing' && (
          <div className="w-full">
            <ProcurementCostManager
              projects={projects}
              suppliers={suppliers}
              productVariants={productVariants}
              itemTemplates={itemCatalog}
              onNavigateToProject={onNavigateToProject}
              currency="LKR"
            />
          </div>
        )}

        {/* TAB: DOCUMENTS (All 89 Formal Procurement Documents Hub) */}
        {activeTab === 'documents' && (
          <div className="w-full">
            <ProcurementDocumentsHub
              projects={projects}
              suppliers={suppliers}
            />
          </div>
        )}

        {/* TAB: PURCHASE ORDERS */}
        {activeTab === 'pos' && (
          <div className="space-y-3">
            {/* Filter Bar */}
            <div className="p-3 bg-white border border-slate-200/80 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1 flex-wrap">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="Search PO # (PK), project (FK), supplier..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:border-orange-500 transition-colors shadow-2xs"
                  />
                </div>

                {/* Project Filter (FK) */}
                <div className="flex items-center gap-1.5 bg-orange-50/70 px-2.5 py-1.5 rounded-xl border border-orange-200/80">
                  <FolderOpen size={12} className="text-orange-500 shrink-0" />
                  <select
                    value={projectFilter}
                    onChange={(e) => setProjectFilter(e.target.value)}
                    className="bg-transparent text-xs font-semibold text-orange-900 outline-none cursor-pointer max-w-[170px] truncate"
                    title="Filter by Project (Foreign Key)"
                  >
                    <option value="ALL">All Projects (FK)</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>
                        [{p.projectCode || p.id.slice(0, 8)}] {p.projectName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={() => setIsNewPoModalOpen(true)}
                className="px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs flex items-center gap-1.5 shrink-0"
              >
                <Plus size={14} />
                <span>Issue Purchase Order</span>
              </button>
            </div>

            {/* List View: High-density One-Line Row Table */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[10px] font-bold text-slate-600 uppercase tracking-wider select-none whitespace-nowrap">
                      <th className="py-2.5 px-3">PO Number (PK)</th>
                      <th className="py-2.5 px-3">Project Code (FK)</th>
                      <th className="py-2.5 px-3">Supplier Account</th>
                      <th className="py-2.5 px-3">Project Title</th>
                      <th className="py-2.5 px-3">Order Date</th>
                      <th className="py-2.5 px-3">Expected</th>
                      <th className="py-2.5 px-3 text-right">Contract Sum</th>
                      <th className="py-2.5 px-3 text-center">3-Way Match</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pos
                      .filter(p => {
                        const q = searchQuery.toLowerCase().trim();
                        const matchesSearch = !q ||
                          p.poNumber.toLowerCase().includes(q) ||
                          p.supplierName.toLowerCase().includes(q) ||
                          (p.projectName && p.projectName.toLowerCase().includes(q)) ||
                          (p.projectId && p.projectId.toLowerCase().includes(q));
                        const targetProj = projects.find(prj => prj.id === projectFilter || prj.projectCode === projectFilter);
                        const matchesProject = projectFilter === 'ALL' || 
                          p.projectId === projectFilter || 
                          (targetProj && (p.projectId === targetProj.id || (p.projectName && p.projectName.toLowerCase().includes(targetProj.projectName.toLowerCase()))));
                        return matchesSearch && matchesProject;
                      })
                      .map(po => {
                        const matchedProj = projects.find(prj => prj.id === po.projectId || (prj.projectCode && prj.projectCode === po.projectId) || (po.projectName && prj.projectName.toLowerCase().includes(po.projectName.toLowerCase())));
                        const pCode = matchedProj?.projectCode || (po.projectId ? po.projectId.slice(0, 10) : 'PRJ-2026-001');

                        return (
                          <tr key={po.id} className="hover:bg-slate-50/70 transition-colors whitespace-nowrap group">
                            {/* PK: PO Number */}
                            <td className="py-2.5 px-3">
                              <button
                                onClick={() => setSelectedPoDetails(po)}
                                className="font-mono font-bold text-xs text-slate-900 bg-slate-100 hover:bg-orange-50 hover:text-orange-600 px-2 py-0.5 rounded border border-slate-200 inline-flex items-center gap-1 shadow-2xs transition-colors"
                                title={`Primary Key: ${po.poNumber} (Click for Details)`}
                              >
                                <ShoppingCart size={11} className="text-orange-500 shrink-0" />
                                <span>PK: {po.poNumber}</span>
                              </button>
                            </td>

                            {/* FK: Project Code */}
                            <td className="py-2.5 px-3">
                              <button
                                onClick={() => {
                                  if (onNavigateToProject && matchedProj) {
                                    onNavigateToProject(matchedProj.id);
                                  } else {
                                    setProjectFilter(matchedProj?.id || po.projectId || 'ALL');
                                  }
                                }}
                                className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-orange-700 bg-orange-50 hover:bg-orange-100 px-2 py-0.5 rounded border border-orange-200/80 transition-colors shadow-2xs"
                                title={`Foreign Key: Project Code ${pCode} (Click to open project or filter)`}
                              >
                                <FolderOpen size={11} className="text-orange-500 shrink-0" />
                                <span>FK: {pCode}</span>
                              </button>
                            </td>

                            {/* Supplier Account */}
                            <td className="py-2.5 px-3 max-w-[160px]">
                              <span className="font-medium text-slate-800 truncate block text-xs" title={po.supplierName}>
                                {po.supplierName}
                              </span>
                            </td>

                            {/* Project Title (Single Line) */}
                            <td className="py-2.5 px-3 max-w-[200px]">
                              <span className="font-semibold text-slate-900 truncate block text-xs" title={po.projectName}>
                                {po.projectName}
                              </span>
                            </td>

                            {/* Order Date */}
                            <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                              {po.orderDate}
                            </td>

                            {/* Expected Delivery */}
                            <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                              {po.expectedDeliveryDate}
                            </td>

                            {/* Total Contract Sum */}
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                              AED {po.totalAmount.toLocaleString()}
                            </td>

                            {/* 3-Way Match */}
                            <td className="py-2.5 px-3 text-center">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                                po.matchingStatus === '3-Way Matched' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                po.matchingStatus === '2-Way Matched' ? 'bg-sky-50 text-sky-700 border-sky-200' :
                                po.matchingStatus === 'Variance Flagged' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                'bg-slate-100 text-slate-600 border-slate-200'
                              }`}>
                                {po.matchingStatus}
                              </span>
                            </td>

                            {/* Status */}
                            <td className="py-2.5 px-3 text-center">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                                po.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                po.status === 'Approved' ? 'bg-sky-50 text-sky-700 border-sky-200' :
                                po.status === 'Issued' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                po.status === 'Pending Approval' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                'bg-slate-100 text-slate-600 border-slate-200'
                              }`}>
                                {po.status}
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="py-2.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                {po.status === 'Pending Approval' && (
                                  <button
                                    onClick={() => handleApprovePo(po)}
                                    className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-medium transition-colors"
                                  >
                                    Approve
                                  </button>
                                )}
                                {po.status === 'Approved' && (
                                  <button
                                    onClick={() => handleIssuePo(po)}
                                    className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[11px] font-medium transition-colors"
                                  >
                                    Issue
                                  </button>
                                )}
                                <button
                                  onClick={() => setSelectedPoDetails(po)}
                                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium transition-colors"
                                >
                                  Details
                                </button>
                                <button
                                  onClick={() => setContextModalConfig({
                                    isOpen: true,
                                    title: `Purchase Order Documents: ${po.poNumber}`,
                                    subtitle: `${po.projectName} • ${po.supplierName}`,
                                    relevantDocNumbers: [42, 70, 72, 37, 19, 38],
                                    context: {
                                      projectId: po.projectId,
                                      projectName: po.projectName,
                                      vendorName: po.supplierName,
                                      refNo: po.poNumber
                                    }
                                  })}
                                  className="px-2 py-0.5 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200/80 rounded text-[11px] font-semibold transition-colors flex items-center gap-1 shadow-2xs"
                                  title="PO Procurement Documents Package"
                                >
                                  <FileText size={11} className="text-orange-500" />
                                  <span>Docs</span>
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

        {/* TAB: REQUISITIONS (PR) with Defensive Budget Intercept */}
        {activeTab === 'pr' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[10px] font-bold text-slate-600 uppercase tracking-wider select-none whitespace-nowrap">
                  <th className="py-2.5 px-3">PR Number (PK)</th>
                  <th className="py-2.5 px-3">Project Code (FK)</th>
                  <th className="py-2.5 px-3">Requested By</th>
                  <th className="py-2.5 px-3">Project Name</th>
                  <th className="py-2.5 px-3 text-center">Priority</th>
                  <th className="py-2.5 px-3">Required Date</th>
                  <th className="py-2.5 px-3 text-center">Items Count</th>
                  <th className="py-2.5 px-3 text-right">Estimated (AED)</th>
                  <th className="py-2.5 px-3 text-center">Budget Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requisitions
                  .filter(pr => {
                    const q = searchQuery.toLowerCase().trim();
                    const matchesSearch = !q ||
                      pr.requisitionNumber.toLowerCase().includes(q) ||
                      pr.requestedBy.toLowerCase().includes(q) ||
                      (pr.projectName && pr.projectName.toLowerCase().includes(q));
                    const targetProj = projects.find(prj => prj.id === projectFilter || prj.projectCode === projectFilter);
                    const matchesProject = projectFilter === 'ALL' || 
                      pr.projectId === projectFilter || 
                      (targetProj && (pr.projectId === targetProj.id || (pr.projectName && pr.projectName.toLowerCase().includes(targetProj.projectName.toLowerCase()))));
                    return matchesSearch && matchesProject;
                  })
                  .map(pr => {
                    const matchedProj = projects.find(prj => prj.id === pr.projectId || (prj.projectCode && prj.projectCode === pr.projectId) || (pr.projectName && prj.projectName.toLowerCase().includes(pr.projectName.toLowerCase())));
                    const pCode = matchedProj?.projectCode || (pr.projectId ? pr.projectId.slice(0, 10) : 'PRJ-2026-001');

                    return (
                      <tr key={pr.id} className="hover:bg-slate-50/70 transition-colors whitespace-nowrap group">
                        {/* PK: PR Number */}
                        <td className="py-2.5 px-3">
                          <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 inline-flex items-center gap-1 shadow-2xs">
                            <FileText size={11} className="text-orange-500 shrink-0" />
                            <span>PK: {pr.requisitionNumber}</span>
                          </span>
                        </td>

                        {/* FK: Project Code */}
                        <td className="py-2.5 px-3">
                          <button
                            onClick={() => setProjectFilter(matchedProj?.id || pr.projectId || 'ALL')}
                            className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-orange-700 bg-orange-50 hover:bg-orange-100 px-2 py-0.5 rounded border border-orange-200/80 transition-colors shadow-2xs"
                            title={`Foreign Key: Project Code ${pCode} (Click to filter)`}
                          >
                            <FolderOpen size={11} className="text-orange-500 shrink-0" />
                            <span>FK: {pCode}</span>
                          </button>
                        </td>

                        {/* Requested By */}
                        <td className="py-2.5 px-3 max-w-[150px]">
                          <span className="font-medium text-slate-700 truncate block text-xs" title={pr.requestedBy}>
                            {pr.requestedBy}
                          </span>
                        </td>

                        {/* Project Name (Single Line) */}
                        <td className="py-2.5 px-3 max-w-[200px]">
                          <span className="font-semibold text-slate-900 truncate block text-xs" title={pr.projectName}>
                            {pr.projectName}
                          </span>
                        </td>

                        {/* Priority */}
                        <td className="py-2.5 px-3 text-center">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                            pr.priority === 'Critical' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                            pr.priority === 'High' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {pr.priority}
                          </span>
                        </td>

                        {/* Required Date */}
                        <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">{pr.requiredByDate}</td>

                        {/* Items Count */}
                        <td className="py-2.5 px-3 text-center font-mono text-slate-600 text-xs">{pr.items.length} items</td>

                        {/* Total Estimated Cost */}
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                          AED {pr.totalEstimatedCost.toLocaleString()}
                        </td>

                        {/* Budget Status */}
                        <td className="py-2.5 px-3 text-center">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                            pr.status === 'Budget Blocked' ? 'bg-rose-100 text-rose-800 border-rose-300' :
                            pr.status === 'Converted to PO' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            pr.status === 'Converted to RFQ' ? 'bg-sky-50 text-sky-700 border-sky-200' :
                            'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            {pr.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {pr.status !== 'Converted to PO' && (
                              <button
                                onClick={() => handleConvertPrToPo(pr)}
                                disabled={pr.status === 'Budget Blocked'}
                                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                                  pr.status === 'Budget Blocked'
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                    : 'bg-orange-500 hover:bg-orange-600 text-white'
                                }`}
                              >
                                To PO
                              </button>
                            )}
                            {pr.status !== 'Converted to RFQ' && (
                              <button
                                onClick={() => handleConvertPrToRfq(pr)}
                                className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium transition-colors"
                              >
                                To RFQ
                              </button>
                            )}
                            <button
                              onClick={() => setContextModalConfig({
                                isOpen: true,
                                title: `Requisition Documents: ${pr.requisitionNumber}`,
                                subtitle: `${pr.projectName} • Requested by ${pr.requestedBy}`,
                                relevantDocNumbers: [41, 42, 43, 44, 45, 47, 48, 55],
                                context: {
                                  projectId: pr.projectId,
                                  projectName: pr.projectName,
                                  refNo: pr.requisitionNumber
                                }
                              })}
                              className="px-2 py-0.5 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200/80 rounded text-[11px] font-semibold transition-colors flex items-center gap-1 shadow-2xs"
                              title="Requisition Documents Package"
                            >
                              <FileText size={11} className="text-orange-500" />
                              <span>Docs</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB: RFQS & TENDER SOURCING */}
        {activeTab === 'rfq' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[11px] font-medium">
                  <th className="py-2 px-3">RFQ Number</th>
                  <th className="py-2 px-3">Tender Title</th>
                  <th className="py-2 px-3">Project</th>
                  <th className="py-2 px-3">Delivery Deadline</th>
                  <th className="py-2 px-3">Bids</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rfqs.map(rfq => (
                  <tr key={rfq.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2 px-3 font-mono font-medium text-slate-900">{rfq.rfqNumber}</td>
                    <td className="py-2 px-3 text-slate-700 font-medium">{rfq.title}</td>
                    <td className="py-2 px-3 text-slate-600 truncate max-w-[200px]">{rfq.projectName || '—'}</td>
                    <td className="py-2 px-3 font-mono text-slate-500">{rfq.requiredDeliveryDate}</td>
                    <td className="py-2 px-3">
                      <span className="font-mono text-slate-800">{rfq.bids.length} submitted</span>
                    </td>
                    <td className="py-2 px-3">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        rfq.status === 'Awarded' ? 'bg-emerald-50 text-emerald-700' :
                        rfq.status === 'Bids Received' ? 'bg-sky-50 text-sky-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {rfq.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {rfq.bids.length > 0 && rfq.status !== 'Awarded' && (
                          <button
                            onClick={() => procurementService.awardRfq(rfq.id, rfq.bids[0].supplierId, 'Selected lowest compliant tender rate.')}
                            className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-medium transition-colors"
                          >
                            Award Best Bid
                          </button>
                        )}
                        {rfq.status === 'Awarded' && (
                          <span className="text-[11px] text-emerald-700 font-medium">Awarded: AED {rfq.awardedAmount?.toLocaleString()}</span>
                        )}
                        <button
                          onClick={() => setContextModalConfig({
                            isOpen: true,
                            title: `Tender & Sourcing Documents: ${rfq.rfqNumber}`,
                            subtitle: `${rfq.title} • ${rfq.projectName || ''}`,
                            relevantDocNumbers: [69, 72, 73, 74, 75, 87],
                            context: {
                              projectId: rfq.projectId,
                              projectName: rfq.projectName,
                              refNo: rfq.rfqNumber
                            }
                          })}
                          className="px-2 py-0.5 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200/80 rounded text-[11px] font-semibold transition-colors flex items-center gap-1 shadow-2xs"
                          title="Tender & Evaluation Documents"
                        >
                          <FileText size={11} className="text-orange-500" />
                          <span>Docs</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB: LIVE REVERSE AUCTIONS */}
        {activeTab === 'auctions' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[11px] font-medium">
                  <th className="py-2 px-3">Auction #</th>
                  <th className="py-2 px-3">Package Title</th>
                  <th className="py-2 px-3">Starting Ceiling</th>
                  <th className="py-2 px-3">Current Lowest Bid</th>
                  <th className="py-2 px-3">Leading Supplier</th>
                  <th className="py-2 px-3">Min Decrement</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auctions.map(auc => (
                  <tr key={auc.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2 px-3 font-mono font-medium text-slate-900">{auc.auctionNumber}</td>
                    <td className="py-2 px-3 text-slate-700 font-medium">{auc.title}</td>
                    <td className="py-2 px-3 font-mono text-slate-500">AED {auc.startingPrice.toLocaleString()}</td>
                    <td className="py-2 px-3 font-mono font-bold text-emerald-700">AED {auc.currentLowestBid.toLocaleString()}</td>
                    <td className="py-2 px-3 font-medium text-slate-800">{auc.currentWinningSupplierName || 'None'}</td>
                    <td className="py-2 px-3 font-mono text-slate-500">AED {auc.minDecrement.toLocaleString()}</td>
                    <td className="py-2 px-3">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium flex items-center gap-1 w-fit ${
                        auc.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {auc.status === 'Active' && <Radio size={10} className="text-emerald-500 animate-pulse" />}
                        {auc.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right">
                      {auc.status === 'Active' && (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setAuctionBidModal(auc);
                              setAuctionBidAmount(auc.currentLowestBid - auc.minDecrement);
                              setSelectedBidderSupplierId(suppliers[0]?.id || '');
                            }}
                            className="px-2 py-0.5 bg-orange-500 hover:bg-orange-600 text-white rounded text-[11px] font-medium transition-colors"
                          >
                            Place Bid
                          </button>
                          <button
                            onClick={() => handleCloseAuction(auc)}
                            className="px-2 py-0.5 bg-slate-800 hover:bg-slate-900 text-white rounded text-[11px] font-medium transition-colors"
                          >
                            Award & Close
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB: RECEIVING (GRN) */}
        {activeTab === 'grn' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[11px] font-medium">
                  <th className="py-2 px-3">GRN #</th>
                  <th className="py-2 px-3">PO Reference</th>
                  <th className="py-2 px-3">Supplier</th>
                  <th className="py-2 px-3">Delivery Date</th>
                  <th className="py-2 px-3">Storage Bin</th>
                  <th className="py-2 px-3 text-right">Delivered Value</th>
                  <th className="py-2 px-3">QC Status</th>
                  <th className="py-2 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {grns.map(grn => (
                  <tr key={grn.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2 px-3 font-mono font-medium text-slate-900">{grn.grnNumber}</td>
                    <td className="py-2 px-3 font-mono text-slate-600">{grn.poNumber}</td>
                    <td className="py-2 px-3 text-slate-700 font-medium">{grn.supplierName}</td>
                    <td className="py-2 px-3 font-mono text-slate-500">{grn.receivedDate}</td>
                    <td className="py-2 px-3 font-mono text-slate-700">{grn.storageLocationBin}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">AED {grn.totalDeliveredValue.toLocaleString()}</td>
                    <td className="py-2 px-3">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        grn.inspectionStatus === 'QC Passed' ? 'bg-emerald-50 text-emerald-700' :
                        grn.inspectionStatus === 'QC Rejected' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {grn.inspectionStatus}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <button
                        onClick={() => setSelectedGrnBarcode(grn)}
                        className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium transition-colors"
                      >
                        Barcode
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB: SERVICE COMPLETION NOTES (SCN) */}
        {activeTab === 'scn' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[11px] font-medium">
                  <th className="py-2 px-3">SCN #</th>
                  <th className="py-2 px-3">PO Reference</th>
                  <th className="py-2 px-3">Service Scope</th>
                  <th className="py-2 px-3">Supplier / Subcontractor</th>
                  <th className="py-2 px-3 text-right">Certified Amount</th>
                  <th className="py-2 px-3">Tripartite Signatures</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {scns.map(scn => (
                  <tr key={scn.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2 px-3 font-mono font-medium text-slate-900">{scn.scnNumber}</td>
                    <td className="py-2 px-3 font-mono text-slate-600">{scn.poNumber}</td>
                    <td className="py-2 px-3 text-slate-700 font-medium truncate max-w-[220px]">{scn.serviceType}</td>
                    <td className="py-2 px-3 text-slate-600">{scn.supplierName}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">AED {scn.certifiedAmount.toLocaleString()}</td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-1 text-[10px] font-mono">
                        <span className={`px-1 rounded ${scn.supervisorSignature ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'}`}>SUP</span>
                        <span className={`px-1 rounded ${scn.siteManagerSignature ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'}`}>PM</span>
                        <span className={`px-1 rounded ${scn.qaSignature ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'}`}>QA</span>
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        scn.status === 'Certified' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {scn.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right">
                      {scn.status !== 'Certified' && (
                        <div className="flex items-center justify-end gap-1">
                          {!scn.supervisorSignature && (
                            <button onClick={() => handleSignScn(scn, 'supervisor')} className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px]">Sign Sup</button>
                          )}
                          {!scn.siteManagerSignature && (
                            <button onClick={() => handleSignScn(scn, 'site_manager')} className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px]">Sign PM</button>
                          )}
                          {!scn.qaSignature && (
                            <button onClick={() => handleSignScn(scn, 'qa')} className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px]">Sign QA</button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB: INVOICES & AUTOMATED 3-WAY MATCHING */}
        {activeTab === 'invoices' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[11px] font-medium">
                  <th className="py-2 px-3">Invoice #</th>
                  <th className="py-2 px-3">Canonical ID</th>
                  <th className="py-2 px-3">Supplier</th>
                  <th className="py-2 px-3">PO Ref</th>
                  <th className="py-2 px-3 text-right">Total (AED)</th>
                  <th className="py-2 px-3">3-Way Score</th>
                  <th className="py-2 px-3">PVC Token</th>
                  <th className="py-2 px-3">Hold Status</th>
                  <th className="py-2 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoicesList.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2 px-3 font-mono font-medium text-slate-900">{inv.invoiceNumber}</td>
                    <td className="py-2 px-3 font-mono text-[11px] text-slate-500">{inv.canonicalNumber}</td>
                    <td className="py-2 px-3 text-slate-700 font-medium">{inv.supplierName}</td>
                    <td className="py-2 px-3 font-mono text-slate-600">{inv.poNumber}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">AED {inv.totalAmount.toLocaleString()}</td>
                    <td className="py-2 px-3">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                        inv.matchScore >= 90 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {inv.matchScore}%
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      {inv.paymentVerificationCode ? (
                        <span className="font-mono text-[10px] bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded border border-slate-200">
                          {inv.paymentVerificationCode}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-mono">Unminted</span>
                      )}
                    </td>
                    <td className="py-2 px-3">
                      {inv.holdPayment ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-rose-100 text-rose-800 border border-rose-200" title={inv.holdReason}>
                          FROZEN (NCR)
                        </span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-emerald-50 text-emerald-700">
                          Clear
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-right">
                      {inv.status !== 'Approved' && inv.status !== 'Paid' ? (
                        <button
                          onClick={() => handleApproveInvoice(inv)}
                          disabled={inv.holdPayment}
                          className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                            inv.holdPayment
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          }`}
                        >
                          Approve
                        </button>
                      ) : (
                        <span className="text-[11px] text-emerald-700 font-medium">Approved</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB: QUALITY ASSURANCE & NCRs */}
        {activeTab === 'ncrs' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[11px] font-medium">
                  <th className="py-2 px-3">NCR #</th>
                  <th className="py-2 px-3">Supplier</th>
                  <th className="py-2 px-3">Project</th>
                  <th className="py-2 px-3">Severity</th>
                  <th className="py-2 px-3">Issue Title</th>
                  <th className="py-2 px-3">Payment Hold</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ncrs.map(ncr => (
                  <tr key={ncr.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2 px-3 font-mono font-medium text-slate-900">{ncr.ncrNumber}</td>
                    <td className="py-2 px-3 text-slate-700 font-medium">{ncr.supplierName}</td>
                    <td className="py-2 px-3 text-slate-600 truncate max-w-[180px]">{ncr.projectName}</td>
                    <td className="py-2 px-3">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        ncr.severity === 'Critical' ? 'bg-rose-100 text-rose-800' :
                        ncr.severity === 'Major' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {ncr.severity}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-700 truncate max-w-[220px]">{ncr.title}</td>
                    <td className="py-2 px-3">
                      {ncr.holdPaymentApplied ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          PAYMENT LOCKED
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-mono">None</span>
                      )}
                    </td>
                    <td className="py-2 px-3">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        ncr.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {ncr.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right">
                      {ncr.status !== 'Resolved' && (
                        <button
                          onClick={() => handleResolveNcr(ncr)}
                          className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-medium transition-colors"
                        >
                          Resolve & Clear Hold
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB: WAREHOUSE STOCK & INVENTORY */}
        {activeTab === 'inventory' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[11px] font-medium">
                  <th className="py-2 px-3">Code</th>
                  <th className="py-2 px-3">Item Name</th>
                  <th className="py-2 px-3">Warehouse Hub</th>
                  <th className="py-2 px-3 text-right">On-Hand</th>
                  <th className="py-2 px-3 text-right">Reserved</th>
                  <th className="py-2 px-3 text-right">Available</th>
                  <th className="py-2 px-3">Bin Location</th>
                  <th className="py-2 px-3 text-right">Unit Rate (AED)</th>
                  <th className="py-2 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inventory.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2 px-3 font-mono font-medium text-slate-900">{item.code}</td>
                    <td className="py-2 px-3 text-slate-700 font-medium">{item.name}</td>
                    <td className="py-2 px-3 text-slate-600">{item.warehouse}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">{item.currentQuantity} {item.unit}</td>
                    <td className="py-2 px-3 text-right font-mono text-slate-500">{item.reservedQuantity} {item.unit}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">{item.availableQuantity} {item.unit}</td>
                    <td className="py-2 px-3 font-mono text-slate-600">{item.binLocation}</td>
                    <td className="py-2 px-3 text-right font-mono text-slate-800">{item.standardCost.toLocaleString()}</td>
                    <td className="py-2 px-3 text-right">
                      <button
                        onClick={() => {
                          procurementService.adjustInventory(item.id, 5, 'Physical stock count verified', currentUser?.fullName || 'Storekeeper');
                          refreshAll();
                        }}
                        className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium transition-colors"
                      >
                        + Adjust
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB: CIRCULAR ECONOMY SCRAP & 7-DAY RECOVERY */}
        {activeTab === 'scrap' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[11px] font-medium">
                  <th className="py-2 px-3">Lot Code</th>
                  <th className="py-2 px-3">Material Category</th>
                  <th className="py-2 px-3">Origin Project</th>
                  <th className="py-2 px-3 text-right">Weight (kg)</th>
                  <th className="py-2 px-3 text-right">Est. Value (AED)</th>
                  <th className="py-2 px-3">Intercept Window</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {scrap.map(scr => (
                  <tr key={scr.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2 px-3 font-mono font-medium text-slate-900">{scr.code}</td>
                    <td className="py-2 px-3 text-slate-700 font-medium">{scr.materialCategory}</td>
                    <td className="py-2 px-3 text-slate-600 truncate max-w-[180px]">{scr.projectName}</td>
                    <td className="py-2 px-3 text-right font-mono text-slate-900">{scr.weightKg.toLocaleString()} kg</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">AED {scr.estimatedValue.toLocaleString()}</td>
                    <td className="py-2 px-3 font-mono text-[11px] text-slate-500">
                      {scr.status === 'Intercept Window' ? `Closes ${scr.interceptExpiryDate}` : 'Window Closed'}
                    </td>
                    <td className="py-2 px-3">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        scr.status === 'Intercept Window' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                        scr.status === 'Intercepted for Project' ? 'bg-emerald-100 text-emerald-800 font-bold' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {scr.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right">
                      {scr.status === 'Intercept Window' && (
                        <button
                          onClick={() => {
                            setInterceptScrapModal(scr);
                            setTargetReclaimProjectId('PRJ-2026-002');
                          }}
                          className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-medium transition-colors"
                        >
                          Reclaim for Project
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB: EMERGENCY SOURCING BYPASS */}
        {activeTab === 'emergency' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[11px] font-medium">
                  <th className="py-2 px-3">Incident #</th>
                  <th className="py-2 px-3">Site Incident Description</th>
                  <th className="py-2 px-3">Project</th>
                  <th className="py-2 px-3 text-right">Cost (AED)</th>
                  <th className="py-2 px-3">Express PO #</th>
                  <th className="py-2 px-3">Retroactive Audit</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {emergencies.map(emg => (
                  <tr key={emg.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2 px-3 font-mono font-medium text-slate-900">{emg.requestNumber}</td>
                    <td className="py-2 px-3 text-slate-700 font-medium truncate max-w-[220px]">{emg.incidentType}</td>
                    <td className="py-2 px-3 text-slate-600 truncate max-w-[180px]">{emg.projectName}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-rose-700">AED {emg.estimatedCost.toLocaleString()}</td>
                    <td className="py-2 px-3 font-mono text-slate-700">{emg.expressPoNumber || '—'}</td>
                    <td className="py-2 px-3">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        emg.retroactiveAuditComplete ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {emg.retroactiveAuditComplete ? 'Audit Passed' : 'Audit Pending'}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-slate-100 text-slate-700">{emg.status}</span>
                    </td>
                    <td className="py-2 px-3 text-right">
                      {!emg.retroactiveAuditComplete && (
                        <button
                          onClick={() => {
                            procurementService.completeRetroactiveAudit(emg.id, 'Site inspection photo evidence and replacement log signed off.');
                            refreshAll();
                          }}
                          className="px-2 py-0.5 bg-slate-800 hover:bg-slate-900 text-white rounded text-[11px] font-medium transition-colors"
                        >
                          Sign Audit
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB: FRAMEWORK MASTER CONTRACTS */}
        {activeTab === 'contracts' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[11px] font-medium">
                  <th className="py-2 px-3">Contract #</th>
                  <th className="py-2 px-3">Agreement Title</th>
                  <th className="py-2 px-3">Supplier</th>
                  <th className="py-2 px-3 text-right">Total Envelope</th>
                  <th className="py-2 px-3 text-right">Remaining</th>
                  <th className="py-2 px-3">Renewal Date</th>
                  <th className="py-2 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {contracts.map(cnt => (
                  <tr key={cnt.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2 px-3 font-mono font-medium text-slate-900">{cnt.contractNumber}</td>
                    <td className="py-2 px-3 text-slate-700 font-medium">{cnt.title}</td>
                    <td className="py-2 px-3 text-slate-600">{cnt.supplierName}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">AED {cnt.totalValue.toLocaleString()}</td>
                    <td className="py-2 px-3 text-right font-mono text-emerald-700">AED {cnt.remainingValue.toLocaleString()}</td>
                    <td className="py-2 px-3 font-mono text-slate-500">{cnt.renewalDate}</td>
                    <td className="py-2 px-3">
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-emerald-50 text-emerald-700">{cnt.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB: SUPPLIERS DIRECTORY & COMPLIANCE */}
        {activeTab === 'suppliers' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[11px] font-medium">
                  <th className="py-2 px-3">Vendor Code</th>
                  <th className="py-2 px-3">Company Name</th>
                  <th className="py-2 px-3">Category</th>
                  <th className="py-2 px-3">Contact</th>
                  <th className="py-2 px-3">TRN / Tax ID</th>
                  <th className="py-2 px-3 text-right">OTIF %</th>
                  <th className="py-2 px-3 text-right">QC %</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {suppliers.map(sup => (
                  <tr key={sup.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2 px-3 font-mono font-medium text-slate-900">{sup.vendorCode}</td>
                    <td className="py-2 px-3 text-slate-800 font-medium">{sup.name}</td>
                    <td className="py-2 px-3 text-slate-600">{sup.category}</td>
                    <td className="py-2 px-3 text-slate-500">{sup.contactPerson}</td>
                    <td className="py-2 px-3 font-mono text-slate-500">{sup.taxRegistrationNumber}</td>
                    <td className="py-2 px-3 text-right font-mono font-medium text-emerald-700">{sup.onTimeDeliveryRate}%</td>
                    <td className="py-2 px-3 text-right font-mono font-medium text-emerald-700">{sup.qualityAcceptanceRate}%</td>
                    <td className="py-2 px-3">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        sup.status === 'Preferred' ? 'bg-orange-50 text-orange-700 border border-orange-200 font-bold' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {sup.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            procurementService.togglePreferredSupplier(sup.id);
                            refreshAll();
                          }}
                          className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium transition-colors"
                        >
                          {sup.status === 'Preferred' ? 'Unmark' : 'Star Preferred'}
                        </button>
                        <button
                          onClick={() => setContextModalConfig({
                            isOpen: true,
                            title: `Supplier Documents: ${sup.name}`,
                            subtitle: `${sup.vendorCode} • ${sup.category} • TRN: ${sup.taxRegistrationNumber}`,
                            relevantDocNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15, 16, 17, 18, 19, 20, 21, 22],
                            context: {
                              vendorName: sup.name,
                              supplierId: sup.id,
                              refNo: sup.vendorCode
                            }
                          })}
                          className="px-2 py-0.5 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200/80 rounded text-[11px] font-semibold transition-colors flex items-center gap-1 shadow-2xs"
                          title="Vendor Qualification, Master Records & Compliance Documents"
                        >
                          <FileText size={11} className="text-orange-500" />
                          <span>Docs</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB: SPEND & ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="p-4 space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
                <span className="font-bold text-slate-800 text-xs block mb-2">Category Spend Share</span>
                <div className="space-y-1.5">
                  {analytics.spendByCategory.map(cat => (
                    <div key={cat.category} className="flex items-center justify-between text-xs">
                      <span className="text-slate-700 truncate max-w-[200px]">{cat.category}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">AED {cat.amount.toLocaleString()}</span>
                        <span className="text-[10px] text-slate-500 font-mono w-10 text-right">{cat.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
                <span className="font-bold text-slate-800 text-xs block mb-2">Supplier Spend Concentration (HHI: {hhiData.hhiScore})</span>
                <div className="space-y-1.5">
                  {hhiData.topSuppliers.map(sup => (
                    <div key={sup.name} className="flex items-center justify-between text-xs">
                      <span className="text-slate-700 truncate max-w-[200px]">{sup.name}</span>
                      <span className="font-mono font-bold text-slate-900">{sup.sharePercent}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
      </>
      )}

      {/* 6. Simple, Clean Modals for Operations */}

      {/* New PR Modal */}
      {isNewPrModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-bold text-sm text-slate-900">New Purchase Requisition (PR)</span>
              <button onClick={() => setIsNewPrModalOpen(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            <div className="space-y-2.5 text-xs">
              <div>
                <label className="block text-slate-600 mb-1 font-medium">Target Central Project</label>
                <select
                  value={newPrData.projectId}
                  onChange={(e) => {
                    const sel = projects.find(p => p.id === e.target.value);
                    setNewPrData({
                      ...newPrData,
                      projectId: e.target.value,
                      projectName: sel?.projectName || sel?.name || e.target.value
                    });
                  }}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-xs outline-none bg-white font-medium"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.id}: {p.projectName || p.name}</option>
                  ))}
                </select>
              </div>

              {itemCatalog && itemCatalog.length > 0 && (
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Quick Pick from Master Item Catalog</label>
                  <select
                    onChange={(e) => {
                      const item = itemCatalog.find(it => it.id === e.target.value);
                      if (item) {
                        setNewPrData({
                          ...newPrData,
                          itemDesc: item.name || item.description || newPrData.itemDesc,
                          itemUnit: item.unit || 'MT',
                          itemUnitPrice: item.standardRate || item.costRate || newPrData.itemUnitPrice,
                          category: (item.category as any) || newPrData.category
                        });
                      }
                    }}
                    defaultValue=""
                    className="w-full px-2.5 py-1.5 border border-slate-200 bg-orange-50/50 rounded text-xs outline-none text-slate-700"
                  >
                    <option value="" disabled>-- Select from Master Catalog (Auto-fill) --</option>
                    {itemCatalog.map(it => (
                      <option key={it.id} value={it.id}>
                        {it.code || it.sku ? `[${it.code || it.sku}] ` : ''}{it.name} ({it.unit || 'unit'}) - AED {it.standardRate || it.costRate || 0}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-slate-600 mb-1">Item Description</label>
                <input
                  type="text"
                  value={newPrData.itemDesc}
                  onChange={(e) => setNewPrData({ ...newPrData, itemDesc: e.target.value })}
                  placeholder="e.g. M24 High Tensile Structural Bolts"
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-xs outline-none"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-600 mb-1">Quantity</label>
                  <input
                    type="number"
                    value={newPrData.itemQty}
                    onChange={(e) => setNewPrData({ ...newPrData, itemQty: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Unit</label>
                  <input
                    type="text"
                    value={newPrData.itemUnit}
                    onChange={(e) => setNewPrData({ ...newPrData, itemUnit: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Est. Unit Price (AED)</label>
                  <input
                    type="number"
                    value={newPrData.itemUnitPrice}
                    onChange={(e) => setNewPrData({ ...newPrData, itemUnitPrice: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-xs outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-600 mb-1">Total Estimated</label>
                <div className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded font-mono font-bold text-slate-900">
                  AED {(newPrData.itemQty * newPrData.itemUnitPrice).toLocaleString()}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button onClick={() => setIsNewPrModalOpen(false)} className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded cursor-pointer">Cancel</button>
              <button onClick={handleSubmitRequisition} className="px-3 py-1.5 text-xs bg-orange-500 hover:bg-orange-600 text-white rounded font-medium cursor-pointer">Submit with Budget Check</button>
            </div>
          </div>
        </div>
      )}

      {/* New PO Modal */}
      {isNewPoModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-bold text-sm text-slate-900">New Purchase Order (Commercial PO)</span>
              <button onClick={() => setIsNewPoModalOpen(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            <div className="space-y-2.5 text-xs">
              <div>
                <label className="block text-slate-600 mb-1 font-medium">Target Central Project</label>
                <select
                  value={newPoData.projectId}
                  onChange={(e) => {
                    const sel = projects.find(p => p.id === e.target.value);
                    setNewPoData({
                      ...newPoData,
                      projectId: e.target.value,
                      projectName: sel?.projectName || sel?.name || e.target.value
                    });
                  }}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-xs outline-none bg-white font-medium"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.id}: {p.projectName || p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">Supplier</label>
                <select
                  value={newPoData.supplierId}
                  onChange={(e) => setNewPoData({ ...newPoData, supplierId: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-xs outline-none bg-white"
                >
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.vendorCode})</option>
                  ))}
                </select>
              </div>

              {itemCatalog && itemCatalog.length > 0 && (
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Quick Pick from Master Item Catalog</label>
                  <select
                    onChange={(e) => {
                      const item = itemCatalog.find(it => it.id === e.target.value);
                      if (item) {
                        setNewPoData({
                          ...newPoData,
                          itemDesc: item.name || item.description || newPoData.itemDesc,
                          unit: item.unit || 'MT',
                          unitPrice: item.standardRate || item.costRate || newPoData.unitPrice,
                          category: (item.category as any) || newPoData.category
                        });
                      }
                    }}
                    defaultValue=""
                    className="w-full px-2.5 py-1.5 border border-slate-200 bg-orange-50/50 rounded text-xs outline-none text-slate-700"
                  >
                    <option value="" disabled>-- Select from Master Catalog (Auto-fill) --</option>
                    {itemCatalog.map(it => (
                      <option key={it.id} value={it.id}>
                        {it.code || it.sku ? `[${it.code || it.sku}] ` : ''}{it.name} ({it.unit || 'unit'}) - AED {it.standardRate || it.costRate || 0}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-slate-600 mb-1">Line Item Description</label>
                <input
                  type="text"
                  value={newPoData.itemDesc}
                  onChange={(e) => setNewPoData({ ...newPoData, itemDesc: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-xs outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 mb-1">Quantity</label>
                  <input
                    type="number"
                    value={newPoData.qty}
                    onChange={(e) => setNewPoData({ ...newPoData, qty: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Unit Rate (AED)</label>
                  <input
                    type="number"
                    value={newPoData.unitPrice}
                    onChange={(e) => setNewPoData({ ...newPoData, unitPrice: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-xs outline-none"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button onClick={() => setIsNewPoModalOpen(false)} className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded cursor-pointer">Cancel</button>
              <button onClick={handleCreatePo} className="px-3 py-1.5 text-xs bg-orange-500 hover:bg-orange-600 text-white rounded font-medium cursor-pointer">Create PO</button>
            </div>
          </div>
        </div>
      )}

      {/* Barcode Viewer Modal */}
      {selectedGrnBarcode && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-sm p-4 text-center space-y-3">
            <span className="font-bold text-sm text-slate-900 block">Warehouse Intake Barcode</span>
            <div className="py-2 flex justify-center">
              <BarcodeVisual value={selectedGrnBarcode.grnNumber} />
            </div>
            <div className="text-xs text-slate-600 space-y-0.5">
              <p>Supplier: <strong>{selectedGrnBarcode.supplierName}</strong></p>
              <p>Storage Bin: <strong>{selectedGrnBarcode.storageLocationBin}</strong></p>
            </div>
            <button
              onClick={() => setSelectedGrnBarcode(null)}
              className="w-full py-1.5 bg-slate-800 text-white rounded text-xs font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Reverse Auction Bid Modal */}
      {auctionBidModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-bold text-sm text-slate-900">Submit Competitive Decrement Bid</span>
              <button onClick={() => setAuctionBidModal(null)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            <div className="space-y-2 text-xs">
              <p className="text-slate-600">Current lowest bid: <strong className="text-emerald-700 font-mono">AED {auctionBidModal.currentLowestBid.toLocaleString()}</strong></p>
              <div>
                <label className="block text-slate-600 mb-1">Bidding Supplier</label>
                <select
                  value={selectedBidderSupplierId}
                  onChange={(e) => setSelectedBidderSupplierId(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-xs outline-none"
                >
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-600 mb-1">Your Decrement Bid (AED)</label>
                <input
                  type="number"
                  value={auctionBidAmount}
                  onChange={(e) => setAuctionBidAmount(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-xs outline-none font-mono"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button onClick={() => setAuctionBidModal(null)} className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded">Cancel</button>
              <button onClick={handlePlaceAuctionBid} className="px-3 py-1.5 text-xs bg-orange-500 hover:bg-orange-600 text-white rounded font-medium">Place Bid</button>
            </div>
          </div>
        </div>
      )}

      {/* Scrap Intercept Modal */}
      {interceptScrapModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-bold text-sm text-slate-900">Intercept & Reclaim for Project Reuse</span>
              <button onClick={() => setInterceptScrapModal(null)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            <div className="space-y-2 text-xs">
              <p className="text-slate-700 font-medium">Material: {interceptScrapModal.materialCategory} ({interceptScrapModal.weightKg} kg)</p>
              <div>
                <label className="block text-slate-600 mb-1 font-medium">Target Project to Receive Materials</label>
                <select
                  value={targetReclaimProjectId}
                  onChange={(e) => setTargetReclaimProjectId(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-xs outline-none bg-white"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.id}: {p.projectName || p.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button onClick={() => setInterceptScrapModal(null)} className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded">Cancel</button>
              <button onClick={handleInterceptScrap} className="px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium">Confirm Reclaim</button>
            </div>
          </div>
        </div>
      )}

      {/* Emergency Modal */}
      {isNewEmergencyModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-bold text-sm text-rose-700">Declare Site Emergency Sourcing</span>
              <button onClick={() => setIsNewEmergencyModalOpen(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            <div className="space-y-2 text-xs">
              <div>
                <label className="block text-slate-600 mb-1 font-medium">Target Central Project</label>
                <select
                  value={newEmergencyData.projectId}
                  onChange={(e) => {
                    const sel = projects.find(p => p.id === e.target.value);
                    setNewEmergencyData({
                      ...newEmergencyData,
                      projectId: e.target.value,
                      projectName: sel?.projectName || sel?.name || e.target.value
                    });
                  }}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-xs outline-none bg-white"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.id}: {p.projectName || p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-600 mb-1">Emergency Incident Type</label>
                <input
                  type="text"
                  value={newEmergencyData.incidentType}
                  onChange={(e) => setNewEmergencyData({ ...newEmergencyData, incidentType: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-xs outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-1">Estimated Cost (AED)</label>
                <input
                  type="number"
                  value={newEmergencyData.estimatedCost}
                  onChange={(e) => setNewEmergencyData({ ...newEmergencyData, estimatedCost: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-xs outline-none font-mono"
                />
              </div>
              <div className="p-2 bg-rose-50 border border-rose-200 rounded text-rose-800 text-[11px]">
                Safety Override: Standard multi-quote RFQ stages are bypassed. An express PO is issued immediately. Mandatory retroactive audit report required.
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button onClick={() => setIsNewEmergencyModalOpen(false)} className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded">Cancel</button>
              <button onClick={handleCreateEmergency} className="px-3 py-1.5 text-xs bg-rose-600 hover:bg-rose-700 text-white rounded font-medium">Authorize Express PO</button>
            </div>
          </div>
        </div>
      )}

      {/* Log NCR Modal */}
      {isNewNcrModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-bold text-sm text-slate-900">Log Non-Conformance Report (NCR)</span>
              <button onClick={() => setIsNewNcrModalOpen(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            <div className="space-y-2 text-xs">
              <div>
                <label className="block text-slate-600 mb-1 font-medium">Target Central Project</label>
                <select
                  value={newNcrData.projectId}
                  onChange={(e) => {
                    const sel = projects.find(p => p.id === e.target.value);
                    setNewNcrData({
                      ...newNcrData,
                      projectId: e.target.value,
                      projectName: sel?.projectName || sel?.name || e.target.value
                    });
                  }}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-xs outline-none bg-white"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.id}: {p.projectName || p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-600 mb-1">Supplier</label>
                <select
                  value={newNcrData.supplierId}
                  onChange={(e) => setNewNcrData({ ...newNcrData, supplierId: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-xs outline-none"
                >
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-600 mb-1">Severity</label>
                <select
                  value={newNcrData.severity}
                  onChange={(e) => setNewNcrData({ ...newNcrData, severity: e.target.value as any })}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-xs outline-none"
                >
                  <option value="Minor">Minor (Notice)</option>
                  <option value="Major">Major (Freezes Invoices)</option>
                  <option value="Critical">Critical (Immediate Line Stop & Payment Lock)</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-600 mb-1">Issue Title</label>
                <input
                  type="text"
                  value={newNcrData.title}
                  onChange={(e) => setNewNcrData({ ...newNcrData, title: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-xs outline-none"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button onClick={() => setIsNewNcrModalOpen(false)} className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded">Cancel</button>
              <button onClick={handleIssueNcr} className="px-3 py-1.5 text-xs bg-amber-600 hover:bg-amber-700 text-white rounded font-medium">Log NCR</button>
            </div>
          </div>
        </div>
      )}

      {/* Declare Scrap Modal */}
      {isNewScrapModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-bold text-sm text-slate-900">Declare Scrap / Excess Material Lot</span>
              <button onClick={() => setIsNewScrapModalOpen(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            <div className="space-y-2 text-xs">
              <div>
                <label className="block text-slate-600 mb-1 font-medium">Origin Central Project</label>
                <select
                  value={newScrapData.projectId}
                  onChange={(e) => {
                    const sel = projects.find(p => p.id === e.target.value);
                    setNewScrapData({
                      ...newScrapData,
                      projectId: e.target.value,
                      projectName: sel?.projectName || sel?.name || e.target.value
                    });
                  }}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-xs outline-none bg-white"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.id}: {p.projectName || p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-600 mb-1">Material Category</label>
                <input
                  type="text"
                  value={newScrapData.materialCategory}
                  onChange={(e) => setNewScrapData({ ...newScrapData, materialCategory: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-xs outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    value={newScrapData.weightKg}
                    onChange={(e) => setNewScrapData({ ...newScrapData, weightKg: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-xs outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Estimated Value (AED)</label>
                  <input
                    type="number"
                    value={newScrapData.estimatedValue}
                    onChange={(e) => setNewScrapData({ ...newScrapData, estimatedValue: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-xs outline-none font-mono"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button onClick={() => setIsNewScrapModalOpen(false)} className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded">Cancel</button>
              <button onClick={handleDeclareScrap} className="px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium">Declare Lot</button>
            </div>
          </div>
        </div>
      )}

      {/* PO Details Modal */}
      {selectedPoDetails && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-bold text-sm text-slate-900">Purchase Order: {selectedPoDetails.poNumber}</span>
              <button onClick={() => setSelectedPoDetails(null)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2 rounded">
                <p>Supplier: <strong>{selectedPoDetails.supplierName}</strong></p>
                <p>Project: <strong>{selectedPoDetails.projectName}</strong></p>
                <p>Order Date: <span className="font-mono">{selectedPoDetails.orderDate}</span></p>
                <p>Delivery: <span className="font-mono">{selectedPoDetails.expectedDeliveryDate}</span></p>
              </div>
              <div className="border border-slate-200 rounded overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 text-[11px]">
                    <tr>
                      <th className="p-2">Item</th>
                      <th className="p-2 text-right">Qty</th>
                      <th className="p-2 text-right">Rate</th>
                      <th className="p-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedPoDetails.items.map(it => (
                      <tr key={it.id}>
                        <td className="p-2 text-slate-700">{it.description}</td>
                        <td className="p-2 text-right font-mono">{it.quantity} {it.unit}</td>
                        <td className="p-2 text-right font-mono">{it.unitPrice.toLocaleString()}</td>
                        <td className="p-2 text-right font-mono font-bold">{it.totalAmount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="text-right font-mono text-xs">
                <span>Subtotal: AED {selectedPoDetails.subtotal.toLocaleString()} · VAT (5%): AED {selectedPoDetails.vatAmount.toLocaleString()} · </span>
                <strong className="text-sm">Total: AED {selectedPoDetails.totalAmount.toLocaleString()}</strong>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button onClick={() => setSelectedPoDetails(null)} className="px-3 py-1.5 text-xs bg-slate-800 text-white rounded font-medium">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Contextual Document Modal for Rows and Packages */}
      <ContextualDocumentModal
        isOpen={contextModalConfig.isOpen}
        onClose={() => setContextModalConfig(prev => ({ ...prev, isOpen: false }))}
        title={contextModalConfig.title}
        subtitle={contextModalConfig.subtitle}
        relevantDocNumbers={contextModalConfig.relevantDocNumbers}
        context={contextModalConfig.context}
      />

    </div>
  );
};
