import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Quote, numberToWords, PdfLayout, CompanySettings, Project, AuditLog, BOQItem, Invoice, InvoiceType, Job } from './types';
import { UniversalDocFormData } from './services/procurementDocTypes';
import { computeItemNumber } from './lib/utils';

const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 37, g: 99, b: 235 };
};

const getFinalY = (doc: jsPDF, fallback: number = 0) => {
  return (doc as any).lastAutoTable?.finalY || fallback;
};

export const generateQRCodeDataUrl = async (value: string): Promise<string> => {
  try {
    return await QRCode.toDataURL(value || 'DOC-VERIFY', {
      margin: 1,
      width: 100,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    });
  } catch (err) {
    console.error('QR generation failed', err);
    return '';
  }
};

export const generateBarcodeDataUrl = (value: string): string => {
  try {
    const canvas = document.createElement('canvas');
    JsBarcode(canvas, value || 'CODE-128', { 
      format: 'CODE128', 
      displayValue: false,
      height: 60,
      width: 2,
      margin: 0,
      background: '#ffffff'
    });
    return canvas.toDataURL('image/png', 1.0);
  } catch (err) {
    console.error('Barcode generation failed', err);
    return '';
  }
};

const formatItemSpecification = (spec?: any): string => {
  if (!spec) return '';
  const parts: string[] = [];

  if (spec.core) {
    if (spec.core.systemType) parts.push(`System: ${spec.core.systemType}`);
    if (spec.core.location) parts.push(`Location: ${spec.core.location}`);
    if (spec.core.reference) parts.push(`Reference: ${spec.core.reference}`);
  }

  if (spec.dimensions) {
    const { width, height, panels, opening } = spec.dimensions;
    if (width || height) parts.push(`Dimensions: ${width || 'N/A'} x ${height || 'N/A'}`);
    if (panels) parts.push(`Panels: ${panels}`);
    if (opening) parts.push(`Opening: ${opening}`);
  }

  if (spec.materials) {
    if (spec.materials.aluminium?.length) {
      parts.push(`Aluminium: ${spec.materials.aluminium.map((a: any) => `${a.series || ''} ${a.finish || ''}`).filter(Boolean).join(', ')}`);
    }
    if (spec.materials.steel) {
      const s = spec.materials.steel;
      if (s.type || s.section || s.thickness || s.treatment) {
        parts.push(`Steel: ${s.type || ''} ${s.section || ''} ${s.thickness ? `(${s.thickness})` : ''} ${s.treatment || ''}`.trim());
      }
    }
    if (spec.materials.glass?.length) {
      parts.push(`Glass: ${spec.materials.glass.map((g: any) => `${g.thickness || ''} ${g.type || ''}`).filter(Boolean).join(', ')}`);
    }
    if (spec.materials.accessories?.length) {
      parts.push(`Accessories: ${spec.materials.accessories.map((a: any) => a.name).filter(Boolean).join(', ')}`);
    }
  }

  if (spec.customMaterials?.length) {
    parts.push(`Custom Materials: ${spec.customMaterials.map((m: any) => `${m.name} (${m.qty} ${m.unit})`).join(', ')}`);
  }

  const otherFields = [
    { label: 'Functional', value: spec.functional },
    { label: 'Fabrication', value: spec.fabrication },
    { label: 'Finishing', value: spec.finishing },
    { label: 'Installation', value: spec.installation },
    { label: 'Exclusions', value: spec.exclusions },
    { label: 'Site Conditions', value: spec.siteConditions },
    { label: 'Quality', value: spec.quality },
    { label: 'Testing', value: spec.testing },
    { label: 'Warranty', value: spec.warranty },
    { label: 'Delivery', value: spec.delivery },
    { label: 'Notes', value: spec.notes }
  ];

  otherFields.forEach(f => {
    if (f.value && f.value.trim()) {
      parts.push(`${f.label}: ${f.value.trim()}`);
    }
  });

  return parts.length > 0 ? '\nSPECIFICATIONS:\n' + parts.join('\n') : '';
};

let cachedDefaultLogoDataUrl: string | null = null;

export const getCompanyLogoDataUrl = (customLogoUrl?: string): string => {
  if (customLogoUrl && customLogoUrl.startsWith('data:image/')) {
    return customLogoUrl;
  }
  try {
    const savedSettingsRaw = typeof localStorage !== 'undefined' ? localStorage.getItem('companySettings') : null;
    if (savedSettingsRaw) {
      const parsed = JSON.parse(savedSettingsRaw);
      if (parsed?.logo && typeof parsed.logo === 'string' && parsed.logo.startsWith('data:image/')) {
        return parsed.logo;
      }
    }
  } catch {}

  if (cachedDefaultLogoDataUrl) return cachedDefaultLogoDataUrl;

  try {
    const canvas = document.createElement('canvas');
    const size = 240;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Crisp white outer background for clean print
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);

    // Outer corporate rounded frame in Royal Blue
    const pad = 10;
    const r = 36;
    const w = size - pad * 2;
    const h = size - pad * 2;

    ctx.beginPath();
    ctx.moveTo(pad + r, pad);
    ctx.lineTo(pad + w - r, pad);
    ctx.quadraticCurveTo(pad + w, pad, pad + w, pad + r);
    ctx.lineTo(pad + w, pad + h - r);
    ctx.quadraticCurveTo(pad + w, pad + h, pad + w - r, pad + h);
    ctx.lineTo(pad + r, pad + h);
    ctx.quadraticCurveTo(pad, pad + h, pad, pad + h - r);
    ctx.lineTo(pad, pad + r);
    ctx.quadraticCurveTo(pad, pad, pad + r, pad);
    ctx.closePath();

    const grad = ctx.createLinearGradient(pad, pad, pad + w, pad + h);
    grad.addColorStop(0, '#1d4ed8'); // Royal Blue
    grad.addColorStop(0.65, '#1e40af'); // Deep Corporate Blue
    grad.addColorStop(1, '#0f172a'); // Slate Navy
    ctx.fillStyle = grad;
    ctx.fill();

    // Inner subtle architectural frame line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Architectural structural facade grid / diamond accent at top
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(size / 2, 34);
    ctx.lineTo(size / 2 + 28, 56);
    ctx.lineTo(size / 2, 78);
    ctx.lineTo(size / 2 - 28, 56);
    ctx.closePath();
    ctx.stroke();

    // Bold "IM" Monogram in crisp white
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 78px Helvetica, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('IM', size / 2, 132);

    // Bottom brand bar text "INNOVISTA"
    ctx.fillStyle = '#93c5fd';
    ctx.font = 'bold 22px Helvetica, Arial, sans-serif';
    ctx.fillText('INNOVISTA', size / 2, 194);

    cachedDefaultLogoDataUrl = canvas.toDataURL('image/png', 1.0);
    return cachedDefaultLogoDataUrl;
  } catch (err) {
    console.error('Logo generation failed', err);
    return '';
  }
};

export const sanitizePdfText = (input: unknown, fallback = '-'): string => {
  if (input === null || input === undefined) return fallback;
  let str = String(input)
    .replace(/\bundefined\b/gi, '-')
    .replace(/\bnull\b/gi, '-')
    .replace(/\s*[→➔➜➡⟶⇒▸▶]\s*/g, ' -> ')
    .replace(/\s*[←⟵]\s*/g, ' <- ')
    .replace(/\s*[↔⟷]\s*/g, ' <-> ')
    .replace(/[—–−]/g, '-')
    .replace(/[•·▪▫]/g, '|')
    .replace(/≤/g, '<=')
    .replace(/≥/g, '>=')
    .replace(/≠/g, '!=')
    .replace(/≈/g, '~')
    .replace(/±/g, '+/-')
    .replace(/×/g, 'x')
    .replace(/÷/g, '/')
    .replace(/m²/gi, 'sqm')
    .replace(/m³/gi, 'cum')
    .replace(/²/g, '2')
    .replace(/³/g, '3')
    .replace(/[µμ]m/g, 'um')
    .replace(/°/g, ' deg')
    .replace(/[“”„]/g, '"')
    .replace(/[‘’‚]/g, "'")
    .replace(/…/g, '...');

  if (typeof str.normalize === 'function') {
    str = str.normalize('NFKD');
  }
  // Keep only printable ASCII plus newline/tab so jsPDF standard fonts never corrupt spacing
  str = str
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/Bay:\s*-(\s*\|\s*|$)/gi, 'Bay: Main Bay$1')
    .replace(/Drawing:\s*\(/gi, 'Drawing: DRW-FAB-101 (')
    .trim();

  return str.length > 0 ? str : fallback;
};

export const drawCompanyLogoAtActualWidth = (
  doc: jsPDF,
  logoDataUrl: string,
  rightEdgeX: number,
  topY: number,
  targetHeightMm: number = 10.5,
  maxWidthMm: number = 46
): { width: number; height: number } => {
  if (!logoDataUrl) return { width: 0, height: 0 };
  try {
    const props = (doc as any).getImageProperties ? doc.getImageProperties(logoDataUrl) : null;
    const natW = Number(props?.width) || 100;
    const natH = Number(props?.height) || 100;
    const aspect = natW > 0 && natH > 0 ? natW / natH : 1;
    let drawH = targetHeightMm;
    let drawW = drawH * aspect;
    if (drawW > maxWidthMm) {
      drawW = maxWidthMm;
      drawH = drawW / aspect;
    }
    const fmt =
      logoDataUrl.startsWith('data:image/jpeg') || logoDataUrl.startsWith('data:image/jpg')
        ? 'JPEG'
        : 'PNG';
    doc.addImage(logoDataUrl, fmt, rightEdgeX - drawW, topY, drawW, drawH);
    return { width: drawW, height: drawH };
  } catch (e) {
    try {
      doc.addImage(logoDataUrl, 'PNG', rightEdgeX - targetHeightMm, topY, targetHeightMm, targetHeightMm);
      return { width: targetHeightMm, height: targetHeightMm };
    } catch {
      console.error('Error adding company logo to PDF header:', e);
      return { width: 0, height: 0 };
    }
  }
};

export const fitPdfText = (doc: jsPDF, text: string, maxWidthMm: number): string => {
  const clean = sanitizePdfText(text, '');
  if (!clean) return '';
  if (doc.getTextWidth(clean) <= maxWidthMm) return clean;
  let truncated = clean;
  while (truncated.length > 4 && doc.getTextWidth(truncated + '...') > maxWidthMm) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + '...';
};

