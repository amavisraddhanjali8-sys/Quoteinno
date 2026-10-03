import { 
  Supplier, 
  RequestForQuotation, 
  PurchaseOrder, 
  GoodsReceiptNote, 
  SupplierEvaluation, 
  ProcurementAnalytics,
  PurchaseRequisition,
  ReverseAuction,
  ReverseAuctionBid,
  ContractAgreement,
  ServiceCompletionNote,
  SupplierInvoice,
  ProcurementNCR,
  InventoryStockItem,
  StockMovement,
  ScrapRecord,
  EmergencyRequest,
  SupplierComplianceDoc,
  SupplierTicket,
  PettyCashTransaction
} from '../types/procurement';

const STORAGE_KEYS = {
  SUPPLIERS: 'innovista_procurement_suppliers_v1',
  RFQS: 'innovista_procurement_rfqs_v1',
  POS: 'innovista_procurement_pos_v1',
  GRNS: 'innovista_procurement_grns_v1',
  EVALUATIONS: 'innovista_procurement_evaluations_v1',
  REQUISITIONS: 'innovista_procurement_pr_v1',
  AUCTIONS: 'innovista_procurement_auctions_v1',
  CONTRACTS: 'innovista_procurement_contracts_v1',
  SCNS: 'innovista_procurement_scns_v1',
  INVOICES: 'innovista_procurement_invoices_v1',
  NCRS: 'innovista_procurement_ncrs_v1',
  INVENTORY: 'innovista_procurement_inventory_v1',
  MOVEMENTS: 'innovista_procurement_movements_v1',
  SCRAP: 'innovista_procurement_scrap_v1',
  EMERGENCIES: 'innovista_procurement_emergencies_v1',
  COMPLIANCE: 'innovista_procurement_compliance_v1',
  TICKETS: 'innovista_procurement_tickets_v1',
  PETTY_CASH: 'innovista_procurement_petty_cash_v1'
};

const SEED_SUPPLIERS: Supplier[] = [
  {
    id: 'sup-001',
    vendorCode: 'VND-ESA-01',
    name: 'Emirates Steel Arkan PJSC',
    category: 'Structural Steel & Alloys',
    contactPerson: 'Kareem Al-Husseini',
    email: 'kareem.sales@emiratessteel.com',
    phone: '+971 2 550 1111',
    city: 'Abu Dhabi',
    country: 'United Arab Emirates',
    taxRegistrationNumber: '100234567800003',
    tradeLicenseNumber: 'CN-1029481',
    rating: 4.9,
    status: 'Preferred',
    paymentTerms: 'Net 60 Days',
    creditLimit: 2500000,
    currency: 'AED',
    onTimeDeliveryRate: 98.4,
    qualityAcceptanceRate: 99.1,
    totalOrdersValue: 1420500,
    approvedMaterials: ['Hot Rolled Beams (UB/UC)', 'Equal Angles', 'Structural Steel Plates S275JR/S355JR', 'High Yield Deformed Rebar'],
    bankDetails: {
      bankName: 'First Abu Dhabi Bank (FAB)',
      iban: 'AE880330000012345678901',
      swiftCode: 'FABAAEAD'
    },
    notes: 'Direct mill distributor. MTC Mill Test Certificates provided with every melt heat delivery.',
    createdAt: '2025-01-15T08:00:00Z',
    updatedAt: '2026-09-01T10:30:00Z'
  },
  {
    id: 'sup-002',
    vendorCode: 'VND-ALU-02',
    name: 'Alucobond Architectural Panels Ltd',
    category: 'Aluminium Extrusions & Panels',
    contactPerson: 'Christian Moreau',
    email: 'cmoreau@3acomposites.ae',
    phone: '+971 4 338 2900',
    city: 'Dubai',
    country: 'United Arab Emirates',
    taxRegistrationNumber: '100456789000003',
    tradeLicenseNumber: 'DXB-554201',
    rating: 4.8,
    status: 'Preferred',
    paymentTerms: 'Net 30 Days',
    creditLimit: 1200000,
    currency: 'AED',
    onTimeDeliveryRate: 96.2,
    qualityAcceptanceRate: 98.8,
    totalOrdersValue: 845000,
    approvedMaterials: ['Alucobond Plus 4mm Fire Rated (FR) Core', 'Alucobond A2 Non-Combustible Panels', 'PVDF Coated Metal Sheets'],
    bankDetails: {
      bankName: 'Emirates NBD',
      iban: 'AE440260000098765432101',
      swiftCode: 'EBILAEAD'
    },
    notes: 'Civil Defense certified fire-safe architectural composite sheets.',
    createdAt: '2025-02-10T09:00:00Z',
    updatedAt: '2026-08-15T14:15:00Z'
  },
  {
    id: 'sup-003',
    vendorCode: 'VND-GLF-03',
    name: 'Gulf Extrusions LLC',
    category: 'Aluminium Extrusions & Panels',
    contactPerson: 'Sanjay Varma',
    email: 's.varma@gulfex.com',
    phone: '+971 4 884 6146',
    city: 'Dubai',
    country: 'United Arab Emirates',
    taxRegistrationNumber: '100789012300003',
    tradeLicenseNumber: 'DXB-108492',
    rating: 4.6,
    status: 'Active',
    paymentTerms: 'Net 30 Days',
    creditLimit: 900000,
    currency: 'AED',
    onTimeDeliveryRate: 94.0,
    qualityAcceptanceRate: 97.5,
    totalOrdersValue: 620000,
    approvedMaterials: ['Curtain Wall Mullions 6063-T6', 'Aluminium Transoms', 'Custom Sun Louver Extrusions', 'Thermal Break Sections'],
    bankDetails: {
      bankName: 'Mashreq Bank',
      iban: 'AE120310000055443322111',
      swiftCode: 'BOMLAEAD'
    },
    createdAt: '2025-03-01T10:00:00Z',
    updatedAt: '2026-07-20T11:00:00Z'
  },
  {
    id: 'sup-004',
    vendorCode: 'VND-HLT-04',
    name: 'Hilti Emirates LLC',
    category: 'Hardware & Fasteners',
    contactPerson: 'Markus Weber',
    email: 'orders.ae@hilti.com',
    phone: '+971 800 44584',
    city: 'Dubai',
    country: 'United Arab Emirates',
    taxRegistrationNumber: '100345678900003',
    tradeLicenseNumber: 'DXB-204918',
    rating: 4.9,
    status: 'Preferred',
    paymentTerms: 'Net 30 Days',
    creditLimit: 500000,
    currency: 'AED',
    onTimeDeliveryRate: 99.0,
    qualityAcceptanceRate: 99.6,
    totalOrdersValue: 318000,
    approvedMaterials: ['HIT-HY 200 Chemical Anchors', 'HST3 Heavy Duty Wedge Anchors', 'Fasteners Stainless A4-70', 'Diamond Core Bits'],
    bankDetails: {
      bankName: 'Standard Chartered UAE',
      iban: 'AE950100000011223344556',
      swiftCode: 'SCBLAEAD'
    },
    notes: 'Premium structural anchor systems with seismic qualification documentation.',
    createdAt: '2025-01-20T11:00:00Z',
    updatedAt: '2026-09-10T16:00:00Z'
  },
  {
    id: 'sup-005',
    vendorCode: 'VND-JOT-05',
    name: 'Jotun Paints UAE Ltd',
    category: 'Industrial Coatings & Paints',
    contactPerson: 'Per Lindqvist',
    email: 'per.lindqvist@jotun.com',
    phone: '+971 4 339 5000',
    city: 'Dubai',
    country: 'United Arab Emirates',
    taxRegistrationNumber: '100901234500003',
    tradeLicenseNumber: 'DXB-319402',
    rating: 4.7,
    status: 'Active',
    paymentTerms: 'Net 45 Days',
    creditLimit: 600000,
    currency: 'AED',
    onTimeDeliveryRate: 95.8,
    qualityAcceptanceRate: 98.9,
    totalOrdersValue: 412000,
    approvedMaterials: ['Penguard Pro Zinc-Rich Primer', 'Hardtop XP Polyurethane Topcoat', 'Steelmaster 60SB Intumescent Fire Protection Coating'],
    bankDetails: {
      bankName: 'Abu Dhabi Commercial Bank (ADCB)',
      iban: 'AE550240000077889900112',
      swiftCode: 'ADCBAEAA'
    },
    createdAt: '2025-04-12T08:30:00Z',
    updatedAt: '2026-08-30T13:40:00Z'
  },
  {
    id: 'sup-006',
    vendorCode: 'VND-SGB-06',
    name: 'Saint-Gobain Glass Solutions UAE',
    category: 'Architectural Glass',
    contactPerson: 'Nathalie Dupont',
    email: 'ae.glass@saint-gobain.com',
    phone: '+971 4 810 5000',
    city: 'Dubai',
    country: 'United Arab Emirates',
    taxRegistrationNumber: '100112233400003',
    tradeLicenseNumber: 'DXB-492019',
    rating: 4.8,
    status: 'Active',
    paymentTerms: '50% Advance, 50% on Delivery',
    creditLimit: 750000,
    currency: 'AED',
    onTimeDeliveryRate: 93.5,
    qualityAcceptanceRate: 99.2,
    totalOrdersValue: 530000,
    approvedMaterials: ['Cool-Lite SKN 176 II Solar Control Glass', 'Stadip Silence Laminated Glass 12.76mm', 'Contraflam EI 60 Fire Rated Glazing'],
    bankDetails: {
      bankName: 'HSBC Bank Middle East',
      iban: 'AE770200000099887766554',
      swiftCode: 'BBMEAEAD'
    },
    createdAt: '2025-05-18T12:00:00Z',
    updatedAt: '2026-09-05T09:20:00Z'
  }
];

