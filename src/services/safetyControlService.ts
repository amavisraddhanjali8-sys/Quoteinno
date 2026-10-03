export interface HseRiskJsaRecord {
  id: string;
  jsaCode: string;
  projectId: string;
  activity: string;
  hazard: string;
  initialRisk: 'High' | 'Medium' | 'Low';
  controlMeasure: string;
  residualRisk: 'Low' | 'Medium';
  linkedPermitNo: string;
  owner: string;
  status: 'Approved' | 'Review' | 'Stop-Work';
}

export interface HseSiteInspectionRecord {
  id: string;
  inspCode: string;
  projectId: string;
  category: 'Scaffold Tag' | 'Fire Gear' | 'Lifting & Rigging' | 'Electrical Panel' | 'Site Walk';
  location: string;
  equipmentId?: string;
  tagStatus: 'Green Tag (Safe)' | 'Amber (Caution)' | 'Red Tag (Do Not Use)';
  inspector: string;
  date: string;
  finding: string;
}

export interface PpeInventoryRecord {
  id: string;
  ppeCode: string;
  itemName: string;
  category: 'Fall Arrest' | 'Head & Eye' | 'Hand & Foot' | 'Respiratory';
  standard: string;
  stockQty: number;
  minStock: number;
  issuedCount: number;
  lastIssuedTo: string;
  projectId: string;
}

export interface EvacuationDrillRecord {
  id: string;
  drillCode: string;
  projectId: string;
  scenario: string;
  date: string;
  musterTimeMin: number;
  targetTimeMin: number;
  headcountMustered: string;
  commander: string;
  result: 'Pass' | 'Retest';
}

const STORAGE_KEYS = {
  RISKS: 'hse_risk_jsa_v1',
  INSPECTIONS: 'hse_site_inspections_v1',
  PPE: 'hse_ppe_inventory_v1',
  DRILLS: 'hse_evac_drills_v1'
};

const SEED_RISKS: HseRiskJsaRecord[] = [
  {
    id: 'jsa-1',
    jsaCode: 'JSA-2026-014',
    projectId: 'Sirius Mall Glazing',
    activity: 'Exterior Curtain Wall Glass Hoisting (L4)',
    hazard: 'Panel swing in high wind (>25 knots) & fall hazard',
    initialRisk: 'High',
    controlMeasure: 'Dual vacuum lifter + wind anemometer cutoff + taglines',
    residualRisk: 'Low',
    linkedPermitNo: 'WPT-2026-081',
    owner: 'Dinesh Jayawardena',
    status: 'Approved'
  },
  {
    id: 'jsa-2',
    jsaCode: 'JSA-2026-015',
    projectId: 'Sirius Mall Glazing',
    activity: 'Overhead Steel Bracket Welding',
    hazard: 'Molten sparks igniting facade protective film',
    initialRisk: 'High',
    controlMeasure: 'Fire blanket containment + CO2 extinguisher + fire watch',
    residualRisk: 'Low',
    linkedPermitNo: 'WPT-2026-079',
    owner: 'Eng. Janaka Perera',
    status: 'Approved'
  },
  {
    id: 'jsa-3',
    jsaCode: 'JSA-2026-016',
    projectId: 'Horizon Office Complex',
    activity: 'Spider Crane Outrigger Setup on Podium Slab',
    hazard: 'Slab point-load cracking or crane tipping',
    initialRisk: 'High',
    controlMeasure: 'Steel spreader plates + spirit level check + back-propping',
    residualRisk: 'Low',
    linkedPermitNo: 'WPT-2026-072',
    owner: 'Kasun Perera',
    status: 'Approved'
  },
  {
    id: 'jsa-4',
    jsaCode: 'JSA-2026-017',
    projectId: 'Horizon Office Complex',
    activity: 'Structural Silicone & Solvent Priming in Shaft',
    hazard: 'VOC fume inhalation in low-ventilation zone',
    initialRisk: 'Medium',
    controlMeasure: 'Organic vapour cartridge mask + forced exhaust fan',
    residualRisk: 'Low',
    linkedPermitNo: 'WPT-2026-084',
    owner: 'Dinesh Jayawardena',
    status: 'Review'
  }
];

