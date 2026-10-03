import { AttributeDefinition, AttributeTemplate } from '../types';

export interface CompatibilityCheckResult {
  status: 'COMPATIBLE' | 'REQUIRES_APPROVAL' | 'NOT_COMPATIBLE';
  messages: string[];
  suggestedAction?: string;
}

// Master Attribute Definitions for Construction Items
export const MASTER_ATTRIBUTE_DEFINITIONS: AttributeDefinition[] = [
  // 1. System & Architecture
  {
    id: 'attr-system-series',
    groupId: 'grp-system',
    groupName: 'System & Architecture',
    name: 'System Series',
    code: 'SYSTEM_SERIES',
    dataType: 'select',
    isRequired: true,
    displayOrder: 1,
    defaultValue: '70mm Standard Series',
    allowedValues: [
      { id: 'sys-70', label: '70mm Standard Series', codeSuffix: '70' },
      { id: 'sys-80', label: '80mm Heavy-Duty Series', codeSuffix: '80' },
      { id: 'sys-100', label: '100mm Commercial Series', codeSuffix: '100' },
      { id: 'sys-thermal', label: 'Thermal Break 75mm Series', codeSuffix: 'TB75' },
      { id: 'sys-slim', label: 'Minimalist Slimline Series', codeSuffix: 'SLIM' }
    ]
  },
  {
    id: 'attr-operation-type',
    groupId: 'grp-system',
    groupName: 'System & Architecture',
    name: 'Operation Type',
    code: 'OPERATION_TYPE',
    dataType: 'select',
    isRequired: true,
    displayOrder: 2,
    defaultValue: 'Two-Way Sliding',
    allowedValues: [
      { id: 'op-slide-2w', label: 'Two-Way Sliding', codeSuffix: '2W' },
      { id: 'op-slide-3w', label: 'Three-Way Sliding (3-Track)', codeSuffix: '3W' },
      { id: 'op-slide-4w', label: 'Four-Way Sliding (Center Opening)', codeSuffix: '4W' },
      { id: 'op-casement', label: 'Side-Hung Casement', codeSuffix: 'CS' },
      { id: 'op-top-hung', label: 'Top-Hung Projected', codeSuffix: 'TH' },
      { id: 'op-tilt-turn', label: 'Tilt & Turn', codeSuffix: 'TT' },
      { id: 'op-fixed', label: 'Fixed Light (Dead Sash)', codeSuffix: 'FX' },
      { id: 'op-swing', label: 'Double Action Swing', codeSuffix: 'SW' },
      { id: 'op-bifold', label: 'Bi-Folding Stacking', codeSuffix: 'BF' }
    ]
  },
  {
    id: 'attr-panel-count',
    groupId: 'grp-system',
    groupName: 'System & Architecture',
    name: 'Panel Configuration',
    code: 'PANEL_COUNT',
    dataType: 'select',
    isRequired: true,
    displayOrder: 3,
    defaultValue: '2-Panel (1 Fixed, 1 Slide)',
    allowedValues: [
      { id: 'p-1', label: 'Single Leaf / Panel', codeSuffix: '1P' },
      { id: 'p-2', label: '2-Panel (1 Fixed, 1 Slide)', codeSuffix: '2P' },
      { id: 'p-2m', label: '2-Panel (Both Sliding)', codeSuffix: '2PM' },
      { id: 'p-3', label: '3-Panel (3-Track)', codeSuffix: '3P' },
      { id: 'p-4', label: '4-Panel (2 Fixed, 2 Slide)', codeSuffix: '4P' },
      { id: 'p-multi', label: 'Multi-Panel (Folding/Stacking)', codeSuffix: 'MP' }
    ]
  },

  // 2. Glass & Glazing
  {
    id: 'attr-glass-type',
    groupId: 'grp-glazing',
    groupName: 'Glass & Glazing',
    name: 'Glass Type',
    code: 'GLASS_TYPE',
    dataType: 'select',
    isRequired: true,
    displayOrder: 4,
    defaultValue: 'Clear Annealed Float',
    allowedValues: [
      { id: 'gt-clear', label: 'Clear Annealed Float', codeSuffix: 'CLR' },
      { id: 'gt-tint-euro-grey', label: 'Euro Grey Tinted', codeSuffix: 'EGR' },
      { id: 'gt-tint-dark-grey', label: 'Dark Grey Tinted', codeSuffix: 'DGR' },
      { id: 'gt-tint-green', label: 'French Green Tinted', codeSuffix: 'FGR' },
      { id: 'gt-frosted', label: 'Acid Etched / Frosted', codeSuffix: 'FST' },
      { id: 'gt-low-e', label: 'Low-E Solar Control', codeSuffix: 'LWE' },
      { id: 'gt-refl-blue', label: 'Reflective Blue', codeSuffix: 'RBL' },
      { id: 'gt-refl-silver', label: 'Reflective Silver', codeSuffix: 'RSV' }
    ]
  },
  {
    id: 'attr-glass-thickness',
    groupId: 'grp-glazing',
    groupName: 'Glass & Glazing',
    name: 'Glass Thickness',
    code: 'GLASS_THICKNESS',
    dataType: 'select',
    isRequired: true,
    displayOrder: 5,
    defaultValue: '5mm Single Glazed',
    allowedValues: [
      { id: 'gth-5', label: '5mm Single Glazed', codeSuffix: '5MM' },
      { id: 'gth-6', label: '6mm Single Glazed', codeSuffix: '6MM' },
      { id: 'gth-8', label: '8mm Single Glazed', codeSuffix: '8MM' },
      { id: 'gth-10', label: '10mm Single Glazed', codeSuffix: '10MM' },
      { id: 'gth-12', label: '12mm Single Glazed', codeSuffix: '12MM' },
      { id: 'gth-19', label: '19mm Extra Heavy Glazed', codeSuffix: '19MM' },
      { id: 'gth-dgu-19', label: '19mm DGU (5mm + 9A + 5mm)', codeSuffix: 'DGU19' },
      { id: 'gth-dgu-24', label: '24mm DGU (6mm + 12A + 6mm)', codeSuffix: 'DGU24' },
      { id: 'gth-lam-838', label: '8.38mm Laminated (4+0.38PVB+4)', codeSuffix: 'LAM8' },
      { id: 'gth-lam-1076', label: '10.76mm Laminated (5+0.76PVB+5)', codeSuffix: 'LAM10' }
    ]
  },
  {
    id: 'attr-glass-treatment',
    groupId: 'grp-glazing',
    groupName: 'Glass & Glazing',
    name: 'Safety Treatment',
    code: 'GLASS_TREATMENT',
    dataType: 'select',
    isRequired: false,
    displayOrder: 6,
    defaultValue: 'Standard Annealed',
    allowedValues: [
      { id: 'gtr-ann', label: 'Standard Annealed', codeSuffix: 'ANN' },
      { id: 'gtr-temp', label: 'Fully Tempered (Toughened Safety Glass)', codeSuffix: 'TMP' },
      { id: 'gtr-heat-str', label: 'Heat Strengthened (HS)', codeSuffix: 'HS' },
      { id: 'gtr-temp-hst', label: 'Tempered + Heat Soak Tested (HST)', codeSuffix: 'HST' }
    ]
  },

  // 3. Surface Treatment & Finish
  {
    id: 'attr-finish-type',
    groupId: 'grp-finish',
    groupName: 'Surface Treatment & Color',
    name: 'Surface Finish',
    code: 'SURFACE_FINISH',
    dataType: 'select',
    isRequired: true,
    displayOrder: 7,
    defaultValue: 'Powder Coated (Architectural Grade)',
    allowedValues: [
      { id: 'fin-pc', label: 'Powder Coated (Architectural Grade)', codeSuffix: 'PC' },
      { id: 'fin-pc-interpon', label: 'AkzoNobel Interpon D1000 High Durability', codeSuffix: 'PC-AKZ' },
      { id: 'fin-anod-nat', label: 'Natural Anodized (15 Micron)', codeSuffix: 'AN15' },
      { id: 'fin-anod-hd', label: 'Heavy Anodized Marine Grade (25 Micron)', codeSuffix: 'AN25' },
      { id: 'fin-wood', label: 'Wood-Grain Sublimation Finish', codeSuffix: 'WOOD' },
      { id: 'fin-pvdf', label: 'PVDF Fluorocarbon 3-Coat', codeSuffix: 'PVDF' },
      { id: 'fin-mill', label: 'Mill Finish (Raw)', codeSuffix: 'MILL' }
    ]
  },
  {
    id: 'attr-color-choice',
    groupId: 'grp-finish',
    groupName: 'Surface Treatment & Color',
    name: 'Color & RAL Code',
    code: 'COLOR_RAL',
    dataType: 'select',
    isRequired: true,
    displayOrder: 8,
    defaultValue: 'Pure White (RAL 9016)',
    allowedValues: [
      { id: 'col-white', label: 'Pure White (RAL 9016)', codeSuffix: 'W9016' },
      { id: 'col-black-matt', label: 'Matte Jet Black (RAL 9005)', codeSuffix: 'B9005' },
      { id: 'col-anthracite', label: 'Anthracite Grey (RAL 7016)', codeSuffix: 'G7016' },
      { id: 'col-bronze-dark', label: 'Architectural Dark Bronze', codeSuffix: 'BRNZ' },
      { id: 'col-champagne', label: 'Champagne Gold Anodized', codeSuffix: 'CHMP' },
      { id: 'col-teak', label: 'Golden Teak Woodgrain', codeSuffix: 'TEAK' },
      { id: 'col-walnut', label: 'Dark Walnut Woodgrain', codeSuffix: 'WLNT' }
    ]
  },

  // 4. Hardware & Security
  {
    id: 'attr-hardware-grade',
    groupId: 'grp-hardware',
    groupName: 'Hardware & Accessories',
    name: 'Hardware Grade',
    code: 'HARDWARE_GRADE',
    dataType: 'select',
    isRequired: true,
    displayOrder: 9,
    defaultValue: 'Standard Commercial Grade',
    allowedValues: [
      { id: 'hw-std', label: 'Standard Commercial Grade', codeSuffix: 'STD' },
      { id: 'hw-hd', label: 'Heavy-Duty Ball-Bearing Grade', codeSuffix: 'HD' },
      { id: 'hw-prem', label: 'European Premium Multi-Point Grade', codeSuffix: 'PREM' },
      { id: 'hw-marine', label: 'Marine Grade SS316 Coastal Hardware', codeSuffix: 'SS316' }
    ]
  },
  {
    id: 'attr-lock-type',
    groupId: 'grp-hardware',
    groupName: 'Hardware & Accessories',
    name: 'Locking Mechanism',
    code: 'LOCK_TYPE',
    dataType: 'select',
    isRequired: false,
    displayOrder: 10,
    defaultValue: 'Standard Crescent / Touch Lock',
    allowedValues: [
      { id: 'lk-touch', label: 'Standard Crescent / Touch Lock', codeSuffix: 'TCH' },
      { id: 'lk-flush-key', label: 'Flush Keyed Latch Lock', codeSuffix: 'FLK' },
      { id: 'lk-multi-point', label: 'Multi-Point Security Espag Lock', codeSuffix: 'MPL' },
      { id: 'lk-lever', label: 'Heavy Duty Mortise Handle with Euro Cylinder', codeSuffix: 'MOR' },
      { id: 'lk-none', label: 'None (Dummy Handle / Push Plate)', codeSuffix: 'NON' }
    ]
  },
  {
    id: 'attr-roller-type',
    groupId: 'grp-hardware',
    groupName: 'Hardware & Accessories',
    name: 'Sliding Rollers',
    code: 'ROLLER_TYPE',
    dataType: 'select',
    isRequired: false,
    displayOrder: 11,
    defaultValue: 'Standard Nylon Ball-Bearing Roller (Up to 45kg/leaf)',
    allowedValues: [
      { id: 'rol-nylon', label: 'Standard Nylon Ball-Bearing Roller (Up to 45kg/leaf)', codeSuffix: 'NYL' },
      { id: 'rol-ss-tandem', label: 'Heavy-Duty SS304 Tandem Rollers (Up to 120kg/leaf)', codeSuffix: 'TNDM' },
      { id: 'rol-extreme', label: 'Extreme Duty Steel Bearing Rollers (Up to 250kg/leaf)', codeSuffix: 'XTRM' }
    ]
  },

  // 5. Brand Applicability & Alloy
  {
    id: 'attr-brand-spec',
    groupId: 'grp-brand',
    groupName: 'Profile Origin & Brand',
    name: 'Extrusion Brand',
    code: 'BRAND_SPEC',
    dataType: 'select',
    isRequired: true,
    displayOrder: 12,
    defaultValue: 'Alumex Premium',
    allowedValues: [
      { id: 'br-alumex', label: 'Alumex Premium Architectural', codeSuffix: 'ALX' },
      { id: 'br-swisstek', label: 'Swisstek Aluminium', codeSuffix: 'SWK' },
      { id: 'br-stanthony', label: "St. Anthony's Extrusions", codeSuffix: 'STA' },
      { id: 'br-reynaers', label: 'Reynaers European System', codeSuffix: 'REY' },
      { id: 'br-schuco', label: 'Schüco International System', codeSuffix: 'SCH' }
    ]
  },
  {
    id: 'attr-alloy-temper',
    groupId: 'grp-brand',
    groupName: 'Profile Origin & Brand',
    name: 'Aluminium Alloy & Temper',
    code: 'ALLOY_TEMPER',
    dataType: 'select',
    isRequired: false,
    displayOrder: 13,
    defaultValue: '6063-T5 Architectural Alloy',
    allowedValues: [
      { id: 'al-6063-t5', label: '6063-T5 Architectural Alloy', codeSuffix: '6063T5' },
      { id: 'al-6063-t6', label: '6063-T6 High Strength Alloy', codeSuffix: '6063T6' },
      { id: 'al-6061-t6', label: '6061-T6 Structural Marine Alloy', codeSuffix: '6061T6' }
    ]
  },
  // 5. Environmental & Facade Engineering (Enhanced Specification Engine Rules)
  {
    id: 'attr-facade-mullion',
    groupId: 'grp-facade',
    groupName: 'Facade & Structural Grid',
    name: 'Curtain Wall Mullion Depth',
    code: 'FACADE_MULLION',
    dataType: 'select',
    isRequired: false,
    displayOrder: 14,
    defaultValue: '120mm Semi-Unitized Mullion',
    allowedValues: [
      { id: 'mul-100', label: '100mm Stick System Mullion', codeSuffix: 'M100' },
      { id: 'mul-120', label: '120mm Semi-Unitized Mullion', codeSuffix: 'M120' },
      { id: 'mul-150', label: '150mm High-Wind Commercial Mullion', codeSuffix: 'M150' },
      { id: 'mul-200', label: '200mm Heavy High-Rise Structural Mullion', codeSuffix: 'M200' }
    ]
  },
  {
    id: 'attr-thermal-barrier',
    groupId: 'grp-thermal',
    groupName: 'Thermal & Energy Performance',
    name: 'Thermal Break Barrier',
    code: 'THERMAL_BARRIER',
    dataType: 'select',
    isRequired: false,
    displayOrder: 15,
    defaultValue: 'Non-Thermal Standard',
    allowedValues: [
      { id: 'th-none', label: 'Non-Thermal Standard', codeSuffix: 'STD' },
      { id: 'th-148', label: '14.8mm Polyamide Insulating Strip', codeSuffix: 'PA14' },
      { id: 'th-240', label: '24.0mm High-Performance Polyamide Barrier', codeSuffix: 'PA24' },
      { id: 'th-340', label: '34.0mm Multi-Chamber Passive Barrier', codeSuffix: 'PA34' }
    ]
  },
  {
    id: 'attr-acoustic-pvb',
    groupId: 'grp-acoustic',
    groupName: 'Acoustic & Safety Interlayers',
    name: 'Lamination Interlayer',
    code: 'LAMINATION_INTERLAYER',
    dataType: 'select',
    isRequired: false,
    displayOrder: 16,
    defaultValue: 'Monolithic (No Interlayer)',
    allowedValues: [
      { id: 'int-none', label: 'Monolithic (No Interlayer)', codeSuffix: 'MONO' },
      { id: 'int-pvb-038', label: '0.38mm Standard PVB', codeSuffix: 'PVB38' },
      { id: 'int-pvb-076', label: '0.76mm Clear PVB Architectural Grade', codeSuffix: 'PVB76' },
      { id: 'int-pvb-152', label: '1.52mm Heavy Security PVB', codeSuffix: 'PVB152' },
      { id: 'int-ac-076', label: '0.76mm Acoustic Sound-Damping PVB (STC 40+)', codeSuffix: 'AC76' },
      { id: 'int-sgp-152', label: '1.52mm SentryGlas (SGP) Structural Ionoplast', codeSuffix: 'SGP152' }
    ]
  },
  {
    id: 'attr-environment-class',
    groupId: 'grp-corrosion',
    groupName: 'Environmental Exposure & Corrosion',
    name: 'Corrosion Environment Category',
    code: 'ENVIRONMENT_CLASS',
    dataType: 'select',
    isRequired: false,
    displayOrder: 17,
    defaultValue: 'C2 Urban / Inland (<10km from coast)',
    allowedValues: [
      { id: 'env-c1', label: 'C1 Heated Interiors', codeSuffix: 'C1' },
      { id: 'env-c2', label: 'C2 Urban / Inland (>10km from coast)', codeSuffix: 'C2' },
      { id: 'env-c3', label: 'C3 Industrial / Urban Moderate', codeSuffix: 'C3' },
      { id: 'env-c4', label: 'C4 Coastal & Marine Zone (<5km coastline)', codeSuffix: 'C4' },
      { id: 'env-c5', label: 'C5 Extreme Marine / Salt-Spray Oceanfront', codeSuffix: 'C5' }
    ]
  }
];

