import React, { useState } from 'react';
import {
  Activity,
  Building2,
  ArrowUpRight,
  Printer
} from 'lucide-react';
import { FactoryQuotationDocumentModal, FactoryRecordDocumentSpec } from './FactoryQuotationDocumentModal';
import { buildFactoryProfileDocSpec } from './factoryDocumentBuilders';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  FactoryMasterProfile,
  FactoryWorkPackageAssignment,
  FactoryExecutionTask,
  DigitalWorksheetRecord,
  FactoryQualityInspectionRecord,
  FactoryDispatchAndSiteRecord,
  OfflineSyncQueueItem
} from '../../types/factoryPortal';
import { SecurityUser } from '../../types/security';

interface FactoryDashboardTabProps {
  currentUser: SecurityUser | null;
  factories: FactoryMasterProfile[];
  workPackages: FactoryWorkPackageAssignment[];
  tasks: FactoryExecutionTask[];
  worksheets: DigitalWorksheetRecord[];
  inspections: FactoryQualityInspectionRecord[];
  dispatches: FactoryDispatchAndSiteRecord[];
  offlineQueue: OfflineSyncQueueItem[];
  notificationCounts?: Record<string, number>;
  onNavigateSubPortal: (subPortalId: string) => void;
  onSelectFactory?: (factoryId: string, targetTab?: string) => void;
  onRefresh: () => void;
}

const PRODUCTION_TRAJECTORY_DATA = [
  { month: 'May', fabricated: 185, qcApproved: 176, dispatched: 162 },
  { month: 'Jun', fabricated: 220, qcApproved: 212, dispatched: 198 },
  { month: 'Jul', fabricated: 248, qcApproved: 239, dispatched: 225 },
  { month: 'Aug', fabricated: 276, qcApproved: 268, dispatched: 254 },
  { month: 'Sep', fabricated: 310, qcApproved: 302, dispatched: 288 },
  { month: 'Oct', fabricated: 342, qcApproved: 335, dispatched: 318 }
];

