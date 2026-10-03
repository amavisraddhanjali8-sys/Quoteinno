export type AssetLifecycleState =
  | 'Planned'
  | 'Purchased'
  | 'Commissioned'
  | 'Available'
  | 'Allocated'
  | 'Operating'
  | 'Maintenance'
  | 'Breakdown'
  | 'Repair'
  | 'Transferred'
  | 'Retired'
  | 'Disposed';

export type AssetOwnershipType = 'Owned' | 'Rented' | 'Leased';

export interface EquipmentMasterAsset {
  id: string;
  equipmentId: string; // e.g., EX-024, EQ-CNC-01
  qrCode: string;
  name: string;
  category: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  registrationNo?: string;
  yearPurchased: number;
  ownershipType: AssetOwnershipType;
  purchasePrice: number;
  bookValue: number;
  internalHourlyRate: number;
  rentalDailyRate?: number;
  meterType: 'Hours' | 'Kilometers' | 'Cycles';
  currentMeter: number;
  serviceIntervalHours: number;
  lastServiceMeter: number;
  nextServiceMeter: number;
  nextServiceDate: string;
  calibrationDue: string;
  calibrationStatus: 'Valid' | 'Expiring' | 'Expired';
  insuranceExpiry: string;
  warrantyExpiry: string;
  fuelType: 'Diesel' | 'Electric' | 'Pneumatic' | 'Petrol' | 'Hydraulic';
  expectedFuelLPerHr: number;
  branch: string;
  location: string;
  projectCode: string;
  projectName: string;
  assignedOperatorId: string;
  assignedOperatorName: string;
  condition: 'Excellent' | 'Good' | 'Fair' | 'Requires Repair' | 'Unsafe';
  lifecycleState: AssetLifecycleState;
  attachments: string[];
}

export interface OperatorAuthorization {
  id: string;
  operatorId: string;
  operatorName: string;
  role: string;
  licenseNo: string;
  licenseCategory: string;
  licenseExpiry: string;
  medicalValid: boolean;
  authorizedCategories: string[];
  incidentCount: number;
}

export interface AllocationHandoverRecord {
  id: string;
  recordNo: string;
  type: 'Allocation' | 'Mobilization' | 'Demobilization' | 'Transfer' | 'Handover' | 'Return';
  equipmentId: string;
  equipmentName: string;
  fromLocation: string;
  toLocation: string;
  projectCode: string;
  projectName: string;
  fromCustodian: string;
  toCustodian: string;
  operatorName: string;
  date: string;
  meterReading: number;
  fuelLevelPercent: number;
  condition: string;
  transportVehicle?: string;
  transportCost: number;
  accessoriesChecked: string;
  approvedBy: string;
  status: 'Active' | 'Completed' | 'Returned';
}

export interface DailyUsageFuelLog {
  id: string;
  logNo: string;
  date: string;
  equipmentId: string;
  equipmentName: string;
  projectCode: string;
  projectName: string;
  operatorName: string;
  openingMeter: number;
  closingMeter: number;
  operatingHours: number;
  idleHours: number;
  breakdownHours: number;
  fuelLitres: number;
  fuelCostLKR: number;
  lubricantNotes?: string;
  lubricantCostLKR: number;
  workPerformed: string;
  litresPerHour: number;
  abnormalFuelFlag: boolean;
}

export interface EquipmentInspectionRecord {
  id: string;
  inspectionNo: string;
  date: string;
  equipmentId: string;
  equipmentName: string;
  inspectionType:
    | 'Pre-Start'
    | 'Daily'
    | 'Weekly'
    | 'Pre-Mobilization'
    | 'Return'
    | 'Safety'
    | 'Statutory'
    | 'Calibration'
    | 'Post-Repair';
  inspector: string;
  meterReading: number;
  engineHydraulicsOk: boolean;
  electricalBrakesOk: boolean;
  safetyGuardsOk: boolean;
  fluidLeaksOk: boolean;
  result: 'Pass' | 'Pass with Observation' | 'Fail' | 'Unsafe';
  notes: string;
  validUntil?: string;
}

export interface MaintenanceWorkOrder {
  id: string;
  workOrderNo: string;
  date: string;
  equipmentId: string;
  equipmentName: string;
  projectCode: string;
  orderType: 'Preventive' | 'Corrective' | 'Breakdown' | 'Overhaul' | 'Calibration';
  priority: 'Normal' | 'High' | 'Emergency';
  faultOrScope: string;
  rootCause?: string;
  technician: string;
  workshopBay: string;
  downtimeHours: number;
  labourCostLKR: number;
  partsCostLKR: number;
  externalCostLKR: number;
  totalCostLKR: number;
  partsUsed: string[];
  status: 'Open' | 'In Progress' | 'Awaiting Parts' | 'Testing' | 'Completed';
}

export interface SparePartTireItem {
  id: string;
  partNo: string;
  name: string;
  category: 'Spare Part' | 'Tire' | 'Battery' | 'Lubricant' | 'Attachment';
  compatibleEquipment: string;
  installedOnEquipmentId?: string;
  stockQty: number;
  minStockQty: number;
  unitCostLKR: number;
  supplier: string;
  location: string;
  serialOrPosition?: string;
  status: 'In Stock' | 'Low Stock' | 'Installed' | 'Reorder Required';
}

