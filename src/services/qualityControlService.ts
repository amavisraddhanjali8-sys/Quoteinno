export interface IqcMaterialRecord {
  id: string;
  iqcCode: string;
  projectId: string;
  supplier: string;
  poRef: string;
  materialName: string;
  category: 'Aluminium Profile' | 'Insulated Glass' | 'Hardware & Locks' | 'Sealant & EPDM' | 'Powder & Chemicals';
  batchLotNo: string;
  mtcCertNo: string;
  qtyChecked: string;
  keyCheck: string;
  inspector: string;
  date: string;
  status: 'Accepted' | 'Quarantined' | 'Concession';
}

export interface QualityLabTestRecord {
  id: string;
  testCode: string;
  projectId: string;
  testType: 'DFT Micron Test' | 'Water Spray Test' | 'Silicone Adhesion' | 'Glass Fragmentation' | 'Air Infiltration' | 'Weld NDT';
  sampleRef: string;
  standardCode: string;
  requiredSpec: string;
  actualReading: string;
  testedBy: string;
  date: string;
  result: 'Pass' | 'Fail' | 'Retest';
}

export interface GaugeCalibrationRecord {
  id: string;
  gaugeCode: string;
  instrumentName: string;
  category: 'Coating DFT' | 'Dimensional' | 'Hardness' | 'Pressure & Flow' | 'Laser & Level';
  serialNo: string;
  accuracyRange: string;
  calibratedAt: string;
  dueDate: string;
  certNumber: string;
  custodian: string;
  status: 'Calibrated' | 'Due Soon' | 'Out of Calibration';
}

export interface QaHandoverDossierRecord {
  id: string;
  dossierCode: string;
  projectId: string;
  packageScope: string;
  itpSignedCount: string;
  mtcVerified: boolean;
  openSnags: number;
  qaEngineer: string;
  handoverDate: string;
  status: 'Signed Off' | 'Pending Snags' | 'In Review';
}

const STORAGE_KEYS = {
  IQC: 'qc_iqc_material_v1',
  TESTS: 'qc_lab_site_tests_v1',
  GAUGES: 'qc_gauge_calibration_v1',
  DOSSIERS: 'qc_handover_dossiers_v1'
};

const SEED_IQC: IqcMaterialRecord[] = [
  {
    id: 'iqc-1',
    iqcCode: 'IQC-2026-101',
    projectId: 'p1',
    supplier: 'Alumex Extrusions PLC',
    poRef: 'PO-2026-084',
    materialName: '6063-T6 Curtain Wall Mullion 150x60mm',
    category: 'Aluminium Profile',
    batchLotNo: 'LOT-AL-8841',
    mtcCertNo: 'MTC-AX-2026-412',
    qtyChecked: '240 Bars',
    keyCheck: 'Wall 3.02mm (±0.15) • Webster 14 HW',
    inspector: 'Marcus Silva',
    date: '2026-10-14',
    status: 'Accepted'
  },
  {
    id: 'iqc-2',
    iqcCode: 'IQC-2026-102',
    projectId: 'p2',
    supplier: 'Guardian Architectural Glass',
    poRef: 'PO-2026-089',
    materialName: '24mm Double Glazed Low-E DGU Panels',
    category: 'Insulated Glass',
    batchLotNo: 'LOT-GL-3092',
    mtcCertNo: 'MTC-GG-2026-119',
    qtyChecked: '45 Panels',
    keyCheck: 'Thickness 24.1mm • Primary seal intact',
    inspector: 'Kavindi Perera',
    date: '2026-10-13',
    status: 'Accepted'
  },
  {
    id: 'iqc-3',
    iqcCode: 'IQC-2026-103',
    projectId: 'p2',
    supplier: 'Dow Performance Silicones',
    poRef: 'PO-2026-092',
    materialName: 'DC 995 Structural Glazing Silicone Sausage',
    category: 'Sealant & EPDM',
    batchLotNo: 'LOT-SL-7710',
    mtcCertNo: 'MTC-DW-2026-054',
    qtyChecked: '120 Cartons',
    keyCheck: 'Butterfly test pass • Exp: 2027-08',
    inspector: 'Marcus Silva',
    date: '2026-10-12',
    status: 'Accepted'
  },
  {
    id: 'iqc-4',
    iqcCode: 'IQC-2026-104',
    projectId: 'p1',
    supplier: 'Jotun Powder Coatings',
    poRef: 'PO-2026-095',
    materialName: 'RAL 7016 Anthracite Super Durable Polyester',
    category: 'Powder & Chemicals',
    batchLotNo: 'LOT-PW-1190',
    mtcCertNo: 'MTC-JT-2026-088',
    qtyChecked: '18 Boxes',
    keyCheck: 'Delta-E 1.8 shade drift (>1.5 limit)',
    inspector: 'Kavindi Perera',
    date: '2026-10-11',
    status: 'Quarantined'
  }
];

