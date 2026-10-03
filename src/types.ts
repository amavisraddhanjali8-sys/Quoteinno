/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum QuoteStatus {
  DRAFT = 'Draft',
  SITE_VISIT = 'Site Visit',
  INTERNAL_REVIEW = 'Internal Review',
  SENT = 'Sent',
  REVISION = 'Revision',
  WON = 'Won',
  LOST = 'Lost',
  PROJECT = 'Project'
}

export interface Project {
  id: string;
  projectCode?: string;
  quoteId: string;
  allQuoteIds?: string[];
  projectName: string;
  client: Client;
  startDate: string;
  endDate?: string;
  siteAddress?: string;
  category?: 'Aluminium' | 'Glass' | 'Façade' | 'Civil' | 'Design' | 'Installation' | 'Steel' | string;
  status: 'New Request' | 'In Progress' | 'Completed' | 'On Hold' | 'Cancelled' | string;
  totalValue: number;
  originalSum?: number;
  originalDiscountPercent?: number;
  originalTaxPercent?: number;
  originalAdditionalCharges?: AdditionalCharge[];
  items: BOQItem[];
  terms?: Term[];
  timeline?: Timeline;
  originalQuoteNo?: string;
  auditLogs?: AuditLog[];
  paymentTiers?: PaymentTier[];
  discountPercent?: number;
  taxPercent?: number;
  isTaxInclusive?: boolean;
  additionalCharges?: AdditionalCharge[];
  currency?: string;
  notes?: string;
  documentSettings?: {
    fontSize: number;
    accentColor: string;
    showLogo: boolean;
    showBankDetails: boolean;
    showTimeline: boolean;
    showPaymentTiers: boolean;
    layoutType: PdfLayout;
  };
  grandTotal?: number;
  retentionPercent?: number;
  reports?: ProjectReport[];
  tags?: string[];
  classification?: string;
}

export interface ProjectReport {
  id: string;
  title: string;
  createdAt: string;
  type: string;
  data: any;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  user: string;
  type: 'Variation' | 'Status' | 'Timeline' | 'General' | 'System' | 'Accounting';
  projectName?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
  priority: 'high' | 'medium' | 'low';
  category: 'Risk' | 'Variation' | 'BOQ' | 'Rate' | 'Follow-up' | 'Status' | 'System' | 'Smart' | 'General' | 'Accounting';
  isRead: boolean;
  isPinned?: boolean;
  targetUserId?: string;
  targetRoleIds?: string[];
  action?: {
    label: string;
    view: string;
    data?: any;
  };
  link?: string;
}

export interface PaymentTier {
  id: string;
  phase: string;
  percentage: number;
  amount: number;
  status: 'Pending' | 'Paid';
  dueDate?: string;
  invoiceNo?: string;
}

export enum CustomerCategory {
  INDIVIDUAL = 'Individual',
  COMPANY = 'Company'
}

export interface ContactPerson {
  id: string;
  name: string;
  jobTitle: string;
  phone: string;
  mobile: string;
  email: string;
  isPrimary: boolean;
  canApproveQuotes: boolean;
  canReceiveInvoices: boolean;
  preferredContact: 'Phone' | 'Email' | 'WhatsApp';
  notes?: string; // Hidden from customer
}

export interface Address {
  id: string;
  label: 'Billing' | 'Shipping' | 'Site' | 'Registered Office' | 'Branch';
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  landmark?: string;
  contactPerson?: string;
  contactPhone?: string;
}

export interface Client {
  id: string;
  category: CustomerCategory;
  name: string; // Full Name or Legal Company Name
  company?: string;
  cvcCode?: string;
  tradeName?: string;
  registrationNo?: string; // National ID or Company Reg No
  taxNo?: string; // VAT or TIN
  phone: string;
  address: string; // Default display address
  email?: string;
  website?: string;
  industry?: string;
  status: 'Active' | 'Inactive' | 'On Hold' | 'Blacklisted' | string;
  creditLimit: number;
  paymentTerms: string;
  currency: string;
  language: string;
  sinceDate: string;
  accountManager?: string;
  salesAgent?: string;
  hasSpecialPricing: boolean;
  
  // Specific Portal Data
  contactPersons: ContactPerson[];
  addresses: Address[];
  
  // Internal Classification (Hidden from customer)
  source: 'Direct' | 'Contractor' | 'Sales Agent Referral' | 'Online' | 'Walk-in' | 'Tender';
  tier: 'Tier 1' | 'Tier 2' | 'Tier 3';
  linkedFinalClient?: string;
  linkedContractors?: string[];
  salesAgentCode?: string;
  salesAgentCommRate?: number;
  contractorCommRate?: number;
  commBasis?: 'Gross Profit' | 'Total Revenue';
  isCommHidden: boolean;
  debtorAccountNo?: string;
  isTaxExempt: boolean;
  contractRef?: string;
  contractExpiry?: string;
  internalNotes?: string;
  avatar?: string;
  tags?: string[];
  classification?: string;
}

export type ShapeType = 'Rectangle' | 'Triangle' | 'Circle' | 'Trapezoid' | 'Ellipse' | 'Sector' | 'Solid';

export interface MeasurementRow {
  id: string;
  description: string;
  shape: ShapeType;
  count: number;
  length: number;
  width: number;
  height: number;
  radius?: number;
  base?: number;
  sideA?: number;
  sideB?: number;
  isDeduction: boolean;
  total: number;
}

export type CalculationMethod = 'Area' | 'Volume' | 'Linear' | 'Perimeter' | 'Surface' | 'Weight' | 'Unit';
export type MeasurementUnit = 'm' | 'ft' | 'in' | 'mm' | 'm2' | 'm²' | 'sqft' | 'm3' | 'm³' | 'kg' | 'Tons' | 'Nos' | 'Set' | 'Note' | 'None' | 'Visit' | 'Hour' | 'Day' | 'Lot' | (string & {});

export interface MeasurementSheet {
  id: string;
  itemId: string;
  method: CalculationMethod;
  unit: MeasurementUnit;
  rows: MeasurementRow[];
  totalQuantity: number;
}

export interface CustomMaterial {
  id: string;
  name: string;
  specification: string;
  quantity?: string;
}

export interface AluminiumSpec {
  id: string;
  thickness: string;
  series: string;
  finish: 'Natural' | 'Powder Coated' | 'Bronzed' | 'Wood Finished' | string;
  profile?: string;
  code?: string;
  brand?: string;
  name?: string;
}

export interface GlassSpec {
  id: string;
  type: string;
  thickness: string;
  standards: string;
  tint?: string;
  tempered?: boolean;
  laminated?: boolean;
  doubleGlazed?: boolean;
}

export interface AccessorySpec {
  id: string;
  name: string;
  brand?: string;
  code?: string;
  quantity?: string;
}

export interface TechnicalSpecification {
  aluminiumGrade?: string;
  profileSystem?: string;
  profileDimensions?: string;
  thermalBreak?: 'Yes' | 'No';
  surfaceFinish?: string;
  finishColor?: string;
  glazingType?: string;
  glassThickness?: string;
  glassTint?: string;
  hardwareSet?: string;
  gasketType?: string;
  fabricationStandard?: string;
  windLoadRating?: string;
  waterPenetration?: string;
  acousticRating?: string;
  thermalUValue?: string;
  fireRating?: string;
  securityRating?: string;
  customDimensions?: 'Yes' | 'No';
  standardSizes?: string[];
  weightPerUnit?: string;
  warrantyProduct?: string;
  warrantyFinish?: string;
  warrantyGlass?: string;
  countryOrigin?: string;
  countryManufacture?: string;
  core?: {
    systemType: string;
    location: string;
    reference: string;
  };
  dimensions?: {
    width: string;
    height: string;
    panels: string;
    opening: string;
  };
  materials?: {
    aluminium?: AluminiumSpec[];
    steel?: {
      type: string;
      section: string;
      thickness: string;
      treatment: string;
    };
    glass?: GlassSpec[];
    accessories: AccessorySpec[];
  };
  customMaterials?: CustomMaterial[];
  functional?: string;
  fabrication?: string;
  finishing?: string;
  installation?: string;
  exclusions?: string;
  siteConditions?: string;
  quality?: string;
  testing?: string;
  warranty?: string;
  delivery?: string;
  notes?: string;
}

export interface ServiceSpecification {
  scope?: string;
  deliverables?: string[];
  inclusions?: string[];
  exclusions?: string[];
  assumptions?: string[];
  typicalDuration?: string;
  qualifications?: string[];
  equipmentRequired?: string[];
  mobilizationReq?: string;
  safetyReq?: string;
  sitePrerequisites?: string;
}

export interface SpecificationLibraryItem {
  id: string;
  code?: string;
  title: string;
  type: 'Technical' | 'Material' | 'Finish' | 'Installation' | 'General';
  version?: string;
  spec: ItemSpecification;
  generatedDescription?: string;
}

export interface CalculationLibrarySheet {
  id: string;
  code?: string;
  title: string;
  method: CalculationMethod;
  unit: MeasurementUnit;
  rows: MeasurementRow[];
  totalQuantity?: number;
  description?: string;
}

export interface ItemSpecification {
  core: {
    systemType: string;
    location: string;
    reference: string;
  };
  dimensions: {
    width: string;
    height: string;
    panels: string;
    opening: string;
  };
  materials: {
    aluminium?: AluminiumSpec[];
    steel?: {
      type: string;
      section: string;
      thickness: string;
      treatment: string;
    };
    glass?: GlassSpec[];
    accessories: AccessorySpec[];
  };
  customMaterials?: CustomMaterial[];
  functional: string;
  fabrication: string;
  finishing: string;
  installation: string;
  exclusions: string;
  siteConditions: string;
  quality: string;
  testing: string;
  warranty: string;
  delivery: string;
  notes: string;
}

export interface ItemCharge {
  id: string;
  name: string;
  amount: number;
  isInclusive: boolean;
}

export type VariationStatus = 'Original' | 'Additional' | 'Omitted';

export interface BOQItem {
  id: string;
  no: string;
  hasCustomNo?: boolean;
  pvcCode?: string;
  productCode?: string;
  name: string;
  description: string;
  itemType: 'Title' | 'Main' | 'Sub';
  category: string;
  unit: MeasurementUnit;
  qty: number;
  rate: number;
  discountPercent: number;
  amount: number;
  calculations?: string;
  measurements?: MeasurementSheet;
  specification?: ItemSpecification;
  specifications?: SpecificationLibraryItem[];
  calculationSheets?: CalculationLibrarySheet[];
  itemCharges?: ItemCharge[];
  variationStatus?: VariationStatus;
  templateId?: string;
  productType?: ProductType;
  status?: ItemStatus;
  variantId?: string;
  variantCode?: string;
  barcode?: string;
  variantBarcode?: string;
  variantAttributes?: Record<string, string | number>;
  rateVersionId?: string;
  baseRateAtTimeOfQuote?: number;
  costAtTimeOfQuote?: number;
  marginAtTimeOfQuote?: number;
  variantSnapshot?: QuotationPriceSnapshot;
  adjustmentType?: 'None' | 'Manual Override' | 'Discount' | 'Premium';
  adjustmentAmount?: number;
  adjustmentReason?: string;
}

