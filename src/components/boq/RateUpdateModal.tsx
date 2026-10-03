import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, TrendingUp, Calendar, Percent, User } from 'lucide-react';
import { ItemTemplate, RateHistoryEntry } from '../../types';

interface RateUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: ItemTemplate[];
  selectedItem?: ItemTemplate | null;
  onSaveRate: (itemId: string, newEntry: RateHistoryEntry, updateCurrentRate: boolean) => void;
}

export const RateUpdateModal: React.FC<RateUpdateModalProps> = ({
  isOpen,
  onClose,
  items,
  selectedItem: initialItem,
  onSaveRate
}) => {
  const [selectedItemId, setSelectedItemId] = useState<string>(
    initialItem?.id || (items.length > 0 ? items[0].id : '')
  );
  const activeItem = items.find(i => i.id === selectedItemId) || initialItem;

  const [rate, setRate] = useState<number>(activeItem?.rate || 0);
  const [supplierCost, setSupplierCost] = useState<number>(activeItem?.lastSupplierPrice || Math.round((activeItem?.rate || 0) * 0.72));
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [version, setVersion] = useState<string>('v' + (((activeItem?.rateHistory?.length || 0) + 1) * 0.5 + 1).toFixed(1));
  const [reason, setReason] = useState<string>('Market price index calibration');
  const [recordedBy, setRecordedBy] = useState<string>('Senior Estimator');
  const [updateCurrentRate, setUpdateCurrentRate] = useState<boolean>(true);

  if (!isOpen) return null;

  // Calculate margin %
  const marginPercent = rate > 0 ? Math.round(((rate - supplierCost) / rate) * 1000) / 10 : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId || rate <= 0) return;

    const newEntry: RateHistoryEntry = {
      id: `rh-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      date,
      rate: Number(rate),
      supplierCost: Number(supplierCost),
      marginPercent,
      version,
      reason,
      recordedBy,
      status: 'Approved'
    };

    onSaveRate(selectedItemId, newEntry, updateCurrentRate);
    onClose();
  };

  const modalContent = (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center shadow-xs">
              <TrendingUp size={16} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Record Rate Update</h2>
              <p className="text-xs text-slate-500 font-normal">Add historical price point with cost & margin</p>
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
                  setRate(it.rate);
                  setSupplierCost(it.lastSupplierPrice || Math.round(it.rate * 0.72));
                }
              }}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium"
            >
              {items.map(it => (
                <option key={it.id} value={it.id}>
                  {it.productCode ? `[${it.productCode}] ` : ''}{it.name} ({it.unit})
                </option>
              ))}
            </select>
          </div>

          {/* Rate & Supplier Cost */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                New Unit Rate (LKR) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={rate}
                onChange={(e) => setRate(parseFloat(e.target.value) || 0)}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-semibold focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Base Supplier Cost (LKR)
              </label>
              <input
                type="number"
                step="0.01"
                value={supplierCost}
                onChange={(e) => setSupplierCost(parseFloat(e.target.value) || 0)}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-semibold focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>
          </div>

          {/* Calculated Margin Pill */}
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
            <span className="text-slate-600 font-medium flex items-center gap-1.5">
              <Percent size={13} className="text-orange-500" /> Gross Profit Margin:
            </span>
            <span className={`font-bold ${marginPercent >= 20 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {marginPercent}% {marginPercent >= 20 ? '(Healthy)' : '(Low Margin)'}
            </span>
          </div>

          {/* Date & Version */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar size={12} className="text-slate-400" /> Effective Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Version / Revision Tag</label>
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="e.g. v2.1, Tender Rev-A"
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Change Reason / Project Context</label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Raw material ingot index increase, Annual revision..."
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>

          {/* Recorded By */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <User size={12} className="text-slate-400" /> Recorded By / Estimator
            </label>
            <input
              type="text"
              value={recordedBy}
              onChange={(e) => setRecordedBy(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>

          {/* Update Current Active Rate checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="updateCurrent"
              checked={updateCurrentRate}
              onChange={(e) => setUpdateCurrentRate(e.target.checked)}
              className="rounded text-orange-600 focus:ring-orange-500 h-4 w-4"
            />
            <label htmlFor="updateCurrent" className="text-xs text-slate-700 font-medium cursor-pointer">
              Set as the active current selling rate in BOQ Library
            </label>
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
              className="px-5 py-2 text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-all shadow-xs"
            >
              Save Rate Entry
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