const drawBusinessHeader = (
  doc: jsPDF, 
  title: string, 
  projectName: string, 
  date: string, 
  no: string, 
  _accentColor: string, 
  settings?: CompanySettings, 
  showLogo: boolean = true,
  validUntil?: string,
  _baseFontSize: number = 10
) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const rightEdge = pageWidth - margin;
  const maxLeftWidth = 102;

  // Top-Right Corner: Company Logo printed ABOVE the document name at its actual proportional width
  if (showLogo) {
    const logoDataUrl = getCompanyLogoDataUrl(settings?.logo);
    if (logoDataUrl) {
      drawCompanyLogoAtActualWidth(doc, logoDataUrl, rightEdge, 7.5, 10.5, 46);
    }
  }

  // Left Header: First Name of Company in Royal Blue ("INNOVISTA") + rest in Dark Slate
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  const firstWord = 'INNOVISTA';
  doc.setTextColor(29, 78, 216); // Royal Blue
  doc.text(firstWord, margin, 15);
  const firstWordW = doc.getTextWidth(firstWord);
  doc.setTextColor(15, 23, 42); // Dark Slate
  doc.text(' METAL FABRICONIX (PVT) LTD.', margin + firstWordW, 15);

  // Address and Contact Lines (fitted to maxLeftWidth so they never overlap the right side)
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);

  const address = sanitizePdfText(settings?.address, 'No. 50/B, Vishaka Place, Elapitiwela, Ragama, Sri Lanka');
  const phone = sanitizePdfText(settings?.phone, '077 1684 620');
  const email = sanitizePdfText(settings?.email, 'innovistametal@gmail.com');

  doc.text(fitPdfText(doc, `${address} | Tel: ${phone}`, maxLeftWidth), margin, 20);
  doc.text(fitPdfText(doc, `Email: ${email}`, maxLeftWidth), margin, 24.5);

  if (projectName) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(fitPdfText(doc, `Project: ${projectName}`, maxLeftWidth), margin, 29);
  }

  // Right Header (BELOW the top-right logo): Document Title in Royal Blue, Date, Ref #
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(29, 78, 216); // Royal Blue when printing
  doc.text(fitPdfText(doc, (title || 'DOCUMENT').toUpperCase(), 72), rightEdge, 22, { align: 'right' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(`Date: ${sanitizePdfText(date)}`, rightEdge, 26, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.text(`Ref #: ${sanitizePdfText(no)}`, rightEdge, 29.8, { align: 'right' });
  if (validUntil) {
    doc.setFont('helvetica', 'normal');
    doc.text(`Valid Until: ${sanitizePdfText(validUntil)}`, rightEdge, 33.2, { align: 'right' });
  }

  // Clean Blue Divider Line
  doc.setDrawColor(29, 78, 216);
  doc.setLineWidth(0.5);
  doc.line(margin, 34.5, pageWidth - margin, 34.5);
};

const drawBusinessFooter = (
  doc: jsPDF, 
  no: string, 
  pageNumber: number,
  totalPages?: number,
  barcodeDataUrl?: string,
  _svcCode?: string,
  qrDataUrl?: string
) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  
  // Draw a subtle line above footer
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.line(margin, pageHeight - 23.5, pageWidth - margin, pageHeight - 23.5);

  // Left: Square QR Code + VERIFY (properly spaced with no overlap)
  if (qrDataUrl) {
    try {
      doc.addImage(qrDataUrl, 'PNG', margin, pageHeight - 22, 11, 11);
    } catch (e) {
      console.error('Error adding QR code to footer:', e);
    }
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.setTextColor(71, 85, 105);
  doc.text('VERIFY', margin + 5.5, pageHeight - 8, { align: 'center' });

  // Center: 1D Barcode with clear gap above codeValue text (No overlap!)
  const codeValue = no || 'DOC-2026';
  const bcData = barcodeDataUrl || generateBarcodeDataUrl(codeValue);
  if (bcData) {
    try {
      const barcodeWidth = 46;
      const barcodeHeight = 6.5;
      const barcodeX = (pageWidth / 2) - (barcodeWidth / 2);
      const barcodeY = pageHeight - 22; // Ends at pageHeight - 15.5
      doc.addImage(bcData, 'PNG', barcodeX, barcodeY, barcodeWidth, barcodeHeight);
    } catch (e) {
      console.error('Error adding barcode to footer:', e);
    }
  }

  // Reference number cleanly below barcode bars (at pageHeight - 11.5, leaving >2mm white gap)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text(codeValue, pageWidth / 2, pageHeight - 11.5, { align: 'center' });

  // System tagline directly below reference number
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Generated from Innovista System', pageWidth / 2, pageHeight - 7.5, { align: 'center' });

  // Right: Page number
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  const pageStr = totalPages ? `Page ${pageNumber} of ${totalPages}` : `Page ${pageNumber}`;
  doc.text(pageStr, pageWidth - margin, pageHeight - 11.5, { align: 'right' });
};

export const generateQuotePDF = async (quote: Quote, layout: PdfLayout = 'Detailed', settings?: CompanySettings, returnBytes: boolean = false, svcCode?: string) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  
  const docSettings = quote.documentSettings || {
    fontSize: 10,
    accentColor: '#2563eb',
    showLogo: true,
    showBankDetails: true,
    showTimeline: false,
    showPaymentTiers: true,
    layoutType: layout
  };

  const drawHeader = (doc: jsPDF, _: any) => {
    drawBusinessHeader(
      doc, 
      'QUOTATION', 
      quote.projectName, 
      quote.submittedDate, 
      quote.quoteNo, 
      docSettings.accentColor, 
      settings, 
      docSettings.showLogo,
      quote.validUntil,
      docSettings.fontSize
    );
  };

  const calculateTotals = () => {
    const subTotal = (() => {
      if (quote.pricingMethod === 'Lump Sum' && quote.lumpSumAmount) {
        return quote.lumpSumAmount;
      }
      const itemsTotal = quote.items.reduce((sum, item) => sum + item.amount, 0);
      if (quote.pricingMethod === 'Cost Plus' && quote.marginPercent) {
        return itemsTotal * (1 + quote.marginPercent / 100);
      }
      return itemsTotal;
    })();

    const discountAmount = subTotal * ((quote.discountPercent || 0) / 100);
    const additionalChargesTotal = (quote.additionalCharges || []).reduce((sum, charge) => sum + charge.amount, 0);
    const totalBeforeTax = subTotal - discountAmount + additionalChargesTotal;
    const taxAmount = quote.isTaxInclusive 
      ? totalBeforeTax - (totalBeforeTax / (1 + (quote.taxPercent || 0) / 100))
      : totalBeforeTax * ((quote.taxPercent || 0) / 100);
    const grandTotal = quote.isTaxInclusive ? totalBeforeTax : totalBeforeTax + taxAmount;
    const advanceAmount = (grandTotal * (quote.advancePercent || 0)) / 100;

    return { subTotal, discountAmount, additionalChargesTotal, taxAmount, grandTotal, advanceAmount };
  };

  const { subTotal, taxAmount, grandTotal, advanceAmount } = calculateTotals();

  // Pre-generate Barcode and QR Code (Exact uploaded PDF format)
  const barcodeDataUrl = generateBarcodeDataUrl(svcCode || quote.quoteNo);
  const qrDataUrl = await generateQRCodeDataUrl(svcCode || quote.quoteNo);

  const drawFooter = (doc: jsPDF, pageNumber: number, totalPages?: number) => {
    drawBusinessFooter(doc, svcCode || quote.quoteNo, pageNumber, totalPages, barcodeDataUrl, svcCode, qrDataUrl);
  };

  // --- Layout Logic ---

  if (layout === 'Detailed') {
    // Page 1 is reserved for Table of Contents, we jump to Page 2 to render sections first,
    // so we can record exact section page numbers dynamically!
    doc.addPage();
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('1. Project Details and Other specific Conditions', margin, 45);

    const partyDetails = [
      ['No:', 'Description'],
      ['1.1', 'Details of parties'],
      ['1.1.1', `The purchaser is,\n${quote.client?.name || 'N/A'}\n${quote.client?.tradeName ? quote.client.tradeName + '\n' : ''}${quote.client?.address || ''}\nPhone: ${quote.client?.phone || ''}${quote.client?.email ? '\nEmail: ' + quote.client.email : ''}${quote.client?.taxNo ? '\nVAT No: ' + quote.client.taxNo : ''}`],
      ['1.1.2', `The Company Name of bidder:\n${settings?.name || 'INNOVISTA METAL FABRICONIX (PVT) LTD.'}\n${settings?.address || 'Kelaniya, Sri Lanka'}\n${settings?.phone || '0773726224'}`],
    ];

    if (quote.workSiteLocation) {
      partyDetails.push(['1.1.3', `Work Site Location:\n${quote.workSiteLocation}`]);
    }
    if (quote.salesRepresentative) {
      partyDetails.push(['1.1.4', `Sales Representative:\n${quote.salesRepresentative}`]);
    }

    autoTable(doc, {
      startY: 50,
      head: [partyDetails[0]],
      body: partyDetails.slice(1),
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: 240, textColor: 0, fontStyle: 'bold' },
      columnStyles: { 0: { cellWidth: 15 } },
      margin: { top: 40, bottom: 25, left: 15, right: 15 }
    });

    const strategyDetails = [
      ['No:', 'Description'],
      ['1.2', 'Quotation Strategy & Scope'],
      ['1.2.1', `Pricing Method: ${quote.pricingMethod}`],
      ['1.2.2', `Project Stage: ${quote.projectStage}`],
      ['1.2.3', `Scope Coverage: ${quote.scopeCoverage}`],
    ];

    if (quote.projectStage === 'Budgetary' && quote.confidenceLevel) {
      strategyDetails.push(['1.2.4', `Budgetary Confidence Level: ${quote.confidenceLevel}%\nNote: This is a preliminary estimate based on current data. Final pricing may vary by +/- ${100 - quote.confidenceLevel}%.`]);
    }

    if (quote.justification) {
      strategyDetails.push(['1.2.5', `Justification / Revision Notes:\n${quote.justification}`]);
    }

    autoTable(doc, {
      startY: getFinalY(doc, 50) + 10,
      head: [strategyDetails[0]],
      body: strategyDetails.slice(1),
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: 240, textColor: 0, fontStyle: 'bold' },
      columnStyles: { 0: { cellWidth: 15 } },
      margin: { top: 40, bottom: 25, left: 15, right: 15 }
    });

    const accentRgb = hexToRgb(docSettings.accentColor);

    doc.setFont('helvetica', 'bold');
    doc.text('1.3 Terms & Conditions', margin, getFinalY(doc, 50) + 12);

    const termsData = quote.terms
      .filter(t => t.isActive)
      .map(t => [
        { content: t.no, styles: { fontStyle: 'bold' as const, halign: 'center' as const } },
        { content: t.title.toUpperCase() + '\n' + t.content, styles: { halign: 'left' as const } }
      ]);

    autoTable(doc, {
      startY: getFinalY(doc, 50) + 16,
      head: [[{ content: 'No:', styles: { halign: 'center' as const } }, 'Description']],
      body: termsData,
      theme: 'grid',
      styles: { fontSize: 8.5, cellPadding: 3, overflow: 'linebreak' },
      headStyles: { fillColor: [accentRgb.r, accentRgb.g, accentRgb.b], textColor: 255, fontStyle: 'bold' as const },
      columnStyles: { 0: { cellWidth: 12 } },
      margin: { top: 40, bottom: 25, left: 15, right: 15 }
    });

    // --- Page: Price Schedule ---
    doc.addPage();
    const priceSchedulePage = doc.getNumberOfPages();
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('2. Price schedule', margin, 42);

    doc.setFontSize(9.5);
    const clientPhone = quote.client?.phone || '';
    const clientAddress = quote.client?.address || '';
    const clientMeta = [clientPhone, clientAddress].filter(Boolean).join(', ');
    doc.text(`PROPOSED ${quote.projectName.toUpperCase()}${clientMeta ? ` @ ${clientMeta}` : ''}`, margin, 50);
    doc.text(`${quote.pricingMethod.toUpperCase()} | ${quote.projectStage.toUpperCase()} | ${quote.scopeCoverage.toUpperCase()}`, margin, 55);
    doc.text('BILL OF QUANTITIES', margin, 60);

    const boqHead = [['No:', 'DESCRIPTION', 'PVC\nQR', 'UNIT', 'QTY', 'RATE', 'Dis.%', 'Dis.RATE', 'AMOUNT']];
    
    // Pre-generate mini 1D barcodes - Strictly NO QR codes
    const miniBarcodes: Record<string, string> = {};
    for (const item of quote.items) {
      const code = item.pvcCode || `${quote.quoteNo}-${item.no}`;
      if (!miniBarcodes[code]) {
        miniBarcodes[code] = generateBarcodeDataUrl(code);
      }
    }

    const boqBody = quote.items.map((item, idx) => {
      const itemNumber = item.no || computeItemNumber(quote.items, idx);
      const isTitle = item.itemType === 'Title';
      const isSub = item.itemType === 'Sub';

      if (isTitle) {
        // For Title: Title should not have any values, just title
        return [
          itemNumber,
          (item.name || 'SECTION TITLE').toUpperCase(),
          '', // No barcode
          '', // No unit
          '', // No qty
          '', // No rate
          '', // No disc
          '', // No net rate
          ''  // No amount
        ];
      }

      const indent = isSub ? '    • ' : '';
      const subIndent = isSub ? '      ' : '';
      const desc = indent +
        (item.name ? `${item.name.toUpperCase()}\n${subIndent}` : '') + 
        (isSub ? item.description.split('\n').join(`\n${subIndent}`) : item.description) + 
        (item.calculations ? `\n${subIndent}(${item.calculations})` : '') +
        formatItemSpecification(item.specification) +
        (item.itemCharges && item.itemCharges.length > 0 ? 
          `\n\n${subIndent}ADDITIONAL CHARGES:\n${item.itemCharges.map(c => `${subIndent}${c.name}: ${c.amount.toLocaleString()} (${c.isInclusive ? 'Incl.' : 'Excl.'})`).join('\n')}` : '');

      return [
        itemNumber,
        desc,
        '', // Barcode Placeholder
        item.unit,
        (item.unit === 'Note' || item.unit === 'None') ? '-' : item.qty.toLocaleString(undefined, { maximumFractionDigits: 2 }),
        item.unit === 'Note' ? '-' : item.rate.toLocaleString(),
        (item.unit === 'Note' || item.unit === 'None') ? '-' : `${item.discountPercent}%`,
        (item.unit === 'Note' || item.unit === 'None') ? '-' : (item.rate * (1 - item.discountPercent / 100)).toLocaleString(),
        item.unit === 'Note' ? '-' : item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 }),
      ];
    });

    autoTable(doc, {
      startY: 66,
      head: boqHead,
      body: boqBody,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: 240, textColor: 0, fontStyle: 'bold' },
      columnStyles: { 
        0: { cellWidth: 12 },
        1: { cellWidth: 54 },
        2: { cellWidth: 20, minCellHeight: 12, halign: 'center' },
        3: { cellWidth: 12 },
        4: { cellWidth: 12, halign: 'right' },
        5: { cellWidth: 18, halign: 'right' },
        6: { cellWidth: 12, halign: 'center' },
        7: { cellWidth: 18, halign: 'right' },
        8: { halign: 'right' }
      },
      margin: { top: 40, bottom: 25, left: 15, right: 15 },
      didDrawCell: (data: any) => {
        if (data.column.index === 2 && data.cell.section === 'body') {
          const item = quote.items[data.row.index];
          if (item && item.itemType === 'Title') return; // No barcode for Title
          const code = item?.pvcCode || (item ? `${quote.quoteNo}-${item.no}` : '');
          if (code && miniBarcodes[code]) {
            const x = data.cell.x + 1;
            const y = data.cell.y + 1;
            doc.addImage(miniBarcodes[code], 'PNG', x, y, data.cell.width - 2, 5.5);
            doc.setFontSize(5);
            doc.setTextColor(100, 116, 139);
            doc.setFont('helvetica', 'bold');
            doc.text(code, data.cell.x + data.cell.width / 2, y + 8.5, { align: 'center' });
          }
        }
      },
      didParseCell: (data: any) => {
        const item = quote.items[data.row.index];
        if (item) {
          if (item.itemType === 'Title') {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [224, 231, 255]; // Soft Royal Blue tint for section title
            data.cell.styles.textColor = [30, 58, 138]; // Deep blue
            data.cell.styles.fontSize = 8.5;
          } else if (item.itemType === 'Main') {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [248, 250, 252];
            data.cell.styles.textColor = [15, 23, 42];
          } else if (item.itemType === 'Sub') {
            data.cell.styles.textColor = [71, 85, 105];
          }
        }
      }
    });

    const finalY = getFinalY(doc, 0);

    const summaryData = [
      [`Sub Total ${quote.pricingMethod === 'Cost Plus' ? `(Incl. ${quote.marginPercent}% Margin)` : ''}`, subTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })],
      ['(-) Special Discounts', `${quote.discountPercent}%`],
      ...quote.additionalCharges.map(c => [c.name, c.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })]),
      [`Tax (${quote.taxPercent}% ${quote.isTaxInclusive ? 'Incl.' : 'Excl.'})`, taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })],
      ['Grand Total', `Rs. ${grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`],
      [`${quote.advancePercent}% Advance Amount required for initiating the works`, `${advanceAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`],
    ];

    autoTable(doc, {
      startY: finalY + 5,
      body: summaryData,
      theme: 'grid',
      styles: { fontSize: 9.5, halign: 'right', fontStyle: 'bold' },
      columnStyles: { 0: { cellWidth: 130 } },
      margin: { top: 40, bottom: 25, left: 15, right: 15 }
    });

    // Payment Schedule Section
    if (docSettings.showPaymentTiers && quote.paymentTiers && quote.paymentTiers.length > 0) {
      const scheduleY = getFinalY(doc, finalY) + 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('PAYMENT SCHEDULE:', margin, scheduleY);
      
      const scheduleHead = [['PHASE', 'PERCENTAGE', 'AMOUNT (LKR)']];
      const scheduleBody = quote.paymentTiers.map(tier => [
        tier.phase,
        `${tier.percentage}%`,
        ((grandTotal * tier.percentage) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })
      ]);

      autoTable(doc, {
        startY: scheduleY + 4,
        head: scheduleHead,
        body: scheduleBody,
        theme: 'grid',
        styles: { fontSize: 8.5 },
        headStyles: { fillColor: 240, textColor: 0, fontStyle: 'bold' },
        columnStyles: { 
          0: { cellWidth: 80 },
          1: { halign: 'center' },
          2: { halign: 'right' }
        },
        margin: { top: 40, bottom: 25, left: 15, right: 15 }
      });
    }

    const lastY = getFinalY(doc, finalY) + 8;
    doc.setFontSize(docSettings.fontSize + 2);
    doc.setFont('helvetica', 'bold');
    doc.text(`${quote.currency} ${grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, pageWidth - margin, lastY, { align: 'right' });
    
    doc.setFontSize(docSettings.fontSize);
    doc.text('Full Amount in Word:', margin, lastY + 7);
    doc.setFont('helvetica', 'normal');
    doc.text(numberToWords(Math.floor(grandTotal)), margin, lastY + 12);

    if (docSettings.showBankDetails && settings?.bankDetails && settings.bankDetails.length > 0) {
      const defaultBank = settings.bankDetails.find(b => b.isDefault) || settings.bankDetails[0];
      const bankY = lastY + 22;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('Bank Details for Payments:', margin, bankY);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(docSettings.fontSize - 2);
      doc.text(`Bank: ${defaultBank.bankName}`, margin, bankY + 4.5);
      doc.text(`Branch: ${defaultBank.branchName}`, margin, bankY + 9);
      doc.text(`Account Name: ${defaultBank.accountName}`, margin, bankY + 13.5);
      doc.text(`Account No: ${defaultBank.accountNumber}`, margin, bankY + 18);
      if (defaultBank.swiftCode) {
        doc.text(`SWIFT: ${defaultBank.swiftCode}`, margin, bankY + 22.5);
      }
    }

    // --- Page: Measurement Details (Annexure) ---
    let measurementPage: number | null = null;
    if (quote.items.some(i => i.measurements)) {
      doc.addPage();
      measurementPage = doc.getNumberOfPages();
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('3. Measurement Details (Annexure)', margin, 42);
      
      let currentY = 52;
      
      quote.items.filter(i => i.measurements).forEach(item => {
        if (currentY > pageHeight - 80) {
          doc.addPage();
          currentY = 45;
        }
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`Item ${item.no}: ${item.name}`, margin, currentY);
        doc.setFont('helvetica', 'normal');
        doc.text(`Method: ${item.measurements?.method}`, pageWidth - margin, currentY, { align: 'right' });
        
        const measurementHead = [['DESCRIPTION / LOCATION', 'SHAPE', 'NOS', 'DIMENSIONS', 'TOTAL']];
        const measurementBody: any[] = item.measurements?.rows.map(row => {
          let dimensions = '';
          if (row.shape === 'Rectangle' || !row.shape) {
            dimensions = `${row.length || 0} x ${row.width || 0}${row.height ? ` x ${row.height}` : ''}`;
          } else if (row.shape === 'Circle') {
            dimensions = `r=${row.radius || 0}`;
          } else if (row.shape === 'Triangle') {
            dimensions = `b=${row.base || 0}, h=${row.height || 0}`;
          } else if (row.shape === 'Trapezoid') {
            dimensions = `a=${row.sideA || 0}, b=${row.sideB || 0}, h=${row.height || 0}`;
          } else if (row.shape === 'Ellipse') {
            dimensions = `a=${row.length || 0}, b=${row.width || 0}`;
          } else if (row.shape === 'Sector') {
            dimensions = `r=${row.radius || 0}, h=${row.height || 0}`;
          } else if (row.shape === 'Solid') {
            dimensions = `${row.length || 0} x ${row.width || 0} x ${row.height || 0}`;
          }

          return [
            row.description,
            row.shape || 'Rect',
            row.count,
            dimensions,
            row.total.toLocaleString(undefined, { maximumFractionDigits: 2 })
          ];
        }) || [];
        
        measurementBody.push([
          { content: `TOTAL QUANTITY (${item.unit})`, colSpan: 4, styles: { halign: 'right', fontStyle: 'bold' } },
          { content: item.measurements?.totalQuantity.toLocaleString(undefined, { maximumFractionDigits: 2 }), styles: { fontStyle: 'bold' } }
        ]);

        autoTable(doc, {
          startY: currentY + 5,
          head: measurementHead,
          body: measurementBody,
          theme: 'grid',
          styles: { fontSize: 8 },
          headStyles: { fillColor: 240, textColor: 0, fontStyle: 'bold' },
          columnStyles: { 
            0: { cellWidth: 70 },
            1: { cellWidth: 20 },
            2: { cellWidth: 15 },
            3: { cellWidth: 40 },
            4: { halign: 'right' }
          },
          margin: { top: 40, bottom: 25, left: 15, right: 15 }
        });
        
        currentY = getFinalY(doc, 0) + 15;
      });
    }

    // --- Page: Project Timeline ---
    let timelinePage: number | null = null;
    if (docSettings.showTimeline && quote.timeline?.jobs.length > 0) {
      doc.addPage();
      timelinePage = doc.getNumberOfPages();
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('4. Project Timeline', margin, 42);
      
      const timelineHead = [['JOB TITLE', 'DESCRIPTION', 'START DATE', 'END DATE', 'STATUS', 'PROGRESS']];
      const timelineBody = quote.timeline.jobs.map(job => [
        job.title,
        job.description,
        job.startDate,
        job.endDate,
        job.status,
        `${job.progress}%`
      ]);

      autoTable(doc, {
        startY: 52,
        head: timelineHead,
        body: timelineBody,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: 240, textColor: 0, fontStyle: 'bold' },
        columnStyles: { 
          0: { cellWidth: 40 },
          1: { cellWidth: 60 },
          5: { halign: 'center' }
        },
        margin: { top: 40, bottom: 25, left: 15, right: 15 }
      });
    }

    // --- Render Table of Contents on Page 1 accurately ---
    doc.setPage(1);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('1. Project Details and Other specific Conditions', margin, 45);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);
    doc.text('Details of parties', margin + 5, 52);
    doc.text('2', pageWidth - margin, 52, { align: 'right' });
    doc.text('Quotation Strategy & Scope', margin + 5, 59);
    doc.text('2', pageWidth - margin, 59, { align: 'right' });
    doc.text('Terms & Conditions', margin + 5, 66);
    doc.text('2', pageWidth - margin, 66, { align: 'right' });
    
    let yPos = 73;
    const termsList = Array.isArray(quote.terms) ? quote.terms : [];
    termsList.filter(t => t.isActive).forEach((term) => {
      if (yPos > pageHeight - 48) return;
      doc.text(`${term.title}`, margin + 10, yPos);
      doc.text('2', pageWidth - margin, yPos, { align: 'right' });
      yPos += 6.5;
    });

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`2. Price schedule ..............................................................................................................................${priceSchedulePage}`, margin, yPos + 7);
    
    if (measurementPage) {
      doc.text(`3. Measurement Details (Annexure) ..........................................................................................${measurementPage}`, margin, yPos + 14);
    }

    if (timelinePage) {
      doc.text(`4. Project Timeline ............................................................................................................................${timelinePage}`, margin, yPos + (measurementPage ? 21 : 14));
    }
  } else if (layout === 'Compact') {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Project Summary & BOQ', margin, 42);

    const boqHead = [['No:', 'DESCRIPTION', 'UNIT', 'QTY', 'RATE', 'AMOUNT']];
    const boqBody = quote.items.map((item, idx) => {
      const itemNumber = item.no || computeItemNumber(quote.items, idx);
      const isTitle = item.itemType === 'Title';
      const isSub = item.itemType === 'Sub';

      if (isTitle) {
        return [
          itemNumber,
          (item.name || 'SECTION TITLE').toUpperCase(),
          '',
          '',
          '',
          ''
        ];
      }

      const indent = isSub ? '    • ' : '';
      const subIndent = isSub ? '      ' : '';
      const desc = indent +
        (item.name ? `${item.name.toUpperCase()}\n${subIndent}` : '') + 
        (isSub ? item.description.split('\n').join(`\n${subIndent}`) : item.description) +
        formatItemSpecification(item.specification) +
        (item.itemCharges && item.itemCharges.length > 0 ? 
          `\n\n${subIndent}ADDITIONAL CHARGES:\n${item.itemCharges.map(c => `${subIndent}${c.name}: ${c.amount.toLocaleString()} (${c.isInclusive ? 'Incl.' : 'Excl.'})`).join('\n')}` : '');

      return [
        itemNumber,
        desc,
        item.unit,
        item.unit === 'Note' ? '-' : item.qty.toLocaleString(),
        item.unit === 'Note' ? '-' : item.rate.toLocaleString(),
        item.unit === 'Note' ? '-' : item.amount.toLocaleString(),
      ];
    });

    autoTable(doc, {
      startY: 47,
      head: boqHead,
      body: boqBody,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: 240, textColor: 0, fontStyle: 'bold' },
      margin: { top: 40, bottom: 25, left: 15, right: 15 },
      didParseCell: (data: any) => {
        const item = quote.items[data.row.index];
        if (item) {
          if (item.itemType === 'Title') {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [224, 231, 255];
            data.cell.styles.textColor = [30, 58, 138];
            data.cell.styles.fontSize = 8.5;
          } else if (item.itemType === 'Main') {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [250, 250, 250];
          } else if (item.itemType === 'Sub') {
            data.cell.styles.textColor = [71, 85, 105];
          }
        }
      }
    });

    const finalY = getFinalY(doc, 47);

    const summaryData = [
      ['Sub Total', subTotal.toLocaleString()],
      ['Grand Total', `Rs. ${grandTotal.toLocaleString()}`],
      [`${quote.advancePercent}% Advance Required`, advanceAmount.toLocaleString()],
    ];

    autoTable(doc, {
      startY: finalY + 5,
      body: summaryData,
      theme: 'grid',
      styles: { fontSize: 10, halign: 'right', fontStyle: 'bold' },
      columnStyles: { 0: { cellWidth: 130 } },
      margin: { top: 40, bottom: 25, left: 15, right: 15 }
    });
  } else if (layout === 'Summary') {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('BUDGETARY QUOTATION SUMMARY', pageWidth / 2, 50, { align: 'center' });

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const summaryText = [
      `Project Name: ${quote.projectName}`,
      `Client: ${quote.client.name}`,
      `Location: ${quote.client.address}`,
      '',
      `Total Estimated Value: Rs. ${grandTotal.toLocaleString()}`,
      `Advance Payment (${quote.advancePercent}%): Rs. ${advanceAmount.toLocaleString()}`,
      '',
      'This is a budgetary estimate and is subject to change based on final measurements and technical specifications.'
    ];

    let y = 70;
    summaryText.forEach(line => {
      doc.text(line, margin, y);
      y += 10;
    });
  } else if (layout === 'Executive') {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('EXECUTIVE SCOPE SUMMARY', margin, 42);

    const boqHead = [['No:', 'DESCRIPTION', 'QUANTITY', 'UNIT']];
    const boqBody = quote.items.map((item, idx) => {
      const itemNumber = item.no || computeItemNumber(quote.items, idx);
      const isTitle = item.itemType === 'Title';
      const isSub = item.itemType === 'Sub';

      if (isTitle) {
        return [
          itemNumber,
          (item.name || 'SECTION TITLE').toUpperCase(),
          '',
          ''
        ];
      }

      const indent = isSub ? '    • ' : '';
      return [
        itemNumber,
        indent + (item.name ? `${item.name.toUpperCase()}\n` : '') + item.description,
        item.unit === 'Note' ? '-' : item.qty.toLocaleString(),
        item.unit,
      ];
    });

    autoTable(doc, {
      startY: 47,
      head: boqHead,
      body: boqBody,
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: 240, textColor: 0, fontStyle: 'bold' },
      margin: { top: 40, bottom: 25, left: 15, right: 15 },
      didParseCell: (data: any) => {
        const item = quote.items[data.row.index];
        if (item) {
          if (item.itemType === 'Title') {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [224, 231, 255];
            data.cell.styles.textColor = [30, 58, 138];
            data.cell.styles.fontSize = 9;
          } else if (item.itemType === 'Main') {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [250, 250, 250];
          } else if (item.itemType === 'Sub') {
            data.cell.styles.textColor = [71, 85, 105];
          }
        }
      }
    });

    const finalY = getFinalY(doc, 47);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`TOTAL PROJECT VALUE: Rs. ${grandTotal.toLocaleString()}`, pageWidth - margin, finalY + 15, { align: 'right' });
  }

  // --- Page: Project Timeline ---
  if (docSettings.showTimeline && quote.timeline?.jobs.length > 0) {
    doc.addPage();
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('PROJECT TIMELINE', margin, 42);
    
    const timelineHead = [['JOB TITLE', 'DESCRIPTION', 'START DATE', 'END DATE', 'STATUS', 'PROGRESS']];
    const timelineBody = quote.timeline.jobs.map(job => [
      job.title,
      job.description,
      job.startDate,
      job.endDate,
      job.status,
      `${job.progress}%`
    ]);

    autoTable(doc, {
      startY: 52,
      head: timelineHead,
      body: timelineBody,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: 240, textColor: 0, fontStyle: 'bold' },
      columnStyles: { 
        0: { cellWidth: 40 },
        1: { cellWidth: 60 },
        5: { halign: 'center' }
      },
      margin: { top: 40, bottom: 25, left: 15, right: 15 }
    });
  }

  // Master Render Pass: Apply consistent corporate header & footer to EVERY page cleanly
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    drawHeader(doc, p);
    drawFooter(doc, p, totalPages);
  }

  // Save the PDF
  const pdfBytes = doc.output('arraybuffer');
  
  const hasTimeline = quote.documentSettings?.showTimeline && quote.timeline && quote.timeline.jobs.length > 0;
  
  if (settings?.frontCoverPdf || settings?.backCoverPdf || hasTimeline) {
    try {
      const mergedPdf = await PDFDocument.create();
      
      if (settings?.frontCoverPdf) {
        const frontCoverBytes = await fetch(settings.frontCoverPdf).then(res => res.arrayBuffer());
        const frontCover = await PDFDocument.load(frontCoverBytes);
        const copiedPages = await mergedPdf.copyPages(frontCover, frontCover.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }
      
      const mainPdf = await PDFDocument.load(pdfBytes);
      const mainPages = await mergedPdf.copyPages(mainPdf, mainPdf.getPageIndices());
      mainPages.forEach((page) => mergedPdf.addPage(page));

      if (hasTimeline) {
        try {
          const timelineBytes = await generateTimelineReport(quote, settings, true);
          if (timelineBytes) {
            const timelineDoc = await PDFDocument.load(timelineBytes);
            const copiedPages = await mergedPdf.copyPages(timelineDoc, timelineDoc.getPageIndices());
            copiedPages.forEach((page) => mergedPdf.addPage(page));
          }
        } catch (err) {
          console.error('Error merging timeline into quote:', err);
        }
      }
      
      if (settings?.backCoverPdf) {
        const backCoverBytes = await fetch(settings.backCoverPdf).then(res => res.arrayBuffer());
        const backCover = await PDFDocument.load(backCoverBytes);
        const copiedPages = await mergedPdf.copyPages(backCover, backCover.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }
      
      const finalPdfBytes = await mergedPdf.save();
      
      if (returnBytes) return finalPdfBytes;

      const blob = new Blob([finalPdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      const clientName = quote.client?.name || 'Client';
      link.download = `Quote_${quote.quoteNo}_${(clientName || '').replace(/\s+/g, '_')}_${layout}.pdf`;
      link.click();
    } catch (error) {
      console.error('Error merging PDFs:', error);
      if (returnBytes) return new Uint8Array(pdfBytes);
      const clientName = quote.client?.name || 'Client';
      doc.save(`Quote_${quote.quoteNo}_${(clientName || '').replace(/\s+/g, '_')}_${layout}.pdf`);
    }
  } else {
    if (returnBytes) return new Uint8Array(pdfBytes);
    const clientName = quote.client?.name || 'Client';
    doc.save(`Quote_${quote.quoteNo}_${(clientName || '').replace(/\s+/g, '_')}_${layout}.pdf`);
  }
};

export const drawPageFooter = (doc: jsPDF, _: string, barcodeDataUrl?: string, identifier?: string, svcCode?: string) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const pageNumber = (doc as any).internal.getNumberOfPages();
  
  // 1. Footer Background (Light gray bar)
  doc.setFillColor(248, 250, 252); // slate-50
  doc.rect(0, pageHeight - 28, pageWidth, 28, 'F');
  
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.5);
  doc.line(0, pageHeight - 28, pageWidth, pageHeight - 28);

  // 2. Left Side: Barcode Verification ID - Strictly NO QR Code
  const refCode = svcCode || identifier || 'DOC-2026';
  const leftBc = barcodeDataUrl || generateBarcodeDataUrl(refCode);
  if (leftBc) {
    try {
      const barcodeWidth = 38;
      const barcodeHeight = 8;
      doc.addImage(leftBc, 'PNG', margin, pageHeight - 24, barcodeWidth, barcodeHeight);
      
      doc.setFontSize(6.5);
      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'bold');
      doc.text(refCode, margin, pageHeight - 13);
      
      doc.setFontSize(5.5);
      doc.setTextColor(148, 163, 184);
      doc.setFont('helvetica', 'normal');
      doc.text('Authenticity verified by Innovista Registry', margin, pageHeight - 9);
    } catch (e) {
      console.error('Error adding barcode to left footer:', e);
    }
  }

  // 3. Right Side: Barcode System & System Tagline
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105); // slate-600
  doc.setFont('helvetica', 'bold');
  doc.text('INNOVISTA FABRICONIX SYSTEM', pageWidth - margin, pageHeight - 16, { align: 'right' });
  
  doc.setFontSize(6);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.setFont('helvetica', 'normal');
  doc.text('this generate from innovista fabriconix system', pageWidth - margin, pageHeight - 10, { align: 'right' });

  // 4. Page Number (Center bottom)
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(`Page ${pageNumber}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
};

