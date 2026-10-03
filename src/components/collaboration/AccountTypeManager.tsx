import React, { useState, useMemo } from 'react';
import {
  FolderTree,
  Plus,
  Search,
  CheckCircle2,
  Edit2,
  Trash2,
  Tag,
  ChevronRight,
  X,
  Sparkles,
  Save,
  Check
} from 'lucide-react';
import {
  AccountCategory,
  AccountTypeDefinition,
  AccountSubtypeDefinition
} from '../../types/collaboration';
import { collaborationService } from '../../services/collaborationService';

export const AccountTypeManager: React.FC = () => {
  const [accountTypes, setAccountTypes] = useState<AccountTypeDefinition[]>(() =>
    collaborationService.getAccountTypes()
  );
  const [subtypes, setSubtypes] = useState<AccountSubtypeDefinition[]>(() =>
    collaborationService.getSubtypes()
  );

  const [selectedCategory, setSelectedCategory] = useState<AccountCategory | 'ALL'>('ALL');
  const [selectedParentTypeId, setSelectedParentTypeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isNewTypeModalOpen, setIsNewTypeModalOpen] = useState(false);
  const [isNewSubtypeModalOpen, setIsNewSubtypeModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<AccountTypeDefinition | null>(null);
  const [editingSubtype, setEditingSubtype] = useState<AccountSubtypeDefinition | null>(null);

  // Form states for Type
  const [typeName, setTypeName] = useState('');
  const [typeCategory, setTypeCategory] = useState<AccountCategory>('PROFESSIONAL');
  const [typeDescription, setTypeDescription] = useState('');
  const [typeIsOptional, setTypeIsOptional] = useState(false);

  // Form states for Subtype
  const [subtypeName, setSubtypeName] = useState('');
  const [subtypeParentId, setSubtypeParentId] = useState('');
  const [subtypeDescription, setSubtypeDescription] = useState('');
  const [subtypeFields, setSubtypeFields] = useState<string>('Registration, Portfolio, Drawings, Specifications');

  // Notification / Flash message
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  const showBanner = (msg: string) => {
    setBannerMessage(msg);
    setTimeout(() => setBannerMessage(null), 3500);
  };

  const refreshData = () => {
    setAccountTypes(collaborationService.getAccountTypes());
    setSubtypes(collaborationService.getSubtypes());
  };

  const filteredTypes = useMemo(() => {
    return accountTypes.filter(t => {
      const matchCat = selectedCategory === 'ALL' || t.category === selectedCategory;
      const matchQuery =
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.code.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [accountTypes, selectedCategory, searchQuery]);

  const activeParentType = useMemo(() => {
    if (!selectedParentTypeId) {
      return filteredTypes[0] || accountTypes[0] || null;
    }
    return accountTypes.find(t => t.id === selectedParentTypeId) || null;
  }, [selectedParentTypeId, filteredTypes, accountTypes]);

  const relatedSubtypes = useMemo(() => {
    if (!activeParentType) return [];
    return subtypes.filter(s => s.parentTypeId === activeParentType.id);
  }, [subtypes, activeParentType]);

  const handleToggleTypeStatus = (id: string) => {
    collaborationService.toggleAccountTypeStatus(id);
    refreshData();
    showBanner('Account type status updated.');
  };

  const handleToggleSubtypeStatus = (id: string) => {
    collaborationService.toggleSubtypeStatus(id);
    refreshData();
    showBanner('Subtype status updated.');
  };

  const handleDeleteType = (id: string) => {
    if (confirm('Are you sure you want to delete this custom account type? All associated subtypes will also be removed.')) {
      const res = collaborationService.deleteAccountType(id);
      if (res) {
        refreshData();
        showBanner('Custom account type removed.');
      } else {
        alert('System-defined core account types cannot be removed.');
      }
    }
  };

  const handleDeleteSubtype = (id: string) => {
    if (confirm('Are you sure you want to delete this subtype?')) {
      const res = collaborationService.deleteSubtype(id);
      if (res) {
        refreshData();
        showBanner('Subtype removed.');
      } else {
        alert('System-defined core subtypes cannot be removed.');
      }
    }
  };

  const handleSaveType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typeName.trim()) return;

    collaborationService.saveAccountType({
      id: editingType ? editingType.id : undefined,
      name: typeName.trim(),
      category: typeCategory,
      description: typeDescription.trim(),
      isOptional: typeIsOptional,
      isActive: true
    });

    refreshData();
    setIsNewTypeModalOpen(false);
    setEditingType(null);
    setTypeName('');
    setTypeDescription('');
    showBanner(editingType ? 'Account type updated successfully.' : 'New custom account type created.');
  };

  const handleSaveSubtype = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subtypeName.trim() || !subtypeParentId) return;

    collaborationService.saveSubtype({
      id: editingSubtype ? editingSubtype.id : undefined,
      parentTypeId: subtypeParentId,
      name: subtypeName.trim(),
      description: subtypeDescription.trim(),
      availableFields: subtypeFields.split(',').map(f => f.trim()).filter(Boolean),
      isActive: true
    });

    refreshData();
    setIsNewSubtypeModalOpen(false);
    setEditingSubtype(null);
    setSubtypeName('');
    setSubtypeDescription('');
    showBanner(editingSubtype ? 'Subtype updated successfully.' : 'New custom subtype created without code modification.');
  };

  const openNewSubtypeModalForParent = (parentId: string) => {
    setSubtypeParentId(parentId);
    setEditingSubtype(null);
    setSubtypeName('');
    setSubtypeDescription('');
    setIsNewSubtypeModalOpen(true);
  };

  const getCategoryColor = (cat: AccountCategory) => {
    switch (cat) {
      case 'INTERNAL': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'PROFESSIONAL': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'COMMERCIAL': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'CLIENT': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'SPECIALIST': return 'bg-rose-50 text-rose-700 border-rose-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-5 text-slate-800">
      
      {/* Top Banner Flash Message */}
      {bannerMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{bannerMessage}</span>
          </div>
          <button onClick={() => setBannerMessage(null)} className="text-emerald-500 hover:text-emerald-800">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <FolderTree className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold tracking-tight text-slate-900">
              Account Type Manager
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              Admin Dynamic Hierarchy
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configure parent account types, dynamic discipline subtypes (e.g. Interior Designer, Kitchen Designer, Structural Engineer, ACP Supplier), and defaults without code changes.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              if (activeParentType) {
                openNewSubtypeModalForParent(activeParentType.id);
              }
            }}
            disabled={!activeParentType}
            className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors flex items-center gap-1.5 border border-slate-200 shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5 text-blue-600" />
            <span>New Subtype</span>
          </button>

          <button
            onClick={() => {
              setEditingType(null);
              setTypeName('');
              setTypeDescription('');
              setTypeCategory('PROFESSIONAL');
              setIsNewTypeModalOpen(true);
            }}
            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Account Type</span>
          </button>
        </div>
      </div>

      {/* Category Pills & Search */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs">
          {(['ALL', 'INTERNAL', 'PROFESSIONAL', 'COMMERCIAL', 'CLIENT', 'SPECIALIST'] as const).map(cat => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white font-semibold shadow-xs'
                    : 'bg-slate-100/70 hover:bg-slate-200/70 text-slate-600'
                }`}
              >
                {cat === 'ALL' ? 'All Categories' : cat}
              </button>
            );
          })}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search types & codes..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Two Column Layout: Parent Account Types (Left) + Subtypes & Details (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column: Account Types List */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col h-[680px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Account Types ({filteredTypes.length})
            </h3>
            <span className="text-[10px] text-slate-400">Click to inspect subtypes</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {filteredTypes.map(t => {
              const isSelected = activeParentType?.id === t.id;
              const typeSubtypesCount = subtypes.filter(s => s.parentTypeId === t.id).length;

              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedParentTypeId(t.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                    isSelected
                      ? 'bg-blue-50/70 border-blue-300 ring-1 ring-blue-500/20 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="space-y-1 min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {t.name}
                      </span>
                      {t.isOptional && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200">
                          Optional
                        </span>
                      )}
                      {!t.isActive && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-200">
                          Disabled
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className={`px-1.5 py-0.5 rounded font-mono font-medium border ${getCategoryColor(t.category)}`}>
                        {t.category}
                      </span>
                      <span className="text-slate-400 font-mono">
                        {t.code}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!t.isSystem && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteType(t.id);
                        }}
                        className="p-1 rounded text-rose-500 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 cursor-pointer"
                        title="Delete custom account type"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      {typeSubtypesCount} subtypes
                    </span>
                    <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'text-blue-600 translate-x-0.5' : 'text-slate-300 group-hover:text-slate-400'}`} />
                  </div>
                </div>
              );
            })}

            {filteredTypes.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-xs">
                No account types found matching your query.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Dynamic Subtypes for Selected Parent Type */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col h-[680px]">
          {activeParentType ? (
            <>
              {/* Active Type Header */}
              <div className="pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">
                      {activeParentType.name}
                    </h3>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getCategoryColor(activeParentType.category)}`}>
                      {activeParentType.category}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {activeParentType.code}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {activeParentType.description}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleToggleTypeStatus(activeParentType.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                      activeParentType.isActive
                        ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    {activeParentType.isActive ? 'Deactivate Type' : 'Activate Type'}
                  </button>

                  <button
                    onClick={() => openNewSubtypeModalForParent(activeParentType.id)}
                    className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Subtype</span>
                  </button>
                </div>
              </div>

              {/* Subtypes List */}
              <div className="flex items-center justify-between pb-2 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Configured Subtypes ({relatedSubtypes.length})
                </span>
                <span className="text-[10px] text-slate-400">
                  Admin dynamic specialization tree
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {relatedSubtypes.map(sub => (
                  <div
                    key={sub.id}
                    className="p-3 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex items-center justify-between group shadow-2xs"
                  >
                    <div className="space-y-1 min-w-0 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          {sub.name}
                        </span>
                        {!sub.isActive && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-200">
                            Inactive
                          </span>
                        )}
                        {!sub.isSystem && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" />
                            Custom
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1">
                        {sub.description}
                      </p>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Code: {sub.code}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleToggleSubtypeStatus(sub.id)}
                        className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                          sub.isActive
                            ? 'text-emerald-600 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                            : 'text-slate-400 bg-slate-50 border-slate-200 hover:bg-slate-100'
                        }`}
                        title={sub.isActive ? 'Active (Click to disable)' : 'Inactive (Click to enable)'}
                      >
                        {sub.isActive ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={() => {
                          setEditingSubtype(sub);
                          setSubtypeParentId(sub.parentTypeId);
                          setSubtypeName(sub.name);
                          setSubtypeDescription(sub.description);
                          setSubtypeFields((sub.availableFields || []).join(', '));
                          setIsNewSubtypeModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                        title="Edit subtype"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {!sub.isSystem && (
                        <button
                          onClick={() => handleDeleteSubtype(sub.id)}
                          className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                          title="Delete custom subtype"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {relatedSubtypes.length === 0 && (
                  <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-y-2 border border-dashed border-slate-200 rounded-xl">
                    <Tag className="w-6 h-6 text-slate-300" />
                    <span>No subtypes defined under {activeParentType.name} yet.</span>
                    <button
                      onClick={() => openNewSubtypeModalForParent(activeParentType.id)}
                      className="px-3 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold hover:bg-blue-100 cursor-pointer"
                    >
                      Create First Subtype
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400 text-xs">
              Select an account type on the left to inspect and configure subtypes.
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT ACCOUNT TYPE                                            */}
      {/* ========================================================================= */}
      {isNewTypeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                {editingType ? 'Edit Account Type' : 'Create New Account Type'}
              </h3>
              <button
                onClick={() => setIsNewTypeModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveType} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Account Category
                </label>
                <select
                  value={typeCategory}
                  onChange={(e) => setTypeCategory(e.target.value as AccountCategory)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                >
                  <option value="INTERNAL">INTERNAL (Innovista In-House)</option>
                  <option value="PROFESSIONAL">PROFESSIONAL (Consultants & Specialists)</option>
                  <option value="COMMERCIAL">COMMERCIAL (Partners, Contractors, Suppliers)</option>
                  <option value="CLIENT">CLIENT (B2B, Resident, Developers)</option>
                  <option value="SPECIALIST">SPECIALIST (Testing, Certification, Financial)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Type Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={typeName}
                  onChange={(e) => setTypeName(e.target.value)}
                  placeholder="e.g. Energy Consultant, Glazing Engineer"
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={typeDescription}
                  onChange={(e) => setTypeDescription(e.target.value)}
                  placeholder="Responsibilities and purpose of this account type..."
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              {typeCategory === 'INTERNAL' && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="typeOptional"
                    checked={typeIsOptional}
                    onChange={(e) => setTypeIsOptional(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="typeOptional" className="text-xs text-slate-700 font-medium">
                    Optional internal account (can be disabled by default)
                  </label>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewTypeModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Account Type</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT DYNAMIC SUBTYPE                                         */}
      {/* ========================================================================= */}
      {isNewSubtypeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {editingSubtype ? 'Edit Subtype' : 'Add Dynamic Subtype'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Extending discipline hierarchy without code modification
                </p>
              </div>
              <button
                onClick={() => setIsNewSubtypeModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSubtype} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Parent Account Type
                </label>
                <select
                  value={subtypeParentId}
                  onChange={(e) => setSubtypeParentId(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                >
                  {accountTypes.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Subtype Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={subtypeName}
                  onChange={(e) => setSubtypeName(e.target.value)}
                  placeholder="e.g. Solar Engineer, ACP Supplier, Kitchen Designer"
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={subtypeDescription}
                  onChange={(e) => setSubtypeDescription(e.target.value)}
                  placeholder="Specialization scope, deliverables, and role context..."
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Available Fields (comma separated)
                </label>
                <input
                  type="text"
                  value={subtypeFields}
                  onChange={(e) => setSubtypeFields(e.target.value)}
                  placeholder="e.g. License Number, Council Registration, Tool Catalog"
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewSubtypeModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Subtype</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
