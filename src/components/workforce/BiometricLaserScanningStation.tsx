import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Fingerprint,
  Scan,
  Radio,
  Clock,
  RefreshCw,
  Upload,
  Download,
  Volume2,
  VolumeX,
  Coffee,
  Plus,
  X,
  ArrowRight,
  Sliders
} from 'lucide-react';
import {
  BiometricTerminalConfig,
  BiometricPunchLog,
  BiometricPunchType,
  BiometricVerificationMethod,
  MealRefreshmentItem,
  MealScanRecord,
  EmployeeAttendanceShiftState
} from '../../types/hr';
import { Personnel, Project, TimeEntry } from '../../types';
import { hrService } from '../../services/hrService';
import { useSecurity } from '../../context/SecurityContext';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { downloadCSV } from '../../services/dataExportService';

interface BiometricLaserScanningStationProps {
  personnel: Personnel[];
  projects: Project[];
  onTimesheetLogged?: (newEntry: TimeEntry) => void;
  onCloseModal?: () => void;
}

export const BiometricLaserScanningStation: React.FC<BiometricLaserScanningStationProps> = ({
  projects,
  onTimesheetLogged,
  onCloseModal
}) => {
  const { currentUser } = useSecurity();
  const [activeSubTab, setActiveSubTab] = useState<'punch' | 'meals' | 'shifts' | 'terminals' | 'muster' | 'logs'>('punch');

  // Terminals, Logs, Meals & Shift States
  const [terminals, setTerminals] = useState<BiometricTerminalConfig[]>(() => hrService.getBiometricTerminals());
  const [punchLogs, setPunchLogs] = useState<BiometricPunchLog[]>(() => hrService.getBiometricLogs());
  const [mealItems, setMealItems] = useState<MealRefreshmentItem[]>(() => hrService.getMealItems());
  const [mealScans, setMealScans] = useState<MealScanRecord[]>(() => hrService.getMealScanLogs());
  const [shiftStates, setShiftStates] = useState<EmployeeAttendanceShiftState[]>(() => hrService.getEmployeeShiftStates());
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Punch Form States
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(() => {
    const states = hrService.getEmployeeShiftStates();
    return states[0]?.employeeId || 'EMP-041';
  });
  const [verificationMethod, setVerificationMethod] = useState<BiometricVerificationMethod>('FINGERPRINT');
  const [selectedProjectId] = useState<string>(projects[0]?.id || 'Sirius Mall Storefront');
  const [customPunchTime, setCustomPunchTime] = useState<string>(() => new Date().toTimeString().split(' ')[0].substring(0, 5));

  // Meal / Tea Scan States
  const [selectedMealItemId, setSelectedMealItemId] = useState<string>(() => hrService.getMealItems()[0]?.id || 'meal-1');
  const [newMealName, setNewMealName] = useState('');
  const [newMealCategory, setNewMealCategory] = useState<MealRefreshmentItem['category']>('Tea');
  const [newMealPrice, setNewMealPrice] = useState<number>(150);

  // Hardware Scanner Emulation & Wedge Listener
  const [laserScanInput, setLaserScanInput] = useState('');
  const [isScanningActive, setIsScanningActive] = useState(false);
  const [biometricScanProgress, setBiometricScanProgress] = useState<number | null>(null);
  const [lastScannedResult, setLastScannedResult] = useState<{
    staffName: string;
    method: BiometricVerificationMethod;
    timestamp: string;
    punchType: BiometricPunchType;
    isLate?: boolean;
    lateMinutes?: number;
    otHoursLogged?: number;
    remainingOtQuota?: number;
  } | null>(null);

  // Batch Muster Roll State
  const [musterRollScans, setMusterRollScans] = useState<Array<{
    id: string;
    employeeName: string;
    employeeId: string;
    timestamp: string;
    gate: string;
    status: string;
  }>>([]);

  // File Upload State
  const [showImportModal, setShowImportModal] = useState(false);
  const [rawFileText, setRawFileText] = useState('');

  const refreshAll = () => {
    setPunchLogs([...hrService.getBiometricLogs()]);
    setMealItems([...hrService.getMealItems()]);
    setMealScans([...hrService.getMealScanLogs()]);
    setShiftStates([...hrService.getEmployeeShiftStates()]);
    setTerminals([...hrService.getBiometricTerminals()]);
  };

  // Current Employee Shift & Meal State
  const currentShiftState = useMemo(() => {
    return shiftStates.find(s => s.employeeId === selectedEmployeeId) || shiftStates[0] || {
      employeeId: 'EMP-041',
      employeeName: 'Kasun Wickramasinghe',
      badgeNumber: 'BDG-10041',
      department: 'Fabrication',
      shiftCode: 'SHIFT-MORN',
      shiftName: 'Morning Shift (07:00 - 15:30)',
      shiftStartTime: '07:00',
      shiftEndTime: '15:30',
      currentState: 'NOT_ARRIVED' as const,
      isLateToday: false,
      lateMinutesToday: 0,
      totalLateMinutesMonth: 0,
      isOvertimeEligible: true,
      assignedOvertimeHours: 25,
      completedOvertimeHours: 14.5,
      overtimeHourlyRate: 1250,
      isCompanyMealFunded: true,
      monthlyMealFundAllocated: 15000,
      allowUnclaimedMealToBenefits: true,
      claimedMealsTotalLKR: 8400
    };
  }, [shiftStates, selectedEmployeeId]);

  // ENFORCED NEXT ACTION: Once employee records arrival ('ARRIVED'), next punch MUST be Leave ('LEAVE_OUT')
  const enforcedPunchType: BiometricPunchType = useMemo(() => {
    return currentShiftState.currentState === 'ARRIVED' ? 'LEAVE_OUT' : 'CHECK_IN';
  }, [currentShiftState.currentState]);

  // Audio Beep Generator
  const playScannerBeep = (type: 'success' | 'double' | 'error' = 'success') => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (type === 'success') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1900, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.12);
      } else if (type === 'double') {
        [0, 0.08].forEach((delay, idx) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(idx === 0 ? 2100 : 2600, audioCtx.currentTime + delay);
          gain.gain.setValueAtTime(0.18, audioCtx.currentTime + delay);
          gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + delay + 0.06);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(audioCtx.currentTime + delay);
          osc.stop(audioCtx.currentTime + delay + 0.06);
        });
      } else {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(320, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.25);
      }
    } catch {
      // Ignore audio errors
    }
  };

  // Continuous Barcode Gun Listener
  const laserBufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'TEXTAREA' || (target.tagName === 'INPUT' && target.id !== 'laser-wedge-input'))) {
        return;
      }
      const now = Date.now();
      const diff = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      if (e.key === 'Enter') {
        if (laserBufferRef.current.trim().length > 2) {
          handleExecuteLaserScan(laserBufferRef.current.trim());
          laserBufferRef.current = '';
        }
      } else if (e.key.length === 1) {
        if (diff > 250) {
          laserBufferRef.current = e.key;
        } else {
          laserBufferRef.current += e.key;
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shiftStates, selectedProjectId, activeSubTab, selectedMealItemId]);

  // Execute Attendance Arrival / Leave Scan
  const handleExecutePunch = (targetState?: EmployeeAttendanceShiftState, methodOverride?: BiometricVerificationMethod) => {
    const st = targetState || currentShiftState;
    if (!st) return;

    const method = methodOverride || verificationMethod;
    const nowTime = customPunchTime || new Date().toTimeString().split(' ')[0].substring(0, 5);
    const today = new Date().toISOString().split('T')[0];

    setIsScanningActive(true);
    setBiometricScanProgress(30);

    setTimeout(() => setBiometricScanProgress(80), 100);
    setTimeout(() => {
      setBiometricScanProgress(100);
      setIsScanningActive(false);

      const targetProject = projects.find(p => p.id === selectedProjectId || p.projectName === selectedProjectId);
      const projName = targetProject?.projectName || selectedProjectId;

      const result = hrService.processSmartAttendanceScan({
        employeeId: st.employeeId,
        employeeName: st.employeeName,
        badgeNumber: st.badgeNumber,
        time: nowTime,
        method,
        projectId: projName,
        requestedAction: 'AUTO'
      });

      if (onTimesheetLogged) {
        onTimesheetLogged({
          id: result.punchLog.timesheetEntryId || `t-${Date.now()}`,
          personnelId: st.employeeId,
          projectId: projName,
          date: today,
          hours: result.otAddedHours ? 8 + result.otAddedHours : 8,
          taskDescription: `${result.actionRecorded} (${nowTime})`,
          isOvertime: result.otAddedHours > 0,
          status: 'Approved'
        });
      }

      refreshAll();
      setLastScannedResult({
        staffName: st.employeeName,
        method,
        timestamp: `${today} ${nowTime}`,
        punchType: result.actionRecorded,
        isLate: result.isLate,
        lateMinutes: result.lateMinutes,
        otHoursLogged: result.otAddedHours,
        remainingOtQuota: result.remainingOtHours
      });

      playScannerBeep(method === 'LASER_BARCODE' ? 'double' : 'success');
      toast.success(result.message);
      setTimeout(() => setBiometricScanProgress(null), 800);
    }, 200);
  };

  // Execute Tea / Lunch / Meal Scan by Card or Biometrics
  const handleExecuteMealScan = (targetState?: EmployeeAttendanceShiftState, methodOverride?: BiometricVerificationMethod) => {
    const st = targetState || currentShiftState;
    if (!st) return;

    const { scan } = hrService.recordMealOrTeaScan(
      st.employeeId,
      selectedMealItemId,
      methodOverride || verificationMethod,
      customPunchTime
    );
    playScannerBeep('double');
    refreshAll();
    toast.success(`Scanned ${scan.mealItemName} (LKR ${scan.valueLKR.toLocaleString()}) for ${st.employeeName}`);
  };

  // Handle Laser Barcode Gun Scan
  const handleExecuteLaserScan = (scannedCode: string) => {
    const code = scannedCode.trim().toUpperCase();
    if (!code) return;

    const found = shiftStates.find(s =>
      s.employeeId.toUpperCase() === code ||
      s.badgeNumber.toUpperCase() === code ||
      s.employeeName.toUpperCase().includes(code)
    ) || shiftStates[0];

    if (found) {
      setSelectedEmployeeId(found.employeeId);
      if (activeSubTab === 'meals') {
        handleExecuteMealScan(found, 'LASER_BARCODE');
      } else {
        handleExecutePunch(found, 'LASER_BARCODE');
      }
      setLaserScanInput('');

      setMusterRollScans(prev => [
        {
          id: `mus-${Date.now()}`,
          employeeName: found.employeeName,
          employeeId: found.employeeId,
          timestamp: customPunchTime,
          gate: 'Gate 1 Laser',
          status: found.currentState === 'ARRIVED' ? 'Leave Out' : 'Arrived'
        },
        ...prev.slice(0, 19)
      ]);
    } else {
      playScannerBeep('error');
      toast.error(`Code "${code}" not recognized`);
    }
  };

  const handleAddMealItem = () => {
    if (!newMealName.trim() || newMealPrice <= 0) {
      toast.error('Enter item name and price');
      return;
    }
    const item: MealRefreshmentItem = {
      id: `meal-${Date.now()}`,
      code: `${newMealCategory.toUpperCase().slice(0, 3)}-${Math.floor(10 + Math.random() * 89)}`,
      name: newMealName.trim(),
      category: newMealCategory,
      valueLKR: Number(newMealPrice),
      isActive: true
    };
    hrService.saveMealItem(item);
    refreshAll();
    setSelectedMealItemId(item.id);
    setNewMealName('');
    toast.success(`Added ${item.name} (LKR ${item.valueLKR})`);
  };

  const handleUpdateShiftState = (updates: Partial<EmployeeAttendanceShiftState>) => {
    const updated: EmployeeAttendanceShiftState = {
      ...currentShiftState,
      ...updates
    };
    hrService.saveEmployeeShiftState(updated);
    refreshAll();
    toast.success(`Updated ${updated.employeeName}`);
  };

  const handleSyncTerminal = (terminalId: string) => {
    const synced = hrService.syncBiometricTerminal(currentUser, terminalId);
    refreshAll();
    playScannerBeep('double');
    toast.success(`Synced ${synced} records`);
  };

  const handleImportFileLogs = () => {
    if (!rawFileText.trim()) return;
    const { count } = hrService.importRawBiometricFile(currentUser, rawFileText);
    refreshAll();
    setShowImportModal(false);
    setRawFileText('');
    toast.success(`Imported ${count} logs`);
  };

  // Calculate current employee meal fund status
  const mealBenefitOrDeductionPreview = useMemo(() => {
    const claimed = currentShiftState.claimedMealsTotalLKR || 0;
    if (currentShiftState.isCompanyMealFunded) {
      const diff = (currentShiftState.monthlyMealFundAllocated || 0) - claimed;
      if (diff > 0 && currentShiftState.allowUnclaimedMealToBenefits) {
        return { type: 'BENEFIT', amount: diff, label: `+LKR ${diff.toLocaleString()} Added to Benefits` };
      } else if (diff < 0) {
        return { type: 'DEDUCT', amount: Math.abs(diff), label: `-LKR ${Math.abs(diff).toLocaleString()} Excess Deduction` };
      }
      return { type: 'NEUTRAL', amount: 0, label: 'LKR 0 Balance' };
    } else {
      return { type: 'DEDUCT', amount: claimed, label: `-LKR ${claimed.toLocaleString()} Deducted from Salary` };
    }
  }, [currentShiftState]);

  return (
    <div className="space-y-3 bg-white text-slate-900">
      {/* WHITE TOP HEADER BAR - CONCISE */}
      <div className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
        <div className="flex items-center gap-2">
          <Fingerprint size={18} className="text-orange-600" />
          <h2 className="text-sm font-bold text-slate-900">Biometrics, Shift, OT & Meal Scanner</h2>
          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
            Online
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {([
            { id: 'punch', label: 'Arrival & Leave', icon: Fingerprint },
            { id: 'meals', label: 'Tea & Meal Scan', icon: Coffee },
            { id: 'shifts', label: 'Shift & OT Rules', icon: Sliders },
            { id: 'muster', label: 'Gate Muster', icon: Radio },
            { id: 'terminals', label: `Terminals (${terminals.length})`, icon: Scan },
            { id: 'logs', label: `Logs (${punchLogs.length})`, icon: Clock }
          ] as const).map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer border",
                  activeSubTab === tab.id
                    ? "bg-orange-600 text-white border-orange-600"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                )}
              >
                <Icon size={12} />
                <span>{tab.label}</span>
              </button>
            );
          })}

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer"
            title="Audio"
          >
            {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
          </button>

          {onCloseModal && (
            <button
              onClick={onCloseModal}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* =================================================================== */}
      {/* TAB 1: ARRIVAL -> LEAVE ENFORCED ATTENDANCE, SHIFT LATE & OT        */}
      {/* =================================================================== */}
      {activeSubTab === 'punch' && (
        <div className="space-y-3">
          {/* Control Strip */}
          <div className="bg-white border border-slate-200 rounded-xl p-3 grid grid-cols-1 md:grid-cols-5 gap-2.5 items-end">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Employee</label>
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
              >
                {shiftStates.map(s => (
                  <option key={s.employeeId} value={s.employeeId}>
                    {s.employeeName} ({s.employeeId})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                Assigned Shift ({currentShiftState.shiftStartTime}-{currentShiftState.shiftEndTime})
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="time"
                  value={currentShiftState.shiftStartTime}
                  onChange={(e) => handleUpdateShiftState({ shiftStartTime: e.target.value })}
                  className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold"
                  title="Shift Start Time"
                />
                <span className="text-xs text-slate-400">-</span>
                <input
                  type="time"
                  value={currentShiftState.shiftEndTime}
                  onChange={(e) => handleUpdateShiftState({ shiftEndTime: e.target.value })}
                  className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold"
                  title="Shift End Time"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Scan Time & Sensor</label>
              <div className="flex items-center gap-1">
                <input
                  type="time"
                  value={customPunchTime}
                  onChange={(e) => setCustomPunchTime(e.target.value)}
                  className="w-24 px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold"
                />
                <select
                  value={verificationMethod}
                  onChange={(e) => setVerificationMethod(e.target.value as BiometricVerificationMethod)}
                  className="flex-1 px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                >
                  <option value="FINGERPRINT">Fingerprint</option>
                  <option value="FACIAL_RECOGNITION">Face ID</option>
                  <option value="LASER_BARCODE">Laser Card</option>
                  <option value="RFID_TAG">RFID Card</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Enforced Next Punch</label>
              <div className={cn(
                "px-2.5 py-1.5 rounded-lg border text-xs font-bold flex items-center justify-between",
                enforcedPunchType === 'CHECK_IN'
                  ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                  : "bg-amber-50 border-amber-300 text-amber-800"
              )}>
                <span>{enforcedPunchType === 'CHECK_IN' ? '1. RECORD ARRIVAL' : '2. RECORD LEAVE'}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white border">
                  {currentShiftState.currentState}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleExecutePunch()}
                disabled={isScanningActive}
                className={cn(
                  "w-full py-2 px-3 rounded-lg text-xs font-bold text-white flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all",
                  enforcedPunchType === 'CHECK_IN'
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-orange-600 hover:bg-orange-700"
                )}
              >
                <Fingerprint size={14} />
                <span>
                  {biometricScanProgress !== null
                    ? `Scanning ${biometricScanProgress}%`
                    : enforcedPunchType === 'CHECK_IN'
                    ? 'Scan Arrival Now'
                    : 'Scan Leave Now'}
                </span>
              </button>
            </div>
          </div>

          {/* Live Status Bar: Shift Lateness, Overtime Quota & Laser Input */}
          <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 flex-wrap text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 font-bold">
                Shift: <span className="font-mono text-slate-900">{currentShiftState.shiftStartTime} - {currentShiftState.shiftEndTime}</span>
              </span>

              <span className={cn(
                "px-2.5 py-1 rounded-lg border font-bold",
                customPunchTime > currentShiftState.shiftStartTime && enforcedPunchType === 'CHECK_IN'
                  ? "bg-rose-50 border-rose-200 text-rose-700"
                  : "bg-emerald-50 border-emerald-200 text-emerald-700"
              )}>
                {enforcedPunchType === 'CHECK_IN'
                  ? (customPunchTime > currentShiftState.shiftStartTime ? `Late Arrival (> ${currentShiftState.shiftStartTime})` : 'On-Time Arrival')
                  : (customPunchTime > currentShiftState.shiftEndTime ? `Post-Shift Leave (OT Check)` : 'Regular Leave')}
              </span>

              <span className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 font-bold">
                OT Quota: <span className="font-mono">{currentShiftState.completedOvertimeHours}h / {currentShiftState.assignedOvertimeHours}h</span>
                {' '}({Math.max(0, Number((currentShiftState.assignedOvertimeHours - currentShiftState.completedOvertimeHours).toFixed(2)))}h Left)
              </span>

              {lastScannedResult && (
                <span className="px-2.5 py-1 rounded-lg bg-orange-50 border border-orange-200 text-orange-800 font-bold">
                  Last: {lastScannedResult.staffName} • {lastScannedResult.punchType}
                  {lastScannedResult.isLate ? ` (LATE +${lastScannedResult.lateMinutes}m)` : ''}
                  {lastScannedResult.otHoursLogged ? ` (+${lastScannedResult.otHoursLogged}h OT)` : ''}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <input
                id="laser-wedge-input"
                type="text"
                value={laserScanInput}
                onChange={(e) => setLaserScanInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleExecuteLaserScan(laserScanInput);
                }}
                placeholder="Scan Card / Badge ID..."
                className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-mono w-44"
              />
              <button
                onClick={() => handleExecuteLaserScan(laserScanInput || currentShiftState.employeeId)}
                className="px-2.5 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Scan size={12} />
                <span>Laser Scan</span>
              </button>
            </div>
          </div>

          {/* Single-Line Employee Attendance State & OT Quota Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-3.5 py-2 border-b border-slate-200 flex items-center justify-between bg-white">
              <span className="text-xs font-bold text-slate-900 uppercase">Employee Arrival / Leave State & Overtime Completion</span>
              <span className="text-[10px] font-mono text-slate-500">{shiftStates.length} Employees</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase whitespace-nowrap">
                    <th className="py-2 px-3">ID</th>
                    <th className="py-2 px-3">Employee</th>
                    <th className="py-2 px-3">Shift</th>
                    <th className="py-2 px-3">Current Status</th>
                    <th className="py-2 px-3">Required Next Punch</th>
                    <th className="py-2 px-3">Late Today</th>
                    <th className="py-2 px-3">OT Eligible</th>
                    <th className="py-2 px-3">Assigned OT</th>
                    <th className="py-2 px-3">Completed OT</th>
                    <th className="py-2 px-3">Remaining OT</th>
                    <th className="py-2 px-3 text-right">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {shiftStates.map(st => {
                    const remOt = Math.max(0, Number((st.assignedOvertimeHours - st.completedOvertimeHours).toFixed(2)));
                    return (
                      <tr key={st.employeeId} className="hover:bg-slate-50 whitespace-nowrap">
                        <td className="py-1.5 px-3 font-mono text-[11px] text-slate-500">{st.employeeId}</td>
                        <td className="py-1.5 px-3 font-bold text-slate-900">{st.employeeName}</td>
                        <td className="py-1.5 px-3 font-mono text-[11px]">{st.shiftStartTime} - {st.shiftEndTime}</td>
                        <td className="py-1.5 px-3">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold",
                            st.currentState === 'ARRIVED'
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-100 text-slate-700 border border-slate-200"
                          )}>
                            {st.currentState} {st.lastArrivalTime ? `(${st.lastArrivalTime})` : ''}
                          </span>
                        </td>
                        <td className="py-1.5 px-3">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1",
                            st.currentState === 'ARRIVED'
                              ? "bg-amber-50 text-amber-800 border border-amber-200"
                              : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          )}>
                            <ArrowRight size={10} />
                            {st.currentState === 'ARRIVED' ? 'MUST PUT LEAVE' : 'RECORD ARRIVAL'}
                          </span>
                        </td>
                        <td className="py-1.5 px-3">
                          {st.isLateToday ? (
                            <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 text-[10px] font-bold">
                              LATE (+{st.lateMinutesToday}m)
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">On Time</span>
                          )}
                        </td>
                        <td className="py-1.5 px-3">
                          <span className={cn(
                            "px-1.5 py-0.5 rounded text-[10px] font-bold",
                            st.isOvertimeEligible ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-500"
                          )}>
                            {st.isOvertimeEligible ? 'Eligible' : 'No'}
                          </span>
                        </td>
                        <td className="py-1.5 px-3 font-mono font-bold">{st.assignedOvertimeHours}h</td>
                        <td className="py-1.5 px-3 font-mono text-emerald-700 font-bold">{st.completedOvertimeHours}h</td>
                        <td className="py-1.5 px-3 font-mono text-orange-600 font-bold">{remOt}h</td>
                        <td className="py-1.5 px-3 text-right">
                          <button
                            onClick={() => handleExecutePunch(st)}
                            className={cn(
                              "px-2.5 py-1 rounded text-[11px] font-bold text-white cursor-pointer",
                              st.currentState === 'ARRIVED'
                                ? "bg-orange-600 hover:bg-orange-700"
                                : "bg-emerald-600 hover:bg-emerald-700"
                            )}
                          >
                            {st.currentState === 'ARRIVED' ? 'Mark Leave' : 'Mark Arrival'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2: TEA, LUNCH & MEAL CARD / BIOMETRIC SCANNING HUB              */}
      {/* =================================================================== */}
      {activeSubTab === 'meals' && (
        <div className="space-y-3">
          {/* Top Meal Scan & Company Fund Allocation Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-3 grid grid-cols-1 lg:grid-cols-3 gap-3">
            {/* Column 1: Biometric / Card Meal Scanner */}
            <div className="border border-slate-200 rounded-lg p-2.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Coffee size={14} className="text-orange-600" />
                  <span>Scan Card / Biometrics for Tea & Meals</span>
                </span>
                <span className="text-[10px] font-mono text-slate-500">Instant</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  className="px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                >
                  {shiftStates.map(s => (
                    <option key={s.employeeId} value={s.employeeId}>{s.employeeName}</option>
                  ))}
                </select>

                <select
                  value={selectedMealItemId}
                  onChange={(e) => setSelectedMealItemId(e.target.value)}
                  className="px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                >
                  {mealItems.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name} (LKR {item.valueLKR})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={verificationMethod}
                  onChange={(e) => setVerificationMethod(e.target.value as BiometricVerificationMethod)}
                  className="flex-1 px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                >
                  <option value="RFID_TAG">RFID Card</option>
                  <option value="FINGERPRINT">Fingerprint</option>
                  <option value="LASER_BARCODE">Laser Barcode</option>
                  <option value="FACIAL_RECOGNITION">Face ID</option>
                </select>
                <button
                  onClick={() => handleExecuteMealScan()}
                  className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Scan size={13} />
                  <span>Scan Meal</span>
                </button>
              </div>
            </div>

            {/* Column 2: Employee Meal Fund Allocation & Auto-Benefit Rule */}
            <div className="border border-slate-200 rounded-lg p-2.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">
                  Fund Rule: {currentShiftState.employeeName}
                </span>
                <span className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded font-bold",
                  mealBenefitOrDeductionPreview.type === 'BENEFIT'
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-rose-50 text-rose-700 border border-rose-200"
                )}>
                  {mealBenefitOrDeductionPreview.label}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <label className="flex items-center gap-1.5 font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentShiftState.isCompanyMealFunded}
                    onChange={(e) => handleUpdateShiftState({ isCompanyMealFunded: e.target.checked })}
                  />
                  <span>Company Allocates Fund</span>
                </label>

                <label className="flex items-center gap-1.5 font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentShiftState.allowUnclaimedMealToBenefits}
                    disabled={!currentShiftState.isCompanyMealFunded}
                    onChange={(e) => handleUpdateShiftState({ allowUnclaimedMealToBenefits: e.target.checked })}
                  />
                  <span>Unclaimed → Benefit</span>
                </label>
              </div>

              <div className="flex items-center justify-between gap-2 text-xs pt-1 border-t border-slate-100">
                <div className="flex items-center gap-1">
                  <span className="text-slate-500 font-semibold">Allocated LKR:</span>
                  <input
                    type="number"
                    value={currentShiftState.monthlyMealFundAllocated}
                    disabled={!currentShiftState.isCompanyMealFunded}
                    onChange={(e) => handleUpdateShiftState({ monthlyMealFundAllocated: Number(e.target.value) })}
                    className="w-24 px-2 py-1 bg-white border border-slate-300 rounded font-mono text-xs font-bold"
                  />
                </div>
                <div className="font-mono text-xs">
                  Claimed: <span className="font-bold text-slate-900">LKR {(currentShiftState.claimedMealsTotalLKR || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Column 3: Define New Tea / Meal / Refreshment Item */}
            <div className="border border-slate-200 rounded-lg p-2.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Define Meal / Tea Item</span>
                <span className="text-[10px] font-mono text-slate-500">{mealItems.length} Items</span>
              </div>

              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={newMealName}
                  onChange={(e) => setNewMealName(e.target.value)}
                  placeholder="Item (e.g. Evening Tea)"
                  className="flex-1 px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                />
                <select
                  value={newMealCategory}
                  onChange={(e) => setNewMealCategory(e.target.value as MealRefreshmentItem['category'])}
                  className="px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                >
                  <option value="Tea">Tea</option>
                  <option value="Lunch">Lunch</option>
                  <option value="Dinner">Dinner</option>
                  <option value="Refreshment">Refreshment</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  value={newMealPrice}
                  onChange={(e) => setNewMealPrice(Number(e.target.value))}
                  placeholder="Price LKR"
                  className="w-28 px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold"
                />
                <button
                  onClick={handleAddMealItem}
                  className="flex-1 py-1.5 px-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus size={12} />
                  <span>Add Value</span>
                </button>
              </div>
            </div>
          </div>

          {/* Single-Line Meal & Tea Scan Ledger */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-3.5 py-2 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 uppercase">Tea, Lunch & Meal Biometric Scan Records</span>
              <span className="text-[10px] font-mono text-slate-500">{mealScans.length} Scans</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase whitespace-nowrap">
                    <th className="py-2 px-3">Date & Time</th>
                    <th className="py-2 px-3">Employee</th>
                    <th className="py-2 px-3">Badge</th>
                    <th className="py-2 px-3">Item</th>
                    <th className="py-2 px-3">Category</th>
                    <th className="py-2 px-3">Method</th>
                    <th className="py-2 px-3 text-right">Value LKR</th>
                    <th className="py-2 px-3">Paysheet Rule</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {mealScans.map(scan => {
                    const st = shiftStates.find(s => s.employeeId === scan.employeeId);
                    return (
                      <tr key={scan.id} className="hover:bg-slate-50 whitespace-nowrap">
                        <td className="py-1.5 px-3 font-mono text-[11px] text-slate-600">{scan.date} {scan.time}</td>
                        <td className="py-1.5 px-3 font-bold text-slate-900">{scan.employeeName}</td>
                        <td className="py-1.5 px-3 font-mono text-[11px] text-slate-500">{scan.badgeNumber}</td>
                        <td className="py-1.5 px-3 font-semibold">{scan.mealItemName}</td>
                        <td className="py-1.5 px-3">
                          <span className="px-1.5 py-0.5 rounded bg-orange-50 text-orange-700 text-[10px] font-bold">
                            {scan.category}
                          </span>
                        </td>
                        <td className="py-1.5 px-3 font-mono text-[11px]">{scan.method}</td>
                        <td className="py-1.5 px-3 text-right font-mono font-bold text-slate-900">{scan.valueLKR.toLocaleString()}</td>
                        <td className="py-1.5 px-3">
                          {st?.isCompanyMealFunded ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                              Company Fund ({st.monthlyMealFundAllocated.toLocaleString()} LKR)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 text-[10px] font-bold">
                              Deduct from Salary
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 3: SHIFT TIMINGS & OVERTIME QUOTA ASSIGNMENT MATRIX             */}
      {/* =================================================================== */}
      {activeSubTab === 'shifts' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-3.5 py-2 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 uppercase">Employee Shift Timings, Overtime Eligibility & Meal Fund Setup</span>
            <span className="text-[10px] font-mono text-slate-500">Auto-Calculates Late & OT</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase whitespace-nowrap">
                  <th className="py-2 px-2.5">Employee</th>
                  <th className="py-2 px-2.5">Shift Start</th>
                  <th className="py-2 px-2.5">Shift End</th>
                  <th className="py-2 px-2.5">OT Eligible</th>
                  <th className="py-2 px-2.5">Assigned OT (h)</th>
                  <th className="py-2 px-2.5">Completed OT (h)</th>
                  <th className="py-2 px-2.5">OT Rate/h (LKR)</th>
                  <th className="py-2 px-2.5">Company Meal Fund</th>
                  <th className="py-2 px-2.5">Fund LKR</th>
                  <th className="py-2 px-2.5">Unclaimed → Benefit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {shiftStates.map(st => (
                  <tr key={st.employeeId} className="hover:bg-slate-50 whitespace-nowrap">
                    <td className="py-1.5 px-2.5 font-bold text-slate-900">{st.employeeName}</td>
                    <td className="py-1.5 px-2.5">
                      <input
                        type="time"
                        value={st.shiftStartTime}
                        onChange={(e) => {
                          hrService.saveEmployeeShiftState({ ...st, shiftStartTime: e.target.value });
                          refreshAll();
                        }}
                        className="px-1.5 py-0.5 border border-slate-300 rounded font-mono text-xs"
                      />
                    </td>
                    <td className="py-1.5 px-2.5">
                      <input
                        type="time"
                        value={st.shiftEndTime}
                        onChange={(e) => {
                          hrService.saveEmployeeShiftState({ ...st, shiftEndTime: e.target.value });
                          refreshAll();
                        }}
                        className="px-1.5 py-0.5 border border-slate-300 rounded font-mono text-xs"
                      />
                    </td>
                    <td className="py-1.5 px-2.5">
                      <input
                        type="checkbox"
                        checked={st.isOvertimeEligible}
                        onChange={(e) => {
                          hrService.saveEmployeeShiftState({ ...st, isOvertimeEligible: e.target.checked });
                          refreshAll();
                        }}
                      />
                    </td>
                    <td className="py-1.5 px-2.5">
                      <input
                        type="number"
                        value={st.assignedOvertimeHours}
                        onChange={(e) => {
                          hrService.saveEmployeeShiftState({ ...st, assignedOvertimeHours: Number(e.target.value) });
                          refreshAll();
                        }}
                        className="w-16 px-1.5 py-0.5 border border-slate-300 rounded font-mono text-xs font-bold"
                      />
                    </td>
                    <td className="py-1.5 px-2.5 font-mono font-bold text-emerald-700">{st.completedOvertimeHours}h</td>
                    <td className="py-1.5 px-2.5">
                      <input
                        type="number"
                        value={st.overtimeHourlyRate}
                        onChange={(e) => {
                          hrService.saveEmployeeShiftState({ ...st, overtimeHourlyRate: Number(e.target.value) });
                          refreshAll();
                        }}
                        className="w-20 px-1.5 py-0.5 border border-slate-300 rounded font-mono text-xs"
                      />
                    </td>
                    <td className="py-1.5 px-2.5">
                      <input
                        type="checkbox"
                        checked={st.isCompanyMealFunded}
                        onChange={(e) => {
                          hrService.saveEmployeeShiftState({ ...st, isCompanyMealFunded: e.target.checked });
                          refreshAll();
                        }}
                      />
                    </td>
                    <td className="py-1.5 px-2.5">
                      <input
                        type="number"
                        value={st.monthlyMealFundAllocated}
                        disabled={!st.isCompanyMealFunded}
                        onChange={(e) => {
                          hrService.saveEmployeeShiftState({ ...st, monthlyMealFundAllocated: Number(e.target.value) });
                          refreshAll();
                        }}
                        className="w-24 px-1.5 py-0.5 border border-slate-300 rounded font-mono text-xs"
                      />
                    </td>
                    <td className="py-1.5 px-2.5">
                      <input
                        type="checkbox"
                        checked={st.allowUnclaimedMealToBenefits}
                        disabled={!st.isCompanyMealFunded}
                        onChange={(e) => {
                          hrService.saveEmployeeShiftState({ ...st, allowUnclaimedMealToBenefits: e.target.checked });
                          refreshAll();
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 4: GATE MUSTER ROLL                                             */}
      {/* =================================================================== */}
      {activeSubTab === 'muster' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-3.5 py-2 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 uppercase">Rapid Gate Muster Roll</span>
            <div className="flex items-center gap-1.5">
              {shiftStates.map(s => (
                <button
                  key={s.employeeId}
                  onClick={() => handleExecuteLaserScan(s.employeeId)}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-orange-50 hover:text-orange-700 border border-slate-200 rounded text-[11px] font-semibold cursor-pointer"
                >
                  {s.employeeName.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase whitespace-nowrap">
                  <th className="py-2 px-3">Time</th>
                  <th className="py-2 px-3">Employee</th>
                  <th className="py-2 px-3">ID</th>
                  <th className="py-2 px-3">Gate</th>
                  <th className="py-2 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {musterRollScans.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400">Scan badge to populate muster roll</td>
                  </tr>
                ) : (
                  musterRollScans.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50 whitespace-nowrap">
                      <td className="py-1.5 px-3 font-mono text-[11px]">{item.timestamp}</td>
                      <td className="py-1.5 px-3 font-bold text-slate-900">{item.employeeName}</td>
                      <td className="py-1.5 px-3 font-mono text-slate-600">{item.employeeId}</td>
                      <td className="py-1.5 px-3 font-mono text-[11px]">{item.gate}</td>
                      <td className="py-1.5 px-3">
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 5: TERMINALS (SINGLE-LINE ROWS)                                 */}
      {/* =================================================================== */}
      {activeSubTab === 'terminals' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-3.5 py-2 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 uppercase">Connected Terminals</span>
            <button
              onClick={() => setShowImportModal(true)}
              className="px-2.5 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <Upload size={12} />
              <span>Import .DAT</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase whitespace-nowrap">
                  <th className="py-2 px-3">Terminal</th>
                  <th className="py-2 px-3">Location</th>
                  <th className="py-2 px-3">IP:Port</th>
                  <th className="py-2 px-3">Type</th>
                  <th className="py-2 px-3">Buffer</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3 text-right">Sync</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {terminals.map(term => (
                  <tr key={term.id} className="hover:bg-slate-50 whitespace-nowrap">
                    <td className="py-1.5 px-3 font-bold text-slate-900">{term.name}</td>
                    <td className="py-1.5 px-3 text-slate-600">{term.location}</td>
                    <td className="py-1.5 px-3 font-mono text-[11px]">{term.ipAddress}:{term.port}</td>
                    <td className="py-1.5 px-3 font-mono text-[11px]">{term.terminalType}</td>
                    <td className="py-1.5 px-3 font-mono font-bold">{term.bufferedRecordCount}</td>
                    <td className="py-1.5 px-3">
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                        {term.status}
                      </span>
                    </td>
                    <td className="py-1.5 px-3 text-right">
                      <button
                        onClick={() => handleSyncTerminal(term.id)}
                        className="px-2.5 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw size={11} />
                        <span>Sync</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 6: BIOMETRIC & LASER LOGS (SINGLE-LINE ROWS)                    */}
      {/* =================================================================== */}
      {activeSubTab === 'logs' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-3.5 py-2 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 uppercase">Attendance & Leave Punch Ledger</span>
            <button
              onClick={() => {
                downloadCSV(
                  `biometric_logs_${new Date().toISOString().split('T')[0]}.csv`,
                  ['ID', 'Date', 'Time', 'Employee', 'Punch', 'Late', 'OT_Hours', 'Method'],
                  punchLogs.map(l => [
                    l.id,
                    l.date,
                    l.time,
                    l.employeeName,
                    l.punchType,
                    l.isLate ? `${l.lateMinutes}m` : 'No',
                    String(l.approvedOtHoursCompleted || 0),
                    l.verificationMethod
                  ])
                );
              }}
              className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <Download size={12} />
              <span>Export CSV</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase whitespace-nowrap">
                  <th className="py-2 px-3">Date & Time</th>
                  <th className="py-2 px-3">Employee</th>
                  <th className="py-2 px-3">Punch Action</th>
                  <th className="py-2 px-3">Shift Status</th>
                  <th className="py-2 px-3">OT Logged</th>
                  <th className="py-2 px-3">Sensor</th>
                  <th className="py-2 px-3">Terminal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {punchLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50 whitespace-nowrap">
                    <td className="py-1.5 px-3 font-mono text-[11px]">{log.date} {log.time}</td>
                    <td className="py-1.5 px-3 font-bold text-slate-900">{log.employeeName}</td>
                    <td className="py-1.5 px-3">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-bold",
                        log.punchType === 'CHECK_IN'
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-800"
                      )}>
                        {log.punchType === 'CHECK_IN' ? 'ARRIVAL' : 'LEAVE'}
                      </span>
                    </td>
                    <td className="py-1.5 px-3">
                      {log.isLate ? (
                        <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 text-[10px] font-bold">
                          LATE (+{log.lateMinutes}m)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">
                          ON TIME
                        </span>
                      )}
                    </td>
                    <td className="py-1.5 px-3 font-mono font-bold text-blue-700">
                      {log.approvedOtHoursCompleted ? `+${log.approvedOtHoursCompleted}h OT` : '-'}
                    </td>
                    <td className="py-1.5 px-3 font-mono text-[11px]">{log.verificationMethod}</td>
                    <td className="py-1.5 px-3 text-slate-600">{log.terminalName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* IMPORT MODAL */}
      {showImportModal && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-4 space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase">Import Terminal .DAT / .CSV</h3>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-slate-700">
                <X size={14} />
              </button>
            </div>
            <textarea
              value={rawFileText}
              onChange={(e) => setRawFileText(e.target.value)}
              rows={5}
              placeholder="EMP-041, 2026-09-26, 08:15, CHECK_IN"
              className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleImportFileLogs}
                className="px-3 py-1.5 bg-orange-600 text-white rounded-lg text-xs font-bold"
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
