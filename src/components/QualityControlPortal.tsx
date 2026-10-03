import React, { useState, useMemo, useEffect } from 'react';
import {
  ClipboardCheck,
  AlertTriangle,
  Search,
  Plus,
  X,
  Trash2,
  Edit2,
  ShieldCheck,
  Folder,
  LayoutDashboard,
  PackageCheck,
  FlaskConical,
  Gauge,
  Medal,
  Truck,
  Wrench,
  HardHat,
  Cpu
} from 'lucide-react';
import { NonConformanceReport, InspectionResult, Project, Quote } from '../types';
import { cn } from '../lib/utils';
import { ExportActions } from './common/ExportActions';
import { downloadCSV, downloadPDFTable } from '../services/dataExportService';
import { QualityLandingPage, QualityTab } from './quality/QualityLandingPage';
import {
  qualityControlService,
  IqcMaterialRecord,
  QualityLabTestRecord,
  GaugeCalibrationRecord,
  QaHandoverDossierRecord
} from '../services/qualityControlService';

interface QualityStandardItem {
  id: string;
  code: string;
  domain: string;
  title: string;
  req: string;
  auditStatus: 'Compliant' | 'Review';
}

interface QualityControlPortalProps {
  inspectionResults?: InspectionResult[];
  ncrs?: NonConformanceReport[];
  projects?: Project[];
  quotes?: Quote[];
  initialTab?: QualityTab;
  onTabChange?: (tab: QualityTab) => void;
  onSaveInspection?: (inspection: InspectionResult) => void;
  onDeleteInspection?: (id: string) => void;
  onSaveNcr?: (ncr: NonConformanceReport) => void;
  onDeleteNcr?: (id: string) => void;
  onNavigateToPortal?: (portalView: string, subTab?: string) => void;
}