export interface ComplianceDocRecord {
  id: string;
  docNo: string;
  equipmentId: string;
  equipmentName: string;
  docType: 'Registration' | 'Insurance' | 'Lifting Certificate' | 'Calibration Cert' | 'Warranty' | 'Service Manual';
  provider: string;
  issueDate: string;
  expiryDate: string;
  costOrValueLKR: number;
  status: 'Valid' | 'Expiring Soon' | 'Expired';
}

export interface UnifiedMachineEvent {
  id: string;
  equipmentId: string;
  date: string;
  category:
    | 'Acquisition'
    | 'Lifecycle'
    | 'Allocation'
    | 'Handover'
    | 'Operation'
    | 'Fuel'
    | 'Inspection'
    | 'Maintenance'
    | 'Breakdown'
    | 'Parts'
    | 'Compliance'
    | 'Disposal';
  referenceNo: string;
  title: string;
  details: string;
  projectCode?: string;
  actor: string;
  meterReading?: number;
  costImpactLKR?: number;
}

export const EQUIPMENT_CATEGORIES = [
  'Heavy Machinery',
  'Earthmoving Equipment',
  'Lifting & Hoisting Equipment',
  'Concrete Equipment',
  'Fabrication Machinery',
  'Cutting Equipment',
  'Welding Equipment',
  'Power Generation',
  'Compressors & Pneumatics',
  'Survey & Laser Equipment',
  'Testing & Calibration Tools',
  'Material Handling & Fleet',
  'Power Tools & Safety Gear'
];

const STORAGE_KEY_ASSETS = 'innovista_eq_master_assets_v1';
const STORAGE_KEY_OPERATORS = 'innovista_eq_operators_v1';
const STORAGE_KEY_ALLOCATIONS = 'innovista_eq_allocations_v1';
const STORAGE_KEY_DAILY_LOGS = 'innovista_eq_daily_logs_v1';
const STORAGE_KEY_INSPECTIONS = 'innovista_eq_inspections_v1';
const STORAGE_KEY_WORK_ORDERS = 'innovista_eq_work_orders_v1';
const STORAGE_KEY_PARTS = 'innovista_eq_parts_v1';
const STORAGE_KEY_DOCS = 'innovista_eq_docs_v1';
const STORAGE_KEY_EVENTS = 'innovista_eq_events_v1';

