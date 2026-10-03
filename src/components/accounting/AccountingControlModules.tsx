import React, { useState } from 'react';
import {
  Plus,
  Search,
  X,
  Trash2,
  Truck
} from 'lucide-react';
import { cn } from '../../lib/utils';
import {
  ChartOfAccountRecord,
  GlJournalRecord,
  AccountsPayableRecord
} from '../../services/accountingControlService';
import { toast } from 'sonner';

interface GlAndCoaSectionProps {
  journals: GlJournalRecord[];
  coaList: ChartOfAccountRecord[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onUpdateJournals: (next: GlJournalRecord[]) => void;
  onUpdateCoa: (next: ChartOfAccountRecord[]) => void;
  isAddingJournal: boolean;
  setIsAddingJournal: (open: boolean) => void;
  isAdmin?: boolean;
  onAddNotification?: (title: string, message: string, type?: any) => void;
}

export const GlAndCoaSection: React.FC<GlAndCoaSectionProps> = ({
  journals,
  coaList,
  searchQuery,
  onSearchChange,
  onUpdateJournals,
  onUpdateCoa,
  isAddingJournal,
  setIsAddingJournal,
  isAdmin = true,
  onAddNotification
}) => {
  const [isAddingCoa, setIsAddingCoa] = useState(false);
  const [jnlForm, setJnlForm] = useState({
    journalNo: `JNL-2026-040${journals.length + 5}`,
    date: new Date().toISOString().split('T')[0],
    journalType: 'Standard' as GlJournalRecord['journalType'],
    reference: 'DOC-REF-101',
    description: '',
    debitAccount: '5010 • Direct Project Materials',
    creditAccount: '2010 • Accounts Payable',
    projectId: 'PRJ-2026-001',
    workPackage: 'Aluminium Curtain Wall',
    costCentre: 'CC-FAB-01',
    branch: 'Main Store',
    amount: 250000
  });

  const [coaForm, setCoaForm] = useState({
    code: '5080',
    name: '',
    group: 'Direct Project Costs' as ChartOfAccountRecord['group'],
    dimensionRule: 'Project + Work Package',
    currency: 'LKR' as 'LKR' | 'USD',
    balance: 0
  });

  const q = searchQuery.toLowerCase().trim();
  const filteredJournals = journals.filter(
    j =>
      !q ||
      j.journalNo.toLowerCase().includes(q) ||
      j.description.toLowerCase().includes(q) ||
      j.debitAccount.toLowerCase().includes(q) ||
      j.projectId.toLowerCase().includes(q) ||
      j.workPackage.toLowerCase().includes(q)
  );

  const handleSaveJournal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jnlForm.description.trim() || jnlForm.amount <= 0) return;
    const created: GlJournalRecord = {
      id: `jnl-${Date.now()}`,
      journalNo: jnlForm.journalNo,
      date: jnlForm.date,
      journalType: jnlForm.journalType,
      reference: jnlForm.reference,
      description: jnlForm.description,
      debitAccount: jnlForm.debitAccount,
      creditAccount: jnlForm.creditAccount,
      projectId: jnlForm.projectId,
      workPackage: jnlForm.workPackage,
      costCentre: jnlForm.costCentre,
      branch: jnlForm.branch,
      debitAmount: Number(jnlForm.amount),
      creditAmount: Number(jnlForm.amount),
      preparedBy: 'Finance User',
      approvedBy: 'Rohan Silva (FC)',
      status: 'Posted'
    };
    onUpdateJournals([created, ...journals]);
    setIsAddingJournal(false);
  };

  const handleSaveCoa = (e: React.FormEvent) => {
    e.preventDefault();
    if (!coaForm.name.trim()) return;
    const created: ChartOfAccountRecord = {
      id: `coa-${Date.now()}`,
      code: coaForm.code,
      name: coaForm.name,
      group: coaForm.group,
      dimensionRule: coaForm.dimensionRule,
      currency: coaForm.currency,
      balance: Number(coaForm.balance),
      status: 'Active'
    };
    onUpdateCoa([...coaList, created]);
    setIsAddingCoa(false);
  };

  return (
    <div className="space-y-3">
      {/* Table 2A: General Ledger Double-Entry Journal Register */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-2xs overflow-hidden">
        <div className="px-4 py-2.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 bg-slate-50/40">
          <div className="flex items-center gap-2 flex-1 flex-wrap">
            <span className="text-xs font-bold text-slate-900">
              2A. General Ledger Double-Entry Journals (Dr = Cr Enforced)
            </span>
            <div className="relative min-w-[200px] max-w-xs">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search journal #, project, account..."
                value={searchQuery}
                onChange={e => onSearchChange(e.target.value)}
                className="w-full pl-8 pr-3 py-1 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>
          <button
            onClick={() => setIsAddingJournal(true)}
            className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
          >
            <Plus size={13} />
            <span>Post Balanced Journal</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                <th className="py-2 px-3">Journal #</th>
                <th className="py-2 px-3">Date & Type</th>
                <th className="py-2 px-3">Dimensions (Project • Package • CC)</th>
                <th className="py-2 px-3">Debit Account</th>
                <th className="py-2 px-3">Credit Account</th>
                <th className="py-2 px-3">Description</th>
                <th className="py-2 px-3 text-right">Debit = Credit</th>
                <th className="py-2 px-3 text-center">Status</th>
                <th className="py-2 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredJournals.map(j => (
                <tr key={j.id} className="hover:bg-slate-50/70 transition-colors whitespace-nowrap">
                  <td className="py-2 px-3 font-mono font-bold text-slate-900">{j.journalNo}</td>
                  <td className="py-2 px-3">
                    <span className="font-mono text-[11px] text-slate-500">{j.date}</span>{' '}
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[10px]">
                      {j.journalType}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    <span className="font-mono text-[11px] font-semibold text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-200">
                      {j.projectId}
                    </span>{' '}
                    <span className="text-[11px] text-slate-600">
                      • {j.workPackage} • {j.costCentre}
                    </span>
                  </td>
                  <td className="py-2 px-3 font-medium text-slate-800">{j.debitAccount}</td>
                  <td className="py-2 px-3 font-medium text-slate-800">{j.creditAccount}</td>
                  <td className="py-2 px-3 text-slate-600 max-w-[200px] truncate" title={j.description}>
                    {j.description}
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                    LKR {j.debitAmount.toLocaleString()}
                  </td>
                  <td className="py-2 px-3 text-center">
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded text-[10px] font-bold border',
                        j.status === 'Posted'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      )}
                    >
                      {j.status}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {j.status !== 'Posted' && (
                        <button
                          onClick={() =>
                            onUpdateJournals(
                              journals.map(item =>
                                item.id === j.id
                                  ? { ...item, status: 'Posted', approvedBy: 'Rohan Silva (FC)' }
                                  : item
                              )
                            )
                          }
                          className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded text-[10px] font-semibold cursor-pointer"
                        >
                          Approve & Post
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (!isAdmin) {
                            toast.error('Permission Denied', {
                              description: 'Only administrators have authority to edit or delete GL journal entries.'
                            });
                            onAddNotification?.('Permission Denied', 'Only administrators can delete GL journals.', 'warning');
                            return;
                          }
                          onUpdateJournals(journals.filter(item => item.id !== j.id));
                          toast.success('Journal Deleted', { description: `Journal ${j.journalNo} removed.` });
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                        title={isAdmin ? "Delete Journal (Admin)" : "Admin authority required to delete"}
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

      {/* Table 2B: Construction Chart of Accounts (COA) */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-2xs overflow-hidden">
        <div className="px-4 py-2.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 bg-slate-50/40">
          <span className="text-xs font-bold text-slate-900">
            2B. Configurable Construction Chart of Accounts (COA) & Dimensional Rules
          </span>
          <button
            onClick={() => setIsAddingCoa(true)}
            className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
          >
            <Plus size={13} />
            <span>Add GL Account</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                <th className="py-2 px-3">Account Code</th>
                <th className="py-2 px-3">Account Name</th>
                <th className="py-2 px-3">Account Group</th>
                <th className="py-2 px-3">Mandatory Dimensions</th>
                <th className="py-2 px-3 text-center">Currency</th>
                <th className="py-2 px-3 text-right">Ledger Balance</th>
                <th className="py-2 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {coaList.map(acc => (
                <tr key={acc.id} className="hover:bg-slate-50/70 transition-colors whitespace-nowrap">
                  <td className="py-2 px-3 font-mono font-bold text-orange-600">{acc.code}</td>
                  <td className="py-2 px-3 font-semibold text-slate-900">{acc.name}</td>
                  <td className="py-2 px-3">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]">
                      {acc.group}
                    </span>
                  </td>
                  <td className="py-2 px-3 font-mono text-[11px] text-slate-600">{acc.dimensionRule}</td>
                  <td className="py-2 px-3 text-center font-mono text-[11px] font-bold text-slate-700">
                    {acc.currency}
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                    {acc.currency} {acc.balance.toLocaleString()}
                  </td>
                  <td className="py-2 px-3 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {acc.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Post GL Journal */}
      {isAddingJournal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Post Balanced Double-Entry Journal (Dr = Cr)</h3>
              <button onClick={() => setIsAddingJournal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveJournal} className="p-5 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Journal No</label>
                  <input
                    type="text"
                    value={jnlForm.journalNo}
                    onChange={e => setJnlForm({ ...jnlForm, journalNo: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Journal Type</label>
                  <select
                    value={jnlForm.journalType}
                    onChange={e => setJnlForm({ ...jnlForm, journalType: e.target.value as any })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white"
                  >
                    <option value="Standard">Standard</option>
                    <option value="Accrual">Accrual</option>
                    <option value="Prepayment">Prepayment</option>
                    <option value="Depreciation">Depreciation</option>
                    <option value="Payroll Post">Payroll Post</option>
                    <option value="Reversal">Reversal</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Debit Account</label>
                  <input
                    type="text"
                    value={jnlForm.debitAccount}
                    onChange={e => setJnlForm({ ...jnlForm, debitAccount: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Credit Account</label>
                  <input
                    type="text"
                    value={jnlForm.creditAccount}
                    onChange={e => setJnlForm({ ...jnlForm, creditAccount: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Project Dimension</label>
                  <input
                    type="text"
                    value={jnlForm.projectId}
                    onChange={e => setJnlForm({ ...jnlForm, projectId: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Balanced Amount (LKR) *</label>
                  <input
                    type="number"
                    required
                    value={jnlForm.amount}
                    onChange={e => setJnlForm({ ...jnlForm, amount: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description *</label>
                <input
                  type="text"
                  required
                  value={jnlForm.description}
                  onChange={e => setJnlForm({ ...jnlForm, description: e.target.value })}
                  placeholder="Describe accounting event..."
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddingJournal(false)}
                  className="px-4 py-1.5 border border-slate-200 rounded-xl text-xs font-medium text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-semibold"
                >
                  Post Journal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add COA Account */}
      {isAddingCoa && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Add Chart of Accounts (COA) Ledger</h3>
              <button onClick={() => setIsAddingCoa(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveCoa} className="p-5 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Account Code *</label>
                  <input
                    type="text"
                    required
                    value={coaForm.code}
                    onChange={e => setCoaForm({ ...coaForm, code: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Account Group</label>
                  <select
                    value={coaForm.group}
                    onChange={e => setCoaForm({ ...coaForm, group: e.target.value as any })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white"
                  >
                    <option value="Assets">Assets</option>
                    <option value="Liabilities">Liabilities</option>
                    <option value="Equity">Equity</option>
                    <option value="Construction Revenue">Construction Revenue</option>
                    <option value="Direct Project Costs">Direct Project Costs</option>
                    <option value="Indirect & Admin">Indirect & Admin</option>
                    <option value="Tax & Statutory">Tax & Statutory</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Account Name *</label>
                <input
                  type="text"
                  required
                  value={coaForm.name}
                  onChange={e => setCoaForm({ ...coaForm, name: e.target.value })}
                  placeholder="e.g., Project Warranty & Rework Provision"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddingCoa(false)}
                  className="px-4 py-1.5 border border-slate-200 rounded-xl text-xs font-medium text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold"
                >
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

interface ApThreeWaySectionProps {
  apRecords: AccountsPayableRecord[];
  onUpdateAp: (next: AccountsPayableRecord[]) => void;
  isAddingAp: boolean;
  setIsAddingAp: (open: boolean) => void;
  onNavigatePortal?: (portalView: string, subTab?: string) => void;
  isAdmin?: boolean;
  onAddNotification?: (title: string, message: string, type?: any) => void;
}

export const ApThreeWaySection: React.FC<ApThreeWaySectionProps> = ({
  apRecords,
  onUpdateAp,
  isAddingAp,
  setIsAddingAp,
  onNavigatePortal,
  isAdmin = true,
  onAddNotification
}) => {
  const [apForm, setApForm] = useState({
    billNo: `BILL-2026-89${apRecords.length + 1}`,
    supplierName: 'Alumex Extrusions PLC',
    projectId: 'PRJ-2026-001',
    workPackage: 'Aluminium Profiles',
    poRef: 'PO-2026-099',
    grnRef: 'GRN-2026-130 (IQC Pass)',
    grossAmount: 1200000,
    taxAmount: 216000,
    retentionHeld: 60000,
    dueDate: new Date().toISOString().split('T')[0]
  });

  const handleSaveAp = (e: React.FormEvent) => {
    e.preventDefault();
    const net = Number(apForm.grossAmount) + Number(apForm.taxAmount) - Number(apForm.retentionHeld);
    const created: AccountsPayableRecord = {
      id: `ap-${Date.now()}`,
      billNo: apForm.billNo,
      supplierName: apForm.supplierName,
      projectId: apForm.projectId,
      workPackage: apForm.workPackage,
      poRef: apForm.poRef,
      grnRef: apForm.grnRef,
      threeWayStatus: '3-Way Matched',
      grossAmount: Number(apForm.grossAmount),
      taxAmount: Number(apForm.taxAmount),
      retentionHeld: Number(apForm.retentionHeld),
      advanceRecovered: 0,
      netPayable: net,
      dueDate: apForm.dueDate,
      status: 'Approved'
    };
    onUpdateAp([created, ...apRecords]);
    setIsAddingAp(false);
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl shadow-2xs overflow-hidden">
      <div className="px-4 py-2.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 bg-slate-50/40">
        <span className="text-xs font-bold text-slate-900">
          4. Accounts Payable (AP), Subcontractor Retentions & 3-Way Match (PO + GRN + Bill)
        </span>
        <div className="flex items-center gap-1.5">
          {onNavigatePortal && (
            <button
              onClick={() => onNavigatePortal('procurement', 'grn')}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Truck size={12} />
              <span>Open PO / GRN</span>
            </button>
          )}
          <button
            onClick={() => setIsAddingAp(true)}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
          >
            <Plus size={13} />
            <span>Log Supplier Bill</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
              <th className="py-2 px-3">Bill # (PK)</th>
              <th className="py-2 px-3">Supplier / Subcontractor</th>
              <th className="py-2 px-3">Project • Package</th>
              <th className="py-2 px-3">PO & GRN (FK)</th>
              <th className="py-2 px-3 text-center">3-Way Match</th>
              <th className="py-2 px-3 text-right">Gross + VAT</th>
              <th className="py-2 px-3 text-right">Retention / Adv</th>
              <th className="py-2 px-3 text-right">Net Payable</th>
              <th className="py-2 px-3 text-center">Status</th>
              <th className="py-2 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {apRecords.map(bill => (
              <tr key={bill.id} className="hover:bg-slate-50/70 transition-colors whitespace-nowrap">
                <td className="py-2 px-3 font-mono font-bold text-slate-900">{bill.billNo}</td>
                <td className="py-2 px-3 font-semibold text-slate-900">{bill.supplierName}</td>
                <td className="py-2 px-3">
                  <span className="font-mono text-[11px] font-semibold text-orange-700">{bill.projectId}</span>{' '}
                  <span className="text-slate-500 text-[11px]">• {bill.workPackage}</span>
                </td>
                <td className="py-2 px-3 font-mono text-[11px] text-purple-700">
                  {bill.poRef} • {bill.grnRef}
                </td>
                <td className="py-2 px-3 text-center">
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded text-[10px] font-bold border',
                      bill.threeWayStatus === '3-Way Matched'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    )}
                  >
                    {bill.threeWayStatus}
                  </span>
                </td>
                <td className="py-2 px-3 text-right font-mono text-slate-700">
                  LKR {(bill.grossAmount + bill.taxAmount).toLocaleString()}
                </td>
                <td className="py-2 px-3 text-right font-mono text-amber-700">
                  -LKR {(bill.retentionHeld + bill.advanceRecovered).toLocaleString()}
                </td>
                <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                  LKR {bill.netPayable.toLocaleString()}
                </td>
                <td className="py-2 px-3 text-center">
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded text-[10px] font-bold border',
                      bill.status === 'Paid'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : bill.status === 'Approved'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    )}
                  >
                    {bill.status}
                  </span>
                </td>
                <td className="py-2 px-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {bill.status !== 'Paid' && (
                      <button
                        onClick={() =>
                          onUpdateAp(
                            apRecords.map(item =>
                              item.id === bill.id
                                ? { ...item, threeWayStatus: '3-Way Matched', status: 'Paid' }
                                : item
                            )
                          )
                        }
                        className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded text-[10px] font-semibold cursor-pointer"
                      >
                        Pay Bill
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (bill.status !== 'Paid' && bill.netPayable > 0) {
                          const warningText = `Cannot delete bill: Supplier account for ${bill.supplierName} has an unpaid payable balance of LKR ${bill.netPayable.toLocaleString()}. Accounts with unpaid balances cannot be deleted until settled.`;
                          toast.error('Unpaid Balance Notification', {
                            description: warningText
                          });
                          onAddNotification?.('Deletion Prevented: Unpaid Balance', warningText, 'warning');
                          return;
                        }
                        if (!isAdmin) {
                          toast.error('Permission Denied', {
                            description: 'Only administrators have authority to delete accounts payable bills.'
                          });
                          onAddNotification?.('Permission Denied', 'Only administrators can delete supplier bills.', 'warning');
                          return;
                        }
                        onUpdateAp(apRecords.filter(item => item.id !== bill.id));
                        toast.success('Bill Deleted', { description: `Bill ${bill.billNo} deleted.` });
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                      title={isAdmin ? "Delete Bill (Admin)" : "Admin authority required to delete"}
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

      {isAddingAp && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Log Supplier Bill (3-Way Match)</h3>
              <button onClick={() => setIsAddingAp(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveAp} className="p-5 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Bill No</label>
                  <input
                    type="text"
                    value={apForm.billNo}
                    onChange={e => setApForm({ ...apForm, billNo: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Supplier</label>
                  <input
                    type="text"
                    value={apForm.supplierName}
                    onChange={e => setApForm({ ...apForm, supplierName: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">PO Ref</label>
                  <input
                    type="text"
                    value={apForm.poRef}
                    onChange={e => setApForm({ ...apForm, poRef: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">GRN Ref</label>
                  <input
                    type="text"
                    value={apForm.grnRef}
                    onChange={e => setApForm({ ...apForm, grnRef: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Gross (LKR)</label>
                  <input
                    type="number"
                    value={apForm.grossAmount}
                    onChange={e => setApForm({ ...apForm, grossAmount: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">VAT (LKR)</label>
                  <input
                    type="number"
                    value={apForm.taxAmount}
                    onChange={e => setApForm({ ...apForm, taxAmount: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Retention</label>
                  <input
                    type="number"
                    value={apForm.retentionHeld}
                    onChange={e => setApForm({ ...apForm, retentionHeld: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddingAp(false)}
                  className="px-4 py-1.5 border border-slate-200 rounded-xl text-xs font-medium text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold"
                >
                  Save Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
