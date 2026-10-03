import { ProductVariant, ItemTemplate } from '../types';
import { MASTER_ATTRIBUTE_DEFINITIONS } from './constructionTemplates';
import { getStoredAttributeDefinitions } from './attributeOptionService';
import { generateDefaultBOMForVariant, calculatePricingScenarios } from './bomPricingService';

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  matchedVariant?: ProductVariant;
  similarityPercentage: number;
  duplicateMessage?: string;
  differences?: { attribute: string; currentVal: string; existingVal: string }[];
}

export interface GeneratedVariantDescriptions {
  shortName: string;
  generatedDescription: string;
  customerDescription: string;
  technicalDescription: string;
  boqDescription: string;
}

/**
 * Generates an immutable, canonical signature from selected attributes.
 * Sorted alphabetically by key to ensure order-independent hashing.
 */
export function generateNormalizedSignature(attributes: Record<string, any>): string {
  const keys = Object.keys(attributes).sort();
  return keys
    .filter(k => attributes[k] !== undefined && attributes[k] !== null && attributes[k] !== '')
    .map(k => `${k.toUpperCase().trim()}:${String(attributes[k]).trim().toLowerCase()}`)
    .join('|');
}

/**
 * Checks if a variant with identical or near-identical specifications already exists in the catalog.
 */
export function checkDuplicateVariant(
  itemId: string,
  attributes: Record<string, any>,
  existingVariants: ProductVariant[],
  excludeVariantId?: string
): DuplicateCheckResult {
  const currentSig = generateNormalizedSignature(attributes);
  const relevantVariants = existingVariants.filter(
    v => (v.itemId === itemId || !v.itemId) && v.id !== excludeVariantId
  );

  // 1. Check exact match
  for (const v of relevantVariants) {
    const vSig = v.normalizedSignature || generateNormalizedSignature(v.attributes || {});
    if (vSig === currentSig && currentSig.length > 0) {
      return {
        isDuplicate: true,
        matchedVariant: v,
        similarityPercentage: 100,
        duplicateMessage: `An identical variant already exists in the catalog with code: ${v.variantCode}`
      };
    }
  }

  // 2. Check high similarity (>85% matching attributes)
  const currentKeys = Object.keys(attributes).filter(k => attributes[k]);
  if (currentKeys.length === 0) {
    return { isDuplicate: false, similarityPercentage: 0 };
  }

  let highestMatch: { variant: ProductVariant; similarity: number; diffs: any[] } | null = null;

  for (const v of relevantVariants) {
    const vAttrs = v.attributes || {};
    let matchingCount = 0;
    const diffs: any[] = [];

    for (const key of currentKeys) {
      const curVal = String(attributes[key] || '').toLowerCase().trim();
      const exVal = String(vAttrs[key] || '').toLowerCase().trim();
      if (curVal === exVal && curVal !== '') {
        matchingCount++;
      } else {
        diffs.push({
          attribute: key,
          currentVal: attributes[key] || '(None)',
          existingVal: vAttrs[key] || '(None)'
        });
      }
    }

    const similarity = Math.round((matchingCount / currentKeys.length) * 100);
    if (!highestMatch || similarity > highestMatch.similarity) {
      highestMatch = { variant: v, similarity, diffs };
    }
  }

  if (highestMatch && highestMatch.similarity >= 85) {
    return {
      isDuplicate: false,
      matchedVariant: highestMatch.variant,
      similarityPercentage: highestMatch.similarity,
      duplicateMessage: `Very similar variant found (${highestMatch.similarity}% match): ${highestMatch.variant.variantCode}`,
      differences: highestMatch.diffs
    };
  }

  return {
    isDuplicate: false,
    similarityPercentage: highestMatch ? highestMatch.similarity : 0
  };
}

/**
 * Resolves a clean, standardized alphanumeric prefix from an item or item code.
 * E.g., Item with productCode 'AL-WD-001' -> 'AL-WD'
 * E.g., 'Aluminium Sliding Window' -> 'AL-WIN'
 */
