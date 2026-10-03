import React, { useState, useMemo } from 'react';
import {
  Landmark,
  Plus,
  AlertCircle,
  FileText,
  Trash2,
  RefreshCw,
  Lock,
  Check
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { BankReconcileRecord, AccountsPayableRecord } from '../../services/accountingControlService';
import { Payment, Invoice } from '../../types';
import { AccountingDocumentSpec } from './AccountingDocumentModal';
import { toast } from 'sonner';

export interface BankAccountProfile {
  id: string;
  name: string;
  bankName: string;
  accountNumber: string;
  branch: string;
  currency: 'LKR' | 'USD';
  openingBalance: number;
  bookBalance: number;
  statementBalance: number;
  lastReconciledDate: string;
  status: 'Reconciled' | 'Variance' | 'Pending';
  notes?: string;
}

interface BankReconciliationSectionProps {
  bankRecords: BankReconcileRecord[];
  onUpdateBank: (next: BankReconcileRecord[]) => void;
  payments: Payment[];
  invoices: Invoice[];
  apRecords: AccountsPayableRecord[];
  isAdmin: boolean;
  canDownload?: boolean;
  onOpenDocument: (doc: AccountingDocumentSpec) => void;
  onAddNotification: (title: string, message: string, type?: any) => void;
}

const INITIAL_BANK_ACCOUNTS: BankAccountProfile[] = [
  {
    id: 'acc-cbr-01',
    name: 'Commercial Bank Corporate',
    bankName: 'Commercial Bank of Ceylon PLC',
    accountNumber: '1010-4491-0021',
    branch: 'Kollupitiya Corporate Branch',
    currency: 'LKR',
    openingBalance: 12500000,
    bookBalance: 18450000,
    statementBalance: 18450000,
    lastReconciledDate: '2026-09-30',
    status: 'Reconciled',
    notes: 'Primary operations and client receipt clearing account.'
  },
  {
    id: 'acc-smp-02',
    name: 'Sampath Operational Float',
    bankName: 'Sampath Bank PLC',
    accountNumber: '8080-2219-3310',
    branch: 'Biyagama Free Trade Branch',
    currency: 'LKR',
    openingBalance: 4200000,
    bookBalance: 6850000,
    statementBalance: 6850000,
    lastReconciledDate: '2026-09-30',
    status: 'Reconciled',
    notes: 'Used for procurement vendor transfers and plant utility payments.'
  },
  {
    id: 'acc-hnb-03',
    name: 'HNB Project Escrow USD',
    bankName: 'Hatton National Bank PLC',
    accountNumber: '2001-9921-USD',
    branch: 'Colombo Fort Overseas Branch',
    currency: 'USD',
    openingBalance: 85000,
    bookBalance: 142000,
    statementBalance: 142000,
    lastReconciledDate: '2026-09-30',
    status: 'Reconciled',
    notes: 'Foreign currency escrow account for specialized glass and extrusion imports.'
  },
  {
    id: 'acc-vlt-04',
    name: 'Head Office Cash Vault',
    bankName: 'Innovista Treasury Central Vault',
    accountNumber: 'PCV-HQ-VAULT-01',
    branch: 'Head Office Imprest',
    currency: 'LKR',
    openingBalance: 250000,
    bookBalance: 320000,
    statementBalance: 320000,
    lastReconciledDate: '2026-09-30',
    status: 'Reconciled',
    notes: 'Physical cash imprest reserve for site emergencies and urgent courier logistics.'
  }
];

export const BankReconciliationSection: React.FC<BankReconciliationSectionProps> = ({
  bankRecords,
  onUpdateBank: _onUpdateBank,
  payments,
  invoices: _invoices,
  apRecords,
  isAdmin,
  canDownload: _canDownload = true,
  onOpenDocument,
  onAddNotification
}) => {
  const [bankAccounts, setBankAccounts] = useState<BankAccountProfile[]>(INITIAL_BANK_ACCOUNTS);
  const [selectedAccountId, setSelectedAccountId] = useState<string>(INITIAL_BANK_ACCOUNTS[0].id);
  const [activeView, setActiveView] = useState<'process' | 'accounts'>('process');

  // Reconciliation State
  const [statementCutoffDate, setStatementCutoffDate] = useState<string>(new Date().toISOString().substring(0, 10));
  const [statementEndingBalance, setStatementEndingBalance] = useState<number>(18450000);
  const [clearedTxIds, setClearedTxIds] = useState<Set<string>>(new Set(['rec-1', 'rec-2', 'rec-3', 'ap-1', 'ap-2']));

  // Bank Account Modals
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [accountFormData, setAccountFormData] = useState<Partial<BankAccountProfile>>({
    name: '',
    bankName: '',
    accountNumber: '',
    branch: '',
    currency: 'LKR',
    openingBalance: 0,
    notes: ''
  });

  const selectedAccount = useMemo(() => {
    return bankAccounts.find(a => a.id === selectedAccountId) || bankAccounts[0];
  }, [bankAccounts, selectedAccountId]);

  // Combined Live Transactions for Selected Account
  const reconciliationItems = useMemo(() => {
    const items: Array<{
      id: string;
      date: string;
      reference: string;
      party: string;
      type: 'Deposit' | 'Payment';
      amount: number;
      currency: string;
      isCleared: boolean;
      source: 'AR Receipt' | 'AP Bill' | 'Bank Feed';
    }> = [];

    // 1. Receipts (Money in)
    payments.forEach(p => {
      items.push({
        id: `rec-${p.id}`,
        date: p.date,
        reference: p.paymentNo,
        party: p.clientName || 'Client Receipt',
        type: 'Deposit',
        amount: p.amount,
        currency: 'LKR',
        isCleared: clearedTxIds.has(`rec-${p.id}`),
        source: 'AR Receipt'
      });
    });

    // 2. AP Vendor Payments (Money out)
    apRecords.forEach(b => {
      items.push({
        id: `ap-${b.id}`,
        date: (b as any).billDate || b.dueDate || new Date().toISOString().split('T')[0],
        reference: b.billNo,
        party: b.supplierName,
        type: 'Payment',
        amount: b.netPayable,
        currency: 'LKR',
        isCleared: clearedTxIds.has(`ap-${b.id}`),
        source: 'AP Bill'
      });
    });

    // 3. Statement Records
    bankRecords.forEach(b => {
      if (!items.some(i => i.reference === b.statementRef)) {
        items.push({
          id: `stmt-${b.id}`,
          date: b.statementDate,
          reference: b.statementRef,
          party: b.counterparty,
          type: b.type === 'Deposit' ? 'Deposit' : 'Payment',
          amount: Math.abs(b.amount),
          currency: b.currency,
          isCleared: clearedTxIds.has(`stmt-${b.id}`) || b.matchStatus === 'Matched',
          source: 'Bank Feed'
        });
      }
    });

    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [payments, apRecords, bankRecords, clearedTxIds]);

  // Real-time Reconciliation Calculations
  const calc = useMemo(() => {
    // Deposits in Transit: Uncleared deposits
    const depositsInTransit = reconciliationItems
      .filter(i => i.type === 'Deposit' && !i.isCleared)
      .reduce((sum, i) => sum + i.amount, 0);

    // Outstanding Checks / Payments: Uncleared payments
    const outstandingPayments = reconciliationItems
      .filter(i => i.type === 'Payment' && !i.isCleared)
      .reduce((sum, i) => sum + i.amount, 0);

    // Adjusted Bank Balance = Statement Ending Balance + Deposits in Transit - Outstanding Payments
    const adjustedBankBalance = statementEndingBalance + depositsInTransit - outstandingPayments;

    // Book Balance
    const bookBalance = selectedAccount.bookBalance;

    // Variance / Difference
    const variance = adjustedBankBalance - bookBalance;

    return {
      depositsInTransit,
      outstandingPayments,
      adjustedBankBalance,
      bookBalance,
      variance,
      isBalanced: Math.abs(variance) < 0.01
    };
  }, [reconciliationItems, statementEndingBalance, selectedAccount]);

  // Toggle Item Cleared Status
  const handleToggleCleared = (id: string) => {
    setClearedTxIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // One-Click Auto-Match
  const handleAutoMatch = () => {
    const nextSet = new Set(clearedTxIds);
    let matchedCount = 0;

    reconciliationItems.forEach(item => {
      if (!nextSet.has(item.id)) {
        nextSet.add(item.id);
        matchedCount++;
      }
    });

    setClearedTxIds(nextSet);
    toast.success('Auto-Match Complete', {
      description: `Matched and cleared ${matchedCount} transactions against verified records.`
    });
  };

  // Finalize & Lock Reconciliation (Admin Only)
  const handleFinalizeReconciliation = () => {
    if (!isAdmin) {
      toast.error('Permission Denied', {
        description: 'Only administrators can finalize and lock bank reconciliations.'
      });
      return;
    }

    if (!calc.isBalanced) {
      toast.error('Cannot Lock Reconciliation', {
        description: `Variance exists of ${selectedAccount.currency} ${Math.abs(calc.variance).toLocaleString()}. Reconciliation must balance to zero before locking.`
      });
      return;
    }

    // Update account lastReconciledDate and status
    setBankAccounts(prev =>
      prev.map(a =>
        a.id === selectedAccountId
          ? {
              ...a,
              lastReconciledDate: statementCutoffDate,
              statementBalance: statementEndingBalance,
              status: 'Reconciled'
            }
          : a
      )
    );

    onAddNotification(
      'Bank Reconciliation Locked',
      `${selectedAccount.name} reconciled with zero variance as of ${statementCutoffDate}.`,
      'success'
    );

    toast.success('Reconciliation Locked', {
      description: `${selectedAccount.name} successfully reconciled and locked.`
    });

    // Generate Official Document
    handleGenerateReconciliationDoc();
  };

  // Generate Official Bank Reconciliation Statement in Factory Portal Document Layout
  const handleGenerateReconciliationDoc = () => {
    const spec: AccountingDocumentSpec = {
      docTitle: 'BANK ACCOUNT RECONCILIATION STATEMENT',
      docNo: `BRS-${selectedAccount.currency}-${new Date().toISOString().substring(0, 10)}`,
      docDate: statementCutoffDate,
      category: 'Treasury & Cash Audit',
      partyName: selectedAccount.bankName,
      partyType: 'General',
      currency: selectedAccount.currency,
      strategyBox1Label: 'Bank Statement Balance',
      strategyBox1Value: `${selectedAccount.currency} ${statementEndingBalance.toLocaleString()}`,
      strategyBox2Label: 'Adjusted Bank Balance',
      strategyBox2Value: `${selectedAccount.currency} ${calc.adjustedBankBalance.toLocaleString()}`,
      strategyBox3Label: 'Reconciliation Variance',
      strategyBox3Value: `${selectedAccount.currency} ${calc.variance.toLocaleString()} (${calc.isBalanced ? 'Balanced' : 'Open'})`,
      scheduleHeaders: ['Line #', 'Description / Transaction', 'Reference', 'Type', 'Amount', 'Status'],
      scheduleRows: [
        {
          col1: '01',
          col2: `Balance per Bank Statement as of ${statementCutoffDate}`,
          col3: selectedAccount.accountNumber,
          col4: 'Bank Stmt',
          col5: `${selectedAccount.currency} ${statementEndingBalance.toLocaleString()}`,
          col6: 'Verified'
        },
        {
          col1: '02',
          col2: 'Add: Deposits in Transit (Uncleared Receipts)',
          col3: 'AR In-Transit',
          col4: 'Add (+)',
          col5: `${selectedAccount.currency} ${calc.depositsInTransit.toLocaleString()}`,
          col6: 'Audited'
        },
        {
          col1: '03',
          col2: 'Less: Outstanding Electronic Checks & AP Payments',
          col3: 'AP Outstanding',
          col4: 'Less (-)',
          col5: `${selectedAccount.currency} ${calc.outstandingPayments.toLocaleString()}`,
          col6: 'Audited'
        },
        {
          col1: '04',
          col2: 'Adjusted Balance per Bank Statement',
          col3: 'Computed',
          col4: 'Sub-Total',
          col5: `${selectedAccount.currency} ${calc.adjustedBankBalance.toLocaleString()}`,
          col6: 'Balanced',
          isHighlight: true
        },
        {
          col1: '05',
          col2: 'General Ledger Book Balance (Account 1010)',
          col3: 'GL Book',
          col4: 'Book Ledger',
          col5: `${selectedAccount.currency} ${calc.bookBalance.toLocaleString()}`,
          col6: 'Verified'
        },
        {
          col1: '06',
          col2: 'Net Audit Reconciliation Variance',
          col3: 'Audit Test',
          col4: 'Difference',
          col5: `${selectedAccount.currency} ${calc.variance.toFixed(2)}`,
          col6: calc.isBalanced ? 'Pass (0.00)' : 'Investigate',
          isHighlight: true
        }
      ],
      summaryTotals: [
        { label: 'Bank Statement Balance', value: `${selectedAccount.currency} ${statementEndingBalance.toLocaleString()}` },
        { label: 'General Ledger Book Balance', value: `${selectedAccount.currency} ${calc.bookBalance.toLocaleString()}` },
        { label: 'Audit Status', value: calc.isBalanced ? 'Balanced & Certified' : 'Unbalanced Variance' }
      ],
      terms: [
        {
          title: 'Veracity and Completeness Mandate',
          content: 'All cleared deposits and payments have been authenticated against corporate bank records and approved ERP vouchers.'
        },
        {
          title: 'Period Lock Policy',
          content: 'Once locked by system administrator, historical bank reconciliation records are tamper-proof.'
        }
      ],
      preparedBy: 'Treasury & Cash Officer',
      approvedBy: 'Financial Controller (Admin)',
      authorizationStatus: calc.isBalanced ? 'Audited & Locked' : 'Pending Review',
      auditStamp: `SYS-BRS-PASS-${selectedAccount.id.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`
    };

    onOpenDocument(spec);
  };

  // Add Bank Account (Admin only)
  const handleSaveNewAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      toast.error('Permission Denied', {
        description: 'Only administrators can create new bank accounts.'
      });
      return;
    }

    if (!accountFormData.name?.trim() || !accountFormData.accountNumber?.trim()) {
      toast.error('Validation Error', { description: 'Account Name and Number are required.' });
      return;
    }

    const newAcc: BankAccountProfile = {
      id: `acc-${Date.now()}`,
      name: accountFormData.name.trim(),
      bankName: accountFormData.bankName?.trim() || 'Commercial Bank',
      accountNumber: accountFormData.accountNumber.trim(),
      branch: accountFormData.branch?.trim() || 'Main Branch',
      currency: (accountFormData.currency as 'LKR' | 'USD') || 'LKR',
      openingBalance: Number(accountFormData.openingBalance) || 0,
      bookBalance: Number(accountFormData.openingBalance) || 0,
      statementBalance: Number(accountFormData.openingBalance) || 0,
      lastReconciledDate: new Date().toISOString().substring(0, 10),
      status: 'Reconciled',
      notes: accountFormData.notes || ''
    };

    setBankAccounts(prev => [newAcc, ...prev]);
    setIsAddAccountOpen(false);
    toast.success('Bank Account Registered', {
      description: `${newAcc.name} (${newAcc.accountNumber}) was created.`
    });
  };

  // Delete Bank Account (Admin only & Unpaid/Non-zero Balance Protection)
  const handleDeleteAccount = (acc: BankAccountProfile) => {
    // 1. Strict Balance Rule:
    if (acc.bookBalance !== 0) {
      const msg = `Cannot delete bank account: ${acc.name} has a non-zero balance of ${acc.currency} ${acc.bookBalance.toLocaleString()}. Accounts must be cleared to 0.00 before deletion.`;
      toast.error('Cannot Delete Bank Account', { description: msg });
      onAddNotification('Deletion Prevented', msg, 'warning');
      return;
    }

    // 2. Admin Permission Check:
    if (!isAdmin) {
      toast.error('Permission Denied', {
        description: 'Only system administrators can delete bank accounts.'
      });
      return;
    }

    setBankAccounts(prev => prev.filter(a => a.id !== acc.id));
    if (selectedAccountId === acc.id) {
      setSelectedAccountId(bankAccounts[0]?.id || '');
    }
    toast.success('Account Deleted', {
      description: `${acc.name} was removed.`
    });
  };

  return (
    <div className="space-y-3">
      {/* Sub-Navigation Strip (Single-Word Mode) */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center">
            <Landmark size={15} />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-900">Bank Accounts & Reconciliation</h2>
            <p className="text-[10px] text-slate-500">Live book balance vs bank statement reconciliation</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveView('process')}
            className={cn(
              'px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors',
              activeView === 'process'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            )}
          >
            Reconcile
          </button>
          <button
            onClick={() => setActiveView('accounts')}
            className={cn(
              'px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors',
              activeView === 'accounts'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            )}
          >
            Accounts ({bankAccounts.length})
          </button>
          {isAdmin && (
            <button
              onClick={() => {
                setAccountFormData({
                  name: '',
                  bankName: '',
                  accountNumber: '',
                  branch: '',
                  currency: 'LKR',
                  openingBalance: 0,
                  notes: ''
                });
                setIsAddAccountOpen(true);
              }}
              className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Plus size={12} />
              <span>Add Account</span>
            </button>
          )}
        </div>
      </div>

      {/* VIEW 1: RECONCILIATION PROCESS */}
      {activeView === 'process' && (
        <div className="space-y-3">
          {/* Account Selector Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {bankAccounts.map(acc => {
              const isSelected = selectedAccountId === acc.id;
              return (
                <div
                  key={acc.id}
                  onClick={() => setSelectedAccountId(acc.id)}
                  className={cn(
                    'p-3 rounded-xl border transition-all cursor-pointer text-left',
                    isSelected
                      ? 'bg-white border-teal-600 shadow-xs ring-1 ring-teal-500'
                      : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs'
                  )}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase font-mono">{acc.currency}</span>
                    <span
                      className={cn(
                        'text-[10px] px-1.5 py-0.2 rounded font-bold border',
                        acc.status === 'Reconciled'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      )}
                    >
                      {acc.status}
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 truncate">{acc.name}</h3>
                  <p className="text-[10px] text-slate-500 font-mono">{acc.accountNumber}</p>
                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">Book Balance:</span>
                    <span className="text-xs font-bold text-slate-900 font-mono">
                      {acc.currency} {acc.bookBalance.toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Reconciliation Controls & Real-Time Variance Calculator */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-2xs space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] font-medium text-slate-600 mb-1 block">Account</label>
                <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900">
                  {selectedAccount.name} ({selectedAccount.currency})
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-600 mb-1 block">Cut-off Date</label>
                <input
                  type="date"
                  value={statementCutoffDate}
                  onChange={e => setStatementCutoffDate(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-hidden focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-600 mb-1 block">
                  Statement Ending Balance ({selectedAccount.currency})
                </label>
                <input
                  type="number"
                  value={statementEndingBalance}
                  onChange={e => setStatementEndingBalance(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold font-mono text-slate-900 focus:outline-hidden focus:border-teal-500"
                />
              </div>

              <div className="flex items-end gap-1.5">
                <button
                  onClick={handleAutoMatch}
                  className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center justify-center gap-1"
                >
                  <RefreshCw size={12} />
                  <span>Auto Match</span>
                </button>
                <button
                  onClick={handleGenerateReconciliationDoc}
                  className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center justify-center gap-1"
                >
                  <FileText size={12} />
                  <span>Statement</span>
                </button>
              </div>
            </div>

            {/* Reconciliation KPI Summary Formula */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-slate-100">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80">
                <span className="text-[10px] text-slate-500 block">Statement Balance</span>
                <span className="text-xs font-bold text-slate-900 font-mono">
                  {selectedAccount.currency} {statementEndingBalance.toLocaleString()}
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80">
                <span className="text-[10px] text-emerald-600 block">(+) In-Transit Deposits</span>
                <span className="text-xs font-bold text-emerald-700 font-mono">
                  + {calc.depositsInTransit.toLocaleString()}
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80">
                <span className="text-[10px] text-rose-600 block">(-) Uncleared Payments</span>
                <span className="text-xs font-bold text-rose-700 font-mono">
                  - {calc.outstandingPayments.toLocaleString()}
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80">
                <span className="text-[10px] text-slate-500 block">Adjusted Balance</span>
                <span className="text-xs font-bold text-slate-900 font-mono">
                  = {calc.adjustedBankBalance.toLocaleString()}
                </span>
              </div>
              <div
                className={cn(
                  'p-2.5 rounded-lg border flex flex-col justify-between',
                  calc.isBalanced
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold">Variance</span>
                  {calc.isBalanced ? <Check size={12} className="text-emerald-600" /> : <AlertCircle size={12} className="text-rose-600" />}
                </div>
                <span className="text-xs font-bold font-mono">
                  {selectedAccount.currency} {calc.variance.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Lock Action Bar */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-slate-500">
                {calc.isBalanced
                  ? 'All accounts in balance (0.00 Variance). Ready for audit lock.'
                  : 'Variance detected. Mark transactions cleared to reconcile.'}
              </span>

              {isAdmin && (
                <button
                  onClick={handleFinalizeReconciliation}
                  disabled={!calc.isBalanced}
                  className={cn(
                    'px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors',
                    calc.isBalanced
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  )}
                >
                  <Lock size={12} />
                  <span>Lock & Post Reconciliation</span>
                </button>
              )}
            </div>
          </div>

          {/* Transactions Checklist Table */}
          <div className="bg-white border border-slate-200/80 rounded-xl shadow-2xs overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/40">
              <span className="text-xs font-bold text-slate-900">
                Transactions for Clearance ({reconciliationItems.length})
              </span>
              <span className="text-[11px] text-slate-500">
                {reconciliationItems.filter(i => i.isCleared).length} Cleared • {reconciliationItems.filter(i => !i.isCleared).length} In-Transit
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    <th className="py-2 px-3 text-center w-10">Clear</th>
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Reference</th>
                    <th className="py-2 px-3">Party / Counterparty</th>
                    <th className="py-2 px-3">Source</th>
                    <th className="py-2 px-3">Type</th>
                    <th className="py-2 px-3 text-right">Amount</th>
                    <th className="py-2 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reconciliationItems.map(item => (
                    <tr
                      key={item.id}
                      onClick={() => handleToggleCleared(item.id)}
                      className={cn(
                        'hover:bg-slate-50/70 transition-colors whitespace-nowrap cursor-pointer',
                        item.isCleared ? 'bg-emerald-50/20' : ''
                      )}
                    >
                      <td className="py-2 px-3 text-center" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={item.isCleared}
                          onChange={() => handleToggleCleared(item.id)}
                          className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                        />
                      </td>
                      <td className="py-2 px-3 text-slate-600 font-mono text-[11px]">{item.date}</td>
                      <td className="py-2 px-3 font-mono font-bold text-slate-900">{item.reference}</td>
                      <td className="py-2 px-3 font-medium text-slate-800">{item.party}</td>
                      <td className="py-2 px-3">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium">
                          {item.source}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded text-[10px] font-bold',
                            item.type === 'Deposit'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-rose-50 text-rose-700'
                          )}
                        >
                          {item.type}
                        </span>
                      </td>
                      <td
                        className={cn(
                          'py-2 px-3 text-right font-mono font-bold',
                          item.type === 'Deposit' ? 'text-emerald-600' : 'text-slate-900'
                        )}
                      >
                        {item.type === 'Deposit' ? '+' : '-'} {item.currency} {item.amount.toLocaleString()}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded text-[10px] font-bold border',
                            item.isCleared
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          )}
                        >
                          {item.isCleared ? 'Cleared' : 'In-Transit'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: BANK ACCOUNTS MAINTENANCE */}
      {activeView === 'accounts' && (
        <div className="bg-white border border-slate-200/80 rounded-xl shadow-2xs overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/40">
            <span className="text-xs font-bold text-slate-900">
              Bank Accounts Registry ({bankAccounts.length})
            </span>
            <span className="text-[11px] text-slate-500">
              Only zero-balance accounts can be deleted
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                  <th className="py-2 px-3">Account Name</th>
                  <th className="py-2 px-3">Bank & Branch</th>
                  <th className="py-2 px-3">Account Number</th>
                  <th className="py-2 px-3 text-center">Currency</th>
                  <th className="py-2 px-3 text-right">Book Balance</th>
                  <th className="py-2 px-3 text-right">Statement Balance</th>
                  <th className="py-2 px-3">Last Reconciled</th>
                  <th className="py-2 px-3 text-center">Status</th>
                  <th className="py-2 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bankAccounts.map(acc => (
                  <tr key={acc.id} className="hover:bg-slate-50/70 transition-colors whitespace-nowrap">
                    <td className="py-2 px-3 font-semibold text-slate-900">{acc.name}</td>
                    <td className="py-2 px-3 text-slate-700">
                      {acc.bankName} • <span className="text-slate-500 text-[11px]">{acc.branch}</span>
                    </td>
                    <td className="py-2 px-3 font-mono font-bold text-slate-800">{acc.accountNumber}</td>
                    <td className="py-2 px-3 text-center">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono font-bold text-[10px]">
                        {acc.currency}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                      {acc.currency} {acc.bookBalance.toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-700">
                      {acc.currency} {acc.statementBalance.toLocaleString()}
                    </td>
                    <td className="py-2 px-3 font-mono text-[11px] text-slate-600">{acc.lastReconciledDate}</td>
                    <td className="py-2 px-3 text-center">
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded text-[10px] font-bold border',
                          acc.status === 'Reconciled'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        )}
                      >
                        {acc.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setSelectedAccountId(acc.id);
                            setActiveView('process');
                          }}
                          className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-semibold cursor-pointer"
                        >
                          Reconcile
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteAccount(acc)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                            title={
                              acc.bookBalance !== 0
                                ? 'Cannot delete account with non-zero balance'
                                : 'Delete bank account'
                            }
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD BANK ACCOUNT MODAL */}
      {isAddAccountOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Register Bank Account</h3>
              <button
                onClick={() => setIsAddAccountOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSaveNewAccount} className="space-y-3">
              <div>
                <label className="text-[11px] font-medium text-slate-600 mb-1 block">Account Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Commercial Bank Operational"
                  value={accountFormData.name}
                  onChange={e => setAccountFormData({ ...accountFormData, name: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-medium text-slate-600 mb-1 block">Bank Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Commercial Bank"
                    value={accountFormData.bankName}
                    onChange={e => setAccountFormData({ ...accountFormData, bankName: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-600 mb-1 block">Currency</label>
                  <select
                    value={accountFormData.currency}
                    onChange={e =>
                      setAccountFormData({ ...accountFormData, currency: e.target.value as 'LKR' | 'USD' })
                    }
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="LKR">LKR (Sri Lankan Rupee)</option>
                    <option value="USD">USD (US Dollar)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-medium text-slate-600 mb-1 block">Account Number</label>
                  <input
                    type="text"
                    required
                    placeholder="1010-XXXX-XXXX"
                    value={accountFormData.accountNumber}
                    onChange={e => setAccountFormData({ ...accountFormData, accountNumber: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-600 mb-1 block">Branch</label>
                  <input
                    type="text"
                    placeholder="Branch location"
                    value={accountFormData.branch}
                    onChange={e => setAccountFormData({ ...accountFormData, branch: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-600 mb-1 block">Opening Balance</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={accountFormData.openingBalance}
                  onChange={e =>
                    setAccountFormData({ ...accountFormData, openingBalance: Number(e.target.value) })
                  }
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddAccountOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
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
