import { 
  VariantBOM, BOMComponent, BOMLabourItem, BOMOverheadCostItem,
  VariantPricing, ProductVariant 
} from '../types';

export interface PricingScenariosResult {
  costPrice: number;
  minimumPrice: number;
  competitivePrice: number;
  standardPrice: number;
  targetPrice: number;
  premiumPrice: number;
  activeSellingPrice: number;
  markupPercent: number;
  grossMarginPercent: number;
  grossProfit: number;
}

export interface PriceHealthReport {
  isHealthy: boolean;
  confidenceScore: number; // 0-100
  warnings: {
    type: 'EXPIRED' | 'STALE' | 'BOM_INCOMPLETE' | 'LOW_MARGIN' | 'UNAPPROVED';
    message: string;
    severity: 'critical' | 'warning' | 'info';
  }[];
}

export interface BulkPriceUpdateRule {
  targetType: 'CATEGORY' | 'ITEM' | 'ALL';
  targetId?: string;
  adjustmentScope: 'SELLING_PRICE' | 'BOM_COMPONENT_TYPE';
  componentType?: 'PROFILE' | 'GLASS' | 'HARDWARE' | 'GASKET' | 'SEALANT' | 'LABOUR';
  mode: 'PERCENTAGE' | 'FIXED_AMOUNT';
  value: number; // e.g. 5 for +5%, or 250 for +LKR 250
  effectiveDate: string;
  reason: string;
  updatedBy: string;
}

export interface BulkUpdatePreviewItem {
  variantId: string;
  variantCode: string;
  variantName: string;
  oldCost: number;
  newCost: number;
  oldSellingPrice: number;
  newSellingPrice: number;
  oldMarginPercent: number;
  newMarginPercent: number;
  priceDelta: number;
}

/**
 * Computes direct material cost, wastage, labour, overheads, and total unit cost.
 */
