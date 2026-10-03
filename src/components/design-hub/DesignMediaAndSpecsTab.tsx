import React, { useState } from 'react';
import {
  QuoteTemplate,
  DesignCategory,
  DesignMediaAttachment
} from '../../types';
import {
  Image as ImageIcon,
  Video,
  Upload,
  Trash2,
  AlertTriangle,
  Sparkles,
  Building2,
  Save,
  Copy,
  X
} from 'lucide-react';
import {
  formatBytes,
  validateDesignMediaFile,
  MAX_IMAGE_SIZE_BYTES,
  MAX_VIDEO_SIZE_BYTES
} from './designHubDefaults';

interface DesignMediaAndSpecsTabProps {
  design: QuoteTemplate;
  categories: DesignCategory[];
  onUpdateDesign: (updates: Partial<QuoteTemplate>) => void;
  onSaveToLibrary: () => void;
  onSaveAsNewDesign: () => void;
  onOpenCategoryManager: () => void;
  onShowNotice: (msg: string, type?: 'success' | 'info' | 'warning') => void;
}

export const DesignMediaAndSpecsTab: React.FC<DesignMediaAndSpecsTabProps> = ({
  design,
  categories,
  onUpdateDesign,
  onSaveToLibrary,
  onSaveAsNewDesign,
  onOpenCategoryManager,
  onShowNotice
}) => {
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [galleryCaption, setGalleryCaption] = useState('');

  const mainCategories = categories.filter(c => !c.parentId);
  const activeMainObj = mainCategories.find(c => c.name === design.category) || mainCategories[0];
  const subCategories = activeMainObj
    ? categories.filter(c => c.parentId === activeMainObj.id)
    : [];

  const handlePrimaryMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setUploadError(null);
    if (!file) return;

    const validation = validateDesignMediaFile(file);
    if (!validation.valid) {
      setUploadError(validation.error || 'File exceeds size limit.');
      onShowNotice(validation.error || 'File exceeds size limit.', 'warning');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = ev => {
      const result = ev.target?.result as string;
      onUpdateDesign({
        mediaType: validation.mediaType || 'image',
        mediaUrl: result,
        mediaFileName: file.name,
        mediaFileSize: file.size
      });
      onShowNotice(
        `Attached ${validation.mediaType === 'video' ? 'Video' : 'Image'} (${formatBytes(file.size)}) to design card`,
        'success'
      );
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleGalleryMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setUploadError(null);
    if (!file) return;

    const validation = validateDesignMediaFile(file);
    if (!validation.valid) {
      setUploadError(validation.error || 'File exceeds size limit.');
      onShowNotice(validation.error || 'File exceeds size limit.', 'warning');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = ev => {
      const result = ev.target?.result as string;
      const newAttachment: DesignMediaAttachment = {
        id: `att-${Date.now()}`,
        type: validation.mediaType || 'image',
        url: result,
        fileName: file.name,
        fileSize: file.size,
        caption: galleryCaption.trim() || file.name
      };
      onUpdateDesign({
        mediaGallery: [...(design.mediaGallery || []), newAttachment]
      });
      setGalleryCaption('');
      onShowNotice(`Added ${file.name} (${formatBytes(file.size)}) to Design Gallery`, 'success');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleGenerateBlueprint = () => {
    setUploadError(null);
    const titleText = (design.name || 'ARCHITECTURAL DESIGN').toUpperCase().slice(0, 42);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 320"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#0f172a"/><stop offset="100%" stop-color="#1e293b"/></linearGradient></defs><rect width="640" height="320" fill="url(#g)"/><rect x="80" y="55" width="480" height="210" fill="#0284c7" fill-opacity="0.2" stroke="#38bdf8" stroke-width="3"/><line x1="240" y1="55" x2="240" y2="265" stroke="#cbd5e1" stroke-width="2"/><line x1="400" y1="55" x2="400" y2="265" stroke="#cbd5e1" stroke-width="2"/><line x1="80" y1="130" x2="560" y2="130" stroke="#f97316" stroke-width="2"/><text x="80" y="36" fill="#f8fafc" font-family="monospace" font-size="11" font-weight="bold">${titleText}</text></svg>`;
    onUpdateDesign({
      mediaType: 'image',
      mediaUrl: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`,
      mediaFileName: 'cad_elevation_blueprint.svg',
      mediaFileSize: 132000
    });
    onShowNotice('Generated architectural CAD blueprint cover', 'info');
  };

  const specs = design.designSpecs || {};

  return (
    <div className="space-y-6 w-full text-xs">
      {uploadError && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle size={16} className="text-rose-600 shrink-0" />
            <span>{uploadError}</span>
          </div>
          <button onClick={() => setUploadError(null)} className="text-rose-500 hover:text-rose-700">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Section 1: Primary Card Media (Image max 1MB / Video max 10MB) */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ImageIcon size={15} className="text-orange-500" />
              <span>Design Card Cover Media (Image ≤ 1 MB • Video ≤ 10 MB)</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Upload a project elevation photo/render (max 1 MB) or 3D walkthrough video (max 10 MB) for the Design Hub card.
            </p>
          </div>

          <button
            type="button"
            onClick={handleGenerateBlueprint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg font-semibold"
          >
            <Sparkles size={13} />
            <span>Auto-Generate CAD Elevation</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
          {/* Upload Dropzone */}
          <label className="border-2 border-dashed border-slate-300 hover:border-orange-400 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer bg-slate-50/70 hover:bg-orange-50/20 transition-all h-48">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                <Upload size={18} />
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <Video size={18} />
              </div>
            </div>
            <span className="font-bold text-slate-900 text-xs">
              Click to Upload Cover Image or Video
            </span>
            <span className="text-[11px] text-slate-500 mt-1">
              Strict Limits: <strong>1 MB Max for Image</strong> ({formatBytes(MAX_IMAGE_SIZE_BYTES)}) •{' '}
              <strong>10 MB Max for Video</strong> ({formatBytes(MAX_VIDEO_SIZE_BYTES)})
            </span>
            <input
              type="file"
              accept="image/*,video/*"
              onChange={handlePrimaryMediaUpload}
              className="hidden"
            />
          </label>

          {/* Current Cover Media Preview */}
          <div className="h-48 rounded-xl border border-slate-200 bg-slate-900 overflow-hidden relative flex items-center justify-center">
            {design.mediaUrl ? (
              <>
                {design.mediaType === 'video' ? (
                  <video
                    src={design.mediaUrl}
                    controls
                    muted
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={design.mediaUrl}
                    alt={design.name}
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-md bg-slate-900/85 text-white text-[10px] font-mono font-bold uppercase flex items-center gap-1.5">
                  <span>{design.mediaType === 'video' ? 'VIDEO' : 'IMAGE'}</span>
                  <span>•</span>
                  <span>{formatBytes(design.mediaFileSize || 150000)}</span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateDesign({
                      mediaType: 'none',
                      mediaUrl: '',
                      mediaFileName: '',
                      mediaFileSize: 0
                    })
                  }
                  className="absolute top-2.5 right-2.5 p-1.5 rounded-md bg-slate-900/85 text-white hover:bg-rose-600 transition-colors"
                  title="Remove Cover Media"
                >
                  <Trash2 size={13} />
                </button>
              </>
            ) : (
              <div className="text-center text-slate-400 px-6">
                <p className="font-semibold text-slate-300">No Cover Media Attached</p>
                <p className="text-[11px] mt-1">Upload an image (≤1MB) or video (≤10MB) on the left.</p>
              </div>
            )}
          </div>
        </div>

        {/* Additional Design Media Gallery */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="font-bold text-slate-800">
                Additional Design Gallery Attachments ({(design.mediaGallery || []).length})
              </h4>
              <p className="text-[11px] text-slate-500">
                Attach supplementary shop drawing images (≤1MB) or site walkthrough clips (≤10MB).
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Caption before upload (optional)..."
                value={galleryCaption}
                onChange={e => setGalleryCaption(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs w-52"
              />
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold cursor-pointer">
                <Upload size={12} />
                <span>+ Add Gallery Media</span>
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleGalleryMediaUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {(design.mediaGallery || []).length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(design.mediaGallery || []).map(att => (
                <div
                  key={att.id}
                  className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50 flex flex-col justify-between"
                >
                  <div className="h-24 bg-slate-900 relative">
                    {att.type === 'video' ? (
                      <video src={att.url} controls muted className="w-full h-full object-cover" />
                    ) : (
                      <img src={att.url} alt={att.caption} className="w-full h-full object-cover" />
                    )}
                    <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-slate-900/80 text-white text-[9px] font-mono uppercase">
                      {att.type} • {formatBytes(att.fileSize)}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateDesign({
                          mediaGallery: (design.mediaGallery || []).filter(x => x.id !== att.id)
                        })
                      }
                      className="absolute top-1.5 right-1.5 p-1 rounded bg-slate-900/80 text-white hover:bg-rose-600"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                  <div className="p-2 text-[11px] font-medium text-slate-700 truncate">
                    {att.caption || att.fileName}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Section 2: Design Identity, Categories & Sub-Categories */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Design Categorization & Metadata</h3>
            <p className="text-[11px] text-slate-500">
              Assign Main Category, Sub-Category, Design Code, and Pricing Framework.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenCategoryManager}
            className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-lg font-semibold"
          >
            Manage Categories & Sub-Categories
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2 space-y-1">
            <label className="font-semibold text-slate-700">Project Design Name</label>
            <input
              type="text"
              value={design.name}
              onChange={e => onUpdateDesign({ name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Design Code</label>
            <input
              type="text"
              value={design.designCode || 'DSN-2026-001'}
              onChange={e => onUpdateDesign({ designCode: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Main Category</label>
            <select
              value={design.category || mainCategories[0]?.name || ''}
              onChange={e => {
                const nextMain = e.target.value;
                const mainObj = mainCategories.find(c => c.name === nextMain);
                const firstSub = mainObj ? categories.find(s => s.parentId === mainObj.id) : undefined;
                onUpdateDesign({
                  category: nextMain,
                  subCategory: firstSub ? firstSub.name : 'General Design'
                });
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
            >
              {mainCategories.map(c => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Sub-Category</label>
            <select
              value={design.subCategory || subCategories[0]?.name || ''}
              onChange={e => onUpdateDesign({ subCategory: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
            >
              {subCategories.length === 0 ? (
                <option value="General Design">General Design</option>
              ) : (
                subCategories.map(s => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Pricing Model</label>
            <select
              value={design.quoteType}
              onChange={e => onUpdateDesign({ quoteType: e.target.value as any })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
            >
              <option value="Unit Rate">Unit Rate</option>
              <option value="Fixed Price">Fixed Price</option>
              <option value="Executive">Executive</option>
              <option value="Budgetary">Budgetary</option>
              <option value="Lump Sum">Lump Sum</option>
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="font-semibold text-slate-700">Design Description & Architectural Scope</label>
          <textarea
            rows={3}
            value={design.description}
            onChange={e => onUpdateDesign({ description: e.target.value })}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
          />
        </div>
      </div>

      {/* Section 3: Architectural & Engineering Specifications */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
        <div className="flex items-center gap-2">
          <Building2 size={15} className="text-orange-500" />
          <h3 className="text-sm font-bold text-slate-900">Architectural & Structural Design Specifications</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Building / Application Type</label>
            <input
              type="text"
              value={specs.buildingType || ''}
              onChange={e =>
                onUpdateDesign({
                  designSpecs: { ...specs, buildingType: e.target.value }
                })
              }
              placeholder="e.g. Commercial High-Rise / Luxury Villa"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Total Designed Area (sqft)</label>
            <input
              type="number"
              value={specs.totalAreaSqft || 0}
              onChange={e =>
                onUpdateDesign({
                  designSpecs: { ...specs, totalAreaSqft: parseFloat(e.target.value) || 0 }
                })
              }
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Design Wind Load (Pa)</label>
            <input
              type="number"
              value={specs.windLoadPa || 0}
              onChange={e =>
                onUpdateDesign({
                  designSpecs: { ...specs, windLoadPa: parseFloat(e.target.value) || 0 }
                })
              }
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Surface Finish & Coating Spec</label>
            <input
              type="text"
              value={specs.finishSpec || ''}
              onChange={e =>
                onUpdateDesign({
                  designSpecs: { ...specs, finishSpec: e.target.value }
                })
              }
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Glazing & Safety Glass Spec</label>
            <input
              type="text"
              value={specs.glassSpec || ''}
              onChange={e =>
                onUpdateDesign({
                  designSpecs: { ...specs, glassSpec: e.target.value }
                })
              }
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">CAD / BIM Drawing Reference</label>
            <input
              type="text"
              value={specs.drawingRef || ''}
              onChange={e =>
                onUpdateDesign({
                  designSpecs: { ...specs, drawingRef: e.target.value }
                })
              }
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onSaveAsNewDesign}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
          >
            <Copy size={13} />
            <span>Save as New Project Design</span>
          </button>

          <button
            type="button"
            onClick={onSaveToLibrary}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold shadow-xs"
          >
            <Save size={13} />
            <span>Save Design Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
};
