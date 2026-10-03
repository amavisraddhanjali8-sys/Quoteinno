// ============================================================================
// INNOVISTA HUMAN CAPITAL CONTROL SYSTEM — COMPLETE TYPE DEFINITIONS
// Covers Entire Employee Lifecycle across all 13 HR Portals and 36 Domain Areas
// ============================================================================

export type HRPortalView = 
  | 'landing'
  | 'executive'
  | 'admin'
  | 'recruitment'
  | 'ess'
  | 'mss'
  | 'attendance'
  | 'biometrics'
  | 'meals'
  | 'loans'
  | 'compensation'
  | 'payroll'
  | 'performance'
  | 'learning'
  | 'relations'
  | 'documents'
  | 'planning'
  | 'analytics';

// ----------------------------------------------------------------------------
// A. ORGANIZATION
// ----------------------------------------------------------------------------
export interface HRCompany {
  id: string;
  code: string;
  name: string;
  legalRegistrationNo: string;
  taxRegistrationNo: string;
  headquartersAddress: string;
  country: string;
  currency: string;
  fiscalYearStart: string;
  isActive: boolean;
}

export interface HRBranch {
  id: string;
  companyId: string;
  code: string;
  name: string;
  type: 'Headquarters' | 'Fabrication Yard' | 'Workshop' | 'Site Office' | 'Warehouse';
  location: string;
  city: string;
  country: string;
  managerName?: string;
  isActive: boolean;
}

export interface HRDepartment {
  id: string;
  companyId: string;
  code: string;
  name: string;
  division?: string;
  section?: string;
  costCenterCode: string;
  headOfDepartmentId?: string;
  headOfDepartmentName?: string;
  parentDepartmentId?: string;
  approvedHeadcount: number;
  currentHeadcount: number;
  isActive: boolean;
}

export interface HRJobGrade {
  id: string;
  gradeCode: string; // e.g. G1 - G8
  title: string;
  minSalary: number;
  midSalary: number;
  maxSalary: number;
  benefitsBand: 'Executive' | 'Management' | 'Professional' | 'Operational' | 'Staff';
  noticePeriodDays: number;
  annualLeaveDays: number;
}

export interface HRCostCenter {
  id: string;
  code: string;
  name: string;
  departmentCode: string;
  allocatedBudget: number;
  ytdSpend: number;
  currency: string;
}

// ----------------------------------------------------------------------------
// B & C. POSITION MANAGEMENT & WORKFORCE PLANNING
// ----------------------------------------------------------------------------
export interface HRPosition {
  id: string;
  positionCode: string;
  title: string;
  departmentCode: string;
  jobGradeId: string;
  gradeCode: string;
  reportsToPositionId?: string;
  reportsToTitle?: string;
  approvedHeadcount: number;
  currentOccupancy: number;
  vacancyStatus: 'Fully Staffed' | 'Open Vacancies' | 'Surplus';
  criticality: 'Low' | 'Medium' | 'High' | 'Mission-Critical';
  jobDescription: string;
  responsibilities: string[];
  requiredQualifications: string[];
  requiredSkills: string[];
  requiredCompetencies: string[];
  minYearsExperience: number;
}

export interface HRHeadcountPlan {
  id: string;
  planYear: number;
  departmentCode: string;
  positionId: string;
  positionTitle: string;
  q1Target: number;
  q2Target: number;
  q3Target: number;
  q4Target: number;
  budgetAllocated: number;
  status: 'Draft' | 'Approved' | 'In Progress' | 'Fulfilled';
  justification: string;
}

export interface HRProjectManpowerRequirement {
  id: string;
  projectId: string;
  projectCode: string;
  projectName: string;
  tradeRequired: string;
  skillRequired: string;
  headcountNeeded: number;
  assignedHeadcount: number;
  startDate: string;
  endDate: string;
  hourlyBillingRate: number;
  status: 'Pending Allocation' | 'Partially Staffed' | 'Fully Allocated';
}