export function calculateBOMCosts(bom: VariantBOM): VariantBOM {
  let directMaterialCost = 0;
  const updatedComponents = bom.components.map(comp => {
    const wastage = Number(comp.wastagePercentage || 0);
    const grossQty = comp.quantity * (1 + wastage / 100);
    const amount = Math.round(grossQty * comp.rate * 100) / 100;
    directMaterialCost += amount;
    return {
      ...comp,
      grossQuantity: Math.round(grossQty * 10000) / 10000,
      amount
    };
  });

  let directLabourCost = 0;
  const updatedLabour = bom.labourItems.map(item => {
    const amount = Math.round(item.hoursOrQty * item.unitRate * 100) / 100;
    directLabourCost += amount;
    return {
      ...item,
      amount
    };
  });

  const totalDirectCost = Math.round((directMaterialCost + directLabourCost) * 100) / 100;

  // Process itemized detailed overhead items if present
  let updatedOverheadItems: BOMOverheadCostItem[] = [];
  let totalOverheadCost = 0;
  let factoryOverhead = 0;
  let adminOverhead = 0;
  let contingency = 0;

  if (bom.overheadItems && bom.overheadItems.length > 0) {
    updatedOverheadItems = bom.overheadItems.map(item => {
      let amt = 0;
      const rate = Number(item.rateOrPercent) || 0;
      switch (item.calculationBasis) {
        case 'PERCENT_DIRECT':
          amt = Math.round((totalDirectCost * (rate / 100)) * 100) / 100;
          break;
        case 'PERCENT_MATERIALS':
          amt = Math.round((directMaterialCost * (rate / 100)) * 100) / 100;
          break;
        case 'PERCENT_LABOUR':
          amt = Math.round((directLabourCost * (rate / 100)) * 100) / 100;
          break;
        case 'FIXED_AMOUNT':
        default:
          amt = Math.round(rate * 100) / 100;
          break;
      }

      if (item.isIncludedInUnitCost !== false) {
        totalOverheadCost += amt;
      }

      if (item.costType === 'FACTORY_OVERHEAD') {
        factoryOverhead += amt;
      } else if (item.costType === 'ADMIN_OVERHEAD') {
        adminOverhead += amt;
      } else if (item.costType === 'WASTAGE_CONTINGENCY') {
        contingency += amt;
      }

      return {
        ...item,
        amount: amt
      };
    });
    totalOverheadCost = Math.round(totalOverheadCost * 100) / 100;
  } else {
    // Legacy fallback calculations
    factoryOverhead = Math.round((totalDirectCost * (bom.overheadFactoryPercent / 100)) * 100) / 100;
    adminOverhead = Math.round((totalDirectCost * (bom.overheadAdminPercent / 100)) * 100) / 100;
    contingency = Math.round((totalDirectCost * (bom.contingencyPercent / 100)) * 100) / 100;
    totalOverheadCost = Math.round((factoryOverhead + adminOverhead + contingency) * 100) / 100;

    // Synthesize initial default overhead items so UI can immediately edit & delete
    updatedOverheadItems = [
      {
        id: 'oh-default-fac',
        code: 'OH-FAC',
        name: 'Factory Workshop Overhead',
        costType: 'FACTORY_OVERHEAD',
        calculationBasis: 'PERCENT_DIRECT',
        rateOrPercent: bom.overheadFactoryPercent || 8.0,
        amount: factoryOverhead,
        description: 'Shopfloor rent, electricity, maintenance, shop supervision',
        isIncludedInUnitCost: true
      },
      {
        id: 'oh-default-adm',
        code: 'OH-ADM',
        name: 'Corporate & Admin Overhead',
        costType: 'ADMIN_OVERHEAD',
        calculationBasis: 'PERCENT_DIRECT',
        rateOrPercent: bom.overheadAdminPercent || 5.0,
        amount: adminOverhead,
        description: 'Office staff, engineering drafting, tender estimating, insurance',
        isIncludedInUnitCost: true
      },
      {
        id: 'oh-default-ctg',
        code: 'OH-CTG',
        name: 'Site Contingency & Tolerance Buffer',
        costType: 'WASTAGE_CONTINGENCY',
        calculationBasis: 'PERCENT_DIRECT',
        rateOrPercent: bom.contingencyPercent || 3.0,
        amount: contingency,
        description: 'Site fitting tolerance and unforeseen variations',
        isIncludedInUnitCost: true
      }
    ];
  }

  const totalCost = Math.round((totalDirectCost + totalOverheadCost) * 100) / 100;

  return {
    ...bom,
    components: updatedComponents,
    labourItems: updatedLabour,
    overheadItems: updatedOverheadItems,
    totalOverheadCost,
    directMaterialCost: Math.round(directMaterialCost * 100) / 100,
    directLabourCost: Math.round(directLabourCost * 100) / 100,
    totalDirectCost,
    factoryOverheadAmount: factoryOverhead,
    adminOverheadAmount: adminOverhead,
    contingencyAmount: contingency,
    totalCost,
    lastCalculated: new Date().toISOString()
  };
}

/**
 * Calculates pricing scenarios and computes mathematical distinction between
 * Markup % and Gross Margin %:
 * Markup % = (Selling - Cost) / Cost * 100
 * Gross Margin % = (Selling - Cost) / Selling * 100
 */
export function calculatePricingScenarios(
  costPrice: number,
  preferredSellingPrice?: number,
  targetMarginPercent: number = 25
): PricingScenariosResult {
  const safeCost = Math.max(0, Number(costPrice) || 0);

  // Scenarios based on standard architectural contracting margins
  const minimumPrice = safeCost > 0 ? Math.round(safeCost / (1 - 0.12)) : 0; // 12% min gross margin
  const competitivePrice = safeCost > 0 ? Math.round(safeCost / (1 - 0.18)) : 0; // 18% margin
  const standardPrice = safeCost > 0 ? Math.round(safeCost / (1 - 0.25)) : 0; // 25% margin
  const targetPrice = safeCost > 0 ? Math.round(safeCost / (1 - Math.max(0.1, targetMarginPercent / 100))) : 0;
  const premiumPrice = safeCost > 0 ? Math.round(safeCost / (1 - 0.35)) : 0; // 35% margin

  const activeSellingPrice = preferredSellingPrice !== undefined && preferredSellingPrice > 0 
    ? preferredSellingPrice 
    : (targetPrice > 0 ? targetPrice : standardPrice);

  const grossProfit = Math.round((activeSellingPrice - safeCost) * 100) / 100;
  
  const markupPercent = safeCost > 0 
    ? Math.round(((activeSellingPrice - safeCost) / safeCost) * 1000) / 10 
    : 0;

  const grossMarginPercent = activeSellingPrice > 0 
    ? Math.round(((activeSellingPrice - safeCost) / activeSellingPrice) * 1000) / 10 
    : 0;

  return {
    costPrice: safeCost,
    minimumPrice,
    competitivePrice,
    standardPrice,
    targetPrice,
    premiumPrice,
    activeSellingPrice,
    markupPercent,
    grossMarginPercent,
    grossProfit
  };
}

