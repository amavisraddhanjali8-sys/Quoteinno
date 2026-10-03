export type NumberingDomain =
  | 'Commercial & Quotations'
  | 'Accounting & Finance'
  | 'Projects & Tasks'
  | 'Factory & Production'
  | 'Procurement & Inventory'
  | 'Quality, HSE & Warranty'
  | 'HR & Payroll'
  | 'Equipment & Document Control';

export type DateTokenFormat = 'NONE' | 'YYYY' | 'YY' | 'YYYYMM';

export interface NumberingSequenceConfig {
  key: string;
  label: string;
  domain: NumberingDomain;
  description: string;
  fieldUsedIn: string;
  prefix: string;
  dateToken: DateTokenFormat;
  separator: '-' | '/' | '_' | '';
  paddingDigits: number;
  nextNumber: number;
  suffix: string;
  resetPolicy: 'NEVER' | 'YEARLY' | 'MONTHLY';
  isActive: boolean;
  isCustom?: boolean;
}

const STORAGE_KEY = 'innovista_system_numbering_sequences_v1';

export const DEFAULT_NUMBERING_SEQUENCES: NumberingSequenceConfig[] = [
  // 1. Commercial & Quotations
  {
    key: 'quotation',
    label: 'Quotation Number',
    domain: 'Commercial & Quotations',
    description: 'Primary commercial quotation & BOQ tender document identifier',
    fieldUsedIn: 'Quote.quoteNo',
    prefix: 'QT',
    dateToken: 'YYYY',
    separator: '-',
    paddingDigits: 4,
    nextNumber: 1001,
    suffix: '',
    resetPolicy: 'YEARLY',
    isActive: true
  },
  {
    key: 'design_template',
    label: 'Design / Quote Template Code',
    domain: 'Commercial & Quotations',
    description: 'Standardized architectural design & quotation template code',
    fieldUsedIn: 'QuoteTemplate.designCode',
    prefix: 'DSN',
    dateToken: 'YYYY',
    separator: '-',
    paddingDigits: 3,
    nextNumber: 6,
    suffix: '',
    resetPolicy: 'NEVER',
    isActive: true
  },
  {
    key: 'customer',
    label: 'Customer / Client Account ID',
    domain: 'Commercial & Quotations',
    description: 'Unique customer master account & debtor ledger code',
    fieldUsedIn: 'Client.debtorAccountNo',
    prefix: 'CUS',
    dateToken: 'YYYY',
    separator: '-',
    paddingDigits: 4,
    nextNumber: 1015,
    suffix: '',
    resetPolicy: 'NEVER',
    isActive: true
  },
  {
    key: 'customer_cvc',
    label: 'Customer Verification Code (CVC)',
    domain: 'Commercial & Quotations',
    description: 'Client portal cryptographic verification prefix',
    fieldUsedIn: 'Client.cvcCode',
    prefix: 'CV',
    dateToken: 'YYYY',
    separator: '-',
    paddingDigits: 5,
    nextNumber: 50001,
    suffix: '',
    resetPolicy: 'NEVER',
    isActive: true
  },
  {
    key: 'boq_item',
    label: 'BOQ Catalog Item SKU Code',
    domain: 'Commercial & Quotations',
    description: 'Master BOQ item template & product catalog code',
    fieldUsedIn: 'ItemTemplate.productCode',
    prefix: 'ITM',
    dateToken: 'NONE',
    separator: '-',
    paddingDigits: 4,
    nextNumber: 1050,
    suffix: '',
    resetPolicy: 'NEVER',
    isActive: true
  },
  {
    key: 'product_variant',
    label: 'Product Variant Code',
    domain: 'Commercial & Quotations',
    description: 'Configured engineering variant SKU code',
    fieldUsedIn: 'ProductVariant.variantCode',
    prefix: 'VAR',
    dateToken: 'YYYY',
    separator: '-',
    paddingDigits: 4,
    nextNumber: 2001,
    suffix: '',
    resetPolicy: 'NEVER',
    isActive: true
  },
  {
    key: 'product_pvc',
    label: 'Product Verification Code (PVC)',
    domain: 'Commercial & Quotations',
    description: 'Authentic product QR/verification registry code',
    fieldUsedIn: 'BOQItem.pvcCode',
    prefix: 'PV',
    dateToken: 'YYYY',
    separator: '-',
    paddingDigits: 5,
    nextNumber: 30001,
    suffix: '',
    resetPolicy: 'NEVER',
    isActive: true
  },
  {
    key: 'customer_inquiry',
    label: 'Customer Inquiry / RFE Number',
    domain: 'Commercial & Quotations',
    description: 'Incoming client portal inquiry & estimation request ID',
    fieldUsedIn: 'Inquiry.id',
    prefix: 'INQ',
    dateToken: 'YYYY',
    separator: '-',
    paddingDigits: 4,
    nextNumber: 101,
    suffix: '',
    resetPolicy: 'YEARLY',
    isActive: true
  },

  // 2. Accounting & Finance
  {
    key: 'invoice',
    label: 'Tax / Progress Invoice Number',
    domain: 'Accounting & Finance',
    description: 'Commercial tax invoice, proforma, advance & progress billing number',
    fieldUsedIn: 'Invoice.invoiceNo',
    prefix: 'INV',
    dateToken: 'YYYY',
    separator: '-',
    paddingDigits: 4,
    nextNumber: 1001,
    suffix: '',
    resetPolicy: 'YEARLY',
    isActive: true
  },
  {
    key: 'payment_receipt',
    label: 'Payment Receipt Number',
    domain: 'Accounting & Finance',
    description: 'Customer payment collection & official receipt voucher number',
    fieldUsedIn: 'Payment.paymentNo',
    prefix: 'RCP',
    dateToken: 'YYYY',
    separator: '-',
    paddingDigits: 4,
    nextNumber: 1020,
    suffix: '',
    resetPolicy: 'YEARLY',
    isActive: true
  },
  {
    key: 'credit_adjustment',
    label: 'Credit Note / Adjustment Number',
    domain: 'Accounting & Finance',
    description: 'Credit note, retention release, write-off or financial adjustment ID',
    fieldUsedIn: 'Adjustment.adjustmentNo',
    prefix: 'CN',
    dateToken: 'YYYY',
    separator: '-',
    paddingDigits: 4,
    nextNumber: 1005,
    suffix: '',
    resetPolicy: 'YEARLY',
    isActive: true
  },
  {
    key: 'actual_cost_voucher',
    label: 'Project Actual Cost Voucher No',
    domain: 'Accounting & Finance',
    description: 'Post-evaluation actual material, labour & overhead cost voucher',
    fieldUsedIn: 'ProjectActualCostRecord.invoiceOrReceiptNo',
    prefix: 'ACV',
    dateToken: 'YYYY',
    separator: '-',
    paddingDigits: 4,
    nextNumber: 4010,
    suffix: '',
    resetPolicy: 'YEARLY',
    isActive: true
  },
  {
    key: 'petty_cash_voucher',
    label: 'Petty Cash Transaction Number',
    domain: 'Accounting & Finance',
    description: 'Site & workshop imprest petty cash expense voucher',
    fieldUsedIn: 'PettyCashTransaction.voucherNo',
    prefix: 'PCV',
    dateToken: 'YYYY',
    separator: '-',
    paddingDigits: 4,
    nextNumber: 310,
    suffix: '',
    resetPolicy: 'YEARLY',
    isActive: true
  },

  // 3. Projects & Tasks
  {
    key: 'project',
    label: 'Master Project Code',
    domain: 'Projects & Tasks',
    description: 'Unique enterprise project identifier across all portals',
    fieldUsedIn: 'Project.projectCode',
    prefix: 'PRJ',
    dateToken: 'YYYY',
    separator: '-',
    paddingDigits: 3,
    nextNumber: 105,
    suffix: '',
    resetPolicy: 'YEARLY',
    isActive: true
  },
  {
    key: 'contract',
    label: 'Contract Agreement Number',
    domain: 'Projects & Tasks',
    description: 'Signed client & subcontractor contract agreement reference',
    fieldUsedIn: 'ProjectContractSummary.contractNumber',
    prefix: 'CNT',
    dateToken: 'YYYY',
    separator: '-',
    paddingDigits: 3,
    nextNumber: 201,
    suffix: '',
    resetPolicy: 'YEARLY',
    isActive: true
  },
  {
    key: 'task',
    label: 'Task / Action Assignment Number',
    domain: 'Projects & Tasks',
    description: 'Operational task, project task & message-assigned task number',
    fieldUsedIn: 'OperationalTask.taskNumber / MessageTaskItem.id',
    prefix: 'TSK',
    dateToken: 'YYYY',
    separator: '-',
    paddingDigits: 4,
    nextNumber: 1045,
    suffix: '',
    resetPolicy: 'YEARLY',
    isActive: true
  },
  {
    key: 'instruction',
    label: 'Formal Site / Technical Instruction No',
    domain: 'Projects & Tasks',
    description: 'Formal engineering or management directive issued via System Inbox',
    fieldUsedIn: 'MessageTaskItem (Instruction)',
    prefix: 'INS',
    dateToken: 'YYYY',
    separator: '-',
    paddingDigits: 4,
    nextNumber: 2010,
    suffix: '',
    resetPolicy: 'YEARLY',
    isActive: true
  },
  {
    key: 'approval_request',
    label: 'Executive / Workflow Approval ID',
    domain: 'Projects & Tasks',
    description: 'Cross-portal sign-off & variation approval request reference',
    fieldUsedIn: 'MessageTaskItem (Approval)',
    prefix: 'APR',
    dateToken: 'YYYY',
    separator: '-',
    paddingDigits: 4,
    nextNumber: 3015,
    suffix: '',
    resetPolicy: 'YEARLY',
    isActive: true
  },
  {
    key: 'variation_order',
    label: 'Variation Order (VO) Number',
    domain: 'Projects & Tasks',
    description: 'Approved or pending BOQ scope variation order reference',
    fieldUsedIn: 'ProjectVariationRecord.variationNumber',
    prefix: 'VO',
    dateToken: 'YYYY',
    separator: '-',
    paddingDigits: 3,
    nextNumber: 18,
    suffix: '',
    resetPolicy: 'YEARLY',
    isActive: true
  },
  {
    key: 'project_issue',
    label: 'Project Issue / Snag Number',
    domain: 'Projects & Tasks',
    description: 'Site execution snag, risk or engineering issue tracker ID',
    fieldUsedIn: 'ProjectIssue.issueNumber',
    prefix: 'ISS',
    dateToken: 'YYYY',
    separator: '-',
    paddingDigits: 3,
    nextNumber: 42,
    suffix: '',
    resetPolicy: 'YEARLY',
    isActive: true
  },
  {
    key: 'site_visit_log',
    label: 'Site Survey / Visit Log Number',
    domain: 'Projects & Tasks',
    description: 'Laser measurement & field engineer site visit log ID',
    fieldUsedIn: 'SiteVisitLog.id',
    prefix: 'SVL',
    dateToken: 'YYYY',
    separator: '-',
    paddingDigits: 3,
    nextNumber: 88,
    suffix: '',
    resetPolicy: 'YEARLY',
    isActive: true
  },

  // 4. Factory & Production
  {
    key: 'factory_code',
    label: 'Factory / Workshop Facility Code',
    domain: 'Factory & Production',
    description: 'Master fabrication plant, glazing hub or partner workshop code',
    fieldUsedIn: 'FactoryMasterProfile.factoryCode',
    prefix: 'FAC-INV',
    dateToken: 'NONE',
    separator: '-',
    paddingDigits: 2,
    nextNumber: 6,
    suffix: '',
    resetPolicy: 'NEVER',
    isActive: true
  },
  {
    key: 'work_package',
    label: 'Factory Work Package (FWP) Code',
    domain: 'Factory & Production',
    description: 'Project-to-factory allocated manufacturing work package number',
    fieldUsedIn: 'FactoryWorkPackageAssignment.packageCode',
    prefix: 'FWP',
    dateToken: 'YYYY',
    separator: '-',
    paddingDigits: 3,
    nextNumber: 112,
    suffix: '',
    resetPolicy: 'YEARLY',
    isActive: true
  },
  {
    key: 'work_order',
    label: 'Fabrication Work Order (WO) Number',
    domain: 'Factory & Production',
    description: 'Shop-floor fabrication work order identifier',
    fieldUsedIn: 'FactoryExecutionTask.taskCode (Work Order)',
    prefix: 'WO',
    dateToken: 'YYYY',
    separator: '-',
    paddingDigits: 4,
    nextNumber: 1108,
    suffix: '',
    resetPolicy: 'YEARLY',
    isActive: true
  },
  {
    key: 'job_card',
    label: 'Shop-Floor Job Card (JC) Number',
    domain: 'Factory & Production',
    description: 'Workstation & machine operator job card number',
    fieldUsedIn: 'FactoryExecutionTask.taskCode (Job Card)',
    prefix: 'JC',
    dateToken: 'YYYY',
    separator: '-',
    paddingDigits: 4,
    nextNumber: 420,
    suffix: '',
    resetPolicy: 'YEARLY',
    isActive: true
  },
  {
    key: 'production_order',
    label: 'Production Batch Order Number',
    domain: 'Factory & Production',
    description: 'Batch curtain wall, DGU or powder coating production order code',
    fieldUsedIn: 'FactoryExecutionTask.taskCode (Production Order)',
    prefix: 'PRD',
    dateToken: 'YYYY',
    separator: '-',
    paddingDigits: 4,
    nextNumber: 305,
    suffix: '',
    resetPolicy: 'YEARLY',
    isActive: true
  },
  {
    key: 'cutting_list',
    label: 'Profile & Glass Cutting List No',
    domain: 'Factory & Production',
    description: 'CNC extrusion bar & glass sheet optimization cutting list ID',
    fieldUsedIn: 'FactoryExecutionTask.taskCode (Cutting List)',
    prefix: 'CUT',
    dateToken: 'YYYY',
    separator: '-',
    paddingDigits: 4,
    nextNumber: 215,
    suffix: '',
    resetPolicy: 'YEARLY',
    isActive: true
  },
  {
    key: 'digital_worksheet',
    label: 'Digital Shop-Floor Worksheet No',
    domain: 'Factory & Production',
    description: 'Shift production, welding & dimensional measurement log number',
    fieldUsedIn: 'DigitalWorksheetRecord.worksheetNo',
    prefix: 'DWS',
    dateToken: 'YYYY',
    separator: '-',
    paddingDigits: 4,
    nextNumber: 95,
    suffix: '',
    resetPolicy: 'YEARLY',
    isActive: true
  },
  {
    key: 'daily_factory_report',
    label: 'Daily Factory Activity Report (DFAR)',
    domain: 'Factory & Production',
    description: 'Daily shift output, manpower & delay log report number',
    fieldUsedIn: 'DailyFactoryActivityReport.reportNo',
    prefix: 'DFAR',
    dateToken: 'YYYY',
    separator: '-',
    paddingDigits: 4,
    nextNumber: 1030,
    suffix: '',
    resetPolicy: 'YEARLY',
    isActive: true
  },
  {
    key: 'dispatch_note',
    label: 'Factory Dispatch & Gate Pass No',
    domain: 'Factory & Production',
    description: 'Finished goods crating & site dispatch manifest number',
    fieldUsedIn: 'FactoryDispatchAndSiteRecord.dispatchNo',
    prefix: 'DSP',
    dateToken: 'YYYY',
    separator: '-',
    paddingDigits: 3,
    nextNumber: 92,
    suffix: '',
    resetPolicy: 'YEARLY',
    isActive: true
  },
  {
    key: 'delivery_note',
    label: 'Site Delivery Note (DN) Number',
    domain: 'Factory & Production',
    description: 'Site material & facade panel delivery note reference',
    fieldUsedIn: 'FactoryDispatchAndSiteRecord.deliveryNoteNo',
    prefix: 'DN',
    dateToken: 'YYYY',
    separator: '-',
    paddingDigits: 3,
    nextNumber: 92,
    suffix: '',
    resetPolicy: 'YEARLY',
    isActive: true
  },
  {
    key: 'packing_list',
    label: 'Crate & Stillage Packing List No',
    domain: 'Factory & Production',
    description: 'QR-coded pallet & glass A-frame packing list number',
    fieldUsedIn: 'FactoryDispatchAndSiteRecord.packingListNo',
    prefix: 'PKL',
    dateToken: 'YYYY',
    separator: '-',
    paddingDigits: 3,
    nextNumber: 92,
    suffix: '',
    resetPolicy: 'YEARLY',
    isActive: true
  },

  // 5. Procurement & Inventory
  {
    key: 'supplier_vendor',
    label: 'Supplier / Vendor Master Code',
    domain: 'Procurement & Inventory',
    description: 'Approved material vendor & subcontractor registration code',
    fieldUsedIn: 'Supplier.vendorCode',
    prefix: 'VND',
    dateToken: 'NONE',
    separator: '-',
    paddingDigits: 3,
    nextNumber: 108,
    suffix: '',
    resetPolicy: 'NEVER',
    isActive: true
  },
  {
    key: 'purchase_requisition',
    label: 'Material Purchase Requisition (PR) No',
    domain: 'Procurement & Inventory',
    description: 'Internal project or store material requisition number',
    fieldUsedIn: 'PurchaseRequisition.requisitionNumber',
    prefix: 'PR',
    dateToken: 'YYYY',
    separator: '-',
    paddingDigits: 4,
    nextNumber: 410,
    suffix: '',
    resetPolicy: 'YEARLY',
    isActive: true
  },
  {
    key: 'rfq',
    label: 'Request for Quotation (RFQ) Number',
    domain: 'Procurement & Inventory',
    description: 'Supplier tender & bid invitation reference number',
    fieldUsedIn: 'RequestForQuotation.rfqNumber',
    prefix: 'RFQ',
    dateToken: 'YYYY',
    separator: '-',
    paddingDigits: 4,
    nextNumber: 215,
    suffix: '',
    resetPolicy: 'YEARLY',
    isActive: true
  },
  {
    key: 'purchase_order',
    label: 'Purchase Order (PO) Number',
    domain: 'Procurement & Inventory',
    description: 'Official supplier purchase order contract number',
    fieldUsedIn: 'PurchaseOrder.poNumber',
    prefix: 'PO',
    dateToken: 'YYYY',
    separator: '-',
    paddingDigits: 4,
    nextNumber: 895,
    suffix: '',
    resetPolicy: 'YEARLY',
    isActive: true
  },
  {
    key: 'grn',
    label: 'Goods Receipt Note (GRN) Number',
    domain: 'Procurement & Inventory',
    description: 'Store receiving & mill certificate verification note number',
    fieldUsedIn: 'GoodsReceiptNote.grnNumber',
    prefix: 'GRN',
    dateToken: 'YYYY',
    separator: '-',
    paddingDigits: 4,
    nextNumber: 540,
    suffix: '',
    resetPolicy: 'YEARLY',
    isActive: true
  },
  {
    key: 'service_completion',
    label: 'Service Completion Note (SCN) No',
    domain: 'Procurement & Inventory',
    description: 'Subcontractor work measurement & completion certificate ID',
    fieldUsedIn: 'ServiceCompletionNote.scnNumber',
    prefix: 'SCN',
    dateToken: 'YYYY',
    separator: '-',
    paddingDigits: 3,
    nextNumber: 65,
    suffix: '',
    resetPolicy: 'YEARLY',
    isActive: true
  },
  {
    key: 'reverse_auction',
    label: 'Live Reverse Auction Number',
    domain: 'Procurement & Inventory',
    description: 'Competitive vendor bidding auction reference',
    fieldUsedIn: 'ReverseAuction.auctionNumber',
    prefix: 'AUC',
    dateToken: 'YYYY',
    separator: '-',
    paddingDigits: 3,
    nextNumber: 19,
    suffix: '',
    resetPolicy: 'YEARLY',
    isActive: true
  },

  // 6. Quality, HSE & Warranty
  {
    key: 'itp_plan',
    label: 'Inspection & Test Plan (ITP) Code',
    domain: 'Quality, HSE & Warranty',
    description: 'Project quality hold-point & inspection test plan reference',
    fieldUsedIn: 'QualityInspectionPlan.planNumber',
    prefix: 'ITP',
    dateToken: 'YYYY',
    separator: '-',
    paddingDigits: 3,
    nextNumber: 25,
    suffix: '',
    resetPolicy: 'NEVER',
    isActive: true
  },
  {
    key: 'factory_inspection',
    label: 'Quality Inspection Request (FIR/WIR)',
    domain: 'Quality, HSE & Warranty',
    description: 'Factory Acceptance Test (FAT) & Site Work Inspection Request ID',
    fieldUsedIn: 'FactoryQualityInspectionRecord.inspectionNo',
    prefix: 'FIR',
    dateToken: 'YYYY',
    separator: '-',
    paddingDigits: 3,
    nextNumber: 312,
    suffix: '',
    resetPolicy: 'YEARLY',
    isActive: true
  },
  {
    key: 'iqc_inspection',
    label: 'Incoming Material QC (IQC) Code',
    domain: 'Quality, HSE & Warranty',
    description: 'Raw profile, glass & silicone incoming quality check ID',
    fieldUsedIn: 'IqcMaterialRecord.iqcCode',
    prefix: 'IQC',
    dateToken: 'YYYY',
    separator: '-',
    paddingDigits: 3,
    nextNumber: 110,
    suffix: '',
    resetPolicy: 'YEARLY',
    isActive: true
  },
  {
    key: 'lab_test',
    label: 'Quality Lab / Field Test Code',
    domain: 'Quality, HSE & Warranty',
    description: 'DFT coating micron, water hose & adhesion test report number',
    fieldUsedIn: 'QualityLabTestRecord.testCode',
    prefix: 'LAB',
    dateToken: 'YYYY',
    separator: '-',
    paddingDigits: 3,
    nextNumber: 210,
    suffix: '',
    resetPolicy: 'YEARLY',
    isActive: true
  },
  {
    key: 'ncr',
    label: 'Non-Conformance Report (NCR) No',
    domain: 'Quality, HSE & Warranty',
    description: 'Quality defect, rejection & CAPA corrective action report ID',
    fieldUsedIn: 'NonConformanceReport.ncrNumber',
    prefix: 'NCR',
    dateToken: 'YYYY',
    separator: '-',
    paddingDigits: 4,
    nextNumber: 48,
    suffix: '',
    resetPolicy: 'YEARLY',
    isActive: true
  },
  {
    key: 'warranty_certificate',
    label: 'Warranty Certificate Number',
    domain: 'Quality, HSE & Warranty',
    description: 'Official structural, powder-coating & glazing warranty certificate No',
    fieldUsedIn: 'WarrantyCertificate.certificateNo',
    prefix: 'WRN',
    dateToken: 'YYYY',
    separator: '-',
    paddingDigits: 4,
    nextNumber: 501,
    suffix: '',
    resetPolicy: 'YEARLY',
    isActive: true
  },
  {
    key: 'after_sales_request',
    label: 'After-Sales Service Request No',
    domain: 'Quality, HSE & Warranty',
    description: 'Post-handover maintenance & defect rectification ticket number',
    fieldUsedIn: 'AfterSalesServiceRequest.requestNo',
    prefix: 'ASR',
    dateToken: 'YYYY',
    separator: '-',
    paddingDigits: 4,
    nextNumber: 120,
    suffix: '',
    resetPolicy: 'YEARLY',
    isActive: true
  },
  {
    key: 'hse_incident',
    label: 'HSE Safety Incident Report No',
    domain: 'Quality, HSE & Warranty',
    description: 'Near-miss, injury or environmental safety incident report code',
    fieldUsedIn: 'IncidentReport.incidentNo',
    prefix: 'INC',
    dateToken: 'YYYY',
    separator: '-',
    paddingDigits: 3,
    nextNumber: 15,
    suffix: '',
    resetPolicy: 'YEARLY',
    isActive: true
  },
  {
    key: 'hse_permit',
    label: 'Permit to Work (PTW) Number',
    domain: 'Quality, HSE & Warranty',
    description: 'Working at height, hot-work & crane hoisting safety permit ID',
    fieldUsedIn: 'SitePermit.permitNo',
    prefix: 'WPT',
    dateToken: 'YYYY',
    separator: '-',
    paddingDigits: 3,
    nextNumber: 89,
    suffix: '',
    resetPolicy: 'YEARLY',
    isActive: true
  },
  {
    key: 'hse_jsa',
    label: 'Job Safety Analysis (JSA) Code',
    domain: 'Quality, HSE & Warranty',
    description: 'Method risk assessment & hazard control register ID',
    fieldUsedIn: 'HseRiskJsaRecord.jsaCode',
    prefix: 'JSA',
    dateToken: 'YYYY',
    separator: '-',
    paddingDigits: 3,
    nextNumber: 22,
    suffix: '',
    resetPolicy: 'YEARLY',
    isActive: true
  },

  // 7. HR & Payroll
  {
    key: 'employee',
    label: 'Employee Master ID Code',
    domain: 'HR & Payroll',
    description: 'Permanent, contract & shop-floor personnel badge/employee ID',
    fieldUsedIn: 'HREmployeeMaster.employeeCode / Personnel.employeeId',
    prefix: 'EMP',
    dateToken: 'NONE',
    separator: '-',
    paddingDigits: 4,
    nextNumber: 1125,
    suffix: '',
    resetPolicy: 'NEVER',
    isActive: true
  },
  {
    key: 'recruitment_vacancy',
    label: 'Hiring Requisition / Vacancy No',
    domain: 'HR & Payroll',
    description: 'Approved manpower requisition & ATS job opening code',
    fieldUsedIn: 'HRVacancy.requisitionNumber',
    prefix: 'REC',
    dateToken: 'YYYY',
    separator: '-',
    paddingDigits: 3,
    nextNumber: 34,
    suffix: '',
    resetPolicy: 'YEARLY',
    isActive: true
  },
  {
    key: 'payroll_cycle',
    label: 'Payroll Run Cycle Reference',
    domain: 'HR & Payroll',
    description: 'Monthly salary & WPS disbursement batch reference number',
    fieldUsedIn: 'PayrollPeriodRecord.cycleNumber',
    prefix: 'PAY',
    dateToken: 'YYYYMM',
    separator: '-',
    paddingDigits: 2,
    nextNumber: 1,
    suffix: '',
    resetPolicy: 'MONTHLY',
    isActive: true
  },
  {
    key: 'quick_payout',
    label: 'Salary Advance / Quick Payout Voucher',
    domain: 'HR & Payroll',
    description: 'Site per-diem, overtime cash or emergency loan voucher number',
    fieldUsedIn: 'QuickPayoutRecord.voucherNumber',
    prefix: 'QPV',
    dateToken: 'YYYY',
    separator: '-',
    paddingDigits: 4,
    nextNumber: 208,
    suffix: '',
    resetPolicy: 'YEARLY',
    isActive: true
  },

  // 8. Equipment & Document Control
  {
    key: 'equipment_asset',
    label: 'Equipment & Plant Asset Tag ID',
    domain: 'Equipment & Document Control',
    description: 'CNC machinery, crane, vehicle & power tool asset tag code',
    fieldUsedIn: 'EquipmentMasterAsset.equipmentId',
    prefix: 'EQP',
    dateToken: 'NONE',
    separator: '-',
    paddingDigits: 4,
    nextNumber: 2045,
    suffix: '',
    resetPolicy: 'NEVER',
    isActive: true
  },
  {
    key: 'maintenance_wo',
    label: 'Equipment Maintenance Work Order',
    domain: 'Equipment & Document Control',
    description: 'Preventive service, calibration & breakdown repair order ID',
    fieldUsedIn: 'MaintenanceWorkOrder.workOrderNo',
    prefix: 'MWO',
    dateToken: 'YYYY',
    separator: '-',
    paddingDigits: 4,
    nextNumber: 318,
    suffix: '',
    resetPolicy: 'YEARLY',
    isActive: true
  },
  {
    key: 'controlled_drawing',
    label: 'Controlled Technical Drawing / Doc No',
    domain: 'Equipment & Document Control',
    description: 'AFC shop drawing, structural calculation & method statement code',
    fieldUsedIn: 'ControlledTechnicalDocument.docNumber',
    prefix: 'DRW-CW',
    dateToken: 'YYYY',
    separator: '-',
    paddingDigits: 3,
    nextNumber: 115,
    suffix: '',
    resetPolicy: 'YEARLY',
    isActive: true
  },
  {
    key: 'media_evidence',
    label: 'Photographic / Media Evidence Code',
    domain: 'Equipment & Document Control',
    description: 'Timestamped QA/QC & site progress photo/video dossier ID',
    fieldUsedIn: 'MediaEvidenceRecord.evidenceCode',
    prefix: 'EVD',
    dateToken: 'YYYY',
    separator: '-',
    paddingDigits: 4,
    nextNumber: 515,
    suffix: '',
    resetPolicy: 'YEARLY',
    isActive: true
  },
  {
    key: 'system_svc',
    label: 'System Document Verification Code (SVC)',
    domain: 'Equipment & Document Control',
    description: 'QR cryptographic authenticity code printed on official PDFs',
    fieldUsedIn: 'VerificationRegistryEntry.svcCode',
    prefix: 'SV',
    dateToken: 'YYYY',
    separator: '-',
    paddingDigits: 5,
    nextNumber: 80001,
    suffix: '',
    resetPolicy: 'NEVER',
    isActive: true
  },
  {
    key: 'admin_news_bulletin',
    label: 'Official News / Executive Bulletin No',
    domain: 'Equipment & Document Control',
    description: 'Company-wide announcement & policy circular reference number',
    fieldUsedIn: 'AdminNewsItem.id',
    prefix: 'NWS',
    dateToken: 'YYYY',
    separator: '-',
    paddingDigits: 3,
    nextNumber: 105,
    suffix: '',
    resetPolicy: 'YEARLY',
    isActive: true
  },
  {
    key: 'email_template',
    label: 'Email Template Code',
    domain: 'Equipment & Document Control',
    description: 'Central Gmail & system notification template identifier',
    fieldUsedIn: 'EmailTemplate.templateCode',
    prefix: 'ETPL',
    dateToken: 'YYYY',
    separator: '-',
    paddingDigits: 3,
    nextNumber: 131,
    suffix: '',
    resetPolicy: 'NEVER',
    isActive: true
  },
  {
    key: 'email_dispatch_trace',
    label: 'Email Dispatch & Trace ID',
    domain: 'Equipment & Document Control',
    description: 'End-to-end Gmail & notification delivery audit trace code',
    fieldUsedIn: 'EmailDeliveryLog.traceCode',
    prefix: 'EML',
    dateToken: 'YYYY',
    separator: '-',
    paddingDigits: 5,
    nextNumber: 10012,
    suffix: '',
    resetPolicy: 'YEARLY',
    isActive: true
  }
];

