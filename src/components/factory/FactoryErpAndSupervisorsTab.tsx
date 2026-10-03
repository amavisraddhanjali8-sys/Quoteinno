import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  UserCheck,
  Users,
  Landmark,
  FileSignature,
  Plus,
  Printer,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Trash2,
  X,
  ArrowRight,
  Receipt,
  BookOpen,
  Edit3,
  Play
} from 'lucide-react';
import { FactoryPortalIntegrationTestModal } from './FactoryPortalIntegrationTestModal';
import {
  FactoryMasterProfile,
  FactoryWorkPackageAssignment,
  FactoryProjectSupervisorAssignment,
  FactorySupervisingRoleType,
  FactoryProcurementStageType,
  FactoryProcurementRecord,
  FactoryHrPayrollRecord,
  FactoryFinanceRecordCategory,
  FactoryFinanceAccountingRecord
} from '../../types/factoryPortal';
import { SecurityUser } from '../../types/security';
import { useSecurity } from '../../context/SecurityContext';
import { factoryExecutionService } from '../../services/factoryExecutionService';
import { hrService } from '../../services/hrService';
import {
  FactoryQuotationDocumentModal,
  FactoryRecordDocumentSpec
} from './FactoryQuotationDocumentModal';
import {
  buildSupervisorAssignmentDocSpec,
  buildFactoryProcurementDocSpec,
  buildFactoryHrPayrollDocSpec,
  buildFactoryFinanceDocSpec
} from './factoryDocumentBuilders';
import { approvalSlaAlertService, ApprovalSlaCategory } from '../../services/approvalSlaAlertService';
import { GoogleWorkspaceSignInButton } from '../operations/SlaApprovalAlertCenterModal';
import { AlarmClock } from 'lucide-react';
import { toast } from 'sonner';

export type FactoryErpSubPortalMode =
  | 'erp_supervisors'
  | 'erp_procurement'
  | 'erp_hr_payroll'
  | 'erp_finance_contracts';

export interface FactoryErpAndSupervisorsTabProps {
  mode?: FactoryErpSubPortalMode;
  currentUser?: SecurityUser | null;
  factories?: FactoryMasterProfile[];
  workPackages?: FactoryWorkPackageAssignment[];
  selectedFactoryId?: string;
  selectedProjectId?: string;
  onRefresh?: () => void;
  projects?: any[];
  initialSubTab?: 'supervisors' | 'procurement' | 'hr_payroll' | 'finance_contracts' | string;
  onOpenDocModal?: (spec: any) => void;
  onRefreshParent?: () => void;
}

const SUPERVISING_ROLES: FactorySupervisingRoleType[] = [
  'Factory Manager',
  'Project Factory Engineer',
  'QA/QC Inspector',
  'Factory Supervisor',
  'Procurement Officer',
  'Finance & Accounting Officer',
  'HR & Payroll Officer',
  'Partner Factory Representative'
];

const PROCUREMENT_STAGES: Array<{
  id: FactoryProcurementStageType | 'ALL';
  label: string;
  shortLabel: string;
}> = [
  { id: 'ALL', label: 'All Procurement Stages', shortLabel: 'All' },
  { id: 'RQ', label: 'Requisitions (RQ)', shortLabel: 'RQ' },
  { id: 'QUOTATION', label: 'Quotations (RFQ)', shortLabel: 'Quotation' },
  { id: 'PO', label: 'Purchase Orders (PO)', shortLabel: 'PO' },
  { id: 'GRN', label: 'Goods Received (GRN)', shortLabel: 'GRN' },
  { id: 'QC_INSPECTION', label: 'QC Inspections (IQC)', shortLabel: 'QC Inspect' },
  { id: 'NCR_REPORT', label: 'NCR Reports', shortLabel: 'NCR' },
  { id: 'RETURN', label: 'Returns / Debit Notes', shortLabel: 'Returns' }
];