/**
 * Evaluates price health, staleness (>90 days), expired validity, and margin safety.
 */
export function evaluatePriceHealth(pricing?: VariantPricing, bom?: VariantBOM): PriceHealthReport {
  const warnings: PriceHealthReport['warnings'] = [];
  let confidenceScore = 100;

  if (!pricing) {
    return {
      isHealthy: false,
      confidenceScore: 0,
      warnings: [{ type: 'BOM_INCOMPLETE', message: 'No pricing structure initialized for this variant.', severity: 'critical' }]
    };
  }

  // 1. Check if BOM is incomplete or zero
  if (!bom || bom.components.length === 0 || bom.totalCost <= 0) {
    confidenceScore -= 40;
    warnings.push({
      type: 'BOM_INCOMPLETE',
      message: 'Bill of Materials (BOM) is missing or cost rollup is zero.',
      severity: 'critical'
    });
  }

  // 2. Check Expiry
  if (pricing.validUntil) {
    const expiryDate = new Date(pricing.validUntil);
    if (expiryDate < new Date()) {
      confidenceScore -= 30;
      warnings.push({
        type: 'EXPIRED',
        message: `Pricing validity expired on ${pricing.validUntil.split('T')[0]}.`,
        severity: 'critical'
      });
    }
  }

  // 3. Check Staleness (> 90 days without update)
  const lastUpdate = new Date(pricing.lastUpdated || pricing.effectiveFrom || '2020-01-01');
  const daysDiff = Math.round((new Date().getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));
  if (daysDiff > 90) {
    confidenceScore -= 20;
    warnings.push({
      type: 'STALE',
      message: `Price not reviewed for ${daysDiff} days (> 90 days policy limit). Material market prices may have shifted.`,
      severity: 'warning'
    });
  }

  // 4. Low Margin Check (< 15%)
  if (pricing.grossMarginPercent < 15 && pricing.sellingPrice > 0) {
    confidenceScore -= 20;
    warnings.push({
      type: 'LOW_MARGIN',
      message: `Gross margin (${pricing.grossMarginPercent}%) is below company minimum threshold (15%).`,
      severity: 'warning'
    });
  }

  return {
    isHealthy: warnings.length === 0,
    confidenceScore: Math.max(0, Math.min(100, confidenceScore)),
    warnings
  };
}

/**
 * Simulates and executes a bulk price update across variants.
 */
