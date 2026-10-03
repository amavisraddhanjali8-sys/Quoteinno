import React, { useState } from 'react';
import { Term } from '../types';
import { CheckCircle2, Circle, ChevronDown, ChevronUp, Plus, Trash2, ArrowUp, ArrowDown, Sparkles } from 'lucide-react';
import { enhanceTerms } from '../services/geminiService';
import { ConfirmationModal } from './ConfirmationModal';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TermsEditorProps {
  terms: Term[];
  onChange: (terms: Term[]) => void;
}

export const TermsEditor: React.FC<TermsEditorProps> = ({ terms, onChange }) => {
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const safeTerms = Array.isArray(terms) ? terms : [];

  const handleEnhance = async () => {
    setIsEnhancing(true);
    try {
      const enhanced = await enhanceTerms(safeTerms);
      onChange(enhanced);
    } finally {
      setIsEnhancing(false);
    }
  };

  const toggleTerm = (id: string) => {
    onChange(safeTerms.map(t => t.id === id ? { ...t, isActive: !t.isActive } : t));
  };

  const updateTerm = (id: string, field: keyof Term, value: any) => {
    onChange(safeTerms.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const addTerm = () => {
    const newTerm: Term = {
      id: crypto.randomUUID(),
      no: `1.2.${safeTerms.length + 1}`,
      title: 'New Term',
      content: '',
      isActive: true
    };
    onChange([...safeTerms, newTerm]);
    setExpandedId(newTerm.id);
  };

  const removeTerm = (id: string) => {
    onChange(safeTerms.filter(t => t.id !== id));
  };

  const moveTerm = (index: number, direction: 'up' | 'down') => {
    const newTerms = [...safeTerms];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= safeTerms.length) return;
    [newTerms[index], newTerms[targetIndex]] = [newTerms[targetIndex], newTerms[index]];
    onChange(newTerms);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-blue-600 rounded-md flex items-center justify-center text-white shadow-sm">
            <CheckCircle2 size={12} />
          </div>
          <h2 className="font-bold text-xs text-slate-900">Terms & Conditions</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleEnhance}
            disabled={isEnhancing}
            className={cn(
              "flex items-center gap-1 px-2 py-1 bg-amber-500 text-white rounded-md hover:bg-amber-600 transition-all text-[9px] font-bold tracking-tight shadow-sm shadow-amber-600/20",
              isEnhancing && "animate-pulse"
            )}
          >
            <Sparkles size={12} className={cn(isEnhancing && "animate-spin")} />
            {isEnhancing ? "Enhancing..." : "AI enhance"}
          </button>
          <button
            onClick={() => setShowClearConfirm(true)}
            className="flex items-center gap-1 px-2 py-1 bg-rose-50 text-rose-600 border border-rose-100 rounded-md hover:bg-rose-600 hover:text-white transition-all text-[9px] font-bold tracking-tight"
          >
            <Trash2 size={12} /> Clear all
          </button>
          <button
            onClick={addTerm}
            className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all text-[9px] font-bold tracking-tight shadow-sm shadow-blue-600/20"
          >
            <Plus size={12} /> Add term
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-1.5">
        {safeTerms.map((term, index) => (
          <div
            key={term.id}
            className={`border rounded-lg transition-all ${
              term.isActive ? 'border-slate-200 bg-white shadow-sm' : 'border-slate-100 bg-slate-50 opacity-60'
            }`}
          >
            <div className="flex items-center gap-2 px-2 py-1.5">
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => moveTerm(index, 'up')}
                  disabled={index === 0}
                  className="text-slate-400 hover:text-blue-600 disabled:opacity-20 transition-colors"
                >
                  <ArrowUp size={10} />
                </button>
                <button
                  onClick={() => moveTerm(index, 'down')}
                  disabled={index === terms.length - 1}
                  className="text-slate-400 hover:text-blue-600 disabled:opacity-20 transition-colors"
                >
                  <ArrowDown size={10} />
                </button>
              </div>

              <button
                onClick={() => toggleTerm(term.id)}
                className={`transition-colors ${term.isActive ? 'text-blue-600' : 'text-slate-300'}`}
              >
                {term.isActive ? <CheckCircle2 size={16} /> : <Circle size={16} />}
              </button>

              <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-2 items-center">
                <div className="md:col-span-1">
                  <input
                    type="text"
                    value={term.no}
                    onChange={(e) => updateTerm(term.id, 'no', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-md px-1.5 py-0.5 text-[9px] font-mono text-slate-500 focus:ring-1 focus:ring-blue-600 focus:bg-white transition-all"
                    placeholder="No."
                  />
                </div>
                <div className="md:col-span-4">
                  <input
                    type="text"
                    value={term.title}
                    onChange={(e) => updateTerm(term.id, 'title', e.target.value)}
                    className="w-full bg-transparent border-none focus:ring-0 p-0 text-[11px] font-bold text-slate-900 placeholder:text-slate-400"
                    placeholder="Term Title"
                  />
                </div>
              </div>

              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => setExpandedId(expandedId === term.id ? null : term.id)}
                  className="p-1 hover:bg-slate-100 rounded-md transition-colors text-slate-500"
                >
                  {expandedId === term.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                <button
                  onClick={() => removeTerm(term.id)}
                  className="p-1 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-md transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            
            {expandedId === term.id && (
              <div className="px-2 pb-2 pt-0">
                <div className="p-2 bg-slate-50 rounded-md border border-slate-100">
                  <textarea
                    value={term.content}
                    onChange={(e) => updateTerm(term.id, 'content', e.target.value)}
                    className="w-full text-[10px] text-slate-600 bg-transparent border-none focus:ring-0 p-0 min-h-[60px] resize-none leading-relaxed font-medium"
                    placeholder="Describe the term and condition details here..."
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <ConfirmationModal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={() => onChange([])}
        title="Clear All Terms"
        message="Are you sure you want to clear all terms and conditions? This action cannot be undone."
        confirmText="Clear All"
        type="danger"
      />
    </div>
  );
};
