import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  FileText,
  Printer,
  Download,
  CheckCircle2,
  Edit3,
  Trash2,
  X,
  Loader2,
  RotateCcw,
  ShieldCheck,
  Lock
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BarcodeVisual } from '../boq/BarcodeVisual';
import {
  generateBarcodeDataUrl,
  generateQRCodeDataUrl,
  getCompanyLogoDataUrl,
  fitPdfText,
  sanitizePdfText,
  drawCompanyLogoAtActualWidth
} from '../../pdfGenerator';
import {
  FactoryRecordEntityType,
  FactorySystemApprovalMetadata,
  FactoryAuditLogEntry
} from '../../types/factoryPortal';
import { SecurityUser } from '../../types/security';
import { factoryExecutionService } from '../../services/factoryExecutionService';
import { securityService } from '../../services/securityService';
import { toast } from 'sonner';

export interface FactoryRecordDocumentSpec {
  entityType: FactoryRecordEntityType;
  recordId: string;
  docTitle: string;
  docNo: string;
  docDate: string;
  projectName: string;
  projectId: string;
  clientName?: string;
  factoryName: string;
  factoryCode: string;
  factoryLocation: string;
  workPackageCode?: string;
  responsibleOfficer: string;
  strategyBox1Label: string;
  strategyBox1Value: string;
  strategyBox2Label: string;
  strategyBox2Value: string;
  strategyBox3Label: string;
  strategyBox3Value: string;
  justificationOrNotes?: string;
  specificationTerms: Array<{
    no: string;
    title: string;
    content: string;
  }>;
  scheduleRows: Array<{
    no: string;
    name: string;
    description: string;
    pvcCode: string;
    unit: string;
    qty: string | number;
    rateOrMetric: string;
    amountOrStatus: string;
    isMain?: boolean;
  }>;
  summaryTotals?: Array<{
    label: string;
    value: string;
  }>;
  editableFields?: {
    title: string;
    status: string;
    quantity?: number;
    date?: string;
    notes?: string;
  };
}

export interface FactoryQuotationDocumentModalProps {
  spec: FactoryRecordDocumentSpec | null;
  currentUser?: SecurityUser | null;
  canAuthorize?: boolean;
  isOpen?: boolean;
  onClose: () => void;
  onRefresh?: () => void;
}

const FONT_SIZE = 10;

