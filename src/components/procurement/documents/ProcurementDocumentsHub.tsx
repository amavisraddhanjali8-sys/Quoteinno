import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Eye, 
  Download, 
  LayoutGrid, 
  List
} from 'lucide-react';
import { 
  ProcurementDocumentDefinition, 
  DocCategoryGroup, 
  UniversalDocFormData 
} from '../../../services/procurementDocTypes';
import { procurementAllDocsService, ALL_89_PROCUREMENT_DOCUMENTS } from '../../../services/procurementAllDocsService';
import { FormalDocumentViewer } from './FormalDocumentViewer';
import { DocumentFormModal } from './DocumentFormModal';
import { BarcodeVisual } from '../../boq/BarcodeVisual';

interface ProcurementDocumentsHubProps {
  projects?: any[];
  suppliers?: any[];
}

type TabType = 'All' | DocCategoryGroup;

export const ProcurementDocumentsHub: React.FC<ProcurementDocumentsHubProps> = ({
  projects = [],
  suppliers = []
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('list');

  // Modals state
  const [activeViewerData, setActiveViewerData] = useState<UniversalDocFormData | null>(null);
  const [activeFormData, setActiveFormData] = useState<UniversalDocFormData | null>(null);

  const tabs: { id: TabType; count: number }[] = useMemo(() => [
    { id: 'All', count: ALL_89_PROCUREMENT_DOCUMENTS.length },
    { id: 'Setup', count: ALL_89_PROCUREMENT_DOCUMENTS.filter(d => d.group === 'Setup').length },
    { id: 'Project', count: ALL_89_PROCUREMENT_DOCUMENTS.filter(d => d.group === 'Project').length },
    { id: 'Requirement', count: ALL_89_PROCUREMENT_DOCUMENTS.filter(d => d.group === 'Requirement').length },
    { id: 'Technical', count: ALL_89_PROCUREMENT_DOCUMENTS.filter(d => d.group === 'Technical').length }
  ], []);

  const filteredDocs = useMemo(() => {
    let docs = activeTab === 'All' 
      ? ALL_89_PROCUREMENT_DOCUMENTS 
      : ALL_89_PROCUREMENT_DOCUMENTS.filter(d => d.group === activeTab);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      docs = docs.filter(d => 
        d.title.toLowerCase().includes(q) || 
        d.docCode.toLowerCase().includes(q) || 
        String(d.docNumber).includes(q)
      );
    }
    return docs;
  }, [activeTab, searchQuery]);

  const currentProjectObj = useMemo(() => {
    if (selectedProject === 'ALL') return projects[0] || null;
    return projects.find(p => p.id === selectedProject) || null;
  }, [projects, selectedProject]);

  const handleOpenForm = (doc: ProcurementDocumentDefinition) => {
    const data = procurementAllDocsService.generateDefaultFormData(
      doc, 
      currentProjectObj, 
      suppliers[0] || null
    );
    setActiveFormData(data);
  };

  const handleOpenPreview = (doc: ProcurementDocumentDefinition) => {
    const data = procurementAllDocsService.generateDefaultFormData(
      doc, 
      currentProjectObj, 
      suppliers[0] || null
    );
    setActiveViewerData(data);
  };

  const handleDirectDownload = (doc: ProcurementDocumentDefinition) => {
    const data = procurementAllDocsService.generateDefaultFormData(
      doc, 
      currentProjectObj, 
      suppliers[0] || null
    );
    setActiveViewerData(data);
    setTimeout(() => {
      window.print();
    }, 250);
  };

  return (
    <div className="space-y-3 font-sans text-slate-800">
      {/* 1. Control & Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-2.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
          {/* Sub-portal Tabs (One Word each) */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'bg-orange-500 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <span>{tab.id}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeTab === tab.id ? 'bg-orange-600/90 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search, Project Filter & View Switch */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative min-w-[180px] flex-1 sm:flex-initial">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-orange-500"
              />
            </div>

            {projects.length > 0 && (
              <select
                value={selectedProject}
                onChange={e => setSelectedProject(e.target.value)}
                className="text-xs px-2.5 py-1 border border-slate-200 rounded-lg bg-slate-50 text-slate-700 font-medium"
              >
                <option value="ALL">All Projects</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            )}

            <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50 p-0.5">
              <button
                onClick={() => setViewMode('list')}
                className={`p-1 rounded ${viewMode === 'list' ? 'bg-white shadow-2xs text-orange-600' : 'text-slate-500'}`}
                title="List View"
              >
                <List size={14} />
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1 rounded ${viewMode === 'cards' ? 'bg-white shadow-2xs text-orange-600' : 'text-slate-500'}`}
                title="Cards View"
              >
                <LayoutGrid size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Documents Registry Grid / List */}
      {viewMode === 'list' ? (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-2 px-3 w-12 text-center">#</th>
                  <th className="py-2 px-3 w-28 font-mono">Code</th>
                  <th className="py-2 px-3">Document Title</th>
                  <th className="py-2 px-3 w-28">Group</th>
                  <th className="py-2 px-3 w-40">Barcode Reference</th>
                  <th className="py-2 px-3 text-right w-48">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDocs.map(doc => (
                  <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2 px-3 text-center font-mono text-[11px] text-slate-400">
                      {doc.docNumber}
                    </td>
                    <td className="py-2 px-3 font-mono font-semibold text-slate-800 text-[11px]">
                      {doc.docCode}
                    </td>
                    <td className="py-2 px-3 font-medium text-slate-900">
                      {doc.title}
                    </td>
                    <td className="py-2 px-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        doc.group === 'Setup' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        doc.group === 'Project' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        doc.group === 'Requirement' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-purple-50 text-purple-700 border border-purple-200'
                      }`}>
                        {doc.group}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <div className="inline-block bg-white p-0.5 border border-slate-200 rounded">
                        <BarcodeVisual
                          value={doc.barcodeValue}
                          format="CODE128"
                          width={0.9}
                          height={16}
                          displayValue={false}
                        />
                      </div>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {filteredDocs.map(doc => (
            <div
              key={doc.id}
              className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs hover:border-orange-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-[10px] text-slate-400 font-semibold">
                    #{doc.docNumber}
                  </span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                    doc.group === 'Setup' ? 'bg-blue-50 text-blue-700' :
                    doc.group === 'Project' ? 'bg-emerald-50 text-emerald-700' :
                    doc.group === 'Requirement' ? 'bg-amber-50 text-amber-700' :
                    'bg-purple-50 text-purple-700'
                  }`}>
                    {doc.group}
                  </span>
                </div>

                <div className="font-bold text-xs text-slate-900 leading-snug line-clamp-2 mb-1">
                  {doc.title}
                </div>
                <div className="font-mono text-[10px] text-slate-500 mb-2">
                  {doc.docCode}
                </div>

                <div className="bg-slate-50 p-1 rounded border border-slate-100 flex items-center justify-center mb-2.5">
                  <BarcodeVisual
                    value={doc.barcodeValue}
                    format="CODE128"
                    width={1.0}
                    height={20}
                    displayValue={false}
                  />
                </div>
              </div>

              <div className="flex items-center gap-1 pt-2 border-t border-slate-100">
                <button
                  onClick={() => handleOpenForm(doc)}
                  className="flex-1 py-1 text-[11px] font-medium rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-center transition-colors"
                >
                  Form
                </button>
                <button
                  onClick={() => handleOpenPreview(doc)}
                  className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
                  title="Preview"
                >
                  <Eye size={13} />
                </button>
                <button
                  onClick={() => handleDirectDownload(doc)}
                  className="p-1 rounded bg-orange-600 hover:bg-orange-500 text-white"
                  title="Download / Print"
                >
                  <Download size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. Formal Document Viewer Modal */}
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

      {/* 4. Document Form Editor Modal with Record Inserting */}
      {activeFormData && (
        <DocumentFormModal
          isOpen={!!activeFormData}
          initialData={activeFormData}
          onClose={() => setActiveFormData(null)}
          projects={projects}
          suppliers={suppliers}
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
