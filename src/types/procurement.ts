export type SupplierCategory = 
  | 'Structural Steel & Alloys'
  | 'Aluminium Extrusions & Panels'
  | 'Hardware & Fasteners'
  | 'Industrial Coatings & Paints'
  | 'Architectural Glass'
  | 'Welding & Fabrication Consumables'
  | 'Tools & Plant Machinery';

export type SupplierStatus = 'Active' | 'Preferred' | 'Pending Qualification' | 'Suspended' | 'Blacklisted';

export type PaymentTerms = 
  | 'Net 30 Days'
  | 'Net 45 Days'
  | 'Net 60 Days'
  | 'Net 90 Days'
  | 'Immediate / Advance'
  | '50% Advance, 50% on Delivery'
  | 'Letter of Credit (LC)';

export interface Supplier {
  id: string;
  vendorCode: string;
  name: string;
  category: SupplierCategory;
  contactPerson: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  taxRegistrationNumber: string; // TRN / VAT ID
  tradeLicenseNumber: string;
  rating: number; // 1 to 5 stars
  status: SupplierStatus;
  paymentTerms: PaymentTerms;
  creditLimit: number;
  currency: string;
  onTimeDeliveryRate: number; // e.g. 96.5%
  qualityAcceptanceRate: number; // e.g. 98.2%
  totalOrdersValue: number;
  approvedMaterials: string[];
  bankDetails: {
    bankName: string;
    iban: string;
    swiftCode: string;
  };
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type RfqStatus = 'Draft' | 'Sent to Suppliers' | 'Bids Received' | 'Evaluated' | 'Awarded' | 'Closed';

export interface RfqItem {
  id: string;
  itemDescription: string;
  materialGrade: string;
  dimensionSpec?: string;
  quantity: number;
  unit: string; // 'kg', 'MT', 'pcs', 'm²', 'm', 'sets'
  estimatedTargetPrice: number;
}

export interface SupplierBid {
  supplierId: string;
  supplierName: string;
  bidReference: string;
  submissionDate: string;
  unitPrices: Record<string, number>; // item.id -> unit price
  totalBidAmount: number;
  leadTimeWeeks: number;
  paymentTermsOffered: string;
  technicalCompliance: boolean;
  bidStatus: 'Under Evaluation' | 'Selected' | 'Declined';
  notes?: string;
}

export interface RequestForQuotation {
  id: string;
  rfqNumber: string;
  title: string;
  projectId?: string;
  projectName?: string;
  items: RfqItem[];
  invitedSupplierIds: string[];
  bids: SupplierBid[];
  awardedSupplierId?: string;
  awardedAmount?: number;
  awardJustification?: string;
  status: RfqStatus;
  requiredDeliveryDate: string;
  createdBy: string;
  createdAt: string;
  closedAt?: string;
}

export type POStatus = 
  | 'Draft'
  | 'Pending Approval'
  | 'Approved'
  | 'Issued'
  | 'Partially Received'
  | 'Completed'
  | 'Cancelled';

export type MatchingStatus = '2-Way Matched' | '3-Way Matched' | 'Variance Flagged' | 'Unmatched';

export interface POLineItem {
  id: string;
  description: string;
  specifications?: string;
  quantity: number;
  receivedQuantity: number;
  unit: string;
  unitPrice: number;
  totalAmount: number;
  category: SupplierCategory;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  rfqId?: string;
  supplierId: string;
  supplierName: string;
  projectId?: string;
  projectName?: string;
  receivingBranch: 'Main Store' | 'Dubai Fabrication Yard' | 'Abu Dhabi Site Hub';
  orderDate: string;
  expectedDeliveryDate: string;
  items: POLineItem[];
  subtotal: number;
  vatRatePercent: number;
  vatAmount: number;
  totalAmount: number;
  currency: string;
  paymentTerms: PaymentTerms;
  specialInstructions?: string;
  status: POStatus;
  matchingStatus: MatchingStatus;
  createdBy: string;
  approvedBy?: string;
  approvedAt?: string;
  issuedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type GrnInspectionStatus = 'QC Passed' | 'QC Conditional Pass' | 'QC Rejected' | 'Awaiting Inspection';

export interface GRNLineItem {
  poItemId: string;
  description: string;
  orderedQuantity: number;
  deliveredQuantity: number;
  acceptedQuantity: number;
  rejectedQuantity: number;
  unit: string;
  unitPrice: number;
  totalDeliveredValue: number;
  rejectionReason?: string;
}

export interface GoodsReceiptNote {
  id: string;
  grnNumber: string;
  poId: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  deliveryNoteNumber: string;
  supplierInvoiceNumber?: string;
  receivedDate: string;
  receivingBranch: 'Main Store' | 'Dubai Fabrication Yard' | 'Abu Dhabi Site Hub';
  storageLocationBin: string; // e.g. "Rack-C4", "Yard-B3"
  items: GRNLineItem[];
  totalDeliveredValue: number;
  inspectionStatus: GrnInspectionStatus;
  qcInspectorName?: string;
  qcInspectionDate?: string;
  qcRemarks?: string;
  storekeeperName: string;
  heatNumberOrMillCert?: string;
  createdAt: string;
}

// ==========================================
// PROCUREFLOW (NEXUS OS) ENTERPRISE EXTENSIONS
// ==========================================

export type RequisitionPriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type RequisitionStatus = 'Draft' | 'Submitted' | 'Budget Approved' | 'Budget Blocked' | 'Converted to RFQ' | 'Converted to PO' | 'Rejected';

export interface RequisitionItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  estimatedUnitPrice: number;
  totalEstimatedPrice: number;
  category: SupplierCategory;
  requiredDate: string;
}

export interface PurchaseRequisition {
  id: string;
  requisitionNumber: string;
  projectId: string;
  projectName: string;
  department: string;
  requestedBy: string;
  priority: RequisitionPriority;
  requiredByDate: string;
  status: RequisitionStatus;
  items: RequisitionItem[];
  totalEstimatedCost: number;
  justification: string;
  budgetCategoryCode: string;
  budgetAllocatedAmount: number;
  budgetCommittedAmount: number;
  budgetExceeded: boolean;
  convertedPoId?: string;
  convertedRfqId?: string;
  createdAt: string;
}

export interface ReverseAuctionBid {
  id: string;
  supplierId: string;
  supplierName: string;
  bidAmount: number;
  timestamp: string;
  isWinning: boolean;
}

export interface ReverseAuction {
  id: string;
  auctionNumber: string;
  rfqId: string;
  title: string;
  startingPrice: number;
  currentLowestBid: number;
  currentWinningSupplierId?: string;
  currentWinningSupplierName?: string;
  minDecrement: number;
  status: 'Active' | 'Closed' | 'Cancelled';
  startTime: string;
  endTime: string;
  autoExtensionSeconds: number;
  bids: ReverseAuctionBid[];
  awardedPoId?: string;
}

export interface ContractRateCard {
  id: string;
  itemDescription: string;
  unit: string;
  contractedRate: number;
  marketBenchmarkRate?: number;
  validFrom: string;
  validUntil: string;
}

export interface ContractAgreement {
  id: string;
  contractNumber: string;
  title: string;
  type: 'Framework' | 'Project' | 'Service SLA';
  supplierId: string;
  supplierName: string;
  projectId?: string;
  projectName?: string;
  startDate: string;
  endDate: string;
  totalValue: number;
  remainingValue: number;
  status: 'Active' | 'Under Review' | 'Expired' | 'Terminated';
  rateCards: ContractRateCard[];
  slaDetails: {
    responseTimeHours: number;
    penaltyPerDay: number;
    otifTargetPercent: number;
  };
  renewalDate: string;
  variationsCount: number;
  createdAt: string;
}

export interface SCNDeliverable {
  id: string;
  description: string;
  agreedWeight: number; // e.g. 25%
  percentageCompleted: number; // e.g. 100%
  certifiedAmount: number;
  status: 'Completed' | 'In Progress' | 'Disputed';
}

export interface ServiceCompletionNote {
  id: string;
  scnNumber: string;
  poId: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  projectId: string;
  projectName: string;
  serviceType: string;
  periodFrom: string;
  periodTo: string;
  recordedBy: string;
  status: 'Draft' | 'Pending Signatures' | 'Certified' | 'Rejected';
  completionPercentage: number;
  totalValue: number;
  certifiedAmount: number;
  deliverables: SCNDeliverable[];
  supervisorSignature?: string;
  siteManagerSignature?: string;
  qaSignature?: string;
  remarks?: string;
  createdAt: string;
}

export interface SupplierInvoice {
  id: string;
  invoiceNumber: string;
  canonicalNumber: string;
  supplierId: string;
  supplierName: string;
  poId: string;
  poNumber: string;
  grnId?: string;
  grnNumber?: string;
  scnId?: string;
  scnNumber?: string;
  projectId?: string;
  projectName?: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  status: 'Pending' | 'Under Review' | '3-Way Matched' | 'Disputed' | 'Approved' | 'Paid';
  matchScore: number; // 0 - 100
  paymentVerificationCode?: string; // HMAC-SHA256 Token
  discrepancies: string[];
  fraudRiskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  fraudScore: number;
  holdPayment: boolean;
  holdReason?: string;
  approvedBy?: string;
  approvedAt?: string;
  paidAt?: string;
  createdAt: string;
}

export interface ProcurementNCR {
  id: string;
  ncrNumber: string;
  sourceType: 'GRN' | 'SCN' | 'Site Delivery';
  sourceRef: string;
  supplierId: string;
  supplierName: string;
  projectId: string;
  projectName: string;
  severity: 'Minor' | 'Major' | 'Critical';
  title: string;
  description: string;
  rootCause?: string;
  status: 'Open' | 'Investigating' | 'CAPA Pending' | 'Resolved' | 'Closed';
  holdPaymentApplied: boolean;
  capaPlan?: string;
  reportedBy: string;
  reportedDate: string;
  resolvedDate?: string;
}

export interface InventoryStockItem {
  id: string;
  code: string;
  sku?: string;
  name: string;
  category: SupplierCategory;
  warehouse: 'Main Store' | 'Dubai Fabrication Yard' | 'Abu Dhabi Site Hub';
  currentQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  reorderLevel: number;
  unit: string;
  standardCost: number;
  binLocation: string;
  lastUpdated: string;
}

export interface StockMovement {
  id: string;
  timestamp: string;
  itemCode: string;
  itemName: string;
  type: 'Inbound GRN' | 'Outbound Issuance' | 'Scrap Recovery' | 'Transfer' | 'Adjustment';
  quantity: number;
  unit: string;
  fromLocation: string;
  toLocation: string;
  referenceId: string;
  performedBy: string;
}

export interface ScrapRecord {
  id: string;
  code: string;
  projectId: string;
  projectName: string;
  materialCategory: string;
  description: string;
  weightKg: number;
  estimatedValue: number;
  status: 'Intercept Window' | 'Intercepted for Project' | 'Active Auction' | 'Sold / Liquidated' | 'Recycled';
  declarationDate: string;
  interceptExpiryDate: string; // 7-day window
  reclaimedByProjectId?: string;
  reclaimedByProjectName?: string;
  winningBidAmount?: number;
  buyerName?: string;
  gatePassNumber?: string;
}

export interface EmergencyRequest {
  id: string;
  requestNumber: string;
  projectId: string;
  projectName: string;
  incidentType: string;
  urgencyLevel: 'Critical' | 'High';
  description: string;
  estimatedCost: number;
  status: 'Pending' | 'Express PO Issued' | 'Audit Complete' | 'Rejected';
  safetyOverride: boolean;
  expressPoId?: string;
  expressPoNumber?: string;
  retroactiveAuditComplete: boolean;
  auditNotes?: string;
  requestedBy: string;
  createdAt: string;
}

export interface SupplierComplianceDoc {
  id: string;
  supplierId: string;
  documentType: 'Certificate of Insurance (COI)' | 'Trade License' | 'Tax Clearance / TRN' | 'ISO 9001 Certificate';
  documentNumber: string;
  issuer: string;
  issueDate: string;
  expiryDate: string;
  status: 'Valid' | 'Expiring Soon' | 'Expired';
  verifiedBy?: string;
}

export interface SupplierTicket {
  id: string;
  ticketNumber: string;
  supplierId: string;
  supplierName: string;
  type: 'Invoice Payment' | 'PO Inquiry' | 'Delivery Discrepancy' | 'Quality NCR' | 'General';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  subject: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  lastMessage: string;
  createdAt: string;
  updatedAt: string;
}

export interface PettyCashTransaction {
  id: string;
  voucherNumber: string;
  type: 'Disburse' | 'Replenish';
  amount: number;
  recipient: string;
  category: string;
  projectId: string;
  projectName: string;
  timestamp: string;
  receiptRef: string;
}

export interface SupplierEvaluation {
  id: string;
  supplierId: string;
  supplierName: string;
  period: string; // e.g. "Q3 2026"
  qualityScore: number; // 0 - 100
  deliverySpeedScore: number; // 0 - 100
  priceCompetitivenessScore: number; // 0 - 100
  communicationScore: number; // 0 - 100
  compositeScore: number; // weighted average
  grade: 'A+ (Preferred)' | 'A (Approved)' | 'B (Acceptable)' | 'C (Conditional)' | 'D (Probation)';
  evaluatorName: string;
  evaluationDate: string;
  strengths: string[];
  areasOfImprovement: string[];
  recommendation: 'Renew Full Scope' | 'Increase Allocation' | 'Restrict Scope' | 'Issue Improvement Notice';
}

export interface ProcurementAnalytics {
  totalSpendYTD: number;
  committedSpendPending: number;
  activePosCount: number;
  pendingApprovalPosCount: number;
  openRfqsCount: number;
  averageLeadTimeDays: number;
  costSavingsRealizedYTD: number;
  spendByCategory: { category: string; amount: number; percentage: number }[];
  supplierSpendShare: { supplierName: string; amount: number; percentage: number }[];
}

export type ProcurementCostCategory = 
  | 'Materials'
  | 'Services'
  | 'Outside Services'
  | 'Subcontractor Services'
  | 'Equipment & Plant'
  | 'Logistics & Contracts'
  | 'Other';

export type ProcurementCostClassification = 
  | 'RAW_MATERIAL' 
  | 'OUTSIDE_SERVICE' 
  | 'SUBCONTRACTOR_LABOUR' 
  | 'EQUIPMENT_PLANT' 
  | 'LOGISTICS_CONTRACT';

export interface CostItemDependencyLink {
  id: string;
  targetType: 'PRODUCT_VARIANT' | 'ITEM_TEMPLATE';
  targetId: string;
  targetCode: string;
  targetName: string;
  categoryName?: string;
  bomRole: 'PROFILE' | 'GLASS' | 'HARDWARE' | 'GASKET' | 'SEALANT' | 'LABOUR' | 'OVERHEAD';
  usageFormula?: string; // e.g. "3.8 kg / m²" or "1.5 hrs / unit"
  unitConsumption: number;
  currentVariantSellingPrice?: number;
  currentVariantCost?: number;
  costContribution?: number; // unitConsumption * baseRate
  costImpactPercent?: number; // percentage of variant BOM cost
  lastSyncedAt?: string;
}

export interface CostCategoryDefinition {
  id: string;
  name: string;
  code: string;
  classification: ProcurementCostClassification;
  description: string;
  icon?: string;
  subCategories: string[];
}

export interface SupplierPriceRange {
  id?: string;
  minQty: number;
  maxQty?: number; // undefined means "and above"
  unitPrice: number;
  leadTimeDays?: number;
  notes?: string;
}

export interface ItemSupplierRate {
  id: string;
  supplierId: string;
  supplierName: string;
  vendorCode: string;
  currency: string;
  baseRate: number;
  minimumOrderQty: number;
  leadTimeDays: number;
  priceRanges: SupplierPriceRange[];
  rating: number;
  isPreferred: boolean;
  effectiveDate: string;
  validUntil?: string;
  taxRatePercent?: number;
  notes?: string;
}

export interface ProcurementItemVariant {
  id: string; // Primary Key (Unique)
  parentCostItemId?: string; // Foreign Key to parent Cost Item ID
  parentItemCode?: string; // Foreign Key Item Code for display
  variantCode: string;
  name: string;
  sku: string;
  imageUrl?: string;
  attributes: Record<string, string>;
  unit: string;
  standardCost: number;
  supplierRates: ItemSupplierRate[];
}

export interface ProcurementCostItem {
  id: string; // Primary Key
  itemCode: string; // Primary Key Code (Unique)
  imageUrl?: string;
  name: string;
  category: ProcurementCostCategory | string;
  subCategory?: string;
  classification?: ProcurementCostClassification;
  description: string;
  primaryUnit: string;
  projectId?: string;
  projectCode?: string;
  projectName?: string;
  linkedQuoteId?: string;
  linkedQuoteNo?: string;
  boqItemId?: string;
  boqItemCode?: string;
  linkedPoId?: string;
  linkedPoNumber?: string;
  benchmarkCost: number;
  currency: string;
  status: 'Active' | 'Under Review' | 'Discontinued';
  variants: ProcurementItemVariant[];
  supplierRates: ItemSupplierRate[];
  specificationRef?: string;
  hsnSacCode?: string;
  qualityStandard?: string;
  inspectionLevel?: string;
  storageCondition?: string;
  barcode?: string;
  linkedDependencies?: CostItemDependencyLink[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CostItemRateHistory {
  id: string;
  costItemId: string;
  itemCode: string;
  itemName: string;
  supplierId: string;
  supplierName: string;
  previousRate: number;
  newRate: number;
  currency: string;
  effectiveDate: string;
  reason: string;
  changedBy: string;
  notes?: string;
}