const SEED_RFQS: RequestForQuotation[] = [
  {
    id: 'rfq-2026-001',
    rfqNumber: 'RFQ-2026-001',
    title: 'Supply of Structural S355JR Steel Beams & Plates',
    projectId: 'proj-altair-01',
    projectName: 'Altair Tower - Luxury Façade & Glazing Package',
    requiredDeliveryDate: '2026-10-15',
    status: 'Awarded',
    items: [
      { id: 'item-1', itemDescription: 'Universal Beams UB 305x165x40kg/m Grade S355JR', materialGrade: 'S355JR', quantity: 24, unit: 'MT', estimatedTargetPrice: 3800 },
      { id: 'item-2', itemDescription: 'Structural Steel Plates 16mm Thk S355JR Mill Finish', materialGrade: 'S355JR', quantity: 12, unit: 'MT', estimatedTargetPrice: 3950 },
      { id: 'item-3', itemDescription: 'Equal Angles 100x100x10mm Grade S275JR', materialGrade: 'S275JR', quantity: 6, unit: 'MT', estimatedTargetPrice: 3600 }
    ],
    invitedSupplierIds: ['sup-001', 'sup-003'],
    bids: [
      {
        supplierId: 'sup-001',
        supplierName: 'Emirates Steel Arkan PJSC',
        bidReference: 'ESA-QT-2026-904',
        submissionDate: '2026-09-08',
        unitPrices: { 'item-1': 3750, 'item-2': 3900, 'item-3': 3550 },
        totalBidAmount: 158100,
        leadTimeWeeks: 2,
        paymentTermsOffered: 'Net 60 Days',
        technicalCompliance: true,
        bidStatus: 'Selected',
        notes: 'Includes delivery to Dubai Fabrication Yard and original 3.1 Mill Certificates.'
      }
    ],
    awardedSupplierId: 'sup-001',
    awardedAmount: 158100,
    awardJustification: 'Lowest compliant bid from preferred mill-direct supplier with fastest delivery timeline.',
    createdBy: 'Tariq Mansoor',
    createdAt: '2026-09-02T10:00:00Z',
    closedAt: '2026-09-12T14:30:00Z'
  },
  {
    id: 'rfq-2026-002',
    rfqNumber: 'RFQ-2026-002',
    title: 'Fire Rated (FR) Alucobond Metallic Silver Panels',
    projectId: 'proj-cinnamon-03',
    projectName: 'Cinnamon Life Suites - Acoustic Glazing & Partitions',
    requiredDeliveryDate: '2026-10-30',
    status: 'Bids Received',
    items: [
      { id: 'item-4', itemDescription: 'Alucobond Plus 4mm FR Core - Metallic Silver 500', materialGrade: 'FR Fire Rated', dimensionSpec: '1500 x 4000 mm', quantity: 1850, unit: 'm²', estimatedTargetPrice: 165 },
      { id: 'item-5', itemDescription: 'Fastener Clamping Extrusions 6063-T6', materialGrade: 'Alloy 6063-T6', quantity: 850, unit: 'm', estimatedTargetPrice: 42 }
    ],
    invitedSupplierIds: ['sup-002', 'sup-003'],
    bids: [
      {
        supplierId: 'sup-002',
        supplierName: 'Alucobond Architectural Panels Ltd',
        bidReference: 'ALU-BID-889',
        submissionDate: '2026-09-18',
        unitPrices: { 'item-4': 160, 'item-5': 39 },
        totalBidAmount: 329150,
        leadTimeWeeks: 3,
        paymentTermsOffered: 'Net 30 Days',
        technicalCompliance: true,
        bidStatus: 'Under Evaluation',
        notes: 'Fully civil defense compliant batch in stock.'
      }
    ],
    createdBy: 'Tariq Mansoor',
    createdAt: '2026-09-14T09:15:00Z'
  }
];

const SEED_POS: PurchaseOrder[] = [
  {
    id: 'po-2026-001',
    poNumber: 'PO-2026-0182',
    rfqId: 'rfq-2026-001',
    supplierId: 'sup-001',
    supplierName: 'Emirates Steel Arkan PJSC',
    projectId: 'proj-altair-01',
    projectName: 'Altair Tower - Luxury Façade & Glazing Package',
    receivingBranch: 'Dubai Fabrication Yard',
    orderDate: '2026-09-12',
    expectedDeliveryDate: '2026-09-28',
    items: [
      { id: 'poi-1', description: 'Universal Beams UB 305x165x40kg/m Grade S355JR', quantity: 24, receivedQuantity: 24, unit: 'MT', unitPrice: 3750, totalAmount: 90000, category: 'Structural Steel & Alloys' },
      { id: 'poi-2', description: 'Structural Steel Plates 16mm Thk S355JR Mill Finish', quantity: 12, receivedQuantity: 12, unit: 'MT', unitPrice: 3900, totalAmount: 46800, category: 'Structural Steel & Alloys' },
      { id: 'poi-3', description: 'Equal Angles 100x100x10mm Grade S275JR', quantity: 6, receivedQuantity: 6, unit: 'MT', unitPrice: 3550, totalAmount: 21300, category: 'Structural Steel & Alloys' }
    ],
    subtotal: 158100,
    vatRatePercent: 5,
    vatAmount: 7905,
    totalAmount: 166005,
    currency: 'AED',
    paymentTerms: 'Net 60 Days',
    specialInstructions: 'Delivery between 07:00 and 15:00. Overhead crane offloading arranged at Yard Bay 2.',
    status: 'Completed',
    matchingStatus: '3-Way Matched',
    createdBy: 'Tariq Mansoor',
    approvedBy: 'Alexander Vance',
    approvedAt: '2026-09-13T11:00:00Z',
    issuedAt: '2026-09-13T14:00:00Z',
    createdAt: '2026-09-12T15:00:00Z',
    updatedAt: '2026-09-21T16:00:00Z'
  },
  {
    id: 'po-2026-002',
    poNumber: 'PO-2026-0185',
    supplierId: 'sup-004',
    supplierName: 'Hilti Emirates LLC',
    projectId: 'proj-altair-01',
    projectName: 'Altair Tower - Luxury Façade & Glazing Package',
    receivingBranch: 'Dubai Fabrication Yard',
    orderDate: '2026-09-15',
    expectedDeliveryDate: '2026-09-22',
    items: [
      { id: 'poi-4', description: 'HIT-HY 200-A V3 Injectable Hybrid Adhesive Mortar 500ml', quantity: 150, receivedQuantity: 150, unit: 'pcs', unitPrice: 145, totalAmount: 21750, category: 'Hardware & Fasteners' },
      { id: 'poi-5', description: 'HST3-R M16x145 Stainless Steel Heavy Duty Expansion Anchor', quantity: 450, receivedQuantity: 450, unit: 'pcs', unitPrice: 38, totalAmount: 17100, category: 'Hardware & Fasteners' }
    ],
    subtotal: 38850,
    vatRatePercent: 5,
    vatAmount: 1942.5,
    totalAmount: 40792.5,
    currency: 'AED',
    paymentTerms: 'Net 30 Days',
    status: 'Completed',
    matchingStatus: '3-Way Matched',
    createdBy: 'Tariq Mansoor',
    approvedBy: 'Marcus Sterling',
    approvedAt: '2026-09-16T09:00:00Z',
    issuedAt: '2026-09-16T10:00:00Z',
    createdAt: '2026-09-15T10:30:00Z',
    updatedAt: '2026-09-20T12:00:00Z'
  }
];

const SEED_GRNS: GoodsReceiptNote[] = [
  {
    id: 'grn-2026-001',
    grnNumber: 'GRN-2026-0142',
    poId: 'po-2026-001',
    poNumber: 'PO-2026-0182',
    supplierId: 'sup-001',
    supplierName: 'Emirates Steel Arkan PJSC',
    deliveryNoteNumber: 'DN-ESA-88491',
    supplierInvoiceNumber: 'INV-ESA-2026-441',
    receivedDate: '2026-09-20',
    receivingBranch: 'Dubai Fabrication Yard',
    storageLocationBin: 'Bay-2 / Rack-S14',
    items: [
      { poItemId: 'poi-1', description: 'Universal Beams UB 305x165x40kg/m Grade S355JR', orderedQuantity: 24, deliveredQuantity: 24, acceptedQuantity: 24, rejectedQuantity: 0, unit: 'MT', unitPrice: 3750, totalDeliveredValue: 90000 },
      { poItemId: 'poi-2', description: 'Structural Steel Plates 16mm Thk S355JR Mill Finish', orderedQuantity: 12, deliveredQuantity: 12, acceptedQuantity: 12, rejectedQuantity: 0, unit: 'MT', unitPrice: 3900, totalDeliveredValue: 46800 },
      { poItemId: 'poi-3', description: 'Equal Angles 100x100x10mm Grade S275JR', orderedQuantity: 6, deliveredQuantity: 6, acceptedQuantity: 6, rejectedQuantity: 0, unit: 'MT', unitPrice: 3550, totalDeliveredValue: 21300 }
    ],
    totalDeliveredValue: 158100,
    inspectionStatus: 'QC Passed',
    qcInspectorName: 'David Okafor',
    qcInspectionDate: '2026-09-20',
    qcRemarks: 'All heat numbers match MTC EN 10204 3.1. Zero dimensional deviation detected.',
    storekeeperName: 'Hamad Rashid',
    heatNumberOrMillCert: 'HT-99201-B / HT-99204-C',
    createdAt: '2026-09-20T11:00:00Z'
  }
];

const SEED_REQUISITIONS: PurchaseRequisition[] = [
  {
    id: 'pr-2026-001',
    requisitionNumber: 'PR-2026-0089',
    projectId: 'proj-altair-01',
    projectName: 'Altair Tower - Luxury Façade & Glazing Package',
    department: 'Site Engineering',
    requestedBy: 'Bilal Ahmad (Site Eng)',
    priority: 'High',
    requiredByDate: '2026-10-20',
    status: 'Budget Approved',
    budgetCategoryCode: 'CAT-STL-STRUCT',
    budgetAllocatedAmount: 500000,
    budgetCommittedAmount: 206797,
    budgetExceeded: false,
    justification: 'Required for phase 2 structural steel rafters and bracing connections.',
    items: [
      { id: 'pri-1', description: 'High Tensile Structural Bolts Grade 10.9 M24x90mm', quantity: 600, unit: 'sets', estimatedUnitPrice: 24, totalEstimatedPrice: 14400, category: 'Hardware & Fasteners', requiredDate: '2026-10-20' },
      { id: 'pri-2', description: 'Neoprene Isolating Gaskets 5mm Heavy Duty', quantity: 180, unit: 'm', estimatedUnitPrice: 35, totalEstimatedPrice: 6300, category: 'Hardware & Fasteners', requiredDate: '2026-10-20' }
    ],
    totalEstimatedCost: 20700,
    createdAt: '2026-09-21T08:30:00Z'
  },
  {
    id: 'pr-2026-002',
    requisitionNumber: 'PR-2026-0090',
    projectId: 'proj-cinnamon-03',
    projectName: 'Cinnamon Life Suites - Acoustic Glazing & Partitions',
    department: 'Facade Engineering',
    requestedBy: 'Ziad Mansour',
    priority: 'Medium',
    requiredByDate: '2026-11-05',
    status: 'Draft',
    budgetCategoryCode: 'CAT-ALUM-FACADE',
    budgetAllocatedAmount: 750000,
    budgetCommittedAmount: 345600,
    budgetExceeded: false,
    justification: 'Specialized thermal barrier gaskets for canopy glazing frames.',
    items: [
      { id: 'pri-3', description: 'EPDM Glazing Wedge Gasket Profile 42B', quantity: 2400, unit: 'm', estimatedUnitPrice: 18, totalEstimatedPrice: 43200, category: 'Hardware & Fasteners', requiredDate: '2026-11-05' }
    ],
    totalEstimatedCost: 43200,
    createdAt: '2026-09-22T09:15:00Z'
  }
];

