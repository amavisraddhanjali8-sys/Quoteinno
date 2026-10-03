import React, { useState, useEffect } from 'react';
import { 
  FileText, Upload, Download, Eye, FileCode
} from 'lucide-react';
import { centralApiGateway } from '../../../services/centralApiGateway';
import { ObjectStorageAttachment } from '../../../types/operationalControl';
import { useSecurity } from '../../../context/SecurityContext';

export const DocumentControlPortal: React.FC = () => {
  const { currentUser } = useSecurity();
  const [attachments, setAttachments] = useState<ObjectStorageAttachment[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isUploading, setIsUploading] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileCategory, setNewFileCategory] = useState<ObjectStorageAttachment['category']>('CAD Drawing');
  const [previewDoc, setPreviewDoc] = useState<ObjectStorageAttachment | null>(null);

  useEffect(() => {
    try {
      setAttachments(centralApiGateway.getAttachments(currentUser));
    } catch (e) {
      console.error(e);
    }
  }, [currentUser]);

  const handleUpload = () => {
    if (!newFileName.trim()) {
      alert('Please enter a file name');
      return;
    }
    try {
      centralApiGateway.uploadAttachment(currentUser, {
        name: newFileName,
        sizeKb: 2450,
        mimeType: 'application/pdf',
        category: newFileCategory
      });
      setAttachments(centralApiGateway.getAttachments(currentUser));
      setIsUploading(false);
      setNewFileName('');
    } catch (err: any) {
      alert(err.message || 'Upload failed');
    }
  };

  const filtered = selectedCategory === 'ALL' 
    ? attachments 
    : attachments.filter(a => a.category === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-100 text-violet-800 border border-violet-200">
                Document Control & Object Storage
              </span>
              <span className="text-xs text-slate-400">Secure Immutable Engineering Vault</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <FileText className="w-6 h-6 text-violet-600" />
              Central Technical Document Control
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Engineering CAD drawings, structural calculations, inspection photos, mill certificates, and transmittals stored securely with cryptographic checksums.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsUploading(true)}
              className="px-3.5 py-2 text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Upload className="w-4 h-4" /> Upload Document
            </button>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-4 border-t border-slate-100">
          {['ALL', 'CAD Drawing', 'Structural Calculation', 'Inspection Photo', 'Mill Certificate', 'Contract', 'NCR Evidence'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${selectedCategory === cat ? 'bg-violet-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Upload Modal */}
      {isUploading && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4 text-xs">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Upload className="w-5 h-5 text-violet-600" />
              Upload Document to Object Storage
            </h3>
            <div>
              <label className="block text-slate-600 font-medium mb-1">File Name:</label>
              <input 
                type="text" 
                value={newFileName}
                onChange={e => setNewFileName(e.target.value)}
                placeholder="e.g. DWG-ROOF-STRUCTURE-REV-D.pdf"
                className="w-full p-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-medium mb-1">Category:</label>
              <select
                value={newFileCategory}
                onChange={e => setNewFileCategory(e.target.value as any)}
                className="w-full p-2 border border-slate-300 rounded-lg bg-slate-50 text-xs"
              >
                <option value="CAD Drawing">CAD Drawing</option>
                <option value="Structural Calculation">Structural Calculation</option>
                <option value="Inspection Photo">Inspection Photo</option>
                <option value="Mill Certificate">Mill Certificate</option>
                <option value="Contract">Contract</option>
                <option value="NCR Evidence">NCR Evidence</option>
              </select>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 text-[11px]">
              Files are automatically hashed (SHA-256) and routed to cloud object storage with version tagging.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button 
                onClick={() => setIsUploading(false)}
                className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button 
                onClick={handleUpload}
                className="px-4 py-1.5 font-bold bg-violet-600 text-white rounded-lg hover:bg-violet-700"
              >
                Upload to Vault
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-2xl w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-xs font-bold text-violet-600">{previewDoc.category}</span>
                <h3 className="text-base font-bold text-slate-900">{previewDoc.fileName}</h3>
              </div>
              <button 
                onClick={() => setPreviewDoc(null)}
                className="text-xs px-3 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg"
              >
                Close
              </button>
            </div>

            <div className="h-64 bg-slate-900 rounded-xl flex flex-col items-center justify-center text-white p-6 text-center">
              <FileCode className="w-12 h-12 text-violet-400 mb-2" />
              <div className="font-bold text-sm">Secure Object Storage Preview</div>
              <div className="text-xs text-slate-400 font-mono mt-1">{previewDoc.storageKey}</div>
              <div className="text-[11px] text-slate-500 mt-2">SHA-256 Checksum: {previewDoc.checksumSha256}</div>
            </div>

            <div className="flex justify-between items-center text-xs text-slate-500">
              <span>Uploaded by {previewDoc.uploadedBy} on {new Date(previewDoc.uploadedAt).toLocaleDateString()}</span>
              <button 
                onClick={() => alert(`Simulating download of ${previewDoc.fileName}`)}
                className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-lg flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" /> Download File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-100">
          {filtered.map(doc => (
            <div key={doc.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50 text-xs">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{doc.fileName}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-violet-100 text-violet-800">{doc.version}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">{doc.approvalStatus}</span>
                  </div>
                  <div className="text-slate-500 mt-0.5">
                    Category: <strong>{doc.category}</strong> • Size: {doc.fileSizeKb} KB • Uploader: {doc.uploadedBy}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                    {doc.storageKey}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewDoc(doc)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" /> View
                </button>
                <button
                  onClick={() => alert(`Downloading ${doc.fileName}...`)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
