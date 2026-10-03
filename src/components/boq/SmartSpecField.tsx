import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus, Check, Search, X, Edit2, Trash2, BookmarkCheck } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';

interface SmartSpecFieldProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: string[];
  suggestions?: string[];
  placeholder?: string;
  isTextArea?: boolean;
  rows?: number;
  className?: string;
  helperText?: string;
  description?: string;
  onClear?: () => void;
  onDelete?: () => void;
}

export const SmartSpecField: React.FC<SmartSpecFieldProps> = ({
  label,
  value,
  onChange,
  options: initialOptions,
  suggestions = [],
  placeholder,
  isTextArea = false,
  rows = 2,
  className,
  helperText,
  description,
  onClear,
  onDelete
}) => {
  const storageKey = `innovista_smart_spec_${label.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

  const [isOpen, setIsOpen] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [customList, setCustomList] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return Array.from(new Set([...initialOptions, ...parsed]));
        }
      }
    } catch {
      // fallback
    }
    return initialOptions;
  });
  const [newCustomOption, setNewCustomOption] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingOption, setEditingOption] = useState<{ original: string; current: string } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync initialOptions if prop changes
  useEffect(() => {
    setCustomList(prev => {
      const merged = Array.from(new Set([...initialOptions, ...prev]));
      return merged;
    });
  }, [initialOptions]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setShowAddForm(false);
        setEditingOption(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomOption.trim()) return;
    const trimmed = newCustomOption.trim();
    const updated = Array.from(new Set([trimmed, ...customList]));
    setCustomList(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {
      // ignore
    }
    onChange(trimmed);
    setNewCustomOption('');
    setShowAddForm(false);
    toast.success(`Saved "${trimmed}" in system presets for next usage!`);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOption || !editingOption.current.trim()) return;
    const updatedName = editingOption.current.trim();
    const updated = customList.map(item => item === editingOption.original ? updatedName : item);
    setCustomList(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {
      // ignore
    }
    if (value === editingOption.original) {
      onChange(updatedName);
    }
    toast.success(`Updated "${updatedName}" in system presets!`);
    setEditingOption(null);
  };

  const handleDeleteOption = (optToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = customList.filter(item => item !== optToDelete);
    setCustomList(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {
      // ignore
    }
    if (value === optToDelete) {
      onChange('');
    }
    toast.info(`Deleted "${optToDelete}" from presets.`);
  };

  const handleClear = () => {
    if (onClear) {
      onClear();
    } else {
      onChange('');
    }
  };

  const filteredOptions = customList.filter(opt => 
    opt.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <div className={cn("space-y-1 relative bg-white", className)} ref={containerRef}>
      {/* Label and Field Description Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <label className="block text-[11px] font-bold text-slate-800 tracking-tight">
            {label}
          </label>
          {description && (
            <p className="text-[10px] text-slate-500 font-normal leading-tight mt-0.5">
              {description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {helperText && (
            <span className="text-[10px] text-slate-400 font-normal">{helperText}</span>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="text-slate-400 hover:text-red-600 p-0.5 rounded transition-colors"
              title={`Delete ${label} field`}
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      <div className="relative group">
        {isTextArea ? (
          <textarea
            rows={rows}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full text-xs px-2.5 py-1.5 pr-14 bg-white border border-slate-200 rounded-lg text-slate-900 focus:ring-1 focus:ring-orange-500 focus:border-orange-500 resize-none transition-colors"
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full text-xs px-2.5 py-1.5 pr-14 bg-white border border-slate-200 rounded-lg text-slate-900 focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-colors"
          />
        )}

        {/* Action Buttons: Clear/Delete & Dropdown Toggle */}
        <div className="absolute right-1.5 top-1.5 flex items-center gap-0.5">
          {value && (
            <button
              type="button"
              onClick={handleClear}
              title="Clear / Delete this value"
              className="p-1 rounded-md text-slate-300 hover:text-slate-600 hover:bg-slate-100 transition-all"
            >
              <X size={13} />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            title="Select or add details from library"
            className={cn(
              "p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all",
              isOpen && "bg-orange-50 text-orange-600"
            )}
          >
            <ChevronDown size={14} className={cn("transition-transform duration-150", isOpen && "rotate-180")} />
          </button>
        </div>

        {/* Dropdown Menu - Clean White Background */}
        {isOpen && (
          <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Search and Quick Add Header */}
            <div className="p-2 border-b border-slate-100 bg-white flex items-center gap-2">
              <div className="relative flex-1">
                <Search size={12} className="absolute left-2 top-2 text-slate-400" />
                <input
                  type="text"
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  placeholder={`Search ${label}...`}
                  className="w-full pl-6 pr-2 py-1 text-[11px] bg-white border border-slate-200 rounded-md text-slate-800 placeholder-slate-400 focus:outline-none focus:border-orange-400"
                  autoFocus
                />
              </div>
              <button
                type="button"
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-2 py-1 text-[10px] font-semibold bg-white hover:bg-orange-50 text-orange-700 rounded-md border border-orange-200 flex items-center gap-1 transition-colors whitespace-nowrap shadow-2xs"
              >
                <Plus size={11} />
                <span>Add Custom</span>
              </button>
            </div>

            {/* Inline Add Custom Option Form */}
            {showAddForm && (
              <form onSubmit={handleAddCustom} className="p-2 bg-orange-50/50 border-b border-orange-100 flex items-center gap-1.5">
                <input
                  type="text"
                  value={newCustomOption}
                  onChange={(e) => setNewCustomOption(e.target.value)}
                  placeholder="Type new detail to save for next usage..."
                  className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-orange-200 rounded-md text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!newCustomOption.trim()}
                  className="px-2.5 py-1.5 text-xs font-semibold bg-orange-500 hover:bg-orange-600 text-white rounded-md transition-colors disabled:opacity-50 flex items-center gap-1 shrink-0"
                >
                  <BookmarkCheck size={12} />
                  <span>Save & Apply</span>
                </button>
              </form>
            )}

            {/* Inline Edit Option Form */}
            {editingOption && (
              <form onSubmit={handleSaveEdit} className="p-2 bg-amber-50/60 border-b border-amber-200 flex items-center gap-1.5">
                <input
                  type="text"
                  value={editingOption.current}
                  onChange={(e) => setEditingOption({ ...editingOption, current: e.target.value })}
                  placeholder="Edit preset label..."
                  className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-amber-300 rounded-md text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!editingOption.current.trim()}
                  className="px-2.5 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-md transition-colors disabled:opacity-50 shrink-0"
                >
                  Update
                </button>
                <button
                  type="button"
                  onClick={() => setEditingOption(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded"
                >
                  <X size={14} />
                </button>
              </form>
            )}

            {/* Options List */}
            <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 text-xs bg-white">
              {filteredOptions.length === 0 ? (
                <div className="p-3 text-center text-slate-400 text-xs">
                  No matching details found. Click &quot;Add Custom&quot; to save a new detail.
                </div>
              ) : (
                filteredOptions.map((opt, idx) => {
                  const isSelected = value === opt;
                  return (
                    <div
                      key={idx}
                      className={cn(
                        "group w-full px-3 py-1.5 flex items-center justify-between gap-1.5 hover:bg-orange-50/60 transition-colors bg-white",
                        isSelected ? "bg-orange-50/80 text-orange-950 font-semibold" : "text-slate-700"
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          onChange(opt);
                          setIsOpen(false);
                        }}
                        className="flex-1 text-left flex items-center justify-between gap-2 overflow-hidden py-0.5"
                      >
                        <span className="truncate">{opt}</span>
                        {isSelected && <Check size={13} className="text-orange-600 shrink-0" />}
                      </button>

                      {/* Action buttons: Edit & Delete */}
                      <div className="flex items-center gap-0.5 shrink-0 pl-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingOption({ original: opt, current: opt });
                          }}
                          className="p-1 rounded text-slate-400 hover:text-amber-700 hover:bg-amber-100/60 transition-colors"
                          title={`Edit "${opt}"`}
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteOption(opt, e)}
                          className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title={`Delete "${opt}" from presets`}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Direct Free Typing Hint */}
            <div className="p-2 bg-white border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
              <span>Tip: You can edit directly in the text field or choose a preset.</span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-500 hover:text-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Suggestion Pills / Chips */}
      {suggestions.length > 0 && (
        <div className="flex flex-wrap items-center gap-1 pt-0.5">
          <span className="text-[9px] font-medium text-slate-400 uppercase tracking-wider mr-0.5">Quick:</span>
          {suggestions.map((sug, idx) => {
            const isMatch = value.includes(sug);
            return (
              <button
                key={idx}
                type="button"
                onClick={() => onChange(sug)}
                className={cn(
                  "px-1.5 py-0.5 rounded text-[10px] font-medium transition-all",
                  isMatch 
                    ? "bg-orange-50 text-orange-800 border border-orange-200 font-semibold" 
                    : "bg-white hover:bg-slate-50 text-slate-600 border border-slate-200"
                )}
                title={`Click to set "${sug}"`}
              >
                {sug}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