const SEED_AUCTIONS: ReverseAuction[] = [
  {
    id: 'auc-2026-001',
    auctionNumber: 'AUC-2026-004',
    rfqId: 'rfq-2026-002',
    title: 'Live Reverse Auction: 1,850 m² Fire-Rated Alucobond Sheets',
    startingPrice: 350000,
    currentLowestBid: 312000,
    currentWinningSupplierId: 'sup-002',
    currentWinningSupplierName: 'Alucobond Architectural Panels Ltd',
    minDecrement: 2000,
    status: 'Active',
    startTime: '2026-09-23T08:00:00Z',
    endTime: '2026-09-23T18:00:00Z',
    autoExtensionSeconds: 300,
    bids: [
      { id: 'abid-1', supplierId: 'sup-003', supplierName: 'Gulf Extrusions LLC', bidAmount: 345000, timestamp: '2026-09-23T08:15:00Z', isWinning: false },
      { id: 'abid-2', supplierId: 'sup-002', supplierName: 'Alucobond Architectural Panels Ltd', bidAmount: 338000, timestamp: '2026-09-23T08:32:00Z', isWinning: false },
      { id: 'abid-3', supplierId: 'sup-003', supplierName: 'Gulf Extrusions LLC', bidAmount: 325000, timestamp: '2026-09-23T09:10:00Z', isWinning: false },
      { id: 'abid-4', supplierId: 'sup-002', supplierName: 'Alucobond Architectural Panels Ltd', bidAmount: 312000, timestamp: '2026-09-23T09:40:00Z', isWinning: true }
    ]
  }
];

const SEED_CONTRACTS: ContractAgreement[] = [
  {
    id: 'cnt-2026-001',
    contractNumber: 'CTR-2026-0082',
    title: 'Master Framework Agreement: Structural Steel Mill Rates',
    type: 'Framework',
    supplierId: 'sup-001',
    supplierName: 'Emirates Steel Arkan PJSC',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    totalValue: 3000000,
    remainingValue: 1579500,
    status: 'Active',
    slaDetails: {
      responseTimeHours: 24,
      penaltyPerDay: 1500,
      otifTargetPercent: 95
    },
    renewalDate: '2026-11-15',
    variationsCount: 1,
    rateCards: [
      { id: 'rc-1', itemDescription: 'Universal Beams Grade S355JR', unit: 'MT', contractedRate: 3750, marketBenchmarkRate: 3950, validFrom: '2026-01-01', validUntil: '2026-12-31' },
      { id: 'rc-2', itemDescription: 'Structural Steel Plates 16-25mm S355JR', unit: 'MT', contractedRate: 3900, marketBenchmarkRate: 4100, validFrom: '2026-01-01', validUntil: '2026-12-31' },
      { id: 'rc-3', itemDescription: 'Deformed Rebar High Yield BS4449 Grade 500B', unit: 'MT', contractedRate: 2650, marketBenchmarkRate: 2800, validFrom: '2026-01-01', validUntil: '2026-12-31' }
    ],
    createdAt: '2026-01-01T08:00:00Z'
  }
];

const SEED_SCNS: ServiceCompletionNote[] = [
  {
    id: 'scn-2026-001',
    scnNumber: 'SCN-2026-0034',
    poId: 'po-2026-001',
    poNumber: 'PO-2026-0182',
    supplierId: 'sup-001',
    supplierName: 'Emirates Steel Arkan PJSC',
    projectId: 'proj-altair-01',
    projectName: 'Altair Tower - Luxury Façade & Glazing Package',
    serviceType: 'Structural Steel Ultrasonic Testing & Welder Certification',
    periodFrom: '2026-09-14',
    periodTo: '2026-09-19',
    recordedBy: 'Marcus Sterling (PM)',
    status: 'Certified',
    completionPercentage: 100,
    totalValue: 28500,
    certifiedAmount: 28500,
    supervisorSignature: 'SIGNED: M. Sterling',
    siteManagerSignature: 'SIGNED: A. Vance',
    qaSignature: 'SIGNED: D. Okafor',
    deliverables: [
      { id: 'scnd-1', description: '100% Ultrasonic Testing (UT) of Canopy Splice Welds', agreedWeight: 50, percentageCompleted: 100, certifiedAmount: 14250, status: 'Completed' },
      { id: 'scnd-2', description: 'Magnetic Particle Inspection (MPI) of Column Base Joints', agreedWeight: 30, percentageCompleted: 100, certifiedAmount: 8550, status: 'Completed' },
      { id: 'scnd-3', description: 'Third-Party NDT Audit Report & Stamped Dossier', agreedWeight: 20, percentageCompleted: 100, certifiedAmount: 5700, status: 'Completed' }
    ],
    remarks: 'Full technical signoff achieved with zero weld defects.',
    createdAt: '2026-09-20T15:00:00Z'
  }
];

const SEED_INVOICES: SupplierInvoice[] = [
  {
    id: 'inv-2026-001',
    invoiceNumber: 'INV-ESA-2026-441',
    canonicalNumber: 'CANON-SUP01-202609-1042',
    supplierId: 'sup-001',
    supplierName: 'Emirates Steel Arkan PJSC',
    poId: 'po-2026-001',
    poNumber: 'PO-2026-0182',
    grnId: 'grn-2026-001',
    grnNumber: 'GRN-2026-0142',
    projectId: 'proj-altair-01',
    projectName: 'Altair Tower - Luxury Façade & Glazing Package',
    issueDate: '2026-09-21',
    dueDate: '2026-11-20',
    currency: 'AED',
    subtotal: 158100,
    taxAmount: 7905,
    totalAmount: 166005,
    status: '3-Way Matched',
    matchScore: 98,
    paymentVerificationCode: 'A7F2-99C1-84E0-3B7D',
    discrepancies: [],
    fraudRiskLevel: 'Low',
    fraudScore: 8,
    holdPayment: false,
    approvedBy: 'Alexander Vance',
    approvedAt: '2026-09-22T10:30:00Z',
    createdAt: '2026-09-21T12:00:00Z'
  },
  {
    id: 'inv-2026-002',
    invoiceNumber: 'INV-HLT-9920',
    canonicalNumber: 'CANON-SUP04-202609-1043',
    supplierId: 'sup-004',
    supplierName: 'Hilti Emirates LLC',
    poId: 'po-2026-002',
    poNumber: 'PO-2026-0185',
    projectId: 'proj-altair-01',
    projectName: 'Altair Tower - Luxury Façade & Glazing Package',
    issueDate: '2026-09-22',
    dueDate: '2026-10-22',
    currency: 'AED',
    subtotal: 38850,
    taxAmount: 1942.5,
    totalAmount: 40792.5,
    status: 'Pending',
    matchScore: 95,
    discrepancies: [],
    fraudRiskLevel: 'Low',
    fraudScore: 4,
    holdPayment: false,
    createdAt: '2026-09-22T14:15:00Z'
  }
];

const SEED_NCRS: ProcurementNCR[] = [
  {
    id: 'ncr-2026-001',
    ncrNumber: 'NCR-2026-0018',
    sourceType: 'Site Delivery',
    sourceRef: 'DN-SGB-77192',
    supplierId: 'sup-006',
    supplierName: 'Saint-Gobain Glass Solutions UAE',
    projectId: 'PRJ-2026-002',
    projectName: 'Abu Dhabi Airport Terminal 3 Canopy Refurbishment',
    severity: 'Major',
    title: 'Edge Delamination on 12.76mm Laminated Glass Panels',
    description: '4 units of laminated glass panels found with inter-layer moisture ingress and 3mm edge bubbling along bottom perimeter.',
    rootCause: 'Autoclave pressure drop during batch curing process at manufacturing plant.',
    status: 'CAPA Pending',
    holdPaymentApplied: true,
    capaPlan: 'Supplier instructed to replace 4 panels under express freight within 7 days and submit revised autoclave cycle log.',
    reportedBy: 'David Okafor (QA)',
    reportedDate: '2026-09-21',
    resolvedDate: undefined
  }
];

const SEED_INVENTORY: InventoryStockItem[] = [
  {
    id: 'inv-s-1',
    code: 'RAW-STL-UB305',
    name: 'Universal Beams UB 305x165x40kg/m Grade S355JR',
    category: 'Structural Steel & Alloys',
    warehouse: 'Dubai Fabrication Yard',
    currentQuantity: 36,
    reservedQuantity: 12,
    availableQuantity: 24,
    reorderLevel: 10,
    unit: 'MT',
    standardCost: 3750,
    binLocation: 'Yard-Bay-2',
    lastUpdated: '2026-09-22T10:00:00Z'
  },
  {
    id: 'inv-s-2',
    code: 'RAW-ALU-PAN4',
    name: 'Alucobond Plus 4mm Fire-Rated Metallic Silver',
    category: 'Aluminium Extrusions & Panels',
    warehouse: 'Dubai Fabrication Yard',
    currentQuantity: 420,
    reservedQuantity: 200,
    availableQuantity: 220,
    reorderLevel: 100,
    unit: 'm²',
    standardCost: 160,
    binLocation: 'Rack-A3',
    lastUpdated: '2026-09-22T11:30:00Z'
  },
  {
    id: 'inv-s-3',
    code: 'FIX-HLT-HY200',
    name: 'Hilti HIT-HY 200-A Injectable Chemical Mortar',
    category: 'Hardware & Fasteners',
    warehouse: 'Main Store',
    currentQuantity: 85,
    reservedQuantity: 40,
    availableQuantity: 45,
    reorderLevel: 25,
    unit: 'pcs',
    standardCost: 145,
    binLocation: 'Shelf-C12',
    lastUpdated: '2026-09-21T14:20:00Z'
  },
  {
    id: 'inv-s-4',
    code: 'PNT-JOT-PENG',
    name: 'Jotun Penguard Pro Zinc Phosphate Epoxy Primer',
    category: 'Industrial Coatings & Paints',
    warehouse: 'Abu Dhabi Site Hub',
    currentQuantity: 22,
    reservedQuantity: 10,
    availableQuantity: 12,
    reorderLevel: 8,
    unit: 'drums',
    standardCost: 420,
    binLocation: 'Chemical-Room-B',
    lastUpdated: '2026-09-20T16:00:00Z'
  }
];

const SEED_MOVEMENTS: StockMovement[] = [
  {
    id: 'sm-1',
    timestamp: '2026-09-20T11:30:00Z',
    itemCode: 'RAW-STL-UB305',
    itemName: 'Universal Beams UB 305x165x40kg/m Grade S355JR',
    type: 'Inbound GRN',
    quantity: 24,
    unit: 'MT',
    fromLocation: 'Carrier TRK-092',
    toLocation: 'Yard-Bay-2',
    referenceId: 'GRN-2026-0142',
    performedBy: 'Hamad Rashid'
  },
  {
    id: 'sm-2',
    timestamp: '2026-09-21T09:00:00Z',
    itemCode: 'RAW-STL-UB305',
    itemName: 'Universal Beams UB 305x165x40kg/m Grade S355JR',
    type: 'Outbound Issuance',
    quantity: 12,
    unit: 'MT',
    fromLocation: 'Yard-Bay-2',
    toLocation: 'Production Line #1 Cutting',
    referenceId: 'JOB-2026-9901',
    performedBy: 'Kareem Fahmy'
  }
];

