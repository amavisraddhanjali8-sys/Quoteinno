import { ProcurementDocumentDefinition } from '../procurementDocTypes';

export const DOCS_41_TO_60: ProcurementDocumentDefinition[] = [
  {
    docNumber: 41,
    id: 'doc-41-material-requisition',
    docCode: 'INV-MR-41',
    title: 'Material Requisition',
    group: 'Requirement',
    barcodeValue: 'INV-MR-41-REQ',
    defaultHeaders: ['Item No.', 'Material Description / Specification', 'Quantity Required', 'Unit', 'Required On Site Date'],
    defaultRecords: [
      { id: 'r1', col1: '01', col2: 'Architectural Aluminum Mullion (6063-T6, RAL 7016 Anthracite)', col3: '24,500', col4: 'kg', col5: '2026-11-15' },
      { id: 'r2', col1: '02', col2: 'Thermal Break Transom Profile (Polyamide Strip)', col3: '18,200', col4: 'kg', col5: '2026-11-18' },
      { id: 'r3', col1: '03', col2: 'Mullion Internal Reinforcement Steel Sleeve (Galvanized S355)', col3: '8,400', col4: 'kg', col5: '2026-11-20' },
      { id: 'r4', col1: '04', col2: 'Die-cast Aluminum Alignment Spigots & Cleats', col3: '1,200', col4: 'pcs', col5: '2026-11-22' }
    ],
    standardClauses: [
      'Materials requested must strictly adhere to the approved project specification and architectural mock-up benchmark.',
      'Requisitions require verified budget availability prior to commercial order placement.'
    ]
  },
  {
    docNumber: 42,
    id: 'doc-42-purchase-requisition',
    docCode: 'INV-PR-42',
    title: 'Purchase Requisition',
    group: 'Requirement',
    barcodeValue: 'INV-PR-42-PURC',
    defaultHeaders: ['PR Line', 'Item & Technical Scope', 'Quantity / UOM', 'Est. Unit Rate', 'Total Est. Budget'],
    defaultRecords: [
      { id: 'r1', col1: '01', col2: 'Double Glazed Solar Control Glass (6+16Ar+6 Low-E)', col3: '1,850 m²', col4: 'AED 380.00', col5: 'AED 703,000' },
      { id: 'r2', col1: '02', col2: 'Spandrel Glass with Ceramic Fritting & Insulation Backpan', col3: '620 m²', col4: 'AED 420.00', col5: 'AED 260,400' },
      { id: 'r3', col1: '03', col2: 'Heavy Duty EPDM Dual Durometer Gasket (Co-extruded)', col3: '9,500 lm', col4: 'AED 14.50', col5: 'AED 137,750' }
    ],
    standardClauses: [
      'Formal requisition initiated by Engineering and verified against Cost Code allowances.',
      'Subject to three-tier approval workflow per financial delegation of authority.'
    ]
  },
  {
    docNumber: 43,
    id: 'doc-43-internal-purchase-request',
    docCode: 'INV-IPR-43',
    title: 'Internal Purchase Request',
    group: 'Requirement',
    barcodeValue: 'INV-IPR-43-INTR',
    defaultHeaders: ['Request Line', 'Department / Cost Center', 'Item Requested', 'Business Justification', 'Estimated Cost'],
    defaultRecords: [
      { id: 'r1', col1: '01', col2: 'Plant Workshop (Fabrication)', col3: 'Replacement CNC Milling Spindle Motor (12kW)', col4: 'Direct breakdown of Line 2', col5: 'AED 48,000' },
      { id: 'r2', col1: '02', col2: 'Façade Design Studio', col3: 'BIM Façade Computation Workstation (64GB RAM, RTX)', col4: 'Complex parametric curtain wall modeling', col5: 'AED 18,500' },
      { id: 'r3', col1: '03', col2: 'Site QA/QC Operations', col3: 'Elcometer Digital Coating Thickness Gauge (Calibrated)', col4: 'Field anodizing audit kit', col5: 'AED 9,200' }
    ],
    standardClauses: [
      'Internal procurement instrument for factory, site, and office equipment capital expenditure.',
      'Requires departmental head authorization and inventory warehouse non-availability clearance.'
    ]
  },
  {
    docNumber: 44,
    id: 'doc-44-site-material-request',
    docCode: 'INV-SMR-44',
    title: 'Site Material Request',
    group: 'Requirement',
    barcodeValue: 'INV-SMR-44-SITE',
    defaultHeaders: ['Site Mark', 'Material / Component', 'Quantity', 'Delivery Location / Level', 'Need Date'],
    defaultRecords: [
      { id: 'r1', col1: 'MK-CW-L12-01', col2: 'Pre-assembled Unitized Façade Panels (Type A)', col3: '36 Panels', col4: 'Floor 12 - South Elevation', col5: '2026-11-25' },
      { id: 'r2', col1: 'MK-BRK-L13', col2: 'Serrated Cast-In Connection Brackets & Shims', col3: '72 Sets', col4: 'Floor 13 - Staging Deck', col5: '2026-11-24' },
      { id: 'r3', col1: 'MK-SEA-WTH', col2: 'Weather Silicone Sausages (DOW 791 Black)', col3: '240 Sausages', col4: 'Site Store Room 2', col5: '2026-11-26' }
    ],
    standardClauses: [
      'Originated by Site Installation Superintendent to call-off fabricated units from factory dispatch yard.',
      'Site receiving coordinator must verify unloading zone clearance and hoisting crane slot prior to truck dispatch.'
    ]
  },
  {
    docNumber: 45,
    id: 'doc-45-material-requirement-sheet',
    docCode: 'INV-MRS-45',
    title: 'Material Requirement Sheet',
    group: 'Requirement',
    barcodeValue: 'INV-MRS-45-SHET',
    defaultHeaders: ['Assembly Code', 'Component Name', 'Gross Qty', 'Scrap Allowance (%)', 'Net Order Qty'],
    defaultRecords: [
      { id: 'r1', col1: 'ASM-MULL-200', col2: 'Extrusion Profile P-2001 (6.5m Bars)', col3: '1,400 Bars', col4: '3.5% Cutting Loss', col5: '1,450 Bars' },
      { id: 'r2', col1: 'ASM-TRAN-150', col2: 'Transom Profile P-1502 (6.0m Bars)', col3: '980 Bars', col4: '3.0% Cutting Loss', col5: '1,010 Bars' },
      { id: 'r3', col1: 'ASM-GLS-TYP1', col2: 'Acoustic Glazing Units (1500 x 3200mm)', col3: '420 Units', col4: '1.5% Breakage Allowance', col5: '426 Units' }
    ],
    standardClauses: [
      'Calculated from approved engineering nesting and cutting optimization software.',
      'Scrap factors adhere to corporate lean manufacturing waste reduction targets.'
    ]
  },
  {
    docNumber: 46,
    id: 'doc-46-material-requirement-schedule',
    docCode: 'INV-MRSC-46',
    title: 'Material Requirement Schedule',
    group: 'Requirement',
    barcodeValue: 'INV-MRSC-46-SCHD',
    defaultHeaders: ['Material Group', 'Phase 1 (Nov)', 'Phase 2 (Dec)', 'Phase 3 (Jan)', 'Total Demand'],
    defaultRecords: [
      { id: 'r1', col1: 'Aluminum Billets & Finished Profiles', col2: '180 MT', col3: '220 MT', col4: '160 MT', col5: '560 MT' },
      { id: 'r2', col1: 'Double Glazed Glass Panels', col2: '2,400 m²', col3: '3,200 m²', col4: '2,800 m²', col5: '8,400 m²' },
      { id: 'r3', col1: 'Galvanized Steel Floor Embeds', col2: '800 Pcs', col3: '1,100 Pcs', col4: '950 Pcs', col5: '2,850 Pcs' },
      { id: 'r4', col1: 'EPDM Compression Gaskets', col2: '25,000 lm', col3: '35,000 lm', col4: '30,000 lm', col5: '90,000 lm' }
    ],
    standardClauses: [
      'Provides suppliers with rolling 90-day visibility for manufacturing line reservation.',
      'Monthly reconciliation with master contractor civil handovers governs release of manufacturing batches.'
    ]
  },
  {
    docNumber: 47,
    id: 'doc-47-bill-of-materials',
    docCode: 'INV-BOM-47',
    title: 'Bill of Materials — BOM',
    group: 'Requirement',
    barcodeValue: 'INV-BOM-47-BOM',
    defaultHeaders: ['Part Number', 'Component Description', 'Material / Grade', 'Qty per Assembly', 'Total Required'],
    defaultRecords: [
      { id: 'r1', col1: 'CW-EXT-01', col2: 'Structural Male Mullion (180mm)', col3: 'Alloy 6063-T6 Powder Coated', col4: '1 Length (3.8m)', col5: '480 Lengths' },
      { id: 'r2', col1: 'CW-EXT-02', col2: 'Structural Female Mullion (180mm)', col3: 'Alloy 6063-T6 Powder Coated', col4: '1 Length (3.8m)', col5: '480 Lengths' },
      { id: 'r3', col1: 'CW-THB-01', col2: 'Polyamide Thermal Insulator Bar', col3: 'PA66 GF25 Insulbar', col4: '2 Strips (3.8m)', col5: '960 Strips' },
      { id: 'r4', col1: 'CW-SS-SCW', col2: 'Heavy Duty Self-Drilling Screws', col3: 'Stainless Steel A4-70 (316)', col4: '24 Pcs', col5: '11,520 Pcs' }
    ],
    standardClauses: [
      'Authoritative engineering BOM extracted directly from 3D parametric BIM curtain wall model.',
      'Every revision must undergo cross-departmental engineering and commercial change control sign-off.'
    ]
  },
  {
    docNumber: 48,
    id: 'doc-48-bill-of-quantities',
    docCode: 'INV-BOQ-48',
    title: 'Bill of Quantities — BOQ',
    group: 'Requirement',
    barcodeValue: 'INV-BOQ-48-BOQ',
    defaultHeaders: ['BOQ Item Ref', 'Work Description', 'Quantity', 'Unit', 'Unit Rate (AED)'],
    defaultRecords: [
      { id: 'r1', col1: '02.01.01', col2: 'Supply and installation of unitized curtain walling Type A1', col3: '4,850', col4: 'm²', col5: '1,420.00' },
      { id: 'r2', col1: '02.01.02', col2: 'Extra over for curved corner unitized panels Type C1', col3: '420', col4: 'm²', col5: '2,150.00' },
      { id: 'r3', col1: '02.02.01', col2: 'Aluminium architectural louvre screens (50% free area)', col3: '850', col4: 'm²', col5: '680.00' },
      { id: 'r4', col1: '02.03.01', col2: 'Structural glass entrance canopy with stainless tension rods', col3: '160', col4: 'm²', col5: '3,800.00' }
    ],
    standardClauses: [
      'Standard method of measurement in accordance with POMI / CESSM4 / NRM2 rules.',
      'Quantities are net in place and inclusive of all necessary fixings, brackets, gaskets, and seals.'
    ]
  },
  {
    docNumber: 49,
    id: 'doc-49-material-take-off',
    docCode: 'INV-MTO-49',
    title: 'Material Take-Off — MTO',
    group: 'Requirement',
    barcodeValue: 'INV-MTO-49-MTO',
    defaultHeaders: ['Drawing No.', 'Grid Location / Elevation', 'Extrusion Weight (kg)', 'Glass Area (m²)', 'Bracket Sets'],
    defaultRecords: [
      { id: 'r1', col1: 'DWG-CW-EL-01', col2: 'Elevation East (Grid 1 to 12)', col3: '14,250 kg', col4: '1,280 m²', col5: '144 Sets' },
      { id: 'r2', col1: 'DWG-CW-EL-02', col2: 'Elevation West (Grid 1 to 12)', col3: '14,250 kg', col4: '1,280 m²', col5: '144 Sets' },
      { id: 'r3', col1: 'DWG-CW-EL-03', col2: 'Elevation North (Grid A to G)', col3: '9,800 kg', col4: '860 m²', col5: '96 Sets' },
      { id: 'r4', col1: 'DWG-CW-EL-04', col2: 'Elevation South (Grid A to G)', col3: '11,200 kg', col4: '980 m²', col5: '112 Sets' }
    ],
    standardClauses: [
      'Verified physical measurement from approved IFC (Issued For Construction) architectural drawings.',
      'Comparison against tender estimate establishes project material efficiency variance.'
    ]
  },
  {
    docNumber: 50,
    id: 'doc-50-equipment-requirement-form',
    docCode: 'INV-ERF-50',
    title: 'Equipment Requirement Form',
    group: 'Requirement',
    barcodeValue: 'INV-ERF-50-EQUIP',
    defaultHeaders: ['Equipment Type', 'Capacity / Specification', 'Quantity', 'Required Duration', 'Purpose / Location'],
    defaultRecords: [
      { id: 'r1', col1: 'Glass Vacuum Lifting Robot', col2: '800 kg Safe Working Load (SWL)', col3: '2 Units', col4: '4 Months', col5: 'Façade unit assembly line' },
      { id: 'r2', col1: 'Hydraulic Scissor Lift', col2: '14m Working Height, Electric Drive', col3: '4 Units', col4: '6 Months', col5: 'Podium and canopy installation' },
      { id: 'r3', col1: 'Mobile Spider Crane', col2: 'Maeda 2.82T SWL with diesel engine', col3: '1 Unit', col4: '5 Months', col5: 'High-level unitized panel placement' }
    ],
    standardClauses: [
      'Equipment requested must be supplied with valid third-party inspection certifications and calibration records.',
      'Plant mobilization is coordinated with site access permits and floor slab load bearing capacities.'
    ]
  },
  {
    docNumber: 51,
    id: 'doc-51-consumable-requirement-form',
    docCode: 'INV-CRF-51',
    title: 'Consumable Requirement Form',
    group: 'Requirement',
    barcodeValue: 'INV-CRF-51-CONS',
    defaultHeaders: ['Consumable Item', 'Brand / Grade', 'Package Size', 'Requisition Qty', 'Monthly Burn Rate'],
    defaultRecords: [
      { id: 'r1', col1: 'Carbide Tipped Circular Saw Blades', col2: 'Freud Pro (500mm x 30mm Bore)', col3: 'Box of 5', col4: '10 Blades', col5: '4 Blades / Month' },
      { id: 'r2', col1: 'Industrial Masking Tape', col2: '3M UV Resistant 48mm', col3: 'Carton of 36 rolls', col4: '20 Cartons', col5: '6 Cartons / Month' },
      { id: 'r3', col1: 'Surface Cleaner & Degreaser', col2: 'DOW Cleaner R-40 Solvent', col3: '25-Litre Drum', col4: '12 Drums', col5: '3 Drums / Month' }
    ],
    standardClauses: [
      'Consumables are subject to strict inventory min-max reordering points.',
      'Hazardous chemicals require updated Material Safety Data Sheets (MSDS) displayed in storage.'
    ]
  },
  {
    docNumber: 52,
    id: 'doc-52-spare-parts-requirement-form',
    docCode: 'INV-SPRF-52',
    title: 'Spare Parts Requirement Form',
    group: 'Requirement',
    barcodeValue: 'INV-SPRF-52-SPAR',
    defaultHeaders: ['Equipment Code', 'Part Name / Number', 'Criticality', 'Quantity', 'Target Delivery'],
    defaultRecords: [
      { id: 'r1', col1: 'CNC-MCH-01', col2: 'Collet Chuck Set (ER32 Precision)', col3: 'High (Line Stop Risk)', col4: '4 Sets', col5: 'Immediate Stock' },
      { id: 'r2', col1: 'ROB-LIFT-02', col2: 'Vacuum Suction Pads & Seal Rings', col3: 'Critical (Safety Risk)', col4: '16 Pads', col5: 'Within 5 Days' },
      { id: 'r3', col1: 'EXT-SAW-03', col2: 'Pneumatic Clamping Cylinder (Festo 63mm)', col3: 'Medium', col4: '2 Units', col5: 'Within 10 Days' }
    ],
    standardClauses: [
      'Maintains buffer of critical spares for high-throughput CNC machining and glass assembly lines.',
      'Only OEM-certified spare parts are authorized for warranty-covered machinery.'
    ]
  },
  {
    docNumber: 53,
    id: 'doc-53-service-requirement-form',
    docCode: 'INV-SRF-53',
    title: 'Service Requirement Form',
    group: 'Requirement',
    barcodeValue: 'INV-SRF-53-SERV',
    defaultHeaders: ['Service Name', 'Scope of Service', 'Service Provider', 'Target Period', 'Budgeted Cost'],
    defaultRecords: [
      { id: 'r1', col1: 'Façade Acoustic Laboratory Testing', col2: 'Sound transmission class (STC) chamber testing', col3: 'Accredited Lab Services', col4: 'November 2026', col5: 'AED 35,000' },
      { id: 'r2', col1: 'Laser Scanning & As-Built Survey', col2: '3D point cloud scan of concrete slab edge deflections', col3: 'Topcon Geospatial Surveys', col4: 'Bi-weekly during erection', col5: 'AED 42,000' },
      { id: 'r3', col1: 'Crane Lifting Rigging Audit', col2: 'Structural inspection of lifting lugs and rigging gear', col3: 'Bureau Veritas Inspection', col4: 'Monthly ongoing', col5: 'AED 18,000' }
    ],
    standardClauses: [
      'Services are contracted under standard professional service agreements with clear deliverable milestones.',
      'Final service sign-off requires submission of certified laboratory or survey reports.'
    ]
  },
  {
    docNumber: 54,
    id: 'doc-54-subcontract-requirement-form',
    docCode: 'INV-SUBRF-54',
    title: 'Subcontract Requirement Form',
    group: 'Requirement',
    barcodeValue: 'INV-SUBRF-54-SUBC',
    defaultHeaders: ['Subcontract Scope', 'Work Volume / Area', 'Mandatory Qualifications', 'Execution Window', 'Estimated Sum'],
    defaultRecords: [
      { id: 'r1', col1: 'Unitized Façade Panel Erection', col2: '12,400 m² (Floors 5 to 38)', col3: 'IRATA Rope Access & Crane Rigging', col4: 'Dec 2026 - May 2027', col5: 'AED 2,850,000' },
      { id: 'r2', col1: 'External Weather Silicone Sealing', col2: '45,000 lm Perimeter Joint', col3: 'Certified Dow Applicator License', col4: 'Jan 2027 - Jun 2027', col5: 'AED 620,000' }
    ],
    standardClauses: [
      'Subcontractors must adhere to project site safety plans, working-at-height permits, and tool inspections.',
      'Progress payments are certified against physical installed panel counts and independent QA punch lists.'
    ]
  },
  {
    docNumber: 55,
    id: 'doc-55-urgent-purchase-request',
    docCode: 'INV-UPR-55',
    title: 'Urgent Purchase Request',
    group: 'Requirement',
    barcodeValue: 'INV-UPR-55-URG',
    defaultHeaders: ['Priority Tier', 'Urgent Material', 'Critical Reason', 'Production Impact', 'Fast-Track Method'],
    defaultRecords: [
      { id: 'r1', col1: 'Priority 1 (Urgent)', col2: 'Corner Mullion Splice Sleeves (Custom milled)', col3: 'Fabrication line waiting on floor 8 corner panels', col4: 'Delay to line dispatch', col5: 'Express Air Courier (48h)' },
      { id: 'r2', col1: 'Priority 2 (High)', col2: 'Specialist Firestop Mineral Wool (2-Hour Rated)', col3: 'Civil defense inspection scheduled Monday', col4: 'Site handover block', col5: 'Local stock direct purchase' }
    ],
    standardClauses: [
      'Fast-track authorization bypassing standard tender timelines upon written Project Director justification.',
      'Emergency premium freight allowances are logged against contingency cost codes.'
    ]
  },
  {
    docNumber: 56,
    id: 'doc-56-emergency-procurement-request',
    docCode: 'INV-EPR-56',
    title: 'Emergency Procurement Request',
    group: 'Requirement',
    barcodeValue: 'INV-EPR-56-EMERG',
    defaultHeaders: ['Emergency Event', 'Emergency Procurement Action', 'Immediate Vendor', 'Authorized Ceiling', 'Sign-Off'],
    defaultRecords: [
      { id: 'r1', col1: 'Storm Damage to Temporary Laydown Roof', col2: 'Heavy duty waterproof tarpaulins & steel shoring', col3: 'Industrial Supply Express', col4: 'AED 25,000', col5: 'Project Director' },
      { id: 'r2', col1: 'Tower Crane Hoist Brake Component Failure', col2: 'OEM replacement braking assembly with field technician', col3: 'Liebherr Middle East', col4: 'AED 65,000', col5: 'Chief Operating Officer' }
    ],
    standardClauses: [
      'Applicable only under force majeure, immediate safety hazards, or sudden catastrophic site stoppage.',
      'Full commercial audit and retrospective documentation reconciliation mandatory within 5 business days.'
    ]
  },
  {
    docNumber: 57,
    id: 'doc-57-replacement-material-request',
    docCode: 'INV-RMR-57',
    title: 'Replacement Material Request',
    group: 'Requirement',
    barcodeValue: 'INV-RMR-57-RPLC',
    defaultHeaders: ['Original Item', 'Defect / Damage Reason', 'Fault Allocation', 'Replacement Qty', 'Chargeback Status'],
    defaultRecords: [
      { id: 'r1', col1: 'Panel GLS-L08-14 (Spandrel)', col2: 'Spontaneous breakage due to site forklift impact', col3: 'Main Contractor Logistics', col4: '1 Unit (1500 x 3800)', col5: 'Chargeback MC-04' },
      { id: 'r2', col1: 'Mullion Profile P-2001 (RAL 7016)', col2: 'Deep scratch gouge penetrating anodizing barrier', col3: 'Transporter Handling', col4: '4 Lengths', col5: 'Claim against carrier' }
    ],
    standardClauses: [
      'Identifies cause of damage and establishes commercial liability prior to replacement manufacturing.',
      'Expedited through production with priority shop floor tracking tags.'
    ]
  },
  {
    docNumber: 58,
    id: 'doc-58-additional-material-request',
    docCode: 'INV-AMR-58',
    title: 'Additional Material Request',
    group: 'Requirement',
    barcodeValue: 'INV-AMR-58-ADDT',
    defaultHeaders: ['Additional Material', 'Justification / Root Cause', 'Original Design Qty', 'Added Quantity', 'Net Budget Impact'],
    defaultRecords: [
      { id: 'r1', col1: 'Cast-In Channel Embeds (Halfen HTA 52/34)', col2: 'Architect extended curtain wall return by 4 bays', col3: '1,200 Pcs', col4: '160 Pcs', col5: '+AED 24,000' },
      { id: 'r2', col1: 'Perimeter EPDM Vapor Barrier Membrane', col2: 'Revised slab soffit detailing requiring wider flap', col3: '4,500 lm', col4: '800 lm', col5: '+AED 11,200' }
    ],
    standardClauses: [
      'Additional materials arising from site design changes must cross-reference approved Project Variation Requests.',
      'Order release occurs upon issuance of verified client variation instruction.'
    ]
  },
  {
    docNumber: 59,
    id: 'doc-59-variation-material-request',
    docCode: 'INV-VMR-59',
    title: 'Variation Material Request',
    group: 'Requirement',
    barcodeValue: 'INV-VMR-59-VARN',
    defaultHeaders: ['Client Variation No.', 'Material Substituted / Modified', 'Previous Material', 'Price Differential', 'Approval'],
    defaultRecords: [
      { id: 'r1', col1: 'CVR-2026-012', col2: 'Acoustic Laminated Glass (8.8.2 PVB Acoustic)', col3: 'Standard Monolithic 6mm', col4: '+AED 185,000', col5: 'Approved by Client' },
      { id: 'r2', col1: 'CVR-2026-015', col2: 'Champagne Metallic Anodized Coating (25μm)', col3: 'Standard Polyester Powder', col4: '+AED 92,000', col5: 'Under Review' }
    ],
    standardClauses: [
      'All commercial rate adjustments, lead time extensions, and testing allowances are agreed prior to material fabrication.',
      'Maintains strict revision control between architect variation drawings and shop floor nesting.'
    ]
  },
  {
    docNumber: 60,
    id: 'doc-60-free-issue-material-request',
    docCode: 'INV-FMR-60',
    title: 'Free-Issue Material Request',
    group: 'Requirement',
    barcodeValue: 'INV-FMR-60-FREE',
    defaultHeaders: ['Free-Issue Material', 'Client / Principle Source', 'Quantity Consigned', 'Storage & Handover', 'Insurance Status'],
    defaultRecords: [
      { id: 'r1', col1: 'Custom Motorized Blinds & Drivers (Somfy)', col2: 'Client Principal Direct Supply', col3: '380 Assemblies', col4: 'Factory Integration Store', col5: 'Client Insured' },
      { id: 'r2', col1: 'Specialist Bronze Architectural Finishes', col2: 'Heritage Conservation Authority', col3: '45 Panels', col4: 'Secure Locked Enclosure', col5: 'Joint Risk Policy' }
    ],
    standardClauses: [
      'Innovista receives and inspects principal-supplied free-issue items for visual defects upon delivery.',
      'Innovista is responsible for safe custody and handling, while product performance warranty remains with the principal.'
    ]
  }
];
