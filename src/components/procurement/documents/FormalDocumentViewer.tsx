import React, { useRef, useState } from 'react';
import { Printer, X, Download, Loader2, FileSpreadsheet } from 'lucide-react';
import { UniversalDocFormData } from '../../../services/procurementDocTypes';
import { generateUniversalDocumentPDF, getCompanyLogoDataUrl } from '../../../pdfGenerator';
import { saveAs } from 'file-saver';

interface FormalDocumentViewerProps {
  formData: UniversalDocFormData;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: () => void;
}

export const FormalDocumentViewer: React.FC<FormalDocumentViewerProps> = ({
  formData,
  isOpen,
  onClose,
  onEdit
}) => {
  const printAreaRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    setIsExporting(true);
    try {
      await generateUniversalDocumentPDF(formData, undefined, true);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCSV = () => {
    let csv = `"${formData.docTitle}","${formData.docCode}","${formData.docRefNo}","${formData.date}"\n\n`;
    csv += `#,${formData.tableHeaders.map(h => `"${h}"`).join(',')}\n`;
    formData.tableRows.forEach((r, idx) => {
      csv += `${idx + 1},"${r.col1}","${r.col2}","${r.col3}","${r.col4}","${r.col5}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${formData.docCode}_${formData.docRefNo}.csv`);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[96vh] print:max-h-none print:border-none print:shadow-none print:w-full">
        {/* Top Control Bar (Hidden when printing) */}
        <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-orange-600 flex items-center justify-center font-bold text-xs text-white">
              {formData.docCode.split('-')[1] || 'DOC'}
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-100 flex items-center gap-2">
                <span>{formData.docTitle}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                  {formData.docRefNo}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                {formData.classification} • {formData.revision}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={onEdit}
                className="px-2.5 py-1.5 text-xs font-medium rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
              >
                Edit
              </button>
            )}
            <button
              onClick={handleExportCSV}
              className="px-2.5 py-1.5 text-xs font-medium rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Export CSV"
            >
              <FileSpreadsheet size={13} />
              <span>CSV</span>
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={isExporting}
              className="px-3 py-1.5 text-xs font-medium rounded-md bg-slate-800 hover:bg-slate-700 text-white flex items-center gap-1.5 border border-slate-700 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isExporting ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
              <span>Download PDF</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 text-xs font-medium rounded-md bg-orange-600 hover:bg-orange-500 text-white flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Printer size={13} />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors ml-1 cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Document Body */}
        <div className="overflow-y-auto p-4 sm:p-8 bg-slate-100/60 print:bg-white print:p-0 print:overflow-visible">
          <div
            id="printable-area"
            ref={printAreaRef}
            className="printable-sheet bg-white mx-auto shadow-sm border border-slate-200/80 p-6 sm:p-8 print:p-0 print:border-none print:shadow-none text-slate-900 font-sans max-w-[210mm] text-[11px] leading-relaxed"
            style={{ minHeight: '270mm' }}
          >
            {/* 1. Formal Document Header (Blue First Name, Blue Document Title, Top-Right Company Logo) */}
            <div
              className="border-b-2 border-blue-700 pb-3 mb-4 flex flex-col sm:flex-row justify-between items-start gap-4"
              style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
            >
              <div className="space-y-1 max-w-lg">
                <h1 className="font-extrabold text-base tracking-tight text-slate-900 uppercase">
                  <span
                    className="text-blue-700"
                    style={{ color: '#1d4ed8', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
                  >
                    INNOVISTA
                  </span>{' '}
                  <span>METAL FABRICONIX (PVT) LTD.</span>
                </h1>
                <div className="text-[10px] text-slate-600 font-medium">
                  ENGINEERING & STRATEGIC PROCUREMENT DIVISION
                </div>
                <div className="text-[9px] text-slate-500">
                  No. 50/B, Vishaka Place, Elapitiwela, Ragama, Sri Lanka | Tel: 077 1684 620
                </div>
              </div>

              {/* Right Header: Top-Right Company Logo ABOVE Document Title in actual width */}
              <div className="flex flex-col items-end text-right ml-auto">
                <img
                  src={getCompanyLogoDataUrl()}
                  alt="Innovista Company Logo"
                  className="h-12 w-auto max-w-[180px] object-contain mb-1.5"
                />
                <h2
                  className="text-sm font-extrabold uppercase tracking-tight text-blue-700"
                  style={{ color: '#1d4ed8', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
                >
                  {formData.docTitle}
                </h2>
                <div className="text-[9.5px] text-slate-700 font-semibold mt-0.5">
                  Date: {formData.date}
                </div>
                <div className="text-[9.5px] font-mono font-bold text-slate-900">
                  Ref: {formData.docRefNo} | {formData.revision}
                </div>
              </div>
            </div>

            {/* 2. Document Title & Control Matrix */}
            <div className="bg-slate-50 border border-slate-300 rounded p-2.5 mb-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-200 pb-2 mb-2">
                <div>
                  <h2
                    className="text-sm font-bold text-blue-700 uppercase tracking-wide"
                    style={{ color: '#1d4ed8', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
                  >
                    {formData.docTitle}
                  </h2>
                  <div className="text-[10px] text-slate-500 font-mono">
                    FORM CODE: {formData.docCode} • DOC #{formData.docNumber}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-800 text-white font-mono uppercase">
                    {formData.classification}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-orange-100 text-orange-800 border border-orange-200 font-mono">
                    {formData.revision}
                  </span>
                </div>
              </div>

              {/* Document Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                <div>
                  <span className="text-slate-500 block text-[9px]">Document Ref:</span>
                  <span className="font-mono font-semibold text-slate-800">{formData.docRefNo}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px]">Issuance Date:</span>
                  <span className="font-semibold text-slate-800">{formData.date}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px]">Effective Date:</span>
                  <span className="font-semibold text-slate-800">{formData.effectiveDate}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px]">Project Code:</span>
                  <span className="font-mono font-semibold text-slate-800">{formData.projectId}</span>
                </div>
              </div>
            </div>

            {/* 3. Project & Entity Context Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div className="border border-slate-200 rounded p-2.5 bg-white">
                <div className="text-[9px] font-bold uppercase text-slate-500 border-b border-slate-100 pb-1 mb-1.5 flex items-center gap-1">
                  <span>Project Context</span>
                </div>
                <div className="space-y-1 text-[10px]">
                  <div>
                    <span className="text-slate-500">Project Name: </span>
                    <span className="font-semibold text-slate-800">{formData.projectName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Location: </span>
                    <span className="text-slate-700">{formData.projectLocation}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Client / Employer: </span>
                    <span className="font-medium text-slate-800">{formData.clientName}</span>
                  </div>
                </div>
              </div>

              <div className="border border-slate-200 rounded p-2.5 bg-white">
                <div className="text-[9px] font-bold uppercase text-slate-500 border-b border-slate-100 pb-1 mb-1.5 flex items-center gap-1">
                  <span>Supplier / Vendor Reference</span>
                </div>
                <div className="space-y-1 text-[10px]">
                  <div>
                    <span className="text-slate-500">Vendor Name: </span>
                    <span className="font-semibold text-slate-800">{formData.vendorName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Vendor Code: </span>
                    <span className="font-mono text-slate-700">{formData.vendorCode}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Governance Status: </span>
                    <span className="text-emerald-700 font-semibold">Verified Compliant</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Structured Records Table (No empty blanks) */}
            <div className="mb-4">
              <div className="text-[10px] font-bold uppercase text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Formal Document Schedule & Records ({formData.tableRows.length} Items)</span>
                <span className="text-[9px] font-mono text-slate-500">ISO-9001 AUDIT VERIFIED</span>
              </div>
              <div className="border border-slate-300 rounded overflow-hidden">
                <table className="w-full border-collapse text-[10px]">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold">
                      <th className="py-1.5 px-2 text-left w-10">#</th>
                      <th className="py-1.5 px-2 text-left">{formData.tableHeaders[0]}</th>
                      <th className="py-1.5 px-2 text-left">{formData.tableHeaders[1]}</th>
                      <th className="py-1.5 px-2 text-left">{formData.tableHeaders[2]}</th>
                      <th className="py-1.5 px-2 text-left">{formData.tableHeaders[3]}</th>
                      <th className="py-1.5 px-2 text-left">{formData.tableHeaders[4]}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {formData.tableRows.map((row, idx) => (
                      <tr key={row.id || idx} className={idx % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'}>
                        <td className="py-1.5 px-2 text-slate-400 font-mono text-[9px]">{idx + 1}</td>
                        <td className="py-1.5 px-2 font-mono font-medium text-slate-900">{row.col1}</td>
                        <td className="py-1.5 px-2 text-slate-700">{row.col2}</td>
                        <td className="py-1.5 px-2 font-mono text-slate-800">{row.col3}</td>
                        <td className="py-1.5 px-2 text-slate-600">{row.col4}</td>
                        <td className="py-1.5 px-2 font-medium text-slate-800">{row.col5}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 5. Notes & Project Directives */}
            {formData.notes && (
              <div className="bg-slate-50 border border-slate-200 rounded p-2 mb-4 text-[9.5px]">
                <span className="font-bold text-slate-700 block text-[9px] uppercase mb-0.5">
                  Scope Notes & Directives:
                </span>
                <p className="text-slate-600 leading-snug">{formData.notes}</p>
              </div>
            )}

            {/* 6. Standard Contractual / Technical Clauses */}
            {formData.clauses && formData.clauses.length > 0 && (
              <div className="border border-slate-200 rounded p-2.5 mb-5 bg-white">
                <div className="text-[9px] font-bold uppercase text-slate-600 mb-1">
                  Mandatory Governance & Execution Clauses:
                </div>
                <ol className="list-decimal pl-4 space-y-1 text-[9px] text-slate-600">
                  {formData.clauses.map((clause, idx) => (
                    <li key={idx} className="leading-snug">{clause}</li>
                  ))}
                </ol>
              </div>
            )}

            {/* 7. Signatory Approval Block (3 to 4 Tiers) */}
            <div className="border-t-2 border-slate-900 pt-3 mt-4 break-inside-avoid">
              <div className="text-[9px] font-bold uppercase text-slate-500 mb-2">
                Executive & Technical Approval Signatories:
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[9px]">
                <div className="border border-slate-200 rounded p-2 bg-slate-50/50">
                  <span className="text-slate-400 block text-[8px] uppercase">Prepared By</span>
                  <span className="font-bold text-slate-800 block text-[10px] mt-0.5">{formData.preparedBy}</span>
                  <span className="text-slate-500 block text-[8.5px]">{formData.preparedRole}</span>
                  <div className="h-8 border-b border-dashed border-slate-300 my-1 flex items-end">
                    <span className="text-[8px] font-mono text-emerald-600">VERIFIED SIGNED</span>
                  </div>
                  <span className="text-[8px] text-slate-400 font-mono">Date: {formData.date}</span>
                </div>

                <div className="border border-slate-200 rounded p-2 bg-slate-50/50">
                  <span className="text-slate-400 block text-[8px] uppercase">Reviewed By</span>
                  <span className="font-bold text-slate-800 block text-[10px] mt-0.5">{formData.reviewedBy}</span>
                  <span className="text-slate-500 block text-[8.5px]">{formData.reviewedRole}</span>
                  <div className="h-8 border-b border-dashed border-slate-300 my-1 flex items-end">
                    <span className="text-[8px] font-mono text-emerald-600">TECHNICAL PASS</span>
                  </div>
                  <span className="text-[8px] text-slate-400 font-mono">Date: {formData.date}</span>
                </div>

                <div className="border border-slate-200 rounded p-2 bg-slate-50/50">
                  <span className="text-slate-400 block text-[8px] uppercase">Approved By</span>
                  <span className="font-bold text-slate-800 block text-[10px] mt-0.5">{formData.approvedBy}</span>
                  <span className="text-slate-500 block text-[8.5px]">{formData.approvedRole}</span>
                  <div className="h-8 border-b border-dashed border-slate-300 my-1 flex items-end">
                    <span className="text-[8px] font-mono text-emerald-600">EXECUTIVE PASS</span>
                  </div>
                  <span className="text-[8px] text-slate-400 font-mono">Date: {formData.date}</span>
                </div>

                <div className="border border-slate-200 rounded p-2 bg-slate-50/50">
                  <span className="text-slate-400 block text-[8px] uppercase">Authorized Entity</span>
                  <span className="font-bold text-slate-800 block text-[10px] mt-0.5">{formData.authorizedBy}</span>
                  <span className="text-slate-500 block text-[8.5px]">{formData.authorizedRole}</span>
                  <div className="h-8 border-b border-dashed border-slate-300 my-1 flex items-end">
                    <span className="text-[8px] font-mono text-emerald-600">SEALED & WITNESSED</span>
                  </div>
                  <span className="text-[8px] text-slate-400 font-mono">Date: {formData.date}</span>
                </div>
              </div>
            </div>

            {/* 8. Footer */}
            <div className="mt-4 pt-2 border-t border-slate-200 flex justify-between items-center text-[8px] text-slate-400 font-mono">
              <span>INNOVISTA ERP • SYSTEM GENERATED OFFICIAL DOCUMENT</span>
              <span>BARCODE REF: {formData.docRefNo}</span>
              <span>PAGE 1 OF 1</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
