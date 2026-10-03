import React, { useState, useMemo } from 'react';
import { X, Search, FileText, Download } from 'lucide-react';
import { 
  ProcurementDocumentDefinition, 
  UniversalDocFormData 
} from '../../../services/procurementDocTypes';
import { 
  procurementAllDocsService, 
  ALL_89_PROCUREMENT_DOCUMENTS 
} from '../../../services/procurementAllDocsService';
import { FormalDocumentViewer } from './FormalDocumentViewer';
import { DocumentFormModal } from './DocumentFormModal';

export interface EntityDocContext {
  projectId?: string;
  projectCode?: string;
  projectName?: string;
  projectLocation?: string;
  clientName?: string;
  vendorCode?: string;
  vendorName?: string;
  supplierId?: string;
  refNo?: string;
  contractValue?: number;
}

interface ContextualDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  relevantDocNumbers: number[];
  context: EntityDocContext;
}

export const ContextualDocumentModal: React.FC<ContextualDocumentModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  relevantDocNumbers,
  context
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllDocs, setShowAllDocs] = useState(false);

  // Viewer & Form state
  const [activeViewerData, setActiveViewerData] = useState<UniversalDocFormData | null>(null);
  const [activeFormData, setActiveFormData] = useState<UniversalDocFormData | null>(null);

  const relevantDocs = useMemo(() => {
    return ALL_89_PROCUREMENT_DOCUMENTS.filter(d => relevantDocNumbers.includes(d.docNumber));
  }, [relevantDocNumbers]);

  const displayedDocs = useMemo(() => {
    let docs = showAllDocs ? ALL_89_PROCUREMENT_DOCUMENTS : relevantDocs;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      docs = ALL_89_PROCUREMENT_DOCUMENTS.filter(d => 
        d.title.toLowerCase().includes(q) ||
        d.docCode.toLowerCase().includes(q) ||
        String(d.docNumber).includes(q)
      );
    }
    return docs;
  }, [showAllDocs, relevantDocs, searchQuery]);

  if (!isOpen) return null;

  const generateFormDataForDoc = (doc: ProcurementDocumentDefinition): UniversalDocFormData => {
    const base = procurementAllDocsService.generateDefaultFormData(doc);
    return {
      ...base,
      projectId: context.projectId || base.projectId,
      projectName: context.projectName || base.projectName,
      projectLocation: context.projectLocation || base.projectLocation,
      clientName: context.clientName || base.clientName,
      vendorCode: context.vendorCode || base.vendorCode,
      vendorName: context.vendorName || base.vendorName,
      docRefNo: context.refNo ? `${doc.docCode}-${context.refNo}` : base.docRefNo
    };
  };

  const handleOpenForm = (doc: ProcurementDocumentDefinition) => {
    const data = generateFormDataForDoc(doc);
    setActiveFormData(data);
  };

  const handleOpenPreview = (doc: ProcurementDocumentDefinition) => {
    const data = generateFormDataForDoc(doc);
    setActiveViewerData(data);
  };

  const handleDirectDownload = (doc: ProcurementDocumentDefinition) => {
    const data = generateFormDataForDoc(doc);
    setActiveViewerData(data);
    setTimeout(() => {
      window.print();
    }, 250);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center font-bold text-white shadow-2xs">
              <FileText size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">{title}</h3>
              {subtitle && <p className="text-[11px] text-slate-400 font-mono">{subtitle}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={17} />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3 shrink-0 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search or pick from all 89 forms..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1 text-xs border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:ring-1 focus:ring-orange-500 font-medium"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAllDocs(prev => !prev)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                showAllDocs
                  ? 'bg-orange-50 text-orange-700 border-orange-200'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {showAllDocs ? 'Showing All 89 Forms' : `Relevant (${relevantDocNumbers.length})`}
            </button>
          </div>
        </div>

        {/* Context Details Banner */}
        {(context.projectName || context.vendorName) && (
          <div className="px-4 py-1.5 bg-orange-50/60 border-b border-orange-100 text-[11px] text-orange-900 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              {context.projectName && (
                <span>
                  <strong className="font-semibold text-orange-950">Project:</strong> {context.projectName}
                </span>
              )}
              {context.vendorName && (
                <span>
                  <strong className="font-semibold text-orange-950">Vendor:</strong> {context.vendorName}
                </span>
              )}
            </div>
            {context.refNo && (
              <span className="font-mono text-[10px] bg-white px-1.5 py-0.5 rounded border border-orange-200 font-semibold">
                Ref: {context.refNo}
              </span>
            )}
          </div>
        )}

        {/* Documents List */}
        <div className="overflow-y-auto p-3 space-y-1.5 flex-1 divide-y divide-slate-100">
          {displayedDocs.map(doc => (
            <div
              key={doc.id}
              className="pt-1.5 first:pt-0 flex items-center justify-between gap-3 hover:bg-slate-50 p-2 rounded-lg transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-mono text-[10px] font-bold text-slate-400">
                    #{doc.docNumber}
                  </span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                    doc.group === 'Setup' ? 'bg-blue-50 text-blue-700' :
                    doc.group === 'Project' ? 'bg-emerald-50 text-emerald-700' :
                    doc.group === 'Requirement' ? 'bg-amber-50 text-amber-700' :
                    'bg-purple-50 text-purple-700'
                  }`}>
                    {doc.group}
                  </span>
                  <span className="font-mono text-[10px] text-slate-500 font-semibold">
                    {doc.docCode}
                  </span>
                </div>
                <div className="font-semibold text-xs text-slate-900 truncate">
                  {doc.title}
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => handleOpenForm(doc)}
                  className="px-2 py-1 text-[11px] font-medium rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                >
                  Form
                </button>
                <button
                  onClick={() => handleOpenPreview(doc)}
                  className="px-2 py-1 text-[11px] font-medium rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                >
                  Preview
                </button>
                <button
                  onClick={() => handleDirectDownload(doc)}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded bg-orange-600 hover:bg-orange-500 text-white flex items-center gap-1 shadow-2xs transition-colors"
                >
                  <Download size={11} />
                  <span>Download</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Official Innovista Document Generator • Code128 Barcode Protected</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-md font-medium text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* Formal Document Viewer Modal */}
      {activeViewerData && (
        <FormalDocumentViewer
          isOpen={!!activeViewerData}
          formData={activeViewerData}
          onClose={() => setActiveViewerData(null)}
          onEdit={() => {
            setActiveFormData(activeViewerData);
            setActiveViewerData(null);
          }}
        />
      )}

      {/* Document Form Editor Modal */}
      {activeFormData && (
        <DocumentFormModal
          isOpen={!!activeFormData}
          initialData={activeFormData}
          onClose={() => setActiveFormData(null)}
          onSaveAndPreview={data => {
            setActiveFormData(null);
            setActiveViewerData(data);
          }}
          onDirectPrint={data => {
            setActiveFormData(null);
            setActiveViewerData(data);
            setTimeout(() => {
              window.print();
            }, 250);
          }}
        />
      )}
    </div>
  );
};
