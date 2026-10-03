import { 
  Project, 
  BOQItem, 
  ProductVariant, 
  ProjectActualCostRecord, 
  ProjectPostEvaluationItem, 
  ProjectPostEvaluationSummary,
  StandardCostVarianceBreakdown
} from '../types';

/**
 * Standard Cost Management & Post-Evaluation Calculation Engine
 * Pure mathematical formulas - NO AI dependencies.
 */

export function calculateItemPostEvaluation(
  item: BOQItem,
  itemCostRecords: ProjectActualCostRecord[],
  catalogVariant?: ProductVariant
): ProjectPostEvaluationItem {
  const offeredQty = Math.max(0, item.qty || 1);
  const offeredUnitRate = Math.max(0, item.rate || 0);
  const discountFactor = 1 - (Math.max(0, item.discountPercent || 0) / 100);
  const offeredTotalRevenue = offeredQty * offeredUnitRate * discountFactor;

  // 1. Establish Standard Costs Baseline
  let standardUnitCost = 0;
  let standardMaterialCost = 0;
  let standardLabourCost = 0;
  let standardOverheadCost = 0;

  if (item.costAtTimeOfQuote && item.costAtTimeOfQuote > 0) {
    standardUnitCost = item.costAtTimeOfQuote;
    if (catalogVariant?.bom) {
      const bomTotal = catalogVariant.bom.totalCost || 1;
      standardMaterialCost = (catalogVariant.bom.directMaterialCost / bomTotal) * standardUnitCost * offeredQty;
      standardLabourCost = (catalogVariant.bom.directLabourCost / bomTotal) * standardUnitCost * offeredQty;
      standardOverheadCost = ((catalogVariant.bom.totalOverheadCost || 0) / bomTotal) * standardUnitCost * offeredQty;
    } else {
      standardMaterialCost = standardUnitCost * offeredQty * 0.60;
      standardLabourCost = standardUnitCost * offeredQty * 0.25;
      standardOverheadCost = standardUnitCost * offeredQty * 0.15;
    }
  } else if (catalogVariant?.bom) {
    standardUnitCost = catalogVariant.bom.totalCost;
    standardMaterialCost = catalogVariant.bom.directMaterialCost * offeredQty;
    standardLabourCost = catalogVariant.bom.directLabourCost * offeredQty;
    standardOverheadCost = (catalogVariant.bom.totalOverheadCost || (catalogVariant.bom.factoryOverheadAmount + catalogVariant.bom.adminOverheadAmount)) * offeredQty;
  } else {
    // Sensible standard benchmark based on typical construction industry margin (approx 25% target margin)
    standardUnitCost = offeredUnitRate * 0.75;
    standardMaterialCost = standardUnitCost * offeredQty * 0.62;
    standardLabourCost = standardUnitCost * offeredQty * 0.23;
    standardOverheadCost = standardUnitCost * offeredQty * 0.15;
  }

  const standardTotalCost = standardMaterialCost + standardLabourCost + standardOverheadCost;
  const standardGrossProfit = offeredTotalRevenue - standardTotalCost;
  const standardMarginPercent = offeredTotalRevenue > 0 
    ? (standardGrossProfit / offeredTotalRevenue) * 100 
    : 0;

  // Current market standard from updated variant in catalog (to detect standard cost drift / inflation)
  const currentMarketStandardUnitCost = catalogVariant?.bom?.totalCost;
  const standardCostCreep = currentMarketStandardUnitCost 
    ? (currentMarketStandardUnitCost - standardUnitCost) * offeredQty 
    : 0;

  // 2. Aggregate Actual Costs from Records
  let actualMaterialCost = 0;
  let actualLabourCost = 0;
  let actualOverheadCost = 0;
  let actualOtherCost = 0;
  let totalActualMaterialQty = 0;
  let totalActualLabourHours = 0;

  itemCostRecords.forEach(rec => {
    const amt = Number(rec.totalActualCost) || 0;
    switch (rec.costCategory) {
      case 'MATERIAL':
        actualMaterialCost += amt;
        totalActualMaterialQty += Number(rec.quantity) || 0;
        break;
      case 'LABOUR':
        actualLabourCost += amt;
        totalActualLabourHours += Number(rec.quantity) || 0;
        break;
      case 'OVERHEAD':
        actualOverheadCost += amt;
        break;
      case 'SUBCONTRACT':
      case 'EQUIPMENT':
      case 'OTHER':
      default:
        actualOtherCost += amt;
        break;
    }
  });

  const actualTotalCost = actualMaterialCost + actualLabourCost + actualOverheadCost + actualOtherCost;
  const actualUnitCost = offeredQty > 0 ? actualTotalCost / offeredQty : actualTotalCost;
  const actualGrossProfit = offeredTotalRevenue - actualTotalCost;
  const actualMarginPercent = offeredTotalRevenue > 0 
    ? (actualGrossProfit / offeredTotalRevenue) * 100 
    : 0;
  const marginVariancePercent = actualMarginPercent - standardMarginPercent;
  const costVarianceAmount = standardTotalCost - actualTotalCost; // Positive = Favorable
  const costVariancePercent = standardTotalCost > 0 
    ? (costVarianceAmount / standardTotalCost) * 100 
    : 0;

  // 3. Decompose Standard Cost Variances (Standard Costing Accounting Techniques)
  // Direct Materials:
  const materialCostVariance = standardMaterialCost - actualMaterialCost;
  // If actual purchases have price/quantity entries, calculate MPV and MUV precisely
  let materialPriceVariance = 0;
  let materialUsageVariance = 0;
  if (totalActualMaterialQty > 0 && actualMaterialCost > 0) {
    const avgActualMatRate = actualMaterialCost / totalActualMaterialQty;
    const stdMatUnitRate = offeredQty > 0 ? standardMaterialCost / offeredQty : standardMaterialCost;
    // MPV = (Standard Rate - Actual Rate) * Actual Quantity
    materialPriceVariance = (stdMatUnitRate - avgActualMatRate) * totalActualMaterialQty;
    // MUV = (Standard Quantity - Actual Quantity) * Standard Rate
    materialUsageVariance = (offeredQty - totalActualMaterialQty) * stdMatUnitRate;
  } else {
    // Proportional heuristic decomposition when quantities are unrecorded
    materialPriceVariance = materialCostVariance * 0.65;
    materialUsageVariance = materialCostVariance * 0.35;
  }

  // Direct Labour:
  const labourCostVariance = standardLabourCost - actualLabourCost;
  let labourRateVariance = 0;
  let labourEfficiencyVariance = 0;
  if (totalActualLabourHours > 0 && actualLabourCost > 0) {
    const avgActualLabourRate = actualLabourCost / totalActualLabourHours;
    const stdLabourRate = 1800; // Standard nominal trade rate per hour (LKR)
    const stdAllowedHours = standardLabourCost / stdLabourRate;
    labourRateVariance = (stdLabourRate - avgActualLabourRate) * totalActualLabourHours;
    labourEfficiencyVariance = (stdAllowedHours - totalActualLabourHours) * stdLabourRate;
  } else {
    labourRateVariance = labourCostVariance * 0.40;
    labourEfficiencyVariance = labourCostVariance * 0.60;
  }

  // Overheads:
  const overheadCostVariance = standardOverheadCost - actualOverheadCost;
  const overheadSpendingVariance = overheadCostVariance * 0.70; // Expenditure variance
  const overheadVolumeVariance = overheadCostVariance * 0.30;   // Absorption variance

  const variances: StandardCostVarianceBreakdown = {
    standardMaterialCost,
    actualMaterialCost,
    materialCostVariance,
    materialPriceVariance,
    materialUsageVariance,
    standardLabourCost,
    actualLabourCost,
    labourCostVariance,
    labourRateVariance,
    labourEfficiencyVariance,
    standardOverheadCost,
    actualOverheadCost,
    overheadCostVariance,
    overheadSpendingVariance,
    overheadVolumeVariance,
    actualOtherCost,
    adHocUnbudgetedCost: actualOtherCost,
    totalStandardCost: standardTotalCost,
    totalActualCost: actualTotalCost,
    netTotalVariance: costVarianceAmount,
    netVariancePercent: costVariancePercent,
    isFavorable: costVarianceAmount >= 0
  };

  // Health Status Evaluation
  let healthStatus: ProjectPostEvaluationItem['healthStatus'] = 'ON_TRACK';
  if (actualTotalCost === 0) {
    healthStatus = 'ON_TRACK';
  } else if (actualMarginPercent >= standardMarginPercent) {
    healthStatus = 'EXCELLENT';
  } else if (actualMarginPercent >= standardMarginPercent - 3) {
    healthStatus = 'ON_TRACK';
  } else if (actualMarginPercent >= 0) {
    healthStatus = 'WARNING';
  } else {
    healthStatus = 'CRITICAL_OVERRUN';
  }

  return {
    id: item.id,
    itemId: item.id,
    itemNo: item.no || '1.0',
    name: item.name || 'Unnamed Item',
    description: item.description,
    variantId: item.variantId,
    variantCode: item.variantCode || catalogVariant?.variantCode,
    category: item.category || 'General',
    unit: item.unit || 'sqft',
    offeredQty,
    actualQty: totalActualMaterialQty || offeredQty,
    offeredUnitRate,
    offeredTotalRevenue,
    standardUnitCost,
    standardTotalCost,
    standardMaterialCost,
    standardLabourCost,
    standardOverheadCost,
    standardGrossProfit,
    standardMarginPercent,
    currentMarketStandardUnitCost,
    standardCostCreep,
    actualTotalCost,
    actualMaterialCost,
    actualLabourCost,
    actualOverheadCost,
    actualOtherCost,
    actualUnitCost,
    actualGrossProfit,
    actualMarginPercent,
    marginVariancePercent,
    costVarianceAmount,
    costVariancePercent,
    variances,
    variationStatus: item.variationStatus || 'Original',
    isAdHocItem: !item.variantId && !item.costAtTimeOfQuote,
    healthStatus,
    costRecordsCount: itemCostRecords.length
  };
}

