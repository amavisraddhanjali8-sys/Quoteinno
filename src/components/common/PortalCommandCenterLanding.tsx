import React, { useState, useMemo } from 'react';
import {
  Search,
  ArrowRight,
  Check,
  Layout,
  FolderTree,
  LucideIcon
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useSecurity } from '../../context/SecurityContext';

export interface CommandAction {
  id: string;
  name: string;
  badge?: string;
  icon?: LucideIcon | React.ComponentType<{ size?: number; className?: string }>;
  action: () => void;
  permissionCode?: string;
}

export interface CommandSubSubPortal {
  id: string;
  name: string;
  badge?: string;
  icon?: LucideIcon | React.ComponentType<{ size?: number; className?: string }>;
  permissionCode?: string;
  actions: CommandAction[];
}

export interface CommandSubPortal {
  id: string;
  name: string;
  icon: LucideIcon | React.ComponentType<{ size?: number; className?: string }>;
  badge?: string;
  permissionCode?: string;
  targetTab?: string;
  onLaunch?: () => void;
  subSubPortals: CommandSubSubPortal[];
}

export interface CommandPrimaryPortal {
  id: string;
  name: string;
  shortLabel: string;
  icon: LucideIcon | React.ComponentType<{ size?: number; className?: string }>;
  badge?: string | number;
  targetTab?: string;
  onLaunch?: () => void;
  subPortals: CommandSubPortal[];
}

export interface QuickActionItem {
  id: string;
  label: string;
  icon: LucideIcon | React.ComponentType<{ size?: number; className?: string }>;
  action: () => void;
  permission?: string;
  color: string;
}

export interface QuickActionGroup {
  portalId: string;
  portalName: string;
  portalIcon: LucideIcon | React.ComponentType<{ size?: number; className?: string }>;
  actions: QuickActionItem[];
}

export interface PortalCommandCenterLandingProps {
  portalTitle: string;
  badgeLabel?: string;
  statusBadge?: string;
  headerControls?: React.ReactNode;
  quickActionGroups: QuickActionGroup[];
  primaryPortals: CommandPrimaryPortal[];
  onLaunchPortal?: (portal: CommandPrimaryPortal, subPortal?: CommandSubPortal) => void;
  searchPlaceholder?: string;
}