const SEED_ASSETS: EquipmentMasterAsset[] = [
  {
    id: 'eq-master-1',
    equipmentId: 'EQ-CNC-01',
    qrCode: 'QR-EQ-CNC-01',
    name: 'Emmegi 4-Axis CNC Profile Machining Center',
    category: 'Fabrication Machinery',
    manufacturer: 'Emmegi S.p.A',
    model: 'Phantomatic M4',
    serialNumber: 'EMM-2023-8819',
    registrationNo: 'PLANT-FAB-01',
    yearPurchased: 2023,
    ownershipType: 'Owned',
    purchasePrice: 18500000,
    bookValue: 14800000,
    internalHourlyRate: 4500,
    meterType: 'Hours',
    currentMeter: 4760,
    serviceIntervalHours: 250,
    lastServiceMeter: 4750,
    nextServiceMeter: 5000,
    nextServiceDate: '2026-11-15',
    calibrationDue: '2026-12-01',
    calibrationStatus: 'Valid',
    insuranceExpiry: '2027-03-31',
    warrantyExpiry: '2027-04-10',
    fuelType: 'Electric',
    expectedFuelLPerHr: 0,
    branch: 'Main Factory',
    location: 'Main Factory Bay 1',
    projectCode: 'PRJ-HYATT-B',
    projectName: 'Grand Hyatt Tower B',
    assignedOperatorId: 'OP-101',
    assignedOperatorName: 'Kasun Perera',
    condition: 'Excellent',
    lifecycleState: 'Operating',
    attachments: ['Pneumatic Clamps x8', 'Automatic Tool Changer', 'Coolant Mist Unit']
  },
  {
    id: 'eq-master-2',
    equipmentId: 'EX-024',
    qrCode: 'QR-EX-024',
    name: 'CAT 320 Hydraulic Construction Excavator',
    category: 'Earthmoving Equipment',
    manufacturer: 'Caterpillar',
    model: '320 GC',
    serialNumber: 'CAT0320GC99412',
    registrationNo: 'WP-LZ-4418',
    yearPurchased: 2022,
    ownershipType: 'Owned',
    purchasePrice: 34000000,
    bookValue: 25500000,
    internalHourlyRate: 5500,
    meterType: 'Hours',
    currentMeter: 3480,
    serviceIntervalHours: 250,
    lastServiceMeter: 3250,
    nextServiceMeter: 3500,
    nextServiceDate: '2026-10-05',
    calibrationDue: '2027-01-15',
    calibrationStatus: 'Valid',
    insuranceExpiry: '2026-12-31',
    warrantyExpiry: '2026-11-01',
    fuelType: 'Diesel',
    expectedFuelLPerHr: 14.5,
    branch: 'Site Operations',
    location: 'Sirius Mall Site (Earthwork Zone)',
    projectCode: 'PRJ-SIRIUS-02',
    projectName: 'Sirius Mall Facade & Civil',
    assignedOperatorId: 'OP-102',
    assignedOperatorName: 'Nimal Bandara',
    condition: 'Good',
    lifecycleState: 'Operating',
    attachments: ['1.2m Earth Bucket', 'Hydraulic Rock Breaker HB-20']
  },
  {
    id: 'eq-master-3',
    equipmentId: 'EQ-GLZ-04',
    qrCode: 'QR-EQ-GLZ-04',
    name: 'Quattrolifts Vacuum Glass Robotic Lifter 600kg',
    category: 'Lifting & Hoisting Equipment',
    manufacturer: 'Quattrolifts',
    model: 'Vector 600',
    serialNumber: 'QL-600-901',
    registrationNo: 'LIFT-CERT-04',
    yearPurchased: 2024,
    ownershipType: 'Owned',
    purchasePrice: 6800000,
    bookValue: 5900000,
    internalHourlyRate: 3200,
    meterType: 'Hours',
    currentMeter: 1190,
    serviceIntervalHours: 200,
    lastServiceMeter: 1000,
    nextServiceMeter: 1200,
    nextServiceDate: '2026-10-20',
    calibrationDue: '2026-11-20',
    calibrationStatus: 'Valid',
    insuranceExpiry: '2027-02-28',
    warrantyExpiry: '2027-02-18',
    fuelType: 'Electric',
    expectedFuelLPerHr: 0,
    branch: 'Site Operations',
    location: 'Grand Hyatt Site (Level 14)',
    projectCode: 'PRJ-HYATT-B',
    projectName: 'Grand Hyatt Tower B',
    assignedOperatorId: 'OP-103',
    assignedOperatorName: 'Rohan Jayasinghe',
    condition: 'Good',
    lifecycleState: 'Allocated',
    attachments: ['Dual Vacuum Circuit', 'Remote Control Pendant', 'Extension Arms']
  },
  {
    id: 'eq-master-4',
    equipmentId: 'EQ-SAW-03',
    qrCode: 'QR-EQ-SAW-03',
    name: 'Double Mitre High-Precision Saw 500mm',
    category: 'Cutting Equipment',
    manufacturer: 'Elumatec',
    model: 'DG 142',
    serialNumber: 'DMS-500-112',
    registrationNo: 'PLANT-SAW-03',
    yearPurchased: 2023,
    ownershipType: 'Owned',
    purchasePrice: 7200000,
    bookValue: 5400000,
    internalHourlyRate: 2800,
    meterType: 'Hours',
    currentMeter: 2995,
    serviceIntervalHours: 250,
    lastServiceMeter: 2750,
    nextServiceMeter: 3000,
    nextServiceDate: '2026-09-28',
    calibrationDue: '2026-10-25',
    calibrationStatus: 'Expiring',
    insuranceExpiry: '2027-03-31',
    warrantyExpiry: '2026-08-22',
    fuelType: 'Pneumatic',
    expectedFuelLPerHr: 0,
    branch: 'Main Factory',
    location: 'Workshop Repair Bay 2',
    projectCode: 'FACTORY-POOL',
    projectName: 'Factory Production Pool',
    assignedOperatorId: 'OP-101',
    assignedOperatorName: 'Kasun Perera',
    condition: 'Requires Repair',
    lifecycleState: 'Maintenance',
    attachments: ['500mm TCT Blades x2', 'Digital Length Stop']
  },
  {
    id: 'eq-master-5',
    equipmentId: 'EQ-GEN-07',
    qrCode: 'QR-EQ-GEN-07',
    name: 'Cummins 250kVA Silent Diesel Site Generator',
    category: 'Power Generation',
    manufacturer: 'Cummins',
    model: 'C250D5',
    serialNumber: 'CUM-250-7741',
    registrationNo: 'GEN-SITE-07',
    yearPurchased: 2024,
    ownershipType: 'Rented',
    purchasePrice: 0,
    bookValue: 0,
    internalHourlyRate: 3800,
    rentalDailyRate: 22000,
    meterType: 'Hours',
    currentMeter: 1840,
    serviceIntervalHours: 250,
    lastServiceMeter: 1750,
    nextServiceMeter: 2000,
    nextServiceDate: '2026-11-05',
    calibrationDue: '2027-04-01',
    calibrationStatus: 'Valid',
    insuranceExpiry: '2027-01-31',
    warrantyExpiry: '2027-01-31',
    fuelType: 'Diesel',
    expectedFuelLPerHr: 18.0,
    branch: 'Site Operations',
    location: 'Port City Marina Site',
    projectCode: 'PRJ-PORT-01',
    projectName: 'Port City Yacht Club',
    assignedOperatorId: 'OP-104',
    assignedOperatorName: 'Chaminda Silva',
    condition: 'Good',
    lifecycleState: 'Available',
    attachments: ['ATS Panel', '30m Heavy Armored Cable']
  },
  {
    id: 'eq-master-6',
    equipmentId: 'EQ-LAS-09',
    qrCode: 'QR-EQ-LAS-09',
    name: 'Leica Robotic Total Station & Facade Laser',
    category: 'Survey & Laser Equipment',
    manufacturer: 'Leica Geosystems',
    model: 'TS16 P 1"',
    serialNumber: 'LEI-TS16-8830',
    registrationNo: 'SURV-09',
    yearPurchased: 2024,
    ownershipType: 'Owned',
    purchasePrice: 4600000,
    bookValue: 3900000,
    internalHourlyRate: 2200,
    meterType: 'Hours',
    currentMeter: 615,
    serviceIntervalHours: 500,
    lastServiceMeter: 500,
    nextServiceMeter: 1000,
    nextServiceDate: '2027-02-10',
    calibrationDue: '2026-09-15',
    calibrationStatus: 'Expired',
    insuranceExpiry: '2027-05-01',
    warrantyExpiry: '2027-05-01',
    fuelType: 'Electric',
    expectedFuelLPerHr: 0,
    branch: 'Quality & Survey',
    location: 'Calibration Lab Hold',
    projectCode: 'UNASSIGNED',
    projectName: 'Central Survey Store',
    assignedOperatorId: 'OP-103',
    assignedOperatorName: 'Rohan Jayasinghe',
    condition: 'Good',
    lifecycleState: 'Available',
    attachments: ['Carbon Tripod', '360 Prism', 'Hard Carry Case']
  }
];