export function calculateProjectPostEvaluationSummary(
  project: Project,
  allProjectCostRecords: ProjectActualCostRecord[],
  catalogVariants: ProductVariant[]
): {
  summary: ProjectPostEvaluationSummary;
  items: ProjectPostEvaluationItem[];
  unassignedCostRecords: ProjectActualCostRecord[];
} {
  const variantMap = new Map<string, ProductVariant>();
  catalogVariants.forEach(v => {
    variantMap.set(v.id, v);
    if (v.variantCode) variantMap.set(v.variantCode, v);
  });

  const validItems = (project.items || []).filter(it => it.itemType !== 'Title');
  const assignedItemIds = new Set(validItems.map(it => it.id));

  // Partition cost records into item-linked and project-wide / ad-hoc records
  const itemCostRecordsMap = new Map<string, ProjectActualCostRecord[]>();
  const unassignedCostRecords: ProjectActualCostRecord[] = [];

  allProjectCostRecords.forEach(rec => {
    if (rec.projectItemId && assignedItemIds.has(rec.projectItemId)) {
      const existing = itemCostRecordsMap.get(rec.projectItemId) || [];
      existing.push(rec);
      itemCostRecordsMap.set(rec.projectItemId, existing);
    } else {
      unassignedCostRecords.push(rec);
    }
  });

  // Calculate evaluation for each item
  const evaluatedItems: ProjectPostEvaluationItem[] = validItems.map(item => {
    const records = itemCostRecordsMap.get(item.id) || [];
    const variant = (item.variantId && variantMap.get(item.variantId)) 
      || (item.variantCode && variantMap.get(item.variantCode));
    return calculateItemPostEvaluation(item, records, variant);
  });

  // Totals initialization
  let totalOfferedRevenue = 0;
  let totalStandardCost = 0;
  let totalActualItemCosts = 0;
  let totalMaterialStandardCost = 0;
  let totalMaterialActualCost = 0;
  let totalLabourStandardCost = 0;
  let totalLabourActualCost = 0;
  let totalOverheadStandardCost = 0;
  let totalOverheadActualCost = 0;
  let totalOtherActualCost = 0;
  let materialPriceVariance = 0;
  let materialUsageVariance = 0;
  let labourRateVariance = 0;
  let labourEfficiencyVariance = 0;
  let overheadSpendingVariance = 0;

  evaluatedItems.forEach(it => {
    // Only sum active (Original or Additional) items, omitted items are excluded from active scope
    if (it.variationStatus !== 'Omitted') {
      totalOfferedRevenue += it.offeredTotalRevenue;
      totalStandardCost += it.standardTotalCost;
      totalActualItemCosts += it.actualTotalCost;
      totalMaterialStandardCost += it.standardMaterialCost;
      totalMaterialActualCost += it.actualMaterialCost;
      totalLabourStandardCost += it.standardLabourCost;
      totalLabourActualCost += it.actualLabourCost;
      totalOverheadStandardCost += it.standardOverheadCost;
      totalOverheadActualCost += it.actualOverheadCost;
      totalOtherActualCost += it.actualOtherCost;

      materialPriceVariance += it.variances.materialPriceVariance;
      materialUsageVariance += it.variances.materialUsageVariance;
      labourRateVariance += it.variances.labourRateVariance;
      labourEfficiencyVariance += it.variances.labourEfficiencyVariance;
      overheadSpendingVariance += it.variances.overheadSpendingVariance;
    }
  });

  // Add project-level unassigned / ad-hoc cost records
  let totalAdHocCosts = 0;
  unassignedCostRecords.forEach(rec => {
    const amt = Number(rec.totalActualCost) || 0;
    totalAdHocCosts += amt;
    switch (rec.costCategory) {
      case 'MATERIAL':
        totalMaterialActualCost += amt;
        break;
      case 'LABOUR':
        totalLabourActualCost += amt;
        break;
      case 'OVERHEAD':
        totalOverheadActualCost += amt;
        break;
      default:
        totalOtherActualCost += amt;
        break;
    }
  });

  const totalActualCost = totalActualItemCosts + totalAdHocCosts;
  const netCostVariance = totalStandardCost - totalActualCost; // Standard - Actual (Positive = Favorable)
  const variancePercentage = totalStandardCost > 0 
    ? (netCostVariance / totalStandardCost) * 100 
    : 0;

  const standardGrossProfit = totalOfferedRevenue - totalStandardCost;
  const standardMarginPercent = totalOfferedRevenue > 0 
    ? (standardGrossProfit / totalOfferedRevenue) * 100 
    : 0;

  const actualGrossProfit = totalOfferedRevenue - totalActualCost;
  const actualMarginPercent = totalOfferedRevenue > 0 
    ? (actualGrossProfit / totalOfferedRevenue) * 100 
    : 0;

  const marginErosionPercent = actualMarginPercent - standardMarginPercent;
  const costToOfferRatio = totalOfferedRevenue > 0 
    ? (totalActualCost / totalOfferedRevenue) * 100 
    : 0;

  // Break-even revenue needed to cover actual incurred costs maintaining standard margin
  const breakEvenRevenue = standardMarginPercent < 100 
    ? totalActualCost / (1 - (standardMarginPercent / 100)) 
    : totalActualCost;

  let evaluationHealth: ProjectPostEvaluationSummary['evaluationHealth'] = 'HEALTHY';
  if (totalActualCost > totalStandardCost * 1.10 || actualMarginPercent < standardMarginPercent - 5) {
    evaluationHealth = 'HIGH_OVERRUN';
  } else if (totalActualCost > totalStandardCost || actualMarginPercent < standardMarginPercent) {
    evaluationHealth = 'MODERATE_RISK';
  } else {
    evaluationHealth = 'HEALTHY';
  }

  const summary: ProjectPostEvaluationSummary = {
    projectId: project.id,
    projectName: project.projectName || 'Untitled Project',
    clientName: project.client?.name || 'Valued Client',
    projectStatus: project.status || 'In Progress',
    totalItemsCount: evaluatedItems.length,
    totalOfferedRevenue,
    totalStandardCost,
    totalActualCost,
    netCostVariance,
    variancePercentage,
    isFavorable: netCostVariance >= 0,
    standardGrossProfit,
    standardMarginPercent,
    actualGrossProfit,
    actualMarginPercent,
    marginErosionPercent,
    totalMaterialStandardCost,
    totalMaterialActualCost,
    materialVariance: totalMaterialStandardCost - totalMaterialActualCost,
    totalLabourStandardCost,
    totalLabourActualCost,
    labourVariance: totalLabourStandardCost - totalLabourActualCost,
    totalOverheadStandardCost,
    totalOverheadActualCost,
    overheadVariance: totalOverheadStandardCost - totalOverheadActualCost,
    totalOtherActualCost,
    totalAdHocCosts,
    materialPriceVariance,
    materialUsageVariance,
    labourRateVariance,
    labourEfficiencyVariance,
    overheadSpendingVariance,
    costToOfferRatio,
    breakEvenRevenue,
    evaluationHealth
  };

  return { summary, items: evaluatedItems, unassignedCostRecords };
}