// ----------------------------------------------------------------------------
// D. RECRUITMENT / ATS
// ----------------------------------------------------------------------------
export type ApplicationStage = 
  | 'Applied' 
  | 'Screening' 
  | 'Shortlisted' 
  | 'Interview Scheduled' 
  | 'Assessment' 
  | 'Offer Extended' 
  | 'Offer Accepted' 
  | 'Hired' 
  | 'Rejected' 
  | 'Withdrawn';

export interface HRVacancy {
  id: string;
  requisitionNumber: string;
  positionId: string;
  positionTitle: string;
  departmentCode: string;
  branch: string;
  employmentType: string;
  headcountRequired: number;
  openDate: string;
  targetHireDate: string;
  salaryMin: number;
  salaryMax: number;
  status: 'Pending Approval' | 'Open' | 'Interviewing' | 'Offer Stage' | 'Filled' | 'Cancelled';
  hiringManagerId: string;
  hiringManagerName: string;
  jobDescription: string;
  applicantsCount: number;
}

export interface HRCandidate {
  id: string;
  vacancyId: string;
  fullName: string;
  email: string;
  phone: string;
  currentTitle: string;
  currentCompany: string;
  experienceYears: number;
  noticePeriodDays: number;
  expectedSalary: number;
  stage: ApplicationStage;
  cvUrl?: string;
  cvSummary: string;
  skills: string[];
  rating: number; // 1 to 5
  interviewNotes?: string;
  interviewDate?: string;
  assessmentScore?: number;
  offerAmount?: number;
  appliedDate: string;
  rejectionReason?: string;
}

// ----------------------------------------------------------------------------
// E & F. EMPLOYEE MASTER & EMPLOYMENT MANAGEMENT
// ----------------------------------------------------------------------------
export type HREmploymentType = 
  | 'Permanent'
  | 'Probationary'
  | 'Temporary'
  | 'Fixed-Term'
  | 'Contract'
  | 'Part-Time'
  | 'Casual'
  | 'Daily-Paid'
  | 'Hourly'
  | 'Intern'
  | 'Trainee'
  | 'Apprentice'
  | 'Consultant'
  | 'Project-Based';

export type HREmploymentStatus = 
  | 'Active' 
  | 'On Leave' 
  | 'Probation' 
  | 'Notice Period' 
  | 'Suspended' 
  | 'Resigned' 
  | 'Terminated' 
  | 'Retired';

export interface HREmploymentHistoryRecord {
  id: string;
  effectiveDate: string;
  changeType: 'Hiring' | 'Confirmation' | 'Promotion' | 'Transfer' | 'Salary Revision' | 'Designation Change' | 'Grade Change' | 'Status Change';
  oldValue: string;
  newValue: string;
  reason: string;
  approvedBy: string;
}

export interface HREmployeeMaster {
  id: string;
  employeeCode: string; // e.g. INV-0104
  badgeNumber: string;
  // Identity
  fullName: string;
  preferredName?: string;
  nationalIdOrEmiratesId: string;
  passportNumber: string;
  nationality: string;
  gender: 'Male' | 'Female' | 'Other';
  dateOfBirth: string;
  bloodGroup?: string;
  maritalStatus: 'Single' | 'Married' | 'Divorced';
  // Contact
  workEmail: string;
  personalEmail: string;
  mobile: string;
  currentAddress: string;
  emergencyContactName: string;
  emergencyContactRelationship: string;
  emergencyContactPhone: string;
  // Organization & Employment
  companyId: string;
  branch: string;
  departmentCode: string;
  department?: string;
  division?: string;
  section?: string;
  positionId: string;
  positionTitle: string;
  jobGradeId: string;
  gradeCode: string;
  managerId?: string;
  managerName?: string;
  employmentType: HREmploymentType;
  employmentStatus: HREmploymentStatus;
  dateOfJoining: string;
  probationEndDate: string;
  isConfirmed: boolean;
  confirmationDate?: string;
  contractStartDate: string;
  contractEndDate?: string;
  // Compensation (Restricted - Field Level Security)
  currency: string;
  basicSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  otherAllowances: number;
  grossSalary: number;
  bankName: string;
  iban: string;
  wpsRoutingCode: string;
  // Qualifications & Skills
  highestEducation: string;
  university: string;
  skills: { skill: string; level: number; category: string }[];
  certifications: { name: string; issuer: string; validUntil: string; certificateId: string }[];
  // Assets, Projects & State
  assignedAssetsCount: number;
  activeProjectIds: string[];
  activeProjectNames: string[];
  history: HREmploymentHistoryRecord[];
  notes?: string;
}

