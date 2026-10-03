import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Trash2,
  AlertCircle,
  CheckCircle2,
  FileText,
  Building2,
  Truck,
  Plus,
  Edit2,
  X
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Client, Invoice, Payment, Adjustment } from '../../types';
import { AccountsPayableRecord } from '../../services/accountingControlService';
import { AccountingDocumentModal, AccountingDocumentSpec } from './AccountingDocumentModal';
import { procurementService } from '../../services/procurementService';
import { factoryExecutionService } from '../../services/factoryExecutionService';
import { payrollService } from '../../services/payrollService';
import { toast } from 'sonner';

export type PartyType = 'Client' | 'Supplier' | 'Factory' | 'Subcontractor' | 'Employee';

export interface PartyAccount {
  id: string;
  code: string;
  name: string;
  type: PartyType;
  category: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  totalBilled: number;
  totalSettled: number;
  unpaidBalance: number;
  balanceType: 'Receivable' | 'Payable';
  status: 'Active' | 'Settled' | 'Frozen';
  notes?: string;
}

interface AccountingPartiesSectionProps {
  clients: Client[];
  invoices: Invoice[];
  payments: Payment[];
  adjustments: Adjustment[];
  apRecords: AccountsPayableRecord[];
  isAdmin: boolean;
  onNavigatePortal?: (portalView: string, subTab?: string) => void;
  onOpenRecordPayment?: () => void;
  canDownload?: boolean;
  onAddNotification?: (title: string, message: string, type?: any) => void;
}

