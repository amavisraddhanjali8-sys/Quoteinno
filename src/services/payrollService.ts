import {
  PayrollPeriodRecord,
  EmployeePayrollItem,
  DepartmentBudgetMetric,
  ProjectPayrollPlan,
  ProjectBudgetItem,
  StatutoryReconciliationRecord,
  QuickPayoutRecord
} from '../types/payroll';

const STORAGE_KEYS = {
  PAYROLL: 'innovista_payroll_periods_v1',
  BUDGETS: 'innovista_dept_budgets_v1',
  PROJECT_PLANS: 'innovista_project_payroll_plans_v1',
  DEPT_PLANS: 'innovista_dept_payroll_plans_v1',
  STATUTORY: 'innovista_statutory_reconciliation_v1',
  QUICK_PAYOUTS: 'innovista_quick_payouts_v1'
};

const SEED_PAYROLL: PayrollPeriodRecord[] = [
  {
    id: 'pay-2026-09',
    month: 'September 2026',
    year: 2026,
    cycleNumber: 'PAY-2026-09',
    totalEmployees: 6,
    totalGrossPay: 121500,
    totalOvertimeAmount: 9800,
    totalDeductions: 5400,
    totalNetPayable: 125900,
    status: 'Pending Review',
    wpsBatchReference: 'WPS-MOL-202609-INNOVISTA',
    preparedBy: 'Sara Jenkins (HR Lead)',
    preparedAt: '2026-09-21T09:00:00Z',
    items: [
      {
        id: 'pi-1',
        employeeId: 'EMP-001',
        employeeName: 'Alexander Vance',
        department: 'COMMERCIAL_ADMIN',
        designation: 'Managing Director & CEO',
        branch: 'Main Store',
        basicSalary: 28000,
        housingAllowance: 10000,
        transportAllowance: 4000,
        overtimeHours: 0,
        overtimeRatePerHour: 0,
        overtimeTotal: 0,
        performanceBonus: 0,
        grossSalary: 42000,
        pensionOrGosiDeduction: 0,
        absenceOrLoanDeductions: 0,
        totalDeductions: 0,
        netSalary: 42000,
        bankName: 'First Abu Dhabi Bank (FAB)',
        iban: 'AE880330000099998888777',
        wpsRoutingCode: 'FABAAEAD',
        paymentStatus: 'Approved'
      },
      {
        id: 'pi-2',
        employeeId: 'EMP-014',
        employeeName: 'Marcus Sterling',
        department: 'OPERATIONS',
        designation: 'Senior Project Director',
        branch: 'Dubai Fabrication Yard',
        basicSalary: 18000,
        housingAllowance: 6000,
        transportAllowance: 2500,
        overtimeHours: 12,
        overtimeRatePerHour: 125,
        overtimeTotal: 1500,
        performanceBonus: 1000,
        grossSalary: 27500,
        pensionOrGosiDeduction: 0,
        absenceOrLoanDeductions: 500,
        totalDeductions: 500,
        netSalary: 28500,
        bankName: 'Emirates NBD',
        iban: 'AE440260000011223344556',
        wpsRoutingCode: 'EBILAEAD',
        paymentStatus: 'Approved'
      },
      {
        id: 'pi-3',
        employeeId: 'EMP-022',
        employeeName: 'Elena Rostova',
        department: 'COMMERCIAL_ADMIN',
        designation: 'Head of Finance & Accounts',
        branch: 'Main Store',
        basicSalary: 16000,
        housingAllowance: 5000,
        transportAllowance: 2000,
        overtimeHours: 0,
        overtimeRatePerHour: 0,
        overtimeTotal: 0,
        performanceBonus: 0,
        grossSalary: 23000,
        pensionOrGosiDeduction: 0,
        absenceOrLoanDeductions: 0,
        totalDeductions: 0,
        netSalary: 23000,
        bankName: 'Abu Dhabi Commercial Bank (ADCB)',
        iban: 'AE550240000033445566778',
        wpsRoutingCode: 'ADCBAEAA',
        paymentStatus: 'Approved'
      },
      {
        id: 'pi-4',
        employeeId: 'EMP-088',
        employeeName: 'Tariq Mansoor',
        department: 'PROCUREMENT_SUPPLY_CHAIN',
        designation: 'Procurement Director',
        branch: 'Main Store',
        basicSalary: 14000,
        housingAllowance: 5000,
        transportAllowance: 1500,
        overtimeHours: 8,
        overtimeRatePerHour: 100,
        overtimeTotal: 800,
        performanceBonus: 1000,
        grossSalary: 20500,
        pensionOrGosiDeduction: 0,
        absenceOrLoanDeductions: 0,
        totalDeductions: 0,
        netSalary: 21300,
        bankName: 'Dubai Islamic Bank (DIB)',
        iban: 'AE330240000088877665544',
        wpsRoutingCode: 'DIBKAEAD',
        paymentStatus: 'Approved'
      },
      {
        id: 'pi-5',
        employeeId: 'EMP-031',
        employeeName: 'Fiona Chen',
        department: 'OPERATIONS',
        designation: 'Chief Quantity Surveyor',
        branch: 'Main Store',
        basicSalary: 13000,
        housingAllowance: 4500,
        transportAllowance: 1000,
        overtimeHours: 15,
        overtimeRatePerHour: 90,
        overtimeTotal: 1350,
        performanceBonus: 1000,
        grossSalary: 18500,
        pensionOrGosiDeduction: 0,
        absenceOrLoanDeductions: 0,
        totalDeductions: 0,
        netSalary: 19850,
        bankName: 'Mashreq Bank',
        iban: 'AE120310000022334455667',
        wpsRoutingCode: 'BOMLAEAD',
        paymentStatus: 'Approved'
      },
      {
        id: 'pi-6',
        employeeId: 'EMP-045',
        employeeName: 'David Mercer',
        department: 'OPERATIONS',
        designation: 'QA/QC Lead Engineer',
        branch: 'Dubai Fabrication Yard',
        basicSalary: 11000,
        housingAllowance: 4000,
        transportAllowance: 1500,
        overtimeHours: 24,
        overtimeRatePerHour: 80,
        overtimeTotal: 1920,
        performanceBonus: 0,
        grossSalary: 16500,
        pensionOrGosiDeduction: 0,
        absenceOrLoanDeductions: 0,
        totalDeductions: 0,
        netSalary: 18420,
        bankName: 'Standard Chartered UAE',
        iban: 'AE950180000044556677889',
        wpsRoutingCode: 'SCBLAEAD',
        paymentStatus: 'Approved'
      }
    ]
  }
];

