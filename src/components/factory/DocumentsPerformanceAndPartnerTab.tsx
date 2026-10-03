import React, { useState, useMemo } from 'react';
import {
  FileText,
  BarChart3,
  Globe,
  Plus,
  Download,
  Eye,
  Printer,
  ShieldCheck,
  Trash2
} from 'lucide-react';
import { FactoryQuotationDocumentModal, FactoryRecordDocumentSpec } from './FactoryQuotationDocumentModal';
import {
  buildTechnicalDocumentDocSpec,
  buildGeneratedDocumentDocSpec,
  buildPartnerDocSpec,
  buildFactoryProfileDocSpec
} from './factoryDocumentBuilders';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import {
  FactoryMasterProfile,
  FactoryWorkPackageAssignment,
  FactoryExecutionTask,
  ControlledTechnicalDocument,
  GeneratedFactoryDocument,
  GeneratedFactoryDocType,
  FactoryPartnerType,
  FactoryPartnerRegistrationRecord
} from '../../types/factoryPortal';
import { SecurityUser } from '../../types/security';
import { factoryExecutionService } from '../../services/factoryExecutionService';
import { toast } from 'sonner';

const ALL_GENERATED_FACTORY_DOC_TYPES: GeneratedFactoryDocType[] = [
  'Work Order (WO)',
  'Job Card (JC)',
  'Production Order (PO-FAB)',
  'Task Assignment Sheet',
  'Digital Worksheet Printout',
  'Fabrication Sheet',
  'Profile & Sheet Cutting List',
  'Material Issue & Consumption Record',
  'Factory Inspection Request (FIR)',
  'Quality Inspection Report (QIR)',
  'Daily Factory Activity Report (DFAR)',
  'Weekly Progress & Earned Value Report',
  'Work Package Completion Certificate',
  'Crate & Pallet Packing List',
  'Site Delivery Note (DN)',
  'Gate Pass & Dispatch Record',
  'Factory Acceptance Certificate (FAC)',
  'Rework Instruction & Rectification Sheet',
  'Non-Conformance Report (NCR)',
  'Machine Preventive Maintenance Record',
  'Factory HSE Toolbox & Permit Record',
  'Attendance-Linked Production Sheet',
  'Photographic Evidence Dossier',
  'Site Installation Handover Certificate',
  'Project & Factory Closeout Dossier'
];

const PARTNER_TYPES: FactoryPartnerType[] = [
  'Sales Partner',
  'Supplier Partner',
  'Partnered Factory',
  'Contracted Factory',
  'Subcontractor Partner',
  'Logistics Partner'
];

interface DocumentsPerformanceAndPartnerTabProps {
  mode: 'documents_drawings' | 'analytics_audit' | 'partner_portal';
  currentUser: SecurityUser | null;
  factories: FactoryMasterProfile[];
  workPackages: FactoryWorkPackageAssignment[];
  tasks: FactoryExecutionTask[];
  documents: ControlledTechnicalDocument[];
  generatedDocs: GeneratedFactoryDocument[];
  onRefresh: () => void;
}

