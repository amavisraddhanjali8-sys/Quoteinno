import { ProcurementDocumentDefinition } from '../procurementDocTypes';

export const DOCS_1_TO_22: ProcurementDocumentDefinition[] = [
  {
    docNumber: 1,
    id: 'doc-01-supplier-registration',
    docCode: 'INV-DOC-01',
    title: 'Supplier Registration Form',
    group: 'Setup',
    barcodeValue: 'INV-DOC-01-SRF',
    defaultHeaders: ['Field', 'Corporate Parameter', 'Verified Value', 'Statutory Authority', 'Status'],
    defaultRecords: [
      { id: 'r1', col1: 'Legal Entity', col2: 'Alumex Architectural Extrusions PLC', col3: 'PV-109824-REG', col4: 'Registrar of Companies', col5: 'Active' },
      { id: 'r2', col1: 'Tax Registration', col2: 'VAT Identification Number', col3: 'VAT-982341209-V', col4: 'Inland Revenue Dept', col5: 'Compliant' },
      { id: 'r3', col1: 'Works Facility', col2: 'Extrusion & Vertical Coating Plant', col3: '185,000 sq.ft', col4: 'Board of Investment', col5: 'Operational' },
      { id: 'r4', col1: 'Annual Capacity', col2: 'Alloy 6063-T6 / 6061-T6 Billets', col3: '24,000 MT/Year', col4: 'Industrial Ministry', col5: 'Verified' }
    ],
    standardClauses: [
      'Applicant confirms that all information furnished is authentic, verifiable, and conforms to registered corporate filings.',
      'Registration does not guarantee contract awards and is subject to formal technical pre-qualification assessment.',
      'The supplier agrees to notify Innovista of any changes in corporate structure, ownership, or licensing within 14 calendar days.'
    ]
  },
  {
    docNumber: 2,
    id: 'doc-02-supplier-profile',
    docCode: 'INV-DOC-02',
    title: 'Supplier Profile',
    group: 'Setup',
    barcodeValue: 'INV-DOC-02-SPF',
    defaultHeaders: ['Capability / Asset', 'Technical Scope', 'Capacity / Rating', 'Certification Standard', 'Compliance'],
    defaultRecords: [
      { id: 'r1', col1: 'Extrusion Press Lines', col2: 'Direct-action hydraulic extrusion presses (1800T, 2500T)', col3: '4 Active Lines', col4: 'EN 755-2 Mechanical Limits', col5: 'Compliant' },
      { id: 'r2', col1: 'Vertical Powder Coating', col2: 'Automated chromate-free pre-treatment line', col3: '7,200 MT/Year', col4: 'Qualicoat Class 2 Standard', col5: 'Certified' },
      { id: 'r3', col1: 'Thermal Barrier Line', col2: 'Polyamide 6.6 insulating strip crimping', col3: '1,500 m/day', col4: 'CWCT Section 4 Airtightness', col5: 'Verified' }
    ],
    standardClauses: [
      'Profile documentation forms an integral record in Innovista ERP Vendor Master Database.',
      'Technical certifications including ISO 9001 and CWCT compliance certificates must be accompanied by valid accredited audit reports.'
    ]
  },
  {
    docNumber: 3,
    id: 'doc-03-prequalification-form',
    docCode: 'INV-DOC-03',
    title: 'Supplier Prequalification Form',
    group: 'Setup',
    barcodeValue: 'INV-DOC-03-PQF',
    defaultHeaders: ['Assessment Criterion', 'Mandatory Requirement', 'Vendor Submission', 'Evaluation Benchmark', 'Scoring'],
    defaultRecords: [
      { id: 'r1', col1: 'High-Rise Façade Projects', col2: 'Minimum 5 landmark towers > 30 storeys', col3: '7 completed towers in GCC & Asia', col4: 'Track Record > 5 Yrs', col5: 'Exceeds' },
      { id: 'r2', col1: 'Financial Solvency', col2: 'Audited balance sheet with positive cashflow', col3: 'Audited by KPMG (Past 3 Years)', col4: 'Current Ratio > 1.4', col5: 'Approved' },
      { id: 'r3', col1: 'Quality Management', col2: 'ISO 9001:2015 accredited QA system', col3: 'DNV Certified QMS Certificate', col4: 'Zero Major NCRs', col5: 'Approved' }
    ],
    standardClauses: [
      'Applicant must demonstrate prior successful execution of architectural façade projects exceeding 20 floors.',
      'Verification of adequate working capital and bank bonding capacity is mandatory for package tier clearance.'
    ]
  },
  {
    docNumber: 4,
    id: 'doc-04-qualification-assessment',
    docCode: 'INV-DOC-04',
    title: 'Supplier Qualification Assessment',
    group: 'Setup',
    barcodeValue: 'INV-DOC-04-SQA',
    defaultHeaders: ['Evaluation Domain', 'Weightage', 'Assessed Score', 'Threshold', 'Audit Finding'],
    defaultRecords: [
      { id: 'r1', col1: 'Technical Rigour & Machinery', col2: '30%', col3: '28.5%', col4: '24.0%', col5: 'State-of-the-art CNC machining centers' },
      { id: 'r2', col1: 'Quality Assurance & Testing', col2: '25%', col3: '23.0%', col4: '20.0%', col5: 'In-house Spectrometer and Tensile Rig' },
      { id: 'r3', col1: 'Financial Health & Stability', col2: '20%', col3: '18.5%', col4: '15.0%', col5: 'Low debt leverage ratio' },
      { id: 'r4', col1: 'On-Time In-Full Delivery (OTIF)', col2: '15%', col3: '14.0%', col4: '12.0%', col5: 'Historical OTIF score 96.2%' },
      { id: 'r5', col1: 'ESG & Environmental Protocol', col2: '10%', col3: '8.5%', col4: '7.0%', col5: 'Certified zero-discharge water treatment' }
    ],
    standardClauses: [
      'Minimum qualifying threshold for Tier 1 Architectural Materials is 80.0% composite score.',
      'Assessment results are valid for 12 calendar months and subject to periodic surveillance re-audits.'
    ]
  },
  {
    docNumber: 5,
    id: 'doc-05-due-diligence-checklist',
    docCode: 'INV-DOC-05',
    title: 'Supplier Due-Diligence Checklist',
    group: 'Setup',
    barcodeValue: 'INV-DOC-05-DDC',
    defaultHeaders: ['Due Diligence Checkpoint', 'Verification Source', 'Evidence Document', 'Risk Level', 'Verification Status'],
    defaultRecords: [
      { id: 'r1', col1: 'Sanctions & Debarment Screen', col2: 'OFAC & World Bank Debarment Lists', col3: 'Clearance Dossier REF-OFAC-092', col4: 'Low Risk', col5: 'Cleared' },
      { id: 'r2', col1: 'Ultimate Beneficial Ownership (UBO)', col2: 'National Company Registrar Registry', col3: 'Certified Shareholding Structure', col4: 'Low Risk', col5: 'Verified' },
      { id: 'r3', col1: 'Labour & Minimum Wage Audit', col2: 'Independent Social Compliance Audit', col3: 'SMETA 4-Pillar Audit Report', col4: 'Low Risk', col5: 'Compliant' }
    ],
    standardClauses: [
      'Ultimate beneficial ownership (UBO) verified against international sanction and debarment registries.',
      'Zero tolerance affirmation regarding child labour, forced labour, and statutory worker minimum wage compliance.'
    ]
  },
  {
    docNumber: 6,
    id: 'doc-06-approval-form',
    docCode: 'INV-DOC-06',
    title: 'Supplier Approval Form',
    group: 'Setup',
    barcodeValue: 'INV-DOC-06-SAF',
    defaultHeaders: ['Approval Parameter', 'Authorized Term', 'Procurement Ceiling', 'Governance Tier', 'Committee Sign-Off'],
    defaultRecords: [
      { id: 'r1', col1: 'Vendor Master Code', col2: 'VND-ALU-001', col3: 'Approved Active', col4: 'Tier 1 Preferred', col5: 'Authorized' },
      { id: 'r2', col1: 'Single Order Limit Cap', col2: 'AED 3,500,000 / LKR 285M', col3: 'Authorized Limit', col4: 'Executive Level', col5: 'Approved' },
      { id: 'r3', col1: 'Payment Terms Approved', col2: '60 Days Net from GRN Verification', col3: 'Standard Commercial', col4: 'Finance Clear', col5: 'Approved' }
    ],
    standardClauses: [
      'Vendor is granted formal Approved Vendor status and assigned a unique ERP Vendor Master Code.',
      'Approval is contingent upon adherence to Innovista standard Quality Acceptance Criteria and contractual SLA terms.'
    ]
  },
  {
    docNumber: 7,
    id: 'doc-07-rejection-form',
    docCode: 'INV-DOC-07',
    title: 'Supplier Rejection Form',
    group: 'Setup',
    barcodeValue: 'INV-DOC-07-SRF',
    defaultHeaders: ['Deficit Area', 'Mandatory Benchmark', 'Applicant Deficiency', 'Remediation Required', 'Cooling-off Period'],
    defaultRecords: [
      { id: 'r1', col1: 'Structural Test Failures', col2: 'EN 12150 Fragmentation Test', col3: 'Excess glass flake count in 50x50mm', col4: 'Calibrate furnace quenching line', col5: '6 Months' },
      { id: 'r2', col1: 'QA Traceability Gap', col2: 'EN 10204 3.1 Mill Test Certificates', col3: 'Missing batch heat numbers on billets', col4: 'Implement MES batch tracking', col5: '6 Months' }
    ],
    standardClauses: [
      'The applicant entity has not met the mandatory baseline qualification benchmarks established by Innovista.',
      'The applicant may formally re-apply after a mandatory cooling-off period upon rectifying highlighted deficiencies.'
    ]
  },
  {
    docNumber: 8,
    id: 'doc-08-suspension-notice',
    docCode: 'INV-DOC-08',
    title: 'Supplier Suspension Notice',
    group: 'Setup',
    barcodeValue: 'INV-DOC-08-SSN',
    defaultHeaders: ['Breach Reference', 'Incident Description', 'Impacted Projects', 'Immediate Restriction', 'CAPA Deadline'],
    defaultRecords: [
      { id: 'r1', col1: 'NCR-2026-088', col2: 'Anodizing film thickness under 15 microns', col3: 'Bay Tower Façade Pkg B', col4: 'PO Issuance Frozen', col5: '10 Business Days' },
      { id: 'r2', col1: 'DEL-FAIL-041', col2: '4-week unannounced dispatch delay', col3: 'Cinnamon Life Lot 4', col4: 'Tender Participation Halted', col5: 'Immediate' }
    ],
    standardClauses: [
      'Effective immediately, all pending procurement invitations and new purchase order issuances are frozen.',
      'Vendor is required to submit a comprehensive Corrective and Preventive Action (CAPA) plan within 10 business days.'
    ]
  },
  {
    docNumber: 9,
    id: 'doc-09-reactivation-form',
    docCode: 'INV-DOC-09',
    title: 'Supplier Re-activation Form',
    group: 'Setup',
    barcodeValue: 'INV-DOC-09-RAF',
    defaultHeaders: ['Remediated Finding', 'CAPA Verification Evidence', 'Re-Audit Score', 'Probationary Window', 'Status'],
    defaultRecords: [
      { id: 'r1', col1: 'Anodizing Bath Uniformity', col2: 'Automated titration logging installed', col3: '94% Audit Score', col4: '90 Days Tier 3', col5: 'Reinstated' },
      { id: 'r2', col1: 'Raw Material Buffer Stock', col2: 'Buffer inventory raised to 300 MT', col3: 'Verified on-site', col4: '90 Days Tier 3', col5: 'Reinstated' }
    ],
    standardClauses: [
      'Audit team certifies that previous non-conformances have been satisfactorily closed out with verifiable QA measures.',
      'Vendor is reinstated under probationary Tier 3 monitoring for a mandatory duration of 90 calendar days.'
    ]
  },
  {
    docNumber: 10,
    id: 'doc-10-evaluation-form',
    docCode: 'INV-DOC-10',
    title: 'Supplier Evaluation Form',
    group: 'Setup',
    barcodeValue: 'INV-DOC-10-SEF',
    defaultHeaders: ['KPI Category', 'Measurement Metric', 'Target Standard', 'Actual Result', 'Weighted Score'],
    defaultRecords: [
      { id: 'r1', col1: 'Quality Compliance', col2: 'GRN acceptance without NCR', col3: '> 98.0%', col4: '98.6%', col5: '34.5 / 35.0' },
      { id: 'r2', col1: 'Delivery Reliability', col2: 'On-Time In-Full (OTIF)', col3: '> 95.0%', col4: '96.2%', col5: '28.8 / 30.0' },
      { id: 'r3', col1: 'Commercial Competitiveness', col2: 'Variance against LME index', col3: '< 2.0% delta', col4: '1.4% delta', col5: '18.5 / 20.0' },
      { id: 'r4', col1: 'Customer & Site Support', col2: 'Emergency technical response time', col3: '< 24 Hours', col4: '8 Hours', col5: '14.2 / 15.0' }
    ],
    standardClauses: [
      'Periodic evaluation serves as the baseline for annual framework allocation and rate negotiation tiering.',
      'Evaluation metrics are drawn directly from Goods Receipt Notes (GRN), NCR logs, and commercial invoice matching.'
    ]
  },
  {
    docNumber: 11,
    id: 'doc-11-performance-evaluation',
    docCode: 'INV-DOC-11',
    title: 'Supplier Performance Evaluation',
    group: 'Setup',
    barcodeValue: 'INV-DOC-11-SPE',
    defaultHeaders: ['Performance Dimension', 'Historical Trend', 'Annual Target', 'Certified Performance', 'Rating Class'],
    defaultRecords: [
      { id: 'r1', col1: 'Parts Per Million (PPM) Defect Rate', col2: '620 PPM (2025)', col3: '< 500 PPM', col4: '340 PPM', col5: 'Class A (Excellence)' },
      { id: 'r2', col1: 'OTIF Fulfillment Percentage', col2: '93.5% (2025)', col3: '> 95.0%', col4: '96.8%', col5: 'Class A (Excellence)' },
      { id: 'r3', col1: 'Commercial Invoice Accuracy', col2: '97.0% (2025)', col3: '100.0%', col4: '99.2%', col5: 'Class A' }
    ],
    standardClauses: [
      'Executive performance scorecards reflect verifiable 12-month trailing rolling averages.',
      'Suppliers achieving Class A qualify for priority framework renewal and volume bonuses.'
    ]
  },
  {
    docNumber: 12,
    id: 'doc-12-master-record',
    docCode: 'INV-DOC-12',
    title: 'Supplier Master Record',
    group: 'Setup',
    barcodeValue: 'INV-DOC-12-SMR',
    defaultHeaders: ['Master Data Field', 'Registered ERP Value', 'Verification Reference', 'Security Clearance', 'Lock Status'],
    defaultRecords: [
      { id: 'r1', col1: 'Vendor ERP ID', col2: 'VND-ALU-001', col3: 'Master Entity Database', col4: 'Authorized', col5: 'Locked' },
      { id: 'r2', col1: 'Full Legal Name', col2: 'Alumex Architectural Extrusions PLC', col3: 'Registrar of Companies', col4: 'Corporate Legal', col5: 'Locked' },
      { id: 'r3', col1: 'Tax Registry Code', col2: 'TIN-109824001', col3: 'Inland Revenue Certificate', col4: 'Finance Approved', col5: 'Locked' },
      { id: 'r4', col1: 'Currency Assignment', col2: 'AED / USD / LKR', col3: 'Treasury Directive', col4: 'Commercial Ops', col5: 'Active' }
    ],
    standardClauses: [
      'Official centralized record under Innovista Enterprise Resource Planning and Procurement Master Database.',
      'Authorized changes require dual sign-off from Head of Sourcing and Chief Financial Officer.'
    ]
  },
  {
    docNumber: 13,
    id: 'doc-13-contact-sheet',
    docCode: 'INV-DOC-13',
    title: 'Supplier Contact Sheet',
    group: 'Setup',
    barcodeValue: 'INV-DOC-13-SCS',
    defaultHeaders: ['Designation / Role', 'Contact Person', 'Direct Phone', 'Official Email', 'Escalation Level'],
    defaultRecords: [
      { id: 'r1', col1: 'Managing Director / Executive', col2: 'Eng. Priyantha Jayasuriya', col3: '+94 11 248 9001', col4: 'p.jayasuriya@alumexgroup.com', col5: 'Level 3 (Executive)' },
      { id: 'r2', col1: 'Quality Assurance Lead', col2: 'Ms. Dilani Weerasinghe', col3: '+94 77 123 4567', col4: 'd.weerasinghe@alumexgroup.com', col5: 'Level 2 (Technical)' },
      { id: 'r3', col1: 'Key Account Commercials', col2: 'Mr. Rohan Samaraweera', col3: '+94 71 889 1234', col4: 'r.samaraweera@alumexgroup.com', col5: 'Level 1 (Operational)' },
      { id: 'r4', col1: '24/7 Site Emergency Hotline', col2: 'Duty Operations Desk', col3: '+94 11 248 9999', col4: 'emergency@alumexgroup.com', col5: 'Immediate 24/7' }
    ],
    standardClauses: [
      'Vendor must maintain an active 24/7 technical representative available for rapid site emergency intervention.',
      'Any personnel change in designated Key Account or Factory QC management must be communicated within 48 hours.'
    ]
  },
  {
    docNumber: 14,
    id: 'doc-14-bank-details-form',
    docCode: 'INV-DOC-14',
    title: 'Supplier Bank Details Form',
    group: 'Setup',
    barcodeValue: 'INV-DOC-14-SBD',
    defaultHeaders: ['Institutional Banking Parameter', 'Verified Clearing Value', 'Clearing System', 'Currency Code', 'Status'],
    defaultRecords: [
      { id: 'r1', col1: 'Beneficiary Corporate Name', col2: 'Alumex Architectural Extrusions PLC', col3: 'Legal Title Matching', col4: 'USD / AED / LKR', col5: 'Verified' },
      { id: 'r2', col1: 'Banking Institution', col2: 'Commercial Bank of Ceylon PLC', col3: 'SWIFT Participant', col4: 'Multi-Currency', col5: 'Verified' },
      { id: 'r3', col1: 'SWIFT / BIC Code', col2: 'CCEYLKFX', col3: 'International Wire Network', col4: 'All Remittances', col5: 'Active' },
      { id: 'r4', col1: 'Branch Routing Code', col2: 'Corporate Banking Centre (7010-001)', col3: 'National Clearing System', col4: 'Local Transfer', col5: 'Verified' }
    ],
    standardClauses: [
      'Bank information is verified directly with institutional branch clearing registries for payee identity confirmation.',
      'SECURITY NOTICE: Specific bank account numbers are withheld from this formal document and processed via encrypted ERP tokenization.'
    ]
  },
  {
    docNumber: 15,
    id: 'doc-15-tax-information-form',
    docCode: 'INV-DOC-15',
    title: 'Supplier Tax Information Form',
    group: 'Setup',
    barcodeValue: 'INV-DOC-15-STI',
    defaultHeaders: ['Tax Registry Head', 'Tax Number / Identification', 'Issuing Revenue Authority', 'Withholding Tax Rate', 'Status'],
    defaultRecords: [
      { id: 'r1', col1: 'Value Added Tax (VAT)', col2: 'VAT-982341209-V', col3: 'Inland Revenue Department', col4: 'Standard Rate (18% / 5% UAE)', col5: 'Active' },
      { id: 'r2', col1: 'Corporate Income Tax TIN', col2: 'TIN-109824001', col3: 'Department of Revenue', col4: 'Corporate Tax Regime', col5: 'Compliant' },
      { id: 'r3', col1: 'Tax Residency Certificate', col2: 'TRC-CERT-2026-90', col3: 'Ministry of Finance', col4: 'DTAA Treaty Protected', col5: 'Certified' }
    ],
    standardClauses: [
      'Vendor warrants that it holds full active tax registration with relevant national and provincial revenue authorities.',
      'All commercial tax invoices issued must reflect the exact verified Tax Identification Number (TIN) detailed herein.'
    ]
  },
  {
    docNumber: 16,
    id: 'doc-16-compliance-declaration',
    docCode: 'INV-DOC-16',
    title: 'Supplier Compliance Declaration',
    group: 'Setup',
    barcodeValue: 'INV-DOC-16-SCD',
    defaultHeaders: ['Statutory / Governance Realm', 'Compliance Standard', 'Affirmation Protocol', 'Audit Right', 'Sign-Off'],
    defaultRecords: [
      { id: 'r1', col1: 'Anti-Bribery & Corruption', col2: 'FCPA & UK Bribery Act Standard', col3: 'Zero tolerance affirmation', col4: 'Full Audit Rights', col5: 'Certified' },
      { id: 'r2', col1: 'Conflict of Interest', col2: 'Zero undisclosed family/financial ties', col3: 'Dual signatory disclosure', col4: 'Annual Confirmation', col5: 'Certified' },
      { id: 'r3', col1: 'Environmental Stewardship', col2: 'ISO 14001 & Waste Disposal Protocol', col3: 'Certified hazardous effluent disposal', col4: 'On-site Inspection', col5: 'Compliant' }
    ],
    standardClauses: [
      'Vendor affirms compliance with all Anti-Bribery, Anti-Money Laundering, and Anti-Corruption statutes.',
      'Zero financial gifts, commissions, or improper entertainment have been offered to any Innovista employee.'
    ]
  },
  {
    docNumber: 17,
    id: 'doc-17-supplier-nda',
    docCode: 'INV-DOC-17',
    title: 'Supplier Non-Disclosure Agreement (NDA)',
    group: 'Setup',
    barcodeValue: 'INV-DOC-17-NDA',
    defaultHeaders: ['Confidentiality Scope', 'Protected Information', 'Non-Disclosure Covenant', 'Duration', 'Remedy at Law'],
    defaultRecords: [
      { id: 'r1', col1: 'Façade Shop Drawings & Dies', col2: 'Extrusion profile geometry & thermal dies', col3: 'Strict non-disclosure & non-use', col4: '5 Years', col5: 'Injunctive Relief' },
      { id: 'r2', col1: 'Commercial Price Schedules', col2: 'BOM cost breakdowns and unit rates', col3: 'Strict proprietary confidentiality', col4: '5 Years', col5: 'Liquidated Damages' },
      { id: 'r3', col1: 'Client Identity & Project Data', col2: 'Façade specifications & project schedules', col3: 'No unauthorized marketing use', col4: '5 Years', col5: 'Legal Termination' }
    ],
    standardClauses: [
      'All façade shop drawings, extrusion die designs, calculations, and pricing formulas are strictly proprietary confidential assets.',
      'The Receiving Party shall not disclose, duplicate, reverse engineer, or utilize confidential information for third-party tenders.'
    ]
  },
  {
    docNumber: 18,
    id: 'doc-18-code-of-conduct',
    docCode: 'INV-DOC-18',
    title: 'Supplier Code of Conduct',
    group: 'Setup',
    barcodeValue: 'INV-DOC-18-SCC',
    defaultHeaders: ['Conduct Principle', 'Operational Standard', 'Monitoring Method', 'Violation Consequence', 'Affirmation'],
    defaultRecords: [
      { id: 'r1', col1: 'Occupational Health & Safety', col2: 'OSHA / ISO 45001 safety PPE protocols', col3: 'Unannounced factory audits', col4: 'Immediate suspension', col5: 'Agreed' },
      { id: 'r2', col1: 'Fair Working Hours & Wages', col2: 'ILO Core Conventions & living wages', col3: 'Payroll record audits', col4: 'Disqualification', col5: 'Agreed' },
      { id: 'r3', col1: 'Responsible Sourcing', col2: 'ASI (Aluminium Stewardship Initiative) billets', col3: 'Mill origin certificates', col4: 'Rejection of lots', col5: 'Agreed' }
    ],
    standardClauses: [
      'Full compliance with OSHA and local Working-at-Height safety protocols for all site-visiting supplier crews.',
      'Commitment to continuous carbon footprint reduction, certified recycling of aluminum scrap, and sustainable packaging.'
    ]
  },
  {
    docNumber: 19,
    id: 'doc-19-supplier-agreement',
    docCode: 'INV-DOC-19',
    title: 'Supplier General Agreement',
    group: 'Setup',
    barcodeValue: 'INV-DOC-19-SAG',
    defaultHeaders: ['Contract Section', 'Core Terms', 'Legal Threshold', 'Warranty Obligation', 'Enforceability'],
    defaultRecords: [
      { id: 'r1', col1: 'Product Quality & Specs', col2: 'EN 755 / ASTM B221 Architectural profiles', col3: 'CWCT Class A Standard', col4: '10 Years Coating / 25 Yrs Alloy', col5: 'Enforceable' },
      { id: 'r2', col1: 'Risk of Loss & Title Transfer', col2: 'Delivery Duty Paid (DDP) to Yard / Site', col3: 'Signed GRN Acceptance', col4: 'In-transit vendor insurance', col5: 'Enforceable' },
      { id: 'r3', col1: 'Defect Liability & Remedies', col2: 'Free-of-charge replacement within 7 days', col3: 'Immediate site rectification', col4: 'Direct vendor indemnification', col5: 'Enforceable' }
    ],
    standardClauses: [
      'Materials supplied must strictly conform to approved submittals, ASTM B221, EN 12150, and CWCT performance standards.',
      'Warranty: 10 Years on Architectural Powder Coating Class 2, 5 Years on Insulated Glass Units, 25 Years on Extrusion Alloys.'
    ]
  },
  {
    docNumber: 20,
    id: 'doc-20-framework-agreement',
    docCode: 'INV-DOC-20',
    title: 'Framework Master Supply Agreement',
    group: 'Setup',
    barcodeValue: 'INV-DOC-20-FWA',
    defaultHeaders: ['Framework Scope', 'Volume Bracket', 'Indexation Formula', 'Delivery Commitment', 'Rebate Tier'],
    defaultRecords: [
      { id: 'r1', col1: 'Aluminum Architectural Profiles', col2: '500 MT - 1,500 MT / Year', col3: 'LME Cash + Fixed Conversion', col4: 'Lead time 14 business days', col5: '2.5% Annual Rebate' },
      { id: 'r2', col1: 'High-Performance Double Glazed Units', col2: '10,000 - 30,000 m² / Year', col3: 'Raw Float Glass Fixed Tier', col4: 'Lead time 21 business days', col5: '3.0% Annual Rebate' },
      { id: 'r3', col1: 'Structural Silicone & Gaskets', col2: '50,000 Linear Meters', col3: 'Locked Annual Bulk Rates', col4: 'Lead time 7 business days', col5: '2.0% Annual Rebate' }
    ],
    standardClauses: [
      'Benchmark rates locked per agreed volume brackets and indexed to published LME raw billet pass-through formula.',
      'Guaranteed delivery lead times with liquidated damages of 0.5% per week of delay up to a maximum ceiling of 10%.'
    ]
  },
  {
    docNumber: 21,
    id: 'doc-21-approved-supplier-list',
    docCode: 'INV-DOC-21',
    title: 'Approved Supplier List (AVL)',
    group: 'Setup',
    barcodeValue: 'INV-DOC-21-ASL',
    defaultHeaders: ['Vendor Code', 'Supplier Legal Name', 'Material Category', 'Approved Tier', 'Audit Expiry Date'],
    defaultRecords: [
      { id: 'r1', col1: 'VND-ALU-001', col2: 'Alumex Architectural Extrusions PLC', col3: 'Architectural Profiles & Dies', col4: 'Tier 1 Preferred', col5: '2027-12-31' },
      { id: 'r2', col1: 'VND-GLS-004', col2: 'Saint-Gobain Glass Solutions', col3: 'Low-E Insulated Glass Units', col4: 'Tier 1 Preferred', col5: '2027-10-15' },
      { id: 'r3', col1: 'VND-ACC-012', col2: 'DOW Silicones Middle East', col3: 'Structural Silicone & Sealants', col4: 'Tier 1 Approved', col5: '2028-06-30' },
      { id: 'r4', col1: 'VND-HDW-022', col2: 'Giesse Façade Hardware', col3: 'Multi-Point Locking & Handles', col4: 'Tier 2 Approved', col5: '2027-04-18' }
    ],
    standardClauses: [
      'Official Innovista Corporate Approved Vendor List certified for project procurement and tender issuance.',
      'Only vendors listed herein are authorized to receive formal Requests for Quotation (RFQs) and Purchase Orders.'
    ]
  },
  {
    docNumber: 22,
    id: 'doc-22-restricted-supplier-list',
    docCode: 'INV-DOC-22',
    title: 'Restricted / Blocked Supplier List',
    group: 'Setup',
    barcodeValue: 'INV-DOC-22-RSL',
    defaultHeaders: ['Vendor Code', 'Entity Name', 'Debarment Grounds', 'Debarment Scope', 'Expiry / Review Date'],
    defaultRecords: [
      { id: 'r1', col1: 'VND-BLK-091', col2: 'Apex Façade Fasteners Ltd', col3: 'Counterfeit grade 316 stainless bolts (tested Grade 201)', col4: 'Total ERP Procurement Block', col5: 'Permanent Blacklist' },
      { id: 'r2', col1: 'VND-SUS-043', col2: 'Eastern Glass Processing Yard', col3: 'Unresolved spontaneous nickel sulfide breakage NCRs', col4: 'Frozen from New Tenders', col5: '2026-11-30 Review' },
      { id: 'r3', col1: 'VND-SUS-019', col2: 'Global Silicone Formulations', col3: 'Adhesion peel failure on anodized substrate', col4: 'Material Hold & Quarantine', col5: '2026-12-31 Review' }
    ],
    standardClauses: [
      'Corporate blacklisting notice: Entities listed herein are strictly prohibited from all commercial dealings with Innovista.',
      'ERP automated procurement locks are enforced to block requisition creation or payment release to listed entities.'
    ]
  }
];
