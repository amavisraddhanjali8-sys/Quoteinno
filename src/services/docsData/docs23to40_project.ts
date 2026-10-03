import { ProcurementDocumentDefinition } from '../procurementDocTypes';

export const DOCS_23_TO_40: ProcurementDocumentDefinition[] = [
  {
    docNumber: 23,
    id: 'doc-23-project-procurement-plan',
    docCode: 'INV-PPP-23',
    title: 'Project Procurement Plan',
    group: 'Project',
    barcodeValue: 'INV-PPP-23-PROJ',
    defaultHeaders: ['Package Code', 'Work Package Description', 'Procurement Route', 'Target Award Date', 'Estimated Value'],
    defaultRecords: [
      { id: 'r1', col1: 'PKG-CW-EXT', col2: 'Architectural Aluminum Extrusions & Dies', col3: 'Direct Framework Mill Order', col4: '2026-10-15', col5: 'AED 4,850,000' },
      { id: 'r2', col1: 'PKG-CW-GLS', col2: 'Double Glazed High-Performance Units', col3: 'Competitive Sourcing Tender (3 Bids)', col4: '2026-10-30', col5: 'AED 6,200,000' },
      { id: 'r3', col1: 'PKG-CW-BRK', col2: 'Stainless Steel Cast-In Anchors & Brackets', col3: 'Specialist Subcontract Fabrication', col4: '2026-11-10', col5: 'AED 1,450,000' },
      { id: 'r4', col1: 'PKG-CW-ACC', col2: 'Structural Sealant & EPDM Gasket System', col3: 'Approved Vendor Direct PO', col4: '2026-11-20', col5: 'AED 780,000' }
    ],
    standardClauses: [
      'Procurement operations shall comply with baseline contract specifications, master milestone schedules, and budget allocations.',
      'All critical packages require multi-party technical evaluation and client consultant approval prior to commitment.',
      'Lead times must incorporate mandatory CWCT prototype testing and factory visual mock-up approval windows.'
    ]
  },
  {
    docNumber: 24,
    id: 'doc-24-procurement-strategy',
    docCode: 'INV-STR-24',
    title: 'Procurement Strategy',
    group: 'Project',
    barcodeValue: 'INV-STR-24-STRAT',
    defaultHeaders: ['Strategic Pillar', 'Market Context / Risk Factor', 'Strategic Mitigation Approach', 'Contract Mechanism', 'Key Milestone'],
    defaultRecords: [
      { id: 'r1', col1: 'Raw Material Hedging', col2: 'LME aluminum billet price volatility', col3: 'Indexation lock & forward hedging contracts', col4: 'Framework Pass-Through', col5: 'Q4 2026' },
      { id: 'r2', col1: 'Long-Lead Glass Supply', col2: 'Coatings imported from Europe (16 wk lead)', col3: 'Early commitment of float glass billets', col4: 'L/C at Sight Backed', col5: 'Milestone 02' },
      { id: 'r3', col1: 'Site Hoisting & Rigging', col2: 'Tower crane hook time availability restrictions', col3: 'Spider crane & monorail hoisting subcontract', col4: 'Lump Sum Subcontract', col5: 'Podium Level' }
    ],
    standardClauses: [
      'Strategic procurement directives balance lowest compliant total lifecycle cost with stringent delivery certainty.',
      'Sourcing models prioritize verified Tier 1 manufacturers to mitigate single-source failure modes.'
    ]
  },
  {
    docNumber: 25,
    id: 'doc-25-procurement-schedule',
    docCode: 'INV-SCH-25',
    title: 'Procurement Schedule',
    group: 'Project',
    barcodeValue: 'INV-SCH-25-SCHED',
    defaultHeaders: ['Item / Package', 'Requisition Date', 'RFQ Tender Issue', 'PO Award Date', 'Required on Site'],
    defaultRecords: [
      { id: 'r1', col1: 'Curtain Wall Extrusions', col2: '2026-10-01', col3: '2026-10-10', col4: '2026-10-28', col5: '2026-12-15' },
      { id: 'r2', col1: 'Low-E Insulated Glass Units', col2: '2026-10-05', col3: '2026-10-18', col4: '2026-11-05', col5: '2027-01-10' },
      { id: 'r3', col1: 'Galvanized Cast-In Channels', col2: '2026-09-28', col3: '2026-10-08', col4: '2026-10-20', col5: '2026-11-15' },
      { id: 'r4', col1: 'Spider Crane Mobile Hoists', col2: '2026-10-15', col3: '2026-10-25', col4: '2026-11-15', col5: '2026-12-28' }
    ],
    standardClauses: [
      'Schedule activities are linked to the master engineering WBS and critical path erection milestones.',
      'Any variance exceeding 5 working days triggers an automated schedule recovery mitigation workshop.'
    ]
  },
  {
    docNumber: 26,
    id: 'doc-26-procurement-responsibility-matrix',
    docCode: 'INV-RACI-26',
    title: 'Procurement Responsibility Matrix',
    group: 'Project',
    barcodeValue: 'INV-RACI-26-MATX',
    defaultHeaders: ['Procurement Step / Milestone', 'Procurement Lead', 'Project Director', 'Commercial Manager', 'Engineering / QA'],
    defaultRecords: [
      { id: 'r1', col1: 'Technical Specification Sign-Off', col2: 'Consulted (C)', col3: 'Informed (I)', col4: 'Consulted (C)', col5: 'Responsible (R)' },
      { id: 'r2', col1: 'Commercial Tender Issuance', col2: 'Responsible (R)', col3: 'Accountable (A)', col4: 'Accountable (A)', col5: 'Informed (I)' },
      { id: 'r3', col1: 'Bid Evaluation & Recommendation', col2: 'Responsible (R)', col3: 'Approver (A)', col4: 'Reviewer (R)', col5: 'Technical Clear (C)' },
      { id: 'r4', col1: 'PO Execution & Order Placement', col2: 'Responsible (R)', col3: 'Signatory (A)', col4: 'Signatory (A)', col5: 'Informed (I)' }
    ],
    standardClauses: [
      'Segregation of duties (SoD) is strictly enforced between requisition originators, commercial approvers, and receiving inspectors.',
      'No single individual may originate, commercially approve, and receive the same procurement commitment.'
    ]
  },
  {
    docNumber: 27,
    id: 'doc-27-procurement-budget',
    docCode: 'INV-BDG-27',
    title: 'Procurement Budget',
    group: 'Project',
    barcodeValue: 'INV-BDG-27-BUDG',
    defaultHeaders: ['Cost Code / Discipline', 'Baseline Budget (AED)', 'Committed to Date', 'Forecast at Completion', 'Variance / Status'],
    defaultRecords: [
      { id: 'r1', col1: '01.00 Aluminum Extrusions & Finishes', col2: '5,200,000', col3: '4,850,000', col4: '4,980,000', col5: '+220,000 (Favorable)' },
      { id: 'r2', col1: '02.00 Glass Panels & Spandrels', col2: '6,800,000', col3: '6,200,000', col4: '6,650,000', col5: '+150,000 (Favorable)' },
      { id: 'r3', col1: '03.00 Steel Embeds & Structural Brackets', col2: '1,600,000', col3: '1,450,000', col4: '1,560,000', col5: '+40,000 (Favorable)' },
      { id: 'r4', col1: '04.00 Sealants, Gaskets & Backer Rods', col2: '850,000', col3: '780,000', col4: '810,000', col5: '+40,000 (Favorable)' }
    ],
    standardClauses: [
      'Budget commitments are tracked in real time against approved contract allowances and client variation orders.',
      'Transfers between cost categories require formal Change Control Board approval and CFO authorization.'
    ]
  },
  {
    docNumber: 28,
    id: 'doc-28-procurement-cost-plan',
    docCode: 'INV-PCP-28',
    title: 'Procurement Cost Plan',
    group: 'Project',
    barcodeValue: 'INV-PCP-28-COST',
    defaultHeaders: ['Cost Element', 'Planned Allocation', 'Current Commitment', 'Anticipated Incurrence Month', 'Target Savings'],
    defaultRecords: [
      { id: 'r1', col1: 'Primary Aluminum Billets & Dies', col2: 'AED 3,600,000', col3: 'AED 3,450,000', col4: 'November 2026', col5: 'AED 150,000' },
      { id: 'r2', col1: 'High Performance Glazing Fabrications', col2: 'AED 5,400,000', col3: 'AED 5,100,000', col4: 'December 2026', col5: 'AED 300,000' },
      { id: 'r3', col1: 'Installation Access Plant & Spider Cranes', col2: 'AED 920,000', col3: 'AED 860,000', col4: 'January 2027', col5: 'AED 60,000' }
    ],
    standardClauses: [
      'The Cost Plan reflects phased cash outflow forecasts reconciled with project progress drawdowns.',
      'Value engineering initiatives are actively audited against architectural aesthetic and acoustic specifications.'
    ]
  },
  {
    docNumber: 29,
    id: 'doc-29-procurement-package-register',
    docCode: 'INV-PPR-29',
    title: 'Procurement Package Register',
    group: 'Project',
    barcodeValue: 'INV-PPR-29-PACK',
    defaultHeaders: ['Package ID', 'Scope of Package', 'Procurement Strategy', 'Assigned Specialist', 'Current Stage'],
    defaultRecords: [
      { id: 'r1', col1: 'PKG-01', col2: 'Curtain Wall Unitized Profiles', col3: 'Direct Framework Sourcing', col4: 'Alexander Vance', col5: 'PO Issued' },
      { id: 'r2', col1: 'PKG-02', col2: 'Insulated Acoustic Glazing', col3: 'Restricted 3-Vendor Tender', col4: 'Alexander Vance', col5: 'Tender Evaluation' },
      { id: 'r3', col1: 'PKG-03', col2: 'Motorized Louvres & Actuators', col3: 'Sole Specialist OEM', col4: 'Elena Rostova', col5: 'Technical Review' },
      { id: 'r4', col1: 'PKG-04', col2: 'Building Maintenance Unit (BMU)', col3: 'Turnkey Design & Supply', col4: 'Marcus Sterling', col5: 'Prequalification' }
    ],
    standardClauses: [
      'Every package maintains comprehensive document traceability from specification release to closeout.',
      'Progress updates are reviewed weekly during the executive project commercial coordination meeting.'
    ]
  },
  {
    docNumber: 30,
    id: 'doc-30-material-procurement-schedule',
    docCode: 'INV-MPS-30',
    title: 'Material Procurement Schedule',
    group: 'Project',
    barcodeValue: 'INV-MPS-30-MATL',
    defaultHeaders: ['Material Code', 'Material Item Description', 'Order Batch / Lot', 'Factory Ex-Works Date', 'Site Arrival Target'],
    defaultRecords: [
      { id: 'r1', col1: 'MAT-EXT-6063', col2: 'Alloy 6063-T6 Mullion Profiles (RAL 7016)', col3: 'Batch 01 (120 MT)', col4: '2026-11-20', col5: '2026-12-05' },
      { id: 'r2', col1: 'MAT-GLS-IGU28', col2: '28mm Solar Control IGU (6+16Ar+6)', col3: 'Lot A - Podium Glazing', col4: '2026-12-10', col5: '2026-12-28' },
      { id: 'r3', col1: 'MAT-EPDM-G70', col2: 'Continuous EPDM Weather Gasket', col3: 'Run 01 (15,000 lm)', col4: '2026-11-15', col5: '2026-11-30' }
    ],
    standardClauses: [
      'Material deliveries are staged to match factory assembly capacity and site laydown storage limits.',
      'All incoming consignments require accompanying Mill Test Certificates (MTC 3.1) and batch traceability tags.'
    ]
  },
  {
    docNumber: 31,
    id: 'doc-31-equipment-procurement-schedule',
    docCode: 'INV-EPS-31',
    title: 'Equipment Procurement Schedule',
    group: 'Project',
    barcodeValue: 'INV-EPS-31-EQUIP',
    defaultHeaders: ['Equipment Tag', 'Plant / Machinery Description', 'Procurement Type', 'Mobilization Date', 'Demobilization Target'],
    defaultRecords: [
      { id: 'r1', col1: 'EQ-CRN-SP1', col2: 'Maeda MC285 Spider Crane (2.82T)', col3: 'Rental with Certified Operator', col4: '2026-12-01', col5: '2027-04-30' },
      { id: 'r2', col1: 'EQ-GLS-ROB', col2: 'Quattrolifts Glass Manipulator Robot', col3: 'Capital Purchase', col4: '2026-11-15', col5: 'Permanent Asset' },
      { id: 'r3', col1: 'EQ-WIN-CST', col2: 'CWCT Dynamic Wind & Water Test Chamber', col3: 'Specialist Testing Subcontract', col4: '2026-10-25', col5: '2026-11-05' }
    ],
    standardClauses: [
      'All lifting plant must hold current third-party statutory inspection certificates prior to site access.',
      'Operators must be certified and inducted under site-specific environmental and health/safety rules.'
    ]
  },
  {
    docNumber: 32,
    id: 'doc-32-subcontract-procurement-schedule',
    docCode: 'INV-SPS-32',
    title: 'Subcontract Procurement Schedule',
    group: 'Project',
    barcodeValue: 'INV-SPS-32-SUBC',
    defaultHeaders: ['Subcontract Code', 'Subcontract Scope of Works', 'Subcontract Form', 'Tender Date', 'Site Mobilization'],
    defaultRecords: [
      { id: 'r1', col1: 'SUB-PKG-INS', col2: 'Unitized Façade Site Erection Works', col3: 'FIDIC Subcontract (Remeasured)', col4: '2026-10-20', col5: '2026-12-15' },
      { id: 'r2', col1: 'SUB-PKG-SEA', col2: 'External Perimeter Weather Sealing Works', col3: 'Lump Sum Subcontract', col4: '2026-11-10', col5: '2027-01-20' },
      { id: 'r3', col1: 'SUB-PKG-TEST', col2: 'Acoustic & Thermal Field Performance Testing', col3: 'Independent Laboratory Agreement', col4: '2026-12-01', col5: '2027-02-15' }
    ],
    standardClauses: [
      'Subcontractors must demonstrate verified workman compensation insurance and compliance with local labor statutory regulations.',
      'Back-to-back contractual provisions align subcontractor liability with the main contract conditions.'
    ]
  },
  {
    docNumber: 33,
    id: 'doc-33-long-lead-item-register',
    docCode: 'INV-LLR-33',
    title: 'Long-Lead Item Register',
    group: 'Project',
    barcodeValue: 'INV-LLR-33-LEAD',
    defaultHeaders: ['Item Code', 'Item Description / Country of Origin', 'Total Lead Time', 'Order Deadline', 'Critical Path Status'],
    defaultRecords: [
      { id: 'r1', col1: 'LL-01', col2: 'Custom Extrusion Tooling Dies (Germany)', col3: '14 Weeks', col4: '2026-10-15', col5: 'Critical Path Tier 1' },
      { id: 'r2', col1: 'LL-02', col2: 'Triple-Silver Low-E Coated Glass (France)', col3: '16 Weeks', col4: '2026-10-20', col5: 'Critical Path Tier 1' },
      { id: 'r3', col1: 'LL-03', col2: 'Structural Silicone Two-Part Base (USA)', col3: '10 Weeks', col4: '2026-11-01', col5: 'Buffer Available' },
      { id: 'r4', col1: 'LL-04', col2: 'Heavy Duty EPDM Corner Vulcanized Gaskets (Italy)', col3: '12 Weeks', col4: '2026-10-25', col5: 'Critical Path Tier 2' }
    ],
    standardClauses: [
      'Items on the Long-Lead Register receive weekly expediting contact with overseas manufacturers.',
      'Ocean freight tracking, container booking confirmations, and customs pre-clearance are logged in the expediting system.'
    ]
  },
  {
    docNumber: 34,
    id: 'doc-34-critical-material-register',
    docCode: 'INV-CMR-34',
    title: 'Critical Material Register',
    group: 'Project',
    barcodeValue: 'INV-CMR-34-CRIT',
    defaultHeaders: ['Critical Material', 'Application in Façade', 'Lead Time / Source Risk', 'Safety Buffer Stock', 'Contingency Supplier'],
    defaultRecords: [
      { id: 'r1', col1: 'Structural Bonding Silicone (DOW 983)', col2: 'Structural glass-to-frame adhesion', col3: 'Chemical batch shelf life limits', col4: '2-Month Buffer in Cold Store', col5: 'Sika SG-500' },
      { id: 'r2', col1: 'Polyamide 6.6 Thermal Barrier (Technoform)', col2: 'Thermal insulation of mullions/transoms', col3: 'Single extrusion supply chain', col4: '30,000 meters buffered', col5: 'Ensinger GmbH' },
      { id: 'r3', col1: 'Stainless Steel Grade 316 Anchor Castings', col2: 'Floor slab dead load connection', col3: 'Foundry casting queue delays', col4: '500 units pre-cast', col5: 'Halfen Cast-In' }
    ],
    standardClauses: [
      'Critical materials require redundant secondary supply chain pre-qualification to prevent site stoppage.',
      'Safety stocks are audited bi-weekly and replenished automatically when buffer levels fall below designated thresholds.'
    ]
  },
  {
    docNumber: 35,
    id: 'doc-35-procurement-risk-register',
    docCode: 'INV-PRR-35',
    title: 'Procurement Risk Register',
    group: 'Project',
    barcodeValue: 'INV-PRR-35-RISK',
    defaultHeaders: ['Risk ID / Event', 'Risk Category', 'Probability & Impact', 'Mitigation Action Plan', 'Risk Owner'],
    defaultRecords: [
      { id: 'r1', col1: 'RSK-01 Currency Fluctuations (EUR/USD/AED)', col2: 'Financial / Market', col3: 'High (Score 16)', col4: 'Execute forward currency exchange hedging contracts', col5: 'Finance Director' },
      { id: 'r2', col1: 'RSK-02 Extrusion Die Breakage During Trial Run', col2: 'Technical / Manufacturing', col3: 'Medium (Score 9)', col4: 'Order backup twin die set concurrently', col5: 'Façade Technical Lead' },
      { id: 'r3', col1: 'RSK-03 Port Congestion & Red Sea Transit Delay', col2: 'Logistics / Geopolitical', col3: 'High (Score 15)', col4: 'Reroute critical air cargo consignment allowances', col5: 'Logistics Manager' }
    ],
    standardClauses: [
      'Risk scores are calculated using standard 5x5 Probability vs Impact matrix aligned with ISO 31000.',
      'High-severity risks (score >= 15) require monthly executive reporting and dedicated contingency reserves.'
    ]
  },
  {
    docNumber: 36,
    id: 'doc-36-procurement-action-register',
    docCode: 'INV-PAR-36',
    title: 'Procurement Action Register',
    group: 'Project',
    barcodeValue: 'INV-PAR-36-ACTN',
    defaultHeaders: ['Action Item No.', 'Action Required', 'Assigned Owner', 'Target Resolution Date', 'Current Status'],
    defaultRecords: [
      { id: 'r1', col1: 'ACT-2026-101', col2: 'Approve extrusion alloy die drawing Rev 03', col3: 'Façade Design Lead', col4: '2026-10-05', col5: 'Completed' },
      { id: 'r2', col1: 'ACT-2026-102', col2: 'Finalize glass acoustic performance test report', col3: 'Elena Rostova', col4: '2026-10-12', col5: 'In Progress' },
      { id: 'r3', col1: 'ACT-2026-103', col2: 'Obtain client consultant approval for spider crane layout', col3: 'Marcus Sterling', col4: '2026-10-18', col5: 'Open' },
      { id: 'r4', col1: 'ACT-2026-104', col2: 'Issue RFQ tender for bracket galvanization subcontract', col3: 'Alexander Vance', col4: '2026-10-15', col5: 'Pending Tender' }
    ],
    standardClauses: [
      'Action items are reviewed during daily procurement stand-ups.',
      'Escalations for overdue actions are automatically dispatched to the Project Director.'
    ]
  },
  {
    docNumber: 37,
    id: 'doc-37-procurement-status-report',
    docCode: 'INV-PSR-37',
    title: 'Procurement Status Report',
    group: 'Project',
    barcodeValue: 'INV-PSR-37-STAT',
    defaultHeaders: ['Procurement Scope', 'Total Packages', 'Awarded / In Progress', 'Commitment %', 'Health Indicator'],
    defaultRecords: [
      { id: 'r1', col1: 'Structural Aluminum & Profiles', col2: '4 Packages', col3: '4 / 4 Awarded', col4: '100% Committed', col5: 'Green (On Track)' },
      { id: 'r2', col1: 'Glass & Glazing Systems', col2: '3 Packages', col3: '2 Awarded / 1 Tender', col4: '78% Committed', col5: 'Amber (Monitoring)' },
      { id: 'r3', col1: 'Site Hoisting & Cranage', col2: '2 Packages', col3: '1 Awarded / 1 Eval', col4: '50% Committed', col5: 'Green (On Track)' },
      { id: 'r4', col1: 'Ancillary Fixings & Hardware', col2: '5 Packages', col3: '5 / 5 Awarded', col4: '100% Committed', col5: 'Green (On Track)' }
    ],
    standardClauses: [
      'The Status Report serves as the executive summary for project stakeholders and client governance committees.',
      'Variances against baseline schedule and financial commitments are explained with remediation paths.'
    ]
  },
  {
    docNumber: 38,
    id: 'doc-38-procurement-dashboard-report',
    docCode: 'INV-PDR-38',
    title: 'Procurement Dashboard Report',
    group: 'Project',
    barcodeValue: 'INV-PDR-38-DASH',
    defaultHeaders: ['Executive Metric', 'Baseline Target', 'Actual Realized', 'Variance', 'Performance Trend'],
    defaultRecords: [
      { id: 'r1', col1: 'Total Procurement Spend', col2: 'AED 15,200,000', col3: 'AED 14,480,000', col4: '-AED 720,000 (Savings)', col5: 'Favorable (4.7%)' },
      { id: 'r2', col1: 'PO Processing Cycle Time', col2: '14 Calendar Days', col3: '9.2 Calendar Days', col4: '-4.8 Days Faster', col5: 'Improving' },
      { id: 'r3', col1: 'Supplier OTIF Score', col2: '> 95.0%', col3: '96.8%', col4: '+1.8% Above Target', col5: 'Stable High' },
      { id: 'r4', col1: 'Quality Rejection Rate (NCR)', col2: '< 1.5%', col3: '0.8%', col4: '-0.7% Defect Reduction', col5: 'Excellence' }
    ],
    standardClauses: [
      'Metrics aggregate transactional data directly from ERP Purchase Orders, Goods Receipt Notes, and Quality NCR logs.',
      'Certified by Chief Operating Officer and Head of Strategic Sourcing.'
    ]
  },
  {
    docNumber: 39,
    id: 'doc-39-project-procurement-summary',
    docCode: 'INV-PPS-39',
    title: 'Project Procurement Summary',
    group: 'Project',
    barcodeValue: 'INV-PPS-39-SUMM',
    defaultHeaders: ['Procurement Category', 'Approved Budget', 'Final Award Sum', 'Net Savings Realized', 'Supplier Count'],
    defaultRecords: [
      { id: 'r1', col1: 'Direct Materials (Extrusions, Glass, Steel)', col2: 'AED 11,800,000', col3: 'AED 11,180,000', col4: 'AED 620,000', col5: '6 Suppliers' },
      { id: 'r2', col1: 'Specialist Subcontracts & Testing', col2: 'AED 2,100,000', col3: 'AED 2,050,000', col4: 'AED 50,000', col5: '3 Subcontractors' },
      { id: 'r3', col1: 'Equipment Rentals & Site Plant', col2: 'AED 1,300,000', col3: 'AED 1,250,000', col4: 'AED 50,000', col5: '2 Plant Vendors' }
    ],
    standardClauses: [
      'Comprehensive financial and commercial reconciliation of project supply chain performance.',
      'Establishes historical cost benchmarks for prospective tender estimating.'
    ]
  },
  {
    docNumber: 40,
    id: 'doc-40-procurement-closeout-report',
    docCode: 'INV-PCR-40',
    title: 'Procurement Closeout Report',
    group: 'Project',
    barcodeValue: 'INV-PCR-40-CLOS',
    defaultHeaders: ['Package Reference', 'Final Value Settled', 'Warranties Received', 'Retention Released', 'Closeout Status'],
    defaultRecords: [
      { id: 'r1', col1: 'PKG-01 Unitized Profiles', col2: 'AED 4,850,000', col3: '10-Year Qualicoat Warranty', col4: 'Final 5% Released', col5: 'Closed' },
      { id: 'r2', col1: 'PKG-02 Glazing Units', col2: 'AED 6,200,000', col3: '5-Year IGU Seal Warranty', col4: 'Final 5% Released', col5: 'Closed' },
      { id: 'r3', col1: 'PKG-03 Structural Sealant', col2: 'AED 780,000', col3: '10-Year Adhesion Warranty', col4: 'Full Payment Settled', col5: 'Closed' }
    ],
    standardClauses: [
      'All commercial claims, variation orders, and defect rectification liabilities are fully settled.',
      'Manufacturer warranties, operation and maintenance (O&M) manuals, and as-built mill certificates are archived in the project handover library.'
    ]
  }
];
