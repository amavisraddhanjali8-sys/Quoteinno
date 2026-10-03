import React, { useState, useEffect, useMemo, useRef } from 'react';
import { TermsEditor } from './TermsEditor';
import { 
  X, 
  Save, 
  Trash2, 
  Briefcase, 
  FileText, 
  Calendar, 
  CreditCard, 
  Settings, 
  Clock, 
  RefreshCw, 
  Printer, 
  Type as TypeIcon, 
  History, 
  Eye, 
  EyeOff, 
  Barcode, 
  Package, 
  ExternalLink,
  Building2,
  User,
  ShieldCheck,
  Percent,
  Plus,
  ArrowRight,
  Layers,
  Send
} from 'lucide-react';
import { 
  Invoice, 
  InvoiceItem, 
  InvoiceType, 
  InvoiceStatus, 
  Project, 
  Quote, 
  CompanySettings, 
  Client, 
  Payment, 
  Adjustment, 
  CustomerCategory
} from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import JsBarcode from 'jsbarcode';
import { generateInvoicePDF } from '../pdfGenerator';
import { LivePreview } from './LivePreview';
import { centralEmailService } from '../services/centralEmailService';

interface InvoiceBuilderProps {
  invoice: Invoice | null;
  invoices: Invoice[];
  projects: Project[];
  quotes: Quote[];
  clients: Client[];
  adjustments: Adjustment[];
  settings: CompanySettings;
  onSave: (invoice: Invoice) => void;
  onDelete?: (id: string) => void;
  onSaveClient: (client: Client) => Client;
  onAddPayment?: (payment: Payment) => void;
  onOpenDownloadPortal?: (invoice: Invoice) => void;
  onClose: () => void;
  onAddNotification?: (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error') => void;
  onOpenCatalog?: (context?: 'invoice') => void;
  onNavigateToProject?: (projectId: string, tab?: string) => void;
  onNavigateToQuote?: (quoteId: string) => void;
  onNavigateToVariationManager?: (projectId?: string) => void;
  onNavigateToAccounting?: (tab: 'overview' | 'payments' | 'adjustments' | 'ledgers' | 'reports', invoiceId?: string) => void;
  onNavigateToCustomerPortal?: (client: Client) => void;
}

export const InvoiceBuilder: React.FC<InvoiceBuilderProps> = ({
  invoice,
  invoices,
  projects,
  quotes,
  clients,
  adjustments,
  settings,
  onSave,
  onSaveClient,
  onAddPayment,
  onClose,
  onAddNotification,
  onOpenCatalog,
  onNavigateToProject,
  onNavigateToQuote,
  onNavigateToVariationManager,
  onNavigateToAccounting,
  onNavigateToCustomerPortal
}) => {
  const [formData, setFormData] = useState<Partial<Invoice>>(() => {
    return {
      id: invoice?.id || crypto.randomUUID(),
      invoiceNo: invoice?.invoiceNo || `${settings.invoiceNumberPrefix || 'INV-'}${settings.nextInvoiceNumber || Date.now().toString().slice(-4)}`,
      type: invoice?.type || InvoiceType.STANDARD,
      status: invoice?.status || InvoiceStatus.DRAFT,
      date: invoice?.date || new Date().toISOString().split('T')[0],
      dueDate: invoice?.dueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      projectId: invoice?.projectId || '',
      quoteId: invoice?.quoteId || '',
      client: invoice?.client || { 
        id: crypto.randomUUID(), 
        name: '', 
        email: '', 
        phone: '', 
        address: '', 
        category: CustomerCategory.INDIVIDUAL, 
        status: 'Active', 
        creditLimit: 0, 
        paymentTerms: 'Credit 30 Days', 
        currency: settings.defaultCurrency || 'LKR', 
        language: 'English', 
        sinceDate: new Date().toISOString().split('T')[0], 
        contactPersons: [], 
        addresses: [], 
        hasSpecialPricing: false, 
        source: 'Direct', 
        tier: 'Tier 1', 
        isCommHidden: true, 
        isTaxExempt: false 
      } as Client,
      items: invoice?.items || [],
      subTotal: invoice?.subTotal || 0,
      discountTotal: invoice?.discountTotal || 0,
      taxTotal: invoice?.taxTotal || 0,
      grandTotal: invoice?.grandTotal || 0,
      amountPaid: invoice?.amountPaid || 0,
      amountAdjusted: invoice?.amountAdjusted || 0,
      balanceDue: invoice?.balanceDue || 0,
      notes: invoice?.notes || '',
      terms: invoice?.terms || '',
      termsList: invoice?.termsList || [],
      bankDetails: invoice?.bankDetails || settings.bankDetails.find(b => b.isDefault) || settings.bankDetails[0],
      barcode: invoice?.barcode || '',
      purchaseOrderNo: invoice?.purchaseOrderNo || '',
      salesperson: invoice?.salesperson || '',
      shippingMethod: invoice?.shippingMethod || '',
      shippingTerms: invoice?.shippingTerms || '',
      paymentTerms: invoice?.paymentTerms || 'Net 30',
      deliveryDate: invoice?.deliveryDate || '',
      shippingHandling: invoice?.shippingHandling || 0,
      salesTaxRate: invoice?.salesTaxRate || 0,
      advancePercent: invoice?.advancePercent || 30,
      chequeDetails: invoice?.chequeDetails || { chequeNo: '', bank: '', date: '' },
      retentionDetails: invoice?.retentionDetails || { isRetentionInvoice: false, retentionAmount: 0, retentionPercent: 0 },
      recurringConfig: invoice?.recurringConfig || {
        frequency: 'Monthly',
        interval: 1,
        startDate: new Date().toISOString().split('T')[0],
        nextDate: new Date().toISOString().split('T')[0],
        endDate: '',
        isActive: true
      },
      documentSettings: invoice?.documentSettings || {
        fontSize: 10,
        accentColor: '#2563eb',
        showLogo: true,
        showBankDetails: true,
        showTimeline: false,
        showPaymentTiers: true,
        layoutType: 'Detailed'
      }
    };
  });

  // Source Linking Mode: 'project' | 'quote' | 'direct'
  const [sourceMode, setSourceMode] = useState<'project' | 'quote' | 'direct'>(() => {
    if (invoice?.quoteId && !invoice?.projectId) return 'quote';
    if (invoice?.projectId) return 'project';
    return 'project';
  });

  const [selectedProjectId, setSelectedProjectId] = useState(invoice?.projectId || '');
  const [selectedQuoteId, setSelectedQuoteId] = useState(invoice?.quoteId || '');
  const [showPreview, setShowPreview] = useState(true);

  // Barcode Ref
  const barcodeRef = useRef<SVGSVGElement>(null);

  // Sync Barcode
  useEffect(() => {
    if (barcodeRef.current && formData.invoiceNo) {
      try {
        JsBarcode(barcodeRef.current, formData.invoiceNo, {
          format: "CODE128",
          width: 2,
          height: 36,
          displayValue: false,
          margin: 0,
          background: "transparent"
        });
        
        const svg = barcodeRef.current;
        const xml = new XMLSerializer().serializeToString(svg);
        const svg64 = btoa(xml);
        const b64Start = 'data:image/svg+xml;base64,';
        const image64 = b64Start + svg64;
        
        if (formData.barcode !== image64) {
          setFormData(prev => ({ ...prev, barcode: image64 }));
        }
      } catch (err) {
        console.error('Barcode generation error:', err);
      }
    }
  }, [formData.invoiceNo]);

  // Filtered lists
  const filteredProjects = useMemo(() => {
    if (!formData.client?.id) return projects;
    return projects.filter(p => p.client.id === formData.client?.id);
  }, [projects, formData.client?.id]);

  const filteredQuotes = useMemo(() => {
    if (!formData.client?.id) return quotes;
    return quotes.filter(q => q.client.id === formData.client?.id);
  }, [quotes, formData.client?.id]);

  // Selected entities for quick display
  const currentProject = useMemo(() => {
    return projects.find(p => p.id === selectedProjectId || p.projectCode === selectedProjectId);
  }, [projects, selectedProjectId]);

  const currentQuote = useMemo(() => {
    return quotes.find(q => q.id === selectedQuoteId || q.quoteNo === selectedQuoteId);
  }, [quotes, selectedQuoteId]);

  // Recalculate totals helper
  const calculateTotals = (items: InvoiceItem[]) => {
    const subTotal = items.reduce((sum, item) => sum + (item.amount || 0), 0);
    const discountTotal = items.reduce((sum, item) => sum + ((item.amount || 0) * ((item.discountPercent || 0) / 100)), 0);
    
    let taxTotal = items.reduce((sum, item) => {
      const net = (item.amount || 0) - ((item.amount || 0) * ((item.discountPercent || 0) / 100));
      return sum + (net * ((item.taxPercent || 0) / 100));
    }, 0);
    
    if (formData.salesTaxRate && formData.salesTaxRate > 0) {
      taxTotal = (subTotal - discountTotal) * (formData.salesTaxRate / 100);
    }
    
    let grandTotal = subTotal - discountTotal + taxTotal + (formData.shippingHandling || 0);
    
    let retentionAmount = 0;
    if ((formData.type === InvoiceType.PROGRESS_BILLING || formData.type === InvoiceType.STAGE_BILLING) && formData.retentionPercent) {
      retentionAmount = grandTotal * (formData.retentionPercent / 100);
      grandTotal -= retentionAmount;
    }

    const balanceDue = grandTotal - (formData.amountPaid || 0) - (formData.amountAdjusted || 0);
    const projectBalanceDue = (formData.totalProjectValue || 0) - (formData.totalProjectCollected || 0) - grandTotal;

    setFormData(prev => ({
      ...prev,
      items,
      subTotal,
      discountTotal,
      taxTotal,
      grandTotal,
      retentionAmount,
      balanceDue,
      projectBalanceDue
    }));
  };

  // Re-run calculation if tax or shipping changes
  useEffect(() => {
    calculateTotals(formData.items || []);
  }, [formData.salesTaxRate, formData.shippingHandling]);

  // Handle Advance Invoice percentage change for BOTH Project and Quote!
  useEffect(() => {
    if (formData.type === InvoiceType.ADVANCE) {
      const percentage = formData.advancePercent || 30;
      
      if (sourceMode === 'quote' && selectedQuoteId) {
        const quote = quotes.find(q => q.id === selectedQuoteId || q.quoteNo === selectedQuoteId);
        if (quote) {
          const quoteTotal = quote.grandTotal || (quote.items || []).reduce((s, i) => s + (i.amount || 0), 0);
          const advanceAmount = Math.round(quoteTotal * (percentage / 100) * 100) / 100;
          
          const items: InvoiceItem[] = [{
            id: crypto.randomUUID(),
            pvcCode: quote.quoteNo,
            description: `Advance Payment (${percentage}%) for Quotation ${quote.quoteNo} - ${quote.projectName}`,
            qty: 1,
            unit: 'Nos',
            rate: advanceAmount,
            amount: advanceAmount,
            taxPercent: quote.taxPercent || 0,
            discountPercent: 0
          }];
          calculateTotals(items);
        }
      } else if (sourceMode === 'project' && selectedProjectId) {
        const project = projects.find(p => p.id === selectedProjectId || p.projectCode === selectedProjectId);
        if (project) {
          const projectTotal = project.grandTotal || project.totalValue || (project.items || []).reduce((s, i) => s + (i.amount || 0), 0);
          const advanceAmount = Math.round(projectTotal * (percentage / 100) * 100) / 100;
          
          const items: InvoiceItem[] = [{
            id: crypto.randomUUID(),
            pvcCode: project.projectCode || undefined,
            description: `Advance Payment (${percentage}%) for Project: ${project.projectName}`,
            qty: 1,
            unit: 'Nos',
            rate: advanceAmount,
            amount: advanceAmount,
            taxPercent: project.taxPercent || 0,
            discountPercent: 0
          }];
          calculateTotals(items);
        }
      }
    }
  }, [formData.advancePercent, formData.type, sourceMode, selectedProjectId, selectedQuoteId]);

  // Project Selection Handler
  const handleProjectSelect = (projId: string) => {
    setSelectedProjectId(projId);
    if (!projId) return;

    const project = projects.find(p => p.id === projId || p.projectCode === projId);
    if (!project) return;

    const projectInvoices = invoices.filter(i => (i.projectId === projId || i.projectId === project.projectCode) && i.status !== InvoiceStatus.CANCELLED);
    const totalInvoiced = projectInvoices.reduce((sum, i) => sum + (i.grandTotal || 0), 0);
    const totalCollected = projectInvoices.reduce((sum, i) => sum + (i.amountPaid || 0), 0);

    const projectVal = project.grandTotal || project.totalValue || 0;

    const updatedFormData: Partial<Invoice> = {
      ...formData,
      projectId: project.id,
      projectCode: project.projectCode,
      projectName: project.projectName,
      client: project.client,
      quoteId: project.quoteId || formData.quoteId,
      totalProjectValue: projectVal,
      previouslyInvoiced: totalInvoiced,
      totalProjectCollected: totalCollected,
      currentProgressPercent: projectVal > 0 ? (totalInvoiced / projectVal) * 100 : 0,
      retentionPercent: project.retentionPercent || formData.retentionPercent || 0,
      termsList: Array.isArray(project.terms) ? project.terms : formData.termsList,
      terms: Array.isArray(project.terms) 
        ? project.terms.filter(t => t.isActive).map(t => `${t.no} ${t.title}: ${t.content}`).join('\n\n')
        : formData.terms
    };

    setFormData(updatedFormData);

    if (formData.type === InvoiceType.ADVANCE) {
      const percentage = formData.advancePercent || 30;
      const advanceAmount = Math.round(projectVal * (percentage / 100) * 100) / 100;
      const items: InvoiceItem[] = [{
        id: crypto.randomUUID(),
        pvcCode: project.projectCode,
        description: `Advance Payment (${percentage}%) for Project: ${project.projectName}`,
        qty: 1,
        unit: 'Nos',
        rate: advanceAmount,
        amount: advanceAmount,
        taxPercent: project.taxPercent || 0,
        discountPercent: 0
      }];
      calculateTotals(items);
    } else if (formData.type === InvoiceType.FINAL) {
      const remaining = projectVal - totalInvoiced;
      const items: InvoiceItem[] = [{
        id: crypto.randomUUID(),
        description: `Final Settlement for ${project.projectName} (Remaining Balance)`,
        qty: 1,
        unit: 'Nos',
        rate: Math.max(0, remaining),
        amount: Math.max(0, remaining),
        taxPercent: project.taxPercent || 0,
        discountPercent: 0
      }];
      calculateTotals(items);
    } else if (formData.type === InvoiceType.RETENTION_CLAIM) {
      const totalRetentionHeld = projectInvoices.reduce((sum, i) => sum + (i.retentionAmount || 0), 0);
      const totalRetentionReleased = adjustments
        .filter(a => a.projectId === projId && a.type === 'Retention Release')
        .reduce((sum, a) => sum + a.amount, 0);
      const claimable = Math.max(0, totalRetentionHeld - totalRetentionReleased);

      const items: InvoiceItem[] = [{
        id: crypto.randomUUID(),
        description: `Retention Release & Claim for Project: ${project.projectName}`,
        qty: 1,
        unit: 'Nos',
        rate: claimable,
        amount: claimable,
        taxPercent: 0,
        discountPercent: 0
      }];
      calculateTotals(items);
    } else if (formData.type === InvoiceType.PROGRESS_BILLING || formData.type === InvoiceType.STAGE_BILLING) {
      // If there are payment tiers
      if (project.paymentTiers && project.paymentTiers.length > 0) {
        const firstTier = project.paymentTiers[0];
        handleTierSelect(firstTier.id, project);
      } else {
        // default 20% progress
        const claimAmount = Math.round(projectVal * 0.2);
        const items: InvoiceItem[] = [{
          id: crypto.randomUUID(),
          description: `Progress Billing (20%) for ${project.projectName}`,
          qty: 1,
          unit: 'Nos',
          rate: claimAmount,
          amount: claimAmount,
          taxPercent: project.taxPercent || 0,
          discountPercent: 0
        }];
        calculateTotals(items);
      }
    } else {
      // Standard: import items
      const items: InvoiceItem[] = (project.items || []).map(item => ({
        id: crypto.randomUUID(),
        pvcCode: item.pvcCode,
        description: item.name,
        qty: item.qty || 1,
        unit: item.unit || 'Nos',
        rate: item.rate || 0,
        amount: (item.qty || 1) * (item.rate || 0),
        taxPercent: project.taxPercent || 0,
        discountPercent: project.discountPercent || 0,
        variationStatus: item.variationStatus
      }));
      calculateTotals(items);
    }
  };

  // Quote Selection Handler
  const handleQuoteSelect = (quoteId: string) => {
    setSelectedQuoteId(quoteId);
    if (!quoteId) return;

    const quote = quotes.find(q => q.id === quoteId || q.quoteNo === quoteId);
    if (!quote) return;

    const quoteTotal = quote.grandTotal || (quote.items || []).reduce((s, i) => s + (i.amount || 0), 0);

    const updatedFormData: Partial<Invoice> = {
      ...formData,
      quoteId: quote.id,
      projectId: quote.projectId || formData.projectId,
      projectName: quote.projectName,
      client: quote.client,
      termsList: Array.isArray(quote.terms) ? quote.terms : formData.termsList,
      terms: Array.isArray(quote.terms) 
        ? quote.terms.filter(t => t.isActive).map(t => `${t.no} ${t.title}: ${t.content}`).join('\n\n')
        : formData.terms
    };

    setFormData(updatedFormData);

    if (formData.type === InvoiceType.ADVANCE) {
      const percentage = formData.advancePercent || 30;
      const advanceAmount = Math.round(quoteTotal * (percentage / 100) * 100) / 100;
      const items: InvoiceItem[] = [{
        id: crypto.randomUUID(),
        pvcCode: quote.quoteNo,
        description: `Advance Payment (${percentage}%) for Quotation ${quote.quoteNo} - ${quote.projectName}`,
        qty: 1,
        unit: 'Nos',
        rate: advanceAmount,
        amount: advanceAmount,
        taxPercent: quote.taxPercent || 0,
        discountPercent: 0
      }];
      calculateTotals(items);
    } else {
      // Import items from quote
      const items: InvoiceItem[] = (quote.items || []).map(item => ({
        id: crypto.randomUUID(),
        pvcCode: item.pvcCode,
        description: item.name,
        qty: item.qty || 1,
        unit: item.unit || 'Nos',
        rate: item.rate || 0,
        amount: (item.qty || 1) * (item.rate || 0),
        taxPercent: quote.taxPercent || 0,
        discountPercent: quote.discountPercent || 0,
        variationStatus: item.variationStatus
      }));
      calculateTotals(items);
    }
  };

  // Payment Tier Selection
  const handleTierSelect = (tierId: string, projectArg?: Project) => {
    const project = projectArg || projects.find(p => p.id === selectedProjectId || p.projectCode === selectedProjectId);
    if (!project || !project.paymentTiers) return;

    const tier = project.paymentTiers.find(t => t.id === tierId);
    if (!tier) return;

    const items: InvoiceItem[] = [{
      id: crypto.randomUUID(),
      description: `${tier.phase} (${tier.percentage}%) Milestone Payment - ${project.projectName}`,
      qty: 1,
      unit: 'Nos',
      rate: tier.amount,
      amount: tier.amount,
      taxPercent: project.taxPercent || 0,
      discountPercent: 0
    }];

    setFormData(prev => ({ ...prev, paymentTierId: tierId }));
    calculateTotals(items);
  };

  // Sync Variations
  const syncVariations = () => {
    const proj = projects.find(p => p.id === selectedProjectId || p.projectCode === selectedProjectId);
    const q = quotes.find(item => item.id === selectedQuoteId || item.quoteNo === selectedQuoteId);

    const variationSource = proj ? proj.items : (q ? q.items : []);
    if (!variationSource || variationSource.length === 0) {
      onAddNotification?.('No Variations', 'No variation change orders found on the selected source.', 'info');
      return;
    }

    const variationItems: InvoiceItem[] = variationSource
      .filter(item => item.variationStatus === 'Additional' || item.variationStatus === 'Omitted')
      .map(item => ({
        id: crypto.randomUUID(),
        pvcCode: item.pvcCode,
        description: `${item.variationStatus === 'Additional' ? '[VO Addition]' : '[VO Omission]'} ${item.name}`,
        qty: item.qty || 1,
        unit: item.unit || 'Nos',
        rate: item.rate || 0,
        taxPercent: (proj?.taxPercent || q?.taxPercent || 0),
        discountPercent: (proj?.discountPercent || q?.discountPercent || 0),
        amount: item.variationStatus === 'Omitted' ? -Math.abs((item.qty || 1) * (item.rate || 0)) : ((item.qty || 1) * (item.rate || 0)),
        variationStatus: item.variationStatus as any
      }));

    if (variationItems.length === 0) {
      onAddNotification?.('No Variations', 'No additional or omitted items are present.', 'info');
      return;
    }

    const combined = [...(formData.items || []), ...variationItems];
    calculateTotals(combined);
    onAddNotification?.('Variations Synced', `Added ${variationItems.length} variation change orders to the invoice.`, 'success');
  };

  // Item helpers
  const addItem = () => {
    const newItem: InvoiceItem = {
      id: crypto.randomUUID(),
      description: '',
      qty: 1,
      unit: 'Nos',
      rate: 0,
      amount: 0,
      taxPercent: 0,
      discountPercent: 0
    };
    calculateTotals([...(formData.items || []), newItem]);
  };

  const updateItem = (id: string, updates: Partial<InvoiceItem>) => {
    const newItems = (formData.items || []).map(item => {
      if (item.id === id) {
        const updated = { ...item, ...updates };
        updated.amount = (updated.qty || 0) * (updated.rate || 0);
        return updated;
      }
      return item;
    });
    calculateTotals(newItems);
  };

  const removeItem = (id: string) => {
    calculateTotals((formData.items || []).filter(item => item.id !== id));
  };

  // Save Invoice
  const handleSave = () => {
    if (!formData.client?.name) {
      onAddNotification?.('Validation', 'Please provide a valid client name.', 'error');
      return;
    }
    if (!formData.items?.length) {
      onAddNotification?.('Validation', 'Please add at least one line item to the invoice.', 'error');
      return;
    }
    try {
      if (formData.status === InvoiceStatus.COLLECTED_PAYMENT && onAddPayment && formData.client) {
        const remaining = (formData.grandTotal || 0) - (formData.amountPaid || 0) - (formData.amountAdjusted || 0);
        if (remaining > 0) {
          onAddPayment({
            id: crypto.randomUUID(),
            clientId: formData.client.id,
            clientName: formData.client.name,
            invoiceId: formData.id,
            invoiceNo: formData.invoiceNo,
            projectId: formData.projectId,
            projectName: formData.projectName,
            amount: remaining,
            date: new Date().toISOString().split('T')[0],
            method: 'Bank Transfer',
            status: 'Completed',
            paymentNo: `PAY-${Date.now()}`
          });
        }
      }
      onSave(formData as Invoice);
      onClose();
      onAddNotification?.(
        'Invoice Saved',
        `Invoice ${formData.invoiceNo} for ${formData.client.name} saved successfully.`,
        'success'
      );
    } catch (error) {
      console.error('Error saving invoice:', error);
      onAddNotification?.('Error', 'Failed to save invoice record.', 'error');
    }
  };

  // Print PDF
  const handlePrint = async () => {
    try {
      await generateInvoicePDF(formData as Invoice, settings, false);
      onAddNotification?.('Success', 'Invoice PDF generated successfully', 'success');
    } catch (error) {
      console.error('PDF generation error:', error);
      onAddNotification?.('Error', 'Failed to generate PDF document.', 'error');
    }
  };

  // Email to Client
  const handleEmailToClient = async () => {
    if (!formData.client?.email) {
      onAddNotification?.('Missing Email', 'Client does not have an email address specified.', 'warning');
      return;
    }
    try {
      await centralEmailService.triggerEvent({
        eventType: 'INVOICE_ISSUED',
        targetEmails: [formData.client.email],
        triggeringPortal: 'Commercial Invoicing & Accounts Receivable',
        triggeringAction: 'Dispatch Invoice Email from Builder',
        recordId: formData.id,
        variables: {
          invoice_no: formData.invoiceNo || '',
          client_name: formData.client.name,
          grand_total: `LKR ${(formData.grandTotal || 0).toLocaleString()}`,
          due_date: formData.dueDate || '',
          project_name: formData.projectName || 'General Billing',
          status: formData.status || 'Sent'
        }
      });
      onAddNotification?.('Email Dispatched', `Invoice notification sent to ${formData.client.email}`, 'success');
    } catch (e) {
      console.error('Email dispatch failed:', e);
      onAddNotification?.('Email Failed', 'Could not send automated email dispatch.', 'error');
    }
  };

  // Computed Advance Amount for quote or project
  const calculatedAdvanceAmount = useMemo(() => {
    const percent = formData.advancePercent || 30;
    if (sourceMode === 'quote' && currentQuote) {
      const total = currentQuote.grandTotal || (currentQuote.items || []).reduce((s, i) => s + (i.amount || 0), 0);
      return Math.round(total * (percent / 100));
    }
    if (sourceMode === 'project' && currentProject) {
      const total = currentProject.grandTotal || currentProject.totalValue || (currentProject.items || []).reduce((s, i) => s + (i.amount || 0), 0);
      return Math.round(total * (percent / 100));
    }
    return 0;
  }, [sourceMode, currentQuote, currentProject, formData.advancePercent]);

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-slate-900/40 backdrop-blur-xs overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 15 }}
        className="flex-1 flex flex-col h-full bg-[#f8fafc] text-slate-800 overflow-hidden shadow-2xl"
      >
        {/* Modern Command Ribbon Header */}
        <header className="px-5 py-3 border-b border-slate-200/90 bg-white flex items-center justify-between gap-4 z-20 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-sm">
              <CreditCard size={18} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-bold text-slate-900 leading-tight">
                  {invoice ? 'Edit Commercial Invoice' : 'Create Commercial Invoice'}
                </h2>
                <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {formData.invoiceNo}
                </span>
                <span className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded border uppercase",
                  formData.status === InvoiceStatus.COLLECTED_PAYMENT || formData.status === InvoiceStatus.PAID
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : formData.status === InvoiceStatus.OVERDUE
                    ? "bg-rose-50 text-rose-700 border-rose-200"
                    : "bg-slate-100 text-slate-700 border-slate-200"
                )}>
                  {formData.status}
                </span>
                <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  {formData.type}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                Issue: {formData.date} · Due: {formData.dueDate} · Client: {formData.client?.name || 'Unassigned'}
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 shrink-0">
            <button 
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors",
                showPreview 
                  ? "bg-blue-50 text-blue-700 border-blue-200" 
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              )}
            >
              {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
              <span className="hidden md:inline">{showPreview ? 'Hide Preview' : 'Show Live Preview'}</span>
            </button>

            <button 
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors shadow-2xs"
              title="Print Invoice PDF"
            >
              <Printer size={14} />
              <span className="hidden sm:inline">Print / PDF</span>
            </button>

            {formData.client?.email && (
              <button 
                type="button"
                onClick={handleEmailToClient}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 border border-sky-200 text-sky-700 rounded-lg text-xs font-semibold hover:bg-sky-100 transition-colors shadow-2xs"
                title="Send notification to client"
              >
                <Send size={13} />
                <span className="hidden sm:inline">Email Client</span>
              </button>
            )}

            <button 
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
            >
              <Save size={14} />
              <span>Save Invoice</span>
            </button>

            <button 
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors ml-1"
              title="Close Editor"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        {/* Builder Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Input Form Controls */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar space-y-5">
            {/* 1. Core Metadata & Invoice Classification */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <FileText size={14} className="text-orange-500" />
                  Invoice Identification & Status
                </span>
                <span className="text-[10px] text-slate-400">Primary Key (PK) & Classification</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 flex items-center gap-1.5">
                    <FileText size={12} className="text-slate-400" /> Invoice No (PK)
                  </label>
                  <input 
                    type="text"
                    value={formData.invoiceNo}
                    onChange={(e) => setFormData({ ...formData, invoiceNo: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold font-mono text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 flex items-center gap-1.5">
                    <TypeIcon size={12} className="text-slate-400" /> Invoice Type
                  </label>
                  <select 
                    value={formData.type}
                    onChange={(e) => {
                      const newType = e.target.value as InvoiceType;
                      setFormData({ ...formData, type: newType });
                    }}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-orange-500"
                  >
                    {Object.values(InvoiceType).map(t => (
                      <option key={t} value={t}>{t} Invoice</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 flex items-center gap-1.5">
                    <Calendar size={12} className="text-slate-400" /> Issue Date
                  </label>
                  <input 
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 flex items-center gap-1.5">
                    <Clock size={12} className="text-slate-400" /> Due Date
                  </label>
                  <input 
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 flex items-center gap-1.5">
                    <RefreshCw size={12} className="text-slate-400" /> Status
                  </label>
                  <select 
                    value={formData.status}
                    onChange={(e) => {
                      const newStatus = e.target.value as InvoiceStatus;
                      setFormData(prev => ({
                        ...prev,
                        status: newStatus,
                        amountPaid: newStatus === InvoiceStatus.COLLECTED_PAYMENT || newStatus === InvoiceStatus.PAID
                          ? (prev.grandTotal || 0)
                          : prev.amountPaid,
                        balanceDue: newStatus === InvoiceStatus.COLLECTED_PAYMENT || newStatus === InvoiceStatus.PAID
                          ? 0
                          : (prev.grandTotal || 0) - (prev.amountPaid || 0)
                      }));
                    }}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-orange-500"
                  >
                    {Object.values(InvoiceStatus).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 2. Source Linkage: Project, Quotation, Variations & Finance Dependencies */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                <div>
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Briefcase size={14} className="text-blue-600" />
                    Commercial Source & Cross-Portal Linkage
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Synchronize with Projects, Quotations, Variation Change Orders & Accounting Ledgers
                  </p>
                </div>

                {/* Source Mode Toggle */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setSourceMode('project');
                      if (projects[0] && !selectedProjectId) {
                        handleProjectSelect(projects[0].id);
                      }
                    }}
                    className={cn(
                      "px-3 py-1 rounded-md text-xs font-bold transition-all",
                      sourceMode === 'project'
                        ? "bg-white text-orange-600 shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    )}
                  >
                    Link Project
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSourceMode('quote');
                      if (quotes[0] && !selectedQuoteId) {
                        handleQuoteSelect(quotes[0].id);
                      }
                    }}
                    className={cn(
                      "px-3 py-1 rounded-md text-xs font-bold transition-all",
                      sourceMode === 'quote'
                        ? "bg-white text-blue-600 shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    )}
                  >
                    Link Quote
                  </button>
                  <button
                    type="button"
                    onClick={() => setSourceMode('direct')}
                    className={cn(
                      "px-3 py-1 rounded-md text-xs font-bold transition-all",
                      sourceMode === 'direct'
                        ? "bg-white text-slate-900 shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    )}
                  >
                    Direct / Ad-hoc
                  </button>
                </div>
              </div>

              {/* Linking Dropdowns & Context */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                <div className="lg:col-span-8 space-y-3">
                  {sourceMode === 'project' && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                          <Building2 size={13} className="text-orange-500" /> Select Target Project
                        </label>
                        {selectedProjectId && onNavigateToProject && (
                          <button
                            type="button"
                            onClick={() => onNavigateToProject(selectedProjectId, 'variations')}
                            className="text-[11px] font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1"
                          >
                            <span>Open in Project Lifecycle</span>
                            <ExternalLink size={11} />
                          </button>
                        )}
                      </div>
                      <select 
                        value={selectedProjectId}
                        onChange={(e) => handleProjectSelect(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-orange-500"
                      >
                        <option value="">-- Choose a Project to Link --</option>
                        {(formData.client?.id ? filteredProjects : projects).map(p => (
                          <option key={p.id} value={p.id}>
                            [{p.projectCode || p.id.slice(0, 8)}] {p.projectName} — ({p.client?.name})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {sourceMode === 'quote' && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                          <FileText size={13} className="text-blue-500" /> Select Source Quotation
                        </label>
                        {selectedQuoteId && onNavigateToQuote && (
                          <button
                            type="button"
                            onClick={() => onNavigateToQuote(selectedQuoteId)}
                            className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                          >
                            <span>Open in Quotation Portal</span>
                            <ExternalLink size={11} />
                          </button>
                        )}
                      </div>
                      <select 
                        value={selectedQuoteId}
                        onChange={(e) => handleQuoteSelect(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                      >
                        <option value="">-- Choose a Quotation to Link --</option>
                        {(formData.client?.id ? filteredQuotes : quotes).map(q => (
                          <option key={q.id} value={q.id}>
                            {q.quoteNo} - {q.projectName} — ({q.client?.name}) · LKR {(q.grandTotal || 0).toLocaleString()}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {sourceMode === 'direct' && (
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600">
                      <p className="font-semibold text-slate-800">Direct Ad-hoc Invoicing Mode</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        This invoice is not tied to a parent contract or quote. You can directly specify items, customer information, and terms.
                      </p>
                    </div>
                  )}

                  {/* Advance Calculation Box (Works for BOTH Quote and Project!) */}
                  {formData.type === InvoiceType.ADVANCE && (selectedQuoteId || selectedProjectId) && (
                    <div className="p-3.5 bg-violet-50/80 border border-violet-200 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-violet-900 flex items-center gap-1.5">
                          <Percent size={13} className="text-violet-600" />
                          Advance Payment Configuration
                        </span>
                        <span className="text-[11px] text-violet-700 font-semibold">
                          Source: {sourceMode === 'quote' ? `Quote ${currentQuote?.quoteNo}` : `Project ${currentProject?.projectCode || currentProject?.projectName}`}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-violet-700">Advance Percentage (%)</label>
                          <div className="flex items-center gap-2">
                            <input 
                              type="number"
                              min="1"
                              max="100"
                              value={formData.advancePercent ?? 30}
                              onChange={(e) => setFormData({ ...formData, advancePercent: parseFloat(e.target.value) || 0 })}
                              className="w-24 bg-white border border-violet-200 rounded-lg px-2.5 py-1.5 text-xs font-bold font-mono text-violet-950 focus:outline-none focus:ring-1 focus:ring-violet-500"
                            />
                            <div className="flex gap-1">
                              {[10, 20, 30, 40, 50].map(pct => (
                                <button
                                  key={pct}
                                  type="button"
                                  onClick={() => setFormData({ ...formData, advancePercent: pct })}
                                  className={cn(
                                    "px-2 py-1 text-[10px] font-bold rounded transition-colors",
                                    formData.advancePercent === pct 
                                      ? "bg-violet-600 text-white" 
                                      : "bg-white text-violet-700 border border-violet-200 hover:bg-violet-100"
                                  )}
                                >
                                  {pct}%
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="p-2.5 bg-white rounded-lg border border-violet-200/80">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-violet-500 block">
                            Calculated Advance Payable
                          </span>
                          <span className="text-base font-bold font-mono text-violet-900">
                            LKR {calculatedAdvanceAmount.toLocaleString()}
                          </span>
                          <p className="text-[10px] text-violet-500 mt-0.5">
                            {formData.advancePercent}% of Total LKR {((sourceMode === 'quote' ? currentQuote?.grandTotal : currentProject?.grandTotal) || 0).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Payment Milestone / Tiers if available */}
                  {(formData.type === InvoiceType.PROGRESS_BILLING || formData.type === InvoiceType.STAGE_BILLING) && currentProject?.paymentTiers && (
                    <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl space-y-2">
                      <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                        <Layers size={13} className="text-amber-600" />
                        Project Payment Milestones &amp; Tiers
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {currentProject.paymentTiers.map(tier => (
                          <button
                            key={tier.id}
                            type="button"
                            onClick={() => handleTierSelect(tier.id)}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all text-left",
                              formData.paymentTierId === tier.id
                                ? "bg-amber-600 text-white border-amber-600 shadow-2xs"
                                : "bg-white text-amber-900 border-amber-200 hover:bg-amber-100"
                            )}
                          >
                            <span className="font-bold">{tier.phase}</span>
                            <span className="text-[10px] ml-1.5 opacity-80">({tier.percentage}%) · LKR {tier.amount?.toLocaleString()}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column: Cross-Portal Actions & Live Synced Stats */}
                <div className="lg:col-span-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <ShieldCheck size={12} className="text-emerald-500" /> Connected Dependencies
                  </span>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Source Contract Sum:</span>
                      <span className="font-mono font-bold text-slate-900">
                        LKR {((sourceMode === 'quote' ? currentQuote?.grandTotal : currentProject?.grandTotal) || 0).toLocaleString()}
                      </span>
                    </div>

                    {sourceMode === 'project' && (
                      <>
                        <div className="flex justify-between items-center text-slate-600">
                          <span>Previously Invoiced:</span>
                          <span className="font-mono text-slate-700">
                            LKR {(formData.previouslyInvoiced || 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-slate-600">
                          <span>Already Collected:</span>
                          <span className="font-mono text-emerald-600 font-semibold">
                            LKR {(formData.totalProjectCollected || 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-slate-600">
                          <span>Unbilled Contract Balance:</span>
                          <span className="font-mono text-orange-600 font-semibold">
                            LKR {Math.max(0, ((currentProject?.grandTotal || 0) - (formData.previouslyInvoiced || 0))).toLocaleString()}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Sync Variations Button */}
                  <div className="pt-2 border-t border-slate-200 flex flex-col gap-1.5">
                    <button
                      type="button"
                      onClick={syncVariations}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold transition-colors"
                    >
                      <History size={13} className="text-emerald-600" />
                      <span>Sync Variations (Add/Omit)</span>
                    </button>

                    {onNavigateToVariationManager && (
                      <button
                        type="button"
                        onClick={() => onNavigateToVariationManager(selectedProjectId)}
                        className="w-full inline-flex items-center justify-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 py-1"
                      >
                        <span>Open Variation Manager</span>
                        <ArrowRight size={11} />
                      </button>
                    )}

                    {onNavigateToAccounting && (
                      <button
                        type="button"
                        onClick={() => onNavigateToAccounting('ledgers', formData.id)}
                        className="w-full inline-flex items-center justify-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 py-1"
                      >
                        <span>Inspect in Accounting Ledgers</span>
                        <ArrowRight size={11} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Client & Billing Entity Details */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <User size={14} className="text-orange-500" />
                  Client &amp; Billing Entity Information
                </span>
                
                <div className="flex items-center gap-2">
                  {formData.client && onNavigateToCustomerPortal && (
                    <button
                      type="button"
                      onClick={() => onNavigateToCustomerPortal(formData.client!)}
                      className="text-[11px] font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1"
                    >
                      <span>Open Customer Portal</span>
                      <ExternalLink size={11} />
                    </button>
                  )}
                  <select 
                    value={formData.client?.id || ''}
                    onChange={(e) => {
                      const c = clients.find(cl => cl.id === e.target.value);
                      if (c) {
                        setFormData(prev => ({ ...prev, client: { ...c } }));
                        onAddNotification?.('Client Selected', `Loaded client details for ${c.name}`, 'info');
                      }
                    }}
                    className="bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-xs font-semibold text-slate-700 focus:outline-none"
                  >
                    <option value="">Quick Select Existing Client</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>

                  {formData.client?.name && (
                    <button
                      type="button"
                      onClick={() => {
                        if (formData.client) {
                          const saved = onSaveClient(formData.client);
                          setFormData(prev => ({ ...prev, client: saved }));
                          onAddNotification?.('Client Saved', `Saved ${saved.name} to client registry`, 'success');
                        }
                      }}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-semibold transition-colors"
                      title="Save client to CRM"
                    >
                      Save to CRM
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600">Client / Company Name</label>
                  <input 
                    type="text"
                    value={formData.client?.name || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      client: { ...prev.client!, name: e.target.value }
                    }))}
                    placeholder="e.g. Metropolitan Real Estate"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600">Client Email Address</label>
                  <input 
                    type="email"
                    value={formData.client?.email || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      client: { ...prev.client!, email: e.target.value }
                    }))}
                    placeholder="projects@client.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600">Billing Address</label>
                  <input 
                    type="text"
                    value={formData.client?.address || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      client: { ...prev.client!, address: e.target.value }
                    }))}
                    placeholder="Full street address..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
            </div>

            {/* 4. Line Items & Bill of Quantities (BOQ) */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                <div>
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <FileText size={14} className="text-orange-500" />
                    Invoice Line Items ({formData.items?.length || 0})
                  </span>
                  <p className="text-[11px] text-slate-500">Bill of quantities, milestone descriptions, PVC codes & rates</p>
                </div>

                <div className="flex items-center gap-2">
                  {onOpenCatalog && (
                    <button
                      type="button"
                      onClick={() => onOpenCatalog('invoice')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold transition-colors"
                      title="Import product variants from catalog"
                    >
                      <Package size={13} />
                      <span>From Catalog</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={addItem}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs"
                  >
                    <Plus size={13} />
                    <span>Add Item</span>
                  </button>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                {formData.items && formData.items.length > 0 ? (
                  formData.items.map((item, idx) => (
                    <div 
                      key={item.id || idx}
                      className={cn(
                        "p-3 rounded-xl border transition-all space-y-2.5",
                        item.variationStatus === 'Omitted'
                          ? "bg-rose-50/50 border-rose-200"
                          : item.variationStatus === 'Additional'
                          ? "bg-emerald-50/50 border-emerald-200"
                          : "bg-slate-50/60 border-slate-200 hover:border-slate-300"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-bold text-slate-400">#{idx + 1}</span>
                            {item.pvcCode && (
                              <span className="text-[10px] font-mono font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded flex items-center gap-1">
                                <Barcode size={10} /> {item.pvcCode}
                              </span>
                            )}
                            {item.variationStatus && (
                              <span className={cn(
                                "text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider",
                                item.variationStatus === 'Additional' 
                                  ? "bg-emerald-100 text-emerald-800"
                                  : item.variationStatus === 'Omitted'
                                  ? "bg-rose-100 text-rose-800"
                                  : "bg-slate-200 text-slate-700"
                              )}>
                                {item.variationStatus}
                              </span>
                            )}
                          </div>
                          <textarea 
                            value={item.description}
                            onChange={(e) => updateItem(item.id, { description: e.target.value })}
                            placeholder="Line item description, specification or milestone phase..."
                            rows={2}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-orange-500 resize-none"
                          />
                        </div>

                        <button 
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors mt-2"
                          title="Remove item"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                        <div className="space-y-0.5">
                          <label className="text-[10px] font-semibold text-slate-500">Qty</label>
                          <input 
                            type="number"
                            min="0"
                            step="any"
                            value={item.qty}
                            onChange={(e) => updateItem(item.id, { qty: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-white border border-slate-200 rounded-md px-2 py-1 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-orange-500"
                          />
                        </div>

                        <div className="space-y-0.5">
                          <label className="text-[10px] font-semibold text-slate-500">Unit</label>
                          <input 
                            type="text"
                            value={item.unit || 'Nos'}
                            onChange={(e) => updateItem(item.id, { unit: e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-md px-2 py-1 text-xs font-semibold text-slate-800 focus:outline-none focus:border-orange-500"
                          />
                        </div>

                        <div className="space-y-0.5">
                          <label className="text-[10px] font-semibold text-slate-500">Unit Rate (LKR)</label>
                          <input 
                            type="number"
                            min="0"
                            step="any"
                            value={item.rate}
                            onChange={(e) => updateItem(item.id, { rate: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-white border border-slate-200 rounded-md px-2 py-1 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-orange-500"
                          />
                        </div>

                        <div className="space-y-0.5">
                          <label className="text-[10px] font-semibold text-slate-500">Tax (%)</label>
                          <input 
                            type="number"
                            min="0"
                            max="100"
                            value={item.taxPercent || 0}
                            onChange={(e) => updateItem(item.id, { taxPercent: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-white border border-slate-200 rounded-md px-2 py-1 text-xs font-mono font-semibold text-slate-800 focus:outline-none focus:border-orange-500"
                          />
                        </div>

                        <div className="space-y-0.5 col-span-2 sm:col-span-1">
                          <label className="text-[10px] font-semibold text-slate-500">Line Amount</label>
                          <div className="w-full bg-slate-100 border border-slate-200 rounded-md px-2 py-1 text-xs font-mono font-bold text-slate-900 text-right truncate">
                            LKR {(item.amount || 0).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    <p className="text-xs font-semibold text-slate-600">No line items in this invoice yet.</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Click "+ Add Item" or choose a Project/Quote above to auto-populate contract items.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 5. Commercial Terms, PO & Shipping Metadata */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Settings size={14} className="text-blue-600" />
                  Commercial Terms, Purchase Order &amp; Export
                </span>
                <span className="text-[10px] text-slate-400">Delivery, Tax, PO &amp; Shipping Parameters</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600">Purchase Order (PO #)</label>
                  <input 
                    type="text"
                    value={formData.purchaseOrderNo || ''}
                    onChange={(e) => setFormData({ ...formData, purchaseOrderNo: e.target.value })}
                    placeholder="PO-2026-X"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600">Payment Terms</label>
                  <input 
                    type="text"
                    value={formData.paymentTerms || ''}
                    onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                    placeholder="e.g. Net 30, COD"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600">Delivery Date</label>
                  <input 
                    type="date"
                    value={formData.deliveryDate || ''}
                    onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600">Salesperson</label>
                  <input 
                    type="text"
                    value={formData.salesperson || ''}
                    onChange={(e) => setFormData({ ...formData, salesperson: e.target.value })}
                    placeholder="Account executive"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Cheque & Bank Settlement */}
              <div className="pt-3 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-800 mb-2 block flex items-center gap-1.5">
                  <CreditCard size={13} className="text-emerald-600" /> Cheque &amp; Settlement Details (Optional)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500">Cheque Number</label>
                    <input 
                      type="text"
                      value={formData.chequeDetails?.chequeNo || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        chequeDetails: { ...(formData.chequeDetails || { chequeNo: '', bank: '', date: '' }), chequeNo: e.target.value }
                      })}
                      placeholder="e.g. CHQ-481920"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-800 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500">Bank Name</label>
                    <input 
                      type="text"
                      value={formData.chequeDetails?.bank || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        chequeDetails: { ...(formData.chequeDetails || { chequeNo: '', bank: '', date: '' }), bank: e.target.value }
                      })}
                      placeholder="e.g. Commercial Bank of Ceylon"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500">Cheque Date</label>
                    <input 
                      type="date"
                      value={formData.chequeDetails?.date || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        chequeDetails: { ...(formData.chequeDetails || { chequeNo: '', bank: '', date: '' }), date: e.target.value }
                      })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 6. Terms and Conditions */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs">
              <TermsEditor 
                terms={formData.termsList || []} 
                onChange={(terms) => {
                  const safeTerms = Array.isArray(terms) ? terms : [];
                  const termsText = safeTerms.filter(t => t.isActive).map(t => `${t.no} ${t.title}: ${t.content}`).join('\n\n');
                  setFormData({ ...formData, termsList: safeTerms, terms: termsText });
                }} 
              />
            </div>
          </div>

          {/* Right: Live Preview Panel or Summary Sidebar */}
          <AnimatePresence>
            {showPreview && (
              <motion.div 
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 560, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                className="hidden xl:flex flex-col border-l border-slate-200 bg-slate-100/70 overflow-hidden shrink-0"
              >
                {/* Live Preview Header */}
                <div className="p-3.5 border-b border-slate-200 bg-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Live Precision Document Preview
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    PDF Sync 100%
                  </span>
                </div>

                {/* Financial Summary Float */}
                <div className="p-3 bg-slate-900 text-white flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Grand Total Due</span>
                    <span className="text-lg font-bold font-mono text-emerald-400">
                      LKR {(formData.grandTotal || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Balance Remaining</span>
                    <span className="text-sm font-bold font-mono text-amber-400">
                      LKR {(formData.balanceDue || 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Live Document Frame */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                  <div className="bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden transform scale-[0.98] origin-top">
                    <LivePreview 
                      quote={formData as Invoice} 
                      settings={settings} 
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Hidden SVG for Barcode generation */}
        <div className="hidden">
          <svg ref={barcodeRef} />
        </div>
      </motion.div>
    </div>
  );
};