export const FactoryQuotationDocumentModal: React.FC<FactoryQuotationDocumentModalProps> = ({
  spec,
  currentUser: propUser,
  canAuthorize = true,
  isOpen,
  onClose,
  onRefresh = () => {}
}) => {
  const currentUser = propUser !== undefined ? propUser : securityService.getCurrentUser();
  if (isOpen === false || !spec) return null;
  const [isGenerating, setIsGenerating] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);
  const [showEditDrawer, setShowEditDrawer] = useState(false);
  const [isRevisionMode, setIsRevisionMode] = useState(true);

  const [editTitle, setEditTitle] = useState(spec?.editableFields?.title || spec?.docTitle || '');
  const [editStatus, setEditStatus] = useState(spec?.editableFields?.status || spec?.strategyBox2Value || 'Approved');
  const [editQuantity, setEditQuantity] = useState<number>(spec?.editableFields?.quantity ?? 1);
  const [editDate, setEditDate] = useState(spec?.editableFields?.date || spec?.docDate || '');
  const [editNotes, setEditNotes] = useState(spec?.editableFields?.notes || spec?.justificationOrNotes || '');
  const [approvalRemarks, setApprovalRemarks] = useState('Checked and approved');

  const approvalMeta: FactorySystemApprovalMetadata | null = useMemo(() => {
    if (!spec) return null;
    return factoryExecutionService.getRecordApprovalMetadata(spec.entityType, spec.recordId);
  }, [spec, refreshTick]);

  const recordAuditLogs: FactoryAuditLogEntry[] = useMemo(() => {
    if (!spec) return [];
    return factoryExecutionService.getFactoryAuditLogs(undefined, undefined, spec.recordId);
  }, [spec, refreshTick]);

  // Two-step checklist & QC approval state for TASK, SUB_TASK, and QUALITY_INSPECTION
  const twoStepApprovalStatus = useMemo(() => {
    if (!spec) return null;
    if (spec.entityType === 'TASK' || spec.entityType === 'SUB_TASK') {
      const targetType = spec.entityType === 'TASK' ? 'TASK' : 'SUB_TASK';
      const qcState = factoryExecutionService.getTaskOrSubTaskQcState(targetType, spec.recordId);
      return {
        isTwoStep: true,
        fmApproved: Boolean(qcState.factoryManagerApproval?.isApproved),
        fmName: qcState.factoryManagerApproval?.approvedByName || 'Pending Factory Manager Check',
        fmDate: qcState.factoryManagerApproval?.approvedAt || '-',
        pmApproved: Boolean(qcState.pmOrAdminApproval?.isApproved),
        pmName: qcState.pmOrAdminApproval?.approvedByName || 'Pending PM / Admin Approval',
        pmDate: qcState.pmOrAdminApproval?.approvedAt || '-'
      };
    }
    if (spec.entityType === 'QUALITY_INSPECTION') {
      const qi = factoryExecutionService.getQualityInspections().find((i: any) => i.id === spec.recordId);
      return {
        isTwoStep: true,
        fmApproved: Boolean(qi?.factoryManagerApproval?.isApproved),
        fmName: qi?.factoryManagerApproval?.approvedByName || 'Pending Factory Manager Check',
        fmDate: qi?.factoryManagerApproval?.approvedAt || '-',
        pmApproved: Boolean(qi?.pmOrAdminApproval?.isApproved),
        pmName: qi?.pmOrAdminApproval?.approvedByName || 'Pending PM / Admin Approval',
        pmDate: qi?.pmOrAdminApproval?.approvedAt || '-'
      };
    }
    return null;
  }, [spec, refreshTick]);

  const isFactoryManagerUser = factoryExecutionService.isFactoryManagerAccount(currentUser);
  const isPmOrAdminUser = factoryExecutionService.canApproveQualityInspection(currentUser);

  if (!spec || !approvalMeta) return null;

  const handleFactoryManagerStep1Check = () => {
    try {
      if (spec.entityType === 'TASK' || spec.entityType === 'SUB_TASK') {
        const targetType = spec.entityType === 'TASK' ? 'TASK' : 'SUB_TASK';
        factoryExecutionService.runAndUploadFactoryManagerQcInspection(
          currentUser,
          targetType,
          spec.recordId
        );
      } else if (spec.entityType === 'QUALITY_INSPECTION') {
        factoryExecutionService.approveQualityInspectionRecordByFactoryManager(
          currentUser,
          spec.recordId
        );
      }
      setRefreshTick(t => t + 1);
      onRefresh();
      toast.success('1st Step: Checked & Approved by Factory Manager. Ready for PM/Admin final approval.');
    } catch (err: any) {
      toast.error(err?.message || 'Could not complete Factory Manager check');
    }
  };

  const handleApproveRecord = () => {
    try {
      if (twoStepApprovalStatus?.isTwoStep && !twoStepApprovalStatus.fmApproved) {
        toast.error('Factory Manager must check and approve first before Project Manager / Admin can approve.');
        return;
      }
      const updated = factoryExecutionService.approveFactoryRecord(
        currentUser,
        spec.entityType,
        spec.recordId,
        approvalRemarks || 'Approved'
      );
      setRefreshTick(t => t + 1);
      onRefresh();
      toast.success(`Approved by ${updated.approvedByAccountName}`);
    } catch (err: any) {
      toast.error(err?.message || 'Approval blocked until Factory Manager checks first.');
    }
  };

  const handleSaveReviseOrEdit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = factoryExecutionService.reviseOrEditFactoryRecord(
      currentUser,
      spec.entityType,
      spec.recordId,
      {
        title: editTitle.trim() || undefined,
        status: editStatus.trim() || undefined,
        quantity: editQuantity,
        date: editDate || undefined,
        notes: editNotes.trim() || undefined
      },
      isRevisionMode
    );
    setShowEditDrawer(false);
    setRefreshTick(t => t + 1);
    onRefresh();
    toast.success(
      isRevisionMode
        ? `Updated to Rev ${updated.revisionNumber}`
        : 'Record updated'
    );
  };

  const handleDeleteRecord = () => {
    factoryExecutionService.deleteFactoryRecord(
      currentUser,
      spec.entityType,
      spec.recordId,
      'Deleted from Document Control'
    );
    onRefresh();
    onClose();
    toast.success(`Record ${spec.docNo} deleted`);
  };

  const handleGenerateSimplifiedPdf = async (mode: 'PRINTED' | 'DOCUMENT_GENERATED') => {
    setIsGenerating(true);
    try {
      const safeStr = (val: unknown, fallback = '-'): string => sanitizePdfText(val, fallback);

      const doc = new jsPDF();
      const pageWidth = Number(doc.internal.pageSize.getWidth()) || 210;
      const pageHeight = Number(doc.internal.pageSize.getHeight()) || 297;
      const margin = 15;

      const latestApproval = factoryExecutionService.getRecordApprovalMetadata(spec.entityType, spec.recordId);
      const latestLogs = factoryExecutionService.getFactoryAuditLogs(undefined, undefined, spec.recordId);

      const safeDocNo = safeStr(spec.docNo, 'DOC-2026-001');
      const safeDocTitle = safeStr(spec.docTitle, 'RECORD SHEET').toUpperCase();
      const safeDocDate = safeStr(editDate || spec.docDate, new Date().toISOString().slice(0, 10));
      const safeProjectText = `Project: ${safeStr(spec.projectName, 'Project')} (${safeStr(spec.projectId, 'PRJ-01')})`;
      const safeFactoryText = `Factory: ${safeStr(spec.factoryName, 'Factory')} (${safeStr(spec.factoryCode, 'FAC-01')})`;
      const logoDataUrl = getCompanyLogoDataUrl();

      // Header with Blue "INNOVISTA", Top-Right Company Logo printed ABOVE the Blue Document Title at actual width
      const drawCleanHeader = (pdf: jsPDF) => {
        const rightEdge = pageWidth - margin;
        const maxLeftWidth = 102;

        // Top-Right Corner: Company Logo printed ABOVE the document name at its actual width
        if (logoDataUrl) {
          drawCompanyLogoAtActualWidth(pdf, logoDataUrl, rightEdge, 7.5, 10.5, 46);
        }

        // Left Header: First Name of Company ("INNOVISTA") in Royal Blue + rest in Dark Slate
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(13);
        const firstWord = 'INNOVISTA';
        pdf.setTextColor(29, 78, 216); // Royal Blue (#1d4ed8)
        pdf.text(firstWord, margin, 15);
        const firstWordWidth = pdf.getTextWidth(firstWord);
        pdf.setTextColor(15, 23, 42); // Dark Slate
        pdf.text(' METAL FABRICONIX (PVT) LTD.', margin + firstWordWidth, 15);

        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(71, 85, 105);
        pdf.text(
          fitPdfText(pdf, 'No. 50/B, Vishaka Place, Elapitiwela, Ragama, Sri Lanka | Tel: 077 1684 620', maxLeftWidth),
          margin,
          20
        );

        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(30, 41, 59);
        pdf.text(fitPdfText(pdf, safeProjectText, maxLeftWidth), margin, 24.5);

        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(71, 85, 105);
        pdf.text(fitPdfText(pdf, safeFactoryText, maxLeftWidth), margin, 29);

        // Right Header (BELOW the top-right logo): Document Title in Royal Blue, Date, Code & Rev
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(11);
        pdf.setTextColor(29, 78, 216); // Royal Blue (#1d4ed8) when printing
        pdf.text(fitPdfText(pdf, safeDocTitle, 72), rightEdge, 22, { align: 'right' });

        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(51, 65, 85);
        pdf.text(`Date: ${safeDocDate}`, rightEdge, 26.2, { align: 'right' });

        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(15, 23, 42);
        pdf.text(
          `Code: ${safeDocNo} | Rev ${safeStr(latestApproval?.revisionNumber, '1')}`,
          rightEdge,
          30.2,
          { align: 'right' }
        );

        pdf.setDrawColor(29, 78, 216);
        pdf.setLineWidth(0.5);
        pdf.line(margin, 34.5, pageWidth - margin, 34.5);
      };

      const barcodeDataUrl = generateBarcodeDataUrl(safeDocNo);
      const qrDataUrl = await generateQRCodeDataUrl(safeDocNo);

      // Footer with QR Code + 1D Barcode with clear vertical separation so barcode bars never touch text
      const drawCleanFooter = (pdf: jsPDF, pageNumber: number, totalPages: number) => {
        pdf.setDrawColor(203, 213, 225);
        pdf.setLineWidth(0.3);
        pdf.line(margin, pageHeight - 23.5, pageWidth - margin, pageHeight - 23.5);

        if (qrDataUrl) {
          try {
            pdf.addImage(qrDataUrl, 'PNG', margin, pageHeight - 22, 11, 11);
          } catch {}
        }
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(5.5);
        pdf.setTextColor(71, 85, 105);
        pdf.text('VERIFY', margin + 5.5, pageHeight - 8, { align: 'center' });

        if (barcodeDataUrl) {
          try {
            const barcodeWidth = 46;
            const barcodeHeight = 6.5;
            const barcodeX = pageWidth / 2 - barcodeWidth / 2;
            const barcodeY = pageHeight - 22; // Bottom of barcode bars ends at pageHeight - 15.5
            pdf.addImage(barcodeDataUrl, 'PNG', barcodeX, barcodeY, barcodeWidth, barcodeHeight);
          } catch {}
        }

        // Document code placed at pageHeight - 11.5 (leaves >2mm clean white space below barcode bars)
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7.5);
        pdf.setTextColor(15, 23, 42);
        pdf.text(safeDocNo, pageWidth / 2, pageHeight - 11.5, { align: 'center' });

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(6.5);
        pdf.setTextColor(100, 116, 139);
        pdf.text('Generated from Innovista System', pageWidth / 2, pageHeight - 7.5, { align: 'center' });

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.setTextColor(100, 116, 139);
        pdf.text(`Page ${pageNumber} of ${totalPages}`, pageWidth - margin, pageHeight - 11.5, { align: 'right' });
      };

      // Section 1: Basic Info (White background tables)
      doc.setFontSize(10.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('1. Basic Information', margin, 41);

      const basicRows: string[][] = [
        [
          'Project',
          `${safeStr(spec.projectName, 'Project')} (${safeStr(spec.projectId, 'PRJ-01')})`,
          'Factory',
          `${safeStr(spec.factoryName, 'Factory')} (${safeStr(spec.factoryCode, 'FAC-01')})`
        ],
        [
          'Location',
          safeStr(spec.factoryLocation),
          'Person in Charge',
          safeStr(spec.responsibleOfficer)
        ],
        [
          safeStr(spec.strategyBox1Label, 'Type'),
          safeStr(spec.strategyBox1Value),
          safeStr(spec.strategyBox2Label, 'Status'),
          safeStr(editStatus || spec.strategyBox2Value, 'Active')
        ],
        [
          safeStr(spec.strategyBox3Label, 'Details'),
          safeStr(spec.strategyBox3Value),
          'Work Ref',
          safeStr(spec.workPackageCode || safeDocNo)
        ]
      ];
      if (editNotes || spec.justificationOrNotes) {
        basicRows.push([
          'Notes',
          safeStr(editNotes || spec.justificationOrNotes),
          'Date',
          safeDocDate
        ]);
      }

      autoTable(doc, {
        startY: 44,
        body: basicRows,
        theme: 'grid',
        styles: { fontSize: 8.5, cellPadding: 2.5, fillColor: [255, 255, 255], textColor: [15, 23, 42], lineColor: [203, 213, 225], lineWidth: 0.2 },
        columnStyles: {
          0: { cellWidth: 28, fontStyle: 'bold' },
          1: { cellWidth: 62 },
          2: { cellWidth: 28, fontStyle: 'bold' },
          3: { cellWidth: 62 }
        },
        margin: { top: 40, bottom: 26, left: 15, right: 15 }
      });

      const getFinalY = (fallback = 50): number => {
        const val = Number((doc as any).lastAutoTable?.finalY);
        return Number.isFinite(val) && val > 0 ? val : fallback;
      };

      // Section 2: Key Details
      if ((spec.specificationTerms || []).length > 0) {
        const sec2Y = getFinalY(70) + 7;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10.5);
        doc.setTextColor(15, 23, 42);
        doc.text('2. Key Details', margin, sec2Y);

        const termsData = (spec.specificationTerms || []).map((t, idx) => [
          `2.${idx + 1}`,
          safeStr(t.title, 'Detail'),
          safeStr(t.content, '-')
        ]);

        autoTable(doc, {
          startY: sec2Y + 3,
          head: [['No', 'Item', 'Details']],
          body: termsData,
          theme: 'grid',
          styles: { fontSize: 8.5, cellPadding: 2.5, fillColor: [255, 255, 255], textColor: [15, 23, 42], lineColor: [203, 213, 225], lineWidth: 0.2 },
          headStyles: { fillColor: [255, 255, 255], textColor: [15, 23, 42], fontStyle: 'bold', lineColor: [203, 213, 225], lineWidth: 0.2 },
          columnStyles: {
            0: { cellWidth: 14, fontStyle: 'bold' },
            1: { cellWidth: 44, fontStyle: 'bold' }
          },
          margin: { top: 40, bottom: 26, left: 15, right: 15 }
        });
      }

      // Section 3: Record Items & Barcodes (White Header, 1D Barcodes per Row)
      const scheduleStartY = getFinalY(105) + 8;
      if (scheduleStartY > pageHeight - 65) {
        doc.addPage();
      }
      const sec3Y = scheduleStartY > pageHeight - 65 ? 40 : scheduleStartY;

      doc.setFontSize(10.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('3. Record Items & Barcodes', margin, sec3Y);

      const safeScheduleRows = spec.scheduleRows || [];
      const miniBarcodes: Record<string, string> = {};
      safeScheduleRows.forEach((r, idx) => {
        const code = safeStr(r.pvcCode, `${safeDocNo}-${safeStr(r.no, String(idx + 1))}`);
        if (!miniBarcodes[code]) {
          miniBarcodes[code] = generateBarcodeDataUrl(code);
        }
      });

      const schedHead = [['No', 'Item & Details', 'Barcode', 'Unit', 'Qty', 'Check / Value', 'Status']];
      const schedBody = safeScheduleRows.map((r, idx) => [
        safeStr(r.no, `1.${idx + 1}`),
        `${r.name ? `${safeStr(r.name)}\n` : ''}${safeStr(r.description)}`,
        '',
        safeStr(r.unit, 'Unit'),
        safeStr(r.qty, '1'),
        safeStr(r.rateOrMetric),
        safeStr(r.amountOrStatus, 'Active')
      ]);

      autoTable(doc, {
        startY: sec3Y + 3,
        head: schedHead,
        body: schedBody,
        theme: 'grid',
        styles: { fontSize: 8, fillColor: [255, 255, 255], textColor: [15, 23, 42], lineColor: [203, 213, 225], lineWidth: 0.2 },
        headStyles: { fillColor: [255, 255, 255], textColor: [15, 23, 42], fontStyle: 'bold', lineColor: [203, 213, 225], lineWidth: 0.2 },
        columnStyles: {
          0: { cellWidth: 12 },
          1: { cellWidth: 64 },
          2: { cellWidth: 28, minCellHeight: 15, halign: 'center' },
          3: { cellWidth: 15 },
          4: { cellWidth: 16, halign: 'right' },
          5: { cellWidth: 23, halign: 'right' },
          6: { halign: 'right', fontStyle: 'bold' }
        },
        margin: { top: 38, bottom: 26, left: 15, right: 15 },
        didDrawCell: (data: any) => {
          if (data.column.index === 2 && data.cell.section === 'body') {
            const row = safeScheduleRows[data.row.index];
            const code = safeStr(row?.pvcCode, `${safeDocNo}-${safeStr(row?.no, String(data.row.index + 1))}`);
            if (code && miniBarcodes[code]) {
              const x = Number(data.cell.x) + 1.5;
              const y = Number(data.cell.y) + 1.5;
              const cellW = Number(data.cell.width) || 28;
              if (Number.isFinite(x) && Number.isFinite(y)) {
                try {
                  doc.addImage(miniBarcodes[code], 'PNG', x, y, Math.max(4, cellW - 3), 5.5);
                } catch {}
                doc.setFontSize(5);
                doc.setTextColor(71, 85, 105);
                doc.setFont('helvetica', 'bold');
                doc.text(fitPdfText(doc, code, cellW - 2), Number(data.cell.x) + cellW / 2, y + 9.2, { align: 'center' });
              }
            }
          }
        }
      });

      // Section 4: Approval & History (White Background)
      let approvalY = getFinalY(145) + 8;
      if (approvalY > pageHeight - 65) {
        doc.addPage();
        approvalY = 40;
      }

      doc.setFontSize(10.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('4. Approval Status & History', margin, approvalY);

      const approvalCertRows: string[][] = [];
      if (twoStepApprovalStatus?.isTwoStep) {
        approvalCertRows.push([
          '1st Step: Factory Manager Check',
          twoStepApprovalStatus.fmApproved
            ? `APPROVED — ${safeStr(twoStepApprovalStatus.fmName)} (${safeStr(twoStepApprovalStatus.fmDate)})`
            : 'PENDING FACTORY MANAGER CHECK & APPROVAL'
        ]);
        approvalCertRows.push([
          '2nd Step: PM / Admin Approval',
          twoStepApprovalStatus.pmApproved
            ? `APPROVED — ${safeStr(twoStepApprovalStatus.pmName)} (${safeStr(twoStepApprovalStatus.pmDate)})`
            : 'PENDING PM / ADMIN FINAL APPROVAL (Requires 1st Step)'
        ]);
      }
      approvalCertRows.push(
        [
          'Final System Status',
          latestApproval?.isApproved ? 'APPROVED' : 'PENDING APPROVAL'
        ],
        [
          'Approved By',
          latestApproval?.isApproved
            ? `${safeStr(latestApproval.approvedByFullName)} (@${safeStr(latestApproval.approvedByUsername)}) — ID: ${safeStr(latestApproval.approvedByUserId)}`
            : 'Not Yet Approved'
        ],
        [
          'Role & Date',
          latestApproval?.isApproved
            ? `${safeStr(latestApproval.approvedByRole)} | ${safeStr(latestApproval.approvedAt)}`
            : 'Waiting for Approval'
        ],
        [
          'Revision & Note',
          `Rev ${safeStr(latestApproval?.revisionNumber, '1')} — ${safeStr(latestApproval?.revisionNotes, 'Verified')}`
        ]
      );

      autoTable(doc, {
        startY: approvalY + 3,
        head: [['Check Step', 'Details']],
        body: approvalCertRows,
        theme: 'grid',
        styles: { fontSize: 8.5, cellPadding: 2.5, fillColor: [255, 255, 255], textColor: [15, 23, 42], lineColor: [203, 213, 225], lineWidth: 0.2 },
        headStyles: { fillColor: [255, 255, 255], textColor: [15, 23, 42], fontStyle: 'bold', lineColor: [203, 213, 225], lineWidth: 0.2 },
        columnStyles: {
          0: { cellWidth: 58, fontStyle: 'bold' }
        },
        margin: { top: 35, bottom: 25, left: 15, right: 15 }
      });

      if ((latestLogs || []).length > 0) {
        let auditStartY = getFinalY(175) + 6;
        if (auditStartY > pageHeight - 45) {
          doc.addPage();
          auditStartY = 38;
        }
        const auditRows = latestLogs.slice(0, 6).map((l, i) => [
          `${i + 1}`,
          safeStr(l.timestamp),
          safeStr(l.action),
          `${safeStr(l.actorFullName, 'User')} (ID: ${safeStr(l.actorUserId, 'USR')})`,
          `Rev ${safeStr(l.revisionNumber, '1')}`,
          safeStr(l.details)
        ]);

        autoTable(doc, {
          startY: auditStartY,
          head: [['No', 'Date & Time', 'Action', 'User', 'Rev', 'Note']],
          body: auditRows,
          theme: 'grid',
          styles: { fontSize: 7.5, cellPadding: 2, fillColor: [255, 255, 255], textColor: [15, 23, 42], lineColor: [203, 213, 225], lineWidth: 0.2 },
          headStyles: { fillColor: [255, 255, 255], textColor: [15, 23, 42], fontStyle: 'bold', lineColor: [203, 213, 225], lineWidth: 0.2 },
          columnStyles: {
            0: { cellWidth: 10 },
            1: { cellWidth: 28 },
            2: { cellWidth: 22, fontStyle: 'bold' },
            3: { cellWidth: 48 },
            4: { cellWidth: 14, halign: 'center' }
          },
          margin: { top: 35, bottom: 25, left: 15, right: 15 }
        });
      }

      const totalPages = doc.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        drawCleanHeader(doc);
        drawCleanFooter(doc, p, totalPages);
      }

      factoryExecutionService.recordDocumentPrintOrGenerate(
        currentUser,
        spec.entityType,
        spec.recordId,
        mode
      );
      setRefreshTick(t => t + 1);
      onRefresh();

      if (mode === 'PRINTED') {
        doc.autoPrint();
      }
      doc.save(`${safeDocNo}_Rev${safeStr(latestApproval?.revisionNumber, '1')}.pdf`);
      toast.success(
        mode === 'PRINTED'
          ? `Print ready: ${safeDocNo}`
          : `Downloaded PDF: ${safeDocNo}`
      );
    } catch (err) {
      console.error('Error generating simplified PDF:', err);
      toast.error('Failed to generate PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  // Fixed full-screen modal over all navbars and system elements, white background
  const modalNode = (
    <div
      className="fixed inset-0 w-screen h-screen bg-white flex flex-col overflow-hidden"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 2147483647
      }}
    >
      {/* Top Clean White Bar (No Dark Blue Title) */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 text-slate-900 flex flex-wrap justify-between items-center gap-3 shrink-0">
        <div className="flex flex-wrap items-center gap-2.5">
          <FileText size={18} className="text-slate-700" />
          <span className="font-bold text-sm text-slate-900">
            {spec.docTitle} — {spec.docNo}
          </span>
          <span
            className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${
              approvalMeta.isApproved
                ? 'bg-white text-emerald-700 border-emerald-300'
                : 'bg-white text-amber-700 border-amber-300'
            }`}
          >
            {approvalMeta.isApproved
              ? `Approved • Rev ${approvalMeta.revisionNumber}`
              : `Pending • Rev ${approvalMeta.revisionNumber}`}
          </span>

          {twoStepApprovalStatus?.isTwoStep && (
            <div className="flex items-center gap-1.5 text-[10px]">
              <span
                className={`px-2 py-0.5 rounded border font-bold ${
                  twoStepApprovalStatus.fmApproved
                    ? 'bg-white text-emerald-700 border-emerald-300'
                    : 'bg-white text-amber-700 border-amber-300'
                }`}
              >
                1st FM: {twoStepApprovalStatus.fmApproved ? 'Checked' : 'Pending'}
              </span>
              <span
                className={`px-2 py-0.5 rounded border font-bold ${
                  twoStepApprovalStatus.pmApproved
                    ? 'bg-white text-emerald-700 border-emerald-300'
                    : 'bg-white text-slate-600 border-slate-300'
                }`}
              >
                2nd PM/Admin: {twoStepApprovalStatus.pmApproved ? 'Approved' : 'Waiting'}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* 1st Step: Factory Manager Check & Approve Button */}
          {twoStepApprovalStatus?.isTwoStep && isFactoryManagerUser && (
            <button
              onClick={handleFactoryManagerStep1Check}
              className="flex items-center gap-1.5 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
              title="1st Step: Factory Manager Check & Approve"
            >
              <CheckCircle2 size={14} />
              <span>Check</span>
            </button>
          )}

          {/* 2nd Step: PM / Admin Final Approve Button (Disabled until Factory Manager checks first) */}
          {canAuthorize && (!twoStepApprovalStatus?.isTwoStep || isPmOrAdminUser) && (
            <button
              onClick={handleApproveRecord}
              disabled={Boolean(twoStepApprovalStatus?.isTwoStep && !twoStepApprovalStatus.fmApproved)}
              title={
                twoStepApprovalStatus?.isTwoStep && !twoStepApprovalStatus.fmApproved
                  ? 'Waiting for 1st Step: Factory Manager must check and approve first'
                  : 'Approve Record'
              }
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                twoStepApprovalStatus?.isTwoStep && !twoStepApprovalStatus.fmApproved
                  ? 'bg-white text-slate-400 border-slate-200 cursor-not-allowed'
                  : 'bg-white hover:bg-emerald-50 text-emerald-700 border-emerald-300 cursor-pointer'
              }`}
            >
              {twoStepApprovalStatus?.isTwoStep && !twoStepApprovalStatus.fmApproved ? (
                <Lock size={13} />
              ) : (
                <CheckCircle2 size={14} />
              )}
              <span>Approve</span>
            </button>
          )}

          {canAuthorize && (
            <>
              <button
                onClick={() => {
                  setIsRevisionMode(true);
                  setShowEditDrawer(prev => !prev);
                }}
                className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                <RotateCcw size={13} />
                <span>Edit</span>
              </button>

              <button
                onClick={handleDeleteRecord}
                className="flex items-center gap-1.5 bg-white hover:bg-rose-50 text-rose-600 border border-rose-300 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                <Trash2 size={13} />
                <span>Delete</span>
              </button>
            </>
          )}

          <button
            onClick={() => handleGenerateSimplifiedPdf('PRINTED')}
            disabled={isGenerating}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
          >
            {isGenerating ? <Loader2 size={13} className="animate-spin" /> : <Printer size={13} />}
            <span>Print</span>
          </button>

          <button
            onClick={() => handleGenerateSimplifiedPdf('DOCUMENT_GENERATED')}
            disabled={isGenerating}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-900 border border-slate-400 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
          >
            {isGenerating ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
            <span>Download</span>
          </button>

          <button
            onClick={onClose}
            className="flex items-center gap-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
          >
            <X size={14} />
            <span>Close</span>
          </button>
        </div>
      </div>

      {/* Inline Edit Drawer (White Background) */}
      {showEditDrawer && (
        <form
          onSubmit={handleSaveReviseOrEdit}
          className="bg-white border-b border-slate-200 px-6 py-3.5 space-y-3 shrink-0"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-slate-700" />
              <span className="text-xs font-bold text-slate-900">
                Edit Record
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <label className="inline-flex items-center gap-1.5 font-semibold text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  checked={isRevisionMode}
                  onChange={() => setIsRevisionMode(true)}
                />
                <span>New Revision (Rev {(approvalMeta.revisionNumber || 1) + 1})</span>
              </label>
              <label className="inline-flex items-center gap-1.5 font-semibold text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  checked={!isRevisionMode}
                  onChange={() => setIsRevisionMode(false)}
                />
                <span>Direct Edit (Rev {approvalMeta.revisionNumber || 1})</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                Title
              </label>
              <input
                type="text"
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                Status
              </label>
              <input
                type="text"
                value={editStatus}
                onChange={e => setEditStatus(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                Qty & Date
              </label>
              <div className="flex gap-1.5">
                <input
                  type="number"
                  value={editQuantity}
                  onChange={e => setEditQuantity(Number(e.target.value))}
                  className="w-20 px-2 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                />
                <input
                  type="date"
                  value={editDate.slice(0, 10)}
                  onChange={e => setEditDate(e.target.value)}
                  className="flex-1 px-2 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              placeholder="Simple note..."
              value={editNotes}
              onChange={e => {
                setEditNotes(e.target.value);
                setApprovalRemarks(e.target.value);
              }}
              className="flex-1 px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
            />
            <button
              type="submit"
              className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-900 border border-slate-400 text-xs font-bold cursor-pointer"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setShowEditDrawer(false)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-600 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* ================== SIMPLIFIED WHITE-BACKGROUND DOCUMENT BODY ================== */}
      <div
        id="printable-area"
        className="flex-1 overflow-y-auto px-6 sm:px-12 py-6 leading-relaxed text-slate-900 bg-white"
        style={{ fontSize: `${FONT_SIZE}px` }}
      >
        <div className="max-w-6xl mx-auto space-y-6 bg-white">
          {/* Document Header (Blue First Name "INNOVISTA", Top-Right Company Logo ABOVE Blue Document Title in actual width) */}
          <div
            className="flex flex-wrap justify-between items-start gap-6 border-b-2 border-blue-700 pb-4 bg-white"
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
                Project: {sanitizePdfText(spec.projectName)} ({sanitizePdfText(spec.projectId)})
              </p>
              <p className="text-[10px] text-slate-600">
                Factory: {sanitizePdfText(spec.factoryName)} ({sanitizePdfText(spec.factoryCode)})
              </p>
            </div>

            <div className="flex flex-col items-end text-right ml-auto">
              <img
                src={getCompanyLogoDataUrl()}
                alt="Innovista Metal Company Logo"
                className="h-12 w-auto max-w-[180px] object-contain mb-1.5"
              />
              <h2
                className="text-lg font-extrabold tracking-tight uppercase text-blue-700"
                style={{ color: '#1d4ed8', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
              >
                {sanitizePdfText(spec.docTitle)}
              </h2>
              <div className="mt-1 space-y-0.5 text-[10px] font-semibold text-slate-700">
                <p>Date: {sanitizePdfText(editDate || spec.docDate)}</p>
                <p className="font-bold text-slate-900">
                  Code: {sanitizePdfText(spec.docNo)} | Rev {approvalMeta.revisionNumber}
                </p>
              </div>
            </div>
          </div>

          {/* 1. Basic Information (Simple Table on White Background) */}
          <div className="bg-white">
            <h3 className="font-bold text-xs text-slate-900 mb-2">
              1. Basic Information
            </h3>
            <table className="w-full border-collapse border border-slate-300 bg-white text-[10px]">
              <tbody>
                <tr>
                  <td className="border border-slate-300 p-2 font-bold w-36 bg-white">Project</td>
                  <td className="border border-slate-300 p-2 bg-white">
                    {sanitizePdfText(spec.projectName)} ({sanitizePdfText(spec.projectId)})
                  </td>
                  <td className="border border-slate-300 p-2 font-bold w-36 bg-white">Factory</td>
                  <td className="border border-slate-300 p-2 bg-white">
                    {sanitizePdfText(spec.factoryName)} ({sanitizePdfText(spec.factoryCode)})
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-300 p-2 font-bold bg-white">Location</td>
                  <td className="border border-slate-300 p-2 bg-white">{sanitizePdfText(spec.factoryLocation)}</td>
                  <td className="border border-slate-300 p-2 font-bold bg-white">Person in Charge</td>
                  <td className="border border-slate-300 p-2 bg-white">{sanitizePdfText(spec.responsibleOfficer)}</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 p-2 font-bold bg-white">{sanitizePdfText(spec.strategyBox1Label)}</td>
                  <td className="border border-slate-300 p-2 bg-white">{sanitizePdfText(spec.strategyBox1Value)}</td>
                  <td className="border border-slate-300 p-2 font-bold bg-white">{sanitizePdfText(spec.strategyBox2Label)}</td>
                  <td className="border border-slate-300 p-2 font-bold bg-white">
                    {sanitizePdfText(editStatus || spec.strategyBox2Value)}
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-300 p-2 font-bold bg-white">{sanitizePdfText(spec.strategyBox3Label)}</td>
                  <td className="border border-slate-300 p-2 bg-white">{sanitizePdfText(spec.strategyBox3Value)}</td>
                  <td className="border border-slate-300 p-2 font-bold bg-white">Work Ref</td>
                  <td className="border border-slate-300 p-2 font-mono bg-white">
                    {sanitizePdfText(spec.workPackageCode || spec.docNo)}
                  </td>
                </tr>
                {(editNotes || spec.justificationOrNotes) && (
                  <tr>
                    <td className="border border-slate-300 p-2 font-bold bg-white">Notes</td>
                    <td className="border border-slate-300 p-2 bg-white" colSpan={3}>
                      {sanitizePdfText(editNotes || spec.justificationOrNotes)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* 2. Key Details (Simple Words, White Background) */}
          {spec.specificationTerms.length > 0 && (
            <div className="bg-white">
              <h3 className="font-bold text-xs text-slate-900 mb-2">
                2. Key Details
              </h3>
              <table className="w-full border-collapse border border-slate-300 bg-white text-[10px]">
                <thead>
                  <tr className="bg-white text-slate-900 font-bold">
                    <th className="border border-slate-300 p-2 text-left w-14">No</th>
                    <th className="border border-slate-300 p-2 text-left w-52">Item</th>
                    <th className="border border-slate-300 p-2 text-left">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {spec.specificationTerms.map((term, idx) => (
                    <tr key={term.no} className="bg-white">
                      <td className="border border-slate-300 p-2 font-bold">{`2.${idx + 1}`}</td>
                      <td className="border border-slate-300 p-2 font-bold">{sanitizePdfText(term.title)}</td>
                      <td className="border border-slate-300 p-2 text-slate-700 whitespace-pre-wrap">
                        {sanitizePdfText(term.content)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 3. Record Items & Barcodes (Clean White Header + Correct 1D Barcodes per Row) */}
          <div className="bg-white">
            <h3 className="font-bold text-xs text-slate-900 mb-2">
              3. Record Items & Barcodes
            </h3>
            <table className="w-full border-collapse border border-slate-300 bg-white">
              <thead>
                <tr className="text-[10px] text-slate-900 bg-white font-bold">
                  <th className="border border-slate-300 p-2 text-left w-12">No</th>
                  <th className="border border-slate-300 p-2 text-left">Item & Details</th>
                  <th className="border border-slate-300 p-2 text-center w-36">Barcode</th>
                  <th className="border border-slate-300 p-2 text-left w-20">Unit</th>
                  <th className="border border-slate-300 p-2 text-right w-20">Qty</th>
                  <th className="border border-slate-300 p-2 text-right w-28">Check / Value</th>
                  <th className="border border-slate-300 p-2 text-right w-28">Status</th>
                </tr>
              </thead>
              <tbody>
                {spec.scheduleRows.map((item, idx) => (
                  <tr
                    key={`${item.no}-${idx}`}
                    className="text-[10px] bg-white"
                  >
                    <td className="border border-slate-300 p-2 font-mono">{sanitizePdfText(item.no)}</td>
                    <td className="border border-slate-300 p-2">
                      <p className="font-bold text-slate-900">{sanitizePdfText(item.name)}</p>
                      <p className="text-slate-600 whitespace-pre-wrap">{sanitizePdfText(item.description)}</p>
                    </td>
                    <td className="border border-slate-300 p-2 text-center bg-white">
                      <div className="flex flex-col items-center gap-0.5 min-w-[60px]">
                        <div className="p-0.5 bg-white border border-slate-200 rounded">
                          <BarcodeVisual
                            value={item.pvcCode || `${spec.docNo}-${item.no}`}
                            format="CODE128"
                            width={1.0}
                            height={18}
                            displayValue={false}
                          />
                        </div>
                        <span className="text-[7px] font-mono font-bold text-slate-600 uppercase">
                          {item.pvcCode || `${spec.docNo}-${item.no}`}
                        </span>
                      </div>
                    </td>
                    <td className="border border-slate-300 p-2">{item.unit}</td>
                    <td className="border border-slate-300 p-2 text-right font-mono">{item.qty}</td>
                    <td className="border border-slate-300 p-2 text-right">{item.rateOrMetric}</td>
                    <td className="border border-slate-300 p-2 text-right font-bold">
                      {item.amountOrStatus}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {spec.summaryTotals && spec.summaryTotals.length > 0 && (
              <div className="flex justify-end mt-3">
                <div className="w-72 space-y-1.5 text-right bg-white border border-slate-300 p-3 rounded-lg">
                  {spec.summaryTotals.map((st, idx) => (
                    <div
                      key={idx}
                      className={`flex justify-between text-[10px] ${
                        idx === spec.summaryTotals!.length - 1 ? 'font-bold pt-1 border-t border-slate-200' : ''
                      }`}
                    >
                      <span className="text-slate-600">{st.label}</span>
                      <span className="font-bold text-slate-900">{st.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 4. Approval & Audit History (White Background + 2-Step Approval Display) */}
          <div className="pt-2 bg-white">
            <h3 className="font-bold text-xs mb-2 flex items-center gap-1.5 text-slate-900">
              <ShieldCheck className="w-4 h-4 text-slate-800" />
              <span>4. Approval Status & History</span>
            </h3>

            {twoStepApprovalStatus?.isTwoStep && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div className="border border-slate-300 p-3 rounded-lg bg-white">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">
                    1st Step: Factory Manager Check & Approval
                  </p>
                  <p className="text-xs font-bold text-slate-900 mt-0.5">
                    {twoStepApprovalStatus.fmApproved ? 'APPROVED BY FACTORY MANAGER' : 'PENDING FACTORY MANAGER CHECK'}
                  </p>
                  <p className="text-[10px] text-slate-600 mt-0.5">
                    {twoStepApprovalStatus.fmName} {twoStepApprovalStatus.fmDate !== '-' ? `• ${twoStepApprovalStatus.fmDate}` : ''}
                  </p>
                </div>
                <div className="border border-slate-300 p-3 rounded-lg bg-white">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">
                    2nd Step: Project Manager / Admin Final Approval
                  </p>
                  <p className="text-xs font-bold text-slate-900 mt-0.5">
                    {twoStepApprovalStatus.pmApproved
                      ? 'APPROVED BY PM / ADMIN'
                      : twoStepApprovalStatus.fmApproved
                      ? 'READY FOR PM / ADMIN APPROVAL'
                      : 'LOCKED UNTIL FACTORY MANAGER CHECKS'}
                  </p>
                  <p className="text-[10px] text-slate-600 mt-0.5">
                    {twoStepApprovalStatus.pmName} {twoStepApprovalStatus.pmDate !== '-' ? `• ${twoStepApprovalStatus.pmDate}` : ''}
                  </p>
                </div>
              </div>
            )}

            <div className="border border-slate-300 p-3.5 rounded-lg bg-white">
              <div className="flex flex-wrap justify-between items-start gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase text-slate-900">
                    {approvalMeta.isApproved ? 'APPROVED RECORD' : 'PENDING APPROVAL'}
                  </p>
                  <p className="text-[10px] font-bold text-slate-800">
                    Approved By:{' '}
                    <span className="font-normal">
                      {approvalMeta.isApproved
                        ? `${approvalMeta.approvedByFullName} (@${approvalMeta.approvedByUsername}) — ID: ${approvalMeta.approvedByUserId}`
                        : 'Waiting for Approval'}
                    </span>
                  </p>
                  <p className="text-[10px] text-slate-700">
                    Role: <span className="font-bold">{approvalMeta.approvedByRole}</span> | Date:{' '}
                    <span className="font-bold">{approvalMeta.approvedAt}</span>
                  </p>
                </div>

                <div className="text-right space-y-1">
                  <span className="inline-block px-2.5 py-1 rounded bg-white border border-slate-300 text-[10px] font-bold text-slate-800">
                    Rev {approvalMeta.revisionNumber}
                  </span>
                  <p className="text-[9px] font-mono text-slate-600">
                    Code: {spec.docNo}
                  </p>
                </div>
              </div>
            </div>

            {recordAuditLogs.length > 0 && (
              <div className="mt-3">
                <table className="w-full border-collapse border border-slate-300 bg-white">
                  <thead>
                    <tr className="bg-white text-[9px] font-bold text-slate-900">
                      <th className="border border-slate-300 p-1.5 text-left">Date & Time</th>
                      <th className="border border-slate-300 p-1.5 text-left">Action</th>
                      <th className="border border-slate-300 p-1.5 text-left">User (Name & ID)</th>
                      <th className="border border-slate-300 p-1.5 text-left">Role</th>
                      <th className="border border-slate-300 p-1.5 text-center">Rev</th>
                      <th className="border border-slate-300 p-1.5 text-left">Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recordAuditLogs.map(log => (
                      <tr key={log.id} className="text-[9px] bg-white">
                        <td className="border border-slate-300 p-1.5 font-mono">{log.timestamp}</td>
                        <td className="border border-slate-300 p-1.5 font-bold">{log.action}</td>
                        <td className="border border-slate-300 p-1.5 font-bold">
                          {log.actorFullName} (@{log.actorUsername}) — ID: {log.actorUserId}
                        </td>
                        <td className="border border-slate-300 p-1.5">{log.actorRole}</td>
                        <td className="border border-slate-300 p-1.5 text-center font-bold">
                          Rev {log.revisionNumber}
                        </td>
                        <td className="border border-slate-300 p-1.5 text-slate-700">{log.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Verification Barcode Footer (White Background, Correct Barcode Layout) */}
      <div className="py-3 px-6 sm:px-12 bg-white border-t border-slate-200 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-1 bg-white border border-slate-300 rounded">
            <BarcodeVisual
              value={spec.docNo || 'DOC-2026'}
              format="CODE128"
              width={1.2}
              height={26}
              displayValue={true}
              fontSize={9}
            />
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-slate-800 uppercase">
              Record Barcode: {spec.docNo}
            </span>
            <span className="text-[8px] text-slate-500 font-mono">
              Generated from Innovista System
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[9px] font-bold text-slate-800">
            INNOVISTA METAL FABRICONIX
          </span>
          <span className="text-[8px] text-slate-500 font-mono">
            Rev {approvalMeta.revisionNumber}
          </span>
        </div>
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(modalNode, document.body);
  }
  return modalNode;
};
