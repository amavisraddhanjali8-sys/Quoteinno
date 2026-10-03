import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, ShieldAlert, CheckCircle, Zap
} from 'lucide-react';
import { centralApiGateway } from '../../../services/centralApiGateway';
import { OperationalTask, WorkCenter } from '../../../types/operationalControl';
import { useSecurity } from '../../../context/SecurityContext';
import { RoleScopedFactoryProjectHub } from './RoleScopedFactoryProjectHub';

export const ShopFloorPortal: React.FC = () => {
  const { currentUser } = useSecurity();
  const [workCenters, setWorkCenters] = useState<WorkCenter[]>([]);
  const [selectedStationId, setSelectedStationId] = useState<string>('wc-weld-01');
  const [tasks, setTasks] = useState<OperationalTask[]>([]);
  const [activeTask, setActiveTask] = useState<OperationalTask | null>(null);
  const [goodCounter, setGoodCounter] = useState<number>(0);
  const [scrapCounter, setScrapCounter] = useState<number>(0);
  const [isEmergencyOpen, setIsEmergencyOpen] = useState<boolean>(false);
  const [emergencyReason, setEmergencyReason] = useState<string>('');
  const [safetyChecks, setSafetyChecks] = useState<Record<string, boolean>>({
    ppe: true,
    calibration: true,
    gasPressure: true
  });

  useEffect(() => {
    try {
      const wcs = centralApiGateway.getWorkCenters(currentUser);
      setWorkCenters(wcs);
      const allTasks = centralApiGateway.getShopFloorTasks(currentUser, selectedStationId);
      setTasks(allTasks);
      if (allTasks.length > 0) {
        setActiveTask(allTasks[0]);
        setGoodCounter(allTasks[0].quantityCompleted);
        setScrapCounter(allTasks[0].quantityScrapped);
      }
    } catch (e) {
      console.error(e);
    }
  }, [currentUser, selectedStationId]);

  const handleStationChange = (id: string) => {
    setSelectedStationId(id);
    const stationTasks = centralApiGateway.getShopFloorTasks(currentUser, id);
    setTasks(stationTasks);
    if (stationTasks.length > 0) {
      setActiveTask(stationTasks[0]);
      setGoodCounter(stationTasks[0].quantityCompleted);
      setScrapCounter(stationTasks[0].quantityScrapped);
    } else {
      setActiveTask(null);
    }
  };

  const handlePieceUpdate = (deltaGood: number, deltaScrap: number) => {
    if (!activeTask) return;
    try {
      const updated = centralApiGateway.updateTaskProgress(
        currentUser,
        activeTask.id,
        deltaGood,
        deltaScrap,
        deltaGood > 0 ? 0.25 : 0
      );
      setGoodCounter(updated.quantityCompleted);
      setScrapCounter(updated.quantityScrapped);
      setActiveTask(updated);
      setTasks(tasks.map(t => t.id === updated.id ? updated : t));
    } catch (err: any) {
      alert(err.message || 'Error updating piece count');
    }
  };

  const handleEmergencyStop = () => {
    if (!emergencyReason.trim()) {
      alert('Please enter a brief cause for halting the line');
      return;
    }
    try {
      const station = workCenters.find(w => w.id === selectedStationId);
      centralApiGateway.triggerQualityAlert(
        currentUser,
        `LINE STOP: ${emergencyReason}`,
        station?.name || 'Workshop Station',
        emergencyReason,
        true
      );
      alert('EMERGENCY STOP TRIGGERED. Station halted. QA notified.');
      setIsEmergencyOpen(false);
      setEmergencyReason('');
    } catch (err: any) {
      alert(err.message || 'Failed to trigger emergency stop');
    }
  };

  const activeStation = workCenters.find(w => w.id === selectedStationId) || workCenters[0];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <RoleScopedFactoryProjectHub
        portalName="Shop Floor & Factory Supervisor Execution Terminal"
        defaultSubTab="supervisors"
      />
      {/* High-Contrast Shop Floor Header */}
      <div className="bg-slate-950 text-white p-5 rounded-2xl border-2 border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-0.5 rounded-full text-xs font-black bg-amber-400 text-slate-950 tracking-wide uppercase">
              Shop Floor Terminal
            </span>
            <span className="text-xs text-slate-400">Touch-Optimized Operator Console</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <Zap className="w-6 h-6 text-amber-400" />
            {activeStation?.name || 'Active Workstation'}
          </h2>
          <div className="text-xs text-slate-400 mt-1">
            Operator On Duty: <strong className="text-slate-200">{currentUser?.fullName}</strong> ({currentUser?.roleName})
          </div>
        </div>

        {/* Station Picker (Oversized touch pills) */}
        <div className="flex flex-wrap items-center gap-2">
          {workCenters.map(wc => (
            <button
              key={wc.id}
              onClick={() => handleStationChange(wc.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${selectedStationId === wc.id ? 'bg-amber-400 text-slate-950 shadow-md scale-105' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'}`}
            >
              {wc.code}
            </button>
          ))}
        </div>
      </div>

      {/* EMERGENCY ANDON LINE-STOP BUTTON */}
      <div className="flex justify-center">
        <button
          onClick={() => setIsEmergencyOpen(true)}
          className="w-full py-4 px-6 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black text-lg rounded-2xl shadow-lg border-2 border-red-400 flex items-center justify-center gap-3 active:scale-98 transition-all tracking-wider uppercase"
        >
          <ShieldAlert className="w-7 h-7 animate-pulse text-white" />
          EMERGENCY / QUALITY ALERT LINE STOP
        </button>
      </div>

      {/* Emergency Stop Modal */}
      {isEmergencyOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-red-500 p-6 rounded-2xl max-w-md w-full text-white space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <ShieldAlert className="w-8 h-8" />
              <h3 className="text-xl font-black">CONFIRM LINE HALT</h3>
            </div>
            <p className="text-xs text-slate-300">
              This will immediately halt operations on this work station, flag an unyielding QA inspection hold, and alert the Operations Manager.
            </p>
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">State Incident / Defect Description:</label>
              <textarea
                value={emergencyReason}
                onChange={e => setEmergencyReason(e.target.value)}
                rows={3}
                placeholder="e.g. Critical crack detected on weld seam, torch shielding gas dropped to zero, or dimensional deviation beyond tolerance."
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
              />
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleEmergencyStop}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl uppercase tracking-wider"
              >
                Trigger Stop Line
              </button>
              <button
                onClick={() => setIsEmergencyOpen(false)}
                className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm rounded-xl"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Job Card & Massive Touch Counters */}
      {activeTask ? (
        <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-md p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-slate-900 text-white font-mono font-black text-sm rounded-xl">
                  {activeTask.taskNumber}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${activeTask.priority === 'Critical' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
                  {activeTask.priority} Priority
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
                  {activeTask.status}
                </span>
              </div>
              <h3 className="text-xl font-black text-slate-900 mt-2">
                {activeTask.title}
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                {activeTask.description}
              </p>
            </div>

            <div className="text-right">
              <div className="text-xs text-slate-400">Target Production</div>
              <div className="text-2xl font-black text-slate-900">{activeTask.quantityPlanned} PCS</div>
            </div>
          </div>

          {/* Huge Touch Counters (Good vs Scrap) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Good Parts Counter */}
            <div className="bg-emerald-50/70 border-2 border-emerald-300 rounded-2xl p-6 text-center space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center justify-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                Good Verified Pieces
              </div>
              <div className="text-6xl font-black text-emerald-950 font-mono">
                {goodCounter}
              </div>
              <div className="flex items-center justify-center gap-4 pt-2">
                <button
                  onClick={() => handlePieceUpdate(1, 0)}
                  className="w-24 h-16 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-2xl rounded-2xl shadow-md flex items-center justify-center transition-all"
                >
                  +1
                </button>
                <button
                  onClick={() => handlePieceUpdate(5, 0)}
                  className="w-24 h-16 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-black text-2xl rounded-2xl shadow-md flex items-center justify-center transition-all"
                >
                  +5
                </button>
              </div>
            </div>

            {/* Scrap / Reject Counter */}
            <div className="bg-rose-50/70 border-2 border-rose-300 rounded-2xl p-6 text-center space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-rose-800 flex items-center justify-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Scrap / Defective Pieces
              </div>
              <div className="text-6xl font-black text-rose-950 font-mono">
                {scrapCounter}
              </div>
              <div className="flex items-center justify-center gap-4 pt-2">
                <button
                  onClick={() => handlePieceUpdate(0, 1)}
                  className="w-24 h-16 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-black text-2xl rounded-2xl shadow-md flex items-center justify-center transition-all"
                >
                  +1
                </button>
                <button
                  onClick={() => handlePieceUpdate(0, -1)}
                  disabled={scrapCounter <= 0}
                  className="w-24 h-16 bg-slate-200 hover:bg-slate-300 disabled:opacity-40 text-slate-700 font-bold text-xl rounded-2xl flex items-center justify-center transition-all"
                >
                  -1
                </button>
              </div>
            </div>
          </div>

          {/* Quick Pre-Operation Safety & Shift Checklist */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-2">
              Mandatory Shift Pre-Flight Safety Verification:
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <label className="flex items-center gap-2 p-3 bg-white rounded-xl border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={safetyChecks.ppe}
                  onChange={e => setSafetyChecks({ ...safetyChecks, ppe: e.target.checked })}
                  className="w-4 h-4 accent-amber-600"
                />
                <span className="font-semibold text-slate-800">Operator PPE & Helmet Active</span>
              </label>

              <label className="flex items-center gap-2 p-3 bg-white rounded-xl border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={safetyChecks.calibration}
                  onChange={e => setSafetyChecks({ ...safetyChecks, calibration: e.target.checked })}
                  className="w-4 h-4 accent-amber-600"
                />
                <span className="font-semibold text-slate-800">Machine Zero & Nozzle Verified</span>
              </label>

              <label className="flex items-center gap-2 p-3 bg-white rounded-xl border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={safetyChecks.gasPressure}
                  onChange={e => setSafetyChecks({ ...safetyChecks, gasPressure: e.target.checked })}
                  className="w-4 h-4 accent-amber-600"
                />
                <span className="font-semibold text-slate-800">Shielding Gas Pressure Nominal</span>
              </label>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
          No active job cards scheduled for {activeStation?.name}.
        </div>
      )}

      {/* Dispatched Station Queue */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <h4 className="text-sm font-bold text-slate-900">Workstation Dispatched Queue ({tasks.length})</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {tasks.map(t => (
            <div
              key={t.id}
              onClick={() => {
                setActiveTask(t);
                setGoodCounter(t.quantityCompleted);
                setScrapCounter(t.quantityScrapped);
              }}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${activeTask?.id === t.id ? 'border-amber-500 bg-amber-50/50' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
            >
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="font-mono text-slate-900">{t.taskNumber}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] ${t.status === 'Done' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>
                  {t.status}
                </span>
              </div>
              <div className="text-xs font-semibold text-slate-800 mt-1 truncate">{t.title}</div>
              <div className="text-[11px] text-slate-500 mt-2">
                Target: {t.quantityPlanned} PCS • Done: {t.quantityCompleted}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