const SEED_OPERATORS: OperatorAuthorization[] = [
  {
    id: 'op-1',
    operatorId: 'OP-101',
    operatorName: 'Kasun Perera',
    role: 'Senior CNC & Saw Machinist',
    licenseNo: 'LIC-FAB-8821',
    licenseCategory: 'CNC & Automated Cutting L3',
    licenseExpiry: '2027-08-15',
    medicalValid: true,
    authorizedCategories: ['Fabrication Machinery', 'Cutting Equipment', 'Power Tools & Safety Gear'],
    incidentCount: 0
  },
  {
    id: 'op-2',
    operatorId: 'OP-102',
    operatorName: 'Nimal Bandara',
    role: 'Heavy Plant & Excavator Operator',
    licenseNo: 'LIC-HVY-4402',
    licenseCategory: 'Heavy Earthmoving & Crane Class A',
    licenseExpiry: '2027-05-20',
    medicalValid: true,
    authorizedCategories: ['Earthmoving Equipment', 'Heavy Machinery', 'Material Handling & Fleet'],
    incidentCount: 0
  },
  {
    id: 'op-3',
    operatorId: 'OP-103',
    operatorName: 'Rohan Jayasinghe',
    role: 'Hoisting & Survey Specialist',
    licenseNo: 'LIC-LIFT-1920',
    licenseCategory: 'Robotic Glazing & Survey Cert',
    licenseExpiry: '2027-11-30',
    medicalValid: true,
    authorizedCategories: ['Lifting & Hoisting Equipment', 'Survey & Laser Equipment', 'Testing & Calibration Tools'],
    incidentCount: 0
  },
  {
    id: 'op-4',
    operatorId: 'OP-104',
    operatorName: 'Chaminda Silva',
    role: 'Site Electrical & Generator Operator',
    licenseNo: 'LIC-ELC-0941',
    licenseCategory: 'High-Voltage & Diesel Plant',
    licenseExpiry: '2026-08-01', // Expired license for testing control!
    medicalValid: true,
    authorizedCategories: ['Power Generation', 'Compressors & Pneumatics'],
    incidentCount: 1
  }
];

const SEED_ALLOCATIONS: AllocationHandoverRecord[] = [
  {
    id: 'al-1',
    recordNo: 'HC-2026-081',
    type: 'Handover',
    equipmentId: 'EX-024',
    equipmentName: 'CAT 320 Hydraulic Construction Excavator',
    fromLocation: 'Central Plant Yard',
    toLocation: 'Sirius Mall Site (Earthwork Zone)',
    projectCode: 'PRJ-SIRIUS-02',
    projectName: 'Sirius Mall Facade & Civil',
    fromCustodian: 'Yard Master Mendis',
    toCustodian: 'Site Eng. Dinesh',
    operatorName: 'Nimal Bandara',
    date: '2026-09-10',
    meterReading: 3334,
    fuelLevelPercent: 95,
    condition: 'Good - Pre-mobilization passed',
    transportVehicle: 'Low-Bed Trailer WP-LP-8890',
    transportCost: 45000,
    accessoriesChecked: '1.2m Bucket, Rock Breaker, Fire Extinguisher, Manual',
    approvedBy: 'Operations Director',
    status: 'Active'
  },
  {
    id: 'al-2',
    recordNo: 'HC-2026-084',
    type: 'Allocation',
    equipmentId: 'EQ-GLZ-04',
    equipmentName: 'Quattrolifts Vacuum Glass Robotic Lifter 600kg',
    fromLocation: 'Main Factory Store',
    toLocation: 'Grand Hyatt Site (Level 14)',
    projectCode: 'PRJ-HYATT-B',
    projectName: 'Grand Hyatt Tower B',
    fromCustodian: 'Storekeeper Lal',
    toCustodian: 'Rohan Jayasinghe',
    operatorName: 'Rohan Jayasinghe',
    date: '2026-09-18',
    meterReading: 1140,
    fuelLevelPercent: 100,
    condition: 'Excellent - Vacuum pads new',
    transportVehicle: 'Boom Truck WP-LB-2219',
    transportCost: 18500,
    accessoriesChecked: 'Charger, Remote Pendant, 4 Suction Cups, Sling',
    approvedBy: 'Project Manager',
    status: 'Active'
  }
];

