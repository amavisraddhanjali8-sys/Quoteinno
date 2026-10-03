// ============================================================================
// INNOVISTA HUMAN CAPITAL CONTROL SYSTEM — CENTRAL BUSINESS LOGIC & API ENGINE
// Enterprise API handling RBAC/ABAC, immutable audit logging, notifications & lifecycle
// ============================================================================

import { 
  HRPortalView,
  HRCompany,
  HRBranch,
  HRDepartment,
  HRJobGrade,
  HRPosition,
  HRVacancy,
  HRCandidate,
  HREmployeeMaster,
  HRShift,
  HREmployeeRoster,
  HRAttendanceRecord,
  HRProjectTimesheet,
  HROvertimeRequest,
  HRLeaveType,
  HRLeaveBalance,
  HRLeaveRequest,
  HRCase,
  HREmployeeAsset,
  HRDocument,
  HRKPIDefinition,
  HRWorkforceSnapshot,
  BiometricTerminalConfig,
  BiometricPunchLog,
  BiometricPunchType,
  BiometricVerificationMethod,
  EmployeeLifecycleEvent,
  SalaryAdvanceRecord,
  ExitClearanceChecklistItem,
  MealRefreshmentItem,
  MealScanRecord,
  EmployeeLoanSetup,
  SriLankaStatutoryConfig,
  EmployeeAttendanceShiftState,
  EmployeeComprehensiveSetup,
  CalculatedEmployeePaysheet
} from '../types/hr';
import { SecurityUser } from '../types/security';
import { centralApiGateway } from './centralApiGateway';

const STORAGE_KEYS = {
  COMPANIES: 'innovista_hr_companies_v1',
  BRANCHES: 'innovista_hr_branches_v1',
  DEPARTMENTS: 'innovista_hr_departments_v1',
  JOB_GRADES: 'innovista_hr_job_grades_v1',
  POSITIONS: 'innovista_hr_positions_v1',
  HEADCOUNT_PLANS: 'innovista_hr_headcount_plans_v1',
  PROJECT_MANPOWER: 'innovista_hr_project_manpower_v1',
  VACANCIES: 'innovista_hr_vacancies_v1',
  CANDIDATES: 'innovista_hr_candidates_v1',
  EMPLOYEES: 'innovista_hr_employees_v1',
  ONBOARDING: 'innovista_hr_onboarding_v1',
  SHIFTS: 'innovista_hr_shifts_v1',
  ROSTERS: 'innovista_hr_rosters_v1',
  ATTENDANCE: 'innovista_hr_attendance_v1',
  TIMESHEETS: 'innovista_hr_timesheets_v1',
  OVERTIME: 'innovista_hr_overtime_v1',
  LEAVE_TYPES: 'innovista_hr_leave_types_v1',
  LEAVE_BALANCES: 'innovista_hr_leave_balances_v1',
  LEAVE_REQUESTS: 'innovista_hr_leave_requests_v1',
  BENEFIT_PLANS: 'innovista_hr_benefit_plans_v1',
  BENEFIT_ENROLLMENTS: 'innovista_hr_benefit_enrollments_v1',
  PERF_CYCLES: 'innovista_hr_perf_cycles_v1',
  GOALS: 'innovista_hr_goals_v1',
  APPRAISALS: 'innovista_hr_appraisals_v1',
  SKILLS: 'innovista_hr_skills_v1',
  COURSES: 'innovista_hr_courses_v1',
  TRAINING: 'innovista_hr_training_v1',
  SUCCESSION: 'innovista_hr_succession_v1',
  CASES: 'innovista_hr_cases_v1',
  ASSETS: 'innovista_hr_assets_v1',
  DOCUMENTS: 'innovista_hr_documents_v1',
  REQUESTS: 'innovista_hr_requests_v1',
  EXITS: 'innovista_hr_exits_v1',
  EXIT_INTERVIEWS: 'innovista_hr_exit_interviews_v1',
  KPIS: 'innovista_hr_kpis_v1',
  TERMINALS: 'innovista_hr_terminals_v1',
  BIOMETRIC_LOGS: 'innovista_hr_biometric_logs_v1',
  LIFECYCLE: 'innovista_hr_lifecycle_v1',
  SALARY_ADVANCES: 'innovista_hr_salary_advances_v1',
  EXIT_CLEARANCES: 'innovista_hr_exit_clearances_v1'
};

// --- INITIAL SEED DATA ---
const SEED_COMPANIES: HRCompany[] = [
  {
    id: 'comp-01',
    code: 'INV-CORP',
    name: 'Innovista Precision Engineering & Fabrication LLC',
    legalRegistrationNo: 'COMM-REG-DXB-98442',
    taxRegistrationNo: '100488920100003',
    headquartersAddress: 'Plot 42, Dubai Industrial City, Dubai, United Arab Emirates',
    country: 'United Arab Emirates',
    currency: 'AED',
    fiscalYearStart: 'January 1',
    isActive: true
  }
];

const SEED_BRANCHES: HRBranch[] = [
  {
    id: 'br-01',
    companyId: 'comp-01',
    code: 'BR-DIC',
    name: 'Dubai Fabrication Yard & Central Workshop',
    type: 'Fabrication Yard',
    location: 'Dubai Industrial City',
    city: 'Dubai',
    country: 'United Arab Emirates',
    managerName: 'Marcus Sterling',
    isActive: true
  },
  {
    id: 'br-02',
    companyId: 'comp-01',
    code: 'BR-AUH',
    name: 'Abu Dhabi Offshore Heavy Yard',
    type: 'Fabrication Yard',
    location: 'ICAD II, Musaffah',
    city: 'Abu Dhabi',
    country: 'United Arab Emirates',
    managerName: 'Tariq Mansoor',
    isActive: true
  },
  {
    id: 'br-03',
    companyId: 'comp-01',
    code: 'BR-SHJ',
    name: 'Sharjah Engineering & CNC Center',
    type: 'Workshop',
    location: 'Industrial Area 13',
    city: 'Sharjah',
    country: 'United Arab Emirates',
    managerName: 'Rami Varma',
    isActive: true
  }
];

const SEED_DEPARTMENTS: HRDepartment[] = [
  {
    id: 'dept-01',
    companyId: 'comp-01',
    code: 'FABRICATION',
    name: 'Heavy Structural Fabrication & Welding',
    division: 'Operations',
    section: 'Shop Floor',
    costCenterCode: 'CC-FAB-100',
    headOfDepartmentName: 'Hamdan Al-Sayed',
    approvedHeadcount: 45,
    currentHeadcount: 42,
    isActive: true
  },
  {
    id: 'dept-02',
    companyId: 'comp-01',
    code: 'ENGINEERING',
    name: 'Design, CAD/CAM & Precision CNC',
    division: 'Technical Services',
    section: 'Drafting & Nesting',
    costCenterCode: 'CC-ENG-200',
    headOfDepartmentName: 'Rami Varma',
    approvedHeadcount: 18,
    currentHeadcount: 16,
    isActive: true
  },
  {
    id: 'dept-03',
    companyId: 'comp-01',
    code: 'QUALITY',
    name: 'Quality Assurance & Non-Destructive Testing (QA/QC)',
    division: 'Compliance',
    section: 'NDT & Inspection',
    costCenterCode: 'CC-QA-300',
    headOfDepartmentName: 'David Okafor',
    approvedHeadcount: 12,
    currentHeadcount: 11,
    isActive: true
  },
  {
    id: 'dept-04',
    companyId: 'comp-01',
    code: 'COMMERCIAL_ADMIN',
    name: 'Finance, Commercial & Human Resources',
    division: 'Corporate',
    section: 'Management',
    costCenterCode: 'CC-ADM-400',
    headOfDepartmentName: 'Elena Rostova',
    approvedHeadcount: 15,
    currentHeadcount: 14,
    isActive: true
  },
  {
    id: 'dept-05',
    companyId: 'comp-01',
    code: 'PROCUREMENT_SUPPLY_CHAIN',
    name: 'Sourcing, Logistics & Warehouse',
    division: 'Supply Chain',
    section: 'Procurement',
    costCenterCode: 'CC-PRC-500',
    headOfDepartmentName: 'Priya Patel',
    approvedHeadcount: 14,
    currentHeadcount: 13,
    isActive: true
  }
];

const SEED_JOB_GRADES: HRJobGrade[] = [
  { id: 'jg-1', gradeCode: 'G1', title: 'Executive / C-Suite', minSalary: 30000, midSalary: 45000, maxSalary: 65000, benefitsBand: 'Executive', noticePeriodDays: 90, annualLeaveDays: 30 },
  { id: 'jg-2', gradeCode: 'G2', title: 'Director / Department Head', minSalary: 22000, midSalary: 28000, maxSalary: 35000, benefitsBand: 'Management', noticePeriodDays: 60, annualLeaveDays: 30 },
  { id: 'jg-3', gradeCode: 'G3', title: 'Senior Project / Technical Lead', minSalary: 15000, midSalary: 18000, maxSalary: 24000, benefitsBand: 'Professional', noticePeriodDays: 30, annualLeaveDays: 25 },
  { id: 'jg-4', gradeCode: 'G4', title: 'Specialist Engineer / Senior Inspector', minSalary: 10000, midSalary: 13500, maxSalary: 17000, benefitsBand: 'Professional', noticePeriodDays: 30, annualLeaveDays: 22 },
  { id: 'jg-5', gradeCode: 'G5', title: 'Certified Welder (6G) / CNC Programmer', minSalary: 5500, midSalary: 7500, maxSalary: 10000, benefitsBand: 'Operational', noticePeriodDays: 30, annualLeaveDays: 22 },
  { id: 'jg-6', gradeCode: 'G6', title: 'Fabrication Operator / Craftsman', minSalary: 3500, midSalary: 4800, maxSalary: 6000, benefitsBand: 'Operational', noticePeriodDays: 30, annualLeaveDays: 21 },
  { id: 'jg-7', gradeCode: 'G7', title: 'Junior Assistant / Helper', minSalary: 2500, midSalary: 3200, maxSalary: 4000, benefitsBand: 'Staff', noticePeriodDays: 30, annualLeaveDays: 21 }
];

const SEED_POSITIONS: HRPosition[] = [
  {
    id: 'pos-01',
    positionCode: 'POS-CEO-01',
    title: 'Managing Director & CEO',
    departmentCode: 'COMMERCIAL_ADMIN',
    jobGradeId: 'jg-1',
    gradeCode: 'G1',
    approvedHeadcount: 1,
    currentOccupancy: 1,
    vacancyStatus: 'Fully Staffed',
    criticality: 'Mission-Critical',
    jobDescription: 'Overall leadership, strategic capital management, and high-level client relations.',
    responsibilities: ['Strategic oversight', 'Board reporting', 'Major contract authorization'],
    requiredQualifications: ['MBA / M.Sc. Engineering', '15+ Years Executive Experience'],
    requiredSkills: ['Enterprise Leadership', 'Contract Negotiation', 'Financial Governance'],
    requiredCompetencies: ['Visionary Thinking', 'Decisiveness', 'Stakeholder Management'],
    minYearsExperience: 15
  },
  {
    id: 'pos-02',
    positionCode: 'POS-PM-01',
    title: 'Senior Project Director',
    departmentCode: 'FABRICATION',
    jobGradeId: 'jg-2',
    gradeCode: 'G2',
    reportsToPositionId: 'pos-01',
    reportsToTitle: 'Managing Director & CEO',
    approvedHeadcount: 3,
    currentOccupancy: 2,
    vacancyStatus: 'Open Vacancies',
    criticality: 'High',
    jobDescription: 'Lead mega-scale structural steel and architectural metalwork projects from design to commissioning.',
    responsibilities: ['Project milestone delivery', 'Budget & variance governance', 'Site safety'],
    requiredQualifications: ['B.Sc. Mechanical / Civil Engineering', 'PMP Certification'],
    requiredSkills: ['Project Scheduling', 'FIDIC Contracts', 'Subcontractor Management'],
    requiredCompetencies: ['Operational Excellence', 'Risk Management', 'Conflict Resolution'],
    minYearsExperience: 10
  },
  {
    id: 'pos-03',
    positionCode: 'POS-WELD-01',
    title: 'Certified Master Welder (6G / AWS D1.1)',
    departmentCode: 'FABRICATION',
    jobGradeId: 'jg-5',
    gradeCode: 'G5',
    reportsToPositionId: 'pos-02',
    reportsToTitle: 'Senior Project Director',
    approvedHeadcount: 16,
    currentOccupancy: 14,
    vacancyStatus: 'Open Vacancies',
    criticality: 'High',
    jobDescription: 'Execute critical weld joints in pipe, structural columns, and pressure assemblies under third-party NDT.',
    responsibilities: ['6G multi-process welding', 'Coupon test readiness', 'HSE adherence'],
    requiredQualifications: ['AWS D1.1 / ASME Sec IX WPQR sign-offs'],
    requiredSkills: ['TIG / MIG / SMAW', 'Flux-Cored Arc Welding', 'Weld Inspection'],
    requiredCompetencies: ['Attention to Detail', 'Safety Discipline', 'Physical Stamina'],
    minYearsExperience: 5
  },
  {
    id: 'pos-04',
    positionCode: 'POS-CNC-01',
    title: 'Senior CNC Laser & Plasma Programmer',
    departmentCode: 'ENGINEERING',
    jobGradeId: 'jg-5',
    gradeCode: 'G5',
    approvedHeadcount: 4,
    currentOccupancy: 4,
    vacancyStatus: 'Fully Staffed',
    criticality: 'High',
    jobDescription: 'CAD/CAM plate nesting, laser machine setup, cutting tool offsets, and metal sheet optimization.',
    responsibilities: ['CAD nesting', 'Laser parameter calibration', 'Scrap minimization'],
    requiredQualifications: ['Technical Diploma in Mechanical / Mechatronics'],
    requiredSkills: ['Trumpf TruLaser', 'AutoCAD / Inventor', 'G-Code / CAM'],
    requiredCompetencies: ['Precision Arithmetic', 'Problem Solving', 'Efficiency Focus'],
    minYearsExperience: 4
  },
  {
    id: 'pos-05',
    positionCode: 'POS-QA-01',
    title: 'Senior QA/QC Inspector (Level II UT/DPT)',
    departmentCode: 'QUALITY',
    jobGradeId: 'jg-4',
    gradeCode: 'G4',
    approvedHeadcount: 6,
    currentOccupancy: 5,
    vacancyStatus: 'Open Vacancies',
    criticality: 'High',
    jobDescription: 'Conduct material inspection, weld NDT inspections, dimensional verification, and sign off client ITPs.',
    responsibilities: ['NDT ultrasonic testing', 'NCR generation', 'Material test certificate verification'],
    requiredQualifications: ['ASNT Level II UT / PT / MT', 'CSWIP 3.1 or AWS-CWI'],
    requiredSkills: ['Non-Destructive Testing', 'ITP Formulation', 'ISO 9001 Auditing'],
    requiredCompetencies: ['Zero Compromise on Quality', 'Analytical Rigor', 'Report Precision'],
    minYearsExperience: 6
  }
];