export const FactoryErpAndSupervisorsTab: React.FC<FactoryErpAndSupervisorsTabProps> = ({
  mode: propMode,
  currentUser: propUser,
  factories: propFactories,
  workPackages: propWorkPackages,
  selectedFactoryId,
  selectedProjectId,
  onRefresh: propOnRefresh,
  initialSubTab,
  onOpenDocModal: _onOpenDocModal,
  onRefreshParent
}) => {
  const { currentUser: secUser, users, switchUser } = useSecurity();
  const currentUser = propUser !== undefined ? propUser : secUser;
  const factories = propFactories || factoryExecutionService.getFactories();
  const workPackages = propWorkPackages || factoryExecutionService.getWorkPackages();
  const onRefresh = propOnRefresh || onRefreshParent || (() => {});
  const mode: FactoryErpSubPortalMode =
    propMode ||
    (initialSubTab === 'procurement'
      ? 'erp_procurement'
      : initialSubTab === 'hr_payroll'
      ? 'erp_hr_payroll'
      : initialSubTab === 'finance_contracts'
      ? 'erp_finance_contracts'
      : 'erp_supervisors');
  const [localTick, setLocalTick] = useState(0);
  const [docSpec, setDocSpec] = useState<FactoryRecordDocumentSpec | null>(null);

  const activeFac = useMemo(
    () =>
      factories.find(f => f.id === selectedFactoryId) ||
      factories[0] ||
      factoryExecutionService.getFactories()[0],
    [factories, selectedFactoryId]
  );

  const activeWp = useMemo(
    () =>
      workPackages.find(
        w =>
          (!selectedFactoryId || w.factoryId === selectedFactoryId) &&
          (!selectedProjectId ||
            w.projectId === selectedProjectId ||
            w.projectName === selectedProjectId)
      ) ||
      workPackages[0] ||
      factoryExecutionService.getWorkPackages()[0],
    [workPackages, selectedFactoryId, selectedProjectId]
  );

  const isOwnedFactory = activeFac?.ownershipType === 'Innovista Owned';
  const effectiveFactoryId = selectedFactoryId || activeFac?.id || 'ALL';
  const effectiveProjectId = selectedProjectId || activeWp?.projectId || 'ALL';

  const hrEmployees = useMemo(() => hrService.getEmployees(null), []);

  // Scoped records strictly for the active Factory + Project
  const supervisorList = useMemo(
    () =>
      factoryExecutionService.getSupervisorAssignments(effectiveFactoryId, effectiveProjectId),
    [effectiveFactoryId, effectiveProjectId, localTick]
  );

  const [procStageFilter, setProcStageFilter] = useState<FactoryProcurementStageType | 'ALL'>('ALL');
  const procurementList = useMemo(
    () =>
      factoryExecutionService.getFactoryProcurementRecords(
        effectiveFactoryId,
        effectiveProjectId,
        procStageFilter
      ),
    [effectiveFactoryId, effectiveProjectId, procStageFilter, localTick]
  );

  const hrPayrollList = useMemo(
    () =>
      factoryExecutionService.getFactoryHrPayrollRecords(effectiveFactoryId, effectiveProjectId),
    [effectiveFactoryId, effectiveProjectId, localTick]
  );

  const [showTestModal, setShowTestModal] = useState(false);

  const [financeCatFilter, setFinanceCatFilter] = useState<FactoryFinanceRecordCategory | 'ALL'>('ALL');
  const financeList = useMemo(
    () =>
      factoryExecutionService.getFactoryFinanceRecords(
        effectiveFactoryId,
        effectiveProjectId,
        financeCatFilter
      ),
    [effectiveFactoryId, effectiveProjectId, financeCatFilter, localTick]
  );

  // Module permissions for current user
  const canManageSupervisors = true;
  const canManageProcurement = factoryExecutionService.hasModuleAuthorityInFactory(
    currentUser,
    'canManageProcurement',
    effectiveFactoryId,
    effectiveProjectId
  );
  const canManageHr = factoryExecutionService.hasModuleAuthorityInFactory(
    currentUser,
    'canManageHrAndPayroll',
    effectiveFactoryId,
    effectiveProjectId
  );
  const canManageFinance = factoryExecutionService.hasModuleAuthorityInFactory(
    currentUser,
    'canManageFinanceAndInvoices',
    effectiveFactoryId,
    effectiveProjectId
  );

  // --- 1. Assign Supervisor / Engineer / QC Inspector Modal State ---
  const [showSupModal, setShowSupModal] = useState(false);
  const [editingSup, setEditingSup] = useState<FactoryProjectSupervisorAssignment | null>(null);
  const [supUserId, setSupUserId] = useState(users[2]?.id || 'usr-03');
  const [supFullName, setSupFullName] = useState('Eng. Nuwan Perera');
  const [supRoleType, setSupRoleType] = useState<FactorySupervisingRoleType>('Project Factory Engineer');
  const [supEmail, setSupEmail] = useState('nuwan.perera@innovista.lk');
  const [supPhone, setSupPhone] = useState('+94 77 312 8820');
  const [supFmAuth, setSupFmAuth] = useState(true);
  const [supPermTasks, setSupPermTasks] = useState(true);
  const [supPermQc, setSupPermQc] = useState(true);
  const [supPermProc, setSupPermProc] = useState(true);
  const [supPermHr, setSupPermHr] = useState(isOwnedFactory);
  const [supPermFin, setSupPermFin] = useState(true);
  const [supPermCnt, setSupPermCnt] = useState(true);

  const handleOpenEditSup = (sa: FactoryProjectSupervisorAssignment) => {
    setEditingSup(sa);
    setSupUserId(sa.userId);
    setSupFullName(sa.fullName);
    setSupRoleType(sa.supervisingRole);
    setSupEmail(sa.email || '');
    setSupPhone(sa.phone || '');
    setSupFmAuth(sa.hasFactoryManagerAuthority);
    setSupPermTasks(sa.permissions?.canManageTasksAndChecklists ?? true);
    setSupPermQc(sa.permissions?.canManageQualityAndNcr ?? true);
    setSupPermProc(sa.permissions?.canManageProcurement ?? true);
    setSupPermHr(sa.permissions?.canManageHrAndPayroll ?? true);
    setSupPermFin(sa.permissions?.canManageFinanceAndInvoices ?? true);
    setSupPermCnt(sa.permissions?.canManageContractsAndAgreements ?? true);
    setShowSupModal(true);
  };

  const handleSelectPresetUser = (uid: string) => {
    setSupUserId(uid);
    const u = users.find(x => x.id === uid);
    if (u) {
      setSupFullName(u.fullName);
      setSupEmail(u.email);
      const rLower = (u.roleName || '').toLowerCase();
      if (rLower.includes('qc') || rLower.includes('quality')) {
        setSupRoleType('QA/QC Inspector');
      } else if (rLower.includes('engineer')) {
        setSupRoleType('Project Factory Engineer');
      } else if (rLower.includes('procurement')) {
        setSupRoleType('Procurement Officer');
      } else if (rLower.includes('finance') || rLower.includes('account')) {
        setSupRoleType('Finance & Accounting Officer');
      } else if (rLower.includes('hr')) {
        setSupRoleType('HR & Payroll Officer');
      } else if (rLower.includes('external')) {
        setSupRoleType('Partner Factory Representative');
      } else {
        setSupRoleType('Factory Manager');
      }
    }
  };

  const handleSaveSupervisor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supFullName.trim()) return;
    const matchedUser = users.find(u => u.id === supUserId);
    factoryExecutionService.saveSupervisorAssignment(currentUser, {
      id: editingSup?.id,
      assignmentCode: editingSup?.assignmentCode,
      userId: matchedUser?.id || supUserId,
      employeeId: matchedUser?.employeeId || `EMP-${Math.floor(100 + Math.random() * 899)}`,
      username:
        matchedUser?.username ||
        supFullName
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '.')
          .replace(/\.+/g, '.'),
      fullName: supFullName.trim(),
      roleName: matchedUser?.roleName || supRoleType,
      supervisingRole: supRoleType,
      department: matchedUser?.department || 'FACTORY_PRODUCTION',
      email: supEmail,
      phone: supPhone,
      factoryId: activeFac?.id || 'fac-inv-01',
      projectId: activeWp?.projectId || 'PRJ-2026-001',
      projectName: activeWp?.projectName || 'Sirius Mall Storefront',
      workPackageId: activeWp?.id || 'fwp-01',
      hasFactoryManagerAuthority: supFmAuth,
      permissions: {
        canManageTasksAndChecklists: supPermTasks,
        canManageQualityAndNcr: supPermQc,
        canManageProcurement: supPermProc,
        canManageHrAndPayroll: supPermHr,
        canManageFinanceAndInvoices: supPermFin,
        canManageContractsAndAgreements: supPermCnt
      }
    });
    setEditingSup(null);
    setShowSupModal(false);
    setLocalTick(t => t + 1);
    onRefresh();
    toast.success(
      `Saved ${supFullName} (${supRoleType})`
    );
  };

  // --- 2. Procurement Chain Modal State (RQ, Quotation, PO, GRN, QC Inspection, NCR, Return) ---
  const [showProcModal, setShowProcModal] = useState(false);
  const [editingProc, setEditingProc] = useState<FactoryProcurementRecord | null>(null);
  const [procStage, setProcStage] = useState<FactoryProcurementStageType>('RQ');
  const [procTitle, setProcTitle] = useState('');
  const [procItemSummary, setProcItemSummary] = useState('6063-T6 Architectural Aluminium Extrusion Profiles & Hardware');
  const [procSupplier, setProcSupplier] = useState('Alumex Extrusions PLC');
  const [procLinkedRef, setProcLinkedRef] = useState(activeWp?.packageCode || 'FWP-2026-001');
  const [procQty, setProcQty] = useState(100);
  const [procAcceptedQty, setProcAcceptedQty] = useState(100);
  const [procRejectedQty, setProcRejectedQty] = useState(0);
  const [procUnit, setProcUnit] = useState('Bars');
  const [procRate, setProcRate] = useState(18200);
  const [procRemarks, setProcRemarks] = useState('Project & Factory verified procurement transaction.');
  const [procSlaMins, setProcSlaMins] = useState<number>(60);
  const [procCustomDeadline, setProcCustomDeadline] = useState<string>('');
  const [procSyncCalendar, setProcSyncCalendar] = useState<boolean>(true);

  const handleOpenEditProc = (pr: FactoryProcurementRecord) => {
    setEditingProc(pr);
    setProcStage(pr.stageType);
    setProcTitle(pr.title);
    setProcItemSummary(pr.itemSummary);
    setProcSupplier(pr.supplierOrPartnerName);
    setProcLinkedRef(pr.linkedRefCode);
    setProcQty(pr.quantity);
    setProcAcceptedQty(pr.acceptedQty);
    setProcRejectedQty(pr.rejectedQty);
    setProcUnit(pr.unit);
    setProcRate(pr.unitRate);
    setProcRemarks(pr.remarks);
    setShowProcModal(true);
  };

  const handleSaveProcurement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!procTitle.trim()) return;
    const saved = factoryExecutionService.saveFactoryProcurementRecord(currentUser, {
      id: editingProc?.id,
      docCode: editingProc?.docCode,
      stageType: procStage,
      factoryId: activeFac?.id || 'fac-inv-01',
      projectId: activeWp?.projectId || 'PRJ-2026-001',
      projectName: activeWp?.projectName || 'Sirius Mall Storefront',
      workPackageId: activeWp?.id || 'fwp-01',
      supplierOrPartnerName: procSupplier,
      linkedRefCode: procLinkedRef,
      title: procTitle.trim(),
      itemSummary: procItemSummary,
      quantity: procQty,
      acceptedQty: procAcceptedQty,
      rejectedQty: procRejectedQty,
      unit: procUnit,
      unitRate: procRate,
      totalAmount: procQty * procRate,
      remarks: procRemarks
    });
    setEditingProc(null);

    const slaCat: ApprovalSlaCategory =
      procStage === 'QC_INSPECTION'
        ? 'QC_INSPECTION_APPROVAL'
        : procStage === 'NCR_REPORT'
        ? 'NCR_DISPOSITION_ACTION'
        : 'PROCUREMENT_APPROVAL';

    const assignedRoles =
      procStage === 'QC_INSPECTION' || procStage === 'NCR_REPORT'
        ? ['QA/QC Inspector', 'Factory Manager', 'Project Factory Engineer']
        : ['Procurement Officer', 'Factory Manager', 'Project Factory Engineer'];

    const slaRes = await approvalSlaAlertService.createSlaRecord(currentUser, {
      linkedRecordId: saved.docCode,
      recordTitle: `${procStage} Approval Required: ${procTitle.trim()} (${saved.docCode})`,
      recordDescription: `${procItemSummary} — Qty: ${procQty} ${procUnit}. ${procRemarks}`,
      category: slaCat,
      factoryId: activeFac?.id || 'fac-inv-01',
      factoryName: activeFac?.name || 'Innovista Colombo Plant',
      projectId: activeWp?.projectId || 'PRJ-2026-001',
      projectName: activeWp?.projectName || 'Sirius Mall Storefront',
      assignedRoles,
      slaDurationMinutes: procSlaMins,
      customDeadlineIso: procCustomDeadline || undefined,
      priority:
        procStage === 'QC_INSPECTION' || procStage === 'NCR_REPORT' ? 'Critical' : 'High',
      syncToGoogleCalendar: procSyncCalendar
    });

    setShowProcModal(false);
    setProcTitle('');
    setProcCustomDeadline('');
    setLocalTick(t => t + 1);
    onRefresh();
    toast.success(
      slaRes.calendarSynced
        ? `Saved ${procStage} (${saved.docCode}) with ${procSlaMins}m Approval SLA & synced to Google Calendar!`
        : `Saved ${procStage} (${saved.docCode}) with ${procSlaMins}m Approval SLA (${slaRes.record.referenceCode})`
    );
  };

  const handleCreateNextProcStage = (
    source: FactoryProcurementRecord,
    nextStage: FactoryProcurementStageType
  ) => {
    const stageTitles: Record<FactoryProcurementStageType, string> = {
      RQ: `Requisition — ${source.title}`,
      QUOTATION: `Vendor Quotation for ${source.docCode}`,
      PO: `Purchase Order against ${source.docCode}`,
      GRN: `Goods Received Note (GRN) for ${source.docCode}`,
      QC_INSPECTION: `Incoming QC Inspection for ${source.docCode}`,
      NCR_REPORT: `NCR Non-Conformance Report against ${source.docCode}`,
      RETURN: `Vendor Return & Debit Note for ${source.docCode}`
    };
    const created = factoryExecutionService.saveFactoryProcurementRecord(currentUser, {
      stageType: nextStage,
      factoryId: source.factoryId,
      projectId: source.projectId,
      projectName: source.projectName,
      workPackageId: source.workPackageId,
      supplierOrPartnerName: source.supplierOrPartnerName,
      linkedRefCode: source.docCode,
      title: stageTitles[nextStage],
      itemSummary: source.itemSummary,
      quantity: nextStage === 'NCR_REPORT' || nextStage === 'RETURN' ? Math.max(1, source.rejectedQty || 2) : source.quantity,
      acceptedQty: nextStage === 'NCR_REPORT' || nextStage === 'RETURN' ? 0 : source.acceptedQty,
      rejectedQty: nextStage === 'NCR_REPORT' || nextStage === 'RETURN' ? Math.max(1, source.rejectedQty || 2) : source.rejectedQty,
      unit: source.unit,
      unitRate: source.unitRate,
      remarks: `Generated from ${source.docCode} (${source.stageType}) under ${source.projectName}`
    });
    setLocalTick(t => t + 1);
    onRefresh();
    toast.success(`Created ${created.docCode} (${nextStage}) linked to ${source.docCode}`);
  };

  // --- 3. HR & Payroll Modal State (Owned Factories Direct Management) ---
  const [showHrModal, setShowHrModal] = useState(false);
  const [editingHr, setEditingHr] = useState<FactoryHrPayrollRecord | null>(null);
  const [hrEmpName, setHrEmpName] = useState(hrEmployees[0]?.fullName || 'Eng. Nuwan Perera');
  const [hrRoleTrade, setHrRoleTrade] = useState('Project Factory Engineer');
  const [hrDept, setHrDept] = useState('Factory Production & Engineering');
  const [hrPeriod, setHrPeriod] = useState('2026-09');
  const [hrDays, setHrDays] = useState(26);
  const [hrOtHours, setHrOtHours] = useState(16);
  const [hrBasic, setHrBasic] = useState(165000);
  const [hrAllowance, setHrAllowance] = useState(30000);

  const handleOpenEditHr = (hr: FactoryHrPayrollRecord) => {
    setEditingHr(hr);
    setHrEmpName(hr.employeeName);
    setHrRoleTrade(hr.roleOrTrade);
    setHrDept(hr.department);
    setHrPeriod(hr.payPeriod);
    setHrDays(hr.daysWorked);
    setHrOtHours(hr.overtimeHours);
    setHrBasic(hr.basicSalary);
    setHrAllowance(hr.projectAllowance);
    setShowHrModal(true);
  };

  const handleSaveHrPayroll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hrEmpName.trim()) return;
    factoryExecutionService.saveFactoryHrPayrollRecord(currentUser, {
      id: editingHr?.id,
      payrollCode: editingHr?.payrollCode,
      factoryId: activeFac?.id || 'fac-inv-01',
      projectId: activeWp?.projectId || 'PRJ-2026-001',
      projectName: activeWp?.projectName || 'Sirius Mall Storefront',
      workPackageId: activeWp?.id || 'fwp-01',
      employeeName: hrEmpName.trim(),
      roleOrTrade: hrRoleTrade,
      department: hrDept,
      payPeriod: hrPeriod,
      daysWorked: hrDays,
      overtimeHours: hrOtHours,
      basicSalary: hrBasic,
      projectAllowance: hrAllowance
    });
    setEditingHr(null);
    setShowHrModal(false);
    setLocalTick(t => t + 1);
    onRefresh();
    toast.success(`Saved Factory HR & Payroll record for ${hrEmpName}`);
  };

  // --- 4. Finance, Invoices, Accounting & Contracts Modal State ---
  const [showFinModal, setShowFinModal] = useState(false);
  const [editingFin, setEditingFin] = useState<FactoryFinanceAccountingRecord | null>(null);
  const [finCat, setFinCat] = useState<FactoryFinanceRecordCategory>('INVOICE');
  const [finSubType, setFinSubType] = useState('Progress / Milestone Invoice');
  const [finTitle, setFinTitle] = useState('');
  const [finCounterparty, setFinCounterparty] = useState(activeFac?.name || 'Alumex Extrusions PLC');
  const [finRefCode, setFinRefCode] = useState(activeWp?.packageCode || 'FWP-2026-001');
  const [finGross, setFinGross] = useState(2500000);
  const [finTax, setFinTax] = useState(450000);
  const [finRetention, setFinRetention] = useState(250000);
  const [finDesc, setFinDesc] = useState('Project & Factory verified financial record.');

  const handleOpenEditFin = (fn: FactoryFinanceAccountingRecord) => {
    setEditingFin(fn);
    setFinCat(fn.recordCategory);
    setFinSubType(fn.subType);
    setFinTitle(fn.title);
    setFinCounterparty(fn.counterpartyName);
    setFinRefCode(fn.referenceDocCode);
    setFinGross(fn.grossAmount);
    setFinTax(fn.taxOrVatAmount);
    setFinRetention(fn.retentionOrDeductionAmount);
    setFinDesc(fn.description);
    setShowFinModal(true);
  };

  const handleSaveFinanceRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!finTitle.trim()) return;
    factoryExecutionService.saveFactoryFinanceRecord(currentUser, {
      id: editingFin?.id,
      recordCode: editingFin?.recordCode,
      recordCategory: finCat,
      subType: finSubType,
      factoryId: activeFac?.id || 'fac-inv-01',
      projectId: activeWp?.projectId || 'PRJ-2026-001',
      projectName: activeWp?.projectName || 'Sirius Mall Storefront',
      workPackageId: activeWp?.id || 'fwp-01',
      counterpartyName: finCounterparty,
      referenceDocCode: finRefCode,
      title: finTitle.trim(),
      description: finDesc,
      grossAmount: finGross,
      taxOrVatAmount: finTax,
      retentionOrDeductionAmount: finRetention,
      netAmount: finGross + finTax - finRetention
    });
    setEditingFin(null);
    setShowFinModal(false);
    setFinTitle('');
    setLocalTick(t => t + 1);
    onRefresh();
    toast.success(`Saved ${finCat.replace('_', ' ')} for ${activeFac?.name}`);
  };

  return (
    <div className="space-y-4">
      {/* Context Scope Banner: Only Factory-Related & Project-Related Info */}
      <div className="bg-white rounded-xl border border-slate-200/80 px-4 py-2.5 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-lg bg-orange-50 text-orange-700 font-bold border border-orange-200">
            {activeFac?.factoryCode || 'FAC'} · {activeFac?.name || 'All Authorized Factories'}
          </span>
          <span
            className={`px-2.5 py-1 rounded-lg font-bold border ${
              isOwnedFactory
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-indigo-50 text-indigo-700 border-indigo-200'
            }`}
          >
            {activeFac?.ownershipType || 'Factory'}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 font-bold border border-sky-200">
            Project: {activeWp?.projectName || effectiveProjectId}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowTestModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-lg text-xs font-bold shadow-2xs transition-all cursor-pointer"
            title="Run Integration Test across Procurement, Supervising Team, HR & Payroll, Finance, and Logs for this factory"
          >
            <Play size={12} className="fill-white" />
            <span>Test Portals Connection</span>
          </button>
        </div>
      </div>

      {/* =====================================================================
          MODE 1: SUPERVISING TEAM & ROLE AUTHORITY (ENGINEERS, QC, FM, ETC.)
         ===================================================================== */}
      {mode === 'erp_supervisors' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-orange-500" />
                <div>
                  <h2 className="text-xs font-bold text-slate-900">
                    Assigned Factory & Project Supervising Team ({supervisorList.length})
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Engineers, QC Inspectors, Supervisors, Procurement, HR & Finance Officers assigned with individual Factory Manager authority
                  </p>
                </div>
              </div>
              {canManageSupervisors && (
                <button
                  onClick={() => setShowSupModal(true)}
                  className="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Assign Supervisor / Engineer / QC
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-semibold text-slate-400">
                    <th className="py-2.5 px-4">Code</th>
                    <th className="py-2.5 px-4">Person & Account</th>
                    <th className="py-2.5 px-4">Supervising Role</th>
                    <th className="py-2.5 px-4">Project & Factory</th>
                    <th className="py-2.5 px-4">Individual Authority</th>
                    <th className="py-2.5 px-4">Module Access</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {supervisorList.map(sa => (
                    <tr key={sa.id} className="hover:bg-slate-50/70 transition-colors whitespace-nowrap">
                      <td className="py-2.5 px-4 font-mono font-bold text-orange-600 whitespace-nowrap">
                        {sa.assignmentCode}
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <span className="font-bold text-slate-900">{sa.fullName}</span>
                        <span className="text-[10px] text-slate-400 font-mono ml-1.5">@{sa.username}</span>
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">
                          {sa.supervisingRole}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <span className="font-semibold text-slate-800">{sa.projectName}</span>
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        {sa.hasFactoryManagerAuthority ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold inline-flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            Factory Manager
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold">
                            Supervisor
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">
                          {Object.values(sa.permissions || {}).filter(Boolean).length} Modules
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          {users.some(u => u.id === sa.userId) && (
                            <button
                              type="button"
                              onClick={() => {
                                switchUser(sa.userId);
                                toast.success(
                                  `Switched session to ${sa.fullName}`
                                );
                                onRefresh();
                              }}
                              className="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-[11px] font-semibold"
                            >
                              Switch
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleOpenEditSup(sa)}
                            className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-[11px] font-semibold inline-flex items-center gap-1"
                          >
                            <Edit3 className="w-3 h-3 text-sky-600" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setDocSpec(buildSupervisorAssignmentDocSpec(sa))}
                            className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-[11px] font-semibold inline-flex items-center gap-1"
                          >
                            <Printer className="w-3 h-3" />
                            Charter
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (!confirm(`Delete supervising assignment ${sa.assignmentCode} (${sa.fullName})?`)) return;
                              factoryExecutionService.deleteSupervisorAssignment(currentUser, sa.id);
                              setLocalTick(t => t + 1);
                              onRefresh();
                              toast.success('Removed assignment');
                            }}
                            className="p-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODE 2: PROCUREMENT CHAIN (RQ, QUOTATION, PO, GRN, QC, NCR, RETURN)
         ===================================================================== */}
      {mode === 'erp_procurement' && (
        <div className="space-y-4">
          {/* 7-Stage Pipeline Bar */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-2xs flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {PROCUREMENT_STAGES.map(st => {
                const active = procStageFilter === st.id;
                const count =
                  st.id === 'ALL'
                    ? factoryExecutionService.getFactoryProcurementRecords(
                        effectiveFactoryId,
                        effectiveProjectId,
                        'ALL'
                      ).length
                    : factoryExecutionService.getFactoryProcurementRecords(
                        effectiveFactoryId,
                        effectiveProjectId,
                        st.id
                      ).length;
                return (
                  <button
                    key={st.id}
                    onClick={() => setProcStageFilter(st.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      active
                        ? 'bg-orange-500 text-white shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <span>{st.shortLabel}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        active ? 'bg-white/20 text-white' : 'bg-white text-slate-700'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {canManageProcurement && (
              <button
                onClick={() => {
                  if (procStageFilter !== 'ALL') setProcStage(procStageFilter);
                  setShowProcModal(true);
                }}
                className="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                New Procurement Record
              </button>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-semibold text-slate-400">
                    <th className="py-2.5 px-4">Doc Code</th>
                    <th className="py-2.5 px-4">Stage</th>
                    <th className="py-2.5 px-4">Title & Item Scope</th>
                    <th className="py-2.5 px-4">Supplier / Partner</th>
                    <th className="py-2.5 px-4 text-right">Qty (Acc / Rej)</th>
                    <th className="py-2.5 px-4 text-right">Total (LKR)</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Chain Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {procurementList.map(pr => (
                    <tr key={pr.id} className="hover:bg-slate-50/70 transition-colors whitespace-nowrap">
                      <td className="py-2.5 px-4 font-mono font-bold text-orange-600 whitespace-nowrap">
                        {pr.docCode}
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                            pr.stageType === 'NCR_REPORT' || pr.stageType === 'RETURN'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : pr.stageType === 'QC_INSPECTION'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : pr.stageType === 'GRN'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-sky-50 text-sky-700 border-sky-200'
                          }`}
                        >
                          {pr.stageType}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <span className="font-bold text-slate-900 truncate max-w-[200px] block" title={pr.title}>
                          {pr.title}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <span className="font-semibold text-slate-700 truncate max-w-[150px] block">
                          {pr.supplierOrPartnerName}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono whitespace-nowrap">
                        <span className="font-bold text-slate-900">{pr.quantity} {pr.unit}</span>
                        <span className="text-[10px] text-emerald-600 ml-1">(Acc: {pr.acceptedQty})</span>
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                        {pr.totalAmount.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold">
                          {pr.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditProc(pr)}
                            className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold inline-flex items-center gap-1"
                          >
                            <Edit3 className="w-3 h-3 text-sky-600" /> Edit
                          </button>
                          {pr.stageType === 'RQ' && (
                            <button
                              onClick={() => handleCreateNextProcStage(pr, 'QUOTATION')}
                              className="px-2 py-1 rounded bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 text-[11px] font-semibold inline-flex items-center gap-1"
                            >
                              <ArrowRight className="w-3 h-3" /> Quote
                            </button>
                          )}
                          {pr.stageType === 'QUOTATION' && (
                            <button
                              onClick={() => handleCreateNextProcStage(pr, 'PO')}
                              className="px-2 py-1 rounded bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-[11px] font-semibold inline-flex items-center gap-1"
                            >
                              <ArrowRight className="w-3 h-3" /> Issue PO
                            </button>
                          )}
                          {pr.stageType === 'PO' && (
                            <button
                              onClick={() => handleCreateNextProcStage(pr, 'GRN')}
                              className="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-[11px] font-semibold inline-flex items-center gap-1"
                            >
                              <ArrowRight className="w-3 h-3" /> GRN
                            </button>
                          )}
                          {pr.stageType === 'GRN' && (
                            <button
                              onClick={() => handleCreateNextProcStage(pr, 'QC_INSPECTION')}
                              className="px-2 py-1 rounded bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 text-[11px] font-semibold inline-flex items-center gap-1"
                            >
                              <ShieldCheck className="w-3 h-3" /> QC
                            </button>
                          )}
                          {pr.stageType === 'QC_INSPECTION' && (
                            <button
                              onClick={() => handleCreateNextProcStage(pr, 'NCR_REPORT')}
                              className="px-2 py-1 rounded bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 text-[11px] font-semibold inline-flex items-center gap-1"
                            >
                              <AlertTriangle className="w-3 h-3" /> NCR
                            </button>
                          )}
                          {pr.stageType === 'NCR_REPORT' && (
                            <button
                              onClick={() => handleCreateNextProcStage(pr, 'RETURN')}
                              className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-[11px] font-semibold inline-flex items-center gap-1"
                            >
                              <RotateCcw className="w-3 h-3" /> Return
                            </button>
                          )}
                          <button
                            onClick={() => setDocSpec(buildFactoryProcurementDocSpec(pr))}
                            className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-[11px] font-semibold inline-flex items-center gap-1"
                          >
                            <Printer className="w-3 h-3" /> Doc
                          </button>
                          <button
                            onClick={() => {
                              if (!confirm(`Delete procurement record ${pr.docCode}?`)) return;
                              factoryExecutionService.deleteFactoryProcurementRecord(currentUser, pr.id);
                              setLocalTick(t => t + 1);
                              onRefresh();
                              toast.success('Record Deleted');
                            }}
                            className="p-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODE 3: OWNED FACTORY DIRECT HR & PAYROLL MANAGEMENT
         ===================================================================== */}
      {mode === 'erp_hr_payroll' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-orange-500" />
                <div>
                  <h2 className="text-xs font-bold text-slate-900">
                    Factory HR, Attendance & Project Payroll ({hrPayrollList.length})
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Direct HR & Payroll management scoped to {activeFac?.name} and Project {activeWp?.projectName}
                  </p>
                </div>
              </div>
              {canManageHr && (
                <button
                  onClick={() => setShowHrModal(true)}
                  className="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Factory Payroll Entry
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-semibold text-slate-400">
                    <th className="py-2.5 px-4">Payroll Code</th>
                    <th className="py-2.5 px-4">Employee & Role</th>
                    <th className="py-2.5 px-4">Period & Attendance</th>
                    <th className="py-2.5 px-4 text-right">Basic (LKR)</th>
                    <th className="py-2.5 px-4 text-right">Overtime + Allow.</th>
                    <th className="py-2.5 px-4 text-right">EPF/ETF Ded.</th>
                    <th className="py-2.5 px-4 text-right">Net Pay (LKR)</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {hrPayrollList.map(hr => (
                    <tr key={hr.id} className="hover:bg-slate-50/70 transition-colors whitespace-nowrap">
                      <td className="py-2.5 px-4 font-mono font-bold text-orange-600 whitespace-nowrap">
                        {hr.payrollCode}
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <span className="font-bold text-slate-900">{hr.employeeName}</span>
                        <span className="text-[10px] text-slate-400 ml-1.5">({hr.roleOrTrade})</span>
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <span className="font-semibold text-slate-800">{hr.payPeriod}</span>
                        <span className="text-[10px] text-slate-500 ml-1.5">({hr.daysWorked}d · OT: {hr.overtimeHours}h)</span>
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-slate-700 whitespace-nowrap">
                        {hr.basicSalary.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-emerald-700 whitespace-nowrap">
                        +{(hr.overtimePay + hr.projectAllowance).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-rose-600 whitespace-nowrap">
                        -{hr.epfEtfDeduction.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-extrabold text-slate-900 whitespace-nowrap">
                        {hr.netPay.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            hr.status === 'Paid' || hr.status === 'Approved'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {hr.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditHr(hr)}
                            className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold inline-flex items-center gap-1"
                          >
                            <Edit3 className="w-3 h-3 text-sky-600" /> Edit
                          </button>
                          {hr.status !== 'Approved' && hr.status !== 'Paid' && (
                            <button
                              onClick={() => {
                                factoryExecutionService.updateFactoryHrPayrollStatus(
                                  currentUser,
                                  hr.id,
                                  'Approved'
                                );
                                setLocalTick(t => t + 1);
                                onRefresh();
                                toast.success(`Approved Payroll ${hr.payrollCode}`);
                              }}
                              className="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-[11px] font-semibold"
                            >
                              Approve
                            </button>
                          )}
                          {hr.status === 'Approved' && (
                            <button
                              onClick={() => {
                                factoryExecutionService.updateFactoryHrPayrollStatus(
                                  currentUser,
                                  hr.id,
                                  'Paid'
                                );
                                setLocalTick(t => t + 1);
                                onRefresh();
                                toast.success(`Marked Paid: ${hr.payrollCode}`);
                              }}
                              className="px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold"
                            >
                              Pay
                            </button>
                          )}
                          <button
                            onClick={() => setDocSpec(buildFactoryHrPayrollDocSpec(hr))}
                            className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-[11px] font-semibold inline-flex items-center gap-1"
                          >
                            <Printer className="w-3 h-3" /> Slip
                          </button>
                          <button
                            onClick={() => {
                              if (!confirm(`Delete payroll record ${hr.payrollCode}?`)) return;
                              factoryExecutionService.deleteFactoryHrPayrollRecord(currentUser, hr.id);
                              setLocalTick(t => t + 1);
                              onRefresh();
                              toast.success('Record Deleted');
                            }}
                            className="p-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODE 4: FINANCE, INVOICES, ACCOUNTING & CONTRACTS/AGREEMENTS
         ===================================================================== */}
      {mode === 'erp_finance_contracts' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-2xs flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  { id: 'ALL', label: 'All Finance & Contracts', icon: Landmark },
                  { id: 'CONTRACT_AGREEMENT', label: 'Contracts & Agreements', icon: FileSignature },
                  { id: 'INVOICE', label: 'Invoices & Claims', icon: Receipt },
                  { id: 'ACCOUNTING_ENTRY', label: 'Accounting & Project WIP Ledger', icon: BookOpen }
                ] as const
              ).map(tab => {
                const Icon = tab.icon;
                const active = financeCatFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setFinanceCatFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      active
                        ? 'bg-orange-500 text-white shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {canManageFinance && (
              <button
                onClick={() => {
                  if (financeCatFilter !== 'ALL') setFinCat(financeCatFilter);
                  setShowFinModal(true);
                }}
                className="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                New Invoice / Contract / Entry
              </button>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-semibold text-slate-400">
                    <th className="py-2.5 px-4">Code</th>
                    <th className="py-2.5 px-4">Type</th>
                    <th className="py-2.5 px-4">Title & Scope</th>
                    <th className="py-2.5 px-4">Counterparty & Ref</th>
                    <th className="py-2.5 px-4 text-right">Gross (LKR)</th>
                    <th className="py-2.5 px-4 text-right">Tax / Ret.</th>
                    <th className="py-2.5 px-4 text-right">Net Amount (LKR)</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {financeList.map(fn => (
                    <tr key={fn.id} className="hover:bg-slate-50/70 transition-colors whitespace-nowrap">
                      <td className="py-2.5 px-4 font-mono font-bold text-orange-600 whitespace-nowrap">
                        {fn.recordCode}
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                            fn.recordCategory === 'CONTRACT_AGREEMENT'
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                              : fn.recordCategory === 'INVOICE'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {fn.recordCategory.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <span className="font-bold text-slate-900 truncate max-w-[200px] block" title={fn.title}>
                          {fn.title}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <span className="font-semibold text-slate-800 truncate max-w-[150px] block">
                          {fn.counterpartyName}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-slate-700 whitespace-nowrap">
                        {fn.grossAmount.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-[10px] whitespace-nowrap">
                        <span className="text-sky-700">+{fn.taxOrVatAmount.toLocaleString()}</span>
                        <span className="text-rose-600 ml-1">-{fn.retentionOrDeductionAmount.toLocaleString()}</span>
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-extrabold text-slate-900 whitespace-nowrap">
                        {fn.netAmount.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold">
                          {fn.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditFin(fn)}
                            className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold inline-flex items-center gap-1"
                          >
                            <Edit3 className="w-3 h-3 text-sky-600" /> Edit
                          </button>
                          {fn.status !== 'Approved' && fn.status !== 'Paid' && fn.status !== 'Active Agreement' && (
                            <button
                              onClick={() => {
                                factoryExecutionService.updateFactoryFinanceStatus(
                                  currentUser,
                                  fn.id,
                                  'Approved'
                                );
                                setLocalTick(t => t + 1);
                                onRefresh();
                                toast.success(`Approved ${fn.recordCode}`);
                              }}
                              className="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-[11px] font-semibold"
                            >
                              Approve
                            </button>
                          )}
                          {fn.recordCategory === 'INVOICE' && fn.status !== 'Paid' && (
                            <button
                              onClick={() => {
                                factoryExecutionService.updateFactoryFinanceStatus(
                                  currentUser,
                                  fn.id,
                                  'Paid'
                                );
                                setLocalTick(t => t + 1);
                                onRefresh();
                                toast.success(`Marked Invoice Paid: ${fn.recordCode}`);
                              }}
                              className="px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold"
                            >
                              Pay
                            </button>
                          )}
                          <button
                            onClick={() => setDocSpec(buildFactoryFinanceDocSpec(fn))}
                            className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-[11px] font-semibold inline-flex items-center gap-1"
                          >
                            <Printer className="w-3 h-3" /> Doc
                          </button>
                          <button
                            onClick={() => {
                              if (!confirm(`Delete finance record ${fn.recordCode}?`)) return;
                              factoryExecutionService.deleteFactoryFinanceRecord(currentUser, fn.id);
                              setLocalTick(t => t + 1);
                              onRefresh();
                              toast.success('Record Deleted');
                            }}
                            className="p-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Quotation-Format Document Generator Modal */}
      {docSpec && (
        <FactoryQuotationDocumentModal
          spec={docSpec}
          currentUser={currentUser}
          onClose={() => setDocSpec(null)}
          onRefresh={() => {
            setLocalTick(t => t + 1);
            onRefresh();
          }}
        />
      )}

      {/* Full-Screen Modal 1: Assign Engineer / QC Inspector / Supervisor to Factory & Project */}
      {showSupModal &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 bg-white z-[9998] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {editingSup ? `Edit Supervising Assignment (${editingSup.assignmentCode})` : 'Assign Engineer, QC Inspector or Supervisor'}
                </h3>
                <p className="text-xs text-slate-500">
                  Factory: {activeFac?.name} ({activeFac?.ownershipType}) · Project: {activeWp?.projectName}
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingSup(null);
                  setShowSupModal(false);
                }}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold inline-flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" /> Close
              </button>
            </div>
            <form onSubmit={handleSaveSupervisor} className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Select System User Account
                  </label>
                  <select
                    value={supUserId}
                    onChange={e => handleSelectPresetUser(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50"
                  >
                    {users.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} (@{u.username} — {u.roleName})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Supervising Role on Factory & Project
                  </label>
                  <select
                    value={supRoleType}
                    onChange={e => setSupRoleType(e.target.value as FactorySupervisingRoleType)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50"
                  >
                    {SUPERVISING_ROLES.map(r => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Officer Full Name</label>
                  <input
                    type="text"
                    value={supFullName}
                    onChange={e => setSupFullName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={supEmail}
                    onChange={e => setSupEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={supFmAuth}
                    onChange={e => setSupFmAuth(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600"
                  />
                  <span className="text-xs font-bold text-emerald-950">
                    Grant Full Individual Authority & Access as a Factory Manager for this Factory & Project
                  </span>
                </label>
                <p className="text-[11px] text-emerald-800 pl-6">
                  When enabled, this Engineer, QC Inspector, or Officer can execute 1st-step QC checklist sign-offs, upload mandatory task evidences, manage work orders, and supervise factory operations individually as a Factory Manager.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="text-xs font-bold text-slate-800">Granular Module Permissions</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={supPermTasks}
                      onChange={e => setSupPermTasks(e.target.checked)}
                    />
                    <span>Tasks, Sub-Tasks & Checklists</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={supPermQc}
                      onChange={e => setSupPermQc(e.target.checked)}
                    />
                    <span>QC Inspections & NCR Reports</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={supPermProc}
                      onChange={e => setSupPermProc(e.target.checked)}
                    />
                    <span>Procurement (RQ, PO, GRN, Return)</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={supPermHr}
                      onChange={e => setSupPermHr(e.target.checked)}
                    />
                    <span>HR, Workforce & Payroll</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={supPermFin}
                      onChange={e => setSupPermFin(e.target.checked)}
                    />
                    <span>Finance, Accounting & Invoices</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={supPermCnt}
                      onChange={e => setSupPermCnt(e.target.checked)}
                    />
                    <span>Contracts & Agreements</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditingSup(null);
                    setShowSupModal(false);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold"
                >
                  {editingSup ? 'Update Assignment' : 'Save Assignment & Grant Authority'}
                </button>
              </div>
            </form>
          </div>,
          document.body
        )}

      {/* Full-Screen Modal 2: New Procurement Record (RQ, Quotation, PO, GRN, QC, NCR, Return) */}
      {showProcModal &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 bg-white z-[9998] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {editingProc ? `Edit Procurement Record (${editingProc.docCode})` : `New Procurement Record (${procStage})`}
                </h3>
                <p className="text-xs text-slate-500">
                  Factory: {activeFac?.name} · Project: {activeWp?.projectName}
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingProc(null);
                  setShowProcModal(false);
                }}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold inline-flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" /> Close
              </button>
            </div>
            <form onSubmit={handleSaveProcurement} className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Procurement Stage</label>
                  <select
                    value={procStage}
                    onChange={e => setProcStage(e.target.value as FactoryProcurementStageType)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 font-semibold"
                  >
                    <option value="RQ">RQ — Material Requisition</option>
                    <option value="QUOTATION">QUOTATION — Supplier / Partner Quotation</option>
                    <option value="PO">PO — Purchase / Subcontract Order</option>
                    <option value="GRN">GRN — Goods Received Note</option>
                    <option value="QC_INSPECTION">QC_INSPECTION — Incoming QC Check</option>
                    <option value="NCR_REPORT">NCR_REPORT — Non-Conformance Report</option>
                    <option value="RETURN">RETURN — Material Return / Debit Note</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Supplier / Partner Name</label>
                  <input
                    type="text"
                    value={procSupplier}
                    onChange={e => setProcSupplier(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Linked Reference Code</label>
                  <input
                    type="text"
                    value={procLinkedRef}
                    onChange={e => setProcLinkedRef(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Document Title</label>
                  <input
                    type="text"
                    value={procTitle}
                    onChange={e => setProcTitle(e.target.value)}
                    placeholder="e.g., 6063-T6 Mullion Profiles / DGU Glass Panels"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Item Specification Summary</label>
                  <input
                    type="text"
                    value={procItemSummary}
                    onChange={e => setProcItemSummary(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Total Qty</label>
                  <input
                    type="number"
                    value={procQty}
                    onChange={e => {
                      const v = Number(e.target.value) || 0;
                      setProcQty(v);
                      setProcAcceptedQty(Math.max(0, v - procRejectedQty));
                    }}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Accepted Qty</label>
                  <input
                    type="number"
                    value={procAcceptedQty}
                    onChange={e => setProcAcceptedQty(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Rejected Qty</label>
                  <input
                    type="number"
                    value={procRejectedQty}
                    onChange={e => setProcRejectedQty(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Unit</label>
                  <input
                    type="text"
                    value={procUnit}
                    onChange={e => setProcUnit(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Unit Rate (LKR)</label>
                  <input
                    type="number"
                    value={procRate}
                    onChange={e => setProcRate(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Inspection / Procurement Remarks</label>
                <textarea
                  rows={2}
                  value={procRemarks}
                  onChange={e => setProcRemarks(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                />
              </div>

              {/* Mandatory Approval SLA Deadline & Google Calendar Sync */}
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                    <AlarmClock className="w-4 h-4 text-amber-600" />
                    Mandatory Approval SLA Window & Google Calendar Reminder
                    {procStage === 'QC_INSPECTION' && (
                      <span className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-black">
                        QC Inspection Approval Priority
                      </span>
                    )}
                  </span>
                  <span className="text-[11px] text-amber-800 font-medium">
                    Triggers persistent alerts after deadline until approved or snoozed
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-amber-900 mb-1">
                      Required Approval Deadline Window:
                    </label>
                    <select
                      value={procSlaMins}
                      onChange={e => setProcSlaMins(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-amber-300 rounded-xl bg-white font-semibold"
                    >
                      <option value={15}>15 Minutes (Immediate QC / Shopfloor Hold)</option>
                      <option value={30}>30 Minutes (Rapid QC Inspection Sign-Off)</option>
                      <option value={60}>1 Hour (Standard QC / PO Approval)</option>
                      <option value={120}>2 Hours (Engineering / QC Manager Sign-Off)</option>
                      <option value={240}>4 Hours (Same Shift SLA)</option>
                      <option value={1440}>24 Hours (1 Working Day)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-amber-900 mb-1">
                      Or Specific Deadline Date & Time:
                    </label>
                    <input
                      type="datetime-local"
                      value={procCustomDeadline}
                      onChange={e => setProcCustomDeadline(e.target.value)}
                      className="w-full px-3 py-2 border border-amber-300 rounded-xl bg-white"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <label className="flex items-center gap-2 text-xs font-bold text-indigo-950 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={procSyncCalendar}
                      onChange={e => setProcSyncCalendar(e.target.checked)}
                    />
                    <span>Sync Approval Deadline & Snooze Reminders with Google Calendar</span>
                  </label>
                  <GoogleWorkspaceSignInButton compact />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditingProc(null);
                    setShowProcModal(false);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold"
                >
                  {editingProc ? 'Update Procurement Record' : `Save ${procStage} Record`}
                </button>
              </div>
            </form>
          </div>,
          document.body
        )}

      {/* Full-Screen Modal 3: Owned Factory HR & Payroll Entry */}
      {showHrModal &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 bg-white z-[9998] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {editingHr ? `Edit Factory Payroll Record (${editingHr.payrollCode})` : 'Add Factory HR & Project Payroll Record'}
                </h3>
                <p className="text-xs text-slate-500">
                  Factory: {activeFac?.name} · Project: {activeWp?.projectName}
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingHr(null);
                  setShowHrModal(false);
                }}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold inline-flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" /> Close
              </button>
            </div>
            <form onSubmit={handleSaveHrPayroll} className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Employee Name</label>
                  <input
                    type="text"
                    value={hrEmpName}
                    onChange={e => setHrEmpName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Role / Trade</label>
                  <input
                    type="text"
                    value={hrRoleTrade}
                    onChange={e => setHrRoleTrade(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Pay Period</label>
                  <input
                    type="text"
                    value={hrPeriod}
                    onChange={e => setHrPeriod(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Days Worked</label>
                  <input
                    type="number"
                    value={hrDays}
                    onChange={e => setHrDays(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Overtime Hours</label>
                  <input
                    type="number"
                    value={hrOtHours}
                    onChange={e => setHrOtHours(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Basic Salary (LKR)</label>
                  <input
                    type="number"
                    value={hrBasic}
                    onChange={e => setHrBasic(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Project Allowance (LKR)</label>
                  <input
                    type="number"
                    value={hrAllowance}
                    onChange={e => setHrAllowance(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditingHr(null);
                    setShowHrModal(false);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold"
                >
                  {editingHr ? 'Update Payroll Record' : 'Save Factory Payroll Record'}
                </button>
              </div>
            </form>
          </div>,
          document.body
        )}

      {/* Full-Screen Modal 4: Finance, Invoice, Accounting & Contract Entry */}
      {showFinModal &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 bg-white z-[9998] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {editingFin ? `Edit Finance & Contract Record (${editingFin.recordCode})` : 'New Factory Finance & Contract Record'}
                </h3>
                <p className="text-xs text-slate-500">
                  Factory: {activeFac?.name} · Project: {activeWp?.projectName}
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingFin(null);
                  setShowFinModal(false);
                }}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold inline-flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" /> Close
              </button>
            </div>
            <form onSubmit={handleSaveFinanceRecord} className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Record Category</label>
                  <select
                    value={finCat}
                    onChange={e => setFinCat(e.target.value as FactoryFinanceRecordCategory)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 font-semibold"
                  >
                    <option value="INVOICE">INVOICE — Progress / Supplier / Subcontract Invoice</option>
                    <option value="CONTRACT_AGREEMENT">CONTRACT_AGREEMENT — Contract / SLA Agreement</option>
                    <option value="ACCOUNTING_ENTRY">ACCOUNTING_ENTRY — Project WIP / Ledger Posting</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Sub-Type</label>
                  <input
                    type="text"
                    value={finSubType}
                    onChange={e => setFinSubType(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Counterparty / Partner</label>
                  <input
                    type="text"
                    value={finCounterparty}
                    onChange={e => setFinCounterparty(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={finTitle}
                    onChange={e => setFinTitle(e.target.value)}
                    placeholder="e.g., Interim Subcontract Claim #02 / Supplier Invoice"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Linked PO / GRN / Contract Ref</label>
                  <input
                    type="text"
                    value={finRefCode}
                    onChange={e => setFinRefCode(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Gross Amount (LKR)</label>
                  <input
                    type="number"
                    value={finGross}
                    onChange={e => setFinGross(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tax / VAT Amount (LKR)</label>
                  <input
                    type="number"
                    value={finTax}
                    onChange={e => setFinTax(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Retention / Deduction (LKR)</label>
                  <input
                    type="number"
                    value={finRetention}
                    onChange={e => setFinRetention(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description & Terms</label>
                <textarea
                  rows={2}
                  value={finDesc}
                  onChange={e => setFinDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditingFin(null);
                    setShowFinModal(false);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold"
                >
                  {editingFin ? 'Update Record' : 'Save Financial Record'}
                </button>
              </div>
            </form>
          </div>,
          document.body
        )}

      {/* Integration Test Runner Modal */}
      <FactoryPortalIntegrationTestModal
        isOpen={showTestModal}
        onClose={() => setShowTestModal(false)}
        factory={activeFac || null}
        workPackage={activeWp || null}
        currentUser={currentUser}
        onRefresh={() => {
          setLocalTick(t => t + 1);
          onRefresh();
        }}
      />
    </div>
  );
};
