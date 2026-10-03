export interface ChartOfAccountRecord {
  id: string;
  code: string;
  name: string;
  group:
    | 'Assets'
    | 'Liabilities'
    | 'Equity'
    | 'Construction Revenue'
    | 'Direct Project Costs'
    | 'Indirect & Admin'
    | 'Tax & Statutory';
  dimensionRule: string;
  currency: 'LKR' | 'USD';
  balance: number;
  status: 'Active' | 'Locked';
}

export interface GlJournalRecord {
  id: string;
  journalNo: string;
  date: string;
  journalType: 'Standard' | 'Accrual' | 'Prepayment' | 'Depreciation' | 'Payroll Post' | 'Reversal';
  reference: string;
  description: string;
  debitAccount: string;
  creditAccount: string;
  projectId: string;
  workPackage: string;
  costCentre: string;
  branch: string;
  debitAmount: number;
  creditAmount: number;
  preparedBy: string;
  approvedBy: string;
  status: 'Posted' | 'Pending Approval' | 'Reversed';
}

export interface AccountsPayableRecord {
  id: string;
  billNo: string;
  supplierName: string;
  projectId: string;
  workPackage: string;
  poRef: string;
  grnRef: string;
  threeWayStatus: '3-Way Matched' | 'Price Variance' | 'GRN Pending';
  grossAmount: number;
  taxAmount: number;
  retentionHeld: number;
  advanceRecovered: number;
  netPayable: number;
  dueDate: string;
  status: 'Approved' | 'Paid' | 'Hold (Mismatch)';
}

export interface BankReconcileRecord {
  id: string;
  bankAccount: string;
  currency: 'LKR' | 'USD';
  statementDate: string;
  statementRef: string;
  counterparty: string;
  description: string;
  amount: number;
  type: 'Deposit' | 'Withdrawal' | 'Bank Charge' | 'Transfer';
  glMatchRef: string;
  matchStatus: 'Matched' | 'Unmatched' | 'Timing Diff';
}

export interface PettyCashRecord {
  id: string;
  voucherNo: string;
  date: string;
  branchSite: string;
  projectId: string;
  category: 'Fuel' | 'Site Expense' | 'Transport' | 'Meals' | 'Office';
  description: string;
  custodian: string;
  amount: number;
  physicalCountVerified: boolean;
  status: 'Approved & Posted' | 'Pending Count';
}

export interface ProjectCommitmentWipRecord {
  id: string;
  projectId: string;
  projectName: string;
  workPackage: 'Aluminium' | 'Glass & Glazing' | 'Structural Steel' | 'Installation & Site';
  originalBudget: number;
  approvedVariations: number;
  revisedBudget: number;
  poCommitted: number;
  actualCost: number;
  costToComplete: number;
  forecastFinalCost: number;
  certifiedRevenue: number;
  billedRevenue: number;
  unbilledWip: number;
  status: 'Healthy' | 'Watch' | 'Overrun Alert';
}

export interface FixedAssetAccountingRecord {
  id: string;
  assetCode: string;
  equipmentRef: string;
  assetName: string;
  category: 'CNC Machinery' | 'Lifting & Cranes' | 'Site Vehicles' | 'Testing Gear';
  acquisitionDate: string;
  cost: number;
  usefulLifeYears: number;
  method: 'Straight-Line (SLM)' | 'Reducing Balance';
  monthlyDeprec: number;
  accumulatedDeprec: number;
  carryingValue: number;
  assignedProject: string;
  status: 'Depreciating' | 'Fully Depreciated';
}

export interface TaxStatutoryRecord {
  id: string;
  taxCode: string;
  period: string;
  taxType: 'Output VAT (18%)' | 'Input VAT Claim' | 'SSCL (2.5%)' | 'Subcontractor WHT (5%)' | 'EPF / ETF Statutory';
  taxableBase: number;
  taxAmount: number;
  dueDate: string;
  certificateRef: string;
  status: 'Filed & Paid' | 'Accrued / Due';
}

export interface PeriodCloseStepRecord {
  id: string;
  stepNo: number;
  period: string;
  controlArea: string;
  linkedModule: string;
  verificationNote: string;
  owner: string;
  status: 'Completed & Locked' | 'Open Review';
}

