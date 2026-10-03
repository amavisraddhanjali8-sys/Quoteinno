import React from 'react';
import { Invoice, CompanySettings, numberToWords, InvoiceType } from '../types';
import { getCompanyLogoDataUrl } from '../pdfGenerator';

interface InvoicePreviewProps {
  invoice: Invoice;
  settings?: CompanySettings;
}

export const InvoicePreview: React.FC<InvoicePreviewProps> = ({ invoice, settings }) => {
  let invoiceTitle = 'Invoice';
  if (invoice.type === InvoiceType.PROFORMA) invoiceTitle = 'Proforma Invoice';
  else if (invoice.type === InvoiceType.PROGRESS_BILLING) invoiceTitle = 'Progress Billing Invoice';
  else if (invoice.type === InvoiceType.STAGE_BILLING) invoiceTitle = 'Stage Billing Invoice';
  else if (invoice.type === InvoiceType.ADVANCE) invoiceTitle = 'Advance Payment Invoice';
  else if (invoice.type === InvoiceType.FINAL) invoiceTitle = 'Final Invoice';
  else if (invoice.type === InvoiceType.RECURRING) invoiceTitle = 'Recurring Invoice';
  else if (invoice.type === InvoiceType.RETENTION_CLAIM) invoiceTitle = 'Retention Claim Invoice';

  const companyFullName = settings?.name || 'INNOVISTA METAL FABRICONIX (PVT) LTD.';
  const firstCompanyWord = companyFullName.split(' ')[0] || 'INNOVISTA';
  const restCompanyWords = companyFullName.split(' ').slice(1).join(' ');

  return (
    <div className="relative group">
      <div
        className="bg-white font-sans text-slate-800 max-w-[850px] mx-auto shadow-2xl border border-slate-200 min-h-[1100px] flex flex-col overflow-hidden p-8"
        style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
      >
      {/* Header Section */}
      <div className="flex justify-between items-start gap-6 mb-6 pb-4 border-b-2 border-blue-700">
        <div className="flex flex-col max-w-md">
          <h1 className="text-2xl font-extrabold leading-tight text-slate-900">
            <span
              className="text-blue-700"
              style={{ color: '#1d4ed8', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
            >
              {firstCompanyWord}
            </span>{' '}
            <span>{restCompanyWords}</span>
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            {settings?.address?.replace(/\n/g, ', ') || 'No. 50/B, Vishaka Place, Elapitiwela, Ragama, Sri Lanka'}
          </p>
          <p className="text-xs text-slate-500">
            Tel: {settings?.phone || '077 1684 620'} | Email: {settings?.email || 'innovistametal@gmail.com'}
          </p>
        </div>

        <div className="flex flex-col items-end text-right ml-auto">
          <img
            src={getCompanyLogoDataUrl(settings?.logo)}
            alt="Company Logo"
            className="h-14 w-auto max-w-[190px] object-contain mb-2"
            referrerPolicy="no-referrer"
          />
          <h2
            className="text-2xl font-extrabold uppercase tracking-tight text-blue-700 mb-3"
            style={{ color: '#1d4ed8', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
          >
            {invoiceTitle}
          </h2>
          
          <div className="inline-block border border-slate-300">
            <table className="text-[11px] border-collapse">
              <tbody>
                <tr>
                  <td className="border border-slate-300 px-3 py-1 bg-slate-50 font-bold">Date</td>
                  <td className="border border-slate-300 px-3 py-1 bg-slate-50 font-bold">Invoice #</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 px-3 py-1">{invoice.date}</td>
                  <td className="border border-slate-300 px-3 py-1">{invoice.invoiceNo}</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 px-3 py-1 bg-slate-50 font-bold">Customer ID</td>
                  <td className="border border-slate-300 px-3 py-1 bg-slate-50 font-bold">Purchase Order #</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 px-3 py-1">{invoice.customerId || invoice.client.id.slice(0, 8)}</td>
                  <td className="border border-slate-300 px-3 py-1">{invoice.purchaseOrderNo || 'N/A'}</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 px-3 py-1 bg-slate-50 font-bold">Salesperson</td>
                  <td className="border border-slate-300 px-3 py-1 bg-slate-50 font-bold">Payment Terms</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 px-3 py-1">{invoice.salesperson || 'N/A'}</td>
                  <td className="border border-slate-300 px-3 py-1">{invoice.paymentTerms || 'N/A'}</td>
                </tr>
                <tr>
                  <td colSpan={2} className="border border-slate-300 px-3 py-1 bg-slate-50 font-bold">Sales Tax Rate</td>
                </tr>
                <tr>
                  <td colSpan={2} className="border border-slate-300 px-3 py-1">{invoice.salesTaxRate || invoice.taxPercent || 0}%</td>
                </tr>
                <tr>
                  <td colSpan={2} className="border border-slate-300 px-3 py-1 bg-slate-50 font-bold">Payment Due by</td>
                </tr>
                <tr>
                  <td colSpan={2} className="border border-slate-300 px-3 py-1">{invoice.dueDate}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Addresses Section */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="bg-blue-900 text-white text-[11px] font-bold px-3 py-1 mb-2">Bill To</h3>
          <div className="text-[11px] px-3 space-y-0.5">
            <p className="font-bold">{invoice.client.name}</p>
            {invoice.client.tradeName && <p>{invoice.client.tradeName}</p>}
            <p className="whitespace-pre-wrap">{invoice.client.address}</p>
            <p>Phone: {invoice.client.phone}</p>
          </div>
        </div>
        <div>
          <h3 className="bg-blue-900 text-white text-[11px] font-bold px-3 py-1 mb-2">Ship To (If Different)</h3>
          <div className="text-[11px] px-3 space-y-0.5">
            {invoice.shipTo ? (
              typeof invoice.shipTo === 'string' ? (
                <p className="whitespace-pre-wrap">{invoice.shipTo}</p>
              ) : (
                <>
                  <p className="font-bold">{invoice.shipTo.name}</p>
                  {invoice.shipTo.company && <p>{invoice.shipTo.company}</p>}
                  <p className="whitespace-pre-wrap">{invoice.shipTo.address}</p>
                  <p>Phone: {invoice.shipTo.phone}</p>
                </>
              )
            ) : (
              <p className="text-slate-300">Same as Bill To</p>
            )}
          </div>
        </div>
      </div>

      {/* Secondary Meta Table */}
      <div className="mb-8">
        <table className="w-full text-[11px] border-collapse border border-slate-300">
          <thead>
            <tr className="bg-blue-900 text-white font-bold">
              <th className="border border-slate-300 px-2 py-1 text-left">Shipping Method</th>
              <th className="border border-slate-300 px-2 py-1 text-left">Shipping Terms</th>
              <th className="border border-slate-300 px-2 py-1 text-left">Delivery Date</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-slate-300 px-2 py-1">{invoice.shippingMethod || 'N/A'}</td>
              <td className="border border-slate-300 px-2 py-1">{invoice.shippingTerms || 'N/A'}</td>
              <td className="border border-slate-300 px-2 py-1">{invoice.deliveryDate || 'N/A'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Items Table */}
      <div className="flex-1 mb-8">
        <table className="w-full text-[11px] border-collapse border border-slate-300">
          <thead>
            <tr className="bg-blue-900 text-white font-bold">
              <th className="border border-slate-300 px-2 py-1 text-left w-20">Item #</th>
              <th className="border border-slate-300 px-2 py-1 text-left">Description</th>
              <th className="border border-slate-300 px-2 py-1 text-center w-16">Qty</th>
              <th className="border border-slate-300 px-2 py-1 text-right w-24">Unit Price</th>
              <th className="border border-slate-300 px-2 py-1 text-right w-24">Line Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, idx) => (
              <tr key={item.id || idx} className={idx % 2 === 1 ? 'bg-slate-50' : ''}>
                <td className="border border-slate-300 px-2 py-2 font-mono">{item.itemNo || item.partNo || idx + 1}</td>
                <td className="border border-slate-300 px-2 py-2">
                  <p className="font-bold">{item.description}</p>
                  {item.variationStatus === 'Additional' && <span className="text-[9px] text-blue-600 font-bold">[Variation]</span>}
                </td>
                <td className="border border-slate-300 px-2 py-2 text-center">{item.qty}</td>
                <td className="border border-slate-300 px-2 py-2 text-right">{item.rate.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td className="border border-slate-300 px-2 py-2 text-right font-bold">{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              </tr>
            ))}
            {/* Fill empty rows to maintain height if needed, but flex-1 handles it */}
          </tbody>
        </table>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-12 gap-8 mb-8">
        <div className="col-span-7">
          <h3 className="bg-blue-900 text-white text-[11px] font-bold px-3 py-1 mb-2">Special Notes and Instructions</h3>
          <div className="border border-slate-300 p-3 text-[10px] min-h-[100px] whitespace-pre-wrap">
            {invoice.notes || 'Standard business terms apply.'}
            {invoice.chequeDetails?.chequeNo && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="font-bold text-[9px] text-slate-400">Cheque Details:</p>
                <p>Bank: {invoice.chequeDetails.bank} | No: {invoice.chequeDetails.chequeNo} | Date: {invoice.chequeDetails.date}</p>
              </div>
            )}
          </div>
        </div>
        <div className="col-span-5">
          <table className="w-full text-[11px] border-collapse">
            <tbody>
              <tr>
                <td className="border border-slate-300 px-3 py-1 text-right font-bold bg-slate-50">Subtotal</td>
                <td className="border border-slate-300 px-3 py-1 text-right w-32">{invoice.subTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr>
                <td className="border border-slate-300 px-3 py-1 text-right font-bold bg-slate-50">Sales Tax Rate</td>
                <td className="border border-slate-300 px-3 py-1 text-right">{invoice.salesTaxRate || invoice.taxPercent || 0}%</td>
              </tr>
              <tr>
                <td className="border border-slate-300 px-3 py-1 text-right font-bold bg-slate-50">Sales Tax</td>
                <td className="border border-slate-300 px-3 py-1 text-right">{invoice.taxTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr>
                <td className="border border-slate-300 px-3 py-1 text-right font-bold bg-slate-50">S&H</td>
                <td className="border border-slate-300 px-3 py-1 text-right">{invoice.shippingHandling?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}</td>
              </tr>
              <tr>
                <td className="border border-slate-300 px-3 py-1 text-right font-bold bg-slate-50">Discount</td>
                <td className="border border-slate-300 px-3 py-1 text-right text-rose-600">({invoice.discountTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })})</td>
              </tr>
              {invoice.retentionAmount !== undefined && invoice.retentionAmount > 0 && (
                <tr>
                  <td className="border border-slate-300 px-3 py-1 text-right font-bold bg-slate-50">Retention ({invoice.retentionPercent}%)</td>
                  <td className="border border-slate-300 px-3 py-1 text-right text-rose-600">({invoice.retentionAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })})</td>
                </tr>
              )}
              <tr className="bg-blue-900 text-white">
                <td className="border border-slate-300 px-3 py-2 text-right font-bold text-sm">Total</td>
                <td className="border border-slate-300 px-3 py-2 text-right font-bold text-sm">{invoice.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              </tr>
            </tbody>
          </table>
          <p className="text-[9px] text-right mt-2 text-slate-500">
            Amount in words: {numberToWords(invoice.grandTotal)}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto pt-6 border-t border-slate-200">
        <div className="flex justify-between items-end mb-6">
          <div className="text-[11px]">
            <p className="font-bold">Make all checks payable to {settings?.name || 'Your Company Name'}</p>
            <p className="text-blue-900 font-bold mt-2">Thank you for your business!</p>
          </div>
          
          <div className="text-center">
            <div className="w-48 border-b border-slate-400 h-12"></div>
            <p className="text-[9px] font-bold mt-1">Authorized Signature</p>
          </div>
        </div>

        <div className="text-[9px] text-slate-400 text-center space-y-1">
          <p>Should you have any enquiries concerning this invoice, please contact our office.</p>
          <p className="font-bold text-slate-600">
            {settings?.address.replace(/\n/g, ', ')} | Tel: {settings?.phone} | Email: {settings?.email}
          </p>
          {settings?.website && <p>Web: {settings.website}</p>}
        </div>
      </div>
    </div>
  </div>
  );
};