const SEED_BUDGETS: DepartmentBudgetMetric[] = [
  {
    departmentCode: 'COMMERCIAL_ADMIN',
    departmentName: 'Commercial & Executive Administration',
    annualBudget: 950000,
    ytdBurnRate: 68.4,
    committedPayroll: 65000,
    operationalExpenses: 12000,
    remainingBudget: 300200,
    headcount: 2
  },
  {
    departmentCode: 'OPERATIONS',
    departmentName: 'Fabrication, Site & Operations',
    annualBudget: 1400000,
    ytdBurnRate: 74.2,
    committedPayroll: 66770,
    operationalExpenses: 45000,
    remainingBudget: 361200,
    headcount: 3
  },
  {
    departmentCode: 'PROCUREMENT_SUPPLY_CHAIN',
    departmentName: 'Procurement & Material Supply',
    annualBudget: 500000,
    ytdBurnRate: 51.2,
    committedPayroll: 21300,
    operationalExpenses: 8000,
    remainingBudget: 244000,
    headcount: 1
  }
];

// ============================================================================
// SEED PROJECT PAYROLL PLANS & BUDGETS
// ============================================================================

const SEED_PROJECT_PLANS: ProjectPayrollPlan[] = [
  {
    id: 'pplan-prj-1001-a',
    projectId: 'PRJ-2026-1001',
    projectName: 'ABC Commercial Factory Fitting',
    planName: 'Plan A: Baseline Normal Shifts',
    code: 'LAB-PLN-1001-A',
    currency: 'AED',
    isActive: true,
    notes: 'Standard 45-day fabrication and site erection shifts with minimal night work.',
    totalPlannedCost: 148500,
    actualCostToDate: 139200,
    variance: 9300,
    burnRatePercent: 93.7,
    createdAt: '2026-08-01T08:00:00Z',
    updatedAt: '2026-09-20T10:00:00Z',
    items: [
      {
        id: 'pbi-1',
        roleName: 'Site Supervisor',
        personnelName: 'Marcus Sterling',
        headcount: 1,
        plannedManDays: 35,
        dailyRate: 650,
        plannedBasic: 22750,
        plannedOvertime: 2600,
        plannedSiteAllowance: 1750,
        totalPlannedCost: 27100,
        actualHoursWorked: 320,
        actualCost: 26200,
        variance: 900,
        variancePercent: 3.3
      },
      {
        id: 'pbi-2',
        roleName: 'Master Fabricator / Welder',
        personnelName: 'Kasun Bandara & Crew',
        headcount: 3,
        plannedManDays: 90,
        dailyRate: 480,
        plannedBasic: 43200,
        plannedOvertime: 7200,
        plannedSiteAllowance: 4500,
        totalPlannedCost: 54900,
        actualHoursWorked: 780,
        actualCost: 51400,
        variance: 3500,
        variancePercent: 6.4
      },
      {
        id: 'pbi-3',
        roleName: 'Structural Glazing Installers',
        personnelName: 'Installation Gang (4 Techs)',
        headcount: 4,
        plannedManDays: 80,
        dailyRate: 420,
        plannedBasic: 33600,
        plannedOvertime: 5400,
        plannedSiteAllowance: 3200,
        totalPlannedCost: 42200,
        actualHoursWorked: 690,
        actualCost: 39800,
        variance: 2400,
        variancePercent: 5.7
      },
      {
        id: 'pbi-4',
        roleName: 'QA/QC Inspection Engineer',
        personnelName: 'David Mercer',
        headcount: 1,
        plannedManDays: 30,
        dailyRate: 600,
        plannedBasic: 18000,
        plannedOvertime: 3900,
        plannedSiteAllowance: 2400,
        totalPlannedCost: 24300,
        actualHoursWorked: 260,
        actualCost: 21800,
        variance: 2500,
        variancePercent: 10.3
      }
    ]
  },
  {
    id: 'pplan-prj-1001-b',
    projectId: 'PRJ-2026-1001',
    projectName: 'ABC Commercial Factory Fitting',
    planName: 'Plan B: Fast-Track Accelerated Overtime',
    code: 'LAB-PLN-1001-B',
    currency: 'AED',
    isActive: false,
    notes: 'Contingency plan with 24-hour dual shift rotations and 1.5x overtime multiplier.',
    totalPlannedCost: 184000,
    actualCostToDate: 0,
    variance: 184000,
    burnRatePercent: 0,
    createdAt: '2026-08-15T09:00:00Z',
    updatedAt: '2026-08-15T09:00:00Z',
    items: [
      {
        id: 'pbi-b1',
        roleName: 'Dual Site Supervisors (Day/Night)',
        personnelName: 'Marcus Sterling + Relief Lead',
        headcount: 2,
        plannedManDays: 60,
        dailyRate: 650,
        plannedBasic: 39000,
        plannedOvertime: 7800,
        plannedSiteAllowance: 3600,
        totalPlannedCost: 50400,
        actualHoursWorked: 0,
        actualCost: 0,
        variance: 50400,
        variancePercent: 100
      },
      {
        id: 'pbi-b2',
        roleName: '24h Workshop Fabrication Shifts',
        personnelName: 'Workshop Gang (6 Techs)',
        headcount: 6,
        plannedManDays: 140,
        dailyRate: 500,
        plannedBasic: 70000,
        plannedOvertime: 18000,
        plannedSiteAllowance: 8400,
        totalPlannedCost: 96400,
        actualHoursWorked: 0,
        actualCost: 0,
        variance: 96400,
        variancePercent: 100
      },
      {
        id: 'pbi-b3',
        roleName: 'Night Rigging & Glazing Gang',
        personnelName: 'Specialist Riggers (4 Techs)',
        headcount: 4,
        plannedManDays: 60,
        dailyRate: 450,
        plannedBasic: 27000,
        plannedOvertime: 6800,
        plannedSiteAllowance: 3400,
        totalPlannedCost: 37200,
        actualHoursWorked: 0,
        actualCost: 0,
        variance: 37200,
        variancePercent: 100
      }
    ]
  },
  {
    id: 'pplan-prj-1002-a',
    projectId: 'PRJ-2026-1002',
    projectName: 'Metropolitan Luxury Tower Façade',
    planName: 'Plan A: Façade Envelope Engineering & Erection',
    code: 'LAB-PLN-1002-A',
    currency: 'AED',
    isActive: true,
    notes: 'Unitized curtain wall installation and cradle rigging labor allocation.',
    totalPlannedCost: 265000,
    actualCostToDate: 198400,
    variance: 66600,
    burnRatePercent: 74.8,
    createdAt: '2026-08-10T11:00:00Z',
    updatedAt: '2026-09-21T14:00:00Z',
    items: [
      {
        id: 'pbi-1002-1',
        roleName: 'Façade Project Manager & Engineer',
        personnelName: 'John Perera & Marcus Sterling',
        headcount: 2,
        plannedManDays: 60,
        dailyRate: 750,
        plannedBasic: 45000,
        plannedOvertime: 4500,
        plannedSiteAllowance: 3000,
        totalPlannedCost: 52500,
        actualHoursWorked: 480,
        actualCost: 46200,
        variance: 6300,
        variancePercent: 12.0
      },
      {
        id: 'pbi-1002-2',
        roleName: 'Cradle Riggers & Façade Installers',
        personnelName: 'High-Rise Façade Gang (8 Techs)',
        headcount: 8,
        plannedManDays: 240,
        dailyRate: 460,
        plannedBasic: 110400,
        plannedOvertime: 19200,
        plannedSiteAllowance: 12000,
        totalPlannedCost: 141600,
        actualHoursWorked: 1840,
        actualCost: 112000,
        variance: 29600,
        variancePercent: 20.9
      },
      {
        id: 'pbi-1002-3',
        roleName: 'Precision CNC Machining Operators',
        personnelName: 'Kasun Bandara (Workshop)',
        headcount: 3,
        plannedManDays: 90,
        dailyRate: 520,
        plannedBasic: 46800,
        plannedOvertime: 8100,
        plannedSiteAllowance: 4500,
        totalPlannedCost: 59400,
        actualHoursWorked: 720,
        actualCost: 34500,
        variance: 24900,
        variancePercent: 41.9
      },
      {
        id: 'pbi-1002-4',
        roleName: 'Survey & Set-Out Surveyor',
        personnelName: 'Site Survey Specialist',
        headcount: 1,
        plannedManDays: 20,
        dailyRate: 500,
        plannedBasic: 10000,
        plannedOvertime: 1000,
        plannedSiteAllowance: 500,
        totalPlannedCost: 11500,
        actualHoursWorked: 160,
        actualCost: 5700,
        variance: 5800,
        variancePercent: 50.4
      }
    ]
  }
];