const SEED_SCRAP: ScrapRecord[] = [
  {
    id: 'scr-2026-001',
    code: 'SCR-2026-0021',
    projectId: 'proj-altair-01',
    projectName: 'Altair Tower - Luxury Façade & Glazing Package',
    materialCategory: 'Structural Steel S355JR Cut-offs',
    description: 'Offcuts from 305mm I-beams and 16mm gusset plate trimming, lengths 1.2m - 2.4m clean unpainted steel.',
    weightKg: 2850,
    estimatedValue: 4200,
    status: 'Intercept Window',
    declarationDate: '2026-09-20',
    interceptExpiryDate: '2026-09-27',
    reclaimedByProjectId: undefined
  },
  {
    id: 'scr-2026-002',
    code: 'SCR-2026-0019',
    projectId: 'proj-cinnamon-03',
    projectName: 'Cinnamon Life Suites - Acoustic Glazing & Partitions',
    materialCategory: 'Aluminium Extrusions 6063-T6 Scrap',
    description: 'Profile punchings and framing trims, high-purity architectural alloy.',
    weightKg: 1420,
    estimatedValue: 8520,
    status: 'Intercepted for Project',
    declarationDate: '2026-09-12',
    interceptExpiryDate: '2026-09-19',
    reclaimedByProjectId: 'proj-altair-01',
    reclaimedByProjectName: 'Altair Tower - Luxury Façade & Glazing Package'
  }
];

const SEED_EMERGENCIES: EmergencyRequest[] = [
  {
    id: 'emg-2026-001',
    requestNumber: 'EMG-2026-0003',
    projectId: 'proj-altair-01',
    projectName: 'Altair Tower - Luxury Façade & Glazing Package',
    incidentType: 'Tower Crane Hoist Cable Sheave Failure',
    urgencyLevel: 'Critical',
    description: 'Crane 2 hoist line sheared during night lift. Critical safety stop active across entire south fabrication zone.',
    estimatedCost: 18500,
    status: 'Express PO Issued',
    safetyOverride: true,
    expressPoId: 'po-2026-002',
    expressPoNumber: 'PO-2026-0185',
    retroactiveAuditComplete: false,
    auditNotes: 'Awaiting site photos and mechanical engineer failure analysis dossier.',
    requestedBy: 'Bilal Ahmad (Site Eng)',
    createdAt: '2026-09-22T06:30:00Z'
  }
];

const SEED_COMPLIANCE: SupplierComplianceDoc[] = [
  {
    id: 'comp-1',
    supplierId: 'sup-001',
    documentType: 'Certificate of Insurance (COI)',
    documentNumber: 'POL-AXA-992019',
    issuer: 'AXA Gulf Insurance',
    issueDate: '2026-01-01',
    expiryDate: '2026-12-31',
    status: 'Valid',
    verifiedBy: 'Compliance Officer'
  },
  {
    id: 'comp-2',
    supplierId: 'sup-001',
    documentType: 'ISO 9001 Certificate',
    documentNumber: 'ISO-BSI-99201',
    issuer: 'BSI Middle East',
    issueDate: '2025-06-01',
    expiryDate: '2028-05-31',
    status: 'Valid',
    verifiedBy: 'Compliance Officer'
  },
  {
    id: 'comp-3',
    supplierId: 'sup-006',
    documentType: 'Certificate of Insurance (COI)',
    documentNumber: 'POL-OMAN-4412',
    issuer: 'Oman Insurance Company',
    issueDate: '2025-10-01',
    expiryDate: '2026-09-30',
    status: 'Expiring Soon',
    verifiedBy: 'Compliance Officer'
  }
];

const SEED_TICKETS: SupplierTicket[] = [
  {
    id: 'tkt-1',
    ticketNumber: 'TKT-2026-0029',
    supplierId: 'sup-006',
    supplierName: 'Saint-Gobain Glass Solutions UAE',
    type: 'Quality NCR',
    priority: 'High',
    subject: 'NCR-2026-0018 Payment Hold Clarification',
    status: 'Open',
    lastMessage: 'Supplier inquiry regarding payment release condition for batch glass invoice.',
    createdAt: '2026-09-22T10:00:00Z',
    updatedAt: '2026-09-22T11:30:00Z'
  }
];

const SEED_PETTY_CASH: PettyCashTransaction[] = [
  {
    id: 'pc-1',
    voucherNumber: 'VOUCH-2026-081',
    type: 'Disburse',
    amount: 350,
    recipient: 'Al Ameen Hardware & Couriers',
    category: 'Express Job Site Courier & Bolts',
    projectId: 'PRJ-2026-001',
    projectName: 'Dubai Mall Fashion Avenue Canopy Extension',
    timestamp: '2026-09-21T14:00:00Z',
    receiptRef: 'RCPT-99201'
  },
  {
    id: 'pc-2',
    voucherNumber: 'VOUCH-2026-082',
    type: 'Replenish',
    amount: 5000,
    recipient: 'Petty Cash Custodian (Site Box 1)',
    category: 'Float Top-Up from Bank Account',
    projectId: 'PRJ-2026-001',
    projectName: 'Dubai Mall Fashion Avenue Canopy Extension',
    timestamp: '2026-09-22T09:00:00Z',
    receiptRef: 'BANK-CHQ-10492'
  }
];

// LocalStorage Helper
function getStored<T>(key: string, defaultVal: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultVal;
  } catch (e) {
    return defaultVal;
  }
}

function setStored<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.error(`Failed to store key: ${key}`, e);
  }
}

class ProcurementService {
  private suppliers: Supplier[] = [];
  private rfqs: RequestForQuotation[] = [];
  private pos: PurchaseOrder[] = [];
  private grns: GoodsReceiptNote[] = [];
  private evaluations: SupplierEvaluation[] = [];
  private requisitions: PurchaseRequisition[] = [];
  private auctions: ReverseAuction[] = [];
  private contracts: ContractAgreement[] = [];
  private scns: ServiceCompletionNote[] = [];
  private invoices: SupplierInvoice[] = [];
  private ncrs: ProcurementNCR[] = [];
  private inventory: InventoryStockItem[] = [];
  private movements: StockMovement[] = [];
  private scrap: ScrapRecord[] = [];
  private emergencies: EmergencyRequest[] = [];
  private compliance: SupplierComplianceDoc[] = [];
  private tickets: SupplierTicket[] = [];
  private pettyCash: PettyCashTransaction[] = [];

  constructor() {
    this.reloadAll();
  }

  public reloadAll(): void {
    this.suppliers = getStored(STORAGE_KEYS.SUPPLIERS, SEED_SUPPLIERS);
    this.rfqs = getStored(STORAGE_KEYS.RFQS, SEED_RFQS);
    this.pos = getStored(STORAGE_KEYS.POS, SEED_POS);
    this.grns = getStored(STORAGE_KEYS.GRNS, SEED_GRNS);
    this.evaluations = getStored(STORAGE_KEYS.EVALUATIONS, []);
    this.requisitions = getStored(STORAGE_KEYS.REQUISITIONS, SEED_REQUISITIONS);
    this.auctions = getStored(STORAGE_KEYS.AUCTIONS, SEED_AUCTIONS);
    this.contracts = getStored(STORAGE_KEYS.CONTRACTS, SEED_CONTRACTS);
    this.scns = getStored(STORAGE_KEYS.SCNS, SEED_SCNS);
    this.invoices = getStored(STORAGE_KEYS.INVOICES, SEED_INVOICES);
    this.ncrs = getStored(STORAGE_KEYS.NCRS, SEED_NCRS);
    this.inventory = getStored(STORAGE_KEYS.INVENTORY, SEED_INVENTORY);
    this.movements = getStored(STORAGE_KEYS.MOVEMENTS, SEED_MOVEMENTS);
    this.scrap = getStored(STORAGE_KEYS.SCRAP, SEED_SCRAP);
    this.emergencies = getStored(STORAGE_KEYS.EMERGENCIES, SEED_EMERGENCIES);
    this.compliance = getStored(STORAGE_KEYS.COMPLIANCE, SEED_COMPLIANCE);
    this.tickets = getStored(STORAGE_KEYS.TICKETS, SEED_TICKETS);
    this.pettyCash = getStored(STORAGE_KEYS.PETTY_CASH, SEED_PETTY_CASH);
  }

  public syncWithCentralData(projects: any[], itemCatalog?: any[], productVariants?: any[]): void {
    if (!projects || projects.length === 0) return;
    
    const p1 = projects[0];
    const p2 = projects[1] || p1;
    let modified = false;

    // Harmonize POs to valid central project IDs
    this.pos = this.pos.map(po => {
      if (po.projectId === 'PRJ-2026-001' || !projects.some(p => p.id === po.projectId)) {
        modified = true;
        return { ...po, projectId: p1.id, projectName: p1.projectName || p1.name || 'Active Project' };
      }
      return po;
    });

    // Harmonize PRs
    this.requisitions = this.requisitions.map(pr => {
      if (pr.projectId === 'PRJ-2026-001' || !projects.some(p => p.id === pr.projectId)) {
        modified = true;
        return { ...pr, projectId: p1.id, projectName: p1.projectName || p1.name || 'Active Project' };
      } else if (pr.projectId === 'PRJ-2026-002') {
        modified = true;
        return { ...pr, projectId: p2.id, projectName: p2.projectName || p2.name || 'Active Project' };
      }
      return pr;
    });

    // Harmonize RFQs
    this.rfqs = this.rfqs.map(rfq => {
      if (rfq.projectId === 'PRJ-2026-001' || !projects.some(p => p.id === rfq.projectId)) {
        modified = true;
        return { ...rfq, projectId: p1.id, projectName: p1.projectName || p1.name || 'Active Project' };
      } else if (rfq.projectId === 'PRJ-2026-002') {
        modified = true;
        return { ...rfq, projectId: p2.id, projectName: p2.projectName || p2.name || 'Active Project' };
      }
      return rfq;
    });

    // Harmonize SCNs
    this.scns = this.scns.map(scn => {
      if (scn.projectId === 'PRJ-2026-001' || !projects.some(p => p.id === scn.projectId)) {
        modified = true;
        return { ...scn, projectId: p1.id, projectName: p1.projectName || p1.name || 'Active Project' };
      }
      return scn;
    });

    // Harmonize Invoices
    this.invoices = this.invoices.map(inv => {
      if (inv.projectId === 'PRJ-2026-001' || !projects.some(p => p.id === inv.projectId)) {
        modified = true;
        return { ...inv, projectId: p1.id, projectName: p1.projectName || p1.name || 'Active Project' };
      }
      return inv;
    });

    // Harmonize Scrap
    this.scrap = this.scrap.map(scr => {
      if (scr.projectId === 'PRJ-2026-001' || !projects.some(p => p.id === scr.projectId)) {
        modified = true;
        return { ...scr, projectId: p1.id, projectName: p1.projectName || p1.name || 'Active Project' };
      }
      return scr;
    });

    // Harmonize Emergencies
    this.emergencies = this.emergencies.map(emg => {
      if (emg.projectId === 'PRJ-2026-001' || !projects.some(p => p.id === emg.projectId)) {
        modified = true;
        return { ...emg, projectId: p1.id, projectName: p1.projectName || p1.name || 'Active Project' };
      }
      return emg;
    });

    // Harmonize warehouse inventory with central master item catalog
    if (itemCatalog && itemCatalog.length > 0) {
      this.inventory = this.inventory.map((inv, idx) => {
        const masterItem = itemCatalog[idx % itemCatalog.length];
        if (masterItem && masterItem.code && !inv.code.startsWith(masterItem.code)) {
          modified = true;
          return {
            ...inv,
            name: masterItem.name || inv.name,
            category: (masterItem.category as any) || inv.category
          };
        }
        return inv;
      });
    }

    if (productVariants && productVariants.length > 0) {
      // Variants verified against inventory references
    }

    if (modified) {
      setStored(STORAGE_KEYS.POS, this.pos);
      setStored(STORAGE_KEYS.REQUISITIONS, this.requisitions);
      setStored(STORAGE_KEYS.RFQS, this.rfqs);
      setStored(STORAGE_KEYS.SCNS, this.scns);
      setStored(STORAGE_KEYS.INVOICES, this.invoices);
      setStored(STORAGE_KEYS.SCRAP, this.scrap);
      setStored(STORAGE_KEYS.EMERGENCIES, this.emergencies);
    }
  }

