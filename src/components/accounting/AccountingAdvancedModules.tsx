import React, { useState } from 'react';
import {
  Plus,
  X,
  Trash2,
  Wrench,
  FileText,
  ShieldCheck,
  AlertCircle,
  Calendar
} from 'lucide-react';
import { cn } from '../../lib/utils';
import {
  BankReconcileRecord,
  PettyCashRecord,
  ProjectCommitmentWipRecord,
  FixedAssetAccountingRecord,
  TaxStatutoryRecord,
  PeriodCloseStepRecord,
  AccountsPayableRecord
} from '../../services/accountingControlService';
import { Invoice } from '../../types';
import { toast } from 'sonner';

interface BankAndCashSectionProps {
  bankRecords: BankReconcileRecord[];
  pettyRecords: PettyCashRecord[];
  onUpdateBank: (next: BankReconcileRecord[]) => void;
  onUpdatePetty: (next: PettyCashRecord[]) => void;
  isAddingBank: boolean;
  setIsAddingBank: (open: boolean) => void;
  isAdmin?: boolean;
  onAddNotification?: (title: string, message: string, type?: any) => void;
}

export const BankAndCashSection: React.FC<BankAndCashSectionProps> = ({
  bankRecords,
  pettyRecords,
  onUpdateBank,
  onUpdatePetty,
  isAddingBank,
  setIsAddingBank,
  isAdmin = true,
  onAddNotification
}) => {
  const [isAddingPetty, setIsAddingPetty] = useState(false);
  const [bankForm, setBankForm] = useState({
    bankAccount: 'Commercial Bank LKR (1010)',
    currency: 'LKR' as 'LKR' | 'USD',
    statementDate: new Date().toISOString().split('T')[0],
    statementRef: `STMT-CEFT-992${bankRecords.length + 15}`,
    counterparty: '',
    description: '',
    amount: 500000,
    type: 'Deposit' as BankReconcileRecord['type'],
    glMatchRef: 'PAY-2026-4110'
  });

  const [pettyForm, setPettyForm] = useState({
    voucherNo: `PCV-2026-30${pettyRecords.length + 3}`,
    date: new Date().toISOString().split('T')[0],
    branchSite: 'Sirius Mall Site Office',
    projectId: 'PRJ-2026-001',
    category: 'Site Expense' as PettyCashRecord['category'],
    description: '',
    custodian: 'Kasun Perera',
    amount: 12500
  });

  const handleSaveBank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankForm.counterparty.trim()) return;
    const created: BankReconcileRecord = {
      id: `bnk-${Date.now()}`,
      ...bankForm,
      amount: Number(bankForm.amount),
      matchStatus: 'Matched'
    };
    onUpdateBank([created, ...bankRecords]);
    setIsAddingBank(false);
  };

  const handleSavePetty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pettyForm.description.trim()) return;
    const created: PettyCashRecord = {
      id: `pc-${Date.now()}`,
      ...pettyForm,
      amount: Number(pettyForm.amount),
      physicalCountVerified: true,
      status: 'Approved & Posted'
    };
    onUpdatePetty([created, ...pettyRecords]);
    setIsAddingPetty(false);
  };

  return (
    <div className="space-y-3">
      {/* Table 5A: Multi-Currency Bank Statement Reconciliation */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-2xs overflow-hidden">
        <div className="px-4 py-2.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 bg-slate-50/40">
          <span className="text-xs font-bold text-slate-900">
            5A. Multi-Currency Bank Accounts & Statement Reconciliation (LKR / USD)
          </span>
          <button
            onClick={() => setIsAddingBank(true)}
            className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
          >
            <Plus size={13} />
            <span>Add Bank Statement Line</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                <th className="py-2 px-3">Bank Account</th>
                <th className="py-2 px-3">Date & Ref</th>
                <th className="py-2 px-3">Counterparty</th>
                <th className="py-2 px-3">Description</th>
                <th className="py-2 px-3">Book GL Match</th>
                <th className="py-2 px-3 text-right">Amount</th>
                <th className="py-2 px-3 text-center">Match Status</th>
                <th className="py-2 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bankRecords.map(b => (
                <tr key={b.id} className="hover:bg-slate-50/70 transition-colors whitespace-nowrap">
                  <td className="py-2 px-3 font-semibold text-slate-900">{b.bankAccount}</td>
                  <td className="py-2 px-3 font-mono text-[11px] text-slate-600">
                    {b.statementDate} • {b.statementRef}
                  </td>
                  <td className="py-2 px-3 font-medium text-slate-800">{b.counterparty}</td>
                  <td className="py-2 px-3 text-slate-600 max-w-[200px] truncate">{b.description}</td>
                  <td className="py-2 px-3 font-mono text-[11px] text-blue-700 font-semibold">{b.glMatchRef}</td>
                  <td
                    className={cn(
                      'py-2 px-3 text-right font-mono font-bold',
                      b.amount >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    )}
                  >
                    {b.currency} {b.amount.toLocaleString()}
                  </td>
                  <td className="py-2 px-3 text-center">
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded text-[10px] font-bold border',
                        b.matchStatus === 'Matched'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      )}
                    >
                      {b.matchStatus}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {b.matchStatus !== 'Matched' && (
                        <button
                          onClick={() =>
                            onUpdateBank(
                              bankRecords.map(item =>
                                item.id === b.id
                                  ? { ...item, matchStatus: 'Matched', glMatchRef: 'JNL-AUTO-FX' }
                                  : item
                              )
                            )
                          }
                          className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded text-[10px] font-semibold cursor-pointer"
                        >
                          Match GL
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (b.matchStatus === 'Matched' || (b.glMatchRef && b.glMatchRef !== '—')) {
                            const warn = `Cannot delete statement line: Entry ${b.statementRef} is matched with book ledger (${b.glMatchRef}). Reconciled records cannot be deleted until unlinked.`;
                            toast.error('Reconciled Record Protection', { description: warn });
                            onAddNotification?.('Deletion Prevented: Matched Bank Record', warn, 'warning');
                            return;
                          }
                          if (!isAdmin) {
                            toast.error('Permission Denied', {
                              description: 'Only administrators have authority to delete bank statement records.'
                            });
                            onAddNotification?.('Permission Denied', 'Only administrators can delete bank statement records.', 'warning');
                            return;
                          }
                          onUpdateBank(bankRecords.filter(item => item.id !== b.id));
                          toast.success('Record Deleted', { description: `Statement line ${b.statementRef} deleted.` });
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                        title={isAdmin ? "Delete Statement Entry (Admin)" : "Admin authority required to delete"}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Table 5B: Site Petty Cash & Imprest Verification */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-2xs overflow-hidden">
        <div className="px-4 py-2.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 bg-slate-50/40">
          <span className="text-xs font-bold text-slate-900">
            5B. Site Petty Cash & Imprest Expense Vouchers
          </span>
          <button
            onClick={() => setIsAddingPetty(true)}
            className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
          >
            <Plus size={13} />
            <span>Log Petty Cash Voucher</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                <th className="py-2 px-3">Voucher #</th>
                <th className="py-2 px-3">Site / Branch</th>
                <th className="py-2 px-3">Project (FK)</th>
                <th className="py-2 px-3">Category</th>
                <th className="py-2 px-3">Description</th>
                <th className="py-2 px-3">Custodian</th>
                <th className="py-2 px-3 text-right">Amount</th>
                <th className="py-2 px-3 text-center">Status</th>
                <th className="py-2 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pettyRecords.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/70 transition-colors whitespace-nowrap">
                  <td className="py-2 px-3 font-mono font-bold text-slate-900">{p.voucherNo}</td>
                  <td className="py-2 px-3 font-medium text-slate-800">{p.branchSite}</td>
                  <td className="py-2 px-3 font-mono text-[11px] font-semibold text-orange-700">{p.projectId}</td>
                  <td className="py-2 px-3">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]">
                      {p.category}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-slate-600">{p.description}</td>
                  <td className="py-2 px-3 text-slate-700">{p.custodian}</td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                    LKR {p.amount.toLocaleString()}
                  </td>
                  <td className="py-2 px-3 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {p.status}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right">
                    <button
                      onClick={() => {
                        if (!isAdmin) {
                          toast.error('Permission Denied', {
                            description: 'Only administrators have authority to delete petty cash vouchers.'
                          });
                          onAddNotification?.('Permission Denied', 'Only administrators can delete petty cash vouchers.', 'warning');
                          return;
                        }
                        onUpdatePetty(pettyRecords.filter(item => item.id !== p.id));
                        toast.success('Voucher Deleted', { description: `Petty cash voucher ${p.voucherNo} deleted.` });
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                      title={isAdmin ? "Delete Voucher (Admin)" : "Admin authority required to delete"}
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

      {isAddingBank && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Add Bank Statement Transaction</h3>
              <button onClick={() => setIsAddingBank(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveBank} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Counterparty *</label>
                <input
                  type="text"
                  required
                  value={bankForm.counterparty}
                  onChange={e => setBankForm({ ...bankForm, counterparty: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  value={bankForm.description}
                  onChange={e => setBankForm({ ...bankForm, description: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Amount</label>
                  <input
                    type="number"
                    value={bankForm.amount}
                    onChange={e => setBankForm({ ...bankForm, amount: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">GL Match Ref</label>
                  <input
                    type="text"
                    value={bankForm.glMatchRef}
                    onChange={e => setBankForm({ ...bankForm, glMatchRef: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddingBank(false)}
                  className="px-4 py-1.5 border border-slate-200 rounded-xl text-xs font-medium text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold"
                >
                  Save Line
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isAddingPetty && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Log Site Petty Cash Voucher</h3>
              <button onClick={() => setIsAddingPetty(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSavePetty} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Expense Description *</label>
                <input
                  type="text"
                  required
                  value={pettyForm.description}
                  onChange={e => setPettyForm({ ...pettyForm, description: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Amount (LKR)</label>
                  <input
                    type="number"
                    value={pettyForm.amount}
                    onChange={e => setPettyForm({ ...pettyForm, amount: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Project</label>
                  <input
                    type="text"
                    value={pettyForm.projectId}
                    onChange={e => setPettyForm({ ...pettyForm, projectId: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddingPetty(false)}
                  className="px-4 py-1.5 border border-slate-200 rounded-xl text-xs font-medium text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold"
                >
                  Save Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

interface ProjectWipSectionProps {
  wipRecords: ProjectCommitmentWipRecord[];
  onNavigatePortal?: (portalView: string, subTab?: string) => void;
}

export const ProjectWipSection: React.FC<ProjectWipSectionProps> = ({
  wipRecords,
  onNavigatePortal
}) => {
  return (
    <div className="bg-white border border-slate-200/80 rounded-xl shadow-2xs overflow-hidden">
      <div className="px-4 py-2.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 bg-slate-50/40">
        <span className="text-xs font-bold text-slate-900">
          6. Project Cost Control, PO Commitments, Estimate at Completion (EAC) & Unbilled WIP
        </span>
        <div className="flex items-center gap-1.5">
          {onNavigatePortal && (
            <>
              <button
                onClick={() => onNavigatePortal('post-evaluation')}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Open Cost Post-Evaluation
              </button>
              <button
                onClick={() => onNavigatePortal('variation-manager')}
                className="px-2.5 py-1 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Contract Variations
              </button>
            </>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
              <th className="py-2 px-3">Project (FK)</th>
              <th className="py-2 px-3">Work Package</th>
              <th className="py-2 px-3 text-right">Revised Budget</th>
              <th className="py-2 px-3 text-right">PO Committed</th>
              <th className="py-2 px-3 text-right">Actual Cost</th>
              <th className="py-2 px-3 text-right">Forecast EAC</th>
              <th className="py-2 px-3 text-right">Budget Variance</th>
              <th className="py-2 px-3 text-right">Unbilled WIP</th>
              <th className="py-2 px-3 text-center">Margin Guard</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {wipRecords.map(w => {
              const variance = w.revisedBudget - w.forecastFinalCost;
              return (
                <tr key={w.id} className="hover:bg-slate-50/70 transition-colors whitespace-nowrap">
                  <td className="py-2 px-3">
                    <span className="font-mono font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                      {w.projectId}
                    </span>{' '}
                    <span className="font-semibold text-slate-900 ml-1">{w.projectName}</span>
                  </td>
                  <td className="py-2 px-3">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]">
                      {w.workPackage}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-slate-800">
                    LKR {w.revisedBudget.toLocaleString()}
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-blue-700">
                    LKR {w.poCommitted.toLocaleString()}
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-semibold text-slate-900">
                    LKR {w.actualCost.toLocaleString()}
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                    LKR {w.forecastFinalCost.toLocaleString()}
                  </td>
                  <td
                    className={cn(
                      'py-2 px-3 text-right font-mono font-bold',
                      variance >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    )}
                  >
                    {variance >= 0 ? '+' : ''}LKR {variance.toLocaleString()}
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-semibold text-purple-700">
                    LKR {w.unbilledWip.toLocaleString()}
                  </td>
                  <td className="py-2 px-3 text-center">
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded text-[10px] font-bold border',
                        w.status === 'Healthy'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      )}
                    >
                      {w.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

interface AssetsTaxCloseSectionProps {
  assetRecords: FixedAssetAccountingRecord[];
  taxRecords: TaxStatutoryRecord[];
  closeSteps: PeriodCloseStepRecord[];
  invoices?: Invoice[];
  apRecords?: AccountsPayableRecord[];
  isAdmin?: boolean;
  canDownload?: boolean;
  onOpenCorporateReport?: (reportType: string) => void;
  onUpdateAssets: (next: FixedAssetAccountingRecord[]) => void;
  onUpdateTax: (next: TaxStatutoryRecord[]) => void;
  onUpdateCloseSteps: (next: PeriodCloseStepRecord[]) => void;
  isAddingAsset: boolean;
  setIsAddingAsset: (open: boolean) => void;
  onNavigatePortal?: (portalView: string, subTab?: string) => void;
}

export const AssetsTaxCloseSection: React.FC<AssetsTaxCloseSectionProps> = ({
  assetRecords,
  taxRecords,
  closeSteps,
  invoices = [],
  apRecords = [],
  isAdmin = true,
  canDownload = true,
  onOpenCorporateReport,
  onUpdateAssets,
  onUpdateTax,
  onUpdateCloseSteps,
  isAddingAsset,
  setIsAddingAsset,
  onNavigatePortal
}) => {
  // Live Statutory Tax Computations
  const totalBilledRevenue = invoices.reduce((s, inv) => s + (inv.grandTotal || 0), 0);
  const totalMaterialCosts = apRecords.reduce((s, a) => s + a.grossAmount, 0);
  const outputVatRate = 0.18;
  const outputVatAmount = Math.round(totalBilledRevenue * outputVatRate);
  const inputVatAmount = Math.round(totalMaterialCosts * outputVatRate);
  const netVatPayable = Math.max(0, outputVatAmount - inputVatAmount);

  // Corporate Income Tax (30% on taxable net profit)
  const estimatedTaxableProfit = Math.max(0, totalBilledRevenue - totalMaterialCosts - 1500000);
  const corporateIncomeTax = Math.round(estimatedTaxableProfit * 0.30);
  const quarterlyCitInstallment = Math.round(corporateIncomeTax / 4);

  // Statutory Tax Deadlines Schedule
  const statutorySchedules = [
    { title: 'VAT Return & Remittance', basis: '18% Output vs Input VAT', frequency: 'Monthly', dueDate: '20th of next month', status: 'Due Soon', estimatedAmount: netVatPayable },
    { title: 'Corporate Income Tax - Q1 Installment', basis: '30% Corporate Tax Advance', frequency: 'Quarter 1', dueDate: '15th August', status: 'Upcoming', estimatedAmount: quarterlyCitInstallment },
    { title: 'Corporate Income Tax - Q2 Installment', basis: '30% Corporate Tax Advance', frequency: 'Quarter 2', dueDate: '15th November', status: 'Upcoming', estimatedAmount: quarterlyCitInstallment },
    { title: 'Corporate Income Tax - Q3 Installment', basis: '30% Corporate Tax Advance', frequency: 'Quarter 3', dueDate: '15th February', status: 'Upcoming', estimatedAmount: quarterlyCitInstallment },
    { title: 'Corporate Income Tax - Q4 Installment', basis: '30% Corporate Tax Advance', frequency: 'Quarter 4', dueDate: '15th May', status: 'Upcoming', estimatedAmount: quarterlyCitInstallment },
    { title: 'Annual Corporate Income Tax Return', basis: 'Final Audited Accounts Filing', frequency: 'Annual', dueDate: '30th November', status: 'Scheduled', estimatedAmount: corporateIncomeTax }
  ];
  const [assetForm, setAssetForm] = useState({
    assetCode: `FA-EQ-00${assetRecords.length + 4}`,
    equipmentRef: 'EQ-NEW-04',
    assetName: '',
    category: 'CNC Machinery' as FixedAssetAccountingRecord['category'],
    cost: 3600000,
    usefulLifeYears: 5,
    assignedProject: 'Main Fabrication Plant'
  });

  const handleSaveAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetForm.assetName.trim()) return;
    const monthly = Math.round(Number(assetForm.cost) / (Number(assetForm.usefulLifeYears) * 12));
    const created: FixedAssetAccountingRecord = {
      id: `fa-${Date.now()}`,
      assetCode: assetForm.assetCode,
      equipmentRef: assetForm.equipmentRef,
      assetName: assetForm.assetName,
      category: assetForm.category,
      acquisitionDate: new Date().toISOString().split('T')[0],
      cost: Number(assetForm.cost),
      usefulLifeYears: Number(assetForm.usefulLifeYears),
      method: 'Straight-Line (SLM)',
      monthlyDeprec: monthly,
      accumulatedDeprec: monthly,
      carryingValue: Number(assetForm.cost) - monthly,
      assignedProject: assetForm.assignedProject,
      status: 'Depreciating'
    };
    onUpdateAssets([created, ...assetRecords]);
    setIsAddingAsset(false);
  };

  return (
    <div className="space-y-3">
      {/* Table 9A: Fixed Asset Capitalization & Depreciation */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-2xs overflow-hidden">
        <div className="px-4 py-2.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 bg-slate-50/40">
          <span className="text-xs font-bold text-slate-900">
            9A. Fixed Asset Capitalization & Monthly SLM Depreciation Register
          </span>
          <div className="flex items-center gap-1.5">
            {onNavigatePortal && (
              <button
                onClick={() => onNavigatePortal('equipment-management', 'costing')}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Wrench size={12} />
                <span>Equipment Portal</span>
              </button>
            )}
            <button
              onClick={() => setIsAddingAsset(true)}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Plus size={13} />
              <span>Capitalize Asset</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                <th className="py-2 px-3">Asset Code</th>
                <th className="py-2 px-3">Equipment (FK)</th>
                <th className="py-2 px-3">Asset Name</th>
                <th className="py-2 px-3 text-right">Original Cost</th>
                <th className="py-2 px-3 text-right">Monthly Deprec.</th>
                <th className="py-2 px-3 text-right">Accumulated</th>
                <th className="py-2 px-3 text-right">Carrying Value (NBV)</th>
                <th className="py-2 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {assetRecords.map(fa => (
                <tr key={fa.id} className="hover:bg-slate-50/70 transition-colors whitespace-nowrap">
                  <td className="py-2 px-3 font-mono font-bold text-slate-900">{fa.assetCode}</td>
                  <td className="py-2 px-3 font-mono text-[11px] font-semibold text-teal-700">{fa.equipmentRef}</td>
                  <td className="py-2 px-3 font-semibold text-slate-900">{fa.assetName}</td>
                  <td className="py-2 px-3 text-right font-mono text-slate-700">LKR {fa.cost.toLocaleString()}</td>
                  <td className="py-2 px-3 text-right font-mono text-amber-700">
                    LKR {fa.monthlyDeprec.toLocaleString()}
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-slate-600">
                    LKR {fa.accumulatedDeprec.toLocaleString()}
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                    LKR {fa.carryingValue.toLocaleString()}
                  </td>
                  <td className="py-2 px-3 text-right">
                    <button
                      onClick={() =>
                        onUpdateAssets(
                          assetRecords.map(item =>
                            item.id === fa.id
                              ? {
                                  ...item,
                                  accumulatedDeprec: item.accumulatedDeprec + item.monthlyDeprec,
                                  carryingValue: Math.max(0, item.carryingValue - item.monthlyDeprec)
                                }
                              : item
                          )
                        )
                      }
                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-semibold cursor-pointer"
                    >
                      +1M Deprec
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Table 9B: Tax, VAT (18%) & Corporate Income Tax (30%) Statutory Register */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-2xs overflow-hidden">
        <div className="px-4 py-2.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 bg-slate-50/40">
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span className="text-xs font-bold text-slate-900">
              9B. Corporate Taxation & Statutory Schedule (VAT 18%, Corporate Income Tax 30%)
            </span>
          </div>
          <div className="flex items-center gap-2">
            {onOpenCorporateReport && (
              <button
                type="button"
                onClick={() => {
                  if (!canDownload) {
                    toast.error('Permission Denied: Download permission is required to view or export statutory reports.');
                    return;
                  }
                  onOpenCorporateReport('Corporate Tax Report');
                }}
                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                title="Open Corporate Taxation Report in Factory Portal layout"
              >
                <FileText size={12} className="text-orange-400" />
                <span>Corporate Tax Report</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Tax Computation KPI Cards */}
        <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50/50 border-b border-slate-100">
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Output VAT (18%)</p>
            <p className="text-base font-bold text-slate-900 mt-0.5">LKR {outputVatAmount.toLocaleString()}</p>
            <p className="text-[9px] text-slate-500 mt-0.5 font-medium">From LKR {totalBilledRevenue.toLocaleString()} billed</p>
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Input VAT (18%)</p>
            <p className="text-base font-bold text-teal-700 mt-0.5">LKR {inputVatAmount.toLocaleString()}</p>
            <p className="text-[9px] text-slate-500 mt-0.5 font-medium">Claimable on procurement & bills</p>
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Net VAT Payable</p>
            <p className="text-base font-bold text-emerald-600 mt-0.5">LKR {netVatPayable.toLocaleString()}</p>
            <p className="text-[9px] text-slate-500 mt-0.5 font-medium">Due monthly by 20th</p>
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Annual CIT (30%)</p>
            <p className="text-base font-bold text-purple-700 mt-0.5">LKR {corporateIncomeTax.toLocaleString()}</p>
            <p className="text-[9px] text-slate-500 mt-0.5 font-medium">LKR {quarterlyCitInstallment.toLocaleString()} / quarter</p>
          </div>
        </div>

        {/* Reminders Banner */}
        <div className="px-4 py-2 bg-amber-50 border-b border-amber-200/80 flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <AlertCircle size={14} className="text-amber-600 shrink-0" />
            <span className="font-semibold">Statutory Reminder:</span>
            <span>Monthly VAT Return and Net Remittance must be submitted to Inland Revenue by the 20th of the following month.</span>
          </div>
          <span className="px-2 py-0.5 bg-amber-200/80 text-amber-800 rounded text-[10px] font-bold shrink-0">
            Action Required
          </span>
        </div>

        {/* Statutory Filing Schedule Table */}
        <div className="p-3 border-b border-slate-100 bg-white">
          <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Calendar size={13} className="text-blue-600" />
            <span>Statutory Tax Filing Schedule & Installments</span>
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-2 px-3">Tax Obligation</th>
                  <th className="py-2 px-3">Statutory Basis</th>
                  <th className="py-2 px-3">Cycle</th>
                  <th className="py-2 px-3">Statutory Due Date</th>
                  <th className="py-2 px-3 text-right">Est. Amount</th>
                  <th className="py-2 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {statutorySchedules.map((sch, i) => (
                  <tr key={i} className="hover:bg-slate-50/70">
                    <td className="py-2 px-3 font-semibold text-slate-900">{sch.title}</td>
                    <td className="py-2 px-3 text-slate-600">{sch.basis}</td>
                    <td className="py-2 px-3 font-mono text-[11px] text-slate-600">{sch.frequency}</td>
                    <td className="py-2 px-3 font-semibold text-slate-800">{sch.dueDate}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                      LKR {sch.estimatedAmount.toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className={cn(
                        'px-2 py-0.5 rounded text-[10px] font-bold border',
                        sch.status === 'Due Soon' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-700 border-slate-200'
                      )}>
                        {sch.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Existing Tax Records List */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                <th className="py-2 px-3">Tax Code</th>
                <th className="py-2 px-3">Period</th>
                <th className="py-2 px-3">Tax Type</th>
                <th className="py-2 px-3 text-right">Taxable Base</th>
                <th className="py-2 px-3 text-right">Tax Liability / Claim</th>
                <th className="py-2 px-3">Return / Cert Ref</th>
                <th className="py-2 px-3 text-center">Status</th>
                <th className="py-2 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {taxRecords.map(tx => (
                <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors whitespace-nowrap">
                  <td className="py-2 px-3 font-mono font-bold text-slate-900">{tx.taxCode}</td>
                  <td className="py-2 px-3 font-mono text-[11px] text-slate-600">{tx.period}</td>
                  <td className="py-2 px-3 font-semibold text-slate-900">{tx.taxType}</td>
                  <td className="py-2 px-3 text-right font-mono text-slate-700">
                    LKR {tx.taxableBase.toLocaleString()}
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                    LKR {tx.taxAmount.toLocaleString()}
                  </td>
                  <td className="py-2 px-3 font-mono text-[11px] text-blue-700">{tx.certificateRef}</td>
                  <td className="py-2 px-3 text-center">
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded text-[10px] font-bold border',
                        tx.status === 'Filed & Paid'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      )}
                    >
                      {tx.status}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right">
                    {tx.status !== 'Filed & Paid' && (
                      <button
                        onClick={() => {
                          if (!isAdmin) {
                            toast.error('Permission Denied: Only Admin can update or file statutory tax records.');
                            return;
                          }
                          onUpdateTax(
                            taxRecords.map(item =>
                              item.id === tx.id ? { ...item, status: 'Filed & Paid' } : item
                            )
                          );
                          toast.success(`Tax record ${tx.taxCode} marked as Filed & Paid`);
                        }}
                        className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded text-[10px] font-semibold cursor-pointer"
                      >
                        Mark Filed
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Table 9C: Financial Period & Month-End Closing Checklist */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-2xs overflow-hidden">
        <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/40">
          <span className="text-xs font-bold text-slate-900">
            9C. Financial Period & Month-End Closing Control Checklist
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                <th className="py-2 px-3">Step</th>
                <th className="py-2 px-3">Period</th>
                <th className="py-2 px-3">Control Area</th>
                <th className="py-2 px-3">Verification Note</th>
                <th className="py-2 px-3">Owner</th>
                <th className="py-2 px-3 text-center">Period Lock Status</th>
                <th className="py-2 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {closeSteps.map(step => (
                <tr key={step.id} className="hover:bg-slate-50/70 transition-colors whitespace-nowrap">
                  <td className="py-2 px-3 font-mono font-bold text-slate-900">#{step.stepNo}</td>
                  <td className="py-2 px-3 font-mono text-[11px] text-slate-600">{step.period}</td>
                  <td className="py-2 px-3 font-semibold text-slate-900">{step.controlArea}</td>
                  <td className="py-2 px-3 text-slate-600">{step.verificationNote}</td>
                  <td className="py-2 px-3 text-slate-700">{step.owner}</td>
                  <td className="py-2 px-3 text-center">
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded text-[10px] font-bold border',
                        step.status === 'Completed & Locked'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      )}
                    >
                      {step.status}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right">
                    {step.status !== 'Completed & Locked' && (
                      <button
                        onClick={() =>
                          onUpdateCloseSteps(
                            closeSteps.map(item =>
                              item.id === step.id ? { ...item, status: 'Completed & Locked' } : item
                            )
                          )
                        }
                        className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-[10px] font-semibold cursor-pointer"
                      >
                        Lock Period Step
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isAddingAsset && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Capitalize Fixed Asset</h3>
              <button onClick={() => setIsAddingAsset(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveAsset} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Asset Name *</label>
                <input
                  type="text"
                  required
                  value={assetForm.assetName}
                  onChange={e => setAssetForm({ ...assetForm, assetName: e.target.value })}
                  placeholder="e.g., Double-Head Mitre Saw"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cost (LKR)</label>
                  <input
                    type="number"
                    value={assetForm.cost}
                    onChange={e => setAssetForm({ ...assetForm, cost: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Useful Life (Yrs)</label>
                  <input
                    type="number"
                    value={assetForm.usefulLifeYears}
                    onChange={e => setAssetForm({ ...assetForm, usefulLifeYears: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddingAsset(false)}
                  className="px-4 py-1.5 border border-slate-200 rounded-xl text-xs font-medium text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold"
                >
                  Save Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
