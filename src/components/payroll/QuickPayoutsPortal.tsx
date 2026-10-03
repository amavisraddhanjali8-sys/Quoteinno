import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  Plus,
  Search,
  CheckCircle2,
  Printer,
  ArrowLeft,
  X,
  FileText
} from 'lucide-react';
import {
  QuickPayoutRecord,
  QuickPayoutType,
  QuickPayoutPaymentMethod
} from '../../types/payroll';
import { payrollService } from '../../services/payrollService';

export interface QuickPayoutsPortalProps {
  onBackToLanding?: () => void;
}

export const QuickPayoutsPortal: React.FC<QuickPayoutsPortalProps> = ({
  onBackToLanding
}) => {
  const [payouts, setPayouts] = useState<QuickPayoutRecord[]>(() =>
    payrollService.getQuickPayouts()
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');

  // New payout modal
  const [isNewPayoutModalOpen, setIsNewPayoutModalOpen] = useState(false);
  const [selectedEmployeeName, setSelectedEmployeeName] = useState('Kasun Bandara');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('EMP-FAB-02');
  const [selectedProjectName, setSelectedProjectName] = useState('ABC Commercial Factory Fitting');
  const [selectedProjectId, setSelectedProjectId] = useState('PRJ-2026-1001');
  const [payoutType, setPayoutType] = useState<QuickPayoutType>('Site Per Diem');
  const [amount, setAmount] = useState<number>(500);
  const [paymentMethod, setPaymentMethod] = useState<QuickPayoutPaymentMethod>('Cash on Site');
  const [notes, setNotes] = useState('');

  // Voucher preview modal
  const [activeVoucher, setActiveVoucher] = useState<QuickPayoutRecord | null>(null);

  // Flash message
  const [flash, setFlash] = useState<string | null>(null);
  const showFlash = (msg: string) => {
    setFlash(msg);
    setTimeout(() => setFlash(null), 3000);
  };

  const refreshPayouts = () => {
    setPayouts(payrollService.getQuickPayouts());
  };

  const filteredPayouts = useMemo(() => {
    return payouts.filter(p => {
      const matchSearch =
        p.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.voucherNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.projectName && p.projectName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        p.notes.toLowerCase().includes(searchQuery.toLowerCase());
      const matchType = selectedTypeFilter === 'ALL' || p.payoutType === selectedTypeFilter;
      return matchSearch && matchType;
    });
  }, [payouts, searchQuery, selectedTypeFilter]);

  const totalDisbursed = useMemo(() => {
    return payouts.reduce((acc, p) => acc + p.amount, 0);
  }, [payouts]);

  const handleRecordPayout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeName.trim() || amount <= 0) return;

    const created = payrollService.saveQuickPayout({
      employeeName: selectedEmployeeName,
      employeeId: selectedEmployeeId,
      projectName: selectedProjectName,
      projectId: selectedProjectId,
      payoutType,
      amount,
      paymentMethod,
      currency: 'AED',
      notes: notes.trim(),
      status: 'Disbursed'
    });

    refreshPayouts();
    setIsNewPayoutModalOpen(false);
    setActiveVoucher(created);
    setNotes('');
    showFlash(`Recorded ${created.voucherNumber}: AED ${created.amount} for ${created.employeeName}`);
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

          <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
            <CreditCard className="w-4 h-4" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold tracking-tight text-slate-900">
                Quick Payouts, Advances & Expense Vouchers
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                Instant Disbursements
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Record salary advances, emergency loans, site per diems, overtime cash, and print payment vouchers.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsNewPayoutModalOpen(true)}
            className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Quick Payout</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 border border-slate-200 shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print Payout Register</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
            Total Quick Disbursements
          </span>
          <div className="text-lg font-bold text-slate-900 font-mono mt-1">
            AED {totalDisbursed.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500">{payouts.length} Issued vouchers</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
            Salary Advances Active
          </span>
          <div className="text-lg font-bold text-blue-700 font-mono mt-1">
            AED {payouts.filter(p => p.payoutType === 'Salary Advance').reduce((acc, p) => acc + p.amount, 0).toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500">Scheduled for monthly deduction</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
            Site Per Diem & Cash OT
          </span>
          <div className="text-lg font-bold text-amber-700 font-mono mt-1">
            AED {payouts.filter(p => p.payoutType === 'Site Per Diem' || p.payoutType === 'Overtime Instant Cash').reduce((acc, p) => acc + p.amount, 0).toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500">Expensed directly to project</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
            Disbursement Status
          </span>
          <div className="text-lg font-bold text-emerald-700 font-mono mt-1">
            100% Verified
          </div>
          <span className="text-[10px] text-emerald-600 font-medium">Signed payment slips</span>
        </div>
      </div>

      {/* Payouts Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs space-y-2">
        <div className="p-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search voucher, worker, or notes..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs overflow-x-auto">
            {['ALL', 'Salary Advance', 'Site Per Diem', 'Overtime Instant Cash', 'Tool Allowance'].map(t => (
              <button
                key={t}
                onClick={() => setSelectedTypeFilter(t)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedTypeFilter === t
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-600">
              <tr>
                <th className="py-2.5 px-3">Voucher Ref</th>
                <th className="py-2.5 px-3">Recipient Employee</th>
                <th className="py-2.5 px-3">Project / Department</th>
                <th className="py-2.5 px-2">Payout Classification</th>
                <th className="py-2.5 px-2 text-right">Disbursed Amount</th>
                <th className="py-2.5 px-2">Payment Method</th>
                <th className="py-2.5 px-2">Date</th>
                <th className="py-2.5 px-3">Notes & Reason</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredPayouts.map(rec => (
                <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-blue-700">
                    {rec.voucherNumber}
                  </td>

                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-900">{rec.employeeName}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{rec.employeeId}</div>
                  </td>

                  <td className="py-3 px-3">
                    <div className="text-slate-800 font-medium">{rec.projectName || rec.department}</div>
                  </td>

                  <td className="py-3 px-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                      {rec.payoutType}
                    </span>
                  </td>

                  <td className="py-3 px-2 text-right font-mono font-black text-slate-900">
                    AED {rec.amount.toLocaleString()}
                  </td>

                  <td className="py-3 px-2 text-slate-600 text-[11px]">
                    {rec.paymentMethod}
                  </td>

                  <td className="py-3 px-2 font-mono text-[11px] text-slate-500">
                    {rec.date}
                  </td>

                  <td className="py-3 px-3 text-[11px] text-slate-600 max-w-[200px] truncate" title={rec.notes}>
                    {rec.notes || 'No description'}
                  </td>

                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => setActiveVoucher(rec)}
                      className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold flex items-center gap-1 ml-auto cursor-pointer"
                    >
                      <FileText className="w-3 h-3 text-slate-500" />
                      <span>Voucher</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: RECORD QUICK PAYOUT                                                */}
      {/* ========================================================================= */}
      {isNewPayoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Record Quick Cash / Advance Payout
              </h3>
              <button
                onClick={() => setIsNewPayoutModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordPayout} className="p-5 space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Recipient Employee <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={selectedEmployeeName}
                    onChange={(e) => setSelectedEmployeeName(e.target.value)}
                    placeholder="e.g. Kasun Bandara"
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-amber-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Employee ID
                  </label>
                  <input
                    type="text"
                    value={selectedEmployeeId}
                    onChange={(e) => setSelectedEmployeeId(e.target.value)}
                    placeholder="EMP-..."
                    className="w-full text-xs px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Linked Project
                </label>
                <select
                  value={selectedProjectName}
                  onChange={(e) => {
                    setSelectedProjectName(e.target.value);
                    if (e.target.value.includes('ABC')) setSelectedProjectId('PRJ-2026-1001');
                    else setSelectedProjectId('PRJ-2026-1002');
                  }}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                >
                  <option value="ABC Commercial Factory Fitting">ABC Commercial Factory Fitting (PRJ-2026-1001)</option>
                  <option value="Metropolitan Luxury Tower Façade">Metropolitan Luxury Tower Façade (PRJ-2026-1002)</option>
                  <option value="General Operations & Fabrication Yard">General Operations & Fabrication Yard</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Payout Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={payoutType}
                    onChange={(e) => setPayoutType(e.target.value as any)}
                    className="w-full text-xs px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="Site Per Diem">Site Per Diem</option>
                    <option value="Salary Advance">Salary Advance</option>
                    <option value="Overtime Instant Cash">Overtime Instant Cash</option>
                    <option value="Emergency Loan">Emergency Loan</option>
                    <option value="Tool Allowance">Tool Allowance</option>
                    <option value="Travel Reimbursement">Travel Reimbursement</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Disbursed Amount (AED) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono font-bold focus:outline-hidden focus:ring-1 focus:ring-amber-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                >
                  <option value="Cash on Site">Cash on Site</option>
                  <option value="Company Bank Transfer">Company Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Purpose / Justification
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Urgent site food allowance for extended evening shift..."
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-amber-500 focus:bg-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewPayoutModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Issue Payout Voucher</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: OFFICIAL PAYOUT VOUCHER VIEW                                       */}
      {/* ========================================================================= */}
      {activeVoucher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Disbursement Voucher: {activeVoucher.voucherNumber}
                </h3>
              </div>
              <button
                onClick={() => setActiveVoucher(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="border border-slate-300 rounded-xl p-4 bg-slate-50/50 space-y-3 font-mono">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-xs">
                  <div>
                    <span className="font-black text-blue-700">INNOVISTA</span>{' '}
                    <span className="font-black text-slate-900">METAL</span>
                  </div>
                  <span className="text-[10px] text-slate-500">{activeVoucher.date}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Recipient</span>
                    <strong className="text-slate-900">{activeVoucher.employeeName}</strong>
                    <div className="text-[10px] text-slate-500">{activeVoucher.employeeId}</div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Classification</span>
                    <strong className="text-amber-800">{activeVoucher.payoutType}</strong>
                    <div className="text-[10px] text-slate-500">{activeVoucher.paymentMethod}</div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Total Disbursed:</span>
                  <span className="text-base font-black text-slate-900">
                    AED {activeVoucher.amount.toLocaleString()}
                  </span>
                </div>

                {activeVoucher.notes && (
                  <div className="pt-2 border-t border-slate-200 text-[10px] text-slate-600 italic">
                    Reason: {activeVoucher.notes}
                  </div>
                )}

                <div className="pt-4 border-t border-slate-300 grid grid-cols-2 gap-4 text-[10px] text-slate-400 text-center">
                  <div className="border-t border-slate-400 pt-1">
                    Authorized Signatory
                  </div>
                  <div className="border-t border-slate-400 pt-1">
                    Recipient Signature
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50">
              <button
                onClick={() => window.print()}
                className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Voucher</span>
              </button>
              <button
                onClick={() => setActiveVoucher(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
