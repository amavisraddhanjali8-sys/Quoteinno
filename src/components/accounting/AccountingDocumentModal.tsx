import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Printer,
  Download,
  X,
  FileText,
  CheckCircle2,
  Edit3,
  Trash2
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BarcodeVisual } from '../boq/BarcodeVisual';
import {
  generateBarcodeDataUrl,
  generateQRCodeDataUrl,
  getCompanyLogoDataUrl,
  sanitizePdfText
} from '../../pdfGenerator';
import { CompanySettings } from '../../types';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';
import { useSecurity } from '../../context/SecurityContext';

export interface AccountingDocumentSpec {
  docTitle: string;
  docNo: string;
  docDate: string;
  category: string;
  projectName?: string;
  projectId?: string;
  clientName?: string;
  partyName?: string;
  partyType?: 'Client' | 'Supplier' | 'Factory' | 'Subcontractor' | 'Employee' | 'General';
  factoryName?: string;
  factoryCode?: string;
  location?: string;
  responsibleOfficer?: string;
  priority?: string;
  status?: string;
  scheduleType?: string;
  workRef?: string;
  notes?: string;
  currency?: string;
  unpaidBalance?: number;
  strategyBox1Label?: string;
  strategyBox1Value?: string;
  strategyBox2Label?: string;
  strategyBox2Value?: string;
  strategyBox3Label?: string;
  strategyBox3Value?: string;
  keyDetails?: Array<{
    no?: string;
    item: string;
    details: string;
  }>;
  scheduleHeaders: string[];
  scheduleRows: Array<{
    col1: string;
    col2: string;
    col3: string;
    col4: string;
    col5: string;
    col6?: string;
    isHighlight?: boolean;
  }>;
  summaryTotals?: Array<{
    label: string;
    value: string;
  }>;
  terms?: Array<{
    title: string;
    content: string;
  }>;
  preparedBy: string;
  approvedBy: string;
  authorizationStatus: 'Approved' | 'Audited & Locked' | 'Pending Review';
  auditStamp: string;
  revisionNumber?: number;
  onDelete?: () => void;
  onApprove?: () => void;
}

interface AccountingDocumentModalProps {
  spec: AccountingDocumentSpec | null;
  isOpen: boolean;
  onClose: () => void;
  settings?: CompanySettings;
  canDownload?: boolean;
  isAdmin?: boolean;
  onAddNotification?: (title: string, message: string, type?: any) => void;
}

const FONT_SIZE = 10;