export function resolveItemPrefix(
  itemOrCode?: ItemTemplate | Partial<ItemTemplate> | string
): string {
  if (!itemOrCode) return 'PRD';
  if (typeof itemOrCode === 'string') {
    const trimmed = itemOrCode.trim();
    if (!trimmed) return 'PRD';
    // If it's a short id like 't1', try to return PRD or keep clean
    if (/^t\d+$/i.test(trimmed)) return 'AL-WIN';
    // Remove trailing numbers like -001
    const cleaned = trimmed.replace(/-\d+$/, '').replace(/[^a-zA-Z0-9-]/g, '').toUpperCase();
    return cleaned || 'PRD';
  }
  // If ItemTemplate object
  if (itemOrCode.productCode) {
    const cleaned = itemOrCode.productCode.replace(/-\d+$/, '').replace(/[^a-zA-Z0-9-]/g, '').toUpperCase();
    if (cleaned) return cleaned;
  }
  if (itemOrCode.code) {
    const cleaned = itemOrCode.code.replace(/-\d+$/, '').replace(/[^a-zA-Z0-9-]/g, '').toUpperCase();
    if (cleaned) return cleaned;
  }
  if (itemOrCode.name) {
    const nameUpper = itemOrCode.name.toUpperCase();
    if (nameUpper.includes('SLID')) return 'AL-SLD';
    if (nameUpper.includes('CASEMENT')) return 'AL-CSM';
    if (nameUpper.includes('DOOR')) return 'AL-DOR';
    if (nameUpper.includes('WINDOW')) return 'AL-WIN';
    if (nameUpper.includes('CURTAIN') || nameUpper.includes('FACADE')) return 'CW-FAC';
    if (nameUpper.includes('GLASS') || nameUpper.includes('GLAZ')) return 'GL-PAN';
    if (nameUpper.includes('LOUVER')) return 'AL-LVR';
    if (nameUpper.includes('PARTITION')) return 'AL-PRT';
    const words = itemOrCode.name.replace(/[^a-zA-Z0-9\s]/g, '').split(/\s+/).filter(Boolean);
    if (words.length >= 2) {
      return `${words[0].substring(0, 2).toUpperCase()}-${words[1].substring(0, 3).toUpperCase()}`;
    }
    return words[0]?.substring(0, 4).toUpperCase() || 'PRD';
  }
  return 'PRD';
}

/**
 * Checks if a variant code is strictly unique across all existing variants.
 */
export function isVariantCodeUnique(
  code: string,
  existingVariants: ProductVariant[] = [],
  excludeVariantId?: string
): boolean {
  if (!code || !code.trim()) return false;
  const clean = code.trim().toUpperCase();
  return !existingVariants.some(
    v => v.id !== excludeVariantId && v.variantCode && v.variantCode.trim().toUpperCase() === clean
  );
}

/**
 * Generates a clean, professional construction variant code guaranteed to be unique.
 * E.g., AL-WIN-70-2W-001 or AL-WD-80-3W-002
 */
