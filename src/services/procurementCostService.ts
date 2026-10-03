import { 
  ProcurementCostItem, 
  ProcurementCostCategory, 
  ProcurementCostClassification,
  ProcurementItemVariant, 
  ItemSupplierRate,
  CostItemDependencyLink,
  CostCategoryDefinition,
  CostItemRateHistory
} from '../types/procurement';

const STORAGE_KEY = 'innovista_procurement_cost_items_v2';
const CATEGORIES_STORAGE_KEY = 'innovista_procurement_cost_categories_v2';
const HISTORY_STORAGE_KEY = 'innovista_procurement_cost_history_v2';

export const SEED_RATE_HISTORY: CostItemRateHistory[] = [
  {
    id: 'rh-001',
    costItemId: 'cst-mat-001',
    itemCode: 'PR-MAT-6063',
    itemName: 'Architectural Aluminium Profile 6063-T6 Extrusions',
    supplierId: 'sup-002',
    supplierName: 'Alucobond Architectural Panels Ltd',
    previousRate: 1390,
    newRate: 1450,
    currency: 'LKR',
    effectiveDate: '2026-08-01',
    reason: 'Global LME Aluminium Billet Commodity Price Index Adjustment (+4.3%)',
    changedBy: 'Procurement Director (Auto-Index)',
    notes: 'Volume tier price schedule revised for Q3 contracts.'
  },
  {
    id: 'rh-002',
    costItemId: 'cst-mat-002',
    itemCode: 'PR-MAT-DGU-28',
    itemName: 'High Performance Double Glazed Unit (DGU) 28mm Neutral',
    supplierId: 'sup-005',
    supplierName: 'Gulf Glass Industries (GGI)',
    previousRate: 4950,
    newRate: 4800,
    currency: 'LKR',
    effectiveDate: '2026-08-01',
    reason: 'Annual Volume Commitment Tier Discount (-3.0%)',
    changedBy: 'Strategic Sourcing Manager',
    notes: 'Secured bulk pricing for Altair Tower curtain wall package.'
  },
  {
    id: 'rh-003',
    costItemId: 'cst-srv-001',
    itemCode: 'PR-OUT-PC-CL2',
    itemName: 'Outside Service: Architectural Powder Coating Qualicoat Class 2',
    supplierId: 'sup-003',
    supplierName: 'Emirates Glass Processing Co',
    previousRate: 430,
    newRate: 450,
    currency: 'LKR',
    effectiveDate: '2026-08-15',
    reason: 'Thermosetting Polyester Resin & Energy Surcharge',
    changedBy: 'Senior Estimator',
    notes: 'Updated pre-treatment chemical pass-through cost.'
  },
  {
    id: 'rh-004',
    costItemId: 'cst-sub-001',
    itemCode: 'PR-SUB-CW-CREW',
    itemName: 'Subcontractor Labour: Certified Curtain Wall Installation Gang',
    supplierId: 'sup-006',
    supplierName: 'Sigma Fasteners & Anchors LLC',
    previousRate: 1800,
    newRate: 1850,
    currency: 'LKR',
    effectiveDate: '2026-09-01',
    reason: 'HSE Working-at-Height Certified Rigger Statutory Wage Revision',
    changedBy: 'Site Operations Director',
    notes: 'Includes all mandatory workmen compensation insurance.'
  }
];

export const SEED_COST_CATEGORIES: CostCategoryDefinition[] = [
  {
    id: 'cc-raw-mat',
    name: 'Raw Materials & Consumables',
    code: 'RAW_MAT',
    classification: 'RAW_MATERIAL',
    description: 'Extrusions, architectural glass sheets, stainless fasteners, gaskets, and structural silicones.',
    icon: 'Layers',
    subCategories: [
      'Extrusions & Billet Alloys',
      'Architectural Glazing',
      'Hardware & Locks',
      'Fasteners & Anchors',
      'EPDM Gaskets & Weatherseals',
      'Structural Sealants & Silicones',
      'Steel Brackets & Embeds'
    ]
  },
  {
    id: 'cc-outside-srv',
    name: 'Outside Services Rendered',
    code: 'OUT_SRV',
    classification: 'OUTSIDE_SERVICE',
    description: 'External specialized treatments, surface finishing, heat treating, and certified lab testing.',
    icon: 'Wrench',
    subCategories: [
      'Architectural Powder Coating',
      'Anodizing & Surface Passivation',
      'CNC Profile Machining & Notching',
      'Glass Toughening & Heat Soak',
      'Glass Lamination (PVB/SentryGlas)',
      'Third-Party CWCT Testing'
    ]
  },
  {
    id: 'cc-subcon-lab',
    name: 'Subcontractor Services & Labour',
    code: 'SUBCON_LAB',
    classification: 'SUBCONTRACTOR_LABOUR',
    description: 'Contracted site installation gangs, sealant applicators, crane riggers, and specialist crews.',
    icon: 'Users',
    subCategories: [
      'Curtain Wall Installation Crew',
      'Structural Silicone Applicators',
      'Glass Lifting & Crane Gang',
      'Site Survey & 3D Laser Scanning',
      'Bench Assembly Labour',
      'QA/QC Independent Inspection'
    ]
  },
  {
    id: 'cc-equip-plant',
    name: 'Equipment & Plant Rental',
    code: 'EQUIP_PLANT',
    classification: 'EQUIPMENT_PLANT',
    description: 'Heavy machinery, access plant, BMU suspended cradles, spider cranes, and generators.',
    icon: 'Box',
    subCategories: [
      'Suspended Cradle (BMU)',
      'Scissor Lift (Diesel/Electric)',
      'Spider Crane & Vacuum Lifter',
      'Site Power Generators',
      'Scaffolding & Access Towers'
    ]
  },
  {
    id: 'cc-log-trans',
    name: 'Logistics, Freight & Contracts',
    code: 'LOG_TRANS',
    classification: 'LOGISTICS_CONTRACT',
    description: 'Flatbed transportation, sea freight, container port clearance, and site offloading logistics.',
    icon: 'Truck',
    subCategories: [
      'Heavy Flatbed Trailer Haulage',
      '40ft Container Port Drayage',
      'Export Wooden Crating',
      'Site Mobile Crane Offloading',
      'Insurance & Customs Clearance'
    ]
  }
];

