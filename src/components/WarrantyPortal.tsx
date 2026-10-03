import React, { useState, useMemo, useEffect } from 'react';
import { 
  Medal, 
  Search, 
  LifeBuoy, 
  History, 
  Plus, 
  Check,
  Trash2,
  Edit2,
  X,
  Folder,
  LayoutList,
  LayoutGrid,
  LayoutDashboard
} from 'lucide-react';
import { WarrantyCertificate, AfterSalesServiceRequest, Project } from '../types';
import { cn } from '../lib/utils';
import { ExportActions } from './common/ExportActions';
import { downloadCSV, downloadPDFTable } from '../services/dataExportService';
import { WarrantyLandingPage, WarrantyTab } from './warranty/WarrantyLandingPage';

interface MaintenanceHistoryItem {
  id: string;
  title: string;
  date: string;
  technician: string;
  clientSigned: boolean;
}

interface WarrantyPortalProps {
  warrantyCertificates?: WarrantyCertificate[];
  afterSalesRequests?: AfterSalesServiceRequest[];
  projects?: Project[];
  initialTab?: WarrantyTab;
  onTabChange?: (tab: WarrantyTab) => void;
  onSaveCertificate?: (cert: WarrantyCertificate) => void;
  onDeleteCertificate?: (id: string) => void;
  onSaveRequest?: (req: AfterSalesServiceRequest) => void;
  onDeleteRequest?: (id: string) => void;
}

