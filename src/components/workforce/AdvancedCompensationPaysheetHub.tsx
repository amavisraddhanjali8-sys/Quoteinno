import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  Scale,
  Plus,
  Trash2,
  X,
  FileSpreadsheet,
  CreditCard,
  Coffee,
  Printer,
  Settings,
  Download
} from 'lucide-react';
import { hrService } from '../../services/hrService';
import {
  EmployeeComprehensiveSetup,
  EmployeeAttendanceShiftState,
  EmployeeLoanSetup,
  SriLankaStatutoryConfig,
  CalculatedEmployeePaysheet,
  SpecialBonusEntry
} from '../../types/hr';
import { downloadCSV } from '../../services/dataExportService';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';

interface AdvancedCompensationPaysheetHubProps {
  initialSection?: 'paysheet' | 'loans' | 'statutory' | 'meals-fund';
}

export const AdvancedCompensationPaysheetHub: React.FC<AdvancedCompensationPaysheetHubProps> = ({
  initialSection = 'paysheet'
}) => {
  const [activeSection, setActiveSection] = useState<'paysheet' | 'loans' | 'statutory' | 'meals-fund'>(initialSection);

  // Data States
  const [setups, setSetups] = useState<EmployeeComprehensiveSetup[]>(() => hrService.getEmployeeComprehensiveSetups());
  const [shiftStates, setShiftStates] = useState<EmployeeAttendanceShiftState[]>(() => hrService.getEmployeeShiftStates());
  const [loans, setLoans] = useState<EmployeeLoanSetup[]>(() => hrService.getEmployeeLoans());
  const [statutoryConfig, setStatutoryConfig] = useState<SriLankaStatutoryConfig>(() => hrService.getSriLankaStatutoryConfig());

  // Modals
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);
  const [viewingPayslip, setViewingPayslip] = useState<CalculatedEmployeePaysheet | null>(null);
  const [showAddLoanModal, setShowAddLoanModal] = useState(false);

  // New Loan Form
  const [loanForm, setLoanForm] = useState({
    employeeId: 'EMP-041',
    loanTitle: 'Company Staff Loan',
    principalAmount: 60000,
    interestRatePercent: 0,
    repaymentMonths: 6
  });

  // New Allowance / Special Bonus inside Employee Setup Modal
  const [newAllowance, setNewAllowance] = useState({ name: '', amount: 5000, epfEligible: false });
  const [newSpecialBonus, setNewSpecialBonus] = useState<{
    bonusType: SpecialBonusEntry['bonusType'];
    label: string;
    amount: number;
  }>({
    bonusType: 'Performance Bonus',
    label: '',
    amount: 10000
  });

  const refreshAll = () => {
    setSetups(hrService.getEmployeeComprehensiveSetups());
    setShiftStates(hrService.getEmployeeShiftStates());
    setLoans(hrService.getEmployeeLoans());
    setStatutoryConfig(hrService.getSriLankaStatutoryConfig());
  };

  const calculatedPaysheets = useMemo(() => {
    return setups.map(s => hrService.calculateEmployeePaysheet(s.employeeId));
  }, [setups, shiftStates, loans, statutoryConfig]);

  const activeEditSetup = useMemo(() => {
    if (!editingEmployeeId) return null;
    return setups.find(s => s.employeeId === editingEmployeeId) || null;
  }, [editingEmployeeId, setups]);

  const activeEditShift = useMemo(() => {
    if (!editingEmployeeId) return null;
    return shiftStates.find(s => s.employeeId === editingEmployeeId) || null;
  }, [editingEmployeeId, shiftStates]);

  const handleSaveStatutoryRates = (e: React.FormEvent) => {
    e.preventDefault();
    hrService.saveSriLankaStatutoryConfig(statutoryConfig);
    refreshAll();
    toast.success('Sri Lankan EPF / ETF Rates Updated');
  };

  const handleCreateLoan = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = setups.find(s => s.employeeId === loanForm.employeeId) || setups[0];
    hrService.saveEmployeeLoan({
      employeeId: emp.employeeId,
      employeeName: emp.employeeName,
      loanTitle: loanForm.loanTitle || 'Staff Advance Loan',
      principalAmount: Number(loanForm.principalAmount) || 0,
      interestRatePercent: Number(loanForm.interestRatePercent) || 0,
      repaymentMonths: Number(loanForm.repaymentMonths) || 1,
      paidMonths: 0
    });
    refreshAll();
    setShowAddLoanModal(false);
    toast.success('Loan & Paysheet Repayment Scheduled');
  };

  const handleExportPaysheetsCSV = () => {
    const headers = [
      'EMP ID',
      'Name',
      'Basic',
      'Allowances',
      'Overtime Pay',
      'Meal Benefit Add',
      'Meal Deduction',
      'Bonuses',
      'Contract & Comm',
      'Gratuity',
      'Gross Pay',
      `EPF Emp (${statutoryConfig.epfEmployeeRate}%)`,
      'Loan Deduction',
      'Net Salary',
      `EPF Employer (${statutoryConfig.epfEmployerRate}%)`,
      `ETF Employer (${statutoryConfig.etfEmployerRate}%)`
    ];
    const rows = calculatedPaysheets.map(p => [
      p.employeeId,
      p.employeeName,
      p.basicSalary,
      p.totalAllowances,
      p.overtimePay,
      p.unclaimedMealBenefitAddition,
      p.mealSalaryDeduction,
      p.regularBonus + p.specialBonusesTotal,
      p.contractPayout + p.commissionAmount,
      p.gratuityPayoutInSlip,
      p.grossEarnings,
      p.epfEmployeeDeduction,
      p.totalLoanDeduction,
      p.netPayableSalary,
      p.epfEmployerContribution,
      p.etfEmployerContribution
    ]);
    downloadCSV(`master-paysheet-${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
  };

  return (
    <div className="space-y-3">
      {/* White Header Bar - Few Words, No Descriptions */}
      <div className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-orange-500 text-white flex items-center justify-center shrink-0">
            <DollarSign size={15} />
          </div>
          <h2 className="text-sm font-bold text-slate-900">
            Compensation, EPF/ETF, Loans & Paysheet Hub
          </h2>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Sri Lanka Law (EPF {statutoryConfig.epfEmployeeRate}% / {statutoryConfig.epfEmployerRate}% • ETF {statutoryConfig.etfEmployerRate}%)
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { id: 'paysheet', label: 'Master Paysheet', icon: FileSpreadsheet },
            { id: 'loans', label: `Loans & Funds (${loans.length})`, icon: CreditCard },
            { id: 'meals-fund', label: 'Meal Funds & OT Quotas', icon: Coffee },
            { id: 'statutory', label: 'EPF / ETF Rate Setup', icon: Scale }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as any)}
              className={cn(
                "px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer",
                activeSection === tab.id
                  ? "bg-orange-600 text-white shadow-2xs"
                  : "bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100"
              )}
            >
              <tab.icon size={12} />
              <span>{tab.label}</span>
            </button>
          ))}

          <button
            onClick={handleExportPaysheetsCSV}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center gap-1 cursor-pointer"
          >
            <Download size={12} />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* =================================================================== */}
      {/* SECTION 1: MASTER PAYSHEET REGISTER (ONE-LINE ROW LIST VIEW)        */}
      {/* =================================================================== */}
      {activeSection === 'paysheet' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                  <th className="py-2.5 px-2.5">EMP ID</th>
                  <th className="py-2.5 px-2.5">Employee</th>
                  <th className="py-2.5 px-2.5 text-right">Basic</th>
                  <th className="py-2.5 px-2.5 text-right">Allowances</th>
                  <th className="py-2.5 px-2.5 text-right">OT Pay</th>
                  <th className="py-2.5 px-2.5 text-right">Meal Add/Ded</th>
                  <th className="py-2.5 px-2.5 text-right">Bonuses</th>
                  <th className="py-2.5 px-2.5 text-right">Contract/Comm</th>
                  <th className="py-2.5 px-2.5 text-right">Gratuity</th>
                  <th className="py-2.5 px-2.5 text-right">Gross</th>
                  <th className="py-2.5 px-2.5 text-right">EPF ({statutoryConfig.epfEmployeeRate}%)</th>
                  <th className="py-2.5 px-2.5 text-right">Loans</th>
                  <th className="py-2.5 px-2.5 text-right bg-emerald-50/60">Net Salary</th>
                  <th className="py-2.5 px-2.5 text-right">EPF/ETF ({statutoryConfig.epfEmployerRate + statutoryConfig.etfEmployerRate}%)</th>
                  <th className="py-2.5 px-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 whitespace-nowrap">
                {calculatedPaysheets.map(ps => (
                  <tr key={ps.employeeId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2 px-2.5 font-mono font-bold text-slate-800">{ps.employeeId}</td>
                    <td className="py-2 px-2.5 font-semibold text-slate-900">{ps.employeeName}</td>
                    <td className="py-2 px-2.5 text-right font-mono text-slate-700">{ps.basicSalary.toLocaleString()}</td>
                    <td className="py-2 px-2.5 text-right font-mono text-slate-700">{ps.totalAllowances.toLocaleString()}</td>
                    <td className="py-2 px-2.5 text-right font-mono text-amber-700 font-semibold">
                      {ps.overtimePay.toLocaleString()} <span className="text-[10px] text-slate-400">({ps.completedOtHours}h)</span>
                    </td>
                    <td className="py-2 px-2.5 text-right font-mono">
                      {ps.unclaimedMealBenefitAddition > 0 ? (
                        <span className="text-emerald-700 font-bold">+{ps.unclaimedMealBenefitAddition.toLocaleString()}</span>
                      ) : ps.mealSalaryDeduction > 0 ? (
                        <span className="text-rose-600 font-bold">-{ps.mealSalaryDeduction.toLocaleString()}</span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="py-2 px-2.5 text-right font-mono text-indigo-700 font-semibold">
                      {(ps.regularBonus + ps.specialBonusesTotal).toLocaleString()}
                    </td>
                    <td className="py-2 px-2.5 text-right font-mono text-sky-700 font-semibold">
                      {(ps.contractPayout + ps.commissionAmount).toLocaleString()}
                    </td>
                    <td className="py-2 px-2.5 text-right font-mono text-slate-600">
                      {ps.gratuityPayoutInSlip > 0 ? (
                        <span className="text-emerald-700 font-bold">+{ps.gratuityPayoutInSlip.toLocaleString()}</span>
                      ) : (
                        <span title="Accrued Gratuity">{ps.accruedTotalGratuity.toLocaleString()} (Accr)</span>
                      )}
                    </td>
                    <td className="py-2 px-2.5 text-right font-mono font-bold text-slate-900">{ps.grossEarnings.toLocaleString()}</td>
                    <td className="py-2 px-2.5 text-right font-mono text-rose-600">-{ps.epfEmployeeDeduction.toLocaleString()}</td>
                    <td className="py-2 px-2.5 text-right font-mono text-rose-600">
                      {ps.totalLoanDeduction > 0 ? `-${ps.totalLoanDeduction.toLocaleString()}` : '0'}
                    </td>
                    <td className="py-2 px-2.5 text-right font-mono font-bold text-emerald-800 bg-emerald-50/40">
                      LKR {ps.netPayableSalary.toLocaleString()}
                    </td>
                    <td className="py-2 px-2.5 text-right font-mono text-slate-600">
                      {(ps.epfEmployerContribution + ps.etfEmployerContribution).toLocaleString()}
                    </td>
                    <td className="py-2 px-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditingEmployeeId(ps.employeeId)}
                          className="px-2 py-0.5 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded text-[10px] font-bold cursor-pointer"
                        >
                          Setup
                        </button>
                        <button
                          onClick={() => setViewingPayslip(ps)}
                          className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-semibold cursor-pointer"
                        >
                          Slip
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* SECTION 2: EMPLOYEE LOANS & FUNDS REPAYMENT LEDGER (ONE-LINE ROWS)  */}
      {/* =================================================================== */}
      {activeSection === 'loans' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900">Employee Loans & Funds Repayments (Auto-Deducted on Paysheet)</span>
            <button
              onClick={() => setShowAddLoanModal(true)}
              className="px-2.5 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Plus size={12} />
              <span>Assign Loan / Fund</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                  <th className="py-2.5 px-3">EMP ID</th>
                  <th className="py-2.5 px-3">Employee</th>
                  <th className="py-2.5 px-3">Loan / Fund Title</th>
                  <th className="py-2.5 px-3 text-right">Principal</th>
                  <th className="py-2.5 px-3 text-center">Interest %</th>
                  <th className="py-2.5 px-3 text-center">Months</th>
                  <th className="py-2.5 px-3 text-right">Monthly Principal</th>
                  <th className="py-2.5 px-3 text-right">Monthly Interest</th>
                  <th className="py-2.5 px-3 text-right">Paysheet Deduction</th>
                  <th className="py-2.5 px-3 text-right">Balance</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 whitespace-nowrap">
                {loans.map(ln => (
                  <tr key={ln.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2 px-3 font-mono font-bold text-slate-800">{ln.employeeId}</td>
                    <td className="py-2 px-3 font-semibold text-slate-900">{ln.employeeName}</td>
                    <td className="py-2 px-3 text-slate-700">{ln.loanTitle}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">LKR {ln.principalAmount.toLocaleString()}</td>
                    <td className="py-2 px-3 text-center font-mono">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-bold",
                        ln.interestRatePercent === 0 ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-800 border border-amber-200"
                      )}>
                        {ln.interestRatePercent}% {ln.interestRatePercent === 0 ? '(Zero)' : ''}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center font-mono text-slate-600">{ln.paidMonths}/{ln.repaymentMonths}</td>
                    <td className="py-2 px-3 text-right font-mono text-slate-700">LKR {ln.monthlyPrincipal.toLocaleString()}</td>
                    <td className="py-2 px-3 text-right font-mono text-slate-700">LKR {ln.monthlyInterest.toLocaleString()}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-rose-600">-LKR {ln.monthlyInstallment.toLocaleString()}/mo</td>
                    <td className="py-2 px-3 text-right font-mono font-semibold text-slate-800">LKR {ln.remainingBalance.toLocaleString()}</td>
                    <td className="py-2 px-3 text-right">
                      <button
                        onClick={() => {
                          hrService.deleteEmployeeLoan(ln.id);
                          refreshAll();
                          toast.success('Loan removed');
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                      >
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* SECTION 3: MEAL FUNDS & OVERTIME QUOTA RULES (ONE-LINE ROWS)        */}
      {/* =================================================================== */}
      {activeSection === 'meals-fund' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900">Employee Shift, Overtime Quotas & Meal/Tea Fund Rules</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                  <th className="py-2.5 px-3">EMP ID</th>
                  <th className="py-2.5 px-3">Employee</th>
                  <th className="py-2.5 px-3">Shift Time</th>
                  <th className="py-2.5 px-3 text-center">OT Eligible</th>
                  <th className="py-2.5 px-3 text-center">Assigned OT</th>
                  <th className="py-2.5 px-3 text-center">Completed OT</th>
                  <th className="py-2.5 px-3 text-center">Company Meal Fund?</th>
                  <th className="py-2.5 px-3 text-right">Allocated Fund</th>
                  <th className="py-2.5 px-3 text-right">Scanned Meals</th>
                  <th className="py-2.5 px-3 text-center">Unclaimed to Benefit?</th>
                  <th className="py-2.5 px-3 text-right">Paysheet Impact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 whitespace-nowrap">
                {shiftStates.map(st => {
                  const ps = calculatedPaysheets.find(p => p.employeeId === st.employeeId);
                  return (
                    <tr key={st.employeeId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2 px-3 font-mono font-bold text-slate-800">{st.employeeId}</td>
                      <td className="py-2 px-3 font-semibold text-slate-900">{st.employeeName}</td>
                      <td className="py-2 px-3 font-mono text-slate-600">{st.shiftStartTime} - {st.shiftEndTime}</td>
                      <td className="py-2 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={st.isOvertimeEligible}
                          onChange={(e) => {
                            hrService.saveEmployeeShiftState({ ...st, isOvertimeEligible: e.target.checked });
                            refreshAll();
                          }}
                          className="accent-orange-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-2 px-3 text-center">
                        <input
                          type="number"
                          value={st.assignedOvertimeHours}
                          onChange={(e) => {
                            hrService.saveEmployeeShiftState({ ...st, assignedOvertimeHours: Number(e.target.value) });
                            refreshAll();
                          }}
                          className="w-16 px-1.5 py-0.5 text-center font-mono bg-slate-50 border border-slate-200 rounded text-xs"
                        />
                      </td>
                      <td className="py-2 px-3 text-center font-mono font-bold text-amber-700">
                        {st.completedOvertimeHours}h / {st.assignedOvertimeHours}h
                      </td>
                      <td className="py-2 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={st.isCompanyMealFunded}
                          onChange={(e) => {
                            hrService.saveEmployeeShiftState({
                              ...st,
                              isCompanyMealFunded: e.target.checked,
                              monthlyMealFundAllocated: e.target.checked ? (st.monthlyMealFundAllocated || 12000) : 0
                            });
                            refreshAll();
                          }}
                          className="accent-emerald-600 cursor-pointer"
                        />
                      </td>
                      <td className="py-2 px-3 text-right">
                        <input
                          type="number"
                          disabled={!st.isCompanyMealFunded}
                          value={st.monthlyMealFundAllocated}
                          onChange={(e) => {
                            hrService.saveEmployeeShiftState({ ...st, monthlyMealFundAllocated: Number(e.target.value) });
                            refreshAll();
                          }}
                          className="w-24 px-2 py-0.5 text-right font-mono bg-slate-50 border border-slate-200 rounded text-xs disabled:opacity-40"
                        />
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-slate-700">
                        LKR {st.claimedMealsTotalLKR.toLocaleString()}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <input
                          type="checkbox"
                          disabled={!st.isCompanyMealFunded}
                          checked={st.allowUnclaimedMealToBenefits}
                          onChange={(e) => {
                            hrService.saveEmployeeShiftState({ ...st, allowUnclaimedMealToBenefits: e.target.checked });
                            refreshAll();
                          }}
                          className="accent-orange-500 cursor-pointer disabled:opacity-40"
                        />
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold">
                        {ps && ps.unclaimedMealBenefitAddition > 0 ? (
                          <span className="text-emerald-700">+LKR {ps.unclaimedMealBenefitAddition.toLocaleString()} (Benefit)</span>
                        ) : ps && ps.mealSalaryDeduction > 0 ? (
                          <span className="text-rose-600">-LKR {ps.mealSalaryDeduction.toLocaleString()} (Deduct)</span>
                        ) : (
                          <span className="text-slate-400">LKR 0</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* SECTION 4: SRI LANKAN STATUTORY EPF / ETF RATE CONFIGURATION        */}
      {/* =================================================================== */}
      {activeSection === 'statutory' && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <form onSubmit={handleSaveStatutoryRates} className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Employee EPF Rate (%)</label>
              <input
                type="number"
                step="0.1"
                value={statutoryConfig.epfEmployeeRate}
                onChange={(e) => setStatutoryConfig({ ...statutoryConfig, epfEmployeeRate: Number(e.target.value) })}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Employer EPF Rate (%)</label>
              <input
                type="number"
                step="0.1"
                value={statutoryConfig.epfEmployerRate}
                onChange={(e) => setStatutoryConfig({ ...statutoryConfig, epfEmployerRate: Number(e.target.value) })}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Employer ETF Rate (%)</label>
              <input
                type="number"
                step="0.1"
                value={statutoryConfig.etfEmployerRate}
                onChange={(e) => setStatutoryConfig({ ...statutoryConfig, etfEmployerRate: Number(e.target.value) })}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Gratuity Factor / Yr</label>
              <input
                type="number"
                step="0.05"
                value={statutoryConfig.gratuityRatePerYear}
                onChange={(e) => setStatutoryConfig({ ...statutoryConfig, gratuityRatePerYear: Number(e.target.value) })}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-900"
              />
            </div>
            <div>
              <button
                type="submit"
                className="w-full py-1.5 px-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg shadow-xs cursor-pointer"
              >
                Save Sri Lanka Rates
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: INDIVIDUAL EMPLOYEE COMPENSATION SETUP                       */}
      {/* =================================================================== */}
      {activeEditSetup && activeEditShift && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-4xl w-full p-5 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Settings size={16} className="text-orange-500" />
                <h3 className="text-sm font-bold text-slate-900">
                  Employee Compensation Setup — {activeEditSetup.employeeName} ({activeEditSetup.employeeId})
                </h3>
              </div>
              <button onClick={() => setEditingEmployeeId(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            {/* Row 1: Basic, Service Years, Regular Bonus, Contract Payout, Commission */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Basic Salary (LKR)</label>
                <input
                  type="number"
                  value={activeEditSetup.basicSalary}
                  onChange={(e) => {
                    hrService.saveEmployeeComprehensiveSetup({ ...activeEditSetup, basicSalary: Number(e.target.value) });
                    refreshAll();
                  }}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Service Years (Gratuity)</label>
                <input
                  type="number"
                  value={activeEditSetup.yearsOfService}
                  onChange={(e) => {
                    hrService.saveEmployeeComprehensiveSetup({ ...activeEditSetup, yearsOfService: Number(e.target.value) });
                    refreshAll();
                  }}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Regular Bonus (LKR)</label>
                <input
                  type="number"
                  value={activeEditSetup.regularBonus}
                  onChange={(e) => {
                    hrService.saveEmployeeComprehensiveSetup({ ...activeEditSetup, regularBonus: Number(e.target.value) });
                    refreshAll();
                  }}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Contract Payout (LKR)</label>
                <input
                  type="number"
                  value={activeEditSetup.contractPayoutAmount}
                  onChange={(e) => {
                    hrService.saveEmployeeComprehensiveSetup({ ...activeEditSetup, contractPayoutAmount: Number(e.target.value) });
                    refreshAll();
                  }}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                />
              </div>
            </div>

            {/* Row 2: Commissions, Tax & Gratuity Payout Toggle */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs items-end">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Commission Sales Base</label>
                <input
                  type="number"
                  value={activeEditSetup.commissionSalesVolume}
                  onChange={(e) => {
                    hrService.saveEmployeeComprehensiveSetup({ ...activeEditSetup, commissionSalesVolume: Number(e.target.value) });
                    refreshAll();
                  }}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Commission Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={activeEditSetup.commissionRatePercent}
                  onChange={(e) => {
                    hrService.saveEmployeeComprehensiveSetup({ ...activeEditSetup, commissionRatePercent: Number(e.target.value) });
                    refreshAll();
                  }}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">APIT Tax Deduction</label>
                <input
                  type="number"
                  value={activeEditSetup.apitTaxDeduction}
                  onChange={(e) => {
                    hrService.saveEmployeeComprehensiveSetup({ ...activeEditSetup, apitTaxDeduction: Number(e.target.value) });
                    refreshAll();
                  }}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                />
              </div>
              <label className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={activeEditSetup.includeGratuityInPaysheet}
                  onChange={(e) => {
                    hrService.saveEmployeeComprehensiveSetup({ ...activeEditSetup, includeGratuityInPaysheet: e.target.checked });
                    refreshAll();
                  }}
                  className="accent-orange-500"
                />
                <span className="font-semibold text-slate-800">Pay Gratuity in Slip</span>
              </label>
            </div>

            {/* Two Columns: Allowances & Special Bonuses with Types */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Allowances */}
              <div className="border border-slate-200 rounded-xl p-3 space-y-2">
                <div className="font-bold text-slate-800">Allowances Setup</div>
                <div className="divide-y divide-slate-100">
                  {activeEditSetup.allowances.map(al => (
                    <div key={al.id} className="py-1.5 flex items-center justify-between gap-2">
                      <span className="text-slate-800 font-medium truncate">{al.name} {al.epfEligible ? '(EPF)' : ''}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold">LKR {al.amount.toLocaleString()}</span>
                        <button
                          onClick={() => {
                            const next = activeEditSetup.allowances.filter(x => x.id !== al.id);
                            hrService.saveEmployeeComprehensiveSetup({ ...activeEditSetup, allowances: next });
                            refreshAll();
                          }}
                          className="text-slate-400 hover:text-rose-600 cursor-pointer"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5">
                  <input
                    type="text"
                    placeholder="Allowance name..."
                    value={newAllowance.name}
                    onChange={(e) => setNewAllowance({ ...newAllowance, name: e.target.value })}
                    className="flex-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs"
                  />
                  <input
                    type="number"
                    value={newAllowance.amount}
                    onChange={(e) => setNewAllowance({ ...newAllowance, amount: Number(e.target.value) })}
                    className="w-20 px-2 py-1 bg-slate-50 border border-slate-200 rounded font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newAllowance.name.trim()) return;
                      const next = [
                        ...activeEditSetup.allowances,
                        { id: `al-${Date.now()}`, name: newAllowance.name, amount: newAllowance.amount, epfEligible: newAllowance.epfEligible }
                      ];
                      hrService.saveEmployeeComprehensiveSetup({ ...activeEditSetup, allowances: next });
                      setNewAllowance({ name: '', amount: 5000, epfEligible: false });
                      refreshAll();
                    }}
                    className="px-2.5 py-1 bg-orange-600 text-white rounded font-bold cursor-pointer"
                  >
                    + Add
                  </button>
                </div>
              </div>

              {/* Special Bonuses with Types */}
              <div className="border border-slate-200 rounded-xl p-3 space-y-2">
                <div className="font-bold text-slate-800">Special Bonuses with Types</div>
                <div className="divide-y divide-slate-100">
                  {activeEditSetup.specialBonuses.map(sb => (
                    <div key={sb.id} className="py-1.5 flex items-center justify-between gap-2">
                      <div className="truncate">
                        <span className="px-1.5 py-0.2 bg-indigo-50 text-indigo-700 rounded text-[10px] font-bold mr-1.5">{sb.bonusType}</span>
                        <span className="text-slate-700">{sb.label}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono font-bold text-indigo-700">LKR {sb.amount.toLocaleString()}</span>
                        <button
                          onClick={() => {
                            const next = activeEditSetup.specialBonuses.filter(x => x.id !== sb.id);
                            hrService.saveEmployeeComprehensiveSetup({ ...activeEditSetup, specialBonuses: next });
                            refreshAll();
                          }}
                          className="text-slate-400 hover:text-rose-600 cursor-pointer"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 flex-wrap">
                  <select
                    value={newSpecialBonus.bonusType}
                    onChange={(e) => setNewSpecialBonus({ ...newSpecialBonus, bonusType: e.target.value as any })}
                    className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs"
                  >
                    <option value="Performance Bonus">Performance Bonus</option>
                    <option value="Attendance Bonus">Attendance Bonus</option>
                    <option value="Festival / Avurudu Bonus">Festival / Avurudu Bonus</option>
                    <option value="Project Milestone Bonus">Project Milestone Bonus</option>
                    <option value="Safety Zero-LTI Bonus">Safety Zero-LTI Bonus</option>
                    <option value="Special Custom Bonus">Special Custom Bonus</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Bonus title..."
                    value={newSpecialBonus.label}
                    onChange={(e) => setNewSpecialBonus({ ...newSpecialBonus, label: e.target.value })}
                    className="flex-1 min-w-[100px] px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs"
                  />
                  <input
                    type="number"
                    value={newSpecialBonus.amount}
                    onChange={(e) => setNewSpecialBonus({ ...newSpecialBonus, amount: Number(e.target.value) })}
                    className="w-20 px-2 py-1 bg-slate-50 border border-slate-200 rounded font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const next = [
                        ...activeEditSetup.specialBonuses,
                        {
                          id: `sb-${Date.now()}`,
                          bonusType: newSpecialBonus.bonusType,
                          label: newSpecialBonus.label || newSpecialBonus.bonusType,
                          amount: newSpecialBonus.amount
                        }
                      ];
                      hrService.saveEmployeeComprehensiveSetup({ ...activeEditSetup, specialBonuses: next });
                      setNewSpecialBonus({ ...newSpecialBonus, label: '', amount: 10000 });
                      refreshAll();
                    }}
                    className="px-2.5 py-1 bg-indigo-600 text-white rounded font-bold cursor-pointer"
                  >
                    + Add
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setEditingEmployeeId(null)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Done & Recalculate Paysheet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: ADD LOAN / FUND REPAYMENT                                    */}
      {/* =================================================================== */}
      {showAddLoanModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-md w-full p-5 space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Assign Employee Loan / Fund</h3>
              <button onClick={() => setShowAddLoanModal(false)} className="text-slate-400 hover:text-slate-700">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreateLoan} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Employee</label>
                <select
                  value={loanForm.employeeId}
                  onChange={(e) => setLoanForm({ ...loanForm, employeeId: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  {setups.map(s => (
                    <option key={s.employeeId} value={s.employeeId}>{s.employeeName} ({s.employeeId})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Loan / Fund Title</label>
                <input
                  required
                  type="text"
                  value={loanForm.loanTitle}
                  onChange={(e) => setLoanForm({ ...loanForm, loanTitle: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Principal (LKR)</label>
                  <input
                    type="number"
                    required
                    value={loanForm.principalAmount}
                    onChange={(e) => setLoanForm({ ...loanForm, principalAmount: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Interest % (0 = Zero)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={loanForm.interestRatePercent}
                    onChange={(e) => setLoanForm({ ...loanForm, interestRatePercent: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Months</label>
                  <input
                    type="number"
                    min="1"
                    value={loanForm.repaymentMonths}
                    onChange={(e) => setLoanForm({ ...loanForm, repaymentMonths: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddLoanModal(false)} className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 bg-orange-600 text-white font-bold rounded-lg cursor-pointer">
                  Save Loan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: DETAILED PAYSLIP VIEW                                        */}
      {/* =================================================================== */}
      {viewingPayslip && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-lg w-full p-5 space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Employee Paysheet — {viewingPayslip.employeeName}</h3>
                <span className="font-mono text-[10px] text-slate-500">{viewingPayslip.employeeId} • {viewingPayslip.designation}</span>
              </div>
              <button onClick={() => setViewingPayslip(null)} className="text-slate-400 hover:text-slate-700">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-1.5 divide-y divide-slate-100">
              <div className="py-1 flex justify-between"><span>Basic Salary:</span><strong className="font-mono">LKR {viewingPayslip.basicSalary.toLocaleString()}</strong></div>
              <div className="py-1 flex justify-between"><span>Total Allowances:</span><strong className="font-mono">LKR {viewingPayslip.totalAllowances.toLocaleString()}</strong></div>
              <div className="py-1 flex justify-between text-amber-700"><span>Approved Overtime ({viewingPayslip.completedOtHours}/{viewingPayslip.assignedOtHours}h):</span><strong className="font-mono">LKR {viewingPayslip.overtimePay.toLocaleString()}</strong></div>
              {viewingPayslip.unclaimedMealBenefitAddition > 0 && (
                <div className="py-1 flex justify-between text-emerald-700"><span>Unclaimed Meal/Tea Fund Added to Benefits:</span><strong className="font-mono">+LKR {viewingPayslip.unclaimedMealBenefitAddition.toLocaleString()}</strong></div>
              )}
              <div className="py-1 flex justify-between text-indigo-700"><span>Bonuses & Special Bonuses:</span><strong className="font-mono">LKR {(viewingPayslip.regularBonus + viewingPayslip.specialBonusesTotal).toLocaleString()}</strong></div>
              <div className="py-1 flex justify-between text-sky-700"><span>Contracts & Commissions:</span><strong className="font-mono">LKR {(viewingPayslip.contractPayout + viewingPayslip.commissionAmount).toLocaleString()}</strong></div>
              {viewingPayslip.gratuityPayoutInSlip > 0 && (
                <div className="py-1 flex justify-between text-emerald-700"><span>Gratuity Settlement Payout:</span><strong className="font-mono">+LKR {viewingPayslip.gratuityPayoutInSlip.toLocaleString()}</strong></div>
              )}
              <div className="py-1.5 flex justify-between font-bold text-slate-900 bg-slate-50 px-2 rounded"><span>Gross Earnings:</span><span className="font-mono">LKR {viewingPayslip.grossEarnings.toLocaleString()}</span></div>

              <div className="py-1 flex justify-between text-rose-600"><span>Employee EPF ({viewingPayslip.epfEmployeeRate}%):</span><strong className="font-mono">-LKR {viewingPayslip.epfEmployeeDeduction.toLocaleString()}</strong></div>
              {viewingPayslip.totalLoanDeduction > 0 && (
                <div className="py-1 flex justify-between text-rose-600"><span>Loan Repayment (Principal {viewingPayslip.loanPrincipalDeduction.toLocaleString()} + Int {viewingPayslip.loanInterestDeduction.toLocaleString()}):</span><strong className="font-mono">-LKR {viewingPayslip.totalLoanDeduction.toLocaleString()}</strong></div>
              )}
              {viewingPayslip.mealSalaryDeduction > 0 && (
                <div className="py-1 flex justify-between text-rose-600"><span>Meals / Tea Deduction (Unfunded/Excess):</span><strong className="font-mono">-LKR {viewingPayslip.mealSalaryDeduction.toLocaleString()}</strong></div>
              )}
              {viewingPayslip.lateDeduction > 0 && (
                <div className="py-1 flex justify-between text-rose-600"><span>Late Arrival Deduction ({viewingPayslip.lateMinutesMonth}m):</span><strong className="font-mono">-LKR {viewingPayslip.lateDeduction.toLocaleString()}</strong></div>
              )}
              {viewingPayslip.apitTaxDeduction > 0 && (
                <div className="py-1 flex justify-between text-rose-600"><span>APIT Tax Deduction:</span><strong className="font-mono">-LKR {viewingPayslip.apitTaxDeduction.toLocaleString()}</strong></div>
              )}

              <div className="py-2 flex justify-between font-bold text-sm text-emerald-900 bg-emerald-50 px-2.5 rounded-lg">
                <span>Net Payable Salary:</span>
                <span className="font-mono">LKR {viewingPayslip.netPayableSalary.toLocaleString()}</span>
              </div>

              <div className="pt-2 text-[11px] text-slate-500 space-y-0.5">
                <div className="flex justify-between"><span>Employer EPF ({viewingPayslip.epfEmployerRate}%):</span><span className="font-mono">LKR {viewingPayslip.epfEmployerContribution.toLocaleString()}</span></div>
                <div className="flex justify-between"><span>Employer ETF ({viewingPayslip.etfEmployerRate}%):</span><span className="font-mono">LKR {viewingPayslip.etfEmployerContribution.toLocaleString()}</span></div>
                <div className="flex justify-between"><span>Accrued Total Gratuity:</span><span className="font-mono">LKR {viewingPayslip.accruedTotalGratuity.toLocaleString()}</span></div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => window.print()} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold flex items-center gap-1 cursor-pointer">
                <Printer size={12} />
                <span>Print</span>
              </button>
              <button onClick={() => setViewingPayslip(null)} className="px-4 py-1.5 bg-slate-900 text-white rounded-lg font-bold cursor-pointer">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