const SEED_EMPLOYEES: HREmployeeMaster[] = [
  {
    id: 'emp-01',
    employeeCode: 'INV-001',
    badgeNumber: 'BADGE-101',
    fullName: 'Alexander Vance',
    preferredName: 'Alex',
    nationalIdOrEmiratesId: '784-1981-1234567-1',
    passportNumber: 'GBR-8849102',
    nationality: 'British',
    gender: 'Male',
    dateOfBirth: '1981-04-12',
    bloodGroup: 'O+',
    maritalStatus: 'Married',
    workEmail: 'a.vance@innovista-fab.com',
    personalEmail: 'alex.vance81@gmail.com',
    mobile: '+971 50 112 3344',
    currentAddress: 'Villa 14, Arabian Ranches 2, Dubai, UAE',
    emergencyContactName: 'Clara Vance',
    emergencyContactRelationship: 'Spouse',
    emergencyContactPhone: '+971 50 998 8776',
    companyId: 'comp-01',
    branch: 'Dubai Fabrication Yard & Central Workshop',
    departmentCode: 'COMMERCIAL_ADMIN',
    division: 'Corporate',
    section: 'Executive Office',
    positionId: 'pos-01',
    positionTitle: 'Managing Director & CEO',
    jobGradeId: 'jg-1',
    gradeCode: 'G1',
    employmentType: 'Permanent',
    employmentStatus: 'Active',
    dateOfJoining: '2020-01-15',
    probationEndDate: '2020-07-15',
    isConfirmed: true,
    confirmationDate: '2020-07-15',
    contractStartDate: '2020-01-15',
    currency: 'AED',
    basicSalary: 28000,
    housingAllowance: 10000,
    transportAllowance: 4000,
    otherAllowances: 0,
    grossSalary: 42000,
    bankName: 'First Abu Dhabi Bank (FAB)',
    iban: 'AE880330000099998888777',
    wpsRoutingCode: 'FABAAEAD',
    highestEducation: 'M.Sc. Industrial Engineering, University of Manchester',
    university: 'University of Manchester',
    skills: [
      { skill: 'Executive Strategy', level: 5, category: 'Leadership' },
      { skill: 'FIDIC Contracts', level: 5, category: 'Legal & Commercial' },
      { skill: 'P&L Governance', level: 5, category: 'Finance' }
    ],
    certifications: [
      { name: 'Chartered Engineer (CEng)', issuer: 'Engineering Council UK', validUntil: '2028-12-31', certificateId: 'CE-99214' }
    ],
    assignedAssetsCount: 2,
    activeProjectIds: ['PRJ-2026-001', 'PRJ-2026-002'],
    activeProjectNames: ['Al-Noor Tower High-Precision Facade', 'Marina Bay Mega Hangar'],
    history: [
      { id: 'h-1', effectiveDate: '2020-01-15', changeType: 'Hiring', oldValue: 'None', newValue: 'Managing Director', reason: 'Founding Executive appointment', approvedBy: 'Board of Directors' }
    ]
  },
  {
    id: 'emp-02',
    employeeCode: 'INV-014',
    badgeNumber: 'BADGE-102',
    fullName: 'Marcus Sterling',
    preferredName: 'Marcus',
    nationalIdOrEmiratesId: '784-1984-7654321-2',
    passportNumber: 'ZAF-4491029',
    nationality: 'South African',
    gender: 'Male',
    dateOfBirth: '1984-08-20',
    bloodGroup: 'A+',
    maritalStatus: 'Married',
    workEmail: 'm.sterling@innovista-fab.com',
    personalEmail: 'marcus.sterling@live.co.za',
    mobile: '+971 52 443 2211',
    currentAddress: 'Apt 1204, Marina Crown Tower, Dubai Marina, Dubai, UAE',
    emergencyContactName: 'Lorraine Sterling',
    emergencyContactRelationship: 'Spouse',
    emergencyContactPhone: '+971 52 990 1122',
    companyId: 'comp-01',
    branch: 'Dubai Fabrication Yard & Central Workshop',
    departmentCode: 'FABRICATION',
    division: 'Operations',
    section: 'Project Delivery',
    positionId: 'pos-02',
    positionTitle: 'Senior Project Director',
    jobGradeId: 'jg-2',
    gradeCode: 'G2',
    managerId: 'emp-01',
    managerName: 'Alexander Vance',
    employmentType: 'Permanent',
    employmentStatus: 'Active',
    dateOfJoining: '2021-03-01',
    probationEndDate: '2021-09-01',
    isConfirmed: true,
    confirmationDate: '2021-09-01',
    contractStartDate: '2021-03-01',
    currency: 'AED',
    basicSalary: 18000,
    housingAllowance: 6000,
    transportAllowance: 2500,
    otherAllowances: 1000,
    grossSalary: 27500,
    bankName: 'Emirates NBD',
    iban: 'AE440260000011223344556',
    wpsRoutingCode: 'EBILAEAD',
    highestEducation: 'B.Sc. Civil Engineering, University of Cape Town',
    university: 'University of Cape Town',
    skills: [
      { skill: 'Mega Project Management', level: 5, category: 'Leadership' },
      { skill: 'Primavera P6 & Gantt', level: 5, category: 'Technical' },
      { skill: 'Structural Steel Erection', level: 4, category: 'Engineering' }
    ],
    certifications: [
      { name: 'Project Management Professional (PMP)', issuer: 'PMI USA', validUntil: '2027-05-15', certificateId: 'PMP-2049182' },
      { name: 'Six Sigma Green Belt', issuer: 'ASQ', validUntil: '2028-09-10', certificateId: 'SSGB-4819' }
    ],
    assignedAssetsCount: 3,
    activeProjectIds: ['PRJ-2026-001', 'PRJ-2026-002'],
    activeProjectNames: ['Al-Noor Tower High-Precision Facade', 'Marina Bay Mega Hangar'],
    history: [
      { id: 'h-2', effectiveDate: '2021-03-01', changeType: 'Hiring', oldValue: 'None', newValue: 'Project Director', reason: 'Hired for mega project expansion', approvedBy: 'Alexander Vance' }
    ]
  },
  {
    id: 'emp-03',
    employeeCode: 'INV-104',
    badgeNumber: 'BADGE-104',
    fullName: 'Hamdan Al-Sayed',
    preferredName: 'Hamdan',
    nationalIdOrEmiratesId: '784-1990-3344556-3',
    passportNumber: 'EGY-9912048',
    nationality: 'Egyptian',
    gender: 'Male',
    dateOfBirth: '1990-11-05',
    bloodGroup: 'B+',
    maritalStatus: 'Married',
    workEmail: 'h.alsayed@innovista-fab.com',
    personalEmail: 'hamdan.welder@gmail.com',
    mobile: '+971 55 778 8990',
    currentAddress: 'Staff Accommodation Camp 4, DIC, Dubai, UAE',
    emergencyContactName: 'Mostafa Al-Sayed',
    emergencyContactRelationship: 'Brother',
    emergencyContactPhone: '+20 100 223 3445',
    companyId: 'comp-01',
    branch: 'Dubai Fabrication Yard & Central Workshop',
    departmentCode: 'FABRICATION',
    division: 'Operations',
    section: 'Welding Bay A',
    positionId: 'pos-03',
    positionTitle: 'Certified Master Welder (6G / AWS D1.1)',
    jobGradeId: 'jg-5',
    gradeCode: 'G5',
    managerId: 'emp-02',
    managerName: 'Marcus Sterling',
    employmentType: 'Permanent',
    employmentStatus: 'Active',
    dateOfJoining: '2022-06-10',
    probationEndDate: '2022-12-10',
    isConfirmed: true,
    confirmationDate: '2022-12-10',
    contractStartDate: '2022-06-10',
    currency: 'AED',
    basicSalary: 6200,
    housingAllowance: 1200,
    transportAllowance: 600,
    otherAllowances: 500,
    grossSalary: 8500,
    bankName: 'Abu Dhabi Commercial Bank (ADCB)',
    iban: 'AE120030000055443322110',
    wpsRoutingCode: 'ADCBAEAA',
    highestEducation: 'Welding Technology Diploma, Cairo Technical Institute',
    university: 'Cairo Technical Institute',
    skills: [
      { skill: '6G SMAW / GTAW Pipe Welding', level: 5, category: 'Craft' },
      { skill: 'AWS D1.1 Structural Welding', level: 5, category: 'Craft' },
      { skill: 'Confined Space Operation', level: 4, category: 'Safety' }
    ],
    certifications: [
      { name: 'AWS D1.1 WPQR Welder Performance', issuer: "Lloyd's Register", validUntil: '2026-11-30', certificateId: 'WELD-LR-9921' },
      { name: 'ASME Section IX 6G Certification', issuer: 'TUV Middle East', validUntil: '2027-02-14', certificateId: 'ASME-TUV-4819' }
    ],
    assignedAssetsCount: 4,
    activeProjectIds: ['PRJ-2026-001'],
    activeProjectNames: ['Al-Noor Tower High-Precision Facade'],
    history: [
      { id: 'h-3', effectiveDate: '2022-06-10', changeType: 'Hiring', oldValue: 'None', newValue: 'Certified Welder 6G', reason: 'Workshop crew onboarding', approvedBy: 'Marcus Sterling' }
    ]
  },
  {
    id: 'emp-04',
    employeeCode: 'INV-105',
    badgeNumber: 'BADGE-105',
    fullName: 'Rami Varma',
    preferredName: 'Rami',
    nationalIdOrEmiratesId: '784-1988-8877665-4',
    passportNumber: 'IND-6655443',
    nationality: 'Indian',
    gender: 'Male',
    dateOfBirth: '1988-02-18',
    bloodGroup: 'AB+',
    maritalStatus: 'Married',
    workEmail: 'r.varma@innovista-fab.com',
    personalEmail: 'rami.varma.eng@gmail.com',
    mobile: '+971 56 332 1199',
    currentAddress: 'Flat 402, Al Nahda 1, Dubai, UAE',
    emergencyContactName: 'Ananya Varma',
    emergencyContactRelationship: 'Spouse',
    emergencyContactPhone: '+971 56 991 2233',
    companyId: 'comp-01',
    branch: 'Sharjah Engineering & CNC Center',
    departmentCode: 'ENGINEERING',
    division: 'Technical Services',
    section: 'CNC Programming',
    positionId: 'pos-04',
    positionTitle: 'Senior CNC Laser & Plasma Programmer',
    jobGradeId: 'jg-5',
    gradeCode: 'G5',
    managerId: 'emp-02',
    managerName: 'Marcus Sterling',
    employmentType: 'Permanent',
    employmentStatus: 'Active',
    dateOfJoining: '2022-09-01',
    probationEndDate: '2023-03-01',
    isConfirmed: true,
    confirmationDate: '2023-03-01',
    contractStartDate: '2022-09-01',
    currency: 'AED',
    basicSalary: 6800,
    housingAllowance: 1500,
    transportAllowance: 800,
    otherAllowances: 400,
    grossSalary: 9500,
    bankName: 'Mashreq Bank',
    iban: 'AE990310000077889900112',
    wpsRoutingCode: 'BOMLAEAD',
    highestEducation: 'B.Tech in Mechanical Engineering, Kerala University',
    university: 'Kerala University',
    skills: [
      { skill: 'Trumpf TruLaser Master', level: 5, category: 'Technical' },
      { skill: 'Plate Nesting Optimization', level: 5, category: 'Technical' },
      { skill: 'AutoCAD / SolidWorks CAM', level: 4, category: 'Software' }
    ],
    certifications: [
      { name: 'Trumpf TruLaser Specialist Certified', issuer: 'Trumpf GmbH', validUntil: '2027-10-10', certificateId: 'TRUMPF-4421' }
    ],
    assignedAssetsCount: 2,
    activeProjectIds: ['PRJ-2026-001', 'PRJ-2026-002'],
    activeProjectNames: ['Al-Noor Tower High-Precision Facade', 'Marina Bay Mega Hangar'],
    history: [
      { id: 'h-4', effectiveDate: '2022-09-01', changeType: 'Hiring', oldValue: 'None', newValue: 'CNC Programmer', reason: 'Sharjah facility automation', approvedBy: 'Marcus Sterling' }
    ]
  },
  {
    id: 'emp-05',
    employeeCode: 'INV-106',
    badgeNumber: 'BADGE-106',
    fullName: 'David Okafor',
    preferredName: 'David',
    nationalIdOrEmiratesId: '784-1987-5544332-5',
    passportNumber: 'NGA-7711223',
    nationality: 'Nigerian',
    gender: 'Male',
    dateOfBirth: '1987-07-25',
    bloodGroup: 'O-',
    maritalStatus: 'Married',
    workEmail: 'd.okafor@innovista-fab.com',
    personalEmail: 'okafor.ndt.expert@gmail.com',
    mobile: '+971 54 889 0011',
    currentAddress: 'Apt 305, Silicon Oasis, Dubai, UAE',
    emergencyContactName: 'Ngozi Okafor',
    emergencyContactRelationship: 'Spouse',
    emergencyContactPhone: '+971 54 112 9988',
    companyId: 'comp-01',
    branch: 'Dubai Fabrication Yard & Central Workshop',
    departmentCode: 'QUALITY',
    division: 'Compliance',
    section: 'QA Clean Room & NDT Bay',
    positionId: 'pos-05',
    positionTitle: 'Senior QA/QC Inspector (Level II UT/DPT)',
    jobGradeId: 'jg-4',
    gradeCode: 'G4',
    managerId: 'emp-01',
    managerName: 'Alexander Vance',
    employmentType: 'Permanent',
    employmentStatus: 'Active',
    dateOfJoining: '2021-11-15',
    probationEndDate: '2022-05-15',
    isConfirmed: true,
    confirmationDate: '2022-05-15',
    contractStartDate: '2021-11-15',
    currency: 'AED',
    basicSalary: 9500,
    housingAllowance: 2500,
    transportAllowance: 1200,
    otherAllowances: 800,
    grossSalary: 14000,
    bankName: 'Dubai Islamic Bank (DIB)',
    iban: 'AE330240000088997766554',
    wpsRoutingCode: 'DIBKAEAD',
    highestEducation: 'B.Eng. Metallurgical Engineering, University of Lagos',
    university: 'University of Lagos',
    skills: [
      { skill: 'ASNT Level II UT / PT / MT', level: 5, category: 'Inspection' },
      { skill: 'ISO 9001 Lead Auditor', level: 4, category: 'Quality' },
      { skill: 'Welding Inspection CSWIP 3.1', level: 5, category: 'Quality' }
    ],
    certifications: [
      { name: 'CSWIP 3.1 Certified Welding Inspector', issuer: 'TWI UK', validUntil: '2027-06-20', certificateId: 'CSWIP-90812' },
      { name: 'ISO 9001:2015 Lead Auditor', issuer: 'IRCA', validUntil: '2028-01-15', certificateId: 'IRCA-LA-771' }
    ],
    assignedAssetsCount: 3,
    activeProjectIds: ['PRJ-2026-001'],
    activeProjectNames: ['Al-Noor Tower High-Precision Facade'],
    history: [
      { id: 'h-5', effectiveDate: '2021-11-15', changeType: 'Hiring', oldValue: 'None', newValue: 'Senior QA/QC Inspector', reason: 'ISO 3834 compliance upgrade', approvedBy: 'Alexander Vance' }
    ]
  },
  {
    id: 'emp-06',
    employeeCode: 'INV-022',
    badgeNumber: 'BADGE-103',
    fullName: 'Elena Rostova',
    preferredName: 'Elena',
    nationalIdOrEmiratesId: '784-1986-9988776-6',
    passportNumber: 'FRA-5544119',
    nationality: 'French',
    gender: 'Female',
    dateOfBirth: '1986-03-30',
    bloodGroup: 'A-',
    maritalStatus: 'Single',
    workEmail: 'e.rostova@innovista-fab.com',
    personalEmail: 'elena.rostova.cpa@gmail.com',
    mobile: '+971 50 665 4433',
    currentAddress: 'Executive Tower B, Business Bay, Dubai, UAE',
    emergencyContactName: 'Sophie Rostova',
    emergencyContactRelationship: 'Sister',
    emergencyContactPhone: '+33 6 12 34 56 78',
    companyId: 'comp-01',
    branch: 'Dubai Fabrication Yard & Central Workshop',
    departmentCode: 'COMMERCIAL_ADMIN',
    division: 'Corporate',
    section: 'Finance & HR Control',
    positionId: 'pos-01',
    positionTitle: 'Head of Finance & Corporate Accounts',
    jobGradeId: 'jg-2',
    gradeCode: 'G2',
    managerId: 'emp-01',
    managerName: 'Alexander Vance',
    employmentType: 'Permanent',
    employmentStatus: 'Active',
    dateOfJoining: '2021-04-10',
    probationEndDate: '2021-10-10',
    isConfirmed: true,
    confirmationDate: '2021-10-10',
    contractStartDate: '2021-04-10',
    currency: 'AED',
    basicSalary: 16000,
    housingAllowance: 5000,
    transportAllowance: 2000,
    otherAllowances: 1000,
    grossSalary: 24000,
    bankName: 'Emirates NBD',
    iban: 'AE550260000099887766554',
    wpsRoutingCode: 'EBILAEAD',
    highestEducation: 'Master in Corporate Finance, HEC Paris',
    university: 'HEC Paris',
    skills: [
      { skill: 'Corporate Treasury & WPS', level: 5, category: 'Finance' },
      { skill: 'ERP Cost Allocation', level: 5, category: 'Accounting' },
      { skill: 'Labor Cost Modeling', level: 4, category: 'Analytics' }
    ],
    certifications: [
      { name: 'Certified Public Accountant (CPA)', issuer: 'AICPA', validUntil: '2028-12-31', certificateId: 'CPA-89104' }
    ],
    assignedAssetsCount: 2,
    activeProjectIds: ['PRJ-2026-001', 'PRJ-2026-002'],
    activeProjectNames: ['Al-Noor Tower High-Precision Facade', 'Marina Bay Mega Hangar'],
    history: [
      { id: 'h-6', effectiveDate: '2021-04-10', changeType: 'Hiring', oldValue: 'None', newValue: 'Head of Finance', reason: 'Commercial restructuring', approvedBy: 'Alexander Vance' }
    ]
  }
];

