import React, { useState, useMemo, useEffect } from 'react';
import {
  Building2,
  LayoutDashboard,
  Briefcase,
  ClipboardList,
  FileSpreadsheet,
  Wrench,
  ShieldCheck,
  Truck,
  FileText,
  BarChart3,
  Globe,
  RefreshCw,
  Download,
  Home,
  ChevronRight,
  TrendingUp,
  CheckCircle2,
  Activity,
  ArrowLeft,
  UserCheck,
  ShoppingCart,
  Users,
  Landmark,
  Play
} from 'lucide-react';
import { FactoryPortalIntegrationTestModal } from '../factory/FactoryPortalIntegrationTestModal';
import { SecurityUser } from '../../types/security';
import { useSecurity } from '../../context/SecurityContext';
import { Project, Quote, Invoice } from '../../types';
import { factoryExecutionService } from '../../services/factoryExecutionService';
import { FactoryMasterRegistryTab } from '../factory/FactoryMasterRegistryTab';
import { FactoryDashboardTab } from '../factory/FactoryDashboardTab';
import { WorkPackagesAndTasksTab } from '../factory/WorkPackagesAndTasksTab';
import { WorksheetsDailyAndMediaTab } from '../factory/WorksheetsDailyAndMediaTab';
import { ResourcesAndMaterialsTab } from '../factory/ResourcesAndMaterialsTab';
import { QualityHseAndDispatchTab } from '../factory/QualityHseAndDispatchTab';
import { DocumentsPerformanceAndPartnerTab } from '../factory/DocumentsPerformanceAndPartnerTab';
import { FactorySupervisorHubTab } from '../factory/FactorySupervisorHubTab';
import { FactoryErpAndSupervisorsTab } from '../factory/FactoryErpAndSupervisorsTab';
import { toast } from 'sonner';

export type OperationalPortalId =
  | 'dashboard'
  | 'factories'
  | 'supervisor_hub'
  | 'work_packages'
  | 'tasks_planning'
  | 'worksheets_daily'
  | 'resources_materials'
  | 'quality_hse'
  | 'dispatch_site'
  | 'documents_drawings'
  | 'analytics_audit'
  | 'partner_portal'
  | 'erp_supervisors'
  | 'erp_procurement'
  | 'erp_hr_payroll'
  | 'erp_finance_contracts'
  | 'executive'
  | 'project_management'
  | 'shop_floor'
  | 'quality'
  | 'product'
  | 'resource'
  | 'hr'
  | 'finance'
  | 'document_control'
  | 'admin';

interface OperationalControlCenterProps {
  currentUser?: SecurityUser | null;
  projects: Project[];
  quotes?: Quote[];
  invoices?: Invoice[];
  personnel?: any[];
  equipment?: any[];
  inspectionResults?: any[];
  ncrs?: any[];
  initialPortal?: OperationalPortalId;
  onPortalChange?: (portal: OperationalPortalId) => void;
  onNavigateAppView?: (view: any) => void;
  onNavigateHome?: () => void;
  onNavigateToPortal?: (targetPortal: string, subTab?: string) => void;
}

const LEGACY_TO_NEW_PORTAL_MAP: Record<string, OperationalPortalId> = {
  executive: 'factories',
  project_management: 'factories',
  shop_floor: 'worksheets_daily',
  quality: 'quality_hse',
  product: 'tasks_planning',
  resource: 'resources_materials',
  hr: 'erp_hr_payroll',
  finance: 'erp_finance_contracts',
  document_control: 'documents_drawings',
  admin: 'analytics_audit'
};

