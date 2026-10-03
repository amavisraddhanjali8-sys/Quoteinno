import React, { useState } from 'react';
import { BarcodeVisual } from './boq/BarcodeVisual';
import { Quote, numberToWords, PdfLayout, CompanySettings, Invoice, Project } from '../types';
import { FileText, Printer, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { InvoicePreview } from './InvoicePreview';
import { generateQuotePDF, generateInvoicePDF, generateProjectReportPDF, getCompanyLogoDataUrl } from '../pdfGenerator';

interface LivePreviewProps {
  quote: Quote | Invoice | Project;
  layout?: PdfLayout;
  settings?: CompanySettings;
  type?: 'Quote' | 'Project' | 'Invoice';
}

export const LivePreview: React.FC<LivePreviewProps> = ({ quote, layout = 'Detailed', settings, type = 'Quote' }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  
  const isInvoice = type === 'Invoice' || (quote as any).invoiceNo !== undefined;
  const isProject = type === 'Project' || (quote as any).status === 'In Progress' || (quote as any).status === 'Completed';
  
  const invoice = isInvoice ? (quote as Invoice) : null;
  const q = !isInvoice && !isProject ? (quote as Quote) : null;
  const p = isProject ? (quote as Project) : null;

  if (!quote) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-full items-center justify-center p-8 text-center">
        <FileText size={48} className="text-slate-200 mb-4" />
        <h3 className="text-lg font-bold text-slate-900 mb-2">No Data for Preview</h3>
        <p className="text-sm text-slate-500">Please select a valid document to view the live preview.</p>
      </div>
    );
  }

  const docSettings = quote.documentSettings || {
    fontSize: 10,
    accentColor: '#2563eb',
    showLogo: true,
    showBankDetails: true,
    showTimeline: false,
    showPaymentTiers: true,
    layoutType: layout
  };

  const subTotal = React.useMemo(() => {
    if (isInvoice) return invoice!.subTotal;
    if (isProject) return p!.totalValue;
    
    const pricingMethod = (q as any).pricingMethod || 'Unit Rate';
    const lumpSumAmount = (q as any).lumpSumAmount || 0;
    const marginPercent = (q as any).marginPercent || 0;

    if (pricingMethod === 'Lump Sum' && lumpSumAmount) {
      return lumpSumAmount;
    }
    const itemsTotal = q!.items.reduce((sum, item) => sum + item.amount, 0);
    if (pricingMethod === 'Cost Plus' && marginPercent) {
      return itemsTotal * (1 + marginPercent / 100);
    }
    return itemsTotal;
  }, [quote, isInvoice]);

  const discountAmount = isInvoice ? invoice!.discountTotal : (isProject ? 0 : subTotal * ((q!.discountPercent || 0) / 100));
  const additionalChargesTotal = isInvoice || isProject ? 0 : (q!.additionalCharges || []).reduce((sum, charge) => sum + charge.amount, 0);
  const totalBeforeTax = isInvoice ? (subTotal - discountAmount) : (isProject ? subTotal : (subTotal - discountAmount + additionalChargesTotal));
  
  const taxAmount = isInvoice 
    ? invoice!.taxTotal 
    : (isProject 
        ? (p!.isTaxInclusive ? totalBeforeTax - (totalBeforeTax / (1 + (p!.taxPercent || 0) / 100)) : totalBeforeTax * ((p!.taxPercent || 0) / 100))
        : (q!.isTaxInclusive 
            ? totalBeforeTax - (totalBeforeTax / (1 + (q!.taxPercent || 0) / 100))
            : totalBeforeTax * ((q!.taxPercent || 0) / 100)));
    
  const grandTotal = isInvoice ? invoice!.grandTotal : (isProject ? (p!.isTaxInclusive ? totalBeforeTax : totalBeforeTax + taxAmount) : (q!.isTaxInclusive ? totalBeforeTax : totalBeforeTax + taxAmount));
  const advanceAmount = isInvoice || isProject ? 0 : grandTotal * ((q!.advancePercent || 0) / 100);

  const docNo = isInvoice ? invoice!.invoiceNo : (isProject ? p!.originalQuoteNo || 'PROJ' : q!.quoteNo);
  const docDate = isInvoice ? invoice!.date : (isProject ? p!.startDate : q!.submittedDate);
  const docTitle = isInvoice ? `${invoice!.type} Invoice` : (isProject ? 'Project Status' : 'Quotation');

  const handlePrint = async () => {
    if (!quote) return;
    setIsGenerating(true);
    try {
      if (isInvoice && invoice) {
        await generateInvoicePDF(invoice, settings, false);
      } else if (isProject && p) {
        await generateProjectReportPDF(p, settings, false);
      } else if (q) {
        await generateQuotePDF(q, layout, settings, false);
      }
    } catch (error) {
      console.error('PDF Generation Error:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-full max-h-[800px]">
      <div className="bg-slate-800 p-4 text-white flex justify-between items-center">
        <div className="flex items-center gap-2">
          <FileText size={18} />
          <span className="font-bold text-sm tracking-tight">Document Preview ({layout})</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={handlePrint}
            disabled={isGenerating}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-tight transition-all no-print disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Printer size={14} />} 
            {isGenerating ? 'Generating...' : 'Print'}
          </button>
          <div className="text-[10px] font-bold tracking-tight text-slate-400">
            Innovista Fabriconix
          </div>
        </div>
      </div>

      <div id="printable-area" className="flex-1 overflow-y-auto p-8 font-serif leading-relaxed text-zinc-800" style={{ fontSize: `${docSettings.fontSize}px` }}>
        {isInvoice ? (
          <InvoicePreview invoice={invoice!} settings={settings} />
        ) : (
          <>
            {layout === 'Detailed' && (
              <div className="space-y-8 mb-12 border-b border-zinc-100 pb-12">
                <div
                  className="flex justify-between items-start gap-6"
                  style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
                >
                  <div className="max-w-lg">
                    <h1 className="text-xl font-extrabold leading-tight text-slate-900">
                      <span
                        className="text-blue-700"
                        style={{ color: docSettings.accentColor || '#1d4ed8', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
                      >
                        {(settings?.name || 'INNOVISTA METAL FABRICONIX (PVT) LTD.').split(' ')[0]}
                      </span>{' '}
                      <span className="text-slate-900">
                        {(settings?.name || 'INNOVISTA METAL FABRICONIX (PVT) LTD.').split(' ').slice(1).join(' ')}
                      </span>
                    </h1>
                    <p className="text-[9px] mt-1 text-zinc-500">
                      {settings?.address || 'No. 50/B, Vishaka Place, Elapitiwela, Ragama, Sri Lanka'} | Tel: {settings?.phone || '077 1684 620'}
                    </p>
                    <p className="text-[8px] text-zinc-400">Company Reg No : {'{ PV 00326118 }'}</p>
                  </div>
                  <div className="flex flex-col items-end text-right ml-auto">
                    {docSettings.showLogo !== false && (
                      <img
                        src={getCompanyLogoDataUrl(settings?.logo)}
                        alt="Company Logo"
                        className="h-12 w-auto max-w-[180px] object-contain mb-1.5"
                      />
                    )}
                    <h2
                      className="text-lg font-extrabold tracking-tight uppercase text-blue-700"
                      style={{ color: docSettings.accentColor || '#1d4ed8', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
                    >
                      {docTitle}
                    </h2>
                    <div className="mt-1 space-y-0.5 text-[10px] font-bold text-slate-800">
                      <p>Date: {docDate}</p>
                      <p>Quote #: {docNo}</p>
                      {q?.validUntil && <p>Valid Until: {q.validUntil}</p>}
                    </div>
                  </div>
                </div>

                <div className="border-t-2 pt-4" style={{ borderColor: docSettings.accentColor }}>
                  <h2 className="font-bold text-sm mb-4">1. Project Details and Other specific Conditions</h2>
                  <div className="space-y-2">
                    <p className="font-bold underline">Details of parties</p>
                    <div className="grid grid-cols-[40px_1fr] gap-2 border border-zinc-200 p-2">
                      <span className="font-bold">1.1.1</span>
                      <div>
                        <p className="font-bold">The purchaser is,</p>
                        <p className="font-bold" style={{ color: docSettings.accentColor }}>{quote.client?.name || 'N/A'}</p>
                        {quote.client?.tradeName && <p>{quote.client.tradeName}</p>}
                        <p>{quote.client?.address || ''}</p>
                        <p>Phone: {quote.client?.phone || ''}</p>
                        {quote.client?.email && <p>Email: {quote.client.email}</p>}
                        {quote.client?.taxNo && <p>VAT No: {quote.client.taxNo}</p>}
                      </div>
                    </div>
                    <div className="grid grid-cols-[40px_1fr] gap-2 border border-zinc-200 p-2">
                      <span className="font-bold">1.1.2</span>
                      <div>
                        <p className="font-bold">The Company Name of bidder:</p>
                        <p>{settings?.name || 'INNOVISTA METAL FABRICONIX (PVT) LTD.'}</p>
                        <p>{settings?.address || 'No, 50/B, Vishaka Place, Elapitiwela, Ragama, Sri Lanka.'}</p>
                        <p>{settings?.phone || '077 1684 620 / 071 638 5608'}</p>
                      </div>
                    </div>
                    {!isInvoice && !isProject && q?.workSiteLocation && (
                      <div className="grid grid-cols-[40px_1fr] gap-2 border border-zinc-200 p-2">
                        <span className="font-bold">1.1.3</span>
                        <div>
                          <p className="font-bold">Work Site Location:</p>
                          <p>{q.workSiteLocation}</p>
                        </div>
                      </div>
                    )}
                    {!isInvoice && !isProject && q?.salesRepresentative && (
                      <div className="grid grid-cols-[40px_1fr] gap-2 border border-zinc-200 p-2">
                        <span className="font-bold">1.1.4</span>
                        <div>
                          <p className="font-bold">Sales Representative:</p>
                          <p>{q.salesRepresentative}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t-2 pt-4 mt-8" style={{ borderColor: docSettings.accentColor }}>
                  <h2 className="font-bold text-sm mb-4">2. Quotation Strategy & Scope</h2>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="border border-zinc-200 p-3 rounded-xl bg-zinc-50">
                      <p className="text-[8px] font-bold text-zinc-400 tracking-tight mb-1">Pricing method</p>
                      <p className="text-xs font-bold">{isProject ? 'Project' : (q?.pricingMethod || 'Unit Rate')}</p>
                    </div>
                    <div className="border border-zinc-200 p-3 rounded-xl bg-zinc-50">
                      <p className="text-[8px] font-bold text-zinc-400 tracking-tight mb-1">Project stage</p>
                      <p className="text-xs font-bold">{isProject ? p?.status : (q?.projectStage || 'Execution')}</p>
                    </div>
                    <div className="border border-zinc-200 p-3 rounded-xl bg-zinc-50">
                      <p className="text-[8px] font-bold text-zinc-400 tracking-tight mb-1">Scope coverage</p>
                      <p className="text-xs font-bold">{isProject ? 'Full' : (q?.scopeCoverage || 'Full')}</p>
                    </div>
                  </div>
                  
                  {!isInvoice && !isProject && q?.projectStage === 'Budgetary' && q.confidenceLevel && (
                    <div className="mt-4 p-3 border border-amber-200 bg-amber-50 rounded-xl">
                      <p className="text-[10px] font-bold text-amber-800">Budgetary Confidence Level: {q.confidenceLevel}%</p>
                      <p className="text-[9px] text-amber-700">Note: This is a preliminary estimate based on current data. Final pricing may vary by +/- {100 - q.confidenceLevel}%.</p>
                    </div>
                  )}
                  
                  {!isInvoice && !isProject && q?.justification && (
                    <div className="mt-4 p-3 border border-blue-200 bg-blue-50 rounded-xl">
                      <p className="text-[10px] font-bold text-blue-800 tracking-tight mb-1">Justification / revision notes</p>
                      <p className="text-[10px] text-blue-700 whitespace-pre-wrap">{q.justification}</p>
                    </div>
                  )}
                </div>

                <div className="mt-8">
                  <h2 className="font-bold text-sm mb-4">3. Terms & Conditions</h2>
                  <div className="space-y-4">
                    {(Array.isArray(quote.terms) ? quote.terms : []).filter(t => t.isActive).map(term => (
                      <div key={term.id} className="grid grid-cols-[40px_1fr] gap-2 border border-zinc-200 p-2">
                        <span className="font-bold">{term.no}</span>
                        <div>
                          <p className="font-bold">{term.title}:</p>
                          <p className="text-zinc-600">{term.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {layout === 'Summary' && (
              <div className="space-y-8 mb-12">
            <div className="text-center border-b-2 border-zinc-900 pb-4">
              <h2 className="text-2xl font-bold tracking-tight">{isInvoice ? 'Invoice summary' : (isProject ? 'Project summary' : 'Budgetary proposal')}</h2>
              <p className="text-sm text-zinc-500">{isInvoice ? invoice!.projectName : (isProject ? p!.projectName : q!.projectName)}</p>
            </div>
            <div className="bg-zinc-50 p-6 rounded-xl border border-zinc-200">
              <h3 className="font-bold mb-4">{isInvoice ? 'Billing overview' : (isProject ? 'Project overview' : 'Proposal overview')}</h3>
              <p className="text-sm leading-relaxed text-zinc-600">
                {isInvoice 
                  ? `This invoice is for the ${invoice!.projectName || 'project'} works. Please review the itemized billing below.`
                  : (isProject 
                      ? `This summary report covers the current status of the ${p!.projectName} project.`
                      : `This budgetary proposal covers the estimated costs for the ${q!.projectName} project. Please note that these figures are for preliminary planning purposes and are subject to detailed site measurement and final specification confirmation.`)}
              </p>
            </div>
            <div className="flex justify-between items-center p-6 bg-zinc-900 text-white rounded-xl">
              <span className="text-lg font-bold">{isInvoice ? 'Invoice total' : (isProject ? 'Project value' : 'Estimated project value')}</span>
              <span className="text-2xl font-bold">Rs. {grandTotal.toLocaleString()}</span>
            </div>
          </div>
        )}

        {layout === 'Executive' && (
          <div className="space-y-6 mb-12">
            <h2 className="text-xl font-bold border-b-2 border-zinc-900 pb-2">Executive Scope Summary</h2>
            <div className="grid grid-cols-1 gap-4">
              {quote.items.map(item => (
                <div key={item.id} className="p-4 border border-zinc-200 rounded-xl bg-zinc-50">
                  <h3 className="font-bold text-sm mb-1">{item.name}</h3>
                  <p className="text-[10px] text-zinc-600 line-clamp-2">{item.description}</p>
                  <div className="mt-2 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-zinc-400">Qty: {item.qty} {item.unit}</span>
                    <span className="text-xs font-bold">Rs. {item.amount.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 p-6 bg-zinc-900 text-white rounded-xl text-center">
              <p className="text-xs tracking-tight text-zinc-400 mb-1">Total investment</p>
              <p className="text-3xl font-bold">Rs. {grandTotal.toLocaleString()}</p>
            </div>
          </div>
        )}

        {(layout === 'Detailed' || layout === 'Compact') && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold border-b-2 border-zinc-900 pb-2">
              {isInvoice ? 'Invoice Items' : (isProject ? 'Project BOQ' : (layout === 'Detailed' ? '4. Price Schedule' : 'Quotation Summary'))}
            </h2>
            <div className="text-[10px] space-y-1">
              <p className="font-bold">
                {isInvoice 
                  ? `${invoice!.type} Invoice for ${invoice!.projectName || 'Project'}`
                  : (isProject 
                      ? `Project: ${p!.projectName} | Status: ${p!.status}`
                      : `Proposed ${q!.projectName} @ ${q!.client.phone}, ${q!.client.address}`)}
              </p>
              {isInvoice && invoice?.tag && (
                <p className="text-blue-600 font-bold">Tag: {invoice.tag}</p>
              )}
              {!isInvoice && !isProject && <p>{q!.pricingMethod} | {q!.projectStage} | {q!.scopeCoverage}</p>}
              <p className="font-bold">{isInvoice ? 'Itemized Billing' : 'Bill of Quantities'}</p>
            </div>

            <table className="w-full border-collapse border border-zinc-300">
              <thead>
                <tr className="text-[10px] text-white" style={{ backgroundColor: docSettings.accentColor }}>
                  <th className="border border-zinc-300 p-1 text-left">No:</th>
                  <th className="border border-zinc-300 p-1 text-left">Description</th>
                  <th className="border border-zinc-300 p-1 text-center">PVC QR</th>
                  {layout === 'Detailed' && <th className="border border-zinc-300 p-1 text-left">Unit</th>}
                  <th className="border border-zinc-300 p-1 text-right">Qty</th>
                  {layout === 'Detailed' && <th className="border border-zinc-300 p-1 text-right">Rate</th>}
                  <th className="border border-zinc-300 p-1 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {quote.items.map((item, idx) => {
                  const isTitle = item.itemType === 'Title';
                  const isSub = item.itemType === 'Sub';
                  const isMain = item.itemType === 'Main';

                  if (isTitle) {
                    return (
                      <tr key={item.id || idx} className="text-[10px] bg-slate-100 font-bold border-y-2 border-slate-300">
                        <td className="border border-zinc-300 p-1.5 font-bold font-mono text-blue-900 bg-blue-50/50 w-12 text-center">
                          {item.no || `${idx + 1}.0`}
                        </td>
                        <td colSpan={layout === 'Detailed' ? 6 : 4} className="border border-zinc-300 p-1.5 font-bold uppercase tracking-wider text-slate-900 bg-slate-100">
                          {item.name || 'SECTION TITLE'}
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={item.id || idx} className={`text-[10px] ${isMain ? 'bg-zinc-50/70 font-semibold' : ''} ${isSub ? 'text-zinc-600' : ''}`}>
                      <td className="border border-zinc-300 p-1 font-mono text-center">{item.no}</td>
                      <td className={`border border-zinc-300 p-1 ${isSub ? 'pl-5' : ''}`}>
                        <div className="flex items-center gap-1.5">
                          {isSub && <span className="text-zinc-400 font-bold">└─</span>}
                          <p className={isMain ? "font-bold text-zinc-900" : "font-medium text-zinc-800"}>{item.name}</p>
                        </div>
                        {layout === 'Detailed' && (
                          <div className={isSub ? 'pl-4' : ''}>
                            <p className="text-zinc-500 text-[9px] whitespace-pre-wrap">{item.description}</p>
                            {item.calculations && <p className="text-[8px] text-zinc-400">{item.calculations}</p>}
                          </div>
                        )}
                      </td>
                      <td className="border border-zinc-300 p-1 text-center">
                        {item.pvcCode ? (
                          <div className="flex flex-col items-center gap-0.5 min-w-[50px]">
                            <div className="p-0.5 bg-white border border-zinc-200 rounded">
                              <BarcodeVisual 
                                value={item.pvcCode} 
                                format="CODE128"
                                width={1.0}
                                height={18}
                                displayValue={false}
                              />
                            </div>
                            <span className="text-[6px] font-mono font-bold text-zinc-500 tracking-tighter uppercase">{item.pvcCode}</span>
                          </div>
                        ) : '-'}
                      </td>
                      {layout === 'Detailed' && <td className="border border-zinc-300 p-1 text-center">{item.unit}</td>}
                      <td className="border border-zinc-300 p-1 text-right">
                        {item.unit === 'Note' || item.unit === 'None' ? '-' : `${item.qty.toLocaleString()} ${layout === 'Compact' ? item.unit : ''}`}
                      </td>
                      {layout === 'Detailed' && (
                        <td className="border border-zinc-300 p-1 text-right font-mono">
                          {item.unit === 'Note' ? '-' : item.rate.toLocaleString()}
                        </td>
                      )}
                      <td className="border border-zinc-300 p-1 text-right font-bold font-mono">
                        {item.unit === 'Note' ? '-' : item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Measurement Sheet Section - Only for Detailed */}
            {layout === 'Detailed' && quote.items.some(i => i.measurements) && (
            <div className="mt-12 pt-8 border-t-2 border-dashed border-zinc-200">
              <h2 className="text-lg font-bold mb-4 tracking-tight">5. Measurement Details (Annexure)</h2>
              <div className="space-y-8">
                {quote.items.filter(i => i.measurements).map(item => (
                  <div key={item.id} className="space-y-2">
                    <div className="flex justify-between items-end border-b border-zinc-900 pb-1">
                      <h3 className="font-bold text-sm">Item {item.no}: {item.name}</h3>
                      <span className="text-[10px] font-bold">Method: {item.measurements?.method}</span>
                    </div>
                    <table className="w-full border-collapse border border-zinc-300">
                      <thead>
                        <tr className="bg-zinc-50 text-[8px] font-bold">
                          <th className="border border-zinc-300 p-1 text-left">Description / Location</th>
                          <th className="border border-zinc-300 p-1 text-center w-12">Nos</th>
                          <th className="border border-zinc-300 p-1 text-center w-12">L (ft)</th>
                          <th className="border border-zinc-300 p-1 text-center w-12">W (ft)</th>
                          <th className="border border-zinc-300 p-1 text-center w-12">H (ft)</th>
                          <th className="border border-zinc-300 p-1 text-right w-20">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {item.measurements?.rows.map(row => (
                          <tr key={row.id} className="text-[8px]">
                            <td className="border border-zinc-300 p-1">{row.description}</td>
                            <td className="border border-zinc-300 p-1 text-center">{row.count}</td>
                            <td className="border border-zinc-300 p-1 text-center">{row.length || '-'}</td>
                            <td className="border border-zinc-300 p-1 text-center">{row.width || '-'}</td>
                            <td className="border border-zinc-300 p-1 text-center">{row.height || '-'}</td>
                            <td className="border border-zinc-300 p-1 text-right font-bold">{row.total.toLocaleString()}</td>
                          </tr>
                        ))}
                        <tr className="bg-zinc-50 text-[8px] font-bold">
                          <td colSpan={5} className="border border-zinc-300 p-1 text-right">Total Quantity ({item.unit})</td>
                          <td className="border border-zinc-300 p-1 text-right">{item.measurements?.totalQuantity.toLocaleString()}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <div className="w-64 space-y-2 text-right">
              <div className="flex justify-between border-b border-zinc-100 pb-1">
                <span className="text-zinc-500">Sub Total {(!isInvoice && !isProject && q!.pricingMethod === 'Cost Plus') && `(Incl. ${q!.marginPercent}% Margin)`}</span>
                <span className="font-bold">{subTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-100 pb-1">
                <span className="text-zinc-500">Discount {isInvoice || isProject ? '' : `(${q!.discountPercent}%)`}</span>
                <span className="font-bold text-emerald-600">-{discountAmount.toLocaleString()}</span>
              </div>
              {!isInvoice && !isProject && q!.additionalCharges.map(charge => (
                <div key={charge.id} className="flex justify-between border-b border-zinc-100 pb-1">
                  <span className="text-zinc-500">{charge.name}</span>
                  <span className="font-bold">+{charge.amount.toLocaleString()}</span>
                </div>
              ))}
              <div className="flex justify-between border-b border-zinc-100 pb-1">
                <span className="text-zinc-500">Tax {isInvoice ? '' : (isProject ? `(${p!.taxPercent}% ${p!.isTaxInclusive ? 'Incl.' : 'Excl.'})` : `(${q!.taxPercent}% ${q!.isTaxInclusive ? 'Incl.' : 'Excl.'})`)}</span>
                <span className="font-bold">{taxAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2">
                <span>Grand Total</span>
                <span className="text-zinc-900">{isInvoice ? 'Rs.' : (isProject ? p!.currency || 'Rs.' : q!.currency)} {grandTotal.toLocaleString()}</span>
              </div>

              {isInvoice && (
                <>
                  <div className="flex justify-between border-b border-zinc-100 pb-1 text-emerald-600">
                    <span>Amount Paid</span>
                    <span className="font-bold">{invoice!.amountPaid.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold pt-2 text-rose-600">
                    <span>Balance Due</span>
                    <span>Rs. {invoice!.balanceDue.toLocaleString()}</span>
                  </div>
                </>
              )}

              {/* Payment Tiers Section */}
              {!isInvoice && docSettings.showPaymentTiers && (isProject ? p!.paymentTiers : q!.paymentTiers) && (isProject ? p!.paymentTiers : q!.paymentTiers)!.length > 0 && (
                <div className="mt-6 pt-4 border-t border-zinc-200">
                  <h3 className="text-[10px] font-bold text-zinc-900 tracking-tight mb-3">Payment schedule</h3>
                  <div className="space-y-2">
                    {(isProject ? p!.paymentTiers : q!.paymentTiers)!.map((tier) => (
                      <div key={tier.id} className="flex justify-between items-center text-[10px] bg-zinc-50 p-2 rounded-lg border border-zinc-100">
                        <div className="flex flex-col">
                          <span className="font-bold text-zinc-900">{tier.phase}</span>
                          <span className="text-[8px] text-zinc-500">{tier.percentage}% of total</span>
                        </div>
                        <span className="font-bold font-mono">
                          {isProject ? p!.currency || 'Rs.' : q!.currency} {((grandTotal * tier.percentage) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!isInvoice && !isProject && (
                <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-100 mt-4">
                  <div className="flex justify-between text-[10px] font-bold text-zinc-500 mb-1">
                    <span>{q!.advancePercent}% Advance Required</span>
                    <span>Rs. {advanceAmount.toLocaleString()}</span>
                  </div>
                  <p className="text-[9px] text-zinc-400">Required for initiating the works</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-zinc-100">
            <p className="text-[10px] font-bold text-zinc-400 tracking-tight mb-2">Full amount in words</p>
            <p className="text-sm font-bold text-zinc-900 capitalize">{numberToWords(Math.floor(grandTotal))}</p>
          </div>

          {(!isInvoice && docSettings.showTimeline && (isProject ? p!.timeline : q!.timeline) && (isProject ? p!.timeline : q!.timeline)!.jobs.length > 0) && (
            <div className="mt-12 pt-8 border-t-2 border-zinc-900">
              <h2 className="text-lg font-bold mb-4 tracking-tight">Project Timeline</h2>
              <table className="w-full border-collapse border border-zinc-300">
                <thead>
                  <tr className="bg-zinc-50 text-[8px] font-bold">
                    <th className="border border-zinc-300 p-1 text-left">Job Title</th>
                    <th className="border border-zinc-300 p-1 text-left">Description</th>
                    <th className="border border-zinc-300 p-1 text-center">Start</th>
                    <th className="border border-zinc-300 p-1 text-center">End</th>
                    <th className="border border-zinc-300 p-1 text-center">Status</th>
                    <th className="border border-zinc-300 p-1 text-right">Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {(isProject ? p!.timeline : q!.timeline)!.jobs.map(job => (
                    <tr key={job.id} className="text-[8px]">
                      <td className="border border-zinc-300 p-1 font-bold">{job.title}</td>
                      <td className="border border-zinc-300 p-1 text-zinc-600">{job.description}</td>
                      <td className="border border-zinc-300 p-1 text-center">{job.startDate}</td>
                      <td className="border border-zinc-300 p-1 text-center">{job.endDate}</td>
                      <td className="border border-zinc-300 p-1 text-center">
                        <span className={cn(
                          "px-1 rounded-full",
                          job.status === 'Completed' ? "bg-emerald-50 text-emerald-600" :
                          job.status === 'In Progress' ? "bg-blue-50 text-blue-600" : "bg-zinc-50 text-zinc-600"
                        )}>
                          {job.status}
                        </span>
                      </td>
                      <td className="border border-zinc-300 p-1 text-right font-bold">{job.progress}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          </div>
        )}
        </>
      )}
    </div>

      <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center px-8">
        <div className="flex items-center gap-3">
          <div className="p-1 bg-white border border-slate-200 rounded">
            <BarcodeVisual 
              value={docNo || 'DOC-2026'} 
              format="CODE128"
              width={1.2}
              height={26}
              displayValue={true}
              fontSize={9}
            />
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tight">System verification barcode</span>
            <span className="text-[8px] text-slate-400 font-mono">this generate from innovista fabriconix system</span>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[9px] font-bold tracking-tight text-slate-700">INNOVISTA PRECISION SUITE</span>
          <span className="text-[8px] text-slate-400 font-mono">ISO 9001:2015 & ISO 14001:2015</span>
        </div>
      </div>
    </div>
  );
};
