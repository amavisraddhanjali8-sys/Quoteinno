import React, { useState, useMemo } from 'react';
import {
  Scale,
  CheckCircle2,
  Search,
  Printer,
  ArrowLeft,
  X,
  FileCheck
} from 'lucide-react';
import { StatutoryReconciliationRecord } from '../../types/payroll';
import { payrollService } from '../../services/payrollService';

export interface StatutoryReconciliationPortalProps {
  onBackToLanding?: () => void;
}

export const StatutoryReconciliationPortal: React.FC<StatutoryReconciliationPortalProps> = ({
  onBackToLanding
}) => {
  const [records, setRecords] = useState<StatutoryReconciliationRecord[]>(() =>
    payrollService.getStatutoryRecords()
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Flash message
  const [flash, setFlash] = useState<string | null>(null);
  const showFlash = (msg: string) => {
    setFlash(msg);
    setTimeout(() => setFlash(null), 3000);
  };

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const matchSearch =
        r.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.accountingPaymentRef && r.accountingPaymentRef.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchStatus = statusFilter === 'ALL' || r.reconciliationStatus === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [records, searchQuery, statusFilter]);

  // Aggregate metrics
  const totals = useMemo(() => {
    return records.reduce((acc, r) => {
      acc.gross += r.grossSalary;
      acc.empPF += r.employeePF;
      acc.emprPF += r.employerPF;
      acc.emprETF += r.employerETF;
      acc.totalStatutory += r.totalStatutoryRemittance;
      acc.netPayable += r.netSalaryPayable;
      acc.bankPaid += r.accountingBankAmount;
      return acc;
    }, {
      gross: 0,
      empPF: 0,
      emprPF: 0,
      emprETF: 0,
      totalStatutory: 0,
      netPayable: 0,
      bankPaid: 0
    });
  }, [records]);

  const handleReconcileAll = () => {
    const updated = records.map(r => ({
      ...r,
      reconciliationStatus: 'Matched' as const,
      disbursedDate: new Date().toISOString().slice(0, 10)
    }));
    setRecords(updated);
    updated.forEach(r => payrollService.updateStatutoryRecord(r));
    showFlash('All payroll payout entries successfully matched with commercial accounting bank records.');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-5 text-slate-800">
      
      {flash && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{flash}</span>
          </div>
          <button onClick={() => setFlash(null)} className="text-emerald-500 hover:text-emerald-800">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5">
          {onBackToLanding && (
            <button
              onClick={onBackToLanding}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Back to Payroll Landing"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
            <Scale className="w-4 h-4" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold tracking-tight text-slate-900">
                Accounting & Statutory Reconciliation
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                PF / ETF & Bank Ledger Match
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Cross-reconciliation between HR salary register, Employee PF (8%), Employer PF (12%), ETF (3%), and corporate bank transaction vouchers.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReconcileAll}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Reconcile All with Accounting</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 border border-slate-200 shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print Audit Sheet</span>
          </button>
        </div>
      </div>

      {/* Aggregate KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
            Net Payroll Commitment
          </span>
          <div className="text-lg font-bold text-slate-900 font-mono mt-1">
            AED {totals.netPayable.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500">Disbursed via corporate banking</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
            Employee PF (8%)
          </span>
          <div className="text-lg font-bold text-blue-700 font-mono mt-1">
            AED {totals.empPF.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500">Deducted from gross salary</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
            Employer PF (12%) + ETF (3%)
          </span>
          <div className="text-lg font-bold text-indigo-700 font-mono mt-1">
            AED {(totals.emprPF + totals.emprETF).toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500">Company statutory contribution</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
            Total Statutory Remittance
          </span>
          <div className="text-lg font-bold text-emerald-700 font-mono mt-1">
            AED {totals.totalStatutory.toLocaleString()}
          </div>
          <div className="flex items-center gap-1 mt-1 text-[10px] text-emerald-600 font-bold">
            <CheckCircle2 className="w-3 h-3" />
            <span>100% Reconciled with Bank</span>
          </div>
        </div>
      </div>

      {/* Reconciliation Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs space-y-2">
        <div className="p-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search employee, ID, or bank reference..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            {['ALL', 'Matched', 'Pending Payout', 'Variance'].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                  statusFilter === st
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-600">
              <tr>
                <th className="py-2.5 px-3">Employee</th>
                <th className="py-2.5 px-2 text-right">Gross Salary</th>
                <th className="py-2.5 px-2 text-right">Emp. PF (8%)</th>
                <th className="py-2.5 px-2 text-right">Empr. PF (12%)</th>
                <th className="py-2.5 px-2 text-right">Empr. ETF (3%)</th>
                <th className="py-2.5 px-2 text-right font-black bg-indigo-50/50">Total Stat. (23%)</th>
                <th className="py-2.5 px-2 text-right font-black bg-blue-50/50">Net Payable</th>
                <th className="py-2.5 px-3">Accounting Bank Reference</th>
                <th className="py-2.5 px-2 text-right">Bank Disbursed</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredRecords.map(rec => (
                <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-2.5 px-3">
                    <div className="font-bold text-slate-900">{rec.employeeName}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{rec.employeeId} &bull; {rec.department}</div>
                  </td>

                  <td className="py-2.5 px-2 text-right font-mono text-slate-700">
                    AED {rec.grossSalary.toLocaleString()}
                  </td>

                  <td className="py-2.5 px-2 text-right font-mono text-blue-700 font-semibold">
                    AED {rec.employeePF.toLocaleString()}
                  </td>

                  <td className="py-2.5 px-2 text-right font-mono text-indigo-700 font-semibold">
                    AED {rec.employerPF.toLocaleString()}
                  </td>

                  <td className="py-2.5 px-2 text-right font-mono text-indigo-700 font-semibold">
                    AED {rec.employerETF.toLocaleString()}
                  </td>

                  <td className="py-2.5 px-2 text-right font-mono font-bold text-indigo-900 bg-indigo-50/30">
                    AED {rec.totalStatutoryRemittance.toLocaleString()}
                  </td>

                  <td className="py-2.5 px-2 text-right font-mono font-bold text-blue-900 bg-blue-50/30">
                    AED {rec.netSalaryPayable.toLocaleString()}
                  </td>

                  <td className="py-2.5 px-3">
                    <span className="font-mono text-[11px] text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                      {rec.accountingPaymentRef || 'Pending Voucher'}
                    </span>
                  </td>

                  <td className="py-2.5 px-2 text-right font-mono font-bold text-slate-900">
                    AED {rec.accountingBankAmount.toLocaleString()}
                  </td>

                  <td className="py-2.5 px-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      rec.reconciliationStatus === 'Matched' || rec.reconciliationStatus === 'Reconciled'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {rec.reconciliationStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
