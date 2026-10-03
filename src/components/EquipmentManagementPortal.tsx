import React, { useState, useMemo, useEffect } from 'react';
import {
  Wrench,
  Settings,
  Search,
  Check,
  Plus,
  Trash2,
  Edit2,
  X,
  LayoutDashboard,
  QrCode,
  Truck,
  Gauge,
  CheckCircle2,
  DollarSign,
  ExternalLink
} from 'lucide-react';
import { Equipment, Project } from '../types';
import { cn } from '../lib/utils';
import { ExportActions } from './common/ExportActions';
import { downloadCSV, downloadPDFTable } from '../services/dataExportService';
import { EquipmentLandingPage, EquipmentTab } from './equipment/EquipmentLandingPage';
import {
  equipmentControlService,
  EquipmentMasterAsset,
  OperatorAuthorization,
  AllocationHandoverRecord,
  DailyUsageFuelLog,
  EquipmentInspectionRecord,
  MaintenanceWorkOrder,
  SparePartTireItem,
  ComplianceDocRecord,
  UnifiedMachineEvent,
  AssetLifecycleState,
  EQUIPMENT_CATEGORIES
} from '../services/equipmentControlService';
import { MachinePassportModal } from './equipment/MachinePassportModal';
import {
  EquipmentAllocationModule,
  EquipmentOperationsModule,
  EquipmentPartsCostModule
} from './equipment/EquipmentLifecycleModules';

interface EquipmentManagementPortalProps {
  equipment?: Equipment[];
  projects?: Project[];
  initialTab?: EquipmentTab;
  onTabChange?: (tab: EquipmentTab) => void;
  onSaveEquipment?: (item: Equipment) => void;
  onDeleteEquipment?: (id: string) => void;
  onNavigatePortal?: (portalView: string, subTab?: string) => void;
  onNavigateToPortal?: (portalView: string, subTab?: string) => void;
}

