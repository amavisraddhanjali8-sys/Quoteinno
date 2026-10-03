import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  Clock, 
  ExternalLink, 
  Search, 
  ArrowRight, 
  Download, 
  FileText 
} from 'lucide-react';
import { Project } from '../types';
import { cn } from '../lib/utils';
import { downloadCSV, downloadPDFTable } from '../services/dataExportService';

interface OngoingProjectsGanttProps {
  projects: Project[];
  onViewProject: (project: Project) => void;
  className?: string;
  compact?: boolean;
}

export interface ProjectTimelineMetrics {
  startDate: string;
  expectedCompletionDate: string;
  durationDays: number;
  progress: number;
  daysRemaining: number;
  isOverdue: boolean;
  jobCount: number;
  completedJobs: number;
}

export function getProjectTimelineMetrics(project: Project): ProjectTimelineMetrics {
  const startDateStr = project.startDate || new Date().toISOString().split('T')[0];
  
  let completionDateStr = '';
  let jobCount = 0;
  let completedJobs = 0;

  if (project.timeline?.jobs && project.timeline.jobs.length > 0) {
    jobCount = project.timeline.jobs.length;
    completedJobs = project.timeline.jobs.filter(j => j.status === 'Completed').length;
    const endDates = project.timeline.jobs.map(j => j.endDate).filter(Boolean);
    if (endDates.length > 0) {
      completionDateStr = [...endDates].sort().reverse()[0];
    }
  }
  
  if (!completionDateStr) {
    completionDateStr = (project as any).targetCompletionDate || (project as any).endDate || '';
  }
  
  // If still missing, derive a default duration based on total value or 45 days
  if (!completionDateStr) {
    const startObj = new Date(startDateStr);
    const addedDays = project.totalValue > 5000000 ? 60 : 35;
    const est = new Date(startObj.getTime() + addedDays * 24 * 60 * 60 * 1000);
    completionDateStr = est.toISOString().split('T')[0];
  }
  
  const startMs = new Date(startDateStr).getTime();
  const endMs = new Date(completionDateStr).getTime();
  const durationDays = Math.max(1, Math.round((endMs - startMs) / (1000 * 60 * 60 * 24)));
  
  const todayMs = new Date().getTime();
  const daysRemaining = Math.round((endMs - todayMs) / (1000 * 60 * 60 * 24));
  const isOverdue = todayMs > endMs && project.status !== 'Completed';
  
  let progress = 0;
  if (project.status === 'Completed') {
    progress = 100;
  } else if (project.timeline?.jobs && project.timeline.jobs.length > 0) {
    const totalProgress = project.timeline.jobs.reduce((sum, j) => sum + (j.progress || (j.status === 'Completed' ? 100 : 0)), 0);
    progress = Math.round(totalProgress / project.timeline.jobs.length);
  } else if (typeof (project as any).progress === 'number') {
    progress = (project as any).progress;
  } else {
    // Interpolate by elapsed time with bounds
    const elapsed = todayMs - startMs;
    const total = endMs - startMs;
    if (total > 0 && elapsed > 0) {
      progress = Math.max(15, Math.min(90, Math.round((elapsed / total) * 100)));
    } else {
      progress = 25;
    }
  }
  
  return {
    startDate: startDateStr,
    expectedCompletionDate: completionDateStr,
    durationDays,
    progress: Math.min(100, Math.max(0, progress)),
    daysRemaining,
    isOverdue,
    jobCount,
    completedJobs
  };
}

