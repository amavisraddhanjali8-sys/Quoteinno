import React, { useState } from 'react';
import {
  Plus,
  FileCheck,
  AlertTriangle,
  ExternalLink,
  Printer,
  X
} from 'lucide-react';
import {
  EquipmentMasterAsset,
  OperatorAuthorization,
  AllocationHandoverRecord,
  DailyUsageFuelLog,
  SparePartTireItem,
  MaintenanceWorkOrder
} from '../../services/equipmentControlService';
import { Project } from '../../types';
import { cn } from '../../lib/utils';

interface AllocationModuleProps {
  assets: EquipmentMasterAsset[];
  operators: OperatorAuthorization[];
  allocations: AllocationHandoverRecord[];
  projects: Project[];
  onCreateAllocation: (rec: Omit<AllocationHandoverRecord, 'id' | 'recordNo'>) => void;
  onNavigatePortal?: (portalView: string, subTab?: string) => void;
}

export const EquipmentAllocationModule: React.FC<AllocationModuleProps> = ({
  assets,
  operators,
  allocations,
  projects,
  onCreateAllocation,
  onNavigatePortal
}) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedCert, setSelectedCert] = useState<AllocationHandoverRecord | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [form, setForm] = useState({
    type: 'Handover' as AllocationHandoverRecord['type'],
    equipmentId: assets[0]?.equipmentId || 'EX-024',
    fromLocation: 'Central Plant Yard',
    toLocation: 'Sirius Mall Site',
    projectCode: projects[0]?.projectCode || 'PRJ-SIRIUS-02',
    projectName: projects[0]?.projectName || 'Sirius Mall Facade & Civil',
    fromCustodian: 'Yard Master Mendis',
    toCustodian: 'Site Engineer',
    operatorId: operators[0]?.operatorId || 'OP-101',
    meterReading: assets[0]?.currentMeter || 1000,
    fuelLevelPercent: 100,
    condition: 'Good - Checked before dispatch',
    transportVehicle: 'Low-Bed Trailer WP-LP-8890',
    transportCost: 25000,
    accessoriesChecked: 'Standard attachments, manual, safety kit',
    approvedBy: 'Operations Manager'
  });

  const todayStr = new Date().toISOString().split('T')[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const selectedAsset = assets.find(a => a.equipmentId === form.equipmentId);
    const selectedOp = operators.find(o => o.operatorId === form.operatorId);

    // Control 1: Block if calibration expired
    if (selectedAsset?.calibrationStatus === 'Expired') {
      setErrorMsg(`Blocked: ${selectedAsset.equipmentId} calibration expired on ${selectedAsset.calibrationDue}. Renew calibration before site dispatch.`);
      return;
    }

    // Control 2: Block if operator license expired
    if (selectedOp && selectedOp.licenseExpiry < todayStr) {
      setErrorMsg(`Blocked: Operator ${selectedOp.operatorName} license (${selectedOp.licenseNo}) expired on ${selectedOp.licenseExpiry}. Choose a certified operator.`);
      return;
    }

    onCreateAllocation({
      type: form.type,
      equipmentId: form.equipmentId,
      equipmentName: selectedAsset?.name || form.equipmentId,
      fromLocation: form.fromLocation,
      toLocation: form.toLocation,
      projectCode: form.projectCode,
      projectName: form.projectName,
      fromCustodian: form.fromCustodian,
      toCustodian: form.toCustodian,
      operatorName: selectedOp?.operatorName || 'Assigned Operator',
      date: todayStr,
      meterReading: Number(form.meterReading),
      fuelLevelPercent: Number(form.fuelLevelPercent),
      condition: form.condition,
      transportVehicle: form.transportVehicle,
      transportCost: Number(form.transportCost) || 0,
      accessoriesChecked: form.accessoriesChecked,
      approvedBy: form.approvedBy,
      status: form.type === 'Return' || form.type === 'Demobilization' ? 'Returned' : 'Active'
    });
    setShowModal(false);
  };

  return (
    <div className="space-y-3 text-xs">
      {/* Top Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Site Allocation, Mobilization, Transfer & Handover</h3>
          <p className="text-xs text-slate-500">
            Track where every machine is deployed, custody handovers, transport, and operator license checks.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {onNavigatePortal && (
            <button
              type="button"
              onClick={() => onNavigatePortal('resource-management', 'certifications')}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <span>Operator Licenses</span>
              <ExternalLink size={12} />
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setErrorMsg(null);
              setShowModal(true);
            }}
            className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Plus size={13} />
            <span>New Allocation / Handover</span>
          </button>
        </div>
      </div>

      {/* Operator Authorization Control Strip */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5">
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-slate-800">Operator Authorization & Safety Lock Status</span>
          <span className="text-[11px] text-slate-400">Expired operator license automatically blocks machine allocation</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {operators.map(op => {
            const expired = op.licenseExpiry < todayStr;
            return (
              <div key={op.id} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/60 flex items-center justify-between">
                <div className="min-w-0">
                  <div className="font-semibold text-slate-900 truncate">{op.operatorName}</div>
                  <div className="text-[11px] text-slate-500 truncate">{op.licenseCategory}</div>
                  <div className="text-[10px] font-mono text-slate-400">Exp: {op.licenseExpiry}</div>
                </div>
                <span className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded",
                  expired ? "bg-rose-50 text-rose-700 border border-rose-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                )}>
                  {expired ? 'Blocked' : 'Authorized'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Allocation & Handover Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                <th className="py-2.5 px-3">Cert / Ref</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Machine</th>
                <th className="py-2.5 px-3">From → To Location</th>
                <th className="py-2.5 px-3">Project</th>
                <th className="py-2.5 px-3">Custody (From → To)</th>
                <th className="py-2.5 px-3">Operator</th>
                <th className="py-2.5 px-3">Meter & Fuel</th>
                <th className="py-2.5 px-3 text-right">Certificate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allocations.map(rec => (
                <tr key={rec.id} className="hover:bg-slate-50/70 whitespace-nowrap">
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{rec.recordNo}</td>
                  <td className="py-2.5 px-3 font-semibold text-orange-600">{rec.type}</td>
                  <td className="py-2.5 px-3">
                    <span className="font-mono font-bold text-slate-900">{rec.equipmentId}</span>
                    <span className="text-slate-400 mx-1">·</span>
                    <span className="text-slate-700">{rec.equipmentName}</span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">
                    {rec.fromLocation} → <strong className="text-slate-900">{rec.toLocation}</strong>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-blue-600 font-semibold">{rec.projectCode}</td>
                  <td className="py-2.5 px-3 text-slate-600">
                    {rec.fromCustodian} → <strong className="text-slate-900">{rec.toCustodian}</strong>
                  </td>
                  <td className="py-2.5 px-3 font-medium text-slate-800">{rec.operatorName}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-600">
                    {rec.meterReading.toLocaleString()}h · {rec.fuelLevelPercent}%
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedCert(rec)}
                      className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <FileCheck size={11} />
                      <span>Handover Cert</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Handover Certificate Preview Modal */}
      {selectedCert && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-orange-400 uppercase">Official Custody Document</span>
                <h3 className="text-sm font-bold">Machine Handover Certificate · {selectedCert.recordNo}</h3>
              </div>
              <button onClick={() => setSelectedCert(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X size={16} />
              </button>
            </div>
            <div className="p-5 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-slate-400 block">Equipment</span>
                  <span className="font-bold text-slate-900">{selectedCert.equipmentId} · {selectedCert.equipmentName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Date & Type</span>
                  <span className="font-bold text-slate-900 font-mono">{selectedCert.date} ({selectedCert.type})</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Handed Over By</span>
                  <span className="font-semibold text-slate-800">{selectedCert.fromCustodian} ({selectedCert.fromLocation})</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Received By</span>
                  <span className="font-semibold text-slate-800">{selectedCert.toCustodian} ({selectedCert.toLocation})</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Meter & Fuel Level</span>
                  <span className="font-mono font-semibold text-slate-900">{selectedCert.meterReading} hrs · Fuel {selectedCert.fuelLevelPercent}%</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Assigned Operator</span>
                  <span className="font-semibold text-slate-900">{selectedCert.operatorName}</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-slate-500">Physical Condition: <strong className="text-slate-900">{selectedCert.condition}</strong></p>
                <p className="text-slate-500">Accessories & Tools Verified: <strong className="text-slate-900">{selectedCert.accessoriesChecked}</strong></p>
                <p className="text-slate-500">Transport Vehicle: <strong className="text-slate-900">{selectedCert.transportVehicle || 'N/A'} (LKR {selectedCert.transportCost.toLocaleString()})</strong></p>
                <p className="text-slate-500">Approved By: <strong className="text-emerald-700">{selectedCert.approvedBy}</strong></p>
              </div>
              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer size={12} />
                  <span>Print Certificate</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Allocation / Handover Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Record Allocation, Transfer or Handover</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-3 text-xs">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold flex items-start gap-2">
                  <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Action Type</label>
                  <select
                    value={form.type}
                    onChange={e => setForm({ ...form, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="Allocation">Site Allocation</option>
                    <option value="Mobilization">Mobilization to Site</option>
                    <option value="Handover">Custody Handover</option>
                    <option value="Transfer">Site-to-Site Transfer</option>
                    <option value="Demobilization">Demobilization</option>
                    <option value="Return">Return to Yard</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Select Machine</label>
                  <select
                    value={form.equipmentId}
                    onChange={e => {
                      const eq = assets.find(a => a.equipmentId === e.target.value);
                      setForm({
                        ...form,
                        equipmentId: e.target.value,
                        meterReading: eq?.currentMeter || form.meterReading,
                        fromLocation: eq?.location || form.fromLocation
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  >
                    {assets.map(a => (
                      <option key={a.id} value={a.equipmentId}>
                        {a.equipmentId} - {a.name.slice(0, 26)} ({a.calibrationStatus === 'Expired' ? 'CAL EXPIRED' : a.lifecycleState})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assign Operator (Checks License)</label>
                  <select
                    value={form.operatorId}
                    onChange={e => setForm({ ...form, operatorId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  >
                    {operators.map(o => (
                      <option key={o.id} value={o.operatorId}>
                        {o.operatorName} ({o.licenseExpiry < todayStr ? 'EXPIRED LICENSE' : 'Valid'})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Project</label>
                  <input
                    type="text"
                    value={form.projectCode}
                    onChange={e => setForm({ ...form, projectCode: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">From Location</label>
                  <input
                    type="text"
                    value={form.fromLocation}
                    onChange={e => setForm({ ...form, fromLocation: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">To Site / Location</label>
                  <input
                    type="text"
                    value={form.toLocation}
                    onChange={e => setForm({ ...form, toLocation: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Meter Reading</label>
                  <input
                    type="number"
                    value={form.meterReading}
                    onChange={e => setForm({ ...form, meterReading: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Fuel Level (%)</label>
                  <input
                    type="number"
                    value={form.fuelLevelPercent}
                    onChange={e => setForm({ ...form, fuelLevelPercent: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Transport (LKR)</label>
                  <input
                    type="number"
                    value={form.transportCost}
                    onChange={e => setForm({ ...form, transportCost: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Accessories & Condition Notes</label>
                <input
                  type="text"
                  value={form.accessoriesChecked}
                  onChange={e => setForm({ ...form, accessoriesChecked: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-1.5 border border-slate-200 rounded-lg text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold cursor-pointer"
                >
                  Confirm & Issue Handover
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// TAB 3: DAILY LOG, HOUR METER & FUEL MODULE
// ============================================================================
interface OperationsModuleProps {
  assets: EquipmentMasterAsset[];
  dailyLogs: DailyUsageFuelLog[];
  onAddDailyLog: (log: Omit<DailyUsageFuelLog, 'id' | 'logNo'>) => void;
}

export const EquipmentOperationsModule: React.FC<OperationsModuleProps> = ({
  assets,
  dailyLogs,
  onAddDailyLog
}) => {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    equipmentId: assets[0]?.equipmentId || 'EX-024',
    projectCode: assets[0]?.projectCode || 'PRJ-SIRIUS-02',
    operatorName: assets[0]?.assignedOperatorName || 'Nimal Bandara',
    openingMeter: assets[0]?.currentMeter || 3480,
    closingMeter: (assets[0]?.currentMeter || 3480) + 8,
    idleHours: 1,
    breakdownHours: 0,
    fuelLitres: 115,
    fuelCostLKR: 37950,
    lubricantNotes: 'Routine grease check',
    lubricantCostLKR: 0,
    workPerformed: 'Site earthwork & lifting operations'
  });

  const totalHoursLogged = dailyLogs.reduce((s, l) => s + l.operatingHours, 0);
  const totalFuelLitres = dailyLogs.reduce((s, l) => s + l.fuelLitres, 0);
  const totalFuelCost = dailyLogs.reduce((s, l) => s + l.fuelCostLKR + l.lubricantCostLKR, 0);
  const abnormalAlerts = dailyLogs.filter(l => l.abnormalFuelFlag).length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const asset = assets.find(a => a.equipmentId === form.equipmentId);
    const opHours = Math.max(1, Number(form.closingMeter) - Number(form.openingMeter));
    const lPerHr = opHours > 0 ? Math.round((Number(form.fuelLitres) / opHours) * 10) / 10 : 0;
    const expected = asset?.expectedFuelLPerHr || 16;
    const abnormal = expected > 0 && lPerHr > expected * 1.2;

    onAddDailyLog({
      date: new Date().toISOString().split('T')[0],
      equipmentId: form.equipmentId,
      equipmentName: asset?.name || form.equipmentId,
      projectCode: form.projectCode,
      projectName: asset?.projectName || form.projectCode,
      operatorName: form.operatorName,
      openingMeter: Number(form.openingMeter),
      closingMeter: Number(form.closingMeter),
      operatingHours: opHours,
      idleHours: Number(form.idleHours) || 0,
      breakdownHours: Number(form.breakdownHours) || 0,
      fuelLitres: Number(form.fuelLitres) || 0,
      fuelCostLKR: Number(form.fuelCostLKR) || 0,
      lubricantNotes: form.lubricantNotes,
      lubricantCostLKR: Number(form.lubricantCostLKR) || 0,
      workPerformed: form.workPerformed,
      litresPerHour: lPerHr,
      abnormalFuelFlag: abnormal
    });
    setShowModal(false);
  };

  return (
    <div className="space-y-3 text-xs">
      {/* Summary Strip */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <span className="text-slate-400 block">Operating Hours</span>
            <span className="text-sm font-bold text-slate-900 font-mono">{totalHoursLogged} hrs</span>
          </div>
          <div className="h-6 w-px bg-slate-200" />
          <div>
            <span className="text-slate-400 block">Diesel Issued</span>
            <span className="text-sm font-bold text-slate-900 font-mono">{totalFuelLitres} L</span>
          </div>
          <div className="h-6 w-px bg-slate-200" />
          <div>
            <span className="text-slate-400 block">Fuel & Lube Cost</span>
            <span className="text-sm font-bold text-slate-900 font-mono">LKR {totalFuelCost.toLocaleString()}</span>
          </div>
          <div className="h-6 w-px bg-slate-200" />
          <div>
            <span className="text-slate-400 block">Consumption Alerts</span>
            <span className={cn("text-sm font-bold font-mono", abnormalAlerts > 0 ? "text-rose-600" : "text-emerald-600")}>
              {abnormalAlerts} Abnormal
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Plus size={13} />
          <span>Log Meter & Fuel</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                <th className="py-2.5 px-3">Log # / Date</th>
                <th className="py-2.5 px-3">Machine</th>
                <th className="py-2.5 px-3">Project</th>
                <th className="py-2.5 px-3">Operator</th>
                <th className="py-2.5 px-3">Open → Close Meter</th>
                <th className="py-2.5 px-3">Work / Idle Hrs</th>
                <th className="py-2.5 px-3">Fuel & Rate</th>
                <th className="py-2.5 px-3">Fuel + Lube Cost</th>
                <th className="py-2.5 px-3">Work Performed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dailyLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/70 whitespace-nowrap">
                  <td className="py-2.5 px-3 font-mono">
                    <span className="font-bold text-slate-900">{log.logNo}</span>
                    <span className="text-slate-400 ml-1.5">{log.date}</span>
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{log.equipmentId}</td>
                  <td className="py-2.5 px-3 font-mono text-blue-600 font-semibold">{log.projectCode}</td>
                  <td className="py-2.5 px-3 text-slate-700">{log.operatorName}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-700">
                    {log.openingMeter.toLocaleString()}h → <strong className="text-slate-900">{log.closingMeter.toLocaleString()}h</strong>
                  </td>
                  <td className="py-2.5 px-3 font-mono">
                    <span className="font-bold text-emerald-700">{log.operatingHours}h run</span>
                    <span className="text-slate-400"> · {log.idleHours}h idle</span>
                  </td>
                  <td className="py-2.5 px-3 font-mono">
                    {log.fuelLitres > 0 ? (
                      <span className={cn(log.abnormalFuelFlag ? "text-rose-600 font-bold" : "text-slate-800")}>
                        {log.fuelLitres}L ({log.litresPerHour} L/h) {log.abnormalFuelFlag && '⚠ High'}
                      </span>
                    ) : (
                      <span className="text-slate-400">Electric / Pneumatic</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-semibold text-slate-900">
                    LKR {(log.fuelCostLKR + log.lubricantCostLKR).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate" title={log.workPerformed}>
                    {log.workPerformed}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Daily Log Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Log Daily Meter Hours & Fuel</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Machine</label>
                  <select
                    value={form.equipmentId}
                    onChange={e => {
                      const a = assets.find(x => x.equipmentId === e.target.value);
                      setForm({
                        ...form,
                        equipmentId: e.target.value,
                        projectCode: a?.projectCode || form.projectCode,
                        operatorName: a?.assignedOperatorName || form.operatorName,
                        openingMeter: a?.currentMeter || 0,
                        closingMeter: (a?.currentMeter || 0) + 8
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  >
                    {assets.map(a => (
                      <option key={a.id} value={a.equipmentId}>{a.equipmentId} - {a.name.slice(0, 26)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Operator</label>
                  <input
                    type="text"
                    value={form.operatorName}
                    onChange={e => setForm({ ...form, operatorName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Opening Meter</label>
                  <input
                    type="number"
                    value={form.openingMeter}
                    onChange={e => setForm({ ...form, openingMeter: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Closing Meter</label>
                  <input
                    type="number"
                    value={form.closingMeter}
                    onChange={e => setForm({ ...form, closingMeter: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Idle Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    value={form.idleHours}
                    onChange={e => setForm({ ...form, idleHours: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Fuel (Litres)</label>
                  <input
                    type="number"
                    value={form.fuelLitres}
                    onChange={e => setForm({ ...form, fuelLitres: Number(e.target.value), fuelCostLKR: Number(e.target.value) * 330 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Fuel Cost (LKR)</label>
                  <input
                    type="number"
                    value={form.fuelCostLKR}
                    onChange={e => setForm({ ...form, fuelCostLKR: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Lube Cost (LKR)</label>
                  <input
                    type="number"
                    value={form.lubricantCostLKR}
                    onChange={e => setForm({ ...form, lubricantCostLKR: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Work Performed</label>
                <input
                  type="text"
                  required
                  value={form.workPerformed}
                  onChange={e => setForm({ ...form, workPerformed: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-1.5 border border-slate-200 rounded-lg text-slate-600">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold cursor-pointer">
                  Save Daily Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// TAB 6: SPARE PARTS, TIRES, PROJECT COST (TCO) & KPIs MODULE
// ============================================================================
interface PartsCostModuleProps {
  assets: EquipmentMasterAsset[];
  parts: SparePartTireItem[];
  dailyLogs: DailyUsageFuelLog[];
  workOrders: MaintenanceWorkOrder[];
  onIssuePart: (partId: string, equipmentId: string) => void;
  onNavigatePortal?: (portalView: string, subTab?: string) => void;
}

export const EquipmentPartsCostModule: React.FC<PartsCostModuleProps> = ({
  assets,
  parts,
  dailyLogs,
  workOrders,
  onIssuePart,
  onNavigatePortal
}) => {
  const [subView, setSubView] = useState<'cost_tco' | 'parts_tires'>('cost_tco');

  // Compute Fleet KPIs
  const totalFleetValue = assets.reduce((s, a) => s + a.purchasePrice, 0);
  const operatingAssets = assets.filter(a => a.lifecycleState === 'Operating' || a.lifecycleState === 'Allocated').length;
  const availableAssets = assets.filter(a => a.lifecycleState === 'Available' || a.lifecycleState === 'Operating' || a.lifecycleState === 'Allocated').length;
  const utilizationPct = assets.length > 0 ? Math.round((operatingAssets / assets.length) * 100) : 0;
  const availabilityPct = assets.length > 0 ? Math.round((availableAssets / assets.length) * 100) : 0;

  return (
    <div className="space-y-3 text-xs">
      {/* Sub-Switch & Cross-Portal Links */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSubView('cost_tco')}
            className={cn(
              "px-3 py-1.5 rounded-lg font-semibold cursor-pointer transition-colors",
              subView === 'cost_tco' ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            )}
          >
            1. Machine Cost (TCO), Project Charge & KPIs
          </button>
          <button
            type="button"
            onClick={() => setSubView('parts_tires')}
            className={cn(
              "px-3 py-1.5 rounded-lg font-semibold cursor-pointer transition-colors",
              subView === 'parts_tires' ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            )}
          >
            2. Spare Parts, Tires & Batteries ({parts.length})
          </button>
        </div>

        {onNavigatePortal && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => onNavigatePortal('procurement', 'pr')}
              className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-lg font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>Order Low-Stock Spares (Procurement)</span>
              <ExternalLink size={11} />
            </button>
            <button
              type="button"
              onClick={() => onNavigatePortal('post-evaluation')}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>Project Cost Variance</span>
              <ExternalLink size={11} />
            </button>
          </div>
        )}
      </div>

      {subView === 'cost_tco' && (
        <>
          {/* Fleet KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-white border border-slate-200 rounded-xl p-3">
              <span className="text-slate-400 block">Fleet Capital Value</span>
              <span className="text-sm font-bold text-slate-900 font-mono">LKR {(totalFleetValue / 1000000).toFixed(1)}M</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3">
              <span className="text-slate-400 block">Fleet Availability</span>
              <span className="text-sm font-bold text-emerald-600 font-mono">{availabilityPct}% Ready</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3">
              <span className="text-slate-400 block">Active Utilization</span>
              <span className="text-sm font-bold text-blue-600 font-mono">{utilizationPct}% Active</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3">
              <span className="text-slate-400 block">Reliability (MTBF)</span>
              <span className="text-sm font-bold text-slate-900 font-mono">410 hrs</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3">
              <span className="text-slate-400 block">Mean Repair (MTTR)</span>
              <span className="text-sm font-bold text-slate-900 font-mono">4.8 hrs</span>
            </div>
          </div>

          {/* Machine Cost & Project Charge Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="font-bold text-slate-900">Machine Cost Breakdown, Internal Project Charge & Decision Support</span>
              <span className="text-[11px] text-slate-500">Traces Acquisition + Fuel + Maintenance + Internal Charge per Project</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/60 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    <th className="py-2.5 px-3">Machine</th>
                    <th className="py-2.5 px-3">Project</th>
                    <th className="py-2.5 px-3">Meter Hrs</th>
                    <th className="py-2.5 px-3">Purchase / Book</th>
                    <th className="py-2.5 px-3">Fuel Cost</th>
                    <th className="py-2.5 px-3">Maint & Parts</th>
                    <th className="py-2.5 px-3">Internal Rate</th>
                    <th className="py-2.5 px-3">Decision Insight</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {assets.map(a => {
                    const fuelCost = dailyLogs
                      .filter(l => l.equipmentId === a.equipmentId)
                      .reduce((s, l) => s + l.fuelCostLKR + l.lubricantCostLKR, 0);
                    const maintCost = workOrders
                      .filter(w => w.equipmentId === a.equipmentId)
                      .reduce((s, w) => s + w.totalCostLKR, 0);
                    const highMaint = maintCost > 40000;

                    return (
                      <tr key={a.id} className="hover:bg-slate-50/70 whitespace-nowrap">
                        <td className="py-2.5 px-3">
                          <span className="font-mono font-bold text-slate-900">{a.equipmentId}</span>
                          <span className="text-slate-400 mx-1">·</span>
                          <span className="text-slate-700">{a.name}</span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-blue-600 font-semibold">{a.projectCode}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-700">{a.currentMeter.toLocaleString()} h</td>
                        <td className="py-2.5 px-3 font-mono text-slate-700">
                          {a.ownershipType === 'Rented' ? (
                            <span className="text-amber-700">Rented (LKR {a.rentalDailyRate?.toLocaleString()}/day)</span>
                          ) : (
                            <span>LKR {(a.purchasePrice / 1000000).toFixed(1)}M / {(a.bookValue / 1000000).toFixed(1)}M</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-800">LKR {fuelCost.toLocaleString()}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-800">LKR {maintCost.toLocaleString()}</td>
                        <td className="py-2.5 px-3 font-mono font-semibold text-slate-900">LKR {a.internalHourlyRate.toLocaleString()}/hr</td>
                        <td className="py-2.5 px-3">
                          <span className={cn(
                            "text-[11px] font-semibold",
                            highMaint ? "text-amber-700" : a.ownershipType === 'Rented' ? "text-blue-700" : "text-emerald-700"
                          )}>
                            {highMaint ? 'High Repair Cost Watch' : a.ownershipType === 'Rented' ? 'Evaluate Own vs Rent' : 'Optimal Cost/Hr'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {subView === 'parts_tires' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="font-bold text-slate-900">Spare Parts, Tires & Batteries Ledger</span>
            <span className="text-[11px] text-slate-500">Issue directly to a machine & log to its permanent history</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/60 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                  <th className="py-2.5 px-3">Part / Serial #</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Item Name</th>
                  <th className="py-2.5 px-3">Compatible Machine</th>
                  <th className="py-2.5 px-3">Stock / Min</th>
                  <th className="py-2.5 px-3">Unit Cost</th>
                  <th className="py-2.5 px-3">Supplier</th>
                  <th className="py-2.5 px-3 text-right">Quick Issue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {parts.map(pt => {
                  const low = pt.stockQty <= pt.minStockQty;
                  return (
                    <tr key={pt.id} className="hover:bg-slate-50/70 whitespace-nowrap">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{pt.partNo}</td>
                      <td className="py-2.5 px-3 text-slate-600 font-medium">{pt.category}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{pt.name}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{pt.compatibleEquipment}</td>
                      <td className="py-2.5 px-3 font-mono">
                        <span className={cn("font-bold", low ? "text-rose-600" : "text-emerald-700")}>
                          {pt.stockQty}
                        </span>
                        <span className="text-slate-400"> / min {pt.minStockQty}</span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-800">LKR {pt.unitCostLKR.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-slate-600">{pt.supplier}</td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          disabled={pt.stockQty <= 0}
                          onClick={() => onIssuePart(pt.id, assets[0]?.equipmentId || 'EX-024')}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded-lg text-[11px] font-semibold cursor-pointer"
                        >
                          Issue to Machine
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
