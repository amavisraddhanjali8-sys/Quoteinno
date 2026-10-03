import React from 'react';
import { 
  ArrowLeft, 
  Printer, 
  Copy, 
  Edit3,
  FileText,
  ExternalLink,
  Folder,
  History,
  CreditCard,
  User,
  ShieldCheck
} from 'lucide-react';
import { Invoice, CompanySettings, InvoiceStatus } from '../types';
import { cn } from '../lib/utils';

interface InvoiceDetailViewProps {
  invoice: Invoice;
  settings: CompanySettings;
  onBack: () => void;
  onEdit?: (invoice: Invoice) => void;
  onPrint?: (invoice: Invoice) => void;
  onClone?: (invoice: Invoice) => void;
  onNavigateToProject?: (projectId: string, tab?: string) => void;
  onNavigateToQuote?: (quoteId: string) => void;
  onNavigateToVariationManager?: (projectId?: string) => void;
  onNavigateToAccounting?: (tab: 'overview' | 'payments' | 'adjustments' | 'ledgers' | 'reports', invoiceId?: string) => void;
  onNavigateToCustomerPortal?: (client: any) => void;
  onNavigateToVerification?: (invoiceNo: string) => void;
}

// Convert numbers to words for amount display
function numberToWords(amount: number): string {
  const rounded = Math.round(amount);
  if (rounded === 0) return 'Zero Only';
  
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  function convertGroup(num: number): string {
    let groupStr = '';
    if (num >= 100) {
      groupStr += ones[Math.floor(num / 100)] + ' Hundred ';
      num %= 100;
    }
    if (num >= 20) {
      groupStr += tens[Math.floor(num / 10)] + ' ';
      num %= 10;
    } else if (num >= 10) {
      groupStr += teens[num - 10] + ' ';
      num = 0;
    }
    if (num > 0) {
      groupStr += ones[num] + ' ';
    }
    return groupStr.trim();
  }

  if (rounded < 1000) {
    return 'LKR ' + convertGroup(rounded);
  }
  const millions = Math.floor(rounded / 1000000);
  const thousands = Math.floor((rounded % 1000000) / 1000);
  const remainder = rounded % 1000;
  
  let res = 'LKR ';
  if (millions > 0) res += `${convertGroup(millions)} Million `;
  if (thousands > 0) res += `${convertGroup(thousands)} Thousand `;
  if (remainder > 0) res += convertGroup(remainder);
  return res.trim() + ' Only';
}