export const AccountingDocumentModal: React.FC<AccountingDocumentModalProps> = ({
  spec,
  isOpen,
  onClose,
  settings: _settings,
  canDownload = true,
  isAdmin: propIsAdmin,
  onAddNotification
}) => {
  const { currentUser, isAdminAuthority } = useSecurity();
  const userObj = currentUser as any;
  const isAdmin =
    propIsAdmin !== undefined
      ? propIsAdmin
      : isAdminAuthority ||
        Boolean(userObj?.role?.name?.toLowerCase().includes('admin')) ||
        Boolean(userObj?.roleName?.toLowerCase().includes('admin')) ||
        userObj?.role === 'admin' ||
        userObj?.role?.id === 'admin' ||
        userObj?.isAdmin;

  const [isExporting, setIsExporting] = useState(false);
  const [qrData, setQrData] = useState<string>('');
  const [showEditDrawer, setShowEditDrawer] = useState(false);
  const [isApproved, setIsApproved] = useState(false);

  // Editable fields
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editOfficer, setEditOfficer] = useState('');
  const [editRevision, setEditRevision] = useState(1);

  useEffect(() => {
    if (spec) {
      setEditTitle(spec.docTitle);
      setEditDate(spec.docDate);
      setEditStatus(spec.status || spec.authorizationStatus || 'Approved');
      setEditNotes(spec.notes || '');
      setEditOfficer(spec.responsibleOfficer || 'Sunil Jayawardena (Chief Accountant)');
      setEditRevision(spec.revisionNumber || 1);
      setIsApproved(spec.authorizationStatus === 'Approved' || spec.authorizationStatus === 'Audited & Locked');

      generateQRCodeDataUrl(`INNOVISTA:ACC:${spec.docNo}:${spec.docDate}:${spec.docTitle}`)
        .then(url => setQrData(url))
        .catch(() => setQrData(''));
    }
  }, [spec]);

  if (!isOpen || !spec) return null;

  const projectName = spec.projectName || 'Sirius Mall High-Rise Curtain Wall';
  const projectId = spec.projectId || 'PRJ-SM-2026';
  const factoryName = spec.factoryName || 'Innovista Central Facade & Curtain Wall Plant (Biyagama)';
  const factoryCode = spec.factoryCode || 'FAC-INV-01';
  const location = spec.location || '5-Axis CNC & Double Mitre Cutting Bay (Biyagama)';
  const officer = editOfficer || spec.responsibleOfficer || 'Sunil Jayawardena (Chief Accountant)';
  const status = editStatus || spec.status || 'Approved';
  const scheduleType = spec.scheduleType || 'Standard (0d Float)';
  const workRef = spec.workRef || spec.docNo;
  const notes = editNotes || spec.notes || 'Materials, labour, machinery and project financial allocations reconciled.';

  // Default key details if none provided
  const keyDetailsList = spec.keyDetails && spec.keyDetails.length > 0 ? spec.keyDetails : [
    {
      no: '2.1',
      item: 'Costing & Accounting Standard',
      details: 'Material POs, direct labour, machinery depreciation, and project markups mapped to General Ledger.'
    },
    {
      no: '2.2',
      item: 'Verification & Veracity',
      details: 'All financial postings reconciled with primary bank deposit vouchers and certified milestone sign-offs.'
    },
    {
      no: '2.3',
      item: 'Project & Warranty Connection',
      details: 'Retention held at 5% with Defect Liability Period (DLP) tied to official warranty certificate guarantees.'
    }
  ];

  const handlePrint = () => {
    window.print();
  };

  const handleApprove = () => {
    setIsApproved(true);
    setEditStatus('Approved');
    spec.onApprove?.();
    toast.success('Document Approved', {
      description: `${spec.docNo} has been verified and approved.`
    });
    onAddNotification?.(
      'Document Approved',
      `${spec.docTitle} (${spec.docNo}) was approved by ${currentUser?.fullName || (currentUser as any)?.name || currentUser?.username || 'Administrator'}.`,
      'success'
    );
  };

  const handleToggleEdit = () => {
    if (!isAdmin) {
      toast.error('Permission Denied', {
        description: 'Only system administrators can edit accounting documents.'
      });
      return;
    }
    setShowEditDrawer(prev => !prev);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    setEditRevision(prev => prev + 1);
    setShowEditDrawer(false);
    toast.success('Document Updated', {
      description: `Saved changes to ${spec.docNo} (Rev ${editRevision + 1}).`
    });
  };

  const handleDelete = () => {
    if (!isAdmin) {
      toast.error('Permission Denied', {
        description: 'Only administrators can delete financial records.'
      });
      return;
    }

    if (spec.unpaidBalance && spec.unpaidBalance > 0) {
      const warningText = `Cannot delete record: Outstanding balance of LKR ${spec.unpaidBalance.toLocaleString()} is not yet settled. All balances must be settled before deletion.`;
      toast.error('Cannot Delete Record', {
        description: warningText
      });
      onAddNotification?.('Deletion Blocked: Unpaid Balance', warningText, 'warning');
      return;
    }

    spec.onDelete?.();
    toast.success('Record Deleted', {
      description: `${spec.docNo} was removed from the system.`
    });
    onClose();
  };

  const handleDownloadPDF = async () => {
    if (!canDownload) {
      toast.error('Permission Denied', {
        description: 'You do not have permission to download official accounting documents.'
      });
      return;
    }

    try {
      setIsExporting(true);
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 14;

      // Header: INNOVISTA in blue, company title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(29, 78, 216); // Blue #1d4ed8
      doc.text('INNOVISTA', margin, 18);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text(' METAL FABRICONIX (PVT) LTD.', margin + 28, 18);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(
        'No. 50/B, Vishaka Place, Elapitiwela, Ragama, Sri Lanka | Tel: 077 1684 620',
        margin,
        23
      );

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(51, 65, 85);
      doc.text(`Project: ${sanitizePdfText(projectName)} (${sanitizePdfText(projectId)})`, margin, 28);
      doc.setFont('helvetica', 'normal');
      doc.text(`Factory / Entity: ${sanitizePdfText(factoryName)} (${sanitizePdfText(factoryCode)})`, margin, 32);

      // Top Right: Logo Box & Title
      const logoData = getCompanyLogoDataUrl();
      if (logoData) {
        try {
          doc.addImage(logoData, 'PNG', pageWidth - margin - 22, 10, 22, 22);
        } catch {
          // ignore
        }
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(29, 78, 216); // blue #1d4ed8
      doc.text(editTitle.toUpperCase(), pageWidth - margin, 38, { align: 'right' });

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(`Date: ${editDate}`, pageWidth - margin, 43, { align: 'right' });
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`Code: ${spec.docNo} | Rev ${editRevision}`, pageWidth - margin, 47, { align: 'right' });

      // Horizontal separator line
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.4);
      doc.line(margin, 51, pageWidth - margin, 51);

      // Section 1: Basic Information Table (Exact 4-column layout as uploaded screenshot)
      let currentY = 56;
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('1. Basic Information', margin, currentY);

      const basicInfoData = [
        ['Project', `${projectName} (${projectId})`, 'Factory / Entity', `${factoryName} (${factoryCode})`],
        ['Location', location, 'Person in Charge', officer],
        ['Type & Priority', spec.priority || 'Financial Voucher (Audited)', 'Status', status],
        ['Schedule Type', scheduleType, 'Work Ref', workRef],
        ['Notes', notes, '', '']
      ];

      autoTable(doc, {
        startY: currentY + 2,
        body: basicInfoData,
        theme: 'grid',
        styles: {
          fontSize: 7.5,
          cellPadding: 2,
          fillColor: [255, 255, 255],
          textColor: [15, 23, 42],
          lineColor: [203, 213, 225],
          lineWidth: 0.2
        },
        columnStyles: {
          0: { cellWidth: 32, fontStyle: 'bold', fillColor: [255, 255, 255] },
          1: { cellWidth: 58 },
          2: { cellWidth: 32, fontStyle: 'bold', fillColor: [255, 255, 255] },
          3: { cellWidth: 60 }
        },
        margin: { left: margin, right: margin }
      });

      currentY = (doc as any).lastAutoTable?.finalY + 7;

      // Section 2: Key Details Table (Matching uploaded screenshot)
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('2. Key Details', margin, currentY);

      const keyDetailsData = keyDetailsList.map((kd, idx) => [
        `2.${idx + 1}`,
        kd.item,
        kd.details
      ]);

      autoTable(doc, {
        startY: currentY + 2,
        head: [['No', 'Item', 'Details']],
        body: keyDetailsData,
        theme: 'grid',
        styles: {
          fontSize: 7.5,
          cellPadding: 2,
          fillColor: [255, 255, 255],
          textColor: [15, 23, 42],
          lineColor: [203, 213, 225],
          lineWidth: 0.2
        },
        headStyles: {
          fillColor: [255, 255, 255],
          textColor: [15, 23, 42],
          fontStyle: 'bold',
          lineColor: [203, 213, 225],
          lineWidth: 0.2
        },
        columnStyles: {
          0: { cellWidth: 14, fontStyle: 'bold' },
          1: { cellWidth: 50, fontStyle: 'bold' },
          2: { cellWidth: 118 }
        },
        margin: { left: margin, right: margin }
      });

      currentY = (doc as any).lastAutoTable?.finalY + 7;

      // Section 3: Financial Schedule / Line Items Table
      if (currentY > pageHeight - 75) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('3. Financial Schedule & Line Items', margin, currentY);

      const scheduleData = spec.scheduleRows.map((r, i) => [
        `3.${i + 1}`,
        r.col1,
        r.col2,
        r.col3,
        r.col4,
        r.col5
      ]);

      autoTable(doc, {
        startY: currentY + 2,
        head: [['No', ...spec.scheduleHeaders.slice(0, 5)]],
        body: scheduleData,
        theme: 'grid',
        styles: {
          fontSize: 7.5,
          cellPadding: 2,
          fillColor: [255, 255, 255],
          textColor: [15, 23, 42],
          lineColor: [203, 213, 225],
          lineWidth: 0.2
        },
        headStyles: {
          fillColor: [255, 255, 255],
          textColor: [15, 23, 42],
          fontStyle: 'bold',
          lineColor: [203, 213, 225],
          lineWidth: 0.2
        },
        columnStyles: {
          0: { cellWidth: 12, fontStyle: 'bold' },
          4: { halign: 'right' },
          5: { halign: 'right', fontStyle: 'bold' }
        },
        margin: { left: margin, right: margin }
      });

      currentY = (doc as any).lastAutoTable?.finalY + 6;

      // Summary Totals
      if (spec.summaryTotals && spec.summaryTotals.length > 0) {
        if (currentY > pageHeight - 45) {
          doc.addPage();
          currentY = 20;
        }

        spec.summaryTotals.forEach(tot => {
          doc.setFontSize(8.5);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(15, 23, 42);
          doc.text(`${tot.label}: ${tot.value}`, pageWidth - margin, currentY, { align: 'right' });
          currentY += 4.5;
        });
        currentY += 3;
      }

      // Section 4: Audit & Sign-off Table
      if (currentY > pageHeight - 55) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('4. Approval & Audit Sign-Off', margin, currentY);

      const approvalData = [
        ['1st Step: Financial Controller Check', `CHECKED & BALANCED - ${spec.preparedBy} (${editDate})`],
        ['2nd Step: Director of Finance / Admin', `${isApproved ? 'APPROVED' : 'PENDING APPROVAL'} - ${spec.approvedBy}`],
        ['System Verification Code', spec.auditStamp || `SYS-VERIFY-${spec.docNo}`]
      ];

      autoTable(doc, {
        startY: currentY + 2,
        body: approvalData,
        theme: 'grid',
        styles: {
          fontSize: 7.5,
          cellPadding: 2,
          fillColor: [255, 255, 255],
          textColor: [15, 23, 42],
          lineColor: [203, 213, 225],
          lineWidth: 0.2
        },
        columnStyles: {
          0: { cellWidth: 58, fontStyle: 'bold' },
          1: { cellWidth: 124 }
        },
        margin: { left: margin, right: margin }
      });

      // Bottom Barcode Footer (Exact match to screenshot bottom)
      const totalPages = doc.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        const footerY = pageHeight - 16;

        // Draw barcode image if generated
        const barcodeData = generateBarcodeDataUrl(spec.docNo);
        if (barcodeData) {
          try {
            doc.addImage(barcodeData, 'PNG', margin, footerY - 2, 42, 9);
          } catch {
            // ignore
          }
        }

        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(71, 85, 105);
        doc.text(`RECORD BARCODE: ${spec.docNo}`, margin + 46, footerY + 2);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(148, 163, 184);
        doc.text('Generated from Innovista System', margin + 46, footerY + 6);

        // Right side footer text
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text('INNOVISTA METAL FABRICONIX', pageWidth - margin, footerY + 2, { align: 'right' });
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text(`Rev ${editRevision} • Page ${p} of ${totalPages}`, pageWidth - margin, footerY + 6, { align: 'right' });
      }

      doc.save(`${spec.docNo}_${editTitle.replace(/\s+/g, '_')}.pdf`);
      toast.success('Document Downloaded', {
        description: `Exported ${spec.docNo} successfully.`
      });
    } catch (err) {
      console.error(err);
      toast.error('Export Failed', { description: 'Could not generate report PDF.' });
    } finally {
      setIsExporting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-300 w-full max-w-5xl max-h-[96vh] flex flex-col overflow-hidden">
        {/* ================== TOP ACTION BAR (MATCHES UPLOADED SCREENSHOT) ================== */}
        <div className="px-4 py-2.5 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          {/* Document Title & Code & Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="p-1 bg-blue-50 text-blue-700 rounded-md">
              <FileText size={16} />
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
              {editTitle} — {spec.docNo}
            </span>

            {/* Badges as shown in screenshot */}
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-300">
              {status} • Rev {editRevision}
            </span>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-300">
              1st FM: Checked
            </span>
            <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-300">
              2nd PM/Admin: {isApproved ? 'Approved' : 'Verified'}
            </span>
          </div>

          {/* Action Buttons: [Approve], [Edit], [Delete], [Print], [Download], [Close] */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={handleApprove}
              className="px-2.5 py-1.5 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              title="Approve this financial record"
            >
              <CheckCircle2 size={13} />
              <span>Approve</span>
            </button>

            <button
              onClick={handleToggleEdit}
              className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              title="Edit document details (Admin only)"
            >
              <Edit3 size={13} />
              <span>Edit</span>
            </button>

            <button
              onClick={handleDelete}
              className="px-2.5 py-1.5 bg-white hover:bg-rose-50 text-rose-600 border border-rose-300 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              title="Delete or void record (Admin only, requires settled balance)"
            >
              <Trash2 size={13} />
              <span>Delete</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Printer size={13} />
              <span>Print</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              disabled={isExporting}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-900 border border-slate-400 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
            >
              <Download size={13} />
              <span>{isExporting ? 'Generating...' : 'Download'}</span>
            </button>

            <button
              onClick={onClose}
              className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-600 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <X size={14} />
              <span>Close</span>
            </button>
          </div>
        </div>

        {/* Inline Edit Drawer (Admin only) */}
        {showEditDrawer && (
          <form
            onSubmit={handleSaveEdit}
            className="bg-slate-50 border-b border-slate-200 px-5 py-3 space-y-2.5 shrink-0"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Edit3 size={13} className="text-blue-600" />
                <span>Edit Financial Document (Admin Authority)</span>
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                New Revision: Rev {editRevision + 1}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                  Document Title
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                  Status
                </label>
                <select
                  value={editStatus}
                  onChange={e => setEditStatus(e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white"
                >
                  <option value="Approved">Approved</option>
                  <option value="Audited & Locked">Audited & Locked</option>
                  <option value="Pending Review">Pending Review</option>
                  <option value="Reconciled">Reconciled</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                  Document Date
                </label>
                <input
                  type="date"
                  value={editDate}
                  onChange={e => setEditDate(e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Audit notes or verification remark..."
                value={editNotes}
                onChange={e => setEditNotes(e.target.value)}
                className="flex-1 px-2.5 py-1 text-xs border border-slate-300 rounded bg-white"
              />
              <button
                type="submit"
                className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-bold cursor-pointer"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setShowEditDrawer(false)}
                className="px-3 py-1 bg-white border border-slate-300 text-slate-700 rounded text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* ================== DOCUMENT BODY (MATCHES UPLOADED SCREENSHOT) ================== */}
        <div
          id="printable-area"
          className="flex-1 overflow-y-auto px-6 sm:px-12 py-6 leading-relaxed text-slate-900 bg-white"
          style={{ fontSize: `${FONT_SIZE}px` }}
        >
          <div className="max-w-4xl mx-auto space-y-6 bg-white">
            {/* Header: Company Name in Blue & Dark Slate, Address, Project, Factory on Left. Logo & Title on Right */}
            <div
              className="flex flex-wrap justify-between items-start gap-4 border-b-2 border-blue-700 pb-4 bg-white"
              style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
            >
              <div className="max-w-xl">
                <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
                  <span
                    className="text-blue-700"
                    style={{ color: '#1d4ed8', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
                  >
                    INNOVISTA
                  </span>{' '}
                  <span>METAL FABRICONIX (PVT) LTD.</span>
                </h1>
                <p className="text-[10px] text-slate-600 mt-0.5">
                  No. 50/B, Vishaka Place, Elapitiwela, Ragama, Sri Lanka | Tel: 077 1684 620
                </p>
                <p className="text-[10px] font-semibold text-slate-800 mt-1">
                  Project: {sanitizePdfText(projectName)} ({sanitizePdfText(projectId)})
                </p>
                <p className="text-[10px] text-slate-600">
                  Factory: {sanitizePdfText(factoryName)} ({sanitizePdfText(factoryCode)})
                </p>
              </div>

              <div className="flex flex-col items-end text-right ml-auto">
                <img
                  src={getCompanyLogoDataUrl()}
                  alt="Innovista Logo"
                  className="h-10 w-auto max-w-[140px] object-contain mb-1"
                />
                <h2
                  className="text-base font-extrabold tracking-tight uppercase text-blue-700"
                  style={{ color: '#1d4ed8', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
                >
                  {sanitizePdfText(editTitle)}
                </h2>
                <div className="mt-0.5 flex items-center gap-2.5">
                  <div className="space-y-0.5 text-[10px] font-semibold text-slate-700">
                    <p>Date: {sanitizePdfText(editDate)}</p>
                    <p className="font-bold text-slate-900">
                      Code: {sanitizePdfText(spec.docNo)} | Rev {editRevision}
                    </p>
                  </div>
                  {qrData && (
                    <img src={qrData} alt="Document QR" className="w-10 h-10 border border-slate-200 rounded p-0.5 bg-white" />
                  )}
                </div>
              </div>
            </div>

            {/* 1. Basic Information (Clean 4-column Table matching uploaded screenshot) */}
            <div className="bg-white">
              <h3 className="font-bold text-xs text-slate-900 mb-1.5">
                1. Basic Information
              </h3>
              <table className="w-full border-collapse border border-slate-300 bg-white text-[10px]">
                <tbody>
                  <tr>
                    <td className="border border-slate-300 p-2 font-bold w-36 bg-slate-50/70 text-slate-800">
                      Project
                    </td>
                    <td className="border border-slate-300 p-2 bg-white">
                      {sanitizePdfText(projectName)} ({sanitizePdfText(projectId)})
                    </td>
                    <td className="border border-slate-300 p-2 font-bold w-36 bg-slate-50/70 text-slate-800">
                      Factory / Entity
                    </td>
                    <td className="border border-slate-300 p-2 bg-white">
                      {sanitizePdfText(factoryName)} ({sanitizePdfText(factoryCode)})
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-2 font-bold bg-slate-50/70 text-slate-800">
                      Location
                    </td>
                    <td className="border border-slate-300 p-2 bg-white">{sanitizePdfText(location)}</td>
                    <td className="border border-slate-300 p-2 font-bold bg-slate-50/70 text-slate-800">
                      Person in Charge
                    </td>
                    <td className="border border-slate-300 p-2 bg-white">{sanitizePdfText(officer)}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-2 font-bold bg-slate-50/70 text-slate-800">
                      Type & Priority
                    </td>
                    <td className="border border-slate-300 p-2 bg-white">
                      {sanitizePdfText(spec.priority || 'Financial Voucher (Audited)')}
                    </td>
                    <td className="border border-slate-300 p-2 font-bold bg-slate-50/70 text-slate-800">
                      Status
                    </td>
                    <td className="border border-slate-300 p-2 font-bold bg-white text-emerald-700">
                      {sanitizePdfText(status)}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-2 font-bold bg-slate-50/70 text-slate-800">
                      Schedule Type
                    </td>
                    <td className="border border-slate-300 p-2 bg-white">{sanitizePdfText(scheduleType)}</td>
                    <td className="border border-slate-300 p-2 font-bold bg-slate-50/70 text-slate-800">
                      Work Ref
                    </td>
                    <td className="border border-slate-300 p-2 font-mono bg-white font-semibold">
                      {sanitizePdfText(workRef)}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-2 font-bold bg-slate-50/70 text-slate-800">
                      Notes
                    </td>
                    <td className="border border-slate-300 p-2 bg-white text-slate-700" colSpan={3}>
                      {sanitizePdfText(notes)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 2. Key Details (No, Item, Details matching uploaded screenshot) */}
            <div className="bg-white">
              <h3 className="font-bold text-xs text-slate-900 mb-1.5">
                2. Key Details
              </h3>
              <table className="w-full border-collapse border border-slate-300 bg-white text-[10px]">
                <thead>
                  <tr className="bg-slate-50/70 text-slate-900 font-bold">
                    <th className="border border-slate-300 p-2 text-left w-14">No</th>
                    <th className="border border-slate-300 p-2 text-left w-56">Item</th>
                    <th className="border border-slate-300 p-2 text-left">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {keyDetailsList.map((kd, idx) => (
                    <tr key={idx} className="bg-white">
                      <td className="border border-slate-300 p-2 font-bold">{`2.${idx + 1}`}</td>
                      <td className="border border-slate-300 p-2 font-bold text-slate-900">
                        {sanitizePdfText(kd.item)}
                      </td>
                      <td className="border border-slate-300 p-2 text-slate-700 whitespace-pre-wrap">
                        {sanitizePdfText(kd.details)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 3. Financial Schedule & Line Items */}
            <div className="bg-white">
              <h3 className="font-bold text-xs text-slate-900 mb-1.5">
                3. Financial Schedule & Line Items
              </h3>
              <table className="w-full border-collapse border border-slate-300 bg-white text-[10px]">
                <thead>
                  <tr className="bg-slate-50/70 text-slate-900 font-bold">
                    <th className="border border-slate-300 p-2 text-left w-12">No</th>
                    {spec.scheduleHeaders.slice(0, 5).map((h, i) => (
                      <th
                        key={i}
                        className={cn(
                          'border border-slate-300 p-2 text-left',
                          i >= 3 && 'text-right'
                        )}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {spec.scheduleRows.map((row, idx) => (
                    <tr
                      key={idx}
                      className={cn('bg-white', row.isHighlight && 'bg-amber-50/40 font-medium')}
                    >
                      <td className="border border-slate-300 p-2 font-bold text-slate-700">
                        {`3.${idx + 1}`}
                      </td>
                      <td className="border border-slate-300 p-2 font-semibold text-slate-900">
                        {row.col1}
                      </td>
                      <td className="border border-slate-300 p-2 text-slate-700">{row.col2}</td>
                      <td className="border border-slate-300 p-2 text-slate-700">{row.col3}</td>
                      <td className="border border-slate-300 p-2 text-right font-mono text-slate-700">
                        {row.col4}
                      </td>
                      <td className="border border-slate-300 p-2 text-right font-mono font-bold text-slate-900">
                        {row.col5}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Summary Totals */}
              {spec.summaryTotals && spec.summaryTotals.length > 0 && (
                <div className="flex justify-end mt-2">
                  <div className="w-72 border border-slate-300 bg-slate-50/70 p-2.5 rounded-lg space-y-1 text-xs">
                    {spec.summaryTotals.map((tot, i) => (
                      <div
                        key={i}
                        className={cn(
                          'flex justify-between items-center text-slate-700',
                          i === spec.summaryTotals!.length - 1 &&
                            'pt-1 border-t border-slate-300 font-bold text-slate-900 text-sm'
                        )}
                      >
                        <span>{tot.label}:</span>
                        <span className="font-mono">{tot.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 4. Approval & Audit Sign-Off */}
            <div className="bg-white">
              <h3 className="font-bold text-xs text-slate-900 mb-1.5">
                4. Approval & Audit Sign-Off
              </h3>
              <table className="w-full border-collapse border border-slate-300 bg-white text-[10px]">
                <tbody>
                  <tr>
                    <td className="border border-slate-300 p-2 font-bold w-56 bg-slate-50/70 text-slate-800">
                      1st Step: Financial Controller Check
                    </td>
                    <td className="border border-slate-300 p-2 bg-white text-emerald-800 font-semibold">
                      CHECKED & BALANCED — {sanitizePdfText(spec.preparedBy)} ({sanitizePdfText(editDate)})
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-2 font-bold bg-slate-50/70 text-slate-800">
                      2nd Step: Director of Finance / Admin
                    </td>
                    <td className="border border-slate-300 p-2 bg-white font-semibold">
                      {isApproved ? (
                        <span className="text-emerald-700">APPROVED — {sanitizePdfText(spec.approvedBy)}</span>
                      ) : (
                        <span className="text-amber-600">PENDING APPROVAL — {sanitizePdfText(spec.approvedBy)}</span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-2 font-bold bg-slate-50/70 text-slate-800">
                      System Verification Hash
                    </td>
                    <td className="border border-slate-300 p-2 font-mono text-slate-500 bg-white">
                      {sanitizePdfText(spec.auditStamp || `SYS-VERIFY-${spec.docNo}`)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ================== FOOTER: BARCODE ON LEFT, COMPANY NAME & REV ON RIGHT ================== */}
            <div className="pt-6 border-t border-slate-300 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <BarcodeVisual value={spec.docNo} width={1.2} height={26} fontSize={8} />
                <div className="text-[10px] leading-tight">
                  <p className="font-bold text-slate-700">RECORD BARCODE: {spec.docNo}</p>
                  <p className="text-slate-400 text-[9px]">Generated from Innovista System</p>
                </div>
              </div>

              <div className="text-right text-[10px] leading-tight">
                <p className="font-bold text-slate-800">INNOVISTA METAL FABRICONIX</p>
                <p className="text-slate-500 font-medium">Rev {editRevision}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
