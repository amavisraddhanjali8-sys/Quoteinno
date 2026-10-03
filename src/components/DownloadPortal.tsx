import React, { useState, useMemo } from 'react';
import { AnimatePresence } from 'motion/react';
import { 
  X, 
  Download, 
  FileText, 
  Palette, 
  Type, 
  Check, 
  Loader2, 
  Printer, 
  ZoomIn, 
  ZoomOut, 
  FileSpreadsheet, 
  FileCode,
  ArrowLeft 
} from 'lucide-react';
import { 
  Quote, 
  CompanySettings, 
  PdfLayout, 
  Project, 
  AuditLog, 
  numberToWords, 
  Invoice 
} from '../types';
import { calculateQuoteTotal, cn } from '../lib/utils';
import { 
  generateQuotePDF, 
  generateProjectReportPDF, 
  generateVariationReport, 
  generateAuditLogPDF, 
  generateAllProjectDocumentsPDF,
  generateTimelineReport,
  generateDashboardReport,
  generateInvoicePDF
} from '../pdfGenerator';
import { DocumentLiveSheet } from './common/DocumentLiveSheet';
import { saveAs } from 'file-saver';
import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  Table, 
  TableRow, 
  TableCell, 
  WidthType, 
  AlignmentType 
} from 'docx';

interface DownloadPortalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'Quote' | 'Project' | 'Variation' | 'AuditLog' | 'AllDocuments' | 'Timeline' | 'Dashboard' | 'Invoice' | 'CustomerReports';
  data: Quote | Project | AuditLog[] | Invoice | { customerName: string } | any;
  settings?: CompanySettings;
  onUpdateQuote?: (updatedQuote: Quote) => void;
  onUpdateProject?: (updatedProject: Project) => void;
  allQuotes?: Quote[];
  allProjects?: Project[];
  allAuditLogs?: AuditLog[];
  allInvoices?: Invoice[];
  allPayments?: any[];
  allAdjustments?: any[];
  verificationRegistry: any[];
  registerDocument: (type: any, ref: string, id: string, metadata: any, version?: number) => string;
}