const SEED_DAILY_LOGS: DailyUsageFuelLog[] = [
  {
    id: 'dl-1',
    logNo: 'DL-2026-901',
    date: '2026-09-25',
    equipmentId: 'EX-024',
    equipmentName: 'CAT 320 Hydraulic Construction Excavator',
    projectCode: 'PRJ-SIRIUS-02',
    projectName: 'Sirius Mall Facade & Civil',
    operatorName: 'Nimal Bandara',
    openingMeter: 3471,
    closingMeter: 3480,
    operatingHours: 9,
    idleHours: 1,
    breakdownHours: 0,
    fuelLitres: 128,
    fuelCostLKR: 42240,
    lubricantNotes: 'Hydraulic oil top-up 2L',
    lubricantCostLKR: 3600,
    workPerformed: 'Footing trench excavation & crane pad leveling (146 hrs total project run)',
    litresPerHour: 14.2,
    abnormalFuelFlag: false
  },
  {
    id: 'dl-2',
    logNo: 'DL-2026-902',
    date: '2026-09-25',
    equipmentId: 'EQ-CNC-01',
    equipmentName: 'Emmegi 4-Axis CNC Profile Machining Center',
    projectCode: 'PRJ-HYATT-B',
    projectName: 'Grand Hyatt Tower B',
    operatorName: 'Kasun Perera',
    openingMeter: 4752,
    closingMeter: 4760,
    operatingHours: 8,
    idleHours: 0.5,
    breakdownHours: 0,
    fuelLitres: 0,
    fuelCostLKR: 6400, // Electric kWh equivalent
    lubricantNotes: 'Mist coolant refill 1L',
    lubricantCostLKR: 1800,
    workPerformed: 'Unitized curtain wall mullion 4-axis milling (Batch #44)',
    litresPerHour: 0,
    abnormalFuelFlag: false
  },
  {
    id: 'dl-3',
    logNo: 'DL-2026-903',
    date: '2026-09-24',
    equipmentId: 'EQ-GEN-07',
    equipmentName: 'Cummins 250kVA Silent Diesel Site Generator',
    projectCode: 'PRJ-PORT-01',
    projectName: 'Port City Yacht Club',
    operatorName: 'Chaminda Silva',
    openingMeter: 1834,
    closingMeter: 1840,
    operatingHours: 6,
    idleHours: 2.5,
    breakdownHours: 0,
    fuelLitres: 138,
    fuelCostLKR: 45540,
    lubricantNotes: 'None',
    lubricantCostLKR: 0,
    workPerformed: 'Temporary welding & hoist power supply',
    litresPerHour: 23.0,
    abnormalFuelFlag: true // Exceeds expected 18 L/hr!
  }
];

const SEED_INSPECTIONS: EquipmentInspectionRecord[] = [
  {
    id: 'ins-1',
    inspectionNo: 'IN-2026-034',
    date: '2026-09-25',
    equipmentId: 'EX-024',
    equipmentName: 'CAT 320 Hydraulic Construction Excavator',
    inspectionType: 'Daily',
    inspector: 'Nimal Bandara',
    meterReading: 3471,
    engineHydraulicsOk: true,
    electricalBrakesOk: true,
    safetyGuardsOk: true,
    fluidLeaksOk: true,
    result: 'Pass',
    notes: 'Track tension normal, boom pins greased, no hydraulic leaks.'
  },
  {
    id: 'ins-2',
    inspectionNo: 'IN-2026-035',
    date: '2026-09-24',
    equipmentId: 'EQ-GLZ-04',
    equipmentName: 'Quattrolifts Vacuum Glass Robotic Lifter 600kg',
    inspectionType: 'Safety',
    inspector: 'Rohan Jayasinghe',
    meterReading: 1182,
    engineHydraulicsOk: true,
    electricalBrakesOk: true,
    safetyGuardsOk: true,
    fluidLeaksOk: true,
    result: 'Pass',
    notes: 'Dual vacuum circuit drop test held 650kg test load for 30 mins with 0% loss.',
    validUntil: '2027-03-24'
  },
  {
    id: 'ins-3',
    inspectionNo: 'IN-2026-036',
    date: '2026-09-20',
    equipmentId: 'EQ-SAW-03',
    equipmentName: 'Double Mitre High-Precision Saw 500mm',
    inspectionType: 'Pre-Start',
    inspector: 'Kasun Perera',
    meterReading: 2995,
    engineHydraulicsOk: false,
    electricalBrakesOk: true,
    safetyGuardsOk: true,
    fluidLeaksOk: false,
    result: 'Fail',
    notes: 'Pneumatic clamping pressure drop & coolant pump blockage detected. Sent to Maintenance.'
  }
];