const STORAGE_KEYS = {
  COA: 'acc_coa_v1',
  JOURNALS: 'acc_gl_journals_v1',
  AP: 'acc_ap_3way_v1',
  BANK: 'acc_bank_rec_v1',
  PETTY: 'acc_petty_cash_v1',
  WIP: 'acc_project_wip_v1',
  ASSETS: 'acc_fixed_assets_v1',
  TAX: 'acc_tax_statutory_v1',
  CLOSE: 'acc_period_close_v1'
};

const SEED_COA: ChartOfAccountRecord[] = [
  { id: 'coa-1', code: '1010', name: 'Commercial Bank - Corporate LKR A/C', group: 'Assets', dimensionRule: 'Branch + Currency', currency: 'LKR', balance: 18450000, status: 'Active' },
  { id: 'coa-2', code: '1020', name: 'HSBC Foreign Currency USD A/C', group: 'Assets', dimensionRule: 'Branch + FX Rate', currency: 'USD', balance: 42500, status: 'Active' },
  { id: 'coa-3', code: '1100', name: 'Accounts Receivable - Progress Claims', group: 'Assets', dimensionRule: 'Customer + Project', currency: 'LKR', balance: 24800000, status: 'Active' },
  { id: 'coa-4', code: '1150', name: 'Contract Retention Receivable (5% - 10%)', group: 'Assets', dimensionRule: 'Customer + Project', currency: 'LKR', balance: 4650000, status: 'Active' },
  { id: 'coa-5', code: '1300', name: 'Construction Work-in-Progress (Unbilled WIP)', group: 'Assets', dimensionRule: 'Project + Work Package', currency: 'LKR', balance: 6120000, status: 'Active' },
  { id: 'coa-6', code: '2010', name: 'Accounts Payable - Material & Subcontractors', group: 'Liabilities', dimensionRule: 'Supplier + PO + Project', currency: 'LKR', balance: 11340000, status: 'Active' },
  { id: 'coa-7', code: '2150', name: 'Customer Mobilization Advances (Unearned)', group: 'Liabilities', dimensionRule: 'Customer + Project', currency: 'LKR', balance: 7500000, status: 'Active' },
  { id: 'coa-8', code: '4010', name: 'Architectural Aluminium & Curtain Wall Revenue', group: 'Construction Revenue', dimensionRule: 'Project + Work Package', currency: 'LKR', balance: 68500000, status: 'Active' },
  { id: 'coa-9', code: '5010', name: 'Direct Project Materials (Profiles, Glass, Sealant)', group: 'Direct Project Costs', dimensionRule: 'Project + Work Package + Supplier', currency: 'LKR', balance: 34200000, status: 'Active' },
  { id: 'coa-10', code: '5020', name: 'Direct Fabrication & Site Glazing Labour', group: 'Direct Project Costs', dimensionRule: 'Project + Cost Centre + Employee', currency: 'LKR', balance: 9850000, status: 'Active' }
];

