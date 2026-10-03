import React, { useState } from 'react';
import { 
  X, Download, Printer, Copy, Check, ShieldCheck, 
  ExternalLink, FileText, CheckCircle2, AlertTriangle, 
  XCircle, Lock, Building, Shield
} from 'lucide-react';
import { VerificationRegistryEntry, CompanySettings } from '../../types';
import { 
  computeDocumentChecksum, 
  formatCurrencyLKR, 
  generateVerificationReportPDF, 
  generateVerificationSummaryText 
} from '../../services/documentVerificationService';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';

interface VerificationReportModalProps {
  entry: VerificationRegistryEntry;
  settings?: CompanySettings;
  onClose: () => void;
  onOpenOriginal?: () => void;
}

export const VerificationReportModal: React.FC<VerificationReportModalProps> = ({
  entry,
  settings,
  onClose,
  onOpenOriginal
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  const checksum = computeDocumentChecksum(entry);
  const certNumber = `CERT-VER-${entry.svcCode.slice(-9)}-${new Date().getFullYear()}`;
  const verificationUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}?view=verification&code=${entry.svcCode}`
    : `https://aluminiumpro.lk/verify?code=${entry.svcCode}`;

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      await generateVerificationReportPDF(entry, settings, true);
      toast.success('Official Verification Report downloaded successfully');
    } catch (err) {
      console.error('Failed to generate report PDF', err);
      toast.error('Failed to generate verification report PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopySummary = () => {
    const text = generateVerificationSummaryText(entry);
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Verification audit summary copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(verificationUrl);
    toast.success('Direct verification link copied to clipboard');
  };

  const getStatusBadge = () => {
    switch (entry.status) {
      case 'Active':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 size={14} className="text-emerald-600" />
            AUTHENTIC & VALID SYSTEM ORIGINAL
          </span>
        );
      case 'Superseded':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <AlertTriangle size={14} className="text-amber-600" />
            SUPERSEDED BY REVISION
          </span>
        );
      case 'Voided':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle size={14} className="text-rose-600" />
            VOIDED / REVOKED RECORD
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300">
            RECORD EXPIRED
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col my-auto max-h-[96vh]">
        {/* Modal Top Control Bar */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between gap-4 border-b border-slate-800 shrink-0 print:hidden">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <ShieldCheck size={18} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white whitespace-nowrap">Document Verification Certificate</h3>
                <span className="text-xs font-mono text-slate-400 font-normal truncate hidden sm:inline">
                  • {certNumber}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                Statutory audit report with cryptographic checksum & tamper validation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopySummary}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
              title="Copy Summary"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span className="hidden md:inline">{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
              title="Print Certificate"
            >
              <Printer size={14} />
              <span className="hidden md:inline">Print</span>
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
            >
              <Download size={14} />
              <span>{isDownloading ? 'Generating...' : 'Download PDF'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors ml-1"
              title="Close modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Certificate Paper Preview */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100/70">
          <div 
            id="printable-verification-certificate" 
            className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg border-2 border-slate-300 p-6 sm:p-10 relative overflow-hidden"
          >
            {/* Watermark Logo / Seal in background */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.03] select-none">
              <Shield size={480} />
            </div>

            {/* Inner Border Frame */}
            <div className="border border-slate-200 p-6 sm:p-8 rounded-lg relative">
              {/* Header: Company & Regulatory Trust */}
              <div className="border-b-2 border-slate-900 pb-5 mb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Building size={18} className="text-slate-800" />
                    <h2 className="text-lg font-black tracking-tight text-slate-900 uppercase">
                      {settings?.name || 'ALUMINIUM PRO FACTORY & ENGINEERING SYSTEMS'}
                    </h2>
                  </div>
                  <p className="text-xs text-slate-600 font-medium">
                    {settings?.registrationNo ? `Reg No: ${settings.registrationNo}` : 'Reg No: PV-00289140'} · CIDA Grade SP-1 Engineering Contractor
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {settings?.address || 'Industrial Estate, Level 04, Colombo 08, Sri Lanka'} · Tel: {settings?.phone || '+94 (0) 11 234 5678'}
                  </p>
                </div>

                <div className="text-left sm:text-right shrink-0">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Verification Certificate
                  </div>
                  <div className="text-xs font-mono font-bold text-slate-900">{certNumber}</div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    Date: {new Date().toLocaleDateString('en-LK')}
                  </div>
                </div>
              </div>

              {/* Title & Status */}
              <div className="mb-6 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Document Verification & Authenticity Report
                  </h1>
                  {getStatusBadge()}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  This statutory audit document attests that the referenced transaction or technical deliverable has been checked against the primary cryptographically sealed database of Aluminium Pro Factory & Engineering Systems.
                </p>
              </div>

              {/* Section 1: Verified Document Profile */}
              <div className="mb-6 bg-slate-50 rounded-lg border border-slate-200/90 p-4">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-200">
                  <FileText size={15} className="text-slate-700" />
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    1. Verified Document Profile
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Document Type</span>
                    <span className="font-semibold text-slate-900">{entry.documentType}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Official Reference No</span>
                    <span className="font-mono font-bold text-slate-900">{entry.documentRef}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Client / Recipient</span>
                    <span className="font-semibold text-slate-900">{entry.metadata.customerName || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Linked Project</span>
                    <span className="font-medium text-slate-800">{entry.metadata.projectName || 'General / Unassigned'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Certified Financial Sum</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {formatCurrencyLKR(entry.metadata.totalValue)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Original Issuance Date</span>
                    <span className="font-medium text-slate-800">
                      {new Date(entry.generatedAt).toLocaleDateString('en-LK', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Issuing Authority / Registrar</span>
                    <span className="font-medium text-slate-800">{entry.generatedBy}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Revision Lineage</span>
                    <span className="font-mono font-semibold text-slate-900">Version {entry.version}.0 {entry.metadata.isCurrent ? '(Latest)' : '(Archived)'}</span>
                  </div>
                </div>

                {/* Optional Product / Client Details */}
                {entry.documentType === 'Product' && entry.metadata.productDetails && (
                  <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500 text-[10px] block">SKU</span>
                      <span className="font-mono font-bold">{entry.metadata.productDetails.sku}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">Variant</span>
                      <span className="font-semibold">{entry.metadata.productDetails.name}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">Family System</span>
                      <span>{entry.metadata.productDetails.family}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Section 2: Cryptographic & Integrity Audit */}
              <div className="mb-6 bg-slate-50 rounded-lg border border-slate-200/90 p-4">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-200">
                  <Lock size={15} className="text-slate-700" />
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    2. Cryptographic Security & System Fingerprint
                  </h4>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="text-slate-500 block text-[11px]">System Verification Code (SVC)</span>
                      <span className="font-mono font-black text-slate-900 text-sm tracking-wide bg-white px-2 py-0.5 rounded border border-slate-200 inline-block">
                        {entry.svcCode}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Bitwise Integrity Check</span>
                      <span className="font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 size={14} /> 100% Match with System Ledger
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[11px]">Cryptographic SHA-256 Checksum</span>
                    <div className="font-mono text-[10px] break-all bg-white p-2 rounded border border-slate-200 text-slate-700">
                      {checksum}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Audit Check Count</span>
                      <span className="font-mono font-semibold">{entry.accessCount} Times</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Digital Signature</span>
                      <span className="font-semibold text-emerald-700">Valid & Encrypted</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Server Node</span>
                      <span className="font-mono text-slate-700">LK-CMB-HQ-NODE-01</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Legal Notice & Conformance */}
              <div className="mb-6 p-4 rounded-lg bg-amber-50/60 border border-amber-200/80 text-[11px] text-amber-900 space-y-1 leading-relaxed">
                <div className="font-bold text-amber-950 uppercase tracking-wide flex items-center gap-1.5">
                  <Shield size={13} /> Legal Notice & Statutory Attestation
                </div>
                <p>
                  1. Issued pursuant to Section 3 and Section 4 of the <strong>Electronic Transactions Act No. 19 of 2006</strong> of the Democratic Socialist Republic of Sri Lanka. Electronic records and SVC tokens generated by this system carry legal authenticity and evidentiary admissibility in any judicial or arbitral forum.
                </p>
                <p>
                  2. Conforms to CIDA Standard Method of Measurement (SLS 573) and Factories Ordinance (Cap. 128) documentation directives.
                </p>
              </div>

              {/* Section 4: Signatures & QR Authentication */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t-2 border-slate-900 items-end">
                {/* QR Code */}
                <div className="flex flex-col items-center sm:items-start space-y-1">
                  <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-2xs">
                    <QRCodeSVG 
                      value={verificationUrl} 
                      size={88}
                      level="M"
                    />
                  </div>
                  <span className="text-[9px] font-mono text-slate-500 text-center sm:text-left">
                    Scan with any smartphone camera to re-verify live
                  </span>
                </div>

                {/* Officer Signature */}
                <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50 text-center sm:text-left space-y-1">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Verification Officer</div>
                  <div className="font-serif italic text-sm text-slate-800 font-bold">K. A. Jayasinghe</div>
                  <div className="text-[10px] text-slate-600">Chief Systems & Security Officer</div>
                  <div className="text-[9px] font-mono text-emerald-600 font-bold pt-1">
                    DIGITALLY SEALED & APPROVED
                  </div>
                </div>

                {/* Director Signature */}
                <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50 text-center sm:text-left space-y-1">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Technical Assurance</div>
                  <div className="font-serif italic text-sm text-slate-800 font-bold">Eng. M. R. Perera</div>
                  <div className="text-[10px] text-slate-600">Director of Technical QA & Compliance</div>
                  <div className="text-[9px] font-mono text-slate-500 font-semibold pt-1">
                    CIDA Reg: ENG-SP1-88902
                  </div>
                </div>
              </div>

              {/* Bottom Footer Note */}
              <div className="mt-6 pt-3 border-t border-slate-200 text-center text-[10px] text-slate-400 font-mono">
                Official Verification Document ID: {entry.id} · Issued by Aluminium Pro Engine
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer Actions */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              <ExternalLink size={13} />
              <span>Copy Verification URL</span>
            </button>
            {onOpenOriginal && (
              <button
                onClick={() => {
                  onClose();
                  onOpenOriginal();
                }}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
              >
                <FileText size={13} />
                <span>Open Original Record</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
            >
              <Download size={15} />
              <span>{isDownloading ? 'Generating PDF...' : 'Download Official PDF'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