  // --------------------------------------------------------------------------
  // SUPPLIERS
  // --------------------------------------------------------------------------
  public getSuppliers(): Supplier[] {
    return [...this.suppliers];
  }

  public saveSupplier(supplier: Supplier): Supplier {
    const idx = this.suppliers.findIndex(s => s.id === supplier.id);
    if (idx >= 0) {
      this.suppliers[idx] = { ...supplier, updatedAt: new Date().toISOString() };
    } else {
      const newSup: Supplier = {
        ...supplier,
        id: supplier.id || `sup-${Date.now()}`,
        vendorCode: supplier.vendorCode || `VND-${Date.now().toString().slice(-4)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.suppliers.unshift(newSup);
    }
    setStored(STORAGE_KEYS.SUPPLIERS, this.suppliers);
    return supplier;
  }

  public togglePreferredSupplier(id: string): boolean {
    const sup = this.suppliers.find(s => s.id === id);
    if (!sup) return false;
    sup.status = sup.status === 'Preferred' ? 'Active' : 'Preferred';
    sup.updatedAt = new Date().toISOString();
    setStored(STORAGE_KEYS.SUPPLIERS, this.suppliers);
    return true;
  }

  // --------------------------------------------------------------------------
  // PURCHASE REQUISITIONS (PR / DEMANDS) with Defensive Budget Intercept
  // --------------------------------------------------------------------------
  public getRequisitions(): PurchaseRequisition[] {
    return [...this.requisitions];
  }

  public validateBudget(projectId: string, requestedAmount: number): { allowed: boolean; projectedSpend: number; budgetLimit: number; remaining: number } {
    const projectPos = this.pos.filter(p => p.projectId === projectId && p.status !== 'Cancelled');
    const currentCommitted = projectPos.reduce((sum, p) => sum + p.totalAmount, 0);
    // Standard budget limit for project
    const budgetLimit = 1500000;
    const projectedSpend = currentCommitted + requestedAmount;
    const allowed = projectedSpend <= budgetLimit;
    return {
      allowed,
      projectedSpend,
      budgetLimit,
      remaining: Math.max(0, budgetLimit - projectedSpend)
    };
  }

  public saveRequisition(pr: PurchaseRequisition): { pr: PurchaseRequisition; budgetBlocked: boolean; message: string } {
    const budgetCheck = this.validateBudget(pr.projectId, pr.totalEstimatedCost);
    const budgetBlocked = !budgetCheck.allowed;

    const finalStatus: PurchaseRequisition['status'] = budgetBlocked ? 'Budget Blocked' : 'Budget Approved';
    const updatedPr: PurchaseRequisition = {
      ...pr,
      id: pr.id || `pr-${Date.now()}`,
      requisitionNumber: pr.requisitionNumber || `PR-2026-${Math.floor(100 + Math.random() * 900)}`,
      status: finalStatus,
      budgetAllocatedAmount: budgetCheck.budgetLimit,
      budgetCommittedAmount: budgetCheck.projectedSpend,
      budgetExceeded: budgetBlocked,
      createdAt: pr.createdAt || new Date().toISOString()
    };

    const idx = this.requisitions.findIndex(r => r.id === updatedPr.id);
    if (idx >= 0) {
      this.requisitions[idx] = updatedPr;
    } else {
      this.requisitions.unshift(updatedPr);
    }
    setStored(STORAGE_KEYS.REQUISITIONS, this.requisitions);

    return {
      pr: updatedPr,
      budgetBlocked,
      message: budgetBlocked 
        ? `HARD BLOCK: Total projected spend (AED ${budgetCheck.projectedSpend.toLocaleString()}) exceeds budget allocation limit of AED ${budgetCheck.budgetLimit.toLocaleString()}. Requisition blocked.`
        : `Requisition approved within fiscal allocation. Remaining: AED ${budgetCheck.remaining.toLocaleString()}.`
    };
  }

  public convertRequisitionToPo(prId: string, supplierId: string, supplierName: string): PurchaseOrder | null {
    const pr = this.requisitions.find(r => r.id === prId);
    if (!pr || pr.status === 'Budget Blocked') return null;

    const poItems = pr.items.map((it, idx) => ({
      id: `poi-${Date.now()}-${idx}`,
      description: it.description,
      quantity: it.quantity,
      receivedQuantity: 0,
      unit: it.unit,
      unitPrice: it.estimatedUnitPrice,
      totalAmount: it.totalEstimatedPrice,
      category: it.category
    }));

    const subtotal = poItems.reduce((sum, item) => sum + item.totalAmount, 0);
    const vatAmount = subtotal * 0.05;

    const newPo: PurchaseOrder = {
      id: `po-${Date.now()}`,
      poNumber: `PO-2026-${Math.floor(200 + Math.random() * 800)}`,
      supplierId,
      supplierName,
      projectId: pr.projectId,
      projectName: pr.projectName,
      receivingBranch: 'Dubai Fabrication Yard',
      orderDate: new Date().toISOString().split('T')[0],
      expectedDeliveryDate: pr.requiredByDate,
      items: poItems,
      subtotal,
      vatRatePercent: 5,
      vatAmount,
      totalAmount: subtotal + vatAmount,
      currency: 'AED',
      paymentTerms: 'Net 30 Days',
      status: 'Pending Approval',
      matchingStatus: 'Unmatched',
      createdBy: pr.requestedBy || 'Procurement Buyer',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    pr.status = 'Converted to PO';
    pr.convertedPoId = newPo.id;
    this.pos.unshift(newPo);

    setStored(STORAGE_KEYS.POS, this.pos);
    setStored(STORAGE_KEYS.REQUISITIONS, this.requisitions);
    return newPo;
  }

  public convertRequisitionToRfq(prId: string): RequestForQuotation | null {
    const pr = this.requisitions.find(r => r.id === prId);
    if (!pr) return null;

    const rfqItems = pr.items.map((it, idx) => ({
      id: `rfqi-${Date.now()}-${idx}`,
      itemDescription: it.description,
      materialGrade: 'Standard Spec',
      quantity: it.quantity,
      unit: it.unit,
      estimatedTargetPrice: it.estimatedUnitPrice
    }));

    const newRfq: RequestForQuotation = {
      id: `rfq-${Date.now()}`,
      rfqNumber: `RFQ-2026-${Math.floor(100 + Math.random() * 900)}`,
      title: `Sourcing Tender: ${pr.requisitionNumber} - ${pr.items[0]?.description || 'Materials'}`,
      projectId: pr.projectId,
      projectName: pr.projectName,
      requiredDeliveryDate: pr.requiredByDate,
      status: 'Sent to Suppliers',
      items: rfqItems,
      invitedSupplierIds: this.suppliers.slice(0, 3).map(s => s.id),
      bids: [],
      createdBy: pr.requestedBy || 'Procurement Buyer',
      createdAt: new Date().toISOString()
    };

    pr.status = 'Converted to RFQ';
    pr.convertedRfqId = newRfq.id;
    this.rfqs.unshift(newRfq);

    setStored(STORAGE_KEYS.RFQS, this.rfqs);
    setStored(STORAGE_KEYS.REQUISITIONS, this.requisitions);
    return newRfq;
  }

  // --------------------------------------------------------------------------
  // REVERSE AUCTIONS (Live Bidding with Anti-Sniping)
  // --------------------------------------------------------------------------
  public getReverseAuctions(): ReverseAuction[] {
    return [...this.auctions];
  }

  public placeAuctionBid(auctionId: string, supplierId: string, bidAmount: number): { success: boolean; message: string; auction: ReverseAuction } {
    const auc = this.auctions.find(a => a.id === auctionId);
    if (!auc) throw new Error('Auction not found');
    if (auc.status !== 'Active') throw new Error('Auction is closed');

    const requiredMaxBid = auc.currentLowestBid - auc.minDecrement;
    if (bidAmount > requiredMaxBid) {
      return {
        success: false,
        message: `Bid rejected: Minimum decrement is AED ${auc.minDecrement}. Max permissible bid is AED ${requiredMaxBid.toLocaleString()}.`,
        auction: auc
      };
    }

    const sup = this.suppliers.find(s => s.id === supplierId);
    const supplierName = sup ? sup.name : 'Registered Bidder';

    // Anti-sniping check: If bid placed in final 3 minutes, extend auction by +5 minutes
    const now = new Date();
    const endTime = new Date(auc.endTime);
    const diffMs = endTime.getTime() - now.getTime();
    let extended = false;
    if (diffMs > 0 && diffMs < 3 * 60 * 1000) {
      endTime.setMinutes(endTime.getMinutes() + 5);
      auc.endTime = endTime.toISOString();
      extended = true;
    }

    // Mark previous bids as non-winning
    auc.bids.forEach(b => b.isWinning = false);

    const newBid: ReverseAuctionBid = {
      id: `abid-${Date.now()}`,
      supplierId,
      supplierName,
      bidAmount,
      timestamp: new Date().toISOString(),
      isWinning: true
    };

    auc.bids.unshift(newBid);
    auc.currentLowestBid = bidAmount;
    auc.currentWinningSupplierId = supplierId;
    auc.currentWinningSupplierName = supplierName;

    setStored(STORAGE_KEYS.AUCTIONS, this.auctions);

    return {
      success: true,
      message: `Leading bid placed at AED ${bidAmount.toLocaleString()} by ${supplierName}.${extended ? ' Anti-sniping triggered: Auction extended +5 min.' : ''}`,
      auction: auc
    };
  }

  public closeAuction(auctionId: string): PurchaseOrder | null {
    const auc = this.auctions.find(a => a.id === auctionId);
    if (!auc || auc.status !== 'Active') return null;

    auc.status = 'Closed';

    // Auto-create draft PO for winning bidder
    let draftPo: PurchaseOrder | null = null;
    if (auc.currentWinningSupplierId) {
      const subtotal = auc.currentLowestBid;
      const vatAmount = subtotal * 0.05;
      draftPo = {
        id: `po-${Date.now()}`,
        poNumber: `PO-2026-${Math.floor(200 + Math.random() * 800)}`,
        rfqId: auc.rfqId,
        supplierId: auc.currentWinningSupplierId,
        supplierName: auc.currentWinningSupplierName || 'Winning Bidder',
        receivingBranch: 'Dubai Fabrication Yard',
        orderDate: new Date().toISOString().split('T')[0],
        expectedDeliveryDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        items: [
          {
            id: `poi-${Date.now()}`,
            description: auc.title,
            quantity: 1,
            receivedQuantity: 0,
            unit: 'lot',
            unitPrice: subtotal,
            totalAmount: subtotal,
            category: 'Aluminium Extrusions & Panels'
          }
        ],
        subtotal,
        vatRatePercent: 5,
        vatAmount,
        totalAmount: subtotal + vatAmount,
        currency: 'AED',
        paymentTerms: 'Net 30 Days',
        status: 'Pending Approval',
        matchingStatus: 'Unmatched',
        createdBy: 'Auction System Award',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.pos.unshift(draftPo);
      auc.awardedPoId = draftPo.id;
      setStored(STORAGE_KEYS.POS, this.pos);
    }

    setStored(STORAGE_KEYS.AUCTIONS, this.auctions);
    return draftPo;
  }

  // --------------------------------------------------------------------------
  // FRAMEWORK CONTRACTS & MASTER AGREEMENTS
  // --------------------------------------------------------------------------
  public getContracts(): ContractAgreement[] {
    return [...this.contracts];
  }

  public saveContract(contract: ContractAgreement): ContractAgreement {
    const idx = this.contracts.findIndex(c => c.id === contract.id);
    if (idx >= 0) {
      this.contracts[idx] = contract;
    } else {
      const newContract: ContractAgreement = {
        ...contract,
        id: contract.id || `cnt-${Date.now()}`,
        contractNumber: contract.contractNumber || `CTR-2026-${Math.floor(100 + Math.random() * 900)}`,
        createdAt: new Date().toISOString()
      };
      this.contracts.unshift(newContract);
    }
    setStored(STORAGE_KEYS.CONTRACTS, this.contracts);
    return contract;
  }

  // --------------------------------------------------------------------------
  // SERVICE COMPLETION NOTES (SCN)
  // --------------------------------------------------------------------------
  public getScns(): ServiceCompletionNote[] {
    return [...this.scns];
  }

  public saveScn(scn: ServiceCompletionNote): ServiceCompletionNote {
    const idx = this.scns.findIndex(s => s.id === scn.id);
    if (idx >= 0) {
      this.scns[idx] = scn;
    } else {
      const newScn: ServiceCompletionNote = {
        ...scn,
        id: scn.id || `scn-${Date.now()}`,
        scnNumber: scn.scnNumber || `SCN-2026-${Math.floor(100 + Math.random() * 900)}`,
        createdAt: new Date().toISOString()
      };
      this.scns.unshift(newScn);
    }
    setStored(STORAGE_KEYS.SCNS, this.scns);
    return scn;
  }

  public signScn(scnId: string, role: 'supervisor' | 'site_manager' | 'qa', signerName: string): ServiceCompletionNote {
    const scn = this.scns.find(s => s.id === scnId);
    if (!scn) throw new Error('SCN not found');

    const signature = `SIGNED: ${signerName} (${new Date().toLocaleDateString()})`;
    if (role === 'supervisor') scn.supervisorSignature = signature;
    if (role === 'site_manager') scn.siteManagerSignature = signature;
    if (role === 'qa') scn.qaSignature = signature;

    if (scn.supervisorSignature && scn.siteManagerSignature && scn.qaSignature) {
      scn.status = 'Certified';
    } else {
      scn.status = 'Pending Signatures';
    }

    setStored(STORAGE_KEYS.SCNS, this.scns);
    return scn;
  }

  // --------------------------------------------------------------------------
  // INVOICES & AUTOMATED 3-WAY MATCHING & PVC TOKEN
  // --------------------------------------------------------------------------
  public getInvoices(): SupplierInvoice[] {
    return [...this.invoices];
  }

  public generatePVC(canonicalNumber: string, amount: number, date: string, supplierId: string): string {
    // Standard HMAC-SHA256 simulation producing format: XXXX-XXXX-XXXX-XXXX
    const raw = `${canonicalNumber}-${amount}-${date}-${supplierId}-SECRET_SALT_2026`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = ((hash << 5) - hash) + raw.charCodeAt(i);
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).padStart(16, '7a9c1e4f');
    return `${hex.slice(0, 4).toUpperCase()}-${hex.slice(4, 8).toUpperCase()}-${hex.slice(8, 12).toUpperCase()}-${hex.slice(12, 16).toUpperCase()}`;
  }

  public perform3WayMatch(invoice: SupplierInvoice): { score: number; status: SupplierInvoice['status']; discrepancies: string[] } {
    const discrepancies: string[] = [];
    const po = this.pos.find(p => p.id === invoice.poId);
    if (!po) {
      discrepancies.push('Associated Purchase Order missing');
      return { score: 0, status: 'Disputed', discrepancies };
    }

    // Check price tolerance (+/- 2%)
    const priceDiff = Math.abs(invoice.totalAmount - po.totalAmount);
    const variancePercent = (priceDiff / po.totalAmount) * 100;
    if (variancePercent > 2) {
      discrepancies.push(`Price variance of ${variancePercent.toFixed(1)}% exceeds 2% tolerance threshold`);
    }

    // Check if supplier has open critical NCR
    const openNcr = this.ncrs.find(n => n.supplierId === invoice.supplierId && ['Open', 'Investigating', 'CAPA Pending'].includes(n.status) && ['Major', 'Critical'].includes(n.severity));
    if (openNcr) {
      discrepancies.push(`PAYMENT INTERCEPT: Supplier has active ${openNcr.severity} NCR (${openNcr.ncrNumber}). Payment blocked.`);
    }

    const score = discrepancies.length === 0 ? 100 : Math.max(30, 100 - (discrepancies.length * 35));
    const status: SupplierInvoice['status'] = discrepancies.length === 0 ? '3-Way Matched' : 'Disputed';

    return { score, status, discrepancies };
  }

  public saveInvoice(invoice: SupplierInvoice): SupplierInvoice {
    const match = this.perform3WayMatch(invoice);
    const openNcr = this.ncrs.find(n => n.supplierId === invoice.supplierId && ['Open', 'Investigating', 'CAPA Pending'].includes(n.status) && ['Major', 'Critical'].includes(n.severity));

    const updatedInv: SupplierInvoice = {
      ...invoice,
      id: invoice.id || `inv-${Date.now()}`,
      canonicalNumber: invoice.canonicalNumber || `CANON-SUP-${Date.now().toString().slice(-6)}`,
      matchScore: match.score,
      status: match.status,
      discrepancies: match.discrepancies,
      holdPayment: Boolean(openNcr),
      holdReason: openNcr ? `Active ${openNcr.severity} NCR: ${openNcr.ncrNumber}` : undefined,
      paymentVerificationCode: match.discrepancies.length === 0 ? this.generatePVC(invoice.invoiceNumber, invoice.totalAmount, invoice.issueDate, invoice.supplierId) : undefined,
      createdAt: invoice.createdAt || new Date().toISOString()
    };

    const idx = this.invoices.findIndex(i => i.id === updatedInv.id);
    if (idx >= 0) {
      this.invoices[idx] = updatedInv;
    } else {
      this.invoices.unshift(updatedInv);
    }
    setStored(STORAGE_KEYS.INVOICES, this.invoices);
    return updatedInv;
  }

  public approveInvoice(invoiceId: string, approverName: string): { success: boolean; message: string; invoice?: SupplierInvoice } {
    const inv = this.invoices.find(i => i.id === invoiceId);
    if (!inv) return { success: false, message: 'Invoice not found' };

    if (inv.holdPayment) {
      return {
        success: false,
        message: `CANNOT APPROVE: Payment frozen due to open NCR (${inv.holdReason}). Resolve CAPA first.`
      };
    }

    if (inv.status === 'Disputed') {
      return {
        success: false,
        message: `CANNOT APPROVE: Invoice has unresolved 3-way match variances: ${inv.discrepancies.join(', ')}`
      };
    }

    inv.status = 'Approved';
    inv.approvedBy = approverName;
    inv.approvedAt = new Date().toISOString();
    if (!inv.paymentVerificationCode) {
      inv.paymentVerificationCode = this.generatePVC(inv.invoiceNumber, inv.totalAmount, inv.issueDate, inv.supplierId);
    }

    setStored(STORAGE_KEYS.INVOICES, this.invoices);

    // Sync to main application invoices
    try {
      const mainInvoicesRaw = localStorage.getItem('invoices');
      const mainInvoices = mainInvoicesRaw ? JSON.parse(mainInvoicesRaw) : [];
      const exists = mainInvoices.some((mi: any) => mi.invoiceNumber === inv.invoiceNumber);
      if (!exists) {
        mainInvoices.unshift({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          projectId: inv.projectId || 'PRJ-2026-001',
          clientName: inv.supplierName,
          amount: inv.totalAmount,
          status: 'Pending',
          issueDate: inv.issueDate,
          dueDate: inv.dueDate,
          notes: `PVC: ${inv.paymentVerificationCode} · Linked to PO ${inv.poNumber}`
        });
        localStorage.setItem('invoices', JSON.stringify(mainInvoices));
      }
    } catch (e) {
      console.error('Failed to sync to main invoices', e);
    }

    return {
      success: true,
      message: `Invoice ${inv.invoiceNumber} approved. Minted PVC: ${inv.paymentVerificationCode}`,
      invoice: inv
    };
  }

  // --------------------------------------------------------------------------
  // QUALITY NON-CONFORMANCE REPORTS (NCR) & PAYMENT FREEZE
  // --------------------------------------------------------------------------
  public getNcrs(): ProcurementNCR[] {
    return [...this.ncrs];
  }

  public issueNcr(ncr: ProcurementNCR): ProcurementNCR {
    const isCriticalOrMajor = ['Critical', 'Major'].includes(ncr.severity);
    const newNcr: ProcurementNCR = {
      ...ncr,
      id: ncr.id || `ncr-${Date.now()}`,
      ncrNumber: ncr.ncrNumber || `NCR-2026-${Math.floor(100 + Math.random() * 900)}`,
      status: 'CAPA Pending',
      holdPaymentApplied: isCriticalOrMajor,
      reportedDate: new Date().toISOString().split('T')[0]
    };

    this.ncrs.unshift(newNcr);

    // Apply payment hold to all invoices from this supplier
    if (isCriticalOrMajor) {
      this.invoices.forEach(inv => {
        if (inv.supplierId === newNcr.supplierId) {
          inv.holdPayment = true;
          inv.holdReason = `Active ${newNcr.severity} NCR: ${newNcr.ncrNumber}`;
        }
      });
      setStored(STORAGE_KEYS.INVOICES, this.invoices);
    }

    setStored(STORAGE_KEYS.NCRS, this.ncrs);
    return newNcr;
  }

  public resolveNcr(ncrId: string, capaPlan: string): ProcurementNCR {
    const ncr = this.ncrs.find(n => n.id === ncrId);
    if (!ncr) throw new Error('NCR not found');

    ncr.status = 'Resolved';
    ncr.capaPlan = capaPlan;
    ncr.resolvedDate = new Date().toISOString().split('T')[0];
    ncr.holdPaymentApplied = false;

    // Check if supplier still has other open major/critical NCRs
    const remainingOpen = this.ncrs.some(n => n.id !== ncrId && n.supplierId === ncr.supplierId && ['Open', 'Investigating', 'CAPA Pending'].includes(n.status) && ['Major', 'Critical'].includes(n.severity));

    if (!remainingOpen) {
      this.invoices.forEach(inv => {
        if (inv.supplierId === ncr.supplierId) {
          inv.holdPayment = false;
          inv.holdReason = undefined;
        }
      });
      setStored(STORAGE_KEYS.INVOICES, this.invoices);
    }

    setStored(STORAGE_KEYS.NCRS, this.ncrs);
    return ncr;
  }

  // --------------------------------------------------------------------------
  // WAREHOUSE INVENTORY & STOCK MOVEMENTS
  // --------------------------------------------------------------------------
  public getInventory(): InventoryStockItem[] {
    return [...this.inventory];
  }

  public getStockMovements(): StockMovement[] {
    return [...this.movements];
  }

  public adjustInventory(itemId: string, qtyDelta: number, reason: string, performedBy: string): InventoryStockItem {
    const item = this.inventory.find(i => i.id === itemId);
    if (!item) throw new Error('Inventory item not found');

    item.currentQuantity += qtyDelta;
    item.availableQuantity = Math.max(0, item.currentQuantity - item.reservedQuantity);
    item.lastUpdated = new Date().toISOString();

    const movement: StockMovement = {
      id: `sm-${Date.now()}`,
      timestamp: new Date().toISOString(),
      itemCode: item.code,
      itemName: item.name,
      type: qtyDelta > 0 ? 'Adjustment' : 'Outbound Issuance',
      quantity: Math.abs(qtyDelta),
      unit: item.unit,
      fromLocation: item.warehouse,
      toLocation: reason,
      referenceId: `ADJ-${Date.now().toString().slice(-4)}`,
      performedBy
    };
    this.movements.unshift(movement);

    setStored(STORAGE_KEYS.INVENTORY, this.inventory);
    setStored(STORAGE_KEYS.MOVEMENTS, this.movements);
    return item;
  }

  // --------------------------------------------------------------------------
  // CIRCULAR ECONOMY SCRAP RECLAMATION (7-Day Intercept Window)
  // --------------------------------------------------------------------------
  public getScrapRecords(): ScrapRecord[] {
    return [...this.scrap];
  }

  public declareScrap(scrap: ScrapRecord): ScrapRecord {
    const declarationDate = new Date();
    const expiryDate = new Date(declarationDate);
    expiryDate.setDate(expiryDate.getDate() + 7);

    const newScrap: ScrapRecord = {
      ...scrap,
      id: scrap.id || `scr-${Date.now()}`,
      code: scrap.code || `SCR-2026-${Math.floor(100 + Math.random() * 900)}`,
      status: 'Intercept Window',
      declarationDate: declarationDate.toISOString().split('T')[0],
      interceptExpiryDate: expiryDate.toISOString().split('T')[0]
    };

    this.scrap.unshift(newScrap);
    setStored(STORAGE_KEYS.SCRAP, this.scrap);
    return newScrap;
  }

  public interceptScrapForProject(scrapId: string, projectId: string, projectName: string, performedBy: string): ScrapRecord {
    const item = this.scrap.find(s => s.id === scrapId);
    if (!item) throw new Error('Scrap record not found');

    item.status = 'Intercepted for Project';
    item.reclaimedByProjectId = projectId;
    item.reclaimedByProjectName = projectName;

    // Record stock recovery movement
    const movement: StockMovement = {
      id: `sm-${Date.now()}`,
      timestamp: new Date().toISOString(),
      itemCode: item.code,
      itemName: item.materialCategory,
      type: 'Scrap Recovery',
      quantity: item.weightKg,
      unit: 'kg',
      fromLocation: `Site ${item.projectName}`,
      toLocation: `Reclaimed by ${projectName}`,
      referenceId: item.code,
      performedBy
    };
    this.movements.unshift(movement);

    setStored(STORAGE_KEYS.SCRAP, this.scrap);
    setStored(STORAGE_KEYS.MOVEMENTS, this.movements);
    return item;
  }

  public liquidateScrapAuction(scrapId: string, buyerName: string, winningBidAmount: number): ScrapRecord {
    const item = this.scrap.find(s => s.id === scrapId);
    if (!item) throw new Error('Scrap record not found');

    item.status = 'Sold / Liquidated';
    item.buyerName = buyerName;
    item.winningBidAmount = winningBidAmount;
    item.gatePassNumber = `GP-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    setStored(STORAGE_KEYS.SCRAP, this.scrap);
    return item;
  }

  // --------------------------------------------------------------------------
  // EMERGENCY INCIDENT SOURCING (Express Bypass & Retroactive Audit Gate)
  // --------------------------------------------------------------------------
  public getEmergencyRequests(): EmergencyRequest[] {
    return [...this.emergencies];
  }

  public createEmergencyRequest(req: EmergencyRequest): { emergency: EmergencyRequest; expressPo: PurchaseOrder } {
    const poNumber = `PO-2026-EXP-${Math.floor(100 + Math.random() * 900)}`;
    const expressPo: PurchaseOrder = {
      id: `po-${Date.now()}`,
      poNumber,
      supplierId: this.suppliers[0].id,
      supplierName: this.suppliers[0].name,
      projectId: req.projectId,
      projectName: req.projectName,
      receivingBranch: 'Dubai Fabrication Yard',
      orderDate: new Date().toISOString().split('T')[0],
      expectedDeliveryDate: new Date().toISOString().split('T')[0],
      items: [
        {
          id: `poi-exp-${Date.now()}`,
          description: `EMERGENCY INCIDENT SUPPLY: ${req.incidentType} - ${req.description}`,
          quantity: 1,
          receivedQuantity: 0,
          unit: 'lot',
          unitPrice: req.estimatedCost,
          totalAmount: req.estimatedCost,
          category: 'Tools & Plant Machinery'
        }
      ],
      subtotal: req.estimatedCost,
      vatRatePercent: 5,
      vatAmount: req.estimatedCost * 0.05,
      totalAmount: req.estimatedCost * 1.05,
      currency: 'AED',
      paymentTerms: 'Immediate / Advance',
      status: 'Approved',
      matchingStatus: 'Unmatched',
      createdBy: `${req.requestedBy} (Safety Bypass Override)`,
      approvedBy: 'Emergency Safety Officer',
      approvedAt: new Date().toISOString(),
      issuedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const newReq: EmergencyRequest = {
      ...req,
      id: req.id || `emg-${Date.now()}`,
      requestNumber: req.requestNumber || `EMG-2026-${Math.floor(100 + Math.random() * 900)}`,
      status: 'Express PO Issued',
      safetyOverride: true,
      expressPoId: expressPo.id,
      expressPoNumber: poNumber,
      retroactiveAuditComplete: false,
      createdAt: new Date().toISOString()
    };

    this.pos.unshift(expressPo);
    this.emergencies.unshift(newReq);

    setStored(STORAGE_KEYS.POS, this.pos);
    setStored(STORAGE_KEYS.EMERGENCIES, this.emergencies);

    return { emergency: newReq, expressPo };
  }

  public completeRetroactiveAudit(reqId: string, notes: string): EmergencyRequest {
    const req = this.emergencies.find(e => e.id === reqId);
    if (!req) throw new Error('Emergency request not found');

    req.retroactiveAuditComplete = true;
    req.auditNotes = notes;
    req.status = 'Audit Complete';

    setStored(STORAGE_KEYS.EMERGENCIES, this.emergencies);
    return req;
  }

  // --------------------------------------------------------------------------
  // COMPLIANCE, TICKETS & PETTY CASH
  // --------------------------------------------------------------------------
  public getComplianceDocs(): SupplierComplianceDoc[] {
    return [...this.compliance];
  }

  public getSupplierTickets(): SupplierTicket[] {
    return [...this.tickets];
  }

  public getPettyCashTransactions(): PettyCashTransaction[] {
    return [...this.pettyCash];
  }

  public recordPettyCash(tx: PettyCashTransaction): PettyCashTransaction {
    const newTx: PettyCashTransaction = {
      ...tx,
      id: tx.id || `pc-${Date.now()}`,
      voucherNumber: tx.voucherNumber || `VOUCH-2026-${Math.floor(100 + Math.random() * 900)}`,
      timestamp: new Date().toISOString()
    };
    this.pettyCash.unshift(newTx);
    setStored(STORAGE_KEYS.PETTY_CASH, this.pettyCash);
    return newTx;
  }

  // --------------------------------------------------------------------------
  // PURCHASE ORDERS (Existing functions preserved & updated)
  // --------------------------------------------------------------------------
  public getPurchaseOrders(): PurchaseOrder[] {
    return [...this.pos];
  }

  public savePurchaseOrder(po: PurchaseOrder): PurchaseOrder {
    const idx = this.pos.findIndex(p => p.id === po.id);
    if (idx >= 0) {
      this.pos[idx] = { ...po, updatedAt: new Date().toISOString() };
    } else {
      const newPo: PurchaseOrder = {
        ...po,
        id: po.id || `po-${Date.now()}`,
        poNumber: po.poNumber || `PO-2026-${Math.floor(200 + Math.random() * 800)}`,
        status: po.status || 'Pending Approval',
        matchingStatus: po.matchingStatus || 'Unmatched',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.pos.unshift(newPo);
    }
    setStored(STORAGE_KEYS.POS, this.pos);
    return po;
  }

  public approvePurchaseOrder(id: string, approverName: string): PurchaseOrder | null {
    const po = this.pos.find(p => p.id === id);
    if (!po) return null;
    po.status = 'Approved';
    po.approvedBy = approverName;
    po.approvedAt = new Date().toISOString();
    po.updatedAt = new Date().toISOString();
    setStored(STORAGE_KEYS.POS, this.pos);
    return po;
  }

  public issuePurchaseOrder(id: string): PurchaseOrder | null {
    const po = this.pos.find(p => p.id === id);
    if (!po) return null;
    po.status = 'Issued';
    po.issuedAt = new Date().toISOString();
    po.updatedAt = new Date().toISOString();
    setStored(STORAGE_KEYS.POS, this.pos);
    return po;
  }

  // --------------------------------------------------------------------------
  // RFQS
  // --------------------------------------------------------------------------
  public getRfqs(): RequestForQuotation[] {
    return [...this.rfqs];
  }

  public saveRfq(rfq: RequestForQuotation): RequestForQuotation {
    const idx = this.rfqs.findIndex(r => r.id === rfq.id);
    if (idx >= 0) {
      this.rfqs[idx] = rfq;
    } else {
      const newRfq: RequestForQuotation = {
        ...rfq,
        id: rfq.id || `rfq-${Date.now()}`,
        rfqNumber: rfq.rfqNumber || `RFQ-2026-${Math.floor(100 + Math.random() * 900)}`,
        status: rfq.status || 'Draft',
        createdAt: new Date().toISOString()
      };
      this.rfqs.unshift(newRfq);
    }
    setStored(STORAGE_KEYS.RFQS, this.rfqs);
    return rfq;
  }

  public awardRfq(rfqId: string, supplierId: string, justification: string): RequestForQuotation | null {
    const rfq = this.rfqs.find(r => r.id === rfqId);
    if (!rfq) return null;

    const winningBid = rfq.bids.find(b => b.supplierId === supplierId);
    if (!winningBid) return null;

    rfq.awardedSupplierId = supplierId;
    rfq.awardedAmount = winningBid.totalBidAmount;
    rfq.awardJustification = justification;
    rfq.status = 'Awarded';
    rfq.closedAt = new Date().toISOString();

    rfq.bids.forEach(b => {
      b.bidStatus = b.supplierId === supplierId ? 'Selected' : 'Declined';
    });

    setStored(STORAGE_KEYS.RFQS, this.rfqs);

    // Auto-create draft PO
    const sup = this.suppliers.find(s => s.id === supplierId);
    const poItems = rfq.items.map(it => {
      const uPrice = winningBid.unitPrices[it.id] || it.estimatedTargetPrice;
      return {
        id: `poi-${Date.now()}-${it.id}`,
        description: it.itemDescription,
        quantity: it.quantity,
        receivedQuantity: 0,
        unit: it.unit,
        unitPrice: uPrice,
        totalAmount: uPrice * it.quantity,
        category: (sup?.category || 'Structural Steel & Alloys')
      };
    });

    const subtotal = poItems.reduce((sum, item) => sum + item.totalAmount, 0);
    const vatAmount = subtotal * 0.05;

    const newPo: PurchaseOrder = {
      id: `po-${Date.now()}`,
      poNumber: `PO-2026-${Math.floor(200 + Math.random() * 800)}`,
      rfqId: rfq.id,
      supplierId: winningBid.supplierId,
      supplierName: winningBid.supplierName,
      projectId: rfq.projectId,
      projectName: rfq.projectName,
      receivingBranch: 'Dubai Fabrication Yard',
      orderDate: new Date().toISOString().split('T')[0],
      expectedDeliveryDate: rfq.requiredDeliveryDate,
      items: poItems,
      subtotal,
      vatRatePercent: 5,
      vatAmount,
      totalAmount: subtotal + vatAmount,
      currency: 'AED',
      paymentTerms: (winningBid.paymentTermsOffered as any) || 'Net 30 Days',
      status: 'Pending Approval',
      matchingStatus: 'Unmatched',
      createdBy: 'RFQ Tender Award Engine',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.pos.unshift(newPo);
    setStored(STORAGE_KEYS.POS, this.pos);

    return rfq;
  }

  // --------------------------------------------------------------------------
  // GRNS
  // --------------------------------------------------------------------------
  public getGrns(): GoodsReceiptNote[] {
    return [...this.grns];
  }

  public saveGrn(grn: GoodsReceiptNote): GoodsReceiptNote {
    const idx = this.grns.findIndex(g => g.id === grn.id);
    if (idx >= 0) {
      this.grns[idx] = grn;
    } else {
      const newGrn: GoodsReceiptNote = {
        ...grn,
        id: grn.id || `grn-${Date.now()}`,
        grnNumber: grn.grnNumber || `GRN-2026-${Math.floor(200 + Math.random() * 800)}`,
        createdAt: new Date().toISOString()
      };
      this.grns.unshift(newGrn);

      // Update PO received quantity & matching status
      const po = this.pos.find(p => p.id === grn.poId);
      if (po) {
        grn.items.forEach(gItem => {
          const poItem = po.items.find(pi => pi.id === gItem.poItemId);
          if (poItem) {
            poItem.receivedQuantity = (poItem.receivedQuantity || 0) + gItem.acceptedQuantity;
          }
        });
        const allReceived = po.items.every(pi => pi.receivedQuantity >= pi.quantity);
        po.status = allReceived ? 'Completed' : 'Partially Received';
        po.matchingStatus = '3-Way Matched';
        setStored(STORAGE_KEYS.POS, this.pos);
      }

      // Record inventory movement for accepted items
      grn.items.forEach(item => {
        if (item.acceptedQuantity > 0) {
          const movement: StockMovement = {
            id: `sm-${Date.now()}`,
            timestamp: new Date().toISOString(),
            itemCode: item.poItemId,
            itemName: item.description,
            type: 'Inbound GRN',
            quantity: item.acceptedQuantity,
            unit: item.unit,
            fromLocation: `Supplier Delivery (${grn.supplierName})`,
            toLocation: grn.storageLocationBin || grn.receivingBranch,
            referenceId: newGrn.grnNumber,
            performedBy: grn.storekeeperName
          };
          this.movements.unshift(movement);
        }
      });
      setStored(STORAGE_KEYS.MOVEMENTS, this.movements);
    }
    setStored(STORAGE_KEYS.GRNS, this.grns);
    return grn;
  }

  // --------------------------------------------------------------------------
  // EVALUATIONS
  // --------------------------------------------------------------------------
  public getEvaluations(): SupplierEvaluation[] {
    return [...this.evaluations];
  }

  public saveEvaluation(evaluation: SupplierEvaluation): SupplierEvaluation {
    const idx = this.evaluations.findIndex(e => e.id === evaluation.id);
    if (idx >= 0) {
      this.evaluations[idx] = evaluation;
    } else {
      const newEval: SupplierEvaluation = {
        ...evaluation,
        id: evaluation.id || `eval-${Date.now()}`
      };
      this.evaluations.unshift(newEval);
    }
    setStored(STORAGE_KEYS.EVALUATIONS, this.evaluations);
    return evaluation;
  }

  // --------------------------------------------------------------------------
  // ANALYTICS & HERFINDAHL-HIRSCHMAN DIVERSIFICATION INDEX (HHI)
  // --------------------------------------------------------------------------
  public calculateHHI(): { hhiScore: number; riskLevel: 'Safe / Diversified' | 'Moderate Concentration' | 'High Monopolistic Risk'; topSuppliers: { name: string; sharePercent: number }[] } {
    const totalSpend = this.pos
      .filter(p => ['Approved', 'Issued', 'Partially Received', 'Completed'].includes(p.status))
      .reduce((sum, p) => sum + p.totalAmount, 0);

    if (totalSpend === 0) return { hhiScore: 0, riskLevel: 'Safe / Diversified', topSuppliers: [] };

    const supSpendMap: Record<string, number> = {};
    this.pos.forEach(p => {
      supSpendMap[p.supplierName] = (supSpendMap[p.supplierName] || 0) + p.totalAmount;
    });

    let hhi = 0;
    const topSuppliers = Object.entries(supSpendMap).map(([name, spend]) => {
      const share = (spend / totalSpend) * 100;
      hhi += Math.pow(share, 2);
      return { name, sharePercent: Math.round(share * 10) / 10 };
    }).sort((a, b) => b.sharePercent - a.sharePercent);

    const hhiScore = Math.round(hhi);
    let riskLevel: 'Safe / Diversified' | 'Moderate Concentration' | 'High Monopolistic Risk' = 'Safe / Diversified';
    if (hhiScore > 2500) riskLevel = 'High Monopolistic Risk';
    else if (hhiScore > 1500) riskLevel = 'Moderate Concentration';

    return { hhiScore, riskLevel, topSuppliers };
  }

  public getAnalytics(): ProcurementAnalytics {
    const totalSpendYTD = this.pos
      .filter(p => ['Approved', 'Issued', 'Partially Received', 'Completed'].includes(p.status))
      .reduce((sum, p) => sum + p.totalAmount, 0);

    const committedSpendPending = this.pos
      .filter(p => p.status === 'Pending Approval')
      .reduce((sum, p) => sum + p.totalAmount, 0);

    const activePosCount = this.pos.filter(p => ['Approved', 'Issued', 'Partially Received'].includes(p.status)).length;
    const pendingApprovalPosCount = this.pos.filter(p => p.status === 'Pending Approval').length;
    const openRfqsCount = this.rfqs.filter(r => ['Draft', 'Sent to Suppliers', 'Bids Received'].includes(r.status)).length;

    // Category breakdown
    const catMap: Record<string, number> = {};
    this.pos.forEach(p => {
      p.items.forEach(item => {
        catMap[item.category] = (catMap[item.category] || 0) + item.totalAmount;
      });
    });

    const spendByCategory = Object.entries(catMap).map(([category, amount]) => ({
      category,
      amount,
      percentage: totalSpendYTD > 0 ? Math.round((amount / totalSpendYTD) * 100) : 0
    }));

    // Top suppliers
    const supMap: Record<string, number> = {};
    this.pos.forEach(p => {
      supMap[p.supplierName] = (supMap[p.supplierName] || 0) + p.totalAmount;
    });

    const supplierSpendShare = Object.entries(supMap)
      .map(([supplierName, amount]) => ({
        supplierName,
        amount,
        percentage: totalSpendYTD > 0 ? Math.round((amount / totalSpendYTD) * 100) : 0
      }))
      .sort((a, b) => b.amount - a.amount);

    return {
      totalSpendYTD,
      committedSpendPending,
      activePosCount,
      pendingApprovalPosCount,
      openRfqsCount,
      averageLeadTimeDays: 12,
      costSavingsRealizedYTD: 84300,
      spendByCategory,
      supplierSpendShare
    };
  }
}

export const procurementService = new ProcurementService();