// ----------------------------------------------------------------------------
// G. ONBOARDING
// ----------------------------------------------------------------------------
export interface HROnboardingTask {
  id: string;
  employeeId: string;
  employeeName: string;
  category: 'Documentation' | 'IT Setup' | 'HR & Payroll' | 'Equipment & PPE' | 'Orientation' | 'Training';
  title: string;
  assignedRole: 'HR' | 'IT' | 'Manager' | 'Employee' | 'Safety';
  dueDate: string;
  isCompleted: boolean;
  completedAt?: string;
  completedBy?: string;
}

// ----------------------------------------------------------------------------
// J, K, L, N. ATTENDANCE, SHIFTS, TIMESHEETS, OVERTIME
// ----------------------------------------------------------------------------
export interface HRShift {
  id: string;
  code: string;
  name: string;
  startTime: string; // e.g. "07:00"
  endTime: string;   // e.g. "15:30"
  breakDurationMinutes: number;
  workHours: number;
  isNightShift: boolean;
  flexibleMinutes: number;
}

export interface HREmployeeRoster {
  id: string;
  employeeId: string;
  employeeName: string;
  departmentCode: string;
  shiftId: string;
  shiftName: string;
  effectiveFrom: string;
  effectiveTo: string;
  stationName: string;
  restDays: string[]; // e.g. ["Sunday"]
}

export type AttendancePunchSource = 'WEB' | 'MOBILE' | 'BIOMETRIC' | 'QR_CODE' | 'MANUAL';

export interface HRAttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  badgeNumber: string;
  departmentCode: string;
  date: string;
  shiftCode: string;
  scheduledStart: string;
  scheduledEnd: string;
  actualClockIn: string;
  actualClockOut?: string;
  totalWorkedMinutes: number;
  lateMinutes: number;
  earlyDepartureMinutes: number;
  overtimeMinutes: number;
  status: 'Present' | 'Late' | 'Half Day' | 'Absent' | 'On Leave' | 'Rest Day';
  source: AttendancePunchSource;
  locationPin?: string;
  correctionRequested?: boolean;
  correctionApproved?: boolean;
  correctionNotes?: string;
}

export interface HRProjectTimesheet {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  projectId: string;
  projectCode: string;
  workPackageCode?: string;
  taskActivity: string;
  startHour: string;
  endHour: string;
  hoursWorked: number;
  isOvertime: boolean;
  hourlyCostRate: number;
  totalLaborCost: number;
  supervisorId: string;
  supervisorName: string;
  status: 'Draft' | 'Submitted' | 'Approved' | 'Rejected';
  notes?: string;
}

export interface HROvertimeRequest {
  id: string;
  requestNumber: string;
  employeeId: string;
  employeeName: string;
  departmentCode: string;
  date: string;
  projectId?: string;
  hoursRequested: number;
  multiplier: 1.25 | 1.5 | 2.0; // Normal overtime, weekend, public holiday
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  approvedBy?: string;
  approvedAt?: string;
  estimatedAmount: number;
}

// ----------------------------------------------------------------------------
// M. LEAVE MANAGEMENT
// ----------------------------------------------------------------------------
export interface HRLeaveType {
  id: string;
  code: string;
  name: string;
  annualEntitlement: number;
  isPaid: boolean;
  allowCarryForward: boolean;
  maxCarryForwardDays: number;
  requiresDocumentProof: boolean;
  color: string;
}

export interface HRLeaveBalance {
  id: string;
  employeeId: string;
  leaveTypeCode: string;
  leaveTypeName: string;
  entitled: number;
  accrued: number;
  taken: number;
  pending: number;
  balance: number;
}

export interface HRLeaveRequest {
  id: string;
  requestNumber: string;
  employeeId: string;
  employeeName: string;
  departmentCode: string;
  leaveTypeCode: string;
  leaveTypeName: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  emergencyContact?: string;
  attachmentUrl?: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
  appliedDate: string;
  approverComments?: string;
  approvedBy?: string;
  approvedAt?: string;
}