export const OperationalControlCenter: React.FC<OperationalControlCenterProps> = ({
  currentUser = null,
  projects,
  initialPortal = 'factories',
  onPortalChange,
  onNavigateHome
}) => {
  const { effectiveUser, hasPermission, canAccessPortal, filterAuthorizedFactories } = useSecurity();

  const activeUser = effectiveUser || currentUser;

  // Admin or Project Manager are NEVER Factory Manager accounts
  const isAdminAccount =
    !activeUser ||
    activeUser.roleId === 'role-superadmin' ||
    activeUser.roleId === 'role-sysadmin' ||
    activeUser.roleId === 'role-admin' ||
    activeUser.userType === 'SUPER_ADMIN' ||
    activeUser.userType === 'SYSTEM_ADMINISTRATOR' ||
    activeUser.adminAuthorityLevel === 'SUPER_ADMINISTRATOR' ||
    activeUser.adminAuthorityLevel === 'SYSTEM_ADMINISTRATOR';

  const isProjectManagerAccount =
    Boolean(activeUser) &&
    (activeUser?.roleId === 'role-pm' ||
      activeUser?.userType === 'PROJECT_MANAGER' ||
      activeUser?.adminAuthorityLevel === 'PROJECT_ADMINISTRATOR' ||
      (activeUser?.roleName || '').toLowerCase().includes('project manager'));

  const isFactoryManager =
    !isAdminAccount &&
    !isProjectManagerAccount &&
    factoryExecutionService.isFactoryManagerAccount(activeUser);

  const resolvedInitial = LEGACY_TO_NEW_PORTAL_MAP[initialPortal] || initialPortal || 'factories';
  const [activePortal, setActivePortal] = useState<OperationalPortalId>(resolvedInitial);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    const mapped = LEGACY_TO_NEW_PORTAL_MAP[initialPortal] || initialPortal || 'factories';
    setActivePortal(mapped);
  }, [initialPortal]);

  // If user is not Factory Manager (e.g., Admin or Project Manager) while on supervisor_hub, redirect immediately
  useEffect(() => {
    if (!isFactoryManager && activePortal === 'supervisor_hub') {
      setActivePortal('tasks_planning');
    }
  }, [isFactoryManager, activePortal]);

  const triggerRefresh = () => setRefreshTick(t => t + 1);

  const allFactories = useMemo(() => factoryExecutionService.getFactories(), [refreshTick]);
  const factories = useMemo(
    () => filterAuthorizedFactories(allFactories),
    [allFactories, filterAuthorizedFactories]
  );
  const authorizedFactoryIdSet = useMemo(() => new Set(factories.map(f => f.id)), [factories]);

  const notificationCounts = useMemo(
    () => factoryExecutionService.getFactoryNotificationCounts(),
    [refreshTick]
  );

  const workPackages = useMemo(
    () => factoryExecutionService.getWorkPackages().filter(w => authorizedFactoryIdSet.has(w.factoryId)),
    [refreshTick, authorizedFactoryIdSet]
  );
  const tasks = useMemo(
    () => factoryExecutionService.getTasks().filter(t => authorizedFactoryIdSet.has(t.factoryId)),
    [refreshTick, authorizedFactoryIdSet]
  );
  const worksheets = useMemo(
    () => factoryExecutionService.getWorksheets().filter(w => authorizedFactoryIdSet.has(w.factoryId)),
    [refreshTick, authorizedFactoryIdSet]
  );
  const inspections = useMemo(
    () => factoryExecutionService.getInspections().filter(i => authorizedFactoryIdSet.has(i.factoryId)),
    [refreshTick, authorizedFactoryIdSet]
  );
  const hseRecords = useMemo(
    () => factoryExecutionService.getHseRecords().filter(h => authorizedFactoryIdSet.has(h.factoryId)),
    [refreshTick, authorizedFactoryIdSet]
  );
  const dispatches = useMemo(
    () => factoryExecutionService.getDispatches().filter(d => authorizedFactoryIdSet.has(d.factoryId)),
    [refreshTick, authorizedFactoryIdSet]
  );
  const dailyReports = useMemo(
    () => factoryExecutionService.getDailyReports().filter(r => authorizedFactoryIdSet.has(r.factoryId)),
    [refreshTick, authorizedFactoryIdSet]
  );
  const mediaEvidence = useMemo(
    () => factoryExecutionService.getMediaEvidence().filter(m => authorizedFactoryIdSet.has(m.factoryId)),
    [refreshTick, authorizedFactoryIdSet]
  );
  const documents = useMemo(
    () => factoryExecutionService.getControlledDocuments().filter(d => authorizedFactoryIdSet.has(d.factoryId)),
    [refreshTick, authorizedFactoryIdSet]
  );
  const generatedDocs = useMemo(
    () => factoryExecutionService.getGeneratedDocuments().filter(g => authorizedFactoryIdSet.has(g.factoryId)),
    [refreshTick, authorizedFactoryIdSet]
  );
  const offlineQueue = useMemo(() => factoryExecutionService.getOfflineQueue(), [refreshTick]);

  // Active Factory & Assigned Project context
  // Level 1: Landing Page (activePortal === 'factories' || activePortal === 'dashboard')
  // Level 2: Opened Factory -> Project Hub (activePortal === 'work_packages' && selectedProjectFilter === 'ALL')
  // Level 3: Opened Project Card -> Sub-Portals (Tasks, Daily Logs, Resources, Quality, Dispatch, Documents, Analytics, Partners)
  const [selectedFactoryFilter, setSelectedFactoryFilter] = useState<string>('ALL');
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>('ALL');
  const [showTestModal, setShowTestModal] = useState(false);

  const isLandingPage = activePortal === 'factories' || activePortal === 'dashboard';
  const isProjectHubPage = activePortal === 'work_packages';

  const activeFactory = useMemo(
    () => factories.find(f => f.id === selectedFactoryFilter) || null,
    [factories, selectedFactoryFilter]
  );

  const activeWorkPackage = useMemo(
    () =>
      workPackages.find(
        w =>
          (selectedFactoryFilter === 'ALL' || w.factoryId === selectedFactoryFilter) &&
          (w.projectId === selectedProjectFilter || w.projectName === selectedProjectFilter)
      ) || null,
    [workPackages, selectedFactoryFilter, selectedProjectFilter]
  );

  // Filter records by active Factory & active Assigned Project
  const filteredWorkPackages = useMemo(() => {
    return workPackages.filter(wp => {
      const matchFac = selectedFactoryFilter === 'ALL' || wp.factoryId === selectedFactoryFilter;
      const matchPrj =
        isProjectHubPage ||
        selectedProjectFilter === 'ALL' ||
        wp.projectId === selectedProjectFilter ||
        wp.projectName === selectedProjectFilter;
      return matchFac && matchPrj;
    });
  }, [workPackages, selectedFactoryFilter, selectedProjectFilter, isProjectHubPage]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const matchFac = selectedFactoryFilter === 'ALL' || t.factoryId === selectedFactoryFilter;
      const matchPrj =
        isProjectHubPage ||
        selectedProjectFilter === 'ALL' ||
        t.projectId === selectedProjectFilter ||
        t.projectName === selectedProjectFilter;
      return matchFac && matchPrj;
    });
  }, [tasks, selectedFactoryFilter, selectedProjectFilter, isProjectHubPage]);

  const filteredWorksheets = useMemo(() => {
    return worksheets.filter(w => {
      const matchFac = selectedFactoryFilter === 'ALL' || w.factoryId === selectedFactoryFilter;
      const matchPrj = selectedProjectFilter === 'ALL' || w.projectId === selectedProjectFilter || w.projectName === selectedProjectFilter;
      return matchFac && matchPrj;
    });
  }, [worksheets, selectedFactoryFilter, selectedProjectFilter]);

  const filteredInspections = useMemo(() => {
    return inspections.filter(i => {
      const matchFac = selectedFactoryFilter === 'ALL' || i.factoryId === selectedFactoryFilter;
      const matchPrj = selectedProjectFilter === 'ALL' || i.projectId === selectedProjectFilter || i.projectName === selectedProjectFilter;
      return matchFac && matchPrj;
    });
  }, [inspections, selectedFactoryFilter, selectedProjectFilter]);

  const filteredHseRecords = useMemo(() => {
    return hseRecords.filter(h => {
      const matchFac = selectedFactoryFilter === 'ALL' || h.factoryId === selectedFactoryFilter;
      const matchPrj = selectedProjectFilter === 'ALL' || h.projectId === selectedProjectFilter || h.projectName === selectedProjectFilter;
      return matchFac && matchPrj;
    });
  }, [hseRecords, selectedFactoryFilter, selectedProjectFilter]);

  const filteredDispatches = useMemo(() => {
    return dispatches.filter(d => {
      const matchFac = selectedFactoryFilter === 'ALL' || d.factoryId === selectedFactoryFilter;
      const matchPrj = selectedProjectFilter === 'ALL' || d.projectId === selectedProjectFilter || d.projectName === selectedProjectFilter;
      return matchFac && matchPrj;
    });
  }, [dispatches, selectedFactoryFilter, selectedProjectFilter]);

  const filteredDailyReports = useMemo(() => {
    return dailyReports.filter(r => {
      const matchFac = selectedFactoryFilter === 'ALL' || r.factoryId === selectedFactoryFilter;
      const matchPrj = selectedProjectFilter === 'ALL' || r.projectId === selectedProjectFilter || r.projectName === selectedProjectFilter;
      return matchFac && matchPrj;
    });
  }, [dailyReports, selectedFactoryFilter, selectedProjectFilter]);

  const filteredMediaEvidence = useMemo(() => {
    return mediaEvidence.filter(m => {
      const matchFac = selectedFactoryFilter === 'ALL' || m.factoryId === selectedFactoryFilter;
      const matchPrj = selectedProjectFilter === 'ALL' || m.projectId === selectedProjectFilter || m.projectName === selectedProjectFilter;
      return matchFac && matchPrj;
    });
  }, [mediaEvidence, selectedFactoryFilter, selectedProjectFilter]);

  const filteredDocuments = useMemo(() => {
    return documents.filter(d => {
      const matchFac = selectedFactoryFilter === 'ALL' || d.factoryId === selectedFactoryFilter;
      const matchPrj = selectedProjectFilter === 'ALL' || d.projectId === selectedProjectFilter || d.projectName === selectedProjectFilter;
      return matchFac && matchPrj;
    });
  }, [documents, selectedFactoryFilter, selectedProjectFilter]);

  const filteredGeneratedDocs = useMemo(() => {
    return generatedDocs.filter(g => {
      const matchFac = selectedFactoryFilter === 'ALL' || g.factoryId === selectedFactoryFilter;
      const matchPrj = selectedProjectFilter === 'ALL' || g.projectId === selectedProjectFilter || g.projectName === selectedProjectFilter;
      return matchFac && matchPrj;
    });
  }, [generatedDocs, selectedFactoryFilter, selectedProjectFilter]);

  // Assigned project count for KPI display
  const assignedProjectCount = useMemo(() => {
    const set = new Set<string>();
    const sourceWps = selectedFactoryFilter === 'ALL'
      ? workPackages
      : workPackages.filter(w => w.factoryId === selectedFactoryFilter);
    sourceWps.forEach(w => set.add(w.projectId));
    return Math.max(set.size, projects.length);
  }, [workPackages, projects, selectedFactoryFilter]);

  // Level 1 Landing Page Tabs: ONLY "All Factories" and "Overview"
  const landingTabs = useMemo(() => {
    const tabs: Array<{
      id: OperationalPortalId;
      label: string;
      icon: React.ComponentType<{ className?: string }>;
      badgeCount?: number;
      visible: boolean;
    }> = [
      {
        id: 'factories',
        label: 'Factories',
        icon: Building2,
        badgeCount: factories.length,
        visible: isAdminAccount || canAccessPortal('factory-workshop-management') || hasPermission('perm_factory_view')
      },
      {
        id: 'dashboard',
        label: 'Overview',
        icon: LayoutDashboard,
        visible: isAdminAccount || canAccessPortal('factory-workshop-management') || hasPermission('perm_factory_view')
      }
    ];
    return tabs.filter(t => t.visible);
  }, [isAdminAccount, canAccessPortal, hasPermission, factories.length]);

  // Level 3 Opened Project Sub-Portals: Tasks, Daily Logs, Resources, Quality, Dispatch, Procurement, HR & Payroll (Owned), Finance & Contracts, Supervisors, Documents, Analytics, Partners (+ Supervisor Hub for Factory Manager)
  const isOwnedActiveFactory =
    !activeFactory || activeFactory.ownershipType === 'Innovista Owned';

  const scopedProcurementCount = useMemo(
    () =>
      factoryExecutionService.getFactoryProcurementRecords(
        selectedFactoryFilter,
        selectedProjectFilter,
        'ALL'
      ).length,
    [selectedFactoryFilter, selectedProjectFilter, refreshTick]
  );

  const scopedHrCount = useMemo(
    () =>
      factoryExecutionService.getFactoryHrPayrollRecords(
        selectedFactoryFilter,
        selectedProjectFilter
      ).length,
    [selectedFactoryFilter, selectedProjectFilter, refreshTick]
  );

  const scopedFinanceCount = useMemo(
    () =>
      factoryExecutionService.getFactoryFinanceRecords(
        selectedFactoryFilter,
        selectedProjectFilter,
        'ALL'
      ).length,
    [selectedFactoryFilter, selectedProjectFilter, refreshTick]
  );

  const scopedSupervisorsCount = useMemo(
    () =>
      factoryExecutionService.getSupervisorAssignments(
        selectedFactoryFilter,
        selectedProjectFilter
      ).length,
    [selectedFactoryFilter, selectedProjectFilter, refreshTick]
  );

  const projectSubPortals = useMemo(() => {
    const allTabs: Array<{
      id: OperationalPortalId;
      label: string;
      icon: React.ComponentType<{ className?: string }>;
      badgeCount?: number;
      visible: boolean;
    }> = [
      {
        id: 'supervisor_hub',
        label: 'Supervisor',
        icon: UserCheck,
        badgeCount: filteredTasks.length,
        visible: isFactoryManager
      },
      {
        id: 'tasks_planning',
        label: 'Tasks',
        icon: ClipboardList,
        badgeCount: filteredTasks.length,
        visible: isAdminAccount || hasPermission('perm_factory_view') || isFactoryManager
      },
      {
        id: 'erp_supervisors',
        label: 'Supervisors',
        icon: UserCheck,
        badgeCount: scopedSupervisorsCount,
        visible: true
      },
      {
        id: 'erp_procurement',
        label: 'Procurement',
        icon: ShoppingCart,
        badgeCount: scopedProcurementCount,
        visible: true
      },
      {
        id: 'erp_hr_payroll',
        label: 'Payroll',
        icon: Users,
        badgeCount: scopedHrCount,
        visible: isOwnedActiveFactory
      },
      {
        id: 'erp_finance_contracts',
        label: 'Finance',
        icon: Landmark,
        badgeCount: scopedFinanceCount,
        visible: true
      },
      {
        id: 'worksheets_daily',
        label: 'Logs',
        icon: FileSpreadsheet,
        badgeCount: filteredWorksheets.length,
        visible: isAdminAccount || isFactoryManager || isOwnedActiveFactory
      },
      {
        id: 'resources_materials',
        label: 'Resources',
        icon: Wrench,
        visible: isAdminAccount || isFactoryManager || isOwnedActiveFactory
      },
      {
        id: 'quality_hse',
        label: 'Quality',
        icon: ShieldCheck,
        badgeCount: filteredInspections.length,
        visible: isAdminAccount || isFactoryManager || isOwnedActiveFactory
      },
      {
        id: 'dispatch_site',
        label: 'Dispatch',
        icon: Truck,
        badgeCount: filteredDispatches.length,
        visible: isAdminAccount || isFactoryManager || isOwnedActiveFactory
      },
      {
        id: 'documents_drawings',
        label: 'Documents',
        icon: FileText,
        badgeCount: filteredDocuments.length,
        visible: isAdminAccount || isFactoryManager || isOwnedActiveFactory
      },
      {
        id: 'analytics_audit',
        label: 'Analytics',
        icon: BarChart3,
        visible: isAdminAccount || isFactoryManager || isOwnedActiveFactory
      },
      {
        id: 'partner_portal',
        label: 'Partners',
        icon: Globe,
        visible: isAdminAccount || isFactoryManager || canAccessPortal('factory-workshop-management')
      }
    ];
    return allTabs.filter(t => t.visible);
  }, [
    isAdminAccount,
    isFactoryManager,
    isOwnedActiveFactory,
    canAccessPortal,
    hasPermission,
    filteredTasks.length,
    filteredWorksheets.length,
    filteredInspections.length,
    filteredDispatches.length,
    filteredDocuments.length,
    scopedSupervisorsCount,
    scopedProcurementCount,
    scopedHrCount,
    scopedFinanceCount
  ]);

  const handleSelectTab = (id: OperationalPortalId) => {
    if (id === 'factories' || id === 'dashboard') {
      setSelectedFactoryFilter('ALL');
      setSelectedProjectFilter('ALL');
    } else if (id === 'work_packages') {
      // Returning to Project Hub keeps the selected factory, clears the selected project
      if (selectedFactoryFilter === 'ALL' && factories.length > 0) {
        setSelectedFactoryFilter(factories[0].id);
      }
      setSelectedProjectFilter('ALL');
    } else if (selectedFactoryFilter === 'ALL' && factories.length > 0) {
      setSelectedFactoryFilter(factories[0].id);
    }
    setActivePortal(id);
    onPortalChange?.(id);
  };

  const handleBackToLanding = () => {
    setSelectedFactoryFilter('ALL');
    setSelectedProjectFilter('ALL');
    setActivePortal('factories');
    onPortalChange?.('factories');
  };

  const handleBackToProjectHub = () => {
    setSelectedProjectFilter('ALL');
    setActivePortal('work_packages');
    onPortalChange?.('work_packages');
  };

  // Master KPI metrics
  const avgUtilization = useMemo(() => {
    const source = activeFactory ? [activeFactory] : factories;
    if (source.length === 0) return 76;
    return Math.round(
      source.reduce((sum, f) => sum + (f.currentCapacityUtilization || 72), 0) / source.length
    );
  }, [factories, activeFactory]);

  const avgQualityScore = useMemo(() => {
    const source = activeFactory ? [activeFactory] : factories;
    if (source.length === 0) return 98.2;
    const sum = source.reduce((s, f) => s + (f.performanceScorecard?.qualityAcceptanceRate || 98), 0);
    return Number((sum / source.length).toFixed(1));
  }, [factories, activeFactory]);

  const activeTasksCount = useMemo(
    () => filteredTasks.filter(t => ['In Progress', 'Submitted for Inspection'].includes(t.stageStatus)).length,
    [filteredTasks]
  );

  const handleSyncAllOffline = () => {
    const count = factoryExecutionService.syncAllPendingQueueItems();
    toast.success(count > 0 ? `Synced ${count} records` : 'Synchronized');
    triggerRefresh();
  };

  const handleExportMasterCsv = () => {
    const headers = ['FactoryCode', 'FactoryName', 'Ownership', 'City', 'UtilizationPct', 'Status', 'QualityScore'];
    const rows = factories.map(f => [
      f.factoryCode,
      `"${f.name}"`,
      f.ownershipType,
      f.city,
      f.currentCapacityUtilization,
      f.status,
      f.performanceScorecard.qualityAcceptanceRate
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Innovista_Factories_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported CSV');
  };

  return (
    <div className="space-y-3 font-sans">
      {/* ------------------ HEADER RIBBON (Portal Name & Buttons Only, No Descriptions) ------------------ */}
      <header className="bg-white border border-slate-200/80 px-5 py-2.5 rounded-xl flex flex-wrap items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-2.5 min-w-0">
          {onNavigateHome && (
            <button
              onClick={onNavigateHome}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-lg text-xs font-semibold border border-orange-200 transition-colors shadow-2xs cursor-pointer shrink-0"
            >
              <Home size={13} className="text-orange-500" />
              <span>Home</span>
            </button>
          )}
          {!isLandingPage && (
            <button
              onClick={handleBackToLanding}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 transition-colors cursor-pointer shrink-0"
            >
              <ArrowLeft size={13} className="text-slate-600" />
              <span>Factories</span>
            </button>
          )}
          {!isLandingPage && !isProjectHubPage && (
            <button
              onClick={handleBackToProjectHub}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg text-xs font-semibold border border-sky-200 transition-colors cursor-pointer shrink-0"
            >
              <Briefcase size={13} className="text-sky-600" />
              <span>Projects</span>
            </button>
          )}
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white shrink-0 shadow-2xs">
            <Building2 size={16} />
          </div>
          <h1 className="text-sm font-bold text-slate-900 whitespace-nowrap truncate">
            {!isLandingPage && activeFactory
              ? !isProjectHubPage && activeWorkPackage
                ? `${activeFactory.factoryCode} — ${activeWorkPackage.projectName}`
                : `${activeFactory.factoryCode} — ${activeFactory.name}`
              : 'Factories'}
          </h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleSyncAllOffline}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
            title="Sync all offline queued records"
          >
            <RefreshCw size={12} className="text-slate-600" />
            <span>Sync Queue</span>
          </button>
          <button
            type="button"
            onClick={handleExportMasterCsv}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
            title="Export master CSV summary"
          >
            <Download size={12} className="text-slate-600" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={() => setShowTestModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-lg text-xs font-bold shadow-xs hover:shadow-sm transition-all cursor-pointer"
            title="Run Integration Test across Procurement, Supervising Team, HR & Payroll, Finance, and Logs for this factory"
          >
            <Play size={13} className="fill-white" />
            <span>Test Factory Portals</span>
          </button>
        </div>
      </header>

      {/* ------------------ NAVIGATION BAR ------------------ */}
      {isLandingPage && (
        /* Level 1: Factory Landing Page Navigation ("All Factories" & "Overview") */
        <div className="bg-slate-100 p-1 rounded-xl flex flex-wrap gap-1">
          {landingTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activePortal === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleSelectTab(tab.id)}
                className={`flex-1 min-w-[140px] flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs transition-colors ${
                  isActive
                    ? 'bg-white text-orange-600 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 font-normal'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-orange-500' : 'text-slate-400'}`} />
                <span className="whitespace-nowrap">{tab.label}</span>
                {typeof tab.badgeCount === 'number' && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive
                        ? 'bg-orange-50 text-orange-600 border border-orange-200/80'
                        : 'bg-slate-200/70 text-slate-600'
                    }`}
                  >
                    {tab.badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {!isLandingPage && !isProjectHubPage && (
        /* Level 3: Opened Project Card Sub-Portals Navigation (Tasks, Daily Logs, Resources, Quality, Dispatch, Documents, Analytics, Partners) */
        <div className="bg-slate-100 p-1 rounded-xl flex flex-wrap gap-1">
          {projectSubPortals.map(tab => {
            const Icon = tab.icon;
            const isActive = activePortal === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleSelectTab(tab.id)}
                className={`flex-1 min-w-[96px] flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs transition-colors ${
                  isActive
                    ? 'bg-white text-orange-600 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 font-normal'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-orange-500' : 'text-slate-400'}`} />
                <span className="whitespace-nowrap">{tab.label}</span>
                {typeof tab.badgeCount === 'number' && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive
                        ? 'bg-orange-50 text-orange-600 border border-orange-200/80'
                        : 'bg-slate-200/70 text-slate-600'
                    }`}
                  >
                    {tab.badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* ------------------ 5 MINIMAL KPI CARDS (Shown on Overview & Inside Opened Project, NOT on All Factories or Project Hub Cards Page) ------------------ */}
      {activePortal !== 'factories' && activePortal !== 'work_packages' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* KPI 1 */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>{activeFactory ? 'Plant' : 'Factories'}</span>
              <span className="text-[11px] font-semibold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                <Activity size={10} /> {avgUtilization}%
              </span>
            </div>
            <p className="text-xl font-extrabold text-slate-900 tracking-tight my-2">
              {activeFactory ? activeFactory.factoryCode : factories.length}
            </p>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>{activeFactory ? activeFactory.status : 'Active'}</span>
              <button
                onClick={handleBackToLanding}
                className="text-orange-600 font-semibold hover:underline flex items-center gap-0.5"
              >
                <span>All</span> <ChevronRight size={12} />
              </button>
            </div>
          </div>

          {/* KPI 2 */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Projects</span>
              <span className="text-[11px] font-semibold text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                <TrendingUp size={10} /> {assignedProjectCount}
              </span>
            </div>
            <p className="text-xl font-extrabold text-sky-600 tracking-tight my-2">
              {filteredWorkPackages.length}
            </p>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>Project Hub</span>
              <button
                onClick={handleBackToProjectHub}
                className="text-orange-600 font-semibold hover:underline flex items-center gap-0.5"
              >
                <span>Open</span> <ChevronRight size={12} />
              </button>
            </div>
          </div>

          {/* KPI 3 */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Tasks</span>
              <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                {activeTasksCount} Active
              </span>
            </div>
            <p className="text-xl font-extrabold text-slate-900 tracking-tight my-2">
              {filteredTasks.length}
            </p>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>Logs: {filteredWorksheets.length}</span>
              <button
                onClick={() => handleSelectTab('tasks_planning')}
                className="text-orange-600 font-semibold hover:underline flex items-center gap-0.5"
              >
                <span>Open</span> <ChevronRight size={12} />
              </button>
            </div>
          </div>

          {/* KPI 4 */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Quality</span>
              <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                <CheckCircle2 size={10} /> QC
              </span>
            </div>
            <p className="text-xl font-extrabold text-emerald-600 tracking-tight my-2">
              {avgQualityScore}%
            </p>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>Checks: {filteredInspections.length}</span>
              <button
                onClick={() => handleSelectTab('quality_hse')}
                className="text-orange-600 font-semibold hover:underline flex items-center gap-0.5"
              >
                <span>Open</span> <ChevronRight size={12} />
              </button>
            </div>
          </div>

          {/* KPI 5 */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col justify-between col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Dispatch</span>
              <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                Site
              </span>
            </div>
            <p className="text-xl font-extrabold text-slate-900 tracking-tight my-2">
              {filteredDispatches.length}
            </p>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>Docs: {filteredDocuments.length}</span>
              <button
                onClick={() => handleSelectTab('dispatch_site')}
                className="text-orange-600 font-semibold hover:underline flex items-center gap-0.5"
              >
                <span>Open</span> <ChevronRight size={12} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------ ACTIVE SUB-PORTAL CONTENT ------------------ */}
      <div>
        {activePortal === 'factories' && (
          <FactoryMasterRegistryTab
            currentUser={activeUser}
            factories={factories}
            workPackages={workPackages}
            tasks={tasks}
            projects={projects}
            notificationCounts={notificationCounts}
            onRefresh={triggerRefresh}
            onSelectFactory={(factoryId) => {
              // Opening a Factory Card ALWAYS opens its Project Hub (assigned project cards) first
              setSelectedFactoryFilter(factoryId);
              setSelectedProjectFilter('ALL');
              setActivePortal('work_packages');
              onPortalChange?.('work_packages');
            }}
          />
        )}

        {activePortal === 'dashboard' && (
          <FactoryDashboardTab
            currentUser={activeUser}
            factories={selectedFactoryFilter === 'ALL' ? factories : factories.filter(f => f.id === selectedFactoryFilter)}
            workPackages={filteredWorkPackages}
            tasks={filteredTasks}
            worksheets={filteredWorksheets}
            inspections={filteredInspections}
            dispatches={filteredDispatches}
            offlineQueue={offlineQueue}
            notificationCounts={notificationCounts}
            onNavigateSubPortal={(id) => handleSelectTab(id as OperationalPortalId)}
            onSelectFactory={(factoryId) => {
              // Opening a Factory from Overview ALWAYS opens its Project Hub first
              setSelectedFactoryFilter(factoryId);
              setSelectedProjectFilter('ALL');
              setActivePortal('work_packages');
              onPortalChange?.('work_packages');
            }}
            onRefresh={triggerRefresh}
          />
        )}

        {activePortal === 'supervisor_hub' && isFactoryManager && !isAdminAccount && (
          <FactorySupervisorHubTab
            currentUser={activeUser}
            factories={selectedFactoryFilter === 'ALL' ? factories : factories.filter(f => f.id === selectedFactoryFilter)}
            workPackages={filteredWorkPackages}
            tasks={filteredTasks}
            onRefresh={triggerRefresh}
          />
        )}

        {(activePortal === 'work_packages' || activePortal === 'tasks_planning') && (
          <WorkPackagesAndTasksTab
            mode={activePortal}
            currentUser={activeUser}
            isFactoryManager={isFactoryManager}
            factories={factories}
            workPackages={filteredWorkPackages}
            tasks={filteredTasks}
            projects={projects}
            selectedFactoryId={selectedFactoryFilter === 'ALL' ? undefined : selectedFactoryFilter}
            selectedProjectId={selectedProjectFilter === 'ALL' ? undefined : selectedProjectFilter}
            onSelectProject={(facId, prjId, switchToTasks) => {
              if (facId) setSelectedFactoryFilter(facId);
              if (prjId) setSelectedProjectFilter(prjId);
              if (switchToTasks) {
                const targetSubPortal: OperationalPortalId =
                  isFactoryManager && !isAdminAccount ? 'supervisor_hub' : 'tasks_planning';
                setActivePortal(targetSubPortal);
                onPortalChange?.(targetSubPortal);
              }
            }}
            onRefresh={triggerRefresh}
          />
        )}

        {activePortal === 'worksheets_daily' && (
          <WorksheetsDailyAndMediaTab
            currentUser={activeUser}
            factories={factories}
            tasks={filteredTasks}
            worksheets={filteredWorksheets}
            dailyReports={filteredDailyReports}
            mediaEvidence={filteredMediaEvidence}
            onRefresh={triggerRefresh}
          />
        )}

        {activePortal === 'resources_materials' && (
          <ResourcesAndMaterialsTab
            currentUser={activeUser}
            factories={selectedFactoryFilter === 'ALL' ? factories : factories.filter(f => f.id === selectedFactoryFilter)}
            workPackages={filteredWorkPackages}
            tasks={filteredTasks}
            onRefresh={triggerRefresh}
          />
        )}

        {(activePortal === 'quality_hse' || activePortal === 'dispatch_site') && (
          <QualityHseAndDispatchTab
            mode={activePortal}
            currentUser={activeUser}
            factories={factories}
            workPackages={filteredWorkPackages}
            tasks={filteredTasks}
            inspections={filteredInspections}
            hseRecords={filteredHseRecords}
            dispatches={filteredDispatches}
            onRefresh={triggerRefresh}
          />
        )}

        {(activePortal === 'documents_drawings' ||
          activePortal === 'analytics_audit' ||
          activePortal === 'partner_portal') && (
          <DocumentsPerformanceAndPartnerTab
            mode={activePortal}
            currentUser={activeUser}
            factories={factories}
            workPackages={filteredWorkPackages}
            tasks={filteredTasks}
            documents={filteredDocuments}
            generatedDocs={filteredGeneratedDocs}
            onRefresh={triggerRefresh}
          />
        )}

        {(activePortal === 'erp_supervisors' ||
          activePortal === 'erp_procurement' ||
          activePortal === 'erp_hr_payroll' ||
          activePortal === 'erp_finance_contracts') && (
          <FactoryErpAndSupervisorsTab
            mode={activePortal}
            currentUser={activeUser}
            factories={factories}
            workPackages={filteredWorkPackages}
            selectedFactoryId={selectedFactoryFilter === 'ALL' ? undefined : selectedFactoryFilter}
            selectedProjectId={selectedProjectFilter === 'ALL' ? undefined : selectedProjectFilter}
            onRefresh={triggerRefresh}
          />
        )}
      </div>

      {/* Integration Test Modal for Factory Connected Portals */}
      <FactoryPortalIntegrationTestModal
        isOpen={showTestModal}
        onClose={() => setShowTestModal(false)}
        factory={activeFactory || factories[0] || null}
        workPackage={activeWorkPackage || filteredWorkPackages[0] || null}
        currentUser={activeUser}
        onNavigateTab={(tabId) => {
          handleSelectTab(tabId as OperationalPortalId);
          setShowTestModal(false);
        }}
        onRefresh={triggerRefresh}
      />
    </div>
  );
};
