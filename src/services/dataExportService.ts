import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveAs } from 'file-saver';
import { generateBarcodeDataUrl } from '../pdfGenerator';
import { 
  ItemTemplate, ProductVariant, 
  Quote, Project, Invoice, Client, AuditLog, QuoteStatus 
} from '../types';

// ==========================================
// CORE CSV UTILITY
// ==========================================

/**
 * Escapes and serializes a cell for RFC-4180 CSV compliance.
 */
const escapeCSVCell = (val: string | number | boolean | null | undefined): string => {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

/**
 * Creates and triggers a download of a CSV file with UTF-8 BOM for Excel compatibility.
 */
export const downloadCSV = (filename: string, headers: string[], rows: (string | number | boolean | null | undefined)[][]) => {
  const headerLine = headers.map(escapeCSVCell).join(',');
  const rowLines = rows.map(r => r.map(escapeCSVCell).join(','));
  const csvContent = '\uFEFF' + [headerLine, ...rowLines].join('\r\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, filename.endsWith('.csv') ? filename : `${filename}.csv`);
};

// ==========================================
// CORE PDF UTILITY
// ==========================================

export interface PDFReportConfig {
  title: string;
  subtitle?: string;
  orientation?: 'portrait' | 'landscape';
  headers: string[];
  rows: (string | number | boolean | null | undefined)[][];
  summaryMetrics?: { label: string; value: string }[];
  columnStyles?: Record<number, any>;
  filename: string;
}

export const generateStandardPDFReport = (config: PDFReportConfig) => {
  const doc = new jsPDF({
    orientation: config.orientation || 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // --- Header Banner ---
  doc.setFillColor(248, 250, 252);
  doc.rect(0, 0, pageWidth, 28, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.line(0, 28, pageWidth, 28);

  // Brand Name & Accent
  doc.setFillColor(249, 115, 22); // Orange brand
  doc.rect(14, 8, 3.5, 12, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text(config.title, 21, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(config.subtitle || 'Innovista Precision Fabrication & Commercial Suite', 21, 19);

  // Metadata block (Date & System timestamp)
  const dateStr = new Date().toLocaleDateString('en-GB', { 
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
  });
  doc.setFontSize(7.5);
  doc.text(`Generated: ${dateStr}`, pageWidth - 14, 14, { align: 'right' });
  doc.text(`Total Records: ${config.rows.length}`, pageWidth - 14, 19, { align: 'right' });

  let startY = 33;

  // --- Summary Metrics Cards if provided ---
  if (config.summaryMetrics && config.summaryMetrics.length > 0) {
    const cardGap = 3;
    const totalCards = config.summaryMetrics.length;
    const availableWidth = pageWidth - 28;
    const cardWidth = (availableWidth - (cardGap * (totalCards - 1))) / totalCards;
    const cardHeight = 13;

    config.summaryMetrics.forEach((metric, index) => {
      const x = 14 + index * (cardWidth + cardGap);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(x, startY, cardWidth, cardHeight, 1.5, 1.5, 'FD');
      doc.setDrawColor(226, 232, 240);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(metric.label.toUpperCase(), x + 3, startY + 4.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(metric.value, x + 3, startY + 10.5);
    });

    startY += 17;
  }

  // --- Data Table via AutoTable ---
  autoTable(doc, {
    startY,
    head: [config.headers],
    body: config.rows.map(r => r.map(c => (c === null || c === undefined ? '' : String(c)))),
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59], // Slate 800
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      cellPadding: 2.5,
      halign: 'left'
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252] // Slate 50
    },
    styles: {
      fontSize: 7,
      cellPadding: 2,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.1
    },
    columnStyles: config.columnStyles || {},
    margin: { left: 14, right: 14, bottom: 24 }
  });

  // Master Render Pass: Apply consistent corporate footer with Code 128 Barcode to EVERY page
  const totalPages = doc.getNumberOfPages();
  const reportCode = `REP-${new Date().getTime().toString().slice(-6)}`;
  const barcodeDataUrl = generateBarcodeDataUrl(reportCode);

  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    
    // Subtle separator line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(14, pageHeight - 20, pageWidth - 14, pageHeight - 20);

    // Left: ISO Certification Stamp
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text('ISO 9001:2015 & ISO 14001:2015 Output', 14, pageHeight - 10);

    // Center: Code 128 Barcode
    if (barcodeDataUrl) {
      try {
        const bcWidth = 40;
        const bcHeight = 7;
        const bcX = (pageWidth / 2) - (bcWidth / 2);
        doc.addImage(barcodeDataUrl, 'PNG', bcX, pageHeight - 19, bcWidth, bcHeight);
      } catch (e) {
        console.error('Error drawing barcode in export PDF:', e);
      }
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(30, 41, 59);
    doc.text(reportCode, pageWidth / 2, pageHeight - 10, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text('this generate from innovista fabriconix system', pageWidth / 2, pageHeight - 6.5, { align: 'center' });

    // Right: Page number
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Page ${p} of ${totalPages}`, pageWidth - 14, pageHeight - 10, { align: 'right' });
  }

  // Save to disk
  doc.save(config.filename.endsWith('.pdf') ? config.filename : `${config.filename}.pdf`);
};

/**
 * High-level generic table exporter used across multiple enterprise portals.
 * Supports both:
 * 1) downloadPDFTable(title, headers, rows, filename, subtitle)
 * 2) downloadPDFTable(filename, title, headers, rows, options)
 */
export function downloadPDFTable(
  title: string,
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][],
  filename?: string,
  subtitle?: string
): void;
export function downloadPDFTable(
  filename: string,
  title: string,
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][],
  options?: {
    subtitle?: string;
    orientation?: 'portrait' | 'landscape';
    summaryMetrics?: { label: string; value: string }[];
    columnStyles?: Record<number, any>;
  }
): void;
export function downloadPDFTable(
  arg1: string,
  arg2: any,
  arg3?: any,
  arg4?: any,
  arg5?: any
): void {
  if (Array.isArray(arg2)) {
    // Form 1: (title, headers, rows, filename?, subtitle?)
    const title = arg1;
    const headers = arg2 as string[];
    const rows = (arg3 as (string | number | boolean | null | undefined)[][]) || [];
    const filename = typeof arg4 === 'string' && arg4 ? arg4 : `${title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}.pdf`;
    const subtitle = typeof arg5 === 'string' ? arg5 : undefined;

    generateStandardPDFReport({
      title,
      subtitle,
      orientation: 'portrait',
      headers,
      rows,
      filename
    });
  } else {
    // Form 2: (filename, title, headers, rows, options?)
    const filename = arg1;
    const title = arg2 as string;
    const headers = arg3 as string[];
    const rows = (arg4 as (string | number | boolean | null | undefined)[][]) || [];
    const options = typeof arg5 === 'object' ? arg5 : undefined;

    generateStandardPDFReport({
      title,
      subtitle: options?.subtitle,
      orientation: options?.orientation || 'portrait',
      headers,
      rows,
      summaryMetrics: options?.summaryMetrics,
      columnStyles: options?.columnStyles,
      filename
    });
  }
}

// ==========================================
// 1. BOQ / CATALOG ITEMS EXPORTERS
// ==========================================

export const exportBOQItemsCSV = (items: ItemTemplate[]) => {
  const headers = [
    'Item Code', 'Item Name', 'Category', 'Sub-Category', 'Unit', 
    'Selling Rate (LKR)', 'Supplier Cost (LKR)', 'Gross Profit (LKR)', 
    'Margin (%)', 'Description / Spec', 'Status'
  ];

  const rows = items.map(i => {
    const cost = i.lastSupplierPrice || Math.round(i.rate * 0.72);
    const profit = i.rate - cost;
    const margin = i.rate > 0 ? ((profit / i.rate) * 100).toFixed(1) : '0';
    return [
      i.productCode || i.id,
      i.name,
      i.category,
      i.subCategory || '',
      i.unit,
      i.rate,
      cost,
      profit,
      `${margin}%`,
      i.description || '',
      i.status || 'Active'
    ];
  });

  downloadCSV(`BOQ_Items_Catalog_${new Date().toISOString().split('T')[0]}`, headers, rows);
};

export const exportBOQItemsPDF = (items: ItemTemplate[]) => {
  const totalValuation = items.reduce((acc, i) => acc + (i.rate || 0), 0);
  const avgRate = items.length > 0 ? Math.round(totalValuation / items.length) : 0;

  generateStandardPDFReport({
    title: 'BOQ Item Master Library & Price Register',
    subtitle: 'Comprehensive catalog of architectural and structural bill of quantities components',
    orientation: 'landscape',
    filename: `BOQ_Items_Register_${new Date().toISOString().split('T')[0]}`,
    headers: ['Code', 'Item Name', 'Category', 'Unit', 'Rate (LKR)', 'Cost (LKR)', 'Margin', 'Status'],
    rows: items.map(i => {
      const cost = i.lastSupplierPrice || Math.round(i.rate * 0.72);
      const margin = i.rate > 0 ? (((i.rate - cost) / i.rate) * 100).toFixed(1) + '%' : '0%';
      return [
        i.productCode || i.id.slice(0, 8),
        i.name,
        i.category,
        i.unit,
        i.rate.toLocaleString(),
        cost.toLocaleString(),
        margin,
        i.status || 'Active'
      ];
    }),
    summaryMetrics: [
      { label: 'Catalog Items', value: items.length.toString() },
      { label: 'Average Selling Rate', value: `LKR ${avgRate.toLocaleString()}` },
      { label: 'Active Items', value: items.filter(i => i.status !== 'Discontinued').length.toString() }
    ],
    columnStyles: {
      0: { cellWidth: 28 },
      1: { cellWidth: 80 },
      2: { cellWidth: 40 },
      3: { cellWidth: 16, halign: 'center' },
      4: { cellWidth: 28, halign: 'right' },
      5: { cellWidth: 28, halign: 'right' },
      6: { cellWidth: 20, halign: 'center' },
      7: { cellWidth: 22, halign: 'center' }
    }
  });
};

// ==========================================
// 2. PRODUCT VARIANTS EXPORTERS
// ==========================================

export const exportVariantsCSV = (variants: ProductVariant[], itemTemplates: ItemTemplate[] = []) => {
  const headers = [
    'Variant Code', 'Variant Name', 'Parent Product', 'Category', 'Unit',
    'Selling Price (LKR)', 'Material Cost (LKR)', 'Labour Cost (LKR)', 
    'Total Cost (LKR)', 'Gross Margin (%)', 'BOM Components', 'Technical Status', 'Commercial Status'
  ];

  const rows = variants.map(v => {
    const parentId = v.itemId || (v as any).parentItemId;
    const parent = itemTemplates.find(t => t.id === parentId);
    const bom = v.bom;
    const materialCost = bom?.directMaterialCost || 0;
    const labourCost = bom?.directLabourCost || 0;
    const totalCost = bom?.totalCost || v.pricing?.costPrice || (v as any).baseCost || 0;
    const sellingPrice = v.pricing?.sellingPrice || (v as any).sellingPrice || 0;
    const margin = sellingPrice > 0 ? (((sellingPrice - totalCost) / sellingPrice) * 100).toFixed(1) : '0';

    return [
      v.variantCode,
      v.variantName,
      parent?.name || v.itemName || parentId || '',
      v.categoryName || v.categoryId || parent?.category || '',
      v.unit || 'sq.ft',
      sellingPrice,
      materialCost,
      labourCost,
      totalCost,
      `${margin}%`,
      bom?.components?.length || 0,
      v.technicalStatus || 'VERIFIED',
      v.status
    ];
  });

  downloadCSV(`Product_Variants_Register_${new Date().toISOString().split('T')[0]}`, headers, rows);
};

export const exportVariantsPDF = (variants: ProductVariant[], itemTemplates: ItemTemplate[] = []) => {
  const avgMargin = variants.length > 0
    ? (variants.reduce((acc, v) => {
        const cost = v.bom?.totalCost || v.pricing?.costPrice || (v as any).baseCost || 0;
        const sellingPrice = v.pricing?.sellingPrice || (v as any).sellingPrice || 0;
        return acc + (sellingPrice > 0 ? ((sellingPrice - cost) / sellingPrice) * 100 : 0);
      }, 0) / variants.length).toFixed(1)
    : '0';

  generateStandardPDFReport({
    title: 'Product Variant Master & BOM Engineering Ledger',
    subtitle: 'Dimensional variants, bill of materials components, cost roll-ups, and commercial approvals',
    orientation: 'landscape',
    filename: `Product_Variants_Master_${new Date().toISOString().split('T')[0]}`,
    headers: ['Code', 'Variant Name', 'Category', 'Unit', 'Price (LKR)', 'Cost (LKR)', 'Margin', 'BOM Count', 'Status'],
    rows: variants.map(v => {
      const parentId = v.itemId || (v as any).parentItemId;
      const parent = itemTemplates.find(t => t.id === parentId);
      const totalCost = v.bom?.totalCost || v.pricing?.costPrice || (v as any).baseCost || 0;
      const sellingPrice = v.pricing?.sellingPrice || (v as any).sellingPrice || 0;
      const margin = sellingPrice > 0 ? (((sellingPrice - totalCost) / sellingPrice) * 100).toFixed(1) + '%' : '0%';
      return [
        v.variantCode,
        v.variantName,
        v.categoryName || v.categoryId || parent?.category || 'General',
        v.unit || 'sq.ft',
        sellingPrice.toLocaleString(),
        totalCost.toLocaleString(),
        margin,
        (v.bom?.components?.length || 0).toString(),
        v.status
      ];
    }),
    summaryMetrics: [
      { label: 'Configured Variants', value: variants.length.toString() },
      { label: 'Average Variant Margin', value: `${avgMargin}%` },
      { label: 'Active Live Variants', value: variants.filter(v => v.status === 'ACTIVE' || (v.status as string) === 'Active').length.toString() }
    ],
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 70 },
      2: { cellWidth: 35 },
      3: { cellWidth: 16, halign: 'center' },
      4: { cellWidth: 28, halign: 'right' },
      5: { cellWidth: 28, halign: 'right' },
      6: { cellWidth: 20, halign: 'center' },
      7: { cellWidth: 20, halign: 'center' },
      8: { cellWidth: 22, halign: 'center' }
    }
  });
};

// ==========================================
// 3. SPECIFICATIONS EXPORTERS
// ==========================================

export const exportSpecificationsCSV = (items: ItemTemplate[]) => {
  const headers = [
    'Item Code', 'Item Name', 'Category', 'System / Profile', 
    'Aluminium Finish', 'Glass Specification', 'Warranty Period'
  ];

  const rows = items.map(i => {
    const ts = (i as any).technicalSpecification || (i as any).technicalSpec;
    const aluminium = ts?.surfaceFinish ? `${ts.profileSystem || ''} ${ts.surfaceFinish}` : '';
    const glass = ts?.glazingType ? `${ts.glassThickness || ''} ${ts.glazingType}` : '';

    return [
      i.productCode || i.id,
      i.name,
      i.category,
      ts?.profileSystem || ts?.core?.systemType || '',
      aluminium,
      glass,
      ts?.warrantyProduct || ts?.warranty?.period || '10 Years'
    ];
  });

  downloadCSV(`Tender_Specifications_Register_${new Date().toISOString().split('T')[0]}`, headers, rows);
};

export const exportSpecificationsPDF = (items: ItemTemplate[], activeSpecItem?: ItemTemplate | null, activeSpecClause?: string) => {
  if (activeSpecItem && activeSpecClause) {
    // Single item full technical specification sheet
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Header
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 0, pageWidth, 28, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.line(0, 28, pageWidth, 28);

    doc.setFillColor(249, 115, 22);
    doc.rect(14, 8, 3.5, 12, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text('Architectural Tender Specification Sheet', 21, 14);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`${activeSpecItem.name} (${activeSpecItem.productCode || 'GEN-01'})`, 21, 19);

    // Specification Clause Content
    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);

    const splitText = doc.splitTextToSize(activeSpecClause, pageWidth - 28);
    doc.text(splitText, 14, 38);

    // Footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text('Innovista Architectural Specifications • ISO 9001 / SLS Certified Compliance', 14, pageHeight - 6);

    doc.save(`Spec_Clause_${(activeSpecItem.productCode || 'ITEM').replace(/\s+/g, '_')}.pdf`);
    return;
  }

  // Multi-item specifications ledger
  generateStandardPDFReport({
    title: 'BOQ Specification & Standards Register',
    subtitle: 'Contractual clauses, profile finishes, and quality compliance criteria',
    orientation: 'landscape',
    filename: `BOQ_Specifications_Register_${new Date().toISOString().split('T')[0]}`,
    headers: ['Code', 'Item Name', 'Category', 'System Type', 'Alloy Grade', 'Warranty'],
    rows: items.map(i => {
      const ts = (i as any).technicalSpecification || (i as any).technicalSpec;
      return [
        i.productCode || i.id.slice(0, 8),
        i.name,
        i.category,
        ts?.profileSystem || ts?.core?.systemType || 'Standard System',
        ts?.aluminiumGrade || '6063-T5',
        ts?.warrantyProduct || ts?.warranty?.period || '10 Years Standard'
      ];
    }),
    columnStyles: {
      0: { cellWidth: 28 },
      1: { cellWidth: 80 },
      2: { cellWidth: 40 },
      3: { cellWidth: 45 },
      4: { cellWidth: 40 },
      5: { cellWidth: 35 }
    }
  });
};

// ==========================================
// 4. RATE HISTORY & PRICE ANALYTICS EXPORTERS
// ==========================================

export const exportRateHistoryCSV = (items: ItemTemplate[]) => {
  const headers = [
    'Item Code', 'Item Name', 'Category', 'Record Type', 'Date', 
    'Rate / Price (LKR)', 'Supplier Cost / Competitor', 'Gross Margin (%)', 'Notes'
  ];

  const rows: (string | number | boolean | null | undefined)[][] = [];

  items.forEach(i => {
    // Internal rate records
    (i.rateHistory || []).forEach(r => {
      rows.push([
        i.productCode || i.id,
        i.name,
        i.category,
        'Internal Rate',
        r.date,
        r.rate,
        r.supplierCost || '',
        r.marginPercent ? `${r.marginPercent}%` : '',
        r.reason || ''
      ]);
    });

    // Competitor records
    (i.competitivePrices || []).forEach(c => {
      rows.push([
        i.productCode || i.id,
        i.name,
        i.category,
        'Competitor Benchmark',
        c.date,
        c.price,
        c.competitorName,
        '',
        `Parity: ${c.parity || (c as any).specificationParity || 'Standard'}`
      ]);
    });
  });

  downloadCSV(`Rate_History_Intelligence_${new Date().toISOString().split('T')[0]}`, headers, rows);
};

export const exportRateHistoryPDF = (items: ItemTemplate[]) => {
  const rows: (string | number | boolean | null | undefined)[][] = [];

  items.forEach(i => {
    (i.rateHistory || []).forEach(r => {
      rows.push([
        i.productCode || i.id.slice(0, 8),
        i.name,
        'Rate Update',
        r.date,
        r.rate.toLocaleString(),
        (r.supplierCost || 0).toLocaleString(),
        r.marginPercent ? `${r.marginPercent}%` : '-',
        r.reason || 'Routine update'
      ]);
    });
  });

  generateStandardPDFReport({
    title: 'Selling Rate History & Cost Audit Ledger',
    subtitle: 'Historical chronological revisions of internal selling rates and supplier base costs',
    orientation: 'landscape',
    filename: `Rate_History_Ledger_${new Date().toISOString().split('T')[0]}`,
    headers: ['Code', 'Item Name', 'Revision Type', 'Date', 'Rate (LKR)', 'Cost (LKR)', 'Margin', 'Reason / Tender Ref'],
    rows,
    summaryMetrics: [
      { label: 'Recorded Rate Audit Entries', value: rows.length.toString() },
      { label: 'Monitored BOQ Items', value: items.filter(i => (i.rateHistory || []).length > 0).length.toString() }
    ],
    columnStyles: {
      0: { cellWidth: 26 },
      1: { cellWidth: 70 },
      2: { cellWidth: 26 },
      3: { cellWidth: 24, halign: 'center' },
      4: { cellWidth: 28, halign: 'right' },
      5: { cellWidth: 28, halign: 'right' },
      6: { cellWidth: 18, halign: 'center' },
      7: { cellWidth: 48 }
    }
  });
};

export const exportPriceAnalyticsCSV = (items: ItemTemplate[]) => {
  const headers = [
    'Item Code', 'Item Name', 'Category', 'Internal Rate (LKR)', 
    'Competitor Avg (LKR)', 'Competitor Min (LKR)', 'Competitor Max (LKR)', 
    'Variance (%)', 'Advantage Status', 'Quotes Count'
  ];

  const rows: (string | number | boolean | null | undefined)[][] = [];

  items.forEach(item => {
    if (item.competitivePrices && item.competitivePrices.length > 0) {
      const prices = item.competitivePrices.map(p => p.price);
      const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      const variancePct = Math.round(((avg - item.rate) / item.rate) * 1000) / 10;

      rows.push([
        item.productCode || item.id,
        item.name,
        item.category,
        item.rate,
        avg,
        min,
        max,
        `${variancePct}%`,
        variancePct > 0 ? 'Competitive Edge' : 'Premium / Review Required',
        prices.length
      ]);
    }
  });

  downloadCSV(`Competitor_Price_Analytics_${new Date().toISOString().split('T')[0]}`, headers, rows);
};

export const exportPriceAnalyticsPDF = (items: ItemTemplate[]) => {
  const trackedItems: any[] = [];
  items.forEach(item => {
    if (item.competitivePrices && item.competitivePrices.length > 0) {
      const prices = item.competitivePrices.map(p => p.price);
      const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      const variancePct = Math.round(((avg - item.rate) / item.rate) * 1000) / 10;
      trackedItems.push({ item, avg, min, max, variancePct, count: prices.length });
    }
  });

  const advantageCount = trackedItems.filter(t => t.variancePct > 0).length;

  generateStandardPDFReport({
    title: 'Market Price Intelligence & Competitor Matrix',
    subtitle: 'Benchmarking internal rates against external market contractor quotes and bids',
    orientation: 'landscape',
    filename: `Competitor_Price_Analytics_${new Date().toISOString().split('T')[0]}`,
    headers: ['Code', 'Item Name', 'Category', 'Our Rate (LKR)', 'Comp. Avg (LKR)', 'Price Variance', 'Market Positioning', 'Quotes'],
    rows: trackedItems.map(t => [
      t.item.productCode || t.item.id.slice(0, 8),
      t.item.name,
      t.item.category,
      t.item.rate.toLocaleString(),
      t.avg.toLocaleString(),
      `${t.variancePct > 0 ? '+' : ''}${t.variancePct}%`,
      t.variancePct > 0 ? 'Competitive Edge' : 'Premium',
      t.count.toString()
    ]),
    summaryMetrics: [
      { label: 'Benchmarked Items', value: trackedItems.length.toString() },
      { label: 'Advantage Win Rate', value: trackedItems.length > 0 ? `${Math.round((advantageCount / trackedItems.length) * 100)}%` : '100%' },
      { label: 'Total Market Quotes', value: trackedItems.reduce((a, b) => a + b.count, 0).toString() }
    ],
    columnStyles: {
      0: { cellWidth: 26 },
      1: { cellWidth: 70 },
      2: { cellWidth: 35 },
      3: { cellWidth: 28, halign: 'right' },
      4: { cellWidth: 28, halign: 'right' },
      5: { cellWidth: 24, halign: 'center' },
      6: { cellWidth: 34, halign: 'center' },
      7: { cellWidth: 16, halign: 'center' }
    }
  });
};

// ==========================================
// 5. QUOTATIONS REGISTER EXPORTERS
// ==========================================

export const exportQuotesCSV = (quotes: Quote[]) => {
  const headers = [
    'Quote Number', 'Project / Title', 'Client Name', 'Status', 'Date', 
    'Validity (Days)', 'Items Count', 'Subtotal (LKR)', 'Tax (LKR)', 'Total (LKR)'
  ];

  const rows = quotes.map(q => {
    const items = q.items || [];
    const subtotal = items.reduce((acc: number, i: any) => acc + (i.amount || (i.qty * i.rate) || 0), 0);
    const tax = q.taxPercent ? (subtotal * (q.taxPercent / 100)) : 0;
    const total = q.grandTotal || (subtotal + tax);

    return [
      q.quoteNo || q.id,
      q.projectName || 'Untitled Quotation',
      q.client?.name || 'General Client',
      q.status || 'Draft',
      q.submittedDate || '',
      q.validityDays || 30,
      items.length,
      Math.round(subtotal),
      Math.round(tax),
      Math.round(total)
    ];
  });

  downloadCSV(`Quotations_Register_${new Date().toISOString().split('T')[0]}`, headers, rows);
};

export const exportQuotesPDF = (quotes: Quote[]) => {
  const totalValuation = quotes.reduce((acc, q) => {
    const items = q.items || [];
    const subtotal = items.reduce((sa: number, i: any) => sa + (i.amount || (i.qty * i.rate) || 0), 0);
    return acc + (q.grandTotal || subtotal);
  }, 0);

  generateStandardPDFReport({
    title: 'Quotation Pipeline & Proposal Register',
    subtitle: 'Commercial quotation register, customer pipeline, and contractual status overview',
    orientation: 'landscape',
    filename: `Quotations_Pipeline_${new Date().toISOString().split('T')[0]}`,
    headers: ['Quote #', 'Title', 'Client', 'Date', 'Items', 'Valuation (LKR)', 'Status'],
    rows: quotes.map(q => {
      const items = q.items || [];
      const subtotal = items.reduce((sa: number, i: any) => sa + (i.amount || (i.qty * i.rate) || 0), 0);
      const total = q.grandTotal || subtotal;
      return [
        q.quoteNo || q.id.slice(0, 8),
        q.projectName || 'Quotation',
        q.client?.name || 'Valued Client',
        q.submittedDate || '-',
        items.length.toString(),
        Math.round(total).toLocaleString(),
        q.status || 'Draft'
      ];
    }),
    summaryMetrics: [
      { label: 'Total Proposals', value: quotes.length.toString() },
      { label: 'Pipeline Gross Valuation', value: `LKR ${Math.round(totalValuation).toLocaleString()}` },
      { label: 'Won / Active Quotes', value: quotes.filter(q => q.status === QuoteStatus.WON || (q.status as string) === 'Won' || (q.status as string) === 'Project').length.toString() }
    ],
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 70 },
      2: { cellWidth: 50 },
      3: { cellWidth: 25, halign: 'center' },
      4: { cellWidth: 18, halign: 'center' },
      5: { cellWidth: 35, halign: 'right' },
      6: { cellWidth: 26, halign: 'center' }
    }
  });
};

// ==========================================
// 6. PROJECTS & VARIATIONS EXPORTERS
// ==========================================

export const exportProjectsCSV = (projects: Project[]) => {
  const headers = [
    'Project ID', 'Project Name', 'Client', 'Status', 'Start Date',
    'Original Contract Sum (LKR)', 'Total Contract Sum (LKR)', 'Items Count'
  ];

  const rows = projects.map(p => {
    const original = p.originalSum || p.totalValue || 0;
    const total = p.totalValue || original;

    return [
      p.id,
      p.projectName,
      p.client?.name || 'Client',
      p.status,
      p.startDate || '',
      original,
      total,
      (p.items || []).length
    ];
  });

  downloadCSV(`Projects_Portfolio_Register_${new Date().toISOString().split('T')[0]}`, headers, rows);
};

export const exportProjectsPDF = (projects: Project[]) => {
  const totalRevised = projects.reduce((acc, p) => {
    return acc + (p.totalValue || p.originalSum || 0);
  }, 0);

  generateStandardPDFReport({
    title: 'Project Portfolio & Contract Financial Report',
    subtitle: 'Executive overview of active sites, original contract commitments, and net variation impact',
    orientation: 'landscape',
    filename: `Projects_Portfolio_Report_${new Date().toISOString().split('T')[0]}`,
    headers: ['Project Name', 'Client', 'Original Sum (LKR)', 'Revised Sum (LKR)', 'Items Count', 'Status'],
    rows: projects.map(p => {
      const original = p.originalSum || p.totalValue || 0;
      const total = p.totalValue || original;

      return [
        p.projectName,
        p.client?.name || 'Client',
        original.toLocaleString(),
        total.toLocaleString(),
        (p.items || []).length.toString(),
        p.status
      ];
    }),
    summaryMetrics: [
      { label: 'Active Projects', value: projects.length.toString() },
      { label: 'Total Revised Portfolio Sum', value: `LKR ${totalRevised.toLocaleString()}` },
      { label: 'Sites In Progress', value: projects.filter(p => p.status === 'In Progress').length.toString() }
    ],
    columnStyles: {
      0: { cellWidth: 55 },
      1: { cellWidth: 45 },
      2: { cellWidth: 35, halign: 'right' },
      3: { cellWidth: 35, halign: 'right' },
      4: { cellWidth: 20, halign: 'center' },
      5: { cellWidth: 30, halign: 'center' }
    }
  });
};

// ==========================================
// 7. INVOICES & RECEIVABLES EXPORTERS
// ==========================================

export const exportInvoicesCSV = (invoices: Invoice[]) => {
  const headers = [
    'Invoice Number', 'Project / Quote Ref', 'Customer Name', 'Issue Date', 
    'Due Date', 'Type', 'Status', 'Total (LKR)', 'Paid (LKR)', 'Balance Due (LKR)'
  ];

  const rows = invoices.map(inv => {
    const total = inv.grandTotal || (inv as any).totalAmount || 0;
    const paid = inv.amountPaid || (inv as any).paidAmount || 0;
    const bal = inv.balanceDue !== undefined ? inv.balanceDue : (total - paid);

    return [
      inv.invoiceNo || (inv as any).invoiceNumber || inv.id,
      inv.projectName || inv.quoteId || (inv as any).quoteNumber || '',
      inv.client?.name || (inv as any).customerName || 'Client',
      inv.date || (inv as any).issueDate || '',
      inv.dueDate || '',
      inv.type || 'Standard',
      inv.status,
      total,
      paid,
      bal
    ];
  });

  downloadCSV(`Invoices_Receivable_Ledger_${new Date().toISOString().split('T')[0]}`, headers, rows);
};

export const exportInvoicesPDF = (invoices: Invoice[]) => {
  const totalBilled = invoices.reduce((a, b) => a + (b.grandTotal || (b as any).totalAmount || 0), 0);
  const totalOutstanding = invoices.reduce((a, b) => {
    const total = b.grandTotal || (b as any).totalAmount || 0;
    const paid = b.amountPaid || (b as any).paidAmount || 0;
    const bal = b.balanceDue !== undefined ? b.balanceDue : (total - paid);
    return a + bal;
  }, 0);

  generateStandardPDFReport({
    title: 'Commercial Billing & Accounts Receivable Ledger',
    subtitle: 'Progress claims, milestone tax invoices, settlements, and aging balances',
    orientation: 'landscape',
    filename: `Billing_Receivables_Ledger_${new Date().toISOString().split('T')[0]}`,
    headers: ['Invoice #', 'Customer', 'Project Ref', 'Date', 'Due Date', 'Total (LKR)', 'Paid (LKR)', 'Balance (LKR)', 'Status'],
    rows: invoices.map(inv => {
      const total = inv.grandTotal || (inv as any).totalAmount || 0;
      const paid = inv.amountPaid || (inv as any).paidAmount || 0;
      const bal = inv.balanceDue !== undefined ? inv.balanceDue : (total - paid);
      return [
        inv.invoiceNo || (inv as any).invoiceNumber || inv.id,
        inv.client?.name || (inv as any).customerName || 'Client',
        inv.projectName || '-',
        inv.date || (inv as any).issueDate || '-',
        inv.dueDate || '-',
        total.toLocaleString(),
        paid.toLocaleString(),
        bal.toLocaleString(),
        inv.status
      ];
    }),
    summaryMetrics: [
      { label: 'Total Invoices', value: invoices.length.toString() },
      { label: 'Total Billed Amount', value: `LKR ${totalBilled.toLocaleString()}` },
      { label: 'Unsettled Receivables', value: `LKR ${totalOutstanding.toLocaleString()}` }
    ],
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 50 },
      2: { cellWidth: 38 },
      3: { cellWidth: 22, halign: 'center' },
      4: { cellWidth: 22, halign: 'center' },
      5: { cellWidth: 28, halign: 'right' },
      6: { cellWidth: 24, halign: 'right' },
      7: { cellWidth: 28, halign: 'right' },
      8: { cellWidth: 22, halign: 'center' }
    }
  });
};

// ==========================================
// 8. CLIENT CRM DIRECTORY EXPORTERS
// ==========================================

export const exportClientsCSV = (clients: Client[]) => {
  const headers = [
    'Client Code', 'Client / Company Name', 'Category', 'Phone', 'Email', 
    'Address', 'Credit Limit (LKR)', 'Payment Terms', 'Status', 'Account Manager'
  ];

  const rows = clients.map(c => [
    c.cvcCode || c.id,
    c.name,
    c.category || 'General',
    c.phone,
    c.email || '',
    c.address,
    c.creditLimit || 0,
    c.paymentTerms || '30 Days Net',
    c.status || 'Active',
    c.accountManager || ''
  ]);

  downloadCSV(`Client_Directory_Register_${new Date().toISOString().split('T')[0]}`, headers, rows);
};

export const exportClientsPDF = (clients: Client[]) => {
  generateStandardPDFReport({
    title: 'Client Directory & Commercial Account Register',
    subtitle: 'Verified client directory, commercial terms, credit facilities, and relationship managers',
    orientation: 'landscape',
    filename: `Client_Directory_Master_${new Date().toISOString().split('T')[0]}`,
    headers: ['Code', 'Company / Client Name', 'Category', 'Contact Phone', 'Email', 'Credit Limit (LKR)', 'Terms', 'Status'],
    rows: clients.map(c => [
      c.cvcCode || c.id.slice(0, 8),
      c.name,
      c.category || 'Standard',
      c.phone,
      c.email || '-',
      (c.creditLimit || 0).toLocaleString(),
      c.paymentTerms || '30 Days Net',
      c.status || 'Active'
    ]),
    summaryMetrics: [
      { label: 'Registered Clients', value: clients.length.toString() },
      { label: 'Active Corporate Clients', value: clients.filter(c => c.status === 'Active').length.toString() }
    ],
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 65 },
      2: { cellWidth: 30 },
      3: { cellWidth: 32 },
      4: { cellWidth: 45 },
      5: { cellWidth: 28, halign: 'right' },
      6: { cellWidth: 25, halign: 'center' },
      7: { cellWidth: 20, halign: 'center' }
    }
  });
};

// ==========================================
// 9. AUDIT LOG EXPORTERS
// ==========================================

export const exportAuditLogsCSV = (logs: (AuditLog & { projectName?: string })[]) => {
  const headers = [
    'Timestamp', 'Project / Entity', 'Action', 'User', 'Description'
  ];

  const rows = logs.map(l => [
    l.timestamp,
    l.projectName || (l as any).entityId || 'Global System',
    l.action,
    l.user,
    l.details || ''
  ]);

  downloadCSV(`Global_Audit_Trail_${new Date().toISOString().split('T')[0]}`, headers, rows);
};

export const exportAuditLogsPDF = (logs: (AuditLog & { projectName?: string })[]) => {
  generateStandardPDFReport({
    title: 'Global System Security & Operational Audit Log',
    subtitle: 'Immutable record of user transactions, project revisions, and financial adjustments',
    orientation: 'portrait',
    filename: `Audit_Trail_Report_${new Date().toISOString().split('T')[0]}`,
    headers: ['Timestamp', 'Action', 'User', 'Project / Details'],
    rows: logs.map(l => [
      l.timestamp,
      l.action,
      l.user,
      `${l.projectName ? `[${l.projectName}] ` : ''}${l.details || ''}`
    ]),
    summaryMetrics: [
      { label: 'Total Audited Events', value: logs.length.toString() }
    ],
    columnStyles: {
      0: { cellWidth: 38 },
      1: { cellWidth: 35 },
      2: { cellWidth: 28 },
      3: { cellWidth: 80 }
    }
  });
};

// ==========================================
// 10. OPERATIONS PORTALS EXPORTERS
// ==========================================

export const exportQualityControlCSV = (snags: any[] = []) => {
  const headers = ['Snag Ref', 'Project', 'Title / Location', 'Severity', 'Assigned Trade', 'Status', 'Due Date'];
  const rows = snags.map(s => [
    s.id || s.code,
    s.projectName || 'Site',
    s.title || s.description,
    s.severity || 'Medium',
    s.assignedTo || 'Glazing Team',
    s.status || 'Open',
    s.dueDate || ''
  ]);
  downloadCSV(`QC_Snags_Register_${new Date().toISOString().split('T')[0]}`, headers, rows);
};

export const exportResourceAllocationCSV = (resources: any[] = []) => {
  const headers = ['Staff Code', 'Name', 'Trade Role', 'Assigned Site', 'Hourly Rate (LKR)', 'Status'];
  const rows = resources.map(r => [
    r.code || r.id,
    r.name,
    r.role || 'Installer',
    r.site || 'Factory',
    r.rate || 0,
    r.status || 'Active'
  ]);
  downloadCSV(`Resource_Allocation_Register_${new Date().toISOString().split('T')[0]}`, headers, rows);
};

export const exportWarrantyCSV = (warranties: any[] = []) => {
  const headers = ['Cert Number', 'Client', 'Project', 'Coverage Type', 'Issue Date', 'Expiry Date', 'Status'];
  const rows = warranties.map(w => [
    w.certificateNumber || w.id,
    w.customerName || w.clientName,
    w.projectName,
    w.type || 'Architectural Aluminium',
    w.issueDate,
    w.expiryDate,
    w.status || 'Active'
  ]);
  downloadCSV(`Warranty_Certificates_Register_${new Date().toISOString().split('T')[0]}`, headers, rows);
};