// ----------------------------------------------------------------------------
// P. BENEFITS MANAGEMENT
// ----------------------------------------------------------------------------
export interface HRBenefitPlan {
  id: string;
  code: string;
  name: string;
  type: 'Health Insurance' | 'Life Insurance' | 'Flight Allowance' | 'Education Support' | 'Vehicle Allowance' | 'Gym & Wellness';
  coverageDescription: string;
  companyContribution: number;
  employeeContribution: number;
  eligibleGrades: string[];
  isActive: boolean;
}

export interface HREmployeeBenefitEnrollment {
  id: string;
  employeeId: string;
  employeeName: string;
  benefitPlanId: string;
  benefitName: string;
  coverageLevel: 'Single' | 'Couple' | 'Family';
  enrollmentDate: string;
  companyMonthlyCost: number;
  status: 'Active' | 'Terminated';
}

// ----------------------------------------------------------------------------
// Q. PERFORMANCE MANAGEMENT
// ----------------------------------------------------------------------------
export interface HRPerformanceCycle {
  id: string;
  cycleCode: string; // e.g. "REV-2026-H1"
  name: string;
  year: number;
  startDate: string;
  endDate: string;
  selfReviewDeadline: string;
  managerReviewDeadline: string;
  status: 'Planning' | 'Active' | 'In Evaluation' | 'Calibration' | 'Completed';
}

export interface HREmployeeGoal {
  id: string;
  employeeId: string;
  cycleCode: string;
  title: string;
  description: string;
  targetMetric: string;
  weightPercent: number;
  progressPercent: number;
  selfRating?: number;
  managerRating?: number;
  status: 'In Progress' | 'Achieved' | 'Exceeded' | 'Behind';
}

export interface HRPerformanceAppraisal {
  id: string;
  employeeId: string;
  employeeName: string;
  departmentCode: string;
  cycleCode: string;
  managerId: string;
  managerName: string;
  overallScore: number; // e.g. 4.2 / 5.0
  performanceGrade: 'Outstanding' | 'Exceeds Expectations' | 'Meets Expectations' | 'Needs Improvement' | 'Unsatisfactory';
  strengthsSummary: string;
  areasForDevelopment: string;
  recommendedPromotion: boolean;
  recommendedSalaryIncrementPercent?: number;
  status: 'Self Review' | 'Manager Review' | 'Sign-off' | 'Closed';
}

// ----------------------------------------------------------------------------
// R, S, T, U. SKILLS, LMS, CAREER & SUCCESSION
// ----------------------------------------------------------------------------
export interface HRSkillMaster {
  id: string;
  code: string;
  name: string;
  category: 'Technical / Engineering' | 'Welding & Fabrication' | 'CNC & Machining' | 'Quality & Safety' | 'Leadership & Project';
  description: string;
  certificationRequired: boolean;
}

export interface HRCourse {
  id: string;
  code: string;
  title: string;
  category: string;
  deliveryType: 'Classroom' | 'Workshop' | 'E-Learning' | 'External Certification';
  durationHours: number;
  costPerParticipant: number;
  trainer: string;
  targetSkills: string[];
  validityMonths: number;
  isActive: boolean;
}

export interface HRTrainingEnrollment {
  id: string;
  courseId: string;
  courseTitle: string;
  employeeId: string;
  employeeName: string;
  departmentCode: string;
  scheduledDate: string;
  status: 'Nominated' | 'Approved' | 'In Progress' | 'Completed' | 'Failed' | 'Expired';
  attendanceStatus: 'Attended' | 'Absent' | 'Pending';
  scorePercent?: number;
  certificateNumber?: string;
  validUntil?: string;
}

export interface HRSuccessionPlan {
  id: string;
  criticalPositionTitle: string;
  departmentCode: string;
  currentIncumbent: string;
  successorCandidates: {
    employeeId: string;
    employeeName: string;
    currentRole: string;
    readiness: 'Ready Now' | 'Ready in 1-2 Years' | 'Ready in 3+ Years';
    skillGaps: string[];
  }[];
  riskLevel: 'Low' | 'Medium' | 'High';
}

