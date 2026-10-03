import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  DollarSign,
  Plus,
  FileText,
  Building2,
  Scale
} from 'lucide-react';
import { payrollService } from '../../services/payrollService';
import { PayrollPeriodRecord, EmployeePayrollItem } from '../../types/payroll';
import { GlJournalRecord } from '../../services/accountingControlService';
import { AccountingDocumentModal, AccountingDocumentSpec } from './AccountingDocumentModal';
import { toast } from 'sonner';

interface AccountingPayrollSectionProps {
  onPostJournal?: (journal: GlJournalRecord) => void;
  isAdmin: boolean;
  onNavigatePortal?: (portalView: string, subTab?: string) => void;
  canDownload?: boolean;
}

export const AccountingPayrollSection: React.FC<AccountingPayrollSectionProps> = ({
  onPostJournal,
  isAdmin,
  onNavigatePortal: _onNavigatePortal,
  canDownload = true
}) => {
  const periods = useMemo<PayrollPeriodRecord[]>(() => payrollService.getPayrollPeriods(), []);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>(periods[0]?.id || 'pay-2026-09');
  const [selectedDoc, setSelectedDoc] = useState<AccountingDocumentSpec | null>(null);

  const activePeriod = periods.find(p => p.id === selectedPeriodId) || periods[0];
  const items: EmployeePayrollItem[] = activePeriod?.items || [];

  // Totals from active payroll period
  const totals = useMemo(() => {
    if (!activePeriod || items.length === 0) {
      return { gross: 0, epfEmployer: 0, epfEmployee: 0, etf: 0, net: 0, count: 0, statutoryTotal: 0 };
    }
    const gross = activePeriod.totalGrossPay || items.reduce((s, e) => s + (e.grossSalary || 0), 0);
    const epfEmployer = Math.round(gross * 0.12);
    const epfEmployee = Math.round(gross * 0.08);
    const etf = Math.round(gross * 0.03);
    const net = activePeriod.totalNetPayable || items.reduce((s, e) => s + (e.netSalary || 0), 0);

    return {
      gross,
      epfEmployer,
      epfEmployee,
      etf,
      net,
      statutoryTotal: epfEmployer + epfEmployee + etf,
      count: items.length
    };
  }, [activePeriod, items]);

  // Handle Post to General Ledger
  const handlePostPayrollToGL = () => {
    if (!isAdmin) {
      toast.error('Permission Denied', {
        description: 'Only administrators have authority to post payroll journals into the General Ledger.'
      });
      return;
    }

    if (!onPostJournal) {
      toast.error('Posting Service Unavailable');
      return;
    }

    const periodName = activePeriod ? (activePeriod.month || activePeriod.cycleNumber) : 'Current Period';
    const journal: GlJournalRecord = {
      id: `jnl-pay-${Date.now()}`,
      journalNo: `JNL-PAY-${(activePeriod?.id || '01').toUpperCase()}`,
      date: new Date().toISOString().substring(0, 10),
      journalType: 'Payroll Post',
      reference: `PR-${activePeriod?.cycleNumber || activePeriod?.id || '2026'}`,
      description: `Monthly Payroll Allocation for ${periodName} (${totals.count} Staff)`,
      debitAccount: '5020 • Direct Fabrication & Site Glazing Labour',
      creditAccount: '1010 • Commercial Bank - Corporate LKR A/C',
      projectId: 'PRJ-2026-001',
      workPackage: 'Site Labour & Workshop',
      costCentre: 'CC-LABOUR-ALL',
      branch: 'Head Office & Plants',
      debitAmount: totals.gross + totals.epfEmployer + totals.etf,
      creditAmount: totals.gross + totals.epfEmployer + totals.etf,
      preparedBy: 'Payroll Control Engine',
      approvedBy: 'Financial Controller (Admin)',
      status: 'Posted'
    };

    onPostJournal(journal);
    toast.success('Payroll Journal Posted', {
      description: `Posted ${journal.journalNo} of LKR ${(totals.gross + totals.epfEmployer + totals.etf).toLocaleString()} to GL.`
    });
  };

  // Open Corporate Document View
  const handleOpenDoc = () => {
    if (!activePeriod) return;
    const periodName = activePeriod.month || activePeriod.cycleNumber;
    const spec: AccountingDocumentSpec = {
      docTitle: `MONTHLY PAYROLL & STATUTORY RECONCILIATION (${periodName.toUpperCase()})`,
      docNo: `DOC-PAY-${activePeriod.id.toUpperCase()}`,
      docDate: new Date().toISOString().substring(0, 10),
      category: 'Payroll & Statutory Ledger',
      strategyBox1Label: 'Gross Payroll Wages',
      strategyBox1Value: `LKR ${totals.gross.toLocaleString()}`,
      strategyBox2Label: 'Statutory EPF & ETF (23%)',
      strategyBox2Value: `LKR ${totals.statutoryTotal.toLocaleString()}`,
      strategyBox3Label: 'Net Bank Transfer Pay',
      strategyBox3Value: `LKR ${totals.net.toLocaleString()}`,
      scheduleHeaders: ['Emp No', 'Employee Name', 'Designation', 'Department', 'Gross Pay', 'Net Pay'],
      scheduleRows: items.map(emp => ({
        col1: emp.employeeId,
        col2: emp.employeeName,
        col3: emp.designation,
        col4: emp.department || 'OPERATIONS',
        col5: `LKR ${emp.grossSalary.toLocaleString()}`,
        col6: `LKR ${emp.netSalary.toLocaleString()}`
      })),
      summaryTotals: [
        { label: 'Total Gross Salaries', value: `LKR ${totals.gross.toLocaleString()}` },
        { label: 'Employer EPF (12%)', value: `LKR ${totals.epfEmployer.toLocaleString()}` },
        { label: 'Employer ETF (3%)', value: `LKR ${totals.etf.toLocaleString()}` },
        { label: 'Total Company Labour Cost', value: `LKR ${(totals.gross + totals.epfEmployer + totals.etf).toLocaleString()}` },
        { label: 'Net Disbursed Pay', value: `LKR ${totals.net.toLocaleString()}` }
      ],
      terms: [
        {
          title: 'EPF Act No. 15 of 1958 Compliance',
          content: '8% employee and 12% employer statutory contributions calculated and allocated.'
        },
        {
          title: 'Direct Labour Project Cost Allocation',
          content: 'Site installation gang wages attributed to projects based on verified attendance logs.'
        }
      ],
      preparedBy: 'Senior Payroll Specialist',
      approvedBy: 'Director of Human Capital & FC',
      authorizationStatus: 'Approved',
      auditStamp: `SYS-PAYROLL-VERIFY-${Date.now().toString(36).toUpperCase()}`
    };

    setSelectedDoc(spec);
  };

  return (
    <div className="space-y-3">
      {/* 4 KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-medium">Gross Payroll</span>
            <DollarSign size={14} className="text-orange-600" />
          </div>
          <p className="text-base font-bold text-slate-900 font-mono">
            LKR {totals.gross.toLocaleString()}
          </p>
          <span className="text-[10px] text-slate-400">{totals.count} Employees Active</span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-medium">Statutory EPF & ETF</span>
            <Scale size={14} className="text-blue-600" />
          </div>
          <p className="text-base font-bold text-slate-900 font-mono">
            LKR {totals.statutoryTotal.toLocaleString()}
          </p>
          <span className="text-[10px] text-slate-400">12% EPF + 3% ETF + 8% Employee</span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-medium">Net Bank Payout</span>
            <CreditCard size={14} className="text-emerald-600" />
          </div>
          <p className="text-base font-bold text-emerald-600 font-mono">
            LKR {totals.net.toLocaleString()}
          </p>
          <span className="text-[10px] text-emerald-500 font-medium">Direct Bank Transfer</span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-medium">Total Cost to Company</span>
            <Building2 size={14} className="text-purple-600" />
          </div>
          <p className="text-base font-bold text-slate-900 font-mono">
            LKR {(totals.gross + totals.epfEmployer + totals.etf).toLocaleString()}
          </p>
          <span className="text-[10px] text-slate-400">Direct + Indirect Labour</span>
        </div>
      </div>

      {/* Control Strip */}
      <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700">Select Payroll Period:</span>
          <select
            value={selectedPeriodId}
            onChange={e => setSelectedPeriodId(e.target.value)}
            className="py-1 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-hidden"
          >
            {periods.map(p => (
              <option key={p.id} value={p.id}>
                {p.month || p.cycleNumber} ({p.status})
              </option>
            ))}
          </select>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            {activePeriod?.status || 'Finalized'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenDoc}
            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <FileText size={13} />
            <span>Payroll Document</span>
          </button>
          <button
            onClick={handlePostPayrollToGL}
            className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Plus size={13} />
            <span>Post to General Ledger</span>
          </button>
        </div>
      </div>

      {/* Employee List Table */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-2xs overflow-hidden">
        <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-900">
            Employee Payroll Cost Allocations for {activePeriod?.month || activePeriod?.cycleNumber}
          </span>
          <span className="text-[11px] font-mono text-slate-500">
            {items.length} Staff
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                <th className="py-2.5 px-3">Emp ID</th>
                <th className="py-2.5 px-3">Employee Name</th>
                <th className="py-2.5 px-3">Designation / Role</th>
                <th className="py-2.5 px-3">Department</th>
                <th className="py-2.5 px-3 text-right">Basic Pay</th>
                <th className="py-2.5 px-3 text-right">Overtime</th>
                <th className="py-2.5 px-3 text-right">Gross Pay</th>
                <th className="py-2.5 px-3 text-right">EPF 8%</th>
                <th className="py-2.5 px-3 text-right">Net Pay</th>
                <th className="py-2.5 px-3 text-center">Payment Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map(emp => (
                <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors whitespace-nowrap">
                  <td className="py-2 px-3 font-mono font-bold text-slate-700">{emp.employeeId}</td>
                  <td className="py-2 px-3 font-semibold text-slate-900">{emp.employeeName}</td>
                  <td className="py-2 px-3 text-slate-600 text-[11px]">{emp.designation}</td>
                  <td className="py-2 px-3">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium">
                      {emp.department || 'OPERATIONS'}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-slate-700">
                    LKR {emp.basicSalary.toLocaleString()}
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-slate-600">
                    LKR {emp.overtimeTotal.toLocaleString()}
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                    LKR {emp.grossSalary.toLocaleString()}
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-rose-600">
                    LKR {Math.round(emp.grossSalary * 0.08).toLocaleString()}
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-emerald-600">
                    LKR {emp.netSalary.toLocaleString()}
                  </td>
                  <td className="py-2 px-3 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {emp.paymentStatus || 'Disbursed'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Document Modal */}
      <AccountingDocumentModal
        spec={selectedDoc}
        isOpen={Boolean(selectedDoc)}
        onClose={() => setSelectedDoc(null)}
        canDownload={canDownload}
        isAdmin={isAdmin}
      />
    </div>
  );
};
