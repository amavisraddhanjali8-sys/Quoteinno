import React from 'react';
import {
  X,
  QrCode,
  MapPin,
  User,
  Gauge,
  Wrench,
  DollarSign,
  ShieldCheck,
  History,
  ExternalLink
} from 'lucide-react';
import {
  EquipmentMasterAsset,
  UnifiedMachineEvent,
  AssetLifecycleState
} from '../../services/equipmentControlService';
import { cn } from '../../lib/utils';

const LIFECYCLE_STATES: AssetLifecycleState[] = [
  'Planned',
  'Purchased',
  'Commissioned',
  'Available',
  'Allocated',
  'Operating',
  'Maintenance',
  'Breakdown',
  'Repair',
  'Transferred',
  'Retired',
  'Disposed'
];

interface MachinePassportModalProps {
  asset: EquipmentMasterAsset | null;
  events: UnifiedMachineEvent[];
  totalFuelCost: number;
  totalMaintenanceCost: number;
  onClose: () => void;
  onChangeLifecycleState: (assetId: string, newState: AssetLifecycleState) => void;
  onNavigatePortal?: (portalView: string, subTab?: string) => void;
}

export const MachinePassportModal: React.FC<MachinePassportModalProps> = ({
  asset,
  events,
  totalFuelCost,
  totalMaintenanceCost,
  onClose,
  onChangeLifecycleState,
  onNavigatePortal
}) => {
  if (!asset) return null;

  const machineEvents = events.filter(e => e.equipmentId === asset.equipmentId);
  const remainingServiceHours = asset.nextServiceMeter - asset.currentMeter;
  const totalOperatingCost = totalFuelCost + totalMaintenanceCost;
  const totalTCO = asset.purchasePrice + totalOperatingCost;
  const costPerHour = asset.currentMeter > 0 ? Math.round(totalOperatingCost / asset.currentMeter) : 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-orange-600 text-white flex items-center justify-center shrink-0 font-mono text-xs font-bold">
              <QrCode size={18} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold text-orange-600">{asset.equipmentId}</span>
                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs text-slate-600 font-medium">{asset.category}</span>
                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs font-mono text-slate-500">SN: {asset.serialNumber}</span>
              </div>
              <h2 className="text-sm font-bold text-slate-900 truncate">{asset.name}</h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs">
          {/* Instant 8-Question Answer Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="text-slate-400 flex items-center gap-1 mb-1">
                <MapPin size={12} /> <span>Where is it?</span>
              </div>
              <div className="font-bold text-slate-900 truncate">{asset.location}</div>
              <div className="text-[11px] text-orange-600 font-mono mt-0.5">{asset.projectCode}</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="text-slate-400 flex items-center gap-1 mb-1">
                <User size={12} /> <span>Who has it?</span>
              </div>
              <div className="font-bold text-slate-900 truncate">{asset.assignedOperatorName}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{asset.branch}</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="text-slate-400 flex items-center gap-1 mb-1">
                <Gauge size={12} /> <span>Hours & Next Service</span>
              </div>
              <div className="font-bold text-slate-900 font-mono">
                {asset.currentMeter.toLocaleString()} {asset.meterType}
              </div>
              <div className={cn(
                "text-[11px] font-mono mt-0.5",
                remainingServiceHours <= 25 ? "text-rose-600 font-semibold" : "text-emerald-600"
              )}>
                Next: {asset.nextServiceMeter}h ({remainingServiceHours}h left)
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="text-slate-400 flex items-center gap-1 mb-1">
                <DollarSign size={12} /> <span>How much has it cost?</span>
              </div>
              <div className="font-bold text-slate-900 font-mono">
                LKR {totalOperatingCost.toLocaleString()} OpEx
              </div>
              <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                LKR {costPerHour.toLocaleString()}/hr · TCO {(totalTCO / 1000000).toFixed(2)}M
              </div>
            </div>
          </div>

          {/* Lifecycle State Bar */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">Machine Lifecycle State (Click to update & log history)</span>
              <span className="font-mono text-[11px] text-slate-500">Current: {asset.lifecycleState}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {LIFECYCLE_STATES.map(st => {
                const active = asset.lifecycleState === st;
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => onChangeLifecycleState(asset.id, st)}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer",
                      active
                        ? "bg-orange-600 text-white shadow-2xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    )}
                  >
                    {st}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Technical Specs, Compliance & Cross-Portal Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl border border-slate-200 space-y-1.5">
              <div className="font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <Wrench size={13} className="text-orange-500" />
                <span>Identity, Ownership & Attachments</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Make / Model:</span>
                <span className="font-semibold text-slate-900">{asset.manufacturer} {asset.model} ({asset.yearPurchased})</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Ownership & Internal Rate:</span>
                <span className="font-semibold text-slate-900 font-mono">{asset.ownershipType} · LKR {asset.internalHourlyRate.toLocaleString()}/hr</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Condition & Calibration:</span>
                <span className={cn(
                  "font-semibold",
                  asset.calibrationStatus === 'Expired' ? "text-rose-600" : "text-emerald-700"
                )}>
                  {asset.condition} · Calib: {asset.calibrationStatus} ({asset.calibrationDue})
                </span>
              </div>
              <div className="pt-1 text-slate-600">
                <span className="text-slate-400 block mb-1">Attachments:</span>
                <div className="flex flex-wrap gap-1.5">
                  {asset.attachments.map((att, i) => (
                    <span key={i} className="px-2 py-0.5 bg-slate-100 rounded text-[11px] text-slate-700">
                      {att}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                  <ShieldCheck size={13} className="text-emerald-600" />
                  <span>Statutory Compliance & Connected Portals</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Insurance Expiry:</span>
                  <span className="font-mono font-semibold text-slate-900">{asset.insuranceExpiry}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Warranty Valid Until:</span>
                  <span className="font-mono font-semibold text-slate-900">{asset.warrantyExpiry}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Book Value:</span>
                  <span className="font-mono font-semibold text-slate-900">LKR {asset.bookValue.toLocaleString()}</span>
                </div>
              </div>

              {onNavigatePortal && (
                <div className="pt-3 mt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => { onClose(); onNavigatePortal('projects'); }}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <span>Project Site</span> <ExternalLink size={11} />
                  </button>
                  <button
                    type="button"
                    onClick={() => { onClose(); onNavigatePortal('resource-management', 'certifications'); }}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <span>Operator Cert</span> <ExternalLink size={11} />
                  </button>
                  <button
                    type="button"
                    onClick={() => { onClose(); onNavigatePortal('procurement', 'pr'); }}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <span>Order Parts</span> <ExternalLink size={11} />
                  </button>
                  <button
                    type="button"
                    onClick={() => { onClose(); onNavigatePortal('post-evaluation'); }}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <span>Project Cost</span> <ExternalLink size={11} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Complete Chronological Machine History Timeline (Single Source of Truth) */}
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History size={14} className="text-orange-500" />
                <span className="font-bold text-slate-900">
                  Complete Machine History ({machineEvents.length} Linked Events)
                </span>
              </div>
              <span className="text-[11px] text-slate-500">
                Purchased → Allocated → Meter/Fuel → Service → Breakdown → Transfer
              </span>
            </div>

            <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
              {machineEvents.length === 0 ? (
                <div className="py-8 text-center text-slate-400">No events logged yet for this machine.</div>
              ) : (
                machineEvents.map(ev => (
                  <div key={ev.id} className="px-4 py-2.5 hover:bg-slate-50/70 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-slate-700">{ev.date}</span>
                        <span className="text-slate-300">·</span>
                        <span className="font-mono text-[11px] text-orange-600 font-semibold">{ev.referenceNo}</span>
                        <span className="text-slate-300">·</span>
                        <span className="text-[11px] font-semibold text-slate-500">{ev.category}</span>
                        {ev.projectCode && (
                          <>
                            <span className="text-slate-300">·</span>
                            <span className="font-mono text-[11px] text-blue-600">{ev.projectCode}</span>
                          </>
                        )}
                      </div>
                      <p className="font-semibold text-slate-900 mt-0.5">{ev.title}</p>
                      <p className="text-[11px] text-slate-500 truncate">{ev.details}</p>
                    </div>

                    <div className="text-right shrink-0 font-mono">
                      {ev.meterReading !== undefined && (
                        <div className="text-[11px] text-slate-700 font-semibold">{ev.meterReading.toLocaleString()} h</div>
                      )}
                      {ev.costImpactLKR !== undefined && ev.costImpactLKR > 0 && (
                        <div className="text-[11px] text-slate-500">LKR {ev.costImpactLKR.toLocaleString()}</div>
                      )}
                      <div className="text-[10px] text-slate-400">{ev.actor}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