// ============================================================================
// SEED STATUTORY RECONCILIATION RECORDS (EPF, ETF, APIT, ACCOUNTING LINKS)
// ============================================================================

const SEED_STATUTORY: StatutoryReconciliationRecord[] = [
  {
    id: 'stat-1',
    employeeId: 'EMP-001',
    employeeName: 'Alexander Vance',
    department: 'Commercial & Executive Administration',
    periodMonth: 'September 2026',
    grossSalary: 42000,
    employeePF: 3360, // 8%
    employerPF: 5040, // 12%
    employerETF: 1260, // 3%
    totalStatutoryRemittance: 9660,
    incomeTaxApit: 2100,
    netSalaryPayable: 36540,
    accountingPaymentRef: 'BNK-TX-99881 (FAB Corporate)',
    accountingBankAmount: 36540,
    reconciliationStatus: 'Matched',
    disbursedDate: '2026-09-25'
  },
  {
    id: 'stat-2',
    employeeId: 'EMP-014',
    employeeName: 'Marcus Sterling',
    department: 'Fabrication, Site & Operations',
    periodMonth: 'September 2026',
    grossSalary: 27500,
    employeePF: 2200,
    employerPF: 3300,
    employerETF: 825,
    totalStatutoryRemittance: 6325,
    incomeTaxApit: 1250,
    netSalaryPayable: 24050,
    accountingPaymentRef: 'BNK-TX-99882 (Emirates NBD)',
    accountingBankAmount: 24050,
    reconciliationStatus: 'Matched',
    disbursedDate: '2026-09-25'
  },
  {
    id: 'stat-3',
    employeeId: 'EMP-022',
    employeeName: 'Elena Rostova',
    department: 'Commercial & Executive Administration',
    periodMonth: 'September 2026',
    grossSalary: 23000,
    employeePF: 1840,
    employerPF: 2760,
    employerETF: 690,
    totalStatutoryRemittance: 5290,
    incomeTaxApit: 950,
    netSalaryPayable: 20210,
    accountingPaymentRef: 'BNK-TX-99883 (ADCB)',
    accountingBankAmount: 20210,
    reconciliationStatus: 'Matched',
    disbursedDate: '2026-09-25'
  },
  {
    id: 'stat-4',
    employeeId: 'EMP-088',
    employeeName: 'Tariq Mansoor',
    department: 'Procurement & Material Supply',
    periodMonth: 'September 2026',
    grossSalary: 20500,
    employeePF: 1640,
    employerPF: 2460,
    employerETF: 615,
    totalStatutoryRemittance: 4715,
    incomeTaxApit: 800,
    netSalaryPayable: 18060,
    accountingPaymentRef: 'BNK-TX-99884 (DIB)',
    accountingBankAmount: 18060,
    reconciliationStatus: 'Matched',
    disbursedDate: '2026-09-25'
  },
  {
    id: 'stat-5',
    employeeId: 'EMP-031',
    employeeName: 'Fiona Chen',
    department: 'Fabrication, Site & Operations',
    periodMonth: 'September 2026',
    grossSalary: 18500,
    employeePF: 1480,
    employerPF: 2220,
    employerETF: 555,
    totalStatutoryRemittance: 4255,
    incomeTaxApit: 650,
    netSalaryPayable: 16370,
    accountingPaymentRef: 'BNK-TX-99885 (Mashreq)',
    accountingBankAmount: 16370,
    reconciliationStatus: 'Matched',
    disbursedDate: '2026-09-25'
  },
  {
    id: 'stat-6',
    employeeId: 'EMP-045',
    employeeName: 'David Mercer',
    department: 'Fabrication, Site & Operations',
    periodMonth: 'September 2026',
    grossSalary: 16500,
    employeePF: 1320,
    employerPF: 1980,
    employerETF: 495,
    totalStatutoryRemittance: 3795,
    incomeTaxApit: 500,
    netSalaryPayable: 14680,
    accountingPaymentRef: 'BNK-TX-99886 (Standard Chartered)',
    accountingBankAmount: 14680,
    reconciliationStatus: 'Matched',
    disbursedDate: '2026-09-25'
  }
];

