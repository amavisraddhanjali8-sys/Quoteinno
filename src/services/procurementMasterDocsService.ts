import { Supplier } from '../types/procurement';

export interface ProcurementMasterDocDefinition {
  id: string; // e.g. 'doc-1-supplier-registration'
  docNumber: number; // 1 to 22
  docCode: string; // e.g. 'INV-SRF-01'
  title: string;
  category: 'REGISTRATION' | 'QUALIFICATION' | 'STATUS_APPROVAL' | 'EVALUATION' | 'LEGAL_COMPLIANCE' | 'CONTRACTS_REGISTERS';
  categoryLabel: string;
  shortDescription: string;
  barcodeValue: string;
  standardClauses: string[];
}

export interface MasterDocFormData {
  docCode: string;
  docTitle: string;
  docRefNo: string;
  date: string;
  effectiveDate: string;
  expiryDate?: string;
  revision: string;
  securityClassification: 'STRICTLY CONFIDENTIAL' | 'INTERNAL USE ONLY' | 'OFFICIAL PROCUREMENT' | 'COMMERCIAL IN CONFIDENCE';
  
  // Supplier Information
  supplierId?: string;
  supplierName: string;
  legalTradingName: string;
  businessRegNo: string;
  taxVatId: string;
  natureOfBusiness: string;
  registeredAddress: string;
  factoryWorksAddress: string;
  website: string;
  
  // Contacts
  contactPerson: string;
  contactDesignation: string;
  contactEmail: string;
  contactPhone: string;
  secondaryContact?: string;
  
  // Financial & Bank Details (Note: NO bank account number shown as per user instruction)
  bankName: string;
  bankBranch: string;
  bankSwiftBic: string;
  bankRoutingCode: string;
  accountCurrency: string;
  accountBeneficiaryName: string;
  paymentTerms: string;
  creditLimitCap: string;
  
  // Operational & Technical Scope
  categoriesSupplied: string[];
  cwctTested: boolean;
  iso9001Certified: boolean;
  iso14001Certified: boolean;
  annualCapacity: string;
  facilitySize: string;
  leadTimeWeeks: string;
  
  // Document-specific custom parameters
  assessmentScore?: number;
  qualityRating?: number;
  deliveryOtifPercent?: number;
  decisionStatus?: 'APPROVED' | 'CONDITIONALLY_APPROVED' | 'REJECTED' | 'SUSPENDED' | 'RE_ACTIVATED';
  decisionJustification?: string;
  suspensionReason?: string;
  probationaryPeriod?: string;
  ndaJurisdiction?: string;
  ndaTermYears?: number;
  warrantyPeriodYears?: number;
  customNotes?: string;
  
  // Signatories
  preparedBy: string;
  preparedTitle: string;
  reviewedBy: string;
  reviewedTitle: string;
  approvedBy: string;
  approvedTitle: string;
  supplierSignatory: string;
  supplierSignatoryTitle: string;
}

