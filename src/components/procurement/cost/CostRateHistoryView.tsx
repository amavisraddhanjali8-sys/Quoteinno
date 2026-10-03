import React, { useState } from 'react';
import { 
  History, 
  Search, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Building2, 
  User, 
  Calendar, 
  X
} from 'lucide-react';
import { 
  ProcurementCostItem, 
  CostItemRateHistory, 
  Supplier 
} from '../../../types/procurement';
import { procurementCostService } from '../../../services/procurementCostService';

interface CostRateHistoryViewProps {
  costItems: ProcurementCostItem[];
  suppliers: Supplier[];
  currency?: string;
  onRefreshItems: () => void;
}

export const CostRateHistoryView: React.FC<CostRateHistoryViewProps> = ({
  costItems,
  suppliers,
  currency = 'LKR',
  onRefreshItems
}) => {
  const [historyList, setHistoryList] = useState<CostItemRateHistory[]>(() => {
    return procurementCostService.getRateHistory();
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  // Form State
  const [costItemId, setCostItemId] = useState(costItems[0]?.id || '');
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || '');
  const [previousRate, setPreviousRate] = useState<number>(100);
  const [newRate, setNewRate] = useState<number>(110);
  const [reason, setReason] = useState('Market Commodity Index Price Movement');
  const [changedBy, setChangedBy] = useState('Senior Procurement Specialist');
  const [notes, setNotes] = useState('');

  const filteredHistory = historyList.filter(entry => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return entry.itemCode.toLowerCase().includes(q) ||
      entry.itemName.toLowerCase().includes(q) ||
      entry.supplierName.toLowerCase().includes(q) ||
      entry.reason.toLowerCase().includes(q) ||
      entry.changedBy.toLowerCase().includes(q);
  });

  const handleAddLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const item = costItems.find(i => i.id === costItemId);
    const sup = suppliers.find(s => s.id === supplierId);
    if (!item || !sup) return;

    procurementCostService.addRateHistory({
      costItemId: item.id,
      itemCode: item.itemCode,
      itemName: item.name,
      supplierId: sup.id,
      supplierName: sup.name,
      previousRate: Number(previousRate),
      newRate: Number(newRate),
      currency,
      effectiveDate: new Date().toISOString().split('T')[0],
      reason: reason.trim(),
      changedBy: changedBy.trim(),
      notes: notes.trim()
    });

    setHistoryList(procurementCostService.getRateHistory());
    setIsLogModalOpen(false);
    onRefreshItems();
  };

  return (
    <div className="space-y-4 text-xs font-sans">
      {/* 1. Header Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-3 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-[300px]">
          <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <History size={16} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
              Rate History & Commodity Market Intelligence
            </h3>
            <p className="text-[11px] text-slate-500">
              Audit log of vendor rate revisions, LME indexing, fuel surcharges & contract price adjustments
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative min-w-[200px]">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search historical logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-orange-500"
            />
          </div>

          <button
            onClick={() => setIsLogModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
          >
            <Plus size={13} />
            <span>Record Rate Change</span>
          </button>
        </div>
      </div>

      {/* 2. Rate History Timeline Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider select-none">
                <th className="py-2.5 px-3">Effective Date</th>
                <th className="py-2.5 px-3">Item Code & Name</th>
                <th className="py-2.5 px-3">Vendor / Supplier</th>
                <th className="py-2.5 px-3 text-right">Previous Rate</th>
                <th className="py-2.5 px-3 text-right">New Revised Rate</th>
                <th className="py-2.5 px-3 text-center">Movement</th>
                <th className="py-2.5 px-3">Revision Justification & Market Index</th>
                <th className="py-2.5 px-3">Authorized By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No rate history entries found.
                  </td>
                </tr>
              ) : (
                filteredHistory.map(entry => {
                  const delta = entry.newRate - entry.previousRate;
                  const deltaPct = entry.previousRate > 0 ? (delta / entry.previousRate) * 100 : 0;
                  const isIncrease = delta > 0;

                  return (
                    <tr key={entry.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Date */}
                      <td className="py-2.5 px-3 font-mono font-medium text-slate-600 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Calendar size={12} className="text-slate-400" />
                          <span>{entry.effectiveDate}</span>
                        </div>
                      </td>

                      {/* Item */}
                      <td className="py-2.5 px-3">
                        <span className="font-mono font-bold text-[11px] text-orange-950 bg-orange-50 border border-orange-200 px-1.5 py-0.2 rounded">
                          {entry.itemCode}
                        </span>
                        <div className="font-bold text-slate-900 truncate max-w-[200px] mt-0.5" title={entry.itemName}>
                          {entry.itemName}
                        </div>
                      </td>

                      {/* Supplier */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-medium text-slate-800">
                          <Building2 size={12} className="text-slate-400 shrink-0" />
                          <span>{entry.supplierName}</span>
                        </div>
                      </td>

                      {/* Previous Rate */}
                      <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                        {entry.currency} {entry.previousRate.toLocaleString()}
                      </td>

                      {/* New Rate */}
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        {entry.currency} {entry.newRate.toLocaleString()}
                      </td>

                      {/* Movement */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                          isIncrease ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {isIncrease ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                          <span>{isIncrease ? `+${deltaPct.toFixed(1)}%` : `${deltaPct.toFixed(1)}%`}</span>
                        </span>
                      </td>

                      {/* Justification */}
                      <td className="py-2.5 px-3 max-w-[260px]">
                        <div className="font-medium text-slate-800 truncate" title={entry.reason}>
                          {entry.reason}
                        </div>
                        {entry.notes && (
                          <div className="text-[10px] text-slate-400 truncate" title={entry.notes}>
                            {entry.notes}
                          </div>
                        )}
                      </td>

                      {/* User */}
                      <td className="py-2.5 px-3 font-medium text-slate-600 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <User size={11} className="text-slate-400" />
                          <span>{entry.changedBy}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Modal: Record Rate Change */}
      {isLogModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div 
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
              <div className="flex items-center gap-2">
                <History size={18} className="text-orange-500" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Record Vendor Rate Revision Log
                </h3>
              </div>
              <button
                onClick={() => setIsLogModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddLogSubmit} className="p-6 space-y-4 text-xs overflow-y-auto">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Cost Item <span className="text-red-500">*</span>
                </label>
                <select
                  value={costItemId}
                  onChange={(e) => setCostItemId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900"
                >
                  {costItems.map(i => (
                    <option key={i.id} value={i.id}>
                      [{i.itemCode}] {i.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Vendor / Supplier <span className="text-red-500">*</span>
                </label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-900"
                >
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.vendorCode})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Previous Rate ({currency})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={previousRate}
                    onChange={(e) => setPreviousRate(parseFloat(e.target.value) || 0)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    New Rate ({currency}) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newRate}
                    onChange={(e) => setNewRate(parseFloat(e.target.value) || 0)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-orange-950"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Revision Reason & Justification <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. LME Aluminium Commodity Price Increase (+5.2%)"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Authorized By
                </label>
                <input
                  type="text"
                  value={changedBy}
                  onChange={(e) => setChangedBy(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Additional Contract Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Demurrage details, validity duration, price review schedule..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsLogModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg shadow-xs cursor-pointer"
                >
                  Save Log Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