const SEED_INSPECTIONS: HseSiteInspectionRecord[] = [
  {
    id: 'hsi-1',
    inspCode: 'TAG-SCF-101',
    projectId: 'Sirius Mall Glazing',
    category: 'Scaffold Tag',
    location: 'North Atrium Elevation Bay 4',
    tagStatus: 'Green Tag (Safe)',
    inspector: 'Dinesh Jayawardena',
    date: '2026-10-14',
    finding: 'Base plates locked, double guardrails & toe-boards intact'
  },
  {
    id: 'hsi-2',
    inspCode: 'TAG-LFT-102',
    projectId: 'Sirius Mall Glazing',
    category: 'Lifting & Rigging',
    location: 'Roof Davit & Vacuum Lifter #2',
    equipmentId: 'EQ-VAC-02',
    tagStatus: 'Green Tag (Safe)',
    inspector: 'Kasun Perera',
    date: '2026-10-14',
    finding: 'Dual vacuum gauge holding -0.75 bar for 15 min test'
  },
  {
    id: 'hsi-3',
    inspCode: 'TAG-SCF-103',
    projectId: 'Horizon Office Complex',
    category: 'Scaffold Tag',
    location: 'West Tower Cantilever Stage',
    tagStatus: 'Red Tag (Do Not Use)',
    inspector: 'Dinesh Jayawardena',
    date: '2026-10-13',
    finding: 'Missing tie-rod anchor on Level 3; access ladder removed'
  },
  {
    id: 'hsi-4',
    inspCode: 'TAG-FIR-104',
    projectId: 'Sirius Mall Glazing',
    category: 'Fire Gear',
    location: 'Hot Work Zone Level 2',
    tagStatus: 'Green Tag (Safe)',
    inspector: 'Nimal Silva',
    date: '2026-10-14',
    finding: 'DCP 9kg & CO2 5kg pressure gauges in green zone'
  }
];

const SEED_PPE: PpeInventoryRecord[] = [
  {
    id: 'ppe-1',
    ppeCode: 'PPE-HAR-01',
    itemName: 'Full-Body Twin-Lanyard Safety Harness',
    category: 'Fall Arrest',
    standard: 'EN 361 / ANSI Z359',
    stockQty: 18,
    minStock: 10,
    issuedCount: 42,
    lastIssuedTo: 'Roshan Mendis (Glazier)',
    projectId: 'Sirius Mall Glazing'
  },
  {
    id: 'ppe-2',
    ppeCode: 'PPE-HLM-02',
    itemName: 'Vented Chin-Strap Heights Safety Helmet',
    category: 'Head & Eye',
    standard: 'EN 397',
    stockQty: 34,
    minStock: 15,
    issuedCount: 65,
    lastIssuedTo: 'Chaminda Bandara',
    projectId: 'Sirius Mall Glazing'
  },
  {
    id: 'ppe-3',
    ppeCode: 'PPE-GLV-03',
    itemName: 'Level-5 Cut Resistant Glass Handling Gloves',
    category: 'Hand & Foot',
    standard: 'EN 388 Cut 5',
    stockQty: 6,
    minStock: 20,
    issuedCount: 88,
    lastIssuedTo: 'Suresh Kumar',
    projectId: 'Horizon Office Complex'
  },
  {
    id: 'ppe-4',
    ppeCode: 'PPE-RSP-04',
    itemName: 'Twin-Cartridge Organic Vapour Respirator',
    category: 'Respiratory',
    standard: 'EN 140 / A1P2',
    stockQty: 12,
    minStock: 8,
    issuedCount: 19,
    lastIssuedTo: 'Nuwan Pradeep',
    projectId: 'Horizon Office Complex'
  }
];

const SEED_DRILLS: EvacuationDrillRecord[] = [
  {
    id: 'drl-1',
    drillCode: 'DRL-2026-Q3',
    projectId: 'Sirius Mall Glazing',
    scenario: 'Level 2 Welding Spark Fire & Full Site Muster',
    date: '2026-09-20',
    musterTimeMin: 3.4,
    targetTimeMin: 4.0,
    headcountMustered: '48 / 48 (100%)',
    commander: 'Dinesh Jayawardena',
    result: 'Pass'
  },
  {
    id: 'drl-2',
    drillCode: 'DRL-2026-Q4',
    projectId: 'Horizon Office Complex',
    scenario: 'Suspended Gondola Power Failure & Harness Rescue',
    date: '2026-10-05',
    musterTimeMin: 6.2,
    targetTimeMin: 8.0,
    headcountMustered: '32 / 32 (100%)',
    commander: 'Eng. Janaka Perera',
    result: 'Pass'
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

export const safetyControlService = {
  getRisks(): HseRiskJsaRecord[] {
    return loadList(STORAGE_KEYS.RISKS, SEED_RISKS);
  },
  saveRisks(list: HseRiskJsaRecord[]): void {
    saveList(STORAGE_KEYS.RISKS, list);
  },

  getInspections(): HseSiteInspectionRecord[] {
    return loadList(STORAGE_KEYS.INSPECTIONS, SEED_INSPECTIONS);
  },
  saveInspections(list: HseSiteInspectionRecord[]): void {
    saveList(STORAGE_KEYS.INSPECTIONS, list);
  },

  getPpeInventory(): PpeInventoryRecord[] {
    return loadList(STORAGE_KEYS.PPE, SEED_PPE);
  },
  savePpeInventory(list: PpeInventoryRecord[]): void {
    saveList(STORAGE_KEYS.PPE, list);
  },

  getDrills(): EvacuationDrillRecord[] {
    return loadList(STORAGE_KEYS.DRILLS, SEED_DRILLS);
  },
  saveDrills(list: EvacuationDrillRecord[]): void {
    saveList(STORAGE_KEYS.DRILLS, list);
  }
};
