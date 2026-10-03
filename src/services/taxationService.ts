import { Invoice, CompanySettings } from '../types';
import { AccountsPayableRecord, FixedAssetAccountingRecord } from './accountingControlService';
import { AccountingDocumentSpec } from '../components/accounting/AccountingDocumentModal';

export interface CustomDutyTaxConfig {
  id: string;
  name: string;
  code: string;
  ratePercent: number;
  base: 'Turnover' | 'Import CIF' | 'Sales' | 'Specific';
  description?: string;
  isEnabled: boolean;
}

export interface TaxSettingsConfig {
  tin: string;
  vatNo: string;
  vatRatePercent: number; // Default 18%
  corporateTaxRatePercent: number; // Default 30%
  concessionalRatePercent?: number; // e.g. 15%
  whtRatePercent?: number; // e.g. 5%
  customDuties: CustomDutyTaxConfig[];
}

export interface TaxScheduleItem {
  id: string;
  taxCode: string;
  title: string;
  category: 'VAT' | 'CIT' | 'SSCL' | 'WHT' | 'Customs';
  period: string;
  dueDate: string;
  statutoryBase: number;
  ratePercent: number;
  estimatedLiability: number;
  paidAmount: number;
  status: 'Upcoming' | 'Due Soon' | 'Overdue' | 'Filed & Paid';
  filingRef?: string;
  notes?: string;
}

export interface VatCalculationResult {
  vatRate: number;
  grossSalesTaxable: number;
  outputVat: number;
  grossPurchasesTaxable: number;
  inputVatClaimable: number;
  netVatPayable: number; // Positive = Payable, Negative = Refundable
  outputLedger: Array<{
    invoiceNo: string;
    clientName: string;
    date: string;
    taxableAmount: number;
    vatAmount: number;
  }>;
  inputLedger: Array<{
    billNo: string;
    supplierName: string;
    date: string;
    taxableAmount: number;
    inputVatAmount: number;
  }>;
}

export interface CorporateIncomeTaxResult {
  fiscalYear: string;
  citRate: number;
  grossRevenue: number;
  directCostOfSales: number;
  grossOperatingProfit: number;
  indirectOverheads: number;
  accountingNetProfit: number;
  // Tax Adjustments
  depreciationAddBack: number;
  nonDeductibleExpenses: number;
  taxCapitalAllowances: number;
  taxableProfit: number;
  grossCitLiability: number;
  whtCreditsDeducted: number;
  netCitPayable: number;
  // Quarterly Installments (4 x 25%)
  installments: Array<{
    quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
    dueDate: string;
    installmentPercent: number;
    amount: number;
    status: 'Paid' | 'Pending' | 'Due Soon';
  }>;
}

const DEFAULT_TAX_SETTINGS: TaxSettingsConfig = {
  tin: '100234567-0000',
  vatNo: '100234567-7000',
  vatRatePercent: 18,
  corporateTaxRatePercent: 30,
  concessionalRatePercent: 15,
  whtRatePercent: 5,
  customDuties: [
    {
      id: 'duty-sscl',
      name: 'Social Security Contribution Levy (SSCL)',
      code: 'SSCL',
      ratePercent: 2.5,
      base: 'Turnover',
      description: 'Levied on liable turnover from manufacture or importation.',
      isEnabled: true
    },
    {
      id: 'duty-wht',
      name: 'Advance Income Tax / Withholding Tax (WHT)',
      code: 'WHT',
      ratePercent: 5.0,
      base: 'Sales',
      description: 'Deducted by clients on contractual construction progress payments.',
      isEnabled: true
    },
    {
      id: 'duty-customs',
      name: 'Customs Import Duty (CID)',
      code: 'CID',
      ratePercent: 15.0,
      base: 'Import CIF',
      description: 'Applied on imported specialized architectural extrusions and hardware.',
      isEnabled: false
    },
    {
      id: 'duty-pal',
      name: 'Ports & Airports Development Levy (PAL)',
      code: 'PAL',
      ratePercent: 10.0,
      base: 'Import CIF',
      description: 'Ports and airports infrastructure development levy on imported glass/metal.',
      isEnabled: false
    }
  ]
};