export const drawInvoiceTemplateHeader = (
  doc: jsPDF,
  invoice: Invoice,
  settings?: CompanySettings,
  showLogo: boolean = true,
  accentColor: string = '#1e3a8a', // blue-900
  baseFontSize: number = 10,
  pageNumber: number = 1,
  barcodeDataUrl?: string
) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const accentRgb = hexToRgb(accentColor);

  if (pageNumber > 1) {
    // Simplified header for subsequent pages
    doc.setFontSize(baseFontSize + 2);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(accentRgb.r, accentRgb.g, accentRgb.b);
    doc.text(settings?.name || 'YOUR COMPANY NAME', margin, 15);
    
    doc.setFontSize(baseFontSize);
    doc.setTextColor(100, 100, 100);
    doc.text(`Invoice #: ${invoice.invoiceNo}`, pageWidth - margin, 15, { align: 'right' });
    
    doc.setDrawColor(accentRgb.r, accentRgb.g, accentRgb.b);
    doc.setLineWidth(0.5);
    doc.line(margin, 18, pageWidth - margin, 18);
    
    return 25;
  }

  // 1. Header Section (No background rectangle, clean white)
  let currentY = 12;

  // Company Name and Logo (Left)
  if (showLogo && settings?.logo) {
    try {
      const imgProps = doc.getImageProperties(settings.logo);
      const logoHeight = 18;
      const logoWidth = (imgProps.height > 0 && imgProps.width > 0)
        ? (imgProps.width * logoHeight) / imgProps.height
        : logoHeight;
      
      let format = 'PNG';
      if (settings.logo.startsWith('data:image/jpeg') || settings.logo.startsWith('data:image/jpg')) format = 'JPEG';
      else if (settings.logo.startsWith('data:image/webp')) format = 'WEBP';

      doc.setFontSize(baseFontSize + 8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(accentRgb.r, accentRgb.g, accentRgb.b);
      doc.text(settings?.name || 'YOUR COMPANY NAME', margin, currentY + 3, { maxWidth: 110 });
      
      doc.setFontSize(baseFontSize - 2);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 100, 100);
      doc.text(settings?.address.split('\n')[0] || 'Your Company Slogan', margin, currentY + 8, { maxWidth: 110 });

      doc.addImage(settings.logo, format, margin, currentY + 12, logoWidth, logoHeight);
    } catch (e) {
      console.error('Error adding logo:', e);
      doc.setFontSize(baseFontSize + 10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(accentRgb.r, accentRgb.g, accentRgb.b);
      doc.text(settings?.name || 'YOUR COMPANY NAME', margin, currentY + 3);
    }
  } else {
    doc.setFontSize(baseFontSize + 10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(accentRgb.r, accentRgb.g, accentRgb.b);
    doc.text(settings?.name || 'YOUR COMPANY NAME', margin, currentY + 3, { maxWidth: 110 });
  }

  // 2. Invoice Title and Meta Table (Right)
  let invoiceTitle = 'INVOICE';
  if (invoice.type === InvoiceType.PROFORMA) invoiceTitle = 'PROFORMA INVOICE';
  else if (invoice.type === InvoiceType.PROGRESS_BILLING) invoiceTitle = 'PROGRESS BILLING INVOICE';
  else if (invoice.type === InvoiceType.STAGE_BILLING) invoiceTitle = 'STAGE BILLING INVOICE';
  else if (invoice.type === InvoiceType.ADVANCE) invoiceTitle = 'ADVANCE PAYMENT INVOICE';
  else if (invoice.type === InvoiceType.FINAL) invoiceTitle = 'FINAL INVOICE';
  else if (invoice.type === InvoiceType.RECURRING) invoiceTitle = 'RECURRING INVOICE';
  else if (invoice.type === InvoiceType.RETENTION_CLAIM) invoiceTitle = 'RETENTION CLAIM INVOICE';

  // Add Barcode to top right
  if (barcodeDataUrl) {
    try {
      // Position barcode at the very top right, aligned with margin
      const barcodeWidth = 60;
      const barcodeHeight = 15;
      doc.addImage(barcodeDataUrl, 'PNG', pageWidth - margin - barcodeWidth, currentY - 5, barcodeWidth, barcodeHeight);
    } catch (e) {
      console.error('Error adding barcode to header:', e);
    }
  }

  doc.setFontSize(baseFontSize + 22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(accentRgb.r, accentRgb.g, accentRgb.b);
  doc.text(invoiceTitle, pageWidth - margin, currentY + 22, { align: 'right' });

  // Primary Meta Table (Right)
  const metaTableX = pageWidth - margin - 65;
  const metaTableY = currentY + 30;
  const metaTableWidth = 65;
  const rowHeight = 6;

  const drawMetaRow = (label1: string, val1: string, label2: string, val2: string, y: number) => {
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(245, 245, 245);
    
    // Labels
    doc.rect(metaTableX, y, metaTableWidth / 2, rowHeight, 'FD');
    doc.rect(metaTableX + metaTableWidth / 2, y, metaTableWidth / 2, rowHeight, 'FD');
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(label1, metaTableX + 2, y + 4);
    doc.text(label2, metaTableX + metaTableWidth / 2 + 2, y + 4);
    
    // Values
    doc.rect(metaTableX, y + rowHeight, metaTableWidth / 2, rowHeight, 'D');
    doc.rect(metaTableX + metaTableWidth / 2, y + rowHeight, metaTableWidth / 2, rowHeight, 'D');
    
    doc.setFontSize(baseFontSize - 2);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(val1, metaTableX + 2, y + rowHeight + 4);
    doc.text(val2, metaTableX + metaTableWidth / 2 + 2, y + rowHeight + 4);
  };

  drawMetaRow('Date', invoice.date, 'Invoice #', invoice.invoiceNo, metaTableY);
  drawMetaRow('Customer ID', invoice.customerId || (invoice.client.id ? invoice.client.id.slice(0, 8) : 'N/A'), 'Purchase Order #', invoice.purchaseOrderNo || 'N/A', metaTableY + rowHeight * 2);
  
  // Payment Due Row
  doc.setFillColor(245, 245, 245);
  doc.rect(metaTableX, metaTableY + rowHeight * 4, metaTableWidth, rowHeight, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Payment Due by', metaTableX + 2, metaTableY + rowHeight * 4 + 4);
  
  doc.rect(metaTableX, metaTableY + rowHeight * 5, metaTableWidth, rowHeight, 'D');
  doc.setFontSize(baseFontSize - 2);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text(invoice.dueDate, metaTableX + 2, metaTableY + rowHeight * 5 + 4);

  currentY = 85;

  // 3. Bill To / Ship To
  doc.setFontSize(baseFontSize - 1);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.setFillColor(accentRgb.r, accentRgb.g, accentRgb.b);
  
  doc.rect(margin, currentY, (pageWidth / 2) - margin - 5, 6, 'F');
  doc.text('BILL TO', margin + 3, currentY + 4.5);
  
  doc.rect(pageWidth / 2 + 5, currentY, (pageWidth / 2) - margin - 5, 6, 'F');
  doc.text('SHIP TO (IF DIFFERENT)', pageWidth / 2 + 8, currentY + 4.5);

  currentY += 10;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(baseFontSize - 2);

  // Bill To Content
  const billTo = [
    invoice.client.name,
    invoice.client.tradeName,
    invoice.client.address,
    invoice.client.phone
  ].filter(Boolean);

  billTo.forEach((line, i) => {
    if (line) doc.text(line, margin + 3, currentY + (i * 4));
  });

  // Ship To Content
  if (invoice.shipTo) {
    const shipToLines = typeof invoice.shipTo === 'string' 
      ? [invoice.shipTo] 
      : [
          invoice.shipTo.name,
          invoice.shipTo.company,
          invoice.shipTo.address,
          invoice.shipTo.phone
        ].filter(Boolean);

    shipToLines.forEach((line, i) => {
      if (line) doc.text(line, pageWidth / 2 + 8, currentY + (i * 4));
    });
  } else {
    doc.setTextColor(180, 180, 180);
    doc.setFont('helvetica', 'italic');
    doc.text('Same as Bill To', pageWidth / 2 + 8, currentY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
  }

  currentY += 25;

  // 4. Secondary Meta Table (Salesperson, Shipping, etc.)
  const secondaryMetaY = currentY;
  const colWidth = (pageWidth - margin * 2) / 6;
  
  doc.setFillColor(accentRgb.r, accentRgb.g, accentRgb.b);
  doc.rect(margin, secondaryMetaY, pageWidth - margin * 2, 6, 'F');
  
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  
  const headers = ['Salesperson', 'Shipping Method', 'Shipping Terms', 'Payment Terms', 'Due Date', 'Delivery Date'];
  headers.forEach((h, i) => {
    doc.text(h, margin + (i * colWidth) + 2, secondaryMetaY + 4.5);
  });
  
  doc.setDrawColor(200, 200, 200);
  doc.rect(margin, secondaryMetaY + 6, pageWidth - margin * 2, 6, 'D');
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(baseFontSize - 3);
  doc.setTextColor(80, 80, 80);
  const values = [
    invoice.salesperson || 'N/A',
    invoice.shippingMethod || 'N/A',
    invoice.shippingTerms || 'N/A',
    invoice.paymentTerms || 'N/A',
    invoice.dueDate,
    invoice.deliveryDate || 'N/A'
  ];
  values.forEach((v, i) => {
    doc.text(v, margin + (i * colWidth) + 2, secondaryMetaY + 10.5);
    if (i > 0) doc.line(margin + (i * colWidth), secondaryMetaY, margin + (i * colWidth), secondaryMetaY + 12);
  });

  return secondaryMetaY + 18;
};

export const drawInvoiceTotalsSection = (
  doc: jsPDF,
  invoice: Invoice,
  accentColor: string = '#1e3a8a',
  startY: number = 0
) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const accentRgb = hexToRgb(accentColor);
  
  let currentY = startY;

  // Check if we need a new page for the totals
  if (currentY > pageHeight - 100) {
    doc.addPage();
    currentY = margin + 20;
  }

  // Notes Section (Left)
  const notesWidth = (pageWidth - margin * 2) * 0.6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.setFillColor(accentRgb.r, accentRgb.g, accentRgb.b);
  doc.rect(margin, currentY, notesWidth, 6, 'F');
  doc.text('SPECIAL NOTES AND INSTRUCTIONS', margin + 3, currentY + 4.5);
  
  doc.setDrawColor(200, 200, 200);
  doc.rect(margin, currentY + 6, notesWidth, 35, 'D');
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(8);
  const notes = invoice.notes || 'Standard business terms apply.';
  doc.text(notes, margin + 3, currentY + 11, { maxWidth: notesWidth - 6 });

  // Totals Section (Right)
  const totalsX = pageWidth - margin - 60;
  let totalsY = currentY;
  const totalsWidth = 60;

  const addTotalRow = (label: string, value: string, isTotal: boolean = false) => {
    if (isTotal) {
      doc.setFillColor(accentRgb.r, accentRgb.g, accentRgb.b);
      doc.rect(totalsX, totalsY, totalsWidth, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(label, totalsX + 2, totalsY + 5.5);
      doc.text(value, pageWidth - margin - 2, totalsY + 5.5, { align: 'right' });
      totalsY += 10;
    } else {
      doc.setFillColor(245, 245, 245);
      doc.rect(totalsX, totalsY, totalsWidth - 30, 7, 'F'); // Label background
      doc.setDrawColor(200, 200, 200);
      doc.rect(totalsX, totalsY, totalsWidth, 7, 'D');
      
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(label, totalsX + 2, totalsY + 4.5);
      
      doc.setTextColor(80, 80, 80);
      doc.setFont('helvetica', 'normal');
      doc.text(value, pageWidth - margin - 2, totalsY + 4.5, { align: 'right' });
      totalsY += 7;
    }
  };

  addTotalRow('Subtotal', invoice.subTotal.toLocaleString(undefined, { minimumFractionDigits: 2 }));
  addTotalRow('Sales Tax Rate', `${invoice.salesTaxRate || invoice.taxPercent || 0}%`);
  addTotalRow('Sales Tax', invoice.taxTotal.toLocaleString(undefined, { minimumFractionDigits: 2 }));
  addTotalRow('S&H', (invoice.shippingHandling || 0).toLocaleString(undefined, { minimumFractionDigits: 2 }));
  addTotalRow('Discount', `(${invoice.discountTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })})`);

  if (invoice.retentionAmount && invoice.retentionAmount > 0) {
    addTotalRow(`Retention (${invoice.retentionPercent || 0}%)`, `(${invoice.retentionAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })})`);
  }

  addTotalRow('TOTAL', invoice.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 }), true);

  // Amount in words
  totalsY += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(60, 60, 60);
  const words = `Amount in words: ${numberToWords(invoice.grandTotal)}`;
  const splitWords = doc.splitTextToSize(words, totalsWidth);
  doc.text(splitWords, pageWidth - margin, totalsY + 4, { align: 'right' });

  return Math.max(totalsY + (splitWords.length * 5) + 12, currentY + 45);
};

export const drawInvoiceFinalSection = (
  doc: jsPDF,
  invoice: Invoice,
  accentColor: string = '#1e3a8a',
  settings?: CompanySettings,
  startY: number = 0
) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const accentRgb = hexToRgb(accentColor);
  
  let currentY = startY;

  // Check if we need a new page for the final section
  if (currentY > pageHeight - 100) {
    doc.addPage();
    currentY = margin + 20;
  } else {
    currentY += 10;
  }

  // Cheque Details (If present)
  if (invoice.chequeDetails?.chequeNo) {
    doc.setDrawColor(230, 230, 230);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 5;
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(150, 150, 150);
    doc.text('CHEQUE DETAILS:', margin, currentY);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    const chequeInfo = `Bank: ${invoice.chequeDetails.bank} | No: ${invoice.chequeDetails.chequeNo} | Date: ${invoice.chequeDetails.date}`;
    doc.text(chequeInfo, margin, currentY + 4);
    
    currentY += 12;
  }

  // 1. Thank You and Signature Section
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(`Make all checks payable to ${settings?.name || 'Your Company Name'}`, margin, currentY);
  
  doc.setTextColor(accentRgb.r, accentRgb.g, accentRgb.b);
  doc.text('Thank you for your business!', margin, currentY + 6);

  // Signature Line
  doc.setDrawColor(150, 150, 150);
  doc.line(pageWidth - margin - 50, currentY + 12, pageWidth - margin, currentY + 12);
  doc.setFontSize(7);
  doc.setTextColor(0, 0, 0);
  doc.text('AUTHORIZED SIGNATURE', pageWidth - margin - 25, currentY + 16, { align: 'center' });

  currentY += 25;

  // 2. Footer Contact Info
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text('Should you have any enquiries concerning this invoice, please contact our office.', pageWidth / 2, currentY, { align: 'center' });
  
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(80, 80, 80);
  const contactInfo = `${settings?.address.replace(/\n/g, ', ')} | Tel: ${settings?.phone} | Email: ${settings?.email}`;
  doc.text(contactInfo, pageWidth / 2, currentY + 5, { align: 'center' });
  
  if (settings?.website) {
    doc.setFont('helvetica', 'normal');
    doc.text(`Web: ${settings.website}`, pageWidth / 2, currentY + 10, { align: 'center' });
  }

  return currentY + 20;
};

const getInvoiceFileName = (invoice: Invoice) => {
  let typeStr = 'Invoice';
  if (invoice.type === InvoiceType.PROFORMA) typeStr = 'Pro_Forma_Invoice';
  else if (invoice.type === InvoiceType.PROGRESS_BILLING) typeStr = 'Progress_Billing_Invoice';
  else if (invoice.type === InvoiceType.STAGE_BILLING) typeStr = 'Stage_Billing_Invoice';
  else if (invoice.type === InvoiceType.ADVANCE) typeStr = 'Advance_Payment_Invoice';
  else if (invoice.type === InvoiceType.FINAL) typeStr = 'Final_Invoice';
  else if (invoice.type === InvoiceType.RECURRING) typeStr = 'Recurring_Invoice';
  else if (invoice.type === InvoiceType.RETENTION_CLAIM) typeStr = 'Retention_Claim_Invoice';
  
  return `${typeStr}_${invoice.invoiceNo}_${(invoice.client?.name || '').replace(/\s+/g, '_')}.pdf`;
};

export const generateInvoicePDF = async (invoice: Invoice, settings?: CompanySettings, returnBytes: boolean = false, svcCode?: string) => {
  const doc = new jsPDF();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  
  const docSettings = invoice.documentSettings || {
    fontSize: 10,
    accentColor: '#1d4ed8',
    showLogo: true,
    showBankDetails: true,
    layoutType: 'Detailed'
  };

  const accentRgb = hexToRgb(docSettings.accentColor || '#1d4ed8');
  const barcodeDataUrl = generateBarcodeDataUrl(svcCode || invoice.invoiceNo);
  const qrDataUrl = await generateQRCodeDataUrl(svcCode || invoice.invoiceNo);

  const drawHeader = (doc: jsPDF, _pageNumber: number = 1) => {
    drawBusinessHeader(
      doc, 
      `${invoice.type || 'COMMERCIAL'} INVOICE`, 
      invoice.projectName || '', 
      invoice.date, 
      invoice.invoiceNo, 
      docSettings.accentColor || '#1d4ed8', 
      settings, 
      docSettings.showLogo,
      invoice.dueDate,
      docSettings.fontSize
    );
  };

  const drawFooter = (doc: jsPDF, pageNumber: number, totalPages?: number) => {
    drawBusinessFooter(doc, svcCode || invoice.invoiceNo, pageNumber, totalPages, barcodeDataUrl, svcCode, qrDataUrl);
  };

  let currentY = 44;

  // 1. Party and Invoice Metadata Table
  const clientInfo = [
    ['1.1', 'Bill To (Client / Purchaser)', '1.2', 'Invoice Details'],
    [
      '',
      `${invoice.client?.name || 'Valued Client'}\n${invoice.client?.tradeName ? invoice.client.tradeName + '\n' : ''}${invoice.client?.address || ''}\nPhone: ${invoice.client?.phone || ''}${invoice.client?.email ? '\nEmail: ' + invoice.client.email : ''}${invoice.client?.taxNo ? '\nVAT / TIN: ' + invoice.client.taxNo : ''}`,
      '',
      `Invoice #: ${invoice.invoiceNo}\nDate: ${invoice.date}\nPayment Due: ${invoice.dueDate || 'Upon Receipt'}\nPayment Terms: ${invoice.paymentTerms || 'Standard'}\nProject: ${invoice.projectName || 'General'}${invoice.purchaseOrderNo ? '\nPO #: ' + invoice.purchaseOrderNo : ''}${invoice.salesperson ? '\nSalesperson: ' + invoice.salesperson : ''}`
    ]
  ];

  autoTable(doc, {
    startY: currentY,
    head: [[clientInfo[0][0], clientInfo[0][1], clientInfo[0][2], clientInfo[0][3]]],
    body: [[clientInfo[1][0], clientInfo[1][1], clientInfo[1][2], clientInfo[1][3]]],
    theme: 'grid',
    styles: { fontSize: 8.5, cellPadding: 2.5 },
    headStyles: { fillColor: 240, textColor: 0, fontStyle: 'bold' },
    columnStyles: { 0: { cellWidth: 10 }, 1: { cellWidth: 78 }, 2: { cellWidth: 10 }, 3: { cellWidth: 82 } },
    margin: { top: 40, bottom: 25, left: 15, right: 15 }
  });

  currentY = getFinalY(doc, currentY) + 8;

  // 2. Invoice Items Table
  const tableHead = [['Item #', 'Description', 'Item Barcode', 'Qty', 'Unit Price', 'Line Total']];
  
  // Pre-generate mini Barcodes
  const miniBarcodes: Record<string, string> = {};
  for (const item of invoice.items) {
    const code = item.pvcCode || item.itemNo;
    if (code && !miniBarcodes[code]) {
      miniBarcodes[code] = generateBarcodeDataUrl(code);
    }
  }

  const tableBody: any[] = invoice.items.map((item, idx) => [
    item.itemNo || (idx + 1).toString(),
    { content: item.description, styles: { fontStyle: item.variationStatus === 'Additional' ? 'bold' : 'normal' as any } },
    '', // Barcode Placeholder
    item.qty.toString(),
    item.rate.toLocaleString(undefined, { minimumFractionDigits: 2 }),
    item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })
  ]);

  autoTable(doc, {
    startY: currentY,
    head: tableHead,
    body: tableBody,
    theme: 'grid',
    styles: { fontSize: 8.5, cellPadding: 2.5 },
    headStyles: { 
      textColor: [255, 255, 255], 
      fillColor: [accentRgb.r, accentRgb.g, accentRgb.b],
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: { 
      0: { cellWidth: 14, halign: 'center' },
      1: { cellWidth: 68 },
      2: { cellWidth: 22, minCellHeight: 12, halign: 'center' },
      3: { cellWidth: 14, halign: 'center' },
      4: { halign: 'right', cellWidth: 28 },
      5: { halign: 'right', cellWidth: 34 }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    margin: { top: 40, bottom: 25, left: 15, right: 15 },
    didDrawCell: (data: any) => {
      if (data.column.index === 2 && data.cell.section === 'body') {
        const item = invoice.items[data.row.index];
        const code = item?.pvcCode || item?.itemNo;
        if (code && miniBarcodes[code]) {
          const x = data.cell.x + 1;
          const y = data.cell.y + 1;
          doc.addImage(miniBarcodes[code], 'PNG', x, y, data.cell.width - 2, 5.5);
          doc.setFontSize(5);
          doc.setTextColor(100, 116, 139);
          doc.setFont('helvetica', 'bold');
          doc.text(code, data.cell.x + data.cell.width / 2, y + 8, { align: 'center' });
        }
      }
    }
  });

  currentY = getFinalY(doc, currentY) + 6;

  // 3. Totals Summary
  const totalsData = [
    ['Sub Total', invoice.subTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })],
    ['Discount', `-${(invoice.discountTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`],
    [`Tax / VAT (${invoice.taxPercent || 0}%)`, (invoice.taxTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })],
    ['Grand Total', `Rs. ${invoice.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`],
    ['Amount Paid', `${(invoice.amountPaid || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`],
    ['Balance Due', `Rs. ${(invoice.balanceDue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`]
  ];

  autoTable(doc, {
    startY: currentY,
    body: totalsData,
    theme: 'grid',
    styles: { fontSize: 9.5, halign: 'right', fontStyle: 'bold' },
    columnStyles: { 0: { cellWidth: 130 } },
    margin: { top: 40, bottom: 25, left: 15, right: 15 }
  });

  currentY = getFinalY(doc, currentY) + 8;

  // 4. Amount in Words
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text('Full Amount in Word:', margin, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(numberToWords(Math.floor(invoice.grandTotal)), margin, currentY + 5);
  currentY += 12;

  // 5. Bank Details
  if (docSettings.showBankDetails && settings?.bankDetails && settings.bankDetails.length > 0) {
    if (currentY > pageHeight - 45) {
      doc.addPage();
      currentY = 45;
    }
    const defaultBank = settings.bankDetails.find(b => b.isDefault) || settings.bankDetails[0];
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Bank Details for Electronic Remittance:', margin, currentY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`Bank: ${defaultBank.bankName} | Branch: ${defaultBank.branchName}`, margin, currentY + 4.5);
    doc.text(`Account Name: ${defaultBank.accountName} | Account No: ${defaultBank.accountNumber}${defaultBank.swiftCode ? ` | SWIFT: ${defaultBank.swiftCode}` : ''}`, margin, currentY + 9);
    currentY += 16;
  }

  // 6. Master Render Pass: Apply consistent corporate header & footer to EVERY page cleanly
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    drawHeader(doc, p);
    drawFooter(doc, p, totalPages);
  }

  const pdfBytes = doc.output('arraybuffer');
  
  const frontCover = settings?.invoiceFrontCoverPdf || settings?.frontCoverPdf;
  const backCover = settings?.invoiceBackCoverPdf || settings?.backCoverPdf;

  if (frontCover || backCover) {
    try {
      const mergedPdf = await PDFDocument.create();
      
      if (frontCover) {
        const frontCoverBytes = await fetch(frontCover).then(res => res.arrayBuffer());
        const frontDoc = await PDFDocument.load(frontCoverBytes);
        const copiedPages = await mergedPdf.copyPages(frontDoc, frontDoc.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }
      
      const mainPdf = await PDFDocument.load(pdfBytes);
      const mainPages = await mergedPdf.copyPages(mainPdf, mainPdf.getPageIndices());
      mainPages.forEach((page) => mergedPdf.addPage(page));
      
      if (backCover) {
        const backCoverBytes = await fetch(backCover).then(res => res.arrayBuffer());
        const backDoc = await PDFDocument.load(backCoverBytes);
        const copiedPages = await mergedPdf.copyPages(backDoc, backDoc.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }
      
      const finalPdfBytes = await mergedPdf.save();
      if (returnBytes) return finalPdfBytes;

      const blob = new Blob([finalPdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      const fileName = getInvoiceFileName(invoice);
      link.download = fileName;
      link.click();
    } catch (error) {
      console.error('Error merging PDFs for invoice:', error);
      if (returnBytes) return new Uint8Array(pdfBytes);
      const fileName = getInvoiceFileName(invoice);
      doc.save(fileName);
    }
  } else {
    if (returnBytes) return new Uint8Array(pdfBytes);
    const fileName = getInvoiceFileName(invoice);
    doc.save(fileName);
  }
};

export const generateTimelineReport = async (quote: any, settings?: CompanySettings, returnBytes: boolean = false, svcCode?: string) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  
  const quoteNo = quote.quoteNo || quote.originalQuoteNo || quote.id.slice(0, 8);
  const accentColor = quote.documentSettings?.accentColor || '#2563eb';
  const showLogo = quote.documentSettings?.showLogo ?? true;

  // Pre-generate Barcode (Strictly Code 128 - NO QR CODES)
  const barcodeDataUrl = generateBarcodeDataUrl(svcCode || quoteNo);

  const drawHeader = (doc: jsPDF, _: any) => {
    drawBusinessHeader(
      doc, 
      'PROJECT TIMELINE REPORT', 
      quote.projectName, 
      new Date().toISOString().split('T')[0], 
      svcCode || quoteNo, 
      accentColor, 
      settings, 
      showLogo
    );
  };

  const drawFooter = (doc: jsPDF, pageNumber: number, totalPages?: number) => {
    drawBusinessFooter(doc, svcCode || quoteNo, pageNumber, totalPages, barcodeDataUrl, svcCode);
  };
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('DETAILED PROJECT SCHEDULE', margin, 42);

  const timeline = quote.timeline || { jobs: [] };
  
  if (timeline.jobs.length === 0) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('No jobs scheduled for this project.', margin, 52);
  } else {
    // 1. Table View
    const timelineHead = [['JOB TITLE', 'DESCRIPTION', 'START DATE', 'END DATE', 'STATUS', 'PROGRESS']];
    const timelineBody = timeline.jobs.map((job: Job) => [
      job.title,
      job.description,
      job.startDate,
      job.endDate,
      job.status,
      `${job.progress}%`
    ]);

    autoTable(doc, {
      startY: 52,
      head: timelineHead,
      body: timelineBody,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: 240, textColor: 0, fontStyle: 'bold' },
      columnStyles: { 
        0: { cellWidth: 40 },
        1: { cellWidth: 60 },
        5: { halign: 'center' }
      },
      margin: { top: 40, bottom: 25, left: 15, right: 15 }
    });

    // 2. Visual Gantt Chart
    if (timeline.jobs.length > 0) {
      const finalY = getFinalY(doc, 52) + 15;
      if (finalY < pageHeight - 100) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('VISUAL PROJECT TIMELINE (GANTT)', margin, finalY);

        const chartY = finalY + 10;
        const rowHeight = 10;
        const taskColumnWidth = 40;
        const chartWidth = pageWidth - (margin * 2) - taskColumnWidth;
        const chartHeight = Math.min(150, timeline.jobs.length * rowHeight + 20);
        
        // Draw chart background
        doc.setFillColor(250, 250, 250);
        doc.rect(margin, chartY, pageWidth - (margin * 2), chartHeight, 'F');
        doc.setDrawColor(230, 230, 230);
        doc.rect(margin, chartY, pageWidth - (margin * 2), chartHeight, 'S');

        // Draw Task Column Header
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setFillColor(240, 240, 240);
        doc.rect(margin, chartY, taskColumnWidth, 10, 'F');
        doc.text('TASK NAME', margin + 2, chartY + 7);

        // Calculate date range
        const sortedJobs = [...timeline.jobs].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
        const minDate = new Date(Math.min(...sortedJobs.map(j => new Date(j.startDate).getTime())));
        const maxDate = new Date(Math.max(...sortedJobs.map(j => new Date(j.endDate).getTime())));
        minDate.setDate(minDate.getDate() - 2);
        maxDate.setDate(maxDate.getDate() + 5);
        const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));

        // Draw Date Header
        doc.setFillColor(245, 245, 245);
        doc.rect(margin + taskColumnWidth, chartY, chartWidth, 10, 'F');
        
        const dayWidth = chartWidth / totalDays;
        for (let i = 0; i < totalDays; i++) {
          const d = new Date(minDate);
          d.setDate(d.getDate() + i);
          if (i % 5 === 0 || i === 0 || i === totalDays - 1) {
            doc.setFontSize(6);
            doc.text(`${d.getDate()}/${d.getMonth() + 1}`, margin + taskColumnWidth + (i * dayWidth), chartY + 7);
          }
          // Vertical grid lines
          doc.setDrawColor(240, 240, 240);
          doc.line(margin + taskColumnWidth + (i * dayWidth), chartY + 10, margin + taskColumnWidth + (i * dayWidth), chartY + chartHeight);
        }

        // Draw Jobs
        timeline.jobs.forEach((job: Job, index: number) => {
          const y = chartY + 15 + (index * rowHeight);
          if (y > pageHeight - 20) return;

          // Task Name
          doc.setFontSize(7);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(0);
          doc.text(job.title.substring(0, 25), margin + 2, y + 5);

          const start = new Date(job.startDate);
          const end = new Date(job.endDate);
          const startOffset = Math.ceil((start.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
          const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

          const barX = margin + taskColumnWidth + (startOffset * dayWidth);
          const barWidth = duration * dayWidth;

          // Draw Bar
          if (job.status === 'Completed') doc.setFillColor(16, 185, 129); // emerald-500
          else if (job.status === 'Delayed') doc.setFillColor(239, 68, 68); // red-500
          else doc.setFillColor(37, 99, 235); // blue-600

          doc.rect(barX, y, barWidth, 6, 'F');

          // Draw Progress
          if (job.progress > 0) {
            doc.setFillColor(0, 0, 0, 0.2);
            doc.rect(barX, y, barWidth * (job.progress / 100), 6, 'F');
            doc.setFontSize(6);
            doc.setTextColor(255, 255, 255);
            doc.text(`${job.progress}%`, barX + 2, y + 4.5);
            doc.setTextColor(0, 0, 0);
          }
        });

        // Legend
        const legendY = chartY + chartHeight + 5;
        doc.setFontSize(8);
        doc.setFillColor(37, 99, 235); doc.rect(margin, legendY, 4, 4, 'F'); doc.text('In Progress', margin + 6, legendY + 3.5);
        doc.setFillColor(16, 185, 129); doc.rect(margin + 30, legendY, 4, 4, 'F'); doc.text('Completed', margin + 36, legendY + 3.5);
        doc.setFillColor(239, 68, 68); doc.rect(margin + 60, legendY, 4, 4, 'F'); doc.text('Delayed', margin + 66, legendY + 3.5);
      }
    }
  }

  // Master Render Pass: Apply consistent corporate header & footer to EVERY page cleanly
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    drawHeader(doc, p);
    drawFooter(doc, p, totalPages);
  }

  const pdfBytes = doc.output('arraybuffer');
  if (returnBytes) return new Uint8Array(pdfBytes);
  
  doc.save(`Timeline_Report_${quoteNo}.pdf`);
};