const SEED_WORK_ORDERS: MaintenanceWorkOrder[] = [
  {
    id: 'wo-1',
    workOrderNo: 'WO-2026-102',
    date: '2026-09-21',
    equipmentId: 'EQ-SAW-03',
    equipmentName: 'Double Mitre High-Precision Saw 500mm',
    projectCode: 'FACTORY-POOL',
    orderType: 'Breakdown',
    priority: 'High',
    faultOrScope: 'Pneumatic cylinder seal leak & coolant pump filter replacement',
    rootCause: 'Worn pneumatic seal ring after 2,995 operating hours',
    technician: 'Perera Machine Services',
    workshopBay: 'Workshop Bay 2',
    downtimeHours: 14,
    labourCostLKR: 15000,
    partsCostLKR: 30000,
    externalCostLKR: 0,
    totalCostLKR: 45000,
    partsUsed: ['Coolant Mesh Filter', 'Pneumatic Seal Kit 63mm', 'TCT Saw Blade 500mm'],
    status: 'In Progress'
  },
  {
    id: 'wo-2',
    workOrderNo: 'WO-2026-098',
    date: '2026-09-12',
    equipmentId: 'EQ-CNC-01',
    equipmentName: 'Emmegi 4-Axis CNC Profile Machining Center',
    projectCode: 'PRJ-HYATT-B',
    orderType: 'Preventive',
    priority: 'Normal',
    faultOrScope: '4,750h Scheduled Service: Spindle lubrication, axis ways cleaning & optical calibration',
    technician: 'Internal Maintenance Team',
    workshopBay: 'Main Factory Bay 1',
    downtimeHours: 4,
    labourCostLKR: 6500,
    partsCostLKR: 12500,
    externalCostLKR: 0,
    totalCostLKR: 19000,
    partsUsed: ['Silicone Lubricant Cartridge', 'Spindle Air Filter'],
    status: 'Completed'
  },
  {
    id: 'wo-3',
    workOrderNo: 'WO-2026-095',
    date: '2026-09-05',
    equipmentId: 'EX-024',
    equipmentName: 'CAT 320 Hydraulic Construction Excavator',
    projectCode: 'PRJ-SIRIUS-02',
    orderType: 'Preventive',
    priority: 'Normal',
    faultOrScope: '3,250h Engine oil, fuel water separator & hydraulic return filter service',
    technician: 'UTE CAT Field Service',
    workshopBay: 'Field Service Mobile',
    downtimeHours: 5,
    labourCostLKR: 18000,
    partsCostLKR: 48500,
    externalCostLKR: 12000,
    totalCostLKR: 78500,
    partsUsed: ['CAT 15W-40 Oil 25L', 'Hydraulic Filter 1R-0777', 'Fuel Separator'],
    status: 'Completed'
  }
];

const SEED_PARTS: SparePartTireItem[] = [
  {
    id: 'pt-1',
    partNo: 'OEM-500-TCT',
    name: '500mm Carbide Tipped Aluminium Saw Blade',
    category: 'Spare Part',
    compatibleEquipment: 'EQ-SAW-03, EQ-CNC-01',
    stockQty: 4,
    minStockQty: 2,
    unitCostLKR: 28500,
    supplier: 'Leitz Tooling GmbH',
    location: 'Main Store Rack A2',
    status: 'In Stock'
  },
  {
    id: 'pt-2',
    partNo: 'CAT-1R-0777',
    name: 'CAT High-Pressure Hydraulic Return Filter',
    category: 'Spare Part',
    compatibleEquipment: 'EX-024',
    stockQty: 1,
    minStockQty: 3,
    unitCostLKR: 16500,
    supplier: 'UTE Caterpillar Lanka',
    location: 'Plant Spares Bin C4',
    status: 'Low Stock'
  },
  {
    id: 'pt-3',
    partNo: 'VAC-PAD-320',
    name: 'Silicone High-Grip Vacuum Suction Pad 320mm',
    category: 'Spare Part',
    compatibleEquipment: 'EQ-GLZ-04',
    installedOnEquipmentId: 'EQ-GLZ-04',
    stockQty: 6,
    minStockQty: 4,
    unitCostLKR: 14000,
    supplier: 'Quattrolifts Spares',
    location: 'Main Store Rack B1',
    status: 'In Stock'
  },
  {
    id: 'pt-4',
    partNo: 'BAT-AGM-12V',
    name: 'Deep-Cycle AGM 12V 150Ah Hoist Battery',
    category: 'Battery',
    compatibleEquipment: 'EQ-GLZ-04, EQ-GEN-07',
    installedOnEquipmentId: 'EQ-GLZ-04',
    stockQty: 2,
    minStockQty: 2,
    unitCostLKR: 68000,
    supplier: 'Exide Industrial',
    location: 'Installed on EQ-GLZ-04',
    serialOrPosition: 'SN-BAT-9921 (13.1V Healthy)',
    status: 'Installed'
  },
  {
    id: 'pt-5',
    partNo: 'TIRE-11R22.5',
    name: 'Heavy Duty Site Truck & Boom Tire 11R22.5',
    category: 'Tire',
    compatibleEquipment: 'Site Boom Truck / Low-Bed',
    stockQty: 2,
    minStockQty: 4,
    unitCostLKR: 92000,
    supplier: 'CEAT Kelani Commercial',
    location: 'Yard Tire Bay',
    serialOrPosition: 'Tread: 12.5mm',
    status: 'Low Stock'
  }
];