export const FactoryDashboardTab: React.FC<FactoryDashboardTabProps> = ({
  currentUser,
  factories,
  workPackages,
  tasks,
  worksheets,
  inspections,
  dispatches,
  notificationCounts = {},
  onSelectFactory,
  onRefresh
}) => {
  const [activeDocSpec, setActiveDocSpec] = useState<FactoryRecordDocumentSpec | null>(null);
  const plannedTasks = tasks.filter(t => ['Draft', 'Assigned', 'Planned', 'Ready'].includes(t.stageStatus));
  const progressingTasks = tasks.filter(t => ['In Progress', 'Rework Required'].includes(t.stageStatus));
  const qcTasks = tasks.filter(t => ['Submitted for Inspection', 'Rejected'].includes(t.stageStatus));
  const completedTasks = tasks.filter(t =>
    ['Approved', 'Completed', 'Packed', 'Dispatched', 'Delivered', 'Installed', 'Accepted', 'Closed'].includes(
      t.stageStatus
    )
  );

  const stageDistributionData = [
    { name: 'Planned', value: Math.max(1, plannedTasks.length), color: '#0284c7' },
    { name: 'Active', value: Math.max(1, progressingTasks.length), color: '#6366f1' },
    { name: 'Quality', value: Math.max(1, qcTasks.length), color: '#f59e0b' },
    { name: 'Done', value: Math.max(1, completedTasks.length), color: '#10b981' }
  ];

  return (
    <div className="space-y-4">
      {/* Performance & Distribution Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-orange-500" />
              <h3 className="text-sm font-semibold text-slate-900">Output Trend</h3>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="w-2 h-2 rounded-full bg-orange-500" /> Fabricated
              </span>
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="w-2 h-2 rounded-full bg-sky-500" /> QC Approved
              </span>
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Dispatched
              </span>
            </div>
          </div>

          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={PRODUCTION_TRAJECTORY_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorFab" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorQc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorDsp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    fontSize: '11px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                  }}
                />
                <Area type="monotone" dataKey="fabricated" stroke="#f97316" strokeWidth={2} fillOpacity={1} fill="url(#colorFab)" />
                <Area type="monotone" dataKey="qcApproved" stroke="#0284c7" strokeWidth={2} fillOpacity={1} fill="url(#colorQc)" />
                <Area type="monotone" dataKey="dispatched" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorDsp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Task Stages</h3>

          <div className="relative h-[145px] flex items-center justify-center my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stageDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={46}
                  outerRadius={66}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {stageDistributionData.map((entry, index) => (
                    <Cell key={`fac-cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[11px] text-slate-400">Tasks</span>
              <span className="text-base font-extrabold text-slate-900">{tasks.length}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center justify-between p-2 rounded-xl bg-sky-50/60 border border-sky-100/80 text-xs">
              <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                <span className="w-2 h-2 rounded-full bg-sky-500" /> Planned
              </span>
              <span className="font-bold text-slate-900">{plannedTasks.length}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-indigo-50/60 border border-indigo-100/80 text-xs">
              <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                <span className="w-2 h-2 rounded-full bg-indigo-500" /> Active
              </span>
              <span className="font-bold text-slate-900">{progressingTasks.length}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-amber-50/60 border border-amber-100/80 text-xs">
              <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> Quality
              </span>
              <span className="font-bold text-slate-900">{qcTasks.length}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50/60 border border-emerald-100/80 text-xs">
              <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Done
              </span>
              <span className="font-bold text-slate-900">{completedTasks.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Live Factory Status by Linked Actual Records (Single Row per Factory, No Supervisor Hub) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-orange-500" />
            <h2 className="text-xs font-bold text-slate-900">Factory Status ({factories.length})</h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-semibold text-slate-400">
                <th className="py-2.5 px-4">Code</th>
                <th className="py-2.5 px-4">Factory</th>
                <th className="py-2.5 px-4">Location</th>
                <th className="py-2.5 px-4 text-center">Assignments</th>
                <th className="py-2.5 px-4 text-center">Tasks</th>
                <th className="py-2.5 px-4 text-center">Logs</th>
                <th className="py-2.5 px-4 text-center">Quality</th>
                <th className="py-2.5 px-4 text-center">Dispatch</th>
                <th className="py-2.5 px-4 text-center">Updates</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {factories.map(f => {
                const facWps = workPackages.filter(w => w.factoryId === f.id);
                const facTasks = tasks.filter(t => t.factoryId === f.id);
                const facDoneTasks = facTasks.filter(t =>
                  ['Approved', 'Completed', 'Packed', 'Dispatched', 'Delivered', 'Installed', 'Accepted', 'Closed'].includes(
                    t.stageStatus
                  )
                );
                const facWs = worksheets.filter(w => w.factoryId === f.id);
                const facInsp = inspections.filter(i => i.factoryId === f.id);
                const facPassInsp = facInsp.filter(i => i.decision === 'Approved');
                const facDsp = dispatches.filter(d => d.factoryId === f.id);
                const notifCount = notificationCounts[f.id] ?? 0;

                return (
                  <tr key={f.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-800 whitespace-nowrap">
                      {f.factoryCode}
                    </td>
                    <td className="py-2.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                      {f.name}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600 whitespace-nowrap">
                      {f.city}
                    </td>
                    <td className="py-2.5 px-4 text-center font-mono font-semibold text-sky-700">
                      {facWps.length}
                    </td>
                    <td className="py-2.5 px-4 text-center font-mono font-semibold text-indigo-700">
                      {facDoneTasks.length}/{facTasks.length}
                    </td>
                    <td className="py-2.5 px-4 text-center font-mono font-semibold text-slate-700">
                      {facWs.length}
                    </td>
                    <td className="py-2.5 px-4 text-center font-mono font-semibold text-emerald-700">
                      {facPassInsp.length}/{facInsp.length}
                    </td>
                    <td className="py-2.5 px-4 text-center font-mono font-semibold text-amber-700">
                      {facDsp.length}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      {notifCount > 0 ? (
                        <span className="inline-flex items-center justify-center min-w-[20px] h-[20px] px-1.5 rounded-full bg-red-600 text-white text-[10px] font-bold">
                          {notifCount}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-mono">0</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          f.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                            : 'bg-amber-50 text-amber-700 border-amber-200/80'
                        }`}
                      >
                        {f.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setActiveDocSpec(buildFactoryProfileDocSpec(f))}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-[11px] font-semibold inline-flex items-center gap-1 transition-colors"
                        >
                          <Printer className="w-3 h-3" />
                          <span>Doc</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onSelectFactory?.(f.id, 'work_packages')}
                          className="px-2.5 py-1 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-semibold inline-flex items-center gap-1 transition-colors"
                        >
                          <span>Open</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {activeDocSpec && (
        <FactoryQuotationDocumentModal
          spec={activeDocSpec}
          currentUser={currentUser}
          onClose={() => setActiveDocSpec(null)}
          onRefresh={onRefresh}
        />
      )}
    </div>
  );
};
