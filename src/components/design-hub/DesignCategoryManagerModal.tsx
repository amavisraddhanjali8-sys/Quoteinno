import React, { useState } from 'react';
import {
  DesignCategory,
  QuoteTemplate,
  QuotationType,
  DEFAULT_TERMS
} from '../../types';
import {
  FolderTree,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Image as ImageIcon,
  Video,
  Upload,
  AlertTriangle,
  Sparkles,
  Layers,
  Building2
} from 'lucide-react';
import { motion } from 'motion/react';
import {
  formatBytes,
  validateDesignMediaFile,
  MAX_IMAGE_SIZE_BYTES,
  MAX_VIDEO_SIZE_BYTES
} from './designHubDefaults';

interface DesignCategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: DesignCategory[];
  onSaveCategories: (next: DesignCategory[]) => void;
}

export const DesignCategoryManagerModal: React.FC<DesignCategoryManagerModalProps> = ({
  isOpen,
  onClose,
  categories,
  onSaveCategories
}) => {
  const [newMainName, setNewMainName] = useState('');
  const [newMainDesc, setNewMainDesc] = useState('');
  const [selectedMainId, setSelectedMainId] = useState<string>(() => {
    const first = categories.find(c => !c.parentId);
    return first ? first.id : '';
  });
  const [newSubName, setNewSubName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  if (!isOpen) return null;

  const mainCategories = categories.filter(c => !c.parentId);
  const activeMainId = selectedMainId || mainCategories[0]?.id || '';
  const subCategories = categories.filter(c => c.parentId === activeMainId);

  const handleAddMainCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newMainName.trim();
    if (!trimmed) return;
    const newCat: DesignCategory = {
      id: `dcat-${Date.now()}`,
      name: trimmed,
      parentId: null,
      description: newMainDesc.trim() || 'Custom project design category',
      color: '#f97316'
    };
    const next = [...categories, newCat];
    onSaveCategories(next);
    setSelectedMainId(newCat.id);
    setNewMainName('');
    setNewMainDesc('');
  };

  const handleAddSubCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newSubName.trim();
    if (!trimmed || !activeMainId) return;
    const newSub: DesignCategory = {
      id: `dsub-${Date.now()}`,
      name: trimmed,
      parentId: activeMainId
    };
    onSaveCategories([...categories, newSub]);
    setNewSubName('');
  };

  const handleDeleteCategory = (id: string) => {
    const next = categories.filter(c => c.id !== id && c.parentId !== id);
    onSaveCategories(next);
    if (selectedMainId === id) {
      const remaining = next.find(c => !c.parentId);
      setSelectedMainId(remaining ? remaining.id : '');
    }
  };

  const handleSaveRename = (id: string) => {
    if (!editingName.trim()) {
      setEditingId(null);
      return;
    }
    onSaveCategories(
      categories.map(c => (c.id === id ? { ...c, name: editingName.trim() } : c))
    );
    setEditingId(null);
  };

  return (
    <div className="fixed inset-0 z-[150] bg-slate-900/45 backdrop-blur-xs flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-3xl w-full flex flex-col max-h-[85vh] overflow-hidden text-xs"
      >
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-100">
              <FolderTree size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Design Hub Categories & Sub-Categories</h3>
              <p className="text-xs text-slate-500">Organize architectural project designs into main categories and specialized sub-categories.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Main Categories */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                1. Main Design Categories ({mainCategories.length})
              </h4>
            </div>

            <form onSubmit={handleAddMainCategory} className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
              <input
                type="text"
                placeholder="New Main Category name (e.g. Skylights & Canopies)..."
                value={newMainName}
                onChange={e => setNewMainName(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium"
              />
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Short description (optional)..."
                  value={newMainDesc}
                  onChange={e => setNewMainDesc(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                />
                <button
                  type="submit"
                  disabled={!newMainName.trim()}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold disabled:opacity-40 shrink-0"
                >
                  <Plus size={13} />
                  <span>Add Main</span>
                </button>
              </div>
            </form>

            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
              {mainCategories.map(cat => {
                const subCount = categories.filter(s => s.parentId === cat.id).length;
                const isSelected = cat.id === activeMainId;
                return (
                  <div
                    key={cat.id}
                    onClick={() => setSelectedMainId(cat.id)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-orange-50/70 border-orange-400 text-slate-900 shadow-2xs'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      {editingId === cat.id ? (
                        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                          <input
                            type="text"
                            value={editingName}
                            onChange={e => setEditingName(e.target.value)}
                            className="px-2 py-0.5 bg-white border border-orange-300 rounded text-xs font-semibold w-full"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveRename(cat.id)}
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                          >
                            <Check size={13} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="font-bold text-slate-900 truncate">{cat.name}</div>
                          <div className="text-[10px] text-slate-500">{subCount} sub-categories</div>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(cat.id);
                          setEditingName(cat.name);
                        }}
                        className="p-1 text-slate-400 hover:text-slate-700 rounded"
                        title="Rename"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded"
                        title="Delete Category"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Sub-Categories for Selected Main Category */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                2. Sub-Categories ({subCategories.length})
              </h4>
              <span className="text-[11px] font-semibold text-orange-600">
                {mainCategories.find(c => c.id === activeMainId)?.name || 'Select Main Category'}
              </span>
            </div>

            <form onSubmit={handleAddSubCategory} className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center gap-2">
              <input
                type="text"
                placeholder="Add Sub-Category under selected category..."
                value={newSubName}
                onChange={e => setNewSubName(e.target.value)}
                className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium"
              />
              <button
                type="submit"
                disabled={!newSubName.trim() || !activeMainId}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold disabled:opacity-40 shrink-0"
              >
                <Plus size={13} />
                <span>Add Sub</span>
              </button>
            </form>

            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
              {subCategories.length === 0 ? (
                <div className="py-10 text-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  No sub-categories yet. Add one above!
                </div>
              ) : (
                subCategories.map(sub => (
                  <div
                    key={sub.id}
                    className="p-2.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-2"
                  >
                    {editingId === sub.id ? (
                      <div className="flex items-center gap-1 flex-1">
                        <input
                          type="text"
                          value={editingName}
                          onChange={e => setEditingName(e.target.value)}
                          className="px-2 py-0.5 bg-white border border-orange-300 rounded text-xs font-semibold w-full"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveRename(sub.id)}
                          className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                        >
                          <Check size={13} />
                        </button>
                      </div>
                    ) : (
                      <span className="font-semibold text-slate-800 truncate">{sub.name}</span>
                    )}

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(sub.id);
                          setEditingName(sub.name);
                        }}
                        className="p-1 text-slate-400 hover:text-slate-700 rounded"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(sub.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Categories and sub-categories are immediately available across all Project Design cards.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
};

interface CreateProjectDesignModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: DesignCategory[];
  onSaveCategories: (next: DesignCategory[]) => void;
  onCreateDesign: (newDesign: QuoteTemplate, openInStudio: boolean) => void;
  existingCount: number;
}

export const CreateProjectDesignModal: React.FC<CreateProjectDesignModalProps> = ({
  isOpen,
  onClose,
  categories,
  onSaveCategories,
  onCreateDesign,
  existingCount
}) => {
  const mainCategories = categories.filter(c => !c.parentId);

  const [name, setName] = useState('');
  const [designCode, setDesignCode] = useState(
    `DSN-2026-${String(existingCount + 1).padStart(3, '0')}`
  );
  const [description, setDescription] = useState('');
  const [selectedMainCat, setSelectedMainCat] = useState<string>(
    mainCategories[0]?.name || 'Aluminium & Windows'
  );
  const [selectedSubCat, setSelectedSubCat] = useState<string>('');
  const [quoteType, setQuoteType] = useState<QuotationType>('Unit Rate');

  // Inline quick add category / subcategory
  const [showQuickMainCat, setShowQuickMainCat] = useState(false);
  const [quickMainCatName, setQuickMainCatName] = useState('');
  const [showQuickSubCat, setShowQuickSubCat] = useState(false);
  const [quickSubCatName, setQuickSubCatName] = useState('');

  // Media state (Image <= 1MB, Video <= 10MB)
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'none'>('none');
  const [mediaUrl, setMediaUrl] = useState<string>('');
  const [mediaFileName, setMediaFileName] = useState<string>('');
  const [mediaFileSize, setMediaFileSize] = useState<number>(0);
  const [mediaError, setMediaError] = useState<string | null>(null);

  // Design Specs
  const [buildingType, setBuildingType] = useState('Commercial & Residential');
  const [totalAreaSqft, setTotalAreaSqft] = useState<number>(250);
  const [windLoadPa, setWindLoadPa] = useState<number>(1500);
  const [acousticRatingDb] = useState('35 dB Rw');
  const [finishSpec, setFinishSpec] = useState('Powder Coated Matte Black / RAL 9005');
  const [glassSpec, setGlassSpec] = useState('10mm Clear Tempered Safety Glass');
  const [drawingRef, setDrawingRef] = useState(`CAD-DSN-${existingCount + 1}`);

  if (!isOpen) return null;

  const activeMainObj = mainCategories.find(c => c.name === selectedMainCat);
  const subCategoriesForMain = activeMainObj
    ? categories.filter(c => c.parentId === activeMainObj.id)
    : [];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setMediaError(null);
    if (!file) return;

    const validation = validateDesignMediaFile(file);
    if (!validation.valid) {
      setMediaError(validation.error || 'Invalid file size.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = ev => {
      const result = ev.target?.result as string;
      setMediaType(validation.mediaType || 'image');
      setMediaUrl(result);
      setMediaFileName(file.name);
      setMediaFileSize(file.size);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleGenerateBlueprintPreview = () => {
    setMediaError(null);
    const titleText = (name.trim() || 'ARCHITECTURAL PROJECT DESIGN').toUpperCase().slice(0, 42);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 320"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#0f172a"/><stop offset="100%" stop-color="#1e3a8a"/></linearGradient></defs><rect width="640" height="320" fill="url(#g)"/><g stroke="#334155" stroke-width="1" opacity="0.45"><line x1="0" y1="64" x2="640" y2="64"/><line x1="0" y1="128" x2="640" y2="128"/><line x1="0" y1="192" x2="640" y2="192"/><line x1="0" y1="256" x2="640" y2="256"/><line x1="128" y1="0" x2="128" y2="320"/><line x1="256" y1="0" x2="256" y2="320"/><line x1="384" y1="0" x2="384" y2="320"/><line x1="512" y1="0" x2="512" y2="320"/></g><rect x="90" y="60" width="460" height="205" fill="#38bdf8" fill-opacity="0.16" stroke="#38bdf8" stroke-width="3"/><line x1="240" y1="60" x2="240" y2="265" stroke="#e2e8f0" stroke-width="2.5"/><line x1="395" y1="60" x2="395" y2="265" stroke="#e2e8f0" stroke-width="2.5"/><line x1="90" y1="130" x2="550" y2="130" stroke="#f97316" stroke-width="2"/><text x="90" y="38" fill="#f8fafc" font-family="monospace" font-size="11" font-weight="bold">${titleText}</text><text x="90" y="292" fill="#93c5fd" font-family="monospace" font-size="10">${selectedMainCat} ${selectedSubCat ? '/ ' + selectedSubCat : ''} • ${totalAreaSqft} SQFT</text></svg>`;
    setMediaType('image');
    setMediaUrl(`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`);
    setMediaFileName(`${(designCode || 'design').toLowerCase()}_elevation.svg`);
    setMediaFileSize(128400);
  };

  const handleQuickAddMain = () => {
    const trimmed = quickMainCatName.trim();
    if (!trimmed) return;
    const newCat: DesignCategory = {
      id: `dcat-${Date.now()}`,
      name: trimmed,
      parentId: null,
      color: '#f97316'
    };
    onSaveCategories([...categories, newCat]);
    setSelectedMainCat(trimmed);
    setSelectedSubCat('');
    setQuickMainCatName('');
    setShowQuickMainCat(false);
  };

  const handleQuickAddSub = () => {
    const trimmed = quickSubCatName.trim();
    if (!trimmed || !activeMainObj) return;
    const newSub: DesignCategory = {
      id: `dsub-${Date.now()}`,
      name: trimmed,
      parentId: activeMainObj.id
    };
    onSaveCategories([...categories, newSub]);
    setSelectedSubCat(trimmed);
    setQuickSubCatName('');
    setShowQuickSubCat(false);
  };

  const handleSubmit = (openInStudio: boolean) => {
    if (!name.trim()) return;
    const newDesign: QuoteTemplate = {
      id: `dsn-${Date.now()}`,
      designCode: designCode.trim() || `DSN-2026-${existingCount + 1}`,
      name: name.trim(),
      description:
        description.trim() ||
        `Complete architectural project design under ${selectedMainCat}${selectedSubCat ? ` (${selectedSubCat})` : ''}.`,
      category: selectedMainCat,
      subCategory: selectedSubCat || subCategoriesForMain[0]?.name || 'Standard Design',
      quoteType,
      validityDays: 30,
      advancePercent: 50,
      taxPercent: 0,
      isTaxInclusive: false,
      estimatedDeliveryDays: 21,
      currency: 'LKR',
      mediaType: mediaType === 'none' ? 'image' : mediaType,
      mediaUrl:
        mediaUrl ||
        `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 320"><rect width="640" height="320" fill="#0f172a"/><rect x="85" y="55" width="470" height="210" fill="#0284c7" fill-opacity="0.2" stroke="#38bdf8" stroke-width="3"/><line x1="240" y1="55" x2="240" y2="265" stroke="#94a3b8" stroke-width="2"/><line x1="400" y1="55" x2="400" y2="265" stroke="#94a3b8" stroke-width="2"/><text x="85" y="38" fill="#f8fafc" font-family="monospace" font-size="12" font-weight="bold">${name.trim().toUpperCase()}</text></svg>`)}`,
      mediaFileName: mediaFileName || 'architectural_elevation.svg',
      mediaFileSize: mediaFileSize || 115200,
      designSpecs: {
        buildingType,
        totalAreaSqft: Number(totalAreaSqft) || 0,
        windLoadPa: Number(windLoadPa) || 0,
        acousticRatingDb,
        finishSpec,
        glassSpec,
        drawingRef
      },
      items: [],
      terms: DEFAULT_TERMS.slice(0, 12),
      paymentTiers: [
        { id: `pt-${Date.now()}-1`, phase: 'Advance on Design & Mobilization', percentage: 50, amount: 0, status: 'Pending' },
        { id: `pt-${Date.now()}-2`, phase: 'On Material Delivery & Fabrication', percentage: 35, amount: 0, status: 'Pending' },
        { id: `pt-${Date.now()}-3`, phase: 'Final Installation & Handover', percentage: 15, amount: 0, status: 'Pending' }
      ],
      isCustom: true,
      tags: [selectedMainCat, selectedSubCat || 'Project Design', quoteType].filter(Boolean),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onCreateDesign(newDesign, openInStudio);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[150] bg-slate-900/45 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-3xl w-full flex flex-col max-h-[90vh] overflow-hidden text-xs my-auto"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-100">
              <Layers size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Create New Project Design Card</h3>
              <p className="text-xs text-slate-500">
                Categorize your project design, attach an image (max 1 MB) or video (max 10 MB), and add products & services.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 rounded-lg">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* 1. Title, Code & Pricing Model */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="font-semibold text-slate-700">Project Design Title *</label>
              <input
                type="text"
                autoFocus
                placeholder="e.g. Luxury Villa Double-Glazed Curtain Wall & Pergola"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Design Code</label>
              <input
                type="text"
                value={designCode}
                onChange={e => setDesignCode(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-800"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Pricing Model</label>
              <select
                value={quoteType}
                onChange={e => setQuoteType(e.target.value as QuotationType)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800"
              >
                <option value="Unit Rate">Unit Rate</option>
                <option value="Fixed Price">Fixed Price</option>
                <option value="Executive">Executive</option>
                <option value="Budgetary">Budgetary</option>
                <option value="Lump Sum">Lump Sum</option>
              </select>
            </div>
          </div>

          {/* 2. Category & Sub-Category Selection with Inline Quick Add */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/70 p-4 rounded-xl border border-slate-200">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-700">Main Design Category</label>
                <button
                  type="button"
                  onClick={() => setShowQuickMainCat(!showQuickMainCat)}
                  className="text-[11px] font-semibold text-orange-600 hover:underline"
                >
                  {showQuickMainCat ? 'Cancel' : '+ New Category'}
                </button>
              </div>
              {showQuickMainCat ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    placeholder="Category name..."
                    value={quickMainCatName}
                    onChange={e => setQuickMainCatName(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 bg-white border border-orange-300 rounded-lg text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleQuickAddMain}
                    className="px-2.5 py-1.5 bg-orange-500 text-white rounded-lg font-semibold"
                  >
                    Add
                  </button>
                </div>
              ) : (
                <select
                  value={selectedMainCat}
                  onChange={e => {
                    setSelectedMainCat(e.target.value);
                    setSelectedSubCat('');
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-medium text-slate-800"
                >
                  {mainCategories.map(c => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-700">Design Sub-Category</label>
                <button
                  type="button"
                  onClick={() => setShowQuickSubCat(!showQuickSubCat)}
                  className="text-[11px] font-semibold text-orange-600 hover:underline"
                >
                  {showQuickSubCat ? 'Cancel' : '+ New Sub-Category'}
                </button>
              </div>
              {showQuickSubCat ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    placeholder="Sub-category name..."
                    value={quickSubCatName}
                    onChange={e => setQuickSubCatName(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 bg-white border border-orange-300 rounded-lg text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleQuickAddSub}
                    className="px-2.5 py-1.5 bg-orange-500 text-white rounded-lg font-semibold"
                  >
                    Add
                  </button>
                </div>
              ) : (
                <select
                  value={selectedSubCat || subCategoriesForMain[0]?.name || ''}
                  onChange={e => setSelectedSubCat(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-medium text-slate-800"
                >
                  {subCategoriesForMain.length === 0 ? (
                    <option value="General Design">General Design</option>
                  ) : (
                    subCategoriesForMain.map(sub => (
                      <option key={sub.id} value={sub.name}>
                        {sub.name}
                      </option>
                    ))
                  )}
                </select>
              )}
            </div>
          </div>

          {/* 3. Design Media Upload (Image max 1MB / Video max 10MB) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 flex items-center gap-1.5">
                <ImageIcon size={14} className="text-orange-500" />
                <span>Design Card Media (Image max 1 MB • Video max 10 MB)</span>
              </label>
              <button
                type="button"
                onClick={handleGenerateBlueprintPreview}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700"
              >
                <Sparkles size={12} />
                <span>Generate Architectural CAD Blueprint</span>
              </button>
            </div>

            {mediaError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2 text-xs font-semibold">
                <AlertTriangle size={15} className="shrink-0 text-rose-600" />
                <span>{mediaError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <label className="border-2 border-dashed border-slate-300 hover:border-orange-400 rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer bg-slate-50/50 hover:bg-orange-50/20 transition-all">
                <div className="flex items-center gap-2 text-slate-500 mb-1.5">
                  <Upload size={18} className="text-orange-500" />
                  <Video size={18} className="text-blue-500" />
                </div>
                <span className="font-bold text-slate-800">Click to Upload Image or Video</span>
                <span className="text-[11px] text-slate-500 mt-0.5">
                  Image ≤ {formatBytes(MAX_IMAGE_SIZE_BYTES)} (1 MB) • Video ≤ {formatBytes(MAX_VIDEO_SIZE_BYTES)} (10 MB)
                </span>
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {/* Live Media Preview Box */}
              <div className="h-36 rounded-xl border border-slate-200 bg-slate-900 overflow-hidden relative flex items-center justify-center">
                {mediaUrl ? (
                  <>
                    {mediaType === 'video' ? (
                      <video
                        src={mediaUrl}
                        controls
                        muted
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={mediaUrl}
                        alt="Design preview"
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-slate-900/80 text-white text-[10px] font-mono font-bold uppercase">
                      {mediaType} • {formatBytes(mediaFileSize)}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setMediaUrl('');
                        setMediaType('none');
                        setMediaFileName('');
                        setMediaFileSize(0);
                      }}
                      className="absolute top-2 right-2 p-1 rounded bg-slate-900/80 text-white hover:bg-rose-600"
                      title="Remove Media"
                    >
                      <X size={12} />
                    </button>
                  </>
                ) : (
                  <div className="text-center text-slate-400 px-4">
                    <p className="text-xs font-semibold text-slate-300">No Media Attached Yet</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Upload a photo/render (≤1MB) or walkthrough video (≤10MB)
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 4. Description & Architectural Design Specifications */}
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Design Scope & Summary</label>
              <textarea
                rows={2}
                placeholder="Describe the architectural system, glazing thickness, structural framing, and installation scope..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <Building2 size={13} className="text-orange-500" />
                <span>Engineering & Design Parameters</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] text-slate-500 font-semibold block">Building Type</label>
                  <input
                    type="text"
                    value={buildingType}
                    onChange={e => setBuildingType(e.target.value)}
                    className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-semibold block">Design Area (sqft)</label>
                  <input
                    type="number"
                    value={totalAreaSqft}
                    onChange={e => setTotalAreaSqft(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-semibold block">Wind Load (Pa)</label>
                  <input
                    type="number"
                    value={windLoadPa}
                    onChange={e => setWindLoadPa(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-semibold block">Finish Specification</label>
                  <input
                    type="text"
                    value={finishSpec}
                    onChange={e => setFinishSpec(e.target.value)}
                    className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-semibold block">Glass Specification</label>
                  <input
                    type="text"
                    value={glassSpec}
                    onChange={e => setGlassSpec(e.target.value)}
                    className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-semibold block">CAD Drawing Ref</label>
                  <input
                    type="text"
                    value={drawingRef}
                    onChange={e => setDrawingRef(e.target.value)}
                    className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!name.trim()}
              onClick={() => handleSubmit(false)}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-lg text-xs font-semibold disabled:opacity-40"
            >
              Save Card to Hub
            </button>
            <button
              type="button"
              disabled={!name.trim()}
              onClick={() => handleSubmit(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold shadow-xs disabled:opacity-40"
            >
              <Check size={14} />
              <span>Create & Open Design Studio (Add Products/Services)</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