export const SEED_PROCUREMENT_COST_ITEMS: ProcurementCostItem[] = [
  // 1. MATERIAL: Extrusions 6063
  {
    id: 'cst-mat-001',
    itemCode: 'PR-MAT-6063',
    name: 'Architectural Aluminium Profile 6063-T6 Extrusions',
    category: 'Materials',
    subCategory: 'Extrusions & Billet Alloys',
    classification: 'RAW_MATERIAL',
    description: 'High tensile structural curtain wall transom and mullion extrusions conforming to EN 755-9 and ASTM B221.',
    primaryUnit: 'kg',
    projectId: 'proj-altair-01',
    projectCode: 'PRJ-2026-001',
    projectName: 'Altair Tower - Luxury Façade & Glazing Package',
    linkedQuoteId: 'q-101',
    linkedQuoteNo: 'QT-2026-001',
    boqItemId: 'boq-001',
    boqItemCode: 'AL-WD-001',
    linkedPoId: 'po-101',
    linkedPoNumber: 'PO-2026-0441',
    benchmarkCost: 1450,
    currency: 'LKR',
    status: 'Active',
    specificationRef: 'ASTM B221 / EN 755-9',
    hsnSacCode: '7604.29',
    qualityStandard: 'ASTM B221 / EN 755-9 High Precision Class',
    inspectionLevel: 'Mill Test Certificate (MTC 3.1) & Dimensional Check',
    storageCondition: 'Covered Dry Warehouse on Timber Bearers',
    barcode: '8901234001017',
    notes: 'Primary structural framing extrusion for 70mm and 100mm sliding and casement systems.',
    createdAt: '2026-08-10T08:00:00Z',
    updatedAt: '2026-09-20T12:00:00Z',
    linkedDependencies: [
      {
        id: 'dep-001',
        targetType: 'PRODUCT_VARIANT',
        targetId: 'var-70-2w-001',
        targetCode: 'AL-WIN-70-2W-001',
        targetName: '70mm 2-Way Sliding Window (2-Panel, 5mm Clear, White PC)',
        categoryName: 'Sliding Windows (2-Track)',
        bomRole: 'PROFILE',
        usageFormula: '3.8 kg / m²',
        unitConsumption: 3.8,
        currentVariantCost: 12380,
        currentVariantSellingPrice: 19500,
        costContribution: 5510,
        costImpactPercent: 44.5,
        lastSyncedAt: '2026-09-24T10:00:00Z'
      },
      {
        id: 'dep-002',
        targetType: 'PRODUCT_VARIANT',
        targetId: 'var-70-2w-002',
        targetCode: 'AL-WIN-70-2W-002',
        targetName: '70mm 2-Way Sliding Window (2-Panel, 6mm Clear, White PC, HD Rollers)',
        categoryName: 'Sliding Windows (2-Track)',
        bomRole: 'PROFILE',
        usageFormula: '3.8 kg / m²',
        unitConsumption: 3.8,
        currentVariantCost: 13950,
        currentVariantSellingPrice: 21800,
        costContribution: 5510,
        costImpactPercent: 39.5,
        lastSyncedAt: '2026-09-24T10:00:00Z'
      },
      {
        id: 'dep-003',
        targetType: 'PRODUCT_VARIANT',
        targetId: 'var-swisstek-100-3w',
        targetCode: 'AL-WIN-100-3W-001',
        targetName: 'Swisstek 100mm 3-Way Heavy Duty Sliding Window (6-Panel DGU)',
        categoryName: 'Sliding Windows (3-Track)',
        bomRole: 'PROFILE',
        usageFormula: '5.2 kg / m²',
        unitConsumption: 5.2,
        currentVariantCost: 24500,
        currentVariantSellingPrice: 36000,
        costContribution: 7540,
        costImpactPercent: 30.8,
        lastSyncedAt: '2026-09-24T10:00:00Z'
      }
    ],
    variants: [
      {
        id: 'var-mat-001-1',
        variantCode: 'AL-6063-MF-30',
        name: 'Mill Finish / 3.0mm Structural Wall',
        sku: 'EXT-6063-MF-30',
        attributes: {
          'Surface Finish': 'Mill Finish Uncoated',
          'Wall Thickness': '3.0 mm',
          'Alloy Grade': '6063-T6 Temper',
          'Weight / Meter': '3.42 kg/m'
        },
        unit: 'kg',
        standardCost: 1420,
        supplierRates: [
          {
            id: 'sr-001',
            supplierId: 'sup-002',
            supplierName: 'Alucobond Architectural Panels Ltd',
            vendorCode: 'VND-ALU-02',
            currency: 'LKR',
            baseRate: 1450,
            minimumOrderQty: 50,
            leadTimeDays: 14,
            rating: 4.8,
            isPreferred: true,
            effectiveDate: '2026-08-01',
            taxRatePercent: 5,
            priceRanges: [
              { minQty: 1, maxQty: 50, unitPrice: 1520, leadTimeDays: 14, notes: 'Small custom die order' },
              { minQty: 51, maxQty: 200, unitPrice: 1450, leadTimeDays: 12, notes: 'Standard stock batch' },
              { minQty: 201, maxQty: 1000, unitPrice: 1380, leadTimeDays: 10, notes: 'Production volume run' },
              { minQty: 1001, unitPrice: 1310, leadTimeDays: 8, notes: 'Direct billet extrude campaign' }
            ]
          },
          {
            id: 'sr-002',
            supplierId: 'sup-004',
            supplierName: 'Hilti Middle East FZE',
            vendorCode: 'VND-HLT-04',
            currency: 'LKR',
            baseRate: 1490,
            minimumOrderQty: 100,
            leadTimeDays: 18,
            rating: 4.6,
            isPreferred: false,
            effectiveDate: '2026-08-15',
            priceRanges: [
              { minQty: 1, maxQty: 100, unitPrice: 1560, leadTimeDays: 18, notes: 'Standard small lot' },
              { minQty: 101, maxQty: 500, unitPrice: 1490, leadTimeDays: 15, notes: 'Medium contractor tier' },
              { minQty: 501, unitPrice: 1410, leadTimeDays: 12, notes: 'Wholesale container batch' }
            ]
          }
        ]
      },
      {
        id: 'var-mat-001-2',
        variantCode: 'AL-6063-SLV-25U',
        name: 'Natural Matt Silver Anodized 25µm',
        sku: 'EXT-6063-SLV-25U',
        attributes: {
          'Surface Finish': 'Class 1 Anodized 25 Micron',
          'Wall Thickness': '3.2 mm',
          'Alloy Grade': '6063-T6 Temper',
          'Weight / Meter': '3.65 kg/m'
        },
        unit: 'kg',
        standardCost: 1680,
        supplierRates: [
          {
            id: 'sr-003',
            supplierId: 'sup-002',
            supplierName: 'Alucobond Architectural Panels Ltd',
            vendorCode: 'VND-ALU-02',
            currency: 'LKR',
            baseRate: 1680,
            minimumOrderQty: 50,
            leadTimeDays: 16,
            rating: 4.8,
            isPreferred: true,
            effectiveDate: '2026-08-01',
            priceRanges: [
              { minQty: 1, maxQty: 50, unitPrice: 1750, leadTimeDays: 16 },
              { minQty: 51, maxQty: 250, unitPrice: 1680, leadTimeDays: 14 },
              { minQty: 251, unitPrice: 1590, leadTimeDays: 12 }
            ]
          }
        ]
      }
    ],
    supplierRates: [
      {
        id: 'sr-gen-01',
        supplierId: 'sup-002',
        supplierName: 'Alucobond Architectural Panels Ltd',
        vendorCode: 'VND-ALU-02',
        currency: 'LKR',
        baseRate: 1450,
        minimumOrderQty: 50,
        leadTimeDays: 14,
        rating: 4.8,
        isPreferred: true,
        effectiveDate: '2026-08-01',
        priceRanges: [
          { minQty: 1, maxQty: 50, unitPrice: 1520, leadTimeDays: 14, notes: 'Small run' },
          { minQty: 51, maxQty: 200, unitPrice: 1450, leadTimeDays: 12, notes: 'Standard MOQ' },
          { minQty: 201, maxQty: 1000, unitPrice: 1380, leadTimeDays: 10, notes: 'High volume' },
          { minQty: 1001, unitPrice: 1310, leadTimeDays: 8, notes: 'Bulk mill contract' }
        ]
      },
      {
        id: 'sr-gen-02',
        supplierId: 'sup-004',
        supplierName: 'Hilti Middle East FZE',
        vendorCode: 'VND-HLT-04',
        currency: 'LKR',
        baseRate: 1490,
        minimumOrderQty: 100,
        leadTimeDays: 18,
        rating: 4.6,
        isPreferred: false,
        effectiveDate: '2026-08-15',
        priceRanges: [
          { minQty: 1, maxQty: 100, unitPrice: 1560, leadTimeDays: 18 },
          { minQty: 101, maxQty: 500, unitPrice: 1490, leadTimeDays: 15 },
          { minQty: 501, unitPrice: 1410, leadTimeDays: 12 }
        ]
      }
    ]
  },

  // 2. MATERIAL: High Performance Low-E DGU Glass
  {
    id: 'cst-mat-002',
    itemCode: 'PR-MAT-GLS-DGU',
    name: 'High Performance Low-E Double Glazed Units (DGU)',
    category: 'Materials',
    subCategory: 'Architectural Glazing',
    classification: 'RAW_MATERIAL',
    description: '28mm (8mm Solar Control Toughened + 12mm Argon Spacer 90% + 8mm Low-E HST Clear). U-Value <= 1.3 W/m²K, SHGC <= 0.28.',
    primaryUnit: 'm²',
    projectId: 'proj-cinnamon-02',
    projectCode: 'PRJ-2026-002',
    projectName: 'Cinnamon Life Suites - Acoustic Glazing & Partitions',
    linkedQuoteId: 'q-102',
    linkedQuoteNo: 'QT-2026-002',
    boqItemId: 'boq-002',
    boqItemCode: 'GL-PT-001',
    linkedPoId: 'po-102',
    linkedPoNumber: 'PO-2026-0442',
    benchmarkCost: 4800,
    currency: 'LKR',
    status: 'Active',
    specificationRef: 'ASTM C1036 / EN 1279 Gas Filled',
    hsnSacCode: '7008.00',
    qualityStandard: 'EN 1279 CE Marked Dual-Seal Hermetic',
    inspectionLevel: 'Gas Concentration Sensor Test & Surface Flatness Roll-wave',
    storageCondition: 'A-Frame Glass Racks in Shaded Zone',
    barcode: '8901234002021',
    notes: 'Acoustic RW+Ctr >= 40dB for sound dampening.',
    createdAt: '2026-08-12T09:00:00Z',
    updatedAt: '2026-09-18T15:00:00Z',
    linkedDependencies: [
      {
        id: 'dep-gls-01',
        targetType: 'PRODUCT_VARIANT',
        targetId: 'var-70-2w-001',
        targetCode: 'AL-WIN-70-2W-001',
        targetName: '70mm 2-Way Sliding Window (2-Panel, 5mm Clear, White PC)',
        categoryName: 'Sliding Windows (2-Track)',
        bomRole: 'GLASS',
        usageFormula: '0.92 m² / m²',
        unitConsumption: 0.92,
        currentVariantCost: 12380,
        currentVariantSellingPrice: 19500,
        costContribution: 2200,
        costImpactPercent: 17.8,
        lastSyncedAt: '2026-09-24T10:00:00Z'
      },
      {
        id: 'dep-gls-02',
        targetType: 'PRODUCT_VARIANT',
        targetId: 'var-70-2w-002',
        targetCode: 'AL-WIN-70-2W-002',
        targetName: '70mm 2-Way Sliding Window (2-Panel, 6mm Clear, White PC, HD Rollers)',
        categoryName: 'Sliding Windows (2-Track)',
        bomRole: 'GLASS',
        usageFormula: '0.92 m² / m²',
        unitConsumption: 0.92,
        currentVariantCost: 13950,
        currentVariantSellingPrice: 21800,
        costContribution: 2800,
        costImpactPercent: 20.1,
        lastSyncedAt: '2026-09-24T10:00:00Z'
      }
    ],
    variants: [
      {
        id: 'var-gls-001',
        variantCode: 'DGU-28-CLR',
        name: '28mm Neutral Clear 70/35 Solar Control',
        sku: 'GLS-DGU-28-NEU',
        attributes: {
          'Make-up': '8mm Toughened + 12mm Argon + 8mm Low-E HST',
          'Visible Light Transmission': '68%',
          'Solar Factor (g)': '0.34',
          'Edge Sealant': 'Dual Seal Structural Silicone (DOW 983)'
        },
        unit: 'm²',
        standardCost: 4800,
        supplierRates: []
      }
    ],
    supplierRates: [
      {
        id: 'sr-gls-01',
        supplierId: 'sup-005',
        supplierName: 'Gulf Glass Industries (GGI)',
        vendorCode: 'VND-GGI-05',
        currency: 'LKR',
        baseRate: 4800,
        minimumOrderQty: 25,
        leadTimeDays: 21,
        rating: 4.9,
        isPreferred: true,
        effectiveDate: '2026-08-01',
        priceRanges: [
          { minQty: 1, maxQty: 25, unitPrice: 5200, leadTimeDays: 21, notes: 'Sample / prototype batch' },
          { minQty: 26, maxQty: 100, unitPrice: 4800, leadTimeDays: 18, notes: 'Standard MOQ production tier' },
          { minQty: 101, maxQty: 500, unitPrice: 4450, leadTimeDays: 16, notes: 'Project volume discount' },
          { minQty: 501, unitPrice: 4100, leadTimeDays: 14, notes: 'Full façade consignment' }
        ]
      },
      {
        id: 'sr-gls-02',
        supplierId: 'sup-001',
        supplierName: 'Emirates Steel Arkan PJSC',
        vendorCode: 'VND-EMS-01',
        currency: 'LKR',
        baseRate: 5100,
        minimumOrderQty: 40,
        leadTimeDays: 24,
        rating: 4.5,
        isPreferred: false,
        effectiveDate: '2026-08-10',
        priceRanges: [
          { minQty: 1, maxQty: 40, unitPrice: 5500, leadTimeDays: 24 },
          { minQty: 41, maxQty: 200, unitPrice: 5100, leadTimeDays: 20 },
          { minQty: 201, unitPrice: 4700, leadTimeDays: 18 }
        ]
      }
    ]
  },

  // 3. OUTSIDE SERVICE RENDERED: Architectural Powder Coating Qualicoat Class 2
  {
    id: 'cst-srv-001',
    itemCode: 'PR-OUT-PC-CL2',
    name: 'Outside Service: Architectural Powder Coating Qualicoat Class 2',
    category: 'Outside Services',
    subCategory: 'Architectural Powder Coating',
    classification: 'OUTSIDE_SERVICE',
    description: 'High durability super-durable thermosetting polyester powder coating applied on pre-treated chromate-free aluminium extrusions. 60-80 microns DFT, 25-year gloss retention warranty.',
    primaryUnit: 'm²',
    projectId: 'proj-altair-01',
    projectCode: 'PRJ-2026-001',
    projectName: 'Altair Tower - Luxury Façade & Glazing Package',
    benchmarkCost: 450,
    currency: 'LKR',
    status: 'Active',
    specificationRef: 'Qualicoat Class 2 / AAMA 2604',
    hsnSacCode: '9988.73',
    qualityStandard: 'Qualicoat Licensee certified to AAMA 2604',
    inspectionLevel: 'Elcometer DFT gauge check, cross-hatch adhesion, MEK rub test',
    storageCondition: 'Protective Film Wrapped in Dry Enclosure',
    barcode: '8901234003038',
    notes: 'Approved outside service applicator for AkzoNobel Interpon D2525 and Jotun Corro-Coat Durasol.',
    createdAt: '2026-08-15T11:00:00Z',
    updatedAt: '2026-09-22T08:00:00Z',
    linkedDependencies: [
      {
        id: 'dep-pc-01',
        targetType: 'PRODUCT_VARIANT',
        targetId: 'var-70-2w-001',
        targetCode: 'AL-WIN-70-2W-001',
        targetName: '70mm 2-Way Sliding Window (2-Panel, 5mm Clear, White PC)',
        categoryName: 'Sliding Windows (2-Track)',
        bomRole: 'OVERHEAD',
        usageFormula: '1.2 m² coated / m² window',
        unitConsumption: 1.2,
        currentVariantCost: 12380,
        currentVariantSellingPrice: 19500,
        costContribution: 540,
        costImpactPercent: 4.4,
        lastSyncedAt: '2026-09-24T10:00:00Z'
      }
    ],
    variants: [
      {
        id: 'var-pc-01',
        variantCode: 'PC-CL2-WHT',
        name: 'Pure White RAL 9016 Gloss 80%',
        sku: 'SRV-PC-WHT-9016',
        attributes: {
          'Color Code': 'RAL 9016 Pure White',
          'Gloss Level': '80% High Gloss',
          'Powder Brand': 'AkzoNobel Interpon D2525'
        },
        unit: 'm²',
        standardCost: 450,
        supplierRates: []
      },
      {
        id: 'var-pc-02',
        variantCode: 'PC-CL2-MAT-GRY',
        name: 'Anthracite Matt Grey RAL 7016 Matt 30%',
        sku: 'SRV-PC-GRY-7016',
        attributes: {
          'Color Code': 'RAL 7016 Anthracite',
          'Gloss Level': '30% Architectural Matt',
          'Powder Brand': 'Jotun Durasol Superdurable'
        },
        unit: 'm²',
        standardCost: 520,
        supplierRates: []
      }
    ],
    supplierRates: [
      {
        id: 'sr-pc-01',
        supplierId: 'sup-003',
        supplierName: 'Sigma Paints Middle East',
        vendorCode: 'VND-SIG-03',
        currency: 'LKR',
        baseRate: 450,
        minimumOrderQty: 100,
        leadTimeDays: 7,
        rating: 4.8,
        isPreferred: true,
        effectiveDate: '2026-08-01',
        priceRanges: [
          { minQty: 1, maxQty: 100, unitPrice: 510, leadTimeDays: 7, notes: 'Small custom jig batch' },
          { minQty: 101, maxQty: 500, unitPrice: 450, leadTimeDays: 6, notes: 'Standard automated line tier' },
          { minQty: 501, maxQty: 2000, unitPrice: 410, leadTimeDays: 5, notes: 'Continuous extrusion campaign' },
          { minQty: 2001, unitPrice: 380, leadTimeDays: 4, notes: 'Major project contract rate' }
        ]
      },
      {
        id: 'sr-pc-02',
        supplierId: 'sup-002',
        supplierName: 'Alucobond Architectural Panels Ltd',
        vendorCode: 'VND-ALU-02',
        currency: 'LKR',
        baseRate: 480,
        minimumOrderQty: 150,
        leadTimeDays: 9,
        rating: 4.6,
        isPreferred: false,
        effectiveDate: '2026-08-15',
        priceRanges: [
          { minQty: 1, maxQty: 150, unitPrice: 540, leadTimeDays: 9 },
          { minQty: 151, maxQty: 600, unitPrice: 480, leadTimeDays: 7 },
          { minQty: 601, unitPrice: 430, leadTimeDays: 6 }
        ]
      }
    ]
  },

  // 4. SUBCONTRACTOR SERVICE & LABOUR: Curtain Wall & Glazing Site Installation Crew
  {
    id: 'cst-sub-001',
    itemCode: 'PR-SUB-CW-CREW',
    name: 'Subcontractor: Specialized Structural Glazing & Façade Installation Crew',
    category: 'Subcontractor Services',
    subCategory: 'Curtain Wall Installation Crew',
    classification: 'SUBCONTRACTOR_LABOUR',
    description: 'Certified 6-person site installation crew (1 Lead Rigger, 3 Certified Glaziers, 2 Rigging Helpers) equipped with PPE, fall arrest harnesses, and glass suction handling gear.',
    primaryUnit: 'day',
    projectId: 'proj-altair-01',
    projectCode: 'PRJ-2026-001',
    projectName: 'Altair Tower - Luxury Façade & Glazing Package',
    benchmarkCost: 28500,
    currency: 'LKR',
    status: 'Active',
    specificationRef: 'CWCT Section 8 / BS 8213-4',
    hsnSacCode: '9954.69',
    qualityStandard: 'IRATA Rope Access / Working at Heights Certified',
    inspectionLevel: 'Daily Toolbox Talk, Site Permit to Work PTW, Torque inspection',
    storageCondition: 'On-site Secured Welfare & Tool Container',
    barcode: '8901234004045',
    notes: 'Standard 8-hour shift output norm: 45 m² curtain wall unitised panels or 12 window units installed and aligned.',
    createdAt: '2026-08-18T14:00:00Z',
    updatedAt: '2026-09-21T16:00:00Z',
    linkedDependencies: [
      {
        id: 'dep-sub-01',
        targetType: 'PRODUCT_VARIANT',
        targetId: 'var-70-2w-001',
        targetCode: 'AL-WIN-70-2W-001',
        targetName: '70mm 2-Way Sliding Window (2-Panel, 5mm Clear, White PC)',
        categoryName: 'Sliding Windows (2-Track)',
        bomRole: 'LABOUR',
        usageFormula: '0.08 shift / unit',
        unitConsumption: 0.08,
        currentVariantCost: 12380,
        currentVariantSellingPrice: 19500,
        costContribution: 2280,
        costImpactPercent: 18.4,
        lastSyncedAt: '2026-09-24T10:00:00Z'
      },
      {
        id: 'dep-sub-02',
        targetType: 'PRODUCT_VARIANT',
        targetId: 'var-swisstek-100-3w',
        targetCode: 'AL-WIN-100-3W-001',
        targetName: 'Swisstek 100mm 3-Way Heavy Duty Sliding Window (6-Panel DGU)',
        categoryName: 'Sliding Windows (3-Track)',
        bomRole: 'LABOUR',
        usageFormula: '0.14 shift / unit',
        unitConsumption: 0.14,
        currentVariantCost: 24500,
        currentVariantSellingPrice: 36000,
        costContribution: 3990,
        costImpactPercent: 16.3,
        lastSyncedAt: '2026-09-24T10:00:00Z'
      }
    ],
    variants: [
      {
        id: 'var-sub-01',
        variantCode: 'SUB-CW-8HR',
        name: 'Standard Day Shift (8 Hours 08:00 - 17:00)',
        sku: 'SRV-SUB-8HR',
        attributes: {
          'Gang Size': '6 Technicians',
          'Working Hours': '8 Hours',
          'Output Capacity': '45 m² / Day'
        },
        unit: 'day',
        standardCost: 28500,
        supplierRates: []
      },
      {
        id: 'var-sub-02',
        variantCode: 'SUB-CW-NIGHT',
        name: 'Night Shift & Overtime (1.5x Premium)',
        sku: 'SRV-SUB-NIGHT',
        attributes: {
          'Gang Size': '6 Technicians',
          'Working Hours': '8 Hours Night (22:00 - 06:00)',
          'Output Capacity': '35 m² / Night'
        },
        unit: 'day',
        standardCost: 39500,
        supplierRates: []
      }
    ],
    supplierRates: [
      {
        id: 'sr-sub-01',
        supplierId: 'sup-sub-01',
        supplierName: 'Apex Façade Engineering Subcontractors LLC',
        vendorCode: 'VND-APX-09',
        currency: 'LKR',
        baseRate: 28500,
        minimumOrderQty: 5,
        leadTimeDays: 7,
        rating: 4.9,
        isPreferred: true,
        effectiveDate: '2026-08-01',
        priceRanges: [
          { minQty: 1, maxQty: 5, unitPrice: 31000, leadTimeDays: 7, notes: 'Emergency or short callout' },
          { minQty: 6, maxQty: 30, unitPrice: 28500, leadTimeDays: 5, notes: 'Monthly site deployment tier' },
          { minQty: 31, maxQty: 90, unitPrice: 26000, leadTimeDays: 3, notes: 'Quarterly tower contract' },
          { minQty: 91, unitPrice: 24200, leadTimeDays: 2, notes: 'Full annual project partnership' }
        ]
      },
      {
        id: 'sr-sub-02',
        supplierId: 'sup-sub-02',
        supplierName: 'Titan Structural Erection Crews Ltd',
        vendorCode: 'VND-TTN-11',
        currency: 'LKR',
        baseRate: 29800,
        minimumOrderQty: 10,
        leadTimeDays: 10,
        rating: 4.7,
        isPreferred: false,
        effectiveDate: '2026-08-15',
        priceRanges: [
          { minQty: 1, maxQty: 10, unitPrice: 32500, leadTimeDays: 10 },
          { minQty: 11, maxQty: 40, unitPrice: 29800, leadTimeDays: 7 },
          { minQty: 41, unitPrice: 27200, leadTimeDays: 5 }
        ]
      }
    ]
  },

  // 5. EQUIPMENT & PLANT RENTAL: Spider Crane & Glass Vacuum Lifter Rig
  {
    id: 'cst-eqp-001',
    itemCode: 'PR-EQP-SPIDER-CRANE',
    name: 'Equipment Rental: Maeda 3.0T Spider Crane & Dual-Circuit Glass Vacuum Lifter',
    category: 'Equipment & Plant',
    subCategory: 'Spider Crane & Vacuum Lifter',
    classification: 'EQUIPMENT_PLANT',
    description: 'Narrow-access tracked mini spider crane (3.0 Ton capacity) paired with a 800kg vacuum glass manipulator. Includes certified operator, diesel fuel, and annual third-party load test certificate.',
    primaryUnit: 'day',
    projectId: 'proj-altair-01',
    projectCode: 'PRJ-2026-001',
    projectName: 'Altair Tower - Luxury Façade & Glazing Package',
    benchmarkCost: 42000,
    currency: 'LKR',
    status: 'Active',
    specificationRef: 'BS 7121 Safe Use of Cranes',
    hsnSacCode: '9973.11',
    qualityStandard: 'Third-Party TUV Inspection Certified',
    inspectionLevel: 'Pre-use daily check sheet & hydraulic pressure calibration',
    storageCondition: 'Secure site crane bay with hardstanding ground pads',
    barcode: '8901234005052',
    notes: 'Essential for high-floor cantilevered balcony glass installations.',
    createdAt: '2026-08-20T10:00:00Z',
    updatedAt: '2026-09-23T11:00:00Z',
    linkedDependencies: [
      {
        id: 'dep-eqp-01',
        targetType: 'PRODUCT_VARIANT',
        targetId: 'var-swisstek-100-3w',
        targetCode: 'AL-WIN-100-3W-001',
        targetName: 'Swisstek 100mm 3-Way Heavy Duty Sliding Window (6-Panel DGU)',
        categoryName: 'Sliding Windows (3-Track)',
        bomRole: 'OVERHEAD',
        usageFormula: '0.02 day / unit',
        unitConsumption: 0.02,
        currentVariantCost: 24500,
        currentVariantSellingPrice: 36000,
        costContribution: 840,
        costImpactPercent: 3.4,
        lastSyncedAt: '2026-09-24T10:00:00Z'
      }
    ],
    variants: [
      {
        id: 'var-eqp-01',
        variantCode: 'EQP-MC305-STD',
        name: 'Standard Daily Hire (Operator Included)',
        sku: 'EQP-CRANE-3T',
        attributes: {
          'Capacity': '2.98 Ton',
          'Max Radius': '12.16 m',
          'Fuel Included': 'Yes'
        },
        unit: 'day',
        standardCost: 42000,
        supplierRates: []
      }
    ],
    supplierRates: [
      {
        id: 'sr-eqp-01',
        supplierId: 'sup-eqp-01',
        supplierName: 'Access Plant & Heavy Rigging Equipment FZCO',
        vendorCode: 'VND-ACC-14',
        currency: 'LKR',
        baseRate: 42000,
        minimumOrderQty: 3,
        leadTimeDays: 3,
        rating: 4.9,
        isPreferred: true,
        effectiveDate: '2026-08-01',
        priceRanges: [
          { minQty: 1, maxQty: 3, unitPrice: 46000, leadTimeDays: 3, notes: 'Daily short term' },
          { minQty: 4, maxQty: 14, unitPrice: 42000, leadTimeDays: 2, notes: 'Weekly block rental' },
          { minQty: 15, maxQty: 30, unitPrice: 38500, leadTimeDays: 2, notes: 'Monthly project term' },
          { minQty: 31, unitPrice: 35000, leadTimeDays: 1, notes: 'Long-term site lease' }
        ]
      }
    ]
  },

  // 6. LOGISTICS, FREIGHT & CONTRACTS: Heavy Flatbed Trailer Transport
  {
    id: 'cst-log-001',
    itemCode: 'PR-LOG-FLATBED-TRIP',
    name: 'Logistics: 40ft Articulated Flatbed Transportation & Site Shuttle',
    category: 'Logistics & Contracts',
    subCategory: 'Heavy Flatbed Trailer Haulage',
    classification: 'LOGISTICS_CONTRACT',
    description: 'Heavy duty 40-foot articulated tractor trailer for transporting pre-glazed curtain wall cassettes and crated window assemblies from fabrication yard to construction site.',
    primaryUnit: 'trip',
    projectId: 'proj-altair-01',
    projectCode: 'PRJ-2026-001',
    projectName: 'Altair Tower - Luxury Façade & Glazing Package',
    benchmarkCost: 18500,
    currency: 'LKR',
    status: 'Active',
    specificationRef: 'DOT Heavy Transport Safety Code',
    hsnSacCode: '9965.11',
    qualityStandard: 'ISO 9001 Logistics Fleet certified',
    inspectionLevel: 'Cargo tie-down strap tension inspection & GPS seal tracking',
    storageCondition: 'Transit protected with weather tarpaulins',
    barcode: '8901234006069',
    notes: 'Capacity: up to 18 unitised façade frames per trip.',
    createdAt: '2026-08-22T08:00:00Z',
    updatedAt: '2026-09-23T14:00:00Z',
    linkedDependencies: [],
    variants: [
      {
        id: 'var-log-01',
        variantCode: 'LOG-TRIP-DAY',
        name: 'Single Round Trip (Yard to Site)',
        sku: 'LOG-40FT-DAY',
        attributes: {
          'Vehicle': '40ft Low-Bed Flatbed',
          'Capacity': '24 Tons',
          'Loading Time': '2 Hours Included'
        },
        unit: 'trip',
        standardCost: 18500,
        supplierRates: []
      }
    ],
    supplierRates: [
      {
        id: 'sr-log-01',
        supplierId: 'sup-log-01',
        supplierName: 'Trans-Gulf Express Haulage & Heavy Logistics',
        vendorCode: 'VND-TRG-16',
        currency: 'LKR',
        baseRate: 18500,
        minimumOrderQty: 4,
        leadTimeDays: 2,
        rating: 4.8,
        isPreferred: true,
        effectiveDate: '2026-08-01',
        priceRanges: [
          { minQty: 1, maxQty: 3, unitPrice: 21000, leadTimeDays: 2, notes: 'Single ad-hoc trip' },
          { minQty: 4, maxQty: 20, unitPrice: 18500, leadTimeDays: 1, notes: 'Scheduled delivery block' },
          { minQty: 21, unitPrice: 16500, leadTimeDays: 1, notes: 'Full site delivery campaign' }
        ]
      }
    ]
  }
];

