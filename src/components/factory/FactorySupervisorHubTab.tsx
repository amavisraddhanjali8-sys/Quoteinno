import React, { useState } from 'react';
import {
  Briefcase,
  ClipboardList,
  Play,
  ShieldCheck,
  RotateCcw,
  Truck,
  Plus,
  Printer
} from 'lucide-react';
import { FactoryQuotationDocumentModal, FactoryRecordDocumentSpec } from './FactoryQuotationDocumentModal';
import { buildWorkPackageDocSpec, buildTaskDocSpec } from './factoryDocumentBuilders';
import {
  FactoryMasterProfile,
  FactoryWorkPackageAssignment,
  FactoryExecutionTask
} from '../../types/factoryPortal';
import { SecurityUser } from '../../types/security';
import { factoryExecutionService } from '../../services/factoryExecutionService';
import { toast } from 'sonner';

interface FactorySupervisorHubTabProps {
  currentUser: SecurityUser | null;
  factories: FactoryMasterProfile[];
  workPackages: FactoryWorkPackageAssignment[];
  tasks: FactoryExecutionTask[];
  onRefresh: () => void;
}

export const FactorySupervisorHubTab: React.FC<FactorySupervisorHubTabProps> = ({
  currentUser,
  factories,
  workPackages,
  tasks,
  onRefresh
}) => {
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [activeDocSpec, setActiveDocSpec] = useState<FactoryRecordDocumentSpec | null>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskWpId, setTaskWpId] = useState(workPackages[0]?.id || 'fwp-01');
  const [taskPlannedQty, setTaskPlannedQty] = useState(40);
  const [taskTargetDate, setTaskTargetDate] = useState('2026-10-25');

  const handleSupervisorStep = (
    taskId: string,
    action: 'start_progress' | 'submit_qc' | 'approve_qc' | 'request_rework' | 'complete_task' | 'dispatch_task'
  ) => {
    try {
      factoryExecutionService.advanceTaskSupervisorWorkflow(currentUser, taskId, action, 5);
      toast.success('Updated');
      onRefresh();
    } catch (e: any) {
      toast.error(e.message || 'Blocked');
    }
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    const wp = workPackages.find(w => w.id === taskWpId) || workPackages[0];
    factoryExecutionService.saveTask(currentUser, {
      title: taskTitle.trim(),
      orderType: 'Work Order',
      workPackageId: wp?.id || 'fwp-01',
      projectId: wp?.projectId || 'PRJ-2026-001',
      projectName: wp?.projectName || 'PRJ-2026-001',
      factoryId: wp?.factoryId || factories[0]?.id || 'fac-inv-01',
      plannedQuantity: taskPlannedQty,
      unit: wp?.unit || 'Units',
      targetDate: taskTargetDate
    });
    toast.success('Task Added');
    setShowTaskModal(false);
    setTaskTitle('');
    onRefresh();
  };

  return (
    <div className="space-y-4">
      {/* Assigned Projects Row List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-orange-500" />
            <h2 className="text-xs font-bold text-slate-900">Managed Projects ({workPackages.length})</h2>
          </div>
          <button
            onClick={() => setShowTaskModal(true)}
            className="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold flex items-center gap-1 shadow-2xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-semibold text-slate-400">
                <th className="py-2.5 px-4">Code</th>
                <th className="py-2.5 px-4">Project</th>
                <th className="py-2.5 px-4">Factory</th>
                <th className="py-2.5 px-4 text-right">Quantity</th>
                <th className="py-2.5 px-4 text-center">Progress</th>
                <th className="py-2.5 px-4">Deadline</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {workPackages.map(wp => (
                <tr key={wp.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-2.5 px-4 font-mono font-bold text-orange-600 whitespace-nowrap">{wp.packageCode}</td>
                  <td className="py-2.5 px-4 font-bold text-slate-900 whitespace-nowrap">{wp.projectName}</td>
                  <td className="py-2.5 px-4 text-slate-600 whitespace-nowrap">{wp.factoryName}</td>
                  <td className="py-2.5 px-4 text-right font-mono font-semibold text-sky-700 whitespace-nowrap">
                    {wp.completedQuantity}/{wp.plannedQuantity} {wp.unit}
                  </td>
                  <td className="py-2.5 px-4 text-center font-mono font-bold text-emerald-700">{wp.completionPercent}%</td>
                  <td className="py-2.5 px-4 font-mono text-slate-600 whitespace-nowrap">{wp.deadlineDate}</td>
                  <td className="py-2.5 px-4 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded-full bg-sky-50 border border-sky-200/80 text-sky-700 text-[10px] font-bold">
                      {wp.stageStatus}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => setActiveDocSpec(buildWorkPackageDocSpec(wp))}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-[11px] font-semibold inline-flex items-center gap-1"
                    >
                      <Printer className="w-3 h-3" /> Doc
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Managed Tasks Row List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-orange-500" />
            <h2 className="text-xs font-bold text-slate-900">Managed Tasks ({tasks.length})</h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-semibold text-slate-400">
                <th className="py-2.5 px-4">Code</th>
                <th className="py-2.5 px-4">Task</th>
                <th className="py-2.5 px-4">Project</th>
                <th className="py-2.5 px-4 text-right">Qty</th>
                <th className="py-2.5 px-4">Target</th>
                <th className="py-2.5 px-4">Stage</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {tasks.map(t => (
                <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-2.5 px-4 font-mono font-bold text-orange-600 whitespace-nowrap">{t.taskCode}</td>
                  <td className="py-2.5 px-4 font-bold text-slate-900 whitespace-nowrap">{t.title}</td>
                  <td className="py-2.5 px-4 text-slate-600 whitespace-nowrap">{t.projectName}</td>
                  <td className="py-2.5 px-4 text-right font-mono font-semibold text-sky-700 whitespace-nowrap">
                    {t.completedQuantity}/{t.plannedQuantity} {t.unit}
                  </td>
                  <td className="py-2.5 px-4 font-mono text-slate-600 whitespace-nowrap">{t.targetDate}</td>
                  <td className="py-2.5 px-4 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold">
                      {t.stageStatus}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1">
                      <button
                        onClick={() => handleSupervisorStep(t.id, 'start_progress')}
                        className="px-2 py-1 rounded bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 text-[11px] font-semibold inline-flex items-center gap-1"
                      >
                        <Play className="w-3 h-3" /> Start
                      </button>
                      <button
                        onClick={() => handleSupervisorStep(t.id, 'submit_qc')}
                        className="px-2 py-1 rounded bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 text-[11px] font-semibold inline-flex items-center gap-1"
                      >
                        <ShieldCheck className="w-3 h-3" /> Submit
                      </button>
                      <button
                        onClick={() => handleSupervisorStep(t.id, 'request_rework')}
                        className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-[11px] font-semibold inline-flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" /> Rework
                      </button>
                      <button
                        onClick={() => handleSupervisorStep(t.id, 'complete_task')}
                        className="px-2 py-1 rounded bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-semibold"
                      >
                        Done
                      </button>
                      <button
                        onClick={() => handleSupervisorStep(t.id, 'dispatch_task')}
                        className="px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold inline-flex items-center gap-1"
                      >
                        <Truck className="w-3 h-3" /> Dispatch
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveDocSpec(buildTaskDocSpec(t))}
                        className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-[11px] font-semibold inline-flex items-center gap-1"
                      >
                        <Printer className="w-3 h-3" /> Doc
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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

      {showTaskModal && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
              <h3 className="text-sm font-bold text-slate-900">Add Task</h3>
              <button
                onClick={() => setShowTaskModal(false)}
                className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-xs font-semibold"
              >
                Close
              </button>
            </div>
            <form onSubmit={handleCreateTask} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Project</label>
                <select
                  value={taskWpId}
                  onChange={e => setTaskWpId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                >
                  {workPackages.map(w => (
                    <option key={w.id} value={w.id}>{w.packageCode} — {w.projectName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Task</label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={e => setTaskTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    value={taskPlannedQty}
                    onChange={e => setTaskPlannedQty(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Date</label>
                  <input
                    type="date"
                    value={taskTargetDate}
                    onChange={e => setTaskTargetDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