export const ALL_22_PROCUREMENT_MASTER_DOCS: ProcurementMasterDocDefinition[] = [
  {
    id: 'doc-01-registration-form',
    docNumber: 1,
    docCode: 'INV-DOC-SRF-01',
    title: 'Supplier Registration Form',
    category: 'REGISTRATION',
    categoryLabel: 'Registration & Onboarding',
    shortDescription: 'Formal vendor application and legal corporate entity enrollment form.',
    barcodeValue: 'INV-DOC-SRF-01-REG',
    standardClauses: [
      'Applicant confirms that all information furnished is authentic, verifiable, and conforms to registered corporate filings.',
      'Registration does not guarantee contract awards and is subject to formal technical pre-qualification assessment.',
      'The supplier agrees to notify Innovista of any changes in corporate structure, ownership, or licensing within 14 calendar days.'
    ]
  },
  {
    id: 'doc-02-supplier-profile',
    docNumber: 2,
    docCode: 'INV-DOC-SPF-02',
    title: 'Supplier Profile',
    category: 'REGISTRATION',
    categoryLabel: 'Registration & Onboarding',
    shortDescription: 'Comprehensive technical capability, machinery assets, and corporate credentials dossier.',
    barcodeValue: 'INV-DOC-SPF-02-PRF',
    standardClauses: [
      'Profile documentation forms an integral record in Innovista ERP Vendor Master Database.',
      'Technical certifications including ISO 9001 and CWCT compliance certificates must be accompanied by valid accredited audit reports.',
      'Plant asset valuations and crane lifting capacities are subject to unannounced on-site verification audits.'
    ]
  },
  {
    id: 'doc-03-prequalification-form',
    docNumber: 3,
    docCode: 'INV-DOC-PQF-03',
    title: 'Supplier Prequalification Form',
    category: 'QUALIFICATION',
    categoryLabel: 'Qualification & Vetting',
    shortDescription: 'Tender-specific competency questionnaire and high-rise curtain wall track record assessment.',
    barcodeValue: 'INV-DOC-PQF-03-PREQ',
    standardClauses: [
      'Applicant must demonstrate prior successful execution of architectural façade projects exceeding 20 floors.',
      'Verification of adequate working capital and bank bonding capacity is mandatory for package tier clearance.',
      'References provided will be independently audited by Innovista Commercial and Engineering Evaluation Panels.'
    ]
  },
  {
    id: 'doc-04-qualification-assessment',
    docNumber: 4,
    docCode: 'INV-DOC-SQA-04',
    title: 'Supplier Qualification Assessment',
    category: 'QUALIFICATION',
    categoryLabel: 'Qualification & Vetting',
    shortDescription: 'Internal weighted scoring scorecard covering technical, financial, and quality capability.',
    barcodeValue: 'INV-DOC-SQA-04-EVAL',
    standardClauses: [
      'Evaluation scoring weights: Technical Rigour (30%), Financial Health (20%), QA/QC (25%), Delivery OTIF (15%), ESG (10%).',
      'Minimum qualifying threshold for Tier 1 Architectural Materials is 80.0% composite score.',
      'Assessment results are valid for 12 calendar months and subject to periodic surveillance re-audits.'
    ]
  },
  {
    id: 'doc-05-due-diligence-checklist',
    docNumber: 5,
    docCode: 'INV-DOC-DDC-05',
    title: 'Supplier Due-Diligence Checklist',
    category: 'QUALIFICATION',
    categoryLabel: 'Qualification & Vetting',
    shortDescription: 'Multi-point statutory compliance, trade sanctions, ESG, and financial solvency verification audit.',
    barcodeValue: 'INV-DOC-DDC-05-DILG',
    standardClauses: [
      'Ultimate beneficial ownership (UBO) verified against international sanction and debarment registries.',
      'Environmental permits for chemical surface finishing and waste effluent treatment independently inspected.',
      'Zero tolerance affirmation regarding child labour, forced labour, and statutory worker minimum wage compliance.'
    ]
  },
  {
    id: 'doc-06-approval-form',
    docNumber: 6,
    docCode: 'INV-DOC-SAF-06',
    title: 'Supplier Approval Form',
    category: 'STATUS_APPROVAL',
    categoryLabel: 'Approval & Status Management',
    shortDescription: 'Formal procurement committee authorization for approved vendor code assignment and credit terms.',
    barcodeValue: 'INV-DOC-SAF-06-APPR',
    standardClauses: [
      'Vendor is granted formal Approved Vendor status and assigned a unique ERP Vendor Master Code.',
      'Purchase Orders may be issued up to the authorized Single Order Limit Cap under approved credit terms.',
      'Approval is contingent upon adherence to Innovista standard Quality Acceptance Criteria and contractual SLA terms.'
    ]
  },
  {
    id: 'doc-07-rejection-form',
    docNumber: 7,
    docCode: 'INV-DOC-SRF-07',
    title: 'Supplier Rejection Form',
    category: 'STATUS_APPROVAL',
    categoryLabel: 'Approval & Status Management',
    shortDescription: 'Official notification detailing specific technical or commercial non-qualification grounds.',
    barcodeValue: 'INV-DOC-SRF-07-REJC',
    standardClauses: [
      'The applicant entity has not met the mandatory baseline qualification benchmarks established by Innovista.',
      'Specific non-compliance criteria and audit deficit areas are outlined in Section B of this formal determination.',
      'The applicant may formally re-apply after a mandatory cooling-off period of 6 months upon rectifying highlighted deficiencies.'
    ]
  },
  {
    id: 'doc-08-suspension-notice',
    docNumber: 8,
    docCode: 'INV-DOC-SSN-08',
    title: 'Supplier Suspension Notice',
    category: 'STATUS_APPROVAL',
    categoryLabel: 'Approval & Status Management',
    shortDescription: 'Contractual notification of immediate vendor suspension due to quality NCRs or delivery defaults.',
    barcodeValue: 'INV-DOC-SSN-08-SUSP',
    standardClauses: [
      'Effective immediately, all pending procurement invitations and new purchase order issuances are frozen.',
      'Vendor is required to submit a comprehensive Corrective and Preventive Action (CAPA) plan within 10 business days.',
      'Non-remedied breaches upon expiry of the probation window will trigger automatic vendor blacklisting.'
    ]
  },
  {
    id: 'doc-09-reactivation-form',
    docNumber: 9,
    docCode: 'INV-DOC-RAF-09',
    title: 'Supplier Re-activation Form',
    category: 'STATUS_APPROVAL',
    categoryLabel: 'Approval & Status Management',
    shortDescription: 'Post-probation reinstatement clearance following verified CAPA compliance and re-audit.',
    barcodeValue: 'INV-DOC-RAF-09-RACT',
    standardClauses: [
      'Audit team certifies that previous non-conformances have been satisfactorily closed out with verifiable QA measures.',
      'Vendor is reinstated under probationary Tier 3 monitoring for a mandatory duration of 90 calendar days.',
      'Any repeat NCR during the probationary tenure shall result in immediate permanent disqualification.'
    ]
  },
  {
    id: 'doc-10-evaluation-form',
    docNumber: 10,
    docCode: 'INV-DOC-SEF-10',
    title: 'Supplier Evaluation Form',
    category: 'EVALUATION',
    categoryLabel: 'Evaluation & Performance',
    shortDescription: 'Quarterly review instrument scoring material quality, OTIF delivery, and pricing competitiveness.',
    barcodeValue: 'INV-DOC-SEF-10-EVAL',
    standardClauses: [
      'Periodic evaluation serves as the baseline for annual framework allocation and rate negotiation tiering.',
      'Evaluation metrics are drawn directly from Goods Receipt Notes (GRN), NCR logs, and commercial invoice matching.',
      'Vendors scoring below 70% composite must attend a formal performance remediation review with Innovista Sourcing.'
    ]
  },
  {
    id: 'doc-11-performance-evaluation',
    docNumber: 11,
    docCode: 'INV-DOC-SPE-11',
    title: 'Supplier Performance Evaluation',
    category: 'EVALUATION',
    categoryLabel: 'Evaluation & Performance',
    shortDescription: 'Formal executive scorecard displaying historical OTIF, PPM defect rate, and tier ranking.',
    barcodeValue: 'INV-DOC-SPE-11-PERF',
    standardClauses: [
      'Executive performance scorecards reflect verifiable 12-month trailing rolling averages.',
      'Suppliers achieving Class A (>90% OTIF and <500 PPM) qualify for priority framework renewal and volume bonuses.',
      'Defect rates exceeding contractual thresholds trigger compensatory liquidated damages per purchase agreement.'
    ]
  },
  {
    id: 'doc-12-master-record',
    docNumber: 12,
    docCode: 'INV-DOC-SMR-12',
    title: 'Supplier Master Record',
    category: 'REGISTRATION',
    categoryLabel: 'Master Data & Governance',
    shortDescription: 'Authoritative ERP master data registry sheet detailing legal, tax, and governance parameters.',
    barcodeValue: 'INV-DOC-SMR-12-MSTR',
    standardClauses: [
      'Official centralized record under Innovista Enterprise Resource Planning and Procurement Master Database.',
      'Authorized changes require dual sign-off from Head of Sourcing and Chief Financial Officer.',
      'Record serves as the legal reference for all contractual notices, dispute correspondence, and formal payments.'
    ]
  },
  {
    id: 'doc-13-contact-sheet',
    docNumber: 13,
    docCode: 'INV-DOC-SCS-13',
    title: 'Supplier Contact Sheet',
    category: 'REGISTRATION',
    categoryLabel: 'Master Data & Governance',
    shortDescription: 'Multi-tier operational and emergency escalation contact directory for engineering and sites.',
    barcodeValue: 'INV-DOC-SCS-13-CONT',
    standardClauses: [
      'Vendor must maintain an active 24/7 technical representative available for rapid site emergency intervention.',
      'Any personnel change in designated Key Account or Factory QC management must be communicated within 48 hours.',
      'Authorized project dispatch notices delivered to the primary email herein constitute legal delivery notification.'
    ]
  },
  {
    id: 'doc-14-bank-details-form',
    docNumber: 14,
    docCode: 'INV-DOC-SBD-14',
    title: 'Supplier Bank Details Form',
    category: 'LEGAL_COMPLIANCE',
    categoryLabel: 'Finance & Compliance',
    shortDescription: 'Institutional banking credentials verification form. (Account numbers withheld for corporate security).',
    barcodeValue: 'INV-DOC-SBD-14-BANK',
    standardClauses: [
      'Bank information is verified directly with institutional branch clearing registries for payee identity confirmation.',
      'SECURITY NOTICE: Specific bank account numbers are withheld from this formal document and processed via encrypted ERP tokenization.',
      'Any modification to remittance bank accounts requires a certified hardcopy board resolution and in-person verification.'
    ]
  },
  {
    id: 'doc-15-tax-information-form',
    docNumber: 15,
    docCode: 'INV-DOC-STI-15',
    title: 'Supplier Tax Information Form',
    category: 'LEGAL_COMPLIANCE',
    categoryLabel: 'Finance & Compliance',
    shortDescription: 'Statutory VAT/GST tax identification, withholding tax eligibility, and fiscal residency declaration.',
    barcodeValue: 'INV-DOC-STI-15-TAXX',
    standardClauses: [
      'Vendor warrants that it holds full active tax registration with relevant national and provincial revenue authorities.',
      'All commercial tax invoices issued must reflect the exact verified Tax Identification Number (TIN) detailed herein.',
      'Vendor indemnifies Innovista against any penalties arising from supplier misrepresentation of tax exempt or VAT status.'
    ]
  },
  {
    id: 'doc-16-compliance-declaration',
    docNumber: 16,
    docCode: 'INV-DOC-SCD-16',
    title: 'Supplier Compliance Declaration',
    category: 'LEGAL_COMPLIANCE',
    categoryLabel: 'Finance & Compliance',
    shortDescription: 'Statutory affirmation of anti-bribery, conflict of interest, worker safety, and environmental stewardship.',
    barcodeValue: 'INV-DOC-SCD-16-COMP',
    standardClauses: [
      'Vendor affirms compliance with all Anti-Bribery, Anti-Money Laundering, and Anti-Corruption statutes.',
      'Zero financial gifts, commissions, or improper entertainment have been offered to any Innovista employee.',
      'Violation of this declaration constitutes material breach warranting immediate summary termination and legal damages.'
    ]
  },
  {
    id: 'doc-17-supplier-nda',
    docNumber: 17,
    docCode: 'INV-DOC-NDA-17',
    title: 'Supplier Non-Disclosure Agreement (NDA)',
    category: 'LEGAL_COMPLIANCE',
    categoryLabel: 'Legal Agreements',
    shortDescription: 'Legally binding mutual non-disclosure and intellectual property protection deed for architectural designs.',
    barcodeValue: 'INV-DOC-NDA-17-CONF',
    standardClauses: [
      'All façade shop drawings, extrusion die designs, calculations, and pricing formulas are strictly proprietary confidential assets.',
      'The Receiving Party shall not disclose, duplicate, reverse engineer, or utilize confidential information for third-party tenders.',
      'Confidentiality obligations remain binding for a duration of five (5) years following project completion or tender termination.'
    ]
  },
  {
    id: 'doc-18-code-of-conduct',
    docNumber: 18,
    docCode: 'INV-DOC-SCC-18',
    title: 'Supplier Code of Conduct',
    category: 'LEGAL_COMPLIANCE',
    categoryLabel: 'Legal Agreements',
    shortDescription: 'Operational ethics, workplace safety standards, environmental protocols, and audit rights covenant.',
    barcodeValue: 'INV-DOC-SCC-18-CODE',
    standardClauses: [
      'Full compliance with OSHA and local Working-at-Height safety protocols for all site-visiting supplier crews.',
      'Commitment to continuous carbon footprint reduction, certified recycling of aluminum scrap, and sustainable packaging.',
      'Innovista retains the unrestricted right to conduct periodic third-party social and environmental factory audits.'
    ]
  },
  {
    id: 'doc-19-supplier-agreement',
    docNumber: 19,
    docCode: 'INV-DOC-SAG-19',
    title: 'Supplier General Agreement',
    category: 'CONTRACTS_REGISTERS',
    categoryLabel: 'Master Contracts & Registers',
    shortDescription: 'Formal General Terms & Conditions governing delivery acceptance, warranties, and title transfer.',
    barcodeValue: 'INV-DOC-SAG-19-AGRM',
    standardClauses: [
      'Materials supplied must strictly conform to approved submittals, ASTM B221, EN 12150, and CWCT performance standards.',
      'Warranty: 10 Years on Architectural Powder Coating Class 2, 5 Years on Insulated Glass Units, 25 Years on Extrusion Alloys.',
      'Title transfers upon full delivery to Innovista yard; risk of in-transit damage remains with vendor until physical GRN sign-off.'
    ]
  },
  {
    id: 'doc-20-framework-agreement',
    docNumber: 20,
    docCode: 'INV-DOC-FWA-20',
    title: 'Framework Master Supply Agreement',
    category: 'CONTRACTS_REGISTERS',
    categoryLabel: 'Master Contracts & Registers',
    shortDescription: 'Multi-year blanket purchase agreement with locked price tiers, MOQ schedules, and volume rebates.',
    barcodeValue: 'INV-DOC-FWA-20-FWRK',
    standardClauses: [
      'Benchmark rates locked per agreed volume brackets and indexed to published LME raw billet pass-through formula.',
      'Guaranteed delivery lead times with liquidated damages of 0.5% per week of delay up to a maximum ceiling of 10%.',
      'Annual volume rebate schedule applies upon exceeding certified milestone procurement spend thresholds.'
    ]
  },
  {
    id: 'doc-21-approved-supplier-list',
    docNumber: 21,
    docCode: 'INV-DOC-ASL-21',
    title: 'Approved Supplier List (AVL)',
    category: 'CONTRACTS_REGISTERS',
    categoryLabel: 'Master Contracts & Registers',
    shortDescription: 'Certified master register of all active accredited vendors with tier ranking and valid audit dates.',
    barcodeValue: 'INV-DOC-ASL-21-LIST',
    standardClauses: [
      'Official Innovista Corporate Approved Vendor List certified for project procurement and tender issuance.',
      'Only vendors listed herein are authorized to receive formal Requests for Quotation (RFQs) and Purchase Orders.',
      'Certified annually by the Head of Procurement and Director of Quality & Engineering Governance.'
    ]
  },
  {
    id: 'doc-22-restricted-supplier-list',
    docNumber: 22,
    docCode: 'INV-DOC-RSL-22',
    title: 'Restricted / Blocked Supplier List',
    category: 'CONTRACTS_REGISTERS',
    categoryLabel: 'Master Contracts & Registers',
    shortDescription: 'Governance debarment and blacklisted supplier register with documented legal and quality causes.',
    barcodeValue: 'INV-DOC-RSL-22-BLCK',
    standardClauses: [
      'Corporate blacklisting notice: Entities listed herein are strictly prohibited from all commercial dealings with Innovista.',
      'ERP automated procurement locks are enforced to block requisition creation or payment release to listed entities.',
      'Removal or re-consideration requires formal appeal approval by the Executive Governance and Risk Committee.'
    ]
  }
];