// ----------------------------------------------------------------------------
// V, W, X. EMPLOYEE RELATIONS, DISCIPLINARY & GRIEVANCES
// ----------------------------------------------------------------------------
export type HRCaseType = 'Grievance' | 'Disciplinary' | 'Investigation' | 'Policy Violation' | 'Harassment' | 'HSE Breach';
export type HRCaseSeverity = 'Low' | 'Medium' | 'High' | 'Critical / Confidential';

export interface HRCase {
  id: string;
  caseNumber: string;
  type: HRCaseType;
  severity: HRCaseSeverity;
  title: string;
  incidentDate: string;
  reportedDate: string;
  employeeId: string;
  employeeName: string;
  departmentCode: string;
  accusedOrRespondent?: string;
  description: string;
  investigatorName?: string;
  investigationFindings?: string;
  actionTaken?: string;
  status: 'Reported' | 'Under Investigation' | 'Panel Review' | 'Action Decided' | 'Appealed' | 'Resolved & Closed';
  confidentiality: 'Confidential' | 'Highly Confidential (HR Dir Only)';
  resolutionDate?: string;
}

// ----------------------------------------------------------------------------
// Y. EMPLOYEE ASSET MANAGEMENT
// ----------------------------------------------------------------------------
export interface HREmployeeAsset {
  id: string;
  assetTag: string;
  category: 'Laptop' | 'Mobile Device' | 'Tool Kit' | 'Safety PPE' | 'Uniform' | 'Access Card' | 'Vehicle' | 'Special Equipment';
  modelName: string;
  serialNumber: string;
  assignedToEmployeeId: string;
  assignedToEmployeeName: string;
  departmentCode: string;
  assignedDate: string;
  conditionOnAssignment: 'New' | 'Good' | 'Fair';
  status: 'Assigned' | 'Returned' | 'Under Repair' | 'Lost';
  returnDate?: string;
  returnCondition?: 'Good' | 'Damaged' | 'Acceptable Wear';
  employeeAcknowledged: boolean;
}

// ----------------------------------------------------------------------------
// Z. DOCUMENT CONTROL & COMPLIANCE
// ----------------------------------------------------------------------------
export interface HRDocument {
  id: string;
  documentNumber: string;
  employeeId: string;
  employeeName: string;
  category: 'Emirates ID / National ID' | 'Passport' | 'Employment Visa' | 'Work Contract' | 'Certificates & Degrees' | 'Medical Test' | 'Driver License' | 'Non-Disclosure Agreement';
  fileName: string;
  fileSizeKb: number;
  issueDate: string;
  expiryDate?: string;
  status: 'Valid' | 'Expiring Soon' | 'Expired' | 'Pending Verification';
  verifiedBy?: string;
  verifiedAt?: string;
  confidentiality: 'Standard HR' | 'Confidential';
}

// ----------------------------------------------------------------------------
// AA. REQUEST CENTER
// ----------------------------------------------------------------------------
export type HRRequestCategory = 
  | 'Leave' 
  | 'Overtime' 
  | 'Attendance Correction' 
  | 'Salary Certificate' 
  | 'Employment Letter' 
  | 'Salary Advance' 
  | 'Asset Requisition' 
  | 'Training Nomination' 
  | 'Personal Info Update';

export interface HRRequestItem {
  id: string;
  requestNumber: string;
  category: HRRequestCategory;
  employeeId: string;
  employeeName: string;
  departmentCode: string;
  submittedAt: string;
  title: string;
  details: string;
  status: 'Submitted' | 'In Review' | 'Approved' | 'Rejected';
  approvedBy?: string;
  remarks?: string;
}

