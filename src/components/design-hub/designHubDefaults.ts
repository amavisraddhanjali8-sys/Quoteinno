import { DesignCategory, QuoteTemplate, BOQItem } from '../../types';

export const DESIGN_CATEGORIES_STORAGE_KEY = 'innovista_design_hub_categories_v1';
export const MAX_IMAGE_SIZE_BYTES = 1 * 1024 * 1024; // 1 MB
export const MAX_VIDEO_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export function isServiceBOQItem(item: Partial<BOQItem>): boolean {
  const pt = (item.productType || '').toLowerCase();
  const cat = (item.category || '').toLowerCase();
  const code = (item.pvcCode || '').toUpperCase();
  return (
    pt === 'service' ||
    cat.includes('service') ||
    cat.includes('installation') ||
    cat.includes('labor') ||
    cat.includes('labour') ||
    code.startsWith('SRV')
  );
}

export const DEFAULT_DESIGN_CATEGORIES: DesignCategory[] = [
  // Main Categories
  { id: 'dcat-alum', name: 'Aluminium & Windows', parentId: null, color: '#0284c7', description: 'Architectural aluminium window, door, and louver design packages' },
  { id: 'dcat-glaze', name: 'Glazing & Shopfront', parentId: null, color: '#059669', description: 'Frameless retail shopfronts, entrances, and toughened glass assemblies' },
  { id: 'dcat-facade', name: 'Curtain Wall & Facade', parentId: null, color: '#4f46e5', description: 'High-rise structural glazing, unitized curtain walls, and ACP cladding' },
  { id: 'dcat-interior', name: 'Interior Fit-out', parentId: null, color: '#d97706', description: 'Executive acoustic office partitions, shower enclosures, and interior glass' },
  { id: 'dcat-budget', name: 'Budgetary Estimation', parentId: null, color: '#7c3aed', description: 'Preliminary feasibility designs and full building envelope estimates' },
  { id: 'dcat-steel', name: 'Steel & Structural Works', parentId: null, color: '#475569', description: 'Structural steel canopies, skylights, pergolas, and SS balustrades' },

  // Sub-Categories for Aluminium & Windows
  { id: 'dsub-alum-slide', name: 'Sliding Windows & Doors', parentId: 'dcat-alum' },
  { id: 'dsub-alum-case', name: 'Casement & Awning Systems', parentId: 'dcat-alum' },
  { id: 'dsub-alum-bifold', name: 'Bi-Folding & Patio Systems', parentId: 'dcat-alum' },
  { id: 'dsub-alum-louver', name: 'Ventilation Louvers & Sunshades', parentId: 'dcat-alum' },

  // Sub-Categories for Glazing & Shopfront
  { id: 'dsub-glaze-retail', name: 'Commercial Retail Shopfronts', parentId: 'dcat-glaze' },
  { id: 'dsub-glaze-entry', name: 'Frameless Toughened Entrances', parentId: 'dcat-glaze' },
  { id: 'dsub-glaze-railing', name: 'Glass Balustrades & Handrails', parentId: 'dcat-glaze' },

  // Sub-Categories for Curtain Wall & Facade
  { id: 'dsub-facade-semi', name: 'Semi-Unitized Structural Glazing', parentId: 'dcat-facade' },
  { id: 'dsub-facade-unit', name: 'Unitized High-Rise Curtain Wall', parentId: 'dcat-facade' },
  { id: 'dsub-facade-acp', name: 'PVDF ACP & Cladding Envelopes', parentId: 'dcat-facade' },
  { id: 'dsub-facade-spider', name: 'Point-Fixed Spider Glazing', parentId: 'dcat-facade' },

  // Sub-Categories for Interior Fit-out
  { id: 'dsub-int-acoustic', name: 'Acoustic Slimline Office Partitions', parentId: 'dcat-interior' },
  { id: 'dsub-int-shower', name: 'Luxury Shower & Wet-Area Glass', parentId: 'dcat-interior' },
  { id: 'dsub-int-boardroom', name: 'Switchable Smart Glass Suites', parentId: 'dcat-interior' },

  // Sub-Categories for Budgetary Estimation
  { id: 'dsub-bud-tower', name: 'Commercial Tower Feasibility', parentId: 'dcat-budget' },
  { id: 'dsub-bud-villa', name: 'Luxury Residential Villa Package', parentId: 'dcat-budget' },
  { id: 'dsub-bud-ind', name: 'Industrial & Warehouse Cladding', parentId: 'dcat-budget' },

  // Sub-Categories for Steel & Structural Works
  { id: 'dsub-steel-canopy', name: 'Spider Glass Canopies & Skylights', parentId: 'dcat-steel' },
  { id: 'dsub-steel-pergola', name: 'Architectural Pergolas & Trellis', parentId: 'dcat-steel' }
];