export const PortalCommandCenterLanding: React.FC<PortalCommandCenterLandingProps> = ({
  portalTitle,
  badgeLabel = 'Operations Hub',
  statusBadge = 'RBAC Active',
  headerControls,
  quickActionGroups,
  primaryPortals,
  onLaunchPortal,
  searchPlaceholder = 'Search portals, modules & actions...'
}) => {
  const { currentUser } = useSecurity();

  const [selectedPrimaryIndex, setSelectedPrimaryIndex] = useState<number>(0);
  const [selectedSubIndex, setSelectedSubIndex] = useState<number>(0);
  const [selectedSubSubIndex, setSelectedSubSubIndex] = useState<number>(0);
  const [globalSearch, setGlobalSearch] = useState<string>('');
  const [directoryFilter, setDirectoryFilter] = useState<string>('');

  const activePrimary = primaryPortals[selectedPrimaryIndex] || primaryPortals[0];
  const activeSubPortals = activePrimary?.subPortals || [];
  const activeSubPortal = activeSubPortals[selectedSubIndex] || activeSubPortals[0];
  const activeSubSubPortals = activeSubPortal?.subSubPortals || [];
  const activeSubSub = activeSubSubPortals[selectedSubSubIndex] || activeSubSubPortals[0];
  const activeActions = activeSubSub?.actions || [];

  const totalQuickActions = useMemo(() => {
    return quickActionGroups.reduce((acc, g) => acc + g.actions.length, 0);
  }, [quickActionGroups]);

  const filterMatches = (text: string) => {
    const q = (directoryFilter || globalSearch).trim().toLowerCase();
    if (!q) return true;
    return text.toLowerCase().includes(q);
  };

  const handleLaunch = () => {
    if (activeSubPortal?.onLaunch) {
      activeSubPortal.onLaunch();
    } else if (activePrimary?.onLaunch) {
      activePrimary.onLaunch();
    } else if (onLaunchPortal) {
      onLaunchPortal(activePrimary, activeSubPortal);
    }
  };

  return (
    <div className="space-y-3 pb-8 font-sans text-slate-800">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER BAR (MATCHING UPLOADED IMAGE)                               */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h1 className="text-base font-bold text-slate-900 tracking-tight">
            {portalTitle}
          </h1>
          {badgeLabel && (
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-orange-50 border border-orange-200 text-orange-700 font-semibold font-mono">
              {badgeLabel}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {headerControls}

          <div className="relative w-full sm:w-60">
            <Search size={13} className="text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="w-full pl-7 pr-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-orange-500 transition-all"
            />
          </div>

          <div className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-slate-800">{currentUser?.fullName || 'Alexander Vance'}</span>
            <span className="text-slate-400">·</span>
            <span className="text-orange-600 font-medium">
              {currentUser?.roleName || 'Super Admin'}
            </span>
          </div>

          {statusBadge && (
            <div className="px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
              {statusBadge}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. QUICK ACTIONS BY PORTAL (6-CARD 3x2 GRID MATCHING UPLOADED IMAGE)      */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-1 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Quick Actions by Portal
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono font-medium">
              {quickActionGroups.length} Portals • {totalQuickActions} Actions
            </span>
          </div>
          <span className="text-[10px] text-slate-400">Divided under portal names for one-click access</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {quickActionGroups.map(group => {
            const GroupIcon = group.portalIcon;
            return (
              <div
                key={group.portalId}
                className="bg-slate-50/70 border border-slate-200/90 rounded-xl p-2.5 flex flex-col justify-between hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-200/70">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <GroupIcon size={13} className="text-orange-500" />
                    <span>{group.portalName}</span>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-white text-slate-500 border border-slate-200 font-mono font-semibold">
                    {group.actions.length}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {group.actions
                    .filter(qa => !globalSearch.trim() || qa.label.toLowerCase().includes(globalSearch.toLowerCase()))
                    .map(qa => {
                      const Icon = qa.icon;
                      return (
                        <button
                          key={qa.id}
                          type="button"
                          onClick={qa.action}
                          className={cn(
                            "px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95",
                            qa.color
                          )}
                          title={qa.label}
                        >
                          <Icon size={12} className="shrink-0" />
                          <span className="truncate">{qa.label}</span>
                        </button>
                      );
                    })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. UNIVERSAL PORTAL DIRECTORY & COMPLETE 4-COLUMN HIERARCHY               */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col">
        {/* Explorer Header */}
        <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <Layout size={16} className="text-orange-500" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Universal Portal Directory
            </h2>
            <span className="text-[10px] px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md font-mono font-semibold">
              {primaryPortals.length} Portals • All Navbar Modules
            </span>
          </div>

          <div className="relative w-full sm:w-64">
            <Search size={13} className="text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter directory actions..."
              value={directoryFilter}
              onChange={(e) => setDirectoryFilter(e.target.value)}
              className="w-full pl-7 pr-3 py-1 bg-white border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:border-orange-500 transition-all"
            />
          </div>
        </div>

        {/* 4-Column Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-200 min-h-[460px]">
          {/* COLUMN 1: PRIMARY PORTALS */}
          <div className="p-2.5 bg-slate-50/40 flex flex-col">
            <div className="h-6 px-1.5 border-b border-slate-200 flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Primary Portals</span>
              <span className="text-[10px] font-mono text-slate-400">{primaryPortals.length}</span>
            </div>

            <div className="space-y-1 overflow-y-auto custom-scrollbar flex-1 max-h-[420px]">
              {primaryPortals.map((p, idx) => {
                const Icon = p.icon;
                const isSelected = selectedPrimaryIndex === idx;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSelectedPrimaryIndex(idx);
                      setSelectedSubIndex(0);
                      setSelectedSubSubIndex(0);
                    }}
                    className={cn(
                      "w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between gap-2 transition-all cursor-pointer font-medium",
                      isSelected
                        ? "bg-white text-orange-600 font-bold shadow-xs border border-slate-200"
                        : "text-slate-700 hover:bg-white hover:text-slate-900 border border-transparent"
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <Icon size={14} className={isSelected ? "text-orange-500" : "text-slate-400"} />
                      <span className="truncate">{p.shortLabel}</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 text-slate-600 font-mono">
                        {p.subPortals.length}
                      </span>
                      <ArrowRight size={11} className={isSelected ? "text-orange-500" : "text-slate-300"} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* COLUMN 2: SUB-PORTALS */}
          <div className="p-2.5 bg-white flex flex-col">
            <div className="h-6 px-1.5 border-b border-slate-200 flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
                {activePrimary?.shortLabel || 'Sub-Portals'}
              </span>
              <span className="text-[10px] font-mono text-slate-400">{activeSubPortals.length}</span>
            </div>

            <div className="space-y-1 overflow-y-auto custom-scrollbar flex-1 max-h-[420px]">
              {activeSubPortals.length === 0 ? (
                <div className="text-center py-12 text-xs text-slate-400">
                  No sub-portals available.
                </div>
              ) : (
                activeSubPortals.map((sub, idx) => {
                  const SubIcon = sub.icon;
                  const isSelected = selectedSubIndex === idx;
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => {
                        setSelectedSubIndex(idx);
                        setSelectedSubSubIndex(0);
                      }}
                      className={cn(
                        "w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between gap-2 transition-all cursor-pointer font-medium",
                        isSelected
                          ? "bg-orange-50 text-orange-700 font-bold border border-orange-200"
                          : "text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-transparent"
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <SubIcon size={14} className={isSelected ? "text-orange-600" : "text-slate-400"} />
                        <span className="truncate">{sub.name}</span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {sub.badge && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-semibold uppercase">
                            {sub.badge}
                          </span>
                        )}
                        <ArrowRight size={11} className={isSelected ? "text-orange-600" : "text-slate-300"} />
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* COLUMN 3: SUB-PORTALS OF SUB-PORTAL */}
          <div className="p-2.5 bg-slate-50/25 flex flex-col">
            <div className="h-6 px-1.5 border-b border-slate-200 flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
                Sub-Portals of Sub-Portal
              </span>
              <span className="text-[10px] font-mono text-slate-400">{activeSubSubPortals.length}</span>
            </div>

            <div className="space-y-1 overflow-y-auto custom-scrollbar flex-1 max-h-[420px]">
              {activeSubSubPortals.length === 0 ? (
                <div className="text-center py-12 text-xs text-slate-400">
                  Select a sub-portal.
                </div>
              ) : (
                activeSubSubPortals.map((ssp, idx) => {
                  const SspIcon = ssp.icon || activeSubPortal?.icon || FolderTree;
                  const isSelected = selectedSubSubIndex === idx;
                  return (
                    <button
                      key={ssp.id}
                      type="button"
                      onClick={() => setSelectedSubSubIndex(idx)}
                      className={cn(
                        "w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between gap-2 transition-all cursor-pointer font-medium",
                        isSelected
                          ? "bg-white text-orange-950 font-bold border border-orange-300 shadow-2xs"
                          : "text-slate-700 hover:bg-white hover:text-slate-900 border border-slate-100"
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <SspIcon size={13} className={isSelected ? "text-orange-500" : "text-slate-400"} />
                        <span className="truncate">{ssp.name}</span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 font-mono">
                          {ssp.actions.length} acts
                        </span>
                        <ArrowRight size={10} className={isSelected ? "text-orange-500" : "text-slate-300"} />
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* COLUMN 4: EVERY ACTION & LAUNCH PORTAL BUTTON */}
          <div className="p-3 bg-white flex flex-col justify-between">
            <div className="flex-1 flex flex-col">
              <div className="h-6 px-1.5 border-b border-slate-200 flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Every Action ({activeActions.length})
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Direct Execute</span>
              </div>

              <div className="space-y-1.5 overflow-y-auto custom-scrollbar flex-1 max-h-[350px]">
                {activeActions.length === 0 ? (
                  <div className="text-center py-12 text-xs text-slate-400">
                    No actions available.
                  </div>
                ) : (
                  activeActions
                    .filter(act => filterMatches(act.name))
                    .map(act => (
                      <div
                        key={act.id}
                        className="px-2.5 py-2 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-orange-50/40 hover:border-orange-200 transition-all flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <Check size={12} className="text-orange-600 shrink-0" />
                          <span className="text-xs font-semibold text-slate-800 truncate">{act.name}</span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {act.badge && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-600 font-mono font-medium">
                              {act.badge}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={act.action}
                            className="text-[10px] px-2.5 py-0.5 bg-orange-600 hover:bg-orange-700 text-white rounded font-semibold transition-colors cursor-pointer shadow-2xs"
                          >
                            Open
                          </button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>

            {/* Launch Portal Direct Button */}
            {activePrimary && (
              <div className="pt-2.5 border-t border-slate-100 mt-2">
                <button
                  type="button"
                  onClick={handleLaunch}
                  className="w-full py-2 px-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs rounded-lg shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>Launch Portal</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