// Pre-defined Attribute Templates for All Construction Categories
export const MASTER_CONSTRUCTION_TEMPLATES: AttributeTemplate[] = [
  {
    id: 'tmpl-alum-win',
    templateCode: 'TMPL-AL-WIN',
    name: 'Aluminium Windows Specification Template',
    categoryId: 'cat-alum-win',
    description: 'Universal parameter matrix for sliding, casement, and fixed aluminium windows.',
    attributeIds: [
      'attr-system-series',
      'attr-operation-type',
      'attr-panel-count',
      'attr-glass-type',
      'attr-glass-thickness',
      'attr-glass-treatment',
      'attr-finish-type',
      'attr-color-choice',
      'attr-hardware-grade',
      'attr-lock-type',
      'attr-roller-type',
      'attr-brand-spec',
      'attr-alloy-temper',
      'attr-thermal-barrier',
      'attr-acoustic-pvb',
      'attr-environment-class'
    ]
  },
  {
    id: 'tmpl-alum-door',
    templateCode: 'TMPL-AL-DOOR',
    name: 'Aluminium Doors Specification Template',
    categoryId: 'cat-alum-door',
    description: 'Specification schema for heavy-duty sliding, commercial swing, and bi-fold doors.',
    attributeIds: [
      'attr-system-series',
      'attr-operation-type',
      'attr-panel-count',
      'attr-glass-type',
      'attr-glass-thickness',
      'attr-glass-treatment',
      'attr-finish-type',
      'attr-color-choice',
      'attr-hardware-grade',
      'attr-lock-type',
      'attr-roller-type',
      'attr-brand-spec',
      'attr-thermal-barrier',
      'attr-environment-class'
    ]
  },
  {
    id: 'tmpl-curtain-wall',
    templateCode: 'TMPL-CW-FACADE',
    name: 'Curtain Wall & Facade Specification Template',
    categoryId: 'cat-curtain-wall',
    description: 'Structural glazing, stick/unitized mullion frames, pressure plates, and seismic seals.',
    attributeIds: [
      'attr-system-series',
      'attr-facade-mullion',
      'attr-glass-type',
      'attr-glass-thickness',
      'attr-glass-treatment',
      'attr-acoustic-pvb',
      'attr-thermal-barrier',
      'attr-finish-type',
      'attr-color-choice',
      'attr-environment-class',
      'attr-brand-spec',
      'attr-alloy-temper'
    ]
  },
  {
    id: 'tmpl-alum-part',
    templateCode: 'TMPL-AL-PART',
    name: 'Aluminium Partitions Specification Template',
    categoryId: 'cat-alum',
    description: 'Matrix for commercial office partitioning, mid-rails, and solid/glazed modules.',
    attributeIds: [
      'attr-system-series',
      'attr-glass-type',
      'attr-glass-thickness',
      'attr-acoustic-pvb',
      'attr-finish-type',
      'attr-color-choice',
      'attr-brand-spec'
    ]
  },
  {
    id: 'tmpl-glass-glaz',
    templateCode: 'TMPL-GL-GLAZ',
    name: 'Glass & Glazing Architectural Template',
    categoryId: 'cat-glass',
    description: 'Frameless glass balustrades, shower cubicles, and monolithic shopfronts.',
    attributeIds: [
      'attr-glass-type',
      'attr-glass-thickness',
      'attr-glass-treatment',
      'attr-acoustic-pvb',
      'attr-hardware-grade',
      'attr-environment-class'
    ]
  },
  {
    id: 'tmpl-louvre-sun',
    templateCode: 'TMPL-AL-LOUVRE',
    name: 'Aluminium Louvres & Sunshade Template',
    categoryId: 'cat-louvres',
    description: 'Elliptical aerofoil fins, acoustic rain defence louvres, and continuous screening.',
    attributeIds: [
      'attr-system-series',
      'attr-finish-type',
      'attr-color-choice',
      'attr-environment-class',
      'attr-brand-spec',
      'attr-alloy-temper'
    ]
  },
  {
    id: 'tmpl-cladding-acp',
    templateCode: 'TMPL-ACP-CLAD',
    name: 'Aluminium Composite Panel & ACP Cladding',
    categoryId: 'cat-cladding',
    description: 'FR mineral core ACP, ventilated rain-screen sub-framing, and silicone joints.',
    attributeIds: [
      'attr-finish-type',
      'attr-color-choice',
      'attr-environment-class',
      'attr-brand-spec'
    ]
  },
  {
    id: 'tmpl-steel-works',
    templateCode: 'TMPL-ST-WORKS',
    name: 'Structural Steel & Metal Works Template',
    categoryId: 'cat-steel',
    description: 'Steel canopies, handrails, framing, and architectural metal fabrications.',
    attributeIds: [
      'attr-system-series',
      'attr-finish-type',
      'attr-color-choice',
      'attr-hardware-grade',
      'attr-environment-class'
    ]
  }
];