export function generateVariantCode(
  baseItemOrPrefix: ItemTemplate | Partial<ItemTemplate> | string,
  attributes: Record<string, any> = {},
  existingVariants: ProductVariant[] = [],
  excludeVariantId?: string
): string {
  const prefix = resolveItemPrefix(baseItemOrPrefix);
  const allDefs = getStoredAttributeDefinitions();

  // Extract key abbreviations from attributes
  const series = String(attributes['SYSTEM_SERIES'] || '');
  const seriesDef = allDefs.find(d => d.code === 'SYSTEM_SERIES') || MASTER_ATTRIBUTE_DEFINITIONS.find(d => d.code === 'SYSTEM_SERIES');
  const matchedSeriesOpt = seriesDef?.allowedValues?.find(o => o.label === series);
  let seriesCode = matchedSeriesOpt?.codeSuffix || '';
  if (!seriesCode) {
    if (series.includes('80mm')) seriesCode = '80';
    else if (series.includes('100mm')) seriesCode = '100';
    else if (series.includes('Thermal')) seriesCode = 'TB';
    else if (series.includes('Slim')) seriesCode = 'SL';
    else if (series.includes('70mm')) seriesCode = '70';
    else {
      seriesCode = series.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase() || '70';
    }
  }

  const op = String(attributes['OPERATION_TYPE'] || '');
  const opDef = allDefs.find(d => d.code === 'OPERATION_TYPE') || MASTER_ATTRIBUTE_DEFINITIONS.find(d => d.code === 'OPERATION_TYPE');
  const matchedOpOpt = opDef?.allowedValues?.find(o => o.label === op);
  let opCode = matchedOpOpt?.codeSuffix || '';
  if (!opCode) {
    if (op.includes('Three-Way') || op.includes('3-Track')) opCode = '3W';
    else if (op.includes('Four-Way') || op.includes('4-Track')) opCode = '4W';
    else if (op.includes('Casement')) opCode = 'CS';
    else if (op.includes('Top-Hung')) opCode = 'TH';
    else if (op.includes('Fixed')) opCode = 'FX';
    else if (op.includes('Swing')) opCode = 'SW';
    else if (op.includes('Bi-Folding')) opCode = 'BF';
    else if (op.includes('Sliding') || op.includes('2W')) opCode = '2W';
    else {
      opCode = op.replace(/[^a-zA-Z0-9]/g, '').substring(0, 2).toUpperCase() || '2W';
    }
  }

  const basePattern = `${prefix}-${seriesCode}-${opCode}`;

  // Find highest existing sequence matching this pattern
  const otherVariants = existingVariants.filter(v => v.id !== excludeVariantId);
  const matchingCodes = otherVariants
    .map(v => v.variantCode)
    .filter(code => code && code.toUpperCase().startsWith(basePattern.toUpperCase()));

  let nextSeq = 1;
  matchingCodes.forEach(code => {
    const parts = code.split('-');
    const lastPart = parts[parts.length - 1];
    const num = parseInt(lastPart, 10);
    if (!isNaN(num) && num >= nextSeq) {
      nextSeq = num + 1;
    }
  });

  let candidate = `${basePattern}-${String(nextSeq).padStart(3, '0')}`;
  // Ensure strict uniqueness in case of collision
  while (!isVariantCodeUnique(candidate, otherVariants)) {
    nextSeq++;
    candidate = `${basePattern}-${String(nextSeq).padStart(3, '0')}`;
  }

  return candidate;
}

/**
 * Checks if a barcode is strictly unique across all variants and item templates.
 */
export function isVariantBarcodeUnique(
  barcode: string,
  existingVariants: ProductVariant[] = [],
  existingItems: ItemTemplate[] = [],
  excludeVariantId?: string
): boolean {
  if (!barcode || !barcode.trim()) return false;
  const clean = barcode.trim().toUpperCase();

  const variantCollision = existingVariants.some(
    v => v.id !== excludeVariantId && (
      (v.barcode && v.barcode.trim().toUpperCase() === clean) ||
      (v.variantCode && v.variantCode.trim().toUpperCase() === clean)
    )
  );
  if (variantCollision) return false;

  const itemCollision = existingItems.some(
    i => (i.barcode && i.barcode.trim().toUpperCase() === clean) ||
         (i.productCode && i.productCode.trim().toUpperCase() === clean) ||
         (i.code && i.code.trim().toUpperCase() === clean)
  );
  return !itemCollision;
}

/**
 * Generates a clean, scannable, standardized Code 128 barcode strictly unique across catalog.
 * E.g., VAR-ALW-702W-001 or VAR-ALWD-803W-002
 */
