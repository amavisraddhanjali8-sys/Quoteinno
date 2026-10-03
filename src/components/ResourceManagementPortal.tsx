import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Clock, 
  Award, 
  MapPin, 
  Phone, 
  Briefcase, 
  CheckCircle2, 
  XCircle, 
  Plus,
  Trash2,
  Edit2,
  X,
  Folder,
  LayoutList,
  LayoutGrid,
  FileText,
  LayoutDashboard
} from 'lucide-react';
import { Personnel, TimeEntry, Project } from '../types';
import { cn } from '../lib/utils';
import { ExportActions } from './common/ExportActions';
import { downloadCSV, downloadPDFTable } from '../services/dataExportService';
import { WorkforceLandingPage, WorkforceTab } from './workforce/WorkforceLandingPage';
import { BiometricLaserScanningStation } from './workforce/BiometricLaserScanningStation';
import { AdvancedCompensationPaysheetHub } from './workforce/AdvancedCompensationPaysheetHub';
import { hrService } from '../services/hrService';
import { useSecurity } from '../context/SecurityContext';
import { toast } from 'sonner';
import { 
  Fingerprint,
  UserCheck,
  DollarSign,
  Calendar,
  BarChart3,
  ChevronRight,
  HardHat,
  AlertCircle
} from 'lucide-react';

interface DeploymentItem {
  id: string;
  projectName: string;
  location: string;
  shift: string;
  assignedStaff: string;
  teamTag: string;
  status: 'Active' | 'Upcoming' | 'Completed';
}

interface ResourceManagementPortalProps {
  personnel: Personnel[];
  projects?: Project[];
  timeEntries?: TimeEntry[];
  initialTab?: WorkforceTab;
  onTabChange?: (tab: WorkforceTab) => void;
  onSavePersonnel?: (person: Personnel) => void;
  onDeletePersonnel?: (id: string) => void;
}