const SEED_TESTS: QualityLabTestRecord[] = [
  {
    id: 'tst-1',
    testCode: 'TST-DFT-201',
    projectId: 'p1',
    testType: 'DFT Micron Test',
    sampleRef: 'Batch #14 Mullion RAL 7016',
    standardCode: 'Qualicoat Class 2',
    requiredSpec: 'Min 60 µm average',
    actualReading: '76 µm (Min 68 / Max 84)',
    testedBy: 'Marcus Silva',
    date: '2026-10-14',
    result: 'Pass'
  },
  {
    id: 'tst-2',
    testCode: 'TST-WTR-202',
    projectId: 'p1',
    testType: 'Water Spray Test',
    sampleRef: 'North Elevation Grid B2-B5 (L3)',
    standardCode: 'AAMA 501.2 / BS 6375',
    requiredSpec: '240 kPa nozzle 5 min • Zero leak',
    actualReading: '245 kPa • 0 water ingress',
    testedBy: 'Kavindi Perera',
    date: '2026-10-13',
    result: 'Pass'
  },
  {
    id: 'tst-3',
    testCode: 'TST-SIL-203',
    projectId: 'p2',
    testType: 'Silicone Adhesion',
    sampleRef: 'Unitized Panel #U-44 Peel Strip',
    standardCode: 'ASTM C794',
    requiredSpec: '100% Cohesive Failure (CF)',
    actualReading: '100% Cohesive @ 42 N/mm',
    testedBy: 'Marcus Silva',
    date: '2026-10-12',
    result: 'Pass'
  },
  {
    id: 'tst-4',
    testCode: 'TST-GLS-204',
    projectId: 'p3',
    testType: 'Glass Fragmentation',
    sampleRef: '12mm Clear Toughened Sample #T9',
    standardCode: 'BS EN 12150',
    requiredSpec: '>= 40 particles per 50x50mm',
    actualReading: '54 particles • Zero splines',
    testedBy: 'Kavindi Perera',
    date: '2026-10-10',
    result: 'Pass'
  }
];

const SEED_GAUGES: GaugeCalibrationRecord[] = [
  {
    id: 'cal-1',
    gaugeCode: 'CAL-ELC-01',
    instrumentName: 'Elcometer 456 Coating Thickness Gauge',
    category: 'Coating DFT',
    serialNo: 'SN-EL456-9921',
    accuracyRange: '0 - 1500 µm (±1%)',
    calibratedAt: '2026-06-15',
    dueDate: '2027-06-15',
    certNumber: 'SLSI-CAL-2026-881',
    custodian: 'Marcus Silva',
    status: 'Calibrated'
  },
  {
    id: 'cal-2',
    gaugeCode: 'CAL-MIT-02',
    instrumentName: 'Mitutoyo 300mm Digital Vernier Caliper',
    category: 'Dimensional',
    serialNo: 'SN-MT500-4410',
    accuracyRange: '0 - 300 mm (±0.01mm)',
    calibratedAt: '2026-05-10',
    dueDate: '2027-05-10',
    certNumber: 'SLSI-CAL-2026-642',
    custodian: 'Kavindi Perera',
    status: 'Calibrated'
  },
  {
    id: 'cal-3',
    gaugeCode: 'CAL-WEB-03',
    instrumentName: 'Webster B-75 Aluminium Hardness Tester',
    category: 'Hardness',
    serialNo: 'SN-WB75-1108',
    accuracyRange: '0 - 20 HW (±0.5 HW)',
    calibratedAt: '2025-10-20',
    dueDate: '2026-10-20',
    certNumber: 'SLSI-CAL-2025-910',
    custodian: 'Dhammika Bandara',
    status: 'Due Soon'
  },
  {
    id: 'cal-4',
    gaugeCode: 'CAL-PRG-04',
    instrumentName: 'AAMA 501.2 Brass Nozzle & Manifold Gauge',
    category: 'Pressure & Flow',
    serialNo: 'SN-AM501-3302',
    accuracyRange: '0 - 600 kPa (±2 kPa)',
    calibratedAt: '2026-07-01',
    dueDate: '2027-07-01',
    certNumber: 'SLSI-CAL-2026-995',
    custodian: 'Kavindi Perera',
    status: 'Calibrated'
  }
];

const SEED_DOSSIERS: QaHandoverDossierRecord[] = [
  {
    id: 'dos-1',
    dossierCode: 'QAD-2026-011',
    projectId: 'p1',
    packageScope: 'Podium Curtain Wall & Main Canopy Glazing',
    itpSignedCount: '18 / 18 Hold Points',
    mtcVerified: true,
    openSnags: 0,
    qaEngineer: 'Marcus Silva',
    handoverDate: '2026-10-14',
    status: 'Signed Off'
  },
  {
    id: 'dos-2',
    dossierCode: 'QAD-2026-012',
    projectId: 'p2',
    packageScope: 'Tower Floors 1-8 Sliding & Casement Windows',
    itpSignedCount: '14 / 16 Hold Points',
    mtcVerified: true,
    openSnags: 2,
    qaEngineer: 'Kavindi Perera',
    handoverDate: '2026-10-22',
    status: 'Pending Snags'
  }
];

function loadList<T>(key: string, fallback: T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function saveList<T>(key: string, list: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch {
    // ignore storage errors
  }
}

export const qualityControlService = {
  getIqcRecords(): IqcMaterialRecord[] {
    return loadList(STORAGE_KEYS.IQC, SEED_IQC);
  },
  saveIqcRecords(list: IqcMaterialRecord[]): void {
    saveList(STORAGE_KEYS.IQC, list);
  },
  getLabTests(): QualityLabTestRecord[] {
    return loadList(STORAGE_KEYS.TESTS, SEED_TESTS);
  },
  saveLabTests(list: QualityLabTestRecord[]): void {
    saveList(STORAGE_KEYS.TESTS, list);
  },
  getGauges(): GaugeCalibrationRecord[] {
    return loadList(STORAGE_KEYS.GAUGES, SEED_GAUGES);
  },
  saveGauges(list: GaugeCalibrationRecord[]): void {
    saveList(STORAGE_KEYS.GAUGES, list);
  },
  getDossiers(): QaHandoverDossierRecord[] {
    return loadList(STORAGE_KEYS.DOSSIERS, SEED_DOSSIERS);
  },
  saveDossiers(list: QaHandoverDossierRecord[]): void {
    saveList(STORAGE_KEYS.DOSSIERS, list);
  }
};