export function generateUniqueVariantBarcode(
  baseItemOrPrefix?: ItemTemplate | Partial<ItemTemplate> | string,
  attributes: Record<string, any> = {},
  existingVariants: ProductVariant[] = [],
  existingItems: ItemTemplate[] = [],
  excludeVariantId?: string
): string {
  const prefix = resolveItemPrefix(baseItemOrPrefix).replace(/[^a-zA-Z0-9]/g, '').substring(0, 4) || 'ALW';

  const allDefs = getStoredAttributeDefinitions();
  const series = String(attributes['SYSTEM_SERIES'] || '');
  const seriesDef = allDefs.find(d => d.code === 'SYSTEM_SERIES') || MASTER_ATTRIBUTE_DEFINITIONS.find(d => d.code === 'SYSTEM_SERIES');
  const matchedSeriesOpt = seriesDef?.allowedValues?.find(o => o.label === series);
  let seriesCode = matchedSeriesOpt?.codeSuffix || '';
  if (!seriesCode) {
    if (series.includes('80mm')) seriesCode = '80';
    else if (series.includes('100mm')) seriesCode = '100';
    else if (series.includes('Thermal')) seriesCode = 'TB';
    else if (series.includes('Slim')) seriesCode = 'SL';
    else if (series.includes('70mm')) seriesCode = '70';
    else seriesCode = series.replace(/[^a-zA-Z0-9]/g, '').substring(0, 2).toUpperCase() || '70';
  }

  const op = String(attributes['OPERATION_TYPE'] || '');
  const opDef = allDefs.find(d => d.code === 'OPERATION_TYPE') || MASTER_ATTRIBUTE_DEFINITIONS.find(d => d.code === 'OPERATION_TYPE');
  const matchedOpOpt = opDef?.allowedValues?.find(o => o.label === op);
  let opCode = matchedOpOpt?.codeSuffix || '';
  if (!opCode) {
    if (op.includes('Three-Way') || op.includes('3-Track')) opCode = '3W';
    else if (op.includes('Four-Way') || op.includes('4-Track')) opCode = '4W';
    else if (op.includes('Casement')) opCode = 'CS';
    else if (op.includes('Top-Hung')) opCode = 'TH';
    else if (op.includes('Fixed')) opCode = 'FX';
    else if (op.includes('Swing')) opCode = 'SW';
    else if (op.includes('Bi-Folding')) opCode = 'BF';
    else if (op.includes('Sliding') || op.includes('2W')) opCode = '2W';
    else opCode = op.replace(/[^a-zA-Z0-9]/g, '').substring(0, 2).toUpperCase() || '2W';
  }

  const barcodePrefix = `VAR-${prefix}-${seriesCode}${opCode}`;
  
  let seq = 1;
  let candidate = `${barcodePrefix}-${String(seq).padStart(3, '0')}`;

  while (!isVariantBarcodeUnique(candidate, existingVariants, existingItems, excludeVariantId)) {
    seq++;
    candidate = `${barcodePrefix}-${String(seq).padStart(3, '0')}`;
  }

  return candidate;
}

/**
 * Ensures all existing variants in an array have strictly unique codes and barcodes.
 * Fixes any blanks or duplicates deterministically.
 */
export function ensureVariantsHaveUniqueCodesAndBarcodes(
  variants: ProductVariant[],
  itemTemplates: ItemTemplate[] = []
): ProductVariant[] {
  const seenCodes = new Set<string>();
  const seenBarcodes = new Set<string>();

  // Register existing item barcodes/codes first
  itemTemplates.forEach(it => {
    if (it.barcode) seenBarcodes.add(it.barcode.trim().toUpperCase());
    if (it.productCode) seenCodes.add(it.productCode.trim().toUpperCase());
    if (it.code) seenCodes.add(it.code.trim().toUpperCase());
  });

  return variants.map((v, idx) => {
    let code = (v.variantCode || '').trim();
    let barcode = (v.barcode || '').trim();
    let updated = false;

    // 1. Verify / Fix Code
    if (!code || seenCodes.has(code.toUpperCase())) {
      const parentItem = itemTemplates.find(t => t.id === v.itemId);
      code = generateVariantCode(
        parentItem || v.itemId || 'AL-WIN',
        v.attributes || {},
        variants.filter(item => item.id !== v.id),
        v.id
      );
      let cSeq = idx + 1;
      while (seenCodes.has(code.toUpperCase())) {
        code = `${code.replace(/-\d+$/, '')}-${String(cSeq++).padStart(3, '0')}`;
      }
      updated = true;
    }
    seenCodes.add(code.toUpperCase());

    // 2. Verify / Fix Barcode
    if (!barcode || seenBarcodes.has(barcode.toUpperCase())) {
      const parentItem = itemTemplates.find(t => t.id === v.itemId);
      barcode = generateUniqueVariantBarcode(
        parentItem || v.itemId || 'ALW',
        v.attributes || {},
        variants.filter(item => item.id !== v.id),
        itemTemplates,
        v.id
      );
      let bSeq = idx + 1;
      while (seenBarcodes.has(barcode.toUpperCase())) {
        barcode = `VAR-${code.replace(/[^a-zA-Z0-9]/g, '')}-${String(bSeq++).padStart(3, '0')}`;
      }
      updated = true;
    }
    seenBarcodes.add(barcode.toUpperCase());

    if (updated || v.variantCode !== code || v.barcode !== barcode) {
      return {
        ...v,
        variantCode: code,
        barcode: barcode
      };
    }
    return v;
  });
}

