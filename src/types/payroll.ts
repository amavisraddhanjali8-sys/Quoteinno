export type PayrollStatus = 'Draft' | 'Pending Review' | 'Approved' | 'Disbursed';

export interface EmployeePayrollItem {
  id: string;
  employeeId: string;
  employeeName: string;
  department: 'OPERATIONS' | 'COMMERCIAL_ADMIN' | 'PROCUREMENT_SUPPLY_CHAIN';
  designation: string;
  branch: string;
  basicSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  overtimeHours: number;
  overtimeRatePerHour: number;
  overtimeTotal: number;
  performanceBonus: number;
  grossSalary: number;
  pensionOrGosiDeduction: number;
  absenceOrLoanDeductions: number;
  totalDeductions: number;
  netSalary: number;
  bankName: string;
  iban: string;
  wpsRoutingCode: string;
  paymentStatus: 'Unpaid' | 'Approved' | 'Disbursed';
}

export interface PayrollPeriodRecord {
  id: string;
  month: string; // e.g. "September 2026"
  year: number;
  cycleNumber: string; // e.g. "PAY-2026-09"
  totalEmployees: number;
  totalGrossPay: number;
  totalOvertimeAmount: number;
  totalDeductions: number;
  totalNetPayable: number;
  status: PayrollStatus;
  wpsBatchReference?: string;
  preparedBy: string;
  preparedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  disbursedAt?: string;
  items: EmployeePayrollItem[];
}

export interface DepartmentBudgetMetric {
  departmentCode: string;
  departmentName: string;
  annualBudget: number;
  ytdBurnRate: number;
  committedPayroll: number;
  operationalExpenses: number;
  remainingBudget: number;
  headcount: number;
}

// ============================================================================
// PROJECT-BASED PAYROLL PLANS & BUDGETS
// ============================================================================

export interface ProjectBudgetItem {
  id: string;
  roleName: string;
  personnelName: string;
  headcount: number;
  plannedManDays: number;
  dailyRate: number;
  plannedBasic: number;
  plannedOvertime: number;
  plannedSiteAllowance: number;
  totalPlannedCost: number;
  actualHoursWorked: number;
  actualCost: number;
  variance: number;
  variancePercent: number;
}

export interface ProjectPayrollPlan {
  id: string;
  projectId: string;
  projectName: string;
  planName: string; // e.g. "Plan A: Baseline Normal Shifts", "Plan B: Fast-Track Overtime"
  code: string;
  currency: string;
  isActive: boolean;
  notes?: string;
  totalPlannedCost: number;
  actualCostToDate: number;
  variance: number;
  burnRatePercent: number;
  createdAt: string;
  updatedAt: string;
  items: ProjectBudgetItem[];
}

// ============================================================================
// DEPARTMENT-BASED PAYROLL PLANS & HEADCOUNT BUDGETS
// ============================================================================

export interface DepartmentBudgetItem {
  id: string;
  designation: string;
  employeeName: string;
  headcount: number;
  monthlyBasic: number;
  housingTransportAllowance: number;
  statutoryProvision: number;
  monthlyTotal: number;
  actualCost: number;
  variance: number;
}

export interface DepartmentPayrollPlan {
  id: string;
  departmentCode: string;
  departmentName: string;
  planName: string;
  fiscalYear: string;
  totalBudget: number;
  actualDisbursed: number;
  variance: number;
  burnRatePercent: number;
  headcount: number;
  createdAt: string;
  updatedAt: string;
  items: DepartmentBudgetItem[];
}

// ============================================================================
// STATUTORY & ACCOUNTING RECONCILIATION (PF, ETF, TAXES, PAYOUTS)
// ============================================================================

export type ReconciliationStatus = 'Matched' | 'Pending Payout' | 'Variance' | 'Reconciled';

export interface StatutoryReconciliationRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  periodMonth: string;
  grossSalary: number;
  employeePF: number; // 8% EPF
  employerPF: number; // 12% EPF
  employerETF: number; // 3% ETF
  totalStatutoryRemittance: number; // 23%
  incomeTaxApit: number;
  netSalaryPayable: number;
  accountingPaymentRef?: string;
  accountingBankAmount: number;
  reconciliationStatus: ReconciliationStatus;
  disbursedDate?: string;
  notes?: string;
}

// ============================================================================
// QUICK PAYOUTS & ADVANCES
// ============================================================================

export type QuickPayoutType = 
  | 'Salary Advance'
  | 'Site Per Diem'
  | 'Overtime Instant Cash'
  | 'Emergency Loan'
  | 'Tool Allowance'
  | 'Travel Reimbursement';

export type QuickPayoutPaymentMethod = 
  | 'Cash on Site'
  | 'Company Bank Transfer'
  | 'Cheque';

export interface QuickPayoutRecord {
  id: string;
  voucherNumber: string;
  employeeId: string;
  employeeName: string;
  projectId?: string;
  projectName?: string;
  department: string;
  payoutType: QuickPayoutType;
  amount: number;
  currency: string;
  paymentMethod: QuickPayoutPaymentMethod;
  date: string;
  status: 'Disbursed' | 'Pending Verification' | 'Deducted from Monthly Payroll';
  approvedBy: string;
  notes: string;
  createdAt: string;
}
