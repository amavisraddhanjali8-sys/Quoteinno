import React, { useState, useMemo } from 'react';
import {
  Hash,
  Search,
  RotateCcw,
  Plus,
  CheckCircle2,
  Sparkles,
  Layers,
  Trash2,
  Copy,
  Play,
  FileText,
  CreditCard,
  Briefcase,
  Factory,
  ShoppingCart,
  ShieldCheck,
  Users,
  Wrench,
  X
} from 'lucide-react';
import {
  numberingService,
  NumberingSequenceConfig,
  NumberingDomain,
  DateTokenFormat
} from '../../services/numberingService';
import { CompanySettings } from '../../types';
import { toast } from 'sonner';

interface MasterNumberingRegistryProps {
  localSettings: CompanySettings;
  setLocalSettings: React.Dispatch<React.SetStateAction<CompanySettings>>;
  onSaveSettings: (updatedSettings: CompanySettings) => void;
}

const DOMAIN_META: {
  id: 'ALL' | NumberingDomain;
  label: string;
  icon: React.FC<{ size?: number; className?: string }>;
  badgeClass: string;
}[] = [
  { id: 'ALL', label: 'All Unique IDs', icon: Layers, badgeClass: 'bg-slate-100 text-slate-700 border-slate-200' },
  { id: 'Commercial & Quotations', label: 'Commercial & Quotes', icon: FileText, badgeClass: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'Accounting & Finance', label: 'Accounting & Invoices', icon: CreditCard, badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { id: 'Projects & Tasks', label: 'Projects & Tasks', icon: Briefcase, badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { id: 'Factory & Production', label: 'Factory & Shop-Floor', icon: Factory, badgeClass: 'bg-amber-50 text-amber-700 border-amber-200' },
  { id: 'Procurement & Inventory', label: 'Procurement & POs', icon: ShoppingCart, badgeClass: 'bg-purple-50 text-purple-700 border-purple-200' },
  { id: 'Quality, HSE & Warranty', label: 'Quality, HSE & NCR', icon: ShieldCheck, badgeClass: 'bg-rose-50 text-rose-700 border-rose-200' },
  { id: 'HR & Payroll', label: 'HR & Payroll', icon: Users, badgeClass: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  { id: 'Equipment & Document Control', label: 'Equipment & Docs', icon: Wrench, badgeClass: 'bg-teal-50 text-teal-700 border-teal-200' }
];

export const MasterNumberingRegistry: React.FC<MasterNumberingRegistryProps> = ({
  localSettings,
  setLocalSettings,
  onSaveSettings
}) => {
  const [sequences, setSequences] = useState<NumberingSequenceConfig[]>(() =>
    numberingService.getAllSequences()
  );
  const [selectedDomain, setSelectedDomain] = useState<'ALL' | NumberingDomain>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddCustomModal, setShowAddCustomModal] = useState(false);

  // New Custom Sequence Modal State
  const [customLabel, setCustomLabel] = useState('');
  const [customKey, setCustomKey] = useState('');
  const [customDomain, setCustomDomain] = useState<NumberingDomain>('Projects & Tasks');
  const [customPrefix, setCustomPrefix] = useState('CUST');
  const [customDateToken, setCustomDateToken] = useState<DateTokenFormat>('YYYY');
  const [customSeparator, setCustomSeparator] = useState<'-' | '/' | '_' | ''>('-');
  const [customDigits, setCustomDigits] = useState(4);
  const [customNextNum, setCustomNextNum] = useState(1001);
  const [customSuffix, setCustomSuffix] = useState('');
  const [customFieldUsed, setCustomFieldUsed] = useState('Custom System Record');
  const [customDesc, setCustomDesc] = useState('');

  const syncWithCompanySettings = (updatedList: NumberingSequenceConfig[], autoSave = false) => {
    setSequences(updatedList);
    numberingService.saveAllSequences(updatedList);

    const quoteSeq = updatedList.find(s => s.key === 'quotation');
    const invoiceSeq = updatedList.find(s => s.key === 'invoice');

    const quotePrefixStr = quoteSeq ? numberingService.getLegacyPrefixString('quotation') : localSettings.quoteNumberPrefix;
    const invPrefixStr = invoiceSeq ? numberingService.getLegacyPrefixString('invoice') : localSettings.invoiceNumberPrefix;

    const nextSettings: CompanySettings = {
      ...localSettings,
      quoteNumberPrefix: quotePrefixStr,
      nextQuoteNumber: quoteSeq ? quoteSeq.nextNumber : localSettings.nextQuoteNumber,
      invoiceNumberPrefix: invPrefixStr,
      nextInvoiceNumber: invoiceSeq ? invoiceSeq.nextNumber : localSettings.nextInvoiceNumber,
      numberingSequences: updatedList
    };

    setLocalSettings(nextSettings);
    if (autoSave) {
      onSaveSettings(nextSettings);
    }
  };

  const handleUpdateSequence = (key: string, patch: Partial<NumberingSequenceConfig>) => {
    const nextList = sequences.map(seq => (seq.key === key ? { ...seq, ...patch } : seq));
    syncWithCompanySettings(nextList, false);
  };

  const handleTestIncrement = (seq: NumberingSequenceConfig) => {
    const generated = numberingService.formatNumber(seq);
    const nextList = sequences.map(s =>
      s.key === seq.key ? { ...s, nextNumber: (s.nextNumber || 1) + 1 } : s
    );
    syncWithCompanySettings(nextList, true);
    toast.success(`Generated ${seq.label}: ${generated}`, {
      description: `Counter advanced to ${(seq.nextNumber || 1) + 1}`
    });
  };

  const handleResetDefaults = () => {
    const defaults = numberingService.resetToDefaults();
    syncWithCompanySettings(defaults, true);
    toast.info('All unique ID sequences restored to factory defaults');
  };

  const handleCreateCustomSequence = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customLabel.trim() || !customPrefix.trim()) return;

    const cleanKey =
      customKey.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_') ||
      customLabel.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');

    const updated = numberingService.addCustomSequence({
      key: cleanKey,
      label: customLabel.trim(),
      domain: customDomain,
      description: customDesc.trim() || `Custom unique identifier for ${customLabel.trim()}`,
      fieldUsedIn: customFieldUsed.trim() || 'Custom Entity',
      prefix: customPrefix.trim().toUpperCase(),
      dateToken: customDateToken,
      separator: customSeparator,
      paddingDigits: customDigits,
      nextNumber: customNextNum,
      suffix: customSuffix.trim(),
      resetPolicy: 'YEARLY',
      isActive: true
    });

    syncWithCompanySettings(updated, true);
    setShowAddCustomModal(false);
    setCustomLabel('');
    setCustomKey('');
    setCustomPrefix('CUST');
    setCustomDesc('');
    toast.success(`Added custom unique ID rule: ${customLabel}`);
  };

  const handleDeleteCustom = (key: string, label: string) => {
    const updated = numberingService.deleteCustomSequence(key);
    syncWithCompanySettings(updated, true);
    toast.info(`Removed custom ID rule: ${label}`);
  };

  const filteredSequences = useMemo(() => {
    return sequences.filter(seq => {
      if (selectedDomain !== 'ALL' && seq.domain !== selectedDomain) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const preview = numberingService.formatNumber(seq).toLowerCase();
        return (
          seq.label.toLowerCase().includes(q) ||
          seq.key.toLowerCase().includes(q) ||
          seq.prefix.toLowerCase().includes(q) ||
          seq.description.toLowerCase().includes(q) ||
          seq.fieldUsedIn.toLowerCase().includes(q) ||
          seq.domain.toLowerCase().includes(q) ||
          preview.includes(q)
        );
      }
      return true;
    });
  }, [sequences, selectedDomain, searchQuery]);

  const domainCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: sequences.length };
    sequences.forEach(s => {
      counts[s.domain] = (counts[s.domain] || 0) + 1;
    });
    return counts;
  }, [sequences]);

  // Quick spotlight cards for the top 4 core sequences (Quotation, Invoice, Project, Task)
  const spotlightKeys = ['quotation', 'invoice', 'project', 'task'];
  const spotlightSequences = spotlightKeys
    .map(k => sequences.find(s => s.key === k))
    .filter((s): s is NumberingSequenceConfig => Boolean(s));

  return (
    <div className="space-y-5">
      {/* Top Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-orange-500/20 border border-orange-500/40 text-orange-300 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
              <Sparkles size={11} /> Enterprise Unique ID & Sequence Engine
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              {sequences.length} Active ID Definitions
            </span>
          </div>
          <h2 className="text-base font-bold tracking-tight text-white">
            Master System Unique IDs & Auto-Numbering Registry
          </h2>
          <p className="text-xs text-slate-300 max-w-3xl">
            Centrally define prefixes, year/month tokens, separators, zero-padding digits, next sequence numbers, and suffixes for every document, task, invoice, quotation, project, work order, PO, NCR, employee, and verification code across all portals.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowAddCustomModal(true)}
            className="px-3 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Plus size={14} /> Define New Unique ID
          </button>
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Reset all numbering sequences to default values"
          >
            <RotateCcw size={13} /> Reset Defaults
          </button>
        </div>
      </div>

      {/* Top 4 Core Sequence Live Preview Cards (Quotation, Invoice, Project, Task) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {spotlightSequences.map(seq => {
          const preview = numberingService.formatNumber(seq);
          return (
            <div
              key={seq.key}
              className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex flex-col justify-between gap-2 hover:border-blue-400 transition-all"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {seq.label}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[9px] font-semibold">
                  Next: #{seq.nextNumber}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 my-0.5">
                <span className="text-sm font-mono font-bold text-slate-900 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 tracking-tight">
                  {preview}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(preview);
                    toast.success(`Copied ${preview}`);
                  }}
                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Copy sample ID"
                >
                  <Copy size={13} />
                </button>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500">
                <span className="truncate">{seq.fieldUsedIn}</span>
                <span className="font-semibold text-emerald-600 flex items-center gap-0.5">
                  <CheckCircle2 size={10} /> Live
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search & Domain Category Filter Bar */}
      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search any unique ID or number (e.g., Invoice, Quotation, Task, Project, PO, GRN, Work Order, Job Card, NCR, Employee, SVC)..."
              className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-600 font-medium shrink-0">
            <span>Showing</span>
            <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white font-bold text-[11px]">
              {filteredSequences.length}
            </span>
            <span>of {sequences.length} sequences</span>
          </div>
        </div>

        {/* Domain Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {DOMAIN_META.map(dom => {
            const Icon = dom.icon;
            const active = selectedDomain === dom.id;
            const count = domainCounts[dom.id] || 0;
            return (
              <button
                key={dom.id}
                type="button"
                onClick={() => setSelectedDomain(dom.id)}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer border ${
                  active
                    ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Icon size={12} />
                <span>{dom.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[9px] font-mono ${
                    active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Editable Sequences Table */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-2.5 px-3 min-w-[210px]">Document / Entity ID</th>
                <th className="py-2.5 px-2 min-w-[110px]">Prefix</th>
                <th className="py-2.5 px-2 min-w-[115px]">Date Token</th>
                <th className="py-2.5 px-2 min-w-[75px]">Sep</th>
                <th className="py-2.5 px-2 min-w-[80px]">Digits</th>
                <th className="py-2.5 px-2 min-w-[105px]">Next Number</th>
                <th className="py-2.5 px-2 min-w-[85px]">Suffix</th>
                <th className="py-2.5 px-2 min-w-[95px]">Reset</th>
                <th className="py-2.5 px-3 min-w-[175px]">Live ID Preview</th>
                <th className="py-2.5 px-3 text-right min-w-[90px]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredSequences.map(seq => {
                const livePreview = numberingService.formatNumber(seq);
                const domMeta = DOMAIN_META.find(d => d.id === seq.domain) || DOMAIN_META[0];
                return (
                  <tr
                    key={seq.key}
                    className="hover:bg-blue-50/30 transition-colors group"
                  >
                    {/* Label & Domain */}
                    <td className="py-2.5 px-3 align-middle">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 text-xs">
                            {seq.label}
                          </span>
                          {seq.isCustom && (
                            <span className="px-1.5 py-0.2 bg-orange-100 text-orange-700 rounded text-[9px] font-bold">
                              Custom
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500 line-clamp-1">
                          {seq.description}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className={`px-1.5 py-0.2 rounded border text-[9px] font-semibold ${domMeta.badgeClass}`}
                          >
                            {seq.domain}
                          </span>
                          <span className="text-[9px] font-mono text-slate-400">
                            {seq.fieldUsedIn}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Prefix Input */}
                    <td className="py-2.5 px-2 align-middle">
                      <input
                        type="text"
                        value={seq.prefix}
                        onChange={e =>
                          handleUpdateSequence(seq.key, {
                            prefix: e.target.value.toUpperCase()
                          })
                        }
                        placeholder="INV"
                        className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs font-bold text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
                      />
                    </td>

                    {/* Date Token Select */}
                    <td className="py-2.5 px-2 align-middle">
                      <select
                        value={seq.dateToken}
                        onChange={e =>
                          handleUpdateSequence(seq.key, {
                            dateToken: e.target.value as DateTokenFormat
                          })
                        }
                        className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-700 focus:bg-white focus:border-blue-500 focus:outline-none"
                      >
                        <option value="YYYY">YYYY ({new Date().getFullYear()})</option>
                        <option value="YY">YY ({String(new Date().getFullYear()).slice(-2)})</option>
                        <option value="YYYYMM">
                          YYYYMM ({new Date().getFullYear()}
                          {String(new Date().getMonth() + 1).padStart(2, '0')})
                        </option>
                        <option value="NONE">None</option>
                      </select>
                    </td>

                    {/* Separator Select */}
                    <td className="py-2.5 px-2 align-middle">
                      <select
                        value={seq.separator}
                        onChange={e =>
                          handleUpdateSequence(seq.key, {
                            separator: e.target.value as '-' | '/' | '_' | ''
                          })
                        }
                        className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs font-bold text-slate-700 focus:bg-white focus:border-blue-500 focus:outline-none"
                      >
                        <option value="-">- (Hyphen)</option>
                        <option value="/">/ (Slash)</option>
                        <option value="_">_ (Under)</option>
                        <option value="">None</option>
                      </select>
                    </td>

                    {/* Padding Digits */}
                    <td className="py-2.5 px-2 align-middle">
                      <select
                        value={seq.paddingDigits}
                        onChange={e =>
                          handleUpdateSequence(seq.key, {
                            paddingDigits: parseInt(e.target.value, 10) || 4
                          })
                        }
                        className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs font-semibold text-slate-700 focus:bg-white focus:border-blue-500 focus:outline-none"
                      >
                        <option value={2}>2 (01)</option>
                        <option value={3}>3 (001)</option>
                        <option value={4}>4 (0001)</option>
                        <option value={5}>5 (00001)</option>
                        <option value={6}>6 (000001)</option>
                      </select>
                    </td>

                    {/* Next Number Input */}
                    <td className="py-2.5 px-2 align-middle">
                      <input
                        type="number"
                        min={1}
                        value={seq.nextNumber}
                        onChange={e =>
                          handleUpdateSequence(seq.key, {
                            nextNumber: Math.max(1, parseInt(e.target.value, 10) || 1)
                          })
                        }
                        className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs font-bold text-blue-700 focus:bg-white focus:border-blue-500 focus:outline-none"
                      />
                    </td>

                    {/* Optional Suffix */}
                    <td className="py-2.5 px-2 align-middle">
                      <input
                        type="text"
                        value={seq.suffix}
                        onChange={e =>
                          handleUpdateSequence(seq.key, {
                            suffix: e.target.value.toUpperCase()
                          })
                        }
                        placeholder="e.g. -A"
                        className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs text-slate-700 focus:bg-white focus:border-blue-500 focus:outline-none"
                      />
                    </td>

                    {/* Reset Policy */}
                    <td className="py-2.5 px-2 align-middle">
                      <select
                        value={seq.resetPolicy}
                        onChange={e =>
                          handleUpdateSequence(seq.key, {
                            resetPolicy: e.target.value as 'NEVER' | 'YEARLY' | 'MONTHLY'
                          })
                        }
                        className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-medium text-slate-700 focus:bg-white focus:border-blue-500 focus:outline-none"
                      >
                        <option value="YEARLY">Yearly</option>
                        <option value="MONTHLY">Monthly</option>
                        <option value="NEVER">Never</option>
                      </select>
                    </td>

                    {/* Live Preview Pill */}
                    <td className="py-2.5 px-3 align-middle">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 text-white font-mono text-xs font-bold tracking-tight shadow-2xs">
                        <Hash size={11} className="text-orange-400 shrink-0" />
                        <span>{livePreview}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-3 align-middle text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleTestIncrement(seq)}
                          className="px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white font-semibold text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
                          title="Issue next number & increment counter"
                        >
                          <Play size={10} /> Issue +1
                        </button>
                        {seq.isCustom && (
                          <button
                            type="button"
                            onClick={() => handleDeleteCustom(seq.key, seq.label)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                            title="Delete custom sequence"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredSequences.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-10 text-center text-slate-400 text-xs">
                    No unique ID sequence matched "{searchQuery}". Try clearing the search filter or click "Define New Unique ID".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal to Define a New Custom Unique ID Sequence */}
      {showAddCustomModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Hash size={16} className="text-orange-400" />
                <h3 className="text-sm font-bold">Define Custom System Unique ID</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddCustomModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateCustomSequence} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500">
                    Document / Entity Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={customLabel}
                    onChange={e => setCustomLabel(e.target.value)}
                    placeholder="e.g. Gate Pass Number"
                    className="input-field py-1.5 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500">
                    System Domain *
                  </label>
                  <select
                    value={customDomain}
                    onChange={e => setCustomDomain(e.target.value as NumberingDomain)}
                    className="input-field py-1.5 text-xs"
                  >
                    {DOMAIN_META.filter(d => d.id !== 'ALL').map(d => (
                      <option key={d.id} value={d.id}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500">Prefix *</label>
                  <input
                    type="text"
                    required
                    value={customPrefix}
                    onChange={e => setCustomPrefix(e.target.value.toUpperCase())}
                    placeholder="GP"
                    className="input-field py-1.5 text-xs font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500">Separator</label>
                  <select
                    value={customSeparator}
                    onChange={e => setCustomSeparator(e.target.value as '-' | '/' | '_' | '')}
                    className="input-field py-1.5 text-xs font-mono"
                  >
                    <option value="-">Hyphen (-)</option>
                    <option value="/">Slash (/)</option>
                    <option value="_">Underscore (_)</option>
                    <option value="">None</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500">Date Token</label>
                  <select
                    value={customDateToken}
                    onChange={e => setCustomDateToken(e.target.value as DateTokenFormat)}
                    className="input-field py-1.5 text-xs"
                  >
                    <option value="YYYY">YYYY</option>
                    <option value="YY">YY</option>
                    <option value="YYYYMM">YYYYMM</option>
                    <option value="NONE">None</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500">Digits</label>
                  <select
                    value={customDigits}
                    onChange={e => setCustomDigits(parseInt(e.target.value, 10) || 4)}
                    className="input-field py-1.5 text-xs font-mono"
                  >
                    <option value={3}>3 (001)</option>
                    <option value={4}>4 (0001)</option>
                    <option value={5}>5 (00001)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500">Start No</label>
                  <input
                    type="number"
                    min={1}
                    value={customNextNum}
                    onChange={e => setCustomNextNum(parseInt(e.target.value, 10) || 1)}
                    className="input-field py-1.5 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500">
                    Target Field / Module
                  </label>
                  <input
                    type="text"
                    value={customFieldUsed}
                    onChange={e => setCustomFieldUsed(e.target.value)}
                    placeholder="e.g. Logistics.gatePassNo"
                    className="input-field py-1.5 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500">
                    Optional Suffix
                  </label>
                  <input
                    type="text"
                    value={customSuffix}
                    onChange={e => setCustomSuffix(e.target.value.toUpperCase())}
                    placeholder="e.g. -LK"
                    className="input-field py-1.5 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-500">Description</label>
                <input
                  type="text"
                  value={customDesc}
                  onChange={e => setCustomDesc(e.target.value)}
                  placeholder="Brief description of where this unique number is used"
                  className="input-field py-1.5 text-xs"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-900 text-white flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                  Live Number Preview
                </span>
                <span className="font-mono text-sm font-bold text-orange-400">
                  {numberingService.formatNumber({
                    key: 'preview',
                    label: customLabel || 'Preview',
                    domain: customDomain,
                    description: '',
                    fieldUsedIn: '',
                    prefix: customPrefix || 'ID',
                    dateToken: customDateToken,
                    separator: customSeparator,
                    paddingDigits: customDigits,
                    nextNumber: customNextNum,
                    suffix: customSuffix,
                    resetPolicy: 'YEARLY',
                    isActive: true
                  })}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddCustomModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs"
                >
                  Save Unique ID Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
