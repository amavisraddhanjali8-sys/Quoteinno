import React, { useState, useMemo } from 'react';
import { 
  Users, Building2, Briefcase, UserCheck, ShieldCheck, 
  Clock, DollarSign, Award, GraduationCap, AlertCircle, 
  FileText, TrendingUp, BarChart3, Search, Plus, 
  Download, Barcode, UploadCloud, LayoutDashboard, Fingerprint, Scan, Coffee, CreditCard, FileSpreadsheet
} from 'lucide-react';
import { useSecurity } from '../../../context/SecurityContext';
import { hrService } from '../../../services/hrService';
import { HumanCapitalLandingPage } from './HumanCapitalLandingPage';
import { BiometricLaserScanningStation } from '../../workforce/BiometricLaserScanningStation';
import { AdvancedCompensationPaysheetHub } from '../../workforce/AdvancedCompensationPaysheetHub';
import { RoleScopedFactoryProjectHub } from './RoleScopedFactoryProjectHub';
import { Personnel, Project } from '../../../types';
import { 
  HRPortalView,
  HREmployeeMaster,
  HRPosition,
  HRVacancy,
  HRCandidate,
  HRAttendanceRecord,
  HRLeaveRequest,
  HRProjectTimesheet,
  HRCase,
  HREmployeeAsset,
  HRDocument,
  HRKPIDefinition,
  HRWorkforceSnapshot
} from '../../../types/hr';
import { toast } from 'sonner';

