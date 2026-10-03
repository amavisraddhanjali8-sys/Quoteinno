import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  MapPin,
  Briefcase,
  Building2,
  ArrowUpRight,
  Printer
} from 'lucide-react';
import { FactoryQuotationDocumentModal, FactoryRecordDocumentSpec } from './FactoryQuotationDocumentModal';
import { buildFactoryProfileDocSpec } from './factoryDocumentBuilders';
import {
  FactoryMasterProfile,
  FactoryOwnershipType,
  FactoryFacilityType,
  FactoryCapabilityCode,
  FactoryWorkPackageAssignment,
  FactoryExecutionTask
} from '../../types/factoryPortal';
import { Project } from '../../types';
import { SecurityUser } from '../../types/security';
import { factoryExecutionService } from '../../services/factoryExecutionService';
import { toast } from 'sonner';

interface FactoryMasterRegistryTabProps {
  currentUser: SecurityUser | null;
  factories: FactoryMasterProfile[];
  workPackages?: FactoryWorkPackageAssignment[];
  tasks?: FactoryExecutionTask[];
  projects?: Project[];
  notificationCounts?: Record<string, number>;
  onRefresh: () => void;
  onSelectFactory?: (factoryId: string, projectId?: string, targetTab?: string) => void;
  onAssignProjectToFactory?: (factoryId: string) => void;
}

const OWNERSHIP_OPTIONS: FactoryOwnershipType[] = [
  'Innovista Owned',
  'Partnered Factory',
  'Contracted Factory',
  'External Supplier',
  'Subcontractor',
  'Strategic Partner',
  'External Fabricator'
];

const FACILITY_TYPES: FactoryFacilityType[] = [
  'Integrated Facade & Curtain Wall Plant',
  'Aluminium Windows & Doors Workshop',
  'Structural Steel & Heavy Welding Factory',
  'Architectural Glass Processing Plant',
  'Powder Coating & Surface Treatment Plant',
  'ACP & Metal Cladding Fabrication Hub',
  'Joinery, Woodwork & Furniture Workshop',
  'Precast & Modular Construction Yard',
  'MEP & Electrical Assembly Workshop',
  'Multi-Discipline Site Workshop'
];