export const OngoingProjectsGantt: React.FC<OngoingProjectsGanttProps> = ({
  projects,
  onViewProject,
  className,
  compact = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'In Progress' | 'On Hold'>('All');
  const [hoveredProjectId, setHoveredProjectId] = useState<string | null>(null);

  // Filter only ongoing / active projects
  const ongoingProjects = useMemo(() => {
    return projects.filter(p => {
      const isOngoingStatus = p.status === 'In Progress' || p.status === 'On Hold' || !p.status || (p.status as string) === 'Ongoing';
      const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
      const matchesSearch = 
        p.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.client?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.client?.address || '').toLowerCase().includes(searchQuery.toLowerCase());

      return isOngoingStatus && matchesStatus && matchesSearch;
    });
  }, [projects, statusFilter, searchQuery]);

  // Compute global timeline bounds across all ongoing projects
  const timelineBounds = useMemo(() => {
    if (ongoingProjects.length === 0) {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 2, 0);
      return {
        minDate: start,
        maxDate: end,
        totalDays: 60,
        minMs: start.getTime(),
        maxMs: end.getTime()
      };
    }

    let minMs = Infinity;
    let maxMs = -Infinity;

    ongoingProjects.forEach(p => {
      const metrics = getProjectTimelineMetrics(p);
      const sMs = new Date(metrics.startDate).getTime();
      const eMs = new Date(metrics.expectedCompletionDate).getTime();
      if (!isNaN(sMs) && sMs < minMs) minMs = sMs;
      if (!isNaN(eMs) && eMs > maxMs) maxMs = eMs;
    });

    // Pad by 5 days on both sides for visual breathing room
    const paddingMs = 5 * 24 * 60 * 60 * 1000;
    minMs -= paddingMs;
    maxMs += paddingMs;

    // Ensure minimum span of 30 days
    if (maxMs - minMs < 30 * 24 * 60 * 60 * 1000) {
      maxMs = minMs + 30 * 24 * 60 * 60 * 1000;
    }

    const minDate = new Date(minMs);
    const maxDate = new Date(maxMs);
    const totalDays = Math.round((maxMs - minMs) / (1000 * 60 * 60 * 24));

    return {
      minDate,
      maxDate,
      totalDays,
      minMs,
      maxMs
    };
  }, [ongoingProjects]);

  // Generate calendar division markers (months or weeks)
  const timeMarkers = useMemo(() => {
    const markers: { label: string; sublabel: string; leftPercent: number }[] = [];
    const { minMs, maxMs } = timelineBounds;
    const totalMs = maxMs - minMs;
    if (totalMs <= 0) return markers;

    const current = new Date(minMs);
    current.setDate(1); // align to month

    while (current.getTime() <= maxMs + 15 * 24 * 60 * 60 * 1000) {
      const tMs = current.getTime();
      if (tMs >= minMs && tMs <= maxMs) {
        const leftPercent = ((tMs - minMs) / totalMs) * 100;
        markers.push({
          label: current.toLocaleString('default', { month: 'short' }),
          sublabel: current.getFullYear().toString(),
          leftPercent
        });
      }
      // advance one month
      current.setMonth(current.getMonth() + 1);
    }

    return markers;
  }, [timelineBounds]);

  // Today indicator line position
  const todayMarkerPercent = useMemo(() => {
    const todayMs = new Date().getTime();
    const { minMs, maxMs } = timelineBounds;
    if (todayMs < minMs || todayMs > maxMs) return null;
    return ((todayMs - minMs) / (maxMs - minMs)) * 100;
  }, [timelineBounds]);

  // Summary statistics for executive insight
  const stats = useMemo(() => {
    const total = ongoingProjects.length;
    let overdueCount = 0;
    let avgProgressSum = 0;

    ongoingProjects.forEach(p => {
      const m = getProjectTimelineMetrics(p);
      if (m.isOverdue) overdueCount++;
      avgProgressSum += m.progress;
    });

    const onTrackPct = total > 0 ? Math.round(((total - overdueCount) / total) * 100) : 100;
    const avgProgress = total > 0 ? Math.round(avgProgressSum / total) : 0;

    return {
      total,
      overdueCount,
      onTrackPct,
      avgProgress
    };
  }, [ongoingProjects]);

  // Export handlers
  const handleExportCSV = () => {
    const headers = [
      'Project Name', 
      'Client', 
      'Status', 
      'Start Date', 
      'Expected Completion Date', 
      'Duration (Days)', 
      'Progress (%)', 
      'Days Remaining', 
      'Health', 
      'Total Value (LKR)'
    ];

    const rows = ongoingProjects.map(p => {
      const m = getProjectTimelineMetrics(p);
      return [
        `"${p.projectName}"`,
        `"${p.client?.name || 'N/A'}"`,
        `"${p.status}"`,
        `"${m.startDate}"`,
        `"${m.expectedCompletionDate}"`,
        m.durationDays,
        `${m.progress}%`,
        m.daysRemaining,
        m.isOverdue ? '"Delayed"' : '"On Schedule"',
        p.totalValue || 0
      ];
    });

    downloadCSV(`ongoing-projects-gantt-${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
  };

  const handleExportPDF = () => {
    const headers = ['Project Name', 'Client', 'Start Date', 'Target Handover', 'Progress', 'Status'];
    const rows = ongoingProjects.map(p => {
      const m = getProjectTimelineMetrics(p);
      return [
        p.projectName,
        p.client?.name || 'N/A',
        m.startDate,
        m.expectedCompletionDate,
        `${m.progress}%`,
        m.isOverdue ? 'Delayed' : p.status
      ];
    });

    downloadPDFTable(
      'Ongoing Construction Projects Gantt Schedule',
      headers,
      rows,
      `ongoing-projects-schedule-${new Date().toISOString().split('T')[0]}.pdf`,
      'Linear timeline schedule tracking site fabrication, assembly, and planned client handover'
    );
  };

  return (
    <div className={cn("bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden flex flex-col", className)}>
      {/* Header bar */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-semibold text-slate-900 leading-tight">
              Ongoing Projects Gantt Timeline
            </h3>
            <span className="text-[11px] px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200/60 rounded-full font-medium">
              {ongoingProjects.length} Active Sites
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Linear schedule visualization showing project start dates, expected completion deadlines, and milestone completion.
          </p>
        </div>

        {/* Filter & Export controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search site or client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-7 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 w-40 sm:w-48 transition-colors"
            />
          </div>

          {/* Status selector */}
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-500 transition-colors"
          >
            <option value="All">All Statuses</option>
            <option value="In Progress">In Progress</option>
            <option value="On Hold">On Hold</option>
          </select>

          {/* Export buttons */}
          <div className="flex items-center gap-1 border-l border-slate-200 pl-2 ml-1">
            <button 
              onClick={handleExportCSV}
              className="px-2.5 py-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 text-xs font-medium flex items-center gap-1 transition-colors"
              title="Export Gantt Timeline as CSV"
            >
              <Download size={13} />
              <span>CSV</span>
            </button>
            <button 
              onClick={handleExportPDF}
              className="px-2.5 py-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 text-xs font-medium flex items-center gap-1 transition-colors"
              title="Export Gantt Schedule as PDF"
            >
              <FileText size={13} />
              <span>PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mini KPI Bar */}
      {!compact && (
        <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-slate-100 bg-slate-50/40 divide-x divide-slate-100">
          <div className="p-3 px-4">
            <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">Total In Progress</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-base font-bold text-slate-900">{stats.total}</span>
              <span className="text-[11px] text-slate-500">construction contracts</span>
            </div>
          </div>
          <div className="p-3 px-4">
            <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">Schedule Health</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-base font-bold text-emerald-600">{stats.onTrackPct}%</span>
              <span className="text-[11px] text-slate-500">on target</span>
            </div>
          </div>
          <div className="p-3 px-4">
            <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">Average Progress</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-base font-bold text-blue-600">{stats.avgProgress}%</span>
              <span className="text-[11px] text-slate-500">physical work completed</span>
            </div>
          </div>
          <div className="p-3 px-4">
            <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">Critical Delays</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className={cn("text-base font-bold", stats.overdueCount > 0 ? "text-rose-600" : "text-slate-700")}>
                {stats.overdueCount}
              </span>
              <span className="text-[11px] text-slate-500">{stats.overdueCount === 0 ? 'No slippages' : 'exceeded target'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Gantt Timeline Container */}
      <div className="flex-1 overflow-x-auto">
        <div className="min-w-[840px] p-4 sm:p-5">
          {/* Calendar Axis Header */}
          <div className="grid grid-cols-12 gap-3 mb-3 text-xs font-semibold text-slate-400 border-b border-slate-100 pb-2">
            <div className="col-span-4 sm:col-span-3">Project & Client Info</div>
            <div className="col-span-8 sm:col-span-9 relative">
              <div className="flex justify-between items-center text-[11px] text-slate-500 pr-2">
                <span>Start Window: {timelineBounds.minDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                <div className="flex items-center gap-1.5 font-medium text-slate-700">
                  <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
                  <span>Linear Timeline ({timelineBounds.totalDays} Days Horizon)</span>
                </div>
                <span>End Window: {timelineBounds.maxDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>

              {/* Month dividers banner */}
              <div className="relative h-5 mt-1 border-t border-slate-200/70">
                {timeMarkers.map((marker, idx) => (
                  <div 
                    key={idx}
                    className="absolute top-0 flex items-center gap-1 text-[10px] font-bold text-slate-400 pl-1 border-l border-slate-200 h-full"
                    style={{ left: `${marker.leftPercent}%` }}
                  >
                    <span>{marker.label}</span>
                    <span className="text-[9px] font-normal text-slate-300">{marker.sublabel}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Project Gantt Rows */}
          <div className="space-y-3 relative">
            {/* Today vertical guideline */}
            {todayMarkerPercent !== null && (
              <div 
                className="absolute top-0 bottom-0 z-10 pointer-events-none flex flex-col items-center"
                style={{ left: `calc(25% + (75% * ${todayMarkerPercent / 100}))` }}
              >
                <span className="text-[9px] font-bold bg-amber-500 text-white px-1.5 py-0.5 rounded shadow-xs mb-0.5 -translate-x-1/2">
                  Today
                </span>
                <div className="w-[1.5px] h-full bg-amber-400/80 border-dashed border-amber-500"></div>
              </div>
            )}

            {ongoingProjects.map((project) => {
              const metrics = getProjectTimelineMetrics(project);
              const { minMs, maxMs } = timelineBounds;
              const totalMs = maxMs - minMs;

              const pStartMs = new Date(metrics.startDate).getTime();
              const pEndMs = new Date(metrics.expectedCompletionDate).getTime();

              const leftPercent = Math.max(0, Math.min(92, ((pStartMs - minMs) / totalMs) * 100));
              const rightPercent = Math.max(leftPercent + 6, Math.min(100, ((pEndMs - minMs) / totalMs) * 100));
              const widthPercent = Math.max(8, rightPercent - leftPercent);

              const isHovered = hoveredProjectId === project.id;

              return (
                <div 
                  key={project.id}
                  onMouseEnter={() => setHoveredProjectId(project.id)}
                  onMouseLeave={() => setHoveredProjectId(null)}
                  className={cn(
                    "grid grid-cols-12 gap-3 items-center p-2.5 rounded-xl border transition-all duration-150",
                    isHovered 
                      ? "bg-blue-50/30 border-blue-200 shadow-2xs" 
                      : "bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/50"
                  )}
                >
                  {/* Left Column: Project Details */}
                  <div className="col-span-4 sm:col-span-3 pr-2">
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="min-w-0">
                        <button 
                          onClick={() => onViewProject(project)}
                          className="text-xs font-bold text-slate-900 truncate block text-left hover:text-blue-600 transition-colors"
                          title={project.projectName}
                        >
                          {project.projectName}
                        </button>
                        <p className="text-[11px] text-slate-500 truncate font-medium mt-0.5">
                          {project.client?.name || 'Direct Client'}
                        </p>
                      </div>

                      <button 
                        onClick={() => onViewProject(project)}
                        className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all shrink-0"
                        title="Open Project Details"
                      >
                        <ExternalLink size={12} />
                      </button>
                    </div>

                    {/* Date pill tags */}
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap text-[10px]">
                      <span className="inline-flex items-center gap-1 font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        <Calendar size={10} className="text-slate-400" />
                        {metrics.startDate}
                      </span>
                      <ArrowRight size={10} className="text-slate-300" />
                      <span className={cn(
                        "inline-flex items-center gap-1 font-mono px-1.5 py-0.5 rounded font-medium",
                        metrics.isOverdue 
                          ? "bg-rose-50 text-rose-700 border border-rose-200/70" 
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                      )}>
                        <Clock size={10} />
                        {metrics.expectedCompletionDate}
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Linear Timeline Bar */}
                  <div className="col-span-8 sm:col-span-9 relative h-12 flex items-center bg-slate-50/50 rounded-lg p-1 border border-slate-100">
                    {/* Background subtle grid guide lines */}
                    {timeMarkers.map((marker, idx) => (
                      <div 
                        key={`grid-${idx}`} 
                        className="absolute top-0 bottom-0 border-l border-slate-200/40 pointer-events-none"
                        style={{ left: `${marker.leftPercent}%` }}
                      />
                    ))}

                    {/* The Linear Gantt Bar */}
                    <div 
                      className={cn(
                        "absolute h-9 rounded-lg shadow-2xs border flex items-center px-2.5 transition-all duration-300 cursor-pointer overflow-hidden group",
                        metrics.isOverdue 
                          ? "bg-gradient-to-r from-rose-50 to-rose-100 border-rose-300 text-rose-950" 
                          : project.status === 'On Hold'
                          ? "bg-gradient-to-r from-amber-50 to-amber-100 border-amber-300 text-amber-950"
                          : "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-blue-950"
                      )}
                      style={{ 
                        left: `${leftPercent}%`, 
                        width: `${widthPercent}%`,
                        minWidth: '130px'
                      }}
                      onClick={() => onViewProject(project)}
                    >
                      {/* Inner Progress Fill Overlay */}
                      <div 
                        className={cn(
                          "absolute left-0 top-0 bottom-0 opacity-25 rounded-l-lg transition-all duration-500",
                          metrics.isOverdue 
                            ? "bg-rose-600" 
                            : project.status === 'On Hold'
                            ? "bg-amber-600"
                            : "bg-blue-600"
                        )}
                        style={{ width: `${metrics.progress}%` }}
                      />

                      {/* Bar Content: Start & Expected Completion dates + Progress */}
                      <div className="relative z-10 w-full flex items-center justify-between gap-1 text-[11px] font-medium leading-none">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className={cn(
                            "w-1.5 h-1.5 rounded-full shrink-0",
                            metrics.isOverdue ? "bg-rose-500" : "bg-blue-600"
                          )}/>
                          <span className="font-semibold text-slate-800 truncate">
                            {metrics.progress}%
                          </span>
                          <span className="hidden sm:inline text-[10px] text-slate-500">
                            • {metrics.durationDays}d
                          </span>
                        </div>

                        <div className="flex items-center gap-1 text-[10px] font-mono shrink-0">
                          {metrics.isOverdue ? (
                            <span className="text-rose-700 font-bold bg-rose-100/80 px-1 rounded">
                              Overdue
                            </span>
                          ) : (
                            <span className="text-slate-600 bg-white/80 px-1.5 py-0.5 rounded border border-slate-200/60 shadow-2xs font-bold">
                              Due {metrics.expectedCompletionDate.slice(5)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {ongoingProjects.length === 0 && (
              <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
                <Calendar size={24} className="mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-semibold text-slate-700">No active ongoing projects match the filter</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Try clearing the search query or adjusting status filter.</p>
              </div>
            )}
          </div>

          {/* Timeline Footer Legend */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-blue-100 border border-blue-300"></div>
                <span className="text-[11px]">In Progress / Normal</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-amber-100 border border-amber-300"></div>
                <span className="text-[11px]">On Hold / Review</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-rose-100 border border-rose-300"></div>
                <span className="text-[11px]">Schedule Slippage / Overdue</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400">
              * Bars represent linear duration from start date to expected completion date with physical completion overlay.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