export const ResourceManagementPortal: React.FC<ResourceManagementPortalProps> = ({
  personnel = [],
  projects = [],
  initialTab = 'landing',
  onTabChange,
  onSavePersonnel,
  onDeletePersonnel
}) => {
  const { currentUser } = useSecurity();
  const [activeTab, setActiveTab] = useState<WorkforceTab>(initialTab || 'landing');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | Personnel['status']>('All');
  const [projectFilter, setProjectFilter] = useState('All');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [selectedProfileMember, setSelectedProfileMember] = useState<Personnel | null>(null);

  // Leave & Advances State
  const [salaryAdvances, setSalaryAdvances] = useState(() => hrService.getSalaryAdvances());
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [advanceForm, setAdvanceForm] = useState({
    staffId: '',
    amount: 2500,
    repaymentMonths: 2,
    reason: 'Medical & emergency family expense'
  });

  // Recruitment Requisitions
  const [vacanciesList, setVacanciesList] = useState(() => hrService.getVacancies());

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  // Fallback initial personnel if none provided
  const initialPersonnel: Personnel[] = useMemo(() => {
    if (personnel && personnel.length > 0) return personnel;
    return [
      {
        id: 'p-1',
        employeeId: 'EMP-041',
        name: 'Kasun Wickramasinghe',
        role: 'Master Aluminium Fabricator',
        skillLevel: 'Master',
        department: 'Fabrication',
        contact: '+94 77 421 8890',
        status: 'Assigned',
        hourlyRate: 1850,
        skills: [{ skill: 'Miter Cutting', proficiency: 98 }, { skill: 'Corner Crimping', proficiency: 95 }],
        certifications: [{ type: 'AluK Certified Fabricator', expiry: '2027-11-30' }]
      },
      {
        id: 'p-2',
        employeeId: 'EMP-042',
        name: 'Sachith Fernando',
        role: 'Structural Glazing Specialist',
        skillLevel: 'Senior',
        department: 'Site Installation',
        contact: '+94 71 893 2341',
        status: 'Assigned',
        hourlyRate: 1650,
        skills: [{ skill: 'Structural Silicone', proficiency: 92 }, { skill: 'Laser Alignment', proficiency: 90 }],
        certifications: [{ type: 'Dow Corning Sealant Inspector', expiry: '2027-05-15' }]
      },
      {
        id: 'p-3',
        employeeId: 'EMP-043',
        name: 'Dinesh Jayawardena',
        role: 'Site HSE & Safety Officer',
        skillLevel: 'Supervisor',
        department: 'Safety & QA',
        contact: '+94 76 341 9022',
        status: 'Available',
        hourlyRate: 2100,
        skills: [{ skill: 'Scaffolding Safety', proficiency: 96 }, { skill: 'Risk Assessment', proficiency: 94 }],
        certifications: [{ type: 'NEBOSH International Diploma', expiry: '2028-01-20' }]
      },
      {
        id: 'p-4',
        employeeId: 'EMP-044',
        name: 'Pradeep Kumara',
        role: 'Curtain Wall Fitter Lead',
        skillLevel: 'Lead',
        department: 'Site Installation',
        contact: '+94 70 219 4432',
        status: 'Available',
        hourlyRate: 1550,
        skills: [{ skill: 'Mullion Anchor Fixing', proficiency: 88 }, { skill: 'EPDM Gasket Fit', proficiency: 91 }],
        certifications: [{ type: 'Working at Heights Level 3', expiry: '2027-08-10' }]
      },
      {
        id: 'p-5',
        employeeId: 'EMP-045',
        name: 'Roshan Samarasekera',
        role: 'CNC Profile Milling Operator',
        skillLevel: 'Senior',
        department: 'Machining',
        contact: '+94 77 982 1104',
        status: 'On Leave',
        hourlyRate: 1700,
        skills: [{ skill: 'Emmegi 4-Axis CNC', proficiency: 94 }, { skill: 'G-Code Optimization', proficiency: 85 }],
        certifications: [{ type: 'CNC Precision Specialist', expiry: '2026-12-31' }]
      }
    ];
  }, [personnel]);

  const [staffList, setStaffList] = useState<Personnel[]>(initialPersonnel);

  useEffect(() => {
    if (personnel && personnel.length > 0) {
      setStaffList(personnel);
    }
  }, [personnel]);

  // Timesheets local state
  const [timesheetEntries, setTimesheetEntries] = useState<TimeEntry[]>([
    { id: 't1', personnelId: 'p-1', projectId: 'Sirius Mall Storefront', date: '2026-10-14', hours: 8.5, taskDescription: 'Mullion cutting and CNC slot prep', isOvertime: true, status: 'Pending' },
    { id: 't2', personnelId: 'p-2', projectId: 'Horizon Office Complex', date: '2026-10-14', hours: 8.0, taskDescription: 'Curtain wall thermal barrier installation', isOvertime: false, status: 'Approved' },
    { id: 't3', personnelId: 'p-4', projectId: 'Horizon Office Complex', date: '2026-10-13', hours: 9.0, taskDescription: 'Laser plumb line setting for Level 4 facade', isOvertime: true, status: 'Approved' }
  ]);

  // Site Deployments local state
  const [deployments, setDeployments] = useState<DeploymentItem[]>([
    {
      id: 'dep-1',
      projectName: 'Sirius Mall Storefront Project',
      location: 'Galle Road, Colombo 03',
      shift: 'Day (08:00 - 17:00)',
      assignedStaff: 'Kasun Wickramasinghe (Lead) + 3 Installers',
      teamTag: 'Full Crew',
      status: 'Active'
    },
    {
      id: 'dep-2',
      projectName: 'Horizon Office Complex Suite 4A',
      location: 'Nawam Mawatha, Colombo 02',
      shift: 'Day (07:30 - 16:30)',
      assignedStaff: 'Sachith Fernando + Pradeep Kumara',
      teamTag: 'Glazing Team',
      status: 'Active'
    }
  ]);

  // Modals state
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Personnel | null>(null);
  const [isAddingTimesheet, setIsAddingTimesheet] = useState(false);
  const [editingTimesheet, setEditingTimesheet] = useState<TimeEntry | null>(null);
  const [isAddingCert, setIsAddingCert] = useState<string | null>(null); // staffId
  const [isAddingDeployment, setIsAddingDeployment] = useState(false);
  const [editingDeployment, setEditingDeployment] = useState<DeploymentItem | null>(null);

  // Forms
  const [staffForm, setStaffForm] = useState({
    name: '',
    employeeId: '',
    role: '',
    department: 'Fabrication',
    skillLevel: 'Senior' as Personnel['skillLevel'],
    contact: '',
    hourlyRate: 1750,
    status: 'Available' as Personnel['status']
  });

  const [timesheetForm, setTimesheetForm] = useState({
    personnelId: '',
    projectId: '',
    date: new Date().toISOString().split('T')[0],
    hours: 8,
    taskDescription: '',
    isOvertime: false,
    status: 'Pending' as TimeEntry['status']
  });

  const [certForm, setCertForm] = useState({
    type: '',
    expiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  const [deploymentForm, setDeploymentForm] = useState({
    projectName: '',
    location: '',
    shift: 'Day (08:00 - 17:00)',
    assignedStaff: '',
    teamTag: 'Site Crew',
    status: 'Active' as DeploymentItem['status']
  });

  const filteredStaff = useMemo(() => {
    return staffList.filter(s => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q ||
                          s.name.toLowerCase().includes(q) ||
                          s.role.toLowerCase().includes(q) ||
                          s.department.toLowerCase().includes(q) ||
                          s.employeeId.toLowerCase().includes(q) ||
                          (s.contact && s.contact.toLowerCase().includes(q));
      const matchStatus = statusFilter === 'All' || s.status === statusFilter;
      
      const targetProj = projects.find(p => p.id === projectFilter || p.projectCode === projectFilter);
      const projNameOrCode = targetProj ? (targetProj.projectCode || targetProj.projectName).toLowerCase() : projectFilter.toLowerCase();
      const matchProject = projectFilter === 'All' || 
                           timesheetEntries.some(t => t.personnelId === s.id && (t.projectId.toLowerCase().includes(projNameOrCode) || (targetProj && t.projectId === targetProj.id))) ||
                           deployments.some(d => d.assignedStaff.toLowerCase().includes(s.name.toLowerCase()) && (d.projectName.toLowerCase().includes(projNameOrCode)));

      return matchSearch && matchStatus && matchProject;
    });
  }, [staffList, searchQuery, statusFilter, projectFilter, projects, timesheetEntries, deployments]);

  const filteredTimesheets = useMemo(() => {
    return timesheetEntries.filter(t => {
      const q = searchQuery.toLowerCase().trim();
      const staff = staffList.find(s => s.id === t.personnelId);
      const matchSearch = !q ||
                          t.id.toLowerCase().includes(q) ||
                          t.projectId.toLowerCase().includes(q) ||
                          t.taskDescription.toLowerCase().includes(q) ||
                          (staff && (staff.name.toLowerCase().includes(q) || staff.employeeId.toLowerCase().includes(q)));
      
      const targetProj = projects.find(p => p.id === projectFilter || p.projectCode === projectFilter);
      const matchProject = projectFilter === 'All' ||
                           t.projectId === projectFilter ||
                           (targetProj && (t.projectId.toLowerCase().includes(targetProj.projectName.toLowerCase()) || (targetProj.projectCode && t.projectId.toLowerCase().includes(targetProj.projectCode.toLowerCase()))));
      
      return matchSearch && matchProject;
    });
  }, [timesheetEntries, searchQuery, projectFilter, projects, staffList]);

  // Personnel CRUD
  const handleDeleteStaff = (id: string) => {
    if (window.confirm('Are you sure you want to remove this personnel record?')) {
      setStaffList(prev => prev.filter(s => s.id !== id));
      onDeletePersonnel?.(id);
    }
  };

  const handleSaveStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffForm.name.trim()) return;

    if (editingStaff) {
      const updated: Personnel = {
        ...editingStaff,
        ...staffForm
      };
      setStaffList(prev => prev.map(s => s.id === updated.id ? updated : s));
      onSavePersonnel?.(updated);
      setEditingStaff(null);
    } else {
      const newPerson: Personnel = {
        id: `p-${Date.now()}`,
        employeeId: staffForm.employeeId || `EMP-${Math.floor(100 + Math.random() * 900)}`,
        name: staffForm.name,
        role: staffForm.role || 'Aluminium Fabricator',
        department: staffForm.department,
        skillLevel: staffForm.skillLevel,
        contact: staffForm.contact || '+94 77 000 0000',
        hourlyRate: Number(staffForm.hourlyRate) || 1600,
        status: staffForm.status,
        skills: [{ skill: 'Fabrication', proficiency: 90 }],
        certifications: [{ type: 'Standard Certified', expiry: '2027-12-31' }]
      };
      setStaffList(prev => [newPerson, ...prev]);
      onSavePersonnel?.(newPerson);
      setIsAddingStaff(false);
    }
    setStaffForm({ name: '', employeeId: '', role: '', department: 'Fabrication', skillLevel: 'Senior', contact: '', hourlyRate: 1750, status: 'Available' });
  };

  // Timesheets CRUD
  const handleDeleteTimesheet = (id: string) => {
    if (window.confirm('Delete this timesheet entry?')) {
      setTimesheetEntries(prev => prev.filter(t => t.id !== id));
    }
  };

  const handleSaveTimesheetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!timesheetForm.taskDescription.trim()) return;

    if (editingTimesheet) {
      const updated: TimeEntry = {
        ...editingTimesheet,
        ...timesheetForm,
        hours: Number(timesheetForm.hours)
      };
      setTimesheetEntries(prev => prev.map(t => t.id === updated.id ? updated : t));
      setEditingTimesheet(null);
    } else {
      const newEntry: TimeEntry = {
        id: `t-${Date.now()}`,
        personnelId: timesheetForm.personnelId || staffList[0]?.id || 'p-1',
        projectId: timesheetForm.projectId || 'General Site Ops',
        date: timesheetForm.date,
        hours: Number(timesheetForm.hours) || 8,
        taskDescription: timesheetForm.taskDescription,
        isOvertime: timesheetForm.isOvertime,
        status: timesheetForm.status
      };
      setTimesheetEntries(prev => [newEntry, ...prev]);
      setIsAddingTimesheet(false);
    }
    setTimesheetForm({ personnelId: '', projectId: '', date: new Date().toISOString().split('T')[0], hours: 8, taskDescription: '', isOvertime: false, status: 'Pending' });
  };

  const handleApproveTimesheet = (id: string) => {
    setTimesheetEntries(prev => prev.map(t => t.id === id ? { ...t, status: 'Approved' } : t));
  };

  const handleRejectTimesheet = (id: string) => {
    setTimesheetEntries(prev => prev.map(t => t.id === id ? { ...t, status: 'Rejected' } : t));
  };

  // Certifications CRUD
  const handleAddCertSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAddingCert || !certForm.type.trim()) return;

    setStaffList(prev => prev.map(member => {
      if (member.id !== isAddingCert) return member;
      const updated = {
        ...member,
        certifications: [...(member.certifications || []), { type: certForm.type, expiry: certForm.expiry }]
      };
      onSavePersonnel?.(updated);
      return updated;
    }));
    setIsAddingCert(null);
    setCertForm({ type: '', expiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] });
  };

  const handleDeleteCert = (staffId: string, certIndex: number) => {
    if (window.confirm('Remove this certification?')) {
      setStaffList(prev => prev.map(member => {
        if (member.id !== staffId) return member;
        const updatedCerts = member.certifications.filter((_, idx) => idx !== certIndex);
        const updated = { ...member, certifications: updatedCerts };
        onSavePersonnel?.(updated);
        return updated;
      }));
    }
  };

  // Deployments CRUD
  const handleDeleteDeployment = (id: string) => {
    if (window.confirm('Delete this deployment allocation?')) {
      setDeployments(prev => prev.filter(d => d.id !== id));
    }
  };

  const handleSaveDeploymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deploymentForm.projectName.trim()) return;

    if (editingDeployment) {
      const updated: DeploymentItem = { ...editingDeployment, ...deploymentForm };
      setDeployments(prev => prev.map(d => d.id === updated.id ? updated : d));
      setEditingDeployment(null);
    } else {
      const newDep: DeploymentItem = { id: `dep-${Date.now()}`, ...deploymentForm };
      setDeployments(prev => [newDep, ...prev]);
      setIsAddingDeployment(false);
    }
    setDeploymentForm({ projectName: '', location: '', shift: 'Day (08:00 - 17:00)', assignedStaff: '', teamTag: 'Site Crew', status: 'Active' });
  };

  return (
    <div className="space-y-2.5 pb-8">
      {/* Title Ribbon - One Line Ribbon with Simple Description & Only Buttons */}
      <header className="px-5 py-2.5 bg-white border border-slate-200/80 rounded-xl shadow-2xs">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Users size={16} />
            </div>
            <div className="flex items-baseline gap-2 min-w-0">
              <h1 className="text-sm font-bold text-slate-900 whitespace-nowrap">Workforce & HR</h1>
            </div>
          </div>

          {/* Action Buttons ONLY */}
          <div className="flex items-center gap-2 shrink-0">
            <ExportActions 
              onExportCSV={() => {
                if (activeTab === 'personnel') {
                  const headers = ['Employee ID', 'Name', 'Role', 'Department', 'Contact', 'Status', 'Hourly Rate (LKR)'];
                  const rows = filteredStaff.map(s => [
                    `"${s.employeeId}"`,
                    `"${s.name}"`,
                    `"${s.role}"`,
                    `"${s.department}"`,
                    `"${s.contact}"`,
                    `"${s.status}"`,
                    `"${s.hourlyRate}"`
                  ]);
                  downloadCSV(`hr-personnel-${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
                } else if (activeTab === 'timesheets') {
                  const headers = ['Personnel', 'Project', 'Date', 'Hours', 'Overtime', 'Status', 'Task Description'];
                  const rows = timesheetEntries.map(t => {
                    const s = staffList.find(x => x.id === t.personnelId);
                    return [
                      `"${s?.name || t.personnelId}"`,
                      `"${t.projectId}"`,
                      `"${t.date}"`,
                      `"${t.hours}"`,
                      `"${t.isOvertime ? 'Yes' : 'No'}"`,
                      `"${t.status}"`,
                      `"${(t.taskDescription || '').replace(/"/g, '""')}"`
                    ];
                  });
                  downloadCSV(`hr-timesheets-${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
                }
              }}
              onExportPDF={() => {
                if (activeTab === 'personnel') {
                  const headers = ['EMP ID', 'Name', 'Role', 'Department', 'Rate'];
                  const rows = filteredStaff.map(s => [s.employeeId, s.name, s.role, s.department, `LKR ${s.hourlyRate}`]);
                  downloadPDFTable('Workforce & Staff Directory', headers, rows, 'hr-personnel.pdf', 'Overview of all active personnel');
                } else if (activeTab === 'timesheets') {
                  const headers = ['Staff', 'Project', 'Date', 'Hours', 'Status'];
                  const rows = timesheetEntries.map(t => {
                    const s = staffList.find(x => x.id === t.personnelId);
                    return [s?.name || t.personnelId, t.projectId, t.date, `${t.hours}h`, t.status];
                  });
                  downloadPDFTable('Timesheet Registry', headers, rows, 'hr-timesheets.pdf', 'Labor hours logged across projects');
                }
              }}
              labelCSV="CSV"
              labelPDF="PDF"
            />

            {/* Quick Biometric & Laser Punch Launcher */}
            <button
              onClick={() => {
                setActiveTab('biometrics');
                onTabChange?.('biometrics');
              }}
              className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-semibold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
              title="Launch Biometric & Laser Scanner Station"
            >
              <Fingerprint size={13} className="text-white" />
              <span>Biometrics</span>
            </button>
          </div>
        </div>
      </header>

      {/* Sub Portals Navigation Tabs */}
      <div className="flex items-center p-1 bg-white rounded-xl border border-slate-200 overflow-x-auto custom-scrollbar">
        {[
          { id: 'landing', label: 'Command Hub', icon: LayoutDashboard },
          { id: 'biometrics', label: 'Biometrics & Meals', icon: Fingerprint },
          { id: 'paysheet', label: 'Paysheet & EPF/ETF', icon: DollarSign },
          { id: 'personnel', label: 'Staff', icon: Users },
          { id: 'timesheets', label: 'Timesheets', icon: Clock },
          { id: 'deployment', label: 'Deployment', icon: MapPin },
          { id: 'certifications', label: 'Certs', icon: Award },
          { id: 'recruitment', label: 'ATS', icon: Briefcase },
          { id: 'lifecycle', label: 'Lifecycle', icon: UserCheck },
          { id: 'performance', label: 'KPIs', icon: Award },
          { id: 'leaves', label: 'Leaves', icon: Calendar },
          { id: 'disciplinary', label: 'Cases', icon: AlertCircle },
          { id: 'analytics', label: 'Analytics', icon: BarChart3 }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              const nextTab = tab.id as any;
              setActiveTab(nextTab);
              onTabChange?.(nextTab);
            }}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer",
              activeTab === tab.id 
                ? "bg-orange-50 text-orange-700 border border-orange-200" 
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent"
            )}
          >
            <tab.icon size={12} className={activeTab === tab.id ? "text-orange-600" : "text-slate-400"} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab 0: Command Center Landing Hub */}
      {activeTab === 'landing' && (
        <WorkforceLandingPage
          personnel={filteredStaff}
          timeEntries={timesheetEntries}
          projects={projects}
          onNavigateTab={(t) => {
            setActiveTab(t);
            onTabChange?.(t);
          }}
          onOpenAddPersonnel={() => {
            setActiveTab('personnel');
            setIsAddingStaff(true);
          }}
          onExportCSV={() => {
            const headers = ['Employee ID', 'Name', 'Role', 'Department', 'Contact', 'Status', 'Hourly Rate'];
            const rows = filteredStaff.map(s => [`"${s.employeeId}"`, `"${s.name}"`, `"${s.role}"`, `"${s.department}"`, `"${s.contact}"`, `"${s.status}"`, `"${s.hourlyRate}"`]);
            downloadCSV(`workforce-${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
          }}
          onExportPDF={() => {
            const headers = ['EMP ID', 'Name', 'Role', 'Department', 'Rate'];
            const rows = filteredStaff.map(s => [s.employeeId, s.name, s.role, s.department, `LKR ${s.hourlyRate}`]);
            downloadPDFTable('Workforce Directory', headers, rows, 'workforce.pdf', 'Overview of active personnel');
          }}
        />
      )}

      {/* Tab 1: Personnel Registry */}
      {activeTab === 'personnel' && (
        <div className="space-y-3">
          <div className="p-3 bg-white border border-slate-200/80 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 flex-wrap">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Search staff by name, role or EMP ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:border-orange-500 transition-colors shadow-2xs"
                />
              </div>

              {/* Project Filter (FK) */}
              <div className="flex items-center gap-1.5 bg-orange-50/70 px-2.5 py-1.5 rounded-xl border border-orange-200/80">
                <Folder size={12} className="text-orange-500 shrink-0" />
                <select
                  value={projectFilter}
                  onChange={(e) => setProjectFilter(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-orange-900 outline-none cursor-pointer max-w-[170px] truncate"
                  title="Filter by Project / Site (Foreign Key)"
                >
                  <option value="All">All Projects (FK)</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>
                      [{p.projectCode || p.id.slice(0, 8)}] {p.projectName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1">
                {(['All', 'Available', 'Assigned', 'On Leave'] as const).map(st => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-medium transition-colors",
                      statusFilter === st 
                        ? "bg-slate-900 text-white" 
                        : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
                    )}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* View Switcher: List vs Cards */}
              <div className="flex items-center p-0.5 bg-slate-100 rounded-xl border border-slate-200">
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    "flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all",
                    viewMode === 'list' ? "bg-white text-slate-900 shadow-2xs font-semibold" : "text-slate-500 hover:text-slate-800"
                  )}
                  title="List View (Single Line Rows)"
                >
                  <LayoutList size={12} className={viewMode === 'list' ? "text-orange-500" : "text-slate-400"} />
                  <span>List</span>
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    "flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all",
                    viewMode === 'grid' ? "bg-white text-slate-900 shadow-2xs font-semibold" : "text-slate-500 hover:text-slate-800"
                  )}
                  title="Card View"
                >
                  <LayoutGrid size={12} className={viewMode === 'grid' ? "text-orange-500" : "text-slate-400"} />
                  <span>Cards</span>
                </button>
              </div>

              <button
                onClick={() => {
                  setEditingStaff(null);
                  setStaffForm({
                    name: '',
                    employeeId: `EMP-${Math.floor(100 + Math.random() * 900)}`,
                    role: 'Master Fabricator',
                    department: 'Fabrication',
                    skillLevel: 'Senior',
                    contact: '+94 77 ',
                    hourlyRate: 1800,
                    status: 'Available'
                  });
                  setIsAddingStaff(true);
                }}
                className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-medium transition-colors shadow-xs flex items-center gap-1"
              >
                <Plus size={13} />
                <span>Add Staff</span>
              </button>
            </div>
          </div>

          {/* List View: High-density One-Line Row Table */}
          {viewMode === 'list' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[10px] font-bold text-slate-600 uppercase tracking-wider select-none whitespace-nowrap">
                      <th className="py-2.5 px-3">Employee ID (PK)</th>
                      <th className="py-2.5 px-3">Project / Bay (FK)</th>
                      <th className="py-2.5 px-3">Staff Full Name</th>
                      <th className="py-2.5 px-3">Designation & Role</th>
                      <th className="py-2.5 px-3">Department</th>
                      <th className="py-2.5 px-3">Skill Level</th>
                      <th className="py-2.5 px-3">Contact</th>
                      <th className="py-2.5 px-3 text-right">Cost Rate / Hr</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStaff.length > 0 ? (
                      filteredStaff.map(member => {
                        const deployment = deployments.find(d => d.assignedStaff.toLowerCase().includes(member.name.toLowerCase()));
                        const matchedProj = projects.find(p => deployment && (deployment.projectName.toLowerCase().includes(p.projectName.toLowerCase()) || (p.projectCode && deployment.projectName.toLowerCase().includes(p.projectCode.toLowerCase()))));
                        const fkCode = matchedProj?.projectCode || (matchedProj ? matchedProj.id.slice(0, 8) : deployment ? deployment.projectName.split(' ')[0] : 'Fab Bay');

                        return (
                          <tr key={member.id} className="hover:bg-slate-50/70 transition-colors whitespace-nowrap group">
                            {/* PK: Employee ID */}
                            <td className="py-2.5 px-3">
                              <button
                                onClick={() => {
                                  setEditingStaff(member);
                                  setStaffForm({
                                    name: member.name,
                                    employeeId: member.employeeId,
                                    role: member.role,
                                    department: member.department,
                                    skillLevel: member.skillLevel,
                                    contact: member.contact,
                                    hourlyRate: member.hourlyRate,
                                    status: member.status
                                  });
                                }}
                                className="font-mono font-bold text-xs text-slate-900 bg-slate-100 hover:bg-orange-50 hover:text-orange-600 px-2 py-0.5 rounded border border-slate-200 inline-flex items-center gap-1 shadow-2xs transition-colors"
                                title={`Primary Key: ${member.employeeId} (Click to Edit)`}
                              >
                                <Users size={11} className="text-orange-500 shrink-0" />
                                <span>PK: {member.employeeId}</span>
                              </button>
                            </td>

                            {/* FK: Project / Site */}
                            <td className="py-2.5 px-3">
                              {matchedProj ? (
                                <button
                                  onClick={() => setProjectFilter(matchedProj.id)}
                                  className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-orange-700 bg-orange-50 hover:bg-orange-100 px-2 py-0.5 rounded border border-orange-200/80 transition-colors shadow-2xs"
                                  title={`Foreign Key: Project ${fkCode} (Click to filter)`}
                                >
                                  <Folder size={11} className="text-orange-500 shrink-0" />
                                  <span>FK: {fkCode}</span>
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-500 font-medium bg-slate-100 px-1.5 py-0.5 rounded">
                                  {fkCode}
                                </span>
                              )}
                            </td>

                            {/* Name */}
                            <td className="py-2.5 px-3 max-w-[180px]">
                              <span className="font-semibold text-slate-900 truncate block" title={member.name}>
                                {member.name}
                              </span>
                            </td>

                            {/* Role */}
                            <td className="py-2.5 px-3 max-w-[180px]">
                              <span className="text-slate-700 truncate block" title={member.role}>
                                {member.role}
                              </span>
                            </td>

                            {/* Department */}
                            <td className="py-2.5 px-3">
                              <span className="text-[10px] font-medium px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                                {member.department}
                              </span>
                            </td>

                            {/* Skill Level */}
                            <td className="py-2.5 px-3">
                              <span className="text-[10px] font-semibold text-slate-600">
                                {member.skillLevel}
                              </span>
                            </td>

                            {/* Contact */}
                            <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                              {member.contact}
                            </td>

                            {/* Cost Rate */}
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                              LKR {member.hourlyRate.toLocaleString()}
                            </td>

                            {/* Status */}
                            <td className="py-2.5 px-3 text-center">
                              <span className={cn(
                                "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                                member.status === 'Available' ? "bg-blue-50 text-blue-700 border-blue-200" :
                                member.status === 'Assigned' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                "bg-amber-50 text-amber-700 border-amber-200"
                              )}>
                                {member.status}
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="py-2.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => {
                                    setEditingStaff(member);
                                    setStaffForm({
                                      name: member.name,
                                      employeeId: member.employeeId,
                                      role: member.role,
                                      department: member.department,
                                      skillLevel: member.skillLevel,
                                      contact: member.contact,
                                      hourlyRate: member.hourlyRate,
                                      status: member.status
                                    });
                                  }}
                                  className="p-1 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
                                  title="Edit Staff"
                                >
                                  <Edit2 size={12} />
                                </button>
                                <button
                                  onClick={() => setSelectedProfileMember(member)}
                                  className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                                  title="360° Employee Lifecycle & Profile"
                                >
                                  <UserCheck size={13} />
                                </button>
                                <button
                                  onClick={() => handleDeleteStaff(member.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                  title="Delete Staff"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={10} className="py-12 text-center text-slate-400 text-xs">
                          No staff records match your filter criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Grid View: Cards */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStaff.map(member => (
                <div key={member.id} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 font-bold flex items-center justify-center text-sm border border-orange-200/60">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold text-slate-900">{member.name}</h4>
                          <p className="text-[11px] text-slate-400 font-mono mt-0.5">{member.employeeId} • {member.department}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={cn(
                          "text-[10px] font-medium px-2 py-0.5 rounded-full",
                          member.status === 'Available' ? "bg-blue-50 text-blue-700" :
                          member.status === 'Assigned' ? "bg-emerald-50 text-emerald-700" :
                          "bg-amber-50 text-amber-700"
                        )}>
                          {member.status}
                        </span>
                        <button
                          onClick={() => {
                            setEditingStaff(member);
                            setStaffForm({
                              name: member.name,
                              employeeId: member.employeeId,
                              role: member.role,
                              department: member.department,
                              skillLevel: member.skillLevel,
                              contact: member.contact,
                              hourlyRate: member.hourlyRate,
                              status: member.status
                            });
                          }}
                          className="p-1 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                          title="Edit Staff"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteStaff(member.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Staff"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    <div className="mt-2 space-y-1.5 text-xs text-slate-600">
                      <p className="flex items-center gap-2">
                        <Briefcase size={12} className="text-slate-400" />
                        <span>{member.role} ({member.skillLevel})</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <Phone size={12} className="text-slate-400" />
                        <span className="font-mono text-slate-700">{member.contact}</span>
                      </p>
                    </div>

                    {/* Skills badges */}
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {member.skills?.map((s, i) => (
                        <span key={i} className="text-[10px] font-medium px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                          {s.skill} ({s.proficiency}%)
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Rate: <strong className="text-slate-800 font-mono">LKR {member.hourlyRate}/hr</strong></span>
                    <button 
                      onClick={() => {
                        setEditingStaff(member);
                        setStaffForm({
                          name: member.name,
                          employeeId: member.employeeId,
                          role: member.role,
                          department: member.department,
                          skillLevel: member.skillLevel,
                          contact: member.contact,
                          hourlyRate: member.hourlyRate,
                          status: member.status
                        });
                      }}
                      className="text-[11px] font-medium text-orange-600 hover:text-orange-700"
                    >
                      Edit Details →
                    </button>
                  </div>
                </div>
              ))}
              {filteredStaff.length === 0 && (
                <div className="col-span-3 py-12 text-center text-slate-400 text-xs">
                  No staff records match the current filter.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Timesheets (One-Line Row List View) */}
      {activeTab === 'timesheets' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden space-y-3 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 flex-wrap">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Search timesheet PK, Project FK, staff..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:border-orange-500 transition-colors shadow-2xs"
                />
              </div>

              {/* Project Filter (FK) */}
              <div className="flex items-center gap-1.5 bg-orange-50/70 px-2.5 py-1.5 rounded-xl border border-orange-200/80">
                <Folder size={12} className="text-orange-500 shrink-0" />
                <select
                  value={projectFilter}
                  onChange={(e) => setProjectFilter(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-orange-900 outline-none cursor-pointer max-w-[170px] truncate"
                >
                  <option value="All">All Projects (FK)</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>
                      [{p.projectCode || p.id.slice(0, 8)}] {p.projectName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  setActiveTab('biometrics');
                  onTabChange?.('biometrics');
                }}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                title="Launch Biometric & Laser Punch Station"
              >
                <Fingerprint size={14} className="text-orange-400 animate-pulse" />
                <span>⚡ Biometrics & Laser Punch</span>
              </button>

              <button
                onClick={() => {
                  setEditingTimesheet(null);
                  setTimesheetForm({
                    personnelId: staffList[0]?.id || '',
                    projectId: 'Sirius Mall Storefront',
                    date: new Date().toISOString().split('T')[0],
                    hours: 8,
                    taskDescription: '',
                    isOvertime: false,
                    status: 'Pending'
                  });
                  setIsAddingTimesheet(true);
                }}
                className="px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-medium transition-colors shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Plus size={14} />
                <span>Log Timesheet</span>
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/80 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[10px] font-bold text-slate-600 uppercase tracking-wider select-none whitespace-nowrap">
                    <th className="py-2.5 px-3">Entry ID (PK)</th>
                    <th className="py-2.5 px-3">Project Code / Name (FK)</th>
                    <th className="py-2.5 px-3">Staff Name & EMP (FK)</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3 text-center">Hours</th>
                    <th className="py-2.5 px-3">Task Description</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTimesheets.length > 0 ? (
                    filteredTimesheets.map(entry => {
                      const staff = staffList.find(s => s.id === entry.personnelId);
                      const targetProj = projects.find(p => p.id === entry.projectId || (p.projectCode && entry.projectId === p.projectCode) || p.projectName.toLowerCase().includes(entry.projectId.toLowerCase()));
                      const pCode = targetProj?.projectCode || entry.projectId;

                      return (
                        <tr key={entry.id} className="hover:bg-slate-50/70 transition-colors whitespace-nowrap group">
                          {/* PK: Entry ID */}
                          <td className="py-2.5 px-3">
                            <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 inline-flex items-center gap-1 shadow-2xs">
                              <FileText size={11} className="text-orange-500 shrink-0" />
                              <span>PK: {entry.id}</span>
                            </span>
                          </td>

                          {/* FK: Project */}
                          <td className="py-2.5 px-3">
                            <button
                              onClick={() => targetProj && setProjectFilter(targetProj.id)}
                              className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-orange-700 bg-orange-50 hover:bg-orange-100 px-2 py-0.5 rounded border border-orange-200/80 transition-colors shadow-2xs"
                              title={`Foreign Key: ${pCode} (Click to filter)`}
                            >
                              <Folder size={11} className="text-orange-500 shrink-0" />
                              <span>FK: {pCode}</span>
                            </button>
                          </td>

                          {/* Staff */}
                          <td className="py-2.5 px-3 max-w-[180px]">
                            <span className="font-semibold text-slate-800 truncate block">
                              {staff?.name || 'Staff Member'} <span className="font-mono text-slate-400 font-normal">({staff?.employeeId || 'EMP'})</span>
                            </span>
                          </td>

                          {/* Date */}
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                            {entry.date}
                          </td>

                          {/* Hours */}
                          <td className="py-2.5 px-3 text-center">
                            <span className={cn(
                              "font-mono font-bold px-2 py-0.5 rounded text-[11px]",
                              entry.isOvertime ? "bg-orange-50 text-orange-700 border border-orange-200" : "text-slate-700"
                            )}>
                              {entry.hours} hrs {entry.isOvertime && '(OT)'}
                            </span>
                          </td>

                          {/* Task Description */}
                          <td className="py-2.5 px-3 max-w-[260px]">
                            <span className="text-slate-600 truncate block text-xs" title={entry.taskDescription}>
                              {entry.taskDescription || 'Standard shift execution'}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-2.5 px-3 text-center">
                            <span className={cn(
                              "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                              entry.status === 'Approved' ? "bg-emerald-50 border-emerald-200 text-emerald-700" :
                              entry.status === 'Rejected' ? "bg-rose-50 border-rose-200 text-rose-700" :
                              "bg-amber-50 border-amber-200 text-amber-700"
                            )}>
                              {entry.status}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-2.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {entry.status === 'Pending' && (
                                <>
                                  <button 
                                    onClick={() => handleApproveTimesheet(entry.id)}
                                    className="p-1 rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                                    title="Approve"
                                  >
                                    <CheckCircle2 size={13} />
                                  </button>
                                  <button 
                                    onClick={() => handleRejectTimesheet(entry.id)}
                                    className="p-1 rounded bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                                    title="Reject"
                                  >
                                    <XCircle size={13} />
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => {
                                  setEditingTimesheet(entry);
                                  setTimesheetForm({
                                    personnelId: entry.personnelId,
                                    projectId: entry.projectId,
                                    date: entry.date,
                                    hours: entry.hours,
                                    taskDescription: entry.taskDescription,
                                    isOvertime: entry.isOvertime,
                                    status: entry.status
                                  });
                                }}
                                className="p-1 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                title="Edit Timesheet"
                              >
                                <Edit2 size={12} />
                              </button>
                              <button
                                onClick={() => handleDeleteTimesheet(entry.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Delete Timesheet"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                        No timesheet records match your filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Site Allocation (One-Line Row List View) */}
      {activeTab === 'deployment' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900">Site Deployments</h3>
            <button
              onClick={() => {
                setEditingDeployment(null);
                setDeploymentForm({
                  projectName: '',
                  location: 'Colombo Site',
                  shift: 'Day (08:00 - 17:00)',
                  assignedStaff: staffList[0]?.name || 'Site Crew',
                  teamTag: 'Glazing Crew',
                  status: 'Active'
                });
                setIsAddingDeployment(true);
              }}
              className="px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-medium transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
            >
              <Plus size={13} />
              <span>Add Deployment</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                  <th className="py-2.5 px-3">Project Name</th>
                  <th className="py-2.5 px-3">Location</th>
                  <th className="py-2.5 px-3">Shift</th>
                  <th className="py-2.5 px-3">Assigned Crew</th>
                  <th className="py-2.5 px-3">Team Tag</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 whitespace-nowrap">
                {deployments.map(dep => (
                  <tr key={dep.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2 px-3 font-semibold text-slate-900">{dep.projectName}</td>
                    <td className="py-2 px-3 text-slate-600">{dep.location}</td>
                    <td className="py-2 px-3 text-slate-600 font-mono text-[11px]">{dep.shift}</td>
                    <td className="py-2 px-3 text-slate-800">{dep.assignedStaff}</td>
                    <td className="py-2 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-orange-50 text-orange-700 border border-orange-200">
                        {dep.teamTag}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {dep.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditingDeployment(dep);
                            setDeploymentForm({
                              projectName: dep.projectName,
                              location: dep.location,
                              shift: dep.shift,
                              assignedStaff: dep.assignedStaff,
                              teamTag: dep.teamTag,
                              status: dep.status
                            });
                          }}
                          className="p-1 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() => handleDeleteDeployment(dep.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Certifications */}
      {activeTab === 'certifications' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900">Health & Safety Credentials</h3>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Audit Ready
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {staffList.map(member => (
              <div key={member.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <h4 className="font-semibold text-slate-900">{member.name} ({member.employeeId})</h4>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {member.certifications?.map((c, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 rounded-md text-[11px] text-slate-700">
                        <span>{c.type} (exp: {c.expiry})</span>
                        <button
                          onClick={() => handleDeleteCert(member.id, idx)}
                          className="text-slate-400 hover:text-rose-600"
                          title="Delete Certificate"
                        >
                          <X size={11} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setIsAddingCert(member.id);
                      setCertForm({ type: 'Working at Heights Level 2', expiry: '2028-06-30' });
                    }}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                  >
                    <Plus size={12} />
                    <span>Add Credential</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Biometrics & Laser Scanning Terminal Hub */}
      {activeTab === 'biometrics' && (
        <BiometricLaserScanningStation
          personnel={staffList}
          projects={projects}
          onTimesheetLogged={(newEntry) => {
            setTimesheetEntries(prev => [newEntry, ...prev]);
          }}
        />
      )}

      {/* Tab: Paysheet, Sri Lankan EPF/ETF, Loans, Meals & Advanced Compensation */}
      {activeTab === 'paysheet' && (
        <AdvancedCompensationPaysheetHub />
      )}

      {/* Tab: Recruitment & ATS Pipeline */}
      {activeTab === 'recruitment' && (
        <div className="space-y-3.5">
          <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <Briefcase size={15} className="text-orange-500" />
                  <span>Recruitment & ATS Pipeline</span>
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-xl bg-purple-50 text-purple-700 font-bold text-xs border border-purple-200">
                  {vacanciesList.length} Requisitions Active
                </span>
                <button
                  onClick={() => {
                    const newVac = hrService.saveVacancy(currentUser, {
                      id: `vac-${Date.now()}`,
                      requisitionNumber: `REQ-2026-${Math.floor(100 + Math.random() * 900)}`,
                      positionId: 'pos-new',
                      positionTitle: 'Senior Architectural Metalworker',
                      departmentCode: 'FABRICATION',
                      branch: 'Main Store',
                      employmentType: 'Permanent',
                      headcountRequired: 2,
                      openDate: new Date().toISOString().split('T')[0],
                      targetHireDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
                      salaryMin: 6500,
                      salaryMax: 9000,
                      status: 'Open',
                      hiringManagerId: currentUser?.id || 'usr-hr-01',
                      hiringManagerName: currentUser?.fullName || 'Sara Jenkins',
                      jobDescription: 'Fabrication of bespoke architectural stainless steel and brass facades.',
                      applicantsCount: 0
                    });
                    setVacanciesList(prev => [newVac, ...prev]);
                    toast.success('Job Requisition Created', { description: 'New vacancy opened for applicant screening.' });
                  }}
                  className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Plus size={13} />
                  <span>Create Requisition</span>
                </button>
              </div>
            </div>

            {/* 8-Stage Pipeline Funnel Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 mb-4">
              {[
                { stage: 'Application', count: 18, color: 'bg-slate-50 text-slate-700 border-slate-200' },
                { stage: 'Screening', count: 9, color: 'bg-blue-50 text-blue-800 border-blue-200' },
                { stage: 'Shortlist', count: 6, color: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
                { stage: 'Interview', count: 4, color: 'bg-amber-50 text-amber-800 border-amber-200' },
                { stage: 'Assessment', count: 3, color: 'bg-orange-50 text-orange-800 border-orange-200' },
                { stage: 'Selection', count: 2, color: 'bg-purple-50 text-purple-800 border-purple-200' },
                { stage: 'Offer Made', count: 2, color: 'bg-emerald-50 text-emerald-800 border-emerald-200 font-bold' },
                { stage: 'Onboarded', count: 5, color: 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold' }
              ].map((pipe, i) => (
                <div key={i} className={cn("p-2 rounded-xl border text-center", pipe.color)}>
                  <span className="text-[10px] uppercase font-bold block tracking-wider">{pipe.stage}</span>
                  <span className="text-base font-bold font-mono mt-0.5 block">{pipe.count}</span>
                </div>
              ))}
            </div>

            {/* Active Requisitions Table */}
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                    <th className="py-2.5 px-3">Req ID</th>
                    <th className="py-2.5 px-3">Position Title</th>
                    <th className="py-2.5 px-3">Department</th>
                    <th className="py-2.5 px-3 text-center">Headcount</th>
                    <th className="py-2.5 px-3">Recruiter</th>
                    <th className="py-2.5 px-3">Target Date</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {vacanciesList.map(v => (
                    <tr key={v.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-[11px] font-bold text-slate-700">{v.requisitionNumber || v.id}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{v.positionTitle}</td>
                      <td className="py-2.5 px-3 text-slate-600">{v.departmentCode}</td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-800">{v.headcountRequired} Vacancies</td>
                      <td className="py-2.5 px-3 text-slate-600">{v.hiringManagerName}</td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">{v.targetHireDate}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {v.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => toast.info('Candidate Evaluation Opened', { description: `Reviewing applications for ${v.positionTitle}` })}
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold cursor-pointer"
                        >
                          Candidates
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Employee Lifecycle & Exit Management */}
      {activeTab === 'lifecycle' && (
        <div className="space-y-3.5">
          <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <UserCheck size={15} className="text-orange-500" />
                  <span>Lifecycle & Exit Management</span>
                </h3>
              </div>

              {/* 30 / 14 / 7-Day Probation Countdown Alert Pill */}
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 text-xs font-semibold flex items-center gap-1.5">
                  <Clock size={12} className="text-amber-600" />
                  <span>2 Staff on 14-Day Probation Review</span>
                </span>
              </div>
            </div>

            {/* Lifecycle Stages Flowchart Preview */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between overflow-x-auto text-[11px] font-semibold text-slate-700 gap-2 custom-scrollbar">
              <span className="px-2 py-1 bg-white rounded shadow-2xs border border-slate-200 text-slate-900 font-bold shrink-0">1. Onboarding</span>
              <ChevronRight size={14} className="text-slate-400 shrink-0" />
              <span className="px-2 py-1 bg-white rounded shadow-2xs border border-slate-200 text-slate-900 font-bold shrink-0">2. Probation Radar</span>
              <ChevronRight size={14} className="text-slate-400 shrink-0" />
              <span className="px-2 py-1 bg-white rounded shadow-2xs border border-slate-200 text-slate-900 font-bold shrink-0">3. Confirmation</span>
              <ChevronRight size={14} className="text-slate-400 shrink-0" />
              <span className="px-2 py-1 bg-white rounded shadow-2xs border border-slate-200 text-slate-900 font-bold shrink-0">4. Skill Matrix</span>
              <ChevronRight size={14} className="text-slate-400 shrink-0" />
              <span className="px-2 py-1 bg-white rounded shadow-2xs border border-slate-200 text-slate-900 font-bold shrink-0">5. Project Transfers</span>
              <ChevronRight size={14} className="text-slate-400 shrink-0" />
              <span className="px-2 py-1 bg-white rounded shadow-2xs border border-slate-200 text-slate-900 font-bold shrink-0">6. Promotions</span>
              <ChevronRight size={14} className="text-slate-400 shrink-0" />
              <span className="px-2 py-1 bg-rose-50 text-rose-800 rounded shadow-2xs border border-rose-200 font-bold shrink-0">7. Exit Settlement</span>
            </div>

            {/* Offboarding & Clearance Checklist */}
            <div className="rounded-xl border border-slate-200 p-3.5 bg-white space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-500" />
                <span>Active Offboarding Clearance Records</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  {
                    name: 'Roshan Samarasekera (EMP-045)',
                    dept: 'Machining Bay',
                    exitDate: '2026-10-31',
                    reason: 'Relocating overseas',
                    itClear: true,
                    toolsClear: true,
                    safetyClear: true,
                    finClear: false,
                    hrClear: false,
                    settlementLKR: 142000
                  },
                  {
                    name: 'Nihal Jayasuriya (EMP-038)',
                    dept: 'Safety & QA',
                    exitDate: '2026-10-15',
                    reason: 'Contract completion',
                    itClear: true,
                    toolsClear: true,
                    safetyClear: true,
                    finClear: true,
                    hrClear: true,
                    settlementLKR: 89000
                  }
                ].map((item, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{item.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">Exit: {item.exitDate}</span>
                    </div>
                    <p className="text-[11px] text-slate-500">{item.reason} • {item.dept}</p>

                    <div className="space-y-1 text-[11px] pt-1 border-t border-slate-200">
                      <div className="flex justify-between">
                        <span>IT & Tool Access:</span>
                        <span className={item.itClear ? "text-emerald-700 font-bold" : "text-amber-700"}>{item.itClear ? 'Cleared' : 'Pending'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Machinery Handover:</span>
                        <span className={item.toolsClear ? "text-emerald-700 font-bold" : "text-amber-700"}>{item.toolsClear ? 'Returned' : 'Pending'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Finance & Advances:</span>
                        <span className={item.finClear ? "text-emerald-700 font-bold" : "text-rose-700 font-bold"}>{item.finClear ? 'Settled' : 'Pending Balance'}</span>
                      </div>
                      <div className="flex justify-between font-bold pt-1 border-t border-slate-200">
                        <span>Final Gratuity / Settlement:</span>
                        <span className="font-mono text-slate-900">LKR {item.settlementLKR.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Tab: Performance & KPIs */}
      {activeTab === 'performance' && (
        <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Award size={16} className="text-orange-500" />
                <span>Construction & Fabrication KPI Performance Engine</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Evaluation metrics mapped to shop floor output, rework defect rate, scaffolding safety, and site delivery milestones.
              </p>
            </div>
            <button
              onClick={() => toast.success('Appraisal Cycle Dispatched', { description: 'Quarterly review forms sent to department supervisors.' })}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer"
            >
              Start Appraisal Cycle
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { code: 'KPI-FAB-01', title: 'Miter Cut Accuracy Rate', target: '98.5%', current: '99.1%', status: 'Surpassed', desc: 'CNC 45-degree corner crimp tolerances' },
              { code: 'KPI-FAB-02', title: 'Quality Rework / Scrap Rate', target: '< 2.0%', current: '1.4%', status: 'Healthy', desc: 'Material wastage per facade cassette' },
              { code: 'KPI-SITE-01', title: 'Zero Safety Incidents (LTIs)', target: '0 Incidents', current: '0 Incidents', status: 'Compliant', desc: 'Working at Heights & Scaffold PPE' },
              { code: 'KPI-DEL-01', title: 'Job Traveler On-Time Delivery', target: '95.0%', current: '96.8%', status: 'On Target', desc: 'Milestone dispatch to project site' }
            ].map((kpi, idx) => (
              <div key={idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-slate-400 font-bold">{kpi.code}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    {kpi.status}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-900">{kpi.title}</h4>
                <div className="flex items-baseline justify-between pt-1">
                  <span className="text-[11px] text-slate-500">Target: {kpi.target}</span>
                  <span className="text-sm font-mono font-bold text-slate-900">{kpi.current}</span>
                </div>
                <p className="text-[10px] text-slate-400 truncate">{kpi.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Leave Management & Employee Salary Advances */}
      {activeTab === 'leaves' && (
        <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Calendar size={16} className="text-orange-500" />
                <span>Leave Management & Employee Salary Advances</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Leave balances, approvals, and loan advance schedules directly reconciled with payroll deductions.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAdvanceModal(true)}
                className="px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus size={13} />
                <span>Request Salary Advance</span>
              </button>
            </div>
          </div>

          {/* Salary Advances Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Active Employee Advances & Repayment Schedules
            </h4>
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                    <th className="py-2.5 px-3">Req ID</th>
                    <th className="py-2.5 px-3">Staff & EMP</th>
                    <th className="py-2.5 px-3">Department</th>
                    <th className="py-2.5 px-3 text-right">Advance Amount</th>
                    <th className="py-2.5 px-3 text-center">Tenure</th>
                    <th className="py-2.5 px-3 text-right">Monthly Deduction</th>
                    <th className="py-2.5 px-3">Reason</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {salaryAdvances.map(adv => (
                    <tr key={adv.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-[11px] font-bold text-slate-700">{adv.id}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{adv.employeeName} ({adv.employeeId})</td>
                      <td className="py-2.5 px-3 text-slate-600">{adv.department}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        LKR {adv.amount.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-center">{adv.repaymentMonths} Months</td>
                      <td className="py-2.5 px-3 text-right font-mono text-orange-600 font-bold">
                        LKR {adv.monthlyDeduction.toFixed(0)}/mo
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 max-w-[200px] truncate">{adv.reason}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {adv.status}
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

      {/* Tab: Disciplinary & Relations */}
      {activeTab === 'disciplinary' && (
        <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <AlertCircle size={16} className="text-rose-500" />
                <span>Disciplinary Management & Grievance Relations</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Strict confidential case management: Incident → Investigation → Response → Hearing → Decision → Corrective Action.
              </p>
            </div>
            <button
              onClick={() => toast.info('New Disciplinary Incident Form Opened')}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
            >
              Log Incident / Grievance
            </button>
          </div>

          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                  <th className="py-2.5 px-3">Case ID</th>
                  <th className="py-2.5 px-3">Subject / Incident</th>
                  <th className="py-2.5 px-3">People Involved</th>
                  <th className="py-2.5 px-3">Incident Date</th>
                  <th className="py-2.5 px-3">Severity</th>
                  <th className="py-2.5 px-3 text-center">Case Stage</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { id: 'CASE-2026-001', title: 'PPE Non-Compliance during Height Scaffolding', people: 'Pradeep Kumara', date: '2026-09-12', severity: 'Medium', stage: 'Warning Issued' },
                  { id: 'CASE-2026-002', title: 'Unauthorized Machine Tool Overwrite on CNC Mill', people: 'Roshan Samarasekera', date: '2026-09-18', severity: 'Low', stage: 'Hearing Completed' }
                ].map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-700">{c.id}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{c.title}</td>
                    <td className="py-2.5 px-3 text-slate-600">{c.people}</td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">{c.date}</td>
                    <td className="py-2.5 px-3">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-bold",
                        c.severity === 'High' ? "bg-rose-50 text-rose-800 border border-rose-200" :
                        "bg-amber-50 text-amber-800 border border-amber-200"
                      )}>
                        {c.severity}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {c.stage}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button 
                        onClick={() => toast.info(`Viewing confidential record for ${c.id}`)}
                        className="text-orange-600 hover:text-orange-700 font-semibold cursor-pointer"
                      >
                        Review Record
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Workforce & Cost Analytics */}
      {activeTab === 'analytics' && (
        <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 size={16} className="text-orange-500" />
                <span>Workforce Intelligence & Project Cost Analytics</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Direct integration between logged labor hours, biometric attendance, and actual project costs.
              </p>
            </div>
            <span className="text-xs text-slate-500 font-mono">Updated Realtime</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="text-[11px] font-bold text-slate-700 block">Total Active Headcount</span>
              <p className="text-2xl font-bold font-mono text-slate-900">{staffList.length} Personnel</p>
              <p className="text-[11px] text-slate-500">100% deployed across 3 fabrication yards and 2 active project sites.</p>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="text-[11px] font-bold text-slate-700 block">Average Utilization Rate</span>
              <p className="text-2xl font-bold font-mono text-emerald-600">92.4%</p>
              <p className="text-[11px] text-slate-500">Average billable project hours per craftsmen vs planned shift capacity.</p>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="text-[11px] font-bold text-slate-700 block">Monthly Overtime Burn</span>
              <p className="text-2xl font-bold font-mono text-orange-600">8.1% of Base</p>
              <p className="text-[11px] text-slate-500">Within statutory thresholds (&lt; 15% overtime ceiling).</p>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Staff (Add / Edit) */}
      {(isAddingStaff || editingStaff) && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                {editingStaff ? `Edit Personnel: ${editingStaff.name}` : 'Enroll New Personnel'}
              </h3>
              <button 
                onClick={() => { setIsAddingStaff(false); setEditingStaff(null); }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveStaffSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={staffForm.name}
                    onChange={e => setStaffForm({ ...staffForm, name: e.target.value })}
                    placeholder="e.g. Kasun Silva"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Employee ID *</label>
                  <input
                    type="text"
                    required
                    value={staffForm.employeeId}
                    onChange={e => setStaffForm({ ...staffForm, employeeId: e.target.value })}
                    placeholder="EMP-050"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Role / Specialization</label>
                  <input
                    type="text"
                    value={staffForm.role}
                    onChange={e => setStaffForm({ ...staffForm, role: e.target.value })}
                    placeholder="e.g. Master Aluminium Fabricator"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                  <select
                    value={staffForm.department}
                    onChange={e => setStaffForm({ ...staffForm, department: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-orange-500 bg-white"
                  >
                    <option value="Fabrication">Fabrication</option>
                    <option value="Site Installation">Site Installation</option>
                    <option value="Machining">Machining</option>
                    <option value="Safety & QA">Safety & QA</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Skill Level</label>
                  <select
                    value={staffForm.skillLevel}
                    onChange={e => setStaffForm({ ...staffForm, skillLevel: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-orange-500 bg-white"
                  >
                    <option value="Apprentice">Apprentice</option>
                    <option value="Junior">Junior</option>
                    <option value="Senior">Senior</option>
                    <option value="Master">Master</option>
                    <option value="Supervisor">Supervisor</option>
                    <option value="Lead">Lead</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Hourly Rate (LKR)</label>
                  <input
                    type="number"
                    value={staffForm.hourlyRate}
                    onChange={e => setStaffForm({ ...staffForm, hourlyRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={staffForm.status}
                    onChange={e => setStaffForm({ ...staffForm, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-orange-500 bg-white"
                  >
                    <option value="Available">Available</option>
                    <option value="Assigned">Assigned</option>
                    <option value="On Leave">On Leave</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={staffForm.contact}
                  onChange={e => setStaffForm({ ...staffForm, contact: e.target.value })}
                  placeholder="+94 7X XXX XXXX"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setIsAddingStaff(false); setEditingStaff(null); }}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-semibold shadow-xs"
                >
                  {editingStaff ? 'Update Record' : 'Enroll Personnel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for Timesheet (Add / Edit) */}
      {(isAddingTimesheet || editingTimesheet) && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                {editingTimesheet ? 'Edit Timesheet Entry' : 'Log Daily Labor Timesheet'}
              </h3>
              <button 
                onClick={() => { setIsAddingTimesheet(false); setEditingTimesheet(null); }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveTimesheetSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Staff Member *</label>
                  <select
                    value={timesheetForm.personnelId}
                    onChange={e => setTimesheetForm({ ...timesheetForm, personnelId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-orange-500 bg-white"
                  >
                    {staffList.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.employeeId})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Project Assignment *</label>
                  <input
                    type="text"
                    required
                    value={timesheetForm.projectId}
                    onChange={e => setTimesheetForm({ ...timesheetForm, projectId: e.target.value })}
                    placeholder="e.g. Sirius Mall Storefront"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={timesheetForm.date}
                    onChange={e => setTimesheetForm({ ...timesheetForm, date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Hours Logged</label>
                  <input
                    type="number"
                    step="0.5"
                    value={timesheetForm.hours}
                    onChange={e => setTimesheetForm({ ...timesheetForm, hours: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={timesheetForm.status}
                    onChange={e => setTimesheetForm({ ...timesheetForm, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-orange-500 bg-white"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="overtimeCheck"
                  checked={timesheetForm.isOvertime}
                  onChange={e => setTimesheetForm({ ...timesheetForm, isOvertime: e.target.checked })}
                  className="rounded text-orange-500"
                />
                <label htmlFor="overtimeCheck" className="text-xs text-slate-700 font-medium">Flag as Overtime / Weekend Shift</label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Task Description *</label>
                <textarea
                  rows={2}
                  required
                  value={timesheetForm.taskDescription}
                  onChange={e => setTimesheetForm({ ...timesheetForm, taskDescription: e.target.value })}
                  placeholder="e.g. Assembled aluminium subframes and performed laser levelling"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-orange-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setIsAddingTimesheet(false); setEditingTimesheet(null); }}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-semibold shadow-xs"
                >
                  {editingTimesheet ? 'Save Timesheet' : 'Submit Timesheet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for Adding Certification */}
      {isAddingCert && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Add Professional Certification</h3>
              <button onClick={() => setIsAddingCert(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleAddCertSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Certification Name / Issuing Body *</label>
                <input
                  type="text"
                  required
                  value={certForm.type}
                  onChange={e => setCertForm({ ...certForm, type: e.target.value })}
                  placeholder="e.g. AluK Master Installer"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Valid Until</label>
                <input
                  type="date"
                  value={certForm.expiry}
                  onChange={e => setCertForm({ ...certForm, expiry: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-orange-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddingCert(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-semibold shadow-xs"
                >
                  Attach Certificate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for Deployment (Add / Edit) */}
      {(isAddingDeployment || editingDeployment) && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                {editingDeployment ? 'Edit Site Deployment' : 'Create Site Deployment Allocation'}
              </h3>
              <button 
                onClick={() => { setIsAddingDeployment(false); setEditingDeployment(null); }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveDeploymentSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Project Name *</label>
                <input
                  type="text"
                  required
                  value={deploymentForm.projectName}
                  onChange={e => setDeploymentForm({ ...deploymentForm, projectName: e.target.value })}
                  placeholder="e.g. Sirius Mall Facade"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Location Address</label>
                <input
                  type="text"
                  value={deploymentForm.location}
                  onChange={e => setDeploymentForm({ ...deploymentForm, location: e.target.value })}
                  placeholder="e.g. Galle Road, Colombo 03"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-orange-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Shift Hours</label>
                  <input
                    type="text"
                    value={deploymentForm.shift}
                    onChange={e => setDeploymentForm({ ...deploymentForm, shift: e.target.value })}
                    placeholder="Day (08:00 - 17:00)"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Crew Tag</label>
                  <input
                    type="text"
                    value={deploymentForm.teamTag}
                    onChange={e => setDeploymentForm({ ...deploymentForm, teamTag: e.target.value })}
                    placeholder="e.g. Glazing Lead + 3"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-orange-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Personnel</label>
                <input
                  type="text"
                  value={deploymentForm.assignedStaff}
                  onChange={e => setDeploymentForm({ ...deploymentForm, assignedStaff: e.target.value })}
                  placeholder="e.g. Kasun Wickramasinghe (Lead), Sachith Fernando"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-orange-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setIsAddingDeployment(false); setEditingDeployment(null); }}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-semibold shadow-xs"
                >
                  {editingDeployment ? 'Update Deployment' : 'Allocate Crew'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 360° EMPLOYEE PROFILE & LIFECYCLE DRAWER MODAL                        */}
      {/* ===================================================================== */}
      {selectedProfileMember && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[92vh] overflow-y-auto custom-scrollbar p-6 space-y-5 animate-in fade-in">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-700 text-white font-bold text-lg flex items-center justify-center shadow-sm">
                  {selectedProfileMember.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900">{selectedProfileMember.name}</h2>
                    <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-orange-50 text-orange-800 border border-orange-200 font-bold">
                      {selectedProfileMember.employeeId}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {selectedProfileMember.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedProfileMember.role} • {selectedProfileMember.department} • Grade G5 Craft
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedProfileMember(null);
                    setActiveTab('biometrics');
                  }}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Fingerprint size={13} className="text-orange-400" />
                  <span>Punch Clock</span>
                </button>
                <button
                  onClick={() => setSelectedProfileMember(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Grid Information */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Contact & Phone</span>
                <span className="font-mono font-bold text-slate-900 text-xs">{selectedProfileMember.contact}</span>
                <span className="text-[10px] text-slate-500 block truncate">emergency: +94 77 110 9988</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Commercial Rate</span>
                <span className="font-mono font-bold text-slate-900 text-xs">LKR {selectedProfileMember.hourlyRate.toLocaleString()} / Hour</span>
                <span className="text-[10px] text-emerald-600 block font-semibold">Overtime 1.5x / 2.0x active</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Bank Account & IBAN</span>
                <span className="font-mono font-bold text-slate-900 text-[11px] block truncate">Commercial Bank LK880</span>
                <span className="text-[10px] text-slate-500 font-mono">Branch: Colombo Fort</span>
              </div>
            </div>

            {/* Skills & Competency Matrix */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Award size={14} className="text-purple-600" />
                <span>Verified Skills & Competency Matrix</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {selectedProfileMember.skills && selectedProfileMember.skills.length > 0 ? (
                  selectedProfileMember.skills.map((s, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
                      <div className="flex items-center justify-between font-semibold text-slate-800">
                        <span>{s.skill}</span>
                        <span className="font-mono text-orange-600">{s.proficiency}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-orange-500 rounded-full" 
                          style={{ width: `${s.proficiency}%` }} 
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-2 text-slate-400 col-span-2">Standard skill rating 90% verified</div>
                )}
              </div>
            </div>

            {/* Chronological Lifecycle Timeline */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Clock size={14} className="text-orange-500" />
                <span>Chronological Employee Lifecycle Timeline</span>
              </h4>
              <div className="space-y-2 border-l-2 border-orange-200 pl-3.5 ml-2">
                {[
                  { stage: 'Applied & Screened', date: '2023-01-10', text: 'Application submitted for Master Fabricator role. Technical CV verified.' },
                  { stage: 'Interview & Practical Assessment', date: '2023-01-18', text: 'Score 98% on 45-degree aluminum miter cut and Emmegi CNC profile test.' },
                  { stage: 'Appointment & Onboarding', date: '2023-02-01', text: 'Appointment letter issued, PPE allocated, safety induction signed.' },
                  { stage: 'Probation Confirmed', date: '2023-05-01', text: '3-Month probation successfully completed with zero quality rework.' },
                  { stage: 'AluK Master Qualification', date: '2023-11-15', text: 'Completed 40-hour AluK advanced structural curtain wall qualification.' },
                  { stage: 'Promotion to Lead Fabricator', date: '2024-03-01', text: 'Promoted to Lead Fabricator with direct responsibility for facade assemblies.' }
                ].map((ev, i) => (
                  <div key={i} className="text-xs relative">
                    <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-orange-500 border-2 border-white shadow-2xs" />
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{ev.stage}</span>
                      <span className="font-mono text-[10px] text-slate-400">• {ev.date}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">{ev.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Issued Assets & Safety Passports */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <HardHat size={16} className="text-orange-500" />
                <div>
                  <span className="font-bold text-slate-800">Issued Assets & PPE Passport</span>
                  <p className="text-[11px] text-slate-500">Full body safety harness, Calipers, Company Tablet #14</p>
                </div>
              </div>
              <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                Inspected & Current
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SALARY ADVANCE REQUEST MODAL                                          */}
      {/* ===================================================================== */}
      {showAdvanceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-5 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <DollarSign size={16} className="text-orange-500" />
                <span>Request Employee Salary Advance</span>
              </h3>
              <button onClick={() => setShowAdvanceModal(false)} className="text-slate-400 hover:text-slate-700">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Employee Recipient:</label>
                <select
                  value={advanceForm.staffId}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, staffId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="">Select Employee...</option>
                  {staffList.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.employeeId})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Advance Amount (LKR):</label>
                  <input
                    type="number"
                    value={advanceForm.amount}
                    onChange={(e) => setAdvanceForm({ ...advanceForm, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Repayment Tenure:</label>
                  <select
                    value={advanceForm.repaymentMonths}
                    onChange={(e) => setAdvanceForm({ ...advanceForm, repaymentMonths: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value={1}>1 Month (Single Cut)</option>
                    <option value={2}>2 Months Installment</option>
                    <option value={3}>3 Months Installment</option>
                    <option value={6}>6 Months Installment</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Advance Reason / Justification:</label>
                <input
                  type="text"
                  value={advanceForm.reason}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, reason: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="p-3 bg-orange-50 rounded-xl border border-orange-200 text-[11px] text-orange-950 flex justify-between">
                <span>Monthly Payroll Deduction:</span>
                <span className="font-mono font-bold">
                  LKR {(advanceForm.amount / (advanceForm.repaymentMonths || 1)).toFixed(0)} / Month
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowAdvanceModal(false)}
                className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const staff = staffList.find(s => s.id === advanceForm.staffId) || staffList[0];
                  hrService.requestSalaryAdvance(currentUser, {
                    employeeId: staff.employeeId || `EMP-${staff.id}`,
                    employeeName: staff.name,
                    department: staff.department,
                    amount: advanceForm.amount,
                    requestDate: new Date().toISOString().split('T')[0],
                    repaymentMonths: advanceForm.repaymentMonths,
                    monthlyDeduction: advanceForm.amount / advanceForm.repaymentMonths,
                    reason: advanceForm.reason
                  });
                  setSalaryAdvances(hrService.getSalaryAdvances());
                  setShowAdvanceModal(false);
                  toast.success('Salary Advance Approved & Disbursed', {
                    description: `LKR ${advanceForm.amount.toLocaleString()} scheduled for monthly payroll deduction.`
                  });
                }}
                className="px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                Authorize & Disburse
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