// ----------------------------------------------------------------------------
// AB & AC. OFFBOARDING & EXIT INTERVIEW
// ----------------------------------------------------------------------------
export interface HRExitRequest {
  id: string;
  exitNumber: string;
  employeeId: string;
  employeeName: string;
  departmentCode: string;
  positionTitle: string;
  joiningDate: string;
  resignationDate: string;
  lastWorkingDay: string;
  exitType: 'Resignation' | 'Retirement' | 'Contract Expiry' | 'Project Completion' | 'Mutual Separation' | 'Termination';
  reasonForLeaving: string;
  status: 'Initiated' | 'Department Clearance' | 'IT Revocation' | 'Asset Return' | 'Finance Settlement' | 'Archived';
  assetsReturned: boolean;
  itAccessRevoked: boolean;
  exitInterviewCompleted: boolean;
  finalSettlementAmount: number;
  gratuityOrEndServiceBenefits: number;
  leaveEncashmentAmount: number;
  settlementStatus: 'Draft' | 'Approved' | 'Disbursed';
}

export interface HRExitInterviewResponse {
  id: string;
  exitRequestId: string;
  employeeId: string;
  employeeName: string;
  ratingManagement: number;      // 1 to 5
  ratingCompensation: number;    // 1 to 5
  ratingCareerGrowth: number;    // 1 to 5
  ratingCulture: number;         // 1 to 5
  wouldRecommendCompany: boolean;
  primaryReason: string;
  constructiveFeedback: string;
}

// ----------------------------------------------------------------------------
// AD & AE. HR ANALYTICS & KPI ENGINE
// ----------------------------------------------------------------------------
export interface HRKPIDefinition {
  id: string;
  kpiCode: string;
  name: string;
  category: 'Workforce' | 'Recruitment' | 'Retention' | 'Financial & Payroll' | 'Training & Safety';
  formulaDescription: string;
  unit: '%' | 'Days' | 'Count' | 'AED';
  targetValue: number;
  currentActual: number;
  status: 'On Target' | 'Warning' | 'Critical';
  frequency: 'Monthly' | 'Quarterly' | 'Annual';
}

export interface HRWorkforceSnapshot {
  totalHeadcount: number;
  activeHeadcount: number;
  probationCount: number;
  contractCount: number;
  monthlyPayrollTotal: number;
  openVacanciesCount: number;
  turnoverRatePercent: number;
  absenteeismRatePercent: number;
  averageOvertimeHours: number;
  expiringDocumentsCount: number;
  pendingApprovalsCount: number;
}

// ----------------------------------------------------------------------------
// AF. BIOMETRIC & LASER SCANNING HARDWARE INTEGRATION
// ----------------------------------------------------------------------------
export type BiometricVerificationMethod = 
  | 'FINGERPRINT'
  | 'FACIAL_RECOGNITION'
  | 'LASER_BARCODE'
  | 'RFID_TAG'
  | 'PALM_VEIN'
  | 'MANUAL_OVERRIDE';

export type BiometricPunchType = 
  | 'CHECK_IN'
  | 'CHECK_OUT'
  | 'LEAVE_OUT'
  | 'BREAK_OUT'
  | 'BREAK_IN'
  | 'MEAL_TEA_SCAN'
  | 'OT_IN'
  | 'OT_OUT';

export interface BiometricTerminalConfig {
  id: string;
  name: string;
  location: string;
  ipAddress: string;
  port: number;
  deviceModel: string;
  terminalType: 'ZKTeco' | 'Hikvision' | 'Anviz' | 'Suprema' | 'Honeywell_Laser' | 'Zebra_Scanner';
  status: 'ONLINE' | 'OFFLINE' | 'SYNCING';
  lastPingTime: string;
  bufferedRecordCount: number;
  firmwareVersion: string;
  assignedDepartment: string;
}

export interface BiometricPunchLog {
  id: string;
  terminalId: string;
  terminalName: string;
  employeeId: string;
  employeeName: string;
  badgeNumber: string;
  timestamp: string;
  date: string;
  time: string;
  punchType: BiometricPunchType;
  verificationMethod: BiometricVerificationMethod;
  matchScore: number; // 0 - 100%
  projectId?: string;
  projectName?: string;
  photoUrl?: string;
  isOvertime?: boolean;
  shiftCode?: string;
  shiftStart?: string;
  shiftEnd?: string;
  isLate?: boolean;
  lateMinutes?: number;
  approvedOtHoursCompleted?: number;
  mealItemName?: string;
  mealAmountLKR?: number;
  isSyncedToTimesheet: boolean;
  timesheetEntryId?: string;
}