export class ProcurementMasterDocsService {
  /**
   * Generates a fully populated MasterDocFormData initialized with either a real supplier
   * or rich, authentic enterprise defaults, ready for digital form editing.
   */
  public generateDefaultFormData(
    docDef: ProcurementMasterDocDefinition,
    supplier?: Supplier | null
  ): MasterDocFormData {
    const today = new Date().toISOString().split('T')[0];
    const expiryYear = new Date().getFullYear() + 2;
    const expiry = `${expiryYear}-12-31`;

    const supName = supplier?.name || 'Alumex Architectural Extrusions PLC';
    const supCode = supplier?.vendorCode || supplier?.id || 'VND-ALU-001';
    const supCategory = supplier?.category || 'Extrusions & Billet Alloys';

    return {
      docCode: docDef.docCode,
      docTitle: docDef.title,
      docRefNo: `${docDef.docCode}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      date: today,
      effectiveDate: today,
      expiryDate: expiry,
      revision: 'REV-02 (2026)',
      securityClassification: 'OFFICIAL PROCUREMENT',
      
      supplierId: supCode,
      supplierName: supName,
      legalTradingName: `${supName} (Pvt) Ltd`,
      businessRegNo: 'PV-109824-REG',
      taxVatId: 'VAT-982341209-V',
      natureOfBusiness: supCategory,
      registeredAddress: 'No. 45/A, Industrial Export Processing Zone, Biyagama, Sri Lanka',
      factoryWorksAddress: 'Plant No. 3, High-Capacity Extrusion & Vertical Powder Coating Yard, Sri Lanka',
      website: 'www.alumexgroup.com',
      
      contactPerson: 'Eng. Priyantha Jayasuriya',
      contactDesignation: 'Executive Director - Industrial & Architectural Façade Division',
      contactEmail: 'p.jayasuriya@alumexgroup.com',
      contactPhone: '+94 11 248 9000 / +94 77 123 4567',
      secondaryContact: 'Ms. Dilani Weerasinghe (Quality Assurance Lead)',
      
      // Banking parameters (WITHOUT account number as strictly required)
      bankName: 'Commercial Bank of Ceylon PLC',
      bankBranch: 'Corporate Banking Centre, Colombo 01',
      bankSwiftBic: 'CCEYLKFX',
      bankRoutingCode: '7010-001',
      accountCurrency: 'LKR / USD',
      accountBeneficiaryName: `${supName} (Pvt) Ltd`,
      paymentTerms: supplier?.paymentTerms || '60 Days Net from GRN Verification',
      creditLimitCap: 'LKR 75,000,000',
      
      categoriesSupplied: [
        'High-Tensile Curtain Wall Extrusions (EN 755-9)',
        'Qualicoat Class 2 Architectural Powder Coating',
        'Thermal Break Insulated Profiles (Polyamide 6.6)',
        'Custom Die Tooling & Precision CNC Milling'
      ],
      cwctTested: true,
      iso9001Certified: true,
      iso14001Certified: true,
      annualCapacity: '24,000 Metric Tons / Annum',
      facilitySize: '185,000 sq.ft Under Cover',
      leadTimeWeeks: '2 - 3 Weeks from Approved Die Drawing',
      
      assessmentScore: supplier?.rating ? Math.round(supplier.rating * 20) : 92,
      qualityRating: supplier?.rating || 4.8,
      deliveryOtifPercent: 96.5,
      decisionStatus: 'APPROVED',
      decisionJustification: 'Vendor satisfies all EN 755 structural alloy tensile requirements with verified MTC 3.1 certification and zero major NCR records over 24 trailing months.',
      suspensionReason: 'N/A - Compliant Status',
      probationaryPeriod: '90 Days Post-Audit Review',
      ndaJurisdiction: 'Commercial High Court of Colombo / UAE International Financial Centre',
      ndaTermYears: 5,
      warrantyPeriodYears: 10,
      customNotes: 'Certified primary vendor for Altair Tower, Cinnamon Life, and Marina Bay Curtain Wall structural framing packages.',
      
      preparedBy: 'Alexander Vance',
      preparedTitle: 'Strategic Procurement & Supply Chain Lead',
      reviewedBy: 'Elena Rostova',
      reviewedTitle: 'Director of Quality Assurance & CWCT Compliance',
      approvedBy: 'Marcus Sterling',
      approvedTitle: 'Chief Operating Officer & Head of Sourcing',
      supplierSignatory: 'Eng. Priyantha Jayasuriya',
      supplierSignatoryTitle: 'Authorized Corporate Signatory'
    };
  }

  public getDocumentDefinitions(): ProcurementMasterDocDefinition[] {
    return [...ALL_22_PROCUREMENT_MASTER_DOCS];
  }

  public getDocumentById(idOrNumber: string | number): ProcurementMasterDocDefinition | undefined {
    if (typeof idOrNumber === 'number') {
      return ALL_22_PROCUREMENT_MASTER_DOCS.find(d => d.docNumber === idOrNumber);
    }
    return ALL_22_PROCUREMENT_MASTER_DOCS.find(d => d.id === idOrNumber || d.docCode === idOrNumber);
  }
}

export const procurementMasterDocsService = new ProcurementMasterDocsService();