export const AccountingPartiesSection: React.FC<AccountingPartiesSectionProps> = ({
  clients,
  invoices,
  payments,
  adjustments,
  apRecords,
  isAdmin,
  onNavigatePortal: _onNavigatePortal,
  onOpenRecordPayment: _onOpenRecordPayment,
  canDownload = true,
  onAddNotification
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedPartyDoc, setSelectedPartyDoc] = useState<AccountingDocumentSpec | null>(null);

  // Add / Edit Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingParty, setEditingParty] = useState<PartyAccount | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'Supplier' as PartyType,
    category: '',
    contactPerson: '',
    phone: '',
    email: '',
    notes: '',
    openingBalance: 0
  });

  // Initial internal parties list incorporating seed and live entities
  const [customParties, setCustomParties] = useState<PartyAccount[]>([
    {
      id: 'pty-fac-01',
      code: 'FAC-001',
      name: 'Innovista Precision CNC Plant (Kaduwela)',
      type: 'Factory',
      category: 'In-House Fabrication',
      contactPerson: 'Sunil Jayawardena (Plant Mgr)',
      phone: '+94 11 234 5671',
      totalBilled: 14500000,
      totalSettled: 14500000,
      unpaidBalance: 0,
      balanceType: 'Payable',
      status: 'Settled',
      notes: 'Internal factory cost center allocation.'
    },
    {
      id: 'pty-fac-02',
      code: 'FAC-002',
      name: 'Extrusion & Coating Center (Biyagama)',
      type: 'Factory',
      category: 'Powder Coating & Anodizing',
      contactPerson: 'Kithsiri Mendis',
      phone: '+94 11 234 5672',
      totalBilled: 8200000,
      totalSettled: 7100000,
      unpaidBalance: 1100000,
      balanceType: 'Payable',
      status: 'Active',
      notes: 'Pending final certification for batch coating.'
    },
    {
      id: 'pty-sub-01',
      code: 'SUB-001',
      name: 'Apex Glazing Rigging Gang Ltd',
      type: 'Subcontractor',
      category: 'Site Installation & Spider Crane',
      contactPerson: 'Dhammika Bandara',
      phone: '+94 77 123 4567',
      totalBilled: 3800000,
      totalSettled: 3200000,
      unpaidBalance: 600000,
      balanceType: 'Payable',
      status: 'Active',
      notes: '5% retention held until practical completion.'
    },
    {
      id: 'pty-sub-02',
      code: 'SUB-002',
      name: 'Lanka Sealant Applicators Co',
      type: 'Subcontractor',
      category: 'Weather Silicone Application',
      contactPerson: 'Roshan Fernando',
      phone: '+94 71 987 6543',
      totalBilled: 1200000,
      totalSettled: 1200000,
      unpaidBalance: 0,
      balanceType: 'Payable',
      status: 'Settled',
      notes: 'Fully settled upon site inspection pass.'
    }
  ]);

  // Aggregate Clients into PartyAccounts
  const clientParties = useMemo(() => {
    return clients.map(client => {
      const clientInvs = invoices.filter(i => i.client?.id === client.id);
      const totalBilled = clientInvs.reduce((sum, i) => sum + i.grandTotal, 0);
      const clientPays = payments.filter(p => p.clientId === client.id);
      const totalPaid = clientPays.reduce((sum, p) => sum + p.amount, 0);
      const clientAdjs = adjustments.filter(a => a.clientId === client.id);
      const totalAdj = clientAdjs.reduce((sum, a) => sum + a.amount, 0);

      const unpaidBalance = Math.max(0, totalBilled - totalPaid - totalAdj);

      return {
        id: `client-${client.id}`,
        code: `CUST-${client.id.substring(0, 4).toUpperCase()}`,
        name: client.name,
        type: 'Client' as PartyType,
        category: 'Project Owner / Developer',
        contactPerson: (client as any).contactPerson || (client as any).contactPersons?.[0]?.name || client.name,
        phone: client.phone,
        email: client.email,
        totalBilled,
        totalSettled: totalPaid + totalAdj,
        unpaidBalance,
        balanceType: 'Receivable' as const,
        status: unpaidBalance === 0 ? ('Settled' as const) : ('Active' as const),
        notes: `Total ${clientInvs.length} invoices recorded.`
      };
    });
  }, [clients, invoices, payments, adjustments]);

  // Aggregate Suppliers into PartyAccounts from AP records & Procurement Service
  const supplierParties = useMemo(() => {
    const map = new Map<string, { totalBilled: number; totalSettled: number; unpaid: number; code?: string; category?: string; phone?: string; email?: string }>();

    // Seed/Live suppliers from procurementService
    try {
      const suppliers = procurementService.getSuppliers();
      suppliers.forEach(s => {
        map.set(s.name, {
          totalBilled: 0,
          totalSettled: 0,
          unpaid: 0,
          code: s.vendorCode,
          category: s.category,
          phone: s.phone,
          email: s.email
        });
      });
    } catch {
      // fallback safe
    }

    // Overlay AP bills
    apRecords.forEach(bill => {
      const current = map.get(bill.supplierName) || {
        totalBilled: 0,
        totalSettled: 0,
        unpaid: 0,
        category: 'Procurement Material / Hardware'
      };
      current.totalBilled += bill.grossAmount;
      if (bill.status === 'Paid') {
        current.totalSettled += bill.netPayable;
      } else {
        current.unpaid += bill.netPayable;
      }
      map.set(bill.supplierName, current);
    });

    return Array.from(map.entries()).map(([name, data], idx) => ({
      id: `sup-auto-${idx}`,
      code: data.code || `SUP-${String(idx + 1).padStart(3, '0')}`,
      name,
      type: 'Supplier' as PartyType,
      category: data.category || 'Procurement Material / Hardware',
      contactPerson: 'Commercial Sales Dept',
      phone: data.phone,
      email: data.email,
      totalBilled: data.totalBilled,
      totalSettled: data.totalSettled,
      unpaidBalance: data.unpaid,
      balanceType: 'Payable' as const,
      status: data.unpaid === 0 ? ('Settled' as const) : ('Active' as const),
      notes: 'Procurement vendor ledger account.'
    }));
  }, [apRecords]);

  // Live Factory Accounts from Factory Execution Service
  const factoryParties = useMemo(() => {
    try {
      const factories = factoryExecutionService.getFactories();
      return factories.map(f => {
        return {
          id: `fac-live-${f.id}`,
          code: f.code || `FAC-${f.id.slice(0, 4).toUpperCase()}`,
          name: f.name,
          type: 'Factory' as PartyType,
          category: (f as any).location || (f as any).address || 'Fabrication Plant',
          contactPerson: f.managerName || 'Plant Manager',
          phone: f.contactPhone || '+94 11 234 5670',
          totalBilled: 5000000,
          totalSettled: 5000000,
          unpaidBalance: 0,
          balanceType: 'Payable' as const,
          status: 'Settled' as const,
          notes: `Plant capacity: ${(f as any).capacity || 'Standard'}`
        };
      });
    } catch {
      return [];
    }
  }, []);

  // Live Employees from Payroll Service
  const employeeParties = useMemo(() => {
    try {
      const employees = payrollService.getEmployees();
      return employees.map(emp => {
        const netSalary = emp.basicSalary || 150000;
        const isPaid = (emp as any).status !== 'Inactive';
        return {
          id: `emp-live-${emp.employeeId || emp.id}`,
          code: emp.employeeId || `EMP-${emp.id.slice(0, 3)}`,
          name: emp.employeeName || (emp as any).fullName || 'Staff Member',
          type: 'Employee' as PartyType,
          category: emp.designation || 'Staff',
          contactPerson: 'Self',
          phone: (emp as any).phone || '+94 77 123 4567',
          email: (emp as any).email || `${emp.employeeId.toLowerCase()}@innovista.com`,
          totalBilled: netSalary,
          totalSettled: isPaid ? netSalary : 0,
          unpaidBalance: isPaid ? 0 : netSalary,
          balanceType: 'Payable' as const,
          status: isPaid ? ('Settled' as const) : ('Active' as const),
          notes: `Department: ${emp.department}`
        };
      });
    } catch {
      return [];
    }
  }, []);

  // Combined Parties (deduplicating by name)
  const allParties = useMemo(() => {
    const list = [...clientParties, ...supplierParties, ...customParties, ...factoryParties, ...employeeParties];
    const seen = new Set<string>();
    return list.filter(item => {
      const key = item.name.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [clientParties, supplierParties, customParties, factoryParties, employeeParties]);

  // Filtering
  const filteredParties = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return allParties.filter(party => {
      const matchesSearch =
        !q ||
        party.name.toLowerCase().includes(q) ||
        party.code.toLowerCase().includes(q) ||
        party.category.toLowerCase().includes(q) ||
        (party.contactPerson && party.contactPerson.toLowerCase().includes(q));

      const matchesType = typeFilter === 'All' || party.type === typeFilter;
      const matchesStatus =
        statusFilter === 'All' ||
        (statusFilter === 'Unsettled' && party.unpaidBalance > 0) ||
        (statusFilter === 'Settled' && party.unpaidBalance === 0);

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [allParties, searchQuery, typeFilter, statusFilter]);

  // Totals
  const totals = useMemo(() => {
    let receivables = 0;
    let payables = 0;
    let unsettledCount = 0;

    allParties.forEach(p => {
      if (p.balanceType === 'Receivable') receivables += p.unpaidBalance;
      if (p.balanceType === 'Payable') payables += p.unpaidBalance;
      if (p.unpaidBalance > 0) unsettledCount++;
    });

    return { receivables, payables, unsettledCount, totalParties: allParties.length };
  }, [allParties]);

  // STRICT DELETE ACCOUNT WITH UNPAID BALANCE RESTRICTION & ADMIN CHECK
  const handleDeleteAccount = (party: PartyAccount) => {
    // 1. Strict Balance Rule:
    if (party.unpaidBalance > 0) {
      const warningText = `Cannot delete account: ${party.name} has an unsettled balance of LKR ${party.unpaidBalance.toLocaleString()} (${party.balanceType}). All balances must be settled before deleting.`;
      toast.error('Cannot Delete Account', {
        description: warningText
      });
      onAddNotification?.('Deletion Prevented: Unpaid Balance', warningText, 'warning');
      return;
    }

    // 2. Admin Permission Check:
    if (!isAdmin) {
      toast.error('Permission Denied', {
        description: 'Only system administrators have permission to delete party accounts.'
      });
      return;
    }

    // If settled and admin:
    setCustomParties(prev => prev.filter(p => p.id !== party.id));
    toast.success('Account Deleted', {
      description: `Account for ${party.name} (${party.code}) was deleted.`
    });
  };

  // Add / Edit Account Handlers (Admin Only)
  const handleOpenAddModal = () => {
    if (!isAdmin) {
      toast.error('Permission Denied', { description: 'Only administrators can create party accounts.' });
      return;
    }
    setEditingParty(null);
    setFormData({
      name: '',
      type: 'Supplier',
      category: '',
      contactPerson: '',
      phone: '',
      email: '',
      notes: '',
      openingBalance: 0
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (party: PartyAccount) => {
    if (!isAdmin) {
      toast.error('Permission Denied', { description: 'Only administrators can edit party accounts.' });
      return;
    }
    setEditingParty(party);
    setFormData({
      name: party.name,
      type: party.type,
      category: party.category,
      contactPerson: party.contactPerson || '',
      phone: party.phone || '',
      email: party.email || '',
      notes: party.notes || '',
      openingBalance: party.unpaidBalance
    });
    setIsAddModalOpen(true);
  };

  const handleSavePartyForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    if (!formData.name.trim()) {
      toast.error('Validation Error', { description: 'Entity Name is required.' });
      return;
    }

    if (editingParty) {
      // Update
      setCustomParties(prev =>
        prev.map(p =>
          p.id === editingParty.id
            ? {
                ...p,
                name: formData.name.trim(),
                type: formData.type,
                category: formData.category.trim() || p.category,
                contactPerson: formData.contactPerson.trim(),
                phone: formData.phone.trim(),
                email: formData.email.trim(),
                notes: formData.notes.trim()
              }
            : p
        )
      );
      toast.success('Party Account Updated', { description: `${formData.name} was updated.` });
    } else {
      // Create new
      const codePrefix =
        formData.type === 'Client'
          ? 'CUST'
          : formData.type === 'Supplier'
          ? 'SUP'
          : formData.type === 'Factory'
          ? 'FAC'
          : formData.type === 'Subcontractor'
          ? 'SUB'
          : 'EMP';

      const newParty: PartyAccount = {
        id: `pty-custom-${Date.now()}`,
        code: `${codePrefix}-${Math.floor(100 + Math.random() * 900)}`,
        name: formData.name.trim(),
        type: formData.type,
        category: formData.category.trim() || 'Commercial Party',
        contactPerson: formData.contactPerson.trim() || 'Principal Contact',
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        totalBilled: Number(formData.openingBalance) || 0,
        totalSettled: 0,
        unpaidBalance: Number(formData.openingBalance) || 0,
        balanceType: formData.type === 'Client' ? 'Receivable' : 'Payable',
        status: (Number(formData.openingBalance) || 0) === 0 ? 'Settled' : 'Active',
        notes: formData.notes.trim()
      };

      setCustomParties(prev => [newParty, ...prev]);
      toast.success('Party Account Created', { description: `${newParty.name} (${newParty.code}) was created.` });
    }

    setIsAddModalOpen(false);
  };

  // Generate Party Statement Document
  const handleOpenPartyStatement = (party: PartyAccount) => {
    const spec: AccountingDocumentSpec = {
      docTitle: `${party.type.toUpperCase()} ACCOUNT STATEMENT`,
      docNo: `STM-${party.code}-${new Date().toISOString().substring(0, 10)}`,
      docDate: new Date().toISOString().substring(0, 10),
      category: `${party.type} Ledger Statement`,
      partyName: party.name,
      partyType: party.type,
      strategyBox1Label: 'Total Volume',
      strategyBox1Value: `LKR ${party.totalBilled.toLocaleString()}`,
      strategyBox2Label: 'Settled to Date',
      strategyBox2Value: `LKR ${party.totalSettled.toLocaleString()}`,
      strategyBox3Label: 'Unsettled Balance',
      strategyBox3Value: `LKR ${party.unpaidBalance.toLocaleString()}`,
      scheduleHeaders: ['Ref Code', 'Description', 'Category', 'Settled', 'Balance'],
      scheduleRows: [
        {
          col1: party.code,
          col2: `Accumulated Ledger Record for ${party.name}`,
          col3: party.category,
          col4: `LKR ${party.totalSettled.toLocaleString()}`,
          col5: `LKR ${party.unpaidBalance.toLocaleString()}`,
          isHighlight: party.unpaidBalance > 0
        },
        {
          col1: 'AUDIT-01',
          col2: 'Commercial Balance Verification',
          col3: 'Verified',
          col4: 'Audited',
          col5: party.unpaidBalance === 0 ? 'Fully Settled' : 'Open Balance'
        }
      ],
      summaryTotals: [
        { label: 'Total Volume', value: `LKR ${party.totalBilled.toLocaleString()}` },
        { label: 'Settled to Date', value: `LKR ${party.totalSettled.toLocaleString()}` },
        { label: 'Net Unsettled Balance', value: `LKR ${party.unpaidBalance.toLocaleString()}` }
      ],
      terms: [
        {
          title: 'Veracity & Validity Concept',
          content: 'All party financial transactions reflect audited commercial source vouchers.'
        },
        {
          title: 'Settlement Requirement',
          content: 'No account closure or deletion permitted while unsettled obligations remain.'
        }
      ],
      preparedBy: 'Financial Accounts Controller',
      approvedBy: 'Chief Accountant (FC)',
      authorizationStatus: party.unpaidBalance === 0 ? 'Audited & Locked' : 'Approved',
      auditStamp: `SYS-VERIFY-PTY-${party.code}-${Date.now().toString(36).toUpperCase()}`
    };

    setSelectedPartyDoc(spec);
  };

  return (
    <div className="space-y-3">
      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-medium">Customer Receivables</span>
            <Users size={14} className="text-orange-600" />
          </div>
          <p className="text-base font-bold text-slate-900 font-mono">
            LKR {totals.receivables.toLocaleString()}
          </p>
          <span className="text-[10px] text-slate-400">From clients & claims</span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-medium">Payables</span>
            <Truck size={14} className="text-blue-600" />
          </div>
          <p className="text-base font-bold text-slate-900 font-mono">
            LKR {totals.payables.toLocaleString()}
          </p>
          <span className="text-[10px] text-slate-400">Suppliers, factories & staff</span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-medium">Unsettled Accounts</span>
            <AlertCircle size={14} className="text-rose-600" />
          </div>
          <p className="text-base font-bold text-rose-600 font-mono">
            {totals.unsettledCount} Active Balances
          </p>
          <span className="text-[10px] text-rose-500 font-medium">Protected against deletion</span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-medium">Total Entities</span>
            <Building2 size={14} className="text-emerald-600" />
          </div>
          <p className="text-base font-bold text-slate-900 font-mono">{totals.totalParties} Accounts</p>
          <span className="text-[10px] text-slate-400">All registered parties</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
        <div className="flex items-center gap-2 flex-1 min-w-[260px]">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search customers, suppliers, factories, subcontractors, employees..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-7 pr-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:ring-1 focus:ring-orange-500"
            />
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="py-1 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-hidden"
          >
            <option value="All">All Types</option>
            <option value="Client">Clients</option>
            <option value="Supplier">Suppliers</option>
            <option value="Factory">Factories</option>
            <option value="Subcontractor">Subcontractors</option>
            <option value="Employee">Employees</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="py-1 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-hidden"
          >
            <option value="All">All Balances</option>
            <option value="Unsettled">Unsettled Only</option>
            <option value="Settled">Settled (0)</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={handleOpenAddModal}
              className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Plus size={12} />
              <span>Add Party</span>
            </button>
          )}
        </div>
      </div>

      {/* Parties Table */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-2xs overflow-hidden">
        <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-900">Commercial Parties & Balance Control</span>
            <span className="text-[10px] text-slate-500">
              (Unsettled accounts are locked from deletion)
            </span>
          </div>
          <span className="text-[11px] font-mono font-semibold text-slate-500">
            {filteredParties.length} Records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                <th className="py-2.5 px-3">Code</th>
                <th className="py-2.5 px-3">Entity Name</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Category / Role</th>
                <th className="py-2.5 px-3 text-right">Total Turn</th>
                <th className="py-2.5 px-3 text-right">Settled</th>
                <th className="py-2.5 px-3 text-right">Unpaid Balance</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredParties.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                    No matching party accounts found.
                  </td>
                </tr>
              ) : (
                filteredParties.map(party => {
                  const hasUnpaid = party.unpaidBalance > 0;
                  return (
                    <tr key={party.id} className="hover:bg-slate-50/70 transition-colors whitespace-nowrap">
                      <td className="py-2 px-3 font-mono font-bold text-slate-700">{party.code}</td>
                      <td className="py-2 px-3">
                        <div className="font-semibold text-slate-900">{party.name}</div>
                        {party.contactPerson && (
                          <div className="text-[10px] text-slate-400">{party.contactPerson}</div>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded text-[10px] font-bold',
                            party.type === 'Client' && 'bg-orange-50 text-orange-700 border border-orange-200',
                            party.type === 'Supplier' && 'bg-blue-50 text-blue-700 border border-blue-200',
                            party.type === 'Factory' && 'bg-indigo-50 text-indigo-700 border border-indigo-200',
                            party.type === 'Subcontractor' && 'bg-amber-50 text-amber-700 border border-amber-200',
                            party.type === 'Employee' && 'bg-teal-50 text-teal-700 border border-teal-200'
                          )}
                        >
                          {party.type}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-600 text-[11px]">{party.category}</td>
                      <td className="py-2 px-3 text-right font-mono text-slate-700">
                        LKR {party.totalBilled.toLocaleString()}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-emerald-600">
                        LKR {party.totalSettled.toLocaleString()}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <span
                          className={cn(
                            'font-mono font-bold text-xs',
                            hasUnpaid ? 'text-rose-600' : 'text-slate-400'
                          )}
                        >
                          LKR {party.unpaidBalance.toLocaleString()}
                        </span>
                        {hasUnpaid && (
                          <span className="block text-[9px] font-semibold text-rose-500 uppercase">
                            {party.balanceType}
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1',
                            hasUnpaid
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          )}
                        >
                          {hasUnpaid ? (
                            <>
                              <AlertCircle size={10} /> Unsettled
                            </>
                          ) : (
                            <>
                              <CheckCircle2 size={10} /> Settled
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenPartyStatement(party)}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                            title="View Statement"
                          >
                            <FileText size={11} />
                            <span>Statement</span>
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => handleOpenEditModal(party)}
                              className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer transition-colors"
                              title="Edit Party Account (Admin Only)"
                            >
                              <Edit2 size={12} />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteAccount(party)}
                            className={cn(
                              'p-1 rounded cursor-pointer transition-colors',
                              hasUnpaid
                                ? 'text-rose-300 hover:text-rose-600'
                                : 'text-slate-400 hover:text-rose-600'
                            )}
                            title={
                              hasUnpaid
                                ? 'Locked: Cannot delete while unpaid balance exists'
                                : 'Delete settled account (Admin only)'
                            }
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT PARTY MODAL (ADMIN ONLY) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                {editingParty ? 'Edit Party Account' : 'Register Party Account'}
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleSavePartyForm} className="space-y-3">
              <div>
                <label className="text-[11px] font-medium text-slate-600 mb-1 block">Entity Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alumex Extrusions PLC"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-medium text-slate-600 mb-1 block">Party Type</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value as PartyType })}
                    disabled={Boolean(editingParty)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="Client">Customer / Client</option>
                    <option value="Supplier">Supplier / Vendor</option>
                    <option value="Factory">Plant / Factory</option>
                    <option value="Subcontractor">Subcontractor</option>
                    <option value="Employee">Employee / Staff</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-600 mb-1 block">Category / Trade</label>
                  <input
                    type="text"
                    placeholder="e.g. Aluminium Profiles"
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-medium text-slate-600 mb-1 block">Contact Person</label>
                  <input
                    type="text"
                    placeholder="Contact name"
                    value={formData.contactPerson}
                    onChange={e => setFormData({ ...formData, contactPerson: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-600 mb-1 block">Phone</label>
                  <input
                    type="text"
                    placeholder="+94 XX XXX XXXX"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-600 mb-1 block">Email</label>
                <input
                  type="email"
                  placeholder="contact@entity.com"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              {!editingParty && (
                <div>
                  <label className="text-[11px] font-medium text-slate-600 mb-1 block">Opening Balance (LKR)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={formData.openingBalance}
                    onChange={e => setFormData({ ...formData, openingBalance: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  {editingParty ? 'Save Changes' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Layout Modal for Party Statement */}
      <AccountingDocumentModal
        spec={selectedPartyDoc}
        isOpen={Boolean(selectedPartyDoc)}
        onClose={() => setSelectedPartyDoc(null)}
        canDownload={canDownload}
        isAdmin={isAdmin}
        onAddNotification={onAddNotification}
      />
    </div>
  );
};
