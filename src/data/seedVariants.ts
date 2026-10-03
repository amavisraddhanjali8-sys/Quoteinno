import { ProductVariant } from '../types';
import { generateDefaultBOMForVariant, calculatePricingScenarios } from '../services/bomPricingService';
import { generateNormalizedSignature, generateVariantDescriptions, buildStructuredAttributes } from '../services/variantEngineService';

export function getInitialProductVariants(): ProductVariant[] {
  // 1. Variant 1: 70mm 2-Panel, 5mm Clear, White Powder Coated, Standard Hardware
  const attrs1 = {
    SYSTEM_SERIES: '70mm Standard Series',
    OPERATION_TYPE: 'Two-Way Sliding',
    PANEL_COUNT: '2-Panel (1 Fixed, 1 Slide)',
    GLASS_TYPE: 'Clear Annealed Float',
    GLASS_THICKNESS: '5mm Single Glazed',
    GLASS_TREATMENT: 'Standard Annealed',
    SURFACE_FINISH: 'Powder Coated (Architectural Grade)',
    COLOR_RAL: 'Pure White (RAL 9016)',
    HARDWARE_GRADE: 'Standard Commercial Grade',
    LOCK_TYPE: 'Standard Crescent / Touch Lock',
    ROLLER_TYPE: 'Standard Nylon Ball-Bearing Roller (Up to 45kg/leaf)',
    BRAND_SPEC: 'Alumex Premium',
    ALLOY_TEMPER: '6063-T5 Architectural Alloy'
  };
  const desc1 = generateVariantDescriptions('Aluminium Sliding Window (2-Track)', attrs1);
  const bom1 = generateDefaultBOMForVariant('var-70-2w-001', attrs1, 'm²');
  const scenarios1 = calculatePricingScenarios(bom1.totalCost, 19500, 25);

  const variant1: ProductVariant = {
    id: 'var-70-2w-001',
    variantCode: 'AL-WIN-70-2W-001',
    barcode: 'VAR-ALW-702W-001',
    variantName: '70mm 2-Way Sliding Window (2-Panel, 5mm Clear, White PC)',
    shortName: desc1.shortName,
    itemId: 't1',
    itemName: 'Aluminium Sliding Window (2-Track)',
    categoryId: 'cat-alum-win-slide',
    categoryName: 'Sliding Windows (2-Track / 3-Track)',
    generatedDescription: desc1.generatedDescription,
    customerDescription: desc1.customerDescription,
    technicalDescription: desc1.technicalDescription,
    boqDescription: desc1.boqDescription,
    status: 'ACTIVE',
    technicalStatus: 'COMPATIBLE',
    brandName: 'Alumex',
    manufacturer: 'Innovista Engineering',
    normalizedSignature: generateNormalizedSignature(attrs1),
    attributes: attrs1,
    structuredAttributes: buildStructuredAttributes(attrs1),
    unit: 'm²',
    bom: bom1,
    pricing: {
      costPrice: bom1.totalCost,
      minimumPrice: scenarios1.minimumPrice,
      competitivePrice: scenarios1.competitivePrice,
      standardPrice: scenarios1.standardPrice,
      targetPrice: scenarios1.targetPrice,
      premiumPrice: scenarios1.premiumPrice,
      sellingPrice: 19500,
      pricingMethod: 'Cost + Markup',
      markupPercent: scenarios1.markupPercent,
      grossMarginPercent: scenarios1.grossMarginPercent,
      grossProfit: scenarios1.grossProfit,
      priceSource: 'SUPPLIER_QUOTATION',
      currency: 'LKR',
      effectiveFrom: '2025-01-01',
      validUntil: '2026-12-31',
      lastUpdated: new Date().toISOString(),
      confidenceRating: 95
    },
    priceHistory: [
      {
        id: 'ph-1a',
        date: '2025-01-01',
        newSellingPrice: 19500,
        newCostPrice: bom1.totalCost,
        markupPercent: scenarios1.markupPercent,
        marginPercent: scenarios1.grossMarginPercent,
        reason: 'Initial Enterprise Catalog Pricing baseline',
        changedBy: 'Senior QS Estimator'
      }
    ],
    createdBy: 'System Administrator',
    createdAt: '2025-01-01T08:00:00Z',
    updatedAt: new Date().toISOString()
  };

  // 2. Variant 2: 70mm 2-Panel, 6mm Clear, White Powder Coated, Heavy Duty Hardware
  const attrs2 = {
    SYSTEM_SERIES: '70mm Standard Series',
    OPERATION_TYPE: 'Two-Way Sliding',
    PANEL_COUNT: '2-Panel (1 Fixed, 1 Slide)',
    GLASS_TYPE: 'Clear Annealed Float',
    GLASS_THICKNESS: '6mm Single Glazed',
    GLASS_TREATMENT: 'Standard Annealed',
    SURFACE_FINISH: 'Powder Coated (Architectural Grade)',
    COLOR_RAL: 'Pure White (RAL 9016)',
    HARDWARE_GRADE: 'Heavy-Duty Ball-Bearing Grade',
    LOCK_TYPE: 'Standard Crescent / Touch Lock',
    ROLLER_TYPE: 'Heavy-Duty SS304 Tandem Rollers (Up to 120kg/leaf)',
    BRAND_SPEC: 'Alumex Premium',
    ALLOY_TEMPER: '6063-T5 Architectural Alloy'
  };
  const desc2 = generateVariantDescriptions('Aluminium Sliding Window (2-Track)', attrs2);
  const bom2 = generateDefaultBOMForVariant('var-70-2w-002', attrs2, 'm²');
  const scenarios2 = calculatePricingScenarios(bom2.totalCost, 21800, 26);

  const variant2: ProductVariant = {
    id: 'var-70-2w-002',
    variantCode: 'AL-WIN-70-2W-002',
    barcode: 'VAR-ALW-702W-002',
    variantName: '70mm 2-Way Sliding Window (2-Panel, 6mm Clear, White PC, HD Rollers)',
    shortName: desc2.shortName,
    itemId: 't1',
    itemName: 'Aluminium Sliding Window (2-Track)',
    categoryId: 'cat-alum-win-slide',
    categoryName: 'Sliding Windows (2-Track / 3-Track)',
    generatedDescription: desc2.generatedDescription,
    customerDescription: desc2.customerDescription,
    technicalDescription: desc2.technicalDescription,
    boqDescription: desc2.boqDescription,
    status: 'ACTIVE',
    technicalStatus: 'COMPATIBLE',
    brandName: 'Alumex',
    manufacturer: 'Innovista Engineering',
    normalizedSignature: generateNormalizedSignature(attrs2),
    attributes: attrs2,
    structuredAttributes: buildStructuredAttributes(attrs2),
    unit: 'm²',
    bom: bom2,
    pricing: {
      costPrice: bom2.totalCost,
      minimumPrice: scenarios2.minimumPrice,
      competitivePrice: scenarios2.competitivePrice,
      standardPrice: scenarios2.standardPrice,
      targetPrice: scenarios2.targetPrice,
      premiumPrice: scenarios2.premiumPrice,
      sellingPrice: 21800,
      pricingMethod: 'Cost + Markup',
      markupPercent: scenarios2.markupPercent,
      grossMarginPercent: scenarios2.grossMarginPercent,
      grossProfit: scenarios2.grossProfit,
      priceSource: 'SUPPLIER_QUOTATION',
      currency: 'LKR',
      effectiveFrom: '2025-01-01',
      validUntil: '2026-12-31',
      lastUpdated: new Date().toISOString(),
      confidenceRating: 98
    },
    createdBy: 'Senior QS Estimator',
    createdAt: '2025-01-05T09:00:00Z',
    updatedAt: new Date().toISOString()
  };

  // 3. Variant 3: 70mm 2-Panel, 6mm Tinted Glass, Matte Black Powder Coated, Heavy Duty Hardware
  const attrs3 = {
    SYSTEM_SERIES: '70mm Standard Series',
    OPERATION_TYPE: 'Two-Way Sliding',
    PANEL_COUNT: '2-Panel (1 Fixed, 1 Slide)',
    GLASS_TYPE: 'Euro Grey Tinted',
    GLASS_THICKNESS: '6mm Single Glazed',
    GLASS_TREATMENT: 'Standard Annealed',
    SURFACE_FINISH: 'Powder Coated (Architectural Grade)',
    COLOR_RAL: 'Matte Jet Black (RAL 9005)',
    HARDWARE_GRADE: 'Heavy-Duty Ball-Bearing Grade',
    LOCK_TYPE: 'Flush Keyed Latch Lock',
    ROLLER_TYPE: 'Heavy-Duty SS304 Tandem Rollers (Up to 120kg/leaf)',
    BRAND_SPEC: 'Alumex Premium',
    ALLOY_TEMPER: '6063-T5 Architectural Alloy'
  };
  const desc3 = generateVariantDescriptions('Aluminium Sliding Window (2-Track)', attrs3);
  const bom3 = generateDefaultBOMForVariant('var-70-2w-003', attrs3, 'm²');
  const scenarios3 = calculatePricingScenarios(bom3.totalCost, 24000, 27);

  const variant3: ProductVariant = {
    id: 'var-70-2w-003',
    variantCode: 'AL-WIN-70-2W-003',
    barcode: 'VAR-ALW-702W-003',
    variantName: '70mm 2-Way Sliding Window (2-Panel, 6mm Euro Grey Tint, Matte Black PC)',
    shortName: desc3.shortName,
    itemId: 't1',
    itemName: 'Aluminium Sliding Window (2-Track)',
    categoryId: 'cat-alum-win-slide',
    categoryName: 'Sliding Windows (2-Track / 3-Track)',
    generatedDescription: desc3.generatedDescription,
    customerDescription: desc3.customerDescription,
    technicalDescription: desc3.technicalDescription,
    boqDescription: desc3.boqDescription,
    status: 'ACTIVE',
    technicalStatus: 'COMPATIBLE',
    brandName: 'Alumex',
    manufacturer: 'Innovista Engineering',
    normalizedSignature: generateNormalizedSignature(attrs3),
    attributes: attrs3,
    structuredAttributes: buildStructuredAttributes(attrs3),
    unit: 'm²',
    bom: bom3,
    pricing: {
      costPrice: bom3.totalCost,
      minimumPrice: scenarios3.minimumPrice,
      competitivePrice: scenarios3.competitivePrice,
      standardPrice: scenarios3.standardPrice,
      targetPrice: scenarios3.targetPrice,
      premiumPrice: scenarios3.premiumPrice,
      sellingPrice: 24000,
      pricingMethod: 'Cost + Markup',
      markupPercent: scenarios3.markupPercent,
      grossMarginPercent: scenarios3.grossMarginPercent,
      grossProfit: scenarios3.grossProfit,
      priceSource: 'SUPPLIER_QUOTATION',
      currency: 'LKR',
      effectiveFrom: '2025-01-10',
      validUntil: '2026-12-31',
      lastUpdated: new Date().toISOString(),
      confidenceRating: 95
    },
    createdBy: 'Procurement Specialist',
    createdAt: '2025-01-10T11:00:00Z',
    updatedAt: new Date().toISOString()
  };

  // 4. Variant 4: 70mm 3-Panel (3-Track), 6mm Tempered Glass, Matte Black, Premium Hardware
  const attrs4 = {
    SYSTEM_SERIES: '70mm Standard Series',
    OPERATION_TYPE: 'Three-Way Sliding (3-Track)',
    PANEL_COUNT: '3-Panel (3-Track)',
    GLASS_TYPE: 'Clear Annealed Float',
    GLASS_THICKNESS: '6mm Single Glazed',
    GLASS_TREATMENT: 'Fully Tempered (Toughened Safety Glass)',
    SURFACE_FINISH: 'Powder Coated (Architectural Grade)',
    COLOR_RAL: 'Matte Jet Black (RAL 9005)',
    HARDWARE_GRADE: 'European Premium Multi-Point Grade',
    LOCK_TYPE: 'Multi-Point Security Espag Lock',
    ROLLER_TYPE: 'Heavy-Duty SS304 Tandem Rollers (Up to 120kg/leaf)',
    BRAND_SPEC: 'Alumex Premium',
    ALLOY_TEMPER: '6063-T5 Architectural Alloy'
  };
  const desc4 = generateVariantDescriptions('Aluminium Sliding Window (2-Track)', attrs4);
  const bom4 = generateDefaultBOMForVariant('var-70-3w-001', attrs4, 'm²');
  const scenarios4 = calculatePricingScenarios(bom4.totalCost, 29500, 28);

  const variant4: ProductVariant = {
    id: 'var-70-3w-001',
    variantCode: 'AL-WIN-70-3W-001',
    barcode: 'VAR-ALW-703W-001',
    variantName: '70mm 3-Track Sliding Window (3-Panel, 6mm Tempered, Matte Black, Multi-Point)',
    shortName: desc4.shortName,
    itemId: 't1',
    itemName: 'Aluminium Sliding Window (2-Track)',
    categoryId: 'cat-alum-win-slide',
    categoryName: 'Sliding Windows (2-Track / 3-Track)',
    generatedDescription: desc4.generatedDescription,
    customerDescription: desc4.customerDescription,
    technicalDescription: desc4.technicalDescription,
    boqDescription: desc4.boqDescription,
    status: 'ACTIVE',
    technicalStatus: 'COMPATIBLE',
    brandName: 'Alumex',
    manufacturer: 'Innovista Engineering',
    normalizedSignature: generateNormalizedSignature(attrs4),
    attributes: attrs4,
    structuredAttributes: buildStructuredAttributes(attrs4),
    unit: 'm²',
    bom: bom4,
    pricing: {
      costPrice: bom4.totalCost,
      minimumPrice: scenarios4.minimumPrice,
      competitivePrice: scenarios4.competitivePrice,
      standardPrice: scenarios4.standardPrice,
      targetPrice: scenarios4.targetPrice,
      premiumPrice: scenarios4.premiumPrice,
      sellingPrice: 29500,
      pricingMethod: 'Target Margin',
      markupPercent: scenarios4.markupPercent,
      grossMarginPercent: scenarios4.grossMarginPercent,
      grossProfit: scenarios4.grossProfit,
      priceSource: 'SUPPLIER_QUOTATION',
      currency: 'LKR',
      effectiveFrom: '2025-01-15',
      validUntil: '2026-12-31',
      lastUpdated: new Date().toISOString(),
      confidenceRating: 92
    },
    createdBy: 'Senior QS Estimator',
    createdAt: '2025-01-15T14:00:00Z',
    updatedAt: new Date().toISOString()
  };

  return [variant1, variant2, variant3, variant4];
}
