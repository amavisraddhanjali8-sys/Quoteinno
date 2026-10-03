import { ProcurementDocumentDefinition } from '../procurementDocTypes';

export const DOCS_61_TO_89: ProcurementDocumentDefinition[] = [
  {
    docNumber: 61,
    id: 'doc-61-technical-specification',
    docCode: 'INV-TS-61',
    title: 'Technical Specification',
    group: 'Technical',
    barcodeValue: 'INV-TS-61-SPEC',
    defaultHeaders: ['Clause / Section', 'Façade Engineering Requirement', 'Mandatory Code / Standard', 'Acceptance Benchmark', 'Compliance'],
    defaultRecords: [
      { id: 'r1', col1: 'Sec 08.44.00', col2: 'Unitized Curtain Wall Structural Rigidity', col3: 'ASTM E330 / CWCT Standard', col4: 'Deflection <= L/250 or 20mm max', col5: 'Mandatory' },
      { id: 'r2', col1: 'Sec 08.80.00', col2: 'Thermal Transmittance U-Value', col3: 'ISO 10077-2 / NFRC 100', col4: 'Ucw <= 1.4 W/m²K', col5: 'Mandatory' },
      { id: 'r3', col1: 'Sec 08.88.13', col2: 'Acoustic Sound Transmission', col3: 'ASTM E90 / ISO 717-1', col4: 'Rw + Ctr >= 42 dB', col5: 'Mandatory' }
    ],
    standardClauses: [
      'Sets baseline technical criteria for all system profiles, thermal breaks, seals, and anchoring assemblies.',
      'Contractors and fabricators must comply without unapproved deviation.'
    ]
  },
  {
    docNumber: 62,
    id: 'doc-62-material-specification',
    docCode: 'INV-MS-62',
    title: 'Material Specification',
    group: 'Technical',
    barcodeValue: 'INV-MS-62-MATL',
    defaultHeaders: ['Material Component', 'Chemical / Alloy Grade', 'Surface Treatment', 'Mechanical Standard', 'Test Frequency'],
    defaultRecords: [
      { id: 'r1', col1: 'Extruded Profiles', col2: 'Alloy EN AW-6063 T6 (AlMg0.7Si)', col3: 'Qualicoat Class 2 Powder Coat (60-80μm)', col4: 'EN 755-2 Rm >= 215 MPa', col5: 'Every 5 MT Batch' },
      { id: 'r2', col1: 'Structural Cast Brackets', col2: 'Stainless Steel AISI 316 (1.4401)', col3: 'Pickled & Passivated finish', col4: 'EN 10088-3 Yield >= 220 MPa', col5: 'Heat Lot Inspection' },
      { id: 'r3', col1: 'Thermal Insulator Strips', col2: 'Polyamide 6.6 with 25% Glass Fiber', col3: 'Precision Black Extrusion', col4: 'DIN 16941 Tensile >= 80 MPa', col5: 'Factory Production Control' }
    ],
    standardClauses: [
      'Materials must be virgin prime grade sourced strictly from certified primary billet smelters.',
      'Mill test certificates complying with EN 10204 Type 3.1 must accompany every delivered shipment.'
    ]
  },
  {
    docNumber: 63,
    id: 'doc-63-product-specification-sheet',
    docCode: 'INV-PSS-63',
    title: 'Product Specification Sheet',
    group: 'Technical',
    barcodeValue: 'INV-PSS-63-PROD',
    defaultHeaders: ['Product Parameter', 'Nominal Dimension / Value', 'Manufacturing Tolerance', 'Standard Reference', 'Test Verification'],
    defaultRecords: [
      { id: 'r1', col1: 'Profile Sightline Width', col2: '65.0 mm Sightline', col3: '+/- 0.35 mm (Class B)', col4: 'EN 12020-2 Standard', col5: 'Optical Profile Gauge' },
      { id: 'r2', col1: 'Profile System Depth', col2: '185.0 mm Overall', col3: '+/- 0.50 mm (Class B)', col4: 'EN 12020-2 Standard', col5: 'Vernier Caliper Check' },
      { id: 'r3', col1: 'Web Wall Thickness', col2: '2.50 mm Structural Web', col3: '+/- 0.15 mm', col4: 'EN 755-9 Sectional Tolerances', col5: 'Ultrasonic Gauge' }
    ],
    standardClauses: [
      'Authoritative manufacturing dimensional blueprint governing extrusion die extrusion and QA inspection.',
      'Non-compliant dimensional batches will be rejected at factory staging inspection.'
    ]
  },
  {
    docNumber: 64,
    id: 'doc-64-approved-material-specification',
    docCode: 'INV-AMS-64',
    title: 'Approved Material Specification',
    group: 'Technical',
    barcodeValue: 'INV-AMS-64-APPR',
    defaultHeaders: ['Material Head', 'Approved Specification', 'Consultant Submittal Ref', 'Approval Date', 'Status'],
    defaultRecords: [
      { id: 'r1', col1: 'Vision Double Glazing', col2: 'Cool-Lite SKN 165 II (6+16Ar+6.6.2)', col3: 'MAT-SUB-GLS-004 Rev 02', col4: '2026-09-18', col5: 'Approved (Code A)' },
      { id: 'r2', col1: 'Aluminum Architectural Coating', col2: 'Jotun Durasol High Durability Powder (RAL 7016)', col3: 'MAT-SUB-CTN-001 Rev 01', col4: '2026-09-22', col5: 'Approved (Code A)' },
      { id: 'r3', col1: 'Structural Glazing Sealant', col2: 'DOWSIL 983 Two-Part Silicone', col3: 'MAT-SUB-SEA-002 Rev 01', col4: '2026-09-20', col5: 'Approved (Code A)' }
    ],
    standardClauses: [
      'Formal compilation of consultant-endorsed materials authorized for project procurement and fabrication.',
      'No site or factory substitution is permitted without secondary formal engineering deviation sign-off.'
    ]
  },
  {
    docNumber: 65,
    id: 'doc-65-technical-data-sheet',
    docCode: 'INV-TDS-65',
    title: 'Technical Data Sheet',
    group: 'Technical',
    barcodeValue: 'INV-TDS-65-DATA',
    defaultHeaders: ['Physical / Mechanical Property', 'Test Method', 'Design Unit', 'Guaranteed Value', 'Lab Finding'],
    defaultRecords: [
      { id: 'r1', col1: 'Tensile Strength Rm', col2: 'ISO 6892-1 / EN 755-2', col3: 'MPa (N/mm²)', col4: '>= 215 MPa', col5: '232 MPa' },
      { id: 'r2', col1: 'Yield Strength Rp0.2', col2: 'ISO 6892-1 / EN 755-2', col3: 'MPa (N/mm²)', col4: '>= 160 MPa', col5: '185 MPa' },
      { id: 'r3', col1: 'Modulus of Elasticity E', col2: 'ASTM B221 / EN 573', col3: 'GPa (kN/mm²)', col4: '70.0 GPa', col5: '70.5 GPa' },
      { id: 'r4', col1: 'Coefficient of Thermal Expansion', col2: 'ASTM E228 / ISO 11359', col3: 'x10⁻⁶ / K', col4: '23.4', col5: '23.1' }
    ],
    standardClauses: [
      'Published engineering physical values used directly for structural framing finite element calculations.',
      'Verified by independent third-party laboratory material calibration test.'
    ]
  },
  {
    docNumber: 66,
    id: 'doc-66-material-schedule',
    docCode: 'INV-MSCH-66',
    title: 'Material Schedule',
    group: 'Technical',
    barcodeValue: 'INV-MSCH-66-SCHD',
    defaultHeaders: ['System Type', 'Profile / Part Ref', 'Material Description', 'Finish / Treatment', 'Total Scheduled Qty'],
    defaultRecords: [
      { id: 'r1', col1: 'System CW-01 (Vision)', col2: 'Profile MUL-180-01', col3: 'Standard Mullion Extrusion', col4: 'Qualicoat Class 2 RAL 7016', col5: '3,850 m' },
      { id: 'r2', col1: 'System CW-01 (Vision)', col2: 'Profile TRN-150-01', col3: 'Standard Transom Extrusion', col4: 'Qualicoat Class 2 RAL 7016', col5: '2,920 m' },
      { id: 'r3', col1: 'System CW-02 (Spandrel)', col2: 'Panel SPN-ALU-02', col3: '2mm Aluminum Solid Sheet Tray', col4: 'PVDF 3-Coat Metallic Silver', col5: '1,450 m²' }
    ],
    standardClauses: [
      'Comprehensive bill scheduling all components, surface treatments, and allocated linear runs.',
      'Governs master cutting lists and production inventory reservations.'
    ]
  },
  {
    docNumber: 67,
    id: 'doc-67-equipment-specification',
    docCode: 'INV-ES-67',
    title: 'Equipment Specification',
    group: 'Technical',
    barcodeValue: 'INV-ES-67-SPEC',
    defaultHeaders: ['Machinery Parameter', 'Equipment Requirement', 'Standard / Directive', 'Performance Envelope', 'Verification'],
    defaultRecords: [
      { id: 'r1', col1: '5-Axis CNC Profile Machining Center', col2: 'Machining length >= 7,500 mm with dual zone', col3: 'CE Machinery Directive 2006/42/EC', col4: 'Positioning accuracy +/- 0.05 mm', col5: 'Laser Interferometer' },
      { id: 'r2', col1: 'Automated Dual Component Silicone Metering', col2: 'Hydraulic gear dosing pumps with flow meters', col3: 'Ratio range 8:1 to 14:1 by volume', col4: 'Dosing accuracy +/- 1.0%', col5: 'Daily Butterfly Test' }
    ],
    standardClauses: [
      'Applies to capital equipment acquisitions and factory manufacturing plant enhancements.',
      'Equipment acceptance involves Factory Acceptance Testing (FAT) and Site Acceptance Testing (SAT).'
    ]
  },
  {
    docNumber: 68,
    id: 'doc-68-performance-specification',
    docCode: 'INV-PS-68',
    title: 'Performance Specification',
    group: 'Technical',
    barcodeValue: 'INV-PS-68-PERF',
    defaultHeaders: ['Performance Category', 'Test Criterion', 'Standard Test Protocol', 'Design Limit', 'Mock-Up Result'],
    defaultRecords: [
      { id: 'r1', col1: 'Air Permeability', col2: 'Static air infiltration at 600 Pa', col3: 'EN 12152 / CWCT Section 5', col4: '<= 1.5 m³/h.m²', col5: '0.45 m³/h.m² (Pass)' },
      { id: 'r2', col1: 'Watertightness (Static)', col2: 'Static water spray at 600 Pa for 15 min', col3: 'EN 12154 / CWCT Section 6', col4: 'Zero Water Penetration', col5: 'Zero Penetration (Pass)' },
      { id: 'r3', col1: 'Watertightness (Dynamic)', col2: 'Aero-engine dynamic wind & water at 600 Pa', col3: 'CWCT Section 7 / AAMA 501.1', col4: 'Zero Water Penetration', col5: 'Zero Penetration (Pass)' },
      { id: 'r4', col1: 'Wind Resistance (Service)', col2: 'Design wind pressure +/- 2.40 kPa', col3: 'EN 13116 / CWCT Section 8', col4: 'Deflection <= L/200', col5: 'L/340 (Pass)' }
    ],
    standardClauses: [
      'Defines pass/fail criteria for off-site full-scale CWCT laboratory mock-up testing.',
      'Successful certified laboratory test is a strict prerequisite for production extrusion release.'
    ]
  },
  {
    docNumber: 69,
    id: 'doc-69-scope-of-work',
    docCode: 'INV-SOW-69',
    title: 'Scope of Work',
    group: 'Technical',
    barcodeValue: 'INV-SOW-69-WORK',
    defaultHeaders: ['WBS Code', 'Trade / Task Description', 'Detailed Scope Included', 'Deliverables', 'Sign-Off'],
    defaultRecords: [
      { id: 'r1', col1: 'WBS 03.01', col2: 'Engineering Design & Calculations', col3: 'Structural, thermal, acoustic BIM calculations', col4: 'Full Calc Report & BIM IFC model', col5: 'Consultant Sign-off' },
      { id: 'r2', col1: 'WBS 03.02', col2: 'Factory Assembly & Unitizing', col3: 'Factory glazing, siliconing, and panel crating', col4: 'QA Batch Inspection Reports', col5: 'Plant QA Lead' },
      { id: 'r3', col1: 'WBS 03.03', col2: 'Site Hoisting & Alignment', col3: 'Spider crane erection from slab brackets', col4: 'As-built 3D Laser Scan Record', col5: 'Site Resident Eng' }
    ],
    standardClauses: [
      'Defines boundaries and duties under the façade procurement and execution contract.',
      'Work must be executed in accordance with project safety guidelines and environmental standards.'
    ]
  },
  {
    docNumber: 70,
    id: 'doc-70-scope-of-supply',
    docCode: 'INV-SOS-70',
    title: 'Scope of Supply',
    group: 'Technical',
    barcodeValue: 'INV-SOS-70-SPLY',
    defaultHeaders: ['Package Element', 'Supply Scope Description', 'Delivery Term', 'Packaging / Protection', 'Destination'],
    defaultRecords: [
      { id: 'r1', col1: 'Unitized Façade Panels', col2: 'Factory glazed panels complete with brackets', col3: 'DDP Site Laydown Deck', col4: 'Heavy duty steel A-frames', col5: 'Dubai Tower Site' },
      { id: 'r2', col1: 'Loose Fixings & Hardware', col2: 'M16 A4-70 Bolts, serrated washers, shims', col3: 'DDP Site Store', col4: 'Weatherproof sealed crates', col5: 'Dubai Tower Site' }
    ],
    standardClauses: [
      'Details physical hardware and assemblies supplied by the vendor to site.',
      'Unloading and vertical distribution responsibilities are governed by the commercial agreement.'
    ]
  },
  {
    docNumber: 71,
    id: 'doc-71-scope-exclusion-sheet',
    docCode: 'INV-SES-71',
    title: 'Scope Exclusion Sheet',
    group: 'Technical',
    barcodeValue: 'INV-SES-71-EXCL',
    defaultHeaders: ['Trade Interface', 'Explicitly Excluded Activity / Item', 'Responsible Third Party', 'Interface Milestone', 'Condition'],
    defaultRecords: [
      { id: 'r1', col1: 'Civil Concrete Structure', col2: 'Cast-in channel installation and concrete remediation', col3: 'Main Civil Contractor', col4: 'Pre-Erection Survey', col5: 'Tolerance <= 15mm' },
      { id: 'r2', col1: 'Main Plant Hoisting', col2: 'Tower crane hook time and primary power supply', col3: 'Main Contractor Logistics', col4: 'Erection Schedule', col5: 'Shared Resource Slot' },
      { id: 'r3', col1: 'Building Lightning Protection', col2: 'Final earth bonding down-conductor pit connection', col3: 'MEP Subcontractor', col4: 'Parapet Level', col5: 'Continuity Test' }
    ],
    standardClauses: [
      'Prevents contractual scope ambiguity by clearly listing responsibilities of other contractors.',
      'Interfacing works must be coordinated through the project interface management matrix.'
    ]
  },
  {
    docNumber: 72,
    id: 'doc-72-technical-compliance-sheet',
    docCode: 'INV-TCS-72',
    title: 'Technical Compliance Sheet',
    group: 'Technical',
    barcodeValue: 'INV-TCS-72-COMP',
    defaultHeaders: ['Specification Clause', 'Tender Requirement', 'Proposed Bidder Solution', 'Compliance Status', 'Cross Reference'],
    defaultRecords: [
      { id: 'r1', col1: 'Clause 08.44.12', col2: 'Powder coating must meet Qualicoat Class 2', col3: 'Jotun Durasol 60-80 microns (Class 2)', col4: 'Fully Compliant', col5: 'Catalog Sec 4' },
      { id: 'r2', col1: 'Clause 08.44.18', col2: 'Thermal transmittance U-value <= 1.5 W/m²K', col3: 'Calculated Ucw = 1.38 W/m²K with argon gas', col4: 'Exceeds Spec', col5: 'Therm Calc Report' },
      { id: 'r3', col1: 'Clause 08.44.25', col2: 'All hardware screws must be stainless grade 316', col3: 'A4-70 Cold forged stainless screws', col4: 'Fully Compliant', col5: 'MTC Test Sheet' }
    ],
    standardClauses: [
      'Point-by-point compliance schedule evaluating vendor submission against tender specifications.',
      'Any non-compliance or alternative proposal must be highlighted in the technical comparison matrix.'
    ]
  },
  {
    docNumber: 73,
    id: 'doc-73-supplier-compliance-statement',
    docCode: 'INV-SCS-73',
    title: 'Supplier Compliance Statement',
    group: 'Technical',
    barcodeValue: 'INV-SCS-73-STAT',
    defaultHeaders: ['Compliance Domain', 'Standard Imposed', 'Supplier Declaration', 'Audited Evidence', 'Authorized Officer'],
    defaultRecords: [
      { id: 'r1', col1: 'Alloy Composition (6063)', col2: 'EN 573-3 Chemical Limits', col3: 'We certify strict adherence to alloy composition limits', col4: 'Spectrometer Heat Analysis', col5: 'Chief Metallurgist' },
      { id: 'r2', col1: 'Structural Sealant Bonding', col2: 'ASTM C1184 / EOTA ETAG 002', col3: 'We certify chemical compatibility with anodized substrate', col4: 'H-Piece Adhesion Test', col5: 'Technical Director' }
    ],
    standardClauses: [
      'Formal legal declaration signed by supplier technical director affirming compliance with engineering standards.',
      'Supplier indemnifies the project against costs resulting from unapproved material deviations.'
    ]
  },
  {
    docNumber: 74,
    id: 'doc-74-technical-evaluation-sheet',
    docCode: 'INV-TES-74',
    title: 'Technical Evaluation Sheet',
    group: 'Technical',
    barcodeValue: 'INV-TES-74-EVAL',
    defaultHeaders: ['Evaluation Domain', 'Criteria Weight', 'Bidder A (Alumex)', 'Bidder B (Gulf Ext)', 'Bidder C (Schueco)'],
    defaultRecords: [
      { id: 'r1', col1: 'Die Manufacturing Capability', col2: '25%', col3: '94% (In-house wire EDM)', col4: '88% (Outsourced)', col5: '96% (Proprietary)' },
      { id: 'r2', col1: 'Testing & CWCT Experience', col2: '25%', col3: '92% (12 tests passed)', col4: '85% (8 tests passed)', col5: '95% (Industry benchmark)' },
      { id: 'r3', col1: 'Production Output & Lead Time', col2: '30%', col3: '90% (2-3 weeks)', col4: '82% (4-5 weeks)', col5: '88% (3-4 weeks)' },
      { id: 'r4', col1: 'Quality Management & Traceability', col2: '20%', col3: '95% (Barcoded bundles)', col4: '80% (Batch tagged)', col5: '96% (RFID tracking)' }
    ],
    standardClauses: [
      'Comparative scoring matrix by the technical evaluation panel.',
      'Suppliers scoring below 80% composite are technically disqualified from commercial bid opening.'
    ]
  },
  {
    docNumber: 75,
    id: 'doc-75-technical-comparison-sheet',
    docCode: 'INV-TCS-75',
    title: 'Technical Comparison Sheet',
    group: 'Technical',
    barcodeValue: 'INV-TCS-75-COMP',
    defaultHeaders: ['Feature / Requirement', 'Tender Benchmark', 'Alumex Solution', 'Gulf Extrusions', 'Recommendation'],
    defaultRecords: [
      { id: 'r1', col1: 'Mullion Moment of Inertia Ix', col2: '>= 480 cm⁴', col3: '495 cm⁴ (Weight 7.8 kg/m)', col4: '482 cm⁴ (Weight 8.1 kg/m)', col5: 'Alumex (Lighter & Stiffer)' },
      { id: 'r2', col1: 'Thermal Isolator Thickness', col2: '>= 24 mm Polyamide', col3: '28 mm Technoform Strip', col4: '24 mm Standard Strip', col5: 'Alumex (Superior Thermal)' },
      { id: 'r3', col1: 'Coating Warranty Duration', col2: '10 Years Marine Class', col3: '15 Years Qualicoat 2', col4: '10 Years Qualicoat 1', col5: 'Alumex (Longer Warranty)' }
    ],
    standardClauses: [
      'Direct cross-comparison of technical solutions proposed by competing tenderers.',
      'Supports the final tender award recommendation report submitted to the steering committee.'
    ]
  },
  {
    docNumber: 76,
    id: 'doc-76-drawing-requirement',
    docCode: 'INV-DR-76',
    title: 'Drawing Requirement',
    group: 'Technical',
    barcodeValue: 'INV-DR-76-DWG',
    defaultHeaders: ['Drawing Category', 'Scale & Format Required', 'Drawing Content Deliverables', 'Submission Milestone', 'Review Cycle'],
    defaultRecords: [
      { id: 'r1', col1: 'Master Key Plans & Elevations', col2: 'Scale 1:100 / 1:50 (AutoCAD & PDF)', col3: 'Grid layouts, panel type numbering, levels', col4: '4 Weeks from Award', col5: '10 Business Days' },
      { id: 'r2', col1: 'Unitized Façade Typology Sheets', col2: 'Scale 1:20 (BIM Model LOD 400)', col3: 'Panel elevations, section cuts, glass marks', col4: '6 Weeks from Award', col5: '10 Business Days' },
      { id: 'r3', col1: 'Full-Scale Joint Details (1:1)', col2: 'Scale 1:1 & 1:2 (BIM Revit Parametric)', col3: 'Extrusion interlocks, gaskets, thermal breaks', col4: '6 Weeks from Award', col5: '10 Business Days' }
    ],
    standardClauses: [
      'Drawings must comply with project CAD/BIM drafting protocols and title block standards.',
      'All revisions must clearly highlight cloud revisions and detailed revision historical notes.'
    ]
  },
  {
    docNumber: 77,
    id: 'doc-77-shop-drawing-requirement',
    docCode: 'INV-SDR-77',
    title: 'Shop Drawing Requirement',
    group: 'Technical',
    barcodeValue: 'INV-SDR-77-SHOP',
    defaultHeaders: ['Shop Drawing Package', 'Scope Included', 'Calculation Integration', 'Submission Target', 'Approval Status'],
    defaultRecords: [
      { id: 'r1', col1: 'PKG-SD-01 Standard Mullions', col2: 'Full assembly and fabrication milling sheets', col3: 'Structural Calculation Calc-01', col4: '2026-10-25', col5: 'Consultant Code B' },
      { id: 'r2', col1: 'PKG-SD-02 Corner Assemblies', col2: 'Mitred and welded corner unit fabrication', col3: 'Wind Tunnel Pressure Data', col4: '2026-11-05', col5: 'Draft In Review' }
    ],
    standardClauses: [
      'Shop drawings must be stamped and signed by an accredited registered Façade Structural Engineer.',
      'No fabrication may commence based on drawings holding status other than Code A or Code B with comments resolved.'
    ]
  },
  {
    docNumber: 78,
    id: 'doc-78-design-submission-requirement',
    docCode: 'INV-DSR-78',
    title: 'Design Submission Requirement',
    group: 'Technical',
    barcodeValue: 'INV-DSR-78-DSGN',
    defaultHeaders: ['Deliverable Package', 'Engineering Discipline', 'Required Software / Format', 'Standards Benchmark', 'Target Release'],
    defaultRecords: [
      { id: 'r1', col1: 'Structural Calculations Dossier', col2: 'Façade Structural Engineering', col3: 'SJ Mepla & Strand7 FEA (Signed PDF)', col4: 'EN 1991 / EN 1999 (Eurocodes)', col5: '2026-10-18' },
      { id: 'r2', col1: 'Thermal Transmittance Analysis', col2: 'Façade Physics & Thermal', col3: 'LBNL THERM 7.8 Simulation', col4: 'ISO 10077-2 / ASHRAE 90.1', col5: '2026-10-20' },
      { id: 'r3', col1: 'Acoustic Sound Insulation Study', col2: 'Façade Acoustics', col3: 'INSUL Acoustic Modeling Dossier', col4: 'ISO 717-1 Laboratory Correlated', col5: '2026-10-22' }
    ],
    standardClauses: [
      'Design packages require peer review by senior facade engineer prior to client consultant submission.',
      'Design submittal transmittals are logged in the project document management system.'
    ]
  },
  {
    docNumber: 79,
    id: 'doc-79-method-statement-requirement',
    docCode: 'INV-MSR-79',
    title: 'Method Statement Requirement',
    group: 'Technical',
    barcodeValue: 'INV-MSR-79-METH',
    defaultHeaders: ['Site Operation', 'Method Statement Scope', 'Risk Assessment (RAMS)', 'Required Plant', 'Approval Stage'],
    defaultRecords: [
      { id: 'r1', col1: 'Unitized Panel Installation', col2: 'Unloading, floor distribution, and hoist erection', col3: 'RAMS-CW-001 (Fall Protection)', col4: 'Spider Crane, Floor Winch, Vacuum Lifter', col5: 'Approved by Safety Dir' },
      { id: 'r2', col1: 'External Gasket Replacement', col2: 'Cradle-based exterior perimeter servicing', col3: 'RAMS-CW-002 (Suspended Platform)', col4: 'BMU Building Maintenance Cradle', col5: 'Under Review' }
    ],
    standardClauses: [
      'Comprehensive Safe Work Method Statements (SWMS) must be inducted to site teams prior to task start.',
      'Includes emergency rescue plans and dynamic wind threshold operating limitations.'
    ]
  },
  {
    docNumber: 80,
    id: 'doc-80-sample-submission-request',
    docCode: 'INV-SSR-80',
    title: 'Sample Submission Request',
    group: 'Technical',
    barcodeValue: 'INV-SSR-80-SAMP',
    defaultHeaders: ['Sample Tag', 'Sample Description', 'Dimensions / Quantity', 'Finish / Color Code', 'Required Date'],
    defaultRecords: [
      { id: 'r1', col1: 'SMP-GLS-01', col2: 'Vision Double Glazing Sample with Argon Seal', col3: '300 x 300 mm (2 Samples)', col4: 'Neutral 60/32 Coating', col5: '2026-10-12' },
      { id: 'r2', col1: 'SMP-EXT-02', col2: 'Extruded Mullion Corner Cut-Off Piece', col3: '200 mm Length (2 Pieces)', col4: 'Qualicoat Class 2 RAL 7016', col5: '2026-10-15' },
      { id: 'r3', col1: 'SMP-GSK-03', col2: 'Vulcanized EPDM Corner Gasket Sample', col3: '300 x 300 mm Corner (1 Unit)', col4: 'Molded 70 Shore A Black', col5: '2026-10-16' }
    ],
    standardClauses: [
      'Samples are submitted for physical visual appraisal and color approval by Architect and Client.',
      'Approved master samples are tagged and held in the site benchmark sample room.'
    ]
  },
  {
    docNumber: 81,
    id: 'doc-81-material-sample-approval-form',
    docCode: 'INV-MSAF-81',
    title: 'Material Sample Approval Form',
    group: 'Technical',
    barcodeValue: 'INV-MSAF-81-SMPA',
    defaultHeaders: ['Sample Tag Ref', 'Material Type', 'Visual Inspection Result', 'Architect Determination', 'Master Sample Tag'],
    defaultRecords: [
      { id: 'r1', col1: 'SMP-GLS-01', col2: 'Vision Double Glazing (6+16Ar+6)', col3: 'Light transmittance and reflection verified', col4: 'Approved (Code A)', col5: 'MST-GLS-2026-01' },
      { id: 'r2', col1: 'SMP-EXT-02', col2: 'Powder Coated Profile Sample (RAL 7016)', col3: 'Gloss level 30% verified with glossmeter', col4: 'Approved (Code A)', col5: 'MST-EXT-2026-02' }
    ],
    standardClauses: [
      'Formal architectural endorsement constituting master production benchmark standard.',
      'Production materials deviating from master sample range will be subject to rejection.'
    ]
  },
  {
    docNumber: 82,
    id: 'doc-82-product-approval-request',
    docCode: 'INV-PAR-82',
    title: 'Product Approval Request',
    group: 'Technical',
    barcodeValue: 'INV-PAR-82-PROD',
    defaultHeaders: ['Product Brand / Model', 'Manufacturer', 'System Application', 'Accreditation Certs', 'Recommendation'],
    defaultRecords: [
      { id: 'r1', col1: 'DOWSIL 983 Structural Glazing', col2: 'Dow Chemical (USA)', col3: 'Structural silicone bonding joint', col4: 'ETA-01/0005 / ASTM C1184', col5: 'Recommended for Approval' },
      { id: 'r2', col1: 'Technoform Bautec PA66 GF25', col2: 'Technoform Group (Germany)', col3: 'Polyamide thermal insulator bar', col4: 'DIN 16941 / ISO 9001', col5: 'Recommended for Approval' }
    ],
    standardClauses: [
      'Initiates formal consultant approval for manufactured proprietary system components.',
      'Includes manufacturer warranties and long-term weathering test records.'
    ]
  },
  {
    docNumber: 83,
    id: 'doc-83-material-approval-request',
    docCode: 'INV-MAR-83',
    title: 'Material Approval Request',
    group: 'Technical',
    barcodeValue: 'INV-MAR-83-MATL',
    defaultHeaders: ['Submittal Ref', 'Material Description', 'Specified Standard', 'Proposed Origin / Mill', 'Status'],
    defaultRecords: [
      { id: 'r1', col1: 'MAR-CW-01', col2: 'Alloy 6063-T6 Extrusion Billets', col3: 'ASTM B221 / EN 755', col4: 'Alumex Primary Smelter Certified', col5: 'Approved Code A' },
      { id: 'r2', col1: 'MAR-CW-02', col2: 'Class 2 Super-Durable Architectural Powder', col3: 'AAMA 2604 / Qualicoat Class 2', col4: 'Jotun Powder Coatings Certified', col5: 'Approved Code A' }
    ],
    standardClauses: [
      'Standard material approval form complying with project specification administrative provisions.',
      'Approved materials form the baseline for factory quality assurance audits.'
    ]
  },
  {
    docNumber: 84,
    id: 'doc-84-alternative-material-proposal',
    docCode: 'INV-AMP-84',
    title: 'Alternative Material Proposal',
    group: 'Technical',
    barcodeValue: 'INV-AMP-84-ALTR',
    defaultHeaders: ['Specified Material', 'Proposed Alternative Material', 'Technical Equivalence', 'Commercial Benefit', 'Lead Time Impact'],
    defaultRecords: [
      { id: 'r1', col1: 'Standard 3-Coat Liquid PVDF Paint', col2: 'Qualicoat Class 2 Super-Durable Powder', col3: 'Equal 15-Year Weatherability & UV Resistance', col4: 'Cost reduction of AED 85,000', col5: 'Lead time reduced by 2 weeks' },
      { id: 'r2', col1: 'Milled Solid Steel Anchors', col2: 'Cast Ductile Iron Serrated Brackets', col3: 'Equal structural shear & tensile capacity', col4: 'Cost reduction of AED 42,000', col5: 'Local stock availability' }
    ],
    standardClauses: [
      'Value engineering proposal demonstrating equal or superior engineering performance.',
      'Client retains final authority to approve or decline proposed alternative.'
    ]
  },
  {
    docNumber: 85,
    id: 'doc-85-substitution-request',
    docCode: 'INV-SUB-85',
    title: 'Substitution Request',
    group: 'Technical',
    barcodeValue: 'INV-SUB-85-SUBS',
    defaultHeaders: ['Specified Item', 'Proposed Substitute', 'Reason for Substitution', 'Performance Comparison', 'Impact on Warranty'],
    defaultRecords: [
      { id: 'r1', col1: 'Sika SG-500 Silicone', col2: 'DOWSIL 983 Two-Part Silicone', col3: 'Factory supply chain availability lead time', col4: 'Both meet ETAG 002 / ASTM C1184', col5: 'Full 10-Year Warranty Preserved' },
      { id: 'r2', col1: 'Giesse Window Handle Ref 01', col2: 'Savio Heavy Duty Multipoint Handle', col3: 'Discontinued product line by OEM', col4: 'Matches mounting footprint and cycle test', col5: 'Full 5-Year Warranty' }
    ],
    standardClauses: [
      'Documented justification for material changes driven by obsolescence or market supply disruption.',
      'Requires unanimous sign-off by Façade Consultant and Client Representative.'
    ]
  },
  {
    docNumber: 86,
    id: 'doc-86-technical-clarification-request',
    docCode: 'INV-TCR-86',
    title: 'Technical Clarification Request',
    group: 'Technical',
    barcodeValue: 'INV-TCR-86-CLAR',
    defaultHeaders: ['Drawing / Spec Ref', 'Ambiguity / Discrepancy Observed', 'Proposed Contractor Interpretation', 'Consultant Response', 'Resolution Date'],
    defaultRecords: [
      { id: 'r1', col1: 'Spec Sec 08.44 vs Arch DWG-102', col2: 'Spec states Ucw 1.4 W/m²K; drawing notes Ucw 1.2 W/m²K', col3: 'Adopt Ucw 1.4 for vision and add insulated spandrel', col4: 'Consultant confirms Ucw 1.3 composite', col5: '2026-10-04' },
      { id: 'r2', col1: 'Structural Model vs Slab Edge', col2: 'Concrete edge beam shows 30mm step at grid 8', col3: 'Provide extended slotted bracket with stiffener', col4: 'Consultant approves bracket detail', col5: '2026-10-06' }
    ],
    standardClauses: [
      'Resolves drawing and specification conflicts during pre-construction engineering.',
      'Clarifications with schedule or cost consequences must be cross-referenced to project variations.'
    ]
  },
  {
    docNumber: 87,
    id: 'doc-87-request-for-information',
    docCode: 'INV-RFI-87',
    title: 'Request for Information — RFI',
    group: 'Technical',
    barcodeValue: 'INV-RFI-87-RFI',
    defaultHeaders: ['RFI Number', 'Information Requested', 'Impacted Disciplines', 'Required Response Date', 'Status'],
    defaultRecords: [
      { id: 'r1', col1: 'RFI-CW-041', col2: 'Provide BMU roof restraint pin locations and roof slab anchor forces', col3: 'Façade / BMU Specialist / Civil', col4: '2026-10-10', col5: 'Closed with Drawing' },
      { id: 'r2', col1: 'RFI-CW-042', col2: 'Confirm fire stop compartmentation rating between floor 14 plant room and facade', col3: 'Fire Engineering / MEP / Façade', col4: '2026-10-12', col5: 'Pending Review' }
    ],
    standardClauses: [
      'Standard project correspondence instrument for technical queries between contractor and consultant.',
      'Responses are legally binding modifications to technical execution scope.'
    ]
  },
  {
    docNumber: 88,
    id: 'doc-88-technical-deviation-request',
    docCode: 'INV-TDR-88',
    title: 'Technical Deviation Request',
    group: 'Technical',
    barcodeValue: 'INV-TDR-88-DEVR',
    defaultHeaders: ['Deviation Code', 'Specified Requirement', 'Proposed Physical Deviation', 'Engineering Justification', 'Safety Factor Impact'],
    defaultRecords: [
      { id: 'r1', col1: 'TDR-001', col2: 'Maximum mullion span deflection L/250 (15.2mm)', col3: 'Calculated deflection L/238 (16.0mm) at podium bay 3', col4: 'Glass bite depth increased from 15mm to 20mm', col5: 'Safety Factor remains > 1.75' },
      { id: 'r2', col1: 'TDR-002', col2: 'Anodizing minimum thickness 20 microns on concealed face', col3: 'Concealed internal pocket anodizing 15 microns', col4: 'Fully enclosed pocket protected by EPDM gasket', col5: 'Zero corrosion risk verified' }
    ],
    standardClauses: [
      'Formal instrument when physical construction or manufacturing requires deviation from contract spec.',
      'Engineering calculations must verify structural safety and durability remain uncompromised.'
    ]
  },
  {
    docNumber: 89,
    id: 'doc-89-technical-deviation-approval',
    docCode: 'INV-TDA-89',
    title: 'Technical Deviation Approval',
    group: 'Technical',
    barcodeValue: 'INV-TDA-89-DEVA',
    defaultHeaders: ['Deviation Ref', 'Approved Scope', 'Conditions Imposed', 'Authorized By', 'Date of Authorization'],
    defaultRecords: [
      { id: 'r1', col1: 'TDR-001 Podium Mullion', col2: 'Approved deflection 16.0mm with 20mm glass bite', col3: 'Vendor must conduct physical pull-out test on silicone', col4: 'Chief Façade Engineer', col5: '2026-10-08' },
      { id: 'r2', col1: 'TDR-002 Concealed Pocket', col2: 'Approved 15 micron internal coating', col3: 'Apply silicone fogging seal on internal pocket joints', col4: 'Lead QA/QC Auditor', col5: '2026-10-10' }
    ],
    standardClauses: [
      'Formal executive sign-off granting technical concession for specific batch or installation lot.',
      'All imposed conditions must be verified and logged in the QA/QC handover closeout file.'
    ]
  }
];