export const EquipmentManagementPortal: React.FC<EquipmentManagementPortalProps> = ({
  equipment = [],
  projects = [],
  initialTab = 'landing',
  onTabChange,
  onSaveEquipment,
  onDeleteEquipment,
  onNavigatePortal,
  onNavigateToPortal
}) => {
  const handleNavigatePortal = onNavigateToPortal || onNavigatePortal;
  const [activeTab, setActiveTab] = useState<EquipmentTab>(initialTab || 'landing');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [stateFilter, setStateFilter] = useState<'All' | AssetLifecycleState>('All');
  const [projectFilter, setProjectFilter] = useState('All');

  // Persistent Equipment Control State
  const [masterAssets, setMasterAssets] = useState<EquipmentMasterAsset[]>(() =>
    equipmentControlService.getAssets()
  );
  const [operators] = useState<OperatorAuthorization[]>(() =>
    equipmentControlService.getOperators()
  );
  const [allocations, setAllocations] = useState<AllocationHandoverRecord[]>(() =>
    equipmentControlService.getAllocations()
  );
  const [dailyLogs, setDailyLogs] = useState<DailyUsageFuelLog[]>(() =>
    equipmentControlService.getDailyLogs()
  );
  const [inspections, setInspections] = useState<EquipmentInspectionRecord[]>(() =>
    equipmentControlService.getInspections()
  );
  const [workOrders, setWorkOrders] = useState<MaintenanceWorkOrder[]>(() =>
    equipmentControlService.getWorkOrders()
  );
  const [parts, setParts] = useState<SparePartTireItem[]>(() =>
    equipmentControlService.getParts()
  );
  const [docs] = useState<ComplianceDocRecord[]>(() =>
    equipmentControlService.getDocs()
  );
  const [events, setEvents] = useState<UnifiedMachineEvent[]>(() =>
    equipmentControlService.getEvents()
  );

  // Selected machine for 360° Passport & Unified Timeline
  const [passportEquipmentId, setPassportEquipmentId] = useState<string | null>(null);

  // Modals
  const [isAddingAsset, setIsAddingAsset] = useState(false);
  const [editingAsset, setEditingAsset] = useState<EquipmentMasterAsset | null>(null);
  const [isAddingInspection, setIsAddingInspection] = useState(false);
  const [isAddingWorkOrder, setIsAddingWorkOrder] = useState(false);

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  // Forms
  const [assetForm, setAssetForm] = useState({
    equipmentId: 'EQ-NEW-01',
    name: '',
    category: 'Heavy Machinery',
    manufacturer: '',
    model: '',
    serialNumber: '',
    ownershipType: 'Owned' as EquipmentMasterAsset['ownershipType'],
    purchasePrice: 8500000,
    internalHourlyRate: 3500,
    currentMeter: 0,
    serviceIntervalHours: 250,
    location: 'Main Factory Bay 1',
    projectCode: 'PRJ-HYATT-B',
    assignedOperatorName: 'Kasun Perera',
    lifecycleState: 'Available' as AssetLifecycleState,
    calibrationDue: '2027-06-30',
    insuranceExpiry: '2027-06-30',
    warrantyExpiry: '2027-06-30',
    attachmentsText: 'Standard Bucket, Safety Guard'
  });

  const [inspForm, setInspForm] = useState({
    equipmentId: masterAssets[0]?.equipmentId || 'EX-024',
    inspectionType: 'Daily' as EquipmentInspectionRecord['inspectionType'],
    inspector: 'Site Supervisor',
    engineHydraulicsOk: true,
    electricalBrakesOk: true,
    safetyGuardsOk: true,
    fluidLeaksOk: true,
    result: 'Pass' as EquipmentInspectionRecord['result'],
    notes: 'All safety guards, hydraulics and brakes verified.'
  });

  const [woForm, setWoForm] = useState({
    equipmentId: masterAssets[0]?.equipmentId || 'EX-024',
    orderType: 'Preventive' as MaintenanceWorkOrder['orderType'],
    priority: 'Normal' as MaintenanceWorkOrder['priority'],
    faultOrScope: '',
    rootCause: '',
    technician: 'Internal Maintenance Team',
    workshopBay: 'Workshop Bay 1',
    downtimeHours: 4,
    labourCostLKR: 8000,
    partsCostLKR: 15000,
    partsUsedText: 'Oil Filter, Hydraulic Seal'
  });

  const logUnifiedEvent = (ev: Omit<UnifiedMachineEvent, 'id'>) => {
    const updated = equipmentControlService.addEvent(ev);
    setEvents(updated);
  };

  const filteredAssets = useMemo(() => {
    return masterAssets.filter(a => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        a.equipmentId.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q) ||
        a.serialNumber.toLowerCase().includes(q) ||
        a.location.toLowerCase().includes(q) ||
        a.assignedOperatorName.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q);
      const matchCat = categoryFilter === 'All' || a.category === categoryFilter;
      const matchState = stateFilter === 'All' || a.lifecycleState === stateFilter;
      const matchProj =
        projectFilter === 'All' ||
        a.projectCode.toLowerCase().includes(projectFilter.toLowerCase()) ||
        a.location.toLowerCase().includes(projectFilter.toLowerCase());
      return matchSearch && matchCat && matchState && matchProj;
    });
  }, [masterAssets, searchQuery, categoryFilter, stateFilter, projectFilter]);

  // Handlers
  const handleSaveAssetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetForm.name.trim()) return;

    const attachments = assetForm.attachmentsText
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    if (editingAsset) {
      const updated: EquipmentMasterAsset = {
        ...editingAsset,
        equipmentId: assetForm.equipmentId,
        name: assetForm.name,
        category: assetForm.category,
        manufacturer: assetForm.manufacturer,
        model: assetForm.model,
        serialNumber: assetForm.serialNumber,
        ownershipType: assetForm.ownershipType,
        purchasePrice: Number(assetForm.purchasePrice),
        internalHourlyRate: Number(assetForm.internalHourlyRate),
        currentMeter: Number(assetForm.currentMeter),
        serviceIntervalHours: Number(assetForm.serviceIntervalHours),
        nextServiceMeter: editingAsset.lastServiceMeter + Number(assetForm.serviceIntervalHours),
        location: assetForm.location,
        projectCode: assetForm.projectCode,
        assignedOperatorName: assetForm.assignedOperatorName,
        lifecycleState: assetForm.lifecycleState,
        calibrationDue: assetForm.calibrationDue,
        insuranceExpiry: assetForm.insuranceExpiry,
        warrantyExpiry: assetForm.warrantyExpiry,
        attachments
      };
      const nextList = masterAssets.map(x => (x.id === updated.id ? updated : x));
      setMasterAssets(nextList);
      equipmentControlService.saveAssets(nextList);
      setEditingAsset(null);
    } else {
      const newAsset: EquipmentMasterAsset = {
        id: `eq-master-${Date.now()}`,
        equipmentId: assetForm.equipmentId || `EQ-${Math.floor(100 + Math.random() * 900)}`,
        qrCode: `QR-${assetForm.equipmentId}`,
        name: assetForm.name,
        category: assetForm.category,
        manufacturer: assetForm.manufacturer || 'Industrial OEM',
        model: assetForm.model || 'Standard',
        serialNumber: assetForm.serialNumber || `SN-${Math.floor(1000 + Math.random() * 9000)}`,
        yearPurchased: 2026,
        ownershipType: assetForm.ownershipType,
        purchasePrice: Number(assetForm.purchasePrice) || 0,
        bookValue: Number(assetForm.purchasePrice) || 0,
        internalHourlyRate: Number(assetForm.internalHourlyRate) || 3000,
        meterType: 'Hours',
        currentMeter: Number(assetForm.currentMeter) || 0,
        serviceIntervalHours: Number(assetForm.serviceIntervalHours) || 250,
        lastServiceMeter: Number(assetForm.currentMeter) || 0,
        nextServiceMeter: (Number(assetForm.currentMeter) || 0) + (Number(assetForm.serviceIntervalHours) || 250),
        nextServiceDate: '2026-12-30',
        calibrationDue: assetForm.calibrationDue,
        calibrationStatus: 'Valid',
        insuranceExpiry: assetForm.insuranceExpiry,
        warrantyExpiry: assetForm.warrantyExpiry,
        fuelType: 'Diesel',
        expectedFuelLPerHr: 12,
        branch: 'Main Factory',
        location: assetForm.location,
        projectCode: assetForm.projectCode,
        projectName: assetForm.projectCode,
        assignedOperatorId: 'OP-101',
        assignedOperatorName: assetForm.assignedOperatorName,
        condition: 'Excellent',
        lifecycleState: assetForm.lifecycleState,
        attachments
      };
      const nextList = [newAsset, ...masterAssets];
      setMasterAssets(nextList);
      equipmentControlService.saveAssets(nextList);
      logUnifiedEvent({
        equipmentId: newAsset.equipmentId,
        date: new Date().toISOString().split('T')[0],
        category: 'Acquisition',
        referenceNo: `REG-${newAsset.equipmentId}`,
        title: `Registered ${newAsset.name} (${newAsset.ownershipType})`,
        details: `Added to Master Registry at ${newAsset.location}`,
        projectCode: newAsset.projectCode,
        actor: 'Equipment Admin',
        meterReading: newAsset.currentMeter,
        costImpactLKR: newAsset.purchasePrice
      });
      onSaveEquipment?.({
        id: newAsset.id,
        equipmentId: newAsset.equipmentId,
        name: newAsset.name,
        type: newAsset.category,
        serialNumber: newAsset.serialNumber,
        purchaseDate: new Date().toISOString().split('T')[0],
        location: newAsset.location,
        status: 'Available',
        assignedTo: newAsset.assignedOperatorName,
        nextServiceDate: newAsset.nextServiceDate,
        calibrationDue: newAsset.calibrationDue
      });
      setIsAddingAsset(false);
    }
  };

  const handleDeleteAsset = (id: string) => {
    const target = masterAssets.find(a => a.id === id);
    if (!target) return;
    const nextList = masterAssets.filter(a => a.id !== id);
    setMasterAssets(nextList);
    equipmentControlService.saveAssets(nextList);
    onDeleteEquipment?.(id);
  };

  const handleChangeLifecycleState = (assetId: string, newState: AssetLifecycleState) => {
    const target = masterAssets.find(a => a.id === assetId);
    if (!target) return;
    const prev = target.lifecycleState;
    const nextList = masterAssets.map(a => (a.id === assetId ? { ...a, lifecycleState: newState } : a));
    setMasterAssets(nextList);
    equipmentControlService.saveAssets(nextList);

    logUnifiedEvent({
      equipmentId: target.equipmentId,
      date: new Date().toISOString().split('T')[0],
      category: newState === 'Disposed' || newState === 'Retired' ? 'Disposal' : 'Lifecycle',
      referenceNo: `STATE-${Date.now().toString().slice(-4)}`,
      title: `Lifecycle State Changed: ${prev} → ${newState}`,
      details: `Location: ${target.location} · Operator: ${target.assignedOperatorName}`,
      projectCode: target.projectCode,
      actor: 'Equipment Manager',
      meterReading: target.currentMeter
    });
  };

  const handleCreateAllocation = (rec: Omit<AllocationHandoverRecord, 'id' | 'recordNo'>) => {
    const recordNo = `HC-2026-${Math.floor(100 + Math.random() * 899)}`;
    const newRec: AllocationHandoverRecord = {
      ...rec,
      id: `al-${Date.now()}`,
      recordNo
    };
    const nextAlloc = [newRec, ...allocations];
    setAllocations(nextAlloc);
    equipmentControlService.saveAllocations(nextAlloc);

    // Update machine location, operator & state
    const nextAssets = masterAssets.map(a =>
      a.equipmentId === rec.equipmentId
        ? {
            ...a,
            location: rec.toLocation,
            projectCode: rec.projectCode,
            projectName: rec.projectName,
            assignedOperatorName: rec.operatorName,
            currentMeter: Math.max(a.currentMeter, rec.meterReading),
            lifecycleState: (rec.type === 'Return' || rec.type === 'Demobilization'
              ? 'Available'
              : 'Allocated') as AssetLifecycleState
          }
        : a
    );
    setMasterAssets(nextAssets);
    equipmentControlService.saveAssets(nextAssets);

    logUnifiedEvent({
      equipmentId: rec.equipmentId,
      date: rec.date,
      category: rec.type === 'Handover' ? 'Handover' : 'Allocation',
      referenceNo: recordNo,
      title: `${rec.type}: ${rec.fromLocation} → ${rec.toLocation}`,
      details: `Custody: ${rec.fromCustodian} → ${rec.toCustodian} (Operator: ${rec.operatorName})`,
      projectCode: rec.projectCode,
      actor: rec.approvedBy,
      meterReading: rec.meterReading,
      costImpactLKR: rec.transportCost
    });
  };

  const handleAddDailyLog = (log: Omit<DailyUsageFuelLog, 'id' | 'logNo'>) => {
    const logNo = `DL-2026-${Math.floor(100 + Math.random() * 899)}`;
    const newLog: DailyUsageFuelLog = {
      ...log,
      id: `dl-${Date.now()}`,
      logNo
    };
    const nextLogs = [newLog, ...dailyLogs];
    setDailyLogs(nextLogs);
    equipmentControlService.saveDailyLogs(nextLogs);

    const nextAssets = masterAssets.map(a =>
      a.equipmentId === log.equipmentId
        ? {
            ...a,
            currentMeter: Math.max(a.currentMeter, log.closingMeter),
            lifecycleState: 'Operating' as AssetLifecycleState
          }
        : a
    );
    setMasterAssets(nextAssets);
    equipmentControlService.saveAssets(nextAssets);

    logUnifiedEvent({
      equipmentId: log.equipmentId,
      date: log.date,
      category: 'Operation',
      referenceNo: logNo,
      title: `Daily Meter & Fuel (+${log.operatingHours}h / ${log.fuelLitres}L)`,
      details: `${log.workPerformed} (${log.litresPerHour} L/hr)`,
      projectCode: log.projectCode,
      actor: log.operatorName,
      meterReading: log.closingMeter,
      costImpactLKR: log.fuelCostLKR + log.lubricantCostLKR
    });
  };

  const handleAddInspectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const asset = masterAssets.find(a => a.equipmentId === inspForm.equipmentId);
    const inspectionNo = `IN-2026-${Math.floor(100 + Math.random() * 899)}`;
    const newInsp: EquipmentInspectionRecord = {
      id: `ins-${Date.now()}`,
      inspectionNo,
      date: new Date().toISOString().split('T')[0],
      equipmentId: inspForm.equipmentId,
      equipmentName: asset?.name || inspForm.equipmentId,
      inspectionType: inspForm.inspectionType,
      inspector: inspForm.inspector,
      meterReading: asset?.currentMeter || 0,
      engineHydraulicsOk: inspForm.engineHydraulicsOk,
      electricalBrakesOk: inspForm.electricalBrakesOk,
      safetyGuardsOk: inspForm.safetyGuardsOk,
      fluidLeaksOk: inspForm.fluidLeaksOk,
      result: inspForm.result,
      notes: inspForm.notes
    };
    const nextIns = [newInsp, ...inspections];
    setInspections(nextIns);
    equipmentControlService.saveInspections(nextIns);

    if (inspForm.result === 'Fail' || inspForm.result === 'Unsafe') {
      const nextAssets = masterAssets.map(a =>
        a.equipmentId === inspForm.equipmentId
          ? {
              ...a,
              condition: (inspForm.result === 'Unsafe' ? 'Unsafe' : 'Requires Repair') as EquipmentMasterAsset['condition'],
              lifecycleState: 'Maintenance' as AssetLifecycleState
            }
          : a
      );
      setMasterAssets(nextAssets);
      equipmentControlService.saveAssets(nextAssets);
    }

    logUnifiedEvent({
      equipmentId: inspForm.equipmentId,
      date: newInsp.date,
      category: 'Inspection',
      referenceNo: inspectionNo,
      title: `${inspForm.inspectionType} Inspection: ${inspForm.result}`,
      details: inspForm.notes,
      projectCode: asset?.projectCode,
      actor: inspForm.inspector,
      meterReading: asset?.currentMeter
    });
    setIsAddingInspection(false);
  };

  const handleAddWorkOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const asset = masterAssets.find(a => a.equipmentId === woForm.equipmentId);
    const workOrderNo = `WO-2026-${Math.floor(100 + Math.random() * 899)}`;
    const totalCost = Number(woForm.labourCostLKR) + Number(woForm.partsCostLKR);
    const partsUsed = woForm.partsUsedText
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const newWo: MaintenanceWorkOrder = {
      id: `wo-${Date.now()}`,
      workOrderNo,
      date: new Date().toISOString().split('T')[0],
      equipmentId: woForm.equipmentId,
      equipmentName: asset?.name || woForm.equipmentId,
      projectCode: asset?.projectCode || 'FACTORY-POOL',
      orderType: woForm.orderType,
      priority: woForm.priority,
      faultOrScope: woForm.faultOrScope || 'Scheduled service & inspection',
      rootCause: woForm.rootCause,
      technician: woForm.technician,
      workshopBay: woForm.workshopBay,
      downtimeHours: Number(woForm.downtimeHours) || 0,
      labourCostLKR: Number(woForm.labourCostLKR) || 0,
      partsCostLKR: Number(woForm.partsCostLKR) || 0,
      externalCostLKR: 0,
      totalCostLKR: totalCost,
      partsUsed,
      status: 'Open'
    };
    const nextWos = [newWo, ...workOrders];
    setWorkOrders(nextWos);
    equipmentControlService.saveWorkOrders(nextWos);

    const nextAssets = masterAssets.map(a =>
      a.equipmentId === woForm.equipmentId
        ? {
            ...a,
            lifecycleState: (woForm.orderType === 'Breakdown' ? 'Breakdown' : 'Maintenance') as AssetLifecycleState
          }
        : a
    );
    setMasterAssets(nextAssets);
    equipmentControlService.saveAssets(nextAssets);

    logUnifiedEvent({
      equipmentId: woForm.equipmentId,
      date: newWo.date,
      category: woForm.orderType === 'Breakdown' ? 'Breakdown' : 'Maintenance',
      referenceNo: workOrderNo,
      title: `${woForm.orderType} Work Order Opened (${woForm.workshopBay})`,
      details: `${newWo.faultOrScope} · Parts: ${partsUsed.join(', ')}`,
      projectCode: asset?.projectCode,
      actor: woForm.technician,
      meterReading: asset?.currentMeter,
      costImpactLKR: totalCost
    });
    setIsAddingWorkOrder(false);
  };

  const handleCompleteWorkOrder = (wo: MaintenanceWorkOrder) => {
    const nextWos = workOrders.map(w => (w.id === wo.id ? { ...w, status: 'Completed' as const } : w));
    setWorkOrders(nextWos);
    equipmentControlService.saveWorkOrders(nextWos);

    // Reset next service meter if preventive/overhaul
    const nextAssets = masterAssets.map(a =>
      a.equipmentId === wo.equipmentId
        ? {
            ...a,
            lastServiceMeter: a.currentMeter,
            nextServiceMeter: a.currentMeter + a.serviceIntervalHours,
            condition: 'Good' as const,
            lifecycleState: 'Available' as AssetLifecycleState
          }
        : a
    );
    setMasterAssets(nextAssets);
    equipmentControlService.saveAssets(nextAssets);

    logUnifiedEvent({
      equipmentId: wo.equipmentId,
      date: new Date().toISOString().split('T')[0],
      category: 'Maintenance',
      referenceNo: wo.workOrderNo,
      title: `Work Order Completed & Released to Available`,
      details: `Service reset for next interval. Verified by ${wo.technician}`,
      projectCode: wo.projectCode,
      actor: wo.technician,
      costImpactLKR: wo.totalCostLKR
    });
  };

  const handleIssuePart = (partId: string, equipmentId: string) => {
    const targetPart = parts.find(p => p.id === partId);
    if (!targetPart || targetPart.stockQty <= 0) return;

    const nextParts = parts.map(p =>
      p.id === partId
        ? {
            ...p,
            stockQty: p.stockQty - 1,
            status: (p.stockQty - 1 <= p.minStockQty ? 'Low Stock' : 'In Stock') as SparePartTireItem['status']
          }
        : p
    );
    setParts(nextParts);
    equipmentControlService.saveParts(nextParts);

    logUnifiedEvent({
      equipmentId,
      date: new Date().toISOString().split('T')[0],
      category: 'Parts',
      referenceNo: `PI-${targetPart.partNo}`,
      title: `Issued ${targetPart.category}: ${targetPart.name}`,
      details: `Part #${targetPart.partNo} issued from ${targetPart.location}`,
      actor: 'Stores & Spares Controller',
      costImpactLKR: targetPart.unitCostLKR
    });
  };

  const activePassportAsset = useMemo(
    () => masterAssets.find(a => a.equipmentId === passportEquipmentId) || null,
    [masterAssets, passportEquipmentId]
  );

  const exportFleetCSV = () => {
    const headers = ['Equipment ID', 'Name', 'Category', 'Serial', 'Location', 'Project', 'Operator', 'Meter Hrs', 'Next Service', 'State'];
    const rows = filteredAssets.map(a => [
      `"${a.equipmentId}"`,
      `"${a.name}"`,
      `"${a.category}"`,
      `"${a.serialNumber}"`,
      `"${a.location}"`,
      `"${a.projectCode}"`,
      `"${a.assignedOperatorName}"`,
      `"${a.currentMeter}"`,
      `"${a.nextServiceMeter}"`,
      `"${a.lifecycleState}"`
    ]);
    downloadCSV(`equipment-master-${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
  };

  const exportFleetPDF = () => {
    const headers = ['ID', 'Name', 'Project / Site', 'Operator', 'Meter', 'State'];
    const rows = filteredAssets.map(a => [
      a.equipmentId,
      a.name,
      a.projectCode,
      a.assignedOperatorName,
      `${a.currentMeter}h`,
      a.lifecycleState
    ]);
    downloadPDFTable('Equipment & Machinery Master Register', headers, rows, 'equipment-master.pdf', 'Complete lifecycle fleet register');
  };

  return (
    <div className="space-y-2.5 pb-8">
      {/* Minimal Top Ribbon with Cross-Portal Quick Links */}
      <header className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-orange-600 text-white flex items-center justify-center shrink-0">
            <Wrench size={16} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-slate-900 whitespace-nowrap">Equipment & Machinery Control</h1>
              <span className="text-xs text-slate-400 hidden md:inline">
                · Asset → Allocation → Meter/Fuel → Inspection → Maintenance → Parts → Cost → History
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap shrink-0">
          {handleNavigatePortal && (
            <>
              <button
                type="button"
                onClick={() => handleNavigatePortal('projects')}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>Projects</span>
                <ExternalLink size={11} />
              </button>
              <button
                type="button"
                onClick={() => handleNavigatePortal('resource-management', 'certifications')}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>Workforce</span>
                <ExternalLink size={11} />
              </button>
              <button
                type="button"
                onClick={() => handleNavigatePortal('procurement', 'pr')}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>Procurement</span>
                <ExternalLink size={11} />
              </button>
              <button
                type="button"
                onClick={() => handleNavigatePortal('operational-control', 'resource')}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>Plant Bay</span>
                <ExternalLink size={11} />
              </button>
            </>
          )}
          <ExportActions onExportCSV={exportFleetCSV} onExportPDF={exportFleetPDF} labelCSV="CSV" labelPDF="PDF" />
        </div>
      </header>

      {/* Simple Words Navigation Tabs */}
      <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 overflow-x-auto gap-1">
        {[
          { id: 'landing', label: 'Command Hub', icon: LayoutDashboard },
          { id: 'inventory', label: `1. Master Registry (${masterAssets.length})`, icon: Wrench },
          { id: 'allocation', label: '2. Site Allocation & Handover', icon: Truck },
          { id: 'operations', label: '3. Meter & Fuel Log', icon: Gauge },
          { id: 'inspections', label: '4. Inspections & Compliance', icon: CheckCircle2 },
          { id: 'maintenance', label: `5. Maintenance & WO (${workOrders.length})`, icon: Settings },
          { id: 'parts_cost', label: '6. Parts, Cost & KPIs', icon: DollarSign }
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              const nextTab = tab.id as EquipmentTab;
              setActiveTab(nextTab);
              onTabChange?.(nextTab);
            }}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer",
              activeTab === tab.id
                ? "bg-white text-slate-900 shadow-2xs border border-slate-200/80 font-bold"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            )}
          >
            <tab.icon size={13} className={activeTab === tab.id ? "text-orange-600" : "text-slate-400"} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 0: COMMAND HUB */}
      {activeTab === 'landing' && (
        <EquipmentLandingPage
          equipment={equipment}
          masterAssets={masterAssets}
          projects={projects}
          onNavigateTab={t => {
            setActiveTab(t);
            onTabChange?.(t);
          }}
          onOpenAddEquipment={() => {
            setActiveTab('inventory');
            setIsAddingAsset(true);
          }}
          onOpenMachinePassport={eqId => setPassportEquipmentId(eqId)}
          onNavigatePortal={handleNavigatePortal}
          onExportCSV={exportFleetCSV}
          onExportPDF={exportFleetPDF}
        />
      )}

      {/* TAB 1: MASTER REGISTRY & 360° MACHINE PASSPORT */}
      {activeTab === 'inventory' && (
        <div className="space-y-3 text-xs">
          {/* Filter Bar */}
          <div className="p-3 bg-white border border-slate-200 rounded-xl flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 flex-wrap flex-1">
              <div className="relative min-w-[210px] flex-1 max-w-xs">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search ID, machine, serial, site, operator..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-orange-500"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium"
              >
                <option value="All">All Categories ({EQUIPMENT_CATEGORIES.length})</option>
                {EQUIPMENT_CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <select
                value={stateFilter}
                onChange={e => setStateFilter(e.target.value as any)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium"
              >
                <option value="All">All Lifecycle States</option>
                <option value="Operating">Operating</option>
                <option value="Available">Available</option>
                <option value="Allocated">Allocated</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Breakdown">Breakdown</option>
                <option value="Retired">Retired / Disposed</option>
              </select>

              <select
                value={projectFilter}
                onChange={e => setProjectFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium"
              >
                <option value="All">All Projects / Sites</option>
                {projects.map(p => (
                  <option key={p.id} value={p.projectCode || p.projectName}>
                    {p.projectCode ? `[${p.projectCode}] ` : ''}{p.projectName}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingAsset(null);
                setAssetForm({
                  equipmentId: `EQ-${Math.floor(100 + Math.random() * 900)}`,
                  name: '',
                  category: 'Heavy Machinery',
                  manufacturer: '',
                  model: '',
                  serialNumber: '',
                  ownershipType: 'Owned',
                  purchasePrice: 8500000,
                  internalHourlyRate: 3500,
                  currentMeter: 0,
                  serviceIntervalHours: 250,
                  location: 'Main Factory Bay 1',
                  projectCode: 'PRJ-HYATT-B',
                  assignedOperatorName: 'Kasun Perera',
                  lifecycleState: 'Available',
                  calibrationDue: '2027-06-30',
                  insuranceExpiry: '2027-06-30',
                  warrantyExpiry: '2027-06-30',
                  attachmentsText: 'Standard Bucket, Safety Guard'
                });
                setIsAddingAsset(true);
              }}
              className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Plus size={13} />
              <span>Add Machine</span>
            </button>
          </div>

          {/* High-Density Single-Line Master Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    <th className="py-2.5 px-3">Equipment ID</th>
                    <th className="py-2.5 px-3">Machine Name & Model</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Site / Project</th>
                    <th className="py-2.5 px-3">Operator</th>
                    <th className="py-2.5 px-3">Meter & Service Due</th>
                    <th className="py-2.5 px-3">Calibration</th>
                    <th className="py-2.5 px-3">Lifecycle State</th>
                    <th className="py-2.5 px-3 text-right">360° History & Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAssets.map(item => {
                    const remHrs = item.nextServiceMeter - item.currentMeter;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/70 whitespace-nowrap">
                        <td className="py-2.5 px-3">
                          <button
                            type="button"
                            onClick={() => setPassportEquipmentId(item.equipmentId)}
                            className="font-mono font-bold text-slate-900 hover:text-orange-600 flex items-center gap-1 cursor-pointer"
                            title="Open 360° Machine Passport & Complete History"
                          >
                            <QrCode size={12} className="text-orange-500" />
                            <span>{item.equipmentId}</span>
                          </button>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-slate-900">{item.name}</span>
                          <span className="text-slate-400 ml-1.5 text-[11px] font-mono">({item.model})</span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">{item.category}</td>
                        <td className="py-2.5 px-3">
                          <span className="font-mono text-blue-600 font-semibold">{item.projectCode}</span>
                          <span className="text-slate-400 mx-1">·</span>
                          <span className="text-slate-600">{item.location}</span>
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-800">{item.assignedOperatorName}</td>
                        <td className="py-2.5 px-3 font-mono">
                          <span className="font-bold text-slate-900">{item.currentMeter.toLocaleString()}h</span>
                          <span className={cn("ml-1.5 text-[11px]", remHrs <= 25 ? "text-rose-600 font-bold" : "text-slate-500")}>
                            ({remHrs}h to {item.nextServiceMeter}h)
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={cn(
                            "text-[11px] font-semibold",
                            item.calibrationStatus === 'Expired' ? "text-rose-600 font-bold" :
                            item.calibrationStatus === 'Expiring' ? "text-amber-600" : "text-emerald-700"
                          )}>
                            {item.calibrationStatus === 'Expired' ? 'Locked (Expired)' : item.calibrationDue}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={cn(
                            "text-[11px] font-bold",
                            item.lifecycleState === 'Operating' || item.lifecycleState === 'Available' ? "text-emerald-700" :
                            item.lifecycleState === 'Allocated' ? "text-blue-700" :
                            item.lifecycleState === 'Breakdown' ? "text-rose-600" : "text-amber-700"
                          )}>
                            {item.lifecycleState}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setPassportEquipmentId(item.equipmentId)}
                              className="px-2.5 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-[11px] font-semibold cursor-pointer"
                            >
                              Passport & History
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingAsset(item);
                                setAssetForm({
                                  equipmentId: item.equipmentId,
                                  name: item.name,
                                  category: item.category,
                                  manufacturer: item.manufacturer,
                                  model: item.model,
                                  serialNumber: item.serialNumber,
                                  ownershipType: item.ownershipType,
                                  purchasePrice: item.purchasePrice,
                                  internalHourlyRate: item.internalHourlyRate,
                                  currentMeter: item.currentMeter,
                                  serviceIntervalHours: item.serviceIntervalHours,
                                  location: item.location,
                                  projectCode: item.projectCode,
                                  assignedOperatorName: item.assignedOperatorName,
                                  lifecycleState: item.lifecycleState,
                                  calibrationDue: item.calibrationDue,
                                  insuranceExpiry: item.insuranceExpiry,
                                  warrantyExpiry: item.warrantyExpiry,
                                  attachmentsText: item.attachments.join(', ')
                                });
                              }}
                              className="p-1 text-slate-400 hover:text-slate-800 rounded cursor-pointer"
                              title="Edit Machine"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteAsset(item.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                              title="Delete Machine"
                            >
                              <Trash2 size={12} />
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
        </div>
      )}

      {/* TAB 2: ALLOCATION, MOBILIZATION & HANDOVER */}
      {activeTab === 'allocation' && (
        <EquipmentAllocationModule
          assets={masterAssets}
          operators={operators}
          allocations={allocations}
          projects={projects}
          onCreateAllocation={handleCreateAllocation}
          onNavigatePortal={onNavigatePortal}
        />
      )}

      {/* TAB 3: DAILY LOG, HOUR METER & FUEL */}
      {activeTab === 'operations' && (
        <EquipmentOperationsModule
          assets={masterAssets}
          dailyLogs={dailyLogs}
          onAddDailyLog={handleAddDailyLog}
        />
      )}

      {/* TAB 4: INSPECTIONS, CALIBRATION & COMPLIANCE */}
      {activeTab === 'inspections' && (
        <div className="space-y-3 text-xs">
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Safety Inspections, Calibration Lock & Legal Documents</h3>
              <p className="text-xs text-slate-500">
                Pre-start, daily & safety checklists, expired calibration usage restrictions, insurance & lifting certificates.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddingInspection(true)}
              className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Plus size={13} />
              <span>Record Inspection</span>
            </button>
          </div>

          {/* Inspection Checklists Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 font-bold text-slate-800">
              Machine Inspection Records ({inspections.length})
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/60 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    <th className="py-2 px-3">Ref / Date</th>
                    <th className="py-2 px-3">Machine</th>
                    <th className="py-2 px-3">Inspection Type</th>
                    <th className="py-2 px-3">Meter</th>
                    <th className="py-2 px-3">Checklist Systems</th>
                    <th className="py-2 px-3">Inspector</th>
                    <th className="py-2 px-3">Result</th>
                    <th className="py-2 px-3">Findings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {inspections.map(ins => (
                    <tr key={ins.id} className="hover:bg-slate-50/70 whitespace-nowrap">
                      <td className="py-2.5 px-3 font-mono">
                        <span className="font-bold text-slate-900">{ins.inspectionNo}</span>
                        <span className="text-slate-400 ml-1.5">{ins.date}</span>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{ins.equipmentId}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-700">{ins.inspectionType}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{ins.meterReading}h</td>
                      <td className="py-2.5 px-3 text-slate-600">
                        Hydraulics: {ins.engineHydraulicsOk ? 'OK' : 'Fail'} · Brakes: {ins.electricalBrakesOk ? 'OK' : 'Fail'} · Guards: {ins.safetyGuardsOk ? 'OK' : 'Fail'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">{ins.inspector}</td>
                      <td className="py-2.5 px-3">
                        <span className={cn(
                          "font-bold",
                          ins.result === 'Pass' ? "text-emerald-700" :
                          ins.result === 'Pass with Observation' ? "text-amber-700" : "text-rose-600"
                        )}>
                          {ins.result}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate">{ins.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Statutory Compliance, Calibration, Insurance & Warranty Vault */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="font-bold text-slate-800">Legal Compliance, Insurance, Lifting Certificates & Warranty ({docs.length})</span>
              <span className="text-[11px] text-slate-500">Expired calibration automatically locks site allocation</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/60 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    <th className="py-2 px-3">Document #</th>
                    <th className="py-2 px-3">Machine</th>
                    <th className="py-2 px-3">Document Type</th>
                    <th className="py-2 px-3">Authority / Insurer</th>
                    <th className="py-2 px-3">Issue Date</th>
                    <th className="py-2 px-3">Expiry Date</th>
                    <th className="py-2 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {docs.map(d => (
                    <tr key={d.id} className="hover:bg-slate-50/70 whitespace-nowrap">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{d.docNo}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{d.equipmentId}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">{d.docType}</td>
                      <td className="py-2.5 px-3 text-slate-600">{d.provider}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">{d.issueDate}</td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-slate-900">{d.expiryDate}</td>
                      <td className="py-2.5 px-3">
                        <span className={cn(
                          "font-bold",
                          d.status === 'Valid' ? "text-emerald-700" :
                          d.status === 'Expiring Soon' ? "text-amber-700" : "text-rose-600"
                        )}>
                          {d.status === 'Expired' ? 'Expired (Usage Restricted)' : d.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: PREVENTIVE MAINTENANCE, BREAKDOWNS & WORK ORDERS */}
      {activeTab === 'maintenance' && (
        <div className="space-y-3 text-xs">
          {/* 250h Service Interval Countdown Strip */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-900">Automatic Interval Service Countdown (Every 250 / 500 Engine Hours)</span>
              <button
                type="button"
                onClick={() => setIsAddingWorkOrder(true)}
                className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={13} />
                <span>Create Work Order / Report Breakdown</span>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {masterAssets.map(a => {
                const remaining = a.nextServiceMeter - a.currentMeter;
                const dueSoon = remaining <= 25;
                return (
                  <div key={a.id} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/60 flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 truncate">{a.equipmentId} · {a.name}</div>
                      <div className="text-[11px] font-mono text-slate-500">
                        Current: {a.currentMeter}h → Next: {a.nextServiceMeter}h
                      </div>
                    </div>
                    <span className={cn(
                      "font-mono text-[11px] font-bold px-2 py-0.5 rounded shrink-0",
                      dueSoon ? "bg-rose-50 text-rose-700 border border-rose-200" : "bg-emerald-50 text-emerald-700"
                    )}>
                      {remaining}h left
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Work Orders & Workshop Bays Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="font-bold text-slate-900">Work Orders, Breakdowns & Workshop Bays ({workOrders.length})</span>
              <span className="text-[11px] text-slate-500">Click Release to complete repair and reset service interval</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/60 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    <th className="py-2.5 px-3">Work Order #</th>
                    <th className="py-2.5 px-3">Machine</th>
                    <th className="py-2.5 px-3">Type & Priority</th>
                    <th className="py-2.5 px-3">Workshop Bay / Tech</th>
                    <th className="py-2.5 px-3">Fault / Scope & Parts</th>
                    <th className="py-2.5 px-3">Downtime</th>
                    <th className="py-2.5 px-3">Total Cost</th>
                    <th className="py-2.5 px-3 text-right">Status / Release</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {workOrders.map(wo => (
                    <tr key={wo.id} className="hover:bg-slate-50/70 whitespace-nowrap">
                      <td className="py-2.5 px-3 font-mono">
                        <span className="font-bold text-slate-900">{wo.workOrderNo}</span>
                        <span className="text-slate-400 ml-1.5">{wo.date}</span>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{wo.equipmentId}</td>
                      <td className="py-2.5 px-3">
                        <span className={cn(
                          "font-bold",
                          wo.orderType === 'Breakdown' ? "text-rose-600" : "text-blue-700"
                        )}>
                          {wo.orderType}
                        </span>
                        <span className="text-slate-400"> · {wo.priority}</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">
                        <strong>{wo.workshopBay}</strong> · {wo.technician}
                      </td>
                      <td className="py-2.5 px-3 max-w-xs truncate" title={wo.faultOrScope}>
                        <span className="text-slate-800">{wo.faultOrScope}</span>
                        {wo.partsUsed.length > 0 && (
                          <span className="text-slate-400 ml-1">[{wo.partsUsed.join(', ')}]</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-700">{wo.downtimeHours} hrs</td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-slate-900">
                        LKR {wo.totalCostLKR.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {wo.status !== 'Completed' ? (
                          <button
                            type="button"
                            onClick={() => handleCompleteWorkOrder(wo)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold cursor-pointer"
                          >
                            Complete & Release
                          </button>
                        ) : (
                          <span className="text-emerald-700 font-bold inline-flex items-center gap-1">
                            <Check size={12} /> Completed
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: SPARE PARTS, TIRES, COST (TCO) & KPIs */}
      {activeTab === 'parts_cost' && (
        <EquipmentPartsCostModule
          assets={masterAssets}
          parts={parts}
          dailyLogs={dailyLogs}
          workOrders={workOrders}
          onIssuePart={handleIssuePart}
          onNavigatePortal={handleNavigatePortal}
        />
      )}

      {/* 360° Machine Passport & Complete History Modal */}
      <MachinePassportModal
        asset={activePassportAsset}
        events={events}
        totalFuelCost={
          activePassportAsset
            ? dailyLogs
                .filter(l => l.equipmentId === activePassportAsset.equipmentId)
                .reduce((s, l) => s + l.fuelCostLKR + l.lubricantCostLKR, 0)
            : 0
        }
        totalMaintenanceCost={
          activePassportAsset
            ? workOrders
                .filter(w => w.equipmentId === activePassportAsset.equipmentId)
                .reduce((s, w) => s + w.totalCostLKR, 0)
            : 0
        }
        onClose={() => setPassportEquipmentId(null)}
        onChangeLifecycleState={handleChangeLifecycleState}
        onNavigatePortal={handleNavigatePortal}
      />

      {/* Add / Edit Machine Modal */}
      {(isAddingAsset || editingAsset) && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                {editingAsset ? `Edit Machine: ${editingAsset.equipmentId}` : 'Register New Machine / Asset'}
              </h3>
              <button
                onClick={() => {
                  setIsAddingAsset(false);
                  setEditingAsset(null);
                }}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveAssetSubmit} className="p-5 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Equipment ID *</label>
                  <input
                    type="text"
                    required
                    value={assetForm.equipmentId}
                    onChange={e => setAssetForm({ ...assetForm, equipmentId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category *</label>
                  <select
                    value={assetForm.category}
                    onChange={e => setAssetForm({ ...assetForm, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  >
                    {EQUIPMENT_CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Machine Name *</label>
                <input
                  type="text"
                  required
                  value={assetForm.name}
                  onChange={e => setAssetForm({ ...assetForm, name: e.target.value })}
                  placeholder="e.g. CAT 320 Hydraulic Excavator"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Manufacturer</label>
                  <input
                    type="text"
                    value={assetForm.manufacturer}
                    onChange={e => setAssetForm({ ...assetForm, manufacturer: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Model</label>
                  <input
                    type="text"
                    value={assetForm.model}
                    onChange={e => setAssetForm({ ...assetForm, model: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Serial Number</label>
                  <input
                    type="text"
                    value={assetForm.serialNumber}
                    onChange={e => setAssetForm({ ...assetForm, serialNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Current Meter (h)</label>
                  <input
                    type="number"
                    value={assetForm.currentMeter}
                    onChange={e => setAssetForm({ ...assetForm, currentMeter: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Service Interval (h)</label>
                  <input
                    type="number"
                    value={assetForm.serviceIntervalHours}
                    onChange={e => setAssetForm({ ...assetForm, serviceIntervalHours: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Internal Rate (LKR/h)</label>
                  <input
                    type="number"
                    value={assetForm.internalHourlyRate}
                    onChange={e => setAssetForm({ ...assetForm, internalHourlyRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Location / Site</label>
                  <input
                    type="text"
                    value={assetForm.location}
                    onChange={e => setAssetForm({ ...assetForm, location: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Project Code</label>
                  <input
                    type="text"
                    value={assetForm.projectCode}
                    onChange={e => setAssetForm({ ...assetForm, projectCode: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Operator</label>
                  <input
                    type="text"
                    value={assetForm.assignedOperatorName}
                    onChange={e => setAssetForm({ ...assetForm, assignedOperatorName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Attachments (comma separated)</label>
                <input
                  type="text"
                  value={assetForm.attachmentsText}
                  onChange={e => setAssetForm({ ...assetForm, attachmentsText: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingAsset(false);
                    setEditingAsset(null);
                  }}
                  className="px-4 py-1.5 border border-slate-200 rounded-lg text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold cursor-pointer"
                >
                  {editingAsset ? 'Save Changes' : 'Register Machine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Inspection Modal */}
      {isAddingInspection && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Record Machine Inspection</h3>
              <button onClick={() => setIsAddingInspection(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleAddInspectionSubmit} className="p-5 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Machine</label>
                  <select
                    value={inspForm.equipmentId}
                    onChange={e => setInspForm({ ...inspForm, equipmentId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  >
                    {masterAssets.map(a => (
                      <option key={a.id} value={a.equipmentId}>{a.equipmentId} - {a.name.slice(0, 22)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Inspection Type</label>
                  <select
                    value={inspForm.inspectionType}
                    onChange={e => setInspForm({ ...inspForm, inspectionType: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="Pre-Start">Pre-Start</option>
                    <option value="Daily">Daily</option>
                    <option value="Pre-Mobilization">Pre-Mobilization</option>
                    <option value="Return">Return</option>
                    <option value="Safety">Safety</option>
                    <option value="Calibration">Calibration</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Inspector</label>
                  <input
                    type="text"
                    value={inspForm.inspector}
                    onChange={e => setInspForm({ ...inspForm, inspector: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Result</label>
                  <select
                    value={inspForm.result}
                    onChange={e => setInspForm({ ...inspForm, result: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="Pass">Pass</option>
                    <option value="Pass with Observation">Pass with Observation</option>
                    <option value="Fail">Fail (Send to Maintenance)</option>
                    <option value="Unsafe">Unsafe (Stop Machine)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Checklist Findings</label>
                <input
                  type="text"
                  value={inspForm.notes}
                  onChange={e => setInspForm({ ...inspForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setIsAddingInspection(false)} className="px-4 py-1.5 border border-slate-200 rounded-lg text-slate-600">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold cursor-pointer">
                  Save Inspection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Work Order / Breakdown Modal */}
      {isAddingWorkOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Create Maintenance / Breakdown Work Order</h3>
              <button onClick={() => setIsAddingWorkOrder(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleAddWorkOrderSubmit} className="p-5 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Machine</label>
                  <select
                    value={woForm.equipmentId}
                    onChange={e => setWoForm({ ...woForm, equipmentId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  >
                    {masterAssets.map(a => (
                      <option key={a.id} value={a.equipmentId}>{a.equipmentId} - {a.name.slice(0, 22)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Work Order Type</label>
                  <select
                    value={woForm.orderType}
                    onChange={e => setWoForm({ ...woForm, orderType: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="Preventive">Preventive (250h Service)</option>
                    <option value="Corrective">Corrective Repair</option>
                    <option value="Breakdown">Emergency Breakdown</option>
                    <option value="Overhaul">Major Overhaul</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Workshop Bay</label>
                  <input
                    type="text"
                    value={woForm.workshopBay}
                    onChange={e => setWoForm({ ...woForm, workshopBay: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Technician</label>
                  <input
                    type="text"
                    value={woForm.technician}
                    onChange={e => setWoForm({ ...woForm, technician: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Downtime (h)</label>
                  <input
                    type="number"
                    value={woForm.downtimeHours}
                    onChange={e => setWoForm({ ...woForm, downtimeHours: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Labour (LKR)</label>
                  <input
                    type="number"
                    value={woForm.labourCostLKR}
                    onChange={e => setWoForm({ ...woForm, labourCostLKR: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Parts (LKR)</label>
                  <input
                    type="number"
                    value={woForm.partsCostLKR}
                    onChange={e => setWoForm({ ...woForm, partsCostLKR: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Fault / Service Scope *</label>
                <input
                  type="text"
                  required
                  value={woForm.faultOrScope}
                  onChange={e => setWoForm({ ...woForm, faultOrScope: e.target.value })}
                  placeholder="Describe repair or service performed..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Parts Used (comma separated)</label>
                <input
                  type="text"
                  value={woForm.partsUsedText}
                  onChange={e => setWoForm({ ...woForm, partsUsedText: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setIsAddingWorkOrder(false)} className="px-4 py-1.5 border border-slate-200 rounded-lg text-slate-600">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold cursor-pointer">
                  Save Work Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