export const QualityControlPortal: React.FC<QualityControlPortalProps> = ({
  inspectionResults,
  ncrs,
  projects = [],
  quotes = [],
  initialTab = 'landing',
  onTabChange,
  onSaveInspection,
  onDeleteInspection,
  onSaveNcr,
  onDeleteNcr,
  onNavigateToPortal
}) => {
  const [activeTab, setActiveTab] = useState<QualityTab>(initialTab || 'landing');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<'All' | 'Critical' | 'Major' | 'Minor'>('All');
  const [projectFilter, setProjectFilter] = useState('All');

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  // Persistent IQC, Lab Tests, Gauges & Handover Dossiers
  const [iqcRecords, setIqcRecords] = useState<IqcMaterialRecord[]>(() =>
    qualityControlService.getIqcRecords()
  );
  const [labTests, setLabTests] = useState<QualityLabTestRecord[]>(() =>
    qualityControlService.getLabTests()
  );
  const [gaugeRecords, setGaugeRecords] = useState<GaugeCalibrationRecord[]>(() =>
    qualityControlService.getGauges()
  );
  const [dossierRecords, setDossierRecords] = useState<QaHandoverDossierRecord[]>(() =>
    qualityControlService.getDossiers()
  );

  // Real state for interactive ITP inspections
  const [inspectionsList, setInspectionsList] = useState<InspectionResult[]>(() => {
    if (inspectionResults && inspectionResults.length > 0) return inspectionResults;
    return [
      {
        id: 'ITP-2026-101',
        checklistId: 'cl-1',
        projectId: 'p1',
        stage: 'Powder Coating & Anodizing Thickness (Hold Point)',
        inspector: 'Marcus Silva (QA Lead)',
        date: '2026-10-14',
        overallStatus: 'Passed',
        itemResults: [
          { itemId: 'i1', status: 'Pass', measurement: '78 µm (Min req 60 µm) • Adhesion Grade 0' }
        ]
      },
      {
        id: 'ITP-2026-102',
        checklistId: 'cl-2',
        projectId: 'p2',
        stage: 'Curtain Wall Transom Seal & EPDM Gasket Compression',
        inspector: 'Kavindi Perera',
        date: '2026-10-13',
        overallStatus: 'Passed with Observations',
        itemResults: [
          { itemId: 'i4', status: 'Pass', measurement: 'EPDM 65 Shore A • Minor corner bead touch-up' }
        ]
      },
      {
        id: 'ITP-2026-103',
        checklistId: 'cl-3',
        projectId: 'p3',
        stage: '12mm Toughened Glass Edge Polish & Bow Tolerance',
        inspector: 'Marcus Silva (QA Lead)',
        date: '2026-10-11',
        overallStatus: 'Passed',
        itemResults: [
          { itemId: 'i6', status: 'Pass', measurement: 'Surface 110 MPa • Local bow 0.2mm/300mm' }
        ]
      },
      {
        id: 'ITP-2026-104',
        checklistId: 'cl-4',
        projectId: 'p1',
        stage: 'Site Mullion Plumb, Level & Bracket Torque Check',
        inspector: 'Kavindi Perera',
        date: '2026-10-10',
        overallStatus: 'Passed',
        itemResults: [
          { itemId: 'i8', status: 'Pass', measurement: 'Laser plumb ±1.0mm • M12 anchors torqued 65 Nm' }
        ]
      }
    ];
  });

  useEffect(() => {
    if (inspectionResults && inspectionResults.length > 0) {
      setInspectionsList(inspectionResults);
    }
  }, [inspectionResults]);

  const [ncrList, setNcrList] = useState<NonConformanceReport[]>(() => {
    if (ncrs && ncrs.length > 0) return ncrs;
    return [
      {
        id: 'ncr-101',
        ncrNumber: 'NCR-2026-042',
        source: 'Inspection',
        projectId: 'p2',
        description: 'Extrusion anodizing shade variance (> ΔE 1.5) on batch 3 mullions',
        severity: 'Major',
        rootCause: 'Chemical bath temperature drop during night shift production',
        correctiveAction: 'Quarantine batch & raise Vendor Debit Note for re-anodizing',
        status: 'Investigating',
        assignedTo: 'Dhammika Bandara',
        targetDate: '2026-10-20'
      },
      {
        id: 'ncr-102',
        ncrNumber: 'NCR-2026-039',
        source: 'Staff',
        projectId: 'p1',
        description: 'Floor 2 sliding sash roller bearing friction exceeds 25N limit',
        severity: 'Minor',
        rootCause: 'Aluminium swarf debris inside stainless steel track cavity',
        correctiveAction: 'Vacuum flush track cavity & lubricate rollers with PTFE',
        status: 'Resolved',
        assignedTo: 'Nimal Jayasuriya',
        targetDate: '2026-10-15'
      },
      {
        id: 'ncr-103',
        ncrNumber: 'NCR-2026-044',
        source: 'Inspection',
        projectId: 'p1',
        description: 'Powder batch LOT-PW-1190 RAL 7016 gloss reading 44 GU (Spec 30±5 GU)',
        severity: 'Major',
        rootCause: 'Curing oven zone-2 thermocouple drift (+12°C)',
        correctiveAction: 'Hold 18 boxes in quarantine bay & recalibrate oven sensor',
        status: 'Investigating',
        assignedTo: 'Marcus Silva',
        targetDate: '2026-10-19'
      }
    ];
  });

  useEffect(() => {
    if (ncrs && ncrs.length > 0) {
      setNcrList(ncrs);
    }
  }, [ncrs]);

  const [standards, setStandards] = useState<QualityStandardItem[]>([
    {
      id: 's1',
      code: 'SLS 1410 / EN 755',
      domain: 'Aluminium Profiles',
      title: 'Architectural Aluminium Extrusion Alloy & Wall Tolerance',
      req: '6063-T6 tensile yield >= 160 MPa • Wall tolerance ±0.15mm • Webster >= 12 HW',
      auditStatus: 'Compliant'
    },
    {
      id: 's2',
      code: 'BS EN 12150-1',
      domain: 'Safety Glazing',
      title: 'Thermally Toughened Soda Lime Silicate Safety Glass',
      req: 'Fragmentation count >= 40 particles per 50x50mm • Surface compression >= 90 MPa',
      auditStatus: 'Compliant'
    },
    {
      id: 's3',
      code: 'Qualicoat Class 2',
      domain: 'Surface Coating',
      title: 'Architectural Powder Coating DFT & Adhesion Standard',
      req: 'Min average DFT >= 60 µm • Cross-hatch adhesion ISO 2409 Grade 0',
      auditStatus: 'Compliant'
    },
    {
      id: 's4',
      code: 'BS 6375-1 / AAMA 501.2',
      domain: 'Weather Tightness',
      title: 'Curtain Wall & Window Water Ingress & Air Permeability',
      req: 'Static pressure 600 Pa & nozzle spray 240 kPa for 5 min with zero interior leak',
      auditStatus: 'Compliant'
    },
    {
      id: 's5',
      code: 'ASTM C794 / C1184',
      domain: 'Structural Silicone',
      title: 'Structural Glazing Sealant Adhesion & Peel Strength',
      req: 'Peel strength >= 35 N/mm with 100% cohesive failure (CF) on anodized substrate',
      auditStatus: 'Compliant'
    }
  ]);

  // Modal states for CRUD
  const [editingInspection, setEditingInspection] = useState<InspectionResult | null>(null);
  const [isAddingInspection, setIsAddingInspection] = useState(false);

  const [editingIqc, setEditingIqc] = useState<IqcMaterialRecord | null>(null);
  const [isAddingIqc, setIsAddingIqc] = useState(false);

  const [editingTest, setEditingTest] = useState<QualityLabTestRecord | null>(null);
  const [isAddingTest, setIsAddingTest] = useState(false);

  const [editingNcr, setEditingNcr] = useState<NonConformanceReport | null>(null);
  const [isAddingNcr, setIsAddingNcr] = useState(false);

  const [editingGauge, setEditingGauge] = useState<GaugeCalibrationRecord | null>(null);
  const [isAddingGauge, setIsAddingGauge] = useState(false);

  const [editingStandard, setEditingStandard] = useState<QualityStandardItem | null>(null);
  const [isAddingStandard, setIsAddingStandard] = useState(false);

  const [isAddingDossier, setIsAddingDossier] = useState(false);

  // Form states
  const [inspectionForm, setInspectionForm] = useState({
    projectId: 'p1',
    stage: '',
    inspector: 'Marcus Silva (QA Lead)',
    date: new Date().toISOString().split('T')[0],
    overallStatus: 'Passed' as InspectionResult['overallStatus'],
    measurement: ''
  });

  const [iqcForm, setIqcForm] = useState({
    iqcCode: 'IQC-2026-105',
    projectId: 'p1',
    supplier: 'Alumex Extrusions PLC',
    poRef: 'PO-2026-098',
    materialName: '',
    category: 'Aluminium Profile' as IqcMaterialRecord['category'],
    batchLotNo: 'LOT-AL-9012',
    mtcCertNo: 'MTC-2026-501',
    qtyChecked: '100 Units',
    keyCheck: '',
    inspector: 'Marcus Silva',
    date: new Date().toISOString().split('T')[0],
    status: 'Accepted' as IqcMaterialRecord['status']
  });

  const [testForm, setTestForm] = useState({
    testCode: 'TST-DFT-205',
    projectId: 'p1',
    testType: 'DFT Micron Test' as QualityLabTestRecord['testType'],
    sampleRef: '',
    standardCode: 'Qualicoat Class 2',
    requiredSpec: 'Min 60 µm average',
    actualReading: '',
    testedBy: 'Marcus Silva',
    date: new Date().toISOString().split('T')[0],
    result: 'Pass' as QualityLabTestRecord['result']
  });

  const [ncrForm, setNcrForm] = useState({
    ncrNumber: '',
    projectId: 'p1',
    description: '',
    severity: 'Major' as 'Critical' | 'Major' | 'Minor',
    rootCause: '',
    correctiveAction: '',
    status: 'Investigating' as NonConformanceReport['status'],
    assignedTo: 'Marcus Silva',
    targetDate: new Date().toISOString().split('T')[0]
  });

  const [gaugeForm, setGaugeForm] = useState({
    gaugeCode: 'CAL-GAU-05',
    instrumentName: '',
    category: 'Coating DFT' as GaugeCalibrationRecord['category'],
    serialNo: 'SN-2026-880',
    accuracyRange: '0 - 1000 µm (±1%)',
    calibratedAt: new Date().toISOString().split('T')[0],
    dueDate: '2027-09-26',
    certNumber: 'SLSI-CAL-2026-998',
    custodian: 'Marcus Silva',
    status: 'Calibrated' as GaugeCalibrationRecord['status']
  });

  const [standardForm, setStandardForm] = useState({
    code: '',
    domain: 'Aluminium Profiles',
    title: '',
    req: '',
    auditStatus: 'Compliant' as 'Compliant' | 'Review'
  });

  const [dossierForm, setDossierForm] = useState({
    dossierCode: 'QAD-2026-014',
    projectId: 'p1',
    packageScope: '',
    itpSignedCount: '12 / 12 Hold Points',
    mtcVerified: true,
    openSnags: 0,
    qaEngineer: 'Marcus Silva',
    handoverDate: new Date().toISOString().split('T')[0],
    status: 'Signed Off' as QaHandoverDossierRecord['status']
  });

  const getProjectCodeLabel = (projId: string) => {
    const targetProj = projects.find(p => p.id === projId || p.projectCode === projId);
    return targetProj?.projectCode || projId || 'PRJ-2026-001';
  };

  // Filtered lists
  const filteredInspections = useMemo(() => {
    return inspectionsList.filter(i => {
      const pCode = getProjectCodeLabel(i.projectId);
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        i.id.toLowerCase().includes(q) ||
        i.stage.toLowerCase().includes(q) ||
        i.inspector.toLowerCase().includes(q) ||
        pCode.toLowerCase().includes(q);
      const matchesProject =
        projectFilter === 'All' || i.projectId === projectFilter || pCode === projectFilter;
      return matchesSearch && matchesProject;
    });
  }, [inspectionsList, searchQuery, projectFilter, projects]);

  const filteredIqc = useMemo(() => {
    return iqcRecords.filter(r => {
      const pCode = getProjectCodeLabel(r.projectId);
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        r.iqcCode.toLowerCase().includes(q) ||
        r.materialName.toLowerCase().includes(q) ||
        r.supplier.toLowerCase().includes(q) ||
        r.batchLotNo.toLowerCase().includes(q) ||
        r.mtcCertNo.toLowerCase().includes(q) ||
        pCode.toLowerCase().includes(q);
      const matchesProject =
        projectFilter === 'All' || r.projectId === projectFilter || pCode === projectFilter;
      return matchesSearch && matchesProject;
    });
  }, [iqcRecords, searchQuery, projectFilter, projects]);

  const filteredTests = useMemo(() => {
    return labTests.filter(t => {
      const pCode = getProjectCodeLabel(t.projectId);
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        t.testCode.toLowerCase().includes(q) ||
        t.testType.toLowerCase().includes(q) ||
        t.sampleRef.toLowerCase().includes(q) ||
        t.standardCode.toLowerCase().includes(q) ||
        pCode.toLowerCase().includes(q);
      const matchesProject =
        projectFilter === 'All' || t.projectId === projectFilter || pCode === projectFilter;
      return matchesSearch && matchesProject;
    });
  }, [labTests, searchQuery, projectFilter, projects]);

  const filteredNcrs = useMemo(() => {
    return ncrList.filter(n => {
      const pCode = getProjectCodeLabel(n.projectId);
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        n.description.toLowerCase().includes(q) ||
        n.ncrNumber.toLowerCase().includes(q) ||
        pCode.toLowerCase().includes(q) ||
        (n.assignedTo && n.assignedTo.toLowerCase().includes(q));
      const matchSeverity = selectedSeverity === 'All' || n.severity === selectedSeverity;
      const matchesProject =
        projectFilter === 'All' || n.projectId === projectFilter || pCode === projectFilter;
      return matchSearch && matchSeverity && matchesProject;
    });
  }, [ncrList, searchQuery, selectedSeverity, projectFilter, projects]);

  const filteredGauges = useMemo(() => {
    return gaugeRecords.filter(g => {
      const q = searchQuery.toLowerCase().trim();
      return (
        !q ||
        g.gaugeCode.toLowerCase().includes(q) ||
        g.instrumentName.toLowerCase().includes(q) ||
        g.serialNo.toLowerCase().includes(q) ||
        g.certNumber.toLowerCase().includes(q) ||
        g.custodian.toLowerCase().includes(q)
      );
    });
  }, [gaugeRecords, searchQuery]);

  // Handlers
  const handleSaveInspectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectionForm.stage.trim()) return;

    if (editingInspection) {
      const updated: InspectionResult = {
        ...editingInspection,
        projectId: inspectionForm.projectId,
        stage: inspectionForm.stage,
        inspector: inspectionForm.inspector,
        date: inspectionForm.date,
        overallStatus: inspectionForm.overallStatus,
        itemResults: inspectionForm.measurement
          ? [
              {
                itemId: `i-${Date.now()}`,
                status: inspectionForm.overallStatus === 'Passed' ? 'Pass' : 'Fail',
                measurement: inspectionForm.measurement
              }
            ]
          : editingInspection.itemResults
      };
      setInspectionsList(prev => prev.map(i => (i.id === updated.id ? updated : i)));
      onSaveInspection?.(updated);
      setEditingInspection(null);
    } else {
      const newInsp: InspectionResult = {
        id: `ITP-2026-${inspectionsList.length + 105}`,
        checklistId: `cl-${Date.now()}`,
        projectId: inspectionForm.projectId || 'p1',
        stage: inspectionForm.stage,
        inspector: inspectionForm.inspector || 'Marcus Silva',
        date: inspectionForm.date,
        overallStatus: inspectionForm.overallStatus,
        itemResults: [
          {
            itemId: `i-${Date.now()}`,
            status: inspectionForm.overallStatus === 'Passed' ? 'Pass' : 'Fail',
            measurement: inspectionForm.measurement || 'Standard tolerance verified'
          }
        ]
      };
      setInspectionsList(prev => [newInsp, ...prev]);
      onSaveInspection?.(newInsp);
      setIsAddingInspection(false);
    }
  };

  const handleSaveIqcSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!iqcForm.materialName.trim()) return;

    if (editingIqc) {
      const next = iqcRecords.map(r => (r.id === editingIqc.id ? { ...editingIqc, ...iqcForm } : r));
      setIqcRecords(next);
      qualityControlService.saveIqcRecords(next);
      setEditingIqc(null);
    } else {
      const created: IqcMaterialRecord = {
        id: `iqc-${Date.now()}`,
        ...iqcForm
      };
      const next = [created, ...iqcRecords];
      setIqcRecords(next);
      qualityControlService.saveIqcRecords(next);
      setIsAddingIqc(false);
    }
  };

  const handleSaveTestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testForm.sampleRef.trim()) return;

    if (editingTest) {
      const next = labTests.map(t => (t.id === editingTest.id ? { ...editingTest, ...testForm } : t));
      setLabTests(next);
      qualityControlService.saveLabTests(next);
      setEditingTest(null);
    } else {
      const created: QualityLabTestRecord = {
        id: `tst-${Date.now()}`,
        ...testForm
      };
      const next = [created, ...labTests];
      setLabTests(next);
      qualityControlService.saveLabTests(next);
      setIsAddingTest(false);
    }
  };

  const handleSaveNcrSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ncrForm.description.trim()) return;

    if (editingNcr) {
      const updated: NonConformanceReport = {
        ...editingNcr,
        projectId: ncrForm.projectId,
        ncrNumber: ncrForm.ncrNumber || editingNcr.ncrNumber,
        description: ncrForm.description,
        severity: ncrForm.severity,
        rootCause: ncrForm.rootCause,
        correctiveAction: ncrForm.correctiveAction,
        status: ncrForm.status,
        assignedTo: ncrForm.assignedTo,
        targetDate: ncrForm.targetDate
      };
      setNcrList(prev => prev.map(n => (n.id === updated.id ? updated : n)));
      onSaveNcr?.(updated);
      setEditingNcr(null);
    } else {
      const newNcr: NonConformanceReport = {
        id: `ncr-${Date.now()}`,
        ncrNumber: ncrForm.ncrNumber || `NCR-2026-0${ncrList.length + 45}`,
        source: 'Inspection',
        projectId: ncrForm.projectId || 'p1',
        description: ncrForm.description,
        severity: ncrForm.severity,
        rootCause: ncrForm.rootCause || 'Under investigation',
        correctiveAction: ncrForm.correctiveAction || 'Quarantine & engineering review',
        status: ncrForm.status,
        assignedTo: ncrForm.assignedTo || 'Marcus Silva',
        targetDate: ncrForm.targetDate
      };
      setNcrList(prev => [newNcr, ...prev]);
      onSaveNcr?.(newNcr);
      setIsAddingNcr(false);
    }
  };

  const handleSaveGaugeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gaugeForm.instrumentName.trim()) return;

    if (editingGauge) {
      const next = gaugeRecords.map(g =>
        g.id === editingGauge.id ? { ...editingGauge, ...gaugeForm } : g
      );
      setGaugeRecords(next);
      qualityControlService.saveGauges(next);
      setEditingGauge(null);
    } else {
      const created: GaugeCalibrationRecord = {
        id: `cal-${Date.now()}`,
        ...gaugeForm
      };
      const next = [created, ...gaugeRecords];
      setGaugeRecords(next);
      qualityControlService.saveGauges(next);
      setIsAddingGauge(false);
    }
  };

  const handleSaveStandardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!standardForm.code.trim() || !standardForm.title.trim()) return;

    if (editingStandard) {
      setStandards(prev =>
        prev.map(s => (s.id === editingStandard.id ? { ...s, ...standardForm } : s))
      );
      setEditingStandard(null);
    } else {
      setStandards(prev => [...prev, { id: `s-${Date.now()}`, ...standardForm }]);
      setIsAddingStandard(false);
    }
  };

  const handleSaveDossierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dossierForm.packageScope.trim()) return;
    const created: QaHandoverDossierRecord = {
      id: `dos-${Date.now()}`,
      ...dossierForm,
      openSnags: Number(dossierForm.openSnags)
    };
    const next = [created, ...dossierRecords];
    setDossierRecords(next);
    qualityControlService.saveDossiers(next);
    setIsAddingDossier(false);
  };

  const handleExportCSV = () => {
    if (activeTab === 'ncrs') {
      const headers = ['NCR No', 'Project', 'Description', 'Severity', 'Root Cause', 'Corrective Action', 'Status'];
      const rows = filteredNcrs.map(n => [
        `"${n.ncrNumber || n.id}"`,
        `"${getProjectCodeLabel(n.projectId)}"`,
        `"${n.description.replace(/"/g, '""')}"`,
        `"${n.severity}"`,
        `"${(n.rootCause || '').replace(/"/g, '""')}"`,
        `"${(n.correctiveAction || '').replace(/"/g, '""')}"`,
        `"${n.status}"`
      ]);
      downloadCSV(`qc-ncrs-${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
    } else if (activeTab === 'iqc') {
      const headers = ['IQC Code', 'Supplier', 'PO Ref', 'Material', 'Batch Lot', 'MTC Cert', 'Status'];
      const rows = filteredIqc.map(r => [
        `"${r.iqcCode}"`,
        `"${r.supplier}"`,
        `"${r.poRef}"`,
        `"${r.materialName}"`,
        `"${r.batchLotNo}"`,
        `"${r.mtcCertNo}"`,
        `"${r.status}"`
      ]);
      downloadCSV(`qc-iqc-${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
    } else {
      const headers = ['Inspection ID', 'Stage', 'Inspector', 'Date', 'Status'];
      const rows = inspectionsList.map(i => [
        `"${i.id}"`,
        `"${i.stage.replace(/"/g, '""')}"`,
        `"${i.inspector}"`,
        `"${i.date}"`,
        `"${i.overallStatus}"`
      ]);
      downloadCSV(`qc-inspections-${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
    }
  };

  const handleExportPDF = () => {
    if (activeTab === 'ncrs') {
      const headers = ['NCR #', 'Description', 'Severity', 'Target Date', 'Status'];
      const rows = filteredNcrs.map(n => [
        n.ncrNumber || n.id,
        n.description,
        n.severity,
        n.targetDate || '',
        n.status
      ]);
      downloadPDFTable(
        'Non-Conformance Report (NCR) Register',
        headers,
        rows,
        'qc-ncrs.pdf',
        'Active quality discrepancies and CAPA actions'
      );
    } else {
      const headers = ['ITP ID', 'Inspection Stage', 'Inspector', 'Date', 'Status'];
      const rows = inspectionsList.map(i => [i.id, i.stage, i.inspector, i.date, i.overallStatus]);
      downloadPDFTable(
        'Quality Assurance & ITP Register',
        headers,
        rows,
        'qc-inspections.pdf',
        'Summary of verified fabrication and site glazing hold points'
      );
    }
  };

  const openNcrCount = ncrList.filter(n => n.status !== 'Closed' && n.status !== 'Resolved').length;

  return (
    <div className="space-y-2.5 pb-8">
      {/* Minimal White Header Bar with Simple Words & Cross-Portal Links */}
      <header className="px-4 py-2.5 bg-white border border-slate-200/80 rounded-xl shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-orange-500 text-white flex items-center justify-center shrink-0">
              <ShieldCheck size={15} />
            </div>
            <h1 className="text-sm font-bold text-slate-900">Quality Control & QA Hub</h1>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              98.8% Pass • ISO 9001
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
                  onClick={() => onNavigateToPortal('procurement', 'grn')}
                  className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  title="Open Procurement GRN & Vendor Returns"
                >
                  <Truck size={11} className="text-purple-600" />
                  <span>Procurement</span>
                </button>
                <button
                  onClick={() => onNavigateToPortal('operational-control', 'shop_floor')}
                  className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  title="Open Shop Floor Fabrication QC"
                >
                  <Cpu size={11} className="text-blue-600" />
                  <span>Shop Floor</span>
                </button>
                <button
                  onClick={() => onNavigateToPortal('equipment-management', 'inspections')}
                  className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  title="Open Equipment Calibration & Inspections"
                >
                  <Wrench size={11} className="text-teal-600" />
                  <span>Equipment</span>
                </button>
                <button
                  onClick={() => onNavigateToPortal('site-management', 'inspections')}
                  className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  title="Open Safety & HSE Portal"
                >
                  <HardHat size={11} className="text-amber-600" />
                  <span>Safety</span>
                </button>
                <button
                  onClick={() => onNavigateToPortal('after-sales', 'certificates')}
                  className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  title="Open Warranty Certificates"
                >
                  <Medal size={11} className="text-emerald-600" />
                  <span>Warranty</span>
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
          { id: 'inspections', label: '1. QC Inspections (ITP)', icon: ClipboardCheck, badge: inspectionsList.length },
          { id: 'iqc', label: '2. Incoming QC (IQC)', icon: PackageCheck, badge: iqcRecords.length },
          { id: 'testing', label: '3. Lab & Water Tests', icon: FlaskConical, badge: labTests.length },
          { id: 'ncrs', label: '4. NCR & Quarantine', icon: AlertTriangle, badge: ncrList.length },
          { id: 'calibration', label: '5. Gauge Calibration', icon: Gauge, badge: gaugeRecords.length },
          { id: 'standards', label: '6. Standards & Handover', icon: Medal, badge: standards.length }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              const nextTab = tab.id as QualityTab;
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
            <span className="text-[11px] text-slate-500">First-Pass Yield</span>
            <span className="text-xs font-bold text-emerald-600 font-mono">98.8%</span>
          </div>
          <div className="bg-white border border-slate-200/80 rounded-xl px-3 py-2 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">ITP Checks</span>
            <span className="text-xs font-bold text-slate-900 font-mono">{inspectionsList.length}</span>
          </div>
          <div className="bg-white border border-slate-200/80 rounded-xl px-3 py-2 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">IQC Batches</span>
            <span className="text-xs font-bold text-blue-600 font-mono">
              {iqcRecords.filter(r => r.status === 'Accepted').length}/{iqcRecords.length}
            </span>
          </div>
          <div className="bg-white border border-slate-200/80 rounded-xl px-3 py-2 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">Lab & Site Tests</span>
            <span className="text-xs font-bold text-emerald-600 font-mono">
              {labTests.filter(t => t.result === 'Pass').length} Pass
            </span>
          </div>
          <div className="bg-white border border-slate-200/80 rounded-xl px-3 py-2 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">Open NCRs</span>
            <span
              className={cn(
                'text-xs font-bold font-mono',
                openNcrCount > 0 ? 'text-amber-600' : 'text-emerald-600'
              )}
            >
              {openNcrCount}
            </span>
          </div>
          <div className="bg-white border border-slate-200/80 rounded-xl px-3 py-2 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">Valid Gauges</span>
            <span className="text-xs font-bold text-teal-600 font-mono">
              {gaugeRecords.filter(g => g.status === 'Calibrated').length}/{gaugeRecords.length}
            </span>
          </div>
        </div>
      )}

      {/* TAB 0: COMMAND HUB */}
      {activeTab === 'landing' && (
        <QualityLandingPage
          inspectionResults={inspectionsList}
          ncrs={ncrList}
          iqcRecords={iqcRecords}
          labTests={labTests}
          gaugeRecords={gaugeRecords}
          dossierRecords={dossierRecords}
          projects={projects}
          quotes={quotes}
          onNavigateTab={t => {
            setActiveTab(t);
            onTabChange?.(t);
          }}
          onOpenAddInspection={() => {
            setEditingInspection(null);
            setIsAddingInspection(true);
          }}
          onOpenAddIqc={() => {
            setEditingIqc(null);
            setIsAddingIqc(true);
          }}
          onOpenAddTest={() => {
            setEditingTest(null);
            setIsAddingTest(true);
          }}
          onOpenAddNcr={() => {
            setEditingNcr(null);
            setIsAddingNcr(true);
          }}
          onOpenAddGauge={() => {
            setEditingGauge(null);
            setIsAddingGauge(true);
          }}
          onOpenAddStandard={() => {
            setEditingStandard(null);
            setIsAddingStandard(true);
          }}
          onNavigatePortal={onNavigateToPortal}
          onExportCSV={handleExportCSV}
          onExportPDF={handleExportPDF}
        />
      )}

      {/* TAB 1: QC INSPECTIONS & HOLD POINTS (ITP) */}
      {activeTab === 'inspections' && (
        <div className="bg-white border border-slate-200/80 rounded-xl shadow-2xs overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 bg-slate-50/40">
            <div className="flex items-center gap-2 flex-1 flex-wrap">
              <span className="text-xs font-bold text-slate-900">1. QC Inspections & Hold Points (ITP)</span>
              <div className="relative min-w-[200px] max-w-xs">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search ITP ID, stage, inspector..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-orange-500"
                />
              </div>
              <select
                value={projectFilter}
                onChange={e => setProjectFilter(e.target.value)}
                className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-none cursor-pointer"
              >
                <option value="All">All Projects</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.projectCode || p.id.slice(0, 8)} - {p.projectName}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                setEditingInspection(null);
                setInspectionForm({
                  projectId: 'p1',
                  stage: '',
                  inspector: 'Marcus Silva (QA Lead)',
                  date: new Date().toISOString().split('T')[0],
                  overallStatus: 'Passed',
                  measurement: ''
                });
                setIsAddingInspection(true);
              }}
              className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Plus size={13} />
              <span>Log ITP Inspection</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                  <th className="py-2 px-3">ITP ID (PK)</th>
                  <th className="py-2 px-3">Project (FK)</th>
                  <th className="py-2 px-3">Inspection Stage / Hold Point</th>
                  <th className="py-2 px-3">Key Measurements & Tolerances</th>
                  <th className="py-2 px-3">Inspector</th>
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3 text-center">Status</th>
                  <th className="py-2 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInspections.map(item => {
                  const pCode = getProjectCodeLabel(item.projectId);
                  const resultsSummary = item.itemResults
                    .map(r => r.measurement || r.defectDescription || '')
                    .filter(Boolean)
                    .join(' · ');

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors whitespace-nowrap">
                      <td className="py-2 px-3 font-mono font-bold text-slate-900">{item.id}</td>
                      <td className="py-2 px-3">
                        <button
                          onClick={() => setProjectFilter(item.projectId)}
                          className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-orange-700 bg-orange-50 hover:bg-orange-100 px-2 py-0.5 rounded border border-orange-200/80 cursor-pointer"
                        >
                          <Folder size={10} />
                          <span>{pCode}</span>
                        </button>
                      </td>
                      <td className="py-2 px-3 font-medium text-slate-900 max-w-[240px] truncate" title={item.stage}>
                        {item.stage}
                      </td>
                      <td className="py-2 px-3 text-slate-600 font-mono text-[11px] max-w-[260px] truncate" title={resultsSummary}>
                        {resultsSummary || 'Tolerances verified'}
                      </td>
                      <td className="py-2 px-3 text-slate-700">{item.inspector}</td>
                      <td className="py-2 px-3 font-mono text-[11px] text-slate-500">{item.date}</td>
                      <td className="py-2 px-3 text-center">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded text-[10px] font-bold border',
                            item.overallStatus === 'Passed'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : item.overallStatus === 'Passed with Observations'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          )}
                        >
                          {item.overallStatus}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {item.overallStatus !== 'Passed' && (
                            <button
                              onClick={() => {
                                setInspectionsList(prev =>
                                  prev.map(i => (i.id === item.id ? { ...i, overallStatus: 'Passed' } : i))
                                );
                              }}
                              className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded text-[10px] font-semibold cursor-pointer"
                            >
                              Pass
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setActiveTab('ncrs');
                              setEditingNcr(null);
                              setNcrForm({
                                ncrNumber: `NCR-2026-0${ncrList.length + 45}`,
                                projectId: item.projectId,
                                description: `ITP Hold Point Variance: ${item.stage}`,
                                severity: 'Major',
                                rootCause: '',
                                correctiveAction: '',
                                status: 'Investigating',
                                assignedTo: item.inspector,
                                targetDate: new Date().toISOString().split('T')[0]
                              });
                              setIsAddingNcr(true);
                            }}
                            className="px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-[10px] font-semibold cursor-pointer"
                            title="Raise NCR from Inspection"
                          >
                            +NCR
                          </button>
                          <button
                            onClick={() => {
                              setEditingInspection(item);
                              setInspectionForm({
                                projectId: item.projectId,
                                stage: item.stage,
                                inspector: item.inspector,
                                date: item.date,
                                overallStatus: item.overallStatus,
                                measurement: item.itemResults[0]?.measurement || ''
                              });
                            }}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            onClick={() => {
                              setInspectionsList(prev => prev.filter(i => i.id !== item.id));
                              onDeleteInspection?.(item.id);
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: INCOMING MATERIAL QC (IQC & MTC) */}
      {activeTab === 'iqc' && (
        <div className="bg-white border border-slate-200/80 rounded-xl shadow-2xs overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 bg-slate-50/40">
            <div className="flex items-center gap-2 flex-1 flex-wrap">
              <span className="text-xs font-bold text-slate-900">
                2. Incoming Material QC (IQC) & Mill Test Certificates (MTC)
              </span>
              <div className="relative min-w-[200px] max-w-xs">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search IQC, supplier, lot, MTC..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {onNavigateToPortal && (
                <button
                  onClick={() => onNavigateToPortal('procurement', 'grn')}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Truck size={12} />
                  <span>Open GRN Register</span>
                </button>
              )}
              <button
                onClick={() => {
                  setEditingIqc(null);
                  setIqcForm({
                    iqcCode: `IQC-2026-${iqcRecords.length + 105}`,
                    projectId: 'p1',
                    supplier: 'Alumex Extrusions PLC',
                    poRef: 'PO-2026-098',
                    materialName: '',
                    category: 'Aluminium Profile',
                    batchLotNo: 'LOT-AL-9102',
                    mtcCertNo: 'MTC-2026-510',
                    qtyChecked: '120 Bars',
                    keyCheck: '',
                    inspector: 'Marcus Silva',
                    date: new Date().toISOString().split('T')[0],
                    status: 'Accepted'
                  });
                  setIsAddingIqc(true);
                }}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Plus size={13} />
                <span>Log Batch IQC</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                  <th className="py-2 px-3">IQC Code</th>
                  <th className="py-2 px-3">PO / GRN (FK)</th>
                  <th className="py-2 px-3">Supplier</th>
                  <th className="py-2 px-3">Material & Category</th>
                  <th className="py-2 px-3">Batch / MTC Cert</th>
                  <th className="py-2 px-3">Qty</th>
                  <th className="py-2 px-3">Key Tolerance Check</th>
                  <th className="py-2 px-3 text-center">Disposition</th>
                  <th className="py-2 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredIqc.map(rec => (
                  <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors whitespace-nowrap">
                    <td className="py-2 px-3 font-mono font-bold text-slate-900">{rec.iqcCode}</td>
                    <td className="py-2 px-3">
                      <button
                        onClick={() => onNavigateToPortal?.('procurement', 'grn')}
                        className="font-mono text-[11px] font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 px-2 py-0.5 rounded border border-purple-200 cursor-pointer"
                        title="Open Procurement GRN"
                      >
                        {rec.poRef}
                      </button>
                    </td>
                    <td className="py-2 px-3 font-medium text-slate-800 max-w-[160px] truncate">{rec.supplier}</td>
                    <td className="py-2 px-3 max-w-[210px] truncate" title={rec.materialName}>
                      <span className="font-semibold text-slate-900">{rec.materialName}</span>
                    </td>
                    <td className="py-2 px-3 font-mono text-[11px] text-slate-600">
                      {rec.batchLotNo} • <span className="text-blue-700 font-semibold">{rec.mtcCertNo}</span>
                    </td>
                    <td className="py-2 px-3 font-mono text-[11px] text-slate-700">{rec.qtyChecked}</td>
                    <td className="py-2 px-3 text-slate-600 max-w-[210px] truncate" title={rec.keyCheck}>
                      {rec.keyCheck}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded text-[10px] font-bold border',
                          rec.status === 'Accepted'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : rec.status === 'Quarantined'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        )}
                      >
                        {rec.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {rec.status !== 'Accepted' ? (
                          <button
                            onClick={() => {
                              const next = iqcRecords.map(r =>
                                r.id === rec.id ? { ...r, status: 'Accepted' as const } : r
                              );
                              setIqcRecords(next);
                              qualityControlService.saveIqcRecords(next);
                            }}
                            className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded text-[10px] font-semibold cursor-pointer"
                          >
                            Release
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              const next = iqcRecords.map(r =>
                                r.id === rec.id ? { ...r, status: 'Quarantined' as const } : r
                              );
                              setIqcRecords(next);
                              qualityControlService.saveIqcRecords(next);
                            }}
                            className="px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-[10px] font-semibold cursor-pointer"
                          >
                            Quarantine
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setEditingIqc(rec);
                            setIqcForm({
                              iqcCode: rec.iqcCode,
                              projectId: rec.projectId,
                              supplier: rec.supplier,
                              poRef: rec.poRef,
                              materialName: rec.materialName,
                              category: rec.category,
                              batchLotNo: rec.batchLotNo,
                              mtcCertNo: rec.mtcCertNo,
                              qtyChecked: rec.qtyChecked,
                              keyCheck: rec.keyCheck,
                              inspector: rec.inspector,
                              date: rec.date,
                              status: rec.status
                            });
                          }}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() => {
                            const next = iqcRecords.filter(r => r.id !== rec.id);
                            setIqcRecords(next);
                            qualityControlService.saveIqcRecords(next);
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

      {/* TAB 3: LAB & SITE PERFORMANCE TESTS */}
      {activeTab === 'testing' && (
        <div className="bg-white border border-slate-200/80 rounded-xl shadow-2xs overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 bg-slate-50/40">
            <div className="flex items-center gap-2 flex-1 flex-wrap">
              <span className="text-xs font-bold text-slate-900">
                3. Lab & Site Performance Tests (DFT Microns, Water Hose, Silicone Peel, Glass)
              </span>
              <div className="relative min-w-[200px] max-w-xs">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search test code, type, sample..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <button
              onClick={() => {
                setEditingTest(null);
                setTestForm({
                  testCode: `TST-2026-${labTests.length + 205}`,
                  projectId: 'p1',
                  testType: 'DFT Micron Test',
                  sampleRef: '',
                  standardCode: 'Qualicoat Class 2',
                  requiredSpec: 'Min 60 µm average',
                  actualReading: '',
                  testedBy: 'Marcus Silva',
                  date: new Date().toISOString().split('T')[0],
                  result: 'Pass'
                });
                setIsAddingTest(true);
              }}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Plus size={13} />
              <span>Log Test Result</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                  <th className="py-2 px-3">Test ID</th>
                  <th className="py-2 px-3">Test Type</th>
                  <th className="py-2 px-3">Sample / Elevation Bay</th>
                  <th className="py-2 px-3">Standard</th>
                  <th className="py-2 px-3">Required Spec</th>
                  <th className="py-2 px-3">Measured Reading</th>
                  <th className="py-2 px-3">Tested By</th>
                  <th className="py-2 px-3 text-center">Result</th>
                  <th className="py-2 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTests.map(tst => (
                  <tr key={tst.id} className="hover:bg-slate-50/70 transition-colors whitespace-nowrap">
                    <td className="py-2 px-3 font-mono font-bold text-slate-900">{tst.testCode}</td>
                    <td className="py-2 px-3">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-semibold text-[11px]">
                        {tst.testType}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-medium text-slate-900 max-w-[200px] truncate" title={tst.sampleRef}>
                      {tst.sampleRef}
                    </td>
                    <td className="py-2 px-3 font-mono text-[11px] text-orange-700 font-semibold">{tst.standardCode}</td>
                    <td className="py-2 px-3 text-slate-500 font-mono text-[11px]">{tst.requiredSpec}</td>
                    <td className="py-2 px-3 font-mono text-[11px] font-bold text-slate-900">{tst.actualReading}</td>
                    <td className="py-2 px-3 text-slate-600">{tst.testedBy}</td>
                    <td className="py-2 px-3 text-center">
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded text-[10px] font-bold border',
                          tst.result === 'Pass'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : tst.result === 'Retest'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        )}
                      >
                        {tst.result}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditingTest(tst);
                            setTestForm({
                              testCode: tst.testCode,
                              projectId: tst.projectId,
                              testType: tst.testType,
                              sampleRef: tst.sampleRef,
                              standardCode: tst.standardCode,
                              requiredSpec: tst.requiredSpec,
                              actualReading: tst.actualReading,
                              testedBy: tst.testedBy,
                              date: tst.date,
                              result: tst.result
                            });
                          }}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() => {
                            const next = labTests.filter(t => t.id !== tst.id);
                            setLabTests(next);
                            qualityControlService.saveLabTests(next);
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

      {/* TAB 4: NCR REGISTER, QUARANTINE & CAPA */}
      {activeTab === 'ncrs' && (
        <div className="bg-white border border-slate-200/80 rounded-xl shadow-2xs overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 bg-slate-50/40">
            <div className="flex items-center gap-2 flex-1 flex-wrap">
              <span className="text-xs font-bold text-slate-900">4. Non-Conformance (NCR) & Quarantine Register</span>
              <div className="relative min-w-[180px] max-w-xs">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search NCR #, defect, root cause..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-orange-500"
                />
              </div>
              <div className="flex items-center gap-1">
                {(['All', 'Critical', 'Major', 'Minor'] as const).map(sev => (
                  <button
                    key={sev}
                    onClick={() => setSelectedSeverity(sev)}
                    className={cn(
                      'px-2 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer',
                      selectedSeverity === sev
                        ? 'bg-slate-900 text-white'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    )}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {onNavigateToPortal && (
                <button
                  onClick={() => onNavigateToPortal('procurement', 'pr')}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Truck size={12} />
                  <span>Vendor Debit Note</span>
                </button>
              )}
              <button
                onClick={() => {
                  setEditingNcr(null);
                  setNcrForm({
                    ncrNumber: `NCR-2026-0${ncrList.length + 45}`,
                    projectId: 'p1',
                    description: '',
                    severity: 'Major',
                    rootCause: '',
                    correctiveAction: '',
                    status: 'Investigating',
                    assignedTo: 'Marcus Silva',
                    targetDate: new Date().toISOString().split('T')[0]
                  });
                  setIsAddingNcr(true);
                }}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Plus size={13} />
                <span>Raise NCR</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                  <th className="py-2 px-3">NCR # (PK)</th>
                  <th className="py-2 px-3">Project (FK)</th>
                  <th className="py-2 px-3">Defect Description</th>
                  <th className="py-2 px-3 text-center">Severity</th>
                  <th className="py-2 px-3">Root Cause</th>
                  <th className="py-2 px-3">CAPA Action</th>
                  <th className="py-2 px-3">Owner</th>
                  <th className="py-2 px-3">Target</th>
                  <th className="py-2 px-3 text-center">Status</th>
                  <th className="py-2 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredNcrs.map(ncr => {
                  const pCode = getProjectCodeLabel(ncr.projectId);
                  return (
                    <tr key={ncr.id} className="hover:bg-slate-50/70 transition-colors whitespace-nowrap">
                      <td className="py-2 px-3 font-mono font-bold text-slate-900">{ncr.ncrNumber || ncr.id}</td>
                      <td className="py-2 px-3">
                        <button
                          onClick={() => setProjectFilter(ncr.projectId)}
                          className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-orange-700 bg-orange-50 hover:bg-orange-100 px-2 py-0.5 rounded border border-orange-200/80 cursor-pointer"
                        >
                          <Folder size={10} />
                          <span>{pCode}</span>
                        </button>
                      </td>
                      <td className="py-2 px-3 font-medium text-slate-900 max-w-[210px] truncate" title={ncr.description}>
                        {ncr.description}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span
                          className={cn(
                            'text-[10px] font-bold px-2 py-0.5 rounded border',
                            ncr.severity === 'Critical'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : ncr.severity === 'Major'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          )}
                        >
                          {ncr.severity}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-600 max-w-[170px] truncate" title={ncr.rootCause}>
                        {ncr.rootCause || 'Investigating'}
                      </td>
                      <td className="py-2 px-3 text-slate-600 max-w-[180px] truncate" title={ncr.correctiveAction}>
                        {ncr.correctiveAction || 'Pending CAPA'}
                      </td>
                      <td className="py-2 px-3 text-slate-700">{ncr.assignedTo || 'QA Lead'}</td>
                      <td className="py-2 px-3 font-mono text-[11px] text-slate-500">{ncr.targetDate || 'TBD'}</td>
                      <td className="py-2 px-3 text-center">
                        <span
                          className={cn(
                            'text-[10px] font-bold px-2 py-0.5 rounded border',
                            ncr.status === 'Resolved' || ncr.status === 'Closed'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          )}
                        >
                          {ncr.status}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {ncr.status !== 'Resolved' && ncr.status !== 'Closed' && (
                            <button
                              onClick={() => {
                                setNcrList(prev =>
                                  prev.map(item =>
                                    item.id === ncr.id ? { ...item, status: 'Resolved' } : item
                                  )
                                );
                              }}
                              className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded text-[10px] font-semibold cursor-pointer"
                            >
                              Close CAPA
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setEditingNcr(ncr);
                              setNcrForm({
                                ncrNumber: ncr.ncrNumber,
                                projectId: ncr.projectId,
                                description: ncr.description,
                                severity: ncr.severity as any,
                                rootCause: ncr.rootCause || '',
                                correctiveAction: ncr.correctiveAction || '',
                                status: ncr.status,
                                assignedTo: ncr.assignedTo || '',
                                targetDate: ncr.targetDate || ''
                              });
                            }}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            onClick={() => {
                              setNcrList(prev => prev.filter(item => item.id !== ncr.id));
                              onDeleteNcr?.(ncr.id);
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: GAUGE & INSTRUMENT CALIBRATION */}
      {activeTab === 'calibration' && (
        <div className="bg-white border border-slate-200/80 rounded-xl shadow-2xs overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 bg-slate-50/40">
            <div className="flex items-center gap-2 flex-1 flex-wrap">
              <span className="text-xs font-bold text-slate-900">
                5. Measuring Gauge & QA Instrument Calibration Register
              </span>
              <div className="relative min-w-[200px] max-w-xs">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search gauge code, serial, cert..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {onNavigateToPortal && (
                <button
                  onClick={() => onNavigateToPortal('equipment-management', 'inspections')}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Wrench size={12} />
                  <span>Machine Calibration</span>
                </button>
              )}
              <button
                onClick={() => {
                  setEditingGauge(null);
                  setGaugeForm({
                    gaugeCode: `CAL-GAU-0${gaugeRecords.length + 1}`,
                    instrumentName: '',
                    category: 'Coating DFT',
                    serialNo: 'SN-2026-901',
                    accuracyRange: '0 - 1500 µm (±1%)',
                    calibratedAt: new Date().toISOString().split('T')[0],
                    dueDate: '2027-09-26',
                    certNumber: 'SLSI-CAL-2026-999',
                    custodian: 'Marcus Silva',
                    status: 'Calibrated'
                  });
                  setIsAddingGauge(true);
                }}
                className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Plus size={13} />
                <span>Add Instrument</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                  <th className="py-2 px-3">Gauge ID</th>
                  <th className="py-2 px-3">Instrument Name</th>
                  <th className="py-2 px-3">Category</th>
                  <th className="py-2 px-3">Serial No</th>
                  <th className="py-2 px-3">Range & Accuracy</th>
                  <th className="py-2 px-3">Certificate No</th>
                  <th className="py-2 px-3">Due Date</th>
                  <th className="py-2 px-3 text-center">Status</th>
                  <th className="py-2 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredGauges.map(g => (
                  <tr key={g.id} className="hover:bg-slate-50/70 transition-colors whitespace-nowrap">
                    <td className="py-2 px-3 font-mono font-bold text-slate-900">{g.gaugeCode}</td>
                    <td className="py-2 px-3 font-semibold text-slate-900">{g.instrumentName}</td>
                    <td className="py-2 px-3 text-slate-600">{g.category}</td>
                    <td className="py-2 px-3 font-mono text-[11px] text-slate-600">{g.serialNo}</td>
                    <td className="py-2 px-3 font-mono text-[11px] text-slate-700">{g.accuracyRange}</td>
                    <td className="py-2 px-3 font-mono text-[11px] text-teal-700 font-semibold">{g.certNumber}</td>
                    <td className="py-2 px-3 font-mono text-[11px] text-slate-600">{g.dueDate}</td>
                    <td className="py-2 px-3 text-center">
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded text-[10px] font-bold border',
                          g.status === 'Calibrated'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : g.status === 'Due Soon'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        )}
                      >
                        {g.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {g.status !== 'Calibrated' && (
                          <button
                            onClick={() => {
                              const next = gaugeRecords.map(item =>
                                item.id === g.id
                                  ? {
                                      ...item,
                                      status: 'Calibrated' as const,
                                      calibratedAt: new Date().toISOString().split('T')[0],
                                      dueDate: '2027-10-15'
                                    }
                                  : item
                              );
                              setGaugeRecords(next);
                              qualityControlService.saveGauges(next);
                            }}
                            className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded text-[10px] font-semibold cursor-pointer"
                          >
                            Renew Cert
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setEditingGauge(g);
                            setGaugeForm({
                              gaugeCode: g.gaugeCode,
                              instrumentName: g.instrumentName,
                              category: g.category,
                              serialNo: g.serialNo,
                              accuracyRange: g.accuracyRange,
                              calibratedAt: g.calibratedAt,
                              dueDate: g.dueDate,
                              certNumber: g.certNumber,
                              custodian: g.custodian,
                              status: g.status
                            });
                          }}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() => {
                            const next = gaugeRecords.filter(item => item.id !== g.id);
                            setGaugeRecords(next);
                            qualityControlService.saveGauges(next);
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

      {/* TAB 6: STANDARDS & CLIENT QA HANDOVER DOSSIERS (All Single-Line Tables) */}
      {activeTab === 'standards' && (
        <div className="space-y-3">
          {/* Table 6A: Mandatory Fabrication & Testing Standards */}
          <div className="bg-white border border-slate-200/80 rounded-xl shadow-2xs overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 bg-slate-50/40">
              <span className="text-xs font-bold text-slate-900">
                6A. Mandatory Fabrication & Glazing Quality Standards (ISO / BS / ASTM / SLS)
              </span>
              <button
                onClick={() => {
                  setEditingStandard(null);
                  setStandardForm({
                    code: '',
                    domain: 'Aluminium Profiles',
                    title: '',
                    req: '',
                    auditStatus: 'Compliant'
                  });
                  setIsAddingStandard(true);
                }}
                className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Plus size={13} />
                <span>Add Standard</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    <th className="py-2 px-3">Standard Code</th>
                    <th className="py-2 px-3">Domain</th>
                    <th className="py-2 px-3">Specification Title</th>
                    <th className="py-2 px-3">Mandatory Tolerance & Acceptance Criteria</th>
                    <th className="py-2 px-3 text-center">Audit Status</th>
                    <th className="py-2 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {standards.map(std => (
                    <tr key={std.id} className="hover:bg-slate-50/70 transition-colors whitespace-nowrap">
                      <td className="py-2 px-3 font-mono font-bold text-orange-600">{std.code}</td>
                      <td className="py-2 px-3">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]">
                          {std.domain}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-semibold text-slate-900 max-w-[220px] truncate" title={std.title}>
                        {std.title}
                      </td>
                      <td className="py-2 px-3 text-slate-600 font-mono text-[11px] max-w-[320px] truncate" title={std.req}>
                        {std.req}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {std.auditStatus}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setEditingStandard(std);
                              setStandardForm({
                                code: std.code,
                                domain: std.domain,
                                title: std.title,
                                req: std.req,
                                auditStatus: std.auditStatus
                              });
                            }}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            onClick={() => setStandards(prev => prev.filter(s => s.id !== std.id))}
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

          {/* Table 6B: Project QA/QC Handover Dossiers */}
          <div className="bg-white border border-slate-200/80 rounded-xl shadow-2xs overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 bg-slate-50/40">
              <span className="text-xs font-bold text-slate-900">
                6B. Client QA/QC Handover Dossiers (Final ITP Pack, MTC Compilation & Snag Sign-Off)
              </span>
              <div className="flex items-center gap-1.5">
                {onNavigateToPortal && (
                  <button
                    onClick={() => onNavigateToPortal('after-sales', 'certificates')}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Medal size={12} />
                    <span>Issue Warranty Certificate</span>
                  </button>
                )}
                <button
                  onClick={() => setIsAddingDossier(true)}
                  className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={13} />
                  <span>New QA Dossier</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    <th className="py-2 px-3">Dossier Code</th>
                    <th className="py-2 px-3">Project (FK)</th>
                    <th className="py-2 px-3">Package Scope</th>
                    <th className="py-2 px-3">ITP Hold Points</th>
                    <th className="py-2 px-3 text-center">MTC Pack</th>
                    <th className="py-2 px-3 text-center">Open Snags</th>
                    <th className="py-2 px-3">QA Engineer</th>
                    <th className="py-2 px-3 text-center">Status</th>
                    <th className="py-2 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dossierRecords.map(dos => (
                    <tr key={dos.id} className="hover:bg-slate-50/70 transition-colors whitespace-nowrap">
                      <td className="py-2 px-3 font-mono font-bold text-slate-900">{dos.dossierCode}</td>
                      <td className="py-2 px-3 font-mono text-[11px] font-semibold text-orange-700">
                        {getProjectCodeLabel(dos.projectId)}
                      </td>
                      <td className="py-2 px-3 font-medium text-slate-900">{dos.packageScope}</td>
                      <td className="py-2 px-3 font-mono text-[11px] text-slate-700">{dos.itpSignedCount}</td>
                      <td className="py-2 px-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {dos.mtcVerified ? 'Verified' : 'Pending'}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center font-mono font-bold">
                        <span className={dos.openSnags === 0 ? 'text-emerald-600' : 'text-amber-600'}>
                          {dos.openSnags}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-700">{dos.qaEngineer}</td>
                      <td className="py-2 px-3 text-center">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded text-[10px] font-bold border',
                            dos.status === 'Signed Off'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          )}
                        >
                          {dos.status}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {dos.status !== 'Signed Off' && (
                            <button
                              onClick={() => {
                                const next = dossierRecords.map(d =>
                                  d.id === dos.id
                                    ? { ...d, openSnags: 0, status: 'Signed Off' as const }
                                    : d
                                );
                                setDossierRecords(next);
                                qualityControlService.saveDossiers(next);
                              }}
                              className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded text-[10px] font-semibold cursor-pointer"
                            >
                              Sign Off
                            </button>
                          )}
                          <button
                            onClick={() => {
                              const next = dossierRecords.filter(d => d.id !== dos.id);
                              setDossierRecords(next);
                              qualityControlService.saveDossiers(next);
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
        </div>
      )}

      {/* MODAL: ADD / EDIT ITP INSPECTION */}
      {(isAddingInspection || editingInspection) && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                {editingInspection ? 'Edit QC Inspection' : 'Log QC Inspection (ITP)'}
              </h3>
              <button
                onClick={() => {
                  setIsAddingInspection(false);
                  setEditingInspection(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveInspectionSubmit} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Inspection Stage / Hold Point *
                </label>
                <input
                  type="text"
                  required
                  value={inspectionForm.stage}
                  onChange={e => setInspectionForm({ ...inspectionForm, stage: e.target.value })}
                  placeholder="e.g., Powder Coating Thickness & Adhesion"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-orange-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Inspector</label>
                  <input
                    type="text"
                    value={inspectionForm.inspector}
                    onChange={e => setInspectionForm({ ...inspectionForm, inspector: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={inspectionForm.date}
                    onChange={e => setInspectionForm({ ...inspectionForm, date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-orange-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={inspectionForm.overallStatus}
                    onChange={e =>
                      setInspectionForm({ ...inspectionForm, overallStatus: e.target.value as any })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-orange-500 bg-white"
                  >
                    <option value="Passed">Passed</option>
                    <option value="Passed with Observations">Passed with Observations</option>
                    <option value="Failed">Failed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Measured Value / Note
                  </label>
                  <input
                    type="text"
                    value={inspectionForm.measurement}
                    onChange={e => setInspectionForm({ ...inspectionForm, measurement: e.target.value })}
                    placeholder="e.g., 75 µm (Min req 60 µm)"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-orange-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingInspection(false);
                    setEditingInspection(null);
                  }}
                  className="px-4 py-1.5 border border-slate-200 rounded-xl text-xs font-medium text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-semibold"
                >
                  Save Inspection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT IQC RECORD */}
      {(isAddingIqc || editingIqc) && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                {editingIqc ? 'Edit Incoming Material IQC' : 'Log Incoming Material Batch (IQC)'}
              </h3>
              <button
                onClick={() => {
                  setIsAddingIqc(false);
                  setEditingIqc(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveIqcSubmit} className="p-5 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">IQC Code</label>
                  <input
                    type="text"
                    value={iqcForm.iqcCode}
                    onChange={e => setIqcForm({ ...iqcForm, iqcCode: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">PO / GRN Ref</label>
                  <input
                    type="text"
                    value={iqcForm.poRef}
                    onChange={e => setIqcForm({ ...iqcForm, poRef: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Material Description *</label>
                <input
                  type="text"
                  required
                  value={iqcForm.materialName}
                  onChange={e => setIqcForm({ ...iqcForm, materialName: e.target.value })}
                  placeholder="e.g., 6063-T6 Mullion Extrusion Bar"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Supplier</label>
                  <input
                    type="text"
                    value={iqcForm.supplier}
                    onChange={e => setIqcForm({ ...iqcForm, supplier: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">MTC Certificate No</label>
                  <input
                    type="text"
                    value={iqcForm.mtcCertNo}
                    onChange={e => setIqcForm({ ...iqcForm, mtcCertNo: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Key Check Reading</label>
                  <input
                    type="text"
                    value={iqcForm.keyCheck}
                    onChange={e => setIqcForm({ ...iqcForm, keyCheck: e.target.value })}
                    placeholder="e.g., Wall 3.0mm • Webster 14 HW"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Disposition</label>
                  <select
                    value={iqcForm.status}
                    onChange={e => setIqcForm({ ...iqcForm, status: e.target.value as any })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white"
                  >
                    <option value="Accepted">Accepted</option>
                    <option value="Quarantined">Quarantined</option>
                    <option value="Concession">Concession</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingIqc(false);
                    setEditingIqc(null);
                  }}
                  className="px-4 py-1.5 border border-slate-200 rounded-xl text-xs font-medium text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold"
                >
                  Save IQC Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT LAB & SITE TEST */}
      {(isAddingTest || editingTest) && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                {editingTest ? 'Edit Lab / Site Test' : 'Record Lab or Site Performance Test'}
              </h3>
              <button
                onClick={() => {
                  setIsAddingTest(false);
                  setEditingTest(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveTestSubmit} className="p-5 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Test Type</label>
                  <select
                    value={testForm.testType}
                    onChange={e => setTestForm({ ...testForm, testType: e.target.value as any })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white"
                  >
                    <option value="DFT Micron Test">DFT Micron Test</option>
                    <option value="Water Spray Test">Water Spray Test</option>
                    <option value="Silicone Adhesion">Silicone Adhesion</option>
                    <option value="Glass Fragmentation">Glass Fragmentation</option>
                    <option value="Air Infiltration">Air Infiltration</option>
                    <option value="Weld NDT">Weld NDT</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Standard Code</label>
                  <input
                    type="text"
                    value={testForm.standardCode}
                    onChange={e => setTestForm({ ...testForm, standardCode: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Sample / Elevation Reference *
                </label>
                <input
                  type="text"
                  required
                  value={testForm.sampleRef}
                  onChange={e => setTestForm({ ...testForm, sampleRef: e.target.value })}
                  placeholder="e.g., East Curtain Wall Grid C1-C4"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Required Spec</label>
                  <input
                    type="text"
                    value={testForm.requiredSpec}
                    onChange={e => setTestForm({ ...testForm, requiredSpec: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Measured Reading *</label>
                  <input
                    type="text"
                    required
                    value={testForm.actualReading}
                    onChange={e => setTestForm({ ...testForm, actualReading: e.target.value })}
                    placeholder="e.g., 74 µm average"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingTest(false);
                    setEditingTest(null);
                  }}
                  className="px-4 py-1.5 border border-slate-200 rounded-xl text-xs font-medium text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold"
                >
                  Save Test Result
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT NCR */}
      {(isAddingNcr || editingNcr) && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                {editingNcr ? `Edit ${editingNcr.ncrNumber}` : 'Raise Non-Conformance Report (NCR)'}
              </h3>
              <button
                onClick={() => {
                  setIsAddingNcr(false);
                  setEditingNcr(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveNcrSubmit} className="p-5 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">NCR Number</label>
                  <input
                    type="text"
                    value={ncrForm.ncrNumber}
                    onChange={e => setNcrForm({ ...ncrForm, ncrNumber: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Severity</label>
                  <select
                    value={ncrForm.severity}
                    onChange={e => setNcrForm({ ...ncrForm, severity: e.target.value as any })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white"
                  >
                    <option value="Minor">Minor</option>
                    <option value="Major">Major</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Defect Description *</label>
                <input
                  type="text"
                  required
                  value={ncrForm.description}
                  onChange={e => setNcrForm({ ...ncrForm, description: e.target.value })}
                  placeholder="Describe non-conformance..."
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Root Cause</label>
                  <input
                    type="text"
                    value={ncrForm.rootCause}
                    onChange={e => setNcrForm({ ...ncrForm, rootCause: e.target.value })}
                    placeholder="5-Why root cause..."
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">CAPA Action</label>
                  <input
                    type="text"
                    value={ncrForm.correctiveAction}
                    onChange={e => setNcrForm({ ...ncrForm, correctiveAction: e.target.value })}
                    placeholder="Quarantine / rework / return..."
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingNcr(false);
                    setEditingNcr(null);
                  }}
                  className="px-4 py-1.5 border border-slate-200 rounded-xl text-xs font-medium text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold"
                >
                  Save NCR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT GAUGE */}
      {(isAddingGauge || editingGauge) && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                {editingGauge ? 'Edit Measuring Instrument' : 'Register Measuring Instrument / Gauge'}
              </h3>
              <button
                onClick={() => {
                  setIsAddingGauge(false);
                  setEditingGauge(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveGaugeSubmit} className="p-5 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Gauge Code</label>
                  <input
                    type="text"
                    value={gaugeForm.gaugeCode}
                    onChange={e => setGaugeForm({ ...gaugeForm, gaugeCode: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Serial No</label>
                  <input
                    type="text"
                    value={gaugeForm.serialNo}
                    onChange={e => setGaugeForm({ ...gaugeForm, serialNo: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Instrument Name *</label>
                <input
                  type="text"
                  required
                  value={gaugeForm.instrumentName}
                  onChange={e => setGaugeForm({ ...gaugeForm, instrumentName: e.target.value })}
                  placeholder="e.g., Elcometer 456 DFT Coating Gauge"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Calibration Cert No</label>
                  <input
                    type="text"
                    value={gaugeForm.certNumber}
                    onChange={e => setGaugeForm({ ...gaugeForm, certNumber: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Calibration Due Date</label>
                  <input
                    type="date"
                    value={gaugeForm.dueDate}
                    onChange={e => setGaugeForm({ ...gaugeForm, dueDate: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingGauge(false);
                    setEditingGauge(null);
                  }}
                  className="px-4 py-1.5 border border-slate-200 rounded-xl text-xs font-medium text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold"
                >
                  Save Instrument
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT STANDARD */}
      {(isAddingStandard || editingStandard) && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                {editingStandard ? `Edit Standard: ${editingStandard.code}` : 'Add Mandatory Testing Standard'}
              </h3>
              <button
                onClick={() => {
                  setIsAddingStandard(false);
                  setEditingStandard(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveStandardSubmit} className="p-5 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Standard Code *</label>
                  <input
                    type="text"
                    required
                    value={standardForm.code}
                    onChange={e => setStandardForm({ ...standardForm, code: e.target.value })}
                    placeholder="e.g., BS EN 12150"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Domain</label>
                  <input
                    type="text"
                    value={standardForm.domain}
                    onChange={e => setStandardForm({ ...standardForm, domain: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={standardForm.title}
                  onChange={e => setStandardForm({ ...standardForm, title: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mandatory Tolerance & Acceptance Criteria
                </label>
                <input
                  type="text"
                  value={standardForm.req}
                  onChange={e => setStandardForm({ ...standardForm, req: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingStandard(false);
                    setEditingStandard(null);
                  }}
                  className="px-4 py-1.5 border border-slate-200 rounded-xl text-xs font-medium text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold"
                >
                  Save Standard
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD QA HANDOVER DOSSIER */}
      {isAddingDossier && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Create Client QA Handover Dossier</h3>
              <button
                onClick={() => setIsAddingDossier(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveDossierSubmit} className="p-5 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Dossier Code</label>
                  <input
                    type="text"
                    value={dossierForm.dossierCode}
                    onChange={e => setDossierForm({ ...dossierForm, dossierCode: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ITP Hold Points</label>
                  <input
                    type="text"
                    value={dossierForm.itpSignedCount}
                    onChange={e => setDossierForm({ ...dossierForm, itpSignedCount: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Package Scope *</label>
                <input
                  type="text"
                  required
                  value={dossierForm.packageScope}
                  onChange={e => setDossierForm({ ...dossierForm, packageScope: e.target.value })}
                  placeholder="e.g., North Atrium Spider Glazing & Skylight"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddingDossier(false)}
                  className="px-4 py-1.5 border border-slate-200 rounded-xl text-xs font-medium text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold"
                >
                  Create Dossier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