export const FactoryMasterRegistryTab: React.FC<FactoryMasterRegistryTabProps> = ({
  currentUser,
  factories,
  projects = [],
  notificationCounts = {},
  onRefresh,
  onSelectFactory
}) => {
  const [search, setSearch] = useState('');
  const [ownershipFilter, setOwnershipFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeDocSpec, setActiveDocSpec] = useState<FactoryRecordDocumentSpec | null>(null);

  // Direct Assign Project Modal on Factory Card (Advanced Form)
  const [assignFactory, setAssignFactory] = useState<FactoryMasterProfile | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || 'PRJ-2026-001');
  const [wpTitle, setWpTitle] = useState('');
  const [wpContractRef, setWpContractRef] = useState('CNT-FAB-2026-01');
  const [wpPriority, setWpPriority] = useState<'Critical' | 'High' | 'Normal'>('High');
  const [wpQty, setWpQty] = useState(100);
  const [wpUnit, setWpUnit] = useState('Units');
  const [wpBudget, setWpBudget] = useState(15000000);
  const [wpStartDate, setWpStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [wpDeadline, setWpDeadline] = useState('2026-11-30');
  const [wpDrawingPackage, setWpDrawingPackage] = useState('AFC-PKG-2026-REV2');
  const [wpQualityStandard, setWpQualityStandard] = useState('ISO 9001:2015 & BS EN 13830');
  const [wpSpecialInstructions, setWpSpecialInstructions] = useState('Strict dimensional check before powder coating & crating');
  const [initialTaskTitle, setInitialTaskTitle] = useState('');
  const [initialPlanPhase, setInitialPlanPhase] = useState('Shop Drawings & CNC Fabrication');

  // New Factory form state (Advanced Form)
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formOwnership, setFormOwnership] = useState<FactoryOwnershipType>('Innovista Owned');
  const [formFacilityType, setFormFacilityType] = useState<FactoryFacilityType>('Integrated Facade & Curtain Wall Plant');
  const [formCity, setFormCity] = useState('Colombo');
  const [formAddress, setFormAddress] = useState('Phase II, Export Processing Industrial Zone');
  const [formCountry, setFormCountry] = useState('Sri Lanka');
  const [formManager, setFormManager] = useState('');
  const [formChiefEngineer, setFormChiefEngineer] = useState('Eng. Nuwan Perera');
  const [formQaLead, setFormQaLead] = useState('Eng. Dilshan Silva (QA/QC Lead)');
  const [formHseOfficer, setFormHseOfficer] = useState('Roshan Fernando (HSE Officer)');
  const [formPhone, setFormPhone] = useState('+94 11 244 8800');
  const [formEmail, setFormEmail] = useState('factory@innovista.lk');
  const [formMaxUnits, setFormMaxUnits] = useState(1500);
  const [formFloorAreaSqm, setFormFloorAreaSqm] = useState(6500);
  const [formBaysCount, setFormBaysCount] = useState(6);
  const [formShiftsPerDay, setFormShiftsPerDay] = useState(2);
  const [formIsoCerts, setFormIsoCerts] = useState('ISO 9001:2015, ISO 14001, ISO 45001');
  const [formCapabilities] = useState<FactoryCapabilityCode[]>([
    'Aluminium Fabrication',
    'CNC Machining & Milling',
    'Powder Coating & Anodizing'
  ]);

  const filteredFactories = useMemo(() => {
    return factories.filter(f => {
      const matchSearch =
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        f.factoryCode.toLowerCase().includes(search.toLowerCase()) ||
        f.city.toLowerCase().includes(search.toLowerCase());
      const matchOwn = ownershipFilter === 'ALL' || f.ownershipType === ownershipFilter;
      return matchSearch && matchOwn;
    });
  }, [factories, search, ownershipFilter]);

  const linkedProjectObj = useMemo(() => {
    return projects.find(p => p.id === selectedProjectId || p.projectCode === selectedProjectId) || projects[0] || null;
  }, [projects, selectedProjectId]);

  const handleOpenAssignModal = (factory: FactoryMasterProfile) => {
    setAssignFactory(factory);
    const defaultProj = projects[0];
    if (defaultProj) {
      setSelectedProjectId(defaultProj.id);
      setWpTitle(`${defaultProj.projectName} — ${factory.name}`);
    } else {
      setSelectedProjectId('PRJ-2026-001');
      setWpTitle(`Fabrication Package — ${factory.name}`);
    }
    setInitialTaskTitle('CNC Cutting, Machining & Assembly');
    setInitialPlanPhase('Phase 1: Engineering & Fabrication');
  };

  const handleSaveAssignProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignFactory) return;

    const projName = linkedProjectObj?.projectName || selectedProjectId;
    const projCode = linkedProjectObj?.projectCode || selectedProjectId;
    const clientName = linkedProjectObj?.client?.name || 'Enterprise Client';
    const siteAddr = linkedProjectObj?.siteAddress || assignFactory.address;
    const totalVal = wpBudget > 0 ? wpBudget : (linkedProjectObj?.totalValue || 15000000);
    const boqItems = (linkedProjectObj?.items || []).slice(0, 10).map((it, idx) => ({
      id: it.id || `boq-${idx}`,
      code: `BOQ-${idx + 1}`,
      name: it.name,
      category: it.category || 'Fabrication',
      qty: it.qty || 1,
      unit: it.unit || 'Units',
      rate: it.rate || 0,
      amount: it.amount || 0
    }));

    const newWp = factoryExecutionService.saveWorkPackageAssignment(currentUser, {
      factoryId: assignFactory.id,
      projectId: linkedProjectObj?.id || selectedProjectId,
      projectName: projName,
      projectCode: projCode,
      clientName,
      siteAddress: siteAddr,
      projectStartDate: wpStartDate || linkedProjectObj?.startDate || new Date().toISOString().slice(0, 10),
      projectEndDate: wpDeadline,
      projectTotalValue: totalVal,
      linkedBoqItems: boqItems,
      boqReferenceCodes: boqItems.length > 0 ? boqItems.map(b => b.code) : ['BOQ-101'],
      title: wpTitle.trim() || `${projName} — Execution Package`,
      scopeDescription: `Contract Ref: ${wpContractRef} | Priority: ${wpPriority} | Drawing Package: ${wpDrawingPackage} | QC Standard: ${wpQualityStandard} | Instructions: ${wpSpecialInstructions}`,
      plannedQuantity: wpQty,
      unit: wpUnit,
      budgetedValue: totalVal,
      startDate: wpStartDate,
      deadlineDate: wpDeadline,
      executionPlan: [
        {
          id: `plan-${Date.now()}-1`,
          phaseName: initialPlanPhase || 'Shop Drawings & Material Release',
          plannedStart: wpStartDate,
          plannedEnd: wpDeadline,
          owner: assignFactory.chiefEngineerName,
          status: 'Planned'
        },
        {
          id: `plan-${Date.now()}-2`,
          phaseName: 'Fabrication & Assembly',
          plannedStart: wpStartDate,
          plannedEnd: wpDeadline,
          owner: assignFactory.factoryManagerName,
          status: 'Planned'
        },
        {
          id: `plan-${Date.now()}-3`,
          phaseName: 'Quality Inspection & Dispatch',
          plannedStart: wpStartDate,
          plannedEnd: wpDeadline,
          owner: assignFactory.qaLeadName,
          status: 'Planned'
        }
      ]
    });

    if (initialTaskTitle.trim()) {
      factoryExecutionService.saveTask(currentUser, {
        title: initialTaskTitle.trim(),
        factoryId: assignFactory.id,
        projectId: newWp.projectId,
        projectName: newWp.projectName,
        workPackageId: newWp.id,
        plannedQuantity: wpQty,
        unit: wpUnit,
        startDate: wpStartDate,
        targetDate: wpDeadline
      });
    }

    toast.success(`Assigned ${projName} to ${assignFactory.name}`);
    const targetFacId = assignFactory.id;
    const targetPrjId = newWp.projectId;
    setAssignFactory(null);
    onRefresh();
    if (onSelectFactory) {
      onSelectFactory(targetFacId, targetPrjId, 'work_packages');
    }
  };

  const handleSaveFactory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error('Enter factory name');
      return;
    }
    factoryExecutionService.saveFactory(currentUser, {
      name: formName.trim(),
      factoryCode: formCode.trim() || undefined,
      ownershipType: formOwnership,
      facilityType: formFacilityType,
      city: formCity,
      country: formCountry,
      address: `${formAddress} (${formFloorAreaSqm} sqm · ${formBaysCount} Bays · ${formShiftsPerDay} Shifts/Day)`,
      factoryManagerName: formManager || 'Plant Manager',
      chiefEngineerName: formChiefEngineer,
      qaLeadName: formQaLead,
      hseOfficerName: formHseOfficer,
      primaryContactPerson: formManager || 'Plant Manager',
      contactPhone: formPhone,
      contactEmail: formEmail,
      maximumCapacityUnitsPerMonth: formMaxUnits,
      certifications: formIsoCerts
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
        .map(certCode => ({
          code: certCode,
          issuer: 'Accredited Registrar',
          expiryDate: '2028-12-31',
          status: 'Valid' as const
        })),
      capabilities: formCapabilities.length > 0 ? formCapabilities : (['Aluminium Fabrication', 'CNC Machining & Milling'] as FactoryCapabilityCode[])
    });
    toast.success('Advanced Factory Profile Saved');
    setIsModalOpen(false);
    setFormName('');
    setFormCode('');
    onRefresh();
  };

  return (
    <div className="space-y-4">
      {/* Search & Ownership Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 px-4 py-2.5 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-orange-500 shrink-0" />
            <span className="text-xs font-bold text-slate-800 whitespace-nowrap">
              Factories ({filteredFactories.length})
            </span>
          </div>

          <div className="relative min-w-[210px] flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search code, name or location..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 overflow-x-auto">
            <button
              type="button"
              onClick={() => setOwnershipFilter('ALL')}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all whitespace-nowrap ${
                ownershipFilter === 'ALL'
                  ? 'bg-white text-orange-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All
            </button>
            {OWNERSHIP_OPTIONS.map(o => (
              <button
                key={o}
                type="button"
                onClick={() => setOwnershipFilter(o)}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all whitespace-nowrap ${
                  ownershipFilter === o
                    ? 'bg-white text-orange-600 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {o === 'Innovista Owned'
                  ? 'Owned'
                  : o === 'Partnered Factory'
                  ? 'Partner'
                  : o === 'Contracted Factory'
                  ? 'Contract'
                  : o === 'External Supplier'
                  ? 'Supplier'
                  : o === 'Strategic Partner'
                  ? 'Strategic'
                  : o === 'External Fabricator'
                  ? 'Fabricator'
                  : o}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-3.5 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          New
        </button>
      </div>

      {/* Minimal Factory Cards Grid: ONLY Factory Code, Factory Name, Location, Red Notification Badge & Relevant Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredFactories.map(f => {
          const notifCount = notificationCounts[f.id] ?? 0;

          return (
            <div
              key={f.id}
              onClick={() => onSelectFactory?.(f.id, undefined, 'work_packages')}
              className="relative bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col justify-between gap-4 hover:border-orange-400 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200 font-mono text-xs font-bold">
                    {f.factoryCode}
                  </span>

                  {notifCount > 0 && (
                    <span
                      title={`${notifCount} factory updates / notifications`}
                      className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-red-600 text-white text-[11px] font-bold shadow-xs"
                    >
                      {notifCount}
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-bold text-slate-900 group-hover:text-orange-600 transition-colors truncate">
                  {f.name}
                </h3>

                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                  <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                  <span className="truncate font-medium">{f.city}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center gap-2" onClick={e => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => onSelectFactory?.(f.id, undefined, 'work_packages')}
                  className="flex-1 py-1.5 px-3 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold flex items-center justify-center gap-1 shadow-2xs transition-colors"
                >
                  <span>Open</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenAssignModal(f)}
                  className="py-1.5 px-2.5 rounded-lg bg-sky-50 hover:bg-sky-100 border border-sky-200/80 text-sky-700 text-xs font-semibold transition-colors"
                >
                  Assign
                </button>
                <button
                  type="button"
                  title="Print / Generate Quotation-Format Document"
                  onClick={() => setActiveDocSpec(buildFactoryProfileDocSpec(f))}
                  className="py-1.5 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Doc</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {activeDocSpec && (
        <FactoryQuotationDocumentModal
          spec={activeDocSpec}
          currentUser={currentUser}
          onClose={() => setActiveDocSpec(null)}
          onRefresh={onRefresh}
        />
      )}

      {/* Assign Project to Factory Modal (Advanced Multi-Section Form) */}
      {assignFactory && (
        <div className="fixed inset-0 bg-slate-900/60 z-[9998] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Assign Project & Create Advanced Factory Work Package — {assignFactory.factoryCode}
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    {assignFactory.name} · Complete project assignment, contract governance, quantities, budget, schedule & initial tasks
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAssignFactory(null)}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSaveAssignProject} className="p-6 space-y-4 overflow-y-auto text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="text-[11px] font-bold text-orange-600 uppercase tracking-wider">
                  1. Project Selection, Contract Reference & Work Package Scope
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Project to Assign</label>
                    <select
                      value={selectedProjectId}
                      onChange={e => {
                        setSelectedProjectId(e.target.value);
                        const found = projects.find(p => p.id === e.target.value || p.projectCode === e.target.value);
                        if (found) {
                          setWpTitle(`${found.projectName} — ${assignFactory.name}`);
                        }
                      }}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-semibold"
                    >
                      {projects.length > 0 ? (
                        projects.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.projectCode || p.id} — {p.projectName}
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="PRJ-2026-001">PRJ-2026-001 — Cinnamon Life Integrated Facade</option>
                          <option value="PRJ-2026-002">PRJ-2026-002 — Port City Commercial Tower B</option>
                          <option value="PRJ-2026-003">PRJ-2026-003 — Airport Terminal 2 Cladding & Glazing</option>
                        </>
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Contract / PO Reference</label>
                    <input
                      type="text"
                      value={wpContractRef}
                      onChange={e => setWpContractRef(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Work Package Scope Title</label>
                    <input
                      type="text"
                      required
                      value={wpTitle}
                      onChange={e => setWpTitle(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Execution Priority</label>
                    <select
                      value={wpPriority}
                      onChange={e => setWpPriority(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    >
                      <option value="Critical">Critical (Fast-Track)</option>
                      <option value="High">High Priority</option>
                      <option value="Normal">Normal Schedule</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="text-[11px] font-bold text-orange-600 uppercase tracking-wider">
                  2. Quantities, Commercial Budget & Schedule Window
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Planned Quantity</label>
                    <input
                      type="number"
                      value={wpQty}
                      onChange={e => setWpQty(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Unit</label>
                    <input
                      type="text"
                      value={wpUnit}
                      onChange={e => setWpUnit(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Budget Value (LKR)</label>
                    <input
                      type="number"
                      value={wpBudget}
                      onChange={e => setWpBudget(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={wpStartDate}
                      onChange={e => setWpStartDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Target Deadline</label>
                    <input
                      type="date"
                      value={wpDeadline}
                      onChange={e => setWpDeadline(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="text-[11px] font-bold text-orange-600 uppercase tracking-wider">
                  3. Engineering Drawings, Master QC Standard & Initial Execution Setup
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">AFC Drawing Package Reference</label>
                    <input
                      type="text"
                      value={wpDrawingPackage}
                      onChange={e => setWpDrawingPackage(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Master Quality Standard</label>
                    <input
                      type="text"
                      value={wpQualityStandard}
                      onChange={e => setWpQualityStandard(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Initial Execution Phase</label>
                    <input
                      type="text"
                      value={initialPlanPhase}
                      onChange={e => setInitialPlanPhase(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Initial Production Task</label>
                    <input
                      type="text"
                      value={initialTaskTitle}
                      onChange={e => setInitialTaskTitle(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Special Fabrication & QC Instructions</label>
                  <input
                    type="text"
                    value={wpSpecialInstructions}
                    onChange={e => setWpSpecialInstructions(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAssignFactory(null)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold shadow-2xs"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Factory Modal (Advanced Multi-Section Form) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-[9998] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Register Advanced Factory & Production Facility Profile
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Configure ownership, facility type, industrial address, key engineering/QA/HSE leads, capacity, and ISO certifications
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold"
              >
                Close
              </button>
            </div>
            <form onSubmit={handleSaveFactory} className="p-6 space-y-4 overflow-y-auto text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="text-[11px] font-bold text-orange-600 uppercase tracking-wider">
                  1. Factory Identity, Ownership & Facility Classification
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Factory Name</label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={e => setFormName(e.target.value)}
                      placeholder="e.g., Innovista Central Facade & CNC Plant II"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Factory Code</label>
                    <input
                      type="text"
                      value={formCode}
                      onChange={e => setFormCode(e.target.value)}
                      placeholder="FAC-INV-05"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Ownership / Contract Model</label>
                    <select
                      value={formOwnership}
                      onChange={e => setFormOwnership(e.target.value as FactoryOwnershipType)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    >
                      {OWNERSHIP_OPTIONS.map(o => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Facility Specialization</label>
                    <select
                      value={formFacilityType}
                      onChange={e => setFormFacilityType(e.target.value as FactoryFacilityType)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    >
                      {FACILITY_TYPES.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="text-[11px] font-bold text-orange-600 uppercase tracking-wider">
                  2. Industrial Location, Plant Capacity & Infrastructure
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">City / Zone</label>
                    <input
                      type="text"
                      value={formCity}
                      onChange={e => setFormCity(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Country</label>
                    <input
                      type="text"
                      value={formCountry}
                      onChange={e => setFormCountry(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Full Industrial Address</label>
                    <input
                      type="text"
                      value={formAddress}
                      onChange={e => setFormAddress(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Max Capacity / Month</label>
                    <input
                      type="number"
                      value={formMaxUnits}
                      onChange={e => setFormMaxUnits(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Floor Area (SQM)</label>
                    <input
                      type="number"
                      value={formFloorAreaSqm}
                      onChange={e => setFormFloorAreaSqm(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Production Bays</label>
                    <input
                      type="number"
                      value={formBaysCount}
                      onChange={e => setFormBaysCount(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Shifts / Day</label>
                    <input
                      type="number"
                      value={formShiftsPerDay}
                      onChange={e => setFormShiftsPerDay(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="text-[11px] font-bold text-orange-600 uppercase tracking-wider">
                  3. Key Management Personnel, Contacts & ISO Certifications
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Factory Manager</label>
                    <input
                      type="text"
                      value={formManager}
                      onChange={e => setFormManager(e.target.value)}
                      placeholder="Eng. Nimal Jayawardena"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Chief Engineer</label>
                    <input
                      type="text"
                      value={formChiefEngineer}
                      onChange={e => setFormChiefEngineer(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">QA/QC Lead</label>
                    <input
                      type="text"
                      value={formQaLead}
                      onChange={e => setFormQaLead(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">HSE Officer</label>
                    <input
                      type="text"
                      value={formHseOfficer}
                      onChange={e => setFormHseOfficer(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone</label>
                    <input
                      type="text"
                      value={formPhone}
                      onChange={e => setFormPhone(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Contact Email</label>
                    <input
                      type="email"
                      value={formEmail}
                      onChange={e => setFormEmail(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">ISO & Quality Certifications</label>
                    <input
                      type="text"
                      value={formIsoCerts}
                      onChange={e => setFormIsoCerts(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold shadow-2xs"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
