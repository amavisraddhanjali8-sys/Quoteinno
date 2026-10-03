import React, { useState, useMemo, useEffect } from 'react';
import {
  AlertTriangle,
  FileCheck,
  Phone,
  Plus,
  Search,
  Trash2,
  Edit2,
  X,
  HardHat,
  Folder,
  LayoutDashboard,
  Scale,
  ClipboardCheck,
  Users,
  Wrench,
  Truck,
  CheckCircle2,
  Package,
  HeartPulse,
  Lock
} from 'lucide-react';
import { SitePermit, IncidentReport, Project } from '../types';
import { cn } from '../lib/utils';
import { ExportActions } from './common/ExportActions';
import { downloadCSV, downloadPDFTable } from '../services/dataExportService';
import { SafetyLandingPage, SafetyTab } from './safety/SafetyLandingPage';
import {
  safetyControlService,
  HseRiskJsaRecord,
  HseSiteInspectionRecord,
  PpeInventoryRecord,
  EvacuationDrillRecord
} from '../services/safetyControlService';

interface SafetyBrief {
  id: string;
  code: string;
  type: 'Toolbox Talk' | 'Site Induction';
  projectId: string;
  topic: string;
  focus: string;
  conductor: string;
  attendees: number;
  status: 'Completed' | 'Upcoming';
  timing: string;
}

interface EmergencyContactItem {
  id: string;
  role: string;
  name: string;
  phone: string;
  zone: string;
  available: string;
}

interface SiteManagementPortalProps {
  incidentReports?: IncidentReport[];
  sitePermits?: SitePermit[];
  projects?: Project[];
  initialTab?: SafetyTab;
  onTabChange?: (tab: SafetyTab) => void;
  onSavePermit?: (permit: SitePermit) => void;
  onDeletePermit?: (id: string) => void;
  onSaveIncident?: (incident: IncidentReport) => void;
  onDeleteIncident?: (id: string) => void;
  onNavigateToPortal?: (portalView: string, subTab?: string) => void;
}