export interface EmployeeLifecycleEvent {
  id: string;
  employeeId: string;
  stage: 'APPLIED' | 'SCREENED' | 'INTERVIEWED' | 'OFFER_MADE' | 'ONBOARDED' | 'PROBATION' | 'CONFIRMED' | 'TRANSFERRED' | 'PROMOTED' | 'TRAINED' | 'SALARY_REVISED' | 'DISCIPLINARY' | 'RESIGNED' | 'EXIT_COMPLETED';
  date: string;
  title: string;
  description: string;
  department: string;
  performedBy: string;
  documentRef?: string;
}

export interface SalaryAdvanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  amount: number;
  requestDate: string;
  repaymentMonths: number;
  monthlyDeduction: number;
  reason: string;
  status: 'Pending' | 'Approved' | 'Disbursed' | 'Rejected' | 'Settled';
  approvedBy?: string;
  disbursedDate?: string;
  remainingBalance: number;
}

export interface ExitClearanceChecklistItem {
  id: string;
  employeeId: string;
  category: 'IT Equipment' | 'Tools & Machinery' | 'Safety & PPE' | 'Finance & Advances' | 'HR Documents' | 'Project Handover';
  itemDescription: string;
  status: 'Pending' | 'Returned' | 'Waived' | 'Not Applicable';
  clearedBy?: string;
  clearedAt?: string;
  remarks?: string;
}

// ----------------------------------------------------------------------------
// AG. ADVANCED ATTENDANCE, MEALS/TEA SCANNING, LOANS, EPF/ETF & COMPENSATION
// ----------------------------------------------------------------------------
export interface MealRefreshmentItem {
  id: string;
  code: string;
  name: string;
  category: 'Tea' | 'Lunch' | 'Dinner' | 'Refreshment' | 'Other';
  valueLKR: number;
  isActive: boolean;
}

export interface MealScanRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  badgeNumber: string;
  date: string;
  time: string;
  mealItemId: string;
  mealItemName: string;
  category: string;
  valueLKR: number;
  method: BiometricVerificationMethod;
}

export interface EmployeeLoanSetup {
  id: string;
  employeeId: string;
  employeeName: string;
  loanTitle: string; // e.g., "Staff Housing Loan", "Festival Advance", "Emergency Fund"
  principalAmount: number;
  interestRatePercent: number; // Can be 0 for zero-interest or e.g. 5.5%
  repaymentMonths: number;
  paidMonths: number;
  monthlyPrincipal: number;
  monthlyInterest: number;
  monthlyInstallment: number;
  remainingBalance: number;
  status: 'Active' | 'Completed';
}

export interface SpecialBonusEntry {
  id: string;
  bonusType: 'Performance Bonus' | 'Attendance Bonus' | 'Festival / Avurudu Bonus' | 'Project Milestone Bonus' | 'Safety Zero-LTI Bonus' | 'Special Custom Bonus';
  label: string;
  amount: number;
}

export interface AllowanceEntry {
  id: string;
  name: string; // e.g. Housing, Transport, Site Allowance, Tool Allowance, Cost of Living
  amount: number;
  epfEligible: boolean;
}

export interface SriLankaStatutoryConfig {
  epfEmployeeRate: number; // Default 8%
  epfEmployerRate: number; // Default 12%
  etfEmployerRate: number; // Default 3%
  gratuityMinYears: number; // Default 5 years under Sri Lankan Gratuity Act (or configurable)
  gratuityRatePerYear: number; // Default 0.5 (half month basic per year of service)
}