export function simulateBulkPriceUpdate(
  variants: ProductVariant[],
  rule: BulkPriceUpdateRule
): BulkUpdatePreviewItem[] {
  return variants
    .filter(v => {
      if (rule.targetType === 'CATEGORY' && rule.targetId) {
        return v.categoryId === rule.targetId;
      }
      if (rule.targetType === 'ITEM' && rule.targetId) {
        return v.itemId === rule.targetId;
      }
      return true;
    })
    .map(v => {
      const oldCost = v.pricing?.costPrice || (v.bom?.totalCost || 0);
      const oldSelling = v.pricing?.sellingPrice || 0;
      let newCost = oldCost;
      let newSelling = oldSelling;

      if (rule.adjustmentScope === 'SELLING_PRICE') {
        if (rule.mode === 'PERCENTAGE') {
          newSelling = Math.round(oldSelling * (1 + rule.value / 100));
        } else {
          newSelling = Math.round(oldSelling + rule.value);
        }
      } else if (rule.adjustmentScope === 'BOM_COMPONENT_TYPE' && v.bom && rule.componentType) {
        // Adjust components matching type
        const updatedBom = {
          ...v.bom,
          components: v.bom.components.map(comp => {
            if (comp.componentType === rule.componentType) {
              const newRate = rule.mode === 'PERCENTAGE' 
                ? comp.rate * (1 + rule.value / 100) 
                : comp.rate + rule.value;
              return { ...comp, rate: Math.max(0, newRate) };
            }
            return comp;
          })
        };
        const recalculated = calculateBOMCosts(updatedBom);
        newCost = recalculated.totalCost;
        // Keep same gross margin percent if selling price wasn't locked
        const currentMargin = v.pricing?.grossMarginPercent || 25;
        newSelling = Math.round(newCost / (1 - currentMargin / 100));
      }

      const oldMargin = oldSelling > 0 ? Math.round(((oldSelling - oldCost) / oldSelling) * 1000) / 10 : 0;
      const newMargin = newSelling > 0 ? Math.round(((newSelling - newCost) / newSelling) * 1000) / 10 : 0;

      return {
        variantId: v.id,
        variantCode: v.variantCode,
        variantName: v.variantName,
        oldCost,
        newCost,
        oldSellingPrice: oldSelling,
        newSellingPrice: newSelling,
        oldMarginPercent: oldMargin,
        newMarginPercent: newMargin,
        priceDelta: newSelling - oldSelling
      };
    });
}

/**
 * Builds a realistic, detailed construction Bill of Materials tailored specifically
 * to the variant's attributes (e.g. 70mm sliding vs casement, 5mm vs 6mm tinted vs tempered glass,
 * powder coating, heavy-duty rollers, and labour breakdown).
 */
