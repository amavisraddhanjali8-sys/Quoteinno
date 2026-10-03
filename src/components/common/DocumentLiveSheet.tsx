import React, { useMemo, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { BarcodeVisual } from '../boq/BarcodeVisual';
import { 
  Quote, 
  Invoice, 
  Project, 
  AuditLog, 
  CompanySettings, 
  PdfLayout, 
  numberToWords 
} from '../../types';

export interface DocumentLiveSheetProps {
  type: 'Quote' | 'Project' | 'Variation' | 'AuditLog' | 'AllDocuments' | 'Timeline' | 'Dashboard' | 'Invoice' | 'CustomerReports';
  data: any;
  settings?: CompanySettings;
  docSettings: {
    fontSize: number;
    accentColor: string;
    showLogo: boolean;
    showBankDetails: boolean;
    showTimeline: boolean;
    showPaymentTiers: boolean;
    layoutType: PdfLayout;
    showWatermark?: boolean;
    watermarkText?: string;
    showSeal?: boolean;
  };
  allQuotes?: Quote[];
  allProjects?: Project[];
  allAuditLogs?: AuditLog[];
  allInvoices?: Invoice[];
  allPayments?: any[];
  allAdjustments?: any[];
  svcCode?: string;
  zoom?: number;
  initialPage?: number | 'all';
}

export const DocumentLiveSheet: React.FC<DocumentLiveSheetProps> = ({
  type,
  data,
  settings,
  docSettings,
  allQuotes = [],
  allProjects = [],
  allAuditLogs = [],
  allInvoices = [],
  svcCode,
  zoom = 1,
  initialPage = 'all'
}) => {
  const [selectedPage, setSelectedPage] = useState<number | 'all'>(initialPage);

  // Fallbacks to guarantee reliable rendering
  const quote: Quote | null = useMemo(() => {
    if (type === 'Quote' && data) return data as Quote;
    if (type === 'Timeline' && data && (data as any).quoteNo) return data as Quote;
    return allQuotes[0] || null;
  }, [type, data, allQuotes]);

  const project: Project | null = useMemo(() => {
    if ((type === 'Project' || type === 'Variation' || type === 'AllDocuments') && data) return data as Project;
    if (type === 'Timeline' && data && !(data as any).quoteNo) return data as Project;
    return allProjects[0] || null;
  }, [type, data, allProjects]);

  const invoice: Invoice | null = useMemo(() => {
    if (type === 'Invoice' && data) return data as Invoice;
    return allInvoices[0] || null;
  }, [type, data, allInvoices]);

  const auditLogsList: AuditLog[] = useMemo(() => {
    if (type === 'AuditLog' && Array.isArray(data) && data.length > 0) return data;
    return allAuditLogs.length > 0 ? allAuditLogs : [
      {
        id: 'aud-1',
        timestamp: new Date().toISOString(),
        action: 'SYSTEM_BOOTSTRAP',
        details: 'Initial system audit ledger verified',
        user: 'System Admin',
        type: 'System'
      }
    ];
  }, [type, data, allAuditLogs]);

  const customerName = useMemo(() => {
    if (type === 'CustomerReports') {
      return (data as any)?.customerName || project?.client?.name || quote?.client?.name || 'Commercial Client';
    }
    return '';
  }, [type, data, project, quote]);

  const defaultBank = settings?.bankDetails?.find(b => b.isDefault) || settings?.bankDetails?.[0] || {
    bankName: 'Commercial Bank',
    branchName: 'Kelaniya',
    accountName: 'Innovista Metal (Pvt) Ltd',
    accountNumber: '1234567890',
    swiftCode: 'COMBPCE'
  };

  const currency = settings?.defaultCurrency || 'LKR';
  const docRef = useMemo(() => {
    if (type === 'Quote') return quote?.quoteNo || 'QT-2026-1001';
    if (type === 'Invoice') return invoice?.invoiceNo || 'INV-2026-1001';
    if (type === 'Project') return project?.originalQuoteNo || (project as any)?.projectCode || 'PRJ-2026-1001';
    if (type === 'Variation') return `VO-${project?.originalQuoteNo || '1001'}`;
    if (type === 'Timeline') return `SCH-${quote?.quoteNo || project?.originalQuoteNo || '1001'}`;
    if (type === 'AuditLog') return 'AUDIT-LOG-2026';
    if (type === 'Dashboard') return 'EXEC-DASH-2026';
    if (type === 'AllDocuments') return `DOSSIER-${project?.originalQuoteNo || '1001'}`;
    if (type === 'CustomerReports') return 'CUST-STMT-2026';
    return svcCode || 'DOC-2026-1001';
  }, [type, quote, invoice, project, svcCode]);

  const formattedDate = useMemo(() => {
    if (type === 'Quote' && quote?.submittedDate) return quote.submittedDate;
    if (type === 'Invoice' && invoice?.date) return invoice.date;
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }, [type, quote, invoice]);

  const projectName = useMemo(() => {
    if (type === 'Quote' && quote?.projectName) return quote.projectName;
    if (type === 'Invoice' && invoice?.projectName) return invoice.projectName;
    if (project?.projectName) return project.projectName;
    return 'EXECUTIVE INTERIOR GLASS & PARTITION FIT-OUT';
  }, [type, quote, invoice, project]);

  const docTitle = useMemo(() => {
    if (type === 'Quote') return 'QUOTATION';
    if (type === 'Invoice') return 'COMMERCIAL INVOICE';
    if (type === 'Project') return 'PROJECT REPORT';
    if (type === 'Variation') return 'VARIATION CLAIM';
    if (type === 'Timeline') return 'PROJECT TIMELINE';
    if (type === 'AuditLog') return 'AUDIT LEDGER';
    if (type === 'Dashboard') return 'EXECUTIVE REPORT';
    if (type === 'AllDocuments') return 'PROJECT DOSSIER';
    if (type === 'CustomerReports') return 'STATEMENT OF ACCOUNT';
    return 'OFFICIAL DOCUMENT';
  }, [type]);

  // Totals calculation
  const totals = useMemo(() => {
    if (type === 'Quote' && quote) {
      const subTotal = (() => {
        if (quote.pricingMethod === 'Lump Sum' && quote.lumpSumAmount) {
          return quote.lumpSumAmount;
        }
        const itemsTotal = (quote.items || []).reduce((sum, item) => sum + (item.amount || 0), 0);
        if (quote.pricingMethod === 'Cost Plus' && quote.marginPercent) {
          return itemsTotal * (1 + quote.marginPercent / 100);
        }
        return itemsTotal;
      })();

      const discountPercent = quote.discountPercent || 0;
      const discountAmount = subTotal * (discountPercent / 100);
      const additionalCharges = (quote.additionalCharges || []).reduce((sum, c) => sum + c.amount, 0);
      const totalBeforeTax = subTotal - discountAmount + additionalCharges;
      const taxPercent = quote.taxPercent !== undefined ? quote.taxPercent : 15;
      const taxAmount = quote.isTaxInclusive
        ? totalBeforeTax - (totalBeforeTax / (1 + taxPercent / 100))
        : totalBeforeTax * (taxPercent / 100);
      const grandTotal = quote.isTaxInclusive ? totalBeforeTax : totalBeforeTax + taxAmount;
      const advancePercent = quote.advancePercent !== undefined ? quote.advancePercent : 50;
      const advanceAmount = (grandTotal * advancePercent) / 100;

      return {
        subTotal,
        discountPercent,
        discountAmount,
        taxPercent,
        taxAmount,
        grandTotal,
        advancePercent,
        advanceAmount,
        words: numberToWords(Math.floor(grandTotal))
      };
    }

    if (type === 'Invoice' && invoice) {
      return {
        subTotal: invoice.subTotal || 0,
        discountPercent: 0,
        discountAmount: invoice.discountTotal || 0,
        taxPercent: 15,
        taxAmount: invoice.taxTotal || 0,
        grandTotal: invoice.grandTotal || 0,
        advancePercent: 0,
        advanceAmount: invoice.amountPaid || 0,
        words: numberToWords(Math.floor(invoice.grandTotal || 0))
      };
    }

    return {
      subTotal: 543000,
      discountPercent: 0,
      discountAmount: 0,
      taxPercent: 15,
      taxAmount: 70826.09,
      grandTotal: 543000,
      advancePercent: 50,
      advanceAmount: 271500,
      words: 'five lakh forty three thousand only'
    };
  }, [type, quote, invoice]);

  // Standard terms list
  const termsList = useMemo(() => {
    if (quote?.terms && quote.terms.length > 0) {
      return quote.terms.filter(t => t.isActive);
    }
    return [
      { no: '1.2.1', title: 'Submitted Date', content: 'The date of submission for this quotation.' },
      { no: '1.2.2', title: 'Offer and Validity', content: 'Prices are in Sri Lankan Rupees and valid for fifteen (15) days from submission, after which revised pricing may be issued to reflect changes prior to acceptance pursuant to general contract formation under Sri Lankan law. On acceptance, the BOQ, drawings, and these terms form the binding contract documents subject to stamping where applicable under the Stamp Duty Act of Sri Lanka.' },
      { no: '1.2.3(a)', title: 'Scope of Work', content: 'Scope includes supply, fabrication, delivery, installation, testing, commissioning, protection, and final cleaning for aluminium and steel works, interior fit-out, minor construction, renovations, and repairs as described in the BOQ and approved drawings/specifications.' },
      { no: '1.2.3(b)', title: 'Contractor Responsibility', content: 'The contractor must submit all required drawings, samples, and documents for approval. But even after approval, the contractor is still fully responsible for ensuring that all materials, methods, and work comply with CIDA standards, project requirements, and legal obligations.' },
      { no: '1.2.4', title: 'Programme and Duration', content: 'Estimated completion is 20 days ± 2 days from written Notice to Commence and receipt of advance, subject to site readiness and approvals, with entitlement to Extensions of Time for force majeure, client-caused delay, and delayed approvals.' },
      { no: '1.2.5', title: 'Price, Rates, and Currency', content: 'Unit rates are firm for the validity period and, once contracted, remain fixed for the agreed scope, save for approved variations, remeasurement where applicable, or statutory tax changes under TAX law. Currency of account and payment is LKR.' },
      { no: '1.2.6', title: 'Measurement and Variations', content: 'Measurement follows Sri Lankan Standard Method of Measurement for Building Works SLS 573 and related CIDA/IQSSL guidance; BOQ quantities are estimates for remeasurement items, with payment on actual measured quantities.' },
      { no: '1.2.7', title: 'Payment Terms', content: 'Payment milestones: 60% advance at Order Confirmation/Notice to Commence, 20% at 50% certified progress (by joint measurement), and balance at completion, testing/commissioning, and handover, subject to VAT invoicing.' },
      { no: '1.2.8', title: 'Title, Risk, Delivery, and Handover', content: 'Risk in materials remains with the Contractor until installation, with risk in completed works passing at taking-over/handover. Title to materials passes upon payment for the relevant portion.' },
      { no: '1.2.9', title: 'Health & Safety Compliance', content: 'The Contractor must comply with the Factories Ordinance (health, safety, welfare) and related regulations applicable to construction and engineering works.' },
      { no: '1.2.10', title: 'Quality and Technical Standards', content: 'Materials and workmanship comply with relevant SLS standards or, where absent, with suitable BS/EN/ISO/ASTM equivalents recognized in Sri Lankan practice and CIDA specifications.' },
      { no: '1.2.11', title: 'Submittals and Inspections', content: 'The Contractor provides inspection and test plans, mill certificates, calibration records, and as-built drawings; approvals do not waive conformance obligations under contract and law.' },
      { no: '1.2.12', title: 'Subcontracting and Personnel', content: 'Subcontracting of specialist trades is permitted with prior written notice; the Contractor remains fully responsible for subcontractors’ performance and safety compliance.' },
      { no: '1.2.13', title: 'Additional Work', content: 'In the event of Additional Work, not covered on this Quotation, Separate Sub Quotations to be submitted and approved for extra payment.' },
      { no: '1.2.14', title: 'BOQ Notes for Pricing', content: 'Inclusions: supply, fabrication, delivery, fixing, sealants, accessories, consumables, protection, testing/commissioning, and final cleaning unless expressly excluded.' },
      { no: '1.2.15', title: 'Warranty and Defects Liability', content: 'A six-month Defects Liability Period applies for workmanship defects attributable to the Contractor, with rectification within a reasonable period upon notice.' },
    ];
  }, [quote]);

  // Payment schedule rows
  const paymentScheduleRows = useMemo(() => {
    if (quote?.paymentTiers && quote.paymentTiers.length > 0) {
      return quote.paymentTiers.map(t => ({
        phase: t.phase,
        percentage: `${t.percentage}%`,
        amount: ((totals.grandTotal * t.percentage) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      }));
    }
    return [
      { phase: 'Order Confirmation & Advance Payment', percentage: '50%', amount: (totals.grandTotal * 0.5).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
      { phase: 'Material Delivery & Site Sub-frame Complete', percentage: '30%', amount: (totals.grandTotal * 0.3).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
      { phase: 'Final Glass Sealing & Handover Certification', percentage: '20%', amount: (totals.grandTotal * 0.2).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
    ];
  }, [quote, totals.grandTotal]);

  // Common Header Component matching the uploaded PDF exactly
  const renderHeader = () => (
    <div className="pb-2.5 border-b-[1.5px] border-[#1D4ED8] shrink-0">
      <div className="flex items-start justify-between">
        {/* Left Side: Brand & Contact Info */}
        <div className="space-y-0.5">
          <div className="flex items-baseline gap-2.5">
            <span className="text-[19px] font-black tracking-tight text-[#1D4ED8] font-sans">
              INNOVISTA
            </span>
            <span className="text-[19px] font-black tracking-tight text-[#0F172A] font-sans">
              METAL
            </span>
          </div>
          <p className="text-[10px] text-slate-600 font-sans leading-tight">
            {settings?.address || 'Kelaniya, Sri Lanka'}
          </p>
          <p className="text-[9.5px] text-slate-600 font-sans leading-tight">
            Tel: {settings?.phone || '0773726224'} | Email: {settings?.email || 'innovistametal@gmail.com'}
          </p>
          <div className="flex items-center gap-3 pt-0.5 text-[9.5px] leading-tight">
            <span className="text-slate-600 font-sans">
              Web: {settings?.website || 'www.innovistametal.com'}
            </span>
            <span className="font-bold text-slate-900 font-sans tracking-wide">
              PROJECT: {projectName.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Right Side: Document Type, Date, Ref No */}
        <div className="text-right space-y-0.5">
          <h2 className="text-[18px] font-black tracking-tight text-[#1D4ED8] font-sans">
            {docTitle}
          </h2>
          <p className="text-[10px] text-slate-700 font-sans">
            Date: {formattedDate}
          </p>
          <p className="text-[10px] text-slate-700 font-sans">
            Ref #: {docRef}
          </p>
        </div>
      </div>
    </div>
  );

  // Common Footer Component matching the uploaded PDF exactly
  const renderFooter = (pageNumber: number) => (
    <div className="pt-2.5 border-t border-slate-200 shrink-0 mt-auto">
      <div className="grid grid-cols-[100px_1fr_100px] items-end">
        {/* Left: Square QR code + VERIFY DOCUMENT */}
        <div className="flex flex-col items-start pl-1">
          <div className="bg-white p-0.5 border border-slate-300 rounded shadow-2xs">
            <QRCodeSVG 
              value={svcCode || docRef || 'INNOVISTA-DOC-VERIFY'} 
              size={36} 
              level="M" 
            />
          </div>
          <span className="text-[7px] font-bold text-slate-500 uppercase tracking-wider mt-1 text-center w-[40px]">
            VERIFY DOCUMENT
          </span>
        </div>

        {/* Center: Barcode + Ref No + System Tagline */}
        <div className="flex flex-col items-center justify-center text-center">
          <div className="bg-white">
            <BarcodeVisual
              value={svcCode || docRef || 'QT-2026-1001'}
              format="CODE128"
              width={1.2}
              height={22}
              displayValue={false}
              className="mx-auto"
            />
          </div>
          <span className="text-[9px] font-bold font-mono text-slate-800 tracking-wider">
            {svcCode || docRef}
          </span>
          <span className="text-[7.5px] text-slate-400 font-sans italic mt-0.5">
            this generate from innovista fabriconix system
          </span>
        </div>

        {/* Right: Page Number */}
        <div className="text-right pr-1">
          <span className="text-[10px] text-slate-600 font-sans">
            Page {pageNumber}
          </span>
        </div>
      </div>
    </div>
  );

  // A4 Sheet Container Wrapper
  const renderSheet = (pageNumber: number, content: React.ReactNode) => (
    <div 
      key={pageNumber}
      className="printable-sheet relative bg-white text-slate-800 shadow-xl border border-slate-200/90 mx-auto w-[794px] min-h-[1123px] p-9 font-sans overflow-hidden flex flex-col justify-between mb-8 print:mb-0 print:border-none print:shadow-none print:w-full print:p-6 print:min-h-[1050px]"
      style={{ 
        pageBreakAfter: 'always',
        fontSize: `${docSettings.fontSize || 10}px` 
      }}
    >
      {/* Header */}
      {renderHeader()}

      {/* Main Page Body */}
      <div className="py-4 flex-1 flex flex-col">
        {content}
      </div>

      {/* Footer */}
      {renderFooter(pageNumber)}
    </div>
  );

  // =========================================================================
  // PAGE 1: Table of Contents & Structure (Matches Uploaded PDF Page 1)
  // =========================================================================
  const renderPage1 = () => (
    <div className="space-y-4">
      <h3 className="font-bold text-[13px] text-slate-900 font-sans">
        1. Project Details and Other specific Conditions
      </h3>

      <div className="space-y-1.5 text-[10.5px] text-slate-800 pl-3">
        <div className="flex justify-between items-baseline py-0.5">
          <span>Details of parties</span>
          <span className="font-mono text-slate-600">2</span>
        </div>
        <div className="flex justify-between items-baseline py-0.5">
          <span>Quotation Strategy & Scope</span>
          <span className="font-mono text-slate-600">2</span>
        </div>
        <div className="flex justify-between items-baseline py-0.5">
          <span>Terms & Conditions</span>
          <span className="font-mono text-slate-600">3</span>
        </div>

        {/* Sub terms list */}
        {termsList.map((term) => (
          <div key={term.no} className="flex justify-between items-baseline pl-4 text-slate-700 py-0.5">
            <span>{term.title}</span>
            <span className="font-mono text-slate-500">3</span>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-dotted border-slate-300">
        <div className="flex items-center justify-between font-bold text-[12px] text-slate-900">
          <span>2. Price schedule</span>
          <span className="flex-1 mx-2 border-b border-dotted border-slate-400 self-end mb-1" />
          <span className="font-mono">5</span>
        </div>
      </div>
    </div>
  );

  // =========================================================================
  // PAGE 2: Details of Parties & Scope (Matches Uploaded PDF Page 2)
  // =========================================================================
  const renderPage2 = () => (
    <div className="space-y-5">
      <h3 className="font-bold text-[13px] text-slate-900 font-sans">
        1. Project Details and Other specific Conditions
      </h3>

      {/* 1.1 Details of Parties Table */}
      <table className="w-full border-collapse border border-slate-300 text-[10px]">
        <thead>
          <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300">
            <th className="p-2 border-r border-slate-300 w-14 text-left">No:</th>
            <th className="p-2 text-left">Description</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-300">
          <tr>
            <td className="p-2 border-r border-slate-300 font-bold align-top">1.1</td>
            <td className="p-2 font-bold text-slate-900">Details of parties</td>
          </tr>
          <tr>
            <td className="p-2 border-r border-slate-300 align-top">1.1.1</td>
            <td className="p-2 text-slate-800 leading-relaxed">
              <p className="font-semibold mb-1">The purchaser is,</p>
              <p className="font-bold text-slate-900">{quote?.client?.name || 'Metropolitan Real Estate'}</p>
              {quote?.client?.tradeName && <p className="font-medium text-slate-700">{quote.client.tradeName}</p>}
              <p className="text-slate-600">{quote?.client?.address || '45, Galle Road, Colombo 03, Sri Lanka'}</p>
              <p className="text-slate-600">Phone: {quote?.client?.phone || '+94 11 234 5678'}</p>
              {quote?.client?.email && <p className="text-slate-600">Email: {quote.client.email}</p>}
              <p className="text-slate-600">VAT No: {quote?.client?.taxNo || '100234567-0000'}</p>
            </td>
          </tr>
          <tr>
            <td className="p-2 border-r border-slate-300 align-top">1.1.2</td>
            <td className="p-2 text-slate-800 leading-relaxed">
              <p className="font-semibold mb-1">The Company Name of bidder:</p>
              <p className="font-bold text-slate-900">{settings?.name || 'Innovista Metal'}</p>
              <p className="text-slate-600">{settings?.address || 'Kelaniya, Sri Lanka'}</p>
              <p className="text-slate-600">{settings?.phone || '0773726224'}</p>
            </td>
          </tr>
          <tr>
            <td className="p-2 border-r border-slate-300 align-top">1.1.3</td>
            <td className="p-2 text-slate-800 leading-relaxed">
              <p className="font-semibold mb-1">Work Site Location:</p>
              <p className="text-slate-700">{quote?.workSiteLocation || 'Colombo, Sri Lanka'}</p>
            </td>
          </tr>
        </tbody>
      </table>

      {/* 1.2 Quotation Strategy & Scope Table */}
      <table className="w-full border-collapse border border-slate-300 text-[10px]">
        <thead>
          <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300">
            <th className="p-2 border-r border-slate-300 w-14 text-left">No:</th>
            <th className="p-2 text-left">Description</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-300">
          <tr>
            <td className="p-2 border-r border-slate-300 font-bold align-top">1.2</td>
            <td className="p-2 font-bold text-slate-900">Quotation Strategy & Scope</td>
          </tr>
          <tr>
            <td className="p-2 border-r border-slate-300 align-top">1.2.1</td>
            <td className="p-2 text-slate-800">
              <span className="font-semibold">Pricing Method:</span> {quote?.pricingMethod || 'Unit Rate'}
            </td>
          </tr>
          <tr>
            <td className="p-2 border-r border-slate-300 align-top">1.2.2</td>
            <td className="p-2 text-slate-800">
              <span className="font-semibold">Project Stage:</span> {quote?.projectStage || 'Detailed BOQ'}
            </td>
          </tr>
          <tr>
            <td className="p-2 border-r border-slate-300 align-top">1.2.3</td>
            <td className="p-2 text-slate-800">
              <span className="font-semibold">Scope Coverage:</span> {quote?.scopeCoverage || 'Turnkey'}
            </td>
          </tr>
        </tbody>
      </table>

      {/* 1.3 Terms & Conditions Header & Initial Clauses */}
      <div>
        <h4 className="font-bold text-[11.5px] text-slate-900 mb-2">1.3 Terms & Conditions</h4>
        <table className="w-full border-collapse border border-slate-300 text-[10px]">
          <thead>
            <tr className="bg-[#1D4ED8] text-white font-bold border-b border-[#1D4ED8]">
              <th className="p-2 border-r border-blue-400 w-14 text-left">No:</th>
              <th className="p-2 text-left">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-300">
            {termsList.slice(0, 2).map((t) => (
              <tr key={t.no}>
                <td className="p-2 border-r border-slate-300 font-bold align-top">{t.no}</td>
                <td className="p-2 text-slate-800 leading-relaxed">
                  <p className="font-bold uppercase text-[9.5px] text-slate-900 mb-0.5">{t.title}</p>
                  <p className="text-slate-700">{t.content}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // =========================================================================
  // PAGE 3: Terms & Conditions Continuation (Matches Uploaded PDF Page 3)
  // =========================================================================
  const renderPage3 = () => (
    <div className="space-y-4">
      <table className="w-full border-collapse border border-slate-300 text-[9.5px]">
        <thead>
          <tr className="bg-[#1D4ED8] text-white font-bold border-b border-[#1D4ED8]">
            <th className="p-2 border-r border-blue-400 w-14 text-left">No:</th>
            <th className="p-2 text-left">Description</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-300">
          {termsList.slice(2, 13).map((t) => (
            <tr key={t.no}>
              <td className="p-1.5 border-r border-slate-300 font-bold align-top">{t.no}</td>
              <td className="p-1.5 text-slate-800 leading-relaxed">
                <p className="font-bold uppercase text-[9px] text-slate-900 mb-0.5">{t.title}</p>
                <p className="text-slate-700">{t.content}</p>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // =========================================================================
  // PAGE 4: Terms & Conditions Final (Matches Uploaded PDF Page 4)
  // =========================================================================
  const renderPage4 = () => (
    <div className="space-y-4">
      <table className="w-full border-collapse border border-slate-300 text-[9.5px]">
        <thead>
          <tr className="bg-[#1D4ED8] text-white font-bold border-b border-[#1D4ED8]">
            <th className="p-2 border-r border-blue-400 w-14 text-left">No:</th>
            <th className="p-2 text-left">Description</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-300">
          {termsList.slice(13).map((t) => (
            <tr key={t.no}>
              <td className="p-2 border-r border-slate-300 font-bold align-top">{t.no}</td>
              <td className="p-2 text-slate-800 leading-relaxed">
                <p className="font-bold uppercase text-[9.5px] text-slate-900 mb-0.5">{t.title}</p>
                <p className="text-slate-700">{t.content}</p>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // =========================================================================
  // PAGE 5: Price Schedule & BOQ (Matches Uploaded PDF Page 5)
  // =========================================================================
  const renderPage5 = () => {
    const boqItems = quote?.items && quote.items.length > 0 ? quote.items : [
      {
        no: '1',
        name: 'SLIMLINE BLACK ANODIZED GLASS PARTITION 10MM',
        description: 'Minimalist 25mm profile aluminium partition with 10mm clear toughened safety glass and clear polycarbonate dry joints for maximum acoustic transparency.',
        unit: 'sqft',
        qty: 180,
        rate: 2150,
        discountPercent: 0,
        amount: 387000
      },
      {
        no: '2',
        name: 'FRAMELESS GLASS SWING DOOR WITH OVERHEAD TRANSOM',
        description: '10mm tempered glass door with German hydraulic patch fittings, lever latch, and satin stainless steel drop-down acoustic seal.',
        unit: 'Set',
        qty: 2,
        rate: 78000,
        discountPercent: 0,
        amount: 156000
      }
    ];

    return (
      <div className="space-y-4">
        {/* Section Title & Subheading */}
        <div>
          <h3 className="font-bold text-[14px] text-slate-900 font-sans">
            2. Price schedule
          </h3>
          <p className="text-[10px] font-semibold text-slate-800 uppercase mt-1">
            PROPOSED {projectName.toUpperCase()} @ {quote?.client?.phone || '+94 11 234 5678'}, {quote?.client?.address || '45, Galle Road, Colombo 03, Sri Lanka'}
          </p>
          <p className="text-[9.5px] font-medium text-slate-700 uppercase">
            {(quote?.pricingMethod || 'UNIT RATE').toUpperCase()} | {(quote?.projectStage || 'DETAILED BOQ').toUpperCase()} | {(quote?.scopeCoverage || 'TURNKEY').toUpperCase()}
          </p>
          <p className="text-[11px] font-bold text-slate-900 uppercase mt-0.5">
            BILL OF QUANTITIES
          </p>
        </div>

        {/* BOQ Table */}
        <table className="w-full border-collapse border border-slate-300 text-[9.5px]">
          <thead>
            <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300">
              <th className="p-1.5 border-r border-slate-300 w-8 text-center">No:</th>
              <th className="p-1.5 border-r border-slate-300 text-left">DESCRIPTION</th>
              <th className="p-1.5 border-r border-slate-300 w-14 text-center">PVC QR</th>
              <th className="p-1.5 border-r border-slate-300 w-11 text-center">UNIT</th>
              <th className="p-1.5 border-r border-slate-300 w-11 text-center">QTY</th>
              <th className="p-1.5 border-r border-slate-300 w-14 text-right">RATE</th>
              <th className="p-1.5 border-r border-slate-300 w-11 text-center">Dis.%</th>
              <th className="p-1.5 border-r border-slate-300 w-14 text-right">Dis.RATE</th>
              <th className="p-1.5 text-right w-20">AMOUNT</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-300">
            {boqItems.map((item, idx) => {
              const discountedRate = item.rate * (1 - (item.discountPercent || 0) / 100);
              const qrVal = (item as any).pvcCode || `${docRef}-${item.no || idx + 1}`;

              return (
                <tr key={(item as any).id || idx}>
                  <td className="p-1.5 border-r border-slate-300 text-center font-bold align-top text-slate-800">
                    {item.no || idx + 1}
                  </td>
                  <td className="p-1.5 border-r border-slate-300 text-slate-800 align-top">
                    <p className="font-bold text-[9.5px] uppercase text-slate-900">
                      {item.name}
                    </p>
                    {item.description && (
                      <p className="text-[8.5px] text-slate-600 mt-0.5 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </td>
                  <td className="p-1 border-r border-slate-300 text-center align-top">
                    <div className="flex flex-col items-center justify-center">
                      <QRCodeSVG value={qrVal} size={24} level="L" />
                      <span className="text-[6.5px] font-mono text-slate-500 mt-0.5 block truncate max-w-[50px]">
                        {qrVal}
                      </span>
                    </div>
                  </td>
                  <td className="p-1.5 border-r border-slate-300 text-center text-slate-700 align-top font-mono">
                    {item.unit}
                  </td>
                  <td className="p-1.5 border-r border-slate-300 text-center text-slate-800 align-top font-mono">
                    {item.qty?.toLocaleString()}
                  </td>
                  <td className="p-1.5 border-r border-slate-300 text-right text-slate-800 align-top font-mono">
                    {item.rate?.toLocaleString()}
                  </td>
                  <td className="p-1.5 border-r border-slate-300 text-center text-slate-600 align-top font-mono">
                    {item.discountPercent || 0}%
                  </td>
                  <td className="p-1.5 border-r border-slate-300 text-right text-slate-800 align-top font-mono">
                    {discountedRate.toLocaleString()}
                  </td>
                  <td className="p-1.5 text-right font-bold text-slate-900 align-top font-mono">
                    {item.amount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Totals Summary Grid (Matches exact PDF format) */}
        <div className="flex justify-end pt-1">
          <div className="w-[300px] border border-slate-300 text-[10px]">
            <div className="flex justify-between p-1.5 border-b border-slate-300 font-bold bg-white">
              <span className="text-slate-800">Sub Total</span>
              <span className="font-mono text-slate-900">{totals.subTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between p-1.5 border-b border-slate-300 font-medium text-slate-700 bg-white">
              <span>(-) Special Discounts</span>
              <span className="font-mono">{totals.discountPercent}%</span>
            </div>
            <div className="flex justify-between p-1.5 border-b border-slate-300 font-medium text-slate-700 bg-white">
              <span>Tax ({totals.taxPercent}% Incl.)</span>
              <span className="font-mono">{totals.taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between p-1.5 border-b border-slate-300 font-black text-slate-900 bg-slate-50">
              <span>Grand Total</span>
              <span className="font-mono">Rs. {totals.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between p-1.5 font-bold text-slate-800 bg-white">
              <span>{totals.advancePercent}% Advance Amount required for initiating the works</span>
              <span className="font-mono">{totals.advanceAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* PAYMENT SCHEDULE Table */}
        <div className="pt-2">
          <h4 className="font-bold text-[10.5px] uppercase text-slate-900 mb-1">
            PAYMENT SCHEDULE:
          </h4>
          <table className="w-full border-collapse border border-slate-300 text-[9.5px]">
            <thead>
              <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300">
                <th className="p-1.5 border-r border-slate-300 text-left">PHASE</th>
                <th className="p-1.5 border-r border-slate-300 w-28 text-center">PERCENTAGE</th>
                <th className="p-1.5 w-36 text-right">AMOUNT (LKR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300">
              {paymentScheduleRows.map((tier, idx) => (
                <tr key={idx}>
                  <td className="p-1.5 border-r border-slate-300 text-slate-800">{tier.phase}</td>
                  <td className="p-1.5 border-r border-slate-300 text-center font-mono">{tier.percentage}</td>
                  <td className="p-1.5 text-right font-mono font-bold text-slate-900">{tier.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Large Total display */}
        <div className="text-right pt-1">
          <span className="text-[13px] font-black text-slate-900 font-mono">
            LKR {totals.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* Full Amount in Word */}
        <div className="text-[10px] text-slate-700 leading-tight">
          <p className="font-bold text-slate-900 mb-0.5">Full Amount in Word:</p>
          <p className="italic text-slate-600">{totals.words}</p>
        </div>

        {/* Bank Details for Payments */}
        <div className="text-[9.5px] text-slate-800 leading-tight pt-1">
          <p className="font-bold text-slate-900 mb-1">Bank Details for Payments:</p>
          <div className="space-y-0.5 pl-0.5">
            <p><span className="text-slate-600">Bank:</span> <span className="font-medium text-slate-900">{defaultBank.bankName}</span></p>
            <p><span className="text-slate-600">Branch:</span> <span className="font-medium text-slate-900">{defaultBank.branchName}</span></p>
            <p><span className="text-slate-600">Account Name:</span> <span className="font-medium text-slate-900">{defaultBank.accountName}</span></p>
            <p><span className="text-slate-600">Account No:</span> <span className="font-bold font-mono text-slate-900">{defaultBank.accountNumber}</span></p>
            {defaultBank.swiftCode && (
              <p><span className="text-slate-600">SWIFT:</span> <span className="font-mono text-slate-900">{defaultBank.swiftCode}</span></p>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Other Document Types (Invoice, Project, Variation, Audit Log, Customer Reports)
  const renderOtherDocContent = () => {
    if (type === 'Invoice' && invoice) {
      return (
        <div className="space-y-4">
          <h3 className="font-bold text-[13px] text-slate-900 font-sans">
            Tax Invoice & Statement of Billing
          </h3>
          <div className="grid grid-cols-2 gap-4 border border-slate-300 p-3 text-[10px]">
            <div>
              <p className="font-bold uppercase text-slate-500 mb-1">Billed To (Purchaser)</p>
              <p className="font-bold text-slate-900 text-[11px]">{invoice.client?.name}</p>
              <p className="text-slate-600">{invoice.client?.address}</p>
              <p className="text-slate-600">VAT Reg: {invoice.client?.taxNo || 'N/A'}</p>
            </div>
            <div className="border-l border-slate-200 pl-3 space-y-1">
              <p><span className="text-slate-500">Invoice Ref:</span> <span className="font-mono font-bold text-slate-900">{invoice.invoiceNo}</span></p>
              <p><span className="text-slate-500">Purchase Order:</span> <span className="font-mono">{invoice.purchaseOrderNo || 'N/A'}</span></p>
              <p><span className="text-slate-500">Project:</span> <span className="font-bold text-slate-900">{invoice.projectName}</span></p>
              <p><span className="text-slate-500">Payment Status:</span> <span className="font-bold text-emerald-600 uppercase">{invoice.status}</span></p>
            </div>
          </div>

          <table className="w-full border-collapse border border-slate-300 text-[9.5px]">
            <thead>
              <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300">
                <th className="p-1.5 border-r border-slate-300 w-8 text-center">#</th>
                <th className="p-1.5 border-r border-slate-300 text-left">Description</th>
                <th className="p-1.5 border-r border-slate-300 w-14 text-center">Qty</th>
                <th className="p-1.5 border-r border-slate-300 w-12 text-center">Unit</th>
                <th className="p-1.5 border-r border-slate-300 w-20 text-right">Rate</th>
                <th className="p-1.5 text-right w-24">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300">
              {invoice.items?.map((item, idx) => (
                <tr key={idx}>
                  <td className="p-1.5 border-r border-slate-300 text-center font-mono">{idx + 1}</td>
                  <td className="p-1.5 border-r border-slate-300 font-medium text-slate-900">{item.description}</td>
                  <td className="p-1.5 border-r border-slate-300 text-center font-mono">{item.qty}</td>
                  <td className="p-1.5 border-r border-slate-300 text-center text-slate-600">{item.unit}</td>
                  <td className="p-1.5 border-r border-slate-300 text-right font-mono">{item.rate?.toLocaleString()}</td>
                  <td className="p-1.5 text-right font-bold font-mono text-slate-900">{item.amount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end pt-2">
            <div className="w-[280px] border border-slate-300 text-[10px]">
              <div className="flex justify-between p-1.5 border-b border-slate-300 bg-white">
                <span className="text-slate-700">Sub Total:</span>
                <span className="font-mono font-bold">{invoice.subTotal?.toLocaleString()} {currency}</span>
              </div>
              <div className="flex justify-between p-1.5 border-b border-slate-300 bg-white">
                <span className="text-slate-700">Tax Total:</span>
                <span className="font-mono">{invoice.taxTotal?.toLocaleString()} {currency}</span>
              </div>
              <div className="flex justify-between p-1.5 border-b border-slate-300 font-bold bg-slate-50 text-slate-900">
                <span>Grand Total:</span>
                <span className="font-mono">Rs. {invoice.grandTotal?.toLocaleString()} {currency}</span>
              </div>
              <div className="flex justify-between p-1.5 font-bold text-rose-600 bg-white">
                <span>Balance Due:</span>
                <span className="font-mono">{invoice.balanceDue?.toLocaleString()} {currency}</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (type === 'AuditLog') {
      return (
        <div className="space-y-4">
          <h3 className="font-bold text-[13px] text-slate-900 font-sans">
            System Security & Cryptographic Audit Ledger
          </h3>
          <table className="w-full border-collapse border border-slate-300 text-[9.5px]">
            <thead>
              <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300">
                <th className="p-1.5 border-r border-slate-300 w-32 text-left">Timestamp</th>
                <th className="p-1.5 border-r border-slate-300 w-28 text-left">Action</th>
                <th className="p-1.5 border-r border-slate-300 w-24 text-left">User</th>
                <th className="p-1.5 text-left">Ledger Verification Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300 font-mono text-[9px]">
              {auditLogsList.slice(0, 15).map((log, idx) => (
                <tr key={log.id || idx}>
                  <td className="p-1.5 border-r border-slate-300 text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="p-1.5 border-r border-slate-300 font-bold text-slate-800">{log.action}</td>
                  <td className="p-1.5 border-r border-slate-300 text-slate-700">{log.user}</td>
                  <td className="p-1.5 text-slate-700 font-sans">{log.details || 'Passes ISO compliance verification'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    // Generic project/customer report fallback
    return (
      <div className="space-y-4">
        <h3 className="font-bold text-[13px] text-slate-900 font-sans">
          {docTitle} - {projectName}
        </h3>
        <p className="text-[10.5px] text-slate-700">
          Official engineering deliverables and contractual verification documents for {customerName || 'Innovista Commercial Division'}.
        </p>
        <table className="w-full border-collapse border border-slate-300 text-[9.5px]">
          <thead>
            <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300">
              <th className="p-1.5 border-r border-slate-300 w-8 text-center">#</th>
              <th className="p-1.5 border-r border-slate-300 text-left">Scope Deliverable</th>
              <th className="p-1.5 border-r border-slate-300 w-16 text-center">Qty</th>
              <th className="p-1.5 border-r border-slate-300 w-24 text-center">Status</th>
              <th className="p-1.5 text-right w-24">Amount ({currency})</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-300">
            {(project?.items || quote?.items || []).slice(0, 8).map((it, idx) => (
              <tr key={idx}>
                <td className="p-1.5 border-r border-slate-300 text-center font-mono">{idx + 1}</td>
                <td className="p-1.5 border-r border-slate-300 font-medium text-slate-800">{it.name}</td>
                <td className="p-1.5 border-r border-slate-300 text-center font-mono">{it.qty} {it.unit}</td>
                <td className="p-1.5 border-r border-slate-300 text-center text-[8.5px] font-bold text-slate-700">{it.variationStatus || 'Primary Scope'}</td>
                <td className="p-1.5 text-right font-mono font-bold text-slate-900">{it.amount?.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div 
      className="origin-top transition-transform duration-200 select-text flex flex-col items-center"
      style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
    >
      {/* Page Selector Bar above sheets in live studio */}
      {type === 'Quote' && (
        <div className="no-print mb-4 flex items-center gap-1.5 bg-white border border-slate-200 p-1.5 rounded-xl shadow-xs text-xs font-medium text-slate-700">
          <span className="text-[10px] uppercase font-bold text-slate-400 px-2">Sheets:</span>
          {[
            { id: 'all', label: 'All Pages (Print Sequence)' },
            { id: 1, label: 'Page 1: Contents' },
            { id: 2, label: 'Page 2: Parties & Scope' },
            { id: 3, label: 'Page 3: Terms 1.2.3 - 1.2.13' },
            { id: 4, label: 'Page 4: Terms 1.2.14 - 1.2.15' },
            { id: 5, label: 'Page 5: Price Schedule & BOQ' },
          ].map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedPage(p.id as any)}
              className={`px-2.5 py-1 rounded-lg text-xs transition-colors cursor-pointer ${
                selectedPage === p.id 
                  ? 'bg-[#1D4ED8] text-white font-bold shadow-xs' 
                  : 'hover:bg-slate-100 text-slate-600'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      {/* Render Pages based on selected view mode */}
      <div id="printable-area" className="w-full flex flex-col items-center">
        {type === 'Quote' ? (
          <>
            {(selectedPage === 'all' || selectedPage === 1) && renderSheet(1, renderPage1())}
            {(selectedPage === 'all' || selectedPage === 2) && renderSheet(2, renderPage2())}
            {(selectedPage === 'all' || selectedPage === 3) && renderSheet(3, renderPage3())}
            {(selectedPage === 'all' || selectedPage === 4) && renderSheet(4, renderPage4())}
            {(selectedPage === 'all' || selectedPage === 5) && renderSheet(5, renderPage5())}
          </>
        ) : (
          renderSheet(1, renderOtherDocContent())
        )}
      </div>
    </div>
  );
};