export interface EmployeeAttendanceShiftState {
  employeeId: string;
  employeeName: string;
  badgeNumber: string;
  department: string;
  shiftCode: string;
  shiftName: string;
  shiftStartTime: string; // e.g. "08:00"
  shiftEndTime: string;   // e.g. "17:00"
  currentState: 'NOT_ARRIVED' | 'ARRIVED' | 'ON_LEAVE_OUT'; // If ARRIVED, next action must be LEAVE_OUT / CHECK_OUT
  lastArrivalTime?: string;
  lastLeaveTime?: string;
  isLateToday: boolean;
  lateMinutesToday: number;
  totalLateMinutesMonth: number;
  // Overtime assignment & completion
  isOvertimeEligible: boolean;
  assignedOvertimeHours: number; // Assigned OT quota
  completedOvertimeHours: number; // Completed OT hours so far
  overtimeHourlyRate: number;
  // Meal & Tea Fund Allocation
  isCompanyMealFunded: boolean; // True = Company allocates fund outside salary; False = Deduct from salary/benefits
  monthlyMealFundAllocated: number; // e.g. LKR 12,000
  allowUnclaimedMealToBenefits: boolean; // True = Unclaimed balance auto-adds to benefits
  claimedMealsTotalLKR: number; // Total scanned meals/tea value
}

export interface EmployeeComprehensiveSetup {
  employeeId: string;
  employeeName: string;
  badgeNumber: string;
  department: string;
  designation: string;
  employmentType: 'Permanent' | 'Contract' | 'Piece-Rate' | 'Probation' | 'Consultant';
  yearsOfService: number;
  // Base & Rates
  basicSalary: number;
  epfEmployeeRateOverride?: number; // Optional per-employee override, defaults to 8%
  epfEmployerRateOverride?: number; // Defaults to 12%
  etfEmployerRateOverride?: number; // Defaults to 3%
  // Allowances
  allowances: AllowanceEntry[];
  // Bonuses & Special Bonuses
  regularBonus: number;
  specialBonuses: SpecialBonusEntry[];
  // Contracts & Commissions
  contractPayoutAmount: number;
  contractDescription?: string;
  commissionSalesVolume: number;
  commissionRatePercent: number;
  commissionAmount: number;
  // Gratuity
  includeGratuityInPaysheet: boolean; // Whether to pay out gratuity in current paysheet or accrue
  // Tax / Other Deductions
  apitTaxDeduction: number;
  lateDeductionRatePerHour: number;
}

export interface CalculatedEmployeePaysheet {
  employeeId: string;
  employeeName: string;
  badgeNumber: string;
  department: string;
  designation: string;
  employmentType: string;
  // Basic & Earnings
  basicSalary: number;
  epfEligibleAllowances: number;
  nonEpfAllowances: number;
  totalAllowances: number;
  totalForEpfBase: number; // Basic + EPF-eligible allowances
  // Overtime
  assignedOtHours: number;
  completedOtHours: number;
  remainingOtHours: number;
  overtimePay: number;
  // Meals & Tea Benefit / Deduction
  isCompanyMealFunded: boolean;
  mealFundAllocated: number;
  mealClaimedTotal: number;
  unclaimedMealBenefitAddition: number; // Added if company funded & unclaimed & allowed
  mealSalaryDeduction: number; // Deducted if not company funded OR if claimed > allocated
  // Bonuses, Contracts, Commissions, Gratuity
  regularBonus: number;
  specialBonusesTotal: number;
  specialBonusesList: SpecialBonusEntry[];
  contractPayout: number;
  commissionAmount: number;
  accruedTotalGratuity: number; // (Basic * 0.5) * yearsOfService
  monthlyGratuityProvision: number;
  gratuityPayoutInSlip: number;
  // Gross Earnings
  grossEarnings: number;
  // Deductions
  epfEmployeeRate: number;
  epfEmployeeDeduction: number; // 8%
  activeLoansCount: number;
  loanPrincipalDeduction: number;
  loanInterestDeduction: number;
  totalLoanDeduction: number;
  lateMinutesMonth: number;
  lateDeduction: number;
  apitTaxDeduction: number;
  totalDeductions: number;
  // Net Salary
  netPayableSalary: number;
  // Employer Statutory Contributions (Sri Lankan Law)
  epfEmployerRate: number;
  epfEmployerContribution: number; // 12%
  etfEmployerRate: number;
  etfEmployerContribution: number; // 3%
  totalStatutoryRemittance: number; // 23% (8% + 12% + 3%)
  totalCompanyCostToCompany: number; // Gross + Employer EPF + Employer ETF + Monthly Gratuity
}