export const DownloadPortal: React.FC<DownloadPortalProps> = ({ 
  isOpen, 
  onClose, 
  type, 
  data, 
  settings, 
  onUpdateQuote,
  onUpdateProject,
  allQuotes = [],
  allProjects = [],
  allAuditLogs = [],
  allInvoices = [],
  allPayments = [],
  allAdjustments = [],
  verificationRegistry = [],
  registerDocument
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [format, setFormat] = useState<'pdf' | 'docx' | 'csv' | 'print'>('pdf');
  const [zoom, setZoom] = useState<number>(0.9);

  // Robust fallback resolution
  const resolvedQuote: Quote | null = useMemo(() => {
    if (type === 'Quote' && data) return data as Quote;
    if (type === 'Timeline' && data && (data as any).quoteNo) return data as Quote;
    return allQuotes[0] || null;
  }, [type, data, allQuotes]);

  const resolvedProject: Project | null = useMemo(() => {
    if ((type === 'Project' || type === 'Variation' || type === 'AllDocuments') && data) return data as Project;
    if (type === 'Timeline' && data && !(data as any).quoteNo) return data as Project;
    return allProjects[0] || null;
  }, [type, data, allProjects]);

  const resolvedInvoice: Invoice | null = useMemo(() => {
    if (type === 'Invoice' && data) return data as Invoice;
    return allInvoices[0] || null;
  }, [type, data, allInvoices]);

  const resolvedAuditLogs: AuditLog[] = useMemo(() => {
    if (type === 'AuditLog' && Array.isArray(data) && data.length > 0) return data;
    return allAuditLogs.length > 0 ? allAuditLogs : [];
  }, [type, data, allAuditLogs]);

  const resolvedCustomer = useMemo(() => {
    if (type === 'CustomerReports') {
      return (data as any)?.customerName ? data : { customerName: resolvedProject?.client?.name || resolvedQuote?.client?.name || 'Commercial Client' };
    }
    return null;
  }, [type, data, resolvedProject, resolvedQuote]);

  const defaultDocSettings = {
    fontSize: 10,
    accentColor: '#ea580c', // Innovista Signature Industrial Orange
    showLogo: true,
    showBankDetails: true,
    showTimeline: false,
    showPaymentTiers: true,
    layoutType: 'Detailed' as PdfLayout,
    showWatermark: false,
    watermarkText: 'OFFICIAL DRAFT',
    showSeal: true
  };

  const initialDocSettings = {
    ...defaultDocSettings,
    ...(resolvedQuote?.documentSettings || resolvedProject?.documentSettings || resolvedInvoice?.documentSettings || {})
  } as any;

  const [docSettings, setDocSettings] = useState(initialDocSettings);

  React.useEffect(() => {
    setDocSettings(initialDocSettings);
  }, [resolvedQuote?.id, resolvedProject?.id, resolvedInvoice?.id]);

  const updateDocSettings = (updates: Partial<typeof docSettings>) => {
    const newSettings = { ...docSettings, ...updates };
    setDocSettings(newSettings);

    if (type === 'Quote' && onUpdateQuote && resolvedQuote) {
      onUpdateQuote({
        ...resolvedQuote,
        documentSettings: newSettings
      });
    } else if (resolvedProject && onUpdateProject) {
      onUpdateProject({
        ...resolvedProject,
        documentSettings: newSettings
      });
    }
  };

  // Find or generate SVC verification code
  const currentSvcCode = useMemo(() => {
    const targetId = resolvedQuote?.id || resolvedProject?.id || resolvedInvoice?.id;
    if (targetId) {
      const existing = verificationRegistry.find(e => e.internalId === targetId);
      if (existing) return existing.svcCode;
    }
    return 'SVC-2026-ENCRYPTED';
  }, [resolvedQuote?.id, resolvedProject?.id, resolvedInvoice?.id, verificationRegistry]);

  const handleDownload = async () => {
    if (format === 'print') {
      window.print();
      return;
    }
    setIsGenerating(true);
    try {
      const dataWithSettings = resolvedQuote 
        ? { ...resolvedQuote, documentSettings: docSettings }
        : resolvedProject 
          ? { ...resolvedProject, documentSettings: docSettings }
          : resolvedInvoice
            ? { ...resolvedInvoice, documentSettings: docSettings }
            : data;

      if (format === 'pdf') {
        let svcCode: string | undefined = currentSvcCode;

        if (type === 'Quote' && resolvedQuote) {
          if (!svcCode || svcCode === 'SVC-2026-ENCRYPTED') {
            svcCode = registerDocument('Quotation', resolvedQuote.quoteNo, resolvedQuote.id, {
              customerName: resolvedQuote.client.name,
              projectName: resolvedQuote.projectName,
              totalValue: calculateQuoteTotal(resolvedQuote)
            }, resolvedQuote.version || 1);
          }
          await generateQuotePDF(dataWithSettings as Quote, docSettings.layoutType, settings, false, svcCode);
        } else if (type === 'Invoice' && resolvedInvoice) {
          if (!svcCode || svcCode === 'SVC-2026-ENCRYPTED') {
            svcCode = registerDocument('Invoice', resolvedInvoice.invoiceNo, resolvedInvoice.id, {
              customerName: resolvedInvoice.client.name,
              projectName: resolvedInvoice.projectName || '',
              totalValue: resolvedInvoice.grandTotal
            }, 1);
          }
          await generateInvoicePDF(dataWithSettings as Invoice, settings, false, svcCode);
        } else if (type === 'Project' && resolvedProject) {
          if (!svcCode || svcCode === 'SVC-2026-ENCRYPTED') {
            svcCode = registerDocument('ProjectReport', resolvedProject.originalQuoteNo || resolvedProject.projectName, resolvedProject.id, {
              customerName: resolvedProject.client.name,
              projectName: resolvedProject.projectName,
              totalValue: resolvedProject.totalValue
            }, 1);
          }
          await generateProjectReportPDF(dataWithSettings as Project, settings, false, svcCode);
        } else if (type === 'Variation' && resolvedProject) {
          if (!svcCode || svcCode === 'SVC-2026-ENCRYPTED') {
            svcCode = registerDocument('Variation', resolvedProject.originalQuoteNo || resolvedProject.projectName, resolvedProject.id, {
              customerName: resolvedProject.client.name,
              projectName: resolvedProject.projectName,
              totalValue: resolvedProject.totalValue
            }, 1);
          }
          await generateVariationReport(dataWithSettings as Project, settings, false, svcCode);
        } else if (type === 'AuditLog' && resolvedAuditLogs) {
          await generateAuditLogPDF(resolvedAuditLogs, settings);
        } else if (type === 'Timeline') {
          await generateTimelineReport(dataWithSettings, settings, false, svcCode);
        } else if (type === 'Dashboard') {
          await generateDashboardReport(allQuotes, allProjects, settings);
        } else if (type === 'AllDocuments' && resolvedProject) {
          const associatedQuote = allQuotes.find(q => q.id === resolvedProject.quoteId);
          await generateAllProjectDocumentsPDF(dataWithSettings as Project, associatedQuote, allInvoices, allAuditLogs, settings);
        } else if (type === 'CustomerReports' && resolvedCustomer) {
          const { generateAllCustomerReportsPDF } = await import('../pdfGenerator');
          await generateAllCustomerReportsPDF(
            resolvedCustomer.customerName,
            allInvoices,
            allProjects,
            allPayments,
            allAdjustments,
            settings
          );
        }
      } else if (format === 'csv') {
        await generateCSV();
      } else {
        await generateDocx();
      }
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const getBusinessHeaderDocx = (title: string, projectName: string, refNo: string) => [
    new Paragraph({
      children: [
        new TextRun({
          text: settings?.name || 'INNOVISTA METAL FABRICONIX (PVT) LTD.',
          bold: true,
          size: 30,
          color: (docSettings.accentColor || '#ea580c').replace('#', ''),
        }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: title,
          bold: true,
          size: 22,
        }),
      ],
      alignment: AlignmentType.RIGHT,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Project: ${projectName}`,
          bold: true,
        }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Ref #: ${refNo}`,
        }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Date: ${new Date().toLocaleDateString('en-GB')}`,
        }),
      ],
    }),
    new Paragraph({ text: "" }),
  ];

  const getQuoteDocxChildren = (q: Quote) => {
    const itemsTotal = q.items?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;
    const discountAmount = itemsTotal * ((q.discountPercent || 0) / 100);
    const totalBeforeTax = itemsTotal - discountAmount;
    const taxAmount = totalBeforeTax * ((q.taxPercent || 0) / 100);
    const grandTotal = totalBeforeTax + taxAmount;

    return [
      ...getBusinessHeaderDocx('QUOTATION', q.projectName, q.quoteNo),
      new Paragraph({
        children: [new TextRun({ text: "Quotation Specification Schedule", bold: true, size: 24 })],
      }),
      new Paragraph(`Pricing Method: ${q.pricingMethod || 'Unit Rate'}`),
      new Paragraph(`Project Stage: ${q.projectStage || 'Engineering Tender'}`),
      new Paragraph(""),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Item", bold: true })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Description", bold: true })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Qty", bold: true })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Rate", bold: true })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Amount", bold: true })] })] }),
            ],
          }),
          ...(q.items || []).map(item => new TableRow({
            children: [
              new TableCell({ children: [new Paragraph(item.no || "")] }),
              new TableCell({ children: [new Paragraph(item.name || "")] }),
              new TableCell({ children: [new Paragraph(`${item.qty} ${item.unit}`)] }),
              new TableCell({ children: [new Paragraph(item.rate?.toLocaleString() || "0")] }),
              new TableCell({ children: [new Paragraph(item.amount?.toLocaleString() || "0")] }),
            ],
          })),
          new TableRow({
            children: [
              new TableCell({ columnSpan: 4, children: [new Paragraph({ children: [new TextRun({ text: "Sub Total", bold: true })], alignment: AlignmentType.RIGHT })] }),
              new TableCell({ children: [new Paragraph(itemsTotal.toLocaleString())] }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({ columnSpan: 4, children: [new Paragraph({ children: [new TextRun({ text: "Grand Total", bold: true })], alignment: AlignmentType.RIGHT })] }),
              new TableCell({ children: [new Paragraph(grandTotal.toLocaleString())] }),
            ],
          }),
        ],
      }),
      new Paragraph(""),
      new Paragraph({
        children: [new TextRun({ text: "Total in Words: ", bold: true }), new TextRun({ text: `${numberToWords(grandTotal)} Only` })],
      }),
    ];
  };

  const getInvoiceDocxChildren = (inv: Invoice) => [
    ...getBusinessHeaderDocx('COMMERCIAL TAX INVOICE', inv.projectName || 'N/A', inv.invoiceNo),
    new Paragraph(`Billed To: ${inv.client?.name || 'Valued Client'}`),
    new Paragraph(`Status: ${inv.status}`),
    new Paragraph(`PO Reference: ${inv.purchaseOrderNo || 'N/A'}`),
    new Paragraph(""),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Item #", bold: true })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Description", bold: true })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Qty", bold: true })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Amount", bold: true })] })] }),
          ],
        }),
        ...(inv.items || []).map(item => new TableRow({
          children: [
            new TableCell({ children: [new Paragraph(item.itemNo || "")] }),
            new TableCell({ children: [new Paragraph(item.description || "")] }),
            new TableCell({ children: [new Paragraph(`${item.qty} ${item.unit}`)] }),
            new TableCell({ children: [new Paragraph(item.amount?.toLocaleString() || "0")] }),
          ],
        })),
        new TableRow({
          children: [
            new TableCell({ columnSpan: 3, children: [new Paragraph({ children: [new TextRun({ text: "Grand Total", bold: true })], alignment: AlignmentType.RIGHT })] }),
            new TableCell({ children: [new Paragraph(inv.grandTotal?.toLocaleString() || "0")] }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({ columnSpan: 3, children: [new Paragraph({ children: [new TextRun({ text: "Balance Outstanding", bold: true })], alignment: AlignmentType.RIGHT })] }),
            new TableCell({ children: [new Paragraph(inv.balanceDue?.toLocaleString() || "0")] }),
          ],
        }),
      ],
    }),
  ];

  const getProjectDocxChildren = (p: Project) => [
    ...getBusinessHeaderDocx('PROJECT EXECUTION REPORT', p.projectName, p.originalQuoteNo || 'PROJ'),
    new Paragraph(`Client: ${p.client?.name || 'N/A'}`),
    new Paragraph(`Status: ${p.status}`),
    new Paragraph(`Total Contracted Value: ${settings?.defaultCurrency || 'LKR'} ${p.totalValue?.toLocaleString()}`),
    new Paragraph(""),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Deliverable", bold: true })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Quantity", bold: true })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Classification", bold: true })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Value", bold: true })] })] }),
          ],
        }),
        ...(p.items || []).map(item => new TableRow({
          children: [
            new TableCell({ children: [new Paragraph(item.name || "")] }),
            new TableCell({ children: [new Paragraph(`${item.qty} ${item.unit}`)] }),
            new TableCell({ children: [new Paragraph(item.variationStatus || "Original")] }),
            new TableCell({ children: [new Paragraph(item.amount?.toLocaleString() || "0")] }),
          ],
        })),
      ],
    }),
  ];

  const getCustomerReportsDocxChildren = (custName: string, invoicesList: Invoice[], projectsList: Project[]) => {
    const clientProjects = projectsList.filter(p => p.client?.name?.toLowerCase() === custName.toLowerCase());
    const clientInvoices = invoicesList.filter(inv => inv.client?.name?.toLowerCase() === custName.toLowerCase());
    const totalContracted = clientProjects.reduce((s, p) => s + (p.totalValue || 0), 0);
    const totalInvoiced = clientInvoices.reduce((s, inv) => s + (inv.grandTotal || 0), 0);
    const balanceDue = clientInvoices.reduce((s, inv) => s + (inv.balanceDue || 0), 0);

    return [
      ...getBusinessHeaderDocx('CUSTOMER ACCOUNT STATEMENT', custName, 'STMT-2026'),
      new Paragraph(`Customer: ${custName}`),
      new Paragraph(`Total Contracted: ${totalContracted.toLocaleString()}`),
      new Paragraph(`Total Invoiced: ${totalInvoiced.toLocaleString()}`),
      new Paragraph(`Outstanding Balance: ${balanceDue.toLocaleString()}`),
      new Paragraph(""),
      new Paragraph({ children: [new TextRun({ text: "Invoice Activity Register", bold: true, size: 22 })] }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Invoice #", bold: true })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Date", bold: true })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Status", bold: true })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Balance Due", bold: true })] })] }),
            ],
          }),
          ...clientInvoices.map(inv => new TableRow({
            children: [
              new TableCell({ children: [new Paragraph(inv.invoiceNo)] }),
              new TableCell({ children: [new Paragraph(inv.date)] }),
              new TableCell({ children: [new Paragraph(inv.status)] }),
              new TableCell({ children: [new Paragraph(inv.balanceDue?.toLocaleString() || "0")] }),
            ],
          })),
        ],
      }),
    ];
  };

  const generateCSV = async () => {
    let csvContent = "";
    let fileName = `${type}_Report.csv`;

    if (type === 'Quote' && resolvedQuote) {
      fileName = `Quotation_${resolvedQuote.quoteNo}.csv`;
      csvContent = "Item No,Description,Unit,Qty,Rate,Amount\n";
      (resolvedQuote.items || []).forEach(item => {
        csvContent += `"${item.no || ''}","${(item.name || '').replace(/"/g, '""')}","${item.unit}",${item.qty},${item.rate},${item.amount}\n`;
      });
      csvContent += `\nSub Total,,,${(resolvedQuote.items || []).reduce((s, i) => s + (i.amount || 0), 0)}\n`;
      csvContent += `Grand Total,,,${calculateQuoteTotal(resolvedQuote)}\n`;
    } else if (type === 'Invoice' && resolvedInvoice) {
      fileName = `Invoice_${resolvedInvoice.invoiceNo}.csv`;
      csvContent = "Item No,Description,Unit,Qty,Rate,Amount\n";
      (resolvedInvoice.items || []).forEach(item => {
        csvContent += `"${item.itemNo || ''}","${(item.description || '').replace(/"/g, '""')}","${item.unit}",${item.qty},${item.rate},${item.amount}\n`;
      });
      csvContent += `\nSub Total,,,${resolvedInvoice.subTotal}\n`;
      csvContent += `Tax Total,,,${resolvedInvoice.taxTotal}\n`;
      csvContent += `Grand Total,,,${resolvedInvoice.grandTotal}\n`;
      csvContent += `Balance Due,,,${resolvedInvoice.balanceDue}\n`;
    } else if (type === 'Project' && resolvedProject) {
      fileName = `Project_${resolvedProject.projectName.replace(/\s+/g, '_')}.csv`;
      csvContent = `Project: ${resolvedProject.projectName},Status: ${resolvedProject.status},Total Value: ${resolvedProject.totalValue}\n\n`;
      csvContent += "Item,Quantity,Unit,Amount,Variation\n";
      (resolvedProject.items || []).forEach(item => {
        csvContent += `"${(item.name || '').replace(/"/g, '""')}",${item.qty},"${item.unit}",${item.amount},"${item.variationStatus || 'Original'}"\n`;
      });
    } else if (type === 'Variation' && resolvedProject) {
      fileName = `Variation_Claim_${resolvedProject.projectName.replace(/\s+/g, '_')}.csv`;
      csvContent = "Item,Variation Status,Quantity,Unit,Amount\n";
      (resolvedProject.items || []).forEach(item => {
        csvContent += `"${(item.name || '').replace(/"/g, '""')}","${item.variationStatus || 'Original'}",${item.qty},"${item.unit}",${item.amount}\n`;
      });
    } else if (type === 'AuditLog') {
      fileName = "Security_Audit_Logs.csv";
      csvContent = "Date,Action,Details,User,Project\n";
      resolvedAuditLogs.forEach(log => {
        csvContent += `"${log.timestamp}","${log.action}","${(log.details || '').replace(/"/g, '""')}","${log.user}","${log.projectName || 'System'}"\n`;
      });
    } else if (type === 'Dashboard') {
      fileName = "Executive_Dashboard_Summary.csv";
      csvContent = "Metric,Value\n";
      csvContent += `Total Quotes,${allQuotes.length}\n`;
      csvContent += `Total Projects,${allProjects.length}\n`;
      csvContent += `Total Contracted Sum,${allProjects.reduce((s, p) => s + (p.totalValue || 0), 0)}\n`;
      csvContent += `Total Invoiced,${allInvoices.reduce((s, inv) => s + (inv.grandTotal || 0), 0)}\n`;
      csvContent += `Total Cash Collected,${allInvoices.reduce((s, inv) => s + (inv.amountPaid || 0), 0)}\n`;
    } else if (type === 'CustomerReports' && resolvedCustomer) {
      fileName = `Customer_Statement_${resolvedCustomer.customerName.replace(/\s+/g, '_')}.csv`;
      csvContent = `Customer Account Statement: ${resolvedCustomer.customerName}\n\n`;
      csvContent += "Invoice No,Date,Status,Grand Total,Balance Due\n";
      allInvoices.filter(i => i.client?.name?.toLowerCase() === resolvedCustomer.customerName.toLowerCase()).forEach(inv => {
        csvContent += `"${inv.invoiceNo}","${inv.date}","${inv.status}",${inv.grandTotal},${inv.balanceDue}\n`;
      });
    } else {
      fileName = `${type}_Data.csv`;
      csvContent = "Reference,Timestamp,GeneratedBy\n";
      csvContent += `"INNOVISTA-${type}","${new Date().toISOString()}","System Output"\n`;
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, fileName);
  };

  const generateDocx = async () => {
    let children: any[] = [];

    if (type === 'Quote' && resolvedQuote) {
      children = getQuoteDocxChildren(resolvedQuote);
    } else if (type === 'Invoice' && resolvedInvoice) {
      children = getInvoiceDocxChildren(resolvedInvoice);
    } else if (type === 'Project' && resolvedProject) {
      children = getProjectDocxChildren(resolvedProject);
    } else if (type === 'CustomerReports' && resolvedCustomer) {
      children = getCustomerReportsDocxChildren(resolvedCustomer.customerName, allInvoices, allProjects);
    } else if (resolvedProject) {
      children = getProjectDocxChildren(resolvedProject);
    } else if (resolvedQuote) {
      children = getQuoteDocxChildren(resolvedQuote);
    } else {
      children = [
        ...getBusinessHeaderDocx(`${type.toUpperCase()} REPORT`, 'Innovista Suite', 'DOC-2026'),
        new Paragraph("Report generated via Innovista Document Studio."),
      ];
    }

    const doc = new Document({
      sections: [{
        properties: {},
        children: children.filter(Boolean),
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${type}_Report_${Date.now()}.docx`);
  };

  if (!isOpen) return null;

  const resolvedDocRef = resolvedQuote?.quoteNo || resolvedInvoice?.invoiceNo || resolvedProject?.originalQuoteNo || (type === 'AuditLog' ? 'AUDIT-2026' : 'DOC-2026');
  const resolvedProjectName = resolvedQuote?.projectName || resolvedInvoice?.projectName || resolvedProject?.projectName || 'Innovista Commercial Engineering';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] w-screen h-screen flex flex-col bg-white overflow-hidden text-slate-800">
        
        {/* ========================================================================= */}
        {/* FULL SCREEN MAIN STUDIO WORKSPACE (Split Left Settings + Right Canvas)    */}
        {/* ========================================================================= */}
        <div className="flex-1 flex overflow-hidden w-full h-full">
          
          {/* ----------------------------------------------------------------------- */}
          {/* LEFT COLUMN: CRISP WHITE CUSTOMIZATION & EXPORT CONFIGURATION STUDIO    */}
          {/* ----------------------------------------------------------------------- */}
          <aside className="w-[360px] bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 overflow-y-auto custom-scrollbar text-slate-800">
            
            <div className="p-5 space-y-5">
              
              {/* Top Studio Brand & Close for Left Sidebar */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-base font-black tracking-tight text-[#1D4ED8] font-sans">
                    INNOVISTA
                  </span>
                  <span className="text-base font-black tracking-tight text-[#0F172A] font-sans">
                    METAL
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-mono font-semibold border border-blue-200">
                    {type}
                  </span>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  title="Close Studio (Esc)"
                >
                  <X size={16} />
                </button>
              </div>

              {/* 1. File Format Engine Selection */}
              <div>
                <label className="text-[10px] font-bold tracking-wider uppercase text-slate-500 block mb-2">
                  Export Output Engine
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'pdf', label: 'PDF Document', desc: 'Vector Print Ready', icon: FileText, color: 'text-rose-500' },
                    { id: 'docx', label: 'Microsoft Word', desc: 'Editable OpenXML', icon: FileCode, color: 'text-sky-600' },
                    { id: 'csv', label: 'Spreadsheet', desc: 'Raw Tabular CSV', icon: FileSpreadsheet, color: 'text-emerald-600' },
                    { id: 'print', label: 'Laser Print', desc: 'Direct Thermal/Laser', icon: Printer, color: 'text-amber-600' },
                  ].map(f => {
                    const Icon = f.icon;
                    const isActive = format === f.id;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setFormat(f.id as any)}
                        className={cn(
                          "p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer shadow-2xs",
                          isActive 
                            ? "bg-blue-50/80 border-[#1D4ED8] text-[#1D4ED8] ring-1 ring-blue-500/30" 
                            : "bg-slate-50/80 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300"
                        )}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <Icon className={cn("w-4 h-4", isActive ? "text-[#1D4ED8]" : f.color)} />
                          {isActive && <Check className="w-3.5 h-3.5 text-[#1D4ED8]" />}
                        </div>
                        <span className="text-xs font-bold block">{f.label}</span>
                        <span className="text-[10px] text-slate-500 block">{f.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Document Layout Preset */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-bold tracking-wider uppercase text-slate-500">
                    Document Archetype & Layout
                  </label>
                  <span className="text-[10px] text-blue-700 font-mono font-bold">{docSettings.layoutType}</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                  {(['Detailed', 'Compact', 'Summary', 'Executive'] as PdfLayout[]).map(l => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => updateDocSettings({ layoutType: l })}
                      className={cn(
                        "py-1.5 px-2 rounded-lg text-xs font-semibold transition-all text-center cursor-pointer",
                        docSettings.layoutType === l
                          ? "bg-[#1D4ED8] text-white shadow-xs"
                          : "text-slate-600 hover:text-slate-900 hover:bg-white"
                      )}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Visual Identity & Accent Palette */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-bold tracking-wider uppercase text-slate-500 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-[#1D4ED8]" />
                    Brand Accent Palette
                  </label>
                  <span className="text-[10px] font-mono text-slate-500">{docSettings.accentColor}</span>
                </div>
                <div className="flex items-center gap-2">
                  {[
                    { color: '#1d4ed8', name: 'Royal Navy' },
                    { color: '#ea580c', name: 'Innovista Orange' },
                    { color: '#0f172a', name: 'Precision Slate' },
                    { color: '#059669', name: 'Emerald QC' },
                    { color: '#b91c1c', name: 'Crimson' }
                  ].map(c => (
                    <button
                      key={c.color}
                      type="button"
                      onClick={() => updateDocSettings({ accentColor: c.color })}
                      title={c.name}
                      className={cn(
                        "w-7 h-7 rounded-full border-2 transition-all flex items-center justify-center cursor-pointer shrink-0 shadow-2xs",
                        docSettings.accentColor === c.color 
                          ? "scale-110 border-slate-800 shadow-md ring-2 ring-blue-500/40" 
                          : "border-transparent opacity-85 hover:opacity-100"
                      )}
                      style={{ backgroundColor: c.color }}
                    >
                      {docSettings.accentColor === c.color && <Check size={12} className="text-white" />}
                    </button>
                  ))}
                  <div className="relative ml-auto">
                    <input 
                      type="color"
                      value={docSettings.accentColor}
                      onChange={(e) => updateDocSettings({ accentColor: e.target.value })}
                      className="w-7 h-7 rounded-full border border-slate-300 bg-transparent cursor-pointer"
                      title="Pick Custom Hex Color"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Typography Scale Slider */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-bold tracking-wider uppercase text-slate-500 flex items-center gap-1.5">
                    <Type className="w-3.5 h-3.5 text-[#1D4ED8]" />
                    Document Font Scale
                  </label>
                  <span className="text-xs font-mono font-bold text-slate-900">{docSettings.fontSize}pt</span>
                </div>
                <input 
                  type="range"
                  min="8"
                  max="13"
                  step="0.5"
                  value={docSettings.fontSize}
                  onChange={(e) => updateDocSettings({ fontSize: parseFloat(e.target.value) })}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#1D4ED8]"
                />
                <div className="flex justify-between text-[9px] text-slate-500 font-mono mt-1">
                  <span>8pt (Dense)</span>
                  <span>10pt (Standard)</span>
                  <span>13pt (Large)</span>
                </div>
              </div>

              {/* 5. Structural Inclusions */}
              <div>
                <label className="text-[10px] font-bold tracking-wider uppercase text-slate-500 block mb-1.5">
                  Document Components & Verification
                </label>
                <div className="space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                  {[
                    { key: 'showLogo', label: 'Company Header & Letterhead' },
                    { key: 'showBankDetails', label: 'Banking & Remittance Advice' },
                    { key: 'showPaymentTiers', label: 'Milestone Payment Schedule' },
                    { key: 'showSeal', label: 'Cryptographic QR Verification Seal' },
                    { key: 'showWatermark', label: 'Security Status Watermark' },
                  ].map(item => {
                    const isChecked = Boolean(docSettings[item.key as keyof typeof docSettings]);
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => updateDocSettings({ [item.key]: !isChecked })}
                        className="w-full flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-left cursor-pointer"
                      >
                        <span className={isChecked ? "text-slate-900 font-medium" : "text-slate-500"}>
                          {item.label}
                        </span>
                        <div className={cn(
                          "w-8 h-4 rounded-full transition-colors relative",
                          isChecked ? "bg-[#1D4ED8]" : "bg-slate-300"
                        )}>
                          <div className={cn(
                            "absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all shadow-2xs",
                            isChecked ? "left-4.5" : "left-0.5"
                          )} />
                        </div>
                      </button>
                    );
                  })}

                  {docSettings.showWatermark && (
                    <div className="pt-2 border-t border-slate-200 px-1 mt-1">
                      <span className="text-[10px] text-slate-500 block mb-1 font-medium">Watermark Stamp Text</span>
                      <div className="flex gap-1.5">
                        {['OFFICIAL DRAFT', 'CONFIDENTIAL', 'APPROVED'].map(w => (
                          <button
                            key={w}
                            type="button"
                            onClick={() => updateDocSettings({ watermarkText: w })}
                            className={cn(
                              "px-2 py-1 rounded text-[10px] font-mono transition-colors cursor-pointer",
                              docSettings.watermarkText === w 
                                ? "bg-blue-100 text-[#1D4ED8] font-bold border border-blue-400" 
                                : "bg-white text-slate-600 border border-slate-200 hover:text-slate-900"
                            )}
                          >
                            {w}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Action Footer: Primary Export Button */}
            <div className="p-4 bg-slate-50 border-t border-slate-200">
              <button
                type="button"
                onClick={handleDownload}
                disabled={isGenerating}
                className="w-full py-3 px-4 bg-[#1D4ED8] hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <Loader2 size={16} className="animate-spin text-white" />
                ) : (
                  <Download size={15} />
                )}
                <span>
                  {isGenerating 
                    ? 'Generating Document...' 
                    : format === 'print' 
                      ? 'Send to Laser Printer' 
                      : format === 'docx' 
                        ? 'Export Microsoft Word (.docx)' 
                        : format === 'csv' 
                          ? 'Export Tabular Data (.csv)' 
                          : 'Download PDF Report'}
                </span>
              </button>
              <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 font-mono">
                <span>Target: {format.toUpperCase()}</span>
                <span>A4 Proportional Print Format</span>
              </div>
            </div>

          </aside>

          {/* ----------------------------------------------------------------------- */}
          {/* RIGHT COLUMN: INTERACTIVE A4 LIVE DOCUMENT CANVAS VIEWPORT              */}
          {/* ----------------------------------------------------------------------- */}
          <main className="flex-1 bg-slate-100/90 flex flex-col overflow-hidden relative">
            
            {/* Canvas Navigation & Controls Toolbar */}
            <div className="h-12 px-6 bg-white border-b border-slate-200 flex items-center justify-between text-xs shrink-0 z-20 shadow-2xs">
              
              {/* Left Side: Exit Button & Document Meta */}
              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-2xs transition-colors cursor-pointer"
                  title="Close Document Studio (Esc)"
                >
                  <ArrowLeft size={14} className="text-slate-500" />
                  <span>Exit Studio</span>
                </button>
                <div className="h-4 w-px bg-slate-200" />
                <span className="font-mono text-xs font-bold text-[#1D4ED8] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {resolvedDocRef}
                </span>
                <span className="text-slate-600 font-medium hidden md:inline truncate max-w-sm">
                  {resolvedProjectName}
                </span>
              </div>

              {/* Right Side: Sync & Controls */}
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Print Engine Synchronized</span>
                </div>

                <div className="h-4 w-px bg-slate-200 hidden sm:block" />

                {/* Zoom controls */}
                <div className="flex items-center gap-1 bg-slate-50 rounded-lg p-0.5 border border-slate-200">
                  <button 
                    onClick={() => setZoom(prev => Math.max(0.6, prev - 0.1))} 
                    className="p-1 hover:text-slate-900 text-slate-500 hover:bg-white rounded cursor-pointer transition-colors"
                    title="Zoom Out"
                  >
                    <ZoomOut size={13} />
                  </button>
                  <span className="text-[11px] font-mono px-2 text-slate-700 font-bold">
                    {Math.round(zoom * 100)}%
                  </span>
                  <button 
                    onClick={() => setZoom(prev => Math.min(1.4, prev + 0.1))} 
                    className="p-1 hover:text-slate-900 text-slate-500 hover:bg-white rounded cursor-pointer transition-colors"
                    title="Zoom In"
                  >
                    <ZoomIn size={13} />
                  </button>
                  <button 
                    onClick={() => setZoom(0.9)} 
                    className="px-1.5 py-0.5 text-[10px] text-slate-600 hover:text-slate-900 hover:bg-white rounded cursor-pointer transition-colors"
                    title="Reset Zoom"
                  >
                    Fit
                  </button>
                </div>

                {/* Direct Laser / Browser Print */}
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-slate-700 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                  title="Direct Browser Print"
                >
                  <Printer size={14} className="text-slate-600" />
                  <span>Print</span>
                </button>

                {/* Direct Download Button */}
                <button
                  onClick={handleDownload}
                  disabled={isGenerating}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#1D4ED8] hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                  title="Export Current Document"
                >
                  {isGenerating ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                  <span>Export</span>
                </button>

                {/* Close Studio X */}
                <button
                  onClick={onClose}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  title="Close (Esc)"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Scrollable Viewport with A4 Paper Rendered */}
            <div className="flex-1 overflow-auto p-6 lg:p-10 custom-scrollbar flex justify-center bg-slate-100/90">
              <DocumentLiveSheet
                type={type}
                data={data}
                settings={settings}
                docSettings={docSettings}
                allQuotes={allQuotes}
                allProjects={allProjects}
                allAuditLogs={allAuditLogs}
                allInvoices={allInvoices}
                allPayments={allPayments}
                allAdjustments={allAdjustments}
                svcCode={currentSvcCode}
                zoom={zoom}
              />
            </div>

          </main>

        </div>

      </div>
    </AnimatePresence>
  );
};