export function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return '0 KB';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
}

export interface MediaValidationResult {
  valid: boolean;
  mediaType?: 'image' | 'video';
  error?: string;
}

export function validateDesignMediaFile(file: File): MediaValidationResult {
  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');

  if (!isImage && !isVideo) {
    return {
      valid: false,
      error: 'Unsupported file format. Please upload an image (PNG, JPG, WEBP, SVG) or video (MP4, WEBM, MOV).'
    };
  }

  if (isImage) {
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return {
        valid: false,
        mediaType: 'image',
        error: `Image size (${formatBytes(file.size)}) exceeds the 1 MB maximum limit. Please select an image under 1 MB.`
      };
    }
    return { valid: true, mediaType: 'image' };
  }

  if (file.size > MAX_VIDEO_SIZE_BYTES) {
    return {
      valid: false,
      mediaType: 'video',
      error: `Video size (${formatBytes(file.size)}) exceeds the 10 MB maximum limit. Please select a video under 10 MB.`
    };
  }

  return { valid: true, mediaType: 'video' };
}

export function calculateDesignBreakdown(design: QuoteTemplate | null) {
  if (!design) {
    return {
      productsCount: 0,
      servicesCount: 0,
      productsGross: 0,
      servicesGross: 0,
      grossTotal: 0,
      discountTotal: 0,
      netItemsTotal: 0,
      additionalChargesTotal: 0,
      taxAmount: 0,
      grandTotal: 0,
      estimatedCostTotal: 0,
      estimatedProfit: 0,
      estimatedMarginPercent: 0
    };
  }

  let productsCount = 0;
  let servicesCount = 0;
  let productsGross = 0;
  let servicesGross = 0;
  let discountTotal = 0;
  let estimatedCostTotal = 0;

  design.items.forEach(it => {
    if (it.itemType === 'Title') return;
    const isService =
      it.productType === 'Service' ||
      (it.category && it.category.toLowerCase().includes('service')) ||
      (it.pvcCode && it.pvcCode.toUpperCase().startsWith('SRV'));

    const lineSub = (it.qty || 0) * (it.rate || 0);
    const lineDisc = lineSub * ((it.discountPercent || 0) / 100);
    const lineNet = lineSub - lineDisc;
    const unitCost = it.costAtTimeOfQuote ?? Math.round((it.rate || 0) * 0.72);
    estimatedCostTotal += (it.qty || 0) * unitCost;

    discountTotal += lineDisc;
    if (isService) {
      servicesCount++;
      servicesGross += lineNet;
    } else {
      productsCount++;
      productsGross += lineNet;
    }
  });

  const grossTotal = productsGross + servicesGross + discountTotal;
  const netItemsTotal = productsGross + servicesGross;
  const additionalChargesTotal = (design.additionalCharges || []).reduce((s, c) => s + (Number(c.amount) || 0), 0);
  const taxableBase = netItemsTotal + additionalChargesTotal;
  const taxPct = Number(design.taxPercent) || 0;

  const taxAmount = design.isTaxInclusive
    ? taxableBase - taxableBase / (1 + taxPct / 100)
    : taxableBase * (taxPct / 100);

  const grandTotal = design.isTaxInclusive ? taxableBase : taxableBase + taxAmount;
  const revenueExTax = design.isTaxInclusive ? taxableBase - taxAmount : taxableBase;
  const estimatedProfit = revenueExTax - estimatedCostTotal;
  const estimatedMarginPercent = revenueExTax > 0 ? (estimatedProfit / revenueExTax) * 100 : 0;

  return {
    productsCount,
    servicesCount,
    productsGross,
    servicesGross,
    grossTotal,
    discountTotal,
    netItemsTotal,
    additionalChargesTotal,
    taxAmount,
    grandTotal,
    estimatedCostTotal,
    estimatedProfit,
    estimatedMarginPercent
  };
}
