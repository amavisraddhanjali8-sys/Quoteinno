import React, { useState, useMemo } from 'react';
import { 
  CreditCard, 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  MoreVertical, 
  FileText, 
  RefreshCw, 
  Printer, 
  Download,
  Share2, 
  Tag, 
  Check, 
  Eye, 
  Package, 
  Folder, 
  X as LucideX, 
  ExternalLink, 
  Building2, 
  History, 
  DollarSign, 
  Mail, 
  ShieldCheck, 
  Send, 
  Scale 
} from 'lucide-react';
import { 
  Invoice, 
  InvoiceStatus, 
  InvoiceType, 
  Project, 
  Quote, 
  CompanySettings, 
  Client, 
  Adjustment 
} from '../types';
import { cn } from '../lib/utils';
import { InvoiceBuilder } from './InvoiceBuilder';
import { ConfirmationModal } from './ConfirmationModal';
import { InvoiceDetailView } from './InvoiceDetailView';
import { generateInvoicePDF } from '../pdfGenerator';
import { ExportActions } from './common/ExportActions';
import { exportInvoicesCSV, exportInvoicesPDF } from '../services/dataExportService';
import { centralEmailService } from '../services/centralEmailService';

interface InvoiceManagerProps {
  invoices: Invoice[];
  projects: Project[];
  quotes: Quote[];
  clients: Client[];
  adjustments: Adjustment[];
  settings: CompanySettings;
  onUpdateInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
  onSaveInvoice: (invoice: Invoice) => void;
  onDeleteInvoice: (id: string) => void;
  onUpdateSettings: React.Dispatch<React.SetStateAction<CompanySettings>>;
  onOpenDownloadPortal: (invoice: Invoice) => void;
  onSaveClient: (client: Client) => Client;
  onAddPayment?: (payment: any) => void;
  onAddNotification?: (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error') => void;
  onNavigateToAccounting?: (tab: 'overview' | 'payments' | 'adjustments' | 'ledgers' | 'reports', invoiceId?: string) => void;
  projectIdFilter?: string | null;
  onOpenCatalog?: (context?: 'invoice') => void;
  onNavigateToProject?: (projectId: string, tab?: string) => void;
  onNavigateToQuote?: (quoteId: string) => void;
  onNavigateToVariationManager?: (projectId?: string) => void;
  onNavigateToFinance?: () => void;
  onNavigateToCustomerPortal?: (client: Client) => void;
  onNavigateToVerification?: (invoiceNo: string) => void;
}

export const InvoiceManager: React.FC<InvoiceManagerProps> = ({
  invoices,
  projects,
  quotes,
  clients,
  adjustments,
  settings,
  onUpdateInvoices,
  onSaveInvoice,
  onDeleteInvoice,
  onUpdateSettings: _onUpdateSettings,
  onOpenDownloadPortal,
  onSaveClient,
  onAddPayment,
  onAddNotification,
  onNavigateToAccounting,
  projectIdFilter,
  onOpenCatalog,
  onNavigateToProject,
  onNavigateToQuote,
  onNavigateToVariationManager,
  onNavigateToFinance,
  onNavigateToCustomerPortal,
  onNavigateToVerification
}) => {
  // Navigation Sub-tab
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'project_billing' | 'variations' | 'aging'>('all');

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'All'>('All');
  const [typeFilter, setTypeFilter] = useState<InvoiceType | 'All'>('All');
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>(projectIdFilter || 'All');
  
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);
  const [selectedInvoiceForDetail, setSelectedInvoiceForDetail] = useState<Invoice | null>(null);

  // Quick Payment Modal State
  const [paymentModalInvoice, setPaymentModalInvoice] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'Bank Transfer' | 'Cheque' | 'Cash' | 'Other'>('Bank Transfer');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Quick Email Modal State
  const [emailModalInvoice, setEmailModalInvoice] = useState<Invoice | null>(null);
  const [emailRecipient, setEmailRecipient] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  React.useEffect(() => {
    if (projectIdFilter) {
      setSelectedProjectFilter(projectIdFilter);
    }
  }, [projectIdFilter]);