export const generateVariationReport = async (project: Project, settings?: CompanySettings, returnBytes: boolean = false, svcCode?: string) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const accentColor = '#2563eb';

  const drawHeader = (doc: jsPDF, _: any) => {
    drawBusinessHeader(
      doc, 
      'VARIATION ORDER', 
      project.projectName, 
      new Date().toLocaleDateString(), 
      svcCode || project.originalQuoteNo || 'N/A', 
      accentColor, 
      settings, 
      true
    );
  };

  // Pre-generate Barcode (Strictly Code 128 - NO QR CODES)
  const barcodeDataUrl = generateBarcodeDataUrl(svcCode || project.originalQuoteNo || 'N/A');

  const drawFooter = (doc: jsPDF, pageNumber: number, totalPages?: number) => {
    drawBusinessFooter(doc, svcCode || project.originalQuoteNo || 'N/A', pageNumber, totalPages, barcodeDataUrl, svcCode);
  };

  const isLeafItem = (item: BOQItem, index: number, allItems: BOQItem[]) => {
    if (item.itemType === 'Title') return false;
    if (item.itemType === 'Sub') return true;
    if (item.itemType === 'Main') {
      const nextItem = allItems[index + 1];
      return !nextItem || nextItem.itemType !== 'Sub';
    }
    return true;
  };

  const leafItems = project.items.filter((item, index) => isLeafItem(item, index, project.items));

  const originalItems = leafItems.filter(i => i.variationStatus === 'Original' || i.variationStatus === 'Omitted');
  const additionalItems = leafItems.filter(i => i.variationStatus === 'Additional');
  const omittedItems = leafItems.filter(i => i.variationStatus === 'Omitted');

  const originalSubtotal = originalItems.reduce((sum, i) => sum + i.amount, 0);
  const additionalTotal = additionalItems.reduce((sum, i) => sum + i.amount, 0);
  const omittedTotal = omittedItems.reduce((sum, i) => sum + i.amount, 0);
  
  // Use stored original values if available, otherwise fallback to current project values as baseline
  const origDiscountPercent = project.originalDiscountPercent ?? project.discountPercent ?? 0;
  const origTaxPercent = project.originalTaxPercent ?? project.taxPercent ?? 0;
  const origAdditionalCharges = project.originalAdditionalCharges ?? [];
  const origAdditionalChargesTotal = origAdditionalCharges.reduce((sum, c) => sum + c.amount, 0);
  
  const calculateTotals = (sub: number, disc: number, tax: number, charges: number, inclusive: boolean) => {
    const discAmt = sub * (disc / 100);
    const beforeTax = sub - discAmt + charges;
    const taxAmt = inclusive ? beforeTax - (beforeTax / (1 + tax / 100)) : beforeTax * (tax / 100);
    const grand = inclusive ? beforeTax : beforeTax + taxAmt;
    return { sub, discAmt, charges, taxAmt, grand };
  };

  const originalTotals = calculateTotals(originalSubtotal, origDiscountPercent, origTaxPercent, origAdditionalChargesTotal, project.isTaxInclusive || false);
  
  // Current totals
  const currentSubtotal = originalSubtotal + additionalTotal - omittedTotal;
  const currentDiscountPercent = project.discountPercent ?? 0;
  const currentTaxPercent = project.taxPercent ?? 0;
  const currentAdditionalChargesTotal = project.additionalCharges?.reduce((sum, c) => sum + c.amount, 0) || 0;
  
  const currentTotals = calculateTotals(currentSubtotal, currentDiscountPercent, currentTaxPercent, currentAdditionalChargesTotal, project.isTaxInclusive || false);

  // Pre-generate mini Barcodes
  const miniBarcodes: Record<string, string> = {};
  for (const item of project.items) {
    const code = item.pvcCode || item.no;
    if (code && !miniBarcodes[code]) {
      miniBarcodes[code] = generateBarcodeDataUrl(code);
    }
  }

  let currentY = 50;

  // 1. Original Contract Summary
  doc.setFont('helvetica', 'bold');
  doc.text('1. ORIGINAL CONTRACT SUMMARY', margin, currentY);
  currentY += 8;
  
  const origSummaryData = [
    ['Original Subtotal', `LKR ${originalTotals.sub.toLocaleString(undefined, { minimumFractionDigits: 2 })}`],
    ['Original Discount', `(${origDiscountPercent}%) - LKR ${originalTotals.discAmt.toLocaleString(undefined, { minimumFractionDigits: 2 })}`],
    ['Original Additional Charges', `LKR ${originalTotals.charges.toLocaleString(undefined, { minimumFractionDigits: 2 })}`],
    ['Original VAT/Tax', `(${origTaxPercent}%) - LKR ${originalTotals.taxAmt.toLocaleString(undefined, { minimumFractionDigits: 2 })}`],
    ['Original Contract Sum', `LKR ${originalTotals.grand.toLocaleString(undefined, { minimumFractionDigits: 2 })}`]
  ];

    autoTable(doc, {
      startY: currentY,
      body: origSummaryData,
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: 1 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 }, 1: { halign: 'right' } },
      margin: { top: 40, bottom: 25, left: 15, right: 15 }
    });

  currentY = getFinalY(doc, currentY) + 15;

  // 2. Additional Items (Additions)
  if (additionalItems.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.text('2. ADDITIONAL ITEMS (ADDITIONS)', margin, currentY);
    
    const addHead = [['No:', 'Description', 'Item Barcode', 'Unit', 'Qty', 'Rate', 'Amount']];
    const addBody = additionalItems.map(i => [
      i.no,
      i.name + (i.description ? `\n${i.description}` : ''),
      '', // Barcode Placeholder
      i.unit,
      i.qty.toLocaleString(),
      i.rate.toLocaleString(),
      i.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })
    ]);

    autoTable(doc, {
      startY: currentY + 5,
      head: addHead,
      body: addBody,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: 240, textColor: 0, fontStyle: 'bold' },
      columnStyles: {
        2: { cellWidth: 20, halign: 'center' }
      },
      margin: { top: 40, bottom: 25, left: 15, right: 15 },
      didDrawCell: (data) => {
        if (data.column.index === 2 && data.cell.section === 'body') {
          const item = additionalItems[data.row.index];
          const code = item?.pvcCode || item?.no;
          if (code && miniBarcodes[code]) {
            const x = data.cell.x + 1;
            const y = data.cell.y + 1;
            doc.addImage(miniBarcodes[code], 'PNG', x, y, data.cell.width - 2, 5.5);
          }
        }
      }
    });

    currentY = getFinalY(doc, currentY) + 10;
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Additions: LKR ${additionalTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, pageWidth - margin, currentY, { align: 'right' });
    currentY += 15;
  }

  // 3. Omitted Items (Omissions)
  if (omittedItems.length > 0) {
    if (currentY > pageHeight - 40) { doc.addPage(); currentY = 50; }
    doc.setFont('helvetica', 'bold');
    doc.text('3. OMITTED ITEMS (OMISSIONS)', margin, currentY);
    
    const omitHead = [['No:', 'Description', 'Item Barcode', 'Unit', 'Qty', 'Rate', 'Amount']];
    const omitBody = omittedItems.map(i => [
      i.no,
      i.name + (i.description ? `\n${i.description}` : ''),
      '', // Barcode Placeholder
      i.unit,
      i.qty.toLocaleString(),
      i.rate.toLocaleString(),
      i.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })
    ]);

    autoTable(doc, {
      startY: currentY + 5,
      head: omitHead,
      body: omitBody,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: 240, textColor: 0, fontStyle: 'bold' },
      columnStyles: {
        2: { cellWidth: 20, halign: 'center' }
      },
      margin: { top: 40, bottom: 25, left: 15, right: 15 },
      didDrawCell: (data) => {
        if (data.column.index === 2 && data.cell.section === 'body') {
          const item = omittedItems[data.row.index];
          const code = item?.pvcCode || item?.no;
          if (code && miniBarcodes[code]) {
            const x = data.cell.x + 1;
            const y = data.cell.y + 1;
            doc.addImage(miniBarcodes[code], 'PNG', x, y, data.cell.width - 2, 5.5);
          }
        }
      }
    });

    currentY = getFinalY(doc, currentY) + 10;
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Omissions: LKR ${omittedTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, pageWidth - margin, currentY, { align: 'right' });
    currentY += 15;
  }

  // 4. Variation Summary (Discount & Tax Changes)
  if (currentY > pageHeight - 60) { doc.addPage(); currentY = 50; }
  doc.setFont('helvetica', 'bold');
  doc.text('4. VARIATION SUMMARY (ADJUSTMENTS)', margin, currentY);
  currentY += 8;

  const variationData = [
    ['Item Variations (Net)', `LKR ${(additionalTotal - omittedTotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}`],
    ['Discount Variation', `${origDiscountPercent}% -> ${currentDiscountPercent}% (LKR ${(currentTotals.discAmt - originalTotals.discAmt).toLocaleString(undefined, { minimumFractionDigits: 2 })})`],
    ['VAT/Tax Variation', `${origTaxPercent}% -> ${currentTaxPercent}% (LKR ${(currentTotals.taxAmt - originalTotals.taxAmt).toLocaleString(undefined, { minimumFractionDigits: 2 })})`],
    ['Additional Charges Variation', `LKR ${(currentTotals.charges - originalTotals.charges).toLocaleString(undefined, { minimumFractionDigits: 2 })}`]
  ];

    autoTable(doc, {
      startY: currentY,
      body: variationData,
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: 1 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 80 }, 1: { halign: 'right' } },
      margin: { top: 40, bottom: 25, left: 15, right: 15 }
    });

  currentY = getFinalY(doc, currentY) + 15;

  // 5. Final Recalculation
  if (currentY > pageHeight - 60) { doc.addPage(); currentY = 50; }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('5. RECALCULATED PROJECT TOTAL', margin, currentY);
  currentY += 10;

  const finalSummaryData = [
    ['Original Contract Sum', `LKR ${originalTotals.grand.toLocaleString(undefined, { minimumFractionDigits: 2 })}`],
    ['Net Variation Amount', `LKR ${(currentTotals.grand - originalTotals.grand).toLocaleString(undefined, { minimumFractionDigits: 2 })}`],
    ['Revised Contract Sum', `LKR ${currentTotals.grand.toLocaleString(undefined, { minimumFractionDigits: 2 })}`]
  ];

  autoTable(doc, {
    startY: currentY,
    body: finalSummaryData,
    theme: 'grid',
    styles: { fontSize: 10, cellPadding: 3 },
    columnStyles: { 0: { fontStyle: 'bold', fillColor: 240 }, 1: { halign: 'right', fontStyle: 'bold' } },
    margin: { top: 40, bottom: 25, left: 15, right: 15 }
  });

  currentY = getFinalY(doc, currentY) + 15;
  
  // Signatures
  doc.setFontSize(10);
  doc.text('__________________________', margin, currentY);
  doc.text('Prepared By', margin, currentY + 5);
  
  doc.text('__________________________', pageWidth - margin - 50, currentY);
  doc.text('Client Approval', pageWidth - margin - 50, currentY + 5);

  // Master Render Pass: Apply consistent corporate header & footer to EVERY page cleanly
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    drawHeader(doc, p);
    drawFooter(doc, p, totalPages);
  }

  if (returnBytes) return new Uint8Array(doc.output('arraybuffer'));
  doc.save(`VO_${(project.projectName || '').replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`);
};