class NumberingService {
  private sequences: NumberingSequenceConfig[] = [];

  constructor() {
    this.load();
  }

  private load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: NumberingSequenceConfig[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const map = new Map<string, NumberingSequenceConfig>();
          DEFAULT_NUMBERING_SEQUENCES.forEach(def => map.set(def.key, { ...def }));
          parsed.forEach(item => {
            if (item && item.key) {
              const existing = map.get(item.key);
              map.set(item.key, existing ? { ...existing, ...item } : item);
            }
          });
          this.sequences = Array.from(map.values());
          return;
        }
      }
    } catch (e) {
      console.error('Failed to load numbering sequences:', e);
    }
    this.sequences = DEFAULT_NUMBERING_SEQUENCES.map(s => ({ ...s }));
    this.persist();
  }

  private persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.sequences));
    } catch (e) {
      console.error('Failed to save numbering sequences:', e);
    }
  }

  public getAllSequences(): NumberingSequenceConfig[] {
    return [...this.sequences];
  }

  public getSequence(key: string): NumberingSequenceConfig | undefined {
    return this.sequences.find(s => s.key === key);
  }

  public formatNumber(config: NumberingSequenceConfig, overrideNum?: number): string {
    const now = new Date();
    const yearFull = String(now.getFullYear());
    const yearShort = yearFull.slice(-2);
    const month = String(now.getMonth() + 1).padStart(2, '0');

    let datePart = '';
    if (config.dateToken === 'YYYY') datePart = yearFull;
    else if (config.dateToken === 'YY') datePart = yearShort;
    else if (config.dateToken === 'YYYYMM') datePart = `${yearFull}${month}`;

    const numVal = overrideNum !== undefined ? overrideNum : config.nextNumber;
    const paddedNum = String(Math.max(1, numVal)).padStart(Math.max(1, config.paddingDigits || 4), '0');
    const sep = config.separator ?? '-';

    const cleanPrefix = (config.prefix || '').replace(/[-/_]+$/, '');
    const parts = [cleanPrefix];
    if (datePart) parts.push(datePart);
    parts.push(paddedNum);

    const core = parts.filter(Boolean).join(sep);
    return `${core}${config.suffix || ''}`;
  }

  public getLegacyPrefixString(key: string): string {
    const seq = this.getSequence(key);
    if (!seq) return '';
    const now = new Date();
    const yearFull = String(now.getFullYear());
    const yearShort = yearFull.slice(-2);
    const month = String(now.getMonth() + 1).padStart(2, '0');

    let datePart = '';
    if (seq.dateToken === 'YYYY') datePart = yearFull;
    else if (seq.dateToken === 'YY') datePart = yearShort;
    else if (seq.dateToken === 'YYYYMM') datePart = `${yearFull}${month}`;

    const sep = seq.separator ?? '-';
    const cleanPrefix = (seq.prefix || '').replace(/[-/_]+$/, '');
    const parts = [cleanPrefix];
    if (datePart) parts.push(datePart);
    return parts.filter(Boolean).join(sep) + sep;
  }

  public peekNextNumber(key: string): string {
    const seq = this.getSequence(key);
    if (!seq) {
      return `${key.toUpperCase()}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    }
    return this.formatNumber(seq);
  }

  public consumeNextNumber(key: string): string {
    const idx = this.sequences.findIndex(s => s.key === key);
    if (idx < 0) {
      return `${key.toUpperCase()}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    }
    const seq = this.sequences[idx];
    const formatted = this.formatNumber(seq);
    this.sequences[idx] = {
      ...seq,
      nextNumber: (seq.nextNumber || 1) + 1
    };
    this.persist();
    return formatted;
  }

  public updateSequence(key: string, patch: Partial<NumberingSequenceConfig>): NumberingSequenceConfig[] {
    this.sequences = this.sequences.map(s => (s.key === key ? { ...s, ...patch } : s));
    this.persist();
    return [...this.sequences];
  }

  public saveAllSequences(nextSequences: NumberingSequenceConfig[]): NumberingSequenceConfig[] {
    this.sequences = nextSequences.map(s => ({ ...s }));
    this.persist();
    return [...this.sequences];
  }

  public addCustomSequence(config: Omit<NumberingSequenceConfig, 'isCustom'>): NumberingSequenceConfig[] {
    const exists = this.sequences.some(s => s.key === config.key);
    const finalKey = exists ? `${config.key}_${Date.now().toString().slice(-3)}` : config.key;
    const newSeq: NumberingSequenceConfig = {
      ...config,
      key: finalKey,
      isCustom: true
    };
    this.sequences = [newSeq, ...this.sequences];
    this.persist();
    return [...this.sequences];
  }

  public deleteCustomSequence(key: string): NumberingSequenceConfig[] {
    this.sequences = this.sequences.filter(s => !(s.key === key && s.isCustom));
    this.persist();
    return [...this.sequences];
  }

  public syncFromCompanySettings(settings: {
    quoteNumberPrefix?: string;
    nextQuoteNumber?: number;
    invoiceNumberPrefix?: string;
    nextInvoiceNumber?: number;
    numberingSequences?: NumberingSequenceConfig[];
  }) {
    if (settings.numberingSequences && Array.isArray(settings.numberingSequences) && settings.numberingSequences.length > 0) {
      this.saveAllSequences(settings.numberingSequences);
      return;
    }
    let changed = false;
    this.sequences = this.sequences.map(seq => {
      if (seq.key === 'quotation' && settings.nextQuoteNumber !== undefined) {
        changed = true;
        return {
          ...seq,
          nextNumber: settings.nextQuoteNumber
        };
      }
      if (seq.key === 'invoice' && settings.nextInvoiceNumber !== undefined) {
        changed = true;
        return {
          ...seq,
          nextNumber: settings.nextInvoiceNumber
        };
      }
      return seq;
    });
    if (changed) this.persist();
  }

  public resetToDefaults(): NumberingSequenceConfig[] {
    this.sequences = DEFAULT_NUMBERING_SEQUENCES.map(s => ({ ...s }));
    this.persist();
    return [...this.sequences];
  }
}

export const numberingService = new NumberingService();