export const DocumentsPerformanceAndPartnerTab: React.FC<DocumentsPerformanceAndPartnerTabProps> = ({
  mode,
  currentUser,
  factories,
  workPackages,
  tasks,
  documents,
  generatedDocs,
  onRefresh
}) => {
  const [selectedDocType, setSelectedDocType] = useState<GeneratedFactoryDocType>('Work Order (WO)');
  const [localTick, setLocalTick] = useState(0);

  const activeFac = factories[0] || factoryExecutionService.getFactories()[0];
  const activeWp = workPackages[0] || factoryExecutionService.getWorkPackages()[0];

  const [showDocModal, setShowDocModal] = useState(false);
  const [docNumber, setDocNumber] = useState('DRW-SM-CW-108');
  const [docTitle, setDocTitle] = useState('');
  const [docCategory, setDocCategory] = useState<ControlledTechnicalDocument['category']>('Shop Drawing');
  const [docDiscipline, setDocDiscipline] = useState<ControlledTechnicalDocument['discipline']>('Facade & Curtain Wall');
  const [docRev, setDocRev] = useState('Rev A');
  const [docAuthor, setDocAuthor] = useState(currentUser?.fullName || 'Eng. Nuwan Perera');
  const [docDrawingScale, setDocDrawingScale] = useState('1:10 / A1 Sheet');
  const [docInstructions, setDocInstructions] = useState('Verify mullion splice positions & thermal break tolerances on CNC bed.');
  const [docSizeLabel, setDocSizeLabel] = useState('680 KB (≤ 1 MB Image/Doc)');
  const [docDataUrl, setDocDataUrl] = useState<string | undefined>(undefined);
  const [docFileError, setDocFileError] = useState('');

  // Detail & Preview Modals
  const [viewingDoc, setViewingDoc] = useState<ControlledTechnicalDocument | null>(null);
  const [viewingPartner, setViewingPartner] = useState<FactoryPartnerRegistrationRecord | null>(null);
  const [docSpec, setDocSpec] = useState<FactoryRecordDocumentSpec | null>(null);

  // Partner Portal State (Advanced Form)
  const [partnerFilter, setPartnerFilter] = useState<string>('ALL');
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [partnerName, setPartnerName] = useState('');
  const [partnerType, setPartnerType] = useState<FactoryPartnerType>('Sales Partner');
  const [partnerRegNo, setPartnerRegNo] = useState('PV-2026-88412');
  const [partnerTaxVatNo, setPartnerTaxVatNo] = useState('VAT-11489200-7000');
  const [partnerContact, setPartnerContact] = useState('');
  const [partnerDesignation, setPartnerDesignation] = useState('Managing Director / Commercial Head');
  const [partnerPhone, setPartnerPhone] = useState('+94 11 240 0000');
  const [partnerEmail, setPartnerEmail] = useState('commercial@partner-industrial.lk');
  const [partnerCity, setPartnerCity] = useState('Colombo');
  const [partnerAddress, setPartnerAddress] = useState('No. 48, Industrial Parkway, Colombo 02');
  const [partnerContractRef, setPartnerContractRef] = useState('AGR-2026-105');
  const [partnerPaymentTerms, setPartnerPaymentTerms] = useState('30 Days Credit / Milestone LC');
  const [partnerCreditLimit, setPartnerCreditLimit] = useState(25000000);
  const [partnerIsoCerts, setPartnerIsoCerts] = useState('ISO 9001:2015, Qualicoat Class 2');
  const [partnerScope, setPartnerScope] = useState('Facade Sales, Architectural Extrusions & DGU Glass Supply');

  const partners = useMemo(() => {
    const all = factoryExecutionService.getFactoryPartners();
    return all.filter(p => partnerFilter === 'ALL' || p.partnerType === partnerFilter);
  }, [partnerFilter, localTick]);

  const handleDocFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const res = factoryExecutionService.validateEvidenceFileSize(file);
    if (!res.valid) {
      setDocFileError(res.error || 'File exceeds limit');
      toast.error(res.error || 'File exceeds limit');
      e.target.value = '';
      return;
    }
    setDocFileError('');
    setDocSizeLabel(`${res.fileSizeLabel} (${res.maxLimitLabel})`);
    if (!docTitle.trim()) setDocTitle(file.name);
    try {
      const dataUrl = await factoryExecutionService.readFileAsDataUrl(file);
      setDocDataUrl(dataUrl);
    } catch {
      // fallback if read fails
    }
  };

  const handleGenerateDoc = () => {
    const created = factoryExecutionService.generateOperationalDocument(
      currentUser,
      selectedDocType,
      activeWp?.projectId || 'PRJ-2026-001',
      activeFac?.id || 'fac-inv-01',
      activeWp?.packageCode,
      tasks[0]?.taskCode
    );
    toast.success('Document Generated');
    setLocalTick(t => t + 1);
    onRefresh();
    if (created) {
      setDocSpec(buildGeneratedDocumentDocSpec(created));
    }
  };

  const handleUploadDrawing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim() || docFileError) return;
    factoryExecutionService.uploadOrReviseTechnicalDocument(currentUser, {
      docNumber,
      title: docTitle.trim(),
      category: docCategory,
      discipline: docDiscipline,
      currentRevision: docRev,
      preparedBy: docAuthor,
      technicalInstructions: `Scale/Format: ${docDrawingScale} — ${docInstructions}`,
      fileSize: docSizeLabel,
      dataUrl: docDataUrl,
      factoryId: activeFac?.id || 'fac-inv-01',
      projectId: activeWp?.projectId || 'PRJ-2026-001'
    });
    toast.success('Advanced Controlled Technical Document Saved');
    setShowDocModal(false);
    setDocTitle('');
    setDocDataUrl(undefined);
    setDocFileError('');
    onRefresh();
  };

  const handleRegisterPartner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerName.trim()) return;
    factoryExecutionService.saveFactoryPartner(currentUser, {
      partnerName: partnerName.trim(),
      partnerType,
      linkedFactoryId: activeFac?.id || 'fac-inv-01',
      linkedProjectId: activeWp?.projectId || 'PRJ-2026-001',
      contactPerson: `${partnerContact.trim() || 'Partner Manager'} (${partnerDesignation})`,
      phone: partnerPhone,
      email: partnerEmail,
      city: `${partnerCity} (${partnerAddress})`,
      contractOrAgreementRef: `${partnerContractRef} | Reg: ${partnerRegNo} | VAT: ${partnerTaxVatNo}`,
      materialsOrServicesScope: `${partnerScope} | Payment: ${partnerPaymentTerms} | Credit Limit: LKR ${partnerCreditLimit.toLocaleString()} | Certs: ${partnerIsoCerts}`
    });
    setShowPartnerModal(false);
    setPartnerName('');
    setPartnerContact('');
    setLocalTick(t => t + 1);
    onRefresh();
    toast.success('Advanced Partner Profile Registered');
  };

  if (mode === 'documents_drawings') {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-slate-200/80 px-4 py-2.5 shadow-2xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-orange-500" />
            <h2 className="text-xs font-bold text-slate-800">Documents ({documents.length})</h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedDocType}
              onChange={e => setSelectedDocType(e.target.value as GeneratedFactoryDocType)}
              className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 font-medium text-slate-700"
            >
              {ALL_GENERATED_FACTORY_DOC_TYPES.map(dt => (
                <option key={dt} value={dt}>{dt}</option>
              ))}
            </select>
            <button
              onClick={handleGenerateDoc}
              className="px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 border border-sky-200/80 text-xs font-semibold text-sky-700 transition-colors"
            >
              Generate
            </button>
            <button
              onClick={() => setShowDocModal(true)}
              className="px-3.5 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Upload
            </button>
          </div>
        </div>

        {/* Controlled Drawings Compact Row per Record + View & Download */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-semibold text-slate-400">
                  <th className="py-2.5 px-4">Code</th>
                  <th className="py-2.5 px-4">Title</th>
                  <th className="py-2.5 px-4">Rev</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {documents.map(doc => (
                  <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-4 font-mono font-bold text-orange-600 whitespace-nowrap">{doc.docNumber}</td>
                    <td className="py-2.5 px-4 font-bold text-slate-900 whitespace-nowrap">{doc.title}</td>
                    <td className="py-2.5 px-4 font-mono text-slate-600 whitespace-nowrap">{doc.currentRevision}</td>
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-[10px] font-bold">
                        {doc.approvalStatus}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => setDocSpec(buildTechnicalDocumentDocSpec(doc))}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold inline-flex items-center gap-1"
                        >
                          <Printer className="w-3.5 h-3.5 text-orange-500" />
                          Doc
                        </button>
                        <button
                          onClick={() => setViewingDoc(doc)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          View
                        </button>
                        <button
                          onClick={() => {
                            factoryExecutionService.downloadMediaOrFile(
                              `${doc.docNumber}_${doc.currentRevision}.txt`,
                              doc.dataUrl,
                              `Document: ${doc.docNumber}\nTitle: ${doc.title}\nRevision: ${doc.currentRevision}\nProject: ${doc.projectName}\nStatus: ${doc.approvalStatus}\nInstructions: ${doc.technicalInstructions}`
                            );
                            toast.success(`Downloaded ${doc.docNumber}`);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 text-[11px] font-semibold inline-flex items-center gap-1"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download
                        </button>
                        <button
                          onClick={() => {
                            if (!confirm(`Delete document ${doc.docNumber}?`)) return;
                            factoryExecutionService.deleteFactoryRecord('CONTROLLED_TECHNICAL_DOCUMENT', doc.id);
                            setLocalTick(t => t + 1);
                            onRefresh();
                            toast.success('Document deleted');
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

        {/* Generated Docs Compact Row per Record */}
        {generatedDocs.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-900">Generated ({generatedDocs.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-semibold text-slate-400">
                    <th className="py-2.5 px-4">Control No</th>
                    <th className="py-2.5 px-4">Type</th>
                    <th className="py-2.5 px-4">Factory</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {generatedDocs.map(g => (
                    <tr key={g.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-4 font-mono font-bold text-orange-600 whitespace-nowrap">{g.docControlNo}</td>
                      <td className="py-2.5 px-4 font-bold text-slate-900 whitespace-nowrap">{g.docType}</td>
                      <td className="py-2.5 px-4 text-slate-600 whitespace-nowrap">{g.factoryName}</td>
                      <td className="py-2.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => setDocSpec(buildGeneratedDocumentDocSpec(g))}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold inline-flex items-center gap-1"
                          >
                            <Printer className="w-3.5 h-3.5 text-orange-500" />
                            Doc
                          </button>
                          <button
                            onClick={() => {
                              factoryExecutionService.downloadMediaOrFile(
                                `${g.docControlNo}.txt`,
                                undefined,
                                `Generated Operational Document: ${g.docControlNo}\nType: ${g.docType}\nProject: ${g.projectName}\nFactory: ${g.factoryName}\nGenerated At: ${g.generatedAt}`
                              );
                              toast.success(`Downloaded ${g.docControlNo}`);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-orange-50 text-slate-700 hover:text-orange-700 text-[11px] font-semibold inline-flex items-center gap-1"
                          >
                            <Download className="w-3 h-3" /> Download
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

        {/* View Document Full Details & Media Preview Modal */}
        {viewingDoc && (
          <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-orange-600">{viewingDoc.docNumber}</span>
                  <h3 className="text-sm font-bold text-slate-900">{viewingDoc.title}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const spec = buildTechnicalDocumentDocSpec(viewingDoc);
                      setViewingDoc(null);
                      setDocSpec(spec);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-semibold inline-flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5 text-orange-500" />
                    Doc
                  </button>
                  <button
                    onClick={() => {
                      factoryExecutionService.downloadMediaOrFile(
                        `${viewingDoc.docNumber}_${viewingDoc.currentRevision}.txt`,
                        viewingDoc.dataUrl,
                        `Document: ${viewingDoc.docNumber}\nTitle: ${viewingDoc.title}\nRevision: ${viewingDoc.currentRevision}`
                      );
                      toast.success(`Downloaded ${viewingDoc.docNumber}`);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold inline-flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </button>
                  <button
                    onClick={() => setViewingDoc(null)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold"
                  >
                    Close
                  </button>
                </div>
              </div>
              <div className="p-5 space-y-4 text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                  <div>
                    <div className="text-[10px] font-semibold text-slate-400">Category</div>
                    <div className="font-bold text-slate-900 mt-0.5">{viewingDoc.category}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold text-slate-400">Revision</div>
                    <div className="font-mono font-bold text-slate-900 mt-0.5">{viewingDoc.currentRevision}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold text-slate-400">Approval Status</div>
                    <div className="font-bold text-emerald-700 mt-0.5">{viewingDoc.approvalStatus}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold text-slate-400">Project</div>
                    <div className="font-semibold text-slate-800 mt-0.5">{viewingDoc.projectName}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold text-slate-400">File Size</div>
                    <div className="font-mono text-slate-700 mt-0.5">{viewingDoc.fileSize}</div>
                  </div>
                  <div className="col-span-2 sm:col-span-3">
                    <div className="text-[10px] font-semibold text-slate-400">Technical Instructions</div>
                    <div className="font-medium text-slate-800 mt-0.5">{viewingDoc.technicalInstructions}</div>
                  </div>
                </div>

                {viewingDoc.dataUrl && (
                  <div className="bg-slate-950 rounded-xl p-4 flex items-center justify-center max-h-[340px] overflow-auto">
                    {viewingDoc.dataUrl.startsWith('data:video') ? (
                      <video src={viewingDoc.dataUrl} controls className="max-h-[300px] rounded-lg" />
                    ) : viewingDoc.dataUrl.startsWith('data:image') || viewingDoc.dataUrl.startsWith('http') ? (
                      <img
                        src={viewingDoc.dataUrl}
                        alt={viewingDoc.title}
                        className="max-h-[300px] object-contain rounded-lg"
                      />
                    ) : (
                      <div className="text-slate-300 text-xs py-8">
                        Document Preview Attached ({viewingDoc.fileSize}) — Click Download above to save locally.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {showDocModal && (
          <div className="fixed inset-0 bg-slate-900/60 z-[9998] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 bg-white text-slate-900 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Upload Technical Document / Shop Drawing
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Enter document code, revision, category, and simple instructions
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowDocModal(false);
                    setDocFileError('');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-semibold"
                >
                  Close
                </button>
              </div>
              <form onSubmit={handleUploadDrawing} className="p-6 space-y-4 overflow-y-auto text-xs">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-orange-600 uppercase tracking-wider">
                      1. Select File & Document Classification
                    </span>
                    <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                      Max 1MB Image/Doc • 5MB Video
                    </span>
                  </div>
                  <input
                    type="file"
                    accept="image/*,video/*,.pdf,.doc,.docx,.dwg,.xlsx"
                    onChange={handleDocFileChange}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white"
                  />
                  {docFileError && (
                    <p className="text-[11px] font-semibold text-red-600 mt-1">{docFileError}</p>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Document Category</label>
                      <select
                        value={docCategory}
                        onChange={e => setDocCategory(e.target.value as any)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                      >
                        <option value="Shop Drawing">Shop Drawing</option>
                        <option value="Fabrication & Cutting Detail">Fabrication & Cutting Detail</option>
                        <option value="CNC Machining Program">CNC Machining Program</option>
                        <option value="Method Statement (MOS)">Method Statement (MOS)</option>
                        <option value="Inspection & Test Plan (ITP)">Inspection & Test Plan (ITP)</option>
                        <option value="Material Submittal & TDS">Material Submittal & TDS</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Engineering Discipline</label>
                      <select
                        value={docDiscipline}
                        onChange={e => setDocDiscipline(e.target.value as any)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                      >
                        <option value="Facade & Curtain Wall">Facade & Curtain Wall</option>
                        <option value="Structural Steel & Brackets">Structural Steel & Brackets</option>
                        <option value="Architectural Glazing">Architectural Glazing</option>
                        <option value="Aluminium Doors & Windows">Aluminium Doors & Windows</option>
                        <option value="Cladding & Louvers">Cladding & Louvers</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Validated File Size</label>
                      <input
                        type="text"
                        readOnly
                        value={docSizeLabel}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-100 font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="text-[11px] font-bold text-orange-600 uppercase tracking-wider">
                    2. Document Code, Revision, Scale & Technical Instructions
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Document Code</label>
                      <input
                        type="text"
                        required
                        value={docNumber}
                        onChange={e => setDocNumber(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Revision</label>
                      <input
                        type="text"
                        value={docRev}
                        onChange={e => setDocRev(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Prepared By</label>
                      <input
                        type="text"
                        value={docAuthor}
                        onChange={e => setDocAuthor(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Scale / Sheet Size</label>
                      <input
                        type="text"
                        value={docDrawingScale}
                        onChange={e => setDocDrawingScale(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Document Title</label>
                    <input
                      type="text"
                      required
                      value={docTitle}
                      onChange={e => setDocTitle(e.target.value)}
                      placeholder="e.g., Typical Unitized Curtain Wall Panel Elevation & CNC Milling Detail"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Technical Fabrication & Floor Instructions</label>
                    <input
                      type="text"
                      value={docInstructions}
                      onChange={e => setDocInstructions(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowDocModal(false)}
                    className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={Boolean(docFileError)}
                    className="px-5 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-xs font-semibold shadow-2xs"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

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
      </div>
    );
  }

  // ANALYTICS DASHBOARD MODE
  if (mode === 'analytics_audit') {
    const chartData = tasks.slice(0, 6).map(t => ({
      name: t.taskCode,
      Planned: t.plannedQuantity,
      Completed: t.completedQuantity,
      Rework: t.reworkQuantity + t.rejectedQuantity
    }));
    const auditLogs = factoryExecutionService.getFactoryAuditLogs().slice(0, 25);

    return (
      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-slate-200/80 px-4 py-2.5 shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-orange-500" />
            <h2 className="text-xs font-bold text-slate-800">Analytics Dashboard</h2>
          </div>
        </div>

        {/* Analytics Chart */}
        {chartData.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
            <h3 className="text-xs font-bold text-slate-900 mb-3">Task Execution & Quality</h3>
            <div className="h-[190px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '11px' }} />
                  <Bar dataKey="Planned" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Completed" fill="#f97316" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Rework" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Single-Row Factory Performance Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-semibold text-slate-400">
                  <th className="py-2.5 px-4">Code</th>
                  <th className="py-2.5 px-4">Factory</th>
                  <th className="py-2.5 px-4">Ownership</th>
                  <th className="py-2.5 px-4 text-center">Score</th>
                  <th className="py-2.5 px-4 text-center">On-Time</th>
                  <th className="py-2.5 px-4 text-center">Quality</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {factories.map(f => (
                  <tr key={f.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-4 font-mono font-bold text-orange-600 whitespace-nowrap">{f.factoryCode}</td>
                    <td className="py-2.5 px-4 font-bold text-slate-900 whitespace-nowrap">{f.name}</td>
                    <td className="py-2.5 px-4 text-slate-600 whitespace-nowrap">{f.ownershipType}</td>
                    <td className="py-2.5 px-4 text-center font-mono font-bold text-orange-700">
                      {f.performanceScorecard.overallScore}%
                    </td>
                    <td className="py-2.5 px-4 text-center font-mono font-semibold text-sky-700">
                      {f.performanceScorecard.onTimeCompletionRate}%
                    </td>
                    <td className="py-2.5 px-4 text-center font-mono font-bold text-emerald-600">
                      {f.performanceScorecard.qualityAcceptanceRate}%
                    </td>
                    <td className="py-2.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => setDocSpec(buildFactoryProfileDocSpec(f))}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold inline-flex items-center gap-1"
                      >
                        <Printer className="w-3.5 h-3.5 text-orange-500" />
                        Doc
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Factory Approvals, Revisions, Edits & Deletions Audit Log Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-orange-500" />
              <h3 className="text-xs font-bold text-slate-900">
                System Approval, Revision, Edit & Deletion Audit Log ({auditLogs.length})
              </h3>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-semibold text-slate-400">
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-4">Action</th>
                  <th className="py-2.5 px-4">Record</th>
                  <th className="py-2.5 px-4">Authorized User (Name & ID)</th>
                  <th className="py-2.5 px-4">Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/70 whitespace-nowrap">
                    <td className="py-2 px-4 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                      {log.timestamp.replace('T', ' ').slice(0, 16)}
                    </td>
                    <td className="py-2 px-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          log.action === 'APPROVED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : log.action === 'REVISED'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : log.action === 'DELETED'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-sky-50 text-sky-700 border border-sky-200'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2 px-4 whitespace-nowrap">
                      <span className="font-mono font-bold text-orange-600">{log.recordCode}</span>
                      <span className="text-slate-500 ml-1.5">({log.entityType})</span>
                    </td>
                    <td className="py-2 px-4 whitespace-nowrap font-semibold text-slate-800">
                      {log.performedByName || log.actorFullName}{' '}
                      <span className="font-mono text-[11px] text-slate-500">
                        (@{log.performedByUsername || log.actorUsername} • ID: {log.performedById || log.actorUserId})
                      </span>
                    </td>
                    <td className="py-2 px-4 text-slate-600 whitespace-nowrap truncate max-w-xs">{log.summary || log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

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
      </div>
    );
  }

  // PARTNER PORTAL (Compact Row per Record + View Details Modal)
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200/80 px-4 py-2.5 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Globe className="w-4 h-4 text-orange-500" />
          <h2 className="text-xs font-bold text-slate-800">Partners ({partners.length})</h2>
          <select
            value={partnerFilter}
            onChange={e => setPartnerFilter(e.target.value)}
            className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 font-semibold text-slate-700"
          >
            <option value="ALL">All Partner Types</option>
            {PARTNER_TYPES.map(pt => (
              <option key={pt} value={pt}>{pt}</option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setShowPartnerModal(true)}
          className="px-3.5 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add
        </button>
      </div>

      {/* Partners Compact Single-Row Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-semibold text-slate-400">
                <th className="py-2.5 px-4">Code</th>
                <th className="py-2.5 px-4">Partner Name</th>
                <th className="py-2.5 px-4">Type</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {partners.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-2.5 px-4 font-mono font-bold text-orange-600 whitespace-nowrap">{p.partnerCode}</td>
                  <td className="py-2.5 px-4 font-bold text-slate-900 whitespace-nowrap">{p.partnerName}</td>
                  <td className="py-2.5 px-4 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-[10px] font-bold">
                      {p.partnerType}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-[10px] font-bold">
                      {p.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        onClick={() => setDocSpec(buildPartnerDocSpec(p))}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold inline-flex items-center gap-1"
                      >
                        <Printer className="w-3.5 h-3.5 text-orange-500" />
                        Doc
                      </button>
                      <button
                        onClick={() => setViewingPartner(p)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        View
                      </button>
                      <button
                        onClick={() => {
                          if (!confirm(`Delete partner ${p.partnerCode} (${p.partnerName})?`)) return;
                          factoryExecutionService.deleteFactoryRecord('FACTORY_PARTNER', p.id);
                          setLocalTick(t => t + 1);
                          onRefresh();
                          toast.success('Partner deleted');
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

      {/* View Partner Full Details Modal */}
      {viewingPartner && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-orange-600">{viewingPartner.partnerCode}</span>
                <h3 className="text-sm font-bold text-slate-900">{viewingPartner.partnerName}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const spec = buildPartnerDocSpec(viewingPartner);
                    setViewingPartner(null);
                    setDocSpec(spec);
                  }}
                  className="px-3 py-1 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold inline-flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Doc
                </button>
                <button
                  onClick={() => setViewingPartner(null)}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="p-5 grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <div className="text-[10px] font-semibold text-slate-400">Partner Type</div>
                <div className="font-bold text-indigo-700 mt-0.5">{viewingPartner.partnerType}</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <div className="text-[10px] font-semibold text-slate-400">Agreement / Contract</div>
                <div className="font-mono font-bold text-slate-900 mt-0.5">{viewingPartner.contractOrAgreementRef}</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <div className="text-[10px] font-semibold text-slate-400">Linked Factory</div>
                <div className="font-semibold text-slate-800 mt-0.5">{viewingPartner.linkedFactoryName}</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <div className="text-[10px] font-semibold text-slate-400">Linked Project</div>
                <div className="font-semibold text-slate-800 mt-0.5">{viewingPartner.linkedProjectName}</div>
              </div>
              <div className="col-span-2 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <div className="text-[10px] font-semibold text-slate-400">Scope (Sales / Supply / Services)</div>
                <div className="font-bold text-slate-900 mt-0.5">{viewingPartner.materialsOrServicesScope}</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <div className="text-[10px] font-semibold text-slate-400">Contact Person</div>
                <div className="font-semibold text-slate-800 mt-0.5">
                  {viewingPartner.contactPerson} ({viewingPartner.phone})
                </div>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <div className="text-[10px] font-semibold text-slate-400">City & Rating</div>
                <div className="font-semibold text-slate-800 mt-0.5">
                  {viewingPartner.city} • {viewingPartner.performanceRating}%
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Register Partner Modal (Advanced Multi-Section Form) */}
      {showPartnerModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-[9998] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-white text-slate-900 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Add Partner Record
                </h3>
                <p className="text-[11px] text-slate-500">
                  Enter partner details, agreement code, and supply scope
                </p>
              </div>
              <button
                onClick={() => setShowPartnerModal(false)}
                className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-semibold"
              >
                Close
              </button>
            </div>
            <form onSubmit={handleRegisterPartner} className="p-6 space-y-4 overflow-y-auto text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="text-[11px] font-bold text-orange-600 uppercase tracking-wider">
                  1. Partner Classification, Legal Registration & Contract Reference
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Partner Classification</label>
                    <select
                      value={partnerType}
                      onChange={e => setPartnerType(e.target.value as FactoryPartnerType)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    >
                      {PARTNER_TYPES.map(pt => (
                        <option key={pt} value={pt}>{pt}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Company Reg No (BRN)</label>
                    <input
                      type="text"
                      value={partnerRegNo}
                      onChange={e => setPartnerRegNo(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Tax / VAT Registration No</label>
                    <input
                      type="text"
                      value={partnerTaxVatNo}
                      onChange={e => setPartnerTaxVatNo(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Legal Partner / Organization Name</label>
                    <input
                      type="text"
                      required
                      value={partnerName}
                      onChange={e => setPartnerName(e.target.value)}
                      placeholder="Prime Glazing & Extrusions Partner Ltd"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Master Agreement Ref</label>
                    <input
                      type="text"
                      value={partnerContractRef}
                      onChange={e => setPartnerContractRef(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="text-[11px] font-bold text-orange-600 uppercase tracking-wider">
                  2. Commercial Terms, Supply / Sales Scope & Quality Certifications
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Authorized Scope (Sales / Supply / Fabrication)</label>
                  <input
                    type="text"
                    value={partnerScope}
                    onChange={e => setPartnerScope(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Payment Terms</label>
                    <input
                      type="text"
                      value={partnerPaymentTerms}
                      onChange={e => setPartnerPaymentTerms(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Credit / Contract Limit (LKR)</label>
                    <input
                      type="number"
                      value={partnerCreditLimit}
                      onChange={e => setPartnerCreditLimit(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">ISO & Quality Certs</label>
                    <input
                      type="text"
                      value={partnerIsoCerts}
                      onChange={e => setPartnerIsoCerts(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="text-[11px] font-bold text-orange-600 uppercase tracking-wider">
                  3. Primary Contact Person & Corporate Address
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Contact Person</label>
                    <input
                      type="text"
                      value={partnerContact}
                      onChange={e => setPartnerContact(e.target.value)}
                      placeholder="Rohan Wijesinghe"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Designation</label>
                    <input
                      type="text"
                      value={partnerDesignation}
                      onChange={e => setPartnerDesignation(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Phone</label>
                    <input
                      type="text"
                      value={partnerPhone}
                      onChange={e => setPartnerPhone(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={partnerEmail}
                      onChange={e => setPartnerEmail(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
                    <input
                      type="text"
                      value={partnerCity}
                      onChange={e => setPartnerCity(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Registered Address</label>
                    <input
                      type="text"
                      value={partnerAddress}
                      onChange={e => setPartnerAddress(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPartnerModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700"
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
    </div>
  );
};