  const handlePrint = async (invoice: Invoice) => {
    try {
      await generateInvoicePDF(invoice, settings, false);
      onAddNotification?.('Success', 'Invoice PDF generated successfully', 'success');
    } catch (error) {
      console.error('PDF generation failed:', error);
      onAddNotification?.('Error', 'Failed to generate invoice PDF', 'error');
    }
  };

  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice => {
      const proj = projects.find(p => p.id === invoice.projectId || (p.projectCode && invoice.projectId === p.projectCode));
      const pCode = proj?.projectCode || invoice.projectId || '';
      const pName = proj?.projectName || '';
      const matchedQuote = quotes.find(q => q.id === invoice.quoteId || (invoice.projectId && q.projectId === invoice.projectId));
      const qNo = matchedQuote?.quoteNo || '';
      const q = searchQuery.toLowerCase().trim();

      const matchesSearch = !q ||
        invoice.invoiceNo.toLowerCase().includes(q) ||
        invoice.client.name.toLowerCase().includes(q) ||
        pCode.toLowerCase().includes(q) ||
        qNo.toLowerCase().includes(q) ||
        pName.toLowerCase().includes(q);
      
      const matchesStatus = statusFilter === 'All' || invoice.status === statusFilter;
      const matchesType = typeFilter === 'All' || invoice.type === typeFilter;
      const matchesProject = selectedProjectFilter === 'All' || invoice.projectId === selectedProjectFilter || pCode === selectedProjectFilter;
      
      return matchesSearch && matchesStatus && matchesType && matchesProject;
    });
  }, [invoices, searchQuery, statusFilter, typeFilter, projects, selectedProjectFilter, quotes]);

  const handleDeleteInvoice = (id: string) => {
    setInvoiceToDelete(id);
  };

  const confirmDeleteInvoice = () => {
    if (invoiceToDelete) {
      onDeleteInvoice(invoiceToDelete);
      setInvoiceToDelete(null);
    }
  };

  const handleUpdateStatus = (id: string, status: InvoiceStatus) => {
    const invoice = invoices.find(i => i.id === id);
    if (!invoice) return;

    if (status === InvoiceStatus.COLLECTED_PAYMENT && onAddPayment) {
      const remainingToPay = invoice.grandTotal - (invoice.amountPaid || 0) - (invoice.amountAdjusted || 0);
      if (remainingToPay > 0) {
        onAddPayment({
          id: crypto.randomUUID(),
          clientId: invoice.client.id,
          clientName: invoice.client.name,
          invoiceId: invoice.id,
          invoiceNo: invoice.invoiceNo,
          projectId: invoice.projectId,
          projectName: invoice.projectName,
          amount: remainingToPay,
          date: new Date().toISOString().split('T')[0],
          method: 'Bank Transfer',
          reference: `Settlement on status change to Paid`,
          status: 'Completed',
          paymentNo: `PAY-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      } else {
        onUpdateInvoices(prev => prev.map(i => i.id === id ? { ...i, status } : i));
      }
    } else {
      onUpdateInvoices(prev => prev.map(i => i.id === id ? { ...i, status } : i));
    }

    onAddNotification?.(
      'Invoice Status Updated',
      `Invoice ${invoice.invoiceNo} status changed to ${status}.`,
      'info'
    );
  };

  // Quick Payment Recording
  const openPaymentModal = (inv: Invoice) => {
    setPaymentModalInvoice(inv);
    setPaymentAmount(inv.balanceDue > 0 ? inv.balanceDue : inv.grandTotal);
    setPaymentReference(`PMT-${inv.invoiceNo}`);
    setPaymentNotes(`Payment settlement for invoice ${inv.invoiceNo}`);
  };

  const submitQuickPayment = () => {
    if (!paymentModalInvoice || paymentAmount <= 0) return;

    const newAmountPaid = (paymentModalInvoice.amountPaid || 0) + paymentAmount;
    const newBalanceDue = Math.max(0, paymentModalInvoice.grandTotal - newAmountPaid - (paymentModalInvoice.amountAdjusted || 0));
    const newStatus = newBalanceDue === 0 ? InvoiceStatus.COLLECTED_PAYMENT : InvoiceStatus.PARTIAL;

    if (onAddPayment) {
      onAddPayment({
        id: crypto.randomUUID(),
        clientId: paymentModalInvoice.client.id,
        clientName: paymentModalInvoice.client.name,
        invoiceId: paymentModalInvoice.id,
        invoiceNo: paymentModalInvoice.invoiceNo,
        projectId: paymentModalInvoice.projectId,
        projectName: paymentModalInvoice.projectName,
        amount: paymentAmount,
        date: new Date().toISOString().split('T')[0],
        method: paymentMethod,
        reference: paymentReference,
        status: 'Completed',
        paymentNo: `PAY-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
        notes: paymentNotes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    // Update invoice record
    const updatedInvoice: Invoice = {
      ...paymentModalInvoice,
      amountPaid: newAmountPaid,
      balanceDue: newBalanceDue,
      status: newStatus,
      updatedAt: new Date().toISOString()
    };

    onSaveInvoice(updatedInvoice);
    setPaymentModalInvoice(null);
    onAddNotification?.(
      'Payment Recorded',
      `Recorded payment of LKR ${paymentAmount.toLocaleString()} for Invoice ${updatedInvoice.invoiceNo}`,
      'success'
    );
  };

  // Dispatch Email
  const openEmailModal = (inv: Invoice) => {
    setEmailModalInvoice(inv);
    setEmailRecipient(inv.client?.email || '');
  };

  const dispatchInvoiceEmail = async () => {
    if (!emailModalInvoice || !emailRecipient) return;
    setIsSendingEmail(true);
    try {
      await centralEmailService.triggerEvent({
        eventType: 'INVOICE_ISSUED',
        targetEmails: [emailRecipient],
        triggeringPortal: 'Commercial Invoicing & Accounts Receivable',
        triggeringAction: 'Dispatch Invoice Email',
        recordId: emailModalInvoice.id,
        variables: {
          invoice_no: emailModalInvoice.invoiceNo,
          client_name: emailModalInvoice.client?.name || '',
          grand_total: `LKR ${(emailModalInvoice.grandTotal || 0).toLocaleString()}`,
          due_date: emailModalInvoice.dueDate || '',
          project_name: emailModalInvoice.projectName || 'Commercial Contract Works',
          status: emailModalInvoice.status || 'Sent'
        }
      });
      onAddNotification?.('Email Sent', `Dispatched invoice notification to ${emailRecipient}`, 'success');
      setEmailModalInvoice(null);
    } catch (e) {
      console.error('Email failed:', e);
      onAddNotification?.('Error', 'Failed to dispatch email.', 'error');
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Generate recurring invoices
  const generateRecurringInvoices = () => {
    const today = new Date().toISOString().split('T')[0];
    const recurringInvoices = invoices.filter(i => 
      i.type === InvoiceType.RECURRING && 
      i.recurringConfig?.isActive && 
      i.recurringConfig?.nextDate && 
      i.recurringConfig.nextDate <= today
    );

    if (recurringInvoices.length === 0) {
      onAddNotification?.('No Invoices Due', 'There are no recurring invoices due for generation today.', 'info');
      return;
    }

    const newInvoices: Invoice[] = [];
    const updatedInvoices = invoices.map(inv => {
      if (recurringInvoices.find(ri => ri.id === inv.id)) {
        const nextInvoiceNo = `${settings.invoiceNumberPrefix || 'INV-'}${new Date().getFullYear()}-${(invoices.length + newInvoices.length + 1).toString().padStart(4, '0')}`;
        const newInvoice: Invoice = {
          ...inv,
          id: crypto.randomUUID(),
          invoiceNo: nextInvoiceNo,
          date: today,
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: InvoiceStatus.SENT,
          amountPaid: 0,
          balanceDue: inv.grandTotal,
          type: InvoiceType.STANDARD,
          recurringConfig: undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        newInvoices.push(newInvoice);

        const config = inv.recurringConfig!;
        const nextDate = new Date(config.nextDate!);
        if (config.frequency === 'Monthly') nextDate.setMonth(nextDate.getMonth() + (config.interval || 1));
        else if (config.frequency === 'Weekly') nextDate.setDate(nextDate.getDate() + (config.interval || 1) * 7);
        else if (config.frequency === 'Yearly') nextDate.setFullYear(nextDate.getFullYear() + (config.interval || 1));

        return {
          ...inv,
          recurringConfig: {
            ...config,
            nextDate: nextDate.toISOString().split('T')[0]
          }
        };
      }
      return inv;
    });

    onUpdateInvoices([...updatedInvoices, ...newInvoices]);
    onAddNotification?.('Invoices Generated', `Successfully generated ${newInvoices.length} recurring invoices.`, 'success');
  };

  const getStatusColor = (status: InvoiceStatus) => {
    switch (status) {
      case InvoiceStatus.COLLECTED_PAYMENT: 
      case InvoiceStatus.PAID: 
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case InvoiceStatus.SENT: 
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case InvoiceStatus.PARTIAL: 
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case InvoiceStatus.OVERDUE: 
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case InvoiceStatus.CANCELLED: 
        return 'bg-slate-100 text-slate-600 border-slate-200';
      default: 
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getTypeColor = (type: InvoiceType) => {
    switch (type) {
      case InvoiceType.STANDARD: return 'bg-slate-100 text-slate-700 border-slate-200';
      case InvoiceType.PROFORMA: return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case InvoiceType.PROGRESS_BILLING: return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case InvoiceType.STAGE_BILLING: return 'bg-sky-50 text-sky-700 border-sky-200';
      case InvoiceType.RETENTION_CLAIM: return 'bg-amber-50 text-amber-700 border-amber-200';
      case InvoiceType.ADVANCE: return 'bg-violet-50 text-violet-700 border-violet-200';
      case InvoiceType.FINAL: return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case InvoiceType.RECURRING: return 'bg-orange-50 text-orange-700 border-orange-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  // KPIs
  const totalInvoicedSum = useMemo(() => invoices.reduce((sum, i) => sum + (i.grandTotal || 0), 0), [invoices]);
  const totalCollectedSum = useMemo(() => invoices.reduce((sum, i) => sum + (i.amountPaid || 0), 0), [invoices]);
  const totalBalanceDue = useMemo(() => invoices.reduce((sum, i) => sum + (i.balanceDue || 0), 0), [invoices]);
  const overdueTotal = useMemo(() => {
    return invoices.filter(i => i.status === InvoiceStatus.OVERDUE).reduce((sum, i) => sum + (i.balanceDue || 0), 0);
  }, [invoices]);
  const retentionWithheldTotal = useMemo(() => {
    return invoices.reduce((sum, i) => sum + (i.retentionAmount || 0), 0);
  }, [invoices]);

  // Project Billing Aggregates for Sub-tab 2
  const projectBillingData = useMemo(() => {
    return projects.map(proj => {
      const projInvoices = invoices.filter(i => (i.projectId === proj.id || i.projectId === proj.projectCode) && i.status !== InvoiceStatus.CANCELLED);
      const contractSum = proj.grandTotal || proj.totalValue || 0;
      const billedToDate = projInvoices.reduce((sum, i) => sum + (i.grandTotal || 0), 0);
      const collectedToDate = projInvoices.reduce((sum, i) => sum + (i.amountPaid || 0), 0);
      const retentionHeld = projInvoices.reduce((sum, i) => sum + (i.retentionAmount || 0), 0);
      const unbilledBalance = Math.max(0, contractSum - billedToDate);
      const pctBilled = contractSum > 0 ? (billedToDate / contractSum) * 100 : 0;

      return {
        project: proj,
        contractSum,
        billedToDate,
        collectedToDate,
        retentionHeld,
        unbilledBalance,
        pctBilled,
        invoiceCount: projInvoices.length,
        invoices: projInvoices
      };
    });
  }, [projects, invoices]);

  // Variation Claims Aggregates for Sub-tab 3
  const variationClaimsData = useMemo(() => {
    const list: {
      id: string;
      project: Project;
      variationItem: any;
      type: 'Additional' | 'Omitted';
      amount: number;
      isInvoiced: boolean;
      invoiceNo?: string;
    }[] = [];

    projects.forEach(p => {
      (p.items || []).forEach(item => {
        if (item.variationStatus === 'Additional' || item.variationStatus === 'Omitted') {
          // Check if any invoice contains this item pvcCode or name
          const matchedInvoice = invoices.find(inv => 
            (inv.projectId === p.id || inv.projectId === p.projectCode) &&
            (inv.items || []).some(invItem => invItem.pvcCode === item.pvcCode || invItem.description?.includes(item.name))
          );

          list.push({
            id: item.id,
            project: p,
            variationItem: item,
            type: item.variationStatus as any,
            amount: item.amount || (item.qty * item.rate),
            isInvoiced: !!matchedInvoice,
            invoiceNo: matchedInvoice?.invoiceNo
          });
        }
      });
    });

    return list;
  }, [projects, invoices]);

  if (selectedInvoiceForDetail) {
    return (
      <div className="p-2 sm:p-4">
        <InvoiceDetailView
          invoice={selectedInvoiceForDetail}
          settings={settings}
          onBack={() => setSelectedInvoiceForDetail(null)}
          onEdit={(inv) => {
            setEditingInvoice(inv);
            setIsBuilderOpen(true);
          }}
          onPrint={handlePrint}
          onClone={(inv) => {
            const cloned: Invoice = {
              ...inv,
              id: crypto.randomUUID(),
              invoiceNo: `${settings.invoiceNumberPrefix || 'INV-'}${Date.now().toString().slice(-4)}`,
              date: new Date().toISOString().split('T')[0],
              status: InvoiceStatus.DRAFT,
              amountPaid: 0,
              balanceDue: inv.grandTotal
            };
            onSaveInvoice(cloned);
            setSelectedInvoiceForDetail(cloned);
            onAddNotification?.('Invoice Cloned', `Cloned invoice ${inv.invoiceNo} to ${cloned.invoiceNo}`, 'success');
          }}
          onNavigateToProject={onNavigateToProject}
          onNavigateToQuote={onNavigateToQuote}
          onNavigateToVariationManager={onNavigateToVariationManager}
          onNavigateToAccounting={onNavigateToAccounting}
          onNavigateToCustomerPortal={onNavigateToCustomerPortal}
          onNavigateToVerification={onNavigateToVerification}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-8 animate-in fade-in duration-300">
      {/* 1. Header - Clean Executive Command Ribbon */}
      <header className="bg-white border border-slate-200/90 px-5 py-3 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <CreditCard size={18} />
          </div>
          <div className="flex items-baseline gap-2 min-w-0 flex-wrap">
            <h1 className="text-sm font-bold text-slate-900 whitespace-nowrap">
              Commercial Invoicing &amp; Billing Center
            </h1>
            <span className="text-xs text-slate-500 font-normal truncate hidden sm:inline">
              • Contracts, progress claims, variations &amp; accounts receivable ({invoices.length} invoices)
            </span>
          </div>
        </div>

        {/* Global Toolbar */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <ExportActions 
            onExportCSV={() => exportInvoicesCSV(filteredInvoices)}
            onExportPDF={() => exportInvoicesPDF(filteredInvoices)}
            labelCSV="CSV"
            labelPDF="PDF"
          />

          <button 
            type="button"
            onClick={generateRecurringInvoices}
            className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-2xs"
            title="Scan and run recurring billing cycles"
          >
            <RefreshCw size={13} />
            <span className="hidden sm:inline">Recurring</span>
          </button>
          
          {onOpenCatalog && (
            <button 
              type="button"
              onClick={() => onOpenCatalog('invoice')}
              className="inline-flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-2xs"
              title="Open Master Product Catalog"
            >
              <Package size={13} className="text-indigo-600" />
              <span className="hidden sm:inline">Item Catalog</span>
            </button>
          )}

          {onNavigateToFinance && (
            <button 
              type="button"
              onClick={onNavigateToFinance}
              className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-2xs"
              title="Open Operational Finance & Cost Control Portal"
            >
              <DollarSign size={13} className="text-emerald-600" />
              <span className="hidden sm:inline">Finance Portal</span>
            </button>
          )}

          <button 
            type="button"
            onClick={() => {
              setEditingInvoice(null);
              setIsBuilderOpen(true);
            }}
            className="inline-flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs"
          >
            <Plus size={14} />
            <span>New Invoice</span>
          </button>
        </div>
      </header>

      {/* 2. Executive Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Card 1: Total Invoiced */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-500">Total Invoiced</span>
            <div className="w-6 h-6 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center">
              <FileText size={13} />
            </div>
          </div>
          <div className="text-lg font-bold font-mono text-slate-900">
            LKR {totalInvoicedSum.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {invoices.length} Invoices issued across projects
          </div>
        </div>

        {/* Card 2: Total Collected */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-500">Total Collected</span>
            <div className="w-6 h-6 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
              <CheckCircle size={13} />
            </div>
          </div>
          <div className="text-lg font-bold font-mono text-emerald-600">
            LKR {totalCollectedSum.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {totalInvoicedSum > 0 ? ((totalCollectedSum / totalInvoicedSum) * 100).toFixed(1) : 0}% collection recovery rate
          </div>
        </div>

        {/* Card 3: Outstanding Receivables */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-500">Accounts Receivable</span>
            <div className="w-6 h-6 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
              <Clock size={13} />
            </div>
          </div>
          <div className="text-lg font-bold font-mono text-amber-600">
            LKR {totalBalanceDue.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {invoices.filter(i => i.balanceDue > 0).length} Invoices pending balance
          </div>
        </div>

        {/* Card 4: Overdue Alert */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-500">Overdue Aging</span>
            <div className="w-6 h-6 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center">
              <AlertCircle size={13} />
            </div>
          </div>
          <div className="text-lg font-bold font-mono text-rose-600">
            LKR {overdueTotal.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {invoices.filter(i => i.status === InvoiceStatus.OVERDUE).length} Invoices require follow-up
          </div>
        </div>

        {/* Card 5: Retention Held */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-500">Retention Pool</span>
            <div className="w-6 h-6 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
              <ShieldCheck size={13} />
            </div>
          </div>
          <div className="text-lg font-bold font-mono text-blue-600">
            LKR {retentionWithheldTotal.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Held under warranty & defects period
          </div>
        </div>
      </div>

      {/* 3. Navigation Sub-Tabs */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-1 flex items-center gap-1 shadow-2xs overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveSubTab('all')}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap",
            activeSubTab === 'all'
              ? "bg-orange-500 text-white shadow-2xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          )}
        >
          <FileText size={14} />
          <span>All Invoices Registry</span>
          <span className={cn(
            "text-[10px] px-1.5 py-0.2 rounded-full",
            activeSubTab === 'all' ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
          )}>
            {invoices.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('project_billing')}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap",
            activeSubTab === 'project_billing'
              ? "bg-orange-500 text-white shadow-2xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          )}
        >
          <Building2 size={14} />
          <span>Project Billing &amp; Progress Claims</span>
          <span className={cn(
            "text-[10px] px-1.5 py-0.2 rounded-full",
            activeSubTab === 'project_billing' ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
          )}>
            {projects.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('variations')}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap",
            activeSubTab === 'variations'
              ? "bg-orange-500 text-white shadow-2xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          )}
        >
          <History size={14} />
          <span>Variation Claims &amp; VOs</span>
          <span className={cn(
            "text-[10px] px-1.5 py-0.2 rounded-full",
            activeSubTab === 'variations' ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
          )}>
            {variationClaimsData.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('aging')}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap",
            activeSubTab === 'aging'
              ? "bg-orange-500 text-white shadow-2xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          )}
        >
          <Scale size={14} />
          <span>AR &amp; Payment Aging</span>
          <span className={cn(
            "text-[10px] px-1.5 py-0.2 rounded-full",
            activeSubTab === 'aging' ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
          )}>
            {invoices.filter(i => i.balanceDue > 0).length}
          </span>
        </button>
      </div>

      {/* 4. Tab 1: All Invoices Master Registry */}
      {activeSubTab === 'all' && (
        <div className="space-y-3">
          {/* Filters Bar */}
          <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row gap-2.5 items-center justify-between">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text"
                placeholder="Search by Invoice # (PK), Project Code (FK), Quotation # (FK), Client Name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-orange-500 text-xs"
              />
            </div>
            
            <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
              {/* Status Filter */}
              <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
                <Filter size={12} className="text-slate-400" />
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="bg-transparent border-none text-xs font-semibold text-slate-700 outline-none"
                >
                  <option value="All">All Statuses</option>
                  {Object.values(InvoiceStatus).map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              {/* Type Filter */}
              <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
                <Tag size={12} className="text-slate-400" />
                <select 
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as any)}
                  className="bg-transparent border-none text-xs font-semibold text-slate-700 outline-none"
                >
                  <option value="All">All Types</option>
                  {Object.values(InvoiceType).map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Project Filter */}
              <div className="flex items-center gap-1.5 bg-orange-50/70 px-2.5 py-1.5 rounded-lg border border-orange-200">
                <Folder size={12} className="text-orange-500" />
                <select 
                  value={selectedProjectFilter}
                  onChange={(e) => setSelectedProjectFilter(e.target.value)}
                  className="bg-transparent border-none text-xs font-bold text-orange-900 outline-none max-w-[180px] truncate"
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
          </div>

          {/* Master Table */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-600 uppercase tracking-wider select-none whitespace-nowrap">
                    <th className="py-2.5 px-3">Invoice # (PK)</th>
                    <th className="py-2.5 px-3">Project Code (FK)</th>
                    <th className="py-2.5 px-3">Quotation # (FK)</th>
                    <th className="py-2.5 px-3">Client Account</th>
                    <th className="py-2.5 px-3">Project / Description</th>
                    <th className="py-2.5 px-3">Issue Date</th>
                    <th className="py-2.5 px-3">Due Date</th>
                    <th className="py-2.5 px-3 text-center">Type</th>
                    <th className="py-2.5 px-3 text-right">Grand Total</th>
                    <th className="py-2.5 px-3 text-right">Balance Due</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInvoices.length > 0 ? (
                    filteredInvoices.map((invoice) => {
                      const proj = projects.find(p => p.id === invoice.projectId || (p.projectCode && invoice.projectId === p.projectCode));
                      const pCode = proj?.projectCode || (invoice.projectId ? invoice.projectId.slice(0, 10) : null);
                      const matchedQuote = quotes.find(q => q.id === invoice.quoteId || (invoice.projectId && q.projectId === invoice.projectId));
                      const qNo = matchedQuote?.quoteNo || (invoice.quoteId ? invoice.quoteId.slice(0, 10) : null);

                      return (
                        <tr key={invoice.id} className="hover:bg-slate-50/70 transition-colors whitespace-nowrap group">
                          {/* Invoice No (PK) */}
                          <td className="py-2.5 px-3">
                            <button
                              type="button"
                              onClick={() => setSelectedInvoiceForDetail(invoice)}
                              className="font-mono font-bold text-xs text-slate-900 bg-slate-100 hover:bg-orange-50 hover:text-orange-600 px-2 py-0.5 rounded border border-slate-200 transition-colors inline-flex items-center gap-1 shadow-2xs"
                              title="Click to view full invoice breakdown"
                            >
                              <FileText size={12} className="text-orange-500" />
                              <span>{invoice.invoiceNo}</span>
                            </button>
                          </td>

                          {/* Project Code (FK) */}
                          <td className="py-2.5 px-3">
                            {pCode ? (
                              <button
                                type="button"
                                onClick={() => {
                                  if (onNavigateToProject && proj) {
                                    onNavigateToProject(proj.id, 'variations');
                                  } else {
                                    setSelectedProjectFilter(proj?.id || invoice.projectId!);
                                  }
                                }}
                                className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-orange-700 bg-orange-50 hover:bg-orange-100 px-2 py-0.5 rounded border border-orange-200 transition-colors shadow-2xs"
                                title={`Linked Project: ${pCode} (Click to open)`}
                              >
                                <Folder size={11} className="text-orange-500" />
                                <span>{pCode}</span>
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">Direct Billing</span>
                            )}
                          </td>

                          {/* Quotation No (FK) */}
                          <td className="py-2.5 px-3">
                            {qNo ? (
                              <button
                                type="button"
                                onClick={() => {
                                  if (onNavigateToQuote && matchedQuote) {
                                    onNavigateToQuote(matchedQuote.id);
                                  }
                                }}
                                className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded border border-blue-200 transition-colors shadow-2xs"
                                title={`Linked Quote: ${qNo} (Click to open)`}
                              >
                                <span>{qNo}</span>
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">None</span>
                            )}
                          </td>

                          {/* Client Account */}
                          <td className="py-2.5 px-3 max-w-[150px]">
                            <button
                              type="button"
                              onClick={() => {
                                if (onNavigateToCustomerPortal && invoice.client) {
                                  onNavigateToCustomerPortal(invoice.client);
                                }
                              }}
                              className="font-semibold text-slate-900 truncate block hover:text-orange-600 transition-colors text-left"
                              title={invoice.client?.name}
                            >
                              {invoice.client?.name || 'General Client'}
                            </button>
                          </td>

                          {/* Project Name */}
                          <td className="py-2.5 px-3 max-w-[180px]">
                            <span className="text-slate-700 font-medium truncate block" title={proj?.projectName || invoice.projectName}>
                              {proj?.projectName || invoice.projectName || 'Commercial Works'}
                            </span>
                          </td>

                          {/* Dates */}
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">{invoice.date}</td>
                          <td className="py-2.5 px-3 font-mono text-[11px]">
                            <span className={invoice.status === InvoiceStatus.OVERDUE ? "text-rose-600 font-bold" : "text-slate-700"}>
                              {invoice.dueDate}
                            </span>
                          </td>

                          {/* Type */}
                          <td className="py-2.5 px-3 text-center">
                            <span className={cn(
                              "text-[10px] font-semibold px-2 py-0.5 rounded border inline-block",
                              getTypeColor(invoice.type)
                            )}>
                              {invoice.type}
                            </span>
                          </td>

                          {/* Grand Total */}
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                            LKR {Number(invoice.grandTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>

                          {/* Balance Due */}
                          <td className="py-2.5 px-3 text-right font-mono text-[11px]">
                            {(invoice.balanceDue || 0) > 0 ? (
                              <span className="text-amber-600 font-bold">
                                LKR {Number(invoice.balanceDue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            ) : (
                              <span className="text-emerald-600 font-bold">Settled</span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-2.5 px-3 text-center">
                            <span className={cn(
                              "px-2 py-0.5 rounded text-[10px] font-bold border inline-block",
                              getStatusColor(invoice.status)
                            )}>
                              {invoice.status}
                            </span>
                          </td>

                          {/* Actions Toolbar */}
                          <td className="py-2.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {/* View Detail */}
                              <button 
                                type="button"
                                onClick={() => setSelectedInvoiceForDetail(invoice)}
                                className="p-1 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                title="View Details"
                              >
                                <Eye size={13} />
                              </button>

                              {/* Record Payment */}
                              {(invoice.balanceDue || 0) > 0 && (
                                <button 
                                  type="button"
                                  onClick={() => openPaymentModal(invoice)}
                                  className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                  title="Record Payment for this invoice"
                                >
                                  <DollarSign size={13} />
                                </button>
                              )}

                              {/* Download Portal */}
                              <button 
                                type="button"
                                onClick={() => onOpenDownloadPortal(invoice)}
                                className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Download Bundle"
                              >
                                <Download size={13} />
                              </button>

                              {/* Quick Print */}
                              <button 
                                type="button"
                                onClick={() => handlePrint(invoice)}
                                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                                title="Print PDF"
                              >
                                <Printer size={13} />
                              </button>

                              {/* Edit */}
                              <button 
                                type="button"
                                onClick={() => {
                                  setEditingInvoice(invoice);
                                  setIsBuilderOpen(true);
                                }}
                                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                                title="Edit Invoice"
                              >
                                <Edit2 size={13} />
                              </button>

                              {/* Send Email */}
                              {invoice.client?.email && (
                                <button 
                                  type="button"
                                  onClick={() => openEmailModal(invoice)}
                                  className="p-1 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                                  title="Send Email to Client"
                                >
                                  <Mail size={13} />
                                </button>
                              )}

                              {/* More Dropdown Menu */}
                              <div className="relative group/menu">
                                <button type="button" className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                                  <MoreVertical size={13} />
                                </button>
                                <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-30 hidden group-hover/menu:block text-xs">
                                  <button 
                                    type="button"
                                    onClick={() => handleUpdateStatus(invoice.id, InvoiceStatus.COLLECTED_PAYMENT)}
                                    className="w-full px-3 py-1.5 text-left font-medium text-emerald-600 hover:bg-emerald-50 flex items-center gap-2"
                                  >
                                    <Check size={13} /> Mark as Settled &amp; Paid
                                  </button>
                                  <button 
                                    type="button"
                                    onClick={() => handleUpdateStatus(invoice.id, InvoiceStatus.SENT)}
                                    className="w-full px-3 py-1.5 text-left font-medium text-sky-600 hover:bg-sky-50 flex items-center gap-2"
                                  >
                                    <Share2 size={13} /> Mark as Sent
                                  </button>
                                  <button 
                                    type="button"
                                    onClick={() => handleUpdateStatus(invoice.id, InvoiceStatus.CANCELLED)}
                                    className="w-full px-3 py-1.5 text-left font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                                  >
                                    <LucideX size={13} /> Cancel Invoice
                                  </button>
                                  
                                  <div className="h-px bg-slate-100 my-1" />

                                  {/* Deep Links */}
                                  {onNavigateToAccounting && (
                                    <button 
                                      type="button"
                                      onClick={() => onNavigateToAccounting('ledgers', invoice.id)}
                                      className="w-full px-3 py-1.5 text-left font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                    >
                                      <CreditCard size={13} className="text-indigo-500" /> Go to Accounting Ledger
                                    </button>
                                  )}

                                  {proj && onNavigateToProject && (
                                    <button 
                                      type="button"
                                      onClick={() => onNavigateToProject(proj.id, 'variations')}
                                      className="w-full px-3 py-1.5 text-left font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                    >
                                      <Building2 size={13} className="text-orange-500" /> Open Project Details
                                    </button>
                                  )}

                                  {proj && onNavigateToVariationManager && (
                                    <button 
                                      type="button"
                                      onClick={() => onNavigateToVariationManager(proj.id)}
                                      className="w-full px-3 py-1.5 text-left font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                    >
                                      <History size={13} className="text-emerald-500" /> Open Variation Manager
                                    </button>
                                  )}

                                  {onNavigateToVerification && (
                                    <button 
                                      type="button"
                                      onClick={() => onNavigateToVerification(invoice.invoiceNo)}
                                      className="w-full px-3 py-1.5 text-left font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                    >
                                      <ShieldCheck size={13} className="text-teal-500" /> Verify SVC Security Seal
                                    </button>
                                  )}

                                  <div className="h-px bg-slate-100 my-1" />

                                  <button 
                                    type="button"
                                    onClick={() => handleDeleteInvoice(invoice.id)}
                                    className="w-full px-3 py-1.5 text-left font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                                  >
                                    <Trash2 size={13} /> Delete Invoice
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={12} className="py-12 text-center text-slate-400">
                        <FileText size={32} className="mx-auto mb-2 text-slate-300" />
                        <p className="font-semibold text-slate-600">No invoices found matching criteria.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. Tab 2: Project Billing & Progress Claims Tracker */}
      {activeSubTab === 'project_billing' && (
        <div className="space-y-3">
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1 flex items-center gap-2">
              <Building2 size={14} className="text-orange-500" />
              Contract Sum vs Invoiced Progress Claims
            </h3>
            <p className="text-[11px] text-slate-500 mb-4">
              Real-time synchronization between Project Master Sums, Invoiced Progress Claims, Retention Pools &amp; Unbilled Balances.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {projectBillingData.map(({ project, contractSum, billedToDate, collectedToDate, retentionHeld, unbilledBalance, pctBilled, invoiceCount }) => (
                <div key={project.id} className="p-4 bg-slate-50/70 rounded-xl border border-slate-200 space-y-3 flex flex-col justify-between hover:border-orange-300 transition-colors">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                        {project.projectCode || project.id.slice(0, 8)}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500">
                        {invoiceCount} claims issued
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{project.projectName}</h4>
                    <p className="text-[11px] text-slate-500">{project.client?.name}</p>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-semibold">
                      <span className="text-slate-500">Billed Progress</span>
                      <span className="text-orange-600 font-bold">{pctBilled.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-orange-500 rounded-full transition-all"
                        style={{ width: `${Math.min(100, pctBilled)}%` }}
                      />
                    </div>
                  </div>

                  {/* Figures */}
                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200 font-mono">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Contract Sum</span>
                      <span className="font-bold text-slate-900">LKR {contractSum.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Invoiced Claims</span>
                      <span className="font-bold text-blue-600">LKR {billedToDate.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Retention Held</span>
                      <span className="font-bold text-amber-600">LKR {retentionHeld.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Unbilled Bal</span>
                      <span className="font-bold text-emerald-600">LKR {unbilledBalance.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingInvoice({
                          id: crypto.randomUUID(),
                          invoiceNo: `${settings.invoiceNumberPrefix || 'INV-'}${Date.now().toString().slice(-4)}`,
                          type: InvoiceType.PROGRESS_BILLING,
                          status: InvoiceStatus.DRAFT,
                          date: new Date().toISOString().split('T')[0],
                          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                          projectId: project.id,
                          projectCode: project.projectCode,
                          projectName: project.projectName,
                          client: project.client,
                          quoteId: project.quoteId,
                          totalProjectValue: contractSum,
                          previouslyInvoiced: billedToDate,
                          totalProjectCollected: collectedToDate,
                          currentProgressPercent: pctBilled,
                          retentionPercent: project.retentionPercent || 5,
                          retentionAmount: 0,
                          items: [],
                          subTotal: 0,
                          discountTotal: 0,
                          taxTotal: 0,
                          grandTotal: 0,
                          amountPaid: 0,
                          balanceDue: 0,
                          createdAt: new Date().toISOString(),
                          updatedAt: new Date().toISOString()
                        } as Invoice);
                        setIsBuilderOpen(true);
                      }}
                      className="flex-1 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold text-center transition-colors shadow-2xs"
                    >
                      + Issue Progress Claim
                    </button>

                    {onNavigateToProject && (
                      <button
                        type="button"
                        onClick={() => onNavigateToProject(project.id, 'variations')}
                        className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold"
                        title="Open Project"
                      >
                        <ExternalLink size={13} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 6. Tab 3: Variation (VO) Claims & Change Orders */}
      {activeSubTab === 'variations' && (
        <div className="space-y-3">
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <History size={14} className="text-emerald-600" />
                  Project Variation Change Orders (VOs) Billing Status
                </h3>
                <p className="text-[11px] text-slate-500">
                  Track whether approved engineering variation additions and omissions have been claimed in commercial invoices.
                </p>
              </div>

              {onNavigateToVariationManager && (
                <button
                  type="button"
                  onClick={() => onNavigateToVariationManager()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold transition-colors shadow-2xs"
                >
                  <History size={13} />
                  <span>Open Variation Manager Portal</span>
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-2 px-3">Project</th>
                    <th className="py-2 px-3">Variation Item Name</th>
                    <th className="py-2 px-3 text-center">Type</th>
                    <th className="py-2 px-3 text-right">Value (LKR)</th>
                    <th className="py-2 px-3 text-center">Billing State</th>
                    <th className="py-2 px-3 text-center">Invoice Ref</th>
                    <th className="py-2 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {variationClaimsData.length > 0 ? (
                    variationClaimsData.map((vo) => (
                      <tr key={vo.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-slate-800 block">{vo.project.projectName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{vo.project.projectCode}</span>
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-900">{vo.variationItem.name}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold",
                            vo.type === 'Additional' ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                          )}>
                            {vo.type}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                          LKR {Number(vo.amount || 0).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold border",
                            vo.isInvoiced ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
                          )}>
                            {vo.isInvoiced ? 'Claim Invoiced' : 'Pending Claim'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-600">
                          {vo.invoiceNo || '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {!vo.isInvoiced ? (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingInvoice({
                                  id: crypto.randomUUID(),
                                  invoiceNo: `${settings.invoiceNumberPrefix || 'INV-'}${Date.now().toString().slice(-4)}`,
                                  type: InvoiceType.PROGRESS_BILLING,
                                  status: InvoiceStatus.DRAFT,
                                  date: new Date().toISOString().split('T')[0],
                                  dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                                  projectId: vo.project.id,
                                  projectCode: vo.project.projectCode,
                                  projectName: vo.project.projectName,
                                  client: vo.project.client,
                                  items: [{
                                    id: crypto.randomUUID(),
                                    pvcCode: vo.variationItem.pvcCode,
                                    description: `Variation Order (${vo.type}): ${vo.variationItem.name}`,
                                    qty: vo.variationItem.qty || 1,
                                    unit: vo.variationItem.unit || 'Nos',
                                    rate: vo.variationItem.rate || 0,
                                    taxPercent: vo.project.taxPercent || 0,
                                    discountPercent: 0,
                                    amount: vo.amount,
                                    variationStatus: vo.type
                                  }],
                                  subTotal: vo.amount,
                                  discountTotal: 0,
                                  taxTotal: 0,
                                  grandTotal: vo.amount,
                                  amountPaid: 0,
                                  balanceDue: vo.amount,
                                  createdAt: new Date().toISOString(),
                                  updatedAt: new Date().toISOString()
                                } as Invoice);
                                setIsBuilderOpen(true);
                              }}
                              className="px-2.5 py-1 bg-orange-500 hover:bg-orange-600 text-white rounded text-xs font-semibold"
                            >
                              Create VO Invoice
                            </button>
                          ) : (
                            <span className="text-[10px] text-emerald-600 font-bold">Invoiced</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No variation change orders recorded across projects.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 7. Tab 4: Accounts Receivable & Aging */}
      {activeSubTab === 'aging' && (
        <div className="space-y-3">
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Scale size={14} className="text-amber-500" />
                  Accounts Receivable Aging &amp; Collections Hub
                </h3>
                <p className="text-[11px] text-slate-500">
                  Aging brackets, customer exposure &amp; immediate settlement recording directly linked with Accounting ledgers.
                </p>
              </div>

              {onNavigateToAccounting && (
                <button
                  type="button"
                  onClick={() => onNavigateToAccounting('overview')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition-colors"
                >
                  <CreditCard size={13} />
                  <span>Open Full Accounting Portal</span>
                </button>
              )}
            </div>

            {/* Invoices with Outstanding Balance */}
            <div className="space-y-2">
              {invoices.filter(i => (i.balanceDue || 0) > 0).map(inv => (
                <div key={inv.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900">{inv.invoiceNo}</span>
                      <span className="text-slate-500">·</span>
                      <span className="font-semibold text-slate-800">{inv.client?.name}</span>
                      <span className="text-[10px] text-slate-400">({inv.projectName || 'General'})</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Due: {inv.dueDate} · Status: <span className={cn("font-bold", inv.status === InvoiceStatus.OVERDUE ? "text-rose-600" : "text-amber-600")}>{inv.status}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Balance Payable</span>
                      <span className="font-mono font-bold text-amber-600 text-sm">
                        LKR {(inv.balanceDue || 0).toLocaleString()}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => openPaymentModal(inv)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs flex items-center gap-1"
                    >
                      <DollarSign size={13} />
                      <span>Record Payment</span>
                    </button>
                  </div>
                </div>
              ))}

              {invoices.filter(i => (i.balanceDue || 0) > 0).length === 0 && (
                <div className="p-8 text-center text-slate-400">
                  <CheckCircle size={32} className="mx-auto mb-2 text-emerald-500" />
                  <p className="font-bold text-slate-700">All invoices are settled!</p>
                  <p className="text-[11px] text-slate-400">No outstanding receivables at this time.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Quick Modal */}
      {paymentModalInvoice && (
        <div className="fixed inset-0 z-[80] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <DollarSign size={16} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">Record Payment &amp; Post to Accounting</h3>
                  <span className="text-[10px] font-mono text-slate-500">Invoice #{paymentModalInvoice.invoiceNo}</span>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setPaymentModalInvoice(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <LucideX size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 gap-2 font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">Total Invoiced</span>
                  <span className="font-bold text-slate-900">LKR {(paymentModalInvoice.grandTotal || 0).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">Outstanding Due</span>
                  <span className="font-bold text-amber-600">LKR {(paymentModalInvoice.balanceDue || 0).toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700">Payment Amount (LKR)</label>
                <input 
                  type="number"
                  min="1"
                  max={paymentModalInvoice.grandTotal}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700">Payment Method</label>
                  <select 
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none"
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Cash">Cash</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700">Reference / Voucher #</label>
                  <input 
                    type="text"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-medium text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700">Notes &amp; Remarks</label>
                <input 
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPaymentModalInvoice(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitQuickPayment}
                className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs"
              >
                Confirm &amp; Record Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Email Modal */}
      {emailModalInvoice && (
        <div className="fixed inset-0 z-[80] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center">
                  <Mail size={16} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">Email Commercial Invoice to Client</h3>
                  <span className="text-[10px] font-mono text-slate-500">Invoice #{emailModalInvoice.invoiceNo}</span>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setEmailModalInvoice(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <LucideX size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700">Recipient Email Address</label>
                <input 
                  type="email"
                  value={emailRecipient}
                  onChange={(e) => setEmailRecipient(e.target.value)}
                  placeholder="client@company.com"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <p className="font-semibold text-slate-800">Dispatch Preview</p>
                <p className="text-[11px] text-slate-500">
                  A formal notification with document link and statement summary of <strong>LKR {(emailModalInvoice.grandTotal || 0).toLocaleString()}</strong> will be dispatched to <strong>{emailModalInvoice.client?.name}</strong>.
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEmailModalInvoice(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSendingEmail || !emailRecipient}
                onClick={dispatchInvoiceEmail}
                className="px-4 py-1.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-50 rounded-lg shadow-2xs flex items-center gap-1.5"
              >
                <Send size={12} />
                <span>{isSendingEmail ? 'Dispatching...' : 'Dispatch Email'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {invoiceToDelete && (
        <ConfirmationModal
          isOpen={true}
          title="Delete Invoice"
          message="Are you sure you want to delete this invoice? This will remove the invoice record from billing archives."
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={confirmDeleteInvoice}
          onClose={() => setInvoiceToDelete(null)}
          type="danger"
        />
      )}

      {/* Enhanced Invoice Builder Full Overlay */}
      {isBuilderOpen && (
        <InvoiceBuilder
          invoice={editingInvoice}
          invoices={invoices}
          projects={projects}
          quotes={quotes}
          clients={clients}
          adjustments={adjustments}
          settings={settings}
          onSave={onSaveInvoice}
          onSaveClient={onSaveClient}
          onAddPayment={onAddPayment}
          onClose={() => {
            setIsBuilderOpen(false);
            setEditingInvoice(null);
          }}
          onAddNotification={onAddNotification}
          onOpenCatalog={onOpenCatalog}
          onNavigateToProject={onNavigateToProject}
          onNavigateToQuote={onNavigateToQuote}
          onNavigateToVariationManager={onNavigateToVariationManager}
          onNavigateToAccounting={onNavigateToAccounting}
          onNavigateToCustomerPortal={onNavigateToCustomerPortal}
        />
      )}
    </div>
  );
};
