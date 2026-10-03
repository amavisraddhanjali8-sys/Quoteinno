import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Plus,
  Wrench,
  Gauge,
  Truck,
  Calendar,
  ShieldAlert,
  LayoutDashboard,
  Folder,
  Users,
  DollarSign,
  ShieldCheck,
  ExternalLink,
  CheckCircle2,
  Settings,
  Activity,
  X
} from 'lucide-react';
import { centralApiGateway } from '../../../services/centralApiGateway';
import {
  WorkCenter,
  MachineResource,
  ToolOrEquipment,
  FleetVehicle,
  ResourceAllocationSlot,
  MaintenanceRecord
} from '../../../types/operationalControl';
import { useSecurity } from '../../../context/SecurityContext';
import {
  PortalCommandCenterLanding,
  QuickActionGroup,
  CommandPrimaryPortal
} from '../../common/PortalCommandCenterLanding';
import type { OperationalPortalId } from '../OperationalControlCenter';
import { toast } from 'sonner';
import { RoleScopedFactoryProjectHub } from './RoleScopedFactoryProjectHub';

interface ResourcePortalProps {
  onSwitchPortal?: (portalId: OperationalPortalId) => void;
  onNavigateHome?: () => void;
}

export const ResourcePortal: React.FC<ResourcePortalProps> = ({
  onSwitchPortal
}) => {
  const { currentUser } = useSecurity();
  const [activeTab, setActiveTab] = useState<
    'hub' | 'machines' | 'work_centers' | 'tools' | 'fleet' | 'allocations' | 'maintenance'
  >('hub');

  const [workCenters, setWorkCenters] = useState<WorkCenter[]>([]);
  const [machines, setMachines] = useState<MachineResource[]>([]);
  const [tools, setTools] = useState<ToolOrEquipment[]>([]);
  const [vehicles, setVehicles] = useState<FleetVehicle[]>([]);
  const [allocations, setAllocations] = useState<ResourceAllocationSlot[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceRecord[]>([]);

  // Modal: Allocate Resource
  const [isAllocating, setIsAllocating] = useState(false);
  const [allocType, setAllocType] = useState<ResourceAllocationSlot['resourceType']>('Machine');
  const [allocResName, setAllocResName] = useState('Trumpf TruLaser 12kW');
  const [allocProjectCode, setAllocProjectCode] = useState('PRJ-2026-001');
  const [allocHours, setAllocHours] = useState(40);

  // Modal: Add Machine
  const [isAddingMachine, setIsAddingMachine] = useState(false);
  const [newMachineName, setNewMachineName] = useState('');
  const [newMachineCode, setNewMachineCode] = useState('');
  const [newMachineSpec, setNewMachineSpec] = useState('');
  const [newMachineCalDate, setNewMachineCalDate] = useState('2026-12-31');

  useEffect(() => {
    try {
      setWorkCenters(centralApiGateway.getWorkCenters(currentUser));
      setMachines(centralApiGateway.getMachines(currentUser));
      setTools(centralApiGateway.getTools(currentUser));
      setVehicles(centralApiGateway.getVehicles(currentUser));
      setAllocations(centralApiGateway.getAllocations(currentUser));
      setMaintenance(centralApiGateway.getMaintenanceRecords(currentUser));
    } catch (e) {
      console.error(e);
    }
  }, [currentUser]);

  const handleCreateAllocation = () => {
    try {
      const targetMachine = machines.find(m => m.name === allocResName);
      if (targetMachine && new Date(targetMachine.nextCalibrationDue) < new Date()) {
        toast.error(`Calibration Lock: ${allocResName} calibration expired (${targetMachine.nextCalibrationDue})`);
        return;
      }

      centralApiGateway.allocateResource(currentUser, {
        resourceType: allocType,
        resourceId: `res-${Date.now()}`,
        resourceName: allocResName,
        projectId: 'proj-001',
        projectCode: allocProjectCode,
        startDate: '2026-09-26',
        endDate: '2026-10-10',
        allocatedHours: allocHours,
        allocatedPercent: 90
      });
      setAllocations(centralApiGateway.getAllocations(currentUser));
      setIsAllocating(false);
      toast.success(`Allocated ${allocResName} to ${allocProjectCode}`);
    } catch (err: any) {
      toast.error(err.message || 'Allocation failed');
    }
  };

  const handleAddMachine = () => {
    if (!newMachineName.trim() || !newMachineCode.trim()) return;
    const created: MachineResource = {
      id: `m-${Date.now()}`,
      machineCode: newMachineCode.toUpperCase(),
      name: newMachineName.trim(),
      workCenterId: workCenters[0]?.id || 'wc-01',
      brandModel: 'Industrial CNC Pro',
      serialNumber: `SN-${Math.floor(10000 + Math.random() * 90000)}`,
      tonnageOrSpec: newMachineSpec || 'Standard Industrial',
      installationDate: new Date().toISOString().split('T')[0],
      lastCalibrationDate: new Date().toISOString().split('T')[0],
      status: 'Running',
      utilizationRatePercent: 85,
      totalOperatingHours: 120,
      nextCalibrationDue: newMachineCalDate
    };
    setMachines(prev => [created, ...prev]);
    setIsAddingMachine(false);
    setNewMachineName('');
    setNewMachineCode('');
    setNewMachineSpec('');
    toast.success(`Added machine ${created.machineCode}`);
  };

  const quickActionGroups: QuickActionGroup[] = [
    {
      portalId: 'cnc-machines',
      portalName: 'CNC & Heavy Machinery',
      portalIcon: Cpu,
      actions: [
        {
          id: 'qa-m-list',
          label: 'CNC Machines',
          icon: Cpu,
          action: () => setActiveTab('machines'),
          color: 'bg-cyan-600 text-white'
        },
        {
          id: 'qa-m-add',
          label: 'Add Machine',
          icon: Plus,
          action: () => {
            setActiveTab('machines');
            setIsAddingMachine(true);
          },
          color: 'bg-slate-900 text-white'
        },
        {
          id: 'qa-m-shop',
          label: 'Shop Floor',
          icon: Activity,
          action: () => onSwitchPortal && onSwitchPortal('shop_floor'),
          color: 'bg-slate-100 text-slate-800'
        }
      ]
    },
    {
      portalId: 'work-centers',
      portalName: 'Work Centers & Bays',
      portalIcon: Settings,
      actions: [
        {
          id: 'qa-wc-list',
          label: 'Work Centers',
          icon: Settings,
          action: () => setActiveTab('work_centers'),
          color: 'bg-indigo-600 text-white'
        },
        {
          id: 'qa-wc-alloc',
          label: 'Book Bay',
          icon: Calendar,
          action: () => {
            setAllocType('WorkCenter');
            setIsAllocating(true);
          },
          color: 'bg-slate-900 text-white'
        },
        {
          id: 'qa-wc-hr',
          label: 'Bay Crew',
          icon: Users,
          action: () => onSwitchPortal && onSwitchPortal('hr'),
          color: 'bg-slate-100 text-slate-800'
        }
      ]
    },
    {
      portalId: 'precision-tools',
      portalName: 'Precision Tools & Gauges',
      portalIcon: Gauge,
      actions: [
        {
          id: 'qa-tl-list',
          label: 'Tool Registry',
          icon: Gauge,
          action: () => setActiveTab('tools'),
          color: 'bg-amber-600 text-white'
        },
        {
          id: 'qa-tl-cal',
          label: 'Calibration Lock',
          icon: ShieldAlert,
          action: () => setActiveTab('maintenance'),
          color: 'bg-slate-900 text-white'
        },
        {
          id: 'qa-tl-qc',
          label: 'QA/QC Checks',
          icon: ShieldCheck,
          action: () => onSwitchPortal && onSwitchPortal('quality'),
          color: 'bg-slate-100 text-slate-800'
        }
      ]
    },
    {
      portalId: 'logistics-fleet',
      portalName: 'Logistics & Transport Fleet',
      portalIcon: Truck,
      actions: [
        {
          id: 'qa-fl-list',
          label: 'Fleet Vehicles',
          icon: Truck,
          action: () => setActiveTab('fleet'),
          color: 'bg-emerald-600 text-white'
        },
        {
          id: 'qa-fl-dispatch',
          label: 'Dispatch Vehicle',
          icon: Plus,
          action: () => {
            setAllocType('Vehicle');
            setIsAllocating(true);
          },
          color: 'bg-slate-900 text-white'
        },
        {
          id: 'qa-fl-proj',
          label: 'Project Sites',
          icon: Folder,
          action: () => onSwitchPortal && onSwitchPortal('project_management'),
          color: 'bg-slate-100 text-slate-800'
        }
      ]
    },
    {
      portalId: 'capacity-alloc',
      portalName: 'Capacity & Project Booking',
      portalIcon: Calendar,
      actions: [
        {
          id: 'qa-al-cal',
          label: 'Allocations',
          icon: Calendar,
          action: () => setActiveTab('allocations'),
          color: 'bg-blue-600 text-white'
        },
        {
          id: 'qa-al-new',
          label: 'Allocate Asset',
          icon: Plus,
          action: () => setIsAllocating(true),
          color: 'bg-slate-900 text-white'
        },
        {
          id: 'qa-al-fin',
          label: 'Hourly Costing',
          icon: DollarSign,
          action: () => onSwitchPortal && onSwitchPortal('finance'),
          color: 'bg-slate-100 text-slate-800'
        }
      ]
    },
    {
      portalId: 'plant-maint',
      portalName: 'Plant Maintenance & Service',
      portalIcon: Wrench,
      actions: [
        {
          id: 'qa-pm-list',
          label: 'Service Schedule',
          icon: Wrench,
          action: () => setActiveTab('maintenance'),
          color: 'bg-rose-600 text-white'
        },
        {
          id: 'qa-pm-cal',
          label: 'Calibration Log',
          icon: CheckCircle2,
          action: () => setActiveTab('maintenance'),
          color: 'bg-slate-900 text-white'
        },
        {
          id: 'qa-pm-exec',
          label: 'Executive KPI',
          icon: Activity,
          action: () => onSwitchPortal && onSwitchPortal('executive'),
          color: 'bg-slate-100 text-slate-800'
        }
      ]
    }
  ];

  const directoryPortals: CommandPrimaryPortal[] = [
    {
      id: 'dir-plant-machines',
      name: 'CNC & Plant Bays',
      shortLabel: 'CNC & Bays',
      icon: Cpu,
      badge: `${machines.length} CNC`,
      onLaunch: () => setActiveTab('machines'),
      subPortals: [
        {
          id: 'sub-cnc',
          name: 'Heavy CNC Machinery',
          icon: Cpu,
          badge: 'Plant',
          onLaunch: () => setActiveTab('machines'),
          subSubPortals: [
            {
              id: 'act-cnc-1',
              name: 'CNC Machine Operations',
              icon: Cpu,
              badge: 'Plant',
              actions: [
                { id: 'a-cnc-1', name: 'View CNC Machines', icon: Cpu, action: () => setActiveTab('machines'), badge: 'View' },
                { id: 'a-cnc-2', name: 'Add Machine Asset', icon: Plus, action: () => { setActiveTab('machines'); setIsAddingMachine(true); }, badge: 'Create' },
                { id: 'a-cnc-3', name: 'Open Shop Floor Terminal', icon: ExternalLink, action: () => onSwitchPortal && onSwitchPortal('shop_floor'), badge: 'Portal' }
              ]
            }
          ]
        },
        {
          id: 'sub-wc',
          name: 'Work Center Bays',
          icon: Settings,
          badge: 'Bays',
          onLaunch: () => setActiveTab('work_centers'),
          subSubPortals: [
            {
              id: 'act-wc-1',
              name: 'Bay Capacity & Crew',
              icon: Settings,
              badge: 'Bays',
              actions: [
                { id: 'a-wc-1', name: 'View Work Centers', icon: Settings, action: () => setActiveTab('work_centers'), badge: 'View' },
                { id: 'a-wc-2', name: 'Open HR Crew Roster', icon: Users, action: () => onSwitchPortal && onSwitchPortal('hr'), badge: 'Link' }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'dir-tools-fleet',
      name: 'Tools & Fleet Logistics',
      shortLabel: 'Tools & Fleet',
      icon: Truck,
      badge: `${tools.length} Tools`,
      onLaunch: () => setActiveTab('tools'),
      subPortals: [
        {
          id: 'sub-tools',
          name: 'Precision Tools & Calibration',
          icon: Gauge,
          badge: 'ISO',
          onLaunch: () => setActiveTab('tools'),
          subSubPortals: [
            {
              id: 'act-tl-1',
              name: 'Metrology & Calibration',
              icon: Gauge,
              badge: 'ISO',
              actions: [
                { id: 'a-tl-1', name: 'View Tool Registry', icon: Gauge, action: () => setActiveTab('tools'), badge: 'View' },
                { id: 'a-tl-2', name: 'Open QA/QC Portal', icon: ShieldCheck, action: () => onSwitchPortal && onSwitchPortal('quality'), badge: 'Link' }
              ]
            }
          ]
        },
        {
          id: 'sub-fleet',
          name: 'Transport & Heavy Fleet',
          icon: Truck,
          badge: 'Logistics',
          onLaunch: () => setActiveTab('fleet'),
          subSubPortals: [
            {
              id: 'act-fl-1',
              name: 'Logistics Dispatch',
              icon: Truck,
              badge: 'Fleet',
              actions: [
                { id: 'a-fl-1', name: 'View Logistics Fleet', icon: Truck, action: () => setActiveTab('fleet'), badge: 'View' },
                { id: 'a-fl-2', name: 'Dispatch to Project', icon: Plus, action: () => { setAllocType('Vehicle'); setIsAllocating(true); }, badge: 'Dispatch' }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'dir-alloc-maint',
      name: 'Allocations & Maintenance',
      shortLabel: 'Bookings & PM',
      icon: Wrench,
      badge: `${allocations.length} Active`,
      onLaunch: () => setActiveTab('allocations'),
      subPortals: [
        {
          id: 'sub-alloc',
          name: 'Project Resource Booking',
          icon: Calendar,
          badge: 'Schedule',
          onLaunch: () => setActiveTab('allocations'),
          subSubPortals: [
            {
              id: 'act-al-1',
              name: 'Slot Bookings',
              icon: Calendar,
              badge: 'Slots',
              actions: [
                { id: 'a-al-1', name: 'View Allocations', icon: Calendar, action: () => setActiveTab('allocations'), badge: 'View' },
                { id: 'a-al-2', name: 'Book Resource Slot', icon: Plus, action: () => setIsAllocating(true), badge: 'Book' },
                { id: 'a-al-3', name: 'Open Project Control', icon: Folder, action: () => onSwitchPortal && onSwitchPortal('project_management'), badge: 'Link' }
              ]
            }
          ]
        },
        {
          id: 'sub-maint',
          name: 'Preventive Maintenance',
          icon: Wrench,
          badge: 'PM',
          onLaunch: () => setActiveTab('maintenance'),
          subSubPortals: [
            {
              id: 'act-pm-1',
              name: 'Service & Costing',
              icon: Wrench,
              badge: 'PM',
              actions: [
                { id: 'a-pm-1', name: 'View Service Records', icon: Wrench, action: () => setActiveTab('maintenance'), badge: 'View' },
                { id: 'a-pm-2', name: 'Open Finance WIP Costing', icon: DollarSign, action: () => onSwitchPortal && onSwitchPortal('finance'), badge: 'Link' }
              ]
            }
          ]
        }
      ]
    }
  ];

  return (
    <div className="space-y-4">
      {/* Minimal White Header Bar */}
      <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Cpu className="w-5 h-5 text-orange-600" />
          <span className="text-sm font-black text-slate-900">Plant Machinery & Assets</span>
          <span className="px-2 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-200 text-[10px] font-bold">
            {machines.length} CNC • {workCenters.length} Bays • {tools.length} Tools
          </span>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 overflow-x-auto">
          {[
            { id: 'hub', label: 'Command Hub', icon: LayoutDashboard },
            { id: 'machines', label: `CNC (${machines.length})`, icon: Cpu },
            { id: 'work_centers', label: `Bays (${workCenters.length})`, icon: Settings },
            { id: 'tools', label: `Tools (${tools.length})`, icon: Gauge },
            { id: 'fleet', label: `Fleet (${vehicles.length})`, icon: Truck },
            { id: 'allocations', label: `Bookings (${allocations.length})`, icon: Calendar },
            { id: 'maintenance', label: `Service (${maintenance.length})`, icon: Wrench }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-white text-orange-600 shadow-2xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Cross-Portal Quick Links & Allocate Action */}
        <div className="flex items-center gap-1.5">
          {onSwitchPortal && (
            <>
              <button
                onClick={() => onSwitchPortal('project_management')}
                className="px-2 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 text-[10px] font-bold text-slate-700 flex items-center gap-1 cursor-pointer"
              >
                <Folder className="w-3 h-3 text-indigo-600" /> Projects
              </button>
              <button
                onClick={() => onSwitchPortal('shop_floor')}
                className="px-2 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 text-[10px] font-bold text-slate-700 flex items-center gap-1 cursor-pointer"
              >
                <Activity className="w-3 h-3 text-amber-600" /> Shop Floor
              </button>
              <button
                onClick={() => onSwitchPortal('hr')}
                className="px-2 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 text-[10px] font-bold text-slate-700 flex items-center gap-1 cursor-pointer"
              >
                <Users className="w-3 h-3 text-blue-600" /> Crew
              </button>
              <button
                onClick={() => onSwitchPortal('finance')}
                className="px-2 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 text-[10px] font-bold text-slate-700 flex items-center gap-1 cursor-pointer"
              >
                <DollarSign className="w-3 h-3 text-emerald-600" /> Finance
              </button>
            </>
          )}
          <button
            onClick={() => setIsAllocating(true)}
            className="px-2.5 py-1 text-[11px] font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-lg flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Allocate
          </button>
        </div>
      </div>

      {/* Command Hub View */}
      {activeTab === 'hub' && (
        <div className="space-y-4">
          <RoleScopedFactoryProjectHub
            portalName="Resource & Factory Procurement Chain Portal"
            defaultSubTab="procurement"
          />
          <PortalCommandCenterLanding
            portalTitle="Plant Machinery & Asset Hub"
            badgeLabel="Plant Hub"
            statusBadge={`${machines.length} CNC • ${workCenters.length} Bays`}
            quickActionGroups={quickActionGroups}
            primaryPortals={directoryPortals}
          />
        </div>
      )}

      {/* Tab: Machines (Single-Line Rows) */}
      {activeTab === 'machines' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900">CNC & Industrial Machinery ({machines.length})</span>
            <button
              onClick={() => setIsAddingMachine(true)}
              className="px-2.5 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" /> Add Machine
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase">
                  <th className="py-2 px-3">Code</th>
                  <th className="py-2 px-3">Machine Name</th>
                  <th className="py-2 px-3">Specification</th>
                  <th className="py-2 px-3">Serial</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3 text-right">Run Hours</th>
                  <th className="py-2 px-3 text-right">Utilization</th>
                  <th className="py-2 px-3">Calibration Due</th>
                  <th className="py-2 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {machines.map(m => {
                  const calExpired = new Date(m.nextCalibrationDue) < new Date();
                  return (
                    <tr key={m.id} className="hover:bg-slate-50 whitespace-nowrap">
                      <td className="py-2 px-3 font-mono font-bold text-slate-900">{m.machineCode}</td>
                      <td className="py-2 px-3 font-bold text-slate-900">{m.name}</td>
                      <td className="py-2 px-3 text-slate-600">{m.tonnageOrSpec}</td>
                      <td className="py-2 px-3 font-mono text-slate-500">{m.serialNumber}</td>
                      <td className="py-2 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {m.status}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-semibold text-slate-800">{m.totalOperatingHours} hrs</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-cyan-700">{m.utilizationRatePercent}%</td>
                      <td className="py-2 px-3">
                        <span className={`font-mono text-[11px] font-semibold ${calExpired ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {m.nextCalibrationDue} {calExpired && '(Locked)'}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right">
                        <button
                          onClick={() => {
                            setAllocType('Machine');
                            setAllocResName(m.name);
                            setIsAllocating(true);
                          }}
                          className="px-2 py-0.5 rounded bg-slate-100 hover:bg-orange-50 hover:text-orange-600 text-[10px] font-bold text-slate-700 cursor-pointer"
                        >
                          Allocate
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

      {/* Tab: Work Centers (Single-Line Rows) */}
      {activeTab === 'work_centers' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900">Plant Work Center Bays ({workCenters.length})</span>
            {onSwitchPortal && (
              <button
                onClick={() => onSwitchPortal('hr')}
                className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Users className="w-3 h-3" /> Assign Technicians in HR Portal
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase">
                  <th className="py-2 px-3">Bay Code</th>
                  <th className="py-2 px-3">Work Center Name</th>
                  <th className="py-2 px-3">Location</th>
                  <th className="py-2 px-3 text-right">Active Crew</th>
                  <th className="py-2 px-3 text-right">Daily Capacity</th>
                  <th className="py-2 px-3 text-right">Hourly Cost</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {workCenters.map(wc => (
                  <tr key={wc.id} className="hover:bg-slate-50 whitespace-nowrap">
                    <td className="py-2 px-3 font-mono font-bold text-cyan-700">{wc.code}</td>
                    <td className="py-2 px-3 font-bold text-slate-900">{wc.name}</td>
                    <td className="py-2 px-3 text-slate-600">{wc.location}</td>
                    <td className="py-2 px-3 text-right font-semibold text-slate-800">{wc.activeWorkers} Techs</td>
                    <td className="py-2 px-3 text-right font-mono text-slate-700">{wc.dailyCapacityHours} hrs/day</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-indigo-700">AED {wc.hourlyCostRate}/hr</td>
                    <td className="py-2 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {wc.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <button
                        onClick={() => {
                          setAllocType('WorkCenter');
                          setAllocResName(wc.name);
                          setIsAllocating(true);
                        }}
                        className="px-2 py-0.5 rounded bg-slate-100 hover:bg-orange-50 hover:text-orange-600 text-[10px] font-bold text-slate-700 cursor-pointer"
                      >
                        Book Bay
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Tools (Single-Line Rows) */}
      {activeTab === 'tools' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900">Precision Testing & Calibration Tools ({tools.length})</span>
            {onSwitchPortal && (
              <button
                onClick={() => onSwitchPortal('quality')}
                className="text-[11px] font-bold text-purple-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <ShieldCheck className="w-3 h-3" /> Link with QA/QC Inspections
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase">
                  <th className="py-2 px-3">Tool Code</th>
                  <th className="py-2 px-3">Tool Name</th>
                  <th className="py-2 px-3">Type</th>
                  <th className="py-2 px-3">Location</th>
                  <th className="py-2 px-3">Calibration Due</th>
                  <th className="py-2 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {tools.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50 whitespace-nowrap">
                    <td className="py-2 px-3 font-mono font-bold text-slate-900">{t.code}</td>
                    <td className="py-2 px-3 font-bold text-slate-900">{t.name}</td>
                    <td className="py-2 px-3 text-slate-600">{t.type}</td>
                    <td className="py-2 px-3 text-slate-600">{t.location}</td>
                    <td className="py-2 px-3 font-mono text-slate-700">{t.calibrationDueDate}</td>
                    <td className="py-2 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Fleet (Single-Line Rows) */}
      {activeTab === 'fleet' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900">Logistics & Transport Fleet ({vehicles.length})</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase">
                  <th className="py-2 px-3">Vehicle Code</th>
                  <th className="py-2 px-3">Plate No</th>
                  <th className="py-2 px-3">Model & Type</th>
                  <th className="py-2 px-3 text-right">Payload</th>
                  <th className="py-2 px-3">Driver</th>
                  <th className="py-2 px-3">Insurance Expiry</th>
                  <th className="py-2 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {vehicles.map(v => (
                  <tr key={v.id} className="hover:bg-slate-50 whitespace-nowrap">
                    <td className="py-2 px-3 font-mono font-bold text-slate-900">{v.vehicleCode}</td>
                    <td className="py-2 px-3 font-mono text-slate-700">{v.plateNumber}</td>
                    <td className="py-2 px-3 font-bold text-slate-900">{v.model} ({v.type})</td>
                    <td className="py-2 px-3 text-right font-mono font-semibold text-slate-800">{v.capacityTon} Tons</td>
                    <td className="py-2 px-3 text-slate-700">{v.assignedDriver}</td>
                    <td className="py-2 px-3 font-mono text-slate-600">{v.insuranceExpiry}</td>
                    <td className="py-2 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {v.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Allocations (Single-Line Rows) */}
      {activeTab === 'allocations' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900">Resource Allocation Bookings ({allocations.length})</span>
            <button
              onClick={() => setIsAllocating(true)}
              className="px-2.5 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" /> Book Resource
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase">
                  <th className="py-2 px-3">Resource</th>
                  <th className="py-2 px-3">Type</th>
                  <th className="py-2 px-3">Project Code</th>
                  <th className="py-2 px-3">Start Date</th>
                  <th className="py-2 px-3">End Date</th>
                  <th className="py-2 px-3 text-right">Booked Hours</th>
                  <th className="py-2 px-3 text-right">Load %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {allocations.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50 whitespace-nowrap">
                    <td className="py-2 px-3 font-bold text-slate-900">{a.resourceName}</td>
                    <td className="py-2 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-50 text-cyan-800 border border-cyan-200">
                        {a.resourceType}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-mono font-bold text-indigo-600">{a.projectCode}</td>
                    <td className="py-2 px-3 font-mono text-slate-600">{a.startDate}</td>
                    <td className="py-2 px-3 font-mono text-slate-600">{a.endDate}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">{a.allocatedHours} hrs</td>
                    <td className="py-2 px-3 text-right font-mono text-slate-700">{a.allocatedPercent}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Maintenance (Single-Line Rows) */}
      {activeTab === 'maintenance' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900">Preventive Maintenance & Calibration ({maintenance.length})</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase">
                  <th className="py-2 px-3">Asset</th>
                  <th className="py-2 px-3">Type</th>
                  <th className="py-2 px-3">Scheduled Date</th>
                  <th className="py-2 px-3">Technician</th>
                  <th className="py-2 px-3">Parts Replaced</th>
                  <th className="py-2 px-3 text-right">Cost (AED)</th>
                  <th className="py-2 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {maintenance.map(m => (
                  <tr key={m.id} className="hover:bg-slate-50 whitespace-nowrap">
                    <td className="py-2 px-3 font-bold text-slate-900">{m.resourceName}</td>
                    <td className="py-2 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        {m.maintenanceType}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-mono text-slate-700">{m.scheduledDate}</td>
                    <td className="py-2 px-3 text-slate-700">{m.technician}</td>
                    <td className="py-2 px-3 text-slate-600">{m.partsReplaced}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">{m.cost.toLocaleString()}</td>
                    <td className="py-2 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {m.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Allocate Modal */}
      {isAllocating && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 max-w-md w-full shadow-xl space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-sm font-bold text-slate-900">Allocate Plant Resource</h3>
              <button onClick={() => setIsAllocating(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="block text-slate-600 font-bold mb-1">Resource Type</label>
              <select
                value={allocType}
                onChange={e => setAllocType(e.target.value as any)}
                className="w-full p-2 border border-slate-300 rounded-lg bg-slate-50"
              >
                <option value="Machine">CNC Machine</option>
                <option value="WorkCenter">Work Center Bay</option>
                <option value="Tool">Precision Tool</option>
                <option value="Vehicle">Fleet Vehicle</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-600 font-bold mb-1">Resource Name</label>
              <input
                type="text"
                value={allocResName}
                onChange={e => setAllocResName(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Project Code</label>
                <input
                  type="text"
                  value={allocProjectCode}
                  onChange={e => setAllocProjectCode(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-bold mb-1">Hours</label>
                <input
                  type="number"
                  value={allocHours}
                  onChange={e => setAllocHours(Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsAllocating(false)}
                className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateAllocation}
                className="px-4 py-1.5 font-bold bg-orange-600 text-white rounded-lg hover:bg-orange-700 cursor-pointer"
              >
                Confirm Booking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Machine Modal */}
      {isAddingMachine && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 max-w-md w-full shadow-xl space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-sm font-bold text-slate-900">Register CNC / Plant Machine</h3>
              <button onClick={() => setIsAddingMachine(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Machine Code</label>
                <input
                  type="text"
                  placeholder="CNC-09"
                  value={newMachineCode}
                  onChange={e => setNewMachineCode(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-bold mb-1">Calibration Due</label>
                <input
                  type="date"
                  value={newMachineCalDate}
                  onChange={e => setNewMachineCalDate(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>
            <div>
              <label className="block text-slate-600 font-bold mb-1">Machine Name</label>
              <input
                type="text"
                placeholder="Mazak Integrex i-400"
                value={newMachineName}
                onChange={e => setNewMachineName(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-bold mb-1">Specification / Tonnage</label>
              <input
                type="text"
                placeholder="5-Axis Multi-Tasking CNC"
                value={newMachineSpec}
                onChange={e => setNewMachineSpec(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsAddingMachine(false)}
                className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMachine}
                className="px-4 py-1.5 font-bold bg-orange-600 text-white rounded-lg hover:bg-orange-700 cursor-pointer"
              >
                Save Machine
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