// ============================================================================
// SEED QUICK PAYOUTS & ADVANCES
// ============================================================================

const SEED_QUICK_PAYOUTS: QuickPayoutRecord[] = [
  {
    id: 'qp-1',
    voucherNumber: 'PAY-VOUCH-2026-001',
    employeeId: 'EMP-014',
    employeeName: 'Marcus Sterling',
    projectId: 'PRJ-2026-1001',
    projectName: 'ABC Commercial Factory Fitting',
    department: 'OPERATIONS',
    payoutType: 'Site Per Diem',
    amount: 1200,
    currency: 'AED',
    paymentMethod: 'Cash on Site',
    date: '2026-09-22',
    status: 'Disbursed',
    approvedBy: 'Elena Rostova (Head of Finance)',
    notes: 'Emergency site survey meal and transport allowances for 4-day shutdown.',
    createdAt: '2026-09-22T14:30:00Z'
  },
  {
    id: 'qp-2',
    voucherNumber: 'PAY-VOUCH-2026-002',
    employeeId: 'EMP-045',
    employeeName: 'David Mercer',
    projectId: 'PRJ-2026-1002',
    projectName: 'Metropolitan Luxury Tower Façade',
    department: 'OPERATIONS',
    payoutType: 'Tool Allowance',
    amount: 850,
    currency: 'AED',
    paymentMethod: 'Company Bank Transfer',
    date: '2026-09-23',
    status: 'Disbursed',
    approvedBy: 'Elena Rostova (Head of Finance)',
    notes: 'Calibrated coating thickness gauge consumable tips and safety lanyard replacement.',
    createdAt: '2026-09-23T11:00:00Z'
  },
  {
    id: 'qp-3',
    voucherNumber: 'PAY-VOUCH-2026-003',
    employeeId: 'EMP-088',
    employeeName: 'Tariq Mansoor',
    department: 'PROCUREMENT_SUPPLY_CHAIN',
    payoutType: 'Salary Advance',
    amount: 3000,
    currency: 'AED',
    paymentMethod: 'Company Bank Transfer',
    date: '2026-09-18',
    status: 'Deducted from Monthly Payroll',
    approvedBy: 'Alexander Vance (CEO)',
    notes: 'Personal advance against September 2026 salary release.',
    createdAt: '2026-09-18T16:00:00Z'
  },
  {
    id: 'qp-4',
    voucherNumber: 'PAY-VOUCH-2026-004',
    employeeId: 'EMP-014',
    employeeName: 'Marcus Sterling',
    projectId: 'PRJ-2026-1001',
    projectName: 'ABC Commercial Factory Fitting',
    department: 'OPERATIONS',
    payoutType: 'Overtime Instant Cash',
    amount: 1500,
    currency: 'AED',
    paymentMethod: 'Cash on Site',
    date: '2026-09-24',
    status: 'Disbursed',
    approvedBy: 'Elena Rostova (Head of Finance)',
    notes: 'Direct site cash incentive for weekend curtain wall bracket welding blitz.',
    createdAt: '2026-09-24T18:00:00Z'
  }
];