export const SiteManagementPortal: React.FC<SiteManagementPortalProps> = ({
  sitePermits = [],
  incidentReports = [],
  projects = [],
  initialTab = 'landing',
  onTabChange,
  onSavePermit,
  onDeletePermit,
  onSaveIncident,
  onDeleteIncident,
  onNavigateToPortal
}) => {
  const [activeTab, setActiveTab] = useState<SafetyTab>(initialTab || 'landing');
  const [searchQuery, setSearchQuery] = useState('');
  const [projectFilter, setProjectFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  // Persistent Risk, Inspections, PPE & Drills
  const [riskRecords, setRiskRecords] = useState<HseRiskJsaRecord[]>(() =>
    safetyControlService.getRisks()
  );
  const [inspectionRecords, setInspectionRecords] = useState<HseSiteInspectionRecord[]>(() =>
    safetyControlService.getInspections()
  );
  const [ppeRecords, setPpeRecords] = useState<PpeInventoryRecord[]>(() =>
    safetyControlService.getPpeInventory()
  );
  const [drillRecords, setDrillRecords] = useState<EvacuationDrillRecord[]>(() =>
    safetyControlService.getDrills()
  );

  const defaultPermits: SitePermit[] = useMemo(() => {
    if (sitePermits && sitePermits.length > 0) return sitePermits;
    return [
      {
        id: 'pm-1',
        permitNo: 'WPT-2026-081',
        type: 'Working at Heights (> 2m Exterior Facade)',
        projectId: 'Sirius Mall Glazing',
        issuedAt: '2026-10-14',
        expiresAt: '2026-10-21',
        status: 'Active'
      },
      {
        id: 'pm-2',
        permitNo: 'WPT-2026-079',
        type: 'Hot Work Permit (Welding & Structural Steel Anchor)',
        projectId: 'Sirius Mall Glazing',
        issuedAt: '2026-10-12',
        expiresAt: '2026-10-18',
        status: 'Active'
      },
      {
        id: 'pm-3',
        permitNo: 'WPT-2026-072',
        type: 'Mobile Crane Hoisting & Street Access Block',
        projectId: 'Horizon Office Complex',
        issuedAt: '2026-10-08',
        expiresAt: '2026-10-10',
        status: 'Expired'
      },
      {
        id: 'pm-4',
        permitNo: 'WPT-2026-084',
        type: 'Confined Shaft Silicone & Electrical LOTO',
        projectId: 'Horizon Office Complex',
        issuedAt: '2026-10-14',
        expiresAt: '2026-10-20',
        status: 'Active'
      }
    ];
  }, [sitePermits]);

  const [permitsList, setPermitsList] = useState<SitePermit[]>(defaultPermits);

  useEffect(() => {
    if (sitePermits && sitePermits.length > 0) {
      setPermitsList(sitePermits);
    }
  }, [sitePermits]);

  const defaultIncidents: IncidentReport[] = useMemo(() => {
    if (incidentReports && incidentReports.length > 0) return incidentReports;
    return [
      {
        id: 'inc-1',
        incidentNo: 'INC-2026-003',
        date: '2026-09-28',
        location: 'Horizon Tower Level 3 Transom',
        projectId: 'Horizon Office Complex',
        type: 'Near Miss',
        description: 'Lanyard carabiner caught on scaffold brace during harness shift',
        immediateActions: '5-Why CAPA: Dual-hook routing enforced & brief completed',
        reportedBy: 'Dinesh Jayawardena',
        photos: [] as string[],
        status: 'Closed'
      },
      {
        id: 'inc-2',
        incidentNo: 'INC-2026-004',
        date: '2026-10-11',
        location: 'Sirius Mall North Loading Bay',
        projectId: 'Sirius Mall Glazing',
        type: 'Minor Injury',
        description: 'Minor palm abrasion while uncrating aluminum mullion frame',
        immediateActions: 'First-aid dressing applied; EN388 Cut-5 gloves mandated',
        reportedBy: 'Eng. Janaka Perera',
        photos: [] as string[],
        status: 'Closed'
      }
    ];
  }, [incidentReports]);

  const [incidentsList, setIncidentsList] = useState<IncidentReport[]>(defaultIncidents);

  useEffect(() => {
    if (incidentReports && incidentReports.length > 0) {
      setIncidentsList(incidentReports);
    }
  }, [incidentReports]);

  const [safetyBriefs, setSafetyBriefs] = useState<SafetyBrief[]>([
    {
      id: 'sb-1',
      code: 'TBT-2026-102',
      type: 'Toolbox Talk',
      projectId: 'Sirius Mall Glazing',
      topic: 'Wind Speed Cutoff & Glass Vacuum Lifter Check',
      focus: 'Stop hoisting above 25 knots; dual gauge test before lift',
      conductor: 'Dinesh Jayawardena',
      attendees: 24,
      status: 'Completed',
      timing: '2026-10-14 07:45'
    },
    {
      id: 'sb-2',
      code: 'IND-2026-041',
      type: 'Site Induction',
      projectId: 'Horizon Office Complex',
      topic: 'New Facade Riggers Mandatory HSE Orientation',
      focus: 'PPE rules, LOTO locks, harness tie-off & muster point',
      conductor: 'Eng. Janaka Perera',
      attendees: 9,
      status: 'Completed',
      timing: '2026-10-14 08:30'
    },
    {
      id: 'sb-3',
      code: 'TBT-2026-103',
      type: 'Toolbox Talk',
      projectId: 'Horizon Office Complex',
      topic: 'Chemical Primer & Silicone Ventilation Control',
      focus: 'Organic vapour cartridge mask & forced air fan in shafts',
      conductor: 'Dinesh Jayawardena',
      attendees: 18,
      status: 'Upcoming',
      timing: '2026-10-15 07:45'
    }
  ]);

  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContactItem[]>([
    { id: 'c-1', role: 'Lead HSE Officer', name: 'Dinesh Jayawardena', phone: '+94 76 341 9022', zone: 'All Sites', available: '24/7 Priority' },
    { id: 'c-2', role: 'Senior Site Engineer', name: 'Eng. Janaka Perera', phone: '+94 77 112 3344', zone: 'Sirius Mall', available: '07:00 - 19:00' },
    { id: 'c-3', role: 'Emergency Hospital', name: 'National Hospital Colombo', phone: '1990 / +94 11 269 1111', zone: 'Trauma Care', available: '24/7 Ambulance' },
    { id: 'c-4', role: 'Fire & Rescue', name: 'Central Fire Brigade', phone: '110 / +94 11 242 2222', zone: 'Colombo Metro', available: '24/7 Dispatch' }
  ]);

  // Modal states
  const [isAddingPermit, setIsAddingPermit] = useState(false);
  const [editingPermit, setEditingPermit] = useState<SitePermit | null>(null);
  const [isAddingRisk, setIsAddingRisk] = useState(false);
  const [editingRisk, setEditingRisk] = useState<HseRiskJsaRecord | null>(null);
  const [isAddingInspection, setIsAddingInspection] = useState(false);
  const [isAddingPpe, setIsAddingPpe] = useState(false);
  const [isAddingIncident, setIsAddingIncident] = useState(false);
  const [editingIncident, setEditingIncident] = useState<IncidentReport | null>(null);
  const [isAddingBrief, setIsAddingBrief] = useState(false);
  const [editingBrief, setEditingBrief] = useState<SafetyBrief | null>(null);
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContactItem | null>(null);
  const [isAddingDrill, setIsAddingDrill] = useState(false);

  // Forms
  const [permitForm, setPermitForm] = useState({
    permitNo: '',
    type: 'Working at Heights (> 2m Exterior Facade)',
    projectId: 'Sirius Mall Glazing',
    issuedAt: new Date().toISOString().split('T')[0],
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'Active' as SitePermit['status']
  });

  const [riskForm, setRiskForm] = useState({
    jsaCode: 'JSA-2026-018',
    projectId: 'Sirius Mall Glazing',
    activity: '',
    hazard: '',
    initialRisk: 'High' as HseRiskJsaRecord['initialRisk'],
    controlMeasure: '',
    residualRisk: 'Low' as HseRiskJsaRecord['residualRisk'],
    linkedPermitNo: 'WPT-2026-081',
    owner: 'Dinesh Jayawardena',
    status: 'Approved' as HseRiskJsaRecord['status']
  });

  const [inspForm, setInspForm] = useState({
    inspCode: 'TAG-SCF-105',
    projectId: 'Sirius Mall Glazing',
    category: 'Scaffold Tag' as HseSiteInspectionRecord['category'],
    location: '',
    equipmentId: 'EQ-VAC-02',
    tagStatus: 'Green Tag (Safe)' as HseSiteInspectionRecord['tagStatus'],
    inspector: 'Dinesh Jayawardena',
    date: new Date().toISOString().split('T')[0],
    finding: ''
  });

  const [ppeForm, setPpeForm] = useState({
    ppeCode: 'PPE-NEW-05',
    itemName: '',
    category: 'Fall Arrest' as PpeInventoryRecord['category'],
    standard: 'EN 361',
    stockQty: 25,
    minStock: 10,
    lastIssuedTo: 'Site Crew',
    projectId: 'Sirius Mall Glazing'
  });

  const [incidentForm, setIncidentForm] = useState({
    incidentNo: '',
    date: new Date().toISOString().split('T')[0],
    location: '',
    projectId: 'Sirius Mall Glazing',
    type: 'Near Miss' as IncidentReport['type'],
    description: '',
    immediateActions: '',
    reportedBy: 'Dinesh Jayawardena',
    status: 'Investigating' as IncidentReport['status']
  });

  const [briefForm, setBriefForm] = useState({
    code: '',
    type: 'Toolbox Talk' as SafetyBrief['type'],
    projectId: 'Sirius Mall Glazing',
    topic: '',
    focus: '',
    conductor: 'Dinesh Jayawardena',
    attendees: 15,
    status: 'Upcoming' as SafetyBrief['status'],
    timing: '2026-10-15 07:45'
  });

  const [contactForm, setContactForm] = useState({
    role: '',
    name: '',
    phone: '',
    zone: 'All Sites',
    available: '24/7'
  });

  const [drillForm, setDrillForm] = useState({
    drillCode: 'DRL-2026-03',
    projectId: 'Sirius Mall Glazing',
    scenario: '',
    date: new Date().toISOString().split('T')[0],
    musterTimeMin: 3.5,
    targetTimeMin: 4.0,
    headcountMustered: '45 / 45 (100%)',
    commander: 'Dinesh Jayawardena',
    result: 'Pass' as EvacuationDrillRecord['result']
  });

  const uniqueProjects = useMemo(() => {
    const listProjects = permitsList.map(p => p.projectId);
    const rProjects = riskRecords.map(r => r.projectId);
    const centralProjects = projects.map(p => p.projectCode || p.projectName || p.id);
    return Array.from(new Set([...listProjects, ...rProjects, ...centralProjects])).filter(Boolean);
  }, [permitsList, riskRecords, projects]);

  // Filtered Lists
  const filteredPermits = useMemo(() => {
    return permitsList.filter(p => {
      const q = searchQuery.toLowerCase().trim();
      const matchQ =
        !q ||
        p.permitNo.toLowerCase().includes(q) ||
        p.type.toLowerCase().includes(q) ||
        p.projectId.toLowerCase().includes(q);
      const matchProj = projectFilter === 'All' || p.projectId === projectFilter;
      const matchStat = statusFilter === 'All' || p.status === statusFilter;
      return matchQ && matchProj && matchStat;
    });
  }, [permitsList, searchQuery, projectFilter, statusFilter]);

  const filteredRisks = useMemo(() => {
    return riskRecords.filter(r => {
      const q = searchQuery.toLowerCase().trim();
      const matchQ =
        !q ||
        r.jsaCode.toLowerCase().includes(q) ||
        r.activity.toLowerCase().includes(q) ||
        r.hazard.toLowerCase().includes(q) ||
        r.controlMeasure.toLowerCase().includes(q) ||
        r.projectId.toLowerCase().includes(q);
      const matchProj = projectFilter === 'All' || r.projectId === projectFilter;
      return matchQ && matchProj;
    });
  }, [riskRecords, searchQuery, projectFilter]);

  const filteredInspections = useMemo(() => {
    return inspectionRecords.filter(i => {
      const q = searchQuery.toLowerCase().trim();
      const matchQ =
        !q ||
        i.inspCode.toLowerCase().includes(q) ||
        i.location.toLowerCase().includes(q) ||
        i.finding.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q);
      const matchProj = projectFilter === 'All' || i.projectId === projectFilter;
      return matchQ && matchProj;
    });
  }, [inspectionRecords, searchQuery, projectFilter]);

  const filteredBriefs = useMemo(() => {
    return safetyBriefs.filter(b => {
      const q = searchQuery.toLowerCase().trim();
      const matchQ =
        !q ||
        b.code.toLowerCase().includes(q) ||
        b.topic.toLowerCase().includes(q) ||
        b.focus.toLowerCase().includes(q) ||
        b.conductor.toLowerCase().includes(q);
      const matchProj = projectFilter === 'All' || b.projectId === projectFilter;
      return matchQ && matchProj;
    });
  }, [safetyBriefs, searchQuery, projectFilter]);

  const filteredIncidents = useMemo(() => {
    return incidentsList.filter(i => {
      const q = searchQuery.toLowerCase().trim();
      const matchQ =
        !q ||
        i.incidentNo.toLowerCase().includes(q) ||
        i.type.toLowerCase().includes(q) ||
        i.location.toLowerCase().includes(q) ||
        i.projectId.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q);
      const matchProj = projectFilter === 'All' || i.projectId === projectFilter;
      const matchStat = statusFilter === 'All' || i.status === statusFilter;
      return matchQ && matchProj && matchStat;
    });
  }, [incidentsList, searchQuery, projectFilter, statusFilter]);

  // Handlers
  const handleSavePermitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!permitForm.type.trim()) return;
    if (editingPermit) {
      const updated: SitePermit = { ...editingPermit, ...permitForm };
      setPermitsList(prev => prev.map(p => (p.id === updated.id ? updated : p)));
      onSavePermit?.(updated);
      setEditingPermit(null);
    } else {
      const newPermit: SitePermit = {
        id: `pm-${Date.now()}`,
        permitNo: permitForm.permitNo || `WPT-2026-0${permitsList.length + 86}`,
        type: permitForm.type,
        projectId: permitForm.projectId,
        issuedAt: permitForm.issuedAt,
        expiresAt: permitForm.expiresAt,
        status: permitForm.status
      };
      setPermitsList(prev => [newPermit, ...prev]);
      onSavePermit?.(newPermit);
      setIsAddingPermit(false);
    }
  };

  const handleSaveRiskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!riskForm.activity.trim()) return;
    if (editingRisk) {
      const next = riskRecords.map(r => (r.id === editingRisk.id ? { ...editingRisk, ...riskForm } : r));
      setRiskRecords(next);
      safetyControlService.saveRisks(next);
      setEditingRisk(null);
    } else {
      const created: HseRiskJsaRecord = {
        id: `jsa-${Date.now()}`,
        ...riskForm
      };
      const next = [created, ...riskRecords];
      setRiskRecords(next);
      safetyControlService.saveRisks(next);
      setIsAddingRisk(false);
    }
  };

  const handleSaveInspectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspForm.location.trim()) return;
    const created: HseSiteInspectionRecord = {
      id: `hsi-${Date.now()}`,
      ...inspForm
    };
    const next = [created, ...inspectionRecords];
    setInspectionRecords(next);
    safetyControlService.saveInspections(next);
    setIsAddingInspection(false);
  };

  const handleSavePpeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ppeForm.itemName.trim()) return;
    const created: PpeInventoryRecord = {
      id: `ppe-${Date.now()}`,
      ppeCode: ppeForm.ppeCode,
      itemName: ppeForm.itemName,
      category: ppeForm.category,
      standard: ppeForm.standard,
      stockQty: Number(ppeForm.stockQty),
      minStock: Number(ppeForm.minStock),
      issuedCount: 0,
      lastIssuedTo: ppeForm.lastIssuedTo,
      projectId: ppeForm.projectId
    };
    const next = [created, ...ppeRecords];
    setPpeRecords(next);
    safetyControlService.savePpeInventory(next);
    setIsAddingPpe(false);
  };

  const handleIssueOnePpe = (id: string) => {
    const next = ppeRecords.map(item =>
      item.id === id && item.stockQty > 0
        ? { ...item, stockQty: item.stockQty - 1, issuedCount: item.issuedCount + 1 }
        : item
    );
    setPpeRecords(next);
    safetyControlService.savePpeInventory(next);
  };

  const handleSaveIncidentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!incidentForm.description.trim()) return;
    if (editingIncident) {
      const updated: IncidentReport = { ...editingIncident, ...incidentForm };
      setIncidentsList(prev => prev.map(i => (i.id === updated.id ? updated : i)));
      onSaveIncident?.(updated);
      setEditingIncident(null);
    } else {
      const newIncident: IncidentReport = {
        id: `inc-${Date.now()}`,
        incidentNo: incidentForm.incidentNo || `INC-2026-00${incidentsList.length + 5}`,
        date: incidentForm.date,
        location: incidentForm.location || 'Site Level 1',
        projectId: incidentForm.projectId,
        type: incidentForm.type,
        description: incidentForm.description,
        immediateActions: incidentForm.immediateActions || 'Area isolated & 5-Why CAPA initiated',
        reportedBy: incidentForm.reportedBy,
        photos: [],
        status: incidentForm.status
      };
      setIncidentsList(prev => [newIncident, ...prev]);
      onSaveIncident?.(newIncident);
      setIsAddingIncident(false);
    }
  };

  const handleSaveBriefSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!briefForm.topic.trim()) return;
    if (editingBrief) {
      const updated: SafetyBrief = { ...editingBrief, ...briefForm };
      setSafetyBriefs(prev => prev.map(b => (b.id === updated.id ? updated : b)));
      setEditingBrief(null);
    } else {
      const newBrief: SafetyBrief = {
        id: `sb-${Date.now()}`,
        code: briefForm.code || `TBT-2026-${safetyBriefs.length + 104}`,
        type: briefForm.type,
        projectId: briefForm.projectId,
        topic: briefForm.topic,
        focus: briefForm.focus,
        conductor: briefForm.conductor,
        attendees: Number(briefForm.attendees) || 12,
        status: briefForm.status,
        timing: briefForm.timing
      };
      setSafetyBriefs(prev => [newBrief, ...prev]);
      setIsAddingBrief(false);
    }
  };

  const handleSaveContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name.trim() || !contactForm.phone.trim()) return;
    if (editingContact) {
      const updated: EmergencyContactItem = { ...editingContact, ...contactForm };
      setEmergencyContacts(prev => prev.map(c => (c.id === updated.id ? updated : c)));
      setEditingContact(null);
    } else {
      const newContact: EmergencyContactItem = {
        id: `c-${Date.now()}`,
        role: contactForm.role || 'Site Responder',
        name: contactForm.name,
        phone: contactForm.phone,
        zone: contactForm.zone || 'All Sites',
        available: contactForm.available
      };
      setEmergencyContacts(prev => [...prev, newContact]);
      setIsAddingContact(false);
    }
  };

  const handleSaveDrillSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!drillForm.scenario.trim()) return;
    const created: EvacuationDrillRecord = {
      id: `drl-${Date.now()}`,
      ...drillForm,
      musterTimeMin: Number(drillForm.musterTimeMin),
      targetTimeMin: Number(drillForm.targetTimeMin)
    };
    const next = [created, ...drillRecords];
    setDrillRecords(next);
    safetyControlService.saveDrills(next);
    setIsAddingDrill(false);
  };

  const handleExportCSV = () => {
    const headers = ['Permit No', 'Type', 'Project', 'Issued', 'Valid Until', 'Status'];
    const rows = permitsList.map(p => [
      `"${p.permitNo}"`,
      `"${p.type.replace(/"/g, '""')}"`,
      `"${p.projectId}"`,
      `"${p.issuedAt}"`,
      `"${p.expiresAt}"`,
      `"${p.status}"`
    ]);
    downloadCSV(`safety-hse-${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
  };

  const handleExportPDF = () => {
    const headers = ['Permit #', 'Type', 'Project', 'Valid Until', 'Status'];
    const rows = permitsList.map(p => [p.permitNo, p.type, p.projectId, p.expiresAt, p.status]);
    downloadPDFTable(
      'Site Safety & PTW Register',
      headers,
      rows,
      'safety-hse-report.pdf',
      'Active work permits and site safety clearances'
    );
  };

  return (
    <div className="space-y-2.5 pb-8">
      {/* Minimal White Header Bar with Simple Words & Cross-Portal Links */}
      <header className="px-4 py-2.5 bg-white border border-slate-200/80 rounded-xl shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-orange-500 text-white flex items-center justify-center shrink-0">
              <HardHat size={15} />
            </div>
            <h1 className="text-sm font-bold text-slate-900">Safety & HSE Hub</h1>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              0 LTI • 365 Safe Days
            </span>
          </div>

          {/* Connected Portals & Export Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {onNavigateToPortal && (
              <>
                <button
                  onClick={() => onNavigateToPortal('projects')}
                  className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  title="Open Projects Portal"
                >
                  <Folder size={11} className="text-orange-500" />
                  <span>Projects</span>
                </button>
                <button
                  onClick={() => onNavigateToPortal('resource-management', 'certifications')}
                  className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  title="Open Workforce Safety Certifications"
                >
                  <Users size={11} className="text-blue-600" />
                  <span>Workforce</span>
                </button>
                <button
                  onClick={() => onNavigateToPortal('equipment-management', 'inspections')}
                  className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  title="Open Equipment Inspections & Calibration"
                >
                  <Wrench size={11} className="text-teal-600" />
                  <span>Equipment</span>
                </button>
                <button
                  onClick={() => onNavigateToPortal('procurement', 'pr')}
                  className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  title="Order PPE & Safety Gear in Procurement"
                >
                  <Truck size={11} className="text-purple-600" />
                  <span>Buy PPE</span>
                </button>
                <button
                  onClick={() => onNavigateToPortal('quality-control', 'ncrs')}
                  className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  title="Open Quality Control & NCRs"
                >
                  <CheckCircle2 size={11} className="text-emerald-600" />
                  <span>Quality</span>
                </button>
              </>
            )}
            <ExportActions
              onExportCSV={handleExportCSV}
              onExportPDF={handleExportPDF}
              labelCSV="CSV"
              labelPDF="PDF"
            />
          </div>
        </div>
      </header>

      {/* Clean White Navigation Bar */}
      <div className="flex items-center gap-1 p-1 bg-white rounded-xl border border-slate-200/80 overflow-x-auto shadow-2xs">
        {[
          { id: 'landing', label: 'Command Hub', icon: LayoutDashboard },
          { id: 'permits', label: '1. Work Permits (PTW)', icon: FileCheck, badge: permitsList.filter(p => p.status === 'Active').length },
          { id: 'risks', label: '2. Risk & JSA', icon: Scale, badge: riskRecords.length },
          { id: 'inspections', label: '3. Tags & PPE', icon: ClipboardCheck, badge: inspectionRecords.length },
          { id: 'hse', label: '4. Toolbox & Induction', icon: HardHat, badge: safetyBriefs.length },
          { id: 'incidents', label: '5. Incidents & CAPA', icon: AlertTriangle, badge: incidentsList.length },
          { id: 'contacts', label: '6. Emergency & Drills', icon: Phone, badge: emergencyContacts.length }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              const nextTab = tab.id as SafetyTab;
              setActiveTab(nextTab);
              onTabChange?.(nextTab);
            }}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer',
              activeTab === tab.id
                ? 'bg-slate-900 text-white font-semibold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            )}
          >
            <tab.icon size={13} className={activeTab === tab.id ? 'text-orange-400' : 'text-slate-400'} />
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={cn(
                  'text-[10px] font-mono px-1.5 py-0.2 rounded',
                  activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                )}
              >
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Compact Single-Line KPI Strip */}
      {activeTab !== 'landing' && (
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
          <div className="bg-white border border-slate-200/80 rounded-xl px-3 py-2 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">LTI Count</span>
            <span className="text-xs font-bold text-emerald-600 font-mono">0 (365d)</span>
          </div>
          <div className="bg-white border border-slate-200/80 rounded-xl px-3 py-2 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">Active PTWs</span>
            <span className="text-xs font-bold text-slate-900 font-mono">
              {permitsList.filter(p => p.status === 'Active').length}
            </span>
          </div>
          <div className="bg-white border border-slate-200/80 rounded-xl px-3 py-2 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">Approved JSAs</span>
            <span className="text-xs font-bold text-blue-600 font-mono">
              {riskRecords.filter(r => r.status === 'Approved').length}
            </span>
          </div>
          <div className="bg-white border border-slate-200/80 rounded-xl px-3 py-2 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">Green Tags</span>
            <span className="text-xs font-bold text-emerald-600 font-mono">
              {inspectionRecords.filter(i => i.tagStatus === 'Green Tag (Safe)').length} / {inspectionRecords.length}
            </span>
          </div>
          <div className="bg-white border border-slate-200/80 rounded-xl px-3 py-2 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">Low PPE Items</span>
            <span className="text-xs font-bold text-amber-600 font-mono">
              {ppeRecords.filter(p => p.stockQty <= p.minStock).length}
            </span>
          </div>
          <div className="bg-white border border-slate-200/80 rounded-xl px-3 py-2 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">Open Incidents</span>
            <span className="text-xs font-bold text-rose-600 font-mono">
              {incidentsList.filter(i => i.status !== 'Closed').length}
            </span>
          </div>
        </div>
      )}

      {/* TAB 0: COMMAND HUB */}
      {activeTab === 'landing' && (
        <SafetyLandingPage
          sitePermits={permitsList}
          incidentReports={incidentsList}
          riskRecords={riskRecords}
          inspectionRecords={inspectionRecords}
          ppeRecords={ppeRecords}
          projects={projects}
          onNavigateTab={t => {
            setActiveTab(t);
            onTabChange?.(t);
          }}
          onOpenAddPermit={() => {
            setActiveTab('permits');
            setIsAddingPermit(true);
          }}
          onOpenAddIncident={() => {
            setActiveTab('incidents');
            setIsAddingIncident(true);
          }}
          onOpenAddRisk={() => {
            setActiveTab('risks');
            setIsAddingRisk(true);
          }}
          onOpenAddInspection={() => {
            setActiveTab('inspections');
            setIsAddingInspection(true);
          }}
          onOpenAddBrief={() => {
            setActiveTab('hse');
            setIsAddingBrief(true);
          }}
          onNavigatePortal={onNavigateToPortal}
          onExportCSV={handleExportCSV}
          onExportPDF={handleExportPDF}
        />
      )}

      {/* TAB 1: WORK PERMITS (PTW) - Single-Line List View */}
      {activeTab === 'permits' && (
        <div className="bg-white border border-slate-200/80 rounded-xl shadow-2xs overflow-hidden p-3 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
              <div className="relative flex-1 max-w-xs">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search permit #, project, type..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-slate-400"
                />
              </div>
              <select
                value={projectFilter}
                onChange={e => setProjectFilter(e.target.value)}
                className="bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 outline-none cursor-pointer"
              >
                <option value="All">All Projects</option>
                {uniqueProjects.map(projId => (
                  <option key={projId} value={projId}>{projId}</option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 outline-none cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="Expired">Expired</option>
              </select>
            </div>

            <button
              onClick={() => {
                setEditingPermit(null);
                setPermitForm({
                  permitNo: `WPT-2026-0${permitsList.length + 86}`,
                  type: 'Working at Heights (> 2m Exterior Facade)',
                  projectId: 'Sirius Mall Glazing',
                  issuedAt: new Date().toISOString().split('T')[0],
                  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  status: 'Active'
                });
                setIsAddingPermit(true);
              }}
              className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Plus size={13} />
              <span>Issue PTW</span>
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200/80 rounded-lg">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-600 uppercase whitespace-nowrap">
                  <th className="py-2 px-3">Permit #</th>
                  <th className="py-2 px-3">Project</th>
                  <th className="py-2 px-3">Permit Scope / Type</th>
                  <th className="py-2 px-3">LOTO / Pre-Check</th>
                  <th className="py-2 px-3">Issued</th>
                  <th className="py-2 px-3">Valid Until</th>
                  <th className="py-2 px-3 text-center">Status</th>
                  <th className="py-2 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPermits.map(permit => (
                  <tr key={permit.id} className="hover:bg-slate-50/80 whitespace-nowrap">
                    <td className="py-2 px-3 font-mono font-bold text-slate-900">{permit.permitNo}</td>
                    <td className="py-2 px-3">
                      <button
                        onClick={() => setProjectFilter(permit.projectId)}
                        className="font-mono text-[11px] font-semibold text-orange-700 bg-orange-50 px-2 py-0.5 rounded border border-orange-200 cursor-pointer"
                      >
                        {permit.projectId}
                      </button>
                    </td>
                    <td className="py-2 px-3 font-medium text-slate-900 max-w-[260px] truncate" title={permit.type}>
                      {permit.type}
                    </td>
                    <td className="py-2 px-3">
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-flex items-center gap-1">
                        <Lock size={10} /> Verified
                      </span>
                    </td>
                    <td className="py-2 px-3 font-mono text-[11px] text-slate-500">{permit.issuedAt}</td>
                    <td className="py-2 px-3 font-mono text-[11px] font-semibold text-slate-800">{permit.expiresAt}</td>
                    <td className="py-2 px-3 text-center">
                      <span
                        className={cn(
                          'text-[10px] font-semibold px-2 py-0.5 rounded border',
                          permit.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : permit.status === 'Pending'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        )}
                      >
                        {permit.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            const nextStatus = permit.status === 'Active' ? 'Expired' : 'Active';
                            setPermitsList(prev =>
                              prev.map(p => (p.id === permit.id ? { ...p, status: nextStatus as any } : p))
                            );
                          }}
                          className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded cursor-pointer"
                        >
                          {permit.status === 'Active' ? 'Close' : 'Activate'}
                        </button>
                        <button
                          onClick={() => {
                            setEditingPermit(permit);
                            setPermitForm({
                              permitNo: permit.permitNo,
                              type: permit.type,
                              projectId: permit.projectId,
                              issuedAt: permit.issuedAt,
                              expiresAt: permit.expiresAt,
                              status: permit.status
                            });
                          }}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() => {
                            setPermitsList(prev => prev.filter(p => p.id !== permit.id));
                            onDeletePermit?.(permit.id);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
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

      {/* TAB 2: RISK ASSESSMENT & JSA - Single-Line List View */}
      {activeTab === 'risks' && (
        <div className="bg-white border border-slate-200/80 rounded-xl shadow-2xs overflow-hidden p-3 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
              <div className="relative flex-1 max-w-xs">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search JSA code, task, hazard, control..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-slate-400"
                />
              </div>
              <select
                value={projectFilter}
                onChange={e => setProjectFilter(e.target.value)}
                className="bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 outline-none cursor-pointer"
              >
                <option value="All">All Projects</option>
                {uniqueProjects.map(projId => (
                  <option key={projId} value={projId}>{projId}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                setEditingRisk(null);
                setRiskForm({
                  jsaCode: `JSA-2026-0${riskRecords.length + 18}`,
                  projectId: 'Sirius Mall Glazing',
                  activity: '',
                  hazard: '',
                  initialRisk: 'High',
                  controlMeasure: '',
                  residualRisk: 'Low',
                  linkedPermitNo: permitsList[0]?.permitNo || 'WPT-2026-081',
                  owner: 'Dinesh Jayawardena',
                  status: 'Approved'
                });
                setIsAddingRisk(true);
              }}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Plus size={13} />
              <span>Add JSA / Risk</span>
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200/80 rounded-lg">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-600 uppercase whitespace-nowrap">
                  <th className="py-2 px-3">JSA Code</th>
                  <th className="py-2 px-3">Project</th>
                  <th className="py-2 px-3">Activity / Task</th>
                  <th className="py-2 px-3">Identified Hazard</th>
                  <th className="py-2 px-3 text-center">Initial</th>
                  <th className="py-2 px-3">Control Measure</th>
                  <th className="py-2 px-3 text-center">Residual</th>
                  <th className="py-2 px-3">Linked PTW</th>
                  <th className="py-2 px-3 text-center">Status</th>
                  <th className="py-2 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRisks.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/80 whitespace-nowrap">
                    <td className="py-2 px-3 font-mono font-bold text-slate-900">{r.jsaCode}</td>
                    <td className="py-2 px-3 font-mono text-[11px] text-slate-600">{r.projectId}</td>
                    <td className="py-2 px-3 font-semibold text-slate-900 max-w-[190px] truncate" title={r.activity}>
                      {r.activity}
                    </td>
                    <td className="py-2 px-3 text-slate-600 max-w-[190px] truncate" title={r.hazard}>
                      {r.hazard}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span
                        className={cn(
                          'text-[10px] font-bold px-2 py-0.5 rounded border',
                          r.initialRisk === 'High'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : r.initialRisk === 'Medium'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        )}
                      >
                        {r.initialRisk}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-emerald-700 font-medium max-w-[220px] truncate" title={r.controlMeasure}>
                      {r.controlMeasure}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {r.residualRisk}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <button
                        onClick={() => setActiveTab('permits')}
                        className="font-mono text-[11px] text-blue-600 hover:underline cursor-pointer"
                      >
                        {r.linkedPermitNo}
                      </button>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span
                        className={cn(
                          'text-[10px] font-semibold px-2 py-0.5 rounded border',
                          r.status === 'Approved'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : r.status === 'Stop-Work'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        )}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            const nextStatus = r.status === 'Approved' ? 'Stop-Work' : 'Approved';
                            const next = riskRecords.map(item =>
                              item.id === r.id ? { ...item, status: nextStatus as any } : item
                            );
                            setRiskRecords(next);
                            safetyControlService.saveRisks(next);
                          }}
                          className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded cursor-pointer"
                        >
                          {r.status === 'Approved' ? 'Stop-Work' : 'Approve'}
                        </button>
                        <button
                          onClick={() => {
                            setEditingRisk(r);
                            setRiskForm({
                              jsaCode: r.jsaCode,
                              projectId: r.projectId,
                              activity: r.activity,
                              hazard: r.hazard,
                              initialRisk: r.initialRisk,
                              controlMeasure: r.controlMeasure,
                              residualRisk: r.residualRisk,
                              linkedPermitNo: r.linkedPermitNo,
                              owner: r.owner,
                              status: r.status
                            });
                          }}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() => {
                            const next = riskRecords.filter(item => item.id !== r.id);
                            setRiskRecords(next);
                            safetyControlService.saveRisks(next);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
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

      {/* TAB 3: SITE INSPECTIONS, SCAFFOLD TAGS & PPE STOCK - Single-Line Tables */}
      {activeTab === 'inspections' && (
        <div className="space-y-3">
          {/* Section A: Scaffold, Fire & Lifting Tag Inspections */}
          <div className="bg-white border border-slate-200/80 rounded-xl shadow-2xs overflow-hidden p-3 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ClipboardCheck size={15} className="text-emerald-600" />
                <h3 className="text-xs font-bold text-slate-900">Site Safety Tags (Scaffolds, Lifting & Fire Gear)</h3>
              </div>
              <div className="flex items-center gap-2">
                {onNavigateToPortal && (
                  <button
                    onClick={() => onNavigateToPortal('equipment-management', 'inspections')}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <Wrench size={12} />
                    <span>Machine Calibration</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    setInspForm({
                      inspCode: `TAG-SCF-${inspectionRecords.length + 105}`,
                      projectId: 'Sirius Mall Glazing',
                      category: 'Scaffold Tag',
                      location: '',
                      equipmentId: 'EQ-VAC-02',
                      tagStatus: 'Green Tag (Safe)',
                      inspector: 'Dinesh Jayawardena',
                      date: new Date().toISOString().split('T')[0],
                      finding: ''
                    });
                    setIsAddingInspection(true);
                  }}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={12} />
                  <span>Add Tag Check</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200/80 rounded-lg">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-600 uppercase whitespace-nowrap">
                    <th className="py-2 px-3">Tag Code</th>
                    <th className="py-2 px-3">Project</th>
                    <th className="py-2 px-3">Category</th>
                    <th className="py-2 px-3">Location / Bay</th>
                    <th className="py-2 px-3">Finding / Check</th>
                    <th className="py-2 px-3">Inspector</th>
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3 text-center">Tag Status</th>
                    <th className="py-2 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInspections.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50/80 whitespace-nowrap">
                      <td className="py-2 px-3 font-mono font-bold text-slate-900">{item.inspCode}</td>
                      <td className="py-2 px-3 font-mono text-[11px] text-slate-600">{item.projectId}</td>
                      <td className="py-2 px-3 font-semibold text-slate-800">{item.category}</td>
                      <td className="py-2 px-3 text-slate-700">{item.location}</td>
                      <td className="py-2 px-3 text-slate-600 max-w-[230px] truncate" title={item.finding}>
                        {item.finding}
                      </td>
                      <td className="py-2 px-3 text-slate-600">{item.inspector}</td>
                      <td className="py-2 px-3 font-mono text-[11px] text-slate-500">{item.date}</td>
                      <td className="py-2 px-3 text-center">
                        <span
                          className={cn(
                            'text-[10px] font-bold px-2 py-0.5 rounded border',
                            item.tagStatus === 'Green Tag (Safe)'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : item.tagStatus === 'Amber (Caution)'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          )}
                        >
                          {item.tagStatus}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              const nextTag =
                                item.tagStatus === 'Green Tag (Safe)'
                                  ? 'Red Tag (Do Not Use)'
                                  : 'Green Tag (Safe)';
                              const next = inspectionRecords.map(r =>
                                r.id === item.id ? { ...r, tagStatus: nextTag as any } : r
                              );
                              setInspectionRecords(next);
                              safetyControlService.saveInspections(next);
                            }}
                            className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded cursor-pointer"
                          >
                            Toggle Tag
                          </button>
                          <button
                            onClick={() => {
                              const next = inspectionRecords.filter(r => r.id !== item.id);
                              setInspectionRecords(next);
                              safetyControlService.saveInspections(next);
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
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

          {/* Section B: PPE Stock & Worker Issue Register */}
          <div className="bg-white border border-slate-200/80 rounded-xl shadow-2xs overflow-hidden p-3 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Package size={15} className="text-orange-600" />
                <h3 className="text-xs font-bold text-slate-900">PPE Stock & Worker Issue Register</h3>
              </div>
              <div className="flex items-center gap-2">
                {onNavigateToPortal && (
                  <button
                    onClick={() => onNavigateToPortal('procurement', 'pr')}
                    className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Truck size={12} />
                    <span>Order Low PPE in Procurement</span>
                  </button>
                )}
                <button
                  onClick={() => setIsAddingPpe(true)}
                  className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={12} />
                  <span>Add PPE Item</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200/80 rounded-lg">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-600 uppercase whitespace-nowrap">
                    <th className="py-2 px-3">PPE Code</th>
                    <th className="py-2 px-3">Item Name</th>
                    <th className="py-2 px-3">Category</th>
                    <th className="py-2 px-3">Standard</th>
                    <th className="py-2 px-3 text-right">Stock Qty</th>
                    <th className="py-2 px-3 text-right">Min Level</th>
                    <th className="py-2 px-3 text-right">Issued</th>
                    <th className="py-2 px-3">Last Issued To</th>
                    <th className="py-2 px-3 text-center">Status</th>
                    <th className="py-2 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ppeRecords.map(ppe => {
                    const isLow = ppe.stockQty <= ppe.minStock;
                    return (
                      <tr key={ppe.id} className="hover:bg-slate-50/80 whitespace-nowrap">
                        <td className="py-2 px-3 font-mono font-bold text-slate-900">{ppe.ppeCode}</td>
                        <td className="py-2 px-3 font-semibold text-slate-900">{ppe.itemName}</td>
                        <td className="py-2 px-3 text-slate-600">{ppe.category}</td>
                        <td className="py-2 px-3 font-mono text-[11px] text-slate-500">{ppe.standard}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">{ppe.stockQty}</td>
                        <td className="py-2 px-3 text-right font-mono text-slate-500">{ppe.minStock}</td>
                        <td className="py-2 px-3 text-right font-mono text-slate-700">{ppe.issuedCount}</td>
                        <td className="py-2 px-3 text-slate-600">{ppe.lastIssuedTo}</td>
                        <td className="py-2 px-3 text-center">
                          <span
                            className={cn(
                              'text-[10px] font-bold px-2 py-0.5 rounded border',
                              isLow
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            )}
                          >
                            {isLow ? 'Low Stock' : 'In Stock'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleIssueOnePpe(ppe.id)}
                              className="px-2 py-0.5 text-[10px] font-semibold bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded cursor-pointer"
                            >
                              Issue -1
                            </button>
                            {isLow && onNavigateToPortal && (
                              <button
                                onClick={() => onNavigateToPortal('procurement', 'pr')}
                                className="px-2 py-0.5 text-[10px] font-semibold bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded cursor-pointer"
                              >
                                Order PO
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: TOOLBOX TALKS & SITE INDUCTIONS - Single-Line Table */}
      {activeTab === 'hse' && (
        <div className="bg-white border border-slate-200/80 rounded-xl shadow-2xs overflow-hidden p-3 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
              <div className="relative flex-1 max-w-xs">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search briefing code, topic, conductor..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-slate-400"
                />
              </div>
              {onNavigateToPortal && (
                <button
                  onClick={() => onNavigateToPortal('resource-management', 'certifications')}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer"
                >
                  <Users size={12} />
                  <span>Worker Badges & Certs</span>
                </button>
              )}
            </div>

            <button
              onClick={() => {
                setEditingBrief(null);
                setBriefForm({
                  code: `TBT-2026-${safetyBriefs.length + 104}`,
                  type: 'Toolbox Talk',
                  projectId: 'Sirius Mall Glazing',
                  topic: '',
                  focus: '',
                  conductor: 'Dinesh Jayawardena',
                  attendees: 16,
                  status: 'Upcoming',
                  timing: '2026-10-15 07:45'
                });
                setIsAddingBrief(true);
              }}
              className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Plus size={13} />
              <span>Log Toolbox / Induction</span>
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200/80 rounded-lg">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-600 uppercase whitespace-nowrap">
                  <th className="py-2 px-3">Code</th>
                  <th className="py-2 px-3">Type</th>
                  <th className="py-2 px-3">Project</th>
                  <th className="py-2 px-3">Topic</th>
                  <th className="py-2 px-3">Key Control Focus</th>
                  <th className="py-2 px-3">Conductor</th>
                  <th className="py-2 px-3 text-right">Attendees</th>
                  <th className="py-2 px-3">Date / Time</th>
                  <th className="py-2 px-3 text-center">Status</th>
                  <th className="py-2 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBriefs.map(brief => (
                  <tr key={brief.id} className="hover:bg-slate-50/80 whitespace-nowrap">
                    <td className="py-2 px-3 font-mono font-bold text-slate-900">{brief.code}</td>
                    <td className="py-2 px-3">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {brief.type}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-mono text-[11px] text-slate-600">{brief.projectId}</td>
                    <td className="py-2 px-3 font-semibold text-slate-900 max-w-[210px] truncate" title={brief.topic}>
                      {brief.topic}
                    </td>
                    <td className="py-2 px-3 text-slate-600 max-w-[220px] truncate" title={brief.focus}>
                      {brief.focus}
                    </td>
                    <td className="py-2 px-3 text-slate-700">{brief.conductor}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">{brief.attendees}</td>
                    <td className="py-2 px-3 font-mono text-[11px] text-slate-500">{brief.timing}</td>
                    <td className="py-2 px-3 text-center">
                      <span
                        className={cn(
                          'text-[10px] font-semibold px-2 py-0.5 rounded border',
                          brief.status === 'Completed'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        )}
                      >
                        {brief.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {brief.status !== 'Completed' && (
                          <button
                            onClick={() =>
                              setSafetyBriefs(prev =>
                                prev.map(b => (b.id === brief.id ? { ...b, status: 'Completed' } : b))
                              )
                            }
                            className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded cursor-pointer"
                          >
                            Done
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setEditingBrief(brief);
                            setBriefForm({
                              code: brief.code,
                              type: brief.type,
                              projectId: brief.projectId,
                              topic: brief.topic,
                              focus: brief.focus,
                              conductor: brief.conductor,
                              attendees: brief.attendees,
                              status: brief.status,
                              timing: brief.timing
                            });
                          }}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() => setSafetyBriefs(prev => prev.filter(b => b.id !== brief.id))}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
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

      {/* TAB 5: INCIDENTS & 5-WHY CAPA - Single-Line Table */}
      {activeTab === 'incidents' && (
        <div className="bg-white border border-slate-200/80 rounded-xl shadow-2xs overflow-hidden p-3 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
              <div className="relative flex-1 max-w-xs">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search incident #, project, location, CAPA..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-slate-400"
                />
              </div>
              <select
                value={projectFilter}
                onChange={e => setProjectFilter(e.target.value)}
                className="bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 outline-none cursor-pointer"
              >
                <option value="All">All Projects</option>
                {uniqueProjects.map(projId => (
                  <option key={projId} value={projId}>{projId}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                setEditingIncident(null);
                setIncidentForm({
                  incidentNo: `INC-2026-00${incidentsList.length + 5}`,
                  date: new Date().toISOString().split('T')[0],
                  location: 'Level 2 Glazing Perimeter',
                  projectId: 'Sirius Mall Glazing',
                  type: 'Near Miss',
                  description: '',
                  immediateActions: '',
                  reportedBy: 'Dinesh Jayawardena',
                  status: 'Investigating'
                });
                setIsAddingIncident(true);
              }}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Plus size={13} />
              <span>Report Incident</span>
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200/80 rounded-lg">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-600 uppercase whitespace-nowrap">
                  <th className="py-2 px-3">Incident #</th>
                  <th className="py-2 px-3">Project</th>
                  <th className="py-2 px-3">Type</th>
                  <th className="py-2 px-3">Location</th>
                  <th className="py-2 px-3">Description</th>
                  <th className="py-2 px-3">5-Why CAPA / Corrective Action</th>
                  <th className="py-2 px-3">Reported By</th>
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3 text-center">Status</th>
                  <th className="py-2 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredIncidents.map(inc => (
                  <tr key={inc.id} className="hover:bg-slate-50/80 whitespace-nowrap">
                    <td className="py-2 px-3 font-mono font-bold text-slate-900">{inc.incidentNo}</td>
                    <td className="py-2 px-3 font-mono text-[11px] text-orange-700">{inc.projectId}</td>
                    <td className="py-2 px-3">
                      <span className="text-[10px] font-semibold px-2 py-0.5 bg-amber-50 text-amber-700 rounded border border-amber-200">
                        {inc.type}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-600 max-w-[140px] truncate">{inc.location}</td>
                    <td className="py-2 px-3 font-medium text-slate-900 max-w-[210px] truncate" title={inc.description}>
                      {inc.description}
                    </td>
                    <td className="py-2 px-3 text-emerald-700 max-w-[210px] truncate" title={inc.immediateActions}>
                      {inc.immediateActions}
                    </td>
                    <td className="py-2 px-3 text-slate-600">{inc.reportedBy}</td>
                    <td className="py-2 px-3 font-mono text-[11px] text-slate-500">{inc.date}</td>
                    <td className="py-2 px-3 text-center">
                      <span
                        className={cn(
                          'text-[10px] font-bold px-2 py-0.5 rounded border',
                          inc.status === 'Closed'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        )}
                      >
                        {inc.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {inc.status !== 'Closed' && (
                          <button
                            onClick={() =>
                              setIncidentsList(prev =>
                                prev.map(i => (i.id === inc.id ? { ...i, status: 'Closed' } : i))
                              )
                            }
                            className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded cursor-pointer"
                          >
                            Close CAPA
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setEditingIncident(inc);
                            setIncidentForm({
                              incidentNo: inc.incidentNo,
                              date: inc.date,
                              location: inc.location,
                              projectId: inc.projectId,
                              type: inc.type,
                              description: inc.description,
                              immediateActions: inc.immediateActions,
                              reportedBy: inc.reportedBy,
                              status: inc.status
                            });
                          }}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() => {
                            setIncidentsList(prev => prev.filter(i => i.id !== inc.id));
                            onDeleteIncident?.(inc.id);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
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

      {/* TAB 6: EMERGENCY CONTACTS & EVACUATION DRILLS - Single-Line Tables */}
      {activeTab === 'contacts' && (
        <div className="space-y-3">
          {/* 24/7 Emergency Response Roster */}
          <div className="bg-white border border-slate-200/80 rounded-xl shadow-2xs overflow-hidden p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Phone size={15} className="text-purple-600" />
                <h3 className="text-xs font-bold text-slate-900">24/7 Emergency Response Roster</h3>
              </div>
              <button
                onClick={() => {
                  setEditingContact(null);
                  setContactForm({
                    role: 'Emergency Responder',
                    name: '',
                    phone: '+94 ',
                    zone: 'All Sites',
                    available: '24/7'
                  });
                  setIsAddingContact(true);
                }}
                className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Plus size={12} />
                <span>Add Contact</span>
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200/80 rounded-lg">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-600 uppercase whitespace-nowrap">
                    <th className="py-2 px-3">Role / Designation</th>
                    <th className="py-2 px-3">Responder / Facility Name</th>
                    <th className="py-2 px-3">Direct Hotline</th>
                    <th className="py-2 px-3">Site / Zone</th>
                    <th className="py-2 px-3">Availability</th>
                    <th className="py-2 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {emergencyContacts.map(contact => (
                    <tr key={contact.id} className="hover:bg-slate-50/80 whitespace-nowrap">
                      <td className="py-2 px-3">
                        <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded">
                          {contact.role}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-semibold text-slate-900">{contact.name}</td>
                      <td className="py-2 px-3 font-mono font-bold text-orange-600">{contact.phone}</td>
                      <td className="py-2 px-3 text-slate-600">{contact.zone}</td>
                      <td className="py-2 px-3 font-mono text-[11px] text-emerald-700">{contact.available}</td>
                      <td className="py-2 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setEditingContact(contact);
                              setContactForm({
                                role: contact.role,
                                name: contact.name,
                                phone: contact.phone,
                                zone: contact.zone,
                                available: contact.available
                              });
                            }}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            onClick={() =>
                              setEmergencyContacts(prev => prev.filter(c => c.id !== contact.id))
                            }
                            className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
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

          {/* Site Evacuation & Rescue Drills Log */}
          <div className="bg-white border border-slate-200/80 rounded-xl shadow-2xs overflow-hidden p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HeartPulse size={15} className="text-rose-600" />
                <h3 className="text-xs font-bold text-slate-900">Emergency Evacuation & Rescue Drills</h3>
              </div>
              <button
                onClick={() => setIsAddingDrill(true)}
                className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Plus size={12} />
                <span>Log Evac Drill</span>
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200/80 rounded-lg">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-600 uppercase whitespace-nowrap">
                    <th className="py-2 px-3">Drill Code</th>
                    <th className="py-2 px-3">Project / Site</th>
                    <th className="py-2 px-3">Emergency Scenario</th>
                    <th className="py-2 px-3 text-right">Muster Time</th>
                    <th className="py-2 px-3 text-right">Target</th>
                    <th className="py-2 px-3">Headcount</th>
                    <th className="py-2 px-3">Commander</th>
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3 text-center">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {drillRecords.map(d => (
                    <tr key={d.id} className="hover:bg-slate-50/80 whitespace-nowrap">
                      <td className="py-2 px-3 font-mono font-bold text-slate-900">{d.drillCode}</td>
                      <td className="py-2 px-3 font-mono text-[11px] text-slate-600">{d.projectId}</td>
                      <td className="py-2 px-3 font-semibold text-slate-900">{d.scenario}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">{d.musterTimeMin} min</td>
                      <td className="py-2 px-3 text-right font-mono text-slate-500">{d.targetTimeMin} min</td>
                      <td className="py-2 px-3 font-mono text-slate-800">{d.headcountMustered}</td>
                      <td className="py-2 px-3 text-slate-600">{d.commander}</td>
                      <td className="py-2 px-3 font-mono text-[11px] text-slate-500">{d.date}</td>
                      <td className="py-2 px-3 text-center">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {d.result}
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

      {/* Modal: Add/Edit Permit */}
      {(isAddingPermit || editingPermit) && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-3.5 bg-white border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                {editingPermit ? `Edit PTW: ${editingPermit.permitNo}` : 'Issue Work Permit (PTW)'}
              </h3>
              <button onClick={() => { setIsAddingPermit(false); setEditingPermit(null); }} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={15} />
              </button>
            </div>
            <form onSubmit={handleSavePermitSubmit} className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Permit #</label>
                  <input
                    type="text"
                    required
                    value={permitForm.permitNo}
                    onChange={e => setPermitForm({ ...permitForm, permitNo: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={permitForm.status}
                    onChange={e => setPermitForm({ ...permitForm, status: e.target.value as any })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                  >
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="Expired">Expired</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Permit Scope / Type</label>
                <input
                  type="text"
                  required
                  value={permitForm.type}
                  onChange={e => setPermitForm({ ...permitForm, type: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Project</label>
                <input
                  type="text"
                  value={permitForm.projectId}
                  onChange={e => setPermitForm({ ...permitForm, projectId: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Issued Date</label>
                  <input
                    type="date"
                    value={permitForm.issuedAt}
                    onChange={e => setPermitForm({ ...permitForm, issuedAt: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Valid Until</label>
                  <input
                    type="date"
                    value={permitForm.expiresAt}
                    onChange={e => setPermitForm({ ...permitForm, expiresAt: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => { setIsAddingPermit(false); setEditingPermit(null); }} className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs">
                  Cancel
                </button>
                <button type="submit" className="px-3 py-1.5 bg-orange-600 text-white rounded-lg text-xs font-semibold">
                  Save PTW
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add/Edit Risk JSA */}
      {(isAddingRisk || editingRisk) && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-3.5 bg-white border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                {editingRisk ? `Edit JSA: ${editingRisk.jsaCode}` : 'New Job Safety Analysis (JSA)'}
              </h3>
              <button onClick={() => { setIsAddingRisk(false); setEditingRisk(null); }} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={15} />
              </button>
            </div>
            <form onSubmit={handleSaveRiskSubmit} className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">JSA Code</label>
                  <input
                    type="text"
                    required
                    value={riskForm.jsaCode}
                    onChange={e => setRiskForm({ ...riskForm, jsaCode: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Project</label>
                  <input
                    type="text"
                    value={riskForm.projectId}
                    onChange={e => setRiskForm({ ...riskForm, projectId: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Task / Activity *</label>
                <input
                  type="text"
                  required
                  value={riskForm.activity}
                  onChange={e => setRiskForm({ ...riskForm, activity: e.target.value })}
                  placeholder="e.g. Exterior Mullion Lifting"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Hazard *</label>
                <input
                  type="text"
                  required
                  value={riskForm.hazard}
                  onChange={e => setRiskForm({ ...riskForm, hazard: e.target.value })}
                  placeholder="e.g. Load swing or fall from edge"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Control Measure *</label>
                <input
                  type="text"
                  required
                  value={riskForm.controlMeasure}
                  onChange={e => setRiskForm({ ...riskForm, controlMeasure: e.target.value })}
                  placeholder="e.g. Full harness, tagline, barricade"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Risk</label>
                  <select
                    value={riskForm.initialRisk}
                    onChange={e => setRiskForm({ ...riskForm, initialRisk: e.target.value as any })}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Residual</label>
                  <select
                    value={riskForm.residualRisk}
                    onChange={e => setRiskForm({ ...riskForm, residualRisk: e.target.value as any })}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Linked PTW</label>
                  <input
                    type="text"
                    value={riskForm.linkedPermitNo}
                    onChange={e => setRiskForm({ ...riskForm, linkedPermitNo: e.target.value })}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => { setIsAddingRisk(false); setEditingRisk(null); }} className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs">
                  Cancel
                </button>
                <button type="submit" className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold">
                  Save JSA
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Site Tag Inspection */}
      {isAddingInspection && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-3.5 bg-white border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Record Safety Tag Inspection</h3>
              <button onClick={() => setIsAddingInspection(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={15} />
              </button>
            </div>
            <form onSubmit={handleSaveInspectionSubmit} className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tag Code</label>
                  <input
                    type="text"
                    value={inspForm.inspCode}
                    onChange={e => setInspForm({ ...inspForm, inspCode: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={inspForm.category}
                    onChange={e => setInspForm({ ...inspForm, category: e.target.value as any })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                  >
                    <option value="Scaffold Tag">Scaffold Tag</option>
                    <option value="Lifting & Rigging">Lifting & Rigging</option>
                    <option value="Fire Gear">Fire Gear</option>
                    <option value="Electrical Panel">Electrical Panel</option>
                    <option value="Site Walk">Site Walk</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Location / Bay *</label>
                <input
                  type="text"
                  required
                  value={inspForm.location}
                  onChange={e => setInspForm({ ...inspForm, location: e.target.value })}
                  placeholder="e.g. East Facade Bay 2"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Finding / Verification *</label>
                <input
                  type="text"
                  required
                  value={inspForm.finding}
                  onChange={e => setInspForm({ ...inspForm, finding: e.target.value })}
                  placeholder="e.g. Guardrails, outriggers and ties locked"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tag Status</label>
                  <select
                    value={inspForm.tagStatus}
                    onChange={e => setInspForm({ ...inspForm, tagStatus: e.target.value as any })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                  >
                    <option value="Green Tag (Safe)">Green Tag (Safe)</option>
                    <option value="Amber (Caution)">Amber (Caution)</option>
                    <option value="Red Tag (Do Not Use)">Red Tag (Do Not Use)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Inspector</label>
                  <input
                    type="text"
                    value={inspForm.inspector}
                    onChange={e => setInspForm({ ...inspForm, inspector: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setIsAddingInspection(false)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs">
                  Cancel
                </button>
                <button type="submit" className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold">
                  Save Tag
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add PPE Item */}
      {isAddingPpe && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-3.5 bg-white border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Add PPE Stock Item</h3>
              <button onClick={() => setIsAddingPpe(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={15} />
              </button>
            </div>
            <form onSubmit={handleSavePpeSubmit} className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">PPE Code</label>
                  <input
                    type="text"
                    value={ppeForm.ppeCode}
                    onChange={e => setPpeForm({ ...ppeForm, ppeCode: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={ppeForm.category}
                    onChange={e => setPpeForm({ ...ppeForm, category: e.target.value as any })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                  >
                    <option value="Fall Arrest">Fall Arrest</option>
                    <option value="Head & Eye">Head & Eye</option>
                    <option value="Hand & Foot">Hand & Foot</option>
                    <option value="Respiratory">Respiratory</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">PPE Item Name *</label>
                <input
                  type="text"
                  required
                  value={ppeForm.itemName}
                  onChange={e => setPpeForm({ ...ppeForm, itemName: e.target.value })}
                  placeholder="e.g. Auto-Darkening Welding Shield"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Stock Qty</label>
                  <input
                    type="number"
                    value={ppeForm.stockQty}
                    onChange={e => setPpeForm({ ...ppeForm, stockQty: Number(e.target.value) })}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Min Qty</label>
                  <input
                    type="number"
                    value={ppeForm.minStock}
                    onChange={e => setPpeForm({ ...ppeForm, minStock: Number(e.target.value) })}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Standard</label>
                  <input
                    type="text"
                    value={ppeForm.standard}
                    onChange={e => setPpeForm({ ...ppeForm, standard: e.target.value })}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setIsAddingPpe(false)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs">
                  Cancel
                </button>
                <button type="submit" className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold">
                  Save PPE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add/Edit Incident */}
      {(isAddingIncident || editingIncident) && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-3.5 bg-white border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                {editingIncident ? `Edit Incident: ${editingIncident.incidentNo}` : 'Report Incident / Near-Miss'}
              </h3>
              <button onClick={() => { setIsAddingIncident(false); setEditingIncident(null); }} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={15} />
              </button>
            </div>
            <form onSubmit={handleSaveIncidentSubmit} className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Incident #</label>
                  <input
                    type="text"
                    value={incidentForm.incidentNo}
                    onChange={e => setIncidentForm({ ...incidentForm, incidentNo: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Type</label>
                  <select
                    value={incidentForm.type}
                    onChange={e => setIncidentForm({ ...incidentForm, type: e.target.value as any })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                  >
                    <option value="Near Miss">Near Miss</option>
                    <option value="First Aid">First Aid</option>
                    <option value="Medical Treatment">Medical Treatment</option>
                    <option value="Lost Time Injury">Lost Time Injury</option>
                    <option value="Property Damage">Property Damage</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Project</label>
                  <input
                    type="text"
                    value={incidentForm.projectId}
                    onChange={e => setIncidentForm({ ...incidentForm, projectId: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={incidentForm.location}
                    onChange={e => setIncidentForm({ ...incidentForm, location: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description *</label>
                <input
                  type="text"
                  required
                  value={incidentForm.description}
                  onChange={e => setIncidentForm({ ...incidentForm, description: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">5-Why Root Cause & CAPA Action</label>
                <input
                  type="text"
                  value={incidentForm.immediateActions}
                  onChange={e => setIncidentForm({ ...incidentForm, immediateActions: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => { setIsAddingIncident(false); setEditingIncident(null); }} className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs">
                  Cancel
                </button>
                <button type="submit" className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold">
                  Save Incident
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add/Edit Toolbox Brief / Induction */}
      {(isAddingBrief || editingBrief) && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-3.5 bg-white border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                {editingBrief ? 'Edit Briefing' : 'Log Toolbox Talk / Induction'}
              </h3>
              <button onClick={() => { setIsAddingBrief(false); setEditingBrief(null); }} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={15} />
              </button>
            </div>
            <form onSubmit={handleSaveBriefSubmit} className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Code</label>
                  <input
                    type="text"
                    value={briefForm.code}
                    onChange={e => setBriefForm({ ...briefForm, code: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Type</label>
                  <select
                    value={briefForm.type}
                    onChange={e => setBriefForm({ ...briefForm, type: e.target.value as any })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                  >
                    <option value="Toolbox Talk">Toolbox Talk</option>
                    <option value="Site Induction">Site Induction</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Topic *</label>
                <input
                  type="text"
                  required
                  value={briefForm.topic}
                  onChange={e => setBriefForm({ ...briefForm, topic: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Control Focus</label>
                <input
                  type="text"
                  value={briefForm.focus}
                  onChange={e => setBriefForm({ ...briefForm, focus: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Attendees</label>
                  <input
                    type="number"
                    value={briefForm.attendees}
                    onChange={e => setBriefForm({ ...briefForm, attendees: Number(e.target.value) })}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date/Time</label>
                  <input
                    type="text"
                    value={briefForm.timing}
                    onChange={e => setBriefForm({ ...briefForm, timing: e.target.value })}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={briefForm.status}
                    onChange={e => setBriefForm({ ...briefForm, status: e.target.value as any })}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                  >
                    <option value="Completed">Completed</option>
                    <option value="Upcoming">Upcoming</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => { setIsAddingBrief(false); setEditingBrief(null); }} className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs">
                  Cancel
                </button>
                <button type="submit" className="px-3 py-1.5 bg-orange-600 text-white rounded-lg text-xs font-semibold">
                  Save Briefing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add/Edit Contact */}
      {(isAddingContact || editingContact) && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-3.5 bg-white border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                {editingContact ? 'Edit Emergency Contact' : 'Add Emergency Contact'}
              </h3>
              <button onClick={() => { setIsAddingContact(false); setEditingContact(null); }} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={15} />
              </button>
            </div>
            <form onSubmit={handleSaveContactSubmit} className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Role *</label>
                <input
                  type="text"
                  required
                  value={contactForm.role}
                  onChange={e => setContactForm({ ...contactForm, role: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Name / Facility *</label>
                <input
                  type="text"
                  required
                  value={contactForm.name}
                  onChange={e => setContactForm({ ...contactForm, name: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Hotline Phone *</label>
                  <input
                    type="text"
                    required
                    value={contactForm.phone}
                    onChange={e => setContactForm({ ...contactForm, phone: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Availability</label>
                  <input
                    type="text"
                    value={contactForm.available}
                    onChange={e => setContactForm({ ...contactForm, available: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => { setIsAddingContact(false); setEditingContact(null); }} className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs">
                  Cancel
                </button>
                <button type="submit" className="px-3 py-1.5 bg-orange-600 text-white rounded-lg text-xs font-semibold">
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Log Evacuation Drill */}
      {isAddingDrill && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-3.5 bg-white border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Log Emergency Evacuation Drill</h3>
              <button onClick={() => setIsAddingDrill(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={15} />
              </button>
            </div>
            <form onSubmit={handleSaveDrillSubmit} className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Drill Code</label>
                  <input
                    type="text"
                    value={drillForm.drillCode}
                    onChange={e => setDrillForm({ ...drillForm, drillCode: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Project / Site</label>
                  <input
                    type="text"
                    value={drillForm.projectId}
                    onChange={e => setDrillForm({ ...drillForm, projectId: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Emergency Scenario *</label>
                <input
                  type="text"
                  required
                  value={drillForm.scenario}
                  onChange={e => setDrillForm({ ...drillForm, scenario: e.target.value })}
                  placeholder="e.g. Full Site Fire Alarm & Muster Count"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Muster (min)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={drillForm.musterTimeMin}
                    onChange={e => setDrillForm({ ...drillForm, musterTimeMin: Number(e.target.value) })}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Headcount</label>
                  <input
                    type="text"
                    value={drillForm.headcountMustered}
                    onChange={e => setDrillForm({ ...drillForm, headcountMustered: e.target.value })}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={drillForm.date}
                    onChange={e => setDrillForm({ ...drillForm, date: e.target.value })}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setIsAddingDrill(false)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs">
                  Cancel
                </button>
                <button type="submit" className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold">
                  Save Drill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