const TAX_STORAGE_KEY = 'innovista_tax_settings_v1';
const TAX_SCHEDULE_STORAGE_KEY = 'innovista_tax_schedules_v1';

class TaxationService {
  private settings: TaxSettingsConfig;
  private schedules: TaxScheduleItem[];

  constructor() {
    this.settings = this.loadSettings();
    this.schedules = this.loadSchedules();
  }

  private loadSettings(): TaxSettingsConfig {
    try {
      const stored = localStorage.getItem(TAX_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
    return { ...DEFAULT_TAX_SETTINGS };
  }

  private loadSchedules(): TaxScheduleItem[] {
    try {
      const stored = localStorage.getItem(TAX_SCHEDULE_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
    return this.getInitialSchedules();
  }

  private getInitialSchedules(): TaxScheduleItem[] {
    return [
      {
        id: 'sch-vat-09',
        taxCode: 'VAT-2026-M09',
        title: 'Monthly Value Added Tax (VAT) Return & Payment',
        category: 'VAT',
        period: 'September 2026',
        dueDate: '2026-10-20',
        statutoryBase: 18500000,
        ratePercent: 18,
        estimatedLiability: 1260000,
        paidAmount: 1260000,
        status: 'Filed & Paid',
        filingRef: 'RAMIS-VAT-99201',
        notes: 'Monthly VAT return filed with e-payment acknowledgment.'
      },
      {
        id: 'sch-vat-10',
        taxCode: 'VAT-2026-M10',
        title: 'Monthly Value Added Tax (VAT) Return & Payment',
        category: 'VAT',
        period: 'October 2026',
        dueDate: '2026-11-20',
        statutoryBase: 24200000,
        ratePercent: 18,
        estimatedLiability: 1845000,
        paidAmount: 0,
        status: 'Upcoming',
        notes: 'Monthly output VAT on certified claims less input procurement claims.'
      },
      {
        id: 'sch-cit-q1',
        taxCode: 'CIT-2026-Q1',
        title: 'Corporate Income Tax 1st Advance Installment',
        category: 'CIT',
        period: 'Q1 (Apr - Jun 2026)',
        dueDate: '2026-08-15',
        statutoryBase: 12000000,
        ratePercent: 30,
        estimatedLiability: 900000,
        paidAmount: 900000,
        status: 'Filed & Paid',
        filingRef: 'RAMIS-CIT-2026-Q1',
        notes: 'First quarter advance corporate tax installment settled via electronic bank slip.'
      },
      {
        id: 'sch-cit-q2',
        taxCode: 'CIT-2026-Q2',
        title: 'Corporate Income Tax 2nd Advance Installment',
        category: 'CIT',
        period: 'Q2 (Jul - Sep 2026)',
        dueDate: '2026-11-15',
        statutoryBase: 16500000,
        ratePercent: 30,
        estimatedLiability: 1237500,
        paidAmount: 0,
        status: 'Due Soon',
        notes: 'Second quarter advance CIT installment due by November 15.'
      },
      {
        id: 'sch-cit-q3',
        taxCode: 'CIT-2026-Q3',
        title: 'Corporate Income Tax 3rd Advance Installment',
        category: 'CIT',
        period: 'Q3 (Oct - Dec 2026)',
        dueDate: '2027-02-15',
        statutoryBase: 18000000,
        ratePercent: 30,
        estimatedLiability: 1350000,
        paidAmount: 0,
        status: 'Upcoming',
        notes: 'Third quarter advance corporate income tax installment.'
      },
      {
        id: 'sch-cit-q4',
        taxCode: 'CIT-2026-Q4',
        title: 'Corporate Income Tax 4th Advance Installment',
        category: 'CIT',
        period: 'Q4 (Jan - Mar 2027)',
        dueDate: '2027-05-15',
        statutoryBase: 19500000,
        ratePercent: 30,
        estimatedLiability: 1462500,
        paidAmount: 0,
        status: 'Upcoming',
        notes: 'Fourth quarter advance corporate income tax installment.'
      },
      {
        id: 'sch-cit-annual',
        taxCode: 'CIT-RET-2025/26',
        title: 'Annual Corporate Return of Income & Final Balance of Tax',
        category: 'CIT',
        period: 'Y/A 2025/2026',
        dueDate: '2026-11-30',
        statutoryBase: 48000000,
        ratePercent: 30,
        estimatedLiability: 3600000,
        paidAmount: 3200000,
        status: 'Due Soon',
        notes: 'Annual audited tax return with final balance of tax reconciliation.'
      },
      {
        id: 'sch-sscl-q3',
        taxCode: 'SSCL-2026-Q3',
        title: 'Social Security Contribution Levy (SSCL) Quarterly Return',
        category: 'SSCL',
        period: 'Quarter 3 (Jul - Sep 2026)',
        dueDate: '2026-10-31',
        statutoryBase: 32000000,
        ratePercent: 2.5,
        estimatedLiability: 800000,
        paidAmount: 0,
        status: 'Due Soon',
        notes: 'SSCL levied on manufacturing and turnover.'
      }
    ];
  }

  public getSettings(): TaxSettingsConfig {
    return { ...this.settings };
  }

  public saveSettings(newSettings: TaxSettingsConfig): void {
    this.settings = newSettings;
    try {
      localStorage.setItem(TAX_STORAGE_KEY, JSON.stringify(newSettings));
    } catch {}
  }

  public getSchedules(): TaxScheduleItem[] {
    // Update live status based on current date
    const now = new Date();
    return this.schedules.map(sch => {
      if (sch.status === 'Filed & Paid') return sch;
      const due = new Date(sch.dueDate);
      const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      let status = sch.status;
      if (diffDays < 0) {
        status = 'Overdue';
      } else if (diffDays <= 14) {
        status = 'Due Soon';
      } else {
        status = 'Upcoming';
      }
      return { ...sch, status };
    });
  }

  public saveSchedules(schedules: TaxScheduleItem[]): void {
    this.schedules = schedules;
    try {
      localStorage.setItem(TAX_SCHEDULE_STORAGE_KEY, JSON.stringify(schedules));
    } catch {}
  }

  public markSchedulePaid(id: string, filingRef: string): void {
    this.schedules = this.schedules.map(s => {
      if (s.id === id) {
        return {
          ...s,
          status: 'Filed & Paid',
          paidAmount: s.estimatedLiability,
          filingRef: filingRef || `RAMIS-ACK-${Date.now().toString(36).toUpperCase()}`
        };
      }
      return s;
    });
    this.saveSchedules(this.schedules);
  }

  // VAT Calculation Engine (Output VAT - Input VAT)
  public calculateVAT(
    invoices: Invoice[],
    apRecords: AccountsPayableRecord[]
  ): VatCalculationResult {
    const vatRate = this.settings.vatRatePercent || 18;

    // 1. Output VAT from invoices
    let grossSalesTaxable = 0;
    let outputVat = 0;
    const outputLedger = invoices.map(inv => {
      const taxable = inv.subTotal > 0 ? inv.subTotal : inv.grandTotal / (1 + vatRate / 100);
      const vat = inv.taxTotal > 0 ? inv.taxTotal : Math.round(taxable * (vatRate / 100));
      grossSalesTaxable += taxable;
      outputVat += vat;
      return {
        invoiceNo: inv.invoiceNo,
        clientName: inv.client?.name || 'Customer Account',
        date: inv.date,
        taxableAmount: Math.round(taxable),
        vatAmount: vat
      };
    });

    // 2. Input VAT from AP procurement bills
    let grossPurchasesTaxable = 0;
    let inputVatClaimable = 0;
    const inputLedger = apRecords.map(b => {
      const taxable = b.grossAmount - (b.taxAmount || 0);
      const inputVat = b.taxAmount > 0 ? b.taxAmount : Math.round(taxable * (vatRate / 100));
      grossPurchasesTaxable += taxable;
      inputVatClaimable += inputVat;
      return {
        billNo: b.billNo,
        supplierName: b.supplierName,
        date: (b as any).billDate || b.dueDate || '2026-09-30',
        taxableAmount: Math.round(taxable),
        inputVatAmount: inputVat
      };
    });

    const netVatPayable = outputVat - inputVatClaimable;

    return {
      vatRate,
      grossSalesTaxable: Math.round(grossSalesTaxable),
      outputVat: Math.round(outputVat),
      grossPurchasesTaxable: Math.round(grossPurchasesTaxable),
      inputVatClaimable: Math.round(inputVatClaimable),
      netVatPayable: Math.round(netVatPayable),
      outputLedger,
      inputLedger
    };
  }

  // Corporate Income Tax Computation Engine
  public calculateCorporateIncomeTax(
    invoices: Invoice[],
    apRecords: AccountsPayableRecord[],
    assetRecords: FixedAssetAccountingRecord[]
  ): CorporateIncomeTaxResult {
    const citRate = this.settings.corporateTaxRatePercent || 30;

    // 1. Gross Revenue
    const grossRevenue = invoices.reduce((s, i) => s + (i.subTotal || i.grandTotal), 0) || 52000000;

    // 2. Direct Cost of Sales (Materials, Labour, Machinery, Subcontracts)
    const materialsCost = apRecords.reduce((s, a) => s + a.grossAmount, 0) || 24000000;
    const labourCost = Math.round(grossRevenue * 0.22); // Payroll ~22%
    const plantMachineCost = Math.round(grossRevenue * 0.08); // Equipment ~8%
    const directCostOfSales = materialsCost + labourCost + plantMachineCost;

    // 3. Gross Operating Profit
    const grossOperatingProfit = Math.max(0, grossRevenue - directCostOfSales);

    // 4. Overheads & Admin
    const indirectOverheads = Math.round(grossRevenue * 0.12);
    const accountingNetProfit = Math.max(0, grossOperatingProfit - indirectOverheads);

    // 5. Tax Adjustments (Add-backs & Capital Allowances)
    // Accounting depreciation added back
    const totalAccountingDeprec = assetRecords.reduce((s, a) => s + (a.monthlyDeprec * 12), 0) || 1200000;
    const nonDeductibleExpenses = Math.round(accountingNetProfit * 0.04); // Fines, non-business entertainment

    // Tax Depreciation / Capital Allowance (20% on plant/machinery per tax rules)
    const totalAssetCost = assetRecords.reduce((s, a) => s + a.cost, 0) || 15000000;
    const taxCapitalAllowances = Math.round(totalAssetCost * 0.20); // 20% standard rate

    // Taxable Profit
    const taxableProfit = Math.max(0, accountingNetProfit + totalAccountingDeprec + nonDeductibleExpenses - taxCapitalAllowances);

    // Gross CIT Liability @ 30%
    const grossCitLiability = Math.round(taxableProfit * (citRate / 100));

    // WHT credits deducted by clients (5% of invoiced claims)
    const whtCreditsDeducted = Math.round(grossRevenue * ((this.settings.whtRatePercent || 5) / 100));
    const netCitPayable = Math.max(0, grossCitLiability - whtCreditsDeducted);

    // Quarterly Installment Schedule (4 equal parts)
    const quarterAmount = Math.round(grossCitLiability / 4);
    const installments: CorporateIncomeTaxResult['installments'] = [
      { quarter: 'Q1', dueDate: '2026-08-15', installmentPercent: 25, amount: quarterAmount, status: 'Paid' },
      { quarter: 'Q2', dueDate: '2026-11-15', installmentPercent: 25, amount: quarterAmount, status: 'Due Soon' },
      { quarter: 'Q3', dueDate: '2027-02-15', installmentPercent: 25, amount: quarterAmount, status: 'Pending' },
      { quarter: 'Q4', dueDate: '2027-05-15', installmentPercent: 25, amount: quarterAmount, status: 'Pending' }
    ];

    return {
      fiscalYear: '2026/2027',
      citRate,
      grossRevenue,
      directCostOfSales,
      grossOperatingProfit,
      indirectOverheads,
      accountingNetProfit,
      depreciationAddBack: totalAccountingDeprec,
      nonDeductibleExpenses,
      taxCapitalAllowances,
      taxableProfit,
      grossCitLiability,
      whtCreditsDeducted,
      netCitPayable,
      installments
    };
  }

  // Document Layout Builder (Matches Factory Portal Layout)
  public buildVatReturnDocSpec(
    vatCalc: VatCalculationResult,
    settings?: CompanySettings
  ): AccountingDocumentSpec {
    return {
      docTitle: 'VALUE ADDED TAX (VAT) STATUTORY RETURN & RECONCILIATION',
      docNo: `TAX-VAT-2026-M09`,
      docDate: new Date().toISOString().substring(0, 10),
      category: 'Statutory Taxation Filing',
      factoryName: 'Innovista Central Headquarters & Plants',
      factoryCode: 'HQ-INV-TAX',
      location: 'Central Tax & Treasury Bureau',
      responsibleOfficer: 'Tax & Compliance Controller',
      priority: 'Statutory Filing (Strict Deadline)',
      status: 'Approved',
      scheduleType: 'Monthly VAT Return (0d Float)',
      workRef: `VAT-REG-${this.settings.vatNo || settings?.vatNo || '100234567-7000'}`,
      notes: `Official Value Added Tax return computed at standard statutory rate of ${vatCalc.vatRate}%. Reconciles Output VAT on certified invoices against claimable Input VAT on procurement invoices.`,
      keyDetails: [
        {
          no: '2.1',
          item: 'Statutory Output Tax Recognition',
          details: `Output VAT computed strictly at ${vatCalc.vatRate}% on all certified progress billing claims, supply invoices, and customer advance receipts.`
        },
        {
          no: '2.2',
          item: 'Input Tax Deduction Veracity',
          details: 'Input tax claimed strictly on valid tax invoices with registered supplier TIN/VAT numbers, verified Mill Test Certificates, and customs documentation.'
        },
        {
          no: '2.3',
          item: 'Remittance & Reconciliation Terms',
          details: 'Net tax payable remitted to the Inland Revenue through approved commercial bank electronic tax payment gateways on or before the statutory due date.'
        }
      ],
      strategyBox1Label: 'Output VAT (Sales)',
      strategyBox1Value: `LKR ${vatCalc.outputVat.toLocaleString()}`,
      strategyBox2Label: 'Input VAT (Procurement)',
      strategyBox2Value: `LKR ${vatCalc.inputVatClaimable.toLocaleString()}`,
      strategyBox3Label: 'Net VAT Due / (Credit)',
      strategyBox3Value: `LKR ${vatCalc.netVatPayable.toLocaleString()} (${vatCalc.netVatPayable >= 0 ? 'Payable' : 'Refund'})`,
      scheduleHeaders: ['Ref #', 'Entity Name / Trade', 'Tax Category', 'Taxable Base (LKR)', 'VAT (LKR)'],
      scheduleRows: [
        ...vatCalc.outputLedger.slice(0, 5).map(o => ({
          col1: o.invoiceNo,
          col2: o.clientName,
          col3: `Output Tax (${vatCalc.vatRate}%)`,
          col4: `LKR ${o.taxableAmount.toLocaleString()}`,
          col5: `LKR ${o.vatAmount.toLocaleString()}`,
          isHighlight: false
        })),
        ...vatCalc.inputLedger.slice(0, 5).map(i => ({
          col1: i.billNo,
          col2: i.supplierName,
          col3: `Input Tax Credit (${vatCalc.vatRate}%)`,
          col4: `LKR ${i.taxableAmount.toLocaleString()}`,
          col5: `(LKR ${i.inputVatAmount.toLocaleString()})`,
          isHighlight: true
        }))
      ],
      summaryTotals: [
        { label: 'Total Output Tax on Taxable Supplies', value: `LKR ${vatCalc.outputVat.toLocaleString()}` },
        { label: 'Less: Allowable Input Tax on Purchases', value: `(LKR ${vatCalc.inputVatClaimable.toLocaleString()})` },
        { label: 'Net VAT Amount Payable to Inland Revenue', value: `LKR ${vatCalc.netVatPayable.toLocaleString()}` }
      ],
      terms: [
        {
          title: 'Taxation Veracity Clause',
          content: 'All sales and purchase figures conform to General Ledger records and valid statutory tax invoices.'
        },
        {
          title: 'Electronic Filing Declaration',
          content: 'Return submitted electronically via Revenue Administration Management Information System.'
        }
      ],
      preparedBy: 'Senior Tax Accountant',
      approvedBy: 'Chief Financial Officer (Admin)',
      authorizationStatus: 'Approved',
      auditStamp: `SYS-TAX-VAT-${Date.now().toString(36).toUpperCase()}`
    };
  }

  public buildCorporateTaxDocSpec(
    citCalc: CorporateIncomeTaxResult,
    settings?: CompanySettings
  ): AccountingDocumentSpec {
    return {
      docTitle: 'CORPORATE INCOME TAX COMPUTATION & STATUTORY RETURN',
      docNo: `TAX-CIT-${citCalc.fiscalYear.replace('/', '-')}`,
      docDate: new Date().toISOString().substring(0, 10),
      category: 'Corporate Income Taxation (CIT)',
      factoryName: settings?.name || 'Innovista Central Headquarters (Ragama)',
      factoryCode: 'HQ-INV-TAX',
      location: 'Executive Finance & Tax Audit Bureau',
      responsibleOfficer: 'Head of Tax & Legal Compliance',
      priority: 'Statutory Corporate Return',
      status: 'Audited & Locked',
      scheduleType: 'Annual Assessment (0d Float)',
      workRef: `TIN-${this.settings.tin || '100234567-0000'}`,
      notes: `Statutory corporate income tax computation for Year of Assessment ${citCalc.fiscalYear}. Standard statutory corporate tax rate applied at ${citCalc.citRate}% with full capital allowance adjustments.`,
      keyDetails: [
        {
          no: '2.1',
          item: 'Accounting to Tax Profit Reconciliation',
          details: 'Commercial net profit adjusted for disallowed accounting depreciation and non-business expenses as stipulated by statutory income tax frameworks.'
        },
        {
          no: '2.2',
          item: 'Capital Allowances & Tax Depreciation',
          details: 'Capital allowances computed on plant, 5-axis CNC machinery, and equipment at 20% per annum straight-line tax rate.'
        },
        {
          no: '2.3',
          item: 'Advance Quarterly Installments & WHT Credits',
          details: 'Advance quarterly payments and client contractual withholding tax deductions credited against final gross liability.'
        }
      ],
      strategyBox1Label: 'Accounting Net Profit',
      strategyBox1Value: `LKR ${citCalc.accountingNetProfit.toLocaleString()}`,
      strategyBox2Label: 'Adjusted Taxable Income',
      strategyBox2Value: `LKR ${citCalc.taxableProfit.toLocaleString()}`,
      strategyBox3Label: 'Net CIT Due (@30%)',
      strategyBox3Value: `LKR ${citCalc.netCitPayable.toLocaleString()}`,
      scheduleHeaders: ['Line #', 'Tax Computation Item', 'Basis / Rule', 'Adjustment', 'Amount (LKR)'],
      scheduleRows: [
        {
          col1: '01',
          col2: 'Gross Turnover & Commercial Revenue',
          col3: 'Invoiced Progress Billings',
          col4: 'Base Revenue',
          col5: `LKR ${citCalc.grossRevenue.toLocaleString()}`
        },
        {
          col1: '02',
          col2: 'Direct Cost of Sales & Production Expenses',
          col3: 'Materials + Labour + Plant Costs',
          col4: 'Less: Cost of Sales',
          col5: `(LKR ${citCalc.directCostOfSales.toLocaleString()})`
        },
        {
          col1: '03',
          col2: 'Commercial Accounting Net Profit',
          col3: 'Audited Profit Before Tax (PBT)',
          col4: 'Sub-Total',
          col5: `LKR ${citCalc.accountingNetProfit.toLocaleString()}`,
          isHighlight: true
        },
        {
          col1: '04',
          col2: 'Add: Disallowable Accounting Depreciation',
          col3: 'IAS 16 Book Depreciation',
          col4: 'Add-back (+)',
          col5: `LKR ${citCalc.depreciationAddBack.toLocaleString()}`
        },
        {
          col1: '05',
          col2: 'Add: Non-deductible Entertainment & Fines',
          col3: 'Statutory Exclusion Rule',
          col4: 'Add-back (+)',
          col5: `LKR ${citCalc.nonDeductibleExpenses.toLocaleString()}`
        },
        {
          col1: '06',
          col2: 'Less: Allowable Tax Capital Depreciation (20%)',
          col3: 'Capital Allowances on Plant & Machinery',
          col4: 'Deduction (-)',
          col5: `(LKR ${citCalc.taxCapitalAllowances.toLocaleString()})`
        },
        {
          col1: '07',
          col2: 'Total Adjusted Taxable Profit',
          col3: 'Assessable Corporate Income',
          col4: 'Statutory Base',
          col5: `LKR ${citCalc.taxableProfit.toLocaleString()}`,
          isHighlight: true
        },
        {
          col1: '08',
          col2: `Gross Corporate Tax Liability (@ ${citCalc.citRate}%)`,
          col3: `Statutory Rate: ${citCalc.citRate}%`,
          col4: 'Tax Liability',
          col5: `LKR ${citCalc.grossCitLiability.toLocaleString()}`
        },
        {
          col1: '09',
          col2: 'Less: Contractual WHT / AIT Credits Deducted',
          col3: '5% Client Construction Deductions',
          col4: 'Tax Credit (-)',
          col5: `(LKR ${citCalc.whtCreditsDeducted.toLocaleString()})`
        }
      ],
      summaryTotals: [
        { label: 'Total Gross Corporate Income Tax Liability', value: `LKR ${citCalc.grossCitLiability.toLocaleString()}` },
        { label: 'Less: Total WHT / AIT Prepayments & Credits', value: `(LKR ${citCalc.whtCreditsDeducted.toLocaleString()})` },
        { label: 'Net Balance of Corporate Tax Payable', value: `LKR ${citCalc.netCitPayable.toLocaleString()}` }
      ],
      terms: [
        {
          title: 'Corporate Tax Statutory Framework',
          content: 'Return prepared in strict compliance with the Inland Revenue Act No. 24 of 2017 and amendments.'
        },
        {
          title: 'Advance Installment Penalties Warning',
          content: 'Failure to pay quarterly installments by due dates incurs statutory interest of 1.5% per month plus penalties.'
        }
      ],
      preparedBy: 'Chartered Tax Advisor',
      approvedBy: 'Managing Director & Auditor',
      authorizationStatus: 'Audited & Locked',
      auditStamp: `SYS-TAX-CIT-${Date.now().toString(36).toUpperCase()}`
    };
  }

  // Quarterly Advance Installment Voucher
  public buildQuarterlyVoucherDocSpec(
    quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4',
    citCalc: CorporateIncomeTaxResult
  ): AccountingDocumentSpec {
    const installment = citCalc.installments.find(i => i.quarter === quarter) || citCalc.installments[0];
    return {
      docTitle: `ADVANCE CIT PAYMENT VOUCHER — ${quarter} (2026/2027)`,
      docNo: `TAX-VOUCH-${quarter}-2026`,
      docDate: new Date().toISOString().substring(0, 10),
      category: 'Corporate Tax Advance Installment',
      factoryName: 'Innovista Central Headquarters (Ragama)',
      factoryCode: 'HQ-INV-TAX',
      location: 'Central Treasury & Cash Office',
      responsibleOfficer: 'Treasury & Tax Officer',
      priority: 'Advance Tax Installment (Mandatory)',
      status: installment.status === 'Paid' ? 'Approved' : 'Pending Review',
      scheduleType: 'Quarterly Installment (0d Float)',
      workRef: `PAYSLIP-CIT-${quarter}`,
      notes: `Advance quarterly corporate income tax payment voucher for ${quarter}. Statutory payment required on or before ${installment.dueDate}.`,
      keyDetails: [
        {
          no: '2.1',
          item: 'Statutory Basis for Installment',
          details: 'Computed as 25% of the total estimated corporate income tax liability for Year of Assessment 2026/2027.'
        },
        {
          no: '2.2',
          item: 'Late Payment Penalty Provisions',
          details: 'Section 159 imposes 10% penalty on unpaid installments plus 1.5% statutory monthly interest.'
        },
        {
          no: '2.3',
          item: 'Electronic Bank Challan Proof',
          details: 'Voucher reconciled against CEFT bank transfer to Inland Revenue Department Central Bank Account.'
        }
      ],
      strategyBox1Label: 'Estimated Annual CIT',
      strategyBox1Value: `LKR ${citCalc.grossCitLiability.toLocaleString()}`,
      strategyBox2Label: `${quarter} Installment (25%)`,
      strategyBox2Value: `LKR ${installment.amount.toLocaleString()}`,
      strategyBox3Label: 'Statutory Due Date',
      strategyBox3Value: installment.dueDate,
      scheduleHeaders: ['Installment #', 'Fiscal Quarter', 'Statutory Due Date', 'Percentage', 'Voucher Amount (LKR)'],
      scheduleRows: citCalc.installments.map(ins => ({
        col1: `0${ins.quarter.replace('Q', '')}`,
        col2: `Quarter ${ins.quarter.replace('Q', '')} Installment`,
        col3: ins.dueDate,
        col4: `${ins.installmentPercent}%`,
        col5: `LKR ${ins.amount.toLocaleString()}`,
        isHighlight: ins.quarter === quarter
      })),
      summaryTotals: [
        { label: `${quarter} Advance Tax Amount Payable`, value: `LKR ${installment.amount.toLocaleString()}` },
        { label: 'Payment Status', value: installment.status.toUpperCase() }
      ],
      terms: [
        {
          title: 'Mandatory Quarterly Payment',
          content: 'Installments are legally binding advance payments against annual corporate income tax.'
        }
      ],
      preparedBy: 'Tax & Treasury Accountant',
      approvedBy: 'Director of Finance (Admin)',
      authorizationStatus: installment.status === 'Paid' ? 'Approved' : 'Pending Review',
      auditStamp: `SYS-TAX-VOUCH-${quarter}-${Date.now().toString(36).toUpperCase()}`
    };
  }
}

export const taxationService = new TaxationService();