const SEED_VACANCIES: HRVacancy[] = [
  {
    id: 'vac-01',
    requisitionNumber: 'REQ-2026-008',
    positionId: 'pos-03',
    positionTitle: 'Certified Master Welder (6G / AWS D1.1)',
    departmentCode: 'FABRICATION',
    branch: 'Dubai Fabrication Yard & Central Workshop',
    employmentType: 'Permanent',
    headcountRequired: 2,
    openDate: '2026-08-15',
    targetHireDate: '2026-10-01',
    salaryMin: 6000,
    salaryMax: 8500,
    status: 'Open',
    hiringManagerId: 'emp-02',
    hiringManagerName: 'Marcus Sterling',
    jobDescription: 'Seeking 2 certified structural welders with valid AWS D1.1 or ASME Section IX 6G test coupon records for heavy tubular column nodes on Al-Noor Tower.',
    applicantsCount: 5
  },
  {
    id: 'vac-02',
    requisitionNumber: 'REQ-2026-009',
    positionId: 'pos-05',
    positionTitle: 'Senior QA/QC Inspector (Level II UT/DPT)',
    departmentCode: 'QUALITY',
    branch: 'Dubai Fabrication Yard & Central Workshop',
    employmentType: 'Permanent',
    headcountRequired: 1,
    openDate: '2026-09-01',
    targetHireDate: '2026-10-15',
    salaryMin: 11000,
    salaryMax: 14500,
    status: 'Interviewing',
    hiringManagerId: 'emp-05',
    hiringManagerName: 'David Okafor',
    jobDescription: 'Seeking certified NDT Level II inspector for third-party weld audit sign-offs on structural steel assemblies.',
    applicantsCount: 4
  }
];

const SEED_CANDIDATES: HRCandidate[] = [
  {
    id: 'cand-01',
    vacancyId: 'vac-01',
    fullName: 'Kamal Nabil Al-Masri',
    email: 'kamal.nabil.welder@gmail.com',
    phone: '+971 55 123 9988',
    currentTitle: '6G Structural Welder',
    currentCompany: 'Al-Jaber Structural Steel',
    experienceYears: 7,
    noticePeriodDays: 15,
    expectedSalary: 7200,
    stage: 'Interview Scheduled',
    cvSummary: 'Experienced 6G welder with 7 years in marine and structural steel in UAE. Valid Lloyd’s Register WPQR on carbon steel.',
    skills: ['6G Pipe Welding', 'TIG / GTAW', 'AWS D1.1', 'ASME IX'],
    rating: 4.5,
    interviewDate: '2026-09-26T10:00:00',
    interviewNotes: 'Passed coupon visual exam; practical coupon bend test scheduled in Workshop Bay A.',
    appliedDate: '2026-09-10'
  },
  {
    id: 'cand-02',
    vacancyId: 'vac-01',
    fullName: 'Rajesh Subramanian',
    email: 'rajesh.subra.weld@yahoo.com',
    phone: '+971 52 778 1234',
    currentTitle: 'Certified Welder (SMAW/FCAW)',
    currentCompany: 'Eversendai Engineering',
    experienceYears: 6,
    noticePeriodDays: 30,
    expectedSalary: 7000,
    stage: 'Screening',
    cvSummary: '6 years heavy structural welding in stadium and tower frameworks. Certified AWS D1.1 in 3G & 4G positions.',
    skills: ['FCAW', 'SMAW', 'Torch Cutting', 'Blueprint Reading'],
    rating: 4.0,
    appliedDate: '2026-09-14'
  },
  {
    id: 'cand-03',
    vacancyId: 'vac-02',
    fullName: 'Faisal Mahmoud',
    email: 'faisal.ndt.qc@outlook.com',
    phone: '+971 50 445 6789',
    currentTitle: 'QA/QC Inspector Level II',
    currentCompany: 'Lamprell Energy',
    experienceYears: 8,
    noticePeriodDays: 30,
    expectedSalary: 13500,
    stage: 'Offer Extended',
    cvSummary: 'ASNT Level II UT/MT/PT certified with CSWIP 3.1. Extensive offshore jacket inspection experience.',
    skills: ['Ultrasonic Testing (UT)', 'CSWIP 3.1', 'ITP Execution', 'NCR Investigation'],
    rating: 4.8,
    assessmentScore: 92,
    offerAmount: 13500,
    appliedDate: '2026-09-02'
  }
];

const SEED_SHIFTS: HRShift[] = [
  { id: 'sh-01', code: 'SHIFT-MORN', name: 'Shift 1: Morning Fabrication', startTime: '07:00', endTime: '15:30', breakDurationMinutes: 30, workHours: 8, isNightShift: false, flexibleMinutes: 15 },
  { id: 'sh-02', code: 'SHIFT-EVE', name: 'Shift 2: Evening Operations', startTime: '15:30', endTime: '00:00', breakDurationMinutes: 30, workHours: 8, isNightShift: true, flexibleMinutes: 15 },
  { id: 'sh-03', code: 'SHIFT-GEN', name: 'Shift 3: General Office & Engineering', startTime: '08:00', endTime: '17:00', breakDurationMinutes: 60, workHours: 8, isNightShift: false, flexibleMinutes: 30 }
];

const SEED_ROSTERS: HREmployeeRoster[] = [
  { id: 'ros-01', employeeId: 'emp-03', employeeName: 'Hamdan Al-Sayed', departmentCode: 'FABRICATION', shiftId: 'sh-01', shiftName: 'Shift 1: Morning Fabrication', effectiveFrom: '2026-09-01', effectiveTo: '2026-09-30', stationName: 'Heavy Welding Bay A', restDays: ['Sunday'] },
  { id: 'ros-02', employeeId: 'emp-04', employeeName: 'Rami Varma', departmentCode: 'ENGINEERING', shiftId: 'sh-01', shiftName: 'Shift 1: Morning Fabrication', effectiveFrom: '2026-09-01', effectiveTo: '2026-09-30', stationName: 'CNC Laser Center', restDays: ['Sunday'] },
  { id: 'ros-03', employeeId: 'emp-05', employeeName: 'David Okafor', departmentCode: 'QUALITY', shiftId: 'sh-03', shiftName: 'Shift 3: General Office & Engineering', effectiveFrom: '2026-09-01', effectiveTo: '2026-09-30', stationName: 'QA Clean Room', restDays: ['Saturday', 'Sunday'] },
  { id: 'ros-04', employeeId: 'emp-02', employeeName: 'Marcus Sterling', departmentCode: 'FABRICATION', shiftId: 'sh-03', shiftName: 'Shift 3: General Office & Engineering', effectiveFrom: '2026-09-01', effectiveTo: '2026-09-30', stationName: 'PM Site Office', restDays: ['Saturday', 'Sunday'] }
];

const SEED_ATTENDANCE: HRAttendanceRecord[] = [
  {
    id: 'att-01',
    employeeId: 'emp-03',
    employeeName: 'Hamdan Al-Sayed',
    badgeNumber: 'BADGE-104',
    departmentCode: 'FABRICATION',
    date: '2026-09-23',
    shiftCode: 'SHIFT-MORN',
    scheduledStart: '07:00',
    scheduledEnd: '15:30',
    actualClockIn: '06:52',
    actualClockOut: '17:30',
    totalWorkedMinutes: 608,
    lateMinutes: 0,
    earlyDepartureMinutes: 0,
    overtimeMinutes: 120,
    status: 'Present',
    source: 'BIOMETRIC',
    locationPin: 'Gate 2 Biometric Turnstile, DIC Yard'
  },
  {
    id: 'att-02',
    employeeId: 'emp-04',
    employeeName: 'Rami Varma',
    badgeNumber: 'BADGE-105',
    departmentCode: 'ENGINEERING',
    date: '2026-09-23',
    shiftCode: 'SHIFT-MORN',
    scheduledStart: '07:00',
    scheduledEnd: '15:30',
    actualClockIn: '06:58',
    totalWorkedMinutes: 300,
    lateMinutes: 0,
    earlyDepartureMinutes: 0,
    overtimeMinutes: 0,
    status: 'Present',
    source: 'QR_CODE',
    locationPin: 'Sharjah CNC Workshop Terminal'
  },
  {
    id: 'att-03',
    employeeId: 'emp-05',
    employeeName: 'David Okafor',
    badgeNumber: 'BADGE-106',
    departmentCode: 'QUALITY',
    date: '2026-09-23',
    shiftCode: 'SHIFT-GEN',
    scheduledStart: '08:00',
    scheduledEnd: '17:00',
    actualClockIn: '07:55',
    totalWorkedMinutes: 240,
    lateMinutes: 0,
    earlyDepartureMinutes: 0,
    overtimeMinutes: 0,
    status: 'Present',
    source: 'WEB',
    locationPin: 'Innovista Web Portal'
  },
  {
    id: 'att-04',
    employeeId: 'emp-02',
    employeeName: 'Marcus Sterling',
    badgeNumber: 'BADGE-102',
    departmentCode: 'FABRICATION',
    date: '2026-09-23',
    shiftCode: 'SHIFT-GEN',
    scheduledStart: '08:00',
    scheduledEnd: '17:00',
    actualClockIn: '07:45',
    totalWorkedMinutes: 255,
    lateMinutes: 0,
    earlyDepartureMinutes: 0,
    overtimeMinutes: 0,
    status: 'Present',
    source: 'MOBILE',
    locationPin: 'Site Geofence (Marina Hangar Yard)'
  }
];

const SEED_TIMESHEETS: HRProjectTimesheet[] = [
  {
    id: 'ts-01',
    employeeId: 'emp-03',
    employeeName: 'Hamdan Al-Sayed',
    date: '2026-09-22',
    projectId: 'PRJ-2026-001',
    projectCode: 'PRJ-2026-001',
    workPackageCode: 'WP-01-FAB',
    taskActivity: '6G Full Penetration Weld on Node Box Assembly',
    startHour: '07:00',
    endHour: '17:30',
    hoursWorked: 10,
    isOvertime: true,
    hourlyCostRate: 65,
    totalLaborCost: 650,
    supervisorId: 'emp-02',
    supervisorName: 'Marcus Sterling',
    status: 'Approved',
    notes: 'Approved for Al-Noor Tower critical critical path node weld.'
  },
  {
    id: 'ts-02',
    employeeId: 'emp-04',
    employeeName: 'Rami Varma',
    date: '2026-09-22',
    projectId: 'PRJ-2026-001',
    projectCode: 'PRJ-2026-001',
    workPackageCode: 'WP-02-ENG',
    taskActivity: 'Plate CNC nesting & Trumpf Laser program generation',
    startHour: '07:00',
    endHour: '15:30',
    hoursWorked: 8,
    isOvertime: false,
    hourlyCostRate: 75,
    totalLaborCost: 600,
    supervisorId: 'emp-02',
    supervisorName: 'Marcus Sterling',
    status: 'Approved',
    notes: 'Material scrap reduced by 4.2% on 20mm S355 plate.'
  }
];

const SEED_OVERTIME: HROvertimeRequest[] = [
  {
    id: 'ot-01',
    requestNumber: 'OT-2026-042',
    employeeId: 'emp-03',
    employeeName: 'Hamdan Al-Sayed',
    departmentCode: 'FABRICATION',
    date: '2026-09-23',
    projectId: 'PRJ-2026-001',
    hoursRequested: 2,
    multiplier: 1.25,
    reason: 'Urgent weld closure on Node N-14 prior to third-party ultrasonic testing tomorrow morning.',
    status: 'Approved',
    approvedBy: 'Marcus Sterling',
    approvedAt: '2026-09-23T11:00:00Z',
    estimatedAmount: 162.5
  }
];

const SEED_LEAVE_TYPES: HRLeaveType[] = [
  { id: 'lt-01', code: 'ANNUAL', name: 'Annual Paid Leave', annualEntitlement: 30, isPaid: true, allowCarryForward: true, maxCarryForwardDays: 10, requiresDocumentProof: false, color: '#3b82f6' },
  { id: 'lt-02', code: 'SICK', name: 'Medical / Sick Leave', annualEntitlement: 15, isPaid: true, allowCarryForward: false, maxCarryForwardDays: 0, requiresDocumentProof: true, color: '#ef4444' },
  { id: 'lt-03', code: 'EMERGENCY', name: 'Compassionate / Emergency', annualEntitlement: 5, isPaid: true, allowCarryForward: false, maxCarryForwardDays: 0, requiresDocumentProof: true, color: '#f59e0b' },
  { id: 'lt-04', code: 'UNPAID', name: 'Unpaid Leave of Absence', annualEntitlement: 30, isPaid: false, allowCarryForward: false, maxCarryForwardDays: 0, requiresDocumentProof: false, color: '#64748b' }
];

const SEED_LEAVE_BALANCES: HRLeaveBalance[] = [
  { id: 'lb-01', employeeId: 'emp-03', leaveTypeCode: 'ANNUAL', leaveTypeName: 'Annual Paid Leave', entitled: 30, accrued: 22.5, taken: 6, pending: 0, balance: 16.5 },
  { id: 'lb-02', employeeId: 'emp-03', leaveTypeCode: 'SICK', leaveTypeName: 'Medical / Sick Leave', entitled: 15, accrued: 15, taken: 1, pending: 0, balance: 14 },
  { id: 'lb-03', employeeId: 'emp-04', leaveTypeCode: 'ANNUAL', leaveTypeName: 'Annual Paid Leave', entitled: 30, accrued: 22.5, taken: 10, pending: 2, balance: 10.5 },
  { id: 'lb-04', employeeId: 'emp-05', leaveTypeCode: 'ANNUAL', leaveTypeName: 'Annual Paid Leave', entitled: 30, accrued: 22.5, taken: 4, pending: 0, balance: 18.5 }
];

const SEED_LEAVE_REQUESTS: HRLeaveRequest[] = [
  {
    id: 'lr-01',
    requestNumber: 'LV-2026-088',
    employeeId: 'emp-04',
    employeeName: 'Rami Varma',
    departmentCode: 'ENGINEERING',
    leaveTypeCode: 'ANNUAL',
    leaveTypeName: 'Annual Paid Leave',
    startDate: '2026-10-12',
    endDate: '2026-10-16',
    totalDays: 5,
    reason: 'Family visit to hometown during school midterm holidays.',
    emergencyContact: '+91 98401 22334',
    status: 'Pending',
    appliedDate: '2026-09-20'
  }
];

const SEED_CASES: HRCase[] = [
  {
    id: 'case-01',
    caseNumber: 'HR-DISC-2026-004',
    type: 'Disciplinary',
    severity: 'Medium',
    title: 'Failure to wear PPE helmet in active overhead crane zone',
    incidentDate: '2026-09-18',
    reportedDate: '2026-09-19',
    employeeId: 'emp-03',
    employeeName: 'Hamdan Al-Sayed',
    departmentCode: 'FABRICATION',
    description: 'HSE officer noted operative stepped into Crane Bay 2 without chin strap attached during test beam transfer.',
    investigatorName: 'David Okafor',
    investigationFindings: 'First minor safety infraction. Employee acknowledged and participated in immediate refresher.',
    actionTaken: 'Formal Safety Warning Issued & Logged',
    status: 'Resolved & Closed',
    confidentiality: 'Confidential',
    resolutionDate: '2026-09-21'
  }
];

const SEED_ASSETS: HREmployeeAsset[] = [
  {
    id: 'asset-01',
    assetTag: 'AST-LTP-042',
    category: 'Laptop',
    modelName: 'Dell Precision 7680 CAD Workstation (i9 / RTX 4080)',
    serialNumber: 'DP-9988231',
    assignedToEmployeeId: 'emp-04',
    assignedToEmployeeName: 'Rami Varma',
    departmentCode: 'ENGINEERING',
    assignedDate: '2022-09-05',
    conditionOnAssignment: 'New',
    status: 'Assigned',
    employeeAcknowledged: true
  },
  {
    id: 'asset-02',
    assetTag: 'AST-NDT-012',
    category: 'Special Equipment',
    modelName: 'Olympus Epoch 650 Digital Ultrasonic Flaw Detector',
    serialNumber: 'OLY-774411',
    assignedToEmployeeId: 'emp-05',
    assignedToEmployeeName: 'David Okafor',
    departmentCode: 'QUALITY',
    assignedDate: '2022-01-10',
    conditionOnAssignment: 'Good',
    status: 'Assigned',
    employeeAcknowledged: true
  },
  {
    id: 'asset-03',
    assetTag: 'AST-WLD-104',
    category: 'Tool Kit',
    modelName: 'Speedglas 9100XX Auto-Darkening Welding Helmet + Air PAPR',
    serialNumber: '3M-SG-5544',
    assignedToEmployeeId: 'emp-03',
    assignedToEmployeeName: 'Hamdan Al-Sayed',
    departmentCode: 'FABRICATION',
    assignedDate: '2022-06-15',
    conditionOnAssignment: 'Good',
    status: 'Assigned',
    employeeAcknowledged: true
  }
];