// Technical Compatibility Engine Rule Checker
export function evaluateTechnicalCompatibility(attributes: Record<string, any>): CompatibilityCheckResult {
  const series = String(attributes['SYSTEM_SERIES'] || '');
  const glassThickness = String(attributes['GLASS_THICKNESS'] || '');
  const operation = String(attributes['OPERATION_TYPE'] || '');
  const rollers = String(attributes['ROLLER_TYPE'] || '');
  const glassTreatment = String(attributes['GLASS_TREATMENT'] || '');
  const panelCount = String(attributes['PANEL_COUNT'] || '');

  const messages: string[] = [];
  let status: 'COMPATIBLE' | 'REQUIRES_APPROVAL' | 'NOT_COMPATIBLE' = 'COMPATIBLE';
  let suggestedAction: string | undefined = undefined;

  // Rule 1: 70mm System Glass Pocket Limits
  if (series.includes('70mm')) {
    if (glassThickness.includes('19mm Extra') || glassThickness.includes('19mm DGU') && glassThickness.includes('Single')) {
      return {
        status: 'NOT_COMPATIBLE',
        messages: [
          'Critical: 19mm glass exceeds the maximum pocket capacity (18mm) of the 70mm Standard Series sash.',
          'Physical assembly is impossible without causing profile deformation.'
        ],
        suggestedAction: 'Switch to 80mm Heavy-Duty Series or 100mm Commercial Series.'
      };
    }

    if (glassThickness.includes('12mm') || glassThickness.includes('10mm')) {
      status = 'REQUIRES_APPROVAL';
      messages.push('10mm/12mm monolithic glass requires slim snap-in glazing bead and high-density EPDM wedge.');
      messages.push('Senior Technical Estimator approval required before fabrication.');
    }

    if (glassThickness.includes('24mm DGU')) {
      return {
        status: 'NOT_COMPATIBLE',
        messages: [
          '24mm Double Glazed Unit cannot fit into standard 70mm sliding sash profile (max DGU capacity is 18mm).'
        ],
        suggestedAction: 'Upgrade system series to Thermal Break 75mm or 80mm Series.'
      };
    }
  }

  // Rule 2: Roller Weight Capacity vs Glass Weight
  const isHeavyGlass = glassThickness.includes('8mm') || glassThickness.includes('10mm') || glassThickness.includes('12mm') || glassThickness.includes('DGU') || glassTreatment.includes('Tempered');
  const isMultiPanel = panelCount.includes('3-Panel') || panelCount.includes('4-Panel');

  if (operation.includes('Sliding')) {
    if (isHeavyGlass && rollers.includes('Standard Nylon')) {
      status = 'REQUIRES_APPROVAL';
      messages.push('Warning: Heavy glass specification (>8mm/DGU/Tempered) paired with Standard Nylon Rollers.');
      messages.push('Roller life-cycle may deteriorate prematurely. We strongly recommend Heavy-Duty Tandem SS304 Rollers.');
    }

    if (isMultiPanel && series.includes('70mm') && rollers.includes('Standard Nylon')) {
      messages.push('Notice: Multi-panel sliding sash spans should utilize tandem ball-bearing rollers to guarantee smooth glide.');
    }
  }

  // Rule 3: Wind-Load Safety for High Apertures
  if (glassThickness.includes('5mm') && (operation.includes('Casement') || operation.includes('Swing'))) {
    messages.push('Note: 5mm single glazed panels for hinged units are limited to max 1.8m sash height under standard CP3 wind load.');
  }

  // Rule 4: Marine & Coastal Corrosion Durability (ISO 9223 / C4 & C5 zones)
  const finish = String(attributes['SURFACE_FINISH'] || '');
  const envClass = String(attributes['ENVIRONMENT_CLASS'] || '');
  if (envClass.includes('C4') || envClass.includes('C5')) {
    if (finish.includes('Standard Powder') || finish.includes('Mill Finish')) {
      status = 'REQUIRES_APPROVAL';
      messages.push('Corrosion Alert: Standard powder coating or mill finish in C4/C5 Coastal/Marine environments violates Qualicoat Class 2 / Marine standards.');
      messages.push('Recommendation: Specify minimum 25-micron Architectural Anodizing (Qualanod) or 3-Coat PVDF Kynar 500 coating with 20-year coastal warranty.');
    }
  }

  // Rule 5: Thermal Break Energy Integrity Rule
  const thermal = String(attributes['THERMAL_BARRIER'] || '');
  if (thermal.includes('Polyamide') && (glassThickness.includes('5mm') || glassThickness.includes('6mm Single'))) {
    status = 'REQUIRES_APPROVAL';
    messages.push('Thermal Envelope Mismatch: High-performance Thermal Break profile is paired with single uninsulated glazing (5mm/6mm).');
    messages.push('Thermal bridge savings will be negated by single-glass center-of-pane U-value (5.8 W/m²K). Recommend DGU with Low-E coating.');
  }

  // Rule 6: Human Safety Glazing & Door Impact Rules (BS 6262-4 / SLS 1410)
  const interlayer = String(attributes['LAMINATION_INTERLAYER'] || '');
  if ((operation.includes('Door') || operation.includes('Swing') || operation.includes('Bi-Folding')) && 
      !glassTreatment.includes('Tempered') && !glassTreatment.includes('Laminated') && !interlayer.includes('PVB') && !interlayer.includes('SGP')) {
    status = 'NOT_COMPATIBLE';
    messages.push('Critical Safety Hazard: Doors and critical human impact zones (<800mm FFL) must specify Tempered or Laminated Safety Glass under building regulations BS 6262 Part 4.');
    suggestedAction = 'Upgrade Glass Treatment to Toughened / Tempered Safety Glass or Laminated.';
  }

  // Rule 7: High-Rise Curtain Wall & Large Aperture Mullion Deflection
  const mullion = String(attributes['FACADE_MULLION'] || '');
  if (mullion.includes('100mm') && (series.includes('100mm') || series.includes('Commercial')) && isHeavyGlass) {
    messages.push('Structural Check: 100mm stick mullion with heavy DGU/laminated glass requires wind-load structural deflection verification (Ix >= 180 cm⁴ for 3.6m floor-to-floor heights).');
  }

  // Rule 8: Acoustic PVB Glazing Pairing
  if (interlayer.includes('Acoustic') && series.includes('70mm') && !series.includes('Thermal')) {
    messages.push('Acoustic Recommendation: Sound-damping acoustic PVB achieves maximum Rw rating (42+ dB) when combined with dual perimeter EPDM compression seals.');
  }

  if (messages.length === 0) {
    messages.push('Specification fully complies with British Standards / SLS architectural extrusion criteria.');
  }

  return {
    status,
    messages,
    suggestedAction: status === 'NOT_COMPATIBLE' 
      ? (suggestedAction || 'Rectify incompatible parameters according to technical standards.')
      : (status === 'REQUIRES_APPROVAL' ? 'Request Senior Technical Estimator / QS Sign-Off' : undefined)
  };
}