export const generateProjectReportPDF = async (project: Project, settings?: CompanySettings, returnBytes: boolean = false, svcCode?: string) => {
  const doc = new jsPDF();
  const margin = 15;
  
  const docSettings = project.documentSettings || {
    fontSize: 10,
    accentColor: '#2563eb',
    showLogo: true,
    showBankDetails: true,
    showTimeline: false,
    showPaymentTiers: true,
    layoutType: 'Detailed'
  };

  const drawHeader = (doc: jsPDF, _: any) => {
    drawBusinessHeader(
      doc, 
      'PROJECT STATUS', 
      project.projectName, 
      new Date().toLocaleDateString(), 
      svcCode || project.originalQuoteNo || 'N/A', 
      docSettings.accentColor, 
      settings, 
      docSettings.showLogo,
      undefined,
      docSettings.fontSize
    );
  };

  // Pre-generate Barcode (Strictly Code 128 - NO QR CODES)
  const barcodeDataUrl = generateBarcodeDataUrl(svcCode || project.originalQuoteNo || 'N/A');

  // Pre-generate mini Barcodes for items
  const miniBarcodes: Record<string, string> = {};
  for (const item of project.items) {
    const code = item.pvcCode || item.no;
    if (code && !miniBarcodes[code]) {
      miniBarcodes[code] = generateBarcodeDataUrl(code);
    }
  }

  const drawFooter = (doc: jsPDF, pageNumber: number, totalPages?: number) => {
    drawBusinessFooter(doc, svcCode || project.originalQuoteNo || 'N/A', pageNumber, totalPages, barcodeDataUrl, svcCode);
  };

  let currentY = 45;

  // Project Info Table
  const projectInfo = [
    ['Status', project.status],
    ['Start Date', project.startDate],
    ['Total Value', `LKR ${project.totalValue.toLocaleString()}`],
    ['Original Quote', project.originalQuoteNo],
  ];

  if (project.additionalCharges && project.additionalCharges.length > 0) {
    const chargesTotal = project.additionalCharges.reduce((sum, c) => sum + c.amount, 0);
    projectInfo.push(['Additional Charges', `LKR ${chargesTotal.toLocaleString()}`]);
  }

  if (project.notes) {
    projectInfo.push(['Notes', project.notes]);
  }

  autoTable(doc, {
    startY: currentY,
    body: projectInfo,
    theme: 'grid',
    styles: { fontSize: docSettings.fontSize },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } },
    margin: { top: 40, bottom: 25, left: 15, right: 15 }
  });

  currentY = getFinalY(doc, currentY) + 15;

  // Items Summary
  doc.setFontSize(docSettings.fontSize + 2);
  doc.setFont('helvetica', 'bold');
  doc.text('BILL OF QUANTITIES SUMMARY', margin, currentY);
  currentY += 5;

  const itemData = project.items.map(item => [
    item.no,
    item.name,
    '', // Barcode Placeholder
    `${item.qty} ${item.unit}`,
    `LKR ${item.amount.toLocaleString()}`,
    item.variationStatus || 'Original'
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['NO', 'ITEM', 'BARCODE', 'QTY', 'AMOUNT', 'STATUS']],
    body: itemData,
    theme: 'striped',
    styles: { fontSize: docSettings.fontSize - 1 },
    headStyles: { fillColor: 240, textColor: 0, fontStyle: 'bold' },
    columnStyles: {
      2: { cellWidth: 20, halign: 'center' }
    },
    margin: { top: 40, bottom: 25, left: 15, right: 15 },
    didDrawCell: (data: any) => {
      if (data.column.index === 2 && data.cell.section === 'body') {
        const item = project.items[data.row.index];
        const code = item?.pvcCode || item?.no;
        if (code && miniBarcodes[code]) {
          const x = data.cell.x + 1;
          const y = data.cell.y + 1;
          doc.addImage(miniBarcodes[code], 'PNG', x, y, data.cell.width - 2, 5.5);
        }
      }
    }
  });

  currentY = getFinalY(doc, currentY) + 15;

  // Payment Tiers
  if (project.paymentTiers && project.paymentTiers.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('PAYMENT SCHEDULE', margin, currentY);
    currentY += 5;

    const paymentData = project.paymentTiers.map(tier => [
      tier.phase,
      `${tier.percentage}%`,
      `LKR ${((project.totalValue * tier.percentage) / 100).toLocaleString()}`,
      tier.status
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['PHASE', '%', 'AMOUNT', 'STATUS']],
      body: paymentData,
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: 240, textColor: 0, fontStyle: 'bold' },
      margin: { top: 40, bottom: 25, left: 15, right: 15 }
    });
    currentY = getFinalY(doc, currentY) + 15;
  }

  // Master Render Pass: Apply consistent corporate header & footer to EVERY page cleanly
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    drawHeader(doc, p);
    drawFooter(doc, p, totalPages);
  }
  if (returnBytes) return new Uint8Array(doc.output('arraybuffer'));
  doc.save(`Project_Report_${(project.projectName || '').replace(/\s+/g, '_')}.pdf`);
};

