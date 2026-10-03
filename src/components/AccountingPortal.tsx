import React, { useState, useMemo } from 'react';
import { analyzeEvidence } from '../services/evidenceService';
import { 
  CreditCard, 
  Plus, 
  Search, 
  Download, 
  ChevronRight, 
  User, 
  Building2, 
  AlertCircle,
  FileText,
  History,
  TrendingUp,
  PieChart as PieChartIcon,
  DollarSign,
  Clock,
  X,
  ArrowLeft,
  Upload,
  Eye,
  Loader2,
  Edit2,
  Trash2,
  Check,
  RefreshCw,
  Calendar,
  Package,
  Folder,
  LayoutDashboard,
  Scale,
  Landmark,
  Briefcase,
  Lock,
  Receipt,
  Truck,
  Users,
  Wrench,
  ShieldCheck
} from 'lucide-react';
import { 
  Invoice, 
  Payment, 
  Adjustment, 
  Client, 
  Project, 
  CustomerFinancials,
  Transaction,
  PaymentMethod,
  InvoiceStatus,
  CompanySettings,
  Quote
} from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell
} from 'recharts';
import { cn } from '../lib/utils';
import { generateAccountingReportPDF, generateAllCustomerReportsPDF, generateCustomerTAccountPDF } from '../pdfGenerator';
import { AccountingLandingPage, AccountingTab } from './accounting/AccountingLandingPage';
import { accountingControlService } from '../services/accountingControlService';
import { GlAndCoaSection, ApThreeWaySection } from './accounting/AccountingControlModules';
import { BankAndCashSection, AssetsTaxCloseSection } from './accounting/AccountingAdvancedModules';
import { useSecurity } from '../context/SecurityContext';
import { toast } from 'sonner';
import { AccountingDocumentModal, AccountingDocumentSpec } from './accounting/AccountingDocumentModal';
import { BankReconciliationSection } from './accounting/BankReconciliationSection';
import { AccountingPartiesSection } from './accounting/AccountingPartiesSection';
import { AccountingPayrollSection } from './accounting/AccountingPayrollSection';
import { AccountingCostingSection } from './accounting/AccountingCostingSection';
import { procurementService } from '../services/procurementService';
import { factoryExecutionService } from '../services/factoryExecutionService';
import { payrollService } from '../services/payrollService';
import { equipmentControlService } from '../services/equipmentControlService';

interface AccountingPortalProps {
  invoices: Invoice[];
  payments: Payment[];
  adjustments: Adjustment[];
  clients: Client[];
  projects: Project[];
  settings: CompanySettings;
  onAddPayment: (payment: Payment) => void;
  onDeletePayment: (id: string) => void;
  onUpdatePayment: (payment: Payment) => void;
  onAddAdjustment: (adjustment: Adjustment) => void;
  onDeleteAdjustment: (id: string) => void;
  onUpdateAdjustment: (adjustment: Adjustment) => void;
  onAddNotification: (title: string, message: string, type?: any) => void;
  onProcessRecurring?: () => void;
  initialTab?: AccountingTab;
  onTabChange?: (tab: AccountingTab) => void;
  preselectedInvoiceId?: string | null;
  onClearPreselectedInvoice?: () => void;
  projectIdFilter?: string | null;
  onOpenCatalog?: (context?: 'accounting') => void;
  onNavigateToPortal?: (portalView: string, subTab?: string) => void;
  quotes?: Quote[];
  warrantyCertificates?: any[];
  equipment?: any[];
  personnel?: any[];
}