const SEED_JOURNALS: GlJournalRecord[] = [
  {
    id: 'jnl-1',
    journalNo: 'JNL-2026-0401',
    date: '2026-10-14',
    journalType: 'Standard',
    reference: 'GRN-2026-118 / PO-084',
    description: 'Alumex 6063-T6 Mullion Profiles issued to Sirius Mall Curtain Wall',
    debitAccount: '5010 • Direct Project Materials',
    creditAccount: '2010 • Accounts Payable',
    projectId: 'PRJ-2026-001',
    workPackage: 'Aluminium Curtain Wall',
    costCentre: 'CC-FAB-01',
    branch: 'Main Store',
    debitAmount: 2450000,
    creditAmount: 2450000,
    preparedBy: 'Nimali Perera',
    approvedBy: 'Rohan Silva (FC)',
    status: 'Posted'
  },
  {
    id: 'jnl-2',
    journalNo: 'JNL-2026-0402',
    date: '2026-10-14',
    journalType: 'Payroll Post',
    reference: 'WPS-OCT-2026',
    description: 'Site erection & shop fabrication labour allocation from HR Payroll',
    debitAccount: '5020 • Direct Fabrication & Site Labour',
    creditAccount: '1010 • Commercial Bank LKR',
    projectId: 'PRJ-2026-001',
    workPackage: 'Site Installation',
    costCentre: 'CC-SITE-02',
    branch: 'Colombo Metro',
    debitAmount: 1820000,
    creditAmount: 1820000,
    preparedBy: 'HR Payroll Engine',
    approvedBy: 'Rohan Silva (FC)',
    status: 'Posted'
  },
  {
    id: 'jnl-3',
    journalNo: 'JNL-2026-0403',
    date: '2026-10-13',
    journalType: 'Depreciation',
    reference: 'DEP-OCT-2026',
    description: 'Monthly depreciation on 5-Axis CNC Double-Mitre Saw & Vacuum Lifters',
    debitAccount: '5040 • Project Equipment Overhead',
    creditAccount: '1590 • Accumulated Depreciation',
    projectId: 'PRJ-2026-002',
    workPackage: 'Aluminium Fabrication',
    costCentre: 'CC-PLANT-01',
    branch: 'Main Store',
    debitAmount: 315000,
    creditAmount: 315000,
    preparedBy: 'Asset Engine',
    approvedBy: 'Rohan Silva (FC)',
    status: 'Posted'
  },
  {
    id: 'jnl-4',
    journalNo: 'JNL-2026-0404',
    date: '2026-10-14',
    journalType: 'Accrual',
    reference: 'ACC-SUB-019',
    description: 'October spider crane hoisting subcontractor accrual (Invoice pending)',
    debitAccount: '5030 • Project Subcontracting',
    creditAccount: '2210 • Accrued Project Expenses',
    projectId: 'PRJ-2026-002',
    workPackage: 'Glass Hoisting',
    costCentre: 'CC-SITE-03',
    branch: 'Colombo Metro',
    debitAmount: 680000,
    creditAmount: 680000,
    preparedBy: 'Nimali Perera',
    approvedBy: 'Pending',
    status: 'Pending Approval'
  }
];

const SEED_AP: AccountsPayableRecord[] = [
  {
    id: 'ap-1',
    billNo: 'BILL-2026-881',
    supplierName: 'Alumex Extrusions PLC',
    projectId: 'PRJ-2026-001',
    workPackage: 'Aluminium Profiles',
    poRef: 'PO-2026-084',
    grnRef: 'GRN-2026-118 (IQC Pass)',
    threeWayStatus: '3-Way Matched',
    grossAmount: 2450000,
    taxAmount: 441000,
    retentionHeld: 0,
    advanceRecovered: 500000,
    netPayable: 2391000,
    dueDate: '2026-10-28',
    status: 'Approved'
  },
  {
    id: 'ap-2',
    billNo: 'BILL-2026-884',
    supplierName: 'Guardian Architectural Glass',
    projectId: 'PRJ-2026-002',
    workPackage: 'Double Glazed Units',
    poRef: 'PO-2026-089',
    grnRef: 'GRN-2026-122 (IQC Pass)',
    threeWayStatus: '3-Way Matched',
    grossAmount: 3800000,
    taxAmount: 684000,
    retentionHeld: 190000,
    advanceRecovered: 800000,
    netPayable: 3494000,
    dueDate: '2026-11-05',
    status: 'Approved'
  },
  {
    id: 'ap-3',
    billNo: 'BILL-2026-889',
    supplierName: 'Jotun Powder Coatings',
    projectId: 'PRJ-2026-001',
    workPackage: 'Powder Coating',
    poRef: 'PO-2026-095',
    grnRef: 'GRN-2026-125 (NCR-044 Hold)',
    threeWayStatus: 'Price Variance',
    grossAmount: 620000,
    taxAmount: 111600,
    retentionHeld: 0,
    advanceRecovered: 0,
    netPayable: 731600,
    dueDate: '2026-10-30',
    status: 'Hold (Mismatch)'
  },
  {
    id: 'ap-4',
    billNo: 'BILL-2026-872',
    supplierName: 'Dow Performance Silicones',
    projectId: 'PRJ-2026-002',
    workPackage: 'Structural Sealants',
    poRef: 'PO-2026-092',
    grnRef: 'GRN-2026-114 (IQC Pass)',
    threeWayStatus: '3-Way Matched',
    grossAmount: 940000,
    taxAmount: 169200,
    retentionHeld: 0,
    advanceRecovered: 0,
    netPayable: 1109200,
    dueDate: '2026-10-12',
    status: 'Paid'
  }
];