export const generateAuditLogPDF = async (logs: (AuditLog & { projectName?: string })[], settings?: CompanySettings, returnBytes: boolean = false) => {
  const doc = new jsPDF();
  const accentColor = '#2563eb';
  const projectName = logs[0]?.projectName || 'System';
  const reportNo = 'AUDIT-' + new Date().getTime().toString().slice(-6);
  const dateStr = new Date().toLocaleDateString();

  // Pre-generate Barcode (Strictly Code 128 - NO QR CODES)
  const barcodeDataUrl = generateBarcodeDataUrl(reportNo);

  const drawHeader = (doc: jsPDF, _: any) => {
    drawBusinessHeader(
      doc, 
      'AUDIT LOG', 
      projectName, 
      dateStr, 
      reportNo, 
      accentColor, 
      settings, 
      true
    );
  };

  const drawFooter = (doc: jsPDF, pageNumber: number, totalPages?: number) => {
    drawBusinessFooter(doc, reportNo, pageNumber, totalPages, barcodeDataUrl);
  };

  let currentY = 45;

  const logData = logs.map(log => [
    new Date(log.timestamp).toLocaleString(),
    log.projectName || 'N/A',
    log.action,
    log.type,
    log.user
  ]);

    autoTable(doc, {
      startY: currentY,
      head: [['TIMESTAMP', 'PROJECT', 'ACTION', 'TYPE', 'USER']],
      body: logData,
      theme: 'striped',
      styles: { fontSize: 8 },
      headStyles: { fillColor: 240, textColor: 0, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 35 },
        2: { cellWidth: 60 },
        3: { cellWidth: 25 },
        4: { cellWidth: 30 }
      },
      margin: { top: 40, bottom: 25, left: 15, right: 15 }
    });

  // Master Render Pass: Apply consistent corporate header & footer to EVERY page cleanly
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    drawHeader(doc, p);
    drawFooter(doc, p, totalPages);
  }

  if (returnBytes) return new Uint8Array(doc.output('arraybuffer'));
  doc.save(`Audit_Log_Report_${new Date().getTime()}.pdf`);
};