export interface Term {
  id: string;
  no: string;
  title: string;
  content: string;
  isActive: boolean;
}

export interface AdditionalCharge {
  id: string;
  name: string;
  amount: number;
}

export type ProductType = 'Product' | 'Service';
export type ItemStatus = 'Active' | 'Inactive' | 'Discontinued' | 'Under Review';
export type RateBasis = 'Fixed Price' | 'Rate per Unit' | 'Rate per Range' | 'Tiered Pricing';

export interface FeatureOption {
  id: string;
  name: string;
  codeSuffix: string;
  technicalSpecs?: Partial<TechnicalSpecification>;
}

export interface FeatureGroup {
  id: string;
  name: string;
  options: FeatureOption[];
}

export interface ItemCategory {
  id: string;
  name: string;
  code?: string;
  parentId?: string | null;
  description?: string;
  color: string;
  tags: string[];
  icon?: string;
  displayTile?: boolean;
  type?: ProductType;
  itemCount?: number;
  order?: number;
  level?: number;
}

export interface ProductFamily {
  id: string;
  familyCode: string;
  familyName: string;
  category: string;
  categoryId?: string;
  description: string;
  unit: MeasurementUnit;
  imageUrl?: string;
  status: 'Active' | 'Inactive' | 'Discontinued';
  featureGroups: FeatureGroup[];
  color?: string;
  tags?: string[];
  displayTile?: boolean;
}

export interface RateVersion {
  id: string;
  variantId: string;
  amount: number;
  effectiveDate: string;
  endDate?: string;
  basis: RateBasis;
  currency: string;
  reason: string;
  createdBy: string;
  status: 'Draft' | 'Active' | 'Superseded' | 'Archived';
}

export type VariantStatus = 
  | 'DRAFT' 
  | 'TECHNICAL_REVIEW' 
  | 'COST_REVIEW' 
  | 'ACTIVE' 
  | 'REQUIRES_APPROVAL'
  | 'PRICE_REVIEW' 
  | 'DISCONTINUED' 
  | 'ARCHIVED';

export type AttributeDataType = 'text' | 'number' | 'decimal' | 'boolean' | 'select' | 'multi_select' | 'range';

export interface AttributeOption {
  id: string;
  label: string;
  codeSuffix?: string;
  description?: string;
}

export interface AttributeDefinition {
  id: string;
  groupId: string;
  groupName: string;
  name: string;
  code: string;
  dataType: AttributeDataType;
  unit?: string;
  isRequired?: boolean;
  displayOrder?: number;
  defaultValue?: any;
  allowedValues?: AttributeOption[];
  minValue?: number;
  maxValue?: number;
  description?: string;
}

export interface AttributeTemplate {
  id: string;
  templateCode: string;
  name: string;
  categoryId: string;
  description?: string;
  attributeIds: string[];
}

export interface BOMComponent {
  id: string;
  componentType: 'PROFILE' | 'GLASS' | 'HARDWARE' | 'GASKET' | 'SEALANT' | 'CONSUMABLE' | 'ACCESSORY';
  materialCode?: string;
  description: string;
  quantity: number;
  unit: string;
  wastagePercentage: number;
  grossQuantity: number;
  rate: number;
  amount: number;
  supplierId?: string;
  supplierName?: string;
  priceSource: 'SUPPLIER_QUOTATION' | 'PURCHASE_INVOICE' | 'MANUAL_ENTRY' | 'MARKET_SURVEY' | 'PREVIOUS_PROJECT' | 'MANUFACTURER_PRICE' | 'IMPORTED_DATA' | 'ESTIMATE' | 'OTHER';
  priceEffectiveDate: string;
  priceValidUntil?: string;
  notes?: string;
}

export interface BOMLabourItem {
  id: string;
  labourType: 'Fabrication' | 'Installation' | 'Glazing' | 'Welding' | 'Grinding' | 'Painting' | 'Site Work' | 'Supervision';
  rateBasis: 'HOURLY' | 'DAILY' | 'M2' | 'RUNNING_METRE' | 'PIECE';
  hoursOrQty: number;
  unitRate: number;
  amount: number;
  notes?: string;
}

export type OverheadCostType = 
  | 'FACTORY_OVERHEAD' 
  | 'ADMIN_OVERHEAD' 
  | 'EQUIPMENT_MACHINERY' 
  | 'LOGISTICS_TRANSPORT' 
  | 'SCAFFOLDING_SITE_ACCESS' 
  | 'PACKAGING_PROTECTION' 
  | 'QUALITY_TESTING' 
  | 'INSURANCE_COMPLIANCE' 
  | 'WASTAGE_CONTINGENCY'
  | 'OTHER_COST';

export type OverheadCalculationBasis = 
  | 'PERCENT_DIRECT' 
  | 'PERCENT_MATERIALS' 
  | 'PERCENT_LABOUR' 
  | 'FIXED_AMOUNT';

export interface BOMOverheadCostItem {
  id: string;
  name: string;
  costType: OverheadCostType;
  calculationBasis: OverheadCalculationBasis;
  rateOrPercent: number; // e.g. 8 for 8%, or 1500 for LKR 1500 fixed
  amount: number; // calculated LKR amount
  description?: string;
  code?: string;
  isIncludedInUnitCost?: boolean;
}

export interface VariantBOM {
  id: string;
  variantId: string;
  version: number;
  baseQuantity: number; // e.g. per 1 m2 or per 1 unit
  baseUnit: string;
  components: BOMComponent[];
  labourItems: BOMLabourItem[];
  overheadItems?: BOMOverheadCostItem[];
  totalOverheadCost?: number;
  overheadFactoryPercent: number;
  overheadAdminPercent: number;
  contingencyPercent: number;
  directMaterialCost: number;
  directLabourCost: number;
  totalDirectCost: number;
  factoryOverheadAmount: number;
  adminOverheadAmount: number;
  contingencyAmount: number;
  totalCost: number;
  lastCalculated: string;
}

export interface SupplierMaterialPrice {
  id: string;
  supplierId: string;
  supplierName: string;
  materialCode: string;
  materialName: string;
  unit: string;
  rate: number;
  currency: string;
  moq?: number;
  leadTimeDays?: number;
  paymentTerms?: string;
  deliveryTerms?: string;
  effectiveFrom: string;
  validUntil?: string;
  quotationRef?: string;
  isPreferred?: boolean;
  recordedBy: string;
  createdAt: string;
}

export interface VariantPriceHistoryEntry {
  id: string;
  date: string;
  oldSellingPrice?: number;
  newSellingPrice: number;
  oldCostPrice?: number;
  newCostPrice: number;
  markupPercent?: number;
  marginPercent?: number;
  reason: string;
  changedBy: string;
  source?: string;
  projectId?: string;
  projectName?: string;
  projectCode?: string;
  clientName?: string;
  usageScope?: 'Project Specific' | 'Enterprise Catalog' | 'Framework Tender' | 'Bespoke Variation' | string;
  quoteId?: string;
  quoteNo?: string;
}

export interface VariantPricing {
  costPrice: number;
  minimumPrice: number;
  competitivePrice?: number;
  standardPrice: number;
  targetPrice?: number;
  premiumPrice?: number;
  sellingPrice: number;
  pricingMethod: 'Manual Price' | 'Cost + Markup' | 'Target Margin' | 'Supplier-based Price' | 'Historical Price' | 'Market Reference' | 'Formula-based Price';
  markupPercent: number; // (Selling - Cost) / Cost * 100
  grossMarginPercent: number; // (Selling - Cost) / Selling * 100
  grossProfit: number; // Selling - Cost
  priceSource: 'SUPPLIER_QUOTATION' | 'PURCHASE_INVOICE' | 'MANUAL_ENTRY' | 'MARKET_SURVEY' | 'PREVIOUS_PROJECT' | 'MANUFACTURER_PRICE' | 'IMPORTED_DATA' | 'ESTIMATE' | 'OTHER';
  currency: string;
  effectiveFrom: string;
  validUntil?: string;
  lastUpdated: string;
  isExpired?: boolean;
  isStale?: boolean; // > 90 days
  confidenceRating?: number; // 0-100%
  priceNotes?: string;
}

export interface QuotationPriceSnapshot {
  id: string;
  quoteId: string;
  quoteItemId: string;
  variantId?: string;
  variantCode?: string;
  variantName: string;
  descriptionSnapshot: string;
  specificationSnapshot: Record<string, any>;
  quotedRate: number;
  unit: string;
  costSnapshot: number;
  marginPercentSnapshot: number;
  markupPercentSnapshot: number;
  bomSnapshot?: Partial<VariantBOM>;
  lockedAt: string;
  lockedBy: string;
}