/**
 * Generates realistic initial actual cost records for existing projects so users can immediately
 * experience and test the Post-Evaluation Engine with rich variances and analytics.
 */
export function generateSeedActualCostRecords(projects: Project[]): ProjectActualCostRecord[] {
  const records: ProjectActualCostRecord[] = [];

  projects.forEach((proj, pIdx) => {
    const items = (proj.items || []).filter(i => i.itemType !== 'Title');
    
    items.forEach((item, iIdx) => {
      const offeredRate = item.rate || 2500;
      const qty = item.qty || 10;
      const nominalCost = offeredRate * qty * 0.72;

      // Generate Material Actual Record
      const matStd = nominalCost * 0.60;
      // Inject slight realistic variance: item 0 slightly cheaper (Favorable), item 1 slight price rise (Unfavorable)
      const matVarianceFactor = (pIdx + iIdx) % 3 === 0 ? 0.94 : (pIdx + iIdx) % 3 === 1 ? 1.08 : 1.02;
      const actualMatCost = Math.round(matStd * matVarianceFactor);

      records.push({
        id: `rec-mat-${proj.id}-${item.id}`,
        projectId: proj.id,
        projectItemId: item.id,
        itemName: item.name,
        costCategory: 'MATERIAL',
        costType: 'Aluminium Extrusion & Hardware Invoices',
        description: `Batch production materials for ${item.name}`,
        invoiceOrReceiptNo: `PO-AL-${2026}-${100 + iIdx}`,
        supplierOrPayee: iIdx % 2 === 0 ? 'Alumex PLC' : 'Swisstek Aluminium',
        date: new Date(Date.now() - (15 - iIdx * 2) * 86400000).toISOString().split('T')[0],
        quantity: qty,
        unit: item.unit || 'sqft',
        unitRate: Math.round(actualMatCost / qty),
        totalActualCost: actualMatCost,
        standardReferenceCost: Math.round(matStd),
        notes: matVarianceFactor > 1 ? 'Supplier raw ingot price surcharge +8%' : 'Procured at volume discount -6%',
        paymentStatus: 'Paid'
      });

      // Generate Labour Actual Record
      const labStd = nominalCost * 0.25;
      const labVarianceFactor = (pIdx + iIdx) % 2 === 0 ? 1.04 : 0.96;
      const actualLabCost = Math.round(labStd * labVarianceFactor);

      records.push({
        id: `rec-lab-${proj.id}-${item.id}`,
        projectId: proj.id,
        projectItemId: item.id,
        itemName: item.name,
        costCategory: 'LABOUR',
        costType: 'Fabrication & Site Installation Wages',
        description: `Factory cutting, joinery and on-site fitting team for ${item.name}`,
        invoiceOrReceiptNo: `TS-${2026}-${400 + iIdx}`,
        supplierOrPayee: 'Master Technicians Fitting Crew',
        date: new Date(Date.now() - (10 - iIdx * 2) * 86400000).toISOString().split('T')[0],
        quantity: Math.round(qty * 1.5),
        unit: 'Hours',
        unitRate: 1850,
        totalActualCost: actualLabCost,
        standardReferenceCost: Math.round(labStd),
        notes: 'Overtime hours recorded during tight milestone delivery',
        paymentStatus: 'Approved'
      });

      // Generate Overhead/Machinery Record
      const ohStd = nominalCost * 0.15;
      const actualOhCost = Math.round(ohStd * 1.01);
      records.push({
        id: `rec-oh-${proj.id}-${item.id}`,
        projectId: proj.id,
        projectItemId: item.id,
        itemName: item.name,
        costCategory: 'OVERHEAD',
        costType: 'Scaffolding & Rigging Access',
        description: `External mobile tower scaffolding rental & site logistics`,
        invoiceOrReceiptNo: `EQ-SCF-${900 + iIdx}`,
        supplierOrPayee: 'Apex Site Logistics Ltd',
        date: new Date(Date.now() - (6 - iIdx * 2) * 86400000).toISOString().split('T')[0],
        quantity: 1,
        unit: 'Lot',
        unitRate: actualOhCost,
        totalActualCost: actualOhCost,
        standardReferenceCost: Math.round(ohStd),
        notes: 'Site access tower rental',
        paymentStatus: 'Paid'
      });
    });

    // Add 1 Unbudgeted / Ad-hoc Cost Record per project (e.g. site hoisting permit or unexpected glass handling)
    records.push({
      id: `rec-adhoc-${proj.id}`,
      projectId: proj.id,
      costCategory: 'OTHER',
      costType: 'Unbudgeted Site Craneage & Crane Permit',
      description: 'Emergency hoist crane required for oversized 12mm glass panels through 4th floor void',
      invoiceOrReceiptNo: `AD-HOC-${770 + pIdx}`,
      supplierOrPayee: 'Colombo Crane & Heavy Lift Services',
      date: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
      quantity: 1,
      unit: 'Day',
      unitRate: 45000,
      totalActualCost: 45000,
      isAdHocCostItem: true,
      notes: 'Unbudgeted client site condition - initiated variation claim with QS',
      paymentStatus: 'Pending'
    });
  });

  return records;
}