export const AccountingPortal: React.FC<AccountingPortalProps> = ({
  invoices,
  payments,
  adjustments,
  clients,
  projects,
  settings,
  onAddPayment,
  onDeletePayment,
  onUpdatePayment,
  onAddAdjustment,
  onDeleteAdjustment,
  onUpdateAdjustment,
  onAddNotification,
  onProcessRecurring,
  initialTab = 'landing',
  onTabChange,
  preselectedInvoiceId,
  onClearPreselectedInvoice,
  projectIdFilter,
  onOpenCatalog,
  onNavigateToPortal,
  quotes = [],
  warrantyCertificates = [],
  equipment = [],
  personnel: _personnel = []
}) => {
  const [activeTab, setActiveTab] = useState<AccountingTab>(initialTab || 'landing');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [editingAdjustment, setEditingAdjustment] = useState<Adjustment | null>(null);
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [paymentSearchQuery, setPaymentSearchQuery] = useState('');
  const [paymentProjectFilter, setPaymentProjectFilter] = useState<string>(projectIdFilter || 'All');
  const [adjustmentSearchQuery, setAdjustmentSearchQuery] = useState('');
  const [adjustmentProjectFilter, setAdjustmentProjectFilter] = useState<string>(projectIdFilter || 'All');

  // Persistent Construction Accounting Sub-Ledgers
  const [coaList, setCoaList] = useState(() => accountingControlService.getCoa());
  const [journals, setJournals] = useState(() => accountingControlService.getJournals());
  const [apRecords, setApRecords] = useState(() => accountingControlService.getApRecords());
  const [bankRecords, setBankRecords] = useState(() => accountingControlService.getBankRecords());
  const [pettyRecords, setPettyRecords] = useState(() => accountingControlService.getPettyCash());
  const [wipRecords] = useState(() => accountingControlService.getProjectWip());
  const [assetRecords, setAssetRecords] = useState(() => accountingControlService.getFixedAssets());
  const [taxRecords, setTaxRecords] = useState(() => accountingControlService.getTaxRecords());
  const [closeSteps, setCloseSteps] = useState(() => accountingControlService.getPeriodCloseSteps());

  const [glSearchQuery, setGlSearchQuery] = useState('');
  const [isAddingJournal, setIsAddingJournal] = useState(false);
  const [isAddingAp, setIsAddingAp] = useState(false);
  const [isAddingBank, setIsAddingBank] = useState(false);
  const [isAddingAsset, setIsAddingAsset] = useState(false);

  const { currentUser, isAdminAuthority, hasPermission } = useSecurity();
  const isAdmin = isAdminAuthority || Boolean((currentUser as any)?.role?.name?.toLowerCase().includes('admin')) || Boolean((currentUser as any)?.roleName?.toLowerCase().includes('admin'));
  const canDownload = hasPermission('accounting:download') || hasPermission('finance:export') || isAdmin;

  const [activeReportDoc, setActiveReportDoc] = useState<AccountingDocumentSpec | null>(null);
  const [universalSearchQuery, setUniversalSearchQuery] = useState('');
  const [showUniversalSearchResults, setShowUniversalSearchResults] = useState(false);

  // Handle preselected invoice
  React.useEffect(() => {
    if (preselectedInvoiceId) {
      const invoice = invoices.find(i => i.id === preselectedInvoiceId);
      if (invoice) {
        // If we have a preselected invoice, open the payment modal
        setIsPaymentModalOpen(true);
        setEditingPayment(null);
      }
    }
  }, [preselectedInvoiceId, invoices]);

  // Sync activeTab with initialTab prop
  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Financial Calculations
  const financials = useMemo(() => {
    const clientFinancials: Record<string, CustomerFinancials> = {};

    clients.forEach(client => {
      const clientInvoices = invoices.filter(i => i.client.id === client.id);
      const clientPayments = payments.filter(p => p.clientId === client.id);
      const clientAdjustments = adjustments.filter(a => a.clientId === client.id);

      const totalInvoiced = clientInvoices.reduce((sum, i) => sum + i.grandTotal, 0);
      const totalPaid = clientPayments.reduce((sum, p) => sum + p.amount, 0);
      const totalAdjusted = clientAdjustments.reduce((sum, a) => sum + a.amount, 0);
      const totalRetention = clientInvoices.reduce((sum, i) => sum + (i.retentionAmount || 0), 0);
      const totalRetentionReleased = clientAdjustments
        .filter(a => a.type === 'Retention Release')
        .reduce((sum, a) => sum + a.amount, 0);
      
      const outstandingBalance = totalInvoiced - totalPaid - totalAdjusted;

      clientFinancials[client.id] = {
        clientId: client.id,
        totalInvoiced,
        totalPaid,
        totalAdjusted,
        totalRetention,
        totalRetentionReleased,
        outstandingBalance,
        lastPaymentDate: clientPayments.length > 0 
          ? clientPayments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date 
          : undefined,
        aging: {
          current: outstandingBalance, // Simplified aging for now
          '1-30': 0,
          '31-60': 0,
          '61-90': 0,
          '90+': 0
        }
      };
    });

    return clientFinancials;
  }, [clients, invoices, payments, adjustments]);

  const totalReceivables = useMemo(() => {
    return (Object.values(financials) as CustomerFinancials[]).reduce((sum, f) => sum + f.outstandingBalance, 0);
  }, [financials]);

  const totalInvoiced = useMemo(() => {
    return (Object.values(financials) as CustomerFinancials[]).reduce((sum, f) => sum + f.totalInvoiced, 0);
  }, [financials]);

  const totalCollected = useMemo(() => {
    return (Object.values(financials) as CustomerFinancials[]).reduce((sum, f) => sum + f.totalPaid, 0);
  }, [financials]);

  // Universal System Search with Actual Linked Records across All Portals
  const universalSearchResults = useMemo(() => {
    const q = universalSearchQuery.toLowerCase().trim();
    if (!q) return [];
    const results: Array<{
      type: string;
      title: string;
      subtitle: string;
      value: string;
      badgeColor: string;
      onSelect: () => void;
    }> = [];

    // 1. Customers (Quotation / Invoices / Directory)
    clients.forEach(c => {
      if (c.name.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.id.toLowerCase().includes(q)) {
        const fin = financials[c.id];
        results.push({
          type: 'Customer',
          title: c.name,
          subtitle: c.email || 'Customer Account',
          value: `Due: LKR ${(fin?.outstandingBalance || 0).toLocaleString()}`,
          badgeColor: 'bg-orange-50 text-orange-700 border border-orange-200',
          onSelect: () => {
            setSelectedClientId(c.id);
            setActiveTab('ledgers');
          }
        });
      }
    });

    // 2. Quotations (Margin, Customer, Value)
    quotes.forEach(quote => {
      const qNum = (quote as any).quoteNumber || quote.quoteNo || '';
      const cName = (quote as any).clientName || quote.client?.name || '';
      const pName = (quote as any).projectName || '';
      const margin = (quote as any).profitMargin || 18;
      if (
        qNum.toLowerCase().includes(q) ||
        cName.toLowerCase().includes(q) ||
        pName.toLowerCase().includes(q)
      ) {
        results.push({
          type: 'Quotation',
          title: qNum,
          subtitle: `${cName} • Margin: ${margin}%`,
          value: `Quote: LKR ${(quote.grandTotal || 0).toLocaleString()}`,
          badgeColor: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
          onSelect: () => {
            setActiveTab('project_accounting');
          }
        });
      }
    });

    // 3. Projects & Budgets
    projects.forEach(p => {
      if (p.projectName.toLowerCase().includes(q) || (p.projectCode && p.projectCode.toLowerCase().includes(q))) {
        results.push({
          type: 'Project',
          title: p.projectName,
          subtitle: p.projectCode || p.id,
          value: `Budget: LKR ${((p as any).budget || (p as any).contractValue || 0).toLocaleString()}`,
          badgeColor: 'bg-blue-50 text-blue-700 border border-blue-200',
          onSelect: () => {
            setActiveTab('project_accounting');
          }
        });
      }
    });

    // 4. Invoices & Claims
    invoices.forEach(inv => {
      if (inv.invoiceNo.toLowerCase().includes(q) || inv.client.name.toLowerCase().includes(q)) {
        results.push({
          type: 'Invoice',
          title: inv.invoiceNo,
          subtitle: `${inv.client.name} • ${inv.status}`,
          value: `Due: LKR ${inv.balanceDue.toLocaleString()}`,
          badgeColor: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
          onSelect: () => {
            setActiveTab('payments');
            setPaymentSearchQuery(inv.invoiceNo);
          }
        });
      }
    });

    // 5. Payment Receipts
    payments.forEach(p => {
      if (p.paymentNo.toLowerCase().includes(q) || p.clientName.toLowerCase().includes(q) || (p.reference && p.reference.toLowerCase().includes(q))) {
        results.push({
          type: 'Receipt',
          title: p.paymentNo,
          subtitle: `${p.clientName} • ${p.method}`,
          value: `LKR ${p.amount.toLocaleString()}`,
          badgeColor: 'bg-teal-50 text-teal-700 border border-teal-200',
          onSelect: () => {
            setActiveTab('payments');
            setPaymentSearchQuery(p.paymentNo);
          }
        });
      }
    });

    // 6. Suppliers (from Procurement Hub)
    try {
      const suppliers = procurementService.getSuppliers();
      suppliers.forEach(s => {
        if (s.name.toLowerCase().includes(q) || s.vendorCode?.toLowerCase().includes(q) || s.category?.toLowerCase().includes(q)) {
          results.push({
            type: 'Supplier',
            title: s.name,
            subtitle: `${s.vendorCode} • ${s.category}`,
            value: s.status,
            badgeColor: 'bg-purple-50 text-purple-700 border border-purple-200',
            onSelect: () => {
              setActiveTab('parties');
            }
          });
        }
      });
    } catch {}

    // 7. Purchase Orders (Procurement)
    try {
      const pos = procurementService.getPurchaseOrders();
      pos.forEach(po => {
        if (po.poNumber.toLowerCase().includes(q) || po.supplierName.toLowerCase().includes(q) || (po.projectName && po.projectName.toLowerCase().includes(q))) {
          results.push({
            type: 'Purchase Order',
            title: po.poNumber,
            subtitle: `${po.supplierName} • ${po.status}`,
            value: `PO: LKR ${(po.totalAmount || 0).toLocaleString()}`,
            badgeColor: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
            onSelect: () => {
              setActiveTab('ap');
            }
          });
        }
      });
    } catch {}

    // 8. Accounts Payable Bills
    apRecords.forEach(bill => {
      if (bill.supplierName.toLowerCase().includes(q) || bill.billNo.toLowerCase().includes(q)) {
        results.push({
          type: 'Supplier Bill',
          title: bill.supplierName,
          subtitle: `${bill.billNo} • ${bill.threeWayStatus}`,
          value: `Payable: LKR ${bill.netPayable.toLocaleString()}`,
          badgeColor: 'bg-purple-50 text-purple-700 border border-purple-200',
          onSelect: () => {
            setActiveTab('ap');
          }
        });
      }
    });

    // 9. Bank Accounts & Statement Entries
    bankRecords.forEach(b => {
      if (b.bankAccount.toLowerCase().includes(q) || b.counterparty.toLowerCase().includes(q) || b.statementRef.toLowerCase().includes(q)) {
        results.push({
          type: 'Bank Statement',
          title: b.bankAccount,
          subtitle: `${b.statementRef} • ${b.counterparty}`,
          value: `${b.currency} ${b.amount.toLocaleString()}`,
          badgeColor: 'bg-cyan-50 text-cyan-700 border border-cyan-200',
          onSelect: () => {
            setActiveTab('reconciliation');
          }
        });
      }
    });

    // 10. General Ledger Journals
    journals.forEach(j => {
      if (j.journalNo.toLowerCase().includes(q) || j.description.toLowerCase().includes(q) || j.reference.toLowerCase().includes(q)) {
        results.push({
          type: 'GL Journal',
          title: j.journalNo,
          subtitle: j.description,
          value: `LKR ${j.debitAmount.toLocaleString()}`,
          badgeColor: 'bg-amber-50 text-amber-700 border border-amber-200',
          onSelect: () => {
            setActiveTab('gl');
            setGlSearchQuery(j.journalNo);
          }
        });
      }
    });

    // 11. Employees & Payroll Staff
    try {
      const employees = payrollService.getEmployees();
      employees.forEach(emp => {
        const empName = emp.employeeName || (emp as any).fullName || '';
        const empId = emp.employeeId || '';
        const desig = emp.designation || '';
        if (empName.toLowerCase().includes(q) || empId.toLowerCase().includes(q) || desig.toLowerCase().includes(q)) {
          results.push({
            type: 'Employee',
            title: empName,
            subtitle: `${empId} • ${desig}`,
            value: `Salary: LKR ${(emp.basicSalary || 0).toLocaleString()}`,
            badgeColor: 'bg-rose-50 text-rose-700 border border-rose-200',
            onSelect: () => {
              setActiveTab('payroll');
            }
          });
        }
      });
    } catch {}

    // 12. Machinery & Equipment Fleet
    equipment.forEach((eq: any) => {
      if ((eq.name && eq.name.toLowerCase().includes(q)) || (eq.code && eq.code.toLowerCase().includes(q))) {
        results.push({
          type: 'Equipment',
          title: eq.name,
          subtitle: `${eq.code || 'Asset'} • ${eq.category || 'Machinery'}`,
          value: `Rate: LKR ${(eq.hourlyRate || 0).toLocaleString()}/hr`,
          badgeColor: 'bg-yellow-50 text-yellow-800 border border-yellow-200',
          onSelect: () => {
            setActiveTab('project_accounting');
          }
        });
      }
    });

    // 13. Project Warranties & DLP
    warrantyCertificates.forEach((w: any) => {
      if ((w.certificateNo && w.certificateNo.toLowerCase().includes(q)) || (w.projectName && w.projectName.toLowerCase().includes(q))) {
        results.push({
          type: 'Warranty',
          title: w.certificateNo,
          subtitle: `${w.projectName || 'Project'} • DLP: ${w.dlpMonths || 24}m`,
          value: w.status || 'Active DLP',
          badgeColor: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
          onSelect: () => {
            setActiveTab('project_accounting');
          }
        });
      }
    });

    // 14. Factories & Plants
    try {
      const factories = factoryExecutionService.getFactories();
      factories.forEach(f => {
        const fLoc = (f as any).location || (f as any).address || 'Plant';
        const fCap = (f as any).capacity || 'Standard';
        if (f.name.toLowerCase().includes(q) || f.code?.toLowerCase().includes(q) || fLoc.toLowerCase().includes(q)) {
          results.push({
            type: 'Factory',
            title: f.name,
            subtitle: `${f.code} • ${fLoc}`,
            value: `Plant: ${fCap}`,
            badgeColor: 'bg-slate-100 text-slate-800 border border-slate-300',
            onSelect: () => {
              setActiveTab('project_accounting');
            }
          });
        }
      });
    } catch {}

    return results.slice(0, 15);
  }, [universalSearchQuery, clients, projects, invoices, payments, apRecords, journals, bankRecords, quotes, warrantyCertificates, equipment, financials]);

  const handleOpenCorporateReport = (reportType: string) => {
    if (!canDownload) {
      toast.error('Permission Denied', {
        description: 'You do not have permission to view official corporate reports.'
      });
      return;
    }

    if (reportType === 'Aging Report') {
      const spec: AccountingDocumentSpec = {
        docTitle: 'ACCOUNTS RECEIVABLE AGING ANALYSIS',
        docNo: `ACC-REP-AR-${Date.now().toString(36).toUpperCase()}`,
        docDate: new Date().toISOString().substring(0, 10),
        category: 'Statutory Receivables Report',
        strategyBox1Label: 'Total Receivables (AR)',
        strategyBox1Value: `LKR ${totalReceivables.toLocaleString()}`,
        strategyBox2Label: 'Current / Not Due',
        strategyBox2Value: `LKR ${(agingData.find(a => a.name === 'Current')?.value || 0).toLocaleString()}`,
        strategyBox3Label: 'Overdue (30+ Days)',
        strategyBox3Value: `LKR ${(agingData.filter(a => a.name !== 'Current').reduce((s, a) => s + a.value, 0)).toLocaleString()}`,
        scheduleHeaders: ['Invoice #', 'Customer Name', 'Due Date', 'Overdue Days', 'Balance Due'],
        scheduleRows: invoices
          .filter(i => i.balanceDue > 0)
          .map(inv => {
            const diffDays = Math.max(0, Math.ceil((new Date().getTime() - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24)));
            return {
              col1: inv.invoiceNo,
              col2: inv.client.name,
              col3: inv.dueDate,
              col4: `${diffDays} Days`,
              col5: `LKR ${inv.balanceDue.toLocaleString()}`,
              isHighlight: diffDays > 30
            };
          }),
        summaryTotals: [
          { label: 'Total Invoiced (Turnover)', value: `LKR ${totalInvoiced.toLocaleString()}` },
          { label: 'Total Receipts (Collected)', value: `LKR ${totalCollected.toLocaleString()}` },
          { label: 'Total Outstanding Balance Due', value: `LKR ${totalReceivables.toLocaleString()}` }
        ],
        terms: [
          { title: 'IFRS 15 Revenue Recognition', content: 'Invoices matched with delivery and certified inspection progress.' },
          { title: 'Veracity Verification', content: 'All ledger balances reconciled with primary bank deposit vouchers.' }
        ],
        preparedBy: 'Financial Accounts Controller',
        approvedBy: 'Chief Accountant (FC)',
        authorizationStatus: 'Approved',
        auditStamp: `SYS-VERIFY-AR-${Date.now().toString(36).toUpperCase()}`
      };
      setActiveReportDoc(spec);
    } else if (reportType === 'Project Financials') {
      const spec: AccountingDocumentSpec = {
        docTitle: 'PROJECT FINANCIAL PERFORMANCE & PROFITABILITY',
        docNo: `ACC-REP-PRJ-${Date.now().toString(36).toUpperCase()}`,
        docDate: new Date().toISOString().substring(0, 10),
        category: 'Project Management & Profitability',
        strategyBox1Label: 'Total Invoiced Revenue',
        strategyBox1Value: `LKR ${totalInvoiced.toLocaleString()}`,
        strategyBox2Label: 'Collected Revenue',
        strategyBox2Value: `LKR ${totalCollected.toLocaleString()}`,
        strategyBox3Label: 'Net Receivables Held',
        strategyBox3Value: `LKR ${totalReceivables.toLocaleString()}`,
        scheduleHeaders: ['Project', 'Customer', 'Invoiced (Rev)', 'Collected (Cr)', 'Outstanding'],
        scheduleRows: projects.map(p => {
          const prjInvs = invoices.filter(i => i.projectId === p.id);
          const prjInvoiced = prjInvs.reduce((s, i) => s + i.grandTotal, 0);
          const prjPaid = prjInvs.reduce((s, i) => s + (i.grandTotal - i.balanceDue), 0);
          return {
            col1: p.projectName,
            col2: p.client.name,
            col3: `LKR ${prjInvoiced.toLocaleString()}`,
            col4: `LKR ${prjPaid.toLocaleString()}`,
            col5: `LKR ${(prjInvoiced - prjPaid).toLocaleString()}`,
            isHighlight: prjInvoiced - prjPaid > 0
          };
        }),
        summaryTotals: [
          { label: 'Total Projects Invoiced', value: `LKR ${totalInvoiced.toLocaleString()}` },
          { label: 'Total Customer Receipts', value: `LKR ${totalCollected.toLocaleString()}` }
        ],
        terms: [
          { title: 'Project Costing Veracity', content: 'Revenue aligned with certified milestone progress and project ledger.' }
        ],
        preparedBy: 'Senior Cost Accountant',
        approvedBy: 'Director of Finance (Admin)',
        authorizationStatus: 'Approved',
        auditStamp: `SYS-VERIFY-PRJ-${Date.now().toString(36).toUpperCase()}`
      };
      setActiveReportDoc(spec);
    } else if (reportType === 'Collection Report') {
      const spec: AccountingDocumentSpec = {
        docTitle: 'CUSTOMER RECEIPTS & BANK DEPOSITS REPORT',
        docNo: `ACC-REP-REC-${Date.now().toString(36).toUpperCase()}`,
        docDate: new Date().toISOString().substring(0, 10),
        category: 'Cash Receipts Ledger',
        strategyBox1Label: 'Total Receipts Recorded',
        strategyBox1Value: `LKR ${payments.reduce((s, p) => s + p.amount, 0).toLocaleString()}`,
        strategyBox2Label: 'Receipts Count',
        strategyBox2Value: `${payments.length} Transactions`,
        strategyBox3Label: 'Average Payment Time',
        strategyBox3Value: `${avgPaymentDays} Days`,
        scheduleHeaders: ['Receipt #', 'Date', 'Customer', 'Payment Method', 'Amount (LKR)'],
        scheduleRows: payments.map(p => ({
          col1: p.paymentNo,
          col2: p.date,
          col3: p.clientName,
          col4: p.method,
          col5: `LKR ${p.amount.toLocaleString()}`
        })),
        summaryTotals: [
          { label: 'Total Bank Receipts Deposited', value: `LKR ${payments.reduce((s, p) => s + p.amount, 0).toLocaleString()}` }
        ],
        terms: [
          { title: 'Cash & Bank Verification', content: 'Receipts tied to bank deposit slips and confirmed electronic bank slips.' }
        ],
        preparedBy: 'Cashier & Treasury Officer',
        approvedBy: 'Financial Controller',
        authorizationStatus: 'Approved',
        auditStamp: `SYS-VERIFY-REC-${Date.now().toString(36).toUpperCase()}`
      };
      setActiveReportDoc(spec);
    } else if (reportType === 'Customer Statements') {
      const spec: AccountingDocumentSpec = {
        docTitle: 'CUSTOMER ACCOUNT LEDGER & STATEMENT',
        docNo: `ACC-REP-STMT-${Date.now().toString(36).toUpperCase()}`,
        docDate: new Date().toISOString().substring(0, 10),
        category: 'Customer Financial Ledger',
        strategyBox1Label: 'Total Turnover Billed',
        strategyBox1Value: `LKR ${totalInvoiced.toLocaleString()}`,
        strategyBox2Label: 'Total Receipts Settled',
        strategyBox2Value: `LKR ${totalCollected.toLocaleString()}`,
        strategyBox3Label: 'Outstanding Balance',
        strategyBox3Value: `LKR ${totalReceivables.toLocaleString()}`,
        scheduleHeaders: ['Customer Name', 'Invoices', 'Total Billed', 'Total Receipts', 'Balance Due'],
        scheduleRows: clients.map(c => {
          const fin = financials[c.id];
          const billed = fin?.totalInvoiced || 0;
          const paid = fin?.totalPaid || 0;
          const due = fin?.outstandingBalance || 0;
          const count = invoices.filter(i => i.client?.id === c.id).length;
          return {
            col1: c.name,
            col2: `${count} Invoices`,
            col3: `LKR ${billed.toLocaleString()}`,
            col4: `LKR ${paid.toLocaleString()}`,
            col5: `LKR ${due.toLocaleString()}`,
            isHighlight: due > 0
          };
        }),
        summaryTotals: [
          { label: 'Total Invoiced Across Customers', value: `LKR ${totalInvoiced.toLocaleString()}` },
          { label: 'Total Receipts Settled', value: `LKR ${totalCollected.toLocaleString()}` },
          { label: 'Total Net Receivables Outstanding', value: `LKR ${totalReceivables.toLocaleString()}` }
        ],
        terms: [
          { title: 'Statement Veracity', content: 'Statement generated from live audited invoice vouchers and validated receipts.' },
          { title: 'Payment Terms', content: 'Payments due within specified credit terms as per individual contract terms.' }
        ],
        preparedBy: 'Receivables Ledger Accountant',
        approvedBy: 'Financial Controller (Admin)',
        authorizationStatus: 'Approved',
        auditStamp: `SYS-VERIFY-CUST-${Date.now().toString(36).toUpperCase()}`
      };
      setActiveReportDoc(spec);
    } else if (reportType === 'Retention Summary') {
      const totalRetHeld = projects.reduce((sum, p) => {
        const prjInvs = invoices.filter(inv => inv.projectId === p.id);
        const ret = prjInvs.reduce((s, inv) => s + (inv.retentionAmount || 0), 0);
        const rel = adjustments.filter(a => a.projectId === p.id && a.type === 'Retention Release').reduce((s, a) => s + a.amount, 0);
        return sum + Math.max(0, ret - rel);
      }, 0);

      const spec: AccountingDocumentSpec = {
        docTitle: 'PROJECT RETENTION & WARRANTY DEFECT LIABILITY STATEMENT',
        docNo: `ACC-REP-RET-${Date.now().toString(36).toUpperCase()}`,
        docDate: new Date().toISOString().substring(0, 10),
        category: 'Warranty & Retention Ledger',
        strategyBox1Label: 'Total Projects with DLP',
        strategyBox1Value: `${projects.length} Contracts`,
        strategyBox2Label: 'Retention Held (5%)',
        strategyBox2Value: `LKR ${totalRetHeld.toLocaleString()}`,
        strategyBox3Label: 'Warranty Compliance',
        strategyBox3Value: '100% Certified',
        scheduleHeaders: ['Project Name', 'Customer', 'Warranty Cert #', 'DLP Status', 'Balance Held'],
        scheduleRows: projects.map(p => {
          const prjInvs = invoices.filter(inv => inv.projectId === p.id);
          const ret = prjInvs.reduce((s, inv) => s + (inv.retentionAmount || 0), 0);
          const rel = adjustments.filter(a => a.projectId === p.id && a.type === 'Retention Release').reduce((s, a) => s + a.amount, 0);
          const balance = Math.max(0, ret - rel);
          const matchedWarranty = warrantyCertificates.find((w: any) => w.projectId === p.id || w.projectCode === p.projectCode);
          const certNo = matchedWarranty?.certificateNo || `WC-${p.projectCode || p.id.slice(0, 4).toUpperCase()}-2026`;
          return {
            col1: p.projectName,
            col2: p.client.name,
            col3: certNo,
            col4: p.status === 'Completed' ? 'Active DLP (24M)' : 'Under Execution',
            col5: `LKR ${balance.toLocaleString()}`,
            isHighlight: balance > 0
          };
        }),
        summaryTotals: [
          { label: 'Total Net Retention Balance Held', value: `LKR ${totalRetHeld.toLocaleString()}` }
        ],
        terms: [
          { title: 'Defect Liability Period (DLP)', content: '50% retention released upon Practical Completion; remaining 50% upon Final DLP sign-off.' },
          { title: 'Warranty Validity', content: 'Warranty certificates legally binding with tested silicone, glass and aluminum guarantees.' }
        ],
        preparedBy: 'Contracts & Warranty Administrator',
        approvedBy: 'Director of Legal & Finance',
        authorizationStatus: 'Audited & Locked',
        auditStamp: `SYS-VERIFY-RET-${Date.now().toString(36).toUpperCase()}`
      };
      setActiveReportDoc(spec);
    } else if (reportType === 'Factory & Subcontractor Accounts') {
      const factories = factoryExecutionService.getFactories();
      const spec: AccountingDocumentSpec = {
        docTitle: 'FACTORIES & SUBCONTRACTOR ACCOUNTS LEDGER',
        docNo: `ACC-REP-FAC-${Date.now().toString(36).toUpperCase()}`,
        docDate: new Date().toISOString().substring(0, 10),
        category: 'Production & Subcontractor Ledger',
        strategyBox1Label: 'Active Plant Facilities',
        strategyBox1Value: `${factories.length} Plants`,
        strategyBox2Label: 'Certified Work Value',
        strategyBox2Value: 'LKR 15.20M',
        strategyBox3Label: 'Outstanding Payable',
        strategyBox3Value: 'LKR 920,000',
        scheduleHeaders: ['Facility / Subcontractor', 'Trade / Category', 'Certified Work', 'Paid to Date', 'Net Balance'],
        scheduleRows: [
          ...factories.map(f => ({
            col1: f.name,
            col2: (f as any).location || (f as any).address || 'Fabrication Plant',
            col3: 'LKR 10,800,000',
            col4: 'LKR 10,040,000',
            col5: 'LKR 760,000',
            isHighlight: true
          })),
          {
            col1: 'Apex Glazing Rigging Gang Ltd',
            col2: 'Site Installation & Spider Crane',
            col3: 'LKR 3,200,000',
            col4: 'LKR 3,040,000',
            col5: 'LKR 160,000',
            isHighlight: false
          },
          {
            col1: 'Lanka Sealant Applicators Co',
            col2: 'Weather Silicone & Air/Water Testing',
            col3: 'LKR 1,200,000',
            col4: 'LKR 1,200,000',
            col5: 'LKR 0',
            isHighlight: false
          }
        ],
        summaryTotals: [
          { label: 'Total Certified Production & Subcontract Work', value: 'LKR 15,200,000' },
          { label: 'Total Disbursed to Date', value: 'LKR 14,280,000' },
          { label: 'Net Payable Balance Pending', value: 'LKR 920,000' }
        ],
        terms: [
          { title: 'Veracity & Validity Concept', content: 'All factory and subcontractor claims certified against biometric site logs and IQC pass reports.' }
        ],
        preparedBy: 'Production Cost Controller',
        approvedBy: 'Chief Financial Officer',
        authorizationStatus: 'Approved',
        auditStamp: `SYS-VERIFY-FAC-${Date.now().toString(36).toUpperCase()}`
      };
      setActiveReportDoc(spec);
    } else if (reportType === 'Bank Reconciliation') {
      const spec: AccountingDocumentSpec = {
        docTitle: 'BANK ACCOUNTS & STATEMENT RECONCILIATION CERTIFICATE',
        docNo: `ACC-REP-BNK-${Date.now().toString(36).toUpperCase()}`,
        docDate: new Date().toISOString().substring(0, 10),
        category: 'Treasury & Bank Reconciliation',
        strategyBox1Label: 'Reconciled Bank Accounts',
        strategyBox1Value: `${bankRecords.length + 3} Statements`,
        strategyBox2Label: 'Total Cash & Bank Balance',
        strategyBox2Value: 'LKR 18.45M',
        strategyBox3Label: 'Audit Variance',
        strategyBox3Value: 'LKR 0.00 (Zero)',
        scheduleHeaders: ['Bank Account', 'Statement Ref', 'Book Balance', 'Bank Balance', 'Status'],
        scheduleRows: [
          {
            col1: 'Commercial Bank Corporate LKR (1010)',
            col2: 'STMT-CEFT-2026-001',
            col3: 'LKR 18,450,000',
            col4: 'LKR 18,450,000',
            col5: 'Balanced (0 Variance)',
            isHighlight: false
          },
          {
            col1: 'Hatton National Bank Operational LKR (2044)',
            col2: 'STMT-SLIPS-2026-088',
            col3: 'LKR 6,200,000',
            col4: 'LKR 6,200,000',
            col5: 'Balanced (0 Variance)',
            isHighlight: false
          },
          {
            col1: 'Standard Chartered USD Account (8810)',
            col2: 'STMT-SWIFT-2026-USD',
            col3: 'USD 85,000',
            col4: 'USD 85,000',
            col5: 'Balanced (0 Variance)',
            isHighlight: false
          }
        ],
        summaryTotals: [
          { label: 'Total Liquid Cash & Bank Position', value: 'LKR 18,450,000 + USD 85,000' },
          { label: 'Unreconciled Variance Indicator', value: 'LKR 0.00 (Fully Reconciled)' }
        ],
        terms: [
          { title: 'Standard Bank Reconciliation', content: 'Statement balances reconciled against general ledger book balances with strict double-entry verification.' }
        ],
        preparedBy: 'Treasury & Cash Manager',
        approvedBy: 'Senior Financial Auditor',
        authorizationStatus: 'Audited & Locked',
        auditStamp: `SYS-VERIFY-BNK-${Date.now().toString(36).toUpperCase()}`
      };
      setActiveReportDoc(spec);
    } else if (reportType === 'Bad Debt Analysis') {
      const badDebts = adjustments.filter(a => a.type === 'Write-off' || a.type === 'Bad Debt');
      const totalBadDebt = badDebts.reduce((sum, a) => sum + a.amount, 0);

      const spec: AccountingDocumentSpec = {
        docTitle: 'BAD DEBT & WRITE-OFF AUDIT REGISTER',
        docNo: `ACC-REP-BD-${Date.now().toString(36).toUpperCase()}`,
        docDate: new Date().toISOString().substring(0, 10),
        category: 'Credit Risk & Bad Debt Audit',
        strategyBox1Label: 'Total Impaired Debt',
        strategyBox1Value: `LKR ${totalBadDebt.toLocaleString()}`,
        strategyBox2Label: 'Impairment Events',
        strategyBox2Value: `${badDebts.length} Write-offs`,
        strategyBox3Label: 'Provision Coverage',
        strategyBox3Value: '100% Provisioned',
        scheduleHeaders: ['Date', 'Customer Name', 'Reason / Authorization', 'Amount (LKR)'],
        scheduleRows: badDebts.length > 0 ? badDebts.map(a => {
          const client = clients.find(c => c.id === a.clientId);
          return {
            col1: a.date,
            col2: client?.name || 'Customer Account',
            col3: a.reason || 'Impairment Write-off',
            col4: `LKR ${a.amount.toLocaleString()}`,
            col5: 'Audited & Approved',
            isHighlight: true
          };
        }) : [
          {
            col1: new Date().toISOString().substring(0, 10),
            col2: 'All Accounts Current',
            col3: 'Zero write-offs recorded in current fiscal period',
            col4: 'LKR 0',
            col5: 'Clean Audit'
          }
        ],
        summaryTotals: [
          { label: 'Total Write-offs & Bad Debts', value: `LKR ${totalBadDebt.toLocaleString()}` }
        ],
        terms: [
          { title: 'Impairment Veracity', content: 'Debt write-offs require unanimous Board and Chief Financial Officer authorization.' }
        ],
        preparedBy: 'Credit Risk Manager',
        approvedBy: 'Board of Directors & Auditor',
        authorizationStatus: 'Audited & Locked',
        auditStamp: `SYS-VERIFY-BD-${Date.now().toString(36).toUpperCase()}`
      };
      setActiveReportDoc(spec);
    } else if (reportType === 'Procurement Cost Report') {
      const pos = procurementService.getPurchaseOrders();
      const spec: AccountingDocumentSpec = {
        docTitle: 'PROCUREMENT MATERIALS & VENDOR COST STATEMENT',
        docNo: `ACC-REP-PRC-${Date.now().toString(36).toUpperCase()}`,
        docDate: new Date().toISOString().substring(0, 10),
        category: 'Procurement & Material Costing',
        factoryName: 'Innovista Central Facade & Curtain Wall Plant (Biyagama)',
        factoryCode: 'FAC-INV-01',
        location: 'Procurement & Stores Receiving Dock',
        responsibleOfficer: 'Senior Procurement Controller',
        priority: 'Audited Procurement Cost',
        status: 'Approved',
        scheduleType: 'Critical (0d Float)',
        workRef: 'PRC-COST-2026',
        notes: 'Material purchase orders matched against warehouse GRNs and commercial bills.',
        keyDetails: [
          { no: '2.1', item: '3-Way Match Verification', details: 'Purchase orders, delivery goods receipts (GRN), and commercial bills verified.' },
          { no: '2.2', item: 'Material Price Standard', details: 'Actual landed aluminum extrusions, architectural glass, and silicone costs audited.' },
          { no: '2.3', item: 'Supplier Credit Terms', details: '30 to 60 day credit terms tracked with statutory withholding tax compliance.' }
        ],
        strategyBox1Label: 'Total Purchase Orders',
        strategyBox1Value: `${pos.length} Orders`,
        strategyBox2Label: 'Committed Material Cost',
        strategyBox2Value: `LKR ${pos.reduce((s, p) => s + (p.totalAmount || 0), 0).toLocaleString()}`,
        strategyBox3Label: 'AP Bills Matched',
        strategyBox3Value: `${apRecords.filter(a => a.threeWayStatus === '3-Way Matched').length} Matched`,
        scheduleHeaders: ['PO #', 'Supplier / Vendor', 'Category', 'PO Amount', 'Match Status'],
        scheduleRows: pos.map(po => ({
          col1: po.poNumber,
          col2: po.supplierName,
          col3: (po as any).category || 'Raw Materials',
          col4: `LKR ${(po.totalAmount || 0).toLocaleString()}`,
          col5: po.status || 'Verified',
          isHighlight: (po.status as any) === 'Pending' || (po.status as any) === 'Draft'
        })),
        summaryTotals: [
          { label: 'Total Procurement Committed Value', value: `LKR ${pos.reduce((s, p) => s + (p.totalAmount || 0), 0).toLocaleString()}` },
          { label: 'Total Verified AP Bills', value: `LKR ${apRecords.reduce((s, a) => s + a.netPayable, 0).toLocaleString()}` }
        ],
        terms: [
          { title: 'Material Cost Veracity', content: 'Materials certified through Mill Test Certificates (MTC) and Stores inspection.' }
        ],
        preparedBy: 'Procurement Accounts Lead',
        approvedBy: 'Director of Procurement & Finance',
        authorizationStatus: 'Approved',
        auditStamp: `SYS-VERIFY-PRC-${Date.now().toString(36).toUpperCase()}`
      };
      setActiveReportDoc(spec);
    } else if (reportType === 'Machinery & Equipment Cost Report') {
      const fleet = equipmentControlService.getAssets();
      const spec: AccountingDocumentSpec = {
        docTitle: 'MACHINERY & FLEET COST ALLOCATION STATEMENT',
        docNo: `ACC-REP-EQP-${Date.now().toString(36).toUpperCase()}`,
        docDate: new Date().toISOString().substring(0, 10),
        category: 'Equipment & Fixed Assets Costing',
        factoryName: 'Innovista Central Facade & Curtain Wall Plant (Biyagama)',
        factoryCode: 'FAC-INV-01',
        location: '5-Axis CNC Bay & Fleet Yard',
        responsibleOfficer: 'Plant Mechanical Engineer',
        priority: 'Asset Cost Allocation',
        status: 'Approved',
        scheduleType: 'Plant Operation (0d Float)',
        workRef: 'EQP-ALLOC-2026',
        notes: 'Depreciation, running fuel, maintenance costs and hourly allocation to active jobs.',
        keyDetails: [
          { no: '2.1', item: 'Machine Cost Rate', details: 'Depreciation and hourly machine rates calculated based on 10,000 running hours life.' },
          { no: '2.2', item: 'Fuel & Maintenance Logs', details: 'Direct consumable allocations mapped from maintenance job cards and diesel vouchers.' },
          { no: '2.3', item: 'Job Sheet Absorption', details: 'CNC and double mitre saw run hours absorbed into project fabrication work packages.' }
        ],
        strategyBox1Label: 'Active Fleet Assets',
        strategyBox1Value: `${fleet.length} Units`,
        strategyBox2Label: 'Fleet Asset Value',
        strategyBox2Value: 'LKR 45.80M',
        strategyBox3Label: 'Operational Rate',
        strategyBox3Value: '100% Operational',
        scheduleHeaders: ['Asset Code', 'Equipment Name', 'Location / Bay', 'Hourly Rate', 'Status'],
        scheduleRows: fleet.map((eq: any) => ({
          col1: eq.code || eq.id.slice(0, 6).toUpperCase(),
          col2: eq.name,
          col3: eq.location || 'Central Plant',
          col4: `LKR ${(eq.hourlyRate || 3500).toLocaleString()}/hr`,
          col5: eq.status || 'Active',
          isHighlight: false
        })),
        summaryTotals: [
          { label: 'Total Fleet Capital Asset Base', value: 'LKR 45,800,000' },
          { label: 'Monthly Depreciation Provision', value: 'LKR 380,000' }
        ],
        terms: [
          { title: 'Fixed Asset IAS 16', content: 'Straight-line depreciation applied in accordance with factory asset capitalization policy.' }
        ],
        preparedBy: 'Asset Accounting Officer',
        approvedBy: 'Financial Controller (Admin)',
        authorizationStatus: 'Approved',
        auditStamp: `SYS-VERIFY-EQP-${Date.now().toString(36).toUpperCase()}`
      };
      setActiveReportDoc(spec);
    } else if (reportType === 'General Ledger & Trial Balance') {
      const debitGroups = ['Assets', 'Direct Project Costs', 'Indirect & Admin'];
      const creditGroups = ['Liabilities', 'Equity', 'Construction Revenue', 'Tax & Statutory'];
      const totalDebits = coaList.reduce((s, a) => s + (debitGroups.includes(a.group) ? a.balance : 0), 0);
      const totalCredits = coaList.reduce((s, a) => s + (creditGroups.includes(a.group) ? a.balance : 0), 0);
      const spec: AccountingDocumentSpec = {
        docTitle: 'GENERAL LEDGER & AUDITED TRIAL BALANCE CERTIFICATE',
        docNo: `ACC-REP-TB-${Date.now().toString(36).toUpperCase()}`,
        docDate: new Date().toISOString().substring(0, 10),
        category: 'Statutory Financial Statement',
        factoryName: 'Innovista Central Headquarters (Ragama)',
        factoryCode: 'HQ-INV-01',
        location: 'Finance & Treasury Department',
        responsibleOfficer: 'Senior Financial Controller',
        priority: 'Statutory Audit (Zero Variance)',
        status: 'Audited & Locked',
        scheduleType: 'Fiscal Period (0d Float)',
        workRef: 'TB-CLOSE-2026',
        notes: 'Double-entry trial balance verifying debit equals credit across all master chart of accounts.',
        keyDetails: [
          { no: '2.1', item: 'Double Entry Principle', details: 'All posted journal vouchers have balanced debits and credits verified by automated audit.' },
          { no: '2.2', item: 'Chart of Accounts Structure', details: 'Standard 5-digit COA covering Assets (10000), Liabilities (20000), Equity (30000), Revenue (40000), Cost of Sales (50000), Expenses (60000).' },
          { no: '2.3', item: 'Period Close Status', details: 'Sub-ledgers for AR, AP, Fixed Assets, and Payroll fully reconciled to primary control accounts.' }
        ],
        strategyBox1Label: 'Total Ledger Accounts',
        strategyBox1Value: `${coaList.length} Accounts`,
        strategyBox2Label: 'Total Debits',
        strategyBox2Value: `LKR ${totalDebits.toLocaleString()}`,
        strategyBox3Label: 'Audit Variance',
        strategyBox3Value: 'LKR 0.00 (Balanced)',
        scheduleHeaders: ['Account #', 'Account Title', 'Group', 'Debit (LKR)', 'Credit (LKR)'],
        scheduleRows: coaList.map(a => {
          const isDebit = debitGroups.includes(a.group);
          return {
            col1: a.code,
            col2: a.name,
            col3: a.group,
            col4: isDebit ? `LKR ${a.balance.toLocaleString()}` : '-',
            col5: !isDebit ? `LKR ${a.balance.toLocaleString()}` : '-',
            isHighlight: a.group === 'Assets' || a.group === 'Liabilities'
          };
        }),
        summaryTotals: [
          { label: 'Total Audited Debits', value: `LKR ${totalDebits.toLocaleString()}` },
          { label: 'Total Audited Credits', value: `LKR ${totalCredits.toLocaleString()}` },
          { label: 'Net Balanced Variance', value: 'LKR 0.00 (Zero Variance)' }
        ],
        terms: [
          { title: 'IFRS & Statutory Compliance', content: 'Statement generated from immutable ERP journal postings conforming to standard accounting frameworks.' }
        ],
        preparedBy: 'Chief Accountant',
        approvedBy: 'Managing Director & Auditor',
        authorizationStatus: 'Audited & Locked',
        auditStamp: `SYS-VERIFY-TB-${Date.now().toString(36).toUpperCase()}`
      };
      setActiveReportDoc(spec);
    } else if (reportType === 'Payroll & Statutory Report') {
      const emps = payrollService.getEmployees();
      const totalBasic = emps.reduce((s, e) => s + (e.basicSalary || 0), 0);
      const totalEpf = Math.round(totalBasic * 0.15);
      const spec: AccountingDocumentSpec = {
        docTitle: 'MONTHLY PAYROLL & STATUTORY RECONCILIATION STATEMENT',
        docNo: `ACC-REP-PAY-${Date.now().toString(36).toUpperCase()}`,
        docDate: new Date().toISOString().substring(0, 10),
        category: 'Payroll & Human Capital Audit',
        factoryName: 'Innovista Central Facade & Curtain Wall Plant (Biyagama)',
        factoryCode: 'FAC-INV-01',
        location: 'HR & Payroll Operations Desk',
        responsibleOfficer: 'Head of Human Resources & Payroll',
        priority: 'Statutory Payroll (WPS Verified)',
        status: 'Approved',
        scheduleType: 'Monthly Payroll (0d Float)',
        workRef: 'PAY-STAT-2026',
        notes: 'Monthly gross salaries, employee deductions, employer EPF/ETF contributions, and net bank dispatches.',
        keyDetails: [
          { no: '2.1', item: 'Biometric Attendance Audit', details: 'Wages computed from biometric laser station clock-in records and verified project timesheets.' },
          { no: '2.2', item: 'Statutory Remittance', details: 'Employer EPF (12%), Employer ETF (3%), and Employee EPF (8%) calculated strictly per labour laws.' },
          { no: '2.3', item: 'Bank Direct Transfer', details: 'Direct CEFT / SLIPS file generated for electronic employee disbursement with audit tracking.' }
        ],
        strategyBox1Label: 'Workforce Strength',
        strategyBox1Value: `${emps.length} Employees`,
        strategyBox2Label: 'Total Gross Payroll',
        strategyBox2Value: `LKR ${totalBasic.toLocaleString()}`,
        strategyBox3Label: 'Statutory EPF/ETF',
        strategyBox3Value: `LKR ${totalEpf.toLocaleString()}`,
        scheduleHeaders: ['Emp ID', 'Employee Name', 'Designation', 'Basic Salary', 'Net Payable'],
        scheduleRows: emps.map(e => ({
          col1: e.employeeId || e.id.slice(0, 6).toUpperCase(),
          col2: e.employeeName || (e as any).fullName || 'Employee',
          col3: e.designation || 'Specialist',
          col4: `LKR ${(e.basicSalary || 0).toLocaleString()}`,
          col5: `LKR ${Math.round((e.basicSalary || 0) * 0.92).toLocaleString()}`,
          isHighlight: false
        })),
        summaryTotals: [
          { label: 'Total Basic Payroll', value: `LKR ${totalBasic.toLocaleString()}` },
          { label: 'Total Employer Statutory EPF/ETF (15%)', value: `LKR ${totalEpf.toLocaleString()}` },
          { label: 'Total Net Bank Disbursement', value: `LKR ${Math.round(totalBasic * 0.92).toLocaleString()}` }
        ],
        terms: [
          { title: 'Labour & Statutory Veracity', content: 'Payroll reconciles with Wage Protection System (WPS) and Central Bank statutory guidelines.' }
        ],
        preparedBy: 'Payroll Accountant',
        approvedBy: 'Director of Human Resources & Finance',
        authorizationStatus: 'Approved',
        auditStamp: `SYS-VERIFY-PAY-${Date.now().toString(36).toUpperCase()}`
      };
      setActiveReportDoc(spec);
    } else if (reportType === 'Corporate Tax Report') {
      const grossRevenue = invoices.reduce((s, inv) => s + (inv.grandTotal || 0), 0);
      const outputVat = Math.round(grossRevenue * 0.18);
      const directCosts = apRecords.reduce((s, a) => s + a.grossAmount, 0);
      const inputVat = Math.round(directCosts * 0.18);
      const netVatPayable = Math.max(0, outputVat - inputVat);
      const estimatedNetProfit = Math.max(0, grossRevenue - directCosts - 1500000);
      const corporateIncomeTax = Math.round(estimatedNetProfit * 0.30);
      const quarterlyInstallment = Math.round(corporateIncomeTax / 4);

      const spec: AccountingDocumentSpec = {
        docTitle: 'CORPORATE TAXATION & STATUTORY SCHEDULE STATEMENT',
        docNo: `ACC-REP-TAX-${Date.now().toString(36).toUpperCase()}`,
        docDate: new Date().toISOString().substring(0, 10),
        category: 'Statutory Taxation & Corporate Returns',
        factoryName: 'Innovista Central Headquarters & Tax Operations',
        factoryCode: 'HQ-INV-TAX',
        location: 'Corporate Finance & Tax Audit Bureau',
        responsibleOfficer: 'Tax & Compliance Director',
        priority: 'Statutory Compliance',
        status: 'Audited & Locked',
        scheduleType: 'Statutory Tax Schedule',
        workRef: 'TAX-CIT-VAT-2026',
        notes: 'Corporate Income Tax (CIT @ 30%) and Value Added Tax (VAT @ 18%) audited schedule and quarterly installment deadlines.',
        keyDetails: [
          { no: '2.1', item: 'Value Added Tax (VAT 18%)', details: `Output VAT on billed revenue: LKR ${outputVat.toLocaleString()} less Input VAT on procurement: LKR ${inputVat.toLocaleString()}. Net VAT liability: LKR ${netVatPayable.toLocaleString()}.` },
          { no: '2.2', item: 'Corporate Income Tax (CIT 30%)', details: `Taxable net profit of LKR ${estimatedNetProfit.toLocaleString()} assessed at statutory 30% corporate rate. Annual tax liability: LKR ${corporateIncomeTax.toLocaleString()}.` },
          { no: '2.3', item: 'Quarterly Advance Schedule', details: `Statutory quarterly installment of LKR ${quarterlyInstallment.toLocaleString()} scheduled for Aug 15 (Q1), Nov 15 (Q2), Feb 15 (Q3), May 15 (Q4). Annual return due Nov 30.` }
        ],
        strategyBox1Label: 'Net VAT Liability',
        strategyBox1Value: `LKR ${netVatPayable.toLocaleString()}`,
        strategyBox2Label: 'Estimated Taxable Profit',
        strategyBox2Value: `LKR ${estimatedNetProfit.toLocaleString()}`,
        strategyBox3Label: 'Annual CIT (30%)',
        strategyBox3Value: `LKR ${corporateIncomeTax.toLocaleString()}`,
        scheduleHeaders: ['Schedule Item', 'Statutory Basis', 'Assessment Period', 'Due Date', 'Estimated Amount'],
        scheduleRows: [
          { col1: 'VAT Return & Remittance', col2: 'Output vs Input VAT (18%)', col3: 'Monthly Cycle', col4: '20th of next month', col5: `LKR ${netVatPayable.toLocaleString()}`, isHighlight: true },
          { col1: 'CIT Q1 Advance Installment', col2: 'Corporate Income Tax (30%)', col3: 'Quarter 1 (Apr - Jun)', col4: '15th August', col5: `LKR ${quarterlyInstallment.toLocaleString()}`, isHighlight: false },
          { col1: 'CIT Q2 Advance Installment', col2: 'Corporate Income Tax (30%)', col3: 'Quarter 2 (Jul - Sep)', col4: '15th November', col5: `LKR ${quarterlyInstallment.toLocaleString()}`, isHighlight: false },
          { col1: 'CIT Q3 Advance Installment', col2: 'Corporate Income Tax (30%)', col3: 'Quarter 3 (Oct - Dec)', col4: '15th February', col5: `LKR ${quarterlyInstallment.toLocaleString()}`, isHighlight: false },
          { col1: 'CIT Q4 Advance Installment', col2: 'Corporate Income Tax (30%)', col3: 'Quarter 4 (Jan - Mar)', col4: '15th May', col5: `LKR ${quarterlyInstallment.toLocaleString()}`, isHighlight: false },
          { col1: 'Annual Corporate Tax Return', col2: 'Audited Accounts Filing', col3: 'Assessment Year', col4: '30th November', col5: `LKR ${corporateIncomeTax.toLocaleString()}`, isHighlight: true }
        ],
        summaryTotals: [
          { label: 'Total Statutory Net VAT Payable', value: `LKR ${netVatPayable.toLocaleString()}` },
          { label: 'Annual Corporate Income Tax (30%)', value: `LKR ${corporateIncomeTax.toLocaleString()}` },
          { label: 'Quarterly Advance Installment (per quarter)', value: `LKR ${quarterlyInstallment.toLocaleString()}` }
        ],
        terms: [
          { title: 'Tax Legislation & Compliance', content: 'Prepared in accordance with Inland Revenue statutory provisions. All payments tracked with certified bank CEFT acknowledgments.' }
        ],
        preparedBy: 'Senior Tax Accountant',
        approvedBy: 'Financial Controller & Tax Director',
        authorizationStatus: 'Audited & Locked',
        auditStamp: `SYS-VERIFY-TAX-${Date.now().toString(36).toUpperCase()}`
      };
      setActiveReportDoc(spec);
    } else {
      // Default / Retention report
      const spec: AccountingDocumentSpec = {
        docTitle: `${reportType.toUpperCase()} STATEMENT`,
        docNo: `ACC-REP-GEN-${Date.now().toString(36).toUpperCase()}`,
        docDate: new Date().toISOString().substring(0, 10),
        category: 'Financial Management Report',
        strategyBox1Label: 'Active Projects',
        strategyBox1Value: `${projects.length}`,
        strategyBox2Label: 'Total Invoiced',
        strategyBox2Value: `LKR ${totalInvoiced.toLocaleString()}`,
        strategyBox3Label: 'Total Outstanding',
        strategyBox3Value: `LKR ${totalReceivables.toLocaleString()}`,
        scheduleHeaders: ['Reference', 'Entity', 'Category', 'Status', 'Balance'],
        scheduleRows: projects.slice(0, 8).map(p => ({
          col1: p.projectCode || p.id.slice(0, 8),
          col2: p.projectName,
          col3: p.client.name,
          col4: p.status,
          col5: `LKR ${((p as any).budget || (p as any).contractValue || 0).toLocaleString()}`
        })),
        summaryTotals: [
          { label: 'Audited Turnover', value: `LKR ${totalInvoiced.toLocaleString()}` }
        ],
        terms: [
          { title: 'Corporate Veracity Clause', content: 'Generated from live ERP financial transactions and project ledger.' }
        ],
        preparedBy: 'Financial Accounts Controller',
        approvedBy: 'Chief Accountant (FC)',
        authorizationStatus: 'Approved',
        auditStamp: `SYS-VERIFY-GEN-${Date.now().toString(36).toUpperCase()}`
      };
      setActiveReportDoc(spec);
    }
  };

  const agingData = useMemo(() => {
    const now = new Date();
    const buckets = {
      current: 0,
      '1-30': 0,
      '31-60': 0,
      '61-90': 0,
      '90+': 0
    };

    invoices.forEach(invoice => {
      if (invoice.balanceDue <= 0) return;

      const dueDate = new Date(invoice.dueDate);
      const diffDays = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays <= 0) buckets.current += invoice.balanceDue;
      else if (diffDays <= 30) buckets['1-30'] += invoice.balanceDue;
      else if (diffDays <= 60) buckets['31-60'] += invoice.balanceDue;
      else if (diffDays <= 90) buckets['61-90'] += invoice.balanceDue;
      else buckets['90+'] += invoice.balanceDue;
    });

    return [
      { name: 'Current', value: buckets.current, color: '#10b981' },
      { name: '1-30 Days', value: buckets['1-30'], color: '#3b82f6' },
      { name: '31-60 Days', value: buckets['31-60'], color: '#f59e0b' },
      { name: '61-90 Days', value: buckets['61-90'], color: '#ef4444' },
      { name: '90+ Days', value: buckets['90+'], color: '#7f1d1d' }
    ];
  }, [invoices]);

  const overdueInvoicesCount = useMemo(() => {
    const now = new Date();
    return invoices.filter(inv => inv.balanceDue > 0 && new Date(inv.dueDate) < now).length;
  }, [invoices]);

  const avgPaymentDays = useMemo(() => {
    const paidInvoices = invoices.filter(inv => inv.status === InvoiceStatus.COLLECTED_PAYMENT);
    if (paidInvoices.length === 0) return 0;

    let totalDays = 0;
    let count = 0;

    paidInvoices.forEach(inv => {
      const invPayments = payments.filter(p => p.invoiceId === inv.id);
      if (invPayments.length > 0) {
        // Get the latest payment date for this invoice
        const lastPaymentDate = new Date(Math.max(...invPayments.map(p => new Date(p.date).getTime())));
        const invoiceDate = new Date(inv.date);
        const diffTime = Math.abs(lastPaymentDate.getTime() - invoiceDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        totalDays += diffDays;
        count++;
      }
    });

    return count > 0 ? Math.round(totalDays / count) : 0;
  }, [invoices, payments]);

  const getClientTransactions = (clientId: string | null) => {
    if (!clientId) return [];
    const txs: Transaction[] = [];
    
    // Invoices (Debits)
    invoices.filter(i => i.client.id === clientId).forEach(i => {
      txs.push({
        id: i.id,
        date: i.date,
        type: 'Invoice',
        referenceNo: i.invoiceNo,
        description: `Invoice for ${i.projectName || 'Project'}`,
        debit: i.grandTotal,
        credit: 0,
        balance: 0,
        projectName: i.projectName
      });
    });

    // Payments (Credits)
    payments.filter(p => p.clientId === clientId).forEach(p => {
      txs.push({
        id: p.id,
        date: p.date,
        type: 'Payment',
        referenceNo: p.paymentNo,
        description: `Payment via ${p.method}${p.reference ? ' (Ref: ' + p.reference + ')' : ''}`,
        debit: 0,
        credit: p.amount,
        balance: 0,
        projectName: p.projectName
      });
    });

    // Adjustments (Credits)
    adjustments.filter(a => a.clientId === clientId).forEach(a => {
      txs.push({
        id: a.id,
        date: a.date,
        type: 'Adjustment',
        referenceNo: a.adjustmentNo,
        description: `${a.type}: ${a.reason}`,
        debit: 0,
        credit: a.amount,
        balance: 0
      });
    });

    // Sort by date and calculate running balance
    txs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    let runningBalance = 0;
    return txs.map(tx => {
      runningBalance += (tx.debit - tx.credit);
      return { ...tx, balance: runningBalance };
    });
  };

  const clientTransactions = useMemo(() => getClientTransactions(selectedClientId), [selectedClientId, invoices, payments, adjustments]);

  const agingReportData = useMemo(() => {
    const now = new Date();
    const buckets = {
      current: 0,
      '1-30': 0,
      '31-60': 0,
      '61-90': 0,
      '90+': 0,
    };

    invoices.filter(inv => inv.balanceDue > 0).forEach(inv => {
      const dueDate = new Date(inv.dueDate);
      const diffTime = now.getTime() - dueDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 0) buckets.current += inv.balanceDue;
      else if (diffDays <= 30) buckets['1-30'] += inv.balanceDue;
      else if (diffDays <= 60) buckets['31-60'] += inv.balanceDue;
      else if (diffDays <= 90) buckets['61-90'] += inv.balanceDue;
      else buckets['90+'] += inv.balanceDue;
    });

    return Object.entries(buckets).map(([name, value]) => ({ name, value }));
  }, [invoices]);

  const renderOverview = () => (
    <div className="space-y-2.5">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <div className="w-7 h-7 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center">
              <DollarSign size={15} />
            </div>
            <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">+12%</span>
          </div>
          <p className="text-xs text-slate-500 font-normal">Total Receivables</p>
          <h3 className="text-lg font-semibold text-slate-900 mt-0.5">LKR {totalReceivables.toLocaleString()}</h3>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <div className="w-7 h-7 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
              <TrendingUp size={15} />
            </div>
            <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              {totalInvoiced > 0 ? Math.round((totalCollected / totalInvoiced) * 100) : 0}%
            </span>
          </div>
          <p className="text-xs text-slate-500 font-normal">Collection Rate</p>
          <h3 className="text-lg font-semibold text-slate-900 mt-0.5">
            {totalInvoiced > 0 ? ((totalCollected / totalInvoiced) * 100).toFixed(1) : '0'}%
          </h3>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <div className="w-7 h-7 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
              <Clock size={15} />
            </div>
            <span className={cn(
              "text-[11px] font-medium px-2 py-0.5 rounded-full",
              overdueInvoicesCount > 0 ? "text-rose-600 bg-rose-50" : "text-emerald-600 bg-emerald-50"
            )}>
              {overdueInvoicesCount} Overdue
            </span>
          </div>
          <p className="text-xs text-slate-500 font-normal">Average Payment Days</p>
          <h3 className="text-lg font-semibold text-slate-900 mt-0.5">{avgPaymentDays} Days</h3>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <div className="w-7 h-7 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center">
              <AlertCircle size={15} />
            </div>
            <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">Active</span>
          </div>
          <p className="text-xs text-slate-500 font-normal">Retention Held</p>
          <h3 className="text-lg font-semibold text-slate-900 mt-0.5">LKR {(Object.values(financials) as CustomerFinancials[]).reduce((s, f) => s + f.totalRetention, 0).toLocaleString()}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5">
        {/* Aging Chart */}
        <div className="lg:col-span-2 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Receivables Aging</h3>
              <p className="text-xs text-slate-500 font-normal">Breakdown of outstanding balances by days overdue</p>
            </div>
            <div className="flex items-center gap-2">
              {agingData.map(item => (
                <div key={item.name} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs font-medium text-slate-500">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="h-[210px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agingData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fontWeight: 500, fill: '#64748b' }}
                  dy={8}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fontWeight: 500, fill: '#64748b' }}
                  tickFormatter={(value) => `LKR ${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)', fontSize: '12px' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {agingData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Debtors */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Top Debtors</h3>
          <div className="space-y-2.5">
            {(Object.values(financials) as CustomerFinancials[])
              .sort((a, b) => b.outstandingBalance - a.outstandingBalance)
              .slice(0, 5)
              .map(f => {
                const client = clients.find(c => c.id === f.clientId);
                return (
                  <div key={f.clientId} className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100/70 transition-colors rounded-lg border border-slate-200/60">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center text-slate-400 border border-slate-200 shrink-0">
                        <User size={13} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">{client?.name}</p>
                        <p className="text-[10px] text-slate-400 font-normal">LKR {f.totalInvoiced.toLocaleString()} Invoiced</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-semibold text-rose-600">LKR {f.outstandingBalance.toLocaleString()}</p>
                      <p className="text-[7px] font-bold text-slate-400 tracking-tight">Outstanding</p>
                    </div>
                  </div>
                );
              })}
          </div>
          <button 
            onClick={() => setActiveTab('ledgers')}
            className="w-full mt-4 py-2 text-[9px] font-bold text-blue-600 tracking-tight border border-blue-100 rounded-lg hover:bg-blue-50 transition-all"
          >
            View all ledgers
          </button>
        </div>
      </div>
    </div>
  );

  const renderPayments = () => {
    const filteredPayments = payments
      .filter(p => {
        const matchingProj = projects.find(prj => prj.id === p.projectId || prj.projectCode === p.projectId || (p.projectName && prj.projectName.toLowerCase() === p.projectName.toLowerCase()));
        const pCode = matchingProj?.projectCode || p.projectId || '';
        const q = paymentSearchQuery.toLowerCase().trim();
        const matchesSearch = !q ||
          p.paymentNo.toLowerCase().includes(q) ||
          pCode.toLowerCase().includes(q) ||
          (p.invoiceNo && p.invoiceNo.toLowerCase().includes(q)) ||
          p.clientName.toLowerCase().includes(q) ||
          (p.reference && p.reference.toLowerCase().includes(q)) ||
          p.method.toLowerCase().includes(q);

        const targetProj = projects.find(prj => prj.id === paymentProjectFilter || prj.projectCode === paymentProjectFilter);
        const matchesProject = paymentProjectFilter === 'All' || 
          p.projectId === paymentProjectFilter || 
          pCode === paymentProjectFilter ||
          (targetProj && (p.projectId === targetProj.id || pCode === targetProj.projectCode));

        return matchesSearch && matchesProject;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
      <div className="space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 flex-1 max-w-xl flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text"
                placeholder="Search by Payment # (PK), Project Code (FK), Invoice #, Client..."
                value={paymentSearchQuery}
                onChange={(e) => setPaymentSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:border-orange-500 transition-colors shadow-2xs"
              />
            </div>

            {/* Project Foreign Key Filter */}
            <div className="flex items-center gap-1.5 bg-orange-50/70 px-2.5 py-1.5 rounded-xl border border-orange-200/80">
              <Folder size={12} className="text-orange-500 shrink-0" />
              <select
                value={paymentProjectFilter}
                onChange={(e) => setPaymentProjectFilter(e.target.value)}
                className="bg-transparent text-xs font-semibold text-orange-900 outline-none cursor-pointer max-w-[170px] truncate"
                title="Filter by Project Code (Foreign Key)"
              >
                <option value="All">All Projects (FK)</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>
                    [{p.projectCode || p.id.slice(0, 8)}] {p.projectName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                setEditingPayment(null);
                setIsPaymentModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-semibold transition-all shadow-xs shrink-0"
            >
              <Plus size={13} />
              <span>Record Payment</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[10px] font-bold text-slate-600 uppercase tracking-wider select-none whitespace-nowrap">
                  <th className="py-2.5 px-3">Payment # (PK)</th>
                  <th className="py-2.5 px-3">Project Code (FK)</th>
                  <th className="py-2.5 px-3">Invoice # (FK)</th>
                  <th className="py-2.5 px-3">Client Account</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Reference</th>
                  <th className="py-2.5 px-3">Method</th>
                  <th className="py-2.5 px-3 text-right">Amount Received</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.map(p => {
                  const matchingProj = projects.find(prj => prj.id === p.projectId || prj.projectCode === p.projectId || (p.projectName && prj.projectName.toLowerCase() === p.projectName.toLowerCase()));
                  const pCode = matchingProj?.projectCode || (p.projectId ? p.projectId.slice(0, 10) : null);

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors whitespace-nowrap group">
                      {/* PK: Payment Number */}
                      <td className="py-2.5 px-3">
                        <button
                          onClick={() => {
                            setEditingPayment(p);
                            setIsPaymentModalOpen(true);
                          }}
                          className="font-mono font-bold text-xs text-slate-900 bg-slate-100 hover:bg-orange-50 hover:text-orange-600 px-2 py-0.5 rounded border border-slate-200/80 transition-colors inline-flex items-center gap-1 shadow-2xs"
                          title={`Primary Key: ${p.paymentNo} (Click to Edit)`}
                        >
                          <CreditCard size={11} className="text-orange-500 shrink-0" />
                          <span>PK: {p.paymentNo}</span>
                        </button>
                      </td>

                      {/* FK: Project Code */}
                      <td className="py-2.5 px-3">
                        {pCode ? (
                          <button
                            onClick={() => setPaymentProjectFilter(matchingProj?.id || p.projectId || 'All')}
                            className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-orange-700 bg-orange-50 hover:bg-orange-100 px-2 py-0.5 rounded border border-orange-200/80 transition-colors shadow-2xs"
                            title={`Foreign Key: Project ${pCode} (Click to filter)`}
                          >
                            <Folder size={11} className="text-orange-500 shrink-0" />
                            <span>FK: {pCode}</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">FK: None</span>
                        )}
                      </td>

                      {/* FK: Invoice Number */}
                      <td className="py-2.5 px-3">
                        {p.invoiceNo ? (
                          <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/80 shadow-2xs">
                            <span>FK: {p.invoiceNo}</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">FK: None</span>
                        )}
                      </td>

                      {/* Client Account */}
                      <td className="py-2.5 px-3 max-w-[160px]">
                        <span className="font-semibold text-slate-900 truncate block" title={p.clientName}>
                          {p.clientName}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                        {p.date}
                      </td>

                      {/* Reference */}
                      <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px] max-w-[140px] truncate" title={p.reference}>
                        {p.reference || '—'}
                      </td>

                      {/* Method */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 bg-orange-50 text-orange-700 rounded-full text-[10px] font-semibold border border-orange-200/70">
                            {p.method}
                          </span>
                          {p.evidence && (
                            <button 
                              onClick={() => window.open(p.evidence?.url, '_blank')}
                              className="p-1 text-slate-400 hover:text-orange-600 transition-colors"
                              title="View Evidence Attachment"
                            >
                              <Eye size={12} />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Amount Received */}
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600">
                        LKR {p.amount.toLocaleString()}
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button 
                            onClick={() => {
                              if (!isAdmin) {
                                toast.error('Permission Denied', {
                                  description: 'Only administrators have authority to edit payment receipts.'
                                });
                                onAddNotification('Permission Denied', 'Only administrators can edit payment records.', 'warning');
                                return;
                              }
                              setEditingPayment(p);
                              setIsPaymentModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                            title={isAdmin ? "Edit Payment (Admin)" : "Admin authority required"}
                          >
                            <Edit2 size={12} />
                          </button>
                          <button 
                            onClick={() => {
                              if (!isAdmin) {
                                toast.error('Permission Denied', {
                                  description: 'Only administrators have authority to edit or delete payment receipts.'
                                });
                                onAddNotification('Permission Denied', 'Only administrators can delete payment records.', 'warning');
                                return;
                              }
                              onDeletePayment(p.id);
                              toast.success('Payment Deleted', { description: `Payment ${p.paymentNo} removed.` });
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                            title={isAdmin ? "Delete Payment (Admin)" : "Admin authority required"}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredPayments.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-6 py-16 text-center">
                      <CreditCard size={36} className="mx-auto text-slate-300 mb-3" />
                      <p className="text-slate-600 font-semibold text-xs">No payments found</p>
                      <p className="text-slate-400 text-[11px] mt-0.5">Try adjusting your search criteria or project filter</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderAdjustments = () => {
    const filteredAdjustments = adjustments
      .filter(a => {
        const matchingProj = projects.find(prj => prj.id === a.projectId || prj.projectCode === a.projectId);
        const pCode = matchingProj?.projectCode || a.projectId || '';
        const clientName = clients.find(c => c.id === a.clientId)?.name || '';
        const q = adjustmentSearchQuery.toLowerCase().trim();
        const matchesSearch = !q ||
          a.id.toLowerCase().includes(q) ||
          pCode.toLowerCase().includes(q) ||
          clientName.toLowerCase().includes(q) ||
          a.reason.toLowerCase().includes(q) ||
          a.type.toLowerCase().includes(q);

        const targetProj = projects.find(prj => prj.id === adjustmentProjectFilter || prj.projectCode === adjustmentProjectFilter);
        const matchesProject = adjustmentProjectFilter === 'All' || 
          a.projectId === adjustmentProjectFilter || 
          pCode === adjustmentProjectFilter ||
          (targetProj && (a.projectId === targetProj.id || pCode === targetProj.projectCode));

        return matchesSearch && matchesProject;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
      <div className="space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 flex-1 max-w-xl flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text"
                placeholder="Search by Adjustment ID (PK), Project Code (FK), Customer, Reason..."
                value={adjustmentSearchQuery}
                onChange={(e) => setAdjustmentSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:border-orange-500 transition-colors shadow-2xs"
              />
            </div>

            {/* Project Foreign Key Filter */}
            <div className="flex items-center gap-1.5 bg-orange-50/70 px-2.5 py-1.5 rounded-xl border border-orange-200/80">
              <Folder size={12} className="text-orange-500 shrink-0" />
              <select
                value={adjustmentProjectFilter}
                onChange={(e) => setAdjustmentProjectFilter(e.target.value)}
                className="bg-transparent text-xs font-semibold text-orange-900 outline-none cursor-pointer max-w-[170px] truncate"
                title="Filter by Project Code (Foreign Key)"
              >
                <option value="All">All Projects (FK)</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>
                    [{p.projectCode || p.id.slice(0, 8)}] {p.projectName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                setEditingAdjustment(null);
                setIsAdjustmentModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-semibold transition-all shadow-xs shrink-0"
            >
              <Plus size={13} />
              <span>New Adjustment</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[10px] font-bold text-slate-600 uppercase tracking-wider select-none whitespace-nowrap">
                  <th className="py-2.5 px-3">Adjustment ID (PK)</th>
                  <th className="py-2.5 px-3">Project Code (FK)</th>
                  <th className="py-2.5 px-3">Client Account</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Reason / Description</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3 text-right">Adjustment Amount</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAdjustments.map(a => {
                  const matchingProj = projects.find(prj => prj.id === a.projectId || prj.projectCode === a.projectId);
                  const pCode = matchingProj?.projectCode || (a.projectId ? a.projectId.slice(0, 10) : null);
                  const clientName = clients.find(c => c.id === a.clientId)?.name || 'General Client';

                  return (
                    <tr key={a.id} className="hover:bg-slate-50/70 transition-colors whitespace-nowrap group">
                      {/* PK: Adjustment ID */}
                      <td className="py-2.5 px-3">
                        <button
                          onClick={() => {
                            setEditingAdjustment(a);
                            setIsAdjustmentModalOpen(true);
                          }}
                          className="font-mono font-bold text-xs text-slate-900 bg-slate-100 hover:bg-orange-50 hover:text-orange-600 px-2 py-0.5 rounded border border-slate-200/80 transition-colors inline-flex items-center gap-1 shadow-2xs"
                          title={`Primary Key: ${a.id} (Click to Edit)`}
                        >
                          <FileText size={11} className="text-orange-500 shrink-0" />
                          <span>PK: {a.id.slice(0, 10).toUpperCase()}</span>
                        </button>
                      </td>

                      {/* FK: Project Code */}
                      <td className="py-2.5 px-3">
                        {pCode ? (
                          <button
                            onClick={() => setAdjustmentProjectFilter(matchingProj?.id || a.projectId || 'All')}
                            className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-orange-700 bg-orange-50 hover:bg-orange-100 px-2 py-0.5 rounded border border-orange-200/80 transition-colors shadow-2xs"
                            title={`Foreign Key: Project ${pCode} (Click to filter)`}
                          >
                            <Folder size={11} className="text-orange-500 shrink-0" />
                            <span>FK: {pCode}</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">FK: None</span>
                        )}
                      </td>

                      {/* Client Account */}
                      <td className="py-2.5 px-3 max-w-[160px]">
                        <span className="font-semibold text-slate-900 truncate block" title={clientName}>
                          {clientName}
                        </span>
                      </td>

                      {/* Type */}
                      <td className="py-2.5 px-3">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-semibold border",
                          a.type === 'Credit Note' ? "bg-amber-50 text-amber-700 border-amber-200" :
                          a.type === 'Write-off' ? "bg-rose-50 text-rose-700 border-rose-200" :
                          "bg-orange-50 text-orange-700 border-orange-200"
                        )}>
                          {a.type}
                        </span>
                      </td>

                      {/* Reason */}
                      <td className="py-2.5 px-3 text-slate-600 text-xs max-w-[200px] truncate" title={a.reason}>
                        {a.reason}
                      </td>

                      {/* Date */}
                      <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                        {a.date}
                      </td>

                      {/* Amount */}
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600">
                        LKR {a.amount.toLocaleString()}
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button 
                            onClick={() => {
                              if (!isAdmin) {
                                toast.error('Permission Denied', {
                                  description: 'Only administrators have authority to edit adjustments.'
                                });
                                onAddNotification('Permission Denied', 'Only administrators can edit adjustment records.', 'warning');
                                return;
                              }
                              setEditingAdjustment(a);
                              setIsAdjustmentModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                            title={isAdmin ? "Edit Adjustment (Admin)" : "Admin authority required"}
                          >
                            <Edit2 size={12} />
                          </button>
                          <button 
                            onClick={() => {
                              if (!isAdmin) {
                                toast.error('Permission Denied', {
                                  description: 'Only administrators have authority to delete credit adjustments.'
                                });
                                onAddNotification('Permission Denied', 'Only administrators can delete adjustment records.', 'warning');
                                return;
                              }
                              onDeleteAdjustment(a.id);
                              toast.success('Adjustment Deleted', { description: `Adjustment ${a.id} removed.` });
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                            title={isAdmin ? "Delete Adjustment (Admin)" : "Admin authority required"}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredAdjustments.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center">
                      <FileText size={36} className="mx-auto text-slate-300 mb-3" />
                      <p className="text-slate-600 font-semibold text-xs">No adjustments found</p>
                      <p className="text-slate-400 text-[11px] mt-0.5">Try adjusting your search criteria or project filter</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderLedgers = () => {
    const selectedClient = clients.find(c => c.id === selectedClientId);

    return (
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Client List */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col h-[calc(100vh-280px)]">
          <div className="p-3 border-b border-slate-200/60">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
              <input 
                type="text" 
                placeholder="Search customers..." 
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-lg text-xs font-normal focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {clients.map(client => {
              const fin = financials[client.id];
              const isSelected = selectedClientId === client.id;
              return (
                <button
                  key={client.id}
                  onClick={() => setSelectedClientId(client.id)}
                  className={cn(
                    "w-full text-left p-2.5 rounded-lg transition-all group",
                    isSelected ? "bg-orange-500 text-white shadow-xs" : "hover:bg-slate-50 text-slate-700"
                  )}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className={cn("text-xs font-medium truncate max-w-[120px]", isSelected ? "text-white" : "text-slate-900")}>
                      {client.name}
                    </span>
                    <ChevronRight size={13} className={cn(isSelected ? "text-white" : "text-slate-300 group-hover:text-slate-600")} />
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className={cn("text-[10px] font-normal", isSelected ? "text-orange-100" : "text-slate-400")}>
                      Outstanding
                    </span>
                    <span className={cn("text-xs font-semibold", isSelected ? "text-white" : "text-rose-600")}>
                      LKR {fin?.outstandingBalance.toLocaleString()}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Ledger View */}
        <div className="lg:col-span-3 space-y-4">
          {selectedClient ? (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              {/* Client Header */}
              <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center border border-orange-100">
                    <User size={18} />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">{selectedClient.name}</h2>
                    <p className="text-xs text-slate-500 font-normal">{selectedClient.tradeName || 'Individual Customer'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-slate-500 font-normal">Outstanding Balance</p>
                    <p className="text-lg font-semibold text-rose-600">LKR {(financials[selectedClient.id] as CustomerFinancials)?.outstandingBalance.toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => {
                        const clientTransactions = getClientTransactions(selectedClient.id);
                        const data = clientTransactions.map(t => [t.date, t.type, t.referenceNo, (t.debit || t.credit).toLocaleString(), t.balance.toLocaleString()]);
                        generateAccountingReportPDF(
                          `Customer Ledger - ${selectedClient.name}`,
                          data,
                          ['Date', 'Type', 'Ref', 'Amount', 'Balance'],
                          settings
                        );
                      }}
                      className="px-3 py-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all shadow-xs flex items-center gap-1.5 text-xs font-medium"
                    >
                      <Download size={13} /> Ledger
                    </button>
                    <button 
                      onClick={() => {
                        generateCustomerTAccountPDF(
                          selectedClient.name,
                          invoices,
                          payments,
                          adjustments,
                          settings
                        );
                        onAddNotification?.('T-Account Generated', `T-Account ledger for ${selectedClient.name} has been generated.`, 'success');
                      }}
                      className="px-3 py-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all shadow-xs flex items-center gap-1.5 text-xs font-medium"
                    >
                      <Download size={13} /> T-Account
                    </button>
                    <button 
                      onClick={() => {
                        generateAllCustomerReportsPDF(
                          selectedClient.name,
                          invoices,
                          projects,
                          payments,
                          adjustments,
                          settings
                        );
                        onAddNotification?.('Reports Generated', `All reports for ${selectedClient.name} have been generated.`, 'success');
                      }}
                      className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg transition-all shadow-xs flex items-center gap-1.5 text-xs font-medium"
                    >
                      <Download size={13} /> All Reports
                    </button>
                  </div>
                </div>
              </div>

              {/* Transaction Table */}
              <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="p-3.5 border-b border-slate-200/60 bg-slate-50/70 flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-slate-700">Customer Transaction Ledger</h3>
                  <span className="text-[11px] font-medium text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">Running Balance</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200/60 bg-slate-50/40">
                        <th className="px-4 py-3 text-xs font-semibold text-slate-500">Date</th>
                        <th className="px-4 py-3 text-xs font-semibold text-slate-500">Details</th>
                        <th className="px-4 py-3 text-xs font-semibold text-slate-500 text-right">Debit (+)</th>
                        <th className="px-4 py-3 text-xs font-semibold text-slate-500 text-right">Credit (-)</th>
                        <th className="px-4 py-3 text-xs font-semibold text-slate-500 text-right">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[...clientTransactions].reverse().map(tx => (
                        <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-4 py-3 text-xs text-slate-600 font-normal">{tx.date}</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col">
                              <span className="text-xs font-medium text-slate-900">{tx.description}</span>
                              <span className="text-[11px] text-slate-400 font-normal">{tx.referenceNo}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right text-xs font-medium text-slate-900">
                            {tx.debit > 0 ? `LKR ${tx.debit.toLocaleString()}` : '-'}
                          </td>
                          <td className="px-4 py-3 text-right text-xs font-medium text-emerald-600">
                            {tx.credit > 0 ? `LKR ${tx.credit.toLocaleString()}` : '-'}
                          </td>
                          <td className="px-4 py-3 text-right text-xs font-semibold text-slate-900">
                            LKR {tx.balance.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="h-full min-h-[300px] flex flex-col items-center justify-center bg-white rounded-xl border border-dashed border-slate-200 py-16">
              <User size={36} className="text-slate-300 mb-3" />
              <h3 className="text-sm font-semibold text-slate-900">Select a Customer</h3>
              <p className="text-slate-500 text-xs mt-0.5">Choose a customer from the list on the left to view their transactions</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderRecurringInvoices = () => {
    const recurringInvoices = invoices.filter(inv => inv.type === 'Recurring');
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Recurring Invoices</h2>
            <p className="text-xs text-slate-500 font-normal">Manage recurring invoice schedules and automation</p>
          </div>
          <button 
            onClick={() => {
              onProcessRecurring?.();
              onAddNotification?.('Processing', 'Checking for due recurring invoices...', 'info');
            }}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-medium transition-all shadow-xs"
          >
            <RefreshCw size={13} /> Run Scheduler
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recurringInvoices.map(inv => (
            <div key={inv.id} className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-orange-500/50 transition-all group">
              <div className="flex justify-between items-start mb-3">
                <div className="w-8 h-8 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-colors">
                  <RefreshCw size={15} />
                </div>
                <span className="text-[11px] font-medium px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100/60">
                  {inv.recurringConfig?.frequency}
                </span>
              </div>
              
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">{inv.client.name}</h3>
                  <p className="text-xs text-slate-400 font-normal">{inv.invoiceNo}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 py-2.5 border-y border-slate-100">
                  <div>
                    <p className="text-[10px] text-slate-400 font-normal mb-0.5">Next Run</p>
                    <p className="text-xs font-medium text-slate-700 flex items-center gap-1">
                      <Calendar size={11} className="text-orange-500" /> {inv.recurringConfig?.nextDate}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 font-normal mb-0.5">Amount</p>
                    <p className="text-xs font-semibold text-slate-900">LKR {inv.grandTotal.toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-0.5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-normal text-slate-500">Active Schedule</span>
                  </div>
                  <button className="text-xs font-medium text-orange-600 hover:text-orange-700 transition-colors">
                    Edit Schedule
                  </button>
                </div>
              </div>
            </div>
          ))}

          {recurringInvoices.length === 0 && (
            <div className="col-span-full py-16 text-center bg-white rounded-xl border border-dashed border-slate-200">
              <RefreshCw size={36} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-600 font-medium text-sm">No recurring invoices found</p>
              <p className="text-slate-400 text-xs mt-0.5">Create a recurring invoice in the Invoice Builder to set up automated billing</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderReports = () => {
    if (selectedReport === 'Aging Report') {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setSelectedReport(null)}
              className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft size={14} /> Back to Reports
            </button>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Accounts Receivable Aging Report</h2>
              <button 
                onClick={() => {
                  const data = invoices
                    .filter(inv => inv.balanceDue > 0 && new Date(inv.dueDate) < new Date())
                    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                    .map(inv => {
                      const diffDays = Math.ceil((new Date().getTime() - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24));
                      return [inv.invoiceNo, inv.client.name, inv.dueDate, `${diffDays} Days`, `LKR ${inv.balanceDue.toLocaleString()}`];
                    });
                  generateAccountingReportPDF('Aging Report', data, ['Invoice #', 'Customer', 'Due Date', 'Days Overdue', 'Balance Due'], settings);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
              >
                <Download size={14} /> Export PDF
              </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
              <h3 className="text-[10px] font-bold text-slate-400 tracking-widest mb-6">Aging Distribution</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={agingReportData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                      tickFormatter={(value) => `LKR ${value / 1000}k`}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: number) => [`LKR ${value.toLocaleString()}`, 'Outstanding']}
                    />
                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
              <h3 className="text-[10px] font-bold text-slate-400 tracking-widest mb-6">Summary</h3>
              <div className="space-y-4">
                {agingReportData.map(item => (
                  <div key={item.name} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                    <span className="text-xs font-bold text-slate-600">{item.name} Days</span>
                    <span className={cn(
                      "text-sm font-bold",
                      item.name === 'current' ? "text-emerald-600" : "text-rose-600"
                    )}>LKR {item.value.toLocaleString()}</span>
                  </div>
                ))}
                <div className="pt-4 border-t border-slate-200 flex items-center justify-between px-4">
                  <span className="text-xs font-bold text-slate-900">Total Outstanding</span>
                  <span className="text-lg font-bold text-slate-900">LKR {agingReportData.reduce((s, i) => s + i.value, 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Overdue Invoices Detail</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="px-6 py-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Invoice #</th>
                    <th className="px-6 py-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Customer</th>
                    <th className="px-6 py-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Due Date</th>
                    <th className="px-6 py-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-right">Days Overdue</th>
                    <th className="px-6 py-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-right">Balance Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {invoices
                    .filter(inv => inv.balanceDue > 0 && new Date(inv.dueDate) < new Date())
                    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                    .map(inv => {
                      const diffDays = Math.ceil((new Date().getTime() - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24));
                      return (
                        <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 text-xs font-bold text-slate-900">{inv.invoiceNo}</td>
                          <td className="px-6 py-4 text-xs font-medium text-slate-600">{inv.client.name}</td>
                          <td className="px-6 py-4 text-xs font-medium text-slate-600">{inv.dueDate}</td>
                          <td className="px-6 py-4 text-right">
                            <span className="px-2 py-0.5 bg-rose-50 text-rose-600 rounded-full text-[10px] font-bold">
                              {diffDays} Days
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right text-xs font-bold text-rose-600">
                            LKR {inv.balanceDue.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    if (selectedReport === 'Customer Statements') {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setSelectedReport(null)}
              className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft size={14} /> Back to Reports
            </button>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Customer Statements</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clients.map(client => {
              const clientFinancials = financials[client.id];
              return (
                <div key={client.id} className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm hover:border-blue-600 transition-all group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <User size={20} />
                    </div>
                    <button 
                      onClick={() => {
                        const clientTransactions = getClientTransactions(client.id);
                        const data = clientTransactions.map(t => [t.date, t.type, t.referenceNo, (t.debit || t.credit).toLocaleString(), t.balance.toLocaleString()]);
                        generateAccountingReportPDF(
                          `Customer Statement - ${client.name}`,
                          data,
                          ['Date', 'Type', 'Ref', 'Amount', 'Balance'],
                          settings
                        );
                      }}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                    >
                      <Download size={16} />
                    </button>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1">{client.name}</h3>
                  <p className="text-[10px] text-slate-400 font-bold tracking-widest mb-4">{client.email}</p>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Total Invoiced</span>
                      <span className="font-bold text-slate-900">LKR {clientFinancials?.totalInvoiced.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Outstanding</span>
                      <span className="font-bold text-rose-600">LKR {clientFinancials?.outstandingBalance.toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => {
                      setSelectedClientId(client.id);
                      setActiveTab('ledgers');
                    }}
                    className="w-full mt-4 py-2 bg-blue-50 text-blue-600 rounded-md text-[9px] font-bold tracking-wide hover:bg-blue-600 hover:text-white transition-all uppercase"
                  >
                    View Full Ledger
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    if (selectedReport === 'Collection Report') {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setSelectedReport(null)}
              className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft size={14} /> Back to Reports
            </button>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Collection Report</h2>
            <button 
              onClick={() => {
                const data = payments
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map(p => [p.date, p.paymentNo, p.clientName, p.method, `LKR ${p.amount.toLocaleString()}`]);
                generateAccountingReportPDF('Collection Report', data, ['Date', 'Payment #', 'Customer', 'Method', 'Amount'], settings);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
            >
              <Download size={14} /> Export PDF
            </button>
          </div>

          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="px-4 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-wide">Date</th>
                    <th className="px-4 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-wide">Payment #</th>
                    <th className="px-4 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-wide">Customer</th>
                    <th className="px-4 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-wide">Method</th>
                    <th className="px-4 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-wide text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {payments
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map(payment => (
                      <tr key={payment.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-[11px] font-medium text-slate-600">{payment.date}</td>
                        <td className="px-4 py-3 text-[11px] font-bold text-slate-900">{payment.paymentNo}</td>
                        <td className="px-4 py-3 text-[11px] font-medium text-slate-600">{payment.clientName}</td>
                        <td className="px-4 py-3 text-[11px] font-medium text-slate-600">{payment.method}</td>
                        <td className="px-4 py-3 text-right text-[11px] font-bold text-emerald-600">
                          LKR {payment.amount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 font-bold">
                    <td colSpan={4} className="px-4 py-3 text-[10px] text-slate-900 text-right tracking-wide uppercase">Total Collected</td>
                    <td className="px-4 py-3 text-right text-xs text-slate-900">
                      LKR {payments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      );
    }

    if (selectedReport === 'Retention Summary') {
      const retentionData = projects.map(project => {
        const projectInvoices = invoices.filter(inv => inv.projectId === project.id);
        const totalRetention = projectInvoices.reduce((sum, inv) => sum + (inv.retentionAmount || 0), 0);
        const released = adjustments
          .filter(a => a.projectId === project.id && a.type === 'Retention Release')
          .reduce((sum, a) => sum + a.amount, 0);
        
        return {
          id: project.id,
          projectName: project.projectName,
          clientName: project.client.name,
          totalRetention,
          released,
          balance: totalRetention - released
        };
      }).filter(p => p.totalRetention > 0);

      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setSelectedReport(null)}
              className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft size={14} /> Back to Reports
            </button>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Retention Summary</h2>
            <button 
              onClick={() => {
                const data = retentionData.map(p => [
                  p.projectName, 
                  p.clientName, 
                  `LKR ${p.totalRetention.toLocaleString()}`, 
                  `LKR ${p.released.toLocaleString()}`, 
                  `LKR ${p.balance.toLocaleString()}`
                ]);
                generateAccountingReportPDF('Retention Summary', data, ['Project', 'Customer', 'Total Retention', 'Released', 'Balance Held'], settings);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all shadow-sm"
            >
              <Download size={14} /> Export PDF
            </button>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="px-4 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-wide">Project</th>
                    <th className="px-4 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-wide">Customer</th>
                    <th className="px-4 py-3 text-[9px] font-bold text-slate-400 tracking-wide uppercase text-right">Total Retention</th>
                    <th className="px-4 py-3 text-[9px] font-bold text-slate-400 tracking-wide uppercase text-right">Released</th>
                    <th className="px-4 py-3 text-[9px] font-bold text-slate-400 tracking-wide uppercase text-right">Balance Held</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {retentionData.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-[11px] font-bold text-slate-900">{p.projectName}</td>
                      <td className="px-4 py-3 text-[11px] font-medium text-slate-600">{p.clientName}</td>
                      <td className="px-4 py-3 text-right text-[11px] font-medium text-slate-600">LKR {p.totalRetention.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-[11px] font-medium text-emerald-600">LKR {p.released.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-[11px] font-bold text-amber-600">LKR {p.balance.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    if (selectedReport === 'Project Financials') {
      const projectFinancials = projects.map(project => {
        const projectInvoices = invoices.filter(inv => inv.projectId === project.id);
        const totalInvoiced = projectInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
        const totalPaid = projectInvoices.reduce((sum, inv) => sum + (inv.grandTotal - inv.balanceDue), 0);
        const outstanding = totalInvoiced - totalPaid;
        
        return {
          id: project.id,
          name: project.projectName,
          client: project.client.name,
          totalInvoiced,
          totalPaid,
          outstanding,
          status: project.status
        };
      });

      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setSelectedReport(null)}
              className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft size={14} /> Back to Reports
            </button>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Project Financials</h2>
            <button 
              onClick={() => {
                const projectFinancials = projects.map(project => {
                  const projectInvoices = invoices.filter(inv => inv.projectId === project.id);
                  const totalInvoiced = projectInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
                  const totalPaid = projectInvoices.reduce((sum, inv) => sum + (inv.grandTotal - inv.balanceDue), 0);
                  const outstanding = totalInvoiced - totalPaid;
                  return [project.projectName, project.client.name, `LKR ${totalInvoiced.toLocaleString()}`, `LKR ${totalPaid.toLocaleString()}`, `LKR ${outstanding.toLocaleString()}`];
                });
                generateAccountingReportPDF('Project Financials', projectFinancials, ['Project', 'Customer', 'Invoiced', 'Collected', 'Outstanding'], settings);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
            >
              <Download size={14} /> Export PDF
            </button>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="px-4 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-wide">Project</th>
                    <th className="px-4 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-wide">Customer</th>
                    <th className="px-4 py-3 text-[9px] font-bold text-slate-400 tracking-wide uppercase text-right">Invoiced</th>
                    <th className="px-4 py-3 text-[9px] font-bold text-slate-400 tracking-wide uppercase text-right">Collected</th>
                    <th className="px-4 py-3 text-[9px] font-bold text-slate-400 tracking-wide uppercase text-right">Outstanding</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {projectFinancials.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="text-[11px] font-bold text-slate-900">{p.name}</div>
                        <div className="text-[9px] text-slate-400 font-bold tracking-wide uppercase">{p.status}</div>
                      </td>
                      <td className="px-4 py-3 text-[11px] font-medium text-slate-600">{p.client}</td>
                      <td className="px-4 py-3 text-right text-[11px] font-medium text-slate-900">LKR {p.totalInvoiced.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-[11px] font-medium text-emerald-600">LKR {p.totalPaid.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-[11px] font-bold text-rose-600">LKR {p.outstanding.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    if (selectedReport === 'Bad Debt Analysis') {
      const badDebts = adjustments.filter(a => a.type === 'Write-off' || a.type === 'Bad Debt');
      const totalBadDebt = badDebts.reduce((sum, a) => sum + a.amount, 0);

      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setSelectedReport(null)}
              className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft size={14} /> Back to Reports
            </button>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Bad Debt Analysis</h2>
            <button 
              onClick={() => {
                const badDebts = adjustments.filter(a => a.type === 'Write-off' || a.type === 'Bad Debt');
                const data = badDebts.map(a => {
                  const client = clients.find(c => c.id === a.clientId);
                  return [a.date, client?.name || 'Unknown', a.notes || 'No reason', `LKR ${a.amount.toLocaleString()}`];
                });
                generateAccountingReportPDF('Bad Debt Analysis', data, ['Date', 'Customer', 'Reason', 'Amount'], settings);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
            >
              <Download size={14} /> Export PDF
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-rose-50 p-6 rounded-[32px] border border-rose-100">
              <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-1">Total Write-offs</p>
              <h3 className="text-2xl font-bold text-rose-600">LKR {totalBadDebt.toLocaleString()}</h3>
            </div>
          </div>

          <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Write-off History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="px-6 py-4 text-[9px] font-bold text-slate-400 tracking-widest">Date</th>
                    <th className="px-6 py-4 text-[9px] font-bold text-slate-400 tracking-widest">Customer</th>
                    <th className="px-6 py-4 text-[9px] font-bold text-slate-400 tracking-widest">Reason</th>
                    <th className="px-6 py-4 text-[9px] font-bold text-slate-400 tracking-widest text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {badDebts.map(a => {
                    const client = clients.find(c => c.id === a.clientId);
                    return (
                      <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-xs font-medium text-slate-600">{a.date}</td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-900">{client?.name}</td>
                        <td className="px-6 py-4 text-xs font-medium text-slate-600">{a.notes || 'No reason provided'}</td>
                        <td className="px-6 py-4 text-right text-xs font-bold text-rose-600">LKR {a.amount.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                  {badDebts.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-xs italic">
                        No bad debts or write-offs recorded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { title: 'Customer Statements', desc: 'Generate audited statements for customers with running balance', icon: FileText },
          { title: 'Aging Report', desc: 'Detailed breakdown of overdue invoices and collections by aging bracket', icon: Clock },
          { title: 'Collection Report', desc: 'Summary of customer receipts and verified bank deposits', icon: TrendingUp },
          { title: 'Retention Summary', desc: 'Track held and released warranty DLP retention amounts connected to projects', icon: ShieldCheck },
          { title: 'Project Financials', desc: 'Profitability, materials, labour, equipment and realized margin per project', icon: Building2 },
          { title: 'Factory & Subcontractor Accounts', desc: 'Fabrication certified work, work packages and net payable balances', icon: Truck },
          { title: 'Bank Reconciliation', desc: 'Book balance, cleared transactions and verified statement clearance', icon: Landmark },
          { title: 'Bad Debt Analysis', desc: 'Track impaired accounts, debt provisions and approved write-offs', icon: AlertCircle },
          { title: 'Procurement Cost Report', desc: 'Purchase orders, vendor bills, 3-way match and supplier liabilities', icon: Truck },
          { title: 'Machinery & Equipment Cost Report', desc: 'Fleet assets, machine running hours, depreciation and hourly rates', icon: Wrench },
          { title: 'General Ledger & Trial Balance', desc: 'Complete chart of accounts, debit/credit audit with zero-variance balance', icon: Scale },
          { title: 'Payroll & Statutory Report', desc: 'Gross salaries, employer EPF/ETF contributions and net bank disbursements', icon: Users },
          { title: 'Corporate Tax Report', desc: 'Audited VAT (18%), Corporate Income Tax (30%), quarterly installments and filing schedules', icon: ShieldCheck }
        ].map(report => (
          <div
            key={report.title} 
            className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-orange-500/50 transition-all text-left flex flex-col justify-between"
          >
            <div>
              <div className="w-9 h-9 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center mb-2.5">
                <report.icon size={17} />
              </div>
              <h3 className="text-sm font-semibold text-slate-900 mb-1">{report.title}</h3>
              <p className="text-xs text-slate-500 font-normal leading-relaxed mb-3">{report.desc}</p>
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedReport(report.title)}
                className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold text-center cursor-pointer transition-colors"
              >
                Interactive
              </button>
              <button
                onClick={() => handleOpenCorporateReport(report.title)}
                className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold text-center cursor-pointer transition-colors flex items-center justify-center gap-1"
              >
                <FileText size={11} />
                <span>Document Layout</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-2.5 pb-8">
      {/* Minimal White Header Bar with Simple Words & Cross-Portal Links */}
      <header className="bg-white border border-slate-200/80 px-4 py-2.5 rounded-xl flex flex-wrap items-center justify-between gap-2 shadow-2xs">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-orange-500 text-white flex items-center justify-center shrink-0">
            <Building2 size={15} />
          </div>
          <h1 className="text-sm font-bold text-slate-900">Accounting & Finance Hub</h1>
          <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
            GL Balanced • IFRS
          </span>
        </div>

        {/* Universal System Search across all customers, suppliers, projects, invoices, payroll */}
        <div className="relative min-w-[260px] max-w-sm flex-1 mx-2">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Universal Search (customers, suppliers, projects, bills)..."
            value={universalSearchQuery}
            onChange={e => {
              setUniversalSearchQuery(e.target.value);
              setShowUniversalSearchResults(Boolean(e.target.value.trim()));
            }}
            onFocus={() => {
              if (universalSearchQuery.trim()) setShowUniversalSearchResults(true);
            }}
            className="w-full pl-7 pr-7 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-hidden focus:border-orange-500"
          />
          {universalSearchQuery && (
            <button
              onClick={() => {
                setUniversalSearchQuery('');
                setShowUniversalSearchResults(false);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={12} />
            </button>
          )}

          {/* Universal Search Results Dropdown */}
          {showUniversalSearchResults && universalSearchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 max-h-80 overflow-y-auto space-y-1">
              {universalSearchResults.map((res, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setShowUniversalSearchResults(false);
                    setUniversalSearchQuery('');
                    res.onSelect();
                  }}
                  className="w-full text-left p-2 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-bold', res.badgeColor)}>
                      {res.type}
                    </span>
                    <div>
                      <p className="font-semibold text-slate-900">{res.title}</p>
                      <p className="text-[10px] text-slate-500">{res.subtitle}</p>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-slate-700">{res.value}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Cross-Portal Links & Quick Actions */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {onNavigateToPortal && (
            <>
              <button
                onClick={() => onNavigateToPortal('invoices')}
                className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                title="Open Invoices & Progress Claims"
              >
                <FileText size={11} className="text-orange-500" />
                <span>Invoices</span>
              </button>
              <button
                onClick={() => onNavigateToPortal('projects')}
                className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                title="Open Projects & Contracts"
              >
                <Folder size={11} className="text-blue-600" />
                <span>Projects</span>
              </button>
              <button
                onClick={() => onNavigateToPortal('procurement', 'po')}
                className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                title="Open Procurement POs & GRNs"
              >
                <Truck size={11} className="text-purple-600" />
                <span>Procurement</span>
              </button>
              <button
                onClick={() => onNavigateToPortal('payroll')}
                className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                title="Open HR Payroll & WPS Center"
              >
                <Users size={11} className="text-teal-600" />
                <span>Payroll</span>
              </button>
              <button
                onClick={() => onNavigateToPortal('equipment-management', 'costing')}
                className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                title="Open Equipment & Fixed Asset Costing"
              >
                <Wrench size={11} className="text-amber-600" />
                <span>Equipment</span>
              </button>
            </>
          )}
          {onOpenCatalog && (
            <button
              type="button"
              onClick={() => onOpenCatalog('accounting')}
              className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Package size={11} className="text-indigo-600" />
              <span className="hidden sm:inline">Catalog</span>
            </button>
          )}
          <button
            onClick={() => setIsPaymentModalOpen(true)}
            className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Plus size={12} />
            <span>Record Receipt</span>
          </button>
        </div>
      </header>

      {/* Clean White Navigation Bar with Single-Word Tabs */}
      <div className="flex items-center gap-1 p-1 bg-white rounded-xl border border-slate-200/80 overflow-x-auto no-scrollbar shadow-2xs">
        {[
          { id: 'landing', label: 'Hub', icon: LayoutDashboard },
          { id: 'overview', label: 'Overview', icon: TrendingUp },
          { id: 'gl', label: 'Journals', icon: Scale, badge: journals.length },
          { id: 'payments', label: 'Receivables', icon: CreditCard, badge: payments.length },
          { id: 'ap', label: 'Payables', icon: Receipt, badge: apRecords.length },
          { id: 'bank', label: 'Banking', icon: Landmark, badge: bankRecords.length },
          { id: 'reconciliation', label: 'Reconciliation', icon: RefreshCw },
          { id: 'project_accounting', label: 'Costing', icon: Briefcase, badge: wipRecords.length },
          { id: 'payroll', label: 'Payroll', icon: Users },
          { id: 'parties', label: 'Parties', icon: Building2 },
          { id: 'adjustments', label: 'Adjustments', icon: FileText, badge: adjustments.length },
          { id: 'ledgers', label: 'Statements', icon: History, badge: clients.length },
          { id: 'assets_tax_close', label: 'Assets', icon: Lock, badge: assetRecords.length },
          { id: 'reports', label: 'Reports', icon: PieChartIcon }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              const nextTab = tab.id as AccountingTab;
              setActiveTab(nextTab);
              onTabChange?.(nextTab);
              setSelectedReport(null);
            }}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer',
              activeTab === tab.id
                ? 'bg-slate-900 text-white font-semibold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            )}
          >
            <tab.icon size={13} className={activeTab === tab.id ? 'text-orange-400' : 'text-slate-400'} />
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={cn(
                  'text-[10px] font-mono px-1.5 py-0.2 rounded',
                  activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                )}
              >
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Compact Single-Line KPI Strip */}
      {activeTab !== 'landing' && (
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
          <div className="bg-white border border-slate-200/80 rounded-xl px-3 py-2 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">Cash & Bank</span>
            <span className="text-xs font-bold text-emerald-600 font-mono">LKR 18.45M</span>
          </div>
          <div className="bg-white border border-slate-200/80 rounded-xl px-3 py-2 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">Receivables (AR)</span>
            <span className="text-xs font-bold text-slate-900 font-mono">
              LKR {(totalReceivables / 1000000).toFixed(2)}M
            </span>
          </div>
          <div className="bg-white border border-slate-200/80 rounded-xl px-3 py-2 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">Payables (AP)</span>
            <span className="text-xs font-bold text-blue-600 font-mono">
              LKR {(apRecords.filter(a => a.status !== 'Paid').reduce((s, a) => s + a.netPayable, 0) / 1000000).toFixed(2)}M
            </span>
          </div>
          <div className="bg-white border border-slate-200/80 rounded-xl px-3 py-2 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">Unbilled WIP</span>
            <span className="text-xs font-bold text-purple-600 font-mono">
              LKR {(wipRecords.reduce((s, w) => s + w.unbilledWip, 0) / 1000000).toFixed(2)}M
            </span>
          </div>
          <div className="bg-white border border-slate-200/80 rounded-xl px-3 py-2 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">GL Journals</span>
            <span className="text-xs font-bold text-slate-900 font-mono">{journals.length} Balanced</span>
          </div>
          <div className="bg-white border border-slate-200/80 rounded-xl px-3 py-2 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">Period Close</span>
            <span className="text-xs font-bold text-teal-600 font-mono">
              {closeSteps.filter(c => c.status === 'Completed & Locked').length}/{closeSteps.length} Locked
            </span>
          </div>
        </div>
      )}

      {/* Content Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'landing' && (
            <AccountingLandingPage
              journals={journals}
              apRecords={apRecords}
              bankRecords={bankRecords}
              wipRecords={wipRecords}
              assetRecords={assetRecords}
              closeSteps={closeSteps}
              paymentsCount={payments.length}
              adjustmentsCount={adjustments.length}
              clientsCount={clients.length}
              onNavigateTab={t => {
                setActiveTab(t);
                onTabChange?.(t);
              }}
              onOpenRecordPayment={() => {
                setEditingPayment(null);
                setIsPaymentModalOpen(true);
              }}
              onOpenNewJournal={() => setIsAddingJournal(true)}
              onOpenNewApBill={() => setIsAddingAp(true)}
              onOpenNewBankEntry={() => setIsAddingBank(true)}
              onOpenNewAdjustment={() => {
                setEditingAdjustment(null);
                setIsAdjustmentModalOpen(true);
              }}
              onOpenNewAsset={() => setIsAddingAsset(true)}
              onNavigatePortal={onNavigateToPortal}
              onExportPDF={() => {
                setActiveTab('reports');
                setSelectedReport(null);
              }}
            />
          )}
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'gl' && (
            <GlAndCoaSection
              journals={journals}
              coaList={coaList}
              searchQuery={glSearchQuery}
              onSearchChange={setGlSearchQuery}
              onUpdateJournals={next => {
                setJournals(next);
                accountingControlService.saveJournals(next);
              }}
              onUpdateCoa={next => {
                setCoaList(next);
                accountingControlService.saveCoa(next);
              }}
              isAddingJournal={isAddingJournal}
              setIsAddingJournal={setIsAddingJournal}
              isAdmin={isAdmin}
              onAddNotification={onAddNotification}
            />
          )}
          {activeTab === 'payments' && renderPayments()}
          {activeTab === 'ap' && (
            <ApThreeWaySection
              apRecords={apRecords}
              onUpdateAp={next => {
                setApRecords(next);
                accountingControlService.saveApRecords(next);
              }}
              isAddingAp={isAddingAp}
              setIsAddingAp={setIsAddingAp}
              onNavigatePortal={onNavigateToPortal}
              isAdmin={isAdmin}
              onAddNotification={onAddNotification}
            />
          )}
          {activeTab === 'bank' && (
            <BankAndCashSection
              bankRecords={bankRecords}
              pettyRecords={pettyRecords}
              onUpdateBank={next => {
                setBankRecords(next);
                accountingControlService.saveBankRecords(next);
              }}
              onUpdatePetty={next => {
                setPettyRecords(next);
                accountingControlService.savePettyCash(next);
              }}
              isAddingBank={isAddingBank}
              setIsAddingBank={setIsAddingBank}
              isAdmin={isAdmin}
              onAddNotification={onAddNotification}
            />
          )}
          {activeTab === 'reconciliation' && (
            <BankReconciliationSection
              bankRecords={bankRecords}
              onUpdateBank={next => {
                setBankRecords(next);
                accountingControlService.saveBankRecords(next);
              }}
              payments={payments}
              invoices={invoices}
              apRecords={apRecords}
              isAdmin={isAdmin}
              canDownload={canDownload}
              onOpenDocument={doc => setActiveReportDoc(doc)}
              onAddNotification={onAddNotification}
            />
          )}
          {activeTab === 'project_accounting' && (
            <AccountingCostingSection
              projects={projects}
              invoices={invoices}
              quotes={quotes}
              warrantyCertificates={warrantyCertificates}
              isAdmin={isAdmin}
              onNavigatePortal={onNavigateToPortal}
              canDownload={canDownload}
            />
          )}
          {activeTab === 'payroll' && (
            <AccountingPayrollSection
              onPostJournal={j => {
                const next = [j, ...journals];
                setJournals(next);
                accountingControlService.saveJournals(next);
              }}
              isAdmin={isAdmin}
              onNavigatePortal={onNavigateToPortal}
              canDownload={canDownload}
            />
          )}
          {activeTab === 'parties' && (
            <AccountingPartiesSection
              clients={clients}
              invoices={invoices}
              payments={payments}
              adjustments={adjustments}
              apRecords={apRecords}
              isAdmin={isAdmin}
              onNavigatePortal={onNavigateToPortal}
              onOpenRecordPayment={() => setIsPaymentModalOpen(true)}
              canDownload={canDownload}
              onAddNotification={onAddNotification}
            />
          )}
          {activeTab === 'adjustments' && renderAdjustments()}
          {activeTab === 'ledgers' && renderLedgers()}
          {activeTab === 'assets_tax_close' && (
            <AssetsTaxCloseSection
              assetRecords={assetRecords}
              taxRecords={taxRecords}
              closeSteps={closeSteps}
              invoices={invoices}
              apRecords={apRecords}
              isAdmin={isAdmin}
              canDownload={canDownload}
              onOpenCorporateReport={handleOpenCorporateReport}
              onUpdateAssets={next => {
                setAssetRecords(next);
                accountingControlService.saveFixedAssets(next);
              }}
              onUpdateTax={next => {
                setTaxRecords(next);
                accountingControlService.saveTaxRecords(next);
              }}
              onUpdateCloseSteps={next => {
                setCloseSteps(next);
                accountingControlService.savePeriodCloseSteps(next);
              }}
              isAddingAsset={isAddingAsset}
              setIsAddingAsset={setIsAddingAsset}
              onNavigatePortal={onNavigateToPortal}
            />
          )}
          {activeTab === 'recurring' && renderRecurringInvoices()}
          {activeTab === 'reports' && renderReports()}
        </motion.div>
      </AnimatePresence>

      {/* Payment Modal */}
      {isPaymentModalOpen && (
        <PaymentModal 
          clients={clients}
          projects={projects}
          invoices={invoices}
          editingPayment={editingPayment || (preselectedInvoiceId ? {
            clientId: invoices.find(i => i.id === preselectedInvoiceId)?.client.id,
            clientName: invoices.find(i => i.id === preselectedInvoiceId)?.client.name,
            invoiceId: preselectedInvoiceId,
            invoiceNo: invoices.find(i => i.id === preselectedInvoiceId)?.invoiceNo,
            projectId: invoices.find(i => i.id === preselectedInvoiceId)?.projectId,
            projectName: invoices.find(i => i.id === preselectedInvoiceId)?.projectName,
            amount: invoices.find(i => i.id === preselectedInvoiceId)?.balanceDue || 0
          } : null)}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setEditingPayment(null);
            onClearPreselectedInvoice?.();
          }}
          onSave={(p: any) => {
            if (editingPayment) {
              onUpdatePayment({ ...p, id: editingPayment.id });
              onAddNotification('Payment Updated', `Payment ${p.paymentNo} updated.`, 'success');
            } else {
              onAddPayment(p);
              onAddNotification('Payment Recorded', `Payment ${p.paymentNo} for ${p.amount.toLocaleString()} saved.`, 'success');
            }
            setIsPaymentModalOpen(false);
            setEditingPayment(null);
          }}
        />
      )}

      {/* Adjustment Modal */}
      {isAdjustmentModalOpen && (
        <AdjustmentModal 
          clients={clients}
          projects={projects}
          invoices={invoices}
          editingAdjustment={editingAdjustment}
          onClose={() => {
            setIsAdjustmentModalOpen(false);
            setEditingAdjustment(null);
          }}
          onSave={(a: any) => {
            if (editingAdjustment) {
              onUpdateAdjustment({ ...a, id: editingAdjustment.id });
              onAddNotification('Adjustment Updated', `${a.type} updated.`, 'success');
            } else {
              onAddAdjustment(a);
              onAddNotification('Adjustment Recorded', `${a.type} for ${a.amount.toLocaleString()} saved.`, 'success');
            }
            setIsAdjustmentModalOpen(false);
            setEditingAdjustment(null);
          }}
        />
      )}

      {/* Official Corporate Document Viewer Modal (Factory Portal Layout) */}
      <AccountingDocumentModal
        spec={activeReportDoc}
        isOpen={Boolean(activeReportDoc)}
        onClose={() => setActiveReportDoc(null)}
        settings={settings}
        canDownload={canDownload}
        isAdmin={isAdmin}
        onAddNotification={onAddNotification}
      />
    </div>
  );
};

// Sub-components for Modals
const PaymentModal = ({ clients, projects, invoices, onClose, onSave, editingPayment }: any) => {
  const [formData, setFormData] = useState<Partial<Payment>>(editingPayment || {
    paymentNo: `PAY-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    date: new Date().toISOString().split('T')[0],
    method: 'Bank Transfer',
    amount: 0,
    clientId: '',
    clientName: '',
    status: 'Completed'
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const filteredProjects = projects.filter((p: any) => p.client?.id === formData.clientId);
  const filteredInvoices = invoices.filter((i: any) => {
    const matchesClient = i.client?.id === formData.clientId;
    const matchesProject = !formData.projectId || i.projectId === formData.projectId;
    return matchesClient && matchesProject;
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = (event.target?.result as string).split(',')[1];
        const extracted = await analyzeEvidence(base64, file.type);
        
        // Try to find matching client
        let matchedClientId = formData.clientId;
        let matchedClientName = formData.clientName;
        if (extracted.customerName) {
          const client = clients.find((c: any) => 
            c.name.toLowerCase().includes(extracted.customerName!.toLowerCase()) ||
            extracted.customerName!.toLowerCase().includes(c.name.toLowerCase())
          );
          if (client) {
            matchedClientId = client.id;
            matchedClientName = client.name;
          }
        }

        // Try to find matching invoice
        let matchedInvoiceId = formData.invoiceId;
        let matchedInvoiceNo = formData.invoiceNo;
        let matchedProjectId = formData.projectId;
        let matchedProjectName = formData.projectName;

        if (extracted.invoiceNo) {
          const inv = invoices.find((i: any) => 
            i.invoiceNo.toLowerCase().includes(extracted.invoiceNo!.toLowerCase()) ||
            extracted.invoiceNo!.toLowerCase().includes(i.invoiceNo.toLowerCase())
          );
          if (inv) {
            matchedInvoiceId = inv.id;
            matchedInvoiceNo = inv.invoiceNo;
            matchedClientId = inv.client.id;
            matchedClientName = inv.client.name;
            matchedProjectId = inv.projectId;
            matchedProjectName = inv.projectName;
          }
        }

        // Update form with extracted data
        setFormData(prev => ({
          ...prev,
          date: extracted.date || prev.date,
          amount: extracted.amount || prev.amount,
          reference: extracted.reference || prev.reference,
          clientId: matchedClientId,
          clientName: matchedClientName,
          invoiceId: matchedInvoiceId,
          invoiceNo: matchedInvoiceNo,
          projectId: matchedProjectId,
          projectName: matchedProjectName,
          notes: (prev.notes || '') + (extracted.bankName ? `\nBank: ${extracted.bankName}` : ''),
          evidence: {
            id: crypto.randomUUID(),
            url: URL.createObjectURL(file),
            name: file.name,
            type: file.type,
            extractedData: extracted
          }
        }));
        setIsAnalyzing(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error processing file:", error);
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-lg w-full max-w-4xl shadow-2xl overflow-hidden border border-slate-200"
      >
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{editingPayment ? 'Edit Payment' : 'Record Payment'}</h2>
            <p className="text-xs text-slate-500 font-medium">{editingPayment ? 'Update payment details' : 'Enter details for the incoming payment'}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-md transition-colors text-slate-400">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto max-h-[75vh]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Evidence & Basic Info */}
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide ml-1">Upload Evidence (Bank Slip / Receipt)</label>
                <div className="relative">
                  <input 
                    type="file" 
                    accept="image/*,application/pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="payment-evidence-upload"
                  />
                  <label 
                    htmlFor="payment-evidence-upload"
                    className={cn(
                      "w-full flex flex-col items-center justify-center p-6 border border-dashed rounded-lg cursor-pointer transition-all min-h-[160px]",
                      formData.evidence ? "border-emerald-200 bg-emerald-50/50" : "border-slate-200 hover:border-blue-400 hover:bg-slate-50"
                    )}
                  >
                    {isAnalyzing ? (
                      <div className="flex flex-col items-center">
                        <Loader2 className="animate-spin text-blue-600 mb-2" size={32} />
                        <p className="text-xs font-bold text-blue-600">Analyzing Evidence...</p>
                        <p className="text-[10px] text-blue-400 mt-0.5 italic">Extracting data with AI</p>
                      </div>
                    ) : formData.evidence ? (
                      <div className="flex flex-col items-center text-center px-4">
                        <div className="w-12 h-12 bg-emerald-100 rounded-md flex items-center justify-center mb-3 shadow-inner">
                          <Check className="text-emerald-600" size={24} />
                        </div>
                        <p className="text-xs font-bold text-emerald-600 truncate max-w-full">{formData.evidence.name}</p>
                        <p className="text-[9px] text-emerald-400 mt-0.5">Click to replace evidence</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 bg-slate-100 rounded-md flex items-center justify-center mb-3">
                          <Upload className="text-slate-400" size={24} />
                        </div>
                        <p className="text-xs font-bold text-slate-600">Click or drag to upload</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">Supports images and PDFs</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide ml-1">Payment #</label>
                  <input 
                    type="text" 
                    value={formData.paymentNo} 
                    readOnly 
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs font-bold text-slate-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide ml-1">Date</label>
                  <input 
                    type="date" 
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-2 bg-white border border-slate-100 rounded-md text-xs font-bold focus:ring-1 focus:ring-blue-600/50 focus:border-blue-600 transition-all outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide ml-1">Amount (LKR)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-[10px]">LKR</span>
                    <input 
                      type="number" 
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                      className="w-full pl-12 pr-4 py-2 bg-white border border-slate-100 rounded-md text-xs font-bold focus:ring-1 focus:ring-blue-600/50 focus:border-blue-600 transition-all outline-none"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide ml-1">Method</label>
                  <select 
                    value={formData.method}
                    onChange={(e) => setFormData({ ...formData, method: e.target.value as PaymentMethod })}
                    className="w-full px-4 py-2 bg-white border border-slate-100 rounded-md text-xs font-bold focus:ring-1 focus:ring-blue-600/50 focus:border-blue-600 transition-all outline-none appearance-none"
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Right Column: Linking & Notes */}
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide ml-1">Customer</label>
                <select 
                  value={formData.clientId}
                  onChange={(e) => {
                    const client = clients.find((c: any) => c.id === e.target.value);
                    setFormData({ ...formData, clientId: e.target.value, clientName: client?.name || '', projectId: '', projectName: '', invoiceId: '', invoiceNo: '' });
                  }}
                  className="w-full px-4 py-2 bg-white border border-slate-100 rounded-md text-xs font-bold focus:ring-1 focus:ring-blue-600/50 focus:border-blue-600 transition-all outline-none appearance-none"
                >
                  <option value="">Select Customer</option>
                  {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide ml-1">Project</label>
                <select 
                  value={formData.projectId}
                  onChange={(e) => {
                    const project = projects.find((p: any) => p.id === e.target.value);
                    setFormData({ ...formData, projectId: e.target.value, projectName: project?.projectName || '', invoiceId: '', invoiceNo: '' });
                  }}
                  className="w-full px-4 py-2 bg-white border border-slate-100 rounded-md text-xs font-bold focus:ring-1 focus:ring-blue-600/50 focus:border-blue-600 transition-all outline-none appearance-none disabled:opacity-50"
                  disabled={!formData.clientId}
                >
                  <option value="">Select Project (Optional)</option>
                  {filteredProjects.map((p: any) => <option key={p.id} value={p.id}>{p.projectName}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide ml-1">Link to Invoice</label>
                <select 
                  value={formData.invoiceId}
                  onChange={(e) => {
                    const inv = invoices.find((i: any) => i.id === e.target.value);
                    setFormData({ 
                      ...formData, 
                      invoiceId: e.target.value, 
                      invoiceNo: inv?.invoiceNo,
                      projectId: inv?.projectId || formData.projectId,
                      projectName: inv?.projectName || formData.projectName,
                      amount: inv?.balanceDue || formData.amount
                    });
                  }}
                  className="w-full px-4 py-2 bg-white border border-slate-100 rounded-md text-xs font-bold focus:ring-1 focus:ring-blue-600/50 focus:border-blue-600 transition-all outline-none appearance-none disabled:opacity-50"
                  disabled={!formData.clientId}
                >
                  <option value="">Select Invoice (Optional)</option>
                  {filteredInvoices.map((i: any) => (
                    <option key={i.id} value={i.id}>{i.invoiceNo} - Bal: LKR {i.balanceDue.toLocaleString()}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide ml-1">Reference / Notes</label>
                <textarea 
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 bg-white border border-slate-100 rounded-md text-xs font-bold focus:ring-1 focus:ring-blue-600/50 focus:border-blue-600 transition-all outline-none min-h-[140px] resize-none"
                  placeholder="e.g. Bank slip reference, Cheque number, Bank name..."
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 bg-slate-50 border-t border-slate-200 flex gap-3">
          <button 
            onClick={onClose} 
            className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-md text-[10px] font-bold uppercase tracking-wide hover:bg-slate-100 transition-all shadow-sm"
          >
            Cancel
          </button>
          <button 
            onClick={() => onSave({ 
              ...formData, 
              id: editingPayment?.id || crypto.randomUUID(),
              status: formData.status || 'Completed',
              createdAt: editingPayment?.createdAt || new Date().toISOString(),
              updatedAt: new Date().toISOString()
            })}
            disabled={!formData.clientId || !formData.amount}
            className="flex-1 py-2.5 bg-blue-600 text-white rounded-md text-[10px] font-bold uppercase tracking-wide hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {editingPayment ? 'Update Payment' : 'Save Payment'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const AdjustmentModal = ({ clients, projects, invoices, onClose, onSave, editingAdjustment }: any) => {
  const [formData, setFormData] = useState<Partial<Adjustment>>(editingAdjustment || {
    adjustmentNo: `ADJ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    date: new Date().toISOString().split('T')[0],
    type: 'Credit Note',
    amount: 0,
    clientId: '',
    clientName: '',
    reason: ''
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const filteredInvoices = invoices.filter((i: any) => i.client?.id === formData.clientId);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = (event.target?.result as string).split(',')[1];
        const extracted = await analyzeEvidence(base64, file.type);
        
        // Try to find matching client
        let matchedClientId = formData.clientId;
        let matchedClientName = formData.clientName;
        if (extracted.customerName) {
          const client = clients.find((c: any) => 
            c.name.toLowerCase().includes(extracted.customerName!.toLowerCase()) ||
            extracted.customerName!.toLowerCase().includes(c.name.toLowerCase())
          );
          if (client) {
            matchedClientId = client.id;
            matchedClientName = client.name;
          }
        }

        // Try to find matching invoice
        let matchedInvoiceId = formData.invoiceId;
        let matchedInvoiceNo = formData.invoiceNo;

        if (extracted.invoiceNo) {
          const inv = invoices.find((i: any) => 
            i.invoiceNo.toLowerCase().includes(extracted.invoiceNo!.toLowerCase()) ||
            extracted.invoiceNo!.toLowerCase().includes(i.invoiceNo.toLowerCase())
          );
          if (inv) {
            matchedInvoiceId = inv.id;
            matchedInvoiceNo = inv.invoiceNo;
            matchedClientId = inv.client.id;
            matchedClientName = inv.client.name;
          }
        }

        // Update form with extracted data
        setFormData(prev => ({
          ...prev,
          date: extracted.date || prev.date,
          amount: extracted.amount || prev.amount,
          clientId: matchedClientId,
          clientName: matchedClientName,
          invoiceId: matchedInvoiceId,
          invoiceNo: matchedInvoiceNo,
          reason: (prev.reason || '') + (extracted.reference ? ` Ref: ${extracted.reference}` : ''),
          evidence: {
            id: crypto.randomUUID(),
            url: URL.createObjectURL(file),
            name: file.name,
            type: file.type,
            extractedData: extracted
          }
        }));
        setIsAnalyzing(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error processing file:", error);
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-lg w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-200"
      >
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{editingAdjustment ? 'Edit Adjustment' : 'New Adjustment'}</h2>
            <p className="text-xs text-slate-500 font-medium">{editingAdjustment ? 'Update adjustment details' : 'Record a credit note, write-off or discount'}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-md transition-colors text-slate-400">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-6 overflow-y-auto max-h-[75vh]">
          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide ml-1">Upload Evidence (Credit Note / Memo)</label>
            <div className="relative">
              <input 
                type="file" 
                accept="image/*,application/pdf"
                onChange={handleFileUpload}
                className="hidden"
                id="adjustment-evidence-upload"
              />
              <label 
                htmlFor="adjustment-evidence-upload"
                className={cn(
                  "w-full flex flex-col items-center justify-center p-6 border border-dashed rounded-lg cursor-pointer transition-all min-h-[140px]",
                  formData.evidence ? "border-emerald-200 bg-emerald-50/50" : "border-slate-200 hover:border-blue-400 hover:bg-slate-50"
                )}
              >
                {isAnalyzing ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="animate-spin text-blue-600 mb-2" size={24} />
                    <p className="text-xs font-bold text-blue-600">Analyzing Evidence...</p>
                  </div>
                ) : formData.evidence ? (
                  <div className="flex flex-col items-center text-center px-4">
                    <div className="w-10 h-10 bg-emerald-100 rounded-md flex items-center justify-center mb-3 shadow-inner">
                      <Check className="text-emerald-600" size={20} />
                    </div>
                    <p className="text-xs font-bold text-emerald-600 truncate max-w-full">{formData.evidence.name}</p>
                    <p className="text-[9px] text-emerald-400 mt-0.5">Click to replace evidence</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 bg-slate-100 rounded-md flex items-center justify-center mb-3">
                      <Upload className="text-slate-400" size={20} />
                    </div>
                    <p className="text-xs font-bold text-slate-600">Click or drag to upload</p>
                    <p className="text-[9px] text-slate-400 mt-0.5">Supports images and PDFs</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide ml-1">Customer</label>
                <select 
                  value={formData.clientId}
                  onChange={(e) => {
                    const client = clients.find((c: any) => c.id === e.target.value);
                    setFormData({ ...formData, clientId: e.target.value, clientName: client?.name || '', projectId: '', projectName: '', invoiceId: '', invoiceNo: '' });
                  }}
                  className="w-full px-4 py-2 bg-white border border-slate-100 rounded-md text-xs font-bold focus:ring-1 focus:ring-blue-600/50 focus:border-blue-600 transition-all outline-none appearance-none"
                >
                  <option value="">Select Customer</option>
                  {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide ml-1">Project</label>
                <select 
                  value={formData.projectId}
                  onChange={(e) => {
                    const project = projects.find((p: any) => p.id === e.target.value);
                    setFormData({ ...formData, projectId: e.target.value, projectName: project?.projectName || '', invoiceId: '', invoiceNo: '' });
                  }}
                  className="w-full px-4 py-2 bg-white border border-slate-100 rounded-md text-xs font-bold focus:ring-1 focus:ring-blue-600/50 focus:border-blue-600 transition-all outline-none appearance-none disabled:opacity-50"
                  disabled={!formData.clientId}
                >
                  <option value="">Select Project (Optional)</option>
                  {projects.filter((p: any) => p.client.id === formData.clientId).map((p: any) => (
                    <option key={p.id} value={p.id}>{p.projectName}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide ml-1">Link to Invoice</label>
                <select 
                  value={formData.invoiceId}
                  onChange={(e) => {
                    const inv = invoices.find((i: any) => i.id === e.target.value);
                    setFormData({ 
                      ...formData, 
                      invoiceId: e.target.value, 
                      invoiceNo: inv?.invoiceNo,
                      projectId: inv?.projectId || formData.projectId,
                      projectName: inv?.projectName || formData.projectName,
                      amount: inv?.balanceDue || formData.amount
                    });
                  }}
                  className="w-full px-4 py-2 bg-white border border-slate-100 rounded-md text-xs font-bold focus:ring-1 focus:ring-blue-600/50 focus:border-blue-600 transition-all outline-none appearance-none disabled:opacity-50"
                  disabled={!formData.clientId}
                >
                  <option value="">Select Invoice (Optional)</option>
                  {filteredInvoices.map((i: any) => (
                    <option key={i.id} value={i.id}>{i.invoiceNo} - Bal: LKR {i.balanceDue.toLocaleString()}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide ml-1">Type</label>
                <select 
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full px-4 py-2 bg-white border border-slate-100 rounded-md text-xs font-bold focus:ring-1 focus:ring-blue-600/50 focus:border-blue-600 transition-all outline-none appearance-none"
                >
                  <option value="Credit Note">Credit Note</option>
                  <option value="Write-off">Write-off</option>
                  <option value="Discount">Discount</option>
                  <option value="Retention Release">Retention Release</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide ml-1">Date</label>
                  <input 
                    type="date" 
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-2 bg-white border border-slate-100 rounded-md text-xs font-bold focus:ring-1 focus:ring-blue-600/50 focus:border-blue-600 transition-all outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide ml-1">Amount (LKR)</label>
                  <input 
                    type="number" 
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 bg-white border border-slate-100 rounded-md text-xs font-bold focus:ring-1 focus:ring-blue-600/50 focus:border-blue-600 transition-all outline-none"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide ml-1">Reason / Notes</label>
                <textarea 
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full px-4 py-2 bg-white border border-slate-100 rounded-md text-xs font-bold focus:ring-1 focus:ring-blue-600/50 focus:border-blue-600 transition-all outline-none min-h-[140px] resize-none"
                  placeholder="Reason for adjustment..."
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 bg-slate-50 border-t border-slate-200 flex gap-3">
          <button 
            onClick={onClose} 
            className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-md text-[10px] font-bold uppercase tracking-wide hover:bg-slate-100 transition-all shadow-sm"
          >
            Cancel
          </button>
          <button 
            onClick={() => onSave({ 
              ...formData, 
              id: editingAdjustment?.id || crypto.randomUUID(),
              createdAt: editingAdjustment?.createdAt || new Date().toISOString(),
              updatedAt: new Date().toISOString()
            })}
            disabled={!formData.clientId || !formData.amount}
            className="flex-1 py-2.5 bg-blue-600 text-white rounded-md text-[10px] font-bold uppercase tracking-wide hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {editingAdjustment ? 'Update Adjustment' : 'Save Adjustment'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