export const generateAllProjectDocumentsPDF = async (
  project: Project,
  quote: Quote | undefined,
  invoices: Invoice[],
  auditLogs: AuditLog[],
  settings?: CompanySettings,
  returnBytes: boolean = false
) => {
  console.log('Starting generateAllProjectDocumentsPDF', { project, quote, auditLogsCount: auditLogs.length, invoicesCount: invoices.length });
  try {
    const mergedPdf = await PDFDocument.create();

    // 1. Quote
    if (quote) {
      console.log('Adding Quote to merged PDF', { quoteNo: quote.quoteNo });
      try {
        const quoteBytes = await generateQuotePDF(quote, 'Detailed', settings, true);
        if (quoteBytes) {
          console.log('Quote bytes generated, length:', quoteBytes.length);
          const quoteDoc = await PDFDocument.load(quoteBytes);
          const copiedPages = await mergedPdf.copyPages(quoteDoc, quoteDoc.getPageIndices());
          copiedPages.forEach((page) => mergedPdf.addPage(page));
          console.log('Quote added successfully');
        } else {
          console.warn('generateQuotePDF returned null/undefined bytes');
        }
      } catch (err) {
        console.error('Error adding quote to merged PDF:', err);
      }
    }

    // 2. Project Status Report
    console.log('Adding Project Status Report to merged PDF', { projectId: project.id });
    try {
      const projectReportBytes = await generateProjectReportPDF(project, settings, true);
      if (projectReportBytes) {
        console.log('Project Report bytes generated, length:', projectReportBytes.length);
        const projectDoc = await PDFDocument.load(projectReportBytes);
        const copiedPages = await mergedPdf.copyPages(projectDoc, projectDoc.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
        console.log('Project Status Report added successfully');
      } else {
        console.warn('generateProjectReportPDF returned null/undefined bytes');
      }
    } catch (err) {
      console.error('Error adding project report to merged PDF:', err);
    }

    // 3. Invoices
    const projectInvoices = invoices.filter(inv => inv.projectId === project.id);
    if (projectInvoices.length > 0) {
      console.log(`Adding ${projectInvoices.length} Invoices to merged PDF`);
      for (const inv of projectInvoices) {
        try {
          const invBytes = await generateInvoicePDF(inv, settings, true);
          if (invBytes) {
            const invDoc = await PDFDocument.load(invBytes);
            const copiedPages = await mergedPdf.copyPages(invDoc, invDoc.getPageIndices());
            copiedPages.forEach((page) => mergedPdf.addPage(page));
            console.log(`Invoice ${inv.invoiceNo} added successfully`);
          }
        } catch (err) {
          console.error(`Error adding invoice ${inv.invoiceNo} to merged PDF:`, err);
        }
      }
    }

    // 4. Variation Report
    console.log('Adding Variation Report to merged PDF');
    try {
      const variationBytes = await generateVariationReport(project, settings, true);
      if (variationBytes) {
        const variationDoc = await PDFDocument.load(variationBytes);
        const copiedPages = await mergedPdf.copyPages(variationDoc, variationDoc.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
        console.log('Variation Report added successfully');
      }
    } catch (err) {
      console.error('Error adding variation report to merged PDF:', err);
    }

    // 5. Timeline Report
    const timelineToUse = quote?.timeline || project.timeline;
    if (timelineToUse && timelineToUse.jobs && timelineToUse.jobs.length > 0) {
      console.log('Adding Timeline Report to merged PDF');
      try {
        const timelineBytes = await generateTimelineReport(quote || project, settings, true);
        if (timelineBytes) {
          const timelineDoc = await PDFDocument.load(timelineBytes);
          const copiedPages = await mergedPdf.copyPages(timelineDoc, timelineDoc.getPageIndices());
          copiedPages.forEach((page) => mergedPdf.addPage(page));
          console.log('Timeline Report added successfully');
        }
      } catch (err) {
        console.error('Error adding timeline report to merged PDF:', err);
      }
    }

    // 6. Audit Logs
    console.log('Adding Audit Logs to merged PDF');
    try {
      const projectLogs = auditLogs.filter(log => 
        log.projectName === project.projectName || 
        (quote && log.projectName === quote.projectName)
      );
      if (projectLogs.length > 0) {
        const auditBytes = await generateAuditLogPDF(projectLogs, settings, true);
        if (auditBytes) {
          const auditDoc = await PDFDocument.load(auditBytes);
          const copiedPages = await mergedPdf.copyPages(auditDoc, auditDoc.getPageIndices());
          copiedPages.forEach((page) => mergedPdf.addPage(page));
          console.log('Audit Logs added successfully');
        }
      }
    } catch (err) {
      console.error('Error adding audit logs to merged PDF:', err);
    }

    console.log('Saving merged PDF');
    const finalPdfBytes = await mergedPdf.save();
    if (returnBytes) return finalPdfBytes;

    const blob = new Blob([finalPdfBytes], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `All_Documents_${(project.projectName || '').replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`;
    link.click();
    console.log('Merged PDF download initiated');
  } catch (error) {
    console.error('Error generating merged PDF:', error);
    // Fallback to individual downloads if merging fails
    if (returnBytes) return null;
    if (quote) await generateQuotePDF(quote, 'Detailed', settings);
    await generateVariationReport(project, settings);
  }
};

export const generateDashboardReport = async (
  quotes: Quote[],
  projects: Project[],
  settings?: CompanySettings,
  returnBytes: boolean = false
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const reportNo = 'DASH-' + new Date().getTime().toString().slice(-6);
  const dateStr = new Date().toLocaleDateString();
  const accentColor = '#1d4ed8';

  const barcodeDataUrl = generateBarcodeDataUrl(reportNo);

  const drawHeader = (doc: jsPDF, _pageNumber: number) => {
    drawBusinessHeader(
      doc,
      'EXECUTIVE DASHBOARD',
      'System Performance & KPI Matrix',
      dateStr,
      reportNo,
      accentColor,
      settings,
      true
    );
  };

  const drawFooter = (doc: jsPDF, pageNumber: number, totalPages?: number) => {
    drawBusinessFooter(doc, reportNo, pageNumber, totalPages, barcodeDataUrl);
  };

  let yPos = 48;

  // --- 1. Key Performance Indicators (KPIs) ---
  const totalQuotes = quotes.length;
  const totalProjects = projects.length;
  const conversionRate = totalQuotes > 0 ? (totalProjects / totalQuotes) * 100 : 0;
  const activeQuotes = quotes.filter(q => ['Draft', 'Sent', 'Revised'].includes(q.status)).length;
  const activeProjects = projects.filter(p => p.status === 'In Progress').length;
  const totalRevenue = projects.reduce((sum, p) => sum + p.totalValue, 0);
  
  const kpiData = [
    { label: 'Total Revenue', value: `${settings?.defaultCurrency || 'LKR'} ${totalRevenue.toLocaleString()}`, color: [37, 99, 235] },
    { label: 'Conversion Rate', value: `${conversionRate.toFixed(1)}%`, color: [16, 185, 129] },
    { label: 'Active Quotes', value: activeQuotes.toString(), color: [245, 158, 11] },
    { label: 'Active Projects', value: activeProjects.toString(), color: [139, 92, 246] }
  ];

  const kpiWidth = (pageWidth - 50) / 4;
  kpiData.forEach((kpi, i) => {
    const x = 20 + (i * (kpiWidth + 10));
    doc.setDrawColor(220, 220, 220);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(x, yPos, kpiWidth, 30, 3, 3, 'FD');
    
    doc.setFillColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.rect(x, yPos, 3, 30, 'F');

    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(kpi.label.toUpperCase(), x + 8, yPos + 10);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.text(kpi.value, x + 8, yPos + 22);
  });

  yPos += 45;

  // --- 2. Distribution Charts (Pie Charts) ---
  const drawPieChart = (x: number, y: number, radius: number, data: { label: string, value: number, color: number[] }[], title: string) => {
    const total = data.reduce((sum, d) => sum + d.value, 0);
    if (total === 0) {
      doc.setFontSize(8);
      doc.text(`No data for ${title}`, x - 15, y);
      return;
    }

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(title.toUpperCase(), x - radius, y - radius - 5);

    let startAngle = 0;
    data.forEach((d, i) => {
      const sliceAngle = (d.value / total) * 360;
      doc.setFillColor(d.color[0], d.color[1], d.color[2]);
      
      const startRad = (startAngle - 90) * Math.PI / 180;
      const endRad = (startAngle + sliceAngle - 90) * Math.PI / 180;
      
      doc.moveTo(x, y);
      doc.lineTo(x + radius * Math.cos(startRad), y + radius * Math.sin(startRad));
      
      const steps = 30;
      for (let j = 1; j <= steps; j++) {
        const angle = startRad + (endRad - startRad) * (j / steps);
        doc.lineTo(x + radius * Math.cos(angle), y + radius * Math.sin(angle));
      }
      doc.lineTo(x, y);
      doc.fill();
      
      // Legend
      const legendX = x + radius + 5;
      const legendY = y - radius + (i * 6);
      doc.rect(legendX, legendY, 3, 3, 'F');
      doc.setFontSize(6);
      doc.setFont('helvetica', 'normal');
      doc.text(`${d.label}: ${d.value}`, legendX + 5, legendY + 2.5);
      
      startAngle += sliceAngle;
    });
  };

  // Quote Status Data
  const statusCounts = quotes.reduce((acc, q) => {
    acc[q.status] = (acc[q.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const quoteStatusData = Object.entries(statusCounts).map(([label, value], i) => ({
    label, value, color: [[37, 99, 235], [16, 185, 129], [245, 158, 11], [239, 68, 68], [107, 114, 128]][i % 5]
  }));

  // Quote Type Data
  const typeCounts = quotes.reduce((acc, q) => {
    acc[q.quoteType] = (acc[q.quoteType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const quoteTypeData = Object.entries(typeCounts).map(([label, value], i) => ({
    label, value, color: [[99, 102, 241], [236, 72, 153], [20, 184, 166], [249, 115, 22]][i % 4]
  }));

  drawPieChart(45, yPos + 25, 20, quoteStatusData, 'Quote Status Distribution');
  drawPieChart(145, yPos + 25, 20, quoteTypeData, 'Quotation Type Distribution');

  yPos += 65;

  // --- 3. Revenue Pipeline & Top Products (Bar Charts) ---
  const drawBarChart = (x: number, y: number, width: number, height: number, data: { label: string, value: number }[], title: string, horizontal = false) => {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(title.toUpperCase(), x, y - 5);

    const maxVal = Math.max(...data.map(d => d.value), 1);
    const barSpacing = 4;
    
    if (horizontal) {
      const barHeight = (height - (data.length * barSpacing)) / data.length;
      data.forEach((d, i) => {
        const barY = y + (i * (barHeight + barSpacing));
        const barWidth = (d.value / maxVal) * (width - 40);
        doc.setFillColor(71, 85, 105);
        doc.rect(x + 35, barY, barWidth, barHeight, 'F');
        doc.setFontSize(6);
        doc.setFont('helvetica', 'normal');
        doc.text(d.label.substring(0, 15), x, barY + (barHeight / 2) + 1.5);
        doc.text(d.value.toLocaleString(), x + 35 + barWidth + 2, barY + (barHeight / 2) + 1.5);
      });
    } else {
      const barWidth = (width - (data.length * barSpacing)) / data.length;
      data.forEach((d, i) => {
        const barX = x + (i * (barWidth + barSpacing));
        const barHeightVal = (d.value / maxVal) * height;
        doc.setFillColor(37, 99, 235);
        doc.rect(barX, y + height - barHeightVal, barWidth, barHeightVal, 'F');
        doc.setFontSize(5);
        doc.setFont('helvetica', 'normal');
        doc.text(d.label.substring(0, 8), barX, y + height + 3, { angle: 45 });
      });
    }
  };

  // Revenue Pipeline
  const revenueByStatus = projects.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + p.totalValue;
    return acc;
  }, {} as Record<string, number>);
  const pipelineData = Object.entries(revenueByStatus).map(([label, value]) => ({ label, value }));

  // Top Products
  const productCounts = quotes.flatMap(q => q.items || []).reduce((acc, item) => {
    if (item.itemType === 'Main') acc[item.name] = (acc[item.name] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const topProducts = Object.entries(productCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, value]) => ({ label, value }));

  drawBarChart(20, yPos + 10, 80, 40, pipelineData, 'Revenue Pipeline by Status');
  drawBarChart(110, yPos + 10, 80, 40, topProducts, 'Top Performance Products', true);

  yPos += 65;

  // --- 4. Data Tables ---
  if (yPos > pageHeight - 60) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Recent Quotations', 20, yPos);
  yPos += 8;

  const recentQuotesData = quotes.slice(0, 10).map(q => {
    const subtotal = q.items.reduce((sum, item) => sum + item.amount, 0);
    const afterDiscount = subtotal * (1 - q.discountPercent / 100);
    const totalValue = q.isTaxInclusive ? afterDiscount : afterDiscount * (1 + q.taxPercent / 100);
    const finalTotal = totalValue + q.additionalCharges.reduce((sum, charge) => sum + charge.amount, 0);

    return [
      q.quoteNo,
      q.projectName,
      q.client.name,
      q.status,
      `${settings?.defaultCurrency || 'LKR'} ${finalTotal.toLocaleString()}`
    ];
  });

  autoTable(doc, {
    startY: yPos,
    head: [['Quote #', 'Project Name', 'Client', 'Status', 'Total Value']],
    body: recentQuotesData,
    theme: 'striped',
    headStyles: { fillColor: [51, 65, 85], textColor: 255 },
    styles: { fontSize: 8 }
  });

  yPos = getFinalY(doc, yPos) + 15;

  if (yPos > pageHeight - 60) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Active Projects Overview', 20, yPos);
  yPos += 8;

  const activeProjectsData = projects.filter(p => p.status === 'In Progress').slice(0, 10).map(p => {
    const totalValue = p.totalValue || 0;
    const paidAmount = p.paymentTiers?.filter(t => t.status === 'Paid').reduce((s, t) => s + t.amount, 0) || 0;
    const paymentProgress = totalValue > 0 ? Math.round((paidAmount / totalValue) * 100) : 0;
    return [
      p.projectName,
      p.client.name,
      `${paymentProgress}%`,
      `${settings?.defaultCurrency || 'LKR'} ${totalValue.toLocaleString()}`
    ];
  });

  autoTable(doc, {
    startY: yPos,
    head: [['Project Name', 'Client', 'Payment %', 'Total Value']],
    body: activeProjectsData,
    theme: 'striped',
    headStyles: { fillColor: [51, 65, 85], textColor: 255 },
    styles: { fontSize: 8 }
  });

  // System Portals Status
  yPos = getFinalY(doc, yPos) + 15;
  if (yPos > pageHeight - 40) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('System Management Hub Status', 20, yPos);
  yPos += 8;

  const portalData = [
    ['Variation Manager', 'Active', 'Tracking project additions & omissions'],
    ['Audit Logs', 'Active', `${quotes.length + projects.length} records tracked`],
    ['Payment Tiers', 'Active', 'Managing project advance payments'],
    ['System Settings', 'Configured', 'Company & defaults configured']
  ];

  autoTable(doc, {
    startY: yPos,
    head: [['Portal Name', 'Status', 'Description']],
    body: portalData,
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], textColor: 255 },
    styles: { fontSize: 8 }
  });

  // Master Render Pass: Apply consistent corporate header & footer to EVERY page cleanly
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    drawHeader(doc, i);
    drawFooter(doc, i, pageCount);
  }

  if (returnBytes) return new Uint8Array(doc.output('arraybuffer'));
  doc.save(`System_Dashboard_Report_${new Date().getTime()}.pdf`);
};

export const generateFullSystemSnapshotPDF = async (
  quotes: Quote[],
  projects: Project[],
  auditLogs: AuditLog[],
  settings?: CompanySettings,
  returnBytes: boolean = false
) => {
  const doc = new jsPDF();
  const accentColor = '#2563eb';
  const reportNo = 'SNAPSHOT-' + new Date().getTime().toString().slice(-6);
  const dateStr = new Date().toLocaleDateString();

  // Pre-generate Barcode (Strictly Code 128 - NO QR CODES)
  const barcodeDataUrl = generateBarcodeDataUrl(reportNo);

  const drawHeader = (doc: jsPDF, title: string) => {
    drawBusinessHeader(
      doc, 
      title, 
      'FULL SYSTEM SNAPSHOT', 
      dateStr, 
      reportNo, 
      accentColor, 
      settings, 
      true
    );
  };

  const drawFooter = (doc: jsPDF, pageNumber: number, totalPages?: number) => {
    drawBusinessFooter(doc, reportNo, pageNumber, totalPages, barcodeDataUrl);
  };

  // 1. Dashboard Overview
  const totalQuotes = quotes.length;
  const totalProjects = projects.length;
  const totalRevenue = projects.reduce((sum, p) => sum + p.totalValue, 0);
  const activeProjects = projects.filter(p => p.status === 'In Progress').length;
  const completedProjects = projects.filter(p => p.status === 'Completed').length;
  const totalVariations = projects.reduce((sum, p) => sum + (p.items?.filter(item => item.variationStatus && item.variationStatus !== 'Original').length || 0), 0);

  const summaryData = [
    ['System Metric', 'Current Value'],
    ['Total Revenue', `${settings?.defaultCurrency || 'LKR'} ${totalRevenue.toLocaleString()}`],
    ['Total Quotations', totalQuotes.toString()],
    ['Total Projects', totalProjects.toString()],
    ['Active Projects', activeProjects.toString()],
    ['Completed Projects', completedProjects.toString()],
    ['Total Variations', totalVariations.toString()],
    ['Conversion Rate', `${totalQuotes > 0 ? ((totalProjects / totalQuotes) * 100).toFixed(1) : 0}%`]
  ];

    autoTable(doc, {
      startY: 45,
      head: [summaryData[0]],
      body: summaryData.slice(1),
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 4 },
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
      margin: { top: 40, bottom: 25, left: 15, right: 15 }
    });

  // 2. Project Status Breakdown
  const statusCounts = projects.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusData = Object.entries(statusCounts).map(([status, count]) => [status, count]);

  autoTable(doc, {
    startY: getFinalY(doc, 0) + 15,
    head: [['Project Status', 'Count']],
    body: statusData,
    theme: 'striped',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [15, 23, 42], textColor: 255 },
    margin: { top: 40, bottom: 25, left: 15, right: 15 }
  });

  // 3. Project List
  doc.addPage();
  
  const projectData = projects.map(p => [
    p.projectName,
    p.client.name,
    p.status,
    `${settings?.defaultCurrency || 'LKR'} ${p.totalValue.toLocaleString()}`,
    p.startDate
  ]);

    autoTable(doc, {
      startY: 45,
      head: [['PROJECT NAME', 'CLIENT', 'STATUS', 'VALUE', 'START DATE']],
      body: projectData,
      theme: 'striped',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
      margin: { top: 40, bottom: 25, left: 15, right: 15 }
    });

  // 4. Quotation List
  doc.addPage();
  
  const quoteData = quotes.map(q => [
    q.quoteNo,
    q.projectName,
    q.client.name,
    q.status,
    q.submittedDate
  ]);

    autoTable(doc, {
      startY: 45,
      head: [['QUOTE #', 'PROJECT', 'CLIENT', 'STATUS', 'DATE']],
      body: quoteData,
      theme: 'striped',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
      margin: { top: 40, bottom: 25, left: 15, right: 15 }
    });

  // 5. Recent Audit Logs
  doc.addPage();
  
  const recentLogs = auditLogs.slice(0, 100).map(log => [
    new Date(log.timestamp).toLocaleString(),
    log.action,
    log.user,
    log.type
  ]);

    autoTable(doc, {
      startY: 45,
      head: [['TIMESTAMP', 'ACTION', 'USER', 'TYPE']],
      body: recentLogs,
      theme: 'striped',
      styles: { fontSize: 7 },
      headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold' },
      margin: { top: 40, bottom: 25, left: 15, right: 15 }
    });

  // Master Render Pass: Apply consistent corporate header & footer to EVERY page cleanly
  const totalPages = doc.getNumberOfPages();
  const pageTitles = ['SYSTEM OVERVIEW', 'PROJECT LISTING', 'QUOTATION HISTORY', 'RECENT SYSTEM ACTIVITY'];
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    const pageTitle = pageTitles[p - 1] || 'SYSTEM SNAPSHOT';
    drawHeader(doc, pageTitle);
    drawFooter(doc, p, totalPages);
  }

  if (returnBytes) {
    return new Uint8Array(doc.output('arraybuffer'));
  }

  doc.save(`System_Snapshot_${new Date().getTime()}.pdf`);
};

export const generateSystemWideDocumentsZIP = async (
  quotes: Quote[],
  projects: Project[],
  invoices: Invoice[],
  auditLogs: AuditLog[],
  settings?: CompanySettings
) => {
  const zip = new JSZip();
  const folder = zip.folder("Innovista_Metal_Documents");

  // 1. All Quotes
  const quotesFolder = folder?.folder("Quotations");
  for (const q of quotes) {
    try {
      const bytes = await generateQuotePDF(q, 'Detailed', settings, true);
      if (bytes) {
        quotesFolder?.file(`${q.quoteNo}_${q.projectName.replace(/\s+/g, '_')}.pdf`, bytes);
      }
    } catch (err) {
      console.error(`Error adding quote ${q.quoteNo} to ZIP:`, err);
    }
  }

  // 2. All Invoices
  const invoicesFolder = folder?.folder("Invoices");
  for (const inv of invoices) {
    try {
      const bytes = await generateInvoicePDF(inv, settings, true);
      if (bytes) {
        invoicesFolder?.file(`${inv.invoiceNo}_${inv.client.name.replace(/\s+/g, '_')}.pdf`, bytes);
      }
    } catch (err) {
      console.error(`Error adding invoice ${inv.invoiceNo} to ZIP:`, err);
    }
  }

  // 3. All Projects
  const projectsFolder = folder?.folder("Projects");
  for (const p of projects) {
    try {
      const pFolder = projectsFolder?.folder(p.projectName.replace(/\s+/g, '_'));
      
      // Project Report
      try {
        const reportBytes = await generateProjectReportPDF(p, settings, true);
        if (reportBytes) {
          pFolder?.file(`Status_Report_${p.projectName.replace(/\s+/g, '_')}.pdf`, reportBytes);
        }
      } catch (err) {
        console.error(`Error adding project report for ${p.projectName} to ZIP:`, err);
      }

      // Variation Report
      try {
        const variationBytes = await generateVariationReport(p, settings, true);
        if (variationBytes) {
          pFolder?.file(`Variation_Report_${p.projectName.replace(/\s+/g, '_')}.pdf`, variationBytes);
        }
      } catch (err) {
        console.error(`Error adding variation report for ${p.projectName} to ZIP:`, err);
      }

      // Associated Quote
      const associatedQuote = quotes.find(q => q.id === p.quoteId);
      if (associatedQuote) {
        try {
          const qBytes = await generateQuotePDF(associatedQuote, 'Detailed', settings, true);
          if (qBytes) {
            pFolder?.file(`Original_Quote_${associatedQuote.quoteNo}.pdf`, qBytes);
          }
        } catch (err) {
          console.error(`Error adding associated quote ${associatedQuote.quoteNo} to ZIP:`, err);
        }
      }

      // Associated Invoices
      const associatedInvoices = invoices.filter(inv => inv.projectId === p.id);
      if (associatedInvoices.length > 0) {
        const pInvoicesFolder = pFolder?.folder("Invoices");
        for (const inv of associatedInvoices) {
          try {
            const bytes = await generateInvoicePDF(inv, settings, true);
            if (bytes) {
              pInvoicesFolder?.file(`${inv.invoiceNo}.pdf`, bytes);
            }
          } catch (err) {
            console.error(`Error adding associated invoice ${inv.invoiceNo} to ZIP:`, err);
          }
        }
      }
    } catch (err) {
      console.error(`Error adding project ${p.projectName} to ZIP:`, err);
    }
  }

  // 4. Global Audit Log
  try {
    const auditBytes = await generateAuditLogPDF(auditLogs, settings, true);
    if (auditBytes) {
      folder?.file(`Global_Audit_Log_${new Date().getTime()}.pdf`, auditBytes);
    }
  } catch (err) {
    console.error('Error adding global audit log to ZIP:', err);
  }

  // 5. System Snapshot
  try {
    const snapshotBytes = await generateFullSystemSnapshotPDF(quotes, projects, auditLogs, settings, true);
    if (snapshotBytes) {
      folder?.file(`System_Snapshot_${new Date().getTime()}.pdf`, snapshotBytes);
    }
  } catch (err) {
    console.error('Error adding system snapshot to ZIP:', err);
  }

  const content = await zip.generateAsync({ type: "blob" });
  saveAs(content, `Innovista_Metal_All_Documents_${new Date().toISOString().split('T')[0]}.zip`);
};

export const generateAccountingReportPDF = async (
  title: string,
  data: any[],
  columns: string[],
  settings?: CompanySettings,
  returnBytes: boolean = false
) => {
  const doc = new jsPDF();
  const date = new Date().toLocaleDateString();
  const accentColor = '#1d4ed8';
  const reportNo = `ACC-${new Date().getTime().toString().slice(-6)}`;
  const barcodeDataUrl = generateBarcodeDataUrl(reportNo);

  autoTable(doc, {
    startY: 45,
    head: [columns.map(c => c.toUpperCase())],
    body: data,
    theme: 'striped',
    headStyles: { fillColor: hexToRgb(accentColor) as any, textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 8 },
    margin: { top: 40, bottom: 25, left: 15, right: 15 }
  });

  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    drawBusinessHeader(
      doc,
      title.toUpperCase(),
      'Accounting & Financial Report',
      date,
      reportNo,
      accentColor,
      settings
    );
    drawBusinessFooter(doc, reportNo, p, totalPages, barcodeDataUrl);
  }

  if (returnBytes) return new Uint8Array(doc.output('arraybuffer'));
  doc.save(`${(title || '').replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`);
};

export const generateAllCustomerReportsPDF = async (
  customerName: string,
  allInvoices: Invoice[],
  allProjects: Project[],
  allPayments: any[],
  allAdjustments: any[],
  settings?: CompanySettings,
  returnBytes: boolean = false
) => {
  const doc = new jsPDF();
  const date = new Date().toLocaleDateString();
  const accentColor = '#1d4ed8';
  const reportNo = `CUST-${new Date().getTime().toString().slice(-6)}`;
  const barcodeDataUrl = generateBarcodeDataUrl(reportNo);

  // Filter data for this customer
  const customerInvoices = allInvoices.filter(inv => inv.client.name === customerName);
  const customerProjects = allProjects.filter(p => p.client.name === customerName);
  const customerPayments = allPayments.filter(p => p.clientName === customerName);
  const customerAdjustments = allAdjustments.filter(a => a.clientName === customerName);

  // 1. Customer Ledger (Page 1)
  const ledgerData = [
    ...customerInvoices.map(inv => [inv.date, inv.invoiceNo, 'Invoice', inv.grandTotal, 0, inv.balanceDue]),
    ...customerPayments.map(p => [p.date, p.reference || 'N/A', 'Payment', 0, p.amount, 0]),
    ...customerAdjustments.map(a => [a.date, a.reference || 'N/A', `Adjustment (${a.type})`, a.type === 'Credit' ? 0 : a.amount, a.type === 'Credit' ? a.amount : 0, 0])
  ].sort((a, b) => new Date(a[0] as string).getTime() - new Date(b[0] as string).getTime());

  autoTable(doc, {
    startY: 45,
    head: [['DATE', 'REF #', 'TYPE', 'DEBIT', 'CREDIT', 'BALANCE']],
    body: ledgerData,
    theme: 'striped',
    headStyles: { fillColor: hexToRgb(accentColor) as any, textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 8 },
    margin: { top: 40, bottom: 25, left: 15, right: 15 }
  });

  // 2. Outstanding Statement (Page 2)
  doc.addPage();
  const outstandingInvoices = customerInvoices.filter(inv => inv.balanceDue > 0);
  const outstandingData = outstandingInvoices.map(inv => [
    inv.date,
    inv.invoiceNo,
    inv.dueDate,
    inv.grandTotal,
    inv.amountPaid + (inv.amountAdjusted || 0),
    inv.balanceDue
  ]);

    autoTable(doc, {
      startY: 45,
      head: [['DATE', 'INVOICE #', 'DUE DATE', 'TOTAL', 'PAID/ADJ', 'BALANCE']],
      body: outstandingData,
      theme: 'striped',
      headStyles: { fillColor: hexToRgb(accentColor) as any, textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 8 },
      margin: { top: 40, bottom: 25, left: 15, right: 15 }
    });

  // 3. Retention Summary (Page 3)
  doc.addPage();
  const retentionData = customerProjects.map(p => {
    const projectInvoices = customerInvoices.filter(inv => inv.projectId === p.id);
    const totalRetentionHeld = projectInvoices.reduce((sum, inv) => sum + (inv.retentionAmount || 0), 0);
    const totalRetentionReleased = customerAdjustments
      .filter(a => a.projectId === p.id && a.type === 'Retention Release')
      .reduce((sum, a) => sum + a.amount, 0);
    
    return [
      p.projectName,
      totalRetentionHeld,
      totalRetentionReleased,
      totalRetentionHeld - totalRetentionReleased
    ];
  });

    autoTable(doc, {
      startY: 45,
      head: [['PROJECT', 'RETENTION HELD', 'RETENTION RELEASED', 'BALANCE HELD']],
      body: retentionData,
      theme: 'striped',
      headStyles: { fillColor: hexToRgb(accentColor) as any, textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 8 },
      margin: { top: 40, bottom: 25, left: 15, right: 15 }
    });

  // 4. Project Financials (Page 4)
  doc.addPage();
  const projectFinancialsData = customerProjects.map(p => {
    const projectInvoices = customerInvoices.filter(inv => inv.projectId === p.id);
    const totalInvoiced = projectInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
    const totalPaid = projectInvoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
    const totalAdjusted = projectInvoices.reduce((sum, inv) => sum + (inv.amountAdjusted || 0), 0);
    
    return [
      p.projectName,
      totalInvoiced,
      totalPaid + totalAdjusted,
      totalInvoiced - (totalPaid + totalAdjusted)
    ];
  });

  autoTable(doc, {
    startY: 45,
    head: [['PROJECT', 'INVOICED', 'COLLECTED', 'OUTSTANDING']],
    body: projectFinancialsData,
    theme: 'striped',
    headStyles: { fillColor: hexToRgb(accentColor) as any, textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 8 },
    margin: { top: 40, bottom: 25, left: 15, right: 15 }
  });

  // Master Render Pass: Apply consistent corporate header & footer to EVERY page cleanly
  const totalPages = doc.getNumberOfPages();
  const sectionTitles = ['CUSTOMER LEDGER', 'OUTSTANDING STATEMENT', 'RETENTION SUMMARY', 'PROJECT FINANCIALS'];
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    const pageTitle = sectionTitles[p - 1] || 'CUSTOMER STATEMENT';
    drawBusinessHeader(doc, pageTitle, customerName, date, reportNo, accentColor, settings);
    drawBusinessFooter(doc, reportNo, p, totalPages, barcodeDataUrl);
  }

  if (returnBytes) return new Uint8Array(doc.output('arraybuffer'));
  doc.save(`Customer_Reports_${(customerName || '').replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`);
};

export const generateCustomerTAccountPDF = async (
  customerName: string,
  allInvoices: Invoice[],
  allPayments: any[],
  allAdjustments: any[],
  settings?: CompanySettings,
  returnBytes: boolean = false
) => {
  const doc = new jsPDF();
  const date = new Date().toLocaleDateString();
  const accentColor = '#1d4ed8';
  const reportNo = `TACC-${new Date().getTime().toString().slice(-6)}`;
  const barcodeDataUrl = generateBarcodeDataUrl(reportNo);

  const customerInvoices = allInvoices.filter(inv => inv.client.name === customerName);
  const customerPayments = allPayments.filter(p => p.clientName === customerName);
  const customerAdjustments = allAdjustments.filter(a => a.clientName === customerName);

  // T-Account Structure
  // Left side: Debits (Invoices, Debit Adjustments)
  // Right side: Credits (Payments, Credit Adjustments)

  const debits = [
    ...customerInvoices.map(inv => ({ date: inv.date, ref: inv.invoiceNo, desc: 'Invoice', amount: inv.grandTotal })),
    ...customerAdjustments.filter(a => a.type === 'Debit').map(a => ({ date: a.date, ref: a.reference || 'Adj', desc: 'Debit Adjustment', amount: a.amount }))
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const credits = [
    ...customerPayments.map(p => ({ date: p.date, ref: p.reference || 'Pay', desc: 'Payment', amount: p.amount })),
    ...customerAdjustments.filter(a => a.type === 'Credit').map(a => ({ date: a.date, ref: a.reference || 'Adj', desc: 'Credit Adjustment', amount: a.amount }))
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const totalDebits = debits.reduce((sum, d) => sum + d.amount, 0);
  const totalCredits = credits.reduce((sum, c) => sum + c.amount, 0);
  const balance = totalDebits - totalCredits;

  const maxRows = Math.max(debits.length, credits.length);
  const tableBody = [];

  for (let i = 0; i < maxRows; i++) {
    const debit = debits[i];
    const credit = credits[i];
    tableBody.push([
      debit ? debit.date : '',
      debit ? debit.ref : '',
      debit ? debit.amount.toLocaleString() : '',
      credit ? credit.date : '',
      credit ? credit.ref : '',
      credit ? credit.amount.toLocaleString() : ''
    ]);
  }

  // Add total row
  tableBody.push([
    { content: 'TOTAL DEBITS', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [245, 245, 245] } },
    { content: totalDebits.toLocaleString(), styles: { fontStyle: 'bold', fillColor: [245, 245, 245] } },
    { content: 'TOTAL CREDITS', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [245, 245, 245] } },
    { content: totalCredits.toLocaleString(), styles: { fontStyle: 'bold', fillColor: [245, 245, 245] } }
  ]);

  // Add balance row
  tableBody.push([
    { content: balance > 0 ? 'DEBIT BALANCE (Owed)' : 'CREDIT BALANCE (Overpaid)', colSpan: 5, styles: { fontStyle: 'bold', halign: 'right' } },
    { content: Math.abs(balance).toLocaleString(), styles: { fontStyle: 'bold', textColor: balance > 0 ? [220, 38, 38] : [5, 150, 105] } }
  ]);

  autoTable(doc, {
    startY: 45,
    head: [[
      { content: 'DEBIT (DR)', colSpan: 3, styles: { halign: 'center', fillColor: [239, 246, 255], textColor: [30, 64, 175] } },
      { content: 'CREDIT (CR)', colSpan: 3, styles: { halign: 'center', fillColor: [254, 242, 242], textColor: [153, 27, 27] } }
    ], ['DATE', 'REF', 'AMOUNT', 'DATE', 'REF', 'AMOUNT']],
    body: tableBody,
    theme: 'grid',
    styles: { fontSize: 7 },
    headStyles: { fillColor: hexToRgb(accentColor) as any, textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      2: { halign: 'right' },
      5: { halign: 'right' }
    },
    margin: { top: 40, bottom: 25, left: 15, right: 15 }
  });

  // Control Account Summary
  const finalY = getFinalY(doc, 50);
  if (finalY > 220) doc.addPage();
  
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text('CONTROL ACCOUNT SUMMARY', 15, (finalY > 220 ? 45 : finalY + 15));
  
  autoTable(doc, {
    startY: (finalY > 220 ? 50 : finalY + 20),
    body: [
      ['Opening Balance', '0.00'],
      ['Total Invoiced (Sales)', totalDebits.toLocaleString()],
      ['Total Payments Received', `(${totalCredits.toLocaleString()})`],
      ['Net Adjustments', (customerAdjustments.reduce((s, a) => s + (a.type === 'Debit' ? a.amount : -a.amount), 0)).toLocaleString()],
      [{ content: 'CLOSING BALANCE', styles: { fontStyle: 'bold' } }, { content: balance.toLocaleString(), styles: { fontStyle: 'bold' } }]
    ],
    theme: 'plain',
    styles: { fontSize: 9 },
    columnStyles: {
      1: { halign: 'right' }
    },
    margin: { top: 40, bottom: 25, left: 15, right: 15 }
  });

  // Master Render Pass: Apply consistent corporate header & footer to EVERY page cleanly
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    drawBusinessHeader(doc, 'CUSTOMER T-ACCOUNT (LEDGER)', customerName, date, reportNo, accentColor, settings);
    drawBusinessFooter(doc, reportNo, p, totalPages, barcodeDataUrl);
  }

  if (returnBytes) return new Uint8Array(doc.output('arraybuffer'));
  doc.save(`T-Account_${customerName.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`);
};

export const generateUniversalDocumentPDF = async (
  formData: UniversalDocFormData,
  settings?: CompanySettings,
  autoDownload: boolean = true
): Promise<jsPDF> => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let currentY = 14;

  const companyName = settings?.name || 'INNOVISTA METAL FABRICONIX (PVT) LTD.';
  const divisionName = 'ENGINEERING & STRATEGIC PROCUREMENT DIVISION';
  const addressLine = sanitizePdfText(settings?.address, 'No. 50/B, Vishaka Place, Elapitiwela, Ragama, Sri Lanka | Tel: 077 1684 620');

  // 1. Top Header: Blue First Name ("INNOVISTA"), Top-Right Company Logo ABOVE Blue Document Title in actual width
  const rightEdge = pageWidth - margin;
  const maxLeftWidth = 104;
  const logoDataUrl = getCompanyLogoDataUrl(settings?.logo);

  if (logoDataUrl) {
    drawCompanyLogoAtActualWidth(doc, logoDataUrl, rightEdge, currentY - 6, 10.5, 46);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  const firstWord = 'INNOVISTA';
  doc.setTextColor(29, 78, 216); // Royal Blue (#1d4ed8)
  doc.text(firstWord, margin, currentY + 1.5);
  const firstWordW = doc.getTextWidth(firstWord);
  doc.setTextColor(15, 23, 42); // Dark Slate
  const restName = companyName.toUpperCase().startsWith('INNOVISTA')
    ? companyName.toUpperCase().slice('INNOVISTA'.length) || ' METAL FABRICONIX (PVT) LTD.'
    : ' METAL FABRICONIX (PVT) LTD.';
  doc.text(sanitizePdfText(restName, ' METAL FABRICONIX (PVT) LTD.'), margin + firstWordW, currentY + 1.5);

  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'bold');
  doc.text(fitPdfText(doc, divisionName, maxLeftWidth), margin, currentY + 6.5);

  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text(fitPdfText(doc, addressLine, maxLeftWidth), margin, currentY + 11.5);

  // Right Header (BELOW the top-right logo): Document Title in Royal Blue + Date & Ref
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(29, 78, 216); // Royal Blue (#1d4ed8)
  doc.text(fitPdfText(doc, formData.docTitle.toUpperCase(), 72), rightEdge, currentY + 8.5, { align: 'right' });

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(`Date: ${sanitizePdfText(formData.date)}`, rightEdge, currentY + 12.5, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`Ref: ${sanitizePdfText(formData.docRefNo)} | ${sanitizePdfText(formData.revision)}`, rightEdge, currentY + 16.5, { align: 'right' });

  const bcData = generateBarcodeDataUrl(formData.docRefNo || 'DOC-REF');

  currentY += 20;
  doc.setDrawColor(29, 78, 216);
  doc.setLineWidth(0.6);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 4;

  // 2. Document Title & Control Matrix Block
  doc.setFillColor(248, 250, 252); // slate-50
  doc.roundedRect(margin, currentY, pageWidth - (margin * 2), 24, 1.5, 1.5, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, currentY, pageWidth - (margin * 2), 24, 1.5, 1.5, 'S');

  // Title in Royal Blue
  doc.setTextColor(29, 78, 216);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(fitPdfText(doc, formData.docTitle.toUpperCase(), 110), margin + 4, currentY + 6);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text(`FORM CODE: ${sanitizePdfText(formData.docCode)}  |  DOC #${sanitizePdfText(formData.docNumber)}`, margin + 4, currentY + 10);

  // Badges (Top Right inside box)
  doc.setFillColor(15, 23, 42);
  doc.rect(pageWidth - margin - 58, currentY + 2.5, 34, 5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'bold');
  doc.text(formData.classification.toUpperCase(), pageWidth - margin - 41, currentY + 6, { align: 'center' });

  doc.setFillColor(254, 242, 242);
  doc.setDrawColor(254, 202, 202);
  doc.rect(pageWidth - margin - 22, currentY + 2.5, 18, 5, 'FD');
  doc.setTextColor(153, 27, 27);
  doc.text(formData.revision.toUpperCase(), pageWidth - margin - 13, currentY + 6, { align: 'center' });

  // Divider inside box
  doc.setDrawColor(226, 232, 240);
  doc.line(margin + 4, currentY + 12.5, pageWidth - margin - 4, currentY + 12.5);

  // 4 Meta Columns
  const colW = (pageWidth - (margin * 2) - 8) / 4;
  const metaY = currentY + 16.5;
  const metaItems = [
    { label: 'Document Ref:', val: formData.docRefNo },
    { label: 'Issuance Date:', val: formData.date },
    { label: 'Effective Date:', val: formData.effectiveDate },
    { label: 'Project Code:', val: formData.projectId }
  ];

  metaItems.forEach((m, idx) => {
    const x = margin + 4 + (idx * colW);
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.text(m.label, x, metaY);
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(m.val, x, metaY + 4);
  });

  currentY += 28;

  // 3. Project Context & Vendor Reference Cards
  const cardW = (pageWidth - (margin * 2) - 4) / 2;
  const cardH = 20;

  // Left Card: Project Context
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, currentY, cardW, cardH, 1, 1, 'FD');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.text('PROJECT CONTEXT', margin + 3, currentY + 4.5);
  doc.line(margin + 3, currentY + 6, margin + cardW - 3, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(`Project Name:`, margin + 3, currentY + 10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(formData.projectName, margin + 22, currentY + 10);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Location:`, margin + 3, currentY + 14);
  doc.setTextColor(15, 23, 42);
  doc.text(formData.projectLocation, margin + 22, currentY + 14);

  doc.setTextColor(71, 85, 105);
  doc.text(`Client / Employer:`, margin + 3, currentY + 18);
  doc.setTextColor(15, 23, 42);
  doc.text(formData.clientName, margin + 26, currentY + 18);

  // Right Card: Vendor / Supplier Reference
  doc.roundedRect(margin + cardW + 4, currentY, cardW, cardH, 1, 1, 'FD');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.text('SUPPLIER / VENDOR REFERENCE', margin + cardW + 7, currentY + 4.5);
  doc.line(margin + cardW + 7, currentY + 6, margin + (cardW * 2) + 1, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(`Vendor Name:`, margin + cardW + 7, currentY + 10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(formData.vendorName, margin + cardW + 28, currentY + 10);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Vendor Code:`, margin + cardW + 7, currentY + 14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(formData.vendorCode, margin + cardW + 28, currentY + 14);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Status:`, margin + cardW + 7, currentY + 18);
  doc.setTextColor(21, 128, 61);
  doc.setFont('helvetica', 'bold');
  doc.text('Verified Compliant (ISO 9001)', margin + cardW + 28, currentY + 18);

  currentY += cardH + 5;

  // 4. Structured Table
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`FORMAL SCHEDULE & SPECIFICATION RECORDS (${formData.tableRows.length} Items)`, margin, currentY);
  currentY += 2;

  const tableHead = [['#', ...formData.tableHeaders]];
  const tableBody = formData.tableRows.map((r, i) => [
    (i + 1).toString(),
    r.col1,
    r.col2,
    r.col3,
    r.col4,
    r.col5
  ]);

  autoTable(doc, {
    startY: currentY,
    head: tableHead,
    body: tableBody,
    theme: 'grid',
    styles: {
      fontSize: 7,
      cellPadding: 2,
      lineColor: [203, 213, 225],
      lineWidth: 0.2
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 26, fontStyle: 'bold' }
    },
    margin: { left: margin, right: margin }
  });

  currentY = getFinalY(doc, currentY) + 5;

  // 5. Notes & Directives
  if (formData.notes) {
    if (currentY > pageHeight - 65) { doc.addPage(); currentY = 16; }
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, currentY, pageWidth - (margin * 2), 12, 1, 1, 'FD');
    doc.setFontSize(6.5);
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'bold');
    doc.text('SCOPE NOTES & DIRECTIVES:', margin + 3, currentY + 4);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(51, 65, 85);
    doc.text(formData.notes, margin + 3, currentY + 8, { maxWidth: pageWidth - (margin * 2) - 6 });
    currentY += 15;
  }

  // 6. Signatory Approval Block (3 to 4 Tiers)
  if (currentY > pageHeight - 55) { doc.addPage(); currentY = 16; }
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.6);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 3;

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('EXECUTIVE & TECHNICAL APPROVAL SIGNATORIES', margin, currentY);
  currentY += 2;

  const sigW = (pageWidth - (margin * 2) - 9) / 4;
  const sigH = 22;
  const sigs = [
    { title: 'PREPARED BY', name: formData.preparedBy, role: formData.preparedRole, status: 'VERIFIED SIGNED' },
    { title: 'REVIEWED BY', name: formData.reviewedBy, role: formData.reviewedRole, status: 'TECHNICAL PASS' },
    { title: 'APPROVED BY', name: formData.approvedBy, role: formData.approvedRole, status: 'EXECUTIVE PASS' },
    { title: 'AUTHORIZED ENTITY', name: formData.authorizedBy, role: formData.authorizedRole, status: 'SEALED & WITNESSED' }
  ];

  sigs.forEach((s, idx) => {
    const sx = margin + (idx * (sigW + 3));
    doc.setFillColor(248, 250, 252);
    doc.rect(sx, currentY, sigW, sigH, 'FD');
    doc.setFontSize(5.5);
    doc.setTextColor(148, 163, 184);
    doc.setFont('helvetica', 'bold');
    doc.text(s.title, sx + 2, currentY + 3.5);

    doc.setFontSize(7);
    doc.setTextColor(15, 23, 42);
    doc.text(s.name, sx + 2, currentY + 8, { maxWidth: sigW - 4 });

    doc.setFontSize(5.5);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.text(s.role, sx + 2, currentY + 11.5, { maxWidth: sigW - 4 });

    doc.setDrawColor(203, 213, 225);
    doc.line(sx + 2, currentY + 16, sx + sigW - 2, currentY + 16);

    doc.setFontSize(5.5);
    doc.setTextColor(21, 128, 61);
    doc.setFont('helvetica', 'bold');
    doc.text(s.status, sx + 2, currentY + 19.5);
  });

  // Footer on all pages (Code 128 Barcode only, NO QR)
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    drawBusinessFooter(doc, formData.docRefNo, p, totalPages, bcData);
  }

  if (autoDownload) {
    const filename = `${formData.docCode}_${formData.docRefNo}.pdf`;
    doc.save(filename);
  }

  return doc;
};