export const HRPortal: React.FC = () => {
  const { currentUser } = useSecurity();

  // Active Sub-Portal View
  const [activePortal, setActivePortal] = useState<HRPortalView>(() => hrService.getActiveSubPortal());

  // Data states from service
  const [employees, setEmployees] = useState<HREmployeeMaster[]>(() => hrService.getEmployees(currentUser));
  const [positions, setPositions] = useState<HRPosition[]>(() => hrService.getPositions());
  const [vacancies, setVacancies] = useState<HRVacancy[]>(() => hrService.getVacancies());
  const [candidates, setCandidates] = useState<HRCandidate[]>(() => hrService.getCandidates());
  const [attendance, setAttendance] = useState<HRAttendanceRecord[]>(() => hrService.getAttendanceRecords());
  const [leaveRequests, setLeaveRequests] = useState<HRLeaveRequest[]>(() => hrService.getLeaveRequests());
  const [timesheets, setTimesheets] = useState<HRProjectTimesheet[]>(() => hrService.getTimesheets());
  const [cases, setCases] = useState<HRCase[]>(() => hrService.getCases(currentUser));
  const [assets, setAssets] = useState<HREmployeeAsset[]>(() => hrService.getAssets());
  const [documents, setDocuments] = useState<HRDocument[]>(() => hrService.getDocuments());
  const [kpis, setKpis] = useState<HRKPIDefinition[]>(() => hrService.getKPIs());
  const [snapshot, setSnapshot] = useState<HRWorkforceSnapshot>(() => hrService.getWorkforceSnapshot());

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('ALL');

  // Drawer / Modals
  const [selectedEmployee, setSelectedEmployee] = useState<HREmployeeMaster | null>(null);
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [showAddVacancyModal, setShowAddVacancyModal] = useState(false);
  const [showApplyLeaveModal, setShowApplyLeaveModal] = useState(false);
  const [showLogCaseModal, setShowLogCaseModal] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showBiometricStationModal, setShowBiometricStationModal] = useState(false);

  // Map employees to Personnel for Biometric Scanner Station
  const mappedPersonnel: Personnel[] = useMemo(() => {
    return employees.map(e => ({
      id: e.id,
      employeeId: e.employeeCode,
      name: e.fullName,
      role: e.positionTitle,
      department: e.departmentCode,
      skillLevel: 'Master' as const,
      contact: e.workEmail,
      hourlyRate: 1450,
      status: e.employmentStatus === 'Active' ? 'Available' as const : 'On Leave' as const,
      skills: e.skills?.map(s => ({ skill: s.skill, proficiency: (s.level || 4) * 20 })) || [],
      certifications: [] as { type: string; expiry: string }[]
    }));
  }, [employees]);

  const defaultProjects: Project[] = useMemo(() => [
    {
      id: 'Sirius Mall Storefront',
      projectName: 'Sirius Mall High-Rise Curtain Wall',
      client: {
        id: 'c1',
        name: 'Sirius Real Estate',
        email: 'info@sirius.com',
        phone: '+971 4 000 0000',
        address: 'Dubai',
        category: 'Developer',
        status: 'Active',
        creditLimit: 5000000,
        paymentTerms: 'Net 30',
        taxId: 'TRN-100299381',
        contactPerson: 'Tariq Al-Ghurair',
        createdAt: '2025-01-01',
        updatedAt: '2026-01-01',
        notes: 'Key commercial developer',
        portalAccess: true
      },
      startDate: '2026-01-10',
      status: 'In Progress',
      totalValue: 850000,
      items: [] as any[],
      quoteId: 'q-01',
      updatedAt: '2026-01-10',
      variationRequests: [],
      auditLog: []
    },
    {
      id: 'Apex Tower Structural Glazing',
      projectName: 'Apex Tower Structural Glazing',
      client: {
        id: 'c3',
        name: 'Apex Holdings',
        email: 'apex@holdings.com',
        phone: '+971 4 111 2222',
        address: 'Dubai',
        category: 'Corporate',
        status: 'Active',
        creditLimit: 3000000,
        paymentTerms: 'Net 30',
        taxId: 'TRN-100299382',
        contactPerson: 'Nadia Mansoor',
        createdAt: '2025-02-01',
        updatedAt: '2026-01-01',
        notes: 'Corporate tower developer',
        portalAccess: true
      },
      startDate: '2026-02-15',
      status: 'In Progress',
      totalValue: 1250000,
      items: [] as any[],
      quoteId: 'q-03',
      updatedAt: '2026-02-15',
      variationRequests: [],
      auditLog: []
    },
    {
      id: 'Emerald Pavilion Louvre & Canopy',
      projectName: 'Emerald Pavilion Louvre & Canopy',
      client: {
        id: 'c2',
        name: 'Emerald Developments',
        email: 'emerald@build.com',
        phone: '+971 4 222 3333',
        address: 'Abu Dhabi',
        category: 'Developer',
        status: 'Active',
        creditLimit: 2000000,
        paymentTerms: 'Net 30',
        taxId: 'TRN-100299383',
        contactPerson: 'Samir Khalil',
        createdAt: '2025-03-01',
        updatedAt: '2026-01-01',
        notes: 'Hospitality & retail client',
        portalAccess: true
      },
      startDate: '2026-03-01',
      status: 'In Progress',
      totalValue: 420000,
      items: [] as any[],
      quoteId: 'q-02',
      updatedAt: '2026-03-01',
      variationRequests: [] as any[],
      auditLog: [] as any[]
    }
  ] as unknown as Project[], []);

  // Synchronize with hrService sub-portal
  const handleSwitchPortal = (view: HRPortalView) => {
    setActivePortal(view);
    hrService.setActiveSubPortal(view);
  };

  // Reload all data
  const refreshData = () => {
    setEmployees(hrService.getEmployees(currentUser));
    setPositions(hrService.getPositions());
    setVacancies(hrService.getVacancies());
    setCandidates(hrService.getCandidates());
    setAttendance(hrService.getAttendanceRecords());
    setLeaveRequests(hrService.getLeaveRequests());
    setTimesheets(hrService.getTimesheets());
    setCases(hrService.getCases(currentUser));
    setAssets(hrService.getAssets());
    setDocuments(hrService.getDocuments());
    setKpis(hrService.getKPIs());
    setSnapshot(hrService.getWorkforceSnapshot());
  };

  // Can user see sensitive salary figures?
  const canViewSalaries = useMemo(() => hrService.canViewSalaries(currentUser), [currentUser]);

  // List of all Portals
  const PORTAL_OPTIONS: { id: HRPortalView; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'landing', label: '0. Command Hub', icon: LayoutDashboard },
    { id: 'biometrics', label: '1. Biometrics & Laser', icon: Fingerprint },
    { id: 'meals', label: '2. Tea & Meal Scan', icon: Coffee },
    { id: 'compensation', label: '3. Paysheet & EPF/ETF', icon: FileSpreadsheet },
    { id: 'loans', label: '4. Loans & Repayments', icon: CreditCard },
    { id: 'executive', label: '5. Executive', icon: Building2 },
    { id: 'admin', label: '6. HR Master', icon: Users },
    { id: 'recruitment', label: '7. Recruitment', icon: Briefcase },
    { id: 'ess', label: '8. ESS', icon: UserCheck },
    { id: 'mss', label: '9. MSS', icon: ShieldCheck },
    { id: 'attendance', label: '10. Attendance', icon: Clock },
    { id: 'payroll', label: '11. Payroll', icon: DollarSign },
    { id: 'performance', label: '12. Performance', icon: Award },
    { id: 'learning', label: '13. Learning', icon: GraduationCap },
    { id: 'relations', label: '14. Relations', icon: AlertCircle },
    { id: 'documents', label: '15. Documents', icon: FileText },
    { id: 'planning', label: '16. Planning', icon: TrendingUp },
    { id: 'analytics', label: '17. Analytics', icon: BarChart3 },
  ];

  // Quick punch simulator
  const handleQuickPunch = (type: 'IN' | 'OUT') => {
    try {
      const empId = employees[0]?.id || 'emp-03';
      hrService.punchClock(currentUser, empId, type, 'WEB');
      refreshData();
      toast.success(`Clock ${type} recorded successfully for today.`);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  // Export helper
  const handleExportCSV = () => {
    const headers = ['Employee Code', 'Full Name', 'Department', 'Position', 'Status', 'Joining Date'];
    const rows = employees.map(e => [e.employeeCode, e.fullName, e.departmentCode, e.positionTitle, e.employmentStatus, e.dateOfJoining]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `innovista_hr_master_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('HR Master Data exported to CSV.');
  };

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto">
      {/* SINGLE LINE COMPACT HEADING / TOOLBAR */}
      <header className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 flex items-center justify-between gap-3 shadow-xs">
        {/* Heading on one line */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Users className="w-4 h-4" />
          </div>
          <div className="flex items-baseline gap-2 min-w-0">
            <h1 className="text-sm font-bold text-slate-900 whitespace-nowrap">
              Human Capital
            </h1>
          </div>
        </div>

        {/* Middle: Single-Line Portal Dropdown Switcher */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-slate-500 whitespace-nowrap hidden sm:inline">Active View:</label>
          <div className="relative">
            <select
              value={activePortal}
              onChange={(e) => handleSwitchPortal(e.target.value as HRPortalView)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
            >
              {PORTAL_OPTIONS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right Tools: Quick Actions on same line */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowBiometricStationModal(true)}
            className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            title="Biometric Station"
          >
            <Fingerprint className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Biometrics & Laser</span>
            <span className="sm:hidden">Bio</span>
          </button>
          <button
            onClick={() => handleQuickPunch('IN')}
            className="px-2.5 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 transition-colors shadow-xs hidden lg:inline-flex items-center gap-1 cursor-pointer"
            title="Clock In"
          >
            <Clock className="w-3.5 h-3.5" /> Clock In
          </button>
          <button
            onClick={() => handleQuickPunch('OUT')}
            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium transition-colors shadow-xs hidden lg:inline-flex items-center gap-1 cursor-pointer"
            title="Clock Out"
          >
            <Clock className="w-3.5 h-3.5 text-slate-500" /> Clock Out
          </button>
          <button
            onClick={handleExportCSV}
            className="px-2.5 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50 transition-colors shadow-xs inline-flex items-center gap-1 cursor-pointer"
            title="Export Records"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" /> Export
          </button>
        </div>
      </header>

      {/* QUICK SUB-PORTAL PILL SELECTOR FOR INSTANT ONE-CLICK ACCESS */}
      <div className="bg-white border border-slate-200 rounded-xl p-2 flex items-center gap-1.5 overflow-x-auto shadow-xs">
        {PORTAL_OPTIONS.map((p) => {
          const Icon = p.icon;
          const isActive = activePortal === p.id;
          return (
            <button
              key={p.id}
              onClick={() => handleSwitchPortal(p.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                isActive
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{p.label.split('. ')[1]}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* OWNED FACTORY HR & PAYROLL + PROJECT FACTORY SUPERVISING ASSIGNMENTS      */}
      {/* ========================================================================= */}
      <RoleScopedFactoryProjectHub
        portalName="Human Capital, Owned Factory Payroll & Project Supervising Roster"
        defaultSubTab="hr_payroll"
      />

      {/* ========================================================================= */}
      {/* 0. COMMAND CENTER (LANDING PAGE) */}
      {/* ========================================================================= */}
      {activePortal === 'landing' && (
        <HumanCapitalLandingPage
          onNavigatePortal={handleSwitchPortal}
          onQuickPunch={handleQuickPunch}
          onOpenBiometrics={() => setShowBiometricStationModal(true)}
          onOpenAddEmployee={() => setShowAddEmployeeModal(true)}
          onOpenAddVacancy={() => setShowAddVacancyModal(true)}
          onOpenApplyLeave={() => setShowApplyLeaveModal(true)}
          onOpenLogCase={() => setShowLogCaseModal(true)}
          onExportCSV={handleExportCSV}
          counts={{
            totalEmployees: snapshot.totalHeadcount,
            activeVacancies: vacancies.filter(v => v.status === 'Open' || v.status === 'Interviewing').length,
            pendingLeave: leaveRequests.filter(l => l.status === 'Pending').length,
            openCases: cases.filter(c => c.status !== 'Resolved & Closed').length,
            todayPresent: snapshot.activeHeadcount
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* BIOMETRICS, ARRIVAL/LEAVE, SHIFT, OT & MEAL/TEA SCANNING HUB              */}
      {/* ========================================================================= */}
      {(activePortal === 'biometrics' || activePortal === 'meals') && (
        <BiometricLaserScanningStation
          personnel={mappedPersonnel}
          projects={defaultProjects}
          onTimesheetLogged={() => {
            refreshData();
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* PAYSHEET, SRI LANKAN EPF/ETF, LOANS, BONUSES, GRATUITY & ALLOWANCES       */}
      {/* ========================================================================= */}
      {(activePortal === 'compensation' || activePortal === 'loans') && (
        <AdvancedCompensationPaysheetHub />
      )}

      {/* ========================================================================= */}
      {/* 1. EXECUTIVE HR PORTAL */}
      {/* ========================================================================= */}
      {activePortal === 'executive' && (
        <div className="space-y-4">
          {/* Executive KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
              <span className="text-xs font-medium text-slate-500 block">Total Workforce</span>
              <div className="text-xl font-bold text-slate-900 mt-1">{snapshot.totalHeadcount}</div>
              <span className="text-[11px] text-emerald-600 font-medium">100% Verified</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
              <span className="text-xs font-medium text-slate-500 block">Active on Shift</span>
              <div className="text-xl font-bold text-slate-900 mt-1">{snapshot.activeHeadcount}</div>
              <span className="text-[11px] text-slate-400 font-medium">Dubai & Sharjah Yards</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
              <span className="text-xs font-medium text-slate-500 block">Monthly Gross Payroll</span>
              <div className="text-xl font-bold text-slate-900 mt-1">
                {canViewSalaries ? `AED ${(snapshot.monthlyPayrollTotal / 1000).toFixed(1)}k` : '••••••'}
              </div>
              <span className="text-[11px] text-slate-400 font-medium">WPS Compliant</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
              <span className="text-xs font-medium text-slate-500 block">Open Vacancies</span>
              <div className="text-xl font-bold text-orange-600 mt-1">{snapshot.openVacanciesCount}</div>
              <span className="text-[11px] text-slate-400 font-medium">2 Urgent Welder Roles</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
              <span className="text-xs font-medium text-slate-500 block">Absenteeism Rate</span>
              <div className="text-xl font-bold text-slate-900 mt-1">{snapshot.absenteeismRatePercent}%</div>
              <span className="text-[11px] text-emerald-600 font-medium">Well below 2.5% cap</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
              <span className="text-xs font-medium text-slate-500 block">Expiring Documents</span>
              <div className="text-xl font-bold text-amber-600 mt-1">{snapshot.expiringDocumentsCount}</div>
              <span className="text-[11px] text-amber-600 font-medium">Within 60 days</span>
            </div>
          </div>

          {/* Department Breakdown & Approvals Queue */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">Department Workforce Distribution & Capacity</h2>
                <span className="text-xs text-slate-400">Approved Seats: 105</span>
              </div>
              <div className="divide-y divide-slate-100 text-xs">
                {hrService.getDepartments().map((dept) => {
                  const deptEmps = employees.filter(e => e.departmentCode === dept.code).length;
                  const pct = Math.round((deptEmps / dept.approvedHeadcount) * 100);
                  return (
                    <div key={dept.id} className="py-2.5 flex items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-slate-800 truncate">{dept.name}</div>
                        <div className="text-[11px] text-slate-400">Head: {dept.headOfDepartmentName || 'Assigned Lead'} • {dept.costCenterCode}</div>
                      </div>
                      <div className="w-36 text-right">
                        <div className="font-bold text-slate-800">{deptEmps} / {dept.approvedHeadcount} <span className="text-[10px] text-slate-400 font-normal">({pct}%)</span></div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                          <div className="bg-orange-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, pct)}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">Pending Executive Approvals</h2>
                <span className="px-1.5 py-0.5 bg-orange-100 text-orange-800 rounded font-mono text-[10px] font-bold">{leaveRequests.filter(l => l.status === 'Pending').length} Pending</span>
              </div>
              <div className="space-y-2 text-xs">
                {leaveRequests.filter(l => l.status === 'Pending').map((req) => (
                  <div key={req.id} className="p-3 border border-slate-200 rounded-lg bg-slate-50/50 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-slate-900 block">{req.employeeName}</span>
                        <span className="text-[11px] text-slate-500">{req.leaveTypeName} • {req.totalDays} Days</span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-semibold">Leave</span>
                    </div>
                    <p className="text-[11px] text-slate-600 italic">"{req.reason}"</p>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => {
                          hrService.reviewLeaveRequest(currentUser, req.id, 'Approved', 'Approved by Executive');
                          refreshData();
                          toast.success(`Leave request ${req.requestNumber} approved.`);
                        }}
                        className="flex-1 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold text-center transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          hrService.reviewLeaveRequest(currentUser, req.id, 'Rejected', 'Rejected by Executive');
                          refreshData();
                          toast.info(`Leave request ${req.requestNumber} rejected.`);
                        }}
                        className="flex-1 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded text-xs font-medium text-center transition-colors"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
                {leaveRequests.filter(l => l.status === 'Pending').length === 0 && (
                  <div className="p-8 text-center text-slate-400 text-xs">No pending executive approvals at this time.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. HR ADMINISTRATION & EMPLOYEE MASTER PORTAL */}
      {/* ========================================================================= */}
      {activePortal === 'admin' && (
        <div className="space-y-4">
          {/* Action Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name, badge, role..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-orange-500"
                />
              </div>
              <select
                value={selectedDeptFilter}
                onChange={(e) => setSelectedDeptFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none text-slate-700"
              >
                <option value="ALL">All Departments</option>
                <option value="FABRICATION">Fabrication</option>
                <option value="ENGINEERING">Engineering</option>
                <option value="QUALITY">Quality</option>
                <option value="COMMERCIAL_ADMIN">Commercial / HR</option>
              </select>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={() => setShowAddEmployeeModal(true)}
                className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1 shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Employee
              </button>
            </div>
          </div>

          {/* Employee Master Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="py-2.5 px-3">Badge / ID</th>
                    <th className="py-2.5 px-3">Employee Name</th>
                    <th className="py-2.5 px-3">Position & Grade</th>
                    <th className="py-2.5 px-3">Department</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Joining Date</th>
                    {canViewSalaries && <th className="py-2.5 px-3 text-right">Gross Salary</th>}
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {employees
                    .filter(e => {
                      const matchSearch = e.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                          e.badgeNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                          e.positionTitle.toLowerCase().includes(searchQuery.toLowerCase());
                      const matchDept = selectedDeptFilter === 'ALL' || e.departmentCode === selectedDeptFilter;
                      return matchSearch && matchDept;
                    })
                    .map((emp) => (
                      <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors whitespace-nowrap">
                        <td className="py-2 px-3 font-mono font-bold text-slate-800">{emp.badgeNumber}</td>
                        <td className="py-2 px-3 font-semibold text-slate-900 truncate max-w-[180px]">{emp.fullName}</td>
                        <td className="py-2 px-3 text-slate-700 font-medium truncate max-w-[160px]">{emp.positionTitle}</td>
                        <td className="py-2 px-3 text-slate-600">{emp.departmentCode}</td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            emp.employmentStatus === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {emp.employmentStatus}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-600">{emp.dateOfJoining}</td>
                        {canViewSalaries && (
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                            {emp.currency} {emp.grossSalary.toLocaleString()}
                          </td>
                        )}
                        <td className="py-2 px-3 text-center">
                          <button
                            onClick={() => setSelectedEmployee(emp)}
                            className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold transition-colors cursor-pointer"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Approved Positions & Capacity */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Approved Position Master & Occupancy</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
              {positions.map((pos) => (
                <div key={pos.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                  <div className="font-bold text-slate-900">{pos.title}</div>
                  <div className="text-[11px] text-slate-500 font-mono">{pos.positionCode} • Grade: {pos.gradeCode}</div>
                  <div className="flex justify-between items-center mt-2 text-[11px]">
                    <span className="text-slate-600">Occupancy: {pos.currentOccupancy} / {pos.approvedHeadcount}</span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-semibold">{pos.vacancyStatus}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. RECRUITMENT / ATS PORTAL */}
      {/* ========================================================================= */}
      {activePortal === 'recruitment' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">Open Requisitions & Candidate Pipeline</h2>
              <p className="text-xs text-slate-500 mt-0.5">Track manpower requests from requisition to offer acceptance and shop-floor crewing.</p>
            </div>
            <button
              onClick={() => setShowAddVacancyModal(true)}
              className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Create Requisition
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vacancies.map((v) => (
              <div key={v.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono text-[11px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded">{v.requisitionNumber}</span>
                    <h3 className="text-sm font-bold text-slate-900 mt-1.5">{v.positionTitle}</h3>
                    <div className="text-xs text-slate-500">{v.departmentCode} • {v.branch}</div>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded text-[10px] font-bold uppercase">{v.status}</span>
                </div>
                <p className="text-xs text-slate-600 line-clamp-2">{v.jobDescription}</p>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Headcount Needed: <strong className="text-slate-800">{v.headcountRequired}</strong></span>
                  <span>Target Date: <strong className="text-slate-800">{v.targetHireDate}</strong></span>
                  <span>Applicants: <strong className="text-orange-600 font-bold">{v.applicantsCount}</strong></span>
                </div>
              </div>
            ))}
          </div>

          {/* Candidate Pipeline */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Candidate Pipeline & Interview Assessments</h3>
            <div className="divide-y divide-slate-100 text-xs">
              {candidates.map((c) => (
                <div key={c.id} className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{c.fullName}</span>
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold text-[10px]">{c.stage}</span>
                      <span className="text-amber-500 font-bold text-[11px]">★ {c.rating} / 5.0</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {c.currentTitle} at {c.currentCompany} ({c.experienceYears} yrs exp) • Expected: AED {c.expectedSalary}
                    </div>
                    <div className="text-[11px] text-slate-600 mt-1 italic line-clamp-1">{c.cvSummary}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    {c.stage === 'Screening' && (
                      <button
                        onClick={() => {
                          hrService.updateCandidateStage(currentUser, c.id, 'Interview Scheduled', 'Schedule technical coupon test in Bay A');
                          refreshData();
                          toast.success(`${c.fullName} moved to Interview Scheduled.`);
                        }}
                        className="px-2.5 py-1 bg-slate-900 text-white rounded text-xs font-medium hover:bg-slate-800"
                      >
                        Schedule Interview
                      </button>
                    )}
                    {c.stage === 'Interview Scheduled' && (
                      <button
                        onClick={() => {
                          hrService.updateCandidateStage(currentUser, c.id, 'Offer Extended', 'Coupon test passed with 100% UT clear');
                          refreshData();
                          toast.success(`Offer extended to ${c.fullName}.`);
                        }}
                        className="px-2.5 py-1 bg-emerald-600 text-white rounded text-xs font-semibold hover:bg-emerald-700"
                      >
                        Extend Offer
                      </button>
                    )}
                    {c.stage === 'Offer Extended' && (
                      <button
                        onClick={() => {
                          hrService.updateCandidateStage(currentUser, c.id, 'Hired', 'Offer signed; onboarding checklist generated');
                          refreshData();
                          toast.success(`${c.fullName} confirmed Hired!`);
                        }}
                        className="px-2.5 py-1 bg-orange-500 text-white rounded text-xs font-semibold hover:bg-orange-600"
                      >
                        Confirm Hire
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. EMPLOYEE SELF-SERVICE (ESS) PORTAL */}
      {/* ========================================================================= */}
      {activePortal === 'ess' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 font-bold flex items-center justify-center text-base border border-orange-200">
                {currentUser?.fullName.charAt(0) || 'E'}
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">{currentUser?.fullName}</h2>
                <div className="text-xs text-slate-500">{currentUser?.designation} • {currentUser?.department} • Badge: BADGE-104</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowApplyLeaveModal(true)}
                className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-xs font-semibold hover:bg-orange-600 transition-colors shadow-xs"
              >
                Apply for Leave
              </button>
              <button
                onClick={() => setShowQRScanner(true)}
                className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50 transition-colors shadow-xs inline-flex items-center gap-1"
              >
                <Barcode className="w-3.5 h-3.5 text-slate-500" /> Barcode Punch
              </button>
            </div>
          </div>

          {/* Quick ESS Gauges */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Annual Leave Balance</span>
              <div className="text-xl font-bold text-blue-600 mt-1">16.5 Days</div>
              <span className="text-[11px] text-slate-400">Total entitlement: 30 days</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Sick Leave Remaining</span>
              <div className="text-xl font-bold text-slate-800 mt-1">14 Days</div>
              <span className="text-[11px] text-slate-400">Paid medical entitlement</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Overtime Recorded</span>
              <div className="text-xl font-bold text-slate-800 mt-1">8.5 Hours</div>
              <span className="text-[11px] text-emerald-600 font-medium">Approved for next payroll</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Assigned Tools / PPE</span>
              <div className="text-xl font-bold text-slate-800 mt-1">4 Items</div>
              <span className="text-[11px] text-slate-400">Speedglas Helmet, Flaw Detector</span>
            </div>
          </div>

          {/* ESS Document Vault */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">My Verified Personnel Documents</h3>
            <div className="divide-y divide-slate-100 text-xs">
              {documents.slice(0, 3).map((d) => (
                <div key={d.id} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-orange-500" />
                    <div>
                      <span className="font-semibold text-slate-800 block">{d.category}</span>
                      <span className="text-[11px] text-slate-400 font-mono">{d.fileName}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      d.status === 'Valid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {d.status} {d.expiryDate ? `(Exp: ${d.expiryDate})` : ''}
                    </span>
                    <button className="text-orange-600 hover:text-orange-700 font-semibold text-xs">Download</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ESS Custody Assets */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">My Custody & Assigned Equipment</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {assets.map((ast) => (
                <div key={ast.id} className="p-3 border border-slate-200 rounded-lg bg-slate-50 text-xs space-y-1">
                  <div className="font-bold text-slate-900">{ast.modelName}</div>
                  <div className="text-slate-500 font-mono text-[11px]">Asset Tag: {ast.assetTag}</div>
                  <div className="text-slate-500 text-[11px]">Issued: {ast.assignedDate} • S/N: {ast.serialNumber}</div>
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-800 mt-1">{ast.conditionOnAssignment}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MANAGER SELF-SERVICE (MSS) PORTAL */}
      {/* ========================================================================= */}
      {activePortal === 'mss' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">Manager Team Control & Approvals</h2>
              <p className="text-xs text-slate-500 mt-0.5">Manage your assigned workshop crew, sign off timesheets, and approve overtime requests.</p>
            </div>
            <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold">
              Supervising: 14 Active Operators
            </span>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Crew Timesheets Pending Sign-off</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="p-2.5">Date</th>
                    <th className="p-2.5">Operator</th>
                    <th className="p-2.5">Project & Task</th>
                    <th className="p-2.5">Hours</th>
                    <th className="p-2.5">Cost Rate</th>
                    <th className="p-2.5">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {timesheets.map((ts) => (
                    <tr key={ts.id} className="hover:bg-slate-50">
                      <td className="p-2.5 font-mono text-slate-600">{ts.date}</td>
                      <td className="p-2.5 font-semibold text-slate-900">{ts.employeeName}</td>
                      <td className="p-2.5 text-slate-700">{ts.projectCode} • {ts.taskActivity}</td>
                      <td className="p-2.5 font-bold text-slate-800">{ts.hoursWorked} hrs {ts.isOvertime ? '(OT)' : ''}</td>
                      <td className="p-2.5 font-mono text-slate-600">AED {ts.totalLaborCost}</td>
                      <td className="p-2.5">
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold text-[10px]">
                          {ts.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. ATTENDANCE & WORKFORCE PORTAL */}
      {/* ========================================================================= */}
      {activePortal === 'attendance' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">Attendance Register</h2>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold">
                Live: 42 Clocked In
              </span>
            </div>
          </div>

          {/* Hardware Ingestion Terminal Status Banner - White Background */}
          <div className="bg-white border border-slate-200 text-slate-900 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 shrink-0">
                <Fingerprint size={16} />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-xs text-slate-900">4 Hardware Terminals</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">18ms</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-600 border border-slate-200">Synced</span>
              </div>
            </div>
            <button
              onClick={() => setShowBiometricStationModal(true)}
              className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer shadow-xs"
            >
              <Scan size={14} />
              <span>Biometric Station</span>
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="p-2.5">Badge</th>
                    <th className="p-2.5">Name</th>
                    <th className="p-2.5">Department</th>
                    <th className="p-2.5">Shift</th>
                    <th className="p-2.5">Clock In</th>
                    <th className="p-2.5">Clock Out</th>
                    <th className="p-2.5">Total Worked</th>
                    <th className="p-2.5">Source</th>
                    <th className="p-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {attendance.map((att) => (
                    <tr key={att.id} className="hover:bg-slate-50">
                      <td className="p-2.5 font-mono font-bold text-slate-800">{att.badgeNumber}</td>
                      <td className="p-2.5 font-semibold text-slate-900">{att.employeeName}</td>
                      <td className="p-2.5 text-slate-600">{att.departmentCode}</td>
                      <td className="p-2.5 text-slate-600">{att.shiftCode}</td>
                      <td className="p-2.5 font-mono font-bold text-emerald-700">{att.actualClockIn}</td>
                      <td className="p-2.5 font-mono text-slate-600">{att.actualClockOut || '--:--'}</td>
                      <td className="p-2.5 font-mono text-slate-800">
                        {Math.floor(att.totalWorkedMinutes / 60)}h {att.totalWorkedMinutes % 60}m
                      </td>
                      <td className="p-2.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-100 text-slate-700">
                          {att.source}
                        </span>
                      </td>
                      <td className="p-2.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                          {att.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. PAYROLL & COMPENSATION PORTAL */}
      {/* ========================================================================= */}
      {activePortal === 'payroll' && (
        <div className="space-y-4">
          <AdvancedCompensationPaysheetHub />
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">Payroll Cycle & WPS Salary Compliance (MOL UAE)</h2>
              <p className="text-xs text-slate-500 mt-0.5">Automated salary structures, overtime formula integration, and SIF file generator.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold">
                Batch: WPS-MOL-202609-INNOVISTA
              </span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="p-2.5">Badge</th>
                    <th className="p-2.5">Employee</th>
                    <th className="p-2.5">Department</th>
                    <th className="p-2.5 text-right">Basic</th>
                    <th className="p-2.5 text-right">Housing</th>
                    <th className="p-2.5 text-right">Transport</th>
                    <th className="p-2.5 text-right">Gross Total</th>
                    <th className="p-2.5">IBAN Account</th>
                    <th className="p-2.5">Routing</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {employees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50">
                      <td className="p-2.5 font-mono font-bold text-slate-800">{emp.badgeNumber}</td>
                      <td className="p-2.5 font-semibold text-slate-900">{emp.fullName}</td>
                      <td className="p-2.5 text-slate-600">{emp.departmentCode}</td>
                      <td className="p-2.5 text-right font-mono text-slate-700">
                        {canViewSalaries ? `AED ${emp.basicSalary.toLocaleString()}` : '••••••'}
                      </td>
                      <td className="p-2.5 text-right font-mono text-slate-700">
                        {canViewSalaries ? `AED ${emp.housingAllowance.toLocaleString()}` : '••••••'}
                      </td>
                      <td className="p-2.5 text-right font-mono text-slate-700">
                        {canViewSalaries ? `AED ${emp.transportAllowance.toLocaleString()}` : '••••••'}
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                        {canViewSalaries ? `AED ${emp.grossSalary.toLocaleString()}` : '••••••'}
                      </td>
                      <td className="p-2.5 font-mono text-[11px] text-slate-600">{emp.iban}</td>
                      <td className="p-2.5 font-mono text-[11px] text-slate-500">{emp.wpsRoutingCode}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. PERFORMANCE MANAGEMENT PORTAL */}
      {/* ========================================================================= */}
      {activePortal === 'performance' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">Performance Appraisal & Goals (Cycle: REV-2026-H1)</h2>
              <p className="text-xs text-slate-500 mt-0.5">Weighted KPIs, mid-year check-ins, peer 360 feedback, and promotion readiness ratings.</p>
            </div>
            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-semibold">Active Review Cycle</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-2">
              <span className="text-xs font-bold text-slate-800">Cycle Completion</span>
              <div className="text-2xl font-bold text-slate-900">84%</div>
              <p className="text-xs text-slate-500">42 of 50 self-reviews submitted.</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-2">
              <span className="text-xs font-bold text-slate-800">High Performers (Exceeds / Outstanding)</span>
              <div className="text-2xl font-bold text-emerald-600">22%</div>
              <p className="text-xs text-slate-500">Qualify for annual merit increments.</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-2">
              <span className="text-xs font-bold text-slate-800">PIP / Performance Support</span>
              <div className="text-2xl font-bold text-amber-600">2 Staff</div>
              <p className="text-xs text-slate-500">Assigned mentor in technical training.</p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. LEARNING & DEVELOPMENT (LMS) PORTAL */}
      {/* ========================================================================= */}
      {activePortal === 'learning' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">Craft Qualifications & Certified Skills Matrix</h2>
              <p className="text-xs text-slate-500 mt-0.5">AWS D1.1 structural welding, ASME Section IX, Trumpf Laser CNC programming, and CSWIP QA/QC.</p>
            </div>
            <button className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-xs font-semibold shadow-xs">
              Add Training Course
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Workshop Certified Credentials Register</h3>
            <div className="divide-y divide-slate-100 text-xs">
              {employees.flatMap(e => e.certifications.map(c => ({ ...c, employeeName: e.fullName, badge: e.badgeNumber }))).map((cert, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <div>
                      <span className="font-semibold text-slate-900 block">{cert.name}</span>
                      <span className="text-[11px] text-slate-500">Holder: {cert.employeeName} ({cert.badge}) • Issuer: {cert.issuer}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] font-mono">ID: {cert.certificateId}</span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-semibold">Valid to: {cert.validUntil}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 10. EMPLOYEE RELATIONS & CASES PORTAL */}
      {/* ========================================================================= */}
      {activePortal === 'relations' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">Employee Relations & Disciplinary Case Register</h2>
              <p className="text-xs text-slate-500 mt-0.5">Strictly confidential grievance management, HSE incident reports, and corrective inquiries.</p>
            </div>
            <button
              onClick={() => setShowLogCaseModal(true)}
              className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              Log Incident / Grievance
            </button>
          </div>

          <div className="space-y-3">
            {cases.map((c) => (
              <div key={c.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs bg-slate-100 px-2 py-0.5 rounded">{c.caseNumber}</span>
                      <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-semibold">{c.type}</span>
                      <span className="text-rose-600 text-[11px] font-bold">({c.confidentiality})</span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mt-1.5">{c.title}</h3>
                    <div className="text-xs text-slate-500">Employee: {c.employeeName} • Department: {c.departmentCode} • Incident Date: {c.incidentDate}</div>
                  </div>
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold">{c.status}</span>
                </div>
                <p className="text-xs text-slate-600">{c.description}</p>
                {c.actionTaken && (
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                    <span className="font-bold text-slate-800">Action Taken: </span>
                    <span className="text-slate-600">{c.actionTaken}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 11. HR DOCUMENT & COMPLIANCE PORTAL */}
      {/* ========================================================================= */}
      {activePortal === 'documents' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">Digital Personnel File & Expiry Alerts</h2>
              <p className="text-xs text-slate-500 mt-0.5">Central repository for Emirates IDs, Passports, Visas, Trade Licenses, and WPQR weld tests.</p>
            </div>
            <button className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-xs font-semibold shadow-xs inline-flex items-center gap-1">
              <UploadCloud className="w-3.5 h-3.5" /> Upload Document
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="p-2.5">Doc #</th>
                    <th className="p-2.5">Employee</th>
                    <th className="p-2.5">Category</th>
                    <th className="p-2.5">File Name</th>
                    <th className="p-2.5">Expiry Date</th>
                    <th className="p-2.5">Status</th>
                    <th className="p-2.5">Verified By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {documents.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50">
                      <td className="p-2.5 font-mono font-bold text-slate-800">{d.documentNumber}</td>
                      <td className="p-2.5 font-semibold text-slate-900">{d.employeeName}</td>
                      <td className="p-2.5 text-slate-700">{d.category}</td>
                      <td className="p-2.5 font-mono text-slate-500">{d.fileName}</td>
                      <td className="p-2.5 font-mono text-slate-700">{d.expiryDate || 'N/A'}</td>
                      <td className="p-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          d.status === 'Valid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {d.status}
                        </span>
                      </td>
                      <td className="p-2.5 text-slate-600">{d.verifiedBy || 'Pending'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 12. WORKFORCE PLANNING PORTAL */}
      {/* ========================================================================= */}
      {activePortal === 'planning' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">Project Manpower Requirements & Labour Cost Forecast</h2>
              <p className="text-xs text-slate-500 mt-0.5">Integrates directly with active project charters and contracts for accurate crewing allocations.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">PRJ-2026-001: Al-Noor Tower Mega Facade</h3>
              <p className="text-xs text-slate-500">Estimated Project Fabrication Duration: 6 Months</p>
              <div className="divide-y divide-slate-100 text-xs">
                <div className="py-2 flex justify-between">
                  <span className="text-slate-700">Certified Welder 6G Required:</span>
                  <strong className="text-slate-900">8 Allocated / 8 Planned</strong>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-slate-700">CNC Laser Operators:</span>
                  <strong className="text-slate-900">3 Allocated / 4 Planned</strong>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-slate-700">QA/QC NDT Inspectors:</span>
                  <strong className="text-slate-900">2 Allocated / 2 Planned</strong>
                </div>
                <div className="py-2 flex justify-between font-bold pt-2">
                  <span className="text-slate-900">Committed Labour Cost:</span>
                  <span className="text-orange-600">AED 145,000 / month</span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">PRJ-2026-002: Marina Bay Mega Hangar</h3>
              <p className="text-xs text-slate-500">Structural Assembly in Abu Dhabi Yard</p>
              <div className="divide-y divide-slate-100 text-xs">
                <div className="py-2 flex justify-between">
                  <span className="text-slate-700">Heavy Riggers & Fitters:</span>
                  <strong className="text-slate-900">6 Allocated / 8 Planned (Gap: 2)</strong>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-slate-700">Site Safety Leads:</span>
                  <strong className="text-slate-900">2 Allocated / 2 Planned</strong>
                </div>
                <div className="py-2 flex justify-between font-bold pt-2">
                  <span className="text-slate-900">Committed Labour Cost:</span>
                  <span className="text-orange-600">AED 98,000 / month</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 13. HR ANALYTICS & REPORTING PORTAL */}
      {/* ========================================================================= */}
      {activePortal === 'analytics' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">Enterprise HR KPI Engine & Strategic Analytics</h2>
              <p className="text-xs text-slate-500 mt-0.5">Calculated workforce efficiency metrics, overtime ratios, and retention indicators.</p>
            </div>
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-xs font-semibold shadow-xs inline-flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" /> Download Snapshot Report
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {kpis.map((k) => (
              <div key={k.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono text-[10px] font-bold text-slate-400">{k.kpiCode}</span>
                    <h3 className="text-sm font-bold text-slate-900 mt-0.5">{k.name}</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-semibold">{k.status}</span>
                </div>
                <div className="flex items-baseline gap-2 pt-1">
                  <span className="text-2xl font-bold text-slate-900">{k.currentActual} {k.unit}</span>
                  <span className="text-xs text-slate-500">Target: {k.targetValue} {k.unit}</span>
                </div>
                <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-100">{k.formulaDescription}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS & DRAWERS */}
      {/* ========================================================================= */}

      {/* EMPLOYEE 360 PROFILE DRAWER */}
      {selectedEmployee && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex justify-end z-50 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl h-full shadow-2xl overflow-y-auto border-l border-slate-200 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                  {selectedEmployee.fullName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{selectedEmployee.fullName}</h3>
                  <div className="text-xs text-slate-500 font-mono">{selectedEmployee.badgeNumber} • {selectedEmployee.employeeCode}</div>
                </div>
              </div>
              <button
                onClick={() => setSelectedEmployee(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Organization & Role</span>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                  <div>Designation: <strong className="text-slate-800">{selectedEmployee.positionTitle}</strong></div>
                  <div>Department: <strong className="text-slate-800">{selectedEmployee.departmentCode}</strong></div>
                  <div>Facility / Branch: <strong className="text-slate-800">{selectedEmployee.branch}</strong></div>
                  <div>Salary Grade: <strong className="text-slate-800">{selectedEmployee.gradeCode}</strong></div>
                  <div>Employment Type: <strong className="text-slate-800">{selectedEmployee.employmentType}</strong></div>
                </div>
              </div>

              {canViewSalaries && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Restricted Compensation (Encrypted)</span>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1 font-mono">
                    <div className="flex justify-between"><span>Basic Salary:</span><strong>AED {selectedEmployee.basicSalary.toLocaleString()}</strong></div>
                    <div className="flex justify-between"><span>Housing Allowance:</span><strong>AED {selectedEmployee.housingAllowance.toLocaleString()}</strong></div>
                    <div className="flex justify-between"><span>Transport Allowance:</span><strong>AED {selectedEmployee.transportAllowance.toLocaleString()}</strong></div>
                    <div className="flex justify-between pt-1 border-t border-slate-200 text-slate-900 font-bold">
                      <span>Gross Monthly:</span><strong>AED {selectedEmployee.grossSalary.toLocaleString()}</strong>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-2 font-sans">IBAN: {selectedEmployee.iban}</div>
                  </div>
                </div>
              )}

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Skills & Certifications</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedEmployee.certifications.map((c, i) => (
                    <span key={i} className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded font-medium text-[11px] flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" /> {c.name}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Employment History & Audit Log</span>
                <div className="space-y-2">
                  {selectedEmployee.history.map((h) => (
                    <div key={h.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                      <div className="flex justify-between font-semibold text-slate-800">
                        <span>{h.changeType}</span>
                        <span className="text-slate-400 font-normal">{h.effectiveDate}</span>
                      </div>
                      <div className="text-slate-600 mt-0.5">{h.reason}</div>
                      <div className="text-[10px] text-slate-400 mt-1">Approved by: {h.approvedBy}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD EMPLOYEE MODAL */}
      {showAddEmployeeModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Add New Employee Master Record</h3>
              <button onClick={() => setShowAddEmployeeModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const fd = new FormData(form);
                const fullName = fd.get('fullName') as string;
                const position = fd.get('position') as string;
                const dept = fd.get('department') as string;
                const salary = Number(fd.get('salary')) || 5000;

                const newEmp: HREmployeeMaster = {
                  id: `emp-${Date.now()}`,
                  employeeCode: `INV-${Math.floor(100 + Math.random() * 900)}`,
                  badgeNumber: `BADGE-${Math.floor(200 + Math.random() * 800)}`,
                  fullName,
                  nationalIdOrEmiratesId: '784-1992-0000000-1',
                  passportNumber: 'REG-112233',
                  nationality: 'UAE Resident',
                  gender: 'Male',
                  dateOfBirth: '1992-01-01',
                  maritalStatus: 'Single',
                  workEmail: `${fullName.toLowerCase().replace(/\s+/g, '.')}@innovista-fab.com`,
                  personalEmail: 'candidate@gmail.com',
                  mobile: '+971 50 000 0000',
                  currentAddress: 'Dubai, UAE',
                  emergencyContactName: 'Next of Kin',
                  emergencyContactRelationship: 'Family',
                  emergencyContactPhone: '+971 50 000 0001',
                  companyId: 'comp-01',
                  branch: 'Dubai Fabrication Yard & Central Workshop',
                  departmentCode: dept,
                  positionId: 'pos-03',
                  positionTitle: position,
                  jobGradeId: 'jg-5',
                  gradeCode: 'G5',
                  employmentType: 'Permanent',
                  employmentStatus: 'Active',
                  dateOfJoining: new Date().toISOString().split('T')[0],
                  probationEndDate: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
                  isConfirmed: false,
                  contractStartDate: new Date().toISOString().split('T')[0],
                  currency: 'AED',
                  basicSalary: Math.round(salary * 0.6),
                  housingAllowance: Math.round(salary * 0.25),
                  transportAllowance: Math.round(salary * 0.15),
                  otherAllowances: 0,
                  grossSalary: salary,
                  bankName: 'Emirates NBD',
                  iban: 'AE000000000000000000000',
                  wpsRoutingCode: 'EBILAEAD',
                  highestEducation: 'Technical Diploma',
                  university: 'Technical Institute',
                  skills: [{ skill: position, level: 4, category: 'Technical' }],
                  certifications: [],
                  assignedAssetsCount: 0,
                  activeProjectIds: [],
                  activeProjectNames: [],
                  history: [{
                    id: `hist-${Date.now()}`,
                    effectiveDate: new Date().toISOString().split('T')[0],
                    changeType: 'Hiring',
                    oldValue: 'None',
                    newValue: position,
                    reason: 'Initial onboarding',
                    approvedBy: currentUser?.fullName || 'HR Administrator'
                  }]
                };

                hrService.saveEmployee(currentUser, newEmp);
                refreshData();
                setShowAddEmployeeModal(false);
                toast.success(`Employee ${fullName} onboarded successfully!`);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Legal Name</label>
                <input required name="fullName" placeholder="e.g. Tariq Mansoor" className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department</label>
                  <select name="department" className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none">
                    <option value="FABRICATION">Fabrication</option>
                    <option value="ENGINEERING">Engineering</option>
                    <option value="QUALITY">Quality</option>
                    <option value="COMMERCIAL_ADMIN">Commercial / HR</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Job Designation</label>
                  <input required name="position" placeholder="e.g. Certified Welder" className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none" />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Gross Monthly Salary (AED)</label>
                <input type="number" name="salary" defaultValue={8500} className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none" />
              </div>
              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddEmployeeModal(false)} className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg shadow-xs">Onboard Employee</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* APPLY LEAVE MODAL */}
      {showApplyLeaveModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Submit Leave Application</h3>
              <button onClick={() => setShowApplyLeaveModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const fd = new FormData(form);
                const leaveType = fd.get('leaveType') as string;
                const days = Number(fd.get('days')) || 1;
                const reason = fd.get('reason') as string;

                const req: HRLeaveRequest = {
                  id: `lr-${Date.now()}`,
                  requestNumber: `LV-2026-${Math.floor(100 + Math.random() * 900)}`,
                  employeeId: employees[0]?.id || 'emp-03',
                  employeeName: currentUser?.fullName || employees[0]?.fullName || 'Employee',
                  departmentCode: currentUser?.department || 'FABRICATION',
                  leaveTypeCode: leaveType,
                  leaveTypeName: leaveType === 'ANNUAL' ? 'Annual Paid Leave' : 'Medical / Sick Leave',
                  startDate: new Date().toISOString().split('T')[0],
                  endDate: new Date(Date.now() + days * 86400000).toISOString().split('T')[0],
                  totalDays: days,
                  reason,
                  status: 'Pending',
                  appliedDate: new Date().toISOString().split('T')[0]
                };

                hrService.submitLeaveRequest(currentUser, req);
                refreshData();
                setShowApplyLeaveModal(false);
                toast.success('Leave application submitted for approval.');
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Leave Category</label>
                <select name="leaveType" className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none">
                  <option value="ANNUAL">Annual Paid Leave (16.5 Days Balance)</option>
                  <option value="SICK">Medical / Sick Leave (14 Days Remaining)</option>
                  <option value="EMERGENCY">Emergency / Compassionate Leave</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Duration (Calendar Days)</label>
                <input type="number" name="days" defaultValue={3} min={1} max={30} className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none" />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reason / Justification</label>
                <textarea required name="reason" rows={3} placeholder="Please describe reason..." className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none" />
              </div>
              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setShowApplyLeaveModal(false)} className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg shadow-xs">Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD VACANCY MODAL */}
      {showAddVacancyModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Create Manpower Requisition</h3>
              <button onClick={() => setShowAddVacancyModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const fd = new FormData(form);
                const title = fd.get('title') as string;
                const dept = fd.get('department') as string;
                const headcount = Number(fd.get('headcount')) || 1;
                const desc = fd.get('description') as string;

                const newVac: HRVacancy = {
                  id: `vac-${Date.now()}`,
                  requisitionNumber: `REQ-2026-${Math.floor(100 + Math.random() * 900)}`,
                  positionId: 'pos-03',
                  positionTitle: title,
                  departmentCode: dept,
                  branch: 'Dubai Yard & Central Workshop',
                  employmentType: 'Permanent',
                  headcountRequired: headcount,
                  openDate: new Date().toISOString().split('T')[0],
                  targetHireDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
                  salaryMin: 5000,
                  salaryMax: 12000,
                  status: 'Open',
                  hiringManagerId: currentUser?.id || 'emp-01',
                  hiringManagerName: currentUser?.fullName || 'HR Manager',
                  jobDescription: desc,
                  applicantsCount: 0
                };

                hrService.saveVacancy(currentUser, newVac);
                refreshData();
                setShowAddVacancyModal(false);
                toast.success(`Requisition for ${title} created successfully!`);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Position Title</label>
                <input required name="title" placeholder="e.g. Master CNC Operator" className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department</label>
                  <select name="department" className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none">
                    <option value="FABRICATION">Fabrication</option>
                    <option value="ENGINEERING">Engineering</option>
                    <option value="QUALITY">Quality</option>
                    <option value="COMMERCIAL_ADMIN">Commercial / HR</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Headcount Needed</label>
                  <input type="number" name="headcount" defaultValue={2} min={1} className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none" />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Job Brief & Required Competencies</label>
                <textarea required name="description" rows={3} placeholder="Job responsibilities..." className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none" />
              </div>
              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddVacancyModal(false)} className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg shadow-xs">Publish Vacancy</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LOG CASE MODAL */}
      {showLogCaseModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Log Case / Disciplinary Incident</h3>
              <button onClick={() => setShowLogCaseModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const fd = new FormData(form);
                const title = fd.get('title') as string;
                const type = fd.get('type') as any;
                const desc = fd.get('description') as string;

                const newCase: HRCase = {
                  id: `case-${Date.now()}`,
                  caseNumber: `CASE-2026-${Math.floor(100 + Math.random() * 900)}`,
                  type,
                  severity: 'Medium',
                  confidentiality: 'Confidential',
                  employeeId: employees[0]?.id || 'emp-03',
                  employeeName: employees[0]?.fullName || 'Employee',
                  departmentCode: 'FABRICATION',
                  incidentDate: new Date().toISOString().split('T')[0],
                  reportedDate: new Date().toISOString().split('T')[0],
                  title,
                  description: desc,
                  status: 'Under Investigation'
                };

                hrService.saveCase(currentUser, newCase);
                refreshData();
                setShowLogCaseModal(false);
                toast.success(`Case ${newCase.caseNumber} logged confidentially.`);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Case Category</label>
                <select name="type" className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none">
                  <option value="Grievance">Grievance</option>
                  <option value="Disciplinary">Disciplinary Incident</option>
                  <option value="HSE Violation">HSE Safety Violation</option>
                  <option value="Performance Inquiry">Performance Inquiry</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Case Subject</label>
                <input required name="title" placeholder="Summary of incident..." className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none" />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Details & Evidence</label>
                <textarea required name="description" rows={3} placeholder="Describe facts..." className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none" />
              </div>
              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setShowLogCaseModal(false)} className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-xs">Record Case</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR SCANNER SIMULATOR MODAL */}
      {showQRScanner && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 text-center space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Scan Barcode Station</h3>
            <p className="text-xs text-slate-500">Hold your device in front of the workshop terminal barcode scanner.</p>
            <div className="w-48 h-48 mx-auto bg-slate-50 border-2 border-dashed border-orange-500 rounded-2xl flex items-center justify-center p-4">
              <Barcode className="w-32 h-32 text-slate-800 animate-pulse" />
            </div>
            <div className="pt-2 flex justify-center gap-2">
              <button
                onClick={() => {
                  handleQuickPunch('IN');
                  setShowQRScanner(false);
                }}
                className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold"
              >
                Simulate Barcode Punch In
              </button>
              <button
                onClick={() => setShowQRScanner(false)}
                className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BIOMETRIC & LASER SCANNING STATION MODAL */}
      {showBiometricStationModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-6xl w-full max-h-[92vh] overflow-y-auto relative animate-in fade-in zoom-in-95 duration-150">
            <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-orange-500 text-white flex items-center justify-center">
                  <Fingerprint size={16} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">Biometric & Laser Scanning Hardware Control</h3>
                  <p className="text-[10px] text-slate-500">Live hardware punch, IP terminal network sync, and rapid laser barcode ingestion.</p>
                </div>
              </div>
              <button
                onClick={() => setShowBiometricStationModal(false)}
                className="px-2.5 py-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg text-xs font-bold transition-colors cursor-pointer border border-slate-200"
              >
                ✕ Close Station
              </button>
            </div>
            <div className="p-4">
              <BiometricLaserScanningStation
                personnel={mappedPersonnel}
                projects={defaultProjects}
                onTimesheetLogged={() => {
                  refreshData();
                }}
                onCloseModal={() => setShowBiometricStationModal(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