export function generateDefaultBOMForVariant(
  variantId: string,
  attributes: Record<string, any>,
  baseUnit: string = 'm²'
): VariantBOM {
  const series = String(attributes['SYSTEM_SERIES'] || '70mm Standard Series');
  const glassThick = String(attributes['GLASS_THICKNESS'] || '5mm Single Glazed');
  const glassType = String(attributes['GLASS_TYPE'] || 'Clear Annealed');
  const glassTreat = String(attributes['GLASS_TREATMENT'] || 'Standard Annealed');
  const finish = String(attributes['SURFACE_FINISH'] || 'Powder Coated');
  const hwGrade = String(attributes['HARDWARE_GRADE'] || 'Standard');
  const rollers = String(attributes['ROLLER_TYPE'] || 'Standard Nylon');
  const brand = String(attributes['BRAND_SPEC'] || 'Alumex');

  // Realistic rates in LKR per unit
  let profileRate = 1450; // LKR per kg
  if (brand.includes('Swisstek')) profileRate = 1420;
  if (brand.includes('Schüco') || brand.includes('Reynaers')) profileRate = 3200;

  // Glass rate calculation per m2
  let glassRate = 2200; // 5mm clear
  if (glassThick.includes('6mm')) glassRate = 2800;
  else if (glassThick.includes('8mm')) glassRate = 3900;
  else if (glassThick.includes('10mm')) glassRate = 5200;
  else if (glassThick.includes('12mm')) glassRate = 6800;
  else if (glassThick.includes('DGU')) glassRate = 8900;

  if (glassType.includes('Tinted') || glassType.includes('Euro Grey')) glassRate += 450;
  if (glassType.includes('Low-E')) glassRate += 1200;
  if (glassTreat.includes('Tempered')) glassRate += 900;

  // Surface finish surcharge
  let finishSurcharge = 150; // Powder coated
  if (finish.includes('Interpon') || finish.includes('Anodized')) finishSurcharge = 280;
  if (finish.includes('Wood')) finishSurcharge = 480;

  // Hardware costs
  let rollerRate = 650;
  if (rollers.includes('Heavy-Duty') || rollers.includes('Tandem')) rollerRate = 1450;
  if (rollers.includes('Extreme')) rollerRate = 2800;

  let lockRate = 850;
  if (hwGrade.includes('Heavy-Duty')) lockRate = 1650;
  if (hwGrade.includes('Premium')) lockRate = 3200;

  const components: BOMComponent[] = [
    {
      id: crypto.randomUUID(),
      componentType: 'PROFILE',
      materialCode: 'EXT-70-FRAME',
      description: `${brand} 6063-T5 Extruded Frame & Sash Profiles (${series})`,
      quantity: 3.8, // 3.8 kg per m2 of window
      unit: 'kg',
      wastagePercentage: 7.5,
      grossQuantity: 4.085,
      rate: profileRate + finishSurcharge,
      amount: Math.round(4.085 * (profileRate + finishSurcharge)),
      supplierName: brand,
      priceSource: 'SUPPLIER_QUOTATION',
      priceEffectiveDate: new Date().toISOString().split('T')[0]
    },
    {
      id: crypto.randomUUID(),
      componentType: 'GLASS',
      materialCode: 'GLS-ARCH',
      description: `${glassThick} ${glassType} (${glassTreat}) Architectural Glazing`,
      quantity: 0.92, // 0.92 m2 of glass per 1 m2 aperture
      unit: 'm²',
      wastagePercentage: 4.0,
      grossQuantity: 0.957,
      rate: glassRate,
      amount: Math.round(0.957 * glassRate),
      supplierName: 'Asahi / Saint-Gobain Glazing',
      priceSource: 'SUPPLIER_QUOTATION',
      priceEffectiveDate: new Date().toISOString().split('T')[0]
    },
    {
      id: crypto.randomUUID(),
      componentType: 'HARDWARE',
      materialCode: 'HW-ROL',
      description: `${rollers} with Sealed Bearing`,
      quantity: 2, // 2 rollers per sash
      unit: 'Nos',
      wastagePercentage: 0,
      grossQuantity: 2,
      rate: rollerRate,
      amount: rollerRate * 2,
      supplierName: 'Kinlong Architectural Hardware',
      priceSource: 'PURCHASE_INVOICE',
      priceEffectiveDate: new Date().toISOString().split('T')[0]
    },
    {
      id: crypto.randomUUID(),
      componentType: 'HARDWARE',
      materialCode: 'HW-LCK',
      description: `Architectural Touch / Espag Window Lock with Strike Keeper`,
      quantity: 1,
      unit: 'Set',
      wastagePercentage: 0,
      grossQuantity: 1,
      rate: lockRate,
      amount: lockRate,
      supplierName: 'Kinlong Architectural Hardware',
      priceSource: 'PURCHASE_INVOICE',
      priceEffectiveDate: new Date().toISOString().split('T')[0]
    },
    {
      id: crypto.randomUUID(),
      componentType: 'GASKET',
      materialCode: 'GSK-EPDM',
      description: 'Continuous High-Density EPDM Glazing Wedge & Sash Gaskets',
      quantity: 6.2,
      unit: 'm',
      wastagePercentage: 5.0,
      grossQuantity: 6.51,
      rate: 95,
      amount: Math.round(6.51 * 95),
      supplierName: 'Seals & Extrusions Lanka',
      priceSource: 'MANUAL_ENTRY',
      priceEffectiveDate: new Date().toISOString().split('T')[0]
    },
    {
      id: crypto.randomUUID(),
      componentType: 'SEALANT',
      materialCode: 'SEAL-SIL',
      description: 'Dow Corning / Bostik Neutral Cure Perimeter Weather Silicone',
      quantity: 0.35,
      unit: 'Tube',
      wastagePercentage: 8.0,
      grossQuantity: 0.378,
      rate: 1100,
      amount: Math.round(0.378 * 1100),
      supplierName: 'Hardware Lanka Ltd',
      priceSource: 'PURCHASE_INVOICE',
      priceEffectiveDate: new Date().toISOString().split('T')[0]
    }
  ];

  const labourItems: BOMLabourItem[] = [
    {
      id: crypto.randomUUID(),
      labourType: 'Fabrication',
      rateBasis: 'M2',
      hoursOrQty: 1.0,
      unitRate: 1450,
      amount: 1450,
      notes: 'Precision mitering, corner crimping, weep hole routing'
    },
    {
      id: crypto.randomUUID(),
      labourType: 'Glazing',
      rateBasis: 'M2',
      hoursOrQty: 1.0,
      unitRate: 650,
      amount: 650,
      notes: 'Glass setting, gasket insertion, setting blocks'
    },
    {
      id: crypto.randomUUID(),
      labourType: 'Installation',
      rateBasis: 'M2',
      hoursOrQty: 1.0,
      unitRate: 1200,
      amount: 1200,
      notes: 'Site leveling, anchoring brackets, perimeter weather caulking'
    }
  ];

  const overheadItems: BOMOverheadCostItem[] = [
    {
      id: 'oh-fac-01',
      code: 'OH-FAC',
      name: 'Factory Workshop & Utilities',
      costType: 'FACTORY_OVERHEAD',
      calculationBasis: 'PERCENT_DIRECT',
      rateOrPercent: 8.0,
      amount: 0,
      description: 'Factory floor rent, three-phase power, tooling wear, indirect shopfloor supervision',
      isIncludedInUnitCost: true
    },
    {
      id: 'oh-adm-02',
      code: 'OH-ADM',
      name: 'Corporate & Engineering Admin',
      costType: 'ADMIN_OVERHEAD',
      calculationBasis: 'PERCENT_DIRECT',
      rateOrPercent: 5.0,
      amount: 0,
      description: 'Shop drawings drafting, QS estimating, procurement & executive administration',
      isIncludedInUnitCost: true
    },
    {
      id: 'oh-eqp-03',
      code: 'OH-EQP',
      name: 'Machinery & CNC Wear',
      costType: 'EQUIPMENT_MACHINERY',
      calculationBasis: 'PERCENT_MATERIALS',
      rateOrPercent: 2.0,
      amount: 0,
      description: 'Double-mitre saw blades, corner crimping dies, CNC routing bits maintenance',
      isIncludedInUnitCost: true
    },
    {
      id: 'oh-log-04',
      code: 'OH-LOG',
      name: 'Site Delivery & Freight',
      costType: 'LOGISTICS_TRANSPORT',
      calculationBasis: 'FIXED_AMOUNT',
      rateOrPercent: 450,
      amount: 450,
      description: 'Cushioned flatbed transport to site, offloading & vertical handling allowance',
      isIncludedInUnitCost: true
    },
    {
      id: 'oh-pkg-05',
      code: 'OH-PKG',
      name: 'Protective Film & Edge Crating',
      costType: 'PACKAGING_PROTECTION',
      calculationBasis: 'PERCENT_MATERIALS',
      rateOrPercent: 1.5,
      amount: 0,
      description: 'Heavy-duty polythene wrapping, cardboard corner caps, timber skids',
      isIncludedInUnitCost: true
    },
    {
      id: 'oh-qc-06',
      code: 'OH-QC',
      name: 'Quality Inspection & Acoustic Testing',
      costType: 'QUALITY_TESTING',
      calculationBasis: 'PERCENT_LABOUR',
      rateOrPercent: 3.5,
      amount: 0,
      description: 'Pre-shipment dimensional check, water spray penetration verification',
      isIncludedInUnitCost: true
    },
    {
      id: 'oh-ctg-07',
      code: 'OH-CTG',
      name: 'Site Unforeseen Contingency',
      costType: 'WASTAGE_CONTINGENCY',
      calculationBasis: 'PERCENT_DIRECT',
      rateOrPercent: 2.0,
      amount: 0,
      description: 'Aperture plumb tolerance buffer, minor site modifications reserve',
      isIncludedInUnitCost: true
    }
  ];

  const initialBOM: VariantBOM = {
    id: crypto.randomUUID(),
    variantId,
    version: 1,
    baseQuantity: 1.0,
    baseUnit,
    components,
    labourItems,
    overheadItems,
    overheadFactoryPercent: 8.0,
    overheadAdminPercent: 5.0,
    contingencyPercent: 2.0,
    directMaterialCost: 0,
    directLabourCost: 0,
    totalDirectCost: 0,
    totalOverheadCost: 0,
    factoryOverheadAmount: 0,
    adminOverheadAmount: 0,
    contingencyAmount: 0,
    totalCost: 0,
    lastCalculated: new Date().toISOString()
  };

  return calculateBOMCosts(initialBOM);
}