const SEED_DOCUMENTS: HRDocument[] = [
  {
    id: 'doc-01',
    documentNumber: 'DOC-EID-104',
    employeeId: 'emp-03',
    employeeName: 'Hamdan Al-Sayed',
    category: 'Emirates ID / National ID',
    fileName: 'Hamdan_AlSayed_Emirates_ID.pdf',
    fileSizeKb: 420,
    issueDate: '2024-05-10',
    expiryDate: '2026-11-20',
    status: 'Expiring Soon',
    verifiedBy: 'Elena Rostova',
    verifiedAt: '2024-05-12',
    confidentiality: 'Standard HR'
  },
  {
    id: 'doc-02',
    documentNumber: 'DOC-PAS-105',
    employeeId: 'emp-04',
    employeeName: 'Rami Varma',
    category: 'Passport',
    fileName: 'Rami_Varma_Passport_Copy.pdf',
    fileSizeKb: 610,
    issueDate: '2020-08-14',
    expiryDate: '2030-08-13',
    status: 'Valid',
    verifiedBy: 'Elena Rostova',
    verifiedAt: '2022-09-02',
    confidentiality: 'Standard HR'
  },
  {
    id: 'doc-03',
    documentNumber: 'DOC-WELD-WPQR',
    employeeId: 'emp-03',
    employeeName: 'Hamdan Al-Sayed',
    category: 'Certificates & Degrees',
    fileName: 'Lloyds_WPQR_6G_Hamdan_2026.pdf',
    fileSizeKb: 890,
    issueDate: '2026-05-30',
    expiryDate: '2026-11-30',
    status: 'Expiring Soon',
    verifiedBy: 'David Okafor',
    verifiedAt: '2026-06-01',
    confidentiality: 'Standard HR'
  }
];

const SEED_KPIS: HRKPIDefinition[] = [
  {
    id: 'kpi-01',
    kpiCode: 'KPI-HR-HC',
    name: 'Total Active Workforce Headcount',
    category: 'Workforce',
    formulaDescription: 'Active full-time + verified site contractors',
    unit: 'Count',
    targetValue: 95,
    currentActual: 96,
    status: 'On Target',
    frequency: 'Monthly'
  },
  {
    id: 'kpi-02',
    kpiCode: 'KPI-HR-ABS',
    name: 'Shop Floor Absenteeism Rate',
    category: 'Workforce',
    formulaDescription: '(Unplanned Absent Days / Total Planned Work Days) * 100',
    unit: '%',
    targetValue: 2.5,
    currentActual: 1.8,
    status: 'On Target',
    frequency: 'Monthly'
  },
  {
    id: 'kpi-03',
    kpiCode: 'KPI-HR-OT',
    name: 'Monthly Overtime Ratio vs Base Payroll',
    category: 'Financial & Payroll',
    formulaDescription: '(Total Overtime Expenditure / Base Gross Payroll) * 100',
    unit: '%',
    targetValue: 10.0,
    currentActual: 8.1,
    status: 'On Target',
    frequency: 'Monthly'
  },
  {
    id: 'kpi-04',
    kpiCode: 'KPI-HR-TTH',
    name: 'Time-to-Hire for Certified Craft Positions',
    category: 'Recruitment',
    formulaDescription: 'Average calendar days from Requisition Approval to Offer Acceptance',
    unit: 'Days',
    targetValue: 30,
    currentActual: 24,
    status: 'On Target',
    frequency: 'Monthly'
  }
];

const SEED_TERMINALS: BiometricTerminalConfig[] = [
  {
    id: 'term-1',
    name: 'Yard East Biometric Turnstile',
    location: 'Fabrication Yard East Gate',
    ipAddress: '192.168.1.185',
    port: 4370,
    deviceModel: 'ZKTeco BioStation 3 (Face / Minutiae Fingerprint)',
    terminalType: 'ZKTeco',
    status: 'ONLINE',
    lastPingTime: new Date(Date.now() - 45000).toISOString(),
    bufferedRecordCount: 14,
    firmwareVersion: 'v4.8.2-PRO',
    assignedDepartment: 'FABRICATION'
  },
  {
    id: 'term-2',
    name: 'Site Gate 4 - Horizon Complex',
    location: 'Horizon Commercial Tower Site Office',
    ipAddress: '192.168.2.140',
    port: 4370,
    deviceModel: 'Hikvision DS-K1T673 (Palm Vein & Facial ID)',
    terminalType: 'Hikvision',
    status: 'ONLINE',
    lastPingTime: new Date(Date.now() - 72000).toISOString(),
    bufferedRecordCount: 9,
    firmwareVersion: 'v3.1.9-BUILD24',
    assignedDepartment: 'SITE_INSTALLATION'
  },
  {
    id: 'term-3',
    name: 'CNC Machining Bay Scanner',
    location: 'Sharjah CNC Milling Workshop',
    ipAddress: '192.168.1.92',
    port: 4370,
    deviceModel: 'Honeywell Voyager 1400g (USB / Serial Laser Wedge)',
    terminalType: 'Honeywell_Laser',
    status: 'ONLINE',
    lastPingTime: new Date(Date.now() - 15000).toISOString(),
    bufferedRecordCount: 0,
    firmwareVersion: 'v1.4.0-WEDGE',
    assignedDepartment: 'MACHINING'
  },
  {
    id: 'term-4',
    name: 'Muster Station Mobile Reader',
    location: 'Field Site Dispatch Truck',
    ipAddress: '192.168.3.50',
    port: 4370,
    deviceModel: 'Zebra TC52 Laser Barcode & NFC Gun',
    terminalType: 'Zebra_Scanner',
    status: 'ONLINE',
    lastPingTime: new Date(Date.now() - 120000).toISOString(),
    bufferedRecordCount: 5,
    firmwareVersion: 'v2.0.1-MOB',
    assignedDepartment: 'LOGISTICS'
  }
];

const SEED_BIOMETRIC_LOGS: BiometricPunchLog[] = [
  {
    id: 'bio-01',
    terminalId: 'term-1',
    terminalName: 'Yard East Biometric Turnstile',
    employeeId: 'EMP-041',
    employeeName: 'Kasun Wickramasinghe',
    badgeNumber: 'BDG-10041',
    timestamp: new Date(Date.now() - 14400000).toISOString(),
    date: new Date().toISOString().split('T')[0],
    time: '06:52',
    punchType: 'CHECK_IN',
    verificationMethod: 'FINGERPRINT',
    matchScore: 99.4,
    projectId: 'Sirius Mall Storefront',
    projectName: 'Sirius Mall Storefront',
    isSyncedToTimesheet: true,
    timesheetEntryId: 't1'
  },
  {
    id: 'bio-02',
    terminalId: 'term-2',
    terminalName: 'Site Gate 4 - Horizon Complex',
    employeeId: 'EMP-042',
    employeeName: 'Sachith Fernando',
    badgeNumber: 'BDG-10042',
    timestamp: new Date(Date.now() - 13800000).toISOString(),
    date: new Date().toISOString().split('T')[0],
    time: '07:01',
    punchType: 'CHECK_IN',
    verificationMethod: 'FACIAL_RECOGNITION',
    matchScore: 98.8,
    projectId: 'Horizon Office Complex',
    projectName: 'Horizon Office Complex',
    isSyncedToTimesheet: true,
    timesheetEntryId: 't2'
  },
  {
    id: 'bio-03',
    terminalId: 'term-3',
    terminalName: 'CNC Machining Bay Scanner',
    employeeId: 'EMP-044',
    employeeName: 'Pradeep Kumara',
    badgeNumber: 'BDG-10044',
    timestamp: new Date(Date.now() - 13200000).toISOString(),
    date: new Date().toISOString().split('T')[0],
    time: '07:08',
    punchType: 'CHECK_IN',
    verificationMethod: 'LASER_BARCODE',
    matchScore: 100,
    projectId: 'Horizon Office Complex',
    projectName: 'Horizon Office Complex',
    isSyncedToTimesheet: true,
    timesheetEntryId: 't3'
  },
  {
    id: 'bio-04',
    terminalId: 'term-1',
    terminalName: 'Yard East Biometric Turnstile',
    employeeId: 'EMP-045',
    employeeName: 'Roshan Samarasekera',
    badgeNumber: 'BDG-10045',
    timestamp: new Date(Date.now() - 12600000).toISOString(),
    date: new Date().toISOString().split('T')[0],
    time: '07:15',
    punchType: 'CHECK_IN',
    verificationMethod: 'FINGERPRINT',
    matchScore: 97.6,
    projectId: 'Central Workshop CNC',
    projectName: 'Central Workshop CNC',
    isSyncedToTimesheet: true
  },
  {
    id: 'bio-05',
    terminalId: 'term-1',
    terminalName: 'Yard East Biometric Turnstile',
    employeeId: 'EMP-041',
    employeeName: 'Kasun Wickramasinghe',
    badgeNumber: 'BDG-10041',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    date: new Date().toISOString().split('T')[0],
    time: '12:30',
    punchType: 'BREAK_OUT',
    verificationMethod: 'FINGERPRINT',
    matchScore: 99.1,
    projectId: 'Sirius Mall Storefront',
    isSyncedToTimesheet: true
  },
  {
    id: 'bio-06',
    terminalId: 'term-1',
    terminalName: 'Yard East Biometric Turnstile',
    employeeId: 'EMP-041',
    employeeName: 'Kasun Wickramasinghe',
    badgeNumber: 'BDG-10041',
    timestamp: new Date(Date.now() - 4500000).toISOString(),
    date: new Date().toISOString().split('T')[0],
    time: '13:15',
    punchType: 'BREAK_IN',
    verificationMethod: 'FINGERPRINT',
    matchScore: 99.2,
    projectId: 'Sirius Mall Storefront',
    isSyncedToTimesheet: true
  }
];

const SEED_LIFECYCLE_EVENTS: EmployeeLifecycleEvent[] = [
  {
    id: 'lc-1',
    employeeId: 'EMP-041',
    stage: 'APPLIED',
    date: '2023-01-10',
    title: 'Application Received',
    description: 'Applied for Senior Fabricator vacancy via recruitment portal.',
    department: 'Fabrication',
    performedBy: 'Sara Jenkins (Recruitment Lead)'
  },
  {
    id: 'lc-2',
    employeeId: 'EMP-041',
    stage: 'INTERVIEWED',
    date: '2023-01-18',
    title: 'Technical & Practical Workshop Assessment',
    description: 'Scored 96% on 45-degree aluminum miter cut and Emmegi CNC profile test.',
    department: 'Fabrication',
    performedBy: 'Marcus Sterling (Project Director)'
  },
  {
    id: 'lc-3',
    employeeId: 'EMP-041',
    stage: 'ONBOARDED',
    date: '2023-02-01',
    title: 'Appointment & Induction Completed',
    description: 'Appointment letter issued, PPE allocated, safety induction signed.',
    department: 'Fabrication',
    performedBy: 'HR Onboarding Desk'
  },
  {
    id: 'lc-4',
    employeeId: 'EMP-041',
    stage: 'PROBATION',
    date: '2023-05-01',
    title: 'Probation Successfully Confirmed',
    description: 'Completed 3-month probation with zero safety incidents and exemplary quality score.',
    department: 'Fabrication',
    performedBy: 'Elena Rostova (Head of HR)'
  },
  {
    id: 'lc-5',
    employeeId: 'EMP-041',
    stage: 'TRAINED',
    date: '2023-11-15',
    title: 'AluK Certified Master Fabricator',
    description: 'Completed 40-hour AluK advanced structural curtain wall qualification.',
    department: 'Fabrication',
    performedBy: 'AluK Middle East Academy'
  },
  {
    id: 'lc-6',
    employeeId: 'EMP-041',
    stage: 'PROMOTED',
    date: '2024-03-01',
    title: 'Promoted to Master Aluminium Fabricator & Crew Lead',
    description: 'Promoted to Grade G5 with salary increase and direct crewing responsibility.',
    department: 'Fabrication',
    performedBy: 'Alexander Vance (Managing Director)'
  }
];

const SEED_SALARY_ADVANCES: SalaryAdvanceRecord[] = [
  {
    id: 'adv-01',
    employeeId: 'EMP-041',
    employeeName: 'Kasun Wickramasinghe',
    department: 'Fabrication',
    amount: 3500,
    requestDate: '2026-08-15',
    repaymentMonths: 3,
    monthlyDeduction: 1166.67,
    reason: 'Emergency family medical expense',
    status: 'Disbursed',
    approvedBy: 'Elena Rostova',
    disbursedDate: '2026-08-16',
    remainingBalance: 1166.66
  },
  {
    id: 'adv-02',
    employeeId: 'EMP-044',
    employeeName: 'Pradeep Kumara',
    department: 'Site Installation',
    amount: 2000,
    requestDate: '2026-09-10',
    repaymentMonths: 2,
    monthlyDeduction: 1000,
    reason: 'Annual school fees advance',
    status: 'Approved',
    approvedBy: 'Elena Rostova',
    disbursedDate: '2026-09-12',
    remainingBalance: 2000
  }
];

const SEED_EXIT_CLEARANCES: ExitClearanceChecklistItem[] = [
  { id: 'ec-1', employeeId: 'EMP-045', category: 'IT Equipment', itemDescription: 'Company Tablet & SIM Card', status: 'Pending' },
  { id: 'ec-2', employeeId: 'EMP-045', category: 'Tools & Machinery', itemDescription: 'CNC Toolholder & Measuring Calipers', status: 'Returned', clearedBy: 'Workshop Supervisor' },
  { id: 'ec-3', employeeId: 'EMP-045', category: 'Safety & PPE', itemDescription: 'Harness & Safety Helmet Return', status: 'Returned', clearedBy: 'HSE Officer' },
  { id: 'ec-4', employeeId: 'EMP-045', category: 'Finance & Advances', itemDescription: 'Outstanding Loan Reconciliation', status: 'Pending' },
  { id: 'ec-5', employeeId: 'EMP-045', category: 'HR Documents', itemDescription: 'Signed Exit Interview & Experience Letter', status: 'Pending' }
];