class ProcurementCostService {
  private costItems: ProcurementCostItem[] = [];
  private categories: CostCategoryDefinition[] = [];
  private rateHistory: CostItemRateHistory[] = [];

  constructor() {
    this.init();
  }

  private init() {
    // 1. Load Cost Items
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.costItems = JSON.parse(stored);
      } else {
        this.costItems = [...SEED_PROCUREMENT_COST_ITEMS];
        this.persist();
      }
    } catch (e) {
      console.warn('Failed to load procurement cost items from localStorage, falling back to seeds:', e);
      this.costItems = [...SEED_PROCUREMENT_COST_ITEMS];
    }

    // Ensure all variants have PK and FK properly set
    this.costItems.forEach(item => {
      if (item.variants && item.variants.length > 0) {
        item.variants.forEach(v => {
          if (!v.parentCostItemId) v.parentCostItemId = item.id;
          if (!v.parentItemCode) v.parentItemCode = item.itemCode;
        });
      }
    });

    // 2. Load Categories
    try {
      const storedCat = localStorage.getItem(CATEGORIES_STORAGE_KEY);
      if (storedCat) {
        this.categories = JSON.parse(storedCat);
      } else {
        this.categories = [...SEED_COST_CATEGORIES];
        this.persistCategories();
      }
    } catch (e) {
      this.categories = [...SEED_COST_CATEGORIES];
    }

    // 3. Load Rate History
    try {
      const storedHist = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (storedHist) {
        this.rateHistory = JSON.parse(storedHist);
      } else {
        this.rateHistory = [...SEED_RATE_HISTORY];
        this.persistRateHistory();
      }
    } catch (e) {
      this.rateHistory = [...SEED_RATE_HISTORY];
    }
  }

  private persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.costItems));
    } catch (e) {
      console.error('Failed to persist procurement cost items:', e);
    }
  }

  private persistCategories() {
    try {
      localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(this.categories));
    } catch (e) {
      console.error('Failed to persist procurement cost categories:', e);
    }
  }

  private persistRateHistory() {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(this.rateHistory));
    } catch (e) {
      console.error('Failed to persist procurement rate history:', e);
    }
  }

  public getRateHistory(): CostItemRateHistory[] {
    return [...this.rateHistory];
  }

  public addRateHistory(record: Omit<CostItemRateHistory, 'id'>): CostItemRateHistory {
    const newEntry: CostItemRateHistory = {
      ...record,
      id: `rh-${Date.now()}`
    };
    this.rateHistory.unshift(newEntry);
    this.persistRateHistory();
    return newEntry;
  }

  // --- Cost Item Methods ---

  public getCostItems(): ProcurementCostItem[] {
    return [...this.costItems];
  }

  public getCostItemById(id: string): ProcurementCostItem | undefined {
    return this.costItems.find(i => i.id === id || i.itemCode === id);
  }

  public saveCostItem(itemData: Partial<ProcurementCostItem> & { name: string; category: ProcurementCostCategory | string }): ProcurementCostItem {
    const existingIndex = this.costItems.findIndex(i => i.id === itemData.id);
    const now = new Date().toISOString();

    if (existingIndex >= 0) {
      const updated: ProcurementCostItem = {
        ...this.costItems[existingIndex],
        ...itemData,
        updatedAt: now
      };
      this.costItems[existingIndex] = updated;
      this.persist();
      return updated;
    } else {
      const prefix = itemData.classification === 'OUTSIDE_SERVICE' ? 'OUT'
        : itemData.classification === 'SUBCONTRACTOR_LABOUR' ? 'SUB'
        : itemData.classification === 'EQUIPMENT_PLANT' ? 'EQP'
        : itemData.classification === 'LOGISTICS_CONTRACT' ? 'LOG'
        : 'MAT';
      const seq = Math.floor(100 + Math.random() * 900);
      const generatedCode = itemData.itemCode || `PR-${prefix}-${seq}`;
      const barcode = itemData.barcode || `890${Math.floor(1000000000 + Math.random() * 9000000000)}`;

      const newItem: ProcurementCostItem = {
        id: itemData.id || `cst-${Date.now()}`,
        itemCode: generatedCode,
        name: itemData.name,
        category: itemData.category,
        subCategory: itemData.subCategory || 'General Component',
        classification: itemData.classification || 'RAW_MATERIAL',
        description: itemData.description || '',
        primaryUnit: itemData.primaryUnit || 'pcs',
        projectId: itemData.projectId || '',
        projectCode: itemData.projectCode || '',
        projectName: itemData.projectName || '',
        linkedQuoteId: itemData.linkedQuoteId || '',
        linkedQuoteNo: itemData.linkedQuoteNo || '',
        boqItemId: itemData.boqItemId || '',
        boqItemCode: itemData.boqItemCode || '',
        linkedPoId: itemData.linkedPoId || '',
        linkedPoNumber: itemData.linkedPoNumber || '',
        benchmarkCost: Number(itemData.benchmarkCost) || 0,
        currency: itemData.currency || 'LKR',
        status: itemData.status || 'Active',
        variants: itemData.variants || [],
        supplierRates: itemData.supplierRates || [],
        specificationRef: itemData.specificationRef || '',
        hsnSacCode: itemData.hsnSacCode || '',
        qualityStandard: itemData.qualityStandard || '',
        inspectionLevel: itemData.inspectionLevel || 'Visual & MTC',
        storageCondition: itemData.storageCondition || 'Dry Warehouse',
        barcode,
        linkedDependencies: itemData.linkedDependencies || [],
        notes: itemData.notes || '',
        createdAt: now,
        updatedAt: now
      };
      this.costItems.unshift(newItem);
      this.persist();
      return newItem;
    }
  }

  public deleteCostItem(id: string): boolean {
    const prevCount = this.costItems.length;
    this.costItems = this.costItems.filter(i => i.id !== id);
    if (this.costItems.length !== prevCount) {
      this.persist();
      return true;
    }
    return false;
  }

  public duplicateCostItem(id: string): ProcurementCostItem | null {
    const orig = this.getCostItemById(id);
    if (!orig) return null;

    const copy: ProcurementCostItem = {
      ...JSON.parse(JSON.stringify(orig)),
      id: `cst-${Date.now()}`,
      itemCode: `${orig.itemCode}-CPY`,
      name: `${orig.name} (Copy)`,
      barcode: `890${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.costItems.unshift(copy);
    this.persist();
    return copy;
  }

  // --- Variant Management ---

  public addVariantToItem(itemId: string, variantData: Partial<ProcurementItemVariant> & { name: string; variantCode: string }): ProcurementCostItem | null {
    const item = this.costItems.find(i => i.id === itemId);
    if (!item) return null;

    const newVariant: ProcurementItemVariant = {
      id: variantData.id || `var-${Date.now()}`,
      parentCostItemId: itemId,
      parentItemCode: item.itemCode,
      variantCode: variantData.variantCode,
      name: variantData.name,
      sku: variantData.sku || variantData.variantCode,
      imageUrl: variantData.imageUrl,
      attributes: variantData.attributes || {},
      unit: variantData.unit || item.primaryUnit,
      standardCost: Number(variantData.standardCost) || item.benchmarkCost,
      supplierRates: variantData.supplierRates || []
    };

    item.variants = [...(item.variants || []), newVariant];
    item.updatedAt = new Date().toISOString();
    this.persist();
    return item;
  }

  public updateVariantInItem(itemId: string, variantId: string, variantData: Partial<ProcurementItemVariant>): ProcurementCostItem | null {
    const item = this.costItems.find(i => i.id === itemId);
    if (!item) return null;

    const variantIndex = (item.variants || []).findIndex(v => v.id === variantId);
    if (variantIndex >= 0) {
      item.variants[variantIndex] = {
        ...item.variants[variantIndex],
        ...variantData
      };
      item.updatedAt = new Date().toISOString();
      this.persist();
      return item;
    }
    return null;
  }

  public deleteVariantFromItem(itemId: string, variantId: string): ProcurementCostItem | null {
    const item = this.costItems.find(i => i.id === itemId);
    if (!item) return null;

    item.variants = (item.variants || []).filter(v => v.id !== variantId);
    item.updatedAt = new Date().toISOString();
    this.persist();
    return item;
  }

  // --- Supplier Rates & Multi-MOQ Tier Management ---

  public addSupplierRateToItem(
    itemId: string, 
    variantId: string | null, 
    rateData: Partial<ItemSupplierRate> & { supplierName: string; baseRate: number }
  ): ProcurementCostItem | null {
    const item = this.costItems.find(i => i.id === itemId);
    if (!item) return null;

    const newRate: ItemSupplierRate = {
      id: rateData.id || `sr-${Date.now()}`,
      supplierId: rateData.supplierId || `sup-${Date.now()}`,
      supplierName: rateData.supplierName,
      vendorCode: rateData.vendorCode || 'VND-GEN',
      currency: rateData.currency || item.currency || 'LKR',
      baseRate: Number(rateData.baseRate) || 0,
      minimumOrderQty: Number(rateData.minimumOrderQty) || 1,
      leadTimeDays: Number(rateData.leadTimeDays) || 7,
      rating: Number(rateData.rating) || 4.5,
      isPreferred: !!rateData.isPreferred,
      effectiveDate: rateData.effectiveDate || new Date().toISOString().split('T')[0],
      validUntil: rateData.validUntil || '',
      taxRatePercent: rateData.taxRatePercent || 5,
      priceRanges: rateData.priceRanges && rateData.priceRanges.length > 0 ? rateData.priceRanges : [
        { minQty: 1, unitPrice: Number(rateData.baseRate) || 0 }
      ],
      notes: rateData.notes || ''
    };

    if (variantId) {
      const targetVariant = item.variants?.find(v => v.id === variantId);
      if (targetVariant) {
        targetVariant.supplierRates = [...(targetVariant.supplierRates || []), newRate];
      }
    } else {
      item.supplierRates = [...(item.supplierRates || []), newRate];
    }

    item.updatedAt = new Date().toISOString();
    this.persist();
    return item;
  }

  public updateSupplierRate(
    itemId: string,
    rateId: string,
    updatedData: Partial<ItemSupplierRate>
  ): ProcurementCostItem | null {
    const item = this.costItems.find(i => i.id === itemId);
    if (!item) return null;

    // Check item level rates
    const itemRateIndex = (item.supplierRates || []).findIndex(r => r.id === rateId);
    if (itemRateIndex >= 0) {
      item.supplierRates[itemRateIndex] = {
        ...item.supplierRates[itemRateIndex],
        ...updatedData
      };
      item.updatedAt = new Date().toISOString();
      this.persist();
      return item;
    }

    // Check variant level rates
    (item.variants || []).forEach(v => {
      const vRateIndex = (v.supplierRates || []).findIndex(r => r.id === rateId);
      if (vRateIndex >= 0) {
        v.supplierRates[vRateIndex] = {
          ...v.supplierRates[vRateIndex],
          ...updatedData
        };
      }
    });

    item.updatedAt = new Date().toISOString();
    this.persist();
    return item;
  }

  public deleteSupplierRate(itemId: string, rateId: string): ProcurementCostItem | null {
    const item = this.costItems.find(i => i.id === itemId);
    if (!item) return null;

    item.supplierRates = (item.supplierRates || []).filter(r => r.id !== rateId);
    (item.variants || []).forEach(v => {
      v.supplierRates = (v.supplierRates || []).filter(r => r.id !== rateId);
    });

    item.updatedAt = new Date().toISOString();
    this.persist();
    return item;
  }

  // --- Category Management ---

  public getCategories(): CostCategoryDefinition[] {
    return [...this.categories];
  }

  public saveCategory(catData: Partial<CostCategoryDefinition> & { name: string; classification: ProcurementCostClassification }): CostCategoryDefinition {
    const existingIndex = this.categories.findIndex(c => c.id === catData.id);
    if (existingIndex >= 0) {
      const updated: CostCategoryDefinition = {
        ...this.categories[existingIndex],
        ...catData
      };
      this.categories[existingIndex] = updated;
      this.persistCategories();
      return updated;
    } else {
      const newCat: CostCategoryDefinition = {
        id: catData.id || `cc-${Date.now()}`,
        name: catData.name,
        code: catData.code || catData.name.toUpperCase().replace(/\s+/g, '_').slice(0, 8),
        classification: catData.classification,
        description: catData.description || '',
        icon: catData.icon || 'Layers',
        subCategories: catData.subCategories || []
      };
      this.categories.push(newCat);
      this.persistCategories();
      return newCat;
    }
  }

  public addSubCategoryToCategory(categoryId: string, subCategoryName: string): boolean {
    const cat = this.categories.find(c => c.id === categoryId);
    if (!cat) return false;
    if (!cat.subCategories.includes(subCategoryName)) {
      cat.subCategories.push(subCategoryName);
      this.persistCategories();
      return true;
    }
    return false;
  }

  public deleteCategory(id: string): boolean {
    const prev = this.categories.length;
    this.categories = this.categories.filter(c => c.id !== id);
    if (this.categories.length !== prev) {
      this.persistCategories();
      return true;
    }
    return false;
  }

  // --- Product & Variant Dependency Linking ---

  public linkProductVariantToCostItem(
    costItemId: string,
    link: Omit<CostItemDependencyLink, 'id' | 'lastSyncedAt'>
  ): ProcurementCostItem | null {
    const item = this.costItems.find(i => i.id === costItemId);
    if (!item) return null;

    const existingIndex = (item.linkedDependencies || []).findIndex(
      d => d.targetId === link.targetId && d.bomRole === link.bomRole
    );

    const fullLink: CostItemDependencyLink = {
      ...link,
      id: existingIndex >= 0 ? item.linkedDependencies![existingIndex].id : `dep-${Date.now()}`,
      lastSyncedAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      item.linkedDependencies![existingIndex] = fullLink;
    } else {
      item.linkedDependencies = [...(item.linkedDependencies || []), fullLink];
    }

    item.updatedAt = new Date().toISOString();
    this.persist();
    return item;
  }

  public unlinkProductVariant(costItemId: string, linkId: string): ProcurementCostItem | null {
    const item = this.costItems.find(i => i.id === costItemId);
    if (!item) return null;

    item.linkedDependencies = (item.linkedDependencies || []).filter(d => d.id !== linkId);
    item.updatedAt = new Date().toISOString();
    this.persist();
    return item;
  }

  public getAllProductDependencies(): (CostItemDependencyLink & { costItem: ProcurementCostItem })[] {
    const list: (CostItemDependencyLink & { costItem: ProcurementCostItem })[] = [];
    this.costItems.forEach(item => {
      (item.linkedDependencies || []).forEach(dep => {
        list.push({
          ...dep,
          costItem: item
        });
      });
    });
    return list;
  }

  public getDependenciesForVariant(targetVariantId: string): (CostItemDependencyLink & { costItem: ProcurementCostItem })[] {
    return this.getAllProductDependencies().filter(d => d.targetId === targetVariantId);
  }

  public exportDatabaseJSON(): string {
    return JSON.stringify({
      costItems: this.costItems,
      categories: this.categories,
      rateHistory: this.rateHistory,
      exportedAt: new Date().toISOString()
    }, null, 2);
  }

  public importDatabaseJSON(jsonStr: string): boolean {
    try {
      const data = JSON.parse(jsonStr);
      if (Array.isArray(data.costItems)) {
        this.costItems = data.costItems;
        this.persist();
      }
      if (Array.isArray(data.categories)) {
        this.categories = data.categories;
        this.persistCategories();
      }
      if (Array.isArray(data.rateHistory)) {
        this.rateHistory = data.rateHistory;
        this.persistRateHistory();
      }
      return true;
    } catch (e) {
      console.error('Failed to import procurement database:', e);
      return false;
    }
  }

  // --- Live Impact Analysis & MOQ Calculations ---

  /**
   * Simulates what happens to all linked product variants if a cost item rate
   * changes by a percentage or to a specific vendor/MOQ tier rate.
   */
  public simulatePriceChangeImpact(
    costItemId: string,
    percentageDelta: number,
    targetRate?: number
  ) {
    const item = this.getCostItemById(costItemId);
    if (!item) return [];

    const baseRate = targetRate !== undefined ? targetRate : item.benchmarkCost;
    const effectiveNewRate = targetRate !== undefined 
      ? targetRate 
      : Math.round(baseRate * (1 + percentageDelta / 100) * 100) / 100;

    return (item.linkedDependencies || []).map(link => {
      const oldContribution = Math.round(link.unitConsumption * item.benchmarkCost * 100) / 100;
      const newContribution = Math.round(link.unitConsumption * effectiveNewRate * 100) / 100;
      const costDelta = Math.round((newContribution - oldContribution) * 100) / 100;

      const currentCost = link.currentVariantCost || 15000;
      const newCost = Math.round((currentCost + costDelta) * 100) / 100;
      const currentSellingPrice = link.currentVariantSellingPrice || Math.round(currentCost * 1.35);

      // Current gross margin %
      const currentMargin = currentSellingPrice > 0 
        ? Math.round(((currentSellingPrice - currentCost) / currentSellingPrice) * 1000) / 10 
        : 0;

      // Eroded margin % if selling price is unchanged
      const erodedMargin = currentSellingPrice > 0 
        ? Math.round(((currentSellingPrice - newCost) / currentSellingPrice) * 1000) / 10 
        : 0;

      // Recommended selling price to maintain current margin
      const recommendedSellingPrice = currentMargin < 100 
        ? Math.round(newCost / (1 - currentMargin / 100)) 
        : newCost * 1.3;

      return {
        dependencyId: link.id,
        targetCode: link.targetCode,
        targetName: link.targetName,
        bomRole: link.bomRole,
        unitConsumption: link.unitConsumption,
        oldContribution,
        newContribution,
        costDelta,
        currentCost,
        newCost,
        currentSellingPrice,
        recommendedSellingPrice,
        currentMargin,
        erodedMargin,
        marginImpactPct: Math.round((erodedMargin - currentMargin) * 10) / 10
      };
    });
  }

  /**
   * Finds the best supplier rate and price tier for a specific cost item
   * based on the requested order quantity.
   */
  public calculateBestMoqRate(costItemId: string, orderQuantity: number): {
    bestSupplierName: string;
    bestRate: number;
    savingsVsBenchmark: number;
    savingsPercent: number;
    leadTimeDays: number;
  } | null {
    const item = this.getCostItemById(costItemId);
    if (!item || !item.supplierRates || item.supplierRates.length === 0) return null;

    let bestRate = Infinity;
    let bestSupplier = item.supplierRates[0].supplierName;
    let bestLeadTime = item.supplierRates[0].leadTimeDays;

    item.supplierRates.forEach(sup => {
      // Find matching range tier
      let matchedPrice = sup.baseRate;
      if (sup.priceRanges && sup.priceRanges.length > 0) {
        const sorted = [...sup.priceRanges].sort((a, b) => (b.minQty || 0) - (a.minQty || 0));
        const matchedTier = sorted.find(r => orderQuantity >= r.minQty);
        if (matchedTier) {
          matchedPrice = matchedTier.unitPrice;
          if (matchedTier.leadTimeDays) bestLeadTime = matchedTier.leadTimeDays;
        }
      }

      if (matchedPrice < bestRate) {
        bestRate = matchedPrice;
        bestSupplier = sup.supplierName;
      }
    });

    if (bestRate === Infinity) bestRate = item.benchmarkCost;
    const savings = item.benchmarkCost - bestRate;
    const savingsPercent = item.benchmarkCost > 0 
      ? Math.round((savings / item.benchmarkCost) * 1000) / 10 
      : 0;

    return {
      bestSupplierName: bestSupplier,
      bestRate,
      savingsVsBenchmark: Math.max(0, savings),
      savingsPercent: Math.max(0, savingsPercent),
      leadTimeDays: bestLeadTime
    };
  }

  // --- External Sync & Maintenance ---

  public syncWithForeignData(projects: any[] = [], _catalogItems: any[] = [], _suppliers: any[] = []) {
    let changed = false;

    // Cross-link projects
    if (projects.length > 0) {
      this.costItems = this.costItems.map((item, idx) => {
        let updated = { ...item };
        if (!updated.projectId) {
          const assignedProj = projects[idx % projects.length];
          if (assignedProj) {
            updated.projectId = assignedProj.id;
            updated.projectCode = assignedProj.projectCode || assignedProj.id;
            updated.projectName = assignedProj.projectName || assignedProj.name;
            changed = true;
          }
        }
        return updated;
      });
    }

    if (changed) {
      this.persist();
    }
  }

  public reloadAll() {
    this.init();
  }

  public resetToDefaults() {
    this.costItems = [...SEED_PROCUREMENT_COST_ITEMS];
    this.categories = [...SEED_COST_CATEGORIES];
    this.persist();
    this.persistCategories();
  }
}

export const procurementCostService = new ProcurementCostService();