const SEED_DOCS: ComplianceDocRecord[] = [
  {
    id: 'doc-1',
    docNo: 'CERT-LIFT-2026-04',
    equipmentId: 'EQ-GLZ-04',
    equipmentName: 'Quattrolifts Vacuum Glass Robotic Lifter 600kg',
    docType: 'Lifting Certificate',
    provider: 'Industrial Safety & Load Test Bureau',
    issueDate: '2026-05-31',
    expiryDate: '2027-05-31',
    costOrValueLKR: 25000,
    status: 'Valid'
  },
  {
    id: 'doc-2',
    docNo: 'POL-INS-EX024',
    equipmentId: 'EX-024',
    equipmentName: 'CAT 320 Hydraulic Construction Excavator',
    docType: 'Insurance',
    provider: 'Sri Lanka Insurance Contractors Plant Policy',
    issueDate: '2026-01-01',
    expiryDate: '2026-12-31',
    costOrValueLKR: 185000,
    status: 'Valid'
  },
  {
    id: 'doc-3',
    docNo: 'CAL-LAS-2025-09',
    equipmentId: 'EQ-LAS-09',
    equipmentName: 'Leica Robotic Total Station & Facade Laser',
    docType: 'Calibration Cert',
    provider: 'Leica Accredited Metrology Lab',
    issueDate: '2025-09-15',
    expiryDate: '2026-09-15',
    costOrValueLKR: 32000,
    status: 'Expired'
  },
  {
    id: 'doc-4',
    docNo: 'WAR-CNC-2023',
    equipmentId: 'EQ-CNC-01',
    equipmentName: 'Emmegi 4-Axis CNC Profile Machining Center',
    docType: 'Warranty',
    provider: 'Emmegi S.p.A Extended 4-Yr Spindle Warranty',
    issueDate: '2023-04-10',
    expiryDate: '2027-04-10',
    costOrValueLKR: 18500000,
    status: 'Valid'
  }
];

const SEED_EVENTS: UnifiedMachineEvent[] = [
  {
    id: 'ev-1',
    equipmentId: 'EX-024',
    date: '2022-06-15',
    category: 'Acquisition',
    referenceNo: 'PO-CAPEX-2204',
    title: 'Purchased & Registered into Asset Master',
    details: 'Acquired from UTE Caterpillar Lanka. Commissioned after initial acceptance inspection.',
    projectCode: 'HEAD-OFFICE',
    actor: 'Procurement & Plant Director',
    meterReading: 5,
    costImpactLKR: 34000000
  },
  {
    id: 'ev-2',
    equipmentId: 'EX-024',
    date: '2026-09-05',
    category: 'Maintenance',
    referenceNo: 'WO-2026-095',
    title: '3,250h Scheduled Preventive Service Completed',
    details: 'Engine oil, fuel water separator & hydraulic return filter replaced.',
    projectCode: 'PRJ-SIRIUS-02',
    actor: 'UTE CAT Field Service',
    meterReading: 3250,
    costImpactLKR: 78500
  },
  {
    id: 'ev-3',
    equipmentId: 'EX-024',
    date: '2026-09-10',
    category: 'Handover',
    referenceNo: 'HC-2026-081',
    title: 'Mobilized & Handed Over to Sirius Mall Site',
    details: 'Custody transferred from Yard Master Mendis to Site Eng. Dinesh (Operator: Nimal Bandara).',
    projectCode: 'PRJ-SIRIUS-02',
    actor: 'Operations Director',
    meterReading: 3334,
    costImpactLKR: 45000
  },
  {
    id: 'ev-4',
    equipmentId: 'EX-024',
    date: '2026-09-25',
    category: 'Operation',
    referenceNo: 'DL-2026-901',
    title: 'Daily Meter & Fuel Log (+9 hrs / 128L Diesel)',
    details: 'Footing trench excavation & crane pad leveling. Consumption: 14.2 L/hr.',
    projectCode: 'PRJ-SIRIUS-02',
    actor: 'Nimal Bandara',
    meterReading: 3480,
    costImpactLKR: 45840
  },
  {
    id: 'ev-5',
    equipmentId: 'EQ-CNC-01',
    date: '2023-04-10',
    category: 'Acquisition',
    referenceNo: 'PO-CAPEX-2309',
    title: 'Commissioned in Main Factory Bay 1',
    details: 'Emmegi 4-Axis CNC installed, laser calibrated and accepted.',
    projectCode: 'MAIN-FACTORY',
    actor: 'Plant Engineering',
    meterReading: 0,
    costImpactLKR: 18500000
  },
  {
    id: 'ev-6',
    equipmentId: 'EQ-CNC-01',
    date: '2026-09-12',
    category: 'Maintenance',
    referenceNo: 'WO-2026-098',
    title: '4,750h Scheduled Service & Spindle Lubrication',
    details: 'Spindle lubrication, axis ways cleaning & optical sensor check.',
    projectCode: 'PRJ-HYATT-B',
    actor: 'Internal Maintenance Team',
    meterReading: 4750,
    costImpactLKR: 19000
  },
  {
    id: 'ev-7',
    equipmentId: 'EQ-SAW-03',
    date: '2026-09-20',
    category: 'Inspection',
    referenceNo: 'IN-2026-036',
    title: 'Pre-Start Inspection Failed',
    details: 'Pneumatic clamping pressure drop & coolant pump blockage.',
    projectCode: 'FACTORY-POOL',
    actor: 'Kasun Perera',
    meterReading: 2995,
    costImpactLKR: 0
  },
  {
    id: 'ev-8',
    equipmentId: 'EQ-SAW-03',
    date: '2026-09-21',
    category: 'Breakdown',
    referenceNo: 'WO-2026-102',
    title: 'Breakdown Work Order Opened in Workshop Bay 2',
    details: 'Pneumatic cylinder seal leak & coolant pump filter replacement.',
    projectCode: 'FACTORY-POOL',
    actor: 'Perera Machine Services',
    meterReading: 2995,
    costImpactLKR: 45000
  }
];

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed as unknown as T;
    }
  } catch (e) {
    console.error(`Failed loading ${key}`, e);
  }
  return fallback;
}