// --- CENTRAL HR SERVICE CLASS ---
class HRService {
  private companies: HRCompany[] = [];
  private branches: HRBranch[] = [];
  private departments: HRDepartment[] = [];
  private jobGrades: HRJobGrade[] = [];
  private positions: HRPosition[] = [];
  private vacancies: HRVacancy[] = [];
  private candidates: HRCandidate[] = [];
  private employees: HREmployeeMaster[] = [];
  private shifts: HRShift[] = [];
  private rosters: HREmployeeRoster[] = [];
  private attendance: HRAttendanceRecord[] = [];
  private timesheets: HRProjectTimesheet[] = [];
  private overtime: HROvertimeRequest[] = [];
  private leaveTypes: HRLeaveType[] = [];
  private leaveBalances: HRLeaveBalance[] = [];
  private leaveRequests: HRLeaveRequest[] = [];
  private cases: HRCase[] = [];
  private assets: HREmployeeAsset[] = [];
  private documents: HRDocument[] = [];
  private kpis: HRKPIDefinition[] = [];
  private terminals: BiometricTerminalConfig[] = [];
  private biometricLogs: BiometricPunchLog[] = [];
  private lifecycleEvents: EmployeeLifecycleEvent[] = [];
  private salaryAdvances: SalaryAdvanceRecord[] = [];
  private exitClearances: ExitClearanceChecklistItem[] = [];
  private activeSubPortal: HRPortalView = 'executive';

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    this.companies = this.getStored(STORAGE_KEYS.COMPANIES, SEED_COMPANIES);
    this.branches = this.getStored(STORAGE_KEYS.BRANCHES, SEED_BRANCHES);
    this.departments = this.getStored(STORAGE_KEYS.DEPARTMENTS, SEED_DEPARTMENTS);
    this.jobGrades = this.getStored(STORAGE_KEYS.JOB_GRADES, SEED_JOB_GRADES);
    this.positions = this.getStored(STORAGE_KEYS.POSITIONS, SEED_POSITIONS);
    this.vacancies = this.getStored(STORAGE_KEYS.VACANCIES, SEED_VACANCIES);
    this.candidates = this.getStored(STORAGE_KEYS.CANDIDATES, SEED_CANDIDATES);
    this.employees = this.getStored(STORAGE_KEYS.EMPLOYEES, SEED_EMPLOYEES);
    this.shifts = this.getStored(STORAGE_KEYS.SHIFTS, SEED_SHIFTS);
    this.rosters = this.getStored(STORAGE_KEYS.ROSTERS, SEED_ROSTERS);
    this.attendance = this.getStored(STORAGE_KEYS.ATTENDANCE, SEED_ATTENDANCE);
    this.timesheets = this.getStored(STORAGE_KEYS.TIMESHEETS, SEED_TIMESHEETS);
    this.overtime = this.getStored(STORAGE_KEYS.OVERTIME, SEED_OVERTIME);
    this.leaveTypes = this.getStored(STORAGE_KEYS.LEAVE_TYPES, SEED_LEAVE_TYPES);
    this.leaveBalances = this.getStored(STORAGE_KEYS.LEAVE_BALANCES, SEED_LEAVE_BALANCES);
    this.leaveRequests = this.getStored(STORAGE_KEYS.LEAVE_REQUESTS, SEED_LEAVE_REQUESTS);
    this.cases = this.getStored(STORAGE_KEYS.CASES, SEED_CASES);
    this.assets = this.getStored(STORAGE_KEYS.ASSETS, SEED_ASSETS);
    this.documents = this.getStored(STORAGE_KEYS.DOCUMENTS, SEED_DOCUMENTS);
    this.kpis = this.getStored(STORAGE_KEYS.KPIS, SEED_KPIS);
    this.terminals = this.getStored(STORAGE_KEYS.TERMINALS, SEED_TERMINALS);
    this.biometricLogs = this.getStored(STORAGE_KEYS.BIOMETRIC_LOGS, SEED_BIOMETRIC_LOGS);
    this.lifecycleEvents = this.getStored(STORAGE_KEYS.LIFECYCLE, SEED_LIFECYCLE_EVENTS);
    this.salaryAdvances = this.getStored(STORAGE_KEYS.SALARY_ADVANCES, SEED_SALARY_ADVANCES);
    this.exitClearances = this.getStored(STORAGE_KEYS.EXIT_CLEARANCES, SEED_EXIT_CLEARANCES);
  }

  private getStored<T>(key: string, fallback: T): T {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch {
      return fallback;
    }
  }

  private persist(key: string, data: any) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch {
      // ignore
    }
  }

  // --- Sub-Portal Navigation State ---
  public getActiveSubPortal(): HRPortalView {
    return this.activeSubPortal;
  }

  public setActiveSubPortal(view: HRPortalView) {
    this.activeSubPortal = view;
  }

  // --- RBAC / ABAC Permission Helper ---
  public canViewSalaries(user: SecurityUser | null): boolean {
    if (!user) return false;
    if (user.roleName === 'Super Administrator' || user.id === 'usr-admin-01') return true;
    return user.department === 'COMMERCIAL_ADMIN' || user.roleName.includes('HR') || user.roleName.includes('Finance') || user.roleName.includes('CEO');
  }

  public canManageDisciplinary(user: SecurityUser | null): boolean {
    if (!user) return false;
    if (user.roleName === 'Super Administrator' || user.id === 'usr-admin-01') return true;
    return user.department === 'COMMERCIAL_ADMIN' || user.designation.includes('HR') || user.designation.includes('Director');
  }

  // --- 1. Organization & Positions ---
  public getCompanies(): HRCompany[] {
    return [...this.companies];
  }

  public getBranches(): HRBranch[] {
    return [...this.branches];
  }

  public getDepartments(): HRDepartment[] {
    return [...this.departments];
  }

  public getJobGrades(): HRJobGrade[] {
    return [...this.jobGrades];
  }

  public getPositions(): HRPosition[] {
    return [...this.positions];
  }

  public savePosition(user: SecurityUser | null, position: HRPosition): HRPosition {
    const existingIndex = this.positions.findIndex(p => p.id === position.id);
    if (existingIndex >= 0) {
      this.positions[existingIndex] = position;
    } else {
      this.positions.push(position);
    }
    this.persist(STORAGE_KEYS.POSITIONS, this.positions);
    centralApiGateway.dispatchNotification(user, 'Position Master Updated', `Position ${position.title} (${position.positionCode}) updated.`, 'info', 'hr', position.id);
    return position;
  }

  // --- 2. Employee Master & Profiles ---
  public getEmployees(user: SecurityUser | null = null): HREmployeeMaster[] {
    const showSalary = this.canViewSalaries(user);
    return this.employees.map(emp => {
      if (showSalary) return emp;
      return {
        ...emp,
        basicSalary: 0,
        housingAllowance: 0,
        transportAllowance: 0,
        otherAllowances: 0,
        grossSalary: 0
      };
    });
  }

  public getEmployeeById(id: string, user: SecurityUser | null): HREmployeeMaster | undefined {
    const emp = this.employees.find(e => e.id === id);
    if (!emp) return undefined;
    if (this.canViewSalaries(user)) return emp;
    return {
      ...emp,
      basicSalary: 0,
      housingAllowance: 0,
      transportAllowance: 0,
      otherAllowances: 0,
      grossSalary: 0
    };
  }

  public saveEmployee(user: SecurityUser | null, employee: HREmployeeMaster): HREmployeeMaster {
    const idx = this.employees.findIndex(e => e.id === employee.id);
    const isNew = idx < 0;
    if (isNew) {
      this.employees.unshift(employee);
    } else {
      // Maintain history if position or salary changed
      const old = this.employees[idx];
      if (old.positionTitle !== employee.positionTitle || old.grossSalary !== employee.grossSalary) {
        employee.history = [
          {
            id: `hist-${Date.now()}`,
            effectiveDate: new Date().toISOString().split('T')[0],
            changeType: old.positionTitle !== employee.positionTitle ? 'Promotion' : 'Salary Revision',
            oldValue: `${old.positionTitle} (${old.currency} ${old.grossSalary})`,
            newValue: `${employee.positionTitle} (${employee.currency} ${employee.grossSalary})`,
            reason: 'Administrative update in Employee Master',
            approvedBy: user?.fullName || 'HR Administrator'
          },
          ...(employee.history || [])
        ];
      }
      this.employees[idx] = employee;
    }
    this.persist(STORAGE_KEYS.EMPLOYEES, this.employees);
    centralApiGateway.dispatchNotification(
      user, 
      isNew ? 'New Employee Onboarded' : 'Employee Record Updated', 
      `${employee.fullName} (${employee.employeeCode}) master record saved.`, 
      'info', 
      'hr', 
      employee.id
    );
    return employee;
  }

  // --- 3. Recruitment / ATS ---
  public getVacancies(): HRVacancy[] {
    return [...this.vacancies];
  }

  public saveVacancy(user: SecurityUser | null, vacancy: HRVacancy): HRVacancy {
    const idx = this.vacancies.findIndex(v => v.id === vacancy.id);
    if (idx >= 0) {
      this.vacancies[idx] = vacancy;
    } else {
      this.vacancies.unshift(vacancy);
    }
    this.persist(STORAGE_KEYS.VACANCIES, this.vacancies);
    centralApiGateway.dispatchNotification(user, 'Job Requisition Logged', `Vacancy ${vacancy.positionTitle} (${vacancy.requisitionNumber}) saved.`, 'info', 'hr', vacancy.id);
    return vacancy;
  }

  public getCandidates(vacancyId?: string): HRCandidate[] {
    if (vacancyId) {
      return this.candidates.filter(c => c.vacancyId === vacancyId);
    }
    return [...this.candidates];
  }

  public saveCandidate(user: SecurityUser | null, candidate: HRCandidate): HRCandidate {
    const idx = this.candidates.findIndex(c => c.id === candidate.id);
    if (idx >= 0) {
      this.candidates[idx] = candidate;
    } else {
      this.candidates.unshift(candidate);
    }
    this.persist(STORAGE_KEYS.CANDIDATES, this.candidates);
    if (user) {
      centralApiGateway.dispatchNotification(user, 'Candidate Record Saved', `${candidate.fullName} profile updated`, 'info', 'hr', candidate.id);
    }
    return candidate;
  }

  public updateCandidateStage(user: SecurityUser | null, candidateId: string, stage: HRCandidate['stage'], notes?: string): HRCandidate {
    const cand = this.candidates.find(c => c.id === candidateId);
    if (!cand) throw new Error('Candidate not found');
    cand.stage = stage;
    if (notes) cand.interviewNotes = notes;
    this.persist(STORAGE_KEYS.CANDIDATES, this.candidates);
    centralApiGateway.dispatchNotification(user, 'Candidate Stage Updated', `${cand.fullName} moved to ${stage}`, 'info', 'hr', candidateId);
    return cand;
  }

  // --- 4. Attendance, Shifts & Overtime ---
  public getShifts(): HRShift[] {
    return [...this.shifts];
  }

  public getRosters(): HREmployeeRoster[] {
    return [...this.rosters];
  }

  public getAttendanceRecords(date?: string): HRAttendanceRecord[] {
    if (date) {
      return this.attendance.filter(a => a.date === date);
    }
    return [...this.attendance];
  }

  public punchClock(user: SecurityUser | null, employeeId: string, punchType: 'IN' | 'OUT', source: HRAttendanceRecord['source'] = 'WEB'): HRAttendanceRecord {
    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toTimeString().split(' ')[0].substring(0, 5); // "HH:MM"
    const emp = this.employees.find(e => e.id === employeeId);
    const empName = emp ? emp.fullName : (user?.fullName || 'Employee');
    const badge = emp ? emp.badgeNumber : 'BADGE-GEN';
    const dept = emp ? emp.departmentCode : 'FABRICATION';

    let record = this.attendance.find(a => a.employeeId === employeeId && a.date === today);
    if (!record) {
      record = {
        id: `att-${Date.now()}`,
        employeeId,
        employeeName: empName,
        badgeNumber: badge,
        departmentCode: dept,
        date: today,
        shiftCode: 'SHIFT-MORN',
        scheduledStart: '07:00',
        scheduledEnd: '15:30',
        actualClockIn: nowTime,
        totalWorkedMinutes: 0,
        lateMinutes: 0,
        earlyDepartureMinutes: 0,
        overtimeMinutes: 0,
        status: 'Present',
        source,
        locationPin: 'Innovista Geofence Checked'
      };
      this.attendance.unshift(record);
    } else {
      if (punchType === 'OUT') {
        record.actualClockOut = nowTime;
        // Calculate worked minutes roughly
        const [inH, inM] = record.actualClockIn.split(':').map(Number);
        const [outH, outM] = nowTime.split(':').map(Number);
        const diff = (outH * 60 + outM) - (inH * 60 + inM);
        record.totalWorkedMinutes = Math.max(0, diff);
        if (record.totalWorkedMinutes > 480) {
          record.overtimeMinutes = record.totalWorkedMinutes - 480;
        }
      }
    }
    this.persist(STORAGE_KEYS.ATTENDANCE, this.attendance);
    centralApiGateway.dispatchNotification(user, `Clock ${punchType} Logged`, `${empName} punched ${punchType} at ${nowTime} via ${source}`, 'info', 'hr', record.id);
    return record;
  }

  public getTimesheets(projectId?: string): HRProjectTimesheet[] {
    if (projectId) {
      return this.timesheets.filter(t => t.projectId === projectId);
    }
    return [...this.timesheets];
  }

  public saveTimesheet(user: SecurityUser | null, timesheet: HRProjectTimesheet): HRProjectTimesheet {
    const idx = this.timesheets.findIndex(t => t.id === timesheet.id);
    if (idx >= 0) {
      this.timesheets[idx] = timesheet;
    } else {
      this.timesheets.unshift(timesheet);
    }
    this.persist(STORAGE_KEYS.TIMESHEETS, this.timesheets);
    if (user) {
      centralApiGateway.dispatchNotification(user, 'Timesheet Recorded', `${timesheet.employeeName} logged ${timesheet.hoursWorked} hrs`, 'info', 'hr', timesheet.id);
    }
    return timesheet;
  }

  public getOvertimeRequests(): HROvertimeRequest[] {
    return [...this.overtime];
  }

  public saveOvertimeRequest(user: SecurityUser | null, ot: HROvertimeRequest): HROvertimeRequest {
    const idx = this.overtime.findIndex(o => o.id === ot.id);
    if (idx >= 0) {
      this.overtime[idx] = ot;
    } else {
      this.overtime.unshift(ot);
    }
    this.persist(STORAGE_KEYS.OVERTIME, this.overtime);
    if (user) {
      centralApiGateway.dispatchNotification(user, 'Overtime Requested', `${ot.employeeName} requested ${ot.hoursRequested} hrs OT`, 'info', 'hr', ot.id);
    }
    return ot;
  }

  // --- 5. Leave Management ---
  public getLeaveTypes(): HRLeaveType[] {
    return [...this.leaveTypes];
  }

  public getLeaveBalances(employeeId?: string): HRLeaveBalance[] {
    if (employeeId) {
      return this.leaveBalances.filter(b => b.employeeId === employeeId);
    }
    return [...this.leaveBalances];
  }

  public getLeaveRequests(employeeId?: string): HRLeaveRequest[] {
    if (employeeId) {
      return this.leaveRequests.filter(r => r.employeeId === employeeId);
    }
    return [...this.leaveRequests];
  }

  public submitLeaveRequest(user: SecurityUser | null, request: HRLeaveRequest): HRLeaveRequest {
    this.leaveRequests.unshift(request);
    this.persist(STORAGE_KEYS.LEAVE_REQUESTS, this.leaveRequests);
    centralApiGateway.dispatchNotification(user, 'Leave Request Submitted', `${request.employeeName} submitted ${request.totalDays} days of ${request.leaveTypeName}`, 'info', 'hr', request.id);
    return request;
  }

  public reviewLeaveRequest(user: SecurityUser | null, requestId: string, decision: 'Approved' | 'Rejected', comments?: string): HRLeaveRequest {
    const req = this.leaveRequests.find(r => r.id === requestId);
    if (!req) throw new Error('Leave request not found');
    req.status = decision;
    req.approvedBy = user?.fullName || 'Manager';
    req.approvedAt = new Date().toISOString();
    req.approverComments = comments;

    if (decision === 'Approved') {
      // Deduct from balance
      const bal = this.leaveBalances.find(b => b.employeeId === req.employeeId && b.leaveTypeCode === req.leaveTypeCode);
      if (bal) {
        bal.taken += req.totalDays;
        bal.balance = Math.max(0, bal.entitled - bal.taken);
        this.persist(STORAGE_KEYS.LEAVE_BALANCES, this.leaveBalances);
      }
    }

    this.persist(STORAGE_KEYS.LEAVE_REQUESTS, this.leaveRequests);
    centralApiGateway.dispatchNotification(user, `Leave Request ${decision}`, `${req.employeeName} leave request for ${req.totalDays} days was ${decision}.`, decision === 'Approved' ? 'info' : 'warning', 'hr', requestId);
    return req;
  }

  // --- 6. Employee Relations, Disciplinary & Grievances ---
  public getCases(user: SecurityUser | null): HRCase[] {
    if (!this.canManageDisciplinary(user)) {
      // Only show non-confidential or cases where user is the subject
      return this.cases.filter(c => c.employeeId === user?.id || c.confidentiality === 'Confidential');
    }
    return [...this.cases];
  }

  public saveCase(user: SecurityUser | null, hrCase: HRCase): HRCase {
    const idx = this.cases.findIndex(c => c.id === hrCase.id);
    if (idx >= 0) {
      this.cases[idx] = hrCase;
    } else {
      this.cases.unshift(hrCase);
    }
    this.persist(STORAGE_KEYS.CASES, this.cases);
    centralApiGateway.dispatchNotification(user, 'HR Case Updated', `Case ${hrCase.caseNumber} status is now ${hrCase.status}`, 'warning', 'hr', hrCase.id);
    return hrCase;
  }

  // --- 7. Employee Assets ---
  public getAssets(employeeId?: string): HREmployeeAsset[] {
    if (employeeId) {
      return this.assets.filter(a => a.assignedToEmployeeId === employeeId);
    }
    return [...this.assets];
  }

  public saveAsset(user: SecurityUser | null, asset: HREmployeeAsset): HREmployeeAsset {
    const idx = this.assets.findIndex(a => a.id === asset.id);
    if (idx >= 0) {
      this.assets[idx] = asset;
    } else {
      this.assets.unshift(asset);
    }
    this.persist(STORAGE_KEYS.ASSETS, this.assets);
    if (user) {
      centralApiGateway.dispatchNotification(user, 'Asset Assigned', `${asset.modelName} assigned to ${asset.assignedToEmployeeName}`, 'info', 'hr', asset.id);
    }
    return asset;
  }

  // --- 8. Documents & Compliance ---
  public getDocuments(employeeId?: string): HRDocument[] {
    if (employeeId) {
      return this.documents.filter(d => d.employeeId === employeeId);
    }
    return [...this.documents];
  }

  public saveDocument(user: SecurityUser | null, doc: HRDocument): HRDocument {
    const idx = this.documents.findIndex(d => d.id === doc.id);
    if (idx >= 0) {
      this.documents[idx] = doc;
    } else {
      this.documents.unshift(doc);
    }
    this.persist(STORAGE_KEYS.DOCUMENTS, this.documents);
    if (user) {
      centralApiGateway.dispatchNotification(user, 'Document Saved', `${doc.fileName} uploaded for ${doc.employeeName}`, 'info', 'hr', doc.id);
    }
    return doc;
  }

  // --- 9. Analytics & KPI Engine ---
  public getKPIs(): HRKPIDefinition[] {
    return [...this.kpis];
  }

  public getWorkforceSnapshot(): HRWorkforceSnapshot {
    const total = this.employees.length;
    const active = this.employees.filter(e => e.employmentStatus === 'Active').length;
    const probation = this.employees.filter(e => e.employmentStatus === 'Probation' || !e.isConfirmed).length;
    const contract = this.employees.filter(e => e.employmentType === 'Contract' || e.employmentType === 'Fixed-Term').length;
    const grossTotal = this.employees.reduce((sum, e) => sum + (e.grossSalary || 0), 0);
    const expiringDocs = this.documents.filter(d => d.status === 'Expiring Soon' || d.status === 'Expired').length;
    const pendingLeave = this.leaveRequests.filter(l => l.status === 'Pending').length;

    return {
      totalHeadcount: total,
      activeHeadcount: active,
      probationCount: probation,
      contractCount: contract,
      monthlyPayrollTotal: grossTotal,
      openVacanciesCount: this.vacancies.filter(v => v.status === 'Open' || v.status === 'Interviewing').length,
      turnoverRatePercent: 3.2,
      absenteeismRatePercent: 1.8,
      averageOvertimeHours: 6.4,
      expiringDocumentsCount: expiringDocs,
      pendingApprovalsCount: pendingLeave
    };
  }

  // --- 10. Biometric & Laser Scanning Hardware Ingestion Engine ---
  public getBiometricTerminals(): BiometricTerminalConfig[] {
    return [...this.terminals];
  }

  public getBiometricLogs(date?: string): BiometricPunchLog[] {
    if (date) {
      return this.biometricLogs.filter(b => b.date === date);
    }
    return [...this.biometricLogs];
  }

  public punchBiometricOrLaser(
    user: SecurityUser | null,
    logInput: Omit<BiometricPunchLog, 'id' | 'timestamp' | 'isSyncedToTimesheet'>
  ): { punch: BiometricPunchLog; timesheet?: HRProjectTimesheet } {
    const timestamp = new Date().toISOString();
    const id = `bio-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const punch: BiometricPunchLog = {
      ...logInput,
      id,
      timestamp,
      isSyncedToTimesheet: true
    };

    this.biometricLogs.unshift(punch);
    this.persist(STORAGE_KEYS.BIOMETRIC_LOGS, this.biometricLogs);

    // 1. Update Attendance Record
    const attendanceSource = logInput.verificationMethod === 'LASER_BARCODE' ? 'LASER_BARCODE' as any : 'BIOMETRIC';
    const clockType = (logInput.punchType === 'CHECK_IN' || logInput.punchType === 'BREAK_IN' || logInput.punchType === 'OT_IN') ? 'IN' : 'OUT';
    this.punchClock(user, logInput.employeeId, clockType, attendanceSource);

    // 2. Automatically generate / link Timesheet entry for project tracking
    let createdTimesheet: HRProjectTimesheet | undefined;
    const projectTarget = logInput.projectId || 'Sirius Mall Storefront';
    const isOT = logInput.punchType === 'OT_IN' || logInput.punchType === 'OT_OUT' || !!logInput.isOvertime;
    const hours = isOT ? 4 : 8;

    createdTimesheet = {
      id: `ts-${Date.now()}`,
      employeeId: logInput.employeeId,
      employeeName: logInput.employeeName,
      date: logInput.date,
      projectId: projectTarget,
      projectCode: 'PRJ-SM-01',
      workPackageCode: 'WP-FAB-01',
      taskActivity: `${logInput.verificationMethod.replace('_', ' ')} scan at ${logInput.time} - [${logInput.punchType}]`,
      startHour: '08:00',
      endHour: isOT ? '20:00' : '17:00',
      hoursWorked: hours,
      isOvertime: isOT,
      hourlyCostRate: 150,
      totalLaborCost: hours * 150,
      supervisorId: 'sup-01',
      supervisorName: 'Auto-Biometric Gate Sync',
      status: 'Approved'
    };

    punch.timesheetEntryId = createdTimesheet.id;
    this.saveTimesheet(user, createdTimesheet);

    if (user) {
      centralApiGateway.dispatchNotification(
        user,
        `${logInput.verificationMethod} Record Ingested`,
        `${logInput.employeeName} (${logInput.badgeNumber}) punched ${logInput.punchType} at ${logInput.time}`,
        'info',
        'hr',
        punch.id
      );
    }

    return { punch, timesheet: createdTimesheet };
  }

  public syncBiometricTerminal(user: SecurityUser | null, terminalId: string): number {
    const term = this.terminals.find(t => t.id === terminalId);
    if (!term) return 0;

    const count = term.bufferedRecordCount;
    term.bufferedRecordCount = 0;
    term.lastPingTime = new Date().toISOString();
    term.status = 'ONLINE';
    this.persist(STORAGE_KEYS.TERMINALS, this.terminals);

    // Generate simulated synced punch logs for buffered records
    const sampleStaff = this.employees.slice(0, Math.min(count, this.employees.length));
    sampleStaff.forEach((emp, i) => {
      const punchId = `bio-sync-${Date.now()}-${i}`;
      const log: BiometricPunchLog = {
        id: punchId,
        terminalId: term.id,
        terminalName: term.name,
        employeeId: emp.employeeCode,
        employeeName: emp.fullName,
        badgeNumber: emp.badgeNumber,
        timestamp: new Date().toISOString(),
        date: new Date().toISOString().split('T')[0],
        time: '07:30',
        punchType: 'CHECK_IN',
        verificationMethod: term.terminalType === 'Honeywell_Laser' || term.terminalType === 'Zebra_Scanner' ? 'LASER_BARCODE' : 'FINGERPRINT',
        matchScore: 99.1,
        projectId: 'Sirius Mall Storefront',
        projectName: 'Sirius Mall Storefront',
        isSyncedToTimesheet: true
      };
      this.biometricLogs.unshift(log);
    });

    this.persist(STORAGE_KEYS.BIOMETRIC_LOGS, this.biometricLogs);
    if (user) {
      centralApiGateway.dispatchNotification(user, 'Terminal Buffer Flushed', `Ingested ${count} biometric records from ${term.name}`, 'info', 'hr', term.id);
    }
    return count;
  }

  public syncAllBiometricTerminals(user: SecurityUser | null): number {
    let total = 0;
    this.terminals.forEach(t => {
      total += this.syncBiometricTerminal(user, t.id);
    });
    return total;
  }

  public importRawBiometricFile(
    user: SecurityUser | null,
    fileContent: string
  ): { count: number; parsedLogs: BiometricPunchLog[] } {
    const lines = fileContent.split('\n').filter(l => l.trim().length > 0);
    const parsedLogs: BiometricPunchLog[] = [];
    const today = new Date().toISOString().split('T')[0];

    lines.forEach((line, idx) => {
      // Accept CSV or tab-delimited: EmployeeId/Badge, Date, Time, PunchType
      const parts = line.split(/[,\t]+/).map(p => p.trim().replace(/^["']|["']$/g, ''));
      if (parts.length >= 2) {
        const badgeOrId = parts[0];
        const emp = this.employees.find(e => e.employeeCode === badgeOrId || e.badgeNumber === badgeOrId) || this.employees[idx % this.employees.length];
        const dateStr = parts[1] || today;
        const timeStr = parts[2] || '07:15';
        const punchTypeRaw = (parts[3] || 'CHECK_IN').toUpperCase();
        const punchType: BiometricPunchType = punchTypeRaw.includes('OUT') ? 'CHECK_OUT' : 'CHECK_IN';

        const punch: BiometricPunchLog = {
          id: `bio-imp-${Date.now()}-${idx}`,
          terminalId: 'term-file-import',
          terminalName: 'Raw Biometric File Import',
          employeeId: emp.employeeCode,
          employeeName: emp.fullName,
          badgeNumber: emp.badgeNumber,
          timestamp: new Date().toISOString(),
          date: dateStr,
          time: timeStr,
          punchType,
          verificationMethod: 'LASER_BARCODE',
          matchScore: 100,
          projectId: 'Sirius Mall Storefront',
          projectName: 'Sirius Mall Storefront',
          isSyncedToTimesheet: true
        };
        parsedLogs.push(punch);
        this.biometricLogs.unshift(punch);
      }
    });

    this.persist(STORAGE_KEYS.BIOMETRIC_LOGS, this.biometricLogs);
    if (user) {
      centralApiGateway.dispatchNotification(user, 'Biometric Batch File Uploaded', `Successfully parsed and recorded ${parsedLogs.length} punch rows.`, 'info', 'hr');
    }
    return { count: parsedLogs.length, parsedLogs };
  }

  // --- 11. Employee Lifecycle, Salary Advances & Exit Clearances ---
  public getEmployeeLifecycle(employeeId: string): EmployeeLifecycleEvent[] {
    return this.lifecycleEvents.filter(e => e.employeeId === employeeId);
  }

  public addLifecycleEvent(user: SecurityUser | null, event: Omit<EmployeeLifecycleEvent, 'id'>): EmployeeLifecycleEvent {
    const newEvent: EmployeeLifecycleEvent = {
      ...event,
      id: `lc-${Date.now()}`
    };
    this.lifecycleEvents.unshift(newEvent);
    this.persist(STORAGE_KEYS.LIFECYCLE, this.lifecycleEvents);
    if (user) {
      centralApiGateway.dispatchNotification(user, 'Lifecycle Milestone Logged', `${newEvent.title} for ${event.employeeId}`, 'info', 'hr', newEvent.id);
    }
    return newEvent;
  }

  public getSalaryAdvances(): SalaryAdvanceRecord[] {
    return [...this.salaryAdvances];
  }

  public requestSalaryAdvance(user: SecurityUser | null, req: Omit<SalaryAdvanceRecord, 'id' | 'status' | 'remainingBalance'>): SalaryAdvanceRecord {
    const newAdv: SalaryAdvanceRecord = {
      ...req,
      id: `adv-${Date.now()}`,
      status: 'Pending',
      remainingBalance: req.amount
    };
    this.salaryAdvances.unshift(newAdv);
    this.persist(STORAGE_KEYS.SALARY_ADVANCES, this.salaryAdvances);
    if (user) {
      centralApiGateway.dispatchNotification(user, 'Salary Advance Requested', `${req.employeeName} requested AED ${req.amount.toLocaleString()}`, 'info', 'hr', newAdv.id);
    }
    return newAdv;
  }

  public updateSalaryAdvanceStatus(
    user: SecurityUser | null,
    id: string,
    status: SalaryAdvanceRecord['status'],
    approvedBy?: string
  ): SalaryAdvanceRecord | undefined {
    const adv = this.salaryAdvances.find(a => a.id === id);
    if (!adv) return undefined;
    adv.status = status;
    if (approvedBy) adv.approvedBy = approvedBy;
    if (status === 'Disbursed') adv.disbursedDate = new Date().toISOString().split('T')[0];
    this.persist(STORAGE_KEYS.SALARY_ADVANCES, this.salaryAdvances);
    if (user) {
      centralApiGateway.dispatchNotification(user, 'Salary Advance Status', `Advance ${adv.id} set to ${status}`, 'info', 'hr', adv.id);
    }
    return adv;
  }

  public getExitClearances(employeeId?: string): ExitClearanceChecklistItem[] {
    if (employeeId) {
      return this.exitClearances.filter(c => c.employeeId === employeeId);
    }
    return [...this.exitClearances];
  }

  public updateExitClearanceItem(user: SecurityUser | null, item: ExitClearanceChecklistItem): ExitClearanceChecklistItem {
    const idx = this.exitClearances.findIndex(c => c.id === item.id);
    if (idx >= 0) {
      this.exitClearances[idx] = item;
    } else {
      this.exitClearances.unshift(item);
    }
    this.persist(STORAGE_KEYS.EXIT_CLEARANCES, this.exitClearances);
    if (user) {
      centralApiGateway.dispatchNotification(user, 'Exit Clearance Updated', `${item.itemDescription} marked as ${item.status}`, 'info', 'hr', item.id);
    }
    return item;
  }

  // ============================================================================
  // 12. ADVANCED SHIFT, ARRIVAL -> LEAVE ENFORCEMENT, OVERTIME QUOTA,
  //     MEALS/TEA SCANNER, LOANS, SRI LANKAN EPF/ETF & COMPREHENSIVE PAYSHEET
  // ============================================================================

  private getAdvancedStorage<T>(key: string, fallback: T): T {
    return this.getStored(key, fallback);
  }

  private saveAdvancedStorage(key: string, data: any) {
    this.persist(key, data);
  }

  // --- A. Meal & Refreshment Definable Catalog ---
  public getMealItems(): MealRefreshmentItem[] {
    const fallback: MealRefreshmentItem[] = [
      { id: 'meal-1', code: 'TEA-MORN', name: 'Morning Tea & Biscuit', category: 'Tea', valueLKR: 150, isActive: true },
      { id: 'meal-2', code: 'LUNCH-STD', name: 'Standard Company Lunch', category: 'Lunch', valueLKR: 650, isActive: true },
      { id: 'meal-3', code: 'TEA-EVE', name: 'Evening Tea & Snack', category: 'Tea', valueLKR: 200, isActive: true },
      { id: 'meal-4', code: 'DINNER-OT', name: 'Overtime Dinner Pack', category: 'Dinner', valueLKR: 750, isActive: true },
      { id: 'meal-5', code: 'DRINK-ENR', name: 'Hydration / King Coconut', category: 'Refreshment', valueLKR: 180, isActive: true }
    ];
    return this.getAdvancedStorage('innovista_hr_meal_items_v2', fallback);
  }

  public saveMealItem(item: MealRefreshmentItem): MealRefreshmentItem[] {
    const items = this.getMealItems();
    const idx = items.findIndex(i => i.id === item.id);
    if (idx >= 0) items[idx] = item;
    else items.push(item);
    this.saveAdvancedStorage('innovista_hr_meal_items_v2', items);
    return items;
  }

  public deleteMealItem(id: string): MealRefreshmentItem[] {
    const items = this.getMealItems().filter(i => i.id !== id);
    this.saveAdvancedStorage('innovista_hr_meal_items_v2', items);
    return items;
  }

  // --- B. Meal / Tea Biometric & Card Scan Logs ---
  public getMealScans(): MealScanRecord[] {
    return this.getMealScanLogs();
  }

  public getMealScanLogs(): MealScanRecord[] {
    const today = new Date().toISOString().split('T')[0];
    const fallback: MealScanRecord[] = [
      { id: 'mscan-1', employeeId: 'EMP-041', employeeName: 'Kasun Wickramasinghe', badgeNumber: 'BDG-10041', date: today, time: '10:15', mealItemId: 'meal-1', mealItemName: 'Morning Tea & Biscuit', category: 'Tea', valueLKR: 150, method: 'RFID_TAG' },
      { id: 'mscan-2', employeeId: 'EMP-041', employeeName: 'Kasun Wickramasinghe', badgeNumber: 'BDG-10041', date: today, time: '12:40', mealItemId: 'meal-2', mealItemName: 'Standard Company Lunch', category: 'Lunch', valueLKR: 650, method: 'FINGERPRINT' },
      { id: 'mscan-3', employeeId: 'EMP-042', employeeName: 'Sachith Fernando', badgeNumber: 'BDG-10042', date: today, time: '12:45', mealItemId: 'meal-2', mealItemName: 'Standard Company Lunch', category: 'Lunch', valueLKR: 650, method: 'LASER_BARCODE' },
      { id: 'mscan-4', employeeId: 'EMP-044', employeeName: 'Pradeep Kumara', badgeNumber: 'BDG-10044', date: today, time: '15:35', mealItemId: 'meal-3', mealItemName: 'Evening Tea & Snack', category: 'Tea', valueLKR: 200, method: 'RFID_TAG' }
    ];
    return this.getAdvancedStorage('innovista_hr_meal_scans_v2', fallback);
  }

  // --- C. Employee Shift, Arrival -> Leave State, Lateness & Overtime Quota ---
  public getEmployeeShiftStates(): EmployeeAttendanceShiftState[] {
    const fallback: EmployeeAttendanceShiftState[] = [
      {
        employeeId: 'EMP-041',
        employeeName: 'Kasun Wickramasinghe',
        badgeNumber: 'BDG-10041',
        department: 'Fabrication',
        shiftCode: 'SHIFT-MORN',
        shiftName: 'Morning Shift (07:00 - 15:30)',
        shiftStartTime: '07:00',
        shiftEndTime: '15:30',
        currentState: 'ARRIVED', // Already arrived -> next action MUST be LEAVE_OUT
        lastArrivalTime: '06:52',
        isLateToday: false,
        lateMinutesToday: 0,
        totalLateMinutesMonth: 15,
        isOvertimeEligible: true,
        assignedOvertimeHours: 25,
        completedOvertimeHours: 14.5,
        overtimeHourlyRate: 1250,
        isCompanyMealFunded: true,
        monthlyMealFundAllocated: 15000,
        allowUnclaimedMealToBenefits: true,
        claimedMealsTotalLKR: 8400
      },
      {
        employeeId: 'EMP-042',
        employeeName: 'Sachith Fernando',
        badgeNumber: 'BDG-10042',
        department: 'Site Installation',
        shiftCode: 'SHIFT-MORN',
        shiftName: 'Morning Shift (07:00 - 15:30)',
        shiftStartTime: '07:00',
        shiftEndTime: '15:30',
        currentState: 'ARRIVED',
        lastArrivalTime: '07:18',
        isLateToday: true,
        lateMinutesToday: 18,
        totalLateMinutesMonth: 48,
        isOvertimeEligible: true,
        assignedOvertimeHours: 20,
        completedOvertimeHours: 12,
        overtimeHourlyRate: 1100,
        isCompanyMealFunded: true,
        monthlyMealFundAllocated: 12000,
        allowUnclaimedMealToBenefits: true,
        claimedMealsTotalLKR: 9650
      },
      {
        employeeId: 'EMP-043',
        employeeName: 'Dinesh Jayawardena',
        badgeNumber: 'BDG-10043',
        department: 'Safety & QA',
        shiftCode: 'SHIFT-GEN',
        shiftName: 'General Shift (08:00 - 17:00)',
        shiftStartTime: '08:00',
        shiftEndTime: '17:00',
        currentState: 'NOT_ARRIVED',
        isLateToday: false,
        lateMinutesToday: 0,
        totalLateMinutesMonth: 0,
        isOvertimeEligible: false,
        assignedOvertimeHours: 0,
        completedOvertimeHours: 0,
        overtimeHourlyRate: 1400,
        isCompanyMealFunded: true,
        monthlyMealFundAllocated: 15000,
        allowUnclaimedMealToBenefits: false,
        claimedMealsTotalLKR: 11200
      },
      {
        employeeId: 'EMP-044',
        employeeName: 'Pradeep Kumara',
        badgeNumber: 'BDG-10044',
        department: 'Site Installation',
        shiftCode: 'SHIFT-MORN',
        shiftName: 'Morning Shift (07:00 - 15:30)',
        shiftStartTime: '07:00',
        shiftEndTime: '15:30',
        currentState: 'ARRIVED',
        lastArrivalTime: '07:08',
        isLateToday: true,
        lateMinutesToday: 8,
        totalLateMinutesMonth: 28,
        isOvertimeEligible: true,
        assignedOvertimeHours: 30,
        completedOvertimeHours: 22,
        overtimeHourlyRate: 1050,
        isCompanyMealFunded: false, // Company NOT allocated funds -> deduct from salary/benefits
        monthlyMealFundAllocated: 0,
        allowUnclaimedMealToBenefits: false,
        claimedMealsTotalLKR: 6800
      },
      {
        employeeId: 'EMP-045',
        employeeName: 'Roshan Samarasekera',
        badgeNumber: 'BDG-10045',
        department: 'Machining',
        shiftCode: 'SHIFT-GEN',
        shiftName: 'General Shift (08:00 - 17:00)',
        shiftStartTime: '08:00',
        shiftEndTime: '17:00',
        currentState: 'ON_LEAVE_OUT',
        lastArrivalTime: '07:55',
        lastLeaveTime: '18:30',
        isLateToday: false,
        lateMinutesToday: 0,
        totalLateMinutesMonth: 10,
        isOvertimeEligible: true,
        assignedOvertimeHours: 15,
        completedOvertimeHours: 15, // Completed all assigned OT
        overtimeHourlyRate: 1150,
        isCompanyMealFunded: false,
        monthlyMealFundAllocated: 0,
        allowUnclaimedMealToBenefits: false,
        claimedMealsTotalLKR: 5400
      }
    ];
    return this.getAdvancedStorage('innovista_hr_shift_states_v2', fallback);
  }

  public saveEmployeeShiftState(state: EmployeeAttendanceShiftState): EmployeeAttendanceShiftState[] {
    const states = this.getEmployeeShiftStates();
    const idx = states.findIndex(s => s.employeeId === state.employeeId);
    if (idx >= 0) states[idx] = state;
    else states.push(state);
    this.saveAdvancedStorage('innovista_hr_shift_states_v2', states);
    return states;
  }

  // Record Meal or Tea Scan by Biometrics / Card / Laser
  public recordMealOrTeaScan(
    employeeId: string,
    mealItemId: string,
    method: BiometricVerificationMethod = 'RFID_TAG',
    customTime?: string
  ): { scan: MealScanRecord; updatedShiftState?: EmployeeAttendanceShiftState } {
    const items = this.getMealItems();
    const item = items.find(m => m.id === mealItemId) || items[0];
    const states = this.getEmployeeShiftStates();
    const st = states.find(s => s.employeeId === employeeId) || states[0];

    const today = new Date().toISOString().split('T')[0];
    const time = customTime || new Date().toTimeString().split(' ')[0].substring(0, 5);

    const scan: MealScanRecord = {
      id: `mscan-${Date.now()}`,
      employeeId: st.employeeId,
      employeeName: st.employeeName,
      badgeNumber: st.badgeNumber,
      date: today,
      time,
      mealItemId: item.id,
      mealItemName: item.name,
      category: item.category,
      valueLKR: item.valueLKR,
      method
    };

    const logs = this.getMealScanLogs();
    logs.unshift(scan);
    this.saveAdvancedStorage('innovista_hr_meal_scans_v2', logs);

    // Update employee claimed meal total
    st.claimedMealsTotalLKR = (st.claimedMealsTotalLKR || 0) + item.valueLKR;
    this.saveEmployeeShiftState(st);

    return { scan, updatedShiftState: st };
  }

  // Process Advanced Arrival -> Leave State Machine, Shift Late Detection & Overtime Completion
  public processSmartAttendanceScan(params: {
    employeeId: string;
    employeeName: string;
    badgeNumber: string;
    time: string; // "HH:MM"
    method: BiometricVerificationMethod;
    projectId?: string;
    requestedAction?: 'AUTO' | 'ARRIVAL' | 'LEAVE_OUT';
  }): {
    actionRecorded: 'CHECK_IN' | 'LEAVE_OUT';
    isLate: boolean;
    lateMinutes: number;
    otAddedHours: number;
    remainingOtHours: number;
    updatedState: EmployeeAttendanceShiftState;
    punchLog: BiometricPunchLog;
    message: string;
  } {
    const states = this.getEmployeeShiftStates();
    let st = states.find(s => s.employeeId === params.employeeId);
    if (!st) {
      st = {
        employeeId: params.employeeId,
        employeeName: params.employeeName,
        badgeNumber: params.badgeNumber,
        department: 'Fabrication',
        shiftCode: 'SHIFT-MORN',
        shiftName: 'Morning Shift (07:00 - 15:30)',
        shiftStartTime: '07:00',
        shiftEndTime: '15:30',
        currentState: 'NOT_ARRIVED',
        isLateToday: false,
        lateMinutesToday: 0,
        totalLateMinutesMonth: 0,
        isOvertimeEligible: true,
        assignedOvertimeHours: 20,
        completedOvertimeHours: 5,
        overtimeHourlyRate: 1200,
        isCompanyMealFunded: true,
        monthlyMealFundAllocated: 12000,
        allowUnclaimedMealToBenefits: true,
        claimedMealsTotalLKR: 4000
      };
    }

    const toMinutes = (hhmm: string) => {
      const [h, m] = hhmm.split(':').map(Number);
      return (h || 0) * 60 + (m || 0);
    };

    const punchMin = toMinutes(params.time);
    const shiftStartMin = toMinutes(st.shiftStartTime);
    const shiftEndMin = toMinutes(st.shiftEndTime);

    // Rule 1: Once employee records arrival to the company, he must put the next one as a leave
    let effectiveAction: 'CHECK_IN' | 'LEAVE_OUT';
    if (st.currentState === 'ARRIVED') {
      effectiveAction = 'LEAVE_OUT';
    } else {
      effectiveAction = params.requestedAction === 'LEAVE_OUT' ? 'LEAVE_OUT' : 'CHECK_IN';
    }

    let isLate = false;
    let lateMinutes = 0;
    let otAddedHours = 0;
    let message = '';

    if (effectiveAction === 'CHECK_IN') {
      // Rule 2: Must arrive at the time the shift is on; after that time it will be a LATE
      if (punchMin > shiftStartMin) {
        isLate = true;
        lateMinutes = punchMin - shiftStartMin;
        st.isLateToday = true;
        st.lateMinutesToday = lateMinutes;
        st.totalLateMinutesMonth += lateMinutes;
        message = `LATE ARRIVAL (+${lateMinutes} mins after ${st.shiftStartTime} shift). Next punch locked to LEAVE.`;
      } else {
        st.isLateToday = false;
        st.lateMinutesToday = 0;
        message = `ON-TIME ARRIVAL (${params.time} <= ${st.shiftStartTime}). Next punch locked to LEAVE.`;
      }
      st.currentState = 'ARRIVED';
      st.lastArrivalTime = params.time;
    } else {
      // Rule 3: Leaving after shift end time -> if approved/eligible for overtime, count OT until assigned OT completion
      st.currentState = 'ON_LEAVE_OUT';
      st.lastLeaveTime = params.time;
      isLate = st.isLateToday;
      lateMinutes = st.lateMinutesToday;

      if (punchMin > shiftEndMin && st.isOvertimeEligible) {
        const extraHoursRaw = Number(((punchMin - shiftEndMin) / 60).toFixed(2));
        const remainingQuota = Math.max(0, st.assignedOvertimeHours - st.completedOvertimeHours);
        otAddedHours = Number(Math.min(extraHoursRaw, remainingQuota).toFixed(2));
        st.completedOvertimeHours = Number((st.completedOvertimeHours + otAddedHours).toFixed(2));
        const newRemaining = Math.max(0, Number((st.assignedOvertimeHours - st.completedOvertimeHours).toFixed(2)));
        if (otAddedHours > 0) {
          message = `LEAVE RECORDED (${params.time}). +${otAddedHours}h Overtime credited (${st.completedOvertimeHours}/${st.assignedOvertimeHours}h completed, ${newRemaining}h left).`;
        } else {
          message = `LEAVE RECORDED (${params.time}). All assigned OT (${st.assignedOvertimeHours}h) already completed.`;
        }
      } else {
        message = `LEAVE / DEPARTURE RECORDED at ${params.time}. Next scan reset to ARRIVAL.`;
      }
    }

    this.saveEmployeeShiftState(st);

    const today = new Date().toISOString().split('T')[0];
    const { punch } = this.punchBiometricOrLaser(null, {
      terminalId: params.method === 'LASER_BARCODE' ? 'term-3' : 'term-1',
      terminalName: params.method === 'LASER_BARCODE' ? 'Laser Barcode Gate' : 'Biometric Station 1',
      employeeId: st.employeeId,
      employeeName: st.employeeName,
      badgeNumber: st.badgeNumber,
      date: today,
      time: params.time,
      punchType: effectiveAction,
      verificationMethod: params.method,
      matchScore: params.method === 'LASER_BARCODE' ? 100 : 99.2,
      projectId: params.projectId || 'Sirius Mall Storefront',
      projectName: params.projectId || 'Sirius Mall Storefront',
      isOvertime: otAddedHours > 0,
      shiftCode: st.shiftCode,
      shiftStart: st.shiftStartTime,
      shiftEnd: st.shiftEndTime,
      isLate,
      lateMinutes,
      approvedOtHoursCompleted: otAddedHours
    });

    return {
      actionRecorded: effectiveAction,
      isLate,
      lateMinutes,
      otAddedHours,
      remainingOtHours: Math.max(0, Number((st.assignedOvertimeHours - st.completedOvertimeHours).toFixed(2))),
      updatedState: st,
      punchLog: punch,
      message
    };
  }

  // --- D. Employee Loans & Funds Taken (Principal + Interest or 0% Interest) ---
  public getEmployeeLoans(): EmployeeLoanSetup[] {
    const fallback: EmployeeLoanSetup[] = [
      {
        id: 'loan-1',
        employeeId: 'EMP-041',
        employeeName: 'Kasun Wickramasinghe',
        loanTitle: 'Company Housing & Tool Loan',
        principalAmount: 180000,
        interestRatePercent: 6.0, // 6% interest
        repaymentMonths: 12,
        paidMonths: 4,
        monthlyPrincipal: 15000,
        monthlyInterest: 900,
        monthlyInstallment: 15900,
        remainingBalance: 120000,
        status: 'Active'
      },
      {
        id: 'loan-2',
        employeeId: 'EMP-042',
        employeeName: 'Sachith Fernando',
        loanTitle: 'Interest-Free Festival Advance',
        principalAmount: 45000,
        interestRatePercent: 0, // Zero interest
        repaymentMonths: 3,
        paidMonths: 1,
        monthlyPrincipal: 15000,
        monthlyInterest: 0,
        monthlyInstallment: 15000,
        remainingBalance: 30000,
        status: 'Active'
      },
      {
        id: 'loan-3',
        employeeId: 'EMP-044',
        employeeName: 'Pradeep Kumara',
        loanTitle: 'Emergency Medical Fund Loan',
        principalAmount: 60000,
        interestRatePercent: 4.0,
        repaymentMonths: 6,
        paidMonths: 2,
        monthlyPrincipal: 10000,
        monthlyInterest: 400,
        monthlyInstallment: 10400,
        remainingBalance: 40000,
        status: 'Active'
      }
    ];
    return this.getAdvancedStorage('innovista_hr_employee_loans_v2', fallback);
  }

  public saveEmployeeLoan(loanInput: {
    id?: string;
    employeeId: string;
    employeeName: string;
    loanTitle: string;
    principalAmount: number;
    interestRatePercent: number;
    repaymentMonths: number;
    paidMonths?: number;
  }): EmployeeLoanSetup[] {
    const loans = this.getEmployeeLoans();
    const months = Math.max(1, Number(loanInput.repaymentMonths) || 1);
    const principal = Number(loanInput.principalAmount) || 0;
    const rate = Math.max(0, Number(loanInput.interestRatePercent) || 0);
    const paid = Number(loanInput.paidMonths) || 0;

    const monthlyPrincipal = Math.round(principal / months);
    const totalInterest = rate === 0 ? 0 : Math.round(principal * (rate / 100));
    const monthlyInterest = rate === 0 ? 0 : Math.round(totalInterest / months);
    const monthlyInstallment = monthlyPrincipal + monthlyInterest;
    const remainingBalance = Math.max(0, principal - monthlyPrincipal * paid);

    const record: EmployeeLoanSetup = {
      id: loanInput.id || `loan-${Date.now()}`,
      employeeId: loanInput.employeeId,
      employeeName: loanInput.employeeName,
      loanTitle: loanInput.loanTitle,
      principalAmount: principal,
      interestRatePercent: rate,
      repaymentMonths: months,
      paidMonths: paid,
      monthlyPrincipal,
      monthlyInterest,
      monthlyInstallment,
      remainingBalance,
      status: remainingBalance <= 0 ? 'Completed' : 'Active'
    };

    const idx = loans.findIndex(l => l.id === record.id);
    if (idx >= 0) loans[idx] = record;
    else loans.unshift(record);

    this.saveAdvancedStorage('innovista_hr_employee_loans_v2', loans);
    return loans;
  }

  public deleteEmployeeLoan(id: string): EmployeeLoanSetup[] {
    const loans = this.getEmployeeLoans().filter(l => l.id !== id);
    this.saveAdvancedStorage('innovista_hr_employee_loans_v2', loans);
    return loans;
  }

  // --- E. Sri Lankan Law EPF / ETF & Gratuity Statutory Config (Adjustable Rates) ---
  public getSriLankaStatutoryConfig(): SriLankaStatutoryConfig {
    const fallback: SriLankaStatutoryConfig = {
      epfEmployeeRate: 8.0, // 8% Employee EPF (Sri Lankan Law)
      epfEmployerRate: 12.0, // 12% Employer EPF (Sri Lankan Law)
      etfEmployerRate: 3.0, // 3% Employer ETF (Sri Lankan Law)
      gratuityMinYears: 5, // Sri Lanka Payment of Gratuity Act No. 12 of 1983
      gratuityRatePerYear: 0.5 // Half month's basic salary per completed year
    };
    return this.getAdvancedStorage('innovista_hr_sl_statutory_v2', fallback);
  }

  public saveSriLankaStatutoryConfig(cfg: SriLankaStatutoryConfig): SriLankaStatutoryConfig {
    this.saveAdvancedStorage('innovista_hr_sl_statutory_v2', cfg);
    return cfg;
  }

  // --- F. Per-Employee Comprehensive Compensation Setup (Gratuity, Bonuses, Special Bonuses, Allowances, Contracts, Commissions) ---
  public getEmployeeComprehensiveSetups(): EmployeeComprehensiveSetup[] {
    const fallback: EmployeeComprehensiveSetup[] = [
      {
        employeeId: 'EMP-041',
        employeeName: 'Kasun Wickramasinghe',
        badgeNumber: 'BDG-10041',
        department: 'Fabrication',
        designation: 'Master Aluminium Fabricator',
        employmentType: 'Permanent',
        yearsOfService: 6,
        basicSalary: 145000,
        allowances: [
          { id: 'al-1', name: 'Budgetary Relief Allowance (BRA)', amount: 10000, epfEligible: true },
          { id: 'al-2', name: 'Housing & Accommodation', amount: 25000, epfEligible: false },
          { id: 'al-3', name: 'Transport & Fuel', amount: 15000, epfEligible: false },
          { id: 'al-4', name: 'Master Tool & Precision Allowance', amount: 8500, epfEligible: false }
        ],
        regularBonus: 12000,
        specialBonuses: [
          { id: 'sb-1', bonusType: 'Project Milestone Bonus', label: 'Sirius Mall Curtain Wall Completion', amount: 18000 },
          { id: 'sb-2', bonusType: 'Attendance Bonus', label: '100% Monthly Attendance Star', amount: 5000 }
        ],
        contractPayoutAmount: 22000,
        contractDescription: 'Unitized Sub-Frame Piece-Rate Contract',
        commissionSalesVolume: 1500000,
        commissionRatePercent: 1.0,
        commissionAmount: 15000,
        includeGratuityInPaysheet: false,
        apitTaxDeduction: 3500,
        lateDeductionRatePerHour: 800
      },
      {
        employeeId: 'EMP-042',
        employeeName: 'Sachith Fernando',
        badgeNumber: 'BDG-10042',
        department: 'Site Installation',
        designation: 'Structural Glazing Specialist',
        employmentType: 'Permanent',
        yearsOfService: 5,
        basicSalary: 125000,
        allowances: [
          { id: 'al-21', name: 'Budgetary Relief Allowance (BRA)', amount: 10000, epfEligible: true },
          { id: 'al-22', name: 'Site Height Risk Allowance', amount: 20000, epfEligible: false },
          { id: 'al-23', name: 'Transport Allowance', amount: 12000, epfEligible: false }
        ],
        regularBonus: 10000,
        specialBonuses: [
          { id: 'sb-21', bonusType: 'Safety Zero-LTI Bonus', label: 'Zero Height Incident Bonus', amount: 10000 }
        ],
        contractPayoutAmount: 15000,
        contractDescription: 'Spider Glazing Silicone Joint Contract',
        commissionSalesVolume: 800000,
        commissionRatePercent: 1.5,
        commissionAmount: 12000,
        includeGratuityInPaysheet: false,
        apitTaxDeduction: 1800,
        lateDeductionRatePerHour: 700
      },
      {
        employeeId: 'EMP-043',
        employeeName: 'Dinesh Jayawardena',
        badgeNumber: 'BDG-10043',
        department: 'Safety & QA',
        designation: 'Site HSE & Safety Officer',
        employmentType: 'Permanent',
        yearsOfService: 7,
        basicSalary: 160000,
        allowances: [
          { id: 'al-31', name: 'Budgetary Relief Allowance (BRA)', amount: 10000, epfEligible: true },
          { id: 'al-32', name: 'HSE Compliance & Inspection Allowance', amount: 30000, epfEligible: false },
          { id: 'al-33', name: 'Vehicle & Fuel Allowance', amount: 18000, epfEligible: false }
        ],
        regularBonus: 15000,
        specialBonuses: [
          { id: 'sb-31', bonusType: 'Festival / Avurudu Bonus', label: 'Annual Festival Bonus', amount: 25000 }
        ],
        contractPayoutAmount: 0,
        commissionSalesVolume: 0,
        commissionRatePercent: 0,
        commissionAmount: 0,
        includeGratuityInPaysheet: false,
        apitTaxDeduction: 4500,
        lateDeductionRatePerHour: 900
      },
      {
        employeeId: 'EMP-044',
        employeeName: 'Pradeep Kumara',
        badgeNumber: 'BDG-10044',
        department: 'Site Installation',
        designation: 'Curtain Wall Fitter Lead',
        employmentType: 'Contract',
        yearsOfService: 3,
        basicSalary: 110000,
        allowances: [
          { id: 'al-41', name: 'Budgetary Relief Allowance (BRA)', amount: 10000, epfEligible: true },
          { id: 'al-42', name: 'Site Rigging Allowance', amount: 16000, epfEligible: false }
        ],
        regularBonus: 8000,
        specialBonuses: [
          { id: 'sb-41', bonusType: 'Performance Bonus', label: 'Fast-Track Erection Target', amount: 12000 }
        ],
        contractPayoutAmount: 35000,
        contractDescription: 'Level 4-8 Mullion Bracket Contract',
        commissionSalesVolume: 500000,
        commissionRatePercent: 2.0,
        commissionAmount: 10000,
        includeGratuityInPaysheet: false,
        apitTaxDeduction: 1200,
        lateDeductionRatePerHour: 650
      },
      {
        employeeId: 'EMP-045',
        employeeName: 'Roshan Samarasekera',
        badgeNumber: 'BDG-10045',
        department: 'Machining',
        designation: 'CNC Profile Milling Operator',
        employmentType: 'Permanent',
        yearsOfService: 8,
        basicSalary: 135000,
        allowances: [
          { id: 'al-51', name: 'Budgetary Relief Allowance (BRA)', amount: 10000, epfEligible: true },
          { id: 'al-52', name: 'CNC Precision Allowance', amount: 20000, epfEligible: false }
        ],
        regularBonus: 10000,
        specialBonuses: [
          { id: 'sb-51', bonusType: 'Special Custom Bonus', label: 'Zero Scrap Optimization Award', amount: 15000 }
        ],
        contractPayoutAmount: 10000,
        contractDescription: 'After-Hours Die Calibration Contract',
        commissionSalesVolume: 0,
        commissionRatePercent: 0,
        commissionAmount: 0,
        includeGratuityInPaysheet: true, // Include gratuity settlement in paysheet
        apitTaxDeduction: 2200,
        lateDeductionRatePerHour: 750
      }
    ];
    return this.getAdvancedStorage('innovista_hr_comp_setups_v2', fallback);
  }

  public saveEmployeeComprehensiveSetup(setup: EmployeeComprehensiveSetup): EmployeeComprehensiveSetup[] {
    const setups = this.getEmployeeComprehensiveSetups();
    // Auto-calculate commissionAmount if sales volume & rate provided
    setup.commissionAmount = Math.round((Number(setup.commissionSalesVolume) || 0) * ((Number(setup.commissionRatePercent) || 0) / 100));
    const idx = setups.findIndex(s => s.employeeId === setup.employeeId);
    if (idx >= 0) setups[idx] = setup;
    else setups.push(setup);
    this.saveAdvancedStorage('innovista_hr_comp_setups_v2', setups);
    return setups;
  }

  // --- G. Master Automatic Paysheet Calculator ---
  public calculateEmployeePaysheet(employeeId: string): CalculatedEmployeePaysheet {
    const setups = this.getEmployeeComprehensiveSetups();
    const setup = setups.find(s => s.employeeId === employeeId) || setups[0];
    const shiftStates = this.getEmployeeShiftStates();
    const shiftState = shiftStates.find(s => s.employeeId === setup.employeeId) || shiftStates[0];
    const statutory = this.getSriLankaStatutoryConfig();
    const activeLoans = this.getEmployeeLoans().filter(l => l.employeeId === setup.employeeId && l.status === 'Active');

    // 1. Basic & Allowances
    const basicSalary = Number(setup.basicSalary) || 0;
    const epfEligibleAllowances = setup.allowances.filter(a => a.epfEligible).reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
    const nonEpfAllowances = setup.allowances.filter(a => !a.epfEligible).reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
    const totalAllowances = epfEligibleAllowances + nonEpfAllowances;
    const totalForEpfBase = basicSalary + epfEligibleAllowances;

    // 2. Overtime (Approved & Completed up to Assigned Quota)
    const assignedOtHours = shiftState.isOvertimeEligible ? shiftState.assignedOvertimeHours : 0;
    const completedOtHours = shiftState.isOvertimeEligible ? Math.min(shiftState.completedOvertimeHours, shiftState.assignedOvertimeHours) : 0;
    const remainingOtHours = Math.max(0, Number((assignedOtHours - completedOtHours).toFixed(2)));
    const overtimePay = Math.round(completedOtHours * (shiftState.overtimeHourlyRate || 0));

    // 3. Meals & Tea Biometric Card Fund Logic
    // - If company allocates funds outside salary (`isCompanyMealFunded = true`):
    //   - Unclaimed balance (`mealFundAllocated - mealClaimedTotal`) automatically adds to benefits if `allowUnclaimedMealToBenefits = true`
    //   - If claimed > allocated, excess is deducted
    // - If company does NOT allocate funds (`isCompanyMealFunded = false`):
    //   - Claimed meal total is deducted from employee salary/wages/benefits
    const isCompanyMealFunded = shiftState.isCompanyMealFunded;
    const mealFundAllocated = isCompanyMealFunded ? (shiftState.monthlyMealFundAllocated || 0) : 0;
    const mealClaimedTotal = shiftState.claimedMealsTotalLKR || 0;

    let unclaimedMealBenefitAddition = 0;
    let mealSalaryDeduction = 0;

    if (isCompanyMealFunded) {
      if (mealClaimedTotal < mealFundAllocated && shiftState.allowUnclaimedMealToBenefits) {
        unclaimedMealBenefitAddition = mealFundAllocated - mealClaimedTotal;
      } else if (mealClaimedTotal > mealFundAllocated) {
        mealSalaryDeduction = mealClaimedTotal - mealFundAllocated;
      }
    } else {
      mealSalaryDeduction = mealClaimedTotal;
    }

    // 4. Bonuses, Special Bonuses, Contracts, Commissions & Gratuity
    const regularBonus = Number(setup.regularBonus) || 0;
    const specialBonusesTotal = setup.specialBonuses.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
    const contractPayout = Number(setup.contractPayoutAmount) || 0;
    const commissionAmount = Math.round((Number(setup.commissionSalesVolume) || 0) * ((Number(setup.commissionRatePercent) || 0) / 100));

    // Gratuity according to Sri Lankan Law: (Basic Salary * 0.5) * Years of Service
    const accruedTotalGratuity = Math.round(basicSalary * (statutory.gratuityRatePerYear || 0.5) * (setup.yearsOfService || 0));
    const monthlyGratuityProvision = Math.round((basicSalary * (statutory.gratuityRatePerYear || 0.5)) / 12);
    const gratuityPayoutInSlip = setup.includeGratuityInPaysheet ? accruedTotalGratuity : 0;

    // 5. Gross Earnings
    const grossEarnings =
      basicSalary +
      totalAllowances +
      overtimePay +
      unclaimedMealBenefitAddition +
      regularBonus +
      specialBonusesTotal +
      contractPayout +
      commissionAmount +
      gratuityPayoutInSlip;

    // 6. Sri Lankan EPF & ETF Statutory Calculations (Adjustable Rates)
    const epfEmployeeRate = setup.epfEmployeeRateOverride !== undefined ? setup.epfEmployeeRateOverride : statutory.epfEmployeeRate;
    const epfEmployerRate = setup.epfEmployerRateOverride !== undefined ? setup.epfEmployerRateOverride : statutory.epfEmployerRate;
    const etfEmployerRate = setup.etfEmployerRateOverride !== undefined ? setup.etfEmployerRateOverride : statutory.etfEmployerRate;

    const epfEmployeeDeduction = Math.round(totalForEpfBase * (epfEmployeeRate / 100));
    const epfEmployerContribution = Math.round(totalForEpfBase * (epfEmployerRate / 100));
    const etfEmployerContribution = Math.round(totalForEpfBase * (etfEmployerRate / 100));
    const totalStatutoryRemittance = epfEmployeeDeduction + epfEmployerContribution + etfEmployerContribution;

    // 7. Loan & Fund Repayments (Principal + Interest, where interest can be 0)
    const loanPrincipalDeduction = activeLoans.reduce((sum, l) => sum + l.monthlyPrincipal, 0);
    const loanInterestDeduction = activeLoans.reduce((sum, l) => sum + l.monthlyInterest, 0);
    const totalLoanDeduction = loanPrincipalDeduction + loanInterestDeduction;

    // 8. Late Arrival Deduction & APIT Tax
    const lateMinutesMonth = shiftState.totalLateMinutesMonth || 0;
    const lateDeduction = Math.round((lateMinutesMonth / 60) * (setup.lateDeductionRatePerHour || 0));
    const apitTaxDeduction = Number(setup.apitTaxDeduction) || 0;

    const totalDeductions =
      epfEmployeeDeduction +
      totalLoanDeduction +
      mealSalaryDeduction +
      lateDeduction +
      apitTaxDeduction;

    const netPayableSalary = GrossToNet(grossEarnings, totalDeductions);
    const totalCompanyCostToCompany = grossEarnings + epfEmployerContribution + etfEmployerContribution + monthlyGratuityProvision;

    return {
      employeeId: setup.employeeId,
      employeeName: setup.employeeName,
      badgeNumber: setup.badgeNumber,
      department: setup.department,
      designation: setup.designation,
      employmentType: setup.employmentType,
      basicSalary,
      epfEligibleAllowances,
      nonEpfAllowances,
      totalAllowances,
      totalForEpfBase,
      assignedOtHours,
      completedOtHours,
      remainingOtHours,
      overtimePay,
      isCompanyMealFunded,
      mealFundAllocated,
      mealClaimedTotal,
      unclaimedMealBenefitAddition,
      mealSalaryDeduction,
      regularBonus,
      specialBonusesTotal,
      specialBonusesList: setup.specialBonuses,
      contractPayout,
      commissionAmount,
      accruedTotalGratuity,
      monthlyGratuityProvision,
      gratuityPayoutInSlip,
      grossEarnings,
      epfEmployeeRate,
      epfEmployeeDeduction,
      activeLoansCount: activeLoans.length,
      loanPrincipalDeduction,
      loanInterestDeduction,
      totalLoanDeduction,
      lateMinutesMonth,
      lateDeduction,
      apitTaxDeduction,
      totalDeductions,
      netPayableSalary,
      epfEmployerRate,
      epfEmployerContribution,
      etfEmployerRate,
      etfEmployerContribution,
      totalStatutoryRemittance,
      totalCompanyCostToCompany
    };
  }

  public calculateAllPaysheets(): CalculatedEmployeePaysheet[] {
    const setups = this.getEmployeeComprehensiveSetups();
    return setups.map(s => this.calculateEmployeePaysheet(s.employeeId));
  }
}

function GrossToNet(gross: number, deductions: number): number {
  return Math.round(gross - deductions);
}

export const hrService = new HRService();