export interface ProductVariant {
  id: string;
  variantCode: string;
  variantName: string;
  sku?: string;
  shortName?: string;
  pvcCode?: string;
  barcode?: string;
  familyId?: string;
  itemId?: string; // Links to parent base ItemTemplate / BOQ Item
  itemName?: string;
  categoryId?: string;
  categoryName?: string;
  generatedDescription?: string;
  customerDescription?: string;
  technicalDescription?: string;
  boqDescription?: string;
  status: VariantStatus | 'Active' | 'Inactive' | 'Discontinued';
  technicalStatus?: 'COMPATIBLE' | 'REQUIRES_APPROVAL' | 'NOT_COMPATIBLE';
  brandId?: string;
  brandName?: string;
  manufacturer?: string;
  model?: string;
  normalizedSignature?: string; // Hash / sorted string of attributes for duplicate detection
  attributes?: Record<string, any>; // attributeCode -> value
  structuredAttributes?: {
    attributeId: string;
    attributeCode: string;
    name: string;
    displayValue: string;
    numericValue?: number;
    textValue?: string;
    unit?: string;
  }[];
  pricing?: VariantPricing;
  bom?: VariantBOM;
  priceHistory?: VariantPriceHistoryEntry[];
  supplierQuotes?: SupplierMaterialPrice[];
  selections?: { [groupId: string]: string }; // Legacy support
  technicalSpecification?: TechnicalSpecification;
  unit?: MeasurementUnit;
  weightPerUnit?: number;
  warrantyPeriod?: string;
  imageUrl?: string;
  activeRateVersionId?: string;
  rateHistory?: RateVersion[];
  notes?: string;
  createdBy?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RateHistoryEntry {
  id: string;
  date: string;
  rate: number;
  version?: string;
  reason?: string;
  quoteId?: string;
  projectName?: string;
  clientName?: string;
  status?: QuoteStatus | 'Approved' | 'Pending' | 'Draft' | 'Archived' | string;
  discountApplied?: number;
  finalPrice?: number;
  competitorName?: string;
  competitorPrice?: number;
  competitorSpecParity?: 'Identical' | 'Higher' | 'Lower';
  supplierCost?: number;
  marginPercent?: number;
  recordedBy?: string;
  effectiveUntil?: string;
  notes?: string;
}

export interface CompetitivePriceEntry {
  id: string;
  competitorName: string;
  price: number;
  date: string;
  parity?: 'Identical' | 'Higher' | 'Lower';
  specificationParity?: 'Identical' | 'Higher' | 'Lower';
  notes?: string;
  projectName?: string;
}

export interface ItemTemplate {
  id: string;
  pvcCode?: string;
  barcode?: string;
  productCode?: string;
  code?: string;
  name: string;
  description: string;
  longDescription?: string;
  detailedSpecification?: string;
  category: string;
  categoryId?: string;
  subCategory?: string;
  subCategoryId?: string;
  categoryPath?: string[];
  productType: ProductType;
  status: ItemStatus;
  unit: MeasurementUnit;
  variantId?: string;
  rateVersionId?: string;
  width?: number;
  height?: number;
  length?: number;
  rate: number;
  discountPercent?: number;
  rateBasis?: RateBasis;
  minCharge?: number;
  validityStart?: string;
  validityEnd?: string;
  imageUrl?: string;
  isPopular?: boolean;
  specification?: ItemSpecification;
  specifications?: SpecificationLibraryItem[];
  calculationSheets?: CalculationLibrarySheet[];
  technicalSpecification?: TechnicalSpecification;
  serviceSpecification?: ServiceSpecification;
  itemCharges?: ItemCharge[];
  measurements?: MeasurementSheet;
  rateHistory?: RateHistoryEntry[];
  competitivePrices?: {
    id: string;
    competitorName: string;
    price: number;
    date: string;
    parity?: 'Identical' | 'Higher' | 'Lower';
    notes?: string;
    projectName?: string;
  }[];
  tags?: string[];
  lastBiddedRate?: number;
  avgBiddedRate?: number;
  minBiddedRate?: number;
  maxBiddedRate?: number;
  internalNotes?: string;
  supplierName?: string;
  supplierCode?: string;
  lastSupplierPrice?: number;
  targetMargin?: number;
  costAtTimeOfQuote?: number;
}

export type PdfLayout = 'Detailed' | 'Compact' | 'Summary' | 'Executive';

export type PricingMethod = 'Fixed Price' | 'Unit Rate' | 'Time & Material' | 'Cost Plus' | 'Lump Sum';
export type ProjectStage = 'Budgetary' | 'Detailed BOQ' | 'Final' | 'Revised' | 'Variation';
export type ScopeCoverage = 'Supply Only' | 'Labor Only' | 'Supply & Install' | 'Turnkey';

export type QuotationType = 
  | PricingMethod
  | ProjectStage
  | ScopeCoverage
  | 'Comparative'
  | 'Executive';

export type DocumentType = 
  | 'Quotation' 
  | 'Invoice' 
  | 'Variation' 
  | 'ProjectReport' 
  | 'Warranty' 
  | 'AccountStatement' 
  | 'DeliveryNote' 
  | 'Product'
  | 'Client';

export interface VerificationRegistryEntry {
  id: string;
  svcCode: string;
  documentType: DocumentType;
  documentRef: string;
  internalId: string;
  generatedAt: string;
  generatedBy: string;
  status: 'Active' | 'Superseded' | 'Voided' | 'Expired';
  version: number;
  metadata: {
    customerName: string;
    projectName?: string;
    totalValue?: number;
    expiryDate?: string;
    voidReason?: string;
    isCurrent?: boolean;
    linkedLatestSvc?: string;
    productDetails?: {
      sku: string;
      barcode?: string;
      name: string;
      family: string;
      category: string;
      status: string;
    };
    clientDetails?: {
      name: string;
      company: string;
      category: string;
      status: string;
    };
  };
  accessCount: number;
  lastAccessed?: string;
}

export interface VerificationAuditLog {
  id: string;
  svcCode: string;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  result: 'Success' | 'Failed' | 'Voided' | 'Expired';
}

export interface BankDetail {
  id: string;
  bankName: string;
  branchName: string;
  accountName: string;
  accountNumber: string;
  accountNo?: string;
  swiftCode?: string;
  isDefault?: boolean;
}

export enum InvoiceType {
  STANDARD = 'Standard',
  PROFORMA = 'Proforma',
  PROGRESS_BILLING = 'Progress Billing',
  STAGE_BILLING = 'Stage Billing',
  ADVANCE = 'Advance',
  FINAL = 'Final',
  RECURRING = 'Recurring',
  RETENTION_CLAIM = 'Retention Claim'
}

export enum InvoiceStatus {
  DRAFT = 'Draft',
  SENT = 'Sent',
  PARTIAL = 'Partial',
  COLLECTED_PAYMENT = 'Collected Payment',
  PAID = 'Paid',
  OVERDUE = 'Overdue',
  CANCELLED = 'Cancelled'
}

export interface InvoiceItem {
  id: string;
  pvcCode?: string;
  name?: string;
  description: string;
  itemType?: 'Title' | 'Main' | 'Sub';
  no?: string;
  qty: number;
  unit: string;
  rate: number;
  amount: number;
  taxPercent: number;
  discountPercent: number;
  partNo?: string;
  itemNo?: string;
  variationStatus?: VariationStatus;
  calculations?: string;
  measurements?: MeasurementSheet;
}

export interface Invoice {
  id: string;
  invoiceNo: string;
  type: InvoiceType;
  status: InvoiceStatus;
  date: string;
  dueDate: string;
  expirationDate?: string;
  customerId?: string;
  projectId?: string;
  projectCode?: string;
  currency?: string;
  projectName?: string;
  quoteId?: string;
  client: Client;
  shipTo?: string | {
    name: string;
    company?: string;
    address: string;
    phone: string;
  };
  shippingDetails?: {
    freightType?: string;
    estShipDate?: string;
    estGrossWeight?: string;
    estCubicWeight?: string;
    totalPackages?: string;
    method?: string;
    trackingNo?: string;
  };
  additionalDetails?: {
    countryOfOrigin?: string;
    portOfEmbarkation?: string;
    portOfDischarge?: string;
    reasonForExport?: string;
  };
  items: InvoiceItem[];
  subTotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  amountPaid: number;
  amountAdjusted?: number;
  balanceDue: number;
  totalProjectValue?: number;
  previouslyInvoiced?: number;
  totalProjectCollected?: number;
  projectBalanceDue?: number;
  currentProgressPercent?: number;
  nextProgressPercent?: number;
  nextProgressAmount?: number;
  projectItems?: BOQItem[];
  variationItems?: BOQItem[];
  retentionAmount?: number;
  retentionPercent?: number;
  notes?: string;
  terms?: string;
  termsList?: Term[];
  bankDetails?: BankDetail;
  paymentTierId?: string;
  recurringConfig?: {
    frequency: 'Weekly' | 'Monthly' | 'Quarterly' | 'Yearly';
    nextDate: string;
    endDate?: string;
    isActive?: boolean;
    interval?: number;
    startDate?: string;
  };
  barcode?: string;
  purchaseOrderNo?: string;
  salesperson?: string;
  shippingMethod?: string;
  shippingTerms?: string;
  paymentTerms?: string;
  deliveryDate?: string;
  shippingHandling?: number;
  salesTaxRate?: number;
  taxPercent?: number;
  advancePercent?: number;
  chequeDetails?: {
    chequeNo: string;
    bank: string;
    date: string;
  };
  retentionDetails?: {
    isRetentionInvoice: boolean;
    originalInvoiceId?: string;
    retentionAmount: number;
    retentionPercent: number;
  };
  tag?: string;
  createdAt: string;
  updatedAt: string;
  documentSettings?: {
    fontSize: number;
    accentColor: string;
    showLogo: boolean;
    showBankDetails: boolean;
    showTimeline: boolean;
    showPaymentTiers: boolean;
    layoutType: PdfLayout;
  };
}

export type PaymentMethod = 'Cash' | 'Bank Transfer' | 'Cheque' | 'Other';

export interface Payment {
  id: string;
  paymentNo: string;
  clientId: string;
  clientName: string;
  projectId?: string;
  projectName?: string;
  invoiceId?: string;
  invoiceNo?: string;
  amount: number;
  date: string;
  method: PaymentMethod;
  reference?: string;
  referenceNumber?: string;
  chequeNo?: string;
  bankName?: string;
  chequeDate?: string;
  notes?: string;
  evidence?: {
    id: string;
    url: string;
    name: string;
    type: string;
    extractedData?: any;
  };
  status?: 'Pending' | 'Completed' | 'Failed';
  createdAt?: string;
  updatedAt?: string;
  customerId?: string;
}

export type AdjustmentType = 'Credit Note' | 'Discount' | 'Write-off' | 'Retention Release' | 'Bad Debt';

export interface Adjustment {
  id: string;
  adjustmentNo: string;
  clientId: string;
  clientName: string;
  projectId?: string;
  projectName?: string;
  invoiceId?: string;
  invoiceNo?: string;
  type: AdjustmentType;
  amount: number;
  date: string;
  reason: string;
  notes?: string;
  evidence?: {
    id: string;
    url: string;
    name: string;
    type: string;
    extractedData?: any;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface Transaction {
  id: string;
  date: string;
  type: 'Invoice' | 'Payment' | 'Adjustment';
  referenceNo: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  projectId?: string;
  projectName?: string;
}

export interface CustomerFinancials {
  clientId: string;
  totalInvoiced: number;
  totalPaid: number;
  totalAdjusted: number;
  totalRetention: number;
  totalRetentionReleased: number;
  outstandingBalance: number;
  aging: {
    current: number;
    '1-30': number;
    '31-60': number;
    '61-90': number;
    '90+': number;
  };
  creditLimit?: number;
  lastPaymentDate?: string;
  avgPaymentDays?: number;
}

export interface ProjectFinancials {
  projectId: string;
  projectName: string;
  contractValue: number;
  variationsValue: number;
  totalValue: number;
  totalInvoiced: number;
  totalPaid: number;
  totalRetention: number;
  totalRetentionReleased: number;
  balanceToInvoice: number;
  balanceToCollect: number;
  profitability?: number;
}

export interface CompanySettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  logo?: string;
  logoDark?: string;
  bankDetails: BankDetail[];
  currencies: string[];
  defaultCurrency: string;
  quoteNumberPrefix: string;
  nextQuoteNumber: number;
  invoiceNumberPrefix: string;
  nextInvoiceNumber: number;
  frontCoverPdf?: string;
  backCoverPdf?: string;
  invoiceFrontCoverPdf?: string;
  invoiceBackCoverPdf?: string;
  defaultValidityDays: number;
  defaultDeliveryDays: number;
  enableNotifications?: boolean;
  vatNo?: string;
  registrationNo?: string;
  defaultRetentionPercent?: number;
  retentionClauses?: string;
  vatRatePercent?: number;
  corporateIncomeTaxRatePercent?: number;
  taxIdentificationNumber?: string;
  customDutiesAndLevies?: Array<{
    id: string;
    name: string;
    ratePercent: number;
    appliesTo: 'procurement' | 'import' | 'sales' | 'general';
    isActive: boolean;
  }>;
  numberingSequences?: any[];
}

export interface Quote {
  id: string;
  quoteNo: string;
  projectId?: string; // Foreign key linking to Project.id
  projectCode?: string; // e.g. PRJ-2026-001
  projectName: string;
  workSiteLocation?: string;
  salesRepresentative?: string;
  quoteType: QuotationType;
  pricingMethod: PricingMethod;
  projectStage: ProjectStage;
  scopeCoverage: ScopeCoverage;
  version: number;
  submittedDate: string;
  validityDays: number;
  validUntil?: string;
  client: Client;
  items: BOQItem[];
  terms: Term[];
  additionalCharges: AdditionalCharge[];
  discountPercent: number;
  taxPercent: number;
  isTaxInclusive: boolean;
  isTemplate?: boolean;
  advancePercent: number;
  estimatedDeliveryDays: number;
  currency: string;
  status: QuoteStatus;
  declaration?: string;
  marginPercent?: number; // For Cost Plus
  lumpSumAmount?: number; // For Lump Sum
  confidenceLevel?: number; // For Budgetary (0-100)
  justification?: string; // For Variation/Revised
  timeline?: Timeline;
  documentSettings?: {
    fontSize: number;
    accentColor: string;
    showLogo: boolean;
    showBankDetails: boolean;
    showTimeline: boolean;
    showPaymentTiers: boolean;
    layoutType: PdfLayout;
  };
  paymentTiers?: PaymentTier[];
  createdAt?: string;
  updatedAt?: string;
  grandTotal?: number;
}

export interface Job {
  id: string;
  itemId?: string; // Optional link to a BOQItem
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Delayed';
  assignedTo?: string;
  progress: number; // 0 to 100
}

export interface Inquiry {
  id: string;
  customerId: string;
  regardingId?: string; // Project, Quote or Order ID
  regardingType: 'Project' | 'Quote' | 'Order' | 'General';
  subject: string;
  message: string;
  attachments?: string[];
  preferredResponse: 'Email' | 'Phone' | 'Visit';
  status: 'Pending' | 'Read' | 'Replied';
  createdAt: string;
  history: {
    sender: 'Customer' | 'Staff';
    message: string;
    timestamp: string;
  }[];
}

export interface ServiceVisitRequest {
  id: string;
  customerId: string;
  projectId: string;
  description: string;
  urgency: 'Low' | 'Medium' | 'High' | 'Emergency';
  preferredDate: string;
  preferredTimeSlot: string;
  siteContact: string;
  sitePhone: string;
  photos: string[];
  status: 'Pending' | 'Scheduled' | 'Completed' | 'Cancelled';
  createdAt: string;
}

export interface Timeline {
  id: string;
  quoteId: string;
  jobs: Job[];
}

export interface DesignCategory {
  id: string;
  name: string;
  parentId: string | null; // null = Main Category, string = Sub-Category ID
  description?: string;
  color?: string;
}

export interface DesignMediaAttachment {
  id: string;
  type: 'image' | 'video';
  url: string;
  fileName: string;
  fileSize: number; // in bytes (max 1MB for image, 10MB for video)
  caption?: string;
}

export interface QuoteTemplate {
  id: string;
  name: string;
  description: string;
  designCode?: string;
  quoteType: QuotationType;
  pricingMethod?: PricingMethod;
  projectStage?: ProjectStage;
  scopeCoverage?: ScopeCoverage;
  validityDays: number;
  advancePercent: number;
  taxPercent: number;
  isTaxInclusive: boolean;
  estimatedDeliveryDays: number;
  currency?: string;
  terms: Term[];
  items: BOQItem[];
  additionalCharges?: AdditionalCharge[];
  category?: string;
  categoryId?: string;
  subCategory?: string;
  subCategoryId?: string;
  mediaType?: 'image' | 'video' | 'none';
  mediaUrl?: string;
  mediaFileName?: string;
  mediaFileSize?: number;
  mediaGallery?: DesignMediaAttachment[];
  designSpecs?: {
    buildingType?: string;
    totalAreaSqft?: number;
    windLoadPa?: number;
    acousticRatingDb?: string;
    finishSpec?: string;
    glassSpec?: string;
    drawingRef?: string;
  };
  isCustom?: boolean;
  tags?: string[];
  paymentTiers?: PaymentTier[];
  createdAt?: string;
  updatedAt?: string;
  notes?: string;
}

export const DEFAULT_TERMS: Term[] = [
  { id: '1.2.1', no: '1.2.1', title: 'Submitted Date', content: 'The date of submission for this quotation.', isActive: true },
  { id: '1.2.2', no: '1.2.2', title: 'Offer and Validity', content: 'Prices are in Sri Lankan Rupees and valid for fifteen (15) days from submission, after which revised pricing may be issued to reflect changes prior to acceptance pursuant to general contract formation under Sri Lankan law. On acceptance, the BOQ, drawings, and these terms form the binding contract documents subject to stamping where applicable under the Stamp Duty Act of Sri Lanka.', isActive: true },
  { id: '1.2.3a', no: '1.2.3(a)', title: 'Scope of work', content: 'Scope includes supply, fabrication, delivery, installation, testing, commissioning, protection, and final cleaning for aluminium and steel works, interior fit-out, minor construction, renovations, and repairs as described in the BOQ and approved drawings/specifications.', isActive: true },
  { id: '1.2.3b', no: '1.2.3(b)', title: 'Contractor Responsibility', content: 'The contractor must submit all required drawings, samples, and documents for approval. But even after approval, the contractor is still fully responsible for ensuring that all materials, methods, and work comply with CIDA standards, project requirements, and legal obligations.', isActive: true },
  { id: '1.2.4', no: '1.2.4', title: 'Programme and duration', content: 'Estimated completion is 20 days ± 2 days from written Notice to Commence and receipt of advance, subject to site readiness and approvals, with entitlement to Extensions of Time for force majeure, client-caused delay, and delayed approvals.', isActive: true },
  { id: '1.2.5', no: '1.2.5', title: 'Price, rates, and currency', content: 'Unit rates are firm for the validity period and, once contracted, remain fixed for the agreed scope, save for approved variations, remeasurement where applicable, or statutory tax changes under TAX law. Currency of account and payment is LKR.', isActive: true },
  { id: '1.2.6', no: '1.2.6', title: 'Measurement and variations', content: 'Measurement follows Sri Lankan Standard Method of Measurement for Building Works SLS 573 and related CIDA/IQSSL guidance; BOQ quantities are estimates for remeasurement items, with payment on actual measured quantities.', isActive: true },
  { id: '1.2.7', no: '1.2.7', title: 'Payment terms', content: 'Payment milestones: 60% advance at Order Confirmation/Notice to Commence, 20% at 50% certified progress (by joint measurement), and balance at completion, testing/commissioning, and handover, subject to VAT invoicing.', isActive: true },
  { id: '1.2.8', no: '1.2.8', title: 'Title, risk, delivery, and handover', content: 'Risk in materials remains with the Contractor until installation, with risk in completed works passing at taking-over/handover. Title to materials passes upon payment for the relevant portion.', isActive: true },
  { id: '1.2.9', no: '1.2.9', title: 'Health & safety Compliance', content: 'The Contractor must comply with the Factories Ordinance (health, safety, welfare) and related regulations applicable to construction and engineering works.', isActive: true },
  { id: '1.2.10', no: '1.2.10', title: 'Quality and technical standards', content: 'Materials and workmanship comply with relevant SLS standards or, where absent, with suitable BS/EN/ISO/ASTM equivalents recognized in Sri Lankan practice and CIDA specifications.', isActive: true },
  { id: '1.2.11', no: '1.2.11', title: 'Submittals and inspections', content: 'The Contractor provides inspection and test plans, mill certificates, calibration records, and as-built drawings; approvals do not waive conformance obligations under contract and law.', isActive: true },
  { id: '1.2.12', no: '1.2.12', title: 'Subcontracting and personnel', content: 'Subcontracting of specialist trades is permitted with prior written notice; the Contractor remains fully responsible for subcontractors’ performance and safety compliance.', isActive: true },
  { id: '1.2.13', no: '1.2.13', title: 'Additional Work', content: 'In the event of Additional Work, not covered on this Quotation, Separate Sub Quotations to be submitted and approved for extra payment.', isActive: true },
  { id: '1.2.14', no: '1.2.14', title: 'BOQ notes for pricing', content: 'Inclusions: supply, fabrication, delivery, fixing, sealants, accessories, consumables, protection, testing/commissioning, and final cleaning unless expressly excluded.', isActive: true },
  { id: '1.2.15', no: '1.2.15', title: 'Warranty and defects liability', content: 'A six-month Defects Liability Period applies for workmanship defects attributable to the Contractor, with rectification within a reasonable period upon notice.', isActive: true },
  { id: '1.2.16', no: '1.2.16', title: 'Indemnity and liability', content: 'Each party indemnifies the other from third-party claims for death, personal injury, or property damage arising from its negligence or breach.', isActive: true },
  { id: '1.2.17', no: '1.2.17', title: 'Force majeure', content: 'Force majeure events beyond reasonable control permit suspension and a reasonable extension of time, with termination without fault if prolonged.', isActive: true },
  { id: '1.2.18', no: '1.2.18', title: 'Suspension and termination', content: 'The Contractor may suspend for non-payment after written notice and terminate for continued non-payment or material breach uncured within a reasonable period.', isActive: true },
  { id: '1.2.19', no: '1.2.19', title: 'Public contracts compliance', content: 'If the Purchaser is a public body or the project is a public contract and the contract cost exceeds LKR 5 million, registration under the Public Contracts Act No. 3 of 1987 is required.', isActive: true },
  { id: '1.2.20', no: '1.2.20', title: 'Electronic communications and signatures', content: 'Electronic offers, acceptances, and signatures are legally recognized under the Electronic Transactions Act No. 19 of 2006 as amended.', isActive: true },
  { id: '1.2.21', no: '1.2.21', title: 'Dispute resolution', content: 'Any dispute first proceeds to good-faith negotiation between authorized representatives within fourteen (14) days of a dispute notice.', isActive: true },
  { id: '1.2.22', no: '1.2.22', title: 'Notices', content: 'Notices are valid if delivered by hand, courier, or acknowledged email to stated addresses and are effective on receipt.', isActive: true },
  { id: '1.2.23', no: '1.2.23', title: 'Order of precedence', content: 'In case of conflict, the order of precedence is: Contract Agreement; Letter of Acceptance/Work Order and Special Conditions; these Terms; BOQ and Specifications.', isActive: true },
  { id: '1.2.24', no: '1.2.24', title: 'Rates and adjustments', content: 'Rates are unchangeable within the validity period and, post-contract, except via approved variations/remeasurement or statutory tax changes.', isActive: true },
  { id: '1.2.25', no: '1.2.25', title: 'Responsibility and obligation', content: 'The Contractor keeps the site orderly, removes debris/offcuts, and disposes waste at licensed facilities per National Environmental Act and local by-laws.', isActive: true },
  { id: '1.2.26', no: '1.2.26', title: 'Acceptance', content: 'Issuance of a Purchase/Work Order incorporating these terms, and payment of the advance, constitutes acceptance and authorizes mobilization.', isActive: true },
];

export const DEFAULT_QUOTE_TEMPLATES: QuoteTemplate[] = [
  {
    id: 'qt-fixed',
    designCode: 'DSN-2026-001',
    name: 'Standard Fixed Price (Shopfront & Entry)',
    description: 'Turnkey fixed-price structure for retail shopfronts, entry doors, and ground-floor glazing.',
    quoteType: 'Fixed Price',
    category: 'Glazing & Shopfront',
    subCategory: 'Commercial Retail Shopfronts',
    tags: ['Fixed Price', 'Retail', 'Turnkey'],
    validityDays: 15,
    advancePercent: 60,
    taxPercent: 0,
    isTaxInclusive: false,
    estimatedDeliveryDays: 14,
    mediaType: 'image',
    mediaFileName: 'retail_shopfront_elevation.svg',
    mediaFileSize: 184320,
    mediaUrl: `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 320"><defs><linearGradient id="bg1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#0f172a"/><stop offset="100%" stop-color="#1e293b"/></linearGradient><linearGradient id="gl1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#38bdf8" stop-opacity="0.35"/><stop offset="100%" stop-color="#0284c7" stop-opacity="0.12"/></linearGradient></defs><rect width="640" height="320" fill="url(#bg1)"/><g stroke="#334155" stroke-width="1" opacity="0.45"><line x1="0" y1="60" x2="640" y2="60"/><line x1="0" y1="120" x2="640" y2="120"/><line x1="0" y1="180" x2="640" y2="180"/><line x1="0" y1="240" x2="640" y2="240"/><line x1="120" y1="0" x2="120" y2="320"/><line x1="240" y1="0" x2="240" y2="320"/><line x1="360" y1="0" x2="360" y2="320"/><line x1="480" y1="0" x2="480" y2="320"/></g><rect x="80" y="55" width="480" height="215" fill="none" stroke="#94a3b8" stroke-width="4"/><rect x="86" y="61" width="145" height="203" fill="url(#gl1)" stroke="#64748b" stroke-width="2"/><rect x="409" y="61" width="145" height="203" fill="url(#gl1)" stroke="#64748b" stroke-width="2"/><rect x="235" y="61" width="170" height="42" fill="url(#gl1)" stroke="#64748b" stroke-width="2"/><rect x="235" y="107" width="83" height="157" fill="url(#gl1)" stroke="#f97316" stroke-width="2.5"/><rect x="322" y="107" width="83" height="157" fill="url(#gl1)" stroke="#f97316" stroke-width="2.5"/><line x1="306" y1="165" x2="306" y2="205" stroke="#f8fafc" stroke-width="3" stroke-linecap="round"/><line x1="334" y1="165" x2="334" y2="205" stroke="#f8fafc" stroke-width="3" stroke-linecap="round"/><text x="90" y="38" fill="#cbd5e1" font-family="monospace" font-size="11" font-weight="bold">ELEVATION: 12MM FRAMELESS SHOPFRONT &amp; DOUBLE ENTRY (3600 x 2400 MM)</text></svg>`)}`,
    designSpecs: {
      buildingType: 'Retail Mall & Commercial Ground Floor',
      totalAreaSqft: 165,
      windLoadPa: 1200,
      acousticRatingDb: '34 dB Rw',
      finishSpec: 'Powder Coated Matt Charcoal RAL 7016 (60 Microns)',
      glassSpec: '12mm & 10mm Clear Tempered Safety Glass (SLS 1181)',
      drawingRef: 'CAD-SF-2026-A01'
    },
    items: [
      {
        id: 'item-fp-1',
        no: '1.1',
        pvcCode: 'GL-DR-012',
        name: 'Frameless Glass Entrance Double Door',
        description: 'Supply and installation of 12mm clear tempered glass double doors with SS patch fittings, heavy-duty floor spring, and 1200mm SS pull handles.',
        itemType: 'Main',
        productType: 'Product',
        category: 'Glass',
        unit: 'Set',
        qty: 1,
        rate: 135000,
        costAtTimeOfQuote: 96000,
        discountPercent: 0,
        amount: 135000
      },
      {
        id: 'item-fp-2',
        no: '1.2',
        pvcCode: 'AL-SF-100',
        name: 'Fixed Glass Shopfront Panels 100mm Series',
        description: 'Heavy gauge 1.5mm powder coated aluminium framing with 10mm clear tempered safety glass, silicon weather seal, and perimeter flashing.',
        itemType: 'Main',
        productType: 'Product',
        category: 'Aluminium',
        unit: 'sqft',
        qty: 120,
        rate: 1850,
        costAtTimeOfQuote: 1320,
        discountPercent: 0,
        amount: 222000
      },
      {
        id: 'item-fp-3',
        no: '1.3',
        pvcCode: 'SRV-MS-001',
        name: 'Laser Site Survey, Setting-Out & Structural Silicone Testing',
        description: 'On-site laser level setting-out, floor spring box core cutting, and perimeter structural weather seal warranty inspection.',
        itemType: 'Main',
        productType: 'Service',
        category: 'Services',
        unit: 'Visit',
        qty: 1,
        rate: 18500,
        costAtTimeOfQuote: 11000,
        discountPercent: 0,
        amount: 18500
      }
    ],
    terms: DEFAULT_TERMS.slice(0, 10),
    paymentTiers: [
      { id: 'pt-1', phase: 'Advance on Mobilization', percentage: 60, amount: 225300, status: 'Pending' },
      { id: 'pt-2', phase: 'On Delivery of Materials to Site', percentage: 30, amount: 112650, status: 'Pending' },
      { id: 'pt-3', phase: 'On Handover & Final Inspection', percentage: 10, amount: 37550, status: 'Pending' }
    ]
  },
  {
    id: 'qt-unit',
    designCode: 'DSN-2026-002',
    name: 'Unit Rate (Aluminium Windows & Partitions)',
    description: 'Standard remeasurable framework for architectural windows, sliding doors, and modular partitions.',
    quoteType: 'Unit Rate',
    category: 'Aluminium & Windows',
    subCategory: 'Sliding Windows & Doors',
    tags: ['Unit Rate', 'Residential', 'Commercial'],
    validityDays: 30,
    advancePercent: 50,
    taxPercent: 15,
    isTaxInclusive: true,
    estimatedDeliveryDays: 21,
    mediaType: 'image',
    mediaFileName: 'aluminium_window_suite.svg',
    mediaFileSize: 196400,
    mediaUrl: `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 320"><defs><linearGradient id="bg2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#0c4a6e"/><stop offset="100%" stop-color="#0f172a"/></linearGradient><linearGradient id="gl2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#7dd3fc" stop-opacity="0.35"/><stop offset="100%" stop-color="#0ea5e9" stop-opacity="0.1"/></linearGradient></defs><rect width="640" height="320" fill="url(#bg2)"/><rect x="75" y="55" width="230" height="205" fill="none" stroke="#e2e8f0" stroke-width="4"/><rect x="83" y="63" width="105" height="189" fill="url(#gl2)" stroke="#38bdf8" stroke-width="2"/><rect x="192" y="63" width="105" height="189" fill="url(#gl2)" stroke="#38bdf8" stroke-width="2"/><path d="M120 158 L155 158 M255 158 L220 158" stroke="#f97316" stroke-width="3" stroke-linecap="round"/><rect x="345" y="55" width="220" height="205" fill="none" stroke="#e2e8f0" stroke-width="4"/><rect x="353" y="63" width="204" height="55" fill="url(#gl2)" stroke="#38bdf8" stroke-width="2"/><rect x="353" y="124" width="99" height="128" fill="url(#gl2)" stroke="#38bdf8" stroke-width="2"/><rect x="458" y="124" width="99" height="128" fill="url(#gl2)" stroke="#38bdf8" stroke-width="2"/><text x="75" y="38" fill="#bae6fd" font-family="monospace" font-size="11" font-weight="bold">SYSTEM: 100MM 2-TRACK SLIDING &amp; CASEMENT TOP-HUNG SERIES</text></svg>`)}`,
    designSpecs: {
      buildingType: 'Residential Luxury Villa & Apartment',
      totalAreaSqft: 200,
      windLoadPa: 1500,
      acousticRatingDb: '32 dB Rw',
      finishSpec: 'AkzoNobel Powder Coated Champagne / Matte Black',
      glassSpec: '5mm & 6mm Clear Float / Tempered Glass with EPDM Gaskets',
      drawingRef: 'CAD-WIN-2026-B04'
    },
    items: [
      {
        id: 'item-1',
        no: '1.1',
        pvcCode: 'AL-WD-001',
        name: 'Aluminium Sliding Window 100mm 2-Track',
        description: 'Supply, fabrication, and installation of 2-track sliding window with 1.2mm powder-coated extrusion, 5mm clear glass, heavy-duty nylon rollers, and key locks.',
        itemType: 'Main',
        productType: 'Product',
        category: 'Aluminium',
        unit: 'sqft',
        qty: 140,
        rate: 1450,
        costAtTimeOfQuote: 1020,
        discountPercent: 0,
        amount: 203000
      },
      {
        id: 'item-2',
        no: '1.2',
        pvcCode: 'AL-WD-002',
        name: 'Casement Window with Top Awning',
        description: 'Heavy duty aluminium casement side-hung with top awning vent, friction stays, EPDM rubber gaskets, and multipoint latch handles.',
        itemType: 'Main',
        productType: 'Product',
        category: 'Aluminium',
        unit: 'sqft',
        qty: 60,
        rate: 1850,
        costAtTimeOfQuote: 1290,
        discountPercent: 0,
        amount: 111000
      },
      {
        id: 'item-3',
        no: '1.3',
        pvcCode: 'SRV-INS-002',
        name: 'Aperture Perimeter Waterproofing & Polyurethane Foam Sealing',
        description: 'Application of PU expanding foam, backer rod, and neutral cure weather-sealant around window sub-frames.',
        itemType: 'Main',
        productType: 'Service',
        category: 'Services',
        unit: 'Visit',
        qty: 1,
        rate: 16000,
        costAtTimeOfQuote: 9500,
        discountPercent: 0,
        amount: 16000
      }
    ],
    terms: DEFAULT_TERMS,
    paymentTiers: [
      { id: 'pt-u1', phase: 'Advance Payment upon Contract Signing', percentage: 50, amount: 165000, status: 'Pending' },
      { id: 'pt-u2', phase: 'Mid-progress Joint Measurement Certified', percentage: 30, amount: 99000, status: 'Pending' },
      { id: 'pt-u3', phase: 'Testing, Handover, and Final Account', percentage: 20, amount: 66000, status: 'Pending' }
    ]
  },
  {
    id: 'qt-facade',
    designCode: 'DSN-2026-003',
    name: 'Curtain Wall & Structural Glazing',
    description: 'Engineered commercial facade framework with wind-load compliant structural glazing and ACP cladding.',
    quoteType: 'Unit Rate',
    category: 'Curtain Wall & Facade',
    subCategory: 'Semi-Unitized Structural Glazing',
    tags: ['High Rise', 'Facade', 'Unit Rate'],
    validityDays: 45,
    advancePercent: 40,
    taxPercent: 15,
    isTaxInclusive: false,
    estimatedDeliveryDays: 45,
    mediaType: 'image',
    mediaFileName: 'curtain_wall_structural_facade.svg',
    mediaFileSize: 245760,
    mediaUrl: `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 320"><defs><linearGradient id="bg3" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#090d16"/><stop offset="100%" stop-color="#1e293b"/></linearGradient><linearGradient id="gl3" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#38bdf8" stop-opacity="0.42"/><stop offset="100%" stop-color="#0369a1" stop-opacity="0.18"/></linearGradient></defs><rect width="640" height="320" fill="url(#bg3)"/><g transform="translate(80,45)"><rect x="0" y="0" width="320" height="235" fill="url(#gl3)" stroke="#94a3b8" stroke-width="3"/><line x1="80" y1="0" x2="80" y2="235" stroke="#cbd5e1" stroke-width="2.5"/><line x1="160" y1="0" x2="160" y2="235" stroke="#cbd5e1" stroke-width="2.5"/><line x1="240" y1="0" x2="240" y2="235" stroke="#cbd5e1" stroke-width="2.5"/><line x1="0" y1="78" x2="320" y2="78" stroke="#cbd5e1" stroke-width="2"/><line x1="0" y1="156" x2="320" y2="156" stroke="#cbd5e1" stroke-width="2"/><rect x="335" y="0" width="145" height="235" fill="#334155" stroke="#f97316" stroke-width="2.5"/><line x1="335" y1="58" x2="480" y2="58" stroke="#f97316" stroke-width="1.5"/><line x1="335" y1="117" x2="480" y2="117" stroke="#f97316" stroke-width="1.5"/><line x1="335" y1="176" x2="480" y2="176" stroke="#f97316" stroke-width="1.5"/></g><text x="80" y="32" fill="#e2e8f0" font-family="monospace" font-size="11" font-weight="bold">FACADE: DGU LOW-E SEMI-UNITIZED CURTAIN WALL + 4MM PVDF ACP</text></svg>`)}`,
    designSpecs: {
      buildingType: 'High-Rise Commercial Tower',
      totalAreaSqft: 530,
      windLoadPa: 2400,
      acousticRatingDb: '41 dB Rw',
      finishSpec: 'PVDF Fluorocarbon 3-Coat Metallic Silver & Anodized Mullions',
      glassSpec: '24mm DGU (6mm Sunergy Low-E + 12mm Air + 6mm Clear Tempered)',
      drawingRef: 'CAD-CW-2026-F12'
    },
    items: [
      {
        id: 'item-cw-1',
        no: '1.1',
        pvcCode: 'CW-SG-240',
        name: 'Semi-Unitized Structural Glazing System',
        description: 'Engineered extruded aluminium mullions & transoms with 6mm Sunergy Low-E + 12mm Air Space + 6mm Clear Double Glazed Units (DGU) with Dow Corning structural silicone.',
        itemType: 'Main',
        productType: 'Product',
        category: 'Glass',
        unit: 'sqft',
        qty: 350,
        rate: 3850,
        costAtTimeOfQuote: 2780,
        discountPercent: 0,
        amount: 1347500
      },
      {
        id: 'item-cw-2',
        no: '1.2',
        pvcCode: 'ACP-FR-004',
        name: 'Aluminium Composite Panel (ACP) Cladding 4mm',
        description: '4mm thick PVDF coated fire-rated grade ACP cladding over GI runner framework with approved backer rod and non-staining neutral silicone sealant.',
        itemType: 'Main',
        productType: 'Product',
        category: 'Aluminium',
        unit: 'sqft',
        qty: 180,
        rate: 1950,
        costAtTimeOfQuote: 1380,
        discountPercent: 0,
        amount: 351000
      },
      {
        id: 'item-cw-3',
        no: '1.3',
        pvcCode: 'SRV-ENG-009',
        name: 'Structural Wind-Load Calculation, Gondola Rigging & Water Hose Test',
        description: 'PE-endorsed structural mullion inertia calculation submittal, suspended cradle hoisting, and AAMA 501.2 field nozzle water penetration test.',
        itemType: 'Main',
        productType: 'Service',
        category: 'Services',
        unit: 'Lot',
        qty: 1,
        rate: 95000,
        costAtTimeOfQuote: 58000,
        discountPercent: 0,
        amount: 95000
      }
    ],
    terms: DEFAULT_TERMS,
    paymentTiers: [
      { id: 'pt-f1', phase: 'Mobilization & Structural Shop Drawing Approval', percentage: 40, amount: 717400, status: 'Pending' },
      { id: 'pt-f2', phase: 'Framework & Extrusion Installation', percentage: 35, amount: 627725, status: 'Pending' },
      { id: 'pt-f3', phase: 'Glazing, Water Testing & Final Handover', percentage: 25, amount: 448375, status: 'Pending' }
    ]
  },
  {
    id: 'qt-interior',
    designCode: 'DSN-2026-004',
    name: 'Executive Interior Glass & Partition Fit-out',
    description: 'Sleek acoustic slimline glass partitions, acoustic drywall, and hardware for high-end office suites.',
    quoteType: 'Executive',
    category: 'Interior Fit-out',
    subCategory: 'Acoustic Slimline Office Partitions',
    tags: ['Interior', 'Acoustic', 'Executive'],
    validityDays: 30,
    advancePercent: 50,
    taxPercent: 15,
    isTaxInclusive: true,
    estimatedDeliveryDays: 18,
    mediaType: 'image',
    mediaFileName: 'executive_acoustic_partition.svg',
    mediaFileSize: 162100,
    mediaUrl: `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 320"><defs><linearGradient id="bg4" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#18181b"/><stop offset="100%" stop-color="#27272a"/></linearGradient><linearGradient id="gl4" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#e4e4e7" stop-opacity="0.22"/><stop offset="100%" stop-color="#a1a1aa" stop-opacity="0.08"/></linearGradient></defs><rect width="640" height="320" fill="url(#bg4)"/><rect x="75" y="55" width="490" height="215" fill="url(#gl4)" stroke="#09090b" stroke-width="5"/><line x1="195" y1="55" x2="195" y2="270" stroke="#a1a1aa" stroke-width="1.5" stroke-dasharray="4 3"/><line x1="315" y1="55" x2="315" y2="270" stroke="#a1a1aa" stroke-width="1.5" stroke-dasharray="4 3"/><line x1="435" y1="55" x2="435" y2="270" stroke="#09090b" stroke-width="4"/><rect x="440" y="95" width="120" height="172" fill="none" stroke="#f97316" stroke-width="2.5"/><circle cx="454" cy="182" r="4" fill="#f97316"/><text x="75" y="36" fill="#f4f4f5" font-family="monospace" font-size="11" font-weight="bold">FIT-OUT: 25MM SLIMLINE BLACK ANODIZED ACOUSTIC OFFICE SUITE</text></svg>`)}`,
    designSpecs: {
      buildingType: 'Corporate Executive Suite & Boardroom',
      totalAreaSqft: 225,
      windLoadPa: 0,
      acousticRatingDb: '38 dB Rw Acoustic Seal',
      finishSpec: '25mm Slimline Matt Black Anodized Aluminium',
      glassSpec: '10mm & 12mm Toughened Clear Acoustic Glass with Dry Polycarbonate Joints',
      drawingRef: 'CAD-INT-2026-E07'
    },
    items: [
      {
        id: 'item-int-1',
        no: '1.1',
        pvcCode: 'GL-PT-010',
        name: 'Slimline Black Anodized Glass Partition 10mm',
        description: 'Minimalist 25mm profile aluminium partition with 10mm clear toughened safety glass and clear polycarbonate dry joints for maximum acoustic transparency.',
        itemType: 'Main',
        productType: 'Product',
        category: 'Glass',
        unit: 'sqft',
        qty: 180,
        rate: 2150,
        costAtTimeOfQuote: 1520,
        discountPercent: 0,
        amount: 387000
      },
      {
        id: 'item-int-2',
        no: '1.2',
        pvcCode: 'GL-DR-010',
        name: 'Frameless Glass Swing Door with Overhead Transom',
        description: '10mm tempered glass door with German hydraulic patch fittings, lever latch, and satin stainless steel drop-down acoustic seal.',
        itemType: 'Main',
        productType: 'Product',
        category: 'Glass',
        unit: 'Set',
        qty: 2,
        rate: 78000,
        costAtTimeOfQuote: 54000,
        discountPercent: 0,
        amount: 156000
      },
      {
        id: 'item-int-3',
        no: '1.3',
        pvcCode: 'SRV-ACO-004',
        name: 'Acoustic Decibel Verification & Frosted Privacy Film Application',
        description: 'Supply and wet-application of architectural sandblast manifestation film bands and post-installation acoustic seal verification.',
        itemType: 'Main',
        productType: 'Service',
        category: 'Services',
        unit: 'Visit',
        qty: 1,
        rate: 24000,
        costAtTimeOfQuote: 14500,
        discountPercent: 0,
        amount: 24000
      }
    ],
    terms: DEFAULT_TERMS.slice(0, 16),
    paymentTiers: [
      { id: 'pt-i1', phase: 'Order Confirmation & Advance Payment', percentage: 50, amount: 283500, status: 'Pending' },
      { id: 'pt-i2', phase: 'Material Delivery & Site Sub-frame Complete', percentage: 30, amount: 170100, status: 'Pending' },
      { id: 'pt-i3', phase: 'Final Glass Sealing & Handover Certification', percentage: 20, amount: 113400, status: 'Pending' }
    ]
  },
  {
    id: 'qt-budget',
    designCode: 'DSN-2026-005',
    name: 'Preliminary Budgetary Estimate',
    description: 'High-level preliminary commercial estimate for feasibility studies, client budget approvals, and master tenders.',
    quoteType: 'Budgetary',
    category: 'Budgetary Estimation',
    subCategory: 'Commercial Tower Feasibility',
    tags: ['Preliminary', 'Lump Sum', 'Feasibility'],
    validityDays: 14,
    advancePercent: 0,
    taxPercent: 0,
    isTaxInclusive: false,
    estimatedDeliveryDays: 30,
    mediaType: 'image',
    mediaFileName: 'budgetary_envelope_blueprint.svg',
    mediaFileSize: 142000,
    mediaUrl: `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 320"><rect width="640" height="320" fill="#0f172a"/><g stroke="#1e293b" stroke-width="1"><line x1="0" y1="40" x2="640" y2="40"/><line x1="0" y1="80" x2="640" y2="80"/><line x1="0" y1="120" x2="640" y2="120"/><line x1="0" y1="160" x2="640" y2="160"/><line x1="0" y1="200" x2="640" y2="200"/><line x1="0" y1="240" x2="640" y2="240"/><line x1="0" y1="280" x2="640" y2="280"/></g><polygon points="140,265 140,85 300,55 300,265" fill="#1e3a8a" fill-opacity="0.35" stroke="#38bdf8" stroke-width="2.5"/><polygon points="300,265 300,55 480,95 480,265" fill="#0f766e" fill-opacity="0.3" stroke="#2dd4bf" stroke-width="2.5"/><line x1="100" y1="265" x2="540" y2="265" stroke="#f97316" stroke-width="3"/><text x="90" y="34" fill="#93c5fd" font-family="monospace" font-size="11" font-weight="bold">FEASIBILITY: FULL BUILDING ENVELOPE &amp; INTERIOR GLAZING PACKAGE</text></svg>`)}`,
    designSpecs: {
      buildingType: 'Multi-Storey Commercial Development',
      totalAreaSqft: 1200,
      windLoadPa: 1800,
      acousticRatingDb: '35 dB Rw',
      finishSpec: 'Standard Commercial Powder Coated / Anodized Package',
      glassSpec: 'Assorted Tempered & Laminated Architectural Glazing',
      drawingRef: 'CAD-BDG-2026-P01'
    },
    items: [
      {
        id: 'item-budget-1',
        no: '1.1',
        pvcCode: 'PKG-EXT-01',
        name: 'Provisional Sum: Exterior Glazing & Fenestration Package',
        description: 'Lump sum budgetary allocation based on preliminary architectural elevations, subject to remeasurement and final engineering calculations.',
        itemType: 'Main',
        productType: 'Product',
        category: 'Aluminium',
        unit: 'Nos',
        qty: 1,
        rate: 1250000,
        costAtTimeOfQuote: 910000,
        discountPercent: 0,
        amount: 1250000
      },
      {
        id: 'item-budget-2',
        no: '1.2',
        pvcCode: 'PKG-INT-02',
        name: 'Provisional Sum: Interior Demountable Glazed Partitions',
        description: 'Lump sum budgetary allowance for interior glass and acoustic divider systems.',
        itemType: 'Main',
        productType: 'Product',
        category: 'Glass',
        unit: 'Nos',
        qty: 1,
        rate: 650000,
        costAtTimeOfQuote: 465000,
        discountPercent: 0,
        amount: 650000
      },
      {
        id: 'item-budget-3',
        no: '1.3',
        pvcCode: 'SRV-BIM-01',
        name: 'Preliminary Façade Engineering & 3D BIM Shop Drawing Package',
        description: 'Preparation of architectural shop drawings, thermal/wind-load pre-assessment, and value-engineering schedule.',
        itemType: 'Main',
        productType: 'Service',
        category: 'Services',
        unit: 'Lot',
        qty: 1,
        rate: 65000,
        costAtTimeOfQuote: 38000,
        discountPercent: 0,
        amount: 65000
      }
    ],
    terms: DEFAULT_TERMS.filter(t => ['1.2.1', '1.2.2', '1.2.5', '1.2.14'].includes(t.id))
  }
];

export const numberToWords = (num: number): string => {
  const ones = ['', 'one ', 'two ', 'three ', 'four ', 'five ', 'six ', 'seven ', 'eight ', 'nine ', 'ten ', 'eleven ', 'twelve ', 'thirteen ', 'fourteen ', 'fifteen ', 'sixteen ', 'seventeen ', 'eighteen ', 'nineteen '];
  const tens = ['', '', 'twenty ', 'thirty ', 'forty ', 'fifty ', 'sixty ', 'seventy ', 'eighty ', 'ninety '];

  const convert_less_than_thousand = (n: number): string => {
    if (n === 0) return '';
    let res = '';
    if (n >= 100) {
      res += ones[Math.floor(n / 100)] + 'hundred ';
      n %= 100;
    }
    if (n >= 20) {
      res += tens[Math.floor(n / 10)] + ones[n % 10];
    } else {
      res += ones[n];
    }
    return res;
  };

  if (num === 0) return 'zero only';

  const totalCents = Math.round(num * 100);
  const integerPart = Math.floor(totalCents / 100);
  const decimalPart = totalCents % 100;

  let res = '';
  let n = integerPart;

  if (n >= 10000000) {
    res += convert_less_than_thousand(Math.floor(n / 10000000)) + 'crore ';
    n %= 10000000;
  }
  if (n >= 100000) {
    res += convert_less_than_thousand(Math.floor(n / 100000)) + 'lakh ';
    n %= 100000;
  }
  if (n >= 1000) {
    res += convert_less_than_thousand(Math.floor(n / 1000)) + 'thousand ';
    n %= 1000;
  }
  res += convert_less_than_thousand(n);

  res = res.trim();
  if (res === '') res = 'zero';

  if (decimalPart > 0) {
    res += ' and ' + convert_less_than_thousand(decimalPart) + 'cents';
  }

  return res.trim() + ' only';
};

export const DEFAULT_ITEM_TEMPLATES: ItemTemplate[] = [
  {
    id: 't1',
    productCode: 'AL-WD-001',
    name: 'Aluminium Sliding Window (2-Track)',
    description: 'Standard 2-track sliding window with clear glass and powder coated frame.',
    category: 'Aluminium',
    categoryId: 'cat-alum-win-slide',
    categoryPath: ['Aluminium Works', 'Aluminium Windows', 'Sliding Windows (2-Track / 3-Track)'],
    subCategory: 'Windows',
    productType: 'Product',
    status: 'Active',
    unit: 'sqft',
    width: 4,
    height: 4,
    rate: 1250,
    isPopular: true,
    technicalSpecification: {
      aluminiumGrade: '6063-T5',
      profileSystem: 'Standard 2-Track',
      surfaceFinish: 'Powder Coated',
      glazingType: 'Single Glazed',
      glassThickness: '5mm',
      warrantyProduct: '10 Years',
      countryOrigin: 'Sri Lanka'
    },
    rateHistory: [
      { id: 'rh1', date: '2023-01-01', rate: 1150, reason: 'Initial Price' },
      { id: 'rh2', date: '2024-01-01', rate: 1250, reason: 'Market Adjustment' }
    ]
  },
  {
    id: 't2',
    productCode: 'AL-WD-002',
    name: 'Aluminium Casement Window',
    description: 'High quality casement window with friction stays.',
    category: 'Aluminium',
    categoryId: 'cat-alum-win-case',
    categoryPath: ['Aluminium Works', 'Aluminium Windows', 'Casement Windows & Projected'],
    subCategory: 'Windows',
    productType: 'Product',
    status: 'Active',
    unit: 'sqft',
    width: 2,
    height: 4,
    rate: 1850,
    technicalSpecification: {
      aluminiumGrade: '6063-T5',
      profileSystem: 'Casement Series',
      surfaceFinish: 'Powder Coated',
      glazingType: 'Double Glazed',
      glassThickness: '6mm + 12Argon + 6mm',
      warrantyProduct: '10 Years'
    }
  },
  {
    id: 't3',
    productCode: 'ST-ST-001',
    name: 'Steel I-Beam Structure',
    description: 'Structural steel fabrication and installation.',
    category: 'Steel',
    categoryId: 'cat-steel-struct',
    categoryPath: ['Steel & Metal Works', 'Structural Framing (I-Beams)'],
    subCategory: 'Structures',
    productType: 'Product',
    status: 'Active',
    unit: 'kg',
    rate: 450,
    isPopular: true
  },
  {
    id: 't4',
    productCode: 'GL-PT-001',
    name: 'Tempered Glass Partition (12mm)',
    description: 'Frameless glass partition with patch fittings.',
    category: 'Glass',
    categoryId: 'cat-glass-part-12mm',
    categoryPath: ['Glass & Glazing', 'Frameless Glass Partitions', '12mm Acoustic Glass'],
    subCategory: 'Panels',
    productType: 'Product',
    status: 'Active',
    unit: 'sqft',
    width: 10,
    height: 8,
    rate: 2400,
    isPopular: true
  },
  {
    id: 'sv-001',
    productCode: 'SRV-MS-001',
    name: 'Site Measurement & Survey',
    description: 'Professional precision measurement at site location.',
    category: 'Services',
    categoryId: 'cat-serv-survey',
    categoryPath: ['Engineering & Site Services', 'Site Survey & Laser Measurement'],
    subCategory: 'Logistics',
    productType: 'Service',
    status: 'Active',
    unit: 'Visit',
    rate: 5000,
    serviceSpecification: {
      scope: 'Full project measurement and site survey',
      deliverables: ['Measurement Sheet', 'Site Photos', 'Rough Sketches'],
      typicalDuration: '1 Day'
    }
  }
];

// --- PORTAL 1: PROJECT LIFECYCLE & EXECUTION ---

export interface ProjectTask {
  id: string;
  projectId: string;
  phaseId: string;
  description: string;
  assignedTo?: string; // Personnel ID
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  startDate: string;
  dueDate: string;
  actualEndDate?: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Blocked';
  dependencies: string[]; // Task IDs
  estimatedHours: number;
  actualHours?: number;
  notes?: string;
  attachments?: string[];
}

export interface ProjectMilestone {
  id: string;
  projectId: string;
  phaseId: string;
  title: string;
  plannedDate: string;
  actualDate?: string;
  status: 'Not Started' | 'In Progress' | 'Completed' | 'Delayed' | 'Skipped';
  responsiblePerson?: string; // Personnel ID
  dependencies: string[]; // Milestone IDs
  notes?: string;
}

export interface ProjectPhase {
  id: string;
  projectId: string;
  title: string;
  order: number;
  status: 'Draft' | 'Not Started' | 'In Progress' | 'Completed' | 'On Hold';
  milestones: ProjectMilestone[];
  tasks: ProjectTask[];
  progress: number;
}

export interface SiteVisitLog {
  id: string;
  projectId: string;
  date: string;
  visitor: string;
  purpose: string;
  observations: string;
  photos: string[];
  actionItems: string[];
}

export interface CommunicationLogEntry {
  id: string;
  projectId: string;
  timestamp: string;
  type: 'Email' | 'Phone Call' | 'Meeting' | 'Site Visit' | 'Letter' | 'Message';
  participants: string[];
  subject: string;
  summary: string;
  decisions: string[];
  actionItems: { description: string; responsible: string; deadline?: string }[];
  attachments?: string[];
  followUpDate?: string;
}

export interface RiskRegisterEntry {
  id: string;
  projectId: string;
  description: string;
  likelihood: 'Rare' | 'Unlikely' | 'Possible' | 'Likely' | 'Almost Certain';
  impact: 'Negligible' | 'Minor' | 'Moderate' | 'Major' | 'Severe';
  score: number;
  mitigationPlan: string;
  contingencyPlan: string;
  owner: string;
  reviewDate: string;
  status: 'Active' | 'Mitigated' | 'Materialized' | 'Closed';
}

// --- PORTAL 2: PROCUREMENT & SUPPLIER MANAGEMENT ---

export interface Supplier {
  id: string;
  code: string;
  name: string;
  type: 'Material Supplier' | 'Service Provider' | 'Subcontractor' | 'Equipment Supplier';
  contactPerson: string;
  phone: string;
  email: string;
  categories: string[];
  status: 'Active' | 'Inactive' | 'Blacklisted' | 'Under Review';
  address: string;
  lastOrderDate?: string;
  totalSpendYTD: number;
  avgLeadTimeDays: number;
  performanceRating: number; // 1-5
  pricingAgreements?: { material: string; price: number; validUntil: string }[];
}

export interface PurchaseOrderItem {
  id: string;
  itemCode: string;
  description: string;
  supplierRef?: string;
  qty: number;
  unit: string;
  unitPrice: number;
  discountPercent: number;
  total: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  projectId?: string;
  requisitionId?: string;
  orderDate: string;
  expectedDeliveryDate: string;
  deliveryAddress: string;
  status: 'Draft' | 'Issued' | 'Acknowledged' | 'Partially Received' | 'Fully Received' | 'Invoiced' | 'Closed' | 'Cancelled';
  paymentTerms: string;
  items: PurchaseOrderItem[];
  subTotal: number;
  taxTotal: number;
  grandTotal: number;
  notes?: string;
}

export interface GoodsReceivedNote {
  id: string;
  grnNumber: string;
  poId: string;
  receiptDate: string;
  receivedBy: string;
  items: {
    itemId: string;
    qtyOrdered: number;
    qtyReceived: number;
    qtyAccepted: number;
    qtyRejected: number;
    rejectionReason?: string;
  }[];
  photos?: string[];
}

// --- PORTAL 3: QUALITY CONTROL & INSPECTION ---

export interface InspectionChecklist {
  id: string;
  name: string;
  category: 'Fabrication' | 'Installation' | 'Product-Specific';
  items: {
    id: string;
    description: string;
    criteria: string;
    tolerance?: string;
  }[];
}

export interface InspectionResult {
  id: string;
  checklistId: string;
  projectId: string;
  stage: string;
  inspector: string;
  date: string;
  overallStatus: 'Passed' | 'Passed with Observations' | 'Failed';
  itemResults: {
    itemId: string;
    status: 'Pass' | 'Fail' | 'NA';
    measurement?: string;
    defectDescription?: string;
    severity?: 'Minor' | 'Major' | 'Critical';
    photo?: string;
  }[];
}

export interface NonConformanceReport {
  id: string;
  ncrNumber: string;
  source: 'Inspection' | 'Customer Complaint' | 'Staff' | 'Supplier';
  projectId: string;
  description: string;
  severity: 'Minor' | 'Major' | 'Critical';
  photo?: string;
  rootCause?: string;
  correctiveAction?: string;
  preventiveAction?: string;
  status: 'Open' | 'Investigating' | 'Action Planned' | 'Resolved' | 'Closed';
  assignedTo: string;
  targetDate?: string;
}

export interface CustomerComplaint {
  id: string;
  complaintNumber: string;
  customerId: string;
  projectId: string;
  dateReceived: string;
  channel: string;
  description: string;
  severity: 'Low' | 'Medium' | 'High';
  status: 'Open' | 'In Resolution' | 'Accepted' | 'Closed';
  resolution?: string;
  lessonsLearned?: string;
}

// --- PORTAL 4: RESOURCE & WORKFORCE MANAGEMENT ---

export interface Personnel {
  id: string;
  employeeId: string;
  name: string;
  role: string;
  skillLevel: 'Trainee' | 'Junior' | 'Senior' | 'Lead' | 'Supervisor' | 'Master';
  department: string;
  contact: string;
  status: 'Available' | 'Assigned' | 'On Leave' | 'Sick' | 'Training';
  currentProjectId?: string;
  hourlyRate: number;
  skills: { skill: string; proficiency: number }[];
  certifications: { type: string; expiry: string; file?: string }[];
}

export interface TimeEntry {
  id: string;
  personnelId: string;
  projectId: string;
  date: string;
  hours: number;
  taskDescription: string;
  isOvertime: boolean;
  status: 'Pending' | 'Approved' | 'Rejected';
}

// --- PORTAL 5: EQUIPMENT & TOOLS MANAGEMENT ---

export interface Equipment {
  id: string;
  equipmentId: string;
  name: string;
  type: string;
  serialNumber: string;
  purchaseDate: string;
  location: string;
  status: 'Available' | 'In Use' | 'Maintenance' | 'Damaged' | 'Retired';
  assignedTo?: string; // Personnel or Project ID
  nextServiceDate?: string;
  calibrationDue?: string;
}

export interface MaintenanceRecord {
  id: string;
  equipmentId: string;
  date: string;
  type: 'Routine' | 'Preventive' | 'Breakdown' | 'Calibration';
  technician: string;
  workDone: string;
  cost: number;
  partsReplaced: string[];
}

// --- PORTAL 6: SITE MANAGEMENT & HSE ---

export interface IncidentReport {
  id: string;
  incidentNo: string;
  date: string;
  location: string;
  projectId: string;
  type: 'Near Miss' | 'Minor Injury' | 'Major Injury' | 'Property Damage' | 'Environmental' | 'Other';
  description: string;
  immediateActions: string;
  reportedBy: string;
  photos: string[];
  status: 'Open' | 'Investigating' | 'Closed';
}

export interface SitePermit {
  id: string;
  permitNo: string;
  type: string;
  issuedAt: string;
  expiresAt: string;
  projectId: string;
  status: 'Active' | 'Expired' | 'Pending';
  file?: string;
}

// --- PORTAL 7: WARRANTY & AFTER-SALES ---

export interface WarrantyCertificate {
  id: string;
  certificateNo: string; // with verification code
  projectId: string;
  customerName: string;
  productPvcCodes: string[];
  startDate: string;
  endDate: string;
  type: 'Product' | 'Finish' | 'Glass' | 'Workmanship';
  status: 'Active' | 'Expiring Soon' | 'Expired';
}

export interface AfterSalesServiceRequest {
  id: string;
  requestNo: string;
  date: string;
  projectId: string;
  pvcCode: string;
  description: string;
  urgency: 'Low' | 'Medium' | 'High';
  status: 'New' | 'Scheduled' | 'Completed' | 'Cancelled';
  technicianId?: string;
  visitDate?: string;
}

// --- PORTAL 8: PROJECT POST-EVALUATION & STANDARD COST MANAGEMENT ENGINE ---

export type ProjectActualCostCategory = 
  | 'MATERIAL' 
  | 'LABOUR' 
  | 'OVERHEAD' 
  | 'SUBCONTRACT' 
  | 'EQUIPMENT' 
  | 'OTHER';

export interface ProjectActualCostRecord {
  id: string;
  projectId: string;
  projectItemId?: string; // Links to offered BOQItem, or undefined if general/ad-hoc
  itemName?: string;
  costCategory: ProjectActualCostCategory;
  costType: string; // e.g. "Aluminium Extrusion", "Glazing Supply", "Fabrication Labour", "Site Installation", "Scaffolding"
  description: string;
  invoiceOrReceiptNo?: string;
  supplierOrPayee?: string;
  date: string;
  quantity: number;
  unit: string;
  unitRate: number;
  totalActualCost: number;
  standardReferenceCost?: number; // Standard budgeted rate at time of purchase
  notes?: string;
  recordedBy?: string;
  isAdHocCostItem?: boolean; // True if this was an unbudgeted item not in original BOM
  paymentStatus?: 'Pending' | 'Approved' | 'Paid';
}

export interface StandardCostVarianceBreakdown {
  // Direct Materials Variances
  standardMaterialCost: number;
  actualMaterialCost: number;
  materialCostVariance: number; // Standard - Actual (Positive = Favorable)
  materialPriceVariance: number; // (Std Price - Actual Price) * Actual Qty
  materialUsageVariance: number; // (Std Qty - Actual Qty) * Std Price

  // Direct Labour Variances
  standardLabourCost: number;
  actualLabourCost: number;
  labourCostVariance: number; // Standard - Actual (Positive = Favorable)
  labourRateVariance: number; // (Std Rate - Actual Rate) * Actual Hours
  labourEfficiencyVariance: number; // (Std Hours - Actual Hours) * Std Rate

  // Overhead Variances
  standardOverheadCost: number;
  actualOverheadCost: number;
  overheadCostVariance: number; // Standard - Actual
  overheadSpendingVariance: number; // Budgeted - Actual
  overheadVolumeVariance: number; // Absorbed - Budgeted

  // Other & Ad-hoc
  actualOtherCost: number;
  adHocUnbudgetedCost: number;

  // Net Variance
  totalStandardCost: number;
  totalActualCost: number;
  netTotalVariance: number; // Standard - Actual
  netVariancePercent: number; // (Standard - Actual) / Standard * 100
  isFavorable: boolean;
}

export interface ProjectPostEvaluationItem {
  id: string; // matches BOQItem id
  itemId: string;
  itemNo: string;
  name: string;
  description?: string;
  variantId?: string;
  variantCode?: string;
  category: string;
  unit: string;
  offeredQty: number;
  actualQty: number;
  offeredUnitRate: number;
  offeredTotalRevenue: number;
  
  // Standard Costs (Baseline from BOM / Contract Quoted Rate)
  standardUnitCost: number;
  standardTotalCost: number;
  standardMaterialCost: number;
  standardLabourCost: number;
  standardOverheadCost: number;
  standardGrossProfit: number;
  standardMarginPercent: number;

  // Current Market Standard Cost (if variant BOM in catalog was revised)
  currentMarketStandardUnitCost?: number;
  standardCostCreep?: number; // Current Market Std - Quoted Std

  // Actual Costs (Sum of recorded actual vouchers/entries)
  actualTotalCost: number;
  actualMaterialCost: number;
  actualLabourCost: number;
  actualOverheadCost: number;
  actualOtherCost: number;
  actualUnitCost: number;
  actualGrossProfit: number;
  actualMarginPercent: number;

  // Variances & Profitability
  marginVariancePercent: number; // Actual Margin % - Standard Margin %
  costVarianceAmount: number; // Standard Total Cost - Actual Total Cost (Positive = F)
  costVariancePercent: number;
  variances: StandardCostVarianceBreakdown;

  // Metadata & Links
  variationStatus?: 'Original' | 'Additional' | 'Omitted';
  isAdHocItem?: boolean;
  healthStatus: 'EXCELLENT' | 'ON_TRACK' | 'WARNING' | 'CRITICAL_OVERRUN';
  costRecordsCount: number;
}

export interface ProjectPostEvaluationSummary {
  projectId: string;
  projectName: string;
  clientName: string;
  projectStatus: string;
  totalItemsCount: number;
  totalOfferedRevenue: number;
  totalStandardCost: number;
  totalActualCost: number;
  netCostVariance: number; // Standard Cost - Actual Cost
  variancePercentage: number;
  isFavorable: boolean;
  
  // Profitability
  standardGrossProfit: number;
  standardMarginPercent: number;
  actualGrossProfit: number;
  actualMarginPercent: number;
  marginErosionPercent: number; // Actual Margin % - Standard Margin %
  
  // Category Breakdown Variances
  totalMaterialStandardCost: number;
  totalMaterialActualCost: number;
  materialVariance: number;
  totalLabourStandardCost: number;
  totalLabourActualCost: number;
  labourVariance: number;
  totalOverheadStandardCost: number;
  totalOverheadActualCost: number;
  overheadVariance: number;
  totalOtherActualCost: number;
  totalAdHocCosts: number;

  // Key Standard Costing Techniques
  materialPriceVariance: number;
  materialUsageVariance: number;
  labourRateVariance: number;
  labourEfficiencyVariance: number;
  overheadSpendingVariance: number;

  // Risk & Health
  costToOfferRatio: number; // Actual Cost / Offered Revenue
  breakEvenRevenue: number;
  evaluationHealth: 'HEALTHY' | 'MODERATE_RISK' | 'HIGH_OVERRUN';
}