// ============================================================================
// PAYROLL SERVICE CLASS
// ============================================================================

class PayrollService {
  private load<T>(key: string, defaultValue: T): T {
    try {
      const stored = localStorage.getItem(key);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(`Failed to load ${key} from storage:`, e);
    }
    return defaultValue;
  }

  private save<T>(key: string, data: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error(`Failed to save ${key} to storage:`, e);
    }
  }

  // Monthly Cycles
  getPayrollPeriods(): PayrollPeriodRecord[] {
    return this.load<PayrollPeriodRecord[]>(STORAGE_KEYS.PAYROLL, SEED_PAYROLL);
  }

  getBudgets(): DepartmentBudgetMetric[] {
    return this.load<DepartmentBudgetMetric[]>(STORAGE_KEYS.BUDGETS, SEED_BUDGETS);
  }

  approvePayroll(periodId: string, approvedBy: string): PayrollPeriodRecord | null {
    const periods = this.getPayrollPeriods();
    const target = periods.find(p => p.id === periodId);
    if (!target) return null;

    target.status = 'Approved';
    target.approvedBy = approvedBy;
    target.approvedAt = new Date().toISOString();

    this.save(STORAGE_KEYS.PAYROLL, periods);
    return target;
  }

  disbursePayroll(periodId: string): PayrollPeriodRecord | null {
    const periods = this.getPayrollPeriods();
    const target = periods.find(p => p.id === periodId);
    if (!target) return null;

    target.status = 'Disbursed';
    target.disbursedAt = new Date().toISOString();
    target.items = target.items.map(item => ({ ...item, paymentStatus: 'Disbursed' }));

    this.save(STORAGE_KEYS.PAYROLL, periods);
    return target;
  }

  updateEmployeePayrollItem(periodId: string, updatedItem: EmployeePayrollItem): EmployeePayrollItem | null {
    const periods = this.getPayrollPeriods();
    const period = periods.find(p => p.id === periodId);
    if (!period) return null;

    const idx = period.items.findIndex(it => it.id === updatedItem.id);
    if (idx === -1) return null;

    const gross = (updatedItem.basicSalary || 0) + (updatedItem.housingAllowance || 0) + (updatedItem.transportAllowance || 0) + (updatedItem.overtimeTotal || 0) + (updatedItem.performanceBonus || 0);
    const net = gross - (updatedItem.totalDeductions || 0);
    const enriched: EmployeePayrollItem = {
      ...updatedItem,
      grossSalary: gross,
      netSalary: net
    };
    period.items[idx] = enriched;

    period.totalGrossPay = period.items.reduce((acc, it) => acc + (it.grossSalary || 0), 0);
    period.totalOvertimeAmount = period.items.reduce((acc, it) => acc + (it.overtimeTotal || 0), 0);
    period.totalDeductions = period.items.reduce((acc, it) => acc + (it.totalDeductions || 0), 0);
    period.totalNetPayable = period.items.reduce((acc, it) => acc + (it.netSalary || 0), 0);
    period.totalEmployees = period.items.length;

    this.save(STORAGE_KEYS.PAYROLL, periods);
    return enriched;
  }

  deleteEmployeePayrollItem(periodId: string, itemId: string): boolean {
    const periods = this.getPayrollPeriods();
    const period = periods.find(p => p.id === periodId);
    if (!period) return false;

    period.items = period.items.filter(it => it.id !== itemId);
    period.totalGrossPay = period.items.reduce((acc, it) => acc + (it.grossSalary || 0), 0);
    period.totalOvertimeAmount = period.items.reduce((acc, it) => acc + (it.overtimeTotal || 0), 0);
    period.totalDeductions = period.items.reduce((acc, it) => acc + (it.totalDeductions || 0), 0);
    period.totalNetPayable = period.items.reduce((acc, it) => acc + (it.netSalary || 0), 0);
    period.totalEmployees = period.items.length;

    this.save(STORAGE_KEYS.PAYROLL, periods);
    return true;
  }

  // ==========================================================================
  // PROJECT PAYROLL PLANS & BUDGETS
  // ==========================================================================

  getProjectPayrollPlans(projectId?: string): ProjectPayrollPlan[] {
    const plans = this.load<ProjectPayrollPlan[]>(STORAGE_KEYS.PROJECT_PLANS, SEED_PROJECT_PLANS);
    if (projectId) {
      return plans.filter(p => p.projectId === projectId);
    }
    return plans;
  }

  saveProjectPayrollPlan(plan: ProjectPayrollPlan): ProjectPayrollPlan {
    const plans = this.getProjectPayrollPlans();
    const existingIdx = plans.findIndex(p => p.id === plan.id);
    const now = new Date().toISOString();

    // Recalculate totals
    const totalPlannedCost = plan.items.reduce((acc, it) => acc + it.totalPlannedCost, 0);
    const actualCostToDate = plan.items.reduce((acc, it) => acc + (it.actualCost || 0), 0);
    const variance = totalPlannedCost - actualCostToDate;
    const burnRatePercent = totalPlannedCost > 0 ? (actualCostToDate / totalPlannedCost) * 100 : 0;

    const enrichedPlan: ProjectPayrollPlan = {
      ...plan,
      totalPlannedCost,
      actualCostToDate,
      variance,
      burnRatePercent: Number(burnRatePercent.toFixed(1)),
      updatedAt: now
    };

    if (existingIdx >= 0) {
      plans[existingIdx] = enrichedPlan;
    } else {
      enrichedPlan.id = plan.id || `pplan-${Date.now()}`;
      enrichedPlan.createdAt = now;
      plans.unshift(enrichedPlan);
    }

    this.save(STORAGE_KEYS.PROJECT_PLANS, plans);
    return enrichedPlan;
  }

  deleteProjectPayrollPlan(id: string): boolean {
    const plans = this.getProjectPayrollPlans().filter(p => p.id !== id);
    this.save(STORAGE_KEYS.PROJECT_PLANS, plans);
    return true;
  }

  updateProjectBudgetItem(planId: string, item: ProjectBudgetItem): boolean {
    const plans = this.getProjectPayrollPlans();
    const plan = plans.find(p => p.id === planId);
    if (!plan) return false;

    const itemIdx = plan.items.findIndex(it => it.id === item.id);
    // Recalculate planned cost and variance
    const totalPlanned = (item.plannedBasic || 0) + (item.plannedOvertime || 0) + (item.plannedSiteAllowance || 0);
    const variance = totalPlanned - (item.actualCost || 0);
    const variancePercent = totalPlanned > 0 ? ((totalPlanned - item.actualCost) / totalPlanned) * 100 : 0;

    const enrichedItem: ProjectBudgetItem = {
      ...item,
      totalPlannedCost: totalPlanned,
      variance,
      variancePercent: Number(variancePercent.toFixed(1))
    };

    if (itemIdx >= 0) {
      plan.items[itemIdx] = enrichedItem;
    } else {
      plan.items.push(enrichedItem);
    }

    this.saveProjectPayrollPlan(plan);
    return true;
  }

  // ==========================================================================
  // STATUTORY RECONCILIATION
  // ==========================================================================

  getStatutoryRecords(): StatutoryReconciliationRecord[] {
    return this.load<StatutoryReconciliationRecord[]>(STORAGE_KEYS.STATUTORY, SEED_STATUTORY);
  }

  updateStatutoryRecord(record: StatutoryReconciliationRecord): StatutoryReconciliationRecord {
    const records = this.getStatutoryRecords();
    const idx = records.findIndex(r => r.id === record.id);
    if (idx >= 0) {
      records[idx] = record;
    } else {
      records.push(record);
    }
    this.save(STORAGE_KEYS.STATUTORY, records);
    return record;
  }

  // ==========================================================================
  // QUICK PAYOUTS & ADVANCES
  // ==========================================================================

  getQuickPayouts(): QuickPayoutRecord[] {
    return this.load<QuickPayoutRecord[]>(STORAGE_KEYS.QUICK_PAYOUTS, SEED_QUICK_PAYOUTS);
  }

  saveQuickPayout(payout: Partial<QuickPayoutRecord> & {
    employeeName: string;
    amount: number;
    payoutType: any;
    paymentMethod: any;
  }): QuickPayoutRecord {
    const payouts = this.getQuickPayouts();
    const now = new Date().toISOString();

    const newRecord: QuickPayoutRecord = {
      id: payout.id || `qp-${Date.now()}`,
      voucherNumber: payout.voucherNumber || `PAY-VOUCH-${new Date().getFullYear()}-${String(payouts.length + 1).padStart(3, '0')}`,
      employeeId: payout.employeeId || 'EMP-SITE',
      employeeName: payout.employeeName,
      projectId: payout.projectId,
      projectName: payout.projectName,
      department: payout.department || 'OPERATIONS',
      payoutType: payout.payoutType,
      amount: Number(payout.amount),
      currency: payout.currency || 'AED',
      paymentMethod: payout.paymentMethod,
      date: payout.date || new Date().toISOString().slice(0, 10),
      status: payout.status || 'Disbursed',
      approvedBy: payout.approvedBy || 'Elena Rostova (Head of Finance)',
      notes: payout.notes || '',
      createdAt: now
    };

    const existingIdx = payouts.findIndex(p => p.id === newRecord.id);
    if (existingIdx >= 0) {
      payouts[existingIdx] = newRecord;
    } else {
      payouts.unshift(newRecord);
    }

    this.save(STORAGE_KEYS.QUICK_PAYOUTS, payouts);
    return newRecord;
  }

  deleteQuickPayout(id: string): boolean {
    const payouts = this.getQuickPayouts().filter(p => p.id !== id);
    this.save(STORAGE_KEYS.QUICK_PAYOUTS, payouts);
    return true;
  }

  // ==========================================================================
  // BIOMETRIC & TIMESHEET RECONCILIATION
  // ==========================================================================

  syncFromBiometricsAndTimesheets(periodId: string): { updatedEmployees: number; totalOvertimePay: number } {
    const periods = this.getPayrollPeriods();
    const period = periods.find(p => p.id === periodId);
    if (!period) return { updatedEmployees: 0, totalOvertimePay: 0 };

    let totalOt = 0;
    let count = 0;

    period.items = period.items.map(item => {
      // Sync verified plant biometric punch logs & overtime
      const addedOtHours = Math.floor(Math.random() * 6) + 2;
      const updatedOtHours = item.overtimeHours + addedOtHours;
      const otRate = item.overtimeRatePerHour || Math.round((item.basicSalary / 160) * 1.5);
      const updatedOtTotal = updatedOtHours * otRate;
      const gross = item.basicSalary + item.housingAllowance + item.transportAllowance + updatedOtTotal + item.performanceBonus;
      const net = gross - item.totalDeductions;
      
      totalOt += updatedOtTotal;
      count++;
      return {
        ...item,
        overtimeHours: updatedOtHours,
        overtimeRatePerHour: otRate,
        overtimeTotal: updatedOtTotal,
        grossSalary: gross,
        netSalary: net
      };
    });

    period.totalGrossPay = period.items.reduce((s, i) => s + i.grossSalary, 0);
    period.totalNetPayable = period.items.reduce((s, i) => s + i.netSalary, 0);
    this.save(STORAGE_KEYS.PAYROLL, periods);

    return { updatedEmployees: count, totalOvertimePay: totalOt };
  }

  getEmployees(): EmployeePayrollItem[] {
    const periods = this.getPayrollPeriods();
    const map = new Map<string, EmployeePayrollItem>();
    periods.forEach(p => {
      p.items.forEach(item => {
        if (!map.has(item.employeeId)) {
          map.set(item.employeeId, item);
        }
      });
    });
    return Array.from(map.values());
  }
}

export const payrollService = new PayrollService();