export const WarrantyPortal: React.FC<WarrantyPortalProps> = ({
  warrantyCertificates = [],
  afterSalesRequests = [],
  projects = [],
  initialTab = 'landing',
  onTabChange,
  onSaveCertificate,
  onDeleteCertificate,
  onSaveRequest,
  onDeleteRequest
}) => {
  const [activeTab, setActiveTab] = useState<WarrantyTab>(initialTab || 'landing');
  const [searchQuery, setSearchQuery] = useState('');
  const [projectFilter, setProjectFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  const defaultCertificates: WarrantyCertificate[] = useMemo(() => {
    if (warrantyCertificates && warrantyCertificates.length > 0) return warrantyCertificates;
    return [
      {
        id: 'wc-1',
        certificateNo: 'WTY-ALU-2026-091',
        projectId: 'Sirius Mall Storefront',
        customerName: 'Sirius Retail Group PLC',
        productPvcCodes: ['AL-WD-001', 'GL-PT-001'],
        startDate: '2024-03-15',
        endDate: '2034-03-15',
        type: 'Product',
        status: 'Active'
      },
      {
        id: 'wc-2',
        certificateNo: 'WTY-GLZ-2025-144',
        projectId: 'Horizon Office Complex Suite 4A',
        customerName: 'Horizon Holdings Pvt Ltd',
        productPvcCodes: ['GL-PT-001'],
        startDate: '2025-01-10',
        endDate: '2035-01-10',
        type: 'Glass',
        status: 'Active'
      },
      {
        id: 'wc-3',
        certificateNo: 'WTY-FIN-2021-023',
        projectId: 'Vauxhall Showroom Facade',
        customerName: 'Vauxhall Motors',
        productPvcCodes: ['AL-WD-002'],
        startDate: '2021-11-01',
        endDate: '2026-11-01',
        type: 'Finish',
        status: 'Expiring Soon'
      }
    ];
  }, [warrantyCertificates]);

  const [certificatesList, setCertificatesList] = useState<WarrantyCertificate[]>(defaultCertificates);

  useEffect(() => {
    if (warrantyCertificates && warrantyCertificates.length > 0) {
      setCertificatesList(warrantyCertificates);
    }
  }, [warrantyCertificates]);

  const defaultRequests: AfterSalesServiceRequest[] = useMemo(() => {
    if (afterSalesRequests && afterSalesRequests.length > 0) return afterSalesRequests;
    return [
      {
        id: 'req-1',
        requestNo: 'SRV-2026-018',
        date: '2026-10-13',
        projectId: 'Sirius Mall Storefront',
        pvcCode: 'AL-WD-001',
        description: 'Sliding door floor guide friction adjustment needed after high-traffic week',
        urgency: 'Medium',
        status: 'Scheduled',
        technicianId: 'Kasun Wickramasinghe'
      },
      {
        id: 'req-2',
        requestNo: 'SRV-2026-019',
        date: '2026-10-14',
        projectId: 'Horizon Office Complex Suite 4A',
        pvcCode: 'GL-PT-001',
        description: 'Partition swing door overhead hydraulic closer speed adjustment',
        urgency: 'Low',
        status: 'New'
      },
      {
        id: 'req-3',
        requestNo: 'SRV-2026-014',
        date: '2026-10-02',
        projectId: 'Vauxhall Showroom Facade',
        pvcCode: 'AL-WD-002',
        description: 'Perimeter silicone joint weather seal inspection and maintenance check',
        urgency: 'High',
        status: 'Completed',
        technicianId: 'Sachith Fernando'
      }
    ];
  }, [afterSalesRequests]);

  const [requestsList, setRequestsList] = useState<AfterSalesServiceRequest[]>(defaultRequests);

  useEffect(() => {
    if (afterSalesRequests && afterSalesRequests.length > 0) {
      setRequestsList(afterSalesRequests);
    }
  }, [afterSalesRequests]);

  const [historyLogs, setHistoryLogs] = useState<MaintenanceHistoryItem[]>([
    {
      id: 'h-1',
      title: 'Vauxhall Showroom Perimeter Joint Recaulk',
      date: '2026-10-02',
      technician: 'Sachith Fernando',
      clientSigned: true
    },
    {
      id: 'h-2',
      title: 'Sirius Mall Automatic Sliding Door Sensor Tuning',
      date: '2026-09-18',
      technician: 'Technical Service Team',
      clientSigned: true
    }
  ]);

  // Modal states
  const [isAddingCert, setIsAddingCert] = useState(false);
  const [editingCert, setEditingCert] = useState<WarrantyCertificate | null>(null);
  const [isAddingReq, setIsAddingReq] = useState(false);
  const [editingReq, setEditingReq] = useState<AfterSalesServiceRequest | null>(null);
  const [isAddingHistory, setIsAddingHistory] = useState(false);
  const [editingHistory, setEditingHistory] = useState<MaintenanceHistoryItem | null>(null);

  // Forms
  const [certForm, setCertForm] = useState({
    certificateNo: '',
    customerName: '',
    projectId: 'Sirius Mall Storefront',
    type: 'Product' as WarrantyCertificate['type'],
    productPvcCodes: 'AL-WD-001, GL-PT-001',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'Active' as WarrantyCertificate['status']
  });

  const [reqForm, setReqForm] = useState({
    requestNo: '',
    date: new Date().toISOString().split('T')[0],
    projectId: 'Sirius Mall Storefront',
    pvcCode: 'AL-WD-001',
    description: '',
    urgency: 'Medium' as AfterSalesServiceRequest['urgency'],
    status: 'New' as AfterSalesServiceRequest['status'],
    technicianId: ''
  });

  const [historyForm, setHistoryForm] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    technician: 'Kasun Wickramasinghe',
    clientSigned: true
  });

  const filteredRequests = useMemo(() => {
    return requestsList.filter(r => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q ||
             r.requestNo.toLowerCase().includes(q) ||
             r.description.toLowerCase().includes(q) ||
             r.projectId.toLowerCase().includes(q) ||
             (r.pvcCode && r.pvcCode.toLowerCase().includes(q)) ||
             (r.technicianId && r.technicianId.toLowerCase().includes(q));

      const targetProj = projects.find(p => p.id === projectFilter || p.projectCode === projectFilter);
      const matchProject = projectFilter === 'All' ||
             r.projectId === projectFilter ||
             (targetProj && (r.projectId.toLowerCase().includes(targetProj.projectName.toLowerCase()) || (targetProj.projectCode && r.projectId.toLowerCase().includes(targetProj.projectCode.toLowerCase()))));

      const matchStatus = statusFilter === 'All' || r.status === statusFilter;

      return matchSearch && matchProject && matchStatus;
    });
  }, [requestsList, searchQuery, projectFilter, statusFilter, projects]);

  const filteredCertificates = useMemo(() => {
    return certificatesList.filter(c => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q ||
             c.certificateNo.toLowerCase().includes(q) ||
             c.customerName.toLowerCase().includes(q) ||
             c.projectId.toLowerCase().includes(q) ||
             c.type.toLowerCase().includes(q) ||
             c.productPvcCodes.some(p => p.toLowerCase().includes(q));

      const targetProj = projects.find(p => p.id === projectFilter || p.projectCode === projectFilter);
      const matchProject = projectFilter === 'All' ||
             c.projectId === projectFilter ||
             (targetProj && (c.projectId.toLowerCase().includes(targetProj.projectName.toLowerCase()) || (targetProj.projectCode && c.projectId.toLowerCase().includes(targetProj.projectCode.toLowerCase()))));

      const matchStatus = statusFilter === 'All' || c.status === statusFilter;

      return matchSearch && matchProject && matchStatus;
    });
  }, [certificatesList, searchQuery, projectFilter, statusFilter, projects]);

  // Handlers for Certificates
  const handleDeleteCert = (id: string) => {
    if (window.confirm('Delete this warranty certificate?')) {
      setCertificatesList(prev => prev.filter(c => c.id !== id));
      onDeleteCertificate?.(id);
    }
  };

  const handleSaveCertSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!certForm.customerName.trim()) return;

    const pvcs = certForm.productPvcCodes.split(',').map(s => s.trim()).filter(Boolean);

    if (editingCert) {
      const updated: WarrantyCertificate = {
        ...editingCert,
        ...certForm,
        productPvcCodes: pvcs
      };
      setCertificatesList(prev => prev.map(c => c.id === updated.id ? updated : c));
      onSaveCertificate?.(updated);
      setEditingCert(null);
    } else {
      const newCert: WarrantyCertificate = {
        id: `wc-${Date.now()}`,
        certificateNo: certForm.certificateNo || `WTY-ALU-2026-0${certificatesList.length + 95}`,
        customerName: certForm.customerName,
        projectId: certForm.projectId,
        type: certForm.type,
        productPvcCodes: pvcs,
        startDate: certForm.startDate,
        endDate: certForm.endDate,
        status: certForm.status
      };
      setCertificatesList(prev => [newCert, ...prev]);
      onSaveCertificate?.(newCert);
      setIsAddingCert(false);
    }
  };

  // Handlers for Requests
  const handleDeleteReq = (id: string) => {
    if (window.confirm('Delete this service request ticket?')) {
      setRequestsList(prev => prev.filter(r => r.id !== id));
      onDeleteRequest?.(id);
    }
  };

  const handleSaveReqSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqForm.description.trim()) return;

    if (editingReq) {
      const updated: AfterSalesServiceRequest = {
        ...editingReq,
        ...reqForm
      };
      setRequestsList(prev => prev.map(r => r.id === updated.id ? updated : r));
      onSaveRequest?.(updated);
      setEditingReq(null);
    } else {
      const newReq: AfterSalesServiceRequest = {
        id: `req-${Date.now()}`,
        requestNo: reqForm.requestNo || `SRV-2026-0${requestsList.length + 22}`,
        date: reqForm.date,
        projectId: reqForm.projectId,
        pvcCode: reqForm.pvcCode,
        description: reqForm.description,
        urgency: reqForm.urgency,
        status: reqForm.status,
        technicianId: reqForm.technicianId || undefined
      };
      setRequestsList(prev => [newReq, ...prev]);
      onSaveRequest?.(newReq);
      setIsAddingReq(false);
    }
  };

  // Handlers for History
  const handleDeleteHistory = (id: string) => {
    if (window.confirm('Delete this maintenance record?')) {
      setHistoryLogs(prev => prev.filter(h => h.id !== id));
    }
  };

  const handleSaveHistorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!historyForm.title.trim()) return;

    if (editingHistory) {
      const updated: MaintenanceHistoryItem = { ...editingHistory, ...historyForm };
      setHistoryLogs(prev => prev.map(h => h.id === updated.id ? updated : h));
      setEditingHistory(null);
    } else {
      const newH: MaintenanceHistoryItem = { id: `h-${Date.now()}`, ...historyForm };
      setHistoryLogs(prev => [newH, ...prev]);
      setIsAddingHistory(false);
    }
  };

  return (
    <div className="space-y-2.5 pb-8">
      {/* Title Ribbon - One Line Ribbon with Simple Description & Only Buttons */}
      <header className="px-5 py-2.5 bg-white border border-slate-200/80 rounded-xl shadow-2xs">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Medal size={16} />
            </div>
            <div className="flex items-baseline gap-2 min-w-0">
              <h1 className="text-sm font-bold text-slate-900 whitespace-nowrap">Warranty & After-Sales</h1>
              <span className="text-xs text-slate-500 font-normal truncate hidden sm:inline">
                • Guarantee certificates, service tickets & claims
              </span>
            </div>
          </div>

          {/* Action Buttons ONLY */}
          <div className="flex items-center gap-2 shrink-0">
            <ExportActions 
              onExportCSV={() => {
                if (activeTab === 'requests') {
                  const headers = ['Request No', 'Date', 'Project', 'Component', 'Urgency', 'Status', 'Technician', 'Description'];
                  const rows = requestsList.map(r => [
                    `"${r.requestNo}"`,
                    `"${r.date}"`,
                    `"${r.projectId}"`,
                    `"${r.pvcCode || ''}"`,
                    `"${r.urgency}"`,
                    `"${r.status}"`,
                    `"${r.technicianId || ''}"`,
                    `"${r.description.replace(/"/g, '""')}"`
                  ]);
                  downloadCSV(`service-requests-${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
                } else if (activeTab === 'certificates') {
                  const headers = ['Certificate No', 'Client', 'Project', 'Type', 'Start Date', 'End Date', 'Status'];
                  const rows = certificatesList.map(c => [
                    `"${c.certificateNo}"`,
                    `"${c.customerName}"`,
                    `"${c.projectId}"`,
                    `"${c.type}"`,
                    `"${c.startDate}"`,
                    `"${c.endDate}"`,
                    `"${c.status}"`
                  ]);
                  downloadCSV(`warranty-certificates-${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
                }
              }}
              onExportPDF={() => {
                if (activeTab === 'requests') {
                  const headers = ['Ticket #', 'Project', 'Date', 'Urgency', 'Status'];
                  const rows = requestsList.map(r => [r.requestNo, r.projectId, r.date, r.urgency, r.status]);
                  downloadPDFTable('After-Sales Service Requests', headers, rows, 'service-requests.pdf', 'Overview of maintenance and repair tickets');
                } else if (activeTab === 'certificates') {
                  const headers = ['Cert #', 'Customer', 'Project', 'Type', 'Valid Until'];
                  const rows = certificatesList.map(c => [c.certificateNo, c.customerName, c.projectId, c.type, c.endDate]);
                  downloadPDFTable('Warranty Certificates Register', headers, rows, 'warranty-certificates.pdf', 'Certified product and glazing guarantees');
                }
              }}
              labelCSV="CSV"
              labelPDF="PDF"
            />
          </div>
        </div>
      </header>

      {/* Sub Portals Navigation Tabs */}
      <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/80 overflow-x-auto">
        {[
          { id: 'landing', label: 'Command Hub', icon: LayoutDashboard },
          { id: 'requests', label: 'Service Tickets', icon: LifeBuoy },
          { id: 'certificates', label: 'Warranty Register', icon: Medal },
          { id: 'history', label: 'Maintenance Log', icon: History },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              const nextTab = tab.id as any;
              setActiveTab(nextTab);
              onTabChange?.(nextTab);
            }}
            className={cn(
              "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer",
              activeTab === tab.id 
                ? "bg-white text-slate-900 shadow-xs border border-slate-200/60 font-semibold" 
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            )}
          >
            <tab.icon size={13} className={activeTab === tab.id ? "text-orange-500" : "text-slate-400"} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab 0: Command Center Landing Hub */}
      {activeTab === 'landing' && (
        <WarrantyLandingPage
          warrantyCertificates={certificatesList}
          afterSalesRequests={requestsList}
          projects={projects}
          onNavigateTab={(t) => {
            setActiveTab(t);
            onTabChange?.(t);
          }}
          onOpenAddCertificate={() => {
            setActiveTab('certificates');
            setIsAddingCert(true);
          }}
          onOpenAddRequest={() => {
            setActiveTab('requests');
            setIsAddingReq(true);
          }}
          onExportCSV={() => {
            const headers = ['Certificate No', 'Client', 'Project', 'Type', 'Start Date', 'End Date', 'Status'];
            const rows = certificatesList.map(c => [
              `"${c.certificateNo}"`,
              `"${c.customerName}"`,
              `"${c.projectId}"`,
              `"${c.type}"`,
              `"${c.startDate}"`,
              `"${c.endDate}"`,
              `"${c.status}"`
            ]);
            downloadCSV(`warranty-certificates-${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
          }}
          onExportPDF={() => {
            const headers = ['Cert #', 'Customer', 'Project', 'Type', 'Valid Until'];
            const rows = certificatesList.map(c => [c.certificateNo, c.customerName, c.projectId, c.type, c.endDate]);
            downloadPDFTable('Warranty Certificates Register', headers, rows, 'warranty-certificates.pdf', 'Certified product and glazing guarantees');
          }}
        />
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-normal">
            <span>Active Warranties</span>
            <span className="text-[11px] text-emerald-600 font-medium bg-emerald-50 px-1.5 py-0.5 rounded-md">Live</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{certificatesList.length}</p>
          <p className="text-[11px] text-slate-400 mt-1">Backed by manufacturer warranties</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-normal">
            <span>Open Service Tickets</span>
            <span className="text-[11px] text-amber-600 font-medium bg-amber-50 px-1.5 py-0.5 rounded-md">Pending</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{requestsList.filter(r => r.status !== 'Completed').length}</p>
          <p className="text-[11px] text-slate-400 mt-1">Avg resolution time: 4.2 hrs</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-normal">
            <span>Customer CSAT</span>
            <span className="text-[11px] text-emerald-600 font-medium bg-emerald-50 px-1.5 py-0.5 rounded-md">High</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">99.1%</p>
          <p className="text-[11px] text-slate-400 mt-1">Post-service satisfaction</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-normal">
            <span>Expiring in 60 Days</span>
            <span className="text-[11px] text-blue-600 font-medium bg-blue-50 px-1.5 py-0.5 rounded-md">Renewals</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{certificatesList.filter(c => c.status === 'Expiring Soon').length}</p>
          <p className="text-[11px] text-slate-400 mt-1">Renewal notices dispatched</p>
        </div>
      </div>

      {/* Tab 1: Service Tickets (One-Line Row List View) */}
      {activeTab === 'requests' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden space-y-3 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 flex-wrap">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Search ticket PK, Project FK, issue, client..."
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
                  title="Filter by Project (Foreign Key)"
                >
                  <option value="All">All Projects (FK)</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>
                      [{p.projectCode || p.id.slice(0, 8)}] {p.projectName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 outline-none cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="New">New</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <button
              onClick={() => {
                setEditingReq(null);
                setReqForm({
                  requestNo: `SRV-2026-0${requestsList.length + 22}`,
                  date: new Date().toISOString().split('T')[0],
                  projectId: 'Sirius Mall Storefront',
                  pvcCode: 'AL-WD-001',
                  description: '',
                  urgency: 'Medium',
                  status: 'New',
                  technicianId: 'Kasun Wickramasinghe'
                });
                setIsAddingReq(true);
              }}
              className="px-3.5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-medium transition-colors shadow-xs flex items-center gap-1.5 shrink-0"
            >
              <Plus size={14} />
              <span>Log Service Request</span>
            </button>
          </div>

          <div className="rounded-xl border border-slate-200/80 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[10px] font-bold text-slate-600 uppercase tracking-wider select-none whitespace-nowrap">
                    <th className="py-2.5 px-3">Ticket # (PK)</th>
                    <th className="py-2.5 px-3">Project Code / Name (FK)</th>
                    <th className="py-2.5 px-3">PVC / Scope</th>
                    <th className="py-2.5 px-3">Service Issue & Description</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3 text-center">Urgency</th>
                    <th className="py-2.5 px-3">Technician</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRequests.length > 0 ? (
                    filteredRequests.map(req => {
                      const targetProj = projects.find(p => p.id === req.projectId || (p.projectCode && req.projectId === p.projectCode) || p.projectName.toLowerCase().includes(req.projectId.toLowerCase()));
                      const pCode = targetProj?.projectCode || req.projectId;

                      return (
                        <tr key={req.id} className="hover:bg-slate-50/70 transition-colors whitespace-nowrap group">
                          {/* PK: Ticket # */}
                          <td className="py-2.5 px-3">
                            <button
                              onClick={() => {
                                setEditingReq(req);
                                setReqForm({
                                  requestNo: req.requestNo,
                                  date: req.date,
                                  projectId: req.projectId,
                                  pvcCode: req.pvcCode || '',
                                  description: req.description,
                                  urgency: req.urgency,
                                  status: req.status,
                                  technicianId: req.technicianId || ''
                                });
                              }}
                              className="font-mono font-bold text-xs text-slate-900 bg-slate-100 hover:bg-orange-50 hover:text-orange-600 px-2 py-0.5 rounded border border-slate-200 inline-flex items-center gap-1 shadow-2xs transition-colors"
                              title={`Primary Key: ${req.requestNo} (Click to Edit)`}
                            >
                              <LifeBuoy size={11} className="text-orange-500 shrink-0" />
                              <span>PK: {req.requestNo}</span>
                            </button>
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

                          {/* Scope / PVC */}
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                            {req.pvcCode || 'Standard'}
                          </td>

                          {/* Description (Single Line) */}
                          <td className="py-2.5 px-3 max-w-[260px]">
                            <span className="font-semibold text-slate-900 truncate block text-xs" title={req.description}>
                              {req.description}
                            </span>
                          </td>

                          {/* Date */}
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                            {req.date}
                          </td>

                          {/* Urgency */}
                          <td className="py-2.5 px-3 text-center">
                            <span className={cn(
                              "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                              req.urgency === 'High' ? "bg-rose-50 text-rose-700 border-rose-200" :
                              req.urgency === 'Medium' ? "bg-amber-50 text-amber-700 border-amber-200" :
                              "bg-blue-50 text-blue-700 border-blue-200"
                            )}>
                              {req.urgency}
                            </span>
                          </td>

                          {/* Technician */}
                          <td className="py-2.5 px-3 text-slate-700 text-xs">
                            {req.technicianId || 'Unassigned'}
                          </td>

                          {/* Status */}
                          <td className="py-2.5 px-3 text-center">
                            <span className={cn(
                              "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                              req.status === 'Completed' ? "bg-emerald-50 border-emerald-200 text-emerald-700" :
                              req.status === 'Scheduled' ? "bg-blue-50 border-blue-200 text-blue-700" :
                              "bg-amber-50 border-amber-200 text-amber-700"
                            )}>
                              {req.status}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-2.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {req.status !== 'Completed' && (
                                <button
                                  onClick={() => {
                                    const updated = { ...req, status: 'Completed' as const };
                                    setRequestsList(prev => prev.map(r => r.id === req.id ? updated : r));
                                    onSaveRequest?.(updated);
                                  }}
                                  className="px-2 py-0.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-200"
                                >
                                  Complete
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setEditingReq(req);
                                  setReqForm({
                                    requestNo: req.requestNo,
                                    date: req.date,
                                    projectId: req.projectId,
                                    pvcCode: req.pvcCode || '',
                                    description: req.description,
                                    urgency: req.urgency,
                                    status: req.status,
                                    technicianId: req.technicianId || ''
                                  });
                                }}
                                className="p-1 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                title="Edit Service Ticket"
                              >
                                <Edit2 size={12} />
                              </button>
                              <button
                                onClick={() => handleDeleteReq(req.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Delete Service Ticket"
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
                      <td colSpan={9} className="py-12 text-center text-slate-400 text-xs">
                        No service tickets match your filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Warranty Certificates */}
      {activeTab === 'certificates' && (
        <div className="space-y-3">
          <div className="p-3 bg-white border border-slate-200/80 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 flex-wrap">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Search certificate PK, client, project..."
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
                  title="Filter by Project (Foreign Key)"
                >
                  <option value="All">All Projects (FK)</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>
                      [{p.projectCode || p.id.slice(0, 8)}] {p.projectName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 outline-none cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Expiring Soon">Expiring Soon</option>
                <option value="Expired">Expired</option>
              </select>
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
                  setEditingCert(null);
                  setCertForm({
                    certificateNo: `WTY-ALU-2026-0${certificatesList.length + 95}`,
                    customerName: '',
                    projectId: 'Sirius Mall Storefront',
                    type: 'Product',
                    productPvcCodes: 'AL-WD-001, GL-PT-001',
                    startDate: new Date().toISOString().split('T')[0],
                    endDate: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    status: 'Active'
                  });
                  setIsAddingCert(true);
                }}
                className="px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-medium transition-colors shadow-xs flex items-center gap-1.5"
              >
                <Plus size={14} />
                <span>Issue Certificate</span>
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
                      <th className="py-2.5 px-3">Certificate # (PK)</th>
                      <th className="py-2.5 px-3">Project Code / Name (FK)</th>
                      <th className="py-2.5 px-3">Customer Account</th>
                      <th className="py-2.5 px-3">Coverage Type</th>
                      <th className="py-2.5 px-3">PVC Product Codes</th>
                      <th className="py-2.5 px-3">Start Date</th>
                      <th className="py-2.5 px-3">Expires Until</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCertificates.length > 0 ? (
                      filteredCertificates.map(cert => {
                        const targetProj = projects.find(p => p.id === cert.projectId || (p.projectCode && cert.projectId === p.projectCode) || p.projectName.toLowerCase().includes(cert.projectId.toLowerCase()));
                        const pCode = targetProj?.projectCode || cert.projectId;

                        return (
                          <tr key={cert.id} className="hover:bg-slate-50/70 transition-colors whitespace-nowrap group">
                            {/* PK: Certificate # */}
                            <td className="py-2.5 px-3">
                              <button
                                onClick={() => {
                                  setEditingCert(cert);
                                  setCertForm({
                                    certificateNo: cert.certificateNo,
                                    customerName: cert.customerName,
                                    projectId: cert.projectId,
                                    type: cert.type,
                                    productPvcCodes: cert.productPvcCodes.join(', '),
                                    startDate: cert.startDate,
                                    endDate: cert.endDate,
                                    status: cert.status
                                  });
                                }}
                                className="font-mono font-bold text-xs text-slate-900 bg-slate-100 hover:bg-orange-50 hover:text-orange-600 px-2 py-0.5 rounded border border-slate-200 inline-flex items-center gap-1 shadow-2xs transition-colors"
                                title={`Primary Key: ${cert.certificateNo} (Click to Edit)`}
                              >
                                <Medal size={11} className="text-orange-500 shrink-0" />
                                <span>PK: {cert.certificateNo}</span>
                              </button>
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

                            {/* Customer Account */}
                            <td className="py-2.5 px-3 max-w-[200px]">
                              <span className="font-semibold text-slate-900 truncate block text-xs" title={cert.customerName}>
                                {cert.customerName}
                              </span>
                            </td>

                            {/* Type */}
                            <td className="py-2.5 px-3">
                              <span className="text-[10px] font-medium px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                                {cert.type} Warranty
                              </span>
                            </td>

                            {/* PVC Codes */}
                            <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 max-w-[160px] truncate" title={cert.productPvcCodes.join(', ')}>
                              {cert.productPvcCodes.join(', ')}
                            </td>

                            {/* Start Date */}
                            <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                              {cert.startDate}
                            </td>

                            {/* End Date */}
                            <td className="py-2.5 px-3 font-mono text-[11px] font-semibold text-slate-800">
                              {cert.endDate}
                            </td>

                            {/* Status */}
                            <td className="py-2.5 px-3 text-center">
                              <span className={cn(
                                "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                                cert.status === 'Active' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                cert.status === 'Expiring Soon' ? "bg-amber-50 text-amber-700 border-amber-200" :
                                "bg-slate-100 text-slate-600 border-slate-200"
                              )}>
                                {cert.status}
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="py-2.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => {
                                    setEditingCert(cert);
                                    setCertForm({
                                      certificateNo: cert.certificateNo,
                                      customerName: cert.customerName,
                                      projectId: cert.projectId,
                                      type: cert.type,
                                      productPvcCodes: cert.productPvcCodes.join(', '),
                                      startDate: cert.startDate,
                                      endDate: cert.endDate,
                                      status: cert.status
                                    });
                                  }}
                                  className="p-1 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                  title="Edit Certificate"
                                >
                                  <Edit2 size={12} />
                                </button>
                                <button
                                  onClick={() => handleDeleteCert(cert.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                  title="Delete Certificate"
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
                        <td colSpan={9} className="py-12 text-center text-slate-400 text-xs">
                          No warranty certificates match your filter criteria.
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {filteredCertificates.map(cert => (
                <div key={cert.id} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs font-bold text-orange-600">{cert.certificateNo}</span>
                      <div className="flex items-center gap-1.5">
                        <span className={cn(
                          "text-[10px] font-medium px-2 py-0.5 rounded-full",
                          cert.status === 'Active' ? "bg-emerald-50 text-emerald-700" :
                          "bg-amber-50 text-amber-700"
                        )}>
                          {cert.status}
                        </span>
                        <button
                          onClick={() => {
                            setEditingCert(cert);
                            setCertForm({
                              certificateNo: cert.certificateNo,
                              customerName: cert.customerName,
                              projectId: cert.projectId,
                              type: cert.type,
                              productPvcCodes: cert.productPvcCodes.join(', '),
                              startDate: cert.startDate,
                              endDate: cert.endDate,
                              status: cert.status
                            });
                          }}
                          className="p-1 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                          title="Edit Certificate"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteCert(cert.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Certificate"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                    <h4 className="text-xs font-semibold text-slate-900">{cert.customerName}</h4>
                    <p className="text-[11px] text-slate-500 mt-1">{cert.projectId}</p>
                    <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 space-y-1">
                      <p><strong>Coverage Type:</strong> {cert.type} Warranty</p>
                      <p><strong>Products:</strong> {cert.productPvcCodes.join(', ')}</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Valid: {cert.startDate}</span>
                    <span className="font-semibold text-slate-700 font-mono">Until {cert.endDate}</span>
                  </div>
                </div>
              ))}
              {filteredCertificates.length === 0 && (
                <div className="col-span-3 py-12 text-center text-slate-400 text-xs">
                  No warranty certificates found.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Maintenance History */}
      {activeTab === 'history' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Completed Service & Maintenance Logs</h3>
              <p className="text-xs text-slate-500">Historical records of post-handover interventions.</p>
            </div>
            <button
              onClick={() => {
                setEditingHistory(null);
                setHistoryForm({
                  title: '',
                  date: new Date().toISOString().split('T')[0],
                  technician: 'Kasun Wickramasinghe',
                  clientSigned: true
                });
                setIsAddingHistory(true);
              }}
              className="px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-medium transition-colors shadow-xs flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>Add History Log</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {historyLogs.map(item => (
              <div key={item.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <h4 className="font-semibold text-slate-900">{item.title}</h4>
                  <p className="text-slate-500 text-[11px]">Completed on {item.date} by {item.technician}</p>
                </div>
                <div className="flex items-center gap-3">
                  {item.clientSigned && (
                    <span className="text-emerald-600 font-semibold flex items-center gap-1">
                      <Check size={14} /> Signed Off by Client
                    </span>
                  )}
                  <button
                    onClick={() => {
                      setEditingHistory(item);
                      setHistoryForm({
                        title: item.title,
                        date: item.date,
                        technician: item.technician,
                        clientSigned: item.clientSigned
                      });
                    }}
                    className="p-1 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                    title="Edit Log"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    onClick={() => handleDeleteHistory(item.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete Log"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal for Service Request (Add / Edit) */}
      {(isAddingReq || editingReq) && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                {editingReq ? `Edit Service Request: ${editingReq.requestNo}` : 'Log After-Sales Service Request'}
              </h3>
              <button onClick={() => { setIsAddingReq(false); setEditingReq(null); }} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveReqSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Ticket Number</label>
                  <input
                    type="text"
                    value={reqForm.requestNo}
                    onChange={e => setReqForm({ ...reqForm, requestNo: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Urgency Level</label>
                  <select
                    value={reqForm.urgency}
                    onChange={e => setReqForm({ ...reqForm, urgency: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-orange-500 bg-white"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Project Name *</label>
                  <input
                    type="text"
                    required
                    value={reqForm.projectId}
                    onChange={e => setReqForm({ ...reqForm, projectId: e.target.value })}
                    placeholder="e.g. Sirius Mall Storefront"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Component / PVC Code</label>
                  <input
                    type="text"
                    value={reqForm.pvcCode}
                    onChange={e => setReqForm({ ...reqForm, pvcCode: e.target.value })}
                    placeholder="AL-WD-001"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Issue Description *</label>
                <textarea
                  rows={2}
                  required
                  value={reqForm.description}
                  onChange={e => setReqForm({ ...reqForm, description: e.target.value })}
                  placeholder="Describe customer complaint or hardware malfunction..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-orange-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Technician</label>
                  <input
                    type="text"
                    value={reqForm.technicianId}
                    onChange={e => setReqForm({ ...reqForm, technicianId: e.target.value })}
                    placeholder="e.g. Kasun Wickramasinghe"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Ticket Status</label>
                  <select
                    value={reqForm.status}
                    onChange={e => setReqForm({ ...reqForm, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-orange-500 bg-white"
                  >
                    <option value="New">New</option>
                    <option value="Scheduled">Scheduled</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setIsAddingReq(false); setEditingReq(null); }}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-semibold shadow-xs"
                >
                  {editingReq ? 'Update Ticket' : 'Create Service Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for Warranty Certificate (Add / Edit) */}
      {(isAddingCert || editingCert) && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                {editingCert ? `Edit Certificate: ${editingCert.certificateNo}` : 'Issue Warranty Certificate'}
              </h3>
              <button onClick={() => { setIsAddingCert(false); setEditingCert(null); }} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveCertSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Certificate Number *</label>
                  <input
                    type="text"
                    required
                    value={certForm.certificateNo}
                    onChange={e => setCertForm({ ...certForm, certificateNo: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Warranty Coverage Type</label>
                  <select
                    value={certForm.type}
                    onChange={e => setCertForm({ ...certForm, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-orange-500 bg-white"
                  >
                    <option value="Product">Product (Aluminium System)</option>
                    <option value="Glass">Glass & Glazing Unit</option>
                    <option value="Finish">Surface Finish & Powder Coating</option>
                    <option value="Hardware">Hardware & Ironmongery</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Customer / Client Name *</label>
                <input
                  type="text"
                  required
                  value={certForm.customerName}
                  onChange={e => setCertForm({ ...certForm, customerName: e.target.value })}
                  placeholder="e.g. Sirius Retail Group PLC"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Project Name</label>
                <input
                  type="text"
                  value={certForm.projectId}
                  onChange={e => setCertForm({ ...certForm, projectId: e.target.value })}
                  placeholder="Sirius Mall Storefront"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Covered Product Codes (comma separated)</label>
                <input
                  type="text"
                  value={certForm.productPvcCodes}
                  onChange={e => setCertForm({ ...certForm, productPvcCodes: e.target.value })}
                  placeholder="AL-WD-001, GL-PT-001"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Warranty Start</label>
                  <input
                    type="date"
                    value={certForm.startDate}
                    onChange={e => setCertForm({ ...certForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Warranty Expiry (10-Year)</label>
                  <input
                    type="date"
                    value={certForm.endDate}
                    onChange={e => setCertForm({ ...certForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setIsAddingCert(false); setEditingCert(null); }}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-semibold shadow-xs"
                >
                  {editingCert ? 'Update Certificate' : 'Issue Certificate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for Maintenance History (Add / Edit) */}
      {(isAddingHistory || editingHistory) && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                {editingHistory ? 'Edit History Record' : 'Record Completed Maintenance'}
              </h3>
              <button onClick={() => { setIsAddingHistory(false); setEditingHistory(null); }} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveHistorySubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Intervention Title *</label>
                <input
                  type="text"
                  required
                  value={historyForm.title}
                  onChange={e => setHistoryForm({ ...historyForm, title: e.target.value })}
                  placeholder="e.g. Facade joint silicone seal renewal"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-orange-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={historyForm.date}
                    onChange={e => setHistoryForm({ ...historyForm, date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Technician</label>
                  <input
                    type="text"
                    value={historyForm.technician}
                    onChange={e => setHistoryForm({ ...historyForm, technician: e.target.value })}
                    placeholder="Sachith Fernando"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-orange-500"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="clientSignCheck"
                  checked={historyForm.clientSigned}
                  onChange={e => setHistoryForm({ ...historyForm, clientSigned: e.target.checked })}
                  className="rounded text-orange-500"
                />
                <label htmlFor="clientSignCheck" className="text-xs text-slate-700 font-medium">Signed Off & Accepted by Client</label>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setIsAddingHistory(false); setEditingHistory(null); }}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-semibold shadow-xs"
                >
                  Save Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