function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Failed saving ${key}`, e);
  }
}

export const equipmentControlService = {
  getAssets(): EquipmentMasterAsset[] {
    return loadFromStorage(STORAGE_KEY_ASSETS, SEED_ASSETS);
  },
  saveAssets(assets: EquipmentMasterAsset[]): void {
    saveToStorage(STORAGE_KEY_ASSETS, assets);
  },
  getOperators(): OperatorAuthorization[] {
    return loadFromStorage(STORAGE_KEY_OPERATORS, SEED_OPERATORS);
  },
  saveOperators(ops: OperatorAuthorization[]): void {
    saveToStorage(STORAGE_KEY_OPERATORS, ops);
  },
  getAllocations(): AllocationHandoverRecord[] {
    return loadFromStorage(STORAGE_KEY_ALLOCATIONS, SEED_ALLOCATIONS);
  },
  saveAllocations(recs: AllocationHandoverRecord[]): void {
    saveToStorage(STORAGE_KEY_ALLOCATIONS, recs);
  },
  getDailyLogs(): DailyUsageFuelLog[] {
    return loadFromStorage(STORAGE_KEY_DAILY_LOGS, SEED_DAILY_LOGS);
  },
  saveDailyLogs(logs: DailyUsageFuelLog[]): void {
    saveToStorage(STORAGE_KEY_DAILY_LOGS, logs);
  },
  getInspections(): EquipmentInspectionRecord[] {
    return loadFromStorage(STORAGE_KEY_INSPECTIONS, SEED_INSPECTIONS);
  },
  saveInspections(ins: EquipmentInspectionRecord[]): void {
    saveToStorage(STORAGE_KEY_INSPECTIONS, ins);
  },
  getWorkOrders(): MaintenanceWorkOrder[] {
    return loadFromStorage(STORAGE_KEY_WORK_ORDERS, SEED_WORK_ORDERS);
  },
  saveWorkOrders(wos: MaintenanceWorkOrder[]): void {
    saveToStorage(STORAGE_KEY_WORK_ORDERS, wos);
  },
  getParts(): SparePartTireItem[] {
    return loadFromStorage(STORAGE_KEY_PARTS, SEED_PARTS);
  },
  saveParts(parts: SparePartTireItem[]): void {
    saveToStorage(STORAGE_KEY_PARTS, parts);
  },
  getDocs(): ComplianceDocRecord[] {
    return loadFromStorage(STORAGE_KEY_DOCS, SEED_DOCS);
  },
  saveDocs(docs: ComplianceDocRecord[]): void {
    saveToStorage(STORAGE_KEY_DOCS, docs);
  },
  getEvents(): UnifiedMachineEvent[] {
    return loadFromStorage(STORAGE_KEY_EVENTS, SEED_EVENTS);
  },
  addEvent(event: Omit<UnifiedMachineEvent, 'id'>): UnifiedMachineEvent[] {
    const current = this.getEvents();
    const next: UnifiedMachineEvent = {
      ...event,
      id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    };
    const updated = [next, ...current];
    saveToStorage(STORAGE_KEY_EVENTS, updated);
    return updated;
  }
};
