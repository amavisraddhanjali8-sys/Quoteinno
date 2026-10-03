import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Target, Building } from 'lucide-react';
import { ItemTemplate, CompetitivePriceEntry } from '../../types';

interface CompetitivePriceModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: ItemTemplate[];
  selectedItem?: ItemTemplate | null;
  onSaveCompetitivePrice: (itemId: string, newEntry: CompetitivePriceEntry) => void;
}

export const CompetitivePriceModal: React.FC<CompetitivePriceModalProps> = ({
  isOpen,
  onClose,
  items,
  selectedItem: initialItem,
  onSaveCompetitivePrice
}) => {
  const [selectedItemId, setSelectedItemId] = useState<string>(
    initialItem?.id || (items.length > 0 ? items[0].id : '')
  );
  const activeItem = items.find(i => i.id === selectedItemId) || initialItem;

  const [competitorName, setCompetitorName] = useState('');
  const [price, setPrice] = useState<number>(activeItem?.rate ? Math.round(activeItem.rate * 1.05) : 0);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [parity, setParity] = useState<'Identical' | 'Higher' | 'Lower'>('Identical');
  const [projectName, setProjectName] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  // Calculate variance compared to our active rate
  const ourRate = activeItem?.rate || 0;
  const variancePercent = ourRate > 0 && price > 0 
    ? Math.round(((price - ourRate) / ourRate) * 1000) / 10 
    : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId || !competitorName.trim() || price <= 0) return;

    const newEntry: CompetitivePriceEntry = {
      id: `cp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      competitorName: competitorName.trim(),
      price: Number(price),
      date,
      parity,
      projectName: projectName.trim() || undefined,
      notes: notes.trim() || undefined
    };

    onSaveCompetitivePrice(selectedItemId, newEntry);
    onClose();
  };

  const modalContent = (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Target size={16} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Add Competitive Price</h2>
              <p className="text-xs text-slate-500 font-normal">Track competitor quotes and market intelligence</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Target Item */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Target BOQ Item</label>
            <select
              value={selectedItemId}
              onChange={(e) => {
                setSelectedItemId(e.target.value);
                const it = items.find(i => i.id === e.target.value);
                if (it) {
                  setPrice(Math.round(it.rate * 1.05));
                }
              }}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
            >
              {items.map(it => (
                <option key={it.id} value={it.id}>
                  {it.productCode ? `[${it.productCode}] ` : ''}{it.name} (Our Rate: LKR {it.rate})
                </option>
              ))}
            </select>
          </div>

          {/* Competitor Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Competitor / Vendor Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Building size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                value={competitorName}
                onChange={(e) => setCompetitorName(e.target.value)}
                placeholder="e.g., Metro Aluminium Ltd, Access Engineering..."
                className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Competitor Price & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Competitor Price (LKR) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={price}
                onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-semibold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Observed Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Comparison Variance Pill */}
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
            <span className="text-slate-600 font-medium">Comparison vs Our Rate:</span>
            <span className={`font-bold ${variancePercent > 0 ? 'text-emerald-600' : variancePercent < 0 ? 'text-rose-600' : 'text-slate-700'}`}>
              {variancePercent > 0 ? `+${variancePercent}% (We are cheaper)` : variancePercent < 0 ? `${variancePercent}% (Competitor cheaper)` : 'Identical'}
            </span>
          </div>

          {/* Specification Parity */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Specification Parity</label>
            <div className="grid grid-cols-3 gap-2">
              {(['Identical', 'Higher', 'Lower'] as const).map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setParity(opt)}
                  className={`py-1.5 text-xs font-medium rounded-lg border transition-all ${
                    parity === opt
                      ? 'bg-blue-50 text-blue-700 border-blue-300 shadow-2xs font-semibold'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {opt} Spec
                </button>
              ))}
            </div>
          </div>

          {/* Tender / Project Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tender / Project Name (Optional)</label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g. Cinnamon Grand Renovation, Shangri-La..."
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Intelligence Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Intelligence / Source Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Quoted for 48 units with standard lock..."
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all shadow-xs"
            >
              Add Market Price
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