const SEED_BANK: BankReconcileRecord[] = [
  {
    id: 'bnk-1',
    bankAccount: 'Commercial Bank LKR (1010)',
    currency: 'LKR',
    statementDate: '2026-10-14',
    statementRef: 'STMT-CEFT-99210',
    counterparty: 'Prime Lands Residencies',
    description: 'Progress Claim #3 Certified Receipt',
    amount: 4850000,
    type: 'Deposit',
    glMatchRef: 'PAY-2026-4102',
    matchStatus: 'Matched'
  },
  {
    id: 'bnk-2',
    bankAccount: 'Commercial Bank LKR (1010)',
    currency: 'LKR',
    statementDate: '2026-10-13',
    statementRef: 'STMT-SLIP-88412',
    counterparty: 'Dow Performance Silicones',
    description: 'Supplier Bill Settlement BILL-2026-872',
    amount: -1109200,
    type: 'Withdrawal',
    glMatchRef: 'BILL-2026-872',
    matchStatus: 'Matched'
  },
  {
    id: 'bnk-3',
    bankAccount: 'HSBC USD Corporate (1020)',
    currency: 'USD',
    statementDate: '2026-10-14',
    statementRef: 'SWIFT-TT-77401',
    counterparty: 'Schüco International KG',
    description: 'Hardware LC Margin & SWIFT Wire Fee',
    amount: -145,
    type: 'Bank Charge',
    glMatchRef: 'Unposted Charge',
    matchStatus: 'Unmatched'
  }
];

const SEED_PETTY: PettyCashRecord[] = [
  {
    id: 'pc-1',
    voucherNo: 'PCV-2026-301',
    date: '2026-10-14',
    branchSite: 'Sirius Mall Site Office',
    projectId: 'PRJ-2026-001',
    category: 'Fuel',
    description: 'Diesel for site generator & glass delivery lorry',
    custodian: 'Kasun Perera',
    amount: 28500,
    physicalCountVerified: true,
    status: 'Approved & Posted'
  },
  {
    id: 'pc-2',
    voucherNo: 'PCV-2026-302',
    date: '2026-10-14',
    branchSite: 'Horizon Tower Site',
    projectId: 'PRJ-2026-002',
    category: 'Site Expense',
    description: 'Urgent M12 chemical anchor bolts & drill bits',
    custodian: 'Eng. Janaka Perera',
    amount: 16400,
    physicalCountVerified: true,
    status: 'Approved & Posted'
  }
];

const SEED_WIP: ProjectCommitmentWipRecord[] = [
  {
    id: 'wip-1',
    projectId: 'PRJ-2026-001',
    projectName: 'Sirius Mall Unitized Curtain Wall',
    workPackage: 'Aluminium',
    originalBudget: 28000000,
    approvedVariations: 3500000,
    revisedBudget: 31500000,
    poCommitted: 6200000,
    actualCost: 19400000,
    costToComplete: 4800000,
    forecastFinalCost: 30400000,
    certifiedRevenue: 38500000,
    billedRevenue: 35000000,
    unbilledWip: 3500000,
    status: 'Healthy'
  },
  {
    id: 'wip-2',
    projectId: 'PRJ-2026-002',
    projectName: 'Horizon Office Complex Glazing',
    workPackage: 'Glass & Glazing',
    originalBudget: 18500000,
    approvedVariations: 1200000,
    revisedBudget: 19700000,
    poCommitted: 4500000,
    actualCost: 12800000,
    costToComplete: 2900000,
    forecastFinalCost: 20200000,
    certifiedRevenue: 22400000,
    billedRevenue: 19780000,
    unbilledWip: 2620000,
    status: 'Overrun Alert'
  },
  {
    id: 'wip-3',
    projectId: 'PRJ-2026-003',
    projectName: 'Oceanic Hotel Louvers & Balustrades',
    workPackage: 'Structural Steel',
    originalBudget: 12000000,
    approvedVariations: 0,
    revisedBudget: 12000000,
    poCommitted: 2100000,
    actualCost: 6400000,
    costToComplete: 3100000,
    forecastFinalCost: 11600000,
    certifiedRevenue: 11200000,
    billedRevenue: 11200000,
    unbilledWip: 0,
    status: 'Healthy'
  }
];

