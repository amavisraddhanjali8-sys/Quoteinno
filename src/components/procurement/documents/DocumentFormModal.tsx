import React, { useState } from 'react';
import { X, Plus, Trash2, Printer, Eye, RotateCcw } from 'lucide-react';
import { UniversalDocFormData, ProcurementDocItemRecord } from '../../../services/procurementDocTypes';
import { procurementAllDocsService } from '../../../services/procurementAllDocsService';

interface DocumentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: UniversalDocFormData;
  onSaveAndPreview: (data: UniversalDocFormData) => void;
  onDirectPrint: (data: UniversalDocFormData) => void;
  projects?: any[];
  suppliers?: any[];
}

export const DocumentFormModal: React.FC<DocumentFormModalProps> = ({
  isOpen,
  onClose,
  initialData,
  onSaveAndPreview,
  onDirectPrint,
  projects = [],
  suppliers = []
}) => {
  const [formData, setFormData] = useState<UniversalDocFormData>(() => ({
    ...initialData,
    tableRows: initialData.tableRows.map(r => ({ ...r })),
    clauses: [...initialData.clauses]
  }));

  if (!isOpen) return null;

  const handleFieldChange = (field: keyof UniversalDocFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRowChange = (index: number, col: keyof ProcurementDocItemRecord, value: string) => {
    setFormData(prev => {
      const nextRows = [...prev.tableRows];
      nextRows[index] = { ...nextRows[index], [col]: value };
      return { ...prev, tableRows: nextRows };
    });
  };

  const handleAddRow = () => {
    const newRecord: ProcurementDocItemRecord = {
      id: `row-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      col1: 'NEW-ITEM',
      col2: 'Description of requirement or specification parameter',
      col3: '1.00',
      col4: 'Nos',
      col5: 'Pending'
    };
    setFormData(prev => ({
      ...prev,
      tableRows: [...prev.tableRows, newRecord]
    }));
  };

  const handleDeleteRow = (index: number) => {
    if (formData.tableRows.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      tableRows: prev.tableRows.filter((_, i) => i !== index)
    }));
  };

  const handleResetDefaults = () => {
    const docDef = procurementAllDocsService.getDocumentByNumber(formData.docNumber);
    if (docDef) {
      const fresh = procurementAllDocsService.generateDefaultFormData(docDef);
      setFormData(fresh);
    }
  };

  const handleProjectSelect = (projId: string) => {
    const selected = projects.find(p => p.id === projId);
    if (selected) {
      setFormData(prev => ({
        ...prev,
        projectId: selected.id,
        projectName: selected.name,
        projectLocation: selected.location || prev.projectLocation,
        clientName: selected.clientName || prev.clientName
      }));
    }
  };

  const handleSupplierSelect = (supId: string) => {
    const selected = suppliers.find(s => s.id === supId || s.vendorCode === supId);
    if (selected) {
      setFormData(prev => ({
        ...prev,
        vendorName: selected.name,
        vendorCode: selected.vendorCode || selected.id
      }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header Bar */}
        <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-orange-600 font-bold text-xs">
              #{formData.docNumber}
            </span>
            <span className="font-semibold text-sm">{formData.docTitle}</span>
            <span className="text-xs text-slate-400 font-mono">({formData.docCode})</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetDefaults}
              title="Reset Sample Data"
              className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
            >
              <RotateCcw size={14} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="overflow-y-auto p-4 space-y-4 text-xs">
          {/* Section 1: Document Metadata */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div>
              <label className="text-[10px] font-semibold text-slate-600 block mb-0.5">Ref No</label>
              <input
                type="text"
                value={formData.docRefNo}
                onChange={e => handleFieldChange('docRefNo', e.target.value)}
                className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-slate-600 block mb-0.5">Issuance Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={e => handleFieldChange('date', e.target.value)}
                className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-slate-600 block mb-0.5">Revision</label>
              <input
                type="text"
                value={formData.revision}
                onChange={e => handleFieldChange('revision', e.target.value)}
                className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-slate-600 block mb-0.5">Classification</label>
              <select
                value={formData.classification}
                onChange={e => handleFieldChange('classification', e.target.value)}
                className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs"
              >
                <option value="OFFICIAL PROCUREMENT">OFFICIAL PROCUREMENT</option>
                <option value="STRICTLY CONFIDENTIAL">STRICTLY CONFIDENTIAL</option>
                <option value="INTERNAL USE ONLY">INTERNAL USE ONLY</option>
                <option value="COMMERCIAL IN CONFIDENCE">COMMERCIAL IN CONFIDENCE</option>
              </select>
            </div>
          </div>

          {/* Section 2: Project & Supplier Links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="border border-slate-200 rounded-lg p-3 bg-white space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-800 text-[11px]">Project Details</span>
                {projects.length > 0 && (
                  <select
                    onChange={e => handleProjectSelect(e.target.value)}
                    className="text-[10px] px-1.5 py-0.5 border border-slate-200 rounded bg-slate-50 text-slate-700"
                    defaultValue=""
                  >
                    <option value="" disabled>Load Project...</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] text-slate-500 block">Project Code</label>
                  <input
                    type="text"
                    value={formData.projectId}
                    onChange={e => handleFieldChange('projectId', e.target.value)}
                    className="w-full px-1.5 py-1 border border-slate-200 rounded font-mono text-[11px]"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-slate-500 block">Client / Employer</label>
                  <input
                    type="text"
                    value={formData.clientName}
                    onChange={e => handleFieldChange('clientName', e.target.value)}
                    className="w-full px-1.5 py-1 border border-slate-200 rounded text-[11px]"
                  />
                </div>
              </div>
              <div>
                <label className="text-[9px] text-slate-500 block">Project Name</label>
                <input
                  type="text"
                  value={formData.projectName}
                  onChange={e => handleFieldChange('projectName', e.target.value)}
                  className="w-full px-1.5 py-1 border border-slate-200 rounded font-medium text-[11px]"
                />
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg p-3 bg-white space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-800 text-[11px]">Supplier / Vendor</span>
                {suppliers.length > 0 && (
                  <select
                    onChange={e => handleSupplierSelect(e.target.value)}
                    className="text-[10px] px-1.5 py-0.5 border border-slate-200 rounded bg-slate-50 text-slate-700"
                    defaultValue=""
                  >
                    <option value="" disabled>Load Supplier...</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] text-slate-500 block">Vendor Code</label>
                  <input
                    type="text"
                    value={formData.vendorCode}
                    onChange={e => handleFieldChange('vendorCode', e.target.value)}
                    className="w-full px-1.5 py-1 border border-slate-200 rounded font-mono text-[11px]"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-slate-500 block">Vendor Name</label>
                  <input
                    type="text"
                    value={formData.vendorName}
                    onChange={e => handleFieldChange('vendorName', e.target.value)}
                    className="w-full px-1.5 py-1 border border-slate-200 rounded font-medium text-[11px]"
                  />
                </div>
              </div>
              <div>
                <label className="text-[9px] text-slate-500 block">Location / Site</label>
                <input
                  type="text"
                  value={formData.projectLocation}
                  onChange={e => handleFieldChange('projectLocation', e.target.value)}
                  className="w-full px-1.5 py-1 border border-slate-200 rounded text-[11px]"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Records Table & Inserting Fields */}
          <div className="border border-slate-200 rounded-lg p-3 bg-white">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-slate-800 text-[11px]">
                Document Records & Items ({formData.tableRows.length})
              </span>
              <button
                type="button"
                onClick={handleAddRow}
                className="px-2 py-1 rounded bg-orange-600 hover:bg-orange-500 text-white font-medium text-[11px] flex items-center gap-1 shadow-2xs transition-colors"
              >
                <Plus size={12} />
                <span>Add Record</span>
              </button>
            </div>

            <div className="border border-slate-200 rounded overflow-x-auto">
              <table className="w-full text-left text-[11px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <th className="p-1.5 w-8 text-center">#</th>
                    <th className="p-1.5">{formData.tableHeaders[0]}</th>
                    <th className="p-1.5">{formData.tableHeaders[1]}</th>
                    <th className="p-1.5">{formData.tableHeaders[2]}</th>
                    <th className="p-1.5">{formData.tableHeaders[3]}</th>
                    <th className="p-1.5">{formData.tableHeaders[4]}</th>
                    <th className="p-1.5 w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {formData.tableRows.map((row, idx) => (
                    <tr key={row.id || idx} className="hover:bg-slate-50">
                      <td className="p-1 text-center font-mono text-slate-400 text-[10px]">{idx + 1}</td>
                      <td className="p-1">
                        <input
                          type="text"
                          value={row.col1}
                          onChange={e => handleRowChange(idx, 'col1', e.target.value)}
                          className="w-full px-1.5 py-1 border border-slate-200 rounded text-[11px] font-mono"
                        />
                      </td>
                      <td className="p-1">
                        <input
                          type="text"
                          value={row.col2}
                          onChange={e => handleRowChange(idx, 'col2', e.target.value)}
                          className="w-full px-1.5 py-1 border border-slate-200 rounded text-[11px]"
                        />
                      </td>
                      <td className="p-1">
                        <input
                          type="text"
                          value={row.col3}
                          onChange={e => handleRowChange(idx, 'col3', e.target.value)}
                          className="w-full px-1.5 py-1 border border-slate-200 rounded text-[11px] font-mono"
                        />
                      </td>
                      <td className="p-1">
                        <input
                          type="text"
                          value={row.col4}
                          onChange={e => handleRowChange(idx, 'col4', e.target.value)}
                          className="w-full px-1.5 py-1 border border-slate-200 rounded text-[11px]"
                        />
                      </td>
                      <td className="p-1">
                        <input
                          type="text"
                          value={row.col5}
                          onChange={e => handleRowChange(idx, 'col5', e.target.value)}
                          className="w-full px-1.5 py-1 border border-slate-200 rounded text-[11px] font-medium"
                        />
                      </td>
                      <td className="p-1 text-center">
                        <button
                          type="button"
                          disabled={formData.tableRows.length <= 1}
                          onClick={() => handleDeleteRow(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 4: Notes */}
          <div>
            <label className="text-[10px] font-semibold text-slate-700 block mb-1">Scope Directives & Notes</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={e => handleFieldChange('notes', e.target.value)}
              className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs"
            />
          </div>

          {/* Section 5: Signatories */}
          <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div>
              <label className="text-[9px] text-slate-500 block font-semibold">Prepared By</label>
              <input
                type="text"
                value={formData.preparedBy}
                onChange={e => handleFieldChange('preparedBy', e.target.value)}
                className="w-full px-1.5 py-1 border border-slate-200 rounded text-[10px] bg-white font-medium"
              />
              <input
                type="text"
                value={formData.preparedRole}
                onChange={e => handleFieldChange('preparedRole', e.target.value)}
                className="w-full px-1.5 py-0.5 border border-slate-200 rounded text-[9px] bg-white text-slate-500 mt-1"
              />
            </div>
            <div>
              <label className="text-[9px] text-slate-500 block font-semibold">Reviewed By</label>
              <input
                type="text"
                value={formData.reviewedBy}
                onChange={e => handleFieldChange('reviewedBy', e.target.value)}
                className="w-full px-1.5 py-1 border border-slate-200 rounded text-[10px] bg-white font-medium"
              />
              <input
                type="text"
                value={formData.reviewedRole}
                onChange={e => handleFieldChange('reviewedRole', e.target.value)}
                className="w-full px-1.5 py-0.5 border border-slate-200 rounded text-[9px] bg-white text-slate-500 mt-1"
              />
            </div>
            <div>
              <label className="text-[9px] text-slate-500 block font-semibold">Approved By</label>
              <input
                type="text"
                value={formData.approvedBy}
                onChange={e => handleFieldChange('approvedBy', e.target.value)}
                className="w-full px-1.5 py-1 border border-slate-200 rounded text-[10px] bg-white font-medium"
              />
              <input
                type="text"
                value={formData.approvedRole}
                onChange={e => handleFieldChange('approvedRole', e.target.value)}
                className="w-full px-1.5 py-0.5 border border-slate-200 rounded text-[9px] bg-white text-slate-500 mt-1"
              />
            </div>
            <div>
              <label className="text-[9px] text-slate-500 block font-semibold">Authorized By</label>
              <input
                type="text"
                value={formData.authorizedBy}
                onChange={e => handleFieldChange('authorizedBy', e.target.value)}
                className="w-full px-1.5 py-1 border border-slate-200 rounded text-[10px] bg-white font-medium"
              />
              <input
                type="text"
                value={formData.authorizedRole}
                onChange={e => handleFieldChange('authorizedRole', e.target.value)}
                className="w-full px-1.5 py-0.5 border border-slate-200 rounded text-[9px] bg-white text-slate-500 mt-1"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-100 px-4 py-2.5 border-t border-slate-200 flex justify-between items-center shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-200 text-xs font-medium"
          >
            Cancel
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onSaveAndPreview(formData)}
              className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium flex items-center gap-1.5"
            >
              <Eye size={13} />
              <span>Preview</span>
            </button>
            <button
              type="button"
              onClick={() => onDirectPrint(formData)}
              className="px-3.5 py-1.5 rounded-md bg-orange-600 hover:bg-orange-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-xs"
            >
              <Printer size={13} />
              <span>Print / Download</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