export const InvoiceDetailView: React.FC<InvoiceDetailViewProps> = ({
  invoice,
  settings,
  onBack,
  onEdit,
  onPrint,
  onClone,
  onNavigateToProject,
  onNavigateToQuote,
  onNavigateToVariationManager,
  onNavigateToAccounting,
  onNavigateToCustomerPortal,
  onNavigateToVerification
}) => {
  const isPaid = invoice.status === InvoiceStatus.COLLECTED_PAYMENT || invoice.status === InvoiceStatus.PAID || (invoice.balanceDue !== undefined && invoice.balanceDue <= 0);
  const currencySymbol = settings.defaultCurrency || 'LKR';

  const handlePrint = () => {
    if (onPrint) {
      onPrint(invoice);
    } else {
      window.print();
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300 pb-12">
      {/* Top Action Ribbon */}
      <header className="bg-white border border-slate-200/90 px-5 py-3 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold"
          >
            <ArrowLeft size={15} />
            <span>Back to Invoices</span>
          </button>
          <div className="h-5 w-px bg-slate-200 hidden sm:block" />
          <div className="flex items-baseline gap-2">
            <h1 className="text-sm font-bold text-slate-900 font-mono">
              Invoice #{invoice.invoiceNo}
            </h1>
            <span className={cn(
              "text-[10px] font-bold px-2 py-0.5 rounded border uppercase",
              isPaid 
                ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                : invoice.status === InvoiceStatus.OVERDUE
                ? "bg-rose-50 text-rose-700 border-rose-200"
                : "bg-amber-50 text-amber-700 border-amber-200"
            )}>
              {isPaid ? 'Paid & Settled' : invoice.status}
            </span>
            <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              {invoice.type}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(invoice)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors shadow-2xs"
            >
              <Edit3 size={13} />
              <span>Edit Invoice</span>
            </button>
          )}

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs"
          >
            <Printer size={13} />
            <span>Print PDF</span>
          </button>

          {onClone && (
            <button
              type="button"
              onClick={() => onClone(invoice)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs"
            >
              <Copy size={13} />
              <span>Clone</span>
            </button>
          )}
        </div>
      </header>

      {/* Connected Dependencies & Cross-Portal Shortcut Bar */}
      <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <ShieldCheck size={13} className="text-emerald-500" /> Linked Portals:
          </span>

          {/* Project Link */}
          {invoice.projectId ? (
            <button
              type="button"
              onClick={() => onNavigateToProject?.(invoice.projectId!, 'variations')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-orange-50 text-orange-700 border border-orange-200 rounded-lg font-semibold transition-colors shadow-2xs"
              title="Open linked Project in Project Lifecycle"
            >
              <Folder size={12} className="text-orange-500" />
              <span>Project: {invoice.projectCode || invoice.projectId.slice(0, 10)}</span>
              <ExternalLink size={10} />
            </button>
          ) : (
            <span className="text-[11px] text-slate-400 italic">No Project FK</span>
          )}

          {/* Quotation Link */}
          {invoice.quoteId ? (
            <button
              type="button"
              onClick={() => onNavigateToQuote?.(invoice.quoteId!)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 rounded-lg font-semibold transition-colors shadow-2xs"
              title="Open linked Quotation"
            >
              <FileText size={12} className="text-blue-500" />
              <span>Quote: {invoice.quoteId.slice(0, 10)}</span>
              <ExternalLink size={10} />
            </button>
          ) : (
            <span className="text-[11px] text-slate-400 italic">No Quote FK</span>
          )}

          {/* Variation Manager Link */}
          {invoice.projectId && onNavigateToVariationManager && (
            <button
              type="button"
              onClick={() => onNavigateToVariationManager(invoice.projectId)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-semibold transition-colors shadow-2xs"
              title="Open Variation Manager"
            >
              <History size={12} className="text-emerald-500" />
              <span>Variations Hub</span>
              <ExternalLink size={10} />
            </button>
          )}

          {/* Accounting Ledger Link */}
          {onNavigateToAccounting && (
            <button
              type="button"
              onClick={() => onNavigateToAccounting('ledgers', invoice.id)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg font-semibold transition-colors shadow-2xs"
              title="View General Ledger & Payment Entries"
            >
              <CreditCard size={12} className="text-indigo-500" />
              <span>Finance Ledger</span>
              <ExternalLink size={10} />
            </button>
          )}

          {/* Customer Portal */}
          {invoice.client && onNavigateToCustomerPortal && (
            <button
              type="button"
              onClick={() => onNavigateToCustomerPortal(invoice.client)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-purple-50 text-purple-700 border border-purple-200 rounded-lg font-semibold transition-colors shadow-2xs"
              title="Open Customer Statement"
            >
              <User size={12} className="text-purple-500" />
              <span>Customer Portal</span>
              <ExternalLink size={10} />
            </button>
          )}
        </div>

        {/* Verification Link */}
        {onNavigateToVerification && (
          <button
            type="button"
            onClick={() => onNavigateToVerification(invoice.invoiceNo)}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900"
          >
            <span>Verify SVC Document Stamp</span>
            <ShieldCheck size={12} className="text-emerald-600" />
          </button>
        )}
      </div>

      {/* Main Invoice Printable Sheet */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 max-w-[1000px] mx-auto text-slate-800">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold text-base shadow-2xs">
                IM
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 leading-tight">
                  {settings.name || 'INNOVISTA METAL FABRICONIX (PVT) LTD.'}
                </h2>
                <span className="text-[10px] text-orange-600 font-bold uppercase tracking-wider">
                  Precision Engineering & Fabrication Suite
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-500 max-w-sm whitespace-pre-line">
              {settings.address || 'No. 50/B, Vishaka Place, Elapitiwela, Ragama, Sri Lanka'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Tel: {settings.phone || '077 1684 620'} · Email: {settings.email || 'innovistametal@gmail.com'}
            </p>
          </div>

          <div className="text-left sm:text-right space-y-1 sm:ml-auto">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block">
              {invoice.type} Invoice
            </span>
            <div className="text-2xl font-black font-mono text-slate-900">
              #{invoice.invoiceNo}
            </div>
            <p className="text-xs text-slate-500">
              Date: <span className="font-semibold text-slate-800">{invoice.date}</span>
            </p>
            <p className="text-xs text-slate-500">
              Due Date: <span className="font-semibold text-slate-800">{invoice.dueDate}</span>
            </p>
            {invoice.purchaseOrderNo && (
              <p className="text-xs text-slate-500">
                PO #: <span className="font-mono font-semibold text-slate-800">{invoice.purchaseOrderNo}</span>
              </p>
            )}
          </div>
        </div>

        {/* Bill To & Project Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 py-6 border-b border-slate-100 text-xs">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Billed To (Customer)
            </span>
            <p className="text-sm font-bold text-slate-900">{invoice.client?.name || 'General Client'}</p>
            <p className="text-slate-500 mt-0.5 whitespace-pre-line">{invoice.client?.address || 'Address not specified'}</p>
            <p className="text-slate-500 mt-0.5">Email: {invoice.client?.email || 'N/A'}</p>
            <p className="text-slate-500">Phone: {invoice.client?.phone || 'N/A'}</p>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Project &amp; Contract Reference
            </span>
            <p className="text-sm font-bold text-slate-900">{invoice.projectName || 'General Supply & Works'}</p>
            {invoice.projectId && (
              <p className="text-slate-500 font-mono text-[11px] mt-0.5">Project Code: {invoice.projectCode || invoice.projectId}</p>
            )}
            {invoice.quoteId && (
              <p className="text-slate-500 font-mono text-[11px]">Quote Ref: {invoice.quoteId}</p>
            )}
            {invoice.paymentTerms && (
              <p className="text-slate-500 mt-0.5">Terms: {invoice.paymentTerms}</p>
            )}
          </div>

          <div className="sm:text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Settlement Status
            </span>
            <div className="inline-block">
              <span className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold",
                isPaid 
                  ? "bg-emerald-100 text-emerald-800" 
                  : "bg-amber-100 text-amber-800"
              )}>
                <span className="w-2 h-2 rounded-full bg-current" />
                {isPaid ? 'Fully Paid & Cleared' : `Outstanding Balance: LKR ${(invoice.balanceDue || 0).toLocaleString()}`}
              </span>
            </div>
            {invoice.barcode && (
              <div className="mt-3 sm:flex sm:justify-end">
                <img src={invoice.barcode} alt="Barcode" className="h-9 w-auto opacity-80" />
              </div>
            )}
          </div>
        </div>

        {/* Line Items Table */}
        <div className="overflow-x-auto my-4">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-2.5 px-3 w-10 text-center">#</th>
                <th className="py-2.5 px-3">Item Specification &amp; Description</th>
                <th className="py-2.5 px-3 text-center w-16">Qty</th>
                <th className="py-2.5 px-3 text-center w-16">Unit</th>
                <th className="py-2.5 px-3 text-right w-28">Rate ({currencySymbol})</th>
                <th className="py-2.5 px-3 text-right w-32">Total ({currencySymbol})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoice.items && invoice.items.length > 0 ? (
                invoice.items.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-slate-50/50">
                    <td className="py-3 px-3 text-center text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                    <td className="py-3 px-3 font-medium text-slate-900">
                      <div>
                        <span>{item.description || item.name}</span>
                        {item.pvcCode && (
                          <span className="text-[10px] font-mono text-blue-600 ml-2 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                            {item.pvcCode}
                          </span>
                        )}
                        {item.variationStatus && (
                          <span className={cn(
                            "text-[9px] font-bold ml-2 px-1.5 py-0.5 rounded uppercase tracking-wider",
                            item.variationStatus === 'Additional' ? "bg-emerald-50 text-emerald-700" :
                            item.variationStatus === 'Omitted' ? "bg-rose-50 text-rose-700" :
                            "bg-slate-100 text-slate-600"
                          )}>
                            {item.variationStatus}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-semibold text-slate-800">{item.qty || 1}</td>
                    <td className="py-3 px-3 text-center text-slate-500">{item.unit || 'Nos'}</td>
                    <td className="py-3 px-3 text-right font-mono text-slate-700">{Number(item.rate || 0).toLocaleString()}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">{Number(item.amount || 0).toLocaleString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 italic">No line items specified.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Totals Summary */}
        <div className="flex justify-end pt-3 pb-6 border-t border-slate-200">
          <div className="w-80 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-mono font-bold text-slate-800">
                {currencySymbol} {Number(invoice.subTotal || invoice.grandTotal || 0).toLocaleString()}
              </span>
            </div>
            {invoice.discountTotal ? (
              <div className="flex justify-between text-emerald-600">
                <span>Discount:</span>
                <span className="font-mono">- {currencySymbol} {Number(invoice.discountTotal).toLocaleString()}</span>
              </div>
            ) : null}
            {invoice.taxTotal ? (
              <div className="flex justify-between text-slate-600">
                <span>Tax / VAT:</span>
                <span className="font-mono">+ {currencySymbol} {Number(invoice.taxTotal).toLocaleString()}</span>
              </div>
            ) : null}
            {invoice.retentionAmount ? (
              <div className="flex justify-between text-amber-600">
                <span>Retention Withheld ({invoice.retentionPercent || 5}%):</span>
                <span className="font-mono">- {currencySymbol} {Number(invoice.retentionAmount).toLocaleString()}</span>
              </div>
            ) : null}
            <div className="flex justify-between text-slate-900 font-bold text-sm pt-2 border-t border-slate-200">
              <span>Grand Total:</span>
              <span className="font-mono text-base text-slate-900">
                {currencySymbol} {Number(invoice.grandTotal || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-slate-500 pt-1">
              <span>Amount Paid:</span>
              <span className="font-mono text-emerald-600 font-bold">
                {currencySymbol} {Number(invoice.amountPaid || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-slate-900 font-bold pt-1 border-t border-slate-100">
              <span>Balance Due:</span>
              <span className="font-mono text-base text-amber-600 font-bold">
                {currencySymbol} {Number(invoice.balanceDue || 0).toLocaleString()}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 italic text-right pt-1">
              {numberToWords(invoice.grandTotal || 0)}
            </p>
          </div>
        </div>

        {/* Bank Settlement Info */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
          <p className="font-bold text-slate-800 flex items-center gap-1.5">
            <CreditCard size={13} className="text-emerald-600" />
            Remittance &amp; Bank Details
          </p>
          <p className="text-slate-600">
            Account Name: <strong>{settings.name || 'Innovista Metal Fabriconix (Pvt) Ltd'}</strong> · 
            Bank: <strong>{invoice.bankDetails?.bankName || settings.bankDetails?.[0]?.bankName || 'Commercial Bank'}</strong> · 
            Account #: <strong>{invoice.bankDetails?.accountNo || settings.bankDetails?.[0]?.accountNumber || '1000492819'}</strong> · 
            Branch: <strong>{invoice.bankDetails?.branchName || 'Colombo Main'}</strong>
          </p>
          <p className="text-[11px] text-slate-400">
            * Please mention Invoice #{invoice.invoiceNo} as reference when making payments.
          </p>
        </div>

        {/* Terms & Notes */}
        {invoice.terms && (
          <div className="mt-4 pt-4 border-t border-slate-200 text-[11px] text-slate-600 space-y-1">
            <p className="font-bold text-slate-800">Commercial Terms &amp; Conditions</p>
            <p className="whitespace-pre-line leading-relaxed">{invoice.terms}</p>
          </div>
        )}
      </div>
    </div>
  );
};