const SEED_ASSETS: FixedAssetAccountingRecord[] = [
  {
    id: 'fa-1',
    assetCode: 'FA-CNC-001',
    equipmentRef: 'EQ-CNC-01',
    assetName: 'Elumatec SBZ 151 5-Axis Aluminium Machining Center',
    category: 'CNC Machinery',
    acquisitionDate: '2024-03-15',
    cost: 24000000,
    usefulLifeYears: 10,
    method: 'Straight-Line (SLM)',
    monthlyDeprec: 200000,
    accumulatedDeprec: 6000000,
    carryingValue: 18000000,
    assignedProject: 'Main Fabrication Plant',
    status: 'Depreciating'
  },
  {
    id: 'fa-2',
    assetCode: 'FA-LFT-002',
    equipmentRef: 'EQ-VAC-02',
    assetName: 'Woods Powr-Grip Dual-Circuit Glass Vacuum Lifter 800kg',
    category: 'Lifting & Cranes',
    acquisitionDate: '2025-01-10',
    cost: 4800000,
    usefulLifeYears: 5,
    method: 'Straight-Line (SLM)',
    monthlyDeprec: 80000,
    accumulatedDeprec: 1680000,
    carryingValue: 3120000,
    assignedProject: 'Sirius Mall Glazing',
    status: 'Depreciating'
  },
  {
    id: 'fa-3',
    assetCode: 'FA-CRN-003',
    equipmentRef: 'EQ-SPD-03',
    assetName: 'Maeda MC285C-2Tracked Spider Crane',
    category: 'Lifting & Cranes',
    acquisitionDate: '2024-08-01',
    cost: 16800000,
    usefulLifeYears: 8,
    method: 'Straight-Line (SLM)',
    monthlyDeprec: 175000,
    accumulatedDeprec: 4550000,
    carryingValue: 12250000,
    assignedProject: 'Horizon Office Complex',
    status: 'Depreciating'
  }
];

const SEED_TAX: TaxStatutoryRecord[] = [
  {
    id: 'tx-1',
    taxCode: 'TAX-2026-10A',
    period: '2026-Q3 / Oct',
    taxType: 'Output VAT (18%)',
    taxableBase: 38500000,
    taxAmount: 6930000,
    dueDate: '2026-10-20',
    certificateRef: 'IRD-VAT-2026-10',
    status: 'Accrued / Due'
  },
  {
    id: 'tx-2',
    taxCode: 'TAX-2026-10B',
    period: '2026-Q3 / Oct',
    taxType: 'Input VAT Claim',
    taxableBase: 14200000,
    taxAmount: -2556000,
    dueDate: '2026-10-20',
    certificateRef: 'SCHED-INP-10',
    status: 'Accrued / Due'
  },
  {
    id: 'tx-3',
    taxCode: 'TAX-2026-10C',
    period: '2026-Q3 / Oct',
    taxType: 'SSCL (2.5%)',
    taxableBase: 38500000,
    taxAmount: 962500,
    dueDate: '2026-10-20',
    certificateRef: 'IRD-SSCL-2026-Q3',
    status: 'Filed & Paid'
  },
  {
    id: 'tx-4',
    taxCode: 'TAX-2026-10D',
    period: '2026-Oct',
    taxType: 'Subcontractor WHT (5%)',
    taxableBase: 2400000,
    taxAmount: 120000,
    dueDate: '2026-10-15',
    certificateRef: 'WHT-CERT-2026-88',
    status: 'Filed & Paid'
  }
];