/**
 * Builds a batch matrix of variants from a single parent ItemTemplate.
 * Every generated variant is guaranteed to have a unique code and unique barcode.
 */
export function buildBatchVariantsFromItem(
  item: ItemTemplate,
  matrix: {
    seriesList: string[];
    operationList: string[];
    glassList: string[];
    finishList: string[];
  },
  existingVariants: ProductVariant[] = [],
  existingItems: ItemTemplate[] = []
): ProductVariant[] {
  const workingVariantsList = [...existingVariants];
  const generatedVariants: ProductVariant[] = [];

  const seriesArr = matrix.seriesList.length > 0 ? matrix.seriesList : ['70mm Standard Series'];
  const opArr = matrix.operationList.length > 0 ? matrix.operationList : ['Two-Way Sliding'];
  const glassArr = matrix.glassList.length > 0 ? matrix.glassList : ['5mm Clear Annealed'];
  const finishArr = matrix.finishList.length > 0 ? matrix.finishList : ['Pure White (RAL 9016)'];

  for (const series of seriesArr) {
    for (const op of opArr) {
      for (const glass of glassArr) {
        for (const finish of finishArr) {
          const attributes: Record<string, any> = {
            SYSTEM_SERIES: series,
            OPERATION_TYPE: op,
            PANEL_COUNT: op.includes('3') ? '3-Panel' : op.includes('4') ? '4-Panel' : '2-Panel',
            GLASS_TYPE: glass.includes('Double') || glass.includes('DGU') ? 'Double Glazed (DGU)' : 'Clear Annealed',
            GLASS_THICKNESS: glass.includes('DGU') ? '12mm (5+6+5) DGU' : glass.includes('6mm') ? '6mm Single' : '5mm Single Glazed',
            SURFACE_FINISH: finish.includes('Anod') ? 'Anodized' : 'Powder Coated',
            COLOR_RAL: finish,
            HARDWARE_GRADE: series.includes('100mm') || series.includes('Heavy') ? 'Architectural Heavy Duty' : 'Standard Grade',
            LOCK_TYPE: op.includes('Casement') ? 'Multi-Point Espagnolette' : 'Flush Touch Lock',
            BRAND_SPEC: 'Alumex'
          };

          const uniqueCode = generateVariantCode(
            item,
            attributes,
            workingVariantsList
          );

          const uniqueBarcode = generateUniqueVariantBarcode(
            item,
            attributes,
            workingVariantsList,
            existingItems
          );

          const descriptions = generateVariantDescriptions(item.name, attributes);
          const bom = generateDefaultBOMForVariant(
            `batch-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            attributes,
            item.unit || 'm²'
          );

          const baseSelling = item.rate && item.rate > 0 
            ? Math.round(item.rate * (series.includes('100mm') ? 1.25 : series.includes('80mm') ? 1.15 : 1.0))
            : Math.round(bom.totalCost * 1.33);

          const pricingScenarios = calculatePricingScenarios(bom.totalCost, baseSelling, 25);

          const newVariant: ProductVariant = {
            id: crypto.randomUUID(),
            variantCode: uniqueCode,
            barcode: uniqueBarcode,
            variantName: descriptions.shortName,
            shortName: descriptions.shortName,
            itemId: item.id,
            itemName: item.name,
            categoryId: item.categoryId || '',
            categoryName: item.category || 'Aluminium Works',
            generatedDescription: descriptions.generatedDescription,
            customerDescription: descriptions.customerDescription,
            technicalDescription: descriptions.technicalDescription,
            boqDescription: descriptions.boqDescription,
            status: 'Active',
            technicalStatus: 'COMPATIBLE',
            brandName: 'Alumex',
            manufacturer: 'Innovista Engineering',
            normalizedSignature: generateNormalizedSignature(attributes),
            attributes,
            structuredAttributes: buildStructuredAttributes(attributes),
            unit: item.unit || 'm²',
            bom,
            pricing: {
              costPrice: bom.totalCost,
              minimumPrice: pricingScenarios.minimumPrice,
              competitivePrice: pricingScenarios.competitivePrice,
              standardPrice: pricingScenarios.standardPrice,
              targetPrice: pricingScenarios.targetPrice,
              premiumPrice: pricingScenarios.premiumPrice,
              sellingPrice: pricingScenarios.activeSellingPrice,
              pricingMethod: 'Target Margin',
              markupPercent: pricingScenarios.markupPercent,
              grossMarginPercent: pricingScenarios.grossMarginPercent,
              grossProfit: pricingScenarios.grossProfit,
              priceSource: 'SUPPLIER_QUOTATION',
              currency: 'LKR',
              effectiveFrom: new Date().toISOString().split('T')[0],
              validUntil: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              lastUpdated: new Date().toISOString(),
              confidenceRating: 95
            },
            priceHistory: [
              {
                id: crypto.randomUUID(),
                date: new Date().toISOString().split('T')[0],
                newSellingPrice: pricingScenarios.activeSellingPrice,
                newCostPrice: bom.totalCost,
                markupPercent: pricingScenarios.markupPercent,
                marginPercent: pricingScenarios.grossMarginPercent,
                reason: 'Batch Matrix Variant Generation from Base Item',
                changedBy: 'System Variant Engine'
              }
            ],
            createdBy: 'Batch Variant Builder',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            notes: `Auto-generated matrix variant from parent item: ${item.name} (${item.productCode || item.code || item.id})`
          };

          workingVariantsList.push(newVariant);
          generatedVariants.push(newVariant);
        }
      }
    }
  }

  return generatedVariants;
}

/**
 * Compiles multi-audience descriptions for tender, customer, and production contexts.
 */
export function generateVariantDescriptions(
  itemName: string,
  attributes: Record<string, any>
): GeneratedVariantDescriptions {
  const series = attributes['SYSTEM_SERIES'] || '70mm Standard Series';
  const op = attributes['OPERATION_TYPE'] || 'Two-Way Sliding';
  const panels = attributes['PANEL_COUNT'] || '2-Panel';
  const glassType = attributes['GLASS_TYPE'] || 'Clear Annealed';
  const glassThick = attributes['GLASS_THICKNESS'] || '5mm Single Glazed';
  const glassTreat = attributes['GLASS_TREATMENT'] || 'Standard Annealed';
  const finish = attributes['SURFACE_FINISH'] || 'Powder Coated';
  const color = attributes['COLOR_RAL'] || 'Pure White (RAL 9016)';
  const hwGrade = attributes['HARDWARE_GRADE'] || 'Standard Grade';
  const lock = attributes['LOCK_TYPE'] || 'Touch Lock';
  const brand = attributes['BRAND_SPEC'] || 'Alumex';
  const thermal = attributes['THERMAL_BARRIER'];
  const interlayer = attributes['LAMINATION_INTERLAYER'];
  const envClass = attributes['ENVIRONMENT_CLASS'];
  const mullion = attributes['FACADE_MULLION'];

  // Build spec enhancements string
  const performanceTags: string[] = [];
  if (thermal && !thermal.includes('Non-Thermal')) performanceTags.push(thermal);
  if (interlayer && !interlayer.includes('Monolithic')) performanceTags.push(interlayer);
  if (envClass && (envClass.includes('C4') || envClass.includes('C5'))) performanceTags.push('Marine Grade');
  if (mullion) performanceTags.push(mullion);

  const perfSuffix = performanceTags.length > 0 ? ` [${performanceTags.join(', ')}]` : '';

  // Short Name for concise list views & matrix cells
  const shortName = `${series.split(' ')[0]} ${op} (${panels.split(' ')[0]}, ${glassThick.split(' ')[0]}, ${color.split(' ')[0]})${perfSuffix}`;

  const itemTitle = itemName || 'Aluminium Unit';

  // Standard Generated Description
  const thermalDesc = thermal && !thermal.includes('Non-Thermal') ? ` with ${thermal}` : '';
  const interlayerDesc = interlayer && !interlayer.includes('Monolithic') ? ` laminated with ${interlayer}` : '';
  const envDesc = envClass ? ` rated for ${envClass}` : '';

  const generatedDescription = `${series} ${op} ${itemTitle}${thermalDesc}, ${panels}, glazed with ${glassThick} ${glassType} (${glassTreat})${interlayerDesc}, finished in ${finish} ${color}${envDesc}. Fitted with ${hwGrade}, ${lock}, using genuine ${brand} extruded profiles.`;

  // Customer-facing Description (warm, non-intimidating, high-contrast clarity)
  const customerDescription = `Supply and installation of ${brand} ${series.toLowerCase()} ${op.toLowerCase()} window with ${panels.toLowerCase()}${thermalDesc}. Features durable ${color} finish${envDesc}, precision-glazed with ${glassThick} safety glass${interlayerDesc}. Complete with smooth heavy-duty sliding hardware, integrated weather sealing, and comprehensive 10-year structural warranty.`;

  // Detailed Technical Engineering Description
  const technicalDescription = `ARCHITECTURAL SPECIFICATION:
1. Extrusions: Extruded aluminium alloy 6063-T5 conforming to SLS 1410 / BS EN 755. System profile frame depth: ${series}${mullion ? `, Mullion: ${mullion}` : ''}${thermal ? `, Thermal Barrier: ${thermal}` : ''}.
2. Surface Finish: ${finish} in ${color}, minimum film thickness 60-80 microns (${envDesc ? envDesc.trim() : 'Class C3'}) with 10-year anti-fading durability warranty.
3. Glazing: ${glassThick} ${glassType} (${glassTreat})${interlayer ? ` with ${interlayer}` : ''}, channel glazed with UV-resistant EPDM gasket seals conforming to BS 4255.
4. Hardware: ${hwGrade} including heavy-duty ball-bearing sliding rollers, stainless steel fixings, and ${lock}.
5. Weatherproofing: Continuous dual wool-pile weather-stripping at all interlockers with integrated drainage weep-holes.`;

  // Formal BOQ Contract Tender Description
  const boqDescription = `Supply, assemble, deliver to site and install genuine ${brand} architectural ${series} ${op.toLowerCase()} window unit (${panels})${thermalDesc}, overall aperture as per schedule of finishes. Outer frame and sashes in ${finish} ${color}. Infill with ${glassThick} ${glassType} (${glassTreat})${interlayerDesc} secured with EPDM gaskets and aluminium snap beads. All complete with ${hwGrade} accessories, ${lock}, perimeter silicone weather sealant, fixings, brackets, and testing to engineer satisfaction.`;

  return {
    shortName,
    generatedDescription,
    customerDescription,
    technicalDescription,
    boqDescription
  };
}

/**
 * Builds structured attributes list with label and display formatting
 */
export function buildStructuredAttributes(attributes: Record<string, any>) {
  const allDefs = getStoredAttributeDefinitions();
  return Object.keys(attributes).map(key => {
    const def = allDefs.find(d => d.code === key) || MASTER_ATTRIBUTE_DEFINITIONS.find(d => d.code === key);
    const rawVal = attributes[key];
    let displayVal = String(rawVal);
    if (def?.allowedValues) {
      const opt = def.allowedValues.find(o => o.id === rawVal || o.label === rawVal);
      if (opt) displayVal = opt.label;
    }
    return {
      attributeId: def?.id || `attr-${key.toLowerCase()}`,
      attributeCode: key,
      name: def?.name || key,
      displayValue: displayVal,
      textValue: typeof rawVal === 'string' ? rawVal : undefined,
      numericValue: typeof rawVal === 'number' ? rawVal : undefined,
      unit: def?.unit
    };
  });
}
