import React, { useState } from 'react';
import { 
  DollarSign, TrendingUp
} from 'lucide-react';
import { RoleScopedFactoryProjectHub } from './RoleScopedFactoryProjectHub';

export const FinancePortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'wip' | 'budgets' | 'invoicing' | 'variations' | 'factory_finance'>('factory_finance');

  return (
    <div className="space-y-6">
      {/* Role-Based Factory & Project Finance, Invoices, Contracts & Accounting Hub */}
      <RoleScopedFactoryProjectHub
        portalName="Finance, Invoices, Contracts & Accounting Portal"
        defaultSubTab="finance_contracts"
      />
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                Operational Finance & Controllership
              </span>
              <span className="text-xs text-slate-400">WIP Valuation, Cost Absorption & Billing Milestones</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-emerald-600" />
              Workshop Financial Control & Absorption
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Tracking standard machine and direct labor absorption against real-time project work packages, milestone invoicing, and client variation claims.
            </p>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-4 border-t border-slate-100">
          <button
            onClick={() => setActiveTab('wip')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${activeTab === 'wip' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
          >
            Work in Progress (WIP) Valuation
          </button>
          <button
            onClick={() => setActiveTab('budgets')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${activeTab === 'budgets' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
          >
            Budget vs Actual Absorption
          </button>
          <button
            onClick={() => setActiveTab('invoicing')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${activeTab === 'invoicing' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
          >
            Milestone Billing & Retention
          </button>
          <button
            onClick={() => setActiveTab('variations')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${activeTab === 'variations' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
          >
            Variation Orders (VO) Claims
          </button>
        </div>
      </div>

      {/* Tab: WIP */}
      {activeTab === 'wip' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <span className="text-xs text-slate-400 block font-medium">Consolidated WIP Balance</span>
            <span className="text-2xl font-bold text-slate-900">AED 2,950,000</span>
            <span className="text-xs text-emerald-600 flex items-center gap-1 font-medium">
              <TrendingUp className="w-3.5 h-3.5" /> 68% Project Physical Progress
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <span className="text-xs text-slate-400 block font-medium">Billed Milestones to Date</span>
            <span className="text-2xl font-bold text-indigo-700">AED 2,910,000</span>
            <span className="text-xs text-slate-500">60% Contract Billing Threshold</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <span className="text-xs text-slate-400 block font-medium">Withheld Retention (10%)</span>
            <span className="text-2xl font-bold text-amber-600">AED 485,000</span>
            <span className="text-xs text-slate-500">Release on Final Handover & TOC</span>
          </div>
        </div>
      )}

      {/* Tab: Budgets */}
      {activeTab === 'budgets' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h4 className="text-sm font-bold text-slate-900">Operational Variance & Absorption Rates</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Cost Center</th>
                  <th className="p-3 text-right">Allocated Budget</th>
                  <th className="p-3 text-right">Actual Absorbed</th>
                  <th className="p-3 text-right">Variance</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50">
                  <td className="p-3 font-semibold text-slate-900">Direct Material (SS316 Plate & Steel)</td>
                  <td className="p-3 text-right">AED 1,950,000</td>
                  <td className="p-3 text-right">AED 1,820,000</td>
                  <td className="p-3 text-right text-emerald-600 font-bold">+AED 130,000</td>
                  <td className="p-3 text-right"><span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">Favorable</span></td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-3 font-semibold text-slate-900">Direct Workshop Labor</td>
                  <td className="p-3 text-right">AED 980,000</td>
                  <td className="p-3 text-right">AED 640,000</td>
                  <td className="p-3 text-right text-emerald-600 font-bold">+AED 340,000</td>
                  <td className="p-3 text-right"><span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">Favorable</span></td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-3 font-semibold text-slate-900">CNC & Machine Absorption</td>
                  <td className="p-3 text-right">AED 520,000</td>
                  <td className="p-3 text-right">AED 380,000</td>
                  <td className="p-3 text-right text-emerald-600 font-bold">+AED 140,000</td>
                  <td className="p-3 text-right"><span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">Favorable</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Invoicing */}
      {activeTab === 'invoicing' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h4 className="text-sm font-bold text-slate-900">Milestone Invoicing & Cash Collections</h4>
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
            <div className="p-4 flex justify-between items-center bg-slate-50">
              <div>
                <span className="font-bold text-slate-900">INV-2026-0041: Engineering Submittals & IFC</span>
                <span className="text-slate-500 ml-2">Paid on 2026-03-10</span>
              </div>
              <span className="font-bold text-emerald-600">AED 727,500 (Collected)</span>
            </div>
            <div className="p-4 flex justify-between items-center">
              <div>
                <span className="font-bold text-slate-900">INV-2026-0089: Raw Material Delivery</span>
                <span className="text-slate-500 ml-2">Paid on 2026-04-25</span>
              </div>
              <span className="font-bold text-emerald-600">AED 970,000 (Collected)</span>
            </div>
            <div className="p-4 flex justify-between items-center">
              <div>
                <span className="font-bold text-slate-900">INV-2026-0142: FAT 50% Assembly Progress</span>
                <span className="text-slate-500 ml-2">Due on 2026-08-20</span>
              </div>
              <span className="font-bold text-amber-600">AED 1,212,500 (Pending Payment)</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Variations */}
      {activeTab === 'variations' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h4 className="text-sm font-bold text-slate-900">Approved Variations Commercial Summary</h4>
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-xs flex justify-between items-center">
            <div>
              <span className="font-bold text-slate-900">VO-PRJ-01: Concealed LED Extrusion Upgrade</span>
              <div className="text-slate-500 mt-0.5">Status: Client Approved • Time Impact: +5 Days</div>
            </div>
            <span className="font-bold text-indigo-700 text-sm">AED 145,000</span>
          </div>
        </div>
      )}
    </div>
  );
};