const SEED_CLOSE: PeriodCloseStepRecord[] = [
  { id: 'cls-1', stepNo: 1, period: '2026-09 (Sep)', controlArea: 'Bank & Petty Cash Reconciliation', linkedModule: 'Bank & Cash', verificationNote: 'All LKR & USD statements matched', owner: 'Nimali Perera', status: 'Completed & Locked' },
  { id: 'cls-2', stepNo: 2, period: '2026-09 (Sep)', controlArea: 'AR Progress Claims & Retentions', linkedModule: 'Receivables (AR)', verificationNote: 'Certified IPCs & 10% retentions reconciled', owner: 'Rohan Silva', status: 'Completed & Locked' },
  { id: 'cls-3', stepNo: 3, period: '2026-09 (Sep)', controlArea: 'AP 3-Way Match & GRN Accruals', linkedModule: 'Payables (AP)', verificationNote: '1 bill held for NCR-044 shade variance', owner: 'Nimali Perera', status: 'Completed & Locked' },
  { id: 'cls-4', stepNo: 4, period: '2026-09 (Sep)', controlArea: 'Fixed Asset Depreciation & Payroll GL', linkedModule: 'Assets & Payroll', verificationNote: 'Monthly SLM depreciation & WPS posted', owner: 'Rohan Silva', status: 'Completed & Locked' },
  { id: 'cls-5', stepNo: 5, period: '2026-10 (Oct)', controlArea: 'Project WIP & Cost-to-Complete Review', linkedModule: 'Project Accounting', verificationNote: 'Horizon Tower glazing forecast review open', owner: 'Rohan Silva', status: 'Open Review' }
];

function loadList<T>(key: string, fallback: T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function saveList<T>(key: string, list: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch {
    // ignore storage errors
  }
}

export const accountingControlService = {
  getCoa(): ChartOfAccountRecord[] {
    return loadList(STORAGE_KEYS.COA, SEED_COA);
  },
  saveCoa(list: ChartOfAccountRecord[]): void {
    saveList(STORAGE_KEYS.COA, list);
  },
  getJournals(): GlJournalRecord[] {
    return loadList(STORAGE_KEYS.JOURNALS, SEED_JOURNALS);
  },
  saveJournals(list: GlJournalRecord[]): void {
    saveList(STORAGE_KEYS.JOURNALS, list);
  },
  getApRecords(): AccountsPayableRecord[] {
    return loadList(STORAGE_KEYS.AP, SEED_AP);
  },
  saveApRecords(list: AccountsPayableRecord[]): void {
    saveList(STORAGE_KEYS.AP, list);
  },
  getBankRecords(): BankReconcileRecord[] {
    return loadList(STORAGE_KEYS.BANK, SEED_BANK);
  },
  saveBankRecords(list: BankReconcileRecord[]): void {
    saveList(STORAGE_KEYS.BANK, list);
  },
  getPettyCash(): PettyCashRecord[] {
    return loadList(STORAGE_KEYS.PETTY, SEED_PETTY);
  },
  savePettyCash(list: PettyCashRecord[]): void {
    saveList(STORAGE_KEYS.PETTY, list);
  },
  getProjectWip(): ProjectCommitmentWipRecord[] {
    return loadList(STORAGE_KEYS.WIP, SEED_WIP);
  },
  saveProjectWip(list: ProjectCommitmentWipRecord[]): void {
    saveList(STORAGE_KEYS.WIP, list);
  },
  getFixedAssets(): FixedAssetAccountingRecord[] {
    return loadList(STORAGE_KEYS.ASSETS, SEED_ASSETS);
  },
  saveFixedAssets(list: FixedAssetAccountingRecord[]): void {
    saveList(STORAGE_KEYS.ASSETS, list);
  },
  getTaxRecords(): TaxStatutoryRecord[] {
    return loadList(STORAGE_KEYS.TAX, SEED_TAX);
  },
  saveTaxRecords(list: TaxStatutoryRecord[]): void {
    saveList(STORAGE_KEYS.TAX, list);
  },
  getPeriodCloseSteps(): PeriodCloseStepRecord[] {
    return loadList(STORAGE_KEYS.CLOSE, SEED_CLOSE);
  },
  savePeriodCloseSteps(list: PeriodCloseStepRecord[]): void {
    saveList(STORAGE_KEYS.CLOSE, list);
  }
};
